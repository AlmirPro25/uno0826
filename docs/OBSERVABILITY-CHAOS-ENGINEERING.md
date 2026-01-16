# 🔭 Observabilidade Distribuída & Chaos Engineering

**Data**: 16 de Janeiro de 2026  
**Versão**: 2.0.0-enterprise  
**Status**: ✅ Implementado

---

## 📊 Visão Geral

Este documento descreve as capacidades de observabilidade distribuída e chaos engineering implementadas no PROST-QS, elevando o sistema ao nível de empresas como Netflix, Google e Amazon.

---

## 🔍 Distributed Tracing

### O que é?
Rastreamento de requests através de todos os serviços, permitindo visualizar o caminho completo de uma operação.

### Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    DISTRIBUTED TRACING                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Request → [Span A] → [Span B] → [Span C] → Response        │
│              │           │           │                       │
│              └───────────┴───────────┘                       │
│                    Trace ID: abc123                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Conceitos

| Conceito | Descrição |
|----------|-----------|
| **Trace** | Representa uma operação completa (ex: um request HTTP) |
| **Span** | Uma unidade de trabalho dentro de uma trace |
| **TraceID** | Identificador único de 128 bits para a trace |
| **SpanID** | Identificador único de 64 bits para o span |
| **Baggage** | Dados propagados entre spans (ex: user_id) |

### Uso no Código

```go
// Iniciar um span
ctx, span := tracer.StartSpan(ctx, "ProcessPayment")
defer tracer.FinishSpan(span)

// Adicionar tags
span.SetTag("payment.amount", "100.00")
span.SetTag("payment.currency", "BRL")

// Adicionar logs
span.Log("validation", map[string]string{"status": "passed"})

// Marcar erro
if err != nil {
    span.SetError(err)
}
```

### Propagação HTTP (W3C Trace Context)

Headers propagados automaticamente:
- `traceparent`: `00-{trace_id}-{span_id}-{flags}`
- `tracestate`: Estado adicional
- `baggage`: Dados de contexto

---

## 📈 Metrics Collector

### Tipos de Métricas

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **Counter** | Só aumenta | `http_requests_total` |
| **Gauge** | Sobe e desce | `http_requests_in_flight` |
| **Histogram** | Distribuição de valores | `http_request_duration_seconds` |

### Métricas Pré-definidas

```
# HTTP
http_requests_total
http_request_duration_seconds
http_requests_in_flight
http_response_size_bytes

# Database
db_queries_total
db_query_duration_seconds
db_connections_active
db_connections_idle

# Business
users_active
events_processed_total
rules_evaluated_total
billing_revenue_cents
```

### Endpoints

| Endpoint | Descrição |
|----------|-----------|
| `GET /observability/metrics` | Métricas em JSON |
| `GET /observability/metrics/prometheus` | Formato Prometheus |
| `GET /observability/traces` | Lista de traces |
| `GET /observability/traces/:id` | Detalhes de uma trace |
| `GET /observability/status` | Status do sistema |
| `GET /observability/dependencies` | Dependências e saúde |

---

## 🐒 Chaos Engineering

### O que é?
Prática de injetar falhas controladas para testar a resiliência do sistema.

> "A melhor forma de evitar falhas em produção é causar falhas em produção - de forma controlada."

### Tipos de Experimentos

| Tipo | Descrição | Uso |
|------|-----------|-----|
| `latency` | Adiciona latência artificial | Testar timeouts |
| `error` | Injeta erros HTTP | Testar error handling |
| `timeout` | Força timeouts | Testar circuit breakers |
| `blackhole` | Descarta requests | Testar failover |
| `memory` | Pressão de memória | Testar OOM handling |
| `cpu` | Pressão de CPU | Testar degradação |

### Endpoints

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/chaos/status` | GET | Status do Chaos Monkey |
| `/chaos/enable` | POST | Habilitar (requer confirmação em prod) |
| `/chaos/disable` | POST | Desabilitar |
| `/chaos/experiments` | GET | Listar experimentos |
| `/chaos/experiments` | POST | Criar experimento |
| `/chaos/experiments/:id/start` | POST | Iniciar experimento |
| `/chaos/experiments/:id/stop` | POST | Parar experimento |
| `/chaos/inject/latency` | POST | Injeção rápida de latência |
| `/chaos/inject/error` | POST | Injeção rápida de erro |
| `/chaos/inject/blackhole` | POST | Injeção rápida de blackhole |
| `/chaos/gamedays/standard` | POST | Executar Game Day padrão |

### Exemplos de Uso

#### Injetar Latência
```bash
curl -X POST https://api.prostqs.com.br/chaos/inject/latency \
  -H "Content-Type: application/json" \
  -d '{
    "latency_ms": 500,
    "duration_min": 5,
    "target_percent": 20
  }'
```

#### Injetar Erros
```bash
curl -X POST https://api.prostqs.com.br/chaos/inject/error \
  -H "Content-Type: application/json" \
  -d '{
    "error_rate": 10,
    "error_code": 500,
    "duration_min": 3
  }'
```

#### Blackhole (Simular Outage)
```bash
curl -X POST https://api.prostqs.com.br/chaos/inject/blackhole \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/api/v1/telemetry",
    "target_percent": 50,
    "duration_min": 2
  }'
```

---

## 🎮 Game Days

Game Days são exercícios planejados de resiliência onde múltiplos experimentos são executados.

### Game Day Padrão

O Game Day padrão inclui:
1. **High Latency Test** (5 min): 500ms de latência em 20% dos requests
2. **Error Injection Test** (5 min): 5% de taxa de erro 500
3. **Partial Outage Test** (3 min): 50% de blackhole em `/api/v1/telemetry`

### Executar Game Day
```bash
# Primeiro, habilitar chaos (em produção requer confirmação)
curl -X POST https://api.prostqs.com.br/chaos/enable \
  -H "Content-Type: application/json" \
  -d '{"confirm": "I_UNDERSTAND_THE_RISKS"}'

# Executar Game Day
curl -X POST https://api.prostqs.com.br/chaos/gamedays/standard
```

---

## 🛡️ Segurança

### Proteções Implementadas

1. **Desabilitado por padrão**: Chaos Monkey começa desabilitado
2. **Confirmação em produção**: Requer `I_UNDERSTAND_THE_RISKS`
3. **Variável de ambiente**: `CHAOS_ENABLED=true` para habilitar
4. **Duração limitada**: Experimentos têm duração máxima
5. **Logs detalhados**: Todas as ações são logadas

### Recomendações

- ⚠️ **NUNCA** habilite em produção sem planejamento
- 📊 Monitore métricas durante experimentos
- 🔔 Configure alertas antes de executar
- 👥 Tenha equipe de plantão durante Game Days
- 📝 Documente resultados e aprendizados

---

## 📊 Dashboard de Observabilidade

### Métricas em Tempo Real
```
GET /observability/status
```

Retorna:
```json
{
  "status": "healthy",
  "uptime": "24h30m",
  "version": "2.0.0-enterprise",
  "metrics": {
    "http_requests_total": 150000,
    "http_requests_in_flight": 12,
    "db_connections_active": 5,
    "users_active": 42
  }
}
```

### Traces Recentes
```
GET /observability/traces
```

### Dependências
```
GET /observability/dependencies
```

---

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Observabilidade
TRACING_ENABLED=true
TRACING_SAMPLE_RATE=0.1  # 10% das traces

# Chaos Engineering
CHAOS_ENABLED=false  # NUNCA true em produção por padrão
```

### Inicialização no main.go

```go
import (
    "prost-qs/pkg/observability"
    "prost-qs/pkg/chaos"
)

func main() {
    // Inicializar observabilidade
    observability.InitObservability("prost-qs-api")
    
    // Inicializar chaos (desabilitado por padrão)
    chaos.InitChaos()
    
    // Registrar rotas
    observability.RegisterRoutes(router.Group("/api/v1"))
    chaos.RegisterRoutes(router.Group("/api/v1"))
    
    // Adicionar middlewares
    router.Use(observability.TracingMiddleware())
    router.Use(chaos.GinChaosMiddleware())
}
```

---

## 📈 Comparação com Big Techs

| Feature | PROST-QS | Netflix | Google | Amazon |
|---------|----------|---------|--------|--------|
| Distributed Tracing | ✅ | ✅ | ✅ | ✅ |
| Metrics Collection | ✅ | ✅ | ✅ | ✅ |
| Chaos Engineering | ✅ | ✅ | ✅ | ✅ |
| Game Days | ✅ | ✅ | ✅ | ✅ |
| W3C Trace Context | ✅ | ✅ | ✅ | ✅ |
| Prometheus Format | ✅ | ✅ | ✅ | ✅ |

---

## 🎯 Próximos Passos

1. [ ] Integração com Jaeger/Zipkin para visualização
2. [ ] Integração com Grafana para dashboards
3. [ ] Alertas automáticos baseados em SLOs
4. [ ] Chaos experiments para banco de dados
5. [ ] Automated canary deployments

---

*"Sistemas resilientes não são construídos por acidente. São testados até a exaustão."*
