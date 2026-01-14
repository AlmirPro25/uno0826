import { Router, Request, Response } from 'express';
import { executorService } from '../services/executorService';

const router = Router();

/**
 * POST /api/browser/open
 * Abre o navegador Chromium
 */
router.post('/open', async (req: Request, res: Response) => {
  try {
    const { headless } = req.body;
    
    const result = await executorService.sendCommand({
      action: 'browser_open',
      params: { headless: headless || false }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao abrir navegador',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/close
 * Fecha o navegador
 */
router.post('/close', async (req: Request, res: Response) => {
  try {
    const result = await executorService.sendCommand({
      action: 'browser_close'
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao fechar navegador',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/navigate
 * Navega para URL
 */
router.post('/navigate', async (req: Request, res: Response) => {
  try {
    const { url, waitUntil } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }
    
    const result = await executorService.sendCommand({
      action: 'browser_goto',
      params: { url, wait_until: waitUntil }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao navegar',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/back
 * Volta para página anterior
 */
router.post('/back', async (req: Request, res: Response) => {
  try {
    const result = await executorService.sendCommand({
      action: 'browser_back'
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao voltar',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/forward
 * Avança para próxima página
 */
router.post('/forward', async (req: Request, res: Response) => {
  try {
    const result = await executorService.sendCommand({
      action: 'browser_forward'
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao avançar',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/refresh
 * Atualiza página atual
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const result = await executorService.sendCommand({
      action: 'browser_refresh'
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao atualizar',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/click
 * Clica em elemento
 */
router.post('/click', async (req: Request, res: Response) => {
  try {
    const { selector, timeout } = req.body;
    
    if (!selector) {
      return res.status(400).json({ error: 'Selector é obrigatório' });
    }
    
    const result = await executorService.sendCommand({
      action: 'browser_click',
      params: { selector, timeout }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao clicar',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/type
 * Digita texto em campo
 */
router.post('/type', async (req: Request, res: Response) => {
  try {
    const { selector, text, delay } = req.body;
    
    if (!selector || !text) {
      return res.status(400).json({ error: 'Selector e text são obrigatórios' });
    }
    
    const result = await executorService.sendCommand({
      action: 'browser_type',
      params: { selector, text, delay }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao digitar',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/press
 * Pressiona tecla
 */
router.post('/press', async (req: Request, res: Response) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Key é obrigatória' });
    }
    
    const result = await executorService.sendCommand({
      action: 'browser_press',
      params: { key }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao pressionar tecla',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/screenshot
 * Captura screenshot da página
 */
router.post('/screenshot', async (req: Request, res: Response) => {
  try {
    const { filename, fullPage } = req.body;
    
    const result = await executorService.sendCommand({
      action: 'browser_screenshot',
      params: { filename, full_page: fullPage }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao capturar screenshot',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/get-text
 * Extrai texto de elemento
 */
router.post('/get-text', async (req: Request, res: Response) => {
  try {
    const { selector } = req.body;
    
    if (!selector) {
      return res.status(400).json({ error: 'Selector é obrigatório' });
    }
    
    const result = await executorService.sendCommand({
      action: 'browser_get_text',
      params: { selector }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao extrair texto',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/wait-for
 * Aguarda elemento aparecer
 */
router.post('/wait-for', async (req: Request, res: Response) => {
  try {
    const { selector, timeout } = req.body;
    
    if (!selector) {
      return res.status(400).json({ error: 'Selector é obrigatório' });
    }
    
    const result = await executorService.sendCommand({
      action: 'browser_wait_for',
      params: { selector, timeout }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao aguardar elemento',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/fill-form
 * Preenche formulário com múltiplos campos
 */
router.post('/fill-form', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Data deve ser um objeto com selector: value' });
    }
    
    const result = await executorService.sendCommand({
      action: 'browser_fill_form',
      params: { data }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao preencher formulário',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/new-tab
 * Abre nova aba
 */
router.post('/new-tab', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    const result = await executorService.sendCommand({
      action: 'browser_new_tab',
      params: { url }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao abrir nova aba',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/switch-tab
 * Troca para aba específica
 */
router.post('/switch-tab', async (req: Request, res: Response) => {
  try {
    const { index } = req.body;
    
    if (typeof index !== 'number') {
      return res.status(400).json({ error: 'Index deve ser um número' });
    }
    
    const result = await executorService.sendCommand({
      action: 'browser_switch_tab',
      params: { index }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao trocar aba',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/close-tab
 * Fecha aba atual
 */
router.post('/close-tab', async (req: Request, res: Response) => {
  try {
    const result = await executorService.sendCommand({
      action: 'browser_close_tab'
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao fechar aba',
      details: error.message
    });
  }
});

/**
 * GET /api/browser/info
 * Retorna informações da página atual
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const result = await executorService.sendCommand({
      action: 'browser_info'
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao obter informações',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/extract-links
 * Extrai todos os links da página
 */
router.post('/extract-links', async (req: Request, res: Response) => {
  try {
    const result = await executorService.sendCommand({
      action: 'browser_extract_links'
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao extrair links',
      details: error.message
    });
  }
});

/**
 * POST /api/browser/pdf
 * Exporta página como PDF
 */
router.post('/pdf', async (req: Request, res: Response) => {
  try {
    const { filename } = req.body;
    
    const result = await executorService.sendCommand({
      action: 'browser_pdf',
      params: { filename }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao exportar PDF',
      details: error.message
    });
  }
});

export default router;
