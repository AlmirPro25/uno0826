# 🧪 CENÁRIOS REAIS DE COBRANÇA E FALHA

## War Stories Simuladas — Treino de Incidente Sem Sangue Real

**Data:** 29/12/2024  
**Objetivo:** Ensaiar o caos antes que ele aconteça  
**Criticidade:** 🔴 MÁXIMA — Cada cenário é um incidente evitado

> ⚠️ **REGRA:** Para cada cenário, defina: O que acontece → O que o sistema faz → O que o humano vê

---

## 📋 ÍNDICE DE CENÁRIOS

| # | Cenário | Severidade | Frequência |
|---|---------|------------|------------|
| 1 | Cartão recusado no checkout | 🟡 Média | Alta |
| 2 | Cartão recusado na renovação | 🔴 Alta | Média |
| 3 | Webhook duplicado | 🟡 Média | Alta |
| 4 | Webhook fora de ordem | 🟠 Alta | Média |
| 5 | Webhook nunca chega | 🔴 Crítica | Baixa |
| 6 | Stripe cobra, kernel não marca | 🔴 Crítica | Baixa |
| 7 | App cancela no Stripe direto | 🟠 Alta | Média |
| 8 | Usuário troca cartão durante retry | 🟡 Média | Baixa |
| 9 | Upgrade no meio do ciclo | 🟡 Média | Alta |
| 10 | Downgrade + cancelamento mesmo dia | 🟠 Alta | Baixa |
| 11 | Stripe fora do ar | 🔴 Crítica | Rara |
| 12 | Invoice paga duas vezes | 🔴 Crítica | Rara |
| 13 | Divergência Stripe × Kernel | 🟠 Alta | Média |
| 14 | App excede quota em past_due | 🟡 Média | Média |
| 15 | Webhook com app_id inválido | 🟡 Média | Baixa |

---

## 🔴 CENÁRIO 1: Cartão Recusado no Checkout

### Contexto
App tenta fazer checkout para plano Pro. Cartão é recusado.

### Timeline
```
T+0s    App inicia checkout
T+2s    Stripe Checkout Session criada
T+30s   Usuário preenche cartão
T+32s   Stripe tenta cobrar
T+33s   Cartão recusado (insufficient_funds)
T+34s   Stripe redireciona para cancel_url
```

### O que o sistema DEVE fazer
```
1. NÃO criar subscription no kernel
2. NÃO criar invoice
3. NÃO incrementar usage
4. Logar tentativa falha em audit_logs
5. Manter app no plano atual (Free)
```

### O que o usuário DEVE ver
```
- Mensagem: "Pagamento não aprovado. Verifique os dados do cartão."
- Botão: "Tentar novamente"
- App continua funcionando no plano Free
```

### Verificações
- [ ] `app_subscriptions` não foi alterada
- [ ] `kernel_invoices` não tem nova entrada
- [ ] `audit_logs` tem registro da tentativa
- [ ] Frontend mostra mensagem clara

---

## 🔴 CENÁRIO 2: Cartão Recusado na Renovação

### Contexto
App tem plano Pro ativo. Dia 1 do mês, Stripe tenta renovar. Cartão recusado.

### Timeline
```
T+0     Stripe tenta cobrar renovação
T+1s    Cartão recusado
T+2s    Stripe envia webhook: invoice.payment_failed
T+3s    Kernel recebe webhook
```

### O que o sistema DEVE fazer
```
1. Marcar subscription como 'past_due'
2. Criar alerta financeiro (type: payment_failed)
3. Agendar retry #1 para T+3 dias
4. NÃO bloquear app imediatamente
5. Logar em audit_logs
6. Atualizar kernel_invoices com status 'past_due'
```

### O que o usuário DEVE ver
```
- Banner no dashboard: "Problema com pagamento. Atualize seu cartão."
- Email (futuro): "Sua cobrança falhou. Tentaremos novamente em 3 dias."
- App continua funcionando (grace period)
```

### Fluxo de Retry
```
Dia 0:  Falha inicial → past_due
Dia 3:  Retry #1 → Se falhar, continua past_due
Dia 5:  Retry #2 → Se falhar, continua past_due
Dia 7:  Retry #3 → Se falhar, cancela subscription
```

### Verificações
- [ ] `app_subscriptions.status` = 'past_due'
- [ ] `financial_alerts` tem alerta criado
- [ ] App continua processando webhooks (grace period)
- [ ] Retry job agendado


---

## 🟡 CENÁRIO 3: Webhook Duplicado

### Contexto
Stripe envia o mesmo webhook `invoice.paid` duas vezes (retry automático ou bug).

### Timeline
```
T+0s    Stripe envia invoice.paid (event_id: evt_123)
T+1s    Kernel processa, marca invoice como paid
T+5s    Stripe reenvia invoice.paid (event_id: evt_123) — retry
T+6s    Kernel recebe novamente
```

### O que o sistema DEVE fazer
```
1. Verificar processed_webhooks por (provider, external_event_id)
2. Encontrar: já processado
3. Retornar 200 OK imediatamente
4. NÃO processar novamente
5. NÃO duplicar registros
6. Logar como "duplicate_ignored"
```

### O que o usuário DEVE ver
```
- Nada. Transparente.
- Invoice aparece uma vez só
- Valor correto
```

### Verificações
- [ ] `processed_webhooks` tem apenas 1 entrada para evt_123
- [ ] `kernel_invoices` não duplicou
- [ ] Logs mostram "duplicate webhook ignored"
- [ ] Stripe recebe 200 OK (não tenta novamente)

---

## 🟠 CENÁRIO 4: Webhook Fora de Ordem

### Contexto
Stripe envia `invoice.paid` ANTES de `customer.subscription.created` (race condition).

### Timeline
```
T+0s    App faz checkout
T+1s    Stripe cria subscription
T+2s    Stripe envia invoice.paid (chega primeiro!)
T+3s    Kernel recebe invoice.paid — subscription não existe ainda
T+4s    Stripe envia customer.subscription.created
T+5s    Kernel recebe subscription.created
```

### O que o sistema DEVE fazer
```
Opção A (Recomendada): Criar subscription on-demand
1. invoice.paid chega
2. Verificar se subscription existe
3. Se não existe, criar com dados do invoice
4. Processar invoice normalmente

Opção B: Queue e retry
1. invoice.paid chega
2. Subscription não existe
3. Colocar em fila de retry (30s)
4. Quando subscription.created chegar, processar
5. Retry processa invoice.paid
```

### O que o usuário DEVE ver
```
- Checkout completo com sucesso
- Subscription ativa
- Invoice marcada como paga
```

### Verificações
- [ ] Subscription criada corretamente
- [ ] Invoice vinculada à subscription
- [ ] Sem erros no log
- [ ] Ordem dos eventos não importa para resultado final

---

## 🔴 CENÁRIO 5: Webhook Nunca Chega

### Contexto
Stripe cobra com sucesso, mas webhook não chega (network issue, bug, etc).

### Timeline
```
T+0     Stripe cobra R$ 99,00
T+1s    Stripe marca invoice como paid
T+2s    Stripe tenta enviar webhook
T+3s    Webhook falha (timeout, 500, etc)
T+1h    Stripe retry #1 — falha
T+4h    Stripe retry #2 — falha
T+24h   Stripe desiste
```

### O que o sistema DEVE fazer
```
1. Reconciliação periódica detecta divergência
2. Stripe tem invoice paid, kernel tem invoice pending
3. Criar alerta: "reconciliation_diff"
4. SuperAdmin investiga manualmente
5. Opção: sincronizar via API do Stripe
```

### O que o usuário DEVE ver
```
- Invoice aparece como "pendente" no dashboard
- Mas Stripe já cobrou
- SuperAdmin corrige manualmente ou via reconciliação
```

### Mitigação
```go
// Job de reconciliação (rodar diariamente)
func ReconcileWithStripe() {
    // 1. Buscar invoices pending no kernel
    // 2. Para cada uma, verificar status no Stripe
    // 3. Se Stripe diz "paid", atualizar kernel
    // 4. Se divergência, criar alerta
}
```

### Verificações
- [ ] Reconciliação detecta divergência
- [ ] Alerta criado automaticamente
- [ ] Mecanismo de correção manual existe
- [ ] Logs detalhados para investigação

---

## 🔴 CENÁRIO 6: Stripe Cobra, Kernel Não Marca

### Contexto
Webhook chega, mas processamento falha no meio. Stripe cobrou, kernel não atualizou.

### Timeline
```
T+0s    Stripe envia invoice.paid
T+1s    Kernel recebe webhook
T+2s    Kernel valida assinatura ✓
T+3s    Kernel busca subscription ✓
T+4s    Kernel tenta atualizar invoice
T+5s    ERRO: database locked / timeout / bug
T+6s    Kernel retorna 500
T+1m    Stripe retry webhook
```

### O que o sistema DEVE fazer
```
1. Idempotência: marcar webhook como "processing" ANTES de processar
2. Se falhar, webhook fica como "processing" ou "failed"
3. Stripe retry chega
4. Verificar status do webhook anterior
5. Se "failed", reprocessar
6. Se "processing" há muito tempo, reprocessar
```

### Proteção de Idempotência
```go
func ProcessWebhook(event StripeEvent) error {
    // 1. Tentar reservar (INSERT com status=processing)
    reserved, err := idempotency.CheckAndReserve(event.ID)
    if err != nil {
        return err // Já processado ou em processamento
    }
    
    // 2. Processar
    err = processInvoicePaid(event)
    
    // 3. Marcar resultado
    if err != nil {
        idempotency.MarkFailed(event.ID, err.Error())
        return err // Stripe vai retry
    }
    
    idempotency.MarkProcessed(event.ID)
    return nil
}
```

### Verificações
- [ ] Webhook marcado como "failed" no banco
- [ ] Retry do Stripe reprocessa com sucesso
- [ ] Invoice eventualmente marcada como paid
- [ ] Sem duplicação de dados

---

## 🟠 CENÁRIO 7: App Cancela no Stripe Direto

### Contexto
Admin do app acessa painel do Stripe diretamente e cancela subscription lá, sem passar pelo kernel.

### Timeline
```
T+0     Admin acessa dashboard.stripe.com
T+1m    Admin clica "Cancel subscription"
T+2m    Stripe cancela imediatamente
T+3m    Stripe envia webhook: customer.subscription.deleted
T+4m    Kernel recebe webhook
```

### O que o sistema DEVE fazer
```
1. Receber webhook customer.subscription.deleted
2. Buscar subscription pelo stripe_subscription_id
3. Marcar subscription como 'canceled'
4. Definir canceled_at = now()
5. Criar alerta: "subscription_canceled_externally"
6. Logar em audit_logs com source = "stripe_direct"
7. NÃO apagar dados de usage
```

### O que o usuário DEVE ver
```
- Dashboard mostra: "Plano cancelado"
- Acesso continua até fim do período pago
- Após período: downgrade para Free
```

### Verificações
- [ ] `app_subscriptions.status` = 'canceled'
- [ ] `app_subscriptions.canceled_at` preenchido
- [ ] Alerta criado para SuperAdmin
- [ ] App não perde dados históricos

---

## 🟡 CENÁRIO 8: Usuário Troca Cartão Durante Retry

### Contexto
App está em past_due (cartão recusado). Admin atualiza cartão no meio do período de retry.

### Timeline
```
Dia 0   Cobrança falha → past_due
Dia 2   Admin atualiza cartão no Stripe
Dia 2   Stripe envia: payment_method.attached
Dia 3   Retry automático com novo cartão
Dia 3   Cobrança sucesso → Stripe envia invoice.paid
```

### O que o sistema DEVE fazer
```
1. Receber payment_method.attached (opcional, só logar)
2. Manter subscription em past_due
3. Aguardar retry automático do Stripe
4. Quando invoice.paid chegar:
   - Atualizar subscription para 'active'
   - Marcar invoice como 'paid'
   - Limpar alertas de payment_failed
   - Resetar contador de retries
```

### O que o usuário DEVE ver
```
- Banner "Problema com pagamento" some
- Dashboard volta ao normal
- Email (futuro): "Pagamento confirmado!"
```

### Verificações
- [ ] Subscription volta para 'active'
- [ ] Invoice marcada como 'paid'
- [ ] Alertas antigos resolvidos
- [ ] Usage continua contando normalmente

---

## 🟡 CENÁRIO 9: Upgrade no Meio do Ciclo

### Contexto
App está no plano Free (ou Pro). No dia 15 do mês, faz upgrade para Pro (ou Enterprise).

### Timeline
```
Dia 1   App no plano Free, usage = 50 transações
Dia 15  Admin faz upgrade para Pro
Dia 15  Stripe calcula proration
Dia 15  Stripe cobra valor proporcional
Dia 15  Stripe envia: customer.subscription.updated + invoice.paid
```

### O que o sistema DEVE fazer
```
1. Receber customer.subscription.updated
2. Atualizar plan_id para novo plano
3. Atualizar limits imediatamente
4. Receber invoice.paid (proration)
5. Criar invoice com type = 'proration'
6. Usage do mês NÃO reseta (continua contando)
7. Novo limite já vale
```

### Cálculo de Proration (Stripe faz)
```
Dias restantes: 16 (de 15 a 31)
Pro mensal: R$ 99,00
Valor proporcional: R$ 99 × (16/31) = R$ 51,10
```

### O que o usuário DEVE ver
```
- Plano atualizado imediatamente
- Cobrança proporcional no cartão
- Novo limite de transações disponível
- Próxima cobrança: dia 1 do próximo mês (ciclo completo)
```

### Verificações
- [ ] `app_subscriptions.plan_id` atualizado
- [ ] Novo limite aplicado imediatamente
- [ ] Invoice de proration criada
- [ ] Usage não resetou

---

## 🟠 CENÁRIO 10: Downgrade + Cancelamento Mesmo Dia

### Contexto
Admin faz downgrade de Enterprise para Pro, e 2 horas depois cancela tudo.

### Timeline
```
T+0h    Admin solicita downgrade (Enterprise → Pro)
T+0h    Kernel agenda downgrade para próximo ciclo
T+2h    Admin solicita cancelamento
T+2h    Conflito: downgrade pendente + cancelamento
```

### O que o sistema DEVE fazer
```
1. Cancelamento tem prioridade sobre downgrade
2. Cancelar downgrade pendente
3. Processar cancelamento
4. Marcar subscription como 'canceled'
5. Acesso até fim do período pago (Enterprise)
6. Após período: vai para Free, não Pro
```

### Regra de Negócio
```
Prioridade de operações:
1. Cancelamento (sempre vence)
2. Downgrade
3. Upgrade

Se há conflito, a operação de maior prioridade cancela as pendentes.
```

### O que o usuário DEVE ver
```
- Mensagem: "Assinatura cancelada. Acesso até DD/MM/YYYY."
- Downgrade pendente desaparece
- Após período: plano Free
```

### Verificações
- [ ] Downgrade pendente cancelado
- [ ] Subscription marcada como 'canceled'
- [ ] `ends_at` definido corretamente
- [ ] Sem cobrança adicional

---

## 🔴 CENÁRIO 11: Stripe Fora do Ar

### Contexto
Stripe está com outage. Nenhuma operação de billing funciona.

### Timeline
```
T+0     Admin tenta fazer checkout
T+1s    Requisição para Stripe timeout
T+5s    Retry interno
T+10s   Timeout novamente
T+15s   Kernel detecta: Stripe indisponível
```

### O que o sistema DEVE fazer
```
1. Circuit breaker abre após N falhas
2. Retornar erro amigável (não 500 genérico)
3. Logar incidente
4. Criar alerta: "stripe_outage"
5. Operações de billing ficam indisponíveis
6. Resto do sistema continua funcionando
7. Não bloquear apps existentes
```

### Circuit Breaker Config
```go
circuitBreaker := &CircuitBreaker{
    MaxFailures:     5,
    Timeout:         30 * time.Second,
    HalfOpenMaxReqs: 2,
}
```

### O que o usuário DEVE ver
```
- Checkout: "Serviço de pagamento temporariamente indisponível. Tente em alguns minutos."
- Dashboard: Dados de billing podem estar desatualizados
- App continua funcionando normalmente
```

### Verificações
- [ ] Circuit breaker ativado
- [ ] Alerta criado para SuperAdmin
- [ ] Apps existentes não afetados
- [ ] Recuperação automática quando Stripe volta

---

## 🔴 CENÁRIO 12: Invoice Paga Duas Vezes

### Contexto
Bug raro: Stripe processa pagamento duas vezes (double charge).

### Timeline
```
T+0s    Stripe cobra R$ 99,00
T+1s    Stripe envia invoice.paid
T+2s    Kernel processa, marca paid
T+5s    Stripe cobra R$ 99,00 NOVAMENTE (bug)
T+6s    Stripe envia invoice.paid (mesmo invoice_id!)
```

### O que o sistema DEVE fazer
```
1. Segundo webhook chega
2. Verificar: invoice já está paid
3. Verificar: amount já registrado
4. Detectar: possível double charge
5. Criar alerta CRÍTICO: "possible_double_charge"
6. NÃO alterar nada no kernel
7. SuperAdmin investiga no Stripe
8. Se confirmado: refund manual no Stripe
```

### Detecção de Double Charge
```go
func DetectDoubleCharge(invoiceID string, amount int64) bool {
    existing := GetInvoice(invoiceID)
    if existing.Status == "paid" && existing.Amount == amount {
        // Já pago com mesmo valor = possível double charge
        CreateCriticalAlert("possible_double_charge", map[string]any{
            "invoice_id": invoiceID,
            "amount":     amount,
            "action":     "manual_review_required",
        })
        return true
    }
    return false
}
```

### O que o usuário DEVE ver
```
- Nada imediato (transparente)
- Se confirmado double charge: email de desculpas + refund
```

### Verificações
- [ ] Alerta crítico criado
- [ ] Invoice não duplicada no kernel
- [ ] SuperAdmin notificado
- [ ] Processo de refund documentado

---

## 🟠 CENÁRIO 13: Divergência Stripe × Kernel

### Contexto
Reconciliação detecta que Stripe e Kernel têm dados diferentes.

### Exemplos de Divergência
```
| Stripe                  | Kernel                  | Tipo           |
|-------------------------|-------------------------|----------------|
| subscription: active    | subscription: canceled  | Status diff    |
| invoice: paid           | invoice: pending        | Payment diff   |
| plan: pro               | plan: free              | Plan diff      |
| amount: R$ 99           | amount: R$ 89           | Amount diff    |
```

### O que o sistema DEVE fazer
```
1. Job de reconciliação roda diariamente
2. Para cada app com Stripe subscription:
   a. Buscar dados no Stripe via API
   b. Comparar com dados no kernel
   c. Se divergência: criar alerta
3. Classificar divergência por severidade
4. SuperAdmin decide ação:
   - Sincronizar do Stripe → Kernel
   - Sincronizar do Kernel → Stripe
   - Investigar manualmente
```

### Severidade das Divergências
```
🔴 CRÍTICA: Amount diferente (dinheiro!)
🔴 CRÍTICA: Status paid vs pending
🟠 ALTA: Status active vs canceled
🟡 MÉDIA: Plan diferente
🟢 BAIXA: Metadata diferente
```

### O que o usuário DEVE ver
```
- Nada (processo interno)
- Se afetar acesso: SuperAdmin corrige antes de impactar
```

### Verificações
- [ ] Reconciliação roda automaticamente
- [ ] Divergências detectadas e classificadas
- [ ] Alertas criados por severidade
- [ ] Histórico de correções em audit_logs

---

## 🟡 CENÁRIO 14: App Excede Quota em past_due

### Contexto
App está em past_due (pagamento falhou). Durante grace period, excede quota de transações.

### Timeline
```
Dia 0   Pagamento falha → past_due
Dia 1   App continua operando (grace period)
Dia 2   App atinge 5000 transações (limite Pro)
Dia 2   App tenta processar transação 5001
```

### O que o sistema DEVE fazer
```
1. Verificar status da subscription: past_due
2. Verificar usage: 5000/5000 (100%)
3. Decisão: BLOQUEAR novos processamentos
4. Motivo: past_due + quota excedida = sem tolerância
5. Webhooks continuam sendo RECEBIDOS
6. Webhooks ficam em pending_quota
7. Criar alerta: "quota_exceeded_past_due"
```

### Regra de Negócio
```
| Status    | Quota    | Ação                    |
|-----------|----------|-------------------------|
| active    | < 100%   | Processa normalmente    |
| active    | >= 100%  | Bloqueia processamento  |
| past_due  | < 100%   | Processa (grace period) |
| past_due  | >= 100%  | Bloqueia (sem tolerância)|
| canceled  | qualquer | Bloqueia tudo           |
```

### O que o usuário DEVE ver
```
- Banner: "Limite atingido + pagamento pendente"
- Ação necessária: Atualizar cartão OU fazer upgrade
- Webhooks não perdidos, só pausados
```

### Verificações
- [ ] Processamento bloqueado
- [ ] Webhooks armazenados (não perdidos)
- [ ] Alerta criado
- [ ] Desbloqueio automático após pagamento

---

## 🟡 CENÁRIO 15: Webhook com app_id Inválido

### Contexto
Webhook chega com metadata contendo app_id que não existe no kernel.

### Possíveis Causas
```
1. App foi deletado após criar subscription no Stripe
2. Metadata corrompida
3. Ataque/teste malicioso
4. Ambiente errado (staging vs production)
```

### Timeline
```
T+0s    Stripe envia invoice.paid
T+1s    Kernel extrai app_id do metadata
T+2s    Kernel busca app: NOT FOUND
T+3s    ???
```

### O que o sistema DEVE fazer
```
1. Logar evento completo (para investigação)
2. Criar alerta: "orphan_webhook"
3. Retornar 200 OK (para Stripe não retry infinito)
4. NÃO criar dados órfãos
5. SuperAdmin investiga:
   - Se app deletado: cancelar subscription no Stripe
   - Se metadata errada: corrigir no Stripe
   - Se ataque: bloquear origem
```

### Proteção
```go
func ProcessWebhook(event StripeEvent) error {
    appID := event.Metadata["app_id"]
    
    app, err := GetApp(appID)
    if err == ErrNotFound {
        LogOrphanWebhook(event)
        CreateAlert("orphan_webhook", map[string]any{
            "event_id":   event.ID,
            "event_type": event.Type,
            "app_id":     appID,
        })
        return nil // 200 OK, mas não processa
    }
    
    // Continua processamento normal...
}
```

### O que o usuário DEVE ver
```
- Nada (webhook órfão não afeta ninguém)
```

### Verificações
- [ ] Webhook logado completamente
- [ ] Alerta criado
- [ ] Stripe recebe 200 OK
- [ ] Nenhum dado órfão criado

---

## 📊 MATRIZ DE DECISÃO RÁPIDA

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBHOOK CHEGOU - E AGORA?                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Já processado?                                              │
│     └─ SIM → Retorna 200, ignora                                │
│     └─ NÃO → Continua                                           │
│                                                                 │
│  2. App existe?                                                 │
│     └─ NÃO → Loga, alerta, retorna 200                          │
│     └─ SIM → Continua                                           │
│                                                                 │
│  3. Subscription existe?                                        │
│     └─ NÃO → Criar on-demand (se invoice.paid)                  │
│     └─ SIM → Continua                                           │
│                                                                 │
│  4. Processar evento                                            │
│     └─ SUCESSO → Marca processado, retorna 200                  │
│     └─ FALHA → Marca failed, retorna 500 (Stripe retry)         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ CHECKLIST DE RESILIÊNCIA

### Antes de Ir para Produção
- [ ] Idempotência implementada (processed_webhooks)
- [ ] Circuit breaker para Stripe
- [ ] Reconciliação diária configurada
- [ ] Alertas configurados para todos os cenários críticos
- [ ] Logs estruturados com correlation_id
- [ ] Retry com backoff exponencial
- [ ] Grace period definido (7 dias)
- [ ] Processo de refund documentado

### Monitoramento Contínuo
- [ ] Dashboard de webhooks (recebidos/processados/falhos)
- [ ] Alerta se webhook_failure_rate > 5%
- [ ] Alerta se reconciliation_diff > 0
- [ ] Alerta se circuit_breaker_open
- [ ] Métricas de latência de processamento

---

## 📝 NOTAS FINAIS

> **Filosofia:** Webhook é contrato. Se Stripe enviou, o kernel precisa saber o que fazer — mesmo que seja "ignorar com elegância".

> **Regra de Ouro:** Nunca retorne 500 para webhook válido que você não consegue processar por bug interno. Logue, alerte, retorne 200, corrija depois.

> **Dinheiro:** Qualquer divergência envolvendo valores é CRÍTICA. Humano precisa validar antes de qualquer correção automática.

---

**Documento criado em:** 29/12/2024  
**Última atualização:** 29/12/2024  
**Status:** ✅ COMPLETO  
**Próximo passo:** Implementar handlers para cada cenário na Fase 28.2
