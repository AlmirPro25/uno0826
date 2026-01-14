/**
 * 🔍 MULTI-SEARCH SERVICE
 * Busca em MÚLTIPLOS buscadores simultaneamente usando Playwright
 */

import { browseAndExtract } from './browserService';

export interface SearchResult {
  source: string;
  url: string;
  title: string;
  snippet: string;
  success: boolean;
}

export interface MultiSearchResult {
  query: string;
  results: SearchResult[];
  totalResults: number;
  successfulSearches: number;
  failedSearches: number;
  duration: number;
}

/**
 * Lista de buscadores que funcionam com Playwright
 * ✅ BING COMO PADRÃO - Melhor performance e resultados
 */
const SEARCH_ENGINES = [
  {
    name: 'Bing',
    url: (query: string) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
    priority: 1, // PRIORIDADE 1: Microsoft, muito confiável e rápido
  },
  {
    name: 'Startpage',
    url: (query: string) => `https://www.startpage.com/do/search?q=${encodeURIComponent(query)}`,
    priority: 2, // Usa resultados do Google sem bloqueio
  },
  {
    name: 'Wikipedia',
    url: (query: string) => `https://pt.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`,
    priority: 3, // Informações verificadas
  },
  {
    name: 'Brave Search',
    url: (query: string) => `https://search.brave.com/search?q=${encodeURIComponent(query)}`,
    priority: 4, // Privacidade e bons resultados
  },
];

/**
 * Buscar em um único buscador
 */
async function searchInEngine(
  engineName: string,
  url: string,
  query: string
): Promise<SearchResult[]> {
  try {
    console.log(`🔍 Buscando em ${engineName}: ${query}`);
    
    const result = await browseAndExtract(url);
    
    // Extrair resultados do conteúdo
    const results: SearchResult[] = [];
    
    // Tentar extrair links e títulos
    if (result.content.links && result.content.links.length > 0) {
      result.content.links.slice(0, 10).forEach((link: any) => {
        if (link.text && link.href && link.href.startsWith('http')) {
          results.push({
            source: engineName,
            url: link.href,
            title: link.text,
            snippet: link.title || '',
            success: true,
          });
        }
      });
    }
    
    console.log(`✅ ${engineName}: ${results.length} resultados encontrados`);
    return results;
  } catch (error) {
    console.error(`❌ Erro ao buscar em ${engineName}:`, error);
    return [];
  }
}

/**
 * Gerar links de busca (sem navegar)
 * Retorna os links para o usuário clicar
 */
export function generateSearchLinks(query: string): SearchResult[] {
  console.log(`🔗 Gerando links de busca para: "${query}"`);
  
  const searchLinks: SearchResult[] = [];
  
  SEARCH_ENGINES.forEach(engine => {
    const searchUrl = engine.url(query);
    searchLinks.push({
      source: engine.name,
      url: searchUrl,
      title: `Buscar "${query}" no ${engine.name}`,
      snippet: `Clique para buscar no ${engine.name}`,
      success: true,
    });
  });
  
  console.log(`✅ ${searchLinks.length} links de busca gerados`);
  return searchLinks;
}

/**
 * Buscar em MÚLTIPLOS buscadores simultaneamente
 */
export async function searchMultipleEngines(
  query: string,
  maxEngines: number = 4
): Promise<MultiSearchResult> {
  const startTime = Date.now();
  
  console.log(`\n🔍 BUSCA EM MÚLTIPLOS BUSCADORES`);
  console.log(`📝 Query: "${query}"`);
  console.log(`🌐 Buscadores: ${Math.min(maxEngines, SEARCH_ENGINES.length)}`);
  
  // Selecionar buscadores por prioridade
  const selectedEngines = SEARCH_ENGINES
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxEngines);
  
  // Buscar em todos simultaneamente
  const searchPromises = selectedEngines.map(engine =>
    searchInEngine(engine.name, engine.url(query), query)
  );
  
  // Aguardar todas as buscas
  const searchResults = await Promise.allSettled(searchPromises);
  
  // Processar resultados
  const allResults: SearchResult[] = [];
  let successfulSearches = 0;
  let failedSearches = 0;
  
  searchResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allResults.push(...result.value);
      successfulSearches++;
    } else {
      failedSearches++;
      console.warn(`⚠️ ${selectedEngines[index].name} falhou ou não retornou resultados`);
    }
  });
  
  // Remover duplicatas (mesmo URL)
  const uniqueResults = allResults.filter((result, index, self) =>
    index === self.findIndex(r => r.url === result.url)
  );
  
  const duration = Date.now() - startTime;
  
  console.log(`\n✅ BUSCA CONCLUÍDA`);
  console.log(`📊 Resultados: ${uniqueResults.length} únicos de ${allResults.length} totais`);
  console.log(`✅ Buscadores bem-sucedidos: ${successfulSearches}/${selectedEngines.length}`);
  console.log(`⏱️ Duração: ${Math.round(duration / 1000)}s`);
  
  return {
    query,
    results: uniqueResults,
    totalResults: uniqueResults.length,
    successfulSearches,
    failedSearches,
    duration,
  };
}

/**
 * Buscar e formatar para exibição
 */
export async function searchAndFormat(query: string): Promise<string> {
  const result = await searchMultipleEngines(query);
  
  if (result.totalResults === 0) {
    return `❌ Nenhum resultado encontrado para "${query}".\n\nTentei buscar em ${result.successfulSearches + result.failedSearches} buscadores, mas nenhum retornou resultados.`;
  }
  
  let formatted = `✅ **Encontrei ${result.totalResults} resultados para "${query}"**\n\n`;
  formatted += `🔍 Busquei em ${result.successfulSearches} buscadores (${Math.round(result.duration / 1000)}s)\n\n`;
  formatted += `📋 **Principais Resultados:**\n\n`;
  
  // Mostrar top 10 resultados
  result.results.slice(0, 10).forEach((r, i) => {
    formatted += `**${i + 1}. ${r.title}**\n`;
    formatted += `   🌐 Fonte: ${r.source}\n`;
    formatted += `   🔗 ${r.url}\n`;
    if (r.snippet) {
      formatted += `   📝 ${r.snippet.substring(0, 150)}...\n`;
    }
    formatted += `\n`;
  });
  
  if (result.totalResults > 10) {
    formatted += `\n... e mais ${result.totalResults - 10} resultados\n`;
  }
  
  return formatted;
}

export default {
  searchMultipleEngines,
  searchAndFormat,
};
