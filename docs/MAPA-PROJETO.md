# 🗺️ MAPA DO PROJETO PROST-QS

> Visão completa de todas as pastas, o que cada uma faz e onde está hospedada.

---

## 📊 VISÃO GERAL

```
UNO-main/
├── backend/          → 🔧 KERNEL (Go) - Render ✅
├── frontend/         → 🎨 DASHBOARD ADMIN (Next.js) - Vercel ✅
├── frontend-old/     → 📦 LEGADO (HTML/JS) - Não usado
├── apps/
│   ├── APP-1/        → 🎙️ VOX BRID (Chat/Video) - Render + Vercel ✅
│   ├── APP-2/        → 📁 Vazio (reservado) ⚪
│   └── SCE/          → 🚀 SCE Platform - Render + Vercel ✅
├── sdk/              → 📦 SDK JavaScript para integração
├── docs/             → 📚 Documentação
└── scripts/          → 🔧 Scripts de automação
```

---

## 🟢 EM PRODUÇÃO

### 1. Backend (KERNEL) - `backend/`
**Hospedagem:** Render (https://uno0826.onrender.com)
**Tecnologia:** Go + Gin + GORM
**Banco:** Neon (PostgreSQL)

```
backend/
├── cmd/api/main.go      → Ponto de entrada da API
├── internal/            → 36 MÓDULOS DE NEGÓCIO
│   │
│   │ ══════ CORE ══════
│   ├── auth/            → Autenticação JWT + OAuth
│   ├── identity/        → Identidade multi-app federada
│   ├── application/     → Gestão de apps registrados
│   ├── federation/      → Federação entre apps
│   │
│   │ ══════ BILLING ══════
│   ├── billing/         → Billing + Stripe + Planos
│   ├── payment/         → Processamento de pagamentos
│   ├── financial/       → Relatórios financeiros
│   ├── kernel_billing/  → Billing interno do Kernel
│   ├── usage/           → Tracking de uso por app
│   │
│   │ ══════ RULES ENGINE ══════
│   ├── rules/           → Motor de regras dinâmicas
│   ├── policy/          → Políticas de acesso
│   ├── authority/       → Autoridade de decisão
│   ├── shadow/          → Shadow mode (teste de regras)
│   │
│   │ ══════ OBSERVABILIDADE ══════
│   ├── telemetry/       → Telemetria de apps
│   ├── audit/           → Auditoria de ações
│   ├── event/           → Sistema de eventos
│   ├── observability/   → Métricas e traces
│   ├── observer/        → Observer pattern
│   │
│   │ ══════ ADS ══════
│   ├── ads/             → Ad Gateway (leilão RTB)
│   ├── ad/              → Gestão de anúncios
│   │
│   │ ══════ INTELIGÊNCIA ══════
│   ├── ai/              → Integração com IA
│   ├── agent/           → Agentes autônomos
│   ├── autonomy/        → Sistema de autonomia
│   ├── explainability/  → Explicabilidade de decisões
│   ├── narrative/       → Narrativa do sistema
│   ├── memory/          → Memória de contexto
│   │
│   │ ══════ SEGURANÇA ══════
│   ├── secrets/         → Gestão de secrets
│   ├── risk/            → Análise de risco
│   ├── killswitch/      → Kill switch de emergência
│   ├── approval/        → Aprovações manuais
│   │
│   │ ══════ INFRA ══════
│   ├── admin/           → Painel admin
│   ├── notification/    → Notificações
│   ├── jobs/            → Jobs assíncronos
│   ├── command/         → Command pattern
│   ├── replication/     → Replicação de dados
│   └── health/          → Health checks
│
├── pkg/                 → 11 PACOTES REUTILIZÁVEIS
│   ├── alerting/        → Sistema de alertas
│   ├── apigate/         → API Gateway + validação
│   ├── capabilities/    → Sistema de capabilities
│   ├── db/              → Conexão PostgreSQL (Neon)
│   ├── immunity/        → Sistema imunológico
│   ├── invariants/      → Invariantes de sistema
│   ├── middleware/      → Auth, rate limit, env guard
│   ├── resilience/      → Circuit breaker, retry
│   ├── statemachine/    → Máquina de estados
│   ├── utils/           → JWT, helpers
│   └── warobs/          → War room observability
│
├── scripts/             → Seeds e utilitários
│   ├── seed_ads.go      → Popular Ad Gateway
│   ├── seed_rules.go    → Popular regras
│   └── promote_admin.go → Promover admin
│
└── docs/                → Swagger/OpenAPI
    └── openapi.json     → Spec da API
```

---

### 2. Frontend Dashboard - `frontend/`
**Hospedagem:** Vercel (https://frontend-prost.vercel.app)
**Tecnologia:** Next.js 16 + TypeScript + Tailwind

```
frontend/
├── src/app/
│   ├── (auth)/login/              → Página de login OAuth
│   ├── (onboarding)/onboarding/   → Onboarding de novos usuários
│   │
│   ├── (dashboard)/dashboard/     → 28 PÁGINAS DO DASHBOARD
│   │   ├── page.tsx               → Dashboard principal
│   │   │
│   │   │ ══════ APPS ══════
│   │   ├── apps/                  → Gestão de apps
│   │   ├── apps/[id]/             → Detalhes do app
│   │   ├── apps/[id]/users/       → Usuários do app
│   │   │
│   │   │ ══════ BILLING ══════
│   │   ├── billing/               → Billing e planos
│   │   ├── usage/                 → Uso e consumo
│   │   │
│   │   │ ══════ RULES ══════
│   │   ├── rules/                 → Motor de regras
│   │   ├── policies/              → Políticas
│   │   ├── authority/             → Autoridade
│   │   ├── shadow/                → Shadow mode
│   │   │
│   │   │ ══════ OBSERVABILIDADE ══════
│   │   ├── telemetry/             → Telemetria
│   │   ├── audit/                 → Auditoria
│   │   ├── events/                → Eventos
│   │   ├── observer/              → Observer
│   │   ├── timeline/              → Timeline de eventos
│   │   ├── incidents/             → Incidentes
│   │   │
│   │   │ ══════ ADS ══════
│   │   ├── ads/                   → Ad Gateway
│   │   ├── ads/inventory/         → Inventário de ads
│   │   │
│   │   │ ══════ INTELIGÊNCIA ══════
│   │   ├── agents/                → Agentes IA
│   │   ├── memory/                → Memória
│   │   ├── capabilities/          → Capabilities
│   │   │
│   │   │ ══════ SEGURANÇA ══════
│   │   ├── secrets/               → Secrets
│   │   ├── risk/                  → Risco
│   │   ├── killswitch/            → Kill switch
│   │   ├── approvals/             → Aprovações
│   │   ├── immunity/              → Sistema imunológico
│   │   ├── invariants/            → Invariantes
│   │   │
│   │   │ ══════ ADMIN ══════
│   │   ├── admin/cognitive/       → Painel cognitivo
│   │   ├── admin/financial/       → Painel financeiro
│   │   ├── admin/intelligence/    → Painel inteligência
│   │   ├── admin/reconciliation/  → Reconciliação
│   │   │
│   │   │ ══════ OUTROS ══════
│   │   ├── settings/              → Configurações
│   │   ├── notifications/         → Notificações
│   │   ├── status/                → Status do sistema
│   │   └── webhooks/              → Webhooks
│   │
│   └── (docs)/                    → Documentação inline
│       ├── docs/                  → Página inicial docs
│       ├── docs/quickstart/       → Quickstart
│       ├── docs/concepts/identity/→ Conceito de identidade
│       ├── docs/concepts/events/  → Conceito de eventos
│       └── docs/api/v1/           → Referência API
│
├── src/components/
│   ├── dashboard/                 → Sidebar, header, status
│   └── ui/                        → Design system (shadcn)
│
├── src/contexts/
│   ├── auth-context.tsx           → Contexto de autenticação
│   └── app-context.tsx            → Contexto de app selecionado
│
└── src/lib/
    ├── api.ts                     → Cliente API
    └── system-states.ts           → Estados do sistema
```

---

### 3. VOX BRID (APP-1) - `apps/APP-1/`
**Hospedagem:** Render (backend) + Vercel (frontend)
**O que é:** App de chat/video com tradução em tempo real
**Status:** ✅ Em produção

```
apps/APP-1/
├── frontend/                      → Next.js + React
│   ├── src/
│   │   ├── pages/                 → Páginas da aplicação
│   │   ├── components/
│   │   │   ├── chat/              → Chat com tradução
│   │   │   │   ├── TranslationPanel.tsx
│   │   │   │   ├── MediaPreview.tsx
│   │   │   │   └── MediaUpload.tsx
│   │   │   ├── video/
│   │   │   │   └── VideoStage.tsx → Palco de vídeo (LiveKit)
│   │   │   └── onboarding/
│   │   │       └── OnboardingScreen.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts    → Conexão WebSocket
│   │   │   └── useElevatorMusic.ts→ Música de espera
│   │   ├── store/
│   │   │   └── useUserStore.ts    → Estado do usuário (Zustand)
│   │   ├── lib/                   → Utilitários
│   │   ├── styles/                → CSS/Tailwind
│   │   └── types/                 → TypeScript types
│   ├── public/audio/              → Arquivos de áudio
│   ├── vercel.json                → Config Vercel
│   └── package.json
│
├── backend-node/                  → Node.js + Express (PRINCIPAL)
│   ├── server.js                  → Servidor principal
│   ├── prostqs-client.js          → Cliente do Kernel PROST-QS
│   ├── test-integration.js        → Testes de integração
│   ├── render.yaml                → Config Render
│   └── Dockerfile
│
├── backend/                       → Go (alternativo)
│   ├── src/
│   │   ├── main.go                → Ponto de entrada
│   │   ├── controllers/           → Controllers
│   │   ├── middleware/            → Middlewares
│   │   ├── models/                → Models
│   │   └── services/              → Services
│   └── api/index.go               → API handler
│
├── prisma/
│   └── schema.prisma              → Schema do banco
│
├── shared/types/                  → Types compartilhados
│   ├── api.ts
│   └── models.ts
│
├── docs/
│   ├── architecture.json          → Arquitetura
│   ├── openapi.yaml               → Spec da API
│   ├── COTURN-SETUP.md            → Setup do TURN server
│   └── SYSTEM-STATUS.md           → Status do sistema
│
├── docker/                        → Dockerfiles
├── nginx/                         → Config Nginx
├── scripts/
│   └── deploy.ps1                 → Script de deploy
├── tests/e2e/                     → Testes E2E
│
├── .github/workflows/ci.yml       → CI/CD
├── docker-compose.yml             → Dev local
├── docker-compose.prod.yml        → Produção
├── render.yaml                    → Config Render
├── INTEGRACAO-PROST-QS.md         → Guia de integração
└── README.md
```

**Tecnologias:**
- Frontend: Next.js, React, Tailwind, LiveKit, Zustand, Framer Motion
- Backend: Node.js + Express (ou Go alternativo)
- Video: LiveKit (WebRTC)
- Banco: Prisma + PostgreSQL

**Integração com Kernel:**
- Usa `prostqs-client.js` para autenticar via Kernel
- Telemetria enviada para o Kernel
- Identidade federada via JWT

---

### 4. SCE Platform - `apps/SCE/`
**Hospedagem:** Render (backend) + Vercel (frontend)
**O que é:** Plataforma de deploy (tipo Vercel/Render)
**Status:** ✅ Em produção

```
apps/SCE/
├── frontend/                      → Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           → Landing page
│   │   │   ├── dashboard/         → Dashboard principal
│   │   │   ├── projects/          → Gestão de projetos
│   │   │   ├── domains/           → Gestão de domínios
│   │   │   ├── logs/              → Logs de deploy
│   │   │   ├── telemetry/         → Telemetria
│   │   │   ├── security/          → Segurança
│   │   │   └── settings/          → Configurações
│   │   ├── components/
│   │   │   ├── AuthGuard.tsx      → Proteção de rotas
│   │   │   └── LinkAppModal.tsx   → Modal de link com Kernel
│   │   ├── hooks/
│   │   │   └── useProstQSAuth.ts  → Hook de auth com Kernel
│   │   ├── stores/
│   │   │   └── useAuthStore.ts    → Estado de auth (Zustand)
│   │   ├── services/api/
│   │   │   └── deployment.service.ts
│   │   ├── lib/
│   │   │   ├── api.ts             → Cliente API
│   │   │   └── axios.ts           → Config Axios
│   │   ├── styles/                → CSS/Tailwind
│   │   └── types/                 → TypeScript types
│   └── package.json
│
├── backend/                       → Node.js + TypeScript + Fastify
│   ├── src/
│   │   ├── index.ts               → Ponto de entrada
│   │   ├── controllers/
│   │   │   └── project.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts    → Autenticação
│   │   │   ├── project.service.ts → Projetos
│   │   │   └── deployment.service.ts → Deploys
│   │   ├── lib/
│   │   │   ├── kernel-client.ts   → Cliente do Kernel
│   │   │   └── prostqs-client.ts  → Cliente PROST-QS
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts → Auth middleware
│   │   │   ├── kernel-auth.middleware.ts → Auth via Kernel
│   │   │   └── MIGRATION.md       → Guia de migração
│   │   ├── routes/
│   │   │   └── index.ts           → Rotas
│   │   └── utils/                 → Utilitários
│   ├── scripts/
│   │   ├── link-local-user.ts     → Linkar usuário local
│   │   └── migrate-users-to-kernel.ts → Migrar para Kernel
│   ├── prisma/
│   │   └── schema.prisma          → Schema do banco
│   ├── tests/
│   │   └── project.test.ts        → Testes
│   └── package.json
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── traefik.yml                → Config Traefik
│   └── traefik-dynamic/           → Config dinâmica
│
├── prisma/
│   └── schema.prisma              → Schema principal
│
├── shared/types/
│   └── schema.ts                  → Types compartilhados
│
├── docs/
│   ├── architecture.json          → Arquitetura
│   ├── openapi.yaml               → Spec da API
│   └── project-structure.md       → Estrutura
│
├── scripts/
│   ├── setup-dev.ps1              → Setup dev
│   ├── start-dev.ps1              → Iniciar dev
│   └── start-postgres.ps1         → Iniciar Postgres
│
├── tests/e2e/                     → Testes E2E
│
├── .github/workflows/ci.yml       → CI/CD
├── docker-compose.yml             → Dev local
├── docker-compose.dev.yml         → Dev com hot reload
├── docker-compose.prod.yml        → Produção
├── KERNEL-INTEGRATION.md          → Guia de integração
└── README.md
```

**Tecnologias:**
- Frontend: Next.js, React, Tailwind, Recharts, Zustand
- Backend: Node.js + TypeScript + Fastify
- Banco: Prisma + PostgreSQL
- Proxy: Traefik (para domínios dinâmicos)

**Integração com Kernel:**
- `kernel-client.ts` para comunicação com Kernel
- `useProstQSAuth.ts` hook para autenticação
- Migração de usuários locais para Kernel

---

## ⚪ LEGADO / NÃO USADO

### 5. Frontend Old - `frontend-old/`
**Status:** LEGADO - Não usar

```
frontend-old/
├── admin/           → Admin antigo (HTML/JS vanilla)
├── dev-portal/      → Portal de dev antigo
└── user-app/        → App de usuário antigo
```

**Nota:** Substituído pelo `frontend/` (Next.js)

---

### 6. APP-2 - `apps/APP-2/`
**Status:** Vazio - Reservado para futuro app

---

## 📦 SDK - `sdk/`
**O que é:** SDK JavaScript para integrar apps ao Kernel

```
sdk/
├── src/              → Código fonte do SDK
├── ads/
│   └── prost-ads.js  → SDK de Ads (leilão client-side)
└── examples/         → Exemplos de uso
```

---

## 🔧 Scripts - `scripts/`

```
scripts/
├── deploy.ps1        → Deploy Windows (git push automático)
├── deploy.sh         → Deploy Linux/Mac
├── backup.sh         → Backup do banco
└── restore.sh        → Restore do banco
```

---

## 📚 Docs - `docs/`

```
docs/
├── ══════ ARQUITETURA ══════
├── ARCHITECTURE.md               → Arquitetura geral do sistema
├── ARQUITETURA-CONCEITUAL.md     → Visão conceitual
├── FRONTEND-ARCHITECTURE.md      → Arquitetura do frontend
├── IDENTITY-MULTIAPP-ARCHITECTURE.md → Identidade multi-app
├── SISTEMA-IMUNOLOGICO.md        → Sistema imunológico
├── AD-EDGE-GATEWAY.md            → Ad Gateway (leilão RTB)
│
├── ══════ INTEGRAÇÃO ══════
├── KERNEL_INTEGRATION_GUIDE.md   → Como integrar apps ao Kernel
├── INTEGRATION_GUIDE.md          → Guia de integração geral
├── GUIA-INTEGRACAO-APPS.md       → Guia prático de integração
├── FRONTEND-IDENTITY-CONTRACT.md → Contrato de identidade frontend
├── API_CONTRACTS.md              → Contratos da API
├── MANIFEST_SCHEMA.md            → Schema do manifest
├── POLICY_TRIGGERS.md            → Triggers de políticas
│
├── ══════ OPERAÇÕES ══════
├── DEPLOY.md                     → Como fazer deploy
├── SECURITY-GATES.md             → Portas de segurança
├── CHECKLIST-PRODUCAO.md         → Checklist de produção
├── BOOTSTRAP-PRODUCAO.md         → Bootstrap inicial
├── RUNBOOK-OPERACOES.md          → Runbook de operações
├── CONTRATO-OPERACIONAL.md       → Contrato operacional
├── POLITICA-ACOES-AUTOMATICAS.md → Políticas automáticas
│
├── ══════ FASES DE SEGURANÇA ══════
├── FASE1-WAF-FRONTEIRA.md        → WAF e fronteira
├── FASE1-CHECKLIST-EXECUTAVEL.md → Checklist executável
├── FASE2-API-GATE.md             → API Gateway
├── FASE3-WAR-OBSERVABILITY.md    → War room observability
├── FASE4-ALERTING.md             → Sistema de alertas
│
├── ══════ ESTADO DO SISTEMA ══════
├── ESTADO-SISTEMA-JANEIRO-2026.md→ Estado atual
├── SISTEMA-COMPLETO-JANEIRO-2026.md → Sistema completo
├── AVALIACAO-SISTEMA-JANEIRO-2026.md → Avaliação
├── TECH-LEAD-BRIEFING-2026-01-10.md → Briefing tech lead
├── ONDE-ESTOU-AGORA.md           → Onde estou agora
├── MAPA-PROJETO.md               → Este arquivo
│
├── ══════ DADOS E MODELOS ══════
├── MODELO-DADOS-COMPLETO.md      → Modelo de dados
├── GLOSSARIO-TECNICO.md          → Glossário técnico
├── CASO-DE-USO-CANONICO.md       → Caso de uso canônico
│
├── ══════ TESTES ══════
├── TEST-COVERAGE-REPORT.md       → Relatório de cobertura
├── TESTE-MANUAL-IDENTITY-FLOW.md → Teste manual de identity
│
├── ══════ MIGRAÇÃO ══════
├── SCE-MIGRATION-PLAN.md         → Plano de migração SCE
│
├── ══════ ROADMAP ══════
├── ROADMAP-2026.md               → Roadmap 2026
├── VALOR-E-POSICIONAMENTO.md     → Valor e posicionamento
│
├── ══════ DIDÁTICO ══════
├── CADERNO-DIDATICO-PROST-QS.md  → Caderno didático
├── OPERATION_LOG_DAY_1.md        → Log de operação dia 1
├── README.md                     → Índice da documentação
│
├── ══════ SUBPASTAS ══════
├── agents/                       → Documentação de agentes
├── billing/                      → Documentação de billing
├── checkpoints/                  → Checkpoints do projeto
├── deploy/                       → Guias de deploy
├── fases/                        → Documentação por fase
└── guias/                        → Guias diversos
```

**Total: 40+ documentos organizados por categoria**

---

## 🔗 ARQUITETURA DE COMUNICAÇÃO

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USUÁRIOS                                     │
└─────────────────────────────────────────────────────────────────────┘
                    │                    │                    │
                    ▼                    ▼                    ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   VOX BRID (APP-1)  │  │   SCE Platform      │  │   Dashboard Admin   │
│   React + Vite      │  │   Next.js           │  │   Next.js           │
│   Vercel ✅         │  │   Vercel ✅         │  │   Vercel ✅         │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
          │                        │                        │
          │ prostqs-client.js      │ kernel-client.ts       │ api.ts
          ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐            │
│   VOX BRID Backend  │  │   SCE Backend       │            │
│   Node.js + Express │  │   Node.js + TS      │            │
│   Render ✅         │  │   Render ✅         │            │
└─────────────────────┘  └─────────────────────┘            │
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     KERNEL (Backend Go)                              │
│                     https://uno0826.onrender.com                     │
│                     Render ✅                                        │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   Auth   │ │ Identity │ │ Billing  │ │  Rules   │ │   Ads    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Telemetry │ │  Audit   │ │ Secrets  │ │   Risk   │ │ Immunity │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                           + 26 módulos                              │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NEON (PostgreSQL)                                │
│                     Banco de dados gerenciado                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 FLUXO DE AUTENTICAÇÃO

```
1. Usuário acessa VOX BRID ou SCE
2. App redireciona para Kernel OAuth
3. Kernel autentica (Google/GitHub/Email)
4. Kernel retorna JWT com identity federada
5. App usa JWT para todas as requisições
6. Kernel valida JWT e retorna dados
```

---

## 📊 FLUXO DE TELEMETRIA

```
App (VOX BRID/SCE) → POST /api/v1/telemetry → Kernel → PostgreSQL
                                                  ↓
                                           Dashboard Admin
                                           (visualização)
```

---

## 🌐 URLS DE PRODUÇÃO

| Serviço | URL | Hospedagem |
|---------|-----|------------|
| **Backend (Kernel)** | https://uno0826.onrender.com | Render |
| **Frontend (Dashboard)** | https://frontend-prost.vercel.app | Vercel |
| **VOX BRID Backend** | (Render) | Render |
| **VOX BRID Frontend** | (Vercel) | Vercel |
| **SCE Backend** | (Render) | Render |
| **SCE Frontend** | (Vercel) | Vercel |
| **Banco de Dados** | (interno) | Neon |
| **CI/CD** | GitHub Actions | GitHub |

---

## 🔄 FLUXO DE DEPLOY

```
Você: git push (ou .\scripts\deploy.ps1 "mensagem")
  ↓
GitHub Actions: valida código (lint, test)
  ↓
Render: deploya backend automaticamente
Vercel: deploya frontend automaticamente
  ↓
Produção atualizada!
```

---

## 🔌 ENDPOINTS PRINCIPAIS DA API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/v1/auth/login` | POST | Login OAuth |
| `/api/v1/auth/me` | GET | Dados do usuário |
| `/api/v1/apps` | GET/POST | Listar/criar apps |
| `/api/v1/apps/:id` | GET/PUT/DELETE | CRUD de app |
| `/api/v1/identity/link` | POST | Linkar identidade |
| `/api/v1/billing/plans` | GET | Listar planos |
| `/api/v1/billing/subscribe` | POST | Assinar plano |
| `/api/v1/rules` | GET/POST | Motor de regras |
| `/api/v1/rules/evaluate` | POST | Avaliar regra |
| `/api/v1/telemetry` | POST | Enviar telemetria |
| `/api/v1/telemetry/query` | POST | Consultar telemetria |
| `/api/v1/ads/decide` | POST | Leilão de ads (RTB) |
| `/api/v1/ads/track/:id` | GET | Tracking de impressão |
| `/api/v1/secrets` | GET/POST | Gestão de secrets |
| `/api/v1/audit` | GET | Logs de auditoria |
| `/api/v1/notifications` | GET | Notificações |
| `/api/v1/health` | GET | Health check |
| `/api/v1/invariants` | GET | Status de invariantes |
| `/api/v1/immunity/status` | GET | Status do sistema imunológico |

---

## 📋 RESUMO RÁPIDO

| Pasta | O que é | Status | Onde |
|-------|---------|--------|------|
| `backend/` | Kernel Go | ✅ Produção | Render |
| `frontend/` | Dashboard Next.js | ✅ Produção | Vercel |
| `apps/APP-1/` | VOX BRID (chat/video) | ✅ Produção | Render + Vercel |
| `apps/SCE/` | SCE Platform (deploy) | ✅ Produção | Render + Vercel |
| `apps/APP-2/` | Reservado | ⚪ Vazio | - |
| `frontend-old/` | Admin legado | ❌ Não usar | - |
| `sdk/` | SDK JavaScript | 🟡 Pronto | npm (futuro) |
| `docs/` | Documentação | ✅ Atualizado | - |
| `scripts/` | Automação | ✅ Atualizado | - |

---

## 🛡️ SISTEMAS ESPECIAIS

### Sistema Imunológico (`pkg/immunity/`)
```
immunity/
├── immunity.go           → Core do sistema
├── anomaly_detection.go  → Detecção de anomalias
├── auto_healing.go       → Auto-recuperação
├── circuit_breaker.go    → Circuit breaker
├── quarantine.go         → Quarentena de recursos
├── self_defense.go       → Auto-defesa
├── alert_escalation.go   → Escalação de alertas
├── integrations.go       → Integrações externas
└── handler.go            → HTTP handlers
```

### Sistema de Invariantes (`pkg/invariants/`)
```
invariants/
├── invariants.go              → Core
├── handler.go                 → HTTP handlers
├── api_invariants.go          → Invariantes de API
├── application_invariants.go  → Invariantes de apps
├── audit_invariants.go        → Invariantes de auditoria
├── billing_invariants.go      → Invariantes de billing
├── data_invariants.go         → Invariantes de dados
├── execution_invariants.go    → Invariantes de execução
├── rules_invariants.go        → Invariantes de regras
├── secrets_invariants.go      → Invariantes de secrets
├── telemetry_invariants.go    → Invariantes de telemetria
├── webhook_invariants.go      → Invariantes de webhooks
└── ads_invariants.go          → Invariantes de ads
```

### War Room Observability (`pkg/warobs/`)
```
warobs/
├── warobs.go         → Core
├── handler.go        → HTTP handlers
├── middleware.go     → Middleware de observabilidade
├── red_metrics.go    → Métricas RED (Rate, Errors, Duration)
├── sli_slo.go        → SLI/SLO tracking
├── pressure.go       → Pressão do sistema
└── tracer.go         → Distributed tracing
```

### API Gate (`pkg/apigate/`)
```
apigate/
├── api_gate.go           → Core
├── handler.go            → HTTP handlers
├── request_validator.go  → Validação de requests
└── input_sanitizer.go    → Sanitização de inputs
```

### Sistema de Alertas (`pkg/alerting/`)
```
alerting/
├── alert_engine.go   → Motor de alertas
├── channels.go       → Canais (email, slack, webhook)
├── config.go         → Configuração
├── handler.go        → HTTP handlers
├── integrations.go   → Integrações
├── metrics.go        → Métricas
├── monitor.go        → Monitor
└── persistence.go    → Persistência
```

---

*Última atualização: Janeiro 2026*

---

## 🔧 VARIÁVEIS DE AMBIENTE

### Backend (Render)
```env
DATABASE_URL=postgresql://...@neon.tech/...
JWT_SECRET=...
GIN_MODE=release              # Bloqueia rotas de debug
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://uno0826.onrender.com/api/v1
```

### Apps (VOX BRID / SCE)
```env
PROSTQS_API_URL=https://uno0826.onrender.com/api/v1
PROSTQS_APP_ID=<uuid-do-app>
PROSTQS_APP_SECRET=<secret-do-app>
```

---

## 📁 ARQUIVOS DE CONFIGURAÇÃO

| Arquivo | Onde | O que faz |
|---------|------|-----------|
| `vercel.json` | Raiz | Config do Vercel (auto-deploy) |
| `render.yaml` | Raiz | Config do Render (blueprint) |
| `fly.toml` | Raiz | Config do Fly.io (alternativo) |
| `docker-compose.yml` | Raiz | Dev local com Docker |
| `.github/workflows/ci.yml` | GitHub | CI/CD pipeline |
| `backend/.env` | Backend | Variáveis locais |
| `frontend/.env.local` | Frontend | Variáveis locais |

---

## 🗄️ BANCO DE DADOS

### Estrutura Principal (Kernel)
```
PostgreSQL (Neon)
├── users                    → Usuários do sistema
├── applications             → Apps registrados
├── app_users                → Usuários por app (identidade federada)
├── subscriptions            → Assinaturas de planos
├── billing_events           → Eventos de billing
├── rules                    → Regras dinâmicas
├── rule_evaluations         → Avaliações de regras
├── telemetry_events         → Eventos de telemetria
├── audit_logs               → Logs de auditoria
├── notifications            → Notificações
├── secrets                  → Secrets criptografados
├── ad_accounts              → Contas de anúncios
├── ad_campaigns             → Campanhas
├── ad_creatives             → Criativos
├── ad_slots                 → Slots de anúncio
├── ad_impressions           → Impressões
├── ad_clicks                → Cliques
├── webhooks                 → Webhooks configurados
├── webhook_deliveries       → Entregas de webhook
├── killswitch_states        → Estados do killswitch
├── approval_requests        → Solicitações de aprovação
└── ...                      → +20 tabelas
```

### Conexão
```go
// backend/pkg/db/postgres.go
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require
```

---

## 🔐 SISTEMA DE PLANOS

| Plano | Preço | Limites |
|-------|-------|---------|
| **Free** | R$0 | 1 app, 1k eventos/mês, 100 usuários |
| **Starter** | R$49 | 3 apps, 10k eventos/mês, 1k usuários |
| **Pro** | R$199 | 10 apps, 100k eventos/mês, 10k usuários |
| **Enterprise** | Custom | Ilimitado |

**Capabilities por plano:**
- Free: identity, telemetry_basic
- Starter: + rules_basic, webhooks
- Pro: + rules_advanced, ads, secrets
- Enterprise: + custom_integrations, sla

---

## 🧪 TESTES

### Backend (Go)
```bash
cd backend
go test ./... -v                    # Todos os testes
go test ./internal/billing/... -v   # Testes de billing
go test -cover ./...                # Com cobertura
```

### Frontend (Next.js)
```bash
cd frontend
npm test                            # Testes unitários
npm run test:e2e                    # Testes E2E
```

### Cobertura Atual
- Backend: ~75% (ver TEST-COVERAGE-REPORT.md)
- Frontend: ~60%
- Invariantes: 100% testados


---

## ⚡ COMANDOS ÚTEIS

### Deploy
```powershell
# Deploy completo (Windows)
.\scripts\deploy.ps1 "mensagem do commit"

# Deploy manual
git add .
git commit -m "mensagem"
git push origin main
```

### Backend (Go)
```powershell
cd backend

# Rodar localmente
go run cmd/api/main.go

# Build
go build -o api.exe cmd/api/main.go

# Testes
go test ./... -v

# Seed de dados
go run scripts/seed_ads.go
go run scripts/seed_rules.go
```

### Frontend (Next.js)
```powershell
cd frontend

# Dev
npm run dev

# Build
npm run build

# Lint
npm run lint
```

### Docker
```powershell
# Dev local completo
docker-compose up -d

# Apenas banco
docker-compose up -d postgres

# Logs
docker-compose logs -f backend
```

### Banco de Dados
```powershell
# Conectar ao Neon (via psql)
psql $DATABASE_URL

# Migrations (se usar)
go run scripts/migrate.go
```

---

## 📞 CONTATOS E RECURSOS

| Recurso | Link |
|---------|------|
| **Render Dashboard** | https://dashboard.render.com |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Neon Console** | https://console.neon.tech |
| **GitHub Repo** | (seu repositório) |
| **Stripe Dashboard** | https://dashboard.stripe.com |

---

## 🎯 PRÓXIMOS PASSOS

1. [ ] Preencher URLs específicas do VOX BRID e SCE
2. [ ] Documentar webhooks configurados
3. [ ] Adicionar métricas de produção
4. [ ] Criar runbook de incidentes
5. [ ] Documentar processo de rollback

---

*Documento gerado e mantido automaticamente. Última atualização: Janeiro 2026*
