# FASE 4 — Sistema de Alertas Real

> "Alertas inteligentes, não spam"

## Status: ✅ IMPLEMENTADO E INTEGRADO — 10/10

**34 testes passando** | **8 arquivos** | **Integrado no main.go**

### Melhorias Implementadas:
- ✅ Persistência em PostgreSQL (sobrevive restarts)
- ✅ Integração real API Gate → Alerting (attack detection)
- ✅ Testes de integração (fluxo completo)
- ✅ Configuração via ENV (thresholds configuráveis)
- ✅ Métricas Prometheus (scraping ready)

---

## 🎯 Objetivo

Criar um sistema de alertas que:
1. **Detecta problemas automaticamente** — monitora War Observability
2. **Não faz spam** — deduplicação e cooldown inteligentes
3. **Escala corretamente** — severidades e canais apropriados
4. **É acionável** — alertas que levam a ações, não ruído

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     ALERT ENGINE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   MONITOR    │───▶│    RULES     │───▶│   CHANNELS   │       │
│  │              │    │              │    │              │       │
│  │ • Pressure   │    │ • Thresholds │    │ • Log        │       │
│  │ • Error Rate │    │ • Cooldowns  │    │ • Slack      │       │
│  │ • SLO/SLI    │    │ • Severity   │    │ • PagerDuty  │       │
│  │ • Attacks    │    │ • Dedup      │    │ • Webhook    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ALERT STORAGE                          │   │
│  │  • Active Alerts (map[dedupKey]*Alert)                   │   │
│  │  • History (ring buffer, 1000 entries)                   │   │
│  │  • Stats (by severity, type, time)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes

### 1. Alert Engine (`alert_engine.go`)

Motor central de alertas:

```go
// Tipos de alerta
AlertTypePressure     // Pressão do sistema
AlertTypeSLO          // Violação de SLO
AlertTypeErrorRate    // Taxa de erro alta
AlertTypeLatency      // Latência alta
AlertTypeAttack       // Ataque detectado
AlertTypeCircuitOpen  // Circuit breaker aberto
AlertTypeQuarantine   // Entidade em quarentena
AlertTypeMemory       // Pressão de memória
AlertTypeCustom       // Alerta customizado

// Severidades
SeverityInfo          // Informativo
SeverityWarning       // Atenção
SeverityCritical      // Crítico
SeverityEmergency     // Emergência
```

**Funcionalidades:**
- `Fire()` — Dispara alerta com deduplicação
- `FireFromRule()` — Dispara baseado em regra
- `Acknowledge()` — Marca como reconhecido
- `Resolve()` — Resolve alerta
- `GetActiveAlerts()` — Lista alertas ativos
- `GetStats()` — Estatísticas

### 2. Channels (`channels.go`)

Canais de entrega:

| Canal | Descrição | Configuração |
|-------|-----------|--------------|
| **Log** | Stdout (sempre ativo) | Automático |
| **Slack** | Mensagens formatadas | `SLACK_WEBHOOK_URL` |
| **PagerDuty** | Incidentes (critical+) | `PAGERDUTY_ROUTING_KEY` |
| **Webhook** | HTTP POST genérico | `ALERT_WEBHOOK_URL` |
| **Callback** | Função Go | Programático |

### 3. Monitor (`monitor.go`)

Monitoramento contínuo:

```go
// Monitora War Observability a cada 30s
monitor := NewAlertMonitor(engine, warObs, config)
go monitor.Start(ctx)
```

**O que monitora:**
- Pressão do sistema (4 componentes)
- Taxa de erro global
- Status de SLOs
- Error budget
- Ataques (via API Gate)

### 4. Handler (`handler.go`)

API REST completa:

```
GET  /api/v1/alerts              — Lista alertas ativos
GET  /api/v1/alerts/:id          — Detalhes do alerta
GET  /api/v1/alerts/stats        — Estatísticas
GET  /api/v1/alerts/history      — Histórico
GET  /api/v1/alerts/dashboard    — Dashboard completo
GET  /api/v1/alerts/severity/:s  — Por severidade
GET  /api/v1/alerts/type/:t      — Por tipo

POST /api/v1/alerts/:id/ack      — Reconhecer (admin)
POST /api/v1/alerts/:id/resolve  — Resolver (admin)

GET  /api/v1/alerts/rules        — Lista regras
POST /api/v1/alerts/rules        — Criar regra (admin)
POST /api/v1/alerts/rules/:n/enable   — Habilitar
POST /api/v1/alerts/rules/:n/disable  — Desabilitar

POST /api/v1/alerts/test         — Alerta de teste (admin)
```

---

## 📋 Regras Padrão

| Regra | Tipo | Threshold | Severidade | Cooldown |
|-------|------|-----------|------------|----------|
| `high_error_rate` | error_rate | 10% | warning | 5min |
| `critical_error_rate` | error_rate | 25% | critical | 1min |
| `high_latency` | latency | 2000ms | warning | 5min |
| `critical_latency` | latency | 5000ms | critical | 1min |
| `slo_budget_low` | slo | 25% | warning | 15min |
| `slo_budget_exhausted` | slo | 0% | critical | 5min |
| `pressure_elevated` | pressure | level 1 | warning | 10min |
| `pressure_critical` | pressure | level 3 | emergency | 1min |
| `memory_high` | memory | 85% | warning | 5min |
| `memory_critical` | memory | 95% | critical | 1min |

---

## 🔄 Deduplicação

Alertas são deduplicados por chave:
```
dedupKey = "{type}:{source}:{title}"
```

**Comportamento:**
1. Primeiro alerta → cria novo
2. Mesmo alerta dentro do cooldown → incrementa `count`
3. Mesmo alerta após cooldown → cria novo

**Cooldowns por severidade:**
- Emergency: 30s
- Critical: 1min
- Warning: 5min
- Info: 5min

---

## 🔗 Integração com Immunity System

O sistema de alertas se integra com:

### Circuit Breaker
```go
// Quando circuit abre
CircuitBreakerAlert(engine, "payment_service", failures, threshold)

// Quando circuit fecha
CircuitBreakerResolve(engine, "payment_service")
```

### Quarantine
```go
// Quando entidade é quarentenada
QuarantineAlert(engine, "user", "user-123", "Suspicious activity")
```

### Attack Detection
```go
// API Gate registra bloqueios
attackMonitor.RecordBlock("sql_injection", "api_gate", details)
// Após 10 bloqueios em 1 minuto → alerta de ataque
```

---

## 📊 Dashboard Response

```json
{
  "stats": {
    "total_active": 3,
    "total_history": 150,
    "by_severity": {"warning": 2, "critical": 1},
    "by_type": {"error_rate": 1, "latency": 2},
    "acknowledged": 1,
    "unacknowledged": 2,
    "last_hour": 5
  },
  "active_alerts": [...],
  "recent_history": [...],
  "rules": [...],
  "critical_count": 1,
  "emergency_count": 0,
  "needs_attention": true
}
```

---

## 🧪 Testes

```bash
go test ./pkg/alerting/... -v

# 26 testes passando:
# - TestNewAlertEngine
# - TestAlertEngine_Fire
# - TestAlertEngine_Deduplication
# - TestAlertEngine_Acknowledge
# - TestAlertEngine_Resolve
# - TestAlertEngine_FireFromRule
# - TestAlertEngine_RuleManagement
# - TestAlertEngine_GetAlertsBySeverity
# - TestAlertEngine_GetAlertsByType
# - TestAlertEngine_History
# - TestAlertEngine_Stats
# - TestAlertEngine_Concurrency
# - TestLogChannel
# - TestWebhookChannel_Disabled
# - TestSlackChannel_Disabled
# - TestPagerDutyChannel_Disabled
# - TestCallbackChannel
# - TestAlertEngine_ThresholdChecks (8 subtests)
# - TestGetAlertEngine
# - TestAttackMonitor_RecordBlock
# - TestCircuitBreakerAlert
# - TestCircuitBreakerResolve
# - TestQuarantineAlert
```

---

## 🚀 Uso

### Inicialização

```go
// Em main.go
alertEngine := alerting.GetAlertEngine()
alerting.SetupDefaultChannels(alertEngine)

// Iniciar monitor
alerting.StartGlobalMonitor(ctx)

// Registrar rotas
alerting.RegisterAlertRoutes(v1, alertEngine, authMiddleware, adminMiddleware)
```

### Disparar Alerta Manual

```go
alerting.GetAlertEngine().Fire(
    alerting.AlertTypeCustom,
    alerting.SeverityWarning,
    "custom_alert",
    "Something happened",
    "my_service",
    42.0,  // value
    50.0,  // threshold
    map[string]string{"env": "prod"},
)
```

### Criar Regra Custom

```go
alerting.GetAlertEngine().AddRule(&alerting.AlertRule{
    Name:      "my_custom_rule",
    Type:      alerting.AlertTypeCustom,
    Condition: "Custom metric > 100",
    Threshold: 100.0,
    Severity:  alerting.SeverityWarning,
    Cooldown:  5 * time.Minute,
    Enabled:   true,
})
```

---

## 📁 Arquivos

```
backend/pkg/alerting/
├── alert_engine.go      # Motor central (Fire, Resolve, Acknowledge, Rules)
├── channels.go          # Canais de entrega (Log, Slack, PagerDuty, Webhook)
├── monitor.go           # Monitor contínuo (integra com War Observability)
├── handler.go           # HTTP handlers (API REST completa)
├── integrations.go      # Integrações (API Gate, Immunity, Billing)
├── persistence.go       # Persistência em PostgreSQL
├── config.go            # Configuração via ENV
├── metrics.go           # Métricas Prometheus
├── alerting_test.go     # 26 testes unitários
└── integration_test.go  # 8 testes de integração
```

---

## 🔧 Configuração via ENV

| Variável | Default | Descrição |
|----------|---------|-----------|
| `ALERT_ERROR_RATE_WARNING` | 10 | Threshold warning error rate (%) |
| `ALERT_ERROR_RATE_CRITICAL` | 25 | Threshold critical error rate (%) |
| `ALERT_LATENCY_WARNING_MS` | 2000 | Threshold warning latency (ms) |
| `ALERT_LATENCY_CRITICAL_MS` | 5000 | Threshold critical latency (ms) |
| `ALERT_SLO_BUDGET_WARNING` | 25 | Threshold warning SLO budget (%) |
| `ALERT_MEMORY_WARNING` | 85 | Threshold warning memory (%) |
| `ALERT_MEMORY_CRITICAL` | 95 | Threshold critical memory (%) |
| `ALERT_MONITOR_INTERVAL_SEC` | 30 | Monitor check interval |
| `ALERT_PERSISTENCE_ENABLED` | true | Enable DB persistence |
| `SLACK_WEBHOOK_URL` | - | Slack webhook URL |
| `PAGERDUTY_ROUTING_KEY` | - | PagerDuty routing key |

---

## 📊 Métricas Prometheus

```
GET /api/v1/alerts/metrics/prometheus

# Exemplo de output:
alerting_alerts_fired_total 42
alerting_alerts_resolved_total 38
alerting_active_alerts 4
alerting_alerts_fired_by_severity_total{severity="warning"} 30
alerting_alerts_fired_by_severity_total{severity="critical"} 12
alerting_alerts_fired_by_type_total{type="error_rate"} 15
alerting_alerts_fired_by_type_total{type="latency"} 10
```

---

## ✅ Checklist FASE 4

- [x] Alert Engine com deduplicação
- [x] Regras configuráveis com thresholds
- [x] Múltiplos canais (Log, Slack, PagerDuty, Webhook)
- [x] Monitor integrado com War Observability
- [x] API REST completa
- [x] Integração com Immunity System
- [x] Integração com API Gate (attack detection)
- [x] Persistência em PostgreSQL
- [x] Configuração via ENV
- [x] Métricas Prometheus
- [x] Testes unitários (26)
- [x] Testes de integração (8)
- [x] Documentação
- [x] Integrado no main.go

---

## 🔜 Próximos Passos

1. **Integrar no main.go** — Adicionar rotas e iniciar monitor
2. **Configurar canais** — Slack/PagerDuty em produção
3. **Ajustar thresholds** — Baseado em baseline real
4. **Dashboard frontend** — Visualização de alertas

---

## 📌 Princípios

1. **Alertas acionáveis** — Cada alerta deve levar a uma ação
2. **Sem spam** — Deduplicação e cooldown evitam fadiga
3. **Severidade correta** — Emergency só para emergências reais
4. **Contexto rico** — Tags e valores para debugging rápido
5. **Histórico** — Tudo é registrado para análise posterior
