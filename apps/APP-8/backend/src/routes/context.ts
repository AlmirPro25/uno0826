import { Router } from 'express';
import { contextBuilder } from '../services/contextBuilder.js';

const router = Router();

// Buscar System Instruction completo para Gemini Live
router.get('/system-instruction', async (req, res) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : 1;
    const instruction = await contextBuilder.buildLiveSystemInstruction(userId);
    res.json({ instruction });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Adicionar ao contexto de curto prazo
router.post('/short-term', (req, res) => {
  try {
    const { content, relevanceScore } = req.body;
    contextBuilder.addToShortTermContext(content, relevanceScore || 1.0);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar perfil baseado em conversa
router.post('/update-profile', async (req, res) => {
  try {
    const { conversation } = req.body;
    await contextBuilder.updateProfileFromConversation(conversation);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar contexto relevante para uma query
router.post('/relevant', async (req, res) => {
  try {
    const { query, limit } = req.body;
    const context = await contextBuilder.getRelevantContext(query, limit || 3);
    res.json({ context });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
