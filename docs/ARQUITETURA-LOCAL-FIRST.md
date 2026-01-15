# Arquitetura Local-First: SQLite + Neon

> Write-Ahead Log local com sincronização assíncrona para o banco remoto.

**Data:** 15 de Janeiro de 2026  
**Status:** Implementado (pkg/localstore)

---

## O Problema

Logs do Render mostravam SLOW SQL >= 200ms em queries de telemetria e auditoria.
A latência de rede para o Neon (banco remoto) estava impactando a performance.

## A Solução

**Padrão:** Local-first write + async upstream sync

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Render)                             │
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   Request   │───►│  LocalStore │───►│   SQLite    │        │
│   │   Handler   │    │   (Write)   │    │   (WAL)     │        │
│   └─────────────┘    └─────────────┘    └──────┬──────┘        │
│                                                 │               │
│                                          ┌──────▼──────┐        │
│                                          │ Sync Worker │        │
│                                          │  (async)    │        │
│                                          └──────┬──────┘        │
│                                                 │               │
└─────────────────────────────────────────────────┼───────────────┘
                                                  │
                                                  ▼
                                          ┌─────────────┐
                                          │    NEON     │
                                          │  (Postgres) │
                                          └─────────────┘
```

## Como Habilitar

### 1. Variáveis de Ambiente (Render)

```bash
LOCAL_STORE_ENABLED=true
LOCAL_STORE_PATH=/data/localstore.db
LOCAL_STORE_SYNC_INTERVAL=5s
LOCAL_STORE_BATCH_SIZE=100
LOCAL_STORE_MAX_RETRIES=5
```

### 2. Rodar Migration no Neon

Execute no SQL Editor do Supabase/Neon:

```sql
-- Criar tabela para receber eventos sincronizados
CREATE TABLE IF NOT EXISTS local_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    app_id TEXT,
    payload TEXT,
    created_at TIMESTAMP NOT NULL,
    sync_status TEXT DEFAULT 'confirmed',
    synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_local_events_type ON local_events(event_type);
CREATE INDEX IF NOT EXISTS idx_local_events_app ON local_events(app_id);
CREATE INDEX IF NOT EXISTS idx_local_events_created ON local_events(created_at DESC);
```

### 3. Redeploy no Render

O LocalStore será inicializado automaticamente se `LOCAL_STORE_ENABLED=true`.

## Como Funciona

### 1. Escrita Local (Rápida)
```go
// Escreve no SQLite local - ~1ms
localstore.WriteTelemetryEventAsync(localstore.TelemetryEventData{
    AppID:     appID.String(),
    UserID:    userID.String(),
    SessionID: sessionID.String(),
    Type:      "button.click",
    Timestamp: time.Now(),
})
```

### 2. Sync Assíncrono (Background)
```go
// Worker roda a cada 5 segundos
// Envia lotes de 100 eventos para Neon
// Idempotente: duplicatas são ignoradas
```

### 3. Estados de Sincronização
| Status | Significado |
|--------|-------------|
| `pending` | Aguardando sync |
| `syncing` | Em processo |
| `confirmed` | Confirmado pelo Neon |
| `failed` | Falhou (vai para retry) |

## API de Monitoramento

### GET /api/v1/localstore/stats
Retorna estatísticas do LocalStore:
```json
{
  "enabled": true,
  "pending": 42,
  "syncing": 0,
  "confirmed": 15000,
  "failed": 3,
  "total": 15045,
  "health": {
    "sync_lag": 42,
    "error_rate": 0.02,
    "status": "healthy"
  }
}
```

### POST /api/v1/localstore/sync
Força sincronização imediata.

### POST /api/v1/localstore/cleanup
Remove eventos confirmados há mais de 24h.

## Uso nos Services

### Telemetria
```go
import "prost-qs/backend/pkg/localstore"

// Fire-and-forget (recomendado para alta frequência)
localstore.WriteTelemetryEventAsync(localstore.TelemetryEventData{
    AppID:     appID.String(),
    UserID:    userID.String(),
    SessionID: sessionID.String(),
    Type:      "page.view",
    Feature:   "dashboard",
    Timestamp: time.Now(),
})
```

### Auditoria
```go
localstore.WriteAuditEventAsync(localstore.AuditEventData{
    AppID:     appID.String(),
    Type:      "user.login",
    ActorID:   userID.String(),
    ActorType: "user",
    Action:    "login",
    IP:        ip,
    UserAgent: userAgent,
})
```

### Execução de Regras
```go
localstore.WriteRuleExecutionAsync(localstore.RuleExecutionData{
    RuleID:       ruleID.String(),
    AppID:        appID.String(),
    ConditionMet: true,
    ActionTaken:  true,
    DurationMs:   150,
})
```

## Invariantes

1. **Nunca perde dados**: SQLite persiste antes de responder
2. **Idempotente**: Replay não duplica no Neon (mesmo ID = ignorado)
3. **Eventual consistency**: Neon pode estar atrasado, mas eventualmente converge
4. **Graceful degradation**: Se Neon cair, sistema continua operando

## Comportamento por Cenário

| Cenário | Comportamento |
|---------|---------------|
| Neon online | Escreve local + sync imediato |
| Neon lento | Escreve local, sync atrasado |
| Neon fora | Continua operando localmente |
| Backend reinicia | SQLite mantém estado, sync retoma |
| Pico extremo | Sistema degrada, não cai |

👉 **Isso é soberania operacional.**

## Quando Usar

✅ **Use para:**
- Logs
- Auditoria
- Eventos
- Telemetria
- Métricas
- Comandos

❌ **NÃO use para:**
- Dados relacionais mutáveis
- Contadores críticos em tempo real
- Saldos financeiros finais
- Dados que precisam de consistência forte imediata

## Arquivos

```
backend/pkg/localstore/
├── store.go              # Core do LocalStore
├── provider.go           # Singleton global
├── init.go               # Inicialização via env vars
├── handler.go            # API HTTP de monitoramento
├── telemetry_adapter.go  # Adapters básicos
├── telemetry_wrapper.go  # Wrappers para services
└── store_test.go         # Testes

backend/scripts/migrations/
└── 20260115_create_local_events_table.sql  # Migration para Neon
```

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `LOCAL_STORE_ENABLED` | `false` | Habilitar LocalStore |
| `LOCAL_STORE_PATH` | `/data/localstore.db` | Caminho do SQLite |
| `LOCAL_STORE_SYNC_INTERVAL` | `5s` | Intervalo de sync |
| `LOCAL_STORE_BATCH_SIZE` | `100` | Eventos por batch |
| `LOCAL_STORE_MAX_RETRIES` | `5` | Máximo de retries |

## Próximos Passos

1. [x] Core do LocalStore
2. [x] Wrappers para telemetria/audit/rules
3. [x] API de monitoramento
4. [x] Documentação
5. [ ] Integrar no main.go (adicionar import e inicialização)
6. [ ] Rodar migration no Neon
7. [ ] Habilitar em produção (LOCAL_STORE_ENABLED=true)
8. [ ] Monitorar métricas de sync

---

*Arquitetura inspirada em sistemas edge-first e event sourcing.*
