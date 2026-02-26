import type { TemplateType } from '../types';

interface Props {
  onSelect: (type: TemplateType) => void;
  onOpenDiagnoser: () => void;
}

export default function TemplateTypeSelector({ onSelect, onOpenDiagnoser }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full -mt-8">
      {/* 인사말 */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          안녕하세요! 👋
        </h2>
        <p className="text-gray-500 text-lg">
          무엇을 도와드릴까요?
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
