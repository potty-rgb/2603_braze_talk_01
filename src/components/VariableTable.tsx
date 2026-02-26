import type { ExtractedVariable } from '../types';

interface Props {
  variables: ExtractedVariable[];
  onChange: (updated: ExtractedVariable[]) => void;
}

export default function VariableTable({ variables, onChange }: Props) {
  function handleValueChange(index: number, newValue: string) {
    const updated = [...variables];
    updated[index] = { ...updated[index], matchedValue: newValue };
    onChange(updated);
  }

  function handleNameChange(index: number, newName: string) {
    const updated = [...variables];
    updated[index] = { ...updated[index], englishName: newName, isAutoNamed: false };
    onChange(updated);
  }

  if (variables.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-700 mb-2">
        변수 매칭 결과
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        자동으로 추출된 변수와 값을 확인하세요. 잘못된 경우 직접 수정할 수 있습니다.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 border-b text-gray-600 font-semibold">한글 변수명</th>
              <th className="text-left px-3 py-2 border-b text-gray-600 font-semibold">추출된 값</th>
              <th className="text-left px-3 py-2 border-b text-gray-600 font-semibold">영어 변수명</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((v, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="px-3 py-2 font-mono text-gray-700">
                  {'#{' + v.koreanName + '}'}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={v.matchedValue}
                    onChange={(e) => handleValueChange(i, e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={v.englishName}
                      onChange={(e) => handleNameChange(i, e.target.value)}
                      placeholder="영어 변수명 입력"
                      className={`w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                        !v.englishName ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                      }`}
                    />
                    {!v.englishName && (
                      <span className="text-xs text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                        입력 필요
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
