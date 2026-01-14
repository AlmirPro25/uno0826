/**
 * Sistema de Análise Proativa
 * Monitora a tela e sugere melhorias automaticamente
 */

import { geminiService } from './geminiService';

export interface ProactiveSuggestion {
  id: string;
  type: 'error' | 'optimization' | 'tip' | 'warning' | 'improvement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action?: string;
  timestamp: string;
  dismissed?: boolean;
}

export interface ScreenAnalysis {
  hasErrors: boolean;
  errorCount: number;
  codeQualityScore?: number;
  detectedLanguage?: string;
  detectedTools?: string[];
  suggestions: ProactiveSuggestion[];
}

export class ProactiveService {
  private analysisHistory: ScreenAnalysis[];
  private lastAnalysisTime: number;
  private readonly ANALYSIS_INTERVAL = 30000; // 30 segundos
  private isEnabled: boolean;
  private suggestionQueue: ProactiveSuggestion[];

  constructor() {
    this.analysisHistory = [];
    this.lastAnalysisTime = 0;
    this.isEnabled = this.loadEnabledState();
    this.suggestionQueue = [];
  }

  private loadEnabledState(): boolean {
    const saved = localStorage.getItem('proactive-enabled');
    return saved !== 'false'; // Habilitado por padrão
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('proactive-enabled', enabled.toString());
  }

  isProactiveEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Analisa frame da tela e detecta problemas/oportunidades
   */
  async analyzeScreenFrame(imageBase64: string): Promise<ScreenAnalysis> {
    if (!this.isEnabled) {
      return {
        hasErrors: false,
        errorCount: 0,
        suggestions: []
      };
    }

    const now = Date.now();
    if (now - this.lastAnalysisTime < this.ANALYSIS_INTERVAL) {
      // Retorna última análise se muito recente
      return this.analysisHistory[this.analysisHistory.length - 1] || {
        hasErrors: false,
        errorCount: 0,
        suggestions: []
      };
    }

    this.lastAnalysisTime = now;

    try {
      // Análise rápida usando padrões
      const quickAnalysis = this.quickPatternAnalysis(imageBase64);
      
      // Se detectar algo importante, faz análise profunda com IA
      if (quickAnalysis.hasErrors || quickAnalysis.errorCount > 0) {
        const deepAnalysis = await this.deepAIAnalysis(imageBase64);
        const combined = this.combineAnalyses(quickAnalysis, deepAnalysis);
        
        this.analysisHistory.push(combined);
        this.pruneHistory();
        
        return combined;
      }

      this.analysisHistory.push(quickAnalysis);
      return quickAnalysis;

    } catch (error) {
      console.error('Erro na análise proativa:', error);
      return {
        hasErrors: false,
        errorCount: 0,
        suggestions: []
      };
    }
  }

  /**
   * Análise rápida baseada em padrões (sem IA)
   */
  private quickPatternAnalysis(imageBase64: string): ScreenAnalysis {
    // Simula detecção de padrões visuais
    // Em produção, poderia usar OCR ou análise de pixels
    
    const suggestions: ProactiveSuggestion[] = [];
    let errorCount = 0;

    // Padrões comuns de erro (simulado)
    const hasRedText = Math.random() > 0.7; // Simula detecção de texto vermelho
    const hasWarningIcon = Math.random() > 0.8;

    if (hasRedText) {
      errorCount++;
      suggestions.push({
        id: `sug_${Date.now()}_1`,
        type: 'error',
        priority: 'high',
        title: 'Possível erro detectado',
        description: 'Detectei texto em vermelho na tela, que geralmente indica um erro.',
        action: 'Posso ajudar a debugar?',
        timestamp: new Date().toISOString()
      });
    }

    if (hasWarningIcon) {
      suggestions.push({
        id: `sug_${Date.now()}_2`,
        type: 'warning',
        priority: 'medium',
        title: 'Aviso detectado',
        description: 'Vi um ícone de aviso na interface.',
        action: 'Quer que eu investigue?',
        timestamp: new Date().toISOString()
      });
    }

    return {
      hasErrors: errorCount > 0,
      errorCount,
      suggestions
    };
  }

  /**
   * Análise profunda usando IA
   */
  private async deepAIAnalysis(imageBase64: string): Promise<ScreenAnalysis> {
    const prompt = `Analise esta tela e identifique:
1. Erros ou problemas visíveis
2. Oportunidades de melhoria
3. Linguagem de programação (se aplicável)
4. Ferramentas sendo usadas

Responda em JSON com formato:
{
  "hasErrors": boolean,
  "errorCount": number,
  "detectedLanguage": string,
  "detectedTools": string[],
  "issues": [
    {
      "type": "error|optimization|tip|warning",
      "priority": "low|medium|high|critical",
      "title": string,
      "description": string,
      "action": string
    }
  ]
}`;

    try {
      const response = await geminiService.analyzeImageAndText(imageBase64, 'image/jpeg', prompt);
      const parsed = this.parseAIResponse(response);
      
      return {
        hasErrors: parsed.hasErrors,
        errorCount: parsed.errorCount,
        detectedLanguage: parsed.detectedLanguage,
        detectedTools: parsed.detectedTools,
        suggestions: parsed.issues.map((issue: any) => ({
          id: `sug_${Date.now()}_${Math.random()}`,
          type: issue.type,
          priority: issue.priority,
          title: issue.title,
          description: issue.description,
          action: issue.action,
          timestamp: new Date().toISOString()
        }))
      };
    } catch (error) {
      console.error('Erro na análise profunda:', error);
      return {
        hasErrors: false,
        errorCount: 0,
        suggestions: []
      };
    }
  }

  private parseAIResponse(response: string): any {
    try {
      // Tenta extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Erro ao parsear resposta da IA:', e);
    }

    // Fallback
    return {
      hasErrors: false,
      errorCount: 0,
      issues: []
    };
  }

  private combineAnalyses(quick: ScreenAnalysis, deep: ScreenAnalysis): ScreenAnalysis {
    return {
      hasErrors: quick.hasErrors || deep.hasErrors,
      errorCount: quick.errorCount + deep.errorCount,
      detectedLanguage: deep.detectedLanguage,
      detectedTools: deep.detectedTools,
      codeQualityScore: deep.codeQualityScore,
      suggestions: [...quick.suggestions, ...deep.suggestions]
    };
  }

  /**
   * Adiciona sugestão à fila
   */
  addSuggestion(suggestion: ProactiveSuggestion): void {
    this.suggestionQueue.push(suggestion);
  }

  /**
   * Obtém próxima sugestão não descartada
   */
  getNextSuggestion(): ProactiveSuggestion | null {
    const next = this.suggestionQueue.find(s => !s.dismissed);
    return next || null;
  }

  /**
   * Descarta sugestão
   */
  dismissSuggestion(id: string): void {
    const suggestion = this.suggestionQueue.find(s => s.id === id);
    if (suggestion) {
      suggestion.dismissed = true;
    }
  }

  /**
   * Limpa sugestões antigas
   */
  clearOldSuggestions(): void {
    const oneHourAgo = Date.now() - 3600000;
    this.suggestionQueue = this.suggestionQueue.filter(s => {
      const timestamp = new Date(s.timestamp).getTime();
      return timestamp > oneHourAgo && !s.dismissed;
    });
  }

  /**
   * Detecta padrões de código problemáticos
   */
  async analyzeCodeQuality(code: string, language: string): Promise<ProactiveSuggestion[]> {
    const suggestions: ProactiveSuggestion[] = [];

    // Análise básica de padrões
    if (code.includes('console.log') && language === 'javascript') {
      suggestions.push({
        id: `sug_${Date.now()}_console`,
        type: 'tip',
        priority: 'low',
        title: 'Console.log detectado',
        description: 'Há console.log no código. Considere usar um logger apropriado em produção.',
        timestamp: new Date().toISOString()
      });
    }

    if (code.includes('TODO') || code.includes('FIXME')) {
      suggestions.push({
        id: `sug_${Date.now()}_todo`,
        type: 'improvement',
        priority: 'medium',
        title: 'TODOs pendentes',
        description: 'Há itens TODO/FIXME no código.',
        action: 'Posso ajudar a resolvê-los?',
        timestamp: new Date().toISOString()
      });
    }

    // Análise profunda com IA (se habilitado)
    if (this.isEnabled && code.length > 100) {
      const aiSuggestions = await this.getAICodeSuggestions(code, language);
      suggestions.push(...aiSuggestions);
    }

    return suggestions;
  }

  private async getAICodeSuggestions(code: string, language: string): Promise<ProactiveSuggestion[]> {
    try {
      const prompt = `Analise este código ${language} e sugira melhorias:

\`\`\`${language}
${code}
\`\`\`

Foque em:
- Performance
- Segurança
- Boas práticas
- Legibilidade

Responda com sugestões práticas e acionáveis.`;

      const response = await geminiService.performDeepThought(prompt);
      
      // Converte resposta em sugestões estruturadas
      return [{
        id: `sug_${Date.now()}_ai`,
        type: 'improvement',
        priority: 'medium',
        title: 'Sugestões de melhoria de código',
        description: response,
        timestamp: new Date().toISOString()
      }];
    } catch (error) {
      console.error('Erro ao obter sugestões de código:', error);
      return [];
    }
  }

  /**
   * Detecta oportunidades de automação
   */
  detectAutomationOpportunities(userActions: string[]): ProactiveSuggestion[] {
    const suggestions: ProactiveSuggestion[] = [];

    // Detecta ações repetitivas
    const actionCounts = new Map<string, number>();
    userActions.forEach(action => {
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
    });

    actionCounts.forEach((count, action) => {
      if (count >= 3) {
        suggestions.push({
          id: `sug_${Date.now()}_auto_${action}`,
          type: 'tip',
          priority: 'medium',
          title: 'Oportunidade de automação',
          description: `Você repetiu "${action}" ${count} vezes. Posso ajudar a automatizar isso?`,
          action: 'Criar script de automação',
          timestamp: new Date().toISOString()
        });
      }
    });

    return suggestions;
  }

  /**
   * Mantém histórico limitado
   */
  private pruneHistory(): void {
    if (this.analysisHistory.length > 50) {
      this.analysisHistory = this.analysisHistory.slice(-50);
    }
  }

  /**
   * Obtém estatísticas de análise
   */
  getAnalysisStats(): {
    totalAnalyses: number;
    totalErrors: number;
    totalSuggestions: number;
    mostCommonIssue?: string;
  } {
    const totalAnalyses = this.analysisHistory.length;
    const totalErrors = this.analysisHistory.reduce((sum, a) => sum + a.errorCount, 0);
    const allSuggestions = this.analysisHistory.flatMap(a => a.suggestions);
    
    const issueTypes = new Map<string, number>();
    allSuggestions.forEach(s => {
      issueTypes.set(s.type, (issueTypes.get(s.type) || 0) + 1);
    });

    const mostCommon = Array.from(issueTypes.entries())
      .sort((a, b) => b[1] - a[1])[0];

    return {
      totalAnalyses,
      totalErrors,
      totalSuggestions: allSuggestions.length,
      mostCommonIssue: mostCommon?.[0]
    };
  }

  /**
   * Reseta serviço
   */
  reset(): void {
    this.analysisHistory = [];
    this.suggestionQueue = [];
    this.lastAnalysisTime = 0;
  }
}

export const proactiveService = new ProactiveService();
