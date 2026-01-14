/**
 * 🌟 THREE-PHASE PIPELINE PROGRESS
 * 
 * Componente visual para mostrar o progresso das 3 fases
 * e o "bastão" sendo passado entre elas.
 */

import React, { useState, useEffect } from 'react';

export interface PhaseStatus {
  phase: 1 | 2 | 3;
  name: string;
  status: 'waiting' | 'running' | 'completed' | 'error';
  files: string[];
  manifest: string;
  duration?: number;
}

interface ThreePhasePipelineProgressProps {
  phases: PhaseStatus[];
  currentPhase: number;
  isRunning: boolean;
  onClose?: () => void;
}

export const ThreePhasePipelineProgress: React.FC<ThreePhasePipelineProgressProps> = ({
  phases,
  currentPhase,
  isRunning,
  onClose
}) => {
  const [expandedManifest, setExpandedManifest] = useState<number | null>(null);

  const getPhaseIcon = (phase: PhaseStatus) => {
    switch (phase.phase) {
      case 1: return '🏗️';
      case 2: return '🎨';
      case 3: return '📚';
    }
  };

  const getStatusColor = (status: PhaseStatus['status']) => {
    switch (status) {
      case 'waiting': return 'bg-gray-600';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
    }
  };

  const getStatusText = (status: PhaseStatus['status']) => {
    switch (status) {
      case 'waiting': return 'Aguardando';
      case 'running': return 'Executando...';
      case 'completed': return 'Completo';
      case 'error': return 'Erro';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-purple-500/30 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 border-b border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌟</span>
              <div>
                <h2 className="text-xl font-bold text-white">Three-Phase Pipeline</h2>
                <p className="text-sm text-gray-400">3 Chamadas Especializadas</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((num) => (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl
                      ${currentPhase >= num ? 'bg-purple-600' : 'bg-gray-700'}
                      ${currentPhase === num && isRunning ? 'ring-4 ring-purple-400 animate-pulse' : ''}
                    `}
                  >
                    {num === 1 ? '🏗️' : num === 2 ? '🎨' : '📚'}
                  </div>
                  <span className="text-xs text-gray-400 mt-1">
                    {num === 1 ? 'Arquiteto' : num === 2 ? 'Designer' : 'Docs'}
                  </span>
                </div>
                {num < 3 && (
                  <div className="flex-1 mx-2">
                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          currentPhase > num ? 'bg-green-500 w-full' :
                          currentPhase === num && isRunning ? 'bg-purple-500 w-1/2 animate-pulse' :
                          'w-0'
                        }`}
                      />
                    </div>
                    {currentPhase === num && phases[num - 1]?.status === 'completed' && (
                      <div className="text-center mt-1">
                        <span className="text-xs text-yellow-400 animate-bounce inline-block">
                          🏃 Passando bastão...
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Phases Detail */}
        <div className="p-4 overflow-y-auto max-h-[50vh] space-y-4">
          {phases.map((phase, index) => (
            <div
              key={phase.phase}
              className={`rounded-xl border transition-all duration-300 ${
                phase.status === 'running' 
                  ? 'border-purple-500 bg-purple-900/20' 
                  : phase.status === 'completed'
                  ? 'border-green-500/50 bg-green-900/10'
                  : 'border-gray-700 bg-gray-800/50'
              }`}
            >
              {/* Phase Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getPhaseIcon(phase)}</span>
                  <div>
                    <h3 className="font-semibold text-white">
                      Fase {phase.phase}: {phase.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(phase.status)}`} />
                      <span className="text-sm text-gray-400">{getStatusText(phase.status)}</span>
                      {phase.duration && (
                        <span className="text-xs text-gray-500">
                          ({(phase.duration / 1000).toFixed(1)}s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {phase.status === 'running' && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-purple-400">Gerando...</span>
                  </div>
                )}
              </div>

              {/* Files Generated */}
              {phase.files.length > 0 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-gray-500 mb-2">📁 Arquivos gerados:</p>
                  <div className="flex flex-wrap gap-2">
                    {phase.files.map((file, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Manifest (Bastão) */}
              {phase.manifest && phase.status === 'completed' && index < phases.length - 1 && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => setExpandedManifest(expandedManifest === phase.phase ? null : phase.phase)}
                    className="flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    <span>🏃</span>
                    <span>Ver bastão para Fase {phase.phase + 1}</span>
                    <span>{expandedManifest === phase.phase ? '▼' : '▶'}</span>
                  </button>
                  
                  {expandedManifest === phase.phase && (
                    <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-400">📋</span>
                        <span className="text-sm font-semibold text-yellow-400">
                          Manifesto (Bastão) para Fase {phase.phase + 1}
                        </span>
                      </div>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                        {phase.manifest}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {isRunning ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  Pipeline em execução...
                </span>
              ) : phases.every(p => p.status === 'completed') ? (
                <span className="text-green-400">✅ Pipeline completo!</span>
              ) : (
                <span>Aguardando início...</span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {phases.filter(p => p.status === 'completed').length}/3 fases completas
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook para usar o pipeline com estado
export const useThreePhasePipeline = () => {
  const [phases, setPhases] = useState<PhaseStatus[]>([
    { phase: 1, name: 'Arquiteto Universal', status: 'waiting', files: [], manifest: '' },
    { phase: 2, name: 'Designer Supremo', status: 'waiting', files: [], manifest: '' },
    { phase: 3, name: 'Documentador', status: 'waiting', files: [], manifest: '' },
  ]);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const startPhase = (phaseNum: 1 | 2 | 3) => {
    setCurrentPhase(phaseNum);
    setIsRunning(true);
    setPhases(prev => prev.map(p => 
      p.phase === phaseNum ? { ...p, status: 'running' } : p
    ));
  };

  const completePhase = (phaseNum: 1 | 2 | 3, files: string[], manifest: string, duration: number) => {
    setPhases(prev => prev.map(p => 
      p.phase === phaseNum ? { ...p, status: 'completed', files, manifest, duration } : p
    ));
    if (phaseNum === 3) {
      setIsRunning(false);
    }
  };

  const errorPhase = (phaseNum: 1 | 2 | 3) => {
    setPhases(prev => prev.map(p => 
      p.phase === phaseNum ? { ...p, status: 'error' } : p
    ));
    setIsRunning(false);
  };

  const reset = () => {
    setPhases([
      { phase: 1, name: 'Arquiteto Universal', status: 'waiting', files: [], manifest: '' },
      { phase: 2, name: 'Designer Supremo', status: 'waiting', files: [], manifest: '' },
      { phase: 3, name: 'Documentador', status: 'waiting', files: [], manifest: '' },
    ]);
    setCurrentPhase(0);
    setIsRunning(false);
  };

  return {
    phases,
    currentPhase,
    isRunning,
    startPhase,
    completePhase,
    errorPhase,
    reset
  };
};

export default ThreePhasePipelineProgress;
