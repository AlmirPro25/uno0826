/**
 * 🤖 PROX AI STUDIO - BACKEND LIMPO
 * 
 * Backend apenas para chat com IA
 * SEM automação de PC
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { browserService } from './services/browserService.js';
import { initializeNavigatorAgent, getNavigatorAgent } from './services/navigatorAgentService.js';
import { massiveParallelSearch, massiveSearchFormatted } from './services/massiveSearchService.js';
import { intelligentSearchAndNavigate, synthesizeResults } from './services/visionNavigatorService.js';
import { navigateAndInteract } from './services/interactionService.js';
import { productSearch } from './services/productSearchService.js';
import contentAnalyzerService from './services/contentAnalyzerService.js';
import { searchImages } from './services/imageSearchService.js';
import { remoteBrowserService } from './services/remoteBrowserService.js';
import orchestrator from './services/intelligentNavigatorOrchestrator.js';

dotenv.config();

const PORT = process.env.PORT || 3002;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// ==================== WEB SEARCH ROUTES (SEM DUCKDUCKGO) ====================

// Busca na Wikipedia
app.post('/api/search/wikipedia', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('📚 Buscando na Wikipedia:', query);

    const wikiResponse = await fetch(
      `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=10`
    );
    const wikiData = await wikiResponse.json();

    const results = [];
    if (wikiData.query && wikiData.query.search) {
      wikiData.query.search.forEach((item) => {
        results.push({
          title: item.title,
          snippet: item.snippet.replace(/<[^>]*>/g, ''),
          url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
          source: 'Wikipedia'
        });
      });
    }

    console.log(`✅ Wikipedia: ${results.length} resultados`);
    res.json({ query, results });

  } catch (error) {
    console.error('❌ Erro Wikipedia:', error);
    res.status(500).json({ error: error.message, results: [] });
  }
});

// Busca no Startpage (via Playwright)
app.post('/api/browser/search-startpage', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('🔍 Buscando no Startpage:', query);

    // Criar sessão temporária
    const sessionId = `startpage_${Date.now()}`;
    await browserService.createSession(sessionId);

    try {
      // Navegar para Startpage
      const url = `https://www.startpage.com/do/search?q=${encodeURIComponent(query)}`;
      await browserService.navigate(sessionId, url, { timeout: 30000 });

      // Aguardar resultados carregarem
      await browserService.waitForLoadState(sessionId, 'networkidle');

      // Extrair resultados
      const results = await browserService.extractStructured(sessionId, 'results');

      // Fechar sessão
      await browserService.closeSession(sessionId);

      console.log(`✅ Startpage: ${results.length} resultados`);
      res.json({ query, results: results.map(r => ({ ...r, source: 'Startpage' })) });

    } catch (error) {
      await browserService.closeSession(sessionId);
      throw error;
    }

  } catch (error) {
    console.error('❌ Erro Startpage:', error);
    res.status(500).json({ error: error.message, results: [] });
  }
});

// Busca no Bing (via Playwright)
app.post('/api/browser/search-bing', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('🔍 Buscando no Bing:', query);

    // Criar sessão temporária
    const sessionId = `bing_${Date.now()}`;
    await browserService.createSession(sessionId);

    try {
      // Navegar para Bing
      const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
      await browserService.navigate(sessionId, url, { timeout: 30000 });

      // Aguardar resultados carregarem
      await browserService.waitForLoadState(sessionId, 'networkidle');

      // Extrair resultados
      const results = await browserService.extractStructured(sessionId, 'results');

      // Fechar sessão
      await browserService.closeSession(sessionId);

      console.log(`✅ Bing: ${results.length} resultados`);
      res.json({ query, results: results.map(r => ({ ...r, source: 'Bing' })) });

    } catch (error) {
      await browserService.closeSession(sessionId);
      throw error;
    }

  } catch (error) {
    console.error('❌ Erro Bing:', error);
    res.status(500).json({ error: error.message, results: [] });
  }
});

// Busca de clima/tempo
app.post('/api/weather', async (req, res) => {
  try {
    const { location } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    console.log('🌤️ Buscando clima para:', location);

    // Criar sessão temporária
    const sessionId = `weather_${Date.now()}`;
    await browserService.createSession(sessionId);

    try {
      // Buscar no Climatempo (site brasileiro confiável)
      const searchQuery = `clima ${location} hoje previsão`;
      const url = `https://www.climatempo.com.br/`;

      await browserService.navigate(sessionId, url, { timeout: 30000 });
      await browserService.waitForLoadState(sessionId, 'networkidle');

      // Extrair conteúdo
      const content = await browserService.extractContent(sessionId);

      // Fechar sessão
      await browserService.closeSession(sessionId);

      // Criar resultado formatado
      const results = [{
        title: `Clima em ${location}`,
        snippet: content.text.substring(0, 500),
        url: `https://www.climatempo.com.br/`,
        source: 'Climatempo'
      }];

      console.log(`✅ Clima: ${results.length} resultados`);
      res.json({ location, results });

    } catch (error) {
      await browserService.closeSession(sessionId);
      throw error;
    }

  } catch (error) {
    console.error('❌ Erro ao buscar clima:', error);
    res.status(500).json({ error: error.message, results: [] });
  }
});

// Busca de notícias
app.post('/api/news', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('📰 Buscando notícias:', query);

    // Criar sessão temporária
    const sessionId = `news_${Date.now()}`;
    await browserService.createSession(sessionId);

    try {
      // Buscar no G1 (portal de notícias brasileiro)
      const searchUrl = `https://g1.globo.com/busca/?q=${encodeURIComponent(query)}`;

      await browserService.navigate(sessionId, searchUrl, { timeout: 30000 });
      await browserService.waitForLoadState(sessionId, 'networkidle');

      // Extrair resultados
      const results = await browserService.extractStructured(sessionId, 'articles');

      // Fechar sessão
      await browserService.closeSession(sessionId);

      console.log(`✅ Notícias: ${results.length} resultados`);
      res.json({
        query,
        results: results.map(r => ({ ...r, source: 'G1' }))
      });

    } catch (error) {
      await browserService.closeSession(sessionId);
      throw error;
    }

  } catch (error) {
    console.error('❌ Erro ao buscar notícias:', error);
    res.status(500).json({ error: error.message, results: [] });
  }
});

// 🚀 BUSCA MASSIVA PARALELA (NOVO!)
app.post('/api/search/massive', async (req, res) => {
  try {
    const { query, maxSites, timeout } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🚀 BUSCA MASSIVA: "${query}"`);

    const result = await massiveParallelSearch(query, {
      maxSites: maxSites || 10,
      timeout: timeout || 60000,
      includeFailures: true,
    });

    res.json(result);
  } catch (error) {
    console.error('❌ Erro na busca massiva:', error);
    res.status(500).json({ error: error.message, results: [] });
  }
});

// 🖼️ BUSCA DE IMAGENS
app.post('/api/search/images', async (req, res) => {
  try {
    const { query, maxResults = 6 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🖼️ Buscando imagens: "${query}" (max: ${maxResults})`);

    const images = await searchImages(query, maxResults);

    res.json({
      success: true,
      query,
      images,
      total: images.length
    });

  } catch (error) {
    console.error('❌ Erro na busca de imagens:', error);
    res.status(500).json({ error: error.message, images: [] });
  }
});

// Busca inteligente (múltiplas fontes) - MELHORADA
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('🧠 Busca inteligente:', query);

    const allResults = [];
    const sources = [];

    // Detectar se é notícia ou clima
    const lowerQuery = query.toLowerCase();
    const isNews = lowerQuery.includes('notícia') || lowerQuery.includes('acontecendo') ||
      lowerQuery.includes('hoje') || lowerQuery.includes('mortos') ||
      lowerQuery.includes('operação');
    const isWeather = lowerQuery.includes('clima') || lowerQuery.includes('tempo') ||
      lowerQuery.includes('temperatura') || lowerQuery.includes('chuva');

    console.log(`📊 Tipo detectado: ${isNews ? 'NOTÍCIAS' : isWeather ? 'CLIMA' : 'GERAL'}`);

    // Buscar em paralelo em todas as fontes apropriadas
    const searchPromises = [];

    // Se for notícia, priorizar G1 e sites de notícias
    if (isNews) {
      console.log('📰 Buscando notícias em tempo real...');

      // Buscar no G1 via Playwright
      searchPromises.push(
        (async () => {
          try {
            const sessionId = `news_${Date.now()}`;
            await browserService.createSession(sessionId);

            // Buscar no G1
            const searchUrl = `https://g1.globo.com/busca/?q=${encodeURIComponent(query)}`;
            await browserService.navigate(sessionId, searchUrl, { timeout: 30000 });
            await browserService.waitForLoadState(sessionId, 'networkidle');

            // Extrair conteúdo
            const content = await browserService.extractContent(sessionId);
            await browserService.closeSession(sessionId);

            // Processar resultados
            const results = [];
            const lines = content.text.split('\n').filter(l => l.trim().length > 20);

            for (let i = 0; i < Math.min(lines.length, 10); i++) {
              if (lines[i].length > 30) {
                results.push({
                  title: lines[i].substring(0, 100),
                  snippet: lines[i].substring(0, 200),
                  url: searchUrl,
                  source: 'G1'
                });
              }
            }

            return { results, source: 'G1' };
          } catch (error) {
            console.error('Erro G1:', error.message);
            return { results: [], source: 'G1' };
          }
        })()
      );
    }

    // Se for clima, buscar em sites de clima
    if (isWeather) {
      console.log('🌤️ Buscando informações de clima...');

      searchPromises.push(
        (async () => {
          try {
            const sessionId = `weather_${Date.now()}`;
            await browserService.createSession(sessionId);

            // Buscar no Climatempo
            await browserService.navigate(sessionId, 'https://www.climatempo.com.br/', { timeout: 30000 });
            await browserService.waitForLoadState(sessionId, 'networkidle');

            const content = await browserService.extractContent(sessionId);
            await browserService.closeSession(sessionId);

            const results = [{
              title: 'Climatempo - Previsão do Tempo',
              snippet: content.text.substring(0, 300),
              url: 'https://www.climatempo.com.br/',
              source: 'Climatempo'
            }];

            return { results, source: 'Climatempo' };
          } catch (error) {
            console.error('Erro Climatempo:', error.message);
            return { results: [], source: 'Climatempo' };
          }
        })()
      );
    }

    // Sempre buscar no Startpage (resultados do Google)
    searchPromises.push(
      (async () => {
        try {
          const sessionId = `startpage_${Date.now()}`;
          await browserService.createSession(sessionId);

          const url = `https://www.startpage.com/do/search?q=${encodeURIComponent(query)}`;
          await browserService.navigate(sessionId, url, { timeout: 30000 });
          await browserService.waitForLoadState(sessionId, 'networkidle');

          const results = await browserService.extractStructured(sessionId, 'results');
          await browserService.closeSession(sessionId);

          return {
            results: results.map(r => ({ ...r, source: 'Startpage' })),
            source: 'Startpage'
          };
        } catch (error) {
          console.error('Erro Startpage:', error.message);
          return { results: [], source: 'Startpage' };
        }
      })()
    );

    // Wikipedia como fallback
    searchPromises.push(
      fetch('http://localhost:3002/api/search/wikipedia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      }).then(r => r.json()).then(data => ({
        results: data.results || [],
        source: 'Wikipedia'
      })).catch(() => ({ results: [], source: 'Wikipedia' }))
    );

    // Aguardar todas as buscas
    const results = await Promise.allSettled(searchPromises);

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.results && result.value.results.length > 0) {
        allResults.push(...result.value.results);
        if (!sources.includes(result.value.source)) {
          sources.push(result.value.source);
        }
      }
    });

    // Remover duplicatas
    const uniqueResults = Array.from(
      new Map(allResults.map(r => [r.url || r.title, r])).values()
    );

    console.log(`✅ ${uniqueResults.length} resultados de ${sources.join(', ')}`);
    res.json({ query, results: uniqueResults, sources });

  } catch (error) {
    console.error('❌ Erro na busca:', error);
    res.status(500).json({ error: error.message, results: [], sources: [] });
  }
});

// ==================== PRODUCT SEARCH ROUTES ====================

// ==================== BROWSER SERVICE ====================

// Inicializar agentes de navegação
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (GEMINI_API_KEY) {
  initializeNavigatorAgent(GEMINI_API_KEY);
  console.log('🤖 Navigator Agents inicializados');
} else {
  console.warn('⚠️ GEMINI_API_KEY não encontrada - Agentes de navegação desabilitados');
}

app.post('/api/products/search', async (req, res) => {
  try {
    const { query, country, limit, forceRefresh } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query é obrigatória' });
    }

    console.log(`🛒 Buscando produtos: "${query}"`);

    const results = await productSearch.search(query, {
      country: country || 'brasil',
      limit: limit || 20,
      forceRefresh: forceRefresh || false
    });

    res.json(results);
  } catch (error) {
    console.error('❌ Erro na busca de produtos:', error);
    res.status(500).json({
      error: error.message,
      products: [],
      sources: []
    });
  }
});

app.post('/api/products/info', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query é obrigatória' });
    }

    const info = await productSearch.searchInfo(query);
    res.json({ query, info });
  } catch (error) {
    console.error('❌ Erro ao buscar informações:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar por código de barras
app.post('/api/products/barcode', async (req, res) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ error: 'Código de barras é obrigatório' });
    }

    console.log(`📦 Buscando produto por código de barras: ${barcode}`);

    const product = await productSearch.searchByBarcode(barcode);

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({ barcode, product });
  } catch (error) {
    console.error('❌ Erro ao buscar por código de barras:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar fontes disponíveis
app.get('/api/products/sources', (req, res) => {
  const sources = productSearch.getAvailableSources();
  res.json(sources);
});

app.get('/api/products/cache/stats', (req, res) => {
  const stats = productSearch.getCacheStats();
  res.json(stats);
});

app.post('/api/products/cache/clear', (req, res) => {
  productSearch.clearCache();
  res.json({ message: 'Cache limpo com sucesso' });
});

// ==================== BROWSER ROUTES ====================

// Criar sessão de navegação
app.post('/api/browser/session', async (req, res) => {
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await browserService.createSession(sessionId);

    res.json({
      sessionId,
      message: 'Sessão criada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar sessão:', error);
    res.status(500).json({ error: error.message });
  }
});

// Navegar para URL
app.post('/api/browser/navigate', async (req, res) => {
  try {
    const { sessionId, url, options } = req.body;

    if (!sessionId || !url) {
      return res.status(400).json({ error: 'sessionId e url são obrigatórios' });
    }

    const result = await browserService.navigate(sessionId, url, options);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao navegar:', error);
    res.status(500).json({ error: error.message });
  }
});

// Extrair conteúdo
app.post('/api/browser/extract', async (req, res) => {
  try {
    const { sessionId, options } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId é obrigatório' });
    }

    const content = await browserService.extractContent(sessionId, options);
    res.json(content);
  } catch (error) {
    console.error('❌ Erro ao extrair conteúdo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tirar screenshot
app.post('/api/browser/screenshot', async (req, res) => {
  try {
    const { sessionId, options } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId é obrigatório' });
    }

    const screenshot = await browserService.screenshot(sessionId, options);
    res.json({ screenshot });
  } catch (error) {
    console.error('❌ Erro ao tirar screenshot:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar no Google
app.post('/api/browser/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query é obrigatória' });
    }

    // Criar sessão temporária
    const sessionId = `temp_${Date.now()}`;
    await browserService.createSession(sessionId);

    // Buscar
    const results = await browserService.searchGoogle(sessionId, query);

    // Fechar sessão
    await browserService.closeSession(sessionId);

    res.json({ query, results });
  } catch (error) {
    console.error('❌ Erro ao buscar:', error);
    res.status(500).json({ error: error.message });
  }
});

// Executar script
app.post('/api/browser/execute', async (req, res) => {
  try {
    const { sessionId, script } = req.body;

    if (!sessionId || !script) {
      return res.status(400).json({ error: 'sessionId e script são obrigatórios' });
    }

    const result = await browserService.executeScript(sessionId, script);
    res.json({ result });
  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fechar sessão
app.post('/api/browser/close', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId é obrigatório' });
    }

    await browserService.closeSession(sessionId);
    res.json({ message: 'Sessão fechada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao fechar sessão:', error);
    res.status(500).json({ error: error.message });
  }
});

// Estatísticas
app.get('/api/browser/stats', (req, res) => {
  const stats = browserService.getStats();
  res.json(stats);
});

// ==================== AUTONOMOUS NAVIGATION ====================

// Navegação autônoma (Gemini decide onde ir)
app.post('/api/autonomous-navigate', async (req, res) => {
  try {
    const { url, what_to_extract, navigation_path } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    console.log('🤖 Navegação autônoma:', url);
    console.log('   Extrair:', what_to_extract);

    const sessionId = `autonomous_${Date.now()}`;
    await browserService.createSession(sessionId);

    try {
      // Navegar para URL
      await browserService.navigate(sessionId, url, { timeout: 30000 });
      await browserService.waitForLoadState(sessionId, 'networkidle');

      // Se há caminho de navegação, seguir
      if (navigation_path && navigation_path.length > 0) {
        console.log('   Seguindo caminho de navegação...');
        for (const step of navigation_path) {
          console.log(`   → ${step}`);
          // Aqui você pode implementar lógica para seguir links, etc.
        }
      }

      // Extrair conteúdo
      const content = await browserService.extractContent(sessionId, {
        includeText: true,
        includeLinks: true,
        includeImages: false
      });

      await browserService.closeSession(sessionId);

      console.log(`   ✅ Extraído: ${content.text?.length || 0} caracteres`);

      res.json({
        url,
        content,
        success: true
      });

    } catch (error) {
      await browserService.closeSession(sessionId);
      throw error;
    }

  } catch (error) {
    console.error('❌ Erro na navegação autônoma:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

// ==================== NAVIGATOR AGENTS ====================

// Processar intenção do usuário com agentes inteligentes
app.post('/api/navigator/process', async (req, res) => {
  try {
    const { userIntent, context } = req.body;

    if (!userIntent) {
      return res.status(400).json({ error: 'userIntent é obrigatório' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Agentes de navegação não disponíveis - API Key não configurada' });
    }

    console.log('🤖 Processando intenção:', userIntent);

    const agent = getNavigatorAgent();

    // Processar com callback de progresso via SSE
    const result = await agent.processUserIntent(userIntent, context || {});

    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao processar intenção:', error);
    res.status(500).json({ error: error.message });
  }
});

// Gerar plano de navegação
app.post('/api/navigator/plan', async (req, res) => {
  try {
    const { userIntent, context } = req.body;

    if (!userIntent) {
      return res.status(400).json({ error: 'userIntent é obrigatório' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Agentes de navegação não disponíveis - API Key não configurada' });
    }

    console.log('🧠 Gerando plano para:', userIntent);

    const agent = getNavigatorAgent();
    const result = await agent.generateNavigationPlan(userIntent, context || {});

    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao gerar plano:', error);
    res.status(500).json({ error: error.message });
  }
});

// Executar plano de navegação
app.post('/api/navigator/execute', async (req, res) => {
  try {
    const { plan, sessionId } = req.body;

    if (!plan) {
      return res.status(400).json({ error: 'plan é obrigatório' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Agentes de navegação não disponíveis - API Key não configurada' });
    }

    console.log('🚀 Executando plano:', plan.objective);

    const agent = getNavigatorAgent();
    const result = await agent.executePlan(plan, sessionId);

    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao executar plano:', error);
    res.status(500).json({ error: error.message });
  }
});

// Estatísticas dos agentes
app.get('/api/navigator/stats', (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Agentes de navegação não disponíveis' });
    }

    const agent = getNavigatorAgent();
    const stats = agent.getStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resetar estatísticas dos agentes
app.post('/api/navigator/stats/reset', (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Agentes de navegação não disponíveis' });
    }

    const agent = getNavigatorAgent();
    agent.resetStats();
    res.json({ message: 'Estatísticas resetadas com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao resetar estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== INTERACTION SERVICE ====================

// Navegar e interagir autonomamente
app.post('/api/interact', async (req, res) => {
  try {
    const { url, objective, maxSteps } = req.body;

    if (!url || !objective) {
      return res.status(400).json({ error: 'URL e objetivo são obrigatórios' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API Key não configurada' });
    }

    console.log(`🦾 Interação autônoma: ${url}`);
    console.log(`🎯 Objetivo: ${objective}`);

    const result = await navigateAndInteract(url, objective, {
      maxSteps: maxSteps || 10
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Erro na interação:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== VISION NAVIGATOR ====================

// Busca inteligente com análise visual
app.post('/api/vision/search', async (req, res) => {
  try {
    const { query, maxLinksToVisit } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query é obrigatória' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API Key não configurada' });
    }

    console.log(`👁️ Busca visual: "${query}"`);

    // Executar busca inteligente com visão
    const results = await intelligentSearchAndNavigate(query, {
      searchEngine: 'bing',
      maxLinksToVisit: maxLinksToVisit || 5
    });

    // Sintetizar resultados
    const synthesis = await synthesizeResults(query, results.successfulResults);

    res.json({
      query,
      searchResult: results.searchResult,
      navigationResults: results.navigationResults,
      successfulResults: results.successfulResults,
      synthesis,
      stats: {
        totalVisited: results.totalVisited,
        successCount: results.successCount
      }
    });

  } catch (error) {
    console.error('❌ Erro na busca visual:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'prox-ai-studio-backend',
    version: '1.0.0',
    automation: 'disabled',
    features: {
      chat: true,
      search: true,
      products: true
    }
  });
});

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ==================== NAVEGAÇÃO INTELIGENTE COM ANÁLISE ====================

/**
 * 🧠 Navegar e analisar com IA
 * Combina navegação + screenshot + análise inteligente + mídia rica
 */
app.post('/api/browser/navigate-smart', async (req, res) => {
  try {
    const { url, userIntent, apiKey } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    console.log('🧠 Navegação inteligente:', url);

    // 1. Criar sessão
    const sessionId = `smart_${Date.now()}`;
    await browserService.createSession(sessionId);

    // 2. Navegar
    await browserService.navigate(sessionId, url);

    // 3. Extrair conteúdo
    const content = await browserService.extractContent(sessionId);

    // 4. Tirar screenshot
    const screenshot = await browserService.takeScreenshot(sessionId);

    // 5. Analisar com IA (se API key fornecida)
    let analysis = null;
    let richMedia = [];
    
    if (apiKey) {
      try {
        await contentAnalyzerService.initialize(apiKey);
        analysis = await contentAnalyzerService.analyzePage(content, userIntent);
        richMedia = contentAnalyzerService.extractRichMedia(content, analysis);
      } catch (error) {
        console.warn('⚠️ Erro na análise IA:', error.message);
      }
    }

    // 6. Fechar sessão
    await browserService.closeSession(sessionId);

    // 7. Retornar resultado completo
    res.json({
      success: true,
      url,
      title: content.title,
      screenshot,
      content,
      analysis: analysis ? {
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        products: analysis.products,
        recommendation: analysis.recommendation
      } : null,
      richMedia,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Erro na navegação inteligente:', error);
    res.status(500).json({ 
      error: error.message,
      success: false
    });
  }
});

// ==================== REMOTE BROWSER SOCKET.IO ====================

io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  let currentSessionId = null;

  // Criar sessão de navegador remoto
  socket.on('browser:create', async (options, callback) => {
    try {
      const sessionId = `remote_${socket.id}_${Date.now()}`;
      currentSessionId = sessionId;

      const result = await remoteBrowserService.createSession(sessionId, options);
      
      // Iniciar streaming automaticamente
      remoteBrowserService.startStreaming(sessionId, socket, options.fps || 10);

      callback({ success: true, ...result });
    } catch (error) {
      console.error('❌ Erro ao criar sessão:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Processar input do usuário
  socket.on('browser:input', async (inputEvent) => {
    if (!currentSessionId) return;

    try {
      await remoteBrowserService.handleInput(currentSessionId, inputEvent);
    } catch (error) {
      console.error('❌ Erro ao processar input:', error);
      socket.emit('browser:error', { error: error.message });
    }
  });

  // Navegar para URL
  socket.on('browser:navigate', async (url, callback) => {
    if (!currentSessionId) {
      callback({ success: false, error: 'Nenhuma sessão ativa' });
      return;
    }

    try {
      const result = await remoteBrowserService.navigate(currentSessionId, url);
      callback(result);
    } catch (error) {
      console.error('❌ Erro ao navegar:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Executar JavaScript
  socket.on('browser:evaluate', async (script, callback) => {
    if (!currentSessionId) {
      callback({ success: false, error: 'Nenhuma sessão ativa' });
      return;
    }

    try {
      const result = await remoteBrowserService.evaluate(currentSessionId, script);
      callback({ success: true, result });
    } catch (error) {
      console.error('❌ Erro ao executar script:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Desconexão
  socket.on('disconnect', async () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
    
    if (currentSessionId) {
      await remoteBrowserService.closeSession(currentSessionId);
      currentSessionId = null;
    }
  });
});

// ==================== INTELLIGENT NAVIGATOR ORCHESTRATOR ====================

// Inicializar orchestrator
app.post('/api/orchestrator/initialize', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API Key é obrigatória' });
    }

    await orchestrator.initialize(apiKey);
    const stats = orchestrator.getStats();

    res.json({ 
      success: true, 
      message: 'Orchestrator inicializado',
      stats
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar orchestrator:', error);
    res.status(500).json({ error: error.message });
  }
});

// Processar pedido do usuário
app.post('/api/orchestrator/process', async (req, res) => {
  try {
    const { message, context, apiKey } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // Inicializar se necessário
    if (apiKey && !orchestrator.model) {
      await orchestrator.initialize(apiKey);
    }

    const result = await orchestrator.processAndExecute(message, context);

    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao processar pedido:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter estatísticas do orchestrator
app.get('/api/orchestrator/stats', (req, res) => {
  try {
    const stats = orchestrator.getStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao obter stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Limpar histórico de conversa
app.post('/api/orchestrator/clear', (req, res) => {
  try {
    orchestrator.clearHistory();
    res.json({ success: true, message: 'Histórico limpo' });
  } catch (error) {
    console.error('❌ Erro ao limpar histórico:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== VISUAL INTELLIGENT SEARCH ====================

import { visualIntelligentSearch } from './services/visualIntelligentSearch.js';

/**
 * 🔍👁️ BUSCA VISUAL INTELIGENTE
 * Sistema unificado: busca massiva + navegação + visão + síntese
 */
app.post('/api/search/visual-intelligent', async (req, res) => {
  try {
    const { query, maxSites = 5, timeout = 30000 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`\n🔍👁️ BUSCA VISUAL INTELIGENTE: "${query}"`);

    const result = await visualIntelligentSearch(query, {
      maxSites,
      timeout,
      apiKey: process.env.GEMINI_API_KEY
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        query
      });
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Erro na busca visual:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      query: req.body.query
    });
  }
});

// ==================== START SERVER ====================

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  🤖 PROX AI STUDIO - BACKEND LIMPO                    ║
╠════════════════════════════════════════════════════════╣
║  Status: ✅ Running                                    ║
║  Port: ${PORT}                                            ║
║  Frontend: ${FRONTEND_URL}                    ║
║                                                        ║
║  ⚠️  AUTOMAÇÃO DE PC: DESATIVADA                      ║
║  ✅  Chat com IA: ATIVO                               ║
║  ✅  Busca Web: ATIVO                                 ║
╚════════════════════════════════════════════════════════╝
  `);
});

export { app, server, io };


// ============================================
// ROTAS DE GERAÇÃO VISUAL
// ============================================
// ROTAS DE GERAÇÃO VISUAL - TEMPORARIAMENTE DESABILITADAS
// ============================================

// import imageGenerationService from './services/imageGenerationService.js';

// // Rota para gerar imagens
// app.post('/api/generate-images', async (req, res) => {
//   try {
//     const { query, context, count = 3 } = req.body;
//     
//     const images = await imageGenerationService.generateVisualComposition(
//       query,
//       context
//     );
//     
//     res.json({ images });
//   } catch (error) {
//     console.error('Erro ao gerar imagens:', error);
//     res.status(500).json({ error: 'Erro ao gerar imagens' });
//   }
// });

// // Rota para capturar screenshots
// app.post('/api/capture-screenshots', async (req, res) => {
//   try {
//     const { urls } = req.body;
//     
//     if (!urls || !Array.isArray(urls)) {
//       return res.status(400).json({ error: 'URLs inválidas' });
//     }
//     
//     const screenshots = [];
//     for (const url of urls.slice(0, 6)) {
//       try {
//         const screenshot = await imageGenerationService.captureScreenshot(url);
//         if (screenshot) {
//           screenshots.push({
//             id: `ss-${Date.now()}-${screenshots.length}`,
//             url: screenshot,
//             sourceUrl: url
//           });
//         }
//       } catch (error) {
//         console.error(`Erro ao capturar ${url}:`, error);
//       }
//     }
//     
//     res.json({ screenshots });
//   } catch (error) {
//     console.error('Erro ao capturar screenshots:', error);
//     res.status(500).json({ error: 'Erro ao capturar screenshots' });
//   }
// });

// // Rota para analisar imagem com Gemini Vision
// app.post('/api/analyze-image', async (req, res) => {
//   try {
//     const { imageUrl } = req.body;
//     
//     if (!imageUrl) {
//       return res.status(400).json({ error: 'URL da imagem não fornecida' });
//     }
//     
//     const analysis = await imageGenerationService.analyzeImage(imageUrl);
//     
//     res.json({ analysis });
//   } catch (error) {
//     console.error('Erro ao analisar imagem:', error);
//     res.status(500).json({ error: 'Erro ao analisar imagem' });
//   }
// });

// // Cleanup ao fechar servidor
// process.on('SIGINT', async () => {
//   console.log('Fechando servidor...');
//   await imageGenerationService.close();
//   process.exit(0);
// });
