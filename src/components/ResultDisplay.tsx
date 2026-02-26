import type { ProcessingResult, ExtractedVariable } from '../types';
import TemplateSection from './TemplateSection';
import VariableTable from './VariableTable';
import CopyButton from './CopyButton';

interface Props {
  result: ProcessingResult;
  onVariableChange: (updated: ExtractedVariable[]) => void;
  onReset: () => void;
}

export default function ResultDisplay({ result, onVariableChange, onReset }: Props) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-800">변환 결과</h2>
        <div className="flex items-center gap-2">
          <CopyButton text={result.liquidCode} />
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            다시 시작
          </button>
        </div>
      </div>

      {/* 변수 매칭 테이블 */}
      <VariableTable
        variables={result.variables}
        onChange={onVariableChange}
      />

      {/* 범례 */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-l-2 border-blue-500 bg-blue-50 rounded-sm" />
          <span>확인 필요 영역</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-200 rounded-sm opacity-60" />
          <span>고정 템플릿 (수정 불필요)</span>
        </div>
      </div>

      {/* 전체 템플릿 미리보기 */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="p-4 space-y-0">
          {result.sections.map((section) => (
            <TemplateSection key={section.id} section={section} />
          ))}
        </div>
      </div>

      {/* 하단 복사 버튼 */}
      <div className="mt-4 flex justify-center">
        <CopyButton text={result.liquidCode} />
      </div>
    </div>
  );
}
