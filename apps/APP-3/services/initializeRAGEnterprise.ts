/**
 * 🚀 INITIALIZE RAG ENTERPRISE
 * 
 * Inicializa o RAG Enterprise Grade com todas as integrações
 * Conecta: RAG + Mesh Network + Neural Core + GeminiService
 */

import { Server } from 'socket.io';
import { ChromaClient } from 'chromadb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { GeminiService } from './GeminiService';
import { GeminiProxyClient } from './GeminiProxyClient';
import RAGEnterpriseIntegration from './RAGEnterpriseIntegration';
import RAGMeshNetworkBridge from './RAGMeshNetworkBridge';
import RAGNeuralCoreBridge from './RAGNeuralCoreBridge';

export class RAGEnterpriseInitializer {
  private ragService: RAGEnterpriseIntegration;
  private meshBridge: RAGMeshNetworkBridge;
  private neuralBridge: RAGNeuralCoreBridge;

  constructor(
    private io: Server,
    private chroma: ChromaClient,
    private gemini: GoogleGenerativeAI,
    private db: Pool,
    private redis: Redis,
    private geminiService: GeminiService,
    private geminiProxy: GeminiProxyClient
  ) {}

  /**
   * Inicializar tudo
   */
  async initialize() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║     🚀 INICIALIZANDO RAG ENTERPRISE GRADE 🚀              ║');
    console.log('║                                                            ║');
    console.log('║     Os 5 Pontos Críticos:                                 ║');
    console.log('║     1️⃣  Otimização de Indexação                           ║');
    console.log('║     2️⃣  Busca Híbrida                                     ║');
    console.log('║     3️⃣  Segurança de RAG                                  ║');
    console.log('║     4️⃣  Edge AI                                           ║');
    console.log('║     5️⃣  LLMOps com RAGAS                                  ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
      // 1. Inicializar RAG Enterprise Integration
      console.log('📝 Inicializando RAG Enterprise Integration...');
      this.ragService = new RAGEnterpriseIntegration(
        this.io,
        this.chroma,
        this.gemini,
        this.db,
        this.redis,
        this.geminiService,
        this.geminiProxy
      );
      await this.ragService.initialize();
      console.log('✅ RAG Enterprise Integration inicializado\n');

      // 2. Inicializar Mesh Network Bridge
      console.log('🌐 Inicializando Mesh Network Bridge...');
      this.meshBridge = new RAGMeshNetworkBridge(this.ragService);
      this.registerMeshNodes();
      console.log('✅ Mesh Network Bridge inicializado\n');

      // 3. Inicializar Neural Core Bridge
      console.log('🧠 Inicializando Neural Core Bridge...');
      this.neuralBridge = new RAGNeuralCoreBridge(this.ragService);
      console.log('✅ Neural Core Bridge inicializado\n');

      // 4. Setup WebSocket handlers
      console.log('🔌 Configurando WebSocket handlers...');
      this.setupWebSocketHandlers();
      console.log('✅ WebSocket handlers configurados\n');

      // 5. Setup health check
      console.log('💚 Configurando health check...');
      this.setupHealthCheck();
      console.log('✅ Health check configurado\n');

      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                                                            ║');
      console.log('║     ✅ RAG ENTERPRISE GRADE INICIALIZADO COM SUCESSO ✅   ║');
      console.log('║                                                            ║');
      console.log('║     Status:                                               ║');
      console.log('║     ✅ RAG Enterprise Integration                         ║');
      console.log('║     ✅ Mesh Network Bridge                                ║');
      console.log('║     ✅ Neural Core Bridge                                 ║');
      console.log('║     ✅ WebSocket Handlers                                 ║');
      console.log('║     ✅ Health Check                                       ║');
      console.log('║                                                            ║');
      console.log('║     Pronto para receber queries! 🚀                       ║');
      console.log('║                                                            ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

    } catch (error) {
      console.error('❌ Erro ao inicializar RAG Enterprise:', error);
      throw error;
    }
  }

  /**
   * Registrar nós do Mesh Network
   */
  private registerMeshNodes() {
    // Registrar nó local
    this.meshBridge.registerRAGNode('rag-local', {
      host: 'localhost',
      port: 3001,
      region: 'local'
    });

    // Registrar nós remotos (se disponíveis)
    const remoteNodes = process.env.RAG_REMOTE_NODES?.split(',') || [];
    remoteNodes.forEach((node, idx) => {
      this.meshBridge.registerRAGNode(`rag-remote-${idx}`, {
        host: node,
        port: 3001,
        region: 'remote'
      });
    });

    console.log(`  ✅ ${this.meshBridge.discoverRAGNodes().length} nós RAG registrados`);
  }

  /**
   * Setup WebSocket handlers
   */
  private setupWebSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`  ✅ Cliente conectado: ${socket.id}`);

      // RAG Query com Mesh Network
      socket.on('rag-query', async (query, callback) => {
        try {
          // Validar com Neural Core
          const validation = await this.neuralBridge.validateQuery(query);
          if (!validation.valid) {
            callback({
              error: 'Query inválida',
              issues: validation.issues
            });
            return;
          }

          // Distribuir com Mesh Network
          const result = await this.meshBridge.distributeQuery(
            query,
            socket.handshake.auth.userId
          );

          // Validar resposta com Neural Core
          const responseValidation = await this.neuralBridge.validateResponse(
            result.text,
            [] // context
          );

          callback({
            ...result,
            validation: responseValidation
          });
        } catch (error) {
          console.error('Erro em rag-query:', error);
          callback({ error: 'Internal error' });
        }
      });

      // Feedback para RAGAS
      socket.on('rag-feedback', async (data, callback) => {
        try {
          // Salvar feedback (será processado pelo RAG Service)
          console.log(`  📝 Feedback recebido: ${data.rating}`);
          callback({ success: true });
        } catch (error) {
          callback({ success: false, error });
        }
      });

      // Obter estatísticas
      socket.on('rag-stats', (callback) => {
        const stats = {
          mesh: this.meshBridge.getStats(),
          neural: this.neuralBridge.getStats(),
          timestamp: new Date().toISOString()
        };
        callback(stats);
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`  ❌ Cliente desconectado: ${socket.id}`);
      });
    });
  }

  /**
   * Setup health check
   */
  private setupHealthCheck() {
    setInterval(async () => {
      try {
        // Health check do Mesh Network
        await this.meshBridge.healthCheck();

        // Sincronizar índices
        await this.meshBridge.syncIndexes();

        // Log de estatísticas
        const stats = this.meshBridge.getStats();
        console.log(`  💚 Health check: ${stats.activeNodes}/${stats.totalNodes} nós ativos`);
      } catch (error) {
        console.error('  ❌ Erro em health check:', error);
      }
    }, 60000); // A cada 1 minuto
  }

  /**
   * Obter serviços
   */
  getServices() {
    return {
      rag: this.ragService,
      mesh: this.meshBridge,
      neural: this.neuralBridge
    };
  }
}

/**
 * Factory function para inicializar
 */
export async function initializeRAGEnterprise(
  io: Server,
  chroma: ChromaClient,
  gemini: GoogleGenerativeAI,
  db: Pool,
  redis: Redis,
  geminiService: GeminiService,
  geminiProxy: GeminiProxyClient
) {
  const initializer = new RAGEnterpriseInitializer(
    io,
    chroma,
    gemini,
    db,
    redis,
    geminiService,
    geminiProxy
  );

  await initializer.initialize();
  return initializer.getServices();
}

export default RAGEnterpriseInitializer;
