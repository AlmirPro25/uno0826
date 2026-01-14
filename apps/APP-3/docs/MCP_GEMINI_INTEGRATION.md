# 🔌 MCP Gemini Integration Guide

## O que é MCP?

**Model Context Protocol (MCP)** é um protocolo aberto da Anthropic que permite que agentes de IA acessem ferramentas, dados e prompts de forma padronizada.

Com a integração MCP no seu GeminiService, qualquer agente de IA (Claude, GPT, Gemini, etc) pode:
- 📖 **Ler dados** (Resources)
- 🔧 **Executar ações** (Tools)
- 📝 **Usar templates** (Prompts)

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Agentes de IA Externos                   │
│              (Claude, GPT, Gemini, etc)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                    MCP Protocol
                         │
┌────────────────────────▼────────────────────────────────────┐
│              MCPGeminiServer (services/MCPGeminiServer.ts)   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Resources (Dados Passivos)                           │  │
│  │ - gemini://personas/list                             │  │
│  │ - gemini://personas/{id}                             │  │
│  │ - gemini://usage/status                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tools (Ações Executáveis)                            │  │
│  │ - gemini:generate                                    │  │
│  │ - gemini:generate-html                               │  │
│  │ - gemini:critique                                    │  │
│  │ - gemini:debug                                       │  │
│  │ - gemini:refactor                                    │  │
│  │ - gemini:generate-tests                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Prompts (Templates)                                  │  │
│  │ - gemini:create-landing-page                         │  │
│  │ - gemini:create-dashboard                            │  │
│  │ - gemini:create-form                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              GeminiService (services/GeminiService.ts)       │
│                                                              │
│  - generateContent()                                         │
│  - generateWithPersona()                                     │
│  - generateHtmlWithExcellence()                              │
│  - critiqueGeneratedSite()                                   │
│  - debugCodeWithAi()                                         │
│  - suggestRefactoring()                                      │
│  - generateTestSuggestions()                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Google Gemini API                         │
└─────────────────────────────────────────────────────────────┘
```

## Como Usar

### 1. Inicializar o Servidor MCP

```typescript
import { getMCPGeminiServer } from '@/services/MCPGeminiServer';

// Inicializar (singleton)
const server = await getMCPGeminiServer();
```

### 2. Acessar Recursos (Resources)

Recursos são dados passivos que a IA pode ler:

```typescript
// Listar todas as personas disponíveis
const response = await server.handleRequest({
    type: 'resource',
    name: 'gemini://personas/list'
});
console.log(response.data); // Array de personas

// Obter detalhes de uma persona específica
const personaResponse = await server.handleRequest({
    type: 'resource',
    name: 'gemini://personas/security_architect'
});
console.log(personaResponse.data); // Detalhes da persona

// Verificar status de uso da API
const usageResponse = await server.handleRequest({
    type: 'resource',
    name: 'gemini://usage/status'
});
console.log(usageResponse.data); // { currentUsage, dailyLimit, remainingQuota, resetTime }
```

### 3. Executar Ferramentas (Tools)

Ferramentas são ações que a IA pode executar:

```typescript
// Gerar conteúdo com Gemini
const generateResponse = await server.handleRequest({
    type: 'tool',
    name: 'gemini:generate',
    params: {
        prompt: 'Crie um exemplo de código TypeScript',
        modelName: 'gemini-2.5-flash',
        personaId: 'security_architect' // opcional
    }
});
console.log(generateResponse.data.content);

// Gerar HTML com excelência máxima
const htmlResponse = await server.handleRequest({
    type: 'tool',
    name: 'gemini:generate-html',
    params: {
        prompt: 'Crie uma landing page para um SaaS de IA'
    }
});
console.log(htmlResponse.data.html);

// Criticar código gerado
const critiqueResponse = await server.handleRequest({
    type: 'tool',
    name: 'gemini:critique',
    params: {
        html: '<html>...</html>',
        userPrompt: 'Crie uma landing page'
    }
});
console.log(critiqueResponse.data.critique);

// Debugar código
const debugResponse = await server.handleRequest({
    type: 'tool',
    name: 'gemini:debug',
    params: {
        code: 'const x = 1\nconsole.log(x',
        problemDescription: 'Erro de sintaxe'
    }
});
console.log(debugResponse.data.solution);

// Sugerir refatoração
const refactorResponse = await server.handleRequest({
    type: 'tool',
    name: 'gemini:refactor',
    params: {
        code: 'function add(a, b) { return a + b; }',
        language: 'typescript'
    }
});
console.log(refactorResponse.data.suggestions);

// Gerar testes
const testsResponse = await server.handleRequest({
    type: 'tool',
    name: 'gemini:generate-tests',
    params: {
        code: 'function multiply(a, b) { return a * b; }',
        testFramework: 'jest'
    }
});
console.log(testsResponse.data.tests);
```

### 4. Usar Prompts (Templates)

Prompts são templates pré-configurados que facilitam tarefas comuns:

```typescript
// Criar landing page
const landingPageResponse = await server.handleRequest({
    type: 'prompt',
    name: 'gemini:create-landing-page',
    params: {
        productName: 'Nexus Bank',
        targetAudience: 'Desenvolvedores e Fintechs',
        mainFeatures: 'Segurança, Escalabilidade, Conformidade BACEN'
    }
});
console.log(landingPageResponse.data.template);

// Criar dashboard
const dashboardResponse = await server.handleRequest({
    type: 'prompt',
    name: 'gemini:create-dashboard',
    params: {
        dataType: 'Transações Financeiras',
        metrics: 'Volume, Valor, Taxa de Sucesso, Tempo Médio'
    }
});
console.log(dashboardResponse.data.template);

// Criar formulário
const formResponse = await server.handleRequest({
    type: 'prompt',
    name: 'gemini:create-form',
    params: {
        formPurpose: 'Cadastro de Usuário',
        fields: 'Email, Senha, CPF, Nome Completo'
    }
});
console.log(formResponse.data.template);
```

## Integração com Agentes de IA

### Exemplo: Usar com Claude (via MCP)

```typescript
// No seu cliente MCP (ex: Claude Desktop)
// Configurar em ~/.kiro/settings/mcp.json ou .kiro/settings/mcp.json

{
  "mcpServers": {
    "gemini-service": {
      "command": "node",
      "args": ["./services/MCPGeminiServer.ts"],
      "env": {
        "GEMINI_API_KEY": "sua-chave-aqui"
      }
    }
  }
}
```

Depois, Claude pode usar:

```
Claude: "Use a ferramenta gemini:generate para criar um exemplo de código seguro"

MCP: Executa gemini:generate com os parâmetros apropriados
```

### Exemplo: Usar com Agentes Internos

```typescript
import { executeMCPRequest } from '@/services/MCPGeminiServer';

// Seu agente interno pode fazer requisições MCP
async function myInternalAgent() {
    // Obter personas recomendadas
    const personaRecommendation = await executeMCPRequest({
        type: 'resource',
        name: 'gemini://personas/list'
    });

    // Gerar código com a persona recomendada
    const codeGeneration = await executeMCPRequest({
        type: 'tool',
        name: 'gemini:generate',
        params: {
            prompt: 'Crie um middleware de autenticação seguro',
            personaId: 'security_architect'
        }
    });

    return codeGeneration.data.content;
}
```

## Métodos Úteis do Servidor

```typescript
const server = await getMCPGeminiServer();

// Listar recursos disponíveis
server.listResources();
// ['gemini://personas/list', 'gemini://personas/{personaId}', 'gemini://usage/status']

// Listar ferramentas disponíveis
server.listTools();
// ['gemini:generate', 'gemini:generate-html', 'gemini:critique', ...]

// Listar prompts disponíveis
server.listPrompts();
// ['gemini:create-landing-page', 'gemini:create-dashboard', ...]

// Obter informações de uma ferramenta
server.getToolInfo('gemini:generate');
// { name, description, inputSchema }

// Obter informações de um prompt
server.getPromptInfo('gemini:create-landing-page');
// { name, description, arguments }

// Obter histórico de requisições
server.getRequestLog();
// Array de requisições processadas

// Obter configuração do servidor
server.getServerConfig();
// { name, version, resources, tools, prompts, capabilities }
```

## Casos de Uso

### 1. Agente de Desenvolvimento Autônomo

```typescript
// Um agente que gera, testa e refatora código automaticamente
async function autonomousDeveloper(requirement: string) {
    const server = await getMCPGeminiServer();

    // 1. Gerar código
    const code = await server.handleRequest({
        type: 'tool',
        name: 'gemini:generate',
        params: { prompt: requirement }
    });

    // 2. Gerar testes
    const tests = await server.handleRequest({
        type: 'tool',
        name: 'gemini:generate-tests',
        params: {
            code: code.data.content,
            testFramework: 'jest'
        }
    });

    // 3. Sugerir refatoração
    const refactoring = await server.handleRequest({
        type: 'tool',
        name: 'gemini:refactor',
        params: {
            code: code.data.content,
            language: 'typescript'
        }
    });

    return { code, tests, refactoring };
}
```

### 2. Assistente de Segurança

```typescript
// Um agente que valida código para vulnerabilidades
async function securityAssistant(code: string) {
    const server = await getMCPGeminiServer();

    // Usar persona de segurança
    const securityReview = await server.handleRequest({
        type: 'tool',
        name: 'gemini:generate',
        params: {
            prompt: `Analise este código para vulnerabilidades de segurança:\n${code}`,
            personaId: 'security_architect'
        }
    });

    return securityReview.data.content;
}
```

### 3. Gerador de Interfaces

```typescript
// Um agente que gera interfaces web com excelência
async function interfaceGenerator(description: string) {
    const server = await getMCPGeminiServer();

    // Usar template de landing page
    const template = await server.handleRequest({
        type: 'prompt',
        name: 'gemini:create-landing-page',
        params: {
            productName: 'Meu Produto',
            targetAudience: 'Usuários Finais',
            mainFeatures: description
        }
    });

    // Gerar HTML com excelência
    const html = await server.handleRequest({
        type: 'tool',
        name: 'gemini:generate-html',
        params: { prompt: template.data.template }
    });

    return html.data.html;
}
```

## Segurança

### Rate Limiting

O servidor respeita os limites de uso da API Gemini:

```typescript
const server = await getMCPGeminiServer();
const usage = await server.handleRequest({
    type: 'resource',
    name: 'gemini://usage/status'
});

console.log(`Uso: ${usage.data.currentUsage}/${usage.data.dailyLimit}`);
console.log(`Quota restante: ${usage.data.remainingQuota}`);
```

### Validação de Entrada

Todas as requisições são validadas:

```typescript
// ❌ Erro: parâmetro obrigatório faltando
await server.handleRequest({
    type: 'tool',
    name: 'gemini:generate'
    // falta 'params.prompt'
});

// ✅ Correto
await server.handleRequest({
    type: 'tool',
    name: 'gemini:generate',
    params: { prompt: 'Seu prompt aqui' }
});
```

### Auditoria

Todas as requisições são logadas:

```typescript
const server = await getMCPGeminiServer();
const log = server.getRequestLog();

log.forEach(request => {
    console.log(`${request.type}: ${request.name}`);
});
```

## Próximos Passos

1. **Integrar com seu backend**: Expor o MCP via HTTP/SSE
2. **Conectar com Claude Desktop**: Configurar em `~/.kiro/settings/mcp.json`
3. **Criar agentes especializados**: Use personas para diferentes domínios
4. **Monitorar uso**: Acompanhe quota e performance

## Referências

- [Model Context Protocol (Anthropic)](https://modelcontextprotocol.io/)
- [Gemini API Documentation](https://ai.google.dev/)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
