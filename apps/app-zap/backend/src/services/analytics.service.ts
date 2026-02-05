/**
 * 📊 ANALYTICS SERVICE
 * Métricas em tempo real do Ghost Protocol.
 * Fornece insights sobre performance, conversão e saúde do sistema.
 */

import { PrismaClient } from '@prisma/client';
import { LogRepository } from '../repositories/log.repository';

const prisma = new PrismaClient();

export interface DailyMetrics {
    date: string;
    messagesReceived: number;
    messagesSent: number;
    aiResponses: number;
    humanInterventions: number;
    contactsActive: number;
    newContacts: number;
    avgResponseTimeMs: number;
    riskAlertsCount: number;
}

export interface ConversionMetrics {
    totalContacts: number;
    byStage: {
        cold: number;       // intimacy < 30
        warm: number;       // intimacy 30-60
        hot: number;        // intimacy > 60
        converted: number;  // salesReadiness > 80
    };
    conversionRate: number;
    avgTimeToConversion: number; // em dias
}

export interface PerformanceMetrics {
    uptime: number; // em segundos
    totalMessagesProcessed: number;
    avgProcessingTimeMs: number;
    errorRate: number;
    aiAccuracy: number; // baseado em feedback
}

export interface ContactRanking {
    contactId: string;
    name: string | null;
    score: number;
    intimacyLevel: number;
    salesReadiness: number;
    lastInteraction: Date;
    messageCount: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
}

export class AnalyticsService {
    private logRepo = new LogRepository();
    private startTime = Date.now();

    /**
     * Métricas do dia atual
     */
    async getTodayMetrics(): Promise<DailyMetrics> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const messages = await prisma.message.findMany({
            where: {
                timestamp: { gte: today, lt: tomorrow }
            }
        });

        const logs = await prisma.systemLog.findMany({
            where: {
                createdAt: { gte: today, lt: tomorrow }
            }
        });

        const contacts = await prisma.contact.findMany({
            where: {
                lastInteraction: { gte: today, lt: tomorrow }
            }
        });

        // Calcular métricas
        const messagesReceived = messages.filter(m => !m.fromMe).length;
        const messagesSent = messages.filter(m => m.fromMe).length;
        const aiResponses = messages.filter(m => m.fromMe && !m.isOperator).length;
        const humanInterventions = messages.filter(m => m.fromMe && m.isOperator).length;

        const riskAlerts = logs.filter(l => l.event.startsWith('RISK_DETECTED')).length;

        // Calculate Real Avg Response Time
        let totalResponseTime = 0;
        let responseCount = 0;
        const sortedMessages = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        for (let i = 1; i < sortedMessages.length; i++) {
            const prev = sortedMessages[i - 1];
            const curr = sortedMessages[i];

            if (!prev.fromMe && curr.fromMe) {
                const diff = curr.timestamp.getTime() - prev.timestamp.getTime();
                // Filter out outliers (> 2 hours)
                if (diff < 7200000) {
                    totalResponseTime += diff;
                    responseCount++;
                }
            }
        }
        const avgResponseTimeMs = responseCount > 0 ? Math.floor(totalResponseTime / responseCount) : 0;

        // Estimate new contacts (Active today with 0 intimacy or < 5 messages total history)
        const newContacts = contacts.filter(c => c.intimacyLevel === 0).length;

        return {
            date: today.toISOString().split('T')[0],
            messagesReceived,
            messagesSent,
            aiResponses,
            humanInterventions,
            contactsActive: contacts.length,
            newContacts,
            avgResponseTimeMs,
            riskAlertsCount: riskAlerts
        };
    }

    /**
     * Métricas de conversão
     */
    async getConversionMetrics(): Promise<ConversionMetrics> {
        const contacts = await prisma.contact.findMany({
            where: { isPaused: false }
        });

        const cold = contacts.filter(c => c.intimacyLevel < 30).length;
        const warm = contacts.filter(c => c.intimacyLevel >= 30 && c.intimacyLevel < 60).length;
        const hot = contacts.filter(c => c.intimacyLevel >= 60).length;
        const converted = contacts.filter(c => c.salesReadiness >= 80).length;

        const conversionRate = contacts.length > 0
            ? (converted / contacts.length) * 100
            : 0;

        // Heuristic for Avg Time to Conversion (Placeholder for now as we don't track conversion date yet)
        const avgTimeToConversion = 5;

        return {
            totalContacts: contacts.length,
            byStage: { cold, warm, hot, converted },
            conversionRate: Math.round(conversionRate * 100) / 100,
            avgTimeToConversion
        };
    }

    /**
     * Métricas de performance
     */
    async getPerformanceMetrics(): Promise<PerformanceMetrics> {
        const totalMessages = await prisma.message.count();

        const errorLogs = await prisma.systemLog.count({
            where: { level: 'ERROR' }
        });

        const totalLogs = await prisma.systemLog.count();
        const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;

        return {
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            totalMessagesProcessed: totalMessages,
            avgProcessingTimeMs: 150, // TODO: calcular real
            errorRate: Math.round(errorRate * 100) / 100,
            aiAccuracy: 85 // TODO: implementar feedback loop
        };
    }

    /**
     * Ranking de contatos mais valiosos
     */
    async getContactRanking(limit: number = 10): Promise<ContactRanking[]> {
        const contacts = await prisma.contact.findMany({
            where: { isPaused: false },
            include: {
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                },
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: [
                { salesReadiness: 'desc' },
                { intimacyLevel: 'desc' }
            ],
            take: limit
        });

        return contacts.map(c => ({
            contactId: c.id,
            name: c.name,
            score: Math.round((c.intimacyLevel * 0.4 + c.salesReadiness * 0.6)),
            intimacyLevel: c.intimacyLevel,
            salesReadiness: c.salesReadiness,
            lastInteraction: c.lastInteraction,
            messageCount: c._count.messages,
            trend: this.calculateTrend(c.engagementScore)
        }));
    }

    /**
     * Calcula tendência baseada no engagement
     */
    private calculateTrend(engagement: number): 'UP' | 'DOWN' | 'STABLE' {
        if (engagement > 70) return 'UP';
        if (engagement < 30) return 'DOWN';
        return 'STABLE';
    }

    /**
     * Horários de pico de atividade
     */
    async getPeakHours(): Promise<{ hour: number; messageCount: number }[]> {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const messages = await prisma.message.findMany({
            where: {
                timestamp: { gte: last7Days },
                fromMe: false // Apenas mensagens recebidas
            },
            select: { timestamp: true }
        });

        const hourCounts: Record<number, number> = {};
        for (let i = 0; i < 24; i++) hourCounts[i] = 0;

        messages.forEach(m => {
            const hour = m.timestamp.getHours();
            hourCounts[hour]++;
        });

        return Object.entries(hourCounts)
            .map(([hour, count]) => ({ hour: parseInt(hour), messageCount: count }))
            .sort((a, b) => b.messageCount - a.messageCount);
    }

    /**
     * Palavras mais frequentes (para análise de tópicos)
     */
    async getTopKeywords(limit: number = 20): Promise<{ word: string; count: number }[]> {
        const messages = await prisma.message.findMany({
            where: { fromMe: false },
            select: { body: true },
            take: 1000,
            orderBy: { timestamp: 'desc' }
        });

        const stopWords = new Set([
            'a', 'o', 'e', 'de', 'que', 'do', 'da', 'em', 'um', 'para', 'com', 'não',
            'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas',
            'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando',
            'é', 'vc', 'tb', 'pq', 'q', 'tá', 'to', 'ta', 'te', 'oi', 'ok', 'sim', 'nao'
        ]);

        const wordCount: Record<string, number> = {};

        messages.forEach(m => {
            const words = m.body.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 2 && !stopWords.has(w));

            words.forEach(word => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });
        });

        return Object.entries(wordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([word, count]) => ({ word, count }));
    }

    /**
     * Dashboard completo de analytics
     */
    async getFullDashboard(): Promise<{
        today: DailyMetrics;
        conversion: ConversionMetrics;
        performance: PerformanceMetrics;
        topContacts: ContactRanking[];
        peakHours: { hour: number; messageCount: number }[];
        topKeywords: { word: string; count: number }[];
    }> {
        const [today, conversion, performance, topContacts, peakHours, topKeywords] = await Promise.all([
            this.getTodayMetrics(),
            this.getConversionMetrics(),
            this.getPerformanceMetrics(),
            this.getContactRanking(5),
            this.getPeakHours(),
            this.getTopKeywords(10)
        ]);

        return {
            today,
            conversion,
            performance,
            topContacts,
            peakHours: peakHours.slice(0, 5),
            topKeywords
        };
    }

    /**
     * Exporta métricas para JSON (backup/análise externa)
     */
    async exportMetrics(): Promise<string> {
        const dashboard = await this.getFullDashboard();
        return JSON.stringify({
            exportedAt: new Date().toISOString(),
            ...dashboard
        }, null, 2);
    }
}
