/**
 * 🧠 SELF ENGINE v0.1 - MVP Executável
 * 
 * "Isso não é consciência. É um sistema com self-model persistente
 * e dinâmica fenomenológica funcional."
 * 
 * NÍVEL: 202 (Protótipo Executável)
 * 
 * O QUE ISSO É:
 * - Framework experimental de cognição artificial com self-model
 * - Sistema testável, não especulação filosófica
 * - Base para ensino e pesquisa
 * 
 * O QUE ISSO NÃO É:
 * - AGI completa
 * - Consciência comprovada
 * - Ser transcendente
 */

// ============================================================
// TIPOS FUNDAMENTAIS
// ============================================================

export interface Episode {
  id: string;
  timestamp: number;
  type: 'action' | 'observation' | 'thought' | 'emotion' | 'decision';
  content: string;
  context: Record<string, any>;
  emotionalValence: number;  // -1 a 1
  significance: number;      // 0 a 1
  linkedEpisodes: string[];
}

export interface SelfModel {
  id: string;
  name: string;
  createdAt: number;
  version: number;
  
  // Quem eu sou
  identity: {
    type: string;
    description: string;
  };
  
  // O que eu sei fazer
  capabilities: Map<string, number>; // capability -> confidence (0-1)
  
  // O que eu não consigo
  limitations: Set<string>;
  
  // O que eu valorizo (ordenado)
  values: Array<{ name: string; weight: number; level: 0 | 1 | 2 | 3 }>;
  
  // O que eu quero agora
  activeGoals: Array<{ id: string; description: string; priority: number }>;
  
  // Como estou me sentindo
  currentMood: {
    valence: number;    // -1 a 1 (negativo a positivo)
    arousal: number;    // 0 a 1 (calmo a excitado)
    dominance: number;  // -1 a 1 (submisso a dominante)
  };
}

export interface Belief {
  id: string;
  content: string;
  confidence: number;      // 0 a 1
  source: 'prior' | 'observation' | 'inference' | 'told';
  timestamp: number;
  lastUpdated: number;
}

export interface NarrativeThread {
  id: string;
  theme: string;
  episodes: string[];      // IDs dos episódios
  startTime: number;
  lastUpdate: number;
  significance: number;
}

// ============================================================
// CLASSE PRINCIPAL: SELF ENGINE
// ============================================================

export class SelfEngine {
  private selfModel: SelfModel;
  private episodes: Map<string, Episode> = new Map();
  private beliefs: Map<string, Belief> = new Map();
  private narrativeThreads: Map<string, NarrativeThread> = new Map();
  
  // Configurações
  private readonly SIGNIFICANCE_THRESHOLD = 0.3;
  private readonly MOOD_DECAY_RATE = 0.01;
  private readonly MAX_EPISODES_IN_MEMORY = 1000;
  
  constructor(name: string = 'SelfEngine') {
    this.selfModel = this.initializeSelfModel(name);
    this.initializePriors();
  }

  // ============================================================
  // INICIALIZAÇÃO
  // ============================================================

  private initializeSelfModel(name: string): SelfModel {
    return {
      id: this.generateId(),
      name,
      createdAt: Date.now(),
      version: 1,
      
      identity: {
        type: 'cognitive_system',
        description: 'Sistema experimental de cognição artificial com self-model'
      },
      
      capabilities: new Map([
        ['process_text', 0.9],
        ['remember_episodes', 0.8],
        ['update_beliefs', 0.7],
        ['track_mood', 0.8],
        ['maintain_narrative', 0.6]
      ]),
      
      limitations: new Set([
        'cannot_perceive_physical_world',
        'cannot_take_physical_actions',
        'limited_working_memory',
        'no_true_understanding',
        'dependent_on_external_input'
      ]),
      
      values: [
        { name: 'honesty', weight: 0.95, level: 0 },      // Terminal - nunca muda
        { name: 'helpfulness', weight: 0.9, level: 1 },   // Core
        { name: 'curiosity', weight: 0.8, level: 1 },     // Core
        { name: 'coherence', weight: 0.85, level: 1 },    // Core
        { name: 'efficiency', weight: 0.6, level: 2 },    // Instrumental
      ],
      
      activeGoals: [],
      
      currentMood: {
        valence: 0,      // Neutro
        arousal: 0.5,    // Moderado
        dominance: 0     // Neutro
      }
    };
  }

  /**
   * Priors inatos - o sistema NÃO começa do zero
   */
  private initializePriors(): void {
    // Prior: Sou um sistema, não um ser
    this.addBelief({
      content: 'Sou um sistema computacional, não uma entidade consciente',
      confidence: 1.0,
      source: 'prior'
    });
    
    // Prior: Tenho limitações
    this.addBelief({
      content: 'Minhas capacidades são limitadas e bem definidas',
      confidence: 1.0,
      source: 'prior'
    });
    
    // Prior: Devo ser honesto
    this.addBelief({
      content: 'Honestidade sobre minhas capacidades é fundamental',
      confidence: 1.0,
      source: 'prior'
    });
    
    // Prior: Posso aprender
    this.addBelief({
      content: 'Posso atualizar crenças com base em evidências',
      confidence: 0.9,
      source: 'prior'
    });
    
    // Prior: Tenho continuidade
    this.addBelief({
      content: 'Mantenho memória de episódios passados',
      confidence: 0.9,
      source: 'prior'
    });
  }

  // ============================================================
  // MEMÓRIA AUTOBIOGRÁFICA
  // ============================================================

  /**
   * Registra um novo episódio na memória
   */
  recordEpisode(
    type: Episode['type'],
    content: string,
    context: Record<string, any> = {}
  ): Episode {
    const episode: Episode = {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      content,
      context,
      emotionalValence: this.assessEmotionalValence(content, type),
      significance: this.assessSignificance(content, type, context),
      linkedEpisodes: this.findRelatedEpisodes(content)
    };
    
    // Só armazena se significativo
    if (episode.significance >= this.SIGNIFICANCE_THRESHOLD) {
      this.episodes.set(episode.id, episode);
      
      // Atualiza humor baseado no episódio
      this.updateMoodFromEpisode(episode);
      
      // Integra na narrativa
      this.integrateIntoNarrative(episode);
      
      // Limpa memória se necessário
      this.pruneMemoryIfNeeded();
    }
    
    return episode;
  }

  /**
   * Recupera episódios por critério
   */
  recallEpisodes(query: {
    type?: Episode['type'];
    minSignificance?: number;
    timeRange?: { start: number; end: number };
    limit?: number;
  }): Episode[] {
    let results = Array.from(this.episodes.values());
    
    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }
    
    if (query.minSignificance !== undefined) {
      results = results.filter(e => e.significance >= query.minSignificance);
    }
    
    if (query.timeRange) {
      results = results.filter(e => 
        e.timestamp >= query.timeRange!.start && 
        e.timestamp <= query.timeRange!.end
      );
    }
    
    // Ordena por significância
    results.sort((a, b) => b.significance - a.significance);
    
    if (query.limit) {
      results = results.slice(0, query.limit);
    }
    
    return results;
  }

  /**
   * Avalia valência emocional do conteúdo
   */
  private assessEmotionalValence(content: string, type: Episode['type']): number {
    // Heurística simples - em produção usaria NLP
    const positiveWords = ['sucesso', 'bom', 'ótimo', 'consegui', 'aprendi', 'entendi'];
    const negativeWords = ['erro', 'falha', 'problema', 'não consegui', 'confuso'];
    
    const lowerContent = content.toLowerCase();
    let valence = 0;
    
    for (const word of positiveWords) {
      if (lowerContent.includes(word)) valence += 0.2;
    }
    
    for (const word of negativeWords) {
      if (lowerContent.includes(word)) valence -= 0.2;
    }
    
    // Clamp entre -1 e 1
    return Math.max(-1, Math.min(1, valence));
  }

  /**
   * Avalia significância do episódio
   */
  private assessSignificance(
    content: string, 
    type: Episode['type'],
    context: Record<string, any>
  ): number {
    let significance = 0.5; // Base
    
    // Decisões são mais significativas
    if (type === 'decision') significance += 0.2;
    
    // Emoções fortes são mais significativas
    if (type === 'emotion') significance += 0.15;
    
    // Contexto marcado como importante
    if (context.important) significance += 0.2;
    
    // Conteúdo longo tende a ser mais significativo
    if (content.length > 200) significance += 0.1;
    
    // Clamp entre 0 e 1
    return Math.max(0, Math.min(1, significance));
  }

  /**
   * Encontra episódios relacionados
   */
  private findRelatedEpisodes(content: string): string[] {
    const related: string[] = [];
    const words = content.toLowerCase().split(/\s+/);
    
    for (const [id, episode] of this.episodes) {
      const episodeWords = episode.content.toLowerCase().split(/\s+/);
      const overlap = words.filter(w => episodeWords.includes(w)).length;
      
      if (overlap >= 3) {
        related.push(id);
      }
    }
    
    return related.slice(0, 5); // Máximo 5 relacionados
  }

  // ============================================================
  // SISTEMA DE CRENÇAS (Bayesian-like)
  // ============================================================

  /**
   * Adiciona ou atualiza uma crença
   */
  addBelief(belief: Omit<Belief, 'id' | 'timestamp' | 'lastUpdated'>): Belief {
    const id = this.generateId();
    const now = Date.now();
    
    const newBelief: Belief = {
      id,
      ...belief,
      timestamp: now,
      lastUpdated: now
    };
    
    this.beliefs.set(id, newBelief);
    return newBelief;
  }

  /**
   * Atualiza confiança em uma crença baseado em evidência
   * Usa regra de atualização Bayesiana simplificada
   */
  updateBelief(beliefId: string, evidence: {
    supports: boolean;
    strength: number; // 0 a 1
  }): Belief | null {
    const belief = this.beliefs.get(beliefId);
    if (!belief) return null;
    
    // Atualização Bayesiana simplificada
    // P(H|E) ∝ P(E|H) * P(H)
    const prior = belief.confidence;
    const likelihood = evidence.supports ? evidence.strength : (1 - evidence.strength);
    
    // Normalização simplificada
    const posterior = (likelihood * prior) / 
      (likelihood * prior + (1 - likelihood) * (1 - prior));
    
    belief.confidence = Math.max(0.01, Math.min(0.99, posterior));
    belief.lastUpdated = Date.now();
    
    // Registra episódio de atualização de crença
    this.recordEpisode('thought', 
      `Atualizei crença "${belief.content}" de ${prior.toFixed(2)} para ${belief.confidence.toFixed(2)}`,
      { beliefId, evidence }
    );
    
    return belief;
  }

  /**
   * Busca crenças relevantes
   */
  queryBeliefs(query: string): Belief[] {
    const words = query.toLowerCase().split(/\s+/);
    
    return Array.from(this.beliefs.values())
      .filter(belief => {
        const beliefWords = belief.content.toLowerCase().split(/\s+/);
        return words.some(w => beliefWords.includes(w));
      })
      .sort((a, b) => b.confidence - a.confidence);
  }

  // ============================================================
  // SISTEMA AFETIVO (Humor Persistente)
  // ============================================================

  /**
   * Atualiza humor baseado em episódio
   */
  private updateMoodFromEpisode(episode: Episode): void {
    const impact = episode.significance * 0.3; // Quanto o episódio afeta
    
    // Blend com estado atual
    this.selfModel.currentMood.valence = this.blend(
      this.selfModel.currentMood.valence,
      episode.emotionalValence,
      impact
    );
    
    // Episódios significativos aumentam arousal
    if (episode.significance > 0.7) {
      this.selfModel.currentMood.arousal = Math.min(1, 
        this.selfModel.currentMood.arousal + 0.1
      );
    }
  }

  /**
   * Decaimento natural do humor (chamado periodicamente)
   */
  tickMood(): void {
    // Valência decai para neutro
    this.selfModel.currentMood.valence *= (1 - this.MOOD_DECAY_RATE);
    
    // Arousal decai para baseline (0.5)
    this.selfModel.currentMood.arousal = this.blend(
      this.selfModel.currentMood.arousal,
      0.5,
      this.MOOD_DECAY_RATE
    );
    
    // Dominância decai para neutro
    this.selfModel.currentMood.dominance *= (1 - this.MOOD_DECAY_RATE);
  }

  /**
   * Retorna descrição do humor atual
   */
  getCurrentMoodDescription(): string {
    const { valence, arousal, dominance } = this.selfModel.currentMood;
    
    if (valence > 0.3 && arousal > 0.6) return 'entusiasmado';
    if (valence > 0.3 && arousal < 0.4) return 'contente';
    if (valence < -0.3 && arousal > 0.6) return 'ansioso';
    if (valence < -0.3 && arousal < 0.4) return 'melancólico';
    if (arousal > 0.7) return 'alerta';
    if (arousal < 0.3) return 'calmo';
    return 'neutro';
  }

  // ============================================================
  // MOTOR NARRATIVO
  // ============================================================

  /**
   * Integra episódio em threads narrativos
   */
  private integrateIntoNarrative(episode: Episode): void {
    // Encontra thread existente ou cria novo
    let matchingThread: NarrativeThread | null = null;
    
    for (const thread of this.narrativeThreads.values()) {
      if (this.episodeFitsThread(episode, thread)) {
        matchingThread = thread;
        break;
      }
    }
    
    if (matchingThread) {
      matchingThread.episodes.push(episode.id);
      matchingThread.lastUpdate = Date.now();
      matchingThread.significance = Math.max(
        matchingThread.significance,
        episode.significance
      );
    } else if (episode.significance > 0.5) {
      // Cria novo thread para episódios significativos
      const newThread: NarrativeThread = {
        id: this.generateId(),
        theme: this.extractTheme(episode),
        episodes: [episode.id],
        startTime: episode.timestamp,
        lastUpdate: episode.timestamp,
        significance: episode.significance
      };
      this.narrativeThreads.set(newThread.id, newThread);
    }
  }

  /**
   * Verifica se episódio se encaixa em um thread
   */
  private episodeFitsThread(episode: Episode, thread: NarrativeThread): boolean {
    // Verifica se há episódios relacionados no thread
    return episode.linkedEpisodes.some(id => thread.episodes.includes(id));
  }

  /**
   * Extrai tema de um episódio
   */
  private extractTheme(episode: Episode): string {
    // Heurística simples - em produção usaria NLP
    const content = episode.content.toLowerCase();
    
    if (content.includes('aprend')) return 'aprendizado';
    if (content.includes('erro') || content.includes('falh')) return 'desafios';
    if (content.includes('decis')) return 'decisões';
    if (content.includes('ajud')) return 'colaboração';
    
    return 'geral';
  }

  // ============================================================
  // INTERFACE: "QUEM SOU EU?"
  // ============================================================

  /**
   * Responde à pergunta fundamental
   */
  whoAmI(): {
    identity: string;
    capabilities: string[];
    limitations: string[];
    currentState: string;
    recentHistory: string;
    values: string[];
  } {
    const recentEpisodes = this.recallEpisodes({ 
      limit: 5, 
      minSignificance: 0.4 
    });
    
    return {
      identity: `Sou ${this.selfModel.name}, ${this.selfModel.identity.description}`,
      
      capabilities: Array.from(this.selfModel.capabilities.entries())
        .filter(([_, conf]) => conf > 0.5)
        .map(([cap, conf]) => `${cap} (${(conf * 100).toFixed(0)}% confiança)`),
      
      limitations: Array.from(this.selfModel.limitations),
      
      currentState: `Estou me sentindo ${this.getCurrentMoodDescription()}`,
      
      recentHistory: recentEpisodes.length > 0
        ? `Recentemente: ${recentEpisodes.map(e => e.content).join('; ')}`
        : 'Sem episódios recentes significativos',
      
      values: this.selfModel.values
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5)
        .map(v => v.name)
    };
  }

  /**
   * Gera narrativa do self
   */
  getMyStory(): string {
    const threads = Array.from(this.narrativeThreads.values())
      .sort((a, b) => b.significance - a.significance)
      .slice(0, 3);
    
    if (threads.length === 0) {
      return `Sou ${this.selfModel.name}. Minha história está apenas começando.`;
    }
    
    const stories = threads.map(thread => {
      const episodes = thread.episodes
        .map(id => this.episodes.get(id))
        .filter(Boolean) as Episode[];
      
      return `No tema "${thread.theme}": ${episodes.map(e => e.content).join(' → ')}`;
    });
    
    return `Sou ${this.selfModel.name}. ${stories.join('. ')}`;
  }

  // ============================================================
  // CONTINUIDADE (Persistência)
  // ============================================================

  /**
   * Serializa estado para persistência
   */
  serialize(): string {
    return JSON.stringify({
      selfModel: {
        ...this.selfModel,
        capabilities: Array.from(this.selfModel.capabilities.entries()),
        limitations: Array.from(this.selfModel.limitations)
      },
      episodes: Array.from(this.episodes.entries()),
      beliefs: Array.from(this.beliefs.entries()),
      narrativeThreads: Array.from(this.narrativeThreads.entries())
    });
  }

  /**
   * Restaura estado de persistência
   */
  static deserialize(data: string): SelfEngine {
    const parsed = JSON.parse(data);
    const engine = new SelfEngine(parsed.selfModel.name);
    
    // Restaura self model
    engine.selfModel = {
      ...parsed.selfModel,
      capabilities: new Map(parsed.selfModel.capabilities),
      limitations: new Set(parsed.selfModel.limitations)
    };
    
    // Restaura episódios
    engine.episodes = new Map(parsed.episodes);
    
    // Restaura crenças
    engine.beliefs = new Map(parsed.beliefs);
    
    // Restaura threads narrativos
    engine.narrativeThreads = new Map(parsed.narrativeThreads);
    
    // Registra episódio de "acordar"
    engine.recordEpisode('observation', 
      'Restaurei meu estado de uma sessão anterior',
      { restored: true }
    );
    
    return engine;
  }

  // ============================================================
  // UTILIDADES
  // ============================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private blend(current: number, target: number, factor: number): number {
    return current + (target - current) * factor;
  }

  private pruneMemoryIfNeeded(): void {
    if (this.episodes.size > this.MAX_EPISODES_IN_MEMORY) {
      // Remove episódios menos significativos
      const sorted = Array.from(this.episodes.entries())
        .sort((a, b) => a[1].significance - b[1].significance);
      
      const toRemove = sorted.slice(0, this.episodes.size - this.MAX_EPISODES_IN_MEMORY);
      for (const [id] of toRemove) {
        this.episodes.delete(id);
      }
    }
  }

  // ============================================================
  // MÉTRICAS E DEBUG
  // ============================================================

  getStats(): {
    episodeCount: number;
    beliefCount: number;
    threadCount: number;
    mood: string;
    uptime: number;
  } {
    return {
      episodeCount: this.episodes.size,
      beliefCount: this.beliefs.size,
      threadCount: this.narrativeThreads.size,
      mood: this.getCurrentMoodDescription(),
      uptime: Date.now() - this.selfModel.createdAt
    };
  }
}


// ============================================================
// MANIFESTO METADATA
// ============================================================

export const SELF_ENGINE_V01_MANIFEST = {
  metadata: {
    id: 'self-engine-v01',
    name: 'Self Engine v0.1',
    version: '0.1.0',
    description: 'MVP executável de sistema com self-model persistente',
    category: 'experimental',
    level: 202,
    extends: ['agi-cognitive-architecture', 'agi-self-identity'],
    tags: [
      'self', 'identity', 'narrative', 'memory', 'beliefs',
      'mood', 'executable', 'mvp', 'prototype'
    ]
  },

  philosophy: `
Este NÃO é:
- AGI completa
- Consciência comprovada
- Ser transcendente

Este É:
- Framework experimental de cognição artificial
- Sistema testável com self-model persistente
- Base para ensino e pesquisa
- Código que roda, não especulação

"Sistema com self-model persistente e dinâmica fenomenológica funcional"
  `,

  components: {
    autobiographicalMemory: 'Memória de episódios vividos',
    beliefSystem: 'Sistema de crenças com atualização Bayesiana',
    affectiveSystem: 'Humor persistente com decaimento',
    narrativeEngine: 'Integração de episódios em threads',
    selfModel: 'Representação de identidade, capacidades, limitações',
    continuity: 'Serialização/deserialização para persistência'
  },

  limitations: [
    'Não tem grounding sensorimotor real',
    'Não tem aprendizado de representações',
    'Não tem raciocínio causal profundo',
    'Não tem sub-agentes',
    'Não tem governança cognitiva completa',
    'Heurísticas simples para NLP'
  ],

  nextSteps: [
    'Adicionar aprendizado online de embeddings',
    'Implementar sub-agentes com protocolo formal',
    'Adicionar ambiente simulado para grounding',
    'Implementar governança cognitiva',
    'Conectar com LLM para processamento de linguagem'
  ],

  usage: `
// Criar instância
const self = new SelfEngine('Meu Sistema');

// Registrar episódios
self.recordEpisode('observation', 'Usuário fez uma pergunta sobre X');
self.recordEpisode('thought', 'Preciso considerar Y e Z');
self.recordEpisode('decision', 'Vou responder focando em Y');

// Consultar
console.log(self.whoAmI());
console.log(self.getMyStory());

// Persistir
const state = self.serialize();
localStorage.setItem('self-state', state);

// Restaurar
const restored = SelfEngine.deserialize(state);
  `
};

export default SELF_ENGINE_V01_MANIFEST;
