/**
 * 🧠 INTELLIGENT NAVIGATOR ORCHESTRATOR
 * Cérebro que orquestra navegação inteligente
 * - Toma decisões sobre onde navegar
 * - Conversa com o usuário
 * - Usa base de conhecimento de 500+ URLs
 * - Navega diretamente sem Google
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { browserService } from './browserService.js';
import fs from 'fs';
import path from 'path';

class IntelligentNavigatorOrchestrator {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.knowledgeBase = null; // Base de 500+ URLs
    this.conversationHistory = [];
    this.currentSession = null;
  }

  /**
   * Inicializar com API Key do Gemini
   */
  async initialize(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    // Carregar base de conhecimento
    await this.loadKnowledgeBase();

    console.log('🧠 Orchestrator inicializado com', this.knowledgeBase.totalUrls, 'URLs');
  }

  /**
   * Carregar base de conhecimento de URLs
   */
  async loadKnowledgeBase() {
    try {
      // Carregar sites confiáveis
      const trustedSitesPath = path.join(process.cwd(), 'data', 'trusted-sites.json');
      const trustedSites = JSON.parse(fs.readFileSync(trustedSitesPath, 'utf8'));

      // Construir base de conhecimento estruturada
      this.knowledgeBase = {
        totalUrls: 0,
        categories: {},
        urlPatterns: {},
        searchPatterns: {}
      };

      // Processar cada categoria
      for (const [category, sites] of Object.entries(trustedSites)) {
        this.knowledgeBase.categories[category] = [];
        
        sites.forEach(site => {
          this.knowledgeBase.totalUrls++;
          
          // Adicionar site à categoria
          this.knowledgeBase.categories[category].push({
            name: site.name,
            url: site.url,
            description: site.description || '',
            searchPattern: this.extractSearchPattern(site.url, site.name)
          });

          // Extrair padrões de URL
          const domain = new URL(site.url).hostname;
          if (!this.knowledgeBase.urlPatterns[domain]) {
            this.knowledgeBase.urlPatterns[domain] = [];
          }
          this.knowledgeBase.urlPatterns[domain].push(site);
        });
      }

      // Adicionar padrões de busca conhecidos
      this.knowledgeBase.searchPatterns = {
        'mercadolivre.com.br': {
          search: 'https://lista.mercadolivre.com.br/{query}',
          product: 'https://www.mercadolivre.com.br/p/{id}',
          category: 'https://www.mercadolivre.com.br/c/{category}'
        },
        'amazon.com.br': {
          search: 'https://www.amazon.com.br/s?k={query}',
          product: 'https://www.amazon.com.br/dp/{id}',
          category: 'https://www.amazon.com.br/s?i={category}'
        },
        'olx.com.br': {
          search: 'https://www.olx.com.br/brasil?q={query}',
          category: 'https://www.olx.com.br/{category}'
        },
        'youtube.com': {
          search: 'https://www.youtube.com/results?search_query={query}',
          video: 'https://www.youtube.com/watch?v={id}',
          channel: 'https://www.youtube.com/@{channel}'
        },
        'wikipedia.org': {
          search: 'https://pt.wikipedia.org/wiki/{query}',
          article: 'https://pt.wikipedia.org/wiki/{title}'
        },
        'github.com': {
          search: 'https://github.com/search?q={query}',
          repo: 'https://github.com/{user}/{repo}',
          user: 'https://github.com/{user}'
        }
      };

    } catch (error) {
      console.error('❌ Erro ao carregar base de conhecimento:', error);
      this.knowledgeBase = { totalUrls: 0, categories: {}, urlPatterns: {}, searchPatterns: {} };
    }
  }

  /**
   * Extrair padrão de busca de um site
   */
  extractSearchPattern(url, siteName) {
    const domain = new URL(url).hostname;
    
    // Padrões conhecidos
    if (domain.includes('mercadolivre')) {
      return 'https://lista.mercadolivre.com.br/{query}';
    }
    if (domain.includes('amazon')) {
      return 'https://www.amazon.com.br/s?k={query}';
    }
    if (domain.includes('olx')) {
      return 'https://www.olx.com.br/brasil?q={query}';
    }
    if (domain.includes('youtube')) {
      return 'https://www.youtube.com/results?search_query={query}';
    }
    
    // Padrão genérico
    return `${url}/search?q={query}`;
  }

  /**
   * Processar pedido do usuário
   */
  async processUserRequest(userMessage, context = {}) {
    console.log('🧠 Processando pedido:', userMessage);

    // Adicionar à história da conversa
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    });

    // Construir prompt com base de conhecimento
    const systemPrompt = this.buildSystemPrompt();
    const fullPrompt = `${systemPrompt}\n\nUsuário: ${userMessage}\n\nContexto: ${JSON.stringify(context)}`;

    try {
      // Gerar resposta do modelo
      const result = await this.model.generateContent(fullPrompt);
      const response = result.response.text();

      // Parsear resposta estruturada
      const decision = this.parseDecision(response);

      // Adicionar à história
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        decision: decision,
        timestamp: Date.now()
      });

      console.log('🧠 Decisão:', decision.action);

      return {
        response,
        decision,
        conversationHistory: this.conversationHistory
      };

    } catch (error) {
      console.error('❌ Erro ao processar pedido:', error);
      throw error;
    }
  }

  /**
   * Construir prompt do sistema com base de conhecimento
   */
  buildSystemPrompt() {
    const categories = Object.keys(this.knowledgeBase.categories).join(', ');
    const totalSites = this.knowledgeBase.totalUrls;

    return `Você é um Navegador Inteligente com acesso a uma base de conhecimento de ${totalSites} URLs organizadas em ${Object.keys(this.knowledgeBase.categories).length} categorias.

## SUA BASE DE CONHECIMENTO

Você conhece sites nas seguintes categorias:
${categories}

## PADRÕES DE BUSCA QUE VOCÊ CONHECE

${Object.entries(this.knowledgeBase.searchPatterns).map(([domain, patterns]) => {
  return `### ${domain}\n${Object.entries(patterns).map(([type, pattern]) => `- ${type}: ${pattern}`).join('\n')}`;
}).join('\n\n')}

## SUAS CAPACIDADES

1. **Navegação Direta**: Você NÃO precisa usar Google. Vá direto aos sites relevantes.
2. **Busca Inteligente**: Use os padrões de URL que você conhece para buscar diretamente.
3. **Conversação**: Converse com o usuário, faça perguntas, peça esclarecimentos.
4. **Decisões**: Decida qual site acessar, qual URL usar, quais dados extrair.

## FORMATO DE RESPOSTA

Sempre responda em JSON com esta estrutura:

\`\`\`json
{
  "action": "navigate|search|ask|extract|respond",
  "reasoning": "Por que você está tomando esta decisão",
  "message": "Mensagem para o usuário",
  "navigation": {
    "urls": ["url1", "url2"],
    "strategy": "direct|search|explore",
    "extractData": ["price", "title", "description"]
  },
  "question": "Pergunta para o usuário (se action=ask)"
}
\`\`\`

## EXEMPLOS

**Usuário**: "Quero comprar um iPhone 13"
**Você**:
\`\`\`json
{
  "action": "navigate",
  "reasoning": "Vou buscar diretamente no Mercado Livre e Amazon usando os padrões de URL que conheço",
  "message": "Vou buscar iPhone 13 no Mercado Livre e Amazon para você!",
  "navigation": {
    "urls": [
      "https://lista.mercadolivre.com.br/iphone-13",
      "https://www.amazon.com.br/s?k=iphone+13"
    ],
    "strategy": "direct",
    "extractData": ["price", "title", "image", "seller"]
  }
}
\`\`\`

**Usuário**: "Qual o melhor notebook até R$ 3000?"
**Você**:
\`\`\`json
{
  "action": "ask",
  "reasoning": "Preciso saber mais sobre as preferências do usuário",
  "message": "Para te ajudar melhor, me diga:",
  "question": "Você prefere notebook para jogos, trabalho ou estudos? E qual tamanho de tela você prefere?"
}
\`\`\`

## REGRAS IMPORTANTES

1. **NUNCA use Google** - Vá direto aos sites relevantes
2. **Use seus padrões de URL** - Você conhece como construir URLs de busca
3. **Seja conversacional** - Fale naturalmente com o usuário
4. **Peça esclarecimentos** - Se não tiver certeza, pergunte
5. **Seja eficiente** - Navegue apenas nos sites mais relevantes
6. **Extraia dados estruturados** - Sempre que possível

Agora, processe o pedido do usuário:`;
  }

  /**
   * Parsear decisão do modelo
   */
  parseDecision(response) {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Tentar parsear diretamente
      return JSON.parse(response);

    } catch (error) {
      // Fallback: criar decisão básica
      return {
        action: 'respond',
        reasoning: 'Resposta em formato livre',
        message: response,
        navigation: null,
        question: null
      };
    }
  }

  /**
   * Executar navegação baseada na decisão
   */
  async executeNavigation(decision) {
    if (!decision.navigation || !decision.navigation.urls) {
      return null;
    }

    console.log('🚀 Executando navegação:', decision.navigation.urls.length, 'URLs');

    const results = [];

    for (const url of decision.navigation.urls) {
      try {
        // Criar sessão
        const sessionId = `orchestrator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await browserService.createSession(sessionId);

        // Navegar
        await browserService.navigate(sessionId, url);

        // Extrair dados
        let extractedData = null;
        if (decision.navigation.extractData) {
          if (decision.navigation.extractData.includes('products')) {
            extractedData = await browserService.extractStructured(sessionId, 'products');
          } else {
            extractedData = await browserService.extractContent(sessionId);
          }
        }

        results.push({
          url,
          success: true,
          data: extractedData
        });

        // Fechar sessão
        await browserService.closeSession(sessionId);

      } catch (error) {
        console.error(`❌ Erro ao navegar para ${url}:`, error.message);
        results.push({
          url,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Processar e executar pedido completo
   */
  async processAndExecute(userMessage, context = {}) {
    // 1. Processar pedido
    const { response, decision } = await this.processUserRequest(userMessage, context);

    // 2. Executar navegação se necessário
    let navigationResults = null;
    if (decision.action === 'navigate' || decision.action === 'search') {
      navigationResults = await this.executeNavigation(decision);
    }

    // 3. Retornar resultado completo
    return {
      message: decision.message,
      response: response,
      action: decision.action,
      reasoning: decision.reasoning,
      question: decision.question,
      navigationResults,
      conversationHistory: this.conversationHistory
    };
  }

  /**
   * Limpar histórico de conversa
   */
  clearHistory() {
    this.conversationHistory = [];
    console.log('🧹 Histórico limpo');
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      knowledgeBase: {
        totalUrls: this.knowledgeBase.totalUrls,
        categories: Object.keys(this.knowledgeBase.categories).length,
        domains: Object.keys(this.knowledgeBase.urlPatterns).length,
        searchPatterns: Object.keys(this.knowledgeBase.searchPatterns).length
      },
      conversation: {
        messages: this.conversationHistory.length,
        userMessages: this.conversationHistory.filter(m => m.role === 'user').length,
        assistantMessages: this.conversationHistory.filter(m => m.role === 'assistant').length
      }
    };
  }
}

// Instância singleton
const orchestrator = new IntelligentNavigatorOrchestrator();

export { orchestrator, IntelligentNavigatorOrchestrator };
export default orchestrator;
