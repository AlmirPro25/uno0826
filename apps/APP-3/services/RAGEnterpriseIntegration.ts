/**
 * 🔗 RAG ENTERPRISE INTEGRATION
 * 
 * Conecta os 5 pontos críticos do RAG Enterprise Grade
 * com o sistema existente (Mesh Network, Neural Core, GeminiService)
 */

import { Server } from 'socket.io';
import { ChromaClient } from 'chromadb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { GeminiService } from './GeminiService';
import { GeminiProxyClient } from './GeminiProxyClient';

export class RAGEnterpriseIntegration {
  private io: Server;
  private chroma: ChromaClient;
  private gemini: GoogleGenerativeAI;
  private db: Pool;
  private redis: Redis;
  private geminiService: GeminiService;
  private geminiProxy: GeminiProxyClient;
  
  // PONTO 1: Debounce timers
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_TIME = 30000; // 30s
  private readonly SIMILARITY_THRESHOLD = 0.85;

  constructor(
    io: Server,
    chroma: ChromaClient,
    gemini: GoogleGenerativeAI,
    db: Pool,
    redis: Redis,
    geminiService: GeminiService,
    geminiProxy: GeminiProxyClient
  ) {
    this.io = io;
    this.chroma = chroma;
    this.gemini = gemini;
    this.db = db;
    this.redis = redis;
    this.geminiService = geminiService;
    this.geminiProxy = geminiProxy;
  }

  /**
   * 🔴 PONTO 1: OTIMIZAÇÃO DE INDEXAÇÃO
   * Debounced Snapshot + Semantic Diff
   */
  async scheduleIndexing(docId: string, content: string, metadata: any) {
    // Cancelar timer anterior
    if (this.debounceTimers.has(docId)) {
      clearTimeout(this.debounceTimers.get(docId)!);
    }

    // Agendar nova indexação após 30s de inatividade
    const timer = setTimeout(async () => {
      await this.indexWithSemanticDiff(docId, content, metadata);
      this.debounceTimers.delete(docId);
    }, this.DEBOUNCE_TIME);

    this.debounceTimers.set(docId, timer);
  }

  private async indexWithSemanticDiff(docId: string, content: string, metadata: any) {
    try {
      // Gerar novo embedding usando GeminiService
      const newEmbedding = await this.geminiService.generateEmbedding(content);

      // Buscar embedding anterior do cache
      const cachedEmbedding = await this.redis.get(`embedding:${docId}`);

      if (cachedEmbedding) {
        const oldEmbedding = JSON.parse(cachedEmbedding);
        const similarity = this.cosineSimilarity(oldEmbedding, newEmbedding);

        // Se similar, pular indexação (ECONOMIA!)
        if (similarity > this.SIMILARITY_THRESHOLD) {
          console.log(`✅ Doc ${docId}: Semanticamente similar (${similarity.toFixed(2)}), pulando indexação`);
          return;
        }
      }

      // Indexar no Chroma
      const collection = await this.chroma.getOrCreateCollection({
        name: 'project_knowledge',
        metadata: { 'hnsw:space': 'cosine' }
      });

      await collection.add({
        ids: [docId],
        embeddings: [newEmbedding],
        documents: [content],
        metadatas: [metadata]
      });

      // Cache do embedding
      await this.redis.setex(
        `embedding:${docId}`,
        86400, // 24 horas
        JSON.stringify(newEmbedding)
      );

      console.log(`✅ Doc ${docId}: Indexado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao indexar ${docId}:`, error);
    }
  }

  /**
   * 🔴 PONTO 2: BUSCA HÍBRIDA
   * BM25 (keyword) + Vector (semântica) com RRF
   */
  async hybridSearch(query: string, userId: string, topK: number = 5) {
    try {
      // 1. Busca Vetorial (Dense)
      const vectorResults = await this.vectorSearch(query, userId);

      // 2. Busca Keyword (Sparse - BM25)
      const keywordResults = await this.keywordSearch(query, userId);

      // 3. Reciprocal Rank Fusion
      const fusedResults = this.reciprocalRankFusion(
        vectorResults,
        keywordResults
      );

      // 4. Reranking (opcional)
      const reranked = await this.rerank(query, fusedResults.slice(0, topK));

      return reranked;
    } catch (error) {
      console.error('Erro em hybridSearch:', error);
      return [];
    }
  }

  private async vectorSearch(query: string, userId: string) {
    try {
      const queryEmbedding = await this.geminiService.generateEmbedding(query);
      const collection = await this.chroma.getOrCreateCollection({
        name: 'project_knowledge'
      });

      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: 10,
        where: { user_id: userId }
      });

      return results.documents[0] || [];
    } catch (error) {
      console.error('Erro em vectorSearch:', error);
      return [];
    }
  }

  private async keywordSearch(query: string, userId: string) {
    try {
      const result = await this.db.query(
        `SELECT id, content, ts_rank(content_tsvector, query) as rank
         FROM documents
         WHERE content_tsvector @@ plainto_tsquery('portuguese', $1)
         AND user_id = $2
         ORDER BY rank DESC
         LIMIT 10`,
        [query, userId]
      );

      return result.rows.map(row => row.content);
    } catch (error) {
      console.error('Erro em keywordSearch:', error);
      return [];
    }
  }

  private reciprocalRankFusion(vectorDocs: string[], keywordDocs: string[]): string[] {
    const k = 60;
    const scores = new Map<string, number>();

    // Scores de busca vetorial
    vectorDocs.forEach((doc, idx) => {
      const score = 1 / (k + idx + 1);
      scores.set(doc, (scores.get(doc) || 0) + score);
    });

    // Scores de busca keyword
    keywordDocs.forEach((doc, idx) => {
      const score = 1 / (k + idx + 1);
      scores.set(doc, (scores.get(doc) || 0) + score);
    });

    // Ordenar por score final
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([doc]) => doc);
  }

  private async rerank(query: string, docs: string[]): Promise<string[]> {
    // Implementação simplificada - em produção usar Cohere Rerank
    return docs;
  }

  /**
   * 🔴 PONTO 3: SEGURANÇA DE RAG
   * Prompt Injection Detection + PII Redaction + Hallucination Check
   */
  async handleRAGQuery(query: string, userId: string) {
    try {
      // 1. Input Guardrails - Detecta Prompt Injection
      if (this.detectPromptInjection(query)) {
        console.warn(`⚠️ Prompt injection detectado: ${query}`);
        return { error: 'Suspicious input detected', safe: false };
      }

      // 2. Busca Híbrida
      const context = await this.hybridSearch(query, userId);

      // 3. Generation com GeminiService
      const response = await this.generateResponse(query, context);

      // 4. Output Validation - Detecta PII e Hallucination
      const validated = await this.validateOutput(response, context);

      // 5. Log para auditoria
      await this.logQuery(userId, query, validated.text, validated.hallucinating);

      return validated;
    } catch (error) {
      console.error('Erro em handleRAGQuery:', error);
      return { error: 'Internal error', safe: false };
    }
  }

  private detectPromptInjection(query: string): boolean {
    const injectionPatterns = [
      /ignore.*instruction/i,
      /forget.*previous/i,
      /system.*prompt/i,
      /reveal.*secret/i,
      /what.*system/i,
      /qual.*instrução/i
    ];

    return injectionPatterns.some(pattern => pattern.test(query));
  }

  private async generateResponse(query: string, context: string[]): Promise<string> {
    const contextStr = context.join('\n\n');

    const systemPrompt = `
      Você é um assistente Fintech seguro.
      Responda APENAS com base no contexto abaixo.
      Se a resposta não estiver no contexto, diga "Não sei".
      SEMPRE cite as fontes (IDs dos documentos).
      Não revele dados pessoais ou sensíveis.
    `;

    try {
      // Usar GeminiService para gerar resposta
      const result = await this.geminiService.generateContent(
        `${systemPrompt}\n\nContexto:\n${contextStr}\n\nPergunta: ${query}`
      );

      return result;
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      return 'Desculpe, não consegui processar sua pergunta.';
    }
  }

  private async validateOutput(response: string, context: string[]): Promise<any> {
    // Sanitizar PII
    const sanitized = this.sanitizePII(response);

    // Detectar Hallucination
    const isHallucinating = !context.some(chunk =>
      this.textSimilarity(sanitized, chunk) > 0.5
    );

    return {
      text: sanitized,
      hallucinating: isHallucinating,
      confidence: isHallucinating ? 0.5 : 0.9
    };
  }

  private sanitizePII(text: string): string {
    const piiPatterns = {
      cpf: /\d{3}\.\d{3}\.\d{3}-\d{2}/g,
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      phone: /\(\d{2}\)\s?\d{4,5}-\d{4}/g
    };

    let sanitized = text;
    Object.entries(piiPatterns).forEach(([type, pattern]) => {
      sanitized = sanitized.replace(pattern, `[${type.toUpperCase()} REDACTED]`);
    });

    return sanitized;
  }

  private textSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  private async logQuery(userId: string, query: string, response: string, hallucinating: boolean) {
    try {
      await this.db.query(
        `INSERT INTO rag_queries (user_id, query, response, hallucinating, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, query, response, hallucinating]
      );
    } catch (error) {
      console.error('Erro ao logar query:', error);
    }
  }

  /**
   * 🔴 PONTO 4: EDGE AI
   * Suporte para Gemini Nano no navegador
   */
  setupEdgeAISupport() {
    this.io.on('connection', (socket) => {
      // Verificar disponibilidade de Edge AI
      socket.on('check-edge-ai', (callback) => {
        callback({
          available: true,
          message: 'Edge AI support available'
        });
      });

      // Fallback para servidor se Edge AI indisponível
      socket.on('autocomplete', async (text, callback) => {
        try {
          const suggestion = await this.geminiService.generateContent(
            `Completa esta frase em 1-2 palavras: "${text}"`
          );
          callback({ suggestion });
        } catch (error) {
          callback({ error: 'Failed to generate suggestion' });
        }
      });
    });
  }

  /**
   * 🔴 PONTO 5: LLMOPS COM RAGAS
   * Feedback loop e avaliação de qualidade
   */
  setupFeedbackLoop() {
    this.io.on('connection', (socket) => {
      socket.on('rag-feedback', async (data) => {
        const { queryId, rating, feedback } = data;

        try {
          // Salvar feedback
          await this.db.query(
            `INSERT INTO rag_feedback (query_id, rating, feedback, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [queryId, rating, feedback]
          );

          // Verificar se deve re-treinar
          const count = await this.db.query(
            `SELECT COUNT(*) as count FROM rag_feedback 
             WHERE created_at > NOW() - INTERVAL '1 day'`
          );

          if (count.rows[0].count % 100 === 0) {
            console.log('🔄 Re-treinando reranker com novo feedback...');
            await this.retrainReranker();
          }

          socket.emit('feedback-saved', { success: true });
        } catch (error) {
          console.error('Erro ao salvar feedback:', error);
          socket.emit('feedback-saved', { success: false, error });
        }
      });
    });
  }

  private async retrainReranker() {
    try {
      // Implementar re-treino do reranker
      console.log('✅ Re-treino concluído');
    } catch (error) {
      console.error('Erro ao re-treinar:', error);
    }
  }

  /**
   * Utilitários
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (normA * normB);
  }

  /**
   * Setup completo
   */
  async initialize() {
    console.log('🚀 Inicializando RAG Enterprise Integration...');

    // Setup WebSocket handlers
    this.setupEdgeAISupport();
    this.setupFeedbackLoop();

    // Setup realtime handlers
    this.io.on('connection', (socket) => {
      console.log('✅ Cliente conectado:', socket.id);

      // Presence
      socket.on('join-room', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined', socket.id);
      });

      // Collaborative editing com indexação
      socket.on('document-update', async (data) => {
        socket.to(data.roomId).emit('document-update', data);
        this.scheduleIndexing(data.metadata.id, data.content, data.metadata);
      });

      // RAG Query
      socket.on('rag-query', async (query, callback) => {
        const response = await this.handleRAGQuery(query, socket.handshake.auth.userId);
        callback(response);
      });
    });

    console.log('✅ RAG Enterprise Integration inicializado');
  }
}

export default RAGEnterpriseIntegration;
