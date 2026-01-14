import React, { useState, useEffect } from 'react';
import { type DetailedStatus } from '@/types/ProjectStructure';

interface AIThinkingOverlayProps {
  status: DetailedStatus | null;
  onCancel?: () => void;
}

const AIThinkingOverlay: React.FC<AIThinkingOverlayProps> = ({ 
  status, 
  onCancel 
}) => {
  const [currentThought, setCurrentThought] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Pensamentos da IA baseados na operação e progresso
  const getAIThoughts = (operation: string, phase: string, progress: number): string[] => {
    const thoughts = {
      'backend': [
        'Analisando os requisitos do sistema...',
        'Pensando na melhor arquitetura para APIs...',
        'Definindo estrutura do banco de dados...',
        'Criando endpoints RESTful seguros...',
        'Implementando validações e middleware...',
        'Configurando autenticação JWT...',
        'Otimizando queries do banco...',
        'Finalizando documentação da API...'
      ],
      'frontend': [
        'Analisando a experiência do usuário...',
        'Pensando no design system ideal...',
        'Criando componentes reutilizáveis...',
        'Implementando responsividade...',
        'Configurando estado global...',
        'Otimizando performance de renderização...',
        'Adicionando animações suaves...',
        'Testando acessibilidade...'
      ],
      'research': [
        'Pesquisando melhores práticas...',
        'Analisando tendências de mercado...',
        'Coletando referências de design...',
        'Estudando casos de uso similares...',
        'Avaliando tecnologias disponíveis...',
        'Compilando insights relevantes...'
      ],
      'analysis': [
        'Analisando estrutura do código...',
        'Identificando padrões e anti-padrões...',
        'Avaliando performance e segurança...',
        'Sugerindo melhorias...',
        'Verificando boas práticas...',
        'Compilando relatório detalhado...'
      ]
    };

    const operationThoughts = thoughts[operation.toLowerCase() as keyof typeof thoughts] || [
      'Processando sua solicitação...',
      'Analisando contexto...',
      'Gerando solução otimizada...',
      'Finalizando implementação...'
    ];

    const thoughtIndex = Math.floor((progress / 100) * operationThoughts.length);
    return operationThoughts.slice(0, Math.max(1, thoughtIndex + 1));
  };

  useEffect(() => {
    if (!status) return;

    const thoughts = getAIThoughts(status.operation, status.phase, status.progress);
    const currentIndex = Math.min(thoughts.length - 1, Math.floor((status.progress / 100) * thoughts.length));
    setCurrentThought(thoughts[currentIndex] || thoughts[0]);
  }, [status]);

  if (!status) return null;

  const elapsed = Math.floor((Date.now() - status.startTime) / 1000);
  const remaining = status.estimatedTime ? Math.max(0, status.estimatedTime - elapsed) : null;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getOperationIcon = (operation: string): string => {
    switch (operation.toLowerCase()) {
      case 'backend': return 'fa-solid fa-server';
      case 'frontend': return 'fa-solid fa-palette';
      case 'research': return 'fa-solid fa-magnifying-glass';
      case 'analysis': return 'fa-solid fa-chart-line';
      default: return 'fa-solid fa-brain';
    }
  };

  const getOperationColor = (operation: string): string => {
    switch (operation.toLowerCase()) {
      case 'backend': return 'purple';
      case 'frontend': return 'green';
      case 'research': return 'blue';
      case 'analysis': return 'orange';
      default: return 'blue';
    }
  };

  const color = getOperationColor(status.operation);
  
  const getBorderColor = (color: string) => {
    switch (color) {
      case 'purple': return 'border-purple-500';
      case 'green': return 'border-green-500';
      case 'blue': return 'border-blue-500';
      case 'orange': return 'border-orange-500';
      default: return 'border-blue-500';
    }
  };

  const getTextColor = (color: string) => {
    switch (color) {
      case 'purple': return 'text-purple-400';
      case 'green': return 'text-green-400';
      case 'blue': return 'text-blue-400';
      case 'orange': return 'text-orange-400';
      default: return 'text-blue-400';
    }
  };

  const getBgColor = (color: string) => {
    switch (color) {
      case 'purple': return 'bg-purple-500';
      case 'green': return 'bg-green-500';
      case 'blue': return 'bg-blue-500';
      case 'orange': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72">
      <div className={`bg-slate-800/95 backdrop-blur-sm border-l-4 ${getBorderColor(color)} rounded-lg shadow-2xl animate-slide-up`}>
        {/* Header Compacto */}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <i className={`${getOperationIcon(status.operation)} ${getTextColor(color)} text-sm`}></i>
              <div className={`absolute -top-1 -right-1 w-2 h-2 ${getBgColor(color)} rounded-full animate-pulse`}></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-200">{status.operation}</span>
              <span className="text-xs text-slate-400">{status.progress}%</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
              title={isExpanded ? 'Minimizar' : 'Ver detalhes'}
            >
              <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}></i>
            </button>
            
            {status.canCancel && onCancel && (
              <button
                onClick={onCancel}
                className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                title="Cancelar"
              >
                <i className="fa-solid fa-times text-xs"></i>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-2 pb-1">
          <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full ${getBgColor(color)} transition-all duration-500 ease-out relative overflow-hidden`}
              style={{ width: `${status.progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
            </div>
          </div>
        </div>

        {/* AI Thinking - Sempre Visível */}
        <div className="px-2 pb-2">
          <div className="flex items-center gap-2 text-xs">
            <i className="fa-solid fa-brain text-blue-400 animate-pulse"></i>
            <span className="text-slate-300 italic">"{currentThought}"</span>
          </div>
        </div>

        {/* Detalhes Expandidos */}
        {isExpanded && (
          <div className="border-t border-slate-700 p-3 space-y-2">
            <div className="text-xs text-slate-400">
              <div className="flex justify-between items-center">
                <span>Fase atual:</span>
                <span className="text-slate-300">{status.phase}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Tempo decorrido:</span>
                <span className="text-slate-300">{formatTime(elapsed)}</span>
              </div>
              {remaining !== null && (
                <div className="flex justify-between items-center">
                  <span>Tempo restante:</span>
                  <span className="text-slate-300">~{formatTime(remaining)}</span>
                </div>
              )}
            </div>

            {/* Pensamentos Anteriores */}
            <div className="text-xs text-slate-500">
              <div className="font-medium text-slate-400 mb-1">Processo de pensamento:</div>
              {getAIThoughts(status.operation, status.phase, status.progress).map((thought, index) => (
                <div key={index} className={`flex items-center gap-2 ${index === getAIThoughts(status.operation, status.phase, status.progress).length - 1 ? 'text-slate-300' : ''}`}>
                  <i className={`fa-solid ${index < getAIThoughts(status.operation, status.phase, status.progress).length - 1 ? 'fa-check' : 'fa-brain'} text-xs ${index < getAIThoughts(status.operation, status.phase, status.progress).length - 1 ? 'text-green-400' : 'text-blue-400'}`}></i>
                  <span>{thought}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        
        .animate-shine {
          animation: shine 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default AIThinkingOverlay;