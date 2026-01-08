# CHECKPOINT — Fase 27.0: Financial Event Pipeline

**Data:** 29/12/2024  
**Status:** ✅ CONCLUÍDA  
**Commits:** `c452ddf`, `025f140`, `d45435a`

---

## OBJETIVO

Fechar o loop completo:
```
Pagamento → Evento → Métrica → Dashboard → Decisão
```

Transformar o PROST-QS de "integração com Stripe" para **infra financeira**.

---

## O QUE FOI IMPLEMENTADO

### Bloco 1: Financial Event Model

**Arquivo:** `backend/internal/financial/event_model.go`

```go
FinancialEvent {
    ID, AppID, Provider, Type, Status
    Amount, Currency, NetAmount, FeeAmount
    ExternalID, CustomerID, UserID
    Description, Metadata, RawPayload
    ParentID, OccurredAt, ProcessedAt
}
```

**Event Types:**
- `payment.created/succeeded/failed/canceled`
- `refund.created/succeeded/failed`
- `dispute.created/won/lost`
- `subscription.created/updated/canceled/renewed`
- `payout.created/paid/failed`

### Bloco 2: Metrics Materializadas

**Arquivos:** 
- `backend/internal/financial/metrics_model.go`
- `backend/internal/financial/metrics_service.go`

**Métricas por App:**
- Total Revenue, Refunds, Fees, Net Revenue
- Payments Success/Failed, Refunds Count
- Active Subscriptions, Churned
- Revenue Today/7d/30d (rolling)

**Métricas Globais:**
- Total processado no ecossistema
- Apps ativos (com pagamento nos últimos 30d)
- Volume de transações

**Daily Snapshots:**
- Histórico diário para gráficos
- Permite reconstrução de métricas

### Bloco 3: Stripe Webhook Handler

**Arquivo:** `backend/internal/financial/stripe_webhook.go`

**Endpoint:** `POST /webhooks/stripe/:app_id`

**Fluxo:**
1. Recebe webhook da Stripe
2. Valida assinatura (HMAC-SHA256)
3. Identifica app pelo URL
4. Normaliza evento para FinancialEvent
5. Persiste no ledger
6. Atualiza métricas (async)
7. Loga webhook recebido

**Segurança:**
- Validação de assinatura Stripe
- Tolerância de timestamp (5 min)
- Detecção de duplicatas
- Log de todos os webhooks

### Bloco 4: Financial Dashboard

**Arquivo:** `frontend/admin/src/financial.js`

**Views:**
- Dashboard Global (Super Admin)
  - Receita total, líquida, taxas, reembolsos
  - Rolling metrics (hoje, 7d, 30d)
  - Gráfico de receita 30 dias
  - Top apps por receita
  - Eventos recentes

- Dashboard por App
  - Métricas específicas do app
  - Gráfico de receita diária
  - Lista de eventos financeiros

---

## ENDPOINTS CRIADOS

```
# Por App (owner)
GET /api/v1/apps/:id/financial/metrics
GET /api/v1/apps/:id/financial/events
GET /api/v1/apps/:id/financial/daily

# Global (super admin)
GET /api/v1/admin/financial/metrics
GET /api/v1/admin/financial/daily
GET /api/v1/admin/financial/events
GET /api/v1/admin/financial/top-apps
POST /api/v1/admin/financial/recalculate/:id

# Webhook (sem auth - validação por signature)
POST /webhooks/stripe/:app_id
```

---

## TABELAS CRIADAS

```sql
-- Ledger primário
CREATE TABLE financial_events (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'BRL',
    net_amount INTEGER,
    fee_amount INTEGER,
    external_id TEXT,
    customer_id TEXT,
    user_id TEXT,
    description TEXT,
    metadata TEXT,
    raw_payload TEXT,
    parent_id TEXT,
    occurred_at DATETIME NOT NULL,
    processed_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL
);

-- Métricas por app
CREATE TABLE app_financial_metrics (
    id TEXT PRIMARY KEY,
    app_id TEXT UNIQUE NOT NULL,
    total_revenue INTEGER,
    total_refunds INTEGER,
    total_fees INTEGER,
    net_revenue INTEGER,
    payments_success INTEGER,
    payments_failed INTEGER,
    refunds_count INTEGER,
    disputes_count INTEGER,
    active_subscriptions INTEGER,
    revenue_today INTEGER,
    revenue_7d INTEGER,
    revenue_30d INTEGER,
    last_payment_at DATETIME,
    last_event_at DATETIME,
    created_at DATETIME,
    updated_at DATETIME
);

-- Snapshots diários
CREATE TABLE daily_financial_snapshots (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    date DATE NOT NULL,
    revenue INTEGER,
    refunds INTEGER,
    fees INTEGER,
    net_revenue INTEGER,
    payments_success INTEGER,
    payments_failed INTEGER,
    created_at DATETIME
);

-- Métricas globais
CREATE TABLE global_financial_metrics (
    id TEXT PRIMARY KEY,
    total_revenue INTEGER,
    total_refunds INTEGER,
    total_fees INTEGER,
    net_revenue INTEGER,
    total_payments INTEGER,
    total_apps INTEGER,
    active_apps INTEGER,
    updated_at DATETIME
);

-- Log de webhooks
CREATE TABLE webhook_logs (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    external_id TEXT,
    status TEXT NOT NULL,
    error TEXT,
    headers TEXT,
    raw_body TEXT,
    received_at DATETIME NOT NULL,
    processed_at DATETIME,
    source_ip TEXT
);
```

---

## PRINCÍPIOS RESPEITADOS

1. **Dinheiro nunca é apagado** - Eventos são append-only
2. **Stripe é detalhe** - Modelo normalizado, provider-agnostic
3. **Métrica é derivada** - Verdade está nos eventos
4. **Kernel recebe webhooks** - Apps não recebem diretamente

---

## FLUXO COMPLETO

```
┌─────────────────────────────────────────────────────────────┐
│                    FINANCIAL PIPELINE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cliente paga no App                                        │
│         ↓                                                   │
│  Stripe processa pagamento                                  │
│         ↓                                                   │
│  Stripe envia webhook → /webhooks/stripe/:app_id            │
│         ↓                                                   │
│  Kernel valida assinatura                                   │
│         ↓                                                   │
│  Evento normalizado → FinancialEvent                        │
│         ↓                                                   │
│  Persistido no ledger (append-only)                         │
│         ↓                                                   │
│  Métricas atualizadas (async)                               │
│         ↓                                                   │
│  Dashboard reflete estado financeiro                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## PRÓXIMOS PASSOS

Com o pipeline financeiro fechado, as próximas evoluções possíveis são:

1. **Alertas financeiros** - Notificar quando métricas ultrapassam thresholds
2. **Reconciliação** - Comparar ledger interno com Stripe
3. **Multi-provider** - Adicionar MercadoPago, PagSeguro
4. **Relatórios** - Export CSV/PDF para contabilidade

---

**Fase 27.0: FECHADA** ✅

*"Todo centavo que passa pelo ecossistema é rastreável, auditável, mensurável e visível."*
