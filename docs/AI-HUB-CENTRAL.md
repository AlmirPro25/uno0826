# 🧠 AI Hub Central - Aurora

## Visão Geral

O AI Hub é o **cérebro central** do PROST-QS Kernel. Uma interface de chat inteligente que:

- Conecta múltiplos providers de IA (Gemini, OpenAI, Anthropic)
- Tem acesso total ao sistema (telemetria, logs, configurações)
- Pode executar ações automaticamente
- Se auto-configura via comandos de chat

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              AI Hub Chat Interface                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │    │
│  │  │   Gemini    │  │   OpenAI    │  │  Anthropic  │      │    │
│  │  │   🔮        │  │   🤖        │  │   🧠        │      │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     KERNEL BACKEND (Go)                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   AI Hub Service                         │    │
│  │  ┌───────────────────────────────────────────────────┐  │    │
│  │  │              System Context                        │  │    │
│  │  │  • Telemetria    • Logs       • Alertas           │  │    │
│  │  │  • API Keys      • Billing    • Health            │  │    │
│  │  │  • Rules         • Apps       • Killswitch        │  │    │
│  │  └───────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │  ┌───────────────────────────────────────────────────┐  │    │
│  │  │              Action Executor                       │  │    │
│  │  │  • generate_api_key    • get_telemetry            │  │    │
│  │  │  • get_system_health   • create_rule              │  │    │
│  │  │  • configure_provider  • execute_killswitch       │  │    │
│  │  └───────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Providers Suportados

| Provider | Modelos | Status |
|----------|---------|--------|
| **Google Gemini** | gemini-1.5-flash, gemini-1.5-pro | ✅ Principal |
| **OpenAI** | gpt-4o-mini, gpt-4o, gpt-4-turbo | ✅ Suportado |
| **Anthropic** | claude-3-haiku, claude-3-sonnet | ✅ Suportado |

---

## Ações Disponíveis

A IA pode executar estas ações automaticamente:

### Leitura (Sem Aprovação)
- `get_telemetry` - Ver eventos de telemetria
- `get_system_health` - Ver saúde do sistema
- `get_alerts` - Ver alertas ativos
- `get_logs` - Ver logs do sistema
- `get_billing_status` - Ver status de billing
- `list_applications` - Listar aplicações

### Escrita (Sem Aprovação)
- `generate_api_key` - Gerar nova API key
- `configure_provider` - Configurar provider de IA

### Críticas (Requer Aprovação)
- `create_rule` - Criar regra de automação
- `execute_killswitch` - Executar killswitch de emergência

---

## Como Usar

### 1. Configurar Provider

Via interface:
1. Clique em "Configurar IA" no sidebar
2. Selecione o provider (Gemini, OpenAI, Anthropic)
3. Cole sua API key
4. Clique em "Configurar"

Via chat:
```
configure gemini AIzaSy...sua_api_key
```

### 2. Conversar

Exemplos de comandos:
```
# Ver status do sistema
"Qual o status do sistema?"

# Gerar API key
"Gere uma nova API key chamada 'meu-app'"

# Ver telemetria
"Mostre os últimos 10 eventos de telemetria"

# Ver alertas
"Tem algum alerta ativo?"

# Criar regra
"Crie uma regra que envia alerta quando CPU > 80%"
```

### 3. Ações Automáticas

A IA detecta quando precisa executar uma ação e faz automaticamente:

```
Usuário: "Gere uma API key para o app de produção"

Aurora: Vou gerar uma nova API key para você.

**Resultado da ação:**
{
  "action": "generate_api_key",
  "success": true,
  "result": {
    "api_key": "pq_pk_abc123..."
  }
}

Pronto! Sua nova API key foi gerada: pq_pk_abc123...
```

---

## API Endpoints

### Chat
```
POST /api/v1/ai/chat
{
  "message": "Qual o status do sistema?",
  "conversation_id": "optional",
  "provider": "gemini",
  "stream": false
}
```

### Streaming
```
POST /api/v1/ai/chat/stream
Content-Type: text/event-stream
```

### Conversations
```
GET  /api/v1/ai/conversations
GET  /api/v1/ai/conversations/:id
DELETE /api/v1/ai/conversations/:id
```

### Providers
```
GET  /api/v1/ai/providers
POST /api/v1/ai/providers
DELETE /api/v1/ai/providers/:provider
```

### Actions
```
GET /api/v1/ai/actions
```

---

## Configuração

### Variáveis de Ambiente

```env
# Provider padrão (opcional - pode configurar via chat)
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Modelo padrão
AI_DEFAULT_MODEL=gemini-1.5-flash
```

### Database

Tabelas criadas automaticamente:
- `ai_provider_configs` - Configurações de providers
- `ai_conversations` - Histórico de conversas
- `ai_action_logs` - Log de ações executadas
- `ai_usage` - Tracking de uso (tokens, custos)

---

## Segurança

1. **API Keys Criptografadas** - Todas as keys são criptografadas em AES-256
2. **Isolamento por App** - Cada app tem suas próprias configurações
3. **Ações Críticas** - Killswitch e regras requerem aprovação
4. **Audit Log** - Todas as ações são logadas
5. **Rate Limiting** - Proteção contra abuso

---

## Roadmap

- [ ] Streaming real de respostas
- [ ] Function calling nativo (Gemini/OpenAI)
- [ ] Agentes especializados (DevOps, Security, etc)
- [ ] Integração com MCP (Model Context Protocol)
- [ ] Voice input/output
- [ ] Plugins customizados
- [ ] Multi-modal (imagens, documentos)

---

## Exemplo de System Prompt

O AI Hub injeta automaticamente contexto do sistema:

```
Você é o CÉREBRO CENTRAL do PROST-QS Kernel.

## SUAS CAPACIDADES
- Ver telemetria em tempo real
- Gerar e configurar API keys
- Ver logs e alertas
- Criar regras de automação
- Executar killswitch de emergência

## CONTEXTO ATUAL
- App ID: app_123
- User ID: user_456
- System Health: HEALTHY
- Active Alerts: 0

## AÇÕES DISPONÍVEIS
- get_telemetry: Ver eventos de telemetria
- generate_api_key: Gerar nova API key
...
```

---

## Custos Estimados

| Provider | Modelo | Input (1M tokens) | Output (1M tokens) |
|----------|--------|-------------------|-------------------|
| Gemini | 1.5-flash | $0.075 | $0.30 |
| Gemini | 1.5-pro | $1.25 | $5.00 |
| OpenAI | gpt-4o-mini | $0.15 | $0.60 |
| OpenAI | gpt-4o | $2.50 | $10.00 |
| Anthropic | claude-3-haiku | $0.25 | $1.25 |
| Anthropic | claude-3-sonnet | $3.00 | $15.00 |

*Preços de Janeiro 2026*
