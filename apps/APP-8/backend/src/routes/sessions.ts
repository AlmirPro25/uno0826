import { Router } from 'express';
import { sessionService } from '../services/sessionService.js';

const router = Router();

// Criar nova sessão
router.post('/', (req, res) => {
  try {
    const sessionId = sessionService.createSession();
    res.json({ success: true, sessionId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Adicionar mensagem
router.post('/:sessionId/messages', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { speaker, text } = req.body;
    
    sessionService.addMessage(Number(sessionId), speaker, text);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar sessão específica
router.get('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionService.getSession(Number(sessionId));
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todas as sessões
router.get('/', (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const sessions = sessionService.getAllSessions(limit);
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resumir sessão
router.post('/:sessionId/summarize', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const summary = await sessionService.summarizeSession(Number(sessionId));
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar sessão
router.delete('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    sessionService.deleteSession(Number(sessionId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Limpar sessões antigas
router.post('/cleanup', (req, res) => {
  try {
    const keepCount = req.body.keepCount || 50;
    const deleted = sessionService.deleteOldSessions(keepCount);
    res.json({ success: true, deleted });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
