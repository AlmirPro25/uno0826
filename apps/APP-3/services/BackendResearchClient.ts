/**
 * 🌐 BACKEND RESEARCH CLIENT
 * 
 * Cliente para chamar a API de pesquisa no backend.
 * Resolve o problema de CORS - todas as pesquisas passam pelo servidor.
 * 
 * @version 1.0.0
 */

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

export interface ResearchStatus {
  service: string;
  version: string;
  playwrightAvailable: boolean;
  apis: Array<{ name: string; status: string }>;
  timestamp: string;
}

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const API_BASE = `${BACKEND_URL}/api/research`;

// ============================================================================
// CLIENTE
// ============================================================================

export class BackendResearchClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE;
  }

  /**
   * Pesquisa completa usando múltiplas fontes
   */
  async search(query: ResearchQuery): Promise<ResearchResult> {
    console.log(`🔍 [Client] Enviando pesquisa para backend: "${query.query}"`);

    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      throw new Error(`Erro na pesquisa: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro desconhecido');
    }

    console.log(`✅ [Client] Pesquisa concluída: ${data.data.packets.length} resultados`);
    return data.data;
  }

  /**
   * Pesquisa rápida na Wikipedia
   */
  async searchWikipedia(query: string, lang: string = 'en'): Promise<KnowledgePacket[]> {
    const response = await fetch(
      `${this.baseUrl}/wikipedia/${encodeURIComponent(query)}?lang=${lang}`
    );

    if (!response.ok) {
      throw new Error(`Erro Wikipedia: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : [];
  }

  /**
   * Pesquisa papers no ArXiv
   */
  async searchArXiv(query: string, maxResults: number = 5): Promise<KnowledgePacket[]> {
    const response = await fetch(
      `${this.baseUrl}/arxiv/${encodeURIComponent(query)}?max=${maxResults}`
    );

    if (!response.ok) {
      throw new Error(`Erro ArXiv: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : [];
  }

  /**
   * Pesquisa repositórios no GitHub
   */
  async searchGitHub(query: string, maxResults: number = 5): Promise<KnowledgePacket[]> {
    const response = await fetch(
      `${this.baseUrl}/github/${encodeURIComponent(query)}?max=${maxResults}`
    );

    if (!response.ok) {
      throw new Error(`Erro GitHub: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : [];
  }

  /**
   * Pesquisa Q&A no Stack Overflow
   */
  async searchStackOverflow(query: string, maxResults: number = 5): Promise<KnowledgePacket[]> {
    const response = await fetch(
      `${this.baseUrl}/stackoverflow/${encodeURIComponent(query)}?max=${maxResults}`
    );

    if (!response.ok) {
      throw new Error(`Erro Stack Overflow: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : [];
  }

  /**
   * Pesquisa notícias no Hacker News
   */
  async searchHackerNews(query: string): Promise<KnowledgePacket[]> {
    const response = await fetch(
      `${this.baseUrl}/hackernews/${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Erro Hacker News: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : [];
  }

  /**
   * Verifica status do serviço
   */
  async getStatus(): Promise<ResearchStatus> {
    const response = await fetch(`${this.baseUrl}/status`);

    if (!response.ok) {
      throw new Error(`Erro ao verificar status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Verifica se o backend está disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.service === 'ResearchService';
    } catch {
      return false;
    }
  }
}

// ============================================================================
// SINGLETON E HELPERS
// ============================================================================

export const backendResearchClient = new BackendResearchClient();

/**
 * Pesquisa inteligente - tenta backend primeiro, fallback para frontend
 */
export async function smartResearch(query: ResearchQuery): Promise<ResearchResult> {
  // Tentar backend primeiro (sem CORS, com Playwright)
  try {
    const isBackendAvailable = await backendResearchClient.isAvailable();
    
    if (isBackendAvailable) {
      console.log('🚀 Usando backend para pesquisa (sem CORS)');
      return await backendResearchClient.search(query);
    }
  } catch (error) {
    console.warn('⚠️ Backend não disponível, usando fallback');
  }

  // Fallback: usar WebResearchEngine do frontend (com limitações de CORS)
  console.log('⚠️ Usando frontend para pesquisa (pode ter limitações de CORS)');
  
  // Import dinâmico para evitar carregar se não precisar
  const { webResearchEngine } = await import('./WebResearchEngine');
  return await webResearchEngine.research(query);
}

export default BackendResearchClient;
