
import React from 'react';

export type BrainstormingMode = 
  | 'Section Ideas'
  | 'Color Palettes (CSS Friendly)'
  | 'Feature Suggestions'
  | 'Content Snippets (e.g., Headlines, CTAs)'
  | 'Naming Ideas (e.g., Project, Feature)';

export const brainstormingModes: BrainstormingMode[] = [
  'Section Ideas',
  'Color Palettes (CSS Friendly)',
  'Feature Suggestions',
  'Content Snippets (e.g., Headlines, CTAs)',
  'Naming Ideas (e.g., Project, Feature)',
];

interface BrainstormingModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  onTopicChange: (topic: string) => void;
  mode: BrainstormingMode;
  onModeChange: (mode: BrainstormingMode) => void;
  onGenerate: () => void;
  results: string;
  isLoading: boolean;
}

const BrainstormingModal: React.FC<BrainstormingModalProps> = ({
  isOpen,
  onClose,
  topic,
  onTopicChange,
  mode,
  onModeChange,
  onGenerate,
  results,
  isLoading,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(results)
      .then(() => {
        // Optionally, show a temporary "Copied!" message
        console.log("Brainstorming results copied to clipboard.");
      })
      .catch(err => console.error('Failed to copy brainstorming results: ', err));
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[120] p-4" // Higher z-index than other modals
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="brainstorming-modal-title"
    >
      <div className="bg-slate-800 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col text-slate-100 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 id="brainstorming-modal-title" className="text-xl sm:text-2xl font-semibold text-yellow-400">
            <i className="fa-solid fa-lightbulb mr-2"></i>Assistente de Brainstorming IA
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-yellow-300 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500" 
            aria-label="Fechar modal de brainstorming"
            disabled={isLoading}
          >
            <i className="fa-solid fa-times w-5 h-5"></i>
          </button>
        </div>

        <div className="mb-3">
          <label htmlFor="brainstorm-topic" className="block text-sm font-medium text-slate-300 mb-1">
            Tópico para Brainstorming:
          </label>
          <textarea
            id="brainstorm-topic"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="Ex: um website moderno para uma padaria artesanal, um app de gerenciamento de tarefas para freelancers, um nome para um novo jogo de aventura espacial..."
            className="w-full p-2 bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm resize-none h-20 scrollbar-thin"
            disabled={isLoading}
            rows={3}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="brainstorm-mode" className="block text-sm font-medium text-slate-300 mb-1">
            Modo de Brainstorming:
          </label>
          <select
            id="brainstorm-mode"
            value={mode}
            onChange={(e) => onModeChange(e.target.value as BrainstormingMode)}
            disabled={isLoading}
            className="w-full p-2.5 bg-slate-700 text-slate-100 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm appearance-none"
          >
            {brainstormingModes.map((m) => (
              <option key={m} value={m} className="bg-slate-700 text-slate-100">
                {m}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={onGenerate}
          disabled={isLoading || !topic.trim()}
          className="mb-4 w-full sm:w-auto self-start px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-slate-500 disabled:text-slate-400 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center justify-center gap-1.5 text-sm font-semibold"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Gerando Ideias...
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles w-4 h-4 mr-1"></i>
              Gerar Ideias
            </>
          )}
        </button>

        <div className="flex-grow bg-slate-700/50 p-3 rounded-lg border border-slate-600/70 min-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50 relative">
          <h3 className="text-sm font-semibold text-slate-300 mb-1.5 sr-only">Resultados do Brainstorming:</h3>
          {results && !isLoading && (
             <button
                onClick={handleCopyToClipboard}
                className="absolute top-2 right-2 px-2 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-md text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-50"
                title="Copiar ideias"
                aria-label="Copiar resultados do brainstorming"
              >
                <i className="fa-solid fa-copy mr-1"></i> Copiar
            </button>
          )}
          <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words">
            {isLoading && !results ? "A IA está pensando..." : results || "Suas ideias aparecerão aqui..."}
          </pre>
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

export default BrainstormingModal;
