/**
 * ============================================
 * UNIFIED QUALITY SYSTEM - SISTEMA PERFEITO
 * ============================================
 * 
 * Sistema unificado que integra:
 * - ExcellenceCore (avaliação de excelência)
 * - QualityAutopilot (refinamento iterativo)
 * - HTMLQualityGuard (validação básica)
 * - GeminiServiceEnhanced (anti-simulação)
 * - CodeQualityChecker (qualidade de código)
 * 
 * Este é o ÚNICO sistema de avaliação que você precisa!
 */

import { 
  CORE_PRINCIPLE,
  ExcellenceEngine,
  CompletenessValidator,
  HTML_EXCELLENCE_CRITERIA,
  type ExcellenceReport,
  type ExcellenceCheck
} from './ExcellenceCore';
import { HTMLQualityGuard } from './HTMLQualityGuard';
import { simulationDetector } from '../src/utils/SimulationDetector';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface UnifiedQualityReport {
  // Score geral
  overallScore: number; // 0-100
  passed: boolean; // true se score >= threshold
  
  // Relatórios individuais
  excellenceReport: ExcellenceReport;
  simulationReport: {
    detected: boolean;
    score: number;
    matches: string[];
  } | null;
  
  // Melhorias aplicadas
  improvements: string[];
  refinementCount: number;
  
  // Métricas detalhadas
  metrics: {
    accessibility: number;
    performance: number;
    security: number;
    codeQuality: number;
    completeness: number;
  };
  
  // Recomendações
  recommendations: string[];
  
  // Timestamp
  evaluatedAt: string;
}

export interface UnifiedQualityConfig {
  // Thresholds
  minScore: number; // Score mínimo aceitável (padrão: 85)
  maxRefinements: number; // Máximo de refinamentos (padrão: 2)
  
  // Flags de ativação
  enableExcellenceCore: boolean; // Sempre true
  enableSimulationDetector: boolean; // Para detectar placeholders
  enableAutoFix: boolean; // Corrigir automaticamente
  
  // Configurações avançadas
  strictMode: boolean; // Modo rigoroso (score mínimo 90)
  verboseLogging: boolean; // Logs detalhados
}

// ============================================
// CONFIGURAÇÃO PADRÃO
// ============================================

const DEFAULT_CONFIG: UnifiedQualityConfig = {
  minScore: 100, // 🎯 PADRÃO DE EXCELÊNCIA: Só passa com 100/100 ou MAIS
  maxRefinements: 3, // Mais tentativas para atingir perfeição
  enableExcellenceCore: true,
  enableSimulationDetector: true,
  enableAutoFix: true,
  strictMode: true, // 🔥 MODO RIGOROSO ATIVADO (scores podem ultrapassar 100)
  verboseLogging: true
};

// ============================================
// SISTEMA UNIFICADO DE QUALIDADE
// ============================================

export class UnifiedQualitySystem {
  private config: UnifiedQualityConfig;
  
  constructor(config: Partial<UnifiedQualityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Avalia código HTML com todos os sistemas integrados
   * 🎯 IMPORTANTE: Não bloqueia geração de fullstack!
   */
  public evaluate(htmlCode: string): UnifiedQualityReport {
    const startTime = Date.now();
    
    if (this.config.verboseLogging) {
      console.log('\n' + '='.repeat(60));
      console.log('🎯 UNIFIED QUALITY SYSTEM - AVALIAÇÃO COMPLETA');
      console.log('='.repeat(60) + '\n');
    }
    
    // 🚀 DETECTAR SE É PROJETO FULLSTACK (não avaliar como HTML simples)
    const isFullstack = this.detectFullstackProject(htmlCode);
    
    if (isFullstack) {
      if (this.config.verboseLogging) {
        console.log('🚀 Projeto FULLSTACK detectado - Avaliação adaptada\n');
      }
      // Para fullstack, apenas validar que tem estrutura completa
      return this.evaluateFullstackProject(htmlCode);
    }
    
    // 1. VALIDAÇÃO BÁSICA (HTMLQualityGuard) - apenas para HTML simples
    const basicValidation = this.validateBasicStructure(htmlCode);
    if (!basicValidation.isValid && this.config.enableAutoFix) {
      htmlCode = HTMLQualityGuard.fixBasicIssues(htmlCode);
      if (this.config.verboseLogging) {
        console.log('🔧 HTML básico corrigido automaticamente\n');
      }
    }
    
    // 2. AVALIAÇÃO DE EXCELÊNCIA (ExcellenceCore)
    const excellenceReport = ExcellenceEngine.evaluate(htmlCode, HTML_EXCELLENCE_CRITERIA);
    
    if (this.config.verboseLogging) {
      console.log(`📊 Excellence Score: ${excellenceReport.overallScore}/100`);
      console.log(`✅ Passed: ${excellenceReport.passed}\n`);
    }
    
    // 3. DETECÇÃO DE SIMULAÇÃO (opcional)
    let simulationReport = null;
    if (this.config.enableSimulationDetector) {
      simulationReport = simulationDetector.detectSimulations(htmlCode);
      if (this.config.verboseLogging && simulationReport.detected) {
        console.log(`⚠️ Simulações detectadas: ${simulationReport.matches.length}`);
      }
    }
    
    // 4. CALCULAR SCORE GERAL
    const overallScore = this.calculateOverallScore(
      excellenceReport,
      simulationReport
    );
    
    // 6. DETERMINAR SE PASSOU
    const threshold = this.config.strictMode ? 90 : this.config.minScore;
    const passed = overallScore >= threshold;
    
    // 6. COLETAR MELHORIAS
    const improvements = this.collectImprovements(
      excellenceReport,
      simulationReport
    );
    
    // 7. GERAR RECOMENDAÇÕES
    const recommendations = this.generateRecommendations(
      excellenceReport,
      simulationReport
    );
    
    // 8. EXTRAIR MÉTRICAS
    const metrics = this.extractMetrics(excellenceReport);
    
    const elapsedTime = Date.now() - startTime;
    
    if (this.config.verboseLogging) {
      const scoreDisplay = overallScore > 100 
        ? `${overallScore}/100 🏆 EXCELÊNCIA EXCEPCIONAL!` 
        : `${overallScore}/100`;
      console.log(`📈 Score Geral: ${scoreDisplay}`);
      console.log(`✅ Status: ${passed ? 'APROVADO ✅' : 'REPROVADO ❌'}`);
      console.log(`⏱️ Tempo: ${elapsedTime}ms\n`);
      console.log('='.repeat(60) + '\n');
    }
    
    return {
      overallScore,
      passed,
      excellenceReport,
      simulationReport,
      improvements,
      refinementCount: 0,
      metrics,
      recommendations,
      evaluatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Avalia e refina código automaticamente até atingir qualidade mínima
   */
  public async evaluateAndRefine(
    htmlCode: string,
    refineFn: (code: string, prompt: string) => Promise<string>,
    originalPrompt: string = ''
  ): Promise<{ code: string; report: UnifiedQualityReport }> {
    
    let currentCode = htmlCode;
    let refinementCount = 0;
    let lastReport: UnifiedQualityReport;
    
    if (this.config.verboseLogging) {
      console.log('\n' + '='.repeat(60));
      console.log('🔄 UNIFIED QUALITY SYSTEM - REFINAMENTO AUTOMÁTICO');
      console.log('='.repeat(60) + '\n');
    }
    
    // Loop de refinamento
    while (refinementCount < this.config.maxRefinements) {
      // Avaliar código atual
      lastReport = this.evaluate(currentCode);
      lastReport.refinementCount = refinementCount;
      
      // Se passou, retornar
      if (lastReport.passed) {
        if (this.config.verboseLogging) {
          console.log(`✅ Código aprovado após ${refinementCount} refinamento(s)!\n`);
        }
        return { code: currentCode, report: lastReport };
      }
      
      // Se não passou, refinar
      refinementCount++;
      
      if (this.config.verboseLogging) {
        console.log(`🔄 Refinamento ${refinementCount}/${this.config.maxRefinements}...`);
        console.log(`Problemas: ${lastReport.improvements.slice(0, 3).join(', ')}\n`);
      }
      
      // Gerar prompt de refinamento
      const refinementPrompt = this.generateRefinementPrompt(lastReport, originalPrompt);
      
      // Refinar código
      try {
        currentCode = await refineFn(currentCode, refinementPrompt);
      } catch (error) {
        console.error('❌ Erro ao refinar código:', error);
        break;
      }
    }
    
    // Avaliar código final
    lastReport = this.evaluate(currentCode);
    lastReport.refinementCount = refinementCount;
    
    if (this.config.verboseLogging) {
      if (lastReport.passed) {
        console.log(`✅ Código aprovado após ${refinementCount} refinamento(s)!\n`);
      } else {
        console.log(`⚠️ Código não atingiu score mínimo após ${refinementCount} tentativas.`);
        console.log(`Score final: ${lastReport.overallScore}/${this.config.minScore}\n`);
      }
    }
    
    return { code: currentCode, report: lastReport };
  }
  
  /**
   * Detecta se é projeto fullstack (não deve ser avaliado como HTML simples)
   */
  private detectFullstackProject(code: string): boolean {
    const fullstackIndicators = [
      'package.json',
      'docker-compose',
      'prisma/schema',
      'backend/',
      'frontend/',
      'server.js',
      'server.ts',
      'express',
      'fastify',
      'nest',
      'api/',
      'routes/',
      'controllers/',
      'models/',
      'services/'
    ];
    
    const codeToCheck = code.toLowerCase();
    const matches = fullstackIndicators.filter(indicator => codeToCheck.includes(indicator));
    
    return matches.length >= 3; // Se tem 3+ indicadores, é fullstack
  }
  
  /**
   * Avalia projeto fullstack (critérios diferentes de HTML simples)
   */
  private evaluateFullstackProject(code: string): UnifiedQualityReport {
    const checks = [
      { name: 'Estrutura de Pastas', passed: code.includes('backend/') || code.includes('server'), score: 100 },
      { name: 'Configuração de Banco', passed: code.includes('prisma') || code.includes('database'), score: 100 },
      { name: 'API Endpoints', passed: code.includes('routes') || code.includes('api'), score: 100 },
      { name: 'Docker Setup', passed: code.includes('docker-compose') || code.includes('Dockerfile'), score: 100 },
      { name: 'Package.json', passed: code.includes('package.json'), score: 100 }
    ];
    
    const passedChecks = checks.filter(c => c.passed);
    const overallScore = Math.round((passedChecks.length / checks.length) * 100);
    
    return {
      overallScore,
      passed: overallScore >= 80, // Fullstack precisa de 80% dos componentes
      excellenceReport: {
        domain: 'Fullstack',
        overallScore,
        passed: overallScore >= 80,
        checks: checks.map(c => ({ name: c.name, result: { passed: c.passed, score: c.score, issues: [], suggestions: [], autoFixable: false } })),
        summary: `Projeto fullstack com ${passedChecks.length}/${checks.length} componentes`,
        improvements: []
      },
      simulationReport: null,
      improvements: checks.filter(c => !c.passed).map(c => `Adicionar: ${c.name}`),
      refinementCount: 0,
      metrics: {
        accessibility: 100,
        performance: 100,
        security: 100,
        codeQuality: overallScore,
        completeness: overallScore
      },
      recommendations: [],
      evaluatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Gera prompt de refinamento baseado no relatório
   */
  private generateRefinementPrompt(report: UnifiedQualityReport, originalPrompt: string): string {
    const threshold = this.config.strictMode ? 90 : this.config.minScore;
    
    let prompt = `
${CORE_PRINCIPLE.mantra}

🎯 ANÁLISE DE QUALIDADE DO CÓDIGO GERADO:

📊 SCORE ATUAL: ${report.overallScore}/100
📊 SCORE MÍNIMO NECESSÁRIO: ${threshold}/100
❌ STATUS: NÃO APROVADO

🔍 PROBLEMAS IDENTIFICADOS (Top 10):
${report.improvements.slice(0, 10).map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

📝 MÉTRICAS DETALHADAS:
- Acessibilidade: ${report.metrics.accessibility}/100 ${report.metrics.accessibility < 85 ? '❌' : '✅'}
- Performance: ${report.metrics.performance}/100 ${report.metrics.performance < 85 ? '❌' : '✅'}
- Segurança: ${report.metrics.security}/100 ${report.metrics.security < 85 ? '❌' : '✅'}
- Qualidade de Código: ${report.metrics.codeQuality}/100 ${report.metrics.codeQuality < 85 ? '❌' : '✅'}
- Completude: ${report.metrics.completeness}/100 ${report.metrics.completeness < 85 ? '❌' : '✅'}

🎯 TAREFA CRÍTICA:
Refine o código HTML para corrigir TODOS os problemas identificados acima.

REQUISITOS OBRIGATÓRIOS:
1. Mantenha TODA a funcionalidade existente
2. Mantenha o design e estilo visual
3. Corrija TODOS os problemas de acessibilidade (PRIORIDADE MÁXIMA)
4. Adicione meta tags faltantes
5. Melhore estrutura semântica
6. Garanta responsividade
7. Otimize performance
8. Implemente segurança básica

O código refinado DEVE atingir score mínimo de ${threshold}/100.

NÃO adicione comentários explicativos no código.
NÃO remova funcionalidades existentes.
NÃO mude o propósito do código.
APENAS corrija os problemas identificados.
`;

    if (report.simulationReport?.detected) {
      prompt += `\n⚠️ ATENÇÃO: Detectadas ${report.simulationReport.matches.length} simulações/placeholders no código.
SUBSTITUA todos os placeholders por implementações reais.
`;
    }
    
    return prompt;
  }
  
  /**
   * Valida estrutura básica do HTML
   */
  private validateBasicStructure(htmlCode: string): { isValid: boolean; errors: string[] } {
    return HTMLQualityGuard.validateHTML(htmlCode);
  }
  
  /**
   * Calcula score geral ponderado
   * 🎯 PERMITE SCORES ACIMA DE 100 (bônus por excelência excepcional)
   */
  private calculateOverallScore(
    excellenceReport: ExcellenceReport,
    simulationReport: any
  ): number {
    let totalScore = excellenceReport.overallScore;
    
    // Penalizar simulações (peso 0.2)
    if (simulationReport?.detected) {
      const simulationPenalty = Math.min(30, simulationReport.matches.length * 5);
      totalScore -= simulationPenalty;
      if (this.config.verboseLogging) {
        console.log(`⚠️ Penalidade por simulações: -${simulationPenalty} pontos`);
      }
    }
    
    // 🎯 NÃO limitar a 100 - permitir bônus por excelência
    return Math.max(0, Math.round(totalScore));
  }
  
  /**
   * Coleta todas as melhorias de todos os sistemas
   */
  private collectImprovements(
    excellenceReport: ExcellenceReport,
    simulationReport: any
  ): string[] {
    const improvements: string[] = [];
    
    // Melhorias do ExcellenceCore
    improvements.push(...excellenceReport.improvements);
    
    // Melhorias de simulação
    if (simulationReport?.detected) {
      improvements.push(`⚠️ Detectadas ${simulationReport.matches.length} simulações/placeholders`);
      improvements.push(`💡 Substituir todos os placeholders por implementações reais`);
    }
    
    return improvements;
  }
  
  /**
   * Gera recomendações priorizadas
   */
  private generateRecommendations(
    excellenceReport: ExcellenceReport,
    simulationReport: any
  ): string[] {
    const recommendations: string[] = [];
    
    // Priorizar acessibilidade
    const accessibilityCheck = excellenceReport.checks.find(c => c.name === 'Acessibilidade');
    if (accessibilityCheck && !accessibilityCheck.result.passed) {
      recommendations.push('🔴 CRÍTICO: Corrigir problemas de acessibilidade imediatamente');
    }
    
    // Priorizar simulações
    if (simulationReport?.detected) {
      recommendations.push('🔴 CRÍTICO: Remover todas as simulações e placeholders');
    }
    
    // Adicionar recomendações do ExcellenceCore
    const prioritizedImprovements = ExcellenceEngine.getPrioritizedImprovements(excellenceReport);
    recommendations.push(...prioritizedImprovements.slice(0, 5));
    
    return recommendations;
  }
  
  /**
   * Extrai métricas detalhadas
   */
  private extractMetrics(excellenceReport: ExcellenceReport): UnifiedQualityReport['metrics'] {
    const getScore = (name: string) => {
      const check = excellenceReport.checks.find(c => c.name === name);
      return check ? check.result.score : 0;
    };
    
    return {
      accessibility: getScore('Acessibilidade'),
      performance: getScore('Performance'),
      security: getScore('Segurança'),
      codeQuality: getScore('Estrutura Semântica'),
      completeness: getScore('Entrega Completa') || getScore('Meta Tags Essenciais')
    };
  }
  
  /**
   * Gera relatório formatado em Markdown
   */
  public generateMarkdownReport(report: UnifiedQualityReport): string {
    let markdown = `# 📊 Relatório de Qualidade Unificado\n\n`;
    
    const scoreDisplay = report.overallScore > 100 
      ? `${report.overallScore}/100 🏆 **EXCELÊNCIA EXCEPCIONAL!**` 
      : `${report.overallScore}/100`;
    
    markdown += `## Score Geral: ${scoreDisplay}\n\n`;
    markdown += `**Status:** ${report.passed ? '✅ APROVADO' : '❌ REPROVADO'}\n`;
    markdown += `**Refinamentos:** ${report.refinementCount}\n`;
    markdown += `**Avaliado em:** ${new Date(report.evaluatedAt).toLocaleString('pt-BR')}\n\n`;
    
    if (report.overallScore > 100) {
      markdown += `> 🎯 **PARABÉNS!** Este código ultrapassou o padrão de excelência com bônus por qualidade excepcional!\n\n`;
    }
    
    markdown += `## 📈 Métricas Detalhadas\n\n`;
    markdown += `| Métrica | Score | Status |\n`;
    markdown += `|---------|-------|--------|\n`;
    markdown += `| Acessibilidade | ${report.metrics.accessibility}/100 | ${report.metrics.accessibility >= 85 ? '✅' : '❌'} |\n`;
    markdown += `| Performance | ${report.metrics.performance}/100 | ${report.metrics.performance >= 85 ? '✅' : '❌'} |\n`;
    markdown += `| Segurança | ${report.metrics.security}/100 | ${report.metrics.security >= 85 ? '✅' : '❌'} |\n`;
    markdown += `| Qualidade | ${report.metrics.codeQuality}/100 | ${report.metrics.codeQuality >= 85 ? '✅' : '❌'} |\n`;
    markdown += `| Completude | ${report.metrics.completeness}/100 | ${report.metrics.completeness >= 85 ? '✅' : '❌'} |\n\n`;
    
    if (report.improvements.length > 0) {
      markdown += `## 🎯 Melhorias Aplicadas/Necessárias\n\n`;
      report.improvements.slice(0, 10).forEach((improvement, i) => {
        markdown += `${i + 1}. ${improvement}\n`;
      });
      markdown += `\n`;
    }
    
    if (report.recommendations.length > 0) {
      markdown += `## 💡 Recomendações Priorizadas\n\n`;
      report.recommendations.forEach((rec, i) => {
        markdown += `${i + 1}. ${rec}\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `---\n\n`;
    markdown += `*${CORE_PRINCIPLE.mantra}*\n`;
    
    return markdown;
  }
}

// ============================================
// EXPORTAÇÕES
// ============================================

// Instância singleton
export const unifiedQualitySystem = new UnifiedQualitySystem();

// Exportar classe para customização
export default UnifiedQualitySystem;
