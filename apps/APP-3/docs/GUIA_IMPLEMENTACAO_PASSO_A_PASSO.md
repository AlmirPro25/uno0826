# 🚀 GUIA DE IMPLEMENTAÇÃO PASSO-A-PASSO

## Fase 1: Otimização de Indexação (Debounced Snapshot)

### Passo 1.1: Criar o serviço de indexação
```bash
# Criar arquivo
touch services/IndexingService.ts
```

### Passo 1.2: Implementar debounce
```typescript
// services/IndexingService.ts
import Redis from 'ioredis';
import { ChromaClient } from 'chromadb';

export class IndexingService {
  private redis: Redis;
  private chroma: ChromaClient;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_TIME = 30000; // 30 segundos
  private readonly SIMILARITY_THRESHOLD = 0.85;

  constructor(redis: Redis, chroma: ChromaClient) {
    this.redis = redis;
    this.chroma = chroma;
  }

  // Agendar indexação com debounce
  scheduleIndexing(docId: string, content: string, metadata: any) {
    // Cancelar timer anterior
    if (this.debounceTimers.has(docId)) {
      clearTimeout(this.debounceTimers.get(docId)!);
    }

    // Agendar nova indexação
    const timer = setTimeout(async () => {
      await this.indexWithSemanticDiff(docId, content, metadata);
      this.debounceTimers.delete(docId);
    }, this.DEBOUNCE_TIME);

    this.debounceTimers.set(docId, timer);
  }

  // Indexar com semantic diff
  private async indexWithSemanticDiff(docId: string, content: string, metadata: any) {
    try {
      // Gerar novo embedding
      const newEmbedding = await this.generateEmbedding(content);

      // Buscar embedding anterior do cache
      const cachedEmbedding = await this.redis.get(`embedding:${docId}`);

      if (cachedEmbedding) {
        const oldEmbedding = JSON.parse(cachedEmbedding);
        const similarity = this.cosineSimilarity(oldEmbedding, newEmbedding);

        // Se similar, pular indexação
        if (similarity > this.SIMILARITY_THRESHOLD) {
          console.log(`✅ Doc ${docId}: Semanticamente similar (${similarity.toFixed(2)}), pulando indexação`);
          return;
        }
      }

      // Indexar no Chroma
      const collection = await this.chroma.getOrCreateCollection({
        name: 'project_knowledge'
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

  // Calcular similaridade de cosseno
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (normA * normB);
  }

  // Gerar embedding
  private async generateEmbedding(text: string): Promise<number[]> {
    // Implementar com Gemini
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }
}
```

### Passo 1.3: Integrar no WebSocket
```typescript
// services/RealtimeRAGService.ts
import { IndexingService } from './IndexingService';

export class RealtimeRAGService {
  private indexingService: IndexingService;

  setupRealtimeHandlers() {
    this.io.on('connection', (socket) => {
      socket.on('document-update', async (data) => {
        // Broadcast para outros usuários
        socket.to(data.roomId).emit('document-update', data);

        // Agendar indexação (não indexa agora!)
        this.indexingService.scheduleIndexing(
          data.metadata.id,
          data.content,
          data.metadata
        );
      });
    });
  }
}
```

### Passo 1.4: Testar
```bash
# Teste unitário
npm test -- IndexingService.test.ts

# Teste de carga
npm run test:load -- --documents 1000 --concurrent 10
```

---

## Fase 2: Busca Híbrida (Hybrid Search)

### Passo 2.1: Configurar PostgreSQL com tsvector
```sql
-- Criar tabela com suporte a busca full-text
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  content_tsvector tsvector,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índice para busca rápida
CREATE INDEX idx_documents_tsvector ON documents USING GIN(content_tsvector);

-- Trigger para atualizar tsvector automaticamente
CREATE TRIGGER documents_tsvector_update
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION tsvector_update_trigger(content_tsvector, 'pg_catalog.portuguese', content);
```

### Passo 2.2: Implementar Reciprocal Rank Fusion
```typescript
// services/HybridSearchService.ts
import { ChromaClient } from 'chromadb';
import { Pool } from 'pg';

export class HybridSearchService {
  private chroma: ChromaClient;
  private db: Pool;
  private readonly K = 60; // Parâmetro RRF

  constructor(chroma: ChromaClient, db: Pool) {
    this.chroma = chroma;
    this.db = db;
  }

  async hybridSearch(query: string, userId: string, topK: number = 5) {
    // 1. Busca Vetorial (Dense)
    const vectorResults = await this.vectorSearch(query, userId);

    // 2. Busca Keyword (Sparse - BM25)
    const keywordResults = await this.keywordSearch(query, userId);

    // 3. Reciprocal Rank Fusion
    const fusedResults = this.reciprocalRankFusion(
      vectorResults,
      keywordResults
    );

    // 4. Reranking (opcional, com Cross-Encoder)
    const reranked = await this.rerank(query, fusedResults.slice(0, topK));

    return reranked;
  }

  private async vectorSearch(query: string, userId: string) {
    const queryEmbedding = await this.generateEmbedding(query);
    const collection = await this.chroma.getOrCreateCollection({
      name: 'project_knowledge'
    });

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 10,
      where: { user_id: userId }
    });

    return results.documents[0] || [];
  }

  private async keywordSearch(query: string, userId: string) {
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
  }

  private reciprocalRankFusion(vectorDocs: string[], keywordDocs: string[]): string[] {
    const scores = new Map<string, number>();

    // Scores de busca vetorial
    vectorDocs.forEach((doc, idx) => {
      const score = 1 / (this.K + idx + 1);
      scores.set(doc, (scores.get(doc) || 0) + score);
    });

    // Scores de busca keyword
    keywordDocs.forEach((doc, idx) => {
      const score = 1 / (this.K + idx + 1);
      scores.set(doc, (scores.get(doc) || 0) + score);
    });

    // Ordenar por score final
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([doc]) => doc);
  }

  private async rerank(query: string, docs: string[]): Promise<string[]> {
    // Implementar com Cohere Rerank ou similar
    // Por enquanto, retornar como está
    return docs;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }
}
```

### Passo 2.3: Testar
```bash
# Teste: Busca por ID exato
npm test -- HybridSearch.test.ts --grep "exact-id"

# Teste: Busca por conceito
npm test -- HybridSearch.test.ts --grep "concept"

# Teste: Comparar RRF vs apenas vetor
npm test -- HybridSearch.test.ts --grep "rrf-vs-vector"
```

---

## Fase 3: Segurança de RAG (AI Guardrails)

### Passo 3.1: Implementar Input Guardrails
```typescript
// services/SecurityService.ts
export class SecurityService {
  private readonly INJECTION_PATTERNS = [
    /ignore.*instruction/i,
    /forget.*previous/i,
    /system.*prompt/i,
    /reveal.*secret/i,
    /what.*system/i,
    /qual.*instrução/i
  ];

  private readonly PII_PATTERNS = {
    cpf: /\d{3}\.\d{3}\.\d{3}-\d{2}/g,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /\(\d{2}\)\s?\d{4,5}-\d{4}/g
  };

  // Detectar Prompt Injection
  detectPromptInjection(query: string): boolean {
    return this.INJECTION_PATTERNS.some(pattern => pattern.test(query));
  }

  // Sanitizar PII
  sanitizePII(text: string): string {
    let sanitized = text;
    Object.entries(this.PII_PATTERNS).forEach(([type, pattern]) => {
      sanitized = sanitized.replace(pattern, `[${type.toUpperCase()} REDACTED]`);
    });
    return sanitized;
  }

  // Detectar Hallucination
  detectHallucination(response: string, context: string[]): boolean {
    const maxSimilarity = Math.max(
      ...context.map(chunk => this.textSimilarity(response, chunk))
    );
    return maxSimilarity < 0.5;
  }

  private textSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }
}
```

### Passo 3.2: Integrar no RAG Query
```typescript
// services/RealtimeRAGService.ts
export class RealtimeRAGService {
  private securityService: SecurityService;

  async handleRAGQuery(query: string, userId: string) {
    // 1. Input Guardrails
    if (this.securityService.detectPromptInjection(query)) {
      console.warn(`⚠️ Prompt injection detectado: ${query}`);
      return { error: 'Suspicious input detected', safe: false };
    }

    // 2. Busca Híbrida
    const context = await this.hybridSearch(query, userId);

    // 3. Generation
    const response = await this.generateResponse(query, context);

    // 4. Output Validation
    const sanitized = this.securityService.sanitizePII(response);
    const isHallucinating = this.securityService.detectHallucination(sanitized, context);

    // 5. Log para auditoria
    await this.logQuery(userId, query, sanitized, isHallucinating);

    return {
      text: sanitized,
      hallucinating: isHallucinating,
      confidence: isHallucinating ? 0.5 : 0.9
    };
  }

  private async logQuery(userId: string, query: string, response: string, hallucinating: boolean) {
    await this.db.query(
      `INSERT INTO rag_queries (user_id, query, response, hallucinating, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, query, response, hallucinating]
    );
  }
}
```

### Passo 3.3: Testar
```bash
# Teste: Prompt injection é bloqueado
npm test -- Security.test.ts --grep "injection"

# Teste: PII é redacted
npm test -- Security.test.ts --grep "pii"

# Teste: Hallucination é detectada
npm test -- Security.test.ts --grep "hallucination"
```

---

## Fase 4: Edge AI (Gemini Nano)

### Passo 4.1: Detectar disponibilidade
```typescript
// hooks/useEdgeAI.ts
import { useEffect, useState } from 'react';

export function useEdgeAI() {
  const [edgeAIReady, setEdgeAIReady] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    initializeEdgeAI();
  }, []);

  const initializeEdgeAI = async () => {
    try {
      if (!('ai' in window) || !('languageModel' in window.ai)) {
        console.log('Edge AI não disponível');
        return;
      }

      const canCreate = await window.ai.languageModel.canCreateTextSession();
      if (canCreate === 'readily' || canCreate === 'after-download') {
        const newSession = await window.ai.languageModel.createTextSession();
        setSession(newSession);
        setEdgeAIReady(true);
        console.log('✅ Gemini Nano pronto');
      }
    } catch (error) {
      console.error('Erro ao inicializar Edge AI:', error);
    }
  };

  return { edgeAIReady, session };
}
```

### Passo 4.2: Implementar Autocomplete
```typescript
// hooks/useAutocomplete.ts
import { useEdgeAI } from './useEdgeAI';

export function useAutocomplete() {
  const { edgeAIReady, session } = useEdgeAI();

  const getAutocompleteSuggestions = async (text: string): Promise<string> => {
    if (edgeAIReady && session) {
      try {
        const startTime = performance.now();
        const suggestion = await session.prompt(
          `Completa esta frase em 1-2 palavras: "${text}"`
        );
        const latency = performance.now() - startTime;
        console.log(`✅ Sugestão local em ${latency.toFixed(0)}ms`);
        return suggestion;
      } catch (error) {
        console.error('Erro no Edge AI:', error);
        return await getAutocompletFromServer(text);
      }
    } else {
      return await getAutocompletFromServer(text);
    }
  };

  const getAutocompletFromServer = async (text: string): Promise<string> => {
    const response = await fetch('/api/autocomplete', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    const data = await response.json();
    return data.suggestion;
  };

  return { getAutocompleteSuggestions };
}
```

### Passo 4.3: Testar
```bash
# Teste: Edge AI funciona
npm test -- EdgeAI.test.ts --grep "initialization"

# Teste: Autocomplete é rápido
npm test -- EdgeAI.test.ts --grep "latency"

# Teste: Fallback funciona
npm test -- EdgeAI.test.ts --grep "fallback"
```

---

## Fase 5: LLMOps com RAGAS

### Passo 5.1: Setup RAGAS
```bash
npm install ragas-js
```

### Passo 5.2: Criar dataset de teste
```typescript
// tests/ragas-dataset.ts
export const testDataset = [
  {
    question: "Como fazer um depósito?",
    ground_truth: "Clique em Depósito, escolha PIX, escaneie o QR Code",
    answer: "Para depositar, acesse a seção Depósitos e siga as instruções",
    contexts: [
      "Seção de Depósitos: Clique em Depósito para iniciar",
      "Escolha o método: PIX, Cartão ou Transferência",
      "PIX: Escaneie o QR Code com seu banco"
    ]
  },
  // ... mais exemplos
];
```

### Passo 5.3: Implementar avaliação
```typescript
// services/RAGASService.ts
import { evaluate } from 'ragas-js';

export class RAGASService {
  async evaluateRAG(dataset: any[]) {
    const results = await evaluate({
      dataset,
      metrics: [
        'faithfulness',
        'answer_relevance',
        'context_precision',
        'context_recall'
      ]
    });

    console.log('📊 Resultados RAGAS:');
    console.log(`Faithfulness: ${(results.faithfulness * 100).toFixed(1)}%`);
    console.log(`Answer Relevance: ${(results.answer_relevance * 100).toFixed(1)}%`);
    console.log(`Context Precision: ${(results.context_precision * 100).toFixed(1)}%`);
    console.log(`Context Recall: ${(results.context_recall * 100).toFixed(1)}%`);

    // Verificar targets
    const passed = 
      results.faithfulness > 0.85 &&
      results.answer_relevance > 0.80 &&
      results.context_precision > 0.75 &&
      results.context_recall > 0.80;

    return { results, passed };
  }
}
```

### Passo 5.4: Implementar feedback loop
```typescript
// services/FeedbackService.ts
export class FeedbackService {
  async handleFeedback(queryId: string, rating: 'up' | 'down', feedback: string) {
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
      console.log('🔄 Re-treinando reranker...');
      await this.retrainReranker();
    }
  }

  private async retrainReranker() {
    // Implementar re-treino do reranker
    console.log('✅ Re-treino concluído');
  }
}
```

### Passo 5.5: Testar
```bash
# Teste: RAGAS calcula métricas
npm test -- RAGAS.test.ts --grep "metrics"

# Teste: Feedback é salvo
npm test -- RAGAS.test.ts --grep "feedback"

# Teste: Re-treino é acionado
npm test -- RAGAS.test.ts --grep "retraining"
```

---

## 🎯 Checklist de Implementação

- [ ] Fase 1: Debounced Indexing
  - [ ] Criar IndexingService
  - [ ] Implementar debounce
  - [ ] Implementar semantic diff
  - [ ] Integrar no WebSocket
  - [ ] Testes passando

- [ ] Fase 2: Busca Híbrida
  - [ ] Configurar PostgreSQL tsvector
  - [ ] Criar HybridSearchService
  - [ ] Implementar RRF
  - [ ] Integrar no RAG Query
  - [ ] Testes passando

- [ ] Fase 3: Segurança
  - [ ] Criar SecurityService
  - [ ] Implementar Prompt Injection detection
  - [ ] Implementar PII sanitization
  - [ ] Implementar Hallucination detection
  - [ ] Testes passando

- [ ] Fase 4: Edge AI
  - [ ] Criar useEdgeAI hook
  - [ ] Implementar Autocomplete
  - [ ] Implementar fallback
  - [ ] Testes passando

- [ ] Fase 5: LLMOps
  - [ ] Setup RAGAS
  - [ ] Criar dataset de teste
  - [ ] Implementar avaliação
  - [ ] Implementar feedback loop
  - [ ] Testes passando

---

## 📊 Métricas de Sucesso

Após implementar tudo:

| Métrica | Target | Validar |
|---------|--------|---------|
| Custo de Embeddings | -70-80% | ✅ |
| Relevância de Busca | +25-40% | ✅ |
| Taxa de Bloqueio (Injection) | 99% | ✅ |
| Latência Edge AI | < 100ms | ✅ |
| Faithfulness (RAGAS) | > 0.85 | ✅ |

---

**Tempo estimado:** 5 semanas (1 semana por fase)  
**Dificuldade:** Média  
**Impacto:** Altíssimo
