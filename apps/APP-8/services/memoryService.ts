/**
 * Sistema de Memória Contextual Avançado
 * Gerencia memória de longo prazo, embeddings e busca semântica
 */

import { geminiService } from './geminiService';

export interface MemoryEntry {
  id: string;
  timestamp: string;
  content: string;
  type: 'conversation' | 'fact' | 'preference' | 'skill' | 'context';
  importance: number; // 1-10
  embedding?: number[];
  tags: string[];
  relatedTo?: string[]; // IDs de outras memórias relacionadas
}

export interface UserProfile {
  name?: string;
  preferences: Map<string, any>;
  skills: string[];
  interests: string[];
  workPatterns: {
    activeHours?: string[];
    commonTasks?: string[];
    toolsUsed?: string[];
  };
  communicationStyle?: string;
}

export class MemoryService {
  private memories: Map<string, MemoryEntry>;
  private userProfile: UserProfile;
  private shortTermMemory: string[]; // Últimas N interações
  private readonly MAX_SHORT_TERM = 10;
  private readonly MAX_MEMORIES = 500;

  constructor() {
    this.memories = new Map();
    this.shortTermMemory = [];
    this.userProfile = this.loadUserProfile();
    // Carrega memórias de forma lazy para não sobrecarregar inicialização
    this.loadMemoriesLazy();
  }

  private loadMemoriesLazy(): void {
    // Carrega memórias após um pequeno delay para não bloquear inicialização
    setTimeout(() => {
      this.loadMemories();
    }, 1000);
  }

  private loadUserProfile(): UserProfile {
    const saved = localStorage.getItem('user-profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        preferences: new Map(Object.entries(parsed.preferences || {}))
      };
    }
    return {
      preferences: new Map(),
      skills: [],
      interests: [],
      workPatterns: {}
    };
  }

  private saveUserProfile(): void {
    try {
      const toSave = {
        ...this.userProfile,
        preferences: Object.fromEntries(this.userProfile.preferences)
      };
      localStorage.setItem('user-profile', JSON.stringify(toSave));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded. User profile not saved.');
        // Tenta limpar memórias antigas para liberar espaço
        this.pruneMemories(0.5);
      }
    }
  }

  private loadMemories(): void {
    const saved = localStorage.getItem('long-term-memories');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.memories = new Map(Object.entries(parsed));
    }
  }

  private saveMemories(): void {
    const toSave = Object.fromEntries(this.memories);
    try {
      localStorage.setItem('long-term-memories', JSON.stringify(toSave));
    } catch (e) {
      // Se exceder quota, remove memórias menos importantes
      this.pruneMemories(0.3);
      localStorage.setItem('long-term-memories', JSON.stringify(Object.fromEntries(this.memories)));
    }
  }

  /**
   * Adiciona nova memória ao sistema
   */
  async addMemory(
    content: string,
    type: MemoryEntry['type'],
    importance: number = 5,
    tags: string[] = []
  ): Promise<string> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const memory: MemoryEntry = {
      id,
      timestamp: new Date().toISOString(),
      content,
      type,
      importance: Math.max(1, Math.min(10, importance)),
      tags,
      relatedTo: []
    };

    // Gera embedding (simulado - em produção usaria API de embeddings)
    memory.embedding = await this.generateEmbedding(content);

    // Encontra memórias relacionadas
    memory.relatedTo = this.findRelatedMemories(memory, 3);

    this.memories.set(id, memory);
    this.saveMemories();

    // Gerencia tamanho da memória
    if (this.memories.size > this.MAX_MEMORIES) {
      this.pruneMemories(0.2);
    }

    return id;
  }

  /**
   * Gera embedding simplificado (em produção, usar API real)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Simulação de embedding usando hash simples
    // Em produção, usar Gemini Embedding API ou similar
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(128).fill(0);
    
    words.forEach((word, idx) => {
      const hash = this.simpleHash(word);
      embedding[hash % 128] += 1;
    });

    // Normaliza
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Calcula similaridade de cosseno entre dois embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  /**
   * Encontra memórias relacionadas usando similaridade semântica
   */
  private findRelatedMemories(memory: MemoryEntry, limit: number = 5): string[] {
    if (!memory.embedding) return [];

    const similarities: Array<{ id: string; score: number }> = [];

    this.memories.forEach((existingMemory, id) => {
      if (id === memory.id || !existingMemory.embedding) return;
      
      const similarity = this.cosineSimilarity(memory.embedding!, existingMemory.embedding);
      if (similarity > 0.5) { // Threshold de similaridade
        similarities.push({ id, score: similarity });
      }
    });

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.id);
  }

  /**
   * Busca memórias relevantes para um contexto
   */
  async searchMemories(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const results: Array<{ memory: MemoryEntry; score: number }> = [];

    this.memories.forEach(memory => {
      if (!memory.embedding) return;
      
      const similarity = this.cosineSimilarity(queryEmbedding, memory.embedding);
      
      // Boost por importância e recência
      const recencyBoost = this.calculateRecencyBoost(memory.timestamp);
      const importanceBoost = memory.importance / 10;
      const finalScore = similarity * (1 + recencyBoost + importanceBoost);

      if (similarity > 0.3) {
        results.push({ memory, score: finalScore });
      }
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.memory);
  }

  private calculateRecencyBoost(timestamp: string): number {
    const age = Date.now() - new Date(timestamp).getTime();
    const daysOld = age / (1000 * 60 * 60 * 24);
    
    // Memórias recentes recebem boost maior
    if (daysOld < 1) return 0.5;
    if (daysOld < 7) return 0.3;
    if (daysOld < 30) return 0.1;
    return 0;
  }

  /**
   * Remove memórias menos importantes
   */
  private pruneMemories(percentage: number): void {
    const toRemove = Math.floor(this.memories.size * percentage);
    const sorted = Array.from(this.memories.entries())
      .sort((a, b) => {
        const scoreA = a[1].importance + this.calculateRecencyBoost(a[1].timestamp) * 10;
        const scoreB = b[1].importance + this.calculateRecencyBoost(b[1].timestamp) * 10;
        return scoreA - scoreB;
      });

    for (let i = 0; i < toRemove; i++) {
      this.memories.delete(sorted[i][0]);
    }
  }

  /**
   * Adiciona à memória de curto prazo
   */
  addToShortTerm(content: string): void {
    this.shortTermMemory.push(content);
    if (this.shortTermMemory.length > this.MAX_SHORT_TERM) {
      this.shortTermMemory.shift();
    }
  }

  /**
   * Obtém contexto completo para a IA
   */
  async getContextForAI(currentQuery: string): Promise<string> {
    let context = '';

    // Adiciona perfil do usuário
    if (this.userProfile.name) {
      context += `Usuário: ${this.userProfile.name}\n`;
    }

    if (this.userProfile.skills.length > 0) {
      context += `Habilidades conhecidas: ${this.userProfile.skills.join(', ')}\n`;
    }

    if (this.userProfile.interests.length > 0) {
      context += `Interesses: ${this.userProfile.interests.join(', ')}\n`;
    }

    // Adiciona preferências importantes
    if (this.userProfile.preferences.size > 0) {
      context += `Preferências:\n`;
      this.userProfile.preferences.forEach((value, key) => {
        context += `- ${key}: ${value}\n`;
      });
    }

    // Adiciona memória de curto prazo
    if (this.shortTermMemory.length > 0) {
      context += `\nÚltimas interações:\n${this.shortTermMemory.slice(-5).join('\n')}\n`;
    }

    // Busca memórias relevantes
    const relevantMemories = await this.searchMemories(currentQuery, 3);
    if (relevantMemories.length > 0) {
      context += `\nMemórias relevantes:\n`;
      relevantMemories.forEach(mem => {
        context += `- [${mem.type}] ${mem.content}\n`;
      });
    }

    return context;
  }

  /**
   * Extrai e armazena fatos importantes de uma conversa
   */
  async extractAndStoreFactsFromConversation(conversation: string): Promise<void> {
    // Usa IA para extrair fatos importantes
    const facts = await geminiService.extractFacts(conversation);
    
    for (const fact of facts) {
      await this.addMemory(fact.content, fact.type as any, fact.importance, fact.tags);
    }
  }

  /**
   * Atualiza perfil do usuário
   */
  updateUserProfile(updates: Partial<UserProfile>): void {
    this.userProfile = { ...this.userProfile, ...updates };
    
    if (updates.preferences) {
      updates.preferences.forEach((value, key) => {
        this.userProfile.preferences.set(key, value);
      });
    }

    this.saveUserProfile();
  }

  /**
   * Detecta padrões de trabalho do usuário
   */
  analyzeWorkPatterns(): void {
    try {
      const now = new Date();
      const hour = now.getHours();
      
      // Registra horário ativo
      if (!this.userProfile.workPatterns.activeHours) {
        this.userProfile.workPatterns.activeHours = [];
      }
      
      const hourStr = `${hour}:00`;
      if (!this.userProfile.workPatterns.activeHours.includes(hourStr)) {
        this.userProfile.workPatterns.activeHours.push(hourStr);
      }

      this.saveUserProfile();
    } catch (e) {
      console.warn('Could not analyze work patterns:', e);
    }
  }

  /**
   * Obtém estatísticas da memória
   */
  getMemoryStats(): {
    totalMemories: number;
    byType: Record<string, number>;
    averageImportance: number;
    oldestMemory?: string;
    newestMemory?: string;
  } {
    const byType: Record<string, number> = {};
    let totalImportance = 0;
    let oldest: string | undefined;
    let newest: string | undefined;

    this.memories.forEach(mem => {
      byType[mem.type] = (byType[mem.type] || 0) + 1;
      totalImportance += mem.importance;
      
      if (!oldest || mem.timestamp < oldest) oldest = mem.timestamp;
      if (!newest || mem.timestamp > newest) newest = mem.timestamp;
    });

    return {
      totalMemories: this.memories.size,
      byType,
      averageImportance: this.memories.size > 0 ? totalImportance / this.memories.size : 0,
      oldestMemory: oldest,
      newestMemory: newest
    };
  }

  /**
   * Limpa todas as memórias
   */
  clearAllMemories(): void {
    this.memories.clear();
    this.shortTermMemory = [];
    this.saveMemories();
  }

  /**
   * Exporta memórias para backup
   */
  exportMemories(): string {
    return JSON.stringify({
      memories: Object.fromEntries(this.memories),
      profile: {
        ...this.userProfile,
        preferences: Object.fromEntries(this.userProfile.preferences)
      },
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Importa memórias de backup
   */
  importMemories(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      this.memories = new Map(Object.entries(data.memories));
      this.userProfile = {
        ...data.profile,
        preferences: new Map(Object.entries(data.profile.preferences))
      };
      this.saveMemories();
      this.saveUserProfile();
    } catch (e) {
      console.error('Erro ao importar memórias:', e);
    }
  }
}

export const memoryService = new MemoryService();
