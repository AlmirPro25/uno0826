
import React from 'react';

interface ModelPlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  onPromptChange: (newPrompt: string) => void;
  onGenerate: () => void;
  baseOutput: string;
  finetunedOutput: string;
  isLoading: boolean;
  selectedBaseModelName: string;
}

const ModelPlaygroundModal: React.FC<ModelPlaygroundModalProps> = ({
  isOpen,
  onClose,
  prompt,
  onPromptChange,
  onGenerate,
  baseOutput,
  finetunedOutput,
  isLoading,
  selectedBaseModelName,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[110] p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="model-playground-title"
    >
      <div className="bg-slate-800 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-slate-100 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 id="model-playground-title" className="text-xl sm:text-2xl font-semibold text-teal-400">
            <i className="fa-solid fa-flask-vial mr-2"></i>Playground de Avaliação de Modelos
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-teal-300 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500" aria-label="Fechar playground">
            <i className="fa-solid fa-times w-5 h-5"></i>
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="playground-prompt" className="block text-sm font-medium text-slate-300 mb-1">
            Prompt de Teste:
          </label>
          <textarea
            id="playground-prompt"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Ex: Crie um card de produto com imagem, título e preço."
            className="w-full p-2 bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none h-24 scrollbar-thin"
            disabled={isLoading}
            rows={3}
          />
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading || !prompt.trim()}
          className="mb-4 w-full sm:w-auto self-start px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-slate-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center justify-center gap-1.5 text-sm"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Gerando...
            </>
          ) : (
            <>
              <i className="fa-solid fa-play w-3 h-3 mr-1"></i>
              Gerar Comparação
            </>
          )}
        </button>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto scrollbar-thin pr-1">
          <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600/70">
            <h3 className="text-sm font-semibold text-slate-300 mb-1.5">Saída: Modelo Base ({selectedBaseModelName})</h3>
            <pre className="text-xs bg-slate-800 p-2 rounded-md text-slate-200 whitespace-pre-wrap break-all h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50">
              {isLoading && !baseOutput ? "Gerando..." : baseOutput || "Aguardando prompt..."}
            </pre>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600/70">
            <h3 className="text-sm font-semibold text-slate-300 mb-1.5">Saída: AIWebWeaver v1 (Finetuned)</h3>
            <pre className="text-xs bg-slate-800 p-2 rounded-md text-slate-200 whitespace-pre-wrap break-all h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50">
              {isLoading && !finetunedOutput ? "Gerando..." : finetunedOutput || "Aguardando prompt..."}
            </pre>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 flex items-center gap-2"
          >
            <i className="fa-solid fa-times"></i>
            Fechar Playground
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelPlaygroundModal;
