import React from 'react';

interface TwoStageProgressProps {
  stage: 'planning' | 'implementation' | 'complete' | null;
  planningData?: any;
}

export const TwoStageProgress: React.FC<TwoStageProgressProps> = ({ 
  stage, 
  planningData 
}) => {
  if (!stage) return null;

  const stages = [
    {
      id: 'planning',
      name: 'Planejamento',
      icon: '📋',
      description: 'Analisando problema e criando estratégia'
    },
    {
      id: 'implementation', 
      name: 'Implementação',
      icon: '💻',
      description: 'Gerando código com contexto completo'
    },
    {
      id: 'complete',
      name: 'Concluído',
      icon: '🎉',
      description: 'Código gerado com máxima qualidade'
    }
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex(s => s.id === stage);
  };

  const currentIndex = getCurrentStageIndex();

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/30 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
        <h3 className="text-lg font-semibold text-white">
          🧠 Pensamento em Duas Etapas
        </h3>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {stages.map((stageInfo, index) => (
            <div 
              key={stageInfo.id}
              className={`flex items-center gap-2 ${
                index <= currentIndex ? 'text-purple-400' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{stageInfo.icon}</span>
              <span className="text-sm font-medium">{stageInfo.name}</span>
            </div>
          ))}
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${((currentIndex + 1) / stages.length) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Current Stage Info */}
      <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{stages[currentIndex]?.icon}</span>
          <h4 className="font-medium text-white">
            {stages[currentIndex]?.name}
          </h4>
        </div>
        <p className="text-sm text-gray-400 mb-3">
          {stages[currentIndex]?.description}
        </p>

        {/* Planning Results */}
        {stage === 'implementation' && planningData && (
          <div className="mt-4 p-3 bg-purple-900/20 rounded border border-purple-500/30">
            <h5 className="text-sm font-medium text-purple-300 mb-2">
              📋 Plano Criado:
            </h5>
            <div className="text-xs text-gray-300 space-y-1">
              {planningData.analysis && (
                <p>• <strong>Tipo:</strong> {planningData.analysis.problem_type}</p>
              )}
              {planningData.architecture_plan && (
                <p>• <strong>Modelo:</strong> {planningData.architecture_plan.model_type}</p>
              )}
              {planningData.analysis && (
                <p>• <strong>Complexidade:</strong> {planningData.analysis.complexity}</p>
              )}
            </div>
          </div>
        )}

        {/* Loading Animation */}
        {stage !== 'complete' && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-xs text-purple-300">
              Processando...
            </span>
          </div>
        )}
      </div>

      {/* Benefits Info */}
      <div className="mt-4 text-xs text-gray-400">
        <p>
          💡 <strong>Vantagens do pensamento em duas etapas:</strong> 
          Maior contexto, melhor qualidade de código, decisões arquiteturais mais precisas
        </p>
      </div>
    </div>
  );
};