# PROST-QS Kernel Integration Guide

> **Manual para Agentes de IA** — Como consumir o Kernel para criar aplicações

---

## 🎯 Propósito deste Documento

Este documento é um **contrato de integração** para agentes de IA (como AI Web Weaver) que precisam criar aplicações consumindo o PROST-QS Kernel. Ele define:

1. **O que o Kernel oferece** — Capacidades disponíveis
2. **Como autenticar** — Fluxos de autenticação
3. **Como consumir** — Endpoints e payloads
4. **Padrões obrigatórios** — Regras que DEVEM ser seguidas

---

## 📋 Checklist de Integração

Antes de criar qualquer aplicação, verifique:

```
□ Aplicação registrada no Kernel (app_id + app_secret)
□ Webhook URL configurada para receber eventos
□ Stripe conectado (se usar billing)
□ Ambiente de teste validado
```

---

## 🔐 Autenticação

### Opção 1: Verificação por Email (Recomendado)

```
FLUXO:
1. Frontend chama POST /auth/verify/start com email
2. Usuário recebe código de 6 dígitos por email
3. Frontend chama POST /auth/verify/complete com código
4. Kernel retorna JWT tokens
5. Frontend armazena tokens e usa em requests
```

**Implementação:**

```javascript
// 1. Iniciar verificação
const startVerification = async (email, appId) => {
  const response = await fetch(`${KERNEL_URL}/api/v1/auth/verify/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, app_id: appId })
  });
  return response.json(); // { verification_id, expires_at }
};

// 2. Completar verificação
const completeVerification = async (verificationId, code) => {
  const response = await fetch(`${KERNEL_URL}/api/v1/auth/verify/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verification_id: verificationId, code })
  });
  return response.json(); // { access_token, refresh_token, user }
};
```

### Opção 2: Login Implícito (Apps sem autenticação explícita)

```
FLUXO:
1. App gera device_id único no cliente
2. App chama POST /identity/implicit-login com device_id
3. Kernel cria/recupera usuário e retorna JWT
4. Usuário "logado" sem interação
```

**Implementação:**

```javascript
const implicitLogin = async (deviceId, metadata = {}) => {
  const response = await fetch(`${KERNEL_URL}/api/v1/identity/implicit-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Key': APP_KEY,
      'X-App-Secret': APP_SECRET
    },
    body: JSON.stringify({ device_id: deviceId, metadata })
  });
  return response.json(); // { access_token, user }
};
```

### Usando o Token

```javascript
// Todas as requests autenticadas
const authenticatedRequest = async (endpoint, options = {}) => {
  const token = getStoredToken(); // localStorage, cookie, etc.
  
  return fetch(`${KERNEL_URL}/api/v1${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

---

## 💰 Billing

### Listar Planos

```javascript
const getPlans = async () => {
  const response = await fetch(`${KERNEL_URL}/api/v1/billing/plans`);
  return response.json();
  // { plans: [{ id: "pro", name: "Pro", price: 2900, currency: "brl", interval: "month" }] }
};
```

### Criar Checkout

```javascript
const createCheckout = async (planId, successUrl, cancelUrl) => {
  const response = await authenticatedRequest('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: planId,
      success_url: successUrl,
      cancel_url: cancelUrl
    })
  });
  const { checkout_url } = await response.json();
  
  // Redirecionar usuário para Stripe
  window.location.href = checkout_url;
};
```

### Verificar Assinatura

```javascript
const getSubscription = async () => {
  const response = await authenticatedRequest('/billing/subscription');
  if (response.status === 404) {
    return null; // Sem assinatura
  }
  return response.json();
  // { id, plan_id, status: "active", current_period_end }
};
```

### Webhook de Pagamento

Configure seu backend para receber webhooks:

```javascript
// Express.js example
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  // O Kernel já processa o webhook, você recebe eventos processados
  // via seu webhook configurado no Kernel
  
  res.json({ received: true });
});
```

---

## 🛡️ Immunity (Sistema de Defesa)

### Verificar Saúde

```javascript
const checkImmunityHealth = async () => {
  const response = await fetch(`${KERNEL_URL}/api/v1/immunity/health`);
  return response.json();
  // { status: "healthy", score: 95, open_circuits: 0, active_quarantines: 0 }
};
```

### Listar Ameaças Bloqueadas

```javascript
const getThreats = async () => {
  const response = await authenticatedRequest('/immunity/threats');
  return response.json();
  // { blocked_sources: [{ source: "192.168.1.100", expires_at: "..." }] }
};
```

### Bloquear IP Manualmente

```javascript
const blockIP = async (ip, duration, reason) => {
  const response = await authenticatedRequest('/immunity/threats/block', {
    method: 'POST',
    body: JSON.stringify({ ip, duration, reason })
  });
  return response.json();
};
```

---

## 📊 Invariants (Monitoramento)

### Verificar Violações

```javascript
const getViolations = async () => {
  const response = await authenticatedRequest('/invariants/violations');
  return response.json();
  // { violations: [...], count: 5 }
};
```

### Estatísticas

```javascript
const getInvariantStats = async () => {
  const response = await authenticatedRequest('/invariants/stats');
  return response.json();
  // { total: 5, by_severity: { CRITICAL: 2, WARNING: 3 }, enabled: true }
};
```

---

## 🔄 Padrões Obrigatórios

### 1. Tratamento de Erros

```javascript
const handleKernelResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    
    switch (response.status) {
      case 401:
        // Token expirado - tentar refresh
        await refreshToken();
        throw new Error('TOKEN_EXPIRED');
      case 403:
        throw new Error('FORBIDDEN');
      case 429:
        // Rate limit - aguardar
        const retryAfter = error.retry_after || 60;
        await sleep(retryAfter * 1000);
        throw new Error('RATE_LIMITED');
      default:
        throw new Error(error.error || 'UNKNOWN_ERROR');
    }
  }
  
  return response.json();
};
```

### 2. Refresh Token

```javascript
const refreshToken = async () => {
  const refreshToken = getStoredRefreshToken();
  
  const response = await fetch(`${KERNEL_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  
  if (!response.ok) {
    // Refresh falhou - forçar re-login
    clearTokens();
    redirectToLogin();
    return;
  }
  
  const { access_token, refresh_token } = await response.json();
  storeTokens(access_token, refresh_token);
};
```

### 3. Retry com Backoff

```javascript
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        await sleep(retryAfter * 1000);
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
};
```

---

## 📦 SDK Client Completo

```javascript
// kernel-client.js
class ProstQSClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.appKey = config.appKey;
    this.appSecret = config.appSecret;
    this.accessToken = null;
    this.refreshToken = null;
  }

  // ========================================
  // AUTH
  // ========================================
  
  async startVerification(email, appId) {
    return this.request('/auth/verify/start', {
      method: 'POST',
      body: { email, app_id: appId }
    });
  }

  async completeVerification(verificationId, code) {
    const result = await this.request('/auth/verify/complete', {
      method: 'POST',
      body: { verification_id: verificationId, code }
    });
    this.setTokens(result.access_token, result.refresh_token);
    return result;
  }

  async implicitLogin(deviceId, metadata = {}) {
    const result = await this.request('/identity/implicit-login', {
      method: 'POST',
      body: { device_id: deviceId, metadata },
      useAppAuth: true
    });
    this.setTokens(result.access_token, result.refresh_token);
    return result;
  }

  async getProfile() {
    return this.request('/identity/me');
  }

  // ========================================
  // BILLING
  // ========================================

  async getPlans() {
    return this.request('/billing/plans', { auth: false });
  }

  async getSubscription() {
    return this.request('/billing/subscription');
  }

  async createCheckout(planId, successUrl, cancelUrl) {
    return this.request('/billing/checkout', {
      method: 'POST',
      body: { plan_id: planId, success_url: successUrl, cancel_url: cancelUrl }
    });
  }

  // ========================================
  // IMMUNITY
  // ========================================

  async getImmunityHealth() {
    return this.request('/immunity/health', { auth: false });
  }

  async getThreats() {
    return this.request('/immunity/threats');
  }

  async blockIP(ip, duration, reason) {
    return this.request('/immunity/threats/block', {
      method: 'POST',
      body: { ip, duration, reason }
    });
  }

  // ========================================
  // INVARIANTS
  // ========================================

  async getViolations() {
    return this.request('/invariants/violations');
  }

  async getInvariantStats() {
    return this.request('/invariants/stats');
  }

  // ========================================
  // INTERNAL
  // ========================================

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  async request(endpoint, options = {}) {
    const { method = 'GET', body, auth = true, useAppAuth = false } = options;
    
    const headers = { 'Content-Type': 'application/json' };
    
    if (auth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    if (useAppAuth) {
      headers['X-App-Key'] = this.appKey;
      headers['X-App-Secret'] = this.appSecret;
    }

    const response = await fetch(`${this.baseUrl}/api/v1${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (response.status === 401 && this.refreshToken) {
      await this.doRefresh();
      return this.request(endpoint, options);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async doRefresh() {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.refreshToken })
    });

    if (!response.ok) {
      this.accessToken = null;
      this.refreshToken = null;
      throw new Error('Session expired');
    }

    const result = await response.json();
    this.setTokens(result.access_token, result.refresh_token);
  }
}

// Uso:
// const kernel = new ProstQSClient({
//   baseUrl: 'https://api.prostqs.com',
//   appKey: 'your-app-key',
//   appSecret: 'your-app-secret'
// });
```

---

## 🚨 Regras para Agentes de IA

### DEVE fazer:

1. ✅ Sempre tratar erros 401 com refresh token
2. ✅ Implementar retry com backoff exponencial
3. ✅ Armazenar tokens de forma segura (httpOnly cookies ou secure storage)
4. ✅ Validar inputs antes de enviar ao Kernel
5. ✅ Usar HTTPS em produção
6. ✅ Configurar webhooks para eventos assíncronos

### NÃO DEVE fazer:

1. ❌ Armazenar tokens em localStorage em produção
2. ❌ Expor app_secret no frontend
3. ❌ Ignorar rate limits
4. ❌ Fazer polling excessivo (use webhooks)
5. ❌ Confiar em dados do cliente sem validação

---

## 📡 Webhooks

O Kernel envia eventos para sua aplicação via webhooks:

### Eventos Disponíveis

| Evento | Descrição |
|--------|-----------|
| `user.created` | Novo usuário criado |
| `user.verified` | Email verificado |
| `subscription.created` | Nova assinatura |
| `subscription.updated` | Assinatura atualizada |
| `subscription.canceled` | Assinatura cancelada |
| `payment.succeeded` | Pagamento confirmado |
| `payment.failed` | Pagamento falhou |
| `threat.detected` | Ameaça detectada |
| `invariant.violated` | Invariante violado |

### Payload de Webhook

```json
{
  "event": "subscription.created",
  "timestamp": "2026-01-11T10:00:00Z",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "subscription_id": "sub_123",
    "plan_id": "pro",
    "status": "active"
  },
  "signature": "sha256=..."
}
```

### Validar Assinatura

```javascript
const crypto = require('crypto');

const validateWebhookSignature = (payload, signature, secret) => {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expected}` === signature;
};
```

---

## 🔗 URLs de Referência

| Ambiente | URL |
|----------|-----|
| Produção | `https://api.prostqs.com` |
| Staging | `https://staging-api.prostqs.com` |
| Local | `http://localhost:8080` |
| Swagger UI | `/swagger/index.html` |
| OpenAPI JSON | `/swagger/doc.json` |

---

## 📞 Suporte

- **Documentação:** `/swagger/index.html`
- **Status:** `/health`
- **Métricas:** `/alerts/metrics/prometheus`

---

*Documento gerado em 11/01/2026 — PROST-QS Kernel v1.0*
