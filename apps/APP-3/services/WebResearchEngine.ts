/**
 * 🌐 WEB RESEARCH ENGINE - O Cérebro com Navegador Real
 * 
 * Sistema de pesquisa REAL na internet usando Playwright + Chromium
 * Conecta a IA com conhecimento em tempo real do mundo
 * 
 * @version 1.0.0
 * @author Sistema de Pesquisa Cognitiva
 * 
 * FILOSOFIA: "SE EXISTE NA INTERNET, EU SEI ENCONTRAR E TRAZER"
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface KnowledgePacket {
  id: string;
  source: string;
  url: string;
  type: 'article' | 'documentation' | 'tutorial' | 'news' | 'paper' | 'code' | 'forum' | 'wiki';
  title: string;
  summary: string;
  content: string;
  paragraphs: string[];
  codeBlocks: string[];
  links: string[];
  metadata: {
    author?: string;
    date?: string;
    language: string;
    wordCount: number;
    readingTime: number;
  };
  relevanceScore: number;
  extractedAt: string;
}

export interface ResearchQuery {
  query: string;
  context?: string;
  sources?: string[];
  maxResults?: number;
  language?: string;
  includeCode?: boolean;
  includeNews?: boolean;
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
}

export interface ResearchResult {
  query: string;
  packets: KnowledgePacket[];
  summary: string;
  sources: string[];
  totalResults: number;
  searchTime: number;
  timestamp: string;
}

export interface TrustedSource {
  name: string;
  url: string;
  type: 'documentation' | 'wiki' | 'news' | 'tutorial' | 'paper' | 'forum' | 'code';
  searchUrl?: string;
  selectors: {
    article?: string;
    title?: string;
    content?: string;
    code?: string;
    date?: string;
    author?: string;
  };
  rateLimit: number; // requests per minute
  priority: number; // 1-10, higher = more trusted
}

export interface BrowserConfig {
  headless: boolean;
  timeout: number;
  userAgent?: string;
  viewport?: { width: number; height: number };
  proxy?: string;
}

// ============================================================================
// FONTES CONFIÁVEIS PRÉ-CONFIGURADAS
// ============================================================================

export const TRUSTED_SOURCES: TrustedSource[] = [
  // === DOCUMENTAÇÃO OFICIAL ===
  {
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    type: 'documentation',
    searchUrl: 'https://developer.mozilla.org/en-US/search?q=',
    selectors: {
      article: 'article.main-page-content',
      title: 'h1',
      content: '.section-content',
      code: 'pre code'
    },
    rateLimit: 30,
    priority: 10
  },
  {
    name: 'TypeScript Docs',
    url: 'https://www.typescriptlang.org/docs',
    type: 'documentation',
    selectors: {
      article: 'article',
      title: 'h1',
      content: '.markdown',
      code: 'pre code'
    },
    rateLimit: 20,
    priority: 9
  },
  {
    name: 'React Docs',
    url: 'https://react.dev',
    type: 'documentation',
    selectors: {
      article: 'article',
      title: 'h1',
      content: '.markdown',
      code: 'pre code'
    },
    rateLimit: 20,
    priority: 9
  },
  {
    name: 'Node.js Docs',
    url: 'https://nodejs.org/docs',
    type: 'documentation',
    selectors: {
      article: '#apicontent',
      title: 'h1',
      content: '.api_stability',
      code: 'pre code'
    },
    rateLimit: 20,
    priority: 9
  },
  {
    name: 'Go Docs',
    url: 'https://go.dev/doc',
    type: 'documentation',
    selectors: {
      article: 'article',
      title: 'h1',
      content: '.Documentation-content',
      code: 'pre'
    },
    rateLimit: 20,
    priority: 9
  },
  {
    name: 'Python Docs',
    url: 'https://docs.python.org/3',
    type: 'documentation',
    selectors: {
      article: '.body',
      title: 'h1',
      content: '.section',
      code: '.highlight pre'
    },
    rateLimit: 20,
    priority: 9
  },
  {
    name: 'Rust Docs',
    url: 'https://doc.rust-lang.org',
    type: 'documentation',
    selectors: {
      article: '#main-content',
      title: 'h1',
      content: '.docblock',
      code: 'pre code'
    },
    rateLimit: 20,
    priority: 9
  },

  // === WIKIS E CONHECIMENTO ===
  {
    name: 'Wikipedia',
    url: 'https://en.wikipedia.org',
    type: 'wiki',
    searchUrl: 'https://en.wikipedia.org/w/index.php?search=',
    selectors: {
      article: '#mw-content-text',
      title: '#firstHeading',
      content: '.mw-parser-output > p',
      code: 'pre'
    },
    rateLimit: 60,
    priority: 8
  },
  {
    name: 'Wikipedia PT',
    url: 'https://pt.wikipedia.org',
    type: 'wiki',
    searchUrl: 'https://pt.wikipedia.org/w/index.php?search=',
    selectors: {
      article: '#mw-content-text',
      title: '#firstHeading',
      content: '.mw-parser-output > p',
      code: 'pre'
    },
    rateLimit: 60,
    priority: 8
  },
  {
    name: 'Arch Wiki',
    url: 'https://wiki.archlinux.org',
    type: 'wiki',
    searchUrl: 'https://wiki.archlinux.org/index.php?search=',
    selectors: {
      article: '#mw-content-text',
      title: '#firstHeading',
      content: '.mw-parser-output',
      code: 'pre'
    },
    rateLimit: 30,
    priority: 8
  },

  // === TUTORIAIS E APRENDIZADO ===
  {
    name: 'Dev.to',
    url: 'https://dev.to',
    type: 'tutorial',
    searchUrl: 'https://dev.to/search?q=',
    selectors: {
      article: 'article',
      title: 'h1',
      content: '.crayons-article__body',
      code: 'pre code',
      author: '.crayons-story__author',
      date: 'time'
    },
    rateLimit: 30,
    priority: 7
  },
  {
    name: 'FreeCodeCamp',
    url: 'https://www.freecodecamp.org/news',
    type: 'tutorial',
    searchUrl: 'https://www.freecodecamp.org/news/search/?query=',
    selectors: {
      article: 'article',
      title: 'h1',
      content: '.post-content',
      code: 'pre code'
    },
    rateLimit: 20,
    priority: 7
  },
  {
    name: 'GeeksForGeeks',
    url: 'https://www.geeksforgeeks.org',
    type: 'tutorial',
    selectors: {
      article: 'article',
      title: 'h1',
      content: '.text',
      code: 'pre code'
    },
    rateLimit: 20,
    priority: 6
  },
  {
    name: 'W3Schools',
    url: 'https://www.w3schools.com',
    type: 'tutorial',
    selectors: {
      article: '#main',
      title: 'h1',
      content: '.w3-main',
      code: '.w3-code'
    },
    rateLimit: 30,
    priority: 6
  },

  // === NOTÍCIAS TECH ===
  {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    type: 'news',
    searchUrl: 'https://hn.algolia.com/?q=',
    selectors: {
      article: '.athing',
      title: '.titleline a',
      content: '.comment'
    },
    rateLimit: 30,
    priority: 8
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    type: 'news',
    searchUrl: 'https://techcrunch.com/?s=',
    selectors: {
      article: 'article',
      title: 'h1',
      content: '.article-content',
      date: 'time',
      author: '.author-name'
    },
    rateLimit: 15,
    priority: 7
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com',
    type: 'news',
    searchUrl: 'https://www.theverge.com/search?q=',
    selectors: {
      article: 'article',
      title: 'h1',
      content: '.duet--article--article-body-component'
    },
    rateLimit: 15,
    priority: 7
  },

  // === PAPERS E CIÊNCIA ===
  {
    name: 'ArXiv',
    url: 'https://arxiv.org',
    type: 'paper',
    searchUrl: 'https://arxiv.org/search/?query=',
    selectors: {
      article: '.abs-page',
      title: 'h1.title',
      content: '.abstract',
      author: '.authors',
      date: '.dateline'
    },
    rateLimit: 20,
    priority: 9
  },
  {
    name: 'Papers With Code',
    url: 'https://paperswithcode.com',
    type: 'paper',
    searchUrl: 'https://paperswithcode.com/search?q=',
    selectors: {
      article: '.paper-card',
      title: 'h1',
      content: '.paper-abstract',
      code: '.code-table'
    },
    rateLimit: 20,
    priority: 9
  },

  // === CÓDIGO E REPOSITÓRIOS ===
  {
    name: 'GitHub',
    url: 'https://github.com',
    type: 'code',
    searchUrl: 'https://github.com/search?q=',
    selectors: {
      article: '.repository-content',
      title: 'h1',
      content: '.markdown-body',
      code: 'pre code'
    },
    rateLimit: 30,
    priority: 9
  },
  {
    name: 'GitLab',
    url: 'https://gitlab.com',
    type: 'code',
    searchUrl: 'https://gitlab.com/search?search=',
    selectors: {
      article: '.file-content',
      title: 'h1',
      content: '.readme-holder',
      code: 'pre code'
    },
    rateLimit: 20,
    priority: 8
  },

  // === FÓRUNS E COMUNIDADE ===
  {
    name: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    type: 'forum',
    searchUrl: 'https://stackoverflow.com/search?q=',
    selectors: {
      article: '.question',
      title: 'h1',
      content: '.s-prose',
      code: 'pre code'
    },
    rateLimit: 10, // Stack Overflow tem rate limit agressivo
    priority: 8
  },
  {
    name: 'Reddit Programming',
    url: 'https://www.reddit.com/r/programming',
    type: 'forum',
    searchUrl: 'https://www.reddit.com/r/programming/search/?q=',
    selectors: {
      article: '.Post',
      title: 'h1',
      content: '.RichTextJSON-root'
    },
    rateLimit: 20,
    priority: 6
  }
];

// ============================================================================
// APIS GRATUITAS DE CONHECIMENTO
// ============================================================================

export const KNOWLEDGE_APIS = {
  // Wikipedia API - 100% gratuita e ilimitada
  wikipedia: {
    name: 'Wikipedia API',
    baseUrl: 'https://en.wikipedia.org/w/api.php',
    endpoints: {
      search: '?action=query&list=search&srsearch={query}&format=json&origin=*',
      page: '?action=query&prop=extracts&exintro&explaintext&titles={title}&format=json&origin=*',
      summary: '?action=query&prop=extracts&exsentences=5&explaintext&titles={title}&format=json&origin=*'
    },
    rateLimit: 200 // requests per minute
  },

  // Wikipedia PT
  wikipediaPT: {
    name: 'Wikipedia PT API',
    baseUrl: 'https://pt.wikipedia.org/w/api.php',
    endpoints: {
      search: '?action=query&list=search&srsearch={query}&format=json&origin=*',
      page: '?action=query&prop=extracts&exintro&explaintext&titles={title}&format=json&origin=*'
    },
    rateLimit: 200
  },

  // DuckDuckGo Instant Answers - Gratuita
  duckduckgo: {
    name: 'DuckDuckGo Instant Answers',
    baseUrl: 'https://api.duckduckgo.com',
    endpoints: {
      instant: '/?q={query}&format=json&no_html=1&skip_disambig=1'
    },
    rateLimit: 60
  },

  // Hacker News API - Gratuita
  hackerNews: {
    name: 'Hacker News API',
    baseUrl: 'https://hacker-news.firebaseio.com/v0',
    endpoints: {
      topStories: '/topstories.json',
      newStories: '/newstories.json',
      item: '/item/{id}.json',
      search: 'https://hn.algolia.com/api/v1/search?query={query}'
    },
    rateLimit: 100
  },

  // GitHub API - Gratuita (com limites)
  github: {
    name: 'GitHub API',
    baseUrl: 'https://api.github.com',
    endpoints: {
      search: '/search/repositories?q={query}',
      readme: '/repos/{owner}/{repo}/readme'
    },
    rateLimit: 60 // 60 requests per hour sem auth
  },

  // DEV.to API - Gratuita
  devto: {
    name: 'DEV.to API',
    baseUrl: 'https://dev.to/api',
    endpoints: {
      articles: '/articles?tag={tag}&per_page=10',
      search: '/articles?tag={query}&per_page=10'
    },
    rateLimit: 30
  },

  // ArXiv API - Gratuita (usando HTTPS para evitar CORS)
  arxiv: {
    name: 'ArXiv API',
    baseUrl: 'https://export.arxiv.org/api',
    endpoints: {
      search: '/query?search_query=all:{query}&start=0&max_results=10'
    },
    rateLimit: 20
  }
};

// ============================================================================
// CLASSE PRINCIPAL - WEB RESEARCH ENGINE
// ============================================================================

export class WebResearchEngine {
  private browserConfig: BrowserConfig;
  private sources: Map<string, TrustedSource>;
  private cache: Map<string, KnowledgePacket>;
  private rateLimitTracker: Map<string, number[]>;

  constructor(config?: Partial<BrowserConfig>) {
    this.browserConfig = {
      headless: true,
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      ...config
    };

    this.sources = new Map();
    TRUSTED_SOURCES.forEach(source => {
      this.sources.set(source.name, source);
    });

    this.cache = new Map();
    this.rateLimitTracker = new Map();
  }

  // ---------------------------------------------------------------------------
  // PESQUISA PRINCIPAL
  // ---------------------------------------------------------------------------

  /**
   * Executa pesquisa completa usando múltiplas fontes
   */
  async research(query: ResearchQuery): Promise<ResearchResult> {
    const startTime = Date.now();
    const packets: KnowledgePacket[] = [];

    console.log(`🔍 Iniciando pesquisa: "${query.query}"`);

    // 1. Pesquisar via APIs gratuitas primeiro (mais rápido)
    const apiResults = await this.searchAPIs(query);
    packets.push(...apiResults);

    // 2. Se precisar de mais resultados, usar navegador
    if (packets.length < (query.maxResults || 10)) {
      const browserResults = await this.searchWithBrowser(query);
      packets.push(...browserResults);
    }

    // 3. Ordenar por relevância
    packets.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // 4. Limitar resultados
    const limitedPackets = packets.slice(0, query.maxResults || 10);

    // 5. Gerar resumo
    const summary = this.generateSummary(limitedPackets, query.query);

    const result: ResearchResult = {
      query: query.query,
      packets: limitedPackets,
      summary,
      sources: [...new Set(limitedPackets.map(p => p.source))],
      totalResults: packets.length,
      searchTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Pesquisa concluída: ${limitedPackets.length} resultados em ${result.searchTime}ms`);

    return result;
  }

  // ---------------------------------------------------------------------------
  // PESQUISA VIA APIs
  // ---------------------------------------------------------------------------

  /**
   * Pesquisa usando APIs gratuitas (sem navegador)
   * 🆕 Agora inclui: Wikipedia, DuckDuckGo, Hacker News, DEV.to, ArXiv, GitHub, Stack Overflow
   */
  async searchAPIs(query: ResearchQuery): Promise<KnowledgePacket[]> {
    const packets: KnowledgePacket[] = [];
    const queryLower = query.query.toLowerCase();

    // Wikipedia (sempre)
    try {
      const wikiResults = await this.searchWikipedia(query.query, query.language || 'en');
      packets.push(...wikiResults);
    } catch (error) {
      console.warn('⚠️ Wikipedia API falhou:', error);
    }

    // DuckDuckGo Instant Answers (sempre)
    try {
      const ddgResults = await this.searchDuckDuckGo(query.query);
      packets.push(...ddgResults);
    } catch (error) {
      console.warn('⚠️ DuckDuckGo API falhou:', error);
    }

    // Hacker News (se incluir notícias)
    if (query.includeNews) {
      try {
        const hnResults = await this.searchHackerNews(query.query);
        packets.push(...hnResults);
      } catch (error) {
        console.warn('⚠️ Hacker News API falhou:', error);
      }
    }

    // DEV.to (tutoriais)
    try {
      const devtoResults = await this.searchDevTo(query.query);
      packets.push(...devtoResults);
    } catch (error) {
      console.warn('⚠️ DEV.to API falhou:', error);
    }

    // 🆕 ArXiv (papers científicos - para queries técnicas/científicas)
    const isScientificQuery = ['paper', 'research', 'algorithm', 'neural', 'machine learning', 
      'deep learning', 'ai', 'artificial intelligence', 'model', 'transformer', 'llm',
      'quantum', 'physics', 'mathematics', 'científico', 'pesquisa', 'algoritmo'].some(
        kw => queryLower.includes(kw)
      );
    
    if (isScientificQuery) {
      try {
        const arxivResults = await this.searchArXiv(query.query, 3);
        packets.push(...arxivResults);
      } catch (error) {
        console.warn('⚠️ ArXiv API falhou:', error);
      }
    }

    // 🆕 GitHub (código - para queries de programação)
    if (query.includeCode || ['github', 'código', 'code', 'library', 'biblioteca', 
        'framework', 'package', 'npm', 'repo', 'repositório'].some(kw => queryLower.includes(kw))) {
      try {
        const githubResults = await this.searchGitHub(query.query, 3);
        packets.push(...githubResults);
      } catch (error) {
        console.warn('⚠️ GitHub API falhou:', error);
      }
    }

    // 🆕 Stack Overflow (Q&A - para queries de programação/debug)
    const isProgrammingQuery = ['error', 'bug', 'fix', 'how to', 'como', 'why', 'por que',
      'não funciona', 'not working', 'exception', 'problema', 'problem'].some(
        kw => queryLower.includes(kw)
      );
    
    if (isProgrammingQuery || query.includeCode) {
      try {
        const soResults = await this.searchStackOverflow(query.query, 3);
        packets.push(...soResults);
      } catch (error) {
        console.warn('⚠️ Stack Overflow API falhou:', error);
      }
    }

    return packets;
  }

  /**
   * Pesquisa na Wikipedia via API
   */
  async searchWikipedia(query: string, lang: string = 'en'): Promise<KnowledgePacket[]> {
    const baseUrl = lang === 'pt' 
      ? KNOWLEDGE_APIS.wikipediaPT.baseUrl 
      : KNOWLEDGE_APIS.wikipedia.baseUrl;

    // Buscar artigos
    const searchUrl = `${baseUrl}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    const packets: KnowledgePacket[] = [];

    if (searchData.query?.search) {
      for (const result of searchData.query.search.slice(0, 3)) {
        // Buscar conteúdo do artigo
        const pageUrl = `${baseUrl}?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(result.title)}&format=json&origin=*`;
        const pageResponse = await fetch(pageUrl);
        const pageData = await pageResponse.json();

        const pages = pageData.query?.pages;
        if (pages) {
          const page = Object.values(pages)[0] as any;
          if (page.extract) {
            packets.push({
              id: `wiki-${page.pageid}`,
              source: 'Wikipedia',
              url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
              type: 'wiki',
              title: result.title,
              summary: page.extract.slice(0, 500),
              content: page.extract,
              paragraphs: page.extract.split('\n').filter((p: string) => p.trim()),
              codeBlocks: [],
              links: [],
              metadata: {
                language: lang,
                wordCount: page.extract.split(' ').length,
                readingTime: Math.ceil(page.extract.split(' ').length / 200)
              },
              relevanceScore: 0.9,
              extractedAt: new Date().toISOString()
            });
          }
        }
      }
    }

    return packets;
  }

  /**
   * Pesquisa no DuckDuckGo Instant Answers
   */
  async searchDuckDuckGo(query: string): Promise<KnowledgePacket[]> {
    const url = `${KNOWLEDGE_APIS.duckduckgo.baseUrl}/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(url);
    const data = await response.json();

    const packets: KnowledgePacket[] = [];

    if (data.Abstract) {
      packets.push({
        id: `ddg-${Date.now()}`,
        source: 'DuckDuckGo',
        url: data.AbstractURL || '',
        type: 'wiki',
        title: data.Heading || query,
        summary: data.Abstract,
        content: data.Abstract,
        paragraphs: [data.Abstract],
        codeBlocks: [],
        links: data.RelatedTopics?.map((t: any) => t.FirstURL).filter(Boolean) || [],
        metadata: {
          language: 'en',
          wordCount: data.Abstract.split(' ').length,
          readingTime: 1
        },
        relevanceScore: 0.85,
        extractedAt: new Date().toISOString()
      });
    }

    // Adicionar tópicos relacionados
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 3)) {
        if (topic.Text) {
          packets.push({
            id: `ddg-related-${Date.now()}-${Math.random()}`,
            source: 'DuckDuckGo',
            url: topic.FirstURL || '',
            type: 'wiki',
            title: topic.Text.split(' - ')[0] || query,
            summary: topic.Text,
            content: topic.Text,
            paragraphs: [topic.Text],
            codeBlocks: [],
            links: [],
            metadata: {
              language: 'en',
              wordCount: topic.Text.split(' ').length,
              readingTime: 1
            },
            relevanceScore: 0.7,
            extractedAt: new Date().toISOString()
          });
        }
      }
    }

    return packets;
  }

  /**
   * Pesquisa no Hacker News
   */
  async searchHackerNews(query: string): Promise<KnowledgePacket[]> {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=5`;
    const response = await fetch(url);
    const data = await response.json();

    const packets: KnowledgePacket[] = [];

    if (data.hits) {
      for (const hit of data.hits) {
        packets.push({
          id: `hn-${hit.objectID}`,
          source: 'Hacker News',
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          type: 'news',
          title: hit.title,
          summary: hit.title,
          content: hit.title,
          paragraphs: [hit.title],
          codeBlocks: [],
          links: [hit.url].filter(Boolean),
          metadata: {
            author: hit.author,
            date: new Date(hit.created_at).toISOString(),
            language: 'en',
            wordCount: hit.title.split(' ').length,
            readingTime: 1
          },
          relevanceScore: Math.min(hit.points / 100, 1) * 0.8,
          extractedAt: new Date().toISOString()
        });
      }
    }

    return packets;
  }

  /**
   * Pesquisa no DEV.to
   */
  async searchDevTo(query: string): Promise<KnowledgePacket[]> {
    const url = `https://dev.to/api/articles?per_page=5&tag=${encodeURIComponent(query.split(' ')[0])}`;
    const response = await fetch(url);
    const data = await response.json();

    const packets: KnowledgePacket[] = [];

    if (Array.isArray(data)) {
      for (const article of data) {
        packets.push({
          id: `devto-${article.id}`,
          source: 'DEV.to',
          url: article.url,
          type: 'tutorial',
          title: article.title,
          summary: article.description || article.title,
          content: article.description || article.title,
          paragraphs: [article.description || article.title],
          codeBlocks: [],
          links: [article.url],
          metadata: {
            author: article.user?.name,
            date: article.published_at,
            language: 'en',
            wordCount: (article.description || '').split(' ').length,
            readingTime: article.reading_time_minutes || 5
          },
          relevanceScore: Math.min(article.positive_reactions_count / 50, 1) * 0.75,
          extractedAt: new Date().toISOString()
        });
      }
    }

    return packets;
  }

  /**
   * 🆕 Pesquisa no ArXiv (Papers Científicos)
   * API gratuita para papers de IA, ML, CS, Física, Matemática
   * NOTA: Usa HTTPS para evitar bloqueio de CORS no navegador
   */
  async searchArXiv(query: string, maxResults: number = 5): Promise<KnowledgePacket[]> {
    // IMPORTANTE: Usar HTTPS para evitar CORS no frontend
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;
    
    try {
      const response = await fetch(url);
      const xmlText = await response.text();
      
      const packets: KnowledgePacket[] = [];
      
      // Parse XML simples (ArXiv retorna Atom XML)
      const entries = xmlText.split('<entry>').slice(1);
      
      for (const entry of entries) {
        // Extrair campos do XML
        const getId = (tag: string) => {
          const match = entry.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`));
          return match ? match[1].trim() : '';
        };
        
        const getContent = (tag: string) => {
          const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
          return match ? match[1].trim().replace(/<[^>]+>/g, '') : '';
        };
        
        const id = getId('id');
        const title = getContent('title').replace(/\s+/g, ' ');
        const summary = getContent('summary').replace(/\s+/g, ' ');
        const published = getId('published');
        
        // Extrair autores
        const authorMatches = entry.match(/<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g) || [];
        const authors = authorMatches.map(a => {
          const nameMatch = a.match(/<name>([^<]+)<\/name>/);
          return nameMatch ? nameMatch[1] : '';
        }).filter(Boolean).join(', ');
        
        // Extrair categorias
        const categoryMatches = entry.match(/term="([^"]+)"/g) || [];
        const categories = categoryMatches.map(c => c.replace(/term="|"/g, '')).slice(0, 3);
        
        if (title && summary) {
          packets.push({
            id: `arxiv-${id.split('/').pop() || Date.now()}`,
            source: 'ArXiv',
            url: id.replace('http://', 'https://'),
            type: 'paper',
            title: title,
            summary: summary.slice(0, 500),
            content: summary,
            paragraphs: [summary],
            codeBlocks: [],
            links: [id.replace('http://', 'https://')],
            metadata: {
              author: authors,
              date: published,
              language: 'en',
              wordCount: summary.split(' ').length,
              readingTime: Math.ceil(summary.split(' ').length / 200)
            },
            relevanceScore: 0.92, // Papers científicos têm alta relevância
            extractedAt: new Date().toISOString()
          });
        }
      }
      
      console.log(`📚 ArXiv: ${packets.length} papers encontrados para "${query}"`);
      return packets;
      
    } catch (error) {
      console.warn('⚠️ ArXiv API falhou:', error);
      return [];
    }
  }

  /**
   * 🆕 Pesquisa no GitHub (Repositórios e Código)
   * API gratuita com limite de 60 req/hora sem auth
   */
  async searchGitHub(query: string, maxResults: number = 5): Promise<KnowledgePacket[]> {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${maxResults}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'WebResearchEngine/1.0'
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          console.warn('⚠️ GitHub API rate limit atingido');
        }
        return [];
      }
      
      const data = await response.json();
      const packets: KnowledgePacket[] = [];
      
      if (data.items) {
        for (const repo of data.items) {
          // Tentar buscar README
          let readmeContent = '';
          try {
            const readmeUrl = `https://api.github.com/repos/${repo.full_name}/readme`;
            const readmeResponse = await fetch(readmeUrl, {
              headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'WebResearchEngine/1.0'
              }
            });
            
            if (readmeResponse.ok) {
              const readmeData = await readmeResponse.json();
              if (readmeData.content) {
                // Decodificar base64
                readmeContent = atob(readmeData.content).slice(0, 2000);
              }
            }
          } catch {
            // README não disponível, usar descrição
          }
          
          const description = repo.description || 'Sem descrição';
          const content = readmeContent || description;
          
          packets.push({
            id: `github-${repo.id}`,
            source: 'GitHub',
            url: repo.html_url,
            type: 'code',
            title: repo.full_name,
            summary: description,
            content: content,
            paragraphs: content.split('\n').filter((p: string) => p.trim().length > 20),
            codeBlocks: [], // Código está no repo
            links: [
              repo.html_url,
              repo.homepage
            ].filter(Boolean),
            metadata: {
              author: repo.owner?.login,
              date: repo.updated_at,
              language: repo.language || 'Unknown',
              wordCount: content.split(' ').length,
              readingTime: Math.ceil(content.split(' ').length / 200)
            },
            relevanceScore: Math.min(repo.stargazers_count / 1000, 1) * 0.88,
            extractedAt: new Date().toISOString()
          });
        }
      }
      
      console.log(`🐙 GitHub: ${packets.length} repositórios encontrados para "${query}"`);
      return packets;
      
    } catch (error) {
      console.warn('⚠️ GitHub API falhou:', error);
      return [];
    }
  }

  /**
   * 🆕 Pesquisa no Stack Overflow (Q&A)
   * API gratuita com limite de 300 req/dia sem auth
   */
  async searchStackOverflow(query: string, maxResults: number = 5): Promise<KnowledgePacket[]> {
    const url = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow&pagesize=${maxResults}&filter=withbody`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const packets: KnowledgePacket[] = [];
      
      if (data.items) {
        for (const question of data.items) {
          // Limpar HTML do body
          const cleanBody = (question.body || '')
            .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '\n```\n$1\n```\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .trim();
          
          // Extrair blocos de código
          const codeMatches = (question.body || '').match(/<code[^>]*>([\s\S]*?)<\/code>/gi) || [];
          const codeBlocks = codeMatches.map(c => 
            c.replace(/<\/?code[^>]*>/gi, '')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
          );
          
          packets.push({
            id: `stackoverflow-${question.question_id}`,
            source: 'Stack Overflow',
            url: question.link,
            type: 'forum',
            title: question.title,
            summary: cleanBody.slice(0, 500),
            content: cleanBody,
            paragraphs: cleanBody.split('\n').filter((p: string) => p.trim().length > 20),
            codeBlocks: codeBlocks,
            links: [question.link],
            metadata: {
              author: question.owner?.display_name,
              date: new Date(question.creation_date * 1000).toISOString(),
              language: 'en',
              wordCount: cleanBody.split(' ').length,
              readingTime: Math.ceil(cleanBody.split(' ').length / 200)
            },
            relevanceScore: Math.min(question.score / 100, 1) * 0.85,
            extractedAt: new Date().toISOString()
          });
        }
      }
      
      console.log(`📝 Stack Overflow: ${packets.length} perguntas encontradas para "${query}"`);
      return packets;
      
    } catch (error) {
      console.warn('⚠️ Stack Overflow API falhou:', error);
      return [];
    }
  }


  // ---------------------------------------------------------------------------
  // PESQUISA COM NAVEGADOR (PLAYWRIGHT) - APENAS BACKEND
  // ---------------------------------------------------------------------------

  /**
   * Pesquisa usando navegador real (Playwright)
   * ⚠️ IMPORTANTE: Esta função só funciona no BACKEND (Node.js)
   * No frontend, use o BackendResearchClient para chamar a API do backend
   */
  async searchWithBrowser(query: ResearchQuery): Promise<KnowledgePacket[]> {
    // Detectar se está rodando no browser (frontend)
    const isBrowser = typeof window !== 'undefined';
    
    if (isBrowser) {
      console.warn('⚠️ searchWithBrowser() não funciona no browser. Use o backend API em /api/research/search');
      console.warn('💡 O Playwright só pode rodar no servidor Node.js');
      return [];
    }

    // Verificar se Playwright está disponível (apenas no Node.js)
    let playwright: any;
    try {
      // Dynamic import só funciona no Node.js
      playwright = await eval('import("playwright")');
    } catch {
      console.warn('⚠️ Playwright não instalado no backend. Execute: npm install playwright');
      return [];
    }

    const packets: KnowledgePacket[] = [];
    let browser: any = null;

    try {
      // Lançar navegador
      browser = await playwright.chromium.launch({
        headless: this.browserConfig.headless
      });

      const context = await browser.newContext({
        userAgent: this.browserConfig.userAgent,
        viewport: this.browserConfig.viewport
      });

      const page = await context.newPage();
      page.setDefaultTimeout(this.browserConfig.timeout);

      // Selecionar fontes baseado na query
      const sourcesToSearch = this.selectSources(query);

      for (const source of sourcesToSearch) {
        // Verificar rate limit
        if (!this.checkRateLimit(source.name, source.rateLimit)) {
          console.log(`⏳ Rate limit atingido para ${source.name}, pulando...`);
          continue;
        }

        try {
          const sourcePackets = await this.scrapeSource(page, source, query.query);
          packets.push(...sourcePackets);
          this.recordRequest(source.name);
        } catch (error) {
          console.warn(`⚠️ Erro ao scraping ${source.name}:`, error);
        }

        // Delay entre requests
        await this.delay(500 + Math.random() * 500);
      }

    } catch (error) {
      console.error('❌ Erro no navegador:', error);
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    return packets;
  }

  /**
   * Faz scraping de uma fonte específica
   */
  private async scrapeSource(
    page: any, 
    source: TrustedSource, 
    query: string
  ): Promise<KnowledgePacket[]> {
    const packets: KnowledgePacket[] = [];

    // Construir URL de busca
    let searchUrl: string;
    if (source.searchUrl) {
      searchUrl = source.searchUrl + encodeURIComponent(query);
    } else {
      searchUrl = source.url;
    }

    console.log(`🌐 Navegando para: ${searchUrl}`);

    try {
      await page.goto(searchUrl, { waitUntil: 'networkidle' });

      // Extrair conteúdo baseado nos seletores
      const content = await page.evaluate((selectors: any) => {
        const result: any = {
          title: '',
          content: '',
          paragraphs: [],
          codeBlocks: [],
          links: []
        };

        // Título
        if (selectors.title) {
          const titleEl = document.querySelector(selectors.title);
          result.title = titleEl?.textContent?.trim() || '';
        }

        // Conteúdo principal
        if (selectors.content) {
          const contentEls = document.querySelectorAll(selectors.content);
          contentEls.forEach((el: Element) => {
            const text = el.textContent?.trim();
            if (text && text.length > 50) {
              result.paragraphs.push(text);
            }
          });
          result.content = result.paragraphs.join('\n\n');
        }

        // Artigo completo
        if (selectors.article) {
          const articleEl = document.querySelector(selectors.article);
          if (articleEl && !result.content) {
            result.content = articleEl.textContent?.trim() || '';
            result.paragraphs = result.content.split('\n').filter((p: string) => p.trim().length > 50);
          }
        }

        // Blocos de código
        if (selectors.code) {
          const codeEls = document.querySelectorAll(selectors.code);
          codeEls.forEach((el: Element) => {
            const code = el.textContent?.trim();
            if (code) {
              result.codeBlocks.push(code);
            }
          });
        }

        // Links
        const linkEls = document.querySelectorAll('a[href]');
        linkEls.forEach((el: Element) => {
          const href = el.getAttribute('href');
          if (href && href.startsWith('http')) {
            result.links.push(href);
          }
        });

        return result;
      }, source.selectors);

      if (content.content || content.paragraphs.length > 0) {
        packets.push({
          id: `browser-${source.name}-${Date.now()}`,
          source: source.name,
          url: page.url(),
          type: source.type,
          title: content.title || query,
          summary: (content.paragraphs[0] || content.content).slice(0, 500),
          content: content.content,
          paragraphs: content.paragraphs,
          codeBlocks: content.codeBlocks,
          links: content.links.slice(0, 10),
          metadata: {
            language: 'en',
            wordCount: content.content.split(' ').length,
            readingTime: Math.ceil(content.content.split(' ').length / 200)
          },
          relevanceScore: source.priority / 10,
          extractedAt: new Date().toISOString()
        });
      }

    } catch (error) {
      console.warn(`⚠️ Erro ao extrair de ${source.name}:`, error);
    }

    return packets;
  }

  // ---------------------------------------------------------------------------
  // MÉTODOS AUXILIARES
  // ---------------------------------------------------------------------------

  /**
   * Seleciona fontes relevantes para a query
   */
  private selectSources(query: ResearchQuery): TrustedSource[] {
    // Se fontes específicas foram solicitadas
    if (query.sources && query.sources.length > 0) {
      return query.sources
        .map(name => this.sources.get(name))
        .filter((s): s is TrustedSource => s !== undefined);
    }

    // Detectar tipo de query e selecionar fontes apropriadas
    const queryLower = query.query.toLowerCase();
    const selectedSources: TrustedSource[] = [];

    // Documentação
    if (queryLower.includes('como') || queryLower.includes('how to') || 
        queryLower.includes('tutorial') || queryLower.includes('guia')) {
      selectedSources.push(
        ...Array.from(this.sources.values())
          .filter(s => s.type === 'documentation' || s.type === 'tutorial')
      );
    }

    // Notícias
    if (query.includeNews || queryLower.includes('notícia') || 
        queryLower.includes('news') || queryLower.includes('lançamento')) {
      selectedSources.push(
        ...Array.from(this.sources.values())
          .filter(s => s.type === 'news')
      );
    }

    // Papers/Ciência
    if (queryLower.includes('paper') || queryLower.includes('research') ||
        queryLower.includes('estudo') || queryLower.includes('científico')) {
      selectedSources.push(
        ...Array.from(this.sources.values())
          .filter(s => s.type === 'paper')
      );
    }

    // Código
    if (query.includeCode || queryLower.includes('código') || 
        queryLower.includes('code') || queryLower.includes('github')) {
      selectedSources.push(
        ...Array.from(this.sources.values())
          .filter(s => s.type === 'code')
      );
    }

    // Se nenhuma fonte específica, usar as mais confiáveis
    if (selectedSources.length === 0) {
      selectedSources.push(
        ...Array.from(this.sources.values())
          .filter(s => s.priority >= 8)
      );
    }

    // Ordenar por prioridade e limitar
    return selectedSources
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);
  }

  /**
   * Verifica rate limit para uma fonte
   */
  private checkRateLimit(sourceName: string, limit: number): boolean {
    const now = Date.now();
    const requests = this.rateLimitTracker.get(sourceName) || [];
    
    // Remover requests antigos (mais de 1 minuto)
    const recentRequests = requests.filter(t => now - t < 60000);
    this.rateLimitTracker.set(sourceName, recentRequests);

    return recentRequests.length < limit;
  }

  /**
   * Registra uma request para rate limiting
   */
  private recordRequest(sourceName: string): void {
    const requests = this.rateLimitTracker.get(sourceName) || [];
    requests.push(Date.now());
    this.rateLimitTracker.set(sourceName, requests);
  }

  /**
   * Gera resumo dos resultados
   */
  private generateSummary(packets: KnowledgePacket[], query: string): string {
    if (packets.length === 0) {
      return `Nenhum resultado encontrado para "${query}".`;
    }

    const sources = [...new Set(packets.map(p => p.source))];
    const types = [...new Set(packets.map(p => p.type))];
    const totalWords = packets.reduce((sum, p) => sum + p.metadata.wordCount, 0);

    let summary = `📊 **Pesquisa: "${query}"**\n\n`;
    summary += `- **${packets.length} resultados** de ${sources.length} fontes\n`;
    summary += `- **Fontes:** ${sources.join(', ')}\n`;
    summary += `- **Tipos:** ${types.join(', ')}\n`;
    summary += `- **Total:** ~${totalWords} palavras\n\n`;

    // Top 3 resultados
    summary += `**Principais resultados:**\n`;
    packets.slice(0, 3).forEach((p, i) => {
      summary += `${i + 1}. **${p.title}** (${p.source})\n`;
      summary += `   ${p.summary.slice(0, 150)}...\n`;
    });

    return summary;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ---------------------------------------------------------------------------
  // MÉTODOS PÚBLICOS DE CONVENIÊNCIA
  // ---------------------------------------------------------------------------

  /**
   * Pesquisa rápida na Wikipedia
   */
  async quickWikipedia(query: string, lang: string = 'pt'): Promise<KnowledgePacket[]> {
    return this.searchWikipedia(query, lang);
  }

  /**
   * Pesquisa rápida de notícias tech
   */
  async quickNews(query: string): Promise<KnowledgePacket[]> {
    return this.searchHackerNews(query);
  }

  /**
   * Pesquisa rápida de tutoriais
   */
  async quickTutorials(query: string): Promise<KnowledgePacket[]> {
    return this.searchDevTo(query);
  }

  /**
   * 🆕 Pesquisa rápida de papers científicos (ArXiv)
   */
  async quickPapers(query: string): Promise<KnowledgePacket[]> {
    return this.searchArXiv(query, 5);
  }

  /**
   * 🆕 Pesquisa rápida de repositórios (GitHub)
   */
  async quickGitHub(query: string): Promise<KnowledgePacket[]> {
    return this.searchGitHub(query, 5);
  }

  /**
   * 🆕 Pesquisa rápida de Q&A (Stack Overflow)
   */
  async quickStackOverflow(query: string): Promise<KnowledgePacket[]> {
    return this.searchStackOverflow(query, 5);
  }

  /**
   * Pesquisa completa com todas as fontes
   */
  async deepResearch(query: string): Promise<ResearchResult> {
    return this.research({
      query,
      maxResults: 20,
      includeCode: true,
      includeNews: true
    });
  }

  /**
   * 🧠 PESQUISA INTELIGENTE - Usa SmartQueryAnalyzer para otimizar queries
   * 
   * Este método analisa a intenção do usuário, extrai tópicos relevantes,
   * e gera queries otimizadas para cada API específica.
   */
  async smartResearch(userPrompt: string, maxResults: number = 15): Promise<ResearchResult> {
    const startTime = Date.now();
    const packets: KnowledgePacket[] = [];
    
    console.log('🧠 Iniciando pesquisa inteligente...');
    
    // 1. Importar e usar o SmartQueryAnalyzer
    const { smartQueryAnalyzer } = await import('./SmartQueryAnalyzer');
    const analysis = smartQueryAnalyzer.analyze(userPrompt);
    
    console.log(`📊 Análise: ${analysis.topics.length} tópicos, ${analysis.totalQueries} queries`);
    console.log(`🎯 Intenção: ${analysis.intent.primaryIntent} (${(analysis.intent.confidence * 100).toFixed(0)}%)`);
    console.log(`📦 Tipo de projeto: ${analysis.intent.projectType}`);
    
    // 2. Executar queries por tópico (em paralelo por estratégia)
    const queryPromises: Promise<KnowledgePacket[]>[] = [];
    
    for (const topic of analysis.topics) {
      console.log(`🔍 Pesquisando tópico: ${topic.name} (${topic.queries.length} queries)`);
      
      for (const query of topic.queries) {
        const promise = this.executeOptimizedQuery(query);
        queryPromises.push(promise);
      }
    }
    
    // 3. Aguardar todas as queries (com timeout)
    const results = await Promise.allSettled(
      queryPromises.map(p => 
        Promise.race([
          p,
          new Promise<KnowledgePacket[]>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000)
          )
        ])
      )
    );
    
    // 4. Coletar resultados bem-sucedidos
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        packets.push(...result.value);
      }
    }
    
    // 5. Remover duplicatas por URL
    const uniquePackets = this.deduplicatePackets(packets);
    
    // 6. Ordenar por relevância
    uniquePackets.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // 7. Limitar resultados
    const limitedPackets = uniquePackets.slice(0, maxResults);
    
    // 8. Gerar resumo inteligente
    const summary = this.generateSmartSummary(limitedPackets, analysis);
    
    const result: ResearchResult = {
      query: userPrompt,
      packets: limitedPackets,
      summary,
      sources: [...new Set(limitedPackets.map(p => p.source))],
      totalResults: uniquePackets.length,
      searchTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Pesquisa inteligente concluída: ${limitedPackets.length} resultados únicos em ${result.searchTime}ms`);
    
    return result;
  }

  /**
   * Executa uma query otimizada para a API específica
   */
  private async executeOptimizedQuery(query: import('./SmartQueryAnalyzer').OptimizedQuery): Promise<KnowledgePacket[]> {
    try {
      switch (query.targetApi) {
        case 'wikipedia':
          return await this.searchWikipedia(query.query, query.language);
        case 'github':
          return await this.searchGitHub(query.query, 3);
        case 'stackoverflow':
          return await this.searchStackOverflow(query.query, 3);
        case 'arxiv':
          return await this.searchArXiv(query.query, 3);
        case 'devto':
          return await this.searchDevTo(query.query);
        case 'hackernews':
          return await this.searchHackerNews(query.query);
        case 'duckduckgo':
          return await this.searchDuckDuckGo(query.query);
        default:
          return [];
      }
    } catch (error) {
      console.warn(`⚠️ Query falhou (${query.targetApi}): ${query.query}`, error);
      return [];
    }
  }

  /**
   * Remove pacotes duplicados por URL
   */
  private deduplicatePackets(packets: KnowledgePacket[]): KnowledgePacket[] {
    const seen = new Set<string>();
    return packets.filter(p => {
      const key = p.url || p.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Gera resumo inteligente baseado na análise
   */
  private generateSmartSummary(
    packets: KnowledgePacket[], 
    analysis: import('./SmartQueryAnalyzer').AnalysisResult
  ): string {
    if (packets.length === 0) {
      return 'Nenhum resultado encontrado para esta pesquisa.';
    }
    
    const sourceCount = new Set(packets.map(p => p.source)).size;
    const topSources = [...new Set(packets.slice(0, 5).map(p => p.source))].join(', ');
    
    let summary = `🧠 **Pesquisa Inteligente Concluída**\n\n`;
    summary += `📊 **Análise do Prompt:**\n`;
    summary += `- Intenção: ${analysis.intent.primaryIntent} (${(analysis.intent.confidence * 100).toFixed(0)}% confiança)\n`;
    summary += `- Tipo de projeto: ${analysis.intent.projectType}\n`;
    summary += `- Complexidade: ${analysis.intent.complexity}\n\n`;
    summary += `🔍 **Resultados:**\n`;
    summary += `- ${packets.length} resultados de ${sourceCount} fontes\n`;
    summary += `- Principais fontes: ${topSources}\n`;
    summary += `- Tópicos pesquisados: ${analysis.topics.map(t => t.name).join(', ')}\n\n`;
    
    // Adicionar destaques dos primeiros resultados
    summary += `📌 **Destaques:**\n`;
    packets.slice(0, 3).forEach((p, i) => {
      summary += `${i + 1}. **${p.title}** (${p.source})\n`;
      summary += `   ${p.summary.slice(0, 150)}...\n`;
    });
    
    return summary;
  }

  /**
   * 🚀 PESQUISA ULTRA-INTELIGENTE - Máxima cobertura com cache e expansão
   * 
   * Este método combina:
   * - SmartQueryAnalyzer: Análise de intenção
   * - QueryExpander: Expansão com sinônimos e traduções
   * - ResearchCache: Cache inteligente para evitar chamadas repetidas
   */
  async ultraSmartResearch(userPrompt: string, maxResults: number = 20): Promise<ResearchResult> {
    const startTime = Date.now();
    
    console.log('🚀 Iniciando pesquisa ULTRA-INTELIGENTE...');
    
    // 1. Verificar cache primeiro
    const { researchCache } = await import('./ResearchCache');
    const cachedResult = researchCache.getResult(userPrompt);
    
    if (cachedResult) {
      console.log('💾 Resultado encontrado no cache!');
      return {
        ...cachedResult,
        searchTime: Date.now() - startTime
      };
    }
    
    // 2. Analisar intenção
    const { smartQueryAnalyzer } = await import('./SmartQueryAnalyzer');
    const analysis = smartQueryAnalyzer.analyze(userPrompt);
    
    console.log(`🎯 Intenção: ${analysis.intent.primaryIntent}`);
    console.log(`📦 Tipo: ${analysis.intent.projectType}`);
    console.log(`🔧 Complexidade: ${analysis.intent.complexity}`);
    
    // 3. Expandir queries
    const { queryExpander } = await import('./QueryExpander');
    const apiQueries = queryExpander.generateApiQueries(userPrompt);
    
    console.log(`🔄 Queries expandidas para ${Object.keys(apiQueries).length} APIs`);
    
    // 4. Executar pesquisas em paralelo com cache
    const packets: KnowledgePacket[] = [];
    const searchPromises: Promise<void>[] = [];
    
    // Wikipedia
    for (const query of apiQueries.wikipedia.slice(0, 3)) {
      searchPromises.push(
        this.searchWithCache('Wikipedia', query, () => this.searchWikipedia(query, 'en'))
          .then(results => { packets.push(...results); })
      );
    }
    
    // GitHub
    for (const query of apiQueries.github.slice(0, 3)) {
      searchPromises.push(
        this.searchWithCache('GitHub', query, () => this.searchGitHub(query, 3))
          .then(results => { packets.push(...results); })
      );
    }
    
    // Stack Overflow
    for (const query of apiQueries.stackoverflow.slice(0, 2)) {
      searchPromises.push(
        this.searchWithCache('Stack Overflow', query, () => this.searchStackOverflow(query, 3))
          .then(results => { packets.push(...results); })
      );
    }
    
    // DEV.to
    for (const query of apiQueries.devto.slice(0, 2)) {
      searchPromises.push(
        this.searchWithCache('DEV.to', query, () => this.searchDevTo(query))
          .then(results => { packets.push(...results); })
      );
    }
    
    // ArXiv (se for técnico/científico)
    if (analysis.intent.complexity === 'complex' || analysis.intent.complexity === 'enterprise') {
      for (const query of apiQueries.arxiv.slice(0, 2)) {
        searchPromises.push(
          this.searchWithCache('ArXiv', query, () => this.searchArXiv(query, 3))
            .then(results => { packets.push(...results); })
        );
      }
    }
    
    // DuckDuckGo
    for (const query of apiQueries.duckduckgo.slice(0, 2)) {
      searchPromises.push(
        this.searchWithCache('DuckDuckGo', query, () => this.searchDuckDuckGo(query))
          .then(results => { packets.push(...results); })
      );
    }
    
    // Hacker News (se incluir notícias)
    for (const query of apiQueries.hackernews.slice(0, 2)) {
      searchPromises.push(
        this.searchWithCache('Hacker News', query, () => this.searchHackerNews(query))
          .then(results => { packets.push(...results); })
      );
    }
    
    // 5. Aguardar todas as pesquisas (com timeout)
    await Promise.allSettled(
      searchPromises.map(p => 
        Promise.race([
          p,
          new Promise<void>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 15000)
          )
        ])
      )
    );
    
    // 6. Processar resultados
    const uniquePackets = this.deduplicatePackets(packets);
    
    // 7. Calcular relevância aprimorada
    const scoredPackets = this.calculateEnhancedRelevance(uniquePackets, analysis);
    
    // 8. Ordenar e limitar
    scoredPackets.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const limitedPackets = scoredPackets.slice(0, maxResults);
    
    // 9. Gerar resumo
    const summary = this.generateUltraSmartSummary(limitedPackets, analysis, apiQueries);
    
    const result: ResearchResult = {
      query: userPrompt,
      packets: limitedPackets,
      summary,
      sources: [...new Set(limitedPackets.map(p => p.source))],
      totalResults: uniquePackets.length,
      searchTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
    // 10. Salvar no cache
    researchCache.setResult(userPrompt, result);
    
    console.log(`🚀 Pesquisa ULTRA concluída: ${limitedPackets.length} resultados em ${result.searchTime}ms`);
    
    return result;
  }

  /**
   * Pesquisa com cache integrado
   */
  private async searchWithCache(
    source: string, 
    query: string, 
    searchFn: () => Promise<KnowledgePacket[]>
  ): Promise<KnowledgePacket[]> {
    try {
      const { researchCache } = await import('./ResearchCache');
      
      // Verificar cache
      const cached = researchCache.getPackets(query, source);
      if (cached) {
        return cached;
      }
      
      // Executar pesquisa
      const results = await searchFn();
      
      // Salvar no cache
      if (results.length > 0) {
        researchCache.setPackets(query, source, results);
      }
      
      return results;
    } catch (error) {
      console.warn(`⚠️ Erro na pesquisa ${source}: ${query}`, error);
      return [];
    }
  }

  /**
   * Calcula relevância aprimorada baseada na análise
   */
  private calculateEnhancedRelevance(
    packets: KnowledgePacket[],
    analysis: import('./SmartQueryAnalyzer').AnalysisResult
  ): KnowledgePacket[] {
    const intentKeywords = this.getIntentKeywords(analysis.intent.primaryIntent);
    const projectKeywords = this.getProjectKeywords(analysis.intent.projectType);
    
    return packets.map(packet => {
      let score = packet.relevanceScore;
      const contentLower = (packet.title + ' ' + packet.summary + ' ' + packet.content).toLowerCase();
      
      // Boost por keywords de intenção
      for (const keyword of intentKeywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          score += 0.05;
        }
      }
      
      // Boost por keywords de projeto
      for (const keyword of projectKeywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          score += 0.03;
        }
      }
      
      // Boost por fonte confiável
      const trustedSources = ['Wikipedia', 'MDN Web Docs', 'GitHub', 'ArXiv'];
      if (trustedSources.includes(packet.source)) {
        score += 0.1;
      }
      
      // Boost por código (se for projeto técnico)
      if (packet.codeBlocks.length > 0 && analysis.intent.primaryIntent === 'create_app') {
        score += 0.08;
      }
      
      // Normalizar score
      score = Math.min(score, 1.0);
      
      return { ...packet, relevanceScore: score };
    });
  }

  /**
   * Obtém keywords por intenção
   */
  private getIntentKeywords(intent: string): string[] {
    const keywords: Record<string, string[]> = {
      'create_app': ['tutorial', 'example', 'how to', 'build', 'create', 'implementation'],
      'clone_app': ['clone', 'replica', 'similar', 'like', 'alternative'],
      'learn_tech': ['learn', 'tutorial', 'guide', 'introduction', 'basics'],
      'solve_problem': ['fix', 'solve', 'error', 'issue', 'solution', 'debug'],
      'find_library': ['library', 'package', 'framework', 'tool', 'npm'],
      'design_ui': ['design', 'UI', 'UX', 'interface', 'layout', 'style'],
      'business_model': ['business', 'monetization', 'revenue', 'pricing'],
      'integration': ['API', 'integration', 'connect', 'webhook'],
      'optimization': ['performance', 'optimize', 'fast', 'efficient'],
      'security': ['security', 'secure', 'authentication', 'encryption']
    };
    return keywords[intent] || [];
  }

  /**
   * Obtém keywords por tipo de projeto
   */
  private getProjectKeywords(projectType: string): string[] {
    const keywords: Record<string, string[]> = {
      'ecommerce': ['cart', 'checkout', 'product', 'payment', 'store'],
      'saas': ['subscription', 'dashboard', 'multi-tenant', 'billing'],
      'social_network': ['feed', 'post', 'follow', 'like', 'comment'],
      'dashboard': ['analytics', 'chart', 'metrics', 'report'],
      'fintech': ['payment', 'transaction', 'banking', 'wallet'],
      'healthcare': ['patient', 'medical', 'health', 'appointment'],
      'education': ['course', 'lesson', 'student', 'quiz'],
      'marketplace': ['seller', 'buyer', 'listing', 'review'],
      'streaming': ['video', 'player', 'playlist', 'stream']
    };
    return keywords[projectType] || [];
  }

  /**
   * Gera resumo ultra-inteligente
   */
  private generateUltraSmartSummary(
    packets: KnowledgePacket[],
    analysis: import('./SmartQueryAnalyzer').AnalysisResult,
    apiQueries: Record<string, string[]>
  ): string {
    if (packets.length === 0) {
      return 'Nenhum resultado encontrado para esta pesquisa.';
    }
    
    const sourceCount = new Set(packets.map(p => p.source)).size;
    const totalQueries = Object.values(apiQueries).flat().length;
    
    let summary = `🚀 **Pesquisa Ultra-Inteligente Concluída**\n\n`;
    
    summary += `📊 **Análise Cognitiva:**\n`;
    summary += `- 🎯 Intenção: ${analysis.intent.primaryIntent} (${(analysis.intent.confidence * 100).toFixed(0)}%)\n`;
    summary += `- 📦 Tipo: ${analysis.intent.projectType}\n`;
    summary += `- 🔧 Complexidade: ${analysis.intent.complexity}\n`;
    summary += `- 🌐 Idioma: ${analysis.intent.language}\n\n`;
    
    summary += `🔍 **Cobertura de Pesquisa:**\n`;
    summary += `- ${totalQueries} queries expandidas\n`;
    summary += `- ${packets.length} resultados únicos\n`;
    summary += `- ${sourceCount} fontes consultadas\n`;
    summary += `- Tópicos: ${analysis.topics.map(t => t.name).join(', ')}\n\n`;
    
    // Agrupar por fonte
    const bySource = new Map<string, KnowledgePacket[]>();
    packets.forEach(p => {
      const list = bySource.get(p.source) || [];
      list.push(p);
      bySource.set(p.source, list);
    });
    
    summary += `📚 **Por Fonte:**\n`;
    for (const [source, sourcePackets] of bySource) {
      summary += `- ${source}: ${sourcePackets.length} resultados\n`;
    }
    
    summary += `\n📌 **Top 5 Resultados:**\n`;
    packets.slice(0, 5).forEach((p, i) => {
      const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i];
      summary += `${emoji} **${p.title}** (${p.source})\n`;
      summary += `   ${p.summary.slice(0, 120)}...\n`;
      if (p.url) summary += `   🔗 ${p.url}\n`;
    });
    
    return summary;
  }

  /**
   * Lista todas as fontes disponíveis
   */
  listSources(): TrustedSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Adiciona uma fonte customizada
   */
  addSource(source: TrustedSource): void {
    this.sources.set(source.name, source);
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// SINGLETON E EXPORTS
// ============================================================================

export const webResearchEngine = new WebResearchEngine();

// Export default
export default WebResearchEngine;
