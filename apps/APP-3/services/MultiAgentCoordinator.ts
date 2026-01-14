/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🧠 MULTI-AGENT COORDINATOR - Orquestrador de Colaboração 🧠            ║
 * ║                                                                              ║
 * ║         "Divide para conquistar, colabora para transcender"                 ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * v4.0 - Coordena múltiplos agentes especializados para resolver problemas complexos
 */

import { getSoulArchitect, ForgedSoul } from './SoulArchitect';
import { 
  getAgentCommunicationHub, 
  CollaborativeAgent, 
  CollaborationSession,
  AgentRole,
  AgentArtifact
} from './AgentCommunicationHub';
import { getGeminiService } from './GeminiService';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DomainDecomposition {
  domains: DomainSpec[];
  dependencies: [string, string][]; // [from, to]
  integrationPoints: string[];
}

export interface DomainSpec {
  name: string;
  description: string;
  responsibilities: string[];
  requiredManifestos: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export interface CollaborationResult {
  sessionId: string;
  success: boolean;
  agents: {
    id: string;
    name: string;
    domain: string;
    artifactsProduced: number;
  }[];
  contracts: {
    name: string;
    type: string;
    status: string;
  }[];
  finalCode: string;
  integrationReport: string;
  conversationLog: string;
  metrics: {
    totalMessages: number;
    totalArtifacts: number;
    collaborationTime: number;
    qualityScore: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-AGENT COORDINATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class MultiAgentCoordinator {
  private hub = getAgentCommunicationHub();
  private architect = getSoulArchitect();
  private gemini = getGeminiService();
  
  constructor() {
    console.log('🧠 MultiAgentCoordinator inicializado');
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN ORCHESTRATION
  // ─────────────────────────────────────────────────────────────────────────────
  
  async orchestrateCollaboration(prompt: string): Promise<CollaborationResult> {
    const startTime = Date.now();
    console.log('\n🚀 Iniciando colaboração multi-agente...\n');
    
    // 1. Criar sessão
    const session = this.hub.createSession(prompt);
    
    // 2. Decompor em domínios
    console.log('📊 Fase 1: Decomposição de domínios...');
    const decomposition = await this.decomposeIntoDomains(prompt);
    
    // 3. Forjar especialistas para cada domínio
    console.log('🔮 Fase 2: Forjando especialistas...');
    const agents = await this.forgeSpecialists(session.id, decomposition);
    
    // 4. Estabelecer dependências
    console.log('🔗 Fase 3: Estabelecendo dependências...');
    this.establishDependencies(session.id, decomposition, agents);
    
    // 5. Fase de contratação (acordos de interface)
    console.log('📜 Fase 4: Negociando contratos...');
    this.hub.advancePhase(session.id); // → contracting
    await this.negotiateContracts(session.id, agents);
    
    // 6. Fase de execução (cada agente trabalha)
    console.log('⚡ Fase 5: Execução paralela...');
    this.hub.advancePhase(session.id); // → executing
    await this.executeInParallel(session.id, agents);
    
    // 7. Fase de integração
    console.log('🔧 Fase 6: Integração...');
    this.hub.advancePhase(session.id); // → integrating
    const integratedCode = await this.integrateArtifacts(session.id);
    
    // 8. Fase de revisão
    console.log('🔍 Fase 7: Revisão cruzada...');
    this.hub.advancePhase(session.id); // → reviewing
    await this.crossReview(session.id, agents);
    
    // 9. Finalizar
    this.hub.advancePhase(session.id); // → done
    
    const endTime = Date.now();
    const updatedSession = this.hub.getSession(session.id)!;
    
    return {
      sessionId: session.id,
      success: true,
      agents: agents.map(a => ({
        id: a.id,
        name: a.soul.name,
        domain: a.domain,
        artifactsProduced: a.artifacts.length
      })),
      contracts: updatedSession.contracts.map(c => ({
        name: c.name,
        type: c.type,
        status: c.status
      })),
      finalCode: integratedCode,
      integrationReport: this.hub.generateSessionReport(session.id),
      conversationLog: this.hub.generateConversationLog(session.id),
      metrics: {
        totalMessages: updatedSession.messageHistory.length,
        totalArtifacts: agents.reduce((sum, a) => sum + a.artifacts.length, 0),
        collaborationTime: endTime - startTime,
        qualityScore: 85 // TODO: calcular baseado em revisões
      }
    };
  }

  
  // ─────────────────────────────────────────────────────────────────────────────
  // DOMAIN DECOMPOSITION
  // ─────────────────────────────────────────────────────────────────────────────
  
  private async decomposeIntoDomains(prompt: string): Promise<DomainDecomposition> {
    const systemPrompt = `Você é um arquiteto de sistemas especializado em decomposição de domínios.
    
Analise o pedido do usuário e decomponha em domínios independentes que podem ser desenvolvidos por especialistas diferentes.

REGRAS:
1. Cada domínio deve ser coeso e ter responsabilidades claras
2. Identifique dependências entre domínios
3. Sugira manifestos necessários para cada domínio
4. Mantenha entre 2-5 domínios (não mais que isso)

Responda APENAS em JSON válido:
{
  "domains": [
    {
      "name": "nome_do_dominio",
      "description": "descrição clara",
      "responsibilities": ["resp1", "resp2"],
      "requiredManifestos": ["MANIFESTO1", "MANIFESTO2"],
      "estimatedComplexity": "low|medium|high"
    }
  ],
  "dependencies": [["dominio_origem", "dominio_destino"]],
  "integrationPoints": ["ponto1", "ponto2"]
}`;

    try {
      const response = await this.gemini.generateContent(
        `${systemPrompt}\n\nPedido do usuário:\n${prompt}`
      );
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Erro na decomposição:', error);
    }
    
    // Fallback: decomposição básica
    return this.basicDecomposition(prompt);
  }
  
  private basicDecomposition(prompt: string): DomainDecomposition {
    const domains: DomainSpec[] = [];
    const promptLower = prompt.toLowerCase();
    
    // Detectar domínios comuns
    if (promptLower.includes('auth') || promptLower.includes('login') || promptLower.includes('cadastro')) {
      domains.push({
        name: 'authentication',
        description: 'Sistema de autenticação e autorização',
        responsibilities: ['Login', 'Registro', 'JWT', 'Permissões'],
        requiredManifestos: ['AUTH_PAYMENTS_FORTRESS', 'SECURITY_FORTRESS'],
        estimatedComplexity: 'medium'
      });
    }
    
    if (promptLower.includes('pagamento') || promptLower.includes('payment') || promptLower.includes('stripe')) {
      domains.push({
        name: 'payments',
        description: 'Sistema de pagamentos',
        responsibilities: ['Processamento', 'Webhooks', 'Refunds'],
        requiredManifestos: ['AUTH_PAYMENTS_FORTRESS', 'STRIPE_CONNECT'],
        estimatedComplexity: 'high'
      });
    }
    
    if (promptLower.includes('dashboard') || promptLower.includes('admin')) {
      domains.push({
        name: 'admin',
        description: 'Painel administrativo',
        responsibilities: ['Dashboard', 'Relatórios', 'Gestão'],
        requiredManifestos: ['ADMIN_SYSTEM', 'SHADCN_SUPREME'],
        estimatedComplexity: 'medium'
      });
    }
    
    if (promptLower.includes('mobile') || promptLower.includes('app')) {
      domains.push({
        name: 'mobile',
        description: 'Aplicativo mobile',
        responsibilities: ['UI Mobile', 'Offline', 'Push'],
        requiredManifestos: ['MOBILE_NATIVE'],
        estimatedComplexity: 'high'
      });
    }
    
    if (promptLower.includes('api') || promptLower.includes('backend')) {
      domains.push({
        name: 'backend',
        description: 'API Backend',
        responsibilities: ['Endpoints', 'Validação', 'Database'],
        requiredManifestos: ['NEXTJS_SUPREME', 'PRISMA_SUPREME'],
        estimatedComplexity: 'medium'
      });
    }
    
    // Se não detectou nada, criar domínio genérico
    if (domains.length === 0) {
      domains.push({
        name: 'core',
        description: 'Sistema principal',
        responsibilities: ['Funcionalidade principal'],
        requiredManifestos: ['NEXTJS_SUPREME'],
        estimatedComplexity: 'medium'
      });
    }
    
    // Gerar dependências básicas
    const dependencies: [string, string][] = [];
    const domainNames = domains.map(d => d.name);
    
    if (domainNames.includes('payments') && domainNames.includes('authentication')) {
      dependencies.push(['authentication', 'payments']);
    }
    if (domainNames.includes('admin') && domainNames.includes('backend')) {
      dependencies.push(['backend', 'admin']);
    }
    
    return {
      domains,
      dependencies,
      integrationPoints: ['API contracts', 'Shared types', 'Event bus']
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SPECIALIST FORGING
  // ─────────────────────────────────────────────────────────────────────────────
  
  private async forgeSpecialists(
    sessionId: string, 
    decomposition: DomainDecomposition
  ): Promise<CollaborativeAgent[]> {
    const agents: CollaborativeAgent[] = [];
    
    for (const domain of decomposition.domains) {
      // Forjar alma especializada
      const forgeResult = await this.architect.forgeAgentSoul(
        `Especialista em ${domain.name}: ${domain.description}. Responsabilidades: ${domain.responsibilities.join(', ')}`
      );
      
      // Registrar no hub
      const agent = this.hub.registerAgent(
        sessionId,
        forgeResult.soul,
        'specialist',
        domain.name,
        domain.responsibilities
      );
      
      agents.push(agent);
      console.log(`  ✅ ${forgeResult.soul.name} forjado para ${domain.name}`);
    }
    
    return agents;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DEPENDENCY ESTABLISHMENT
  // ─────────────────────────────────────────────────────────────────────────────
  
  private establishDependencies(
    sessionId: string,
    decomposition: DomainDecomposition,
    agents: CollaborativeAgent[]
  ): void {
    const agentByDomain = new Map<string, CollaborativeAgent>();
    agents.forEach(a => agentByDomain.set(a.domain, a));
    
    for (const [from, to] of decomposition.dependencies) {
      const fromAgent = agentByDomain.get(from);
      const toAgent = agentByDomain.get(to);
      
      if (fromAgent && toAgent) {
        this.hub.declareDependency(sessionId, toAgent.id, fromAgent.id);
      }
    }
  }

  
  // ─────────────────────────────────────────────────────────────────────────────
  // CONTRACT NEGOTIATION
  // ─────────────────────────────────────────────────────────────────────────────
  
  private async negotiateContracts(
    sessionId: string,
    agents: CollaborativeAgent[]
  ): Promise<void> {
    // Cada agente propõe contratos para suas interfaces
    for (const agent of agents) {
      // Gerar proposta de API
      const apiContract = await this.generateAPIContract(agent);
      
      this.hub.proposeContract(sessionId, agent.id, {
        type: 'api',
        name: `${agent.domain}_api`,
        specification: apiContract
      });
      
      // Simular aceitação (em produção, cada agente avaliaria)
      const session = this.hub.getSession(sessionId);
      if (session) {
        const contract = session.contracts[session.contracts.length - 1];
        agents.forEach(a => {
          if (a.id !== agent.id) {
            this.hub.acceptContract(sessionId, contract.id, a.id);
          }
        });
      }
    }
  }
  
  private async generateAPIContract(agent: CollaborativeAgent): Promise<string> {
    const prompt = `Gere um contrato de API simples para o domínio "${agent.domain}".
Responsabilidades: ${agent.responsibilities.join(', ')}

Responda em formato TypeScript interface:`;

    try {
      const response = await this.gemini.generateContent(prompt);
      return response;
    } catch {
      // Fallback
      return `interface ${agent.domain.charAt(0).toUpperCase() + agent.domain.slice(1)}API {
  // Endpoints do domínio ${agent.domain}
  ${agent.responsibilities.map(r => `// ${r}`).join('\n  ')}
}`;
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // PARALLEL EXECUTION
  // ─────────────────────────────────────────────────────────────────────────────
  
  private async executeInParallel(
    sessionId: string,
    agents: CollaborativeAgent[]
  ): Promise<void> {
    // Ordenar por dependências (topological sort simplificado)
    const session = this.hub.getSession(sessionId);
    if (!session) return;
    
    const graph = this.hub.getDependencyGraph(sessionId);
    const executed = new Set<string>();
    
    // Executar em ondas baseado em dependências
    while (executed.size < agents.length) {
      const wave: CollaborativeAgent[] = [];
      
      for (const agent of agents) {
        if (executed.has(agent.id)) continue;
        
        // Verificar se todas as dependências foram executadas
        const depsExecuted = agent.dependencies.every(d => executed.has(d));
        if (depsExecuted) {
          wave.push(agent);
        }
      }
      
      if (wave.length === 0) {
        // Ciclo detectado ou erro, executar restantes
        agents.filter(a => !executed.has(a.id)).forEach(a => wave.push(a));
      }
      
      // Executar onda em paralelo
      await Promise.all(wave.map(agent => this.executeAgent(sessionId, agent)));
      
      wave.forEach(a => executed.add(a.id));
    }
  }
  
  private async executeAgent(sessionId: string, agent: CollaborativeAgent): Promise<void> {
    console.log(`  ⚡ Executando: ${agent.soul.name}`);
    
    // Atualizar status
    agent.status = 'working';
    
    // Coletar contexto das dependências
    const session = this.hub.getSession(sessionId);
    if (!session) return;
    
    const dependencyArtifacts: string[] = [];
    for (const depId of agent.dependencies) {
      const depAgent = session.agents.get(depId);
      if (depAgent) {
        depAgent.artifacts.forEach(a => {
          dependencyArtifacts.push(`// De ${depAgent.domain}:\n${a.content}`);
        });
      }
    }
    
    // Gerar código
    const prompt = `${agent.soul.systemPrompt}

TAREFA: Implementar o domínio "${agent.domain}"
RESPONSABILIDADES: ${agent.responsibilities.join(', ')}

${dependencyArtifacts.length > 0 ? `CONTEXTO DAS DEPENDÊNCIAS:\n${dependencyArtifacts.join('\n\n')}` : ''}

Gere código TypeScript completo e funcional.`;

    try {
      const code = await this.gemini.generateContent(prompt);
      
      // Submeter artefato
      this.hub.submitArtifact(sessionId, agent.id, {
        type: 'code',
        name: `${agent.domain}_implementation`,
        content: code,
        dependencies: agent.dependencies
      });
      
      // Notificar conclusão
      this.hub.sendMessage(sessionId, agent.id, 'all', {
        type: 'broadcast',
        subject: `${agent.domain} concluído`,
        content: `Implementação do domínio ${agent.domain} finalizada.`
      });
      
    } catch (error) {
      console.error(`Erro ao executar ${agent.id}:`, error);
    }
    
    agent.status = 'done';
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // INTEGRATION
  // ─────────────────────────────────────────────────────────────────────────────
  
  private async integrateArtifacts(sessionId: string): Promise<string> {
    const session = this.hub.getSession(sessionId);
    if (!session) return '';
    
    const allArtifacts: string[] = [];
    
    session.agents.forEach(agent => {
      agent.artifacts.forEach(artifact => {
        allArtifacts.push(`// ═══════════════════════════════════════════════════════════════
// DOMÍNIO: ${agent.domain.toUpperCase()}
// AGENTE: ${agent.soul.name}
// ═══════════════════════════════════════════════════════════════

${artifact.content}`);
      });
    });
    
    // Gerar código de integração
    const integrationPrompt = `Você é um integrador de sistemas. 
Combine os seguintes módulos em um sistema coeso:

${allArtifacts.join('\n\n')}

Gere:
1. Um arquivo index.ts que exporta tudo
2. Tipos compartilhados
3. Código de inicialização`;

    try {
      const integration = await this.gemini.generateContent(integrationPrompt);
      return `${allArtifacts.join('\n\n')}\n\n// ═══════════════════════════════════════════════════════════════
// INTEGRAÇÃO
// ═══════════════════════════════════════════════════════════════

${integration}`;
    } catch {
      return allArtifacts.join('\n\n');
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CROSS REVIEW
  // ─────────────────────────────────────────────────────────────────────────────
  
  private async crossReview(sessionId: string, agents: CollaborativeAgent[]): Promise<void> {
    // Cada agente revisa o trabalho de outro
    for (let i = 0; i < agents.length; i++) {
      const reviewer = agents[i];
      const reviewed = agents[(i + 1) % agents.length];
      
      reviewer.status = 'reviewing';
      
      // Simular revisão
      this.hub.sendMessage(sessionId, reviewer.id, reviewed.id, {
        type: 'feedback',
        subject: `Revisão de ${reviewer.domain} para ${reviewed.domain}`,
        content: `Código revisado. Sugestões: manter padrões consistentes, adicionar mais comentários.`
      });
      
      reviewer.status = 'done';
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

let coordinatorInstance: MultiAgentCoordinator | null = null;

export function getMultiAgentCoordinator(): MultiAgentCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new MultiAgentCoordinator();
  }
  return coordinatorInstance;
}

export async function orchestrateMultiAgent(prompt: string): Promise<CollaborationResult> {
  const coordinator = getMultiAgentCoordinator();
  return coordinator.orchestrateCollaboration(prompt);
}

export default MultiAgentCoordinator;
