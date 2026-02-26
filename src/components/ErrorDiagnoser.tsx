import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, DiagnosisResult } from '../types';
import { diagnoseAndFix } from '../utils/errorDiagnoser';
import { findSolution, findSolutionSync, saveSolution, buildAiPrompt } from '../utils/errorStore';
import CopyButton from './CopyButton';

interface Props {
  liquidCode?: string;   // connected 모드에서 전달 (Step 2)
  isOpen: boolean;
  onToggle: () => void;
}

type InputMode = 'liquid' | 'error' | 'ai_fix';

let msgIdCounter = 0;
function genId() {
  return `msg_${++msgIdCounter}_${Date.now()}`;
}

export default function ErrorDiagnoser({ liquidCode, isOpen, onToggle }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('error');
  const [standaloneLiquid, setStandaloneLiquid] = useState('');
  const [initialized, setInitialized] = useState(false);
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
          content: 'Braze에서 사용 중인 Liquid 코드 전체를 붙여넣어 주세요.',
          type: 'info',
        });
        setInputMode('liquid');
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
      setInitialized(false);
    }
  }, [liquidCode]);

  // 패널이 닫히면 초기화 상태 리셋 (다시 열 때 새 대화 시작)
  useEffect(() => {
    if (!isOpen) {
      setInitialized(false);
      setMessages([]);
      setStandaloneLiquid('');
      setInputValue('');
    }
  }, [isOpen]);

  // 메시지 추가 시 스크롤 하단으로
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 포커스
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, inputMode]);

  function addMessage(msg: Omit<ChatMessage, 'id'>) {
    const newMsg = { ...msg, id: genId() };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  }

  async function handleSend() {
    const value = inputValue.trim();
    if (!value) return;

    setInputValue('');

    if (inputMode === 'liquid') {
      // Standalone: 유저가 Liquid 코드를 입력
      addMessage({
        role: 'user',
        content: value.length > 100 ? value.substring(0, 100) + '...' : value,
        type: 'liquid_input',
      });

      setStandaloneLiquid(value);

      addMessage({
        role: 'system',
        content: '코드를 확인했습니다. 이제 오류 메시지를 붙여넣어 주세요.',
        type: 'info',
      });

      setInputMode('error');
      return;
    }

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

      // Google Sheets에 저장
      saveSolution(
        messages.filter(m => m.type === 'error_input').pop()?.content || '',
        'AI를 통해 해결한 오류',
        value,
      );

      setInputMode('error');
      return;
    }

    // 에러 메시지 입력
    addMessage({
      role: 'user',
      content: value,
      type: 'error_input',
    });

    await processError(value);
  }

  async function processError(errorInput: string) {
    // 1. 저장된 해결방안 확인
    const savedSync = findSolutionSync(errorInput);
    if (savedSync) {
      addMessage({
        role: 'system',
        content: `이전에 해결된 오류입니다: ${savedSync.description}`,
        type: 'fix_result',
        fixedCode: savedSync.fixedCode,
      });
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
      return;
    }

    // 2. 규칙 기반 진단
    if (!activeLiquidCode) {
      addMessage({
        role: 'system',
        content: 'Liquid 코드가 없어 진단할 수 없습니다. 먼저 Liquid 코드를 입력해주세요.',
        type: 'info',
      });
      setInputMode('liquid');
      return;
    }

    const result = diagnoseAndFix(errorInput, activeLiquidCode);

    if (!result) {
      addMessage({
        role: 'system',
        content: '오류 형식을 인식할 수 없습니다. 오류 메시지를 정확히 복사해서 다시 붙여넣어 주세요.\n\n예시: {"code":2000,"description":"Unexpected token \\t in JSON at position 217"}',
        type: 'info',
      });
      return;
    }

    if (result.errorType === 'structure' || result.errorType === 'unknown') {
      // AI 안내
      addMessage({
        role: 'system',
        content: '자동 진단이 어려운 오류입니다. AI 서비스를 활용해주세요.',
        type: 'ai_guide',
        diagnosis: result,
      });
      setInputMode('ai_fix');
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
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function getPlaceholder(): string {
    switch (inputMode) {
      case 'liquid':
        return 'Braze Liquid 코드 전체를 붙여넣어 주세요...';
      case 'ai_fix':
        return 'AI가 제공한 수정된 코드를 붙여넣어 주세요...';
      case 'error':
      default:
        return '오류 메시지를 붙여넣어 주세요...';
    }
  }

  return (
    <div className="shrink-0 max-w-7xl mx-auto w-full px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
            {/* 채팅 메시지 영역 */}
            <div className="max-h-80 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin">
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  liquidCode={activeLiquidCode}
                />
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="px-5 pb-4">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={getPlaceholder()}
                  rows={inputMode === 'liquid' || inputMode === 'ai_fix' ? 3 : 1}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  전송
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 ml-1">
                {inputMode === 'error' && 'Enter로 전송 · 여러 오류를 연속으로 진단할 수 있습니다'}
                {inputMode === 'liquid' && 'Braze 메시지 에디터의 전체 코드를 붙여넣어 주세요'}
                {inputMode === 'ai_fix' && 'ChatGPT/Claude에서 받은 수정 코드를 붙여넣어 주세요'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 메시지 버블 컴포넌트 ───

function MessageBubble({ message, liquidCode }: { message: ChatMessage; liquidCode: string }) {
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
    return <DiagnosisCard diagnosis={message.diagnosis} fixedCode={message.fixedCode} changeDetails={message.changeDetails} />;
  }

  if (message.type === 'ai_guide' && message.diagnosis) {
    return <AiGuideCard diagnosis={message.diagnosis} liquidCode={liquidCode} errorInput="" />;
  }

  if (message.type === 'fix_result' && message.fixedCode) {
    return <FixResultCard content={message.content} fixedCode={message.fixedCode} />;
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
    tab: '⌨️', newline: '↵', quote: '"', single_quote: "'", backslash: '\\', structure: '🧱', unknown: '❓',
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
