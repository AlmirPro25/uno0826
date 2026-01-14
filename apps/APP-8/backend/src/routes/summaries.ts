import { Router } from 'express';
import { dailySummaryService } from '../services/dailySummaryService.js';

const router = Router();

// Criar resumo diário
router.post('/', async (req, res) => {
  try {
    const { date } = req.body;
    const summary = await dailySummaryService.createDailySummary(date);
    
    if (!summary) {
      return res.status(404).json({ error: 'Nenhuma sessão encontrada para esta data' });
    }
    
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar resumo de um dia
router.get('/:date', (req, res) => {
  try {
    const { date } = req.params;
    const summary = dailySummaryService.getDailySummary(date);
    
    if (!summary) {
      return res.status(404).json({ error: 'Resumo não encontrado' });
    }
    
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Listar resumos recentes
router.get('/', (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 30;
    const summaries = dailySummaryService.getRecentSummaries(limit);
    res.json(summaries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Análise semanal
router.get('/trends/weekly', async (req, res) => {
  try {
    const trends = await dailySummaryService.getWeeklyTrends();
    
    if (!trends) {
      return res.status(404).json({ error: 'Dados insuficientes para análise' });
    }
    
    res.json(trends);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
