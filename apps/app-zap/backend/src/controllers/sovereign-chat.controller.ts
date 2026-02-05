/**
 * 👑 SOVEREIGN CHAT CONTROLLER
 * API endpoints para o chat de controle com linguagem natural
 */

import { Request, Response } from 'express';
import { getSovereignChat, ChatMessage } from '../services/sovereign-chat.service';

const sovereignChat = getSovereignChat();

export class SovereignChatController {

    /**
     * POST /api/sovereign/chat
     * Envia mensagem para o chat e recebe resposta
     */
    static async chat(req: Request, res: Response) {
        try {
            const { message, sessionId } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: 'Message is required'
                });
            }

            // Use session ID from body or generate from request
            const effectiveSessionId = sessionId || req.ip || 'default';

            const response = await sovereignChat.chat(effectiveSessionId, message);

            res.json({
                success: true,
                data: response
            });
        } catch (error) {
            console.error('Sovereign Chat Error:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message
            });
        }
    }

    /**
     * GET /api/sovereign/history
     * Retorna histórico de chat de uma sessão
     */
    static async getHistory(req: Request, res: Response) {
        try {
            const sessionId = (req.query.sessionId as string) || req.ip || 'default';

            const history = sovereignChat.getHistory(sessionId);

            res.json({
                success: true,
                data: {
                    sessionId,
                    messages: history,
                    count: history.length
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: (error as Error).message
            });
        }
    }

    /**
     * DELETE /api/sovereign/session
     * Limpa sessão de chat
     */
    static async clearSession(req: Request, res: Response) {
        try {
            const sessionId = (req.query.sessionId as string) || req.ip || 'default';

            sovereignChat.clearSession(sessionId);

            res.json({
                success: true,
                message: `Session ${sessionId} cleared`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: (error as Error).message
            });
        }
    }

    /**
     * GET /api/sovereign/status
     * Status do serviço de chat
     */
    static async getStatus(req: Request, res: Response) {
        try {
            res.json({
                success: true,
                data: {
                    service: 'Sovereign Chat',
                    status: 'online',
                    version: '1.0.0',
                    capabilities: [
                        'CONTACTS - Gerenciar contatos',
                        'PERSONA - Modificar persona/IA',
                        'ABTESTS - Testes A/B',
                        'ANALYTICS - Métricas e relatórios',
                        'SYSTEM - Status do sistema',
                        'MEMORY - Memória e contexto'
                    ]
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: (error as Error).message
            });
        }
    }

    /**
     * POST /api/sovereign/quick-action
     * Executa ação rápida sem contexto de conversa
     */
    static async quickAction(req: Request, res: Response) {
        try {
            const { action, params } = req.body;

            // Map quick actions to natural language
            const actionMap: Record<string, string> = {
                'list_hot_contacts': 'lista contatos quentes',
                'list_cold_contacts': 'lista contatos frios',
                'get_status': 'status do sistema',
                'get_persona': 'mostra persona atual',
                'get_ab_winners': 'qual teste está ganhando',
                'sales_today': 'vendas de hoje',
                'mode_aggressive': 'modo agressivo',
                'mode_gentle': 'modo suave'
            };

            const message = actionMap[action] || action;
            const sessionId = `quick_${Date.now()}`;

            const response = await sovereignChat.chat(sessionId, message);
            sovereignChat.clearSession(sessionId);

            res.json({
                success: true,
                data: response
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: (error as Error).message
            });
        }
    }
}
