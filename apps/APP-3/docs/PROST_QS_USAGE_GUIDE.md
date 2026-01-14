# 👑 PROST-QS USAGE GUIDE - GUIA PRÁTICO

## 🎯 OBJETIVO

Este guia mostra como usar o PROST-QS Sovereign Kernel para gerar apps com autenticação e pagamento reais.

---

## 📚 ÍNDICE

1. [Conceitos Fundamentais](#conceitos-fundamentais)
2. [Uso Básico](#uso-básico)
3. [Uso Avançado](#uso-avançado)
4. [Troubleshooting](#troubleshooting)
5. [Exemplos Práticos](#exemplos-práticos)

---

## 🧠 Conceitos Fundamentais

### O que é PROST-QS?

PROST-QS é o **Kernel Soberano** que governa:
- 🔐 **Autenticação** (login, registro, sessão)
- 💳 **Pagamentos** (billing, subscriptions, planos)
- 🎯 **Feature Gating** (controle de acesso por plano)

### Regra de Ouro

> **"O app PERGUNTA. O PROST-QS RESPONDE."**

Seu app **NUNCA** implementa auth/billing localmente. Sempre delega ao PROST-QS.

### Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    SEU APP (Cliente)                    │
│  - UI/UX                                                │
│  - Lógica de negócio                                    │
│  - Feature gating                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     │
┌────────────────────▼────────────────────────────────────┐
│         PROST-QS SOVEREIGN KERNEL (Servidor)           │
│  - Autenticação (JWT, OAuth, etc)                      │
│  - Pagamentos (Stripe, etc)                            │
│  - Subscriptions                                        │
│  - Planos                                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Uso Básico

### Cenário 1: App com Login

**Prompt:**
```
Crie um app com login
```

**O que acontece:**
1. ✅ PROST-QS é detectado automaticamente
2. ✅ Manifesto é injetado no prompt
3. ✅ Código é gerado com SDK real
4. ✅ Auditoria valida conformidade

**Código gerado:**
```javascript
import { ProstQSClient } from './prost-qs-sdk.js';

export function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  const handleLogin = async () => {
    try {
      // ✅ CORRETO: Usar SDK real
      const response = await window.prostqs.post('/api/v1/auth/login', {
        email,
        password
      });
      
      // Redirecionar para dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      // ✅ CORRETO: Tratar erro de kernel offline
      if (error.message.includes('offline')) {
        alert('Kernel offline - tente novamente');
      } else {
        alert('Email ou senha incorretos');
      }
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Cenário 2: App com Pagamento

**Prompt:**
```
Crie um app com pagamento
```

**Código gerado:**
```javascript
import { ProstQSClient } from './prost-qs-sdk.js';

export function PricingPage() {
  const [hasSubscription, setHasSubscription] = React.useState(false);
  
  React.useEffect(() => {
    // ✅ CORRETO: Verificar subscription via SDK
    window.prostqs.get('/api/v1/billing/subscriptions/active')
      .then(sub => setHasSubscription(sub.status === 'active'))
      .catch(() => setHasSubscription(false)); // Kernel offline
  }, []);
  
  const handleUpgrade = async () => {
    try {
      // ✅ CORRETO: Criar subscription via SDK
      await window.prostqs.post('/api/v1/billing/subscriptions', {
        planId: 'pro',
        paymentMethod: 'card'
      });
      
      // Recarregar status
      const sub = await window.prostqs.get('/api/v1/billing/subscriptions/active');
      setHasSubscription(sub.status === 'active');
    } catch (error) {
      alert('Erro ao processar pagamento');
    }
  };
  
  return (
    <div>
      {hasSubscription ? (
        <div>✅ Você é PRO</div>
      ) : (
        <button onClick={handleUpgrade}>Upgrade para PRO</button>
      )}
    </div>
  );
}
```

### Cenário 3: Feature Gating

**Prompt:**
```
Crie um app com feature gating
```

**Código gerado:**
```javascript
export function Dashboard() {
  const [hasSubscription, setHasSubscription] = React.useState(false);
  
  React.useEffect(() => {
    // ✅ CORRETO: Perguntar ao PROST-QS
    window.prostqs.get('/api/v1/billing/subscriptions/active')
      .then(sub => setHasSubscription(sub.status === 'active'))
      .catch(() => setHasSubscription(false));
  }, []);
  
  return (
    <div>
      <FreeFeature />
      
      {hasSubscription ? (
        <PremiumFeature />
      ) : (
        <Paywall />
      )}
    </div>
  );
}
```

---

## 🔥 Uso Avançado

### Opção 1: Força Explícita (forceProstQS)

**Quando usar**: Você quer garantir que PROST-QS seja usado mesmo sem keywords.

**Código:**
```typescript
const result = await auroraBuilder.build({
  userPrompt: 'Crie um app simples',
  forceProstQS: true // 🔥 FORÇA PROST-QS
});
```

**Resultado:**
- PROST-QS será injetado no prompt
- Contexto do manifesto será adicionado
- Código será auditado

### Opção 2: Modo Mandatório (prostQSRequired)

**Quando usar**: Você quer REJEITAR código que não use PROST-QS.

**Código:**
```typescript
const result = await auroraBuilder.build({
  userPrompt: 'Crie um app com login',
  prostQSRequired: true // 🔥 REJEITA se não usar
});
```

**Resultado:**
- Se código usar localStorage para auth → ❌ REJEITADO
- Se código usar decisão local de plano → ❌ REJEITADO
- Se código usar SDK real → ✅ APROVADO

**Erro se violações:**
```
Error: PROST-QS Compliance Failed: 2 critical violations.
First: Estado de auth/billing armazenado em localStorage
```

### Opção 3: Permitir Auth Local (allowLocalAuth)

**Quando usar**: Você quer permitir implementação local de auth (não recomendado).

**Código:**
```typescript
const result = await auroraBuilder.build({
  userPrompt: 'Crie um app com login',
  allowLocalAuth: true // Permite auth local
});
```

**Resultado:**
- Auditing será mais permissivo
- Violações não serão críticas
- Código será aprovado mesmo com localStorage

### Opção 4: Combinações

**Força + Mandatório:**
```typescript
const result = await auroraBuilder.build({
  userPrompt: 'Crie um app',
  forceProstQS: true,
  prostQSRequired: true
});
```

**Resultado:**
- PROST-QS será injetado
- Código será rejeitado se não usar SDK real
- Garantia máxima de conformidade

---

## 🧪 Troubleshooting

### Problema 1: "PROST-QS não foi detectado"

**Solução:**
```typescript
// Use forceProstQS
const result = await auroraBuilder.build({
  userPrompt: 'Crie um app',
  forceProstQS: true
});
```

### Problema 2: "Código foi rejeitado por violações"

**Solução:**
1. Verificar `result.prostQSAudit.violations`
2. Ler a mensagem de erro
3. Seguir o `fix` sugerido

**Exemplo:**
```json
{
  "violations": [
    {
      "code": "PROST-001",
      "message": "Estado de auth/billing armazenado em localStorage",
      "fix": "Usar SDK PROST-QS: window.prostqs.get(\"/api/v1/identity/me\")"
    }
  ]
}
```

### Problema 3: "Quero permitir auth local"

**Solução:**
```typescript
const result = await auroraBuilder.build({
  userPrompt: 'Crie um app com login',
  allowLocalAuth: true
});
```

---

## 💡 Exemplos Práticos

### Exemplo 1: App SaaS Completo

**Prompt:**
```
Crie um app SaaS com:
- Login e registro
- Dashboard
- Planos (Free, Pro, Enterprise)
- Pagamento com Stripe
- Feature gating por plano
```

**Resultado:**
```
✅ PROST-QS detectado automaticamente
✅ Manifesto injetado
✅ Código gerado com SDK real
✅ Auditoria passou (100/100)
```

### Exemplo 2: App com Força Explícita

**Prompt:**
```
Crie um app de TODO list
```

**Código:**
```typescript
const result = await auroraBuilder.build({
  userPrompt: 'Crie um app de TODO list',
  forceProstQS: true // Força PROST-QS mesmo sem keywords
});
```

**Resultado:**
```
✅ PROST-QS injetado (forceProstQS=true)
✅ Manifesto adicionado ao contexto
✅ Código gerado com autenticação real
✅ Auditoria passou
```

### Exemplo 3: App com Modo Mandatório

**Prompt:**
```
Crie um app com login
```

**Código:**
```typescript
const result = await auroraBuilder.build({
  userPrompt: 'Crie um app com login',
  prostQSRequired: true // Rejeita se não usar PROST-QS
});
```

**Resultado:**
```
✅ PROST-QS detectado
✅ Código gerado
✅ Auditoria validou conformidade
✅ Nenhuma violação crítica
✅ Aprovado para produção
```

---

## 📊 Checklist de Conformidade

Antes de usar seu app em produção, verifique:

- [ ] ✅ Código usa `import { ProstQSClient } from './prost-qs-sdk.js'`
- [ ] ✅ Código inicializa `window.prostqs = new ProstQSClient(...)`
- [ ] ✅ Código chama endpoints reais (`/api/v1/auth/login`, etc)
- [ ] ✅ Código usa `window.hasActiveSubscription()` para feature gating
- [ ] ✅ Código trata erro de kernel offline
- [ ] ✅ Código bloqueia features premium se kernel offline
- [ ] ✅ Nenhum `localStorage.setItem('isPro', ...)` ou similar
- [ ] ✅ Nenhuma decisão local de plano (`if (isPro)`)
- [ ] ✅ Nenhuma integração direta com Stripe
- [ ] ✅ Auditoria passou com score 100/100

---

## 🎓 Boas Práticas

### ✅ FAÇA

```javascript
// ✅ Usar SDK real
const user = await window.prostqs.get('/api/v1/identity/me');

// ✅ Tratar erro de kernel offline
try {
  const sub = await window.prostqs.get('/api/v1/billing/subscriptions/active');
} catch (error) {
  // Bloquear acesso
  disablePremiumFeatures();
}

// ✅ Feature gating via SDK
if (window.hasActiveSubscription()) {
  showPremiumFeature();
}
```

### ❌ NÃO FAÇA

```javascript
// ❌ Usar localStorage para auth
localStorage.setItem('isPro', 'true');

// ❌ Decisão local de plano
if (isPro) { showPremiumFeature(); }

// ❌ Integração direta com Stripe
import Stripe from 'stripe';

// ❌ Mock de PROST-QS
const PROST_QS = { fake: true };

// ❌ Assumir acesso quando offline
catch (error) {
  showPremiumFeature(); // NUNCA!
}
```

---

## 📞 SUPORTE

### Documentação

- 📖 [PROST-QS Manifest](../services/manifestos/PROST_QS_SOVEREIGN_KERNEL_MANIFEST.ts)
- 🔍 [PROST-QS Auditor](../services/ProstQSAuditor.ts)
- 📋 [Status Fase 1+2](./PROST_QS_PHASE1_PHASE2_STATUS.md)

### Endpoints PROST-QS

| Ação | Método | Endpoint |
|------|--------|----------|
| Registrar | POST | `/api/v1/auth/register` |
| Login | POST | `/api/v1/auth/login` |
| Dados do usuário | GET | `/api/v1/identity/me` |
| Criar billing account | POST | `/api/v1/billing/account` |
| Subscription ativa | GET | `/api/v1/billing/subscriptions/active` |
| Criar subscription | POST | `/api/v1/billing/subscriptions` |

---

## ✨ CONCLUSÃO

Com PROST-QS você:
- ✅ Não reimplementa auth/billing
- ✅ Garante conformidade com manifesto
- ✅ Recebe código auditado
- ✅ Tem controle fino via flags
- ✅ Pode focar no seu negócio

**Próximo passo**: Gerar seu primeiro app com PROST-QS!

---

**Versão**: 1.0
**Data**: 28 de Dezembro de 2025
**Status**: ✅ PRONTO PARA USO
