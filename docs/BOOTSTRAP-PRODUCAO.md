# Bootstrap de Produção — PROST-QS

**Documento fundador para inicialização do sistema em produção**

---

## 1. O Problema do Ovo e da Galinha

Todo sistema de governança enfrenta um paradoxo:

> Para criar um admin, você precisa de um admin.
> Mas não existe admin antes do primeiro admin.

O PROST-QS resolve isso com **Bootstrap por Variável de Ambiente**.

---

## 2. Mecanismo de Bootstrap

### Como funciona

```
SUPER_ADMIN_EMAIL=admin@prostqs.com
```

Quando um usuário se registra com esse email:
- O sistema automaticamente atribui `role: super_admin`
- O JWT gerado já contém a autoridade máxima
- O usuário pode governar o sistema imediatamente

### Código responsável

```go
// backend/internal/auth/service.go

superAdminEmail := os.Getenv("SUPER_ADMIN_EMAIL")
if superAdminEmail != "" && email == superAdminEmail {
    role = "super_admin"
    log.Printf("🔐 BOOTSTRAP: Usuário %s criado como super_admin", username)
}
```

---

## 3. Procedimento de Inicialização

### Passo 1: Configurar variável no Render

```bash
# No dashboard do Render → Environment Variables
SUPER_ADMIN_EMAIL=seu-email-real@dominio.com
```

### Passo 2: Registrar o super_admin

```bash
curl -X POST https://uno0826.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "SenhaForte123!",
    "email": "seu-email-real@dominio.com"
  }'
```

### Passo 3: Fazer login e verificar

```bash
curl -X POST https://uno0826.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "SenhaForte123!"
  }'
```

Decodifique o JWT retornado. Deve conter:
```json
{
  "role": "super_admin",
  "account_status": "active"
}
```

### Passo 4: Remover ou alterar a variável

**CRÍTICO**: Após criar o primeiro super_admin:

1. Remova `SUPER_ADMIN_EMAIL` do Render, OU
2. Altere para um email que nunca será usado

Isso evita escalada de privilégio acidental.

---

## 4. Secrets de Produção

### Gerar secrets seguros

```bash
# JWT Secret (64 caracteres)
openssl rand -base64 48

# AES Key (exatamente 32 bytes)
openssl rand -base64 24 | head -c 32

# Stripe Webhook Secret
# Obtido no dashboard do Stripe ao criar o webhook
```

### Variáveis obrigatórias no Render

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `JWT_SECRET` | Assinatura de tokens | `K7x9...` (64+ chars) |
| `AES_SECRET_KEY` | Criptografia de dados | `Ab3d...` (32 bytes) |
| `SECRETS_MASTER_KEY` | Secrets system | `Xy7z...` (32 bytes) |
| `STRIPE_SECRET_KEY` | API do Stripe | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Validação de webhooks | `whsec_...` |
| `SUPER_ADMIN_EMAIL` | Bootstrap inicial | `admin@...` |

---

## 5. Configuração do Stripe

### Passo 1: Criar produtos no Stripe Dashboard

1. Acesse https://dashboard.stripe.com/products
2. Crie o produto "PROST-QS Pro"
3. Adicione preço: R$ 99,00 / mês
4. Copie o `price_id` (ex: `price_1ABC...`)

### Passo 2: Criar webhook

1. Acesse https://dashboard.stripe.com/webhooks
2. Adicione endpoint: `https://uno0826.onrender.com/api/v1/billing/webhook`
3. Selecione eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copie o `Signing secret` → `STRIPE_WEBHOOK_SECRET`

### Passo 3: Configurar no backend

Atualize o `price_id` no código ou via variável de ambiente.

---

## 6. Checklist Final

### Antes de ir para produção

- [ ] `SUPER_ADMIN_EMAIL` configurado
- [ ] Super admin criado e testado
- [ ] `SUPER_ADMIN_EMAIL` removido/alterado
- [ ] `JWT_SECRET` forte (64+ chars)
- [ ] `AES_SECRET_KEY` forte (32 bytes)
- [ ] `STRIPE_SECRET_KEY` configurado
- [ ] `STRIPE_WEBHOOK_SECRET` configurado
- [ ] Webhook do Stripe testado
- [ ] Backup do SQLite configurado
- [ ] Domínio customizado (opcional)

### Após produção

- [ ] Primeiro usuário real criado
- [ ] Primeiro app real criado
- [ ] Primeiro pagamento processado
- [ ] Kill switch testado
- [ ] Audit log verificado

---

## 7. Disaster Recovery

Se perder acesso ao super_admin:

1. Configure `SUPER_ADMIN_EMAIL` com novo email
2. Registre novo usuário com esse email
3. Remova a variável após recuperar acesso

O sistema foi projetado para ser recuperável sem acesso direto ao banco.

---

## 8. Hierarquia de Autoridade

```
super_admin
    │
    ├── Pode tudo
    ├── Kill switch global
    ├── Promover/rebaixar admins
    └── Acesso ao console cognitivo
    
admin
    │
    ├── Gerenciar usuários
    ├── Ver audit logs
    └── Gerenciar apps

user
    │
    ├── Criar apps (se plano permitir)
    ├── Ver próprios dados
    └── Gerenciar billing próprio
```

---

**Última atualização:** Janeiro 2026  
**Versão do documento:** 1.0
