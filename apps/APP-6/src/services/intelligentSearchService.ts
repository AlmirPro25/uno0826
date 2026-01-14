/**
 * 🧠 INTELLIGENT SEARCH SERVICE
 * Sistema de busca inteligente com múltiplas fontes e chamadas ao Gemini
 */

import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface SearchResult {
    title: string;
    snippet: string;
    url: string;
    source: string;
    relevance?: number;
}

export interface SearchResponse {
    query: string;
    results: SearchResult[];
    summary?: string;
    sources: string[];
    duration: number;
}

/**
 * Detectar tipo de query
 */
function detectQueryType(query: string): 'weather' | 'news' | 'local' | 'general' {
    const lowerQuery = query.toLowerCase();
    
    // Palavras-chave de clima/tempo
    const weatherKeywords = [
        'tempo', 'clima', 'temperatura', 'chuva', 'sol', 'previsão',
        'vai chover', 'vai fazer sol', 'como está o tempo', 'graus',
        'weather', 'forecast', 'rain', 'sunny'
    ];
    
    // Palavras-chave de notícias
    const newsKeywords = [
        'notícia', 'notícias', 'aconteceu', 'acontecendo', 'hoje',
        'últimas', 'news', 'breaking', 'atual', 'agora'
    ];
    
    // Palavras-chave locais
    const localKeywords = [
        'bahia', 'salvador', 'são paulo', 'rio de janeiro', 'brasil',
        'cidade', 'estado', 'região'
    ];
    
    if (weatherKeywords.some(kw => lowerQuery.includes(kw))) {
        return 'weather';
    }
    
    if (newsKeywords.some(kw => lowerQuery.includes(kw))) {
        return 'news';
    }
    
    if (localKeywords.some(kw => lowerQuery.includes(kw))) {
        return 'local';
    }
    
    return 'general';
}

/**
 * Extrair localização da query
 */
function extractLocation(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Cidades e estados brasileiros
    const locations: { [key: string]: string } = {
        'bahia': 'Salvador, Bahia',
        'salvador': 'Salvador, Bahia',
        'são paulo': 'São Paulo, SP',
        'rio de janeiro': 'Rio de Janeiro, RJ',
        'brasília': 'Brasília, DF',
        'belo horizonte': 'Belo Horizonte, MG',
        'fortaleza': 'Fortaleza, CE',
        'recife': 'Recife, PE',
        'porto alegre': 'Porto Alegre, RS',
        'curitiba': 'Curitiba, PR'
    };
    
    for (const [key, value] of Object.entries(locations)) {
        if (lowerQuery.includes(key)) {
            return value;
        }
    }
    
    return 'Brasil';
}

/**
 * Fontes de busca disponíveis (SEM DuckDuckGo)
 */
const SEARCH_SOURCES = [
    {
        name: 'Wikipedia',
        priority: 1,
        search: async (query: string) => {
            try {
                const response = await fetch(
                    `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=10`
                );
                const data = await response.json();
                
                if (data.query && data.query.search) {
                    return data.query.search.map((item: any) => ({
                        title: item.title,
                        snippet: item.snippet.replace(/<[^>]*>/g, ''),
                        url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
                        source: 'Wikipedia'
                    }));
                }
                return [];
            } catch (error) {
                console.error('Erro Wikipedia:', error);
                return [];
            }
        }
    },
    {
        name: 'OpenWeather',
        priority: 2,
        search: async (query: string) => {
            // Buscar clima via backend
            try {
                const location = extractLocation(query);
                const response = await fetch('http://localhost:3002/api/weather', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ location })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return data.results || [];
                }
                return [];
            } catch (error) {
                console.error('Erro OpenWeather:', error);
                return [];
            }
        }
    },
    {
        name: 'Google News',
        priority: 3,
        search: async (query: string) => {
            // Buscar notícias via backend
            try {
                const response = await fetch('http://localhost:3002/api/news', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return data.results || [];
                }
                return [];
            } catch (error) {
                console.error('Erro Google News:', error);
                return [];
            }
        }
    },
    {
        name: 'Startpage',
        priority: 2,
        search: async (query: string) => {
            // Startpage via backend (Playwright)
            try {
                const response = await fetch('http://localhost:3002/api/browser/search-startpage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return data.results || [];
                }
                return [];
            } catch (error) {
                console.error('Erro Startpage:', error);
                return [];
            }
        }
    },
    {
        name: 'Bing',
        priority: 3,
        search: async (query: string) => {
            // Bing via backend (Playwright)
            try {
                const response = await fetch('http://localhost:3002/api/browser/search-bing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return data.results || [];
                }
                return [];
            } catch (error) {
                console.error('Erro Bing:', error);
                return [];
            }
        }
    }
];

/**
 * Otimizar query com Gemini (múltiplas chamadas)
 */
async function optimizeQuery(userQuery: string): Promise<string[]> {
    try {
        console.log('🧠 Otimizando query com Gemini...');
        
        const prompt = `Você é um especialista em otimização de buscas. Analise a pergunta e gere 3 queries otimizadas:

Pergunta: "${userQuery}"

Regras:
1. Query em INGLÊS (resultados globais)
2. Query em PORTUGUÊS (resultados locais)
3. Query com palavras-chave específicas
4. Remova palavras desnecessárias
5. Use termos técnicos quando apropriado

Retorne APENAS as 3 queries, uma por linha, sem numeração.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        const queries = response.text
            .split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .slice(0, 3);

        console.log('✅ Queries otimizadas:', queries);
        return queries.length > 0 ? queries : [userQuery];
    } catch (error) {
        console.error('Erro ao otimizar query:', error);
        return [userQuery];
    }
}

/**
 * 🚀 Buscar usando BUSCA MASSIVA PARALELA (NOVO!)
 */
export async function intelligentSearch(userQuery: string): Promise<SearchResponse> {
    const startTime = Date.now();
    console.log('🚀 Busca massiva paralela iniciada:', userQuery);

    try {
        // Usar o novo sistema de busca massiva do backend
        const response = await fetch('http://localhost:3002/api/search/massive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: userQuery,
                maxSites: 10, // Buscar em 10 sites simultaneamente
                timeout: 60000 // 60 segundos por site
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na busca massiva: ${response.statusText}`);
        }

        const data = await response.json();

        console.log(`✅ Busca massiva concluída: ${data.totalResults} resultados de ${data.successfulSites} sites`);

        return {
            query: userQuery,
            results: data.results || [],
            sources: data.sites || [],
            duration: data.duration || (Date.now() - startTime)
        };

    } catch (error) {
        console.error('❌ Erro na busca massiva, usando fallback:', error);

        // FALLBACK: Buscar apenas na Wikipedia
        try {
            const wikiResponse = await fetch(
                `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(userQuery)}&format=json&origin=*&srlimit=10`
            );
            const wikiData = await wikiResponse.json();
            
            const results: SearchResult[] = [];
            if (wikiData.query && wikiData.query.search) {
                wikiData.query.search.forEach((item: any) => {
                    results.push({
                        title: item.title,
                        snippet: item.snippet.replace(/<[^>]*>/g, ''),
                        url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
                        source: 'Wikipedia'
                    });
                });
            }

            return {
                query: userQuery,
                results,
                sources: ['Wikipedia'],
                duration: Date.now() - startTime
            };
        } catch (fallbackError) {
            console.error('❌ Fallback também falhou:', fallbackError);
            return {
                query: userQuery,
                results: [],
                sources: [],
                duration: Date.now() - startTime
            };
        }
    }
}

/**
 * Gerar resposta enriquecida com múltiplas chamadas ao Gemini
 */
export async function generateIntelligentResponse(userQuery: string): Promise<string> {
    try {
        console.log('🧠 Gerando resposta inteligente...');

        // 1. Buscar informações
        const searchResponse = await intelligentSearch(userQuery);

        if (searchResponse.results.length === 0) {
            // Fallback: usar apenas Gemini com contexto especializado
            console.log('⚠️ Sem resultados, usando apenas Gemini com contexto especializado');
            
            const queryType = detectQueryType(userQuery);
            let specializedPrompt = '';
            
            if (queryType === 'weather') {
                const location = extractLocation(userQuery);
                specializedPrompt = `Você é um assistente especializado em clima e meteorologia.

**Pergunta do usuário:** ${userQuery}
**Localização detectada:** ${location}

**INSTRUÇÕES:**
1. Forneça informações gerais sobre o clima em ${location}
2. Explique os padrões climáticos típicos da região
3. Mencione a estação do ano atual (novembro = primavera no Brasil)
4. Dê dicas sobre o que esperar do clima nesta época
5. **IMPORTANTE:** Deixe claro que você não tem acesso a dados em tempo real
6. Sugira fontes confiáveis para consultar a previsão atual (INMET, Climatempo, etc.)

**Formato da resposta:**
- Use emojis para visualização (☀️ 🌧️ ⛅ 🌡️)
- Seja informativo mas honesto sobre limitações
- Forneça contexto útil sobre o clima da região`;
            } else if (queryType === 'news' || queryType === 'local') {
                const location = extractLocation(userQuery);
                specializedPrompt = `Você é um assistente especializado em notícias e informações locais.

**Pergunta do usuário:** ${userQuery}
**Localização detectada:** ${location}

**INSTRUÇÕES:**
1. Forneça contexto geral sobre ${location}
2. Explique os principais temas e acontecimentos típicos da região
3. Mencione fontes confiáveis de notícias locais (G1, portais locais, etc.)
4. **IMPORTANTE:** Deixe claro que você não tem acesso a notícias em tempo real
5. Sugira onde o usuário pode encontrar notícias atualizadas
6. Forneça informações gerais úteis sobre a região

**Formato da resposta:**
- Use emojis para visualização (📰 📍 🌆)
- Seja informativo mas honesto sobre limitações
- Sugira fontes confiáveis para notícias atuais`;
            } else {
                specializedPrompt = `Responda de forma completa e detalhada: ${userQuery}`;
            }
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: specializedPrompt
            });

            let fallbackResponse = response.text;
            
            // Adicionar sugestões de fontes
            if (queryType === 'weather') {
                fallbackResponse += '\n\n---\n**🌐 Fontes Recomendadas para Previsão Atual:**\n';
                fallbackResponse += '- [INMET - Instituto Nacional de Meteorologia](https://portal.inmet.gov.br/)\n';
                fallbackResponse += '- [Climatempo](https://www.climatempo.com.br/)\n';
                fallbackResponse += '- [CPTEC/INPE](https://www.cptec.inpe.br/)\n';
            } else if (queryType === 'news' || queryType === 'local') {
                const location = extractLocation(userQuery);
                fallbackResponse += '\n\n---\n**📰 Fontes Recomendadas para Notícias Atuais:**\n';
                fallbackResponse += `- [G1 ${location}](https://g1.globo.com/)\n`;
                fallbackResponse += '- [UOL Notícias](https://noticias.uol.com.br/)\n';
                fallbackResponse += '- [Folha de S.Paulo](https://www.folha.uol.com.br/)\n';
            }
            
            fallbackResponse += '\n\n💡 *Resposta gerada pelo modelo sem acesso a dados em tempo real. Para informações atualizadas, consulte as fontes recomendadas acima.*';

            return fallbackResponse;
        }

        // 2. PRIMEIRA CHAMADA: Analisar relevância dos resultados
        console.log('🧠 Chamada 1: Analisando relevância...');
        
        const analysisPrompt = `Analise os seguintes resultados de pesquisa e identifique os 5 mais relevantes para: "${userQuery}"

RESULTADOS:
${searchResponse.results.slice(0, 10).map((r, i) => 
    `[${i + 1}] ${r.title}\n${r.snippet}\nFonte: ${r.source}`
).join('\n\n')}

Retorne APENAS os números dos 5 mais relevantes, separados por vírgula (ex: 1,3,5,7,9)`;

        const analysisResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: analysisPrompt
        });

        const relevantIndices = analysisResponse.text
            .match(/\d+/g)
            ?.map(n => parseInt(n) - 1)
            .filter(i => i >= 0 && i < searchResponse.results.length)
            .slice(0, 5) || [0, 1, 2, 3, 4];

        const relevantResults = relevantIndices.map(i => searchResponse.results[i]).filter(Boolean);

        console.log(`✅ ${relevantResults.length} resultados relevantes identificados`);

        // 3. SEGUNDA CHAMADA: Extrair informações-chave
        console.log('🧠 Chamada 2: Extraindo informações-chave...');
        
        const extractionPrompt = `Extraia as informações mais importantes destes resultados sobre "${userQuery}":

${relevantResults.map((r, i) => 
    `[${i + 1}] ${r.title}\n${r.snippet}`
).join('\n\n')}

Liste os pontos-chave em tópicos curtos:`;

        const extractionResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: extractionPrompt
        });

        const keyPoints = extractionResponse.text;
        console.log('✅ Informações-chave extraídas');

        // 4. TERCEIRA CHAMADA: Gerar resposta final completa
        console.log('🧠 Chamada 3: Gerando resposta final...');
        
        const finalPrompt = `Com base nas seguintes informações-chave sobre "${userQuery}", crie uma resposta completa, bem estruturada e informativa:

INFORMAÇÕES-CHAVE:
${keyPoints}

FONTES ORIGINAIS:
${relevantResults.map((r, i) => 
    `[${i + 1}] ${r.title} - ${r.url}`
).join('\n')}

INSTRUÇÕES:
- Seja claro e objetivo
- Use formatação Markdown
- Cite as fontes usando [1], [2], etc.
- Organize em seções se necessário
- Adicione emojis para melhor visualização

RESPOSTA COMPLETA:`;

        const finalResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: finalPrompt,
            config: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 2048
            }
        });

        console.log('✅ Resposta final gerada');

        // 5. Adicionar metadados
        let response = finalResponse.text;
        response += '\n\n---\n**📚 Fontes Consultadas:**\n';
        relevantResults.forEach((r, i) => {
            response += `[${i + 1}] [${r.title}](${r.url}) - ${r.source}\n`;
        });
        response += `\n*🔍 ${searchResponse.results.length} resultados analisados de ${searchResponse.sources.join(', ')} | ⏱️ ${Math.round(searchResponse.duration / 1000)}s*`;
        response += `\n*🧠 3 chamadas ao Gemini para análise inteligente*`;

        return response;

    } catch (error) {
        console.error('❌ Erro ao gerar resposta inteligente:', error);
        return "❌ Ocorreu um erro ao processar sua pesquisa. Por favor, tente novamente.";
    }
}

export default {
    intelligentSearch,
    generateIntelligentResponse
};
