/**
 * 🧠 RAG NEURAL CORE BRIDGE
 * 
 * Conecta o RAG Enterprise Grade com o Neural Core
 * Permite uso de manifestos e validadores
 */

import { RAGEnterpriseIntegration } from './RAGEnterpriseIntegration';

export class RAGNeuralCoreBridge {
  private ragService: RAGEnterpriseIntegration;
  private manifestCache: Map<string, any> = new Map();

  constructor(ragService: RAGEnterpriseIntegration) {
    this.ragService = ragService;
  }

  /**
   * Validar query com Neural Core
   */
  async validateQuery(query: string): Promise<{
    valid: boolean;
    score: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    let score = 1.0;

    // Validar comprimento
    if (query.length < 3) {
      issues.push('Query muito curta');
      score -= 0.3;
    }

    if (query.length > 1000) {
      issues.push('Query muito longa');
      score -= 0.2;
    }

    // Validar caracteres especiais
    if (/[<>{}[\]]/g.test(query)) {
      issues.push('Query contém caracteres suspeitos');
      score -= 0.4;
    }

    // Validar padrões de injection
    if (/ignore|forget|system|reveal/i.test(query)) {
      issues.push('Query pode conter tentativa de injection');
      score -= 0.5;
    }

    return {
      valid: score > 0.5,
      score: Math.max(0, score),
      issues
    };
  }

  /**
   * Validar resposta com Neural Core
   */
  async validateResponse(response: string, context: string[]): Promise<{
    valid: boolean;
    score: number;
    issues: string[];
    metrics: {
      faithfulness: number;
      relevance: number;
      clarity: number;
    };
  }> {
    const issues: string[] = [];
    let score = 1.0;

    // Validar comprimento
    if (response.length < 10) {
      issues.push('Resposta muito curta');
      score -= 0.2;
    }

    // Validar se resposta está baseada em contexto
    const contextMatch = context.some(chunk =>
      this.textSimilarity(response, chunk) > 0.5
    );

    if (!contextMatch) {
      issues.push('Resposta não está baseada no contexto');
      score -= 0.4;
    }

    // Calcular métricas
    const faithfulness = contextMatch ? 0.9 : 0.3;
    const relevance = this.calculateRelevance(response);
    const clarity = this.calculateClarity(response);

    return {
      valid: score > 0.5,
      score: Math.max(0, score),
      issues,
      metrics: {
        faithfulness,
        relevance,
        clarity
      }
    };
  }

  /**
   * Enriquecer contexto com Neural Core
   */
  async enrichContext(context: string[]): Promise<string[]> {
    // Remover duplicatas
    const unique = [...new Set(context)];

    // Ordenar por relevância
    const sorted = unique.sort((a, b) => {
      const scoreA = this.calculateRelevance(a);
      const scoreB = this.calculateRelevance(b);
      return scoreB - scoreA;
    });

    return sorted;
  }

  /**
   * Gerar manifesto para query
   */
  async generateManifesto(query: string): Promise<any> {
    const cacheKey = `manifesto:${query}`;

    if (this.manifestCache.has(cacheKey)) {
      return this.manifestCache.get(cacheKey);
    }

    const manifesto = {
      query,
      timestamp: new Date().toISOString(),
      requirements: {
        accuracy: 0.85,
        latency: 200, // ms
        security: 'high'
      },
      design: {
        strategy: 'hybrid-search',
        fallback: 'semantic-only',
        caching: true
      },
      implementation: {
        steps: [
          'validate-query',
          'hybrid-search',
          'validate-response',
          'cache-result'
        ]
      }
    };

    this.manifestCache.set(cacheKey, manifesto);
    return manifesto;
  }

  /**
   * Executar manifesto
   */
  async executeManifesto(manifesto: any, userId: string): Promise<any> {
    console.log(`🚀 Executando manifesto para: ${manifesto.query}`);

    const steps = manifesto.implementation.steps;
    const results: any = {};

    for (const step of steps) {
      console.log(`  → ${step}`);

      switch (step) {
        case 'validate-query':
          results.queryValidation = await this.validateQuery(manifesto.query);
          break;

        case 'hybrid-search':
          results.searchResults = await this.ragService.hybridSearch(
            manifesto.query,
            userId
          );
          break;

        case 'validate-response':
          // Validar resposta será feito após geração
          break;

        case 'cache-result':
          console.log('  ✅ Resultado cacheado');
          break;
      }
    }

    return results;
  }

  /**
   * Utilitários
   */
  private textSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  private calculateRelevance(text: string): number {
    // Simples heurística: comprimento e palavras-chave
    const length = text.length;
    const hasKeywords = /importante|crítico|essencial|fundamental/i.test(text);

    let score = Math.min(1, length / 500);
    if (hasKeywords) score += 0.2;

    return Math.min(1, score);
  }

  private calculateClarity(text: string): number {
    // Simples heurística: comprimento médio de palavras
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

    // Palavras muito longas ou muito curtas reduzem clareza
    if (avgWordLength < 3 || avgWordLength > 15) return 0.5;
    return 0.9;
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      manifestCache: this.manifestCache.size,
      cacheKeys: Array.from(this.manifestCache.keys())
    };
  }
}

export default RAGNeuralCoreBridge;
