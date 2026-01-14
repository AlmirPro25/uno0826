import React, { useState, useCallback, useEffect } from 'react';
import { marked } from 'marked';

interface AiCodeDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAnalysis: (problemDescription: string) => void;
  analysisResult: string | null;
  isLoading: boolean;
  initialProblemDescription?: string | null;
}

const AiCodeDoctorModal: React.FC<AiCodeDoctorModalProps> = ({
  isOpen,
  onClose,
  onSubmitAnalysis,
  analysisResult,
  isLoading,
  initialProblemDescription,
}) => {
  const [problemDescription, setProblemDescription] = useState('');

  useEffect(() => {
    if (isOpen && initialProblemDescription) {
      setProblemDescription(initialProblemDescription);
    } else if (!isOpen) {
      setProblemDescription('');
    }
  }, [isOpen, initialProblemDescription]);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  }, [onClose, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problemDescription.trim() && !isLoading) {
      onSubmitAnalysis(problemDescription.trim());
    }
  };

  const getHtmlAnalysis = () => {
    if (!analysisResult) return '';
    try {
      const dirtyHtml = marked.parse(analysisResult) as string;
      const safeHtml = dirtyHtml.replace(/<a href/g, '<a target="_blank" rel="noopener noreferrer" href');
      return safeHtml;
    } catch (error) {
      console.error("Error parsing Markdown for AI Code Doctor analysis:", error);
      return "<p>Erro ao renderizar análise da IA.</p>";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[210] p-4" // Ensure high z-index
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-code-doctor-modal-title"
    >
      <div className="bg-slate-800 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col text-slate-100 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 id="ai-code-doctor-modal-title" className="text-xl sm:text-2xl font-semibold text-red-400">
            <i className="fa-solid fa-user-doctor mr-2"></i>Depurador IA / AI Code Doctor
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-300 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
            aria-label="Fechar modal do Depurador IA"
            disabled={isLoading}
          >
            <i className="fa-solid fa-times w-5 h-5"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="problem-description" className="block text-sm font-medium text-slate-300 mb-1">
              Descreva o Problema ou Cole Erros do Console:
            </label>
            <textarea
              id="problem-description"
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Ex: O botão de login não funciona quando clico nele, e o console mostra 'TypeError: undefined is not a function'..."
              className="w-full p-2.5 bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm min-h-[120px] resize-y scrollbar-thin"
              disabled={isLoading}
              rows={5}
              required
              aria-required="true"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !problemDescription.trim()}
            className="w-full sm:w-auto self-start px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-slate-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center justify-center gap-2 text-sm font-medium"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analisando Problema...
              </>
            ) : (
              <>
                <i className="fa-solid fa-microscope mr-1.5"></i>
                Analisar Problema com IA
              </>
            )}
          </button>
        </form>

        {(isLoading || analysisResult) && (
          <div className="mt-4 pt-4 border-t border-slate-700 flex-grow flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-slate-300 mb-1.5 flex-shrink-0">Análise e Sugestões da IA:</h3>
            <div className="flex-grow bg-slate-700/50 p-3 rounded-lg border border-slate-600/70 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50 min-h-[150px]">
              {isLoading && !analysisResult && (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg className="animate-spin h-8 w-8 text-red-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-slate-300 text-sm">IA Depuradora está investigando...</p>
                </div>
              )}
              {analysisResult && (
                <div
                  className="prose prose-sm prose-invert max-w-none
                             prose-headings:text-red-300 prose-strong:text-slate-200
                             prose-a:text-sky-400 hover:prose-a:text-sky-300
                             prose-code:text-emerald-300 prose-code:bg-slate-800 prose-code:p-0.5 prose-code:rounded-sm prose-code:font-mono
                             prose-li:marker:text-red-400"
                  dangerouslySetInnerHTML={{ __html: getHtmlAnalysis() }}
                />
              )}
            </div>
          </div>
        )}
        
        {!isLoading && !analysisResult && problemDescription && (
            <p className="text-xs text-slate-400 mt-4 text-center italic">
                A análise da IA aparecerá aqui após o envio.
            </p>
        )}


        <div className="mt-auto pt-5 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
            disabled={isLoading}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiCodeDoctorModal;