import { useAppStore } from '@/store/useAppStore';
import { generateAiResponseStream } from '@/services/GeminiService';

export interface QualityScore {
  performance: number;
  accessibility: number;
  responsiveness: number;
  codeQuality: number;
  userExperience: number;
  totalScore: number;
  improvements: string[];
  metrics: any;
}

/**
 * Sistema Universal de Pontuação - Funciona em TODAS as modalidades
 * Independente de anti-simulação estar ligado ou não
 */
export class UniversalScoringSystem {
  
  /**
   * Avalia código automaticamente após qualquer geração
   */
  static async evaluateCodeAfterGeneration(code: string, generationMode: string): Promise<QualityScore> {
    console.log(`📊 Avaliando código gerado em modo: ${generationMode}`);
    
    const store = useAppStore.getState();
    
    try {
      // Usar sistema de pontuação existente do store
      const score = await store.calculateImprovementScore('', code, '');
      
      // Salvar pontuação no estado
      const currentState = useAppStore.getState();
      useAppStore.setState({ 
        currentScore: score,
        scoreHistory: [...currentState.scoreHistory, {
          timestamp: Date.now(),
          score: score.totalScore,
          improvements: score.improvements
        }]
      });
      
      console.log(`📊 Pontuação calculada: ${score.totalScore}/100`);
      return score;
      
    } catch (error) {
      console.error('Erro na avaliação:', error);
      return this.getFallbackScore();
    }
  }
  
  /**
   * Auto-correção inteligente baseada na pontuação
   */
  static async autoCorrectIfNeeded(code: string, score: QualityScore, threshold: number = 75): Promise<string> {
    if (score.totalScore >= threshold) {
      console.log(`✅ Código aprovado com pontuação ${score.totalScore}/100`);
      return code;
    }
    
    console.log(`🔧 Pontuação baixa (${score.totalScore}/100). Iniciando auto-correção...`);
    
    useAppStore.setState({ aiStatusMessage: `🔧 Auto-corrigindo código (pontuação: ${score.totalScore}/100)...` });
    
    try {
      const correctedCode = await this.performAutoCorrection(code, score);
      
      // Reavaliar código corrigido
      const newScore = await this.evaluateCodeAfterGeneration(correctedCode, 'auto-correction');
      
      useAppStore.setState({ aiStatusMessage: `✅ Auto-correção concluída! Nova pontuação: ${newScore.totalScore}/100` });
      
      return correctedCode;
      
    } catch (error) {
      console.error('Erro na auto-correção:', error);
      useAppStore.setState({ aiStatusMessage: '❌ Erro na auto-correção. Mantendo código original.' });
      return code;
    }
  }
  
  /**
   * Executa correção automática do código
   */
  private static async performAutoCorrection(code: string, score: QualityScore): Promise<string> {
    const correctionPrompt = this.buildCorrectionPrompt(code, score);
    
    try {
      let correctedCode = "";
      const stream = generateAiResponseStream(correctionPrompt, 'refine_code_no_plan', 'gemini-2.5-flash', false, null, code, null, []);
      
      for await (const chunk of stream) {
        correctedCode += chunk.chunk;
      }
      
      return correctedCode || code;
    } catch (error) {
      console.error('Erro na correção automática:', error);
      return code;
    }
  }
  
  /**
   * Constrói prompt de correção baseado nos problemas identificados
   */
  private static buildCorrectionPrompt(code: string, score: QualityScore): string {
    const issues = [];
    
    if (score.performance < 80) issues.push('- Otimizar performance (lazy loading, scripts async)');
    if (score.accessibility < 80) issues.push('- Melhorar acessibilidade (alt text, ARIA labels, estrutura semântica)');
    if (score.responsiveness < 80) issues.push('- Aprimorar responsividade (mobile-first, breakpoints)');
    if (score.codeQuality < 80) issues.push('- Refinar qualidade do código (organização, comentários)');
    if (score.userExperience < 80) issues.push('- Melhorar UX/UI (interações, feedback visual)');
    
    return `
SISTEMA DE AUTO-CORREÇÃO UNIVERSAL

CÓDIGO ATUAL:
\`\`\`html
${code}
\`\`\`

PONTUAÇÃO ATUAL: ${score.totalScore}/100
- Performance: ${score.performance}/100
- Acessibilidade: ${score.accessibility}/100  
- Responsividade: ${score.responsiveness}/100
- Qualidade: ${score.codeQuality}/100
- UX/UI: ${score.userExperience}/100

CORREÇÕES NECESSÁRIAS:
${issues.join('\n')}

INSTRUÇÕES:
1. Mantenha toda funcionalidade existente
2. Aplique apenas as correções necessárias
3. NÃO altere design visual drasticamente
4. Foque em melhorar os pontos fracos identificados
5. Retorne apenas o código HTML corrigido

OBJETIVO: Atingir pontuação mínima de 85/100
`;
  }
  
  /**
   * Intercepta qualquer geração de código para aplicar avaliação
   */
  static async interceptCodeGeneration(
    originalFunction: Function,
    ...args: any[]
  ): Promise<any> {
    console.log('🎯 Interceptando geração de código para avaliação universal');
    
    // Executar função original
    const result = await originalFunction(...args);
    
    // Se resultado contém código, avaliar
    if (result && typeof result === 'string' && result.includes('<html')) {
      const score = await this.evaluateCodeAfterGeneration(result, 'intercepted');
      
      // Auto-corrigir se necessário
      const correctedCode = await this.autoCorrectIfNeeded(result, score);
      
      return correctedCode;
    }
    
    return result;
  }
  
  /**
   * Ativa interceptação em todas as funções de geração
   */
  static activateUniversalScoring() {
    const store = useAppStore.getState();
    
    // Interceptar handleAiCommand
    const originalHandleAiCommand = store.handleAiCommand;
    store.handleAiCommand = async (...args) => {
      const result = await originalHandleAiCommand(...args);
      
      // Avaliar código após geração normal
      const currentCode = useAppStore.getState().htmlCode;
      if (currentCode && currentCode.length > 100) {
        setTimeout(async () => {
          const score = await this.evaluateCodeAfterGeneration(currentCode, 'normal');
          await this.autoCorrectIfNeeded(currentCode, score);
        }, 1000);
      }
      
      return result;
    };
    
    // Interceptar handleAiCommandWithAntiSimulation
    const originalAntiSim = store.handleAiCommandWithAntiSimulation;
    store.handleAiCommandWithAntiSimulation = async (...args) => {
      const result = await originalAntiSim(...args);
      
      // Avaliar código após geração anti-simulação
      const currentCode = useAppStore.getState().htmlCode;
      if (currentCode && currentCode.length > 100) {
        setTimeout(async () => {
          const score = await this.evaluateCodeAfterGeneration(currentCode, 'anti-simulation');
          await this.autoCorrectIfNeeded(currentCode, score);
        }, 1000);
      }
      
      return result;
    };
    
    console.log('✅ Sistema Universal de Pontuação ativado em todas as modalidades');
  }
  
  /**
   * Score padrão em caso de erro
   */
  private static getFallbackScore(): QualityScore {
    return {
      performance: 70,
      accessibility: 70,
      responsiveness: 70,
      codeQuality: 70,
      userExperience: 70,
      totalScore: 70,
      improvements: ['Avaliação básica aplicada'],
      metrics: {}
    };
  }
}

// Auto-ativar quando importado
if (typeof window !== 'undefined') {
  setTimeout(() => {
    UniversalScoringSystem.activateUniversalScoring();
  }, 1000);
}
