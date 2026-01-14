# 👑 PROST-QS SOVEREIGN KERNEL - INTEGRAÇÃO COMPLETA

## Resumo Executivo

O **PROST-QS** foi integrado como **Kernel Soberano** do ecossistema Aurora Build. Agora, todo app gerado que mencione auth, billing ou planos automaticamente:

1. **Delega** autenticação ao PROST-QS
2. **Delega** pagamentos ao PROST-QS
3. **Usa** o SDK `prost-qs-sdk.js`
4. **Nunca** implementa auth/billing localmente

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    ECOSSISTEMA AURORA BUILD                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   📝 Prompt do Usuário                                         │
│        │                                                        │
│        ▼                                                        │
│   🔍 Detecção Automática (shouldUseProstQS)                    │
│        │                                                        │
│        │ Detecta keywords: login, pagamento, premium, etc.     │
│        │                                                        │
│        ▼                                                        │
│   👑 PROST-QS SOVEREIGN KERNEL                                 │
│        │                                                        │
│        │ Injeta contexto no prompt do LLM                      │
│        │ - Proibições absolutas                                │
│        │ - Obrigações absolutas                                │
│        │ - SDK obrigatório                                     │
│        │ - Endpoints do PROST-QS                               │
│        │                                                        │
│        ▼                                                        │
│   🌟 Aurora Builder                                            │
│        │                                                        │
│        │ Gera código que:                                      │
│        │ - USA o SDK prost-qs-sdk.js                           │
│        │ - DELEGA auth ao PROST-QS                             │
│        │ - DELEGA billing ao PROST-QS                          │
│        │ - NUNCA implementa auth/billing local                 │
│        │                                                        │
│        ▼                                                        │
│   📦 App Gerado (Cliente do PROST-QS)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROST-QS BACKEND                             │
│                    (Kernel Soberano)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   🔐 Auth Service                                              │
│      POST /api/v1/auth/register                                │
│      POST /api/v1/auth/login                                   │
│      GET  /api/v1/identity/me                                  │
│                                                                 │
│   💰 Billing Service                                           │
│      POST /api/v1/billing/account                              │
│      GET  /api/v1/billing/account                              │
│      GET  /api/v1/billing/subscriptions/active                 │
│      POST /api/v1/billing/subscriptions                        │
│      DELETE /api/v1/billing/subscriptions/:id                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Arquivos Criados/Modificados

| Arquivo | Descrição |
|---------|-----------|
| `services/manifestos/PROST_QS_SOVEREIGN_KERNEL_MANIFEST.ts` | Manifesto completo com SDK, templates e regras |
| `services/AlexandriaManifestBridge.ts` | Import e registro no catálogo de manifestos |
| `aurora-build/core/AuroraBuilder.ts` | Detecção automática e injeção de contexto |
| `.kiro/steering/prost-qs-sovereign-kernel.md` | Steering file para ativação automática |
| `tests/test-prost-qs-integration.cjs` | Testes de integração |

## Como Funciona

### 1. Detecção Automática

Quando o usuário envia um prompt como:
- "criar app com login"
- "sistema de pagamentos"
- "dashboard com autenticação"
- "app com plano premium"

O sistema detecta automaticamente e ativa o PROST-QS.

### 2. Injeção de Contexto

O contexto do PROST-QS é injetado no prompt do LLM, incluindo:
- Proibições absolutas (nunca implementar auth/billing local)
- Obrigações absolutas (sempre usar SDK)
- Endpoints disponíveis
- Padrões de código

### 3. Geração de Código

O LLM gera código que:
- Importa e usa o SDK `prost-qs-sdk.js`
- Conecta ao backend PROST-QS
- Delega todas as decisões de auth/billing
- Usa `hasActiveSubscription()` para feature gating

## Exemplo de App Gerado

```javascript
// src/main.js - Gerado automaticamente pelo Aurora Build

import { ProstQSClient } from './prost-qs-sdk.js';

// Conectar ao PROST-QS
const PROST_QS_URL = 'http://localhost:8080';
window.prostqs = new ProstQSClient(PROST_QS_URL);

// Login - DELEGA ao PROST-QS
window.login = async function(username, password) {
  const response = await window.prostqs.post('/api/v1/auth/login', { 
    username, 
    password 
  });
  // ...
};

// Feature Gating - PERGUNTA ao PROST-QS
if (window.hasActiveSubscription()) {
  showPremiumFeature();
} else {
  showPaywall();
}
```

## Regra de Ouro

> "O app PERGUNTA. O PROST-QS RESPONDE."
> "O app não sabe de billing. O PROST-QS sabe."
> "O app não valida auth. O PROST-QS valida."
> "O app não decide. O PROST-QS decide."

## Benefícios

1. **Consistência**: Todos os apps usam o mesmo sistema de auth/billing
2. **Segurança**: Auth/billing centralizado e auditável
3. **Velocidade**: Não precisa reimplementar auth/billing em cada app
4. **Manutenção**: Atualizar auth/billing em um lugar atualiza todos os apps
5. **Foco**: O sistema foca nos 80% (lógica de negócio), não nos 20% difíceis

## Versão

- **Versão**: 1.0 (CONGELADA)
- **Data**: 28/12/2024
- **Status**: Produção
