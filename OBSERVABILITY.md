# OBSERVABILITY - PROST-QS

## Fase 22 - Observabilidade Leve

**Objetivo:** Saber o que está acontecendo quando algo dá errado — sem decidir nada.

---

## Endpoints

### GET /health
Health check simples, sem dependências externas.

```json
{
  "status": "ok",
  "uptime_sec": 12345,
  "version": "commit-hash"
}
```

**Uso:** Load balancers, liveness probes.

---

### GET /ready
Readiness check com validação de dependências.

```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "secrets": "ok"
  }
}
```

**Uso:** Kubernetes readiness probes, deploy validation.

---

### GET /metrics/basic
Métricas básicas em JSON (sem Prometheus).

```json
{
  "audit_events_total": 152,
  "app_events_total": 87,
  "app_events_failed_total": 2,
  "requests_total": 1500,
  "errors_total": 12,
  "uptime_seconds": 3600,
  "go_routines": 15,
  "memory_mb": 45
}
```

**Contadores:**
- `audit_events_total` - Eventos de audit do kernel
- `app_events_total` - Eventos de apps externos (sucesso)
- `app_events_failed_total` - Eventos de apps externos (falha)
- `requests_total` - Total de requests HTTP
- `errors_total` - Requests com status >= 400

---

## Logs Estruturados

Todos os logs importantes seguem o formato JSON:

```json
{
  "level": "info",
  "ts": "2025-12-29T18:22:01Z",
  "msg": "app event received",
  "request_id": "uuid",
  "app_id": "uuid",
  "event_type": "SESSION_STARTED"
}
```

**Campos obrigatórios:**
- `level` - debug, info, warn, error
- `ts` - Timestamp ISO 8601
- `msg` - Mensagem descritiva
- `request_id` - ID de correlação

**Campos condicionais:**
- `app_id` - ID do app (quando aplicável)
- `event_type` - Tipo do evento
- `error` - Mensagem de erro (apenas em level=error)

---

## Request ID

Toda request recebe um `X-Request-ID`:
- Se enviado pelo cliente, é propagado
- Se não enviado, é gerado automaticamente

O request_id é:
- Retornado no header `X-Request-ID`
- Incluído em todos os logs
- Propagado para eventos de audit

---

## O que NÃO está incluído

- ❌ Dashboards
- ❌ Alertas automáticos
- ❌ Prometheus/Grafana
- ❌ Tracing distribuído
- ❌ Decisões baseadas em métricas
- ❌ IA/ML

---

## Validação

Para validar a observabilidade:

```bash
# Health check
curl http://localhost:8080/health

# Readiness check
curl http://localhost:8080/ready

# Métricas
curl http://localhost:8080/metrics/basic
```

---

*Documento criado em 29/12/2024 - Fase 22*
