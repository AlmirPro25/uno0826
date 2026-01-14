/**
 * 🛍️ PRODUCT EXTRACTOR
 * Extrai produtos REAIS com preços, títulos e links
 * Não essa merda de screenshot e texto vago
 */

/**
 * Extrair produtos de uma página
 */
export function extractProducts(html, url, siteName) {
    const products = [];
    
    // Padrões de extração por site
    const extractors = {
        'Magazine Luiza': extractMagalu,
        'Americanas': extractAmericanas,
        'Casas Bahia': extractCasasBahia,
        'Extra': extractExtra,
        'Mercado Livre': extractMercadoLivre,
        'Amazon Brasil': extractAmazon,
    };
    
    const extractor = extractors[siteName];
    if (extractor) {
        return extractor(html, url);
    }
    
    // Fallback: extração genérica
    return extractGeneric(html, url);
}

/**
 * Magazine Luiza
 */
function extractMagalu(html, baseUrl) {
    const products = [];
    
    // Regex para produtos do Magalu
    const productRegex = /<li[^>]*data-testid="product-card"[^>]*>([\s\S]*?)<\/li>/gi;
    const titleRegex = /<h2[^>]*>(.*?)<\/h2>/i;
    const priceRegex = /<p[^>]*data-testid="price-value"[^>]*>(.*?)<\/p>/i;
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>/i;
    const imageRegex = /<img[^>]*src="([^"]*)"[^>]*>/i;
    
    let match;
    while ((match = productRegex.exec(html)) !== null) {
        const cardHtml = match[1];
        
        const titleMatch = titleRegex.exec(cardHtml);
        const priceMatch = priceRegex.exec(cardHtml);
        const linkMatch = linkRegex.exec(cardHtml);
        const imageMatch = imageRegex.exec(cardHtml);
        
        if (titleMatch && priceMatch) {
            products.push({
                title: cleanText(titleMatch[1]),
                price: cleanPrice(priceMatch[1]),
                priceRaw: extractNumber(priceMatch[1]),
                url: linkMatch ? normalizeUrl(linkMatch[1], baseUrl) : baseUrl,
                image: imageMatch ? imageMatch[1] : null,
                store: 'Magazine Luiza',
                storeIcon: '🛒'
            });
        }
    }
    
    return products;
}

/**
 * Americanas
 */
function extractAmericanas(html, baseUrl) {
    const products = [];
    
    const productRegex = /<div[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const titleRegex = /<h3[^>]*>(.*?)<\/h3>/i;
    const priceRegex = /R\$\s*([\d.,]+)/i;
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>/i;
    
    let match;
    while ((match = productRegex.exec(html)) !== null) {
        const cardHtml = match[1];
        
        const titleMatch = titleRegex.exec(cardHtml);
        const priceMatch = priceRegex.exec(cardHtml);
        const linkMatch = linkRegex.exec(cardHtml);
        
        if (titleMatch && priceMatch) {
            products.push({
                title: cleanText(titleMatch[1]),
                price: `R$ ${priceMatch[1]}`,
                priceRaw: extractNumber(priceMatch[1]),
                url: linkMatch ? normalizeUrl(linkMatch[1], baseUrl) : baseUrl,
                image: null,
                store: 'Americanas',
                storeIcon: '🛍️'
            });
        }
    }
    
    return products;
}

/**
 * Casas Bahia
 */
function extractCasasBahia(html, baseUrl) {
    const products = [];
    
    const priceRegex = /R\$\s*([\d.,]+)/gi;
    const titleRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
    
    const prices = [];
    const titles = [];
    
    let match;
    while ((match = priceRegex.exec(html)) !== null) {
        prices.push(match[1]);
    }
    
    while ((match = titleRegex.exec(html)) !== null) {
        const title = cleanText(match[1]);
        if (title.length > 10 && title.length < 200) {
            titles.push(title);
        }
    }
    
    const count = Math.min(titles.length, prices.length);
    for (let i = 0; i < count; i++) {
        products.push({
            title: titles[i],
            price: `R$ ${prices[i]}`,
            priceRaw: extractNumber(prices[i]),
            url: baseUrl,
            image: null,
            store: 'Casas Bahia',
            storeIcon: '🏠'
        });
    }
    
    return products;
}

/**
 * Extra
 */
function extractExtra(html, baseUrl) {
    return extractCasasBahia(html, baseUrl).map(p => ({
        ...p,
        store: 'Extra',
        storeIcon: '🛒'
    }));
}

/**
 * Mercado Livre
 */
function extractMercadoLivre(html, baseUrl) {
    const products = [];
    
    const productRegex = /<li[^>]*class="[^"]*ui-search-layout__item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
    const titleRegex = /<h2[^>]*>(.*?)<\/h2>/i;
    const priceRegex = /<span[^>]*class="[^"]*price-tag-amount[^"]*"[^>]*>(.*?)<\/span>/i;
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>/i;
    
    let match;
    while ((match = productRegex.exec(html)) !== null) {
        const cardHtml = match[1];
        
        const titleMatch = titleRegex.exec(cardHtml);
        const priceMatch = priceRegex.exec(cardHtml);
        const linkMatch = linkRegex.exec(cardHtml);
        
        if (titleMatch && priceMatch) {
            products.push({
                title: cleanText(titleMatch[1]),
                price: cleanPrice(priceMatch[1]),
                priceRaw: extractNumber(priceMatch[1]),
                url: linkMatch ? linkMatch[1] : baseUrl,
                image: null,
                store: 'Mercado Livre',
                storeIcon: '💛'
            });
        }
    }
    
    return products;
}

/**
 * Amazon
 */
function extractAmazon(html, baseUrl) {
    const products = [];
    
    const productRegex = /<div[^>]*data-component-type="s-search-result"[^>]*>([\s\S]*?)<\/div>/gi;
    const titleRegex = /<span[^>]*class="[^"]*a-text-normal[^"]*"[^>]*>(.*?)<\/span>/i;
    const priceRegex = /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>(.*?)<\/span>/i;
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>/i;
    
    let match;
    while ((match = productRegex.exec(html)) !== null) {
        const cardHtml = match[1];
        
        const titleMatch = titleRegex.exec(cardHtml);
        const priceMatch = priceRegex.exec(cardHtml);
        const linkMatch = linkRegex.exec(cardHtml);
        
        if (titleMatch && priceMatch) {
            products.push({
                title: cleanText(titleMatch[1]),
                price: `R$ ${priceMatch[1]}`,
                priceRaw: extractNumber(priceMatch[1]),
                url: linkMatch ? normalizeUrl(linkMatch[1], 'https://www.amazon.com.br') : baseUrl,
                image: null,
                store: 'Amazon',
                storeIcon: '📦'
            });
        }
    }
    
    return products;
}

/**
 * Extração genérica (fallback)
 */
function extractGeneric(html, baseUrl) {
    const products = [];
    
    // Procurar por padrões de preço
    const priceRegex = /R\$\s*([\d.,]+)/gi;
    const prices = [];
    
    let match;
    while ((match = priceRegex.exec(html)) !== null) {
        const price = extractNumber(match[1]);
        if (price > 10 && price < 50000) { // Filtro de preços razoáveis
            prices.push({
                price: `R$ ${match[1]}`,
                priceRaw: price
            });
        }
    }
    
    // Pegar apenas os primeiros 10
    return prices.slice(0, 10).map((p, i) => ({
        title: `Produto ${i + 1}`,
        price: p.price,
        priceRaw: p.priceRaw,
        url: baseUrl,
        image: null,
        store: 'Loja',
        storeIcon: '🛒'
    }));
}

/**
 * Utilitários
 */
function cleanText(text) {
    return text
        .replace(/<[^>]*>/g, '') // Remove HTML
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanPrice(price) {
    const cleaned = price.replace(/<[^>]*>/g, '').trim();
    if (cleaned.startsWith('R$')) return cleaned;
    return `R$ ${cleaned}`;
}

function extractNumber(price) {
    const cleaned = price.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function normalizeUrl(url, baseUrl) {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) {
        const base = new URL(baseUrl);
        return `${base.protocol}//${base.host}${url}`;
    }
    return url;
}

/**
 * Comparar produtos e encontrar melhores ofertas
 */
export function compareProducts(allProducts) {
    if (allProducts.length === 0) return null;
    
    // Agrupar por título similar
    const groups = {};
    
    allProducts.forEach(product => {
        const key = normalizeTitle(product.title);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(product);
    });
    
    // Encontrar melhor preço de cada grupo
    const bestDeals = [];
    
    Object.values(groups).forEach(group => {
        if (group.length > 1) {
            // Ordenar por preço
            group.sort((a, b) => a.priceRaw - b.priceRaw);
            
            const cheapest = group[0];
            const mostExpensive = group[group.length - 1];
            const savings = mostExpensive.priceRaw - cheapest.priceRaw;
            
            if (savings > 10) { // Economia mínima de R$ 10
                bestDeals.push({
                    product: cheapest.title,
                    cheapest: {
                        store: cheapest.store,
                        price: cheapest.price,
                        url: cheapest.url
                    },
                    mostExpensive: {
                        store: mostExpensive.store,
                        price: mostExpensive.price
                    },
                    savings: `R$ ${savings.toFixed(2)}`,
                    savingsPercent: ((savings / mostExpensive.priceRaw) * 100).toFixed(0)
                });
            }
        }
    });
    
    return {
        totalProducts: allProducts.length,
        uniqueProducts: Object.keys(groups).length,
        bestDeals: bestDeals.slice(0, 5), // Top 5 ofertas
        cheapest: allProducts.sort((a, b) => a.priceRaw - b.priceRaw)[0],
        mostExpensive: allProducts.sort((a, b) => b.priceRaw - a.priceRaw)[0],
        averagePrice: (allProducts.reduce((sum, p) => sum + p.priceRaw, 0) / allProducts.length).toFixed(2)
    };
}

function normalizeTitle(title) {
    return title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .slice(0, 3) // Primeiras 3 palavras
        .join(' ');
}
