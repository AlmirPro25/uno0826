import React from 'react';

interface AISpecialistSelectorProps {
  activeSpecialist: 'general' | 'frontend' | 'backend';
  onSpecialistChange: (specialist: 'general' | 'frontend' | 'backend') => void;
  isLoading?: boolean;
  currentEditorStack?: string;
  compact?: boolean;
}

const AISpecialistSelector: React.FC<AISpecialistSelectorProps> = ({
  activeSpecialist,
  onSpecialistChange,
  isLoading = false,
  currentEditorStack,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = React.useState(!compact);
  const specialists = [
    {
      id: 'general' as const,
      name: 'Geral',
      icon: 'fa-solid fa-brain',
      color: 'blue',
      description: 'IA versátil para qualquer tipo de código',
      capabilities: ['HTML/CSS/JS', 'React/Vue/Angular', 'Node.js/Python', 'Banco de dados']
    },
    {
      id: 'frontend' as const,
      name: 'Frontend',
      icon: 'fa-solid fa-palette',
      color: 'green',
      description: 'Especialista em interfaces e experiência do usuário',
      capabilities: ['UI/UX Design', 'Componentes', 'Responsividade', 'Animações']
    },
    {
      id: 'backend' as const,
      name: 'Backend',
      icon: 'fa-solid fa-server',
      color: 'purple',
      description: 'Especialista em APIs e lógica de negócio',
      capabilities: ['APIs RESTful', 'Banco de dados', 'Autenticação', 'Microserviços']
    }
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: {
        active: 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25',
        inactive: 'bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-500/50 hover:bg-slate-600'
      },
      green: {
        active: 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-500/25',
        inactive: 'bg-slate-700 text-slate-300 border-slate-600 hover:border-green-500/50 hover:bg-slate-600'
      },
      purple: {
        active: 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25',
        inactive: 'bg-slate-700 text-slate-300 border-slate-600 hover:border-purple-500/50 hover:bg-slate-600'
      }
    };
    return colors[color as keyof typeof colors][isActive ? 'active' : 'inactive'];
  };

  const getRecommendedSpecialist = (stack?: string): 'general' | 'frontend' | 'backend' | null => {
    if (!stack) return null;
    
    const frontendStacks = ['html5-vanilla', 'react-typescript', 'vue-composition', 'angular-standalone'];
    const backendStacks = ['nodejs-express', 'python-flask', 'python-fastapi', 'php-laravel', 'java-spring', 'csharp-dotnet'];
    
    if (frontendStacks.includes(stack)) return 'frontend';
    if (backendStacks.includes(stack)) return 'backend';
    return null;
  };

  const recommendedSpecialist = getRecommendedSpecialist(currentEditorStack);

  if (compact) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg">
        {/* Header Compacto */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <i className="fa-solid fa-robot text-blue-400"></i>
            IA Especialista
          </h3>
          <div className="flex items-center gap-2">
            {isLoading && (
              <i className="fa-solid fa-spinner fa-spin text-blue-400 text-xs"></i>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
              title={isExpanded ? 'Minimizar' : 'Expandir'}
            >
              <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}></i>
            </button>
          </div>
        </div>

        {/* Seletor Compacto - Sempre Visível */}
        <div className="p-3">
          <div className="flex gap-1">
            {specialists.map((specialist) => {
              const isActive = activeSpecialist === specialist.id;
              const isRecommended = recommendedSpecialist === specialist.id;
              
              return (
                <button
                  key={specialist.id}
                  onClick={() => onSpecialistChange(specialist.id)}
                  disabled={isLoading}
                  className={`relative flex-1 p-2 rounded-md border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    getColorClasses(specialist.color, isActive)
                  }`}
                  title={specialist.description}
                >
                  {isRecommended && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></div>
                  )}
                  
                  <div className="flex flex-col items-center gap-1">
                    <i className={`${specialist.icon} text-sm`}></i>
                    <span className="text-xs font-medium">{specialist.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalhes Expandidos */}
        {isExpanded && (
          <div className="border-t border-slate-700 p-3 space-y-3">
            {/* Recomendação */}
            {recommendedSpecialist && recommendedSpecialist !== activeSpecialist && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-md">
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <i className="fa-solid fa-lightbulb"></i>
                  <span>
                    Recomendado: <strong>{specialists.find(s => s.id === recommendedSpecialist)?.name}</strong>
                  </span>
                  <button
                    onClick={() => onSpecialistChange(recommendedSpecialist)}
                    className="ml-auto text-amber-400 hover:text-amber-300 underline"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}

            {/* Descrição do Especialista Ativo */}
            <div className="text-xs text-slate-400">
              <div className="font-medium text-slate-300 mb-1">
                {specialists.find(s => s.id === activeSpecialist)?.name}
              </div>
              <div className="leading-relaxed">
                {specialists.find(s => s.id === activeSpecialist)?.description}
              </div>
            </div>

            {/* Capacidades */}
            <div className="flex flex-wrap gap-1">
              {specialists.find(s => s.id === activeSpecialist)?.capabilities.map((capability, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-400"
                >
                  {capability}
                </span>
              ))}
            </div>

            {/* Info do Stack */}
            {currentEditorStack && (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <i className="fa-solid fa-layer-group"></i>
                <span>Stack: <strong>{currentEditorStack}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Versão Expandida Original
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <i className="fa-solid fa-robot text-blue-400"></i>
          IA Especialista
        </h3>
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <i className="fa-solid fa-spinner fa-spin"></i>
            Processando...
          </div>
        )}
      </div>

      {/* Recommendation Banner */}
      {recommendedSpecialist && recommendedSpecialist !== activeSpecialist && (
        <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-md">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <i className="fa-solid fa-lightbulb"></i>
            <span>
              Recomendado: <strong>{specialists.find(s => s.id === recommendedSpecialist)?.name}</strong> para este stack
            </span>
            <button
              onClick={() => onSpecialistChange(recommendedSpecialist)}
              className="ml-auto text-amber-400 hover:text-amber-300 underline"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Specialist Buttons */}
      <div className="grid grid-cols-1 gap-2">
        {specialists.map((specialist) => {
          const isActive = activeSpecialist === specialist.id;
          const isRecommended = recommendedSpecialist === specialist.id;
          
          return (
            <button
              key={specialist.id}
              onClick={() => onSpecialistChange(specialist.id)}
              disabled={isLoading}
              className={`relative p-3 rounded-lg border-2 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                getColorClasses(specialist.color, isActive)
              }`}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              )}

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <i className={`${specialist.icon} text-lg`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{specialist.name}</h4>
                    {isActive && (
                      <div className="flex items-center gap-1 text-xs opacity-75">
                        <i className="fa-solid fa-check-circle"></i>
                        <span>Ativo</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs opacity-80 mb-2 leading-relaxed">
                    {specialist.description}
                  </p>
                  
                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1">
                    {specialist.capabilities.map((capability, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-1 rounded-full ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : 'bg-slate-600/50 text-slate-400'
                        }`}
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute inset-0 rounded-lg border-2 border-white/20 pointer-events-none"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Context Information */}
      <div className="mt-3 pt-3 border-t border-slate-700">
        <div className="text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-info-circle"></i>
            <span>A IA especialista influencia como o código é gerado</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-sync-alt"></i>
            <span>Você pode alternar entre especialistas a qualquer momento</span>
          </div>
          {currentEditorStack && (
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-layer-group"></i>
              <span>Stack atual: <strong>{currentEditorStack}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            // TODO: Implementar histórico de especialistas
            console.log('Histórico de especialistas');
          }}
          className="flex-1 py-2 px-3 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
        >
          <i className="fa-solid fa-history mr-1"></i>
          Histórico
        </button>
        <button
          onClick={() => {
            // TODO: Implementar configurações de especialista
            console.log('Configurações de especialista');
          }}
          className="flex-1 py-2 px-3 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
        >
          <i className="fa-solid fa-cog mr-1"></i>
          Configurar
        </button>
      </div>
    </div>
  );
};

export default AISpecialistSelector;