/**
 * 🎯 CAMPAIGN SERVICE
 * Gerenciamento avançado de campanhas de outreach.
 * Define estratégias, horários e mensagens personalizadas.
 */

import { PrismaClient } from '@prisma/client';
import { HunterService } from './hunter.service';
import { GeminiService } from './gemini.service';
import { LogRepository } from '../repositories/log.repository';

const prisma = new PrismaClient();

export interface Campaign {
    id: string;
    name: string;
    description: string;
    type: 'REACTIVATION' | 'FOLLOWUP' | 'PROMOTION' | 'NURTURE' | 'CUSTOM';
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    targetCriteria: CampaignCriteria;
    messageTemplate: string;
    schedule: CampaignSchedule;
    metrics: CampaignMetrics;
    createdAt: Date;
    updatedAt: Date;
}

export interface CampaignCriteria {
    minDaysSinceContact: number;
    maxDaysSinceContact?: number;
    minIntimacy?: number;
    maxIntimacy?: number;
    minSalesReadiness?: number;
    maxSalesReadiness?: number;
    excludeConverted: boolean;
    excludePaused: boolean;
    maxTargets: number;
    tags?: string[];
}

export interface CampaignSchedule {
    startTime: string;      // "10:00"
    endTime: string;        // "18:00"
    daysOfWeek: number[];   // [1,2,3,4,5] = Mon-Fri
    intervalMinutes: number; // Min between messages
    maxPerDay: number;       // Max contacts per day
}

export interface CampaignMetrics {
    totalTargeted: number;
    messagesSent: number;
    responses: number;
    conversions: number;
    responseRate: number;
    conversionRate: number;
}

export interface CampaignExecution {
    campaignId: string;
    targetContactId: string;
    contactName: string | null;
    generatedMessage: string;
    sentAt?: Date;
    responseReceived: boolean;
    converted: boolean;
}

export class CampaignService {
    private logRepo = new LogRepository();
    private hunterService = new HunterService();
    private campaigns: Map<string, Campaign> = new Map();
    private executions: Map<string, CampaignExecution[]> = new Map();

    constructor() {
        this.initializeDefaultCampaigns();
    }

    private initializeDefaultCampaigns() {
        const defaults: Campaign[] = [
            {
                id: 'cold-reactivation',
                name: 'Reativação de Contatos Frios',
                description: 'Reativa contatos que não interagem há mais de 7 dias',
                type: 'REACTIVATION',
                status: 'DRAFT',
                targetCriteria: {
                    minDaysSinceContact: 7,
                    maxDaysSinceContact: 30,
                    minIntimacy: 20,
                    excludeConverted: true,
                    excludePaused: true,
                    maxTargets: 10
                },
                messageTemplate: 'Oi {nome}! Sumiu, tava pensando em você... Como você está? 💭',
                schedule: {
                    startTime: '10:00',
                    endTime: '18:00',
                    daysOfWeek: [1, 2, 3, 4, 5],
                    intervalMinutes: 15,
                    maxPerDay: 20
                },
                metrics: {
                    totalTargeted: 0,
                    messagesSent: 0,
                    responses: 0,
                    conversions: 0,
                    responseRate: 0,
                    conversionRate: 0
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'hot-followup',
                name: 'Follow-up de Leads Quentes',
                description: 'Segue leads com alta prontidão de compra',
                type: 'FOLLOWUP',
                status: 'DRAFT',
                targetCriteria: {
                    minDaysSinceContact: 1,
                    maxDaysSinceContact: 3,
                    minSalesReadiness: 70,
                    excludeConverted: true,
                    excludePaused: true,
                    maxTargets: 5
                },
                messageTemplate: 'Ei {nome}! Você ainda tá interessado(a) no que conversamos? Tenho novidades! 🔥',
                schedule: {
                    startTime: '14:00',
                    endTime: '20:00',
                    daysOfWeek: [1, 2, 3, 4, 5, 6],
                    intervalMinutes: 30,
                    maxPerDay: 10
                },
                metrics: {
                    totalTargeted: 0,
                    messagesSent: 0,
                    responses: 0,
                    conversions: 0,
                    responseRate: 0,
                    conversionRate: 0
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'warm-nurture',
                name: 'Nutrição de Leads Mornos',
                description: 'Mantém contato com leads que precisam de mais tempo',
                type: 'NURTURE',
                status: 'DRAFT',
                targetCriteria: {
                    minDaysSinceContact: 3,
                    maxDaysSinceContact: 14,
                    minIntimacy: 40,
                    maxIntimacy: 70,
                    excludeConverted: true,
                    excludePaused: true,
                    maxTargets: 15
                },
                messageTemplate: 'Oi {nome}! Só passando pra ver como você tá... Alguma novidade? 💜',
                schedule: {
                    startTime: '11:00',
                    endTime: '19:00',
                    daysOfWeek: [1, 2, 3, 4, 5],
                    intervalMinutes: 20,
                    maxPerDay: 15
                },
                metrics: {
                    totalTargeted: 0,
                    messagesSent: 0,
                    responses: 0,
                    conversions: 0,
                    responseRate: 0,
                    conversionRate: 0
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'vip-exclusive',
                name: 'Conteúdo Exclusivo VIP',
                description: 'Envia conteúdo exclusivo para contatos VIP',
                type: 'PROMOTION',
                status: 'DRAFT',
                targetCriteria: {
                    minDaysSinceContact: 2,
                    minIntimacy: 80,
                    excludeConverted: false,
                    excludePaused: true,
                    maxTargets: 5
                },
                messageTemplate: 'Amor! Tenho algo especial só pra você... 🎁 Quer ver?',
                schedule: {
                    startTime: '20:00',
                    endTime: '23:00',
                    daysOfWeek: [4, 5, 6], // Thu-Sat
                    intervalMinutes: 45,
                    maxPerDay: 5
                },
                metrics: {
                    totalTargeted: 0,
                    messagesSent: 0,
                    responses: 0,
                    conversions: 0,
                    responseRate: 0,
                    conversionRate: 0
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        defaults.forEach(c => this.campaigns.set(c.id, c));
    }

    /**
     * Lista todas as campanhas
     */
    listCampaigns(): Campaign[] {
        return Array.from(this.campaigns.values());
    }

    /**
     * Obtém uma campanha por ID
     */
    getCampaign(campaignId: string): Campaign | null {
        return this.campaigns.get(campaignId) || null;
    }

    /**
     * Cria ou atualiza uma campanha
     */
    upsertCampaign(campaign: Partial<Campaign> & { id: string }): Campaign {
        const existing = this.campaigns.get(campaign.id);

        if (existing) {
            const updated = { ...existing, ...campaign, updatedAt: new Date() };
            this.campaigns.set(campaign.id, updated);
            return updated;
        } else {
            const newCampaign: Campaign = {
                id: campaign.id,
                name: campaign.name || 'New Campaign',
                description: campaign.description || '',
                type: campaign.type || 'CUSTOM',
                status: 'DRAFT',
                targetCriteria: campaign.targetCriteria || {
                    minDaysSinceContact: 7,
                    excludeConverted: true,
                    excludePaused: true,
                    maxTargets: 10
                },
                messageTemplate: campaign.messageTemplate || 'Oi {nome}!',
                schedule: campaign.schedule || {
                    startTime: '10:00',
                    endTime: '18:00',
                    daysOfWeek: [1, 2, 3, 4, 5],
                    intervalMinutes: 15,
                    maxPerDay: 20
                },
                metrics: {
                    totalTargeted: 0,
                    messagesSent: 0,
                    responses: 0,
                    conversions: 0,
                    responseRate: 0,
                    conversionRate: 0
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.campaigns.set(campaign.id, newCampaign);
            return newCampaign;
        }
    }

    /**
     * Altera status da campanha
     */
    setCampaignStatus(campaignId: string, status: Campaign['status']): boolean {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) return false;

        campaign.status = status;
        campaign.updatedAt = new Date();

        this.logRepo.create('INFO', 'CAMPAIGN_STATUS_CHANGED',
            `Campaign ${campaign.name} status changed to ${status}`, undefined);

        return true;
    }

    /**
     * Encontra alvos para uma campanha
     */
    async findTargets(campaignId: string): Promise<any[]> {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) return [];

        const criteria = campaign.targetCriteria;
        const cutoffDate = new Date(Date.now() - criteria.minDaysSinceContact * 24 * 60 * 60 * 1000);
        const maxDate = criteria.maxDaysSinceContact
            ? new Date(Date.now() - criteria.maxDaysSinceContact * 24 * 60 * 60 * 1000)
            : undefined;

        const whereClause: any = {
            lastInteraction: {
                lte: cutoffDate
            }
        };

        if (maxDate) {
            whereClause.lastInteraction.gte = maxDate;
        }

        if (criteria.excludePaused) {
            whereClause.isPaused = false;
        }

        // TODO: Add salesStage check for excludeConverted

        if (criteria.minIntimacy !== undefined) {
            whereClause.intimacyLevel = { gte: criteria.minIntimacy };
        }
        if (criteria.maxIntimacy !== undefined) {
            whereClause.intimacyLevel = { ...whereClause.intimacyLevel, lte: criteria.maxIntimacy };
        }

        if (criteria.minSalesReadiness !== undefined) {
            whereClause.salesReadiness = { gte: criteria.minSalesReadiness };
        }

        const contacts = await prisma.contact.findMany({
            where: whereClause,
            take: criteria.maxTargets,
            orderBy: { lastInteraction: 'asc' }
        });

        return contacts;
    }

    /**
     * Gera mensagem personalizada para um alvo
     */
    async generateMessage(campaignId: string, contact: any): Promise<string> {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) return '';

        // Replace placeholders
        let message = campaign.messageTemplate
            .replace('{nome}', contact.name || 'amor')
            .replace('{primeiro_nome}', (contact.name || 'amor').split(' ')[0]);

        // If template is simple, use AI to enhance
        if (message.length < 100) {
            try {
                const gemini = new GeminiService();
                const enhanced = await gemini.generateResponse(
                    'system', // Uses default persona
                    [{ role: 'user', content: `Melhore esta mensagem de reativação mantendo o tom casual e íntimo: "${message}"` }],
                    contact.name || 'amor',
                    contact.intimacyLevel || 50,
                    contact.salesReadiness || 50
                );
                if (enhanced.length > 10 && enhanced.length < 200) {
                    message = enhanced;
                }
            } catch (error) {
                // Keep original message if AI fails
            }
        }

        return message;
    }

    /**
     * Verifica se é hora de executar a campanha
     */
    isScheduleActive(schedule: CampaignSchedule): boolean {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Check day
        if (!schedule.daysOfWeek.includes(dayOfWeek === 0 ? 7 : dayOfWeek)) {
            return false;
        }

        // Parse schedule times
        const [startHour, startMin] = schedule.startTime.split(':').map(Number);
        const [endHour, endMin] = schedule.endTime.split(':').map(Number);

        const currentMinutes = currentHour * 60 + currentMinute;
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }

    /**
     * Registra execução da campanha
     */
    recordExecution(execution: CampaignExecution): void {
        const campaignExecs = this.executions.get(execution.campaignId) || [];
        campaignExecs.push(execution);
        this.executions.set(execution.campaignId, campaignExecs);

        // Update metrics
        const campaign = this.campaigns.get(execution.campaignId);
        if (campaign) {
            campaign.metrics.messagesSent++;
            campaign.metrics.totalTargeted++;
            this.updateMetrics(campaign);
        }
    }

    /**
     * Registra resposta recebida
     */
    recordResponse(campaignId: string, contactId: string, converted: boolean = false): void {
        const executions = this.executions.get(campaignId) || [];
        const execution = executions.find(e => e.targetContactId === contactId);

        if (execution) {
            execution.responseReceived = true;
            execution.converted = converted;

            const campaign = this.campaigns.get(campaignId);
            if (campaign) {
                campaign.metrics.responses++;
                if (converted) {
                    campaign.metrics.conversions++;
                }
                this.updateMetrics(campaign);
            }
        }
    }

    /**
     * Atualiza taxas de conversão
     */
    private updateMetrics(campaign: Campaign): void {
        const m = campaign.metrics;
        m.responseRate = m.messagesSent > 0 ? (m.responses / m.messagesSent) * 100 : 0;
        m.conversionRate = m.responses > 0 ? (m.conversions / m.responses) * 100 : 0;
    }

    /**
     * Obtém execuções de uma campanha
     */
    getExecutions(campaignId: string): CampaignExecution[] {
        return this.executions.get(campaignId) || [];
    }

    /**
     * Estatísticas gerais de campanhas
     */
    getOverallStats(): {
        totalCampaigns: number;
        activeCampaigns: number;
        totalMessagesSent: number;
        totalResponses: number;
        avgResponseRate: number;
        avgConversionRate: number;
    } {
        const campaigns = Array.from(this.campaigns.values());
        const active = campaigns.filter(c => c.status === 'ACTIVE');

        let totalSent = 0;
        let totalResponses = 0;
        let totalResponseRate = 0;
        let totalConversionRate = 0;

        campaigns.forEach(c => {
            totalSent += c.metrics.messagesSent;
            totalResponses += c.metrics.responses;
            totalResponseRate += c.metrics.responseRate;
            totalConversionRate += c.metrics.conversionRate;
        });

        return {
            totalCampaigns: campaigns.length,
            activeCampaigns: active.length,
            totalMessagesSent: totalSent,
            totalResponses: totalResponses,
            avgResponseRate: campaigns.length > 0 ? totalResponseRate / campaigns.length : 0,
            avgConversionRate: campaigns.length > 0 ? totalConversionRate / campaigns.length : 0
        };
    }
}
