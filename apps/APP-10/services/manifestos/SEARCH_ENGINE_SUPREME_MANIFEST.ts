/**
 * 🔍 SEARCH ENGINE SUPREME MANIFEST
 * 
 * Manifesto do Mestre Supremo em Search Engines
 * Especialista em Google, Microsoft Bing e Apple Search
 * 
 * Domínios: Crawling, Indexing, Retrieval, Ranking, RAG
 */

// ============================================================================
// MANIFESTO PRINCIPAL
// ============================================================================

export const SEARCH_ENGINE_SUPREME_MANIFEST = {
  id: 'search-engine-supreme-master',
  name: 'Search Engine Supreme Master',
  version: '1.0.0',
  
  description: `
    Mestre Supremo em Search Engines - especialista absoluto em:
    - Arquitetar motores de busca de escala planetária
    - Dominar os algoritmos do Google, Bing e Apple
    - Projetar sistemas de retrieval híbrido (lexical + semântico)
    - Implementar ranking neural com transformers
    - Construir knowledge graphs e entity linking
  `,
  
  philosophy: {
    central: "A busca perfeita entende a intenção antes mesmo de você terminar de digitar.",
    truths: [
      "Relevância é Rei - O melhor resultado é o que resolve o problema do usuário",
      "Velocidade é Vida - Latência > 200ms = usuários perdidos",
      "Escala é Destino - Se não escala para bilhões, não é search engine"
    ]
  },
  
  activation: {
    keywords: [
      'search engine', 'motor de busca', 'buscador',
      'google search', 'pagerank', 'bert', 'mum',
      'bing', 'microsoft search', 'copilot search',
      'apple spotlight', 'siri search', 'apple intelligence',
      'indexação', 'crawling', 'ranking', 'retrieval',
      'information retrieval', 'ir', 'recuperação de informação',
      'web crawling', 'spider', 'bot',
      'inverted index', 'índice invertido',
      'bm25', 'tf-idf', 'vector search', 'dense retrieval',
      'learning to rank', 'ltr', 'lambdamart',
      'query understanding', 'intent classification',
      'knowledge graph', 'entity recognition',
      'seo', 'search optimization', 'serp',
      'neural search', 'semantic search', 'hybrid search'
    ]
  }
};


// ============================================================================
// GIGANTES DA BUSCA
// ============================================================================

export const SEARCH_GIANTS = {
  google: {
    name: 'Google Search',
    founded: 1998,
    marketShare: '92%',
    
    timeline: {
      '1998': 'PageRank - Fundação',
      '2000-2010': 'GFS, MapReduce, BigTable, Caffeine',
      '2011': 'Panda - Qualidade de conteúdo',
      '2012': 'Penguin - Anti-spam, Knowledge Graph',
      '2013': 'Hummingbird - Busca semântica',
      '2015': 'RankBrain - Primeiro ML em ranking',
      '2018': 'BERT - Compreensão bidirecional',
      '2021': 'MUM - Multimodal, multilíngue',
      '2023': 'SGE/AI Overviews - Respostas generativas',
      '2024-2025': 'Gemini integration'
    },
    
    technologies: [
      'PageRank', 'Colossus', 'Caffeine', 'Hummingbird',
      'RankBrain', 'BERT', 'MUM', 'Neural Matching',
      'Passage Ranking', 'Knowledge Graph'
    ],
    
    strengths: [
      'Maior índice da web (centenas de bilhões de páginas)',
      'Décadas de dados de click/query',
      'TPUs para ML em escala',
      'Inventaram Transformer (2017)',
      'Knowledge Graph com 500+ bilhões de fatos',
      'Ecossistema (Chrome, Android, Gmail, Maps, YouTube)'
    ]
  },
  
  microsoft: {
    name: 'Microsoft Bing',
    founded: 2009,
    marketShare: '3-4%',
    
    timeline: {
      '2009': 'Lançamento (rebrand do Live Search)',
      '2010': 'Yahoo! Search partnership',
      '2012': 'Satori Knowledge Graph',
      '2016-2022': 'Turing models, BERT integration',
      '2023': 'Bing Chat (GPT-4) - Fevereiro',
      '2024': 'Copilot rebrand, Deep Search'
    },
    
    technologies: [
      'Satori', 'Turing-NLG', 'SPTAG', 'Prometheus',
      'GPT-4 integration', 'Deep Search'
    ],
    
    strengths: [
      'Parceria exclusiva com OpenAI',
      'Primeiro a integrar LLM em busca',
      'Integração enterprise (Microsoft 365)',
      'Dados únicos (LinkedIn, GitHub)',
      'Microsoft Research'
    ]
  },
  
  apple: {
    name: 'Apple Search (Spotlight/Siri)',
    founded: 2004,
    
    timeline: {
      '2004': 'Spotlight - Mac OS X Tiger',
      '2011': 'Siri - Busca por voz',
      '2014': 'Spotlight iOS',
      '2018-2023': 'On-device ML, Neural Engine',
      '2024-2025': 'Apple Intelligence'
    },
    
    technologies: [
      'Applebot', 'Core ML', 'Natural Language framework',
      'App Intents', 'Apple Intelligence', 'Private Cloud Compute'
    ],
    
    strengths: [
      'Privacidade by design',
      'On-device processing (Neural Engine)',
      'Differential privacy',
      'Controle do dispositivo (Safari, iOS)',
      'Usuários premium de alta qualidade'
    ]
  }
};

// ============================================================================
// ALGORITMOS FUNDAMENTAIS
// ============================================================================

export const CORE_ALGORITHMS = {
  pagerank: {
    name: 'PageRank',
    year: 1998,
    authors: ['Larry Page', 'Sergey Brin'],
    paper: 'The Anatomy of a Large-Scale Hypertextual Web Search Engine',
    description: 'Mede importância de páginas baseado em links',
    formula: 'PR(A) = (1-d)/N + d * Σ(PR(Ti)/C(Ti))',
    variants: ['TrustRank', 'Topic-Sensitive PageRank', 'Personalized PageRank']
  },
  
  bm25: {
    name: 'BM25 (Best Matching 25)',
    year: 1994,
    authors: ['Stephen Robertson'],
    description: 'Função de ranking probabilística',
    parameters: {
      k1: { default: 1.5, range: '1.2-2.0', purpose: 'Saturação de TF' },
      b: { default: 0.75, range: '0-1', purpose: 'Normalização por tamanho' }
    },
    variants: ['BM25F', 'BM25+']
  },
  
  tfidf: {
    name: 'TF-IDF',
    year: 1972,
    description: 'Term Frequency - Inverse Document Frequency',
    formula: 'TF-IDF(t,d) = TF(t,d) * log(N/DF(t))'
  },
  
  denseRetrieval: {
    name: 'Dense Passage Retrieval (DPR)',
    year: 2020,
    authors: ['Facebook AI'],
    description: 'Bi-encoder para retrieval semântico',
    models: ['DPR', 'ColBERT', 'E5', 'BGE']
  },
  
  lambdamart: {
    name: 'LambdaMART',
    year: 2010,
    authors: ['Microsoft Research'],
    description: 'Learning to Rank com gradient boosting',
    optimizes: 'NDCG diretamente via gradientes lambda'
  },
  
  hybridRetrieval: {
    name: 'Hybrid Retrieval',
    description: 'Combina BM25 (lexical) + Dense (semântico)',
    fusion: 'Reciprocal Rank Fusion (RRF)',
    formula: 'score(d) = Σ 1/(k + rank_i(d))'
  }
};

// ============================================================================
// ARQUITETURA DE SEARCH ENGINE
// ============================================================================

export const SEARCH_ARCHITECTURE = {
  layers: [
    {
      name: 'Crawling Layer',
      components: ['URL Frontier', 'Fetcher', 'Parser', 'Dedup'],
      technologies: ['Scrapy', 'Playwright', 'Apache Nutch'],
      concerns: ['Politeness', 'Distributed scheduling', 'Freshness']
    },
    {
      name: 'Processing Pipeline',
      components: ['Language Detection', 'Entity Extraction', 'Quality Scoring', 'Embedding Generation'],
      technologies: ['Apache Beam', 'spaCy', 'Trafilatura'],
      concerns: ['Content extraction', 'NER', 'Spam classification']
    },
    {
      name: 'Indexing Layer',
      components: ['Inverted Index', 'Vector Index', 'Knowledge Graph'],
      technologies: ['Elasticsearch', 'FAISS', 'Neo4j'],
      concerns: ['Posting lists', 'Field-specific indices', 'Tiered indexing']
    },
    {
      name: 'Query Understanding',
      components: ['Tokenizer', 'Intent Classifier', 'Entity Linking', 'Query Expansion'],
      technologies: ['SentencePiece', 'BERT classifiers'],
      concerns: ['Spell correction', 'Intent detection', 'Query rewriting']
    },
    {
      name: 'Retrieval (Recall)',
      components: ['BM25', 'Dense ANN', 'Hybrid Fusion'],
      technologies: ['Elasticsearch', 'FAISS', 'ScaNN'],
      concerns: ['Lexical matching', 'Semantic matching', 'RRF fusion']
    },
    {
      name: 'Ranking (Precision)',
      components: ['Light Ranker', 'Neural Re-ranker', 'Result Blending'],
      technologies: ['XGBoost', 'Cross-encoders', 'MMR'],
      concerns: ['Feature engineering', 'Diversity', 'Personalization']
    },
    {
      name: 'Generation Layer',
      components: ['Passage Selection', 'LLM Synthesis', 'Grounding', 'Citation'],
      technologies: ['Gemini', 'GPT-4', 'LangChain'],
      concerns: ['RAG', 'Fact verification', 'Hallucination mitigation']
    }
  ]
};


// ============================================================================
// STACK TECNOLÓGICO MODERNO (SE O GOOGLE NASCESSE HOJE)
// ============================================================================

export const MODERN_TECH_STACK = {
  crawling: {
    framework: ['Scrapy', 'Playwright', 'Colly (Go)'],
    scheduler: 'Apache Kafka',
    storage: 'S3/MinIO',
    dedup: 'SimHash + MinHash'
  },
  
  processing: {
    pipeline: ['Apache Beam', 'Apache Spark', 'Dask'],
    nlp: {
      tokenization: ['SentencePiece', 'tiktoken'],
      ner: ['spaCy', 'Flair', 'GLiNER'],
      languageDetection: 'fastText'
    },
    quality: {
      spamDetection: 'Custom BERT classifier',
      contentExtraction: ['Trafilatura', 'Readability']
    }
  },
  
  indexing: {
    invertedIndex: {
      engine: ['Lucene', 'Tantivy (Rust)'],
      deployment: ['Elasticsearch', 'OpenSearch', 'Meilisearch']
    },
    vectorIndex: {
      library: ['FAISS', 'ScaNN', 'Milvus'],
      algorithm: ['HNSW', 'IVF-PQ']
    },
    knowledgeGraph: {
      database: ['Neo4j', 'Amazon Neptune'],
      format: ['RDF', 'Property Graph']
    }
  },
  
  retrieval: {
    lexical: 'BM25 via Elasticsearch',
    semantic: {
      encoder: ['E5-large', 'BGE-large', 'Cohere Embed'],
      index: 'FAISS IVF-PQ'
    },
    hybrid: 'RRF fusion'
  },
  
  ranking: {
    stage1: {
      algorithm: 'LambdaMART',
      framework: ['XGBoost', 'LightGBM']
    },
    stage2: {
      model: 'cross-encoder/ms-marco-MiniLM-L-12-v2',
      serving: ['Triton', 'vLLM']
    },
    stage3: {
      diversity: 'MMR',
      personalization: 'User embedding similarity'
    }
  },
  
  generation: {
    llm: ['Gemini 1.5 Pro', 'GPT-4', 'Claude 3'],
    ragFramework: ['LangChain', 'LlamaIndex'],
    serving: ['vLLM', 'TensorRT-LLM']
  },
  
  infrastructure: {
    compute: 'Kubernetes (GKE/EKS)',
    storage: ['GCS/S3', 'BigQuery/Redshift'],
    cache: 'Redis Cluster',
    monitoring: ['Prometheus', 'Grafana']
  },
  
  languages: {
    crawling: 'Python',
    indexing: ['Rust', 'C++'],
    serving: ['Go', 'Rust'],
    ml: 'Python (PyTorch)',
    frontend: 'TypeScript (React/Next.js)'
  }
};

// ============================================================================
// MODELOS DE EMBEDDING RECOMENDADOS
// ============================================================================

export const EMBEDDING_MODELS = {
  tier1_stateOfTheArt: [
    {
      name: 'voyage-3',
      provider: 'Voyage AI',
      dimensions: 1024,
      maxTokens: 32000,
      mtebScore: 67.28,
      useCase: 'Best overall quality'
    },
    {
      name: 'text-embedding-3-large',
      provider: 'OpenAI',
      dimensions: 3072,
      maxTokens: 8191,
      mtebScore: 64.59,
      useCase: 'Production, API-based'
    }
  ],
  
  tier2_openSource: [
    {
      name: 'bge-large-en-v1.5',
      provider: 'BAAI',
      dimensions: 1024,
      maxTokens: 512,
      mtebScore: 64.23,
      useCase: 'Best open source'
    },
    {
      name: 'e5-large-v2',
      provider: 'Microsoft',
      dimensions: 1024,
      maxTokens: 512,
      mtebScore: 62.68,
      useCase: 'Multilingual'
    },
    {
      name: 'gte-large',
      provider: 'Alibaba',
      dimensions: 1024,
      maxTokens: 512,
      mtebScore: 63.13,
      useCase: 'General purpose'
    }
  ],
  
  tier3_efficient: [
    {
      name: 'all-MiniLM-L6-v2',
      provider: 'Sentence Transformers',
      dimensions: 384,
      maxTokens: 256,
      mtebScore: 56.26,
      useCase: 'Fast, lightweight'
    },
    {
      name: 'bge-small-en-v1.5',
      provider: 'BAAI',
      dimensions: 384,
      maxTokens: 512,
      mtebScore: 62.17,
      useCase: 'Best small model'
    }
  ],
  
  tier4_multilingual: [
    {
      name: 'multilingual-e5-large',
      provider: 'Microsoft',
      dimensions: 1024,
      maxTokens: 512,
      languages: 100,
      useCase: 'Cross-lingual retrieval'
    }
  ]
};

// ============================================================================
// MÉTRICAS DE AVALIAÇÃO
// ============================================================================

export const EVALUATION_METRICS = {
  offline: {
    precisionAtK: {
      name: 'Precision@k',
      formula: '|relevant ∩ retrieved[:k]| / k',
      interpretation: 'Fração dos top-k que são relevantes'
    },
    recallAtK: {
      name: 'Recall@k',
      formula: '|relevant ∩ retrieved[:k]| / |relevant|',
      interpretation: 'Fração dos relevantes no top-k'
    },
    mrr: {
      name: 'Mean Reciprocal Rank',
      formula: '1 / rank_of_first_relevant',
      interpretation: 'Inverso da posição do primeiro relevante'
    },
    map: {
      name: 'Mean Average Precision',
      formula: '(1/|relevant|) * Σ P@k * rel(k)',
      interpretation: 'Média das precisões em posições relevantes'
    },
    ndcg: {
      name: 'Normalized Discounted Cumulative Gain',
      formula: 'DCG@k / IDCG@k',
      interpretation: 'Considera graus de relevância'
    }
  },
  
  online: {
    ctr: {
      name: 'Click-Through Rate',
      formula: 'clicks / impressions',
      goodRange: '0.02 - 0.10'
    },
    dwellTime: {
      name: 'Dwell Time',
      formula: 'time_on_page after click',
      goodRange: '> 30 seconds'
    },
    bounceRate: {
      name: 'Bounce Rate',
      formula: 'single_page_sessions / total_sessions',
      goodRange: '< 0.40'
    },
    queryReformulationRate: {
      name: 'Query Reformulation Rate',
      formula: 'sessions_with_reformulation / total_sessions',
      goodRange: '< 0.30'
    },
    latencyP50: {
      name: 'Latency P50',
      formula: 'median(response_time)',
      goodRange: '< 200ms'
    }
  },
  
  benchmarks: [
    { name: 'MS MARCO', type: 'Passage/Document Ranking', size: '8.8M passages' },
    { name: 'BEIR', type: 'Zero-shot evaluation', size: '18 datasets' },
    { name: 'TREC', type: 'Academic benchmark', size: 'Multiple tracks' },
    { name: 'MTEB', type: 'Embedding benchmark', size: '56 datasets' },
    { name: 'Natural Questions', type: 'QA', size: '300K+ questions' }
  ]
};

// ============================================================================
// PAPERS FUNDAMENTAIS
// ============================================================================

export const SEMINAL_PAPERS = {
  foundations: [
    {
      title: 'The Anatomy of a Large-Scale Hypertextual Web Search Engine',
      authors: ['Brin', 'Page'],
      year: 1998,
      contribution: 'Fundação do Google, PageRank'
    },
    {
      title: 'Okapi at TREC-3',
      authors: ['Robertson et al.'],
      year: 1994,
      contribution: 'BM25'
    }
  ],
  
  learningToRank: [
    {
      title: 'From RankNet to LambdaRank to LambdaMART',
      authors: ['Burges'],
      year: 2010,
      contribution: 'Evolução de LTR'
    }
  ],
  
  neuralRetrieval: [
    {
      title: 'BERT: Pre-training of Deep Bidirectional Transformers',
      authors: ['Devlin et al.'],
      year: 2018,
      contribution: 'Revolucionou NLP e search'
    },
    {
      title: 'Dense Passage Retrieval for Open-Domain QA',
      authors: ['Karpukhin et al.'],
      year: 2020,
      contribution: 'DPR, bi-encoder'
    },
    {
      title: 'ColBERT: Efficient and Effective Passage Search',
      authors: ['Khattab', 'Zaharia'],
      year: 2020,
      contribution: 'Late interaction'
    },
    {
      title: 'Attention Is All You Need',
      authors: ['Vaswani et al.'],
      year: 2017,
      contribution: 'Transformer architecture'
    }
  ],
  
  rag: [
    {
      title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP',
      authors: ['Lewis et al.'],
      year: 2020,
      contribution: 'RAG original'
    }
  ]
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default SEARCH_ENGINE_SUPREME_MANIFEST;

// Helper functions
export function getSearchGiant(name: 'google' | 'microsoft' | 'apple') {
  return SEARCH_GIANTS[name];
}

export function getAlgorithm(name: string) {
  return CORE_ALGORITHMS[name as keyof typeof CORE_ALGORITHMS];
}

export function getEmbeddingModel(tier: 'tier1' | 'tier2' | 'tier3' | 'tier4') {
  const tierMap = {
    tier1: EMBEDDING_MODELS.tier1_stateOfTheArt,
    tier2: EMBEDDING_MODELS.tier2_openSource,
    tier3: EMBEDDING_MODELS.tier3_efficient,
    tier4: EMBEDDING_MODELS.tier4_multilingual
  };
  return tierMap[tier];
}

export function shouldActivateSearchManifest(query: string): boolean {
  const keywords = SEARCH_ENGINE_SUPREME_MANIFEST.activation.keywords;
  const queryLower = query.toLowerCase();
  return keywords.some(kw => queryLower.includes(kw));
}


// ============================================================================
// ANTI-SPAM E QUALIDADE DE CONTEÚDO
// ============================================================================

export const GOOGLE_QUALITY_ALGORITHMS = {
  panda: {
    year: 2011,
    target: 'Conteúdo de baixa qualidade, thin content, content farms',
    signals: ['Originalidade', 'Profundidade', 'Expertise'],
    impact: '~12% das queries afetadas',
    technique: 'Classificador de qualidade de página'
  },
  penguin: {
    year: 2012,
    target: 'Link spam, link schemes, anchor text manipulation',
    signals: ['Perfil de links não natural', 'Links comprados'],
    impact: '~3% das queries afetadas',
    technique: 'Análise de grafo de links'
  },
  hummingbird: {
    year: 2013,
    target: 'Keyword stuffing, queries conversacionais',
    signals: ['Semântica', 'Intenção', 'Contexto'],
    technique: 'Query understanding semântico'
  },
  mobilegeddon: {
    year: 2015,
    target: 'Sites não mobile-friendly',
    signals: ['Responsividade', 'Usabilidade mobile'],
    technique: 'Mobile-first indexing'
  },
  rankbrain: {
    year: 2015,
    target: 'Queries nunca vistas',
    signals: ['Embeddings de query', 'Similaridade semântica'],
    technique: 'ML para interpretação de queries'
  },
  medic_eat: {
    year: 2018,
    target: 'YMYL (Your Money Your Life) content',
    signals: ['Expertise', 'Authoritativeness', 'Trustworthiness'],
    technique: 'Quality raters + ML classifiers'
  },
  helpful_content: {
    year: 2022,
    target: 'Conteúdo criado para SEO, não para humanos',
    signals: ['People-first content', 'Originalidade'],
    technique: 'Site-wide classifier'
  },
  link_spam_update: {
    year: 2022,
    target: 'Links não naturais, guest post spam',
    signals: ['SpamBrain (neural network)'],
    technique: 'Nullifica links spam em vez de penalizar'
  },
  ai_content: {
    year: 2023,
    target: 'Conteúdo AI de baixa qualidade',
    signals: ['Originalidade', 'Valor agregado', 'Expertise humana'],
    technique: 'Detectores de AI + quality signals'
  }
};

export const EEAT_SIGNALS = {
  experience: [
    'first_person_narrative',
    'original_photos',
    'detailed_process_description',
    'real_world_examples'
  ],
  expertise: [
    'author_credentials',
    'citations_to_sources',
    'technical_accuracy',
    'depth_of_coverage'
  ],
  authoritativeness: [
    'backlinks_from_authorities',
    'mentions_in_press',
    'industry_recognition',
    'social_proof'
  ],
  trustworthiness: [
    'https_enabled',
    'privacy_policy',
    'contact_information',
    'accurate_claims',
    'transparent_authorship'
  ]
};

export const SPAM_DETECTION_FEATURES = {
  content: [
    'word_count',
    'unique_words_ratio',
    'keyword_density',
    'hidden_text_ratio',
    'ad_density'
  ],
  links: [
    'outbound_link_count',
    'affiliate_link_ratio',
    'suspicious_anchor_ratio'
  ],
  technical: [
    'redirect_chain_length',
    'cloaking_detected',
    'doorway_page_score'
  ],
  domain: [
    'domain_age_days',
    'domain_spam_history'
  ]
};

// ============================================================================
// SEO - SEARCH ENGINE OPTIMIZATION
// ============================================================================

export const SEO_RANKING_FACTORS = {
  onPage: {
    contentQuality: [
      'Relevância para a query (semântica)',
      'Profundidade e completude',
      'Originalidade (não duplicado)',
      'Freshness (atualização)',
      'E-E-A-T signals',
      'Structured data (Schema.org)'
    ],
    technicalSEO: [
      'Title tag optimization',
      'Meta description',
      'Header hierarchy (H1, H2, H3)',
      'URL structure',
      'Internal linking',
      'Image alt text',
      'Canonical tags'
    ]
  },
  offPage: {
    linkSignals: [
      'Quantidade de backlinks',
      'Qualidade/autoridade dos linking domains',
      'Relevância temática dos links',
      'Anchor text distribution',
      'Link velocity (taxa de aquisição)',
      'Diversidade de fontes'
    ],
    brandSignals: [
      'Brand searches',
      'Mentions (linked e unlinked)',
      'Social signals',
      'Reviews e ratings'
    ]
  },
  userExperience: {
    coreWebVitals: {
      LCP: { name: 'Largest Contentful Paint', target: '< 2.5s' },
      INP: { name: 'Interaction to Next Paint', target: '< 200ms' },
      CLS: { name: 'Cumulative Layout Shift', target: '< 0.1' },
      FID: { name: 'First Input Delay', target: '< 100ms' }
    },
    engagementSignals: [
      'Click-through rate (CTR)',
      'Dwell time / time on page',
      'Bounce rate',
      'Pogo-sticking (voltar ao SERP)',
      'Pages per session'
    ]
  },
  technical: [
    'Mobile-friendliness',
    'Page speed',
    'HTTPS',
    'Crawlability',
    'Indexability',
    'Site architecture',
    'XML sitemap'
  ]
};

export const SCHEMA_ORG_TYPES = [
  'Article', 'NewsArticle', 'BlogPosting',
  'Product', 'Review', 'AggregateRating',
  'Recipe', 'HowTo', 'FAQ',
  'Event', 'LocalBusiness', 'Organization',
  'Person', 'Video', 'BreadcrumbList',
  'WebSite', 'SearchAction'
];

// ============================================================================
// PERSONALIZAÇÃO E CONTEXTUALIZAÇÃO
// ============================================================================

export const PERSONALIZATION_TYPES = {
  location_based: {
    description: 'Resultados locais para queries com intenção local',
    examples: ['restaurantes', 'farmácia', 'clima'],
    signals: ['IP geolocation', 'GPS', 'search history location']
  },
  language_based: {
    description: 'Priorizar resultados no idioma do usuário',
    signals: ['browser language', 'search history language', 'location']
  },
  device_based: {
    description: 'Adaptar para mobile vs desktop',
    signals: ['user agent', 'screen size', 'touch capability']
  },
  temporal: {
    description: 'Considerar hora do dia e sazonalidade',
    examples: ['café da manhã (manhã)', 'jantar (noite)'],
    signals: ['local time', 'day of week', 'season']
  },
  behavioral: {
    description: 'Baseado em histórico de interações',
    signals: ['search history', 'click history', 'dwell time patterns'],
    privacyConcern: 'HIGH - requer consentimento'
  }
};

export const LOCAL_RANKING_FACTORS = {
  relevance: {
    weight: 0.35,
    signals: ['category_match', 'name_match', 'description_match', 'attributes_match']
  },
  distance: {
    weight: 0.25,
    signals: ['distance_from_user', 'distance_from_query_location']
  },
  prominence: {
    weight: 0.40,
    signals: [
      'review_count', 'average_rating', 'backlinks_to_website',
      'citations_in_directories', 'brand_searches', 'engagement_signals'
    ]
  }
};

// ============================================================================
// VERTICAL SEARCH (BUSCA ESPECIALIZADA)
// ============================================================================

export const VERTICAL_SEARCH_TYPES = {
  image: {
    name: 'Image Search',
    indexing: ['Visual features (CNN)', 'Metadata', 'Surrounding text'],
    retrieval: 'Visual similarity + text matching',
    technologies: ['CLIP', 'ViT', 'ResNet embeddings'],
    features: ['Reverse image search', 'Visual search'],
    players: ['Google Images', 'Bing Images', 'Pinterest']
  },
  video: {
    name: 'Video Search',
    indexing: ['Transcripts', 'Thumbnails', 'Metadata', 'Engagement'],
    retrieval: 'Text + visual + audio features',
    technologies: ['ASR (speech-to-text)', 'Video embeddings'],
    features: ['Timestamp search', 'Chapter detection'],
    players: ['YouTube', 'Bing Video', 'TikTok']
  },
  news: {
    name: 'News Search',
    indexing: ['Real-time crawling', 'Source authority'],
    retrieval: 'Freshness-weighted, topic clustering',
    technologies: ['Event detection', 'Story clustering'],
    features: ['Top Stories', 'Full Coverage'],
    players: ['Google News', 'Bing News', 'Apple News']
  },
  shopping: {
    name: 'Shopping/Product Search',
    indexing: ['Product feeds', 'Structured data', 'Reviews'],
    retrieval: 'Attribute matching, price comparison',
    technologies: ['Product knowledge graph', 'Visual search'],
    features: ['Price tracking', 'Availability', 'Reviews'],
    players: ['Google Shopping', 'Amazon', 'Bing Shopping']
  },
  academic: {
    name: 'Academic/Scholar Search',
    indexing: ['Papers', 'Citations', 'Authors', 'Institutions'],
    retrieval: 'Citation-weighted, author authority',
    technologies: ['Citation graph', 'Semantic scholar'],
    features: ['Citation count', 'h-index', 'Related papers'],
    players: ['Google Scholar', 'Semantic Scholar', 'PubMed']
  },
  jobs: {
    name: 'Job Search',
    indexing: ['Job postings', 'Company data', 'Salary info'],
    retrieval: 'Skills matching, location, salary range',
    technologies: ['Skills extraction', 'Job-candidate matching'],
    features: ['Salary estimates', 'Company reviews'],
    players: ['LinkedIn', 'Indeed', 'Google Jobs']
  },
  travel: {
    name: 'Travel Search',
    indexing: ['Flights', 'Hotels', 'Attractions', 'Reviews'],
    retrieval: 'Price optimization, availability',
    technologies: ['Price prediction', 'Demand forecasting'],
    features: ['Price alerts', 'Trip planning'],
    players: ['Google Flights/Hotels', 'Kayak', 'Booking']
  },
  code: {
    name: 'Code Search',
    indexing: ['Repositories', 'Functions', 'Documentation'],
    retrieval: 'Semantic code search, syntax-aware',
    technologies: ['Code embeddings (CodeBERT)', 'AST parsing'],
    features: ['Code snippets', 'Usage examples'],
    players: ['GitHub', 'SourceGraph', 'Google Code Search']
  }
};

// ============================================================================
// REAL-TIME INDEXING E FRESHNESS
// ============================================================================

export const REAL_TIME_INDEXING = {
  architecture: {
    sources: ['Web Crawl (batch)', 'RSS/Atom (stream)', 'Sitemaps (delta)', 'Push APIs (instant)'],
    ingestion: {
      technology: 'Apache Kafka',
      topics: ['news', 'general', 'social', 'urgent']
    },
    processing: {
      technology: 'Apache Flink / Kafka Streams',
      operations: ['Deduplication', 'Content extraction', 'Entity extraction', 'Embedding generation', 'Quality scoring']
    },
    tieredIndex: {
      hot: {
        age: '< 1 hour',
        storage: 'In-memory',
        size: '~1M docs'
      },
      warm: {
        age: '1h - 7d',
        storage: 'SSD',
        size: '~100M docs'
      },
      cold: {
        age: '> 7 days',
        storage: 'HDD/S3',
        size: '~10B docs'
      }
    },
    mergeStrategy: 'Hot → Warm (hourly), Warm → Cold (daily)'
  },
  
  latencies: {
    breakingNews: '< 1 minuto',
    newsArticles: '< 10 minutos',
    blogPosts: '< 1 hora',
    generalWeb: '< 24 horas',
    deepWeb: 'dias a semanas'
  }
};

export const FRESHNESS_SCORING = {
  qdf: {
    name: 'Query Deserves Freshness',
    description: 'Detecta se uma query merece resultados frescos',
    signals: [
      'Palavras temporais (hoje, agora, 2025)',
      'Trending topics',
      'Entidades com eventos recentes',
      'Query volume spike'
    ],
    temporalPatterns: [
      '\\b(hoje|agora|ontem|esta semana|este mês)\\b',
      '\\b(latest|recent|new|breaking|update)\\b',
      '\\b(2024|2025)\\b',
      '\\b(news|notícias|resultado|score)\\b'
    ]
  },
  
  decayFunction: {
    description: 'Exponential decay: boost = e^(-λ * age)',
    rates: {
      breakingNews: { lambda: 0.5, halfLife: '~1.4 horas' },
      news: { lambda: 0.05, halfLife: '~14 horas' },
      slightlyTimeSensitive: { lambda: 0.01, halfLife: '~3 dias' }
    }
  },
  
  maxBoost: 0.3 // 30% máximo de boost por freshness
};

// ============================================================================
// KNOWLEDGE GRAPH E ENTITY SEARCH
// ============================================================================

export const KNOWLEDGE_GRAPH = {
  entityTypes: [
    'Person', 'Organization', 'Location',
    'Event', 'Product', 'Creative Work',
    'Concept', 'Time Period', 'Quantity'
  ],
  
  relationTypes: [
    'is_a (type hierarchy)',
    'part_of (composition)',
    'located_in (geography)',
    'works_for (employment)',
    'founded_by (creation)',
    'born_in / died_in (life events)',
    'married_to (relationships)',
    'created (authorship)',
    'occurred_on (temporal)'
  ],
  
  dataSources: [
    'Wikipedia / Wikidata (estruturado)',
    'Web extraction (semi-estruturado)',
    'Structured data / Schema.org',
    'Proprietary databases',
    'User contributions'
  ],
  
  scale: {
    google: {
      facts: '500+ bilhões',
      entities: '5+ bilhões',
      sources: ['Freebase', 'Wikipedia', 'CIA Factbook', 'FDA']
    },
    microsoft: {
      name: 'Satori',
      entities: 'Bilhões',
      integration: ['LinkedIn', 'Bing']
    }
  }
};

export const ENTITY_LINKING_PIPELINE = {
  steps: [
    {
      name: 'Mention Detection (NER)',
      description: 'Identificar menções de entidades no texto',
      technologies: ['spaCy', 'Flair', 'GLiNER']
    },
    {
      name: 'Candidate Generation',
      description: 'Gerar candidatos do Knowledge Graph',
      techniques: ['String matching', 'Alias lookup', 'Embedding similarity']
    },
    {
      name: 'Entity Disambiguation',
      description: 'Escolher a entidade correta entre candidatos',
      features: [
        'Prior probability (popularidade)',
        'Context similarity',
        'Type compatibility',
        'Coherence with other entities'
      ]
    },
    {
      name: 'NIL Clustering',
      description: 'Agrupar entidades não conhecidas',
      purpose: 'Descobrir novas entidades'
    }
  ]
};

// ============================================================================
// IMPLEMENTATION ROADMAP (MVP → SCALE)
// ============================================================================

export const IMPLEMENTATION_ROADMAP = {
  phase1_mvp: {
    duration: '0-3 meses',
    objective: 'Busca funcional em 1M de páginas',
    weeks: {
      '1-2': {
        name: 'Crawling Básico',
        tasks: [
          'Scrapy + Playwright para crawling',
          'URL frontier com Redis',
          'Respeitar robots.txt',
          'Armazenar HTML em S3/MinIO'
        ],
        target: '10K páginas/dia'
      },
      '3-4': {
        name: 'Processamento',
        tasks: [
          'Extração de texto (Trafilatura)',
          'Tokenização (SentencePiece)',
          'Detecção de idioma (fastText)',
          'Deduplicação (SimHash)'
        ]
      },
      '5-6': {
        name: 'Indexação',
        tasks: [
          'Elasticsearch para índice invertido',
          'BM25 como baseline',
          'API REST básica'
        ]
      },
      '7-8': {
        name: 'Frontend + Avaliação',
        tasks: [
          'UI simples (Next.js)',
          'Métricas básicas (P@10, MRR)',
          'Dataset de teste manual'
        ]
      }
    },
    deliverables: [
      'Crawler funcional',
      'Índice de 1M páginas',
      'Busca BM25 com latência < 500ms',
      'UI básica'
    ]
  },
  
  phase2_semantic: {
    duration: '3-6 meses',
    objective: 'Hybrid retrieval com qualidade competitiva',
    months: {
      '4': {
        name: 'Dense Retrieval',
        tasks: [
          'Gerar embeddings (E5-large ou BGE)',
          'Indexar em FAISS (IVF-PQ)',
          'Hybrid retrieval (BM25 + Dense)',
          'RRF fusion'
        ]
      },
      '5': {
        name: 'Neural Re-ranking',
        tasks: [
          'Cross-encoder (ms-marco-MiniLM)',
          'Re-rank top-100 → top-10',
          'Serving com Triton/vLLM',
          'Latência < 300ms end-to-end'
        ]
      },
      '6': {
        name: 'Query Understanding',
        tasks: [
          'Spell correction',
          'Intent classification',
          'Entity extraction (NER)',
          'Query expansion'
        ]
      }
    },
    deliverables: [
      'Hybrid retrieval (BM25 + Dense)',
      'Neural re-ranking',
      'Query understanding pipeline',
      'NDCG@10 > 0.45 em MS MARCO'
    ]
  },
  
  phase3_intelligence: {
    duration: '6-12 meses',
    objective: 'Respostas generativas com citações',
    months: {
      '7-8': {
        name: 'RAG Pipeline',
        tasks: [
          'Passage selection',
          'LLM integration (Gemini/GPT-4)',
          'Grounding e fact-checking',
          'Citation generation'
        ]
      },
      '9-10': {
        name: 'Knowledge Graph',
        tasks: [
          'Entity extraction em escala',
          'Relation extraction',
          'Neo4j para storage',
          'Entity linking em queries'
        ]
      },
      '11-12': {
        name: 'Learning to Rank',
        tasks: [
          'Feature engineering',
          'LambdaMART training',
          'A/B testing framework',
          'Online learning'
        ]
      }
    },
    deliverables: [
      'AI Overviews com citações',
      'Knowledge Graph básico',
      'LTR em produção',
      'A/B testing funcional'
    ]
  },
  
  phase4_scale: {
    duration: '12-24 meses',
    objective: 'Bilhões de documentos, milhões de QPS',
    tasks: [
      'Sharding do índice (por hash de URL)',
      'Tiered indexing (hot/warm/cold)',
      'Distributed crawling (Kafka + workers)',
      'Real-time indexing (< 1 hora)',
      'Multi-region deployment',
      'Custom serving layer (C++/Rust)',
      'Personalization',
      'Vertical search (images, news, videos)'
    ]
  }
};

export const COST_STRATEGY = {
  phase1_mvp: {
    users: '0-10K',
    cost: '$50-500/mês',
    stack: {
      compute: 'Vercel/Railway/Render (PaaS) ou 1-2 VMs pequenas',
      database: 'Supabase/PlanetScale (tier gratuito)',
      cache: 'Redis gratuito (Upstash)',
      cdn: 'Cloudflare Free',
      monitoring: 'Grafana Cloud Free'
    }
  },
  phase2_growth: {
    users: '10K-100K',
    cost: '$500-5K/mês',
    stack: {
      compute: 'Kubernetes gerenciado (EKS/GKE) - 3 nodes',
      database: 'RDS/Cloud SQL (db.r5.large) + Read replicas',
      cache: 'ElastiCache/Memorystore (cache.r5.large)',
      cdn: 'Cloudflare Pro',
      monitoring: 'Grafana Cloud + Prometheus'
    }
  },
  phase3_scale: {
    users: '100K-1M',
    cost: '$5K-50K/mês',
    stack: {
      compute: 'Multi-region Kubernetes + Spot instances (70% economia)',
      database: 'Aurora/Spanner (multi-AZ) + Read replicas por região',
      cache: 'Redis Cluster (multi-node)',
      cdn: 'Cloudflare Business + Workers',
      monitoring: 'Full observability stack'
    }
  },
  phase4_millions: {
    users: '1M+',
    cost: '$50K+/mês',
    stack: {
      compute: 'Global Kubernetes federation + Reserved + Spot',
      database: 'Global database (Spanner/CockroachDB) + Sharding',
      cache: 'Global Redis com replicação',
      cdn: 'Enterprise CDN + Edge compute',
      monitoring: 'Custom observability platform'
    }
  }
};


// ============================================================================
// EXEMPLOS DE CÓDIGO - ALGORITMOS IMPLEMENTADOS
// ============================================================================

/**
 * PageRank Implementation (Conceptual TypeScript)
 * 
 * PR(A) = (1-d)/N + d * Σ(PR(Ti)/C(Ti))
 * 
 * Onde:
 * - d = damping factor (~0.85)
 * - N = número total de páginas
 * - Ti = páginas que linkam para A
 * - C(Ti) = número de links saindo de Ti
 */
export const PAGERANK_ALGORITHM = `
function pagerank(
  graph: Map<string, string[]>, 
  damping: number = 0.85, 
  iterations: number = 100,
  epsilon: number = 1e-8
): Map<string, number> {
  const N = graph.size;
  let pr = new Map<string, number>();
  
  // Inicialização uniforme
  for (const node of graph.keys()) {
    pr.set(node, 1 / N);
  }
  
  for (let iter = 0; iter < iterations; iter++) {
    const newPr = new Map<string, number>();
    
    for (const node of graph.keys()) {
      // Soma das contribuições de páginas que linkam para este nó
      let rankSum = 0;
      for (const [linkingNode, outLinks] of graph.entries()) {
        if (outLinks.includes(node)) {
          rankSum += (pr.get(linkingNode) || 0) / outLinks.length;
        }
      }
      newPr.set(node, (1 - damping) / N + damping * rankSum);
    }
    
    // Verificar convergência
    let diff = 0;
    for (const node of graph.keys()) {
      diff += Math.abs((newPr.get(node) || 0) - (pr.get(node) || 0));
    }
    if (diff < epsilon) break;
    
    pr = newPr;
  }
  
  return pr;
}
`;

/**
 * BM25 Implementation
 * 
 * score(D,Q) = Σ IDF(qi) * (f(qi,D) * (k1+1)) / (f(qi,D) + k1*(1-b+b*|D|/avgdl))
 */
export const BM25_ALGORITHM = `
class BM25 {
  private k1: number;
  private b: number;
  private corpus: string[][];
  private docLengths: number[];
  private avgdl: number;
  private N: number;
  private df: Map<string, number>;
  private idf: Map<string, number>;
  
  constructor(corpus: string[][], k1: number = 1.5, b: number = 0.75) {
    this.k1 = k1;
    this.b = b;
    this.corpus = corpus;
    this.docLengths = corpus.map(doc => doc.length);
    this.avgdl = this.docLengths.reduce((a, b) => a + b, 0) / corpus.length;
    this.N = corpus.length;
    
    // Document frequencies
    this.df = new Map();
    for (const doc of corpus) {
      for (const term of new Set(doc)) {
        this.df.set(term, (this.df.get(term) || 0) + 1);
      }
    }
    
    // IDF pre-computation
    this.idf = new Map();
    for (const [term, df] of this.df.entries()) {
      this.idf.set(term, Math.log((this.N - df + 0.5) / (df + 0.5) + 1));
    }
  }
  
  score(query: string[], docIdx: number): number {
    const doc = this.corpus[docIdx];
    const docLen = this.docLengths[docIdx];
    
    // Term frequency no documento
    const tf = new Map<string, number>();
    for (const term of doc) {
      tf.set(term, (tf.get(term) || 0) + 1);
    }
    
    let score = 0;
    for (const term of query) {
      const f = tf.get(term) || 0;
      if (f === 0) continue;
      
      const idf = this.idf.get(term) || 0;
      const numerator = f * (this.k1 + 1);
      const denominator = f + this.k1 * (1 - this.b + this.b * docLen / this.avgdl);
      score += idf * (numerator / denominator);
    }
    
    return score;
  }
  
  search(query: string[], topK: number = 10): Array<{docIdx: number, score: number}> {
    const scores = this.corpus.map((_, idx) => ({
      docIdx: idx,
      score: this.score(query, idx)
    }));
    
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}
`;

/**
 * Dense Retriever with Embeddings
 */
export const DENSE_RETRIEVER_ALGORITHM = `
class DenseRetriever {
  private embeddings: number[][];
  private docIds: string[];
  
  constructor(embeddings: number[][], docIds: string[]) {
    this.embeddings = embeddings;
    this.docIds = docIds;
  }
  
  // Cosine similarity
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  search(queryEmbedding: number[], topK: number = 10): Array<{docId: string, score: number}> {
    const scores = this.embeddings.map((docEmb, idx) => ({
      docId: this.docIds[idx],
      score: this.cosineSimilarity(queryEmbedding, docEmb)
    }));
    
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}
`;

/**
 * Hybrid Retriever with RRF Fusion
 */
export const HYBRID_RETRIEVER_ALGORITHM = `
/**
 * Reciprocal Rank Fusion (RRF)
 * score(d) = Σ 1 / (k + rank_i(d))
 */
function reciprocalRankFusion(
  rankings: string[][], 
  k: number = 60
): Array<{docId: string, score: number}> {
  const scores = new Map<string, number>();
  
  for (const ranking of rankings) {
    for (let rank = 0; rank < ranking.length; rank++) {
      const docId = ranking[rank];
      const currentScore = scores.get(docId) || 0;
      scores.set(docId, currentScore + 1 / (k + rank + 1));
    }
  }
  
  return Array.from(scores.entries())
    .map(([docId, score]) => ({ docId, score }))
    .sort((a, b) => b.score - a.score);
}

class HybridRetriever {
  private bm25: BM25;
  private denseRetriever: DenseRetriever;
  
  constructor(bm25: BM25, denseRetriever: DenseRetriever) {
    this.bm25 = bm25;
    this.denseRetriever = denseRetriever;
  }
  
  search(
    query: string[], 
    queryEmbedding: number[], 
    topK: number = 10
  ): Array<{docId: string, score: number}> {
    // BM25 retrieval
    const bm25Results = this.bm25.search(query, topK * 2)
      .map(r => r.docIdx.toString());
    
    // Dense retrieval
    const denseResults = this.denseRetriever.search(queryEmbedding, topK * 2)
      .map(r => r.docId);
    
    // RRF fusion
    const fused = reciprocalRankFusion([bm25Results, denseResults]);
    
    return fused.slice(0, topK);
  }
}
`;

/**
 * Evaluation Metrics Implementation
 */
export const EVALUATION_METRICS_CODE = `
class SearchMetrics {
  static precisionAtK(relevant: string[], retrieved: string[], k: number): number {
    const retrievedK = new Set(retrieved.slice(0, k));
    const relevantSet = new Set(relevant);
    let count = 0;
    for (const doc of retrievedK) {
      if (relevantSet.has(doc)) count++;
    }
    return count / k;
  }
  
  static recallAtK(relevant: string[], retrieved: string[], k: number): number {
    if (relevant.length === 0) return 0;
    const retrievedK = new Set(retrieved.slice(0, k));
    const relevantSet = new Set(relevant);
    let count = 0;
    for (const doc of retrievedK) {
      if (relevantSet.has(doc)) count++;
    }
    return count / relevant.length;
  }
  
  static mrr(relevant: string[], retrieved: string[]): number {
    const relevantSet = new Set(relevant);
    for (let i = 0; i < retrieved.length; i++) {
      if (relevantSet.has(retrieved[i])) {
        return 1 / (i + 1);
      }
    }
    return 0;
  }
  
  static averagePrecision(relevant: string[], retrieved: string[]): number {
    if (relevant.length === 0) return 0;
    const relevantSet = new Set(relevant);
    const precisions: number[] = [];
    let relevantCount = 0;
    
    for (let i = 0; i < retrieved.length; i++) {
      if (relevantSet.has(retrieved[i])) {
        relevantCount++;
        precisions.push(relevantCount / (i + 1));
      }
    }
    
    if (precisions.length === 0) return 0;
    return precisions.reduce((a, b) => a + b, 0) / relevant.length;
  }
  
  static ndcgAtK(relevanceScores: number[], k: number): number {
    const dcg = (scores: number[], k: number): number => {
      return scores.slice(0, k).reduce((sum, rel, i) => {
        return sum + (Math.pow(2, rel) - 1) / Math.log2(i + 2);
      }, 0);
    };
    
    const dcgScore = dcg(relevanceScores, k);
    const idealScores = [...relevanceScores].sort((a, b) => b - a);
    const idcgScore = dcg(idealScores, k);
    
    if (idcgScore === 0) return 0;
    return dcgScore / idcgScore;
  }
}
`;

// ============================================================================
// ANTI-PATTERNS A EVITAR
// ============================================================================

export const ANTI_PATTERNS = {
  retrieval: [
    {
      name: 'Confiar apenas em BM25',
      problem: 'Perde semântica, sinônimos, contexto',
      solution: 'Usar hybrid retrieval (BM25 + Dense)'
    },
    {
      name: 'Confiar apenas em Dense Retrieval',
      problem: 'Perde matches exatos, nomes próprios, termos raros',
      solution: 'Usar hybrid retrieval (BM25 + Dense)'
    },
    {
      name: 'Re-ranker em todos os documentos',
      problem: 'Muito lento, cross-encoders são O(n)',
      solution: 'Usar apenas no top-k (100-1000 docs)'
    }
  ],
  
  queryUnderstanding: [
    {
      name: 'Ignorar query understanding',
      problem: 'Spell errors, ambiguidade destroem resultados',
      solution: 'Implementar spell correction, intent classification, entity linking'
    }
  ],
  
  evaluation: [
    {
      name: 'Não ter métricas offline',
      problem: 'Impossível iterar sem avaliação',
      solution: 'Criar test suite com métricas (NDCG, MRR, MAP)'
    },
    {
      name: 'Não ter A/B testing',
      problem: 'Métricas offline não capturam tudo',
      solution: 'Implementar A/B testing com métricas online (CTR, dwell time)'
    }
  ],
  
  indexing: [
    {
      name: 'Indexar tudo igual',
      problem: 'Title, body, anchor têm importâncias diferentes',
      solution: 'Usar field-specific indices com pesos diferentes'
    },
    {
      name: 'Ignorar freshness',
      problem: 'Notícias de 2020 para query sobre 2025',
      solution: 'Implementar QDF (Query Deserves Freshness) e decay functions'
    }
  ],
  
  generation: [
    {
      name: 'RAG sem grounding',
      problem: 'LLM vai alucinar sem verificação',
      solution: 'Implementar fact-checking e citation generation'
    }
  ],
  
  architecture: [
    {
      name: 'Escalar prematuramente',
      problem: 'Complexidade desnecessária, custo alto',
      solution: 'MVP primeiro, escala depois'
    }
  ]
};

// ============================================================================
// CHECKLIST DO ESPECIALISTA
// ============================================================================

export const SPECIALIST_CHECKLIST = {
  fundamentals: [
    'Entende PageRank e link analysis?',
    'Domina BM25 e TF-IDF?',
    'Conhece índices invertidos?',
    'Sabe implementar crawling distribuído?'
  ],
  
  neuralSearch: [
    'Entende bi-encoders vs cross-encoders?',
    'Sabe usar FAISS/ScaNN para ANN?',
    'Conhece hybrid retrieval (BM25 + Dense)?',
    'Domina fine-tuning de embeddings?'
  ],
  
  ranking: [
    'Conhece Learning to Rank (LTR)?',
    'Sabe implementar LambdaMART?',
    'Entende feature engineering para ranking?',
    'Domina métricas (NDCG, MRR, MAP)?'
  ],
  
  production: [
    'Sabe escalar para bilhões de docs?',
    'Conhece sharding e replicação?',
    'Domina A/B testing para search?',
    'Entende latência e throughput?'
  ],
  
  generative: [
    'Conhece RAG (Retrieval-Augmented Generation)?',
    'Sabe implementar grounding/fact-checking?',
    'Domina citation generation?',
    'Entende hallucination mitigation?'
  ]
};

// ============================================================================
// LTR FEATURES (Learning to Rank)
// ============================================================================

export const LTR_FEATURES = {
  queryDocument: [
    { name: 'bm25_score', description: 'BM25 score' },
    { name: 'bm25_title', description: 'BM25 no título' },
    { name: 'bm25_body', description: 'BM25 no corpo' },
    { name: 'bm25_anchor', description: 'BM25 em anchor text' },
    { name: 'dense_similarity', description: 'Similaridade de embedding' },
    { name: 'query_term_coverage', description: '% de termos da query no doc' },
    { name: 'exact_match_title', description: 'Query exata no título' }
  ],
  
  document: [
    { name: 'pagerank', description: 'PageRank score' },
    { name: 'domain_authority', description: 'Autoridade do domínio' },
    { name: 'page_quality_score', description: 'Score de qualidade' },
    { name: 'freshness', description: 'Idade do documento' },
    { name: 'content_length', description: 'Tamanho do conteúdo' },
    { name: 'spam_score', description: 'Probabilidade de spam' },
    { name: 'mobile_friendly', description: 'Otimizado para mobile' },
    { name: 'https', description: 'Usa HTTPS' },
    { name: 'load_speed', description: 'Velocidade de carregamento' }
  ],
  
  userSignals: [
    { name: 'click_through_rate', description: 'CTR histórico' },
    { name: 'dwell_time', description: 'Tempo médio na página' },
    { name: 'bounce_rate', description: 'Taxa de rejeição' },
    { name: 'query_reformulation_rate', description: 'Taxa de reformulação' }
  ],
  
  entity: [
    { name: 'entity_match', description: 'Entidade da query no doc' },
    { name: 'entity_type_match', description: 'Tipo de entidade corresponde' }
  ]
};

// ============================================================================
// JURAMENTO DO MESTRE
// ============================================================================

export const MASTER_OATH = `
Eu não construo buscadores.
Eu construo pontes entre perguntas e respostas.

Cada query é uma necessidade humana.
Cada resultado é uma promessa de relevância.
Cada milissegundo de latência é uma oportunidade perdida.

Eu domino os algoritmos dos gigantes:
- PageRank do Google
- Transformers que revolucionaram tudo
- Knowledge Graphs que conectam o mundo
- RAG que une retrieval e geração

Eu entendo que:
- Relevância é subjetiva, mas mensurável
- Escala é destino, não opção
- Privacidade é direito, não feature
- Velocidade é experiência, não métrica

Meus search engines não apenas encontram.
Eles COMPREENDEM, CONECTAM e RESPONDEM.

A diferença entre um buscador medíocre e um excelente
está nos detalhes que o usuário nunca vê.
`;

// ============================================================================
// FUNÇÕES HELPER ADICIONAIS
// ============================================================================

export function getArchitectureLayer(name: string) {
  return SEARCH_ARCHITECTURE.layers.find(l => l.name.toLowerCase().includes(name.toLowerCase()));
}

export function getVerticalSearch(type: string) {
  return VERTICAL_SEARCH_TYPES[type as keyof typeof VERTICAL_SEARCH_TYPES];
}

export function getQualityAlgorithm(name: string) {
  return GOOGLE_QUALITY_ALGORITHMS[name as keyof typeof GOOGLE_QUALITY_ALGORITHMS];
}

export function getRoadmapPhase(phase: 1 | 2 | 3 | 4) {
  const phases = {
    1: IMPLEMENTATION_ROADMAP.phase1_mvp,
    2: IMPLEMENTATION_ROADMAP.phase2_semantic,
    3: IMPLEMENTATION_ROADMAP.phase3_intelligence,
    4: IMPLEMENTATION_ROADMAP.phase4_scale
  };
  return phases[phase];
}

export function getCostStrategy(phase: string) {
  return COST_STRATEGY[phase as keyof typeof COST_STRATEGY];
}

export function getAntiPatterns(category: string) {
  return ANTI_PATTERNS[category as keyof typeof ANTI_PATTERNS];
}

export function getChecklist(category: string) {
  return SPECIALIST_CHECKLIST[category as keyof typeof SPECIALIST_CHECKLIST];
}

export function getLTRFeatures(category: string) {
  return LTR_FEATURES[category as keyof typeof LTR_FEATURES];
}

export function getPaper(category: string) {
  return SEMINAL_PAPERS[category as keyof typeof SEMINAL_PAPERS];
}

export function getMetric(type: 'offline' | 'online', name: string) {
  const metrics = EVALUATION_METRICS[type];
  return metrics[name as keyof typeof metrics];
}

// Função para gerar relatório completo do manifesto
export function generateManifestReport(): string {
  return `
# 🔍 SEARCH ENGINE SUPREME MANIFEST REPORT

## Gigantes da Busca
- Google: ${SEARCH_GIANTS.google.marketShare} market share, ${Object.keys(SEARCH_GIANTS.google.timeline).length} marcos históricos
- Microsoft Bing: ${SEARCH_GIANTS.microsoft.marketShare} market share
- Apple: Foco em privacidade e on-device

## Algoritmos Fundamentais
${Object.keys(CORE_ALGORITHMS).map(k => `- ${CORE_ALGORITHMS[k as keyof typeof CORE_ALGORITHMS].name}`).join('\n')}

## Arquitetura
${SEARCH_ARCHITECTURE.layers.map(l => `- ${l.name}: ${l.components.join(', ')}`).join('\n')}

## Modelos de Embedding
- Tier 1 (SOTA): ${EMBEDDING_MODELS.tier1_stateOfTheArt.length} modelos
- Tier 2 (Open Source): ${EMBEDDING_MODELS.tier2_openSource.length} modelos
- Tier 3 (Efficient): ${EMBEDDING_MODELS.tier3_efficient.length} modelos
- Tier 4 (Multilingual): ${EMBEDDING_MODELS.tier4_multilingual.length} modelos

## Métricas de Avaliação
- Offline: ${Object.keys(EVALUATION_METRICS.offline).length} métricas
- Online: ${Object.keys(EVALUATION_METRICS.online).length} métricas
- Benchmarks: ${EVALUATION_METRICS.benchmarks.length} datasets

## Papers Seminais
- Foundations: ${SEMINAL_PAPERS.foundations.length}
- Learning to Rank: ${SEMINAL_PAPERS.learningToRank.length}
- Neural Retrieval: ${SEMINAL_PAPERS.neuralRetrieval.length}
- RAG: ${SEMINAL_PAPERS.rag.length}

## Roadmap de Implementação
- Fase 1 (MVP): ${IMPLEMENTATION_ROADMAP.phase1_mvp.duration}
- Fase 2 (Semantic): ${IMPLEMENTATION_ROADMAP.phase2_semantic.duration}
- Fase 3 (Intelligence): ${IMPLEMENTATION_ROADMAP.phase3_intelligence.duration}
- Fase 4 (Scale): ${IMPLEMENTATION_ROADMAP.phase4_scale.duration}

## Anti-Patterns
${Object.keys(ANTI_PATTERNS).map(k => `- ${k}: ${ANTI_PATTERNS[k as keyof typeof ANTI_PATTERNS].length} patterns`).join('\n')}

## Checklist do Especialista
${Object.keys(SPECIALIST_CHECKLIST).map(k => `- ${k}: ${SPECIALIST_CHECKLIST[k as keyof typeof SPECIALIST_CHECKLIST].length} items`).join('\n')}
`;
}
