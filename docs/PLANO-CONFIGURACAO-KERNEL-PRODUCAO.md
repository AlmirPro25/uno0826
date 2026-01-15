# PLANO DE CONFIGURAÇÃO DO KERNEL PARA PRODUÇÃO

> Guia completo para deixar o PROST-QS pronto para produção com Google OAuth, domínios configurados e interface funcional.

**Autor:** Almir Felix de Jesus Filho  
**Data:** 15 de Janeiro de 2026  
**Versão:** 1.0

---

## 🚀 RESUMO EXECUTIVO

### Status Atual: 70% Completo!

| Componente | Status | Ação Necessária |
|------------|--------|-----------------|
| Backend OAuth | ✅ Pronto | Apenas configurar variáveis |
| Frontend Login | ✅ Pronto | Botão Google + Callback criados |
| Google Cloud | ⏳ Pendente | Criar credenciais OAuth |
| Domínios | ⏳ Pendente | Configurar DNS |
| Variáveis Produção | ⏳ Pendente | Adicionar no Render/Vercel |

### O que você precisa fazer AGORA:

1. **Google Cloud Console** (30 min)
   - Criar projeto
   - Configurar OAuth Consent Screen
   - Criar credenciais OAuth 2.0

2. **Render Dashboard** (10 min)
   - Adicionar GOOGLE_CLIENT_ID
   - Adicionar GOOGLE_CLIENT_SECRET
   - Adicionar GOOGLE_REDIRECT_URI

3. **Testar** (5 min)
   - Acessar frontend
   - Clicar "Continuar com Google"
   - Verificar login funcionando

---

## 📋 VISÃO GERAL

Este documento detalha todas as configurações necessárias para colocar o kernel PROST-QS em produção completa:

1. **Google OAuth** - Login com conta Google
2. **Domínios** - Configuração Vercel + Render
3. **Variáveis de Ambiente** - Secrets e configurações
4. **Interface** - Frontend funcional e conectado

---

## 🏗️ ARQUITETURA ATUAL

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUÇÃO                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐         ┌─────────────────┐              │
│   │    VERCEL       │         │     RENDER      │              │
│   │   (Frontend)    │ ──────► │    (Backend)    │              │
│   │                 │         │                 │              │
│   │ prostqs.com.br  │         │ api.prostqs.com │              │
│   │ (ou vercel URL) │         │ (ou render URL) │              │
│   └─────────────────┘         └────────┬────────┘              │
│                                        │                        │
│                               ┌────────▼────────┐              │
│                               │   SUPABASE      │              │
│                               │  (PostgreSQL)   │              │
│                               └─────────────────┘              │
│                                                                 │
│   ┌─────────────────┐                                          │
│   │  GOOGLE CLOUD   │                                          │
│   │  OAuth 2.0      │ ◄──── Autenticação Social                │
│   └─────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📍 ESTADO ATUAL

### ✅ O que já temos:
- Backend Go rodando no Render (uno0826.onrender.com)
- Frontend Next.js no Vercel
- Banco PostgreSQL (Supabase)
- Autenticação JWT funcionando (email/senha)
- Domínio prostqs.com.br comprado
- Conta Google Cloud empresarial (prostqs.com.br)

### ❌ O que falta configurar:
- [x] Google OAuth no backend ✅ JÁ IMPLEMENTADO!
- [ ] Credenciais Google Cloud Console
- [ ] Domínio customizado no Vercel
- [ ] Domínio customizado no Render
- [ ] Variáveis de ambiente de produção
- [ ] Botão "Login com Google" no frontend
- [ ] Página de callback no frontend

### 🎉 DESCOBERTA: OAuth Já Implementado!

O módulo `federation` já contém implementação completa:
- `backend/internal/federation/google_service.go` - Serviço Google OAuth
- `backend/internal/federation/handler.go` - Rotas OAuth
- `backend/internal/federation/service.go` - Lógica de federação
- `backend/internal/federation/model.go` - Modelos de dados

**Rotas disponíveis:**
```
POST /api/v1/federation/oauth/start     → Inicia fluxo OAuth
GET  /api/v1/federation/google/callback → Callback do Google
GET  /api/v1/federation/providers       → Lista providers linkados
DELETE /api/v1/federation/providers/:p  → Remove provider
```

---

## 🔐 FASE 1: CONFIGURAR GOOGLE OAUTH

### 1.1 Criar Projeto no Google Cloud Console

```
1. Acesse: https://console.cloud.google.com
2. Login com: almir@prostqs.com.br
3. Criar novo projeto: "PROST-QS Production"
4. Anotar o Project ID
```

### 1.2 Configurar OAuth Consent Screen

```
1. APIs & Services → OAuth consent screen
2. User Type: External (para qualquer pessoa poder usar)
3. Preencher:
   - App name: PROST-QS
   - User support email: almir@prostqs.com.br
   - App logo: (opcional, adicionar depois)
   - App domain: prostqs.com.br
   - Authorized domains: prostqs.com.br
   - Developer contact: almir@prostqs.com.br
4. Scopes: email, profile, openid
5. Test users: (deixar vazio para produção)
6. Salvar
```

### 1.3 Criar Credenciais OAuth 2.0

```
1. APIs & Services → Credentials
2. Create Credentials → OAuth client ID
3. Application type: Web application
4. Name: PROST-QS Web Client
5. Authorized JavaScript origins:
   - https://prostqs.com.br
   - https://www.prostqs.com.br
   - https://frontend-xxx.vercel.app (URL atual do Vercel)
   - http://localhost:3000 (desenvolvimento)
6. Authorized redirect URIs:
   - https://api.prostqs.com.br/api/v1/federation/google/callback
   - https://uno0826.onrender.com/api/v1/federation/google/callback
   - http://localhost:8080/api/v1/federation/google/callback
7. Create
8. ANOTAR:
   - Client ID: xxxxxx.apps.googleusercontent.com
   - Client Secret: GOCSPX-xxxxxx
```

### 1.4 Variáveis de Ambiente (Backend)

Adicionar no Render Dashboard:

```env
# Google OAuth
GOOGLE_CLIENT_ID=xxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxx
GOOGLE_REDIRECT_URI=https://uno0826.onrender.com/api/v1/federation/google/callback

# URLs do Frontend (para redirect após login)
FRONTEND_URL=https://prostqs.com.br
FRONTEND_LOGIN_SUCCESS=/dashboard
FRONTEND_LOGIN_ERROR=/login?error=oauth_failed
```

---

## 🌐 FASE 2: CONFIGURAR DOMÍNIOS

### 2.1 Domínio no Vercel (Frontend)

```
1. Vercel Dashboard → Projeto Frontend → Settings → Domains
2. Add Domain: prostqs.com.br
3. Add Domain: www.prostqs.com.br
4. Vercel vai mostrar os registros DNS necessários
```

**Configurar no Registro.br ou Cloudflare:**

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |

### 2.2 Domínio no Render (Backend)

```
1. Render Dashboard → prost-qs-backend → Settings → Custom Domains
2. Add Custom Domain: api.prostqs.com.br
3. Render vai mostrar o registro DNS necessário
```

**Configurar no Registro.br ou Cloudflare:**

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| CNAME | api | xxx.onrender.com | 3600 |

### 2.3 Verificar Propagação DNS

```bash
# Verificar se DNS propagou (pode levar até 48h)
nslookup prostqs.com.br
nslookup api.prostqs.com.br
```

---

## ⚙️ FASE 3: VARIÁVEIS DE AMBIENTE COMPLETAS

### 3.1 Backend (Render)

```env
# ========================================
# SERVIDOR
# ========================================
GIN_MODE=release
SERVER_PORT=8080

# ========================================
# BANCO DE DADOS
# ========================================
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# ========================================
# SEGURANÇA (GERAR VALORES ÚNICOS!)
# ========================================
JWT_SECRET=<openssl rand -base64 32>
AES_SECRET_KEY=<openssl rand -base64 32 | head -c 32>
SECRETS_MASTER_KEY=<openssl rand -base64 32 | head -c 32>

# ========================================
# CORS
# ========================================
ALLOWED_ORIGINS=https://prostqs.com.br,https://www.prostqs.com.br

# ========================================
# GOOGLE OAUTH
# ========================================
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URL=https://api.prostqs.com.br/api/v1/auth/google/callback

# ========================================
# FRONTEND URLs
# ========================================
FRONTEND_URL=https://prostqs.com.br
FRONTEND_LOGIN_SUCCESS=/dashboard
FRONTEND_LOGIN_ERROR=/login?error=oauth_failed

# ========================================
# STRIPE (quando ativar billing)
# ========================================
# STRIPE_SECRET_KEY=sk_live_xxx
# STRIPE_WEBHOOK_SECRET=whsec_xxx

# ========================================
# BOOTSTRAP (usar apenas uma vez!)
# ========================================
SUPER_ADMIN_EMAIL=almir@prostqs.com.br
SUPER_ADMIN_BOOTSTRAP_TOKEN=<token-unico-remover-depois>
```

### 3.2 Frontend (Vercel)

```env
# API Backend
NEXT_PUBLIC_API_URL=https://api.prostqs.com.br/api/v1

# Google OAuth (Client ID público)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## 🖥️ FASE 4: BACKEND OAUTH (✅ JÁ IMPLEMENTADO!)

### 4.1 Estrutura Existente

```
backend/internal/federation/
├── google_service.go   # ✅ Serviço Google OAuth completo
├── handler.go          # ✅ Rotas OAuth
├── service.go          # ✅ Lógica de federação
└── model.go            # ✅ Modelos de dados
```

### 4.2 Código Já Implementado

**google_service.go** - Serviço OAuth:
```go
// ✅ Funções implementadas:
// - GetAuthURL(state string) (string, error)
// - ExchangeCode(code string) (*TokenResponse, error)
// - GetUserInfo(accessToken string) (*GoogleUserInfo, error)
// - IsConfigured() bool
```

**handler.go** - Rotas:
```go
// ✅ Rotas implementadas:
// POST /federation/oauth/start     → Inicia fluxo OAuth
// GET  /federation/google/callback → Recebe código, cria/autentica usuário
// GET  /federation/google/mock     → Mock para desenvolvimento
// GET  /federation/providers       → Lista providers linkados
// DELETE /federation/providers/:p  → Remove provider
```

### 4.3 Variáveis de Ambiente Necessárias

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://api.prostqs.com.br/api/v1/federation/google/callback
FRONTEND_URL=https://prostqs.com.br
```

### 4.4 Fluxo OAuth

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │     │ Backend  │     │  Google  │     │ Frontend │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ Click "Login   │                │                │
     │ com Google"    │                │                │
     │───────────────►│                │                │
     │                │                │                │
     │                │ Redirect to    │                │
     │                │ Google OAuth   │                │
     │                │───────────────►│                │
     │                │                │                │
     │                │                │ User consente  │
     │                │                │                │
     │                │◄───────────────│                │
     │                │ Code           │                │
     │                │                │                │
     │                │ Exchange code  │                │
     │                │ for tokens     │                │
     │                │───────────────►│                │
     │                │                │                │
     │                │◄───────────────│                │
     │                │ Access token   │                │
     │                │ + User info    │                │
     │                │                │                │
     │                │ Create/Find    │                │
     │                │ user in DB     │                │
     │                │                │                │
     │                │ Generate JWT   │                │
     │                │                │                │
     │◄───────────────│                │                │
     │ Redirect to    │                │                │
     │ frontend with  │                │                │
     │ JWT token      │                │                │
     │                │                │                │
     │────────────────────────────────────────────────►│
     │                                                  │
     │                                 Dashboard loaded │
     └──────────────────────────────────────────────────┘
```

---

## 🎨 FASE 5: ATUALIZAR FRONTEND (✅ IMPLEMENTADO!)

### 5.1 Botão "Login com Google" (✅ Adicionado)

Arquivo: `frontend/src/app/(auth)/login/page.tsx`

```tsx
// Botão Google já implementado com:
// - Ícone SVG do Google colorido
// - Estado de loading
// - Chamada para /federation/oauth/start
// - Redirect para URL do Google
```

### 5.2 Página de Callback (✅ Criada)

Arquivo: `frontend/src/app/(auth)/callback/page.tsx`

```tsx
// Página de callback implementada com:
// - Processamento de tokens da URL
// - Estados: loading, success, error
// - Mensagens de erro amigáveis
// - Redirect automático para dashboard
```

### 5.3 Fluxo Completo

```
1. Usuário clica "Continuar com Google"
2. Frontend chama POST /federation/oauth/start
3. Backend retorna auth_url do Google
4. Frontend redireciona para Google
5. Usuário autoriza no Google
6. Google redireciona para /federation/google/callback
7. Backend processa, gera JWT
8. Backend redireciona para /auth/callback?token=xxx
9. Frontend processa tokens e faz login
10. Usuário é redirecionado para /dashboard
```

---

## ✅ CHECKLIST DE EXECUÇÃO

### Dia 1: Google Cloud Console
- [ ] Criar projeto no Google Cloud Console
- [ ] Configurar OAuth Consent Screen
- [ ] Criar credenciais OAuth 2.0
- [ ] Anotar Client ID e Client Secret

### Dia 2: Domínios
- [ ] Adicionar domínio no Vercel
- [ ] Adicionar domínio no Render
- [ ] Configurar DNS no Registro.br/Cloudflare
- [ ] Aguardar propagação (até 48h)

### Dia 3: Variáveis de Ambiente
- [x] Backend OAuth implementado ✅
- [ ] Adicionar GOOGLE_CLIENT_ID no Render
- [ ] Adicionar GOOGLE_CLIENT_SECRET no Render
- [ ] Adicionar GOOGLE_REDIRECT_URI no Render
- [ ] Adicionar FRONTEND_URL no Render
- [ ] Testar fluxo OAuth

### Dia 4: Frontend + Testes
- [x] Adicionar botão "Login com Google" ✅
- [x] Criar página de callback (/auth/callback) ✅
- [ ] Adicionar variáveis de ambiente no Vercel
- [ ] Testar fluxo completo

### Dia 5: Bootstrap Admin
- [ ] Criar conta admin via Google OAuth
- [ ] Verificar role super_admin
- [ ] Remover variáveis de bootstrap
- [ ] Documentar credenciais

---

## 🔒 SEGURANÇA

### Checklist de Segurança
- [ ] HTTPS em todos os domínios
- [ ] Secrets nunca commitados no Git
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Logs de auditoria funcionando

### Variáveis Sensíveis (NUNCA commitar!)
- JWT_SECRET
- AES_SECRET_KEY
- SECRETS_MASTER_KEY
- GOOGLE_CLIENT_SECRET
- STRIPE_SECRET_KEY
- DATABASE_URL

---

## 📊 MÉTRICAS DE SUCESSO

Após configuração completa:

1. **Login funcional** - Usuário consegue logar com Google
2. **Domínios ativos** - prostqs.com.br e api.prostqs.com.br respondendo
3. **HTTPS** - Certificados SSL válidos
4. **Admin criado** - Conta super_admin funcionando
5. **Dashboard acessível** - Interface carregando corretamente

---

## 🚀 PRÓXIMOS PASSOS (Após Configuração)

1. **Billing** - Ativar Stripe para pagamentos
2. **Apps Satélites** - Conectar VOX-BRIDGE, NEXUS, etc.
3. **Monitoramento** - Configurar alertas
4. **Documentação** - Publicar docs para desenvolvedores

---

## 📞 REFERÊNCIAS

- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/domains)
- [Render Custom Domains](https://render.com/docs/custom-domains)
- [Go OAuth2 Package](https://pkg.go.dev/golang.org/x/oauth2)

---

*Documento criado em 15/01/2026*
*Para: Almir Felix de Jesus Filho*
*Sistema: PROST-QS Kernel*
