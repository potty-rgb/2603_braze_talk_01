import { KOREAN_TO_ENGLISH } from '../constants/koreanToEnglishMap';

interface ConvertedName {
  englishName: string;
  isAutoNamed: boolean;
}

// ─── 한글 → 로마자 변환 테이블 (국립국어원 로마자 표기법 기반) ───

// 초성 (19개)
const INITIALS = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp',
  's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];

// 중성 (21개)
const MEDIALS = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye',
  'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we',
  'wi', 'yu', 'eu', 'ui', 'i',
];

// 종성 (28개, 0번은 종성 없음)
const FINALS = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 't',
  'l', 'l', 'm', 'l', 'l', 'l', 'l', 'l',
  'm', 'p', 'p', 't', 't', 'ng', 't', 't',
  'k', 't', 'p', 't',
];

const HANGUL_START = 0xAC00;
const HANGUL_END = 0xD7A3;

/**
 * 한글 변수명을 글자 단위로 분리하여 snake_case 로마자 변환
 * 예: "강의명" → "gang_ui_myeong"
 *     "쿠폰내용" → "ku_pon_nae_yong"
 */
function romanizeToSnakeCase(korean: string): string {
  const syllables: string[] = [];

  for (const char of korean) {
    const code = char.charCodeAt(0);

    if (code >= HANGUL_START && code <= HANGUL_END) {
      const offset = code - HANGUL_START;
      const initialIdx = Math.floor(offset / (21 * 28));
      const medialIdx = Math.floor((offset % (21 * 28)) / 28);
      const finalIdx = offset % 28;

      syllables.push(INITIALS[initialIdx] + MEDIALS[medialIdx] + FINALS[finalIdx]);
    } else if (/[a-zA-Z0-9]/.test(char)) {
      syllables.push(char.toLowerCase());
    }
    // 공백/특수문자는 구분자 역할로 무시
  }

  return syllables.join('_');
}

/**
 * 한글 변수명을 영어 snake_case로 변환
 * 1차: 사전(KOREAN_TO_ENGLISH)에서 조회
 * 2차: 한글 로마자 변환으로 자동 생성
 *
 * 항상 isAutoNamed=true를 반환하여 유저 입력 없이 바로 사용 가능
 */
export function convertToEnglish(koreanName: string): ConvertedName {
  // 1차: 사전 조회
  const found = KOREAN_TO_ENGLISH[koreanName];
  if (found) {
    return { englishName: found, isAutoNamed: true };
  }

  // 2차: 로마자 변환
  const romanized = romanizeToSnakeCase(koreanName);
  if (romanized) {
    return { englishName: romanized, isAutoNamed: true };
  }

  // 극단적 폴백 (한글이 아닌 특수문자만 있는 경우)
  return { englishName: 'custom_var', isAutoNamed: true };
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
    const converted = convertToEnglish(name);

    // 중복 체크
    let finalName = converted.englishName;
    let counter = 2;
    while (usedEnglishNames.has(finalName)) {
      finalName = `${converted.englishName}_${counter}`;
      counter++;
    }
    usedEnglishNames.add(finalName);
    result.set(name, { ...converted, englishName: finalName });
  }

  return result;
}
