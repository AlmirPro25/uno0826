# BACKLOG TÉCNICO — PROST-QS / UNO.KERNEL

> O que falta fazer, organizado por prioridade e impacto.

**Última atualização:** 12 de Janeiro de 2026

---

## ✅ PROGRESSO RECENTE (12/01/2026)

```
IMPLEMENTADO HOJE:
├── [x] Decision Service - Registro de decisões do sistema
│   ├── backend/internal/decision/ (model, service, gin_handler)
│   ├── Rotas: /decisions, /decisions/critical, /decisions/stats
│   ├── Integrado no main.go
│   └── 22 testes passando (service_test.go)
│
├── [x] Decision Service Integrations
│   ├── billing/decision_integration.go - Registra decisões de pagamento
│   ├── killswitch/decision_integration.go - Registra decisões de killswitch
│   └── rules/decision_integration.go - Registra decisões de regras
│
├── [x] Invariants Runner - Guardião que nunca dorme
│   ├── backend/pkg/invariants/runner.go
│   ├── Executa a cada 5 minutos
│   ├── Persiste resultados em invariant_checks
│   └── Callback para violações
│
├── [x] Health Service com Invariants
│   ├── backend/internal/health/service.go
│   ├── backend/internal/health/handler.go (Gin)
│   └── Endpoints: /health, /health/live, /health/ready
│
├── [x] Frontend - Dashboard de Decisões
│   ├── frontend/src/app/(dashboard)/dashboard/decisions/page.tsx
│   └── Link adicionado ao sidebar (Governança)
│
├── [x] SDK Interno - Módulo de Decisions
│   └── sdk/internal/decisions.ts
│
├── [x] Migrations
│   ├── 20260112_create_decisions_table.sql
│   └── 20260112_create_invariant_checks_table.sql
│
├── [x] Error Classification (pkg/errors/errors.go)
│   ├── VALIDATION, BUSINESS, SYSTEM
│   ├── SECURITY, EXTERNAL, INVARIANT
│   └── Usado para observabilidade e alertas
│
└── [x] Billing Invariants Tests (27 testes)
    ├── pkg/invariants/billing_invariants_test.go
    ├── Testes de saldo, subscription, transação
    ├── Testes de webhook, payment intent, payout
    ├── Testes de reconciliação e fraude
    └── 100% passando
```

---

## 📊 VISÃO GERAL

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MATRIZ DE PRIORIDADE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   URGENTE + IMPORTANTE          │    IMPORTANTE (não urgente)       │
│   ─────────────────────         │    ─────────────────────          │
│   • Primeiro $1 (Stripe)        │    • CI/CD pipeline               │
│   • BUG-004: Kill switch ✅     │    • Testes (invariants first)    │
│   • Migração SCE → SSO          │    • APM/Observabilidade          │
│                                 │    • Ambiente staging             │
│                                 │                                   │
├─────────────────────────────────┼───────────────────────────────────┤
│                                 │                                   │
│   URGENTE (não importante)      │    NEM URGENTE NEM IMPORTANTE     │
│   ─────────────────────         │    ─────────────────────          │
│   • Bugs pontuais               │    • Refatorações estéticas       │
│   • Ajustes de UI               │    • Features "nice to have"      │
│   • Documentação faltante       │    • Otimizações prematuras       │
│                                 │                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔴 CRÍTICO (Fazer AGORA)

### 1. Primeiro $1 — Validação de Billing
**Status:** 🟡 Em progresso (Backend + Frontend prontos)  
**Impacto:** CRÍTICO  
**Esforço:** 30 min (só testar)  
**Documento:** [SPRINT-BILLING-PRIMEIRO-DOLAR.md](./SPRINT-BILLING-PRIMEIRO-DOLAR.md)

```
✅ IMPLEMENTADO:
├── [x] Backend: POST /billing/checkout/pro → Stripe Checkout
├── [x] Backend: POST /billing/portal → Stripe Customer Portal
├── [x] Backend: POST /billing/webhook → Webhook com idempotência
├── [x] Backend: client_reference_id para resolução determinística
├── [x] Frontend: Página de billing com botão "Upgrade para Pro"
├── [x] Frontend: Suspense boundary para useSearchParams
├── [x] Frontend: Toast de sucesso/cancelamento após redirect
├── [x] Testes: 6 testes de checkout passando
├── [x] Testes: 20+ testes de kernel_billing passando
└── [x] Build: Backend e Frontend compilando

⏳ PRÓXIMOS PASSOS (30 min):
├── [ ] Verificar webhook endpoint no Stripe Dashboard
├── [ ] Fazer login no frontend
├── [ ] Clicar em "Upgrade para Pro"
├── [ ] Usar cartão de teste 4242 4242 4242 4242
└── [ ] Verificar webhook processado nos logs do Render

URLS:
├── Frontend: https://frontend-prost.vercel.app/dashboard/billing
├── Backend: https://uno0826.onrender.com/api/v1/billing/webhook
└── Price ID: price_1SnMCgInQBs0OE9Df5OVQD5i (hardcoded)
```
├── [ ] 1 preço ($9.90)
├── [ ] 1 checkout funcionando
├── [ ] 1 webhook processando
└── [ ] 1 pagamento REAL (nem que seja $1 seu)

FASE 2 — Expansão (depois do primeiro $1):
├── [ ] Múltiplos planos
├── [ ] Ledger completo
├── [ ] Reconciliação
└── [ ] UI bonita

Regra de ouro: Se o dinheiro entrou UMA vez, o resto é engenharia.
```

---

### 2. BUG-004: Kill Switch Não Persiste (CRÍTICO+)
**Status:** ✅ CORRIGIDO  
**Impacto:** QUEBRA CONFIANÇA + SEGURANÇA  
**Esforço:** 1-2 horas

```
✅ CORRIGIDO em 12/01/2026

Problema: Kill switch não persistia após restart do servidor.

Correções aplicadas:
├── [x] Adicionado flag 'initialized' para tracking
├── [x] Adicionado 'lastRefresh' timestamp
├── [x] initializeCache() com retry (3 tentativas)
├── [x] ensureCacheLoaded() verifica se precisa recarregar
├── [x] Logging detalhado para debug
├── [x] refreshCacheInternal() com tratamento de erro
└── [x] Auto-refresh se cache > 5 minutos

Arquivos modificados:
- backend/internal/killswitch/service.go
```

---

### 3. Migração SCE → Identity SSO
**Status:** ⚠️ Código pronto, aguardando execução  
**Impacto:** ALTO (valida modelo multi-app)  
**Esforço:** 30 min (só executar scripts)

```
Por que é crítico:
├── Valida que o kernel é REAL
├── Valida que multi-app FUNCIONA
├── Transforma discurso teórico em prova

✅ CÓDIGO PRONTO:
├── [x] kernel-auth.middleware.ts — Middleware que só aceita JWT do Kernel
├── [x] routes/index.ts — Todas as rotas usando kernelAuthMiddleware
├── [x] auth.service.ts — Marcado como DEPRECATED
├── [x] migrate-users-to-kernel.ts — Script de migração
├── [x] post-migration-cleanup.ts — Script de limpeza
├── [x] schema.post-migration.prisma — Schema sem auth local

⏳ EXECUÇÃO PENDENTE (30 min):
├── [ ] Executar: KERNEL_ADMIN_TOKEN=xxx npx tsx scripts/migrate-users-to-kernel.ts --dry-run
├── [ ] Executar: KERNEL_ADMIN_TOKEN=xxx npx tsx scripts/migrate-users-to-kernel.ts
├── [ ] Executar: npx tsx scripts/post-migration-cleanup.ts
├── [ ] Deletar auth.service.ts
├── [ ] Remover bcrypt do package.json
└── [ ] Aplicar schema.post-migration.prisma
```

---

## 🟠 ALTA PRIORIDADE (Q1 2026)

### 4. Testes Automatizados
**Status:** ❌ 0% coverage  
**Impacto:** ALTO  
**Esforço:** 2-3 semanas  
**Meta:** >50% coverage

```
⚠️ AJUSTE ESTRATÉGICO: Começar pelos INVARIANTS, não pelos services.

Por quê invariants primeiro:
├── Já definem o "não pode acontecer"
├── Protegem refatoração
├── Reforçam narrativa única do sistema
├── São contratos, não implementação

ORDEM CORRETA:
1. Invariants (já existem, expandir testes)
   ├── [ ] billing_invariants_test.go
   ├── [ ] identity_invariants_test.go (criar)
   ├── [ ] rules_invariants_test.go
   └── [ ] telemetry_invariants_test.go

2. Casos de falha (o que NÃO pode acontecer)
   ├── [ ] Pagamento sem subscription
   ├── [ ] Acesso cross-app
   ├── [ ] Ledger desbalanceado
   └── [ ] Kill switch ignorado

3. Casos felizes (depois)
   ├── [ ] billing/service_test.go
   ├── [ ] identity/service_test.go
   └── [ ] rules/service_test.go
```

---

### 5. CI/CD Pipeline
**Status:** ❌ Deploy manual  
**Impacto:** ALTO  
**Esforço:** 1 semana

```
Tarefas:
├── [ ] Criar .github/workflows/ci.yml
├── [ ] Job: lint (golangci-lint, eslint)
├── [ ] Job: test (go test, jest)
├── [ ] Job: build (go build, next build)
├── [ ] Job: deploy staging (on PR merge)
├── [ ] Job: deploy production (on tag)
├── [ ] Secrets no GitHub (RENDER_API_KEY, etc.)
└── [ ] Badge de status no README
```

---

### 6. Observabilidade
**Status:** ❌ Básico  
**Impacto:** MÉDIO  
**Esforço:** 1 semana

```
⚠️ AJUSTE ESTRATÉGICO: Responder PERGUNTAS antes de escolher ferramenta.

PRIMEIRO, responder:
├── Quais 3 métricas matam o sistema se piorarem?
│   1. billing webhook failure rate
│   2. auth latency P95
│   3. invariant violation count
│
├── Quais 2 alertas acordariam você de madrugada?
│   1. Ledger desbalanceado
│   2. Kill switch ativado automaticamente
│
└── O que você olha primeiro quando algo quebra?
    1. Logs de erro
    2. Request rate
    3. Error rate

DEPOIS, escolher ferramenta (qualquer uma serve):
├── Grafana Cloud (free tier)
├── Datadog (trial)
└── New Relic (free tier)

Ferramenta antes de pergunta = dashboard inútil.
```

---

### 7. SDK Interno (Invisível)
**Status:** ⚠️ Parcial  
**Impacto:** MÉDIO  
**Esforço:** 1 semana

```
⚠️ AJUSTE ESTRATÉGICO: SDK interno AGORA, público depois.

Por quê SDK interno primeiro:
├── Força design de API limpo
├── Menos acoplamento
├── Menos gambiarra interna
├── Quando for público, só publica

Estrutura:
sdk/
├── internal/           # Usado por VOX e SCE
│   ├── identity.ts     # Login, register, session
│   ├── telemetry.ts    # Track, identify
│   ├── billing.ts      # Checkout, subscription
│   └── index.ts
└── public/             # Futuro npm package
    └── (vazio por enquanto)

Tarefas:
├── [ ] Criar sdk/internal/
├── [ ] Extrair código comum do VOX
├── [ ] Extrair código comum do SCE
├── [ ] Usar SDK interno nos dois apps
└── [ ] Documentar API interna
```

---

## 🟡 MÉDIA PRIORIDADE (Q2 2026)

### 8. Multi-Provider Billing
```
├── [ ] Abstração de PaymentProvider interface
├── [ ] Implementar MercadoPago provider
├── [ ] Implementar PagSeguro provider
└── [ ] Reconciliação entre providers
```

### 9. Performance e Cache
```
├── [ ] Setup Redis (Upstash ou Redis Cloud)
├── [ ] Cache de sessões
├── [ ] Cache de capabilities
└── [ ] Load testing (meta: 1000 req/s)
```

### 10. SDK Público
```
├── [ ] @prost-qs/sdk-js (npm)
├── [ ] prost-qs-sdk (PyPI)
├── [ ] Documentação pública
└── [ ] Exemplos
```

---

## 🐛 BUGS CONHECIDOS

| ID | Descrição | Severidade | Status |
|----|-----------|------------|--------|
| BUG-004 | **Kill switch não persiste após restart** | **CRÍTICO+** | **RESOLVER AGORA** |
| BUG-001 | Webhook Stripe pode falhar silenciosamente | Alta | Aberto |
| BUG-002 | Session timeout não redireciona | Média | Aberto |
| BUG-003 | Dashboard lento com muitos eventos | Média | Aberto |

---

## 📅 CRONOGRAMA AJUSTADO

### Janeiro 2026 (Semanas 2-4)

```
Semana 2 (AGORA):
├── Dia 1: BUG-004 (kill switch) — 2h
├── Dia 1: Primeiro $1 (billing) — 2-4h
├── Dia 2-3: Migração SCE → SSO — 3h
└── Dia 4-5: Observação e ajustes

Semana 3:
├── Testes de invariants
├── SDK interno
└── Observabilidade (perguntas primeiro)

Semana 4:
├── CI/CD básico
├── Mais testes
└── Documentação
```

---

## 📊 MÉTRICAS DE PROGRESSO

| Métrica | Atual | Meta Semana 2 | Meta Q1 |
|---------|-------|---------------|---------|
| Pagamentos Processados | 0 | **1+** | 10+ |
| Bugs Críticos | 1 | **0** | 0 |
| Test Coverage | 0% | 10% | 50% |
| Uptime | ~95% | 99% | 99% |

---

*Documento atualizado em 12/01/2026*
*Próxima revisão: 19/01/2026*
