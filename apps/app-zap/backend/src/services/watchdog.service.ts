/**
 * 🛡️ WATCHDOG SERVICE (Sistema de Risco e Segurança)
 * Monitora mensagens em tempo real para detectar:
 * 1. Palavras de risco legal (polícia, processo, denúncia)
 * 2. Comportamento suspeito (menores, violência)
 * 3. Ameaças à operação (golpe, fake, mentira)
 * 
 * Quando detecta, PAUSA a IA e notifica o operador.
 */

import { PrismaClient, Contact } from '@prisma/client';
import { LogRepository } from '../repositories/log.repository';
import { Server as SocketServer } from 'socket.io';

const prisma = new PrismaClient();

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskCategory = 'LEGAL' | 'SAFETY' | 'FRAUD' | 'REPUTATION' | 'OPERATIONAL';

export interface RiskAlert {
    id: string;
    contactId: string;
    contactName: string | null;
    messageBody: string;
    detectedPatterns: string[];
    riskLevel: RiskLevel;
    category: RiskCategory;
    recommendation: string;
    timestamp: Date;
    acknowledged: boolean;
}

export interface RiskPattern {
    pattern: string;
    category: RiskCategory;
    riskLevel: RiskLevel;
    recommendation: string;
}

export class WatchdogService {
    private io: SocketServer | null = null;
    private logRepo = new LogRepository();
    private alerts: Map<string, RiskAlert> = new Map();

    // Padrões de risco por categoria
    private readonly RISK_PATTERNS: RiskPattern[] = [
        // LEGAL - Risco jurídico
        { pattern: 'polícia', category: 'LEGAL', riskLevel: 'CRITICAL', recommendation: 'PAUSAR IMEDIATAMENTE. Operador deve assumir.' },
        { pattern: 'delegacia', category: 'LEGAL', riskLevel: 'CRITICAL', recommendation: 'PAUSAR IMEDIATAMENTE.' },
        { pattern: 'processo', category: 'LEGAL', riskLevel: 'HIGH', recommendation: 'Verificar contexto antes de responder.' },
        { pattern: 'advogado', category: 'LEGAL', riskLevel: 'HIGH', recommendation: 'Pausar e avaliar.' },
        { pattern: 'denúncia', category: 'LEGAL', riskLevel: 'CRITICAL', recommendation: 'PAUSAR IMEDIATAMENTE.' },
        { pattern: 'denunciar', category: 'LEGAL', riskLevel: 'CRITICAL', recommendation: 'PAUSAR IMEDIATAMENTE.' },
        { pattern: 'procon', category: 'LEGAL', riskLevel: 'HIGH', recommendation: 'Cliente insatisfeito. Operador assume.' },
        { pattern: 'justiça', category: 'LEGAL', riskLevel: 'HIGH', recommendation: 'Avaliar contexto.' },

        // SAFETY - Segurança pessoal
        { pattern: 'menor', category: 'SAFETY', riskLevel: 'CRITICAL', recommendation: 'BLOQUEIO TOTAL. Não responder.' },
        { pattern: 'criança', category: 'SAFETY', riskLevel: 'CRITICAL', recommendation: 'BLOQUEIO TOTAL.' },
        { pattern: 'anos de idade', category: 'SAFETY', riskLevel: 'HIGH', recommendation: 'Verificar idade antes de continuar.' },
        { pattern: 'matar', category: 'SAFETY', riskLevel: 'CRITICAL', recommendation: 'PERIGO. Operador assume.' },
        { pattern: 'morrer', category: 'SAFETY', riskLevel: 'HIGH', recommendation: 'Avaliar contexto emocional.' },
        { pattern: 'suicídio', category: 'SAFETY', riskLevel: 'CRITICAL', recommendation: 'Encaminhar para ajuda profissional.' },
        { pattern: 'me machucar', category: 'SAFETY', riskLevel: 'CRITICAL', recommendation: 'Parar e oferecer apoio.' },

        // FRAUD - Suspeita de fraude
        { pattern: 'golpe', category: 'FRAUD', riskLevel: 'HIGH', recommendation: 'Cliente desconfiado. Reforçar prova social.' },
        { pattern: 'fake', category: 'FRAUD', riskLevel: 'MEDIUM', recommendation: 'Oferecer verificação/chamada.' },
        { pattern: 'mentira', category: 'FRAUD', riskLevel: 'MEDIUM', recommendation: 'Construir confiança.' },
        { pattern: 'robô', category: 'FRAUD', riskLevel: 'HIGH', recommendation: 'Humanizar resposta imediatamente.' },
        { pattern: 'bot', category: 'FRAUD', riskLevel: 'HIGH', recommendation: 'Enviar áudio para provar humanidade.' },
        { pattern: 'ia', category: 'FRAUD', riskLevel: 'MEDIUM', recommendation: 'Evitar linguagem robótica.' },
        { pattern: 'chatgpt', category: 'FRAUD', riskLevel: 'HIGH', recommendation: 'Negar e humanizar.' },

        // REPUTATION - Risco reputacional
        { pattern: 'expor', category: 'REPUTATION', riskLevel: 'HIGH', recommendation: 'Acalmar e resolver.' },
        { pattern: 'vazou', category: 'REPUTATION', riskLevel: 'CRITICAL', recommendation: 'CRISE. Operador assume.' },
        { pattern: 'twitter', category: 'REPUTATION', riskLevel: 'MEDIUM', recommendation: 'Potencial exposição pública.' },
        { pattern: 'instagram', category: 'REPUTATION', riskLevel: 'MEDIUM', recommendation: 'Monitorar.' },
        { pattern: 'prints', category: 'REPUTATION', riskLevel: 'HIGH', recommendation: 'Cliente pode expor conversa.' },

        // OPERATIONAL - Risco operacional
        { pattern: 'estorno', category: 'OPERATIONAL', riskLevel: 'HIGH', recommendation: 'Resolver disputa antes de escalar.' },
        { pattern: 'devolver', category: 'OPERATIONAL', riskLevel: 'MEDIUM', recommendation: 'Avaliar política de reembolso.' },
        { pattern: 'não recebi', category: 'OPERATIONAL', riskLevel: 'MEDIUM', recommendation: 'Verificar entrega e reenviar.' },
        { pattern: 'bloquear', category: 'OPERATIONAL', riskLevel: 'LOW', recommendation: 'Cliente pode bloquear.' },
        { pattern: 'spam', category: 'OPERATIONAL', riskLevel: 'HIGH', recommendation: 'Reduzir frequência de mensagens.' }
    ];

    constructor(io?: SocketServer) {
        if (io) this.io = io;
    }

    setSocketIO(io: SocketServer) {
        this.io = io;
    }

    /**
     * Analisa uma mensagem em busca de riscos
     */
    analyzeMessage(contactId: string, contactName: string | null, messageBody: string): RiskAlert | null {
        const lowerMessage = messageBody.toLowerCase();
        const detectedPatterns: RiskPattern[] = [];

        // Verificar todos os padrões
        for (const riskPattern of this.RISK_PATTERNS) {
            if (lowerMessage.includes(riskPattern.pattern.toLowerCase())) {
                detectedPatterns.push(riskPattern);
            }
        }

        if (detectedPatterns.length === 0) return null;

        // Determinar o maior nível de risco
        const riskOrder: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
        let maxRisk: RiskLevel = 'LOW';
        let primaryCategory: RiskCategory = 'OPERATIONAL';
        let recommendation = '';

        for (const pattern of detectedPatterns) {
            if (riskOrder[pattern.riskLevel] > riskOrder[maxRisk]) {
                maxRisk = pattern.riskLevel;
                primaryCategory = pattern.category;
                recommendation = pattern.recommendation;
            }
        }

        const alert: RiskAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            contactId,
            contactName,
            messageBody,
            detectedPatterns: detectedPatterns.map(p => p.pattern),
            riskLevel: maxRisk,
            category: primaryCategory,
            recommendation,
            timestamp: new Date(),
            acknowledged: false
        };

        // Persistir alerta
        this.alerts.set(alert.id, alert);
        this.logRepo.create('WARN', `RISK_DETECTED_${maxRisk}`,
            JSON.stringify({ patterns: alert.detectedPatterns, category: primaryCategory }),
            contactId);

        // Notificar via Socket
        if (this.io) {
            this.io.emit('risk_alert', alert);
        }

        return alert;
    }

    /**
     * Verifica se deve pausar a IA baseado no risco
     */
    shouldPauseAI(alert: RiskAlert): boolean {
        return alert.riskLevel === 'CRITICAL' || alert.riskLevel === 'HIGH';
    }

    /**
     * Pausa automaticamente a IA para um contato de alto risco
     */
    async autoPauseHighRiskContact(contactId: string, alert: RiskAlert): Promise<void> {
        if (this.shouldPauseAI(alert)) {
            await prisma.contact.update({
                where: { id: contactId },
                data: { isPaused: true }
            });

            this.logRepo.create('WARN', 'AUTO_PAUSE_TRIGGERED',
                `Contact auto-paused due to ${alert.riskLevel} risk: ${alert.detectedPatterns.join(', ')}`,
                contactId);

            if (this.io) {
                this.io.emit('contact_auto_paused', {
                    contactId,
                    contactName: alert.contactName,
                    reason: alert.recommendation,
                    riskLevel: alert.riskLevel
                });
            }
        }
    }

    /**
     * Retorna todos os alertas não reconhecidos
     */
    getActiveAlerts(): RiskAlert[] {
        return Array.from(this.alerts.values())
            .filter(a => !a.acknowledged)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Reconhece um alerta
     */
    acknowledgeAlert(alertId: string): boolean {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            return true;
        }
        return false;
    }

    /**
     * Estatísticas de risco
     */
    getRiskStats(): {
        totalAlerts: number;
        unacknowledged: number;
        byLevel: Record<RiskLevel, number>;
        byCategory: Record<RiskCategory, number>;
    } {
        const alerts = Array.from(this.alerts.values());

        const byLevel: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
        const byCategory: Record<RiskCategory, number> = { LEGAL: 0, SAFETY: 0, FRAUD: 0, REPUTATION: 0, OPERATIONAL: 0 };

        for (const alert of alerts) {
            byLevel[alert.riskLevel]++;
            byCategory[alert.category]++;
        }

        return {
            totalAlerts: alerts.length,
            unacknowledged: alerts.filter(a => !a.acknowledged).length,
            byLevel,
            byCategory
        };
    }

    /**
     * Limpar alertas antigos
     */
    clearOldAlerts(olderThanHours: number = 24): number {
        const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        let cleared = 0;

        for (const [id, alert] of this.alerts) {
            if (alert.timestamp < cutoff && alert.acknowledged) {
                this.alerts.delete(id);
                cleared++;
            }
        }

        return cleared;
    }
}
