# 🛒 Arquitetura de Pesquisa de Produtos - Sistema Profissional

## 🎯 Objetivo

Criar um motor de pesquisa de produtos robusto, com múltiplas fontes, fallback automático e integração com LLM.

## 📊 Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (LLM Chat)                      │
│              "Encontre TV LG 27 polegadas"                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              API GATEWAY / ORQUESTRADOR                     │
│         (Gerencia prioridades e fallbacks)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   CAMADA 1   │  │   CAMADA 2   │  │   CAMADA 3   │
│  APIs        │  │  SERP APIs   │  │  Scrapers    │
│  Oficiais    │  │  (Busca)     │  │  (Fallback)  │
└──────────────┘  └──────────────┘  └──────────────┘
│                 │                 │
│ • MercadoLibre │ • SerpApi       │ • Apify       │
│ • Magalu       │ • Brave Search  │ • ScraperAPI  │
│ • AliExpress   │ • SearchAPI     │ • Puppeteer   │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CAMADA DE NORMALIZAÇÃO                         │
│    (Unifica formato, deduplica, ordena por preço)          │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  CACHE (Redis/Memory)                       │
│              (TTL: 1-6 horas por produto)                   │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  RESPOSTA PARA LLM                          │
│  {products: [...], sources: [...], timestamp: ...}         │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 APIs Recomendadas

### Camada 1: APIs Oficiais (Prioridade Máxima)

#### 1. Mercado Livre API
- **URL**: https://developers.mercadolivre.com.br
- **Cobertura**: Brasil, LATAM
- **Gratuito**: Sim (com limites)
- **Endpoints**:
  - `/sites/MLB/search?q=tv+lg` - Busca produtos
  - `/items/{id}` - Detalhes do produto
  - `/categories` - Categorias

#### 2. Magazine Luiza (Magalu Devs)
- **URL**: https://developers.magalu.com
- **Cobertura**: Brasil
- **Gratuito**: Sim (requer cadastro)
- **Endpoints**:
  - `/catalog/products/search` - Busca
  - `/catalog/products/{sku}` - Detalhes

#### 3. AliExpress Affiliate API
- **URL**: https://portals.aliexpress.com
- **Cobertura**: Global
- **Gratuito**: Sim (programa afiliados)
- **Endpoints**:
  - `/api/products/search` - Busca
  - `/api/products/details` - Detalhes

### Camada 2: SERP APIs (Fallback Rápido)

#### 1. SerpApi
- **URL**: https://serpapi.com
- **Free Tier**: 100 buscas/mês
- **Uso**: Google Shopping, Amazon, eBay
- **Endpoint**: `/search?engine=google_shopping&q=tv+lg`

#### 2. Brave Search API
- **URL**: https://brave.com/search/api/
- **Free Tier**: 2000 queries/mês
- **Uso**: Busca web geral
- **Endpoint**: `/v1/web/search?q=tv+lg+preço`

#### 3. SearchAPI
- **URL**: https://www.searchapi.io
- **Free Tier**: 100 buscas/mês
- **Uso**: Google, Bing, Yahoo
- **Endpoint**: `/api/v1/search?engine=google&q=tv+lg`

### Camada 3: Scrapers (Fallback Robusto)

#### 1. Apify
- **URL**: https://apify.com
- **Free Tier**: $5 créditos/mês
- **Actors Prontos**:
  - `mercadolibre-scraper`
  - `amazon-product-scraper`
  - `aliexpress-scraper`

#### 2. ScraperAPI
- **URL**: https://www.scraperapi.com
- **Free Tier**: 5000 requests/mês
- **Uso**: Proxy + anti-blocking
- **Endpoint**: `http://api.scraperapi.com?api_key=KEY&url=URL`

## 💻 Implementação - Código Completo

### 1. Serviço de Orquestração

```javascript
// backend/services/productSearchOrchestrator.js

const mercadoLibreAPI = require('./apis/mercadoLibreAPI');
const magaluAPI = require('./apis/magaluAPI');
const aliexpressAPI = require('./apis/aliexpressAPI');
const serpAPI = require('./apis/serpAPI');
const scraperService = require('./scrapers/scraperService');
const cache = require('./cache');

class ProductSearchOrchestrator {
  constructor() {
    this.cache = cache;
    this.timeout = 10000; // 10s timeout
  }

  async search(query, options = {}) {
    const cacheKey = `product:${query}`;
    
    // 1. Verificar cache
    const cached = await this.cache.get(cacheKey);
    if (cached && !options.forceRefresh) {
      return { ...cached, fromCache: true };
    }

    const results = {
      products: [],
      sources: [],
      timestamp: Date.now(),
      query: query
    };

    try {
      // 2. Tentar APIs oficiais (paralelo)
      const officialResults = await this.tryOfficialAPIs(query);
      if (officialResults.length > 0) {
        results.products.push(...officialResults);
        results.sources.push('official_apis');
      }

      // 3. Se poucos resultados, usar SERP APIs
      if (results.products.length < 5) {
        const serpResults = await this.trySerpAPIs(query);
        results.products.push(...serpResults);
        results.sources.push('serp_apis');
      }

      // 4. Se ainda poucos, usar scrapers
      if (results.products.length < 3) {
        const scrapedResults = await this.tryScrapers(query);
        results.products.push(...scrapedResults);
        results.sources.push('scrapers');
      }

      // 5. Normalizar e deduplic ar
      results.products = this.normalizeAndDedupe(results.products);

      // 6. Ordenar por preço
      results.products.sort((a, b) => a.price - b.price);

      // 7. Salvar no cache (6 horas)
      await this.cache.set(cacheKey, results, 21600);

      return results;

    } catch (error) {
      console.error('Erro na orquestração:', error);
      throw error;
    }
  }

  async tryOfficialAPIs(query) {
    const promises = [
      mercadoLibreAPI.search(query).catch(() => []),
      magaluAPI.search(query).catch(() => []),
      aliexpressAPI.search(query).catch(() => [])
    ];

    const results = await Promise.allSettled(promises);
    return results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);
  }

  async trySerpAPIs(query) {
    try {
      return await serpAPI.searchProducts(query);
    } catch (error) {
      console.error('SERP API falhou:', error);
      return [];
    }
  }

  async tryScrapers(query) {
    try {
      return await scraperService.scrapeProducts(query);
    } catch (error) {
      console.error('Scrapers falharam:', error);
      return [];
    }
  }

  normalizeAndDedupe(products) {
    // Normalizar formato
    const normalized = products.map(p => ({
      id: p.id || p.sku || p.productId,
      title: p.title || p.name,
      price: parseFloat(p.price || p.priceValue || 0),
      currency: p.currency || 'BRL',
      url: p.url || p.link,
      image: p.image || p.thumbnail,
      seller: p.seller || p.store || 'Unknown',
      source: p.source,
      shipping: p.shipping || null,
      rating: p.rating || null,
      reviews: p.reviews || 0
    }));

    // Deduplic ar por título similar
    const unique = [];
    const seen = new Set();

    for (const product of normalized) {
      const key = this.generateProductKey(product.title);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(product);
      }
    }

    return unique;
  }

  generateProductKey(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 50);
  }
}

module.exports = new ProductSearchOrchestrator();
```

### 2. API Mercado Livre

```javascript
// backend/services/apis/mercadoLibreAPI.js

const fetch = require('node-fetch');

class MercadoLibreAPI {
  constructor() {
    this.baseURL = 'https://api.mercadolibre.com';
    this.site = 'MLB'; // Brasil
  }

  async search(query, limit = 10) {
    try {
      const url = `${this.baseURL}/sites/${this.site}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();

      return data.results.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        currency: item.currency_id,
        url: item.permalink,
        image: item.thumbnail,
        seller: item.seller?.nickname || 'Mercado Livre',
        source: 'mercadolibre',
        shipping: item.shipping?.free_shipping ? 'Grátis' : null,
        rating: item.seller?.seller_reputation?.level_id || null
      }));
    } catch (error) {
      console.error('Erro MercadoLibre API:', error);
      return [];
    }
  }
}

module.exports = new MercadoLibreAPI();
```

### 3. Cache Simples (Memory)

```javascript
// backend/services/cache.js

class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  async get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Verificar expiração
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  async set(key, data, ttlSeconds) {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  clear() {
    this.cache.clear();
  }
}

module.exports = new SimpleCache();
```

### 4. Endpoint no Backend

```javascript
// backend/server.js - adicionar rota

const productSearch = require('./services/productSearchOrchestrator');

app.post('/api/products/search', async (req, res) => {
  try {
    const { query, forceRefresh } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query é obrigatória' });
    }

    console.log('🛒 Buscando produtos:', query);

    const results = await productSearch.search(query, { forceRefresh });

    console.log(`✅ Encontrados ${results.products.length} produtos`);

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
```

## 📋 Plano de Implementação (2 Semanas)

### Semana 1: APIs Oficiais + Infraestrutura

**Dia 1-2**: Setup e Mercado Livre
- [ ] Criar estrutura de pastas
- [ ] Implementar MercadoLibreAPI
- [ ] Testar busca básica

**Dia 3-4**: Magalu e Cache
- [ ] Cadastrar em developers.magalu.com
- [ ] Implementar MagaluAPI
- [ ] Implementar sistema de cache

**Dia 5**: Orquestrador
- [ ] Implementar ProductSearchOrchestrator
- [ ] Normalização e deduplicação
- [ ] Testes de integração

### Semana 2: SERP APIs + Scrapers + Frontend

**Dia 6-7**: SERP APIs
- [ ] Cadastrar em SerpApi (free tier)
- [ ] Implementar SerpAPI service
- [ ] Fallback automático

**Dia 8-9**: Scrapers
- [ ] Cadastrar em Apify
- [ ] Implementar ScraperService
- [ ] Testes de robustez

**Dia 10**: Integração com LLM
- [ ] Endpoint `/api/products/search`
- [ ] Integração com frontend
- [ ] Modo pesquisa de produtos

## 🎯 Resultado Esperado

### Exemplo de Resposta

```json
{
  "query": "tv lg 27 polegadas",
  "products": [
    {
      "id": "MLB123456",
      "title": "Smart TV LG 27\" Full HD",
      "price": 1299.90,
      "currency": "BRL",
      "url": "https://...",
      "image": "https://...",
      "seller": "Loja Oficial LG",
      "source": "mercadolibre",
      "shipping": "Grátis",
      "rating": "5_green"
    },
    // ... mais produtos
  ],
  "sources": ["official_apis", "serp_apis"],
  "timestamp": 1730203200000,
  "fromCache": false
}
```

## 📚 Recursos e Links

- [Mercado Livre Developers](https://developers.mercadolivre.com.br)
- [Magalu Developers](https://developers.magalu.com)
- [SerpApi](https://serpapi.com)
- [Brave Search API](https://brave.com/search/api/)
- [Apify](https://apify.com)
- [ScraperAPI](https://www.scraperapi.com)

---

**Próximo Passo**: Implementar o código acima! Quer que eu crie os arquivos? 🚀
