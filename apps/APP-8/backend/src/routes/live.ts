import { Router, Request, Response } from 'express';
import { liveCommandService } from '../services/liveCommandService';
import { liveAgentService } from '../services/liveAgentService';
import { liveAgentWithTools } from '../services/liveAgentWithTools';

const router = Router();

/**
 * POST /api/live/message
 * Processa mensagem da live (voz ou chat) - MODO AGÊNTICO COM FUNCTION CALLING
 */
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { speaker, text, isUser, visualContext, useFunctionCalling } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Texto é obrigatório',
      });
    }

    // Usa function calling se solicitado (padrão: true)
    if (useFunctionCalling !== false) {
      console.log('🤖 Usando FUNCTION CALLING do Gemini');
      const result = await liveAgentWithTools.processCommand(text);
      
      res.json({
        success: result.success,
        response: result.response,
        acted: result.toolsUsed.length > 0,
        toolsUsed: result.toolsUsed,
        mode: 'function_calling'
      });
    } else {
      // Modo antigo (agêntico manual)
      console.log('🧠 Usando modo agêntico manual');
      const result = await liveAgentService.processRealtimeMessage(
        speaker || 'Usuário',
        text,
        isUser !== false,
        visualContext
      );

      res.json({
        success: true,
        response: result.response,
        acted: result.acted,
        action: result.action,
        mode: 'manual'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao processar mensagem',
      details: error.message,
    });
  }
});

/**
 * POST /api/live/command
 * Executa comando direto (sem detecção)
 */
router.post('/command', async (req: Request, res: Response) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({
        error: 'Comando é obrigatório',
      });
    }

    const detection = {
      isCommand: true,
      command,
      confidence: 1.0,
      type: 'action' as const,
    };

    const result = await liveCommandService.processCommand(detection);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao executar comando',
      details: error.message,
    });
  }
});

/**
 * GET /api/live/status
 * Verifica se está executando algo
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const context = liveAgentService.getContext();
    res.json({
      executing: liveAgentService.isExecuting,
      recentMessages: context.recentMessages.slice(-10),
      currentScreen: context.currentScreen?.description || null,
      lastAction: context.lastAction,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao verificar status',
      details: error.message,
    });
  }
});

/**
 * GET /api/live/history
 * Obtém histórico de comandos
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const context = liveAgentService.getContext();
    res.json({
      success: true,
      history: context.recentMessages,
      total: context.recentMessages.length,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao obter histórico',
      details: error.message,
    });
  }
});

/**
 * POST /api/live/update-visual
 * Atualiza contexto visual manualmente
 */
router.post('/update-visual', async (req: Request, res: Response) => {
  try {
    await liveAgentService.updateVisualContext(true);
    const context = liveAgentService.getContext();
    
    res.json({
      success: true,
      screen: context.currentScreen,
      updated: context.lastScreenUpdate,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao atualizar contexto visual',
      details: error.message,
    });
  }
});

export default router;
