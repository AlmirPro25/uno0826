/**
 * 📊 Execution Progress Component
 * Mostra o progresso detalhado da execução do agente
 */

import React from 'react';
import { CheckCircle2, Circle, Loader2, XCircle, ChevronRight } from 'lucide-react';

interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
}

interface ExecutionProgressProps {
  taskName: string;
  steps: ExecutionStep[];
  progress: number;
  currentStep: string;
  className?: string;
}

export const ExecutionProgress: React.FC<ExecutionProgressProps> = ({
  taskName,
  steps,
  progress,
  currentStep,
  className = ""
}) => {
  const getStepIcon = (status: ExecutionStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />;
      default:
        return <Circle className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStepColor = (status: ExecutionStep['status']) => {
    switch (status) {
      case 'success':
        return 'text-emerald-400';
      case 'error':
        return 'text-red-400';
      case 'running':
        return 'text-indigo-300';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className={`bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          <span className="text-sm font-medium text-slate-200">{taskName}</span>
        </div>
        <span className="text-xs text-slate-400">{Math.round(progress)}%</span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Current Step */}
      <div className="flex items-center gap-2 text-xs text-indigo-300 mb-2">
        <ChevronRight className="w-3 h-3" />
        <span>{currentStep}</span>
      </div>

      {/* Steps List */}
      {steps.length > 0 && (
        <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-700/50">
          {steps.slice(-5).map((step) => (
            <div 
              key={step.id} 
              className={`flex items-center gap-2 text-xs ${getStepColor(step.status)}`}
            >
              {getStepIcon(step.status)}
              <span className="truncate">{step.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Mini version for inline display
 */
export const ExecutionProgressMini: React.FC<{
  currentStep: string;
  progress: number;
}> = ({ currentStep, progress }) => {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
      <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
      <span className="text-xs text-indigo-300 truncate max-w-[200px]">{currentStep}</span>
      <span className="text-[10px] text-indigo-400/60">{Math.round(progress)}%</span>
    </div>
  );
};
