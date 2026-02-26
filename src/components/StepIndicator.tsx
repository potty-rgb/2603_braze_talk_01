const STEPS = ['타입 선택', '정보 입력', '결과 확인'];

interface Props {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
              i <= currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-xs font-medium ${
              i <= currentStep ? 'text-gray-700' : 'text-gray-400'
            }`}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                i < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
