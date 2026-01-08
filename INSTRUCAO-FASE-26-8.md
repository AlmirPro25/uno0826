# FASE 26.8 — Identity & Access Completion

> **Objetivo:** Fechar a camada de identidade e acesso para transformar o PROST-QS em plataforma multi-tenant real.

---

## 📊 DIAGNÓSTICO ATUAL

### ✅ Já Existe
- Roles: `user`, `admin`, `super_admin`
- Middleware: `RequireAdmin()`, `RequireSuperAdmin()`
- JWT com role e status
- Login por username/password (admin)
- Login por phone/OTP (usuários finais)
- Application com API Keys

### ❌ O Que Falta
1. **Admin vinculado a App** — Admin atual é global, deveria ser por app
2. **Consoles separados** — `/admin` vs `/superadmin`
3. **Auditoria de login** — Quem logou, quando, de onde
4. **Payment Provider por App** — Cada app conecta sua própria Stripe

---

## 🎯 MODELO DE IDENTIDADE FINAL

```
┌─────────────────────────────────────────────────────────────┐
│                    KERNEL IDENTITY                          │
│  (superadmin, operadores do sistema)                        │
│  - Visão global                                             │
│  - Métricas agregadas                                       │
│  - Saúde do sistema                                         │
│  - Configuração institucional                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION IDENTITY                        │
│  (admin = dono de app)                                       │
│  - Criar/gerenciar apps                                      │
│  - Gerar API Keys                                            │
│  - Configurar Stripe                                         │
│  - Ver métricas do app                                       │
│  - Gerenciar usuários do app                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   END-USER IDENTITY                          │
│  (usuário final do app)                                      │
│  - Autenticado pelo app (não pelo kernel)                    │
│  - Kernel só observa eventos                                 │
│  - Nunca acessa console                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Part 1: Separação de Consoles
- [ ] Criar rota `/superadmin/*` para operadores do kernel
- [ ] Manter `/admin/*` para donos de app
- [ ] Middleware `RequireSuperAdmin()` já existe
- [ ] Frontend: criar `superadmin/index.html` (mínimo)

### Part 2: Admin Vinculado a App
- [ ] Adicionar campo `owner_id` em Application (já existe!)
- [ ] Filtrar apps por `owner_id` no `ListMyApplications` (já existe!)
- [ ] Admin só vê/edita apps que criou ✅

### Part 3: Auditoria de Login
- [ ] Criar tabela `login_events`
- [ ] Registrar: user_id, ip, user_agent, success, timestamp
- [ ] Endpoint GET `/admin/login-history`

### Part 4: Payment Provider por App
- [ ] Criar tabela `app_payment_providers`
- [ ] Campos: app_id, provider (stripe), status, encrypted_keys
- [ ] Endpoint POST `/apps/:id/payment-provider`
- [ ] Endpoint GET `/apps/:id/payment-provider`
- [ ] NÃO implementar integração Stripe ainda (só modelo)

---

## 🔒 REGRAS DE SEGURANÇA

1. **SuperAdmin NUNCA acessa dados de usuário final**
2. **Admin só vê apps que criou**
3. **API Keys são hasheadas (secret nunca armazenado em texto)**
4. **Stripe keys são criptografadas (AES-256)**
5. **Toda ação de admin é auditada**

---

## 📁 ARQUIVOS A CRIAR/MODIFICAR

```
Backend:
├── internal/identity/login_events.go      # Modelo + Service
├── internal/identity/login_handler.go     # Endpoints de histórico
├── internal/application/payment_provider.go # Modelo
├── internal/application/payment_handler.go  # Endpoints

Frontend:
├── frontend/superadmin/index.html         # Console SuperAdmin (mínimo)
├── frontend/admin/src/payment-provider.js # UI de config Stripe
```

---

## ⚠️ O QUE NÃO FAZER NESTA FASE

- ❌ Implementar integração real com Stripe
- ❌ Processar pagamentos
- ❌ Automação financeira
- ❌ IA de decisão
- ❌ Frontend bonito demais

---

## ✅ CRITÉRIOS DE CONCLUSÃO

1. [ ] SuperAdmin tem console separado
2. [ ] Admin só vê seus próprios apps
3. [ ] Login é auditado
4. [ ] Modelo de Payment Provider existe
5. [ ] Documentação atualizada

---

*Fase 26.8 — Identity & Access Completion*
