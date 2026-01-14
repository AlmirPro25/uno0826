/**
 * 🔮 VECTOR DATABASES SUPREME MANIFEST
 * 
 * Manifesto completo para bancos de dados vetoriais,
 * embeddings e busca semântica.
 * 
 * @version 2.0.0
 * @author Micro-SaaS Factory
 */

export const VECTOR_DATABASES_MANIFEST = {
  id: 'vector-databases-supreme',
  name: 'Vector Databases Supreme Master',
  version: '2.0.0',
  category: 'ai-infrastructure',
  
  activation: {
    keywords: [
      'vector database', 'vectordb', 'vector store',
      'pinecone', 'weaviate', 'qdrant', 'milvus', 'chroma',
      'pgvector', 'faiss', 'embeddings', 'semantic search',
      'similarity search', 'nearest neighbor', 'knn', 'ann',
      'cosine similarity', 'euclidean distance', 'dot product'
    ]
  },

  philosophy: {
    core: "Vetores são a linguagem universal da semântica.",
    principles: [
      "Embeddings capturam significado, não apenas palavras",
      "Escolha o modelo de embedding certo para seu domínio",
      "Índices ANN trocam precisão por velocidade",
      "Metadata filtering é tão importante quanto similarity",
      "Dimensionalidade afeta performance e custo"
    ]
  },

  fundamentals: {
    whatAreEmbeddings: {
      description: "Representações numéricas de dados em espaço vetorial",
      dimensions: "Tipicamente 384, 768, 1536, ou 3072 dimensões",
      property: "Itens semanticamente similares ficam próximos no espaço"
    },
    
    distanceMetrics: {
      cosine: {
        description: "Ângulo entre vetores (ignora magnitude)",
        formula: "1 - (A·B)/(||A||×||B||)",
        bestFor: "Texto, quando magnitude não importa",
        range: "[0, 2] onde 0 = idêntico"
      },
      euclidean: {
        description: "Distância em linha reta",
        formula: "√Σ(Ai-Bi)²",
        bestFor: "Quando magnitude importa",
        range: "[0, ∞)"
      },
      dotProduct: {
        description: "Produto escalar (requer normalização)",
        formula: "Σ(Ai×Bi)",
        bestFor: "Vetores normalizados, mais rápido",
        range: "[-1, 1] para normalizados"
      }
    },
    
    indexTypes: {
      flat: {
        description: "Busca exata (brute force)",
        pros: "100% precisão",
        cons: "O(n) - lento para grandes datasets",
        useCase: "Datasets pequenos (<10K)"
      },
      ivf: {
        description: "Inverted File Index - clusters de vetores",
        pros: "Bom balance precisão/velocidade",
        cons: "Precisa treinar, recall não é 100%",
        useCase: "Datasets médios (10K-1M)"
      },
      hnsw: {
        description: "Hierarchical Navigable Small World",
        pros: "Muito rápido, bom recall",
        cons: "Usa mais memória",
        useCase: "Datasets grandes, baixa latência"
      },
      pq: {
        description: "Product Quantization - compressão",
        pros: "Muito eficiente em memória",
        cons: "Menor precisão",
        useCase: "Datasets enormes com restrição de memória"
      }
    }
  },

  embeddingModels: {
    openai: {
      models: {
        'text-embedding-3-small': {
          dimensions: 1536,
          maxTokens: 8191,
          price: '$0.02/1M tokens',
          performance: 'Bom custo-benefício'
        },
        'text-embedding-3-large': {
          dimensions: 3072,
          maxTokens: 8191,
          price: '$0.13/1M tokens',
          performance: 'Melhor qualidade'
        }
      },
      example: `
import OpenAI from 'openai';

const openai = new OpenAI();

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}
`
    },
    
    cohere: {
      models: {
        'embed-english-v3.0': { dimensions: 1024, languages: 'English' },
        'embed-multilingual-v3.0': { dimensions: 1024, languages: '100+' }
      },
      features: ['Input types (search_document, search_query)', 'Compression']
    },
    
    huggingface: {
      models: {
        'sentence-transformers/all-MiniLM-L6-v2': {
          dimensions: 384,
          speed: 'Muito rápido',
          quality: 'Boa para uso geral'
        },
        'BAAI/bge-large-en-v1.5': {
          dimensions: 1024,
          speed: 'Médio',
          quality: 'Estado da arte'
        },
        'intfloat/e5-large-v2': {
          dimensions: 1024,
          speed: 'Médio',
          quality: 'Excelente para retrieval'
        }
      },
      localExample: `
import { pipeline } from '@xenova/transformers';

const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

async function getEmbedding(text: string): Promise<number[]> {
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
`
    }
  },

  databases: {
    pinecone: {
      type: 'Managed Cloud',
      pricing: 'Serverless: $0.33/1M queries + storage',
      strengths: [
        'Totalmente gerenciado',
        'Serverless (escala automática)',
        'Namespaces para multi-tenancy',
        'Metadata filtering poderoso'
      ],
      
      setup: `
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Criar índice
await pinecone.createIndex({
  name: 'my-index',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-east-1',
    },
  },
});

const index = pinecone.index('my-index');
`,
      
      operations: `
// Upsert
await index.namespace('products').upsert([
  {
    id: 'product-1',
    values: embedding,
    metadata: {
      category: 'electronics',
      price: 299.99,
      inStock: true,
    },
  },
]);

// Query com filtro
const results = await index.namespace('products').query({
  vector: queryEmbedding,
  topK: 10,
  filter: {
    category: { $eq: 'electronics' },
    price: { $lt: 500 },
    inStock: { $eq: true },
  },
  includeMetadata: true,
});

// Delete
await index.namespace('products').deleteMany({
  filter: { category: { $eq: 'discontinued' } },
});
`
    },
    
    qdrant: {
      type: 'Open Source / Cloud',
      pricing: 'Self-hosted: Free | Cloud: $0.025/hr',
      strengths: [
        'Rust performance',
        'Filtros avançados',
        'Payload storage',
        'Quantização built-in'
      ],
      
      setup: `
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

// Criar collection
await client.createCollection('products', {
  vectors: {
    size: 1536,
    distance: 'Cosine',
  },
  optimizers_config: {
    indexing_threshold: 20000,
  },
  quantization_config: {
    scalar: { type: 'int8', quantile: 0.99, always_ram: true },
  },
});
`,
      
      operations: `
// Upsert
await client.upsert('products', {
  points: [
    {
      id: 'product-1',
      vector: embedding,
      payload: {
        name: 'Laptop Pro',
        category: 'electronics',
        price: 1299.99,
        tags: ['laptop', 'professional'],
      },
    },
  ],
});

// Query com filtros complexos
const results = await client.search('products', {
  vector: queryEmbedding,
  limit: 10,
  filter: {
    must: [
      { key: 'category', match: { value: 'electronics' } },
      { key: 'price', range: { lte: 1500 } },
    ],
    should: [
      { key: 'tags', match: { any: ['laptop', 'tablet'] } },
    ],
  },
  with_payload: true,
});
`
    },
    
    weaviate: {
      type: 'Open Source / Cloud',
      pricing: 'Self-hosted: Free | Cloud: Usage-based',
      strengths: [
        'GraphQL API',
        'Módulos de ML integrados',
        'Hybrid search (vector + keyword)',
        'Multi-modal (texto, imagem)'
      ],
      
      setup: `
import weaviate from 'weaviate-ts-client';

const client = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_HOST!,
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
  headers: {
    'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY!,
  },
});

// Criar schema
await client.schema.classCreator().withClass({
  class: 'Product',
  vectorizer: 'text2vec-openai',
  moduleConfig: {
    'text2vec-openai': {
      model: 'text-embedding-3-small',
    },
  },
  properties: [
    { name: 'name', dataType: ['text'] },
    { name: 'description', dataType: ['text'] },
    { name: 'price', dataType: ['number'] },
  ],
}).do();
`,
      
      operations: `
// Insert (vetorização automática)
await client.data.creator()
  .withClassName('Product')
  .withProperties({
    name: 'Laptop Pro',
    description: 'High-performance laptop for professionals',
    price: 1299.99,
  })
  .do();

// Hybrid search
const results = await client.graphql.get()
  .withClassName('Product')
  .withHybrid({
    query: 'professional laptop',
    alpha: 0.5, // 0 = keyword, 1 = vector
  })
  .withLimit(10)
  .withFields('name description price _additional { score }')
  .do();
`
    },
    
    chroma: {
      type: 'Open Source',
      pricing: 'Free (self-hosted)',
      strengths: [
        'Simples de usar',
        'Ótimo para desenvolvimento',
        'Integração LangChain nativa',
        'Persistência local'
      ],
      
      setup: `
import { ChromaClient } from 'chromadb';

const client = new ChromaClient({ path: 'http://localhost:8000' });

// Criar collection
const collection = await client.createCollection({
  name: 'products',
  metadata: { 'hnsw:space': 'cosine' },
});
`,
      
      operations: `
// Add
await collection.add({
  ids: ['product-1', 'product-2'],
  embeddings: [embedding1, embedding2],
  metadatas: [
    { category: 'electronics', price: 299 },
    { category: 'clothing', price: 49 },
  ],
  documents: ['Laptop description', 'T-shirt description'],
});

// Query
const results = await collection.query({
  queryEmbeddings: [queryEmbedding],
  nResults: 10,
  where: { category: 'electronics' },
  include: ['documents', 'metadatas', 'distances'],
});
`
    },
    
    pgvector: {
      type: 'PostgreSQL Extension',
      pricing: 'Free (usa seu Postgres existente)',
      strengths: [
        'Usa infraestrutura existente',
        'SQL familiar',
        'ACID transactions',
        'Joins com outras tabelas'
      ],
      
      setup: `
-- Habilitar extensão
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar tabela
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10,2),
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar índice HNSW
CREATE INDEX ON products 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
`,
      
      operations: `
-- Insert
INSERT INTO products (name, description, category, price, embedding)
VALUES (
  'Laptop Pro',
  'High-performance laptop',
  'electronics',
  1299.99,
  '[0.1, 0.2, ...]'::vector
);

-- Query com filtro
SELECT 
  id, name, description, price,
  1 - (embedding <=> $1::vector) as similarity
FROM products
WHERE category = 'electronics'
  AND price < 1500
ORDER BY embedding <=> $1::vector
LIMIT 10;

-- Hybrid search (com pg_trgm)
SELECT * FROM products
WHERE 
  (embedding <=> $1::vector) < 0.3
  OR name % $2  -- trigram similarity
ORDER BY 
  (embedding <=> $1::vector) * 0.7 + 
  (1 - similarity(name, $2)) * 0.3
LIMIT 10;
`
    }
  },

  patterns: {
    chunking: {
      description: "Dividir documentos grandes em chunks para embedding",
      strategies: {
        fixedSize: {
          description: "Chunks de tamanho fixo",
          params: "chunkSize: 500-1000 tokens, overlap: 50-200 tokens",
          pros: "Simples, previsível",
          cons: "Pode cortar contexto"
        },
        recursive: {
          description: "Divide por separadores hierárquicos",
          separators: ["\\n\\n", "\\n", ". ", " "],
          pros: "Respeita estrutura",
          cons: "Chunks de tamanho variável"
        },
        semantic: {
          description: "Divide por similaridade semântica",
          pros: "Chunks coerentes",
          cons: "Mais lento, complexo"
        }
      },
      
      example: `
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\\n\\n', '\\n', '. ', ' '],
});

const chunks = await splitter.splitText(document);
`
    },
    
    hybridSearch: {
      description: "Combinar busca vetorial com keyword search",
      why: "Vetores capturam semântica, keywords capturam termos exatos",
      
      implementation: `
// Hybrid search com Reciprocal Rank Fusion
async function hybridSearch(query: string, k: number = 10) {
  // Busca vetorial
  const vectorResults = await vectorStore.similaritySearch(query, k * 2);
  
  // Busca por keyword (BM25 ou similar)
  const keywordResults = await elasticSearch.search({
    query: { match: { content: query } },
    size: k * 2,
  });
  
  // Reciprocal Rank Fusion
  const scores = new Map<string, number>();
  const K = 60; // Constante RRF
  
  vectorResults.forEach((doc, rank) => {
    const score = 1 / (K + rank + 1);
    scores.set(doc.id, (scores.get(doc.id) || 0) + score);
  });
  
  keywordResults.forEach((doc, rank) => {
    const score = 1 / (K + rank + 1);
    scores.set(doc.id, (scores.get(doc.id) || 0) + score);
  });
  
  // Ordenar por score combinado
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, k);
}
`
    },
    
    reranking: {
      description: "Re-ordenar resultados com modelo mais preciso",
      why: "Bi-encoders são rápidos mas menos precisos que cross-encoders",
      
      implementation: `
import Cohere from 'cohere-ai';

const cohere = new Cohere.Client({ token: process.env.COHERE_API_KEY });

async function searchWithRerank(query: string, k: number = 10) {
  // Fase 1: Busca rápida (over-fetch)
  const candidates = await vectorStore.similaritySearch(query, k * 3);
  
  // Fase 2: Rerank com cross-encoder
  const reranked = await cohere.rerank({
    model: 'rerank-english-v3.0',
    query,
    documents: candidates.map(c => c.pageContent),
    topN: k,
  });
  
  return reranked.results.map(r => ({
    document: candidates[r.index],
    relevanceScore: r.relevanceScore,
  }));
}
`
    },
    
    multiTenancy: {
      description: "Isolar dados de diferentes clientes",
      strategies: {
        namespaces: "Pinecone namespaces, Qdrant collections",
        metadataFilter: "Filtrar por tenant_id em cada query",
        separateIndexes: "Um índice por tenant (mais isolamento)"
      },
      
      example: `
// Usando namespaces (Pinecone)
const tenantNamespace = index.namespace(\`tenant-\${tenantId}\`);
await tenantNamespace.upsert(vectors);
const results = await tenantNamespace.query({ vector, topK: 10 });

// Usando metadata filter
await index.upsert([
  { id: 'doc-1', values: embedding, metadata: { tenantId: 'tenant-123' } },
]);

const results = await index.query({
  vector: queryEmbedding,
  topK: 10,
  filter: { tenantId: { $eq: currentTenantId } },
});
`
    }
  },

  optimization: {
    dimensionReduction: {
      description: "Reduzir dimensões para economizar espaço/custo",
      techniques: ['PCA', 'Matryoshka embeddings', 'Quantização'],
      
      example: `
// OpenAI text-embedding-3 suporta dimensões menores
const response = await openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: text,
  dimensions: 1024, // Reduzido de 3072
});
`
    },
    
    batching: {
      description: "Processar embeddings em lotes",
      
      example: `
async function batchEmbed(texts: string[], batchSize = 100) {
  const embeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });
    embeddings.push(...response.data.map(d => d.embedding));
  }
  
  return embeddings;
}
`
    },
    
    caching: {
      description: "Cache de embeddings para queries frequentes",
      
      example: `
import { Redis } from 'ioredis';

const redis = new Redis();

async function getCachedEmbedding(text: string): Promise<number[]> {
  const cacheKey = \`embedding:\${hashText(text)}\`;
  
  // Tentar cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Gerar embedding
  const embedding = await getEmbedding(text);
  
  // Cachear por 24h
  await redis.setex(cacheKey, 86400, JSON.stringify(embedding));
  
  return embedding;
}
`
    }
  },

  comparison: {
    table: `
| Feature          | Pinecone | Qdrant  | Weaviate | Chroma | pgvector |
|------------------|----------|---------|----------|--------|----------|
| Managed          | ✅       | ✅/Self | ✅/Self  | Self   | Self     |
| Serverless       | ✅       | ❌      | ❌       | ❌     | ❌       |
| Hybrid Search    | ❌       | ✅      | ✅       | ❌     | ✅       |
| Multi-modal      | ❌       | ✅      | ✅       | ❌     | ❌       |
| Quantization     | ❌       | ✅      | ✅       | ❌     | ❌       |
| SQL Integration  | ❌       | ❌      | ❌       | ❌     | ✅       |
| Free Tier        | ✅       | ✅      | ✅       | ✅     | ✅       |
| Best For         | Prod     | Perf    | Features | Dev    | Postgres |
`
  },

  bestPractices: [
    "Escolha modelo de embedding adequado ao domínio",
    "Use chunking com overlap para manter contexto",
    "Implemente hybrid search para melhor recall",
    "Use reranking para resultados mais precisos",
    "Cache embeddings de queries frequentes",
    "Monitore latência e custos em produção",
    "Teste diferentes métricas de distância",
    "Use metadata filtering para reduzir search space"
  ],

  antiPatterns: [
    "Embeddings de textos muito longos sem chunking",
    "Ignorar metadata filtering (busca em tudo)",
    "Não normalizar vetores quando necessário",
    "Usar flat index para datasets grandes",
    "Não implementar retry para APIs de embedding",
    "Armazenar embeddings sem o texto original"
  ],

  checklist: {
    setup: [
      "Modelo de embedding escolhido?",
      "Vector database selecionado?",
      "Índice criado com métrica correta?",
      "Estratégia de chunking definida?"
    ],
    production: [
      "Batching implementado?",
      "Caching de embeddings?",
      "Monitoring de latência?",
      "Backup de dados?"
    ]
  }
};

export default VECTOR_DATABASES_MANIFEST;
