/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      👁️ GOD VIEW - A Visão de Deus da Colméia 👁️                           ║
 * ║                                                                              ║
 * ║         "Veja a mente coletiva pensando em tempo real"                      ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentNode } from './AgentNode';
import { MessageBubble } from './MessageBubble';
import { ArtifactCard } from './ArtifactCard';
import { CollaborationTimeline } from './CollaborationTimeline';
import { PhaseIndicator } from './PhaseIndicator';

// Types
interface Agent {
  id: string;
  name: string;
  domain: string;
  status: 'idle' | 'working' | 'waiting' | 'reviewing' | 'done';
  artifactCount: number;
}

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  type: 'request' | 'response' | 'broadcast' | 'contract' | 'artifact' | 'feedback';
  timestamp: Date;
}

interface Artifact {
  id: string;
  name: string;
  type: 'code' | 'schema' | 'api' | 'config' | 'doc';
  agentId: string;
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

interface GodViewProps {
  sessionId?: string;
  onClose?: () => void;
}

// Calculate circular positions for agents
const calculateAgentPositions = (count: number, centerX: number, centerY: number, radius: number) => {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    });
  }
  return positions;
};

export const GodView: React.FC<GodViewProps> = ({ sessionId, onClose }) => {
  // State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [currentPhase, setCurrentPhase] = useState<Phase>('planning');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Canvas dimensions
  const canvasWidth = 600;
  const canvasHeight = 400;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const radius = 150;

  // Calculate positions
  const agentPositions = calculateAgentPositions(agents.length, centerX, centerY, radius);
  const agentPositionMap = new Map<string, { x: number; y: number }>();
  agents.forEach((agent, index) => {
    agentPositionMap.set(agent.id, agentPositions[index] || { x: centerX, y: centerY });
  });

  // Add timeline event
  const addTimelineEvent = useCallback((event: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    setTimeline(prev => [...prev, {
      ...event,
      id: `event_${Date.now()}`,
      timestamp: new Date()
    }]);
  }, []);

  // Simulate collaboration (demo mode)
  const simulateCollaboration = useCallback(async () => {
    setIsSimulating(true);
    setAgents([]);
    setMessages([]);
    setArtifacts([]);
    setTimeline([]);
    setCurrentPhase('planning');

    // Phase 1: Planning - Add agents
    await new Promise(r => setTimeout(r, 500));
    
    const demoAgents: Agent[] = [
      { id: 'auth', name: 'Auth Specialist', domain: 'authentication', status: 'idle', artifactCount: 0 },
      { id: 'payment', name: 'Payment Expert', domain: 'payments', status: 'idle', artifactCount: 0 },
      { id: 'admin', name: 'Admin Architect', domain: 'admin', status: 'idle', artifactCount: 0 }
    ];

    for (const agent of demoAgents) {
      await new Promise(r => setTimeout(r, 800));
      setAgents(prev => [...prev, agent]);
      addTimelineEvent({
        type: 'agent_joined',
        title: `${agent.name} entrou`,
        description: `Especialista em ${agent.domain}`,
        icon: '🤖'
      });
    }

    // Phase 2: Contracting
    await new Promise(r => setTimeout(r, 1000));
    setCurrentPhase('contracting');
    addTimelineEvent({
      type: 'phase_change',
      title: 'Fase: Contratos',
      description: 'Agentes negociando interfaces',
      icon: '📜'
    });

    // Messages between agents
    const demoMessages: Omit<Message, 'id' | 'timestamp'>[] = [
      { from: 'auth', to: 'payment', subject: 'Formato do JWT', content: 'Vou incluir userId e role no token', type: 'contract' },
      { from: 'payment', to: 'auth', subject: 'Aceito!', content: 'Perfeito, vou usar userId para validar transações', type: 'response' },
      { from: 'admin', to: 'auth', subject: 'Preciso de métricas', content: 'Exponha endpoint /api/auth/stats', type: 'request' },
      { from: 'auth', to: 'admin', subject: 'Combinado', content: 'Vou criar /api/auth/stats com login count', type: 'response' }
    ];

    for (const msg of demoMessages) {
      await new Promise(r => setTimeout(r, 1500));
      const fullMsg: Message = { ...msg, id: `msg_${Date.now()}`, timestamp: new Date() };
      setMessages(prev => [...prev, fullMsg]);
      setActiveMessage(fullMsg);
      addTimelineEvent({
        type: 'message',
        title: `${msg.from} → ${msg.to}`,
        description: msg.subject,
        icon: msg.type === 'contract' ? '📜' : '💬'
      });
      
      // Clear active message after delay
      await new Promise(r => setTimeout(r, 2000));
      setActiveMessage(null);
    }

    // Phase 3: Executing
    await new Promise(r => setTimeout(r, 1000));
    setCurrentPhase('executing');
    addTimelineEvent({
      type: 'phase_change',
      title: 'Fase: Execução',
      description: 'Agentes trabalhando em paralelo',
      icon: '⚡'
    });

    // Agents working
    setAgents(prev => prev.map(a => ({ ...a, status: 'working' as const })));

    // Generate artifacts
    const demoArtifacts: Omit<Artifact, 'id'>[] = [
      { name: 'auth.service.ts', type: 'code', agentId: 'auth', agentName: 'Auth Specialist', version: 1, preview: 'export class AuthService {\n  async login(email, password) {...}\n}' },
      { name: 'payment.service.ts', type: 'code', agentId: 'payment', agentName: 'Payment Expert', version: 1, preview: 'export class PaymentService {\n  async charge(userId, amount) {...}\n}' },
      { name: 'admin.dashboard.tsx', type: 'code', agentId: 'admin', agentName: 'Admin Architect', version: 1, preview: 'export const Dashboard = () => {\n  return <div>...</div>\n}' }
    ];

    for (const artifact of demoArtifacts) {
      await new Promise(r => setTimeout(r, 2000));
      setArtifacts(prev => [...prev, { ...artifact, id: `art_${Date.now()}` }]);
      setAgents(prev => prev.map(a => 
        a.id === artifact.agentId 
          ? { ...a, artifactCount: a.artifactCount + 1, status: 'done' as const }
          : a
      ));
      addTimelineEvent({
        type: 'artifact',
        title: `📦 ${artifact.name}`,
        description: `Criado por ${artifact.agentName}`,
        icon: '📦'
      });
    }

    // Phase 4: Integrating
    await new Promise(r => setTimeout(r, 1000));
    setCurrentPhase('integrating');
    addTimelineEvent({
      type: 'phase_change',
      title: 'Fase: Integração',
      description: 'Combinando artefatos',
      icon: '🔧'
    });

    // Phase 5: Reviewing
    await new Promise(r => setTimeout(r, 1500));
    setCurrentPhase('reviewing');
    addTimelineEvent({
      type: 'phase_change',
      title: 'Fase: Revisão',
      description: 'Revisão cruzada entre agentes',
      icon: '🔍'
    });

    setAgents(prev => prev.map(a => ({ ...a, status: 'reviewing' as const })));
    await new Promise(r => setTimeout(r, 2000));

    // Phase 6: Done
    setCurrentPhase('done');
    setAgents(prev => prev.map(a => ({ ...a, status: 'done' as const })));
    addTimelineEvent({
      type: 'phase_change',
      title: '✅ Colaboração Concluída!',
      description: `${demoArtifacts.length} artefatos gerados`,
      icon: '🎉'
    });

    setIsSimulating(false);
  }, [addTimelineEvent]);

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-2xl">👁️</span>
          <div>
            <h1 className="text-xl font-bold text-white">GOD VIEW</h1>
            <p className="text-sm text-gray-400">Visualização da Colméia em Tempo Real</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={simulateCollaboration}
            disabled={isSimulating}
            className={`
              px-4 py-2 rounded-lg font-semibold transition-colors
              ${isSimulating 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-500'}
            `}
          >
            {isSimulating ? '⏳ Simulando...' : '🚀 Simular Colaboração'}
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>


      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Agent Circle */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Phase Indicator */}
          <PhaseIndicator currentPhase={currentPhase} />
          
          {/* Agent Canvas */}
          <div className="flex-1 relative mt-4 bg-gray-800/30 rounded-xl overflow-hidden">
            {/* Center label */}
            <div 
              className="absolute flex flex-col items-center justify-center text-center"
              style={{ 
                left: centerX, 
                top: centerY, 
                transform: 'translate(-50%, -50%)'
              }}
            >
              <span className="text-4xl mb-2">🐝</span>
              <span className="text-sm text-gray-400">Colméia</span>
              <span className="text-xs text-gray-500">{agents.length} agentes</span>
            </div>
            
            {/* Connection lines between agents */}
            <svg className="absolute inset-0 pointer-events-none">
              {agents.map((agent, i) => 
                agents.slice(i + 1).map((otherAgent, j) => {
                  const pos1 = agentPositionMap.get(agent.id);
                  const pos2 = agentPositionMap.get(otherAgent.id);
                  if (!pos1 || !pos2) return null;
                  return (
                    <line
                      key={`${agent.id}-${otherAgent.id}`}
                      x1={pos1.x}
                      y1={pos1.y}
                      x2={pos2.x}
                      y2={pos2.y}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                    />
                  );
                })
              )}
            </svg>
            
            {/* Agent Nodes */}
            <AnimatePresence>
              {agents.map((agent, index) => {
                const position = agentPositions[index];
                if (!position) return null;
                return (
                  <AgentNode
                    key={agent.id}
                    id={agent.id}
                    name={agent.name}
                    domain={agent.domain}
                    status={agent.status}
                    position={position}
                    isSelected={selectedAgent === agent.id}
                    artifactCount={agent.artifactCount}
                    onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                  />
                );
              })}
            </AnimatePresence>
            
            {/* Active Message Bubble */}
            <AnimatePresence>
              {activeMessage && (
                <MessageBubble
                  from={activeMessage.from}
                  to={activeMessage.to}
                  subject={activeMessage.subject}
                  content={activeMessage.content}
                  type={activeMessage.type}
                  timestamp={activeMessage.timestamp}
                  fromPosition={agentPositionMap.get(activeMessage.from) || { x: centerX, y: centerY }}
                  toPosition={agentPositionMap.get(activeMessage.to) || { x: centerX, y: centerY }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Right Panel - Timeline & Artifacts */}
        <div className="w-80 bg-gray-800/50 border-l border-gray-700 p-4 flex flex-col gap-4 overflow-hidden">
          {/* Timeline */}
          <div className="flex-1 overflow-hidden">
            <CollaborationTimeline events={timeline} maxEvents={8} />
          </div>
          
          {/* Artifacts */}
          <div className="flex-1 overflow-hidden">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span>📦</span> Artefatos ({artifacts.length})
            </h3>
            <div className="space-y-2 overflow-y-auto max-h-full">
              <AnimatePresence>
                {artifacts.map(artifact => (
                  <ArtifactCard
                    key={artifact.id}
                    name={artifact.name}
                    type={artifact.type}
                    agentName={artifact.agentName}
                    version={artifact.version}
                    preview={artifact.preview}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Stats */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-gray-400">
            🤖 <span className="text-white font-semibold">{agents.length}</span> Agentes
          </span>
          <span className="text-gray-400">
            💬 <span className="text-white font-semibold">{messages.length}</span> Mensagens
          </span>
          <span className="text-gray-400">
            📦 <span className="text-white font-semibold">{artifacts.length}</span> Artefatos
          </span>
        </div>
        
        <div className="text-sm text-gray-400">
          {sessionId ? `Sessão: ${sessionId}` : 'Modo Demo'}
        </div>
      </div>
    </div>
  );
};

export default GodView;
