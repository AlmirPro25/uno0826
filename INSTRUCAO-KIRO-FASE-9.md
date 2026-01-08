# INSTRUÇÃO KIRO - FASE 9: IDENTIDADE REAL + SEPARAÇÃO DE INTERFACES

## CONTEXTO
O kernel soberano (backend) está completo e funcionando. O problema atual é:
1. Telefone está sendo tratado como identidade (errado) - deveria ser apenas credencial
2. Não existe cadastro real (nome, email)
3. Frontend mistura usuário final, admin e dev
4. Admin não tem poder real de governança

## OBJETIVO
Transformar o sistema em 3 interfaces claras, mantendo o kernel intacto:
- **User App**: Interface do usuário final
- **Admin Panel**: Cockpit soberano do dono da plataforma
- **Dev Portal**: Documentação e integração para desenvolvedores

---

## PARTE 1: BACKEND - IDENTIDADE REAL

### 1.1 Criar modelo de dados correto

Arquivo: `backend/internal/identity/user_model.go`

```go
// User é a entidade principal - a pessoa real
type User struct {
    ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
    Status    string    `gorm:"default:active"` // active, suspended, banned
    Role      string    `gorm:"default:user"`   // user, admin, super_admin
    CreatedAt time.Time
    UpdatedAt time.Time
}

// UserProfile são os dados humanos
type UserProfile struct {
    ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
    UserID    uuid.UUID `gorm:"type:uuid;uniqueIndex"`
    Name      string    `gorm:"size:255"`
    Email     string    `gorm:"size:255;uniqueIndex"`
    AvatarURL string    `gorm:"size:500"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

// AuthMethod são as formas de login (telefone, google, etc)
type AuthMethod struct {
    ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
    UserID     uuid.UUID `gorm:"type:uuid;index"`
    Type       string    `gorm:"size:50"` // phone, google, apple, email
    Identifier string    `gorm:"size:255;uniqueIndex"` // +5511999999999 ou email
    Verified   bool      `gorm:"default:false"`
    CreatedAt  time.Time
}
```

### 1.2 Fluxo de cadastro correto

```
PRIMEIRO ACESSO:
1. Usuário informa telefone
2. OTP valida o canal
3. Sistema verifica se telefone já existe em AuthMethod
   - Se SIM: login normal, retorna token
   - Se NÃO: redireciona para tela de COMPLETAR CADASTRO

COMPLETAR CADASTRO:
4. Usuário informa: nome, email
5. Sistema cria: User + UserProfile + AuthMethod (phone)
6. Retorna token JWT com user_id e role

PRÓXIMOS ACESSOS:
1. Usuário informa telefone
2. OTP valida
3. Sistema encontra AuthMethod → User
4. Retorna token (sem pedir dados novamente)
```

### 1.3 Endpoints necessários

```
POST /api/v1/auth/phone/request     - Solicitar OTP
POST /api/v1/auth/phone/verify      - Verificar OTP (retorna is_new_user)
POST /api/v1/auth/complete-signup   - Completar cadastro (nome, email)
GET  /api/v1/users/me               - Dados do usuário logado
PUT  /api/v1/users/me/profile       - Atualizar perfil
```

---

## PARTE 2: FRONTEND - USER APP

### 2.1 Estrutura de arquivos

```
frontend/
├── user-app/
│   ├── index.html
│   ├── src/
│   │   ├── main.js
│   │   ├── pages/
│   │   │   ├── login.js
│   │   │   ├── verify-otp.js
│   │   │   ├── complete-signup.js  # NOVO
│   │   │   ├── dashboard.js
│   │   │   ├── wallet.js
│   │   │   └── profile.js
│   │   └── components/
│   └── styles.css
```

### 2.2 Telas do User App

**Tela 1: Login**
- Campo: telefone
- Botão: "Continuar"
- Link: "Precisa de ajuda?"

**Tela 2: Verificar OTP**
- Campo: código 6 dígitos
- Botão: "Verificar"
- Link: "Reenviar código"

**Tela 3: Completar Cadastro** (só para novos usuários)
- Campo: nome completo
- Campo: email
- Checkbox: aceito termos
- Botão: "Criar conta"

**Tela 4: Dashboard**
- Saudação: "Olá, {nome}!"
- Card: Saldo da carteira
- Ações rápidas do app

**Tela 5: Carteira**
- Saldo atual
- Histórico de transações (só as do usuário)
- Botão: Adicionar fundos

**Tela 6: Perfil**
- Foto, nome, email
- Métodos de login conectados
- Botão: Sair

### 2.3 O que o usuário NÃO vê
- Outros usuários
- Ledger global
- Jobs
- Agents
- Disputed
- Admin

---

## PARTE 3: FRONTEND - ADMIN PANEL

### 3.1 Estrutura de arquivos

```
frontend/
├── admin/
│   ├── index.html
│   ├── src/
│   │   ├── main.js
│   │   ├── pages/
│   │   │   ├── login.js          # Login separado com role check
│   │   │   ├── dashboard.js      # Visão geral do sistema
│   │   │   ├── users.js          # TODOS os usuários
│   │   │   ├── economy.js        # Ledger global, volume
│   │   │   ├── payments.js       # Todos payment intents
│   │   │   ├── disputed.js       # Fila de problemas
│   │   │   ├── agents.js         # Decisões de IA
│   │   │   ├── apps.js           # Apps conectados
│   │   │   └── settings.js       # Configurações
│   │   └── components/
│   └── styles.css
```

### 3.2 Telas do Admin Panel

**Dashboard Admin**
```
┌─────────────────────────────────────────────────────────────┐
│  PROST-QS ADMIN                           [Almir] [Logout]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ USUÁRIOS │ │ VOLUME   │ │ DISPUTED │ │ AGENTS   │       │
│  │  1.523   │ │ R$45.000 │ │    3     │ │   12     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  [Users] [Economy] [Payments] [Disputed] [Agents] [Apps]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tela: Users**
- Lista de TODOS os usuários
- Busca por nome, email, telefone
- Clicar em usuário abre:
  - Perfil completo
  - Métodos de auth
  - Saldo
  - Histórico de transações
  - Ações: suspender, banir, resetar

**Tela: Economy**
- Ledger global (soma de todos)
- Gráfico de entradas/saídas
- Volume por período
- Reconciliação

**Tela: Payments**
- Todos os PaymentIntents
- Filtro por status
- Detalhes de cada um
- Webhooks recebidos

**Tela: Disputed**
- Fila de problemas reais
- Cada item mostra:
  - O que aconteceu
  - Quem está envolvido
  - Valor em jogo
- Ações: resolver, escalar, reembolsar

**Tela: Agents**
- Decisões pendentes de IA
- Risk score visual
- Aprovar / Rejeitar com nota
- Histórico de decisões

**Tela: Apps**
- Apps conectados ao kernel
- API keys
- Uso por app
- Revogar acesso

### 3.3 Segurança do Admin

```go
// Middleware de admin
func AdminOnly() gin.HandlerFunc {
    return func(c *gin.Context) {
        role := c.GetString("userRole")
        if role != "admin" && role != "super_admin" {
            c.JSON(403, gin.H{"error": "Acesso negado"})
            c.Abort()
            return
        }
        c.Next()
    }
}

// Rotas admin separadas
admin := router.Group("/api/v1/admin")
admin.Use(AuthMiddleware(), AdminOnly())
{
    admin.GET("/users", handler.ListAllUsers)
    admin.GET("/users/:id", handler.GetUserDetails)
    admin.POST("/users/:id/suspend", handler.SuspendUser)
    admin.GET("/economy/overview", handler.GetEconomyOverview)
    admin.GET("/disputed", handler.ListDisputed)
    admin.POST("/disputed/:id/resolve", handler.ResolveDisputed)
    // etc
}
```

---

## PARTE 4: DEV PORTAL

### 4.1 Estrutura

```
frontend/
├── dev-portal/
│   ├── index.html
│   ├── src/
│   │   ├── main.js
│   │   └── pages/
│   │       ├── getting-started.js
│   │       ├── authentication.js
│   │       ├── billing.js
│   │       ├── sdk.js
│   │       └── api-reference.js
│   └── styles.css
```

### 4.2 Conteúdo do Dev Portal

**Getting Started**
```markdown
# Conecte seu app ao PROST-QS em 5 minutos

## 1. Instale o SDK
npm install @prost-qs/kernel-sdk

## 2. Configure
const kernel = new ProstQS({
  baseURL: 'https://api.seudominio.com',
  apiKey: 'pk_live_xxx'
});

## 3. Implemente login
const { verificationId } = await kernel.auth.requestOTP('+5511999999999');
// Usuário digita o código
const { token, isNewUser } = await kernel.auth.verifyOTP(verificationId, '123456');

if (isNewUser) {
  // Redirecionar para completar cadastro
  await kernel.auth.completeSignup({ name: 'João', email: 'joao@email.com' });
}

## 4. Use a carteira
const { balance } = await kernel.billing.getBalance();
await kernel.billing.createPayment({ amount: 1000, description: 'Pedido #123' });
```

**Cada seção tem:**
- Explicação clara
- Código copiável (botão "Copiar")
- Exemplo funcional
- Link para API Reference

---

## PARTE 5: ORDEM DE EXECUÇÃO

### Fase 9.1 - Backend Identity (1-2 horas)
1. Criar User, UserProfile, AuthMethod models
2. Atualizar verification flow para usar novos models
3. Criar endpoint /auth/complete-signup
4. Adicionar role no JWT
5. Criar middleware AdminOnly

### Fase 9.2 - User App (2-3 horas)
1. Criar estrutura frontend/user-app/
2. Implementar fluxo de login + cadastro
3. Telas: dashboard, wallet, profile
4. Testar fluxo completo

### Fase 9.3 - Admin Panel (3-4 horas)
1. Criar estrutura frontend/admin/
2. Login com verificação de role
3. Dashboard com métricas globais
4. Telas: users, economy, disputed, agents
5. Ações administrativas

### Fase 9.4 - Dev Portal (1-2 horas)
1. Criar estrutura frontend/dev-portal/
2. Documentação com exemplos
3. Botões de copiar código
4. API Reference

---

## REGRAS IMPORTANTES

1. **Kernel intacto** - Não mexer na lógica de billing, ads, agents
2. **Separação clara** - 3 frontends, 3 propósitos
3. **Segurança real** - Admin só com role verificada
4. **UX humana** - Linguagem simples, fluxo guiado

---

## RESULTADO ESPERADO

Após executar:
- Usuário final tem experiência limpa e simples
- Você (admin) tem controle total do sistema
- Desenvolvedores conseguem integrar facilmente
- Sistema pronto para produção real
