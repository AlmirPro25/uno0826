import { Router } from 'express';
import { memoryService } from '../services/memoryService.js';

const router = Router();

// Adicionar memória
router.post('/', async (req, res) => {
  try {
    const { content, type, importance, tags } = req.body;
    const id = await memoryService.addMemory(content, type, importance, tags);
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar memórias
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    
    const memories = await memoryService.searchMemories(query, limit);
    res.json(memories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Extrair fatos de conversa
router.post('/extract-facts', async (req, res) => {
  try {
    const { conversation } = req.body;
    await memoryService.extractAndStoreFactsFromConversation(conversation);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Estatísticas
router.get('/stats', (req, res) => {
  try {
    const stats = memoryService.getMemoryStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Limpar todas as memórias
router.delete('/all', (req, res) => {
  try {
    memoryService.clearAllMemories();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
