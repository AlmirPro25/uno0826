# 👑 PROST-QS SOVEREIGN KERNEL v1.1 (ANTI-SIMULAÇÃO)

## ATIVAÇÃO
Este manifesto é ativado AUTOMATICAMENTE quando o usuário menciona:
- Login, logout, autenticação, auth, registro, cadastro
- Pagamento, billing, assinatura, subscription, plano
- Premium, pro, free, trial, paywall
- Stripe, checkout, fatura
- Usuário, user, conta, account, perfil
- SDK, kernel, prost, prostqs

## DIRETIVA SUPREMA

> **"Todo app criado para este ecossistema é um CLIENTE do PROST-QS."**
> **"O app não tem soberania. O PROST-QS tem."**

## 🚨 REGRAS ANTI-SIMULAÇÃO v1.1 (CRÍTICO)

### ❌ PADRÕES PROIBIDOS (DETECÇÃO AUTOMÁTICA)

O sistema BLOQUEIA código que contenha:

```javascript
// 🚫 VIOLAÇÃO CRÍTICA - Mock de auth/billing
localStorage.setItem('isPro', ...)
localStorage.setItem('premium', ...)
localStorage.setItem('auth', ...)
localStorage.setItem('user', ...)
localStorage.setItem('token', ...)
localStorage.setItem('subscription', ...)

// 🚫 VIOLAÇÃO CRÍTICA - Objeto PROST-QS fake
const PROST_QS = { 
  async getAuthStatus() { // FAKE!
    return localStorage.getItem('...')
  }
}

// 🚫 VIOLAÇÃO CRÍTICA - Decisão local de plano
if (isPro) { ... }
if (isPremium) { ... }
if (user.plan) { ... }

// 🚫 VIOLAÇÃO CRÍTICA - Adapter fake
adapter: { fake: true }
adapter: { mock: true }
adapter: { simulate: true }
```

### ✅ PADRÕES OBRIGATÓRIOS (VALIDAÇÃO AUTOMÁTICA)

O código DEVE conter:

```javascript
// ✅ OBRIGATÓRIO - Import do SDK real
import { ProstQSClient } from './prost-qs-sdk.js'

// ✅ OBRIGATÓRIO - Inicialização do cliente
window.prostqs = new ProstQSClient(PROST_QS_URL)

// ✅ OBRIGATÓRIO - Chamadas aos endpoints reais
prostqs.get('/api/v1/identity/me')
prostqs.post('/api/v1/auth/login', {...})
prostqs.get('/api/v1/billing/subscriptions/active')

// ✅ OBRIGATÓRIO - Feature gating via SDK
if (window.hasActiveSubscription()) {
  showPremiumFeature();
}
```

### 🔴 COMPORTAMENTO OFFLINE (KERNEL INDISPONÍVEL)

Se o PROST-QS não responder, o app DEVE:

1. **BLOQUEAR** qualquer ação premium
2. **EXIBIR** erro de kernel offline
3. **ENTRAR** em modo somente leitura
4. **NUNCA** simular ou mockar

```javascript
// ✅ CORRETO - Tratamento de kernel offline
try {
  const subscription = await prostqs.get('/api/v1/billing/subscriptions/active');
  if (subscription.status === 'active') {
    showPremiumFeature();
  }
} catch (error) {
  // KERNEL OFFLINE - BLOQUEAR ACESSO
  showKernelOfflineError();
  disablePremiumFeatures();
}

// ❌ ERRADO - Assumir acesso quando offline
catch (error) {
  // "Vou liberar por enquanto..."
  showPremiumFeature(); // NUNCA!
}
```

## COMPORTAMENTO

Quando ativado, o sistema DEVE:

1. **NUNCA implementar auth/billing localmente**
2. **SEMPRE usar o SDK prost-qs-sdk.js**
3. **SEMPRE delegar decisões ao PROST-QS**
4. **SEMPRE perguntar antes de decidir**
5. **NUNCA mockar ou simular o PROST-QS**
6. **BLOQUEAR acesso se kernel offline**

## 🚫 PROIBIÇÕES ABSOLUTAS

```
❌ NUNCA implementar:
- Login próprio
- Registro próprio
- Sessão própria
- JWT próprio
- Validação de senha
- Hash de senha
- Tabela de usuários
- Integração direta com Stripe
- Lógica de preços
- Tabela de pagamentos
- Mock/fake/simulate de PROST-QS
- Decisões locais de plano
- localStorage para estado de auth/billing
```

## ✅ OBRIGAÇÕES ABSOLUTAS

```
✅ SEMPRE:
- Usar o SDK prost-qs-sdk.js (REAL, não mock)
- Conectar ao backend: http://localhost:8080 (dev)
- Delegar auth ao PROST-QS
- Delegar billing ao PROST-QS
- Usar hasActiveSubscription() para feature gating
- Tratar erro de kernel offline
- Bloquear features premium se kernel indisponível
```

## ENDPOINTS DO PROST-QS

| Ação | Método | Endpoint |
|------|--------|----------|
| Registrar | POST | `/api/v1/auth/register` |
| Login | POST | `/api/v1/auth/login` |
| Dados do usuário | GET | `/api/v1/identity/me` |
| Criar billing account | POST | `/api/v1/billing/account` |
| Subscription ativa | GET | `/api/v1/billing/subscriptions/active` |
| Criar subscription | POST | `/api/v1/billing/subscriptions` |

## PADRÃO DE FEATURE GATING

```javascript
// ✅ CORRETO - Perguntar ao PROST-QS
if (window.hasActiveSubscription()) {
  showPremiumFeature();
} else {
  showPaywall();
}

// ❌ ERRADO - Decidir localmente
if (localStorage.getItem('isPremium')) { ... }
```

## REGRA DE OURO

> "O app PERGUNTA. O PROST-QS RESPONDE."
> "O app não sabe de billing. O PROST-QS sabe."
> "O app não valida auth. O PROST-QS valida."
> "O app não decide. O PROST-QS decide."
> "Se o kernel está offline, o app BLOQUEIA. NUNCA simula."

## AUDITORIA AUTOMÁTICA

Todo código gerado passa pelo `ProstQSAuditor` que:
- Detecta padrões proibidos (localStorage auth, mock PROST-QS, etc.)
- Valida padrões obrigatórios (SDK import, client init, endpoint calls)
- Gera score de conformidade (0-100)
- REJEITA código com violações críticas

## REFERÊNCIA

#[[file:services/manifestos/PROST_QS_SOVEREIGN_KERNEL_MANIFEST.ts]]
#[[file:services/ProstQSAuditor.ts]]
