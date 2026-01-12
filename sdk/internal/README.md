# PROST-QS Internal SDK

> SDK interno para apps satélites (VOX, SCE). Será publicado como `@prost-qs/sdk` quando maduro.

## Uso

```typescript
import { ProstQSClient, IdentitySDK, TelemetrySDK, BillingSDK } from '@/sdk/internal';

// Configurar cliente
const client = new ProstQSClient({
  apiUrl: 'https://uno0826.onrender.com/api/v1',
  appId: 'seu-app-id',
});

// Identity
const identity = new IdentitySDK(client);
await identity.login('user@example.com', 'password');
const user = await identity.me();

// Telemetry
const telemetry = new TelemetrySDK(client);
telemetry.identify(user.id);
await telemetry.startSession();
telemetry.track('page.view', { page: '/dashboard' });

// Billing
const billing = new BillingSDK(client);
const subscription = await billing.getSubscription();
const hasFeature = await billing.hasCapability('webhooks');
```

## Módulos

### Identity
- `register(email, password, name?)` - Criar conta
- `login(email, password)` - Login
- `implicitLogin(kernelToken)` - Login via SSO
- `logout()` - Logout
- `me()` - Usuário atual
- `refresh(refreshToken)` - Renovar token
- `linkApp(targetAppId)` - Vincular a outro app
- `linkedApps()` - Listar apps vinculados

### Telemetry
- `identify(userId)` - Identificar usuário
- `startSession(deviceId?)` - Iniciar sessão
- `ping(currentFeature?)` - Heartbeat
- `endSession()` - Encerrar sessão
- `track(type, properties?, context?)` - Rastrear evento
- `flush()` - Enviar eventos pendentes

### Billing
- `getSubscription()` - Subscription atual
- `createCheckout(priceId, successUrl, cancelUrl)` - Criar checkout
- `createPortalSession(returnUrl)` - Portal do cliente
- `cancelSubscription()` - Cancelar
- `reactivateSubscription()` - Reativar
- `getPlans()` - Listar planos
- `hasCapability(capability)` - Verificar capability
- `getCapabilities()` - Listar capabilities

## Tratamento de Erros

```typescript
import { ProstQSError } from '@/sdk/internal';

try {
  await identity.login(email, password);
} catch (error) {
  if (error instanceof ProstQSError) {
    if (error.isValidation()) {
      // Dados inválidos
    } else if (error.isBusiness()) {
      // Regra de negócio (ex: conta não existe)
    } else if (error.isSecurity()) {
      // Problema de segurança (ex: senha errada)
    } else if (error.isSystem()) {
      // Erro interno do servidor
    }
  }
}
```

## Roadmap

- [ ] Publicar como `@prost-qs/sdk` no npm
- [ ] Adicionar SDK Python
- [ ] Adicionar SDK Go
- [ ] Documentação pública
