/**
 * ============================================
 * AUTO-EVALUATION WRAPPER
 * ============================================
 * 
 * Wrapper que adiciona auto-avaliação automática
 * a qualquer função de geração de código.
 * 
 * USO SIMPLES:
 * 
 * const wrappedFunction = wrapWithAutoEvaluation(originalFunction);
 * const result = await wrappedFunction(prompt, ...args);
 * 
 * O código será automaticamente avaliado e refinado!
 */

import { unifiedQualitySystem, type UnifiedQualityReport } from './UnifiedQualitySystem';

// ============================================
// TIPOS
// ============================================

export interface AutoEvaluationResult {
  content: string;
  qualityReport: UnifiedQualityReport;
  wasRefined: boolean;
  refinementCount: number;
}

export interface AutoEvaluationOptions {
  enabled: boolean;
  minScore: number;
  maxRefinements: number;
  strictMode: boolean;
  verboseLogging: boolean;
}

// ============================================
// CONFIGURAÇÃO GLOBAL
// ============================================

let globalConfig: AutoEvaluationOptions = {
  enabled: true, // ✅ ATIVADO POR PADRÃO
  minScore: 85,
  maxRefinements: 2,
  strictMode: false,
  verboseLogging: true
};

/**
 * Configura auto-avaliação globalmente
 */
export function configureAutoEvaluation(config: Partial<AutoEvaluationOptions>) {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Obtém configuração atual
 */
export function getAutoEvaluationConfig(): AutoEvaluationOptions {
  return { ...globalConfig };
}

// ============================================
// WRAPPER PRINCIPAL
// ============================================

/**
 * Envolve uma função de geração de código com auto-avaliação automática
 * 
 * @param generateFn - Função que gera código (retorna string ou objeto com content)
 * @param refineFn - Função que refina código (recebe código e prompt, retorna código refinado)
 * @returns Função envolvida que retorna código avaliado e refinado
 */
export function wrapWithAutoEvaluation<T extends (...args: any[]) => Promise<any>>(
  generateFn: T,
  refineFn?: (code: string, prompt: string) => Promise<string>
): (...args: Parameters<T>) => Promise<AutoEvaluationResult> {
  
  return async (...args: Parameters<T>): Promise<AutoEvaluationResult> => {
    // 1. Gerar código original
    const result = await generateFn(...args);
    
    // Extrair código do resultado
    let generatedCode: string;
    if (typeof result === 'string') {
      generatedCode = result;
    } else if (result && typeof result === 'object' && 'content' in result) {
      generatedCode = result.content;
    } else {
      throw new Error('Resultado da função de geração não é string nem objeto com content');
    }
    
    // 2. Se auto-avaliação está desabilitada, retornar código original
    if (!globalConfig.enabled) {
      const quickReport = unifiedQualitySystem.evaluate(generatedCode);
      return {
        content: generatedCode,
        qualityReport: quickReport,
        wasRefined: false,
        refinementCount: 0
      };
    }
    
    // 3. Se não há função de refinamento, apenas avaliar
    if (!refineFn) {
      const report = unifiedQualitySystem.evaluate(generatedCode);
      return {
        content: generatedCode,
        qualityReport: report,
        wasRefined: false,
        refinementCount: 0
      };
    }
    
    // 4. Avaliar e refinar automaticamente
    const { code: refinedCode, report } = await unifiedQualitySystem.evaluateAndRefine(
      generatedCode,
      refineFn,
      args[0] as string // Primeiro argumento geralmente é o prompt
    );
    
    return {
      content: refinedCode,
      qualityReport: report,
      wasRefined: report.refinementCount > 0,
      refinementCount: report.refinementCount
    };
  };
}

// ============================================
// HELPER: AVALIAR CÓDIGO EXISTENTE
// ============================================

/**
 * Avalia código existente sem refinar
 */
export function evaluateCode(htmlCode: string): UnifiedQualityReport {
  return unifiedQualitySystem.evaluate(htmlCode);
}

/**
 * Avalia e refina código existente
 */
export async function evaluateAndRefineCode(
  htmlCode: string,
  refineFn: (code: string, prompt: string) => Promise<string>,
  originalPrompt: string = ''
): Promise<{ code: string; report: UnifiedQualityReport }> {
  return await unifiedQualitySystem.evaluateAndRefine(htmlCode, refineFn, originalPrompt);
}

// ============================================
// HELPER: GERAR RELATÓRIO
// ============================================

/**
 * Gera relatório formatado em Markdown
 */
export function generateReport(report: UnifiedQualityReport): string {
  return unifiedQualitySystem.generateMarkdownReport(report);
}

// ============================================
// EXPORTAÇÕES
// ============================================

export default {
  wrapWithAutoEvaluation,
  configureAutoEvaluation,
  getAutoEvaluationConfig,
  evaluateCode,
  evaluateAndRefineCode,
  generateReport
};
