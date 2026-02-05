/**
 * 🎯 OPERATIONS CONTROLLER
 * API para operações avançadas: Hunter, Watchdog, Presence
 */

import { Request, Response } from 'express';
import { HunterService } from '../services/hunter.service';
import { WatchdogService } from '../services/watchdog.service';
import { PresenceService } from '../services/presence.service';
import { LogRepository } from '../repositories/log.repository';

const hunterService = new HunterService();
const watchdogService = new WatchdogService();
const presenceService = new PresenceService();
const logRepo = new LogRepository();

export class OperationsController {

    // ==================== HUNTER (Proatividade) ====================

    /**
     * GET /operations/hunter/targets
     * Lista contatos que devem ser "caçados"
     */
    static async getHuntingTargets(req: Request, res: Response) {
        try {
            const { campaignId } = req.query;
            const campaigns = hunterService.getCampaigns();
            const campaign = campaignId
                ? campaigns.find(c => c.id === campaignId)
                : undefined;

            const targets = await hunterService.identifyTargets(campaign);
            res.json({
                success: true,
                targets,
                count: targets.length
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /operations/hunter/campaigns
     * Lista campanhas de hunting disponíveis
     */
    static async getHuntingCampaigns(req: Request, res: Response) {
        try {
            const campaigns = hunterService.getCampaigns();
            res.json({ success: true, campaigns });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /operations/hunter/execute
     * Executa uma campanha de hunting
     */
    static async executeHuntingCampaign(req: Request, res: Response) {
        try {
            const { campaignId, dryRun = true } = req.body;
            logRepo.create('INFO', 'HUNTER_EXECUTE_REQUESTED',
                `Campaign: ${campaignId}, DryRun: ${dryRun}`, undefined);

            const result = await hunterService.executeCampaign(campaignId, dryRun);
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /operations/hunter/stats
     * Estatísticas de hunting
     */
    static async getHuntingStats(req: Request, res: Response) {
        try {
            const stats = await hunterService.getHuntingStats();
            res.json({ success: true, stats });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /operations/hunter/generate-opener
     * Gera mensagem de abertura para um contato específico
     */
    static async generateOpener(req: Request, res: Response) {
        try {
            const { contactId, contactName, daysSinceContact = 7, intimacyLevel = 50, salesReadiness = 50 } = req.body;

            if (!contactId) {
                return res.status(400).json({ success: false, error: 'contactId is required' });
            }

            const target = {
                contactId,
                name: contactName,
                lastInteraction: new Date(Date.now() - daysSinceContact * 24 * 60 * 60 * 1000),
                daysSinceContact,
                intimacyLevel,
                salesReadiness,
                reason: 'Manual request',
                suggestedOpener: `Oi ${contactName || 'lindx'}, tudo bem?`,
                priority: 'MEDIUM' as const
            };

            const message = await hunterService.generateOpeningMessage(target);
            res.json({ success: true, message });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    // ==================== WATCHDOG (Segurança) ====================

    /**
     * POST /operations/watchdog/analyze
     * Analisa uma mensagem em busca de riscos
     */
    static async analyzeMessage(req: Request, res: Response) {
        try {
            const { contactId, contactName, messageBody } = req.body;

            if (!messageBody) {
                return res.status(400).json({ success: false, error: 'messageBody is required' });
            }

            const alert = watchdogService.analyzeMessage(
                contactId || 'unknown',
                contactName || null,
                messageBody
            );

            res.json({
                success: true,
                hasRisk: !!alert,
                alert,
                shouldPauseAI: alert ? watchdogService.shouldPauseAI(alert) : false
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /operations/watchdog/alerts
     * Lista alertas ativos
     */
    static async getAlerts(req: Request, res: Response) {
        try {
            const alerts = watchdogService.getActiveAlerts();
            res.json({
                success: true,
                alerts,
                count: alerts.length
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /operations/watchdog/alerts/:alertId/acknowledge
     * Reconhece um alerta
     */
    static async acknowledgeAlert(req: Request, res: Response) {
        try {
            const { alertId } = req.params;
            const acknowledged = watchdogService.acknowledgeAlert(alertId);

            res.json({
                success: acknowledged,
                message: acknowledged ? 'Alert acknowledged' : 'Alert not found'
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /operations/watchdog/stats
     * Estatísticas de risco
     */
    static async getRiskStats(req: Request, res: Response) {
        try {
            const stats = watchdogService.getRiskStats();
            res.json({ success: true, stats });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * DELETE /operations/watchdog/alerts/old
     * Limpa alertas antigos
     */
    static async clearOldAlerts(req: Request, res: Response) {
        try {
            const { olderThanHours = 24 } = req.query;
            const cleared = watchdogService.clearOldAlerts(Number(olderThanHours));

            res.json({
                success: true,
                cleared,
                message: `Cleared ${cleared} old alerts`
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    // ==================== PRESENCE (Gestão de Presença) ====================

    /**
     * GET /operations/presence/state
     * Retorna estado atual de presença
     */
    static async getPresenceState(req: Request, res: Response) {
        try {
            const state = presenceService.getCurrentState();
            res.json({ success: true, state });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /operations/presence/profile
     * Retorna perfil de presença
     */
    static async getPresenceProfile(req: Request, res: Response) {
        try {
            const profile = presenceService.getProfile();
            res.json({ success: true, profile });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * PUT /operations/presence/profile
     * Atualiza perfil de presença
     */
    static async updatePresenceProfile(req: Request, res: Response) {
        try {
            presenceService.updateProfile(req.body);
            const profile = presenceService.getProfile();

            res.json({
                success: true,
                message: 'Profile updated',
                profile
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /operations/presence/can-respond
     * Verifica se pode responder agora
     */
    static async canRespondNow(req: Request, res: Response) {
        try {
            const result = presenceService.shouldRespondNow();
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /operations/presence/adjust-delay
     * Calcula delay ajustado pela presença
     */
    static async adjustDelay(req: Request, res: Response) {
        try {
            const { baseDelayMs = 30000 } = req.body;
            const adjustedDelay = presenceService.adjustDelayForPresence(baseDelayMs);
            const state = presenceService.getCurrentState();

            res.json({
                success: true,
                baseDelayMs,
                adjustedDelayMs: adjustedDelay,
                multiplier: state.responseDelayMultiplier,
                currentMode: state.currentMode
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /operations/presence/stats
     * Estatísticas de presença
     */
    static async getPresenceStats(req: Request, res: Response) {
        try {
            const stats = presenceService.getPresenceStats();
            res.json({ success: true, stats });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /operations/presence/busy-message
     * Gera mensagem de "ocupado" contextual
     */
    static async getBusyMessage(req: Request, res: Response) {
        try {
            const message = presenceService.getBusyMessage();
            const state = presenceService.getCurrentState();

            res.json({
                success: true,
                message,
                currentMode: state.currentMode,
                suggestedStatus: state.suggestedStatus
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    // ==================== DASHBOARD UNIFICADO ====================

    /**
     * GET /operations/dashboard
     * Dashboard operacional completo
     */
    static async getOperationalDashboard(req: Request, res: Response) {
        try {
            const [hunterStats, riskStats, presenceState, presenceStats] = await Promise.all([
                hunterService.getHuntingStats(),
                Promise.resolve(watchdogService.getRiskStats()),
                Promise.resolve(presenceService.getCurrentState()),
                Promise.resolve(presenceService.getPresenceStats())
            ]);

            res.json({
                success: true,
                dashboard: {
                    hunter: hunterStats,
                    watchdog: riskStats,
                    presence: {
                        state: presenceState,
                        stats: presenceStats
                    },
                    systemHealth: {
                        allSystemsOperational: true,
                        activeAlerts: riskStats.unacknowledged,
                        isResponding: presenceState.canRespond
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }
}
