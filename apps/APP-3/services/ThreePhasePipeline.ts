/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🌟 THREE-PHASE PIPELINE ENGINE 🌟                                   ║
 * ║                                                                              ║
 * ║                    "3 CHAMADAS → 3 ESPECIALISTAS → 1 OBRA-PRIMA"            ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este é o motor que orquestra as 3 chamadas à API do Gemini.
 * Cada chamada recebe TODO o contexto das anteriores.
 * 
 * FLUXO:
 * 1. FASE 1 (Arquiteto) → Backend + Manifesto
 * 2. FASE 2 (Designer) → Frontend + Manifesto (recebe contexto da Fase 1)
 * 3. FASE 3 (Finalizador) → Docs + Testes (recebe contexto das Fases 1 e 2)
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';
import {
  PHASE_1_ARCHITECT_MANIFEST,
  PHASE_2_DESIGNER_MANIFEST,
  PHASE_3_FINALIZER_MANIFEST,
  type PhaseContext,
  type PhaseResult,
  type GeneratedFile,
  type PipelineResult
} from './manifestos/THREE_PHASE_PIPELINE_MANIFEST';
import { enrichPromptWithManifests } from './manifestos/ManifestOrchestrator';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface PipelineRequest {
  userPrompt: string;
  projectType?: 'web' | 'mobile' | 'fullstack' | 'api' | 'fintech';
  complexity?: 'simple' | 'medium' | 'complex' | 'enterprise';
  onPhaseStart?: (phase: number, name: string) => void;
  onPhaseComplete?: (phase: number, result: PhaseResult) => void;
  onProgress?: (message: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THREE-PHASE PIPELINE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class ThreePhasePipeline {
  private genAI: GoogleGenAI | null = null;
  private logs: string[] = [];
  
  constructor() {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }
  
  /**
   * 🚀 EXECUTA O PIPELINE COMPLETO DE 3 FASES
   */
  async execute(request: PipelineRequest): Promise<PipelineResult> {
    const startTime = Date.now();
    const phases: PhaseResult[] = [];
    
    this.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    this.log('║              🌟 THREE-PHASE PIPELINE INICIADO 🌟                            ║');
    this.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    this.log(`📝 Prompt: ${request.userPrompt.substring(0, 100)}...`);
    
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 1: ARQUITETO UNIVERSAL
      // ═══════════════════════════════════════════════════════════════════════
      request.onPhaseStart?.(1, 'Arquiteto Universal');
      this.log('\n🏗️ ═══════════════════════════════════════════════════════════════════════');
      this.log('🏗️ FASE 1: ARQUITETO UNIVERSAL - Backend + Arquitetura');
      this.log('🏗️ ═══════════════════════════════════════════════════════════════════════\n');
      
      const phase1Result = await this.executePhase1(request);
      phases.push(phase1Result);
      request.onPhaseComplete?.(1, phase1Result);
      
      this.log(`✅ Fase 1 completa: ${phase1Result.files.length} arquivos gerados`);
      
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 2: DESIGNER SUPREMO
      // ═══════════════════════════════════════════════════════════════════════
      request.onPhaseStart?.(2, 'Designer Supremo');
      this.log('\n🎨 ═══════════════════════════════════════════════════════════════════════');
      this.log('🎨 FASE 2: DESIGNER SUPREMO - Frontend + UI/UX');
      this.log('🎨 ═══════════════════════════════════════════════════════════════════════\n');
      
      const phase2Result = await this.executePhase2(request, phases);
      phases.push(phase2Result);
      request.onPhaseComplete?.(2, phase2Result);
      
      this.log(`✅ Fase 2 completa: ${phase2Result.files.length} arquivos gerados`);
      
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 3: DOCUMENTADOR/FINALIZADOR
      // ═══════════════════════════════════════════════════════════════════════
      request.onPhaseStart?.(3, 'Documentador/Finalizador');
      this.log('\n📚 ═══════════════════════════════════════════════════════════════════════');
      this.log('📚 FASE 3: DOCUMENTADOR/FINALIZADOR - Docs + Testes + Deploy');
      this.log('📚 ═══════════════════════════════════════════════════════════════════════\n');
      
      const phase3Result = await this.executePhase3(request, phases);
      phases.push(phase3Result);
      request.onPhaseComplete?.(3, phase3Result);
      
      this.log(`✅ Fase 3 completa: ${phase3Result.files.length} arquivos gerados`);
      
      // ═══════════════════════════════════════════════════════════════════════
      // RESULTADO FINAL
      // ═══════════════════════════════════════════════════════════════════════
      const totalFiles = phases.reduce((sum, p) => sum + p.files.length, 0);
      const executionTime = Date.now() - startTime;
      
      this.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
      this.log('║              🎉 PIPELINE COMPLETO COM SUCESSO! 🎉                            ║');
      this.log('╚══════════════════════════════════════════════════════════════════════════════╝');
      this.log(`📊 Total de arquivos: ${totalFiles}`);
      this.log(`⏱️ Tempo total: ${(executionTime / 1000).toFixed(2)}s`);
      
      return {
        success: true,
        phases,
        totalFiles,
        executionTime
      };
      
    } catch (error) {
      this.log(`❌ ERRO NO PIPELINE: ${error}`);
      return {
        success: false,
        phases,
        totalFiles: phases.reduce((sum, p) => sum + p.files.length, 0),
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * 🏗️ FASE 1: ARQUITETO UNIVERSAL
   * Cria todo o backend + arquitetura + manifesto para Fase 2
   */
  private async executePhase1(request: PipelineRequest): Promise<PhaseResult> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }
    
    // Enriquecer prompt com manifestos detectados
    const enrichedUserPrompt = enrichPromptWithManifests(request.userPrompt);
    
    const prompt = `${PHASE_1_ARCHITECT_MANIFEST}

═══════════════════════════════════════════════════════════════════════════════
📋 PEDIDO DO USUÁRIO:
═══════════════════════════════════════════════════════════════════════════════

${enrichedUserPrompt}

═══════════════════════════════════════════════════════════════════════════════
🎯 TIPO DE PROJETO: ${request.projectType || 'detectar automaticamente'}
📊 COMPLEXIDADE: ${request.complexity || 'detectar automaticamente'}
═══════════════════════════════════════════════════════════════════════════════

🚀 EXECUTE A FASE 1 AGORA!
Gere TODO o backend completo + manifesto para a Fase 2.
`;
    
    const result = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ text: prompt }]
    });
    
    const response = result.text || '';
    const files = this.parseFiles(response, 'backend');
    const manifest = this.extractManifest(response, 'PHASE2_MANIFEST');
    
    return {
      phase: 1,
      phaseName: 'Arquiteto Universal',
      files,
      manifest,
      summary: `Backend completo com ${files.length} arquivos`,
      metadata: {
        projectType: request.projectType,
        complexity: request.complexity
      }
    };
  }
  
  /**
   * 🎨 FASE 2: DESIGNER SUPREMO
   * Recebe contexto da Fase 1 e cria todo o frontend
   */
  private async executePhase2(
    request: PipelineRequest,
    previousPhases: PhaseResult[]
  ): Promise<PhaseResult> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }
    
    const phase1 = previousPhases[0];
    
    // Construir contexto completo da Fase 1
    const phase1Context = this.buildPhaseContext(phase1);
    
    const prompt = `${PHASE_2_DESIGNER_MANIFEST}

═══════════════════════════════════════════════════════════════════════════════
📋 CONTEXTO DA FASE 1 (BACKEND JÁ CRIADO):
═══════════════════════════════════════════════════════════════════════════════

${phase1Context}

═══════════════════════════════════════════════════════════════════════════════
📋 MANIFESTO DA FASE 1 (INSTRUÇÕES PARA VOCÊ):
═══════════════════════════════════════════════════════════════════════════════

${phase1.manifest}

═══════════════════════════════════════════════════════════════════════════════
📋 PEDIDO ORIGINAL DO USUÁRIO:
═══════════════════════════════════════════════════════════════════════════════

${request.userPrompt}

═══════════════════════════════════════════════════════════════════════════════

🚀 EXECUTE A FASE 2 AGORA!
Gere TODO o frontend completo + manifesto para a Fase 3.
Use os endpoints e modelos definidos na Fase 1.
`;
    
    const result = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ text: prompt }]
    });
    
    const response = result.text || '';
    const files = this.parseFiles(response, 'frontend');
    const manifest = this.extractManifest(response, 'PHASE3_MANIFEST');
    
    return {
      phase: 2,
      phaseName: 'Designer Supremo',
      files,
      manifest,
      summary: `Frontend completo com ${files.length} arquivos`,
      metadata: {
        componentsCount: files.filter(f => f.path.includes('component')).length
      }
    };
  }
  
  /**
   * 📚 FASE 3: DOCUMENTADOR/FINALIZADOR
   * Recebe contexto das Fases 1 e 2 e finaliza o projeto
   */
  private async executePhase3(
    request: PipelineRequest,
    previousPhases: PhaseResult[]
  ): Promise<PhaseResult> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }
    
    const phase1 = previousPhases[0];
    const phase2 = previousPhases[1];
    
    // Construir contexto completo das Fases 1 e 2
    const phase1Context = this.buildPhaseContext(phase1);
    const phase2Context = this.buildPhaseContext(phase2);
    
    const prompt = `${PHASE_3_FINALIZER_MANIFEST}

═══════════════════════════════════════════════════════════════════════════════
📋 CONTEXTO DA FASE 1 (BACKEND):
═══════════════════════════════════════════════════════════════════════════════

${phase1Context}

═══════════════════════════════════════════════════════════════════════════════
📋 CONTEXTO DA FASE 2 (FRONTEND):
═══════════════════════════════════════════════════════════════════════════════

${phase2Context}

═══════════════════════════════════════════════════════════════════════════════
📋 MANIFESTOS DAS FASES ANTERIORES:
═══════════════════════════════════════════════════════════════════════════════

### Manifesto Fase 1:
${phase1.manifest}

### Manifesto Fase 2:
${phase2.manifest}

═══════════════════════════════════════════════════════════════════════════════
📋 PEDIDO ORIGINAL DO USUÁRIO:
═══════════════════════════════════════════════════════════════════════════════

${request.userPrompt}

═══════════════════════════════════════════════════════════════════════════════

🚀 EXECUTE A FASE 3 AGORA!
Finalize o projeto com documentação, testes, Docker e CI/CD.
`;
    
    const result = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ text: prompt }]
    });
    
    const response = result.text || '';
    const files = this.parseFiles(response, 'docs');
    
    return {
      phase: 3,
      phaseName: 'Documentador/Finalizador',
      files,
      manifest: '', // Última fase não precisa de manifesto
      summary: `Documentação e configurações com ${files.length} arquivos`,
      metadata: {
        hasReadme: files.some(f => f.path.toLowerCase().includes('readme')),
        hasDocker: files.some(f => f.path.toLowerCase().includes('docker')),
        hasCICD: files.some(f => f.path.includes('.github'))
      }
    };
  }
  
  /**
   * 📄 Constrói o contexto de uma fase para passar para a próxima
   */
  private buildPhaseContext(phase: PhaseResult): string {
    let context = `## ${phase.phaseName} (Fase ${phase.phase})\n\n`;
    context += `**Resumo:** ${phase.summary}\n\n`;
    context += `### Arquivos Gerados:\n\n`;
    
    for (const file of phase.files) {
      context += `#### ${file.path}\n`;
      context += `\`\`\`${file.language}\n`;
      // Limitar tamanho do conteúdo para não estourar contexto
      const maxLength = 2000;
      if (file.content.length > maxLength) {
        context += file.content.substring(0, maxLength);
        context += '\n// ... (truncado para contexto)\n';
      } else {
        context += file.content;
      }
      context += `\n\`\`\`\n\n`;
    }
    
    return context;
  }
  
  /**
   * 📦 Parseia arquivos da resposta do modelo
   */
  private parseFiles(response: string, defaultCategory: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    
    // Formato: ===FILE: path=== LANGUAGE: lang CATEGORY: cat --- content ---
    const fileRegex = /===FILE:\s*(.+?)===\s*\nLANGUAGE:\s*(.+?)\s*\n(?:CATEGORY:\s*(.+?)\s*\n)?---\n([\s\S]*?)---/g;
    let match;
    
    while ((match = fileRegex.exec(response)) !== null) {
      files.push({
        path: match[1].trim(),
        language: match[2].trim(),
        category: (match[3]?.trim() || defaultCategory) as GeneratedFile['category'],
        content: match[4].trim()
      });
    }
    
    // Fallback: tentar extrair blocos de código markdown
    if (files.length === 0) {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let blockMatch;
      let fileIndex = 0;
      
      while ((blockMatch = codeBlockRegex.exec(response)) !== null) {
        const language = blockMatch[1] || 'text';
        const content = blockMatch[2].trim();
        
        // Detectar tipo de arquivo pelo conteúdo
        let path = `file${fileIndex}.${this.getExtension(language)}`;
        if (content.includes('package main')) path = 'main.go';
        else if (content.includes('<!DOCTYPE html>')) path = 'index.html';
        else if (content.includes('import React')) path = `Component${fileIndex}.tsx`;
        else if (content.includes('FROM ')) path = 'Dockerfile';
        else if (content.includes('version:') && content.includes('services:')) path = 'docker-compose.yml';
        else if (content.includes('# ')) path = 'README.md';
        
        files.push({
          path,
          content,
          language,
          category: defaultCategory as GeneratedFile['category']
        });
        fileIndex++;
      }
    }
    
    return files;
  }
  
  /**
   * 📋 Extrai manifesto da resposta
   */
  private extractManifest(response: string, manifestKey: string): string {
    const manifestRegex = new RegExp(`===${manifestKey}===\\s*\\n([\\s\\S]*?)(?:---|$)`);
    const match = response.match(manifestRegex);
    
    if (match) {
      return match[1].trim();
    }
    
    // Fallback: procurar por "# Manifesto para Fase"
    const fallbackRegex = /# Manifesto para Fase \d[\s\S]*?(?=\n===|$)/;
    const fallbackMatch = response.match(fallbackRegex);
    
    return fallbackMatch ? fallbackMatch[0].trim() : '';
  }
  
  /**
   * 📁 Retorna extensão baseada na linguagem
   */
  private getExtension(language: string): string {
    const extensions: Record<string, string> = {
      'typescript': 'ts',
      'javascript': 'js',
      'go': 'go',
      'python': 'py',
      'sql': 'sql',
      'yaml': 'yml',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'markdown': 'md',
      'dockerfile': 'Dockerfile'
    };
    return extensions[language.toLowerCase()] || 'txt';
  }
  
  /**
   * 📝 Log interno
   */
  private log(message: string): void {
    this.logs.push(message);
    console.log(message);
  }
  
  /**
   * 📊 Retorna todos os logs
   */
  getLogs(): string[] {
    return [...this.logs];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO HELPER PARA USO DIRETO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Executa o pipeline de 3 fases de forma simplificada
 */
export async function executeThreePhasePipeline(
  userPrompt: string,
  options?: Partial<PipelineRequest>
): Promise<PipelineResult> {
  const pipeline = new ThreePhasePipeline();
  return pipeline.execute({
    userPrompt,
    ...options
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default ThreePhasePipeline;
