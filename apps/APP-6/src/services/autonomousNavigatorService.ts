/**
 * 🤖 AUTONOMOUS NAVIGATOR SERVICE
 * Sistema AUTÔNOMO onde o Gemini DECIDE onde navegar e como extrair informações
 */

import { GoogleGenAI } from "@google/genai";
import urlDatabase from '../../LISTA_URLS_NAVEGACAO.json';

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface NavigationPlan {
    reasoning: string;
    sites_to_visit: Array<{
        url: string;
        why: string;
        what_to_extract: string;
        navigation_path?: string[];
    }>;
    expected_result: string;
}

/**
 * O Gemini DECIDE AUTONOMAMENTE onde buscar informações
 */
export async function planAutonomousNavigation(userQuery: string): Promise<NavigationPlan> {
    console.log('🧠 Gemini planejando navegação autônoma...');
    
    // Criar contexto com TODA a base de URLs
    const urlContext = Object.entries(urlDatabase.categories)
        .map(([category, data]: [string, any]) => {
            return `**${category}** (${data.description}):\n${data.sites.slice(0, 5).join('\n')}`;
        })
        .join('\n\n');

    const prompt = `Você é um NAVEGADOR AUTÔNOMO INTELIGENTE. Você tem acesso a uma base de conhecimento com 550+ sites confiáveis.

**PERGUNTA DO USUÁRIO:**
"${userQuery}"

**SUA BASE DE CONHECIMENTO (URLs disponíveis):**
${urlContext}

**SUA MISSÃO:**
1. ANALISE a pergunta do usuário
2. DECIDA quais sites visitar (escolha 3-5 sites mais relevantes)
3. PLANEJE como navegar DENTRO de cada site (não só a homepage!)
4. CONSTRUA URLs específicas se necessário (ex: /search?q=, /categoria/, /tag/)

**INSTRUÇÕES:**
- Seja ESPECÍFICO sobre ONDE no site buscar
- Construa URLs completas quando possível
- Explique POR QUÊ cada site é relevante
- Planeje navegação PROFUNDA (não só primeira página)

**FORMATO DE RESPOSTA (JSON):**
{
  "reasoning": "Explicação do seu raciocínio",
  "sites_to_visit": [
    {
      "url": "URL COMPLETA (com /search ou /categoria se necessário)",
      "why": "Por que este site é relevante",
      "what_to_extract": "O que extrair (títulos, preços, datas, etc)",
      "navigation_path": ["Passo 1", "Passo 2"] (opcional)
    }
  ],
  "expected_result": "O que você espera encontrar"
}

**EXEMPLOS DE CONSTRUÇÃO DE URL:**
- Notícias: "https://g1.globo.com/busca/?q=Rio+de+Janeiro"
- Produtos: "https://www.mercadolivre.com.br/busca/iphone"
- Clima: "https://www.climatempo.com.br/previsao-do-tempo/cidade/363/salvador-ba"
- Wikipedia: "https://pt.wikipedia.org/wiki/Python_(linguagem_de_programação)"

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Resposta não contém JSON válido');
        }

        const plan: NavigationPlan = JSON.parse(jsonMatch[0]);
        
        console.log('✅ Plano de navegação criado:');
        console.log(`   Raciocínio: ${plan.reasoning}`);
        console.log(`   Sites a visitar: ${plan.sites_to_visit.length}`);
        
        return plan;
    } catch (error) {
        console.error('❌ Erro ao planejar navegação:', error);
        throw error;
    }
}

/**
 * Executa o plano de navegação autônoma
 */
export async function executeAutonomousNavigation(
    plan: NavigationPlan
): Promise<Array<{url: string; content: any; success: boolean}>> {
    console.log('🚀 Executando navegação autônoma...');
    
    const results = [];
    
    for (const site of plan.sites_to_visit) {
        console.log(`\n📍 Visitando: ${site.url}`);
        console.log(`   Motivo: ${site.why}`);
        
        try {
            // Chamar backend para navegar
            const response = await fetch('http://localhost:3002/api/autonomous-navigate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: site.url,
                    what_to_extract: site.what_to_extract,
                    navigation_path: site.navigation_path
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                results.push({
                    url: site.url,
                    content: data.content,
                    success: true
                });
                console.log(`   ✅ Sucesso: ${data.content.text?.length || 0} caracteres extraídos`);
            } else {
                results.push({
                    url: site.url,
                    content: null,
                    success: false
                });
                console.log(`   ❌ Falha: ${response.statusText}`);
            }
        } catch (error: any) {
            console.error(`   ❌ Erro: ${error.message}`);
            results.push({
                url: site.url,
                content: null,
                success: false
            });
        }
    }
    
    return results;
}

/**
 * Sistema completo: Planejar + Executar + Sintetizar
 */
export async function autonomousSearch(userQuery: string): Promise<string> {
    console.log('\n🤖 BUSCA AUTÔNOMA INICIADA');
    console.log(`📝 Query: "${userQuery}"\n`);
    
    try {
        // 1. Gemini planeja onde buscar
        const plan = await planAutonomousNavigation(userQuery);
        
        // 2. Executa o plano
        const results = await executeAutonomousNavigation(plan);
        
        // 3. Gemini sintetiza os resultados
        const successfulResults = results.filter(r => r.success);
        
        if (successfulResults.length === 0) {
            return "😕 Não consegui encontrar informações relevantes nos sites visitados. Tente reformular sua pergunta.";
        }
        
        const synthesisPrompt = `Você visitou ${successfulResults.length} sites e coletou informações sobre: "${userQuery}"

**INFORMAÇÕES COLETADAS:**
${successfulResults.map((r, i) => `
[${i + 1}] ${r.url}
Conteúdo: ${r.content.text?.substring(0, 500) || 'Sem conteúdo'}
`).join('\n')}

**SUA MISSÃO:**
Sintetize as informações coletadas em uma resposta completa, clara e útil.

**INSTRUÇÕES:**
- Use as informações REAIS dos sites
- Cite as fontes usando [1], [2], etc.
- Seja específico e detalhado
- Use formatação Markdown
- Adicione emojis para visualização

**RESPOSTA COMPLETA:**`;

        const synthesis = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: synthesisPrompt
        });
        
        let finalResponse = synthesis.text;
        
        // Adicionar fontes
        finalResponse += '\n\n---\n**🌐 Sites Visitados:**\n';
        successfulResults.forEach((r, i) => {
            finalResponse += `[${i + 1}] ${r.url}\n`;
        });
        
        finalResponse += `\n*🤖 Navegação autônoma: ${successfulResults.length} sites visitados | Planejado pelo Gemini*`;
        
        return finalResponse;
        
    } catch (error: any) {
        console.error('❌ Erro na busca autônoma:', error);
        return `❌ Erro ao realizar busca autônoma: ${error.message}`;
    }
}

export default {
    planAutonomousNavigation,
    executeAutonomousNavigation,
    autonomousSearch
};
