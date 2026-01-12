# PROST-QS — Documentação Completa do Sistema

> **Data:** 11 de Janeiro de 2026  
> **Versão:** 1.0  
> **Status:** 85-90% Completo  
> **Equivalente Comercial:** WorkOS + Clerk + Stigg + LaunchDarkly (~$1500/mês)

---

## 🎯 O Que É o PROST-QS?

O PROST-QS é um **Kernel de Plataforma Soberano** — uma infraestrutura completa para construir e operar aplicações SaaS com:

- **Identity Soberana** — Autenticação, verificação, SSO multi-app
- **Billing Integrado** — Stripe, planos, assinaturas, cobrança por uso
- **Governança Completa** — Políticas, aprovações, auditoria, kill switch
- **Observabilidade de Guerra** — Métricas RED, SLO/SLI, alertas inteligentes
- **Sistema Imunológico** — Auto-defesa, circuit breakers, quarentena

---

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEIRA (FASE 1)                              │
│                         Cloudflare WAF + Rate Limit                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATE (FASE 2)                               │
│              Validação Estrutural • SQL/XSS Detection • Sanitização          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WAR OBSERVABILITY (FASE 3)                           │
│                    RED Metrics • Pressure • SLO/SLI • Tracing                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ALERTING (FASE 4)                               │
│              Deduplicação • Canais • Persistência • Prometheus               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           IMMUNITY SYSTEM                                    │
│         Circuit Breaker • Quarantine • Auto-Healing • Self-Defense           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              KERNEL CORE                                     │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   IDENTITY   │  │   BILLING    │  │  GOVERNANCE  │  │   ECONOMIC   │     │
│  │              │  │              │  │              │  │              │     │
│  │ • Auth       │  │ • Stripe     │  │ • Policies   │  │ • Financial  │     │
│  │ • Users      │  │ • Plans      │  │ • Approval   │  │ • Reconcile  │     │
│  │ • Federation │  │ • Usage      │  │ • Audit      │  │ • Idempotent │     │
│  │ • Multi-App  │  │ • Webhooks   │  │ • KillSwitch │  │ • Alerts     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    AGENTS    │  │   OBSERVER   │  │  EXPLAINAB.  │  │   SECRETS    │     │
│  │              │  │              │  │              │  │              │     │
│  │ • Autonomy   │  │ • Cognitive  │  │ • Timeline   │  │ • Encrypted  │     │
│  │ • Shadow     │  │ • Memory     │  │ • Intellig.  │  │ • Per-App    │     │
│  │ • Authority  │  │ • Human Loop │  │ • Risk       │  │ • Rotation   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATIONS                                    │
│                                                                              │
│         APP-1 (Chat)          SCE (Deploy)          APP-2 (Future)          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Módulos do Backend

### 🔐 IDENTITY KERNEL

| Módulo | Descrição | Status |
|--------|-----------|--------|
| `identity` | Usuários, verificação, login events, multi-app | ✅ Completo |
| `auth` | Autenticação JWT, refresh tokens | ✅ Completo |
| `federation` | OAuth (Google), SSO externo | ✅ Completo |

**Funcionalidades:**
- Verificação por email (código 6 dígitos)
- Login implícito (sem senha)
- Multi-app identity (1 usuário → N apps)
- Login events tracking
- Capabilities por usuário

### 💰 BILLING KERNEL

| Módulo | Descrição | Status |
|--------|-----------|--------|
| `billing` | Planos, assinaturas, Stripe | ✅ Completo |
| `kernel_billing` | Cobrança do kernel para apps | ✅ Completo |
| `financial` | Pipeline financeiro, reconciliação | ✅ Completo |
| `payment` | Processamento de pagamentos | ✅ Completo |

**Funcionalidades:**
- Integração Stripe completa
- Planos: Free, Starter, Pro, Enterprise
- Webhooks com idempotência absoluta
- Reconciliação automática
- Alertas financeiros
- Rate limiting por app

### 🏛️ GOVERNANCE KERNEL

| Módulo | Descrição | Status |
|--------|-----------|--------|
| `policy` | Engine de políticas | ✅ Completo |
| `approval` | Workflow de aprovações | ✅ Completo |
| `audit` | Log de auditoria imutável | ✅ Completo |
| `killswitch` | Desligamento de emergência | ✅ Completo |
| `authority` | Quem pode aprovar o quê | ✅ Completo |

**Funcionalidades:**
- Políticas configuráveis por ação
- Aprovação multi-nível
- Audit trail completo
- Kill switch com expiração
- Authority matrix

### 🤖 AGENT GOVERNANCE

| Módulo | Descrição | Status |
|--------|-----------|--------|
| `agent` | Agentes autônomos governados | ✅ Completo |
| `autonomy` | Matriz de autonomia | ✅ Completo |
| `shadow` | Modo shadow (simula sem executar) | ✅ Completo |

**Funcionalidades:**
- Agentes com níveis de autonomia
- Shadow mode para testes
- Governança integrada
- Memory institucional

### 👁️ OBSERVER SYSTEM

| Módulo | Descrição | Status |
|--------|-----------|--------|
| `observer` | Agentes observadores | ✅ Completo |
| `memory` | Memória de agentes | ✅ Completo |
| `explainability` | Timeline de decisões | ✅ Completo |

**Funcionalidades:**
- Cognitive Dashboard (read-only)
- Agent Memory
- Human-in-the-Loop Console
- Decision Timeline
- Intelligence Service

### 📊 OBSERVABILITY

| Módulo | Descrição | Status |
|--------|-----------|--------|
| `observability` | Métricas básicas, request ID | ✅ Completo |
| `telemetry` | Telemetria de apps | ✅ Completo |
| `health` | Health checks | ✅ Completo |

### 🔧 OUTROS MÓDULOS

| Módulo | Descrição | Status |
|--------|-----------|--------|
| `application` | Gestão de apps conectados | ✅ Completo |
| `secrets` | Segredos criptografados | ✅ Completo |
| `risk` | Scoring de risco | ✅ Completo |
| `rules` | Engine de regras | ✅ Completo |
| `notification` | Sistema de notificações | ✅ Completo |
| `narrative` | Narrativa do sistema | ✅ Completo |
| `usage` | Tracking de uso | ✅ Completo |
| `jobs` | Fila de jobs interna | ✅ Completo |
| `ads` | Módulo de anúncios | ✅ Completo |
| `ai` | Integração AI | ✅ Completo |
| `command` | Comandos do sistema | ✅ Completo |
| `event` | Sistema de eventos | ✅ Completo |
| `replication` | Replicação de estado | ✅ Completo |

---

## 📦 Packages Compartilhados (pkg/)

### 🛡️ ESCALA MODE — Sistema de Defesa

| Package | Descrição | Testes |
|---------|-----------|--------|
| `apigate` | FASE 2: Validação estrutural, SQL/XSS detection | 59 |
| `warobs` | FASE 3: RED metrics, pressure, SLO/SLI, tracing | 12 |
| `alerting` | FASE 4: Alertas inteligentes, Prometheus | 34 |
| `immunity` | Sistema imunológico completo | 51 |

### 🔧 INFRAESTRUTURA

| Package | Descrição |
|---------|-----------|
| `db` | PostgreSQL + SQLite, migrations |
| `middleware` | Auth, rate limit, CORS, subscription guard |
| `utils` | JWT, AES encryption, helpers |
| `capabilities` | Entitlements, feature flags |
| `invariants` | Invariantes de sistema |
| `resilience` | Circuit breaker, retry |
| `statemachine` | State machines (subscription) |

---

## 🛡️ ESCALA MODE — 4 Fases de Defesa

### FASE 1: WAF + Fronteira (Cloudflare)
- Rate limit por identity (não só IP)
- Webhooks IP allowlist (Stripe)
- Geo-blocking opcional
- **Status:** Documentação pronta, aguarda execução manual

### FASE 2: API Gate ✅
- Limite de payload por endpoint
- Validação de estrutura JSON
- Detecção de SQL injection
- Detecção de XSS
- Detecção de path traversal
- **59 testes passando**

### FASE 3: War Observability ✅
- RED Metrics (Rate, Errors, Duration)
- Pressure Indicators (4 níveis, 4 componentes)
- SLO/SLI Tracking com Error Budget
- Distributed Tracing
- **12 testes passando**

### FASE 4: Alerting ✅
- Alert Engine com deduplicação
- Canais: Log, Slack, PagerDuty, Webhook
- Persistência em PostgreSQL
- Configuração via ENV
- Métricas Prometheus
- **34 testes passando**

---

## 🧬 Sistema Imunológico

```
┌─────────────────────────────────────────────────────────────────┐
│                     IMMUNITY SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ AUTO-HEALING │    │   CIRCUIT    │    │  QUARANTINE  │       │
│  │              │    │   BREAKER    │    │              │       │
│  │ • Retry      │    │ • Open/Close │    │ • Isolate    │       │
│  │ • Backoff    │    │ • Half-Open  │    │ • Timeout    │       │
│  │ • Recovery   │    │ • Threshold  │    │ • Release    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ SELF-DEFENSE │    │   ANOMALY    │    │    ALERT     │       │
│  │              │    │  DETECTION   │    │  ESCALATION  │       │
│  │ • Attack Det │    │ • Baseline   │    │ • Severity   │       │
│  │ • Block      │    │ • Deviation  │    │ • Channels   │       │
│  │ • Report     │    │ • Patterns   │    │ • Cooldown   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**51 testes passando**

---

## 🖥️ Frontend

### Dashboard Principal (Next.js)
- `/dashboard` — Overview do sistema
- `/dashboard/apps` — Gestão de aplicações
- `/dashboard/billing` — Planos e assinaturas
- `/dashboard/audit` — Log de auditoria
- `/dashboard/policies` — Políticas
- `/dashboard/killswitch` — Kill switches
- `/dashboard/agents` — Agentes
- `/dashboard/approvals` — Aprovações
- `/dashboard/secrets` — Segredos
- `/dashboard/telemetry` — Telemetria
- `/dashboard/rules` — Regras
- `/dashboard/risk` — Scoring de risco
- `/dashboard/immunity` — Sistema imunológico
- `/dashboard/status` — Status page
- `/dashboard/notifications` — Notificações
- `/dashboard/usage` — Uso
- `/dashboard/timeline` — Timeline de decisões
- `/dashboard/memory` — Memória institucional
- `/dashboard/shadow` — Shadow mode
- `/dashboard/authority` — Authority matrix
- `/dashboard/observer` — Observer agents
- `/dashboard/capabilities` — Capabilities
- `/dashboard/events` — Eventos
- `/dashboard/webhooks` — Webhooks
- `/dashboard/invariants` — Invariantes

### Admin Pages
- `/dashboard/admin/cognitive` — Cognitive Dashboard
- `/dashboard/admin/financial` — Financial Dashboard
- `/dashboard/admin/reconciliation` — Reconciliação
- `/dashboard/admin/intelligence` — Intelligence

### Docs
- `/docs` — Documentação
- `/docs/quickstart` — Quick Start
- `/docs/concepts/*` — Conceitos
- `/docs/api/v1` — API Reference

---

## 📊 Métricas do Sistema

### Testes
| Componente | Testes |
|------------|--------|
| API Gate | 59 |
| Immunity | 51 |
| Alerting | 34 |
| War Observability | 12 |
| **Total ESCALA MODE** | **156** |

### Cobertura Estimada
- Backend: ~95% funcional
- Frontend: ~80% funcional
- Infraestrutura: ~90% funcional

---

## 🔌 API Endpoints Principais

### Identity
```
POST /api/v1/auth/verify/start     — Iniciar verificação
POST /api/v1/auth/verify/complete  — Completar verificação
POST /api/v1/auth/login            — Login
POST /api/v1/auth/refresh          — Refresh token
GET  /api/v1/identity/me           — Usuário atual
```

### Billing
```
GET  /api/v1/billing/plans         — Listar planos
POST /api/v1/billing/subscribe     — Assinar plano
GET  /api/v1/billing/subscription  — Assinatura atual
POST /api/v1/billing/portal        — Portal Stripe
```

### Applications
```
GET  /api/v1/applications          — Listar apps
POST /api/v1/applications          — Criar app
GET  /api/v1/applications/:id      — Detalhes
```

### Governance
```
GET  /api/v1/policies              — Listar políticas
GET  /api/v1/audit                 — Log de auditoria
GET  /api/v1/killswitch            — Kill switches
POST /api/v1/approvals/:id/approve — Aprovar
```

### Observability
```
GET  /health                       — Health check
GET  /ready                        — Readiness
GET  /metrics/basic                — Métricas básicas
GET  /api/v1/warobs/dashboard      — War Observability
GET  /api/v1/alerts                — Alertas
GET  /api/v1/alerts/metrics/prometheus — Prometheus
```

### Immunity
```
GET  /api/v1/immunity/status       — Status do sistema
GET  /api/v1/immunity/circuits     — Circuit breakers
GET  /api/v1/immunity/quarantine   — Quarentena
```

---

## 🚀 Deploy

### Produção
- **Backend:** Render (Go)
- **Frontend:** Vercel (Next.js)
- **Database:** Neon (PostgreSQL)
- **CDN/WAF:** Cloudflare

### Variáveis de Ambiente Críticas
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
AES_SECRET_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

---

## 📈 Comparação com Mercado

| Funcionalidade | PROST-QS | WorkOS | Clerk | Stigg |
|----------------|----------|--------|-------|-------|
| Identity/Auth | ✅ | ✅ | ✅ | ❌ |
| Multi-App SSO | ✅ | ✅ | ✅ | ❌ |
| Billing/Stripe | ✅ | ❌ | ❌ | ✅ |
| Feature Flags | ✅ | ❌ | ❌ | ✅ |
| Governance | ✅ | ❌ | ❌ | ❌ |
| Observability | ✅ | ❌ | ❌ | ❌ |
| Self-Defense | ✅ | ❌ | ❌ | ❌ |
| **Soberania** | ✅ | ❌ | ❌ | ❌ |

**Valor equivalente:** ~$1500/mês em SaaS

---

## ✅ O Que Está Pronto

1. ✅ Identity completa (auth, verification, multi-app)
2. ✅ Billing completo (Stripe, plans, webhooks)
3. ✅ Governance completa (policies, approval, audit, killswitch)
4. ✅ Agent Governance (autonomy, shadow, authority)
5. ✅ Observer System (cognitive, memory, human-loop)
6. ✅ ESCALA MODE (API Gate, War Obs, Alerting)
7. ✅ Immunity System (circuit breaker, quarantine, self-defense)
8. ✅ Financial Pipeline (reconciliation, idempotency, alerts)
9. ✅ Secrets Management (encrypted, per-app)
10. ✅ Frontend Dashboard (Next.js, todas as páginas)

---

## � Contratao Soberano (Swagger/OpenAPI)

O sistema agora possui documentação completa para integração por IAs e desenvolvedores:

### Endpoints de Documentação
- `/swagger/index.html` — Swagger UI interativo
- `/swagger/doc.json` — Especificação OpenAPI 3.0

### Arquivos
- `backend/docs/swagger.go` — Tipos e modelos
- `backend/docs/swagger_routes.go` — Documentação de rotas
- `backend/docs/swagger_handler.go` — Handler + OpenAPI JSON completo
- `backend/docs/openapi.json` — Especificação exportável
- `docs/KERNEL_INTEGRATION_GUIDE.md` — Guia para IAs

### Cobertura da Documentação
| Módulo | Endpoints Documentados |
|--------|------------------------|
| Identity | 6 endpoints |
| Billing | 5 endpoints |
| Governance | 3 endpoints |
| Immunity | 8 endpoints |
| Observability | 4 endpoints |

---

## 🔜 O Que Falta para 100%

| Item | Esforço | Prioridade | Status |
|------|---------|------------|--------|
| Executar FASE 1 (Cloudflare) | 1 dia | Alta | Pendente |
| CI/CD (GitHub Actions) | 1 dia | Alta | Pendente |
| Testes E2E | 2-3 dias | Média | Pendente |
| Swagger/OpenAPI | 1 dia | Média | ✅ Feito |
| Dashboards Grafana | 1 dia | Baixa | Pendente |

---

## 📁 Estrutura de Arquivos

```
UNO-main/
├── backend/
│   ├── cmd/api/main.go          # Entry point
│   ├── internal/                 # Módulos internos (36 módulos)
│   │   ├── identity/
│   │   ├── billing/
│   │   ├── governance/
│   │   └── ...
│   └── pkg/                      # Packages compartilhados (11 packages)
│       ├── alerting/
│       ├── apigate/
│       ├── immunity/
│       ├── warobs/
│       └── ...
├── frontend/                     # Next.js Dashboard
├── apps/
│   ├── APP-1/                    # App de Chat
│   ├── APP-2/                    # App futuro
│   └── SCE/                      # App de Deploy
└── docs/                         # Documentação
```

---

## 🎯 Conclusão

O PROST-QS é um **kernel de plataforma completo** que oferece:

- **Soberania total** — Código próprio, sem vendor lock-in
- **Segurança em camadas** — WAF → API Gate → Immunity
- **Observabilidade de guerra** — Saber exatamente o que está acontecendo
- **Governança real** — Políticas, aprovações, auditoria
- **Billing integrado** — Stripe com reconciliação automática

**Status: 85-90% pronto para produção.**

---

*Documento gerado em 11/01/2026*
