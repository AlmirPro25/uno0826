/**
 * 🎼 SEARCH MAESTRO SERVICE
 * Orquestra pesquisas inteligentes com contexto conversacional
 */

import { GoogleGenAI } from "@google/genai";
import { intelligentSearch, generateIntelligentResponse } from './intelligentSearchService';
import contextManager from './conversationContextService';

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface MaestroDecision {
    needsNewSearch: boolean;
    canAnswerFromContext: boolean;
    searchQuery?: string;
    reasoning: string;
}

export interface MaestroResponse {
    answer: string;
    usedContext: boolean;
    madeNewSearch: boolean;
    searchQuery?: string;
    sources?: string[];
}

/**
 * 🎼 MAESTRO: Decide se precisa fazer nova pesquisa ou usar contexto
 */
async function analyzeUserIntent(userMessage: string): Promise<MaestroDecision> {
    try {
        console.log('🎼 Maestro analisando intenção do usuário...');

        // Obter contexto atual
        const contextSummary = contextManager.generateContextSummary();
        const hasContext = contextManager.getLastSearch() !== undefined;

        const prompt = `Você é um maestro inteligente que decide se precisa fazer uma nova pesquisa ou se pode responder com base no contexto existente.

**CONTEXTO ATUAL:**
${hasContext ? contextSummary : 'Nenhum contexto disponível (primeira mensagem)'}

**MENSAGEM DO USUÁRIO:**
"${userMessage}"

**SUA TAREFA:**
Analise a mensagem e decida:

1. **PRECISA DE NOVA PESQUISA?**
   - Se a pergunta é sobre um NOVO tópico → SIM
   - Se é uma pergunta de follow-up sobre o contexto → NÃO
   - Se pede mais detalhes sobre a última pesquisa → NÃO
   - Se não há contexto disponível → SIM

2. **PODE RESPONDER COM CONTEXTO?**
   - Se há contexto relevante disponível → SIM
   - Se a pergunta se refere ao contexto anterior → SIM
   - Se não há contexto ou é novo tópico → NÃO

3. **QUERY DE PESQUISA (se precisar):**
   - Gere uma query otimizada para busca
   - Considere o contexto para refinar a query

**EXEMPLOS:**

Exemplo 1:
Contexto: "Última pesquisa sobre 'enchentes no Rio de Janeiro'"
Usuário: "quantos mortos?"
Decisão: NÃO precisa de nova pesquisa (é follow-up)
Pode responder: SIM (contexto tem a informação)

Exemplo 2:
Contexto: "Última pesquisa sobre 'Python'"
Usuário: "e sobre JavaScript?"
Decisão: SIM precisa de nova pesquisa (novo tópico)
Query: "JavaScript programming language"

Exemplo 3:
Contexto: Nenhum
Usuário: "o que aconteceu no Rio?"
Decisão: SIM precisa de nova pesquisa (sem contexto)
Query: "últimas notícias Rio de Janeiro"

**RESPONDA EM JSON:**
{
  "needsNewSearch": true/false,
  "canAnswerFromContext": true/false,
  "searchQuery": "query otimizada" (se needsNewSearch = true),
  "reasoning": "explicação da decisão"
}

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        // Extrair JSON da resposta
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Resposta não contém JSON válido');
        }

        const decision: MaestroDecision = JSON.parse(jsonMatch[0]);

        console.log('🎼 Decisão do Maestro:', decision);
        return decision;

    } catch (error) {
        console.error('❌ Erro ao analisar intenção:', error);
        
        // Fallback: se não há contexto, fazer nova pesquisa
        const hasContext = contextManager.getLastSearch() !== undefined;
        return {
            needsNewSearch: !hasContext,
            canAnswerFromContext: hasContext,
            searchQuery: hasContext ? undefined : userMessage,
            reasoning: 'Fallback: decisão baseada em presença de contexto'
        };
    }
}

/**
 * 🎯 Responder usando contexto existente
 */
async function answerFromContext(userMessage: string): Promise<string> {
    try {
        console.log('📚 Respondendo com base no contexto...');

        const contextSummary = contextManager.generateContextSummary();
        const lastSearch = contextManager.getLastSearch();

        const prompt = `Você é um assistente inteligente respondendo uma pergunta de follow-up.

**CONTEXTO DA ÚLTIMA PESQUISA:**
${contextSummary}

**RESULTADOS DETALHADOS DA ÚLTIMA PESQUISA:**
${lastSearch?.results.slice(0, 5).map((r, i) => 
    `[${i + 1}] ${r.title}\n${r.snippet}\nFonte: ${r.source}`
).join('\n\n')}

**PERGUNTA DO USUÁRIO:**
"${userMessage}"

**INSTRUÇÕES:**
1. Responda a pergunta usando APENAS as informações do contexto acima
2. Seja específico e cite os números/fatos relevantes
3. Se a informação não estiver no contexto, diga claramente
4. Cite as fontes usando [1], [2], etc.
5. Use formatação Markdown
6. Seja conciso e direto

**RESPOSTA:**`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 1024
            }
        });

        let answer = response.text;

        // Adicionar nota sobre contexto
        answer += '\n\n---\n';
        answer += `*💡 Resposta baseada na pesquisa anterior: "${lastSearch?.query}"*\n`;
        answer += `*📚 Fontes: ${lastSearch?.sources.join(', ')}*`;

        return answer;

    } catch (error) {
        console.error('❌ Erro ao responder do contexto:', error);
        return "❌ Desculpe, não consegui processar sua pergunta com base no contexto. Tente fazer uma nova pesquisa.";
    }
}

/**
 * 🚀 Fazer nova pesquisa
 */
async function performNewSearch(query: string): Promise<string> {
    try {
        console.log('🔍 Fazendo nova pesquisa:', query);

        // Fazer pesquisa inteligente
        const searchResponse = await intelligentSearch(query);
        
        // Gerar resposta com Gemini
        const answer = await generateIntelligentResponse(query);

        // Adicionar ao contexto
        contextManager.addSearch(
            query,
            searchResponse.results,
            answer,
            searchResponse.sources
        );

        return answer;

    } catch (error) {
        console.error('❌ Erro ao fazer nova pesquisa:', error);
        return "❌ Desculpe, ocorreu um erro ao fazer a pesquisa. Por favor, tente novamente.";
    }
}

/**
 * 🎼 MAESTRO PRINCIPAL: Orquestra tudo
 */
export async function orchestrateSearch(userMessage: string): Promise<MaestroResponse> {
    try {
        console.log('\n🎼 ========== MAESTRO INICIADO ==========');
        console.log(`📝 Mensagem: "${userMessage}"`);

        // Adicionar mensagem do usuário ao contexto
        contextManager.addMessage('user', userMessage);

        // 1. ANALISAR INTENÇÃO
        const decision = await analyzeUserIntent(userMessage);
        console.log('🎯 Decisão:', decision.reasoning);

        let answer: string;
        let usedContext = false;
        let madeNewSearch = false;
        let searchQuery: string | undefined;
        let sources: string[] | undefined;

        // 2. EXECUTAR AÇÃO BASEADA NA DECISÃO
        if (decision.canAnswerFromContext && !decision.needsNewSearch) {
            // Responder do contexto
            answer = await answerFromContext(userMessage);
            usedContext = true;
            sources = contextManager.getLastSearch()?.sources;
            
        } else if (decision.needsNewSearch && decision.searchQuery) {
            // Fazer nova pesquisa
            answer = await performNewSearch(decision.searchQuery);
            madeNewSearch = true;
            searchQuery = decision.searchQuery;
            sources = contextManager.getLastSearch()?.sources;
            
        } else {
            // Fallback: tentar responder do contexto ou fazer nova pesquisa
            if (contextManager.getLastSearch()) {
                answer = await answerFromContext(userMessage);
                usedContext = true;
                sources = contextManager.getLastSearch()?.sources;
            } else {
                answer = await performNewSearch(userMessage);
                madeNewSearch = true;
                searchQuery = userMessage;
                sources = contextManager.getLastSearch()?.sources;
            }
        }

        // Adicionar resposta ao contexto
        contextManager.addMessage('assistant', answer);

        console.log('✅ Maestro concluído');
        console.log('🎼 ========================================\n');

        return {
            answer,
            usedContext,
            madeNewSearch,
            searchQuery,
            sources
        };

    } catch (error) {
        console.error('❌ Erro no Maestro:', error);
        return {
            answer: "❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
            usedContext: false,
            madeNewSearch: false
        };
    }
}

/**
 * 🧹 Limpar contexto
 */
export function clearContext() {
    contextManager.clear();
}

/**
 * 📊 Obter estatísticas do contexto
 */
export function getContextStats() {
    return {
        searchHistory: contextManager.getSearchHistory().length,
        conversationHistory: contextManager.getConversationHistory().length,
        lastSearch: contextManager.getLastSearch()?.query,
        hasContext: contextManager.getLastSearch() !== undefined
    };
}

export default {
    orchestrateSearch,
    clearContext,
    getContextStats
};
