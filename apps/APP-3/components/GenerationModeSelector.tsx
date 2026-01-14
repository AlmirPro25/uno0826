/**
 * 🎛️ GENERATION MODE SELECTOR
 * 
 * Componente para selecionar o modo de geração:
 * - Auto: Sistema decide automaticamente baseado na complexidade
 * - Single (1 chamada): Rápido, gera tudo de uma vez
 * - Enterprise (5 chamadas): Detalhado, múltiplas fases especializadas
 */

import React from 'react';
import { useAppStore } from '../store/useAppStore';

interface GenerationModeSelectorProps {
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const GenerationModeSelector: React.FC<GenerationModeSelectorProps> = ({
  compact = false,
  showLabel = true,
  className = ''
}) => {
  const { generationMode, setGenerationMode } = useAppStore();

  const modes = [
    { 
      value: 'auto' as const, 
      label: 'Auto', 
      icon: '🔄',
      description: 'Sistema decide baseado na complexidade',
      shortDesc: 'Automático'
    },
    { 
      value: 'single' as const, 
      label: '1 Chamada', 
      icon: '⚡',
      description: 'Rápido - Gera tudo de uma vez',
      shortDesc: 'Rápido'
    },
    { 
      value: 'enterprise' as const, 
      label: '5 Chamadas', 
      icon: '🏢',
      description: 'Detalhado - 5 fases especializadas',
      shortDesc: 'Detalhado'
    }
  ];

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setGenerationMode(mode.value)}
            className={`
              px-2 py-1 text-xs rounded-md transition-all
              ${generationMode === mode.value 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }
            `}
            title={mode.description}
          >
            {mode.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {showLabel && (
        <label className="text-xs text-slate-400 font-medium">
          🎛️ Modo de Geração
        </label>
      )}
      
      <div className="flex items-center gap-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setGenerationMode(mode.value)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all
              ${generationMode === mode.value 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25' 
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600'
              }
            `}
            title={mode.description}
          >
            <span>{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>
      
      {/* Descrição do modo atual */}
      <p className="text-xs text-slate-500">
        {modes.find(m => m.value === generationMode)?.description}
      </p>
    </div>
  );
};

/**
 * Versão inline para usar na barra de comandos
 */
export const GenerationModeInline: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { generationMode, setGenerationMode } = useAppStore();

  const cycleMode = () => {
    const modes: Array<'auto' | 'single' | 'enterprise'> = ['auto', 'single', 'enterprise'];
    const currentIndex = modes.indexOf(generationMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setGenerationMode(modes[nextIndex]);
  };

  const modeInfo = {
    auto: { icon: '🔄', label: 'Auto', color: 'text-blue-400' },
    single: { icon: '⚡', label: '1x', color: 'text-green-400' },
    enterprise: { icon: '🏢', label: '5x', color: 'text-purple-400' }
  };

  const current = modeInfo[generationMode];

  return (
    <button
      onClick={cycleMode}
      className={`
        flex items-center gap-1 px-2 py-1 text-xs rounded-md
        bg-slate-700/50 hover:bg-slate-600/50 transition-all
        border border-slate-600 ${current.color} ${className}
      `}
      title={`Modo: ${generationMode} - Clique para alternar`}
    >
      <span>{current.icon}</span>
      <span>{current.label}</span>
    </button>
  );
};

export default GenerationModeSelector;
