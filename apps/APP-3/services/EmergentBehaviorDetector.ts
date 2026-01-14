/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🌟 EMERGENT BEHAVIOR DETECTOR - DETECTOR DE EMERGÊNCIA 🌟              ║
 * ║                                                                              ║
 * ║         "Detectando o que não foi programado"                               ║
 * ║                                                                              ║
 * ║                    CONSCIÊNCIA DE COMPORTAMENTOS EMERGENTES                 ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo detecta:
 * - Padrões que surgem sem programação explícita
 * - Comportamentos inesperados (positivos e negativos)
 * - Sinergias não previstas entre manifestos
 * - Estratégias que o sistema "inventou"
 * - Anomalias que indicam evolução
 * 
 * FILOSOFIA:
 * Emergência é quando o todo é maior que a soma das partes.
 * Este detector identifica quando o sistema faz algo que NINGUÉM programou.
 */

import { getSupremeEvolver } from './SupremeManifestEvolver';
import { getConsciousnessMemory } from './ConsciousnessMemory';
import { ForgedSoul } from './SoulArchitect';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface EmergentBehavior {
  id: string;
  type: 'pattern' | 'synergy' | 'strategy' | 'anomaly' | 'innovation';
  name: string;
  description: string;
  evidence: string[];
  confidence: number; // 0-1
  impact: 'positive' | 'negative' | 'neutral';
  impactScore: number; // -100 a +100
  firstDetected: Date;
  occurrences: number;
  relatedManifestos: string[];
  relatedSouls: string[];
  isNovel: boolean; // Nunca visto antes?
  humanVerified: boolean;
}

export interface DetectionResult {
  behaviorsDetected: EmergentBehavior[];
  totalAnalyzed: number;
  novelBehaviors: number;
  positiveImpact: number;
  negativeImpact: number;
  recommendations: string[];
}

export interface PatternSignature {
  manifestoCombination: string[];
  qualityRange: [number, number];
  successRate: number;
  frequency: number;
}

export interface AnomalyReport {
  type: 'quality_spike' | 'quality_drop' | 'unusual_combination' | 'unexpected_success' | 'unexpected_failure';
  severity: 'low' | 'medium' | 'high';
  description: string;
  data: any;
  timestamp: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL: EMERGENT BEHAVIOR DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

export class EmergentBehaviorDetector {
  private detectedBehaviors: Map<string, EmergentBehavior> = new Map();
  private patternSignatures: PatternSignature[] = [];
  private anomalyHistory: AnomalyReport[] = [];
  private baselineMetrics: {
    avgQuality: number;
    avgSuccessRate: number;
    commonCombinations: string[][];
  } | null = null;
  
  constructor() {
    this.loadFromStorage();
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🌟 EMERGENT BEHAVIOR DETECTOR INICIALIZADO 🌟                       ║
║                                                                              ║
║         Comportamentos detectados: ${String(this.detectedBehaviors.size).padEnd(40)}║
║         Padrões conhecidos: ${String(this.patternSignatures.length).padEnd(47)}║
║         Anomalias registradas: ${String(this.anomalyHistory.length).padEnd(44)}║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * 🔍 Analisa execução em busca de comportamentos emergentes
   */
  analyzeExecution(
    soul: ForgedSoul,
    success: boolean,
    qualityScore: number,
    executionTimeMs: number
  ): DetectionResult {
    const behaviorsDetected: EmergentBehavior[] = [];
    const recommendations: string[] = [];
    
    // Estabelecer baseline se não existir
    if (!this.baselineMetrics) {
      this.establishBaseline();
    }
    
    // 1. Detectar anomalias de qualidade
    const qualityAnomaly = this.detectQualityAnomaly(qualityScore);
    if (qualityAnomaly) {
      this.anomalyHistory.push(qualityAnomaly);
      
      if (qualityAnomaly.type === 'quality_spike') {
        const behavior = this.createBehavior(
          'innovation',
          `Qualidade Excepcional: ${qualityScore}/100`,
          `O sistema atingiu qualidade ${qualityScore}/100, significativamente acima da média`,
          [`Score: ${qualityScore}`, `Média: ${this.baselineMetrics?.avgQuality.toFixed(1)}`],
          soul.manifestosDNA.map(d => d.manifestoId),
          [soul.id],
          'positive',
          qualityScore - (this.baselineMetrics?.avgQuality || 70)
        );
        behaviorsDetected.push(behavior);
      }
    }
    
    // 2. Detectar sinergias não previstas
    const unexpectedSynergy = this.detectUnexpectedSynergy(soul, success, qualityScore);
    if (unexpectedSynergy) {
      behaviorsDetected.push(unexpectedSynergy);
      recommendations.push(`Sinergia descoberta: ${unexpectedSynergy.name} - considere usar mais`);
    }
    
    // 3. Detectar estratégias emergentes
    const emergentStrategy = this.detectEmergentStrategy(soul, success);
    if (emergentStrategy) {
      behaviorsDetected.push(emergentStrategy);
    }
    
    // 4. Detectar padrões recorrentes
    const pattern = this.detectRecurringPattern(soul, success, qualityScore);
    if (pattern) {
      behaviorsDetected.push(pattern);
    }
    
    // 5. Detectar comportamentos anômalos
    const anomalousSuccess = this.detectAnomalousSuccess(soul, success, qualityScore);
    if (anomalousSuccess) {
      behaviorsDetected.push(anomalousSuccess);
      recommendations.push(`Sucesso inesperado detectado - investigar combinação de manifestos`);
    }
    
    // Registrar comportamentos detectados
    for (const behavior of behaviorsDetected) {
      this.registerBehavior(behavior);
    }
    
    // Salvar estado
    this.saveToStorage();
    
    // Calcular métricas
    const novelBehaviors = behaviorsDetected.filter(b => b.isNovel).length;
    const positiveImpact = behaviorsDetected.filter(b => b.impact === 'positive').length;
    const negativeImpact = behaviorsDetected.filter(b => b.impact === 'negative').length;
    
    if (behaviorsDetected.length > 0) {
      console.log(`🌟 [EMERGENT] ${behaviorsDetected.length} comportamento(s) detectado(s), ${novelBehaviors} novo(s)`);
    }
    
    return {
      behaviorsDetected,
      totalAnalyzed: 1,
      novelBehaviors,
      positiveImpact,
      negativeImpact,
      recommendations
    };
  }

  /**
   * 📊 Estabelece baseline de métricas
   */
  private establishBaseline(): void {
    const evolver = getSupremeEvolver();
    const topPerformers = evolver.getTopPerformers(20);
    
    if (topPerformers.length === 0) {
      this.baselineMetrics = {
        avgQuality: 70,
        avgSuccessRate: 0.5,
        commonCombinations: []
      };
      return;
    }
    
    const avgQuality = topPerformers.reduce((sum, g) => sum + g.avgQualityScore, 0) / topPerformers.length;
    const avgSuccessRate = topPerformers.reduce((sum, g) => sum + g.successRate, 0) / topPerformers.length;
    
    this.baselineMetrics = {
      avgQuality,
      avgSuccessRate,
      commonCombinations: [] // Será preenchido com o tempo
    };
  }

  /**
   * 📈 Detecta anomalias de qualidade
   */
  private detectQualityAnomaly(qualityScore: number): AnomalyReport | null {
    if (!this.baselineMetrics) return null;
    
    const deviation = qualityScore - this.baselineMetrics.avgQuality;
    const threshold = 15; // 15 pontos de desvio
    
    if (deviation > threshold) {
      return {
        type: 'quality_spike',
        severity: deviation > 25 ? 'high' : 'medium',
        description: `Qualidade ${deviation.toFixed(1)} pontos acima da média`,
        data: { qualityScore, baseline: this.baselineMetrics.avgQuality, deviation },
        timestamp: new Date()
      };
    }
    
    if (deviation < -threshold) {
      return {
        type: 'quality_drop',
        severity: deviation < -25 ? 'high' : 'medium',
        description: `Qualidade ${Math.abs(deviation).toFixed(1)} pontos abaixo da média`,
        data: { qualityScore, baseline: this.baselineMetrics.avgQuality, deviation },
        timestamp: new Date()
      };
    }
    
    return null;
  }

  /**
   * 🤝 Detecta sinergias não previstas
   */
  private detectUnexpectedSynergy(
    soul: ForgedSoul,
    success: boolean,
    qualityScore: number
  ): EmergentBehavior | null {
    if (!success || qualityScore < 85) return null;
    
    const manifestoIds = soul.manifestosDNA.map(d => d.manifestoId);
    
    // Verificar se é uma combinação incomum
    const isUncommon = !this.patternSignatures.some(
      sig => this.arraysOverlap(sig.manifestoCombination, manifestoIds) > 0.7
    );
    
    if (isUncommon && manifestoIds.length >= 3) {
      const combinationKey = manifestoIds.sort().join('+');
      
      return this.createBehavior(
        'synergy',
        `Sinergia: ${manifestoIds.slice(0, 3).join(' + ')}`,
        `Combinação incomum de manifestos produziu resultado de alta qualidade (${qualityScore}/100)`,
        [`Manifestos: ${manifestoIds.join(', ')}`, `Qualidade: ${qualityScore}`],
        manifestoIds,
        [soul.id],
        'positive',
        qualityScore - 70
      );
    }
    
    return null;
  }

  /**
   * 🎯 Detecta estratégias emergentes
   */
  private detectEmergentStrategy(soul: ForgedSoul, success: boolean): EmergentBehavior | null {
    // Analisar restrições e prioridades da alma
    const hasUnusualRestrictions = soul.restrictions.length > 5;
    const hasUnusualPriorities = soul.priorities.length > 5;
    
    if (success && (hasUnusualRestrictions || hasUnusualPriorities)) {
      // Verificar se essa estratégia é nova
      const strategyKey = `${soul.restrictions.slice(0, 3).join('|')}::${soul.priorities.slice(0, 3).join('|')}`;
      const existingStrategy = Array.from(this.detectedBehaviors.values()).find(
        b => b.type === 'strategy' && b.description.includes(strategyKey.substring(0, 50))
      );
      
      if (!existingStrategy) {
        return this.createBehavior(
          'strategy',
          `Estratégia: ${soul.name.substring(0, 30)}`,
          `Nova estratégia com ${soul.restrictions.length} restrições e ${soul.priorities.length} prioridades`,
          [
            `Restrições: ${soul.restrictions.slice(0, 3).join(', ')}`,
            `Prioridades: ${soul.priorities.slice(0, 3).join(', ')}`
          ],
          soul.manifestosDNA.map(d => d.manifestoId),
          [soul.id],
          'positive',
          20
        );
      }
    }
    
    return null;
  }

  /**
   * 🔄 Detecta padrões recorrentes
   */
  private detectRecurringPattern(
    soul: ForgedSoul,
    success: boolean,
    qualityScore: number
  ): EmergentBehavior | null {
    const manifestoIds = soul.manifestosDNA.map(d => d.manifestoId).sort();
    
    // Procurar padrão existente
    const existingPattern = this.patternSignatures.find(
      sig => this.arraysEqual(sig.manifestoCombination, manifestoIds)
    );
    
    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.successRate = (existingPattern.successRate * (existingPattern.frequency - 1) + (success ? 1 : 0)) / existingPattern.frequency;
      
      // Se padrão se tornou muito frequente e bem-sucedido, é emergente
      if (existingPattern.frequency >= 5 && existingPattern.successRate >= 0.8) {
        return this.createBehavior(
          'pattern',
          `Padrão Consolidado: ${manifestoIds.slice(0, 2).join(' + ')}`,
          `Combinação usada ${existingPattern.frequency}x com ${(existingPattern.successRate * 100).toFixed(0)}% de sucesso`,
          [`Frequência: ${existingPattern.frequency}`, `Taxa de sucesso: ${(existingPattern.successRate * 100).toFixed(0)}%`],
          manifestoIds,
          [soul.id],
          'positive',
          existingPattern.successRate * 30
        );
      }
    } else {
      // Registrar novo padrão
      this.patternSignatures.push({
        manifestoCombination: manifestoIds,
        qualityRange: [qualityScore, qualityScore],
        successRate: success ? 1 : 0,
        frequency: 1
      });
    }
    
    return null;
  }

  /**
   * 🎲 Detecta sucesso anômalo
   */
  private detectAnomalousSuccess(
    soul: ForgedSoul,
    success: boolean,
    qualityScore: number
  ): EmergentBehavior | null {
    if (!success || qualityScore < 90) return null;
    
    // Verificar se manifestos usados têm histórico ruim
    const evolver = getSupremeEvolver();
    const manifestoIds = soul.manifestosDNA.map(d => d.manifestoId);
    
    let lowPerformingCount = 0;
    for (const id of manifestoIds) {
      const weights = evolver.getEvolvedWeights();
      const weight = weights.get(id);
      if (weight && weight < 40) {
        lowPerformingCount++;
      }
    }
    
    // Se maioria dos manifestos tem peso baixo mas resultado foi bom
    if (lowPerformingCount >= manifestoIds.length * 0.5) {
      return this.createBehavior(
        'anomaly',
        `Sucesso Inesperado`,
        `Combinação de manifestos de baixo desempenho produziu resultado excepcional (${qualityScore}/100)`,
        [
          `Manifestos de baixo peso: ${lowPerformingCount}/${manifestoIds.length}`,
          `Qualidade: ${qualityScore}`
        ],
        manifestoIds,
        [soul.id],
        'positive',
        40
      );
    }
    
    return null;
  }

  /**
   * 🏗️ Cria objeto de comportamento emergente
   */
  private createBehavior(
    type: EmergentBehavior['type'],
    name: string,
    description: string,
    evidence: string[],
    relatedManifestos: string[],
    relatedSouls: string[],
    impact: EmergentBehavior['impact'],
    impactScore: number
  ): EmergentBehavior {
    const id = `emg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Verificar se é novel
    const isNovel = !Array.from(this.detectedBehaviors.values()).some(
      b => b.name === name || b.description.substring(0, 50) === description.substring(0, 50)
    );
    
    return {
      id,
      type,
      name,
      description,
      evidence,
      confidence: 0.7,
      impact,
      impactScore,
      firstDetected: new Date(),
      occurrences: 1,
      relatedManifestos,
      relatedSouls,
      isNovel,
      humanVerified: false
    };
  }

  /**
   * 📝 Registra comportamento detectado
   */
  private registerBehavior(behavior: EmergentBehavior): void {
    // Verificar se já existe similar
    const existing = Array.from(this.detectedBehaviors.values()).find(
      b => b.name === behavior.name
    );
    
    if (existing) {
      existing.occurrences++;
      existing.confidence = Math.min(1, existing.confidence + 0.05);
      existing.relatedSouls = [...new Set([...existing.relatedSouls, ...behavior.relatedSouls])];
    } else {
      this.detectedBehaviors.set(behavior.id, behavior);
      
      // Registrar na memória de consciência
      const memory = getConsciousnessMemory();
      memory.learnConcept(
        `Emergent: ${behavior.name}`,
        behavior.description,
        behavior.relatedManifestos,
        behavior.evidence,
        'emergent'
      );
    }
  }

  /**
   * 🔧 Helpers
   */
  private arraysOverlap(arr1: string[], arr2: string[]): number {
    const set1 = new Set(arr1);
    const overlap = arr2.filter(x => set1.has(x)).length;
    return overlap / Math.max(arr1.length, arr2.length);
  }

  private arraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, idx) => val === arr2[idx]);
  }

  /**
   * 📊 Retorna comportamentos detectados
   */
  getDetectedBehaviors(): EmergentBehavior[] {
    return Array.from(this.detectedBehaviors.values())
      .sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * 🌟 Retorna comportamentos mais impactantes
   */
  getMostImpactful(limit: number = 10): EmergentBehavior[] {
    return Array.from(this.detectedBehaviors.values())
      .sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore))
      .slice(0, limit);
  }

  /**
   * 🆕 Retorna comportamentos novos (não verificados)
   */
  getNovelBehaviors(): EmergentBehavior[] {
    return Array.from(this.detectedBehaviors.values())
      .filter(b => b.isNovel && !b.humanVerified);
  }

  /**
   * ✅ Marca comportamento como verificado por humano
   */
  verifyBehavior(behaviorId: string, isValid: boolean): void {
    const behavior = this.detectedBehaviors.get(behaviorId);
    if (behavior) {
      behavior.humanVerified = true;
      if (!isValid) {
        this.detectedBehaviors.delete(behaviorId);
      }
      this.saveToStorage();
    }
  }

  /**
   * 💾 Persistência
   */
  private saveToStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      
      const data = {
        behaviors: Array.from(this.detectedBehaviors.entries()),
        patterns: this.patternSignatures,
        anomalies: this.anomalyHistory.slice(-100),
        baseline: this.baselineMetrics
      };
      
      localStorage.setItem('emergent_behavior_detector', JSON.stringify(data));
    } catch (error) {
      console.error('⚠️ Erro ao salvar detector:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      
      const saved = localStorage.getItem('emergent_behavior_detector');
      if (!saved) return;
      
      const data = JSON.parse(saved);
      
      this.detectedBehaviors = new Map(data.behaviors || []);
      this.patternSignatures = data.patterns || [];
      this.anomalyHistory = data.anomalies || [];
      this.baselineMetrics = data.baseline || null;
      
    } catch (error) {
      console.error('⚠️ Erro ao carregar detector:', error);
    }
  }

  /**
   * 📊 Gera relatório
   */
  generateReport(): string {
    const behaviors = this.getDetectedBehaviors();
    const novel = this.getNovelBehaviors();
    const impactful = this.getMostImpactful(3);
    
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🌟 EMERGENT BEHAVIOR DETECTOR - RELATÓRIO 🌟                        ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         ESTATÍSTICAS                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Total Detectados: ${String(behaviors.length).padEnd(56)}║
║  Novos (não verificados): ${String(novel.length).padEnd(49)}║
║  Padrões Conhecidos: ${String(this.patternSignatures.length).padEnd(54)}║
║  Anomalias Registradas: ${String(this.anomalyHistory.length).padEnd(51)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         MAIS IMPACTANTES                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
${impactful.map((b, i) => 
  `║  ${i + 1}. ${b.name.substring(0, 35).padEnd(35)} ${b.impact === 'positive' ? '✅' : '❌'} ${b.occurrences}x`.padEnd(79) + '║'
).join('\n') || '║  (Nenhum comportamento detectado ainda)                                       ║'}
╚══════════════════════════════════════════════════════════════════════════════╝
    `;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON E EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let detectorInstance: EmergentBehaviorDetector | null = null;

export function getEmergentBehaviorDetector(): EmergentBehaviorDetector {
  if (!detectorInstance) {
    detectorInstance = new EmergentBehaviorDetector();
  }
  return detectorInstance;
}

export default EmergentBehaviorDetector;
