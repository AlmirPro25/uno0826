# @prost-qs/kernel-sdk

SDK oficial para o **Kernel Soberano PROST-QS**.

Oferece acesso a:
- **Identity** - Autenticação soberana via Phone + OTP
- **Billing** - Ledger, PaymentIntents, Subscriptions
- **Ads** - Campanhas, Budgets, Spend tracking
- **Agents** - Governança de agentes autônomos
- **AppClient** - Integração server-to-server via API Keys

## Instalação

```bash
npm install @prost-qs/kernel-sdk
```

Ou use diretamente via import:

```js
import { KernelClient, AppClient } from './sdk/src/index.js';
```

---

## Server-to-Server (API Keys)

Para integração backend-to-backend, use o `AppClient`:

```js
import { AppClient } from '@prost-qs/kernel-sdk';

const app = new AppClient({
  publicKey: 'pq_pk_xxxxxxxxxxxxxxxx',
  secretKey: 'pq_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  baseURL: 'http://localhost:8080/api/v1',
  debug: true
});

// Enviar evento de audit
await app.captureEvent('user.login', 'user_123', {
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

// Métodos de conveniência
await app.trackLogin('user_123', '192.168.1.1', 'Mozilla/5.0...');
await app.trackSignup('user_456', { source: 'landing_page' });
await app.trackPayment('user_123', 'pay_789', 'completed', { amount: 5000 });
await app.trackAdminAction('admin_1', 'ban_user', 'user_bad', 'user');
await app.trackSecurityEvent('suspicious', 'user_123', '1.2.3.4');

// Listar eventos
const events = await app.listEvents(100);
```

---

## Quick Start (User Auth)

```js
import { KernelClient } from '@prost-qs/kernel-sdk';

// Criar cliente
const kernel = new KernelClient({
  baseURL: 'http://localhost:8080/api/v1',
  debug: true
});

// Login via Phone + OTP
const login = await kernel.auth.login('+5511999999999');
console.log('OTP (dev mode):', login.devOTP);

// Verificar código
await login.verify('123456');

// Agora está autenticado
console.log('Autenticado:', kernel.isAuthenticated());

// Buscar identidade
const me = await kernel.identity.me();
console.log('User ID:', me.user_id);

// Criar conta de billing
await kernel.billing.createAccount('email@example.com', '+5511999999999');

// Ver saldo
const ledger = await kernel.billing.getLedger();
console.log('Saldo:', ledger.balance);
```

## Módulos

### Auth

```js
// Solicitar OTP
await kernel.auth.requestOTP('+5511999999999', 'sms');

// Verificar OTP
const result = await kernel.auth.verifyOTP('123456');
// Token é salvo automaticamente

// Logout
kernel.auth.logout();

// Verificar se está autenticado
kernel.auth.isAuthenticated();
```

### Identity

```js
// Buscar identidade do usuário autenticado
const me = await kernel.identity.me();

// Verificar se token é válido
const isValid = await kernel.identity.verifyToken();
```

### Billing

```js
// Conta
const account = await kernel.billing.getAccount();
await kernel.billing.createAccount('email@example.com', '+55...');

// Ledger
const ledger = await kernel.billing.getLedger();
const balance = await kernel.billing.getBalance();

// Payment Intents
await kernel.billing.createPaymentIntent(1000, 'brl', 'Descrição');
const intents = await kernel.billing.listPaymentIntents();

// Subscriptions
await kernel.billing.createSubscription('plan_pro', 2990, 'brl', 'month');
const sub = await kernel.billing.getActiveSubscription();
await kernel.billing.cancelSubscription(sub.id);

// Payouts
await kernel.billing.requestPayout(5000, 'brl', 'bank_account_id');
```

### Ads

```js
// Conta
await kernel.ads.createAccount();
const account = await kernel.ads.getAccount();

// Budgets
await kernel.ads.createBudget('daily', 10000);
const budgets = await kernel.ads.listBudgets();

// Campaigns
await kernel.ads.createCampaign('Minha Campanha', budgetId, 100);
const campaigns = await kernel.ads.listCampaigns();
await kernel.ads.pauseCampaign(campaignId);
await kernel.ads.resumeCampaign(campaignId);

// Spend
await kernel.ads.recordSpend(campaignId, 50, 'impression');
```

### Agents

```js
// Criar agente
const agent = await kernel.agents.createAgent('Bot de Ads', 'Gerencia campanhas', 'operator');

// Criar política
await kernel.agents.createPolicy(
  agent.id,
  'ads',
  ['pause_campaign', 'resume_campaign'],
  10000, // max R$100
  true   // requer aprovação
);

// Propor decisão
await kernel.agents.proposeDecision(
  agent.id,
  'ads',
  'pause_campaign',
  `campaign:${campaignId}`,
  { reason: 'Budget baixo' },
  'Budget abaixo de 10%',
  0
);

// Listar decisões pendentes
const pending = await kernel.agents.listPendingDecisions();

// Aprovar/Rejeitar
await kernel.agents.approveDecision(decisionId, 'Aprovado pelo admin');
await kernel.agents.rejectDecision(decisionId, 'Risco muito alto');

// Logs de execução
const logs = await kernel.agents.getExecutionLogs();
```

## Tratamento de Erros

```js
import { KernelError } from '@prost-qs/kernel-sdk';

try {
  await kernel.billing.getAccount();
} catch (err) {
  if (err instanceof KernelError) {
    console.log('Código:', err.code);
    console.log('Status:', err.status);
    console.log('Mensagem:', err.message);
    
    if (err.code === 'AUTH_EXPIRED') {
      // Token expirou, redirecionar para login
    }
  }
}
```

## Configuração Avançada

```js
const kernel = new KernelClient({
  baseURL: 'https://api.seudominio.com/api/v1',
  token: 'jwt_salvo_anteriormente',
  debug: true,
  onTokenExpired: () => {
    // Redirecionar para login
    window.location.href = '/login';
  }
});
```

## Uso em Node.js

```js
// Requer node-fetch ou similar
import fetch from 'node-fetch';
globalThis.fetch = fetch;

import { KernelClient } from '@prost-qs/kernel-sdk';
// ... uso normal
```

## License

MIT
