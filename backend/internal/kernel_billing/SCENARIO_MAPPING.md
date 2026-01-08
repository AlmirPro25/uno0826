# 📋 MAPEAMENTO: CENÁRIO → HANDLER

## Fase 28.2-B — Implementação de Cobrança Real do Kernel

**Data:** 29/12/2024  
**Base:** CENARIOS-FALHA-BILLING.md

---

## 🗺️ MATRIZ DE COBERTURA

| Cenário | Descrição | Arquivo | Função/Handler | Status |
|---------|-----------|---------|----------------|--------|
| 1 | Cartão recusado no checkout | `stripe_handler.go` | `CreateCheckout` | ✅ |
| 2 | Cartão recusado na renovação | `webhook_handler.go` | `handleInvoicePaymentFailed` | ✅ |
| 3 | Webhook duplicado | `webhook_handler.go` | `checkIdempotency` | ✅ |
| 4 | Webhook fora de ordem | `webhook_handler.go` | `handleSubscriptionCreated` | ✅ |
| 5 | Webhook nunca chega | `reconciliation.go` | `checkPendingInvoices` | ✅ |
| 6 | Stripe cobra, kernel não marca | `webhook_handler.go` | `isRetryableWebhookError` | ✅ |
| 7 | App cancela no Stripe direto | `webhook_handler.go` | `handleSubscriptionDeleted` | ✅ |
| 8 | Usuário troca cartão durante retry | `webhook_handler.go` | `handlePaymentMethodAttached` | ✅ |
| 9 | Upgrade no meio do ciclo | `webhook_handler.go` | `handleSubscriptionUpdated` | ✅ |
| 10 | Downgrade + cancelamento mesmo dia | `webhook_handler.go` | `handleSubscriptionUpdated` | ✅ |
| 11 | Stripe fora do ar | `stripe_service.go` | `circuitBreaker.Execute` | ✅ |
| 12 | Invoice paga duas vezes | `webhook_handler.go` | `detectDoubleCharge` | ✅ |
| 13 | Divergência Stripe × Kernel | `reconciliation.go` | `checkAppDivergences` | ✅ |
| 14 | App excede quota em past_due | `service.go` | `CheckTransactionQuota` | ✅ |
| 15 | Webhook com app_id inválido | `webhook_handler.go` | `extractAppID` + `appExists` | ✅ |

---

## 📁 ARQUIVOS CRIADOS

### Core Services
- `stripe_service.go` — Integração Stripe (customer, checkout, subscription)
- `webhook_handler.go` — Processamento de webhooks com idempotência
- `reconciliation.go` — Reconciliação Stripe × Kernel
- `alert_service.go` — Sistema de alertas financeiros

### Handlers HTTP
- `stripe_handler.go` — Endpoints de checkout e status
- (handlers de reconciliation e alerts incluídos em stripe_handler.go)

### Documentação
- `SCENARIO_MAPPING.md` — Este arquivo

---

## 🔐 IDEMPOTÊNCIA

### Tabela: `kernel_processed_webhooks`
```sql
CREATE TABLE kernel_processed_webhooks (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    external_event_id TEXT NOT NULL,
    app_id TEXT,
    event_type TEXT,
    payload_hash TEXT,
    status TEXT DEFAULT 'processing',
    error_message TEXT,
    received_at TIMESTAMP,
    processed_at TIMESTAMP,
    created_at TIMESTAMP,
    UNIQUE(provider, external_event_id)
);
```

### Fluxo de Idempotência
```
1. Webhook chega
2. Tentar INSERT em kernel_processed_webhooks
3. Se UNIQUE constraint → duplicado → retorna 200
4. Se INSERT ok → processar
5. Marcar como processed/failed
```

---

## 🔄 CIRCUIT BREAKER

### Configuração
```go
CircuitBreakerConfig{
    Name:             "kernel_stripe",
    MaxFailures:      5,
    FailureWindow:    1 * time.Minute,
    RecoveryTimeout:  30 * time.Second,
    HalfOpenMaxCalls: 2,
}
```

### Estados
- `CLOSED` — Normal, requests passam
- `OPEN` — Stripe indisponível, requests bloqueados
- `HALF_OPEN` — Testando recuperação

---

## 🚨 ALERTAS

### Tipos de Alerta
| Tipo | Severidade | Cenário |
|------|------------|---------|
| `payment_failed` | high | 2 |
| `reconciliation_diff` | high | 5 |
| `webhook_processing_failed` | high | 6 |
| `subscription_canceled_externally` | medium | 7 |
| `subscription_deleted` | high | 7 |
| `stripe_outage` | critical | 11 |
| `circuit_breaker_open` | critical | 11 |
| `possible_double_charge` | critical | 12 |
| `reconciliation_divergence` | varies | 13 |
| `quota_exceeded_past_due` | medium | 14 |
| `orphan_webhook` | medium | 15 |

---

## 📊 RECONCILIAÇÃO

### Tabelas
- `reconciliation_runs` — Histórico de execuções
- `reconciliation_divergences` — Divergências encontradas

### Tipos de Divergência
- `status_diff` — Status diferente (active vs canceled)
- `payment_diff` — Pagamento diferente (paid vs pending)
- `plan_diff` — Plano diferente
- `amount_diff` — Valor diferente (CRÍTICO)
- `missing` — Registro faltando

### Severidades
- `critical` — Envolve dinheiro, requer ação imediata
- `high` — Afeta operação, requer ação em 24h
- `medium` — Inconsistência, investigar
- `low` — Informativo

---

## 🛣️ ENDPOINTS NOVOS

### Webhook (sem auth)
```
POST /api/v1/kernel/webhooks/stripe
```

### App Owner
```
POST /api/v1/apps/:app_id/billing/checkout
GET  /api/v1/apps/:app_id/billing/checkout/status
```

### SuperAdmin
```
GET  /api/v1/admin/kernel/billing/stripe/status

POST /api/v1/admin/kernel/billing/reconciliation/run
GET  /api/v1/admin/kernel/billing/reconciliation/divergences
POST /api/v1/admin/kernel/billing/reconciliation/divergences/:id/resolve
GET  /api/v1/admin/kernel/billing/reconciliation/stats

GET  /api/v1/admin/kernel/billing/alerts
GET  /api/v1/admin/kernel/billing/alerts/critical
POST /api/v1/admin/kernel/billing/alerts/:id/acknowledge
POST /api/v1/admin/kernel/billing/alerts/:id/resolve
GET  /api/v1/admin/kernel/billing/alerts/stats
```

---

## ⚙️ VARIÁVEIS DE AMBIENTE

```env
# Stripe do Kernel (TEST MODE)
KERNEL_STRIPE_SECRET_KEY=sk_test_xxx
KERNEL_STRIPE_WEBHOOK_SECRET=whsec_xxx
KERNEL_STRIPE_SUCCESS_URL=https://app.example.com/billing/success
KERNEL_STRIPE_CANCEL_URL=https://app.example.com/billing/cancel
KERNEL_STRIPE_LIVE_MODE=false  # NUNCA true sem aprovação
```

---

## ✅ CHECKLIST DE TESTES

### Cenário 1: Cartão recusado no checkout
- [ ] Criar checkout session
- [ ] Simular cartão recusado (4000000000000002)
- [ ] Verificar que subscription NÃO foi criada

### Cenário 2: Cartão recusado na renovação
- [ ] Simular invoice.payment_failed
- [ ] Verificar status = past_due
- [ ] Verificar alerta criado

### Cenário 3: Webhook duplicado
- [ ] Enviar mesmo webhook 2x
- [ ] Verificar que só processou 1x
- [ ] Verificar retorno 200 no segundo

### Cenário 4: Webhook fora de ordem
- [ ] Enviar invoice.paid antes de subscription.created
- [ ] Verificar que subscription foi criada on-demand

### Cenário 5: Webhook nunca chega
- [ ] Criar invoice pending
- [ ] Rodar reconciliação após 24h
- [ ] Verificar divergência detectada

### Cenário 6: Processamento falha
- [ ] Simular erro de banco durante processamento
- [ ] Verificar retorno 500 (retry)
- [ ] Verificar webhook marcado como failed

### Cenário 7: Cancelamento externo
- [ ] Simular subscription.deleted
- [ ] Verificar status = canceled
- [ ] Verificar alerta criado

### Cenário 8: Troca de cartão
- [ ] Simular payment_method.attached
- [ ] Verificar log criado

### Cenário 9: Upgrade mid-cycle
- [ ] Simular subscription.updated com novo plano
- [ ] Verificar plano atualizado imediatamente

### Cenário 10: Downgrade + cancel
- [ ] Criar downgrade pendente
- [ ] Simular cancelamento
- [ ] Verificar downgrade cancelado

### Cenário 11: Stripe down
- [ ] Simular 5 falhas consecutivas
- [ ] Verificar circuit breaker OPEN
- [ ] Verificar erro amigável retornado

### Cenário 12: Double charge
- [ ] Simular invoice.paid para invoice já paga
- [ ] Verificar alerta CRÍTICO criado
- [ ] Verificar que NÃO duplicou

### Cenário 13: Divergência
- [ ] Criar divergência manual
- [ ] Rodar reconciliação
- [ ] Verificar divergência detectada

### Cenário 14: Quota em past_due
- [ ] Colocar app em past_due
- [ ] Exceder quota
- [ ] Verificar bloqueio

### Cenário 15: Webhook órfão
- [ ] Enviar webhook com app_id inexistente
- [ ] Verificar retorno 200
- [ ] Verificar alerta criado

---

**Status:** ✅ IMPLEMENTAÇÃO COMPLETA  
**Próximo:** Testes end-to-end em Stripe test mode
