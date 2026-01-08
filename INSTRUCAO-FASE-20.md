# FASE 20 - SECRETS SYSTEM

## STATUS: ✅ IMPLEMENTADO E INTEGRADO

## O QUE É

Sistema de gerenciamento de segredos (API keys, tokens, credenciais) com:
- Criptografia AES-256-GCM em repouso
- Nunca expõe valor completo (só últimos 4 chars)
- Versionamento automático
- Audit log de acesso
- Rotação manual
- Binding por app + ambiente

---

## PROBLEMA RESOLVIDO

Antes:
- Chaves no código
- Secrets em .env commitado
- Sem controle de quem acessou
- Sem rotação
- Sem expiração

Depois:
- Secrets criptografados no banco
- Acesso controlado e logado
- Versionamento completo
- Rotação com histórico
- Expiração configurável

---

## ARQUITETURA

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN UI                                  │
│  Cadastrar │ Rotacionar │ Revogar │ Ver Log                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 SECRETS SERVICE                              │
│  Create │ Update │ Revoke │ Rotate │ Inject                 │
├─────────────────────────────────────────────────────────────┤
│                 CRIPTOGRAFIA                                 │
│  AES-256-GCM │ Master Key │ Nonce único                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE                                  │
│  secrets │ secret_versions │ secret_accesses                │
└─────────────────────────────────────────────────────────────┘
```

---

## MODELO DE DADOS

### Secret
```go
type Secret struct {
    ID             uuid.UUID  // Identificador único
    AppID          *uuid.UUID // nil = global
    Environment    string     // production, staging, development
    Name           string     // STRIPE_SECRET_KEY, etc
    EncryptedValue string     // Valor criptografado (nunca expor)
    Description    string     // Descrição
    Category       string     // api_key, oauth, database, etc
    Version        int        // Versão atual
    ExpiresAt      *time.Time // Expiração opcional
    IsActive       bool       // Se está ativo
    CreatedBy      uuid.UUID  // Quem criou
    RevokedAt      *time.Time // Quando foi revogado
    RevokedBy      *uuid.UUID // Quem revogou
}
```

### SecretVersion
```go
type SecretVersion struct {
    ID             uuid.UUID
    SecretID       uuid.UUID
    Version        int
    EncryptedValue string
    CreatedBy      uuid.UUID
    Reason         string // initial, rotation, update
}
```

### SecretAccess
```go
type SecretAccess struct {
    ID        uuid.UUID
    SecretID  uuid.UUID
    AppID     *uuid.UUID
    ActorID   uuid.UUID
    ActorType string    // user, agent, system
    Action    string    // read, inject, list
    IP        string
    UserAgent string
    Success   bool
    Error     string
    Timestamp time.Time
}
```

---

## ENDPOINTS

### CRUD
```
POST   /api/v1/secrets           → Criar secret
GET    /api/v1/secrets           → Listar secrets
GET    /api/v1/secrets/:id       → Buscar por ID
PUT    /api/v1/secrets/:id       → Atualizar valor
DELETE /api/v1/secrets/:id       → Revogar
```

### Rotação e Expiração
```
POST   /api/v1/secrets/:id/rotate  → Rotacionar
GET    /api/v1/secrets/expiring    → Listar expirando
```

### Audit
```
GET    /api/v1/secrets/:id/access-log  → Log de acesso
GET    /api/v1/secrets/:id/versions    → Histórico de versões
```

---

## SEGURANÇA

### Criptografia
- AES-256-GCM (Galois/Counter Mode)
- Nonce único por operação
- Master key de 32 bytes (configurável via env)

### Acesso
- Todas as rotas são admin-only
- Valor nunca retornado completo (só últimos 4 chars)
- Todo acesso é logado

### Proteções
- Verificação de duplicata por nome+ambiente
- Verificação de expiração antes de injetar
- Secrets revogados não podem ser atualizados

---

## EXEMPLO DE USO

### Criar Secret
```bash
POST /api/v1/secrets
{
  "app_id": "abc123...",
  "environment": "production",
  "name": "STRIPE_SECRET_KEY",
  "value": "sk_live_xxxxx",
  "description": "Chave de produção do Stripe",
  "category": "api_key",
  "expires_at": "2025-12-31T23:59:59Z"
}
```

### Resposta (valor mascarado)
```json
{
  "id": "xyz789...",
  "app_id": "abc123...",
  "environment": "production",
  "name": "STRIPE_SECRET_KEY",
  "description": "Chave de produção do Stripe",
  "category": "api_key",
  "version": 1,
  "expires_at": "2025-12-31T23:59:59Z",
  "is_active": true,
  "is_expired": false,
  "last_chars": "****xxxx",
  "created_at": "2024-12-29T..."
}
```

### Rotacionar
```bash
POST /api/v1/secrets/xyz789.../rotate
{
  "value": "sk_live_novo_valor"
}
```

---

## INJEÇÃO (USO INTERNO)

O método `Inject` retorna secrets descriptografados para uso interno:

```go
// Só usar internamente, nunca expor via API pública
secrets, err := secretsService.Inject(
    appID,
    "production",
    actorID,
    "system",
    ip,
    userAgent,
)
// secrets.Secrets = map[string]string{"STRIPE_SECRET_KEY": "sk_live_..."}
```

---

## AMBIENTES VÁLIDOS

- `production`
- `staging`
- `development`
- `test`

---

## CATEGORIAS VÁLIDAS

- `api_key`
- `oauth`
- `database`
- `webhook`
- `encryption`
- `custom`

---

## CONFIGURAÇÃO

No `.env`:
```
# Master key para criptografia (EXATAMENTE 32 bytes)
SECRETS_MASTER_KEY="sua_chave_mestra_de_32_bytes_aqui"
```

---

## ARQUIVOS CRIADOS

```
backend/internal/secrets/
├── model.go    ← Entidades e DTOs
├── service.go  ← Lógica de negócio + criptografia
└── handler.go  ← HTTP handlers
```

---

## PRINCÍPIOS

1. **Nunca expor valor completo** - Só últimos 4 chars
2. **Criptografia em repouso** - AES-256-GCM
3. **Audit completo** - Todo acesso logado
4. **Versionamento** - Histórico de mudanças
5. **Admin-only** - Nenhum endpoint público

---

## INTEGRAÇÃO COMPLETA

### Arquivos Modificados
- `backend/cmd/api/main.go` - Service e rotas registradas
- `backend/pkg/db/sqlite.go` - Tabelas na migração automática
- `.env.example` - Variável SECRETS_MASTER_KEY documentada

### Variáveis de Ambiente
```env
# Obrigatória (ou usa AES_SECRET_KEY como fallback)
SECRETS_MASTER_KEY="sua_chave_secrets_32_bytes_aqui_1234567890"
```

### Rotas Disponíveis
```
POST   /api/v1/secrets              → Criar secret
GET    /api/v1/secrets              → Listar secrets
GET    /api/v1/secrets/expiring     → Listar expirando
GET    /api/v1/secrets/:id          → Buscar por ID
PUT    /api/v1/secrets/:id          → Atualizar valor
DELETE /api/v1/secrets/:id          → Revogar
POST   /api/v1/secrets/:id/rotate   → Rotacionar
GET    /api/v1/secrets/:id/access-log → Log de acesso
GET    /api/v1/secrets/:id/versions → Histórico de versões
```

---

*Fase 20 - Secrets System - Integrada em 29/12/2024*

## PRÓXIMOS PASSOS

Após Secrets System:
1. Deploy & Hosting minimalista
2. Threat Model simples
3. (Opcional) IA como assistente observador

---

*Fase 20 - Secrets System - Implementada em 29/12/2024*
