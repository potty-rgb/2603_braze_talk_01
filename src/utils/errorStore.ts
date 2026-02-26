/**
 * Google Sheets 기반 에러-해결방안 공유 저장소
 * + localStorage 캐시 (오프라인/빠른 응답)
 *
 * Google Sheet 구조:
 * A: errorPattern  (에러 패턴)
 * B: description   (해결방법 설명)
 * C: fixedCode     (수정된 코드 예시)
 * D: savedAt       (저장 일시)
 *
 * Google Apps Script 웹앱 1개로 읽기(GET)/쓰기(POST) 모두 처리
 * 설정 방법: README.md의 "Google Sheets 연동" 섹션 참고
 */

// Google Apps Script 웹앱 URL — 배포 후 여기에 입력
const SHEET_CONFIG = {
  // Apps Script 배포 URL (GET: 데이터 조회, POST: 데이터 저장)
  // 예: 'https://script.google.com/macros/s/AKfycbx.../exec'
  readUrl: '',
  writeUrl: '',
};

const LOCAL_CACHE_KEY = 'braze_error_solutions_cache';
const LOCAL_PENDING_KEY = 'braze_error_solutions_pending';

export interface SavedSolution {
  errorPattern: string;
  description: string;
  fixedCode: string;
  savedAt: string;
}

/**
 * Google Sheets 설정이 되어있는지 확인
 */
export function isSheetConfigured(): boolean {
  return SHEET_CONFIG.readUrl !== '' && SHEET_CONFIG.writeUrl !== '';
}

/**
 * 에러 메시지에서 핵심 패턴을 추출
 * position 정보를 제거하여 동일 오류끼리 매칭
 */
export function extractErrorPattern(errorMessage: string): string {
  let description = errorMessage;
  try {
    const parsed = JSON.parse(errorMessage);
    if (parsed.description) {
      description = parsed.description;
    }
  } catch {
    // JSON이 아닌 경우 원본 사용
  }

  return description
    .replace(/at position \d+/, 'at position *')
    .trim();
}

/**
 * 로컬 캐시에서 해결방안 가져오기
 */
function getLocalCache(): SavedSolution[] {
  try {
    const data = localStorage.getItem(LOCAL_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 로컬 캐시에 저장
 */
function setLocalCache(solutions: SavedSolution[]): void {
  localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(solutions));
}

/**
 * Google Sheets에서 해결방안 목록 가져오기 + 로컬 캐시 갱신
 */
export async function fetchSolutions(): Promise<SavedSolution[]> {
  // Sheet 미설정 시 로컬 캐시만 사용
  if (!isSheetConfigured()) {
    return getLocalCache();
  }

  try {
    const res = await fetch(SHEET_CONFIG.readUrl);
    if (!res.ok) throw new Error('Sheet fetch failed');

    const data = await res.json();

    // Apps Script JSON 배열 형식 파싱
    const solutions: SavedSolution[] = [];

    if (Array.isArray(data)) {
      for (const row of data) {
        if (row.errorPattern) {
          solutions.push({
            errorPattern: row.errorPattern || '',
            description: row.description || '',
            fixedCode: row.fixedCode || '',
            savedAt: row.savedAt || '',
          });
        }
      }
    }

    // 로컬 캐시 갱신
    setLocalCache(solutions);
    return solutions;
  } catch {
    // 네트워크 실패 시 로컬 캐시 사용
    return getLocalCache();
  }
}

/**
 * 에러 패턴과 일치하는 해결방안 찾기
 */
export async function findSolution(errorMessage: string): Promise<SavedSolution | null> {
  const pattern = extractErrorPattern(errorMessage);
  const solutions = await fetchSolutions();
  return solutions.find((s) => s.errorPattern === pattern) || null;
}

/**
 * 로컬 캐시에서 동기적으로 찾기 (빠른 응답용)
 */
export function findSolutionSync(errorMessage: string): SavedSolution | null {
  const pattern = extractErrorPattern(errorMessage);
  const cache = getLocalCache();
  return cache.find((s) => s.errorPattern === pattern) || null;
}

/**
 * 새 해결방안 저장 (Google Sheets + 로컬 캐시)
 */
export async function saveSolution(
  errorMessage: string,
  description: string,
  fixedCode: string,
): Promise<boolean> {
  const pattern = extractErrorPattern(errorMessage);
  const solution: SavedSolution = {
    errorPattern: pattern,
    description,
    fixedCode,
    savedAt: new Date().toISOString(),
  };

  // 1. 로컬 캐시에 즉시 저장
  const cache = getLocalCache();
  const existingIndex = cache.findIndex((s) => s.errorPattern === pattern);
  if (existingIndex >= 0) {
    cache[existingIndex] = solution;
  } else {
    cache.push(solution);
  }
  setLocalCache(cache);

  // 2. Google Sheets에 저장 시도
  if (isSheetConfigured()) {
    try {
      const res = await fetch(SHEET_CONFIG.writeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(solution),
      });
      return res.ok;
    } catch {
      // 실패 시 pending 목록에 추가 (나중에 재시도)
      const pending = JSON.parse(localStorage.getItem(LOCAL_PENDING_KEY) || '[]');
      pending.push(solution);
      localStorage.setItem(LOCAL_PENDING_KEY, JSON.stringify(pending));
      return false;
    }
  }

  return true;
}

/**
 * AI 서비스에 복사할 프롬프트 생성
 */
export function buildAiPrompt(errorMessage: string, liquidCode: string): string {
  return `아래는 Braze 알림톡 Liquid 템플릿과 테스트 발송 시 발생한 오류입니다.
오류의 원인을 분석하고, 수정된 전체 Liquid 코드를 제공해주세요.

[오류 메시지]
${errorMessage}

[현재 Liquid 코드]
${liquidCode}

수정된 전체 코드만 출력해주세요.`;
}
