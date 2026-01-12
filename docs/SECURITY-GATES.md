# 🔒 PROST-QS - Portas de Segurança

> Documentação das proteções implementadas para evitar vazamentos em produção.

---

## ✅ Proteções Implementadas

### 1. Rotas de Debug (`/api/v1/debug/*`)

**Status:** 🔒 PROTEGIDAS

**Comportamento:**
- Em produção (`GIN_MODE=release`): Rotas NÃO são registradas
- Em desenvolvimento: Rotas disponíveis com middleware `DevOnlyGuard`

**Endpoints afetados:**
- `POST /api/v1/debug/trigger-silence`
- `POST /api/v1/debug/trigger-fraud`
- `GET /api/v1/debug/status`

**Arquivo:** `backend/cmd/api/main.go`

---

### 2. Mock OAuth (`/api/v1/federation/google/mock`)

**Status:** 🔒 PROTEGIDO

**Comportamento:**
- Em produção: Retorna 403 Forbidden
- Em desenvolvimento: Funciona normalmente

**Arquivo:** `backend/internal/federation/handler.go`

---

### 3. Scripts de Seed

**Status:** 🔒 PROTEGIDOS

| Script | Proteção |
|--------|----------|
| `seed_ads.go` | Bloqueia se `GIN_MODE=release` |
| `seed_rules.go` | Bloqueia se `GIN_MODE=release` |
| `promote_admin.go` | Requer `CONFIRM_ADMIN_PROMOTION=yes` |

**Arquivos:** `backend/scripts/*.go`

---

### 4. Middleware de Ambiente

**Arquivo:** `backend/pkg/middleware/env_guard.go`

**Middlewares disponíveis:**

```go
// Bloqueia em produção
middleware.DevOnlyGuard()

// Requer DEBUG_MODE=true
middleware.DebugModeGuard()

// Requer role admin ou super_admin
middleware.AdminOnlyGuard()

// Requer role super_admin
middleware.SuperAdminOnlyGuard()
```

**Funções auxiliares:**
```go
middleware.IsProduction()   // true se GIN_MODE=release
middleware.IsDevelopment()  // true se GIN_MODE != release
middleware.IsDebugEnabled() // true se DEBUG_MODE=true
```

---

## 🔍 Como Verificar

### Em Produção (Render)

```bash
# Debug routes devem retornar 404 (não registradas)
curl https://uno0826.onrender.com/api/v1/debug/status
# Esperado: 404 Not Found

# Mock OAuth deve retornar 403
curl https://uno0826.onrender.com/api/v1/federation/google/mock
# Esperado: 403 Forbidden
```

### Em Desenvolvimento (Local)

```bash
# Debug routes funcionam
curl http://localhost:8080/api/v1/debug/status
# Esperado: 200 OK com lista de endpoints

# Mock OAuth funciona
curl http://localhost:8080/api/v1/federation/google/mock?state=test
# Esperado: 400 (state inválido) ou 200 (se state válido)
```

---

## ⚠️ Variáveis de Ambiente Críticas

| Variável | Produção | Desenvolvimento |
|----------|----------|-----------------|
| `GIN_MODE` | `release` | `debug` ou vazio |
| `DEBUG_MODE` | NÃO DEFINIR | `true` (opcional) |
| `CONFIRM_ADMIN_PROMOTION` | NÃO DEFINIR | `yes` (quando necessário) |

---

## 📋 Checklist de Segurança

- [x] Rotas `/debug/*` bloqueadas em produção
- [x] Mock OAuth bloqueado em produção
- [x] Seeds bloqueados em produção
- [x] Promoção de admin requer confirmação
- [x] Middleware de ambiente criado
- [x] Funções auxiliares para verificar ambiente

---

## 🚨 O Que Fazer Se...

### Alguém acessou endpoint de debug em prod
1. Verificar logs do Render
2. Confirmar que `GIN_MODE=release` está configurado
3. Se não estiver, configurar imediatamente

### Precisa rodar seed em produção (emergência)
1. **NÃO FAÇA ISSO** - seeds são destrutivos
2. Se absolutamente necessário, faça backup primeiro
3. Conecte diretamente no banco via Neon console
4. Execute queries manualmente

### Precisa promover admin em produção
1. Conecte no Neon console
2. Execute: `UPDATE users SET role = 'super_admin' WHERE username = 'seu_user'`
3. Documente a mudança

---

*Última atualização: Janeiro 2026*
