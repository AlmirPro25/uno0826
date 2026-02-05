/**
 * 🧠 COGNITIVE CONTROLLER
 * API para os serviços de Hiper-Cognição do Ghost Protocol
 */

import { Request, Response } from 'express';
import { StyleExtractorService } from '../services/style-extractor.service';
import { MemoryService } from '../services/memory.service';
import { ObjectionLearnerService } from '../services/objection-learner.service';
import { LogRepository } from '../repositories/log.repository';

const styleExtractor = new StyleExtractorService();
const memoryService = new MemoryService();
const objectionLearner = new ObjectionLearnerService();
const logRepo = new LogRepository();

export class CognitiveController {

    /**
     * GET /cognitive/style
     * Retorna o DNA de estilo do operador
     */
    static async getOperatorStyle(req: Request, res: Response) {
        try {
            const style = await styleExtractor.getOperatorStyle();
            res.json({ success: true, style });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /cognitive/style/extract
     * Força extração do DNA de estilo
     */
    static async extractStyle(req: Request, res: Response) {
        try {
            logRepo.create('INFO', 'STYLE_EXTRACTION_REQUESTED', 'Manual style extraction triggered', undefined);
            const style = await styleExtractor.extractOperatorDNA(200);
            res.json({
                success: true,
                message: 'Style DNA extracted successfully',
                style
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /cognitive/style/prompt
     * Retorna o prompt de estilo para injeção
     */
    static async getStylePrompt(req: Request, res: Response) {
        try {
            const prompt = await styleExtractor.generateStylePrompt();
            res.json({ success: true, prompt });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /cognitive/memory/daily-summary
     * Gera resumo diário
     */
    static async generateDailySummary(req: Request, res: Response) {
        try {
            const { date } = req.body;
            const targetDate = date ? new Date(date) : new Date();

            logRepo.create('INFO', 'DAILY_SUMMARY_REQUESTED', `Generating summary for ${targetDate.toISOString()}`, undefined);
            const summary = await memoryService.generateDailySummary(targetDate);

            res.json({
                success: true,
                message: 'Daily summary generated',
                summary
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /cognitive/memory/contact/:contactId
     * Gera perfil profundo de um contato
     */
    static async getContactProfile(req: Request, res: Response) {
        try {
            const { contactId } = req.params;
            const profile = await memoryService.generateContactProfile(contactId);

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Contact not found' });
            }

            res.json({ success: true, profile });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /cognitive/memory/relevant/:contactId
     * Retorna memórias relevantes para uma conversa
     */
    static async getRelevantMemories(req: Request, res: Response) {
        try {
            const { contactId } = req.params;
            const memories = await memoryService.getRelevantMemories(contactId);
            res.json({ success: true, memories });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /cognitive/objections/learn
     * Força análise e aprendizado de objeções
     */
    static async learnObjections(req: Request, res: Response) {
        try {
            logRepo.create('INFO', 'OBJECTION_LEARNING_REQUESTED', 'Manual objection learning triggered', undefined);
            const learned = await objectionLearner.analyzeAndLearn();

            res.json({
                success: true,
                message: `Learned from ${learned} objection interactions`,
                patternsLearned: learned
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /cognitive/objections/prompt
     * Retorna prompt de técnicas de objeção
     */
    static async getObjectionPrompt(req: Request, res: Response) {
        try {
            const prompt = await objectionLearner.generateObjectionPrompt();
            res.json({ success: true, prompt });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /cognitive/objections/detect
     * Detecta se uma mensagem é uma objeção
     */
    static async detectObjection(req: Request, res: Response) {
        try {
            const { message, intimacyLevel = 50 } = req.body;

            if (!message) {
                return res.status(400).json({ success: false, error: 'Message is required' });
            }

            const detection = objectionLearner.detectObjection(message);

            let bestResponse = null;
            if (detection.isObjection) {
                bestResponse = await objectionLearner.getBestResponse(message, intimacyLevel);
            }

            res.json({
                success: true,
                detection,
                bestResponse
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /cognitive/objections/:patternId/success
     * Marca um padrão de objeção como bem-sucedido (feedback loop)
     */
    static async markObjectionSuccess(req: Request, res: Response) {
        try {
            const { patternId } = req.params;
            await objectionLearner.markSuccess(patternId);

            res.json({
                success: true,
                message: 'Pattern marked as successful'
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * GET /cognitive/dashboard
     * Dashboard completo do sistema cognitivo
     */
    static async getCognitiveDashboard(req: Request, res: Response) {
        try {
            const [style, stylePrompt, objectionPrompt] = await Promise.all([
                styleExtractor.getOperatorStyle(),
                styleExtractor.generateStylePrompt(),
                objectionLearner.generateObjectionPrompt()
            ]);

            res.json({
                success: true,
                dashboard: {
                    operatorStyle: style,
                    stylePromptActive: !!stylePrompt,
                    objectionSystemActive: !!objectionPrompt,
                    capabilities: {
                        styleMimicry: !!style,
                        longTermMemory: true,
                        objectionHandling: true,
                        emotionalAdaptation: true
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }
}
