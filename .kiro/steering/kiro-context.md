---
inclusion: always
---

# Contexto Permanente - PROST-QS

## O que é PROST-QS

Sistema soberano de infraestrutura multi-app com kernel central que gerencia identidade, billing, regras, telemetria, auditoria e decisões em tempo real. Arquitetura sovereign mesh com local-first capabilities.

## Stack Principal

**Backend**: Go (Gin framework) + PostgreSQL/SQLite
**Frontend**: Next.js (TypeScript) + React
**Apps**: 11 aplicações (APP-1 a APP-11, SCE) com integração ao kernel
**Infraestrutura**: Oracle Cloud, Docker, Kubernetes-ready

## Componentes Críticos do Kernel

- **Identity**: Multi-app auth, sessões, MFA
- **Billing**: Stripe integration, subscription states, metering
- **Rules**: Policy engine (Shadow/Authority), decision integration
- **Telemetry**: Metrics, tracing, observability
- **Audit**: Compliance logging, immutable records
- **Decisions**: Real-time decision engine com invariants
- **Capabilities**: Feature gates, plan-based access control
- **Webhooks**: Event distribution, integrations
- **Invariants**: Runtime safety checks (billing, audit, secrets, execution, etc)

## Arquitetura de Segurança

- **WAF (Fase 1)**: API Gate com sanitização
- **API Gate (Fase 2)**: Request validation, rate limiting
- **WAR Observability (Fase 3)**: Distributed tracing, SLI/SLO
- **Alerting (Fase 4)**: Anomaly detection, escalation
- **Immunity System**: Self-defense, circuit breakers, quarantine
- **Threat Model**: Sovereign mesh com mitigações específicas

## Apps Principais

- **APP-1**: Chat/Messaging com video (Voxgrid)
- **APP-2**: Nexus (P2P, Lighthouse integration)
- **APP-3**: Prost-QS Core (Auditoria, Trilhões)
- **APP-10**: Aether Prime (Gemini, Policy Memory)
- **SCE**: Sovereign Cloud Engine (Deployment, Projects)

## Padrões Críticos

- Invariants como source of truth para segurança
- Decision engine integrado com rules/billing/killswitch
- Local-first com sync para cloud
- Multi-tenant com isolamento rigoroso
- Event-driven architecture com webhooks

## Estrutura de Pastas

```
UNO-main/
├── backend/          # Kernel Go
├── frontend/         # Dashboard Next.js
├── apps/            # 11 aplicações
├── docs/            # Documentação técnica
├── sdk/             # SDK TypeScript
└── .kiro/steering/  # Guias de desenvolvimento
```

## Convenções de Código

- Go: handlers → services → models
- TypeScript: components → hooks → services
- Testes: *_test.go, *_test.ts obrigatórios
- Migrations: SQL versionadas em backend/scripts/migrations/
- Invariants: Sempre validar em pkg/invariants/

## Estado Atual (Janeiro 2026)

- Kernel congelado (KERNEL-FREEZE-2026-01-12)
- Security hardening completo
- Lighthouse integration ativa
- Billing com Stripe funcional
- Observability em produção
- 11 apps integradas ao kernel

## Próximos Passos

- Deploy Oracle Cloud
- Otimizações enterprise
- Chaos engineering
- Expansão de capabilities
