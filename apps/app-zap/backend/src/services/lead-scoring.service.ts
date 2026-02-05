/**
 * 💎 LEAD SCORING SERVICE
 * Sistema avançado de pontuação de leads.
 * Calcula o valor potencial de cada contato em tempo real.
 */

import { PrismaClient } from '@prisma/client';
import { LogRepository } from '../repositories/log.repository';

const prisma = new PrismaClient();

export interface LeadScore {
    contactId: string;
    contactName: string | null;
    phone: string;

    // Scores (0-100)
    overallScore: number;
    engagementScore: number;
    intentScore: number;
    recencyScore: number;
    frequencyScore: number;
    monetaryPotential: number;

    // Categorização
    tier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' | 'COLD';
    buyerPersona: string;
    predictedConversionDays: number;

    // Fatores
    factors: ScoreFactor[];
    recommendations: string[];

    lastUpdated: Date;
}

export interface ScoreFactor {
    name: string;
    weight: number;
    value: number;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    description: string;
}

export interface LeadScoreConfig {
    weights: {
        engagement: number;
        intent: number;
        recency: number;
        frequency: number;
        monetary: number;
    };
    thresholds: {
        diamond: number;
        gold: number;
        silver: number;
        bronze: number;
    };
}

export class LeadScoringService {
    private logRepo = new LogRepository();

    private defaultConfig: LeadScoreConfig = {
        weights: {
            engagement: 0.25,
            intent: 0.30,
            recency: 0.20,
            frequency: 0.15,
            monetary: 0.10
        },
        thresholds: {
            diamond: 85,
            gold: 70,
            silver: 50,
            bronze: 30
        }
    };

    /**
     * Calcula score completo de um lead
     */
    async calculateLeadScore(contactId: string): Promise<LeadScore> {
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
            include: {
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 100
                }
            }
        });

        if (!contact) throw new Error('Contact not found');

        const factors: ScoreFactor[] = [];

        // 1. Engagement Score
        const engagementScore = this.calculateEngagement(contact, factors);

        // 2. Intent Score (sinais de compra)
        const intentScore = await this.calculateIntent(contact, factors);

        // 3. Recency Score (quão recente foi a última interação)
        const recencyScore = this.calculateRecency(contact, factors);

        // 4. Frequency Score (frequência de interação)
        const frequencyScore = this.calculateFrequency(contact, factors);

        // 5. Monetary Potential
        const monetaryPotential = this.estimateMonetaryPotential(contact, factors);

        // Calculate weighted overall score
        const w = this.defaultConfig.weights;
        const overallScore = Math.round(
            engagementScore * w.engagement +
            intentScore * w.intent +
            recencyScore * w.recency +
            frequencyScore * w.frequency +
            monetaryPotential * w.monetary
        );

        // Determine tier
        const tier = this.determineTier(overallScore);

        // Determine persona
        const buyerPersona = this.determineBuyerPersona(
            engagementScore,
            intentScore,
            recencyScore,
            contact.intimacyLevel
        );

        // Predict conversion
        const predictedConversionDays = this.predictConversion(overallScore, intentScore);

        // Generate recommendations
        const recommendations = this.generateRecommendations(
            tier, engagementScore, intentScore, recencyScore
        );

        const leadScore: LeadScore = {
            contactId: contact.id,
            contactName: contact.name,
            phone: contact.phone,
            overallScore,
            engagementScore,
            intentScore,
            recencyScore,
            frequencyScore,
            monetaryPotential,
            tier,
            buyerPersona,
            predictedConversionDays,
            factors,
            recommendations,
            lastUpdated: new Date()
        };

        // Update contact with calculated scores
        await prisma.contact.update({
            where: { id: contactId },
            data: {
                engagementScore: overallScore,
                salesReadiness: intentScore
            }
        });

        return leadScore;
    }

    /**
     * Calcula engajamento
     */
    private calculateEngagement(contact: any, factors: ScoreFactor[]): number {
        let score = 0;
        const messages = contact.messages || [];

        // Responde mensagens? (+30)
        const responseRate = messages.filter((m: any) => !m.fromMe).length / Math.max(messages.length, 1);
        const responsePoints = Math.round(responseRate * 30);
        score += responsePoints;
        factors.push({
            name: 'Response Rate',
            weight: 0.3,
            value: responsePoints,
            impact: responsePoints > 15 ? 'POSITIVE' : 'NEUTRAL',
            description: `${Math.round(responseRate * 100)}% response rate`
        });

        // Intimidade (+40)
        const intimacyPoints = Math.round((contact.intimacyLevel / 100) * 40);
        score += intimacyPoints;
        factors.push({
            name: 'Intimacy Level',
            weight: 0.4,
            value: intimacyPoints,
            impact: intimacyPoints > 25 ? 'POSITIVE' : intimacyPoints < 10 ? 'NEGATIVE' : 'NEUTRAL',
            description: `${contact.intimacyLevel}% intimacy`
        });

        // Mensagens longas? (+15)
        const avgLength = messages.reduce((sum: number, m: any) => sum + (m.body?.length || 0), 0) / Math.max(messages.length, 1);
        const lengthPoints = Math.min(15, Math.round(avgLength / 10));
        score += lengthPoints;
        factors.push({
            name: 'Message Depth',
            weight: 0.15,
            value: lengthPoints,
            impact: lengthPoints > 8 ? 'POSITIVE' : 'NEUTRAL',
            description: `Avg ${Math.round(avgLength)} chars/message`
        });

        // Usa emojis? (+15)
        const emojiMessages = messages.filter((m: any) => /[\u{1F600}-\u{1F64F}]/u.test(m.body || '')).length;
        const emojiRate = emojiMessages / Math.max(messages.length, 1);
        const emojiPoints = Math.round(emojiRate * 15);
        score += emojiPoints;
        factors.push({
            name: 'Emoji Usage',
            weight: 0.15,
            value: emojiPoints,
            impact: emojiPoints > 7 ? 'POSITIVE' : 'NEUTRAL',
            description: `${Math.round(emojiRate * 100)}% messages with emojis`
        });

        return Math.min(100, Math.round(score));
    }

    /**
     * Calcula intenção de compra
     */
    private async calculateIntent(contact: any, factors: ScoreFactor[]): Promise<number> {
        let score = 0;
        const messages = contact.messages || [];
        const recentMessages = messages.slice(0, 20);

        // Sinais de compra positivos
        const buySignals = [
            /quanto(\s+é|\s+custa|fica)/i,
            /preço/i,
            /valor/i,
            /pix/i,
            /pagamento/i,
            /comprar/i,
            /quero/i,
            /como (faço|faz)/i,
            /pode.*parcelar/i,
            /tem.*desconto/i,
            /aceita/i,
            /manda.*link/i,
            /interessad[ao]/i
        ];

        let buySignalCount = 0;
        for (const msg of recentMessages) {
            if (msg.fromMe) continue;
            for (const signal of buySignals) {
                if (signal.test(msg.body || '')) {
                    buySignalCount++;
                    break;
                }
            }
        }

        const buySignalPoints = Math.min(40, buySignalCount * 10);
        score += buySignalPoints;
        factors.push({
            name: 'Buy Signals',
            weight: 0.4,
            value: buySignalPoints,
            impact: buySignalCount > 2 ? 'POSITIVE' : buySignalCount === 0 ? 'NEGATIVE' : 'NEUTRAL',
            description: `${buySignalCount} buying signals detected`
        });

        // Sales Readiness do BD (+30)
        const readinessPoints = Math.round((contact.salesReadiness / 100) * 30);
        score += readinessPoints;
        factors.push({
            name: 'Sales Readiness',
            weight: 0.3,
            value: readinessPoints,
            impact: readinessPoints > 20 ? 'POSITIVE' : readinessPoints < 10 ? 'NEGATIVE' : 'NEUTRAL',
            description: `${contact.salesReadiness}% sales ready`
        });

        // Não tem objeções não resolvidas? (+30)
        const objectionPatterns = [
            /caro|muito caro/i,
            /não tenho/i,
            /depois/i,
            /vou pensar/i,
            /não preciso/i
        ];

        const lastMessages = recentMessages.slice(0, 5);
        let hasRecentObjection = false;
        for (const msg of lastMessages) {
            if (msg.fromMe) continue;
            for (const obj of objectionPatterns) {
                if (obj.test(msg.body || '')) {
                    hasRecentObjection = true;
                    break;
                }
            }
        }

        const objectionPoints = hasRecentObjection ? 0 : 30;
        score += objectionPoints;
        factors.push({
            name: 'No Recent Objections',
            weight: 0.3,
            value: objectionPoints,
            impact: hasRecentObjection ? 'NEGATIVE' : 'POSITIVE',
            description: hasRecentObjection ? 'Recent objection detected' : 'No objections in last messages'
        });

        return Math.min(100, Math.round(score));
    }

    /**
     * Calcula recência
     */
    private calculateRecency(contact: any, factors: ScoreFactor[]): number {
        const lastInteraction = contact.lastInteraction;
        if (!lastInteraction) return 0;

        const daysSince = Math.floor((Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24));

        let score: number;
        if (daysSince === 0) score = 100;
        else if (daysSince === 1) score = 90;
        else if (daysSince <= 3) score = 75;
        else if (daysSince <= 7) score = 50;
        else if (daysSince <= 14) score = 30;
        else if (daysSince <= 30) score = 15;
        else score = 5;

        factors.push({
            name: 'Recency',
            weight: 1,
            value: score,
            impact: score > 50 ? 'POSITIVE' : score < 30 ? 'NEGATIVE' : 'NEUTRAL',
            description: daysSince === 0 ? 'Interacted today' : `Last interaction ${daysSince} days ago`
        });

        return score;
    }

    /**
     * Calcula frequência
     */
    private calculateFrequency(contact: any, factors: ScoreFactor[]): number {
        const messages = contact.messages || [];
        const totalMessages = messages.length;

        // Mensagens dos últimos 7 dias
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentCount = messages.filter((m: any) => new Date(m.timestamp).getTime() > weekAgo).length;

        let score: number;
        if (recentCount >= 20) score = 100;
        else if (recentCount >= 10) score = 80;
        else if (recentCount >= 5) score = 60;
        else if (recentCount >= 2) score = 40;
        else if (recentCount >= 1) score = 20;
        else score = 0;

        factors.push({
            name: 'Weekly Frequency',
            weight: 1,
            value: score,
            impact: score > 50 ? 'POSITIVE' : score < 30 ? 'NEGATIVE' : 'NEUTRAL',
            description: `${recentCount} messages in last 7 days (${totalMessages} total)`
        });

        return score;
    }

    /**
     * Estima potencial monetário
     */
    private estimateMonetaryPotential(contact: any, factors: ScoreFactor[]): number {
        // Baseado em sinais de poder aquisitivo
        const messages = (contact.messages || []).map((m: any) => (m.body || '').toLowerCase()).join(' ');

        let score = 50; // Base

        // Sinais positivos
        if (/parcelar|cartão|pix.*(rápido|na hora)/.test(messages)) score += 15;
        if (/premium|vip|especial|exclusiv/.test(messages)) score += 10;
        if (/quanto.*mais|valor.*maior|pacote.*completo/.test(messages)) score += 10;

        // Sinais negativos
        if (/sem dinheiro|tô sem|não tenho como/.test(messages)) score -= 20;
        if (/mais barato|desconto|promoção/.test(messages)) score -= 10;

        score = Math.max(0, Math.min(100, score));

        factors.push({
            name: 'Monetary Potential',
            weight: 1,
            value: score,
            impact: score > 60 ? 'POSITIVE' : score < 40 ? 'NEGATIVE' : 'NEUTRAL',
            description: score > 60 ? 'High purchasing potential' : score < 40 ? 'Budget conscious' : 'Average purchasing power'
        });

        return score;
    }

    /**
     * Determina tier do lead
     */
    private determineTier(score: number): LeadScore['tier'] {
        const t = this.defaultConfig.thresholds;
        if (score >= t.diamond) return 'DIAMOND';
        if (score >= t.gold) return 'GOLD';
        if (score >= t.silver) return 'SILVER';
        if (score >= t.bronze) return 'BRONZE';
        return 'COLD';
    }

    /**
     * Determina persona do comprador
     */
    private determineBuyerPersona(
        engagement: number,
        intent: number,
        recency: number,
        intimacy: number
    ): string {
        if (intent > 80 && engagement > 70) return 'Hot Buyer - Ready to purchase';
        if (intent > 60 && engagement > 60) return 'Warm Prospect - Needs small push';
        if (engagement > 80 && intent < 50) return 'Engaged Fan - Build value first';
        if (intimacy > 70 && intent < 40) return 'Relationship Builder - Slow nurture';
        if (recency < 30 && engagement > 50) return 'Dormant Lead - Reactivation needed';
        if (intent > 50 && engagement < 40) return 'Research Mode - Provide info';
        return 'New Lead - Discovery phase';
    }

    /**
     * Prevê dias até conversão
     */
    private predictConversion(overallScore: number, intentScore: number): number {
        if (intentScore > 80 && overallScore > 80) return 1;
        if (intentScore > 60 && overallScore > 60) return 3;
        if (intentScore > 40 && overallScore > 50) return 7;
        if (overallScore > 40) return 14;
        if (overallScore > 20) return 30;
        return 60;
    }

    /**
     * Gera recomendações de ação
     */
    private generateRecommendations(
        tier: string,
        engagement: number,
        intent: number,
        recency: number
    ): string[] {
        const recommendations: string[] = [];

        if (tier === 'DIAMOND') {
            recommendations.push('🔥 PRIORITY: Close the sale NOW');
            recommendations.push('💰 Offer exclusive deal or bonus');
            recommendations.push('⏰ Create urgency - limited time offer');
        } else if (tier === 'GOLD') {
            recommendations.push('📞 Follow up within 24 hours');
            recommendations.push('🎁 Consider discount or incentive');
            recommendations.push('📝 Address any remaining objections');
        } else if (tier === 'SILVER') {
            recommendations.push('💬 Increase engagement with value content');
            recommendations.push('🤝 Build more rapport and trust');
            recommendations.push('❓ Ask about their specific needs');
        } else if (tier === 'BRONZE') {
            recommendations.push('📚 Send educational content');
            recommendations.push('🎯 Identify their pain points');
            recommendations.push('⏳ Nurture gradually, don\'t push');
        } else {
            recommendations.push('🔄 Consider reactivation campaign');
            recommendations.push('🆕 Try different approach or message');
            recommendations.push('📊 May need to qualify further');
        }

        // Specific recommendations based on scores
        if (recency < 30) {
            recommendations.push('⚠️ RE-ENGAGE: Contact has gone cold');
        }
        if (intent > 60 && engagement < 40) {
            recommendations.push('💡 High intent but low engagement - simplify message');
        }
        if (engagement > 70 && intent < 40) {
            recommendations.push('🎯 Good engagement - focus on creating desire');
        }

        return recommendations.slice(0, 5);
    }

    /**
     * Calcula scores para todos os contatos
     */
    async calculateAllScores(): Promise<LeadScore[]> {
        const contacts = await prisma.contact.findMany({
            where: { isPaused: false },
            select: { id: true }
        });

        const scores: LeadScore[] = [];
        for (const contact of contacts) {
            try {
                const score = await this.calculateLeadScore(contact.id);
                scores.push(score);
            } catch (error) {
                console.error(`Failed to score contact ${contact.id}:`, error);
            }
        }

        return scores.sort((a, b) => b.overallScore - a.overallScore);
    }

    /**
     * Obtém leads por tier
     */
    async getLeadsByTier(tier: LeadScore['tier']): Promise<LeadScore[]> {
        const allScores = await this.calculateAllScores();
        return allScores.filter(s => s.tier === tier);
    }

    /**
     * Obtém leads quentes (prontos para converter)
     */
    async getHotLeads(limit: number = 10): Promise<LeadScore[]> {
        const allScores = await this.calculateAllScores();
        return allScores
            .filter(s => s.tier === 'DIAMOND' || s.tier === 'GOLD')
            .slice(0, limit);
    }
}
