/**
 * 🛒 PRODUCT SEARCH SERVICE - Frontend
 * Integração com API de busca de produtos
 */

export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  url: string;
  image: string;
  condition: string;
  seller: {
    name: string;
    reputation: string | null;
  };
  shipping: {
    free: boolean;
    type: string | null;
  };
  installments: {
    quantity: number;
    amount: number;
    rate: number;
  } | null;
  source: string;
  marketplace: string;
  rank?: number;
  isTopDeal?: boolean;
}

export interface ProductSearchResult {
  query: string;
  products: Product[];
  info: {
    title: string;
    snippet: string;
    url: string;
  } | null;
  sources: string[];
  stats: {
    total: number;
    bySource: Record<string, number>;
  };
  timestamp: number;
  fromCache?: boolean;
}

const BACKEND_URL = 'http://localhost:3002';

/**
 * Buscar produtos
 */
export async function searchProducts(
  query: string,
  options: {
    country?: string;
    limit?: number;
    forceRefresh?: boolean;
  } = {}
): Promise<ProductSearchResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/products/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
}

/**
 * Buscar apenas informações (Wikipedia + DuckDuckGo)
 */
export async function searchProductInfo(query: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/products/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar informações:', error);
    throw error;
  }
}

/**
 * Buscar produto por código de barras
 */
export async function searchByBarcode(barcode: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/products/barcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ barcode })
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar por código de barras:', error);
    throw error;
  }
}

/**
 * Listar fontes disponíveis
 */
export async function getAvailableSources() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/products/sources`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar fontes:', error);
    throw error;
  }
}

/**
 * Formatar preço para exibição
 */
export function formatPrice(price: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(price);
}

/**
 * Formatar parcelamento
 */
export function formatInstallments(installments: Product['installments']): string {
  if (!installments) return '';
  
  const amount = formatPrice(installments.amount);
  const rate = installments.rate === 0 ? 'sem juros' : 'com juros';
  
  return `${installments.quantity}x de ${amount} ${rate}`;
}

/**
 * Gerar resposta formatada para o LLM
 */
export function formatProductsForLLM(result: ProductSearchResult): string {
  const { products, info, stats } = result;

  let response = `# 🛒 Resultados da Pesquisa: "${result.query}"\n\n`;

  // Informações gerais (Wikipedia)
  if (info) {
    response += `## 📚 Informações\n`;
    response += `${info.snippet}\n`;
    response += `[Saiba mais](${info.url})\n\n`;
  }

  // Estatísticas
  response += `## 📊 Estatísticas\n`;
  response += `- **Total de produtos**: ${stats.total}\n`;
  response += `- **Fontes**: ${Object.keys(stats.bySource).join(', ')}\n\n`;

  // Top 5 produtos
  if (products.length > 0) {
    response += `## 🏆 Melhores Ofertas\n\n`;

    products.slice(0, 5).forEach((product, index) => {
      response += `### ${index + 1}. ${product.title}\n`;
      response += `- **Preço**: ${formatPrice(product.price, product.currency)}`;
      
      if (product.originalPrice && product.originalPrice > product.price) {
        const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        response += ` ~~${formatPrice(product.originalPrice)}~~ (-${discount}%)`;
      }
      
      response += `\n`;
      
      if (product.installments) {
        response += `- **Parcelamento**: ${formatInstallments(product.installments)}\n`;
      }
      
      if (product.shipping.free) {
        response += `- **Frete**: ✅ Grátis\n`;
      }
      
      response += `- **Vendedor**: ${product.seller.name}\n`;
      response += `- **Link**: [Ver produto](${product.url})\n\n`;
    });

    // Resumo
    const cheapest = products[0];
    const mostExpensive = products[products.length - 1];
    
    response += `## 💡 Resumo\n`;
    response += `- **Menor preço**: ${formatPrice(cheapest.price)}\n`;
    response += `- **Maior preço**: ${formatPrice(mostExpensive.price)}\n`;
    response += `- **Frete grátis**: ${products.filter(p => p.shipping.free).length} produtos\n`;
  } else {
    response += `😕 Nenhum produto encontrado para "${result.query}".\n`;
  }

  return response;
}

export default {
  searchProducts,
  searchProductInfo,
  searchByBarcode,
  getAvailableSources,
  formatPrice,
  formatInstallments,
  formatProductsForLLM
};
