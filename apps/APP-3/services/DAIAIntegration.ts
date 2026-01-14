/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    DAIA Integration - Store Hooks                            ║
 * ║                                                                              ║
 * ║              Integração do DAIA com o sistema AI Web Weaver                  ║
 * ║                                                                              ║
 * ║  v2.0 - Agora com DAIA Brain (Gemini 2.5 Flash + Tool Calling)              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * Este módulo fornece funções de integração para conectar o DAIA ao store
 * e ao fluxo de geração de código.
 * 
 * ARQUITETURA:
 * - Se o Brain estiver disponível: usa Gemini 2.5 Flash com Tool Calling
 * - Se não: fallback para o serviço básico de templates
 */

import { daiaService, enrichPromptWithDAIA, type TemplateResult } from './DAIAService';
import { daiaBrain, type ThinkResponse, type ToolUsed } from './DAIABrainService';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface DAIALearnPayload {
    code: string;
    prompt: string;
    modelUsed: string;
    userRating?: 'liked' | 'disliked';
    isGoodForTraining?: boolean;
    category?: string;
    score?: number;
}

export interface DAIAEnrichmentResult {
    originalPrompt: string;
    enrichedPrompt: string;
    usedTemplates: TemplateResult[];
    wasEnriched: boolean;
}

export interface DAIABrainResult {
    response: string;
    toolsUsed: ToolUsed[];
    usedBrain: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTADO DO BRAIN
// ═══════════════════════════════════════════════════════════════════════════════

let brainAvailable: boolean | null = null;
let lastBrainCheck = 0;
const BRAIN_CHECK_INTERVAL = 300000; // 5 MINUTOS (era 1 minuto)
// ⚠️ Aumentado para evitar chamadas excessivas à API do Gemini

async function checkBrainAvailability(): Promise<boolean> {
    const now = Date.now();
    if (brainAvailable !== null && now - lastBrainCheck < BRAIN_CHECK_INTERVAL) {
        return brainAvailable;
    }

    try {
        brainAvailable = await daiaBrain.isAvailable();
        lastBrainCheck = now;
        if (brainAvailable) {
            console.log('[DAIA] 🧠 Brain disponível (Gemini 2.5 Flash + Tools)');
        }
        return brainAvailable;
    } catch {
        brainAvailable = false;
        lastBrainCheck = now;
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE INTEGRAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Envia código aprovado para o DAIA aprender.
 * Chamado quando o usuário dá like ou marca como "bom para treinamento".
 * 
 * v2.0: Se o Brain estiver disponível, usa ele para análise inteligente.
 */
export async function sendToDAIA(payload: DAIALearnPayload): Promise<boolean> {
    // Só envia se o usuário gostou do código
    if (payload.userRating !== 'liked' && !payload.isGoodForTraining) {
        console.log('[DAIA Integration] Código não aprovado, ignorando...');
        return false;
    }

    try {
        // Tenta usar o Brain primeiro (mais inteligente)
        const useBrain = await checkBrainAvailability();
        
        if (useBrain) {
            console.log('[DAIA] 🧠 Usando Brain para salvar template...');
            const result = await daiaBrain.approveCode(
                payload.code,
                payload.prompt,
                payload.score || (payload.isGoodForTraining ? 95 : 85)
            );
            
            if (result.saved) {
                console.log(`[DAIA] ✅ Template salvo via Brain`);
                console.log(`[DAIA] Tools usadas: ${result.tools_used.map(t => t.name).join(', ')}`);
                return true;
            }
        }

        // Fallback para serviço básico
        const result = await daiaService.learn({
            code: payload.code,
            prompt: payload.prompt,
            category: payload.category || detectCategory(payload.prompt, payload.code),
            score: payload.score || (payload.isGoodForTraining ? 90 : 80),
            metadata: {
                model: payload.modelUsed,
                source: 'ai-web-weaver',
                timestamp: new Date().toISOString(),
                userRating: payload.userRating,
                isGoodForTraining: payload.isGoodForTraining
            }
        });

        if (result) {
            console.log(`[DAIA Integration] ✅ Código aprendido: ${result.template_id}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error('[DAIA Integration] Erro ao enviar para DAIA:', error);
        return false;
    }
}

/**
 * Enriquece um prompt com templates similares do DAIA.
 * Chamado antes de gerar novo código.
 * 
 * v2.0: Se o Brain estiver disponível, ele decide automaticamente
 * quais templates usar e como enriquecer o prompt.
 */
export async function enrichWithDAIA(prompt: string): Promise<DAIAEnrichmentResult> {
    try {
        const { enrichedPrompt, usedTemplates } = await enrichPromptWithDAIA(prompt);

        return {
            originalPrompt: prompt,
            enrichedPrompt,
            usedTemplates,
            wasEnriched: usedTemplates.length > 0
        };
    } catch (error) {
        console.error('[DAIA Integration] Erro ao enriquecer prompt:', error);
        return {
            originalPrompt: prompt,
            enrichedPrompt: prompt,
            usedTemplates: [],
            wasEnriched: false
        };
    }
}

/**
 * NOVO: Pede ao Brain para pensar sobre uma mensagem.
 * O Brain decide automaticamente quais tools usar.
 */
export async function askDAIABrain(
    message: string,
    context?: { currentCode?: string; projectType?: string }
): Promise<DAIABrainResult> {
    try {
        const useBrain = await checkBrainAvailability();
        
        if (!useBrain) {
            return {
                response: '',
                toolsUsed: [],
                usedBrain: false
            };
        }

        console.log('[DAIA] 🧠 Enviando para Brain pensar...');
        const result = await daiaBrain.think(message, context);
        
        console.log(`[DAIA] 🧠 Brain respondeu (${result.tools_used.length} tools usadas)`);
        
        return {
            response: result.response,
            toolsUsed: result.tools_used,
            usedBrain: true
        };
    } catch (error) {
        console.error('[DAIA] Erro ao consultar Brain:', error);
        return {
            response: '',
            toolsUsed: [],
            usedBrain: false
        };
    }
}

/**
 * NOVO: Gera código usando o Brain com memória.
 * O Brain busca templates automaticamente e mantém consistência de estilo.
 */
export async function generateWithDAIABrain(
    prompt: string,
    options?: { stylePreference?: string; useTemplates?: boolean }
): Promise<{ code: string; toolsUsed: ToolUsed[]; usedBrain: boolean }> {
    try {
        const useBrain = await checkBrainAvailability();
        
        if (!useBrain) {
            return { code: '', toolsUsed: [], usedBrain: false };
        }

        console.log('[DAIA] 🧠 Gerando código com Brain...');
        const result = await daiaBrain.generateWithMemory(prompt, options);
        
        return {
            code: result.code,
            toolsUsed: result.tools_used,
            usedBrain: true
        };
    } catch (error) {
        console.error('[DAIA] Erro ao gerar com Brain:', error);
        return { code: '', toolsUsed: [], usedBrain: false };
    }
}

/**
 * Busca sugestão do DAIA para um prompt.
 * Retorna template se similaridade for muito alta (>85%).
 */
export async function getDAIASuggestion(prompt: string): Promise<TemplateResult | null> {
    try {
        return await daiaService.getSuggestion(prompt);
    } catch (error) {
        console.error('[DAIA Integration] Erro ao buscar sugestão:', error);
        return null;
    }
}

/**
 * Verifica se o DAIA está disponível.
 */
export async function isDAIAAvailable(): Promise<boolean> {
    try {
        const health = await daiaService.checkHealth();
        return health.status === 'online';
    } catch {
        return false;
    }
}

/**
 * NOVO: Verifica se o Brain está disponível.
 */
export async function isDAIABrainAvailable(): Promise<boolean> {
    return checkBrainAvailability();
}

/**
 * NOVO: Obtém status completo do DAIA (serviço + brain).
 */
export async function getDAIAFullStatus(): Promise<{
    service: { available: boolean; templates: number };
    brain: { available: boolean; model?: string; conversationLength?: number };
}> {
    const [serviceAvailable, brainStatus] = await Promise.all([
        isDAIAAvailable(),
        daiaBrain.getStatus()
    ]);

    let templates = 0;
    try {
        const stats = await daiaService.getStats();
        templates = stats?.total_templates || 0;
    } catch { /* ignore */ }

    return {
        service: {
            available: serviceAvailable,
            templates
        },
        brain: {
            available: brainStatus.status === 'online',
            model: brainStatus.model,
            conversationLength: brainStatus.conversation_length
        }
    };
}

/**
 * Obtém estatísticas do DAIA.
 */
export async function getDAIAStats() {
    return daiaService.getStats();
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detecta categoria automaticamente baseado no prompt e código.
 */
function detectCategory(prompt: string, code: string): string {
    const promptLower = prompt.toLowerCase();
    const codeLower = code.toLowerCase();

    const categories: Record<string, string[]> = {
        dashboard: ['dashboard', 'painel', 'admin', 'analytics', 'métricas', 'gráfico'],
        ecommerce: ['loja', 'carrinho', 'produto', 'checkout', 'e-commerce', 'shop', 'compra'],
        landing: ['landing', 'hero', 'cta', 'call to action', 'página inicial', 'home'],
        form: ['formulário', 'form', 'cadastro', 'registro', 'login', 'contato'],
        game: ['game', 'jogo', 'canvas', 'sprite', 'score', 'player'],
        fintech: ['banco', 'pagamento', 'pix', 'transferência', 'saldo', 'financeiro'],
        chat: ['chat', 'mensagem', 'conversa', 'whatsapp', 'telegram'],
        portfolio: ['portfolio', 'portfólio', 'projetos', 'sobre mim', 'currículo'],
        blog: ['blog', 'artigo', 'post', 'notícia', 'publicação'],
        saas: ['saas', 'plataforma', 'assinatura', 'subscription', 'pricing'],
        social: ['rede social', 'feed', 'perfil', 'timeline', 'followers']
    };

    for (const [category, keywords] of Object.entries(categories)) {
        for (const keyword of keywords) {
            if (promptLower.includes(keyword) || codeLower.includes(keyword)) {
                return category;
            }
        }
    }

    return 'general';
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK PARA STORE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cria handlers para integração com o store Zustand.
 * Use isso para adicionar as funções ao store.
 * 
 * v2.0: Agora com suporte ao Brain (Gemini 2.5 Flash + Tools)
 */
export function createDAIAStoreHandlers() {
    return {
        /**
         * Handler para quando usuário dá like em um código.
         * Usa o Brain se disponível para análise inteligente.
         */
        onCodeLiked: async (code: string, prompt: string, modelUsed: string) => {
            await sendToDAIA({
                code,
                prompt,
                modelUsed,
                userRating: 'liked'
            });
        },

        /**
         * Handler para quando usuário marca código como bom para treinamento.
         */
        onMarkedForTraining: async (code: string, prompt: string, modelUsed: string) => {
            await sendToDAIA({
                code,
                prompt,
                modelUsed,
                isGoodForTraining: true,
                score: 95
            });
        },

        /**
         * Handler para enriquecer prompt antes de gerar.
         */
        onBeforeGenerate: async (prompt: string) => {
            return enrichWithDAIA(prompt);
        },

        /**
         * Handler para verificar se existe sugestão similar.
         */
        onCheckSuggestion: async (prompt: string) => {
            return getDAIASuggestion(prompt);
        },

        /**
         * NOVO: Handler para pedir ao Brain para pensar.
         */
        onAskBrain: async (message: string, context?: { currentCode?: string; projectType?: string }) => {
            return askDAIABrain(message, context);
        },

        /**
         * NOVO: Handler para gerar código com o Brain.
         */
        onGenerateWithBrain: async (prompt: string, options?: { stylePreference?: string }) => {
            return generateWithDAIABrain(prompt, options);
        },

        /**
         * NOVO: Handler para obter status completo.
         */
        onGetFullStatus: async () => {
            return getDAIAFullStatus();
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
    daiaService,
    enrichPromptWithDAIA
} from './DAIAService';

export {
    daiaBrain,
    type ThinkResponse,
    type ToolUsed,
    type BrainStatus
} from './DAIABrainService';
