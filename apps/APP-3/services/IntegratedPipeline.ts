/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🔗 INTEGRATED PIPELINE - CONEXÃO TOTAL DO SISTEMA 🔗                ║
 * ║                                                                              ║
 * ║     "MANIFESTOS + VERIFIER + DAIA + GEMINI = CÓDIGO PERFEITO"               ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo integra TODOS os componentes do sistema:
 * 1. ManifestOrchestrator - Detecta e injeta manifestos
 * 2. VerifierArchitect - Valida código gerado
 * 3. DAIAService - Aprende com feedback
 * 4. GeminiService - Gera código
 * 
 * FLUXO COMPLETO:
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  PROMPT DO USUÁRIO                                                         │
 * │         ↓                                                                   │
 * │  [1] ManifestOrchestrator.enrichPromptWithManifests()                      │
 * │         ↓                                                                   │
 * │  [2] DAIAService.getSuggestion() - Busca templates similares               │
 * │         ↓                                                                   │
 * │  [3] GeminiService.generateContent() - Gera código                         │
 * │         ↓                                                                   │
 * │  [4] VerifierArchitect.validate() - Valida código                          │
 * │         ↓                                                                   │
 * │  [5] Se falhou → Regenera com feedback (até 3x)                            │
 * │         ↓                                                                   │
 * │  [6] DAIAService.learn() - Aprende se usuário aprovou                      │
 * │         ↓                                                                   │
 * │  CÓDIGO VALIDADO E PRONTO                                                  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';
import { orchestrateManifests, getManifestInfo } from './manifestos/ManifestOrchestrator';
import { VerifierArchitect, type ValidationReport } from './VerifierArchitect';
import { daiaService, enrichPromptWithDAIA } from './DAIAService';
import { knowledgeBase } from './KnowledgeBase';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface IntegratedPipelineRequest {
  prompt: string;
  projectType?: 'web' | 'mobile' | 'fullstack' | 'api' | 'fintech' | 'game';
  language?: 'typescript' | 'javascript' | 'go' | 'python' | 'html';
  enableValidation?: boolean;
  enableDAIA?: boolean;
  enableManifests?: boolean;
  maxRetries?: number;
  validationThreshold?: number;
  onProgress?: (stage: string, message: string) => void;
}

export interface IntegratedPipelineResult {
  success: boolean;
  code: string;
  files: GeneratedFile[];
  validation?: ValidationReport;
  manifestsUsed: string[];
  daiaTemplatesUsed: string[];
  retryCount: number;
  executionTime: number;
  logs: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  category: 'backend' | 'frontend' | 'docs' | 'config' | 'test';
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATED PIPELINE - CLASSE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export class IntegratedPipeline {
  private genAI: GoogleGenAI | null = null;
  private verifier: VerifierArchitect;
  private logs: string[] = [];
  private model = 'gemini-2.0-flash-exp';
  
  constructor(validationThreshold: number = 85) {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
    this.verifier = new VerifierArchitect(validationThreshold);
  }
  
  /**
   * 🚀 MÉTODO PRINCIPAL: Executa o pipeline integrado completo
   */
  async execute(request: IntegratedPipelineRequest): Promise<IntegratedPipelineResult> {
    const startTime = Date.now();
    const manifestsUsed: string[] = [];
    const daiaTemplatesUsed: string[] = [];
    let retryCount = 0;
    
    // Configurações padrão
    const config = {
      enableValidation: request.enableValidation ?? true,
      enableDAIA: request.enableDAIA ?? true,
      enableManifests: request.enableManifests ?? true,
      maxRetries: request.maxRetries ?? 3,
      validationThreshold: request.validationThreshold ?? 85
    };
    
    this.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    this.log('║              🔗 INTEGRATED PIPELINE INICIADO 🔗                             ║');
    this.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    this.log(`📝 Prompt: ${request.prompt.substring(0, 100)}...`);
    
    request.onProgress?.('init', 'Pipeline iniciado');
    
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 1: ENRIQUECIMENTO COM MANIFESTOS
      // ═══════════════════════════════════════════════════════════════════════
      let enrichedPrompt = request.prompt;
      
      if (config.enableManifests) {
        this.log('\n🧬 FASE 1: Enriquecendo com Manifestos...');
        request.onProgress?.('manifests', 'Detectando manifestos relevantes');
        
        const orchestratorResult = orchestrateManifests(request.prompt);
        enrichedPrompt = orchestratorResult.enrichedPrompt;
        
        orchestratorResult.activeManifests.forEach(m => {
          manifestsUsed.push(`${m.name} (Level ${m.level})`);
        });
        
        this.log(`✅ ${orchestratorResult.totalManifestsApplied} manifestos ativados:`);
        manifestsUsed.forEach(m => this.log(`   • ${m}`));
      }
      
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 2: BUSCA DE TEMPLATES SIMILARES (DAIA)
      // ═══════════════════════════════════════════════════════════════════════
      if (config.enableDAIA) {
        this.log('\n🧠 FASE 2: Buscando templates similares (DAIA)...');
        request.onProgress?.('daia', 'Buscando templates similares');
        
        const daiaResult = await enrichPromptWithDAIA(request.prompt);
        
        if (daiaResult.usedTemplates.length > 0) {
          enrichedPrompt = daiaResult.enrichedPrompt;
          daiaResult.usedTemplates.forEach(t => {
            daiaTemplatesUsed.push(`${t.id} (${(t.similarity * 100).toFixed(0)}% similar)`);
          });
          this.log(`✅ ${daiaResult.usedTemplates.length} templates encontrados`);
        } else {
          this.log('ℹ️ Nenhum template similar encontrado');
        }
      }
      
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 3: CONSULTA À KNOWLEDGE BASE
      // ═══════════════════════════════════════════════════════════════════════
      this.log('\n📚 FASE 3: Consultando Knowledge Base...');
      request.onProgress?.('knowledge', 'Consultando base de conhecimento');
      
      const knowledgeResults = knowledgeBase.query(request.prompt);
      if (knowledgeResults.length > 0) {
        const topDomain = knowledgeResults[0];
        this.log(`✅ Domínio detectado: ${topDomain.domain} (${(topDomain.relevance * 100).toFixed(0)}% relevância)`);
        
        // Adicionar contexto da Knowledge Base
        enrichedPrompt = `${topDomain.context}\n\n${enrichedPrompt}`;
      }
      
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 4: GERAÇÃO DE CÓDIGO
      // ═══════════════════════════════════════════════════════════════════════
      this.log('\n🎨 FASE 4: Gerando código...');
      request.onProgress?.('generate', 'Gerando código com Gemini');
      
      let generatedCode = await this.generateCode(enrichedPrompt);
      let files = this.parseFiles(generatedCode);
      let validation: ValidationReport | undefined;
      
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 5: VALIDAÇÃO E REFINAMENTO
      // ═══════════════════════════════════════════════════════════════════════
      if (config.enableValidation) {
        this.log('\n🔍 FASE 5: Validando código...');
        request.onProgress?.('validate', 'Validando código gerado');
        
        validation = this.verifier.validate({
          code: generatedCode,
          language: request.language || this.detectLanguage(generatedCode),
          projectType: request.projectType || 'web'
        });
        
        this.log(`📊 Score inicial: ${validation.summary.totalScore.toFixed(0)}/100`);
        
        // Loop de refinamento se não passou
        while (!validation.summary.passed && retryCount < config.maxRetries) {
          retryCount++;
          this.log(`\n🔄 Refinamento ${retryCount}/${config.maxRetries}...`);
          request.onProgress?.('refine', `Refinando código (tentativa ${retryCount})`);
          
          // Construir feedback para refinamento
          const feedback = this.buildRefinementFeedback(validation);
          const refinementPrompt = `${enrichedPrompt}\n\n${feedback}`;
          
          // Regenerar
          generatedCode = await this.generateCode(refinementPrompt);
          files = this.parseFiles(generatedCode);
          
          // Revalidar
          validation = this.verifier.validate({
            code: generatedCode,
            language: request.language || this.detectLanguage(generatedCode),
            projectType: request.projectType || 'web'
          });
          
          this.log(`📊 Score após refinamento: ${validation.summary.totalScore.toFixed(0)}/100`);
        }
        
        if (validation.summary.passed) {
          this.log('✅ Código APROVADO na validação!');
        } else {
          this.log('⚠️ Código não atingiu threshold após refinamentos');
        }
      }
      
      // ═══════════════════════════════════════════════════════════════════════
      // RESULTADO FINAL
      // ═══════════════════════════════════════════════════════════════════════
      const executionTime = Date.now() - startTime;
      
      this.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
      this.log('║              ✅ PIPELINE COMPLETO COM SUCESSO! ✅                            ║');
      this.log('╚══════════════════════════════════════════════════════════════════════════════╝');
      this.log(`📊 Arquivos gerados: ${files.length}`);
      this.log(`🧬 Manifestos usados: ${manifestsUsed.length}`);
      this.log(`🧠 Templates DAIA: ${daiaTemplatesUsed.length}`);
      this.log(`🔄 Refinamentos: ${retryCount}`);
      this.log(`⏱️ Tempo total: ${(executionTime / 1000).toFixed(2)}s`);
      
      request.onProgress?.('complete', 'Pipeline completo');
      
      return {
        success: true,
        code: generatedCode,
        files,
        validation,
        manifestsUsed,
        daiaTemplatesUsed,
        retryCount,
        executionTime,
        logs: [...this.logs]
      };
      
    } catch (error) {
      this.log(`❌ ERRO: ${error}`);
      request.onProgress?.('error', String(error));
      
      return {
        success: false,
        code: '',
        files: [],
        manifestsUsed,
        daiaTemplatesUsed,
        retryCount,
        executionTime: Date.now() - startTime,
        logs: [...this.logs]
      };
    }
  }
  
  /**
   * 🎨 Gera código usando Gemini
   */
  private async generateCode(prompt: string): Promise<string> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }
    
    const result = await this.genAI.models.generateContent({
      model: this.model,
      contents: [{ text: prompt }]
    });
    
    return result.text || '';
  }
  
  /**
   * 📝 Constrói feedback para refinamento
   */
  private buildRefinementFeedback(validation: ValidationReport): string {
    let feedback = `
═══════════════════════════════════════════════════════════════════════════════
⚠️ CORREÇÕES NECESSÁRIAS (Score atual: ${validation.summary.totalScore.toFixed(0)}/100)
═══════════════════════════════════════════════════════════════════════════════

O código gerado tem os seguintes problemas que DEVEM ser corrigidos:

`;
    
    // Adicionar issues críticos
    if (validation.criticalIssues.length > 0) {
      feedback += `### 🔴 PROBLEMAS CRÍTICOS:\n`;
      validation.criticalIssues.forEach((issue, i) => {
        feedback += `${i + 1}. [${issue.code}] ${issue.description}\n`;
        if (issue.suggestedFix) {
          feedback += `   💡 Sugestão: ${issue.suggestedFix}\n`;
        }
      });
      feedback += '\n';
    }
    
    // Adicionar scores por área
    feedback += `### 📊 SCORES POR ÁREA:\n`;
    const scores = validation.scores;
    feedback += `- Arquitetura: ${scores.architecture.score}/100 ${scores.architecture.passed ? '✅' : '❌'}\n`;
    feedback += `- Lógica de Negócio: ${scores.businessLogic.score}/100 ${scores.businessLogic.passed ? '✅' : '❌'}\n`;
    feedback += `- Segurança: ${scores.security.score}/100 ${scores.security.passed ? '✅' : '❌'}\n`;
    feedback += `- Testes: ${scores.tests.score}/100 ${scores.tests.passed ? '✅' : '❌'}\n`;
    feedback += `- Performance: ${scores.performance.score}/100 ${scores.performance.passed ? '✅' : '❌'}\n`;
    feedback += `- UX: ${scores.ux.score}/100 ${scores.ux.passed ? '✅' : '❌'}\n`;
    
    // Adicionar recomendações
    if (validation.recommendations.length > 0) {
      feedback += `\n### 💡 RECOMENDAÇÕES:\n`;
      validation.recommendations.forEach((rec, i) => {
        feedback += `${i + 1}. ${rec}\n`;
      });
    }
    
    feedback += `
═══════════════════════════════════════════════════════════════════════════════
🎯 REGENERE O CÓDIGO CORRIGINDO TODOS OS PROBLEMAS ACIMA!
═══════════════════════════════════════════════════════════════════════════════
`;
    
    return feedback;
  }
  
  /**
   * 📦 Parseia arquivos da resposta
   */
  private parseFiles(response: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    
    // Formato: ===FILE: path=== ou FILE: path
    const fileRegex = /(?:===FILE:|FILE:)\s*(.+?)(?:===)?\s*\n(?:LANGUAGE:\s*(.+?)\s*\n)?(?:CATEGORY:\s*(.+?)\s*\n)?---\n([\s\S]*?)---/g;
    let match;
    
    while ((match = fileRegex.exec(response)) !== null) {
      files.push({
        path: match[1].trim(),
        language: match[2]?.trim() || 'text',
        category: (match[3]?.trim() || 'backend') as GeneratedFile['category'],
        content: match[4].trim()
      });
    }
    
    // Fallback: extrair blocos de código markdown
    if (files.length === 0) {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let blockMatch;
      let fileIndex = 0;
      
      while ((blockMatch = codeBlockRegex.exec(response)) !== null) {
        const language = blockMatch[1] || 'text';
        const content = blockMatch[2].trim();
        
        let path = `file${fileIndex}.${this.getExtension(language)}`;
        if (content.includes('package main')) path = 'main.go';
        else if (content.includes('<!DOCTYPE html>')) path = 'index.html';
        else if (content.includes('import React')) path = `Component${fileIndex}.tsx`;
        else if (content.includes('FROM ')) path = 'Dockerfile';
        else if (content.includes('version:') && content.includes('services:')) path = 'docker-compose.yml';
        
        files.push({
          path,
          content,
          language,
          category: this.detectCategory(content)
        });
        fileIndex++;
      }
    }
    
    return files;
  }
  
  /**
   * 🔍 Detecta linguagem do código
   */
  private detectLanguage(code: string): 'typescript' | 'javascript' | 'go' | 'python' | 'html' {
    if (code.includes('package main') || code.includes('func ')) return 'go';
    if (code.includes('def ') || code.includes('import ')) return 'python';
    if (code.includes('<!DOCTYPE html>') || code.includes('<html')) return 'html';
    if (code.includes(': string') || code.includes('interface ')) return 'typescript';
    return 'javascript';
  }
  
  /**
   * 📁 Detecta categoria do arquivo
   */
  private detectCategory(content: string): GeneratedFile['category'] {
    if (content.includes('test') || content.includes('spec')) return 'test';
    if (content.includes('<!DOCTYPE') || content.includes('React')) return 'frontend';
    if (content.includes('Dockerfile') || content.includes('docker-compose')) return 'config';
    if (content.includes('README') || content.includes('# ')) return 'docs';
    return 'backend';
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
      'markdown': 'md'
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
   * 📊 Retorna informações do sistema
   */
  getSystemInfo(): object {
    return {
      manifestInfo: getManifestInfo(),
      knowledgeDomains: knowledgeBase.listDomains(),
      daiaEnabled: daiaService.isAvailable()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO HELPER PARA USO DIRETO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Executa o pipeline integrado de forma simplificada
 */
export async function executeIntegratedPipeline(
  prompt: string,
  options?: Partial<IntegratedPipelineRequest>
): Promise<IntegratedPipelineResult> {
  const pipeline = new IntegratedPipeline(options?.validationThreshold);
  return pipeline.execute({
    prompt,
    ...options
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const integratedPipeline = new IntegratedPipeline();

export default IntegratedPipeline;
