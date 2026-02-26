import type { DiagnosisResult, ErrorType, ChangeDetail } from '../types';

interface ParsedError {
  token: string;
  position: number | null;
}

/**
 * Braze/비즈뿌리오 에러 메시지를 파싱하여 문제 토큰과 위치를 추출
 */
export function parseError(errorMessage: string): ParsedError | null {
  // JSON 형태로 감싸진 경우 description 추출
  let description = errorMessage;
  try {
    const parsed = JSON.parse(errorMessage);
    if (parsed.description) {
      description = parsed.description;
    }
  } catch {
    // JSON이 아닌 경우 원본 문자열 사용
  }

  // "Unexpected token X in JSON at position N" 패턴
  const tokenMatch = description.match(
    /Unexpected token\s+(\\?.)\s+in JSON at position\s+(\d+)/,
  );
  if (tokenMatch) {
    return {
      token: tokenMatch[1],
      position: parseInt(tokenMatch[2], 10),
    };
  }

  // "Unexpected end of JSON input" 패턴
  if (/Unexpected end of JSON/i.test(description)) {
    return {
      token: 'EOF',
      position: null,
    };
  }

  // "Unexpected token X" (위치 없음)
  const simpleMatch = description.match(/Unexpected token\s+(\\?.)/);
  if (simpleMatch) {
    return {
      token: simpleMatch[1],
      position: null,
    };
  }

  // API 오류 패턴: "The to field is required" 등
  if (/The to field is required/i.test(description)) {
    return { token: 'API_TO_REQUIRED', position: null };
  }

  return null;
}

/**
 * 토큰에 따른 에러 유형 결정
 */
function classifyError(token: string): ErrorType {
  switch (token) {
    case '\\t':
    case '\t':
      return 'tab';
    case '\\n':
    case '\n':
    case '\\r':
    case '\r':
      return 'newline';
    case '"':
      return 'quote';
    case "'":
      return 'single_quote';
    case '\\':
      return 'backslash';
    case 'EOF':
      return 'structure';
    case 'API_TO_REQUIRED':
      return 'api_error';
    default:
      return 'unknown';
  }
}

/**
 * 에러 유형별 한글 진단 메시지
 */
function getDiagnosisMessages(errorType: ErrorType): {
  description: string;
  cause: string;
  fixApplied: string;
} {
  switch (errorType) {
    case 'tab':
      return {
        description: '탭(Tab) 문자가 발견되었습니다',
        cause: '복사/붙여넣기 과정에서 탭 문자가 혼입되었을 수 있습니다. 주로 버튼명, 템플릿 코드, 또는 변수값에 탭이 포함됩니다.',
        fixApplied: '모든 탭 문자를 공백으로 자동 치환했습니다.',
      };
    case 'newline':
      return {
        description: '줄바꿈 문자가 잘못된 위치에 있습니다',
        cause: '버튼명, 템플릿 코드 등 한 줄 필드에 줄바꿈이 포함되었습니다.',
        fixApplied: 'assign 값의 줄바꿈을 제거하고, 버튼명에 json_escape 필터를 추가했습니다.',
      };
    case 'quote':
      return {
        description: '큰따옴표(")가 이스케이프되지 않았습니다',
        cause: '변수값이나 버튼명에 큰따옴표가 포함되어 JSON 구조가 깨졌습니다.',
        fixApplied: '버튼명에 json_escape 필터를 추가하고, 변수값의 큰따옴표를 이스케이프 처리했습니다.',
      };
    case 'single_quote':
      return {
        description: "작은따옴표(')가 Liquid 문법을 깨뜨렸습니다",
        cause: "변수값에 작은따옴표(')가 포함되어 Liquid assign 문법이 깨졌습니다. 예: {%- assign x = '값'이 문제' -%}",
        fixApplied: "변수값 내 작은따옴표를 \\' 로 이스케이프 처리했습니다.",
      };
    case 'backslash':
      return {
        description: '백슬래시(\\)가 이스케이프되지 않았습니다',
        cause: '변수값에 백슬래시가 포함되어 JSON에서 잘못된 이스케이프 시퀀스로 해석됩니다.',
        fixApplied: '백슬래시를 이중 이스케이프(\\\\) 처리했습니다.',
      };
    case 'api_error':
      return {
        description: '수신번호(to) 필드가 누락되었습니다',
        cause: 'Braze에서 비즈뿌리오로 발송 시 수신번호가 전달되지 않았습니다. Braze 캠페인/캔버스의 수신번호 설정을 확인해주세요.',
        fixApplied: 'Liquid 코드 문제가 아닌 Braze 설정 문제입니다. 수신번호 필드 매핑을 확인해주세요.',
      };
    case 'structure':
      return {
        description: 'JSON 구조가 불완전합니다',
        cause: '템플릿의 JSON 바디가 중간에 잘렸거나 구조적 문제가 있습니다. 복사 시 일부가 누락되었을 수 있습니다.',
        fixApplied: '템플릿을 다시 한번 전체 복사해주세요. 자동 수정이 어려운 구조적 문제입니다.',
      };
    default:
      return {
        description: '알 수 없는 JSON 파싱 오류입니다',
        cause: '예상하지 못한 문자가 JSON 구조를 깨뜨렸습니다.',
        fixApplied: '일반적인 특수문자 정리를 시도했습니다.',
      };
  }
}

// 문제 문자의 한글 표시명
function getCharDisplayName(errorType: ErrorType): string {
  switch (errorType) {
    case 'tab': return '탭 문자';
    case 'newline': return '줄바꿈 문자';
    case 'quote': return '큰따옴표(")';
    case 'single_quote': return "작은따옴표(')";
    case 'backslash': return '백슬래시(\\)';
    default: return '특수문자';
  }
}

// 수정 방법의 한글 표시
function getFixDescription(errorType: ErrorType): string {
  switch (errorType) {
    case 'tab': return '공백으로 치환';
    case 'newline': return '줄바꿈 제거';
    case 'quote': return '\\"로 이스케이프';
    case 'single_quote': return "\\'로 이스케이프";
    case 'backslash': return '\\\\로 이중 이스케이프';
    default: return '특수문자 정리';
  }
}

/**
 * assign 값 내 문제 문자 치환 + 변경 내역 추적
 */
function fixAssignValues(
  code: string,
  errorType: ErrorType,
  changes: ChangeDetail[],
): string {
  const charName = getCharDisplayName(errorType);
  const fixDesc = getFixDescription(errorType);

  return code.replace(
    /(\{%-\s*assign\s+(\w+)\s*=\s*')([^']*?)('\s*-%\})/g,
    (_match, prefix: string, varName: string, value: string, suffix: string) => {
      let fixed = value;
      let count = 0;

      switch (errorType) {
        case 'tab':
          count = (value.match(/\t/g) || []).length;
          fixed = fixed.replace(/\t/g, ' ');
          break;
        case 'newline':
          count = (value.match(/[\r\n]/g) || []).length;
          fixed = fixed.replace(/[\r\n]/g, '');
          break;
        case 'quote':
          count = (value.match(/"/g) || []).length;
          fixed = fixed.replace(/"/g, '\\"');
          break;
        case 'single_quote':
          count = (value.match(/'/g) || []).length;
          fixed = fixed.replace(/'/g, "\\'");
          break;
        case 'backslash':
          count = (value.match(/\\/g) || []).length;
          fixed = fixed.replace(/\\/g, '\\\\');
          break;
        case 'unknown':
          count = (value.match(/[\t\r\n]/g) || []).length;
          fixed = fixed.replace(/\t/g, ' ');
          fixed = fixed.replace(/[\r\n]/g, '');
          break;
      }

      if (count > 0) {
        changes.push({
          location: `변수 '${varName}'의 값`,
          problem: `${charName} ${count}개 포함`,
          fix: fixDesc,
        });
      }

      return prefix + fixed + suffix;
    },
  );
}

/**
 * capture 블록 내 문제 문자 치환 + 변경 내역 추적
 */
function fixCaptureBlock(
  code: string,
  errorType: ErrorType,
  changes: ChangeDetail[],
): string {
  const charName = getCharDisplayName(errorType);
  const fixDesc = getFixDescription(errorType);

  return code.replace(
    /(\{%-\s*capture\s+at_message_body\s*-%\})([\s\S]*?)(\{%-\s*endcapture\s*-%\})/,
    (_match, prefix: string, body: string, suffix: string) => {
      let fixed = body;
      let count = 0;

      switch (errorType) {
        case 'tab':
          count = (body.match(/\t/g) || []).length;
          fixed = fixed.replace(/\t/g, ' ');
          break;
        case 'backslash':
          count = (body.match(/\\/g) || []).length;
          fixed = fixed.replace(/\\/g, '\\\\');
          break;
        // newline은 메시지 본문에서 의도된 것이므로 건드리지 않음
        // quote, single_quote는 json_escape 필터가 처리
      }

      if (count > 0) {
        changes.push({
          location: '메시지 본문 (at_message_body)',
          problem: `${charName} ${count}개 포함`,
          fix: fixDesc,
        });
      }

      return prefix + fixed + suffix;
    },
  );
}

/**
 * at_button_name에 json_escape 필터 추가 (JSON 바디 내) + 변경 내역 추적
 */
function addJsonEscapeToButtonName(code: string, changes: ChangeDetail[]): string {
  const original = code;
  const result = code.replace(
    /\{\{\s*at_button_name\s*\|\s*strip\s*\}\}/g,
    '{{ at_button_name | strip | json_escape }}',
  );

  if (result !== original) {
    changes.push({
      location: '버튼명 (at_button_name)',
      problem: 'json_escape 필터 누락',
      fix: '| json_escape 필터 추가',
    });
  }

  return result;
}

/**
 * 전체 진단 및 수정 실행
 */
export function diagnoseAndFix(
  errorMessage: string,
  liquidCode: string,
): DiagnosisResult | null {
  const parsed = parseError(errorMessage);
  if (!parsed) return null;

  const errorType = classifyError(parsed.token);
  const messages = getDiagnosisMessages(errorType);
  const changeDetails: ChangeDetail[] = [];

  // 구조적 오류 / API 오류는 자동 수정 불가
  if (errorType === 'structure' || errorType === 'api_error') {
    return {
      errorType,
      ...messages,
      fixedCode: liquidCode, // 원본 유지
      changeDetails: [],
    };
  }

  // 수정 적용
  let fixedCode = liquidCode;

  // 1. assign 값 수정
  fixedCode = fixAssignValues(fixedCode, errorType, changeDetails);

  // 2. capture 블록 수정
  fixedCode = fixCaptureBlock(fixedCode, errorType, changeDetails);

  // 3. 버튼명 json_escape 필터 추가 (tab, newline, quote 에러 시)
  if (['tab', 'newline', 'quote', 'unknown'].includes(errorType)) {
    fixedCode = addJsonEscapeToButtonName(fixedCode, changeDetails);
  }

  return {
    errorType,
    ...messages,
    fixedCode,
    changeDetails,
  };
}
