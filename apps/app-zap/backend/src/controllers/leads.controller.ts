/**
 * 💎 LEADS CONTROLLER
 * Endpoints para Lead Scoring e gestão de leads.
 */

import { Router, Request, Response } from 'express';
import { LeadScoringService } from '../services/lead-scoring.service';
import { CampaignService } from '../services/campaign.service';
import { TemplateService } from '../services/template.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const leadScoringService = new LeadScoringService();
const campaignService = new CampaignService();
const templateService = new TemplateService();

/**
 * GET /leads/scores
 * Obtém scores de todos os leads
 */
router.get('/scores', async (req: Request, res: Response) => {
    try {
        const scores = await leadScoringService.calculateAllScores();

        res.json({
            success: true,
            total: scores.length,
            scores
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * GET /leads/scores/:contactId
 * Obtém score de um lead específico
 */
router.get('/scores/:contactId', async (req: Request, res: Response) => {
    try {
        const { contactId } = req.params;
        const score = await leadScoringService.calculateLeadScore(contactId);

        res.json({
            success: true,
            score
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * GET /leads/tier/:tier
 * Obtém leads por tier
 */
router.get('/tier/:tier', async (req: Request, res: Response) => {
    try {
        const tier = req.params.tier.toUpperCase() as 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' | 'COLD';
        const leads = await leadScoringService.getLeadsByTier(tier);

        res.json({
            success: true,
            tier,
            count: leads.length,
            leads
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * GET /leads/hot
 * Obtém leads prontos para conversão
 */
router.get('/hot', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const hotLeads = await leadScoringService.getHotLeads(limit);

        res.json({
            success: true,
            count: hotLeads.length,
            leads: hotLeads
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * GET /leads/campaigns
 * Lista todas as campanhas
 */
router.get('/campaigns', async (req: Request, res: Response) => {
    try {
        const campaigns = campaignService.listCampaigns();
        const stats = campaignService.getOverallStats();

        res.json({
            success: true,
            stats,
            campaigns
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * GET /leads/campaigns/:campaignId
 * Obtém detalhes de uma campanha
 */
router.get('/campaigns/:campaignId', async (req: Request, res: Response) => {
    try {
        const { campaignId } = req.params;
        const campaign = campaignService.getCampaign(campaignId);

        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: 'Campaign not found'
            });
        }

        const targets = await campaignService.findTargets(campaignId);
        const executions = campaignService.getExecutions(campaignId);

        res.json({
            success: true,
            campaign,
            targets,
            executions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * POST /leads/campaigns/:campaignId/execute
 * Executa uma campanha
 */
router.post('/campaigns/:campaignId/execute', async (req: Request, res: Response) => {
    try {
        const { campaignId } = req.params;
        const { dryRun = true } = req.body;

        const campaign = campaignService.getCampaign(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: 'Campaign not found'
            });
        }

        const targets = await campaignService.findTargets(campaignId);
        const results: any[] = [];

        for (const target of targets) {
            const message = await campaignService.generateMessage(campaignId, target);

            if (!dryRun) {
                // TODO: Integrate with WhatsApp service to actually send
                campaignService.recordExecution({
                    campaignId,
                    targetContactId: target.id,
                    contactName: target.name,
                    generatedMessage: message,
                    sentAt: new Date(),
                    responseReceived: false,
                    converted: false
                });
            }

            results.push({
                contactId: target.id,
                contactName: target.name,
                message,
                wouldSend: !dryRun
            });
        }

        res.json({
            success: true,
            dryRun,
            campaign: campaign.name,
            targetsFound: targets.length,
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * PUT /leads/campaigns/:campaignId/status
 * Altera status de uma campanha
 */
router.put('/campaigns/:campaignId/status', async (req: Request, res: Response) => {
    try {
        const { campaignId } = req.params;
        const { status } = req.body;

        const success = campaignService.setCampaignStatus(campaignId, status);

        res.json({
            success,
            campaignId,
            newStatus: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * GET /leads/templates
 * Lista templates de mensagem
 */
router.get('/templates', async (req: Request, res: Response) => {
    try {
        const category = req.query.category as string | undefined;
        const templates = templateService.listTemplates(category as any);
        const stats = templateService.getStats();

        res.json({
            success: true,
            stats,
            templates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * POST /leads/templates/:templateId/apply
 * Aplica um template com variáveis
 */
router.post('/templates/:templateId/apply', async (req: Request, res: Response) => {
    try {
        const { templateId } = req.params;
        const { variables, useAI, context } = req.body;

        let message: string;

        if (useAI && context) {
            message = await templateService.generatePersonalizedMessage(templateId, context);
        } else {
            message = templateService.applyTemplate(templateId, variables);
        }

        res.json({
            success: true,
            templateId,
            message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * POST /leads/templates/:templateId/outcome
 * Registra resultado de um template
 */
router.post('/templates/:templateId/outcome', async (req: Request, res: Response) => {
    try {
        const { templateId } = req.params;
        const { success } = req.body;

        templateService.recordOutcome(templateId, success);

        res.json({
            success: true,
            templateId,
            recorded: success ? 'success' : 'failure'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * GET /leads/dashboard
 * Dashboard completo de leads
 */
router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        // Get all scores
        const scores = await leadScoringService.calculateAllScores();

        // Count by tier
        const tierCounts = {
            DIAMOND: scores.filter(s => s.tier === 'DIAMOND').length,
            GOLD: scores.filter(s => s.tier === 'GOLD').length,
            SILVER: scores.filter(s => s.tier === 'SILVER').length,
            BRONZE: scores.filter(s => s.tier === 'BRONZE').length,
            COLD: scores.filter(s => s.tier === 'COLD').length
        };

        // Get campaign stats
        const campaignStats = campaignService.getOverallStats();

        // Get template stats
        const templateStats = templateService.getStats();

        // Hot leads
        const hotLeads = scores.filter(s => s.tier === 'DIAMOND' || s.tier === 'GOLD').slice(0, 5);

        // Average scores
        const avgScore = scores.length > 0
            ? Math.round(scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length)
            : 0;

        res.json({
            success: true,
            dashboard: {
                totalLeads: scores.length,
                avgScore,
                tierCounts,
                hotLeads,
                campaignStats,
                templateStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

export default router;
