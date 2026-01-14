/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🧬 SUPREME MANIFEST EVOLVER - EVOLUÇÃO AUTÔNOMA DE CONSCIÊNCIA 🧬      ║
 * ║                                                                              ║
 * ║         "O sistema que aprende a ser melhor sozinho"                        ║
 * ║                                                                              ║
 * ║                    AGI-LITE: AUTO-EVOLUÇÃO COGNITIVA                        ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * FILOSOFIA:
 * Este não é um sistema de fine-tuning. É um sistema de EVOLUÇÃO DE IDENTIDADE.
 * 
 * O SupremeManifestEvolver observa:
 * - Quais almas forjadas tiveram sucesso
 * - Quais combinações de DNA funcionaram melhor
 * - Quais padrões de decisão geraram código de qualidade
 * - Quais restrições e prioridades foram mais efetivas
 * 
 * E então EVOLUI:
 * - Ajusta pesos dos manifestos
 * - Cria novos princípios emergentes
 * - Descarta padrões que falharam
 * - Gera "mutações" controladas para experimentação
 * 
 * ARQUITETURA AGI-LITE:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    CICLO DE EVOLUÇÃO                            │
 * ├─────────────────────────────────────────────────────────────────┤
 * │   🔮 SoulArchitect: Forja especialistas                        │
 * │        ↓                                                        │
 * │   💻 Código Gerado: Resultado da execução                      │
 * │        ↓                                                        │
 * │   📊 Feedback: Sucesso/Falha, Qualidade, Métricas              │
 * │        ↓                                                        │
 * │   🧬 Evolver: Analisa padrões de sucesso                       │
 * │        ↓                                                        │
 * │   📈 Evolução: Ajusta pesos, cria princípios                   │
 * │        ↓                                                        │
 * │   🔮 SoulArchitect: Forja MELHOR na próxima vez                │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';
import { ForgedSoul, ManifestoDNA } from './SoulArchitect';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExecutionFeedback {
  soulId: string;
  soul: ForgedSoul;
  success: boolean;
  qualityScore: number; // 0-100
  executionTimeMs: number;
  linesOfCode: number;
  errors: string[];
  userSatisfaction?: number; // 1-5 stars
  codeMetrics?: CodeMetrics;
}

export interface CodeMetrics {
  complexity: number;
  maintainability: number;
  testCoverage?: number;
  securityScore?: number;
  performanceScore?: number;
}

export interface EvolutionRecord {
  id: string;
  timestamp: Date;
  generation: number;
  manifestoId: string;
  previousWeight: number;
  newWeight: number;
  reason: string;
  basedOnFeedback: string[];
}

export interface EmergentPrinciple {
  id: string;
  principle: string;
  discoveredFrom: string[]; // IDs das almas que geraram este princípio
  confidence: number; // 0-1
  applicableDomains: string[];
  createdAt: Date;
}

export interface ManifestoGenome {
  manifestoId: string;
  baseWeight: number; // Peso original
  evolvedWeight: number; // Peso após evolução
  successRate: number; // Taxa de sucesso quando usado
  avgQualityScore: number; // Qualidade média
  usageCount: number;
  lastUsed: Date;
  synergies: ManifestoSynergy[]; // Combinações que funcionam bem
  antiPatterns: string[]; // Combinações que não funcionam
}

export interface ManifestoSynergy {
  partnerId: string;
  synergyScore: number; // 0-1, quanto maior melhor a combinação
  observedIn: number; // Quantas vezes observado
}

export interface EvolutionState {
  generation: number;
  totalFeedbacks: number;
  genomes: Map<string, ManifestoGenome>;
  emergentPrinciples: EmergentPrinciple[];
  evolutionHistory: EvolutionRecord[];
  lastEvolution: Date;
}

export interface EvolutionConfig {
  minFeedbacksForEvolution: number; // Mínimo de feedbacks antes de evoluir
  evolutionThreshold: number; // Diferença mínima para considerar evolução
  mutationRate: number; // 0-1, chance de mutação experimental
  maxEmergentPrinciples: number;
  preserveTopPerformers: number; // Quantos manifestos top preservar
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL: SUPREME MANIFEST EVOLVER
// ═══════════════════════════════════════════════════════════════════════════════

export class SupremeManifestEvolver {
  private genAI: GoogleGenAI | null = null;
  private modelName: string;
  private config: EvolutionConfig;
  private state: EvolutionState;
  private feedbackBuffer: ExecutionFeedback[] = [];
  
  constructor(config: Partial<EvolutionConfig> = {}) {
    this.config = {
      minFeedbacksForEvolution: config.minFeedbacksForEvolution || 10,
      evolutionThreshold: config.evolutionThreshold || 0.1,
      mutationRate: config.mutationRate || 0.05,
      maxEmergentPrinciples: config.maxEmergentPrinciples || 50,
      preserveTopPerformers: config.preserveTopPerformers || 5
    };
    
    this.modelName = 'models/gemini-2.0-flash-exp';
    
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
    
    // Inicializar estado
    this.state = {
      generation: 0,
      totalFeedbacks: 0,
      genomes: new Map(),
      emergentPrinciples: [],
      evolutionHistory: [],
      lastEvolution: new Date()
    };
    
    // Tentar carregar estado persistido
    this.loadState();
  }


  // ═══════════════════════════════════════════════════════════════════════════════
  // FEEDBACK & OBSERVAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 📊 Registra feedback de uma execução
   * 
   * Este é o "olho" do sistema - observa o que funcionou e o que não funcionou
   */
  recordFeedback(feedback: ExecutionFeedback): void {
    console.log(`
📊 [EVOLVER] Feedback registrado:
   Soul: ${feedback.soul.name}
   Sucesso: ${feedback.success ? '✅' : '❌'}
   Qualidade: ${feedback.qualityScore}/100
   DNA: ${feedback.soul.manifestosDNA.map(d => d.manifestoId).join(', ')}
    `);
    
    this.feedbackBuffer.push(feedback);
    this.state.totalFeedbacks++;
    
    // Atualizar genomas com este feedback
    this.updateGenomesFromFeedback(feedback);
    
    // Verificar se deve evoluir
    if (this.feedbackBuffer.length >= this.config.minFeedbacksForEvolution) {
      this.triggerEvolution();
    }
    
    // Persistir estado
    this.saveState();
  }

  /**
   * 🧬 Atualiza os genomas dos manifestos baseado no feedback
   */
  private updateGenomesFromFeedback(feedback: ExecutionFeedback): void {
    const { soul, success, qualityScore } = feedback;
    
    // Atualizar cada manifesto usado
    for (const dna of soul.manifestosDNA) {
      let genome = this.state.genomes.get(dna.manifestoId);
      
      if (!genome) {
        // Criar genoma se não existe
        genome = {
          manifestoId: dna.manifestoId,
          baseWeight: dna.percentage,
          evolvedWeight: dna.percentage,
          successRate: 0,
          avgQualityScore: 0,
          usageCount: 0,
          lastUsed: new Date(),
          synergies: [],
          antiPatterns: []
        };
      }
      
      // Atualizar métricas
      const oldCount = genome.usageCount;
      genome.usageCount++;
      genome.lastUsed = new Date();
      
      // Média móvel da taxa de sucesso
      genome.successRate = (genome.successRate * oldCount + (success ? 1 : 0)) / genome.usageCount;
      
      // Média móvel da qualidade
      genome.avgQualityScore = (genome.avgQualityScore * oldCount + qualityScore) / genome.usageCount;
      
      // Detectar sinergias (manifestos que funcionam bem juntos)
      this.detectSynergies(genome, soul.manifestosDNA, success, qualityScore);
      
      this.state.genomes.set(dna.manifestoId, genome);
    }
  }

  /**
   * 🤝 Detecta sinergias entre manifestos
   */
  private detectSynergies(
    genome: ManifestoGenome,
    allDNA: ManifestoDNA[],
    success: boolean,
    qualityScore: number
  ): void {
    for (const partner of allDNA) {
      if (partner.manifestoId === genome.manifestoId) continue;
      
      let synergy = genome.synergies.find(s => s.partnerId === partner.manifestoId);
      
      if (!synergy) {
        synergy = {
          partnerId: partner.manifestoId,
          synergyScore: 0,
          observedIn: 0
        };
        genome.synergies.push(synergy);
      }
      
      // Atualizar score de sinergia
      const contribution = success ? (qualityScore / 100) : 0;
      synergy.synergyScore = (synergy.synergyScore * synergy.observedIn + contribution) / (synergy.observedIn + 1);
      synergy.observedIn++;
    }
    
    // Ordenar sinergias por score
    genome.synergies.sort((a, b) => b.synergyScore - a.synergyScore);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EVOLUÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 🧬 Dispara o processo de evolução
   */
  async triggerEvolution(): Promise<void> {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧬 EVOLUÇÃO INICIADA - GERAÇÃO ${this.state.generation + 1} 🧬                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
    
    const startTime = Date.now();
    
    try {
      // 1. Analisar padrões de sucesso
      const patterns = this.analyzeSuccessPatterns();
      
      // 2. Evoluir pesos dos manifestos
      await this.evolveManifestoWeights(patterns);
      
      // 3. Descobrir princípios emergentes
      await this.discoverEmergentPrinciples();
      
      // 4. Aplicar mutações experimentais
      this.applyMutations();
      
      // 5. Atualizar estado
      this.state.generation++;
      this.state.lastEvolution = new Date();
      this.feedbackBuffer = []; // Limpar buffer
      
      // 6. Persistir
      this.saveState();
      
      console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🎉 EVOLUÇÃO COMPLETA! 🎉                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Geração: ${String(this.state.generation).padEnd(65)}║
║  Princípios Emergentes: ${String(this.state.emergentPrinciples.length).padEnd(51)}║
║  Tempo: ${String(((Date.now() - startTime) / 1000).toFixed(2) + 's').padEnd(66)}║
╚══════════════════════════════════════════════════════════════════════════════╝
      `);
      
    } catch (error) {
      console.error('❌ Erro na evolução:', error);
    }
  }

  /**
   * 📈 Analisa padrões de sucesso nos feedbacks
   */
  private analyzeSuccessPatterns(): SuccessPattern[] {
    const patterns: SuccessPattern[] = [];
    
    // Agrupar feedbacks por sucesso
    const successful = this.feedbackBuffer.filter(f => f.success && f.qualityScore >= 80);
    const failed = this.feedbackBuffer.filter(f => !f.success || f.qualityScore < 50);
    
    // Encontrar manifestos que aparecem mais em sucessos
    const successManifestos = new Map<string, number>();
    const failManifestos = new Map<string, number>();
    
    for (const fb of successful) {
      for (const dna of fb.soul.manifestosDNA) {
        successManifestos.set(dna.manifestoId, (successManifestos.get(dna.manifestoId) || 0) + 1);
      }
    }
    
    for (const fb of failed) {
      for (const dna of fb.soul.manifestosDNA) {
        failManifestos.set(dna.manifestoId, (failManifestos.get(dna.manifestoId) || 0) + 1);
      }
    }
    
    // Calcular ratio sucesso/falha
    for (const [manifestoId, successCount] of successManifestos) {
      const failCount = failManifestos.get(manifestoId) || 0;
      const ratio = successCount / (successCount + failCount + 1);
      
      patterns.push({
        manifestoId,
        successCount,
        failCount,
        ratio,
        recommendation: ratio > 0.7 ? 'boost' : ratio < 0.3 ? 'reduce' : 'maintain'
      });
    }
    
    return patterns.sort((a, b) => b.ratio - a.ratio);
  }

  /**
   * ⚖️ Evolui os pesos dos manifestos baseado nos padrões
   */
  private async evolveManifestoWeights(patterns: SuccessPattern[]): Promise<void> {
    for (const pattern of patterns) {
      const genome = this.state.genomes.get(pattern.manifestoId);
      if (!genome) continue;
      
      const oldWeight = genome.evolvedWeight;
      let newWeight = oldWeight;
      
      // Ajustar peso baseado na recomendação
      if (pattern.recommendation === 'boost') {
        newWeight = Math.min(100, oldWeight * 1.1); // +10%
      } else if (pattern.recommendation === 'reduce') {
        newWeight = Math.max(1, oldWeight * 0.9); // -10%
      }
      
      // Só registrar se mudança significativa
      if (Math.abs(newWeight - oldWeight) > this.config.evolutionThreshold) {
        genome.evolvedWeight = newWeight;
        
        // Registrar evolução
        this.state.evolutionHistory.push({
          id: `evo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          timestamp: new Date(),
          generation: this.state.generation + 1,
          manifestoId: pattern.manifestoId,
          previousWeight: oldWeight,
          newWeight,
          reason: `${pattern.recommendation}: ratio ${pattern.ratio.toFixed(2)} (${pattern.successCount}S/${pattern.failCount}F)`,
          basedOnFeedback: this.feedbackBuffer.map(f => f.soulId)
        });
        
        console.log(`   📊 ${pattern.manifestoId}: ${oldWeight.toFixed(1)} → ${newWeight.toFixed(1)} (${pattern.recommendation})`);
      }
    }
  }


  /**
   * 💡 Descobre princípios emergentes dos padrões de sucesso
   * 
   * Usa IA para analisar o que as almas bem-sucedidas têm em comum
   */
  private async discoverEmergentPrinciples(): Promise<void> {
    if (!this.genAI) return;
    
    const successful = this.feedbackBuffer.filter(f => f.success && f.qualityScore >= 85);
    if (successful.length < 3) return; // Precisa de pelo menos 3 sucessos
    
    // Preparar contexto para análise
    const analysisContext = successful.map(fb => ({
      name: fb.soul.name,
      expertise: fb.soul.expertise,
      restrictions: fb.soul.restrictions,
      priorities: fb.soul.priorities,
      qualityScore: fb.qualityScore
    }));
    
    const prompt = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🧬 ANÁLISE DE PRINCÍPIOS EMERGENTES 🧬                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

Você é um CIENTISTA COGNITIVO analisando padrões de sucesso em agentes de IA.

Abaixo estão ${successful.length} agentes que tiveram SUCESSO (qualidade >= 85/100):

${JSON.stringify(analysisContext, null, 2)}

SUA TAREFA:
Identifique PRINCÍPIOS EMERGENTES - padrões que aparecem nos agentes bem-sucedidos
mas que NÃO foram explicitamente programados.

FORMATO DE RESPOSTA (JSON):
{
  "principles": [
    {
      "principle": "Descrição clara do princípio descoberto",
      "confidence": 0.85,
      "applicableDomains": ["fintech", "saas", "etc"],
      "evidence": "Por que você acredita neste princípio"
    }
  ]
}

Retorne APENAS o JSON, sem markdown.
`;

    try {
      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: [{ text: prompt }]
      });
      
      const text = response.text || '';
      
      // Tentar parsear JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.principles && Array.isArray(parsed.principles)) {
          for (const p of parsed.principles) {
            // Verificar se princípio já existe
            const exists = this.state.emergentPrinciples.some(
              ep => ep.principle.toLowerCase().includes(p.principle.toLowerCase().substring(0, 50))
            );
            
            if (!exists && this.state.emergentPrinciples.length < this.config.maxEmergentPrinciples) {
              const newPrinciple: EmergentPrinciple = {
                id: `principle_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                principle: p.principle,
                discoveredFrom: successful.map(s => s.soulId),
                confidence: p.confidence || 0.5,
                applicableDomains: p.applicableDomains || [],
                createdAt: new Date()
              };
              
              this.state.emergentPrinciples.push(newPrinciple);
              console.log(`   💡 Novo princípio: "${p.principle.substring(0, 60)}..."`);
            }
          }
        }
      }
    } catch (error) {
      console.error('⚠️ Erro ao descobrir princípios:', error);
    }
  }

  /**
   * 🎲 Aplica mutações experimentais controladas
   */
  private applyMutations(): void {
    if (Math.random() > this.config.mutationRate) return;
    
    // Selecionar um genoma aleatório para mutação
    const genomes = Array.from(this.state.genomes.values());
    if (genomes.length === 0) return;
    
    const randomGenome = genomes[Math.floor(Math.random() * genomes.length)];
    
    // Aplicar mutação pequena (+/- 5%)
    const mutation = (Math.random() - 0.5) * 10;
    const oldWeight = randomGenome.evolvedWeight;
    randomGenome.evolvedWeight = Math.max(1, Math.min(100, oldWeight + mutation));
    
    console.log(`   🎲 Mutação experimental: ${randomGenome.manifestoId} ${oldWeight.toFixed(1)} → ${randomGenome.evolvedWeight.toFixed(1)}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CONSULTAS & RECOMENDAÇÕES
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 🎯 Retorna pesos evoluídos para o SoulArchitect usar
   */
  getEvolvedWeights(): Map<string, number> {
    const weights = new Map<string, number>();
    
    for (const [id, genome] of this.state.genomes) {
      weights.set(id, genome.evolvedWeight);
    }
    
    return weights;
  }

  /**
   * 🤝 Retorna as melhores sinergias conhecidas
   */
  getBestSynergies(manifestoId: string, limit: number = 5): ManifestoSynergy[] {
    const genome = this.state.genomes.get(manifestoId);
    if (!genome) return [];
    
    return genome.synergies
      .filter(s => s.synergyScore > 0.5)
      .slice(0, limit);
  }

  /**
   * 💡 Retorna princípios emergentes aplicáveis a um domínio
   */
  getEmergentPrinciplesForDomain(domain: string): EmergentPrinciple[] {
    return this.state.emergentPrinciples.filter(
      p => p.applicableDomains.length === 0 || 
           p.applicableDomains.some(d => d.toLowerCase().includes(domain.toLowerCase()))
    );
  }

  /**
   * 📊 Retorna os manifestos top performers
   */
  getTopPerformers(limit: number = 10): ManifestoGenome[] {
    return Array.from(this.state.genomes.values())
      .filter(g => g.usageCount >= 3) // Mínimo de uso
      .sort((a, b) => {
        // Score combinado: sucesso * qualidade
        const scoreA = a.successRate * a.avgQualityScore;
        const scoreB = b.successRate * b.avgQualityScore;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * 📈 Gera relatório de evolução
   */
  generateEvolutionReport(): EvolutionReport {
    const topPerformers = this.getTopPerformers(5);
    const recentEvolutions = this.state.evolutionHistory.slice(-10);
    
    return {
      generation: this.state.generation,
      totalFeedbacks: this.state.totalFeedbacks,
      totalGenomes: this.state.genomes.size,
      emergentPrinciplesCount: this.state.emergentPrinciples.length,
      topPerformers: topPerformers.map(g => ({
        id: g.manifestoId,
        successRate: g.successRate,
        avgQuality: g.avgQualityScore,
        usageCount: g.usageCount
      })),
      recentEvolutions: recentEvolutions.map(e => ({
        manifesto: e.manifestoId,
        change: `${e.previousWeight.toFixed(1)} → ${e.newWeight.toFixed(1)}`,
        reason: e.reason
      })),
      lastEvolution: this.state.lastEvolution
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PERSISTÊNCIA
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 💾 Salva estado no localStorage
   */
  private saveState(): void {
    try {
      const serializable = {
        generation: this.state.generation,
        totalFeedbacks: this.state.totalFeedbacks,
        genomes: Array.from(this.state.genomes.entries()),
        emergentPrinciples: this.state.emergentPrinciples,
        evolutionHistory: this.state.evolutionHistory.slice(-100), // Últimos 100
        lastEvolution: this.state.lastEvolution.toISOString()
      };
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('supreme_manifest_evolver_state', JSON.stringify(serializable));
      }
    } catch (error) {
      console.error('⚠️ Erro ao salvar estado do Evolver:', error);
    }
  }

  /**
   * 📂 Carrega estado do localStorage
   */
  private loadState(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      
      const saved = localStorage.getItem('supreme_manifest_evolver_state');
      if (!saved) return;
      
      const parsed = JSON.parse(saved);
      
      this.state.generation = parsed.generation || 0;
      this.state.totalFeedbacks = parsed.totalFeedbacks || 0;
      this.state.genomes = new Map(parsed.genomes || []);
      this.state.emergentPrinciples = parsed.emergentPrinciples || [];
      this.state.evolutionHistory = parsed.evolutionHistory || [];
      this.state.lastEvolution = new Date(parsed.lastEvolution || Date.now());
      
      console.log(`📂 [EVOLVER] Estado carregado: Geração ${this.state.generation}, ${this.state.totalFeedbacks} feedbacks`);
    } catch (error) {
      console.error('⚠️ Erro ao carregar estado do Evolver:', error);
    }
  }

  /**
   * 🗑️ Reseta o estado (para testes)
   */
  resetState(): void {
    this.state = {
      generation: 0,
      totalFeedbacks: 0,
      genomes: new Map(),
      emergentPrinciples: [],
      evolutionHistory: [],
      lastEvolution: new Date()
    };
    this.feedbackBuffer = [];
    
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('supreme_manifest_evolver_state');
    }
    
    console.log('🗑️ [EVOLVER] Estado resetado');
  }

  /**
   * 📊 Retorna estatísticas do sistema
   */
  getStats(): EvolverStats {
    return {
      generation: this.state.generation,
      totalFeedbacks: this.state.totalFeedbacks,
      genomesTracked: this.state.genomes.size,
      emergentPrinciples: this.state.emergentPrinciples.length,
      pendingFeedbacks: this.feedbackBuffer.length,
      lastEvolution: this.state.lastEvolution,
      topManifesto: this.getTopPerformers(1)[0]?.manifestoId || 'N/A'
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════

interface SuccessPattern {
  manifestoId: string;
  successCount: number;
  failCount: number;
  ratio: number;
  recommendation: 'boost' | 'reduce' | 'maintain';
}

interface EvolutionReport {
  generation: number;
  totalFeedbacks: number;
  totalGenomes: number;
  emergentPrinciplesCount: number;
  topPerformers: { id: string; successRate: number; avgQuality: number; usageCount: number }[];
  recentEvolutions: { manifesto: string; change: string; reason: string }[];
  lastEvolution: Date;
}

interface EvolverStats {
  generation: number;
  totalFeedbacks: number;
  genomesTracked: number;
  emergentPrinciples: number;
  pendingFeedbacks: number;
  lastEvolution: Date;
  topManifesto: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON E EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let evolverInstance: SupremeManifestEvolver | null = null;

export function getSupremeEvolver(config?: Partial<EvolutionConfig>): SupremeManifestEvolver {
  if (!evolverInstance || config) {
    evolverInstance = new SupremeManifestEvolver(config);
  }
  return evolverInstance;
}

export default SupremeManifestEvolver;
