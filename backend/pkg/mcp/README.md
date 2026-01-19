# MCP - Model Context Protocol Framework

> **O Coração Soberano do UNO KERNEL**

O pacote `mcp` implementa o **Model Context Protocol** - um framework de orquestração de agentes autônomos com garantias de auditoria, rastreabilidade e segurança Zero Trust.

## 🏛️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        HTTP API                                  │
│              POST /api/v1/mcp/dispatch                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DISPATCHER                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Identify    │→ │ Validate    │→ │  Execute    │              │
│  │ Agent       │  │ Capability  │  │  Command    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         ↓               ↓                ↓                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              AUDIT REPOSITORY (Immutable Logs)            │   │
│  │   INTENT → EXECUTION → SUCCESS/FAILURE/VIOLATION          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AGENTS                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Identity    │  │ Financial   │  │ Billing     │              │
│  │ Agent       │  │ Agent       │  │ Agent       │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Criar o Dispatcher

```go
import "prost-qs/backend/pkg/mcp"

// Criar repositório de auditoria (in-memory para dev)
auditRepo := mcp.NewInMemoryAuditRepo(10000)

// Criar dispatcher com configuração padrão
dispatcher := mcp.NewDispatcher(auditRepo, mcp.DefaultConfig())
```

### 2. Implementar um Agente

```go
type MyAgent struct {
    mcp.BaseAgent
}

func NewMyAgent() *MyAgent {
    return &MyAgent{
        BaseAgent: mcp.BaseAgent{
            AgentID:          "my-agent-001",
            AgentName:        "My Custom Agent",
            AgentCapabilities: []string{
                "domain:action:create",
                "domain:action:read",
            },
        },
    }
}

func (a *MyAgent) Execute(ctx context.Context, cmd mcp.Command) (mcp.Result, error) {
    traceID := mcp.GetTraceID(ctx) // Para logging/debugging
    
    switch cmd.Name {
    case "domain:action:create":
        // Sua lógica aqui
        return mcp.Result{Data: map[string]string{"id": "123"}}, nil
    default:
        return mcp.Result{Error: "Unknown command"}, fmt.Errorf("unknown: %s", cmd.Name)
    }
}
```

### 3. Registrar e Executar

```go
// Registrar agente
myAgent := NewMyAgent()
dispatcher.Register(myAgent)

// Executar comando
ctx := mcp.WithTraceID(context.Background(), mcp.GenerateTraceID())
resp, err := dispatcher.Dispatch(ctx, mcp.DispatchRequest{
    AgentID: "my-agent-001",
    Command: "domain:action:create",
    Params:  json.RawMessage(`{"name": "Test"}`),
})

fmt.Printf("TraceID: %s, Status: %s\n", resp.TraceID, resp.Status)
```

### 4. Expor via HTTP

```go
import "github.com/gin-gonic/gin"

router := gin.Default()
mcpHandler := mcp.NewMCPHandler(dispatcher, auditRepo)
mcpHandler.RegisterRoutes(router.Group("/api/v1/mcp"))

router.Run(":8080")
```

## 📚 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/mcp/dispatch` | Executa um comando em um agente |
| GET | `/api/v1/mcp/agents` | Lista todos os agentes registrados |
| GET | `/api/v1/mcp/audit/events` | Busca eventos de auditoria |
| GET | `/api/v1/mcp/audit/trace/:traceId` | Busca eventos de um trace específico |
| GET | `/api/v1/mcp/health` | Verifica saúde do sistema MCP |

### Exemplo: Dispatch Request

```bash
curl -X POST http://localhost:8080/api/v1/mcp/dispatch \
  -H "Content-Type: application/json" \
  -H "X-Trace-ID: custom-trace-123" \
  -d '{
    "agent_id": "system-agent-001",
    "command": "system:health:check",
    "params": {}
  }'
```

### Exemplo: Response

```json
{
  "trace_id": "custom-trace-123",
  "status": "SUCCESS",
  "result": {
    "status": "healthy",
    "uptime_ms": 12345,
    "agent_count": 3
  },
  "execution_time_ms": 2,
  "timestamp": "2026-01-19T05:10:00Z"
}
```

## 🔐 Zero Trust: Capabilities

O sistema usa um modelo de **Capabilities** para autorização:

```go
// Formato: "domain:resource:action"
capabilities := []string{
    "identity:user:create",    // Pode criar usuários
    "identity:user:read",      // Pode ler usuários
    "identity:*",              // Wildcard: todas as ações de identity
    "*",                       // Super admin: tudo permitido
}
```

O Dispatcher **SEMPRE** valida se o agente tem a capability antes de executar.

## 📊 Auditoria

Cada execução gera eventos imutáveis:

| EventType | Quando |
|-----------|--------|
| `INTENT` | Antes da execução (registra intenção) |
| `SUCCESS` | Após execução bem-sucedida |
| `FAILURE` | Após execução falhada |
| `VIOLATION` | Quando capability é negada |

Todos os eventos contêm:
- **TraceID**: Identificador único da operação
- **Timestamp**: Momento exato
- **AgentID**: Quem executou
- **Command**: O que foi executado
- **Payload**: Dados de entrada/saída

## 🧪 Testes

```bash
cd backend
go test ./pkg/mcp/... -v
```

## 📁 Estrutura de Arquivos

```
pkg/mcp/
├── types.go         # Structs: Command, Result, KernelEvent
├── context.go       # TraceID e contexto de execução
├── agent.go         # Interface MCPAgent
├── dispatcher.go    # Orquestrador principal
├── audit_memory.go  # Repositório in-memory
├── agents_builtin.go# Agentes de referência
├── http_handler.go  # Handlers Gin
├── mcp_test.go      # Testes
└── README.md        # Esta documentação
```

---

**THE WATCHER SEES ALL.**
