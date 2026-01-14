/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      👁️ CANVAS GOD VIEW - Integrado ao Preview do Sistema 👁️               ║
 * ║                                                                              ║
 * ║         "Veja a colméia trabalhando enquanto seu código nasce"              ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este componente renderiza o God View DENTRO do Canvas de preview,
 * mostrando os agentes trabalhando em tempo real durante a geração.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CanvasAgent {
  id: string;
  name: string;
  domain: string;
  status: 'idle' | 'working' | 'waiting' | 'done';
  artifacts: number;
  color: string;
}

export interface CanvasMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  type: 'request' | 'response' | 'artifact' | 'contract';
}

export interface CanvasArtifact {
  id: string;
  name: string;
  type: string;
  preview: string;
  agentName: string;
}

export interface CanvasGodViewProps {
  isGenerating: boolean;
  currentPhase?: string;
  onClose?: () => void;
  // Dados em tempo real do pipeline
  agents?: CanvasAgent[];
  messages?: CanvasMessage[];
  artifacts?: CanvasArtifact[];
  progress?: number;
  statusMessage?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const DOMAIN_COLORS: Record<string, string> = {
  core: '#3b82f6',
  coordinator: '#8b5cf6',
  frontend: '#06b6d4',
  backend: '#84cc16',
  database: '#ef4444',
  auth: '#10b981',
  payments: '#f59e0b',
  mobile: '#ec4899',
  api: '#6366f1',
  testing: '#14b8a6'
};

const DOMAIN_ICONS: Record<string, string> = {
  core: '🧠',
  coordinator: '🎯',
  frontend: '🎨',
  backend: '⚙️',
  database: '🗄️',
  auth: '🔐',
  payments: '💳',
  mobile: '📱',
  api: '🔌',
  testing: '🧪'
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const CanvasGodView: React.FC<CanvasGodViewProps> = ({
  isGenerating,
  currentPhase = 'Inicializando',
  onClose,
  agents = [],
  messages = [],
  artifacts = [],
  progress = 0,
  statusMessage = 'Preparando agentes...'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 600, h: 400 });
  const [localAgents, setLocalAgents] = useState<CanvasAgent[]>([]);
  const [localMessages, setLocalMessages] = useState<CanvasMessage[]>([]);
  const [localArtifacts, setLocalArtifacts] = useState<CanvasArtifact[]>([]);

  // Resize handler
  useEffect(() => {
    const updateDim = () => {
      if (containerRef.current) {
        setDimensions({
          w: containerRef.current.offsetWidth,
          h: containerRef.current.offsetHeight
        });
      }
    };
    window.addEventListener('resize', updateDim);
    updateDim();
    return () => window.removeEventListener('resize', updateDim);
  }, []);

  // Sync with props or simulate
  useEffect(() => {
    if (agents.length > 0) {
      setLocalAgents(agents);
    } else if (isGenerating) {
      // Simular agentes se não houver dados reais
      simulateAgents();
    }
  }, [agents, isGenerating]);

  useEffect(() => {
    if (messages.length > 0) {
      setLocalMessages(messages.slice(-5));
    }
  }, [messages]);

  useEffect(() => {
    if (artifacts.length > 0) {
      setLocalArtifacts(artifacts);
    }
  }, [artifacts]);

  // Simulação de agentes quando não há dados reais
  const simulateAgents = useCallback(() => {
    const simulatedAgents: CanvasAgent[] = [
      { id: 'coord', name: 'Coordenador', domain: 'coordinator', status: 'working', artifacts: 0, color: DOMAIN_COLORS.coordinator },
      { id: 'front', name: 'Frontend', domain: 'frontend', status: 'idle', artifacts: 0, color: DOMAIN_COLORS.frontend },
      { id: 'back', name: 'Backend', domain: 'backend', status: 'idle', artifacts: 0, color: DOMAIN_COLORS.backend },
    ];
    setLocalAgents(simulatedAgents);

    // Simular atividade
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setLocalAgents(prev => prev.map((a, i) => ({
        ...a,
        status: step > i ? 'working' : 'idle',
        artifacts: step > i + 1 ? Math.min(step - i - 1, 3) : 0
      })));

      if (step > 5) {
        setLocalAgents(prev => prev.map(a => ({ ...a, status: 'done' })));
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Calculate circular position
  const getAgentPosition = useCallback((index: number, total: number) => {
    const centerX = dimensions.w / 2;
    const centerY = dimensions.h / 2;
    const radius = Math.min(dimensions.w, dimensions.h) * 0.3;
    const angle = (index / total) * 2 * Math.PI - (Math.PI / 2);
    
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  }, [dimensions]);

  if (!isGenerating) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden z-10"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
      
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-4 py-2 bg-black/50 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center"
            animate={{ rotate: isGenerating ? 360 : 0 }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          >
            <span className="text-lg">🐝</span>
          </motion.div>
          <div>
            <h3 className="text-sm font-bold text-white">COLMÉIA ATIVA</h3>
            <p className="text-[10px] text-gray-400">{currentPhase}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{progress}%</span>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              title="Voltar ao Preview"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main Arena */}
      <div className="flex-1 relative">
        {/* Central Brain */}
        <div 
          className="absolute flex flex-col items-center justify-center"
          style={{ 
            left: dimensions.w / 2, 
            top: dimensions.h / 2 - 30,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg"
            animate={{ 
              boxShadow: ['0 0 20px rgba(139,92,246,0.3)', '0 0 40px rgba(139,92,246,0.5)', '0 0 20px rgba(139,92,246,0.3)']
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-3xl">🐝</span>
          </motion.div>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Colméia</p>
        </div>

        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {localAgents.map((agent, i) => {
            const pos = getAgentPosition(i, localAgents.length);
            const isActive = agent.status === 'working';
            
            return (
              <motion.line
                key={`line-${agent.id}`}
                x1={dimensions.w / 2}
                y1={dimensions.h / 2 - 30}
                x2={pos.x}
                y2={pos.y}
                stroke={isActive ? agent.color : '#374151'}
                strokeWidth={isActive ? 2 : 1}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
              />
            );
          })}
        </svg>

        {/* Agent Nodes */}
        <AnimatePresence>
          {localAgents.map((agent, index) => {
            const pos = getAgentPosition(index, localAgents.length);
            const isWorking = agent.status === 'working';
            
            return (
              <motion.div
                key={agent.id}
                className="absolute"
                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                {/* Glow */}
                {isWorking && (
                  <motion.div
                    className="absolute inset-0 rounded-full blur-lg"
                    style={{ backgroundColor: agent.color }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
                
                {/* Circle */}
                <motion.div
                  className="relative w-12 h-12 rounded-full flex items-center justify-center ring-2 shadow-lg"
                  style={{ 
                    backgroundColor: `${agent.color}20`, 
                    borderColor: agent.color,
                    ringColor: agent.color
                  }}
                  animate={isWorking ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <span className="text-xl">{DOMAIN_ICONS[agent.domain] || '🤖'}</span>
                  
                  {agent.artifacts > 0 && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      {agent.artifacts}
                    </div>
                  )}
                </motion.div>
                
                {/* Label */}
                <div className="mt-1 text-center">
                  <p className="text-[10px] font-semibold text-white">{agent.name}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Flying Messages */}
        <AnimatePresence>
          {localMessages.slice(-2).map((msg) => {
            const fromIdx = localAgents.findIndex(a => a.id === msg.from);
            const toIdx = localAgents.findIndex(a => a.id === msg.to);
            if (fromIdx === -1) return null;
            
            const fromPos = getAgentPosition(fromIdx, localAgents.length);
            const toPos = toIdx >= 0 ? getAgentPosition(toIdx, localAgents.length) : { x: dimensions.w / 2, y: dimensions.h / 2 - 30 };
            const midX = (fromPos.x + toPos.x) / 2;
            const midY = (fromPos.y + toPos.y) / 2 - 30;
            
            return (
              <motion.div
                key={msg.id}
                className="absolute bg-blue-600 rounded px-2 py-1 shadow-lg max-w-32 z-30"
                style={{ left: midX, top: midY, transform: 'translateX(-50%)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <p className="text-[9px] text-white/90 line-clamp-1">{msg.content}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Status */}
      <div className="relative z-20 px-4 py-2 bg-black/50 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Agentes:</span>
              <span className="text-xs font-bold text-white">{localAgents.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Artefatos:</span>
              <span className="text-xs font-bold text-orange-400">{localArtifacts.length || localAgents.reduce((sum, a) => sum + a.artifacts, 0)}</span>
            </div>
          </div>
          
          <motion.p 
            className="text-xs text-gray-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {statusMessage}
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default CanvasGodView;
