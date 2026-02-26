interface Segment {
  type: 'static' | 'variable';
  text?: string;
  name?: string;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 템플릿을 정적 텍스트와 변수 세그먼트로 분리
 */
function parseSegments(templateText: string): Segment[] {
  const variablePattern = /#\{([^}]+)\}/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = variablePattern.exec(templateText)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'static',
        text: templateText.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: 'variable',
      name: match[1],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < templateText.length) {
    segments.push({
      type: 'static',
      text: templateText.slice(lastIndex),
    });
  }

  return segments;
}

/**
 * 세그먼트 목록에서 매칭 regex를 빌드
 */
function buildRegex(segments: Segment[]): RegExp {
  let pattern = '^';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.type === 'static') {
      pattern += escapeRegex(seg.text!);
    } else {
      const hasRightAnchor = segments.slice(i + 1).some(s => s.type === 'static');
      pattern += hasRightAnchor ? '([\\s\\S]+?)' : '([\\s\\S]+)';
    }
  }

  pattern += '$';
  return new RegExp(pattern);
}

/**
 * 순차 앵커 탐색 폴백
 */
function sequentialMatch(segments: Segment[], sendingText: string): Map<string, string> {
  const result = new Map<string, string>();
  let pos = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.type === 'static') {
      const idx = sendingText.indexOf(seg.text!, pos);
      if (idx === -1) continue;
      pos = idx + seg.text!.length;
    } else {
      // 변수: 다음 정적 텍스트까지가 값
      const nextStatic = segments.slice(i + 1).find(s => s.type === 'static');
      if (nextStatic) {
        const endIdx = sendingText.indexOf(nextStatic.text!, pos);
        if (endIdx !== -1) {
          if (!result.has(seg.name!)) {
            result.set(seg.name!, sendingText.slice(pos, endIdx));
          }
          // pos는 다음 static 처리에서 업데이트됨
        }
      } else {
        // 마지막 변수: 나머지 전체
        if (!result.has(seg.name!)) {
          result.set(seg.name!, sendingText.slice(pos));
        }
      }
    }
  }

  return result;
}

/**
 * 템플릿 원문과 발송 원문을 비교하여 각 변수의 실제 값을 매칭
 */
export function matchVariables(
  templateText: string,
  sendingText: string,
): Map<string, string> {
  // 줄바꿈 정규화
  const normalizedTemplate = templateText.replace(/\r\n/g, '\n').trim();
  const normalizedSending = sendingText.replace(/\r\n/g, '\n').trim();

  const segments = parseSegments(normalizedTemplate);

  // 변수가 없으면 빈 맵 반환
  if (!segments.some(s => s.type === 'variable')) {
    return new Map();
  }

  // regex 매칭 시도
  const regex = buildRegex(segments);
  const match = regex.exec(normalizedSending);

  if (match) {
    const result = new Map<string, string>();
    let captureIndex = 1;
    for (const seg of segments) {
      if (seg.type === 'variable') {
        const value = match[captureIndex++];
        if (!result.has(seg.name!)) {
          result.set(seg.name!, value);
        }
      }
    }
    return result;
  }

  // 폴백: 순차 앵커 탐색
  return sequentialMatch(segments, normalizedSending);
}
