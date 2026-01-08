# 🏁 CHECKLIST — PRIMEIRO PAGAMENTO REAL

> "Nas próximas 2 semanas, todo esforço vai para fazer 1 pagamento real passar pelo sistema, com 1 app real, e 1 usuário real. Qualquer coisa fora disso é secundária."

---

## OBJETIVO

Processar **R$ 1,00 real** através do sistema, do checkout até o webhook confirmado.

Não é sobre receita. É sobre:
- Imposto
- Chargeback possível
- Webhook real
- Latência real
- Erro fora do script

---

## PRÉ-REQUISITOS

### Stripe (obrigatório)
- [ ] Conta Stripe ativada (não test mode)
- [ ] Conta bancária conectada para receber
- [ ] Webhook endpoint configurado em produção
- [ ] Chaves de produção no `.env`:
  ```
  STRIPE_SECRET_KEY=sk_live_xxx
  STRIPE_WEBHOOK_SECRET=whsec_xxx
  KERNEL_STRIPE_TEST_MODE=false
  ```

### Backend (obrigatório)
- [ ] Backend rodando em produção (Fly.io ou similar)
- [ ] Banco de dados persistente (não SQLite local)
- [ ] HTTPS configurado
- [ ] Logs acessíveis

### Pilot Zero (obrigatório)
- [ ] VOX-BRIDGE registrado como piloto
- [ ] Piloto ativado: `POST /admin/kernel/billing/pilots/:app_id/activate`
- [ ] Flag `live_billing` habilitada para piloto: `PUT /admin/kernel/billing/flags/live_billing`

---

## SEQUÊNCIA DE EXECUÇÃO

### FASE 1: Preparação (30 min)

```bash
# 1. Verificar status do sistema
curl https://seu-dominio.com/health

# 2. Verificar status do Stripe
curl -H "Authorization: Bearer $TOKEN" \
  https://seu-dominio.com/api/v1/admin/kernel/billing/stripe/status

# 3. Verificar status do rollout
curl -H "Authorization: Bearer $TOKEN" \
  https://seu-dominio.com/api/v1/admin/kernel/billing/rollout/status
```

**Esperado:**
- Health: `ok`
- Stripe: `configured: true, test_mode: false`
- Rollout: `phase: single_pilot`

---

### FASE 2: Criar Checkout (5 min)

```bash
# Criar sessão de checkout para o Pilot Zero
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "plan_starter",
    "email": "seu-email@real.com",
    "name": "Pilot Zero Test"
  }' \
  https://seu-dominio.com/api/v1/apps/4fb16e2f-f8f0-425d-84f0-2ef3176bba43/billing/checkout
```

**Esperado:**
```json
{
  "session_id": "cs_live_xxx",
  "checkout_url": "https://checkout.stripe.com/xxx",
  "expires_at": "2024-12-30T..."
}
```

---

### FASE 3: Pagar (2 min)

1. Abrir `checkout_url` no navegador
2. Usar cartão **REAL** (seu cartão pessoal)
3. Pagar R$ 1,00 (ou o valor mínimo do plano)
4. Aguardar confirmação

**⚠️ ATENÇÃO:** Isso é dinheiro real. Você será cobrado.

---

### FASE 4: Verificar Webhook (5 min)

```bash
# Verificar webhooks recebidos
curl -H "Authorization: Bearer $TOKEN" \
  https://seu-dominio.com/api/v1/admin/kernel/billing/alerts

# Verificar subscription atualizada
curl -H "Authorization: Bearer $TOKEN" \
  https://seu-dominio.com/api/v1/apps/4fb16e2f-f8f0-425d-84f0-2ef3176bba43/billing/subscription

# Verificar invoices
curl -H "Authorization: Bearer $TOKEN" \
  https://seu-dominio.com/api/v1/apps/4fb16e2f-f8f0-425d-84f0-2ef3176bba43/billing/invoices
```

**Esperado:**
- Webhook `checkout.session.completed` recebido
- Webhook `invoice.paid` recebido
- Subscription status: `active`
- Invoice status: `paid`

---

### FASE 5: Verificar Reconciliação (5 min)

```bash
# Rodar reconciliação manual
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  https://seu-dominio.com/api/v1/admin/kernel/billing/reconciliation/run

# Verificar divergências
curl -H "Authorization: Bearer $TOKEN" \
  https://seu-dominio.com/api/v1/admin/kernel/billing/reconciliation/divergences
```

**Esperado:**
- Divergências: 0
- Stripe × Kernel: sincronizados

---

## CRITÉRIOS DE SUCESSO

| Critério | Obrigatório |
|----------|-------------|
| Checkout criado | ✅ |
| Pagamento processado | ✅ |
| Webhook recebido | ✅ |
| Webhook não duplicado | ✅ |
| Subscription atualizada | ✅ |
| Invoice criada | ✅ |
| Reconciliação sem divergência | ✅ |
| Nenhum alerta crítico | ✅ |

---

## SE ALGO FALHAR

### Webhook não chegou
1. Verificar URL do webhook no Stripe Dashboard
2. Verificar logs do backend
3. Verificar se HTTPS está funcionando
4. Testar com Stripe CLI: `stripe listen --forward-to localhost:8080/api/v1/kernel/webhooks/stripe`

### Subscription não atualizou
1. Verificar logs do webhook handler
2. Verificar se `app_id` está correto no metadata
3. Rodar reconciliação manual

### Divergência encontrada
1. Verificar detalhes da divergência
2. Comparar dados Stripe × Kernel
3. Resolver manualmente se necessário

### Rollback de emergência
```bash
# Pausar piloto imediatamente
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  https://seu-dominio.com/api/v1/admin/kernel/billing/pilots/4fb16e2f-f8f0-425d-84f0-2ef3176bba43/pause

# Desabilitar flag
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false, "percentage": 0}' \
  https://seu-dominio.com/api/v1/admin/kernel/billing/flags/live_billing
```

---

## APÓS O PRIMEIRO PAGAMENTO

### Dia 1-3: Observar
- [ ] Verificar logs diariamente
- [ ] Verificar alertas
- [ ] Verificar métricas do piloto

### Dia 4-7: Estabilizar
- [ ] Processar mais 2-3 pagamentos de teste
- [ ] Testar cenário de falha (cartão recusado)
- [ ] Testar cancelamento

### Dia 8+: Expandir (se estável)
- [ ] Considerar segundo app piloto
- [ ] Considerar early_rollout (10%)

---

## MÉTRICAS A OBSERVAR

| Métrica | Alvo |
|---------|------|
| Webhooks recebidos | 100% |
| Webhooks processados | 100% |
| Divergências | 0 |
| Alertas críticos | 0 |
| Latência webhook | < 5s |

---

## COMANDO FINAL

Quando estiver pronto, execute na ordem:

```bash
# 1. Ativar piloto
POST /admin/kernel/billing/pilots/4fb16e2f-f8f0-425d-84f0-2ef3176bba43/activate

# 2. Habilitar flag (só para piloto)
PUT /admin/kernel/billing/flags/live_billing
{"enabled": true, "percentage": 0}

# 3. Criar checkout
POST /apps/4fb16e2f-f8f0-425d-84f0-2ef3176bba43/billing/checkout

# 4. Pagar com cartão real

# 5. Verificar tudo
```

---

*"O primeiro pagamento real muda o sistema mais do que 100 testes."*

---

*Documento criado em 30/12/2024*
