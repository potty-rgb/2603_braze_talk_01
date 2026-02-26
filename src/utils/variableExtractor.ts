export interface ExtractedVar {
  name: string;
  pattern: string;
}

/**
 * 템플릿 원문에서 #{변수명} 패턴을 추출하고 중복 제거
 */
export function extractVariables(templateText: string): ExtractedVar[] {
  const regex = /#\{([^}]+)\}/g;
  const seen = new Set<string>();
  const result: ExtractedVar[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(templateText)) !== null) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      result.push({
        name,
        pattern: match[0],
      });
    }
  }

  return result;
}
