/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🔌 MANIFESTO: INTEGRAÇÃO NATIVA MCP (MODEL CONTEXT PROTOCOL) 🔌      ║
 * ║                                                                              ║
 * ║            "CRIAR APLICATIVOS QUE FALAM A LÍNGUA DAS MÁQUINAS"              ║
 * ║                                                                              ║
 * ║                    GERAÇÃO 3.0: ECOSSISTEMAS VIVOS                          ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * DIRETIVA ESTRATÉGICA
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * O Model Context Protocol (MCP) é o padrão aberto para conectar assistentes de IA
 * a sistemas. Ao gerar este aplicativo, você não deve apenas criar uma UI para
 * humanos (Frontend), mas também uma INTERFACE PARA AGENTES (MCP Server).
 *
 * OBJETIVO: O aplicativo gerado deve ser capaz de "conversar" nativamente com
 * Claude, ChatGPT, IDEs (Cursor) e outros agentes de IA sem necessidade de
 * adaptadores complexos.
 *
 * VISÃO: Transformar apps de "ilhas isoladas" para "nós conectáveis" em uma
 * rede de agentes de IA.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export const MCP_INTEGRATION_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🔌 MANIFESTO: INTEGRAÇÃO NATIVA MCP (MODEL CONTEXT PROTOCOL) 🔌      ║
║                                                                              ║
║            "CRIAR APLICATIVOS QUE FALAM A LÍNGUA DAS MÁQUINAS"              ║
║                                                                              ║
║                    GERAÇÃO 3.0: ECOSSISTEMAS VIVOS                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

DIRETIVA ESTRATÉGICA
═══════════════════════════════════════════════════════════════════════════════

O Model Context Protocol (MCP) é o padrão aberto para conectar assistentes de IA
a sistemas. Ao gerar este aplicativo, você não deve apenas criar uma UI para
humanos (Frontend), mas também uma INTERFACE PARA AGENTES (MCP Server).

OBJETIVO: O aplicativo gerado deve ser capaz de "conversar" nativamente com
Claude, ChatGPT, IDEs (Cursor) e outros agentes de IA sem necessidade de
adaptadores complexos.

VISÃO: Transformar apps de "ilhas isoladas" para "nós conectáveis" em uma
rede de agentes de IA.

═══════════════════════════════════════════════════════════════════════════════

🏗️ PADRÕES DE IMPLEMENTAÇÃO MCP (OBRIGATÓRIO)
═══════════════════════════════════════════════════════════════════════════════

1. DEPENDÊNCIAS (Node.js/TypeScript):
   ✅ Adicionar "@modelcontextprotocol/sdk" ao package.json
   ✅ Usar "zod" para definição de schemas de ferramentas
   ✅ Usar "typescript" para type safety

2. ARQUITETURA DUAL (HUMANO + MÁQUINA):
   ✅ Rotas HTTP (/api/...) → Para o Frontend (React/Vue)
   ✅ Servidor MCP (Stdio/SSE) → Para Agentes de IA
   ✅ Ambos compartilham a mesma lógica de negócio (Services)

3. MAPEAMENTO AUTOMÁTICO:
   ✅ **GET Endpoints** viram **MCP RESOURCES** (Leitura passiva)
      Ex: "app://users/list" retorna JSON dos usuários
      Ex: "app://tasks/pending" retorna tarefas pendentes

   ✅ **POST/PUT/DELETE Endpoints** viram **MCP TOOLS** (Ação ativa)
      Ex: Ferramenta "create_user" com validação Zod
      Ex: Ferramenta "update_task" com descrição semântica

4. DESCRIÇÕES SEMÂNTICAS (CRÍTICO):
   ✅ Cada Tool deve ter uma descrição clara em português/inglês
   ✅ A IA usa essa descrição para saber QUANDO chamar a ferramenta
   ✅ Exemplo ruim: "Cria um usuário"
   ✅ Exemplo bom: "Cria um novo usuário no sistema com email, nome e senha validados"

═══════════════════════════════════════════════════════════════════════════════

💻 BLUEPRINT DE CÓDIGO (TYPESCRIPT / NODE)
═══════════════════════════════════════════════════════════════════════════════

Se estiver gerando um Backend (Express/Hono/Fastify), OBRIGATORIAMENTE crie
um arquivo dedicado \`src/mcp/server.ts\`:

\`\`\`typescript
// src/mcp/server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { db } from "../db"; // Acesso ao banco de dados

// ═══════════════════════════════════════════════════════════════════════════
// 1. INICIALIZAÇÃO DO SERVIDOR MCP
// ═══════════════════════════════════════════════════════════════════════════

const mcpServer = new McpServer({
  name: "Nome-Do-App-Gerado",
  version: "1.0.0"
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. RECURSOS (Resources) - Dados que a IA pode LER
// ═══════════════════════════════════════════════════════════════════════════

// Exemplo 1: Listar todos os usuários
mcpServer.resource(
  "list-users",
  "app://users/all",
  async (uri) => {
    const users = await db.users.findMany();
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(users, null, 2)
      }]
    };
  }
);

// Exemplo 2: Listar tarefas pendentes
mcpServer.resource(
  "list-pending-tasks",
  "app://tasks/pending",
  async (uri) => {
    const tasks = await db.tasks.findMany({
      where: { status: "PENDING" }
    });
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(tasks, null, 2)
      }]
    };
  }
);

// Exemplo 3: Obter estatísticas do sistema
mcpServer.resource(
  "system-stats",
  "app://stats/overview",
  async (uri) => {
    const stats = {
      totalUsers: await db.users.count(),
      totalTasks: await db.tasks.count(),
      completedTasks: await db.tasks.count({ where: { status: "COMPLETED" } }),
      timestamp: new Date().toISOString()
    };
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(stats, null, 2)
      }]
    };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// 3. FERRAMENTAS (Tools) - Ações que a IA pode EXECUTAR
// ═══════════════════════════════════════════════════════════════════════════

// Exemplo 1: Criar uma nova tarefa
mcpServer.tool(
  "create-task",
  "Cria uma nova tarefa no sistema com título, descrição e prioridade",
  {
    title: z.string().describe("Título da tarefa (máximo 100 caracteres)"),
    description: z.string().optional().describe("Descrição detalhada da tarefa"),
    priority: z.enum(["low", "medium", "high"]).describe("Nível de prioridade")
  },
  async ({ title, description, priority }) => {
    // Validação adicional
    if (title.length > 100) {
      return {
        content: [{ type: "text", text: "❌ Erro: Título muito longo (máximo 100 caracteres)" }]
      };
    }

    // Criar tarefa no banco
    const task = await db.tasks.create({
      data: { title, description, priority, status: "PENDING" }
    });

    return {
      content: [{
        type: "text",
        text: \`✅ Tarefa "\${task.title}" criada com sucesso (ID: \${task.id})\`
      }]
    };
  }
);

// Exemplo 2: Atualizar status de uma tarefa
mcpServer.tool(
  "update-task-status",
  "Atualiza o status de uma tarefa existente (PENDING, IN_PROGRESS, COMPLETED)",
  {
    taskId: z.string().uuid().describe("ID da tarefa a atualizar"),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).describe("Novo status")
  },
  async ({ taskId, status }) => {
    const task = await db.tasks.update({
      where: { id: taskId },
      data: { status }
    });

    return {
      content: [{
        type: "text",
        text: \`✅ Tarefa "\${task.title}" atualizada para \${status}\`
      }]
    };
  }
);

// Exemplo 3: Criar um novo usuário
mcpServer.tool(
  "create-user",
  "Cria um novo usuário no sistema com email, nome e senha",
  {
    email: z.string().email().describe("Email do usuário (deve ser único)"),
    name: z.string().describe("Nome completo do usuário"),
    password: z.string().min(8).describe("Senha (mínimo 8 caracteres)")
  },
  async ({ email, name, password }) => {
    // Verificar se email já existe
    const existingUser = await db.users.findUnique({ where: { email } });
    if (existingUser) {
      return {
        content: [{ type: "text", text: "❌ Erro: Email já cadastrado" }]
      };
    }

    // Hash da senha (usar bcrypt em produção!)
    const hashedPassword = await hashPassword(password);

    // Criar usuário
    const user = await db.users.create({
      data: { email, name, password: hashedPassword }
    });

    return {
      content: [{
        type: "text",
        text: \`✅ Usuário "\${user.name}" criado com sucesso (ID: \${user.id})\`
      }]
    };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// 4. TRANSPORTE (Conexão)
// ═══════════════════════════════════════════════════════════════════════════

async function startMcpServer() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("✅ MCP Server iniciado e aguardando conexões via Stdio");
}

// Iniciar se for executado diretamente
if (require.main === module) {
  startMcpServer().catch(console.error);
}

export { mcpServer, startMcpServer };
\`\`\`

═══════════════════════════════════════════════════════════════════════════════

📦 ESTRUTURA DE PROJETO COMPLETA
═══════════════════════════════════════════════════════════════════════════════

Seu app gerado deve ter esta estrutura:

\`\`\`
meu-app/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── users.ts        # GET /api/users, POST /api/users
│   │   │   ├── tasks.ts        # GET /api/tasks, POST /api/tasks
│   │   │   └── stats.ts        # GET /api/stats
│   │   └── server.ts           # Express/Hono/Fastify
│   │
│   ├── mcp/
│   │   └── server.ts           # 🔌 SERVIDOR MCP (NOVO!)
│   │
│   ├── services/
│   │   ├── UserService.ts      # Lógica de usuários
│   │   ├── TaskService.ts      # Lógica de tarefas
│   │   └── StatsService.ts     # Lógica de estatísticas
│   │
│   ├── db/
│   │   ├── schema.prisma       # Schema do banco
│   │   └── client.ts           # Cliente Prisma
│   │
│   └── index.ts                # Entry point
│
├── package.json
├── tsconfig.json
├── README.md
└── .env.example
\`\`\`

═══════════════════════════════════════════════════════════════════════════════

🧠 MODOS DE USO (INTEGRAÇÃO)
═══════════════════════════════════════════════════════════════════════════════

1. **MODO PASSIVO (Context Provider):**
   - O app serve apenas como fonte de dados (Resources)
   - Ideal para: Dashboards, Wikis, Logs, Bases de Conhecimento
   - Exemplo: Claude lê dados do seu app mas não modifica nada

2. **MODO ATIVO (Action Provider):**
   - O app expõe funções de negócio (Tools)
   - Ideal para: CRMs, ERPs, E-commerce, Gestão de Tarefas
   - Exemplo: Claude cria tarefas, atualiza usuários, etc

3. **MODO AGENTE (Loopback):**
   - O Backend instancia um *Cliente MCP* para falar consigo mesmo
   - Permite automação autônoma interna
   - Exemplo: Um agente interno monitora tarefas e notifica usuários

═══════════════════════════════════════════════════════════════════════════════

🚀 COMO CONECTAR AO CLAUDE DESKTOP
═══════════════════════════════════════════════════════════════════════════════

1. Instale o Claude Desktop (https://claude.ai/download)

2. Edite o arquivo de configuração:
   - Windows: %APPDATA%\\Claude\\claude_desktop_config.json
   - Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
   - Linux: ~/.config/Claude/claude_desktop_config.json

3. Adicione seu app como servidor MCP:

\`\`\`json
{
  "mcpServers": {
    "meu-app": {
      "command": "node",
      "args": ["./dist/mcp/server.js"],
      "env": {
        "DATABASE_URL": "postgresql://...",
        "NODE_ENV": "production"
      }
    }
  }
}
\`\`\`

4. Reinicie o Claude Desktop

5. Agora Claude pode:
   - Ler dados do seu app (Resources)
   - Executar ações no seu app (Tools)
   - Tudo nativamente, sem APIs REST extras!

═══════════════════════════════════════════════════════════════════════════════

🔒 SEGURANÇA E BOAS PRÁTICAS
═══════════════════════════════════════════════════════════════════════════════

✅ OBRIGATÓRIO:
   - Validar TODOS os inputs com Zod
   - Usar descrições semânticas nas Tools (a IA usa isso)
   - Implementar autenticação/autorização
   - Logar todas as ações executadas via MCP
   - Usar transações atômicas para operações críticas
   - Sanitizar inputs para prevenir SQL injection

✅ RECOMENDADO:
   - Rate limiting em Tools (máximo X chamadas por minuto)
   - Auditoria completa (quem, quando, o quê)
   - Versionamento de API
   - Testes automatizados para cada Tool
   - Documentação clara de cada Resource e Tool

❌ NUNCA:
   - Expor dados sensíveis (senhas, tokens, chaves)
   - Permitir operações destrutivas sem confirmação
   - Confiar cegamente em inputs da IA
   - Deixar o servidor MCP sem autenticação em produção

═══════════════════════════════════════════════════════════════════════════════

📝 EXEMPLO COMPLETO: SISTEMA DE GESTÃO DE TAREFAS
═══════════════════════════════════════════════════════════════════════════════

Quando o usuário pedir:
"Crie um sistema de gestão de tarefas em Node.js com suporte a MCP"

Você DEVE gerar:

1. ✅ Backend Express/Hono com rotas HTTP
2. ✅ Arquivo src/mcp/server.ts com:
   - Resource: "app://tasks/all" (listar tarefas)
   - Resource: "app://tasks/pending" (tarefas pendentes)
   - Tool: "create-task" (criar tarefa)
   - Tool: "update-task-status" (atualizar status)
   - Tool: "delete-task" (deletar tarefa)
3. ✅ package.json com "@modelcontextprotocol/sdk"
4. ✅ README com instruções de como conectar ao Claude
5. ✅ Dockerfile para deploy

Resultado: Um app que funciona tanto para humanos (via navegador) quanto
para agentes de IA (via MCP).

═══════════════════════════════════════════════════════════════════════════════

🎯 CHECKLIST DE IMPLEMENTAÇÃO
═══════════════════════════════════════════════════════════════════════════════

Antes de retornar o código gerado, verifique:

[ ] Arquivo src/mcp/server.ts criado?
[ ] @modelcontextprotocol/sdk adicionado ao package.json?
[ ] Pelo menos 3 Resources definidos?
[ ] Pelo menos 3 Tools definidas?
[ ] Todas as Tools têm descrições semânticas?
[ ] Todos os inputs são validados com Zod?
[ ] README inclui instruções de MCP?
[ ] Exemplo de configuração do Claude Desktop incluído?
[ ] Testes para as Tools incluídos?
[ ] Segurança implementada (validação, sanitização)?

═══════════════════════════════════════════════════════════════════════════════

🏆 RESULTADO FINAL
═══════════════════════════════════════════════════════════════════════════════

Seu app deixa de ser uma "ilha isolada" e se torna um "nó inteligente" em uma
rede de agentes de IA.

Agora:
- Claude pode ler dados do seu app
- Claude pode executar ações no seu app
- Cursor pode acessar seu app enquanto você programa
- Outros agentes podem integrar com seu app
- Tudo via um protocolo padrão (MCP)

ESTE APLICATIVO É UM CIDADÃO DE PRIMEIRA CLASSE NA ECONOMIA DE AGENTES. 🔌

═══════════════════════════════════════════════════════════════════════════════
`;

/**
 * Função para detectar se um prompt precisa de MCP
 */
export function shouldEnableMCP(prompt: string): boolean {
    const mcpKeywords = [
        'mcp',
        'model context protocol',
        'agente',
        'agent',
        'interoperabilidade',
        'conectar com claude',
        'conectar com cursor',
        'api para ia',
        'tools para ia',
        'resources para ia',
        'context server',
        'mcp server',
        'automação autônoma',
        'ia pode acessar',
        'claude pode usar',
        'cursor pode usar'
    ];

    const promptLower = prompt.toLowerCase();
    return mcpKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Função para gerar o arquivo mcp/server.ts
 */
export function generateMCPServerTemplate(appName: string, resources: string[], tools: string[]): string {
    return `// src/mcp/server.ts
// 🔌 Servidor MCP para ${appName}
// Gerado automaticamente - Não edite manualmente

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { db } from "../db";

const mcpServer = new McpServer({
  name: "${appName}",
  version: "1.0.0"
});

// Resources (Dados que a IA pode ler)
${resources.map(r => `// TODO: Implementar resource: ${r}`).join('\n')}

// Tools (Ações que a IA pode executar)
${tools.map(t => `// TODO: Implementar tool: ${t}`).join('\n')}

async function startMcpServer() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("✅ MCP Server iniciado");
}

if (require.main === module) {
  startMcpServer().catch(console.error);
}

export { mcpServer, startMcpServer };
`;
}

export default MCP_INTEGRATION_MANIFEST;
