/**
 * 🔍 ENHANCED SEARCH SERVICE
 * Sistema de pesquisa profissional com múltiplas fontes
 */

import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface SearchSource {
    name: string;
    url: string;
    category: 'general' | 'shopping' | 'news' | 'tech' | 'social';
}

export interface EnhancedSearchResult {
    title: string;
    snippet: string;
    url: string;
    source: string;
    category: string;
    price?: string; // Para produtos
    rating?: number; // Para produtos
    date?: string; // Para notícias
}

// Sites especializados para diferentes tipos de pesquisa
const SPECIALIZED_SOURCES = {
    shopping: [
        'amazon.com.br',
        'mercadolivre.com.br',
        'magazineluiza.com.br',
        'americanas.com',
        'casasbahia.com.br',
        'extra.com.br',
        'submarino.com.br',
        'shopee.com.br',
        'aliexpress.com'
    ],
    news: [
        'g1.globo.com',
        'uol.com.br',
        'folha.uol.com.br',
        'estadao.com.br',
        'bbc.com/portuguese',
        'cnn.com.br',
        'reuters.com',
        'tecmundo.com.br'
    ],
    tech: [
        'github.com',
        'stackoverflow.com',
        'dev.to',
        'medium.com',
        'techcrunch.com',
        'theverge.com',
        'arstechnica.com',
        'canaltech.com.br'
    ],
    social: [
        'reddit.com',
        'twitter.com',
        'youtube.com',
        'instagram.com',
        'linkedin.com'
    ]
};

/**
 * Detecta o tipo de pesquisa baseado na query
 */
export function detectSearchType(query: string): 'shopping' | 'news' | 'tech' | 'general' {
    const lowerQuery = query.toLowerCase();
    
    // Palavras-chave para compras
    const shoppingKeywords = [
        'comprar', 'preço', 'barato', 'promoção', 'desconto', 'oferta',
        'quanto custa', 'onde comprar', 'melhor preço', 'loja', 'produto',
        'buy', 'price', 'cheap', 'deal', 'discount', 'shop', 'tv', 'notebook',
        'celular', 'smartphone', 'geladeira', 'fogão', 'microondas'
    ];
    
    // Palavras-chave para notícias
    const newsKeywords = [
        'notícia', 'hoje', 'aconteceu', 'últimas', 'breaking', 'news',
        'atualidade', 'recente', 'agora', 'atual'
    ];
    
    // Palavras-chave para tech
    const techKeywords = [
        'código', 'programação', 'desenvolver', 'api', 'framework',
        'biblioteca', 'tutorial', 'como fazer', 'code', 'programming',
        'developer', 'github', 'npm', 'python', 'javascript', 'react'
    ];
    
    if (shoppingKeywords.some(kw => lowerQuery.includes(kw))) {
        return 'shopping';
    }
    
    if (newsKeywords.some(kw => lowerQuery.includes(kw))) {
        return 'news';
    }
    
    if (techKeywords.some(kw => lowerQuery.includes(kw))) {
        return 'tech';
    }
    
    return 'general';
}

/**
 * Otimiza a query baseado no tipo de pesquisa (sem usar IA para evitar erros 503)
 */
function optimizeQueryByType(
    userQuery: string,
    searchType: 'shopping' | 'news' | 'tech' | 'general'
): string[] {
    const queries: string[] = [userQuery];
    
    try {
        switch (searchType) {
            case 'shopping':
                queries.push(`${userQuery} preço`);
                queries.push(`comprar ${userQuery}`);
                queries.push(`${userQuery} barato`);
                break;
                
            case 'news':
                queries.push(`notícias ${userQuery}`);
                queries.push(`${userQuery} hoje`);
                queries.push(`últimas ${userQuery}`);
                break;
                
            case 'tech':
                queries.push(`${userQuery} tutorial`);
                queries.push(`${userQuery} documentation`);
                queries.push(`how to ${userQuery}`);
                break;
                
            default:
                // Para pesquisa geral, apenas usa a query original
                break;
        }
        
        return queries.slice(0, 3);
    } catch (error) {
        console.error('Erro ao otimizar query:', error);
        return [userQuery];
    }
}

/**
 * Adiciona filtros de site específicos à query
 */
function addSiteFilters(query: string, searchType: string): string {
    const sources = SPECIALIZED_SOURCES[searchType as keyof typeof SPECIALIZED_SOURCES];
    
    if (!sources || sources.length === 0) {
        return query;
    }
    
    // Adiciona filtro de sites (DuckDuckGo suporta site:)
    const siteFilter = sources.slice(0, 3).map(site => `site:${site}`).join(' OR ');
    return `${query} (${siteFilter})`;
}

/**
 * Realiza pesquisa inteligente com múltiplas fontes (SEM DuckDuckGo)
 */
async function searchWithBackend(query: string): Promise<EnhancedSearchResult[]> {
    try {
        console.log('🔍 Buscando em múltiplas fontes:', query);
        
        const response = await fetch('http://localhost:3002/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ ${data.results?.length || 0} resultados de ${data.sources?.join(', ') || 'fontes desconhecidas'}`);
        
        return (data.results || []).map((r: any) => ({
            ...r,
            source: r.source || new URL(r.url).hostname,
            category: 'general'
        }));
    } catch (error) {
        console.error('Erro ao buscar:', error);
        return [];
    }
}

/**
 * Pesquisa inteligente com múltiplas fontes
 */
export async function enhancedSearch(userQuery: string): Promise<EnhancedSearchResult[]> {
    console.log('🔍 Pesquisa inteligente iniciada:', userQuery);
    
    // 1. Detectar tipo de pesquisa
    const searchType = detectSearchType(userQuery);
    console.log('📊 Tipo detectado:', searchType);
    
    // 2. Otimizar queries (agora síncrono, sem IA)
    const optimizedQueries = optimizeQueryByType(userQuery, searchType);
    console.log('🎯 Queries otimizadas:', optimizedQueries);
    
    // 3. Pesquisar com cada query
    let allResults: EnhancedSearchResult[] = [];
    
    for (const query of optimizedQueries) {
        // Adicionar filtros de site se for pesquisa especializada
        const filteredQuery = searchType !== 'general' 
            ? addSiteFilters(query, searchType)
            : query;
        
        console.log('🔎 Buscando:', filteredQuery);
        const results = await searchWithBackend(filteredQuery);
        
        // Marcar categoria
        results.forEach(r => r.category = searchType);
        
        allResults.push(...results);
        
        if (allResults.length >= 10) break;
    }
    
    // 4. Remover duplicatas
    const uniqueResults = Array.from(
        new Map(allResults.map(r => [r.url, r])).values()
    );
    
    console.log(`✅ ${uniqueResults.length} resultados únicos encontrados`);
    
    return uniqueResults;
}

/**
 * Gera resposta enriquecida com contexto de pesquisa
 */
export async function generateEnhancedResponse(
    userQuery: string,
    systemInstruction?: string
): Promise<string> {
    try {
        // Detectar tipo primeiro
        const searchType: 'shopping' | 'news' | 'tech' | 'general' = detectSearchType(userQuery);
        
        // Se for pesquisa de produtos, usar API especializada
        if (searchType === 'shopping') {
            return await generateProductResponse(userQuery, systemInstruction);
        }
        
        // Para outros tipos, usar busca web normal
        const results = await enhancedSearch(userQuery);
        
        if (results.length === 0) {
            return "😕 Não encontrei resultados relevantes. Tente reformular sua pergunta ou seja mais específico.";
        }
        
        // Criar contexto rico
        const webContext = results
            .slice(0, 8)
            .map((r, i) => {
                let extra = '';
                if (r.price) extra += ` | 💰 ${r.price}`;
                if (r.rating) extra += ` | ⭐ ${r.rating}`;
                if (r.date) extra += ` | 📅 ${r.date}`;
                
                return `**[${i + 1}] ${r.title}**${extra}\n${r.snippet}\n🔗 ${r.url}\n📍 Fonte: ${r.source}`;
            })
            .join('\n\n');
        
        // Prompt personalizado por tipo
        let specificInstructions = '';
        
        if (searchType === 'news') {
            specificInstructions = `
**INSTRUÇÕES ESPECIAIS - NOTÍCIAS:**
- Resuma os principais pontos
- Mencione a data das notícias
- Compare diferentes fontes se houver
- Indique se há consenso ou divergência
- Seja objetivo e imparcial`;
        } else if (searchType === 'tech') {
            specificInstructions = `
**INSTRUÇÕES ESPECIAIS - TECNOLOGIA:**
- Forneça exemplos de código se relevante
- Explique conceitos técnicos claramente
- Mencione versões/compatibilidade
- Sugira melhores práticas
- Inclua links para documentação oficial`;
        }
        
        const enhancedPrompt = `Você tem acesso aos seguintes resultados de pesquisa web sobre "${userQuery}":

${webContext}

${specificInstructions}

**INSTRUÇÕES GERAIS:**
1. Analise todos os resultados cuidadosamente
2. Sintetize as informações de forma clara e organizada
3. Cite as fontes usando [1], [2], etc.
4. Se houver informações conflitantes, mencione
5. Seja prático e objetivo
6. Use emojis para melhor visualização

**Pergunta:** ${userQuery}

**Resposta Completa:**`;

        let response;
        let retries = 3;
        
        while (retries > 0) {
            try {
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: enhancedPrompt,
                    config: {
                        systemInstruction: systemInstruction || 'Você é um assistente especializado em pesquisas web que fornece respostas precisas, bem organizadas e práticas.',
                        temperature: 0.7,
                        topP: 0.95,
                        maxOutputTokens: 2048
                    }
                });
                break; // Sucesso, sai do loop
            } catch (error: any) {
                retries--;
                if (error?.message?.includes('503') || error?.message?.includes('overloaded')) {
                    if (retries > 0) {
                        console.log(`⚠️ Modelo sobrecarregado, tentando novamente... (${retries} tentativas restantes)`);
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Aguarda 2s
                        continue;
                    }
                }
                throw error; // Se não for 503 ou acabaram as tentativas, lança o erro
            }
        }
        
        if (!response) {
            throw new Error('Falha ao obter resposta após múltiplas tentativas');
        }

        // Adicionar fontes ao final
        let finalResponse = response.text;
        finalResponse += '\n\n---\n**📚 Fontes Consultadas:**\n';
        results.slice(0, 8).forEach((r, i) => {
            finalResponse += `[${i + 1}] [${r.title}](${r.url}) - ${r.source}\n`;
        });
        
        // Adicionar badge do tipo de pesquisa
        const badges = {
            shopping: '🛒 Pesquisa de Produtos',
            news: '📰 Pesquisa de Notícias',
            tech: '💻 Pesquisa Técnica',
            general: '🔍 Pesquisa Geral'
        };
        
        finalResponse += `\n*${badges[searchType]} | ${results.length} fontes analisadas*`;

        return finalResponse;
    } catch (error) {
        console.error('Erro ao gerar resposta:', error);
        return "❌ Ocorreu um erro ao processar sua pesquisa. Por favor, tente novamente.";
    }
}

/**
 * Gera resposta especializada para produtos
 */
async function generateProductResponse(
    userQuery: string,
    systemInstruction?: string
): Promise<string> {
    try {
        console.log('🛒 Pesquisa de produtos detectada');
        
        // Buscar produtos na API
        const response = await fetch('http://localhost:3002/api/products/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: userQuery })
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar produtos');
        }

        const data = await response.json();

        if (!data.products || data.products.length === 0) {
            return "😕 Não encontrei produtos para sua pesquisa. Tente ser mais específico (ex: 'TV LG 43 polegadas').";
        }

        // Formatar resposta
        let formattedResponse = `# 🛒 Encontrei ${data.stats.total} produtos para "${userQuery}"\n\n`;

        // Informações gerais (se houver)
        if (data.info) {
            formattedResponse += `## 📚 Sobre o Produto\n`;
            formattedResponse += `${data.info.snippet}\n`;
            formattedResponse += `[Saiba mais](${data.info.url})\n\n`;
        }

        // Top 5 ofertas
        formattedResponse += `## 🏆 Melhores Ofertas\n\n`;

        data.products.slice(0, 5).forEach((product: any, index: number) => {
            formattedResponse += `### ${index + 1}. ${product.title}\n`;
            
            // Preço
            const priceFormatted = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: product.currency
            }).format(product.price);
            
            formattedResponse += `**💰 ${priceFormatted}**`;
            
            // Desconto
            if (product.originalPrice && product.originalPrice > product.price) {
                const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                const originalFormatted = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: product.currency
                }).format(product.originalPrice);
                formattedResponse += ` ~~${originalFormatted}~~ **(-${discount}%)**`;
            }
            
            formattedResponse += `\n`;
            
            // Parcelamento
            if (product.installments) {
                const installmentPrice = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: product.currency
                }).format(product.installments.amount);
                const rate = product.installments.rate === 0 ? 'sem juros' : 'com juros';
                formattedResponse += `- **Parcelamento**: ${product.installments.quantity}x de ${installmentPrice} ${rate}\n`;
            }
            
            // Frete
            if (product.shipping.free) {
                formattedResponse += `- **Frete**: ✅ Grátis\n`;
            }
            
            // Vendedor
            formattedResponse += `- **Vendedor**: ${product.seller.name}`;
            if (product.seller.reputation) {
                formattedResponse += ` (${product.seller.reputation})`;
            }
            formattedResponse += `\n`;
            
            // Condição
            formattedResponse += `- **Condição**: ${product.condition === 'new' ? 'Novo' : 'Usado'}\n`;
            
            // Link
            formattedResponse += `- **Link**: [Ver produto](${product.url})\n\n`;
        });

        // Análise e recomendação
        const cheapest = data.products[0];
        const withFreeShipping = data.products.filter((p: any) => p.shipping.free);
        
        formattedResponse += `## 💡 Análise e Recomendação\n\n`;
        formattedResponse += `**Melhor preço**: ${cheapest.title} por ${new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: cheapest.currency
        }).format(cheapest.price)}\n\n`;
        
        if (withFreeShipping.length > 0) {
            formattedResponse += `**Com frete grátis**: ${withFreeShipping.length} opções disponíveis\n\n`;
        }

        // Fontes
        formattedResponse += `---\n`;
        formattedResponse += `**📍 Fonte**: ${data.sources.join(', ')}\n`;
        formattedResponse += `**⏰ Atualizado**: ${new Date(data.timestamp).toLocaleString('pt-BR')}\n`;
        
        if (data.fromCache) {
            formattedResponse += `**💾 Cache**: Sim (dados podem ter até 1 hora)\n`;
        }

        return formattedResponse;

    } catch (error) {
        console.error('Erro ao gerar resposta de produtos:', error);
        return "❌ Ocorreu um erro ao buscar produtos. Por favor, tente novamente.";
    }
}

export default {
    enhancedSearch,
    generateEnhancedResponse,
    detectSearchType,
    generateProductResponse
};
