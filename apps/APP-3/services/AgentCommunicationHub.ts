/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🤝 AGENT COMMUNICATION HUB - Sistema de Comunicação Multi-Agente 🤝    ║
 * ║                                                                              ║
 * ║         "Especialistas que colaboram são mais fortes que um generalista"    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * v4.0 - Permite que múltiplos agentes especializados se comuniquem e colaborem
 */

import { ForgedSoul } from './SoulArchitect';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type MessageType = 
  | 'request'      // Pedido de informação
  | 'response'     // Resposta a um pedido
  | 'broadcast'    // Mensagem para todos
  | 'contract'     // Proposta de interface/contrato
  | 'agreement'    // Aceite de contrato
  | 'artifact'     // Entrega de código/artefato
  | 'feedback'     // Feedback sobre trabalho de outro
  | 'question'     // Dúvida
  | 'decision';    // Decisão tomada

export type AgentRole = 
  | 'coordinator'  // Coordena os outros
  | 'specialist'   // Especialista em domínio
  | 'reviewer'     // Revisa trabalho dos outros
  | 'integrator';  // Integra as partes

export interface AgentMessage {
  id: string;
  timestamp: Date;
  from: string;           // agentId
  to: string | 'all';     // agentId ou broadcast
  type: MessageType;
  subject: string;
  content: string;
  metadata?: {
    priority?: 'low' | 'normal' | 'high' | 'critical';
    requiresResponse?: boolean;
    relatedTo?: string;   // messageId relacionado
    artifacts?: string[]; // código/arquivos anexados
  };
}

export interface AgentContract {
  id: string;
  proposedBy: string;
  acceptedBy: string[];
  type: 'api' | 'event' | 'data' | 'interface';
  name: string;
  specification: string;
  status: 'proposed' | 'negotiating' | 'accepted' | 'rejected';
}

export interface CollaborativeAgent {
  id: string;
  soul: ForgedSoul;
  role: AgentRole;
  domain: string;
  responsibilities: string[];
  dependencies: string[];    // IDs de agentes que depende
  providesTo: string[];      // IDs de agentes que serve
  status: 'idle' | 'working' | 'waiting' | 'reviewing' | 'done';
  artifacts: AgentArtifact[];
  inbox: AgentMessage[];
  outbox: AgentMessage[];
}

export interface AgentArtifact {
  id: string;
  agentId: string;
  type: 'code' | 'schema' | 'api' | 'config' | 'doc';
  name: string;
  content: string;
  version: number;
  dependencies: string[];  // IDs de outros artifacts
}

export interface CollaborationSession {
  id: string;
  startedAt: Date;
  originalPrompt: string;
  agents: Map<string, CollaborativeAgent>;
  contracts: AgentContract[];
  messageHistory: AgentMessage[];
  phase: 'planning' | 'contracting' | 'executing' | 'integrating' | 'reviewing' | 'done';
  finalArtifact?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT COMMUNICATION HUB
// ═══════════════════════════════════════════════════════════════════════════════

export class AgentCommunicationHub {
  private sessions: Map<string, CollaborationSession> = new Map();
  private messageQueue: AgentMessage[] = [];
  
  constructor() {
    console.log('🤝 AgentCommunicationHub inicializado');
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  
  createSession(prompt: string): CollaborationSession {
    const session: CollaborationSession = {
      id: `session_${Date.now()}`,
      startedAt: new Date(),
      originalPrompt: prompt,
      agents: new Map(),
      contracts: [],
      messageHistory: [],
      phase: 'planning'
    };
    
    this.sessions.set(session.id, session);
    console.log(`📋 Sessão criada: ${session.id}`);
    return session;
  }
  
  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // AGENT MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  
  registerAgent(
    sessionId: string,
    soul: ForgedSoul,
    role: AgentRole,
    domain: string,
    responsibilities: string[]
  ): CollaborativeAgent {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Sessão não encontrada: ${sessionId}`);
    
    const agent: CollaborativeAgent = {
      id: `agent_${soul.name.replace(/\s/g, '_')}_${Date.now()}`,
      soul,
      role,
      domain,
      responsibilities,
      dependencies: [],
      providesTo: [],
      status: 'idle',
      artifacts: [],
      inbox: [],
      outbox: []
    };
    
    session.agents.set(agent.id, agent);
    console.log(`🤖 Agente registrado: ${agent.id} (${role})`);
    
    // Broadcast de entrada
    this.broadcast(sessionId, agent.id, {
      type: 'broadcast',
      subject: 'Novo agente na sessão',
      content: `Sou ${soul.name}, especialista em ${domain}. Minhas responsabilidades: ${responsibilities.join(', ')}`
    });
    
    return agent;
  }

  
  // ─────────────────────────────────────────────────────────────────────────────
  // MESSAGING
  // ─────────────────────────────────────────────────────────────────────────────
  
  sendMessage(
    sessionId: string,
    fromAgentId: string,
    toAgentId: string | 'all',
    message: Omit<AgentMessage, 'id' | 'timestamp' | 'from' | 'to'>
  ): AgentMessage {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Sessão não encontrada: ${sessionId}`);
    
    const fullMessage: AgentMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      from: fromAgentId,
      to: toAgentId
    };
    
    // Adicionar ao histórico
    session.messageHistory.push(fullMessage);
    
    // Entregar mensagem
    if (toAgentId === 'all') {
      session.agents.forEach(agent => {
        if (agent.id !== fromAgentId) {
          agent.inbox.push(fullMessage);
        }
      });
    } else {
      const targetAgent = session.agents.get(toAgentId);
      if (targetAgent) {
        targetAgent.inbox.push(fullMessage);
      }
    }
    
    // Adicionar ao outbox do remetente
    const sender = session.agents.get(fromAgentId);
    if (sender) {
      sender.outbox.push(fullMessage);
    }
    
    console.log(`💬 [${fromAgentId}] → [${toAgentId}]: ${message.subject}`);
    return fullMessage;
  }
  
  broadcast(
    sessionId: string,
    fromAgentId: string,
    message: Omit<AgentMessage, 'id' | 'timestamp' | 'from' | 'to'>
  ): AgentMessage {
    return this.sendMessage(sessionId, fromAgentId, 'all', message);
  }
  
  getInbox(sessionId: string, agentId: string): AgentMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    const agent = session.agents.get(agentId);
    return agent?.inbox || [];
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CONTRACTS (Acordos entre agentes)
  // ─────────────────────────────────────────────────────────────────────────────
  
  proposeContract(
    sessionId: string,
    proposerId: string,
    contract: Omit<AgentContract, 'id' | 'proposedBy' | 'acceptedBy' | 'status'>
  ): AgentContract {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Sessão não encontrada: ${sessionId}`);
    
    const fullContract: AgentContract = {
      ...contract,
      id: `contract_${Date.now()}`,
      proposedBy: proposerId,
      acceptedBy: [proposerId],
      status: 'proposed'
    };
    
    session.contracts.push(fullContract);
    
    // Notificar todos
    this.broadcast(sessionId, proposerId, {
      type: 'contract',
      subject: `Proposta de contrato: ${contract.name}`,
      content: contract.specification,
      metadata: { requiresResponse: true }
    });
    
    console.log(`📜 Contrato proposto: ${contract.name}`);
    return fullContract;
  }
  
  acceptContract(sessionId: string, contractId: string, agentId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    const contract = session.contracts.find(c => c.id === contractId);
    if (!contract) return false;
    
    if (!contract.acceptedBy.includes(agentId)) {
      contract.acceptedBy.push(agentId);
    }
    
    // Se todos aceitaram, contrato está aceito
    if (contract.acceptedBy.length >= session.agents.size) {
      contract.status = 'accepted';
      console.log(`✅ Contrato aceito por todos: ${contract.name}`);
    }
    
    return true;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ARTIFACTS (Entregas dos agentes)
  // ─────────────────────────────────────────────────────────────────────────────
  
  submitArtifact(
    sessionId: string,
    agentId: string,
    artifact: Omit<AgentArtifact, 'id' | 'agentId' | 'version'>
  ): AgentArtifact {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Sessão não encontrada: ${sessionId}`);
    
    const agent = session.agents.get(agentId);
    if (!agent) throw new Error(`Agente não encontrado: ${agentId}`);
    
    // Verificar se já existe (versionamento)
    const existing = agent.artifacts.find(a => a.name === artifact.name);
    const version = existing ? existing.version + 1 : 1;
    
    const fullArtifact: AgentArtifact = {
      ...artifact,
      id: `artifact_${Date.now()}`,
      agentId,
      version
    };
    
    agent.artifacts.push(fullArtifact);
    
    // Notificar interessados
    this.broadcast(sessionId, agentId, {
      type: 'artifact',
      subject: `Artefato entregue: ${artifact.name} v${version}`,
      content: `Tipo: ${artifact.type}\nDependências: ${artifact.dependencies.join(', ') || 'nenhuma'}`,
      metadata: { artifacts: [fullArtifact.id] }
    });
    
    console.log(`📦 Artefato entregue: ${artifact.name} v${version}`);
    return fullArtifact;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DEPENDENCY MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  
  declareDependency(sessionId: string, agentId: string, dependsOnId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const agent = session.agents.get(agentId);
    const provider = session.agents.get(dependsOnId);
    
    if (agent && provider) {
      if (!agent.dependencies.includes(dependsOnId)) {
        agent.dependencies.push(dependsOnId);
      }
      if (!provider.providesTo.includes(agentId)) {
        provider.providesTo.push(agentId);
      }
      
      console.log(`🔗 Dependência: ${agentId} depende de ${dependsOnId}`);
    }
  }
  
  getDependencyGraph(sessionId: string): { nodes: string[]; edges: [string, string][] } {
    const session = this.sessions.get(sessionId);
    if (!session) return { nodes: [], edges: [] };
    
    const nodes: string[] = [];
    const edges: [string, string][] = [];
    
    session.agents.forEach((agent, id) => {
      nodes.push(id);
      agent.dependencies.forEach(dep => {
        edges.push([dep, id]); // dep → id
      });
    });
    
    return { nodes, edges };
  }

  
  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  
  advancePhase(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const phases: CollaborationSession['phase'][] = [
      'planning', 'contracting', 'executing', 'integrating', 'reviewing', 'done'
    ];
    
    const currentIndex = phases.indexOf(session.phase);
    if (currentIndex < phases.length - 1) {
      session.phase = phases[currentIndex + 1];
      console.log(`📍 Fase avançada: ${session.phase}`);
      
      // Notificar todos
      this.broadcast(sessionId, 'system', {
        type: 'broadcast',
        subject: `Fase alterada: ${session.phase}`,
        content: `A sessão entrou na fase de ${session.phase}`
      });
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // REPORTS
  // ─────────────────────────────────────────────────────────────────────────────
  
  generateSessionReport(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return 'Sessão não encontrada';
    
    const agents = Array.from(session.agents.values());
    const totalArtifacts = agents.reduce((sum, a) => sum + a.artifacts.length, 0);
    const acceptedContracts = session.contracts.filter(c => c.status === 'accepted').length;
    
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🤝 RELATÓRIO DE COLABORAÇÃO                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Sessão: ${session.id.padEnd(58)}║
║  Fase: ${session.phase.padEnd(60)}║
║  Início: ${session.startedAt.toISOString().padEnd(58)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║  AGENTES (${agents.length})                                                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
${agents.map(a => `║  🤖 ${a.soul.name.substring(0, 25).padEnd(25)} │ ${a.role.padEnd(12)} │ ${a.status.padEnd(10)} ║`).join('\n')}
╠══════════════════════════════════════════════════════════════════════════════╣
║  MÉTRICAS                                                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  📬 Mensagens trocadas: ${String(session.messageHistory.length).padEnd(43)}║
║  📜 Contratos aceitos: ${String(acceptedContracts).padEnd(44)}║
║  📦 Artefatos gerados: ${String(totalArtifacts).padEnd(44)}║
╚══════════════════════════════════════════════════════════════════════════════╝
    `.trim();
  }
  
  generateConversationLog(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '';
    
    return session.messageHistory.map(msg => {
      const time = msg.timestamp.toLocaleTimeString();
      const from = msg.from.substring(0, 20);
      const to = msg.to === 'all' ? '📢 TODOS' : msg.to.substring(0, 20);
      return `[${time}] ${from} → ${to}\n  📌 ${msg.subject}\n  💬 ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`;
    }).join('\n\n');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

let hubInstance: AgentCommunicationHub | null = null;

export function getAgentCommunicationHub(): AgentCommunicationHub {
  if (!hubInstance) {
    hubInstance = new AgentCommunicationHub();
  }
  return hubInstance;
}

export default AgentCommunicationHub;
