# AGENTS - PROST-QS

## Fase 23 - First Controlled Agents

**Princípio:** Agentes apenas observam, analisam e sugerem. Nenhum agente altera estado.

---

## Contrato de Segurança

O agente **NÃO TEM**:
- Credenciais
- Tokens
- Acesso a secrets
- Acesso a handlers mutáveis
- Acesso direto ao DB
- Acesso a filas, jobs, eventos

**Interface única:**
```
INPUT  → ControlledSnapshot (imutável)
OUTPUT → Suggestion (JSON estruturado)
```

---

## Endpoints

### GET /agents/suggestions
Retorna sugestões do agente observer.

```json
{
  "enabled": true,
  "suggestions": [
    {
      "agent": "observer_v1",
      "confidence": 0.83,
      "finding": "Taxa de erros elevada detectada: 83%",
      "suggestion": "Sugestão: verificar logs de erro e endpoint /metrics/basic",
      "snapshot_hash": "sha256...",
      "generated_at": "2025-12-29T16:12:12Z"
    }
  ],
  "metrics": {
    "agent_runs_total": 5,
    "agent_failures_total": 0,
    "agent_last_run_timestamp": "2025-12-29T16:12:12Z",
    "agent_last_run_duration_ms": 1
  }
}
```

### GET /agents/status
Status do sistema de agentes com último snapshot.

### GET /agents/metrics
Métricas do agente.

---

## Kill Switch

Desabilitar agentes via variável de ambiente:

```bash
AGENTS_ENABLED=false
```

Quando desabilitado:
- Endpoint retorna `enabled: false`
- Nenhuma análise é executada
- Sistema continua operando normalmente

---

## Observer v1 - Padrões Detectados

| Padrão | Condição | Confiança |
|--------|----------|-----------|
| Erros elevados | error_rate > 10% | 0.1 - 0.95 |
| Eventos falhando | app_events_failed > 0 | 0.7 - 0.95 |
| Sem eventos | requests > 100, events = 0 | 0.6 |
| Sistema ocioso | uptime > 5min, zero eventos | 0.5 |
| DB com problema | db_status != "ok" | 0.95 |
| Memória elevada | memory > 500MB | 0.6 |
| Goroutines elevadas | goroutines > 1000 | 0.7 |

---

## Snapshot Controlado

O snapshot contém **apenas dados agregados**:

```json
{
  "snapshot_version": "1.0",
  "snapshot_hash": "sha256...",
  "window_start": "RFC3339",
  "window_end": "RFC3339",
  "metrics": {
    "audit_events_total": 0,
    "app_events_total": 0,
    "requests_total": 100,
    "errors_total": 5
  },
  "system_status": {
    "health_status": "ok",
    "ready_status": "ok",
    "db_status": "ok"
  }
}
```

**Nunca inclui:** IPs, user IDs, payloads, secrets, mensagens.

---

*Documento criado em 29/12/2024 - Fase 23*
