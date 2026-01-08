# PROST-QS API Contracts v1.0

> **STATUS: FROZEN** - Não modificar sem versionamento

## Base URL
```
Production: https://api.prost-qs.com/api/v1
Development: http://localhost:8080/api/v1
```

## Autenticação
```
Header: Authorization: Bearer <JWT_TOKEN>
```

---

## Identity Module

### POST /auth/phone/request
Solicita código OTP.
```json
// Request
{ "phone_number": "+5511999999999", "channel": "sms" }

// Response 200
{ "verification_id": "uuid", "expires_at": "ISO8601", "dev_otp": "123456" }
```

### POST /auth/phone/verify
Verifica código OTP.
```json
// Request
{ "verification_id": "uuid", "code": "123456" }

// Response 200 (usuário existente)
{ "token": "jwt", "user": {...}, "is_new_user": false }

// Response 200 (novo usuário)
{ "is_new_user": true, "verification_id": "uuid" }
```

### POST /auth/complete-signup
Completa cadastro de novo usuário.
```json
// Request
{ "name": "string", "email": "string" }

// Response 200
{ "token": "jwt", "user": {...} }
```

### GET /identity/me
Retorna usuário logado.
```json
// Response 200
{
  "id": "uuid",
  "username": "string",
  "role": "user|admin|super_admin",
  "status": "active|suspended|banned",
  "profile": { "name": "string", "email": "string", "avatar_url": "string" },
  "auth_methods": [{ "type": "phone", "identifier": "+55..." }],
  "created_at": "ISO8601"
}
```

---

## Billing Module

### GET /billing/account
Retorna conta de billing do usuário.
```json
// Response 200
{ "id": "uuid", "user_id": "uuid", "balance": 0, "currency": "brl", "status": "active" }
```

### POST /billing/account
Cria conta de billing.
```json
// Response 201
{ "id": "uuid", "user_id": "uuid", "balance": 0, "currency": "brl" }
```

### GET /billing/ledger
Retorna histórico de transações.
```json
// Response 200
{
  "balance": 0,
  "currency": "brl",
  "entries": [
    { "id": "uuid", "type": "credit|debit", "amount": 1000, "description": "string", "created_at": "ISO8601" }
  ]
}
```

### POST /billing/payment-intent
Cria intenção de pagamento.
```json
// Request
{ "amount": 1000, "currency": "brl", "description": "string" }

// Response 201
{ "intent_id": "uuid", "status": "pending", "amount": 1000 }
```

---

## Subscriptions

### GET /subscriptions/active
Retorna assinatura ativa.
```json
// Response 200
{
  "id": "uuid",
  "plan_id": "free|premium|pro",
  "status": "active|canceled|past_due",
  "current_period_end": "ISO8601"
}
```

### POST /subscriptions
Cria nova assinatura.
```json
// Request
{ "plan_id": "premium", "amount": 2990, "currency": "brl", "interval": "month" }

// Response 201
{ "id": "uuid", "plan_id": "premium", "status": "active" }
```

### POST /subscriptions/:id/cancel
Cancela assinatura.
```json
// Response 200
{ "id": "uuid", "status": "canceled" }
```

---

## Governance Module (Admin Only)

### GET /killswitch/status
```json
// Response 200
{ "active_switches": [{ "scope": "global", "reason": "string", "expires_at": "ISO8601" }] }
```

### POST /killswitch/activate
```json
// Request
{ "scope": "global|billing|agents|identity", "reason": "string", "duration_minutes": 60 }
```

### GET /policies
```json
// Response 200
[{ "id": "uuid", "name": "string", "type": "limit|threshold|boolean", "scope": "string", "value": "string", "is_active": true }]
```

### GET /approvals/pending
```json
// Response 200
[{ "id": "uuid", "action_type": "string", "risk_score": 0.5, "description": "string", "status": "pending" }]
```

### POST /approvals/:id/approve
```json
// Request
{ "note": "string" }
```

---

## Error Responses

```json
// 400 Bad Request
{ "error": "validation_error", "message": "string", "details": {} }

// 401 Unauthorized
{ "error": "unauthorized", "message": "Token inválido ou expirado" }

// 403 Forbidden
{ "error": "forbidden", "message": "Acesso negado" }

// 404 Not Found
{ "error": "not_found", "message": "Recurso não encontrado" }

// 429 Too Many Requests
{ "error": "rate_limited", "message": "Muitas requisições", "retry_after": 60 }

// 500 Internal Server Error
{ "error": "internal_error", "message": "Erro interno" }
```

---

## Rate Limits

| Endpoint | Limite |
|----------|--------|
| /auth/* | 10/min |
| /billing/* | 60/min |
| /admin/* | 120/min |
| Outros | 100/min |

---

*Documento congelado em: 2024-12-28*


---

## Application Module (API Keys)

### Autenticação via API Key
```
Header: X-App-Key: pq_pk_xxxxxxxxxxxxxxxx
Header: X-App-Secret: pq_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### POST /apps/events
Envia evento de audit do app.
```json
// Request
{
  "type": "user.login",
  "actor_id": "user_123",
  "actor_type": "user",
  "target_id": "optional",
  "target_type": "optional",
  "action": "login",
  "metadata": "{}",
  "ip": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}

// Response 201
{ "status": "ok", "message": "Evento registrado" }
```

### GET /apps/events
Lista eventos do app autenticado.
```json
// Response 200
{
  "events": [
    {
      "id": "uuid",
      "app_id": "uuid",
      "type": "user.login",
      "actor_id": "user_123",
      "created_at": "ISO8601"
    }
  ],
  "total": 1,
  "stats": {
    "total_events": 100,
    "events_by_type": { "user.login": 50, "user.logout": 30 }
  }
}
```

---

## Application Management (JWT Auth)

### POST /apps
Cria novo app.
```json
// Request
{
  "name": "Meu App",
  "slug": "meu-app",
  "description": "Descrição",
  "webhook_url": "https://...",
  "redirect_url": "https://..."
}

// Response 201
{
  "id": "uuid",
  "name": "Meu App",
  "slug": "meu-app",
  "status": "active",
  "created_at": "ISO8601"
}
```

### GET /apps/mine
Lista apps do usuário autenticado.
```json
// Response 200
{
  "apps": [...],
  "total": 1
}
```

### POST /apps/:id/credentials
Cria API Key para o app.
```json
// Request
{
  "name": "Production",
  "scopes": ["identity", "billing", "audit"]
}

// Response 201
{
  "credential": {
    "id": "uuid",
    "name": "Production",
    "public_key": "pq_pk_xxx",
    "scopes": "[\"identity\",\"billing\",\"audit\"]"
  },
  "secret": "pq_sk_xxx",
  "warning": "ATENÇÃO: O secret não será mostrado novamente."
}
```

### GET /apps/:id/credentials
Lista credentials do app.
```json
// Response 200
{
  "credentials": [
    {
      "id": "uuid",
      "name": "Production",
      "public_key": "pq_pk_xxx",
      "scopes": "[\"identity\",\"billing\"]",
      "last_used_at": "ISO8601"
    }
  ]
}
```

### DELETE /apps/:id/credentials/:credId
Revoga uma credential.
```json
// Response 200
{ "message": "Credencial revogada" }
```

### GET /apps/:id/metrics
Métricas do app.
```json
// Response 200
{
  "app_id": "uuid",
  "total_users": 100,
  "active_users_24h": 25,
  "total_sessions": 500,
  "active_sessions": 10,
  "last_activity_at": "ISO8601"
}
```

---

*Atualizado em: 2024-12-29 - Adicionado Application Module*
