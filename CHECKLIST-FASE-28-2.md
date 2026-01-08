# 📋 CHECKLIST DE PRODUÇÃO — FASE 28.2

## Cobrança Real do Kernel

**Data:** 29/12/2024  
**Status:** PRÉ-IMPLEMENTAÇÃO  
**Criticidade:** 🔴 MÁXIMA — Dinheiro real entrando

> ⚠️ **AVISO:** Este checklist deve ser 100% verde antes de ativar cobrança real.
> Cada item não verificado é um incidente potencial.

---

## 🎯 OBJETIVO DA FASE

Transformar o billing interno (Fase 28.1) em cobrança real via Stripe.

**Resultado esperado:** O kernel cobra automaticamente dos apps que usam a infraestrutura.

---

## 📦 PRÉ-REQUISITOS (Antes de começar)

### Stripe Account
- [ ] Conta Stripe ativa e verificada
- [ ] Stripe API Keys (test mode) configuradas
- [ ] Stripe API Keys (live mode) disponíveis (não ativar ainda)
- [ ] Webhook endpoint configurado no Stripe Dashboard
- [ ] Webhook signing secret salvo em variável de ambiente

### Ambiente
- [ ] `STRIPE_KERNEL_SECRET_KEY` configurada (.env)
- [ ] `STRIPE_KERNEL_WEBHOOK_SECRET` configurada (.env)
- [ ] `STRIPE_KERNEL_PUBLISHABLE_KEY` configurada (frontend)
- [ ] Ambiente de teste isolado do ambiente de produção

### Dados
- [ ] Planos criados no Stripe (Free, Pro, Enterprise)
- [ ] Price IDs do Stripe mapeados para `kernel_plans`
- [ ] Pelo menos 1 app de teste com subscription ativa

---

## 🔧 IMPLEMENTAÇÃO — CHECKLIST TÉCNICO

### 28.2.1 — Stripe Integration Service

**Arquivo:** `backend/internal/kernel_billing/stripe_service.go`

- [ ] Criar `KernelStripeService` separado do billing de usuários
- [ ] Método `CreateCustomer(appID, email, name)` → Stripe Customer
- [ ] Método `CreateSubscription(customerID, priceID)` → Stripe Subscription
- [ ] Método `UpdateSubscription(subscriptionID, newPriceID)` → Upgrade/Downgrade
- [ ] Método `CancelSubscription(subscriptionID, atPeriodEnd)` → Cancelamento
- [ ] Método `CreatePaymentIntent(amount, currency, customerID)` → Para pagamentos avulsos
- [ ] Método `GetInvoices(customerID)` → Histórico de invoices do Stripe

### 28.2.2 — Webhook Handler do Kernel

**Arquivo:** `backend/internal/kernel_billing/webhook_handler.go`

- [ ] Endpoint: `POST /webhooks/kernel/stripe`
- [ ] Validação de assinatura do webhook (signing secret)
- [ ] Idempotência (usar `processed_webhooks` existente)
- [ ] Rate limiting aplicado

**Eventos a processar:**

| Evento Stripe | Ação no Kernel |
|---------------|----------------|
| `customer.subscription.created` | Criar/atualizar `app_subscriptions` |
| `customer.subscription.updated` | Atualizar status, plano |
| `customer.subscription.deleted` | Marcar como `canceled` |
| `invoice.paid` | Marcar `kernel_invoices` como `paid` |
| `invoice.payment_failed` | Marcar como `past_due`, criar alerta |
| `invoice.finalized` | Sincronizar invoice interna |
| `payment_intent.succeeded` | Log de sucesso |
| `payment_intent.payment_failed` | Criar alerta, iniciar retry |

- [ ] Handler para `customer.subscription.created`
- [ ] Handler para `customer.subscription.updated`
- [ ] Handler para `customer.subscription.deleted`
- [ ] Handler para `invoice.paid`
- [ ] Handler para `invoice.payment_failed`
- [ ] Handler para `invoice.finalized`
- [ ] Handler para `payment_intent.succeeded`
- [ ] Handler para `payment_intent.payment_failed`
- [ ] Fallback para eventos desconhecidos (log, não falha)

### 28.2.3 — Modelo de Dados (Extensões)

**Arquivo:** `backend/internal/kernel_billing/model.go`

- [ ] Adicionar `stripe_customer_id` em `app_subscriptions`
- [ ] Adicionar `stripe_subscription_id` em `app_subscriptions`
- [ ] Adicionar `stripe_price_id` em `kernel_plans`
- [ ] Adicionar `stripe_invoice_id` em `kernel_invoices`
- [ ] Adicionar `payment_method_id` em `app_subscriptions`
- [ ] Criar tabela `kernel_payment_attempts` para retry tracking

```sql
ALTER TABLE app_subscriptions ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE app_subscriptions ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE kernel_plans ADD COLUMN stripe_price_id TEXT;
ALTER TABLE kernel_invoices ADD COLUMN stripe_invoice_id TEXT;
```

### 28.2.4 — Fluxo de Checkout

- [ ] Endpoint: `POST /api/v1/apps/:app_id/billing/checkout`
- [ ] Criar Stripe Customer se não existir
- [ ] Criar Stripe Checkout Session
- [ ] Retornar URL do checkout
- [ ] Callback de sucesso: `GET /billing/success?session_id=xxx`
- [ ] Callback de cancelamento: `GET /billing/cancel`

### 28.2.5 — Retry e Dunning

**Arquivo:** `backend/internal/kernel_billing/dunning_service.go`

- [ ] Configuração de retry: 3 tentativas em 7 dias
- [ ] Job para verificar invoices `past_due`
- [ ] Notificação por email (ou log) antes de cada retry
- [ ] Após 3 falhas: marcar subscription como `canceled`
- [ ] Criar alerta financeiro em cada falha
- [ ] Não bloquear app imediatamente (grace period de 7 dias)

```
Dia 0: Pagamento falhou → past_due
Dia 3: Retry #1
Dia 5: Retry #2
Dia 7: Retry #3 → Se falhar, cancela
```


---

## 🧪 CENÁRIOS DE TESTE (Obrigatórios)

### Fluxo Feliz
- [ ] App faz checkout → Pagamento aprovado → Subscription ativa
- [ ] App faz upgrade Pro → Enterprise → Cobrança proporcional
- [ ] App faz downgrade Enterprise → Pro → Aplica no próximo ciclo
- [ ] Ciclo mensal renova → Invoice gerada → Pagamento automático

### Fluxo de Falha
- [ ] Cartão recusado no checkout → Mensagem clara, não cria subscription
- [ ] Cartão recusado na renovação → Status `past_due`, retry agendado
- [ ] 3 retries falham → Subscription cancelada, app pausado
- [ ] Webhook duplicado → Idempotência funciona, não duplica

### Edge Cases
- [ ] App cancela no meio do ciclo → Acesso até fim do período
- [ ] App faz upgrade e cancela no mesmo dia → Upgrade aplicado, cancelamento agendado
- [ ] Webhook chega antes do checkout completar → Ordem de eventos tratada
- [ ] Webhook chega fora de ordem → Sistema resiliente
- [ ] Stripe fora do ar → Graceful degradation, não quebra o kernel

### Reconciliação
- [ ] Invoice do Stripe bate com `kernel_invoices`
- [ ] Subscription do Stripe bate com `app_subscriptions`
- [ ] Divergência detectada → Alerta criado

---

## 🔒 SEGURANÇA — CHECKLIST

### Secrets
- [ ] Stripe keys em variáveis de ambiente, nunca em código
- [ ] Webhook secret validado em toda requisição
- [ ] Keys de produção separadas das de teste
- [ ] Rotação de keys documentada

### Validação
- [ ] Webhook signature verificada antes de processar
- [ ] `app_id` validado contra subscription
- [ ] Usuário só vê billing do próprio app
- [ ] SuperAdmin vê tudo

### Auditoria
- [ ] Todo pagamento registrado em `audit_logs`
- [ ] Toda mudança de subscription registrada
- [ ] Toda falha de pagamento registrada
- [ ] Logs não contêm dados sensíveis (card numbers, etc)

---

## 📊 OBSERVABILIDADE — CHECKLIST

### Métricas
- [ ] `kernel_billing_checkout_total` (contador)
- [ ] `kernel_billing_payment_success_total` (contador)
- [ ] `kernel_billing_payment_failed_total` (contador)
- [ ] `kernel_billing_mrr` (gauge)
- [ ] `kernel_billing_churn_rate` (gauge)

### Alertas
- [ ] Alerta se taxa de falha > 10%
- [ ] Alerta se MRR cair > 20% em 24h
- [ ] Alerta se webhook processing > 5s
- [ ] Alerta se retry queue > 100 items

### Logs
- [ ] Log estruturado para cada webhook recebido
- [ ] Log de cada tentativa de pagamento
- [ ] Log de cada mudança de status de subscription
- [ ] Correlation ID entre webhook e ações internas

---

## 🚀 DEPLOY — CHECKLIST

### Antes do Deploy
- [ ] Todos os testes passando em ambiente de teste
- [ ] Stripe test mode validado end-to-end
- [ ] Backup do banco de dados
- [ ] Rollback plan documentado

### Durante o Deploy
- [ ] Deploy em horário de baixo tráfego
- [ ] Monitoramento ativo durante deploy
- [ ] Webhook endpoint ativo antes de criar subscriptions

### Após o Deploy
- [ ] Verificar health check
- [ ] Verificar webhook connectivity (Stripe Dashboard)
- [ ] Criar 1 subscription de teste em produção
- [ ] Verificar se invoice foi gerada corretamente
- [ ] Verificar se métricas estão sendo coletadas


---

## 🔄 ESTADOS DE SUBSCRIPTION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MÁQUINA DE ESTADOS — SUBSCRIPTION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         ┌──────────┐                                        │
│                         │ trialing │ (opcional)                             │
│                         └────┬─────┘                                        │
│                              │ trial_end                                    │
│                              ▼                                              │
│   ┌──────────┐         ┌──────────┐         ┌──────────┐                   │
│   │ checkout │────────▶│  active  │────────▶│ past_due │                   │
│   └──────────┘ success └────┬─────┘ payment └────┬─────┘                   │
│                             │ failed             │                          │
│                             │                    │ retry_success            │
│                             │                    ├─────────────────┐        │
│                             │                    │                 │        │
│                             │                    ▼                 │        │
│                             │              ┌──────────┐            │        │
│                             │              │ canceled │◀───────────┘        │
│                             │              └──────────┘ 3 retries failed    │
│                             │                    ▲                          │
│                             │                    │                          │
│                             └────────────────────┘                          │
│                               user_cancel                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Transições Válidas

| De | Para | Trigger |
|----|------|---------|
| `(novo)` | `trialing` | Checkout com trial |
| `(novo)` | `active` | Checkout sem trial |
| `trialing` | `active` | Trial terminou, pagamento OK |
| `trialing` | `canceled` | Trial terminou, pagamento falhou |
| `active` | `past_due` | Pagamento falhou |
| `active` | `canceled` | Usuário cancelou |
| `past_due` | `active` | Retry bem sucedido |
| `past_due` | `canceled` | 3 retries falharam |

---

## 💰 CÁLCULOS FINANCEIROS

### Upgrade (Pro → Enterprise)

```
Dias restantes no ciclo: 15
Valor Pro mensal: R$ 99
Valor Enterprise mensal: R$ 499

Crédito Pro: (99 / 30) * 15 = R$ 49,50
Custo Enterprise proporcional: (499 / 30) * 15 = R$ 249,50

Cobrança imediata: R$ 249,50 - R$ 49,50 = R$ 200,00
Próximo ciclo: R$ 499,00 (cheio)
```

### Downgrade (Enterprise → Pro)

```
Downgrade agendado para próximo ciclo.
Acesso Enterprise mantido até fim do período atual.
Próximo ciclo: R$ 99,00
```

### Cancelamento

```
Cancelamento agendado para fim do período.
Acesso mantido até current_period_end.
Após: subscription.status = 'canceled'
```

---

## 🚨 PLANO DE ROLLBACK

### Se algo der errado:

1. **Desativar webhook no Stripe Dashboard**
   - Impede novos eventos de serem processados

2. **Reverter deploy**
   - `git revert` ou deploy da versão anterior

3. **Marcar subscriptions como `paused`**
   - Não cancela, apenas pausa processamento

4. **Notificar apps afetados**
   - Email ou dashboard notification

5. **Investigar e corrigir**
   - Logs, métricas, reproduzir cenário

6. **Reativar gradualmente**
   - Primeiro em test mode
   - Depois em produção com 1 app
   - Depois para todos

---

## 📅 CRONOGRAMA SUGERIDO

| Dia | Atividade |
|-----|-----------|
| 1 | Implementar Stripe Service |
| 2 | Implementar Webhook Handler |
| 3 | Implementar Checkout Flow |
| 4 | Implementar Dunning/Retry |
| 5 | Testes em Stripe Test Mode |
| 6 | Code Review + Ajustes |
| 7 | Deploy em staging |
| 8 | Testes end-to-end em staging |
| 9 | Deploy em produção (test mode) |
| 10 | Ativar live mode com 1 app piloto |

---

## ✅ CRITÉRIOS DE ACEITE

A Fase 28.2 só está completa quando:

- [ ] Checkout funciona end-to-end
- [ ] Webhooks processados corretamente
- [ ] Upgrade/Downgrade funcionando
- [ ] Cancelamento funcionando
- [ ] Retry/Dunning funcionando
- [ ] Reconciliação Stripe × Kernel OK
- [ ] Todos os testes passando
- [ ] Métricas sendo coletadas
- [ ] Alertas configurados
- [ ] Documentação atualizada
- [ ] 1 ciclo completo observado em produção

---

## 📎 REFERÊNCIAS

- [Stripe Billing Docs](https://stripe.com/docs/billing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
- `ARQUITETURA-PROST-QS.md` — Diagrama do sistema
- `CHECKPOINT-FASE-28-1.md` — Billing interno implementado

---

*"Cobrança real não admite improviso. Cada checkbox é um incidente evitado."*

**PROST-QS Kernel — Checklist Fase 28.2**
