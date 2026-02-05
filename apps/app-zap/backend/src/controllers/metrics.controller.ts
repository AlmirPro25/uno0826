/**
 * 📊 METRICS CONTROLLER
 * Endpoints para métricas e monitoramento do sistema.
 */

import { Router, Request, Response } from 'express';
import { getMetrics } from '../services/metrics-collector.service';
import { getRateLimiter } from '../services/rate-limiter.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /metrics
 * Obtém todas as métricas do sistema
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const metrics = getMetrics().getMetrics();

        res.json({
            success: true,
            metrics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * GET /metrics/prometheus
 * Métricas em formato Prometheus
 */
router.get('/prometheus', async (req: Request, res: Response) => {
    try {
        const prometheus = getMetrics().toPrometheus();

        res.setHeader('Content-Type', 'text/plain');
        res.send(prometheus);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * GET /metrics/health
 * Health check do sistema
 */
router.get('/health', async (req: Request, res: Response) => {
    try {
        // Check database
        const dbHealthy = await checkDatabase();

        // Get basic metrics
        const metrics = getMetrics().getMetrics();

        const status = dbHealthy ? 'healthy' : 'unhealthy';

        res.status(dbHealthy ? 200 : 503).json({
            status,
            uptime: metrics.uptime,
            timestamp: new Date().toISOString(),
            checks: {
                database: dbHealthy ? 'ok' : 'error'
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: (error as Error).message
        });
    }
});

/**
 * GET /metrics/rate-limits
 * Status atual dos rate limits
 */
router.get('/rate-limits', async (req: Request, res: Response) => {
    try {
        const rateLimiter = getRateLimiter();
        const types = rateLimiter.listTypes();
        const stats = rateLimiter.getStats();

        res.json({
            success: true,
            stats,
            types: types.map(type => ({
                type,
                config: rateLimiter.getConfig(type)
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * GET /metrics/summary
 * Resumo rápido das métricas
 */
router.get('/summary', async (req: Request, res: Response) => {
    try {
        const metrics = getMetrics().getMetrics();

        // Get contact and message counts
        const contactCount = await prisma.contact.count();
        const messageCount = await prisma.message.count();
        const activeContacts = await prisma.contact.count({
            where: { isPaused: false }
        });

        // Get today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayMessages = await prisma.message.count({
            where: { timestamp: { gte: today } }
        });

        res.json({
            success: true,
            summary: {
                uptime: formatUptime(metrics.uptime),
                totalContacts: contactCount,
                activeContacts,
                totalMessages: messageCount,
                messagesToday: todayMessages,
                aiResponses: metrics.aiResponses,
                errorRate: `${metrics.errorRate.toFixed(2)}%`,
                avgResponseTime: `${metrics.avgResponseTime.toFixed(0)}ms`
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * POST /metrics/reset
 * Reseta métricas (apenas para dev/testing)
 */
router.post('/reset', async (req: Request, res: Response) => {
    try {
        const { confirm } = req.body;

        if (confirm !== 'RESET_METRICS') {
            return res.status(400).json({
                success: false,
                error: 'Confirmation required: send { "confirm": "RESET_METRICS" }'
            });
        }

        getMetrics().reset();

        res.json({
            success: true,
            message: 'Metrics reset successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * GET /metrics/counters
 * Obtém apenas contadores
 */
router.get('/counters', async (req: Request, res: Response) => {
    try {
        const metricsService = getMetrics();
        const counterNames = [
            'messages_received',
            'messages_sent',
            'ai_responses',
            'human_interventions',
            'gemini_calls',
            'gemini_tokens',
            'image_generations',
            'audio_generations',
            'conversions',
            'risks_detected',
            'campaigns_sent',
            'errors_total',
            'requests_total'
        ];

        const counters: Record<string, number> = {};
        counterNames.forEach(name => {
            counters[name] = metricsService.getCounter(name);
        });

        res.json({
            success: true,
            counters
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

// Helper functions
async function checkDatabase(): Promise<boolean> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch {
        return false;
    }
}

function formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
}

export default router;
