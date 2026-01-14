/**
 * 🌐 BROWSER INTEGRATION SERVICE
 * Detecta comandos de navegação e integra com o chat/canvas
 */

import { browseAndExtract, searchGoogle } from './browserService';

/**
 * Palavras-chave que indicam navegação
 */
const NAVIGATION_KEYWORDS = [
  'navegue',
  'navegar',
  'abra',
  'abrir',
  'acesse',
  'acessar',
  'visite',
  'visitar',
  'vá para',
  'ir para',
  'entre em',
  'entrar em',
  'mostre o site',
  'mostrar site',
  'carregar site',
  'carregue',
];

const SEARCH_KEYWORDS = [
  'pesquise',
  'pesquisar',
  'busque',
  'buscar',
  'procure',
  'procurar',
  'encontre',
  'encontrar',
  'google',
];

/**
 * Detecta se a mensagem é um comando de navegação
 */
export function isNavigationCommand(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return NAVIGATION_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Detecta se a mensagem é um comando de busca
 */
export function isSearchCommand(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return SEARCH_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Extrai URL da mensagem
 */
export function extractUrl(message: string): string | null {
  // Padrões de URL
  const urlPatterns = [
    // URL completa
    /(https?:\/\/[^\s]+)/i,
    // Domínio sem protocolo
    /(?:em|para|no|na)\s+([a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?)/i,
    // Apenas domínio
    /([a-z0-9-]+\.(?:com|dev|org|net|io|br|co)(?:\/[^\s]*)?)/i,
  ];

  for (const pattern of urlPatterns) {
    const match = message.match(pattern);
    if (match) {
      let url = match[1] || match[0];
      
      // Adicionar https:// se não tiver protocolo
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
      
      return url;
    }
  }

  return null;
}

/**
 * Extrai query de busca da mensagem
 */
export function extractSearchQuery(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Remover palavras-chave de busca
  let query = message;
  
  const removePatterns = [
    /pesquis(e|ar|a)\s+(sobre|por|no google)?\s*/gi,
    /busqu(e|ar|a)\s+(sobre|por|no google)?\s*/gi,
    /procur(e|ar|a)\s+(sobre|por|no google)?\s*/gi,
    /encontr(e|ar|a)\s+(sobre|por)?\s*/gi,
    /no\s+google\s*/gi,
  ];
  
  removePatterns.forEach(pattern => {
    query = query.replace(pattern, '');
  });
  
  return query.trim();
}

/**
 * Navegar e retornar dados para o Canvas
 */
export async function navigateAndPrepareCanvas(url: string) {
  try {
    console.log(`🌐 Navegando para: ${url}`);
    
    // Navegar e extrair tudo
    const result = await browseAndExtract(url);
    
    return {
      type: 'webpage' as const,
      success: true,
      data: {
        url: result.navigation.url,
        title: result.content.title,
        screenshot: result.screenshot,
        content: result.content,
      },
      message: `✅ Navegação concluída! Site carregado no Canvas.`
    };
  } catch (error) {
    console.error('❌ Erro ao navegar:', error);
    return {
      type: 'webpage' as const,
      success: false,
      error: error.message,
      message: `❌ Erro ao navegar: ${error.message}`
    };
  }
}

/**
 * Buscar e retornar dados para o Canvas
 */
export async function searchAndPrepareCanvas(query: string) {
  try {
    console.log(`🔍 Buscando: ${query}`);
    
    // Buscar no Google
    const results = await searchGoogle(query);
    
    return {
      type: 'search-results' as const,
      success: true,
      data: {
        query,
        searchResults: results,
      },
      message: `✅ Encontrei ${results.length} resultados para "${query}"`
    };
  } catch (error) {
    console.error('❌ Erro ao buscar:', error);
    return {
      type: 'search-results' as const,
      success: false,
      error: error.message,
      message: `❌ Erro ao buscar: ${error.message}`
    };
  }
}

/**
 * Processar mensagem do usuário e decidir ação
 */
export async function processBrowserCommand(message: string) {
  // 1. Verificar se é comando de navegação
  if (isNavigationCommand(message)) {
    const url = extractUrl(message);
    
    if (!url) {
      return {
        type: 'error' as const,
        message: '❌ Não consegui identificar a URL. Por favor, especifique o site.'
      };
    }
    
    return await navigateAndPrepareCanvas(url);
  }
  
  // 2. Verificar se é comando de busca
  if (isSearchCommand(message)) {
    const query = extractSearchQuery(message);
    
    if (!query) {
      return {
        type: 'error' as const,
        message: '❌ Não consegui identificar o que buscar. Por favor, especifique a busca.'
      };
    }
    
    return await searchAndPrepareCanvas(query);
  }
  
  // 3. Não é comando de navegação/busca
  return null;
}

/**
 * Exemplos de comandos que funcionam
 */
export const COMMAND_EXAMPLES = [
  'Navegue em playwright.dev',
  'Abra o site github.com',
  'Acesse https://example.com',
  'Visite o site da Microsoft',
  'Pesquise sobre Playwright',
  'Busque no Google: Node.js tutorial',
  'Procure informações sobre React',
];

export default {
  isNavigationCommand,
  isSearchCommand,
  extractUrl,
  extractSearchQuery,
  navigateAndPrepareCanvas,
  searchAndPrepareCanvas,
  processBrowserCommand,
  COMMAND_EXAMPLES,
};
