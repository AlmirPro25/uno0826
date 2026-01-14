/**
 * 🛒 PRODUCT SEARCH SERVICE
 * Sistema de busca de produtos com múltiplas fontes e fallback automático
 * SEM necessidade de cadastro ou API keys!
 */

// ==================== MERCADO LIVRE API (SEM CADASTRO!) ====================

class MercadoLibreAPI {
  constructor() {
    this.baseURL = 'https://api.mercadolibre.com';
    this.sites = {
      brasil: 'MLB',
      argentina: 'MLA',
      mexico: 'MLM',
      colombia: 'MCO',
      chile: 'MLC'
    };
  }

  async search(query, country = 'brasil', limit = 20) {
    try {
      const site = this.sites[country] || this.sites.brasil;
      const url = `${this.baseURL}/sites/${site}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      
      console.log(`🛒 Mercado Livre: Buscando "${query}"...`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });
      
      if (!response.ok) {
        console.log(`⚠️ Mercado Livre: HTTP ${response.status}`);
        return [];
      }
      
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        console.log('⚠️ Mercado Livre: Nenhum resultado');
        return [];
      }

      console.log(`✅ Mercado Livre: ${data.results.length} produtos encontrados`);

      return data.results.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        originalPrice: item.original_price,
        currency: item.currency_id,
        url: item.permalink,
        image: item.thumbnail,
        condition: item.condition, // new, used
        seller: {
          name: item.seller?.nickname || 'Mercado Livre',
          reputation: item.seller?.seller_reputation?.level_id || null
        },
        shipping: {
          free: item.shipping?.free_shipping || false,
          type: item.shipping?.logistic_type || null
        },
        installments: item.installments ? {
          quantity: item.installments.quantity,
          amount: item.installments.amount,
          rate: item.installments.rate
        } : null,
        source: 'mercadolibre',
        marketplace: 'Mercado Livre',
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('❌ Erro Mercado Livre:', error.message);
      return [];
    }
  }

  async getDetails(productId) {
    try {
      const url = `${this.baseURL}/items/${productId}`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao buscar detalhes:', error);
      return null;
    }
  }
}

// ==================== WIKIPEDIA API (SEM CADASTRO!) ====================

class WikipediaAPI {
  constructor() {
    this.baseURL = 'https://pt.wikipedia.org/w/api.php';
  }

  async search(query, limit = 5) {
    try {
      const url = `${this.baseURL}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=${limit}`;
      
      console.log(`📚 Wikipedia: Buscando "${query}"...`);
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data.query || !data.query.search) {
        return [];
      }

      console.log(`✅ Wikipedia: ${data.query.search.length} artigos encontrados`);

      return data.query.search.map(item => ({
        title: item.title,
        snippet: item.snippet.replace(/<[^>]*>/g, ''),
        url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
        source: 'wikipedia'
      }));
    } catch (error) {
      console.error('❌ Erro Wikipedia:', error);
      return [];
    }
  }
}

// ==================== DUCKDUCKGO INSTANT ANSWER (SEM CADASTRO!) ====================

class DuckDuckGoAPI {
  constructor() {
    this.baseURL = 'https://api.duckduckgo.com';
  }

  async search(query) {
    try {
      const url = `${this.baseURL}/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      
      console.log(`🦆 DuckDuckGo: Buscando "${query}"...`);
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data.AbstractText && !data.RelatedTopics?.length) {
        console.log('⚠️ DuckDuckGo: Nenhum resultado');
        return null;
      }

      console.log(`✅ DuckDuckGo: Informações encontradas`);

      return {
        title: data.Heading || query,
        snippet: data.AbstractText || '',
        url: data.AbstractURL || '',
        image: data.Image || '',
        relatedTopics: data.RelatedTopics?.slice(0, 5).map(topic => ({
          text: topic.Text,
          url: topic.FirstURL
        })) || [],
        source: 'duckduckgo'
      };
    } catch (error) {
      console.error('❌ Erro DuckDuckGo:', error);
      return null;
    }
  }
}

// ==================== GOOGLE SHOPPING SCRAPER (SEM CADASTRO!) ====================

class GoogleShoppingAPI {
  constructor() {
    this.baseURL = 'https://www.google.com/search';
  }

  async search(query, limit = 10) {
    try {
      // Usar proxy público para evitar bloqueio
      const searchQuery = `${query} preço comprar`;
      const url = `${this.baseURL}?q=${encodeURIComponent(searchQuery)}&tbm=shop&hl=pt-BR`;
      
      console.log(`🛍️ Google Shopping: Buscando "${query}"...`);
      
      // Nota: Scraping direto pode ser bloqueado. Melhor usar SearchApi ou SerpApi
      // Por enquanto, retornar vazio e usar outras fontes
      console.log('⚠️ Google Shopping: Requer proxy/API externa');
      return [];
      
    } catch (error) {
      console.error('❌ Erro Google Shopping:', error);
      return [];
    }
  }
}

// ==================== BEST BUY API (SEM CADASTRO!) ====================

class BestBuyAPI {
  constructor() {
    this.baseURL = 'https://www.bestbuy.com/api/3.0';
  }

  async search(query, limit = 20) {
    try {
      // Best Buy requer API key, mas podemos fazer scraping da busca pública
      console.log(`🛍️ Best Buy: Busca não disponível sem API key`);
      return [];
    } catch (error) {
      console.error('❌ Erro Best Buy:', error);
      return [];
    }
  }
}

// ==================== FAKE STORE API (SEM CADASTRO!) ====================

class FakeStoreAPI {
  constructor() {
    this.baseURL = 'https://fakestoreapi.com';
  }

  async search(query, limit = 20) {
    try {
      const url = `${this.baseURL}/products`;
      
      console.log(`🏪 Fake Store: Buscando produtos...`);
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data || data.length === 0) {
        console.log('⚠️ Fake Store: Nenhum resultado');
        return [];
      }

      // Filtrar por query
      const filtered = data.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );

      console.log(`✅ Fake Store: ${filtered.length} produtos encontrados`);

      return filtered.slice(0, limit).map(item => ({
        id: item.id.toString(),
        title: item.title,
        price: item.price,
        currency: 'USD',
        url: `https://fakestoreapi.com/products/${item.id}`,
        image: item.image,
        condition: 'new',
        seller: {
          name: 'Fake Store',
          reputation: null
        },
        shipping: {
          free: Math.random() > 0.5,
          type: null
        },
        installments: null,
        source: 'fakestore',
        marketplace: 'Fake Store',
        category: item.category,
        rating: item.rating
      }));
    } catch (error) {
      console.error('❌ Erro Fake Store:', error);
      return [];
    }
  }
}

// ==================== DUMMY JSON API (SEM CADASTRO!) ====================

class DummyJSONAPI {
  constructor() {
    this.baseURL = 'https://dummyjson.com';
  }

  async search(query, limit = 20) {
    try {
      const url = `${this.baseURL}/products/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      
      console.log(`📦 DummyJSON: Buscando "${query}"...`);
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data.products || data.products.length === 0) {
        console.log('⚠️ DummyJSON: Nenhum resultado');
        return [];
      }

      console.log(`✅ DummyJSON: ${data.products.length} produtos encontrados`);

      return data.products.map(item => ({
        id: item.id.toString(),
        title: item.title,
        price: item.price,
        originalPrice: item.price * (1 + item.discountPercentage / 100),
        currency: 'USD',
        url: `https://dummyjson.com/products/${item.id}`,
        image: item.thumbnail,
        images: item.images,
        condition: 'new',
        seller: {
          name: item.brand || 'DummyJSON',
          reputation: null
        },
        shipping: {
          free: Math.random() > 0.5,
          type: null
        },
        installments: null,
        source: 'dummyjson',
        marketplace: 'DummyJSON',
        category: item.category,
        rating: item.rating,
        stock: item.stock,
        brand: item.brand
      }));
    } catch (error) {
      console.error('❌ Erro DummyJSON:', error);
      return [];
    }
  }
}

// ==================== PLATZI FAKE STORE API (SEM CADASTRO!) ====================

class PlatziAPI {
  constructor() {
    this.baseURL = 'https://api.escuelajs.co/api/v1';
  }

  async search(query, limit = 20) {
    try {
      const url = `${this.baseURL}/products`;
      
      console.log(`🎓 Platzi Store: Buscando produtos...`);
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data || data.length === 0) {
        console.log('⚠️ Platzi Store: Nenhum resultado');
        return [];
      }

      // Filtrar por query
      const filtered = data.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        (item.category && item.category.name.toLowerCase().includes(query.toLowerCase()))
      );

      console.log(`✅ Platzi Store: ${filtered.length} produtos encontrados`);

      return filtered.slice(0, limit).map(item => ({
        id: item.id.toString(),
        title: item.title,
        price: item.price,
        currency: 'USD',
        url: `https://api.escuelajs.co/api/v1/products/${item.id}`,
        image: item.images && item.images[0] ? item.images[0] : item.category?.image,
        images: item.images,
        condition: 'new',
        seller: {
          name: 'Platzi Store',
          reputation: null
        },
        shipping: {
          free: Math.random() > 0.5,
          type: null
        },
        installments: null,
        source: 'platzi',
        marketplace: 'Platzi Store',
        category: item.category?.name,
        description: item.description
      }));
    } catch (error) {
      console.error('❌ Erro Platzi Store:', error);
      return [];
    }
  }
}

// ==================== OPEN PRODUCT DATA (SEM CADASTRO!) ====================

class OpenProductDataAPI {
  constructor() {
    this.baseURL = 'https://world.openfoodfacts.org/api/v0';
  }

  async searchByBarcode(barcode) {
    try {
      const url = `${this.baseURL}/product/${barcode}.json`;
      
      console.log(`📦 Open Product Data: Buscando código de barras "${barcode}"...`);
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 0) {
        console.log('⚠️ Open Product Data: Produto não encontrado');
        return null;
      }

      console.log(`✅ Open Product Data: Produto encontrado`);

      const product = data.product;
      return {
        id: product.code,
        title: product.product_name || 'Produto sem nome',
        brand: product.brands || '',
        categories: product.categories_tags || [],
        image: product.image_url || '',
        ingredients: product.ingredients_text || '',
        nutritionGrade: product.nutrition_grade_fr || '',
        url: `https://world.openfoodfacts.org/product/${barcode}`,
        source: 'openfoodfacts',
        marketplace: 'Open Food Facts'
      };
    } catch (error) {
      console.error('❌ Erro Open Product Data:', error);
      return null;
    }
  }

  async search(query, limit = 20) {
    try {
      const url = `${this.baseURL}/search?search_terms=${encodeURIComponent(query)}&page_size=${limit}&json=1`;
      
      console.log(`📦 Open Product Data: Buscando "${query}"...`);
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data.products || data.products.length === 0) {
        console.log('⚠️ Open Product Data: Nenhum resultado');
        return [];
      }

      console.log(`✅ Open Product Data: ${data.products.length} produtos encontrados`);

      return data.products.map(product => ({
        id: product.code,
        title: product.product_name || 'Produto sem nome',
        brand: product.brands || '',
        categories: product.categories_tags || [],
        image: product.image_url || '',
        url: `https://world.openfoodfacts.org/product/${product.code}`,
        source: 'openfoodfacts',
        marketplace: 'Open Food Facts'
      }));
    } catch (error) {
      console.error('❌ Erro Open Product Data:', error);
      return [];
    }
  }
}

// ==================== CACHE SIMPLES ====================

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Verificar expiração
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data, ttlSeconds = 3600) {
    // Limpar cache se muito grande
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  clear() {
    this.cache.clear();
  }
}

// ==================== ORQUESTRADOR PRINCIPAL ====================

class ProductSearchOrchestrator {
  constructor() {
    this.mercadoLibre = new MercadoLibreAPI();
    this.wikipedia = new WikipediaAPI();
    this.duckduckgo = new DuckDuckGoAPI();
    this.googleShopping = new GoogleShoppingAPI();
    this.openProductData = new OpenProductDataAPI();
    this.fakeStore = new FakeStoreAPI();
    this.dummyJSON = new DummyJSONAPI();
    this.platzi = new PlatziAPI();
    this.bestBuy = new BestBuyAPI();
    this.cache = new SimpleCache();
  }

  async search(query, options = {}) {
    const {
      country = 'brasil',
      limit = 20,
      forceRefresh = false,
      includeInfo = true,
      sources = ['dummyjson', 'fakestore', 'platzi', 'openfoodfacts'] // Fontes ativas
    } = options;

    const cacheKey = `products:${query}:${country}:${sources.join(',')}`;

    // 1. Verificar cache
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log('💾 Retornando do cache');
        return { ...cached, fromCache: true };
      }
    }

    console.log(`\n🔍 Iniciando busca: "${query}"`);
    console.log(`📡 Fontes ativas: ${sources.join(', ')}`);

    const result = {
      query,
      products: [],
      info: null,
      sources: [],
      stats: {
        total: 0,
        bySource: {}
      },
      timestamp: Date.now()
    };

    try {
      // 2. Buscar produtos em paralelo de múltiplas fontes
      const searchPromises = [];

      if (sources.includes('mercadolibre')) {
        searchPromises.push(
          this.mercadoLibre.search(query, country, limit)
            .then(products => ({ source: 'mercadolibre', products }))
            .catch(err => {
              console.error('❌ Erro Mercado Livre:', err.message);
              return { source: 'mercadolibre', products: [] };
            })
        );
      }

      if (sources.includes('openfoodfacts')) {
        searchPromises.push(
          this.openProductData.search(query, limit)
            .then(products => ({ source: 'openfoodfacts', products }))
            .catch(err => {
              console.error('❌ Erro Open Food Facts:', err.message);
              return { source: 'openfoodfacts', products: [] };
            })
        );
      }

      if (sources.includes('googleshopping')) {
        searchPromises.push(
          this.googleShopping.search(query, limit)
            .then(products => ({ source: 'googleshopping', products }))
            .catch(err => {
              console.error('❌ Erro Google Shopping:', err.message);
              return { source: 'googleshopping', products: [] };
            })
        );
      }

      if (sources.includes('fakestore')) {
        searchPromises.push(
          this.fakeStore.search(query, limit)
            .then(products => ({ source: 'fakestore', products }))
            .catch(err => {
              console.error('❌ Erro Fake Store:', err.message);
              return { source: 'fakestore', products: [] };
            })
        );
      }

      if (sources.includes('dummyjson')) {
        searchPromises.push(
          this.dummyJSON.search(query, limit)
            .then(products => ({ source: 'dummyjson', products }))
            .catch(err => {
              console.error('❌ Erro DummyJSON:', err.message);
              return { source: 'dummyjson', products: [] };
            })
        );
      }

      if (sources.includes('platzi')) {
        searchPromises.push(
          this.platzi.search(query, limit)
            .then(products => ({ source: 'platzi', products }))
            .catch(err => {
              console.error('❌ Erro Platzi:', err.message);
              return { source: 'platzi', products: [] };
            })
        );
      }

      if (sources.includes('bestbuy')) {
        searchPromises.push(
          this.bestBuy.search(query, limit)
            .then(products => ({ source: 'bestbuy', products }))
            .catch(err => {
              console.error('❌ Erro Best Buy:', err.message);
              return { source: 'bestbuy', products: [] };
            })
        );
      }

      // Aguardar todas as buscas
      const searchResults = await Promise.all(searchPromises);

      // Consolidar resultados
      for (const { source, products } of searchResults) {
        if (products.length > 0) {
          result.products.push(...products);
          result.sources.push(source);
          result.stats.bySource[source] = products.length;
        }
      }

      // 3. Buscar informações (Wikipedia + DuckDuckGo) em paralelo
      if (includeInfo) {
        const [wikiInfo, ddgInfo] = await Promise.all([
          this.wikipedia.search(query, 3).catch(() => []),
          this.duckduckgo.search(query).catch(() => null)
        ]);

        // Priorizar DuckDuckGo se tiver conteúdo
        if (ddgInfo && ddgInfo.snippet) {
          result.info = ddgInfo;
          result.sources.push('duckduckgo');
        } else if (wikiInfo.length > 0) {
          result.info = wikiInfo[0];
          result.sources.push('wikipedia');
        }
      }

      // 4. Processar resultados
      result.products = this.processProducts(result.products);
      result.stats.total = result.products.length;

      // 5. Salvar no cache (1 hora)
      this.cache.set(cacheKey, result, 3600);

      console.log(`✅ Busca concluída: ${result.stats.total} produtos de ${result.sources.length} fontes\n`);

      return result;

    } catch (error) {
      console.error('❌ Erro na busca:', error);
      throw error;
    }
  }

  processProducts(products) {
    // Ordenar por preço (menor primeiro)
    products.sort((a, b) => a.price - b.price);

    // Adicionar ranking
    products.forEach((product, index) => {
      product.rank = index + 1;
      product.isTopDeal = index < 3; // Top 3 ofertas
    });

    return products;
  }

  // Buscar apenas informações (sem produtos)
  async searchInfo(query) {
    const cacheKey = `info:${query}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Buscar em múltiplas fontes
    const [wikiInfo, ddgInfo] = await Promise.all([
      this.wikipedia.search(query, 5).catch(() => []),
      this.duckduckgo.search(query).catch(() => null)
    ]);

    const result = {
      primary: ddgInfo || (wikiInfo.length > 0 ? wikiInfo[0] : null),
      related: wikiInfo,
      sources: []
    };

    if (ddgInfo) result.sources.push('duckduckgo');
    if (wikiInfo.length > 0) result.sources.push('wikipedia');
    
    this.cache.set(cacheKey, result, 7200); // 2 horas
    
    return result;
  }

  // Buscar por código de barras
  async searchByBarcode(barcode) {
    const cacheKey = `barcode:${barcode}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const product = await this.openProductData.searchByBarcode(barcode);
    
    if (product) {
      this.cache.set(cacheKey, product, 86400); // 24 horas
    }
    
    return product;
  }

  // Listar fontes disponíveis
  getAvailableSources() {
    return {
      products: [
        { id: 'dummyjson', name: 'DummyJSON', active: true, requiresAuth: false, type: 'demo' },
        { id: 'fakestore', name: 'Fake Store API', active: true, requiresAuth: false, type: 'demo' },
        { id: 'platzi', name: 'Platzi Store', active: true, requiresAuth: false, type: 'demo' },
        { id: 'openfoodfacts', name: 'Open Food Facts', active: true, requiresAuth: false, type: 'real' },
        { id: 'mercadolibre', name: 'Mercado Livre', active: false, requiresAuth: false, type: 'real', note: 'Bloqueado (403)' },
        { id: 'googleshopping', name: 'Google Shopping', active: false, requiresAuth: false, type: 'real', note: 'Requer proxy' },
        { id: 'bestbuy', name: 'Best Buy', active: false, requiresAuth: true, type: 'real', note: 'Requer API key' }
      ],
      info: [
        { id: 'wikipedia', name: 'Wikipedia', active: true, requiresAuth: false },
        { id: 'duckduckgo', name: 'DuckDuckGo', active: true, requiresAuth: false }
      ]
    };
  }

  // Estatísticas do cache
  getCacheStats() {
    return {
      size: this.cache.cache.size,
      maxSize: this.cache.maxSize
    };
  }

  // Limpar cache
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache limpo');
  }
}

// ==================== EXPORT ====================

const productSearch = new ProductSearchOrchestrator();

export {
  productSearch,
  MercadoLibreAPI,
  WikipediaAPI,
  DuckDuckGoAPI,
  GoogleShoppingAPI,
  OpenProductDataAPI,
  FakeStoreAPI,
  DummyJSONAPI,
  PlatziAPI,
  BestBuyAPI
};
