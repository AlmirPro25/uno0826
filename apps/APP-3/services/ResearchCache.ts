/**
 * 💾 RESEARCH CACHE - Cache Inteligente de Pesquisas
 * 
 * Sistema de cache que armazena resultados de pesquisas para
 * evitar chamadas repetidas às APIs e melhorar performance.
 * 
 * @version 1.0.0
 * @author Sistema de Pesquisa Cognitiva
 * 
 * FILOSOFIA: "PESQUISOU UMA VEZ, LEMBRA PARA SEMPRE"
 */

import type { KnowledgePacket, ResearchResult } from './WebResearchEngine';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em ms
  hits: number;
  source: string;
  query: string;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheConfig {
  maxEntries: number;
  defaultTTL: number; // em ms
  cleanupInterval: number; // em ms
  persistToStorage: boolean;
  storageKey: string;
}

// ============================================================================
// TTLs POR TIPO DE CONTEÚDO
// ============================================================================

const TTL_BY_SOURCE: Record<string, number> = {
  'Wikipedia': 24 * 60 * 60 * 1000,      // 24 horas - conteúdo estável
  'GitHub': 6 * 60 * 60 * 1000,          // 6 horas - código muda
  'Stack Overflow': 12 * 60 * 60 * 1000, // 12 horas - respostas estáveis
  'ArXiv': 7 * 24 * 60 * 60 * 1000,      // 7 dias - papers são permanentes
  'DEV.to': 4 * 60 * 60 * 1000,          // 4 horas - artigos novos
  'Hacker News': 1 * 60 * 60 * 1000,     // 1 hora - notícias mudam rápido
  'DuckDuckGo': 2 * 60 * 60 * 1000,      // 2 horas - resultados variam
  'default': 4 * 60 * 60 * 1000          // 4 horas padrão
};

// ============================================================================
// CLASSE PRINCIPAL - RESEARCH CACHE
// ============================================================================

export class ResearchCache {
  private cache: Map<string, CacheEntry<KnowledgePacket[]>>;
  private resultCache: Map<string, CacheEntry<ResearchResult>>;
  private config: CacheConfig;
  private stats: { hits: number; misses: number };
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxEntries: 500,
      defaultTTL: 4 * 60 * 60 * 1000, // 4 horas
      cleanupInterval: 30 * 60 * 1000, // 30 minutos
      persistToStorage: true,
      storageKey: 'research_cache_v1',
      ...config
    };

    this.cache = new Map();
    this.resultCache = new Map();
    this.stats = { hits: 0, misses: 0 };

    // Carregar do localStorage se disponível
    if (this.config.persistToStorage) {
      this.loadFromStorage();
    }

    // Iniciar limpeza periódica
    this.startCleanupTimer();
  }

  // ---------------------------------------------------------------------------
  // MÉTODOS PRINCIPAIS
  // ---------------------------------------------------------------------------

  /**
   * Gera uma chave de cache normalizada
   */
  private generateKey(query: string, source?: string): string {
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
    return source ? `${source}:${normalizedQuery}` : normalizedQuery;
  }

  /**
   * Armazena pacotes de conhecimento no cache
   */
  setPackets(query: string, source: string, packets: KnowledgePacket[]): void {
    const key = this.generateKey(query, source);
    const ttl = TTL_BY_SOURCE[source] || this.config.defaultTTL;

    const entry: CacheEntry<KnowledgePacket[]> = {
      data: packets,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      source,
      query
    };

    this.cache.set(key, entry);
    this.enforceMaxEntries();
    this.saveToStorage();

    console.log(`💾 Cache: Armazenado ${packets.length} pacotes para "${query}" (${source})`);
  }

  /**
   * Recupera pacotes do cache
   */
  getPackets(query: string, source: string): KnowledgePacket[] | null {
    const key = this.generateKey(query, source);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      console.log(`💾 Cache: Entrada expirada para "${query}" (${source})`);
      return null;
    }

    // Atualizar hits
    entry.hits++;
    this.stats.hits++;
    
    console.log(`💾 Cache HIT: "${query}" (${source}) - ${entry.data.length} pacotes`);
    return entry.data;
  }

  /**
   * Armazena resultado completo de pesquisa
   */
  setResult(query: string, result: ResearchResult): void {
    const key = this.generateKey(query);
    
    // Calcular TTL baseado nas fontes usadas
    const avgTTL = result.sources.reduce((sum, source) => {
      return sum + (TTL_BY_SOURCE[source] || this.config.defaultTTL);
    }, 0) / result.sources.length;

    const entry: CacheEntry<ResearchResult> = {
      data: result,
      timestamp: Date.now(),
      ttl: avgTTL,
      hits: 0,
      source: 'combined',
      query
    };

    this.resultCache.set(key, entry);
    this.saveToStorage();

    console.log(`💾 Cache: Armazenado resultado completo para "${query}"`);
  }

  /**
   * Recupera resultado completo do cache
   */
  getResult(query: string): ResearchResult | null {
    const key = this.generateKey(query);
    const entry = this.resultCache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.resultCache.delete(key);
      return null;
    }

    entry.hits++;
    console.log(`💾 Cache HIT: Resultado completo para "${query}"`);
    return entry.data;
  }

  /**
   * Verifica se uma query está em cache (sem recuperar)
   */
  has(query: string, source?: string): boolean {
    const key = this.generateKey(query, source);
    
    if (source) {
      const entry = this.cache.get(key);
      return entry !== undefined && (Date.now() - entry.timestamp <= entry.ttl);
    }
    
    const resultEntry = this.resultCache.get(key);
    return resultEntry !== undefined && (Date.now() - resultEntry.timestamp <= resultEntry.ttl);
  }

  /**
   * Invalida cache para uma query específica
   */
  invalidate(query: string, source?: string): void {
    if (source) {
      const key = this.generateKey(query, source);
      this.cache.delete(key);
    } else {
      // Invalidar todas as entradas relacionadas
      const normalizedQuery = query.toLowerCase().trim();
      
      for (const [key] of this.cache) {
        if (key.includes(normalizedQuery)) {
          this.cache.delete(key);
        }
      }
      
      this.resultCache.delete(this.generateKey(query));
    }
    
    this.saveToStorage();
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.resultCache.clear();
    this.stats = { hits: 0, misses: 0 };
    
    if (this.config.persistToStorage && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.config.storageKey);
    }
    
    console.log('💾 Cache: Limpo completamente');
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    const entries = [...this.cache.values(), ...this.resultCache.values()];
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      totalEntries: this.cache.size + this.resultCache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry: Math.min(...timestamps) || 0,
      newestEntry: Math.max(...timestamps) || 0
    };
  }

  /**
   * Busca queries similares no cache
   */
  findSimilar(query: string, threshold: number = 0.7): CacheEntry<KnowledgePacket[]>[] {
    const normalizedQuery = query.toLowerCase().trim();
    const queryWords = new Set(normalizedQuery.split(/\s+/));
    const similar: CacheEntry<KnowledgePacket[]>[] = [];

    for (const [key, entry] of this.cache) {
      const entryWords = new Set(entry.query.toLowerCase().split(/\s+/));
      const intersection = new Set([...queryWords].filter(w => entryWords.has(w)));
      const union = new Set([...queryWords, ...entryWords]);
      const similarity = intersection.size / union.size;

      if (similarity >= threshold) {
        similar.push(entry);
      }
    }

    return similar.sort((a, b) => b.hits - a.hits);
  }

  // ---------------------------------------------------------------------------
  // MÉTODOS AUXILIARES
  // ---------------------------------------------------------------------------

  /**
   * Garante que não exceda o número máximo de entradas
   */
  private enforceMaxEntries(): void {
    const totalEntries = this.cache.size + this.resultCache.size;
    
    if (totalEntries <= this.config.maxEntries) return;

    // Remover entradas mais antigas e menos usadas
    const entries = [...this.cache.entries()]
      .map(([key, entry]) => ({ key, entry, score: entry.hits / (Date.now() - entry.timestamp) }))
      .sort((a, b) => a.score - b.score);

    const toRemove = totalEntries - this.config.maxEntries;
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i].key);
    }
  }

  /**
   * Limpa entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    for (const [key, entry] of this.resultCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.resultCache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`💾 Cache: Removidas ${removed} entradas expiradas`);
      this.saveToStorage();
    }
  }

  /**
   * Inicia timer de limpeza periódica
   */
  private startCleanupTimer(): void {
    if (typeof setInterval !== 'undefined') {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config.cleanupInterval);
    }
  }

  /**
   * Para o timer de limpeza
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Estima uso de memória
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache) {
      size += key.length * 2; // string em UTF-16
      size += JSON.stringify(entry.data).length * 2;
    }
    
    for (const [key, entry] of this.resultCache) {
      size += key.length * 2;
      size += JSON.stringify(entry.data).length * 2;
    }
    
    return size;
  }

  /**
   * Salva cache no localStorage
   */
  private saveToStorage(): void {
    if (!this.config.persistToStorage || typeof localStorage === 'undefined') return;

    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        resultCache: Array.from(this.resultCache.entries()),
        stats: this.stats
      };
      
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('💾 Cache: Erro ao salvar no localStorage:', error);
    }
  }

  /**
   * Carrega cache do localStorage
   */
  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      
      // Restaurar cache de pacotes
      if (data.cache) {
        this.cache = new Map(data.cache);
      }
      
      // Restaurar cache de resultados
      if (data.resultCache) {
        this.resultCache = new Map(data.resultCache);
      }
      
      // Restaurar stats
      if (data.stats) {
        this.stats = data.stats;
      }

      // Limpar entradas expiradas
      this.cleanup();

      console.log(`💾 Cache: Carregado do localStorage (${this.cache.size} pacotes, ${this.resultCache.size} resultados)`);
    } catch (error) {
      console.warn('💾 Cache: Erro ao carregar do localStorage:', error);
    }
  }
}

// ============================================================================
// SINGLETON E EXPORTS
// ============================================================================

export const researchCache = new ResearchCache();

export default ResearchCache;
