
import React, { useMemo } from 'react';
import { SpeechControls } from './SpeechControls';

interface ExplanationDisplayProps {
  markdown: string;
}

export const ExplanationDisplay: React.FC<ExplanationDisplayProps> = ({ markdown }) => {
  const plainText = useMemo(() => {
    // Converte markdown em texto simples para o leitor de tela
    return markdown
      .replace(/```[\s\S]*?```/g, 'Bloco de código.') // Substitui blocos de código
      .replace(/`[^`]*`/g, '') // Remove código inline
      .replace(/#{1,6}\s/g, '. ') // Converte cabeçalhos em pausas
      .replace(/[\*_]/g, '')     // Remove ênfase (negrito, itálico)
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Extrai texto de links
      .replace(/\n/g, ' ') // Substitui novas linhas por espaços
      .trim();
  }, [markdown]);

  const renderMarkdown = (text: string) => {
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    const lines = text.split('\n');

    const flushList = (key: string) => {
      if (listItems.length > 0) {
        elements.push(<ul key={key} className="list-disc pl-6 my-2 space-y-1">{listItems}</ul>);
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      if (line.startsWith('### ')) {
        flushList(`ul-${index}`);
        elements.push(<h3 key={index} className="text-xl font-semibold mt-6 mb-2 text-purple-300">{line.substring(4)}</h3>);
      } else if (line.startsWith('## ')) {
        flushList(`ul-${index}`);
        elements.push(<h2 key={index} className="text-2xl font-bold mt-8 mb-3 text-purple-300">{line.substring(3)}</h2>);
      } else if (line.startsWith('# ')) {
        flushList(`ul-${index}`);
        elements.push(<h1 key={index} className="text-3xl font-extrabold mt-10 mb-4 text-purple-300">{line.substring(2)}</h1>);
      } else if (line.startsWith('* ')) {
        listItems.push(<li key={index}>{line.substring(2)}</li>);
      } else {
        flushList(`ul-${index}`);
        if (line.trim().length > 0) {
          elements.push(<p key={index} className="my-2 leading-relaxed">{line}</p>);
        }
      }
    });

    flushList('ul-end');

    return elements;
  };

  return (
    <div className="p-4 md:p-6 text-gray-300 prose prose-invert prose-sm max-w-none">
      <SpeechControls textToRead={plainText} />
      {renderMarkdown(markdown)}
    </div>
  );
};