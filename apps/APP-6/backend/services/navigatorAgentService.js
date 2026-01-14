/**
 * 🤖 NAVIGATOR AGENT SERVICE
 * Agentes inteligentes de navegação com Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { browserService } from './browserService.js';

// ==================== CONFIGURAÇÃO DOS AGENTES ====================

const AGENT_MODELS = {
    flash: {
        name: 'Gemini 2.5 Flash',
        model: 'gemini-2.5-flash',
        quotaPerDay: 1500,
        quotaPerMinute: 15,
        callsToday: 0,
        callsThisMinute: 0,
        lastResetDay: new Date().getDate(),
        lastResetMinute: new Date().getMinutes(),
        priority: 1, // Maior prioridade (mais rápido)
    },
    lite: {
        name: 'Gemini 2.5 Flash Lite',
        model: 'gemini-2.5-flash-lite',
        quotaPerDay: 1500,
        quotaPerMinute: 15,
        callsToday: 0,
        callsThisMinute: 0,
        lastResetDay: new Date().getDate(),
        lastResetMinute: new Date().getMinutes(),
        priority: 2,
    },
    pro: {
        name: 'Gemini 2.0 Flash',
        model: 'gemini-2.0-flash',
        quotaPerDay: 1000,
        quotaPerMinute: 10,
        callsToday: 0,
        callsThisMinute: 0,
        lastResetDay: new Date().getDate(),
        lastResetMinute: new Date().getMinutes(),
        priority: 3, // Menor prioridade (reserva)
    },
};

// ==================== GERENCIADOR DE AGENTES ====================

class NavigatorAgentManager {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.agents = AGENT_MODELS;
        this.metrics = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            avgResponseTime: 0,
            plansGenerated: 0,
            plansExecuted: 0,
        };
    }

    /**
     * Resetar quotas diárias e por minuto
     */
    resetQuotas() {
        const now = new Date();
        const currentDay = now.getDate();
        const currentMinute = now.getMinutes();

        Object.values(this.agents).forEach((agent) => {
            // Reset diário
            if (agent.lastResetDay !== currentDay) {
                agent.callsToday = 0;
                agent.lastResetDay = currentDay;
                console.log(`🔄 Reset diário: ${agent.name}`);
            }

            // Reset por minuto
            if (agent.lastResetMinute !== currentMinute) {
                agent.callsThisMinute = 0;
                agent.lastResetMinute = currentMinute;
            }
        });
    }

    /**
     * Selecionar melhor agente disponível
     */
    selectAgent() {
        this.resetQuotas();

        // Ordenar por prioridade e disponibilidade
        const available = Object.entries(this.agents)
            .filter(
                ([_, agent]) =>
                    agent.callsToday < agent.quotaPerDay &&
                    agent.callsThisMinute < agent.quotaPerMinute
            )
            .sort(([_, a], [__, b]) => a.priority - b.priority);

        if (available.length === 0) {
            throw new Error(
                '❌ Todos os agentes atingiram o limite de requisições. Tente novamente em 1 minuto.'
            );
        }

        const [agentKey, agent] = available[0];
        console.log(`🤖 Agente selecionado: ${agent.name} (${agent.callsToday}/${agent.quotaPerDay} hoje)`);

        return { key: agentKey, agent };
    }

    /**
     * Registrar chamada do agente
     */
    registerCall(agentKey, success = true) {
        const agent = this.agents[agentKey];
        agent.callsToday++;
        agent.callsThisMinute++;

        this.metrics.totalCalls++;
        if (success) {
            this.metrics.successfulCalls++;
        } else {
            this.metrics.failedCalls++;
        }
    }

    /**
     * Gerar plano de navegação
     */
    async generateNavigationPlan(userIntent, context = {}) {
        const { key, agent } = this.selectAgent();
        const startTime = Date.now();

        try {
            const model = this.genAI.getGenerativeModel({ model: agent.model });

            const prompt = `Você é um agente de navegação web especializado. Analise a intenção do usuário e crie um plano de ação detalhado para executar no navegador usando Playwright.

INTENÇÃO DO USUÁRIO:
${userIntent}

CONTEXTO:
${JSON.stringify(context, null, 2)}

INSTRUÇÕES:
1. Analise a intenção e identifique o objetivo
2. Crie um plano passo a passo em JSON
3. Use apenas ações suportadas: navigate, wait, click, fill, extract, screenshot
4. Seja específico nos seletores CSS
5. Adicione delays quando necessário

FORMATO DE RESPOSTA (JSON):
{
  "objective": "Descrição do objetivo",
  "url": "URL inicial (se aplicável)",
  "steps": [
    {
      "action": "navigate|wait|click|fill|extract|screenshot",
      "selector": "seletor CSS (se aplicável)",
      "value": "valor (se aplicável)",
      "timeout": 5000,
      "description": "Descrição do passo"
    }
  ],
  "expectedResult": "O que esperar ao final"
}

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.`;

            const result = await model.generateContent(prompt);
            const response = result.response.text();

            // Extrair JSON da resposta
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Resposta não contém JSON válido');
            }

            const plan = JSON.parse(jsonMatch[0]);

            // Registrar sucesso
            this.registerCall(key, true);
            this.metrics.plansGenerated++;

            const duration = Date.now() - startTime;
            this.updateAvgResponseTime(duration);

            console.log(`✅ Plano gerado por ${agent.name} em ${duration}ms`);
            console.log(`📋 Plano:`, plan);

            return {
                plan,
                agent: agent.name,
                duration,
            };
        } catch (error) {
            this.registerCall(key, false);
            console.error(`❌ Erro ao gerar plano com ${agent.name}:`, error.message);
            throw error;
        }
    }

    /**
     * Executar plano de navegação (MELHORADO)
     */
    async executePlan(plan, sessionId, onProgress) {
        console.log(`🚀 Executando plano: ${plan.objective}`);
        console.log(`📋 Total de passos: ${plan.steps.length}`);

        const results = [];
        let retryCount = 0;
        const maxRetries = 2;

        try {
            for (let i = 0; i < plan.steps.length; i++) {
                const step = plan.steps[i];
                const stepNumber = i + 1;

                console.log(`\n📍 Passo ${stepNumber}/${plan.steps.length}: ${step.description}`);
                console.log(`   Ação: ${step.action}`);

                // Callback de progresso
                if (onProgress) {
                    onProgress({
                        step: stepNumber,
                        total: plan.steps.length,
                        action: step.action,
                        description: step.description,
                    });
                }

                let result;
                let success = false;

                // Retry automático em caso de falha
                for (let attempt = 0; attempt <= maxRetries && !success; attempt++) {
                    if (attempt > 0) {
                        console.log(`   🔄 Tentativa ${attempt + 1}/${maxRetries + 1}`);
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s antes de retry
                    }

                    try {
                        switch (step.action) {
                            case 'navigate':
                                result = await browserService.navigate(sessionId, step.value || plan.url, {
                                    timeout: step.timeout || 30000,
                                    waitUntil: 'networkidle',
                                });
                                break;

                            case 'wait':
                                if (step.selector) {
                                    result = await browserService.waitForSelector(
                                        sessionId,
                                        step.selector,
                                        step.timeout || 10000
                                    );
                                } else {
                                    await new Promise((resolve) => setTimeout(resolve, step.timeout || 1000));
                                    result = { success: true };
                                }
                                break;

                            case 'click':
                                result = await browserService.click(sessionId, step.selector);
                                break;

                            case 'fill':
                                result = await browserService.fill(sessionId, step.selector, step.value);
                                break;

                            // NOVAS AÇÕES:
                            case 'press':
                                result = await browserService.press(sessionId, step.selector, step.value);
                                break;

                            case 'scroll':
                                result = await browserService.scroll(sessionId, step.value, step.pixels || 500);
                                break;

                            case 'hover':
                                result = await browserService.hover(sessionId, step.selector);
                                break;

                            case 'waitForLoadState':
                                result = await browserService.waitForLoadState(
                                    sessionId,
                                    step.value || 'networkidle',
                                    step.timeout || 30000
                                );
                                break;

                            case 'extract':
                                result = await browserService.extractContent(sessionId, {
                                    includeText: true,
                                    includeLinks: true,
                                    includeImages: true,
                                });
                                break;

                            case 'extractStructured':
                                result = await browserService.extractStructured(sessionId, step.value || 'products');
                                break;

                            case 'screenshot':
                                result = await browserService.screenshot(sessionId, {
                                    type: 'jpeg',
                                    quality: 70,
                                });
                                break;

                            default:
                                console.warn(`⚠️ Ação desconhecida: ${step.action}`);
                                result = { success: false, error: 'Ação desconhecida' };
                        }

                        success = result.success !== false;
                        
                        if (success) {
                            console.log(`✅ Passo ${stepNumber} concluído com sucesso`);
                            retryCount = 0; // Reset retry count on success
                        }

                    } catch (stepError) {
                        console.error(`❌ Erro no passo ${stepNumber} (tentativa ${attempt + 1}):`, stepError.message);
                        result = { success: false, error: stepError.message };
                        
                        if (attempt === maxRetries) {
                            console.log(`⚠️ Passo ${stepNumber} falhou após ${maxRetries + 1} tentativas`);
                        }
                    }
                }

                results.push({
                    step: stepNumber,
                    action: step.action,
                    description: step.description,
                    result,
                    success,
                    retries: retryCount,
                });

                // Delay aleatório entre passos (comportamento humano)
                if (i < plan.steps.length - 1 && success) {
                    const delay = Math.random() * 1000 + 500; // 500-1500ms
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }

            this.metrics.plansExecuted++;

            const successfulSteps = results.filter(r => r.success).length;
            console.log(`\n🎉 Plano executado! ${successfulSteps}/${results.length} passos bem-sucedidos`);

            return {
                success: successfulSteps > 0,
                objective: plan.objective,
                results,
                expectedResult: plan.expectedResult,
                successRate: (successfulSteps / results.length) * 100,
            };
        } catch (error) {
            console.error('❌ Erro ao executar plano:', error);
            return {
                success: false,
                objective: plan.objective,
                results,
                error: error.message,
            };
        }
    }

    /**
     * Workflow completo: Interpretar → Planejar → Executar
     */
    async processUserIntent(userIntent, context = {}, onProgress) {
        try {
            // 1. Gerar plano
            if (onProgress) {
                onProgress({ phase: 'planning', message: '🧠 Analisando sua solicitação...' });
            }

            const { plan, agent, duration } = await this.generateNavigationPlan(userIntent, context);

            if (onProgress) {
                onProgress({
                    phase: 'planning',
                    message: `✅ Plano criado por ${agent} (${plan.steps.length} passos)`,
                });
            }

            // 2. Criar sessão
            if (onProgress) {
                onProgress({ phase: 'session', message: '🌐 Criando sessão de navegação...' });
            }

            const sessionId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await browserService.createSession(sessionId);

            // 3. Executar plano
            if (onProgress) {
                onProgress({ phase: 'execution', message: '🚀 Executando plano...' });
            }

            const execution = await this.executePlan(plan, sessionId, (stepProgress) => {
                if (onProgress) {
                    onProgress({
                        phase: 'execution',
                        message: `📍 Passo ${stepProgress.step}/${stepProgress.total}: ${stepProgress.description}`,
                        progress: (stepProgress.step / stepProgress.total) * 100,
                    });
                }
            });

            // 4. Extrair resultado final
            if (onProgress) {
                onProgress({ phase: 'finalizing', message: '📸 Capturando resultado final...' });
            }

            const finalContent = await browserService.extractContent(sessionId);
            const finalScreenshot = await browserService.screenshot(sessionId);

            // 5. Fechar sessão
            await browserService.closeSession(sessionId);

            if (onProgress) {
                onProgress({ phase: 'complete', message: '✅ Navegação concluída!' });
            }

            return {
                success: true,
                plan,
                execution,
                finalContent,
                finalScreenshot,
                agent,
                duration,
            };
        } catch (error) {
            console.error('❌ Erro no processamento:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Atualizar tempo médio de resposta
     */
    updateAvgResponseTime(duration) {
        const total = this.metrics.totalCalls;
        const avg = this.metrics.avgResponseTime;
        this.metrics.avgResponseTime = (avg * (total - 1) + duration) / total;
    }

    /**
     * Obter estatísticas
     */
    getStats() {
        return {
            agents: Object.entries(this.agents).map(([key, agent]) => ({
                key,
                name: agent.name,
                model: agent.model,
                callsToday: agent.callsToday,
                quotaPerDay: agent.quotaPerDay,
                callsThisMinute: agent.callsThisMinute,
                quotaPerMinute: agent.quotaPerMinute,
                available: agent.callsToday < agent.quotaPerDay && agent.callsThisMinute < agent.quotaPerMinute,
            })),
            metrics: this.metrics,
        };
    }

    /**
     * Resetar estatísticas
     */
    resetStats() {
        Object.values(this.agents).forEach((agent) => {
            agent.callsToday = 0;
            agent.callsThisMinute = 0;
        });

        this.metrics = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            avgResponseTime: 0,
            plansGenerated: 0,
            plansExecuted: 0,
        };

        console.log('🔄 Estatísticas resetadas');
    }
}

// ==================== EXPORT ====================

let navigatorAgent = null;

export function initializeNavigatorAgent(apiKey) {
    if (!navigatorAgent) {
        navigatorAgent = new NavigatorAgentManager(apiKey);
        console.log('🤖 Navigator Agent inicializado');
    }
    return navigatorAgent;
}

export function getNavigatorAgent() {
    if (!navigatorAgent) {
        throw new Error('Navigator Agent não inicializado. Chame initializeNavigatorAgent() primeiro.');
    }
    return navigatorAgent;
}

export { NavigatorAgentManager };
