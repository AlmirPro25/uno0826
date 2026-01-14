/**
 * ⚙️ CONFIGURAÇÃO DO SISTEMA DE BUSCA MASSIVA
 * Ajuste aqui os parâmetros de performance
 */

export const SEARCH_CONFIG = {
    // ==================== TIMEOUTS ====================
    
    /**
     * Timeout padrão por site (em milissegundos)
     * Aumentar se sites estão dando timeout
     * Diminuir para respostas mais rápidas (mas pode perder sites lentos)
     */
    DEFAULT_TIMEOUT: 60000, // 60 segundos (antes: 30s)
    
    /**
     * Timeout para sites de notícias (geralmente mais rápidos)
     */
    NEWS_TIMEOUT: 45000, // 45 segundos
    
    /**
     * Timeout para sites internacionais (geralmente mais lentos)
     */
    INTERNATIONAL_TIMEOUT: 90000, // 90 segundos
    
    /**
     * Timeout para buscadores (podem ser lentos)
     */
    SEARCH_ENGINE_TIMEOUT: 60000, // 60 segundos
    
    // ==================== LIMITES ====================
    
    /**
     * Número máximo de sites a buscar simultaneamente
     * Aumentar para mais resultados (mas mais lento)
     * Diminuir para respostas mais rápidas (mas menos resultados)
     */
    MAX_SITES: 10,
    
    /**
     * Número máximo de resultados por site
     */
    MAX_RESULTS_PER_SITE: 10,
    
    /**
     * Número máximo de links a extrair por página
     */
    MAX_LINKS_PER_PAGE: 20,
    
    // ==================== COMPORTAMENTO ====================
    
    /**
     * Aguardar estado de carregamento
     * Opções: 'load', 'domcontentloaded', 'networkidle'
     * 'networkidle' é mais lento mas mais confiável
     */
    WAIT_UNTIL: 'networkidle',
    
    /**
     * Delay aleatório entre navegações (em ms)
     * Para parecer mais humano e evitar bloqueios
     */
    MIN_DELAY: 500,
    MAX_DELAY: 1500,
    
    /**
     * Número de tentativas em caso de falha
     */
    MAX_RETRIES: 2,
    
    /**
     * Delay entre tentativas (em ms)
     */
    RETRY_DELAY: 2000,
    
    // ==================== PRIORIDADES ====================
    
    /**
     * Prioridade de sites por tipo
     * Menor número = maior prioridade
     */
    PRIORITIES: {
        NEWS_BRAZIL: 1,      // Sites de notícias brasileiros
        SEARCH_ENGINES: 1,   // Buscadores
        NEWS_INTERNATIONAL: 2, // Sites de notícias internacionais
        SPECIALIZED: 2,      // Sites especializados
        REFERENCE: 3,        // Sites de referência (Wikipedia, etc.)
    },
    
    // ==================== CACHE ====================
    
    /**
     * Tempo de cache em milissegundos
     * 0 = sem cache
     */
    CACHE_TTL: 5 * 60 * 1000, // 5 minutos
    
    /**
     * Habilitar cache
     */
    ENABLE_CACHE: false, // Desabilitado por enquanto
    
    // ==================== DEBUG ====================
    
    /**
     * Modo debug (mais logs)
     */
    DEBUG: true,
    
    /**
     * Incluir sites que falharam na resposta
     */
    INCLUDE_FAILURES: true,
};

/**
 * Obter timeout baseado no tipo de site
 */
export function getTimeoutForSite(siteType) {
    switch (siteType) {
        case 'news':
            return SEARCH_CONFIG.NEWS_TIMEOUT;
        case 'search':
            return SEARCH_CONFIG.SEARCH_ENGINE_TIMEOUT;
        case 'international':
            return SEARCH_CONFIG.INTERNATIONAL_TIMEOUT;
        default:
            return SEARCH_CONFIG.DEFAULT_TIMEOUT;
    }
}

/**
 * Obter configuração otimizada para tipo de query
 */
export function getConfigForQueryType(queryType) {
    const baseConfig = { ...SEARCH_CONFIG };
    
    switch (queryType) {
        case 'news':
            // Notícias: priorizar velocidade
            return {
                ...baseConfig,
                MAX_SITES: 8,
                DEFAULT_TIMEOUT: 45000,
            };
        
        case 'weather':
            // Clima: poucos sites especializados
            return {
                ...baseConfig,
                MAX_SITES: 5,
                DEFAULT_TIMEOUT: 30000,
            };
        
        case 'products':
            // Produtos: sites de e-commerce (podem ser lentos)
            return {
                ...baseConfig,
                MAX_SITES: 6,
                DEFAULT_TIMEOUT: 60000,
            };
        
        case 'general':
            // Geral: busca ampla
            return {
                ...baseConfig,
                MAX_SITES: 10,
                DEFAULT_TIMEOUT: 60000,
            };
        
        default:
            return baseConfig;
    }
}

export default SEARCH_CONFIG;
