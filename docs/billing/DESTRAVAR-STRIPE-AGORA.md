# 🚀 DESTRAVAR STRIPE — GUIA DE 15 MINUTOS

## Por Que Você Trava

Você trava porque:
1. Parece complicado (não é)
2. Tem medo de fazer merda (normal)
3. São muitos passos (vou simplificar)

**A verdade:** São literalmente 3 coisas pra copiar e colar.

---

## PASSO 1: Pegar as Chaves (2 minutos)

### 1.1 — Abra o Stripe Dashboard
```
https://dashboard.stripe.com/test/apikeys
```
(Usa o link de TEST primeiro, não LIVE)

### 1.2 — Copie as Chaves

Você vai ver algo assim:
```
Publishable key: pk_test_51ABC...
Secret key: sk_test_51ABC... (clica em "Reveal test key")
```

**Copia a Secret key** (a que começa com `sk_test_`).

### 1.3 — Cole no .env

Abre o arquivo `UNO-main/.env` e adiciona:
```
STRIPE_SECRET_KEY=sk_test_COLE_AQUI_SUA_CHAVE
```

**PRONTO.** Stripe básico configurado.

---

## PASSO 2: Configurar Webhook (5 minutos)

### 2.1 — Vá para Webhooks
```
https://dashboard.stripe.com/test/webhooks
```

### 2.2 — Clique "Add endpoint"

### 2.3 — Preencha:

**Endpoint URL:**
```
http://localhost:8080/webhooks/stripe/test-app
```
(Depois em produção você muda pra URL real)

**Events to send:** Clica em "Select events" e marca:
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 2.4 — Clique "Add endpoint"

### 2.5 — Copie o Signing Secret

Depois de criar, clica no endpoint e copia o "Signing secret" (começa com `whsec_`).

### 2.6 — Cole no .env
```
STRIPE_WEBHOOK_SECRET=whsec_COLE_AQUI
```

**PRONTO.** Webhook configurado.

---

## PASSO 3: Testar (5 minutos)

### 3.1 — Reinicia o Backend
```bash
cd UNO-main/backend
go run ./cmd/api/main.go
```

### 3.2 — Verifica se Stripe está configurado

Olha no log do backend. Deve aparecer algo como:
```
✅ Stripe Service configurado (test mode)
```

Se aparecer "mock mode", a chave não foi lida. Verifica o .env.

### 3.3 — Testa criar um Payment Intent

```bash
# Faz login primeiro
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "almir", "password": "4152"}'

# Copia o token da resposta e usa aqui:
curl -X POST http://localhost:8080/api/v1/billing/payment-intents \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "brl"}'
```

Se retornar um ID que começa com `pi_` (não `pi_mock_`), **funcionou!**

---

## PASSO 4: Testar Webhook com Stripe CLI (Opcional mas Recomendado)

### 4.1 — Instala Stripe CLI
```bash
# Windows (com scoop)
scoop install stripe

# Ou baixa direto: https://stripe.com/docs/stripe-cli
```

### 4.2 — Faz Login
```bash
stripe login
```

### 4.3 — Escuta Webhooks Localmente
```bash
stripe listen --forward-to localhost:8080/webhooks/stripe/test-app
```

### 4.4 — Em Outro Terminal, Dispara um Evento de Teste
```bash
stripe trigger payment_intent.succeeded
```

Você deve ver o evento chegando no backend.

---

## RESUMO: O Que Você Precisa Fazer

```
[ ] 1. Copiar sk_test_xxx do Stripe Dashboard
[ ] 2. Colar no .env como STRIPE_SECRET_KEY
[ ] 3. Criar webhook endpoint no Stripe
[ ] 4. Copiar whsec_xxx 
[ ] 5. Colar no .env como STRIPE_WEBHOOK_SECRET
[ ] 6. Reiniciar backend
[ ] 7. Testar
```

**Tempo total: 15 minutos.**

---

## Se Der Erro

### "Stripe não configurado"
- Verifica se o .env está na pasta certa (UNO-main/backend/.env)
- Verifica se não tem aspas extras na chave
- Reinicia o backend

### "Invalid API Key"
- Você copiou a chave errada (talvez a Publishable ao invés da Secret)
- A chave deve começar com `sk_test_` ou `sk_live_`

### "Webhook signature verification failed"
- O signing secret está errado
- Verifica se copiou o `whsec_` completo

### "Connection refused"
- O backend não está rodando
- A porta está errada

---

## Depois Que Funcionar

1. **Faz um pagamento de teste** usando cartão de teste do Stripe:
   - Número: `4242 4242 4242 4242`
   - Data: qualquer data futura
   - CVC: qualquer 3 dígitos

2. **Verifica se o webhook chegou** nos logs do backend

3. **Quando estiver confiante**, muda pra chaves LIVE (produção)

---

## Motivação

Cara, você já construiu 90% do sistema. O Stripe é só copiar e colar 3 strings.

Não é sobre ser perfeito. É sobre fazer o primeiro pagamento passar.

**Vai lá. 15 minutos. Agora.**

---

*"O primeiro pagamento real muda o sistema mais do que 100 testes."*
