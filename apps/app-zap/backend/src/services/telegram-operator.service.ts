/**
 * 📱 TELEGRAM OPERATOR SERVICE
 * Notifica o operador via Telegram em tempo real.
 * Comandos para controle remoto do Ghost Protocol.
 */

import { LogRepository } from '../repositories/log.repository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TelegramConfig {
    botToken: string;
    chatId: string;
    enabled: boolean;
}

export interface TelegramNotification {
    type: 'MESSAGE' | 'ALERT' | 'SALE' | 'RISK' | 'SYSTEM' | 'DAILY_REPORT';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    title: string;
    body: string;
    metadata?: {
        contactId?: string;
        contactName?: string;
        phone?: string;
    };
}

export class TelegramOperatorService {
    private logRepo = new LogRepository();
    private config: TelegramConfig = {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || '',
        enabled: false
    };

    private apiUrl: string;

    constructor() {
        this.apiUrl = `https://api.telegram.org/bot${this.config.botToken}`;
        this.config.enabled = !!(this.config.botToken && this.config.chatId);
    }

    /**
     * Configura o bot do Telegram
     */
    configure(botToken: string, chatId: string): void {
        this.config.botToken = botToken;
        this.config.chatId = chatId;
        this.config.enabled = !!(botToken && chatId);
        this.apiUrl = `https://api.telegram.org/bot${botToken}`;

        this.logRepo.create('INFO', 'TELEGRAM_CONFIGURED',
            `Telegram operator notifications ${this.config.enabled ? 'enabled' : 'disabled'}`, undefined);
    }

    /**
     * Envia notificação para o operador
     */
    async notify(notification: TelegramNotification): Promise<boolean> {
        if (!this.config.enabled) return false;

        const emoji = this.getEmoji(notification.type, notification.priority);
        const priorityLabel = notification.priority === 'URGENT' ? '🚨 URGENTE' :
            notification.priority === 'HIGH' ? '⚠️ IMPORTANTE' : '';

        let message = `${emoji} <b>${notification.title}</b>\n`;
        if (priorityLabel) message += `${priorityLabel}\n`;
        message += `\n${notification.body}`;

        if (notification.metadata?.contactName) {
            message += `\n\n👤 Contato: ${notification.metadata.contactName}`;
        }
        if (notification.metadata?.phone) {
            message += `\n📱 Telefone: ${notification.metadata.phone}`;
        }

        message += `\n\n⏰ ${new Date().toLocaleString('pt-BR')}`;

        return this.sendMessage(message);
    }

    /**
     * Envia mensagem de texto simples
     */
    async sendMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
        if (!this.config.enabled) return false;

        try {
            const response = await fetch(`${this.apiUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.config.chatId,
                    text,
                    parse_mode: parseMode,
                    disable_web_page_preview: true
                })
            });

            const result = await response.json();
            return result.ok === true;
        } catch (error) {
            console.error('Telegram send error:', error);
            return false;
        }
    }

    /**
     * Notifica nova mensagem importante
     */
    async notifyNewMessage(contactName: string, phone: string, messagePreview: string, intimacy: number): Promise<void> {
        // Só notifica se intimidade alta ou mensagem parece importante
        if (intimacy < 70 && !this.isImportantMessage(messagePreview)) return;

        await this.notify({
            type: 'MESSAGE',
            priority: intimacy > 85 ? 'HIGH' : 'NORMAL',
            title: 'Nova Mensagem VIP',
            body: `"${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}"`,
            metadata: { contactName, phone }
        });
    }

    /**
     * Notifica alerta de risco
     */
    async notifyRiskAlert(
        contactName: string,
        phone: string,
        riskLevel: string,
        category: string,
        messagePreview: string
    ): Promise<void> {
        const priority = riskLevel === 'CRITICAL' ? 'URGENT' :
            riskLevel === 'HIGH' ? 'HIGH' : 'NORMAL';

        await this.notify({
            type: 'RISK',
            priority,
            title: `Risco ${riskLevel} Detectado`,
            body: `Categoria: ${category}\n\nMensagem: "${messagePreview.substring(0, 150)}..."`,
            metadata: { contactName, phone }
        });
    }

    /**
     * Notifica venda/conversão
     */
    async notifySale(contactName: string, phone: string, details?: string): Promise<void> {
        await this.notify({
            type: 'SALE',
            priority: 'HIGH',
            title: '💰 VENDA REALIZADA!',
            body: details || 'Contato convertido com sucesso!',
            metadata: { contactName, phone }
        });
    }

    /**
     * Envia relatório diário
     */
    async sendDailyReport(stats: {
        messagesReceived: number;
        messagesSent: number;
        aiResponses: number;
        humanInterventions: number;
        newContacts: number;
        conversions: number;
        risksDetected: number;
    }): Promise<void> {
        const report = `
📊 <b>RELATÓRIO DIÁRIO - Ghost Protocol</b>

📥 Mensagens Recebidas: ${stats.messagesReceived}
📤 Mensagens Enviadas: ${stats.messagesSent}
🤖 Respostas da IA: ${stats.aiResponses}
👤 Intervenções Humanas: ${stats.humanInterventions}

👥 Novos Contatos: ${stats.newContacts}
💰 Conversões: ${stats.conversions}
⚠️ Riscos Detectados: ${stats.risksDetected}

📈 Taxa de IA: ${stats.messagesReceived > 0 ? Math.round((stats.aiResponses / stats.messagesReceived) * 100) : 0}%
    `.trim();

        await this.sendMessage(report);
    }

    /**
     * Envia alerta de sistema
     */
    async notifySystemAlert(title: string, message: string, isError: boolean = false): Promise<void> {
        await this.notify({
            type: 'SYSTEM',
            priority: isError ? 'URGENT' : 'NORMAL',
            title: isError ? `❌ ERRO: ${title}` : `ℹ️ ${title}`,
            body: message
        });
    }

    /**
     * Processa comandos recebidos do Telegram
     */
    async processCommand(command: string): Promise<string> {
        const cmd = command.toLowerCase().trim();

        switch (cmd) {
            case '/status':
                return await this.getStatusResponse();

            case '/stats':
                return await this.getStatsResponse();

            case '/hot':
                return await this.getHotLeadsResponse();

            case '/alerts':
                return await this.getAlertsResponse();

            case '/pause':
                return '⏸️ Para pausar um contato, use:\n/pause <telefone>';

            case '/resume':
                return '▶️ Para reativar um contato, use:\n/resume <telefone>';

            case '/help':
                return this.getHelpMessage();

            default:
                if (cmd.startsWith('/pause ')) {
                    const phone = cmd.replace('/pause ', '').trim();
                    return await this.pauseContact(phone);
                }
                if (cmd.startsWith('/resume ')) {
                    const phone = cmd.replace('/resume ', '').trim();
                    return await this.resumeContact(phone);
                }
                return '❓ Comando não reconhecido. Use /help para ver comandos disponíveis.';
        }
    }

    private async getStatusResponse(): Promise<string> {
        const activeContacts = await prisma.contact.count({ where: { isPaused: false } });
        const pausedContacts = await prisma.contact.count({ where: { isPaused: true } });

        return `
🟢 <b>Ghost Protocol ONLINE</b>

👥 Contatos Ativos: ${activeContacts}
⏸️ Contatos Pausados: ${pausedContacts}
⏰ Uptime: ${process.uptime().toFixed(0)}s
    `.trim();
    }

    private async getStatsResponse(): Promise<string> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const messagesCount = await prisma.message.count({
            where: { timestamp: { gte: today } }
        });

        return `
📊 <b>Estatísticas de Hoje</b>

💬 Mensagens: ${messagesCount}
    `.trim();
    }

    private async getHotLeadsResponse(): Promise<string> {
        const contacts = await prisma.contact.findMany({
            where: {
                isPaused: false,
                salesReadiness: { gte: 70 }
            },
            orderBy: { salesReadiness: 'desc' },
            take: 5
        });

        if (contacts.length === 0) {
            return '📭 Nenhum lead quente no momento.';
        }

        let response = '🔥 <b>Leads Quentes</b>\n\n';
        contacts.forEach((c, i) => {
            response += `${i + 1}. ${c.name || c.phone} - ${c.salesReadiness}% pronto\n`;
        });

        return response;
    }

    private async getAlertsResponse(): Promise<string> {
        // Would integrate with WatchdogService
        return '⚠️ Use o Command Center para ver alertas ativos.';
    }

    private async pauseContact(phone: string): Promise<string> {
        const contact = await prisma.contact.findFirst({ where: { phone } });
        if (!contact) return '❌ Contato não encontrado.';

        await prisma.contact.update({
            where: { id: contact.id },
            data: { isPaused: true }
        });

        return `⏸️ Contato ${contact.name || phone} pausado.`;
    }

    private async resumeContact(phone: string): Promise<string> {
        const contact = await prisma.contact.findFirst({ where: { phone } });
        if (!contact) return '❌ Contato não encontrado.';

        await prisma.contact.update({
            where: { id: contact.id },
            data: { isPaused: false }
        });

        return `▶️ Contato ${contact.name || phone} reativado.`;
    }

    private getHelpMessage(): string {
        return `
🤖 <b>Comandos do Ghost Protocol</b>

/status - Status do sistema
/stats - Estatísticas do dia
/hot - Ver leads quentes
/alerts - Ver alertas ativos
/pause <telefone> - Pausar contato
/resume <telefone> - Reativar contato
/help - Esta mensagem
    `.trim();
    }

    private getEmoji(type: TelegramNotification['type'], priority: TelegramNotification['priority']): string {
        if (priority === 'URGENT') return '🚨';

        const emojis: Record<TelegramNotification['type'], string> = {
            MESSAGE: '💬',
            ALERT: '⚠️',
            SALE: '💰',
            RISK: '🛡️',
            SYSTEM: '⚙️',
            DAILY_REPORT: '📊'
        };
        return emojis[type] || '📌';
    }

    private isImportantMessage(message: string): boolean {
        const importantPatterns = [
            /pix/i,
            /comprar/i,
            /quanto/i,
            /pagar/i,
            /urgente/i,
            /agora/i,
            /já/i,
            /preciso/i
        ];
        return importantPatterns.some(p => p.test(message));
    }

    /**
     * Verifica se está configurado
     */
    isConfigured(): boolean {
        return this.config.enabled;
    }

    /**
     * Obtém configuração atual (sem expor o token)
     */
    getConfig(): { chatId: string; enabled: boolean } {
        return {
            chatId: this.config.chatId,
            enabled: this.config.enabled
        };
    }
}

// Singleton
let telegramInstance: TelegramOperatorService | null = null;

export function getTelegramService(): TelegramOperatorService {
    if (!telegramInstance) {
        telegramInstance = new TelegramOperatorService();
    }
    return telegramInstance;
}
