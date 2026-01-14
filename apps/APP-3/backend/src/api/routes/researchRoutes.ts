/**
 * 🌐 RESEARCH ROUTES - Rotas de Pesquisa Web
 * 
 * Endpoints:
 * - POST /api/research/search - Pesquisa completa
 * - GET /api/research/wikipedia/:query - Wikipedia
 * - GET /api/research/arxiv/:query - ArXiv (papers)
 * - GET /api/research/github/:query - GitHub
 * - GET /api/research/stackoverflow/:query - Stack Overflow
 * - GET /api/research/hackernews/:query - Hacker News
 * - GET /api/research/status - Status do serviço
 */

import { Router } from 'express';
import * as researchController from '../controllers/researchController';

const router = Router();

// Pesquisa completa (POST para body maior)
router.post('/search', researchController.search);

// APIs individuais (GET para simplicidade)
router.get('/wikipedia/:query', researchController.searchWikipedia);
router.get('/arxiv/:query', researchController.searchArXiv);
router.get('/github/:query', researchController.searchGitHub);
router.get('/stackoverflow/:query', researchController.searchStackOverflow);
router.get('/hackernews/:query', researchController.searchHackerNews);

// Status
router.get('/status', researchController.getStatus);

export default router;
