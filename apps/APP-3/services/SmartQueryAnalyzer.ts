/**
 * 🧠 SMART QUERY ANALYZER - Analisador Inteligente de Queries
 * 
 * Sistema que analisa a intenção do usuário e gera queries otimizadas
 * para maximizar os resultados das APIs de pesquisa.
 * 
 * @version 1.0.0
 * @author Sistema de Pesquisa Cognitiva
 * 
 * FILOSOFIA: "ENTENDER ANTES DE PESQUISAR"
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface UserIntent {
  primaryIntent: IntentType;
  secondaryIntents: IntentType[];
  confidence: number;
  language: 'pt' | 'en' | 'mixed';
  projectType: ProjectType;
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
}

export type IntentType = 
  | 'create_app'      // Criar aplicativo/site
  | 'clone_app'       // Clonar app existente
  | 'learn_tech'      // Aprender tecnologia
  | 'solve_problem'   // Resolver problema técnico
  | 'find_library'    // Encontrar biblioteca/framework
  | 'design_ui'       // Design de interface
  | 'business_model'  // Modelo de negócio
  | 'integration'     // Integração de APIs
  | 'optimization'    // Otimização de performance
  | 'security';       // Segurança

export type ProjectType =
  | 'ecommerce'
  | 'saas'
  | 'social_network'
  | 'dashboard'
  | 'landing_page'
  | 'blog'
  | 'portfolio'
  | 'mobile_app'
  | 'game'
  | 'fintech'
  | 'healthcare'
  | 'education'
  | 'marketplace'
  | 'streaming'
  | 'productivity'
  | 'unknown';

export interface ResearchTopic {
  id: string;
  name: string;
  keywords: string[];
  queries: OptimizedQuery[];
  priority: number; // 1-10
  sources: RecommendedSource[];
}

export interface OptimizedQuery {
  query: string;
  targetApi: 'wikipedia' | 'github' | 'stackoverflow' | 'arxiv' | 'devto' | 'hackernews' | 'duckduckgo';
  language: 'pt' | 'en';
  expectedResultType: 'concept' | 'code' | 'tutorial' | 'news' | 'paper' | 'discussion';
}

export interface RecommendedSource {
  name: string;
  reason: string;
  priority: number;
}

export interface AnalysisResult {
  originalPrompt: string;
  intent: UserIntent;
  topics: ResearchTopic[];
  totalQueries: number;
  estimatedTime: number; // em segundos
  strategy: ResearchStrategy;
}

export type ResearchStrategy = 
  | 'breadth_first'   // Pesquisa ampla primeiro
  | 'depth_first'     // Pesquisa profunda primeiro
  | 'parallel'        // Pesquisa paralela em todas as fontes
  | 'sequential';     // Pesquisa sequencial por prioridade

// ============================================================================
// DICIONÁRIOS DE CONHECIMENTO
// ============================================================================

const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  create_app: [
    'criar', 'create', 'fazer', 'make', 'desenvolver', 'develop', 'build', 'construir',
    'aplicativo', 'app', 'site', 'website', 'sistema', 'system', 'plataforma', 'platform',
    'página', 'page', 'portal', 'projeto', 'project'
  ],
  clone_app: [
    'clone', 'clonar', 'igual', 'like', 'como', 'similar', 'replica', 'replicar',
    'copiar', 'copy', 'inspirado', 'inspired', 'estilo', 'style'
  ],
  learn_tech: [
    'aprender', 'learn', 'estudar', 'study', 'entender', 'understand', 'como funciona',
    'how works', 'tutorial', 'guia', 'guide', 'explicar', 'explain', 'o que é', 'what is'
  ],
  solve_problem: [
    'erro', 'error', 'bug', 'problema', 'problem', 'não funciona', 'not working',
    'consertar', 'fix', 'resolver', 'solve', 'ajuda', 'help', 'debug'
  ],
  find_library: [
    'biblioteca', 'library', 'framework', 'pacote', 'package', 'módulo', 'module',
    'ferramenta', 'tool', 'sdk', 'api', 'plugin', 'extensão', 'extension'
  ],
  design_ui: [
    'design', 'ui', 'ux', 'interface', 'layout', 'visual', 'estilo', 'style',
    'cores', 'colors', 'tema', 'theme', 'bonito', 'beautiful', 'moderno', 'modern'
  ],
  business_model: [
    'negócio', 'business', 'monetizar', 'monetize', 'ganhar dinheiro', 'make money',
    'startup', 'saas', 'assinatura', 'subscription', 'freemium', 'receita', 'revenue'
  ],
  integration: [
    'integrar', 'integrate', 'conectar', 'connect', 'api', 'webhook', 'oauth',
    'autenticação', 'authentication', 'pagamento', 'payment', 'stripe', 'firebase'
  ],
  optimization: [
    'otimizar', 'optimize', 'performance', 'rápido', 'fast', 'lento', 'slow',
    'melhorar', 'improve', 'cache', 'lazy', 'bundle', 'minify'
  ],
  security: [
    'segurança', 'security', 'seguro', 'secure', 'vulnerabilidade', 'vulnerability',
    'hack', 'proteção', 'protection', 'criptografia', 'encryption', 'ssl', 'https'
  ]
};

const PROJECT_TYPE_KEYWORDS: Record<ProjectType, string[]> = {
  ecommerce: ['loja', 'store', 'shop', 'e-commerce', 'ecommerce', 'carrinho', 'cart', 'produto', 'product', 'compra', 'buy', 'venda', 'sell'],
  saas: ['saas', 'software as a service', 'assinatura', 'subscription', 'plano', 'plan', 'dashboard', 'painel'],
  social_network: ['rede social', 'social network', 'feed', 'post', 'seguir', 'follow', 'curtir', 'like', 'comentário', 'comment'],
  dashboard: ['dashboard', 'painel', 'admin', 'administração', 'analytics', 'métricas', 'metrics', 'relatório', 'report'],
  landing_page: ['landing', 'página de vendas', 'sales page', 'conversão', 'conversion', 'lead', 'captura'],
  blog: ['blog', 'artigo', 'article', 'post', 'conteúdo', 'content', 'cms', 'publicação'],
  portfolio: ['portfolio', 'portfólio', 'currículo', 'resume', 'cv', 'trabalhos', 'works', 'projetos'],
  mobile_app: ['mobile', 'app', 'android', 'ios', 'celular', 'smartphone', 'react native', 'flutter'],
  game: ['jogo', 'game', 'gaming', 'player', 'score', 'level', 'fase', 'personagem', 'character'],
  fintech: ['fintech', 'banco', 'bank', 'financeiro', 'financial', 'pix', 'pagamento', 'payment', 'carteira', 'wallet'],
  healthcare: ['saúde', 'health', 'médico', 'doctor', 'paciente', 'patient', 'clínica', 'clinic', 'hospital'],
  education: ['educação', 'education', 'curso', 'course', 'aula', 'class', 'aluno', 'student', 'professor', 'teacher'],
  marketplace: ['marketplace', 'mercado', 'market', 'vendedor', 'seller', 'comprador', 'buyer', 'anúncio', 'listing'],
  streaming: ['streaming', 'vídeo', 'video', 'música', 'music', 'podcast', 'live', 'ao vivo', 'netflix', 'spotify'],
  productivity: ['produtividade', 'productivity', 'tarefa', 'task', 'projeto', 'project', 'equipe', 'team', 'colaboração'],
  unknown: []
};

const CLONE_TARGETS: Record<string, { keywords: string[], topics: string[] }> = {
  tiktok: { 
    keywords: ['tiktok', 'tik tok', 'reels', 'shorts'],
    topics: ['video feed vertical', 'infinite scroll', 'video player mobile', 'social engagement']
  },
  youtube: {
    keywords: ['youtube', 'you tube'],
    topics: ['video streaming', 'video player', 'recommendation algorithm', 'subscription system']
  },
  netflix: {
    keywords: ['netflix', 'streaming video'],
    topics: ['video streaming platform', 'content recommendation', 'subscription billing', 'video player']
  },
  instagram: {
    keywords: ['instagram', 'insta'],
    topics: ['photo sharing', 'stories feature', 'social feed', 'image filters']
  },
  spotify: {
    keywords: ['spotify', 'music streaming'],
    topics: ['audio streaming', 'playlist management', 'music recommendation', 'audio player']
  },
  uber: {
    keywords: ['uber', 'ride sharing', '99', 'taxi app'],
    topics: ['geolocation tracking', 'real-time maps', 'payment integration', 'driver matching']
  },
  airbnb: {
    keywords: ['airbnb', 'booking', 'hospedagem'],
    topics: ['booking system', 'property listing', 'review system', 'payment escrow']
  },
  whatsapp: {
    keywords: ['whatsapp', 'zap', 'chat', 'messenger'],
    topics: ['real-time messaging', 'websocket chat', 'end-to-end encryption', 'message status']
  },
  twitter: {
    keywords: ['twitter', 'x.com', 'tweet'],
    topics: ['microblogging', 'real-time feed', 'hashtag system', 'retweet mechanism']
  },
  linkedin: {
    keywords: ['linkedin', 'rede profissional'],
    topics: ['professional networking', 'job board', 'company pages', 'endorsements']
  }
};

// ============================================================================
// CLASSE PRINCIPAL - SMART QUERY ANALYZER
// ============================================================================

export class SmartQueryAnalyzer {
  
  /**
   * Analisa o prompt do usuário e gera um plano de pesquisa otimizado
   */
  analyze(userPrompt: string): AnalysisResult {
    console.log('🧠 SmartQueryAnalyzer: Analisando prompt...');
    
    const intent = this.detectIntent(userPrompt);
    const topics = this.extractTopics(userPrompt, intent);
    const strategy = this.determineStrategy(intent, topics);
    
    const totalQueries = topics.reduce((sum, t) => sum + t.queries.length, 0);
    const estimatedTime = this.estimateTime(totalQueries);
    
    console.log(`✅ Análise concluída: ${topics.length} tópicos, ${totalQueries} queries`);
    
    return {
      originalPrompt: userPrompt,
      intent,
      topics,
      totalQueries,
      estimatedTime,
      strategy
    };
  }

  /**
   * Detecta a intenção principal do usuário
   */
  private detectIntent(prompt: string): UserIntent {
    const promptLower = prompt.toLowerCase();
    const intentScores: Record<IntentType, number> = {
      create_app: 0,
      clone_app: 0,
      learn_tech: 0,
      solve_problem: 0,
      find_library: 0,
      design_ui: 0,
      business_model: 0,
      integration: 0,
      optimization: 0,
      security: 0
    };

    // Calcular scores para cada intenção
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (promptLower.includes(keyword)) {
          intentScores[intent as IntentType] += 1;
        }
      }
    }

    // Encontrar intenção principal e secundárias
    const sortedIntents = Object.entries(intentScores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0);

    const primaryIntent = (sortedIntents[0]?.[0] || 'create_app') as IntentType;
    const secondaryIntents = sortedIntents.slice(1, 4).map(([intent]) => intent as IntentType);
    
    // Detectar tipo de projeto
    const projectType = this.detectProjectType(promptLower);
    
    // Detectar idioma
    const language = this.detectLanguage(prompt);
    
    // Detectar complexidade
    const complexity = this.detectComplexity(promptLower);
    
    // Calcular confiança
    const maxScore = Math.max(...Object.values(intentScores));
    const confidence = maxScore > 0 ? Math.min(maxScore / 5, 1) : 0.5;

    return {
      primaryIntent,
      secondaryIntents,
      confidence,
      language,
      projectType,
      complexity
    };
  }

  /**
   * Detecta o tipo de projeto
   */
  private detectProjectType(promptLower: string): ProjectType {
    for (const [type, keywords] of Object.entries(PROJECT_TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (promptLower.includes(keyword)) {
          return type as ProjectType;
        }
      }
    }
    return 'unknown';
  }

  /**
   * Detecta o idioma predominante
   */
  private detectLanguage(prompt: string): 'pt' | 'en' | 'mixed' {
    const ptWords = ['criar', 'fazer', 'para', 'com', 'que', 'uma', 'como', 'sistema', 'aplicativo'];
    const enWords = ['create', 'make', 'for', 'with', 'that', 'app', 'how', 'system', 'application'];
    
    const promptLower = prompt.toLowerCase();
    let ptCount = 0;
    let enCount = 0;
    
    ptWords.forEach(w => { if (promptLower.includes(w)) ptCount++; });
    enWords.forEach(w => { if (promptLower.includes(w)) enCount++; });
    
    if (ptCount > enCount * 2) return 'pt';
    if (enCount > ptCount * 2) return 'en';
    return 'mixed';
  }

  /**
   * Detecta a complexidade do projeto
   */
  private detectComplexity(promptLower: string): 'simple' | 'medium' | 'complex' | 'enterprise' {
    const enterpriseKeywords = ['enterprise', 'corporativo', 'grande escala', 'multi-tenant', 'microservices'];
    const complexKeywords = ['fullstack', 'full-stack', 'completo', 'complete', 'sistema completo', 'dashboard', 'admin'];
    const mediumKeywords = ['autenticação', 'authentication', 'banco de dados', 'database', 'api'];
    
    if (enterpriseKeywords.some(k => promptLower.includes(k))) return 'enterprise';
    if (complexKeywords.some(k => promptLower.includes(k))) return 'complex';
    if (mediumKeywords.some(k => promptLower.includes(k))) return 'medium';
    return 'simple';
  }

  /**
   * Extrai tópicos de pesquisa do prompt
   */
  private extractTopics(prompt: string, intent: UserIntent): ResearchTopic[] {
    const topics: ResearchTopic[] = [];
    const promptLower = prompt.toLowerCase();
    
    // 1. Verificar se é um clone
    const cloneTarget = this.detectCloneTarget(promptLower);
    if (cloneTarget) {
      topics.push(this.createCloneTopic(cloneTarget, intent.language));
    }
    
    // 2. Extrair tecnologias mencionadas
    const techTopics = this.extractTechTopics(promptLower, intent.language);
    topics.push(...techTopics);
    
    // 3. Extrair conceitos de negócio
    if (intent.primaryIntent === 'create_app' || intent.primaryIntent === 'business_model') {
      const businessTopics = this.extractBusinessTopics(promptLower, intent);
      topics.push(...businessTopics);
    }
    
    // 4. Extrair tópicos de design
    if (intent.primaryIntent === 'design_ui' || intent.secondaryIntents.includes('design_ui')) {
      const designTopics = this.extractDesignTopics(promptLower, intent);
      topics.push(...designTopics);
    }
    
    // 5. Tópico geral baseado no prompt
    topics.push(this.createGeneralTopic(prompt, intent));
    
    // Ordenar por prioridade
    return topics.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Detecta se o usuário quer clonar um app específico
   */
  private detectCloneTarget(promptLower: string): string | null {
    for (const [target, config] of Object.entries(CLONE_TARGETS)) {
      if (config.keywords.some(k => promptLower.includes(k))) {
        return target;
      }
    }
    return null;
  }

  /**
   * Cria tópico de pesquisa para clone
   */
  private createCloneTopic(target: string, language: 'pt' | 'en' | 'mixed'): ResearchTopic {
    const config = CLONE_TARGETS[target];
    const queries: OptimizedQuery[] = [];
    
    // Queries para Wikipedia
    queries.push({
      query: target,
      targetApi: 'wikipedia',
      language: 'en',
      expectedResultType: 'concept'
    });
    
    // Queries para GitHub
    queries.push({
      query: `${target} clone open source`,
      targetApi: 'github',
      language: 'en',
      expectedResultType: 'code'
    });
    
    // Queries para tutoriais
    config.topics.forEach(topic => {
      queries.push({
        query: `${topic} tutorial`,
        targetApi: 'devto',
        language: 'en',
        expectedResultType: 'tutorial'
      });
    });
    
    return {
      id: `clone-${target}`,
      name: `Clone ${target.charAt(0).toUpperCase() + target.slice(1)}`,
      keywords: config.keywords,
      queries,
      priority: 10,
      sources: [
        { name: 'Wikipedia', reason: 'Entender o produto original', priority: 9 },
        { name: 'GitHub', reason: 'Encontrar implementações open source', priority: 10 },
        { name: 'DEV.to', reason: 'Tutoriais de implementação', priority: 8 }
      ]
    };
  }

  /**
   * Extrai tópicos de tecnologia
   */
  private extractTechTopics(promptLower: string, language: 'pt' | 'en' | 'mixed'): ResearchTopic[] {
    const topics: ResearchTopic[] = [];
    
    const techKeywords: Record<string, { queries: string[], sources: string[] }> = {
      'react': { queries: ['React.js best practices', 'React hooks tutorial', 'React component patterns'], sources: ['GitHub', 'DEV.to'] },
      'next': { queries: ['Next.js 14 features', 'Next.js app router', 'Next.js server components'], sources: ['GitHub', 'DEV.to'] },
      'typescript': { queries: ['TypeScript best practices', 'TypeScript advanced types'], sources: ['GitHub', 'Stack Overflow'] },
      'tailwind': { queries: ['Tailwind CSS components', 'Tailwind UI patterns'], sources: ['GitHub', 'DEV.to'] },
      'node': { queries: ['Node.js backend architecture', 'Express.js best practices'], sources: ['GitHub', 'DEV.to'] },
      'python': { queries: ['Python web framework', 'FastAPI tutorial'], sources: ['GitHub', 'ArXiv'] },
      'firebase': { queries: ['Firebase authentication', 'Firestore database patterns'], sources: ['GitHub', 'Stack Overflow'] },
      'supabase': { queries: ['Supabase tutorial', 'Supabase vs Firebase'], sources: ['GitHub', 'DEV.to'] },
      'stripe': { queries: ['Stripe payment integration', 'Stripe subscription billing'], sources: ['GitHub', 'Stack Overflow'] },
      'prisma': { queries: ['Prisma ORM tutorial', 'Prisma schema design'], sources: ['GitHub', 'DEV.to'] },
      'graphql': { queries: ['GraphQL API design', 'GraphQL vs REST'], sources: ['GitHub', 'DEV.to'] },
      'websocket': { queries: ['WebSocket real-time', 'Socket.io tutorial'], sources: ['GitHub', 'Stack Overflow'] }
    };
    
    for (const [tech, config] of Object.entries(techKeywords)) {
      if (promptLower.includes(tech)) {
        const queries: OptimizedQuery[] = config.queries.map(q => ({
          query: q,
          targetApi: 'github' as const,
          language: 'en' as const,
          expectedResultType: 'code' as const
        }));
        
        topics.push({
          id: `tech-${tech}`,
          name: tech.charAt(0).toUpperCase() + tech.slice(1),
          keywords: [tech],
          queries,
          priority: 8,
          sources: config.sources.map((s, i) => ({ name: s, reason: `Referência para ${tech}`, priority: 9 - i }))
        });
      }
    }
    
    return topics;
  }

  /**
   * Extrai tópicos de negócio
   */
  private extractBusinessTopics(promptLower: string, intent: UserIntent): ResearchTopic[] {
    const topics: ResearchTopic[] = [];
    
    const businessQueries: Record<ProjectType, string[]> = {
      ecommerce: ['ecommerce best practices', 'online store features', 'shopping cart implementation'],
      saas: ['SaaS architecture', 'subscription billing system', 'multi-tenant application'],
      social_network: ['social network features', 'feed algorithm', 'user engagement'],
      dashboard: ['admin dashboard design', 'data visualization', 'analytics dashboard'],
      landing_page: ['landing page conversion', 'call to action design', 'lead generation'],
      blog: ['blog CMS architecture', 'content management system', 'SEO optimization'],
      portfolio: ['portfolio website design', 'project showcase', 'personal branding'],
      mobile_app: ['mobile app development', 'responsive design', 'PWA features'],
      game: ['game development web', 'game mechanics', 'game UI design'],
      fintech: ['fintech security', 'payment processing', 'financial regulations'],
      healthcare: ['healthcare app compliance', 'HIPAA requirements', 'patient data security'],
      education: ['e-learning platform', 'LMS features', 'online course design'],
      marketplace: ['marketplace architecture', 'two-sided marketplace', 'escrow payment'],
      streaming: ['video streaming architecture', 'content delivery network', 'adaptive bitrate'],
      productivity: ['productivity app features', 'task management', 'team collaboration'],
      unknown: []
    };
    
    const queries = businessQueries[intent.projectType] || [];
    if (queries.length > 0) {
      topics.push({
        id: `business-${intent.projectType}`,
        name: `Negócio: ${intent.projectType}`,
        keywords: PROJECT_TYPE_KEYWORDS[intent.projectType],
        queries: queries.map(q => ({
          query: q,
          targetApi: 'duckduckgo' as const,
          language: 'en' as const,
          expectedResultType: 'concept' as const
        })),
        priority: 7,
        sources: [
          { name: 'Wikipedia', reason: 'Conceitos de negócio', priority: 7 },
          { name: 'Hacker News', reason: 'Discussões da indústria', priority: 6 }
        ]
      });
    }
    
    return topics;
  }

  /**
   * Extrai tópicos de design
   */
  private extractDesignTopics(promptLower: string, intent: UserIntent): ResearchTopic[] {
    const designQueries = [
      'UI design trends 2024',
      'color palette generator',
      'typography best practices',
      'responsive design patterns',
      'micro interactions design'
    ];
    
    return [{
      id: 'design-ui',
      name: 'Design de Interface',
      keywords: ['design', 'ui', 'ux', 'interface'],
      queries: designQueries.map(q => ({
        query: q,
        targetApi: 'duckduckgo' as const,
        language: 'en' as const,
        expectedResultType: 'concept' as const
      })),
      priority: 6,
      sources: [
        { name: 'DEV.to', reason: 'Artigos de design', priority: 7 },
        { name: 'GitHub', reason: 'Design systems', priority: 6 }
      ]
    }];
  }

  /**
   * Cria tópico geral baseado no prompt
   */
  private createGeneralTopic(prompt: string, intent: UserIntent): ResearchTopic {
    // Extrair palavras-chave principais (remover stop words)
    const stopWords = new Set([
      'criar', 'fazer', 'um', 'uma', 'para', 'com', 'que', 'de', 'do', 'da', 'o', 'a',
      'create', 'make', 'a', 'an', 'the', 'for', 'with', 'that', 'of', 'to'
    ]);
    
    const words = prompt.toLowerCase()
      .replace(/[^\w\sáéíóúâêîôûãõç]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
    
    // Pegar as 5 palavras mais relevantes
    const keywords = words.slice(0, 5);
    const mainQuery = keywords.join(' ');
    
    const queries: OptimizedQuery[] = [
      // Query principal em português
      {
        query: mainQuery,
        targetApi: 'wikipedia',
        language: intent.language === 'en' ? 'en' : 'pt',
        expectedResultType: 'concept'
      },
      // Query em inglês para mais resultados
      {
        query: mainQuery,
        targetApi: 'duckduckgo',
        language: 'en',
        expectedResultType: 'concept'
      },
      // Query para código
      {
        query: `${mainQuery} example code`,
        targetApi: 'github',
        language: 'en',
        expectedResultType: 'code'
      }
    ];
    
    return {
      id: 'general',
      name: 'Pesquisa Geral',
      keywords,
      queries,
      priority: 5,
      sources: [
        { name: 'Wikipedia', reason: 'Conceitos gerais', priority: 8 },
        { name: 'DuckDuckGo', reason: 'Busca ampla', priority: 7 },
        { name: 'GitHub', reason: 'Exemplos de código', priority: 6 }
      ]
    };
  }

  /**
   * Determina a estratégia de pesquisa
   */
  private determineStrategy(intent: UserIntent, topics: ResearchTopic[]): ResearchStrategy {
    if (intent.complexity === 'enterprise') return 'depth_first';
    if (topics.length > 5) return 'breadth_first';
    if (intent.primaryIntent === 'solve_problem') return 'sequential';
    return 'parallel';
  }

  /**
   * Estima o tempo de pesquisa
   */
  private estimateTime(totalQueries: number): number {
    // Média de 1.5 segundos por query
    return Math.ceil(totalQueries * 1.5);
  }

  /**
   * Gera queries otimizadas para uma API específica
   */
  generateOptimizedQueries(prompt: string): OptimizedQuery[] {
    const analysis = this.analyze(prompt);
    const allQueries: OptimizedQuery[] = [];
    
    for (const topic of analysis.topics) {
      allQueries.push(...topic.queries);
    }
    
    // Remover duplicatas
    const uniqueQueries = allQueries.filter((q, i, arr) => 
      arr.findIndex(x => x.query === q.query && x.targetApi === q.targetApi) === i
    );
    
    return uniqueQueries;
  }
}

// ============================================================================
// SINGLETON E EXPORTS
// ============================================================================

export const smartQueryAnalyzer = new SmartQueryAnalyzer();

export default SmartQueryAnalyzer;
