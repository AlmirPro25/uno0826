import React from 'react';

export interface DetailedStatus {
  operation: string;
  phase: string;
  message: string;
  progress: number; // 0-100
  estimatedTime?: number; // seconds
  startTime: number;
  canCancel?: boolean;
}

interface DetailedStatusDisplayProps {
  status: DetailedStatus | null;
  onCancel?: () => void;
}

const DetailedStatusDisplay: React.FC<DetailedStatusDisplayProps> = ({ 
  status, 
  onCancel 
}) => {
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
      case 'generation': return 'fa-solid fa-code';
      case 'export': return 'fa-solid fa-download';
      default: return 'fa-solid fa-cog';
    }
  };

  const getPhaseColor = (progress: number): string => {
    if (progress < 25) return 'bg-blue-500';
    if (progress < 50) return 'bg-yellow-500';
    if (progress < 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="mx-2 my-1 p-4 bg-slate-800/95 backdrop-blur-sm border-l-4 border-blue-500 rounded-r-lg shadow-lg animate-slide-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <i className={`${getOperationIcon(status.operation)} text-blue-400 text-lg`}></i>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              {status.operation}
            </h3>
            <p className="text-xs text-slate-400">
              {status.phase}
            </p>
          </div>
        </div>
        
        {status.canCancel && onCancel && (
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
            title="Cancelar operação"
          >
            <i className="fa-solid fa-times text-sm"></i>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-300 font-medium">
            {status.message}
          </span>
          <span className="text-xs text-slate-400">
            {status.progress}%
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full ${getPhaseColor(status.progress)} transition-all duration-500 ease-out relative overflow-hidden`}
            style={{ width: `${status.progress}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
          </div>
        </div>
      </div>

      {/* Time Information */}
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>
          <i className="fa-solid fa-clock mr-1"></i>
          Decorrido: {formatTime(elapsed)}
        </span>
        {remaining !== null && (
          <span>
            <i className="fa-solid fa-hourglass-half mr-1"></i>
            Restante: ~{formatTime(remaining)}
          </span>
        )}
      </div>

      {/* Detailed Phase Messages */}
      {status.operation.toLowerCase() === 'backend' && (
        <div className="mt-3 text-xs text-slate-400 space-y-1">
          <div className={`flex items-center gap-2 ${status.progress > 0 ? 'text-green-400' : ''}`}>
            <i className={`fa-solid ${status.progress > 0 ? 'fa-check' : 'fa-circle'} text-xs`}></i>
            Analisando requisitos do backend
          </div>
          <div className={`flex items-center gap-2 ${status.progress > 25 ? 'text-green-400' : ''}`}>
            <i className={`fa-solid ${status.progress > 25 ? 'fa-check' : 'fa-circle'} text-xs`}></i>
            Criando estrutura de APIs
          </div>
          <div className={`flex items-center gap-2 ${status.progress > 50 ? 'text-green-400' : ''}`}>
            <i className={`fa-solid ${status.progress > 50 ? 'fa-check' : 'fa-circle'} text-xs`}></i>
            Implementando lógica de negócio
          </div>
          <div className={`flex items-center gap-2 ${status.progress > 75 ? 'text-green-400' : ''}`}>
            <i className={`fa-solid ${status.progress > 75 ? 'fa-check' : 'fa-circle'} text-xs`}></i>
            Configurando banco de dados
          </div>
        </div>
      )}

      {status.operation.toLowerCase() === 'frontend' && (
        <div className="mt-3 text-xs text-slate-400 space-y-1">
          <div className={`flex items-center gap-2 ${status.progress > 0 ? 'text-green-400' : ''}`}>
            <i className={`fa-solid ${status.progress > 0 ? 'fa-check' : 'fa-circle'} text-xs`}></i>
            Projetando interface do usuário
          </div>
          <div className={`flex items-center gap-2 ${status.progress > 25 ? 'text-green-400' : ''}`}>
            <i className={`fa-solid ${status.progress > 25 ? 'fa-check' : 'fa-circle'} text-xs`}></i>
            Criando componentes React
          </div>
          <div className={`flex items-center gap-2 ${status.progress > 50 ? 'text-green-400' : ''}`}>
            <i className={`fa-solid ${status.progress > 50 ? 'fa-check' : 'fa-circle'} text-xs`}></i>
            Implementando interações
          </div>
          <div className={`flex items-center gap-2 ${status.progress > 75 ? 'text-green-400' : ''}`}>
            <i className={`fa-solid ${status.progress > 75 ? 'fa-check' : 'fa-circle'} text-xs`}></i>
            Aplicando estilos e responsividade
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
        
        .animate-shine {
          animation: shine 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default DetailedStatusDisplay;