/**
 * 📊 ANALYTICS CONTROLLER
 * API para métricas e análises do Ghost Protocol
 */

import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { LogRepository } from '../repositories/log.repository';

const analyticsService = new AnalyticsService();
const logRepo = new LogRepository();

export class AnalyticsController {

    /**
     * GET /analytics/today
     * Métricas do dia atual
     */
    static async getTodayMetrics(req: Request, res: Response) {
        try {
            const metrics = await analyticsService.getTodayMetrics();
            res.json({ success: true, metrics });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /analytics/conversion
     * Métricas de conversão
     */
    static async getConversionMetrics(req: Request, res: Response) {
        try {
            const metrics = await analyticsService.getConversionMetrics();
            res.json({ success: true, metrics });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /analytics/performance
     * Métricas de performance do sistema
     */
    static async getPerformanceMetrics(req: Request, res: Response) {
        try {
            const metrics = await analyticsService.getPerformanceMetrics();
            res.json({ success: true, metrics });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /analytics/contacts/ranking
     * Ranking de contatos mais valiosos
     */
    static async getContactRanking(req: Request, res: Response) {
        try {
            const { limit = 10 } = req.query;
            const ranking = await analyticsService.getContactRanking(Number(limit));
            res.json({ success: true, ranking, count: ranking.length });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /analytics/peak-hours
     * Horários de pico de atividade
     */
    static async getPeakHours(req: Request, res: Response) {
        try {
            const peakHours = await analyticsService.getPeakHours();
            res.json({ success: true, peakHours });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /analytics/keywords
     * Palavras mais frequentes
     */
    static async getTopKeywords(req: Request, res: Response) {
        try {
            const { limit = 20 } = req.query;
            const keywords = await analyticsService.getTopKeywords(Number(limit));
            res.json({ success: true, keywords, count: keywords.length });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /analytics/dashboard
     * Dashboard completo de analytics
     */
    static async getFullDashboard(req: Request, res: Response) {
        try {
            const dashboard = await analyticsService.getFullDashboard();
            res.json({ success: true, dashboard });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /analytics/export
     * Exporta métricas para JSON
     */
    static async exportMetrics(req: Request, res: Response) {
        try {
            const jsonData = await analyticsService.exportMetrics();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=ghost-protocol-metrics-${new Date().toISOString().split('T')[0]}.json`);
            res.send(jsonData);
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }
}
