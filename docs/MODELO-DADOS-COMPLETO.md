# MODELO DE DADOS COMPLETO — PROST-QS / UNO.KERNEL

> Todas as entidades do sistema e seus relacionamentos.

---

## 📊 Diagrama de Relacionamentos

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              IDENTITY KERNEL                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐     1:1      ┌──────────────┐                                 │
│  │     User     │─────────────►│  UserOrigin  │                                 │
│  │              │              │  (imutável)  │                                 │
│  └──────┬───────┘              └──────────────┘                                 │
│         │                                                                        │
│         │ 1:N                                                                    │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │AppMembership │◄────────────────────────────────────────┐                     │
│  │              │                                          │                     │
│  └──────────────┘                                          │                     │
│                                                            │                     │
└────────────────────────────────────────────────────────────┼─────────────────────┘
                                                             │
┌────────────────────────────────────────────────────────────┼─────────────────────┐
│                           APPLICATION MODULE               │                     │
├────────────────────────────────────────────────────────────┼─────────────────────┤
│                                                            │                     │
│  ┌──────────────┐                                          │                     │
│  │ Application  │──────────────────────────────────────────┘                     │
│  │              │                                                                │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│         │ 1:N                                                                    │
│         ▼                                                                        │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                     │
│  │TelemetryEvent│     │  AppSession  │     │   AppAlert   │                     │
│  └──────────────┘     └──────────────┘     └──────────────┘                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BILLING KERNEL                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐     1:N      ┌──────────────┐                                 │
│  │BillingAccount│─────────────►│ Subscription │                                 │
│  │              │              │              │                                 │
│  └──────┬───────┘              └──────────────┘                                 │
│         │                                                                        │
│         │ 1:N                                                                    │
│         ▼                                                                        │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                     │
│  │PaymentIntent │     │ LedgerEntry  │     │    Payout    │                     │
│  └──────────────┘     └──────────────┘     └──────────────┘                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            GOVERNANCE LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                     │
│  │    Policy    │     │  AuditEvent  │     │  KillSwitch  │                     │
│  └──────────────┘     └──────────────┘     └──────────────┘                     │
│                                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                     │
│  │AutonomyProf. │     │ShadowExecut. │     │DecisionAuth. │                     │
│  └──────────────┘     └──────────────┘     └──────────────┘                     │
│                                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                     │
│  │ApprovalReq.  │────►│ApprovalDecis.│     │DecisionLife. │                     │
│  └──────────────┘     └──────────────┘     └──────────────┘                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗃️ ENTIDADES DETALHADAS

### Identity Kernel

#### User
```go
type User struct {
    ID           uuid.UUID  // PK
    Email        string     // Unique
    PasswordHash string
    Name         string
    Role         string     // user, admin, super_admin
    Status       string     // active, suspended, banned
    CreatedAt    time.Time
    UpdatedAt    time.Time
}
```

#### UserOrigin (Certidão de Nascimento)
```go
type UserOrigin struct {
    ID        uuid.UUID  // PK
    UserID    uuid.UUID  // FK → User (unique)
    AppID     uuid.UUID  // FK → Application
    CreatedAt time.Time  // Imutável após criação
}
```

#### AppMembership (Vínculo User ↔ App)
```go
type AppMembership struct {
    ID        uuid.UUID  // PK
    UserID    uuid.UUID  // FK → User
    AppID     uuid.UUID  // FK → Application
    Role      string     // member, admin, owner
    Status    string     // active, suspended
    LinkedAt  time.Time
    // Unique: (UserID, AppID)
}
```

---

### Application Module

#### Application
```go
type Application struct {
    ID          uuid.UUID  // PK
    Name        string
    Description string
    OwnerID     uuid.UUID  // FK → User
    PublicKey   string     // pq_pk_...
    SecretKey   string     // pq_sk_... (encrypted)
    Status      string     // active, suspended, deleted
    Scopes      []string   // identity, billing, telemetry, etc.
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

#### TelemetryEvent
```go
type TelemetryEvent struct {
    ID        uuid.UUID  // PK
    AppID     uuid.UUID  // FK → Application
    Type      string     // session.start, payment.completed, etc.
    ActorID   string     // ID do ator (user, system, etc.)
    ActorType string     // user, system, agent
    Data      JSON       // Dados do evento
    Timestamp time.Time
    CreatedAt time.Time
}
```

#### AppSession
```go
type AppSession struct {
    ID           uuid.UUID  // PK
    AppID        uuid.UUID  // FK → Application
    UserID       string     // ID do usuário no app
    DeviceInfo   JSON
    StartedAt    time.Time
    LastPingAt   time.Time
    EndedAt      *time.Time
    Duration     int        // segundos
    Status       string     // active, ended, expired
}
```

#### AppAlert
```go
type AppAlert struct {
    ID             uuid.UUID  // PK
    AppID          uuid.UUID  // FK → Application
    Type           string
    Severity       string     // info, warning, critical
    Title          string
    Message        string
    Source         string     // system, rule, manual
    RuleID         *uuid.UUID // FK → Rule (se source=rule)
    RuleName       string
    Data           JSON
    Acknowledged   bool
    AcknowledgedBy string
    AcknowledgedAt *time.Time
    CreatedAt      time.Time
}
```

---

### Rules Engine

#### Rule
```go
type Rule struct {
    ID              uuid.UUID  // PK
    AppID           uuid.UUID  // FK → Application
    Name            string
    Description     string
    TriggerType     string     // metric, threshold, event, schedule
    Condition       string     // Expressão de condição
    ActionType      string     // alert, webhook, adjust, create_rule
    ActionConfig    JSON
    CooldownMinutes int
    Enabled         bool
    Priority        int
    TTL             *time.Time // Expiração automática
    CreatedAt       time.Time
    UpdatedAt       time.Time
}
```

#### RuleExecution
```go
type RuleExecution struct {
    ID           uuid.UUID  // PK
    RuleID       uuid.UUID  // FK → Rule
    AppID        uuid.UUID  // FK → Application
    TriggerData  JSON       // Dados que dispararam
    ActionTaken  string
    Result       string     // success, failed, skipped
    Error        string
    ExecutedAt   time.Time
}
```

---

### Billing Kernel

#### BillingAccount
```go
type BillingAccount struct {
    ID               uuid.UUID  // PK
    UserID           uuid.UUID  // FK → User
    StripeCustomerID string
    Status           string     // active, suspended
    Balance          int64      // centavos
    Currency         string     // BRL, USD
    CreatedAt        time.Time
    UpdatedAt        time.Time
}
```

#### Subscription
```go
type Subscription struct {
    ID                   uuid.UUID  // PK
    BillingAccountID     uuid.UUID  // FK → BillingAccount
    StripeSubscriptionID string
    PlanID               string     // free, pro, enterprise
    Status               string     // active, canceled, past_due
    CurrentPeriodStart   time.Time
    CurrentPeriodEnd     time.Time
    CancelAtPeriodEnd    bool
    CreatedAt            time.Time
    UpdatedAt            time.Time
}
```

#### LedgerEntry
```go
type LedgerEntry struct {
    ID                uuid.UUID  // PK
    BillingAccountID  uuid.UUID  // FK → BillingAccount
    Type              string     // credit, debit
    Amount            int64      // centavos
    Currency          string
    Description       string
    ReferenceType     string     // payment, refund, adjustment
    ReferenceID       string
    BalanceBefore     int64
    BalanceAfter      int64
    CreatedAt         time.Time
    // Imutável após criação
}
```

---

### Governance Layer

#### Policy
```go
type Policy struct {
    ID          uuid.UUID  // PK
    Name        string
    Description string
    Resource    string     // billing.*, agents.*, etc.
    Action      string     // create, update, delete, execute
    Effect      string     // allow, deny, require_approval
    Conditions  JSON       // Condições adicionais
    Priority    int
    Enabled     bool
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

#### AuditEvent
```go
type AuditEvent struct {
    ID          uuid.UUID  // PK
    ActorID     string
    ActorType   string     // user, system, agent
    EventType   string
    Action      string
    Resource    string
    ResourceID  string
    BeforeState JSON
    AfterState  JSON
    Metadata    JSON       // IP, UserAgent, etc.
    Hash        string     // Integridade
    CreatedAt   time.Time
    // Imutável após criação
}
```

#### KillSwitch
```go
type KillSwitch struct {
    ID          uuid.UUID  // PK
    Scope       string     // global, billing, agents, ads
    Reason      string
    ActivatedBy uuid.UUID  // FK → User
    ActivatedAt time.Time
    ExpiresAt   *time.Time
    DeactivatedBy *uuid.UUID
    DeactivatedAt *time.Time
    Active      bool
}
```

#### ShadowExecution
```go
type ShadowExecution struct {
    ID             uuid.UUID  // PK
    AgentID        uuid.UUID  // FK → Agent
    DecisionID     uuid.UUID  // FK → AgentDecision
    ActionType     string
    ActionConfig   JSON
    WouldHaveResult JSON      // O que teria acontecido
    PolicyAllowed  bool
    Recommendation string     // safe_to_promote, needs_review, keep_shadow
    CreatedAt      time.Time
}
```

#### ApprovalRequest
```go
type ApprovalRequest struct {
    ID           uuid.UUID  // PK
    RequestType  string
    ResourceType string
    ResourceID   string
    RequestedBy  uuid.UUID  // FK → User
    Reason       string
    Data         JSON
    Status       string     // pending, approved, rejected, expired
    ExpiresAt    time.Time
    CreatedAt    time.Time
    // Imutável após criação
}
```

#### ApprovalDecision
```go
type ApprovalDecision struct {
    ID            uuid.UUID  // PK
    RequestID     uuid.UUID  // FK → ApprovalRequest
    DecidedBy     uuid.UUID  // FK → User
    Decision      string     // approved, rejected
    Justification string     // Mínimo 10 caracteres
    IP            string
    UserAgent     string
    Hash          string     // Integridade
    CreatedAt     time.Time
    // Imutável após criação
}
```

#### DecisionLifecycle
```go
type DecisionLifecycle struct {
    ID           uuid.UUID  // PK
    DecisionID   uuid.UUID  // FK → AgentDecision
    Status       string     // active, expired, superseded, revoked, under_review
    ValidFrom    time.Time
    ValidUntil   time.Time
    SupersededBy *uuid.UUID
    RevokedBy    *uuid.UUID
    RevokedAt    *time.Time
    RevokeReason string
    CreatedAt    time.Time
    UpdatedAt    time.Time
}
```

---

### Notification Service

#### Notification
```go
type Notification struct {
    ID        uuid.UUID  // PK
    UserID    uuid.UUID  // FK → User
    AppID     *uuid.UUID // FK → Application (opcional)
    Type      string     // alert, info, warning, success
    Title     string
    Message   string
    Data      JSON
    Read      bool
    ReadAt    *time.Time
    CreatedAt time.Time
}
```

---

### Narrative Service

#### FailureNarrative
```go
type FailureNarrative struct {
    ID           uuid.UUID  // PK
    AppID        uuid.UUID  // FK → Application
    EventType    string     // deploy.failed, container.crashed, etc.
    What         string     // O que aconteceu
    When         time.Time  // Quando
    Where        string     // Onde (fase, componente)
    Why          string     // Por que
    Context      string     // Contexto adicional
    ActionTaken  string     // O que o sistema fez
    NextStep     string     // Próximo passo recomendado
    Severity     string     // low, medium, high, critical
    RelatedEvent *uuid.UUID // FK → TelemetryEvent
    CreatedAt    time.Time
}
```

---

### Usage Service

#### UsageRecord
```go
type UsageRecord struct {
    ID              uuid.UUID  // PK
    AppID           uuid.UUID  // FK → Application
    Period          time.Time  // Mês de referência
    
    // Compute
    DeployCount     int
    ContainerHours  float64
    CPUHours        float64
    MemoryGBHours   float64
    
    // Storage
    StorageGB       float64
    BandwidthGB     float64
    
    // Events
    TelemetryEvents int
    WebhookCalls    int
    APIRequests     int
    
    CreatedAt       time.Time
    UpdatedAt       time.Time
}
```

---

## 🔗 Índices Importantes

```sql
-- Identity
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_app_memberships_user ON app_memberships(user_id);
CREATE INDEX idx_app_memberships_app ON app_memberships(app_id);

-- Telemetry
CREATE INDEX idx_telemetry_events_app ON telemetry_events(app_id);
CREATE INDEX idx_telemetry_events_type ON telemetry_events(type);
CREATE INDEX idx_telemetry_events_timestamp ON telemetry_events(timestamp);
CREATE INDEX idx_app_sessions_app ON app_sessions(app_id);
CREATE INDEX idx_app_sessions_status ON app_sessions(status);

-- Billing
CREATE INDEX idx_billing_accounts_user ON billing_accounts(user_id);
CREATE INDEX idx_subscriptions_account ON subscriptions(billing_account_id);
CREATE INDEX idx_ledger_entries_account ON ledger_entries(billing_account_id);

-- Governance
CREATE INDEX idx_audit_events_actor ON audit_events(actor_id);
CREATE INDEX idx_audit_events_resource ON audit_events(resource, resource_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
```

---

*Documento atualizado em 11/01/2026*
