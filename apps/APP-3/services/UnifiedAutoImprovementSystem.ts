// services/UnifiedAutoImprovementSystem.ts
// Sistema unificado de auto-avaliação e auto-correção inteligente

import { aiSelfEvaluationSystem, type SelfEvaluationResult, type SelfCorrectionResult } from './AISelfEvaluationSystem';
import { errorMitigation, type MitigationResult, type ErrorMitigationConfig } from './ErrorMitigationSystem';
import { validateInterface, type InterfaceValidationResult } from './InterfaceChecklistSystem';

export interface UnifiedImprovementConfig {
  // Configurações de auto-avaliação IA
  targetAIScore: number;
  maxAIIterations: number;
  
  // Configurações de mitigação de erros
  targetInterfaceScore: number;
  maxInterfaceIterations: number;
  
  // Configurações gerais
  enableParallelProcessing: boolean;
  logLevel: 'silent' | 'minimal' | 'verbose';
  stopOnFirstSuccess: boolean;
}

export interface UnifiedImprovementResult {
  success: boolean;
  
  // Scores iniciais e finais
  initialAIScore: number;
  finalAIScore: number;
  initialInterfaceScore: number;
  finalInterfaceScore: number;
  
  // Resultados detalhados
  aiEvaluationResult: SelfEvaluationResult;
  aiCorrectionResult: SelfCorrectionResult;
  interfaceMitigationResult: MitigationResult;
  
  // Código final
  finalCode: string;
  
  // Métricas
  totalIterations: number;
  executionTime: number;
  improvementPath: string[];
  
  // Status
  aiImprovementSuccessful: boolean;
  interfaceImprovementSuccessful: boolean;
}

class UnifiedAutoImprovementSystem {
  private config: UnifiedImprovementConfig = {
    targetAIScore: 90,
    maxAIIterations: 3,
    targetInterfaceScore: 85,
    maxInterfaceIterations: 3,
    enableParallelProcessing: false,
    logLevel: 'verbose',
    stopOnFirstSuccess: false
  };

  /**
   * SISTEMA PRINCIPAL: Executa ciclo completo de melhoria
   */
  async executeUnifiedImprovement(
    generatedCode: string,
    originalPrompt: string,
    customConfig?: Partial<UnifiedImprovementConfig>
  ): Promise<UnifiedImprovementResult> {
    const startTime = Date.now();
    const config = { ...this.config, ...customConfig };
    
    this.log('🚀 Iniciando sistema unificado de auto-melhoria', 'minimal');
    this.log(`🎯 Metas: IA ${config.targetAIScore}/100, Interface ${config.targetInterfaceScore}/100`, 'verbose');

    let currentCode = generatedCode;
    let totalIterations = 0;
    const improvementPath: string[] = [];

    // Avaliações iniciais
    const initialAIEvaluation = await aiSelfEvaluationSystem.performSelfEvaluation(currentCode, originalPrompt);
    const initialInterfaceValidation = await validateInterface(currentCode);

    const initialAIScore = initialAIEvaluation.qualityScore;
    const initialInterfaceScore = initialInterfaceValidation.overallScore;

    this.log(`📊 Scores iniciais - IA: ${initialAIScore}/100, Interface: ${initialInterfaceScore}/100`, 'minimal');

    // Verificar se já atende aos critérios
    if (initialAIScore >= config.targetAIScore && initialInterfaceScore >= config.targetInterfaceScore) {
      this.log('✨ Código já atende a todos os critérios de qualidade!', 'minimal');
      
      return {
        success: true,
        initialAIScore,
        finalAIScore: initialAIScore,
        initialInterfaceScore,
        finalInterfaceScore: initialInterfaceScore,
        aiEvaluationResult: initialAIEvaluation,
        aiCorrectionResult: {
          improvedCode: currentCode,
          changesApplied: ['Nenhuma correção necessária'],
          finalScore: initialAIScore,
          iterationsUsed: 0
        },
        interfaceMitigationResult: {
          success: true,
          originalScore: initialInterfaceScore,
          finalScore: initialInterfaceScore,
          iterations: 0,
          appliedFixes: [],
          remainingIssues: [],
          finalCode: currentCode,
          executionTime: 0
        },
        finalCode: currentCode,
        totalIterations: 0,
        executionTime: Date.now() - startTime,
        improvementPath: ['Código já otimizado'],
        aiImprovementSuccessful: true,
        interfaceImprovementSuccessful: true
      };
    }

    let aiResult: any = null;
    let interfaceResult: any = null;

    if (config.enableParallelProcessing) {
      // Processamento paralelo
      this.log('⚡ Executando melhorias em paralelo...', 'verbose');
      
      const [aiImprovement, interfaceImprovement] = await Promise.allSettled([
        this.executeAIImprovement(currentCode, originalPrompt, config),
        this.executeInterfaceImprovement(currentCode, config)
      ]);

      aiResult = aiImprovement.status === 'fulfilled' ? aiImprovement.value : null;
      interfaceResult = interfaceImprovement.status === 'fulfilled' ? interfaceImprovement.value : null;

      // Escolher o melhor resultado
      if (aiResult && interfaceResult) {
        const aiScore = aiResult.correctionDetails.finalScore;
        const interfaceScore = interfaceResult.finalScore;
        
        if (aiScore >= interfaceScore) {
          currentCode = aiResult.finalCode;
          improvementPath.push(`Paralelo: IA escolhida (${aiScore}/100 vs ${interfaceScore}/100)`);
        } else {
          currentCode = interfaceResult.finalCode;
          improvementPath.push(`Paralelo: Interface escolhida (${interfaceScore}/100 vs ${aiScore}/100)`);
        }
      } else if (aiResult) {
        currentCode = aiResult.finalCode;
        improvementPath.push('Paralelo: Apenas IA bem-sucedida');
      } else if (interfaceResult) {
        currentCode = interfaceResult.finalCode;
        improvementPath.push('Paralelo: Apenas Interface bem-sucedida');
      }

    } else {
      // Processamento sequencial inteligente
      this.log('🔄 Executando melhorias sequencialmente...', 'verbose');
      
      // Decidir qual sistema usar primeiro baseado nos scores
      const aiNeedsMore = (config.targetAIScore - initialAIScore);
      const interfaceNeedsMore = (config.targetInterfaceScore - initialInterfaceScore);
      
      if (aiNeedsMore >= interfaceNeedsMore) {
        // IA primeiro
        this.log('🤖 Priorizando melhoria por IA...', 'verbose');
        aiResult = await this.executeAIImprovement(currentCode, originalPrompt, config);
        
        if (aiResult.cycleSuccessful) {
          currentCode = aiResult.finalCode;
          improvementPath.push(`IA: ${initialAIScore} → ${aiResult.finalScore}/100`);
          
          if (config.stopOnFirstSuccess) {
            this.log('🎯 Primeira melhoria bem-sucedida, parando conforme configuração', 'verbose');
          } else {
            // Tentar melhorar interface também
            interfaceResult = await this.executeInterfaceImprovement(currentCode, config);
            if (interfaceResult.success) {
              currentCode = interfaceResult.finalCode;
              improvementPath.push(`Interface: ${interfaceResult.originalScore} → ${interfaceResult.finalScore}/100`);
            }
          }
        } else {
          // IA falhou, tentar interface
          this.log('⚠️ Melhoria por IA não atingiu meta, tentando interface...', 'verbose');
          interfaceResult = await this.executeInterfaceImprovement(currentCode, config);
          if (interfaceResult.success) {
            currentCode = interfaceResult.finalCode;
            improvementPath.push(`Interface (fallback): ${interfaceResult.originalScore} → ${interfaceResult.finalScore}/100`);
          }
        }
      } else {
        // Interface primeiro
        this.log('🎨 Priorizando melhoria de interface...', 'verbose');
        interfaceResult = await this.executeInterfaceImprovement(currentCode, config);
        
        if (interfaceResult.success) {
          currentCode = interfaceResult.finalCode;
          improvementPath.push(`Interface: ${interfaceResult.originalScore} → ${interfaceResult.finalScore}/100`);
          
          if (config.stopOnFirstSuccess) {
            this.log('🎯 Primeira melhoria bem-sucedida, parando conforme configuração', 'verbose');
          } else {
            // Tentar melhorar IA também
            aiResult = await this.executeAIImprovement(currentCode, originalPrompt, config);
            if (aiResult.cycleSuccessful) {
              currentCode = aiResult.finalCode;
              improvementPath.push(`IA: ${aiResult.originalScore} → ${aiResult.finalScore}/100`);
            }
          }
        } else {
          // Interface falhou, tentar IA
          this.log('⚠️ Melhoria de interface não atingiu meta, tentando IA...', 'verbose');
          aiResult = await this.executeAIImprovement(currentCode, originalPrompt, config);
          if (aiResult.cycleSuccessful) {
            currentCode = aiResult.finalCode;
            improvementPath.push(`IA (fallback): ${aiResult.originalScore} → ${aiResult.finalScore}/100`);
          }
        }
      }
    }

    // Avaliação final
    const finalAIEvaluation = await aiSelfEvaluationSystem.performSelfEvaluation(currentCode, originalPrompt);
    const finalInterfaceValidation = await validateInterface(currentCode);

    const finalAIScore = finalAIEvaluation.qualityScore;
    const finalInterfaceScore = finalInterfaceValidation.overallScore;

    const aiImprovementSuccessful = finalAIScore >= config.targetAIScore;
    const interfaceImprovementSuccessful = finalInterfaceScore >= config.targetInterfaceScore;
    const overallSuccess = aiImprovementSuccessful && interfaceImprovementSuccessful;

    const executionTime = Date.now() - startTime;

    // Log final
    if (overallSuccess) {
      this.log(`🎉 SUCESSO COMPLETO! IA: ${finalAIScore}/100, Interface: ${finalInterfaceScore}/100`, 'minimal');
    } else {
      this.log(`⚠️ Sucesso parcial. IA: ${finalAIScore}/100, Interface: ${finalInterfaceScore}/100`, 'minimal');
    }

    this.log(`⏱️ Tempo total: ${executionTime}ms`, 'verbose');

    return {
      success: overallSuccess,
      initialAIScore,
      finalAIScore,
      initialInterfaceScore,
      finalInterfaceScore,
      aiEvaluationResult: finalAIEvaluation,
      aiCorrectionResult: aiResult?.correctionDetails || {
        improvedCode: currentCode,
        changesApplied: ['Não executado'],
        finalScore: finalAIScore,
        iterationsUsed: 0
      },
      interfaceMitigationResult: interfaceResult || {
        success: false,
        originalScore: initialInterfaceScore,
        finalScore: finalInterfaceScore,
        iterations: 0,
        appliedFixes: [],
        remainingIssues: ['Não executado'],
        finalCode: currentCode,
        executionTime: 0
      },
      finalCode: currentCode,
      totalIterations,
      executionTime,
      improvementPath,
      aiImprovementSuccessful,
      interfaceImprovementSuccessful
    };
  }

  /**
   * Executa melhoria por IA
   */
  private async executeAIImprovement(
    code: string, 
    originalPrompt: string, 
    config: UnifiedImprovementConfig
  ) {
    this.log('🤖 Executando melhoria por IA...', 'verbose');
    
    return await aiSelfEvaluationSystem.executeFullSelfImprovementCycle(
      code,
      originalPrompt,
      config.targetAIScore
    );
  }

  /**
   * Executa melhoria de interface
   */
  private async executeInterfaceImprovement(
    code: string,
    config: UnifiedImprovementConfig
  ) {
    this.log('🎨 Executando melhoria de interface...', 'verbose');
    
    const mitigationConfig: Partial<ErrorMitigationConfig> = {
      criticalThreshold: config.targetInterfaceScore,
      maxRetries: config.maxInterfaceIterations,
      logLevel: config.logLevel
    };

    return await errorMitigation.mitigateErrors(code, mitigationConfig);
  }

  /**
   * Análise comparativa de diferentes abordagens
   */
  async benchmarkImprovementMethods(
    code: string,
    originalPrompt: string
  ): Promise<{
    aiOnly: UnifiedImprovementResult;
    interfaceOnly: UnifiedImprovementResult;
    sequential: UnifiedImprovementResult;
    parallel: UnifiedImprovementResult;
    recommendation: 'ai' | 'interface' | 'sequential' | 'parallel';
  }> {
    this.log('🔬 Executando benchmark de métodos de melhoria...', 'minimal');

    const [aiOnly, interfaceOnly, sequential, parallel] = await Promise.all([
      // IA apenas
      this.executeUnifiedImprovement(code, originalPrompt, {
        targetInterfaceScore: 0,
        logLevel: 'silent'
      }),
      
      // Interface apenas
      this.executeUnifiedImprovement(code, originalPrompt, {
        targetAIScore: 0,
        logLevel: 'silent'
      }),
      
      // Sequencial
      this.executeUnifiedImprovement(code, originalPrompt, {
        enableParallelProcessing: false,
        logLevel: 'silent'
      }),
      
      // Paralelo
      this.executeUnifiedImprovement(code, originalPrompt, {
        enableParallelProcessing: true,
        logLevel: 'silent'
      })
    ]);

    // Determinar melhor método
    const methods = [
      { name: 'ai', result: aiOnly },
      { name: 'interface', result: interfaceOnly },
      { name: 'sequential', result: sequential },
      { name: 'parallel', result: parallel }
    ];

    const bestMethod = methods.reduce((best, current) => {
      const currentScore = current.result.finalAIScore + current.result.finalInterfaceScore;
      const bestScore = best.result.finalAIScore + best.result.finalInterfaceScore;
      
      return currentScore > bestScore ? current : best;
    });

    this.log(`🏆 Melhor método: ${bestMethod.name}`, 'minimal');

    return {
      aiOnly,
      interfaceOnly,
      sequential,
      parallel,
      recommendation: bestMethod.name as any
    };
  }

  /**
   * Configurar sistema
   */
  configure(config: Partial<UnifiedImprovementConfig>): void {
    this.config = { ...this.config, ...config };
    this.log(`⚙️ Sistema reconfigurado: ${JSON.stringify(config)}`, 'verbose');
  }

  /**
   * Sistema de logging
   */
  private log(message: string, level: 'silent' | 'minimal' | 'verbose'): void {
    if (this.config.logLevel === 'silent') return;
    if (this.config.logLevel === 'minimal' && level === 'verbose') return;

    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
  }
}

// Instância singleton
export const unifiedAutoImprovement = new UnifiedAutoImprovementSystem();

// Função principal para uso direto
export async function executeAutoImprovement(
  generatedCode: string,
  originalPrompt: string,
  config?: Partial<UnifiedImprovementConfig>
): Promise<UnifiedImprovementResult> {
  return await unifiedAutoImprovement.executeUnifiedImprovement(
    generatedCode,
    originalPrompt,
    config
  );
}

// Função para benchmark
export async function benchmarkImprovementMethods(
  code: string,
  originalPrompt: string
) {
  return await unifiedAutoImprovement.benchmarkImprovementMethods(code, originalPrompt);
}

// Configuração rápida
export function configureAutoImprovement(config: Partial<UnifiedImprovementConfig>): void {
  unifiedAutoImprovement.configure(config);
}
