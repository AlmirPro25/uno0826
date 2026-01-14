/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    DAIA Brain Service - Frontend Client                       ║
 * ║                                                                               ║
 * ║              Comunicação com o Cérebro Autônomo (Gemini + Tools)             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este serviço conecta o frontend com o DAIA Brain, permitindo:
 * - Enviar mensagens para o cérebro pensar
 * - Gerar código com memória de templates
 * - Aprovar e salvar códigos automaticamente
 * - Obter sugestões baseadas no histórico
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface ToolUsed {
  name: string;
  args: Record<string, unknown>;
}

export interface ThinkResponse {
  response: string;
  tools_used: ToolUsed[];
  conversation_length: number;
}

export interface GenerateResponse {
  code: string;
  tools_used: ToolUsed[];
  templates_referenced: ToolUsed[];
}

export interface ApproveResponse {
  saved: boolean;
  response: string;
  tools_used: ToolUsed[];
}

export interface BrainStatus {
  status: 'online' | 'offline' | 'ready';
  model?: string;
  tools_available?: number;
  conversation_length?: number;
  has_api_key?: boolean;
  error?: string;
  message?: string;
}

export interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
  tools_used?: ToolUsed[];
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

const DAIA_BRAIN_URL = import.meta.env.VITE_DAIA_URL || 'http://localhost:8765';

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

class DAIABrainService {
  private baseUrl: string;
  private isOnline: boolean = false;
  private lastCheck: number = 0;
  private checkInterval: number = 300000; // 5 MINUTOS (era 30 segundos)
  // ⚠️ Aumentado para evitar chamadas excessivas à API do Gemini

  constructor(baseUrl: string = DAIA_BRAIN_URL) {
    this.baseUrl = baseUrl;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS PRINCIPAIS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Envia mensagem para o cérebro DAIA pensar.
   * O cérebro decide automaticamente quais tools usar.
   */
  async think(
    message: string,
    context?: {
      currentCode?: string;
      projectType?: string;
    }
  ): Promise<ThinkResponse> {
    const response = await this.post<ThinkResponse>('/brain/think', {
      message,
      current_code: context?.currentCode,
      project_type: context?.projectType,
    });

    return response;
  }

  /**
   * Gera código usando a memória do DAIA.
   * Automaticamente busca templates similares como referência.
   */
  async generateWithMemory(
    prompt: string,
    options?: {
      stylePreference?: string;
      useTemplates?: boolean;
    }
  ): Promise<GenerateResponse> {
    const response = await this.post<GenerateResponse>('/brain/generate', {
      prompt,
      style_preference: options?.stylePreference,
      use_templates: options?.useTemplates ?? true,
    });

    return response;
  }

  /**
   * Aprova e salva um código no banco de templates.
   * O cérebro analisa, categoriza e salva automaticamente.
   */
  async approveCode(
    code: string,
    prompt: string,
    rating: number = 85
  ): Promise<ApproveResponse> {
    const response = await this.post<ApproveResponse>('/brain/approve', {
      code,
      prompt,
      rating,
    });

    return response;
  }

  /**
   * Obtém sugestão baseada em templates existentes.
   * Útil para verificar se já existe algo similar antes de gerar.
   */
  async getSuggestion(prompt: string): Promise<{
    suggestion: string;
    tools_used: ToolUsed[];
  }> {
    const response = await this.post<{
      suggestion: string;
      tools_used: ToolUsed[];
    }>('/brain/suggest', null, { prompt });

    return response;
  }

  /**
   * Analisa qualidade de um código.
   */
  async analyzeCode(code: string): Promise<{
    analysis: string;
    tools_used: ToolUsed[];
  }> {
    const response = await this.post<{
      analysis: string;
      tools_used: ToolUsed[];
    }>('/brain/analyze', null, { code });

    return response;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GERENCIAMENTO DE CONVERSA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Reseta a conversa do cérebro.
   */
  async resetConversation(): Promise<void> {
    await this.post('/brain/reset', {});
  }

  /**
   * Obtém histórico da conversa.
   */
  async getHistory(): Promise<{
    history: ConversationEntry[];
    length: number;
  }> {
    return this.get('/brain/history');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS E HEALTH
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verifica status do cérebro DAIA.
   */
  async getStatus(): Promise<BrainStatus> {
    try {
      const status = await this.get<BrainStatus>('/brain/status');
      // "ready" significa que tem API key e está pronto para usar
      this.isOnline = status.status === 'online' || status.status === 'ready';
      this.lastCheck = Date.now();
      return status;
    } catch (error) {
      this.isOnline = false;
      this.lastCheck = Date.now();
      return {
        status: 'offline',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Verifica se o cérebro está online (com cache).
   */
  async isAvailable(): Promise<boolean> {
    // Usa cache se verificou recentemente
    if (Date.now() - this.lastCheck < this.checkInterval) {
      return this.isOnline;
    }

    const status = await this.getStatus();
    // "ready" também conta como disponível
    return status.status === 'online' || status.status === 'ready';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS HTTP
  // ═══════════════════════════════════════════════════════════════════════════

  private async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private async post<T>(
    endpoint: string,
    body: Record<string, unknown> | null,
    params?: Record<string, string>
  ): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTÂNCIA SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

export const daiaBrain = new DAIABrainService();

export default DAIABrainService;
