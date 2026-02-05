/**
 * 🎯 HUNTER SERVICE (Motor de Proatividade)
 * O sistema deixa de ser REATIVO para ser PROATIVO.
 * Inicia conversas automaticamente baseado em gatilhos estratégicos.
 */

import { PrismaClient } from '@prisma/client';
import { LogRepository } from '../repositories/log.repository';
import { GeminiService } from './gemini.service';
import { getWhatsAppService } from './whatsapp.service';

const prisma = new PrismaClient();

export interface HuntingTarget {
    contactId: string;
    name: string | null;
    lastInteraction: Date;
    daysSinceContact: number;
    intimacyLevel: number;
    salesReadiness: number;
    reason: string;
    suggestedOpener: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface HuntingCampaign {
    id: string;
    name: string;
    triggerType: 'COLD_REACTIVATION' | 'HOT_FOLLOWUP' | 'SEASONAL' | 'PRODUCT_LAUNCH' | 'CUSTOM';
    messageTemplate: string;
    targetCriteria: {
        minDaysSinceContact?: number;
        maxDaysSinceContact?: number;
        minIntimacy?: number;
        maxIntimacy?: number;
        minSalesReadiness?: number;
    };
    isActive: boolean;
    maxTargetsPerRun: number;
}

export class HunterService {
    private logRepo = new LogRepository();
    private gemini = new GeminiService();

    // Default Hunting Campaigns
    private readonly DEFAULT_CAMPAIGNS: HuntingCampaign[] = [
        {
            id: 'cold-reactivation',
            name: 'Reativação de Contatos Frios',
            triggerType: 'COLD_REACTIVATION',
            messageTemplate: 'E aí {name}, sumiu? Tava pensando em vc 🔥',
            targetCriteria: {
                minDaysSinceContact: 7,
                maxDaysSinceContact: 30,
                minIntimacy: 20
            },
            isActive: true,
            maxTargetsPerRun: 5
        },
        {
            id: 'hot-followup',
            name: 'Follow-up de Leads Quentes',
            triggerType: 'HOT_FOLLOWUP',
            messageTemplate: 'Oi {name}! Lembra do que a gente conversou? 😏',
            targetCriteria: {
                minDaysSinceContact: 2,
                maxDaysSinceContact: 5,
                minSalesReadiness: 60
            },
            isActive: true,
            maxTargetsPerRun: 10
        },
        {
            id: 'dormant-vip',
            name: 'Recuperação de VIPs Dormentes',
            triggerType: 'COLD_REACTIVATION',
            messageTemplate: 'Oi amor {name}! Saudade de conversar contigo 💕',
            targetCriteria: {
                minDaysSinceContact: 14,
                minIntimacy: 70
            },
            isActive: true,
            maxTargetsPerRun: 3
        }
    ];

    /**
     * Identifica contatos que devem ser "caçados"
     */
    async identifyTargets(campaign?: HuntingCampaign): Promise<HuntingTarget[]> {
        const activeCampaign = campaign || this.DEFAULT_CAMPAIGNS[0];
        const criteria = activeCampaign.targetCriteria;

        const now = new Date();
        const targets: HuntingTarget[] = [];

        try {
            // Buscar todos os contatos não pausados
            const contacts = await prisma.contact.findMany({
                where: {
                    isPaused: false
                },
                orderBy: { lastInteraction: 'asc' }
            });

            for (const contact of contacts) {
                const daysSinceContact = Math.floor(
                    (now.getTime() - contact.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
                );

                // Verificar critérios
                let matches = true;
                let reason = '';

                if (criteria.minDaysSinceContact && daysSinceContact < criteria.minDaysSinceContact) {
                    matches = false;
                }
                if (criteria.maxDaysSinceContact && daysSinceContact > criteria.maxDaysSinceContact) {
                    matches = false;
                }
                if (criteria.minIntimacy && contact.intimacyLevel < criteria.minIntimacy) {
                    matches = false;
                }
                if (criteria.maxIntimacy && contact.intimacyLevel > criteria.maxIntimacy) {
                    matches = false;
                }
                if (criteria.minSalesReadiness && contact.salesReadiness < criteria.minSalesReadiness) {
                    matches = false;
                }

                if (matches) {
                    // Determinar prioridade
                    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
                    if (contact.salesReadiness >= 80) priority = 'CRITICAL';
                    else if (contact.intimacyLevel >= 70) priority = 'HIGH';
                    else if (daysSinceContact >= 20) priority = 'LOW';

                    // Gerar razão
                    if (daysSinceContact >= 7) reason = `${daysSinceContact} dias sem contato`;
                    if (contact.salesReadiness >= 60) reason += reason ? ' + ' : '' + 'Alta prontidão de compra';
                    if (contact.intimacyLevel >= 70) reason += reason ? ' + ' : '' + 'VIP íntimo';

                    // Personalizar opener
                    const opener = activeCampaign.messageTemplate.replace('{name}', contact.name || 'lindx');

                    targets.push({
                        contactId: contact.id,
                        name: contact.name,
                        lastInteraction: contact.lastInteraction,
                        daysSinceContact,
                        intimacyLevel: contact.intimacyLevel,
                        salesReadiness: contact.salesReadiness,
                        reason: reason || 'Critérios de campanha atendidos',
                        suggestedOpener: opener,
                        priority
                    });
                }
            }

            // Ordenar por prioridade e limitar
            const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            targets.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

            return targets.slice(0, activeCampaign.maxTargetsPerRun);

        } catch (error) {
            console.error('Hunter Error:', error);
            this.logRepo.create('ERROR', 'HUNTER_ERROR', (error as Error).message, undefined);
            return [];
        }
    }

    /**
     * Gera mensagem de abertura personalizada com IA
     */
    async generateOpeningMessage(target: HuntingTarget): Promise<string> {
        try {
            const contact = await prisma.contact.findUnique({
                where: { id: target.contactId },
                include: { messages: { orderBy: { timestamp: 'desc' }, take: 5 } }
            });

            if (!contact) return target.suggestedOpener;

            const lastMessages = contact.messages.map(m => m.body).join(' | ');

            const prompt = `
Você é a persona de vendas. Gere UMA mensagem de abertura para reativar contato com ${contact.name || 'esse cliente'}.

CONTEXTO:
- Dias sem contato: ${target.daysSinceContact}
- Intimidade: ${target.intimacyLevel}%
- Prontidão de compra: ${target.salesReadiness}%
- Últimas mensagens: ${lastMessages || 'Nenhuma'}

REGRAS:
- Seja NATURAL e CURIOSA
- Máximo 10 palavras
- Pareça que lembrou da pessoa aleatoriamente
- NÃO mencione vendas diretamente
- Use estilo informal/íntimo

Retorne APENAS a mensagem, sem aspas.
      `;

            const response = await this.gemini.generateResponse(contact, contact.messages);
            return response || target.suggestedOpener;

        } catch (error) {
            console.error('Opening Message Generation Error:', error);
            return target.suggestedOpener;
        }
    }

    /**
     * Executa uma campanha de hunting
     */
    async executeCampaign(campaignId: string, dryRun: boolean = true): Promise<{
        targets: HuntingTarget[];
        messagesSent: number;
        errors: string[];
    }> {
        const campaign = this.DEFAULT_CAMPAIGNS.find(c => c.id === campaignId) || this.DEFAULT_CAMPAIGNS[0];
        const targets = await this.identifyTargets(campaign);
        const errors: string[] = [];
        let messagesSent = 0;

        this.logRepo.create('INFO', 'HUNTER_CAMPAIGN_START',
            `Campaign "${campaign.name}" started. Targets: ${targets.length}. DryRun: ${dryRun}`, undefined);

        if (!dryRun) {
            try {
                const whatsappService = getWhatsAppService();

                for (const target of targets) {
                    try {
                        const message = await this.generateOpeningMessage(target);
                        await whatsappService.sendMessage(target.contactId, message);
                        messagesSent++;
                        this.logRepo.create('INFO', 'HUNTER_MESSAGE_SENT',
                            `Message sent to ${target.name}: "${message}"`, target.contactId);
                    } catch (error) {
                        errors.push(`Failed to message ${target.contactId}: ${(error as Error).message}`);
                        this.logRepo.create('ERROR', 'HUNTER_MESSAGE_FAILED',
                            `Failed to send to ${target.name}: ${(error as Error).message}`, target.contactId);
                    }
                }
            } catch (error) {
                errors.push(`WhatsApp Service unavailable: ${(error as Error).message}`);
                this.logRepo.create('ERROR', 'HUNTER_SERVICE_UNAVAILABLE',
                    `Could not get WhatsApp Service: ${(error as Error).message}`, undefined);
            }
        }

        return { targets, messagesSent, errors };
    }

    /**
     * Retorna campanhas disponíveis
     */
    getCampaigns(): HuntingCampaign[] {
        return this.DEFAULT_CAMPAIGNS;
    }

    /**
     * Estatísticas de hunting
     */
    async getHuntingStats(): Promise<{
        totalContacts: number;
        coldContacts: number;
        hotLeads: number;
        vipDormant: number;
        avgDaysSinceContact: number;
    }> {
        const now = new Date();
        const contacts = await prisma.contact.findMany({
            where: { isPaused: false }
        });

        const coldContacts = contacts.filter(c => {
            const days = Math.floor((now.getTime() - c.lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
            return days >= 7 && c.intimacyLevel < 50;
        }).length;

        const hotLeads = contacts.filter(c => c.salesReadiness >= 60).length;

        const vipDormant = contacts.filter(c => {
            const days = Math.floor((now.getTime() - c.lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
            return days >= 14 && c.intimacyLevel >= 70;
        }).length;

        const avgDays = contacts.length > 0
            ? contacts.reduce((sum, c) => {
                return sum + Math.floor((now.getTime() - c.lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
            }, 0) / contacts.length
            : 0;

        return {
            totalContacts: contacts.length,
            coldContacts,
            hotLeads,
            vipDormant,
            avgDaysSinceContact: Math.round(avgDays)
        };
    }
}
