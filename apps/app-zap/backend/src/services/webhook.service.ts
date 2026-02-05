/**
 * 📢 WEBHOOK SERVICE (Notificações Externas)
 * Envia notificações para sistemas externos.
 * Integra com Telegram, Discord, Slack, etc.
 */

import { LogRepository } from '../repositories/log.repository';

export interface WebhookConfig {
    id: string;
    name: string;
    url: string;
    type: 'TELEGRAM' | 'DISCORD' | 'SLACK' | 'CUSTOM';
    events: WebhookEvent[];
    isActive: boolean;
    headers?: Record<string, string>;
}

export type WebhookEvent =
    | 'NEW_MESSAGE'
    | 'SALE_COMPLETED'
    | 'HIGH_RISK_ALERT'
    | 'CONTACT_PAUSED'
    | 'DAILY_SUMMARY'
    | 'AI_ERROR'
    | 'OPERATOR_INTERVENTION'
    | 'VIP_ACTIVITY';

export interface WebhookPayload {
    event: WebhookEvent;
    timestamp: Date;
    data: any;
    metadata?: {
        contactId?: string;
        contactName?: string;
        messagePreview?: string;
    };
}

export class WebhookService {
    private logRepo = new LogRepository();
    private webhooks: Map<string, WebhookConfig> = new Map();

    constructor() {
        this.loadDefaultWebhooks();
    }

    private loadDefaultWebhooks() {
        // Default Telegram webhook (disabled by default)
        this.webhooks.set('telegram-alerts', {
            id: 'telegram-alerts',
            name: 'Telegram Alerts',
            url: '', // User must configure
            type: 'TELEGRAM',
            events: ['HIGH_RISK_ALERT', 'SALE_COMPLETED', 'AI_ERROR'],
            isActive: false
        });

        // Default Discord webhook
        this.webhooks.set('discord-logs', {
            id: 'discord-logs',
            name: 'Discord Logs',
            url: '',
            type: 'DISCORD',
            events: ['NEW_MESSAGE', 'DAILY_SUMMARY'],
            isActive: false
        });
    }

    /**
     * Envia notificação para todos os webhooks relevantes
     */
    async notify(event: WebhookEvent, data: any, metadata?: WebhookPayload['metadata']): Promise<void> {
        const payload: WebhookPayload = {
            event,
            timestamp: new Date(),
            data,
            metadata
        };

        for (const [id, webhook] of this.webhooks) {
            if (!webhook.isActive || !webhook.url) continue;
            if (!webhook.events.includes(event)) continue;

            try {
                await this.sendToWebhook(webhook, payload);
            } catch (error) {
                console.error(`Webhook ${id} failed:`, error);
                this.logRepo.create('ERROR', 'WEBHOOK_FAILED',
                    `${webhook.name}: ${(error as Error).message}`, undefined);
            }
        }
    }

    /**
     * Envia payload para um webhook específico
     */
    private async sendToWebhook(webhook: WebhookConfig, payload: WebhookPayload): Promise<void> {
        let body: string;
        let headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...webhook.headers
        };

        switch (webhook.type) {
            case 'TELEGRAM':
                body = JSON.stringify({
                    chat_id: this.extractTelegramChatId(webhook.url),
                    text: this.formatTelegramMessage(payload),
                    parse_mode: 'HTML'
                });
                break;

            case 'DISCORD':
                body = JSON.stringify({
                    embeds: [{
                        title: `🔔 ${payload.event}`,
                        description: this.formatDiscordMessage(payload),
                        color: this.getEventColor(payload.event),
                        timestamp: payload.timestamp.toISOString()
                    }]
                });
                break;

            case 'SLACK':
                body = JSON.stringify({
                    text: this.formatSlackMessage(payload),
                    attachments: [{
                        color: this.getEventColorHex(payload.event),
                        fields: [
                            { title: 'Event', value: payload.event, short: true },
                            { title: 'Time', value: payload.timestamp.toISOString(), short: true }
                        ]
                    }]
                });
                break;

            default:
                body = JSON.stringify(payload);
        }

        const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        this.logRepo.create('INFO', 'WEBHOOK_SENT',
            `${webhook.name}: ${payload.event}`, payload.metadata?.contactId);
    }

    /**
     * Formata mensagem para Telegram
     */
    private formatTelegramMessage(payload: WebhookPayload): string {
        const emoji = this.getEventEmoji(payload.event);
        let message = `${emoji} <b>${payload.event}</b>\n\n`;

        if (payload.metadata?.contactName) {
            message += `👤 Contato: ${payload.metadata.contactName}\n`;
        }
        if (payload.metadata?.messagePreview) {
            message += `💬 Preview: ${payload.metadata.messagePreview.substring(0, 100)}...\n`;
        }

        message += `\n⏰ ${payload.timestamp.toLocaleString('pt-BR')}`;

        return message;
    }

    /**
     * Formata mensagem para Discord
     */
    private formatDiscordMessage(payload: WebhookPayload): string {
        let message = '';

        if (payload.metadata?.contactName) {
            message += `**Contato:** ${payload.metadata.contactName}\n`;
        }
        if (payload.metadata?.messagePreview) {
            message += `**Mensagem:** ${payload.metadata.messagePreview.substring(0, 200)}\n`;
        }
        if (typeof payload.data === 'object') {
            message += `\n\`\`\`json\n${JSON.stringify(payload.data, null, 2).substring(0, 500)}\n\`\`\``;
        }

        return message || 'No additional details';
    }

    /**
     * Formata mensagem para Slack
     */
    private formatSlackMessage(payload: WebhookPayload): string {
        const emoji = this.getEventEmoji(payload.event);
        return `${emoji} *${payload.event}* - ${payload.metadata?.contactName || 'System'}`;
    }

    private getEventEmoji(event: WebhookEvent): string {
        const emojis: Record<WebhookEvent, string> = {
            NEW_MESSAGE: '💬',
            SALE_COMPLETED: '💰',
            HIGH_RISK_ALERT: '🚨',
            CONTACT_PAUSED: '⏸️',
            DAILY_SUMMARY: '📊',
            AI_ERROR: '❌',
            OPERATOR_INTERVENTION: '👤',
            VIP_ACTIVITY: '⭐'
        };
        return emojis[event] || '🔔';
    }

    private getEventColor(event: WebhookEvent): number {
        const colors: Record<WebhookEvent, number> = {
            NEW_MESSAGE: 0x3498db,    // Blue
            SALE_COMPLETED: 0x27ae60, // Green
            HIGH_RISK_ALERT: 0xe74c3c, // Red
            CONTACT_PAUSED: 0xf39c12, // Orange
            DAILY_SUMMARY: 0x9b59b6,  // Purple
            AI_ERROR: 0xe74c3c,       // Red
            OPERATOR_INTERVENTION: 0x3498db,
            VIP_ACTIVITY: 0xf1c40f    // Yellow/Gold
        };
        return colors[event] || 0x95a5a6;
    }

    private getEventColorHex(event: WebhookEvent): string {
        return '#' + this.getEventColor(event).toString(16).padStart(6, '0');
    }

    private extractTelegramChatId(url: string): string {
        // Extract chat ID from bot URL or return as-is if it's just the ID
        const match = url.match(/chat_id=(\d+)/);
        return match ? match[1] : url;
    }

    // ==================== CRUD Operations ====================

    /**
     * Adiciona ou atualiza webhook
     */
    setWebhook(config: WebhookConfig): void {
        this.webhooks.set(config.id, config);
        this.logRepo.create('INFO', 'WEBHOOK_CONFIGURED',
            `${config.name} configured for events: ${config.events.join(', ')}`, undefined);
    }

    /**
     * Remove webhook
     */
    removeWebhook(id: string): boolean {
        return this.webhooks.delete(id);
    }

    /**
     * Lista todos os webhooks
     */
    listWebhooks(): WebhookConfig[] {
        return Array.from(this.webhooks.values());
    }

    /**
     * Ativa/desativa webhook
     */
    toggleWebhook(id: string, active: boolean): boolean {
        const webhook = this.webhooks.get(id);
        if (!webhook) return false;
        webhook.isActive = active;
        return true;
    }

    /**
     * Testa webhook
     */
    async testWebhook(id: string): Promise<boolean> {
        const webhook = this.webhooks.get(id);
        if (!webhook || !webhook.url) return false;

        try {
            await this.sendToWebhook(webhook, {
                event: 'NEW_MESSAGE',
                timestamp: new Date(),
                data: { test: true, message: 'Webhook test from Ghost Protocol' }
            });
            return true;
        } catch {
            return false;
        }
    }
}
