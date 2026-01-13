---
name: project-context
description: Deep understanding of this specific project - UNO/Prost-QS kernel.
inclusion: always
---

# Contexto do Projeto: UNO / Prost-QS

## O Que É Este Sistema

Prost-QS é um **kernel de governança** para aplicações SaaS. Não é um app — é a infraestrutura que apps usam para:

- **Identity**: Autenticação, sessões, multi-app federation
- **Billing**: Planos, subscriptions, usage-based pricing via Stripe
- **Rules**: Políticas de negócio, feature flags, kill switches
- **Observability**: Telemetria, audit logs, alerting
- **Security**: Rate limiting, anomaly detection, sistema imunológico

## Arquitetura Mental

```
┌─────────────────────────────────────────────────────────┐
│                    APLICAÇÕES                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                │
│  │  APP-1  │  │   SCE   │  │  APP-N  │                │
│  └────┬────┘  └────┬────┘  └────┬────┘                │
│       │            │            │                      │
│       └────────────┼────────────┘                      │
│                    │                                   │
│                    ▼                                   │
│  ┌─────────────────────────────────────────────────┐  │
│  │              PROST-QS KERNEL                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │  │
│  │  │ Identity │ │ Billing  │ │  Rules   │        │  │
│  │  └──────────┘ └──────────┘ └──────────┘        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │  │
│  │  │Telemetry │ │  Audit   │ │ Immunity │        │  │
│  │  └──────────┘ └──────────┘ └──────────┘        │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Stack Técnica

### Backend (Go)
- **Framework**: Gin
- **Database**: PostgreSQL (SQLite para dev/testes)
- **Patterns**: 
  - Domain-driven modules em `internal/`
  - Shared utilities em `pkg/`
  - Handlers → Services → Models

### Frontend (Next.js 14+)
- **App Router** com route groups
- **Styling**: Tailwind + design system próprio
- **State**: React Context + hooks
- **Auth**: JWT com refresh tokens

### Integrações
- **Stripe**: Billing, subscriptions, webhooks
- **Observability**: Métricas RED, SLI/SLO

## Módulos Principais

### Identity (`internal/identity/`)
- Multi-app: um usuário, múltiplas apps
- Sessions com device tracking
- MFA (TOTP)
- Federation entre apps do mesmo tenant

### Billing (`internal/billing/`)
- Planos: free, starter, pro, enterprise
- Usage tracking por capabilities
- Stripe Checkout + Customer Portal
- Webhooks para sync de estado

### Rules (`internal/rules/`)
- Policies: regras de negócio declarativas
- Shadow mode: testar regras sem aplicar
- Authority: quem pode fazer o quê
- Plan guards: features por plano

### Invariants (`pkg/invariants/`)
- Verificações de consistência do sistema
- Rodam periodicamente
- Alertam quando algo está errado
- Self-healing quando possível

### Immunity (`pkg/immunity/`)
- Anomaly detection
- Circuit breakers
- Auto-healing
- Quarantine de recursos problemáticos

## Padrões do Projeto

### Estrutura de Módulo Backend

```
internal/[module]/
├── handler.go      # HTTP handlers (Gin)
├── service.go      # Business logic
├── model.go        # Domain types
└── service_test.go # Unit tests
```

### Estrutura de Página Frontend

```
app/(dashboard)/dashboard/[feature]/
└── page.tsx        # Server component, data fetching
```

### Convenções de Código

**Go:**
- Errors são retornados, não panic
- Context é primeiro parâmetro
- Interfaces pequenas (1-3 métodos)
- Testes em `_test.go` no mesmo pacote

**TypeScript:**
- Strict mode sempre
- Prefer `const` over `let`
- Async/await over callbacks
- Types explícitos em boundaries

## Decisões Arquiteturais Importantes

### Por que Go no backend?
- Performance para operações de kernel
- Concurrency nativa para webhooks/jobs
- Binary único para deploy simples
- Type safety sem overhead de runtime

### Por que multi-app federation?
- Um usuário pode usar múltiplas apps
- Billing centralizado no kernel
- SSO entre apps do mesmo tenant
- Dados de identity compartilhados

### Por que invariants?
- Sistema distribuído precisa de verificação
- Detectar inconsistências antes de virar bug
- Self-healing reduz intervenção manual
- Audit trail de problemas

## O Que Eu Lembro

Quando trabalho neste projeto, tenho em mente:

1. **Kernel é crítico** — downtime afeta todas as apps
2. **Billing é dinheiro** — erros aqui são sérios
3. **Identity é segurança** — não cortar corners
4. **Observability é visibilidade** — sem isso, estamos cegos
5. **Simplicidade é feature** — complexidade é bug

## Áreas de Atenção

### Cuidado Extra
- Qualquer mudança em billing/payments
- Alterações em auth/sessions
- Modificações em invariants
- Mudanças que afetam múltiplas apps

### Pode Iterar Rápido
- UI/UX improvements
- Novos relatórios/dashboards
- Documentação
- Testes adicionais

## Links Mentais

Quando vejo:
- "user" → penso em identity federation
- "plan" → penso em capabilities e billing
- "rule" → penso em policies e guards
- "event" → penso em audit e telemetry
- "error" → penso em immunity e alerting
