import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, DiagnosisResult } from '../types';
import { diagnoseAndFix } from '../utils/errorDiagnoser';
import { findSolution, findSolutionSync, saveSolution, buildAiPrompt } from '../utils/errorStore';
import CopyButton from './CopyButton';

interface Props {
  liquidCode?: string;   // connected 모드에서 전달 (Step 2)
  isOpen: boolean;
  onToggle: () => void;
  embedded?: boolean;    // 3열 레이아웃에서 카드 형태로 임베드
  onCodeFixed?: (fixedCode: string) => void;  // connected 모드: 수정된 코드 전파
}

type InputMode = 'liquid' | 'error' | 'ai_fix';

let msgIdCounter = 0;
function genId() {
  return `msg_${++msgIdCounter}_${Date.now()}`;
}

/**
 * 입력이 Liquid 코드인지 자동 감지
 * Liquid 태그({%- assign, {%- capture 등)나 JSON API 바디 구조가 포함되면 코드로 판단
 */
function isLiquidCode(input: string): boolean {
  if (/{%-?\s*(assign|capture|comment|if|else|endif|endcapture|endcomment)\b/.test(input)) return true;
  if (/"account"\s*:/.test(input) && /"senderkey"\s*:/.test(input)) return true;
  if (/{%-?\s*capture\s+at_message_body/.test(input)) return true;
  return false;
}

export default function ErrorDiagnoser({ liquidCode, isOpen, onToggle, embedded, onCodeFixed }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('error');
  const [standaloneLiquid, setStandaloneLiquid] = useState('');
  const [standaloneError, setStandaloneError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Standalone 후속 흐름
  const [standaloneLatestCode, setStandaloneLatestCode] = useState('');
  const [pendingError, setPendingError] = useState('');
  const [awaitingChoice, setAwaitingChoice] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 실제로 사용할 liquidCode (connected prop 또는 standalone 입력)
  const activeLiquidCode = liquidCode || standaloneLiquid;
  const isStandalone = !liquidCode;

  // 패널이 열릴 때 초기화 메시지
  useEffect(() => {
    if (isOpen && !initialized) {
      const initMessages: ChatMessage[] = [];

      if (isStandalone) {
        initMessages.push({
          id: genId(),
          role: 'system',
          content: '오류 메시지와 Braze Liquid 코드 전체를 붙여넣어 주세요.\n순서는 상관없이 하나씩 입력해주세요.',
          type: 'info',
        });
        setInputMode('error');
      } else {
        initMessages.push({
          id: genId(),
          role: 'system',
          content: '테스트 발송 오류가 발생했나요? 오류 메시지를 붙여넣어 주세요.',
          type: 'info',
        });
        setInputMode('error');
      }

      setMessages(initMessages);
      setInitialized(true);
    }
  }, [isOpen, initialized, isStandalone]);

  // liquidCode prop이 변경되면 (Step 2 결과 생성 시) 리셋
  useEffect(() => {
    if (liquidCode) {
      setStandaloneLiquid('');
      setStandaloneLatestCode('');
      setPendingError('');
      setAwaitingChoice(false);
      setInitialized(false);
    }
  }, [liquidCode]);

  // 패널이 닫히면 초기화 상태 리셋 (다시 열 때 새 대화 시작)
  useEffect(() => {
    if (!isOpen) {
      setInitialized(false);
      setMessages([]);
      setStandaloneLiquid('');
      setStandaloneError('');
      setStandaloneLatestCode('');
      setPendingError('');
      setAwaitingChoice(false);
      setInputValue('');
    }
  }, [isOpen]);

  // 메시지 추가 시 스크롤 하단으로
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 포커스
  useEffect(() => {
    if (isOpen && !awaitingChoice) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, inputMode, awaitingChoice]);

  function addMessage(msg: Omit<ChatMessage, 'id'>) {
    const newMsg = { ...msg, id: genId() };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  }

  /** Standalone 대화 리셋 */
  function resetConversation() {
    setMessages([{
      id: genId(),
      role: 'system',
      content: '대화가 초기화되었습니다.\n오류 메시지와 Braze Liquid 코드 전체를 붙여넣어 주세요.',
      type: 'info',
    }]);
    setStandaloneLiquid('');
    setStandaloneError('');
    setStandaloneLatestCode('');
    setPendingError('');
    setAwaitingChoice(false);
    setInputMode('error');
  }

  /** Standalone 후속 선택지 처리 */
  const handleChoice = useCallback(async (action: string) => {
    setAwaitingChoice(false);
    const errorToProcess = pendingError;
    setPendingError('');

    if (action === 'same_code') {
      // 마지막 수정된 코드 기반으로 재진단
      addMessage({
        role: 'system',
        content: '이전 수정 코드를 기반으로 재진단합니다.',
        type: 'info',
      });
      await processError(errorToProcess, standaloneLatestCode);
    } else if (action === 'different_code') {
      // 리셋
      resetConversation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingError, standaloneLatestCode]);

  async function handleSend() {
    const value = inputValue.trim();
    if (!value || awaitingChoice) return;

    setInputValue('');

    if (inputMode === 'ai_fix') {
      // AI 수정 코드 입력
      addMessage({
        role: 'user',
        content: value.length > 100 ? value.substring(0, 100) + '...' : value,
        type: 'liquid_input',
      });

      addMessage({
        role: 'system',
        content: '수정이 적용되었습니다. 아래에서 수정된 코드를 복사해주세요.',
        type: 'fix_result',
        fixedCode: value,
      });

      // Standalone: 최신 코드 업데이트
      if (isStandalone) {
        setStandaloneLatestCode(value);
      }

      // Connected: 수정된 코드 전파
      if (onCodeFixed) {
        onCodeFixed(value);
      }

      // Google Sheets에 저장
      saveSolution(
        messages.filter(m => m.type === 'error_input').pop()?.content || '',
        'AI를 통해 해결한 오류',
        value,
      );

      setInputMode('error');
      return;
    }

    // Standalone 초기 단계: 코드와 오류 메시지를 순서 무관하게 수집
    if (isStandalone && !standaloneLiquid) {
      const isCode = isLiquidCode(value);

      if (isCode) {
        // 사용자가 Liquid 코드를 먼저 입력한 경우
        addMessage({
          role: 'user',
          content: value.length > 100 ? value.substring(0, 100) + '...' : value,
          type: 'liquid_input',
        });
        setStandaloneLiquid(value);

        if (standaloneError) {
          // 이미 오류 메시지도 있음 → 진단 시작
          addMessage({
            role: 'system',
            content: '코드를 확인했습니다. 진단을 시작합니다.',
            type: 'info',
          });
          const errorToProcess = standaloneError;
          setStandaloneError('');
          setInputMode('error');
          await processError(errorToProcess, value);
        } else {
          addMessage({
            role: 'system',
            content: '코드를 확인했습니다. 이제 오류 메시지를 붙여넣어 주세요.',
            type: 'info',
          });
        }
        return;
      } else {
        // 사용자가 오류 메시지를 먼저 입력한 경우
        addMessage({
          role: 'user',
          content: value,
          type: 'error_input',
        });
        setStandaloneError(value);
        addMessage({
          role: 'system',
          content: '오류 메시지를 확인했습니다. 이제 Braze Liquid 코드 전체를 붙여넣어 주세요.',
          type: 'info',
        });
        return;
      }
    }

    // Standalone 후속 입력: 첫 진단 이후에 새 입력이 들어온 경우
    if (isStandalone && standaloneLiquid && standaloneLatestCode) {
      const isCode = isLiquidCode(value);

      if (isCode) {
        // 새 코드 입력 → 리셋 후 새 코드 저장
        addMessage({
          role: 'user',
          content: value.length > 100 ? value.substring(0, 100) + '...' : value,
          type: 'liquid_input',
        });
        setStandaloneLiquid(value);
        setStandaloneLatestCode('');
        setPendingError('');
        setAwaitingChoice(false);
        addMessage({
          role: 'system',
          content: '새 코드를 확인했습니다. 오류 메시지를 붙여넣어 주세요.',
          type: 'info',
        });
        return;
      } else {
        // 오류 메시지 입력 → 선택지 제시
        addMessage({
          role: 'user',
          content: value,
          type: 'error_input',
        });
        setPendingError(value);
        setAwaitingChoice(true);
        addMessage({
          role: 'system',
          content: '어떤 경우인가요?',
          type: 'choice_prompt',
          choiceButtons: [
            { label: '같은 코드의 다른 오류', action: 'same_code' },
            { label: '다른 코드의 오류 (리셋)', action: 'different_code' },
          ],
        });
        return;
      }
    }

    // 일반 오류 메시지 입력 (connected 모드, 또는 standalone에서 첫 진단)
    addMessage({
      role: 'user',
      content: value,
      type: 'error_input',
    });

    await processError(value);
  }

  async function processError(errorInput: string, liquidCodeOverride?: string) {
    setIsProcessing(true);
    const codeToUse = liquidCodeOverride || activeLiquidCode;

    try {
      // 1. 저장된 해결방안 확인
      const savedSync = findSolutionSync(errorInput);
      if (savedSync) {
        addMessage({
          role: 'system',
          content: `이전에 해결된 오류입니다: ${savedSync.description}`,
          type: 'fix_result',
          fixedCode: savedSync.fixedCode,
        });
        if (isStandalone && savedSync.fixedCode) {
          setStandaloneLatestCode(savedSync.fixedCode);
        }
        if (onCodeFixed && savedSync.fixedCode) {
          onCodeFixed(savedSync.fixedCode);
        }
        return;
      }

      const savedRemote = await findSolution(errorInput);
      if (savedRemote) {
        addMessage({
          role: 'system',
          content: `이전에 해결된 오류입니다: ${savedRemote.description}`,
          type: 'fix_result',
          fixedCode: savedRemote.fixedCode,
        });
        if (isStandalone && savedRemote.fixedCode) {
          setStandaloneLatestCode(savedRemote.fixedCode);
        }
        if (onCodeFixed && savedRemote.fixedCode) {
          onCodeFixed(savedRemote.fixedCode);
        }
        return;
      }

      // 2. Liquid 코드 검증
      if (!codeToUse) {
        addMessage({
          role: 'system',
          content: 'Liquid 코드가 없어 진단할 수 없습니다. Liquid 코드를 입력해주세요.',
          type: 'info',
        });
        return;
      }

      // 3. 규칙 기반 진단
      const result = diagnoseAndFix(errorInput, codeToUse);

      // 파싱 자체를 못한 경우 (result === null) → AI 안내
      if (!result) {
        const diagnosis: DiagnosisResult = {
          errorType: 'unknown',
          description: '인식할 수 없는 오류 형식입니다',
          cause: errorInput,
          fixApplied: 'AI 서비스를 통해 해결해주세요.',
          fixedCode: codeToUse,
          changeDetails: [],
        };

        addMessage({
          role: 'system',
          content: '자동 진단이 어려운 오류입니다. AI 서비스를 활용해주세요.',
          type: 'ai_guide',
          diagnosis,
        });
        setInputMode('ai_fix');
        return;
      }

      // 200 OK → 전용 카드
      if (result.errorType === 'api_200_ok') {
        addMessage({
          role: 'system',
          content: '',
          type: 'diagnosis',
          diagnosis: result,
        });
        return;
      }

      // 구조적 오류 → AI 안내
      if (result.errorType === 'structure') {
        addMessage({
          role: 'system',
          content: '자동 진단이 어려운 오류입니다. AI 서비스를 활용해주세요.',
          type: 'ai_guide',
          diagnosis: result,
        });
        setInputMode('ai_fix');
        return;
      }

      // unknown 타입이지만 실제 수정이 발생한 경우 → 자동 수정 결과 표시
      if (result.errorType === 'unknown' && result.changeDetails.length === 0) {
        addMessage({
          role: 'system',
          content: '자동 진단이 어려운 오류입니다. AI 서비스를 활용해주세요.',
          type: 'ai_guide',
          diagnosis: result,
        });
        setInputMode('ai_fix');
        return;
      }

      // API 오류 (수신번호 누락 등) → 설정 안내
      if (result.errorType === 'api_error') {
        addMessage({
          role: 'system',
          content: '',
          type: 'diagnosis',
          diagnosis: result,
        });
        return;
      }

      // 자동 수정 성공
      addMessage({
        role: 'system',
        content: '',
        type: 'diagnosis',
        diagnosis: result,
        fixedCode: result.fixedCode,
        changeDetails: result.changeDetails,
      });

      // Standalone: 최신 코드 업데이트
      if (isStandalone && result.fixedCode) {
        setStandaloneLatestCode(result.fixedCode);
      }

      // Connected: 수정된 코드 전파
      if (onCodeFixed && result.fixedCode && result.fixedCode !== codeToUse) {
        onCodeFixed(result.fixedCode);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function getPlaceholder(): string {
    if (awaitingChoice) return '위 선택지를 클릭해주세요...';
    if (inputMode === 'ai_fix') return 'AI가 제공한 수정된 코드를 붙여넣어 주세요...';
    // Standalone 초기 단계: 아직 코드를 받지 못한 상태
    if (isStandalone && !standaloneLiquid) {
      if (standaloneError) return 'Braze Liquid 코드 전체를 붙여넣어 주세요...';
      return '오류 메시지 또는 Liquid 코드를 붙여넣어 주세요...';
    }
    return '오류 메시지를 붙여넣어 주세요...';
  }

  const chatContent = (
    <>
      {/* 채팅 메시지 영역 */}
      <div className={`${embedded ? 'flex-1 min-h-0' : 'max-h-80'} overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin`}>
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            liquidCode={activeLiquidCode}
            onChoice={handleChoice}
            awaitingChoice={awaitingChoice}
          />
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 bg-gray-100 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="shrink-0 px-5 pb-4">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={awaitingChoice}
            rows={(isStandalone && !standaloneLiquid) || inputMode === 'ai_fix' ? 3 : 1}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-2xl text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || awaitingChoice}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            전송
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 ml-1">
          {awaitingChoice && '위 버튼을 클릭하여 진행 방법을 선택해주세요'}
          {!awaitingChoice && inputMode === 'ai_fix' && 'ChatGPT/Claude에서 받은 수정 코드를 붙여넣어 주세요'}
          {!awaitingChoice && inputMode === 'error' && isStandalone && !standaloneLiquid && !standaloneError && '오류 메시지 또는 Liquid 코드, 순서 상관없이 입력해주세요'}
          {!awaitingChoice && inputMode === 'error' && isStandalone && !standaloneLiquid && standaloneError && 'Braze 메시지 에디터의 전체 코드를 붙여넣어 주세요'}
          {!awaitingChoice && inputMode === 'error' && (standaloneLiquid || !isStandalone) && 'Enter로 전송 · 여러 오류를 연속으로 진단할 수 있습니다'}
        </p>
      </div>
    </>
  );

  // 임베드 모드: 3열 레이아웃에서 카드 형태
  if (embedded) {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="shrink-0 px-5 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-blue-600 flex items-center gap-2">
            <span className="text-base">💬</span>
            오류 진단
          </span>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          {chatContent}
        </div>
      </div>
    );
  }

  // 기본 모드: 접이식 패널
  return (
    <div className="shrink-0 max-w-7xl mx-auto w-full px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 접이식 헤더 */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <span className="text-sm font-semibold text-blue-600 flex items-center gap-2">
            <span className="text-base">💬</span>
            오류 진단
          </span>
          <span className={`text-gray-400 transition-transform duration-200 text-xs ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {isOpen && (
          <div className="border-t border-gray-100">
            {chatContent}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 메시지 버블 컴포넌트 ───

function MessageBubble({
  message,
  liquidCode,
  onChoice,
  awaitingChoice,
}: {
  message: ChatMessage;
  liquidCode: string;
  onChoice: (action: string) => void;
  awaitingChoice: boolean;
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-2.5 bg-blue-600 text-white rounded-2xl rounded-br-md text-sm font-mono break-all">
          {message.content}
        </div>
      </div>
    );
  }

  // 시스템 메시지
  if (message.type === 'diagnosis' && message.diagnosis) {
    // 200 OK 전용 카드
    if (message.diagnosis.errorType === 'api_200_ok') {
      return <Api200OkCard />;
    }
    return <DiagnosisCard diagnosis={message.diagnosis} fixedCode={message.fixedCode} changeDetails={message.changeDetails} />;
  }

  if (message.type === 'ai_guide' && message.diagnosis) {
    return <AiGuideCard diagnosis={message.diagnosis} liquidCode={liquidCode} errorInput="" />;
  }

  if (message.type === 'fix_result' && message.fixedCode) {
    return <FixResultCard content={message.content} fixedCode={message.fixedCode} />;
  }

  if (message.type === 'choice_prompt' && message.choiceButtons) {
    return <ChoiceCard content={message.content} buttons={message.choiceButtons} onChoice={onChoice} disabled={!awaitingChoice} />;
  }

  // 일반 시스템 메시지
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] px-4 py-2.5 bg-gray-100 text-gray-700 rounded-2xl rounded-bl-md text-sm whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  );
}

// ─── 선택지 카드 ───

function ChoiceCard({
  content,
  buttons,
  onChoice,
  disabled,
}: {
  content: string;
  buttons: { label: string; action: string }[];
  onChoice: (action: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        <div className="px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-sm font-semibold text-indigo-800 mb-3">{content}</p>
          <div className="flex gap-2">
            {buttons.map((btn) => (
              <button
                key={btn.action}
                onClick={() => onChoice(btn.action)}
                disabled={disabled}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                  disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : btn.action === 'different_code'
                      ? 'bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-100'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 200 OK 전용 카드 ───

function Api200OkCard() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-2">
        {/* 흐름도 */}
        <div className="px-4 py-4 bg-orange-50 border border-orange-200 rounded-xl">
          <p className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
            <span>📡</span>
            발송 흐름 진단
          </p>
          {/* 시각화 흐름도 */}
          <div className="flex items-center justify-center gap-1 text-sm py-2">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 border-2 border-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <span className="text-xs font-medium text-blue-700 mt-1">Braze</span>
            </div>
            <div className="flex flex-col items-center mx-1">
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-green-500" />
                <span className="text-green-600 font-bold text-xs px-1 whitespace-nowrap">200 OK</span>
                <div className="w-4 h-0.5 bg-green-500" />
                <span className="text-green-500">▶</span>
              </div>
              <span className="text-[10px] text-green-600 mt-0.5">성공</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-yellow-100 border-2 border-yellow-400 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📨</span>
              </div>
              <span className="text-xs font-medium text-yellow-700 mt-1">비즈뿌리오</span>
            </div>
            <div className="flex flex-col items-center mx-1">
              <div className="flex items-center">
                <div className="w-6 h-0.5 bg-red-400" />
                <span className="text-red-500 font-bold text-lg">✕</span>
                <div className="w-4 h-0.5 bg-red-400" />
                <span className="text-red-400">▶</span>
              </div>
              <span className="text-[10px] text-red-500 mt-0.5">실패</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <span className="text-xs font-medium text-gray-500 mt-1">수신자</span>
            </div>
          </div>
        </div>

        {/* 설명 */}
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <span>⚠️</span>
            코드 오류가 아닌 발송 실패입니다
          </p>
          <p className="text-xs text-amber-700 mt-1.5 leading-relaxed">
            Braze에서 비즈뿌리오로의 API 요청은 <strong>200 OK</strong>로 성공했지만,
            비즈뿌리오가 실제 수신자에게 메시지를 전달하지 못했습니다.
          </p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            이 경우 Liquid 코드 자체의 문제가 아니므로 자동 수정이 불가합니다.
          </p>
        </div>

        {/* 조치 안내 */}
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
            <span>🔍</span>
            확인 방법
          </p>
          <div className="mt-2 space-y-1.5 text-xs text-blue-700">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0 font-bold">1.</span>
              <span><strong>Platform_Api</strong> 계정으로 비즈뿌리오에 로그인</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0 font-bold">2.</span>
              <span><strong>발송 결과 조회</strong>에서 해당 발송 건의 실패 원인 확인</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0 font-bold">3.</span>
              <span>주요 실패 원인: 수신번호 오류, 템플릿 불일치, 발송 한도 초과 등</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 진단 결과 카드 ───

function DiagnosisCard({
  diagnosis,
  fixedCode,
  changeDetails,
}: {
  diagnosis: DiagnosisResult;
  fixedCode?: string;
  changeDetails?: import('../types').ChangeDetail[];
}) {
  const errorTypeIcon: Record<string, string> = {
    tab: '⌨️', newline: '↵', quote: '"', single_quote: "'", backslash: '\\',
    structure: '🧱', api_error: '📡', api_200_ok: '📡', unknown: '❓',
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-2">
        {/* 원인 */}
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <span>{errorTypeIcon[diagnosis.errorType] || '❓'}</span>
            {diagnosis.description}
          </p>
          <p className="text-xs text-amber-700 mt-1">{diagnosis.cause}</p>
        </div>

        {/* 수정 내역 */}
        {changeDetails && changeDetails.length > 0 && (
          <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <span>🔧</span>
              수정 내역 ({changeDetails.length}건)
            </p>
            <div className="mt-2 space-y-1">
              {changeDetails.map((change, idx) => (
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

        {/* 복사 버튼 */}
        {fixedCode && (
          <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
              <span>✅</span>
              자동 수정 완료
            </p>
            <p className="text-xs text-green-700 mt-1">
              수정된 코드를 복사하여 Braze에서 다시 테스트 발송해주세요.
            </p>
            <div className="mt-2">
              <CopyButton text={fixedCode} label="수정된 코드 전체 복사" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AI 안내 카드 ───

function AiGuideCard({
  diagnosis,
  liquidCode,
}: {
  diagnosis: DiagnosisResult;
  liquidCode: string;
  errorInput: string;
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-2">
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
            <span>⚠️</span>
            자동 진단이 어려운 오류입니다
          </p>
          <p className="text-xs text-red-700 mt-1">
            AI 서비스를 활용하여 해결해주세요. 아래 버튼을 누르면 오류 메시지와 Liquid 코드가 함께 복사됩니다.
          </p>
          <div className="mt-2">
            <CopyButton
              text={buildAiPrompt(diagnosis.cause, liquidCode)}
              label="오류 + 코드 함께 복사"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            복사한 내용을 ChatGPT, Claude 등에 붙여넣고 수정된 코드를 받으세요.
            <br />
            받은 코드를 아래 입력창에 붙여넣으면 저장됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── 수정 결과 카드 ───

function FixResultCard({ content, fixedCode }: { content: string; fixedCode: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
            <span>✅</span>
            {content || '수정이 적용되었습니다'}
          </p>
          <p className="text-xs text-green-700 mt-1">
            수정된 코드를 복사하여 Braze에서 다시 테스트 발송해주세요.
          </p>
          <div className="mt-2">
            <CopyButton text={fixedCode} label="수정된 코드 전체 복사" />
          </div>
        </div>
      </div>
    </div>
  );
}
