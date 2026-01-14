/**
 * 🚀 MASSIVE SEARCH SERVICE
 * Busca PARALELA em múltiplos sites simultaneamente
 * Usa 10 sessões Playwright em paralelo para máxima velocidade
 */

import { browserService } from './browserService.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import SEARCH_CONFIG, { getTimeoutForSite, getConfigForQueryType } from '../config/search-config.js';
import { selectSitesForIntent, generateSearchUrls, detectUserIntent } from './intelligentSiteSelector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== CARREGAR SITES CONFIÁVEIS ====================

let TRUSTED_SITES = {};
try {
    const sitesPath = join(__dirname, '../data/trusted-sites.json');
    TRUSTED_SITES = JSON.parse(readFileSync(sitesPath, 'utf-8'));
    console.log('✅ Sites confiáveis carregados:', Object.keys(TRUSTED_SITES).length, 'categorias');
} catch (error) {
    console.error('❌ Erro ao carregar sites confiáveis:', error.message);
    TRUSTED_SITES = { news_brazil: [], search_engines: [], reference: [] };
}

// Mapear sites para formato interno
const NEWS_SITES = [
    ...(TRUSTED_SITES.news_brazil || []).map(s => ({ ...s, type: 'news' })),
    ...(TRUSTED_SITES.news_international || []).map(s => ({ ...s, type: 'news' })),
];

// Mapear buscadores com BING como prioridade 1
let SEARCH_ENGINES = (TRUSTED_SITES.search_engines || []).map(s => ({ ...s, type: 'search' }));

// Garantir que Bing tem prioridade 1
SEARCH_ENGINES = SEARCH_ENGINES.map(s => {
    if (s.name === 'Bing') {
        return { ...s, priority: 1 };
    } else if (s.name === 'Startpage') {
        return { ...s, priority: 2 };
    }
    return s;
}).sort((a, b) => a.priority - b.priority);

const SPECIALIZED_SITES = [
    ...(TRUSTED_SITES.weather || []).map(s => ({ ...s, type: 'weather' })),
    ...(TRUSTED_SITES.ecommerce_brazil || []).map(s => ({ ...s, type: 'products' })),
    ...(TRUSTED_SITES.reference || []).map(s => ({ ...s, type: 'reference' })),
    ...(TRUSTED_SITES.tech || []).map(s => ({ ...s, type: 'tech' })),
    ...(TRUSTED_SITES.sports || []).map(s => ({ ...s, type: 'sports' })),
    ...(TRUSTED_SITES.health || []).map(s => ({ ...s, type: 'health' })),
    ...(TRUSTED_SITES.finance || []).map(s => ({ ...s, type: 'finance' })),
];

console.log(`📊 Sites disponíveis: ${NEWS_SITES.length} notícias, ${SEARCH_ENGINES.length} buscadores, ${SPECIALIZED_SITES.length} especializados`);

// ==================== FUNÇÕES DE BUSCA ====================

/**
 * Selecionar sites apropriados para a query (VERSÃO INTELIGENTE)
 * Usa o intelligentSiteSelector para escolher os melhores sites baseado na intenção
 */
function selectSites(query, maxSites = 10) {
    // Usar seletor inteligente que analisa a intenção do usuário
    const selection = selectSitesForIntent(query, maxSites);
    
    console.log(`🧠 Intenção: ${selection.intent} | Sites: ${selection.sites.length}`);
    
    // Converter para formato esperado pelo código existente
    const sites = selection.sites.map(site => ({
        name: site.name,
        url: site.url,
        searchUrl: site.searchUrl,
        priority: site.priority,
        type: site.category
    }));
    
    return sites;
}

import { extractProducts } from './productExtractor.js';

/**
 * Buscar em um único site
 */
async function searchInSite(site, query, timeout = null) {
    // Usar timeout específico do tipo de site se não fornecido
    if (!timeout) {
        timeout = getTimeoutForSite(site.type);
    }
    const sessionId = `massive_${site.name}_${Date.now()}`;
    
    try {
        console.log(`🔍 [${site.name}] Iniciando busca...`);
        
        // Criar sessão
        await browserService.createSession(sessionId);
        
        // Construir URL de busca
        let searchUrl;
        if (site.type === 'search') {
            // Buscadores
            if (site.name === 'Startpage') {
                searchUrl = `${site.url}/do/search?q=${encodeURIComponent(query)}`;
            } else if (site.name === 'Bing') {
                searchUrl = `${site.url}/search?q=${encodeURIComponent(query)}`;
            } else if (site.name === 'Brave') {
                searchUrl = `${site.url}/search?q=${encodeURIComponent(query)}`;
            } else if (site.name === 'Ecosia') {
                searchUrl = `${site.url}/search?q=${encodeURIComponent(query)}`;
            }
        } else if (site.type === 'news') {
            // Sites de notícias
            if (site.name === 'G1') {
                searchUrl = `${site.url}/busca/?q=${encodeURIComponent(query)}`;
            } else if (site.name === 'UOL') {
                searchUrl = `${site.url}/busca/?q=${encodeURIComponent(query)}`;
            } else if (site.name === 'Folha') {
                searchUrl = `${site.url}/busca/?q=${encodeURIComponent(query)}`;
            } else if (site.name === 'Estadão') {
                searchUrl = `${site.url}/busca/?q=${encodeURIComponent(query)}`;
            } else {
                // Fallback: página inicial
                searchUrl = site.url;
            }
        } else {
            // Outros: página inicial
            searchUrl = site.url;
        }
        
        // Navegar
        await browserService.navigate(sessionId, searchUrl, { timeout });
        
        // Aguardar carregamento
        await browserService.waitForLoadState(sessionId, 'networkidle', timeout);
        
        // Extrair HTML da página para processar produtos
        const pageContent = await browserService.getPageContent(sessionId);
        const html = pageContent.html || '';
        
        // Extrair produtos REAIS da página
        const products = extractProducts(html, searchUrl, site.name);
        
        console.log(`✅ [${site.name}] ${products.length} produtos extraídos`);
        
        // Converter produtos para formato de resultados
        const results = products.map(product => ({
            title: product.title,
            snippet: `${product.price} - ${product.store}`,
            url: product.url,
            price: product.price,
            priceRaw: product.priceRaw,
            store: product.store,
            storeIcon: product.storeIcon,
            image: product.image,
            source: site.name,
            priority: site.priority,
            type: 'product',
        }));
        
        // Fallback: se não extraiu produtos, tentar extração genérica
        if (results.length === 0) {
            const content = await browserService.extractContent(sessionId, {
                includeText: true,
                includeLinks: true,
                includeImages: false,
                maxLinks: 10,
            });
            
            if (content.links && content.links.length > 0) {
                content.links.forEach((link, index) => {
                    if (index >= 5) return;
                    
                    if (link.text && link.href && link.href.startsWith('http')) {
                        results.push({
                            title: link.text.substring(0, 200),
                            snippet: link.title || '',
                            url: link.href,
                            source: site.name,
                            priority: site.priority,
                            type: 'link',
                        });
                    }
                });
            }
        }
        
        // Fechar sessão
        await browserService.closeSession(sessionId);
        
        console.log(`✅ [${site.name}] ${results.length} resultados encontrados`);
        
        return {
            site: site.name,
            success: true,
            results,
            duration: Date.now(),
        };
        
    } catch (error) {
        console.error(`❌ [${site.name}] Erro:`, error.message);
        
        // Tentar fechar sessão mesmo em caso de erro
        try {
            await browserService.closeSession(sessionId);
        } catch (e) {
            // Ignorar erro ao fechar
        }
        
        return {
            site: site.name,
            success: false,
            results: [],
            error: error.message,
        };
    }
}

/**
 * 🚀 BUSCA MASSIVA PARALELA
 * Busca em múltiplos sites SIMULTANEAMENTE
 */
export async function massiveParallelSearch(query, options = {}) {
    const startTime = Date.now();
    
    // Detectar tipo de query para otimizar configuração
    const queryType = detectUserIntent(query);
    const optimizedConfig = getConfigForQueryType(queryType);
    
    const {
        maxSites = optimizedConfig.MAX_SITES,
        timeout = optimizedConfig.DEFAULT_TIMEOUT,
        includeFailures = SEARCH_CONFIG.INCLUDE_FAILURES,
    } = options;
    
    console.log(`\n🚀 ========== BUSCA MASSIVA PARALELA ==========`);
    console.log(`📝 Query: "${query}"`);
    console.log(`🌐 Sites: ${maxSites} simultâneos`);
    console.log(`⏱️  Timeout: ${timeout}ms por site`);
    
    // Selecionar sites
    const sites = selectSites(query, maxSites);
    console.log(`📋 Sites selecionados: ${sites.map(s => s.name).join(', ')}`);
    
    // Buscar em TODOS os sites SIMULTANEAMENTE
    console.log(`\n🔍 Iniciando buscas paralelas...`);
    const searchPromises = sites.map(site => searchInSite(site, query, timeout));
    
    // Aguardar TODAS as buscas (com timeout)
    const searchResults = await Promise.allSettled(searchPromises);
    
    // Processar resultados
    const allResults = [];
    const successfulSites = [];
    const failedSites = [];
    
    searchResults.forEach((result, index) => {
        const site = sites[index];
        
        if (result.status === 'fulfilled' && result.value.success) {
            allResults.push(...result.value.results);
            successfulSites.push(site.name);
        } else {
            failedSites.push({
                site: site.name,
                error: result.reason?.message || result.value?.error || 'Timeout',
            });
        }
    });
    
    // Remover duplicatas (mesmo URL)
    const uniqueResults = Array.from(
        new Map(allResults.map(r => [r.url, r])).values()
    );
    
    // Ordenar por prioridade e relevância
    uniqueResults.sort((a, b) => {
        // Prioridade do site
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        // Tamanho do snippet (mais conteúdo = mais relevante)
        return b.snippet.length - a.snippet.length;
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ ========== BUSCA CONCLUÍDA ==========`);
    console.log(`📊 Resultados: ${uniqueResults.length} únicos de ${allResults.length} totais`);
    console.log(`✅ Sites bem-sucedidos: ${successfulSites.length}/${sites.length}`);
    console.log(`   ${successfulSites.join(', ')}`);
    
    if (failedSites.length > 0) {
        console.log(`❌ Sites com falha: ${failedSites.length}`);
        failedSites.forEach(f => console.log(`   - ${f.site}: ${f.error}`));
    }
    
    console.log(`⏱️  Duração total: ${Math.round(duration / 1000)}s`);
    console.log(`⚡ Velocidade: ${Math.round(uniqueResults.length / (duration / 1000))} resultados/s`);
    console.log(`==========================================\n`);
    
    // Extrair apenas produtos (não links genéricos)
    const products = uniqueResults.filter(r => r.type === 'product' && r.priceRaw > 0);
    
    // Comparar produtos e encontrar melhores ofertas
    const { compareProducts } = await import('./productExtractor.js');
    const comparison = products.length > 0 ? compareProducts(products) : null;
    
    return {
        success: true,
        query,
        results: uniqueResults,
        products: products, // Produtos com preços
        comparison: comparison, // Comparação de preços
        totalResults: uniqueResults.length,
        totalProducts: products.length,
        successfulSites: successfulSites.length,
        failedSites: failedSites.length,
        sites: successfulSites,
        failures: includeFailures ? failedSites : undefined,
        duration,
        totalTime: duration,
        queryType: detectUserIntent(query),
    };
}

/**
 * Busca massiva com formatação para exibição
 */
export async function massiveSearchFormatted(query, options = {}) {
    const result = await massiveParallelSearch(query, options);
    
    if (result.totalResults === 0) {
        return {
            ...result,
            formatted: `❌ Nenhum resultado encontrado para "${query}".\n\nTentei buscar em ${result.successfulSites + result.failedSites} sites, mas nenhum retornou resultados.`
        };
    }
    
    let formatted = `✅ **Encontrei ${result.totalResults} resultados para "${query}"**\n\n`;
    formatted += `🔍 Busquei em ${result.successfulSites} sites simultaneamente (${Math.round(result.duration / 1000)}s)\n`;
    formatted += `📊 Tipo de busca: ${result.queryType}\n`;
    formatted += `🌐 Fontes: ${result.sites.join(', ')}\n\n`;
    formatted += `📋 **Principais Resultados:**\n\n`;
    
    // Mostrar top 15 resultados
    result.results.slice(0, 15).forEach((r, i) => {
        formatted += `**${i + 1}. ${r.title}**\n`;
        formatted += `   🌐 Fonte: ${r.source}\n`;
        formatted += `   🔗 ${r.url}\n`;
        if (r.snippet && r.snippet.length > 50) {
            formatted += `   📝 ${r.snippet.substring(0, 200)}...\n`;
        }
        formatted += `\n`;
    });
    
    if (result.totalResults > 15) {
        formatted += `\n... e mais ${result.totalResults - 15} resultados\n`;
    }
    
    formatted += `\n---\n`;
    formatted += `⚡ **Performance:** ${Math.round(result.totalResults / (result.duration / 1000))} resultados/segundo\n`;
    formatted += `🚀 **Busca paralela em ${result.successfulSites} sites simultâneos**\n`;
    
    return {
        ...result,
        formatted
    };
}

/**
 * Adicionar sites customizados
 */
export function addCustomSites(sites) {
    sites.forEach(site => {
        if (site.type === 'news') {
            NEWS_SITES.push(site);
        } else if (site.type === 'search') {
            SEARCH_ENGINES.push(site);
        } else {
            SPECIALIZED_SITES.push(site);
        }
    });
    
    console.log(`✅ ${sites.length} sites customizados adicionados`);
}

/**
 * Listar todos os sites disponíveis
 */
export function listAvailableSites() {
    return {
        news: NEWS_SITES,
        search: SEARCH_ENGINES,
        specialized: SPECIALIZED_SITES,
        total: NEWS_SITES.length + SEARCH_ENGINES.length + SPECIALIZED_SITES.length,
    };
}

export default {
    massiveParallelSearch,
    massiveSearchFormatted,
    addCustomSites,
    listAvailableSites,
};
