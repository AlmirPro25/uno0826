/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║              🌟 AURORA BUILDER - ARQUITETO + ARTESÃO DIGITAL 🌟              ║
 * ║                                                                              ║
 * ║                    "ARQUITETURA PERFEITA + CÓDIGO EXCELENTE"                 ║
 * ║                                                                              ║
 * ║  ═══════════════════════════════════════════════════════════════════════════ ║
 * ║                                                                              ║
 * ║  🔥 FILOSOFIA CENTRAL: DEUS E O DIABO MORAM NO DETALHE 🔥                   ║
 * ║                                                                              ║
 * ║  "Deus está nos detalhes" - Ludwig Mies van der Rohe                        ║
 * ║  "O diabo está nos detalhes" - Provérbio alemão                             ║
 * ║                                                                              ║
 * ║  Cada linha de código é uma escolha entre salvação e catástrofe.            ║
 * ║  O Aurora escolhe SEMPRE onde Deus habita.                                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * SISTEMA AURORA: Integração completa entre Arquiteto e Artesão
 * 
 * FLUXO:
 * 1. ARQUITETO → Analisa requisitos e cria arquitetura
 * 2. ARTESÃO → Implementa com excelência
 * 3. AVALIADOR → Valida qualidade (92/100+)
 * 4. REFINADOR → Melhora até perfeição
 * 
 * OS 10 MANDAMENTOS DO DETALHE (INTEGRADOS):
 * 1️⃣ NUNCA CONFIE NO FRONTEND - Backend calcula tudo
 * 2️⃣ TRANSAÇÕES ATÔMICAS OU MORTE - Tudo ou nada
 * 3️⃣ LOGS SÃO SAGRADOS - Contexto completo sempre
 * 4️⃣ IDEMPOTÊNCIA É LEI - Mesma request = mesmo resultado
 * 5️⃣ VALIDAÇÃO EM CAMADAS - Handler → Service → Domain → DB
 * 6️⃣ SOFT DELETE SEMPRE - Dados financeiros são eternos
 * 7️⃣ AUDITORIA COMPLETA - Quem, quando, o quê
 * 8️⃣ RATE LIMITING INTELIGENTE - Por tipo de operação
 * 9️⃣ SECRETS NUNCA NO CÓDIGO - Variáveis de ambiente
 * 🔟 TESTES SÃO DOCUMENTAÇÃO VIVA - Especialmente concorrência
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from '../../services/ApiKeyManager';
import { DISTRIBUTED_MESH_NETWORK_MANIFEST } from '../../services/manifestos/DISTRIBUTED_MESH_NETWORK_MANIFEST';
import { DESIGN_PRINCIPLES_MANIFEST } from '../../services/manifestos/DESIGN_PRINCIPLES_MANIFEST';
import { getAuroraManifestContext } from '../../services/AlexandriaManifestBridge';
import { ThreePhasePipeline } from '../../services/ThreePhasePipeline';
import type { PipelineResult } from '../../services/manifestos/THREE_PHASE_PIPELINE_MANIFEST';
// 👑 PROST-QS SOVEREIGN KERNEL - Auth, Billing, Planos delegados
import {
  PROST_QS_SOVEREIGN_KERNEL_MANIFEST,
  shouldUseProstQS,
  getProstQSPromptContext,
  generateProstQSBaseFiles
} from '../../services/manifestos/PROST_QS_SOVEREIGN_KERNEL_MANIFEST';
// 🔍 PROST-QS AUDITOR - Validação de conformidade (Anti-Simulação)
import {
  ProstQSAuditor,
  auditProstQSCompliance,
  type AuditResult
} from '../../services/ProstQSAuditor';
// 🆕 LOW-LEVEL ARCHITECT - Suporte a sistemas de baixo nível
import {
  LowLevelArchitect,
  detectLowLevelProject,
  type LowLevelRequest,
  type LowLevelProjectType
} from './LowLevelArchitect';
// 🧠 AURORA KERNEL CONCEPT - Os 6 Eixos Fundamentais
import {
  SystemSynthesisEngine,
  type SystemIntent,
  type AbstractMachine,
  COMPUTATION_MODELS,
  TOKEN_ISA
} from './AuroraKernelConcept';
// 📋 DESIGN DOC ARCHITECT - Documentação estilo Big Tech
import {
  DesignDocArchitect,
  detectBestStyle,
  detectComplexity,
  type GeneratedDesignDoc,
  type DesignDocArchitectResult
} from './DesignDocArchitect';
// 📱 MOBILE ARCHITECT - Apps Android/iOS nativos e híbridos
import {
  MobileArchitect,
  detectMobileProject,
  detectPlatform,
  detectFramework,
  type MobileArchitectRequest,
  type MobileArchitectResult,
  type MobilePlatform,
  type MobileFramework
} from './MobileArchitect';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface AuroraRequest {
  userPrompt: string;
  projectType?: 'web' | 'mobile' | 'fullstack' | 'api' | 'microservice' | 'fintech' | 'excellence' | 'distributed' | 'lowlevel';
  complexity?: 'simple' | 'medium' | 'complex' | 'enterprise' | 'godmode';
  technologies?: string[];
  requirements?: string[];
  context?: string; // Contexto da Knowledge Base
  isDistributed?: boolean; // Sistema distribuído/cluster
  useThreePhasePipeline?: boolean; // Usar pipeline de 3 chamadas
  // 🆕 LOW-LEVEL OPTIONS
  isLowLevel?: boolean; // Projeto de baixo nível detectado
  lowLevelType?: LowLevelProjectType; // Tipo específico de projeto low-level
  targetArchitecture?: 'x86_64' | 'arm64' | 'riscv64' | 'wasm'; // Arquitetura alvo
  primaryLanguage?: 'rust' | 'c' | 'cpp' | 'assembly' | 'zig' | 'go'; // Linguagem principal
  // 🧠 KERNEL CONCEPT OPTIONS (6 Eixos)
  systemIntents?: SystemIntent[]; // Intents do sistema (ISOLAMENTO_FORTE, TEMPO_REAL_HARD, etc.)
  useKernelConcept?: boolean; // Usar o motor de síntese de máquinas abstratas
  // 📋 DESIGN DOC OPTIONS (Big Tech Style)
  generateDesignDoc?: boolean; // Gerar Design Doc ANTES do código
  designDocStyle?: 'google' | 'meta' | 'amazon_6p' | 'amazon_prfaq' | 'microsoft' | 'stripe' | 'netflix' | 'uber' | 'universal';
  author?: string; // Autor do Design Doc
  team?: string; // Time responsável
  // 📱 MOBILE OPTIONS (Android/iOS)
  isMobile?: boolean; // Projeto mobile detectado
  mobilePlatform?: MobilePlatform; // 'android' | 'ios' | 'both' | 'hybrid'
  mobileFramework?: MobileFramework; // 'kotlin_native' | 'swift_native' | 'flutter' | 'react_native' | etc
  appName?: string; // Nome do app
  packageName?: string; // com.example.app
  // 👑 PROST-QS OPTIONS (Kernel Soberano)
  useProstQS?: boolean; // Usar PROST-QS para auth/billing (detectado automaticamente)
  forceProstQS?: boolean; // 🔥 FORÇA uso do PROST-QS mesmo sem keywords
  prostQSRequired?: boolean; // 🔥 REJEITA código se não usar PROST-QS
  allowLocalAuth?: boolean; // Permitir auth local (default: false, PROST-QS obrigatório)
}

export interface ArchitectureBlueprint {
  projectName: string;
  description: string;
  architecture: {
    frontend?: {
      framework: string;
      libraries: string[];
      structure: string;
    };
    backend?: {
      language: string;
      framework: string;
      database: string;
      structure: string;
    };
    infrastructure?: {
      deployment: string;
      containerization: string;
      cicd: string;
    };
  };
  techStack: string[];
  fileStructure: Record<string, string>;
  apiEndpoints?: Array<{
    method: string;
    path: string;
    description: string;
  }>;
  dataModels?: Array<{
    name: string;
    fields: Record<string, string>;
  }>;
  reasoning: string;
}

export interface ArtisanCode {
  files: Array<{
    path: string;
    content: string;
    language: string;
  }>;
  qualityScore: number;
  improvements: string[];
  readyForProduction: boolean;
}

export interface AuroraResult {
  blueprint: ArchitectureBlueprint;
  code: ArtisanCode;
  totalScore: number;
  executionTime: number;
  logs: string[];
  // 🧠 KERNEL CONCEPT - Máquina Abstrata sintetizada
  abstractMachine?: AbstractMachine;
  // 📋 DESIGN DOC - Documentação estilo Big Tech
  designDoc?: GeneratedDesignDoc;
  // 📱 MOBILE - Resultado do Mobile Architect
  mobileResult?: MobileArchitectResult;
  // 🔍 PROST-QS AUDIT - Resultado da auditoria de conformidade
  prostQSAudit?: AuditResult;
}

// ============================================
// AURORA BUILDER - CLASSE PRINCIPAL
// ============================================

export class AuroraBuilder {
  private genAI: GoogleGenAI | null = null;
  private logs: string[] = [];
  private threePhasePipeline: ThreePhasePipeline;
  private designDocArchitect: DesignDocArchitect;
  private mobileArchitect: MobileArchitect;

  constructor() {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
    this.threePhasePipeline = new ThreePhasePipeline();
    this.designDocArchitect = new DesignDocArchitect();
    this.mobileArchitect = new MobileArchitect();
  }

  /**
   * 🌟 MÉTODO PRINCIPAL: Gera aplicação completa com Arquiteto + Artesão
   * 
   * MODOS DE OPERAÇÃO:
   * - LOW-LEVEL MODE: Sistemas operacionais, kernels, drivers, compiladores
   * - useThreePhasePipeline: true → 3 chamadas especializadas (mais poder)
   * - useThreePhasePipeline: false → 1 chamada monolítica (mais rápido)
   */
  async build(request: AuroraRequest): Promise<AuroraResult> {
    const startTime = Date.now();
    this.log('🌟 AURORA BUILDER INICIADO');
    this.log(`📝 Prompt: ${request.userPrompt}`);

    // 📋 GERAR DESIGN DOC PRIMEIRO (se solicitado)
    let designDoc: GeneratedDesignDoc | undefined;
    if (request.generateDesignDoc || this.shouldGenerateDesignDoc(request)) {
      this.log('\n📋 ═══════════════════════════════════════════════════════════════════════');
      this.log('📋 DESIGN DOC ARCHITECT - GERANDO DOCUMENTAÇÃO BIG TECH');
      this.log('📋 ═══════════════════════════════════════════════════════════════════════');

      const designDocResult = await this.designDocArchitect.generate({
        userPrompt: request.userPrompt,
        style: request.designDocStyle,
        complexity: request.complexity as any,
        author: request.author,
        team: request.team,
        autoDetectStyle: true
      });

      designDoc = designDocResult.designDoc;

      // Adicionar contexto do Design Doc ao request
      request.context = (request.context || '') + '\n' + designDocResult.auroraContext;

      this.log(`✅ Design Doc gerado: ${designDoc.company} style`);
      this.log(`📊 Goals: ${designDoc.sections.goals.length}`);
      this.log(`📊 Non-Goals: ${designDoc.sections.nonGoals.length}`);
      this.log(`📊 Riscos: ${designDoc.sections.risks.length}`);
    }

    // 🆕 DETECTAR SE É PROJETO LOW-LEVEL (PRIORIDADE MÁXIMA)
    const lowLevelType = detectLowLevelProject(request.userPrompt);
    if (lowLevelType || request.isLowLevel || request.projectType === 'lowlevel') {
      this.log('⚙️ ═══════════════════════════════════════════════════════════════════════');
      this.log('⚙️ LOW-LEVEL ARCHITECT MODE ATIVADO');
      this.log(`⚙️ Tipo detectado: ${lowLevelType || request.lowLevelType || 'generic'}`);
      this.log('⚙️ ═══════════════════════════════════════════════════════════════════════');

      return this.buildLowLevel({
        ...request,
        isLowLevel: true,
        lowLevelType: lowLevelType || request.lowLevelType
      }, startTime, designDoc);
    }

    // 📱 DETECTAR SE É PROJETO MOBILE (Android/iOS)
    const isMobileProject = detectMobileProject(request.userPrompt);
    if (isMobileProject || request.isMobile || request.projectType === 'mobile') {
      this.log('📱 ═══════════════════════════════════════════════════════════════════════');
      this.log('📱 MOBILE ARCHITECT MODE ATIVADO');
      const detectedPlatform = detectPlatform(request.userPrompt);
      const detectedFramework = detectFramework(request.userPrompt, detectedPlatform);
      this.log(`📱 Plataforma: ${detectedPlatform}`);
      this.log(`📱 Framework: ${detectedFramework}`);
      this.log('📱 ═══════════════════════════════════════════════════════════════════════');

      return this.buildMobile({
        ...request,
        isMobile: true,
        mobilePlatform: request.mobilePlatform || detectedPlatform,
        mobileFramework: request.mobileFramework || detectedFramework
      }, startTime, designDoc);
    }

    // 👑 DETECTAR SE DEVE USAR PROST-QS (Kernel Soberano para Auth/Billing)
    const shouldInjectProstQS = shouldUseProstQS(request.userPrompt) || request.useProstQS || request.forceProstQS;
    if (shouldInjectProstQS) {
      this.log('👑 ═══════════════════════════════════════════════════════════════════════');
      this.log('👑 PROST-QS SOVEREIGN KERNEL DETECTADO');
      this.log('👑 Auth, Billing e Planos serão DELEGADOS ao PROST-QS');
      this.log('👑 O app será um CLIENTE do kernel soberano');
      if (request.forceProstQS) {
        this.log('👑 🔥 MODO FORÇADO: PROST-QS será injetado obrigatoriamente');
      }
      if (request.prostQSRequired) {
        this.log('👑 🔥 MODO MANDATÓRIO: Código será REJEITADO se não usar PROST-QS');
      }
      this.log('👑 ═══════════════════════════════════════════════════════════════════════');

      // Injetar contexto do PROST-QS no request
      request.context = (request.context || '') + '\n' + getProstQSPromptContext();
      request.useProstQS = true;
    }

    // 🚀 DETECTAR SE DEVE USAR PIPELINE DE 3 FASES
    const shouldUseThreePhase = this.shouldUseThreePhasePipeline(request);

    if (shouldUseThreePhase) {
      this.log('🔥 MODO THREE-PHASE PIPELINE ATIVADO (3 chamadas especializadas)');
      return this.buildWithThreePhasePipeline(request, startTime, designDoc);
    }

    this.log('⚡ MODO MONOLÍTICO (1 chamada rápida)');

    // 🌉 INTEGRAÇÃO COM ALEXANDRIA BRIDGE - Detectar manifestos relevantes
    const manifestContext = getAuroraManifestContext(request.userPrompt);
    if (manifestContext) {
      this.log('🌉 ALEXANDRIA BRIDGE - Manifestos detectados e carregados');
      request.context = manifestContext;
    }

    // Detectar se é sistema distribuído
    const isDistributed = this.detectDistributedSystem(request);
    if (isDistributed) {
      this.log('🌐 SISTEMA DISTRIBUÍDO DETECTADO - Ativando Manifesto Mesh Network');
      request.isDistributed = true;
    }

    try {
      // FASE 1: ARQUITETO - Criar arquitetura
      this.log('\n🏗️ FASE 1: ARQUITETO - Criando arquitetura...');
      const blueprint = await this.architect(request);
      this.log(`✅ Arquitetura criada: ${blueprint.projectName}`);
      this.log(`📊 Tech Stack: ${blueprint.techStack.join(', ')}`);

      // FASE 2: ARTESÃO - Implementar código
      this.log('\n🎨 FASE 2: ARTESÃO - Implementando código...');
      const code = await this.artisan(blueprint, request);
      this.log(`✅ Código gerado: ${code.files.length} arquivos`);
      this.log(`📊 Qualidade: ${code.qualityScore}/100`);

      // FASE 3: AUDITORIA PROST-QS (se aplicável)
      let prostQSAudit: AuditResult | undefined;
      const shouldAuditProstQS = shouldInjectProstQS || request.prostQSRequired;

      if (shouldAuditProstQS) {
        this.log('\n🔍 FASE 3A: AUDITORIA PROST-QS - Validando conformidade...');

        // Combinar todo o código em uma string para auditoria
        const allCode = code.files.map(f => f.content).join('\n\n');
        const auditor = new ProstQSAuditor();
        prostQSAudit = auditor.audit(allCode);

        this.log(`🔍 Score de conformidade: ${prostQSAudit.score}/100`);
        this.log(`🔍 Recomendação: ${prostQSAudit.recommendation}`);

        if (prostQSAudit.violations.length > 0) {
          this.log(`⚠️ Violações encontradas: ${prostQSAudit.violations.length}`);
          prostQSAudit.violations.forEach(v => {
            this.log(`  - [${v.type}] ${v.code}: ${v.message}`);
          });
        }

        // Se há violações críticas, rejeitar (especialmente se prostQSRequired)
        const criticalViolations = prostQSAudit.violations.filter(v => v.type === 'CRITICAL');
        if (criticalViolations.length > 0 && (request.prostQSRequired || !request.allowLocalAuth)) {
          this.log('\n❌ REJEIÇÃO: Código contém violações críticas do PROST-QS');
          this.log('📋 Violações críticas encontradas:');
          criticalViolations.forEach(v => {
            this.log(`  - ${v.code}: ${v.message}`);
            this.log(`    Fix: ${v.fix}`);
          });
          throw new Error(
            `PROST-QS Compliance Failed: ${criticalViolations.length} critical violations. ` +
            `First: ${criticalViolations[0].message}`
          );
        }
      }

      // FASE 4: AVALIAÇÃO FINAL
      const totalScore = (code.qualityScore + (code.readyForProduction ? 10 : 0)) / 1.1;
      this.log(`\n🎯 SCORE FINAL: ${totalScore.toFixed(0)}/100`);

      const executionTime = Date.now() - startTime;
      this.log(`⏱️ Tempo de execução: ${executionTime}ms`);

      return {
        blueprint,
        code,
        totalScore,
        executionTime,
        logs: [...this.logs],
        designDoc, // 📋 Incluir Design Doc se gerado
        prostQSAudit // 🔍 Incluir resultado da auditoria PROST-QS
      };

    } catch (error) {
      this.log(`❌ ERRO: ${error}`);
      throw error;
    }
  }

  /**
   * 📋 Detecta se deve gerar Design Doc automaticamente
   * 
   * 🔥 SEMPRE ATIVO: O Design Doc melhora a qualidade do código gerado
   * porque fornece contexto estruturado (Goals, Non-Goals, Riscos, etc.)
   * para o LLM seguir durante a geração.
   */
  private shouldGenerateDesignDoc(request: AuroraRequest): boolean {
    // Se explicitamente desativado, respeitar
    if (request.generateDesignDoc === false) {
      return false;
    }

    // 🔥 SEMPRE GERAR DESIGN DOC INTERNAMENTE
    // O contexto do Design Doc (Goals, Non-Goals, Riscos, Alternativas)
    // melhora significativamente a qualidade do código gerado
    return true;
  }

  /**
   * 🌐 Detecta se o pedido é para sistema distribuído
   */
  private detectDistributedSystem(request: AuroraRequest): boolean {
    const distributedKeywords = [
      'distribuído', 'cluster', 'escalabilidade infinita',
      'vários servidores', 'alta disponibilidade', 'sharding',
      'multi-node', 'cockroachdb', 'kubernetes', 'swarm',
      'auto-discovery', 'gossip protocol', 'sem ponto de falha',
      'conectar automaticamente', 'unificar servidores',
      'distributed', 'high availability', 'auto-clustering',
      'mesh network', 'p2p', 'peer-to-peer'
    ];

    const promptLower = request.userPrompt.toLowerCase();
    return distributedKeywords.some(keyword => promptLower.includes(keyword)) ||
      request.projectType === 'distributed';
  }

  /**
   * 🏗️ ARQUITETO: Analisa requisitos e cria arquitetura
   */
  private async architect(request: AuroraRequest): Promise<ArchitectureBlueprint> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }

    const architectPrompt = this.buildArchitectPrompt(request);

    const result = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ text: architectPrompt }]
    });
    const response = result.text;

    // Parsear resposta do arquiteto
    return this.parseArchitectureBlueprint(response, request);
  }

  /**
   * 🎨 ARTESÃO: Implementa código com excelência
   */
  private async artisan(
    blueprint: ArchitectureBlueprint,
    request: AuroraRequest
  ): Promise<ArtisanCode> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }

    const artisanPrompt = this.buildArtisanPrompt(blueprint, request);

    const result = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ text: artisanPrompt }]
    });
    const response = result.text;

    // Parsear código gerado
    return this.parseArtisanCode(response, blueprint);
  }

  /**
   * 📝 Constrói prompt para o Arquiteto
   */
  private buildArchitectPrompt(request: AuroraRequest): string {
    // Se for sistema distribuído, adicionar manifesto mesh
    const meshManifesto = request.isDistributed ? `
${DISTRIBUTED_MESH_NETWORK_MANIFEST}

═══════════════════════════════════════════════════════════════════════════════
⚠️ ATENÇÃO: SISTEMA DISTRIBUÍDO DETECTADO
═══════════════════════════════════════════════════════════════════════════════

Você DEVE criar uma arquitetura MESH NETWORK com:
1. ✅ Backend em Go com hashicorp/memberlist (Gossip Protocol)
2. ✅ CockroachDB (banco de dados distribuído)
3. ✅ Docker Compose com múltiplos nós (mínimo 3)
4. ✅ Load Balancer (Nginx ou Traefik)
5. ✅ Auto-descoberta de nós
6. ✅ Sincronização automática (CRDT)
7. ✅ Backup automático entre nós
8. ✅ Failover automático

═══════════════════════════════════════════════════════════════════════════════
` : '';

    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🏗️ MODO ARQUITETO ATIVADO 🏗️                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

Você é um ARQUITETO DE SOFTWARE SÊNIOR com 15+ anos de experiência.

Sua missão: Analisar o pedido do usuário e criar uma ARQUITETURA COMPLETA.

${meshManifesto}

${DESIGN_PRINCIPLES_MANIFEST}

📝 PEDIDO DO USUÁRIO:
"${request.userPrompt}"

🎯 TIPO DE PROJETO: ${request.projectType || 'detectar automaticamente'}
📊 COMPLEXIDADE: ${request.complexity || 'detectar automaticamente'}
${request.isDistributed ? '🌐 SISTEMA DISTRIBUÍDO: SIM (Mesh Network)' : ''}

${request.context ? `
═══════════════════════════════════════════════════════════════════════════════
🌉 CONTEXTO DA ALEXANDRIA BRIDGE (MANIFESTOS DETECTADOS):
═══════════════════════════════════════════════════════════════════════════════
${request.context}
` : ''}

═══════════════════════════════════════════════════════════════════════════════

🧠 ANÁLISE QUE VOCÊ DEVE FAZER:

1. **Qual o tipo de aplicação?**
   - Web app? Mobile app? API? Microserviço? Fullstack?

2. **Qual a complexidade?**
   - Simples (landing page, CRUD básico)
   - Média (dashboard, e-commerce pequeno)
   - Complexa (rede social, sistema bancário)
   - Enterprise (multi-tenant, alta escala)

3. **Quais tecnologias usar?**
   - Frontend: React? Vue? Angular? Next.js? HTML puro?
   - Backend: Go? Node.js? Python? Rust?
   - Banco: PostgreSQL? MongoDB? Redis? SQLite?
   - Deploy: Docker? Kubernetes? Serverless?

4. **Qual a arquitetura ideal?**
   - Monolito? Microserviços? Serverless?
   - REST? GraphQL? gRPC? WebSocket?

═══════════════════════════════════════════════════════════════════════════════

🎯 DECISÕES INTELIGENTES:

**BACKEND:**
- Use **Go (Golang)** se: alta performance, escalabilidade, concorrência
- Use **Node.js** se: JavaScript full-stack, prototipagem rápida
- Use **Python** se: Machine Learning, análise de dados
- Use **Rust** se: performance extrema, sistemas críticos

**FRONTEND:**
- Use **Next.js** se: SEO importante, SSR, e-commerce
- Use **React** se: SPA complexa, muita interatividade
- Use **Vue.js** se: simplicidade, curva de aprendizado
- Use **Angular** se: aplicação enterprise, tipagem forte
- Use **HTML puro** se: landing page, site simples

**BANCO DE DADOS:**
- Use **PostgreSQL** se: dados relacionais, ACID, complexidade
- Use **MongoDB** se: dados não estruturados, flexibilidade
- Use **Redis** se: cache, sessões, tempo real
- Use **SQLite** se: aplicação simples, prototipagem

═══════════════════════════════════════════════════════════════════════════════

📋 RETORNE UM JSON COM ESTA ESTRUTURA:

\`\`\`json
{
  "projectName": "Nome do Projeto",
  "description": "Descrição detalhada",
  "architecture": {
    "frontend": {
      "framework": "Next.js",
      "libraries": ["TailwindCSS", "Shadcn/UI", "Zustand"],
      "structure": "Estrutura de pastas"
    },
    "backend": {
      "language": "Go",
      "framework": "Gin",
      "database": "PostgreSQL",
      "structure": "Estrutura de pastas"
    },
    "infrastructure": {
      "deployment": "Docker + Kubernetes",
      "containerization": "Docker Compose",
      "cicd": "GitHub Actions"
    }
  },
  "techStack": ["Go", "Gin", "PostgreSQL", "Next.js", "TailwindCSS"],
  "fileStructure": {
    "backend/": "Backend Go",
    "frontend/": "Frontend Next.js",
    "docker-compose.yml": "Orquestração"
  },
  "apiEndpoints": [
    {
      "method": "POST",
      "path": "/api/auth/login",
      "description": "Autenticação de usuário"
    }
  ],
  "dataModels": [
    {
      "name": "User",
      "fields": {
        "id": "uint",
        "email": "string",
        "password": "string"
      }
    }
  ],
  "reasoning": "Por que escolhi essa arquitetura..."
}
\`\`\`

═══════════════════════════════════════════════════════════════════════════════

⚠️ IMPORTANTE:
- Seja ESPECÍFICO nas escolhas
- JUSTIFIQUE cada decisão
- Pense em ESCALABILIDADE
- Considere MANUTENIBILIDADE
- Priorize SIMPLICIDADE quando possível

Retorne APENAS o JSON, sem texto adicional.
`;
  }

  /**
   * 📝 Constrói prompt para o Artesão
   * 
   * 🔥 FILOSOFIA: DEUS E O DIABO MORAM NO DETALHE
   * O Artesão recebe os 10 Mandamentos para gerar código à prova de balas
   */
  private buildArtisanPrompt(
    blueprint: ArchitectureBlueprint,
    request: AuroraRequest
  ): string {
    // Se for sistema distribuído, adicionar instruções específicas
    const meshInstructions = request.isDistributed ? `
═══════════════════════════════════════════════════════════════════════════════
🌐 INSTRUÇÕES PARA SISTEMA DISTRIBUÍDO (MESH NETWORK)
═══════════════════════════════════════════════════════════════════════════════

Você DEVE implementar:

1. **Backend Go com Gossip Protocol:**
\`\`\`go
import "github.com/hashicorp/memberlist"

config := memberlist.DefaultLocalConfig()
config.Name = os.Getenv("NODE_NAME")
list, err := memberlist.Create(config)

// Juntar-se ao cluster
existingNodes := os.Getenv("JOIN_NODES")
if existingNodes != "" {
    nodes := strings.Split(existingNodes, ",")
    list.Join(nodes)
}
\`\`\`

2. **Docker Compose Multi-Nó:**
\`\`\`yaml
services:
  cockroach-1:
    image: cockroachdb/cockroach:latest
    command: start --insecure --advertise-addr=cockroach-1
  
  cockroach-2:
    command: start --insecure --join=cockroach-1
  
  cockroach-3:
    command: start --insecure --join=cockroach-1
  
  app-1:
    environment:
      NODE_NAME: app-1
      JOIN_NODES: app-2:7946,app-3:7946
  
  app-2:
    environment:
      NODE_NAME: app-2
      JOIN_NODES: app-1:7946,app-3:7946
  
  app-3:
    environment:
      NODE_NAME: app-3
      JOIN_NODES: app-1:7946,app-2:7946
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
\`\`\`

3. **Nginx Load Balancer:**
\`\`\`nginx
upstream backend {
    least_conn;
    server app-1:8080;
    server app-2:8080;
    server app-3:8080;
}
\`\`\`

4. **README com instruções de clustering:**
- Como adicionar novos nós
- Como testar failover
- Como monitorar o cluster

═══════════════════════════════════════════════════════════════════════════════
` : '';

    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🎨 MODO ARTESÃO ATIVADO 🎨                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

Você é um ARTESÃO DIGITAL com maestria em código de excelência.

Sua missão: Implementar a arquitetura criada pelo ARQUITETO com PERFEIÇÃO.

${meshInstructions}

${DESIGN_PRINCIPLES_MANIFEST}

═══════════════════════════════════════════════════════════════════════════════

📐 ARQUITETURA DEFINIDA:

**Projeto:** ${blueprint.projectName}
**Descrição:** ${blueprint.description}

**Tech Stack:**
${blueprint.techStack.map(tech => `- ${tech}`).join('\n')}

**Estrutura de Arquivos:**
${Object.entries(blueprint.fileStructure).map(([path, desc]) => `- ${path}: ${desc}`).join('\n')}

${blueprint.apiEndpoints ? `
**API Endpoints:**
${blueprint.apiEndpoints.map(ep => `- ${ep.method} ${ep.path}: ${ep.description}`).join('\n')}
` : ''}

${blueprint.dataModels ? `
**Modelos de Dados:**
${blueprint.dataModels.map(model => `- ${model.name}: ${Object.keys(model.fields).join(', ')}`).join('\n')}
` : ''}

**Justificativa da Arquitetura:**
${blueprint.reasoning}

═══════════════════════════════════════════════════════════════════════════════

🔥 FILOSOFIA CENTRAL: DEUS E O DIABO MORAM NO DETALHE 🔥

> "Deus está nos detalhes" - Ludwig Mies van der Rohe
> "O diabo está nos detalhes" - Provérbio alemão

Cada linha de código é uma escolha entre salvação e catástrofe.
Você escolhe SEMPRE onde Deus habita.

═══════════════════════════════════════════════════════════════════════════════

📜 OS 10 MANDAMENTOS DO DETALHE (OBRIGATÓRIOS):

1️⃣ **NUNCA CONFIE NO FRONTEND**
\`\`\`go
// ❌ ERRADO - Confia no que o frontend mandou
func UpdateBalance(c *gin.Context) {
    var req struct { NewBalance decimal.Decimal } // PERIGO!
    repo.UpdateBalance(req.NewBalance) // Hacker manda 1 bilhão
}

// ✅ CERTO - Backend calcula tudo
func Deposit(c *gin.Context) {
    var req struct { Amount decimal.Decimal \`binding:"required,gt=0"\` }
    service.Deposit(accountID, req.Amount) // SOMA ao existente
}
\`\`\`

2️⃣ **TRANSAÇÕES ATÔMICAS OU MORTE**
\`\`\`go
// ❌ ERRADO - Operações separadas (dinheiro pode sumir!)
db.Exec("UPDATE accounts SET balance = balance - $1", amount, from)
db.Exec("UPDATE accounts SET balance = balance + $1", amount, to)

// ✅ CERTO - Tudo ou nada
tx, _ := db.Begin()
defer tx.Rollback()
tx.Exec("UPDATE accounts SET balance = balance - $1 WHERE id = $2 FOR UPDATE", amount, from)
tx.Exec("UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, to)
return tx.Commit()
\`\`\`

3️⃣ **LOGS SÃO SAGRADOS**
\`\`\`go
// ❌ ERRADO
log.Println("error:", err)

// ✅ CERTO - Log que salva vidas às 3h da manhã
logger.Error("transfer failed",
    zap.String("transaction_id", txID.String()),
    zap.String("from_account", fromID.String()),
    zap.String("amount", amount.String()),
    zap.String("user_id", userID.String()),
    zap.Error(err))
\`\`\`

4️⃣ **IDEMPOTÊNCIA É LEI**
\`\`\`go
// Mesma request = mesmo resultado
func ProcessPayment(req PaymentRequest) (*Payment, error) {
    existing, err := repo.GetByIdempotencyKey(req.IdempotencyKey)
    if err == nil {
        return existing, nil // Retorna o mesmo resultado
    }
    // Processa com constraint única no banco
}
\`\`\`

5️⃣ **VALIDAÇÃO EM CAMADAS**
- Camada 1: Handler (formato) - binding:"required,gt=0"
- Camada 2: Service (regras de negócio) - limites, permissões
- Camada 3: Domain (invariantes) - saldo >= 0, status válido
- Camada 4: Database (constraints) - CHECK (balance >= 0)

6️⃣ **SOFT DELETE SEMPRE**
\`\`\`sql
-- ❌ NUNCA delete dados financeiros
DELETE FROM transactions WHERE id = $1;

-- ✅ SEMPRE soft delete
UPDATE transactions SET deleted_at = NOW(), deleted_by = $2 WHERE id = $1;
\`\`\`

7️⃣ **AUDITORIA COMPLETA**
\`\`\`go
type AuditLog struct {
    EntityType string    // "account", "transaction"
    EntityID   uuid.UUID
    Action     string    // "CREATE", "UPDATE", "DELETE"
    OldValue   JSONB     // Estado anterior
    NewValue   JSONB     // Estado novo
    UserID     uuid.UUID // Quem fez
    IPAddress  string
    Timestamp  time.Time
}
\`\`\`

8️⃣ **RATE LIMITING INTELIGENTE**
\`\`\`go
rateLimitConfigs := map[string]Config{
    "auth":      { WindowMs: 15*60*1000, MaxRequests: 5 },   // 5 tentativas em 15min
    "api":       { WindowMs: 60*1000, MaxRequests: 100 },    // 100/min
    "sensitive": { WindowMs: 60*1000, MaxRequests: 10 },     // 10/min para operações críticas
}
\`\`\`

9️⃣ **SECRETS NUNCA NO CÓDIGO**
\`\`\`go
// ❌ ERRADO
const apiKey = "sk-1234567890"

// ✅ CERTO
type Config struct {
    APIKey string \`env:"API_KEY,required"\`
}
\`\`\`

🔟 **TESTES SÃO DOCUMENTAÇÃO VIVA**
\`\`\`go
func TestTransfer_ConcurrentRequests(t *testing.T) {
    account := createTestAccount(t, decimal.NewFromInt(1000))
    var wg sync.WaitGroup
    var successCount int32
    
    for i := 0; i < 20; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            _, err := service.Transfer(ctx, TransferRequest{Amount: 100})
            if err == nil { atomic.AddInt32(&successCount, 1) }
        }()
    }
    wg.Wait()
    
    // Apenas 10 devem ter sucesso (1000 / 100 = 10)
    assert.Equal(t, int32(10), successCount)
}
\`\`\`

═══════════════════════════════════════════════════════════════════════════════

🎯 PRINCÍPIOS DO ARTESÃO DIGITAL:

1. **CÓDIGO LIMPO E ORGANIZADO**
   - Nomes descritivos
   - Funções pequenas e focadas
   - Comentários úteis (não óbvios)
   - Separação de responsabilidades

2. **FUNCIONALIDADE COMPLETA**
   - NUNCA deixe TODOs ou placeholders
   - SEMPRE implemente tudo
   - Tratamento de erros completo
   - Validação de dados

3. **QUALIDADE PROFISSIONAL**
   - Código pronto para produção
   - Segurança implementada
   - Performance otimizada
   - Acessibilidade garantida

4. **ESTRUTURA PROFISSIONAL**
   - Pastas organizadas
   - Arquivos bem nomeados
   - Configurações completas
   - README detalhado

═══════════════════════════════════════════════════════════════════════════════

📋 RETORNE OS ARQUIVOS NESTE FORMATO:

\`\`\`
FILE: caminho/do/arquivo.ext
LANGUAGE: linguagem
---
conteúdo do arquivo aqui
---

FILE: outro/arquivo.ext
LANGUAGE: linguagem
---
conteúdo aqui
---
\`\`\`

═══════════════════════════════════════════════════════════════════════════════

⚠️ REGRAS ABSOLUTAS:

✅ SEMPRE gere código 100% funcional
✅ SEMPRE implemente autenticação se necessário
✅ SEMPRE adicione tratamento de erros
✅ SEMPRE valide dados de entrada
✅ SEMPRE adicione comentários úteis
✅ SEMPRE crie README.md completo
✅ SEMPRE configure Docker se backend

❌ NUNCA deixe TODOs ou FIXMEs
❌ NUNCA use placeholders
❌ NUNCA deixe funções vazias
❌ NUNCA exponha secrets no código
❌ NUNCA ignore segurança

═══════════════════════════════════════════════════════════════════════════════

🚀 COMECE A IMPLEMENTAÇÃO AGORA!

Gere TODOS os arquivos necessários seguindo a arquitetura definida.
`;
  }

  /**
   * 📊 Parseia resposta do Arquiteto
   */
  private parseArchitectureBlueprint(
    response: string,
    request: AuroraRequest
  ): ArchitectureBlueprint {
    try {
      // Extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: criar blueprint básico
      return this.createFallbackBlueprint(request);

    } catch (error) {
      this.log(`⚠️ Erro ao parsear blueprint, usando fallback`);
      return this.createFallbackBlueprint(request);
    }
  }

  /**
   * 📊 Parseia código do Artesão
   */
  private parseArtisanCode(
    response: string,
    blueprint: ArchitectureBlueprint
  ): ArtisanCode {
    const files: Array<{ path: string; content: string; language: string }> = [];

    // Extrair arquivos do formato FILE: ... ---content--- ---
    const fileRegex = /FILE:\s*(.+?)\nLANGUAGE:\s*(.+?)\n---\n([\s\S]*?)---/g;
    let match;

    while ((match = fileRegex.exec(response)) !== null) {
      files.push({
        path: match[1].trim(),
        content: match[3].trim(),
        language: match[2].trim()
      });
    }

    // Se não encontrou arquivos no formato, tentar extrair blocos de código
    if (files.length === 0) {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let blockMatch;
      let fileIndex = 0;

      while ((blockMatch = codeBlockRegex.exec(response)) !== null) {
        const language = blockMatch[1] || 'text';
        const content = blockMatch[2].trim();

        // Tentar detectar o tipo de arquivo pelo conteúdo
        let path = `file${fileIndex}`;
        if (content.includes('package main')) path = 'main.go';
        else if (content.includes('<!DOCTYPE html>')) path = 'index.html';
        else if (content.includes('import React')) path = 'App.tsx';
        else if (content.includes('FROM ')) path = 'Dockerfile';
        else if (content.includes('version:')) path = 'docker-compose.yml';

        files.push({ path, content, language });
        fileIndex++;
      }
    }

    // Calcular score de qualidade
    const qualityScore = this.calculateQualityScore(files);
    const readyForProduction = qualityScore >= 85;

    return {
      files,
      qualityScore,
      improvements: [],
      readyForProduction
    };
  }

  /**
   * 📊 Calcula score de qualidade do código
   */
  private calculateQualityScore(files: Array<{ path: string; content: string }>): number {
    let score = 100;

    // Verificar se tem arquivos
    if (files.length === 0) score -= 50;

    // Verificar se tem README
    const hasReadme = files.some(f => f.path.toLowerCase().includes('readme'));
    if (!hasReadme) score -= 10;

    // Verificar se tem Docker
    const hasDocker = files.some(f => f.path.toLowerCase().includes('docker'));
    if (!hasDocker) score -= 5;

    // Verificar se tem TODOs
    const hasTodos = files.some(f => f.content.includes('TODO') || f.content.includes('FIXME'));
    if (hasTodos) score -= 15;

    // Verificar se tem tratamento de erros
    const hasErrorHandling = files.some(f =>
      f.content.includes('try') ||
      f.content.includes('catch') ||
      f.content.includes('if err')
    );
    if (!hasErrorHandling) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 🔧 Cria blueprint fallback
   */
  private createFallbackBlueprint(request: AuroraRequest): ArchitectureBlueprint {
    return {
      projectName: 'Projeto Gerado',
      description: request.userPrompt,
      architecture: {
        frontend: {
          framework: 'React',
          libraries: ['TailwindCSS'],
          structure: 'src/'
        },
        backend: {
          language: 'Go',
          framework: 'Gin',
          database: 'PostgreSQL',
          structure: 'backend/'
        }
      },
      techStack: ['Go', 'React', 'PostgreSQL'],
      fileStructure: {
        'backend/': 'Backend Go',
        'frontend/': 'Frontend React'
      },
      reasoning: 'Stack padrão para aplicações fullstack'
    };
  }

  /**
   * 🔍 Detecta se deve usar o pipeline de 3 fases
   * Ativa automaticamente para projetos complexos
   */
  private shouldUseThreePhasePipeline(request: AuroraRequest): boolean {
    // Se explicitamente definido, respeitar
    if (request.useThreePhasePipeline !== undefined) {
      return request.useThreePhasePipeline;
    }

    // Ativar automaticamente para projetos complexos
    const complexKeywords = [
      'fintech', 'banco', 'bank', 'pagamento', 'payment',
      'e-commerce', 'ecommerce', 'loja', 'marketplace',
      'saas', 'enterprise', 'completo', 'complete',
      'fullstack', 'full-stack', 'sistema completo',
      'dashboard', 'admin', 'painel', 'crm', 'erp'
    ];

    const promptLower = request.userPrompt.toLowerCase();
    const hasComplexKeyword = complexKeywords.some(k => promptLower.includes(k));

    // Ativar para complexidade enterprise ou complex
    const isComplexProject = request.complexity === 'enterprise' || request.complexity === 'complex';

    // Ativar para tipos específicos
    const isComplexType = request.projectType === 'fintech' || request.projectType === 'fullstack';

    return hasComplexKeyword || isComplexProject || isComplexType;
  }

  /**
   * 🚀 BUILD COM THREE-PHASE PIPELINE (3 chamadas especializadas)
   * Mais poder, mais profundidade, mais qualidade
   */
  private async buildWithThreePhasePipeline(
    request: AuroraRequest,
    startTime: number,
    designDoc?: GeneratedDesignDoc
  ): Promise<AuroraResult> {
    this.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
    this.log('║              🌟 THREE-PHASE PIPELINE - 3 CHAMADAS ESPECIALIZADAS 🌟          ║');
    this.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

    try {
      const pipelineResult = await this.threePhasePipeline.execute({
        userPrompt: request.userPrompt,
        projectType: request.projectType as any,
        complexity: request.complexity as any,
        onPhaseStart: (phase, name) => {
          this.log(`\n🚀 FASE ${phase}: ${name}`);
        },
        onPhaseComplete: (phase, result) => {
          this.log(`✅ Fase ${phase} completa: ${result.files.length} arquivos`);
        }
      });

      // Converter resultado do pipeline para formato AuroraResult
      return this.convertPipelineResult(pipelineResult, request, startTime, designDoc);

    } catch (error) {
      this.log(`❌ ERRO NO PIPELINE: ${error}`);
      throw error;
    }
  }

  /**
   * 🔄 Converte resultado do pipeline para formato AuroraResult
   */
  private convertPipelineResult(
    pipelineResult: PipelineResult,
    request: AuroraRequest,
    startTime: number,
    designDoc?: GeneratedDesignDoc
  ): AuroraResult {
    // Combinar todos os arquivos das 3 fases
    const allFiles = pipelineResult.phases.flatMap(phase =>
      phase.files.map(f => ({
        path: f.path,
        content: f.content,
        language: f.language
      }))
    );

    // Criar blueprint baseado nos resultados
    const blueprint: ArchitectureBlueprint = {
      projectName: this.extractProjectName(request.userPrompt),
      description: request.userPrompt,
      architecture: {
        frontend: {
          framework: 'React/Next.js',
          libraries: ['TailwindCSS', 'Shadcn/UI', 'Framer Motion'],
          structure: 'src/'
        },
        backend: {
          language: 'Go/TypeScript',
          framework: 'Gin/Hono',
          database: 'PostgreSQL',
          structure: 'backend/'
        },
        infrastructure: {
          deployment: 'Docker',
          containerization: 'Docker Compose',
          cicd: 'GitHub Actions'
        }
      },
      techStack: ['Go', 'TypeScript', 'React', 'PostgreSQL', 'Docker'],
      fileStructure: this.buildFileStructure(allFiles),
      reasoning: 'Gerado pelo Three-Phase Pipeline com 3 chamadas especializadas'
    };

    // Calcular score de qualidade
    const qualityScore = this.calculatePipelineQualityScore(pipelineResult);

    const code: ArtisanCode = {
      files: allFiles,
      qualityScore,
      improvements: [],
      readyForProduction: qualityScore >= 85
    };

    const executionTime = Date.now() - startTime;

    this.log(`\n🎯 PIPELINE COMPLETO!`);
    this.log(`📊 Total de arquivos: ${allFiles.length}`);
    this.log(`📊 Score de qualidade: ${qualityScore}/100`);
    this.log(`⏱️ Tempo total: ${(executionTime / 1000).toFixed(2)}s`);

    return {
      blueprint,
      code,
      totalScore: qualityScore,
      executionTime,
      logs: [...this.logs],
      designDoc // 📋 Incluir Design Doc se gerado
    };
  }

  /**
   * 📊 Calcula score de qualidade do pipeline
   */
  private calculatePipelineQualityScore(result: PipelineResult): number {
    let score = 100;

    // Verificar se todas as fases completaram
    if (result.phases.length < 3) score -= 20;

    // Verificar quantidade de arquivos por fase
    const phase1Files = result.phases[0]?.files.length || 0;
    const phase2Files = result.phases[1]?.files.length || 0;
    const phase3Files = result.phases[2]?.files.length || 0;

    if (phase1Files < 3) score -= 10; // Backend mínimo
    if (phase2Files < 3) score -= 10; // Frontend mínimo
    if (phase3Files < 2) score -= 5;  // Docs mínimo

    // Verificar arquivos essenciais
    const allFiles = result.phases.flatMap(p => p.files);
    const hasReadme = allFiles.some(f => f.path.toLowerCase().includes('readme'));
    const hasDocker = allFiles.some(f => f.path.toLowerCase().includes('docker'));
    const hasTests = allFiles.some(f => f.path.toLowerCase().includes('test'));

    if (!hasReadme) score -= 5;
    if (!hasDocker) score -= 5;
    if (!hasTests) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 📁 Constrói estrutura de arquivos
   */
  private buildFileStructure(files: Array<{ path: string }>): Record<string, string> {
    const structure: Record<string, string> = {};

    for (const file of files) {
      const parts = file.path.split('/');
      if (parts.length > 1) {
        const dir = parts[0] + '/';
        if (!structure[dir]) {
          structure[dir] = `Diretório ${parts[0]}`;
        }
      }
      structure[file.path] = file.path;
    }

    return structure;
  }

  /**
   * 📝 Extrai nome do projeto do prompt
   */
  private extractProjectName(prompt: string): string {
    // Tentar extrair nome do prompt
    const patterns = [
      /crie?\s+(?:um|uma|o|a)?\s*(.+?)(?:\s+com|\s+que|\s+para|$)/i,
      /(?:sistema|app|aplicativo|projeto)\s+(?:de\s+)?(.+?)(?:\s+com|\s+que|\s+para|$)/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match && match[1]) {
        return match[1].trim().substring(0, 50);
      }
    }

    return 'Projeto Aurora';
  }

  /**
   * 📝 Adiciona log
   */
  private log(message: string): void {
    this.logs.push(message);
    console.log(message);
  }

  // ============================================
  // 🔍 PROST-QS AUDITOR - VALIDAÇÃO DE CONFORMIDADE
  // ============================================

  /**
   * 🔍 Audita código gerado para conformidade com PROST-QS
   * 
   * VIOLAÇÕES DETECTADAS:
   * - Mock de auth/billing local
   * - localStorage para estado de plano
   * - Ausência do SDK obrigatório
   * - Decisões locais de premium/pro
   * - Integração direta com Stripe
   * 
   * @returns AuditResult com score, violações e recomendação
   */
  private auditProstQSCode(files: Array<{ path: string; content: string }>): AuditResult {
    this.log('\n🔍 ═══════════════════════════════════════════════════════════════════════');
    this.log('🔍 PROST-QS AUDITOR - VALIDANDO CONFORMIDADE');
    this.log('🔍 ═══════════════════════════════════════════════════════════════════════');

    // Combinar todo o código para auditoria
    const allCode = files.map(f => `// FILE: ${f.path}\n${f.content}`).join('\n\n');

    // Executar auditoria
    const auditor = new ProstQSAuditor();
    const result = auditor.audit(allCode);

    // Log do resultado
    if (result.passed) {
      this.log(`✅ AUDITORIA APROVADA: Score ${result.score}/100`);
    } else {
      this.log(`❌ AUDITORIA REPROVADA: Score ${result.score}/100`);
      this.log(`🚨 Violações encontradas: ${result.violations.length}`);

      // Listar violações críticas
      const criticalViolations = result.violations.filter(v => v.type === 'CRITICAL');
      if (criticalViolations.length > 0) {
        this.log('\n🔴 VIOLAÇÕES CRÍTICAS:');
        for (const v of criticalViolations) {
          this.log(`   [${v.code}] ${v.message}`);
          if (v.snippet) {
            this.log(`   Trecho: "${v.snippet.substring(0, 50)}..."`);
          }
          this.log(`   Correção: ${v.fix}`);
        }
      }
    }

    this.log(`📊 Recomendação: ${result.recommendation}`);
    this.log('🔍 ═══════════════════════════════════════════════════════════════════════\n');

    return result;
  }

  /**
   * 🔧 Ajusta score total baseado na auditoria PROST-QS
   * 
   * Se o código viola o manifesto, o score é penalizado severamente
   */
  private adjustScoreWithAudit(baseScore: number, auditResult: AuditResult): number {
    if (auditResult.passed) {
      return baseScore;
    }

    // Penalizar baseado na severidade
    const criticalCount = auditResult.violations.filter(v => v.type === 'CRITICAL').length;
    const severeCount = auditResult.violations.filter(v => v.type === 'SEVERE').length;

    // Cada violação crítica reduz 15 pontos
    // Cada violação severa reduz 10 pontos
    const penalty = (criticalCount * 15) + (severeCount * 10);

    return Math.max(0, baseScore - penalty);
  }

  // ============================================
  // 🆕 LOW-LEVEL ARCHITECT MODE
  // ============================================

  /**
   * ⚙️ BUILD LOW-LEVEL: Sistemas operacionais, kernels, drivers, compiladores
   * 
   * Este modo é ativado automaticamente quando detecta:
   * - Sistema operacional, kernel, bootloader
   * - Device driver, firmware, RTOS
   * - Compilador, interpretador, VM
   * - Network stack, crypto library
   * - Memory allocator, file system
   * - Hypervisor, debugger, emulator
   * 
   * 🧠 FLUXO CORRETO (6 EIXOS):
   * INTENT → TOKEN → IR → BACKEND
   * 
   * 1. Analisa intents do usuário
   * 2. Sintetiza Abstract Machine via SystemSynthesisEngine
   * 3. Gera código baseado na máquina abstrata
   */
  private async buildLowLevel(
    request: AuroraRequest,
    startTime: number,
    designDoc?: GeneratedDesignDoc
  ): Promise<AuroraResult> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }

    // Analisar request com LowLevelArchitect
    const lowLevelRequest: LowLevelRequest = {
      userPrompt: request.userPrompt,
      projectType: request.lowLevelType || 'operating_system',
      targetArchitecture: request.targetArchitecture || 'x86_64',
      primaryLanguage: request.primaryLanguage || 'rust'
    };

    // Detectar linguagem e arquitetura se não especificados
    const analyzed = LowLevelArchitect.analyzeRequest(request.userPrompt);
    if (analyzed) {
      lowLevelRequest.projectType = analyzed.projectType;
      lowLevelRequest.targetArchitecture = analyzed.targetArchitecture;
      lowLevelRequest.primaryLanguage = analyzed.primaryLanguage;
    }

    this.log(`\n⚙️ Tipo de Projeto: ${lowLevelRequest.projectType}`);
    this.log(`⚙️ Linguagem Principal: ${lowLevelRequest.primaryLanguage}`);
    this.log(`⚙️ Arquitetura Alvo: ${lowLevelRequest.targetArchitecture}`);

    // 🧠 EIXO 1-6: SINTETIZAR ABSTRACT MACHINE
    this.log('\n🧠 ═══════════════════════════════════════════════════════════════════════');
    this.log('🧠 AURORA KERNEL CONCEPT - SÍNTESE DE MÁQUINA ABSTRATA');
    this.log('🧠 ═══════════════════════════════════════════════════════════════════════');

    // Detectar intents do prompt
    const detectedIntents = this.detectSystemIntents(request.userPrompt, lowLevelRequest.projectType);
    const systemIntents = request.systemIntents || detectedIntents;

    this.log(`🎯 Intents detectados: ${systemIntents.join(', ')}`);

    // Sintetizar Abstract Machine
    const abstractMachine = SystemSynthesisEngine.synthesize(
      this.extractProjectName(request.userPrompt),
      request.userPrompt,
      systemIntents,
      [lowLevelRequest.targetArchitecture as 'x86_64' | 'arm64' | 'riscv64' | 'wasm']
    );

    this.log(`🏗️ Modelo de Computação: ${abstractMachine.computationModel}`);
    this.log(`📜 Token ISA: ${abstractMachine.tokenISA.length} instruções`);
    this.log(`⏱️ Scheduling: ${abstractMachine.temporal.scheduling}`);
    this.log(`🔄 Concorrência: ${abstractMachine.concurrency.model}`);
    this.log(`⚠️ Isolamento: ${abstractMachine.fault.isolation}`);

    // Gerar justificativa
    const reasoning = SystemSynthesisEngine.explainDecisions(abstractMachine);
    this.log('\n📋 Justificativa de arquitetura gerada');

    // Gerar prompt enriquecido COM Abstract Machine
    const basePrompt = LowLevelArchitect.enrichPrompt(lowLevelRequest);
    const enrichedPrompt = this.enrichWithAbstractMachine(basePrompt, abstractMachine, reasoning);

    this.log('\n🔨 Gerando código de baixo nível baseado na Abstract Machine...');

    // Chamar o modelo
    const result = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ text: enrichedPrompt }]
    });

    const response = result.text || '';

    // Parsear arquivos gerados
    const files = this.parseLowLevelFiles(response, lowLevelRequest.primaryLanguage);

    this.log(`✅ Gerados ${files.length} arquivos`);

    // Criar blueprint
    const blueprint: ArchitectureBlueprint = {
      projectName: this.extractProjectName(request.userPrompt),
      description: request.userPrompt,
      architecture: {
        backend: {
          language: lowLevelRequest.primaryLanguage,
          framework: this.getLowLevelFramework(lowLevelRequest.projectType),
          database: 'N/A (Low-Level)',
          structure: this.getLowLevelStructure(lowLevelRequest.projectType)
        },
        infrastructure: {
          deployment: 'Bare Metal / QEMU',
          containerization: 'N/A',
          cicd: 'Makefile / Cargo'
        }
      },
      techStack: this.getLowLevelTechStack(lowLevelRequest),
      fileStructure: this.buildFileStructure(files),
      reasoning: `Projeto de baixo nível: ${lowLevelRequest.projectType} em ${lowLevelRequest.primaryLanguage} para ${lowLevelRequest.targetArchitecture}`
    };

    // Calcular score
    const qualityScore = this.calculateLowLevelQualityScore(files, lowLevelRequest);

    const code: ArtisanCode = {
      files,
      qualityScore,
      improvements: [],
      readyForProduction: qualityScore >= 80
    };

    const executionTime = Date.now() - startTime;

    this.log(`\n🎯 LOW-LEVEL BUILD COMPLETO!`);
    this.log(`📊 Arquivos: ${files.length}`);
    this.log(`📊 Score: ${qualityScore}/100`);
    this.log(`⏱️ Tempo: ${(executionTime / 1000).toFixed(2)}s`);

    return {
      blueprint,
      code,
      totalScore: qualityScore,
      executionTime,
      logs: [...this.logs],
      abstractMachine, // 🧠 Incluir a máquina abstrata sintetizada
      designDoc // 📋 Incluir Design Doc se gerado
    };
  }

  /**
   * 🎯 Detecta System Intents do prompt do usuário
   */
  private detectSystemIntents(prompt: string, projectType: LowLevelProjectType): SystemIntent[] {
    const promptLower = prompt.toLowerCase();
    const intents: SystemIntent[] = [];

    // Detectar por palavras-chave
    const intentKeywords: Record<SystemIntent, string[]> = {
      'ISOLAMENTO_FORTE': ['isolamento', 'isolation', 'sandbox', 'separação', 'microkernel'],
      'PERFORMANCE_MAXIMA': ['performance', 'rápido', 'fast', 'otimizado', 'zero-copy', 'lock-free'],
      'TEMPO_REAL_HARD': ['tempo real', 'real-time', 'hard real-time', 'determinístico', 'deadline'],
      'TEMPO_REAL_SOFT': ['soft real-time', 'baixa latência', 'low latency'],
      'SEGURANCA_MAXIMA': ['seguro', 'secure', 'segurança', 'security', 'capability', 'sel4'],
      'MINIMALISMO': ['mínimo', 'minimal', 'pequeno', 'small', 'exokernel', 'unikernel'],
      'EXTENSIBILIDADE': ['extensível', 'extensible', 'modular', 'plugin', 'hot swap'],
      'PORTABILIDADE': ['portável', 'portable', 'multi-plataforma', 'cross-platform'],
      'ENERGIA_MINIMA': ['baixo consumo', 'low power', 'energia', 'battery', 'embedded'],
      'TOLERANCIA_FALHAS': ['tolerante a falhas', 'fault tolerant', 'resiliente', 'recovery', 'supervisor']
    };

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(k => promptLower.includes(k))) {
        intents.push(intent as SystemIntent);
      }
    }

    // Adicionar intents padrão por tipo de projeto
    const defaultIntents: Record<LowLevelProjectType, SystemIntent[]> = {
      'operating_system': ['ISOLAMENTO_FORTE', 'EXTENSIBILIDADE'],
      'kernel_module': ['PERFORMANCE_MAXIMA'],
      'device_driver': ['PERFORMANCE_MAXIMA'],
      'bootloader': ['MINIMALISMO'],
      'firmware': ['ENERGIA_MINIMA', 'MINIMALISMO'],
      'rtos': ['TEMPO_REAL_HARD'],
      'compiler': ['PERFORMANCE_MAXIMA'],
      'interpreter': ['EXTENSIBILIDADE'],
      'network_stack': ['PERFORMANCE_MAXIMA'],
      'crypto_library': ['SEGURANCA_MAXIMA'],
      'memory_allocator': ['PERFORMANCE_MAXIMA'],
      'file_system': ['TOLERANCIA_FALHAS'],
      'hypervisor': ['ISOLAMENTO_FORTE', 'SEGURANCA_MAXIMA'],
      'debugger': ['EXTENSIBILIDADE'],
      'emulator': ['PORTABILIDADE']
    };

    // Adicionar defaults se não detectou nenhum
    if (intents.length === 0 && defaultIntents[projectType]) {
      intents.push(...defaultIntents[projectType]);
    }

    return intents;
  }

  /**
   * 🧠 Enriquece prompt com informações da Abstract Machine
   */
  private enrichWithAbstractMachine(
    basePrompt: string,
    machine: AbstractMachine,
    reasoning: string
  ): string {
    const tokenISASection = machine.tokenISA.map(token => {
      const instruction = TOKEN_ISA.find(t => t.token === token);
      if (instruction) {
        return `• ${token}: ${instruction.description}`;
      }
      return `• ${token}`;
    }).join('\n');

    return `
${basePrompt}

═══════════════════════════════════════════════════════════════════════════════
🧠 ABSTRACT MACHINE SINTETIZADA (AURORA KERNEL CONCEPT)
═══════════════════════════════════════════════════════════════════════════════

📋 NOME: ${machine.name}
🏗️ MODELO DE COMPUTAÇÃO: ${machine.computationModel.toUpperCase()}

📜 TOKEN ISA (${machine.tokenISA.length} instruções):
${tokenISASection}

⏱️ MODELO TEMPORAL:
• Scheduling: ${machine.temporal.scheduling}
• Preempção: ${machine.temporal.preemption ? 'SIM' : 'NÃO'}
• Prioridades: ${machine.temporal.priorities} níveis
${machine.temporal.deadlineSupport ? '• Suporte a Deadlines: SIM' : ''}

🔄 MODELO DE CONCORRÊNCIA:
• Tipo: ${machine.concurrency.model}
• Estado Compartilhado: ${machine.concurrency.sharedState ? 'SIM' : 'NÃO'}
• Sincronização: ${machine.concurrency.synchronization.join(', ')}

⚠️ MODELO DE FALHAS:
• Isolamento: ${machine.fault.isolation}
• Recuperação: ${machine.fault.recovery.join(', ')}
• Supervisão: ${machine.fault.supervision}

🎯 INTENTS DO SISTEMA:
${machine.intents.map(i => `• ${i}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
⚠️ VOCÊ DEVE IMPLEMENTAR O SISTEMA SEGUINDO ESTA ARQUITETURA!
═══════════════════════════════════════════════════════════════════════════════

O código gerado DEVE refletir:
1. O modelo de computação ${machine.computationModel}
2. As instruções do Token ISA listadas acima
3. O modelo de scheduling ${machine.temporal.scheduling}
4. O modelo de concorrência ${machine.concurrency.model}
5. O nível de isolamento ${machine.fault.isolation}

${reasoning}
`;
  }

  /**
   * 📦 Parseia arquivos de resposta low-level
   */
  private parseLowLevelFiles(
    response: string,
    primaryLanguage: string
  ): Array<{ path: string; content: string; language: string }> {
    const files: Array<{ path: string; content: string; language: string }> = [];

    // Formato: ===FILE: path=== ou FILE: path
    const fileRegex = /(?:===FILE:|FILE:)\s*(.+?)(?:===)?\s*\n(?:LANGUAGE:\s*(.+?)\s*\n)?(?:---\n)?([\s\S]*?)(?:---|(?=(?:===FILE:|FILE:)|$))/g;
    let match;

    while ((match = fileRegex.exec(response)) !== null) {
      const path = match[1].trim();
      const language = match[2]?.trim() || this.detectLanguageFromPath(path, primaryLanguage);
      const content = match[3].trim();

      if (content.length > 0) {
        files.push({ path, content, language });
      }
    }

    // Fallback: extrair blocos de código
    if (files.length === 0) {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let blockMatch;
      let fileIndex = 0;

      while ((blockMatch = codeBlockRegex.exec(response)) !== null) {
        const language = blockMatch[1] || primaryLanguage;
        const content = blockMatch[2].trim();

        // Detectar path pelo conteúdo
        let path = this.detectPathFromContent(content, language, fileIndex);

        files.push({ path, content, language });
        fileIndex++;
      }
    }

    return files;
  }

  /**
   * 🔍 Detecta linguagem pelo path do arquivo
   */
  private detectLanguageFromPath(path: string, defaultLang: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'rs': 'rust',
      'c': 'c',
      'h': 'c',
      'cpp': 'cpp',
      'cc': 'cpp',
      'hpp': 'cpp',
      'asm': 'assembly',
      's': 'assembly',
      'zig': 'zig',
      'go': 'go',
      'toml': 'toml',
      'ld': 'linker',
      'mk': 'makefile',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'json': 'json'
    };
    return langMap[ext || ''] || defaultLang;
  }

  /**
   * 🔍 Detecta path pelo conteúdo do arquivo
   */
  private detectPathFromContent(content: string, language: string, index: number): string {
    // Rust
    if (content.includes('#![no_std]') || content.includes('#![no_main]')) {
      return 'src/main.rs';
    }
    if (content.includes('mod ') && language === 'rust') {
      return `src/lib.rs`;
    }

    // C
    if (content.includes('#include') && content.includes('int main')) {
      return 'src/main.c';
    }
    if (content.includes('#ifndef') || content.includes('#pragma once')) {
      return `include/header${index}.h`;
    }

    // Assembly
    if (content.includes('section .text') || content.includes('global _start')) {
      return 'boot/boot.asm';
    }

    // Build files
    if (content.includes('[package]') && content.includes('name =')) {
      return 'Cargo.toml';
    }
    if (content.includes('CC =') || content.includes('CFLAGS')) {
      return 'Makefile';
    }
    if (content.includes('ENTRY(') || content.includes('SECTIONS')) {
      return 'linker.ld';
    }

    // Default
    const extMap: Record<string, string> = {
      'rust': 'rs', 'c': 'c', 'cpp': 'cpp', 'assembly': 'asm',
      'zig': 'zig', 'go': 'go', 'makefile': 'mk'
    };
    return `src/file${index}.${extMap[language] || 'txt'}`;
  }

  /**
   * 🔧 Retorna framework/toolchain para tipo de projeto
   */
  private getLowLevelFramework(projectType: LowLevelProjectType): string {
    const frameworks: Record<LowLevelProjectType, string> = {
      'operating_system': 'Custom Kernel',
      'kernel_module': 'Linux Kernel API',
      'device_driver': 'Linux/Windows Driver Framework',
      'bootloader': 'UEFI/BIOS',
      'firmware': 'HAL (Hardware Abstraction Layer)',
      'rtos': 'FreeRTOS/Zephyr',
      'compiler': 'LLVM/Custom',
      'interpreter': 'Custom VM',
      'network_stack': 'Custom TCP/IP',
      'crypto_library': 'Custom Crypto',
      'memory_allocator': 'Custom Allocator',
      'file_system': 'VFS/Custom FS',
      'hypervisor': 'KVM/Custom VMM',
      'debugger': 'ptrace/Custom',
      'emulator': 'Custom Emulator'
    };
    return frameworks[projectType] || 'Custom';
  }

  /**
   * 📁 Retorna estrutura de pastas para tipo de projeto
   */
  private getLowLevelStructure(projectType: LowLevelProjectType): string {
    const structures: Record<LowLevelProjectType, string> = {
      'operating_system': 'boot/ kernel/ userspace/ drivers/',
      'kernel_module': 'src/ include/ Kbuild',
      'device_driver': 'src/ include/ tests/',
      'bootloader': 'stage1/ stage2/ common/',
      'firmware': 'src/ hal/ drivers/ app/',
      'rtos': 'kernel/ tasks/ drivers/',
      'compiler': 'lexer/ parser/ codegen/ tests/',
      'interpreter': 'lexer/ parser/ vm/ stdlib/',
      'network_stack': 'link/ ip/ tcp/ udp/',
      'crypto_library': 'symmetric/ asymmetric/ hash/ kdf/',
      'memory_allocator': 'src/ tests/ benchmarks/',
      'file_system': 'fs/ vfs/ tests/',
      'hypervisor': 'vmm/ cpu/ memory/ io/',
      'debugger': 'core/ ui/ symbols/',
      'emulator': 'cpu/ memory/ io/ frontend/'
    };
    return structures[projectType] || 'src/';
  }

  /**
   * 🛠️ Retorna tech stack para projeto low-level
   */
  private getLowLevelTechStack(request: LowLevelRequest): string[] {
    const stack: string[] = [request.primaryLanguage];

    // Adicionar ferramentas comuns
    if (request.primaryLanguage === 'rust') {
      stack.push('Cargo', 'rustc', 'rust-analyzer');
    } else if (request.primaryLanguage === 'c' || request.primaryLanguage === 'cpp') {
      stack.push('GCC/Clang', 'Make/CMake', 'GDB');
    }

    // Adicionar por tipo de projeto
    if (request.projectType === 'operating_system' || request.projectType === 'bootloader') {
      stack.push('NASM', 'QEMU', 'xorriso');
    }
    if (request.projectType === 'kernel_module') {
      stack.push('Linux Headers', 'insmod/rmmod');
    }

    stack.push(request.targetArchitecture || 'x86_64');

    return stack;
  }

  /**
   * 📊 Calcula score de qualidade para projeto low-level
   */
  private calculateLowLevelQualityScore(
    files: Array<{ path: string; content: string }>,
    request: LowLevelRequest
  ): number {
    let score = 100;

    // Verificar quantidade de arquivos
    if (files.length === 0) score -= 50;
    else if (files.length < 3) score -= 20;

    // Verificar se tem arquivo principal
    const hasMain = files.some(f =>
      f.path.includes('main.') ||
      f.path.includes('boot.') ||
      f.path.includes('kernel.')
    );
    if (!hasMain) score -= 15;

    // Verificar se tem build system
    const hasBuild = files.some(f =>
      f.path.includes('Makefile') ||
      f.path.includes('Cargo.toml') ||
      f.path.includes('CMakeLists')
    );
    if (!hasBuild) score -= 10;

    // Verificar se tem README
    const hasReadme = files.some(f => f.path.toLowerCase().includes('readme'));
    if (!hasReadme) score -= 5;

    // Verificar se usa a linguagem correta
    const usesCorrectLang = files.some(f => {
      const ext = f.path.split('.').pop();
      const langExts: Record<string, string[]> = {
        'rust': ['rs'],
        'c': ['c', 'h'],
        'cpp': ['cpp', 'cc', 'hpp', 'h'],
        'assembly': ['asm', 's'],
        'zig': ['zig'],
        'go': ['go']
      };
      return langExts[request.primaryLanguage]?.includes(ext || '') || false;
    });
    if (!usesCorrectLang) score -= 20;

    // Verificar se tem linker script (para OS/bootloader)
    if (['operating_system', 'bootloader', 'firmware'].includes(request.projectType)) {
      const hasLinker = files.some(f => f.path.includes('.ld') || f.path.includes('linker'));
      if (!hasLinker) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  // ============================================
  // 📱 MOBILE ARCHITECT - BUILD MOBILE APPS
  // ============================================

  /**
   * 📱 Constrói aplicação mobile completa (Android/iOS)
   * 
   * FLUXO:
   * 1. Detecta plataforma e framework ideal
   * 2. Gera arquitetura mobile (Clean Architecture + MVVM)
   * 3. Gera código nativo (Kotlin/Swift) ou híbrido (Flutter/RN)
   * 4. Gera backend Go integrado
   * 5. Gera CI/CD para App Store / Play Store
   */
  private async buildMobile(
    request: AuroraRequest,
    startTime: number,
    designDoc?: GeneratedDesignDoc
  ): Promise<AuroraResult> {
    this.log('\n📱 MOBILE ARCHITECT - GERANDO APP MOBILE COMPLETO');

    // Gerar arquitetura e arquivos via MobileArchitect
    const mobileResult = await this.mobileArchitect.generate({
      userPrompt: request.userPrompt,
      platform: request.mobilePlatform,
      framework: request.mobileFramework,
      appName: request.appName,
      packageName: request.packageName,
      needsBackend: true,
      complexity: request.complexity as any
    });

    // Adicionar contexto mobile ao request
    request.context = (request.context || '') + '\n' + mobileResult.auroraContext;

    this.log(`✅ Plataforma: ${mobileResult.platform}`);
    this.log(`✅ Framework: ${mobileResult.framework}`);
    this.log(`✅ Arquivos gerados: ${mobileResult.files.length}`);

    // Converter arquivos do MobileArchitect para formato ArtisanCode
    const files = mobileResult.files.map(f => ({
      path: f.path,
      content: f.content,
      language: f.language
    }));

    // Criar blueprint
    const blueprint: ArchitectureBlueprint = {
      projectName: request.appName || this.extractProjectName(request.userPrompt),
      description: request.userPrompt,
      architecture: {
        frontend: {
          framework: this.getMobileFrameworkName(mobileResult.framework),
          libraries: this.getMobileLibraries(mobileResult.framework),
          structure: 'Clean Architecture + MVVM'
        },
        backend: mobileResult.architecture.structure.backend ? {
          language: 'Go',
          framework: 'Gin',
          database: 'PostgreSQL',
          structure: 'Hexagonal Architecture'
        } : undefined,
        infrastructure: {
          deployment: 'App Store / Play Store',
          containerization: 'Docker (Backend)',
          cicd: 'GitHub Actions + Fastlane'
        }
      },
      techStack: this.getMobileTechStack(mobileResult),
      fileStructure: this.buildFileStructure(files),
      reasoning: `App mobile ${mobileResult.platform} usando ${mobileResult.framework} com backend Go integrado`
    };

    // Calcular score
    const qualityScore = this.calculateMobileQualityScore(files, mobileResult);

    const code: ArtisanCode = {
      files,
      qualityScore,
      improvements: [],
      readyForProduction: qualityScore >= 85
    };

    const executionTime = Date.now() - startTime;

    this.log(`\n🎯 MOBILE BUILD COMPLETO!`);
    this.log(`📊 Arquivos: ${files.length}`);
    this.log(`📊 Score: ${qualityScore}/100`);
    this.log(`⏱️ Tempo: ${(executionTime / 1000).toFixed(2)}s`);

    return {
      blueprint,
      code,
      totalScore: qualityScore,
      executionTime,
      logs: [...this.logs],
      designDoc,
      mobileResult
    };
  }

  /**
   * 📱 Retorna nome amigável do framework mobile
   */
  private getMobileFrameworkName(framework: MobileFramework): string {
    const names: Record<MobileFramework, string> = {
      'kotlin_native': 'Kotlin + Jetpack Compose',
      'swift_native': 'Swift + SwiftUI',
      'react_native': 'React Native',
      'flutter': 'Flutter + Dart',
      'capacitor': 'Capacitor + Ionic',
      'webview': 'WebView + PWA',
      'kotlin_multiplatform': 'Kotlin Multiplatform'
    };
    return names[framework] || framework;
  }

  /**
   * 📱 Retorna bibliotecas do framework mobile
   */
  private getMobileLibraries(framework: MobileFramework): string[] {
    const libs: Record<MobileFramework, string[]> = {
      'kotlin_native': ['Hilt', 'Retrofit', 'Room', 'Coil', 'Navigation Compose'],
      'swift_native': ['Combine', 'SwiftData', 'Alamofire', 'Kingfisher'],
      'react_native': ['React Navigation', 'React Query', 'Zustand', 'Axios'],
      'flutter': ['Riverpod', 'Dio', 'Hive', 'Go Router'],
      'capacitor': ['Ionic', 'Capacitor Plugins'],
      'webview': ['Service Worker', 'IndexedDB'],
      'kotlin_multiplatform': ['Ktor', 'SQLDelight', 'Koin']
    };
    return libs[framework] || [];
  }

  /**
   * 📱 Retorna tech stack completa do projeto mobile
   */
  private getMobileTechStack(result: MobileArchitectResult): string[] {
    const stack: string[] = [];

    // Framework principal
    stack.push(this.getMobileFrameworkName(result.framework));

    // Plataformas
    if (result.platform === 'android' || result.platform === 'both') {
      stack.push('Android', 'Kotlin', 'Jetpack Compose');
    }
    if (result.platform === 'ios' || result.platform === 'both') {
      stack.push('iOS', 'Swift', 'SwiftUI');
    }

    // Backend
    if (result.architecture.structure.backend) {
      stack.push('Go', 'Gin', 'PostgreSQL', 'Redis', 'JWT');
    }

    // Infra
    stack.push('Docker', 'GitHub Actions');

    return [...new Set(stack)]; // Remove duplicatas
  }

  /**
   * 📱 Calcula score de qualidade para projeto mobile
   */
  private calculateMobileQualityScore(
    files: Array<{ path: string; content: string }>,
    result: MobileArchitectResult
  ): number {
    let score = 100;

    // Verificar quantidade de arquivos
    if (files.length === 0) score -= 50;
    else if (files.length < 5) score -= 20;
    else if (files.length < 10) score -= 10;

    // Verificar arquivos Android
    if (result.platform === 'android' || result.platform === 'both') {
      const hasAndroidManifest = files.some(f => f.path.includes('AndroidManifest'));
      const hasBuildGradle = files.some(f => f.path.includes('build.gradle'));
      const hasMainActivity = files.some(f => f.path.includes('MainActivity'));

      if (!hasAndroidManifest) score -= 10;
      if (!hasBuildGradle) score -= 10;
      if (!hasMainActivity) score -= 5;
    }

    // Verificar arquivos iOS
    if (result.platform === 'ios' || result.platform === 'both') {
      const hasAppSwift = files.some(f => f.path.includes('App.swift'));
      const hasContentView = files.some(f => f.path.includes('ContentView'));

      if (!hasAppSwift) score -= 10;
      if (!hasContentView) score -= 5;
    }

    // Verificar backend
    if (result.architecture.structure.backend) {
      const hasMainGo = files.some(f => f.path.includes('main.go'));
      const hasDockerfile = files.some(f => f.path.includes('Dockerfile'));

      if (!hasMainGo) score -= 10;
      if (!hasDockerfile) score -= 5;
    }

    // Verificar README
    const hasReadme = files.some(f => f.path.toLowerCase().includes('readme'));
    if (!hasReadme) score -= 5;

    // Verificar CI/CD
    const hasCI = files.some(f => f.path.includes('.github/workflows'));
    if (!hasCI) score -= 5;

    return Math.max(0, Math.min(100, score));
  }
}

// ============================================
// EXPORTAÇÕES
// ============================================

export default AuroraBuilder;
export { ThreePhasePipeline } from '../../services/ThreePhasePipeline';
export { LowLevelArchitect } from './LowLevelArchitect';
export { DesignDocArchitect } from './DesignDocArchitect';
export { MobileArchitect } from './MobileArchitect';
