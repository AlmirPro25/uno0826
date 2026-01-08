# PROST-QS Manifest Schema v1.0

> **STATUS: FROZEN** - Schema oficial para apps, policies e agents

---

## App Manifest

Arquivo: `prost-qs.manifest.json`

```json
{
  "$schema": "https://prost-qs.com/schemas/app-manifest-v1.json",
  "version": "1.0",
  "app": {
    "id": "app_unique_id",
    "name": "Meu App",
    "description": "Descrição do app",
    "version": "1.0.0",
    "author": {
      "name": "Dev Name",
      "email": "dev@email.com"
    }
  },
  "permissions": {
    "identity": {
      "read": true,
      "write": false
    },
    "billing": {
      "read": true,
      "write": true,
      "max_transaction": 100000
    },
    "agents": {
      "enabled": false
    },
    "ads": {
      "enabled": false
    }
  },
  "callbacks": {
    "auth_redirect": "https://app.com/callback",
    "webhook": "https://app.com/webhook"
  },
  "policies": {
    "require_email_verification": true,
    "require_phone_verification": true,
    "min_age": 18
  }
}
```

### Campos Obrigatórios
- `app.id`: Identificador único (snake_case)
- `app.name`: Nome de exibição
- `permissions`: Pelo menos um módulo

### Campos Opcionais
- `callbacks`: URLs de callback
- `policies`: Regras específicas do app

---

## Policy Manifest

```json
{
  "$schema": "https://prost-qs.com/schemas/policy-v1.json",
  "version": "1.0",
  "policy": {
    "id": "policy_unique_id",
    "name": "max_daily_transactions",
    "description": "Limite de transações diárias",
    "type": "limit",
    "scope": "billing",
    "value": "1000",
    "is_active": true,
    "conditions": {
      "user_role": ["user"],
      "plan": ["free", "premium"]
    },
    "actions": {
      "on_violation": "block",
      "notify": ["admin", "user"]
    }
  }
}
```

### Tipos de Policy
| Type | Value Format | Exemplo |
|------|--------------|---------|
| `limit` | número | `"1000"` |
| `threshold` | decimal 0-1 | `"0.7"` |
| `boolean` | true/false | `"true"` |
| `allowlist` | JSON array | `'["a","b"]'` |
| `blocklist` | JSON array | `'["x","y"]'` |

### Escopos
- `global`: Aplica a tudo
- `billing`: Pagamentos e ledger
- `identity`: Usuários e auth
- `agents`: Decisões de agentes
- `ads`: Campanhas

---

## Agent Profile Manifest

```json
{
  "$schema": "https://prost-qs.com/schemas/agent-profile-v1.json",
  "version": "1.0",
  "profile": {
    "id": "profile_conservative",
    "name": "Conservative",
    "description": "Perfil conservador - requer aprovação para tudo",
    "autonomy": {
      "level": 1,
      "max_risk_auto": 0.2,
      "max_amount_auto": 1000,
      "requires_approval": ["billing.*", "identity.delete", "agent.execute"]
    },
    "limits": {
      "decisions_per_hour": 10,
      "max_consecutive_auto": 3
    },
    "fallback": {
      "on_error": "shadow_mode",
      "on_limit": "queue_for_approval"
    }
  }
}
```

### Níveis de Autonomia
| Level | Descrição | Auto Approval |
|-------|-----------|---------------|
| 1 | Mínimo | Risk < 0.2 |
| 2 | Baixo | Risk < 0.4 |
| 3 | Médio | Risk < 0.6 |
| 4 | Alto | Risk < 0.8 |
| 5 | Total | Tudo (perigoso) |

---

## Authority Manifest

```json
{
  "$schema": "https://prost-qs.com/schemas/authority-v1.json",
  "version": "1.0",
  "authority": {
    "user_id": "uuid",
    "grants": [
      {
        "scope": "billing",
        "level": 3,
        "daily_limit": 50,
        "expires_at": "2025-12-31T23:59:59Z"
      },
      {
        "scope": "agents",
        "level": 2,
        "daily_limit": 20
      }
    ]
  }
}
```

---

## Roles

| Role | Permissões |
|------|------------|
| `user` | Próprios dados, billing pessoal |
| `developer` | + Criar apps, tokens, ver SDK usage |
| `admin` | + Ver todos usuários, aprovar, policies |
| `super_admin` | + Kill switch, authority, system config |

---

## Validação

Todos os manifests devem:
1. Passar validação JSON Schema
2. Ter `version` compatível
3. Ter campos obrigatórios preenchidos
4. Respeitar limites de tamanho (max 64KB)

---

*Documento congelado em: 2024-12-28*
