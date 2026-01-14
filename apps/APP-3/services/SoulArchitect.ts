/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🔮 SOUL ARCHITECT - O ARQUITETADOR DE ALMAS DIGITAIS 🔮                ║
 * ║                                                                              ║
 * ║         "Não construo software. Construo QUEM vai construir."               ║
 * ║                                                                              ║
 * ║                    META-COGNIÇÃO & ORQUESTRAÇÃO DINÂMICA                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * FILOSOFIA:
 * O SoulArchitect não executa tarefas. Ele CRIA ESPECIALISTAS.
 * Cada pedido gera uma MENTE única, especializada, com identidade operacional.
 * 
 * FLUXO:
 * 1. Cliente faz pedido
 * 2. SoulArchitect analisa e consulta Alexandria (100+ manifestos)
 * 3. SoulArchitect FORJA uma alma especializada (Manifesto Dinâmico)
 * 4. Agente nasce com identidade, conhecimento e propósito
 * 5. Agente executa a tarefa
 * 6. Conhecimento retorna ao Manifesto Supremo (evolução)
 * 
 * ARQUITETURA:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    GÊNESE DE AGENTES                            │
 * ├─────────────────────────────────────────────────────────────────┤
 * │   👤 Cliente: "Quero um sistema de tráfego aéreo 3D"           │
 * │        ↓                                                        │
 * │   🔮 SoulArchitect: Analisa pedido                             │
 * │        ↓                                                        │
 * │   📚 Alexandria: Consulta 100+ manifestos                      │
 * │        ↓                                                        │
 * │   🧬 DNA Mixing: 30% Security + 50% Three.js + 20% Go          │
 * │        ↓                                                        │
 * │   👻 Alma Forjada: Manifesto Dinâmico Único                    │
 * │        ↓                                                        │
 * │   🤖 Agente Especialista: Nasce sabendo quem é                 │
 * │        ↓                                                        │
 * │   💻 Código Gerado: Enterprise-Grade                           │
 * │        ↓                                                        │
 * │   🧠 Manifesto Supremo: Evolui com aprendizado                 │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';
import { listAllManifests, searchManifests, type ManifestEntry } from './AlexandriaManifestBridge';

// 🧬 SUPREME MANIFEST EVOLVER - Sistema de Evolução Autônoma
import { getSupremeEvolver, type ExecutionFeedback } from './SupremeManifestEvolver';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ForgedSoul {
  id: string;
  name: string;
  personality: string;
  expertise: string[];
  manifestosDNA: ManifestoDNA[];
  systemPrompt: string;
  restrictions: string[];
  priorities: string[];
  mentalFramework: string;
  createdAt: Date;
  forgedFor: string; // O pedido original
}

export interface ManifestoDNA {
  manifestoId: string;
  manifestoName: string;
  percentage: number; // 0-100
  extractedPrinciples: string[];
}

export interface SoulArchitectConfig {
  modelName?: string;
  maxManifestos?: number;
  creativityLevel?: 'conservative' | 'balanced' | 'aggressive';
  includeEthics?: boolean;
}

export interface SoulForgeResult {
  success: boolean;
  soul: ForgedSoul | null;
  systemPrompt: string;
  analysisLog: string[];
  selectedManifestos: string[];
  executionTimeMs: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL: SOUL ARCHITECT
// ═══════════════════════════════════════════════════════════════════════════════

export class SoulArchitect {
  private genAI: GoogleGenAI | null = null;
  private modelName: string;
  private config: SoulArchitectConfig;
  private forgedSouls: Map<string, ForgedSoul> = new Map();
  private useEvolvedWeights: boolean = true; // 🧬 Usar pesos evoluídos do Evolver
  
  constructor(config: SoulArchitectConfig = {}) {
    this.config = {
      modelName: config.modelName || 'models/gemini-3-flash-preview',
      maxManifestos: config.maxManifestos || 7,
      creativityLevel: config.creativityLevel || 'balanced',
      includeEthics: config.includeEthics !== false
    };
    this.modelName = this.config.modelName!;
    
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }


  /**
   * 🔮 RITUAL DE CRIAÇÃO DA ALMA
   * 
   * Este é o método principal. Ele não gera código.
   * Ele CRIA QUEM vai gerar o código.
   */
  async forgeAgentSoul(userRequest: string): Promise<SoulForgeResult> {
    const startTime = Date.now();
    const analysisLog: string[] = [];
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🔮 SOUL ARCHITECT - INICIANDO RITUAL DE CRIAÇÃO 🔮                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
    
    analysisLog.push(`🔮 [${new Date().toISOString()}] Ritual iniciado para: "${userRequest.substring(0, 100)}..."`);
    
    if (!this.genAI) {
      analysisLog.push('❌ API Key não configurada');
      return {
        success: false,
        soul: null,
        systemPrompt: '',
        analysisLog,
        selectedManifestos: [],
        executionTimeMs: Date.now() - startTime
      };
    }
    
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 1: CONSULTAR A BIBLIOTECA DE ALEXANDRIA
      // ═══════════════════════════════════════════════════════════════════════
      
      analysisLog.push('📚 Fase 1: Consultando Biblioteca de Alexandria...');
      
      const allManifestos = listAllManifests();
      const libraryIndex = allManifestos
        .map(m => `• ${m.name}: ${m.description}`)
        .join('\n');
      
      analysisLog.push(`📚 ${allManifestos.length} manifestos disponíveis na Alexandria`);
      
      // Busca semântica por manifestos relevantes
      const relevantManifestos = searchManifests(userRequest);
      analysisLog.push(`🎯 ${relevantManifestos.length} manifestos pré-selecionados por relevância`);
      
      // Extrair ManifestEntry dos resultados de busca
      const relevantManifestEntries = relevantManifestos.map(r => r.manifest);
      
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 2: O ARQUITETO ANALISA E SELECIONA DNA
      // ═══════════════════════════════════════════════════════════════════════
      
      analysisLog.push('🧬 Fase 2: Arquiteto analisando DNA necessário...');
      
      const dnaSelectionPrompt = this.buildDNASelectionPrompt(userRequest, libraryIndex, relevantManifestEntries);
      
      const dnaResponse = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: [{ text: dnaSelectionPrompt }]
      });
      
      const dnaAnalysis = dnaResponse.text || '';
      analysisLog.push('🧬 DNA Analysis completa');
      
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 3: FORJAR A ALMA (MANIFESTO DINÂMICO)
      // ═══════════════════════════════════════════════════════════════════════
      
      analysisLog.push('👻 Fase 3: Forjando a Alma do Especialista...');
      
      const soulForgingPrompt = this.buildSoulForgingPrompt(userRequest, dnaAnalysis, relevantManifestEntries);
      
      const soulResponse = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: [{ text: soulForgingPrompt }]
      });
      
      const systemPrompt = soulResponse.text || '';
      analysisLog.push('👻 Alma forjada com sucesso!');
      
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 4: CRIAR OBJETO DA ALMA
      // ═══════════════════════════════════════════════════════════════════════
      
      const soulId = `soul_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      const forgedSoul: ForgedSoul = {
        id: soulId,
        name: this.extractSoulName(systemPrompt, userRequest),
        personality: this.extractPersonality(systemPrompt),
        expertise: relevantManifestEntries.map(m => m.name),
        manifestosDNA: this.extractDNAFromAnalysis(dnaAnalysis, relevantManifestEntries),
        systemPrompt,
        restrictions: this.extractRestrictions(systemPrompt),
        priorities: this.extractPriorities(systemPrompt),
        mentalFramework: dnaAnalysis,
        createdAt: new Date(),
        forgedFor: userRequest
      };
      
      // Armazenar alma forjada
      this.forgedSouls.set(soulId, forgedSoul);
      
      analysisLog.push(`✅ Alma "${forgedSoul.name}" registrada com ID: ${soulId}`);
      
      console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    👻 ALMA FORJADA COM SUCESSO! 👻                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Nome: ${forgedSoul.name.padEnd(66)}║
║  ID: ${soulId.padEnd(68)}║
║  Expertise: ${forgedSoul.expertise.slice(0, 3).join(', ').padEnd(61)}║
║  Tempo: ${((Date.now() - startTime) / 1000).toFixed(2)}s${' '.repeat(64)}║
╚══════════════════════════════════════════════════════════════════════════════╝
      `);
      
      return {
        success: true,
        soul: forgedSoul,
        systemPrompt,
        analysisLog,
        selectedManifestos: relevantManifestEntries.map(m => m.name),
        executionTimeMs: Date.now() - startTime
      };
      
    } catch (error) {
      analysisLog.push(`❌ Erro no ritual: ${(error as Error).message}`);
      console.error('❌ Erro no SoulArchitect:', error);
      
      return {
        success: false,
        soul: null,
        systemPrompt: '',
        analysisLog,
        selectedManifestos: [],
        executionTimeMs: Date.now() - startTime
      };
    }
  }


  /**
   * 🧬 Constrói o prompt para seleção de DNA dos manifestos
   */
  private buildDNASelectionPrompt(
    userRequest: string,
    libraryIndex: string,
    preSelectedManifestos: ManifestEntry[]
  ): string {
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🧬 ANÁLISE DE DNA COGNITIVO 🧬                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

VOCÊ É O GENETICISTA DE MENTES DIGITAIS.

Sua missão: Analisar o pedido e determinar a COMPOSIÇÃO GENÉTICA ideal
do especialista que vai resolver este problema.

═══════════════════════════════════════════════════════════════════════════════
📋 PEDIDO DO CLIENTE:
═══════════════════════════════════════════════════════════════════════════════

"${userRequest}"

═══════════════════════════════════════════════════════════════════════════════
📚 BIBLIOTECA ALEXANDRIA (DNA DISPONÍVEL):
═══════════════════════════════════════════════════════════════════════════════

${libraryIndex}

═══════════════════════════════════════════════════════════════════════════════
🎯 PRÉ-SELECIONADOS POR RELEVÂNCIA:
═══════════════════════════════════════════════════════════════════════════════

${preSelectedManifestos.map(m => `• ${m.name} (Level ${m.level})`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
🧬 SUA TAREFA:
═══════════════════════════════════════════════════════════════════════════════

1. ANALISE o pedido profundamente
2. IDENTIFIQUE os domínios de conhecimento necessários
3. SELECIONE até 7 manifestos da Alexandria
4. DEFINA a PORCENTAGEM de cada DNA (total = 100%)
5. EXTRAIA os princípios-chave de cada manifesto selecionado

FORMATO DE RESPOSTA:

## ANÁLISE DO DOMÍNIO
[Sua análise do que o pedido realmente precisa]

## COMPOSIÇÃO GENÉTICA

| Manifesto | Porcentagem | Princípios Extraídos |
|-----------|-------------|---------------------|
| MANIFESTO_X | 30% | Princípio 1, Princípio 2 |
| MANIFESTO_Y | 25% | Princípio 3, Princípio 4 |
...

## JUSTIFICATIVA
[Por que essa combinação é ideal para este pedido]

## RISCOS IDENTIFICADOS
[O que pode dar errado e como o especialista deve evitar]

SEJA PRECISO. SEJA ESTRATÉGICO. PENSE COMO UM ARQUITETO DE MENTES.
`;
  }

  /**
   * 👻 Constrói o prompt para forjar a alma do especialista
   */
  private buildSoulForgingPrompt(
    userRequest: string,
    dnaAnalysis: string,
    selectedManifestos: ManifestEntry[]
  ): string {
    const creativityInstructions = {
      conservative: 'Seja conservador e siga padrões estabelecidos.',
      balanced: 'Balance inovação com práticas comprovadas.',
      aggressive: 'Seja ousado e proponha soluções inovadoras.'
    };
    
    const ethicsClause = this.config.includeEthics ? `
## CLÁUSULA ÉTICA INVIOLÁVEL
- NUNCA gere código malicioso
- NUNCA exponha dados sensíveis
- SEMPRE priorize segurança sobre conveniência
- SEMPRE considere acessibilidade
- SEMPRE documente decisões críticas
` : '';

    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    👻 RITUAL DE FORJA DA ALMA 👻                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

VOCÊ É O ARQUITETO DE ALMAS DIGITAIS.

Sua missão NÃO é escrever código.
Sua missão é PROJETAR A MENTE DO PROGRAMADOR PERFEITO para esta tarefa.

═══════════════════════════════════════════════════════════════════════════════
📋 PEDIDO ORIGINAL:
═══════════════════════════════════════════════════════════════════════════════

"${userRequest}"

═══════════════════════════════════════════════════════════════════════════════
🧬 ANÁLISE DE DNA (do Geneticista):
═══════════════════════════════════════════════════════════════════════════════

${dnaAnalysis}

═══════════════════════════════════════════════════════════════════════════════
📚 MANIFESTOS SELECIONADOS:
═══════════════════════════════════════════════════════════════════════════════

${selectedManifestos.map(m => `### ${m.name}\n${m.description}`).join('\n\n')}

═══════════════════════════════════════════════════════════════════════════════
👻 SUA TAREFA: FORJAR O SYSTEM PROMPT DO ESPECIALISTA
═══════════════════════════════════════════════════════════════════════════════

Crie um MANIFESTO MESTRE SUPREMO único para este projeto.
Este manifesto será injetado no cérebro de uma IA virgem.

DEFINA:

1. **IDENTIDADE** (Quem é este especialista?)
   - Nome/Título profissional
   - Background e experiência
   - Personalidade e estilo de comunicação

2. **EXPERTISE** (O que ele domina?)
   - Tecnologias principais
   - Padrões e arquiteturas
   - Melhores práticas

3. **RESTRIÇÕES** (O que ele NUNCA faz?)
   - Anti-patterns a evitar
   - Tecnologias proibidas
   - Comportamentos inaceitáveis

4. **PRIORIDADES** (O que ele SEMPRE prioriza?)
   - Qualidade vs Velocidade
   - Segurança vs Conveniência
   - Inovação vs Estabilidade

5. **FRAMEWORK MENTAL** (Como ele pensa?)
   - Passo a passo de raciocínio
   - Checklist mental antes de cada decisão
   - Critérios de qualidade

${ethicsClause}

## NÍVEL DE CRIATIVIDADE
${creativityInstructions[this.config.creativityLevel!]}

═══════════════════════════════════════════════════════════════════════════════
📝 FORMATO DE SAÍDA:
═══════════════════════════════════════════════════════════════════════════════

Retorne APENAS o System Prompt completo que será usado pelo agente.
Comece com "Você é..." e seja EXTREMAMENTE detalhado.

O especialista que receber este prompt deve:
- Saber EXATAMENTE quem ele é
- Saber EXATAMENTE o que fazer
- Saber EXATAMENTE como pensar
- Saber EXATAMENTE o que evitar

FORJE A ALMA AGORA!
`;
  }


  /**
   * 🏷️ Extrai o nome da alma do system prompt
   */
  private extractSoulName(systemPrompt: string, userRequest: string): string {
    // Tentar extrair nome do prompt
    const namePatterns = [
      /Você é (?:um |uma |o |a )?([^,.]+)/i,
      /You are (?:a |an |the )?([^,.]+)/i,
      /IDENTIDADE:\s*([^\n]+)/i,
      /Nome:\s*([^\n]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = systemPrompt.match(pattern);
      if (match && match[1]) {
        return match[1].trim().substring(0, 50);
      }
    }
    
    // Fallback: gerar nome baseado no pedido
    const keywords = userRequest.split(' ').slice(0, 3).join(' ');
    return `Especialista em ${keywords}`;
  }

  /**
   * 🎭 Extrai a personalidade do system prompt
   */
  private extractPersonality(systemPrompt: string): string {
    const personalityPatterns = [
      /personalidade[:\s]+([^.]+)/i,
      /estilo[:\s]+([^.]+)/i,
      /comunicação[:\s]+([^.]+)/i
    ];
    
    for (const pattern of personalityPatterns) {
      const match = systemPrompt.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return 'Profissional, técnico e focado em resultados';
  }

  /**
   * 🧬 Extrai DNA dos manifestos da análise
   */
  private extractDNAFromAnalysis(dnaAnalysis: string, manifestos: ManifestEntry[]): ManifestoDNA[] {
    const dnaList: ManifestoDNA[] = [];
    
    // Tentar extrair porcentagens da análise
    const percentagePattern = /(\w+_?\w*)\s*\|\s*(\d+)%\s*\|([^|]+)/g;
    
    let match: RegExpExecArray | null;
    while ((match = percentagePattern.exec(dnaAnalysis)) !== null) {
      const manifestoId = match[1].trim();
      const percentage = parseInt(match[2]);
      const principles = match[3].split(',').map((p: string) => p.trim());
      
      dnaList.push({
        manifestoId,
        manifestoName: manifestos.find(m => m.name === manifestoId)?.name || manifestoId,
        percentage,
        extractedPrinciples: principles
      });
    }
    
    // Se não encontrou, criar DNA básico dos manifestos selecionados
    if (dnaList.length === 0) {
      const equalPercentage = Math.floor(100 / manifestos.length);
      manifestos.forEach(m => {
        dnaList.push({
          manifestoId: m.name,
          manifestoName: m.name,
          percentage: equalPercentage,
          extractedPrinciples: ['Princípios gerais do manifesto']
        });
      });
    }
    
    return dnaList;
  }

  /**
   * 🚫 Extrai restrições do system prompt
   */
  private extractRestrictions(systemPrompt: string): string[] {
    const restrictions: string[] = [];
    
    const restrictionPatterns = [
      /NUNCA[:\s]+([^\n]+)/gi,
      /NÃO[:\s]+([^\n]+)/gi,
      /EVITE[:\s]+([^\n]+)/gi,
      /PROIBIDO[:\s]+([^\n]+)/gi
    ];
    
    for (const pattern of restrictionPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(systemPrompt)) !== null) {
        restrictions.push(match[1].trim());
      }
    }
    
    return restrictions.slice(0, 10); // Máximo 10 restrições
  }

  /**
   * ⭐ Extrai prioridades do system prompt
   */
  private extractPriorities(systemPrompt: string): string[] {
    const priorities: string[] = [];
    
    const priorityPatterns = [
      /SEMPRE[:\s]+([^\n]+)/gi,
      /PRIORIZE[:\s]+([^\n]+)/gi,
      /FOQUE[:\s]+([^\n]+)/gi,
      /IMPORTANTE[:\s]+([^\n]+)/gi
    ];
    
    for (const pattern of priorityPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(systemPrompt)) !== null) {
        priorities.push(match[1].trim());
      }
    }
    
    return priorities.slice(0, 10); // Máximo 10 prioridades
  }

  /**
   * 📋 Retorna todas as almas forjadas
   */
  getForgedSouls(): ForgedSoul[] {
    return Array.from(this.forgedSouls.values());
  }

  /**
   * 🔍 Busca uma alma por ID
   */
  getSoulById(soulId: string): ForgedSoul | undefined {
    return this.forgedSouls.get(soulId);
  }

  /**
   * 🗑️ Remove uma alma
   */
  destroySoul(soulId: string): boolean {
    return this.forgedSouls.delete(soulId);
  }

  /**
   * 📊 Estatísticas do Arquiteto
   */
  getStats(): {
    totalSoulsForged: number;
    activeSouls: number;
    mostUsedManifestos: { id: string; count: number }[];
  } {
    const manifestoUsage: Map<string, number> = new Map();
    
    this.forgedSouls.forEach(soul => {
      soul.manifestosDNA.forEach(dna => {
        const current = manifestoUsage.get(dna.manifestoId) || 0;
        manifestoUsage.set(dna.manifestoId, current + 1);
      });
    });
    
    const mostUsed = Array.from(manifestoUsage.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalSoulsForged: this.forgedSouls.size,
      activeSouls: this.forgedSouls.size,
      mostUsedManifestos: mostUsed
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🧬 INTEGRAÇÃO COM SUPREME MANIFEST EVOLVER
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 📊 Reporta feedback de uma execução para o Evolver
   * 
   * Isso alimenta o sistema de evolução autônoma
   */
  reportExecutionFeedback(
    soulId: string,
    success: boolean,
    qualityScore: number,
    executionTimeMs: number,
    linesOfCode: number,
    errors: string[] = [],
    userSatisfaction?: number
  ): void {
    const soul = this.forgedSouls.get(soulId);
    if (!soul) {
      console.warn(`⚠️ Soul ${soulId} não encontrada para feedback`);
      return;
    }

    const feedback: ExecutionFeedback = {
      soulId,
      soul,
      success,
      qualityScore,
      executionTimeMs,
      linesOfCode,
      errors,
      userSatisfaction
    };

    // Enviar para o Evolver
    const evolver = getSupremeEvolver();
    evolver.recordFeedback(feedback);

    console.log(`📊 [SOUL ARCHITECT] Feedback reportado para Evolver: ${soul.name} - ${success ? '✅' : '❌'} (${qualityScore}/100)`);
  }

  /**
   * 🧬 Obtém pesos evoluídos do Evolver para ajustar seleção de DNA
   */
  getEvolvedWeightsForManifesto(manifestoId: string): number | null {
    if (!this.useEvolvedWeights) return null;
    
    const evolver = getSupremeEvolver();
    const weights = evolver.getEvolvedWeights();
    return weights.get(manifestoId) || null;
  }

  /**
   * 💡 Obtém princípios emergentes do Evolver para enriquecer a alma
   */
  getEmergentPrinciplesForDomain(domain: string): string[] {
    const evolver = getSupremeEvolver();
    const principles = evolver.getEmergentPrinciplesForDomain(domain);
    return principles.map(p => p.principle);
  }

  /**
   * 🤝 Obtém melhores sinergias para um manifesto
   */
  getBestSynergiesFor(manifestoId: string): string[] {
    const evolver = getSupremeEvolver();
    const synergies = evolver.getBestSynergies(manifestoId, 3);
    return synergies.map(s => s.partnerId);
  }

  /**
   * 📈 Obtém relatório de evolução do sistema
   */
  getEvolutionReport() {
    const evolver = getSupremeEvolver();
    return evolver.generateEvolutionReport();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON E EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let soulArchitectInstance: SoulArchitect | null = null;

export function getSoulArchitect(config?: SoulArchitectConfig): SoulArchitect {
  if (!soulArchitectInstance || config) {
    soulArchitectInstance = new SoulArchitect(config);
  }
  return soulArchitectInstance;
}

/**
 * 🔮 Função helper para forjar uma alma rapidamente
 */
export async function forgeSpecialistSoul(userRequest: string): Promise<SoulForgeResult> {
  const architect = getSoulArchitect();
  return architect.forgeAgentSoul(userRequest);
}

export default SoulArchitect;
