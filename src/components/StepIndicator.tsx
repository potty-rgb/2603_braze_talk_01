const STEPS = ['정보 입력', '결과 확인', '오류 진단'];

interface Props {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-200 ${
              i <= currentStep
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {i < currentStep ? '✓' : i + 1}
          </div>
          <span
            className={`text-xs font-medium transition-colors ${
              i <= currentStep ? 'text-gray-700' : 'text-gray-400'
            }`}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`w-8 h-0.5 transition-colors ${
                i < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
