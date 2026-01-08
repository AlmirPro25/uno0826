# PLAYBOOK — Como nasce um app no PROST-QS

Manual operacional. Sem teoria. Só execução.

---

## ⚠️ Aviso Institucional

**Nunca duplique lógica do PROST-QS no app.**

Se você sentir vontade de:
- Validar auth no app
- Calcular billing no app
- Guardar estado de subscription no app
- Criar regras de acesso no app

**PARE.** Isso é um bug conceitual.

---

## O Contrato App ↔ PROST-QS

| O app... | O PROST-QS... |
|----------|---------------|
| Não decide | Decide |
| Não valida | Valida |
| Não calcula | Calcula |
| **Consulta** | **Responde** |

---

## Premissa (grave isso)

- O app **não tem backend próprio**
- Auth, billing e autoridade **não são responsabilidade do app**
- O app é descartável. O PROST-QS não.
- Se integrar parecer chato, **o erro é do PROST-QS** — nunca do app

---

## 1. Criar o App

```
apps/
  meu-novo-app/
    index.html
    src/
      main.js
      prost-qs-sdk.js   ← copiar do first-app
      pages/
        login.js
        register.js
        dashboard.js
        pricing.js
```

Checklist:
- [ ] Frontend puro (HTML/JS/React/Vue/etc)
- [ ] Nenhum banco de dados
- [ ] Nenhum auth local
- [ ] Nenhuma lógica de pagamento

---

## 2. Conectar ao PROST-QS

### 2.1 SDK mínimo

```javascript
// prost-qs-sdk.js
export class ProstQSClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(method, path, data = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    
    const config = { method, headers };
    if (data) config.body = JSON.stringify(data);
    
    const response = await fetch(`${this.baseURL}${path}`, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro' }));
      throw new Error(error.error || 'Erro na requisição');
    }
    return response.json();
  }

  get(path) { return this.request('GET', path); }
  post(path, data) { return this.request('POST', path, data); }
}
```

### 2.2 Inicialização

```javascript
// main.js
import { ProstQSClient } from './prost-qs-sdk.js';

const PROST_QS_URL = 'http://localhost:8080';
window.prostqs = new ProstQSClient(PROST_QS_URL);

// Estado global
window.appState = {
  user: null,
  token: localStorage.getItem('prostqs_token'),
  subscription: null
};

// Se tem token salvo, configura
if (window.appState.token) {
  window.prostqs.setToken(window.appState.token);
}
```

---

## 3. Auth (copiar e colar)

### Login

```javascript
window.login = async function(username, password) {
  const response = await window.prostqs.post('/api/v1/auth/login', {
    username, password
  });
  
  window.appState.token = response.token;
  localStorage.setItem('prostqs_token', response.token);
  window.prostqs.setToken(response.token);
  
  // Carregar dados do usuário
  window.appState.user = await window.prostqs.get('/api/v1/identity/me');
  
  return { success: true };
};
```

### Register

```javascript
window.register = async function(username, password, email) {
  await window.prostqs.post('/api/v1/auth/register', {
    username, password, email
  });
  return await window.login(username, password);
};
```

### Logout

```javascript
window.logout = function() {
  localStorage.removeItem('prostqs_token');
  window.appState = { user: null, token: null, subscription: null };
  window.prostqs.setToken(null);
};
```

---

## 4. Feature Gating

### Carregar subscription

```javascript
async function loadSubscription() {
  try {
    // Garante billing account existe
    try {
      await window.prostqs.get('/api/v1/billing/account');
    } catch (e) {
      await window.prostqs.post('/api/v1/billing/account', {
        email: window.appState.user?.email || '',
        phone: ''
      });
    }
    
    // Busca subscription ativa
    window.appState.subscription = await window.prostqs.get(
      '/api/v1/billing/subscriptions/active'
    );
  } catch (e) {
    window.appState.subscription = null;
  }
}
```

### Verificar acesso

```javascript
window.hasActiveSubscription = function() {
  return window.appState.subscription?.status === 'active';
};

// Uso no app:
if (window.hasActiveSubscription()) {
  // Mostra feature premium
} else {
  // Mostra paywall
}
```

---

## 5. Monetização

### Criar subscription

```javascript
async function subscribe(planId) {
  const response = await window.prostqs.post('/api/v1/billing/subscriptions', {
    plan_id: planId,
    amount: 2900,      // centavos
    currency: 'BRL',
    interval: 'month'
  });
  
  window.appState.subscription = response;
  return response;
}
```

### Cancelar

```javascript
async function cancelSubscription() {
  const subId = window.appState.subscription?.subscription_id;
  await window.prostqs.delete(`/api/v1/billing/subscriptions/${subId}`);
  window.appState.subscription = null;
}
```

---

## 6. Estrutura de Páginas

### Router mínimo

```javascript
function router() {
  const hash = window.location.hash || '#login';
  const app = document.getElementById('app');
  
  // Rotas públicas
  if (hash === '#login') return renderLogin(app);
  if (hash === '#register') return renderRegister(app);
  
  // Rotas protegidas
  if (!window.appState.token) {
    window.location.hash = '#login';
    return;
  }
  
  if (hash === '#dashboard') return renderDashboard(app);
  if (hash === '#pricing') return renderPricing(app);
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
```

---

## 7. Teste Obrigatório

Antes de considerar o app "vivo", testar:

- [ ] Cadastro com dados novos
- [ ] Cadastro com username duplicado (deve barrar)
- [ ] Login com credenciais corretas
- [ ] Login com senha errada (deve falhar)
- [ ] Logout
- [ ] Refresh da página (sessão deve persistir)
- [ ] Acesso a rota protegida sem login (deve redirecionar)
- [ ] Acesso a feature premium sem pagar (deve mostrar paywall)
- [ ] Pagamento (subscription criada)
- [ ] Feature premium liberada após pagamento
- [ ] Abrir aba anônima (deve pedir login)

**Se qualquer item falhar → problema é do PROST-QS, não do app.**

---

## 8. Endpoints Usados

| Ação | Método | Endpoint |
|------|--------|----------|
| Register | POST | `/api/v1/auth/register` |
| Login | POST | `/api/v1/auth/login` |
| Dados usuário | GET | `/api/v1/identity/me` |
| Billing account | GET/POST | `/api/v1/billing/account` |
| Subscription ativa | GET | `/api/v1/billing/subscriptions/active` |
| Criar subscription | POST | `/api/v1/billing/subscriptions` |
| Cancelar subscription | DELETE | `/api/v1/billing/subscriptions/:id` |

---

## 9. Arquivos para Copiar

Do `apps/prostqs-first-app/`:

```
src/prost-qs-sdk.js    → SDK pronto
src/main.js            → Estrutura base
src/pages/login.js     → Página de login
src/pages/register.js  → Página de registro
src/pages/dashboard.js → Exemplo de página protegida
src/pages/pricing.js   → Exemplo de paywall
index.html             → HTML base com Tailwind
```

---

## 10. Regra de Ouro (nunca esqueça)

> **Se integrar parecer chato, o erro é do PROST-QS — nunca do app.**

O app pergunta. O PROST-QS responde.
O app não sabe de billing. O PROST-QS sabe.
O app não valida auth. O PROST-QS valida.

---

## Tempo Esperado

| App | Tempo |
|-----|-------|
| Primeiro (prostqs-first-app) | ~2h |
| Segundo | ~30min |
| Terceiro em diante | ~15min |

Se demorar mais, algo está errado no PROST-QS.

---

*Playbook criado em 28/12/2024 após validação real do primeiro app.*
