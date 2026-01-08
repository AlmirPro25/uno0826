# 🚀 QUICK START — Criar App e Gerar API Key

> Guia de 5 minutos para criar seu primeiro app no PROST-QS

---

## CONCEITO IMPORTANTE

O PROST-QS tem duas APIs distintas:

| API | Para quem | Autenticação |
|-----|-----------|--------------|
| **Admin API** | Você (dono do sistema) | JWT Token (login) |
| **App API** | Seus apps externos | API Key + Secret |

**O Admin Panel serve para gerenciar apps.**
**As API Keys servem para apps falarem com o kernel.**

---

## PASSO 1: Acessar o Admin

1. Backend: http://localhost:8080
2. Admin Panel: http://localhost:3001
3. Login: `almir` / `4152`

---

## PASSO 2: Criar App (via UI)

1. No menu lateral, clique em **Applications**
2. Clique em **Novo App**
3. Preencha:
   - **Nome**: Nome do seu app (ex: "Meu SaaS")
   - **Slug**: identificador único (ex: "meu-saas")
   - **Descrição**: opcional
4. Clique **Criar App**

---

## PASSO 3: Gerar API Key

1. Na lista de apps, clique no app criado
2. Clique em **Nova API Key**
3. Dê um nome (ex: "Production")
4. Selecione os scopes:
   - ✅ `identity` — autenticação de usuários
   - ✅ `billing` — pagamentos
   - ⬜ `agents` — governança de IA
   - ⬜ `audit` — logs
5. Clique **Gerar Key**

⚠️ **IMPORTANTE**: O `secret` só aparece UMA VEZ. Copie e guarde!

Você receberá:
```
Public Key:  pq_pk_xxxxxxxxxxxx  (identifica o app)
Secret Key:  pq_sk_xxxxxxxxxxxx  (autentica requests)
```

---

## PASSO 4: Usar no seu App

### Headers de Autenticação

```
X-Prost-App-Key: pq_pk_xxxxxxxxxxxx
X-Prost-App-Secret: pq_sk_xxxxxxxxxxxx
```

### Exemplo: Registrar evento de audit

```javascript
const PROST_URL = 'https://seu-dominio.com'; // ou localhost:8080

const headers = {
  'X-Prost-App-Key': 'pq_pk_xxx',
  'X-Prost-App-Secret': 'pq_sk_xxx',
  'Content-Type': 'application/json'
};

// O kernel resolve o app_id automaticamente pela API Key
// Você NUNCA envia app_id no body
fetch(`${PROST_URL}/api/v1/apps/events`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    type: 'user.login',
    actor_id: 'user-123',
    actor_type: 'user',
    action: 'login'
  })
});
```

---

## PASSO 5: Conectar Stripe (opcional)

1. Na página do app, clique em **Payment**
2. Cole suas chaves do Stripe:
   - Secret Key: `sk_test_xxx` ou `sk_live_xxx`
   - Publishable Key: `pk_test_xxx` ou `pk_live_xxx`
3. Selecione ambiente (test/live)
4. Clique **Conectar Stripe**

---

## O QUE VOCÊ GANHA

| Recurso | Status |
|---------|--------|
| App ID único | ✅ |
| API Key + Secret | ✅ |
| Métricas isoladas por app | ✅ |
| Usuários isolados por app | ✅ |
| Sessões isoladas por app | ✅ |
| Billing isolado por app | ✅ |
| Audit log isolado por app | ✅ |

---

## ENDPOINTS — App API (via API Key)

Estes endpoints usam `X-Prost-App-Key` + `X-Prost-App-Secret`:

```
POST /api/v1/apps/events      → Registrar evento de audit
GET  /api/v1/apps/events      → Listar eventos do app
```

O kernel resolve automaticamente qual app está fazendo a request.
**Isolamento garantido. Impossível um app ver dados de outro.**

---

## ENDPOINTS — Admin API (via JWT)

Estes endpoints usam `Authorization: Bearer <token>`:

```
POST /api/v1/apps                    → Criar app
GET  /api/v1/apps/mine               → Listar meus apps
GET  /api/v1/apps/:id                → Detalhes do app
POST /api/v1/apps/:id/credentials    → Gerar API Key
GET  /api/v1/apps/:id/metrics        → Métricas do app
POST /api/v1/apps/:id/billing/checkout → Criar checkout
```

---

## PRÓXIMOS PASSOS

1. **Agora**: Criar seu primeiro app e gerar API Key
2. **Depois**: Configurar Stripe com chaves reais
3. **Deploy**: Colocar em produção (Fly.io)
4. **Primeiro pagamento**: Seguir `CHECKLIST-PRIMEIRO-PAGAMENTO-REAL.md`

---

## REGRA DE OURO

> O app nunca envia `app_id` no body.
> O kernel resolve o app a partir da API Key.
> Isso garante isolamento, impossibilidade de spoof, e auditoria limpa.

---

*"Cada app é um cidadão de primeira classe. Isolado, seguro, mensurável."*
