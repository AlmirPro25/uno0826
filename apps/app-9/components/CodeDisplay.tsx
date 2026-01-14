import React, { useState } from 'react';

interface CodeDisplayProps {
  code: string;
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative bg-gray-900 rounded-xl m-2">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
      >
        {copied ? 'Copiado!' : 'Copiar'}
      </button>
      <pre className="p-4 overflow-auto text-sm font-mono text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  );
};