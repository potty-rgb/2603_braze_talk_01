import { useState, useEffect } from 'react';
import type { DiagnosisResult } from '../types';
import { diagnoseAndFix } from '../utils/errorDiagnoser';
import { findSolution, findSolutionSync, saveSolution, buildAiPrompt } from '../utils/errorStore';
import CopyButton from './CopyButton';

type Phase =
  | 'idle'           // 초기 상태
  | 'diagnosed'      // 규칙 기반 진단 완료
  | 'unknown'        // 규칙으로 해결 불가 → AI 안내
  | 'saved_found'    // 저장된 해결방안 발견
  | 'awaiting_fix'   // 유저가 AI 해결방안 입력 대기
  | 'fix_applied'    // 수정 완료
  | 'parse_error';   // 에러 메시지 파싱 실패

interface Props {
  liquidCode: string;
}

export default function ErrorDiagnoser({ liquidCode }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [errorInput, setErrorInput] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [fixedCodeInput, setFixedCodeInput] = useState('');
  const [fixDescription, setFixDescription] = useState('');
  const [finalFixedCode, setFinalFixedCode] = useState('');
  const [savedDescription, setSavedDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 에러 입력 변경 시 상태 초기화
  useEffect(() => {
    setPhase('idle');
    setDiagnosis(null);
    setFinalFixedCode('');
    setFixedCodeInput('');
    setFixDescription('');
    setSavedDescription('');
  }, [errorInput]);

  async function handleDiagnose() {
    if (!errorInput.trim()) return;

    // 1. 먼저 저장된 해결방안 확인 (로컬 캐시 → Google Sheets)
    const saved = findSolutionSync(errorInput);
    if (saved) {
      setSavedDescription(saved.description);
      setFinalFixedCode(saved.fixedCode);
      setPhase('saved_found');
      return;
    }

    // 비동기로 Google Sheets도 확인
    const remoteSaved = await findSolution(errorInput);
    if (remoteSaved) {
      setSavedDescription(remoteSaved.description);
      setFinalFixedCode(remoteSaved.fixedCode);
      setPhase('saved_found');
      return;
    }

    // 2. 규칙 기반 진단 시도
    const result = diagnoseAndFix(errorInput, liquidCode);
    if (!result) {
      setPhase('parse_error');
      return;
    }

    setDiagnosis(result);

    if (result.errorType === 'structure' || result.errorType === 'unknown') {
      setPhase('unknown');
    } else {
      setFinalFixedCode(result.fixedCode);
      setPhase('diagnosed');
    }
  }

  async function handleApplyFix() {
    if (!fixedCodeInput.trim()) return;

    setFinalFixedCode(fixedCodeInput);
    setPhase('fix_applied');

    // Google Sheets에 저장
    setIsSaving(true);
    await saveSolution(
      errorInput,
      fixDescription || '사용자가 AI를 통해 해결한 오류',
      fixedCodeInput,
    );
    setIsSaving(false);
  }

  function handleReset() {
    setErrorInput('');
    setPhase('idle');
    setDiagnosis(null);
    setFixedCodeInput('');
    setFixDescription('');
    setFinalFixedCode('');
    setSavedDescription('');
  }

  const errorTypeIcon: Record<string, string> = {
    tab: '⌨️',
    newline: '↵',
    quote: '"',
    single_quote: "'",
    backslash: '\\',
    structure: '🧱',
    unknown: '❓',
  };

  return (
    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* 접이식 헤더 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <span className="text-sm font-semibold text-amber-600 flex items-center gap-2">
          <span className="text-base">💡</span>
          테스트 발송 오류가 발생했나요?
        </span>
        <span className={`text-gray-400 transition-transform text-xs ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mt-3 mb-2">
            Braze 테스트 발송 시 받은 오류 메시지를 그대로 붙여넣어 주세요.
          </p>

          {/* 에러 입력 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={errorInput}
              onChange={(e) => setErrorInput(e.target.value)}
              placeholder='{"code":2000,"description":"Unexpected token \t in JSON at position 217"}'
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={handleDiagnose}
              disabled={!errorInput.trim()}
              className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              진단하기
            </button>
          </div>

          {/* ─── Phase: parse_error ─── */}
          {phase === 'parse_error' && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-semibold text-gray-600">❓ 오류 형식을 인식할 수 없습니다</p>
              <p className="text-xs text-gray-500 mt-1">
                오류 메시지를 정확히 복사해서 붙여넣어 주세요.
                <br />
                예시: {`{"code":2000,"description":"Unexpected token \\t in JSON at position 217"}`}
              </p>
            </div>
          )}

          {/* ─── Phase: saved_found (이전에 저장된 해결방안) ─── */}
          {phase === 'saved_found' && (
            <div className="mt-3 space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                  <span>📚</span>
                  이전에 해결된 오류입니다
                </p>
                <p className="text-xs text-blue-700 mt-1">{savedDescription}</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                  <span>✅</span>
                  저장된 해결방안을 적용했습니다
                </p>
                <p className="text-xs text-green-700 mt-1">
                  아래 버튼으로 수정된 코드를 복사한 뒤 다시 테스트 발송해주세요.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <CopyButton text={finalFixedCode} label="수정된 코드 전체 복사" />
                  <button onClick={handleReset} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    초기화
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Phase: diagnosed (규칙 기반 자동 수정 성공) ─── */}
          {phase === 'diagnosed' && diagnosis && (
            <div className="mt-3 space-y-3">
              {/* 문제 원인 */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  <span>{errorTypeIcon[diagnosis.errorType] || '❓'}</span>
                  문제 원인: {diagnosis.description}
                </p>
                <p className="text-xs text-amber-700 mt-1">{diagnosis.cause}</p>
              </div>

              {/* 수정 내역 상세 */}
              {diagnosis.changeDetails.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <span>🔧</span>
                    수정 내역 ({diagnosis.changeDetails.length}건)
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {diagnosis.changeDetails.map((change, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                        <div>
                          <span className="font-semibold text-blue-800">{change.location}</span>
                          <span className="text-blue-600"> — {change.problem}</span>
                          <span className="text-blue-500"> → {change.fix}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 수정 완료 + 복사 */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                  <span>✅</span>
                  자동 수정 완료
                </p>
                <p className="text-xs text-green-700 mt-1">
                  수정된 코드를 복사하여 Braze에서 다시 테스트 발송해주세요.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <CopyButton text={finalFixedCode} label="수정된 코드 전체 복사" />
                  <button onClick={handleReset} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    초기화
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Phase: unknown (규칙으로 해결 불가 → AI 안내) ─── */}
          {phase === 'unknown' && (
            <div className="mt-3 space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                  <span>⚠️</span>
                  자동 진단이 어려운 오류입니다
                </p>
                <p className="text-xs text-red-700 mt-1">
                  AI 서비스를 활용하여 해결해주세요. 아래 버튼을 누르면 오류 메시지와 Liquid 코드가 함께 복사됩니다.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <CopyButton
                    text={buildAiPrompt(errorInput, liquidCode)}
                    label="오류 + 코드 함께 복사"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  복사한 내용을 ChatGPT, Claude 등 AI 서비스에 붙여넣고 해결방안을 받으세요.
                </p>
              </div>

              {/* AI 해결방안 입력 */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span>📝</span>
                  AI가 제공한 수정된 코드를 붙여넣어 주세요
                </p>
                <textarea
                  value={fixedCodeInput}
                  onChange={(e) => setFixedCodeInput(e.target.value)}
                  placeholder="AI가 제공한 수정된 전체 Liquid 코드를 여기에 붙여넣으세요..."
                  rows={4}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="text"
                  value={fixDescription}
                  onChange={(e) => setFixDescription(e.target.value)}
                  placeholder="해결 방법을 간단히 적어주세요 (예: 메시지 본문의 탭 제거)"
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleApplyFix}
                  disabled={!fixedCodeInput.trim()}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  수정 적용하기
                </button>
              </div>
            </div>
          )}

          {/* ─── Phase: fix_applied (유저가 AI 해결방안 적용 완료) ─── */}
          {phase === 'fix_applied' && (
            <div className="mt-3 space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                  <span>✅</span>
                  수정이 적용되었습니다{isSaving ? ' (저장 중...)' : ' (저장 완료)'}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  아래 버튼으로 수정된 코드를 복사한 뒤, Braze에서 다시 테스트 발송해주세요.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <CopyButton text={finalFixedCode} label="수정된 코드 전체 복사" />
                  <button onClick={handleReset} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    초기화
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  이 해결방안은 저장되어, 다음에 같은 오류 발생 시 자동으로 제안됩니다.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
