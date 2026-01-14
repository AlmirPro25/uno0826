import React, { useState } from 'react';
import { PromptAmplifier, AmplifiedPrompt } from '@/services/PromptAmplifier';

interface PromptAmplificationPanelProps {
  originalPrompt: string;
  onAmplificationComplete: (amplifiedPrompt: string) => void;
  onCancel: () => void;
  currentCode?: string;
}

export const PromptAmplificationPanel: React.FC<PromptAmplificationPanelProps> = ({
  originalPrompt,
  onAmplificationComplete,
  onCancel,
  currentCode
}) => {
  const [isAmplifying, setIsAmplifying] = useState(false);
  const [amplification, setAmplification] = useState<AmplifiedPrompt | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleAmplify = async () => {
    setIsAmplifying(true);
    try {
      const result = await PromptAmplifier.amplifyPrompt(originalPrompt, currentCode);
      setAmplification(result);
    } catch (error) {
      console.error('Erro na amplificação:', error);
    } finally {
      setIsAmplifying(false);
    }
  };

  const handleProceed = () => {
    if (amplification) {
      const optimizedPrompt = PromptAmplifier.generateOptimizedPrompt(amplification, currentCode);
      onAmplificationComplete(optimizedPrompt);
    }
  };

  const handleUseOriginal = () => {
    onAmplificationComplete(originalPrompt);
  };

  // Auto-amplificar quando o componente monta
  React.useEffect(() => {
    if (!amplification && !isAmplifying) {
      handleAmplify();
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-600 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-magic-wand-sparkles text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Amplificação de Prompt</h2>
              <p className="text-sm text-slate-400">Extraindo intenção e expandindo detalhes</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Original Prompt */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <i className="fa-solid fa-comment text-blue-400"></i>
              Prompt Original
            </h3>
            <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
              <p className="text-slate-200">{originalPrompt}</p>
            </div>
          </div>

          {/* Amplification Process */}
          {isAmplifying && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-300">Analisando intenção e expandindo contexto...</p>
              </div>
            </div>
          )}

          {/* Amplification Results */}
          {amplification && !isAmplifying && (
            <>
              {/* Quick Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-bullseye text-green-400"></i>
                    <span className="font-medium text-green-300">Intenção</span>
                  </div>
                  <p className="text-sm text-green-100">{amplification.extractedIntent}</p>
                </div>

                <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 border border-purple-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-user text-purple-400"></i>
                    <span className="font-medium text-purple-300">Perfil</span>
                  </div>
                  <p className="text-sm text-purple-100 capitalize">{amplification.userPersona}</p>
                </div>

                <div className="bg-gradient-to-r from-orange-900/30 to-orange-800/30 border border-orange-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-layer-group text-orange-400"></i>
                    <span className="font-medium text-orange-300">Complexidade</span>
                  </div>
                  <p className="text-sm text-orange-100 capitalize">{amplification.complexityLevel}</p>
                </div>
              </div>

              {/* Amplified Prompt */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-sparkles text-purple-400"></i>
                  Prompt Amplificado
                </h3>
                <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg p-4 border border-purple-500/30">
                  <p className="text-slate-100 leading-relaxed">{amplification.amplified}</p>
                </div>
              </div>

              {/* Detailed Analysis Toggle */}
              <div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <i className={`fa-solid fa-chevron-${showDetails ? 'up' : 'down'}`}></i>
                  {showDetails ? 'Ocultar' : 'Mostrar'} Análise Detalhada
                </button>

                {showDetails && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Context */}
                    {amplification.detectedContext.length > 0 && (
                      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <h4 className="font-medium text-blue-300 mb-2 flex items-center gap-2">
                          <i className="fa-solid fa-sitemap"></i>
                          Contexto Detectado
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {amplification.detectedContext.map((context, index) => (
                            <span key={index} className="bg-blue-900/50 text-blue-200 px-2 py-1 rounded text-sm">
                              {context}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Features */}
                    {amplification.suggestedFeatures.length > 0 && (
                      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <h4 className="font-medium text-green-300 mb-2 flex items-center gap-2">
                          <i className="fa-solid fa-puzzle-piece"></i>
                          Funcionalidades Sugeridas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {amplification.suggestedFeatures.map((feature, index) => (
                            <span key={index} className="bg-green-900/50 text-green-200 px-2 py-1 rounded text-sm">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Technical Requirements */}
                    {amplification.technicalRequirements.length > 0 && (
                      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600 md:col-span-2">
                        <h4 className="font-medium text-yellow-300 mb-2 flex items-center gap-2">
                          <i className="fa-solid fa-cogs"></i>
                          Requisitos Técnicos
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {amplification.technicalRequirements.map((req, index) => (
                            <span key={index} className="bg-yellow-900/50 text-yellow-200 px-2 py-1 rounded text-sm">
                              {req}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scope */}
                    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600 md:col-span-2">
                      <h4 className="font-medium text-purple-300 mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-scope"></i>
                        Escopo Estimado
                      </h4>
                      <p className="text-slate-200 text-sm">{amplification.estimatedScope}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {amplification && !isAmplifying && (
          <div className="p-6 border-t border-slate-600 flex gap-3">
            <button
              onClick={handleProceed}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-rocket"></i>
              Usar Prompt Amplificado
            </button>
            
            <button
              onClick={handleUseOriginal}
              className="px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors border border-slate-600"
            >
              Usar Original
            </button>
            
            <button
              onClick={onCancel}
              className="px-6 py-3 text-slate-400 hover:text-slate-300 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
