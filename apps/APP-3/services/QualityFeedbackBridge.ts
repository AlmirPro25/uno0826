/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🔗 QUALITY FEEDBACK BRIDGE - O ELO PERDIDO DA AGI-LITE 🔗             ║
 * ║                                                                              ║
 * ║         "O QA vira os olhos do Evolver"                                     ║
 * ║                                                                              ║
 * ║                    RLAIF: Reinforcement Learning from AI Feedback           ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo conecta:
 * - 📊 UnifiedQualitySystem (7 camadas de avaliação)
 * - 🧬 SupremeManifestEvolver (evolução autônoma)
 * - 🔮 SoulArchitect (criação de especialistas)
 * 
 * CICLO RLAIF:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    REINFORCEMENT LEARNING                       │
 * ├─────────────────────────────────────────────────────────────────┤
 * │   🔮 SoulArchitect: Forja especialista                         │
 * │        ↓                                                        │
 * │   💻 Gemini: Gera código                                       │
 * │        ↓                                                        │
 * │   📊 UnifiedQualitySystem: Avalia (7 camadas)                  │
 * │        ↓                                                        │
 * │   🔗 QualityFeedbackBridge: Converte para feedback             │
 * │        ↓                                                        │
 * │   🧬 SupremeEvolver: Aprende e evolui                          │
 * │        ↓                                                        │
 * │   🔄 Loop: Sistema fica mais inteligente                       │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * Enquanto você dorme, o sistema roda simulações mentais e aprende
 * qual é a melhor forma de programar, usando o próprio avaliador como professor.
 */

import { unifiedQualitySystem, type UnifiedQualityReport } from './UnifiedQualitySystem';
import { getSupremeEvolver, type ExecutionFeedback, type CodeMetrics } from './SupremeManifestEvolver';
import { getSoulArchitect, type ForgedSoul } from './SoulArchitect';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface QualityFeedbackResult {
  qualityReport: UnifiedQualityReport;
  feedbackSent: boolean;
  evolutionTriggered: boolean;
  soulId: string;
  summary: string;
}

export interface AutoEvaluationConfig {
  minScoreForSuccess: number; // Score mínimo para considerar sucesso (padrão: 85)
  autoTriggerEvolution: boolean; // Disparar evolução automaticamente
  logDetails: boolean; // Logar detalhes
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL: QUALITY FEEDBACK BRIDGE
// ═══════════════════════════════════════════════════════════════════════════════

export class QualityFeedbackBridge {
  private config: AutoEvaluationConfig;
  private evaluationCount = 0;
  private successCount = 0;
  private totalScore = 0;

  constructor(config: Partial<AutoEvaluationConfig> = {}) {
    this.config = {
      minScoreForSuccess: config.minScoreForSuccess || 85,
      autoTriggerEvolution: config.autoTriggerEvolution !== false,
      logDetails: config.logDetails !== false
    };
  }

  /**
   * 🔗 CONEXÃO MAESTRAL: Avalia código e alimenta o Evolver
   * 
   * Este é o método principal que fecha o ciclo RLAIF
   */
  evaluateAndFeedback(
    generatedCode: string,
    soul: ForgedSoul,
    executionTimeMs: number
  ): QualityFeedbackResult {
    this.evaluationCount++;

    if (this.config.logDetails) {
      console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🔗 QUALITY FEEDBACK BRIDGE - AVALIAÇÃO #${String(this.evaluationCount).padEnd(4)}                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
      `);
      console.log(`🔮 Alma: ${soul.name}`);
      console.log(`🧬 DNA: ${soul.manifestosDNA.map(d => d.manifestoId).join(', ')}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 1: AVALIAÇÃO COM UNIFIED QUALITY SYSTEM (7 CAMADAS)
    // ═══════════════════════════════════════════════════════════════════════════

    if (this.config.logDetails) {
      console.log('\n🕵️ Fase 1: Avaliação de 7 camadas...');
    }

    const qualityReport = unifiedQualitySystem.evaluate(generatedCode);

    if (this.config.logDetails) {
      console.log(`   📊 Score: ${qualityReport.overallScore}/100`);
      console.log(`   ✅ Passou: ${qualityReport.passed ? 'SIM' : 'NÃO'}`);
      console.log(`   📈 Métricas:`);
      console.log(`      - Acessibilidade: ${qualityReport.metrics.accessibility}/100`);
      console.log(`      - Performance: ${qualityReport.metrics.performance}/100`);
      console.log(`      - Segurança: ${qualityReport.metrics.security}/100`);
      console.log(`      - Qualidade: ${qualityReport.metrics.codeQuality}/100`);
      console.log(`      - Completude: ${qualityReport.metrics.completeness}/100`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 2: CONVERTER RELATÓRIO PARA FEEDBACK DO EVOLVER
    // ═══════════════════════════════════════════════════════════════════════════

    if (this.config.logDetails) {
      console.log('\n🧬 Fase 2: Convertendo para feedback do Evolver...');
    }

    const success = qualityReport.overallScore >= this.config.minScoreForSuccess;
    const linesOfCode = generatedCode.split('\n').length;

    // Extrair erros críticos do relatório
    const criticalIssues = qualityReport.improvements
      .filter(imp => imp.includes('CRÍTICO') || imp.includes('❌'))
      .slice(0, 10);

    // Converter métricas do QA para o formato do Evolver
    const codeMetrics: CodeMetrics = {
      complexity: this.estimateComplexity(generatedCode),
      maintainability: qualityReport.metrics.codeQuality,
      securityScore: qualityReport.metrics.security,
      performanceScore: qualityReport.metrics.performance
    };

    // Criar feedback estruturado
    const feedback: ExecutionFeedback = {
      soulId: soul.id,
      soul,
      success,
      qualityScore: qualityReport.overallScore,
      executionTimeMs,
      linesOfCode,
      errors: criticalIssues,
      codeMetrics
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 3: ENVIAR FEEDBACK PARA O EVOLVER
    // ═══════════════════════════════════════════════════════════════════════════

    if (this.config.logDetails) {
      console.log('\n🧬 Fase 3: Alimentando o Evolver...');
    }

    const evolver = getSupremeEvolver();
    evolver.recordFeedback(feedback);

    // Atualizar estatísticas locais
    if (success) this.successCount++;
    this.totalScore += qualityReport.overallScore;

    // Verificar se evolução foi disparada
    const evolverStats = evolver.getStats();
    const evolutionTriggered = evolverStats.pendingFeedbacks === 0 && evolverStats.generation > 0;

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 4: GERAR RESUMO
    // ═══════════════════════════════════════════════════════════════════════════

    const summary = this.generateSummary(qualityReport, success, evolutionTriggered);

    if (this.config.logDetails) {
      console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🔗 FEEDBACK BRIDGE COMPLETO 🔗                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Alma: ${soul.name.substring(0, 60).padEnd(66)}║
║  Score: ${String(qualityReport.overallScore + '/100').padEnd(67)}║
║  Sucesso: ${(success ? '✅ SIM' : '❌ NÃO').padEnd(65)}║
║  Evolução: ${(evolutionTriggered ? '🧬 DISPARADA' : '⏳ PENDENTE').padEnd(64)}║
║  Geração: ${String(evolverStats.generation).padEnd(65)}║
╚══════════════════════════════════════════════════════════════════════════════╝
      `);
    }

    return {
      qualityReport,
      feedbackSent: true,
      evolutionTriggered,
      soulId: soul.id,
      summary
    };
  }

  /**
   * 📊 Avalia código sem alma (para casos onde não há SoulArchitect)
   */
  evaluateCodeOnly(generatedCode: string): UnifiedQualityReport {
    return unifiedQualitySystem.evaluate(generatedCode);
  }

  /**
   * 🔄 Força uma evolução manual (útil para testes)
   */
  async forceEvolution(): Promise<void> {
    const evolver = getSupremeEvolver();
    await evolver.triggerEvolution();
  }

  /**
   * 📈 Estima complexidade do código
   */
  private estimateComplexity(code: string): number {
    let complexity = 50; // Base

    // Contar estruturas de controle
    const controlStructures = (code.match(/if|else|for|while|switch|try|catch/g) || []).length;
    complexity += Math.min(30, controlStructures * 2);

    // Contar funções
    const functions = (code.match(/function|=>|async/g) || []).length;
    complexity += Math.min(20, functions);

    return Math.min(100, complexity);
  }

  /**
   * 📝 Gera resumo da avaliação
   */
  private generateSummary(
    report: UnifiedQualityReport,
    success: boolean,
    evolutionTriggered: boolean
  ): string {
    const status = success ? '✅ APROVADO' : '❌ REPROVADO';
    const evolution = evolutionTriggered ? '🧬 Evolução disparada!' : '';
    
    let summary = `${status} - Score: ${report.overallScore}/100`;
    
    if (!success && report.improvements.length > 0) {
      summary += ` | Problemas: ${report.improvements.slice(0, 3).join(', ')}`;
    }
    
    if (evolution) {
      summary += ` | ${evolution}`;
    }
    
    return summary;
  }

  /**
   * 📊 Retorna estatísticas do bridge
   */
  getStats(): {
    evaluations: number;
    successRate: number;
    avgScore: number;
    evolverGeneration: number;
  } {
    const evolver = getSupremeEvolver();
    
    return {
      evaluations: this.evaluationCount,
      successRate: this.evaluationCount > 0 ? this.successCount / this.evaluationCount : 0,
      avgScore: this.evaluationCount > 0 ? this.totalScore / this.evaluationCount : 0,
      evolverGeneration: evolver.getStats().generation
    };
  }

  /**
   * 📊 Gera relatório completo do ciclo RLAIF
   */
  generateRLAIFReport(): string {
    const stats = this.getStats();
    const evolver = getSupremeEvolver();
    const evolverStats = evolver.getStats();
    const architect = getSoulArchitect();
    const architectStats = architect.getStats();

    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🔗 RELATÓRIO RLAIF - REINFORCEMENT LEARNING FROM AI FEEDBACK 🔗     ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         QUALITY FEEDBACK BRIDGE                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Avaliações Realizadas: ${String(stats.evaluations).padEnd(50)}║
║  Taxa de Sucesso: ${String((stats.successRate * 100).toFixed(1) + '%').padEnd(57)}║
║  Score Médio: ${String(stats.avgScore.toFixed(1) + '/100').padEnd(61)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         SUPREME MANIFEST EVOLVER                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Geração Atual: ${String(evolverStats.generation).padEnd(59)}║
║  Total Feedbacks: ${String(evolverStats.totalFeedbacks).padEnd(57)}║
║  Genomas Rastreados: ${String(evolverStats.genomesTracked).padEnd(54)}║
║  Princípios Emergentes: ${String(evolverStats.emergentPrinciples).padEnd(51)}║
║  Top Manifesto: ${evolverStats.topManifesto.padEnd(59)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         SOUL ARCHITECT                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Almas Forjadas: ${String(architectStats.totalSoulsForged).padEnd(58)}║
║  Almas Ativas: ${String(architectStats.activeSouls).padEnd(60)}║
╚══════════════════════════════════════════════════════════════════════════════╝

🔄 CICLO RLAIF ATIVO:
   Forja → Geração → Avaliação (7 camadas) → Feedback → Evolução → Forja Melhor

💡 O sistema está aprendendo automaticamente qual é a melhor forma de programar!
    `;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON E EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let bridgeInstance: QualityFeedbackBridge | null = null;

export function getQualityFeedbackBridge(config?: Partial<AutoEvaluationConfig>): QualityFeedbackBridge {
  if (!bridgeInstance || config) {
    bridgeInstance = new QualityFeedbackBridge(config);
  }
  return bridgeInstance;
}

/**
 * 🔗 Função helper para avaliar e enviar feedback em uma chamada
 */
export function evaluateAndFeedback(
  generatedCode: string,
  soul: ForgedSoul,
  executionTimeMs: number
): QualityFeedbackResult {
  const bridge = getQualityFeedbackBridge();
  return bridge.evaluateAndFeedback(generatedCode, soul, executionTimeMs);
}

export default QualityFeedbackBridge;
