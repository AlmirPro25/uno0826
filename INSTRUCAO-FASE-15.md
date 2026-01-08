# FASE 15 — APPLICATION IDENTITY & TENANT CONTEXT

**Data**: 2025-12-28
**Status**: ✅ IMPLEMENTADO

---

## O Problema Resolvido

Antes: O sistema não sabia "de onde veio" cada request.
Agora: Toda request pode carregar contexto de Application.

---

## Nova Arquitetura Mental

```
┌────────────┐
│ Application│  ← identidade raiz
└─────┬──────┘
      ↓
┌────────────┐
│   User     │  ← usuário DENTRO do app
└─────┬──────┘
      ↓
┌────────────┐
│  Session   │  ← login naquele app
└─────┬──────┘
      ↓
┌────────────┐
│  Action    │
└─────┬──────┘
      ↓
┌────────────┐
│  Decision  │
└─────┬──────┘
      ↓
┌────────────┐
│   Audit    │
└────────────┘
```

---

## Entidades Criadas

### Application
```go
Application {
  id
  name
  slug (único)
  owner_id
  owner_type: user | org | system
  status: active | suspended | deleted
  webhook_url
  redirect_url
  settings (JSON)
}
```

### AppCredential
```go
AppCredential {
  id
  app_id
  name
  public_key: pq_pk_xxx
  secret_hash
  scopes: ["identity", "billing", "agents"]
  status
  last_used_at
  expires_at
}
```

### AppUser
```go
AppUser {
  id
  app_id
  user_id
  external_user_id
  status
  first_seen_at
  last_seen_at
}
```

### AppSession
```go
AppSession {
  id
  app_id
  app_user_id
  user_id
  ip_address
  user_agent
  device_type
  country
  status: active | expired | revoked
  expires_at
  revoked_at
  revoke_reason
}
```

---

## Endpoints Criados

### Applications
- `POST /api/v1/apps` - Criar app
- `GET /api/v1/apps/mine` - Listar meus apps
- `GET /api/v1/apps/:id` - Buscar app
- `PUT /api/v1/apps/:id` - Atualizar app
- `GET /api/v1/apps/:id/metrics` - Métricas do app
- `GET /api/v1/apps` - Listar todos (admin)
- `POST /api/v1/apps/:id/suspend` - Suspender app (admin)

### Credentials
- `POST /api/v1/apps/:id/credentials` - Criar credencial
- `GET /api/v1/apps/:id/credentials` - Listar credenciais
- `DELETE /api/v1/apps/:id/credentials/:credId` - Revogar credencial

### App Users
- `GET /api/v1/apps/:id/users` - Listar usuários do app

### Sessions
- `GET /api/v1/apps/:id/users/:userId/sessions` - Listar sessões
- `DELETE /api/v1/apps/:id/users/:userId/sessions` - Revogar todas
- `DELETE /api/v1/apps/sessions/:sessionId` - Revogar sessão

---

## Como Usar

### 1. Criar Application
```bash
POST /api/v1/apps
{
  "name": "Meu App",
  "slug": "meu-app",
  "description": "Descrição"
}
```

### 2. Criar Credenciais
```bash
POST /api/v1/apps/{app_id}/credentials
{
  "name": "Production",
  "scopes": ["identity", "billing", "agents"]
}
```

Resposta (GUARDAR O SECRET!):
```json
{
  "credential": { "public_key": "pq_pk_xxx" },
  "secret": "pq_sk_xxx",
  "warning": "O secret não será mostrado novamente"
}
```

### 3. Usar nas Requests
```
X-App-Key: pq_pk_xxx
X-App-Secret: pq_sk_xxx
```

---

## Próximos Passos

1. Integrar AppContext em todos os endpoints
2. Atualizar Audit para incluir app_id
3. Atualizar Admin Console para visão por App
4. Criar SDK com suporte a App Credentials

---

## Credenciais de Teste

**App**: Meu Primeiro App
- ID: `b609e73a-bf21-406f-b122-58a3ed21ce9c`
- Slug: `meu-primeiro-app`

**Credential**: Production
- Public Key: `pq_pk_91eb3bac7a53b6222630a6660882f6b2`
- Secret: `pq_sk_d0d353f2e10d7cf21d6d078622c7f996390a8d9a52a9896e0ea1bfa0237394e9`
