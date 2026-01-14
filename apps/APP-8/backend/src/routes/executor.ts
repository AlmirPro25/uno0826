import { Router, Request, Response } from 'express';
import { executorService } from '../services/executorService';

const router = Router();

/**
 * GET /api/executor/status
 * Verifica status da conexão com o Executor
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const connected = executorService.connected;
    
    if (connected) {
      const screenInfo = await executorService.getScreenInfo();
      res.json({
        connected: true,
        screen: screenInfo.screen,
        mouse: screenInfo.mouse,
      });
    } else {
      res.json({
        connected: false,
        message: 'Executor não está conectado',
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao verificar status do Executor',
      details: error.message,
    });
  }
});

/**
 * POST /api/executor/connect
 * Verifica conexão (o executor conecta automaticamente via WebSocket)
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const connected = executorService.connected;
    if (connected) {
      res.json({ success: true, message: 'Executor já está conectado' });
    } else {
      res.json({ 
        success: false, 
        message: 'Executor não está conectado. Inicie o módulo Python: cd executor && py executor.py' 
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao verificar conexão',
      details: error.message,
    });
  }
});

/**
 * POST /api/executor/disconnect
 * Para o executor
 */
router.post('/disconnect', async (req: Request, res: Response) => {
  try {
    await executorService.stop();
    res.json({ success: true, message: 'Comando de parada enviado ao Executor' });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao desconectar do Executor',
      details: error.message,
    });
  }
});

/**
 * POST /api/executor/mouse/move
 * Move o mouse
 */
router.post('/mouse/move', async (req: Request, res: Response) => {
  try {
    const { x, y, duration } = req.body;
    const result = await executorService.moveMouse(x, y, duration);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao mover mouse',
      details: error.message,
    });
  }
});

/**
 * POST /api/executor/mouse/click
 * Clica o mouse
 */
router.post('/mouse/click', async (req: Request, res: Response) => {
  try {
    const { button, x, y } = req.body;
    const result = await executorService.click(button, x, y);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao clicar mouse',
      details: error.message,
    });
  }
});

/**
 * POST /api/executor/keyboard/type
 * Digita texto
 */
router.post('/keyboard/type', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const result = await executorService.type(text);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao digitar texto',
      details: error.message,
    });
  }
});

/**
 * POST /api/executor/keyboard/press
 * Pressiona tecla
 */
router.post('/keyboard/press', async (req: Request, res: Response) => {
  try {
    const { key, presses } = req.body;
    const result = await executorService.press(key, presses);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao pressionar tecla',
      details: error.message,
    });
  }
});

/**
 * POST /api/executor/keyboard/hotkey
 * Executa atalho de teclado
 */
router.post('/keyboard/hotkey', async (req: Request, res: Response) => {
  try {
    const { keys } = req.body;
    const result = await executorService.hotkey(...keys);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao executar atalho',
      details: error.message,
    });
  }
});

/**
 * POST /api/executor/screen/screenshot
 * Captura screenshot
 */
router.post('/screen/screenshot', async (req: Request, res: Response) => {
  try {
    const { filename, region } = req.body;
    const result = await executorService.screenshot(filename, region);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao capturar screenshot',
      details: error.message,
    });
  }
});

/**
 * POST /api/executor/screen/scroll
 * Rola a página
 */
router.post('/screen/scroll', async (req: Request, res: Response) => {
  try {
    const { amount, x, y } = req.body;
    const result = await executorService.scroll(amount, x, y);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao rolar página',
      details: error.message,
    });
  }
});

/**
 * POST /api/executor/mouse/drag
 * Arrasta o mouse
 */
router.post('/mouse/drag', async (req: Request, res: Response) => {
  try {
    const { x, y, duration, button } = req.body;
    const result = await executorService.drag(x, y, duration, button);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao arrastar mouse',
      details: error.message,
    });
  }
});

/**
 * POST /api/executor/stop
 * Para o Executor (emergência)
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    const result = await executorService.stop();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao parar Executor',
      details: error.message,
    });
  }
});

export default router;
