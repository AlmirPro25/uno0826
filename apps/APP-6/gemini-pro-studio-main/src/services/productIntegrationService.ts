/**
 * 🛒 PRODUCT INTEGRATION SERVICE
 * Detecta quando usuário quer buscar produtos e integra com o chat
 */

import { searchProducts, ProductSearchResult } from './productSearchService';
import { Message, ProductData } from '../types';

/**
 * Palavras-chave que indicam busca de produtos
 */
const PRODUCT_KEYWORDS = [
  'buscar produto',
  'procurar produto',
  'encontrar produto',
  'preço de',
  'quanto custa',
  'onde comprar',
  'comprar',
  'produto',
  'marketplace',
  'mercado livre',
  'loja',
  'oferta',
  'promoção',
  'desconto',
];

/**
 * Detecta se a mensagem é uma busca de produtos
 */
export function isProductSearch(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return PRODUCT_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Extrai a query de busca da mensagem
 */
export function extractProductQuery(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Remover palavras-chave comuns
  let query = message;
  
  const removePatterns = [
    /buscar?\s+(produto|produtos)?\s*/gi,
    /procurar?\s+(produto|produtos)?\s*/gi,
    /encontrar?\s+(produto|produtos)?\s*/gi,
    /preço\s+de\s*/gi,
    /quanto\s+custa\s*/gi,
    /onde\s+comprar\s*/gi,
    /comprar\s*/gi,
    /no\s+mercado\s+livre/gi,
    /na\s+loja/gi,
  ];
  
  removePatterns.forEach(pattern => {
    query = query.replace(pattern, '');
  });
  
  return query.trim();
}

/**
 * Busca produtos e formata para o chat
 */
export async function searchAndFormatProducts(
  userMessage: string
): Promise<{
  textResponse: string;
  products: ProductData[];
  query: string;
}> {
  const query = extractProductQuery(userMessage);
  
  console.log('🛒 Buscando produtos:', query);
  
  try {
    const results = await searchProducts(query, {
      country: 'brasil',
      limit: 20
    });
    
    // Converter para ProductData
    const products: ProductData[] = results.products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      originalPrice: p.originalPrice,
      currency: p.currency,
      url: p.url,
      image: p.image,
      condition: p.condition,
      seller: p.seller,
      shipping: p.shipping,
      installments: p.installments,
      source: p.source,
      marketplace: p.marketplace,
      rank: p.rank,
      isTopDeal: p.isTopDeal
    }));
    
    // Gerar resposta em texto
    const textResponse = generateProductResponse(results, query);
    
    return {
      textResponse,
      products,
      query
    };
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    throw error;
  }
}

/**
 * Gera resposta em texto sobre os produtos
 */
function generateProductResponse(results: ProductSearchResult, query: string): string {
  const { products, stats, info } = results;
  
  let response = `# 🛒 Encontrei ${stats.total} produtos para "${query}"\n\n`;
  
  // Informações gerais
  if (info) {
    response += `## 📚 Sobre "${query}"\n`;
    response += `${info.snippet}\n\n`;
  }
  
  if (products.length === 0) {
    return `😕 Não encontrei produtos para "${query}". Tente buscar com outras palavras-chave.`;
  }
  
  // Top 3 ofertas
  response += `## 🏆 Melhores Ofertas\n\n`;
  
  const top3 = products.slice(0, 3);
  top3.forEach((product, index) => {
    const medal = ['🥇', '🥈', '🥉'][index];
    response += `${medal} **${product.title}**\n`;
    response += `💰 ${formatPrice(product.price, product.currency)}`;
    
    if (product.originalPrice && product.originalPrice > product.price) {
      const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      response += ` ~~${formatPrice(product.originalPrice, product.currency)}~~ (-${discount}%)`;
    }
    
    response += `\n`;
    
    if (product.shipping.free) {
      response += `✅ Frete Grátis\n`;
    }
    
    response += `\n`;
  });
  
  // Estatísticas
  const cheapest = products[0];
  const mostExpensive = products[products.length - 1];
  const freeShippingCount = products.filter(p => p.shipping.free).length;
  
  response += `## 📊 Resumo\n\n`;
  response += `- **Menor preço**: ${formatPrice(cheapest.price, cheapest.currency)}\n`;
  response += `- **Maior preço**: ${formatPrice(mostExpensive.price, mostExpensive.currency)}\n`;
  response += `- **Com frete grátis**: ${freeShippingCount} produtos\n`;
  response += `- **Fontes**: ${results.sources.join(', ')}\n\n`;
  
  response += `👇 **Veja todos os produtos abaixo com imagens e links para comprar!**`;
  
  return response;
}

/**
 * Formatar preço
 */
function formatPrice(price: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(price);
}

/**
 * Adiciona produtos a uma mensagem existente
 */
export function addProductsToMessage(
  message: Message,
  products: ProductData[],
  query: string
): Message {
  return {
    ...message,
    products,
    productQuery: query
  };
}

export default {
  isProductSearch,
  extractProductQuery,
  searchAndFormatProducts,
  addProductsToMessage
};
