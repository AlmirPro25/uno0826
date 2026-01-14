// services/ErrorMitigationSystem.ts
// Sistema automático de mitigação de erros para interfaces

import { interfaceChecklist, validateInterface, autoFixInterface, type InterfaceValidationResult } from './InterfaceChecklistSystem';

export interface ErrorMitigationConfig {
  autoFix: boolean;
  criticalThreshold: number; // Score mínimo para aprovar
  maxRetries: number;
  enableRealTimeValidation: boolean;
  logLevel: 'silent' | 'minimal' | 'verbose';
}

export interface MitigationResult {
  success: boolean;
  originalScore: number;
  finalScore: number;
  iterations: number;
  appliedFixes: string[];
  remainingIssues: string[];
  finalCode: string;
  executionTime: number;
}

class ErrorMitigationManager {
  private config: ErrorMitigationConfig = {
    autoFix: true,
    criticalThreshold: 85, // Mínimo 85/100 para aprovar
    maxRetries: 3,
    enableRealTimeValidation: true,
    logLevel: 'verbose'
  };

  private isMonitoring = false;
  private validationQueue: string[] = [];

  /**
   * SISTEMA PRINCIPAL: Mitiga erros automaticamente até atingir qualidade mínima
   */
  async mitigateErrors(code: string, customConfig?: Partial<ErrorMitigationConfig>): Promise<MitigationResult> {
    const startTime = Date.now();
    const config = { ...this.config, ...customConfig };
    
    this.log('🛡️ Iniciando mitigação automática de erros...', 'verbose');

    let currentCode = code;
    let iteration = 0;
    let allAppliedFixes: string[] = [];
    let originalScore = 0;
    let currentScore = 0;

    try {
      // Validação inicial
      const initialValidation = await validateInterface(currentCode);
      originalScore = initialValidation.overallScore;
      currentScore = originalScore;

      this.log(`📊 Score inicial: ${originalScore}/100`, 'minimal');

      // Se já está bom, retornar
      if (originalScore >= config.criticalThreshold) {
        this.log(`✅ Código já atende critérios de qualidade (${originalScore}/100)`, 'minimal');
        return {
          success: true,
          originalScore,
          finalScore: originalScore,
          iterations: 0,
          appliedFixes: [],
          remainingIssues: [],
          finalCode: currentCode,
          executionTime: Date.now() - startTime
        };
      }

      // Ciclo de melhoria iterativa
      while (currentScore < config.criticalThreshold && iteration < config.maxRetries) {
        iteration++;
        this.log(`🔄 Iteração ${iteration}/${config.maxRetries} - Score atual: ${currentScore}/100`, 'verbose');

        // Aplicar correções automáticas
        if (config.autoFix) {
          const fixResult = await autoFixInterface(currentCode);
          
          if (fixResult.appliedFixes.length > 0) {
            currentCode = fixResult.fixedCode;
            allAppliedFixes.push(...fixResult.appliedFixes);
            
            this.log(`🔧 ${fixResult.appliedFixes.length} correções aplicadas:`, 'verbose');
            fixResult.appliedFixes.forEach(fix => {
              this.log(`  ✅ ${fix}`, 'verbose');
            });

            // Re-validar após correções
            const newValidation = await validateInterface(currentCode);
            const previousScore = currentScore;
            currentScore = newValidation.overallScore;

            this.log(`📈 Score: ${previousScore} → ${currentScore} (+${currentScore - previousScore})`, 'minimal');

            // Se não houve melhoria significativa, parar
            if (currentScore - previousScore < 5) {
              this.log(`⚠️ Melhoria insuficiente (+${currentScore - previousScore}). Parando iterações.`, 'verbose');
              break;
            }
          } else {
            this.log(`⚠️ Nenhuma correção automática disponível na iteração ${iteration}`, 'verbose');
            break;
          }
        }

        // Pequena pausa entre iterações
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Validação final
      const finalValidation = await validateInterface(currentCode);
      const remainingIssues = this.extractRemainingIssues(finalValidation);

      const success = finalValidation.overallScore >= config.criticalThreshold;
      const executionTime = Date.now() - startTime;

      // Log final
      if (success) {
        this.log(`🎉 SUCESSO! Score final: ${finalValidation.overallScore}/100 em ${iteration} iterações`, 'minimal');
      } else {
        this.log(`⚠️ Score final: ${finalValidation.overallScore}/100 - Abaixo do limiar (${config.criticalThreshold})`, 'minimal');
      }

      return {
        success,
        originalScore,
        finalScore: finalValidation.overallScore,
        iterations: iteration,
        appliedFixes: allAppliedFixes,
        remainingIssues,
        finalCode: currentCode,
        executionTime
      };

    } catch (error: any) {
      this.log(`❌ Erro durante mitigação: ${error.message}`, 'minimal');
      
      return {
        success: false,
        originalScore,
        finalScore: currentScore,
        iterations: iteration,
        appliedFixes: allAppliedFixes,
        remainingIssues: [`Erro crítico: ${error.message}`],
        finalCode: currentCode,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Validação em tempo real durante desenvolvimento
   */
  startRealTimeMonitoring(callback?: (result: InterfaceValidationResult) => void): void {
    if (this.isMonitoring) {
      this.log('⚠️ Monitoramento já está ativo', 'verbose');
      return;
    }

    this.isMonitoring = true;
    this.log('👁️ Iniciando monitoramento em tempo real...', 'verbose');

    // Observar mudanças no DOM
    const observer = new MutationObserver(async (mutations) => {
      let shouldValidate = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          shouldValidate = true;
        }
      });

      if (shouldValidate) {
        await this.queueValidation(document.documentElement.outerHTML, callback);
      }
    });

    if (typeof document !== 'undefined') {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'data-aid']
      });
    }

    this.log('✅ Monitoramento em tempo real ativado', 'minimal');
  }

  /**
   * Para monitoramento em tempo real
   */
  stopRealTimeMonitoring(): void {
    this.isMonitoring = false;
    this.log('🛑 Monitoramento em tempo real desativado', 'verbose');
  }

  /**
   * Fila de validação para evitar spam
   */
  private async queueValidation(code: string, callback?: (result: InterfaceValidationResult) => void): Promise<void> {
    const validationId = `validation_${Date.now()}`;
    this.validationQueue.push(validationId);

    // Debounce: aguardar 500ms antes de validar
    await new Promise(resolve => setTimeout(resolve, 500));

    // Se não é mais a validação mais recente, ignorar
    if (this.validationQueue[this.validationQueue.length - 1] !== validationId) {
      return;
    }

    try {
      const result = await validateInterface(code);
      
      if (result.overallScore < this.config.criticalThreshold) {
        this.log(`⚠️ Qualidade baixa detectada: ${result.overallScore}/100`, 'verbose');
        
        // Auto-correção se habilitada
        if (this.config.autoFix) {
          const mitigation = await this.mitigateErrors(code, { logLevel: 'minimal' });
          if (mitigation.success) {
            this.log(`🔧 Auto-correção aplicada: ${mitigation.finalScore}/100`, 'minimal');
          }
        }
      }

      callback?.(result);
      
    } catch (error: any) {
      this.log(`❌ Erro na validação em tempo real: ${error.message}`, 'verbose');
    }

    // Limpar fila
    this.validationQueue = this.validationQueue.filter(id => id !== validationId);
  }

  /**
   * Extrai problemas restantes após mitigação
   */
  private extractRemainingIssues(validation: InterfaceValidationResult): string[] {
    const issues: string[] = [];

    validation.criticalIssues.forEach(issue => {
      issues.push(`CRÍTICO: ${issue.message}`);
    });

    validation.warnings.forEach(warning => {
      issues.push(`AVISO: ${warning.message}`);
    });

    return issues;
  }

  /**
   * Sistema de logging configurável
   */
  private log(message: string, level: 'silent' | 'minimal' | 'verbose'): void {
    if (this.config.logLevel === 'silent') return;
    if (this.config.logLevel === 'minimal' && level === 'verbose') return;

    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
  }

  /**
   * Configurar sistema
   */
  configure(config: Partial<ErrorMitigationConfig>): void {
    this.config = { ...this.config, ...config };
    this.log(`⚙️ Configuração atualizada: ${JSON.stringify(config)}`, 'verbose');
  }

  /**
   * Obter configuração atual
   */
  getConfig(): ErrorMitigationConfig {
    return { ...this.config };
  }

  /**
   * Relatório de saúde do sistema
   */
  async generateHealthReport(code: string): Promise<{
    score: number;
    status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    recommendations: string[];
    estimatedFixTime: number;
  }> {
    const validation = await validateInterface(code);
    
    let status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    if (validation.overallScore >= 95) status = 'excellent';
    else if (validation.overallScore >= 85) status = 'good';
    else if (validation.overallScore >= 70) status = 'needs_improvement';
    else status = 'critical';

    const recommendations: string[] = [];
    
    if (validation.criticalIssues.length > 0) {
      recommendations.push(`Resolver ${validation.criticalIssues.length} problemas críticos`);
    }
    
    if (validation.warnings.length > 0) {
      recommendations.push(`Corrigir ${validation.warnings.length} avisos importantes`);
    }

    if (validation.autoFixesAvailable.length > 0) {
      recommendations.push(`${validation.autoFixesAvailable.length} correções automáticas disponíveis`);
    }

    // Estimar tempo de correção (baseado na complexidade)
    const estimatedFixTime = Math.max(1, Math.ceil(
      (validation.criticalIssues.length * 5) + 
      (validation.warnings.length * 2) + 
      (validation.suggestions.length * 1)
    ));

    return {
      score: validation.overallScore,
      status,
      recommendations,
      estimatedFixTime
    };
  }
}

// Instância singleton
export const errorMitigation = new ErrorMitigationManager();

// Funções utilitárias
export async function mitigateInterfaceErrors(
  code: string, 
  config?: Partial<ErrorMitigationConfig>
): Promise<MitigationResult> {
  return await errorMitigation.mitigateErrors(code, config);
}

export function startInterfaceMonitoring(callback?: (result: InterfaceValidationResult) => void): void {
  errorMitigation.startRealTimeMonitoring(callback);
}

export function stopInterfaceMonitoring(): void {
  errorMitigation.stopRealTimeMonitoring();
}

export async function getInterfaceHealthReport(code: string) {
  return await errorMitigation.generateHealthReport(code);
}

// Auto-inicialização em ambiente browser
if (typeof window !== 'undefined') {
  // Aguardar DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🛡️ Sistema de mitigação de erros carregado');
    });
  } else {
    console.log('🛡️ Sistema de mitigação de erros carregado');
  }
}
