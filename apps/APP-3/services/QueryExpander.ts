/**
 * 🔄 QUERY EXPANDER - Expansor Inteligente de Queries
 * 
 * Sistema que expande queries com sinônimos, termos relacionados,
 * traduções e variações para maximizar cobertura de pesquisa.
 * 
 * @version 1.0.0
 * @author Sistema de Pesquisa Cognitiva
 * 
 * FILOSOFIA: "UMA QUERY VIRA MUITAS, MUITAS VIRAM CONHECIMENTO"
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ExpandedQuery {
  original: string;
  expanded: string[];
  synonyms: string[];
  translations: { pt: string; en: string };
  relatedTerms: string[];
  technicalVariants: string[];
}

export interface ExpansionConfig {
  includeSynonyms: boolean;
  includeTranslations: boolean;
  includeRelatedTerms: boolean;
  includeTechnicalVariants: boolean;
  maxExpansions: number;
}

// ============================================================================
// DICIONÁRIOS DE SINÔNIMOS E TRADUÇÕES
// ============================================================================

const SYNONYMS_PT_EN: Record<string, { pt: string[]; en: string[] }> = {
  // Ações de desenvolvimento
  'criar': { pt: ['desenvolver', 'construir', 'fazer', 'montar', 'elaborar'], en: ['create', 'build', 'develop', 'make', 'construct'] },
  'create': { pt: ['criar', 'desenvolver', 'construir'], en: ['build', 'develop', 'make', 'construct', 'design'] },
  
  // Tipos de aplicação
  'aplicativo': { pt: ['app', 'aplicação', 'programa', 'software'], en: ['app', 'application', 'software', 'program'] },
  'site': { pt: ['website', 'página', 'portal', 'plataforma web'], en: ['website', 'webpage', 'web app', 'web platform'] },
  'sistema': { pt: ['plataforma', 'software', 'aplicação'], en: ['system', 'platform', 'software', 'application'] },
  
  // E-commerce
  'loja': { pt: ['e-commerce', 'comércio', 'marketplace', 'shop'], en: ['store', 'shop', 'e-commerce', 'marketplace'] },
  'carrinho': { pt: ['cesta', 'sacola', 'cart'], en: ['cart', 'basket', 'shopping cart'] },
  'produto': { pt: ['item', 'mercadoria', 'artigo'], en: ['product', 'item', 'goods', 'merchandise'] },
  'pagamento': { pt: ['checkout', 'cobrança', 'transação'], en: ['payment', 'checkout', 'transaction', 'billing'] },
  
  // Dashboard/Admin
  'dashboard': { pt: ['painel', 'painel de controle', 'central'], en: ['dashboard', 'control panel', 'admin panel'] },
  'admin': { pt: ['administração', 'gerenciamento', 'gestão'], en: ['admin', 'administration', 'management'] },
  'relatório': { pt: ['report', 'análise', 'estatística'], en: ['report', 'analytics', 'statistics', 'insights'] },
  
  // Autenticação
  'login': { pt: ['autenticação', 'acesso', 'entrada'], en: ['login', 'authentication', 'sign in', 'access'] },
  'cadastro': { pt: ['registro', 'inscrição', 'signup'], en: ['registration', 'signup', 'sign up', 'register'] },
  'usuário': { pt: ['user', 'cliente', 'membro'], en: ['user', 'customer', 'member', 'account'] },
  
  // Design
  'design': { pt: ['visual', 'layout', 'interface', 'aparência'], en: ['design', 'layout', 'interface', 'UI', 'visual'] },
  'moderno': { pt: ['atual', 'contemporâneo', 'novo'], en: ['modern', 'contemporary', 'current', 'trendy'] },
  'bonito': { pt: ['elegante', 'atraente', 'estiloso'], en: ['beautiful', 'elegant', 'attractive', 'stylish'] },
  'responsivo': { pt: ['adaptável', 'mobile-friendly'], en: ['responsive', 'adaptive', 'mobile-friendly'] },
  
  // Tecnologias
  'banco de dados': { pt: ['database', 'bd', 'base de dados'], en: ['database', 'db', 'data store', 'storage'] },
  'api': { pt: ['interface', 'serviço', 'endpoint'], en: ['API', 'interface', 'service', 'endpoint'] },
  'backend': { pt: ['servidor', 'back-end', 'server-side'], en: ['backend', 'server', 'server-side', 'back-end'] },
  'frontend': { pt: ['interface', 'front-end', 'client-side'], en: ['frontend', 'client', 'client-side', 'front-end'] },
  
  // Funcionalidades
  'busca': { pt: ['pesquisa', 'search', 'procura'], en: ['search', 'find', 'lookup', 'query'] },
  'filtro': { pt: ['filtragem', 'seleção'], en: ['filter', 'filtering', 'selection', 'sort'] },
  'notificação': { pt: ['alerta', 'aviso', 'push'], en: ['notification', 'alert', 'push', 'message'] },
  'chat': { pt: ['mensagem', 'conversa', 'bate-papo'], en: ['chat', 'messaging', 'conversation', 'messenger'] }
};

const TECH_STACK_EXPANSIONS: Record<string, string[]> = {
  'react': ['React.js', 'ReactJS', 'React 18', 'React hooks', 'React components'],
  'next': ['Next.js', 'NextJS', 'Next 14', 'Next.js app router', 'Next.js server components'],
  'vue': ['Vue.js', 'VueJS', 'Vue 3', 'Vue composition API', 'Vuex'],
  'angular': ['Angular', 'AngularJS', 'Angular 17', 'Angular components'],
  'node': ['Node.js', 'NodeJS', 'Express.js', 'Express', 'Node backend'],
  'python': ['Python', 'Python 3', 'FastAPI', 'Django', 'Flask'],
  'typescript': ['TypeScript', 'TS', 'TypeScript types', 'TypeScript generics'],
  'tailwind': ['Tailwind CSS', 'TailwindCSS', 'Tailwind UI', 'Tailwind components'],
  'prisma': ['Prisma ORM', 'Prisma', 'Prisma schema', 'Prisma client'],
  'supabase': ['Supabase', 'Supabase auth', 'Supabase database', 'Supabase realtime'],
  'firebase': ['Firebase', 'Firestore', 'Firebase auth', 'Firebase realtime'],
  'stripe': ['Stripe', 'Stripe payments', 'Stripe checkout', 'Stripe subscriptions'],
  'graphql': ['GraphQL', 'Apollo GraphQL', 'GraphQL API', 'GraphQL schema'],
  'mongodb': ['MongoDB', 'Mongo', 'MongoDB Atlas', 'Mongoose'],
  'postgresql': ['PostgreSQL', 'Postgres', 'PG', 'PostgreSQL database'],
  'redis': ['Redis', 'Redis cache', 'Redis pub/sub', 'Redis cluster'],
  'docker': ['Docker', 'Docker compose', 'Dockerfile', 'Docker containers'],
  'kubernetes': ['Kubernetes', 'K8s', 'Kubernetes cluster', 'Kubernetes pods']
};

const DOMAIN_RELATED_TERMS: Record<string, string[]> = {
  'ecommerce': ['shopping cart', 'product catalog', 'inventory management', 'order processing', 'payment gateway', 'shipping integration', 'customer reviews', 'wishlist'],
  'saas': ['subscription management', 'multi-tenancy', 'usage billing', 'feature flags', 'onboarding flow', 'user analytics', 'API access', 'team management'],
  'social': ['user profiles', 'news feed', 'followers', 'likes', 'comments', 'sharing', 'notifications', 'direct messages', 'stories'],
  'fintech': ['KYC verification', 'transaction history', 'balance management', 'payment processing', 'fraud detection', 'compliance', 'reporting'],
  'healthcare': ['patient records', 'appointment scheduling', 'medical history', 'prescription management', 'HIPAA compliance', 'telemedicine'],
  'education': ['course management', 'student progress', 'quizzes', 'certificates', 'video lessons', 'discussion forums', 'assignments'],
  'marketplace': ['seller dashboard', 'buyer protection', 'escrow payments', 'reviews and ratings', 'search and filters', 'categories'],
  'streaming': ['video player', 'content library', 'recommendations', 'watch history', 'playlists', 'offline download', 'quality settings']
};

// ============================================================================
// CLASSE PRINCIPAL - QUERY EXPANDER
// ============================================================================

export class QueryExpander {
  private config: ExpansionConfig;

  constructor(config?: Partial<ExpansionConfig>) {
    this.config = {
      includeSynonyms: true,
      includeTranslations: true,
      includeRelatedTerms: true,
      includeTechnicalVariants: true,
      maxExpansions: 10,
      ...config
    };
  }

  /**
   * Expande uma query em múltiplas variações
   */
  expand(query: string): ExpandedQuery {
    const words = this.tokenize(query);
    const expanded: string[] = [query];
    const synonyms: string[] = [];
    const relatedTerms: string[] = [];
    const technicalVariants: string[] = [];

    // 1. Encontrar sinônimos para cada palavra
    if (this.config.includeSynonyms) {
      for (const word of words) {
        const wordSynonyms = this.findSynonyms(word);
        synonyms.push(...wordSynonyms);
      }
    }

    // 2. Encontrar variantes técnicas
    if (this.config.includeTechnicalVariants) {
      for (const word of words) {
        const variants = this.findTechVariants(word);
        technicalVariants.push(...variants);
      }
    }

    // 3. Encontrar termos relacionados ao domínio
    if (this.config.includeRelatedTerms) {
      const domain = this.detectDomain(query);
      if (domain) {
        relatedTerms.push(...(DOMAIN_RELATED_TERMS[domain] || []));
      }
    }

    // 4. Gerar traduções
    const translations = this.translate(query);

    // 5. Gerar queries expandidas
    expanded.push(...this.generateExpandedQueries(query, synonyms, technicalVariants));

    return {
      original: query,
      expanded: [...new Set(expanded)].slice(0, this.config.maxExpansions),
      synonyms: [...new Set(synonyms)],
      translations,
      relatedTerms: [...new Set(relatedTerms)].slice(0, 10),
      technicalVariants: [...new Set(technicalVariants)]
    };
  }

  /**
   * Expande múltiplas queries de uma vez
   */
  expandMultiple(queries: string[]): ExpandedQuery[] {
    return queries.map(q => this.expand(q));
  }

  /**
   * Gera queries otimizadas para diferentes APIs
   */
  generateApiQueries(query: string): Record<string, string[]> {
    const expansion = this.expand(query);
    
    return {
      // Wikipedia: queries conceituais e em ambos idiomas
      wikipedia: [
        expansion.translations.en,
        expansion.translations.pt,
        ...expansion.expanded.slice(0, 2)
      ],
      
      // GitHub: queries técnicas com variantes
      github: [
        `${query} example`,
        `${query} template`,
        `${query} starter`,
        ...expansion.technicalVariants.map(v => `${v} open source`)
      ],
      
      // Stack Overflow: queries de problema/solução
      stackoverflow: [
        `how to ${query}`,
        `${query} best practices`,
        `${query} tutorial`,
        ...expansion.synonyms.slice(0, 2).map(s => `${s} implementation`)
      ],
      
      // DEV.to: queries de tutorial
      devto: [
        `${query} tutorial`,
        `${query} guide`,
        `building ${query}`,
        ...expansion.technicalVariants.slice(0, 2)
      ],
      
      // ArXiv: queries científicas
      arxiv: [
        query,
        ...expansion.technicalVariants.filter(v => 
          v.toLowerCase().includes('algorithm') || 
          v.toLowerCase().includes('neural') ||
          v.toLowerCase().includes('machine learning')
        )
      ],
      
      // DuckDuckGo: queries gerais
      duckduckgo: [
        query,
        expansion.translations.en,
        ...expansion.expanded.slice(0, 3)
      ],
      
      // Hacker News: queries de discussão
      hackernews: [
        query,
        ...expansion.relatedTerms.slice(0, 3)
      ]
    };
  }

  /**
   * Tokeniza uma query em palavras
   */
  private tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^\w\sáéíóúâêîôûãõç-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  /**
   * Encontra sinônimos para uma palavra
   */
  private findSynonyms(word: string): string[] {
    const wordLower = word.toLowerCase();
    const synonyms: string[] = [];

    for (const [key, value] of Object.entries(SYNONYMS_PT_EN)) {
      if (key.toLowerCase() === wordLower || 
          value.pt.some(s => s.toLowerCase() === wordLower) ||
          value.en.some(s => s.toLowerCase() === wordLower)) {
        synonyms.push(...value.pt, ...value.en);
      }
    }

    return synonyms.filter(s => s.toLowerCase() !== wordLower);
  }

  /**
   * Encontra variantes técnicas
   */
  private findTechVariants(word: string): string[] {
    const wordLower = word.toLowerCase();
    
    for (const [tech, variants] of Object.entries(TECH_STACK_EXPANSIONS)) {
      if (wordLower.includes(tech) || tech.includes(wordLower)) {
        return variants;
      }
    }
    
    return [];
  }

  /**
   * Detecta o domínio da query
   */
  private detectDomain(query: string): string | null {
    const queryLower = query.toLowerCase();
    
    const domainKeywords: Record<string, string[]> = {
      'ecommerce': ['loja', 'store', 'shop', 'produto', 'carrinho', 'e-commerce'],
      'saas': ['saas', 'subscription', 'assinatura', 'dashboard', 'multi-tenant'],
      'social': ['social', 'feed', 'post', 'seguir', 'curtir', 'rede social'],
      'fintech': ['fintech', 'banco', 'pagamento', 'pix', 'financeiro'],
      'healthcare': ['saúde', 'health', 'médico', 'paciente', 'clínica'],
      'education': ['educação', 'curso', 'aula', 'aluno', 'professor'],
      'marketplace': ['marketplace', 'vendedor', 'comprador', 'anúncio'],
      'streaming': ['streaming', 'vídeo', 'música', 'netflix', 'spotify']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(k => queryLower.includes(k))) {
        return domain;
      }
    }

    return null;
  }

  /**
   * Traduz a query para PT e EN
   */
  private translate(query: string): { pt: string; en: string } {
    const words = this.tokenize(query);
    const ptWords: string[] = [];
    const enWords: string[] = [];

    for (const word of words) {
      let foundPt = word;
      let foundEn = word;

      for (const [key, value] of Object.entries(SYNONYMS_PT_EN)) {
        if (key.toLowerCase() === word || 
            value.pt.some(s => s.toLowerCase() === word)) {
          foundEn = value.en[0] || word;
          foundPt = value.pt[0] || word;
          break;
        }
        if (value.en.some(s => s.toLowerCase() === word)) {
          foundPt = value.pt[0] || word;
          foundEn = value.en[0] || word;
          break;
        }
      }

      ptWords.push(foundPt);
      enWords.push(foundEn);
    }

    return {
      pt: ptWords.join(' '),
      en: enWords.join(' ')
    };
  }

  /**
   * Gera queries expandidas combinando sinônimos
   */
  private generateExpandedQueries(
    original: string, 
    synonyms: string[], 
    techVariants: string[]
  ): string[] {
    const expanded: string[] = [];
    const words = this.tokenize(original);

    // Substituir uma palavra por sinônimo
    for (const synonym of synonyms.slice(0, 5)) {
      for (const word of words) {
        if (this.findSynonyms(word).includes(synonym)) {
          const newQuery = original.toLowerCase().replace(word, synonym);
          if (newQuery !== original.toLowerCase()) {
            expanded.push(newQuery);
          }
        }
      }
    }

    // Adicionar variantes técnicas
    for (const variant of techVariants.slice(0, 3)) {
      expanded.push(`${original} ${variant}`);
    }

    return expanded;
  }
}

// ============================================================================
// SINGLETON E EXPORTS
// ============================================================================

export const queryExpander = new QueryExpander();

export default QueryExpander;
