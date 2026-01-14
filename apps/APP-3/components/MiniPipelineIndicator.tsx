/**
 * 🌟 MINI PIPELINE INDICATOR - ENTERPRISE EDITION
 * 
 * Indicador discreto e elegante que mostra a fase atual do pipeline.
 * Suporta 3, 4 ou 5 fases (modo enterprise multi-chamadas).
 * 
 * Design: Mini badge com bolinhas que acendem conforme progresso
 * 
 * FASES:
 * 1. 🧠 Arquiteto - Blueprint, contratos, schema
 * 2. ⚙️ Backend - APIs, services, auth
 * 3. 🎨 Frontend - UI, componentes, páginas
 * 4. 🔗 Integração - Conexão front-back
 * 5. 📚 DevOps - Docker, CI/CD, docs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { pipelineEvents, type PipelinePhase, type PipelineMode, type PipelineStatus, PIPELINE_PHASES } from '../services/PipelineEvents';

export interface MiniPipelinePhaseState {
  id: PipelinePhase;
  status: PipelineStatus;
}

interface MiniPipelineIndicatorProps {
  isVisible: boolean;
  currentPhase: number;
  phases: MiniPipelinePhaseState[];
  mode?: PipelineMode;
  onClick?: () => void;
}

export const MiniPipelineIndicator: React.FC<MiniPipelineIndicatorProps> = ({
  isVisible,
  currentPhase,
  phases,
  mode = 1,
  onClick
}) => {
  if (!isVisible || mode === 1) return null;

  const getPhaseStyle = (phase: MiniPipelinePhaseState) => {
    switch (phase.status) {
      case 'completed':
        return 'bg-green-500 shadow-green-500/50 shadow-sm';
      case 'running':
        return 'bg-purple-500 animate-pulse shadow-purple-500/50 shadow-lg';
      case 'paused':
        return 'bg-yellow-500 shadow-yellow-500/50 shadow-sm';
      case 'error':
        return 'bg-red-500 shadow-red-500/50 shadow-sm';
      default:
        return 'bg-gray-600';
    }
  };

  const getPhaseInfo = (id: number) => {
    return PIPELINE_PHASES.find(p => p.id === id) || { emoji: '○', name: '' };
  };

  const completedCount = phases.filter(p => p.status === 'completed').length;
  const runningPhase = phases.find(p => p.status === 'running');
  const pausedPhase = phases.find(p => p.status === 'paused');
  const activePhase = runningPhase || pausedPhase;

  // Filtrar fases baseado no modo
  const activePhasesForMode = pipelineEvents.getPhasesForMode(mode);
  const visiblePhases = phases.filter(p => activePhasesForMode.includes(p.id));

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 backdrop-blur-sm rounded-full border border-purple-500/30 cursor-pointer hover:border-purple-500/60 transition-all group"
      onClick={onClick}
      title={`Pipeline Enterprise - ${mode} Fases - Clique para detalhes`}
    >
      {/* Ícone animado */}
      <div className="relative">
        <span className="text-sm">
          {activePhase ? getPhaseInfo(activePhase.id).emoji : '🌟'}
        </span>
        {runningPhase && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-ping" />
        )}
        {pausedPhase && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />
        )}
      </div>

      {/* Mini progress dots */}
      <div className="flex items-center gap-1">
        {visiblePhases.map((phase) => (
          <div
            key={phase.id}
            className={`w-2 h-2 rounded-full transition-all ${getPhaseStyle(phase)}`}
            title={`${getPhaseInfo(phase.id).name}: ${phase.status}`}
          />
        ))}
      </div>

      {/* Status text - aparece no hover */}
      <span className="text-xs text-gray-300 hidden group-hover:inline-block transition-all whitespace-nowrap">
        {activePhase ? getPhaseInfo(activePhase.id).name : 'Completo'}
      </span>

      {/* Progress fraction */}
      <span className="text-xs text-purple-400 font-medium">
        {completedCount}/{mode}
      </span>

      {/* Indicador de pausa */}
      {pausedPhase && (
        <span className="text-xs text-yellow-400">⏸️</span>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: useMiniPipeline - Gerencia estado do indicador
// ═══════════════════════════════════════════════════════════════════════════════

interface MiniPipelineState {
  isVisible: boolean;
  currentPhase: number;
  mode: PipelineMode;
  phases: MiniPipelinePhaseState[];
}

export const useMiniPipeline = () => {
  const [state, setState] = useState<MiniPipelineState>({
    isVisible: false,
    currentPhase: 0,
    mode: 1,
    phases: [
      { id: 1, status: 'waiting' },
      { id: 2, status: 'waiting' },
      { id: 3, status: 'waiting' },
      { id: 4, status: 'waiting' },
      { id: 5, status: 'waiting' },
    ]
  });

  // Escutar eventos do pipeline
  useEffect(() => {
    const unsubscribe = pipelineEvents.subscribe((data) => {
      setState(prev => {
        const newPhases = prev.phases.map(p => 
          p.id === data.phase ? { ...p, status: data.status } : p
        ) as MiniPipelinePhaseState[];
        
        const isVisible = data.mode > 1 && (
          data.status === 'running' || 
          data.status === 'paused' ||
          newPhases.some(p => p.status === 'running' || p.status === 'paused')
        );
        
        return {
          isVisible,
          currentPhase: data.phase,
          mode: data.mode,
          phases: newPhases
        };
      });
    });

    return () => unsubscribe();
  }, []);

  const show = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: true }));
  }, []);

  const hide = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false }));
  }, []);

  const startPhase = useCallback((phaseId: PipelinePhase, mode: PipelineMode = 3) => {
    setState(prev => {
      const activePhasesForMode = pipelineEvents.getPhasesForMode(mode);
      return {
        ...prev,
        isVisible: true,
        currentPhase: phaseId,
        mode,
        phases: prev.phases.map(p => ({
          ...p,
          status: p.id === phaseId ? 'running' : 
                  activePhasesForMode.includes(p.id) && p.id < phaseId ? 'completed' : 
                  'waiting'
        })) as MiniPipelinePhaseState[]
      };
    });
  }, []);

  const completePhase = useCallback((phaseId: PipelinePhase) => {
    setState(prev => {
      const activePhasesForMode = pipelineEvents.getPhasesForMode(prev.mode);
      const currentIndex = activePhasesForMode.indexOf(phaseId);
      const nextPhase = currentIndex < activePhasesForMode.length - 1 
        ? activePhasesForMode[currentIndex + 1] 
        : phaseId;
      
      return {
        ...prev,
        currentPhase: nextPhase,
        phases: prev.phases.map(p => ({
          ...p,
          status: p.id === phaseId ? 'completed' : 
                  p.id === nextPhase && nextPhase !== phaseId ? 'running' : 
                  p.status
        })) as MiniPipelinePhaseState[]
      };
    });
  }, []);

  const pausePhase = useCallback((phaseId: PipelinePhase) => {
    setState(prev => ({
      ...prev,
      phases: prev.phases.map(p => ({
        ...p,
        status: p.id === phaseId ? 'paused' : p.status
      })) as MiniPipelinePhaseState[]
    }));
  }, []);

  const resumePhase = useCallback((phaseId: PipelinePhase) => {
    setState(prev => ({
      ...prev,
      phases: prev.phases.map(p => ({
        ...p,
        status: p.id === phaseId ? 'running' : p.status
      })) as MiniPipelinePhaseState[]
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isVisible: false,
      currentPhase: 0,
      mode: 1,
      phases: [
        { id: 1, status: 'waiting' },
        { id: 2, status: 'waiting' },
        { id: 3, status: 'waiting' },
        { id: 4, status: 'waiting' },
        { id: 5, status: 'waiting' },
      ]
    });
  }, []);

  return {
    ...state,
    show,
    hide,
    startPhase,
    completePhase,
    pausePhase,
    resumePhase,
    reset
  };
};

export default MiniPipelineIndicator;
