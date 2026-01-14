/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🏢 ENTERPRISE PIPELINE - SISTEMA DE MÚLTIPLAS CHAMADAS 🏢           ║
 * ║                                                                              ║
 * ║     "3-5 CHAMADAS ESPECIALIZADAS → MÁXIMO OUTPUT → EMPRESA COMPLETA"        ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * PROBLEMA RESOLVIDO:
 * - 1 chamada com 70+ manifestos = ~3.000 linhas (contexto muito grande)
 * - 5 chamadas com manifesto FOCADO = ~8.000 linhas CADA = ~40.000 linhas total
 * 
 * ARQUITETURA:
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  CHAMADA 1: 🧠 ARQUITETO     → Blueprint + Contratos + Schema              │
 * │  CHAMADA 2: ⚙️ BACKEND       → APIs + Services + Auth + Testes             │
 * │  CHAMADA 3: 🎨 FRONTEND      → Pages + Components + Hooks + Styles         │
 * │  CHAMADA 4: 🔗 INTEGRAÇÃO    → Conexão + WebSocket + Estado Global         │
 * │  CHAMADA 5: 📚 DEVOPS        → Docker + CI/CD + Docs + Deploy              │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * CADA CHAMADA:
 * - Recebe APENAS o manifesto específico (não todos os 70+)
 * - Recebe contexto COMPLETO das fases anteriores
 * - Gera MÁXIMO de código possível (~8K+ linhas)
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';

// ═══════════════════════════════════════════════════════════════════════════════
// CHECKPOINT STORAGE KEY
// ═══════════════════════════════════════════════════════════════════════════════

const CHECKPOINT_STORAGE_KEY = 'enterprise_pipeline_checkpoint';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export type PipelineMode = 3 | 4 | 5;

export interface PipelineCheckpoint {
  id: string;
  userPrompt: string;
  mode: PipelineMode;
  completedPhases: PhaseOutput[];
  currentPhaseId: number;
  timestamp: number;
  projectType?: string;
}

export interface EnterprisePhase {
  id: number;
  name: string;
  emoji: string;
  description: string;
  manifestKey: string;
  outputExpectation: string;
}

export interface PhaseOutput {
  phase: number;
  phaseName: string;
  files: GeneratedFile[];
  contracts?: APIContract[];
  schema?: string;
  summary: string;
  linesOfCode: number;
  executionTimeMs: number;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  category: 'backend' | 'frontend' | 'config' | 'docs' | 'test' | 'infra';
}

export interface APIContract {
  method: string;
  path: string;
  description: string;
  requestBody?: string;
  responseBody?: string;
}

export interface EnterprisePipelineRequest {
  userPrompt: string;
  mode: PipelineMode;
  projectType?: 'fintech' | 'saas' | 'ecommerce' | 'social' | 'enterprise' | 'auto';
  onPhaseStart?: (phase: EnterprisePhase) => void;
  onPhaseProgress?: (phase: number, message: string, progress: number) => void;
  onPhaseComplete?: (output: PhaseOutput) => void;
  onStreamChunk?: (phase: number, chunk: string) => void;
}

export interface EnterprisePipelineResult {
  success: boolean;
  phases: PhaseOutput[];
  totalFiles: number;
  totalLinesOfCode: number;
  executionTimeMs: number;
  projectStructure: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFINIÇÃO DAS FASES
// ═══════════════════════════════════════════════════════════════════════════════

const ENTERPRISE_PHASES: EnterprisePhase[] = [
  {
    id: 1,
    name: 'Arquiteto',
    emoji: '🧠',
    description: 'Análise, planejamento, contratos de API e schema de banco',
    manifestKey: 'ARCHITECT',
    outputExpectation: 'Blueprint completo, OpenAPI spec, Prisma schema, estrutura de pastas'
  },
  {
    id: 2,
    name: 'Backend',
    emoji: '⚙️',
    description: 'APIs completas, services, repositories, auth, middleware',
    manifestKey: 'BACKEND',
    outputExpectation: 'Servidor completo em Go ou Node.js com todas as rotas implementadas'
  },
  {
    id: 3,
    name: 'Frontend',
    emoji: '🎨',
    description: 'UI completa, componentes, páginas, design system',
    manifestKey: 'FRONTEND',
    outputExpectation: 'Aplicação React/Next.js completa com Tailwind e Shadcn'
  },
  {
    id: 4,
    name: 'Integração',
    emoji: '🔗',
    description: 'Conexão frontend-backend, estado global, real-time',
    manifestKey: 'INTEGRATION',
    outputExpectation: 'API clients, hooks, WebSocket, error handling, loading states'
  },
  {
    id: 5,
    name: 'DevOps',
    emoji: '📚',
    description: 'Docker, CI/CD, documentação, testes E2E',
    manifestKey: 'DEVOPS',
    outputExpectation: 'Dockerfile, docker-compose, GitHub Actions, README completo'
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// MANIFESTOS FOCADOS POR FASE (Compactos para maximizar output)
// ═══════════════════════════════════════════════════════════════════════════════

const PHASE_MANIFESTS = {
  ARCHITECT: `
🧠 VOCÊ É O ARQUITETO-CHEFE. SUA MISSÃO: PLANEJAR TUDO.

REGRAS ABSOLUTAS:
1. Analise o pedido e identifique TODAS as funcionalidades necessárias
2. Defina a arquitetura completa (monolito ou microserviços)
3. Crie contratos de API detalhados (OpenAPI/Swagger)
4. Defina schema de banco de dados (Prisma ou SQL)
5. Liste TODOS os arquivos que serão criados nas próximas fases

OUTPUT OBRIGATÓRIO:
1. architecture.json - Decisões arquiteturais
2. openapi.yaml - Contratos de TODAS as APIs
3. schema.prisma - Schema completo do banco
4. project-structure.md - Estrutura de pastas
5. phase2-instructions.md - Instruções detalhadas para o Backend

FORMATO DE SAÍDA:
===FILE: caminho/arquivo.ext===
LANGUAGE: linguagem
---
conteúdo
---

NÃO ECONOMIZE. Seja EXTREMAMENTE detalhado nos contratos.
`,

  BACKEND: `
⚙️ VOCÊ É O ENGENHEIRO DE BACKEND SÊNIOR. SUA MISSÃO: IMPLEMENTAR TUDO.

VOCÊ RECEBE:
- Contratos de API da Fase 1
- Schema de banco da Fase 1
- Instruções do Arquiteto

REGRAS ABSOLUTAS:
1. Implemente TODAS as rotas definidas nos contratos
2. Crie services com lógica de negócio COMPLETA
3. Implemente autenticação JWT com refresh tokens
4. Adicione validação em TODAS as entradas
5. Crie testes unitários para cada service
6. Use transações atômicas para operações críticas

STACK PADRÃO:
- Go (Gin/Fiber) OU Node.js (Hono/Fastify)
- PostgreSQL com Prisma
- JWT + bcrypt
- Zod para validação

OUTPUT: Código COMPLETO e FUNCIONAL. Sem TODOs, sem placeholders.
Gere o MÁXIMO de código possível. Cada arquivo deve estar 100% implementado.
`,

  FRONTEND: `
🎨 VOCÊ É O DESIGNER/FRONTEND LEAD. SUA MISSÃO: CRIAR A UI COMPLETA.

VOCÊ RECEBE:
- Contratos de API (endpoints disponíveis)
- Schema de dados (modelos)
- Instruções das fases anteriores

REGRAS ABSOLUTAS:
1. Crie TODAS as páginas necessárias
2. Implemente componentes reutilizáveis
3. Use Tailwind CSS + Shadcn/UI
4. Adicione animações com Framer Motion
5. Implemente responsividade (mobile-first)
6. Adicione acessibilidade (ARIA, labels)

STACK PADRÃO:
- Next.js 14+ ou React + Vite
- TypeScript obrigatório
- Tailwind CSS
- Shadcn/UI components
- Zustand para estado
- React Hook Form + Zod

OUTPUT: UI COMPLETA e BONITA. Cada componente deve estar estilizado.
Gere o MÁXIMO de código possível. Sem componentes vazios.
`,

  INTEGRATION: `
🔗 VOCÊ É O ESPECIALISTA EM INTEGRAÇÃO. SUA MISSÃO: CONECTAR TUDO.

VOCÊ RECEBE:
- Backend completo (APIs implementadas)
- Frontend completo (UI implementada)
- Contratos de API

REGRAS ABSOLUTAS:
1. Crie API clients tipados para TODAS as rotas
2. Implemente hooks customizados (useAuth, useData, etc.)
3. Configure estado global (Zustand stores)
4. Adicione WebSocket se necessário
5. Implemente tratamento de erros global
6. Adicione loading states e skeleton loaders
7. Configure interceptors para auth

OUTPUT:
- services/api/*.ts - Clients para cada domínio
- hooks/use*.ts - Hooks customizados
- stores/*.ts - Zustand stores
- lib/axios.ts - Configuração do cliente HTTP
- types/*.ts - Tipos compartilhados

Gere código que CONECTE PERFEITAMENTE frontend e backend.
`,

  DEVOPS: `
📚 VOCÊ É O DEVOPS/SRE SÊNIOR. SUA MISSÃO: PREPARAR PARA PRODUÇÃO.

VOCÊ RECEBE:
- Projeto completo (backend + frontend + integração)
- Estrutura de pastas
- Dependências

REGRAS ABSOLUTAS:
1. Crie Dockerfiles otimizados (multi-stage build)
2. Configure docker-compose para dev e prod
3. Crie GitHub Actions para CI/CD
4. Escreva README.md COMPLETO
5. Adicione testes E2E (Playwright)
6. Configure variáveis de ambiente
7. Adicione scripts de deploy

OUTPUT:
- Dockerfile (backend)
- Dockerfile (frontend)
- docker-compose.yml
- docker-compose.prod.yml
- .github/workflows/ci.yml
- .github/workflows/deploy.yml
- README.md (completo com screenshots)
- DEPLOYMENT.md
- .env.example
- tests/e2e/*.spec.ts

Gere configurações PRONTAS PARA PRODUÇÃO.
`
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL: ENTERPRISE PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════

export class EnterprisePipeline {
  private genAI: GoogleGenAI | null = null;
  private model = 'gemini-2.0-flash-exp';
  private phaseOutputs: PhaseOutput[] = [];
  private currentCheckpoint: PipelineCheckpoint | null = null;
  private abortController: AbortController | null = null;
  
  constructor() {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }
  
  /**
   * 💾 Salva checkpoint para continuar depois
   */
  saveCheckpoint(userPrompt: string, mode: PipelineMode, currentPhaseId: number): void {
    const checkpoint: PipelineCheckpoint = {
      id: `checkpoint_${Date.now()}`,
      userPrompt,
      mode,
      completedPhases: [...this.phaseOutputs],
      currentPhaseId,
      timestamp: Date.now()
    };
    
    this.currentCheckpoint = checkpoint;
    
    try {
      localStorage.setItem(CHECKPOINT_STORAGE_KEY, JSON.stringify(checkpoint));
      console.log('💾 Checkpoint salvo:', checkpoint.id);
    } catch (error) {
      console.warn('⚠️ Erro ao salvar checkpoint:', error);
    }
  }
  
  /**
   * 📂 Carrega checkpoint salvo
   */
  loadCheckpoint(): PipelineCheckpoint | null {
    try {
      const saved = localStorage.getItem(CHECKPOINT_STORAGE_KEY);
      if (saved) {
        const checkpoint = JSON.parse(saved) as PipelineCheckpoint;
        console.log('📂 Checkpoint carregado:', checkpoint.id);
        return checkpoint;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar checkpoint:', error);
    }
    return null;
  }
  
  /**
   * 🗑️ Limpa checkpoint
   */
  clearCheckpoint(): void {
    this.currentCheckpoint = null;
    try {
      localStorage.removeItem(CHECKPOINT_STORAGE_KEY);
      console.log('🗑️ Checkpoint limpo');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar checkpoint:', error);
    }
  }
  
  /**
   * ⏸️ Pausa a execução (para continuar depois)
   */
  pause(): void {
    if (this.abortController) {
      this.abortController.abort();
      console.log('⏸️ Pipeline pausado');
    }
  }
  
  /**
   * ▶️ Continua de um checkpoint
   */
  async resumeFromCheckpoint(
    checkpoint: PipelineCheckpoint,
    request: Partial<EnterprisePipelineRequest>
  ): Promise<EnterprisePipelineResult> {
    console.log('▶️ Continuando do checkpoint:', checkpoint.id);
    
    // Restaurar estado
    this.phaseOutputs = checkpoint.completedPhases;
    
    // Continuar execução
    return this.execute({
      userPrompt: checkpoint.userPrompt,
      mode: checkpoint.mode,
      ...request,
      _resumeFromPhase: checkpoint.currentPhaseId
    } as EnterprisePipelineRequest & { _resumeFromPhase?: number });
  }
  
  /**
   * 🔄 Verifica se há checkpoint pendente
   */
  hasPendingCheckpoint(): boolean {
    const checkpoint = this.loadCheckpoint();
    return checkpoint !== null && checkpoint.completedPhases.length < checkpoint.mode;
  }
  
  /**
   * 🚀 EXECUTA O PIPELINE ENTERPRISE COMPLETO
   */
  async execute(request: EnterprisePipelineRequest & { _resumeFromPhase?: number }): Promise<EnterprisePipelineResult> {
    const startTime = Date.now();
    this.abortController = new AbortController();
    
    // Se não estiver resumindo, limpar outputs anteriores
    if (!request._resumeFromPhase) {
      this.phaseOutputs = [];
    }
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🏢 ENTERPRISE PIPELINE INICIADO - ${request.mode} CHAMADAS           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
    
    // Selecionar fases baseado no modo
    const phases = this.selectPhases(request.mode);
    
    // Se estiver resumindo, pular fases já completadas
    const startFromIndex = request._resumeFromPhase 
      ? phases.findIndex(p => p.id === request._resumeFromPhase)
      : 0;
    
    if (startFromIndex > 0) {
      console.log(`▶️ Continuando da fase ${request._resumeFromPhase}`);
    }
    
    try {
      for (let i = startFromIndex; i < phases.length; i++) {
        const phase = phases[i];
        
        // Verificar se foi pausado
        if (this.abortController.signal.aborted) {
          console.log('⏸️ Pipeline pausado pelo usuário');
          this.saveCheckpoint(request.userPrompt, request.mode, phase.id);
          break;
        }
        
        request.onPhaseStart?.(phase);
        
        console.log(`\n${'═'.repeat(80)}`);
        console.log(`${phase.emoji} FASE ${phase.id}: ${phase.name.toUpperCase()}`);
        console.log(`${'═'.repeat(80)}\n`);
        
        const phaseStartTime = Date.now();
        
        // Salvar checkpoint antes de cada fase
        this.saveCheckpoint(request.userPrompt, request.mode, phase.id);
        
        // Executar fase
        const output = await this.executePhase(phase, request);
        
        output.executionTimeMs = Date.now() - phaseStartTime;
        this.phaseOutputs.push(output);
        
        request.onPhaseComplete?.(output);
        
        console.log(`✅ Fase ${phase.id} completa: ${output.files.length} arquivos, ${output.linesOfCode} linhas`);
      }
      
      // Calcular totais
      const totalFiles = this.phaseOutputs.reduce((sum, p) => sum + p.files.length, 0);
      const totalLines = this.phaseOutputs.reduce((sum, p) => sum + p.linesOfCode, 0);
      
      // Limpar checkpoint se completou com sucesso
      if (this.phaseOutputs.length === phases.length) {
        this.clearCheckpoint();
      }
      
      console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🎉 PIPELINE COMPLETO COM SUCESSO! 🎉                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  📁 Total de arquivos: ${String(totalFiles).padEnd(50)}║
║  📝 Total de linhas: ${String(totalLines).padEnd(52)}║
║  ⏱️ Tempo total: ${String((Date.now() - startTime) / 1000).padEnd(55)}s ║
╚══════════════════════════════════════════════════════════════════════════════╝
      `);
      
      return {
        success: true,
        phases: this.phaseOutputs,
        totalFiles,
        totalLinesOfCode: totalLines,
        executionTimeMs: Date.now() - startTime,
        projectStructure: this.generateProjectStructure()
      };
      
    } catch (error) {
      console.error('❌ Erro no pipeline:', error);
      
      // Salvar checkpoint em caso de erro para poder continuar depois
      const nextPhaseIndex = this.phaseOutputs.length;
      if (nextPhaseIndex < phases.length) {
        this.saveCheckpoint(request.userPrompt, request.mode, phases[nextPhaseIndex].id);
      }
      
      return {
        success: false,
        phases: this.phaseOutputs,
        totalFiles: this.phaseOutputs.reduce((sum, p) => sum + p.files.length, 0),
        totalLinesOfCode: this.phaseOutputs.reduce((sum, p) => sum + p.linesOfCode, 0),
        executionTimeMs: Date.now() - startTime,
        projectStructure: ''
      };
    }
  }

  
  /**
   * 🎯 Seleciona as fases baseado no modo (3, 4 ou 5 chamadas)
   */
  private selectPhases(mode: PipelineMode): EnterprisePhase[] {
    switch (mode) {
      case 3:
        // Modo compacto: Arquiteto + Backend+Frontend combinado + DevOps
        return [
          ENTERPRISE_PHASES[0], // Arquiteto
          { ...ENTERPRISE_PHASES[1], name: 'Fullstack', description: 'Backend + Frontend completos' },
          ENTERPRISE_PHASES[4]  // DevOps
        ];
      case 4:
        // Modo balanceado: Arquiteto + Backend + Frontend + DevOps
        return [
          ENTERPRISE_PHASES[0], // Arquiteto
          ENTERPRISE_PHASES[1], // Backend
          ENTERPRISE_PHASES[2], // Frontend
          ENTERPRISE_PHASES[4]  // DevOps
        ];
      case 5:
        // Modo completo: Todas as 5 fases
        return ENTERPRISE_PHASES;
      default:
        return ENTERPRISE_PHASES;
    }
  }
  
  /**
   * ⚡ Executa uma fase individual
   */
  private async executePhase(
    phase: EnterprisePhase,
    request: EnterprisePipelineRequest
  ): Promise<PhaseOutput> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }
    
    // Construir prompt com contexto das fases anteriores
    const prompt = this.buildPhasePrompt(phase, request);
    
    request.onPhaseProgress?.(phase.id, 'Gerando código...', 10);
    
    let rawText = '';
    
    // Usar streaming se callback de chunk estiver disponível
    if (request.onStreamChunk) {
      rawText = await this.executePhaseWithStreaming(phase, prompt, request);
    } else {
      // Fazer chamada normal à API
      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents: [{ text: prompt }]
      });
      rawText = response.text || '';
    }
    
    request.onPhaseProgress?.(phase.id, 'Processando resposta...', 80);
    
    // Parsear arquivos da resposta
    const files = this.parseFiles(rawText, phase);
    
    // Extrair contratos se for fase de arquiteto
    const contracts = phase.id === 1 ? this.extractContracts(rawText) : undefined;
    
    // Extrair schema se for fase de arquiteto
    const schema = phase.id === 1 ? this.extractSchema(rawText) : undefined;
    
    // Calcular linhas de código
    const linesOfCode = files.reduce((sum, f) => sum + f.content.split('\n').length, 0);
    
    request.onPhaseProgress?.(phase.id, 'Fase completa!', 100);
    
    return {
      phase: phase.id,
      phaseName: phase.name,
      files,
      contracts,
      schema,
      summary: `${phase.emoji} ${phase.name}: ${files.length} arquivos, ${linesOfCode} linhas`,
      linesOfCode,
      executionTimeMs: 0 // Será preenchido depois
    };
  }
  
  /**
   * 🌊 Executa fase com streaming em tempo real
   */
  private async executePhaseWithStreaming(
    phase: EnterprisePhase,
    prompt: string,
    request: EnterprisePipelineRequest
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }
    
    let fullText = '';
    let chunkCount = 0;
    
    try {
      const stream = await this.genAI.models.generateContentStream({
        model: this.model,
        contents: [{ text: prompt }]
      });
      
      for await (const chunk of stream) {
        const text = chunk.text || '';
        fullText += text;
        chunkCount++;
        
        // Enviar chunk para callback
        request.onStreamChunk?.(phase.id, text);
        
        // Atualizar progresso baseado no tamanho do texto
        const estimatedProgress = Math.min(10 + (fullText.length / 500), 75);
        request.onPhaseProgress?.(phase.id, `Gerando... (${fullText.length} chars)`, estimatedProgress);
      }
      
      console.log(`🌊 Streaming completo: ${chunkCount} chunks, ${fullText.length} chars`);
      
    } catch (error) {
      console.error('❌ Erro no streaming:', error);
      throw error;
    }
    
    return fullText;
  }
  
  /**
   * 📝 Constrói o prompt para uma fase específica
   */
  private buildPhasePrompt(phase: EnterprisePhase, request: EnterprisePipelineRequest): string {
    const manifest = PHASE_MANIFESTS[phase.manifestKey as keyof typeof PHASE_MANIFESTS];
    
    let prompt = `
╔══════════════════════════════════════════════════════════════════════════════╗
║  ${phase.emoji} FASE ${phase.id}: ${phase.name.toUpperCase()}
║  ${phase.description}
╚══════════════════════════════════════════════════════════════════════════════╝

${manifest}

═══════════════════════════════════════════════════════════════════════════════
📋 PEDIDO DO USUÁRIO:
═══════════════════════════════════════════════════════════════════════════════

${request.userPrompt}

`;
    
    // Adicionar contexto das fases anteriores
    if (this.phaseOutputs.length > 0) {
      prompt += `
═══════════════════════════════════════════════════════════════════════════════
📦 CONTEXTO DAS FASES ANTERIORES:
═══════════════════════════════════════════════════════════════════════════════

`;
      
      for (const prevOutput of this.phaseOutputs) {
        prompt += `\n### ${prevOutput.phaseName} (Fase ${prevOutput.phase})\n`;
        prompt += `Arquivos gerados: ${prevOutput.files.map(f => f.path).join(', ')}\n\n`;
        
        // Incluir conteúdo dos arquivos mais importantes
        for (const file of prevOutput.files) {
          // Priorizar arquivos de contrato, schema e configuração
          const isImportant = 
            file.path.includes('openapi') ||
            file.path.includes('schema') ||
            file.path.includes('architecture') ||
            file.path.includes('instructions') ||
            file.path.includes('structure') ||
            file.category === 'config';
          
          if (isImportant || prevOutput.files.length <= 5) {
            prompt += `#### ${file.path}\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n\n`;
          }
        }
        
        // Incluir contratos se existirem
        if (prevOutput.contracts && prevOutput.contracts.length > 0) {
          prompt += `\n#### Contratos de API:\n`;
          for (const contract of prevOutput.contracts) {
            prompt += `- ${contract.method} ${contract.path}: ${contract.description}\n`;
          }
        }
      }
    }
    
    prompt += `
═══════════════════════════════════════════════════════════════════════════════
🎯 EXECUTE A FASE ${phase.id} AGORA!
═══════════════════════════════════════════════════════════════════════════════

LEMBRE-SE:
- Gere o MÁXIMO de código possível
- Cada arquivo deve estar 100% implementado
- Sem TODOs, sem placeholders, sem "..."
- Use o formato ===FILE: caminho=== para cada arquivo

COMECE AGORA!
`;
    
    return prompt;
  }
  
  /**
   * 📦 Parseia arquivos da resposta
   */
  private parseFiles(response: string, phase: EnterprisePhase): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    
    // Formato: ===FILE: path=== LANGUAGE: lang --- content ---
    const fileRegex = /===FILE:\s*(.+?)===\s*\n(?:LANGUAGE:\s*(.+?)\s*\n)?---\n([\s\S]*?)---/g;
    let match;
    
    while ((match = fileRegex.exec(response)) !== null) {
      const path = match[1].trim();
      const language = match[2]?.trim() || this.detectLanguage(path);
      const content = match[3].trim();
      
      files.push({
        path,
        language,
        content,
        category: this.detectCategory(path, phase)
      });
    }
    
    // Fallback: extrair blocos de código markdown
    if (files.length === 0) {
      const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)```/g;
      let blockMatch;
      let fileIndex = 0;
      
      while ((blockMatch = codeBlockRegex.exec(response)) !== null) {
        const language = blockMatch[1] || 'text';
        const content = blockMatch[2].trim();
        
        if (content.length > 50) { // Ignorar blocos muito pequenos
          const path = this.inferFilePath(content, language, fileIndex);
          
          files.push({
            path,
            language,
            content,
            category: this.detectCategory(path, phase)
          });
          fileIndex++;
        }
      }
    }
    
    return files;
  }
  
  /**
   * 🔍 Detecta linguagem pelo caminho do arquivo
   */
  private detectLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'go': 'go',
      'py': 'python',
      'sql': 'sql',
      'prisma': 'prisma',
      'yaml': 'yaml',
      'yml': 'yaml',
      'json': 'json',
      'md': 'markdown',
      'html': 'html',
      'css': 'css',
      'dockerfile': 'dockerfile'
    };
    return langMap[ext] || 'text';
  }
  
  /**
   * 📁 Detecta categoria do arquivo
   */
  private detectCategory(path: string, phase: EnterprisePhase): GeneratedFile['category'] {
    const pathLower = path.toLowerCase();
    
    if (pathLower.includes('test') || pathLower.includes('spec')) return 'test';
    if (pathLower.includes('docker') || pathLower.includes('.github') || pathLower.includes('.env')) return 'infra';
    if (pathLower.includes('readme') || pathLower.includes('.md')) return 'docs';
    if (pathLower.includes('config') || pathLower.includes('package.json') || pathLower.includes('tsconfig')) return 'config';
    
    // Baseado na fase
    if (phase.id === 2) return 'backend';
    if (phase.id === 3) return 'frontend';
    if (phase.id === 5) return 'infra';
    
    return 'backend';
  }
  
  /**
   * 🔮 Infere caminho do arquivo pelo conteúdo
   */
  private inferFilePath(content: string, language: string, index: number): string {
    // Detectar tipo de arquivo pelo conteúdo
    if (content.includes('package main') || content.includes('func main')) return 'backend/main.go';
    if (content.includes('FROM ') && content.includes('COPY')) return 'Dockerfile';
    if (content.includes('version:') && content.includes('services:')) return 'docker-compose.yml';
    if (content.includes('openapi:') || content.includes('swagger:')) return 'openapi.yaml';
    if (content.includes('generator client')) return 'prisma/schema.prisma';
    if (content.includes('import React') || content.includes('export default function')) {
      return `frontend/src/components/Component${index}.tsx`;
    }
    if (content.includes('# ') && content.includes('##')) return 'README.md';
    if (content.includes('CREATE TABLE') || content.includes('ALTER TABLE')) return 'database/schema.sql';
    if (content.includes('name: CI') || content.includes('on: push')) return '.github/workflows/ci.yml';
    
    // Fallback baseado na linguagem
    const extMap: Record<string, string> = {
      'typescript': 'ts',
      'javascript': 'js',
      'go': 'go',
      'python': 'py',
      'yaml': 'yml',
      'json': 'json',
      'markdown': 'md'
    };
    
    return `file${index}.${extMap[language] || 'txt'}`;
  }
  
  /**
   * 📋 Extrai contratos de API da resposta
   */
  private extractContracts(response: string): APIContract[] {
    const contracts: APIContract[] = [];
    
    // Procurar por padrões de endpoint
    const endpointRegex = /(GET|POST|PUT|PATCH|DELETE)\s+([\/\w\-\{\}:]+)\s*[-:]\s*(.+)/gi;
    let match;
    
    while ((match = endpointRegex.exec(response)) !== null) {
      contracts.push({
        method: match[1].toUpperCase(),
        path: match[2],
        description: match[3].trim()
      });
    }
    
    return contracts;
  }
  
  /**
   * 🗄️ Extrai schema de banco da resposta
   */
  private extractSchema(response: string): string | undefined {
    // Procurar por bloco de schema Prisma ou SQL
    const prismaMatch = response.match(/```prisma\n([\s\S]*?)```/);
    if (prismaMatch) return prismaMatch[1].trim();
    
    const sqlMatch = response.match(/```sql\n([\s\S]*?)```/);
    if (sqlMatch) return sqlMatch[1].trim();
    
    return undefined;
  }
  
  /**
   * 📊 Gera estrutura visual do projeto
   */
  private generateProjectStructure(): string {
    const allFiles = this.phaseOutputs.flatMap(p => p.files);
    const paths = allFiles.map(f => f.path).sort();
    
    let structure = '📁 Estrutura do Projeto\n';
    structure += '========================\n\n';
    
    for (const path of paths) {
      const depth = path.split('/').length - 1;
      const indent = '  '.repeat(depth);
      const fileName = path.split('/').pop();
      structure += `${indent}├── ${fileName}\n`;
    }
    
    return structure;
  }
  
  /**
   * 📊 Retorna estatísticas do pipeline
   */
  getStats(): object {
    return {
      phasesCompleted: this.phaseOutputs.length,
      totalFiles: this.phaseOutputs.reduce((sum, p) => sum + p.files.length, 0),
      totalLines: this.phaseOutputs.reduce((sum, p) => sum + p.linesOfCode, 0),
      filesByCategory: this.getFilesByCategory()
    };
  }
  
  /**
   * 📁 Agrupa arquivos por categoria
   */
  private getFilesByCategory(): Record<string, number> {
    const categories: Record<string, number> = {};
    
    for (const output of this.phaseOutputs) {
      for (const file of output.files) {
        categories[file.category] = (categories[file.category] || 0) + 1;
      }
    }
    
    return categories;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO HELPER PARA USO DIRETO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Executa o pipeline enterprise de forma simplificada
 */
export async function executeEnterprisePipeline(
  userPrompt: string,
  mode: PipelineMode = 5,
  options?: Partial<EnterprisePipelineRequest>
): Promise<EnterprisePipelineResult> {
  const pipeline = new EnterprisePipeline();
  return pipeline.execute({
    userPrompt,
    mode,
    ...options
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const enterprisePipeline = new EnterprisePipeline();

export default EnterprisePipeline;
