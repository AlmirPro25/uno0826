/**
 * AI AGENTS & LANGCHAIN MANIFEST
 * Autonomous AI Agents Architect
 */

export const AI_AGENTS_LANGCHAIN_MANIFEST = {
  id: 'ai-agents-langchain',
  name: 'AI Agents & LangChain Manifest',
  version: '1.0.0',
  category: 'ai-infrastructure',

  activation: {
    keywords: [
      'langchain', 'ai agents', 'autonomous agents',
      'llm chains', 'rag', 'retrieval augmented',
      'vector store', 'embeddings', 'prompt engineering',
      'agent executor', 'tools', 'memory'
    ],
    contextTriggers: [
      'criar agente ai',
      'langchain setup',
      'rag pipeline'
    ]
  },

  philosophy: {
    core: 'Agentes autonomos amplificam capacidades humanas.',
    principles: [
      'Composabilidade de chains',
      'Memoria persistente',
      'Tools como extensoes',
      'Observabilidade total',
      'Fallbacks robustos'
    ]
  },

  frameworks: {
    langchain: {
      description: 'Framework para LLM applications',
      components: ['Chains', 'Agents', 'Memory', 'Tools', 'Retrievers']
    },
    langgraph: {
      description: 'Stateful multi-actor applications',
      useCase: 'Complex agent workflows'
    },
    llamaindex: {
      description: 'Data framework for LLM apps',
      useCase: 'RAG and data ingestion'
    }
  },

  agentTypes: {
    REACT: 'Reasoning and Acting - iterative tool use',
    PLAN_AND_EXECUTE: 'Plan first, then execute steps',
    OPENAI_FUNCTIONS: 'Native function calling',
    CONVERSATIONAL: 'Chat with memory and tools'
  },

  memoryTypes: {
    BUFFER: 'Simple conversation buffer',
    SUMMARY: 'Summarized conversation history',
    VECTOR: 'Semantic search over history',
    ENTITY: 'Track entities mentioned'
  },

  ragPipeline: {
    steps: [
      'Document Loading',
      'Text Splitting',
      'Embedding Generation',
      'Vector Store Indexing',
      'Retrieval',
      'Context Augmentation',
      'LLM Generation'
    ],
    vectorStores: ['Pinecone', 'Chroma', 'Weaviate', 'Qdrant', 'FAISS']
  },

  bestPractices: [
    'Use streaming for better UX',
    'Implement fallback chains',
    'Cache embeddings',
    'Monitor token usage',
    'Use structured outputs',
    'Implement rate limiting'
  ],

  checklist: {
    setup: ['LLM provider configured?', 'API keys secured?', 'Vector store ready?'],
    agents: ['Tools defined?', 'Memory configured?', 'Error handling?'],
    rag: ['Documents chunked?', 'Embeddings indexed?', 'Retriever tuned?'],
    production: ['Observability?', 'Rate limiting?', 'Cost monitoring?']
  },

  antiPatterns: [
    'NUNCA exponha API keys no frontend',
    'NUNCA ignore limites de tokens',
    'NUNCA confie cegamente em outputs do LLM',
    'NUNCA skip validacao de tool outputs'
  ],

  goldenRule: 'Agentes sao tao bons quanto suas tools e prompts.'
};

export default AI_AGENTS_LANGCHAIN_MANIFEST;
