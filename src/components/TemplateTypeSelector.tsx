import { useState, useEffect, useCallback } from 'react';
import type { TemplateType } from '../types';

interface Props {
  onSelect: (type: TemplateType) => void;
  onOpenDiagnoser: () => void;
}

const TEAM_MEMBERS = [
  '안나', '토니', '테디', '제니스', '헤이즐', '제나', '자음과모음',
  '샤샤와함께', '데이즈', '지모', '티나', '썸머', '이지', '클로이',
  '글리', '도리', '제이디', '달곰', '아몬드', '모아나',
  '마네', '주노', '양파링', '너나위', '한가해보이', '권유디',
  '아라', '오션', '프릴', '줴러미', '루나', '피치', '로로',
];

const ENCOURAGEMENTS = [
  '오늘도 멋진 하루 보내세요! ✨',
  '오늘 하루도 화이팅이에요! 💪',
  '항상 응원하고 있어요! 🌟',
  '오늘도 빛나는 하루 되세요! 🌈',
  '좋은 일만 가득한 하루 되세요! 🍀',
  '오늘도 최고의 하루를 만들어봐요! 🚀',
  '당신의 노력이 빛나는 하루예요! 💎',
  '오늘 하루도 즐겁게 보내세요! 😊',
  '늘 수고 많으셔요, 파이팅! 🔥',
  '오늘도 함께해서 든든해요! 🤝',
  '멋진 성과가 기다리고 있을 거예요! 🏆',
  '오늘 하루도 행복하세요! 💛',
  '언제나 멋진 당신을 응원해요! 👏',
  '오늘도 한 걸음씩 나아가요! 🌱',
  '당신 덕분에 팀이 빛나요! ⭐',
];

function getRandomIndex(max: number, exclude?: number): number {
  if (max <= 1) return 0;
  let idx: number;
  do {
    idx = Math.floor(Math.random() * max);
  } while (idx === exclude);
  return idx;
}

export default function TemplateTypeSelector({ onSelect, onOpenDiagnoser }: Props) {
  const [messageIndex, setMessageIndex] = useState(() => ({
    member: Math.floor(Math.random() * TEAM_MEMBERS.length),
    encouragement: Math.floor(Math.random() * ENCOURAGEMENTS.length),
  }));
  const [isVisible, setIsVisible] = useState(true);

  const rotate = useCallback(() => {
    // 페이드 아웃
    setIsVisible(false);

    // 300ms 후 텍스트 변경 + 페이드 인
    setTimeout(() => {
      setMessageIndex(prev => ({
        member: getRandomIndex(TEAM_MEMBERS.length, prev.member),
        encouragement: getRandomIndex(ENCOURAGEMENTS.length, prev.encouragement),
      }));
      setIsVisible(true);
    }, 300);
  }, []);

  useEffect(() => {
    const interval = setInterval(rotate, 10000);
    return () => clearInterval(interval);
  }, [rotate]);

  return (
    <div className="flex flex-col items-center justify-center h-full -mt-8">
      {/* 인사말 */}
      <div className="text-center mb-12">
        <h2
          className={`text-3xl font-bold text-gray-900 mb-3 transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-blue-600">{TEAM_MEMBERS[messageIndex.member]}</span>님! {ENCOURAGEMENTS[messageIndex.encouragement]}
        </h2>
        <p className="text-gray-500 text-lg">
          사용하실 기능을 선택해주세요
        </p>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl">
        {/* 버튼 O */}
        <button
          onClick={() => onSelect('with_button')}
          className="group p-7 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 text-left cursor-pointer"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
            <span className="text-xl text-blue-600 font-bold">O</span>
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1.5 group-hover:text-blue-600 transition-colors">
            버튼 O 템플릿
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            버튼(웹링크)이 포함된 알림톡
          </p>
        </button>

        {/* 버튼 X */}
        <button
          onClick={() => onSelect('without_button')}
          className="group p-7 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 text-left cursor-pointer"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-5">
            <span className="text-xl text-gray-600 font-bold">X</span>
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1.5 group-hover:text-blue-600 transition-colors">
            버튼 X 템플릿
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            버튼 없이 텍스트만 있는 알림톡
          </p>
        </button>

        {/* 오류 해결 */}
        <button
          onClick={onOpenDiagnoser}
          className="group p-7 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-amber-400 hover:-translate-y-1 transition-all duration-200 text-left cursor-pointer"
        >
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-5">
            <span className="text-xl">🔧</span>
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1.5 group-hover:text-amber-600 transition-colors">
            오류 해결하기
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Braze 발송 오류 진단 및 자동 수정
          </p>
        </button>
      </div>
    </div>
  );
}
