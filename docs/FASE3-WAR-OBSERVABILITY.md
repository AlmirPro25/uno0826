# 📊 FASE 3 — WAR OBSERVABILITY (OBSERVABILIDADE DE GUERRA)

> **Objetivo:** Ver o sistema respirar, medir pressão, detectar guerra antes do colapso.  
> **Regra:** Sem observabilidade, não existe segurança. Existe fé.

---

## 📋 CHECKLIST DE CONCLUSÃO

- [x] RED Metrics (Rate, Errors, Duration) por endpoint
- [x] Pressure Indicators (sinais de degradação)
- [x] SLI/SLO Tracking (objetivos de serviço)
- [x] Distributed Tracing (seguir requisições)
- [x] Dashboard consolidado
- [x] Testes automatizados (12 testes)
- [x] Integração no main.go

---

## 1️⃣ ARQUITETURA

```
Request → [API Gate] → [War Obs Middleware] → Handler
                              │
                              ├── RED Metrics (Rate, Errors, Duration)
                              ├── Tracing (Spans)
                              └── SLO Updates
                              
                              ↓
                              
              [Pressure Indicator] ← [RED Metrics]
                              │
                              └── Health Status
```

---

## 2️⃣ RED METRICS

### O que são RED Metrics?

| Métrica | Descrição | Por que importa |
|---------|-----------|-----------------|
| **R**ate | Requests por segundo | Volume de tráfego |
| **E**rrors | Taxa de erros | Saúde do sistema |
| **D**uration | Latência | Experiência do usuário |

### Endpoints

```
GET /api/v1/warobs/red/global      — Estatísticas globais
GET /api/v1/warobs/red/endpoints   — Todas as métricas por endpoint
GET /api/v1/warobs/red/top         — Top N endpoints por volume
GET /api/v1/warobs/red/slowest     — Top N endpoints mais lentos
GET /api/v1/warobs/red/errors      — Endpoints com alta taxa de erro
```

### Exemplo de resposta

```json
{
  "endpoint": "/api/v1/auth/login",
  "request_count": 15000,
  "error_count": 45,
  "error_4xx": 30,
  "error_5xx": 15,
  "error_rate_percent": 0.3,
  "avg_duration": "125ms",
  "min_duration": "15ms",
  "max_duration": "2.5s"
}
```

---

## 3️⃣ PRESSURE INDICATORS

### Níveis de Pressão

| Nível | Cor | Significado |
|-------|-----|-------------|
| `normal` | 🟢 | Sistema operando normalmente |
| `elevated` | 🟡 | Sinais de stress, monitorar |
| `high` | 🟠 | Stress significativo, investigar |
| `critical` | 🔴 | Ação imediata necessária |

### Componentes Monitorados

| Componente | Elevated | High | Critical |
|------------|----------|------|----------|
| Error Rate | 5% | 15% | 30% |
| Latency | 500ms | 1s | 3s |
| Memory | 70% | 85% | 95% |
| Goroutines | 1000 | 5000 | 10000 |

### Endpoints

```
GET /api/v1/warobs/pressure         — Pressão atual
GET /api/v1/warobs/pressure/history — Histórico de pressão
```

### Exemplo de resposta

```json
{
  "timestamp": "2026-01-11T18:00:00Z",
  "overall_level": "elevated",
  "overall_message": "🟡 ELEVATED: System showing signs of stress",
  "components": {
    "error_rate": {
      "level": "normal",
      "value": 2.5,
      "message": "Normal error rate"
    },
    "latency": {
      "level": "elevated",
      "value": 650,
      "message": "ELEVATED: Response times above normal"
    },
    "memory": {
      "level": "normal",
      "value": 45.2,
      "message": "Normal memory usage"
    },
    "goroutines": {
      "level": "normal",
      "value": 250,
      "message": "Normal goroutine count"
    }
  },
  "trend": "stable"
}
```

---

## 4️⃣ SLI/SLO TRACKING

### SLOs Padrão

| SLO | Target | Window | Descrição |
|-----|--------|--------|-----------|
| availability | 99.9% | 24h | Requests sem erro 5xx |
| latency_p99 | 99% | 1h | Latência < 1s |
| error_rate | 99% | 1h | Taxa de erro < 1% |

### Error Budget

O Error Budget é quanto "margem de erro" você ainda tem:

```
Error Budget = (100 - Target) / 100 * Total Requests
```

Se target é 99.9%, você pode ter 0.1% de erros.

### Endpoints

```
GET /api/v1/warobs/slo/status  — Status de todos os SLOs
GET /api/v1/warobs/slo/budget  — Resumo de error budgets
```

### Exemplo de resposta

```json
{
  "slo": {
    "name": "availability",
    "target": 99.9
  },
  "current_value": 99.7,
  "compliance": false,
  "error_budget_remaining": 25.5,
  "burn_rate": 1.5,
  "status": "warning",
  "message": "Error budget running low"
}
```

---

## 5️⃣ DISTRIBUTED TRACING

### Conceitos

- **Trace**: Uma requisição completa através do sistema
- **Span**: Uma operação dentro de um trace
- **Trace ID**: Identificador único propagado entre serviços

### Headers

```
X-Trace-ID: <trace_id>  — Propagado automaticamente
X-Request-ID: <id>      — Fallback se X-Trace-ID não existir
```

### Endpoints

```
GET /api/v1/warobs/traces          — Traces recentes
GET /api/v1/warobs/traces/:id      — Trace específico
GET /api/v1/warobs/traces/errors   — Traces com erros
GET /api/v1/warobs/traces/slow     — Traces lentos
GET /api/v1/warobs/traces/stats    — Estatísticas do tracer
```

### Exemplo de trace

```json
{
  "trace_id": "20260111180000.123456789",
  "start_time": "2026-01-11T18:00:00Z",
  "duration_ms": 125,
  "status": "completed",
  "spans": [
    {
      "span_id": "180000.123456789",
      "name": "http_request",
      "duration_ms": 125,
      "status": "ok",
      "tags": {
        "method": "POST",
        "path": "/api/v1/auth/login"
      }
    }
  ]
}
```

---

## 6️⃣ DASHBOARD CONSOLIDADO

### Endpoint

```
GET /api/v1/warobs/dashboard  — Dashboard completo
GET /api/v1/warobs/health     — Resumo de saúde
```

### Dashboard inclui

- Global stats (total requests, errors)
- Top 10 endpoints por volume
- Top 5 endpoints mais lentos
- Endpoints com alta taxa de erro
- Pressure report
- SLO status
- Error budget summary
- Tracer stats

---

## 7️⃣ INTEGRAÇÃO

### Middleware

O middleware é aplicado globalmente e:
1. Gera/propaga Trace ID
2. Cria span para cada request
3. Mede duração
4. Registra RED metrics
5. Atualiza SLOs periodicamente

### Ordem dos Middlewares

```go
r.Use(apiGate.GateMiddleware())           // 1. Validação (FASE 2)
r.Use(warobs.WarObsMiddleware(obs))       // 2. Observabilidade (FASE 3)
r.Use(immunity.ProtectionMiddleware())    // 3. Imunidade
r.Use(middleware.RateLimitMiddleware())   // 4. Rate limit
```

---

## 8️⃣ ALERTAS INTELIGENTES

### Princípio: Sinais, não Spam

O sistema detecta:
- **Degradação progressiva** (trend analysis)
- **Error budget burn rate** (velocidade de consumo)
- **Pressure escalation** (piora de componentes)

### Quando alertar

| Condição | Ação |
|----------|------|
| Error budget < 25% | Warning |
| Error budget = 0 | Critical |
| Burn rate > 2x | Warning |
| Pressure = critical | Immediate |
| Trend = degrading | Monitor |

---

## 🎯 CRITÉRIOS DE SUCESSO

| Critério | Status |
|----------|--------|
| RED metrics por endpoint | ✅ |
| Pressure indicators | ✅ |
| SLI/SLO tracking | ✅ |
| Error budget calculation | ✅ |
| Distributed tracing | ✅ |
| Dashboard consolidado | ✅ |
| Trend analysis | ✅ |
| Testes passando | ✅ |

---

## 📝 PRÓXIMOS PASSOS

Após FASE 3 verde:
1. Configurar alertas externos (PagerDuty, Slack)
2. Criar dashboards visuais (Grafana)
3. Avançar para FASE 4 (Alertas de Verdade)

---

*Documento criado: 11/01/2026*  
*Responsável: Tech Lead*  
*Status: IMPLEMENTADO*
