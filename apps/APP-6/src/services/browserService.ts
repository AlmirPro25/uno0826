/**
 * 🌐 BROWSER SERVICE - Frontend
 * Cliente para interagir com o navegador automatizado
 */

const BACKEND_URL = 'http://localhost:3002';

export interface BrowserSession {
  sessionId: string;
}

export interface NavigateResult {
  success: boolean;
  url: string;
  title: string;
}

export interface PageContent {
  title: string;
  url: string;
  text: string;
  html?: string;
  links: Array<{
    text: string;
    href: string;
    title?: string;
  }>;
  images: Array<{
    src: string;
    alt?: string;
    title?: string;
  }>;
  metadata: Record<string, string>;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Criar nova sessão de navegação
 */
export async function createBrowserSession(): Promise<BrowserSession> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/browser/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    throw error;
  }
}

/**
 * Navegar para URL
 */
export async function navigateToUrl(
  sessionId: string,
  url: string,
  options?: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    timeout?: number;
  }
): Promise<NavigateResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/browser/navigate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, url, options })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao navegar:', error);
    throw error;
  }
}

/**
 * Extrair conteúdo da página
 */
export async function extractPageContent(
  sessionId: string,
  options?: {
    includeText?: boolean;
    includeHtml?: boolean;
    includeLinks?: boolean;
    includeImages?: boolean;
    includeMetadata?: boolean;
    maxLinks?: number;
    maxImages?: number;
  }
): Promise<PageContent> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/browser/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, options })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao extrair conteúdo:', error);
    throw error;
  }
}

/**
 * Tirar screenshot
 */
export async function takeScreenshot(
  sessionId: string,
  options?: {
    type?: 'png' | 'jpeg';
    fullPage?: boolean;
    quality?: number;
  }
): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/browser/screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, options })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.screenshot;
  } catch (error) {
    console.error('Erro ao tirar screenshot:', error);
    throw error;
  }
}

/**
 * Buscar no Google
 */
export async function searchGoogle(query: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/browser/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Erro ao buscar:', error);
    throw error;
  }
}

/**
 * Executar script customizado
 */
export async function executeScript(
  sessionId: string,
  script: string
): Promise<any> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/browser/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, script })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Erro ao executar script:', error);
    throw error;
  }
}

/**
 * Fechar sessão
 */
export async function closeBrowserSession(sessionId: string): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/browser/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Erro ao fechar sessão:', error);
    throw error;
  }
}

/**
 * Obter estatísticas
 */
export async function getBrowserStats() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/browser/stats`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    throw error;
  }
}

/**
 * Workflow completo: Navegar e extrair
 */
export async function browseAndExtract(url: string): Promise<{
  navigation: NavigateResult;
  content: PageContent;
  screenshot: string;
}> {
  let sessionId: string | null = null;

  try {
    // Criar sessão
    const session = await createBrowserSession();
    sessionId = session.sessionId;

    // Navegar
    const navigation = await navigateToUrl(sessionId, url);

    // Extrair conteúdo
    const content = await extractPageContent(sessionId, {
      includeText: true,
      includeLinks: true,
      includeImages: true,
      includeMetadata: true,
      maxLinks: 20,
      maxImages: 10
    });

    // Tirar screenshot
    const screenshot = await takeScreenshot(sessionId, {
      type: 'jpeg',
      fullPage: false,
      quality: 80
    });

    // Fechar sessão
    await closeBrowserSession(sessionId);

    return {
      navigation,
      content,
      screenshot
    };
  } catch (error) {
    // Tentar fechar sessão em caso de erro
    if (sessionId) {
      try {
        await closeBrowserSession(sessionId);
      } catch (closeError) {
        console.error('Erro ao fechar sessão:', closeError);
      }
    }

    throw error;
  }
}

export default {
  createBrowserSession,
  navigateToUrl,
  extractPageContent,
  takeScreenshot,
  searchGoogle,
  executeScript,
  closeBrowserSession,
  getBrowserStats,
  browseAndExtract
};
