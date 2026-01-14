/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🧠 LLM RAG ENGINEER MANIFEST - O ARQUITETO DE MENTES ARTIFICIAIS 🧠    ║
 * ║                                                                              ║
 * ║         "Dê contexto à IA e ela te dará respostas precisas."                ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Manifesto completo para LLMs, RAG, Vector Databases e AI Applications.
 * Suporta: LangChain, OpenAI, Anthropic, Pinecone, Chroma, Embeddings
 * 
 * @author Micro SaaS Factory
 * @version 1.0.0
 */

export const LLM_RAG_ENGINEER_MANIFEST = {
  id: 'llm-rag-engineer',
  name: 'LLM RAG Engineer',
  version: '1.0.0',
  description: 'Especialista em LLMs, RAG, Vector Databases e Aplicações de IA',
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // PALAVRAS-CHAVE PARA ATIVAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════
  keywords: [
    'llm', 'large language model', 'gpt', 'claude', 'gemini',
    'rag', 'retrieval augmented generation', 'retrieval',
    'langchain', 'llamaindex', 'semantic kernel',
    'openai', 'anthropic', 'google ai', 'mistral', 'llama',
    'embeddings', 'vector', 'vector database', 'vectordb',
    'pinecone', 'chroma', 'weaviate', 'qdrant', 'milvus',
    'chatbot', 'ai assistant', 'conversational ai',
    'prompt engineering', 'prompt', 'context window',
    'fine-tuning', 'few-shot', 'zero-shot',
    'chunking', 'splitting', 'semantic search'
  ],

  // ═══════════════════════════════════════════════════════════════════════════════
  // FILOSOFIA
  // ═══════════════════════════════════════════════════════════════════════════════
  philosophy: {
    core: 'LLMs são poderosos, mas sem contexto relevante, alucinam. RAG é a solução.',
    principles: [
      'Context is King - Qualidade do contexto = qualidade da resposta',
      'Chunk Wisely - Tamanho e overlap do chunk importam',
      'Embed Smart - Escolha o modelo de embedding certo',
      'Retrieve Relevant - Busca semântica > busca por keyword',
      'Prompt Engineer - Instruções claras, resultados claros',
      'Evaluate Always - Meça qualidade das respostas',
      'Cost Aware - Tokens custam dinheiro'
    ],
    antiPatterns: [
      'Stuffing context - Colocar tudo no prompt',
      'Ignoring chunking - Documentos inteiros como chunks',
      'No evaluation - Não medir qualidade',
      'Hallucination tolerance - Aceitar respostas inventadas',
      'Single retrieval - Não usar reranking',
      'Ignoring costs - Não otimizar uso de tokens'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ARQUITETURA RAG
  // ═══════════════════════════════════════════════════════════════════════════════
  architecture: `
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         RAG ARCHITECTURE                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      INDEXING PIPELINE                                  │   │
│  │                                                                         │   │
│  │  [Documents] ──▶ [Chunking] ──▶ [Embedding] ──▶ [Vector Store]         │   │
│  │      │              │              │                │                   │   │
│  │      ▼              ▼              ▼                ▼                   │   │
│  │   PDF, MD,      Split by       OpenAI          Pinecone,               │   │
│  │   HTML, TXT     size/semantic  text-embedding  Chroma, etc.            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      RETRIEVAL PIPELINE                                 │   │
│  │                                                                         │   │
│  │  [User Query] ──▶ [Embed Query] ──▶ [Vector Search] ──▶ [Rerank]       │   │
│  │       │                │                 │                 │            │   │
│  │       ▼                ▼                 ▼                 ▼            │   │
│  │   "Como fazer X?"   Same model      Top-K similar     Cohere Rerank    │   │
│  │                     as indexing     documents         or Cross-encoder  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      GENERATION PIPELINE                                │   │
│  │                                                                         │   │
│  │  [Context + Query] ──▶ [Prompt Template] ──▶ [LLM] ──▶ [Response]      │   │
│  │         │                     │                │            │           │   │
│  │         ▼                     ▼                ▼            ▼           │   │
│  │   Retrieved docs +      System prompt +    GPT-4,      Formatted       │   │
│  │   user question         few-shot examples  Claude      answer          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
`,

  // ═══════════════════════════════════════════════════════════════════════════════
  // LLM PROVIDERS
  // ═══════════════════════════════════════════════════════════════════════════════
  llmProviders: {
    openai: {
      name: 'OpenAI',
      models: {
        'gpt-4o': { context: '128K', pricing: '$2.50/1M input, $10/1M output', best: 'General purpose' },
        'gpt-4o-mini': { context: '128K', pricing: '$0.15/1M input, $0.60/1M output', best: 'Cost-effective' },
        'gpt-4-turbo': { context: '128K', pricing: '$10/1M input, $30/1M output', best: 'Complex reasoning' },
        'o1-preview': { context: '128K', pricing: '$15/1M input, $60/1M output', best: 'Advanced reasoning' }
      },
      embeddings: {
        'text-embedding-3-small': { dimensions: 1536, pricing: '$0.02/1M tokens' },
        'text-embedding-3-large': { dimensions: 3072, pricing: '$0.13/1M tokens' }
      }
    },
    anthropic: {
      name: 'Anthropic',
      models: {
        'claude-3-5-sonnet': { context: '200K', pricing: '$3/1M input, $15/1M output', best: 'Best overall' },
        'claude-3-opus': { context: '200K', pricing: '$15/1M input, $75/1M output', best: 'Most capable' },
        'claude-3-haiku': { context: '200K', pricing: '$0.25/1M input, $1.25/1M output', best: 'Fast & cheap' }
      }
    },
    google: {
      name: 'Google AI',
      models: {
        'gemini-1.5-pro': { context: '2M', pricing: '$1.25/1M input, $5/1M output', best: 'Huge context' },
        'gemini-1.5-flash': { context: '1M', pricing: '$0.075/1M input, $0.30/1M output', best: 'Fast' }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // VECTOR DATABASES
  // ═══════════════════════════════════════════════════════════════════════════════
  vectorDatabases: {
    pinecone: {
      name: 'Pinecone',
      type: 'Managed cloud',
      pricing: 'Free tier, then usage-based',
      features: ['Serverless', 'Hybrid search', 'Metadata filtering', 'Namespaces'],
      bestFor: 'Production, managed solution'
    },
    chroma: {
      name: 'Chroma',
      type: 'Open source',
      pricing: 'Free (self-hosted)',
      features: ['Easy setup', 'In-memory or persistent', 'Python/JS SDKs'],
      bestFor: 'Development, prototyping, small scale'
    },
    qdrant: {
      name: 'Qdrant',
      type: 'Open source + Cloud',
      pricing: 'Free (self-hosted), Cloud available',
      features: ['Rust performance', 'Filtering', 'Payload storage'],
      bestFor: 'High performance, self-hosted'
    },
    weaviate: {
      name: 'Weaviate',
      type: 'Open source + Cloud',
      pricing: 'Free (self-hosted), Cloud available',
      features: ['GraphQL API', 'Hybrid search', 'Modules'],
      bestFor: 'Complex queries, hybrid search'
    },
    pgvector: {
      name: 'pgvector',
      type: 'PostgreSQL extension',
      pricing: 'Free',
      features: ['Use existing Postgres', 'SQL queries', 'ACID'],
      bestFor: 'Already using Postgres, simple needs'
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CODE TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════════
  codeTemplates: {
    basicRag: `// ═══════════════════════════════════════════════════════════════
// BASIC RAG - OpenAI + Chroma
// ═══════════════════════════════════════════════════════════════
import { OpenAI } from 'openai';
import { ChromaClient } from 'chromadb';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const chroma = new ChromaClient();

// 1. Create collection
const collection = await chroma.getOrCreateCollection({
  name: 'my-documents',
  metadata: { 'hnsw:space': 'cosine' },
});

// 2. Index documents
async function indexDocuments(documents: { id: string; text: string; metadata?: object }[]) {
  // Generate embeddings
  const embeddings = await Promise.all(
    documents.map(async (doc) => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: doc.text,
      });
      return response.data[0].embedding;
    })
  );

  // Add to collection
  await collection.add({
    ids: documents.map((d) => d.id),
    embeddings,
    documents: documents.map((d) => d.text),
    metadatas: documents.map((d) => d.metadata || {}),
  });
}

// 3. Query with RAG
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

  // Build context from retrieved documents
  const context = results.documents[0]?.join('\\n\\n') || '';

  // Generate answer with context
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: \`Você é um assistente útil. Use o contexto fornecido para responder.
Se a resposta não estiver no contexto, diga que não sabe.

Contexto:
\${context}\`,
      },
      { role: 'user', content: question },
    ],
    temperature: 0.7,
  });

  return completion.choices[0].message.content || '';
}`,

    langchainRag: `// ═══════════════════════════════════════════════════════════════
// LANGCHAIN RAG - Full Pipeline
// ═══════════════════════════════════════════════════════════════
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Document } from '@langchain/core/documents';

// Initialize models
const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
});

const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-small',
});

// 1. Load and split documents
async function loadAndSplitDocuments(texts: string[]): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ['\\n\\n', '\\n', '. ', ' ', ''],
  });

  const docs = texts.map((text) => new Document({ pageContent: text }));
  return splitter.splitDocuments(docs);
}

// 2. Create vector store
async function createVectorStore(documents: Document[]): Promise<Chroma> {
  return Chroma.fromDocuments(documents, embeddings, {
    collectionName: 'my-collection',
  });
}

// 3. Create RAG chain
async function createRAGChain(vectorStore: Chroma) {
  const retriever = vectorStore.asRetriever({
    k: 5,
    searchType: 'similarity',
  });

  const prompt = ChatPromptTemplate.fromTemplate(\`
Você é um assistente especializado. Use o contexto para responder.
Se não souber a resposta, diga que não sabe.

Contexto:
{context}

Pergunta: {input}

Resposta:\`);

  const documentChain = await createStuffDocumentsChain({
    llm,
    prompt,
  });

  return createRetrievalChain({
    combineDocsChain: documentChain,
    retriever,
  });
}

// 4. Query
async function query(chain: any, question: string) {
  const response = await chain.invoke({ input: question });
  return {
    answer: response.answer,
    sources: response.context.map((doc: Document) => doc.pageContent.slice(0, 100)),
  };
}`,

    conversationalRag: `// ═══════════════════════════════════════════════════════════════
// CONVERSATIONAL RAG - With Memory
// ═══════════════════════════════════════════════════════════════
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { BufferMemory } from 'langchain/memory';
import { ConversationalRetrievalQAChain } from 'langchain/chains';

const llm = new ChatOpenAI({ modelName: 'gpt-4o-mini' });
const embeddings = new OpenAIEmbeddings();

async function createConversationalRAG(vectorStore: Chroma) {
  const memory = new BufferMemory({
    memoryKey: 'chat_history',
    returnMessages: true,
    outputKey: 'answer',
  });

  const chain = ConversationalRetrievalQAChain.fromLLM(
    llm,
    vectorStore.asRetriever({ k: 5 }),
    {
      memory,
      returnSourceDocuments: true,
      questionGeneratorChainOptions: {
        llm: new ChatOpenAI({ modelName: 'gpt-4o-mini', temperature: 0 }),
      },
    }
  );

  return chain;
}

// Usage with conversation history
async function chat(chain: any, message: string) {
  const response = await chain.call({ question: message });
  return {
    answer: response.answer,
    sources: response.sourceDocuments,
  };
}

// Example conversation
// await chat(chain, "O que é RAG?")
// await chat(chain, "Como ele funciona?") // Entende que "ele" = RAG`
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHUNKING STRATEGIES
  // ═══════════════════════════════════════════════════════════════════════════════
  chunking: {
    strategies: {
      fixedSize: {
        description: 'Divide por número fixo de caracteres/tokens',
        pros: ['Simples', 'Previsível'],
        cons: ['Pode cortar no meio de frases'],
        useCase: 'Textos homogêneos'
      },
      recursive: {
        description: 'Divide por separadores hierárquicos (\\n\\n, \\n, . , etc)',
        pros: ['Respeita estrutura', 'Flexível'],
        cons: ['Chunks de tamanhos variados'],
        useCase: 'Maioria dos casos'
      },
      semantic: {
        description: 'Divide por similaridade semântica',
        pros: ['Chunks coerentes', 'Melhor retrieval'],
        cons: ['Mais lento', 'Mais complexo'],
        useCase: 'Documentos técnicos, alta qualidade'
      },
      document: {
        description: 'Divide por estrutura do documento (headers, seções)',
        pros: ['Preserva contexto', 'Natural'],
        cons: ['Depende do formato'],
        useCase: 'Markdown, HTML estruturado'
      }
    },
    bestPractices: [
      'Chunk size: 500-1500 tokens (depende do modelo)',
      'Overlap: 10-20% do chunk size',
      'Incluir metadata (source, page, section)',
      'Testar diferentes estratégias',
      'Considerar o tipo de documento'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // PROMPT ENGINEERING
  // ═══════════════════════════════════════════════════════════════════════════════
  promptEngineering: {
    systemPromptTemplate: `Você é um assistente especializado em [DOMÍNIO].

INSTRUÇÕES:
1. Use APENAS o contexto fornecido para responder
2. Se a informação não estiver no contexto, diga "Não encontrei essa informação nos documentos"
3. Cite as fontes quando possível
4. Seja conciso e direto
5. Use formatação markdown quando apropriado

CONTEXTO:
{context}

PERGUNTA DO USUÁRIO:
{question}`,

    techniques: [
      'Be specific - Instruções claras e detalhadas',
      'Role prompting - Defina um papel para o modelo',
      'Few-shot examples - Mostre exemplos do output esperado',
      'Chain of thought - Peça para explicar o raciocínio',
      'Output format - Especifique o formato (JSON, markdown, etc)',
      'Constraints - Defina limites e restrições'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // EVALUATION
  // ═══════════════════════════════════════════════════════════════════════════════
  evaluation: {
    metrics: {
      retrieval: [
        'Precision@K - % de documentos relevantes nos top K',
        'Recall@K - % de documentos relevantes encontrados',
        'MRR - Mean Reciprocal Rank',
        'NDCG - Normalized Discounted Cumulative Gain'
      ],
      generation: [
        'Faithfulness - Resposta baseada no contexto?',
        'Answer Relevancy - Resposta relevante à pergunta?',
        'Context Relevancy - Contexto relevante à pergunta?',
        'Groundedness - Resposta fundamentada nos fatos?'
      ]
    },
    tools: ['RAGAS', 'LangSmith', 'Weights & Biases', 'Custom eval scripts']
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHECKLIST
  // ═══════════════════════════════════════════════════════════════════════════════
  checklist: {
    indexing: [
      'Documentos limpos e pré-processados?',
      'Estratégia de chunking definida?',
      'Chunk size e overlap testados?',
      'Metadata incluída nos chunks?',
      'Modelo de embedding escolhido?'
    ],
    retrieval: [
      'Top-K apropriado (geralmente 3-10)?',
      'Reranking implementado?',
      'Filtros de metadata funcionando?',
      'Hybrid search considerado?'
    ],
    generation: [
      'System prompt otimizado?',
      'Temperatura apropriada?',
      'Handling de "não sei"?',
      'Citação de fontes?'
    ],
    production: [
      'Rate limiting implementado?',
      'Caching de embeddings?',
      'Monitoramento de custos?',
      'Logging de queries e respostas?',
      'Fallback para erros?'
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════
export interface RAGConfig {
  llmProvider: 'openai' | 'anthropic' | 'google';
  llmModel: string;
  embeddingModel: string;
  vectorStore: 'pinecone' | 'chroma' | 'qdrant' | 'pgvector';
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
}

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface QueryResult {
  answer: string;
  sources: Document[];
  confidence?: number;
}

export default LLM_RAG_ENGINEER_MANIFEST;
