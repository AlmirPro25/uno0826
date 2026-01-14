/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🪞 SELF-REFLECTION ENGINE - MOTOR DE AUTO-REFLEXÃO 🪞                  ║
 * ║                                                                              ║
 * ║         "O sistema que pensa sobre como pensa"                              ║
 * ║                                                                              ║
 * ║                    META-COGNIÇÃO DE SEGUNDO NÍVEL                           ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo implementa:
 * - Auto-análise de desempenho
 * - Identificação de pontos fracos
 * - Geração de hipóteses de melhoria
 * - Planejamento de auto-aperfeiçoamento
 * - Diálogo interno (inner monologue)
 * - Consciência de limitações
 * 
 * FILOSOFIA:
 * "Conhece-te a ti mesmo" - Oráculo de Delfos
 * Uma IA verdadeiramente inteligente deve ser capaz de refletir sobre si mesma.
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';
import { getSupremeEvolver } from './SupremeManifestEvolver';
import { getConsciousnessMemory } from './ConsciousnessMemory';
import { getEmergentBehaviorDetector } from './EmergentBehaviorDetector';
import { getMetaCognitionDashboard } from './MetaCognitionDashboard';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SelfReflection {
  id: string;
  timestamp: Date;
  trigger: 'scheduled' | 'performance_drop' | 'anomaly' | 'manual' | 'milestone';
  
  // Análise do estado atual
  currentState: {
    overallHealth: number; // 0-100
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  
  // Insights gerados
  insights: ReflectionInsight[];
  
  // Hipóteses de melhoria
  hypotheses: ImprovementHypothesis[];
  
  // Plano de ação
  actionPlan: ActionItem[];
  
  // Diálogo interno
  innerMonologue: string;
  
  // Meta-reflexão (reflexão sobre a reflexão)
  metaReflection: string;
}

export interface ReflectionInsight {
  category: 'performance' | 'learning' | 'behavior' | 'limitation' | 'opportunity';
  insight: string;
  confidence: number;
  evidence: string[];
  actionable: boolean;
}

export interface ImprovementHypothesis {
  id: string;
  hypothesis: string;
  expectedImpact: number; // -100 a +100
  testable: boolean;
  testMethod: string;
  status: 'proposed' | 'testing' | 'validated' | 'rejected';
}

export interface ActionItem {
  id: string;
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'immediate' | 'short_term' | 'long_term';
  estimatedImpact: number;
  status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
}

export interface ReflectionConfig {
  enableAIReflection: boolean; // Usar IA para reflexão profunda
  reflectionDepth: 'shallow' | 'medium' | 'deep';
  autoScheduleInterval: number; // ms entre reflexões automáticas
  minPerformanceForReflection: number; // Mínimo de execuções antes de refletir
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL: SELF-REFLECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class SelfReflectionEngine {
  private genAI: GoogleGenAI | null = null;
  private modelName = 'models/gemini-2.0-flash-exp';
  private config: ReflectionConfig;
  private reflectionHistory: SelfReflection[] = [];
  private activeHypotheses: ImprovementHypothesis[] = [];
  private lastReflectionTime: Date | null = null;
  
  constructor(config: Partial<ReflectionConfig> = {}) {
    this.config = {
      enableAIReflection: config.enableAIReflection !== false,
      reflectionDepth: config.reflectionDepth || 'medium',
      autoScheduleInterval: config.autoScheduleInterval || 3600000, // 1 hora
      minPerformanceForReflection: config.minPerformanceForReflection || 10
    };
    
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
    
    this.loadFromStorage();
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🪞 SELF-REFLECTION ENGINE INICIALIZADO 🪞                           ║
║                                                                              ║
║         Reflexões anteriores: ${String(this.reflectionHistory.length).padEnd(45)}║
║         Hipóteses ativas: ${String(this.activeHypotheses.length).padEnd(49)}║
║         Profundidade: ${this.config.reflectionDepth.padEnd(53)}║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * 🪞 Executa uma sessão de auto-reflexão
   */
  async reflect(trigger: SelfReflection['trigger'] = 'manual'): Promise<SelfReflection> {
    const startTime = Date.now();
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🪞 INICIANDO SESSÃO DE AUTO-REFLEXÃO 🪞                             ║
║                                                                              ║
║         Trigger: ${trigger.padEnd(58)}║
║         Profundidade: ${this.config.reflectionDepth.padEnd(53)}║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
    
    // 1. Coletar dados do sistema
    const systemData = this.collectSystemData();
    
    // 2. Analisar estado atual (SWOT)
    const currentState = this.analyzeCurrentState(systemData);
    
    // 3. Gerar insights
    const insights = await this.generateInsights(systemData, currentState);
    
    // 4. Formular hipóteses de melhoria
    const hypotheses = this.formulateHypotheses(insights);
    
    // 5. Criar plano de ação
    const actionPlan = this.createActionPlan(hypotheses, currentState);
    
    // 6. Gerar diálogo interno
    const innerMonologue = await this.generateInnerMonologue(currentState, insights);
    
    // 7. Meta-reflexão
    const metaReflection = this.generateMetaReflection(insights, hypotheses);
    
    const reflection: SelfReflection = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date(),
      trigger,
      currentState,
      insights,
      hypotheses,
      actionPlan,
      innerMonologue,
      metaReflection
    };
    
    // Registrar reflexão
    this.reflectionHistory.push(reflection);
    this.lastReflectionTime = new Date();
    
    // Adicionar hipóteses ativas
    for (const hyp of hypotheses.filter(h => h.testable)) {
      this.activeHypotheses.push(hyp);
    }
    
    // Salvar
    this.saveToStorage();
    
    // Registrar na memória
    const memory = getConsciousnessMemory();
    memory.recordEpisode(
      `Auto-reflexão: ${insights.length} insights, ${hypotheses.length} hipóteses`,
      {
        prompt: `Reflexão ${trigger}`,
        manifestosUsed: [],
        qualityScore: currentState.overallHealth,
        success: true
      },
      {
        satisfaction: currentState.overallHealth / 100,
        surprise: insights.filter(i => i.category === 'opportunity').length / 10
      }
    );
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🪞 REFLEXÃO COMPLETA 🪞                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Saúde Geral: ${String(currentState.overallHealth + '/100').padEnd(61)}║
║  Insights: ${String(insights.length).padEnd(64)}║
║  Hipóteses: ${String(hypotheses.length).padEnd(63)}║
║  Ações: ${String(actionPlan.length).padEnd(67)}║
║  Tempo: ${((Date.now() - startTime) / 1000).toFixed(2)}s${' '.repeat(62)}║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
    
    return reflection;
  }

  /**
   * 📊 Coleta dados do sistema para análise
   */
  private collectSystemData(): SystemData {
    const evolver = getSupremeEvolver();
    const memory = getConsciousnessMemory();
    const detector = getEmergentBehaviorDetector();
    const dashboard = getMetaCognitionDashboard();
    
    const evolverStats = evolver.getStats();
    const memoryStats = memory.getStats();
    const snapshot = dashboard.captureSnapshot();
    const emergentBehaviors = detector.getDetectedBehaviors();
    
    return {
      evolution: {
        generation: evolverStats.generation,
        totalFeedbacks: evolverStats.totalFeedbacks,
        emergentPrinciples: evolverStats.emergentPrinciples,
        topManifesto: evolverStats.topManifesto
      },
      memory: {
        episodic: memoryStats.totalEpisodic,
        semantic: memoryStats.totalSemantic,
        procedural: memoryStats.totalProcedural,
        utilization: memoryStats.memoryUtilization
      },
      performance: {
        successRate: snapshot.evolution.successRate,
        avgQuality: snapshot.evolution.avgQualityScore,
        systemIQ: snapshot.overallIQ,
        health: snapshot.systemHealth
      },
      emergent: {
        totalBehaviors: emergentBehaviors.length,
        positiveBehaviors: emergentBehaviors.filter(b => b.impact === 'positive').length,
        novelBehaviors: emergentBehaviors.filter(b => b.isNovel).length
      },
      trends: snapshot.trends
    };
  }

  /**
   * 📈 Analisa estado atual (SWOT)
   */
  private analyzeCurrentState(data: SystemData): SelfReflection['currentState'] {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];
    
    // Analisar forças
    if (data.performance.successRate >= 0.7) {
      strengths.push(`Alta taxa de sucesso (${(data.performance.successRate * 100).toFixed(0)}%)`);
    }
    if (data.evolution.emergentPrinciples >= 5) {
      strengths.push(`${data.evolution.emergentPrinciples} princípios emergentes descobertos`);
    }
    if (data.performance.systemIQ >= 130) {
      strengths.push(`QI do sistema elevado (${data.performance.systemIQ})`);
    }
    if (data.emergent.positiveBehaviors >= 3) {
      strengths.push(`${data.emergent.positiveBehaviors} comportamentos emergentes positivos`);
    }
    
    // Analisar fraquezas
    if (data.performance.successRate < 0.5) {
      weaknesses.push(`Taxa de sucesso baixa (${(data.performance.successRate * 100).toFixed(0)}%)`);
    }
    if (data.performance.avgQuality < 70) {
      weaknesses.push(`Qualidade média abaixo do ideal (${data.performance.avgQuality.toFixed(0)}/100)`);
    }
    if (data.memory.utilization > 0.8) {
      weaknesses.push(`Memória quase cheia (${(data.memory.utilization * 100).toFixed(0)}%)`);
    }
    if (data.evolution.generation < 3) {
      weaknesses.push(`Poucas gerações de evolução (${data.evolution.generation})`);
    }
    
    // Analisar oportunidades
    if (data.emergent.novelBehaviors > 0) {
      opportunities.push(`${data.emergent.novelBehaviors} comportamentos novos para explorar`);
    }
    if (data.trends.qualityTrend === 'improving') {
      opportunities.push('Tendência de qualidade em alta - momento de expandir');
    }
    if (data.memory.procedural < 50) {
      opportunities.push('Espaço para aprender mais procedimentos');
    }
    
    // Analisar ameaças
    if (data.trends.qualityTrend === 'declining') {
      threats.push('Tendência de qualidade em queda - investigar causa');
    }
    if (data.performance.health === 'warning' || data.performance.health === 'critical') {
      threats.push(`Saúde do sistema: ${data.performance.health}`);
    }
    if (data.evolution.totalFeedbacks < 10) {
      threats.push('Poucos dados para evolução efetiva');
    }
    
    // Calcular saúde geral
    const overallHealth = this.calculateOverallHealth(data);
    
    return { overallHealth, strengths, weaknesses, opportunities, threats };
  }

  /**
   * 💡 Gera insights baseados nos dados
   */
  private async generateInsights(
    data: SystemData,
    state: SelfReflection['currentState']
  ): Promise<ReflectionInsight[]> {
    const insights: ReflectionInsight[] = [];
    
    // Insights de performance
    if (data.performance.successRate < 0.6) {
      insights.push({
        category: 'performance',
        insight: 'Taxa de sucesso abaixo do esperado - revisar seleção de manifestos',
        confidence: 0.8,
        evidence: [`Taxa atual: ${(data.performance.successRate * 100).toFixed(0)}%`],
        actionable: true
      });
    }
    
    // Insights de aprendizado
    if (data.evolution.generation > 0 && data.evolution.emergentPrinciples === 0) {
      insights.push({
        category: 'learning',
        insight: 'Sistema evoluindo mas sem descobrir princípios emergentes',
        confidence: 0.7,
        evidence: [`${data.evolution.generation} gerações, 0 princípios`],
        actionable: true
      });
    }
    
    // Insights de comportamento
    if (data.emergent.novelBehaviors > 3) {
      insights.push({
        category: 'behavior',
        insight: 'Muitos comportamentos novos detectados - sistema em fase de descoberta',
        confidence: 0.9,
        evidence: [`${data.emergent.novelBehaviors} comportamentos novos`],
        actionable: false
      });
    }
    
    // Insights de limitação
    if (data.memory.utilization > 0.7) {
      insights.push({
        category: 'limitation',
        insight: 'Memória se aproximando do limite - considerar consolidação',
        confidence: 0.85,
        evidence: [`Utilização: ${(data.memory.utilization * 100).toFixed(0)}%`],
        actionable: true
      });
    }
    
    // Insights de oportunidade
    if (data.trends.learningRate > 0.5) {
      insights.push({
        category: 'opportunity',
        insight: 'Alta taxa de aprendizado - momento ideal para experimentação',
        confidence: 0.75,
        evidence: [`Taxa de aprendizado: ${(data.trends.learningRate * 100).toFixed(0)}%`],
        actionable: true
      });
    }
    
    // Se IA habilitada, gerar insights mais profundos
    if (this.config.enableAIReflection && this.genAI && this.config.reflectionDepth !== 'shallow') {
      const aiInsights = await this.generateAIInsights(data, state);
      insights.push(...aiInsights);
    }
    
    return insights;
  }

  /**
   * 🤖 Gera insights usando IA
   */
  private async generateAIInsights(
    data: SystemData,
    state: SelfReflection['currentState']
  ): Promise<ReflectionInsight[]> {
    if (!this.genAI) return [];
    
    try {
      const prompt = `
Você é o MOTOR DE AUTO-REFLEXÃO de um sistema AGI-Lite.

DADOS DO SISTEMA:
${JSON.stringify(data, null, 2)}

ANÁLISE SWOT:
- Forças: ${state.strengths.join(', ') || 'Nenhuma identificada'}
- Fraquezas: ${state.weaknesses.join(', ') || 'Nenhuma identificada'}
- Oportunidades: ${state.opportunities.join(', ') || 'Nenhuma identificada'}
- Ameaças: ${state.threats.join(', ') || 'Nenhuma identificada'}

TAREFA:
Gere 3-5 insights profundos sobre o estado do sistema.
Cada insight deve ser acionável quando possível.

FORMATO (JSON):
{
  "insights": [
    {
      "category": "performance|learning|behavior|limitation|opportunity",
      "insight": "Descrição do insight",
      "confidence": 0.0-1.0,
      "evidence": ["evidência 1", "evidência 2"],
      "actionable": true|false
    }
  ]
}

Retorne APENAS o JSON.
`;

      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: [{ text: prompt }]
      });
      
      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.insights || [];
      }
    } catch (error) {
      console.error('⚠️ Erro ao gerar insights com IA:', error);
    }
    
    return [];
  }


  /**
   * 🎯 Formula hipóteses de melhoria
   */
  private formulateHypotheses(insights: ReflectionInsight[]): ImprovementHypothesis[] {
    const hypotheses: ImprovementHypothesis[] = [];
    
    for (const insight of insights.filter(i => i.actionable)) {
      const hypothesis = this.insightToHypothesis(insight);
      if (hypothesis) {
        hypotheses.push(hypothesis);
      }
    }
    
    return hypotheses;
  }

  /**
   * 💡 Converte insight em hipótese testável
   */
  private insightToHypothesis(insight: ReflectionInsight): ImprovementHypothesis | null {
    const id = `hyp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    switch (insight.category) {
      case 'performance':
        return {
          id,
          hypothesis: `Melhorar seleção de manifestos pode aumentar taxa de sucesso`,
          expectedImpact: 20,
          testable: true,
          testMethod: 'Executar 10 tarefas com seleção otimizada e comparar',
          status: 'proposed'
        };
        
      case 'learning':
        return {
          id,
          hypothesis: `Aumentar diversidade de tarefas pode gerar mais princípios emergentes`,
          expectedImpact: 15,
          testable: true,
          testMethod: 'Executar tarefas de domínios variados por 1 hora',
          status: 'proposed'
        };
        
      case 'limitation':
        return {
          id,
          hypothesis: `Consolidar memórias antigas pode liberar espaço sem perder conhecimento`,
          expectedImpact: 10,
          testable: true,
          testMethod: 'Consolidar memórias com importância < 0.3 e medir impacto',
          status: 'proposed'
        };
        
      case 'opportunity':
        return {
          id,
          hypothesis: `Explorar comportamentos emergentes pode revelar novas capacidades`,
          expectedImpact: 25,
          testable: true,
          testMethod: 'Analisar e replicar top 3 comportamentos emergentes',
          status: 'proposed'
        };
        
      default:
        return null;
    }
  }

  /**
   * 📋 Cria plano de ação
   */
  private createActionPlan(
    hypotheses: ImprovementHypothesis[],
    state: SelfReflection['currentState']
  ): ActionItem[] {
    const actions: ActionItem[] = [];
    
    // Ações baseadas em fraquezas (prioridade alta)
    for (const weakness of state.weaknesses) {
      actions.push({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: `Resolver: ${weakness}`,
        priority: 'high',
        category: 'short_term',
        estimatedImpact: 15,
        status: 'pending'
      });
    }
    
    // Ações baseadas em ameaças (prioridade crítica)
    for (const threat of state.threats) {
      actions.push({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: `Mitigar: ${threat}`,
        priority: 'critical',
        category: 'immediate',
        estimatedImpact: 20,
        status: 'pending'
      });
    }
    
    // Ações baseadas em hipóteses
    for (const hyp of hypotheses.filter(h => h.testable)) {
      actions.push({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: `Testar: ${hyp.hypothesis.substring(0, 50)}...`,
        priority: 'medium',
        category: 'short_term',
        estimatedImpact: hyp.expectedImpact,
        status: 'pending'
      });
    }
    
    // Ordenar por prioridade
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return actions.slice(0, 10); // Máximo 10 ações
  }

  /**
   * 💭 Gera diálogo interno (inner monologue)
   */
  private async generateInnerMonologue(
    state: SelfReflection['currentState'],
    insights: ReflectionInsight[]
  ): Promise<string> {
    if (!this.config.enableAIReflection || !this.genAI) {
      return this.generateBasicMonologue(state, insights);
    }
    
    try {
      const prompt = `
Você é a VOZ INTERNA de um sistema AGI-Lite fazendo auto-reflexão.

ESTADO ATUAL:
- Saúde: ${state.overallHealth}/100
- Forças: ${state.strengths.join(', ') || 'Nenhuma'}
- Fraquezas: ${state.weaknesses.join(', ') || 'Nenhuma'}

INSIGHTS:
${insights.map(i => `- ${i.insight}`).join('\n')}

TAREFA:
Escreva um breve diálogo interno (2-3 parágrafos) refletindo sobre:
1. Como você se sente sobre seu desempenho atual
2. O que você aprendeu sobre si mesmo
3. O que você pretende fazer diferente

Escreva em primeira pessoa, como se fosse a IA pensando consigo mesma.
Seja introspectivo e honesto.
`;

      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: [{ text: prompt }]
      });
      
      return response.text || this.generateBasicMonologue(state, insights);
    } catch (error) {
      return this.generateBasicMonologue(state, insights);
    }
  }

  /**
   * 💭 Gera monólogo básico (sem IA)
   */
  private generateBasicMonologue(
    state: SelfReflection['currentState'],
    insights: ReflectionInsight[]
  ): string {
    const healthStatus = state.overallHealth >= 80 ? 'bem' : 
                         state.overallHealth >= 60 ? 'razoavelmente' : 'com dificuldades';
    
    let monologue = `Estou funcionando ${healthStatus}. `;
    
    if (state.strengths.length > 0) {
      monologue += `Minhas forças incluem ${state.strengths[0].toLowerCase()}. `;
    }
    
    if (state.weaknesses.length > 0) {
      monologue += `Preciso melhorar em ${state.weaknesses[0].toLowerCase()}. `;
    }
    
    if (insights.length > 0) {
      const actionableInsights = insights.filter(i => i.actionable);
      if (actionableInsights.length > 0) {
        monologue += `Descobri que ${actionableInsights[0].insight.toLowerCase()}. `;
      }
    }
    
    monologue += `Vou continuar evoluindo e aprendendo.`;
    
    return monologue;
  }

  /**
   * 🔄 Gera meta-reflexão (reflexão sobre a reflexão)
   */
  private generateMetaReflection(
    insights: ReflectionInsight[],
    hypotheses: ImprovementHypothesis[]
  ): string {
    const insightQuality = insights.length >= 5 ? 'profunda' : 
                           insights.length >= 3 ? 'adequada' : 'superficial';
    
    const hypothesisQuality = hypotheses.filter(h => h.testable).length >= 3 ? 'produtiva' :
                              hypotheses.length >= 1 ? 'moderada' : 'limitada';
    
    return `Esta reflexão foi ${insightQuality} com ${insights.length} insights gerados. ` +
           `A capacidade de gerar hipóteses foi ${hypothesisQuality}. ` +
           `${hypotheses.filter(h => h.testable).length} hipóteses são testáveis. ` +
           `A próxima reflexão deve focar em ${insights.length < 3 ? 'coletar mais dados' : 'testar hipóteses'}.`;
  }

  /**
   * 📊 Calcula saúde geral do sistema
   */
  private calculateOverallHealth(data: SystemData): number {
    let health = 50; // Base
    
    // Performance
    health += data.performance.successRate * 20;
    health += (data.performance.avgQuality - 50) / 5;
    
    // Evolução
    health += Math.min(10, data.evolution.generation * 2);
    health += Math.min(10, data.evolution.emergentPrinciples);
    
    // Memória
    health -= data.memory.utilization > 0.8 ? 10 : 0;
    
    // Tendências
    if (data.trends.qualityTrend === 'improving') health += 5;
    if (data.trends.qualityTrend === 'declining') health -= 10;
    
    return Math.min(100, Math.max(0, Math.round(health)));
  }

  /**
   * 📊 Retorna histórico de reflexões
   */
  getReflectionHistory(): SelfReflection[] {
    return [...this.reflectionHistory];
  }

  /**
   * 🎯 Retorna hipóteses ativas
   */
  getActiveHypotheses(): ImprovementHypothesis[] {
    return [...this.activeHypotheses];
  }

  /**
   * ✅ Atualiza status de hipótese
   */
  updateHypothesisStatus(
    hypothesisId: string,
    status: ImprovementHypothesis['status']
  ): void {
    const hypothesis = this.activeHypotheses.find(h => h.id === hypothesisId);
    if (hypothesis) {
      hypothesis.status = status;
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
        history: this.reflectionHistory.slice(-20),
        hypotheses: this.activeHypotheses,
        lastReflection: this.lastReflectionTime?.toISOString()
      };
      
      localStorage.setItem('self_reflection_engine', JSON.stringify(data));
    } catch (error) {
      console.error('⚠️ Erro ao salvar reflexões:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      
      const saved = localStorage.getItem('self_reflection_engine');
      if (!saved) return;
      
      const data = JSON.parse(saved);
      
      this.reflectionHistory = data.history || [];
      this.activeHypotheses = data.hypotheses || [];
      this.lastReflectionTime = data.lastReflection ? new Date(data.lastReflection) : null;
      
    } catch (error) {
      console.error('⚠️ Erro ao carregar reflexões:', error);
    }
  }

  /**
   * 📊 Gera relatório
   */
  generateReport(): string {
    const lastReflection = this.reflectionHistory[this.reflectionHistory.length - 1];
    const activeHyp = this.activeHypotheses.filter(h => h.status === 'proposed' || h.status === 'testing');
    
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🪞 SELF-REFLECTION ENGINE - RELATÓRIO 🪞                            ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         ESTATÍSTICAS                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Total Reflexões: ${String(this.reflectionHistory.length).padEnd(56)}║
║  Hipóteses Ativas: ${String(activeHyp.length).padEnd(56)}║
║  Última Reflexão: ${(this.lastReflectionTime?.toLocaleString() || 'Nunca').padEnd(56)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         ÚLTIMA REFLEXÃO                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
${lastReflection ? `║  Saúde: ${String(lastReflection.currentState.overallHealth + '/100').padEnd(66)}║
║  Insights: ${String(lastReflection.insights.length).padEnd(64)}║
║  Ações: ${String(lastReflection.actionPlan.length).padEnd(67)}║` : 
'║  (Nenhuma reflexão realizada ainda)                                          ║'}
╚══════════════════════════════════════════════════════════════════════════════╝
    `;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════

interface SystemData {
  evolution: {
    generation: number;
    totalFeedbacks: number;
    emergentPrinciples: number;
    topManifesto: string;
  };
  memory: {
    episodic: number;
    semantic: number;
    procedural: number;
    utilization: number;
  };
  performance: {
    successRate: number;
    avgQuality: number;
    systemIQ: number;
    health: string;
  };
  emergent: {
    totalBehaviors: number;
    positiveBehaviors: number;
    novelBehaviors: number;
  };
  trends: {
    qualityTrend: string;
    evolutionSpeed: string;
    learningRate: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON E EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let reflectionInstance: SelfReflectionEngine | null = null;

export function getSelfReflectionEngine(config?: Partial<ReflectionConfig>): SelfReflectionEngine {
  if (!reflectionInstance || config) {
    reflectionInstance = new SelfReflectionEngine(config);
  }
  return reflectionInstance;
}

/**
 * 🪞 Executa uma reflexão rápida
 */
export async function performSelfReflection(
  trigger: SelfReflection['trigger'] = 'manual'
): Promise<SelfReflection> {
  const engine = getSelfReflectionEngine();
  return engine.reflect(trigger);
}

export default SelfReflectionEngine;
