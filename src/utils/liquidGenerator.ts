import type { ExtractedVariable, FormData, ProcessingResult, TemplateSection } from '../types';
import { extractVariables } from './variableExtractor';
import { matchVariables } from './valueMatcher';
import { convertAllNames } from './nameConverter';
import { buildWithButtonSections, buildWithoutButtonSections } from '../constants/brazeTemplates';

type Protocol = 'https' | 'http' | 'empty';

function detectProtocol(urlVariable: string): Protocol {
  const trimmed = urlVariable.trim();
  if (trimmed === '') return 'empty';
  if (trimmed.startsWith('http://')) return 'http';
  return 'https';
}

function stripProtocolAndWww(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
}

function generateLinkNoProto(urlVariable: string, utm: string): string {
  const trimmedUrl = urlVariable.trim();
  const trimmedUtm = utm.trim();

  if (trimmedUrl === 'https://' || trimmedUrl === 'http://') {
    return stripProtocolAndWww(trimmedUtm);
  }

  const combined = trimmedUrl + trimmedUtm;
  return stripProtocolAndWww(combined);
}

function generateVariableDefinitions(
  variables: ExtractedVariable[],
  formData: FormData,
): string {
  // 변수 assign 문 생성
  const assignLines = variables.map(
    (v) => `{%- assign ${v.englishName} = '${v.matchedValue}' -%}`,
  );

  // 버튼 O일 때 link_no_proto를 변수 정의 마지막에 추가
  if (formData.templateType === 'with_button') {
    const protocol = detectProtocol(formData.urlVariable);
    if (protocol !== 'empty') {
      const linkNoProto = generateLinkNoProto(formData.urlVariable, formData.utm);
      assignLines.push(`{%- assign link_no_proto = '${linkNoProto}' -%}`);
    }
  }

  return assignLines.join('\n');
}

function generateButtonBlock(
  buttonName: string,
  urlVariable: string,
): string {
  const protocol = detectProtocol(urlVariable);
  const lines: string[] = [];

  lines.push(`{%- assign at_button_name = '${buttonName}' -%}`);

  if (protocol === 'https') {
    lines.push(`{%- assign at_button_url_pc = 'https://' | append: link_no_proto -%}`);
    lines.push(`{%- assign at_button_url_mobile = 'https://' | append: link_no_proto -%}`);
  } else if (protocol === 'http') {
    lines.push(`{%- assign at_button_url_pc = 'http://' | append: link_no_proto -%}`);
    lines.push(`{%- assign at_button_url_mobile = 'http://' | append: link_no_proto -%}`);
  } else {
    lines.push(`{%- assign at_button_url_pc = {{link_no_proto}} -%}`);
    lines.push(`{%- assign at_button_url_mobile = {{link_no_proto}} -%}`);
  }

  return lines.join('\n');
}

function generateCaptureBlock(
  templateText: string,
  variables: ExtractedVariable[],
): string {
  let body = templateText.replace(/\r\n/g, '\n').trim();

  for (const v of variables) {
    const pattern = `#{${v.koreanName}}`;
    body = body.split(pattern).join(`{{ ${v.englishName} }}`);
  }

  return `{%- capture at_message_body -%}\n${body}\n{%- endcapture -%}`;
}

/**
 * 메인 변환 함수: 입력 폼 데이터 → 최종 Liquid 결과
 */
export function processTemplate(
  formData: FormData,
  variableOverrides?: ExtractedVariable[],
): ProcessingResult {
  const extracted = extractVariables(formData.templateText);
  const valueMap = matchVariables(formData.templateText, formData.sendingText);
  const nameMap = convertAllNames(extracted.map((v) => v.name));

  let variables: ExtractedVariable[] = extracted.map((v) => {
    const nameInfo = nameMap.get(v.name)!;
    return {
      koreanName: v.name,
      originalPattern: v.pattern,
      matchedValue: valueMap.get(v.name) || '',
      englishName: nameInfo.englishName,
      isAutoNamed: nameInfo.isAutoNamed,
    };
  });

  if (variableOverrides) {
    variables = variableOverrides;
  }

  // 변수 정의 블록 (assign 문들 + link_no_proto)
  const variableDefs = generateVariableDefinitions(variables, formData);

  // 메시지 본문 블록 (capture만)
  const captureBlock = generateCaptureBlock(formData.templateText, variables);

  let sections: TemplateSection[];

  if (formData.templateType === 'with_button') {
    const buttonBlock = generateButtonBlock(
      formData.buttonName,
      formData.urlVariable,
    );

    sections = buildWithButtonSections({
      talkType: formData.talkType,
      messageType: formData.messageType,
      templateCode: formData.templateCode,
      variableDefs,
      captureBlock,
      buttonBlock,
    });
  } else {
    sections = buildWithoutButtonSections({
      talkType: formData.talkType,
      messageType: formData.messageType,
      templateCode: formData.templateCode,
      variableDefs,
      captureBlock,
    });
  }

  const liquidCode = sections.map((s) => s.content).join('\n');

  return {
    variables,
    liquidCode,
    sections,
  };
}
