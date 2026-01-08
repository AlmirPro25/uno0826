# PROST-QS - Deploy em Produção (Resumo Tech Lead)

**Data**: 08/01/2026  
**Status**: ✅ COMPLETO

---

## URLs de Produção

| Serviço | URL | Plataforma |
|---------|-----|------------|
| Backend API | https://uno0826.onrender.com | Render.com |
| Frontend Admin | https://uno0826-pr57.vercel.app | Vercel |
| GitHub | https://github.com/AlmirPro25/uno0826 | - |

---

## Credenciais Admin

- **Username**: `almir`
- **Password**: `4152`
- **Role**: `super_admin`

---

## O Que Foi Feito

### 1. Deploy Backend (Render.com)
- Downgrade Go 1.23 → 1.21 (compatibilidade Render)
- Fix `.env` loading (ignora silenciosamente em produção)
- Fix SQLite path: `./data/` → `/data/` (path absoluto)
- Remoção health check path (evita restart loop)
- CORS configurado para Vercel

### 2. Deploy Frontend (Vercel)
- Root directory: `frontend`
- `API_BASE` atualizado de `localhost:8080` → `uno0826.onrender.com`
- `vercel.json` com rewrites para SPA

### 3. Configuração Admin
- Endpoint `/api/v1/admin/promote-first-admin` criado
- Usuário `almir` promovido a `super_admin`

---

## Arquivos Modificados

```
backend/go.mod                    # Go 1.21
backend/cmd/api/main.go           # .env opcional + CORS Vercel
Dockerfile                        # golang:1.21-alpine
frontend/admin/src/main.js        # API_BASE produção
frontend/user-app/src/main.js     # API_BASE produção
frontend/vercel.json              # Rewrites SPA
backend/internal/admin/handler.go # Endpoint promote-first-admin
```

---

## Stack em Produção

- **Backend**: Go 1.21 + Gin + SQLite + GORM
- **Frontend**: HTML + Tailwind CSS (CDN)
- **Hosting**: Render (backend) + Vercel (frontend)
- **DB**: SQLite persistido em `/data/prostqs.db`

---

## Próximos Passos Sugeridos

1. Configurar Stripe (chaves de produção)
2. Domínio customizado (opcional)
3. Monitoramento/alertas
4. Backup do SQLite

---

## Comandos Úteis

```bash
# Testar backend
curl https://uno0826.onrender.com/health

# Login via API
curl -X POST https://uno0826.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"almir","password":"4152"}'
```
