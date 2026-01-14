#!/usr/bin/env node

/**
 * Servidor MCP para Sistema Anti-Simulação V2.0
 * Foco: FUNCIONALIDADE REAL, não simulação
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

class AntiSimulationMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'anti-simulation-mcp',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'detect_simulation',
          description: 'Detecta se código contém simulações ou placeholders',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Código para analisar'
              }
            },
            required: ['code']
          }
        },
        {
          name: 'enforce_functionality',
          description: 'Força geração de código funcional real',
          inputSchema: {
            type: 'object',
            properties: {
              request: {
                type: 'string',
                description: 'Solicitação do usuário'
              },
              context: {
                type: 'string',
                description: 'Contexto do projeto'
              }
            },
            required: ['request']
          }
        },
        {
          name: 'suggest_minimal_solution',
          description: 'Sugere solução mínima que funciona',
          inputSchema: {
            type: 'object',
            properties: {
              problem: {
                type: 'string',
                description: 'Problema a resolver'
              }
            },
            required: ['problem']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'detect_simulation':
          return this.detectSimulation(args);
        case 'enforce_functionality':
          return this.enforceFunctionality(args);
        case 'suggest_minimal_solution':
          return this.suggestMinimalSolution(args);
        default:
          throw new Error(`Ferramenta desconhecida: ${name}`);
      }
    });
  } 
 async detectSimulation({ code }) {
    const simulationPatterns = [
      { pattern: /aqui você (conectaria|implementaria|adicionaria)/i, issue: 'Instrução de implementação' },
      { pattern: /este seria o (endpoint|código|arquivo)/i, issue: 'Código hipotético' },
      { pattern: /simule (a|o|os|as)/i, issue: 'Simulação explícita' },
      { pattern: /por questões de segurança/i, issue: 'Limitação artificial' },
      { pattern: /lorem ipsum/i, issue: 'Texto placeholder' },
      { pattern: /placeholder/i, issue: 'Placeholder genérico' },
      { pattern: /todo:|fixme:/i, issue: 'Código incompleto' },
      { pattern: /\/\/ implementar/i, issue: 'Comentário de implementação' },
    ];

    const detectedIssues = [];
    const functionalFeatures = [];

    // Detectar simulações
    simulationPatterns.forEach(({ pattern, issue }) => {
      if (pattern.test(code)) {
        detectedIssues.push(issue);
      }
    });

    // Detectar funcionalidades reais
    const functionalPatterns = [
      { pattern: /onclick="[^"]+"/g, feature: "Botões funcionais" },
      { pattern: /onsubmit="[^"]+"/g, feature: "Formulários funcionais" },
      { pattern: /fetch\(|axios\./g, feature: "Chamadas de API" },
      { pattern: /localStorage\./g, feature: "Armazenamento local" },
      { pattern: /addEventListener/g, feature: "Event listeners" },
      { pattern: /function\s+\w+\s*\(/g, feature: "Funções JavaScript" },
    ];

    functionalPatterns.forEach(({ pattern, feature }) => {
      if (pattern.test(code)) {
        functionalFeatures.push(feature);
      }
    });

    const isSimulation = detectedIssues.length > 0;
    const hasFunctionality = functionalFeatures.length > 0;

    return {
      content: [{
        type: 'text',
        text: `
# Análise Anti-Simulação

## Status: ${isSimulation ? '❌ SIMULAÇÃO DETECTADA' : '✅ CÓDIGO FUNCIONAL'}

## Problemas encontrados:
${detectedIssues.length > 0 ? 
  detectedIssues.map(issue => `- ❌ ${issue}`).join('\n') : 
  '- ✅ Nenhuma simulação detectada'
}

## Funcionalidades reais:
${functionalFeatures.length > 0 ? 
  functionalFeatures.map(feature => `- ✅ ${feature}`).join('\n') : 
  '- ⚠️ Nenhuma funcionalidade detectada'
}

## Recomendação:
${isSimulation ? 
  '🔄 REGENERAR código com funcionalidade real' : 
  hasFunctionality ? 
    '🎉 Código aprovado para uso' : 
    '⚠️ Adicionar mais funcionalidades'
}
        `
      }]
    };
  }

  async enforceFunctionality({ request, context = '' }) {
    const functionalPrompt = `
# GERAÇÃO DE CÓDIGO FUNCIONAL OBRIGATÓRIA

## Solicitação: "${request}"
## Contexto: ${context}

## REGRAS INQUEBRÁVEIS:

### 1. FUNCIONALIDADE REAL:
- Botões DEVEM fazer algo
- Formulários DEVEM processar dados
- APIs DEVEM responder
- Código DEVE executar

### 2. IMPLEMENTAÇÃO MÍNIMA:
- Menor código que resolve o problema
- Sem dependências desnecessárias
- Arquivo único se possível
- Funciona imediatamente

### 3. CONTEÚDO REAL:
- Dados reais, não Lorem Ipsum
- Funcionalidades reais, não simuladas
- Integrações reais, não placeholders

### 4. TIPOS DE PROJETO:

#### Se for JOGO:
- HTML + Canvas + JavaScript
- Controles funcionais
- Física básica
- Pontuação real

#### Se for API:
- Express.js + rotas
- CRUD funcional
- Validação real
- Respostas reais

#### Se for SITE:
- HTML completo
- Formulários funcionais
- Navegação real
- Interatividade

#### Se for E-COMMERCE:
- Catálogo real
- Carrinho funcional
- Checkout real
- Pagamentos (Stripe)

## CÓDIGO GERADO DEVE:
✅ Executar imediatamente
✅ Resolver problema real
✅ Ter funcionalidades completas
✅ Não precisar configuração
    `;

    return {
      content: [{
        type: 'text',
        text: functionalPrompt
      }]
    };
  }

  async suggestMinimalSolution({ problem }) {
    const solutions = {
      'jogo': {
        solution: 'HTML + Canvas + JavaScript vanilla',
        implementation: 'Arquivo único .html com jogo completo',
        features: ['Controles', 'Física', 'Pontuação', 'Gráficos'],
        avoid: ['React', 'webpack', 'build process'],
        time: '30 minutos'
      },
      'api': {
        solution: 'Express.js + rotas essenciais',
        implementation: 'server.js com endpoints funcionais',
        features: ['CRUD', 'Validação', 'Autenticação', 'Documentação'],
        avoid: ['microserviços', 'docker', 'kubernetes'],
        time: '20 minutos'
      },
      'site': {
        solution: 'HTML + CSS + JS vanilla',
        implementation: 'index.html completo e funcional',
        features: ['Navegação', 'Formulários', 'Interatividade', 'Responsivo'],
        avoid: ['framework', 'build tools', 'bundlers'],
        time: '25 minutos'
      },
      'loja': {
        solution: 'HTML + Stripe + localStorage',
        implementation: 'E-commerce em arquivo único',
        features: ['Catálogo', 'Carrinho', 'Checkout', 'Pagamentos'],
        avoid: ['backend complexo', 'banco de dados'],
        time: '45 minutos'
      }
    };

    // Detectar tipo de problema
    const problemLower = problem.toLowerCase();
    let solutionKey = 'site'; // default

    if (problemLower.includes('jogo') || problemLower.includes('game')) {
      solutionKey = 'jogo';
    } else if (problemLower.includes('api') || problemLower.includes('backend')) {
      solutionKey = 'api';
    } else if (problemLower.includes('loja') || problemLower.includes('ecommerce') || problemLower.includes('venda')) {
      solutionKey = 'loja';
    }

    const solution = solutions[solutionKey];

    return {
      content: [{
        type: 'text',
        text: `
# Solução Mínima para: "${problem}"

## 🎯 Abordagem Recomendada:
**${solution.solution}**

## 📋 Implementação:
${solution.implementation}

## ✅ Funcionalidades Essenciais:
${solution.features.map(f => `- ${f} funcionando`).join('\n')}

## ❌ Evitar Complexidade:
${solution.avoid.map(a => `- ${a}`).join('\n')}

## ⏱️ Tempo Estimado:
${solution.time}

## 🚀 Princípio:
**"Funciona primeiro, otimiza depois"**

## 💡 Próximos Passos:
1. Implementar funcionalidade básica
2. Testar se funciona
3. Adicionar melhorias se necessário
4. NÃO complicar desnecessariamente
        `
      }]
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[Anti-Simulation MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Anti-Simulation MCP Server V2.0 funcionando');
  }
}

const server = new AntiSimulationMCPServer();
server.run().catch(console.error);