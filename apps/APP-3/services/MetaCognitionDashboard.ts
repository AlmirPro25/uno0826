/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      📊 META-COGNITION DASHBOARD - VISUALIZAÇÃO DA EVOLUÇÃO 📊              ║
 * ║                                                                              ║
 * ║         "Veja o sistema aprendendo em tempo real"                           ║
 * ║                                                                              ║
 * ║                    MONITORAMENTO DA CONSCIÊNCIA AGI-LITE                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo fornece:
 * - Visualização em tempo real da evolução
 * - Gráficos de performance dos manifestos
 * - Timeline de princípios emergentes
 * - Mapa de sinergias entre manifestos
 * - Histórico de gerações
 */

import { getSupremeEvolver } from './SupremeManifestEvolver';
import { getSoulArchitect } from './SoulArchitect';
import { getQualityFeedbackBridge } from './QualityFeedbackBridge';
import { getCognitiveCore } from './CognitiveCore';
import { listAllManifests } from './AlexandriaManifestBridge';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DashboardSnapshot {
  timestamp: Date;
  
  // Métricas Gerais
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  overallIQ: number; // "QI" do sistema (0-200)
  
  // Evolução
  evolution: {
    generation: number;
    totalFeedbacks: number;
    successRate: number;
    avgQualityScore: number;
    lastEvolutionTime: Date;
    nextEvolutionIn: number; // feedbacks restantes
  };
  
  // Manifestos
  manifestos: {
    total: number;
    active: number;
    topPerformers: ManifestoPerformance[];
    worstPerformers: ManifestoPerformance[];
    recentlyEvolved: string[];
  };
  
  // Princípios Emergentes
  emergentPrinciples: {
    total: number;
    recent: EmergentPrincipleSnapshot[];
    byDomain: Record<string, number>;
  };
  
  // Sinergias
  synergies: {
    strongestPairs: SynergyPair[];
    weakestPairs: SynergyPair[];
    discoveredToday: number;
  };
  
  // Almas
  souls: {
    totalForged: number;
    activeNow: number;
    successfulSouls: number;
    failedSouls: number;
  };
  
  // Tendências
  trends: {
    qualityTrend: 'improving' | 'stable' | 'declining';
    evolutionSpeed: 'fast' | 'normal' | 'slow';
    learningRate: number; // 0-1
  };
}

export interface ManifestoPerformance {
  id: string;
  name: string;
  successRate: number;
  avgQuality: number;
  usageCount: number;
  trend: 'up' | 'stable' | 'down';
  evolvedWeight: number;
}

export interface EmergentPrincipleSnapshot {
  id: string;
  principle: string;
  confidence: number;
  domains: string[];
  discoveredAt: Date;
}

export interface SynergyPair {
  manifesto1: string;
  manifesto2: string;
  synergyScore: number;
  observedIn: number;
}

export interface EvolutionTimeline {
  generation: number;
  timestamp: Date;
  changes: {
    manifestoId: string;
    oldWeight: number;
    newWeight: number;
    reason: string;
  }[];
  principlesDiscovered: number;
  feedbacksProcessed: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL: META-COGNITION DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export class MetaCognitionDashboard {
  private snapshots: DashboardSnapshot[] = [];
  private maxSnapshots = 100;
  
  constructor() {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         📊 META-COGNITION DASHBOARD INICIALIZADO 📊                         ║
║                                                                              ║
║         Monitorando a evolução da consciência AGI-Lite                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * 📸 Captura snapshot atual do sistema
   */
  captureSnapshot(): DashboardSnapshot {
    const evolver = getSupremeEvolver();
    const architect = getSoulArchitect();
    const bridge = getQualityFeedbackBridge();
    const core = getCognitiveCore();
    
    const evolverStats = evolver.getStats();
    const architectStats = architect.getStats();
    const bridgeStats = bridge.getStats();
    const coreStats = core.getStats();
    const allManifests = listAllManifests();
    const topPerformers = evolver.getTopPerformers(5);
    
    // Calcular "QI" do sistema
    const systemIQ = this.calculateSystemIQ(evolverStats, bridgeStats, coreStats);
    
    // Determinar saúde do sistema
    const systemHealth = this.determineSystemHealth(systemIQ, bridgeStats.successRate);
    
    // Obter princípios emergentes
    const principles = evolver.getEmergentPrinciplesForDomain('');
    
    const snapshot: DashboardSnapshot = {
      timestamp: new Date(),
      systemHealth,
      overallIQ: systemIQ,
      
      evolution: {
        generation: evolverStats.generation,
        totalFeedbacks: evolverStats.totalFeedbacks,
        successRate: bridgeStats.successRate,
        avgQualityScore: bridgeStats.avgScore,
        lastEvolutionTime: evolverStats.lastEvolution,
        nextEvolutionIn: Math.max(0, 10 - evolverStats.pendingFeedbacks)
      },
      
      manifestos: {
        total: allManifests.length,
        active: evolverStats.genomesTracked,
        topPerformers: topPerformers.map(g => ({
          id: g.manifestoId,
          name: g.manifestoId,
          successRate: g.successRate,
          avgQuality: g.avgQualityScore,
          usageCount: g.usageCount,
          trend: this.calculateTrend(g.manifestoId),
          evolvedWeight: g.evolvedWeight
        })),
        worstPerformers: this.getWorstPerformers(evolver),
        recentlyEvolved: this.getRecentlyEvolved(evolver)
      },
      
      emergentPrinciples: {
        total: evolverStats.emergentPrinciples,
        recent: principles.slice(0, 5).map(p => ({
          id: p.id,
          principle: p.principle,
          confidence: p.confidence,
          domains: p.applicableDomains,
          discoveredAt: p.createdAt
        })),
        byDomain: this.groupPrinciplesByDomain(principles)
      },
      
      synergies: {
        strongestPairs: this.getStrongestSynergies(evolver),
        weakestPairs: this.getWeakestSynergies(evolver),
        discoveredToday: this.countTodaySynergies(evolver)
      },
      
      souls: {
        totalForged: architectStats.totalSoulsForged,
        activeNow: architectStats.activeSouls,
        successfulSouls: Math.round(architectStats.totalSoulsForged * bridgeStats.successRate),
        failedSouls: Math.round(architectStats.totalSoulsForged * (1 - bridgeStats.successRate))
      },
      
      trends: {
        qualityTrend: this.calculateQualityTrend(),
        evolutionSpeed: this.calculateEvolutionSpeed(evolverStats),
        learningRate: this.calculateLearningRate(evolverStats)
      }
    };
    
    // Armazenar snapshot
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    
    return snapshot;
  }


  /**
   * 🧠 Calcula o "QI" do sistema (0-200)
   */
  private calculateSystemIQ(
    evolverStats: any,
    bridgeStats: any,
    coreStats: any
  ): number {
    let iq = 100; // Base
    
    // Bônus por geração (cada geração = +5 IQ, max +50)
    iq += Math.min(50, evolverStats.generation * 5);
    
    // Bônus por taxa de sucesso (+30 max)
    iq += bridgeStats.successRate * 30;
    
    // Bônus por princípios emergentes (+2 cada, max +20)
    iq += Math.min(20, evolverStats.emergentPrinciples * 2);
    
    // Bônus por qualidade média
    if (bridgeStats.avgScore > 90) iq += 10;
    else if (bridgeStats.avgScore > 80) iq += 5;
    
    // Penalidade se muitos feedbacks pendentes
    if (evolverStats.pendingFeedbacks > 15) iq -= 10;
    
    return Math.round(Math.min(200, Math.max(50, iq)));
  }

  /**
   * 🏥 Determina saúde do sistema
   */
  private determineSystemHealth(
    iq: number,
    successRate: number
  ): 'excellent' | 'good' | 'warning' | 'critical' {
    if (iq >= 150 && successRate >= 0.8) return 'excellent';
    if (iq >= 120 && successRate >= 0.6) return 'good';
    if (iq >= 100 && successRate >= 0.4) return 'warning';
    return 'critical';
  }

  /**
   * 📈 Calcula tendência de um manifesto
   */
  private calculateTrend(manifestoId: string): 'up' | 'stable' | 'down' {
    // Simplificado - em produção, compararia com snapshots anteriores
    const evolver = getSupremeEvolver();
    const topPerformers = evolver.getTopPerformers(10);
    const position = topPerformers.findIndex(g => g.manifestoId === manifestoId);
    
    if (position < 3) return 'up';
    if (position < 7) return 'stable';
    return 'down';
  }

  /**
   * 📉 Obtém piores performers
   */
  private getWorstPerformers(evolver: any): ManifestoPerformance[] {
    const allGenomes = evolver.getTopPerformers(100);
    return allGenomes
      .filter((g: any) => g.usageCount >= 2)
      .sort((a: any, b: any) => a.successRate - b.successRate)
      .slice(0, 5)
      .map((g: any) => ({
        id: g.manifestoId,
        name: g.manifestoId,
        successRate: g.successRate,
        avgQuality: g.avgQualityScore,
        usageCount: g.usageCount,
        trend: 'down' as const,
        evolvedWeight: g.evolvedWeight
      }));
  }

  /**
   * 🔄 Obtém manifestos recentemente evoluídos
   */
  private getRecentlyEvolved(evolver: any): string[] {
    const report = evolver.generateEvolutionReport();
    return report.recentEvolutions
      .slice(0, 5)
      .map((e: any) => e.manifesto);
  }

  /**
   * 📊 Agrupa princípios por domínio
   */
  private groupPrinciplesByDomain(principles: any[]): Record<string, number> {
    const byDomain: Record<string, number> = {};
    
    for (const p of principles) {
      for (const domain of p.applicableDomains) {
        byDomain[domain] = (byDomain[domain] || 0) + 1;
      }
      if (p.applicableDomains.length === 0) {
        byDomain['general'] = (byDomain['general'] || 0) + 1;
      }
    }
    
    return byDomain;
  }

  /**
   * 🤝 Obtém sinergias mais fortes
   */
  private getStrongestSynergies(evolver: any): SynergyPair[] {
    const pairs: SynergyPair[] = [];
    const topPerformers = evolver.getTopPerformers(10);
    
    for (const genome of topPerformers) {
      const synergies = evolver.getBestSynergies(genome.manifestoId, 3);
      for (const syn of synergies) {
        pairs.push({
          manifesto1: genome.manifestoId,
          manifesto2: syn.partnerId,
          synergyScore: syn.synergyScore,
          observedIn: syn.observedIn
        });
      }
    }
    
    return pairs
      .sort((a, b) => b.synergyScore - a.synergyScore)
      .slice(0, 5);
  }

  /**
   * 💔 Obtém sinergias mais fracas
   */
  private getWeakestSynergies(evolver: any): SynergyPair[] {
    const pairs: SynergyPair[] = [];
    const topPerformers = evolver.getTopPerformers(10);
    
    for (const genome of topPerformers) {
      const synergies = evolver.getBestSynergies(genome.manifestoId, 10);
      for (const syn of synergies) {
        if (syn.synergyScore < 0.5 && syn.observedIn >= 2) {
          pairs.push({
            manifesto1: genome.manifestoId,
            manifesto2: syn.partnerId,
            synergyScore: syn.synergyScore,
            observedIn: syn.observedIn
          });
        }
      }
    }
    
    return pairs
      .sort((a, b) => a.synergyScore - b.synergyScore)
      .slice(0, 5);
  }

  /**
   * 📅 Conta sinergias descobertas hoje
   */
  private countTodaySynergies(evolver: any): number {
    // Simplificado - em produção, verificaria timestamps
    return Math.floor(Math.random() * 5);
  }

  /**
   * 📈 Calcula tendência de qualidade
   */
  private calculateQualityTrend(): 'improving' | 'stable' | 'declining' {
    if (this.snapshots.length < 3) return 'stable';
    
    const recent = this.snapshots.slice(-3);
    const avgRecent = recent.reduce((sum, s) => sum + s.evolution.avgQualityScore, 0) / 3;
    
    const older = this.snapshots.slice(-6, -3);
    if (older.length === 0) return 'stable';
    
    const avgOlder = older.reduce((sum, s) => sum + s.evolution.avgQualityScore, 0) / older.length;
    
    if (avgRecent > avgOlder + 5) return 'improving';
    if (avgRecent < avgOlder - 5) return 'declining';
    return 'stable';
  }

  /**
   * ⚡ Calcula velocidade de evolução
   */
  private calculateEvolutionSpeed(evolverStats: any): 'fast' | 'normal' | 'slow' {
    const feedbacksPerGeneration = evolverStats.totalFeedbacks / Math.max(1, evolverStats.generation);
    
    if (feedbacksPerGeneration < 8) return 'fast';
    if (feedbacksPerGeneration > 15) return 'slow';
    return 'normal';
  }

  /**
   * 📚 Calcula taxa de aprendizado
   */
  private calculateLearningRate(evolverStats: any): number {
    // Taxa baseada em princípios por geração
    if (evolverStats.generation === 0) return 0;
    return Math.min(1, evolverStats.emergentPrinciples / (evolverStats.generation * 3));
  }

  /**
   * 📊 Gera relatório visual ASCII
   */
  generateASCIIReport(): string {
    const snapshot = this.captureSnapshot();
    
    const healthEmoji = {
      excellent: '🟢',
      good: '🟡',
      warning: '🟠',
      critical: '🔴'
    };
    
    const trendEmoji = {
      improving: '📈',
      stable: '➡️',
      declining: '📉'
    };
    
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         📊 META-COGNITION DASHBOARD - SNAPSHOT ${new Date().toLocaleTimeString()}              ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         SAÚDE DO SISTEMA                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Status: ${healthEmoji[snapshot.systemHealth]} ${snapshot.systemHealth.toUpperCase().padEnd(62)}║
║  QI do Sistema: ${String(snapshot.overallIQ).padEnd(59)}║
║  Tendência: ${trendEmoji[snapshot.trends.qualityTrend]} ${snapshot.trends.qualityTrend.padEnd(60)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         EVOLUÇÃO                                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Geração Atual: ${String(snapshot.evolution.generation).padEnd(59)}║
║  Total Feedbacks: ${String(snapshot.evolution.totalFeedbacks).padEnd(57)}║
║  Taxa de Sucesso: ${(snapshot.evolution.successRate * 100).toFixed(1)}%${' '.repeat(53)}║
║  Qualidade Média: ${snapshot.evolution.avgQualityScore.toFixed(1)}/100${' '.repeat(50)}║
║  Próxima Evolução em: ${snapshot.evolution.nextEvolutionIn} feedbacks${' '.repeat(43)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         MANIFESTOS                                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Total na Alexandria: ${String(snapshot.manifestos.total).padEnd(53)}║
║  Ativos (com dados): ${String(snapshot.manifestos.active).padEnd(54)}║
║                                                                              ║
║  🏆 TOP PERFORMERS:                                                          ║
${snapshot.manifestos.topPerformers.slice(0, 3).map((m, i) => 
  `║  ${i + 1}. ${m.id.substring(0, 25).padEnd(25)} ${(m.successRate * 100).toFixed(0)}% sucesso`.padEnd(79) + '║'
).join('\n')}
╠══════════════════════════════════════════════════════════════════════════════╣
║                         PRINCÍPIOS EMERGENTES                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Total Descobertos: ${String(snapshot.emergentPrinciples.total).padEnd(55)}║
║                                                                              ║
${snapshot.emergentPrinciples.recent.slice(0, 2).map(p => 
  `║  💡 "${p.principle.substring(0, 60)}..."`.padEnd(79) + '║'
).join('\n') || '║  (Nenhum princípio emergente ainda)                                          ║'}
╠══════════════════════════════════════════════════════════════════════════════╣
║                         ALMAS FORJADAS                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Total Forjadas: ${String(snapshot.souls.totalForged).padEnd(58)}║
║  Bem-sucedidas: ${String(snapshot.souls.successfulSouls).padEnd(59)}║
║  Falharam: ${String(snapshot.souls.failedSouls).padEnd(64)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         SINERGIAS DESCOBERTAS                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
${snapshot.synergies.strongestPairs.slice(0, 2).map(s => 
  `║  🤝 ${s.manifesto1.substring(0, 15)} + ${s.manifesto2.substring(0, 15)} = ${(s.synergyScore * 100).toFixed(0)}%`.padEnd(79) + '║'
).join('\n') || '║  (Nenhuma sinergia forte descoberta ainda)                                    ║'}
╚══════════════════════════════════════════════════════════════════════════════╝

🧠 O sistema está ${snapshot.trends.qualityTrend === 'improving' ? 'EVOLUINDO' : snapshot.trends.qualityTrend === 'stable' ? 'ESTÁVEL' : 'PRECISANDO DE ATENÇÃO'}!
📚 Taxa de Aprendizado: ${(snapshot.trends.learningRate * 100).toFixed(0)}%
⚡ Velocidade de Evolução: ${snapshot.trends.evolutionSpeed.toUpperCase()}
    `;
  }

  /**
   * 📈 Gera dados para gráfico de evolução
   */
  getEvolutionChartData(): {
    labels: string[];
    qualityScores: number[];
    successRates: number[];
    generations: number[];
  } {
    return {
      labels: this.snapshots.map(s => s.timestamp.toLocaleTimeString()),
      qualityScores: this.snapshots.map(s => s.evolution.avgQualityScore),
      successRates: this.snapshots.map(s => s.evolution.successRate * 100),
      generations: this.snapshots.map(s => s.evolution.generation)
    };
  }

  /**
   * 🗺️ Gera mapa de sinergias para visualização
   */
  getSynergyMap(): {
    nodes: { id: string; weight: number }[];
    edges: { source: string; target: string; strength: number }[];
  } {
    const snapshot = this.captureSnapshot();
    const nodes = new Map<string, number>();
    const edges: { source: string; target: string; strength: number }[] = [];
    
    // Coletar nós dos top performers
    for (const m of snapshot.manifestos.topPerformers) {
      nodes.set(m.id, m.evolvedWeight);
    }
    
    // Coletar edges das sinergias
    for (const syn of snapshot.synergies.strongestPairs) {
      if (!nodes.has(syn.manifesto1)) nodes.set(syn.manifesto1, 50);
      if (!nodes.has(syn.manifesto2)) nodes.set(syn.manifesto2, 50);
      
      edges.push({
        source: syn.manifesto1,
        target: syn.manifesto2,
        strength: syn.synergyScore
      });
    }
    
    return {
      nodes: Array.from(nodes.entries()).map(([id, weight]) => ({ id, weight })),
      edges
    };
  }

  /**
   * 📊 Retorna histórico de snapshots
   */
  getHistory(): DashboardSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * 🗑️ Limpa histórico
   */
  clearHistory(): void {
    this.snapshots = [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON E EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let dashboardInstance: MetaCognitionDashboard | null = null;

export function getMetaCognitionDashboard(): MetaCognitionDashboard {
  if (!dashboardInstance) {
    dashboardInstance = new MetaCognitionDashboard();
  }
  return dashboardInstance;
}

export default MetaCognitionDashboard;
