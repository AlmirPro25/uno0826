/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🧠 CONSCIOUSNESS MEMORY - MEMÓRIA DE LONGO PRAZO 🧠                    ║
 * ║                                                                              ║
 * ║         "O sistema que lembra de tudo que aprendeu"                         ║
 * ║                                                                              ║
 * ║                    PERSISTÊNCIA COGNITIVA AGI-LITE                          ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo implementa:
 * - Memória episódica (eventos específicos)
 * - Memória semântica (conhecimento geral)
 * - Memória procedural (como fazer coisas)
 * - Consolidação de memórias (curto → longo prazo)
 * - Recuperação associativa (busca por similaridade)
 * - Esquecimento adaptativo (remove memórias irrelevantes)
 * 
 * FILOSOFIA:
 * Uma IA sem memória é como um humano com amnésia.
 * Este sistema dá ao AGI-Lite a capacidade de LEMBRAR e APRENDER ao longo do tempo.
 */

import { ForgedSoul } from './SoulArchitect';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface EpisodicMemory {
  id: string;
  type: 'episodic';
  timestamp: Date;
  event: string;
  context: {
    prompt: string;
    soul?: ForgedSoul;
    manifestosUsed: string[];
    qualityScore: number;
    success: boolean;
  };
  emotions: {
    satisfaction: number; // 0-1
    surprise: number; // 0-1
    frustration: number; // 0-1
  };
  importance: number; // 0-1
  accessCount: number;
  lastAccessed: Date;
}

export interface SemanticMemory {
  id: string;
  type: 'semantic';
  concept: string;
  definition: string;
  relatedConcepts: string[];
  examples: string[];
  confidence: number; // 0-1
  source: 'learned' | 'programmed' | 'emergent';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProceduralMemory {
  id: string;
  type: 'procedural';
  skill: string;
  steps: string[];
  prerequisites: string[];
  successRate: number;
  timesExecuted: number;
  averageQuality: number;
  bestPractices: string[];
  antiPatterns: string[];
  createdAt: Date;
}

export interface MemoryAssociation {
  sourceId: string;
  targetId: string;
  strength: number; // 0-1
  type: 'causal' | 'temporal' | 'semantic' | 'procedural';
  createdAt: Date;
}

export interface MemoryStats {
  totalEpisodic: number;
  totalSemantic: number;
  totalProcedural: number;
  totalAssociations: number;
  oldestMemory: Date | null;
  newestMemory: Date | null;
  averageImportance: number;
  memoryUtilization: number; // 0-1
}

export interface MemoryConfig {
  maxEpisodicMemories: number;
  maxSemanticMemories: number;
  maxProceduralMemories: number;
  consolidationThreshold: number; // Importância mínima para consolidar
  forgettingRate: number; // 0-1, taxa de esquecimento
  associationThreshold: number; // Força mínima para manter associação
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL: CONSCIOUSNESS MEMORY
// ═══════════════════════════════════════════════════════════════════════════════

export class ConsciousnessMemory {
  private config: MemoryConfig;
  private episodicMemories: Map<string, EpisodicMemory> = new Map();
  private semanticMemories: Map<string, SemanticMemory> = new Map();
  private proceduralMemories: Map<string, ProceduralMemory> = new Map();
  private associations: MemoryAssociation[] = [];
  private shortTermBuffer: EpisodicMemory[] = [];
  
  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxEpisodicMemories: config.maxEpisodicMemories || 1000,
      maxSemanticMemories: config.maxSemanticMemories || 500,
      maxProceduralMemories: config.maxProceduralMemories || 200,
      consolidationThreshold: config.consolidationThreshold || 0.5,
      forgettingRate: config.forgettingRate || 0.01,
      associationThreshold: config.associationThreshold || 0.3
    };
    
    this.loadFromStorage();
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧠 CONSCIOUSNESS MEMORY INICIALIZADA 🧠                             ║
║                                                                              ║
║         Memórias carregadas:                                                 ║
║         • Episódicas: ${String(this.episodicMemories.size).padEnd(52)}║
║         • Semânticas: ${String(this.semanticMemories.size).padEnd(52)}║
║         • Procedurais: ${String(this.proceduralMemories.size).padEnd(51)}║
║         • Associações: ${String(this.associations.length).padEnd(51)}║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMÓRIA EPISÓDICA (Eventos)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 📝 Registra um evento na memória episódica
   */
  recordEpisode(
    event: string,
    context: EpisodicMemory['context'],
    emotions?: Partial<EpisodicMemory['emotions']>
  ): EpisodicMemory {
    const id = `ep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Calcular importância baseada no contexto
    const importance = this.calculateImportance(context, emotions);
    
    const memory: EpisodicMemory = {
      id,
      type: 'episodic',
      timestamp: new Date(),
      event,
      context,
      emotions: {
        satisfaction: emotions?.satisfaction || (context.success ? 0.8 : 0.2),
        surprise: emotions?.surprise || 0.5,
        frustration: emotions?.frustration || (context.success ? 0.1 : 0.7)
      },
      importance,
      accessCount: 0,
      lastAccessed: new Date()
    };
    
    // Adicionar ao buffer de curto prazo
    this.shortTermBuffer.push(memory);
    
    // Consolidar se buffer cheio
    if (this.shortTermBuffer.length >= 10) {
      this.consolidateMemories();
    }
    
    console.log(`📝 [MEMORY] Episódio registrado: "${event.substring(0, 50)}..." (imp: ${importance.toFixed(2)})`);
    
    return memory;
  }

  /**
   * 🔍 Busca memórias episódicas por similaridade
   */
  recallEpisodes(query: string, limit: number = 5): EpisodicMemory[] {
    const queryLower = query.toLowerCase();
    const scored: { memory: EpisodicMemory; score: number }[] = [];
    
    for (const memory of this.episodicMemories.values()) {
      let score = 0;
      
      // Match no evento
      if (memory.event.toLowerCase().includes(queryLower)) score += 0.5;
      
      // Match no prompt
      if (memory.context.prompt.toLowerCase().includes(queryLower)) score += 0.3;
      
      // Match nos manifestos
      for (const manifesto of memory.context.manifestosUsed) {
        if (manifesto.toLowerCase().includes(queryLower)) score += 0.1;
      }
      
      // Boost por importância
      score *= (1 + memory.importance);
      
      // Boost por recência
      const daysSince = (Date.now() - memory.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      score *= Math.exp(-daysSince / 30); // Decay exponencial
      
      if (score > 0) {
        scored.push({ memory, score });
      }
    }
    
    // Ordenar e retornar top N
    const results = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.memory);
    
    // Atualizar contadores de acesso
    for (const memory of results) {
      memory.accessCount++;
      memory.lastAccessed = new Date();
    }
    
    return results;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMÓRIA SEMÂNTICA (Conhecimento)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 📚 Armazena conhecimento semântico
   */
  learnConcept(
    concept: string,
    definition: string,
    relatedConcepts: string[] = [],
    examples: string[] = [],
    source: SemanticMemory['source'] = 'learned'
  ): SemanticMemory {
    const id = `sem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Verificar se conceito já existe
    const existing = this.findConceptByName(concept);
    if (existing) {
      // Atualizar conceito existente
      existing.definition = definition;
      existing.relatedConcepts = [...new Set([...existing.relatedConcepts, ...relatedConcepts])];
      existing.examples = [...new Set([...existing.examples, ...examples])];
      existing.confidence = Math.min(1, existing.confidence + 0.1);
      existing.updatedAt = new Date();
      
      console.log(`📚 [MEMORY] Conceito atualizado: "${concept}" (conf: ${existing.confidence.toFixed(2)})`);
      return existing;
    }
    
    const memory: SemanticMemory = {
      id,
      type: 'semantic',
      concept,
      definition,
      relatedConcepts,
      examples,
      confidence: 0.5,
      source,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.semanticMemories.set(id, memory);
    
    // Criar associações com conceitos relacionados
    for (const related of relatedConcepts) {
      const relatedMemory = this.findConceptByName(related);
      if (relatedMemory) {
        this.createAssociation(id, relatedMemory.id, 'semantic', 0.5);
      }
    }
    
    this.saveToStorage();
    console.log(`📚 [MEMORY] Conceito aprendido: "${concept}"`);
    
    return memory;
  }

  /**
   * 🔍 Busca conceito por nome
   */
  findConceptByName(name: string): SemanticMemory | null {
    const nameLower = name.toLowerCase();
    for (const memory of this.semanticMemories.values()) {
      if (memory.concept.toLowerCase() === nameLower) {
        return memory;
      }
    }
    return null;
  }

  /**
   * 🔍 Busca conceitos relacionados
   */
  findRelatedConcepts(concept: string, depth: number = 2): SemanticMemory[] {
    const found = this.findConceptByName(concept);
    if (!found) return [];
    
    const visited = new Set<string>([found.id]);
    const results: SemanticMemory[] = [];
    let currentLevel = [found];
    
    for (let d = 0; d < depth; d++) {
      const nextLevel: SemanticMemory[] = [];
      
      for (const mem of currentLevel) {
        // Buscar por associações
        const associations = this.associations.filter(
          a => (a.sourceId === mem.id || a.targetId === mem.id) && a.type === 'semantic'
        );
        
        for (const assoc of associations) {
          const otherId = assoc.sourceId === mem.id ? assoc.targetId : assoc.sourceId;
          if (!visited.has(otherId)) {
            visited.add(otherId);
            const other = this.semanticMemories.get(otherId);
            if (other) {
              results.push(other);
              nextLevel.push(other);
            }
          }
        }
        
        // Buscar por relatedConcepts
        for (const related of mem.relatedConcepts) {
          const relatedMem = this.findConceptByName(related);
          if (relatedMem && !visited.has(relatedMem.id)) {
            visited.add(relatedMem.id);
            results.push(relatedMem);
            nextLevel.push(relatedMem);
          }
        }
      }
      
      currentLevel = nextLevel;
    }
    
    return results;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // MEMÓRIA PROCEDURAL (Habilidades)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 🛠️ Registra uma habilidade procedural
   */
  learnProcedure(
    skill: string,
    steps: string[],
    prerequisites: string[] = []
  ): ProceduralMemory {
    const id = `proc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Verificar se habilidade já existe
    const existing = this.findProcedureByName(skill);
    if (existing) {
      // Atualizar habilidade existente
      existing.steps = steps;
      existing.prerequisites = [...new Set([...existing.prerequisites, ...prerequisites])];
      console.log(`🛠️ [MEMORY] Procedimento atualizado: "${skill}"`);
      return existing;
    }
    
    const memory: ProceduralMemory = {
      id,
      type: 'procedural',
      skill,
      steps,
      prerequisites,
      successRate: 0.5,
      timesExecuted: 0,
      averageQuality: 50,
      bestPractices: [],
      antiPatterns: [],
      createdAt: new Date()
    };
    
    this.proceduralMemories.set(id, memory);
    this.saveToStorage();
    
    console.log(`🛠️ [MEMORY] Procedimento aprendido: "${skill}" (${steps.length} passos)`);
    
    return memory;
  }

  /**
   * 📊 Atualiza métricas de um procedimento após execução
   */
  updateProcedureMetrics(
    skill: string,
    success: boolean,
    qualityScore: number,
    bestPractice?: string,
    antiPattern?: string
  ): void {
    const procedure = this.findProcedureByName(skill);
    if (!procedure) return;
    
    procedure.timesExecuted++;
    
    // Atualizar taxa de sucesso (média móvel)
    const oldRate = procedure.successRate;
    procedure.successRate = (oldRate * (procedure.timesExecuted - 1) + (success ? 1 : 0)) / procedure.timesExecuted;
    
    // Atualizar qualidade média
    const oldQuality = procedure.averageQuality;
    procedure.averageQuality = (oldQuality * (procedure.timesExecuted - 1) + qualityScore) / procedure.timesExecuted;
    
    // Adicionar best practice ou anti-pattern
    if (bestPractice && !procedure.bestPractices.includes(bestPractice)) {
      procedure.bestPractices.push(bestPractice);
    }
    if (antiPattern && !procedure.antiPatterns.includes(antiPattern)) {
      procedure.antiPatterns.push(antiPattern);
    }
    
    this.saveToStorage();
  }

  /**
   * 🔍 Busca procedimento por nome
   */
  findProcedureByName(name: string): ProceduralMemory | null {
    const nameLower = name.toLowerCase();
    for (const memory of this.proceduralMemories.values()) {
      if (memory.skill.toLowerCase().includes(nameLower)) {
        return memory;
      }
    }
    return null;
  }

  /**
   * 🏆 Retorna os procedimentos mais bem-sucedidos
   */
  getTopProcedures(limit: number = 10): ProceduralMemory[] {
    return Array.from(this.proceduralMemories.values())
      .filter(p => p.timesExecuted >= 3)
      .sort((a, b) => (b.successRate * b.averageQuality) - (a.successRate * a.averageQuality))
      .slice(0, limit);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSOCIAÇÕES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 🔗 Cria associação entre memórias
   */
  createAssociation(
    sourceId: string,
    targetId: string,
    type: MemoryAssociation['type'],
    strength: number = 0.5
  ): void {
    // Verificar se já existe
    const existing = this.associations.find(
      a => (a.sourceId === sourceId && a.targetId === targetId) ||
           (a.sourceId === targetId && a.targetId === sourceId)
    );
    
    if (existing) {
      // Fortalecer associação existente
      existing.strength = Math.min(1, existing.strength + 0.1);
      return;
    }
    
    this.associations.push({
      sourceId,
      targetId,
      strength,
      type,
      createdAt: new Date()
    });
  }

  /**
   * 🔍 Busca associações de uma memória
   */
  getAssociations(memoryId: string): MemoryAssociation[] {
    return this.associations.filter(
      a => a.sourceId === memoryId || a.targetId === memoryId
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSOLIDAÇÃO E ESQUECIMENTO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 🧠 Consolida memórias de curto prazo para longo prazo
   */
  consolidateMemories(): void {
    console.log(`🧠 [MEMORY] Consolidando ${this.shortTermBuffer.length} memórias...`);
    
    for (const memory of this.shortTermBuffer) {
      // Só consolidar se importância acima do threshold
      if (memory.importance >= this.config.consolidationThreshold) {
        this.episodicMemories.set(memory.id, memory);
        
        // Extrair conhecimento semântico
        this.extractSemanticKnowledge(memory);
        
        // Extrair conhecimento procedural
        this.extractProceduralKnowledge(memory);
      }
    }
    
    // Limpar buffer
    this.shortTermBuffer = [];
    
    // Aplicar esquecimento
    this.applyForgetting();
    
    // Salvar
    this.saveToStorage();
  }

  /**
   * 📚 Extrai conhecimento semântico de uma memória episódica
   */
  private extractSemanticKnowledge(episode: EpisodicMemory): void {
    // Aprender sobre manifestos usados
    for (const manifesto of episode.context.manifestosUsed) {
      const existing = this.findConceptByName(manifesto);
      if (!existing) {
        this.learnConcept(
          manifesto,
          `Manifesto usado em: ${episode.event}`,
          episode.context.manifestosUsed.filter(m => m !== manifesto),
          [episode.context.prompt.substring(0, 100)],
          'learned'
        );
      } else {
        // Aumentar confiança se sucesso
        if (episode.context.success) {
          existing.confidence = Math.min(1, existing.confidence + 0.05);
        }
      }
    }
  }

  /**
   * 🛠️ Extrai conhecimento procedural de uma memória episódica
   */
  private extractProceduralKnowledge(episode: EpisodicMemory): void {
    // Identificar tipo de tarefa
    const taskType = this.identifyTaskType(episode.context.prompt);
    
    if (taskType) {
      const procedure = this.findProcedureByName(taskType);
      if (procedure) {
        this.updateProcedureMetrics(
          taskType,
          episode.context.success,
          episode.context.qualityScore
        );
      } else {
        // Criar novo procedimento
        this.learnProcedure(
          taskType,
          [`Usar manifestos: ${episode.context.manifestosUsed.join(', ')}`],
          []
        );
      }
    }
  }

  /**
   * 🏷️ Identifica tipo de tarefa do prompt
   */
  private identifyTaskType(prompt: string): string | null {
    const promptLower = prompt.toLowerCase();
    
    const taskPatterns: Record<string, string[]> = {
      'criar_sistema_pagamentos': ['pagamento', 'pix', 'stripe', 'checkout'],
      'criar_dashboard': ['dashboard', 'analytics', 'métricas', 'gráficos'],
      'criar_autenticacao': ['login', 'autenticação', 'auth', '2fa', 'oauth'],
      'criar_ecommerce': ['loja', 'carrinho', 'produto', 'ecommerce'],
      'criar_chat': ['chat', 'mensagem', 'tempo real', 'websocket'],
      'criar_api': ['api', 'rest', 'graphql', 'endpoint'],
      'criar_landing': ['landing', 'página', 'site', 'institucional']
    };
    
    for (const [taskType, keywords] of Object.entries(taskPatterns)) {
      if (keywords.some(kw => promptLower.includes(kw))) {
        return taskType;
      }
    }
    
    return null;
  }

  /**
   * 🗑️ Aplica esquecimento adaptativo
   */
  private applyForgetting(): void {
    const now = Date.now();
    
    // Esquecer memórias episódicas antigas e pouco importantes
    for (const [id, memory] of this.episodicMemories) {
      const daysSinceAccess = (now - memory.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
      const forgetScore = daysSinceAccess * this.config.forgettingRate * (1 - memory.importance);
      
      if (forgetScore > 1 && this.episodicMemories.size > this.config.maxEpisodicMemories * 0.5) {
        this.episodicMemories.delete(id);
        console.log(`🗑️ [MEMORY] Esquecido: "${memory.event.substring(0, 30)}..."`);
      }
    }
    
    // Enfraquecer associações não usadas
    this.associations = this.associations.filter(a => {
      a.strength *= (1 - this.config.forgettingRate);
      return a.strength >= this.config.associationThreshold;
    });
  }

  /**
   * 📊 Calcula importância de uma memória
   */
  private calculateImportance(
    context: EpisodicMemory['context'],
    emotions?: Partial<EpisodicMemory['emotions']>
  ): number {
    let importance = 0.5;
    
    // Sucesso aumenta importância
    if (context.success) importance += 0.2;
    
    // Alta qualidade aumenta importância
    if (context.qualityScore >= 90) importance += 0.15;
    else if (context.qualityScore >= 80) importance += 0.1;
    
    // Emoções fortes aumentam importância
    if (emotions) {
      if (emotions.surprise && emotions.surprise > 0.7) importance += 0.1;
      if (emotions.satisfaction && emotions.satisfaction > 0.8) importance += 0.1;
      if (emotions.frustration && emotions.frustration > 0.8) importance += 0.05; // Aprender com erros
    }
    
    // Muitos manifestos = tarefa complexa = mais importante
    if (context.manifestosUsed.length >= 5) importance += 0.1;
    
    return Math.min(1, importance);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSISTÊNCIA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 💾 Salva memórias no localStorage
   */
  private saveToStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      
      const data = {
        episodic: Array.from(this.episodicMemories.entries()),
        semantic: Array.from(this.semanticMemories.entries()),
        procedural: Array.from(this.proceduralMemories.entries()),
        associations: this.associations
      };
      
      localStorage.setItem('consciousness_memory', JSON.stringify(data));
    } catch (error) {
      console.error('⚠️ Erro ao salvar memórias:', error);
    }
  }

  /**
   * 📂 Carrega memórias do localStorage
   */
  private loadFromStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      
      const saved = localStorage.getItem('consciousness_memory');
      if (!saved) return;
      
      const data = JSON.parse(saved);
      
      this.episodicMemories = new Map(data.episodic || []);
      this.semanticMemories = new Map(data.semantic || []);
      this.proceduralMemories = new Map(data.procedural || []);
      this.associations = data.associations || [];
      
      // Converter datas
      for (const mem of this.episodicMemories.values()) {
        mem.timestamp = new Date(mem.timestamp);
        mem.lastAccessed = new Date(mem.lastAccessed);
      }
      for (const mem of this.semanticMemories.values()) {
        mem.createdAt = new Date(mem.createdAt);
        mem.updatedAt = new Date(mem.updatedAt);
      }
      for (const mem of this.proceduralMemories.values()) {
        mem.createdAt = new Date(mem.createdAt);
      }
      
    } catch (error) {
      console.error('⚠️ Erro ao carregar memórias:', error);
    }
  }

  /**
   * 🗑️ Limpa todas as memórias
   */
  clearAll(): void {
    this.episodicMemories.clear();
    this.semanticMemories.clear();
    this.proceduralMemories.clear();
    this.associations = [];
    this.shortTermBuffer = [];
    
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('consciousness_memory');
    }
    
    console.log('🗑️ [MEMORY] Todas as memórias foram apagadas');
  }

  /**
   * 📊 Retorna estatísticas da memória
   */
  getStats(): MemoryStats {
    const allEpisodic = Array.from(this.episodicMemories.values());
    const timestamps = allEpisodic.map(m => m.timestamp.getTime());
    
    return {
      totalEpisodic: this.episodicMemories.size,
      totalSemantic: this.semanticMemories.size,
      totalProcedural: this.proceduralMemories.size,
      totalAssociations: this.associations.length,
      oldestMemory: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
      newestMemory: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null,
      averageImportance: allEpisodic.length > 0 
        ? allEpisodic.reduce((sum, m) => sum + m.importance, 0) / allEpisodic.length 
        : 0,
      memoryUtilization: this.episodicMemories.size / this.config.maxEpisodicMemories
    };
  }

  /**
   * 📊 Gera relatório da memória
   */
  generateReport(): string {
    const stats = this.getStats();
    const topProcedures = this.getTopProcedures(3);
    
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧠 CONSCIOUSNESS MEMORY - RELATÓRIO 🧠                              ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         ESTATÍSTICAS                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Memórias Episódicas: ${String(stats.totalEpisodic).padEnd(53)}║
║  Memórias Semânticas: ${String(stats.totalSemantic).padEnd(53)}║
║  Memórias Procedurais: ${String(stats.totalProcedural).padEnd(52)}║
║  Associações: ${String(stats.totalAssociations).padEnd(61)}║
║  Utilização: ${(stats.memoryUtilization * 100).toFixed(1)}%${' '.repeat(56)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         TOP PROCEDIMENTOS                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
${topProcedures.map((p, i) => 
  `║  ${i + 1}. ${p.skill.substring(0, 30).padEnd(30)} ${(p.successRate * 100).toFixed(0)}% sucesso`.padEnd(79) + '║'
).join('\n') || '║  (Nenhum procedimento registrado ainda)                                       ║'}
╚══════════════════════════════════════════════════════════════════════════════╝
    `;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON E EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let memoryInstance: ConsciousnessMemory | null = null;

export function getConsciousnessMemory(config?: Partial<MemoryConfig>): ConsciousnessMemory {
  if (!memoryInstance || config) {
    memoryInstance = new ConsciousnessMemory(config);
  }
  return memoryInstance;
}

export default ConsciousnessMemory;
