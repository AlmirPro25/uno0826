/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║              🔒 GEMINI PROXY CLIENT - FRONTEND SEGURO 🔒                     ║
 * ║                                                                              ║
 * ║                    "ZERO API KEYS NO FRONTEND"                               ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * PROPÓSITO:
 * Cliente frontend que se comunica com o proxy server ao invés de chamar
 * diretamente a API do Gemini. Isso garante que:
 * 
 * 1. API Keys NUNCA são expostas no navegador
 * 2. Todas as requisições passam por validação e rate limiting
 * 3. Logs centralizados no servidor
 * 4. Fácil migração para outros provedores de IA
 * 
 * ARQUITETURA:
 * Frontend (este arquivo) → Proxy Server → Google Gemini API
 */

// ============================================
// CONFIGURAÇÃO
// ============================================

const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3000';
const DEFAULT_MODEL = 'gemini-2.0-flash-exp';
const REQUEST_TIMEOUT = 120000; // 2 minutos

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface GenerateOptions {
  prompt: string;
  modelName?: string;
  history?: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  onProgress?: (chunk: string) => void;
}

export interface GenerateResponse {
  success: boolean;
  text?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ProxyHealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
}

// ============================================
// CLIENTE PROXY
// ============================================

export class GeminiProxyClient {
  private proxyUrl: string;
  private timeout: number;

  constructor(proxyUrl: string = PROXY_URL, timeout: number = REQUEST_TIMEOUT) {
    this.proxyUrl = proxyUrl;
    this.timeout = timeout;
  }

  /**
   * Verifica se o proxy server está online
   */
  async checkHealth(): Promise<ProxyHealthStatus> {
    try {
      const response = await fetch(`${this.proxyUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Proxy server retornou status ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Erro ao verificar health do proxy:', error);
      throw new Error(`Proxy server indisponível: ${error.message}`);
    }
  }

  /**
   * Gera resposta usando o proxy server
   */
  async generate(options: GenerateOptions): Promise<GenerateResponse> {
    const {
      prompt,
      modelName = DEFAULT_MODEL,
      history = [],
      temperature = 0.7,
      maxOutputTokens = 8192,
      topP = 0.95,
      topK = 40
    } = options;

    // Validação básica no frontend
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: 'Prompt não pode estar vazio'
      };
    }

    try {
      console.log(`🤖 Enviando requisição para proxy: ${this.proxyUrl}/api/generate`);
      console.log(`📝 Modelo: ${modelName}, Prompt length: ${prompt.length}`);

      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.proxyUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          modelName,
          history,
          temperature,
          maxOutputTokens,
          topP,
          topK
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Proxy retornou status ${response.status}`);
      }

      const data: GenerateResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido do proxy');
      }

      console.log(`✅ Resposta recebida do proxy (${data.text?.length || 0} caracteres)`);

      return data;

    } catch (error: any) {
      console.error('❌ Erro ao gerar resposta via proxy:', error);

      // Tratamento de erros específicos
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Timeout: A requisição demorou muito tempo. Tente novamente.'
        };
      }

      if (error.message?.includes('Failed to fetch')) {
        return {
          success: false,
          error: `Não foi possível conectar ao proxy server (${this.proxyUrl}). Verifique se o servidor está rodando.`
        };
      }

      return {
        success: false,
        error: error.message || 'Erro ao gerar resposta'
      };
    }
  }

  /**
   * Gera resposta com streaming (para futuras implementações)
   */
  async generateStream(options: GenerateOptions): Promise<void> {
    throw new Error('Streaming não implementado ainda. Use generate()');
  }

  /**
   * Altera a URL do proxy
   */
  setProxyUrl(url: string): void {
    this.proxyUrl = url;
    console.log(`🔄 Proxy URL alterada para: ${url}`);
  }

  /**
   * Altera o timeout
   */
  setTimeout(timeout: number): void {
    this.timeout = timeout;
    console.log(`⏱️  Timeout alterado para: ${timeout}ms`);
  }

  /**
   * Retorna a URL atual do proxy
   */
  getProxyUrl(): string {
    return this.proxyUrl;
  }
}

// ============================================
// INSTÂNCIA SINGLETON
// ============================================

export const geminiProxyClient = new GeminiProxyClient();

// ============================================
// FUNÇÕES DE CONVENIÊNCIA
// ============================================

/**
 * Gera resposta usando o proxy (função de conveniência)
 */
export async function generateWithProxy(
  prompt: string,
  modelName?: string,
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
): Promise<string> {
  const response = await geminiProxyClient.generate({
    prompt,
    modelName,
    history
  });

  if (!response.success) {
    throw new Error(response.error || 'Erro ao gerar resposta');
  }

  return response.text || '';
}

/**
 * Verifica se o proxy está online
 */
export async function isProxyOnline(): Promise<boolean> {
  try {
    const health = await geminiProxyClient.checkHealth();
    return health.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Retorna informações sobre o proxy
 */
export async function getProxyInfo(): Promise<ProxyHealthStatus | null> {
  try {
    return await geminiProxyClient.checkHealth();
  } catch {
    return null;
  }
}

// ============================================
// EXPORTAÇÕES
// ============================================

export default geminiProxyClient;
