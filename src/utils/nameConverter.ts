import { KOREAN_TO_ENGLISH } from '../constants/koreanToEnglishMap';

interface ConvertedName {
  englishName: string;
  isAutoNamed: boolean;
}

/**
 * 한글 변수명을 영어 snake_case로 변환
 * 사전에 있으면 자동 변환, 없으면 빈 문자열 + isAutoNamed=false
 */
export function convertToEnglish(koreanName: string): ConvertedName {
  const found = KOREAN_TO_ENGLISH[koreanName];
  if (found) {
    return { englishName: found, isAutoNamed: true };
  }
  return { englishName: '', isAutoNamed: false };
}

/**
 * 여러 변수명을 일괄 변환. 중복 영어명 발생 시 숫자 접미사 추가
 */
export function convertAllNames(
  koreanNames: string[],
): Map<string, ConvertedName> {
  const result = new Map<string, ConvertedName>();
  const usedEnglishNames = new Set<string>();

  for (const name of koreanNames) {
    let converted = convertToEnglish(name);

    if (converted.englishName) {
      // 중복 체크
      let finalName = converted.englishName;
      let counter = 2;
      while (usedEnglishNames.has(finalName)) {
        finalName = `${converted.englishName}_${counter}`;
        counter++;
      }
      usedEnglishNames.add(finalName);
      result.set(name, { ...converted, englishName: finalName });
    } else {
      result.set(name, converted);
    }
  }

  return result;
}
