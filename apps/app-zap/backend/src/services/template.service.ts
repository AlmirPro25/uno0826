/**
 * 📝 CONVERSATION TEMPLATES SERVICE
 * Templates inteligentes de mensagem.
 * Personalização automática baseada em contexto.
 */

import { PrismaClient } from '@prisma/client';
import { GeminiService } from './gemini.service';

const prisma = new PrismaClient();

export interface MessageTemplate {
    id: string;
    name: string;
    category: 'GREETING' | 'FOLLOWUP' | 'CLOSING' | 'OBJECTION' | 'REACTIVATION' | 'PROMO' | 'CUSTOM';
    template: string;
    variables: string[];
    tone: 'CASUAL' | 'PROFESSIONAL' | 'FLIRTY' | 'FRIENDLY' | 'URGENT';
    useAI: boolean; // Se true, usa IA para personalizar
    successRate: number;
    usageCount: number;
    isActive: boolean;
}

export interface TemplateContext {
    contactName: string;
    intimacyLevel: number;
    daysSinceContact: number;
    lastTopic?: string;
    purchaseHistory?: string[];
    preferences?: string[];
}

export class TemplateService {
    private geminiService = new GeminiService();
    private templates: Map<string, MessageTemplate> = new Map();

    constructor() {
        this.initializeDefaultTemplates();
    }

    private initializeDefaultTemplates(): void {
        const defaults: MessageTemplate[] = [
            // GREETING Templates
            {
                id: 'greeting-casual',
                name: 'Saudação Casual',
                category: 'GREETING',
                template: 'Oi {nome}! Tudo bem com você? 😊',
                variables: ['nome'],
                tone: 'CASUAL',
                useAI: false,
                successRate: 75,
                usageCount: 0,
                isActive: true
            },
            {
                id: 'greeting-flirty',
                name: 'Saudação Sedutora',
                category: 'GREETING',
                template: 'Oii {nome}... estava pensando em você agora 💭😏',
                variables: ['nome'],
                tone: 'FLIRTY',
                useAI: false,
                successRate: 82,
                usageCount: 0,
                isActive: true
            },
            {
                id: 'greeting-morning',
                name: 'Bom Dia',
                category: 'GREETING',
                template: 'Bom dia {nome}! ☀️ Acordou bem?',
                variables: ['nome'],
                tone: 'FRIENDLY',
                useAI: false,
                successRate: 70,
                usageCount: 0,
                isActive: true
            },
            {
                id: 'greeting-night',
                name: 'Boa Noite',
                category: 'GREETING',
                template: 'Boa noite {nome}... 🌙 O que fez hoje?',
                variables: ['nome'],
                tone: 'FRIENDLY',
                useAI: false,
                successRate: 68,
                usageCount: 0,
                isActive: true
            },

            // FOLLOWUP Templates
            {
                id: 'followup-gentle',
                name: 'Follow-up Suave',
                category: 'FOLLOWUP',
                template: 'Ei {nome}, sumiu! 😢 Tava com saudade de conversar com você',
                variables: ['nome'],
                tone: 'FRIENDLY',
                useAI: false,
                successRate: 65,
                usageCount: 0,
                isActive: true
            },
            {
                id: 'followup-curious',
                name: 'Follow-up Curioso',
                category: 'FOLLOWUP',
                template: '{nome}! Fiquei curiosa... você pensou sobre o que conversamos?',
                variables: ['nome'],
                tone: 'CASUAL',
                useAI: false,
                successRate: 72,
                usageCount: 0,
                isActive: true
            },
            {
                id: 'followup-value',
                name: 'Follow-up com Valor',
                category: 'FOLLOWUP',
                template: 'Oi {nome}! Lembrei de você porque vi algo que combina muito com o que você comentou... quer ver?',
                variables: ['nome'],
                tone: 'CASUAL',
                useAI: true,
                successRate: 78,
                usageCount: 0,
                isActive: true
            },

            // CLOSING Templates
            {
                id: 'closing-soft',
                name: 'Fechamento Suave',
                category: 'CLOSING',
                template: 'E aí {nome}, quer aproveitar enquanto está disponível? 😉',
                variables: ['nome'],
                tone: 'CASUAL',
                useAI: false,
                successRate: 55,
                usageCount: 0,
                isActive: true
            },
            {
                id: 'closing-urgency',
                name: 'Fechamento Urgente',
                category: 'CLOSING',
                template: '{nome}, última chance! Só tenho até hoje essa condição especial pra você 🔥',
                variables: ['nome'],
                tone: 'URGENT',
                useAI: false,
                successRate: 62,
                usageCount: 0,
                isActive: true
            },
            {
                id: 'closing-exclusive',
                name: 'Fechamento Exclusivo',
                category: 'CLOSING',
                template: 'Amor, preparei algo especial só pra você... quer ver? 🎁',
                variables: ['nome'],
                tone: 'FLIRTY',
                useAI: false,
                successRate: 70,
                usageCount: 0,
                isActive: true
            },

            // OBJECTION Templates
            {
                id: 'objection-price',
                name: 'Objeção de Preço',
                category: 'OBJECTION',
                template: 'Entendo {nome}! Olha, posso fazer algo especial pra você... que tal a gente parcelar?',
                variables: ['nome'],
                tone: 'FRIENDLY',
                useAI: true,
                successRate: 58,
                usageCount: 0,
                isActive: true
            },
            {
                id: 'objection-timing',
                name: 'Objeção de Tempo',
                category: 'OBJECTION',
                template: 'Tá bom {nome}, fico aqui quando você quiser. Mas lembra que isso não vai durar pra sempre 😉',
                variables: ['nome'],
                tone: 'CASUAL',
                useAI: false,
                successRate: 45,
                usageCount: 0,
                isActive: true
            },
            {
                id: 'objection-trust',
                name: 'Objeção de Confiança',
                category: 'OBJECTION',
                template: '{nome}, entendo sua preocupação! Posso te mostrar alguns depoimentos de outras pessoas que já experimentaram?',
                variables: ['nome'],
                tone: 'PROFESSIONAL',
                useAI: true,
                successRate: 52,
                usageCount: 0,
                isActive: true
            },

            // REACTIVATION Templates
            {
                id: 'reactivation-miss',
                name: 'Reativação Saudade',
                category: 'REACTIVATION',
                template: '{nome}! Sumiu de vez... tava com saudade das nossas conversas 😢',
                variables: ['nome'],
                tone: 'FRIENDLY',
                useAI: false,
                successRate: 40,
                usageCount: 0,
                isActive: true
            },
            {
                id: 'reactivation-news',
                name: 'Reativação Novidade',
                category: 'REACTIVATION',
                template: 'Oi {nome}! Tenho novidades que você vai amar... posso te contar?',
                variables: ['nome'],
                tone: 'CASUAL',
                useAI: false,
                successRate: 48,
                usageCount: 0,
                isActive: true
            },
            {
                id: 'reactivation-ai',
                name: 'Reativação IA',
                category: 'REACTIVATION',
                template: '',
                variables: ['nome', 'lastTopic', 'daysSinceContact'],
                tone: 'CASUAL',
                useAI: true,
                successRate: 55,
                usageCount: 0,
                isActive: true
            },

            // PROMO Templates
            {
                id: 'promo-flash',
                name: 'Promoção Relâmpago',
                category: 'PROMO',
                template: '🔥 {nome}! Promoção RELÂMPAGO só hoje! {desconto}% de desconto, corre! ⏰',
                variables: ['nome', 'desconto'],
                tone: 'URGENT',
                useAI: false,
                successRate: 35,
                usageCount: 0,
                isActive: true
            },
            {
                id: 'promo-vip',
                name: 'Promoção VIP',
                category: 'PROMO',
                template: 'Psiu {nome}... tenho um presente especial só pra você porque você é VIP pra mim 👑💜',
                variables: ['nome'],
                tone: 'FLIRTY',
                useAI: false,
                successRate: 52,
                usageCount: 0,
                isActive: true
            }
        ];

        defaults.forEach(t => this.templates.set(t.id, t));
    }

    /**
     * Obtém todos os templates
     */
    listTemplates(category?: MessageTemplate['category']): MessageTemplate[] {
        const all = Array.from(this.templates.values());
        if (category) {
            return all.filter(t => t.category === category);
        }
        return all;
    }

    /**
     * Obtém template por ID
     */
    getTemplate(templateId: string): MessageTemplate | null {
        return this.templates.get(templateId) || null;
    }

    /**
     * Aplica template com variáveis
     */
    applyTemplate(templateId: string, variables: Record<string, string>): string {
        const template = this.templates.get(templateId);
        if (!template) return '';

        let message = template.template;
        for (const [key, value] of Object.entries(variables)) {
            message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }

        // Increment usage
        template.usageCount++;

        return message;
    }

    /**
     * Gera mensagem personalizada com IA
     */
    async generatePersonalizedMessage(
        templateId: string,
        context: TemplateContext
    ): Promise<string> {
        const template = this.templates.get(templateId);
        if (!template) return '';

        // If template doesn't use AI, just apply variables
        if (!template.useAI) {
            return this.applyTemplate(templateId, { nome: context.contactName });
        }

        // Generate with AI
        const prompt = this.buildPrompt(template, context);

        try {
            // Create a mock contact and message for the GeminiService
            const mockContact = {
                id: 'template-gen',
                name: context.contactName,
                intimacyLevel: context.intimacyLevel,
            } as any;

            const mockMessages = [
                { body: prompt, fromMe: false, timestamp: new Date() }
            ] as any[];

            const response = await this.geminiService.generateResponse(mockContact, mockMessages);

            template.usageCount++;
            return response;
        } catch (error) {
            // Fallback to basic template
            return this.applyTemplate(templateId, { nome: context.contactName });
        }
    }

    /**
     * Constrói prompt para IA
     */
    private buildPrompt(template: MessageTemplate, context: TemplateContext): string {
        const toneDescriptions: Record<MessageTemplate['tone'], string> = {
            CASUAL: 'casual e descontraído, como amigos',
            PROFESSIONAL: 'profissional mas acolhedor',
            FLIRTY: 'sedutor e charmoso, com emojis românticos',
            FRIENDLY: 'amigável e caloroso',
            URGENT: 'urgente mas sem ser agressivo'
        };

        return `
Gere uma mensagem de ${template.category.toLowerCase()} para WhatsApp.

CONTEXTO:
- Nome do contato: ${context.contactName}
- Nível de intimidade: ${context.intimacyLevel}%
- Dias desde último contato: ${context.daysSinceContact}
${context.lastTopic ? `- Último assunto: ${context.lastTopic}` : ''}

TOM: ${toneDescriptions[template.tone]}

REGRAS:
- Máximo 150 caracteres
- Use emojis apropriados (1-3)
- Seja natural, como se estivesse no WhatsApp
- Não use saudações formais
- Personalize para o contexto

MODELO DE REFERÊNCIA (adapte):
"${template.template}"

Responda APENAS com a mensagem final, sem explicações.
    `.trim();
    }

    /**
     * Seleciona melhor template para situação
     */
    selectBestTemplate(
        category: MessageTemplate['category'],
        intimacyLevel: number,
        hourOfDay: number
    ): MessageTemplate | null {
        const templates = this.listTemplates(category).filter(t => t.isActive);
        if (templates.length === 0) return null;

        // Filter by appropriate tone based on intimacy
        let appropriateTones: MessageTemplate['tone'][];
        if (intimacyLevel > 70) {
            appropriateTones = ['FLIRTY', 'CASUAL', 'FRIENDLY'];
        } else if (intimacyLevel > 40) {
            appropriateTones = ['CASUAL', 'FRIENDLY'];
        } else {
            appropriateTones = ['FRIENDLY', 'PROFESSIONAL'];
        }

        let filtered = templates.filter(t => appropriateTones.includes(t.tone));
        if (filtered.length === 0) filtered = templates;

        // Sort by success rate and pick randomly from top 3
        filtered.sort((a, b) => b.successRate - a.successRate);
        const top = filtered.slice(0, 3);

        return top[Math.floor(Math.random() * top.length)];
    }

    /**
     * Registra sucesso/falha de um template
     */
    recordOutcome(templateId: string, success: boolean): void {
        const template = this.templates.get(templateId);
        if (!template) return;

        // Update success rate using exponential moving average
        const alpha = 0.1; // Learning rate
        const outcome = success ? 100 : 0;
        template.successRate = template.successRate * (1 - alpha) + outcome * alpha;
    }

    /**
     * Adiciona template customizado
     */
    addTemplate(template: Omit<MessageTemplate, 'successRate' | 'usageCount'>): MessageTemplate {
        const newTemplate: MessageTemplate = {
            ...template,
            successRate: 50, // Start at 50%
            usageCount: 0
        };
        this.templates.set(template.id, newTemplate);
        return newTemplate;
    }

    /**
     * Remove template
     */
    removeTemplate(templateId: string): boolean {
        return this.templates.delete(templateId);
    }

    /**
     * Ativa/desativa template
     */
    toggleTemplate(templateId: string, active: boolean): boolean {
        const template = this.templates.get(templateId);
        if (!template) return false;
        template.isActive = active;
        return true;
    }

    /**
     * Estatísticas de templates
     */
    getStats(): {
        totalTemplates: number;
        activeTemplates: number;
        totalUsage: number;
        topPerformers: { id: string; name: string; successRate: number }[];
        byCategory: Record<string, number>;
    } {
        const all = Array.from(this.templates.values());

        const byCategory: Record<string, number> = {};
        all.forEach(t => {
            byCategory[t.category] = (byCategory[t.category] || 0) + 1;
        });

        const topPerformers = [...all]
            .filter(t => t.usageCount > 0)
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 5)
            .map(t => ({ id: t.id, name: t.name, successRate: t.successRate }));

        return {
            totalTemplates: all.length,
            activeTemplates: all.filter(t => t.isActive).length,
            totalUsage: all.reduce((sum, t) => sum + t.usageCount, 0),
            topPerformers,
            byCategory
        };
    }
}
