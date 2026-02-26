import { useState, useCallback } from 'react';
import type { TemplateType, FormData, ProcessingResult, ExtractedVariable } from './types';
import { processTemplate } from './utils/liquidGenerator';
import StepIndicator from './components/StepIndicator';
import TemplateTypeSelector from './components/TemplateTypeSelector';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';

function App() {
  const [templateType, setTemplateType] = useState<TemplateType | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);

  const currentStep = templateType === null ? 0 : result ? 2 : 1;

  function handleTypeSelect(type: TemplateType) {
    setTemplateType(type);
  }

  function handleBack() {
    setTemplateType(null);
    setFormData(null);
    setResult(null);
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
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="shrink-0 bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-lg font-bold text-gray-900">
            Braze 알림톡 Liquid 변환기
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            알림톡 템플릿을 Braze Liquid 코드로 변환합니다
          </p>
        </div>
      </header>

      <div className="shrink-0 max-w-7xl mx-auto w-full px-4 pt-4 pb-2">
        <StepIndicator currentStep={currentStep} />
      </div>

      <main className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 pb-4">
        {currentStep === 0 ? (
          <TemplateTypeSelector onSelect={handleTypeSelect} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-full">
            {/* 좌측: 입력 폼 */}
            <div className="overflow-y-auto pr-2 scrollbar-thin">
              <InputForm
                templateType={templateType!}
                onSubmit={handleSubmit}
                onBack={handleBack}
              />
            </div>

            {/* 우측: 결과 */}
            <div className="overflow-y-auto pl-2 scrollbar-thin">
              {result ? (
                <ResultDisplay
                  result={result}
                  onVariableChange={handleVariableChange}
                  onReset={handleReset}
                />
              ) : (
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl">
                  <p className="text-gray-400 text-sm">
                    정보를 입력하고 &quot;변환하기&quot;를 클릭하면 결과가 여기에 표시됩니다
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
