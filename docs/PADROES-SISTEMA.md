# PADRÕES DO SISTEMA — PROST-QS / UNO.KERNEL

> Convenções, padrões de código e arquitetura que definem o sistema.

**Última atualização:** 12 de Janeiro de 2026

---

## 🏗️ ARQUITETURA

### Padrão: Kernel + Apps Satélites

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ARQUITETURA GERAL                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐                        │
│   │  APP-1  │    │  APP-2  │    │   SCE   │    Apps Satélites      │
│   │(VOX-BR) │    │(futuro) │    │         │                        │
│   └────┬────┘    └────┬────┘    └────┬────┘                        │
│        │              │              │                              │
│        └──────────────┼──────────────┘                              │
│                       │                                             │
│                       ▼                                             │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                    UNO.KERNEL (PROST-QS)                     │  │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │  │
│   │  │Identity │ │ Billing │ │Telemetry│ │  Rules  │           │  │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │  │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │  │
│   │  │  Audit  │ │Governance│ │  Ads   │ │ Immunity│           │  │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Princípios Arquiteturais

1. **Kernel é a fonte de verdade** — Identity, billing, telemetria vivem no kernel
2. **Apps são clientes** — Apps consomem APIs do kernel, não duplicam lógica
3. **Multi-tenant por design** — Isolamento por `app_id` em todas as tabelas
4. **Governança nativa** — Kill switch, shadow mode, audit em tudo

---

## 📁 ESTRUTURA DE PASTAS

### Backend (Go)

```
backend/
├── cmd/
│   └── api/
│       └── main.go              # Entry point
├── internal/                    # Código privado do projeto
│   ├── {module}/
│   │   ├── handler.go           # HTTP handlers
│   │   ├── service.go           # Lógica de negócio
│   │   ├── model.go             # Structs e tipos
│   │   ├── repository.go        # Acesso a dados (quando necessário)
│   │   └── service_test.go      # Testes
│   └── ...
├── pkg/                         # Código reutilizável
│   ├── db/                      # Conexão com banco
│   ├── middleware/              # Middlewares HTTP
│   ├── utils/                   # Utilitários
│   ├── immunity/                # Sistema imunológico
│   ├── invariants/              # Testes de invariantes
│   ├── alerting/                # Sistema de alertas
│   ├── warobs/                  # War Observability
│   └── apigate/                 # API Gateway interno
├── scripts/                     # Scripts de manutenção
└── docs/                        # Documentação da API
```

### Frontend (Next.js)

```
frontend/
├── src/
│   ├── app/                     # App Router (Next.js 13+)
│   │   ├── (auth)/              # Rotas de autenticação
│   │   ├── (dashboard)/         # Rotas do dashboard
│   │   ├── (docs)/              # Documentação
│   │   └── (onboarding)/        # Onboarding
│   ├── components/
│   │   ├── ui/                  # Componentes base (shadcn)
│   │   └── dashboard/           # Componentes específicos
│   ├── contexts/                # React Contexts
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Utilitários
│   └── services/                # Chamadas de API
└── public/                      # Assets estáticos
```

---

## 🔤 CONVENÇÕES DE CÓDIGO

### Go

```go
// Nomes de pacotes: lowercase, singular
package billing

// Nomes de structs: PascalCase
type Subscription struct {
    ID        string    `json:"id"`
    UserID    string    `json:"user_id"`
    PlanID    string    `json:"plan_id"`
    Status    string    `json:"status"`
    CreatedAt time.Time `json:"created_at"`
}

// Nomes de funções: PascalCase para exportadas, camelCase para privadas
func (s *Service) CreateSubscription(ctx context.Context, req CreateSubscriptionRequest) (*Subscription, error) {
    // ...
}

func (s *Service) validatePlan(planID string) error {
    // ...
}

// Erros: sempre retornar error como último valor
func (s *Service) GetUser(id string) (*User, error) {
    // ...
}

// Contexto: sempre primeiro parâmetro
func (s *Service) Process(ctx context.Context, data Data) error {
    // ...
}
```

### TypeScript/React

```typescript
// Componentes: PascalCase, função
export function DashboardHeader({ title, actions }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <h1>{title}</h1>
      {actions}
    </header>
  );
}

// Hooks: camelCase, prefixo "use"
export function useSubscription(userId: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  // ...
  return { subscription, isLoading, error };
}

// Tipos: PascalCase, sufixo Props para props de componentes
interface DashboardHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

// Constantes: SCREAMING_SNAKE_CASE
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_RETRY_ATTEMPTS = 3;
```

---

## 🗄️ PADRÕES DE BANCO DE DADOS

### Nomenclatura de Tabelas

```sql
-- Tabelas: plural, snake_case
CREATE TABLE users (...);
CREATE TABLE applications (...);
CREATE TABLE subscriptions (...);
CREATE TABLE audit_logs (...);

-- Colunas: snake_case
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    app_id UUID NOT NULL REFERENCES applications(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices: idx_{tabela}_{colunas}
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_app_id ON users(app_id);

-- Foreign keys: fk_{tabela_origem}_{tabela_destino}
ALTER TABLE users ADD CONSTRAINT fk_users_applications 
    FOREIGN KEY (app_id) REFERENCES applications(id);
```

### Padrões de Isolamento Multi-tenant

```sql
-- TODA tabela que contém dados de usuário DEVE ter app_id
CREATE TABLE events (
    id UUID PRIMARY KEY,
    app_id UUID NOT NULL,  -- OBRIGATÓRIO
    user_id UUID,
    event_type VARCHAR(100),
    payload JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- TODA query DEVE filtrar por app_id
SELECT * FROM events WHERE app_id = $1 AND user_id = $2;
```

---

## 🔌 PADRÕES DE API

### Estrutura de Endpoints

```
Base URL: /api/v1

Recursos:
GET    /api/v1/{resource}           # Listar
GET    /api/v1/{resource}/{id}      # Obter um
POST   /api/v1/{resource}           # Criar
PUT    /api/v1/{resource}/{id}      # Atualizar (completo)
PATCH  /api/v1/{resource}/{id}      # Atualizar (parcial)
DELETE /api/v1/{resource}/{id}      # Deletar

Ações especiais:
POST   /api/v1/{resource}/{id}/action  # Ex: /users/123/suspend
```

### Formato de Resposta

```json
// Sucesso (200, 201)
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}

// Erro (4xx, 5xx)
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "cannot be empty" }
    ]
  }
}
```

### Headers Padrão

```
Request:
Authorization: Bearer {jwt_token}
X-App-ID: {app_id}
X-Request-ID: {uuid}
Content-Type: application/json

Response:
X-Request-ID: {uuid}
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704067200
```

---

## 🚨 PADRÕES DE ERRO (AJUSTE ESTRATÉGICO 1)

### Classificação Obrigatória de Erros

```go
// Todo erro DEVE ser classificado em um destes tipos:
import "prost-qs/backend/pkg/errors"

type ErrorType string

const (
    ErrValidation ErrorType = "VALIDATION"  // Dados inválidos (400)
    ErrBusiness   ErrorType = "BUSINESS"    // Regra de negócio (422)
    ErrSystem     ErrorType = "SYSTEM"      // Falha interna (500)
    ErrSecurity   ErrorType = "SECURITY"    // Violação segurança (403)
    ErrExternal   ErrorType = "EXTERNAL"    // Serviço externo (502)
    ErrInvariant  ErrorType = "INVARIANT"   // Invariante violada (500 CRÍTICO)
)
```

### Uso Correto

```go
// Validação - não alerta
if req.Email == "" {
    return errors.NewValidationError("VALIDATION_REQUIRED", "email is required")
}

// Negócio - não alerta
if user.Balance < amount {
    return errors.NewBusinessError("BUSINESS_INSUFFICIENT_FUNDS", "saldo insuficiente")
}

// Sistema - ALERTA
if err := db.Query(...); err != nil {
    return errors.NewSystemError("SYSTEM_DATABASE", "falha no banco", err)
}

// Segurança - ALERTA + LOG IP
if !validToken {
    return errors.NewSecurityError("SECURITY_TOKEN_INVALID", "token inválido")
}

// Invariante - ALERTA CRÍTICO + KILL SWITCH
if ledgerMismatch {
    return errors.NewInvariantError("INVARIANT_LEDGER_MISMATCH", "ledger desbalanceado")
}
```

### Por que isso importa

```
VALIDATION/BUSINESS → Esperado, não alertar
SYSTEM/SECURITY     → Inesperado, alertar
INVARIANT           → Crítico, alertar + considerar kill switch

Misturar tipos = Alertas inúteis + Problemas ignorados
```

---

## 🔐 PADRÕES DE SEGURANÇA

### Autenticação

```
1. JWT para sessões (15min expiry)
2. Refresh token para renovação (7 dias)
3. API Key para integrações server-to-server
4. Implicit login para apps satélites
```

### Autorização

```go
// Níveis de acesso
const (
    RoleUser    = "user"
    RoleAdmin   = "admin"
    RoleOwner   = "owner"
    RoleSuper   = "super_admin"
)

// Capabilities por plano
var PlanCapabilities = map[string][]string{
    "free":       {"basic_telemetry", "5_rules"},
    "starter":    {"full_telemetry", "50_rules", "webhooks"},
    "pro":        {"full_telemetry", "unlimited_rules", "webhooks", "api_access"},
    "enterprise": {"everything", "sla", "support"},
}
```

### Validação de Input

```go
// SEMPRE validar entrada
func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondError(w, http.StatusBadRequest, "invalid_json", err.Error())
        return
    }
    
    // Validação
    if req.Email == "" {
        respondError(w, http.StatusBadRequest, "validation_error", "email is required")
        return
    }
    
    // Sanitização
    req.Email = strings.TrimSpace(strings.ToLower(req.Email))
    
    // ...
}
```

---

## 📊 PADRÕES DE TELEMETRIA

### AJUSTE ESTRATÉGICO 3: Separação EVENT vs DECISION

```
EVENT = Algo que ACONTECEU (fato, passivo)
DECISION = Algo que o sistema DECIDIU (ação, ativo)

Exemplos:
├── EVENT: user.login (usuário fez login)
├── DECISION: access.denied (sistema negou acesso)
├── EVENT: payment.attempted (usuário tentou pagar)
├── DECISION: payment.blocked (sistema bloqueou pagamento)
```

### Estrutura de Event

```json
{
  "event_type": "user.login",
  "app_id": "uuid",
  "user_id": "uuid",
  "session_id": "uuid",
  "timestamp": "2026-01-12T10:00:00Z",
  "properties": {
    "method": "email",
    "ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  },
  "context": {
    "page": "/login",
    "referrer": "https://google.com"
  }
}
```

### Estrutura de Decision (NOVO)

```json
{
  "decision_type": "payment.blocked",
  "outcome": "blocked",
  "reason": "Invariante de billing violada",
  "reason_code": "INVARIANT_LEDGER_MISMATCH",
  "trigger_type": "invariant",
  "trigger_id": "inv-billing-001",
  "app_id": "uuid",
  "user_id": "uuid",
  "severity": "critical",
  "reversible": false,
  "decided_at": "2026-01-12T10:00:00Z"
}
```

### Por que separar importa

```
1. Auditoria melhor
   - "Por que o pagamento foi bloqueado?"
   - Resposta: Decision com reason + trigger

2. Explainability
   - Decisões são rastreáveis até a causa
   - Compliance com regulações de IA

3. Enterprise
   - Clientes enterprise querem saber O QUE o sistema decidiu
   - Não só o que aconteceu

4. Debugging
   - Filtrar por decisions facilita encontrar problemas
   - "Mostre todas as decisions de tipo security.block"
```

### Nomenclatura de Eventos

```
Formato: {objeto}.{ação}

Exemplos:
- user.created
- user.login
- user.logout
- subscription.created
- subscription.cancelled
- payment.succeeded
- payment.failed
- rule.triggered
- rule.action_executed
```

### Nomenclatura de Decisions

```
Formato: {domínio}.{resultado}

Exemplos:
- access.allowed
- access.denied
- payment.blocked
- payment.allowed
- rule.triggered
- rule.shadow (executou em shadow mode)
- security.block
- security.quarantine
- killswitch.block
- invariant.violation
```

---

## 🛡️ PADRÕES DE GOVERNANÇA

### Kill Switch (AJUSTE ESTRATÉGICO 2)

```go
// Kill Switch com ESCOPO EXPLÍCITO
// Formatos suportados:

"all"                    // Desliga TUDO (emergência total)
"billing"                // Desliga billing global
"billing:global"         // Mesmo que acima
"billing:app:{app_id}"   // Desliga billing só para um app
"rules:{rule_id}"        // Desliga uma regra específica
"agents:{agent_id}"      // Desliga um agente específico

// Verificação ANTES de operação crítica
func (s *Service) ProcessPayment(ctx context.Context, req PaymentRequest) error {
    // Verificar kill switch com escopo + app
    if err := s.killSwitch.CheckForApp("billing", req.AppID); err != nil {
        return err
    }
    // ...
}

// Para recursos específicos
func (s *Service) ExecuteRule(ctx context.Context, ruleID string) error {
    if err := s.killSwitch.CheckForResource("rules", ruleID); err != nil {
        return err
    }
    // ...
}
```

### Por que escopo explícito importa

```
Kill switch que ninguém usa = Kill switch inútil.

Com escopo granular:
├── Desligar billing de UM app problemático
├── Desligar UMA regra com bug
├── Desligar UM agente malcomportado
└── Sem afetar o resto do sistema

Resultado: Mais confiança para usar quando precisa.
```

### Shadow Mode

```go
// Executar em shadow mode para testar sem afetar produção
func (s *Service) EvaluateRule(ctx context.Context, rule Rule, event Event) (*Result, error) {
    result := s.evaluate(rule, event)
    
    if rule.ShadowMode {
        // Apenas logar, não executar ação
        s.logShadowResult(rule, event, result)
        return result, nil
    }
    
    // Executar ação real
    return s.executeAction(result)
}
```

### Audit Log

```go
// TODA operação sensível DEVE ser auditada
func (s *Service) DeleteUser(ctx context.Context, userID string) error {
    // Operação
    err := s.repo.Delete(userID)
    
    // Audit (mesmo se falhar)
    s.audit.Log(ctx, AuditEntry{
        Action:    "user.deleted",
        ActorID:   ctx.Value("user_id").(string),
        TargetID:  userID,
        Timestamp: time.Now(),
        Success:   err == nil,
        Error:     errorString(err),
    })
    
    return err
}
```

---

## 🧪 PADRÕES DE TESTE

### Estrutura de Testes

```go
// Arquivo: service_test.go
func TestService_CreateUser(t *testing.T) {
    // Arrange
    svc := NewService(mockDB, mockStripe)
    req := CreateUserRequest{Email: "test@example.com"}
    
    // Act
    user, err := svc.CreateUser(context.Background(), req)
    
    // Assert
    assert.NoError(t, err)
    assert.Equal(t, "test@example.com", user.Email)
}

// Tabela de testes para múltiplos casos
func TestService_ValidateEmail(t *testing.T) {
    tests := []struct {
        name    string
        email   string
        wantErr bool
    }{
        {"valid email", "test@example.com", false},
        {"empty email", "", true},
        {"invalid format", "not-an-email", true},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := validateEmail(tt.email)
            if tt.wantErr {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

### Invariantes

```go
// Invariantes são testes que rodam em produção
func TestBillingInvariant_LedgerBalance(t *testing.T) {
    // Soma de créditos - débitos = saldo atual
    credits := sumCredits()
    debits := sumDebits()
    balance := getCurrentBalance()
    
    assert.Equal(t, credits-debits, balance, "ledger balance mismatch")
}
```

---

## 📝 PADRÕES DE DOCUMENTAÇÃO

### Código

```go
// Package billing handles subscription management and payment processing.
// It integrates with Stripe for payment processing and maintains a local
// ledger for reconciliation.
package billing

// CreateSubscription creates a new subscription for a user.
// It validates the plan, creates the subscription in Stripe,
// and records the transaction in the local ledger.
//
// Parameters:
//   - ctx: Context with user information
//   - req: Subscription creation request
//
// Returns:
//   - *Subscription: The created subscription
//   - error: Any error that occurred
func (s *Service) CreateSubscription(ctx context.Context, req CreateSubscriptionRequest) (*Subscription, error) {
    // ...
}
```

### Markdown

```markdown
# Título do Documento

> Resumo em uma linha

**Última atualização:** DD/MM/YYYY

---

## Seção Principal

### Subseção

Conteúdo...

---

*Documento criado em DD/MM/YYYY*
```

---

## 🚀 PADRÕES DE DEPLOY

### Ambientes

```
development: Local (localhost)
staging:     staging.prost-qs.com (Render)
production:  uno0826.onrender.com (Render)
```

### Variáveis de Ambiente

```bash
# Obrigatórias em todos os ambientes
DATABASE_URL=
JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Por ambiente
ENV=development|staging|production
LOG_LEVEL=debug|info|warn|error
```

### Checklist de Deploy

```
[ ] Testes passando
[ ] Build sem erros
[ ] Migrations aplicadas
[ ] Variáveis de ambiente configuradas
[ ] Health check respondendo
[ ] Logs sem erros críticos
```

---

*Documento criado em 12/01/2026*
