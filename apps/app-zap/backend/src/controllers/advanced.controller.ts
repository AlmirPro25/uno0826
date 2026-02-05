/**
 * ⚙️ SYSTEM ADVANCED CONTROLLER
 * API para Scheduler, Webhooks e A/B Testing
 */

import { Request, Response } from 'express';
import { getScheduler } from '../services/scheduler.service';
import { WebhookService } from '../services/webhook.service';
import { ABTestingService } from '../services/abtesting.service';
import { LogRepository } from '../repositories/log.repository';

const scheduler = getScheduler();
const webhookService = new WebhookService();
const abTestingService = new ABTestingService();
const logRepo = new LogRepository();

export class AdvancedController {

    // ==================== SCHEDULER ====================

    /**
     * GET /advanced/scheduler/tasks
     * Lista todas as tarefas agendadas
     */
    static async getSchedulerTasks(req: Request, res: Response) {
        try {
            const tasks = scheduler.getTasksStatus();
            res.json({ success: true, tasks });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /advanced/scheduler/start
     * Inicia o scheduler
     */
    static async startScheduler(req: Request, res: Response) {
        try {
            scheduler.start();
            res.json({ success: true, message: 'Scheduler started' });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /advanced/scheduler/stop
     * Para o scheduler
     */
    static async stopScheduler(req: Request, res: Response) {
        try {
            scheduler.stop();
            res.json({ success: true, message: 'Scheduler stopped' });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /advanced/scheduler/tasks/:taskId/run
     * Executa uma tarefa manualmente
     */
    static async runTask(req: Request, res: Response) {
        try {
            const { taskId } = req.params;
            const result = await scheduler.runNow(taskId);
            res.json({ success: result.success, result });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * PUT /advanced/scheduler/tasks/:taskId/toggle
     * Ativa/desativa uma tarefa
     */
    static async toggleTask(req: Request, res: Response) {
        try {
            const { taskId } = req.params;
            const { active } = req.body;
            const success = scheduler.toggleTask(taskId, active);
            res.json({ success, message: active ? 'Task activated' : 'Task deactivated' });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    // ==================== WEBHOOKS ====================

    /**
     * GET /advanced/webhooks
     * Lista todos os webhooks
     */
    static async listWebhooks(req: Request, res: Response) {
        try {
            const webhooks = webhookService.listWebhooks();
            res.json({ success: true, webhooks });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /advanced/webhooks
     * Cria/atualiza webhook
     */
    static async upsertWebhook(req: Request, res: Response) {
        try {
            webhookService.setWebhook(req.body);
            res.json({ success: true, message: 'Webhook configured' });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * DELETE /advanced/webhooks/:webhookId
     * Remove webhook
     */
    static async deleteWebhook(req: Request, res: Response) {
        try {
            const { webhookId } = req.params;
            const success = webhookService.removeWebhook(webhookId);
            res.json({ success, message: success ? 'Webhook removed' : 'Webhook not found' });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * PUT /advanced/webhooks/:webhookId/toggle
     * Ativa/desativa webhook
     */
    static async toggleWebhook(req: Request, res: Response) {
        try {
            const { webhookId } = req.params;
            const { active } = req.body;
            const success = webhookService.toggleWebhook(webhookId, active);
            res.json({ success });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /advanced/webhooks/:webhookId/test
     * Testa webhook
     */
    static async testWebhook(req: Request, res: Response) {
        try {
            const { webhookId } = req.params;
            const success = await webhookService.testWebhook(webhookId);
            res.json({ success, message: success ? 'Webhook test sent' : 'Webhook test failed' });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    // ==================== A/B TESTING ====================

    /**
     * GET /advanced/abtests
     * Lista todos os testes A/B
     */
    static async listABTests(req: Request, res: Response) {
        try {
            const tests = abTestingService.getAllTests();
            res.json({ success: true, tests });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /advanced/abtests/:testId
     * Obtém detalhes de um teste
     */
    static async getABTest(req: Request, res: Response) {
        try {
            const { testId } = req.params;
            const test = abTestingService.getTest(testId);

            if (!test) {
                return res.status(404).json({ success: false, error: 'Test not found' });
            }

            res.json({ success: true, test });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /advanced/abtests/:testId/select
     * Seleciona variante para usar
     */
    static async selectVariant(req: Request, res: Response) {
        try {
            const { testId } = req.params;
            const variant = abTestingService.selectVariant(testId);

            if (!variant) {
                return res.status(404).json({ success: false, error: 'No variant available' });
            }

            res.json({ success: true, variant });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /advanced/abtests/:testId/impression
     * Registra impressão
     */
    static async recordImpression(req: Request, res: Response) {
        try {
            const { testId } = req.params;
            const { variantId } = req.body;
            abTestingService.recordImpression(testId, variantId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /advanced/abtests/:testId/conversion
     * Registra conversão
     */
    static async recordConversion(req: Request, res: Response) {
        try {
            const { testId } = req.params;
            const { variantId } = req.body;
            abTestingService.recordConversion(testId, variantId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * PUT /advanced/abtests/:testId/toggle
     * Ativa/desativa teste
     */
    static async toggleABTest(req: Request, res: Response) {
        try {
            const { testId } = req.params;
            const { active } = req.body;
            const success = abTestingService.toggleTest(testId, active);
            res.json({ success });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /advanced/abtests/:testId/reset
     * Reseta estatísticas do teste
     */
    static async resetABTest(req: Request, res: Response) {
        try {
            const { testId } = req.params;
            const success = abTestingService.resetTest(testId);
            res.json({ success, message: success ? 'Test reset' : 'Test not found' });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /advanced/abtests/:testId/winner
     * Obtém variante vencedora
     */
    static async getWinner(req: Request, res: Response) {
        try {
            const { testId } = req.params;
            const variant = abTestingService.getBestVariant(testId);
            res.json({ success: !!variant, variant });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /advanced/abtests/stats
     * Estatísticas gerais de A/B testing
     */
    static async getABTestStats(req: Request, res: Response) {
        try {
            const stats = abTestingService.getStats();
            res.json({ success: true, stats });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    // ==================== MASTER DASHBOARD ====================

    /**
     * GET /advanced/dashboard
     * Dashboard completo de recursos avançados
     */
    static async getAdvancedDashboard(req: Request, res: Response) {
        try {
            const [tasks, webhooks, abStats] = await Promise.all([
                Promise.resolve(scheduler.getTasksStatus()),
                Promise.resolve(webhookService.listWebhooks()),
                Promise.resolve(abTestingService.getStats())
            ]);

            res.json({
                success: true,
                dashboard: {
                    scheduler: {
                        tasks,
                        activeTasks: tasks.filter(t => t.isActive).length
                    },
                    webhooks: {
                        total: webhooks.length,
                        active: webhooks.filter(w => w.isActive).length
                    },
                    abTesting: abStats
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }
}
