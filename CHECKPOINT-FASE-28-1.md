# CHECKPOINT — Fase 28.1: Kernel Billing (Interno)

**Data:** 29/12/2024  
**Status:** ✅ CONCLUÍDA  
**Commits:** (pendente)

---

## OBJETIVO

O kernel passa a rastrear e controlar o uso dos apps, gerando invoices internas.

> "Billing interno: tracking + controle + invoice. Cobrança real vem depois."

---

## O QUE FOI IMPLEMENTADO

### 28.1.1 — Modelo de Planos (Data-Driven)

**Arquivo:** `backend/internal/kernel_billing/model.go`

**Tabela:** `kernel_plans`
```sql
CREATE TABLE kernel_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT,
    description TEXT,
    price_monthly INTEGER,
    price_yearly INTEGER,
    currency TEXT DEFAULT 'BRL',
    max_transactions_month INTEGER,
    max_apps INTEGER,
    max_api_calls_month INTEGER,
    max_webhooks_month INTEGER,
    features_json TEXT,
    is_active INTEGER DEFAULT 1,
    is_public INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME
);
```

**Planos Padrão:**
| Plano | Preço/mês | Transações | Apps | API Calls | Webhooks |
|-------|-----------|------------|------|-----------|----------|
| Free | R$ 0 | 100 | 1 | 1.000 | 100 |
| Pro | R$ 99 | 5.000 | 5 | 50.000 | 5.000 |
| Enterprise | R$ 499 | ∞ | ∞ | ∞ | ∞ |

**Características:**
- Limites configuráveis (não hardcoded)
- Features como JSON para flexibilidade
- Suporte a planos custom/negociados
- Planos públicos vs privados

---

### 28.1.2 — App Subscription

**Tabela:** `app_subscriptions`
```sql
CREATE TABLE app_subscriptions (
    id TEXT PRIMARY KEY,
    app_id TEXT UNIQUE NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    current_period_start DATETIME,
    current_period_end DATETIME,
    pending_plan_id TEXT,
    pending_from DATETIME,
    canceled_at DATETIME,
    cancel_at_period_end INTEGER,
    created_at DATETIME,
    updated_at DATETIME
);
```

**Status possíveis:**
- `active` — Funcionando normalmente
- `past_due` — Pagamento atrasado
- `canceled` — Cancelada
- `trialing` — Em período de teste
- `paused` — Pausada por quota

**Regras de mudança de plano:**
- Upgrade → Efeito imediato
- Downgrade → Só no próximo ciclo (pending_plan_id)

---

### 28.1.3 — Usage Tracking (Ledger Operacional)

**Tabela:** `app_usage`
```sql
CREATE TABLE app_usage (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    period TEXT NOT NULL,  -- YYYY-MM
    transactions_count INTEGER,
    api_calls_count INTEGER,
    webhooks_count INTEGER,
    total_processed_amount INTEGER,
    first_event_at DATETIME,
    last_event_at DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    UNIQUE(app_id, period)
);
```

**Filosofia:**
- Usage incrementa sempre, nunca apaga
- Mesmo princípio do ledger financeiro
- Tracking por período mensal (YYYY-MM)

---

### 28.1.4 — Invoice Generation (Interna)

**Tabela:** `kernel_invoices`
```sql
CREATE TABLE kernel_invoices (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    plan_id TEXT,
    period_start DATETIME,
    period_end DATETIME,
    subtotal INTEGER,
    usage_amount INTEGER,
    discount INTEGER,
    total INTEGER,
    currency TEXT DEFAULT 'BRL',
    status TEXT DEFAULT 'draft',
    issued_at DATETIME,
    due_at DATETIME,
    paid_at DATETIME,
    paid_by TEXT,
    paid_note TEXT,
    line_items_json TEXT,
    created_at DATETIME,
    updated_at DATETIME
);
```

**Status de Invoice:**
- `draft` — Sendo calculada
- `pending` — Aguardando pagamento
- `paid` — Paga (manual por enquanto)
- `overdue` — Vencida
- `voided` — Cancelada

**Regras:**
- Plano Free → Invoice já marcada como paga automaticamente
- Vencimento padrão: 15 dias após emissão
- Line items detalhados em JSON

---

### 28.1.5 — Quota Check

**Fluxo de verificação:**
```
Webhook/Transação chega
        ↓
CheckTransactionQuota(app_id)
        ↓
Busca subscription + usage
        ↓
Compara com limites do plano
        ↓
Retorna QuotaCheckResult {
    allowed: bool,
    reason: string,
    current_usage: int,
    limit: int,
    remaining_quota: int
}
```

**Comportamento:**
- Limite 0 = ilimitado
- Quota excedida → Não bloqueia recebimento, bloqueia processamento
- Webhook fica `pending_quota` até upgrade ou novo ciclo

---

## ENDPOINTS CRIADOS

### Públicos (Planos)
```
GET /api/v1/kernel/plans           → Lista planos disponíveis
GET /api/v1/kernel/plans/:id       → Detalhes de um plano
```

### App Owner (Billing do próprio app)
```
GET  /api/v1/apps/:app_id/billing/subscription    → Ver assinatura
POST /api/v1/apps/:app_id/billing/change-plan     → Mudar plano
POST /api/v1/apps/:app_id/billing/cancel          → Cancelar
GET  /api/v1/apps/:app_id/billing/usage           → Ver consumo atual
GET  /api/v1/apps/:app_id/billing/usage/history   → Histórico de consumo
GET  /api/v1/apps/:app_id/billing/invoices        → Listar faturas
GET  /api/v1/apps/:app_id/billing/invoices/:id    → Detalhes da fatura
```

### SuperAdmin (Gestão Global)
```
GET  /api/v1/admin/kernel/billing/stats           → Estatísticas (MRR, etc)
GET  /api/v1/admin/kernel/billing/subscriptions   → Todas as subscriptions
GET  /api/v1/admin/kernel/billing/invoices        → Todas as invoices
POST /api/v1/admin/kernel/billing/invoices/:id/pay   → Marcar como paga
POST /api/v1/admin/kernel/billing/invoices/:id/void  → Cancelar invoice
POST /api/v1/admin/kernel/billing/process-cycle   → Processar ciclo mensal
```

### Interno (Para outros serviços)
```
GET /api/v1/internal/quota/:app_id?type=transactions  → Verificar quota
```

---

## FRONTEND

**Arquivo:** `frontend/admin/src/kernel_billing.js`

**Views implementadas:**
1. **Kernel Plans** — Lista de planos disponíveis com cards
2. **App Billing** — Subscription, usage e invoices do app
3. **Kernel Billing Admin** — Dashboard de billing para superadmin

**Menu:** System → Kernel Billing

---

## MÉTRICAS DISPONÍVEIS

```javascript
BillingStats {
    total_apps: int,           // Total de apps com subscription
    active_subscriptions: int, // Subscriptions ativas
    total_mrr: int,            // Monthly Recurring Revenue (centavos)
    pending_invoices: int,     // Invoices aguardando pagamento
    pending_amount: int,       // Valor total pendente
    plan_distribution: {       // Distribuição por plano
        "free": 10,
        "pro": 5,
        "enterprise": 2
    }
}
```

---

## FLUXO DE BILLING CYCLE

```
┌─────────────────────────────────────────────────────────────┐
│              BILLING CYCLE (Mensal)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Dia 1 do mês (ou manual via endpoint)                      │
│         ↓                                                   │
│  ProcessBillingCycle()                                      │
│         ↓                                                   │
│  Para cada subscription ativa:                              │
│         ↓                                                   │
│  1. Gerar invoice do mês anterior                           │
│         ↓                                                   │
│  2. Aplicar mudança de plano pendente (se houver)           │
│         ↓                                                   │
│  3. Renovar período (current_period_start/end)              │
│         ↓                                                   │
│  4. Verificar cancelamento agendado                         │
│         ↓                                                   │
│  Fim do ciclo                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## O QUE NÃO FOI IMPLEMENTADO (Fase 28.2)

❌ Integração com Stripe do kernel  
❌ Cobrança automática  
❌ Retry de pagamento  
❌ Dunning (cobrança de inadimplentes)  
❌ Webhooks de pagamento do kernel  

> Conforme orientação do Tech Lead: "Cobrança real vem depois de pelo menos 1 ciclo observado"

---

## ARQUIVOS CRIADOS/MODIFICADOS

### Novos
- `backend/internal/kernel_billing/model.go`
- `backend/internal/kernel_billing/service.go`
- `backend/internal/kernel_billing/invoice_service.go`
- `backend/internal/kernel_billing/handler.go`
- `backend/internal/kernel_billing/routes.go`
- `frontend/admin/src/kernel_billing.js`

### Modificados
- `backend/pkg/db/sqlite.go` — Novas tabelas
- `backend/cmd/api/main.go` — Inicialização e rotas
- `frontend/admin/index.html` — Menu item
- `frontend/admin/src/main.js` — Case no switch

---

## PRÓXIMOS PASSOS

Com o Billing Interno completo, o sistema está pronto para:

1. **Observar 1 ciclo** — Ver como os apps usam os limites
2. **Calibrar planos** — Ajustar limites e preços baseado em dados reais
3. **Fase 28.2** — Integrar cobrança real via Stripe

---

**Fase 28.1: FECHADA** ✅

*"Billing não é feature, é governança do ecossistema."*
