# PROST-QS — Arquitetura de Identidade Multi-App
**Data:** 10 de Janeiro de 2026  
**Versão:** 2.0 — MODELO REFINADO (Tech Lead Approved)

---

## 🎯 PRINCÍPIO FUNDAMENTAL

> **"Usuário ≠ Conta de App"**
> **"Login unificado sem consentimento explícito é só um bug elegante."**

O PROST-QS funciona como um **Hub Central de Identidade**, onde:
- **User** é único no PROST-QS
- **UserOrigin** é a "certidão de nascimento" (imutável)
- **AppMembership** é o vínculo explícito com cada app
- **Nenhum acesso é automático** — requer confirmação

---

## 📊 MODELO DE DADOS

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              MODELO DE IDENTIDADE MULTI-APP                             │
│                              "Usuário ≠ Conta de App"                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                                    PROST-QS                                         │
  │                                                                                     │
  │  ┌─────────────────────────────────────────────────────────────────────────────┐   │
  │  │                              User (global)                                   │   │
  │  │                                                                              │   │
  │  │  id: UUID (PK)                                                               │   │
  │  │  email: string (unique)                                                      │   │
  │  │  password_hash: string                                                       │   │
  │  │  role: string (user | admin | super_admin)                                   │   │
  │  │  status: string (active | suspended | banned)                                │   │
  │  │  created_at: timestamp                                                       │   │
  │  │                                                                              │   │
  │  │  👉 Existe UMA VEZ SÓ no PROST-QS                                            │   │
  │  │                                                                              │   │
  │  └──────────────────────────────────┬───────────────────────────────────────────┘   │
  │                                     │                                               │
  │                    ┌────────────────┴────────────────┐                              │
  │                    │                                 │                              │
  │                    ▼ 1:1                             ▼ 1:N                          │
  │  ┌─────────────────────────────────┐  ┌─────────────────────────────────────────┐  │
  │  │         UserOrigin              │  │           AppMembership                 │  │
  │  │     "Certidão de Nascimento"    │  │        "Vínculo Explícito"              │  │
  │  │                                 │  │                                         │  │
  │  │  id: UUID (PK)                  │  │  id: UUID (PK)                          │  │
  │  │  user_id: UUID (unique)         │  │  user_id: UUID                          │  │
  │  │  app_id: UUID ◄── ONDE NASCEU   │  │  app_id: UUID                           │  │
  │  │  created_at: timestamp          │  │  role: string (user | admin | owner)    │  │
  │  │                                 │  │  status: string (pending | active |     │  │
  │  │  👉 NUNCA MUDA                  │  │           suspended | revoked)          │  │
  │  │                                 │  │  linked_at: timestamp                   │  │
  │  │                                 │  │  last_access_at: timestamp              │  │
  │  │                                 │  │                                         │  │
  │  │                                 │  │  👉 UM POR APP                          │  │
  │  │                                 │  │  👉 NENHUM É AUTOMÁTICO                 │  │
  │  │                                 │  │                                         │  │
  │  │                                 │  │  UNIQUE(user_id, app_id)                │  │
  │  └─────────────────────────────────┘  └─────────────────────────────────────────┘  │
  │                                                                                     │
  └─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUXOS DE AUTENTICAÇÃO

### Fluxo 1: Primeiro Acesso (Criação de Conta)

```
  Usuário                    App (VOX-BRIDGE)                 PROST-QS
  ┌─────┐                    ┌───────────────┐                ┌─────────┐
  │     │ ── Acessa App ───► │               │                │         │
  │     │                    │               │                │         │
  │     │                    │ ── POST ────────────────────► │         │
  │     │                    │    /identity/register          │         │
  │     │                    │    {                           │         │
  │     │                    │      email, password,          │         │
  │     │                    │      name,                     │         │
  │     │                    │      origin_app_id: APP-1      │ Cria:   │
  │     │                    │    }                           │ • GlobalUser
  │     │                    │                                │ • AppUserLink
  │     │                    │ ◄── JWT + user_id ───────────  │ • BillingAccount
  │     │                    │                                │         │
  │     │ ◄── Logado ──────  │               │                │         │
  │     │                    │               │                │         │
  └─────┘                    └───────────────┘                └─────────┘

  RESULTADO:
  ┌────────────────────────────────────────────────────────────────────┐
  │ GlobalUser                                                         │
  │   id: user-123                                                     │
  │   email: joao@email.com                                            │
  │   origin_app_id: c573e4f0... (VOX-BRIDGE)  ◄── ORIGEM REGISTRADA   │
  │                                                                    │
  │ AppUserLink                                                        │
  │   user_id: user-123                                                │
  │   app_id: c573e4f0... (VOX-BRIDGE)                                 │
  │   status: active                                                   │
  │   linked_at: 2026-01-10                                            │
  │                                                                    │
  │ BillingAccount                                                     │
  │   user_id: user-123                                                │
  │   balance: 0                                                       │
  └────────────────────────────────────────────────────────────────────┘
```

### Fluxo 2: Acesso a Segundo App (Link)

```
  Usuário                    App (SCE)                        PROST-QS
  ┌─────┐                    ┌───────────────┐                ┌─────────┐
  │     │ ── Acessa SCE ───► │               │                │         │
  │     │    (com JWT)       │               │                │         │
  │     │                    │ ── GET ─────────────────────► │         │
  │     │                    │    /identity/me                │         │
  │     │                    │    Authorization: Bearer JWT   │         │
  │     │                    │                                │         │
  │     │                    │ ◄── user + apps[] ───────────  │ Verifica│
  │     │                    │                                │ JWT     │
  │     │                    │                                │         │
  │     │                    │ Detecta: user NÃO tem          │         │
  │     │                    │ link com SCE (APP-2)           │         │
  │     │                    │                                │         │
  │     │ ◄── Tela de ─────  │               │                │         │
  │     │    Confirmação     │               │                │         │
  │     │                    │               │                │         │
  │     │ ── Confirma ─────► │               │                │         │
  │     │                    │ ── POST ────────────────────► │         │
  │     │                    │    /identity/link-app          │ Cria:   │
  │     │                    │    {                           │ • AppUserLink
  │     │                    │      app_id: APP-2 (SCE)       │   para SCE
  │     │                    │    }                           │         │
  │     │                    │                                │         │
  │     │                    │ ◄── success + new JWT ───────  │         │
  │     │                    │    (com app_ids: [APP-1, APP-2])        │
  │     │                    │                                │         │
  │     │ ◄── Acesso ──────  │               │                │         │
  │     │    Liberado        │               │                │         │
  └─────┘                    └───────────────┘                └─────────┘

  RESULTADO:
  ┌────────────────────────────────────────────────────────────────────┐
  │ GlobalUser                                                         │
  │   id: user-123                                                     │
  │   origin_app_id: c573e4f0... (VOX-BRIDGE)  ◄── ORIGEM MANTIDA      │
  │                                                                    │
  │ AppUserLink (VOX-BRIDGE)                                           │
  │   user_id: user-123                                                │
  │   app_id: c573e4f0... (VOX-BRIDGE)                                 │
  │   linked_at: 2026-01-10                                            │
  │                                                                    │
  │ AppUserLink (SCE) ◄── NOVO LINK                                    │
  │   user_id: user-123                                                │
  │   app_id: 011c6e88... (SCE)                                        │
  │   linked_at: 2026-01-10                                            │
  │                                                                    │
  │ BillingAccount (MESMA)                                             │
  │   user_id: user-123                                                │
  └────────────────────────────────────────────────────────────────────┘
```

### Fluxo 3: Login em App Diferente da Origem

```
  Usuário                    App (SCE)                        PROST-QS
  ┌─────┐                    ┌───────────────┐                ┌─────────┐
  │     │ ── Login SCE ────► │               │                │         │
  │     │    email/password  │               │                │         │
  │     │                    │ ── POST ────────────────────► │         │
  │     │                    │    /identity/login             │         │
  │     │                    │    {                           │         │
  │     │                    │      email, password,          │         │
  │     │                    │      requesting_app_id: SCE    │         │
  │     │                    │    }                           │         │
  │     │                    │                                │         │
  │     │                    │ ◄── JWT + user + apps[] ─────  │ Verifica│
  │     │                    │                                │ se tem  │
  │     │                    │                                │ link    │
  │     │                    │                                │         │
  │     │                    │ Se NÃO tem link com SCE:       │         │
  │     │                    │ → Cria AppUserLink automático  │         │
  │     │                    │                                │         │
  │     │ ◄── Logado ──────  │               │                │         │
  └─────┘                    └───────────────┘                └─────────┘
```

---

## 🔐 ESTRUTURA DO JWT

```json
{
  "sub": "user-123",                              // GlobalUser ID
  "email": "joao@email.com",
  "name": "João",
  "role": "user",
  "origin_app_id": "c573e4f0-...",                // App onde criou conta
  "linked_apps": [                                 // Apps com acesso
    "c573e4f0-...",                               // VOX-BRIDGE
    "011c6e88-..."                                // SCE
  ],
  "current_app_id": "011c6e88-...",               // App atual (contexto)
  "billing_account_id": "billing-456",
  "plan": "pro",
  "capabilities": ["vox:*", "sce:projects:5"],
  "exp": 1736553600,
  "iat": 1736467200
}
```

---

## 💰 BILLING UNIFICADO

### Modelo

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              BILLING UNIFICADO                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  GlobalUser (user-123)
       │
       │ 1:1
       ▼
  BillingAccount (billing-456)
       │
       │ 1:N
       ▼
  Subscription (sub-789)
       │
       │ Define
       ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                              CAPABILITIES POR PLANO                                 │
  │                                                                                     │
  │  FREE                        PRO                         ENTERPRISE                 │
  │  ────                        ───                         ──────────                 │
  │                                                                                     │
  │  VOX-BRIDGE:                 VOX-BRIDGE:                 VOX-BRIDGE:                │
  │  • 30 min/dia                • Ilimitado                 • Ilimitado                │
  │  • Sem tradução              • Tradução                  • Tradução                 │
  │                              • Histórico 7d              • Histórico 30d            │
  │                                                                                     │
  │  SCE:                        SCE:                        SCE:                       │
  │  • 1 projeto                 • 5 projetos                • Ilimitado                │
  │  • 1 deploy/dia              • 10 deploys/dia            • Ilimitado                │
  │  • 512MB RAM                 • 2GB RAM                   • 8GB RAM                  │
  │                                                                                     │
  │  PROST-QS:                   PROST-QS:                   PROST-QS:                  │
  │  • 1 app                     • 5 apps                    • Ilimitado                │
  │  • 100 users                 • 10K users                 • Ilimitado                │
  │  • Basic telemetry           • Full analytics            • Custom rules             │
  │                                                                                     │
  └─────────────────────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Pagamento

```
  Usuário                    Qualquer App                     PROST-QS              Stripe
  ┌─────┐                    ┌───────────────┐                ┌─────────┐           ┌──────┐
  │     │ ── Upgrade ──────► │               │                │         │           │      │
  │     │                    │ ── POST ────────────────────► │         │           │      │
  │     │                    │    /billing/checkout           │         │           │      │
  │     │                    │                                │         │           │      │
  │     │                    │                                │ ── Create ────────► │      │
  │     │                    │                                │    Checkout         │      │
  │     │                    │                                │    Session          │      │
  │     │                    │                                │                     │      │
  │     │                    │ ◄── checkout_url ────────────  │ ◄── URL ──────────  │      │
  │     │                    │                                │                     │      │
  │     │ ◄── Redirect ────  │               │                │                     │      │
  │     │                    │               │                │                     │      │
  │     │ ─────────────────────────────────────────────────────────── Paga ──────► │      │
  │     │                    │               │                │                     │      │
  │     │                    │               │                │ ◄── Webhook ──────  │      │
  │     │                    │               │                │    checkout.        │      │
  │     │                    │               │                │    completed        │      │
  │     │                    │               │                │                     │      │
  │     │                    │               │                │ Atualiza:           │      │
  │     │                    │               │                │ • Subscription      │      │
  │     │                    │               │                │ • Capabilities      │      │
  │     │                    │               │                │                     │      │
  │     │ ◄── Plano Ativo ───────────────────────────────────│                     │      │
  │     │    (em TODOS os apps)              │                │                     │      │
  └─────┘                    └───────────────┘                └─────────┘           └──────┘

  RESULTADO:
  ┌────────────────────────────────────────────────────────────────────────────────┐
  │ Subscription                                                                    │
  │   user_id: user-123                                                             │
  │   plan_id: pro                                                                  │
  │   status: active                                                                │
  │                                                                                 │
  │ Capabilities (aplicadas em TODOS os apps linkados):                             │
  │   VOX-BRIDGE: vox:unlimited, vox:translation, vox:history:7d                    │
  │   SCE: sce:projects:5, sce:deploys:10, sce:ram:2gb                              │
  │   PROST-QS: prost:apps:5, prost:users:10k, prost:analytics:full                 │
  └────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 ENDPOINTS NECESSÁRIOS

### Identity Module (Novos)

```
POST /api/v1/identity/register
  Body: { email, password, name, origin_app_id }
  Response: { user_id, token, is_new_user, linked_apps }

POST /api/v1/identity/login
  Body: { email, password, requesting_app_id }
  Response: { user_id, token, linked_apps, needs_link }

POST /api/v1/identity/link-app
  Body: { app_id }
  Headers: Authorization: Bearer <JWT>
  Response: { success, new_token, linked_apps }

GET /api/v1/identity/me
  Headers: Authorization: Bearer <JWT>
  Response: { user, linked_apps, origin_app, billing_account }

GET /api/v1/identity/me/apps
  Headers: Authorization: Bearer <JWT>
  Response: { apps: [{ app_id, name, linked_at, last_access }] }
```

### Billing Module (Existentes + Ajustes)

```
POST /api/v1/billing/checkout
  Body: { plan_id, success_url, cancel_url }
  Headers: Authorization: Bearer <JWT>
  Response: { checkout_url, session_id }

GET /api/v1/billing/subscription
  Headers: Authorization: Bearer <JWT>
  Response: { subscription, plan, capabilities_by_app }

GET /api/v1/billing/capabilities
  Headers: Authorization: Bearer <JWT>
  Query: ?app_id=xxx (opcional)
  Response: { capabilities, limits, usage }
```

---

## 📋 IMPLEMENTAÇÃO — PRÓXIMOS PASSOS

### Fase 1: Modelo de Dados (Backend)

1. Criar tabela `global_users` (ou renomear `users`)
2. Adicionar campo `origin_app_id` em `users`
3. Criar tabela `app_user_links`
4. Migrar dados existentes

### Fase 2: Endpoints Identity

1. `POST /identity/register` com `origin_app_id`
2. `POST /identity/login` com `requesting_app_id`
3. `POST /identity/link-app`
4. `GET /identity/me` com `linked_apps`

### Fase 3: JWT Atualizado

1. Incluir `origin_app_id` no JWT
2. Incluir `linked_apps[]` no JWT
3. Incluir `current_app_id` no JWT

### Fase 4: Integração SCE

1. Remover auth local do SCE
2. Usar PROST-QS Identity
3. Implementar tela de "Link App"

### Fase 5: Billing Unificado

1. Capabilities por app no plano
2. Verificação de capabilities no SCE
3. Checkout unificado

---

## 🎯 BENEFÍCIOS

1. **Uma conta, múltiplos apps** — Usuário não precisa criar conta em cada app
2. **Rastreamento de origem** — Sabe de onde cada usuário veio
3. **Billing centralizado** — Um pagamento libera todos os apps
4. **Governança unificada** — Políticas aplicadas globalmente
5. **Telemetria cross-app** — Visão completa do usuário no ecossistema

---

*Documento criado em 10/01/2026*
