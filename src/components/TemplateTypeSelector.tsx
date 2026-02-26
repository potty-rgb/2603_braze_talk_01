import type { TemplateType } from '../types';

interface Props {
  onSelect: (type: TemplateType) => void;
  onOpenDiagnoser: () => void;
}

export default function TemplateTypeSelector({ onSelect, onOpenDiagnoser }: Props) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* 인사말 */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          안녕하세요! 👋
        </h2>
        <p className="text-gray-500 text-base">
          무엇을 도와드릴까요?
        </p>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 버튼 O */}
        <button
          onClick={() => onSelect('with_button')}
          className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all duration-200 text-left cursor-pointer"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
            <span className="text-lg text-blue-600 font-bold">O</span>
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
            버튼 O 템플릿
          </h3>
          <p className="text-sm text-gray-500">
            버튼(웹링크)이 포함된 알림톡
          </p>
        </button>

        {/* 버튼 X */}
        <button
          onClick={() => onSelect('without_button')}
          className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all duration-200 text-left cursor-pointer"
        >
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-lg text-gray-600 font-bold">X</span>
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
            버튼 X 템플릿
          </h3>
          <p className="text-sm text-gray-500">
            버튼 없이 텍스트만 있는 알림톡
          </p>
        </button>

        {/* 오류 해결 */}
        <button
          onClick={onOpenDiagnoser}
          className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-amber-500 transition-all duration-200 text-left cursor-pointer"
        >
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
            <span className="text-lg">🔧</span>
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1 group-hover:text-amber-600 transition-colors">
            오류 해결하기
          </h3>
          <p className="text-sm text-gray-500">
            Braze 발송 오류 진단 및 자동 수정
          </p>
        </button>
      </div>
    </div>
  );
}
