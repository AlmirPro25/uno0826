import React from 'react';
import { marked } from 'marked'; // For rendering Markdown

interface TestSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: string | null;
  isLoading: boolean;
}

const TestSuggestionModal: React.FC<TestSuggestionModalProps> = ({
  isOpen,
  onClose,
  suggestions,
  isLoading,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const getHtmlSuggestions = () => {
    if (!suggestions) return '';
    try {
      // Basic sanitizer for security - replace with DOMPurify in production if HTML is complex
      const dirtyHtml = marked.parse(suggestions) as string;
      const safeHtml = dirtyHtml.replace(/<a href/g, '<a target="_blank" rel="noopener noreferrer" href');
      return safeHtml;
    } catch (error) {
      console.error("Error parsing Markdown for test suggestions:", error);
      return "<p>Erro ao renderizar sugestões de teste.</p>";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[190] p-4" // High z-index
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-suggestion-modal-title"
    >
      <div className="bg-slate-800 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col text-slate-100 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 id="test-suggestion-modal-title" className="text-xl sm:text-2xl font-semibold text-lime-400">
            <i className="fa-solid fa-vial-circle-check mr-2"></i>Sugestões de Teste (IA)
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-lime-300 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-lime-500"
            aria-label="Fechar modal de sugestões de teste"
            disabled={isLoading}
          >
            <i className="fa-solid fa-times w-5 h-5"></i>
          </button>
        </div>

        <div className="flex-grow bg-slate-700/50 p-4 rounded-lg border border-slate-600/70 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <svg className="animate-spin h-10 w-10 text-lime-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-slate-300 text-sm">IA está gerando sugestões de teste...</p>
            </div>
          )}
          {!isLoading && suggestions && (
            <div
              className="prose prose-sm prose-invert max-w-none
                         prose-headings:text-lime-300 prose-strong:text-slate-200
                         prose-a:text-sky-400 hover:prose-a:text-sky-300
                         prose-code:text-rose-300 prose-code:bg-slate-800 prose-code:p-0.5 prose-code:rounded-sm prose-code:font-mono
                         prose-li:marker:text-lime-400"
              dangerouslySetInnerHTML={{ __html: getHtmlSuggestions() }}
            />
          )}
          {!isLoading && !suggestions && (
            <p className="text-slate-400 text-center py-10">Nenhuma sugestão de teste disponível no momento.</p>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 flex items-center gap-2"
            disabled={isLoading}
          >
            <i className="fa-solid fa-times"></i>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestSuggestionModal;
