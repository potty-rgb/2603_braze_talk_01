import { useState, useCallback, useEffect } from 'react';
import type { TemplateType, FormData, ProcessingResult, ExtractedVariable } from './types';
import { processTemplate } from './utils/liquidGenerator';
import StepIndicator from './components/StepIndicator';
import TemplateTypeSelector from './components/TemplateTypeSelector';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import ErrorDiagnoser from './components/ErrorDiagnoser';

function App() {
  const [templateType, setTemplateType] = useState<TemplateType | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isDiagnoserOpen, setIsDiagnoserOpen] = useState(false);

  const currentStep = templateType === null ? 0 : result ? 2 : 1;

  // Step 2 (결과) 진입 시 자동으로 ErrorDiagnoser 열기
  useEffect(() => {
    if (currentStep === 2) {
      setIsDiagnoserOpen(true);
    }
  }, [currentStep]);

  function handleTypeSelect(type: TemplateType) {
    setTemplateType(type);
  }

  function handleSubmit(data: FormData) {
    setFormData(data);
    const processingResult = processTemplate(data);
    setResult(processingResult);
  }

  const handleVariableChange = useCallback(
    (updated: ExtractedVariable[]) => {
      if (!formData) return;
      const newResult = processTemplate(formData, updated);
      setResult(newResult);
    },
    [formData],
  );

  function handleReset() {
    setTemplateType(null);
    setFormData(null);
    setResult(null);
    setIsDiagnoserOpen(false);
  }

  function handleCodeFixed(fixedCode: string) {
    if (result) {
      setResult(prev => prev ? { ...prev, liquidCode: fixedCode } : prev);
    }
  }

  function handleOpenDiagnoser() {
    setIsDiagnoserOpen(true);
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Braze 알림톡 Liquid 변환기
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              알림톡 템플릿을 Braze Liquid 코드로 변환합니다
            </p>
          </div>
          {currentStep > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <span>🏠</span>
              <span>처음으로</span>
            </button>
          )}
        </div>
      </header>

      {/* StepIndicator — Step 1 이상에서만 표시 */}
      {currentStep > 0 && (
        <div className="shrink-0 max-w-7xl mx-auto w-full px-4 pt-4 pb-4">
          <StepIndicator currentStep={result ? 2 : 0} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 pb-4">
        {currentStep === 0 ? (
          <div className="flex flex-col h-full">
            <TemplateTypeSelector
              onSelect={handleTypeSelect}
              onOpenDiagnoser={handleOpenDiagnoser}
            />
            {/* 홈 화면 — 카드 아래에 ErrorDiagnoser 표시 */}
            {isDiagnoserOpen && (
              <div className="shrink-0 pt-6 pb-2">
                <ErrorDiagnoser
                  isOpen={isDiagnoserOpen}
                  onToggle={() => setIsDiagnoserOpen(prev => !prev)}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5 h-full">
            {/* 1열: 정보 입력 */}
            <div className="overflow-y-auto scrollbar-thin bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                정보 입력
              </h3>
              <InputForm
                templateType={templateType!}
                onSubmit={handleSubmit}
              />
            </div>

            {/* 2열: 결과 확인 */}
            <div className="overflow-y-auto scrollbar-thin bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${result ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</span>
                결과 확인
              </h3>
              {result ? (
                <ResultDisplay
                  result={result}
                  onVariableChange={handleVariableChange}
                  onReset={handleReset}
                />
              ) : (
                <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-200 rounded-2xl">
                  <p className="text-gray-400 text-sm text-center px-4">
                    정보를 입력하고 &quot;변환하기&quot;를 클릭하면<br />결과가 여기에 표시됩니다
                  </p>
                </div>
              )}
            </div>

            {/* 3열: 오류 진단 */}
            <div className="min-h-0">
              <ErrorDiagnoser
                liquidCode={result?.liquidCode}
                isOpen={true}
                onToggle={() => {}}
                embedded
                onCodeFixed={handleCodeFixed}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
