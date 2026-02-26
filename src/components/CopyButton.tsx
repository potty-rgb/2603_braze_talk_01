import { useState } from 'react';

interface Props {
  text: string;
}

export default function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 폴백: textarea 선택 복사
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
        copied
          ? 'bg-green-500 text-white'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {copied ? '복사됨!' : '전체 복사'}
    </button>
  );
}
