# PROST-QS Policy Triggers & Auto Mitigations

> Sistema de governança automática - Nível Google SRE

## Conceito

Policy Triggers são regras que, quando violadas, disparam ações automáticas de mitigação.

```
Condição → Trigger → Mitigação → Audit → Notificação
```

---

## Triggers Implementados

### 1. Error Rate Trigger
```json
{
  "trigger": "error_rate_high",
  "condition": {
    "metric": "error_rate",
    "threshold": 0.1,
    "window": "5m"
  },
  "mitigation": {
    "action": "reduce_autonomy",
    "params": {
      "scope": "agents",
      "new_level": 1
    }
  },
  "notification": ["admin", "on_call"]
}
```

**Comportamento**: Se taxa de erro > 10% em 5 minutos, reduz autonomia de agentes para nível 1.

### 2. Billing Failure Trigger
```json
{
  "trigger": "billing_failure_cascade",
  "condition": {
    "metric": "payment_failures",
    "threshold": 5,
    "window": "1h",
    "per": "user"
  },
  "mitigation": {
    "action": "downgrade_subscription",
    "params": {
      "to_plan": "free",
      "grace_period": "7d"
    }
  },
  "notification": ["user", "billing_team"]
}
```

**Comportamento**: Se usuário tem 5+ falhas de pagamento em 1h, downgrade automático com 7 dias de graça.

### 3. Agent Violation Trigger
```json
{
  "trigger": "agent_policy_violation",
  "condition": {
    "event": "policy_violation",
    "severity": "high",
    "count": 1
  },
  "mitigation": {
    "action": "enable_shadow_mode",
    "params": {
      "scope": "agent",
      "duration": "24h"
    }
  },
  "notification": ["admin", "agent_owner"]
}
```

**Comportamento**: Se agente viola política de alta severidade, entra em shadow mode por 24h.

### 4. Rate Limit Abuse Trigger
```json
{
  "trigger": "rate_limit_abuse",
  "condition": {
    "metric": "rate_limit_hits",
    "threshold": 100,
    "window": "1m"
  },
  "mitigation": {
    "action": "temporary_ban",
    "params": {
      "duration": "1h"
    }
  },
  "notification": ["security_team"]
}
```

### 5. Suspicious Activity Trigger
```json
{
  "trigger": "suspicious_activity",
  "condition": {
    "events": ["multiple_failed_logins", "unusual_location", "high_value_transaction"],
    "within": "10m"
  },
  "mitigation": {
    "action": "require_verification",
    "params": {
      "method": "phone",
      "block_until_verified": true
    }
  },
  "notification": ["user", "security_team"]
}
```

---

## Auto Mitigations Disponíveis

| Action | Descrição | Reversível |
|--------|-----------|------------|
| `reduce_autonomy` | Reduz nível de autonomia de agentes | Sim |
| `enable_shadow_mode` | Ativa modo simulação | Sim |
| `downgrade_subscription` | Rebaixa plano do usuário | Sim |
| `temporary_ban` | Bloqueia acesso temporário | Sim |
| `require_verification` | Exige verificação adicional | Sim |
| `activate_killswitch` | Ativa kill switch de escopo | Sim |
| `notify_human` | Cria approval pendente | N/A |
| `log_and_continue` | Apenas registra | N/A |

---

## Fluxo de Execução

```
1. Evento ocorre (erro, falha, violação)
           ↓
2. Policy Engine avalia triggers
           ↓
3. Trigger matched?
    ├── Não → Continua normal
    └── Sim → Executa mitigação
                    ↓
4. Registra no Audit Log
           ↓
5. Envia notificações
           ↓
6. Cria Memory (precedente)
```

---

## Configuração

### Criar Trigger via API
```bash
POST /api/v1/policies/triggers
{
  "name": "custom_trigger",
  "condition": {...},
  "mitigation": {...},
  "notification": [...],
  "is_active": true
}
```

### Listar Triggers Ativos
```bash
GET /api/v1/policies/triggers
```

### Desativar Trigger
```bash
PUT /api/v1/policies/triggers/:id
{ "is_active": false }
```

---

## Rollback

Todas as mitigações automáticas podem ser revertidas:

```bash
POST /api/v1/mitigations/:id/rollback
{
  "reason": "False positive",
  "approved_by": "admin_user_id"
}
```

---

## Métricas

O sistema coleta:
- Triggers disparados por hora
- Mitigações executadas
- Tempo médio de resposta
- Taxa de false positives
- Rollbacks realizados

---

## Níveis de Severidade

| Level | Resposta | Exemplo |
|-------|----------|---------|
| `low` | Log only | Info events |
| `medium` | Notify | Warning events |
| `high` | Auto mitigate | Policy violations |
| `critical` | Kill switch | Security breach |

---

*Documento criado em: 2024-12-28*
*Implementação: Backend + Admin Console*
