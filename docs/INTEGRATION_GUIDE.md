# PROST-QS Integration Guide

> Guia técnico para integrar aplicações externas ao PROST-QS

## Visão Geral

O PROST-QS opera como uma **plataforma de governança cognitiva**. Aplicações externas se conectam via API Keys para:
- Enviar eventos de audit
- Autenticar usuários via Identity Soberana
- Processar pagamentos via Billing Kernel
- Submeter decisões para governança de agentes

## Autenticação

### Dois Modos de Autenticação

| Modo | Header | Uso |
|------|--------|-----|
| **User JWT** | `Authorization: Bearer <token>` | Usuário final autenticado |
| **App API Key** | `X-App-Key` + `X-App-Secret` | Servidor-para-servidor |

### Obtendo API Keys

1. Acesse o Console Admin → Applications
2. Crie um novo App (nome + slug único)
3. Gere uma API Key com os scopes necessários
4. **IMPORTANTE**: O Secret só é mostrado UMA VEZ

### Headers Obrigatórios (Modo App)

```http
X-App-Key: pq_pk_xxxxxxxxxxxxxxxx
X-App-Secret: pq_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

## Endpoints de Integração

### Base URL
```
Production: https://api.prost-qs.com/api/v1
Development: http://localhost:8080/api/v1
```

---

## 1. Eventos de Audit

Envie eventos do seu app para o PROST-QS rastrear.

### POST /apps/events

```bash
curl -X POST http://localhost:8080/api/v1/apps/events \
  -H "X-App-Key: pq_pk_xxx" \
  -H "X-App-Secret: pq_sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user.login",
    "actor_id": "user_123",
    "actor_type": "user",
    "action": "login",
    "ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  }'
```

**Response 201:**
```json
{ "status": "ok", "message": "Evento registrado" }
```

### GET /apps/events

Lista eventos do seu app.

```bash
curl http://localhost:8080/api/v1/apps/events?limit=100 \
  -H "X-App-Key: pq_pk_xxx" \
  -H "X-App-Secret: pq_sk_xxx"
```

---

## 2. Scopes Disponíveis

| Scope | Permissões |
|-------|------------|
| `identity` | Autenticação, perfil de usuários |
| `billing` | Pagamentos, subscriptions, ledger |
| `agents` | Governança de agentes, decisões |
| `audit` | Eventos de audit, logs |

---

## 3. Exemplo de Integração (Node.js)

```javascript
const PROST_QS_URL = 'http://localhost:8080/api/v1';
const APP_KEY = 'pq_pk_xxx';
const APP_SECRET = 'pq_sk_xxx';

async function sendEvent(event) {
  const response = await fetch(`${PROST_QS_URL}/apps/events`, {
    method: 'POST',
    headers: {
      'X-App-Key': APP_KEY,
      'X-App-Secret': APP_SECRET,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });
  
  if (!response.ok) {
    throw new Error(`PROST-QS Error: ${response.status}`);
  }
  
  return response.json();
}

// Uso
await sendEvent({
  type: 'order.created',
  actor_id: 'user_456',
  actor_type: 'user',
  target_id: 'order_789',
  target_type: 'order',
  action: 'create',
  metadata: JSON.stringify({ total: 15000, items: 3 })
});
```

---

## 4. Exemplo de Integração (Python)

```python
import requests

PROST_QS_URL = 'http://localhost:8080/api/v1'
APP_KEY = 'pq_pk_xxx'
APP_SECRET = 'pq_sk_xxx'

def send_event(event_type, actor_id, **kwargs):
    response = requests.post(
        f'{PROST_QS_URL}/apps/events',
        headers={
            'X-App-Key': APP_KEY,
            'X-App-Secret': APP_SECRET,
            'Content-Type': 'application/json'
        },
        json={
            'type': event_type,
            'actor_id': actor_id,
            **kwargs
        }
    )
    response.raise_for_status()
    return response.json()

# Uso
send_event(
    'payment.completed',
    actor_id='user_123',
    target_id='payment_456',
    target_type='payment',
    action='complete'
)
```

---

## 5. Tipos de Evento Recomendados

| Categoria | Tipos |
|-----------|-------|
| **Auth** | `user.login`, `user.logout`, `user.signup`, `user.password_reset` |
| **Billing** | `payment.created`, `payment.completed`, `payment.failed`, `subscription.created` |
| **Content** | `content.created`, `content.updated`, `content.deleted` |
| **Admin** | `admin.action`, `admin.config_change`, `admin.user_ban` |
| **Security** | `security.suspicious`, `security.blocked`, `security.rate_limited` |

---

## 6. Tratamento de Erros

| Status | Significado | Ação |
|--------|-------------|------|
| 401 | API Key inválida | Verificar X-App-Key e X-App-Secret |
| 403 | Scope insuficiente | Gerar nova key com scopes corretos |
| 429 | Rate limit | Aguardar e retry com backoff |
| 500 | Erro interno | Retry com backoff exponencial |

---

## 7. Rate Limits

| Endpoint | Limite |
|----------|--------|
| POST /apps/events | 1000/min |
| GET /apps/events | 100/min |

---

## 8. Webhook (Futuro)

Configure `webhook_url` no seu App para receber notificações:

```json
{
  "event": "decision.approved",
  "app_id": "uuid",
  "data": { ... },
  "timestamp": "ISO8601"
}
```

---

*Documento atualizado em: 2024-12-29*
