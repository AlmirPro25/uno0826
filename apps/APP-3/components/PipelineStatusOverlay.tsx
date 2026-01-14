/**
 * 🌟 PIPELINE STATUS OVERLAY
 * 
 * Overlay simples para mostrar o progresso das 3 fases do pipeline
 * na interface do AI Web Weaver.
 * 
 * USO:
 * 1. Importar no App.tsx ou onde precisar
 * 2. Usar o hook usePipelineStatus para controlar
 * 3. Renderizar <PipelineStatusOverlay /> quando ativo
 */

import * as React from 'react';
const { useState, useCallback } = React;

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface PipelinePhase {
  id: 1 | 2 | 3;
  name: string;
  icon: string;
  status: 'waiting' | 'running' | 'completed' | 'error';
  files: string[];
  manifest: string;
  startTime?: number;
  endTime?: number;
}

export interface PipelineState {
  isActive: boolean;
  currentPhase: number;
  phases: PipelinePhase[];
  userPrompt: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK PARA CONTROLAR O PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════

export const usePipelineStatus = () => {
  const [state, setState] = useState<PipelineState>({
    isActive: false,
    currentPhase: 0,
    phases: [
      { id: 1, name: 'Arquiteto Universal', icon: '🏗️', status: 'waiting', files: [], manifest: '' },
      { id: 2, name: 'Designer Supremo', icon: '🎨', status: 'waiting', files: [], manifest: '' },
      { id: 3, name: 'Documentador', icon: '📚', status: 'waiting', files: [], manifest: '' },
    ],
    userPrompt: ''
  });

  const startPipeline = useCallback((prompt: string) => {
    setState({
      isActive: true,
      currentPhase: 1,
      phases: [
        { id: 1, name: 'Arquiteto Universal', icon: '🏗️', status: 'running', files: [], manifest: '', startTime: Date.now() },
        { id: 2, name: 'Designer Supremo', icon: '🎨', status: 'waiting', files: [], manifest: '' },
        { id: 3, name: 'Documentador', icon: '📚', status: 'waiting', files: [], manifest: '' },
      ],
      userPrompt: prompt
    });
  }, []);

  const completePhase = useCallback((phaseId: 1 | 2 | 3, files: string[], manifest: string) => {
    setState(prev => ({
      ...prev,
      currentPhase: phaseId < 3 ? phaseId + 1 : phaseId,
      phases: prev.phases.map(p => {
        if (p.id === phaseId) {
          return { ...p, status: 'completed', files, manifest, endTime: Date.now() };
        }
        if (p.id === phaseId + 1) {
          return { ...p, status: 'running', startTime: Date.now() };
        }
        return p;
      })
    }));
  }, []);

  const errorPhase = useCallback((phaseId: 1 | 2 | 3, error: string) => {
    setState(prev => ({
      ...prev,
      phases: prev.phases.map(p => 
        p.id === phaseId ? { ...p, status: 'error', manifest: error } : p
      )
    }));
  }, []);

  const closePipeline = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  const resetPipeline = useCallback(() => {
    setState({
      isActive: false,
      currentPhase: 0,
      phases: [
        { id: 1, name: 'Arquiteto Universal', icon: '🏗️', status: 'waiting', files: [], manifest: '' },
        { id: 2, name: 'Designer Supremo', icon: '🎨', status: 'waiting', files: [], manifest: '' },
        { id: 3, name: 'Documentador', icon: '📚', status: 'waiting', files: [], manifest: '' },
      ],
      userPrompt: ''
    });
  }, []);

  return {
    ...state,
    startPipeline,
    completePhase,
    errorPhase,
    closePipeline,
    resetPipeline
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE OVERLAY
// ═══════════════════════════════════════════════════════════════════════════════

interface PipelineStatusOverlayProps {
  state: PipelineState;
  onClose: () => void;
}

export const PipelineStatusOverlay: React.FC<PipelineStatusOverlayProps> = ({ state, onClose }) => {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  if (!state.isActive) return null;

  const getStatusColor = (status: PipelinePhase['status']) => {
    switch (status) {
      case 'waiting': return 'bg-gray-600 text-gray-300';
      case 'running': return 'bg-blue-500 text-white animate-pulse';
      case 'completed': return 'bg-green-500 text-white';
      case 'error': return 'bg-red-500 text-white';
    }
  };

  const getStatusText = (status: PipelinePhase['status']) => {
    switch (status) {
      case 'waiting': return 'Aguardando';
      case 'running': return 'Executando...';
      case 'completed': return '✓ Completo';
      case 'error': return '✗ Erro';
    }
  };

  const getDuration = (phase: PipelinePhase) => {
    if (!phase.startTime) return '';
    const end = phase.endTime || Date.now();
    const seconds = ((end - phase.startTime) / 1000).toFixed(1);
    return `${seconds}s`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <div className="bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-purple-500/40 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 px-4 py-3 border-b border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌟</span>
              <span className="font-bold text-white">Pipeline 3 Fases</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {state.phases.map((phase, index) => (
              <React.Fragment key={phase.id}>
                {/* Phase Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all
                      ${phase.status === 'completed' ? 'bg-green-500' : 
                        phase.status === 'running' ? 'bg-purple-500 ring-2 ring-purple-300 animate-pulse' :
                        phase.status === 'error' ? 'bg-red-500' : 'bg-gray-700'}
                    `}
                  >
                    {phase.icon}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 text-center max-w-[60px] truncate">
                    {phase.name.split(' ')[0]}
                  </span>
                </div>

                {/* Connector Line */}
                {index < 2 && (
                  <div className="flex-1 mx-1 relative">
                    <div className="h-0.5 bg-gray-700 rounded-full">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          state.phases[index].status === 'completed' ? 'bg-green-500 w-full' :
                          state.phases[index].status === 'running' ? 'bg-purple-500 w-1/2' : 'w-0'
                        }`}
                      />
                    </div>
                    {/* Bastão Animation */}
                    {state.phases[index].status === 'completed' && state.phases[index + 1]?.status === 'running' && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="text-xs text-yellow-400 animate-bounce inline-block">🏃</span>
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Phase Details */}
        <div className="max-h-64 overflow-y-auto">
          {state.phases.map((phase) => (
            <div
              key={phase.id}
              className={`border-b border-gray-800 last:border-b-0 transition-colors ${
                phase.status === 'running' ? 'bg-purple-900/20' : ''
              }`}
            >
              <div
                className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-800/50"
                onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              >
                <div className="flex items-center gap-2">
                  <span>{phase.icon}</span>
                  <span className="text-sm text-white">{phase.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {phase.status === 'running' && (
                    <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(phase.status)}`}>
                    {getStatusText(phase.status)}
                  </span>
                  {getDuration(phase) && (
                    <span className="text-xs text-gray-500">{getDuration(phase)}</span>
                  )}
                  <span className="text-gray-500 text-xs">
                    {expandedPhase === phase.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedPhase === phase.id && (
                <div className="px-4 pb-3 space-y-2">
                  {/* Files */}
                  {phase.files.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">📁 Arquivos:</p>
                      <div className="flex flex-wrap gap-1">
                        {phase.files.slice(0, 5).map((file, i) => (
                          <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                            {file}
                          </span>
                        ))}
                        {phase.files.length > 5 && (
                          <span className="text-xs text-gray-500">+{phase.files.length - 5} mais</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Manifest (Bastão) */}
                  {phase.manifest && phase.status === 'completed' && phase.id < 3 && (
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-2">
                      <p className="text-xs text-yellow-400 mb-1 flex items-center gap-1">
                        <span>🏃</span>
                        <span>Bastão para Fase {phase.id + 1}:</span>
                      </p>
                      <pre className="text-[10px] text-gray-300 whitespace-pre-wrap max-h-20 overflow-y-auto">
                        {phase.manifest.substring(0, 300)}
                        {phase.manifest.length > 300 && '...'}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-900/50 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {state.phases.filter(p => p.status === 'completed').length}/3 completas
            </span>
            {state.phases.every(p => p.status === 'completed') && (
              <span className="text-green-400">✅ Pipeline finalizado!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineStatusOverlay;
