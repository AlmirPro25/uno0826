/**
 * 🧠 CONVERSATION CONTEXT SERVICE
 * Mantém contexto de pesquisas e conversas para follow-up inteligente
 */

import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface SearchContext {
    query: string;
    results: any[];
    summary: string;
    timestamp: number;
    sources: string[];
}

export interface ConversationContext {
    searchHistory: SearchContext[];
    lastSearch?: SearchContext;
    conversationHistory: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: number;
    }>;
}

class ConversationContextManager {
    private context: ConversationContext;
    private maxHistorySize: number = 10;

    constructor() {
        this.context = {
            searchHistory: [],
            conversationHistory: []
        };
    }

    /**
     * Adicionar pesquisa ao contexto
     */
    addSearch(query: string, results: any[], summary: string, sources: string[]) {
        const searchContext: SearchContext = {
            query,
            results,
            summary,
            timestamp: Date.now(),
            sources
        };

        this.context.searchHistory.push(searchContext);
        this.context.lastSearch = searchContext;

        // Limitar tamanho do histórico
        if (this.context.searchHistory.length > this.maxHistorySize) {
            this.context.searchHistory.shift();
        }

        console.log(`📝 Pesquisa adicionada ao contexto: "${query}"`);
    }

    /**
     * Adicionar mensagem à conversa
     */
    addMessage(role: 'user' | 'assistant', content: string) {
        this.context.conversationHistory.push({
            role,
            content,
            timestamp: Date.now()
        });

        // Limitar tamanho do histórico
        if (this.context.conversationHistory.length > this.maxHistorySize * 2) {
            this.context.conversationHistory.shift();
        }
    }

    /**
     * Obter contexto completo
     */
    getContext(): ConversationContext {
        return this.context;
    }

    /**
     * Obter última pesquisa
     */
    getLastSearch(): SearchContext | undefined {
        return this.context.lastSearch;
    }

    /**
     * Obter histórico de pesquisas
     */
    getSearchHistory(): SearchContext[] {
        return this.context.searchHistory;
    }

    /**
     * Obter histórico de conversa
     */
    getConversationHistory() {
        return this.context.conversationHistory;
    }

    /**
     * Limpar contexto
     */
    clear() {
        this.context = {
            searchHistory: [],
            conversationHistory: []
        };
        console.log('🧹 Contexto limpo');
    }

    /**
     * Gerar resumo do contexto para o Gemini
     */
    generateContextSummary(): string {
        let summary = '';

        // Adicionar última pesquisa
        if (this.context.lastSearch) {
            summary += `**ÚLTIMA PESQUISA:**\n`;
            summary += `Query: "${this.context.lastSearch.query}"\n`;
            summary += `Resumo: ${this.context.lastSearch.summary}\n`;
            summary += `Fontes: ${this.context.lastSearch.sources.join(', ')}\n\n`;
        }

        // Adicionar histórico de pesquisas recentes
        if (this.context.searchHistory.length > 1) {
            summary += `**PESQUISAS ANTERIORES:**\n`;
            this.context.searchHistory.slice(-3).forEach((search, i) => {
                summary += `${i + 1}. "${search.query}" (${search.sources.join(', ')})\n`;
            });
            summary += '\n';
        }

        // Adicionar últimas mensagens da conversa
        if (this.context.conversationHistory.length > 0) {
            summary += `**CONVERSA RECENTE:**\n`;
            this.context.conversationHistory.slice(-4).forEach((msg) => {
                summary += `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content.substring(0, 100)}...\n`;
            });
        }

        return summary;
    }
}

// Instância singleton
const contextManager = new ConversationContextManager();

export { contextManager, ConversationContextManager };
export default contextManager;
