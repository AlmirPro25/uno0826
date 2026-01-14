/**
 * 🔍 ENHANCED SEARCH SERVICE - VERSÃO CORRIGIDA
 * Sistema de busca inteligente que REALMENTE busca (não só gera links)
 */

import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

const BACKEND_URL = 'http://localhost:3002';

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  type?: 'product' | 'link' | 'news';
  price?: string;
  priceRaw?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  sources: string[];
  duration: number;
  success: boolean;
}

/**
 * 🧠 Detectar se mensagem é uma busca (usando Gemini)
 */
export async function detectSearchIntent(message: string): Promise<boolean> {
  try {
    // Detecção rápida por palavras-chave
    const quickKeywords = [
      'busque', 'buscar', 'procure', 'procurar',
      'pesquise', 'pesquisar', 'encontre', 'encontrar',
      'search', 'find', 'look for', 'google',
      'qual', 'quais', 'onde', 'como', 'quando',
      'me mostre', 'me diga', 'me fale'
    ];

    const lowerMessage = message.toLowerCase();
    const hasKeyword = quickKeywords.some(kw => lowerMessage.includes(kw));

    // Se tem palavra-chave óbvia, é busca
    if (hasKeyword) {
      console.log('🔍 Busca detectada por palavra-chave');
      return true;
    }

    // Se não tem palavra-chave, usar Gemini para detectar
    console.log('🧠 Usando Gemini para detectar intenção...');

    const prompt = `A mensagem abaixo é uma solicitação de busca/pesquisa na internet?

Mensagem: "${message}"

Responda APENAS: SIM ou NAO`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        temperature: 0.1,
        maxOutputTokens: 10
      }
    });

    const answer = response.text.toUpperCase().trim();
    const isSearch = answer.includes('SIM');

    console.log(`🧠 Gemini detectou: ${isSearch ? 'BUSCA' : 'NÃO É BUSCA'}`);
    return isSearch;

  } catch (error) {
    console.error('❌ Erro ao detectar intenção:', error);
    // Em caso de erro, assumir que não é busca
    return false;
  }
}

/**
 * 🚀 Buscar usando BUSCA MASSIVA PARALELA (REAL)
 */
export async function massiveSearch(query: string): Promise<SearchResponse> {
  const startTime = Date.now();

  console.log(`🚀 Iniciando busca massiva: "${query}"`);

  try {
    const response = await fetch(`${BACKEND_URL}/api/search/massive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        maxSites: 10,
        timeout: 60000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error('Busca massiva retornou erro');
    }

    console.log(`✅ Busca concluída: ${data.totalResults} resultados de ${data.successfulSites} sites`);

    return {
      query,
      results: data.results || [],
      totalResults: data.totalResults || 0,
      sources: data.sites || [],
      duration: data.duration || (Date.now() - startTime),
      success: true
    };

  } catch (error) {
    console.error('❌ Erro na busca massiva:', error);

    return {
      query,
      results: [],
      totalResults: 0,
      sources: [],
      duration: Date.now() - startTime,
      success: false
    };
  }
}

/**
 * 📝 Formatar resultados para exibição
 */
export function formatSearchResults(searchResponse: SearchResponse): string {
  const { query, results, totalResults, sources, duration } = searchResponse;

  if (totalResults === 0) {
    return `❌ **Nenhum resultado encontrado para "${query}"**\n\nTentei buscar em múltiplos sites, mas nenhum retornou resultados.\n\n💡 **Dicas:**\n- Tente reformular a pergunta\n- Use palavras-chave diferentes\n- Verifique a ortografia`;
  }

  let formatted = `✅ **Encontrei ${totalResults} resultados para "${query}"**\n\n`;
  formatted += `🔍 Busquei em ${sources.length} sites (${Math.round(duration / 1000)}s)\n`;
  formatted += `🌐 Fontes: ${sources.join(', ')}\n\n`;
  formatted += `📋 **Principais Resultados:**\n\n`;

  // Mostrar top 10 resultados
  results.slice(0, 10).forEach((r, i) => {
    formatted += `**${i + 1}. ${r.title}**\n`;
    formatted += `   🌐 ${r.source}\n`;
    formatted += `   🔗 ${r.url}\n`;

    if (r.snippet && r.snippet.length > 50) {
      formatted += `   📝 ${r.snippet.substring(0, 200)}...\n`;
    }

    if (r.price) {
      formatted += `   💰 ${r.price}\n`;
    }

    formatted += `\n`;
  });

  if (totalResults > 10) {
    formatted += `\n... e mais ${totalResults - 10} resultados\n`;
  }

  formatted += `\n---\n`;
  formatted += `⚡ **Performance:** ${Math.round(totalResults / (duration / 1000))} resultados/segundo\n`;
  formatted += `🚀 **Busca paralela em ${sources.length} sites simultâneos**`;

  return formatted;
}

/**
 * 🧠 Gerar resposta inteligente com Gemini (fallback)
 */
export async function generateIntelligentFallback(query: string): Promise<string> {
  console.log('🧠 Gerando resposta com Gemini (fallback)...');

  try {
    const prompt = `Responda de forma completa e detalhada sobre: "${query}"

**INSTRUÇÕES:**
1. Use seu conhecimento geral
2. Seja específico e informativo
3. Organize em seções se necessário
4. Use emojis para melhor visualização
5. Cite fontes confiáveis quando possível
6. **IMPORTANTE:** Deixe claro que você não tem acesso a dados em tempo real

**FORMATO:**
- Use Markdown para formatação
- Adicione emojis relevantes
- Seja objetivo mas completo

**RESPOSTA COMPLETA:**`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    });

    let fallbackResponse = response.text;

    // Adicionar aviso
    fallbackResponse += '\n\n---\n';
    fallbackResponse += '💡 *Resposta gerada pelo modelo sem busca na internet. Para informações atualizadas, tente novamente ou consulte fontes especializadas.*\n\n';
    fallbackResponse += '**🌐 Fontes Recomendadas:**\n';
    fallbackResponse += '- [Google](https://www.google.com/search?q=' + encodeURIComponent(query) + ')\n';
    fallbackResponse += '- [Wikipedia](https://pt.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(query) + ')\n';
    fallbackResponse += '- [Bing](https://www.bing.com/search?q=' + encodeURIComponent(query) + ')';

    return fallbackResponse;

  } catch (error) {
    console.error('❌ Erro ao gerar fallback:', error);
    return `❌ **Erro ao processar sua pesquisa**\n\nOcorreu um erro ao buscar informações. Por favor, tente novamente.`;
  }
}

/**
 * 🎯 Busca completa com fallback inteligente
 */
export async function intelligentSearch(query: string): Promise<{
  content: string;
  results?: SearchResult[];
  success: boolean;
}> {
  console.log(`\n🎯 ========== BUSCA INTELIGENTE ==========`);
  console.log(`📝 Query: "${query}"`);

  try {
    // 1. Tentar busca massiva
    const searchResponse = await massiveSearch(query);

    if (searchResponse.success && searchResponse.totalResults > 0) {
      // Busca bem-sucedida
      const formatted = formatSearchResults(searchResponse);

      return {
        content: formatted,
        results: searchResponse.results,
        success: true
      };
    }

    // 2. Fallback: Usar Gemini
    console.log('⚠️ Busca massiva falhou, usando Gemini...');
    const fallbackContent = await generateIntelligentFallback(query);

    return {
      content: fallbackContent,
      success: false
    };

  } catch (error) {
    console.error('❌ Erro na busca inteligente:', error);

    // Fallback de emergência
    return {
      content: `❌ **Erro ao processar sua pesquisa**\n\nOcorreu um erro inesperado. Por favor:\n\n1. Verifique se o backend está rodando\n2. Tente reformular a pergunta\n3. Aguarde alguns segundos e tente novamente`,
      success: false
    };
  }
}

/**
 * 🔗 Gerar links de busca (modo alternativo)
 */
export function generateSearchLinks(query: string): Array<{
  source: string;
  url: string;
  description: string;
}> {
  const encodedQuery = encodeURIComponent(query);

  return [
    {
      source: 'Bing',
      url: `https://www.bing.com/search?q=${encodedQuery}`,
      description: 'Buscador da Microsoft - Rápido e confiável'
    },
    {
      source: 'Startpage',
      url: `https://www.startpage.com/do/search?q=${encodedQuery}`,
      description: 'Resultados do Google com privacidade'
    },
    {
      source: 'Wikipedia',
      url: `https://pt.wikipedia.org/wiki/Special:Search?search=${encodedQuery}`,
      description: 'Enciclopédia livre e verificada'
    },
    {
      source: 'Brave Search',
      url: `https://search.brave.com/search?q=${encodedQuery}`,
      description: 'Busca independente e privada'
    }
  ];
}

export default {
  detectSearchIntent,
  massiveSearch,
  intelligentSearch,
  formatSearchResults,
  generateIntelligentFallback,
  generateSearchLinks
};
