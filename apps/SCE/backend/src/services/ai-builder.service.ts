/**
 * ================================================================================
 * AI BUILDER SERVICE — SCE + Aurora Builder
 * ================================================================================
 * 
 * Integração com Gemini/Aurora Builder para:
 * - Analisar código de projetos
 * - Completar/melhorar código
 * - Gerar novos arquivos
 * - Sugerir melhorias
 * 
 * Usa os manifestos do APP-3 (Alexandria) para gerar código de qualidade.
 * 
 * ================================================================================
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';

// Manifestos essenciais do Alexandria (simplificados)
const MANIFESTS = {
  NEXTJS: `
    Next.js Best Practices:
    - Use App Router (app/) over Pages Router
    - Server Components by default, 'use client' only when needed
    - Use next/image for optimized images
    - Implement proper loading.tsx and error.tsx
    - Use generateMetadata for SEO
    - Prefer Server Actions over API routes for mutations
  `,
  REACT: `
    React Best Practices:
    - Functional components with hooks
    - Custom hooks for reusable logic
    - Proper state management (useState, useReducer, Zustand)
    - Memoization with useMemo/useCallback when needed
    - Error boundaries for graceful error handling
    - Accessibility (ARIA labels, semantic HTML)
  `,
  TYPESCRIPT: `
    TypeScript Best Practices:
    - Strict mode enabled
    - Proper type definitions (avoid 'any')
    - Use interfaces for objects, types for unions
    - Generic types for reusable components
    - Proper error handling with discriminated unions
  `,
  API: `
    API Best Practices:
    - RESTful design or tRPC for type-safety
    - Proper error responses with status codes
    - Input validation (Zod)
    - Rate limiting
    - Authentication middleware
    - Logging and monitoring
  `,
  SECURITY: `
    Security Best Practices:
    - Never expose secrets in client code
    - Use environment variables
    - Sanitize user inputs
    - CORS configuration
    - HTTPS only
    - Content Security Policy
  `,
};

export interface AIAnalysisResult {
  summary: string;
  issues: Array<{
    file: string;
    line?: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
  }>;
  suggestions: Array<{
    type: 'improvement' | 'feature' | 'refactor';
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  score: number; // 0-100
}

export interface AIGenerationResult {
  files: Array<{
    path: string;
    content: string;
    action: 'create' | 'update' | 'delete';
  }>;
  explanation: string;
}

export class AIBuilderService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[AI-Builder] GEMINI_API_KEY não configurada - IA desabilitada');
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      }
    });
  }

  /**
   * Verifica se o serviço está disponível
   */
  isAvailable(): boolean {
    return !!this.model;
  }

  /**
   * Analisa código de um projeto
   */
  async analyzeProject(projectPath: string, framework: string): Promise<AIAnalysisResult> {
    if (!this.isAvailable()) {
      return {
        summary: 'IA não disponível - configure GEMINI_API_KEY',
        issues: [],
        suggestions: [],
        score: 0,
      };
    }

    // Ler arquivos principais do projeto
    const files = await this.readProjectFiles(projectPath);
    
    // Selecionar manifestos relevantes
    const relevantManifests = this.selectManifests(framework);
    
    const prompt = `
Você é um especialista em análise de código. Analise o seguinte projeto e forneça feedback detalhado.

## Contexto e Boas Práticas
${relevantManifests}

## Arquivos do Projeto
${files.map(f => `### ${f.path}\n\`\`\`${f.ext}\n${f.content}\n\`\`\``).join('\n\n')}

## Sua Análise
Forneça uma análise em JSON com o seguinte formato:
{
  "summary": "Resumo geral do projeto em 2-3 frases",
  "issues": [
    {
      "file": "caminho/arquivo.ts",
      "line": 10,
      "severity": "error|warning|info",
      "message": "Descrição do problema",
      "suggestion": "Como corrigir"
    }
  ],
  "suggestions": [
    {
      "type": "improvement|feature|refactor",
      "description": "Descrição da sugestão",
      "priority": "high|medium|low"
    }
  ],
  "score": 75
}

Responda APENAS com o JSON, sem markdown ou explicações adicionais.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      
      // Extrair JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Resposta inválida da IA');
    } catch (error) {
      console.error('[AI-Builder] Erro na análise:', error);
      return {
        summary: 'Erro ao analisar projeto',
        issues: [],
        suggestions: [],
        score: 0,
      };
    }
  }

  /**
   * Gera ou completa código
   */
  async generateCode(
    projectPath: string,
    framework: string,
    request: string
  ): Promise<AIGenerationResult> {
    if (!this.isAvailable()) {
      return {
        files: [],
        explanation: 'IA não disponível - configure GEMINI_API_KEY',
      };
    }

    // Ler arquivos existentes para contexto
    const existingFiles = await this.readProjectFiles(projectPath);
    const relevantManifests = this.selectManifests(framework);

    const prompt = `
Você é um desenvolvedor expert. Gere código de alta qualidade seguindo as melhores práticas.

## Boas Práticas a Seguir
${relevantManifests}

## Arquivos Existentes no Projeto
${existingFiles.slice(0, 10).map(f => `### ${f.path}\n\`\`\`${f.ext}\n${f.content.slice(0, 500)}${f.content.length > 500 ? '\n// ... (truncado)' : ''}\n\`\`\``).join('\n\n')}

## Solicitação do Usuário
${request}

## Sua Resposta
Gere o código necessário em JSON com o seguinte formato:
{
  "files": [
    {
      "path": "src/components/NovoComponente.tsx",
      "content": "// código completo aqui",
      "action": "create|update|delete"
    }
  ],
  "explanation": "Explicação do que foi feito e por quê"
}

REGRAS:
1. Código deve ser completo e funcional
2. Seguir as boas práticas do framework
3. Incluir tipos TypeScript quando aplicável
4. Adicionar comentários explicativos
5. Responda APENAS com o JSON, sem markdown
`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Resposta inválida da IA');
    } catch (error) {
      console.error('[AI-Builder] Erro na geração:', error);
      return {
        files: [],
        explanation: 'Erro ao gerar código',
      };
    }
  }

  /**
   * Completa um arquivo específico
   */
  async completeFile(
    filePath: string,
    content: string,
    cursorPosition: number,
    framework: string
  ): Promise<string> {
    if (!this.isAvailable()) {
      return '';
    }

    const before = content.slice(0, cursorPosition);
    const after = content.slice(cursorPosition);
    const relevantManifests = this.selectManifests(framework);

    const prompt = `
Complete o código no ponto indicado por [CURSOR].

## Boas Práticas
${relevantManifests}

## Código
\`\`\`
${before}[CURSOR]${after}
\`\`\`

## Regras
1. Complete APENAS o que faz sentido no contexto
2. Mantenha o estilo do código existente
3. Responda APENAS com o código a ser inserido, sem explicações
4. Se não souber o que completar, responda com string vazia
`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch {
      return '';
    }
  }

  /**
   * Sugere melhorias para um arquivo
   */
  async suggestImprovements(
    filePath: string,
    content: string,
    framework: string
  ): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }

    const relevantManifests = this.selectManifests(framework);

    const prompt = `
Analise o código e sugira melhorias específicas.

## Boas Práticas
${relevantManifests}

## Arquivo: ${filePath}
\`\`\`
${content}
\`\`\`

## Resposta
Liste até 5 melhorias específicas em formato JSON:
["melhoria 1", "melhoria 2", ...]

Responda APENAS com o array JSON.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Lê arquivos principais de um projeto
   */
  private async readProjectFiles(projectPath: string): Promise<Array<{
    path: string;
    content: string;
    ext: string;
  }>> {
    const files: Array<{ path: string; content: string; ext: string }> = [];
    
    const readDir = async (dir: string, prefix = '') => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          // Ignorar pastas não relevantes
          if (entry.name.startsWith('.') || 
              entry.name === 'node_modules' ||
              entry.name === 'dist' ||
              entry.name === 'build' ||
              entry.name === '.next') {
            continue;
          }
          
          const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            // Limitar profundidade
            if (relativePath.split('/').length < 4) {
              await readDir(fullPath, relativePath);
            }
          } else {
            // Ler apenas arquivos de código
            const ext = path.extname(entry.name).slice(1);
            if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'json', 'yaml', 'yml'].includes(ext)) {
              try {
                const content = await fs.readFile(fullPath, 'utf-8');
                // Limitar tamanho
                if (content.length < 10000) {
                  files.push({ path: relativePath, content, ext });
                }
              } catch {}
            }
          }
          
          // Limitar quantidade de arquivos
          if (files.length >= 20) return;
        }
      } catch {}
    };
    
    await readDir(projectPath);
    return files;
  }

  /**
   * Seleciona manifestos relevantes para o framework
   */
  private selectManifests(framework: string): string {
    const manifests: string[] = [MANIFESTS.SECURITY];
    
    switch (framework.toLowerCase()) {
      case 'next':
      case 'nextjs':
        manifests.push(MANIFESTS.NEXTJS, MANIFESTS.REACT, MANIFESTS.TYPESCRIPT);
        break;
      case 'react':
        manifests.push(MANIFESTS.REACT, MANIFESTS.TYPESCRIPT);
        break;
      case 'express':
      case 'fastify':
      case 'nestjs':
      case 'hono':
        manifests.push(MANIFESTS.API, MANIFESTS.TYPESCRIPT);
        break;
      default:
        manifests.push(MANIFESTS.TYPESCRIPT);
    }
    
    return manifests.join('\n\n');
  }
}
