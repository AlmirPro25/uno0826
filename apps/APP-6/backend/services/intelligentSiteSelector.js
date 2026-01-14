/**
 * 🧠 INTELLIGENT SITE SELECTOR
 * Seleciona sites confiáveis baseado na intenção do usuário
 * Usa a lista de trusted-sites.json de forma inteligente
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar sites confiáveis
let TRUSTED_SITES = {};
try {
    const sitesPath = join(__dirname, '../data/trusted-sites.json');
    TRUSTED_SITES = JSON.parse(readFileSync(sitesPath, 'utf-8'));
    console.log('✅ Sites confiáveis carregados:', Object.keys(TRUSTED_SITES).length, 'categorias');
} catch (error) {
    console.error('❌ Erro ao carregar sites confiáveis:', error.message);
}

/**
 * Detectar intenção do usuário baseado na query
 */
export function detectUserIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    // Palavras-chave por categoria (ordem importa - mais específico primeiro)
    const keywords = {
        // E-COMMERCE: Só quando REALMENTE for compra
        ecommerce_brazil: [
            'comprar', 'compro', 'quero comprar', 'onde comprar',
            'preço de', 'quanto custa', 'valor de',
            'loja', 'vender', 'oferta', 'promoção', 'desconto',
            'black friday', 'cupom', 'frete grátis',
            // Produtos específicos COM intenção de compra
            'notebook para comprar', 'celular barato', 'iphone preço',
            'tv em oferta', 'geladeira promoção'
        ],
        
        // TECH: Informação sobre tecnologia (NÃO é compra)
        tech: [
            'tecnologia', 'tech', 'software', 'hardware',
            'inteligência artificial', 'ia', 'machine learning',
            'programação', 'código', 'desenvolvimento',
            'o que é', 'como funciona', 'tutorial'
        ],
        
        // EDUCAÇÃO: Aprender sobre algo
        education: [
            'curso', 'aula', 'aprender', 'estudar', 'educação',
            'tutorial', 'ensino', 'como fazer', 'guia'
        ],
        
        weather: ['clima', 'tempo', 'temperatura', 'chuva', 'sol', 'previsão', 'meteorologia'],
        health: ['saúde', 'doença', 'sintoma', 'tratamento', 'médico', 'hospital', 'remédio', 'vacina', 'gripe', 'covid'],
        finance: ['dinheiro', 'investimento', 'bolsa', 'ação', 'dólar', 'economia', 'financeiro', 'banco', 'cotação', 'real'],
        entertainment: ['filme', 'série', 'cinema', 'ator', 'atriz', 'netflix', 'entretenimento'],
        travel: ['viagem', 'hotel', 'passagem', 'turismo', 'viajar', 'destino'],
        sports: ['futebol', 'esporte', 'jogo', 'campeonato', 'time', 'jogador', 'copa', 'olimpíadas'],
        news_brazil: ['notícia', 'notícias', 'aconteceu', 'acontecendo', 'hoje', 'ontem', 'brasil', 'rio', 'são paulo', 'bahia', 'operação', 'polícia', 'política'],
        news_international: ['internacional', 'mundo', 'eua', 'europa', 'ásia', 'guerra', 'conflito', 'global'],
        government_brazil: ['governo', 'lei', 'senado', 'câmara', 'deputado', 'senador', 'presidente', 'ministério'],
        reference: ['o que é', 'quem é', 'quando', 'onde', 'como', 'por que', 'definição', 'significado', 'wikipedia'],
    };
    
    // Contar matches por categoria
    const scores = {};
    for (const [category, words] of Object.entries(keywords)) {
        scores[category] = words.filter(word => lowerQuery.includes(word)).length;
    }
    
    // Ordenar por score
    const sorted = Object.entries(scores)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1]);
    
    if (sorted.length > 0) {
        return sorted[0][0]; // Retorna categoria com maior score
    }
    
    // Fallback: busca geral
    return 'general';
}

/**
 * Selecionar sites apropriados baseado na intenção
 */
export function selectSitesForIntent(query, maxSites = 10) {
    const intent = detectUserIntent(query);
    console.log(`🧠 Intenção detectada: ${intent}`);
    
    let selectedSites = [];
    
    // Selecionar sites baseado na intenção
    switch (intent) {
        case 'news_brazil':
            selectedSites = [
                ...getSites('news_brazil', 5),
                ...getSites('search_engines', 2),
            ];
            break;
            
        case 'news_international':
            selectedSites = [
                ...getSites('news_international', 5),
                ...getSites('search_engines', 2),
            ];
            break;
            
        case 'weather':
            selectedSites = [
                ...getSites('weather', 4),
                ...getSites('search_engines', 1),
            ];
            break;
            
        case 'ecommerce_brazil':
            selectedSites = [
                ...getSites('ecommerce_brazil', 6),
                ...getSites('search_engines', 2),
            ];
            break;
            
        case 'tech':
            selectedSites = [
                ...getSites('tech', 4),
                ...getSites('reference', 2),
                ...getSites('search_engines', 2),
            ];
            break;
            
        case 'sports':
            selectedSites = [
                ...getSites('sports', 4),
                ...getSites('search_engines', 2),
            ];
            break;
            
        case 'health':
            selectedSites = [
                ...getSites('health', 4),
                ...getSites('reference', 2),
                ...getSites('search_engines', 1),
            ];
            break;
            
        case 'finance':
            selectedSites = [
                ...getSites('finance', 4),
                ...getSites('search_engines', 2),
            ];
            break;
            
        case 'education':
            selectedSites = [
                ...getSites('education', 4),
                ...getSites('reference', 2),
            ];
            break;
            
        case 'government_brazil':
            selectedSites = [
                ...getSites('government_brazil', 5),
                ...getSites('news_brazil', 2),
            ];
            break;
            
        case 'entertainment':
            selectedSites = [
                ...getSites('entertainment', 4),
                ...getSites('search_engines', 2),
            ];
            break;
            
        case 'travel':
            selectedSites = [
                ...getSites('travel', 5),
                ...getSites('search_engines', 1),
            ];
            break;
            
        case 'reference':
            selectedSites = [
                ...getSites('reference', 3),
                ...getSites('search_engines', 3),
            ];
            break;
            
        default: // general
            selectedSites = [
                ...getSites('search_engines', 3),
                ...getSites('reference', 2),
                ...getSites('news_brazil', 2),
            ];
    }
    
    // Limitar ao máximo solicitado
    selectedSites = selectedSites.slice(0, maxSites);
    
    console.log(`📋 Sites selecionados (${selectedSites.length}):`, selectedSites.map(s => s.name).join(', '));
    
    return {
        intent,
        sites: selectedSites,
        query
    };
}

/**
 * Pegar sites de uma categoria específica
 */
function getSites(category, limit = 5) {
    if (!TRUSTED_SITES[category]) {
        return [];
    }
    
    return TRUSTED_SITES[category]
        .sort((a, b) => a.priority - b.priority) // Ordenar por prioridade
        .slice(0, limit)
        .map(site => ({
            ...site,
            category,
            searchUrl: buildSearchUrl(site.url, site.name)
        }));
}

/**
 * Construir URL de busca para cada site
 */
function buildSearchUrl(baseUrl, siteName) {
    // Padrões de URL de busca por site
    const searchPatterns = {
        // Notícias Brasil
        'G1': '/busca/?q=',
        'UOL': '/busca/?q=',
        'Folha de S.Paulo': '/search?q=',
        'Estadão': '/busca/?q=',
        'BBC Brasil': '/portuguese/search?q=',
        'CNN Brasil': '/busca/?q=',
        'R7': '/busca?q=',
        
        // E-commerce
        'Mercado Livre': '/ofertas?q=',
        'Amazon Brasil': '/s?k=',
        'Magazine Luiza': '/busca/',
        'Americanas': '/busca/',
        'Casas Bahia': '/busca?q=',
        'KaBuM!': '/busca/',
        
        // Tech
        'TecMundo': '/busca?q=',
        'Olhar Digital': '/?s=',
        'Canaltech': '/busca/?q=',
        
        // Clima
        'Climatempo': '/busca/',
        
        // Buscadores
        'Bing': '/search?q=',
        'Startpage': '/do/search?q=',
        'Brave Search': '/search?q=',
        
        // Referência
        'Wikipedia PT': '/w/index.php?search=',
        'Wikipedia EN': '/w/index.php?search=',
    };
    
    const pattern = searchPatterns[siteName];
    if (pattern) {
        return baseUrl + pattern;
    }
    
    // Fallback: tentar padrão comum
    return baseUrl + '/search?q=';
}

/**
 * Gerar URLs de busca completas
 */
export function generateSearchUrls(query, maxSites = 10) {
    const selection = selectSitesForIntent(query, maxSites);
    
    const urls = selection.sites.map(site => ({
        url: site.searchUrl + encodeURIComponent(query),
        site: site.name,
        category: site.category,
        priority: site.priority,
        baseUrl: site.url
    }));
    
    return {
        intent: selection.intent,
        query: selection.query,
        urls
    };
}
