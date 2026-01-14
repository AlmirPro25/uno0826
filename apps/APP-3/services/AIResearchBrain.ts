/**
 * 🧠 AI RESEARCH BRAIN - O Cérebro Pesquisador
 * 
 * Integra o WebResearchEngine com o Gemini para criar um agente
 * que pesquisa na internet real e usa o conhecimento para responder
 * 
 * @version 1.0.0
 * @author Sistema de Pesquisa Cognitiva
 * 
 * FILOSOFIA: "CONHECIMENTO REAL, RESPOSTAS REAIS"
 */

import { 
  WebResearchEngine, 
  KnowledgePacket, 
  ResearchResult,
  ResearchQuery 
} from './WebResearchEngine';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ResearchContext {
  query: string;
  packets: KnowledgePacket[];
  summary: string;
  sources: string[];
  timestamp: string;
}

export interface AIResearchRequest {
  userPrompt: string;
  enableResearch?: boolean;
  researchDepth?: 'quick' | 'normal' | 'deep';
  preferredSources?: string[];
  language?: string;
  includeCode?: boolean;
  includeNews?: boolean;
}

export interface AIResearchResponse {
  answer: string;
  researchContext?: ResearchContext;
  sources: string[];
  confidence: number;
  usedResearch: boolean;
  processingTime: number;
}

export interface ResearchDecision {
  shouldResearch: boolean;
  reason: string;
  suggestedQuery?: string;
  suggestedSources?: string[];
}

// ============================================================================
// PROMPTS DO SISTEMA
// ============================================================================

const RESEARCH_DECISION_PROMPT = `
Você é um assistente que decide se uma pergunta precisa de pesquisa na internet.

REGRAS:
1. Pesquise se a pergunta é sobre:
   - Notícias recentes ou eventos atuais
   - Documentação técnica específica
   - Dados que mudam frequentemente
   - Informações que você não tem certeza
   - Tutoriais ou guias específicos
   - Papers científicos ou pesquisas

2. NÃO pesquise se:
   - É uma pergunta de opinião
   - É sobre conceitos básicos que você domina
   - É uma tarefa de programação simples
   - É uma conversa casual

Responda em JSON:
{
  "shouldResearch": true/false,
  "reason": "motivo da decisão",
  "suggestedQuery": "query otimizada para pesquisa (se shouldResearch=true)",
  "suggestedSources": ["fonte1", "fonte2"] // opcional
}
`;

const RESEARCH_SYNTHESIS_PROMPT = `
Você é um assistente que sintetiza informações de pesquisa para responder perguntas.

CONTEXTO DA PESQUISA:
{research_context}

PERGUNTA DO USUÁRIO:
{user_question}

REGRAS:
1. Use APENAS informações da pesquisa fornecida
2. Cite as fontes quando usar informações específicas
3. Se a pesquisa não tiver a resposta, diga claramente
4. Seja preciso e factual
5. Organize a resposta de forma clara
6. Inclua código se relevante e disponível na pesquisa

FORMATO:
- Resposta clara e direta
- Citações no formato [Fonte: nome]
- Código em blocos markdown se aplicável
- Links relevantes no final
`;

// ============================================================================
// CLASSE PRINCIPAL - AI RESEARCH BRAIN
// ============================================================================

export class AIResearchBrain {
  private researchEngine: WebResearchEngine;
  private researchHistory: ResearchContext[] = [];
  private maxHistorySize: number = 10;

  constructor() {
    this.researchEngine = new WebResearchEngine();
  }

  // ---------------------------------------------------------------------------
  // MÉTODO PRINCIPAL - PROCESSAR COM PESQUISA
  // ---------------------------------------------------------------------------

  /**
   * Processa uma pergunta, decidindo se precisa pesquisar e sintetizando a resposta
   */
  async process(request: AIResearchRequest): Promise<AIResearchResponse> {
    const startTime = Date.now();
    let researchContext: ResearchContext | undefined;
    let usedResearch = false;

    console.log(`🧠 AIResearchBrain processando: "${request.userPrompt.slice(0, 100)}..."`);

    // 1. Decidir se precisa pesquisar
    const decision = request.enableResearch !== false 
      ? await this.decideResearch(request.userPrompt)
      : { shouldResearch: false, reason: 'Pesquisa desabilitada' };

    console.log(`📊 Decisão de pesquisa: ${decision.shouldResearch ? 'SIM' : 'NÃO'} - ${decision.reason}`);

    // 2. Se precisa pesquisar, executar pesquisa
    if (decision.shouldResearch && decision.suggestedQuery) {
      const researchResult = await this.executeResearch({
        query: decision.suggestedQuery,
        sources: decision.suggestedSources || request.preferredSources,
        depth: request.researchDepth || 'normal',
        includeCode: request.includeCode,
        includeNews: request.includeNews,
        language: request.language
      });

      if (researchResult.packets.length > 0) {
        researchContext = {
          query: decision.suggestedQuery,
          packets: researchResult.packets,
          summary: researchResult.summary,
          sources: researchResult.sources,
          timestamp: researchResult.timestamp
        };
        usedResearch = true;

        // Salvar no histórico
        this.addToHistory(researchContext);
      }
    }

    // 3. Gerar resposta (com ou sem contexto de pesquisa)
    const answer = await this.generateAnswer(
      request.userPrompt,
      researchContext
    );

    // 4. Calcular confiança
    const confidence = this.calculateConfidence(researchContext, answer);

    return {
      answer,
      researchContext,
      sources: researchContext?.sources || [],
      confidence,
      usedResearch,
      processingTime: Date.now() - startTime
    };
  }

  // ---------------------------------------------------------------------------
  // DECISÃO DE PESQUISA
  // ---------------------------------------------------------------------------

  /**
   * Decide se uma pergunta precisa de pesquisa na internet
   */
  private async decideResearch(userPrompt: string): Promise<ResearchDecision> {
    // Palavras-chave que indicam necessidade de pesquisa
    const researchKeywords = [
      'notícia', 'news', 'recente', 'recent', 'atual', 'current',
      'última versão', 'latest', 'lançamento', 'release',
      'documentação', 'documentation', 'docs',
      'tutorial', 'como fazer', 'how to',
      'paper', 'artigo', 'pesquisa', 'research',
      'o que é', 'what is', 'explique', 'explain',
      'diferença entre', 'difference between',
      'melhor', 'best', 'recomendação', 'recommendation',
      'biblioteca', 'library', 'framework',
      'api', 'endpoint', 'integração'
    ];

    const promptLower = userPrompt.toLowerCase();
    const hasResearchKeyword = researchKeywords.some(kw => promptLower.includes(kw));

    // Palavras-chave que indicam que NÃO precisa pesquisar
    const noResearchKeywords = [
      'crie', 'create', 'faça', 'make', 'gere', 'generate',
      'escreva', 'write', 'código', 'code',
      'corrija', 'fix', 'debug',
      'refatore', 'refactor',
      'opinião', 'opinion', 'acha', 'think'
    ];

    const hasNoResearchKeyword = noResearchKeywords.some(kw => promptLower.includes(kw));

    // Decisão baseada em heurísticas
    if (hasNoResearchKeyword && !hasResearchKeyword) {
      return {
        shouldResearch: false,
        reason: 'Tarefa de criação/código que não requer pesquisa externa'
      };
    }

    if (hasResearchKeyword) {
      // Extrair query otimizada
      const suggestedQuery = this.extractSearchQuery(userPrompt);
      
      return {
        shouldResearch: true,
        reason: 'Pergunta requer informações atualizadas ou específicas',
        suggestedQuery,
        suggestedSources: this.suggestSources(userPrompt)
      };
    }

    // Caso ambíguo - pesquisar por segurança se for pergunta
    if (userPrompt.includes('?') || promptLower.startsWith('o que') || 
        promptLower.startsWith('como') || promptLower.startsWith('qual')) {
      return {
        shouldResearch: true,
        reason: 'Pergunta que pode se beneficiar de informações atualizadas',
        suggestedQuery: this.extractSearchQuery(userPrompt)
      };
    }

    return {
      shouldResearch: false,
      reason: 'Não identificada necessidade de pesquisa externa'
    };
  }

  /**
   * Extrai uma query de busca otimizada do prompt do usuário
   */
  private extractSearchQuery(userPrompt: string): string {
    // Remover palavras comuns e manter termos importantes
    const stopWords = [
      'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
      'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no',
      'para', 'por', 'com', 'sem', 'sobre',
      'que', 'qual', 'quais', 'como', 'onde', 'quando',
      'me', 'te', 'se', 'nos', 'vos',
      'é', 'são', 'foi', 'foram', 'ser', 'estar',
      'pode', 'posso', 'podemos', 'quero', 'preciso',
      'the', 'a', 'an', 'is', 'are', 'was', 'were',
      'what', 'how', 'where', 'when', 'why', 'which',
      'can', 'could', 'would', 'should', 'will'
    ];

    const words = userPrompt
      .toLowerCase()
      .replace(/[?!.,;:]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    // Pegar os 5 termos mais relevantes
    return words.slice(0, 5).join(' ');
  }

  /**
   * Sugere fontes baseado no conteúdo da pergunta
   */
  private suggestSources(userPrompt: string): string[] {
    const promptLower = userPrompt.toLowerCase();
    const sources: string[] = [];

    // Documentação
    if (promptLower.includes('react')) sources.push('React Docs');
    if (promptLower.includes('typescript') || promptLower.includes('ts')) sources.push('TypeScript Docs');
    if (promptLower.includes('node')) sources.push('Node.js Docs');
    if (promptLower.includes('python')) sources.push('Python Docs');
    if (promptLower.includes('go') || promptLower.includes('golang')) sources.push('Go Docs');
    if (promptLower.includes('rust')) sources.push('Rust Docs');
    if (promptLower.includes('css') || promptLower.includes('html') || promptLower.includes('javascript')) {
      sources.push('MDN Web Docs');
    }

    // Notícias
    if (promptLower.includes('notícia') || promptLower.includes('news') || 
        promptLower.includes('lançamento')) {
      sources.push('Hacker News', 'TechCrunch');
    }

    // Papers
    if (promptLower.includes('paper') || promptLower.includes('research') ||
        promptLower.includes('científico')) {
      sources.push('ArXiv', 'Papers With Code');
    }

    // Tutoriais
    if (promptLower.includes('tutorial') || promptLower.includes('como fazer')) {
      sources.push('Dev.to', 'FreeCodeCamp');
    }

    // Código
    if (promptLower.includes('github') || promptLower.includes('repositório') ||
        promptLower.includes('código')) {
      sources.push('GitHub');
    }

    // Wikipedia como fallback
    if (sources.length === 0) {
      sources.push('Wikipedia', 'Wikipedia PT');
    }

    return sources;
  }

  // ---------------------------------------------------------------------------
  // EXECUÇÃO DE PESQUISA
  // ---------------------------------------------------------------------------

  /**
   * Executa a pesquisa com os parâmetros especificados
   */
  private async executeResearch(params: {
    query: string;
    sources?: string[];
    depth: 'quick' | 'normal' | 'deep';
    includeCode?: boolean;
    includeNews?: boolean;
    language?: string;
  }): Promise<ResearchResult> {
    const maxResults = {
      quick: 5,
      normal: 10,
      deep: 20
    }[params.depth];

    const researchQuery: ResearchQuery = {
      query: params.query,
      sources: params.sources,
      maxResults,
      language: params.language || 'pt',
      includeCode: params.includeCode,
      includeNews: params.includeNews
    };

    return this.researchEngine.research(researchQuery);
  }

  // ---------------------------------------------------------------------------
  // GERAÇÃO DE RESPOSTA
  // ---------------------------------------------------------------------------

  /**
   * Gera resposta usando o contexto de pesquisa (se disponível)
   */
  private async generateAnswer(
    userPrompt: string,
    researchContext?: ResearchContext
  ): Promise<string> {
    // Se não tiver contexto de pesquisa, retornar indicação
    if (!researchContext || researchContext.packets.length === 0) {
      return this.generateAnswerWithoutResearch(userPrompt);
    }

    // Formatar contexto de pesquisa para o prompt
    const formattedContext = this.formatResearchContext(researchContext);

    // Construir prompt de síntese
    const synthesisPrompt = RESEARCH_SYNTHESIS_PROMPT
      .replace('{research_context}', formattedContext)
      .replace('{user_question}', userPrompt);

    // Chamar Gemini para sintetizar
    try {
      const { ApiKeyManager } = await import('./ApiKeyManager');
      const apiKey = ApiKeyManager.getKeyToUse();
      
      if (!apiKey) {
        return this.fallbackAnswer(userPrompt, researchContext);
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: synthesisPrompt
      });

      return response.text || this.fallbackAnswer(userPrompt, researchContext);

    } catch (error) {
      console.error('❌ Erro ao gerar resposta:', error);
      return this.fallbackAnswer(userPrompt, researchContext);
    }
  }

  /**
   * Gera resposta sem pesquisa (fallback)
   */
  private generateAnswerWithoutResearch(userPrompt: string): string {
    return `Não foi possível realizar pesquisa para esta pergunta. 
    
Por favor, reformule sua pergunta ou tente novamente mais tarde.

**Pergunta original:** ${userPrompt}`;
  }

  /**
   * Resposta de fallback usando apenas o contexto de pesquisa
   */
  private fallbackAnswer(userPrompt: string, context: ResearchContext): string {
    let answer = `## Resultados da Pesquisa\n\n`;
    answer += `**Pergunta:** ${userPrompt}\n\n`;
    answer += `**Fontes consultadas:** ${context.sources.join(', ')}\n\n`;
    answer += `---\n\n`;

    for (const packet of context.packets.slice(0, 5)) {
      answer += `### ${packet.title}\n`;
      answer += `*Fonte: ${packet.source}*\n\n`;
      answer += `${packet.summary}\n\n`;
      if (packet.url) {
        answer += `🔗 [Ler mais](${packet.url})\n\n`;
      }
      answer += `---\n\n`;
    }

    return answer;
  }

  /**
   * Formata o contexto de pesquisa para o prompt
   */
  private formatResearchContext(context: ResearchContext): string {
    let formatted = `## Resumo da Pesquisa\n${context.summary}\n\n`;
    formatted += `## Fontes: ${context.sources.join(', ')}\n\n`;
    formatted += `## Conteúdo Detalhado\n\n`;

    for (const packet of context.packets) {
      formatted += `### ${packet.title} [${packet.source}]\n`;
      formatted += `URL: ${packet.url}\n`;
      formatted += `Tipo: ${packet.type}\n\n`;
      formatted += `${packet.content.slice(0, 2000)}\n\n`;
      
      if (packet.codeBlocks.length > 0) {
        formatted += `**Código encontrado:**\n`;
        for (const code of packet.codeBlocks.slice(0, 3)) {
          formatted += `\`\`\`\n${code.slice(0, 500)}\n\`\`\`\n\n`;
        }
      }
      
      formatted += `---\n\n`;
    }

    return formatted;
  }

  // ---------------------------------------------------------------------------
  // CÁLCULO DE CONFIANÇA
  // ---------------------------------------------------------------------------

  /**
   * Calcula a confiança na resposta baseado na qualidade da pesquisa
   */
  private calculateConfidence(
    context: ResearchContext | undefined,
    answer: string
  ): number {
    if (!context) return 0.5; // Sem pesquisa = confiança média

    let confidence = 0.5;

    // Mais fontes = mais confiança
    confidence += Math.min(context.sources.length * 0.05, 0.2);

    // Mais pacotes = mais confiança
    confidence += Math.min(context.packets.length * 0.02, 0.15);

    // Fontes de alta prioridade
    const highPrioritySources = ['Wikipedia', 'MDN Web Docs', 'ArXiv', 'GitHub'];
    const hasHighPriority = context.sources.some(s => highPrioritySources.includes(s));
    if (hasHighPriority) confidence += 0.1;

    // Resposta longa = mais confiança (provavelmente mais detalhada)
    if (answer.length > 1000) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  // ---------------------------------------------------------------------------
  // HISTÓRICO
  // ---------------------------------------------------------------------------

  /**
   * Adiciona contexto ao histórico
   */
  private addToHistory(context: ResearchContext): void {
    this.researchHistory.unshift(context);
    if (this.researchHistory.length > this.maxHistorySize) {
      this.researchHistory.pop();
    }
  }

  /**
   * Obtém histórico de pesquisas
   */
  getHistory(): ResearchContext[] {
    return [...this.researchHistory];
  }

  /**
   * Limpa histórico
   */
  clearHistory(): void {
    this.researchHistory = [];
  }

  // ---------------------------------------------------------------------------
  // MÉTODOS DE CONVENIÊNCIA
  // ---------------------------------------------------------------------------

  /**
   * Pesquisa rápida sem processamento de IA
   */
  async quickSearch(query: string): Promise<ResearchResult> {
    return this.researchEngine.research({
      query,
      maxResults: 5
    });
  }

  /**
   * Pesquisa profunda com todas as fontes
   */
  async deepSearch(query: string): Promise<ResearchResult> {
    return this.researchEngine.deepResearch(query);
  }

  /**
   * Pesquisa específica na Wikipedia
   */
  async searchWikipedia(query: string, lang: string = 'pt'): Promise<KnowledgePacket[]> {
    return this.researchEngine.quickWikipedia(query, lang);
  }

  /**
   * Pesquisa de notícias tech
   */
  async searchNews(query: string): Promise<KnowledgePacket[]> {
    return this.researchEngine.quickNews(query);
  }

  /**
   * Lista fontes disponíveis
   */
  listSources(): string[] {
    return this.researchEngine.listSources().map(s => s.name);
  }
}

// ============================================================================
// SINGLETON E EXPORTS
// ============================================================================

export const aiResearchBrain = new AIResearchBrain();

export default AIResearchBrain;
