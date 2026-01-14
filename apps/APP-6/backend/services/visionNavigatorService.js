/**
 * 🔍 VISION NAVIGATOR SERVICE
 * Usa capacidade MULTIMODAL do Gemini para analisar screenshots
 * e extrair informações visuais (links, textos, produtos, etc.)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { browserService } from './browserService.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * 🔍 Analisar screenshot com Gemini Vision
 */
export async function analyzeScreenshot(screenshot, query, context = {}) {
    console.log('👁️ Gemini analisando screenshot...');

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `Você é um ANALISADOR VISUAL ESPECIALIZADO. Analise esta captura de tela de uma página de busca.

**CONTEXTO:**
Query de busca: "${query}"
Tipo: ${context.type || 'busca geral'}

**SUA MISSÃO:**
1. IDENTIFIQUE todos os links/resultados visíveis
2. EXTRAIA títulos, URLs e descrições
3. IDENTIFIQUE elementos importantes (preços, datas, imagens)
4. PRIORIZE os resultados mais relevantes

**INSTRUÇÕES:**
- Seja PRECISO ao extrair URLs
- Identifique TODOS os links clicáveis
- Extraia textos importantes
- Identifique padrões (produtos, notícias, etc.)

**FORMATO DE RESPOSTA (JSON):**
{
  "summary": "Resumo do que você vê",
  "results": [
    {
      "title": "Título do resultado",
      "url": "URL completa (se visível)",
      "snippet": "Descrição/snippet",
      "type": "news|product|article|link",
      "relevance": 1-10,
      "metadata": {
        "price": "R$ XX,XX" (se for produto),
        "date": "data" (se for notícia),
        "source": "fonte"
      }
    }
  ],
  "recommendations": [
    "Qual link visitar primeiro",
    "O que fazer em seguida"
  ],
  "visual_elements": {
    "has_products": true/false,
    "has_news": true/false,
    "has_images": true/false,
    "layout": "descrição do layout"
  }
}

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.`;

        const imagePart = {
            inlineData: {
                data: screenshot,
                mimeType: 'image/jpeg'
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response.text();

        // Extrair JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Gemini não retornou JSON válido');
        }

        const analysis = JSON.parse(jsonMatch[0]);
        
        console.log('✅ Análise concluída:');
        console.log(`   Resultados encontrados: ${analysis.results?.length || 0}`);
        console.log(`   Resumo: ${analysis.summary}`);

        return analysis;

    } catch (error) {
        console.error('❌ Erro ao analisar screenshot:', error);
        throw error;
    }
}

/**
 * 🌐 Navegar e analisar com visão
 */
export async function navigateAndAnalyze(url, query, sessionId) {
    console.log(`\n🌐 Navegando e analisando: ${url}`);

    try {
        // 1. Navegar
        await browserService.navigate(sessionId, url, {
            waitUntil: 'networkidle',
            timeout: 60000
        });

        console.log('✅ Página carregada');

        // 2. Aguardar renderização
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3. Tirar screenshot
        const screenshot = await browserService.screenshot(sessionId, {
            type: 'jpeg',
            quality: 80,
            fullPage: false // Apenas viewport visível
        });

        console.log('📸 Screenshot capturado');

        // 4. Extrair conteúdo tradicional (backup)
        const content = await browserService.extractContent(sessionId, {
            includeText: true,
            includeLinks: true,
            maxLinks: 20
        });

        console.log('📝 Conteúdo extraído');

        // 5. Analisar com Gemini Vision
        const analysis = await analyzeScreenshot(screenshot, query, {
            type: 'search_results'
        });

        console.log('👁️ Análise visual concluída');

        return {
            url,
            screenshot,
            content,
            analysis,
            success: true
        };

    } catch (error) {
        console.error('❌ Erro:', error.message);
        return {
            url,
            success: false,
            error: error.message
        };
    }
}

/**
 * 🔄 Navegar em múltiplos links sequencialmente
 */
export async function navigateMultipleLinks(links, query, sessionId, onProgress) {
    console.log(`\n🔄 Navegando em ${links.length} links...`);

    const results = [];

    for (let i = 0; i < links.length; i++) {
        const link = links[i];
        
        if (onProgress) {
            onProgress({
                current: i + 1,
                total: links.length,
                url: link.url || link,
                status: 'navigating'
            });
        }

        console.log(`\n📍 [${i + 1}/${links.length}] ${link.url || link}`);

        try {
            const result = await navigateAndAnalyze(
                link.url || link,
                query,
                sessionId
            );

            results.push(result);

            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: links.length,
                    url: link.url || link,
                    status: result.success ? 'success' : 'error',
                    result
                });
            }

            // Delay entre navegações
            if (i < links.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

        } catch (error) {
            console.error(`❌ Erro no link ${i + 1}:`, error.message);
            results.push({
                url: link.url || link,
                success: false,
                error: error.message
            });
        }
    }

    console.log(`\n✅ Navegação concluída: ${results.filter(r => r.success).length}/${links.length} sucessos`);

    return results;
}

/**
 * 🧠 Workflow completo: Buscar → Analisar → Navegar → Compilar
 */
export async function intelligentSearchAndNavigate(query, options = {}) {
    const {
        searchEngine = 'bing',
        maxLinksToVisit = 5,
        onProgress
    } = options;

    console.log('\n🧠 ========== BUSCA INTELIGENTE COM VISÃO ==========');
    console.log(`📝 Query: "${query}"`);
    console.log(`🔍 Buscador: ${searchEngine}`);
    console.log(`🔗 Links a visitar: ${maxLinksToVisit}`);

    try {
        // 1. Criar sessão
        const sessionId = `vision_${Date.now()}`;
        await browserService.createSession(sessionId);

        if (onProgress) {
            onProgress({ phase: 'search', message: 'Buscando no Bing...' });
        }

        // 2. Buscar no Bing
        const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        const searchResult = await navigateAndAnalyze(searchUrl, query, sessionId);

        if (!searchResult.success) {
            throw new Error('Falha ao buscar no Bing');
        }

        console.log('\n✅ Busca concluída');
        console.log(`   Resultados encontrados: ${searchResult.analysis.results?.length || 0}`);

        if (onProgress) {
            onProgress({ 
                phase: 'analysis', 
                message: `${searchResult.analysis.results?.length || 0} resultados encontrados`,
                searchResult 
            });
        }

        // 3. Selecionar top links para visitar
        const topLinks = (searchResult.analysis.results || [])
            .filter(r => r.url && r.url.startsWith('http'))
            .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
            .slice(0, maxLinksToVisit);

        console.log(`\n🎯 Top ${topLinks.length} links selecionados:`);
        topLinks.forEach((link, i) => {
            console.log(`   ${i + 1}. ${link.title} (relevância: ${link.relevance || 'N/A'})`);
        });

        if (onProgress) {
            onProgress({ 
                phase: 'navigation', 
                message: `Navegando em ${topLinks.length} sites...`,
                topLinks 
            });
        }

        // 4. Navegar nos top links
        const navigationResults = await navigateMultipleLinks(
            topLinks,
            query,
            sessionId,
            onProgress
        );

        // 5. Compilar resultados
        const successfulResults = navigationResults.filter(r => r.success);

        console.log(`\n📊 Resultados finais:`);
        console.log(`   Sites visitados: ${navigationResults.length}`);
        console.log(`   Sucessos: ${successfulResults.length}`);
        console.log(`   Falhas: ${navigationResults.length - successfulResults.length}`);

        // 6. Fechar sessão
        await browserService.closeSession(sessionId);

        if (onProgress) {
            onProgress({ 
                phase: 'complete', 
                message: 'Busca concluída!',
                results: successfulResults 
            });
        }

        return {
            query,
            searchResult,
            navigationResults,
            successfulResults,
            totalVisited: navigationResults.length,
            successCount: successfulResults.length
        };

    } catch (error) {
        console.error('\n❌ Erro no workflow:', error);
        throw error;
    }
}

/**
 * 🎯 Sintetizar resultados com Gemini
 */
export async function synthesizeResults(query, results) {
    console.log('\n🧠 Sintetizando resultados...');

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `Você analisou ${results.length} sites sobre "${query}". Sintetize as informações.

**ANÁLISES VISUAIS:**
${results.map((r, i) => `
[${i + 1}] ${r.url}
Resumo: ${r.analysis?.summary || 'N/A'}
Resultados: ${r.analysis?.results?.length || 0}
Elementos: ${JSON.stringify(r.analysis?.visual_elements || {})}
`).join('\n')}

**SUA MISSÃO:**
Crie uma resposta completa e útil baseada nas análises visuais.

**INSTRUÇÕES:**
- Use as informações REAIS extraídas
- Cite as fontes
- Seja específico
- Use formatação Markdown
- Adicione emojis

**RESPOSTA COMPLETA:**`;

        const result = await model.generateContent(prompt);
        let synthesis = result.response.text();

        // Adicionar metadados
        synthesis += '\n\n---\n';
        synthesis += `**📊 Estatísticas:**\n`;
        synthesis += `- 🔍 Query: "${query}"\n`;
        synthesis += `- 🌐 Sites analisados: ${results.length}\n`;
        synthesis += `- 👁️ Análise visual com Gemini\n`;
        synthesis += `- 🤖 Navegação autônoma\n`;

        return synthesis;

    } catch (error) {
        console.error('❌ Erro ao sintetizar:', error);
        return 'Erro ao sintetizar resultados.';
    }
}

export default {
    analyzeScreenshot,
    navigateAndAnalyze,
    navigateMultipleLinks,
    intelligentSearchAndNavigate,
    synthesizeResults
};
