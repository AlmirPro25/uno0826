/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║    🚀 ENTERPRISE PIPELINE EXECUTOR - EXECUÇÃO DE MULTI-CHAMADAS 🚀          ║
 * ║                                                                              ║
 * ║     RELAY RACE: Cada fase passa o bastão (contexto) para a próxima          ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo executa o pipeline enterprise com streaming em tempo real,
 * passando contexto entre fases como uma corrida de revezamento.
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';
import { 
  pipelineEvents, 
  type PipelineMode, 
  type PipelinePhase,
  PIPELINE_PHASES 
} from './PipelineEvents';
import {
  analyzeComplexity,
  buildPhasePrompt,
  parsePhaseOutput,
  saveCheckpoint,
  loadCheckpoint,
  clearCheckpoint,
  type PhaseContext,
  type PipelineCheckpoint,
  type ComplexityAnalysis
} from './EnterprisePipelineIntegration';

// 🔮 SOUL ARCHITECT - Meta-Cognição: Cria especialistas sob demanda
import { getSoulArchitect, type SoulForgeResult, type ForgedSoul } from './SoulArchitect';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🎯 MODO DE EXECUÇÃO DO PIPELINE
 * 
 * - 'single': UMA ÚNICA CHAMADA - Gera tudo de uma vez (8-10K linhas coesas)
 * - 'auto': Detecta automaticamente baseado na complexidade
 * - 1-5: Número específico de fases
 */
export type ExecutionMode = PipelineMode | 'auto' | 'single';

export interface ExecutorConfig {
  userPrompt: string;
  mode?: ExecutionMode;
  modelName?: string;
  enableSoulArchitect?: boolean; // 🔮 Ativar criação de especialista sob demanda
  onSoulForged?: (soul: ForgedSoul, systemPrompt: string) => void; // 🔮 Callback quando alma é forjada
  onStreamChunk?: (chunk: string, phase: PipelinePhase, accumulated: string) => void;
  onPhaseStart?: (phase: PipelinePhase, phaseName: string) => void;
  onPhaseComplete?: (phase: PipelinePhase, output: string, lines: number) => void;
  onComplete?: (totalOutput: string, totalLines: number) => void;
  onError?: (phase: PipelinePhase, error: Error) => void;
}

export interface ExecutorResult {
  success: boolean;
  mode: PipelineMode | 'single';
  totalOutput: string;
  totalLinesOfCode: number;
  phasesCompleted: number;
  executionTimeMs: number;
  complexity?: ComplexityAnalysis;
  forgedSoul?: ForgedSoul; // 🔮 Alma do especialista que gerou o código
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANIFESTO SINGLE SHOT - TUDO EM UMA CHAMADA
// ═══════════════════════════════════════════════════════════════════════════════

const SINGLE_SHOT_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🚀 MODO SINGLE SHOT - GERAÇÃO COMPLETA EM UMA CHAMADA 🚀            ║
║                                                                              ║
║     "MÁXIMO OUTPUT, MÁXIMA COESÃO, ZERO FRAGMENTAÇÃO"                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

VOCÊ É UM ARQUITETO FULLSTACK SUPREMO. SUA MISSÃO: GERAR O PROJETO COMPLETO.

═══════════════════════════════════════════════════════════════════════════════
🎯 REGRAS ABSOLUTAS
═══════════════════════════════════════════════════════════════════════════════

1. GERE TUDO DE UMA VEZ - Backend, Frontend, Integração, DevOps
2. MÁXIMO OUTPUT - Gere o máximo de código possível (8.000-15.000 linhas)
3. CÓDIGO COESO - Tudo deve funcionar junto, sem conflitos
4. ZERO PLACEHOLDERS - Sem TODOs, sem "...", sem código incompleto
5. PRODUÇÃO-READY - Código pronto para deploy

═══════════════════════════════════════════════════════════════════════════════
📁 ESTRUTURA OBRIGATÓRIA
═══════════════════════════════════════════════════════════════════════════════

Gere arquivos nestas pastas:

📂 prisma/
   └── schema.prisma          # Schema completo do banco

📂 backend/
   ├── src/
   │   ├── index.ts           # Entry point
   │   ├── routes/            # Todas as rotas
   │   ├── controllers/       # Controllers
   │   ├── services/          # Lógica de negócio
   │   ├── repositories/      # Acesso a dados
   │   ├── middleware/        # Auth, validation, etc
   │   └── types/             # Tipos TypeScript
   ├── package.json
   └── tsconfig.json

📂 frontend/
   ├── src/
   │   ├── App.tsx            # Componente principal
   │   ├── main.tsx           # Entry point
   │   ├── pages/             # Páginas
   │   ├── components/        # Componentes reutilizáveis
   │   ├── hooks/             # Custom hooks
   │   ├── services/          # API clients
   │   ├── stores/            # Estado global (Zustand)
   │   ├── types/             # Tipos
   │   └── styles/            # CSS/Tailwind
   ├── package.json
   ├── tailwind.config.js
   ├── vite.config.ts
   └── tsconfig.json

📂 docker/
   ├── Dockerfile.backend
   └── Dockerfile.frontend

📄 docker-compose.yml
📄 docker-compose.prod.yml
📄 .env.example
📄 README.md

═══════════════════════════════════════════════════════════════════════════════
⚙️ STACK PADRÃO
═══════════════════════════════════════════════════════════════════════════════

BACKEND:
- Node.js + Hono/Fastify
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT + bcrypt
- Zod validation

FRONTEND:
- React 18+ ou Next.js 14+
- TypeScript
- Tailwind CSS
- Shadcn/UI
- Zustand
- React Query
- React Hook Form + Zod

DEVOPS:
- Docker multi-stage
- GitHub Actions CI/CD
- Environment variables

═══════════════════════════════════════════════════════════════════════════════
📝 FORMATO DE SAÍDA (CRÍTICO!)
═══════════════════════════════════════════════════════════════════════════════

Para CADA arquivo, use EXATAMENTE este formato:

===FILE: caminho/completo/arquivo.ext===
LANGUAGE: linguagem
---
conteúdo completo do arquivo aqui
sem truncar, sem "...", sem placeholders
---

EXEMPLO:
===FILE: backend/src/index.ts===
LANGUAGE: typescript
---
import { Hono } from 'hono';
import { cors } from 'hono/cors';
// ... código completo
---

═══════════════════════════════════════════════════════════════════════════════
🔥 EXECUTE AGORA - GERE O PROJETO COMPLETO!
═══════════════════════════════════════════════════════════════════════════════

Lembre-se:
- Gere TODOS os arquivos necessários
- Cada arquivo deve estar 100% implementado
- O código deve funcionar junto (imports corretos, tipos consistentes)
- Inclua autenticação, validação, tratamento de erros
- Gere o MÁXIMO de código possível

COMECE AGORA!
`;

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL: ENTERPRISE PIPELINE EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════════

export class EnterprisePipelineExecutor {
  private genAI: GoogleGenAI | null = null;
  private modelName: string;
  private abortController: AbortController | null = null;
  private isPaused = false;
  private completedPhases: PhaseContext[] = [];
  private accumulatedOutput = '';
  private forgedSoul: ForgedSoul | null = null; // 🔮 Alma do especialista
  private systemInstruction: string = ''; // 🔮 System prompt forjado
  
  constructor(modelName: string = 'gemini-2.0-flash-exp') {
    this.modelName = modelName;
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }
  
  /**
   * 🚀 EXECUTA O PIPELINE ENTERPRISE
   * 
   * MODOS:
   * - 'single': UMA ÚNICA CHAMADA - Gera tudo de uma vez (8-10K linhas coesas)
   * - 'auto': Detecta automaticamente baseado na complexidade
   * - 1-5: Número específico de fases
   */
  async execute(config: ExecutorConfig): Promise<ExecutorResult> {
    const startTime = Date.now();
    this.abortController = new AbortController();
    this.isPaused = false;
    this.completedPhases = [];
    this.accumulatedOutput = '';
    this.forgedSoul = null;
    this.systemInstruction = '';
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🎯 MODO SINGLE SHOT - TUDO EM UMA CHAMADA
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (config.mode === 'single') {
      console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🚀 MODO SINGLE SHOT - GERAÇÃO COMPLETA EM UMA CHAMADA 🚀            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
      `);
      
      return this.executeSingleShot(config, startTime);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🔄 MODO MULTI-FASE (3-5 chamadas)
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Detectar modo automaticamente se necessário
    let mode: PipelineMode;
    let complexity: ComplexityAnalysis | undefined;
    
    if (config.mode === 'auto' || !config.mode) {
      complexity = analyzeComplexity(config.userPrompt);
      mode = complexity.mode;
    } else {
      mode = config.mode as PipelineMode;
    }
    
    // Se modo = 1, retornar para usar o fluxo normal do GeminiService
    if (mode === 1) {
      console.log('📝 Modo normal detectado - usando fluxo padrão do GeminiService');
      return {
        success: true,
        mode: 1,
        totalOutput: '',
        totalLinesOfCode: 0,
        phasesCompleted: 0,
        executionTimeMs: Date.now() - startTime,
        complexity
      };
    }
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🏢 ENTERPRISE PIPELINE INICIADO - ${mode} CHAMADAS                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🔮 SOUL ARCHITECT: Forjar especialista sob demanda (Meta-Cognição)
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (config.enableSoulArchitect !== false) { // Ativado por padrão
      console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🔮 SOUL ARCHITECT - FORJANDO ESPECIALISTA SOB DEMANDA 🔮            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
      `);
      
      try {
        const soulArchitect = getSoulArchitect();
        const soulResult = await soulArchitect.forgeAgentSoul(config.userPrompt);
        
        if (soulResult.success && soulResult.soul) {
          this.forgedSoul = soulResult.soul;
          this.systemInstruction = soulResult.systemPrompt;
          
          console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    👻 ESPECIALISTA FORJADO COM SUCESSO! 👻                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Nome: ${this.forgedSoul.name.substring(0, 60).padEnd(66)}║
║  Expertise: ${this.forgedSoul.expertise.slice(0, 3).join(', ').substring(0, 55).padEnd(61)}║
║  DNA: ${soulResult.selectedManifestos.slice(0, 4).join(', ').substring(0, 60).padEnd(67)}║
╚══════════════════════════════════════════════════════════════════════════════╝
          `);
          
          // Notificar callback se fornecido
          config.onSoulForged?.(this.forgedSoul, this.systemInstruction);
          
          // Adicionar header da alma ao output acumulado
          this.accumulatedOutput += `<!-- 🔮 ESPECIALISTA: ${this.forgedSoul.name} -->\n`;
          this.accumulatedOutput += `<!-- 🧬 DNA: ${soulResult.selectedManifestos.join(', ')} -->\n\n`;
        } else {
          console.log('⚠️ SoulArchitect não conseguiu forjar alma, continuando sem especialista...');
        }
      } catch (soulError) {
        console.error('⚠️ Erro no SoulArchitect (continuando sem especialista):', soulError);
      }
    }
    
    // Iniciar eventos do pipeline
    pipelineEvents.start(mode);
    
    // Obter fases para o modo
    const phases = pipelineEvents.getPhasesForMode(mode);
    
    try {
      for (let i = 0; i < phases.length; i++) {
        const phaseId = phases[i];
        const phaseInfo = PIPELINE_PHASES.find(p => p.id === phaseId)!;
        
        // Verificar se foi pausado ou abortado
        if (this.isPaused) {
          console.log('⏸️ Pipeline pausado');
          this.saveCurrentCheckpoint(config.userPrompt, mode, phaseId);
          break;
        }
        
        if (this.abortController.signal.aborted) {
          console.log('🛑 Pipeline abortado');
          break;
        }
        
        // Notificar início da fase
        config.onPhaseStart?.(phaseId, phaseInfo.name);
        
        console.log(`\n${'═'.repeat(80)}`);
        console.log(`${phaseInfo.emoji} FASE ${phaseId}: ${phaseInfo.name.toUpperCase()}`);
        console.log(`${'═'.repeat(80)}\n`);
        
        // Salvar checkpoint antes de cada fase
        this.saveCurrentCheckpoint(config.userPrompt, mode, phaseId);
        
        // Executar fase com streaming
        const phaseOutput = await this.executePhase(
          phaseId,
          config.userPrompt,
          config.onStreamChunk
        );
        
        // Parsear output
        const parsed = parsePhaseOutput(phaseOutput);
        
        // Criar contexto para próxima fase
        const phaseContext: PhaseContext = {
          phaseId,
          phaseName: phaseInfo.name,
          previousOutput: phaseOutput,
          contracts: parsed.contracts,
          schema: parsed.schema,
          generatedFiles: parsed.files,
          totalLinesGenerated: parsed.linesOfCode
        };
        
        this.completedPhases.push(phaseContext);
        this.accumulatedOutput += `\n\n${'='.repeat(80)}\n`;
        this.accumulatedOutput += `${phaseInfo.emoji} FASE ${phaseId}: ${phaseInfo.name}\n`;
        this.accumulatedOutput += `${'='.repeat(80)}\n\n`;
        this.accumulatedOutput += phaseOutput;
        
        // Notificar conclusão da fase
        config.onPhaseComplete?.(phaseId, phaseOutput, parsed.linesOfCode);
        pipelineEvents.completePhase(phaseId, parsed.files, parsed.linesOfCode);
        
        console.log(`✅ Fase ${phaseId} completa: ${parsed.files.length} arquivos, ${parsed.linesOfCode} linhas`);
      }
      
      // Calcular totais
      const totalLines = this.completedPhases.reduce((sum, p) => sum + p.totalLinesGenerated, 0);
      
      // Limpar checkpoint se completou com sucesso
      if (this.completedPhases.length === phases.length) {
        clearCheckpoint();
      }
      
      // Notificar conclusão
      config.onComplete?.(this.accumulatedOutput, totalLines);
      
      console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🎉 PIPELINE COMPLETO COM SUCESSO! 🎉                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  📝 Total de linhas: ${String(totalLines).padEnd(55)}║
║  ⏱️ Tempo total: ${String(((Date.now() - startTime) / 1000).toFixed(1) + 's').padEnd(59)}║
╚══════════════════════════════════════════════════════════════════════════════╝
      `);
      
      return {
        success: true,
        mode,
        totalOutput: this.accumulatedOutput,
        totalLinesOfCode: totalLines,
        phasesCompleted: this.completedPhases.length,
        executionTimeMs: Date.now() - startTime,
        complexity,
        forgedSoul: this.forgedSoul || undefined // 🔮 Incluir alma forjada
      };
      
    } catch (error) {
      const currentPhase = phases[this.completedPhases.length] || 1;
      console.error(`❌ Erro na fase ${currentPhase}:`, error);
      
      config.onError?.(currentPhase as PipelinePhase, error as Error);
      pipelineEvents.errorPhase(currentPhase as PipelinePhase, (error as Error).message);
      
      // Salvar checkpoint para poder continuar depois
      this.saveCurrentCheckpoint(config.userPrompt, mode, currentPhase as PipelinePhase);
      
      return {
        success: false,
        mode,
        totalOutput: this.accumulatedOutput,
        totalLinesOfCode: this.completedPhases.reduce((sum, p) => sum + p.totalLinesGenerated, 0),
        phasesCompleted: this.completedPhases.length,
        executionTimeMs: Date.now() - startTime,
        complexity,
        forgedSoul: this.forgedSoul || undefined // 🔮 Incluir alma forjada mesmo em erro
      };
    }
  }
  
  /**
   * 🚀 EXECUTA MODO SINGLE SHOT - TUDO EM UMA CHAMADA
   * 
   * Este modo gera o projeto completo em uma única chamada à API,
   * resultando em código mais coeso e consistente (8-10K+ linhas).
   */
  private async executeSingleShot(config: ExecutorConfig, startTime: number): Promise<ExecutorResult> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🔮 SOUL ARCHITECT: Forjar especialista (opcional)
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (config.enableSoulArchitect !== false) {
      try {
        const soulArchitect = getSoulArchitect();
        const soulResult = await soulArchitect.forgeAgentSoul(config.userPrompt);
        
        if (soulResult.success && soulResult.soul) {
          this.forgedSoul = soulResult.soul;
          this.systemInstruction = soulResult.systemPrompt;
          
          console.log(`🔮 Especialista forjado: ${this.forgedSoul.name}`);
          config.onSoulForged?.(this.forgedSoul, this.systemInstruction);
        }
      } catch (soulError) {
        console.warn('⚠️ SoulArchitect falhou, continuando sem especialista');
      }
    }
    
    // Notificar início (fase única = 1)
    config.onPhaseStart?.(1, 'Single Shot - Geração Completa');
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📝 CONSTRUIR PROMPT SINGLE SHOT
    // ═══════════════════════════════════════════════════════════════════════════
    
    const prompt = `
${SINGLE_SHOT_MANIFEST}

═══════════════════════════════════════════════════════════════════════════════
📋 PEDIDO DO USUÁRIO:
═══════════════════════════════════════════════════════════════════════════════

${config.userPrompt}

═══════════════════════════════════════════════════════════════════════════════
🔥 GERE O PROJETO COMPLETO AGORA!
═══════════════════════════════════════════════════════════════════════════════
`;

    // Adicionar system instruction se tiver alma forjada
    const finalPrompt = this.systemInstruction 
      ? `${this.systemInstruction}\n\n${'═'.repeat(80)}\n\n${prompt}`
      : prompt;
    
    let fullOutput = '';
    
    try {
      // ═══════════════════════════════════════════════════════════════════════════
      // 🌊 STREAMING EM TEMPO REAL
      // ═══════════════════════════════════════════════════════════════════════════
      
      const streamConfig: any = {
        model: this.modelName,
        contents: [{ text: finalPrompt }]
      };
      
      // Adicionar system instruction nativa se disponível
      if (this.systemInstruction && this.forgedSoul) {
        streamConfig.config = {
          systemInstruction: this.systemInstruction.substring(0, 8000)
        };
      }
      
      console.log('🌊 Iniciando streaming Single Shot...');
      
      const stream = await this.genAI.models.generateContentStream(streamConfig);
      
      for await (const chunk of stream) {
        if (this.abortController?.signal.aborted) {
          console.log('🛑 Single Shot abortado');
          break;
        }
        
        const text = chunk.text || '';
        fullOutput += text;
        
        // Enviar chunk para callback (streaming em tempo real)
        config.onStreamChunk?.(text, 1, fullOutput);
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // 📊 CALCULAR MÉTRICAS
      // ═══════════════════════════════════════════════════════════════════════════
      
      const parsed = parsePhaseOutput(fullOutput);
      const totalLines = parsed.linesOfCode || fullOutput.split('\n').length;
      
      // Notificar conclusão
      config.onPhaseComplete?.(1, fullOutput, totalLines);
      config.onComplete?.(fullOutput, totalLines);
      
      console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🚀 SINGLE SHOT COMPLETO COM SUCESSO! 🚀                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  📁 Arquivos gerados: ${String(parsed.files.length).padEnd(54)}║
║  📝 Total de linhas: ${String(totalLines).padEnd(55)}║
║  ⏱️ Tempo total: ${String(((Date.now() - startTime) / 1000).toFixed(1) + 's').padEnd(59)}║
╚══════════════════════════════════════════════════════════════════════════════╝
      `);
      
      return {
        success: true,
        mode: 'single',
        totalOutput: fullOutput,
        totalLinesOfCode: totalLines,
        phasesCompleted: 1,
        executionTimeMs: Date.now() - startTime,
        forgedSoul: this.forgedSoul || undefined
      };
      
    } catch (error) {
      console.error('❌ Erro no Single Shot:', error);
      
      config.onError?.(1, error as Error);
      
      return {
        success: false,
        mode: 'single',
        totalOutput: fullOutput,
        totalLinesOfCode: fullOutput.split('\n').length,
        phasesCompleted: 0,
        executionTimeMs: Date.now() - startTime,
        forgedSoul: this.forgedSoul || undefined
      };
    }
  }
  
  /**
   * ⚡ Executa uma fase individual com streaming
   * 
   * MITIGAÇÃO: Passa TODOS os contextos anteriores para evitar "amnésia"
   * 🔮 SOUL ARCHITECT: Usa systemInstruction forjado para injetar a "alma" do especialista
   */
  private async executePhase(
    phaseId: PipelinePhase,
    userPrompt: string,
    onStreamChunk?: (chunk: string, phase: PipelinePhase, accumulated: string) => void
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }
    
    // Obter contexto da fase anterior (relay race - passar o bastão)
    const previousContext = this.completedPhases.length > 0
      ? this.completedPhases[this.completedPhases.length - 1]
      : null;
    
    // Construir prompt com contexto - passa TODOS os contextos para evitar amnésia
    const prompt = buildPhasePrompt(phaseId, userPrompt, previousContext, this.completedPhases);
    
    // 🔮 Preparar prompt com alma do especialista (se forjada)
    const finalPrompt = this.systemInstruction 
      ? `${this.systemInstruction}\n\n${'═'.repeat(80)}\n\n${prompt}`
      : prompt;
    
    let fullOutput = '';
    
    try {
      // Usar streaming com systemInstruction se disponível
      const streamConfig: any = {
        model: this.modelName,
        contents: [{ text: finalPrompt }]
      };
      
      // Se temos uma alma forjada, adicionar como system instruction nativa
      if (this.systemInstruction && this.forgedSoul) {
        streamConfig.config = {
          systemInstruction: this.systemInstruction.substring(0, 8000) // Limite de tokens
        };
      }
      
      const stream = await this.genAI.models.generateContentStream(streamConfig);
      
      for await (const chunk of stream) {
        // Verificar se foi pausado ou abortado
        if (this.isPaused || this.abortController?.signal.aborted) {
          break;
        }
        
        const text = chunk.text || '';
        fullOutput += text;
        
        // Enviar chunk para callback (streaming em tempo real)
        onStreamChunk?.(text, phaseId, this.accumulatedOutput + fullOutput);
      }
      
    } catch (error) {
      console.error(`❌ Erro no streaming da fase ${phaseId}:`, error);
      throw error;
    }
    
    return fullOutput;
  }
  
  /**
   * 💾 Salva checkpoint atual
   */
  private saveCurrentCheckpoint(userPrompt: string, mode: PipelineMode, currentPhase: PipelinePhase): void {
    const checkpoint: PipelineCheckpoint = {
      id: `checkpoint_${Date.now()}`,
      userPrompt,
      mode,
      currentPhase,
      completedPhases: this.completedPhases,
      timestamp: Date.now()
    };
    saveCheckpoint(checkpoint);
  }
  
  /**
   * ⏸️ Pausa a execução
   */
  pause(): void {
    this.isPaused = true;
    pipelineEvents.pause();
  }
  
  /**
   * ▶️ Continua a execução
   */
  resume(): void {
    this.isPaused = false;
    pipelineEvents.resume();
  }
  
  /**
   * 🛑 Aborta a execução
   */
  abort(): void {
    this.abortController?.abort();
    pipelineEvents.reset();
  }
  
  /**
   * 🔄 Continua de um checkpoint salvo
   */
  async resumeFromCheckpoint(
    config: Omit<ExecutorConfig, 'userPrompt' | 'mode'>
  ): Promise<ExecutorResult | null> {
    const checkpoint = loadCheckpoint();
    if (!checkpoint) {
      console.log('📭 Nenhum checkpoint encontrado');
      return null;
    }
    
    console.log(`▶️ Continuando do checkpoint: Fase ${checkpoint.currentPhase}/${checkpoint.mode}`);
    
    // Restaurar estado
    this.completedPhases = checkpoint.completedPhases;
    this.accumulatedOutput = checkpoint.completedPhases
      .map(p => p.previousOutput)
      .join('\n\n');
    
    // Continuar execução
    return this.execute({
      ...config,
      userPrompt: checkpoint.userPrompt,
      mode: checkpoint.mode
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON PARA USO GLOBAL
// ═══════════════════════════════════════════════════════════════════════════════

let executorInstance: EnterprisePipelineExecutor | null = null;

export function getEnterprisePipelineExecutor(modelName?: string): EnterprisePipelineExecutor {
  if (!executorInstance || modelName) {
    executorInstance = new EnterprisePipelineExecutor(modelName);
  }
  return executorInstance;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO HELPER PARA INTEGRAÇÃO COM GEMINISERVICE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🔍 Verifica se deve usar o pipeline enterprise
 * Retorna o modo detectado ou 1 para usar fluxo normal
 */
export function shouldUseEnterprisePipeline(userPrompt: string): PipelineMode {
  const analysis = analyzeComplexity(userPrompt);
  return analysis.mode;
}

/**
 * 🚀 Executa o pipeline enterprise com streaming
 * Retorna um AsyncGenerator para integração com o fluxo existente
 * 
 * 🔮 SOUL ARCHITECT: Agora emite evento 'soul_forged' quando especialista é criado
 * 🎯 MODO SINGLE: Passa mode='single' para gerar tudo em uma chamada
 */
export async function* executeEnterprisePipelineStream(
  userPrompt: string,
  modelName: string = 'gemini-2.0-flash-exp',
  mode: ExecutionMode = 'auto'
): AsyncGenerator<{ type: 'chunk' | 'phase_start' | 'phase_complete' | 'complete' | 'error' | 'soul_forged'; data: any }> {
  const executor = getEnterprisePipelineExecutor(modelName);
  
  // Criar promise que será resolvida quando o pipeline completar
  let resolveComplete: (value: ExecutorResult) => void;
  const completePromise = new Promise<ExecutorResult>(resolve => {
    resolveComplete = resolve;
  });
  
  // Buffer de chunks para yield
  const chunkBuffer: { type: string; data: any }[] = [];
  let bufferResolve: (() => void) | null = null;
  
  const pushChunk = (chunk: { type: string; data: any }) => {
    chunkBuffer.push(chunk);
    if (bufferResolve) {
      bufferResolve();
      bufferResolve = null;
    }
  };
  
  // Iniciar execução em background
  executor.execute({
    userPrompt,
    mode, // Usar o modo passado (pode ser 'single', 'auto', ou 1-5)
    modelName,
    enableSoulArchitect: true, // 🔮 Ativar SoulArchitect
    onSoulForged: (soul, systemPrompt) => {
      // 🔮 Emitir evento quando alma é forjada
      pushChunk({ type: 'soul_forged', data: { soul, systemPrompt } });
    },
    onStreamChunk: (chunk, phase, accumulated) => {
      pushChunk({ type: 'chunk', data: { chunk, phase, accumulated } });
    },
    onPhaseStart: (phase, phaseName) => {
      pushChunk({ type: 'phase_start', data: { phase, phaseName } });
    },
    onPhaseComplete: (phase, output, lines) => {
      pushChunk({ type: 'phase_complete', data: { phase, output, lines } });
    },
    onComplete: (totalOutput, totalLines) => {
      pushChunk({ type: 'complete', data: { totalOutput, totalLines } });
    },
    onError: (phase, error) => {
      pushChunk({ type: 'error', data: { phase, error: error.message } });
    }
  }).then(result => {
    resolveComplete!(result);
  });
  
  // Yield chunks conforme chegam
  while (true) {
    if (chunkBuffer.length > 0) {
      const chunk = chunkBuffer.shift()!;
      yield chunk as any;
      
      if (chunk.type === 'complete' || chunk.type === 'error') {
        break;
      }
    } else {
      // Esperar próximo chunk
      await new Promise<void>(resolve => {
        bufferResolve = resolve;
        // Timeout para não travar
        setTimeout(resolve, 100);
      });
    }
  }
}

export default EnterprisePipelineExecutor;
