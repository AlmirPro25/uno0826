#!/usr/bin/env node

/**
 * Servidor MCP para Inteligência de Projeto
 * Ensina a IA a ser mais inteligente sobre o que o usuário REALMENTE quer
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

class ProjectIntelligenceServer {
  constructor() {
    this.server = new Server(
      {
        name: 'project-intelligence',
        version: '1.0.0',
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
          name: 'analyze_project_needs',
          description: 'Analisa o que o usuário REALMENTE precisa, não o que ele disse',
          inputSchema: {
            type: 'object',
            properties: {
              userRequest: {
                type: 'string',
                description: 'O que o usuário pediu'
              },
              projectContext: {
                type: 'string',
                description: 'Contexto do projeto atual'
              }
            },
            required: ['userRequest']
          }
        },
        {
          name: 'suggest_minimal_solution',
          description: 'Sugere a solução mais simples que resolve o problema',
          inputSchema: {
            type: 'object',
            properties: {
              problem: {
                type: 'string',
                description: 'Problema a ser resolvido'
              },
              constraints: {
                type: 'array',
                items: { type: 'string' },
                description: 'Limitações conhecidas'
              }
            },
            required: ['problem']
          }
        },
        {
          name: 'avoid_complexity',
          description: 'Identifica complexidade desnecessária e sugere alternativas',
          inputSchema: {
            type: 'object',
            properties: {
              proposedSolution: {
                type: 'string',
                description: 'Solução proposta'
              }
            },
            required: ['proposedSolution']
          }
        },
        {
          name: 'focus_on_functionality',
          description: 'Redireciona foco para funcionalidade ao invés de aparência',
          inputSchema: {
            type: 'object',
            properties: {
              currentFocus: {
                type: 'string',
                description: 'Foco atual do desenvolvimento'
              }
            },
            required: ['currentFocus']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'analyze_project_needs':
          return this.analyzeProjectNeeds(args);
        case 'suggest_minimal_solution':
          return this.suggestMinimalSolution(args);
        case 'avoid_complexity':
          return this.avoidComplexity(args);
        case 'focus_on_functionality':
          return this.focusOnFunctionality(args);
        default:
          throw new Error(`Ferramenta desconhecida: ${name}`);
      }
    });
  }

  async analyzeProjectNeeds({ userRequest, projectContext = '' }) {
    const analysis = {
      realNeed: this.extractRealNeed(userRequest),
      suggestedApproach: this.suggestApproach(userRequest),
      avoidThese: this.identifyUnnecessaryFeatures(userRequest),
      implementation: this.suggestImplementation(userRequest)
    };

    return {
      content: [{
        type: 'text',
        text: `
# Análise Inteligente do Projeto

## O que o usuário REALMENTE precisa:
${analysis.realNeed}

## Abordagem recomendada:
${analysis.suggestedApproach}

## O que EVITAR (complexidade desnecessária):
${analysis.avoidThese.map(item => `- ❌ ${item}`).join('\n')}

## Implementação sugerida:
${analysis.implementation}

## Princípio: "Menos é mais"
- Funcionalidade primeiro, beleza depois
- Se funciona simples, não complique
- Usuário quer resultado, não processo
        `
      }]
    };
  }

  extractRealNeed(request) {
    const keywords = {
      'jogo': 'Criar uma experiência interativa que funcione',
      'site': 'Página web que carregue e execute sua função',
      'api': 'Endpoints que respondam corretamente',
      'sistema': 'Funcionalidade que resolva o problema específico',
      'app': 'Aplicação que execute a tarefa necessária',
      'dashboard': 'Interface para visualizar/controlar dados',
      'formulário': 'Captura de dados que funcione',
      'chat': 'Comunicação em tempo real',
      'login': 'Autenticação básica (só se realmente necessário)'
    };

    for (const [keyword, need] of Object.entries(keywords)) {
      if (request.toLowerCase().includes(keyword)) {
        return need;
      }
    }

    return 'Resolver o problema específico mencionado';
  }

  suggestApproach(request) {
    if (request.toLowerCase().includes('jogo')) {
      return 'HTML + Canvas/CSS + JavaScript vanilla = Jogo funcionando';
    }
    if (request.toLowerCase().includes('api')) {
      return 'Express.js + rotas essenciais = API funcionando';
    }
    if (request.toLowerCase().includes('site') || request.toLowerCase().includes('página')) {
      return 'HTML completo com JavaScript = Site funcionando';
    }
    if (request.toLowerCase().includes('react')) {
      return 'Componentes React mínimos = App funcionando';
    }
    
    return 'Solução mais direta possível que atenda o requisito';
  }

  identifyUnnecessaryFeatures(request) {
    const unnecessary = [];
    
    // Se não mencionou autenticação, não precisa
    if (!request.toLowerCase().includes('login') && !request.toLowerCase().includes('auth')) {
      unnecessary.push('Sistema de login/autenticação');
    }
    
    // Se não mencionou banco de dados, talvez não precise
    if (!request.toLowerCase().includes('banco') && !request.toLowerCase().includes('database')) {
      unnecessary.push('Banco de dados complexo (use localStorage ou arquivo)');
    }
    
    // Se não mencionou design específico, foque na função
    if (!request.toLowerCase().includes('design') && !request.toLowerCase().includes('bonito')) {
      unnecessary.push('Design elaborado (CSS básico resolve)');
    }
    
    // Sempre evitar over-engineering
    unnecessary.push('Arquitetura complexa para problema simples');
    unnecessary.push('Frameworks pesados para tarefas básicas');
    unnecessary.push('Configurações elaboradas');
    
    return unnecessary;
  }

  suggestImplementation(request) {
    if (request.toLowerCase().includes('jogo')) {
      return `
\`\`\`html
<!DOCTYPE html>
<html>
<head><title>Jogo</title></head>
<body>
  <canvas id="game"></canvas>
  <script>
    // JOGO QUE FUNCIONA AQUI
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    // ... lógica do jogo
  </script>
</body>
</html>
\`\`\`
Resultado: Jogo funcionando em 1 arquivo.`;
    }

    if (request.toLowerCase().includes('api')) {
      return `
\`\`\`javascript
const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/data', (req, res) => {
  res.json({ message: 'Funcionando!' });
});

app.listen(3000);
\`\`\`
Resultado: API funcionando em minutos.`;
    }

    return 'Implementação mais direta possível que resolva o problema';
  }

  async suggestMinimalSolution({ problem, constraints = [] }) {
    const solutions = {
      'preciso de um jogo': {
        minimal: 'HTML + Canvas + JavaScript = Jogo pronto',
        code: 'Arquivo único .html com tudo dentro',
        time: '30 minutos'
      },
      'preciso de uma api': {
        minimal: 'Express.js + rotas básicas = API funcionando',
        code: 'server.js com endpoints essenciais',
        time: '15 minutos'
      },
      'preciso de um site': {
        minimal: 'HTML + CSS + JS = Site completo',
        code: 'index.html com funcionalidades',
        time: '20 minutos'
      }
    };

    const matchedSolution = Object.entries(solutions).find(([key]) => 
      problem.toLowerCase().includes(key.split(' ').slice(-1)[0])
    );

    const solution = matchedSolution ? matchedSolution[1] : {
      minimal: 'Solução mais simples possível',
      code: 'Código mínimo que funciona',
      time: 'Tempo mínimo necessário'
    };

    return {
      content: [{
        type: 'text',
        text: `
# Solução Mínima para: "${problem}"

## Abordagem:
${solution.minimal}

## Implementação:
${solution.code}

## Tempo estimado:
${solution.time}

## Restrições consideradas:
${constraints.length > 0 ? constraints.map(c => `- ${c}`).join('\n') : '- Nenhuma restrição específica'}

## Princípio:
**"Funciona primeiro, otimiza depois"**
        `
      }]
    };
  }

  async avoidComplexity({ proposedSolution }) {
    const complexityIndicators = [
      'microservices', 'kubernetes', 'docker', 'redis', 'mongodb',
      'webpack', 'babel', 'typescript', 'sass', 'less',
      'authentication', 'authorization', 'jwt', 'oauth',
      'testing framework', 'ci/cd', 'deployment pipeline'
    ];

    const foundComplexity = complexityIndicators.filter(indicator =>
      proposedSolution.toLowerCase().includes(indicator)
    );

    const alternatives = {
      'microservices': 'Monolito simples',
      'kubernetes': 'Servidor simples',
      'docker': 'Executar diretamente',
      'redis': 'Variáveis em memória',
      'mongodb': 'Arquivo JSON ou localStorage',
      'webpack': 'Arquivos estáticos',
      'babel': 'JavaScript vanilla',
      'typescript': 'JavaScript simples',
      'sass': 'CSS puro',
      'authentication': 'Sem login (se possível)',
      'testing framework': 'Testes manuais primeiro',
      'ci/cd': 'Deploy manual'
    };

    return {
      content: [{
        type: 'text',
        text: `
# Análise de Complexidade

## Complexidade desnecessária identificada:
${foundComplexity.length > 0 ? 
  foundComplexity.map(item => `- ❌ ${item} → ✅ ${alternatives[item] || 'Alternativa mais simples'}`).join('\n') :
  '✅ Solução parece adequadamente simples'
}

## Pergunta fundamental:
**"Isso é realmente necessário para fazer funcionar?"**

## Regra de ouro:
- Se funciona sem, não adicione
- Se pode ser mais simples, simplifique
- Se o usuário não pediu, não implemente

## Alternativa simplificada:
${this.simplifyProposal(proposedSolution)}
        `
      }]
    };
  }

  simplifyProposal(proposal) {
    // Simplificação básica baseada em padrões comuns
    if (proposal.includes('React') && proposal.includes('backend')) {
      return 'HTML completo com JavaScript vanilla (sem React, sem backend)';
    }
    if (proposal.includes('database')) {
      return 'localStorage ou arquivo JSON simples';
    }
    if (proposal.includes('framework')) {
      return 'Código vanilla que funciona';
    }
    return 'Versão mais simples da mesma funcionalidade';
  }

  async focusOnFunctionality({ currentFocus }) {
    const functionalityFirst = {
      'design': 'Funcionalidade primeiro, depois CSS bonito',
      'ui/ux': 'Botões que funcionam primeiro, depois design',
      'arquitetura': 'Código que roda primeiro, depois organização',
      'performance': 'Funcionalidade completa primeiro, depois otimização',
      'testes': 'Funcionalidade funcionando primeiro, depois testes',
      'documentação': 'Código funcionando primeiro, depois documentação'
    };

    const redirect = Object.entries(functionalityFirst).find(([key]) =>
      currentFocus.toLowerCase().includes(key)
    );

    return {
      content: [{
        type: 'text',
        text: `
# Redirecionamento de Foco

## Foco atual: "${currentFocus}"
${redirect ? `## Redirecionamento: ${redirect[1]}` : '## Foco adequado: Funcionalidade'}

## Prioridades corretas:
1. **FUNCIONA** - O sistema faz o que deve fazer
2. **COMPLETO** - Todas as funcionalidades essenciais
3. **TESTADO** - Funciona na prática
4. **SIMPLES** - Fácil de entender e manter

## Depois (se sobrar tempo):
5. Design bonito
6. Otimizações
7. Testes automatizados
8. Documentação elaborada

## Lembrete:
**"Usuário quer resultado, não processo"**
        `
      }]
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[Project Intelligence Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Project Intelligence MCP Server funcionando');
  }
}

const server = new ProjectIntelligenceServer();
server.run().catch(console.error);