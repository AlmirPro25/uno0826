/**
 * 🧠 MEMORY SERVICE
 * Memória de longo prazo do Ghost Protocol.
 * Gera resumos diários/mensais e mantém contexto centenário.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { LogRepository } from '../repositories/log.repository';

const prisma = new PrismaClient();

export interface DailySummary {
    summary: string;
    keyInsights: string[];
    salesCount: number;
    revenue: number;
    messagesReceived: number;
    messagesSent: number;
    avgSentiment: number;
    topTopics: string[];
}

export interface ContactProfile {
    contactId: string;
    name: string;
    relationship: string;
    preferences: string[];
    purchaseHistory: string[];
    importantDates: string[];
    conversationHighlights: string[];
}

export class MemoryService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private logRepo = new LogRepository();

    constructor() {
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: { responseMimeType: 'application/json' }
        });
    }

    /**
     * Gera o resumo diário de todas as conversas
     */
    async generateDailySummary(date?: Date): Promise<DailySummary> {
        const targetDate = date || new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const periodString = targetDate.toISOString().split('T')[0]; // "2026-01-24"

        try {
            // 1. Buscar todas as mensagens do dia
            const messages = await prisma.message.findMany({
                where: {
                    timestamp: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: { contact: true },
                orderBy: { timestamp: 'asc' }
            });

            if (messages.length === 0) {
                this.logRepo.create('INFO', 'DAILY_SUMMARY', `No messages for ${periodString}`, undefined);
                return this.getEmptySummary();
            }

            // 2. Agrupar por contato
            const byContact: Record<string, typeof messages> = {};
            messages.forEach(msg => {
                if (!byContact[msg.contactId]) byContact[msg.contactId] = [];
                byContact[msg.contactId].push(msg);
            });

            // 3. Preparar contexto para Gemini
            const conversationSummaries = Object.entries(byContact).map(([contactId, msgs]) => {
                const contact = msgs[0].contact;
                const conversation = msgs.map(m => `[${m.fromMe ? 'EU' : 'CLIENTE'}]: ${m.body}`).join('\n');
                return `
=== CONVERSA COM ${contact?.name || contactId} ===
Stats: Confiança=${contact?.trustLevel}% | Intimidade=${contact?.intimacyLevel}% | Prontidão Venda=${contact?.salesReadiness}%
${conversation}
`;
            }).join('\n\n');

            // 4. Análise com Gemini
            const prompt = `
Você é o CÉREBRO de um sistema de vendas. Analise o dia de trabalho abaixo.

DATA: ${periodString}
TOTAL DE MENSAGENS: ${messages.length}
CONTATOS ATIVOS: ${Object.keys(byContact).length}

CONVERSAS DO DIA:
${conversationSummaries}

Retorne um JSON com:
{
  "summary": "Resumo executivo do dia em 2-3 frases. O que aconteceu de mais importante?",
  "keyInsights": ["Array de 3-5 insights importantes para melhorar amanhã"],
  "salesCount": número_de_vendas_concretas_realizadas,
  "revenue": receita_total_se_mencionada_ou_0,
  "topTopics": ["array dos 3 tópicos mais discutidos"],
  "emotionalTrend": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "actionItemsForTomorrow": ["o que fazer amanhã baseado em hoje"]
}
      `;

            const result = await this.model.generateContent(prompt);
            const analysis = JSON.parse(result.response.text());

            // 5. Salvar no banco
            await prisma.memorySummary.upsert({
                where: {
                    contactId_type_period: {
                        contactId: '', // Global summary
                        type: 'DAILY',
                        period: periodString
                    }
                },
                update: {
                    summary: analysis.summary,
                    keyInsights: JSON.stringify(analysis.keyInsights),
                    salesCount: analysis.salesCount || 0,
                    revenue: analysis.revenue || 0,
                    messagesReceived: messages.filter(m => !m.fromMe).length,
                    messagesSent: messages.filter(m => m.fromMe).length,
                    topTopics: JSON.stringify(analysis.topTopics || [])
                },
                create: {
                    type: 'DAILY',
                    period: periodString,
                    summary: analysis.summary,
                    keyInsights: JSON.stringify(analysis.keyInsights),
                    salesCount: analysis.salesCount || 0,
                    revenue: analysis.revenue || 0,
                    messagesReceived: messages.filter(m => !m.fromMe).length,
                    messagesSent: messages.filter(m => m.fromMe).length,
                    topTopics: JSON.stringify(analysis.topTopics || [])
                }
            });

            this.logRepo.create('INFO', 'DAILY_SUMMARY_GENERATED', `Summary for ${periodString}: ${messages.length} messages, ${analysis.salesCount} sales`, undefined);

            return {
                summary: analysis.summary,
                keyInsights: analysis.keyInsights,
                salesCount: analysis.salesCount || 0,
                revenue: analysis.revenue || 0,
                messagesReceived: messages.filter(m => !m.fromMe).length,
                messagesSent: messages.filter(m => m.fromMe).length,
                avgSentiment: 0,
                topTopics: analysis.topTopics || []
            };

        } catch (error) {
            console.error('Daily Summary Error:', error);
            this.logRepo.create('ERROR', 'DAILY_SUMMARY_ERROR', (error as Error).message, undefined);
            return this.getEmptySummary();
        }
    }

    /**
     * Gera perfil profundo de um contato específico
     */
    async generateContactProfile(contactId: string): Promise<ContactProfile | null> {
        try {
            const contact = await prisma.contact.findUnique({
                where: { id: contactId },
                include: {
                    messages: {
                        orderBy: { timestamp: 'desc' },
                        take: 100
                    }
                }
            });

            if (!contact) return null;

            const conversation = contact.messages
                .reverse()
                .map(m => `[${m.fromMe ? 'EU' : 'CLIENTE'}]: ${m.body}`)
                .join('\n');

            const prompt = `
Analise o histórico de conversa com este cliente e crie um PERFIL PSICOLÓGICO.

NOME: ${contact.name || 'Desconhecido'}
STATS: Confiança=${contact.trustLevel}% | Intimidade=${contact.intimacyLevel}% | Vendas=${contact.salesReadiness}%

HISTÓRICO:
${conversation}

Retorne JSON:
{
  "relationship": "Tipo de relacionamento (cliente frio, cliente quente, amigo, potencial VIP)",
  "preferences": ["array de preferências/gostos mencionados"],
  "purchaseHistory": ["produtos/serviços já comprados ou interessados"],
  "importantDates": ["datas importantes mencionadas (aniversário, etc)"],
  "conversationHighlights": ["momentos marcantes da conversa"],
  "personalityTraits": ["traços de personalidade detectados"],
  "bestApproach": "Como abordar este cliente para maximizar conversão"
}
      `;

            const result = await this.model.generateContent(prompt);
            const profile = JSON.parse(result.response.text());

            // Salvar como CONTACT_PROFILE
            await prisma.memorySummary.upsert({
                where: {
                    contactId_type_period: {
                        contactId,
                        type: 'CONTACT_PROFILE',
                        period: 'LATEST'
                    }
                },
                update: {
                    summary: profile.bestApproach,
                    keyInsights: JSON.stringify(profile.personalityTraits)
                },
                create: {
                    contactId,
                    type: 'CONTACT_PROFILE',
                    period: 'LATEST',
                    summary: profile.bestApproach,
                    keyInsights: JSON.stringify(profile.personalityTraits)
                }
            });

            return {
                contactId,
                name: contact.name || 'Desconhecido',
                relationship: profile.relationship,
                preferences: profile.preferences,
                purchaseHistory: profile.purchaseHistory,
                importantDates: profile.importantDates,
                conversationHighlights: profile.conversationHighlights
            };

        } catch (error) {
            console.error('Contact Profile Error:', error);
            return null;
        }
    }

    /**
     * Busca memórias relevantes para contexto
     */
    async getRelevantMemories(contactId: string, query?: string): Promise<string> {
        // Buscar últimos resumos
        const summaries = await prisma.memorySummary.findMany({
            where: {
                OR: [
                    { contactId: null, type: 'DAILY' },
                    { contactId, type: 'CONTACT_PROFILE' }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        if (summaries.length === 0) return '';

        const memoryContext = summaries.map(s => {
            if (s.type === 'DAILY') {
                return `[MEMÓRIA ${s.period}]: ${s.summary}`;
            }
            return `[PERFIL DO CLIENTE]: ${s.summary}`;
        }).join('\n');

        return `
MEMÓRIA DE LONGO PRAZO:
${memoryContext}
    `;
    }

    /**
     * Agenda geração de resumo (para cron job)
     */
    async scheduledDailySummary(): Promise<void> {
        // Gera resumo do dia anterior
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        await this.generateDailySummary(yesterday);
    }

    private getEmptySummary(): DailySummary {
        return {
            summary: 'Nenhuma atividade registrada.',
            keyInsights: [],
            salesCount: 0,
            revenue: 0,
            messagesReceived: 0,
            messagesSent: 0,
            avgSentiment: 0,
            topTopics: []
        };
    }
}
