import { useState } from 'react';
import type { FormData, TemplateType, TalkType, MessageType } from '../types';

interface Props {
  templateType: TemplateType;
  onSubmit: (data: FormData) => void;
}

export default function InputForm({ templateType, onSubmit }: Props) {
  const [templateText, setTemplateText] = useState('');
  const [sendingText, setSendingText] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [talkType, setTalkType] = useState<TalkType>('AI');
  const [messageType, setMessageType] = useState<MessageType>('info');
  const [buttonName, setButtonName] = useState('');
  const [urlVariable, setUrlVariable] = useState('');
  const [utm, setUtm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isWithButton = templateType === 'with_button';

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!templateText.trim()) {
      newErrors.templateText = '템플릿 원문을 입력해주세요';
    } else if (!/#\{[^}]+\}/.test(templateText)) {
      newErrors.templateText = '템플릿 원문에 #{변수}가 최소 하나 이상 포함되어야 합니다';
    }

    if (!sendingText.trim()) {
      newErrors.sendingText = '발송 원문을 입력해주세요';
    }

    if (!templateCode.trim()) {
      newErrors.templateCode = '템플릿 코드를 입력해주세요';
    }

    if (isWithButton && !buttonName.trim()) {
      newErrors.buttonName = '버튼명을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      templateType,
      templateText,
      sendingText,
      templateCode,
      talkType,
      messageType,
      buttonName,
      urlVariable,
      utm,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-3">
      <h2 className="text-base font-bold text-gray-800">
        {isWithButton ? '버튼 O 템플릿' : '버튼 X 템플릿'} 정보 입력
      </h2>

      {/* 템플릿 원문 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          템플릿 원문
        </label>
        <p className="text-xs text-gray-400 mb-1">
          비뿌 템플릿 원본을 그대로 복사해서 넣어주세요. 부가 정보는 복사하지 않아도 됩니다.
        </p>
        <textarea
          value={templateText}
          onChange={(e) => setTemplateText(e.target.value)}
          placeholder="#{강의명}의 #{쿠폰내용} 쿠폰이 오늘 밤에 마감돼요!&#10;■ 쿠폰명: #{쿠폰이름} ■ 만료일시: #{만료일시}"
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.templateText ? 'border-red-400' : 'border-gray-300'}`}
        />
        {errors.templateText && (
          <p className="text-xs text-red-500 mt-1">{errors.templateText}</p>
        )}
      </div>

      {/* 발송 원문 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          발송 원문
        </label>
        <p className="text-xs text-gray-400 mb-1">
          변수값을 치환한 최종 발송 문안을 입력해주세요. 줄바꿈 등 모두 적용된 최종 버전으로 입력해주세요.
        </p>
        <textarea
          value={sendingText}
          onChange={(e) => setSendingText(e.target.value)}
          placeholder="<2026NEW! 서울투자 기초반>의 재수강 투자 응원 6만원 쿠폰이 오늘 밤에 마감돼요!&#10;■ 쿠폰명: 재수강 투자 응원 6만원 쿠폰 ■ 만료일시: 01.29(목) 23:59까지"
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.sendingText ? 'border-red-400' : 'border-gray-300'}`}
        />
        {errors.sendingText && (
          <p className="text-xs text-red-500 mt-1">{errors.sendingText}</p>
        )}
      </div>

      {/* 템플릿 코드 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          템플릿 코드
        </label>
        <p className="text-xs text-gray-400 mb-1">
          비즈뿌리오에 등록된 템플릿 코드를 입력해주세요.
        </p>
        <input
          type="text"
          value={templateCode}
          onChange={(e) => setTemplateCode(e.target.value)}
          placeholder="bizp_2025123103044120835684085"
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.templateCode ? 'border-red-400' : 'border-gray-300'}`}
        />
        {errors.templateCode && (
          <p className="text-xs text-red-500 mt-1">{errors.templateCode}</p>
        )}
      </div>

      {/* talk_type / message_type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            알림톡 타입
          </label>
          <select
            value={talkType}
            onChange={(e) => setTalkType(e.target.value as TalkType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="AT">AT (알림톡)</option>
            <option value="AI">AI (이미지 알림톡)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            메시지 유형
          </label>
          <select
            value={messageType}
            onChange={(e) => setMessageType(e.target.value as MessageType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="info">info (정보성)</option>
            <option value="ad">ad (광고성)</option>
          </select>
        </div>
      </div>

      {/* 버튼 관련 필드 (버튼 O만) */}
      {isWithButton && (
        <>
          <hr className="border-gray-200" />
          <h3 className="text-sm font-bold text-gray-600">버튼 설정</h3>

          {/* 버튼명 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              버튼명
            </label>
            <p className="text-xs text-gray-400 mb-1">
              비뿌 템플릿 버튼명을 그대로 입력해주세요.
            </p>
            <input
              type="text"
              value={buttonName}
              onChange={(e) => setButtonName(e.target.value)}
              placeholder="자세히 보기🎁"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.buttonName ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.buttonName && (
              <p className="text-xs text-red-500 mt-1">{errors.buttonName}</p>
            )}
          </div>

          {/* url변수 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              url변수
            </label>
            <p className="text-xs text-gray-400 mb-1">
              비뿌 템플릿에 있는 버튼 URL 변수를 입력해주세요. 비어있으면 공백 처리됩니다.
            </p>
            <input
              type="text"
              value={urlVariable}
              onChange={(e) => setUrlVariable(e.target.value)}
              placeholder="https://"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* utm */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              UTM
            </label>
            <p className="text-xs text-gray-400 mb-1">
              생성한 UTM 원본을 그대로 입력해주세요.
            </p>
            <input
              type="text"
              value={utm}
              onChange={(e) => setUtm(e.target.value)}
              placeholder="https://weolbu.com/event?utm_source=katalk&utm_medium=alimtalk"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
      >
        변환하기
      </button>
    </form>
  );
}
