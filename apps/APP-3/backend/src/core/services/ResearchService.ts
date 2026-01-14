/**
 * 🌐 RESEARCH SERVICE - Pesquisa Web no Backend
 * 
 * Este serviço roda no SERVIDOR (Node.js), não no navegador do usuário.
 * Isso resolve o problema de CORS e permite usar Playwright para scraping.
 * 
 * @version 1.0.0
 */

import { GoogleGenAI } from '@google/genai';

// ============================================================================
// TIPOS
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
  metadata: {
    author?: string;
    date?: string;
    language: string;
    wordCount: number;
  };
  relevanceScore: number;
  extractedAt: string;
}

export interface ResearchQuery {
  query: string;
  sources?: string[];
  maxResults?: number;
  language?: string;
  includeCode?: boolean;
  includeNews?: boolean;
  includePapers?: boolean;
  usePlaywright?: boolean;
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

// ============================================================================
// RESEARCH SERVICE
// ============================================================================

export class ResearchService {
  private playwright: any = null;
  private playwrightAvailable: boolean = false;

  constructor() {
    this.initPlaywright();
  }

  /**
   * Inicializa Playwright (lazy loading)
   */
  private async initPlaywright(): Promise<void> {
    try {
      this.playwright = await import('playwright');
      this.playwrightAvailable = true;
      console.log('✅ Playwright disponível no backend');
    } catch (error) {
      console.warn('⚠️ Playwright não instalado. Execute: npm install playwright');
      this.playwrightAvailable = false;
    }
  }

  /**
   * Pesquisa principal - combina APIs + Playwright
   */
  async research(query: ResearchQuery): Promise<ResearchResult> {
    const startTime = Date.now();
    const packets: KnowledgePacket[] = [];

    console.log(`🔍 [Backend] Pesquisando: "${query.query}"`);

    // 1. Pesquisar via APIs (sempre funciona)
    const apiResults = await this.searchAPIs(query);
    packets.push(...apiResults);

    // 2. Se solicitado e disponível, usar Playwright para scraping
    if (query.usePlaywright && this.playwrightAvailable) {
      const browserResults = await this.searchWithPlaywright(query);
      packets.push(...browserResults);
    }

    // 3. Ordenar por relevância
    packets.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // 4. Limitar resultados
    const limitedPackets = packets.slice(0, query.maxResults || 10);

    // 5. Gerar resumo
    const summary = this.generateSummary(limitedPackets, query.query);

    return {
      query: query.query,
      packets: limitedPackets,
      summary,
      sources: [...new Set(limitedPackets.map(p => p.source))],
      totalResults: packets.length,
      searchTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }

  // ==========================================================================
  // PESQUISA VIA APIs (SEM CORS - RODA NO SERVIDOR)
  // ==========================================================================

  /**
   * Pesquisa usando APIs gratuitas
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

    // DuckDuckGo (sempre)
    try {
      const ddgResults = await this.searchDuckDuckGo(query.query);
      packets.push(...ddgResults);
    } catch (error) {
      console.warn('⚠️ DuckDuckGo API falhou:', error);
    }

    // Hacker News (notícias)
    if (query.includeNews) {
      try {
        const hnResults = await this.searchHackerNews(query.query);
        packets.push(...hnResults);
      } catch (error) {
        console.warn('⚠️ Hacker News API falhou:', error);
      }
    }

    // ArXiv (papers científicos) - AGORA FUNCIONA SEM CORS!
    if (query.includePapers || this.isScientificQuery(queryLower)) {
      try {
        const arxivResults = await this.searchArXiv(query.query);
        packets.push(...arxivResults);
      } catch (error) {
        console.warn('⚠️ ArXiv API falhou:', error);
      }
    }

    // GitHub (código)
    if (query.includeCode || this.isProgrammingQuery(queryLower)) {
      try {
        const githubResults = await this.searchGitHub(query.query);
        packets.push(...githubResults);
      } catch (error) {
        console.warn('⚠️ GitHub API falhou:', error);
      }
    }

    // Stack Overflow (Q&A)
    if (query.includeCode || this.isProgrammingQuery(queryLower)) {
      try {
        const soResults = await this.searchStackOverflow(query.query);
        packets.push(...soResults);
      } catch (error) {
        console.warn('⚠️ Stack Overflow API falhou:', error);
      }
    }

    // DEV.to (tutoriais)
    try {
      const devtoResults = await this.searchDevTo(query.query);
      packets.push(...devtoResults);
    } catch (error) {
      console.warn('⚠️ DEV.to API falhou:', error);
    }

    return packets;
  }

  /**
   * Wikipedia API
   */
  async searchWikipedia(query: string, lang: string = 'en'): Promise<KnowledgePacket[]> {
    const baseUrl = lang === 'pt'
      ? 'https://pt.wikipedia.org/w/api.php'
      : 'https://en.wikipedia.org/w/api.php';

    const searchUrl = `${baseUrl}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    const packets: KnowledgePacket[] = [];

    if (searchData.query?.search) {
      for (const result of searchData.query.search.slice(0, 3)) {
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
              metadata: {
                language: lang,
                wordCount: page.extract.split(' ').length
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
   * DuckDuckGo Instant Answers
   */
  async searchDuckDuckGo(query: string): Promise<KnowledgePacket[]> {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
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
        metadata: {
          language: 'en',
          wordCount: data.Abstract.split(' ').length
        },
        relevanceScore: 0.85,
        extractedAt: new Date().toISOString()
      });
    }

    return packets;
  }

  /**
   * Hacker News API
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
          metadata: {
            author: hit.author,
            date: new Date(hit.created_at).toISOString(),
            language: 'en',
            wordCount: hit.title.split(' ').length
          },
          relevanceScore: Math.min(hit.points / 100, 1) * 0.8,
          extractedAt: new Date().toISOString()
        });
      }
    }

    return packets;
  }

  /**
   * ArXiv API - Papers Científicos
   * AGORA FUNCIONA! Roda no servidor, sem CORS
   */
  async searchArXiv(query: string, maxResults: number = 5): Promise<KnowledgePacket[]> {
    // No servidor, podemos usar HTTP ou HTTPS sem problemas de CORS
    const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;

    const response = await fetch(url);
    const xmlText = await response.text();

    const packets: KnowledgePacket[] = [];

    // Parse XML simples
    const entries = xmlText.split('<entry>').slice(1);

    for (const entry of entries) {
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
          metadata: {
            author: authors,
            date: published,
            language: 'en',
            wordCount: summary.split(' ').length
          },
          relevanceScore: 0.92,
          extractedAt: new Date().toISOString()
        });
      }
    }

    console.log(`📚 ArXiv: ${packets.length} papers encontrados`);
    return packets;
  }

  /**
   * GitHub API
   */
  async searchGitHub(query: string, maxResults: number = 5): Promise<KnowledgePacket[]> {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${maxResults}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ResearchService/1.0'
      }
    });

    if (!response.ok) {
      if (response.status === 403) {
        console.warn('⚠️ GitHub API rate limit');
      }
      return [];
    }

    const data = await response.json();
    const packets: KnowledgePacket[] = [];

    if (data.items) {
      for (const repo of data.items) {
        const description = repo.description || 'Sem descrição';

        packets.push({
          id: `github-${repo.id}`,
          source: 'GitHub',
          url: repo.html_url,
          type: 'code',
          title: repo.full_name,
          summary: description,
          content: description,
          paragraphs: [description],
          codeBlocks: [],
          metadata: {
            author: repo.owner?.login,
            date: repo.updated_at,
            language: repo.language || 'Unknown',
            wordCount: description.split(' ').length
          },
          relevanceScore: Math.min(repo.stargazers_count / 1000, 1) * 0.88,
          extractedAt: new Date().toISOString()
        });
      }
    }

    console.log(`🐙 GitHub: ${packets.length} repositórios encontrados`);
    return packets;
  }

  /**
   * Stack Overflow API
   */
  async searchStackOverflow(query: string, maxResults: number = 5): Promise<KnowledgePacket[]> {
    const url = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow&pagesize=${maxResults}&filter=withbody`;

    const response = await fetch(url);
    const data = await response.json();

    const packets: KnowledgePacket[] = [];

    if (data.items) {
      for (const question of data.items) {
        const cleanBody = (question.body || '')
          .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '\n```\n$1\n```\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .trim();

        const codeMatches = (question.body || '').match(/<code[^>]*>([\s\S]*?)<\/code>/gi) || [];
        const codeBlocks = codeMatches.map((c: string) =>
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
          metadata: {
            author: question.owner?.display_name,
            date: new Date(question.creation_date * 1000).toISOString(),
            language: 'en',
            wordCount: cleanBody.split(' ').length
          },
          relevanceScore: Math.min(question.score / 100, 1) * 0.85,
          extractedAt: new Date().toISOString()
        });
      }
    }

    console.log(`📝 Stack Overflow: ${packets.length} perguntas encontradas`);
    return packets;
  }

  /**
   * DEV.to API
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
          metadata: {
            author: article.user?.name,
            date: article.published_at,
            language: 'en',
            wordCount: (article.description || '').split(' ').length
          },
          relevanceScore: Math.min(article.positive_reactions_count / 50, 1) * 0.75,
          extractedAt: new Date().toISOString()
        });
      }
    }

    return packets;
  }

  // ==========================================================================
  // PESQUISA COM PLAYWRIGHT (SCRAPING AVANÇADO)
  // ==========================================================================

  /**
   * Pesquisa usando Playwright para scraping
   */
  async searchWithPlaywright(query: ResearchQuery): Promise<KnowledgePacket[]> {
    if (!this.playwrightAvailable || !this.playwright) {
      console.warn('⚠️ Playwright não disponível');
      return [];
    }

    const packets: KnowledgePacket[] = [];
    let browser: any = null;

    try {
      browser = await this.playwright.chromium.launch({
        headless: true
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        viewport: { width: 1920, height: 1080 }
      });

      const page = await context.newPage();
      page.setDefaultTimeout(30000);

      // Exemplo: Scraping do MDN
      try {
        const mdnUrl = `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(query.query)}`;
        await page.goto(mdnUrl, { waitUntil: 'networkidle' });

        const results = await page.evaluate(() => {
          const items: any[] = [];
          document.querySelectorAll('.search-results article').forEach((el: Element) => {
            const titleEl = el.querySelector('h2 a');
            const summaryEl = el.querySelector('p');
            if (titleEl && summaryEl) {
              items.push({
                title: titleEl.textContent?.trim() || '',
                url: (titleEl as HTMLAnchorElement).href,
                summary: summaryEl.textContent?.trim() || ''
              });
            }
          });
          return items.slice(0, 3);
        });

        for (const result of results) {
          packets.push({
            id: `mdn-${Date.now()}-${Math.random()}`,
            source: 'MDN Web Docs',
            url: result.url,
            type: 'documentation',
            title: result.title,
            summary: result.summary,
            content: result.summary,
            paragraphs: [result.summary],
            codeBlocks: [],
            metadata: {
              language: 'en',
              wordCount: result.summary.split(' ').length
            },
            relevanceScore: 0.95,
            extractedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn('⚠️ MDN scraping falhou:', error);
      }

    } catch (error) {
      console.error('❌ Erro no Playwright:', error);
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    return packets;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private isScientificQuery(query: string): boolean {
    const keywords = ['paper', 'research', 'algorithm', 'neural', 'machine learning',
      'deep learning', 'ai', 'artificial intelligence', 'model', 'transformer', 'llm',
      'quantum', 'physics', 'mathematics', 'científico', 'pesquisa', 'algoritmo'];
    return keywords.some(kw => query.includes(kw));
  }

  private isProgrammingQuery(query: string): boolean {
    const keywords = ['error', 'bug', 'fix', 'how to', 'como', 'why', 'por que',
      'não funciona', 'not working', 'exception', 'problema', 'problem',
      'github', 'código', 'code', 'library', 'biblioteca', 'framework'];
    return keywords.some(kw => query.includes(kw));
  }

  private generateSummary(packets: KnowledgePacket[], query: string): string {
    if (packets.length === 0) {
      return `Nenhum resultado encontrado para "${query}".`;
    }

    const sources = [...new Set(packets.map(p => p.source))];
    const types = [...new Set(packets.map(p => p.type))];

    let summary = `📊 **Pesquisa: "${query}"**\n\n`;
    summary += `- **${packets.length} resultados** de ${sources.length} fontes\n`;
    summary += `- **Fontes:** ${sources.join(', ')}\n`;
    summary += `- **Tipos:** ${types.join(', ')}\n\n`;

    summary += `**Principais resultados:**\n`;
    packets.slice(0, 3).forEach((p, i) => {
      summary += `${i + 1}. **${p.title}** (${p.source})\n`;
      summary += `   ${p.summary.slice(0, 150)}...\n`;
    });

    return summary;
  }

  /**
   * Verifica se Playwright está disponível
   */
  isPlaywrightAvailable(): boolean {
    return this.playwrightAvailable;
  }
}

// Singleton
export const researchService = new ResearchService();
