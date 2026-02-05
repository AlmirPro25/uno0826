/**
 * 🎯 OBJECTION LEARNER SERVICE
 * Aprende como o operador humano lida com objeções.
 * Detecta padrões de objeção e respostas bem-sucedidas.
 * Alimenta a IA com técnicas de vendas comprovadas.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient, Message } from '@prisma/client';
import { env } from '../config/env';
import { LogRepository } from '../repositories/log.repository';

const prisma = new PrismaClient();

export interface ObjectionMatch {
    patternId: string;
    triggerPattern: string;
    category: string;
    winningResponse: string;
    successRate: number;
}

export type ObjectionCategory = 'PRICE' | 'TRUST' | 'TIMING' | 'NEED' | 'COMPETITION' | 'OTHER';

export class ObjectionLearnerService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private logRepo = new LogRepository();

    // Padrões de objeção comuns em pt-br
    private readonly OBJECTION_PATTERNS: Record<ObjectionCategory, string[]> = {
        PRICE: ['tá caro', 'muito caro', 'caro demais', 'não tenho grana', 'sem dinheiro', 'não posso pagar', 'fora do orçamento', 'desconto'],
        TRUST: ['não confio', 'golpe', 'enganada', 'fake', 'mentira', 'verdade', 'real', 'comprovante'],
        TIMING: ['depois', 'agora não', 'sem tempo', 'ocupada', 'amanhã', 'semana que vem', 'mês que vem'],
        NEED: ['não preciso', 'não quero', 'não tô afim', 'já tenho', 'não me interessa'],
        COMPETITION: ['achei mais barato', 'outra pessoa', 'outro lugar', 'concorrente'],
        OTHER: ['talvez', 'vou pensar', 'não sei', 'deixa pra lá']
    };

    constructor() {
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: { responseMimeType: 'application/json' }
        });
    }

    /**
     * Detecta se uma mensagem é uma objeção
     */
    detectObjection(message: string): { isObjection: boolean; category: ObjectionCategory | null; pattern: string | null } {
        const lowerMsg = message.toLowerCase();

        for (const [category, patterns] of Object.entries(this.OBJECTION_PATTERNS)) {
            for (const pattern of patterns) {
                if (lowerMsg.includes(pattern)) {
                    return {
                        isObjection: true,
                        category: category as ObjectionCategory,
                        pattern
                    };
                }
            }
        }

        return { isObjection: false, category: null, pattern: null };
    }

    /**
     * Aprende uma nova resposta bem-sucedida do operador
     */
    async learnFromOperator(
        objectionMessage: Message,
        operatorResponse: Message,
        wasSuccessful: boolean = true
    ): Promise<void> {
        const detection = this.detectObjection(objectionMessage.body);

        if (!detection.isObjection || !detection.category || !detection.pattern) {
            return;
        }

        try {
            // Verificar se já existe padrão similar
            const existing = await prisma.objectionPattern.findFirst({
                where: {
                    triggerPattern: detection.pattern,
                    category: detection.category
                }
            });

            if (existing) {
                // Atualizar estatísticas
                await prisma.objectionPattern.update({
                    where: { id: existing.id },
                    data: {
                        timesUsed: existing.timesUsed + 1,
                        timesConverted: wasSuccessful ? existing.timesConverted + 1 : existing.timesConverted,
                        successRate: wasSuccessful
                            ? (existing.timesConverted + 1) / (existing.timesUsed + 1)
                            : existing.timesConverted / (existing.timesUsed + 1),
                        // Se nova resposta é melhor (mais recente e bem-sucedida), atualiza
                        winningResponse: wasSuccessful ? operatorResponse.body : existing.winningResponse
                    }
                });
            } else {
                // Criar novo padrão
                await prisma.objectionPattern.create({
                    data: {
                        triggerPattern: detection.pattern,
                        category: detection.category,
                        winningResponse: operatorResponse.body,
                        successRate: wasSuccessful ? 1.0 : 0.0,
                        timesUsed: 1,
                        timesConverted: wasSuccessful ? 1 : 0,
                        learnedFromOperator: true,
                        sourceMessageId: operatorResponse.id
                    }
                });
            }

            this.logRepo.create('INFO', 'OBJECTION_LEARNED',
                `Learned ${detection.category} objection handling: "${detection.pattern}" -> "${operatorResponse.body.substring(0, 50)}..."`,
                objectionMessage.contactId
            );

        } catch (error) {
            console.error('Objection Learning Error:', error);
            this.logRepo.create('ERROR', 'OBJECTION_LEARN_ERROR', (error as Error).message, undefined);
        }
    }

    /**
     * Busca melhor resposta para uma objeção
     */
    async getBestResponse(objectionMessage: string, intimacyLevel: number = 50): Promise<ObjectionMatch | null> {
        const detection = this.detectObjection(objectionMessage);

        if (!detection.isObjection || !detection.category) {
            return null;
        }

        try {
            // Buscar padrões da mesma categoria ordenados por taxa de sucesso
            const patterns = await prisma.objectionPattern.findMany({
                where: {
                    category: detection.category,
                    isActive: true,
                    intimacyThreshold: { lte: intimacyLevel }
                },
                orderBy: { successRate: 'desc' },
                take: 3
            });

            if (patterns.length === 0) return null;

            // Retornar o melhor
            const best = patterns[0];
            return {
                patternId: best.id,
                triggerPattern: best.triggerPattern,
                category: best.category,
                winningResponse: best.winningResponse,
                successRate: best.successRate
            };

        } catch (error) {
            console.error('Get Best Response Error:', error);
            return null;
        }
    }

    /**
     * Analisa histórico e aprende automaticamente
     */
    async analyzeAndLearn(): Promise<number> {
        try {
            // Buscar conversas onde operador respondeu a mensagens do cliente
            const operatorMessages = await prisma.message.findMany({
                where: {
                    fromMe: true,
                    isOperator: true
                },
                orderBy: { timestamp: 'asc' },
                take: 500
            });

            let learned = 0;

            for (const opMsg of operatorMessages) {
                // Buscar mensagem anterior (do cliente)
                const previousMsg = await prisma.message.findFirst({
                    where: {
                        contactId: opMsg.contactId,
                        timestamp: { lt: opMsg.timestamp },
                        fromMe: false
                    },
                    orderBy: { timestamp: 'desc' }
                });

                if (!previousMsg) continue;

                const detection = this.detectObjection(previousMsg.body);
                if (detection.isObjection) {
                    await this.learnFromOperator(previousMsg, opMsg, true);
                    learned++;
                }
            }

            this.logRepo.create('INFO', 'OBJECTION_ANALYSIS_COMPLETE', `Learned from ${learned} objection interactions`, undefined);
            return learned;

        } catch (error) {
            console.error('Analyze and Learn Error:', error);
            return 0;
        }
    }

    /**
     * Gera prompt com técnicas de objeção aprendidas
     */
    async generateObjectionPrompt(): Promise<string> {
        const patterns = await prisma.objectionPattern.findMany({
            where: { isActive: true, successRate: { gte: 0.5 } },
            orderBy: { successRate: 'desc' },
            take: 10
        });

        if (patterns.length === 0) return '';

        const objectionGuide = patterns.map(p =>
            `- Se cliente diz "${p.triggerPattern}" (${p.category}): Responda algo como "${p.winningResponse}" (${Math.round(p.successRate * 100)}% sucesso)`
        ).join('\n');

        return `
TÉCNICAS DE OBJEÇÃO APRENDIDAS DO OPERADOR:
${objectionGuide}

Use estas respostas como INSPIRAÇÃO, adaptando ao contexto atual. Estas são técnicas que FUNCIONARAM no passado.
    `;
    }

    /**
     * Marca uma resposta como bem-sucedida (feedback loop)
     */
    async markSuccess(patternId: string): Promise<void> {
        const pattern = await prisma.objectionPattern.findUnique({
            where: { id: patternId }
        });

        if (pattern) {
            await prisma.objectionPattern.update({
                where: { id: patternId },
                data: {
                    timesConverted: pattern.timesConverted + 1,
                    successRate: (pattern.timesConverted + 1) / pattern.timesUsed
                }
            });
        }
    }
}
