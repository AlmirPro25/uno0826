/**
 * 📍 PhaseIndicator - Indicador da fase atual da colaboração
 */

import React from 'react';
import { motion } from 'framer-motion';

type Phase = 'planning' | 'contracting' | 'executing' | 'integrating' | 'reviewing' | 'done';

interface PhaseIndicatorProps {
  currentPhase: Phase;
}

const phases: { id: Phase; label: string; icon: string }[] = [
  { id: 'planning', label: 'Planejamento', icon: '🎯' },
  { id: 'contracting', label: 'Contratos', icon: '📜' },
  { id: 'executing', label: 'Execução', icon: '⚡' },
  { id: 'integrating', label: 'Integração', icon: '🔧' },
  { id: 'reviewing', label: 'Revisão', icon: '🔍' },
  { id: 'done', label: 'Concluído', icon: '✅' }
];

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ currentPhase }) => {
  const currentIndex = phases.findIndex(p => p.id === currentPhase);

  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span>📍</span> Fase da Colaboração
      </h3>
      
      <div className="flex items-center justify-between">
        {phases.map((phase, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isPending = index > currentIndex;

          return (
            <React.Fragment key={phase.id}>
              {/* Phase circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isActive ? 'bg-blue-500 ring-4 ring-blue-500/30' : ''}
                    ${isCompleted ? 'bg-green-500' : ''}
                    ${isPending ? 'bg-gray-700' : ''}
                  `}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <span className="text-lg">{phase.icon}</span>
                </motion.div>
                <span className={`
                  text-xs mt-1
                  ${isActive ? 'text-blue-400 font-semibold' : ''}
                  ${isCompleted ? 'text-green-400' : ''}
                  ${isPending ? 'text-gray-500' : ''}
                `}>
                  {phase.label}
                </span>
              </div>
              
              {/* Connector line */}
              {index < phases.length - 1 && (
                <div className={`
                  flex-1 h-1 mx-2 rounded
                  ${index < currentIndex ? 'bg-green-500' : 'bg-gray-700'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default PhaseIndicator;
