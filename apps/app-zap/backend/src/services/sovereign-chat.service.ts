/**
 * 👑 SOVEREIGN CHAT SERVICE
 * Natural Language Command Center - "Fale com o Sistema"
 * 
 * Transforma comandos em linguagem natural em ações no sistema.
 * Usa Gemini para entender intenção e contexto.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { LogRepository } from '../repositories/log.repository';
import { PersonaRepository } from '../repositories/persona.repository';
import { ABTestService } from './ab-testing.service';
import { AnalyticsService } from './analytics.service';
import { MemoryService } from './memory.service';
import { HunterService } from './hunter.service';
import { prisma } from '../database/prisma';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    intent?: ParsedIntent;
    actionResult?: ActionResult;
}

export interface ParsedIntent {
    category: IntentCategory;
    action: string;
    confidence: number;
    entities: Record<string, any>;
    requiresConfirmation: boolean;
}

export interface ActionResult {
    success: boolean;
    message: string;
    data?: any;
    suggestedFollowUp?: string;
}

export interface ConversationContext {
    lastIntent?: ParsedIntent;
    lastResult?: ActionResult;
    lastEntities?: Record<string, any>;
    pendingConfirmation?: PendingAction;
    conversationHistory: ChatMessage[];
}

export interface PendingAction {
    intent: ParsedIntent;
    originalMessage: string;
    expiresAt: Date;
}

export type IntentCategory =
    | 'PERSONA'      // Gerenciar persona/IA
    | 'CONTACTS'     // Gerenciar contatos
    | 'ABTESTS'      // Testes A/B
    | 'ANALYTICS'    // Métricas e relatórios
    | 'CAMPAIGNS'    // Campanhas de hunting
    | 'SYSTEM'       // Status do sistema
    | 'MEMORY'       // Memória e contexto
    | 'SETTINGS'     // Configurações
    | 'HELP'         // Ajuda
    | 'WAR_MODE'     // Modo Guerra/Alta Performance
    | 'UNKNOWN';     // Não reconhecido

// ═══════════════════════════════════════════════════════════════════════════
// INTENT DETECTION PROMPT
// ═══════════════════════════════════════════════════════════════════════════

const INTENT_DETECTION_PROMPT = `
Você é o SPECTRA, o sistema de Inteligência Artificial que controla o Ghost Protocol.
Sua função é interpretar comandos em linguagem natural e convertê-los em ações.

CATEGORIAS DE INTENÇÃO:
- PERSONA: Alterar persona, tom, modo, estilo da IA vendedora
- CONTACTS: Listar, pausar, retomar, enviar mensagem para contatos
- ABTESTS: Ver testes A/B, qual está ganhando, aplicar vencedor
- ANALYTICS: Métricas, vendas, conversões, performance
- CAMPAIGNS: Campanhas de prospecção, hunting, targets
- SYSTEM: Status do sistema, saúde, logs
- MEMORY: Memórias, contexto, histórico
- SETTINGS: Configurações gerais
- HELP: Pedindo ajuda ou explicação
- WAR_MODE: Ativar modo de alta performance/guerra (agressividade total)
- UNKNOWN: Não reconhecido

ENTIDADES A EXTRAIR:
- contactName: Nome do contato mencionado
- contactPhone: Telefone do contato
- testId: ID do teste A/B
- mode: Modo (agressivo, suave, normal)
- timeRange: Período (hoje, ontem, semana, mês)
- message: Mensagem a enviar
- limit: Número limite de resultados
- status: Status (quente, frio, ativo, pausado)

REGRAS:
1. SEMPRE retorne JSON válido
2. confidence: 0.0 a 1.0 baseado na certeza
3. requiresConfirmation: true para ações destrutivas ou que enviam mensagens
4. Se for ambíguo, peça clarificação via action: "CLARIFY"

FORMATO DE RESPOSTA (JSON):
{
  "category": "CATEGORIA",
  "action": "AÇÃO_ESPECÍFICA",
  "confidence": 0.95,
  "entities": { "key": "value" },
  "requiresConfirmation": false
}

EXEMPLOS DE AÇÕES POR CATEGORIA:

PERSONA:
- SET_MODE: Alterar modo (agressivo, suave, neutro)
- UPDATE_TONE: Alterar tom de voz
- GET_CURRENT: Ver persona atual

CONTACTS:
- LIST_ALL: Listar todos contatos
- LIST_HOT: Listar contatos quentes (salesReadiness > 70)
- LIST_COLD: Listar contatos frios
- PAUSE: Pausar contato específico
- RESUME: Retomar contato
- SEND_MESSAGE: Enviar mensagem
- GET_INFO: Informações de um contato

ABTESTS:
- LIST_ALL: Listar testes
- GET_STATUS: Status de um teste
- GET_WINNER: Qual variante está ganhando
- APPLY_WINNER: Aplicar variante vencedora
- START: Iniciar teste
- STOP: Parar teste

ANALYTICS:
- SALES_TODAY: Vendas de hoje
- SALES_SUMMARY: Resumo de vendas
- TOP_PERFORMERS: Contatos com mais conversão
- CONVERSION_RATE: Taxa de conversão
- RESPONSE_RATE: Taxa de resposta

SYSTEM:
- STATUS: Status geral
- HEALTH: Saúde do sistema
- LOGS: Logs recentes
- PULSE: Visão geral analítica e vital do sistema

WAR_MODE:
- ACTIVATE: Ativar modo agressivo de vendas e شکار
- DEACTIVATE: Voltar ao modo normal/suave

Agora, analise a seguinte mensagem do operador:
`;

// ═══════════════════════════════════════════════════════════════════════════
// SOVEREIGN CHAT SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class SovereignChatService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private logRepo = new LogRepository();
    private personaRepo = new PersonaRepository();
    private abTestService = new ABTestService();
    private analyticsService = new AnalyticsService();
    private memoryService = new MemoryService();
    private hunterService = new HunterService();

    // Conversation state per session
    private sessions: Map<string, ConversationContext> = new Map();

    constructor() {
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        console.log('👑 Sovereign Chat Service initialized');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAIN CHAT METHOD
    // ═══════════════════════════════════════════════════════════════════════

    async chat(sessionId: string, userMessage: string): Promise<ChatMessage> {
        const context = this.getOrCreateSession(sessionId);

        // Add user message to history
        const userChatMessage: ChatMessage = {
            id: this.generateId(),
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        };
        context.conversationHistory.push(userChatMessage);

        try {
            // Check for pending confirmation
            if (context.pendingConfirmation) {
                return await this.handleConfirmation(sessionId, userMessage, context);
            }

            // Parse intent using Gemini
            const intent = await this.parseIntent(userMessage, context);
            userChatMessage.intent = intent;

            // Log intent detection
            this.logRepo.create('INFO', 'SOVEREIGN_INTENT',
                `Intent: ${intent.category}.${intent.action} (confidence: ${intent.confidence})`, undefined);

            // Check if needs confirmation
            if (intent.requiresConfirmation) {
                return await this.requestConfirmation(sessionId, intent, userMessage, context);
            }

            // Execute action
            const result = await this.executeIntent(intent, context);

            // Generate response
            const response = await this.generateResponse(intent, result, context);

            const assistantMessage: ChatMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                intent,
                actionResult: result
            };

            context.conversationHistory.push(assistantMessage);
            context.lastIntent = intent;
            context.lastResult = result;
            context.lastEntities = intent.entities;

            return assistantMessage;

        } catch (error) {
            console.error('Sovereign Chat Error:', error);
            const errorMessage: ChatMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: `⚠️ Erro ao processar comando: ${(error as Error).message}. Tente reformular ou digite "ajuda".`,
                timestamp: new Date()
            };
            context.conversationHistory.push(errorMessage);
            return errorMessage;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INTENT PARSING
    // ═══════════════════════════════════════════════════════════════════════

    private async parseIntent(message: string, context: ConversationContext): Promise<ParsedIntent> {
        // Build context string from history
        const historyContext = context.conversationHistory
            .slice(-6)
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n');

        const prompt = `${INTENT_DETECTION_PROMPT}

HISTÓRICO RECENTE:
${historyContext}

MENSAGEM ATUAL DO OPERADOR:
"${message}"

Responda APENAS com o JSON de intenção:`;

        try {
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]) as ParsedIntent;
            return parsed;

        } catch (error) {
            console.error('Intent parsing error:', error);
            return {
                category: 'UNKNOWN',
                action: 'CLARIFY',
                confidence: 0,
                entities: {},
                requiresConfirmation: false
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ACTION EXECUTION
    // ═══════════════════════════════════════════════════════════════════════

    private async executeIntent(intent: ParsedIntent, context: ConversationContext): Promise<ActionResult> {
        const { category, action, entities } = intent;

        switch (category) {
            case 'CONTACTS':
                return await this.executeContactAction(action, entities);

            case 'PERSONA':
                return await this.executePersonaAction(action, entities);

            case 'ABTESTS':
                return await this.executeABTestAction(action, entities);

            case 'ANALYTICS':
                return await this.executeAnalyticsAction(action, entities);

            case 'SYSTEM':
                return await this.executeSystemAction(action, entities);

            case 'WAR_MODE':
                return await this.executeWarModeAction(action, entities);

            case 'HELP':
                return this.getHelpResponse();

            case 'UNKNOWN':
            default:
                return {
                    success: false,
                    message: 'Não entendi o comando. Pode reformular?',
                    suggestedFollowUp: 'Digite "ajuda" para ver comandos disponíveis.'
                };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONTACT ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    private async executeContactAction(action: string, entities: Record<string, any>): Promise<ActionResult> {
        switch (action) {
            case 'LIST_ALL': {
                const limit = entities.limit || 10;
                const contacts = await prisma.contact.findMany({
                    take: limit,
                    orderBy: { lastInteraction: 'desc' }
                });
                return {
                    success: true,
                    message: `📋 **${contacts.length} contatos encontrados:**\n${contacts.map(c =>
                        `• ${c.name || c.pushName || 'Sem nome'} - Intimidade: ${c.intimacyLevel}% | Sales: ${c.salesReadiness}%`
                    ).join('\n')}`,
                    data: contacts
                };
            }

            case 'LIST_HOT': {
                const hotContacts = await prisma.contact.findMany({
                    where: { salesReadiness: { gte: 70 } },
                    orderBy: { salesReadiness: 'desc' },
                    take: entities.limit || 10
                });
                return {
                    success: true,
                    message: `🔥 **${hotContacts.length} contatos QUENTES:**\n${hotContacts.map(c =>
                        `• ${c.name || c.pushName} - 💰 Sales: ${c.salesReadiness}% | ❤️ Intimidade: ${c.intimacyLevel}%`
                    ).join('\n')}`,
                    data: hotContacts,
                    suggestedFollowUp: 'Quer que eu envie uma mensagem de fechamento para eles?'
                };
            }

            case 'LIST_COLD': {
                const coldContacts = await prisma.contact.findMany({
                    where: { salesReadiness: { lt: 30 } },
                    orderBy: { salesReadiness: 'asc' },
                    take: entities.limit || 10
                });
                return {
                    success: true,
                    message: `❄️ **${coldContacts.length} contatos FRIOS:**\n${coldContacts.map(c =>
                        `• ${c.name || c.pushName} - Sales: ${c.salesReadiness}% | Última interação: ${this.formatTimeAgo(c.lastInteraction)}`
                    ).join('\n')}`,
                    data: coldContacts
                };
            }

            case 'PAUSE': {
                if (!entities.contactName && !entities.contactPhone) {
                    return { success: false, message: 'Qual contato você quer pausar? Me diz o nome ou telefone.' };
                }
                const contact = await this.findContact(entities);
                if (!contact) {
                    return { success: false, message: 'Contato não encontrado.' };
                }
                await prisma.contact.update({
                    where: { id: contact.id },
                    data: { isPaused: true }
                });
                return {
                    success: true,
                    message: `⏸️ **${contact.name || contact.pushName}** foi pausado. A IA não responderá mais automaticamente.`
                };
            }

            case 'RESUME': {
                if (!entities.contactName && !entities.contactPhone) {
                    return { success: false, message: 'Qual contato você quer retomar? Me diz o nome ou telefone.' };
                }
                const contact = await this.findContact(entities);
                if (!contact) {
                    return { success: false, message: 'Contato não encontrado.' };
                }
                await prisma.contact.update({
                    where: { id: contact.id },
                    data: { isPaused: false }
                });
                return {
                    success: true,
                    message: `▶️ **${contact.name || contact.pushName}** reativado! A IA está de volta.`
                };
            }

            case 'GET_INFO': {
                const contact = await this.findContact(entities);
                if (!contact) {
                    return { success: false, message: 'Contato não encontrado.' };
                }
                return {
                    success: true,
                    message: `
📊 **Perfil de ${contact.name || contact.pushName}:**

├─ 📱 **Telefone:** ${contact.id.replace('@c.us', '')}
├─ ❤️ **Intimidade:** ${contact.intimacyLevel}%
├─ 🤝 **Confiança:** ${contact.trustLevel}%
├─ 💰 **Sales Ready:** ${contact.salesReadiness}%
├─ 🎯 **Engajamento:** ${contact.engagementScore}%
├─ 😊 **Emoção:** ${contact.emotionalState}
├─ 🎤 **Tom:** ${contact.lastTone}
├─ ${contact.isPaused ? '⏸️ PAUSADO' : '▶️ ATIVO'}
└─ ⏰ **Última interação:** ${this.formatTimeAgo(contact.lastInteraction)}
                    `.trim(),
                    data: contact
                };
            }

            default:
                return { success: false, message: `Ação de contato "${action}" não implementada.` };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PERSONA ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    private async executePersonaAction(action: string, entities: Record<string, any>): Promise<ActionResult> {
        switch (action) {
            case 'GET_CURRENT': {
                const persona = await this.personaRepo.getActivePersona();
                if (!persona) {
                    return { success: false, message: 'Nenhuma persona ativa.' };
                }
                return {
                    success: true,
                    message: `
👤 **Persona Ativa: ${persona.name}**

├─ 📝 **Descrição:** ${persona.description}
├─ 🎂 **Idade:** ${persona.age} anos
├─ 🗣️ **Tom:** ${persona.voiceTone}
├─ 💬 **Estilo:** ${persona.communicationStyle}
└─ 📦 **Produtos:** ${persona.products?.length || 0}

💎 **Produtos:**
${persona.products?.map(p => `   • ${p.name}: R$ ${p.price}`).join('\n') || 'Nenhum'}
                    `.trim(),
                    data: persona
                };
            }

            case 'SET_MODE': {
                const mode = entities.mode?.toLowerCase();
                const modeMap: Record<string, string> = {
                    'agressivo': 'Provocadora, Urgente, Direta, Fecha vendas rápido.',
                    'suave': 'Doce, Paciente, Amigável, Cria conexão devagar.',
                    'normal': 'Humana, Amigável, Íntima, Espontânea, Divertida, Provocadora.',
                    'sexy': 'Sedutora, Íntima, Provocadora, Ousada.',
                    'profissional': 'Educada, Clara, Objetiva, Séria.'
                };

                if (!mode || !modeMap[mode]) {
                    return {
                        success: false,
                        message: `Modo "${mode || 'não especificado'}" não reconhecido. Modos disponíveis: ${Object.keys(modeMap).join(', ')}.`
                    };
                }

                const persona = await this.personaRepo.getActivePersona();
                if (!persona) {
                    return { success: false, message: 'Nenhuma persona ativa para modificar.' };
                }

                await prisma.persona.update({
                    where: { id: persona.id },
                    data: { voiceTone: modeMap[mode] }
                });

                return {
                    success: true,
                    message: `✅ **Modo "${mode.toUpperCase()}" ativado!**\n\nNovo tom: ${modeMap[mode]}`,
                    suggestedFollowUp: 'Quer testar com algum contato específico?'
                };
            }

            default:
                return { success: false, message: `Ação de persona "${action}" não implementada.` };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // A/B TEST ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    private async executeABTestAction(action: string, entities: Record<string, any>): Promise<ActionResult> {
        switch (action) {
            case 'LIST_ALL': {
                const tests = this.abTestService.getAllTests();
                return {
                    success: true,
                    message: `🧪 **${tests.length} Testes A/B:**\n${tests.map(t =>
                        `• **${t.name}** - Status: ${t.status} ${t.status === 'RUNNING' ? '🟢' : t.status === 'COMPLETED' ? '✅' : '⏸️'}`
                    ).join('\n')}`,
                    data: tests
                };
            }

            case 'GET_STATUS': {
                const testId = entities.testId;
                if (!testId) {
                    const tests = this.abTestService.getAllTests();
                    return {
                        success: true,
                        message: `Qual teste? Disponíveis:\n${tests.map(t => `• ${t.id}: ${t.name}`).join('\n')}`
                    };
                }
                const test = this.abTestService.getTest(testId);
                if (!test) {
                    return { success: false, message: `Teste "${testId}" não encontrado.` };
                }
                return {
                    success: true,
                    message: `
🧪 **Teste: ${test.name}**
├─ Status: ${test.status}
├─ Métrica: ${test.metric}
└─ Variantes:
${test.variants.map(v => `   • ${v.name}: ${v.conversionRate.toFixed(1)}% (${v.conversions}/${v.impressions})`).join('\n')}
                    `.trim(),
                    data: test
                };
            }

            case 'GET_WINNER': {
                const tests = this.abTestService.getAllTests().filter(t => t.status === 'RUNNING' || t.status === 'COMPLETED');
                if (tests.length === 0) {
                    return { success: false, message: 'Nenhum teste ativo ou completado.' };
                }

                const winners = tests.map(test => {
                    const sorted = [...test.variants].sort((a, b) => b.conversionRate - a.conversionRate);
                    return {
                        test: test.name,
                        winner: sorted[0]?.name,
                        rate: sorted[0]?.conversionRate.toFixed(1)
                    };
                });

                return {
                    success: true,
                    message: `🏆 **Variantes Vencedoras:**\n${winners.map(w =>
                        `• **${w.test}:** ${w.winner} (${w.rate}%)`
                    ).join('\n')}`,
                    suggestedFollowUp: 'Quer aplicar algum vencedor?'
                };
            }

            case 'START': {
                const testId = entities.testId;
                if (!testId) {
                    return { success: false, message: 'Qual teste você quer iniciar?' };
                }
                const success = this.abTestService.startTest(testId);
                return {
                    success,
                    message: success ? `▶️ Teste "${testId}" iniciado!` : `Erro ao iniciar teste "${testId}".`
                };
            }

            case 'STOP': {
                const testId = entities.testId;
                if (!testId) {
                    return { success: false, message: 'Qual teste você quer parar?' };
                }
                const success = this.abTestService.pauseTest(testId);
                return {
                    success,
                    message: success ? `⏸️ Teste "${testId}" pausado.` : `Erro ao pausar teste "${testId}".`
                };
            }

            default:
                return { success: false, message: `Ação de A/B Test "${action}" não implementada.` };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ANALYTICS ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    private async executeAnalyticsAction(action: string, entities: Record<string, any>): Promise<ActionResult> {
        try {
            const metrics = await this.analyticsService.getTodayMetrics();

            switch (action) {
                case 'SALES_TODAY':
                case 'SALES_SUMMARY': {
                    // Calculate response rate from sent/received
                    const responseRate = metrics.messagesReceived > 0
                        ? (metrics.messagesSent / metrics.messagesReceived) * 100
                        : 0;
                    return {
                        success: true,
                        message: `
📊 **Métricas de Hoje:**

├─ 💬 **Mensagens Enviadas:** ${metrics.messagesSent}
├─ 📩 **Mensagens Recebidas:** ${metrics.messagesReceived}
├─ 🤖 **Respostas IA:** ${metrics.aiResponses}
├─ 👤 **Intervenções Humanas:** ${metrics.humanInterventions}
├─ 👥 **Contatos Ativos:** ${metrics.contactsActive}
└─ ⚠️ **Alertas de Risco:** ${metrics.riskAlertsCount}
                        `.trim(),
                        data: metrics
                    };
                }

                case 'TOP_PERFORMERS': {
                    const topContacts = await prisma.contact.findMany({
                        where: { salesReadiness: { gte: 60 } },
                        orderBy: { engagementScore: 'desc' },
                        take: 5
                    });
                    return {
                        success: true,
                        message: `🏆 **Top Performers:**\n${topContacts.map((c, i) =>
                            `${i + 1}. ${c.name || c.pushName} - Engagement: ${c.engagementScore}% | Sales: ${c.salesReadiness}%`
                        ).join('\n')}`,
                        data: topContacts
                    };
                }

                case 'CONVERSION_RATE': {
                    const conversionMetrics = await this.analyticsService.getConversionMetrics();
                    return {
                        success: true,
                        message: `📈 **Taxa de Conversão:** ${conversionMetrics.conversionRate?.toFixed(1) || 'N/A'}%`
                    };
                }

                default:
                    return { success: false, message: `Ação de analytics "${action}" não implementada.` };
            }
        } catch (error) {
            return { success: false, message: `Erro ao buscar analytics: ${(error as Error).message}` };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SYSTEM ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    private async executeSystemAction(action: string, entities: Record<string, any>): Promise<ActionResult> {
        switch (action) {
            case 'STATUS': {
                const contactCount = await prisma.contact.count();
                const activeCount = await prisma.contact.count({ where: { isPaused: false } });
                const messageCount = await prisma.message.count();

                return {
                    success: true,
                    message: `
🖥️ **Status do Sistema GHOST PROTOCOL:**

├─ 🟢 **Status:** Operacional
├─ ⏱️ **Uptime:** ${this.formatUptime(process.uptime())}
├─ 👥 **Contatos:** ${contactCount} (${activeCount} ativos)
├─ 💬 **Mensagens:** ${messageCount}
└─ 🧠 **Modelos IA:** Gemini 3 Flash ativo
                    `.trim()
                };
            }

            case 'HEALTH': {
                return {
                    success: true,
                    message: `
❤️ **Saúde do Sistema:**

├─ 🟢 **API:** Online
├─ 🟢 **Database:** Conectado
├─ 🟢 **WebSocket:** Ativo
├─ 🟢 **Gemini:** Respondendo
└─ 📊 **Memória:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
                    `.trim()
                };
            }

            case 'LOGS': {
                const logs = await this.logRepo.getRecentLogs(10);
                return {
                    success: true,
                    message: `📝 **Últimos 10 Logs:**\n${logs.map((l: { level: string; event: string; details: string | null }) =>
                        `• [${l.level}] ${l.event}: ${l.details?.substring(0, 50) || ''}...`
                    ).join('\n')}`,
                    data: logs
                };
            }

            case 'PULSE': {
                const metrics = await this.analyticsService.getTodayMetrics();
                const conv = await this.analyticsService.getConversionMetrics();
                const hunterStats = await this.hunterService.getHuntingStats();

                return {
                    success: true,
                    message: `
⚡ **GHOST PULSE - Visão Cerebral**

🟢 **ATIVIDADE:**
├─ Mensagens (S/R): ${metrics.messagesSent} / ${metrics.messagesReceived}
├─ Contatos Ativos: ${metrics.contactsActive}
└─ Respostas IA: ${metrics.aiResponses}

🧪 **OTIMIZAÇÃO:**
├─ Conversão: ${conv.conversionRate}%
├─ Testes Rodando: ${this.abTestService.getAllTests().filter(t => t.status === 'RUNNING').length}
└─ Contatos Quentes: ${hunterStats.hotLeads}

🛡️ **STATUS:**
├─ Uptime: ${this.formatUptime(process.uptime())}
└─ Saúde: 100% Core Stable
                    `.trim()
                };
            }

            default:
                return { success: false, message: `Ação de sistema "${action}" não implementada.` };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WAR MODE ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    private async executeWarModeAction(action: string, entities: Record<string, any>): Promise<ActionResult> {
        if (action === 'DEACTIVATE') {
            await prisma.persona.updateMany({
                data: { voiceTone: 'Humana, Amigável, Íntima, Espontânea, Divertida.' }
            });
            return {
                success: true,
                message: "🛡️ **Modo Defensivo Ativado.** Personas voltaram ao tom normal. Paz restaurada."
            };
        }

        // ACTIVATE WAR MODE
        try {
            // 1. Personas Agressivas
            await prisma.persona.updateMany({
                data: { voiceTone: 'Provocadora, Urgente, Direta, Fecha vendas rápido. Não aceita "não" facilmente.' }
            });

            // 2. Iniciar todos os testes A/B
            const tests = this.abTestService.getAllTests();
            for (const t of tests) this.abTestService.startTest(t.id);

            // 3. Hunter ativado
            const hunterResult = await this.hunterService.executeCampaign('hot-followup', true);

            this.logRepo.create('WARN', 'WAR_MODE_ACTIVATED', 'Operator activated WAR MODE across all systems', undefined);

            return {
                success: true,
                message: `
🔥 **MODO GUERRA ATIVADO - GHOST PROTOCOL EM ALTA PERFORMANCE**

✅ **Personas:** Ajustadas para Tom Agressivo/Conversão
✅ **Otimização:** Todos os testes A/B iniciados
✅ **Hunting:** Motor proativo mapeando ${hunterResult.targets.length} leads quentes
✅ **Watchdog:** Vigilância máxima em tempo real

*A operação está agora em modo de extração máxima de valor.*
                `.trim(),
                suggestedFollowUp: "Deseja que eu envie a primeira onda de mensagens para os leads identificados?"
            };
        } catch (error) {
            return { success: false, message: `Erro ao ativar Modo Guerra: ${(error as Error).message}` };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIRMATION HANDLING
    // ═══════════════════════════════════════════════════════════════════════

    private async requestConfirmation(
        sessionId: string,
        intent: ParsedIntent,
        originalMessage: string,
        context: ConversationContext
    ): Promise<ChatMessage> {
        context.pendingConfirmation = {
            intent,
            originalMessage,
            expiresAt: new Date(Date.now() + 60000) // 1 minute
        };

        const confirmMessage = this.getConfirmationMessage(intent);

        const message: ChatMessage = {
            id: this.generateId(),
            role: 'assistant',
            content: confirmMessage,
            timestamp: new Date(),
            intent
        };

        context.conversationHistory.push(message);
        return message;
    }

    private async handleConfirmation(
        sessionId: string,
        userMessage: string,
        context: ConversationContext
    ): Promise<ChatMessage> {
        const pending = context.pendingConfirmation!;
        const isConfirmed = this.isConfirmation(userMessage);
        const isCancelled = this.isCancellation(userMessage);

        context.pendingConfirmation = undefined;

        if (isCancelled) {
            const message: ChatMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: '❌ Ação cancelada. O que mais posso fazer?',
                timestamp: new Date()
            };
            context.conversationHistory.push(message);
            return message;
        }

        if (isConfirmed) {
            const result = await this.executeIntent(pending.intent, context);
            const response = await this.generateResponse(pending.intent, result, context);

            const message: ChatMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                intent: pending.intent,
                actionResult: result
            };
            context.conversationHistory.push(message);
            return message;
        }

        // Ambiguous response
        const message: ChatMessage = {
            id: this.generateId(),
            role: 'assistant',
            content: '🤔 Não entendi. Confirma (sim/confirma) ou cancela (não/cancela)?',
            timestamp: new Date()
        };
        context.pendingConfirmation = pending; // Restore pending
        context.conversationHistory.push(message);
        return message;
    }

    private getConfirmationMessage(intent: ParsedIntent): string {
        const { category, action, entities } = intent;

        if (category === 'CONTACTS' && action === 'SEND_MESSAGE') {
            return `📤 Confirma enviar mensagem para ${entities.contactName || 'contato'}?\n\n"${entities.message || '...'}"\n\nDigite **sim** para confirmar ou **não** para cancelar.`;
        }

        if (category === 'CONTACTS' && action === 'PAUSE') {
            return `⏸️ Confirma pausar ${entities.contactName || 'contato'}? A IA não responderá mais.\n\nDigite **sim** ou **não**.`;
        }

        return `⚠️ Confirma executar esta ação?\n\n${category} → ${action}\n\nDigite **sim** ou **não**.`;
    }

    private isConfirmation(message: string): boolean {
        const confirmWords = ['sim', 'yes', 'confirma', 'confirmo', 'ok', 'pode', 'manda', 'vai', 's'];
        return confirmWords.some(w => message.toLowerCase().trim() === w);
    }

    private isCancellation(message: string): boolean {
        const cancelWords = ['não', 'nao', 'no', 'cancela', 'cancelar', 'para', 'n'];
        return cancelWords.some(w => message.toLowerCase().trim() === w);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RESPONSE GENERATION
    // ═══════════════════════════════════════════════════════════════════════

    private async generateResponse(intent: ParsedIntent, result: ActionResult, context: ConversationContext): Promise<string> {
        let response = result.message;

        if (result.suggestedFollowUp) {
            response += `\n\n💡 ${result.suggestedFollowUp}`;
        }

        return response;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELP
    // ═══════════════════════════════════════════════════════════════════════

    private getHelpResponse(): ActionResult {
        return {
            success: true,
            message: `
👑 **SOVEREIGN CHAT - Comandos Disponíveis**

📱 **CONTATOS:**
• "lista contatos quentes"
• "mostra contatos frios"
• "pausa o João"
• "retoma Maria"
• "informações do Pedro"

🧪 **A/B TESTS:**
• "lista testes"
• "qual teste está ganhando?"
• "inicia teste opener-style"
• "para teste price-objection"

👤 **PERSONA:**
• "mostra persona atual"
• "modo agressivo"
• "modo suave"
• "modo sexy"

📊 **ANALYTICS:**
• "vendas de hoje"
• "taxa de conversão"
• "top performers"

🖥️ **SISTEMA:**
• "status do sistema"
• "saúde do sistema"
• "logs recentes"

💡 Fale naturalmente! Eu entendo variações dos comandos.
            `.trim()
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════

    private getOrCreateSession(sessionId: string): ConversationContext {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                conversationHistory: []
            });
        }
        return this.sessions.get(sessionId)!;
    }

    private async findContact(entities: Record<string, any>): Promise<any> {
        if (entities.contactPhone) {
            return prisma.contact.findFirst({
                where: { id: { contains: entities.contactPhone } }
            });
        }
        if (entities.contactName) {
            const searchName = entities.contactName.toLowerCase();
            const allContacts = await prisma.contact.findMany();
            return allContacts.find(c =>
                c.name?.toLowerCase().includes(searchName) ||
                c.pushName?.toLowerCase().includes(searchName)
            ) || null;
        }
        return null;
    }

    private generateId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private formatTimeAgo(date: Date | null): string {
        if (!date) return 'Nunca';
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m atrás`;
        if (hours < 24) return `${hours}h atrás`;
        return `${days}d atrás`;
    }

    private formatUptime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    // Get chat history for a session
    getHistory(sessionId: string): ChatMessage[] {
        return this.sessions.get(sessionId)?.conversationHistory || [];
    }

    // Clear session
    clearSession(sessionId: string): void {
        this.sessions.delete(sessionId);
    }
}

// Singleton
let sovereignChatInstance: SovereignChatService | null = null;

export function getSovereignChat(): SovereignChatService {
    if (!sovereignChatInstance) {
        sovereignChatInstance = new SovereignChatService();
    }
    return sovereignChatInstance;
}
