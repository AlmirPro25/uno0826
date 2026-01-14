import { Router, Request, Response } from 'express';
import { geminiMaestro } from '../services/geminiMaestro';
import { visionService } from '../services/visionService';
import { taskPlanner } from '../services/taskPlanner';

const router = Router();

/**
 * POST /api/tasks/analyze-screen
 * Analisa tela em detalhes para o Gemini Live
 */
router.post('/analyze-screen', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Query é obrigatória',
      });
    }

    const analysis = await visionService.analyzeScreen(query);

    res.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao analisar tela',
      details: error.message,
    });
  }
});

/**
 * POST /api/tasks/execute
 * Executa tarefa complexa com visão e planejamento
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { command, userContext } = req.body;

    if (!command) {
      return res.status(400).json({
        error: 'Comando é obrigatório',
      });
    }

    const result = await geminiMaestro.executeComplexTask(command, userContext);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao executar tarefa',
      details: error.message,
    });
  }
});

/**
 * POST /api/tasks/plan
 * Cria plano de ação sem executar
 */
router.post('/plan', async (req: Request, res: Response) => {
  try {
    const { command, userContext } = req.body;

    if (!command) {
      return res.status(400).json({
        error: 'Comando é obrigatório',
      });
    }

    // Analisa tela
    const screenContext = await visionService.analyzeScreen(command);

    // Cria plano
    const plan = await taskPlanner.planTask(command, screenContext, userContext);

    res.json({
      success: true,
      plan,
      screenContext,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao criar plano',
      details: error.message,
    });
  }
});

/**
 * POST /api/tasks/execute-plan
 * Executa um plano previamente criado
 */
router.post('/execute-plan', async (req: Request, res: Response) => {
  try {
    const { plan } = req.body;

    if (!plan || !plan.steps) {
      return res.status(400).json({
        error: 'Plano inválido',
      });
    }

    const execution = await taskPlanner.executePlan(plan);

    res.json({
      success: execution.success,
      execution,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao executar plano',
      details: error.message,
    });
  }
});

/**
 * POST /api/tasks/analyze-screen
 * Analisa tela atual
 */
router.post('/analyze-screen', async (req: Request, res: Response) => {
  try {
    const { context } = req.body;

    const analysis = await visionService.analyzeScreen(context);

    res.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao analisar tela',
      details: error.message,
    });
  }
});

/**
 * POST /api/tasks/find-element
 * Encontra elemento específico na tela
 */
router.post('/find-element', async (req: Request, res: Response) => {
  try {
    const { elementDescription } = req.body;

    if (!elementDescription) {
      return res.status(400).json({
        error: 'Descrição do elemento é obrigatória',
      });
    }

    const result = await visionService.findElement(elementDescription);

    res.json({
      success: result.found,
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao buscar elemento',
      details: error.message,
    });
  }
});

/**
 * POST /api/tasks/verify-condition
 * Verifica se condição visual foi atendida
 */
router.post('/verify-condition', async (req: Request, res: Response) => {
  try {
    const { condition } = req.body;

    if (!condition) {
      return res.status(400).json({
        error: 'Condição é obrigatória',
      });
    }

    const result = await visionService.verifyCondition(condition);

    res.json({
      success: result.verified,
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao verificar condição',
      details: error.message,
    });
  }
});

/**
 * POST /api/tasks/extract-text
 * Extrai texto da tela (OCR)
 */
router.post('/extract-text', async (req: Request, res: Response) => {
  try {
    const { region } = req.body;

    const text = await visionService.extractText(region);

    res.json({
      success: true,
      text,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao extrair texto',
      details: error.message,
    });
  }
});

export default router;
