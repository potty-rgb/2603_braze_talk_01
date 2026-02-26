import type { TemplateSection as SectionType } from '../types';

interface Props {
  section: SectionType;
}

export default function TemplateSection({ section }: Props) {
  if (section.type === 'editable') {
    return (
      <div className="relative border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-3 my-1">
        {section.label && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              {section.label}
            </span>
            {section.description && (
              <span className="text-xs text-blue-500">{section.description}</span>
            )}
          </div>
        )}
        <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-all leading-relaxed">
          {section.content}
        </pre>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 rounded-lg p-3 my-1 opacity-60">
      <pre className="text-xs font-mono text-gray-500 whitespace-pre-wrap break-all leading-relaxed">
        {section.content}
      </pre>
    </div>
  );
}
