# GUIA DE INTEGRAÇÃO DE APPS — PROST-QS / UNO.KERNEL

> Como integrar seu app ao PROST-QS em 30 minutos.

---

## 📋 Pré-requisitos

1. Conta de admin no PROST-QS
2. App criado no dashboard
3. API Keys geradas (public + secret)

---

## 🚀 Passo 1: Criar App no PROST-QS

### Via Dashboard
1. Acesse o Admin Dashboard
2. Vá em "Aplicações" → "Nova Aplicação"
3. Preencha nome e descrição
4. Copie as credenciais geradas

### Via API
```bash
curl -X POST https://uno0826.onrender.com/api/v1/applications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "meu-app",
    "description": "Descrição do meu app"
  }'
```

Resposta:
```json
{
  "id": "uuid-do-app",
  "name": "meu-app",
  "public_key": "pq_pk_...",
  "secret_key": "pq_sk_..."
}
```

---

## 🔧 Passo 2: Configurar Variáveis de Ambiente

```env
# .env do seu app
PROSTQS_URL=https://uno0826.onrender.com
PROSTQS_APP_ID=uuid-do-app
PROSTQS_APP_KEY=pq_pk_...
PROSTQS_APP_SECRET=pq_sk_...
```

---

## 📡 Passo 3: Enviar Telemetria

### Node.js
```javascript
// prostqs-client.js
const PROSTQS_URL = process.env.PROSTQS_URL;
const APP_KEY = process.env.PROSTQS_APP_KEY;
const APP_SECRET = process.env.PROSTQS_APP_SECRET;

async function sendEvent(type, data = {}) {
  try {
    const response = await fetch(`${PROSTQS_URL}/api/v1/telemetry/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Prost-App-Key': APP_KEY,
        'X-Prost-App-Secret': APP_SECRET
      },
      body: JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      })
    });
    return response.ok;
  } catch (error) {
    console.error('Telemetry error:', error);
    return false;
  }
}

// Uso
sendEvent('user.signup', { user_id: '123', plan: 'free' });
sendEvent('payment.completed', { amount: 99.90, currency: 'BRL' });
sendEvent('error.critical', { message: 'Database connection failed' });
```

### Python
```python
# prostqs_client.py
import os
import requests
from datetime import datetime

PROSTQS_URL = os.getenv('PROSTQS_URL')
APP_KEY = os.getenv('PROSTQS_APP_KEY')
APP_SECRET = os.getenv('PROSTQS_APP_SECRET')

def send_event(event_type: str, data: dict = None):
    try:
        response = requests.post(
            f"{PROSTQS_URL}/api/v1/telemetry/events",
            headers={
                'Content-Type': 'application/json',
                'X-Prost-App-Key': APP_KEY,
                'X-Prost-App-Secret': APP_SECRET
            },
            json={
                'type': event_type,
                'data': data or {},
                'timestamp': datetime.utcnow().isoformat()
            }
        )
        return response.ok
    except Exception as e:
        print(f"Telemetry error: {e}")
        return False

# Uso
send_event('user.signup', {'user_id': '123', 'plan': 'free'})
```

### Go
```go
// prostqs/client.go
package prostqs

import (
    "bytes"
    "encoding/json"
    "net/http"
    "os"
    "time"
)

var (
    prostqsURL  = os.Getenv("PROSTQS_URL")
    appKey      = os.Getenv("PROSTQS_APP_KEY")
    appSecret   = os.Getenv("PROSTQS_APP_SECRET")
)

type Event struct {
    Type      string                 `json:"type"`
    Data      map[string]interface{} `json:"data"`
    Timestamp string                 `json:"timestamp"`
}

func SendEvent(eventType string, data map[string]interface{}) error {
    event := Event{
        Type:      eventType,
        Data:      data,
        Timestamp: time.Now().UTC().Format(time.RFC3339),
    }
    
    body, _ := json.Marshal(event)
    req, _ := http.NewRequest("POST", prostqsURL+"/api/v1/telemetry/events", bytes.NewBuffer(body))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("X-Prost-App-Key", appKey)
    req.Header.Set("X-Prost-App-Secret", appSecret)
    
    client := &http.Client{Timeout: 5 * time.Second}
    _, err := client.Do(req)
    return err
}
```

---

## 🔐 Passo 4: Integrar Identity (Opcional)

Se quiser usar o sistema de identidade unificado do PROST-QS:

### Registro de Usuário
```javascript
async function registerUser(email, password, name) {
  const response = await fetch(`${PROSTQS_URL}/api/v1/identity/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prost-App-Key': APP_KEY,
      'X-Prost-App-Secret': APP_SECRET
    },
    body: JSON.stringify({ email, password, name })
  });
  
  const data = await response.json();
  // data.token = JWT para usar nas próximas requisições
  // data.user = dados do usuário
  return data;
}
```

### Login
```javascript
async function loginUser(email, password) {
  const response = await fetch(`${PROSTQS_URL}/api/v1/identity/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prost-App-Key': APP_KEY,
      'X-Prost-App-Secret': APP_SECRET
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  // Se needs_link = true, usuário existe mas não tem membership neste app
  if (data.needs_link) {
    // Mostrar modal de confirmação
    // Depois chamar linkApp()
  }
  
  return data;
}
```

### Vincular App (quando needs_link = true)
```javascript
async function linkApp(token) {
  const response = await fetch(`${PROSTQS_URL}/api/v1/identity/link-app`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Prost-App-Key': APP_KEY,
      'X-Prost-App-Secret': APP_SECRET
    }
  });
  
  return response.json();
}
```

---

## 📊 Passo 5: Eventos Recomendados

### Ciclo de Vida do Usuário
```javascript
// Quando usuário cria conta
sendEvent('user.signup', { user_id, plan, source });

// Quando usuário faz login
sendEvent('user.login', { user_id, method: 'email' });

// Quando usuário faz logout
sendEvent('user.logout', { user_id });

// Quando usuário é deletado
sendEvent('user.deleted', { user_id, reason });
```

### Sessões
```javascript
// Quando sessão inicia
sendEvent('session.start', { session_id, user_id, device });

// Heartbeat (a cada 30s)
sendEvent('session.ping', { session_id });

// Quando sessão termina
sendEvent('session.end', { session_id, duration_seconds });
```

### Pagamentos
```javascript
// Quando pagamento é iniciado
sendEvent('payment.started', { payment_id, amount, currency });

// Quando pagamento é completado
sendEvent('payment.completed', { payment_id, amount, method });

// Quando pagamento falha
sendEvent('payment.failed', { payment_id, error, retry_count });
```

### Erros
```javascript
// Erro de aplicação
sendEvent('error.application', { message, stack, user_id });

// Erro de infraestrutura
sendEvent('error.infrastructure', { service, message });

// Erro crítico
sendEvent('error.critical', { message, impact, affected_users });
```

---

## 🎯 Passo 6: Configurar Regras (Opcional)

No dashboard, você pode criar regras automáticas:

### Exemplo: Alerta de Erro Crítico
```json
{
  "name": "Alerta Erro Crítico",
  "trigger_type": "event",
  "condition": "type == 'error.critical'",
  "action_type": "alert",
  "action_config": {
    "severity": "critical",
    "title": "Erro Crítico Detectado",
    "message": "{{data.message}}"
  },
  "cooldown_minutes": 5
}
```

### Exemplo: Webhook em Pagamento
```json
{
  "name": "Notificar Pagamento",
  "trigger_type": "event",
  "condition": "type == 'payment.completed'",
  "action_type": "webhook",
  "action_config": {
    "url": "https://meu-app.com/webhooks/payment",
    "method": "POST",
    "headers": {
      "X-Webhook-Secret": "meu-secret"
    }
  }
}
```

---

## ✅ Checklist de Integração

- [ ] App criado no PROST-QS
- [ ] Variáveis de ambiente configuradas
- [ ] Cliente de telemetria implementado
- [ ] Eventos básicos sendo enviados
- [ ] Verificar eventos no dashboard
- [ ] (Opcional) Identity integrado
- [ ] (Opcional) Regras configuradas

---

## 🆘 Troubleshooting

### Eventos não aparecem no dashboard
1. Verificar se API Key está correta
2. Verificar se headers estão sendo enviados
3. Checar logs do seu app por erros de rede

### Erro 401 Unauthorized
1. Verificar se API Secret está correto
2. Verificar se app não foi desativado

### Erro 429 Too Many Requests
1. Você está enviando muitos eventos
2. Implementar batching ou reduzir frequência

---

## 📚 Referências

- [API Contracts](/docs/API_CONTRACTS.md)
- [Glossário Técnico](/docs/GLOSSARIO-TECNICO.md)
- [Contrato Operacional](/docs/CONTRATO-OPERACIONAL.md)

---

*Documento atualizado em 11/01/2026*
