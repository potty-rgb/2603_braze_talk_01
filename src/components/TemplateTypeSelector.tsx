import type { TemplateType } from '../types';

interface Props {
  onSelect: (type: TemplateType) => void;
}

export default function TemplateTypeSelector({ onSelect }: Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          템플릿 유형을 선택하세요
        </h2>
        <p className="text-gray-500 text-sm">
          발송할 알림톡 템플릿에 버튼이 포함되어 있나요?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('with_button')}
          className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left cursor-pointer"
        >
          <div className="text-3xl mb-3">O</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600">
            버튼 O 템플릿
          </h3>
          <p className="text-sm text-gray-500">
            버튼(웹링크)이 포함된 알림톡 템플릿
          </p>
        </button>

        <button
          onClick={() => onSelect('without_button')}
          className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left cursor-pointer"
        >
          <div className="text-3xl mb-3">X</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600">
            버튼 X 템플릿
          </h3>
          <p className="text-sm text-gray-500">
            버튼 없이 텍스트만 있는 알림톡 템플릿
          </p>
        </button>
      </div>
    </div>
  );
}
