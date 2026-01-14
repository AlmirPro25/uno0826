/**
 * 🤖 NAVIGATOR AGENT SERVICE - Frontend
 * Integração com agentes inteligentes de navegação
 */

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3002';

export interface NavigationStep {
  action: 'navigate' | 'wait' | 'click' | 'fill' | 'extract' | 'screenshot';
  selector?: string;
  value?: string;
  timeout?: number;
  description: string;
}

export interface NavigationPlan {
  objective: string;
  url?: string;
  steps: NavigationStep[];
  expectedResult: string;
}

export interface AgentInfo {
  key: string;
  name: string;
  model: string;
  callsToday: number;
  quotaPerDay: number;
  callsThisMinute: number;
  quotaPerMinute: number;
  available: boolean;
}

export interface AgentStats {
  agents: AgentInfo[];
  metrics: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    avgResponseTime: number;
    plansGenerated: number;
    plansExecuted: number;
  };
}

export interface ProcessResult {
  success: boolean;
  plan?: NavigationPlan;
  execution?: any;
  finalContent?: any;
  finalScreenshot?: string;
  agent?: string;
  duration?: number;
  error?: string;
}

export interface ProgressCallback {
  (progress: {
    phase: 'planning' | 'session' | 'execution' | 'finalizing' | 'complete';
    message: string;
    progress?: number;
  }): void;
}

/**
 * Processar intenção do usuário com agentes inteligentes
 */
export async function processUserIntent(
  userIntent: string,
  context?: any,
  onProgress?: ProgressCallback
): Promise<ProcessResult> {
  try {
    if (onProgress) {
      onProgress({ phase: 'planning', message: '🧠 Analisando sua solicitação...' });
    }

    const response = await fetch(`${API_URL}/api/navigator/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIntent, context }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao processar intenção');
    }

    const result = await response.json();

    if (onProgress) {
      onProgress({ phase: 'complete', message: '✅ Navegação concluída!' });
    }

    return result;
  } catch (error: any) {
    console.error('❌ Erro ao processar intenção:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Gerar plano de navegação
 */
export async function generateNavigationPlan(
  userIntent: string,
  context?: any
): Promise<{ plan: NavigationPlan; agent: string; duration: number }> {
  try {
    const response = await fetch(`${API_URL}/api/navigator/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIntent, context }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao gerar plano');
    }

    return await response.json();
  } catch (error: any) {
    console.error('❌ Erro ao gerar plano:', error);
    throw error;
  }
}

/**
 * Executar plano de navegação
 */
export async function executePlan(
  plan: NavigationPlan,
  sessionId?: string
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/navigator/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, sessionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao executar plano');
    }

    return await response.json();
  } catch (error: any) {
    console.error('❌ Erro ao executar plano:', error);
    throw error;
  }
}

/**
 * Obter estatísticas dos agentes
 */
export async function getAgentStats(): Promise<AgentStats> {
  try {
    const response = await fetch(`${API_URL}/api/navigator/stats`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao obter estatísticas');
    }

    return await response.json();
  } catch (error: any) {
    console.error('❌ Erro ao obter estatísticas:', error);
    throw error;
  }
}

/**
 * Resetar estatísticas dos agentes
 */
export async function resetAgentStats(): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/navigator/stats/reset`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao resetar estatísticas');
    }
  } catch (error: any) {
    console.error('❌ Erro ao resetar estatísticas:', error);
    throw error;
  }
}

/**
 * Detectar se a mensagem é uma intenção de navegação
 */
export function isNavigationIntent(message: string): boolean {
  const navigationKeywords = [
    'navegue',
    'acesse',
    'entre no site',
    'abra',
    'vá para',
    'busque no google',
    'pesquise',
    'encontre',
    'procure',
    'faça login',
    'preencha',
    'clique',
    'screenshot',
    'captura',
    'extraia',
    'tire print',
  ];

  const lowerMessage = message.toLowerCase();
  return navigationKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * Formatar resultado para exibição no chat
 */
export function formatNavigationResult(result: ProcessResult): string {
  if (!result.success) {
    return `❌ Erro na navegação: ${result.error}`;
  }

  let formatted = `✅ **Navegação Concluída**\n\n`;

  if (result.plan) {
    formatted += `🎯 **Objetivo:** ${result.plan.objective}\n`;
    formatted += `📋 **Passos executados:** ${result.plan.steps.length}\n`;
  }

  if (result.agent) {
    formatted += `🤖 **Agente:** ${result.agent}\n`;
  }

  if (result.duration) {
    formatted += `⏱️ **Duração:** ${Math.round(result.duration / 1000)}s\n`;
  }

  if (result.execution?.results) {
    const successfulSteps = result.execution.results.filter((r: any) => r.success).length;
    formatted += `\n✅ ${successfulSteps}/${result.execution.results.length} passos bem-sucedidos\n`;
  }

  if (result.finalContent) {
    formatted += `\n📄 **Conteúdo extraído:**\n`;
    formatted += `- Título: ${result.finalContent.title}\n`;
    formatted += `- URL: ${result.finalContent.url}\n`;
    formatted += `- Texto: ${result.finalContent.text?.substring(0, 200)}...\n`;
  }

  return formatted;
}
