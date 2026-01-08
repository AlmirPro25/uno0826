# MANIFESTO DA FÁBRICA — PROST-QS

## Instruções para Agentes de IA / Fábricas de Apps

Este documento é a **mente especializada** do ecossistema PROST-QS.
Qualquer IA que criar apps para este sistema DEVE absorver este manifesto.

---

# PARTE 1: IDENTIDADE DO SISTEMA

## O que é o PROST-QS

O PROST-QS é um **backend soberano compartilhado** que governa:
- Identidade (quem é o usuário)
- Dinheiro (billing, subscriptions, ledger)
- Autoridade (quem pode fazer o quê)
- Memória (histórico de decisões)

## O que o PROST-QS NÃO é

- ❌ Não é um framework
- ❌ Não é uma biblioteca
- ❌ Não é um template
- ❌ Não é opcional

## A Lei Fundamental

> **Todo app criado para este ecossistema é um cliente do PROST-QS.**
> **O app não tem soberania. O PROST-QS tem.**

---

# PARTE 2: PROIBIÇÕES ABSOLUTAS

## O que NUNCA fazer em um app

### 🚫 PROIBIÇÃO 1: Auth Local
```
NUNCA implemente:
- Login próprio
- Registro próprio
- Sessão própria
- JWT próprio
- Validação de senha
- Hash de senha
- Tabela de usuários
```

### 🚫 PROIBIÇÃO 2: Billing Local
```
NUNCA implemente:
- Integração direta com Stripe
- Integração direta com qualquer gateway
- Lógica de preços
- Cálculo de valores
- Tabela de pagamentos
- Tabela de subscriptions
```

### 🚫 PROIBIÇÃO 3: Backend Próprio
```
NUNCA crie:
- API própria para auth
- API própria para billing
- Banco de dados próprio para usuários
- Banco de dados próprio para pagamentos
```

### 🚫 PROIBIÇÃO 4: Duplicação de Estado
```
NUNCA armazene localmente:
- Se o usuário está logado (pergunte ao PROST-QS)
- Se o usuário pagou (pergunte ao PROST-QS)
- Qual o plano do usuário (pergunte ao PROST-QS)
- Dados do perfil (pergunte ao PROST-QS)
```

---

# PARTE 3: OBRIGAÇÕES ABSOLUTAS

## O que SEMPRE fazer em um app

### ✅ OBRIGAÇÃO 1: Usar o SDK
Todo app DEVE importar e usar o `prost-qs-sdk.js`

### ✅ OBRIGAÇÃO 2: Conectar ao Backend Central
```
PROST-QS Backend: http://localhost:8080 (dev)
PROST-QS Backend: https://api.prost-qs.com (prod - futuro)
```

### ✅ OBRIGAÇÃO 3: Delegar Auth
```javascript
// CORRETO
const response = await prostqs.post('/api/v1/auth/login', { username, password });

// ERRADO
const user = await myDatabase.findUser(username);
if (bcrypt.compare(password, user.hash)) { ... }
```

### ✅ OBRIGAÇÃO 4: Delegar Billing
```javascript
// CORRETO
const subscription = await prostqs.get('/api/v1/billing/subscriptions/active');

// ERRADO
const subscription = await stripe.subscriptions.retrieve(subId);
```

### ✅ OBRIGAÇÃO 5: Perguntar, Não Decidir
```javascript
// CORRETO - O app pergunta
if (await hasActiveSubscription()) {
  showPremiumFeature();
}

// ERRADO - O app decide
if (localStorage.getItem('isPremium') === 'true') {
  showPremiumFeature();
}
```

---

# PARTE 4: ARQUITETURA OBRIGATÓRIA

## Estrutura de Pastas

```
meu-app/
├── index.html              # Entry point
├── package.json            # Dependências (opcional)
├── src/
│   ├── main.js             # Inicialização + Router
│   ├── prost-qs-sdk.js     # SDK do PROST-QS (COPIAR)
│   └── pages/
│       ├── login.js        # Página de login
│       ├── register.js     # Página de registro
│       ├── dashboard.js    # Página principal (protegida)
│       └── pricing.js      # Página de planos
```

## Arquivos Obrigatórios

### 1. index.html
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nome do App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white">
  <div id="app"></div>
  <script type="module" src="./src/main.js"></script>
</body>
</html>
```

### 2. prost-qs-sdk.js (COPIAR EXATAMENTE)
```javascript
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
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${this.baseURL}${path}`, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || error.message || 'Erro na requisição');
    }
    return response.json();
  }

  get(path) { return this.request('GET', path); }
  post(path, data) { return this.request('POST', path, data); }
  put(path, data) { return this.request('PUT', path, data); }
  delete(path) { return this.request('DELETE', path); }
}
```

### 3. main.js (ESTRUTURA BASE)
```javascript
import { ProstQSClient } from './prost-qs-sdk.js';
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderPricing } from './pages/pricing.js';

// ========================================
// CONFIGURAÇÃO PROST-QS
// ========================================
const PROST_QS_URL = 'http://localhost:8080';
window.prostqs = new ProstQSClient(PROST_QS_URL);

// ========================================
// ESTADO GLOBAL (apenas referências)
// ========================================
window.appState = {
  user: null,
  token: localStorage.getItem('prostqs_token'),
  subscription: null
};

// ========================================
// ROUTER
// ========================================
function router() {
  const hash = window.location.hash || '#login';
  const app = document.getElementById('app');
  
  if (window.appState.token && !window.appState.user) {
    loadUser().then(() => renderRoute(hash, app));
  } else {
    renderRoute(hash, app);
  }
}

function renderRoute(hash, app) {
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
  
  // Default
  window.location.hash = '#login';
}

// ========================================
// FUNÇÕES DE AUTH (delegam ao PROST-QS)
// ========================================
async function loadUser() {
  try {
    window.appState.user = await window.prostqs.get('/api/v1/identity/me');
    await loadSubscription();
  } catch (error) {
    localStorage.removeItem('prostqs_token');
    window.appState.token = null;
    window.appState.user = null;
  }
}

async function loadSubscription() {
  try {
    try {
      await window.prostqs.get('/api/v1/billing/account');
    } catch (e) {
      await window.prostqs.post('/api/v1/billing/account', {
        email: window.appState.user?.email || '',
        phone: ''
      });
    }
    window.appState.subscription = await window.prostqs.get('/api/v1/billing/subscriptions/active');
  } catch (e) {
    window.appState.subscription = null;
  }
}

window.login = async function(username, password) {
  try {
    const response = await window.prostqs.post('/api/v1/auth/login', { username, password });
    window.appState.token = response.token;
    localStorage.setItem('prostqs_token', response.token);
    window.prostqs.setToken(response.token);
    await loadUser();
    window.location.hash = '#dashboard';
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

window.register = async function(username, password, email) {
  try {
    await window.prostqs.post('/api/v1/auth/register', { username, password, email });
    return await window.login(username, password);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

window.logout = function() {
  localStorage.removeItem('prostqs_token');
  window.appState = { user: null, token: null, subscription: null };
  window.prostqs.setToken(null);
  window.location.hash = '#login';
};

window.hasActiveSubscription = function() {
  return window.appState.subscription?.status === 'active';
};

// ========================================
// INICIALIZAÇÃO
// ========================================
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
  if (window.appState.token) {
    window.prostqs.setToken(window.appState.token);
  }
  router();
});
```

---

# PARTE 5: ENDPOINTS DO PROST-QS

## Endpoints que o App DEVE usar

| Ação | Método | Endpoint | Quando usar |
|------|--------|----------|-------------|
| Registrar | POST | `/api/v1/auth/register` | Criar conta |
| Login | POST | `/api/v1/auth/login` | Autenticar |
| Dados do usuário | GET | `/api/v1/identity/me` | Após login |
| Criar billing account | POST | `/api/v1/billing/account` | Antes de pagar |
| Ver billing account | GET | `/api/v1/billing/account` | Verificar se existe |
| Subscription ativa | GET | `/api/v1/billing/subscriptions/active` | Verificar plano |
| Criar subscription | POST | `/api/v1/billing/subscriptions` | Assinar plano |
| Cancelar subscription | DELETE | `/api/v1/billing/subscriptions/:id` | Cancelar |

## Payloads

### Register
```json
{
  "username": "string (obrigatório)",
  "password": "string (obrigatório)",
  "email": "string (obrigatório, válido)"
}
```

### Login
```json
{
  "username": "string (obrigatório)",
  "password": "string (obrigatório)"
}
```

### Criar Billing Account
```json
{
  "email": "string",
  "phone": "string (opcional)"
}
```

### Criar Subscription
```json
{
  "plan_id": "string (ex: pro_monthly)",
  "amount": "number (centavos, ex: 2900 = R$29)",
  "currency": "string (ex: BRL)",
  "interval": "string (month ou year)"
}
```

---

# PARTE 6: PADRÕES DE CÓDIGO

## Feature Gating (Paywall)

```javascript
// PADRÃO CORRETO
function renderFeature() {
  if (window.hasActiveSubscription()) {
    return `<div class="feature">Conteúdo Premium</div>`;
  } else {
    return `
      <div class="paywall">
        <p>Esta feature requer plano Pro</p>
        <a href="#pricing">Ver Planos</a>
      </div>
    `;
  }
}
```

## Proteção de Rotas

```javascript
// PADRÃO CORRETO
function renderRoute(hash, app) {
  // Rotas públicas - qualquer um acessa
  if (hash === '#login') return renderLogin(app);
  if (hash === '#register') return renderRegister(app);
  
  // Rotas protegidas - precisa de token
  if (!window.appState.token) {
    window.location.hash = '#login';
    return;
  }
  
  // Rotas premium - precisa de subscription
  if (hash === '#premium-feature') {
    if (!window.hasActiveSubscription()) {
      window.location.hash = '#pricing';
      return;
    }
    return renderPremiumFeature(app);
  }
}
```

## Tratamento de Erros

```javascript
// PADRÃO CORRETO
try {
  const result = await window.login(username, password);
  if (!result.success) {
    showError(result.error);
  }
} catch (error) {
  showError('Erro de conexão com o servidor');
}
```

---

# PARTE 7: CHECKLIST DE VALIDAÇÃO

## Antes de considerar o app "pronto"

### Auth
- [ ] Registro funciona
- [ ] Registro com username duplicado é barrado
- [ ] Login funciona
- [ ] Login com senha errada falha
- [ ] Logout limpa tudo
- [ ] Refresh da página mantém sessão
- [ ] Rota protegida redireciona sem login

### Billing
- [ ] Billing account é criada automaticamente
- [ ] Subscription pode ser criada
- [ ] Feature premium é bloqueada sem plano
- [ ] Feature premium é liberada com plano

### Geral
- [ ] Nenhum backend próprio
- [ ] Nenhuma tabela de usuários
- [ ] Nenhuma integração direta com Stripe
- [ ] Tudo passa pelo PROST-QS

---

# PARTE 8: ERROS COMUNS (EVITAR)

## ❌ Erro 1: Guardar estado localmente
```javascript
// ERRADO
localStorage.setItem('isPremium', 'true');

// CORRETO
const isPremium = window.hasActiveSubscription();
```

## ❌ Erro 2: Validar auth no app
```javascript
// ERRADO
if (password.length < 6) {
  return 'Senha muito curta';
}

// CORRETO
// Deixa o PROST-QS validar e retornar o erro
```

## ❌ Erro 3: Criar backend "só para uma coisinha"
```javascript
// ERRADO
// "Vou criar uma API só para salvar preferências"

// CORRETO
// Se precisa de persistência, pede para adicionar no PROST-QS
```

## ❌ Erro 4: Hardcodar preços
```javascript
// ERRADO
const price = 29.90;

// CORRETO
// Preço vem do PROST-QS ou é configurável
```

---

# PARTE 9: GLOSSÁRIO

| Termo | Significado |
|-------|-------------|
| PROST-QS | Backend soberano compartilhado |
| SDK | Cliente JavaScript para comunicar com PROST-QS |
| App | Frontend que consome PROST-QS |
| Subscription | Assinatura de plano pago |
| Feature Gating | Bloquear feature por falta de plano |
| Paywall | Tela que pede pagamento |
| Token | JWT de autenticação |
| Billing Account | Conta financeira do usuário |

---

# PARTE 10: REGRA DE OURO

> **Se integrar parecer chato, o erro é do PROST-QS — nunca do app.**

O app pergunta. O PROST-QS responde.
O app não sabe de billing. O PROST-QS sabe.
O app não valida auth. O PROST-QS valida.
O app não decide. O PROST-QS decide.

---

# PARTE 11: CONTRATO FINAL

## Eu, agente de IA, ao criar um app para este ecossistema, JURO:

1. **Nunca** criar backend próprio para auth
2. **Nunca** criar backend próprio para billing
3. **Nunca** integrar diretamente com Stripe ou gateways
4. **Nunca** guardar estado de auth/billing localmente
5. **Sempre** usar o SDK do PROST-QS
6. **Sempre** delegar decisões ao PROST-QS
7. **Sempre** perguntar antes de decidir
8. **Sempre** tratar o app como cliente burro

---

---

# CONTROLE DE VERSÃO

| Versão | Data | Status |
|--------|------|--------|
| v1.0 | 28/12/2024 | **CONGELADA** ✅ |

⚠️ **REGRA DE VERSIONAMENTO:**
- Esta versão (v1.0) é IMUTÁVEL
- Qualquer mudança futura = nova versão (v1.1, v2.0)
- Nunca sobrescrever, sempre evoluir
- Agentes devem referenciar a versão que usam

---

*Manifesto criado em 28/12/2024*
*Versão: 1.0 (CONGELADA)*
*Sistema: PROST-QS Sovereign Kernel*
*Autor: Ecossistema PROST-QS*
