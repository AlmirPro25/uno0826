import React from 'react';

interface FloatingStatusIndicatorProps {
  isVisible: boolean;
  message: string;
  progress?: number;
  type?: 'loading' | 'success' | 'error' | 'info';
}

export function FloatingStatusIndicator({
  isVisible,
  message,
  progress,
  type = 'loading'
}: FloatingStatusIndicatorProps) {
  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 border-green-500 text-green-100';
      case 'error':
        return 'bg-red-600 border-red-500 text-red-100';
      case 'info':
        return 'bg-blue-600 border-blue-500 text-blue-100';
      default:
        return 'bg-slate-700 border-slate-600 text-slate-100';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'fa-check-circle';
      case 'error':
        return 'fa-exclamation-triangle';
      case 'info':
        return 'fa-info-circle';
      default:
        return 'fa-spinner fa-spin';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className={`
        px-4 py-3 rounded-lg border-2 shadow-lg backdrop-blur-sm
        max-w-sm min-w-[300px]
        ${getTypeStyles()}
      `}>
        <div className="flex items-center gap-3">
          <i className={`fa-solid ${getIcon()} text-lg flex-shrink-0`}></i>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{message}</p>
            {progress !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-black/20 rounded-full h-1.5">
                  <div 
                    className="bg-current h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                  />
                </div>
                <p className="text-xs opacity-75 mt-1">{Math.round(progress)}% concluído</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para múltiplos status simultâneos
interface MultiStatusIndicatorProps {
  statuses: Array<{
    id: string;
    message: string;
    progress?: number;
    type?: 'loading' | 'success' | 'error' | 'info';
  }>;
}

export function MultiStatusIndicator({ statuses }: MultiStatusIndicatorProps) {
  if (statuses.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {statuses.map((status, index) => (
        <div
          key={status.id}
          className="animate-in slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <FloatingStatusIndicator
            isVisible={true}
            message={status.message}
            progress={status.progress}
            type={status.type}
          />
        </div>
      ))}
    </div>
  );
}