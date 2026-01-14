/**
 * 🌐 BROWSER SERVICE - Playwright Integration
 * Navegador automatizado para busca e extração de dados
 */

import { chromium } from 'playwright';

class BrowserService {
    constructor() {
        this.browser = null;
        this.context = null;
        this.activeSessions = new Map();
        this.maxSessions = 10; // Limite de sessões simultâneas
        this.metrics = {
            totalSessions: 0,
            activeSessions: 0,
            closedSessions: 0,
            totalNavigations: 0,
            totalScreenshots: 0,
            totalExtractions: 0,
            totalSearches: 0,
            errors: 0,
            avgSessionDuration: 0
        };
        this.screenshotCache = new Map(); // Cache temporário de screenshots
    }

    /**
     * Inicializar navegador
     */
    async initialize() {
        if (this.browser) return;

        console.log('🌐 Inicializando navegador...');

        this.browser = await chromium.launch({
            headless: true, // Rodar em background
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        console.log('✅ Navegador inicializado');
    }

    /**
     * Criar nova sessão de navegação
     */
    async createSession(sessionId) {
        // Verificar limite de sessões
        if (this.activeSessions.size >= this.maxSessions) {
            throw new Error(`Limite de ${this.maxSessions} sessões simultâneas atingido`);
        }

        await this.initialize();

        const page = await this.context.newPage();

        this.activeSessions.set(sessionId, {
            page,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            navigations: 0,
            screenshots: 0,
            extractions: 0
        });

        // Atualizar métricas
        this.metrics.totalSessions++;
        this.metrics.activeSessions = this.activeSessions.size;

        console.log(`📄 Sessão criada: ${sessionId} (${this.activeSessions.size}/${this.maxSessions})`);

        return sessionId;
    }

    /**
     * Navegar para URL
     */
    async navigate(sessionId, url, options = {}) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`🔗 Navegando para: ${url}`);

        try {
            // Delay randomizado para parecer mais humano (anti-bot)
            const delay = Math.random() * 1000 + 500; // 500-1500ms
            await new Promise(resolve => setTimeout(resolve, delay));

            await page.goto(url, {
                waitUntil: options.waitUntil || 'networkidle',
                timeout: options.timeout || 30000
            });

            const title = await page.title();
            const currentUrl = page.url();

            // Atualizar métricas
            session.navigations++;
            this.metrics.totalNavigations++;

            console.log(`✅ Página carregada: ${title}`);

            return {
                success: true,
                url: currentUrl,
                title
            };
        } catch (error) {
            console.error('❌ Erro ao navegar:', error.message);
            this.metrics.errors++;
            throw error;
        }
    }

    /**
     * Extrair conteúdo da página
     */
    async extractContent(sessionId, options = {}) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log('📝 Extraindo conteúdo...');

        try {
            const content = await page.evaluate((opts) => {
                const result = {
                    title: document.title,
                    url: window.location.href,
                    text: '',
                    html: '',
                    links: [],
                    images: [],
                    metadata: {}
                };

                // Texto visível
                if (opts.includeText !== false) {
                    result.text = document.body.innerText;
                }

                // HTML
                if (opts.includeHtml) {
                    result.html = document.body.innerHTML;
                }

                // Links
                if (opts.includeLinks !== false) {
                    result.links = Array.from(document.querySelectorAll('a'))
                        .map(a => ({
                            text: a.innerText.trim(),
                            href: a.href,
                            title: a.title
                        }))
                        .filter(link => link.href && link.text)
                        .slice(0, opts.maxLinks || 50);
                }

                // Imagens
                if (opts.includeImages !== false) {
                    result.images = Array.from(document.querySelectorAll('img'))
                        .map(img => ({
                            src: img.src,
                            alt: img.alt,
                            title: img.title
                        }))
                        .filter(img => img.src)
                        .slice(0, opts.maxImages || 20);
                }

                // Metadata
                if (opts.includeMetadata !== false) {
                    const metaTags = document.querySelectorAll('meta');
                    metaTags.forEach(meta => {
                        const name = meta.getAttribute('name') || meta.getAttribute('property');
                        const content = meta.getAttribute('content');
                        if (name && content) {
                            result.metadata[name] = content;
                        }
                    });
                }

                return result;
            }, options);

            console.log(`✅ Conteúdo extraído: ${content.text.length} caracteres`);

            return content;
        } catch (error) {
            console.error('❌ Erro ao extrair conteúdo:', error.message);
            throw error;
        }
    }

    /**
     * Tirar screenshot
     */
    async screenshot(sessionId, options = {}) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log('📸 Tirando screenshot...');

        try {
            const screenshot = await page.screenshot({
                type: options.type || 'jpeg',
                fullPage: options.fullPage !== false,
                quality: options.quality || 70 // Reduzir qualidade para menor payload
            });

            const base64 = screenshot.toString('base64');

            // Salvar em cache temporário (5 minutos)
            const cacheKey = `screenshot_${sessionId}_${Date.now()}`;
            this.screenshotCache.set(cacheKey, {
                data: base64,
                expires: Date.now() + 5 * 60 * 1000
            });

            // Atualizar métricas
            session.screenshots++;
            this.metrics.totalScreenshots++;

            console.log(`✅ Screenshot capturado (${Math.round(base64.length / 1024)}KB)`);

            return base64;
        } catch (error) {
            console.error('❌ Erro ao tirar screenshot:', error.message);
            this.metrics.errors++;
            throw error;
        }
    }

    /**
     * Buscar no Google (com anti-bot)
     */
    async searchGoogle(sessionId, query) {
        // Delay randomizado antes de buscar
        const delay = Math.random() * 2000 + 1000; // 1-3 segundos
        await new Promise(resolve => setTimeout(resolve, delay));

        await this.navigate(sessionId, `https://www.google.com/search?q=${encodeURIComponent(query)}`);

        const results = await this.extractSearchResults(sessionId);

        // Atualizar métricas
        this.metrics.totalSearches++;

        return results;
    }

    /**
     * Extrair resultados de busca
     */
    async extractSearchResults(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;

        console.log('🔍 Extraindo resultados de busca...');

        try {
            const results = await page.evaluate(() => {
                const items = [];

                // Google search results
                const searchResults = document.querySelectorAll('div.g, div[data-sokoban-container]');

                searchResults.forEach((result, index) => {
                    if (index >= 10) return; // Limitar a 10 resultados

                    const titleEl = result.querySelector('h3');
                    const linkEl = result.querySelector('a');
                    const snippetEl = result.querySelector('div[data-sncf], div.VwiC3b, span.aCOpRe');

                    if (titleEl && linkEl) {
                        items.push({
                            title: titleEl.innerText,
                            url: linkEl.href,
                            snippet: snippetEl ? snippetEl.innerText : ''
                        });
                    }
                });

                return items;
            });

            console.log(`✅ ${results.length} resultados extraídos`);

            return results;
        } catch (error) {
            console.error('❌ Erro ao extrair resultados:', error.message);
            return [];
        }
    }

    /**
     * Executar JavaScript customizado
     */
    async executeScript(sessionId, script) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log('⚡ Executando script...');

        try {
            const result = await page.evaluate(script);
            console.log('✅ Script executado');
            return result;
        } catch (error) {
            console.error('❌ Erro ao executar script:', error.message);
            throw error;
        }
    }

    /**
     * Clicar em elemento
     */
    async click(sessionId, selector) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`🖱️ Clicando em: ${selector}`);

        try {
            await page.click(selector);
            console.log('✅ Clique realizado');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao clicar:', error.message);
            throw error;
        }
    }

    /**
     * Preencher formulário
     */
    async fill(sessionId, selector, value) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`✍️ Preenchendo: ${selector}`);

        try {
            await page.fill(selector, value);
            console.log('✅ Campo preenchido');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao preencher:', error.message);
            throw error;
        }
    }

    /**
     * Esperar por elemento
     */
    async waitForSelector(sessionId, selector, timeout = 30000) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`⏳ Aguardando: ${selector}`);

        try {
            await page.waitForSelector(selector, { timeout });
            console.log('✅ Elemento encontrado');
            return { success: true };
        } catch (error) {
            console.error('❌ Timeout ao aguardar elemento:', error.message);
            throw error;
        }
    }

    /**
     * Pressionar tecla (NOVO)
     */
    async press(sessionId, selector, key) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`⌨️ Pressionando ${key} em: ${selector}`);

        try {
            await page.press(selector, key);
            console.log('✅ Tecla pressionada');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao pressionar tecla:', error.message);
            this.metrics.errors++;
            throw error;
        }
    }

    /**
     * Rolar página (NOVO)
     */
    async scroll(sessionId, direction = 'down', pixels = 500) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`📜 Rolando página: ${direction} ${pixels}px`);

        try {
            await page.evaluate((dir, px) => {
                window.scrollBy(0, dir === 'down' ? px : -px);
            }, direction, pixels);
            
            // Aguardar conteúdo carregar
            await page.waitForTimeout(1000);
            
            console.log('✅ Página rolada');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao rolar página:', error.message);
            this.metrics.errors++;
            throw error;
        }
    }

    /**
     * Passar mouse sobre elemento (NOVO)
     */
    async hover(sessionId, selector) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`🖱️ Passando mouse sobre: ${selector}`);

        try {
            await page.hover(selector);
            console.log('✅ Mouse posicionado');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao passar mouse:', error.message);
            this.metrics.errors++;
            throw error;
        }
    }

    /**
     * Aguardar estado de carregamento (NOVO)
     */
    async waitForLoadState(sessionId, state = 'networkidle', timeout = 30000) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`⏳ Aguardando estado: ${state}`);

        try {
            await page.waitForLoadState(state, { timeout });
            console.log('✅ Estado atingido');
            return { success: true };
        } catch (error) {
            console.error('❌ Timeout ao aguardar estado:', error.message);
            this.metrics.errors++;
            throw error;
        }
    }

    /**
     * Extrair dados estruturados (NOVO)
     */
    async extractStructured(sessionId, type = 'products') {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`📊 Extraindo dados estruturados: ${type}`);

        try {
            let data;

            switch (type) {
                case 'products':
                    data = await page.evaluate(() => {
                        const products = [];
                        
                        // Tentar múltiplos seletores comuns de e-commerce
                        const selectors = [
                            '.ui-search-result',           // Mercado Livre
                            '.s-result-item',              // Amazon
                            '.product-card',               // Genérico
                            '[data-product-id]',           // Genérico
                            '.item',                       // Genérico
                            '[data-testid="product"]',     // Genérico
                        ];

                        let productElements = [];
                        for (const selector of selectors) {
                            productElements = document.querySelectorAll(selector);
                            if (productElements.length > 0) {
                                console.log(`Encontrados ${productElements.length} produtos com seletor: ${selector}`);
                                break;
                            }
                        }

                        productElements.forEach((el, index) => {
                            if (index >= 50) return; // Limitar a 50 produtos

                            // Extrair informações com múltiplos seletores
                            const titleEl = el.querySelector('h2, h3, .product-title, [class*="title"], .ui-search-item__title');
                            const priceEl = el.querySelector('.price, [class*="price"], .andes-money-amount, [class*="Price"]');
                            const linkEl = el.querySelector('a');
                            const imageEl = el.querySelector('img');

                            if (titleEl || priceEl) {
                                products.push({
                                    title: titleEl?.innerText?.trim() || '',
                                    price: priceEl?.innerText?.trim() || '',
                                    link: linkEl?.href || '',
                                    image: imageEl?.src || '',
                                });
                            }
                        });

                        return products;
                    });
                    break;

                case 'articles':
                    data = await page.evaluate(() => {
                        const articles = [];
                        const articleElements = document.querySelectorAll('article, .article, .post, [class*="article"], .entry');

                        articleElements.forEach((el, index) => {
                            if (index >= 20) return;

                            const titleEl = el.querySelector('h1, h2, h3, .title, .entry-title');
                            const excerptEl = el.querySelector('.excerpt, .summary, p');
                            const linkEl = el.querySelector('a');
                            const dateEl = el.querySelector('time, .date, [class*="date"]');

                            if (titleEl) {
                                articles.push({
                                    title: titleEl.innerText.trim(),
                                    excerpt: excerptEl?.innerText?.trim() || '',
                                    link: linkEl?.href || '',
                                    date: dateEl?.innerText?.trim() || '',
                                });
                            }
                        });

                        return articles;
                    });
                    break;

                case 'results':
                    data = await page.evaluate(() => {
                        const results = [];
                        
                        // Seletores para resultados de busca
                        const selectors = [
                            '.result',                    // DuckDuckGo
                            '.g',                         // Google (se funcionar)
                            '.b_algo',                    // Bing
                            '[data-result]',              // Genérico
                            '.search-result',             // Genérico
                        ];

                        let resultElements = [];
                        for (const selector of selectors) {
                            resultElements = document.querySelectorAll(selector);
                            if (resultElements.length > 0) {
                                console.log(`Encontrados ${resultElements.length} resultados com seletor: ${selector}`);
                                break;
                            }
                        }

                        resultElements.forEach((el, index) => {
                            if (index >= 20) return;

                            const titleEl = el.querySelector('h2, h3, .result__title, .result__a');
                            const snippetEl = el.querySelector('.result__snippet, .b_caption, .VwiC3b, p');
                            const linkEl = el.querySelector('a');

                            if (titleEl) {
                                results.push({
                                    title: titleEl.innerText.trim(),
                                    snippet: snippetEl?.innerText?.trim() || '',
                                    url: linkEl?.href || '',
                                });
                            }
                        });

                        return results;
                    });
                    break;

                default:
                    throw new Error(`Tipo não suportado: ${type}`);
            }

            console.log(`✅ ${data.length} itens extraídos (tipo: ${type})`);
            
            // Atualizar métricas
            this.metrics.totalExtractions++;
            
            return data;
        } catch (error) {
            console.error('❌ Erro ao extrair dados estruturados:', error.message);
            this.metrics.errors++;
            throw error;
        }
    }

    /**
     * Fechar sessão
     */
    async closeSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;

        const { page, createdAt } = session;

        try {
            await page.close();
            this.activeSessions.delete(sessionId);

            // Atualizar métricas
            this.metrics.closedSessions++;
            this.metrics.activeSessions = this.activeSessions.size;

            const duration = Date.now() - createdAt;
            const avgDuration = this.metrics.avgSessionDuration;
            this.metrics.avgSessionDuration = (avgDuration * (this.metrics.closedSessions - 1) + duration) / this.metrics.closedSessions;

            console.log(`🗑️ Sessão fechada: ${sessionId} (duração: ${Math.round(duration / 1000)}s)`);
        } catch (error) {
            console.error('❌ Erro ao fechar sessão:', error.message);
            this.metrics.errors++;
        }
    }

    /**
     * Limpar sessões inativas (> 5 minutos)
     */
    async cleanupInactiveSessions() {
        const now = Date.now();
        const timeout = 5 * 60 * 1000; // 5 minutos
        let cleaned = 0;

        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (now - session.lastActivity > timeout) {
                console.log(`🧹 Limpando sessão inativa: ${sessionId}`);
                await this.closeSession(sessionId);
                cleaned++;
            }
        }

        // Limpar screenshots expirados
        for (const [key, cache] of this.screenshotCache.entries()) {
            if (now > cache.expires) {
                this.screenshotCache.delete(key);
            }
        }

        if (cleaned > 0) {
            console.log(`✅ ${cleaned} sessões inativas limpas`);
        }
    }

    /**
     * Fechar navegador
     */
    async close() {
        if (!this.browser) return;

        console.log('🔒 Fechando navegador...');

        // Fechar todas as sessões
        for (const sessionId of this.activeSessions.keys()) {
            await this.closeSession(sessionId);
        }

        await this.browser.close();
        this.browser = null;
        this.context = null;

        console.log('✅ Navegador fechado');
    }

    /**
     * Estatísticas detalhadas
     */
    getStats() {
        return {
            sessions: {
                active: this.activeSessions.size,
                max: this.maxSessions,
                total: this.metrics.totalSessions,
                closed: this.metrics.closedSessions,
                avgDuration: Math.round(this.metrics.avgSessionDuration / 1000) // segundos
            },
            operations: {
                navigations: this.metrics.totalNavigations,
                screenshots: this.metrics.totalScreenshots,
                extractions: this.metrics.totalExtractions,
                searches: this.metrics.totalSearches,
                errors: this.metrics.errors
            },
            cache: {
                screenshots: this.screenshotCache.size
            },
            activeSessions: Array.from(this.activeSessions.entries()).map(([id, session]) => ({
                id,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                age: Math.round((Date.now() - session.createdAt) / 1000), // segundos
                navigations: session.navigations,
                screenshots: session.screenshots,
                extractions: session.extractions
            }))
        };
    }
}

// Instância singleton
const browserService = new BrowserService();

// Cleanup automático a cada 5 minutos
setInterval(() => {
    browserService.cleanupInactiveSessions();
}, 5 * 60 * 1000);

export { browserService, BrowserService };
