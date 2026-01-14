
import React from 'react';
import { marked } from 'marked';

interface AiCodeInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCode: string | null;
  languageHint: string;
  aiInsightResult: string | null;
  isLoading: boolean;
  onExplain: () => void;
  onRefactor: () => void;
  currentInsightType: 'explanation' | 'refactoring' | null;
}

const AiCodeInsightModal: React.FC<AiCodeInsightModalProps> = ({
  isOpen,
  onClose,
  selectedCode,
  languageHint,
  aiInsightResult,
  isLoading,
  onExplain,
  onRefactor,
  currentInsightType,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const getRenderedInsight = () => {
    if (!aiInsightResult) return '';
    try {
      // Basic sanitizer for security, consider more robust one for production
      // For a production app, use a library like DOMPurify.
      const dirtyHtml = marked.parse(aiInsightResult) as string;
      // Simple link target _blank addition
      const safeHtml = dirtyHtml.replace(/<a href/g, '<a target="_blank" rel="noopener noreferrer" href');
      return safeHtml;
    } catch (error) {
      console.error("Error parsing Markdown for AI insight:", error);
      return "<p>Erro ao renderizar resultado da IA.</p>";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[170] p-4" // Higher z-index
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-code-insight-modal-title"
    >
      <div className="bg-slate-800 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col text-slate-100 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 id="ai-code-insight-modal-title" className="text-xl sm:text-2xl font-semibold text-violet-400">
            <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>AI Code Insight
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-violet-300 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500" 
            aria-label="Fechar modal de insight de código"
            disabled={isLoading}
          >
            <i className="fa-solid fa-times w-5 h-5"></i>
          </button>
        </div>

        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Código Selecionado ({languageHint}):</h3>
          <pre className="p-2.5 bg-slate-700/70 rounded-md text-slate-200 text-xs max-h-40 overflow-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50 border border-slate-600">
            <code>
              {selectedCode || "Nenhum código selecionado."}
            </code>
          </pre>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <button
            onClick={onExplain}
            disabled={isLoading || !selectedCode}
            className="flex-1 p-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center justify-center gap-1.5 text-sm font-medium"
          >
            {isLoading && currentInsightType === 'explanation' ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Explicando...
              </>
            ) : (
              <>
                <i className="fa-solid fa-comment-dots w-4 h-4"></i>
                Explicar este Código
              </>
            )}
          </button>
          <button
            onClick={onRefactor}
            disabled={isLoading || !selectedCode}
            className="flex-1 p-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-slate-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center justify-center gap-1.5 text-sm font-medium"
          >
            {isLoading && currentInsightType === 'refactoring' ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sugerindo...
              </>
            ) : (
              <>
                <i className="fa-solid fa-code-compare w-4 h-4"></i>
                Sugerir Refatorações
              </>
            )}
          </button>
        </div>

        <div className="flex-grow bg-slate-700/50 p-3 rounded-lg border border-slate-600/70 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50 min-h-[200px]">
          <h3 className="text-sm font-semibold text-slate-300 mb-1.5">
            {currentInsightType === 'explanation' ? 'Explicação da IA:' : currentInsightType === 'refactoring' ? 'Sugestões de Refatoração da IA:' : 'Resultado da IA:'}
          </h3>
          {isLoading && !aiInsightResult && (
            <div className="flex flex-col items-center justify-center h-full opacity-70">
                <svg className="animate-spin h-8 w-8 text-violet-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-slate-300 text-xs">IA está processando sua solicitação...</p>
            </div>
          )}
          {aiInsightResult && (
            <div 
              className="prose prose-sm prose-invert max-w-none 
                         prose-headings:text-violet-300 prose-strong:text-slate-200 
                         prose-a:text-sky-400 hover:prose-a:text-sky-300
                         prose-code:text-rose-300 prose-code:bg-slate-800 prose-code:p-0.5 prose-code:rounded-sm prose-code:font-mono
                         prose-li:marker:text-violet-400"
              dangerouslySetInnerHTML={{ __html: getRenderedInsight() }}
            />
          )}
          {!isLoading && !aiInsightResult && (
            <p className="text-slate-400 text-center py-10 italic text-sm">Selecione uma ação (Explicar ou Sugerir Refatoração) para o código acima.</p>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 flex items-center gap-2"
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

export default AiCodeInsightModal;
