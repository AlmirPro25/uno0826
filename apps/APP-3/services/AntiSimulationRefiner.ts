import { AntiSimulationSystem } from './AntiSimulationSystem';

export interface AntiSimulationConfig {
  strictness: 'low' | 'medium' | 'high';
  allowControlledSimulation: boolean;
  simulationThreshold: number;
  autoCorrection: boolean;
}

/**
 * Sistema Anti-Simulação Refinado - Menos restritivo, mais inteligente
 */
export class AntiSimulationRefiner {
  private config: AntiSimulationConfig;
  
  constructor(config: Partial<AntiSimulationConfig> = {}) {
    this.config = {
      strictness: 'medium',
      allowControlledSimulation: true,
      simulationThreshold: 0.3, // 30% de simulação permitida
      autoCorrection: true,
      ...config
    };
  }
  
  /**
   * Análise inteligente de simulação - menos restritiva
   */
  async analyzeSimulation(code: string): Promise<{
    isSimulated: boolean;
    simulationLevel: number;
    allowedToPass: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let simulationScore = 0;
    
    // Padrões que indicam simulação REAL (mais específicos)
    const criticalSimulationPatterns = [
      /console\.log\(['"`]Simulando.*['"`]\)/gi,
      /\/\*.*simulação.*\*\//gi,
      /\/\/.*simula.*função/gi,
      /function.*mock.*\(\)/gi,
      /const.*mock.*=/gi,
      /\.mockImplementation/gi,
      /jest\.mock/gi,
      /sinon\.stub/gi
    ];
    
    // Padrões menos críticos (podem ser aceitáveis)
    const minorSimulationPatterns = [
      /setTimeout.*console\.log/gi,
      /placeholder.*data/gi,
      /demo.*content/gi,
      /example.*function/gi
    ];
    
    // Verificar padrões críticos
    for (const pattern of criticalSimulationPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        simulationScore += matches.length * 0.3;
        issues.push(`Simulação detectada: ${matches[0]}`);
      }
    }
    
    // Verificar padrões menores (peso menor)
    for (const pattern of minorSimulationPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        simulationScore += matches.length * 0.1;
      }
    }
    
    // Normalizar score (0-1)
    simulationScore = Math.min(simulationScore, 1);
    
    const isSimulated = simulationScore > this.config.simulationThreshold;
    const allowedToPass = this.shouldAllowCode(simulationScore, code);
    
    // Gerar sugestões baseadas no nível de strictness
    if (isSimulated && this.config.autoCorrection) {
      suggestions.push(...this.generateCorrections(code, issues));
    }
    
    return {
      isSimulated,
      simulationLevel: simulationScore,
      allowedToPass,
      issues,
      suggestions
    };
  }
  
  /**
   * Decide se código deve passar baseado em contexto
   */
  private shouldAllowCode(simulationScore: number, code: string): boolean {
    // Se strictness é baixa, ser mais permissivo
    if (this.config.strictness === 'low') {
      return simulationScore < 0.6;
    }
    
    // Se strictness é alta, ser mais rigoroso
    if (this.config.strictness === 'high') {
      return simulationScore < 0.1;
    }
    
    // Strictness média - análise contextual
    if (this.config.allowControlledSimulation) {
      // Permitir simulação controlada em contextos específicos
      const hasRealFunctionality = this.hasRealFunctionality(code);
      const isPrototype = this.isPrototypeCode(code);
      
      if (hasRealFunctionality || isPrototype) {
        return simulationScore < 0.5;
      }
    }
    
    return simulationScore < this.config.simulationThreshold;
  }
  
  /**
   * Verifica se código tem funcionalidade real
   */
  private hasRealFunctionality(code: string): boolean {
    const realFunctionalityPatterns = [
      /addEventListener/gi,
      /fetch\(/gi,
      /XMLHttpRequest/gi,
      /localStorage/gi,
      /sessionStorage/gi,
      /querySelector/gi,
      /getElementById/gi,
      /createElement/gi,
      /appendChild/gi,
      /removeChild/gi,
      /classList\./gi,
      /style\./gi
    ];
    
    return realFunctionalityPatterns.some(pattern => pattern.test(code));
  }
  
  /**
   * Verifica se é código de protótipo/demo
   */
  private isPrototypeCode(code: string): boolean {
    const prototypeIndicators = [
      /prototype/gi,
      /demo/gi,
      /example/gi,
      /sample/gi,
      /test.*data/gi,
      /placeholder/gi
    ];
    
    const matches = prototypeIndicators.filter(pattern => pattern.test(code)).length;
    return matches >= 2; // Múltiplos indicadores sugerem protótipo
  }
  
  /**
   * Gera correções automáticas para simulação
   */
  private generateCorrections(code: string, issues: string[]): string[] {
    const corrections: string[] = [];
    
    if (issues.some(issue => issue.includes('console.log'))) {
      corrections.push('Remover console.log de simulação');
      corrections.push('Implementar funcionalidade real no lugar');
    }
    
    if (issues.some(issue => issue.includes('mock'))) {
      corrections.push('Substituir mocks por implementação real');
      corrections.push('Conectar com APIs ou serviços reais');
    }
    
    if (issues.some(issue => issue.includes('setTimeout'))) {
      corrections.push('Implementar lógica assíncrona real');
      corrections.push('Usar promises ou async/await apropriados');
    }
    
    return corrections;
  }
  
  /**
   * Aplica correções automáticas no código
   */
  async applyAutoCorrections(code: string): Promise<string> {
    if (!this.config.autoCorrection) {
      return code;
    }
    
    let correctedCode = code;
    
    // Remover console.log de simulação
    correctedCode = correctedCode.replace(
      /console\.log\(['"`]Simulando.*['"`]\);?\n?/gi,
      ''
    );
    
    // Remover comentários de simulação
    correctedCode = correctedCode.replace(
      /\/\*.*simulação.*\*\/\n?/gi,
      ''
    );
    
    correctedCode = correctedCode.replace(
      /\/\/.*simula.*função.*\n?/gi,
      ''
    );
    
    // Substituir setTimeout simulado por implementação real
    correctedCode = correctedCode.replace(
      /setTimeout\(\(\) => \{\s*console\.log\(.*\);\s*\}, \d+\);?/gi,
      '// Implementar funcionalidade real aqui'
    );
    
    return correctedCode;
  }
  
  /**
   * Integração com sistema existente
   */
  static async refineAntiSimulation(code: string): Promise<{
    refinedCode: string;
    passed: boolean;
    analysis: any;
  }> {
    const refiner = new AntiSimulationRefiner({
      strictness: 'medium',
      allowControlledSimulation: true,
      simulationThreshold: 0.4,
      autoCorrection: true
    });
    
    const analysis = await refiner.analyzeSimulation(code);
    
    let refinedCode = code;
    if (analysis.isSimulated && !analysis.allowedToPass) {
      refinedCode = await refiner.applyAutoCorrections(code);
      
      // Re-analisar após correções
      const reanalysis = await refiner.analyzeSimulation(refinedCode);
      analysis.allowedToPass = reanalysis.allowedToPass;
    }
    
    return {
      refinedCode,
      passed: analysis.allowedToPass,
      analysis
    };
  }
}
