/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      👁️ AETHER GOD VIEW - O Olho da Providência Digital 👁️                 ║
 * ║                                                                              ║
 * ║         "Assista a mente coletiva pensando como um filme de ficção"         ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface MessageVisual {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  type: 'request' | 'response' | 'contract' | 'broadcast' | 'artifact';
  timestamp: Date;
}

interface ArtifactVisual {
  id: string;
  name: string;
  type: 'code' | 'schema' | 'api' | 'config';
  agentName: string;
  version: number;
  preview: string;
}

interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'agent_joined' | 'message' | 'contract' | 'artifact' | 'phase_change';
  title: string;
  description: string;
  icon: string;
}

type Phase = 'planning' | 'contracting' | 'executing' | 'integrating' | 'reviewing' | 'done';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_COLORS: Record<string, string> = {
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

const STATUS_CONFIG = {
  idle: { glow: false, pulse: false, ring: 'ring-gray-600' },
  working: { glow: true, pulse: true, ring: 'ring-blue-500' },
  waiting: { glow: true, pulse: true, ring: 'ring-yellow-500' },
  reviewing: { glow: true, pulse: false, ring: 'ring-purple-500' },
  done: { glow: false, pulse: false, ring: 'ring-green-500' }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const AetherGodView: React.FC = () => {
  // State
  const [phase, setPhase] = useState<Phase>('planning');
  const [agents, setAgents] = useState<AgentVisual[]>([]);
  const [messages, setMessages] = useState<MessageVisual[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactVisual[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 1200, h: 800 });

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
  const addEvent = useCallback((type: TimelineEvent['type'], title: string, desc: string, icon: string) => {
    setEvents(prev => [...prev, {
      id: `evt_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      type,
      title,
      description: desc,
      icon
    }]);
  }, []);

  // Add message with auto-clear
  const addMessage = useCallback((msg: Omit<MessageVisual, 'id' | 'timestamp'>, duration = 3000) => {
    const id = `msg_${Date.now()}`;
    const fullMsg: MessageVisual = { ...msg, id, timestamp: new Date() };
    setMessages(prev => [...prev, fullMsg]);
    
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== id));
    }, duration);
    
    return id;
  }, []);


  // ═══════════════════════════════════════════════════════════════════════════
  // SIMULATION - The Epic Demo
  // ═══════════════════════════════════════════════════════════════════════════
  
  const runSimulation = useCallback(async () => {
    if (isRunning) return;
    
    // Reset
    setIsRunning(true);
    setAgents([]);
    setMessages([]);
    setArtifacts([]);
    setEvents([]);
    setPhase('planning');

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 1: The Awakening
    // ─────────────────────────────────────────────────────────────────────────
    
    addEvent('phase_change', '🎬 Iniciando Colaboração', 'A colméia desperta...', '🐝');
    await delay(1000);

    // Coordinator appears first
    const coordinator: AgentVisual = {
      id: 'coord',
      name: 'Multi-Agent Coordinator',
      domain: 'core',
      status: 'working',
      artifacts: 0,
      color: AGENT_COLORS.core
    };
    setAgents([coordinator]);
    addEvent('agent_joined', 'Coordenador Ativado', 'Analisando requisitos...', '🧠');
    await delay(1500);

    // Specialists join one by one
    const specialists: AgentVisual[] = [
      { id: 'auth', name: 'Auth Specialist', domain: 'authentication', status: 'idle', artifacts: 0, color: AGENT_COLORS.authentication },
      { id: 'pay', name: 'Payment Expert', domain: 'payments', status: 'idle', artifacts: 0, color: AGENT_COLORS.payments },
      { id: 'mobile', name: 'Mobile Architect', domain: 'mobile', status: 'idle', artifacts: 0, color: AGENT_COLORS.mobile },
      { id: 'db', name: 'Data Engineer', domain: 'database', status: 'idle', artifacts: 0, color: AGENT_COLORS.database }
    ];

    for (const spec of specialists) {
      await delay(800);
      setAgents(prev => [...prev, spec]);
      addEvent('agent_joined', `${spec.name} Entrou`, `Especialista em ${spec.domain}`, DOMAIN_ICONS[spec.domain]);
    }

    await delay(1000);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 2: The Negotiation
    // ─────────────────────────────────────────────────────────────────────────
    
    setPhase('contracting');
    addEvent('phase_change', '📜 Fase de Contratos', 'Agentes negociando interfaces...', '🤝');
    await delay(1000);

    // Coordinator asks Auth
    addMessage({
      fromId: 'coord',
      toId: 'auth',
      content: 'Defina o schema de usuários para o Marketplace.',
      type: 'request'
    }, 4000);
    setAgents(prev => prev.map(a => a.id === 'auth' ? { ...a, status: 'working' } : a));
    await delay(2500);

    // Auth responds with contract
    addMessage({
      fromId: 'auth',
      toId: 'coord',
      content: 'Schema definido. JWT incluirá userId e role.',
      type: 'contract'
    }, 4000);
    addEvent('contract', 'Contrato: Auth Schema', 'JWT com userId e role', '📜');
    await delay(2000);

    // Payment intervenes
    addMessage({
      fromId: 'pay',
      toId: 'auth',
      content: 'Preciso do campo stripe_customer_id no User.',
      type: 'request'
    }, 4000);
    setAgents(prev => prev.map(a => a.id === 'pay' ? { ...a, status: 'waiting' } : a));
    await delay(2500);

    // Auth accepts
    addMessage({
      fromId: 'auth',
      toId: 'pay',
      content: 'Aceito! Adicionando stripe_customer_id.',
      type: 'response'
    }, 3000);
    addEvent('contract', 'Contrato Atualizado', 'stripe_customer_id adicionado', '✅');
    await delay(2000);

    // Mobile asks about API
    addMessage({
      fromId: 'mobile',
      toId: 'coord',
      content: 'Qual a rota para listar produtos?',
      type: 'request'
    }, 4000);
    setAgents(prev => prev.map(a => a.id === 'mobile' ? { ...a, status: 'waiting' } : a));
    await delay(2000);

    // Coordinator broadcasts
    addMessage({
      fromId: 'coord',
      toId: 'db',
      content: 'GET /api/products - Exponha endpoint.',
      type: 'broadcast'
    }, 3000);
    await delay(1500);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 3: The Execution
    // ─────────────────────────────────────────────────────────────────────────
    
    setPhase('executing');
    addEvent('phase_change', '⚡ Fase de Execução', 'Todos trabalhando em paralelo!', '🔥');
    
    // All agents working
    setAgents(prev => prev.map(a => ({ ...a, status: 'working' })));
    await delay(2000);

    // Artifacts start appearing
    const artifactsToCreate = [
      { name: 'auth.service.ts', type: 'code' as const, agentId: 'auth', agentName: 'Auth Specialist', preview: 'export class AuthService {\n  async login(email, pass) {\n    // JWT generation\n  }\n}' },
      { name: 'user.schema.ts', type: 'schema' as const, agentId: 'auth', agentName: 'Auth Specialist', preview: 'type User = {\n  id: string;\n  email: string;\n  stripe_customer_id?: string;\n}' },
      { name: 'payment.controller.ts', type: 'code' as const, agentId: 'pay', agentName: 'Payment Expert', preview: 'export class PaymentController {\n  async charge(userId, amount) {\n    // Stripe integration\n  }\n}' },
      { name: 'AppNavigator.tsx', type: 'code' as const, agentId: 'mobile', agentName: 'Mobile Architect', preview: '<Stack.Navigator>\n  <Stack.Screen name="Home" />\n  <Stack.Screen name="Cart" />\n</Stack.Navigator>' },
      { name: 'products.api.ts', type: 'api' as const, agentId: 'db', agentName: 'Data Engineer', preview: 'router.get("/products", async (req, res) => {\n  const products = await db.product.findMany();\n  res.json(products);\n});' }
    ];

    for (const art of artifactsToCreate) {
      await delay(1800);
      
      // Agent delivers artifact
      addMessage({
        fromId: art.agentId,
        toId: 'coord',
        content: `📦 ${art.name} entregue!`,
        type: 'artifact'
      }, 2500);
      
      // Add artifact
      setArtifacts(prev => [...prev, {
        id: `art_${Date.now()}`,
        name: art.name,
        type: art.type,
        agentName: art.agentName,
        version: 1,
        preview: art.preview
      }]);
      
      // Update agent artifact count
      setAgents(prev => prev.map(a => 
        a.id === art.agentId ? { ...a, artifacts: a.artifacts + 1 } : a
      ));
      
      addEvent('artifact', `📦 ${art.name}`, `Criado por ${art.agentName}`, '📦');
    }

    await delay(1500);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 4: Integration
    // ─────────────────────────────────────────────────────────────────────────
    
    setPhase('integrating');
    addEvent('phase_change', '🔧 Fase de Integração', 'Combinando artefatos...', '🔗');
    
    setAgents(prev => prev.map(a => a.id === 'coord' ? { ...a, status: 'working' } : { ...a, status: 'done' }));
    await delay(2000);

    // Integration artifact
    setArtifacts(prev => [...prev, {
      id: 'art_integration',
      name: 'index.ts',
      type: 'code',
      agentName: 'Coordinator',
      version: 1,
      preview: '// Integrated System\nexport * from "./auth";\nexport * from "./payments";\nexport * from "./mobile";\nexport * from "./api";'
    }]);
    addEvent('artifact', '🔗 index.ts', 'Sistema integrado!', '✨');
    await delay(1500);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 5: Review
    // ─────────────────────────────────────────────────────────────────────────
    
    setPhase('reviewing');
    addEvent('phase_change', '🔍 Revisão Cruzada', 'Agentes revisando trabalho uns dos outros', '👀');
    
    setAgents(prev => prev.map(a => ({ ...a, status: 'reviewing' })));
    await delay(1500);

    // Cross reviews
    addMessage({ fromId: 'auth', toId: 'pay', content: '✅ Código aprovado!', type: 'response' }, 2500);
    await delay(1200);
    addMessage({ fromId: 'pay', toId: 'mobile', content: '✅ Integração OK!', type: 'response' }, 2500);
    await delay(1200);
    addMessage({ fromId: 'mobile', toId: 'db', content: '✅ API funcionando!', type: 'response' }, 2500);
    await delay(2000);

    // ─────────────────────────────────────────────────────────────────────────
    // FINALE: Success
    // ─────────────────────────────────────────────────────────────────────────
    
    setPhase('done');
    setAgents(prev => prev.map(a => ({ ...a, status: 'done' })));
    addEvent('phase_change', '🎉 COLABORAÇÃO CONCLUÍDA!', `${artifactsToCreate.length + 1} artefatos gerados`, '🏆');
    
    setIsRunning(false);
  }, [isRunning, addEvent, addMessage]);


  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex h-screen bg-[#030303] text-white overflow-hidden font-sans">
      
      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CANVAS - The Arena
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 relative" ref={containerRef}>
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(#111_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
        <div className="absolute inset-0 bg-gradient-radial from-blue-900/10 via-transparent to-transparent" />
        
        {/* Header */}
        <div className="absolute top-6 left-6 z-20">
          <h1 className="text-3xl font-black tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
              AETHER
            </span>
            <span className="text-gray-500 ml-2 font-light">GOD VIEW</span>
          </h1>
          <p className="text-xs text-gray-600 uppercase tracking-[0.3em] mt-1">
            Multi-Agent Orchestration System v4.0
          </p>
        </div>

        {/* Phase Indicator */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
          <PhaseIndicatorInline phase={phase} />
        </div>

        {/* Start Button */}
        <div className="absolute top-6 right-6 z-20">
          <motion.button
            onClick={runSimulation}
            disabled={isRunning}
            className={`
              px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider
              transition-all duration-300
              ${isRunning 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/25'}
            `}
            whileHover={!isRunning ? { scale: 1.05 } : {}}
            whileTap={!isRunning ? { scale: 0.95 } : {}}
          >
            {isRunning ? '⏳ Executando...' : '🚀 Iniciar Demo'}
          </motion.button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            AGENT ARENA
            ═══════════════════════════════════════════════════════════════════ */}
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
              className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/30"
              animate={{ 
                boxShadow: isRunning 
                  ? ['0 0 30px rgba(139,92,246,0.3)', '0 0 60px rgba(139,92,246,0.5)', '0 0 30px rgba(139,92,246,0.3)']
                  : '0 0 30px rgba(139,92,246,0.3)'
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className="text-4xl">🐝</span>
            </motion.div>
            <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Colméia</p>
            <p className="text-xs text-gray-600">{agents.length} agentes</p>
          </div>

          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {agents.map((agent, i) => {
              const pos = getAgentPosition(i, agents.length);
              const centerX = dimensions.w / 2;
              const centerY = dimensions.h / 2;
              const isActive = agent.status === 'working';
              
              return (
                <motion.line
                  key={`line-${agent.id}`}
                  x1={centerX}
                  y1={centerY}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={isActive ? agent.color : '#1f2937'}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={isActive ? '0' : '4,4'}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: isActive ? 0.6 : 0.2 }}
                  transition={{ duration: 0.5 }}
                />
              );
            })}
          </svg>

          {/* Agent Nodes */}
          <AnimatePresence>
            {agents.map((agent, index) => {
              const pos = getAgentPosition(index, agents.length);
              const config = STATUS_CONFIG[agent.status];
              
              return (
                <motion.div
                  key={agent.id}
                  className="absolute"
                  style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {/* Glow Effect */}
                  {config.glow && (
                    <motion.div
                      className="absolute inset-0 rounded-full blur-xl"
                      style={{ backgroundColor: agent.color }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                  
                  {/* Main Circle */}
                  <motion.div
                    className={`
                      relative w-16 h-16 rounded-full 
                      flex items-center justify-center
                      ring-2 ${config.ring}
                      shadow-lg cursor-pointer
                    `}
                    style={{ backgroundColor: `${agent.color}20`, borderColor: agent.color }}
                    animate={config.pulse ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-2xl">{DOMAIN_ICONS[agent.domain] || '🤖'}</span>
                    
                    {/* Artifact Badge */}
                    {agent.artifacts > 0 && (
                      <motion.div
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        {agent.artifacts}
                      </motion.div>
                    )}
                  </motion.div>
                  
                  {/* Label */}
                  <div className="mt-2 text-center">
                    <p className="text-xs font-semibold text-white truncate max-w-20">
                      {agent.name.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-gray-500 capitalize">{agent.domain}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Flying Messages */}
          <AnimatePresence>
            {messages.map(msg => {
              const fromIdx = agents.findIndex(a => a.id === msg.fromId);
              const toIdx = agents.findIndex(a => a.id === msg.toId);
              if (fromIdx === -1 || toIdx === -1) return null;
              
              const fromPos = getAgentPosition(fromIdx, agents.length);
              const toPos = getAgentPosition(toIdx, agents.length);
              const midX = (fromPos.x + toPos.x) / 2;
              const midY = (fromPos.y + toPos.y) / 2 - 40;
              
              const typeColors = {
                request: 'bg-blue-600',
                response: 'bg-green-600',
                contract: 'bg-yellow-600',
                broadcast: 'bg-purple-600',
                artifact: 'bg-orange-600'
              };
              
              return (
                <motion.div
                  key={msg.id}
                  className={`absolute ${typeColors[msg.type]} rounded-lg px-3 py-2 shadow-xl max-w-48 z-30`}
                  style={{ left: midX, top: midY, transform: 'translateX(-50%)' }}
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: -20 }}
                >
                  <p className="text-xs text-white/90 line-clamp-2">{msg.content}</p>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-current" 
                       style={{ borderTopColor: msg.type === 'contract' ? '#ca8a04' : msg.type === 'artifact' ? '#ea580c' : '#2563eb' }} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════════════
          SIDEBAR - Timeline & Artifacts
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="w-80 bg-[#0a0a0a] border-l border-gray-800/50 flex flex-col">
        
        {/* Timeline */}
        <div className="flex-1 p-4 border-b border-gray-800/50 overflow-hidden">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span>📜</span> Timeline
          </h3>
          <div className="space-y-2 overflow-y-auto h-[calc(100%-2rem)] pr-2">
            <AnimatePresence mode="popLayout">
              {events.slice(-12).map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`
                    border-l-2 pl-3 py-2 rounded-r
                    ${event.type === 'phase_change' ? 'border-purple-500 bg-purple-500/10' : ''}
                    ${event.type === 'agent_joined' ? 'border-green-500 bg-green-500/10' : ''}
                    ${event.type === 'contract' ? 'border-yellow-500 bg-yellow-500/10' : ''}
                    ${event.type === 'artifact' ? 'border-orange-500 bg-orange-500/10' : ''}
                    ${event.type === 'message' ? 'border-blue-500 bg-blue-500/10' : ''}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{event.icon}</span>
                    <span className="text-[10px] text-gray-500">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium">{event.title}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-1">{event.description}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Artifacts */}
        <div className="flex-1 p-4 overflow-hidden">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span>📦</span> Artefatos ({artifacts.length})
          </h3>
          <div className="space-y-2 overflow-y-auto h-[calc(100%-2rem)] pr-2">
            <AnimatePresence>
              {artifacts.map(artifact => (
                <motion.div
                  key={artifact.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 hover:border-gray-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`
                      w-6 h-6 rounded flex items-center justify-center text-xs
                      ${artifact.type === 'code' ? 'bg-blue-500/20 text-blue-400' : ''}
                      ${artifact.type === 'schema' ? 'bg-purple-500/20 text-purple-400' : ''}
                      ${artifact.type === 'api' ? 'bg-green-500/20 text-green-400' : ''}
                      ${artifact.type === 'config' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                    `}>
                      {artifact.type === 'code' ? '📄' : artifact.type === 'schema' ? '🗂️' : artifact.type === 'api' ? '🔌' : '⚙️'}
                    </span>
                    <span className="text-xs font-semibold text-white truncate flex-1">{artifact.name}</span>
                    <span className="text-[10px] text-gray-500">v{artifact.version}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2">{artifact.agentName}</p>
                  <pre className="text-[10px] text-gray-400 bg-black/30 rounded p-2 overflow-hidden line-clamp-3 font-mono">
                    {artifact.preview}
                  </pre>
                </motion.div>
              ))}
            </AnimatePresence>
            {artifacts.length === 0 && (
              <p className="text-xs text-gray-600 text-center mt-8">
                Aguardando geração de artefatos...
              </p>
            )}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="p-4 border-t border-gray-800/50 bg-black/30">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-white">{agents.length}</p>
              <p className="text-[10px] text-gray-500 uppercase">Agentes</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{events.length}</p>
              <p className="text-[10px] text-gray-500 uppercase">Eventos</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{artifacts.length}</p>
              <p className="text-[10px] text-gray-500 uppercase">Artefatos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const PhaseIndicatorInline: React.FC<{ phase: Phase }> = ({ phase }) => {
  const phases: { id: Phase; icon: string }[] = [
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
      {phases.map((p, i) => (
        <React.Fragment key={p.id}>
          <motion.div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm
              ${i === currentIdx ? 'bg-blue-600 ring-2 ring-blue-400' : ''}
              ${i < currentIdx ? 'bg-green-600' : ''}
              ${i > currentIdx ? 'bg-gray-800' : ''}
            `}
            animate={i === currentIdx ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            {p.icon}
          </motion.div>
          {i < phases.length - 1 && (
            <div className={`w-4 h-0.5 ${i < currentIdx ? 'bg-green-500' : 'bg-gray-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default AetherGodView;
