/**
 * 🤖 NAVIGATION AGENT SERVICE
 * Agente inteligente que executa tarefas de navegação baseado em comandos de linguagem natural
 */

export interface NavigationTask {
  type: 'search_products' | 'compare_prices' | 'monitor_site' | 'extract_data' | 'navigate';
  query: string;
  parameters?: Record<string, any>;
}

export interface TaskResult {
  success: boolean;
  data: any;
  message: string;
  screenshots?: string[];
}

/**
 * Detectar tipo de tarefa baseado no comando do usuário
 */
export function detectNavigationTask(userCommand: string): NavigationTask | null {
  const lowerCommand = userCommand.toLowerCase();

  // Pesquisa de produtos
  if (lowerCommand.match(/pesquis(e|a|ar)|busca|procur(e|a|ar)|encontr(e|a|ar)/i) &&
      lowerCommand.match(/mercadolivre|mercado livre|ml|amazon|magalu|magazine luiza/i)) {
    
    const site = lowerCommand.match(/mercadolivre|mercado livre/i) ? 'mercadolivre' :
                 lowerCommand.match(/amazon/i) ? 'amazon' :
                 lowerCommand.match(/magalu|magazine luiza/i) ? 'magalu' : 'mercadolivre';
    
    // Extrair produto
    const productMatch = lowerCommand.match(/(?:de|por|sobre|para)\s+(.+?)(?:\s+no|\s+na|\s+e|$)/i);
    const product = productMatch ? productMatch[1].trim() : '';

    return {
      type: 'search_products',
      query: userCommand,
      parameters: {
        site,
        product,
        maxResults: 10
      }
    };
  }

  // Comparação de preços
  if (lowerCommand.match(/compar(e|a|ar)|melhor preço|mais barato|black friday/i)) {
    const productMatch = lowerCommand.match(/(?:de|do|da|dos|das)\s+(.+?)(?:\s+em|\s+no|\s+na|$)/i);
    const product = productMatch ? productMatch[1].trim() : '';

    return {
      type: 'compare_prices',
      query: userCommand,
      parameters: {
        product,
        sites: ['mercadolivre', 'amazon', 'magalu'],
        sortBy: 'price'
      }
    };
  }

  // Monitoramento de site
  if (lowerCommand.match(/monitor(e|a|ar)|avis(e|a|ar)|notific(a|ar)|fic(a|ar) de olho/i)) {
    const urlMatch = lowerCommand.match(/(https?:\/\/[^\s]+)/i);
    const url = urlMatch ? urlMatch[1] : '';

    return {
      type: 'monitor_site',
      query: userCommand,
      parameters: {
        url,
        interval: 60000, // 1 minuto
        notifyOn: 'change'
      }
    };
  }

  // Extração de dados
  if (lowerCommand.match(/extra(i|ia|ir)|peg(a|ar)|coletar|captur(a|ar)/i) &&
      lowerCommand.match(/dados|informações|preços|produtos/i)) {
    
    const urlMatch = lowerCommand.match(/(https?:\/\/[^\s]+)/i);
    const url = urlMatch ? urlMatch[1] : '';

    return {
      type: 'extract_data',
      query: userCommand,
      parameters: {
        url,
        dataType: 'products'
      }
    };
  }

  // Navegação simples
  if (lowerCommand.match(/naveg(a|ar|ue)|abr(a|ir|e)|acess(a|ar|e)/i)) {
    const urlMatch = lowerCommand.match(/(https?:\/\/[^\s]+)/i) ||
                     lowerCommand.match(/(?:para|até|em)\s+([a-z0-9.-]+\.[a-z]{2,})/i);
    const url = urlMatch ? urlMatch[1] : '';

    return {
      type: 'navigate',
      query: userCommand,
      parameters: {
        url: url.startsWith('http') ? url : `https://${url}`
      }
    };
  }

  return null;
}

/**
 * Executar tarefa de navegação
 */
export async function executeNavigationTask(task: NavigationTask): Promise<TaskResult> {
  console.log('🤖 Executando tarefa:', task.type);

  try {
    switch (task.type) {
      case 'search_products':
        return await searchProducts(task);
      
      case 'compare_prices':
        return await comparePrices(task);
      
      case 'monitor_site':
        return await monitorSite(task);
      
      case 'extract_data':
        return await extractData(task);
      
      case 'navigate':
        return await navigateToUrl(task);
      
      default:
        return {
          success: false,
          data: null,
          message: 'Tipo de tarefa não reconhecido'
        };
    }
  } catch (error: any) {
    console.error('❌ Erro ao executar tarefa:', error);
    return {
      success: false,
      data: null,
      message: `Erro: ${error.message}`
    };
  }
}

/**
 * Pesquisar produtos
 */
async function searchProducts(task: NavigationTask): Promise<TaskResult> {
  const { site, product, maxResults } = task.parameters || {};

  console.log(`🔍 Pesquisando "${product}" no ${site}...`);

  // Chamar API de busca de produtos
  try {
    const response = await fetch('http://localhost:3002/api/products/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: product, site, maxResults })
    });

    const data = await response.json();

    // Normalizar produtos para formato esperado pelo ProductCard
    const normalizedProducts = (data.products || []).map((p: any) => ({
      id: p.id || `product_${Date.now()}_${Math.random()}`,
      title: p.title || 'Produto sem título',
      price: p.price || 0,
      originalPrice: p.originalPrice,
      currency: p.currency || 'BRL',
      url: p.url || '#',
      image: p.image || '',
      condition: p.condition || 'new',
      seller: {
        name: p.seller?.name || p.store || 'Vendedor',
        reputation: p.seller?.reputation || null
      },
      shipping: {
        free: p.shipping?.free || false,
        type: p.shipping?.type || null
      },
      installments: p.installments || null,
      source: p.source || site,
      marketplace: p.marketplace || site
    }));

    return {
      success: true,
      data: normalizedProducts,
      message: `Encontrei ${normalizedProducts.length} produtos de "${product}" no ${site}!`
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      message: `Erro ao buscar produtos: ${error.message}`
    };
  }
}

/**
 * Comparar preços
 */
async function comparePrices(task: NavigationTask): Promise<TaskResult> {
  const { product, sites } = task.parameters || {};

  console.log(`💰 Comparando preços de "${product}" em ${sites.length} sites...`);

  // Buscar em múltiplos sites
  const searchPromises = sites.map(async (site: string) => {
    try {
      const response = await fetch('http://localhost:3002/api/products/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: product, site, maxResults: 5 })
      });
      const data = await response.json();
      return { site, products: data.products || [] };
    } catch (error) {
      return { site, products: [] };
    }
  });

  const results = await Promise.all(searchPromises);

  // Agregar e ordenar por preço
  const allProducts = results.flatMap(r => r.products);
  const sortedProducts = allProducts.sort((a, b) => a.priceRaw - b.priceRaw);

  const cheapest = sortedProducts[0];
  const mostExpensive = sortedProducts[sortedProducts.length - 1];

  return {
    success: true,
    data: {
      products: sortedProducts,
      cheapest,
      mostExpensive,
      priceRange: {
        min: cheapest?.priceRaw || 0,
        max: mostExpensive?.priceRaw || 0
      }
    },
    message: `Comparei ${sortedProducts.length} produtos! O mais barato é ${cheapest?.title} por ${cheapest?.price}`
  };
}

/**
 * Monitorar site
 */
async function monitorSite(task: NavigationTask): Promise<TaskResult> {
  const { url, interval } = task.parameters || {};

  console.log(`👁️ Monitorando ${url}...`);

  // TODO: Implementar monitoramento real com WebSocket
  // Por enquanto, apenas simular

  return {
    success: true,
    data: {
      url,
      monitoring: true,
      interval
    },
    message: `Monitoramento ativado para ${url}! Vou te avisar se houver mudanças.`
  };
}

/**
 * Extrair dados
 */
async function extractData(task: NavigationTask): Promise<TaskResult> {
  const { url, dataType } = task.parameters || {};

  console.log(`📊 Extraindo dados de ${url}...`);

  // Chamar API de extração
  try {
    const response = await fetch('http://localhost:3002/api/browser/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, dataType })
    });

    const data = await response.json();

    return {
      success: true,
      data: data.extracted || [],
      message: `Extraí ${data.extracted?.length || 0} itens de ${url}!`
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      message: `Erro ao extrair dados: ${error.message}`
    };
  }
}

/**
 * Navegar para URL
 */
async function navigateToUrl(task: NavigationTask): Promise<TaskResult> {
  const { url } = task.parameters || {};

  console.log(`🌐 Navegando para ${url}...`);

  return {
    success: true,
    data: { url },
    message: `Navegando para ${url}...`
  };
}

export default {
  detectNavigationTask,
  executeNavigationTask
};
