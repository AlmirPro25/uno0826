

import React from 'react';
import { marked } from 'marked';

interface ContextualAiPanelProps {
  isOpen: boolean;
  targetElementInfo: { dataAid: string; tagName: string; outerHTML?: string } | null;
  command: string;
  onCommandChange: (command: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isLoadingCommand: boolean;
  errorMessage?: string | null;
  position: { top: number; left: number } | null; 
  quickActions: { label: string; prompt: string }[];
  onQuickActionSelect: (prompt: string) => void;
  onAnalyze: () => void;
  analysisResults: string | null;
  isLoadingAnalysis: boolean;
}

const ContextualAiPanel: React.FC<ContextualAiPanelProps> = ({
  isOpen,
  targetElementInfo,
  command,
  onCommandChange,
  onSubmit,
  onClose,
  isLoadingCommand,
  errorMessage,
  position,
  quickActions,
  onQuickActionSelect,
  onAnalyze,
  analysisResults,
  isLoadingAnalysis,
}) => {
  if (!isOpen || !targetElementInfo) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoadingCommand && !isLoadingAnalysis) {
      e.preventDefault();
      onSubmit();
    }
  };

  const panelStyle: React.CSSProperties = position 
    ? { 
        position: 'absolute', 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        opacity: isOpen ? 1 : 0, 
        transform: isOpen ? 'translateY(0)' : 'translateY(10px) scale(0.95)',
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
        willChange: 'transform, opacity',
      }
    : { 
        position: 'fixed',
        bottom: '1.5rem', 
        right: '1.5rem', 
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
        willChange: 'transform, opacity',
      };

  const isAnyLoading = isLoadingCommand || isLoadingAnalysis;

  const getHtmlAnalysis = () => {
    if (!analysisResults) return '';
    try {
      const dirtyHtml = marked.parse(analysisResults, { gfm: true, breaks: true }) as string;
      // In a real production app, use a sanitizer like DOMPurify here.
      // For this app, we trust the AI output and add target="_blank" for convenience.
      return dirtyHtml.replace(/<a href/g, '<a target="_blank" rel="noopener noreferrer" href');
    } catch (error) {
      console.error("Error parsing Markdown for analysis:", error);
      return "<p>Erro ao renderizar a análise da IA.</p>";
    }
  };


  return (
    <div 
      className="w-full max-w-xs sm:max-w-sm bg-slate-800/80 backdrop-blur-lg border border-slate-600/50 rounded-xl shadow-2xl p-4 z-30 flex flex-col"
      style={panelStyle}
      role="dialog"
      aria-labelledby="contextual-ai-panel-title"
      aria-modal="true"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 id="contextual-ai-panel-title" className="text-sm font-semibold text-sky-400 truncate pr-2">
          Editar: <code className="text-sm bg-slate-700 px-1.5 py-0.5 rounded text-sky-300">&lt;{targetElementInfo.tagName.toLowerCase()}&gt;</code>
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
          aria-label="Fechar painel de IA contextual"
          disabled={isAnyLoading}
        >
          <i className="fa-solid fa-times w-4 h-4"></i>
        </button>
      </div>
      
      {quickActions && quickActions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {quickActions.map(action => (
            <button
              key={action.label}
              onClick={() => onQuickActionSelect(action.prompt)}
              disabled={isAnyLoading}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-sky-300 rounded-md text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 flex items-center gap-1.5"
              title={action.prompt}
            >
              <i className="fa-solid fa-bolt fa-xs"></i>
              {action.label}
            </button>
          ))}
        </div>
      )}

      {errorMessage && (
        <div className="mb-3 p-2 bg-red-500/20 border border-red-500/50 rounded-md">
          <div className="flex items-start gap-2">
            <i className="fa-solid fa-exclamation-triangle text-red-400 mt-0.5"></i>
            <p className="text-xs text-red-300 flex-1">{errorMessage}</p>
          </div>
        </div>
      )}

      <textarea
        value={command}
        onChange={(e) => onCommandChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`O que fazer com <${targetElementInfo.tagName.toLowerCase()}>?`}
        className="w-full h-20 p-2 bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50"
        aria-label="Comando para IA contextual"
        disabled={isAnyLoading}
      />

      <div className="mt-3 flex gap-2">
        <button
          onClick={onSubmit}
          disabled={isAnyLoading || !command.trim()}
          className="flex-1 p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center justify-center gap-1.5 text-sm"
        >
          {isLoadingCommand ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Modificando...
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles w-4 h-4"></i>
              Executar IA
            </>
          )}
        </button>
        <button
            onClick={onAnalyze}
            disabled={isAnyLoading}
            className="flex-1 p-2 bg-teal-500 hover:bg-teal-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-slate-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center justify-center gap-1.5 text-sm"
            title="Pedir à IA para analisar este elemento em busca de melhorias"
        >
            {isLoadingAnalysis ? (
                 <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analisando...
                </>
            ) : (
                <>
                    <i className="fa-solid fa-magnifying-glass-plus w-4 h-4"></i>
                    Analisar com IA
                </>
            )}
        </button>
      </div>
      
      {(isLoadingAnalysis || analysisResults) && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <h4 className="text-xs font-semibold text-slate-300 mb-1.5">Análise da IA:</h4>
          {isLoadingAnalysis && !analysisResults && (
            <p className="text-xs text-slate-400 italic animate-pulse">IA está analisando o elemento...</p>
          )}
          {analysisResults && (
            <div
                className="prose prose-sm prose-invert max-w-none 
                            prose-headings:text-teal-300 prose-strong:text-slate-200 
                            prose-a:text-sky-400 hover:prose-a:text-sky-300
                            prose-code:text-rose-300 prose-code:bg-slate-900/50 prose-code:p-0.5 prose-code:rounded-sm
                            prose-li:marker:text-teal-400 max-h-32 overflow-y-auto scrollbar-thin pr-1"
                dangerouslySetInnerHTML={{ __html: getHtmlAnalysis() }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ContextualAiPanel;
