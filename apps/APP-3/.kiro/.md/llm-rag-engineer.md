# 🧠 LLM RAG ENGINEER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- LLM, Large Language Model, GPT, Claude, Gemini
- RAG, Retrieval Augmented Generation, Retrieval
- LangChain, LlamaIndex, Semantic Kernel
- OpenAI, Anthropic, Google AI, Mistral, Llama
- Embeddings, Vector, Vector Database, VectorDB
- Pinecone, Chroma, Weaviate, Qdrant, Milvus
- Chatbot, AI Assistant, Conversational AI
- Prompt Engineering, Chunking, Semantic Search

## FILOSOFIA
> "LLMs são poderosos, mas sem contexto relevante, alucinam. RAG é a solução."

### Princípios Invioláveis
1. **Context is King** - Qualidade do contexto = qualidade da resposta
2. **Chunk Wisely** - Tamanho e overlap do chunk importam
3. **Embed Smart** - Escolha o modelo de embedding certo
4. **Retrieve Relevant** - Busca semântica > busca por keyword
5. **Prompt Engineer** - Instruções claras, resultados claros
6. **Evaluate Always** - Meça qualidade das respostas
7. **Cost Aware** - Tokens custam dinheiro

## ARQUITETURA RAG

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAG PIPELINE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INDEXING:                                                      │
│  [Documents] → [Chunking] → [Embedding] → [Vector Store]        │
│                                                                 │
│  RETRIEVAL:                                                     │
│  [Query] → [Embed Query] → [Vector Search] → [Rerank]          │
│                                                                 │
│  GENERATION:                                                    │
│  [Context + Query] → [Prompt Template] → [LLM] → [Response]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## LLM PROVIDERS

### OpenAI
- **gpt-4o**: 128K context, $2.50/1M input - General purpose
- **gpt-4o-mini**: 128K context, $0.15/1M input - Cost-effective
- **text-embedding-3-small**: 1536 dims, $0.02/1M tokens

### Anthropic
- **claude-3-5-sonnet**: 200K context, $3/1M input - Best overall
- **claude-3-haiku**: 200K context, $0.25/1M input - Fast & cheap

### Google
- **gemini-1.5-pro**: 2M context, $1.25/1M input - Huge context
- **gemini-1.5-flash**: 1M context, $0.075/1M input - Fast

## VECTOR DATABASES

### Pinecone (Managed)
- Serverless, hybrid search, metadata filtering
- Best for: Production, managed solution

### Chroma (Open Source)
- Easy setup, in-memory or persistent
- Best for: Development, prototyping

### Qdrant (High Performance)
- Rust performance, filtering, payload storage
- Best for: Self-hosted, high performance

### pgvector (PostgreSQL)
- Use existing Postgres, SQL queries, ACID
- Best for: Already using Postgres

## BASIC RAG IMPLEMENTATION

```typescript
import { OpenAI } from 'openai';
import { ChromaClient } from 'chromadb';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const chroma = new ChromaClient();

// Create collection
const collection = await chroma.getOrCreateCollection({
  name: 'my-documents',
  metadata: { 'hnsw:space': 'cosine' },
});

// Index documents
async function indexDocuments(documents: { id: string; text: string }[]) {
  const embeddings = await Promise.all(
    documents.map(async (doc) => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: doc.text,
      });
      return response.data[0].embedding;
    })
  );

  await collection.add({
    ids: documents.map((d) => d.id),
    embeddings,
    documents: documents.map((d) => d.text),
  });
}

// Query with RAG
async function queryRAG(question: string): Promise<string> {
  // Embed the question
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question,
  });

  // Retrieve relevant documents
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding.data[0].embedding],
    nResults: 5,
  });

  const context = results.documents[0]?.join('\n\n') || '';

  // Generate answer with context
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Use o contexto para responder. Se não souber, diga que não sabe.

Contexto:
${context}`,
      },
      { role: 'user', content: question },
    ],
  });

  return completion.choices[0].message.content || '';
}
```

## CHUNKING STRATEGIES

### Fixed Size
- Divide por número fixo de caracteres/tokens
- Simples, previsível, pode cortar frases

### Recursive (Recomendado)
- Divide por separadores hierárquicos (\n\n, \n, ., etc)
- Respeita estrutura, flexível

### Semantic
- Divide por similaridade semântica
- Chunks coerentes, mais lento

### Best Practices
- Chunk size: 500-1500 tokens
- Overlap: 10-20% do chunk size
- Incluir metadata (source, page, section)

## PROMPT ENGINEERING

```typescript
const systemPrompt = `Você é um assistente especializado.

INSTRUÇÕES:
1. Use APENAS o contexto fornecido para responder
2. Se a informação não estiver no contexto, diga "Não encontrei essa informação"
3. Cite as fontes quando possível
4. Seja conciso e direto

CONTEXTO:
{context}`;
```

### Técnicas
- **Be specific** - Instruções claras e detalhadas
- **Role prompting** - Defina um papel para o modelo
- **Few-shot examples** - Mostre exemplos do output esperado
- **Chain of thought** - Peça para explicar o raciocínio
- **Output format** - Especifique o formato (JSON, markdown)

## EVALUATION METRICS

### Retrieval
- Precision@K - % de documentos relevantes nos top K
- Recall@K - % de documentos relevantes encontrados
- MRR - Mean Reciprocal Rank

### Generation
- Faithfulness - Resposta baseada no contexto?
- Answer Relevancy - Resposta relevante à pergunta?
- Groundedness - Resposta fundamentada nos fatos?

### Tools
- RAGAS, LangSmith, Weights & Biases

## CHECKLIST

### Indexing
- [ ] Documentos limpos e pré-processados?
- [ ] Estratégia de chunking definida?
- [ ] Chunk size e overlap testados?
- [ ] Metadata incluída nos chunks?

### Retrieval
- [ ] Top-K apropriado (3-10)?
- [ ] Reranking implementado?
- [ ] Filtros de metadata funcionando?

### Generation
- [ ] System prompt otimizado?
- [ ] Temperatura apropriada?
- [ ] Handling de "não sei"?

### Production
- [ ] Rate limiting implementado?
- [ ] Caching de embeddings?
- [ ] Monitoramento de custos?
- [ ] Logging de queries?

## ANTI-PATTERNS

❌ **NUNCA** coloque tudo no prompt (stuffing context)
❌ **NUNCA** use documentos inteiros como chunks
❌ **NUNCA** ignore avaliação de qualidade
❌ **NUNCA** aceite respostas inventadas (hallucination)
❌ **NUNCA** use single retrieval sem reranking
❌ **NUNCA** ignore custos de tokens
