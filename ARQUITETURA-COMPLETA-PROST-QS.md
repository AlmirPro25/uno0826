# PROST-QS — ARQUITETURA COMPLETA DO SISTEMA
**Data:** 10 de Janeiro de 2026  
**Versão:** 1.0 — MULTI-APP VALIDADO

---

## 🎯 VISÃO GERAL

```
╔═══════════════════════════════════════════════════════════════════════════════════════════╗
║                                    ECOSSISTEMA PROST-QS                                    ║
║                          "Governança Institucional para Apps de IA"                        ║
╚═══════════════════════════════════════════════════════════════════════════════════════════╝

                                    ┌─────────────────────┐
                                    │   ADMIN DASHBOARD   │
                                    │  admin-six-mauve    │
                                    │     .vercel.app     │
                                    │                     │
                                    │  • Métricas         │
                                    │  • Rules Engine     │
                                    │  • Alertas          │
                                    │  • Governança       │
                                    └──────────┬──────────┘
                                               │
                                               │ Polling 3s
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                              │
│  ┌─────────────────────────┐                              ┌─────────────────────────┐       │
│  │      VOX-BRIDGE         │                              │          SCE            │       │
│  │       (APP-1)           │                              │        (APP-2)          │       │
│  │                         │                              │                         │       │
│  │  Video Chat Anônimo     │                              │  Sovereign Cloud Engine │       │
│  │                         │                              │  (PaaS Self-Hosted)     │       │
│  │  ┌─────────────────┐    │                              │                         │       │
│  │  │ Frontend React  │    │                              │  ┌─────────────────┐    │       │
│  │  │ vox-bridge-     │    │                              │  │ Frontend Next.js│    │       │
│  │  │ ivory.vercel    │    │                              │  │ localhost:3000  │    │       │
│  │  └────────┬────────┘    │                              │  └────────┬────────┘    │       │
│  │           │ WebSocket   │                              │           │ HTTP        │       │
│  │           ▼             │                              │           ▼             │       │
│  │  ┌─────────────────┐    │                              │  ┌─────────────────┐    │       │
│  │  │ Backend Node.js │    │                              │  │ Backend Fastify │    │       │
│  │  │ vox-bridge-api  │    │                              │  │ localhost:3001  │    │       │
│  │  │ .onrender.com   │    │                              │  │ + Prisma + SQLite│   │       │
│  │  └────────┬────────┘    │                              │  └────────┬────────┘    │       │
│  │           │             │                              │           │             │       │
│  └───────────┼─────────────┘                              └───────────┼─────────────┘       │
│              │                                                        │                     │
│              │ HTTP (Telemetria)                                      │ HTTP (Telemetria)   │
│              │ X-Prost-App-Key                                        │ X-Prost-App-Key     │
│              │ X-Prost-App-Secret                                     │ X-Prost-App-Secret  │
│              │                                                        │                     │
│              └────────────────────────┬───────────────────────────────┘                     │
│                                       │                                                     │
│                                       ▼                                                     │
│  ╔═══════════════════════════════════════════════════════════════════════════════════════╗ │
│  ║                              PROST-QS SOVEREIGN KERNEL                                 ║ │
│  ║                            https://uno0826.onrender.com                                ║ │
│  ║                                                                                        ║ │
│  ║  ┌──────────────────────────────────────────────────────────────────────────────────┐ ║ │
│  ║  │                        CAMADA 1: OBSERVAÇÃO                                      │ ║ │
│  ║  │                                                                                  │ ║ │
│  ║  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ ║ │
│  ║  │  │  Telemetry  │  │   Events    │  │  Sessions   │  │   Metrics   │             │ ║ │
│  ║  │  │   Module    │  │   Store     │  │   Manager   │  │  Snapshots  │             │ ║ │
│  ║  │  │             │  │             │  │             │  │             │             │ ║ │
│  ║  │  │ POST /events│  │ TelemetryEv │  │ AppSession  │  │ AppMetrics  │             │ ║ │
│  ║  │  │ Heartbeat   │  │ Semânticos  │  │ Heartbeat   │  │ Pré-agregado│             │ ║ │
│  ║  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │ ║ │
│  ║  └──────────────────────────────────────────────────────────────────────────────────┘ ║ │
│  ║                                         │                                             ║ │
│  ║                                         ▼                                             ║ │
│  ║  ┌──────────────────────────────────────────────────────────────────────────────────┐ ║ │
│  ║  │                        CAMADA 2: DECISÃO                                         │ ║ │
│  ║  │                                                                                  │ ║ │
│  ║  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ ║ │
│  ║  │  │   Rules     │  │  Triggers   │  │  Conditions │  │  Templates  │             │ ║ │
│  ║  │  │   Engine    │  │             │  │             │  │             │             │ ║ │
│  ║  │  │             │  │ • metric    │  │ bounce > 60 │  │ Retenção    │             │ ║ │
│  ║  │  │ Avalia      │  │ • threshold │  │ online > N  │  │ Bounce      │             │ ║ │
│  ║  │  │ Dispara     │  │ • event     │  │ churn > 30  │  │ Pico        │             │ ║ │
│  ║  │  │ Cooldown    │  │ • schedule  │  │ D1 < 10%    │  │ Churn       │             │ ║ │
│  ║  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │ ║ │
│  ║  └──────────────────────────────────────────────────────────────────────────────────┘ ║ │
│  ║                                         │                                             ║ │
│  ║                                         ▼                                             ║ │
│  ║  ┌──────────────────────────────────────────────────────────────────────────────────┐ ║ │
│  ║  │                        CAMADA 3: AÇÃO                                            │ ║ │
│  ║  │                                                                                  │ ║ │
│  ║  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ ║ │
│  ║  │  │   Alert     │  │   Webhook   │  │   Adjust    │  │  CreateRule │             │ ║ │
│  ║  │  │             │  │             │  │             │  │  (Meta)     │             │ ║ │
│  ║  │  │ Cria alerta │  │ Chama URL   │  │ Muda config │  │ Regra cria  │             │ ║ │
│  ║  │  │ no sistema  │  │ externa     │  │ do app      │  │ regra temp  │             │ ║ │
│  ║  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │ ║ │
│  ║  │                                                                                  │ ║ │
│  ║  │  ┌─────────────┐  ┌─────────────┐                                               │ ║ │
│  ║  │  │ DisableRule │  │   Escalate  │                                               │ ║ │
│  ║  │  │             │  │             │                                               │ ║ │
│  ║  │  │ Desativa    │  │ Aumenta     │                                               │ ║ │
│  ║  │  │ outra regra │  │ severidade  │                                               │ ║ │
│  ║  │  └─────────────┘  └─────────────┘                                               │ ║ │
│  ║  └──────────────────────────────────────────────────────────────────────────────────┘ ║ │
│  ║                                         │                                             ║ │
│  ║                                         ▼                                             ║ │
│  ║  ┌──────────────────────────────────────────────────────────────────────────────────┐ ║ │
│  ║  │                        CAMADA 4: GOVERNANÇA                                      │ ║ │
│  ║  │                                                                                  │ ║ │
│  ║  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ ║ │
│  ║  │  │   Policy    │  │ Kill Switch │  │   Shadow    │  │  Authority  │             │ ║ │
│  ║  │  │   Engine    │  │             │  │    Mode     │  │   Levels    │             │ ║ │
│  ║  │  │             │  │             │  │             │  │             │             │ ║ │
│  ║  │  │ allow/deny  │  │ Pausa TUDO  │  │ Simula sem  │  │ observer    │             │ ║ │
│  ║  │  │ por ação    │  │ emergência  │  │ executar    │  │ operator    │             │ ║ │
│  ║  │  └─────────────┘  └─────────────┘  └─────────────┘  │ manager     │             │ ║ │
│  ║  │                                                      │ governor    │             │ ║ │
│  ║  │  ┌─────────────┐  ┌─────────────┐                   │ sovereign   │             │ ║ │
│  ║  │  │   Audit     │  │  Lifecycle  │                   └─────────────┘             │ ║ │
│  ║  │  │    Log      │  │   Memory    │                                               │ ║ │
│  ║  │  │             │  │             │                                               │ ║ │
│  ║  │  │ Imutável    │  │ Decisões    │                                               │ ║ │
│  ║  │  │ Rastreável  │  │ Precedentes │                                               │ ║ │
│  ║  │  └─────────────┘  └─────────────┘                                               │ ║ │
│  ║  └──────────────────────────────────────────────────────────────────────────────────┘ ║ │
│  ║                                                                                        ║ │
│  ╚════════════════════════════════════════════════════════════════════════════════════════╝ │
│                                       │                                                     │
│                                       │ GORM                                                │
│                                       ▼                                                     │
│                          ┌─────────────────────────┐                                        │
│                          │    PostgreSQL (Neon)    │                                        │
│                          │    sa-east-1            │                                        │
│                          └─────────────────────────┘                                        │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 MÓDULOS DO KERNEL


```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              MÓDULOS DO KERNEL PROST-QS                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │   IDENTITY MODULE   │  │   BILLING MODULE    │  │  APPLICATION MODULE │             │
│  │        ✅           │  │        ✅           │  │         ✅          │             │
│  │                     │  │                     │  │                     │             │
│  │ • Auth JWT          │  │ • BillingAccount    │  │ • CRUD Apps         │             │
│  │ • Registro/Login    │  │ • Subscriptions     │  │ • API Keys          │             │
│  │ • Implicit Login    │  │ • PaymentIntents    │  │ • Scopes            │             │
│  │ • Capabilities      │  │ • Ledger            │  │ • Multi-tenant      │             │
│  │ • Entitlements      │  │ • Stripe Webhooks   │  │                     │             │
│  │                     │  │ • Checkout Session  │  │                     │             │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘             │
│                                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │  TELEMETRY MODULE   │  │    RULES MODULE     │  │   ALERTS MODULE     │             │
│  │        ✅           │  │        ✅           │  │         ✅          │             │
│  │                     │  │                     │  │                     │             │
│  │ • Events Store      │  │ • Rules Engine      │  │ • Central Alertas   │             │
│  │ • Sessions Manager  │  │ • Triggers          │  │ • Severidade        │             │
│  │ • Metrics Snapshot  │  │ • Conditions        │  │ • Acknowledge       │             │
│  │ • Heartbeat         │  │ • Actions           │  │ • Histórico         │             │
│  │ • Analytics         │  │ • Templates         │  │                     │             │
│  │ • Funil/Retenção    │  │ • Cooldown          │  │                     │             │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘             │
│                                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │  GOVERNANCE MODULE  │  │    AUDIT MODULE     │  │    JOBS MODULE      │             │
│  │        ✅           │  │        ✅           │  │         ✅          │             │
│  │                     │  │                     │  │                     │             │
│  │ • Policy Engine     │  │ • Audit Log         │  │ • Job Queue         │             │
│  │ • Kill Switch       │  │ • Imutável          │  │ • Webhook Executor  │             │
│  │ • Shadow Mode       │  │ • Rastreável        │  │ • Retry Logic       │             │
│  │ • Authority Levels  │  │ • Action Audit      │  │ • Circuit Breaker   │             │
│  │ • Lifecycle Memory  │  │                     │  │                     │             │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘             │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 APPS INTEGRADOS

### APP-1: VOX-BRIDGE (Video Chat Anônimo)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VOX-BRIDGE (APP-1)                             │
│                     App ID: c573e4f0-a738-400c-a6bc-d890360a0057            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STACK:                          EVENTOS EMITIDOS:                          │
│  ├─ Frontend: React + Vite       ├─ session.start/ping/end                  │
│  ├─ Backend: Node.js + Socket.io ├─ session.recover                         │
│  ├─ WebRTC: Peer-to-peer         ├─ interaction.match.created/ended         │
│  └─ Deploy: Render + Vercel      ├─ interaction.queue.joined/left           │
│                                  ├─ interaction.skip                        │
│  URLs:                           ├─ interaction.message.sent                │
│  ├─ API: vox-bridge-api          ├─ nav.feature.enter/leave                 │
│  │       .onrender.com           └─ error.ice_failure                       │
│  └─ Web: vox-bridge-ivory                                                   │
│          .vercel.app             FEATURES:                                  │
│                                  ├─ Implicit Login ✅                       │
│  INTEGRAÇÃO PROST-QS:            ├─ Telemetria Real-time ✅                 │
│  ├─ prostqs-client.js            ├─ Session Recovery ✅                     │
│  ├─ X-Prost-App-Key              └─ Heartbeat 30s ✅                        │
│  └─ X-Prost-App-Secret                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### APP-2: SCE - Sovereign Cloud Engine (PaaS)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 SCE (APP-2)                                 │
│                     App ID: 011c6e88-9556-43ff-ad4e-27e20a5f5ea5            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STACK:                          EVENTOS EMITIDOS:                          │
│  ├─ Frontend: Next.js 15         ├─ project.created/deleted                 │
│  ├─ Backend: Fastify + Prisma    ├─ deploy.started/building                 │
│  ├─ Database: SQLite             ├─ deploy.healthy/failed                   │
│  ├─ Runtime: Docker + Traefik    ├─ container.started/stopped               │
│  └─ Deploy: Local (dev)          ├─ container.crashed/metrics               │
│                                  └─ infra.health_check/resource_alert       │
│  URLs (Local):                                                              │
│  ├─ Frontend: localhost:3000     FEATURES:                                  │
│  └─ Backend: localhost:3001      ├─ Auth Local (JWT) ✅                     │
│                                  ├─ Telemetria PROST-QS ✅                  │
│  INTEGRAÇÃO PROST-QS:            ├─ Deploy Pipeline ✅                      │
│  ├─ prostqs-client.ts            ├─ Container Management ✅                 │
│  ├─ X-Prost-App-Key              └─ AuthGuard (SSR) ✅                      │
│  └─ X-Prost-App-Secret                                                      │
│                                                                             │
│  CREDENCIAIS:                                                               │
│  ├─ Key: pq_pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                             │
│  └─ Secret: pq_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 FLUXO DE DADOS

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              FLUXO DE TELEMETRIA                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  VOX-BRIDGE                                                              SCE
  ┌────────┐                                                         ┌────────┐
  │ User   │                                                         │ Admin  │
  │ Action │                                                         │ Action │
  └───┬────┘                                                         └───┬────┘
      │                                                                  │
      ▼                                                                  ▼
  ┌────────────────┐                                              ┌────────────────┐
  │ prostqs-client │                                              │ prostqs-client │
  │     .js        │                                              │     .ts        │
  └───────┬────────┘                                              └───────┬────────┘
          │                                                               │
          │  POST /api/v1/telemetry/events                                │
          │  Headers:                                                     │
          │  - X-Prost-App-Key: pq_pk_xxx                                 │
          │  - X-Prost-App-Secret: pq_sk_xxx                              │
          │                                                               │
          └───────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │      PROST-QS KERNEL        │
                    │                             │
                    │  1. Valida API Keys         │
                    │  2. Identifica App          │
                    │  3. Grava TelemetryEvent    │
                    │  4. Atualiza AppSession     │
                    │  5. Atualiza Metrics        │
                    │  6. Avalia Rules            │
                    │  7. Dispara Actions         │
                    │                             │
                    └─────────────┬───────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │      PostgreSQL (Neon)      │
                    │                             │
                    │  • telemetry_events         │
                    │  • app_sessions             │
                    │  • app_metrics_snapshots    │
                    │  • rules                    │
                    │  • alerts                   │
                    │  • audit_logs               │
                    │                             │
                    └─────────────────────────────┘
                                  │
                                  │ Polling 3s
                                  ▼
                    ┌─────────────────────────────┐
                    │      ADMIN DASHBOARD        │
                    │                             │
                    │  • Métricas Real-time       │
                    │  • Eventos por App          │
                    │  • Rules Engine             │
                    │  • Central de Alertas       │
                    │  • Governança               │
                    │                             │
                    └─────────────────────────────┘
```

---

## 🔐 FLUXO DE AUTENTICAÇÃO

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           FLUXO DE AUTENTICAÇÃO (ATUAL)                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                              VOX-BRIDGE (Implicit Login)                            │
  │                                                                                     │
  │   Usuário                    Backend Node                    PROST-QS               │
  │   ┌─────┐                    ┌───────────┐                   ┌─────────┐            │
  │   │     │ ──── Conecta ────► │           │                   │         │            │
  │   │     │                    │           │ ── POST ────────► │         │            │
  │   │     │                    │           │    /identity/     │         │            │
  │   │     │                    │           │    implicit-login │         │            │
  │   │     │                    │           │                   │         │            │
  │   │     │                    │           │ ◄── JWT + ───────│         │            │
  │   │     │                    │           │    user_id        │         │            │
  │   │     │ ◄── Session ─────  │           │                   │         │            │
  │   │     │     Created        │           │                   │         │            │
  │   └─────┘                    └───────────┘                   └─────────┘            │
  │                                                                                     │
  └─────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                              SCE (Auth Local + PROST-QS Telemetry)                  │
  │                                                                                     │
  │   Admin                      Backend Fastify                 PROST-QS               │
  │   ┌─────┐                    ┌───────────┐                   ┌─────────┐            │
  │   │     │ ── POST /login ──► │           │                   │         │            │
  │   │     │    email/password  │           │                   │         │            │
  │   │     │                    │ Valida    │                   │         │            │
  │   │     │                    │ Local DB  │                   │         │            │
  │   │     │ ◄── JWT Local ───  │           │                   │         │            │
  │   │     │                    │           │                   │         │            │
  │   │     │ ── Ação ─────────► │           │ ── Telemetria ──► │         │            │
  │   │     │    (criar projeto) │           │    project.created│         │            │
  │   │     │                    │           │                   │         │            │
  │   └─────┘                    └───────────┘                   └─────────┘            │
  │                                                                                     │
  │   PRÓXIMO PASSO: Conectar SCE ao Identity Module (SSO)                              │
  │                                                                                     │
  └─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💰 FLUXO DE BILLING (Preparado)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              FLUXO DE BILLING (STRIPE)                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  Usuário                    PROST-QS                         Stripe
  ┌─────┐                    ┌─────────┐                      ┌─────────┐
  │     │ ── Upgrade ──────► │         │                      │         │
  │     │                    │         │ ── Create ─────────► │         │
  │     │                    │         │    Checkout Session  │         │
  │     │                    │         │                      │         │
  │     │ ◄── Redirect ────  │         │ ◄── Session URL ───  │         │
  │     │    to Stripe       │         │                      │         │
  │     │                    │         │                      │         │
  │     │ ────────────────────────────────── Paga ──────────► │         │
  │     │                    │         │                      │         │
  │     │                    │         │ ◄── Webhook ───────  │         │
  │     │                    │         │    checkout.completed│         │
  │     │                    │         │                      │         │
  │     │                    │ Cria    │                      │         │
  │     │                    │ Subscription                   │         │
  │     │                    │ Local   │                      │         │
  │     │                    │         │                      │         │
  │     │ ◄── Plano Ativo ── │         │                      │         │
  │     │                    │         │                      │         │
  └─────┘                    └─────────┘                      └─────────┘

  CAPABILITIES POR PLANO:
  ┌─────────────────────────────────────────────────────────────────────┐
  │  FREE          │  PRO           │  ENTERPRISE                       │
  ├─────────────────────────────────────────────────────────────────────┤
  │  • 1 App       │  • 5 Apps      │  • Unlimited Apps                 │
  │  • 2 API Keys  │  • 10 API Keys │  • Unlimited Keys                 │
  │  • 100 users   │  • 10K users   │  • Unlimited users                │
  │  • Basic       │  • Analytics   │  • Custom Rules                   │
  │    Telemetry   │  • Rules       │  • Priority Support               │
  │                │  • Webhooks    │  • SLA                            │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ GOVERNANÇA


```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SISTEMA DE GOVERNANÇA                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                              HIERARQUIA DE AUTORIDADE                               │
  │                                                                                     │
  │   SOVEREIGN (6)  ────────────────────────────────────────────────────────────────   │
  │   │  Pode desligar o sistema                                                        │
  │   │                                                                                 │
  │   ▼                                                                                 │
  │   GOVERNOR (5)  ─────────────────────────────────────────────────────────────────   │
  │   │  Pode mudar políticas                                                           │
  │   │                                                                                 │
  │   ▼                                                                                 │
  │   MANAGER (4)  ──────────────────────────────────────────────────────────────────   │
  │   │  Pode mudar regras e configs                                                    │
  │   │                                                                                 │
  │   ▼                                                                                 │
  │   OPERATOR (3)  ─────────────────────────────────────────────────────────────────   │
  │   │  Pode executar ações operacionais                                               │
  │   │                                                                                 │
  │   ▼                                                                                 │
  │   SUGGESTOR (2)  ────────────────────────────────────────────────────────────────   │
  │   │  Pode sugerir ações (shadow mode)                                               │
  │   │                                                                                 │
  │   ▼                                                                                 │
  │   OBSERVER (1)  ─────────────────────────────────────────────────────────────────   │
  │      Pode ver, não pode agir                                                        │
  │                                                                                     │
  └─────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                              AÇÕES PROIBIDAS (NUNCA AUTOMÁTICAS)                    │
  │                                                                                     │
  │   ❌ billing.charge          ❌ billing.refund                                      │
  │   ❌ user.delete             ❌ user.ban_permanent                                  │
  │   ❌ app.delete              ❌ app.suspend                                         │
  │   ❌ data.delete             ❌ data.export                                         │
  │   ❌ platform.shutdown                                                              │
  │                                                                                     │
  │   Essas ações SEMPRE requerem aprovação humana explícita.                           │
  │                                                                                     │
  └─────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                              KILL SWITCH                                            │
  │                                                                                     │
  │   Estado: ⚪ INATIVO                                                                │
  │                                                                                     │
  │   Quando ativado:                                                                   │
  │   • TODAS as regras param de executar                                               │
  │   • TODAS as ações automáticas são bloqueadas                                       │
  │   • Sistema entra em modo "somente leitura"                                         │
  │   • Apenas SOVEREIGN pode desativar                                                 │
  │                                                                                     │
  │   Endpoints:                                                                        │
  │   POST /admin/rules/killswitch/activate                                             │
  │   POST /admin/rules/killswitch/deactivate                                           │
  │                                                                                     │
  └─────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                              SHADOW MODE                                            │
  │                                                                                     │
  │   "Veja tudo, não faça nada, registre tudo"                                         │
  │                                                                                     │
  │   Quando ativado:                                                                   │
  │   • Regras são avaliadas normalmente                                                │
  │   • Ações são SIMULADAS, não executadas                                             │
  │   • Tudo é registrado em shadow_executions                                          │
  │   • Permite testar regras em produção sem risco                                     │
  │                                                                                     │
  │   Filtros disponíveis:                                                              │
  │   • Por app_ids                                                                     │
  │   • Por action_types                                                                │
  │   • Por domains                                                                     │
  │   • Por duração (TTL)                                                               │
  │                                                                                     │
  └─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📈 STATUS DE IMPLEMENTAÇÃO

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              STATUS DE IMPLEMENTAÇÃO                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  KERNEL PROST-QS
  ├── Identity Module .......................... ✅ COMPLETO
  │   ├── Auth JWT ............................. ✅
  │   ├── Registro/Login ....................... ✅
  │   ├── Implicit Login ....................... ✅
  │   ├── Capabilities ......................... ✅
  │   └── Entitlements ......................... ✅
  │
  ├── Billing Module ........................... ✅ COMPLETO
  │   ├── BillingAccount ....................... ✅
  │   ├── Subscriptions ........................ ✅
  │   ├── PaymentIntents ....................... ✅
  │   ├── Ledger ............................... ✅
  │   ├── Stripe Integration ................... ✅
  │   └── Checkout Session ..................... ✅
  │
  ├── Application Module ....................... ✅ COMPLETO
  │   ├── CRUD Apps ............................ ✅
  │   ├── API Keys (pk/sk) ..................... ✅
  │   ├── Scopes ............................... ✅
  │   └── Multi-tenant ......................... ✅
  │
  ├── Telemetry Module ......................... ✅ COMPLETO
  │   ├── Events Store ......................... ✅
  │   ├── Sessions Manager ..................... ✅
  │   ├── Metrics Snapshot ..................... ✅
  │   ├── Heartbeat ............................ ✅
  │   ├── Analytics (Funil, Retenção) .......... ✅
  │   └── Heatmap, Journey, Geo ................ ✅
  │
  ├── Rules Module ............................. ✅ COMPLETO
  │   ├── Rules Engine ......................... ✅
  │   ├── Triggers (metric/threshold/event) .... ✅
  │   ├── Actions (alert/webhook/adjust) ....... ✅
  │   ├── Templates ............................ ✅
  │   └── Cooldown ............................. ✅
  │
  ├── Governance Module ........................ ✅ COMPLETO
  │   ├── Policy Engine ........................ ✅
  │   ├── Kill Switch .......................... ✅
  │   ├── Shadow Mode .......................... ✅
  │   ├── Authority Levels ..................... ✅
  │   └── Audit Log ............................ ✅
  │
  └── Jobs Module .............................. ✅ COMPLETO
      ├── Job Queue ............................ ✅
      ├── Webhook Executor ..................... ✅
      └── Retry Logic .......................... ✅

  APPS INTEGRADOS
  ├── VOX-BRIDGE (APP-1) ....................... ✅ PRODUÇÃO
  │   ├── Implicit Login ....................... ✅
  │   ├── Telemetria ........................... ✅
  │   └── Session Recovery ..................... ✅
  │
  └── SCE (APP-2) .............................. ✅ INTEGRADO
      ├── Auth Local ........................... ✅
      ├── Telemetria PROST-QS .................. ✅
      ├── AuthGuard (SSR) ...................... ✅
      └── Identity SSO ......................... ⏳ PRÓXIMO

  PRÓXIMOS PASSOS
  ├── A) Identity SSO para SCE ................. ⏳ PENDENTE
  ├── B) Billing para SCE ...................... ⏳ PENDENTE
  └── C) Deploy SCE em Produção ................ ⏳ PENDENTE
```

---

## 🌐 URLs DE PRODUÇÃO

| Serviço | URL | Status |
|---------|-----|--------|
| PROST-QS Backend | https://uno0826.onrender.com | ✅ Online |
| VOX-BRIDGE API | https://vox-bridge-api.onrender.com | ✅ Online |
| VOX-BRIDGE Frontend | https://vox-bridge-ivory.vercel.app | ✅ Online |
| Admin Dashboard | https://admin-six-mauve.vercel.app | ✅ Online |
| Neon PostgreSQL | ep-morning-rain-ackv38c5-pooler.sa-east-1.aws.neon.tech | ✅ Online |

---

## 🔧 STACK TECNOLÓGICA

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              STACK TECNOLÓGICA                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  PROST-QS KERNEL
  ├── Linguagem: Go 1.21+
  ├── Framework: Gin (HTTP Router)
  ├── ORM: GORM
  ├── Database: PostgreSQL (Neon)
  ├── Auth: JWT (golang-jwt/v5)
  ├── Payments: Stripe API
  └── Deploy: Render.com

  VOX-BRIDGE (APP-1)
  ├── Backend: Node.js + Socket.io
  ├── Frontend: React + Vite
  ├── WebRTC: Peer-to-peer
  └── Deploy: Render (API) + Vercel (Web)

  SCE (APP-2)
  ├── Backend: Node.js + Fastify + Prisma
  ├── Frontend: Next.js 15 + Tailwind
  ├── Database: SQLite (local-first)
  ├── Runtime: Docker Engine + Traefik
  └── Deploy: Local (dev) → Render/Vercel (prod)

  ADMIN DASHBOARD
  ├── Stack: HTML/CSS/JS puro
  ├── Styling: Tailwind CSS (CDN)
  ├── Updates: Polling 3s
  └── Deploy: Vercel
```

---

## 📝 CONCLUSÃO

O sistema PROST-QS é uma **plataforma de governança institucional** para apps que:

1. **Observa** — Coleta eventos, sessões e métricas em tempo real
2. **Decide** — Avalia condições e dispara regras automaticamente
3. **Age** — Executa ações (alertas, webhooks, ajustes)
4. **Governa** — Limita, audita, simula e controla autoridade

**Multi-App Validado:** 2 apps integrados (VOX-BRIDGE + SCE) com telemetria fluindo.

**Próximo Passo:** Conectar Identity e Billing do SCE ao PROST-QS.

---

*Documento gerado em 10/01/2026*
