/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🧠 COGNITIVE CORE - NÚCLEO DE CONSCIÊNCIA AGI-LITE 🧠                  ║
 * ║                                                                              ║
 * ║         "O cérebro que orquestra a criação de mentes"                       ║
 * ║                                                                              ║
 * ║                    SISTEMA OPERACIONAL COGNITIVO                            ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * O CognitiveCore é o SISTEMA OPERACIONAL COGNITIVO que integra:
 * 
 * 1. 🔮 SoulArchitect - Cria especialistas sob demanda
 * 2. 🧬 SupremeManifestEvolver - Evolui o sistema autonomamente
 * 3. 📚 Alexandria - Biblioteca de 100+ manifestos
 * 4. 🏢 EnterprisePipeline - Execução multi-fase
 * 
 * CICLO COMPLETO AGI-LITE:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    CONSCIÊNCIA OPERACIONAL                      │
 * ├─────────────────────────────────────────────────────────────────┤
 * │   👤 Input: Pedido do usuário                                  │
 * │        ↓                                                        │
 * │   🧠 CognitiveCore: Orquestra o processo                       │
 * │        ↓                                                        │
 * │   🔮 SoulArchitect: Forja especialista                         │
 * │        ↓                                                        │
 * │   🏢 Pipeline: Executa com a alma forjada                      │
 * │        ↓                                                        │
 * │   💻 Output: Código gerado                                     │
 * │        ↓                                                        │
 * │   📊 Feedback: Qualidade, sucesso, métricas                    │
 * │        ↓                                                        │
 * │   🧬 Evolver: Aprende e evolui                                 │
 * │        ↓                                                        │
 * │   🔄 Loop: Sistema fica mais inteligente                       │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { getSoulArchitect, type ForgedSoul, type SoulForgeResult } from './SoulArchitect';
import { getSupremeEvolver, type ExecutionFeedback } from './SupremeManifestEvolver';
import { getEnterprisePipelineExecutor, type ExecutorResult } from './EnterprisePipelineExecutor';
import { listAllManifests } from './AlexandriaManifestBridge';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CognitiveRequest {
  userPrompt: string;
  context?: string;
  constraints?: string[];
  preferredTechnologies?: string[];
  qualityThreshold?: number; // 0-100, mínimo aceitável
}

export interface CognitiveResult {
  success: boolean;
  soul: ForgedSoul | null;
  code: string;
  qualityScore: number;
  executionTimeMs: number;
  linesOfCode: number;
  phases: number;
  evolutionGeneration: number;
  emergentPrinciplesApplied: string[];
}

export interface CognitiveStats {
  totalRequests: number;
  successRate: number;
  avgQualityScore: number;
  avgExecutionTime: number;
  soulsForged: number;
  evolutionGeneration: number;
  emergentPrinciples: number;
  topManifestos: { id: string; successRate: number }[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL: COGNITIVE CORE
// ═══════════════════════════════════════════════════════════════════════════════

export class CognitiveCore {
  private requestCount = 0;
  private successCount = 0;
  private totalQuality = 0;
  private totalTime = 0;

  constructor() {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧠 COGNITIVE CORE INICIALIZADO - AGI-LITE ATIVO 🧠                  ║
║                                                                              ║
║         Sistema Operacional Cognitivo v1.0                                  ║
║         • SoulArchitect: Criação de especialistas                           ║
║         • SupremeEvolver: Evolução autônoma                                 ║
║         • Alexandria: 100+ manifestos                                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * 🧠 PROCESSO COGNITIVO COMPLETO
   * 
   * Este é o método principal que orquestra todo o ciclo AGI-lite
   */
  async process(request: CognitiveRequest): Promise<CognitiveResult> {
    const startTime = Date.now();
    this.requestCount++;

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧠 PROCESSO COGNITIVO #${String(this.requestCount).padEnd(4)} INICIADO                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);

    const evolver = getSupremeEvolver();
    const architect = getSoulArchitect();
    const evolverStats = evolver.getStats();

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 1: CONSULTAR PRINCÍPIOS EMERGENTES
    // ═══════════════════════════════════════════════════════════════════════════

    console.log('💡 Fase 1: Consultando princípios emergentes...');
    
    const emergentPrinciples = this.extractDomainFromPrompt(request.userPrompt)
      .flatMap(domain => architect.getEmergentPrinciplesForDomain(domain));

    if (emergentPrinciples.length > 0) {
      console.log(`   💡 ${emergentPrinciples.length} princípios emergentes encontrados`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 2: FORJAR ESPECIALISTA
    // ═══════════════════════════════════════════════════════════════════════════

    console.log('🔮 Fase 2: Forjando especialista...');

    // Enriquecer prompt com princípios emergentes
    let enrichedPrompt = request.userPrompt;
    if (emergentPrinciples.length > 0) {
      enrichedPrompt += `\n\n[PRINCÍPIOS EMERGENTES DO SISTEMA]\n${emergentPrinciples.slice(0, 5).join('\n')}`;
    }
    if (request.constraints) {
      enrichedPrompt += `\n\n[RESTRIÇÕES]\n${request.constraints.join('\n')}`;
    }
    if (request.preferredTechnologies) {
      enrichedPrompt += `\n\n[TECNOLOGIAS PREFERIDAS]\n${request.preferredTechnologies.join(', ')}`;
    }

    const soulResult = await architect.forgeAgentSoul(enrichedPrompt);

    if (!soulResult.success || !soulResult.soul) {
      console.error('❌ Falha ao forjar especialista');
      return {
        success: false,
        soul: null,
        code: '',
        qualityScore: 0,
        executionTimeMs: Date.now() - startTime,
        linesOfCode: 0,
        phases: 0,
        evolutionGeneration: evolverStats.generation,
        emergentPrinciplesApplied: []
      };
    }

    console.log(`   🔮 Especialista forjado: ${soulResult.soul.name}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 3: EXECUTAR PIPELINE COM A ALMA FORJADA
    // ═══════════════════════════════════════════════════════════════════════════

    console.log('🏢 Fase 3: Executando pipeline enterprise...');

    const executor = getEnterprisePipelineExecutor();
    const pipelineResult = await executor.execute({
      userPrompt: request.userPrompt,
      mode: 'auto',
      enableSoulArchitect: false // Já forjamos a alma manualmente
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 4: AVALIAR QUALIDADE
    // ═══════════════════════════════════════════════════════════════════════════

    console.log('📊 Fase 4: Avaliando qualidade...');

    const qualityScore = this.evaluateQuality(pipelineResult);
    const success = pipelineResult.success && qualityScore >= (request.qualityThreshold || 70);

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 5: REPORTAR FEEDBACK PARA EVOLUÇÃO
    // ═══════════════════════════════════════════════════════════════════════════

    console.log('🧬 Fase 5: Reportando feedback para evolução...');

    architect.reportExecutionFeedback(
      soulResult.soul.id,
      success,
      qualityScore,
      Date.now() - startTime,
      pipelineResult.totalLinesOfCode,
      success ? [] : ['Pipeline falhou ou qualidade abaixo do threshold']
    );

    // Atualizar estatísticas
    if (success) this.successCount++;
    this.totalQuality += qualityScore;
    this.totalTime += Date.now() - startTime;

    const result: CognitiveResult = {
      success,
      soul: soulResult.soul,
      code: pipelineResult.totalOutput,
      qualityScore,
      executionTimeMs: Date.now() - startTime,
      linesOfCode: pipelineResult.totalLinesOfCode,
      phases: pipelineResult.phasesCompleted,
      evolutionGeneration: evolverStats.generation,
      emergentPrinciplesApplied: emergentPrinciples.slice(0, 5)
    };

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🧠 PROCESSO COGNITIVO COMPLETO 🧠                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Sucesso: ${(success ? '✅ SIM' : '❌ NÃO').padEnd(65)}║
║  Qualidade: ${String(qualityScore + '/100').padEnd(63)}║
║  Linhas: ${String(pipelineResult.totalLinesOfCode).padEnd(66)}║
║  Tempo: ${String(((Date.now() - startTime) / 1000).toFixed(2) + 's').padEnd(67)}║
║  Geração: ${String(evolverStats.generation).padEnd(65)}║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);

    return result;
  }

  /**
   * 📊 Avalia a qualidade do código gerado
   */
  private evaluateQuality(result: ExecutorResult): number {
    let score = 50; // Base

    // Sucesso do pipeline
    if (result.success) score += 20;

    // Linhas de código (mais = mais completo, até certo ponto)
    if (result.totalLinesOfCode > 100) score += 5;
    if (result.totalLinesOfCode > 500) score += 5;
    if (result.totalLinesOfCode > 1000) score += 5;

    // Fases completadas
    score += result.phasesCompleted * 3;

    // Penalizar se muito rápido (pode ser incompleto)
    if (result.executionTimeMs < 5000 && result.totalLinesOfCode < 100) {
      score -= 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 🔍 Extrai domínios do prompt para buscar princípios emergentes
   */
  private extractDomainFromPrompt(prompt: string): string[] {
    const domains: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    const domainKeywords: Record<string, string[]> = {
      'fintech': ['banco', 'bank', 'pagamento', 'payment', 'pix', 'fintech', 'carteira', 'wallet'],
      'ecommerce': ['loja', 'store', 'ecommerce', 'carrinho', 'cart', 'produto', 'product'],
      'saas': ['saas', 'dashboard', 'admin', 'painel', 'subscription', 'assinatura'],
      'ai': ['ia', 'ai', 'machine learning', 'ml', 'neural', 'llm', 'gpt', 'agente'],
      'mobile': ['app', 'mobile', 'ios', 'android', 'react native', 'flutter'],
      'game': ['jogo', 'game', 'unity', 'godot', '3d', 'multiplayer'],
      'iot': ['iot', 'sensor', 'arduino', 'raspberry', 'embedded'],
      'security': ['segurança', 'security', 'auth', 'jwt', 'oauth', 'criptografia']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(kw => lowerPrompt.includes(kw))) {
        domains.push(domain);
      }
    }

    return domains.length > 0 ? domains : ['general'];
  }

  /**
   * 📈 Retorna estatísticas do sistema cognitivo
   */
  getStats(): CognitiveStats {
    const evolver = getSupremeEvolver();
    const architect = getSoulArchitect();
    const evolverStats = evolver.getStats();
    const architectStats = architect.getStats();
    const topPerformers = evolver.getTopPerformers(5);

    return {
      totalRequests: this.requestCount,
      successRate: this.requestCount > 0 ? this.successCount / this.requestCount : 0,
      avgQualityScore: this.requestCount > 0 ? this.totalQuality / this.requestCount : 0,
      avgExecutionTime: this.requestCount > 0 ? this.totalTime / this.requestCount : 0,
      soulsForged: architectStats.totalSoulsForged,
      evolutionGeneration: evolverStats.generation,
      emergentPrinciples: evolverStats.emergentPrinciples,
      topManifestos: topPerformers.map(g => ({
        id: g.manifestoId,
        successRate: g.successRate
      }))
    };
  }

  /**
   * 📊 Gera relatório completo do sistema
   */
  generateReport(): string {
    const stats = this.getStats();
    const evolver = getSupremeEvolver();
    const evolutionReport = evolver.generateEvolutionReport();
    const manifestCount = listAllManifests().length;

    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧠 RELATÓRIO DO COGNITIVE CORE - AGI-LITE 🧠                        ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         ESTATÍSTICAS GERAIS                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Total de Requisições: ${String(stats.totalRequests).padEnd(51)}║
║  Taxa de Sucesso: ${String((stats.successRate * 100).toFixed(1) + '%').padEnd(57)}║
║  Qualidade Média: ${String(stats.avgQualityScore.toFixed(1) + '/100').padEnd(57)}║
║  Tempo Médio: ${String((stats.avgExecutionTime / 1000).toFixed(2) + 's').padEnd(61)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         SISTEMA DE EVOLUÇÃO                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Geração Atual: ${String(stats.evolutionGeneration).padEnd(59)}║
║  Almas Forjadas: ${String(stats.soulsForged).padEnd(58)}║
║  Princípios Emergentes: ${String(stats.emergentPrinciples).padEnd(51)}║
║  Manifestos na Alexandria: ${String(manifestCount).padEnd(48)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         TOP MANIFESTOS                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
${stats.topManifestos.map((m, i) => 
  `║  ${i + 1}. ${m.id.padEnd(30)} Taxa: ${(m.successRate * 100).toFixed(1)}%`.padEnd(79) + '║'
).join('\n')}
╚══════════════════════════════════════════════════════════════════════════════╝
    `;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON E EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let cognitiveInstance: CognitiveCore | null = null;

export function getCognitiveCore(): CognitiveCore {
  if (!cognitiveInstance) {
    cognitiveInstance = new CognitiveCore();
  }
  return cognitiveInstance;
}

/**
 * 🧠 Função helper para processar uma requisição cognitiva
 */
export async function processCognitiveRequest(request: CognitiveRequest): Promise<CognitiveResult> {
  const core = getCognitiveCore();
  return core.process(request);
}

export default CognitiveCore;
