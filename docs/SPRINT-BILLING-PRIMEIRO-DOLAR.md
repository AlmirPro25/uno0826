# SPRINT: PRIMEIRO DÓLAR 💵

> Objetivo: Processar o primeiro pagamento real. Não billing bonito. Dinheiro entrando.

**Data:** 12 de Janeiro de 2026  
**Duração:** 2-4 horas  
**Resultado esperado:** $1 real na conta

---

## 🎯 REGRA DE OURO

```
Se o dinheiro entrou UMA vez, o resto é engenharia.
```

**NÃO FAZER AGORA:**
- ❌ Múltiplos planos
- ❌ Múltiplos preços
- ❌ Ledger perfeito
- ❌ Documentação completa
- ❌ UI bonita

**FAZER AGORA:**
- ✅ 1 plano
- ✅ 1 preço
- ✅ 1 checkout
- ✅ 1 webhook
- ✅ 1 pagamento real

---

## 📋 TAREFAS EXECUTÁVEIS

### FASE 1: Stripe Dashboard (30 min)

```
[x] 1. Acessar https://dashboard.stripe.com
[x] 2. Criar produto:
       Nome: "PROST-QS Pro"
       Descrição: "Plataforma de governança para apps"
[x] 3. Criar preço:
       Valor: R$99/mês
       Recorrência: Mensal
[x] 4. Anotar IDs:
       STRIPE_PRODUCT_ID: prod_xxxxx
       STRIPE_PRICE_ID: price_1SnMCgInQBs0OE9Df5OVQD5i (HARDCODED)
[ ] 5. Verificar webhook endpoint:
       URL: https://uno0826.onrender.com/api/v1/billing/webhook
       Eventos: checkout.session.completed, customer.subscription.*
```

### FASE 2: Backend Config (15 min)

```
[x] 6. Atualizar .env no Render:
       STRIPE_PRICE_ID_PRO=price_1SnMCgInQBs0OE9Df5OVQD5i (HARDCODED no código)
       
[x] 7. Verificar variáveis existentes:
       STRIPE_SECRET_KEY=sk_live_xxxxx (ou sk_test para teste)
       STRIPE_WEBHOOK_SECRET=whsec_xxxxx
       
[x] 8. Backend implementado:
       - POST /billing/checkout → CreateCheckoutSession
       - POST /billing/checkout/pro → Alias para frontend
       - POST /billing/portal → CreatePortalSession (Stripe Customer Portal)
       - POST /billing/webhook → HandleStripeWebhook (com idempotência)
       - GET /billing/subscriptions/status → GetSubscriptionStatus
       
[x] 9. Testes passando:
       - TestStripeService_CreateCheckoutSession_MockMode ✅
       - TestStripeService_CreatePortalSession_MockMode ✅
       - TestBillingService_CreateSubscriptionFromStripe ✅
       - TestBillingService_GetSubscriptionStatus_NoSubscription ✅
       - TestBillingService_GetSubscriptionStatus_WithSubscription ✅
       - TestCheckout_WebhookIdempotency ✅
```

### FASE 3: Teste com Cartão de Teste (30 min)

```
[ ] 8. Acessar dashboard: https://frontend-prost.vercel.app
[ ] 9. Fazer login
[ ] 10. Ir para Billing
[ ] 11. Clicar em "Upgrade para Pro"
[ ] 12. Usar cartão de teste:
        Número: 4242 4242 4242 4242
        Validade: qualquer futura
        CVC: qualquer 3 dígitos
[ ] 13. Completar checkout
[ ] 14. Verificar no Stripe Dashboard:
        - Checkout session criada?
        - Customer criado?
        - Subscription criada?
[ ] 15. Verificar webhook:
        - Evento chegou no backend?
        - Logs mostram processamento?
[ ] 16. Verificar banco:
        - Subscription salva?
        - Ledger entry criada?
```

**IMPLEMENTAÇÃO COMPLETA:**
- ✅ Frontend: Página de billing com botão "Upgrade para Pro — R$99/mês"
- ✅ Frontend: Suspense boundary para useSearchParams
- ✅ Frontend: Toast de sucesso/cancelamento após redirect do Stripe
- ✅ Backend: POST /billing/checkout/pro → Cria Stripe Checkout Session
- ✅ Backend: POST /billing/portal → Cria Stripe Customer Portal Session
- ✅ Backend: POST /billing/webhook → Processa webhooks com idempotência
- ✅ Backend: client_reference_id para resolução determinística de account
- ✅ Testes: 6 testes de checkout passando

### FASE 4: Primeiro Pagamento REAL (15 min)

```
[ ] 17. Trocar para modo LIVE no Stripe (se ainda em test)
[ ] 18. Usar cartão REAL (seu próprio)
[ ] 19. Pagar $1 (criar preço de $1 só para validar)
        OU pagar $9.90 mesmo
[ ] 20. Verificar:
        - Dinheiro apareceu no Stripe?
        - Webhook processou?
        - Subscription ativa no sistema?
```

### FASE 5: Documentar (15 min)

```
[ ] 21. Anotar o que funcionou
[ ] 22. Anotar o que quebrou
[ ] 23. Screenshot do primeiro pagamento
[ ] 24. Atualizar ONDE-ESTOU-AGORA.md
```

---

## 🔧 TROUBLESHOOTING

### Webhook não chega

```bash
# Verificar no Stripe Dashboard → Developers → Webhooks
# Ver eventos enviados e respostas

# Se 404: endpoint errado
# Se 401: STRIPE_WEBHOOK_SECRET errado
# Se 500: bug no handler
```

### Checkout não abre

```bash
# Verificar console do browser
# Verificar se STRIPE_PRICE_ID está correto
# Verificar se frontend está chamando endpoint certo
```

### Subscription não salva

```bash
# Verificar logs do backend no Render
# Verificar se webhook handler está processando
# Verificar se banco está acessível
```

---

## ✅ DEFINIÇÃO DE DONE

```
O sprint está COMPLETO quando:

1. [ ] Stripe mostra pagamento recebido
2. [ ] Webhook foi processado (logs confirmam)
3. [ ] Subscription existe no banco
4. [ ] Dashboard mostra plano ativo

Bônus (não obrigatório):
- [ ] Ledger entry criada
- [ ] Email de confirmação enviado
```

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Antes | Depois |
|---------|-------|--------|
| Pagamentos processados | 0 | 1+ |
| Receita total | $0 | $1+ |
| Webhook success rate | ? | 100% |
| Subscription ativa | 0 | 1+ |

---

## 🚨 SE ALGO QUEBRAR

### Prioridade 1: Webhook falha
```
1. Verificar STRIPE_WEBHOOK_SECRET
2. Verificar endpoint URL
3. Verificar logs do handler
4. Testar com Stripe CLI local se necessário
```

### Prioridade 2: Checkout não funciona
```
1. Verificar STRIPE_PRICE_ID
2. Verificar se produto está ativo no Stripe
3. Verificar console do frontend
```

### Prioridade 3: Banco não salva
```
1. Verificar conexão com Neon
2. Verificar migrations
3. Verificar logs de erro
```

---

## 🎉 DEPOIS DO PRIMEIRO DÓLAR

Quando o primeiro pagamento entrar:

```
FASE 2 (próxima semana):
├── Adicionar plano Starter ($9.90)
├── Adicionar plano Pro ($29.90)
├── Adicionar plano Enterprise ($99.90)
├── Melhorar UI de billing
└── Testar upgrade/downgrade

FASE 3 (semana seguinte):
├── Ledger completo
├── Reconciliação automática
├── Invoices
└── Cancelamento
```

**Mas primeiro: $1 real.**

---

## 📝 NOTAS DE EXECUÇÃO

```
Data de início: 12/01/2026
Hora de início: 09:20

Progresso:
✅ Backend: Checkout, Portal, Webhook implementados
✅ Frontend: Billing page com Suspense boundary
✅ Testes: 6 testes de checkout passando
✅ Testes: 20+ testes de kernel_billing passando
✅ Build: Backend e Frontend compilando
✅ GitHub: Código pushado para https://github.com/AlmirPro25/uno0826

PRONTO PARA TESTE MANUAL:
1. Acessar: https://frontend-prost.vercel.app/dashboard/billing
2. Fazer login
3. Clicar em "Upgrade para Pro — R$99/mês"
4. Usar cartão de teste: 4242 4242 4242 4242
5. Validade: qualquer futura (ex: 12/30)
6. CVC: qualquer 3 dígitos (ex: 123)
7. Verificar toast de sucesso após redirect

Observações:
- Price ID hardcoded: price_1SnMCgInQBs0OE9Df5OVQD5i
- Frontend: https://frontend-prost.vercel.app/dashboard/billing
- Backend: https://uno0826.onrender.com/api/v1/billing/webhook
```

---

*"O primeiro dólar vale mais que o primeiro milhão em código."*
