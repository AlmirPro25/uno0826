/**
 * 🧠 INTELLIGENT ORCHESTRATOR SERVICE - Frontend
 * Serviço para comunicar com o Orchestrator do backend
 */

const BACKEND_URL = 'http://localhost:3002';

export interface OrchestratorDecision {
  action: 'navigate' | 'search' | 'ask' | 'extract' | 'respond';
  reasoning: string;
  message: string;
  navigation?: {
    urls: string[];
    strategy: 'direct' | 'search' | 'explore';
    extractData: string[];
  };
  question?: string;
}

export interface OrchestratorResult {
  message: string;
  response: string;
  action: string;
  reasoning: string;
  question?: string;
  navigationResults?: Array<{
    url: string;
    success: boolean;
    data?: any;
    error?: string;
  }>;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

export interface OrchestratorStats {
  knowledgeBase: {
    totalUrls: number;
    categories: number;
    domains: number;
    searchPatterns: number;
  };
  conversation: {
    messages: number;
    userMessages: number;
    assistantMessages: number;
  };
}

/**
 * Inicializar orchestrator
 */
export async function initializeOrchestrator(apiKey: string): Promise<{
  success: boolean;
  message: string;
  stats: OrchestratorStats;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/orchestrator/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao inicializar orchestrator:', error);
    throw error;
  }
}

/**
 * Processar pedido do usuário
 */
export async function processUserRequest(
  message: string,
  context?: any,
  apiKey?: string
): Promise<OrchestratorResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/orchestrator/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, context, apiKey })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    throw error;
  }
}

/**
 * Obter estatísticas
 */
export async function getOrchestratorStats(): Promise<OrchestratorStats> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/orchestrator/stats`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter stats:', error);
    throw error;
  }
}

/**
 * Limpar histórico
 */
export async function clearOrchestratorHistory(): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/orchestrator/clear`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    throw error;
  }
}

export default {
  initializeOrchestrator,
  processUserRequest,
  getOrchestratorStats,
  clearOrchestratorHistory
};
