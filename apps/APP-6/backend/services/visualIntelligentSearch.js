/**
 * 🔍👁️ VISUAL INTELLIGENT SEARCH SERVICE
 * Sistema unificado de busca com navegação visual e síntese inteligente
 * 
 * FEATURES:
 * - Busca massiva em 10+ sites simultaneamente
 * - Navegação inteligente nas páginas
 * - Captura de screenshots para análise visual
 * - Extração de texto e imagens
 * - Síntese com Gemini usando visão multimodal
 */

import { browserService } from './browserService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
} catch (error) {
    console.error('❌ Erro ao carregar sites:', error.message);
    TRUSTED_SITES = { news_brazil: [], search_engines: [], ecommerce_brazil: [] };
}

/**
 * 🧠 Detectar intenção do usuário
 */
function detectIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    // Produtos/Compras
    if (/comprar|preço|quanto custa|valor|loja|oferta|promoção|desconto|barato|produto/i.test(query)) {
        return 'products';
    }
    
    // Notícias
    if (/notícia|notícias|aconteceu|hoje|últimas|breaking|news|atual/i.test(query)) {
        return 'news';
    }
    
    // Informação geral
    return 'general';
}

/**
 * 🎯 Selecionar sites baseado na intenção
 */
function selectSitesForIntent(query, intent, maxSites = 5) {
    let selectedSites = [];
    
    if (intent === 'products') {
        // E-commerce brasileiro
        selectedSites = [
            { name: 'Mercado Livre', url: 'https://lista.mercadolivre.com.br/' + encodeURIComponent(query), priority: 1 },
            { name: 'Amazon', url: 'https://www.amazon.com.br/s?k=' + encodeURIComponent(query), priority: 1 },
            { name: 'Magazine Luiza', url: 'https://www.magazineluiza.com.br/busca/' + encodeURIComponent(query), priority: 2 },
            { name: 'Americanas', url: 'https://www.americanas.com.br/busca/' + encodeURIComponent(query), priority: 2 },
            { name: 'Casas Bahia', url: 'https://www.casasbahia.com.br/busca/' + encodeURIComponent(query), priority: 3 }
        ];
    } else if (intent === 'news') {
        // Sites de notícias
        selectedSites = [
            { name: 'G1', url: 'https://g1.globo.com/busca/?q=' + encodeURIComponent(query), priority: 1 },
            { name: 'UOL', url: 'https://busca.uol.com.br/uol/index.html?q=' + encodeURIComponent(query), priority: 1 },
            { name: 'Folha', url: 'https://search.folha.uol.com.br/?q=' + encodeURIComponent(query), priority: 2 },
            { name: 'Estadão', url: 'https://www.estadao.com.br/busca/?q=' + encodeURIComponent(query), priority: 2 },
            { name: 'BBC Brasil', url: 'https://www.bbc.com/portuguese/topics/c2dwqd1z721t', priority: 3 }
        ];
    } else {
        // Busca geral - usar buscadores
        selectedSites = [
            { name: 'Bing', url: 'https://www.bing.com/search?q=' + encodeURIComponent(query), priority: 1 },
            { name: 'Startpage', url: 'https://www.startpage.com/do/search?q=' + encodeURIComponent(query), priority: 1 },
            { name: 'Wikipedia', url: 'https://pt.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(query), priority: 2 },
            { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' + encodeURIComponent(query), priority: 2 },
            { name: 'Brave', url: 'https://search.brave.com/search?q=' + encodeURIComponent(query), priority: 3 }
        ];
    }
    
    return selectedSites.slice(0, maxSites);
}

/**
 * 🌐 Navegar em um site e capturar dados visuais
 */
async function navigateAndCapture(site, timeout = 30000) {
    const sessionId = `visual_${site.name}_${Date.now()}`;
    
    try {
        console.log(`🌐 [${site.name}] Navegando...`);
        
        // Criar sessão
        await browserService.createSession(sessionId);
        
        // Navegar
        await browserService.navigate(sessionId, site.url, { timeout });
        
        // Aguardar carregamento
        await browserService.waitForLoadState(sessionId, 'networkidle', timeout);
        
        // 📸 CAPTURAR SCREENSHOT
        console.log(`📸 [${site.name}] Capturando screenshot...`);
        const screenshot = await browserService.captureScreenshot(sessionId, {
            fullPage: false, // Apenas viewport visível
            type: 'png'
        });
        
        // 📝 EXTRAIR CONTEÚDO
        console.log(`📝 [${site.name}] Extraindo conteúdo...`);
        const content = await browserService.extractContent(sessionId, {
            includeText: true,
            includeLinks: true,
            includeImages: true,
            maxLinks: 10
        });
        
        // Fechar sessão
        await browserService.closeSession(sessionId);
        
        console.log(`✅ [${site.name}] Captura concluída`);
        
        return {
            site: site.name,
            url: site.url,
            success: true,
            screenshot: screenshot.data, // Base64
            content: {
                text: content.text?.substring(0, 5000) || '', // Limitar texto
                links: content.links?.slice(0, 10) || [],
                images: content.images?.slice(0, 5) || []
            }
        };
        
    } catch (error) {
        console.error(`❌ [${site.name}] Erro:`, error.message);
        
        // Tentar fechar sessão
        try {
            await browserService.closeSession(sessionId);
        } catch (e) {
            // Ignorar
        }
        
        return {
            site: site.name,
            url: site.url,
            success: false,
            error: error.message
        };
    }
}

/**
 * 🧠 Sintetizar resultados com Gemini usando visão multimodal
 */
async function synthesizeWithVision(query, intent, capturedData, apiKey) {
    try {
        console.log('🧠 Sintetizando com Gemini Vision...');
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
        // Preparar partes do prompt (texto + imagens)
        const parts = [];
        
        // 1. PROMPT PRINCIPAL
        let mainPrompt = `Você é um assistente de busca inteligente e prestativo. Analise as capturas de tela e conteúdos extraídos dos sites abaixo e crie uma resposta NATURAL, PROFISSIONAL e EXTREMAMENTE ÚTIL.

**PERGUNTA DO USUÁRIO:**
"${query}"

**TIPO DE BUSCA:** ${intent === 'products' ? 'Produtos/Compras' : intent === 'news' ? 'Notícias' : 'Informação Geral'}

**SITES ANALISADOS:**
`;

        // 2. ADICIONAR DADOS DE CADA SITE
        capturedData.forEach((data, index) => {
            if (data.success) {
                mainPrompt += `\n### Site ${index + 1}: ${data.site}\n`;
                mainPrompt += `URL: ${data.url}\n`;
                
                // Adicionar texto extraído
                if (data.content.text) {
                    mainPrompt += `\nTexto extraído:\n${data.content.text.substring(0, 1000)}...\n`;
                }
                
                // Adicionar links
                if (data.content.links && data.content.links.length > 0) {
                    mainPrompt += `\nLinks encontrados:\n`;
                    data.content.links.slice(0, 5).forEach(link => {
                        mainPrompt += `- ${link.text}: ${link.href}\n`;
                    });
                }
                
                mainPrompt += `\n(Veja a captura de tela abaixo)\n`;
            }
        });
        
        // 3. INSTRUÇÕES ESPECÍFICAS POR TIPO
        if (intent === 'products') {
            mainPrompt += `\n**INSTRUÇÕES PARA PRODUTOS:**
- Identifique os produtos nas imagens
- Compare preços se visíveis
- Destaque as melhores ofertas
- Mencione lojas e condições (frete, parcelamento)
- Forneça links diretos para os produtos
- Seja específico sobre o que você vê nas capturas
- Adicione seção "🚀 Próximos Passos" com checklist acionável`;
        } else if (intent === 'news') {
            mainPrompt += `\n**INSTRUÇÕES PARA NOTÍCIAS:**
- Resuma as principais notícias visíveis
- Mencione as fontes
- Destaque informações importantes
- Organize cronologicamente se possível
- Forneça links para as notícias completas
- Adicione contexto relevante`;
        } else {
            mainPrompt += `\n**INSTRUÇÕES GERAIS:**
- Sintetize as informações mais relevantes
- Organize por tópicos se necessário
- Cite as fontes com links clicáveis
- Forneça links úteis
- Seja claro e objetivo
- Adicione seção "🚀 Próximos Passos" com ações práticas
- Se houver contatos/telefones relevantes, inclua seção "📞 Contatos Úteis"`;
        }
        
        mainPrompt += `\n\n**FORMATO DA RESPOSTA:**
- Use tom conversacional e natural
- Comece com uma introdução amigável
- Organize informações em seções claras
- Use Markdown para formatação
- Inclua emojis com moderação
- **SEMPRE inclua seção "📚 Fontes Consultadas" com links clicáveis no formato:**
  [1] [Título do Site](URL_REAL)
  [2] [Título do Site](URL_REAL)
- **Se relevante, inclua seção "🚀 Próximos Passos" com checklist:**
  1. [ ] Ação específica 1
  2. [ ] Ação específica 2
- **Se houver contatos, inclua seção "📞 Contatos Úteis"**
- Termine com sugestão ou pergunta engajadora

**IMPORTANTE:** 
1. Analise TODAS as capturas de tela fornecidas
2. Extraia informações visuais (preços, títulos, imagens, etc)
3. Use URLs REAIS dos sites analisados (não invente links)
4. Seja EXTREMAMENTE prático e acionável

**SUA RESPOSTA COMPLETA:**`;

        parts.push({ text: mainPrompt });
        
        // 4. ADICIONAR SCREENSHOTS
        capturedData.forEach((data, index) => {
            if (data.success && data.screenshot) {
                parts.push({
                    inlineData: {
                        mimeType: 'image/png',
                        data: data.screenshot
                    }
                });
                parts.push({ text: `\n[Screenshot do ${data.site}]\n` });
            }
        });
        
        // 5. GERAR RESPOSTA
        console.log(`🧠 Enviando ${parts.length} partes para o Gemini (texto + ${capturedData.filter(d => d.success).length} screenshots)...`);
        
        const result = await model.generateContent(parts);
        const response = result.response;
        const text = response.text();
        
        console.log('✅ Síntese concluída');
        
        return text;
        
    } catch (error) {
        console.error('❌ Erro ao sintetizar:', error);
        throw error;
    }
}

/**
 * 🚀 BUSCA VISUAL INTELIGENTE COMPLETA
 */
export async function visualIntelligentSearch(query, options = {}) {
    const startTime = Date.now();
    
    const {
        maxSites = 5,
        timeout = 30000,
        apiKey = process.env.GEMINI_API_KEY
    } = options;
    
    console.log(`\n🔍👁️ ========== BUSCA VISUAL INTELIGENTE ==========`);
    console.log(`📝 Query: "${query}"`);
    console.log(`🌐 Sites: ${maxSites}`);
    console.log(`⏱️  Timeout: ${timeout}ms`);
    
    try {
        // 1. DETECTAR INTENÇÃO
        const intent = detectIntent(query);
        console.log(`🎯 Intenção: ${intent}`);
        
        // 2. SELECIONAR SITES
        const sites = selectSitesForIntent(query, intent, maxSites);
        console.log(`📋 Sites selecionados: ${sites.map(s => s.name).join(', ')}`);
        
        // 3. NAVEGAR E CAPTURAR (PARALELO)
        console.log(`\n🌐 Iniciando navegação paralela...`);
        const capturePromises = sites.map(site => navigateAndCapture(site, timeout));
        const capturedData = await Promise.all(capturePromises);
        
        // 4. FILTRAR SUCESSOS
        const successfulCaptures = capturedData.filter(d => d.success);
        const failedCaptures = capturedData.filter(d => !d.success);
        
        console.log(`\n📊 Capturas: ${successfulCaptures.length} sucesso, ${failedCaptures.length} falhas`);
        
        if (successfulCaptures.length === 0) {
            throw new Error('Nenhum site foi capturado com sucesso');
        }
        
        // 5. SINTETIZAR COM GEMINI VISION
        console.log(`\n🧠 Sintetizando resultados...`);
        const synthesizedResponse = await synthesizeWithVision(query, intent, successfulCaptures, apiKey);
        
        const duration = Date.now() - startTime;
        
        console.log(`\n✅ ========== BUSCA CONCLUÍDA ==========`);
        console.log(`⏱️  Duração: ${Math.round(duration / 1000)}s`);
        console.log(`📊 Sites analisados: ${successfulCaptures.length}`);
        console.log(`📸 Screenshots capturados: ${successfulCaptures.length}`);
        console.log(`==========================================\n`);
        
        return {
            success: true,
            query,
            intent,
            response: synthesizedResponse,
            sites: successfulCaptures.map(d => ({
                name: d.site,
                url: d.url,
                screenshot: d.screenshot // Base64 PNG
            })),
            screenshots: successfulCaptures.map(d => ({
                site: d.site,
                url: d.url,
                data: d.screenshot, // Base64 PNG para exibição
                mimeType: 'image/png'
            })),
            stats: {
                totalSites: sites.length,
                successfulSites: successfulCaptures.length,
                failedSites: failedCaptures.length,
                duration
            },
            metadata: {
                capturedData: successfulCaptures.map(d => ({
                    site: d.site,
                    url: d.url,
                    linksCount: d.content.links.length,
                    imagesCount: d.content.images.length,
                    textLength: d.content.text.length
                }))
            }
        };
        
    } catch (error) {
        console.error('❌ Erro na busca visual:', error);
        
        return {
            success: false,
            query,
            error: error.message,
            duration: Date.now() - startTime
        };
    }
}

export default {
    visualIntelligentSearch
};
