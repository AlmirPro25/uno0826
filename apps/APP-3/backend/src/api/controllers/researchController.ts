/**
 * 🌐 RESEARCH CONTROLLER - API de Pesquisa Web
 * 
 * Endpoints para pesquisa na internet via backend
 * Resolve problemas de CORS e permite usar Playwright
 */

import { Request, Response } from 'express';
import { researchService, ResearchQuery, ResearchResult } from '../../core/services/ResearchService';

/**
 * POST /api/research/search
 * Pesquisa completa usando múltiplas fontes
 */
export async function search(req: Request, res: Response): Promise<void> {
  try {
    const query: ResearchQuery = {
      query: req.body.query,
      sources: req.body.sources,
      maxResults: req.body.maxResults || 10,
      language: req.body.language || 'en',
      includeCode: req.body.includeCode ?? true,
      includeNews: req.body.includeNews ?? false,
      includePapers: req.body.includePapers ?? false,
      usePlaywright: req.body.usePlaywright ?? false
    };

    if (!query.query || query.query.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Query é obrigatória'
      });
      return;
    }

    console.log(`🔍 [API] Pesquisa recebida: "${query.query}"`);

    const result: ResearchResult = await researchService.research(query);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Erro na pesquisa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao executar pesquisa',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * GET /api/research/wikipedia/:query
 * Pesquisa rápida na Wikipedia
 */
export async function searchWikipedia(req: Request, res: Response): Promise<void> {
  try {
    const query = req.params.query;
    const lang = (req.query.lang as string) || 'en';

    if (!query) {
      res.status(400).json({ success: false, error: 'Query é obrigatória' });
      return;
    }

    const packets = await researchService['searchWikipedia'](query, lang);

    res.json({
      success: true,
      data: packets
    });

  } catch (error) {
    console.error('❌ Erro Wikipedia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao pesquisar Wikipedia'
    });
  }
}

/**
 * GET /api/research/arxiv/:query
 * Pesquisa papers no ArXiv
 */
export async function searchArXiv(req: Request, res: Response): Promise<void> {
  try {
    const query = req.params.query;
    const maxResults = parseInt(req.query.max as string) || 5;

    if (!query) {
      res.status(400).json({ success: false, error: 'Query é obrigatória' });
      return;
    }

    const packets = await researchService['searchArXiv'](query, maxResults);

    res.json({
      success: true,
      data: packets
    });

  } catch (error) {
    console.error('❌ Erro ArXiv:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao pesquisar ArXiv'
    });
  }
}

/**
 * GET /api/research/github/:query
 * Pesquisa repositórios no GitHub
 */
export async function searchGitHub(req: Request, res: Response): Promise<void> {
  try {
    const query = req.params.query;
    const maxResults = parseInt(req.query.max as string) || 5;

    if (!query) {
      res.status(400).json({ success: false, error: 'Query é obrigatória' });
      return;
    }

    const packets = await researchService['searchGitHub'](query, maxResults);

    res.json({
      success: true,
      data: packets
    });

  } catch (error) {
    console.error('❌ Erro GitHub:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao pesquisar GitHub'
    });
  }
}

/**
 * GET /api/research/stackoverflow/:query
 * Pesquisa Q&A no Stack Overflow
 */
export async function searchStackOverflow(req: Request, res: Response): Promise<void> {
  try {
    const query = req.params.query;
    const maxResults = parseInt(req.query.max as string) || 5;

    if (!query) {
      res.status(400).json({ success: false, error: 'Query é obrigatória' });
      return;
    }

    const packets = await researchService['searchStackOverflow'](query, maxResults);

    res.json({
      success: true,
      data: packets
    });

  } catch (error) {
    console.error('❌ Erro Stack Overflow:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao pesquisar Stack Overflow'
    });
  }
}

/**
 * GET /api/research/hackernews/:query
 * Pesquisa notícias no Hacker News
 */
export async function searchHackerNews(req: Request, res: Response): Promise<void> {
  try {
    const query = req.params.query;

    if (!query) {
      res.status(400).json({ success: false, error: 'Query é obrigatória' });
      return;
    }

    const packets = await researchService['searchHackerNews'](query);

    res.json({
      success: true,
      data: packets
    });

  } catch (error) {
    console.error('❌ Erro Hacker News:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao pesquisar Hacker News'
    });
  }
}

/**
 * GET /api/research/status
 * Status do serviço de pesquisa
 */
export async function getStatus(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    data: {
      service: 'ResearchService',
      version: '1.0.0',
      playwrightAvailable: researchService.isPlaywrightAvailable(),
      apis: [
        { name: 'Wikipedia', status: 'active' },
        { name: 'DuckDuckGo', status: 'active' },
        { name: 'Hacker News', status: 'active' },
        { name: 'ArXiv', status: 'active' },
        { name: 'GitHub', status: 'active' },
        { name: 'Stack Overflow', status: 'active' },
        { name: 'DEV.to', status: 'active' }
      ],
      timestamp: new Date().toISOString()
    }
  });
}
