
import React from 'react';
import type { AiServicePhase } from '@/services/GeminiService';
import type { BrainstormingMode } from '@/components/BrainstormingModal';
import type { ThemeColors } from '@/components/ThemeCustomizerModal';

export interface LastFailedOperationDetails {
  type: 'ai_command' | 'contextual_edit' | 'code_insight' | 'brainstorm' | 'suggest_theme_colors' | 'apply_theme' | 'fetch_url' | 'critique_site';
  prompt: string;
  servicePhase?: AiServicePhase; // For ai_command
  currentModel: string;
  currentPlan?: string | null; // For ai_command
  currentCode?: string | null; // For ai_command
  initialPlanPromptVal?: string | null; // For ai_command
  isReactLikely?: boolean; // For ai_command
  previousCode: string | null; // General previous code state
  originalErrorMessage: string;
  params?: { // Operation-specific parameters
    // For contextual_edit
    targetDataAid?: string;
    command?: string;
    // For code_insight
    codeSnippet?: string;
    languageHint?: string;
    insightAction?: 'explanation' | 'refactoring';
    // For brainstorm
    topic?: string;
    mode?: BrainstormingMode;
    // For suggest_theme_colors
    description?: string;
    // For apply_theme
    colors?: ThemeColors;
    // For fetch_url
    url?: string;
    // For critique_site (no specific params needed beyond general ones)
  };
}

interface AiErrorFallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastFailedOperationDetails: LastFailedOperationDetails | null;
  onRetrySimplePrompt: () => void;
  onSwitchModelAndRetry: () => void;
  onRevertToLastGoodCode: () => void;
  onContinueManually: () => void;
  canRevert: boolean;
  availableModels: { id: string; name: string }[];
}

const AiErrorFallbackModal: React.FC<AiErrorFallbackModalProps> = ({
  isOpen,
  onClose,
  lastFailedOperationDetails,
  onRetrySimplePrompt,
  onSwitchModelAndRetry,
  onRevertToLastGoodCode,
  onContinueManually,
  canRevert,
  availableModels,
}) => {
  if (!isOpen || !lastFailedOperationDetails) return null;

  const getOperationDescription = () => {
    if (!lastFailedOperationDetails) return "uma operação da IA";
    switch (lastFailedOperationDetails.type) {
        case 'ai_command': return `geração de código/plano com prompt: "${lastFailedOperationDetails.prompt.substring(0, 50)}..."`;
        case 'contextual_edit': return `edição contextual no elemento: "${lastFailedOperationDetails.params?.targetDataAid}"`;
        case 'code_insight': return `obtenção de insight (${lastFailedOperationDetails.params?.insightAction}) para código selecionado`;
        case 'brainstorm': return `brainstorming sobre: "${lastFailedOperationDetails.params?.topic?.substring(0,50)}..."`;
        case 'suggest_theme_colors': return `sugestão de cores para tema: "${lastFailedOperationDetails.params?.description?.substring(0,50)}..."`;
        case 'apply_theme': return `aplicação de tema`;
        case 'fetch_url': return `carregamento de URL: "${lastFailedOperationDetails.params?.url?.substring(0,50)}..."`;
        case 'critique_site': return `crítica do site`;
        default: return "uma operação da IA";
    }
  };

  const currentModelName = availableModels.find(m => m.id === lastFailedOperationDetails.currentModel)?.name || lastFailedOperationDetails.currentModel;
  const nextModelName = () => {
    const currentIndex = availableModels.findIndex(m => m.id === lastFailedOperationDetails.currentModel);
    if (currentIndex === -1 || availableModels.length <= 1) return null;
    return availableModels[(currentIndex + 1) % availableModels.length].name;
  };


  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-90 backdrop-blur-md flex items-center justify-center z-[200] p-4" // Highest z-index
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-error-fallback-modal-title"
    >
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-lg text-slate-100 border-2 border-red-500/50">
        <div className="flex justify-between items-center mb-4">
          <h2 id="ai-error-fallback-modal-title" className="text-xl font-semibold text-red-400 flex items-center">
            <i className="fa-solid fa-triangle-exclamation mr-3 text-red-500 fa-lg"></i>Falha na Solicitação IA
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-red-300 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500" 
            aria-label="Fechar modal de fallback de erro"
          >
            <i className="fa-solid fa-times w-5 h-5"></i>
          </button>
        </div>

        <div className="mb-4 text-sm text-slate-300 space-y-1">
            <p>A {getOperationDescription()} falhou após tentativas.</p>
            <p className="text-xs text-slate-400">Modelo usado: {currentModelName}</p>
            {lastFailedOperationDetails.originalErrorMessage && (
                 <p className="text-xs text-red-400/80 italic mt-1">Detalhe do erro: {lastFailedOperationDetails.originalErrorMessage.substring(0, 150)}</p>
            )}
        </div>

        <div className="space-y-3">
          <button
            onClick={onRetrySimplePrompt}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <i className="fa-solid fa-bolt-lightning"></i>Tentar com Prompt Genérico Simples
          </button>
          
          {availableModels.length > 1 && nextModelName() && (
            <button
              onClick={onSwitchModelAndRetry}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <i className="fa-solid fa-microchip"></i>Tentar com Modelo: {nextModelName()}
            </button>
          )}

          <button
            onClick={onRevertToLastGoodCode}
            disabled={!canRevert}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-rotate-left"></i>Reverter para Último Código Funcional
          </button>

          <button
            onClick={onContinueManually}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <i className="fa-solid fa-pencil-alt"></i>Continuar Editando Manualmente
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-500 hover:bg-slate-400 text-slate-900 rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Fechar Opções
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiErrorFallbackModal;
