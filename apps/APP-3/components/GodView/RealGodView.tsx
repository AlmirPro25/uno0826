/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      👁️ REAL GOD VIEW - Conectado ao Sistema Multi-Agente Real 👁️          ║
 * ║                                                                              ║
 * ║         "Veja a colméia REAL trabalhando, não apenas uma demo"              ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getAgentCommunicationHub,
  CollaborationSession,
  AgentMessage
} from '../../services/AgentCommunicationHub';
import { 
  getMultiAgentCoordinator,
  orchestrateMultiAgent,
  CollaborationResult
} from '../../services/MultiAgentCoordinator';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AgentVisual {
  id: string;
  name: string;
  domain: string;
  status: 'idle' | 'working' | 'waiting' | 'reviewing' | 'done';
  artifacts: number;
  color: string;
}

interface ArtifactVisual {
  id: string;
  name: string;
  type: string;
  agentName: string;
  version: number;
  preview: string;
}

interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: string;
  title: string;
  description: string;
  icon: string;
}

type Phase = 'idle' | 'planning' | 'contracting' | 'executing' | 'integrating' | 'reviewing' | 'done';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const DOMAIN_COLORS: Record<string, string> = {
  core: '#3b82f6',
  authentication: '#10b981',
  payments: '#f59e0b',
  mobile: '#8b5cf6',
  database: '#ef4444',
  admin: '#ec4899',
  frontend: '#06b6d4',
  backend: '#84cc16'
};

const DOMAIN_ICONS: Record<string, string> = {
  core: '🧠',
  authentication: '🔐',
  payments: '💳',
  mobile: '📱',
  database: '🗄️',
  admin: '📊',
  frontend: '🎨',
  backend: '⚙️'
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const RealGodView: React.FC = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [agents, setAgents] = useState<AgentVisual[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactVisual[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CollaborationResult | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 1200, h: 800 });
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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

  // Calculate circular position
  const getAgentPosition = useCallback((index: number, total: number) => {
    const centerX = dimensions.w / 2;
    const centerY = dimensions.h / 2;
    const radius = Math.min(dimensions.w, dimensions.h) * 0.32;
    const angle = (index / total) * 2 * Math.PI - (Math.PI / 2);
    
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  }, [dimensions]);

  // Add event to timeline
  const addEvent = useCallback((type: string, title: string, desc: string, icon: string) => {
    setEvents(prev => [...prev.slice(-20), {
      id: `evt_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      type,
      title,
      description: desc,
      icon
    }]);
  }, []);

  // Poll session for updates
  const pollSession = useCallback(() => {
    if (!activeSessionId) return;
    
    const hub = getAgentCommunicationHub();
    const session = hub.getSession(activeSessionId);
    
    if (!session) return;
    
    // Update phase
    setPhase(session.phase as Phase);
    
    // Update agents
    const agentList = Array.from(session.agents.values());
    setAgents(agentList.map(a => ({
      id: a.id,
      name: a.soul.name,
      domain: a.domain,
      status: a.status,
      artifacts: a.artifacts.length,
      color: DOMAIN_COLORS[a.domain] || '#6b7280'
    })));
    
    // Update messages (last 5)
    setMessages(session.messageHistory.slice(-5));
    
    // Update artifacts
    const allArtifacts: ArtifactVisual[] = [];
    agentList.forEach(agent => {
      agent.artifacts.forEach(art => {
        allArtifacts.push({
          id: art.id,
          name: art.name,
          type: art.type,
          agentName: agent.soul.name,
          version: art.version,
          preview: art.content.substring(0, 200)
        });
      });
    });
    setArtifacts(allArtifacts);
    
  }, [activeSessionId]);

  // Start polling when session is active
  useEffect(() => {
    if (activeSessionId && isRunning) {
      pollingRef.current = setInterval(pollSession, 500);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [activeSessionId, isRunning, pollSession]);


  // ═══════════════════════════════════════════════════════════════════════════
  // RUN REAL COLLABORATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  const runRealCollaboration = useCallback(async () => {
    if (!prompt.trim() || isRunning) return;
    
    setIsRunning(true);
    setPhase('planning');
    setAgents([]);
    setMessages([]);
    setArtifacts([]);
    setEvents([]);
    setResult(null);
    
    addEvent('phase_change', '🚀 Iniciando Colaboração Real', prompt.substring(0, 50) + '...', '🐝');
    
    try {
      // Run the real multi-agent collaboration
      const collaborationResult = await orchestrateMultiAgent(prompt);
      
      setActiveSessionId(collaborationResult.sessionId);
      setResult(collaborationResult);
      setPhase('done');
      
      addEvent('phase_change', '✅ Colaboração Concluída!', 
        `${collaborationResult.agents.length} agentes, ${collaborationResult.metrics.totalArtifacts} artefatos`, 
        '🎉'
      );
      
      // Final update
      pollSession();
      
    } catch (error) {
      console.error('Erro na colaboração:', error);
      addEvent('error', '❌ Erro', String(error), '🔥');
      setPhase('idle');
    } finally {
      setIsRunning(false);
    }
  }, [prompt, isRunning, addEvent, pollSession]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex h-screen bg-[#030303] text-white overflow-hidden font-sans">
      
      {/* MAIN CANVAS */}
      <div className="flex-1 relative" ref={containerRef}>
        
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#111_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
        
        {/* Header */}
        <div className="absolute top-6 left-6 z-20">
          <h1 className="text-3xl font-black tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-500">
              REAL
            </span>
            <span className="text-gray-500 ml-2 font-light">GOD VIEW</span>
          </h1>
          <p className="text-xs text-gray-600 uppercase tracking-[0.3em] mt-1">
            Colaboração Multi-Agente em Tempo Real
          </p>
        </div>

        {/* Phase Indicator */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
          <PhaseIndicator phase={phase} />
        </div>

        {/* Input Area */}
        <div className="absolute top-6 right-6 z-20 w-96">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva o sistema que você quer criar...&#10;Ex: Marketplace com auth, pagamentos e admin"
              className="w-full h-20 bg-gray-800 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isRunning}
            />
            <button
              onClick={runRealCollaboration}
              disabled={isRunning || !prompt.trim()}
              className={`
                w-full mt-2 py-2 rounded-lg font-bold text-sm uppercase tracking-wider
                transition-all duration-300
                ${isRunning || !prompt.trim()
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white'}
              `}
            >
              {isRunning ? '⏳ Colaborando...' : '🚀 Iniciar Colaboração Real'}
            </button>
          </div>
        </div>

        {/* Agent Arena */}
        <div className="relative w-full h-full">
          
          {/* Central Brain */}
          <div 
            className="absolute flex flex-col items-center justify-center"
            style={{ 
              left: dimensions.w / 2, 
              top: dimensions.h / 2,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <motion.div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center shadow-2xl"
              animate={{ 
                boxShadow: isRunning 
                  ? ['0 0 30px rgba(34,197,94,0.3)', '0 0 60px rgba(34,197,94,0.5)', '0 0 30px rgba(34,197,94,0.3)']
                  : '0 0 30px rgba(34,197,94,0.2)'
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className="text-5xl">🐝</span>
            </motion.div>
            <p className="text-sm text-gray-400 mt-2 uppercase tracking-widest">Colméia Real</p>
            <p className="text-xs text-gray-600">{agents.length} agentes ativos</p>
          </div>

          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {agents.map((agent, i) => {
              const pos = getAgentPosition(i, agents.length);
              const isActive = agent.status === 'working';
              
              return (
                <motion.line
                  key={`line-${agent.id}`}
                  x1={dimensions.w / 2}
                  y1={dimensions.h / 2}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={isActive ? agent.color : '#1f2937'}
                  strokeWidth={isActive ? 2 : 1}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
              );
            })}
          </svg>

          {/* Agent Nodes */}
          <AnimatePresence>
            {agents.map((agent, index) => {
              const pos = getAgentPosition(index, agents.length);
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
                      className="absolute inset-0 rounded-full blur-xl"
                      style={{ backgroundColor: agent.color }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                  
                  {/* Circle */}
                  <motion.div
                    className={`
                      relative w-16 h-16 rounded-full 
                      flex items-center justify-center
                      ring-2 shadow-lg cursor-pointer
                    `}
                    style={{ 
                      backgroundColor: `${agent.color}20`, 
                      borderColor: agent.color,
                      ringColor: agent.color
                    }}
                    animate={isWorking ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <span className="text-2xl">{DOMAIN_ICONS[agent.domain] || '🤖'}</span>
                    
                    {agent.artifacts > 0 && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {agent.artifacts}
                      </div>
                    )}
                  </motion.div>
                  
                  {/* Label */}
                  <div className="mt-2 text-center">
                    <p className="text-xs font-semibold text-white truncate max-w-20">
                      {agent.name.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-gray-500">{agent.domain}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Flying Messages */}
          <AnimatePresence>
            {messages.slice(-3).map((msg, idx) => {
              const fromIdx = agents.findIndex(a => a.id === msg.from);
              const toIdx = agents.findIndex(a => a.id === msg.to || msg.to === 'all');
              if (fromIdx === -1) return null;
              
              const fromPos = getAgentPosition(fromIdx, agents.length);
              const toPos = toIdx >= 0 ? getAgentPosition(toIdx, agents.length) : { x: dimensions.w / 2, y: dimensions.h / 2 };
              const midX = (fromPos.x + toPos.x) / 2;
              const midY = (fromPos.y + toPos.y) / 2 - 50;
              
              return (
                <motion.div
                  key={msg.id}
                  className="absolute bg-blue-600 rounded-lg px-3 py-2 shadow-xl max-w-48 z-30"
                  style={{ left: midX, top: midY, transform: 'translateX(-50%)' }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <p className="text-xs text-white/90 line-clamp-2">{msg.subject}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="w-80 bg-[#0a0a0a] border-l border-gray-800/50 flex flex-col">
        
        {/* Timeline */}
        <div className="flex-1 p-4 border-b border-gray-800/50 overflow-hidden">
          <h3 className="text-sm font-semibold text-white mb-3">📜 Timeline</h3>
          <div className="space-y-2 overflow-y-auto h-[calc(100%-2rem)]">
            <AnimatePresence mode="popLayout">
              {events.map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-l-2 border-blue-500 bg-blue-500/10 pl-3 py-2 rounded-r"
                >
                  <div className="flex items-center gap-2">
                    <span>{event.icon}</span>
                    <span className="text-[10px] text-gray-500">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium">{event.title}</p>
                  <p className="text-[10px] text-gray-500">{event.description}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Artifacts */}
        <div className="flex-1 p-4 overflow-hidden">
          <h3 className="text-sm font-semibold text-white mb-3">📦 Artefatos ({artifacts.length})</h3>
          <div className="space-y-2 overflow-y-auto h-[calc(100%-2rem)]">
            <AnimatePresence>
              {artifacts.map(artifact => (
                <motion.div
                  key={artifact.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50"
                >
                  <p className="text-xs font-semibold text-white">{artifact.name}</p>
                  <p className="text-[10px] text-gray-500">{artifact.agentName}</p>
                  <pre className="text-[9px] text-gray-400 bg-black/30 rounded p-2 mt-2 overflow-hidden line-clamp-2 font-mono">
                    {artifact.preview}
                  </pre>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Result Stats */}
        {result && (
          <div className="p-4 border-t border-gray-800/50 bg-green-900/20">
            <h3 className="text-sm font-semibold text-green-400 mb-2">✅ Resultado</h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-white">{result.agents.length}</p>
                <p className="text-[10px] text-gray-500">Agentes</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{result.metrics.totalArtifacts}</p>
                <p className="text-[10px] text-gray-500">Artefatos</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{result.metrics.totalMessages}</p>
                <p className="text-[10px] text-gray-500">Mensagens</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{(result.metrics.collaborationTime / 1000).toFixed(1)}s</p>
                <p className="text-[10px] text-gray-500">Tempo</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Phase Indicator Component
const PhaseIndicator: React.FC<{ phase: Phase }> = ({ phase }) => {
  const phases: { id: Phase; icon: string }[] = [
    { id: 'idle', icon: '💤' },
    { id: 'planning', icon: '🎯' },
    { id: 'contracting', icon: '📜' },
    { id: 'executing', icon: '⚡' },
    { id: 'integrating', icon: '🔧' },
    { id: 'reviewing', icon: '🔍' },
    { id: 'done', icon: '✅' }
  ];
  
  const currentIdx = phases.findIndex(p => p.id === phase);
  
  return (
    <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
      {phases.filter(p => p.id !== 'idle').map((p, i) => (
        <React.Fragment key={p.id}>
          <motion.div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm
              ${phases.findIndex(x => x.id === p.id) === currentIdx ? 'bg-green-600 ring-2 ring-green-400' : ''}
              ${phases.findIndex(x => x.id === p.id) < currentIdx ? 'bg-green-600' : ''}
              ${phases.findIndex(x => x.id === p.id) > currentIdx ? 'bg-gray-800' : ''}
            `}
            animate={phases.findIndex(x => x.id === p.id) === currentIdx ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            {p.icon}
          </motion.div>
          {i < phases.filter(x => x.id !== 'idle').length - 1 && (
            <div className={`w-4 h-0.5 ${phases.findIndex(x => x.id === p.id) < currentIdx ? 'bg-green-500' : 'bg-gray-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default RealGodView;
