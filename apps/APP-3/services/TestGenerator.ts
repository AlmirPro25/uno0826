/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🧪 TEST GENERATOR - GERADOR AUTOMÁTICO DE TESTES 🧪                 ║
 * ║                                                                              ║
 * ║     "CÓDIGO SEM TESTES É CÓDIGO QUEBRADO ESPERANDO ACONTECER"               ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo gera testes automaticamente baseado no código gerado.
 * Suporta: TypeScript, JavaScript, Go, Python
 * 
 * TIPOS DE TESTES GERADOS:
 * 1. Testes Unitários - Funções isoladas
 * 2. Testes de Integração - APIs e serviços
 * 3. Testes E2E - Fluxos completos
 * 4. Testes de Edge Cases - Casos extremos
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TestGeneratorRequest {
  code: string;
  language: 'typescript' | 'javascript' | 'go' | 'python';
  testFramework?: string;
  testTypes?: ('unit' | 'integration' | 'e2e' | 'edge-cases')[];
  coverage?: 'minimal' | 'standard' | 'comprehensive';
}

export interface GeneratedTest {
  name: string;
  path: string;
  content: string;
  type: 'unit' | 'integration' | 'e2e' | 'edge-cases';
  targetFile?: string;
}

export interface TestGeneratorResult {
  success: boolean;
  tests: GeneratedTest[];
  summary: {
    totalTests: number;
    unitTests: number;
    integrationTests: number;
    e2eTests: number;
    edgeCaseTests: number;
  };
  logs: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATES DE TESTE POR LINGUAGEM
// ═══════════════════════════════════════════════════════════════════════════════

const TEST_TEMPLATES = {
  typescript: {
    framework: 'vitest',
    imports: `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';`,
    mockSetup: `
// Mock setup
vi.mock('./dependencies', () => ({
  dependency: vi.fn()
}));
`,
    testStructure: `
describe('{{moduleName}}', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks();
  });

  {{tests}}
});
`
  },
  javascript: {
    framework: 'jest',
    imports: `const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');`,
    mockSetup: `
// Mock setup
jest.mock('./dependencies', () => ({
  dependency: jest.fn()
}));
`,
    testStructure: `
describe('{{moduleName}}', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
    jest.clearAllMocks();
  });

  {{tests}}
});
`
  },
  go: {
    framework: 'testing',
    imports: `
package {{package}}_test

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)
`,
    mockSetup: ``,
    testStructure: `
{{tests}}
`
  },
  python: {
    framework: 'pytest',
    imports: `
import pytest
from unittest.mock import Mock, patch
`,
    mockSetup: `
@pytest.fixture
def mock_dependencies():
    with patch('module.dependency') as mock:
        yield mock
`,
    testStructure: `
class Test{{moduleName}}:
    {{tests}}
`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPTS PARA GERAÇÃO DE TESTES
// ═══════════════════════════════════════════════════════════════════════════════

const TEST_GENERATION_PROMPT = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🧪 GERADOR DE TESTES AUTOMÁTICO 🧪                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

Você é um especialista em testes de software. Sua missão é gerar testes 
COMPLETOS e ROBUSTOS para o código fornecido.

═══════════════════════════════════════════════════════════════════════════════
📋 CÓDIGO A SER TESTADO:
═══════════════════════════════════════════════════════════════════════════════

{{code}}

═══════════════════════════════════════════════════════════════════════════════
📋 CONFIGURAÇÃO:
═══════════════════════════════════════════════════════════════════════════════

Linguagem: {{language}}
Framework de Testes: {{framework}}
Tipos de Testes: {{testTypes}}
Cobertura: {{coverage}}

═══════════════════════════════════════════════════════════════════════════════
📋 REGRAS OBRIGATÓRIAS:
═══════════════════════════════════════════════════════════════════════════════

1. ✅ Testar TODOS os caminhos de código (happy path + error paths)
2. ✅ Testar edge cases (null, undefined, empty, limites)
3. ✅ Testar concorrência se aplicável
4. ✅ Usar mocks para dependências externas
5. ✅ Nomes de testes descritivos (should_do_X_when_Y)
6. ✅ Arrange-Act-Assert pattern
7. ✅ Testes independentes (não dependem de ordem)
8. ✅ Cleanup após cada teste

═══════════════════════════════════════════════════════════════════════════════
📤 FORMATO DE SAÍDA:
═══════════════════════════════════════════════════════════════════════════════

Retorne os testes neste formato EXATO:

===TEST: nome_do_teste.test.{{ext}}===
TYPE: unit|integration|e2e|edge-cases
TARGET: arquivo_testado.{{ext}}
---
código do teste aqui
---

═══════════════════════════════════════════════════════════════════════════════
🚀 GERE OS TESTES AGORA!
═══════════════════════════════════════════════════════════════════════════════
`;

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL: TEST GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class TestGenerator {
  private genAI: GoogleGenAI | null = null;
  private logs: string[] = [];
  private model = 'gemini-2.0-flash-exp';
  
  constructor() {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }
  
  /**
   * 🧪 MÉTODO PRINCIPAL: Gera testes para o código fornecido
   */
  async generate(request: TestGeneratorRequest): Promise<TestGeneratorResult> {
    this.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    this.log('║              🧪 TEST GENERATOR INICIADO 🧪                                   ║');
    this.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    this.log(`📝 Linguagem: ${request.language}`);
    this.log(`🎯 Cobertura: ${request.coverage || 'standard'}`);
    
    if (!this.genAI) {
      this.log('❌ API Key do Gemini não configurada');
      return {
        success: false,
        tests: [],
        summary: { totalTests: 0, unitTests: 0, integrationTests: 0, e2eTests: 0, edgeCaseTests: 0 },
        logs: [...this.logs]
      };
    }
    
    try {
      // Configurar parâmetros
      const template = TEST_TEMPLATES[request.language];
      const testTypes = request.testTypes || ['unit', 'integration', 'edge-cases'];
      const coverage = request.coverage || 'standard';
      const ext = this.getExtension(request.language);
      
      // Construir prompt
      const prompt = TEST_GENERATION_PROMPT
        .replace('{{code}}', request.code)
        .replace('{{language}}', request.language)
        .replace('{{framework}}', template.framework)
        .replace('{{testTypes}}', testTypes.join(', '))
        .replace('{{coverage}}', coverage)
        .replace(/{{ext}}/g, ext);
      
      // Gerar testes
      this.log('\n🔄 Gerando testes...');
      
      const result = await this.genAI.models.generateContent({
        model: this.model,
        contents: [{ text: prompt }]
      });
      
      const response = result.text || '';
      const tests = this.parseTests(response, request.language);
      
      // Calcular sumário
      const summary = {
        totalTests: tests.length,
        unitTests: tests.filter(t => t.type === 'unit').length,
        integrationTests: tests.filter(t => t.type === 'integration').length,
        e2eTests: tests.filter(t => t.type === 'e2e').length,
        edgeCaseTests: tests.filter(t => t.type === 'edge-cases').length
      };
      
      this.log(`\n✅ Testes gerados com sucesso!`);
      this.log(`📊 Total: ${summary.totalTests} testes`);
      this.log(`   • Unit: ${summary.unitTests}`);
      this.log(`   • Integration: ${summary.integrationTests}`);
      this.log(`   • E2E: ${summary.e2eTests}`);
      this.log(`   • Edge Cases: ${summary.edgeCaseTests}`);
      
      return {
        success: true,
        tests,
        summary,
        logs: [...this.logs]
      };
      
    } catch (error) {
      this.log(`❌ Erro ao gerar testes: ${error}`);
      return {
        success: false,
        tests: [],
        summary: { totalTests: 0, unitTests: 0, integrationTests: 0, e2eTests: 0, edgeCaseTests: 0 },
        logs: [...this.logs]
      };
    }
  }
  
  /**
   * 📦 Parseia testes da resposta
   */
  private parseTests(response: string, language: string): GeneratedTest[] {
    const tests: GeneratedTest[] = [];
    
    // Formato: ===TEST: nome.test.ext=== TYPE: type TARGET: target --- content ---
    const testRegex = /===TEST:\s*(.+?)===\s*\nTYPE:\s*(.+?)\s*\n(?:TARGET:\s*(.+?)\s*\n)?---\n([\s\S]*?)---/g;
    let match;
    
    while ((match = testRegex.exec(response)) !== null) {
      tests.push({
        name: match[1].trim(),
        path: `tests/${match[1].trim()}`,
        type: match[2].trim() as GeneratedTest['type'],
        targetFile: match[3]?.trim(),
        content: match[4].trim()
      });
    }
    
    // Fallback: extrair blocos de código
    if (tests.length === 0) {
      const codeBlockRegex = /```(?:typescript|javascript|go|python)?\n([\s\S]*?)```/g;
      let blockMatch;
      let testIndex = 0;
      
      while ((blockMatch = codeBlockRegex.exec(response)) !== null) {
        const content = blockMatch[1].trim();
        const ext = this.getExtension(language);
        
        tests.push({
          name: `test_${testIndex}.test.${ext}`,
          path: `tests/test_${testIndex}.test.${ext}`,
          type: 'unit',
          content
        });
        testIndex++;
      }
    }
    
    return tests;
  }
  
  /**
   * 📁 Retorna extensão baseada na linguagem
   */
  private getExtension(language: string): string {
    const extensions: Record<string, string> = {
      'typescript': 'ts',
      'javascript': 'js',
      'go': 'go',
      'python': 'py'
    };
    return extensions[language] || 'txt';
  }
  
  /**
   * 📝 Log interno
   */
  private log(message: string): void {
    this.logs.push(message);
    console.log(message);
  }
  
  /**
   * 🔍 Analisa código e sugere tipos de testes necessários
   */
  analyzeCodeForTests(code: string): {
    suggestedTypes: ('unit' | 'integration' | 'e2e' | 'edge-cases')[];
    complexity: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    const suggestedTypes: ('unit' | 'integration' | 'e2e' | 'edge-cases')[] = ['unit'];
    const recommendations: string[] = [];
    let complexity: 'low' | 'medium' | 'high' = 'low';
    
    // Detectar APIs/endpoints
    if (/router\.|app\.(get|post|put|delete)|@(Get|Post|Put|Delete)/i.test(code)) {
      suggestedTypes.push('integration');
      recommendations.push('Testar todos os endpoints com diferentes payloads');
    }
    
    // Detectar UI/Frontend
    if (/React|Vue|Angular|component|render/i.test(code)) {
      suggestedTypes.push('e2e');
      recommendations.push('Testar fluxos de usuário completos');
    }
    
    // Detectar operações financeiras
    if (/balance|transfer|payment|transaction/i.test(code)) {
      suggestedTypes.push('edge-cases');
      recommendations.push('Testar concorrência e race conditions');
      recommendations.push('Testar limites de valores');
      complexity = 'high';
    }
    
    // Detectar async/concorrência
    if (/async|await|Promise|goroutine|channel/i.test(code)) {
      suggestedTypes.push('edge-cases');
      recommendations.push('Testar timeouts e cancelamentos');
      complexity = complexity === 'low' ? 'medium' : complexity;
    }
    
    // Detectar validações
    if (/validate|validation|schema|zod|joi/i.test(code)) {
      recommendations.push('Testar inputs inválidos e edge cases de validação');
    }
    
    return {
      suggestedTypes: [...new Set(suggestedTypes)],
      complexity,
      recommendations
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO HELPER PARA USO DIRETO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Gera testes de forma simplificada
 */
export async function generateTests(
  code: string,
  language: 'typescript' | 'javascript' | 'go' | 'python',
  options?: Partial<TestGeneratorRequest>
): Promise<TestGeneratorResult> {
  const generator = new TestGenerator();
  return generator.generate({
    code,
    language,
    ...options
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const testGenerator = new TestGenerator();

export default TestGenerator;
