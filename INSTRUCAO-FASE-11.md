# FASE 11 - INFRAESTRUTURA DE PODER

> "Sistemas assim não viram milhões vendendo licença barata. Viram milhões quando alguém diz: 'Se eu tirar isso, meu negócio entra em risco.'"

## DIAGNÓSTICO DO TECH LEAD

### O que já temos (e é raro):
- ✅ AgentDecision com risk_score e requires_approval
- ✅ Forbidden actions para agentes
- ✅ Ledger imutável (event sourcing parcial)
- ✅ DISPUTED state que bloqueia automações
- ✅ Circuit breaker

### O que falta para virar infraestrutura de poder:
1. Policy Engine declarativo
2. Event Log imutável para decisões
3. Kill Switch global
4. Shadow Mode / Dry Run

---

## PRIORIDADE 1: POLICY ENGINE DECLARATIVO

### Conceito
Não usar if/else para decisões críticas. Usar políticas versionadas, avaliadas em runtime, com decisões explicáveis.

### Modelo de Dados

```go
// Policy - regra declarativa
type Policy struct {
    ID          uuid.UUID
    Name        string      // "high_value_debit"
    Version     int         // versionamento
    Resource    string      // "ledger", "agent", "identity"
    Action      string      // "debit", "approve", "delete"
    Conditions  []Condition // quando aplicar
    Effect      string      // "allow", "deny", "require_approval"
    Reason      string      // explicação humana
    Priority    int         // ordem de avaliação
    Active      bool
    CreatedAt   time.Time
    CreatedBy   uuid.UUID   // quem criou
}

// Condition - condição de uma policy
type Condition struct {
    Field    string // "amount", "user.role", "risk_score"
    Operator string // "gt", "lt", "eq", "in", "not_in"
    Value    any    // 10000, "admin", 0.6
}

// PolicyEvaluation - resultado de avaliação
type PolicyEvaluation struct {
    ID           uuid.UUID
    PolicyID     uuid.UUID
    Resource     string
    Action       string
    Context      map[string]any // dados avaliados
    Result       string         // "allowed", "denied", "pending_approval"
    Reason       string         // explicação
    EvaluatedAt  time.Time
    EvaluatedBy  string         // "system" ou user_id
}
```

### Exemplo de Políticas

```yaml
# Bloquear débito alto sem aprovação
- name: high_value_debit
  resource: ledger
  action: debit
  conditions:
    - field: amount
      operator: gt
      value: 10000  # R$ 100,00
    - field: user.role
      operator: not_in
      value: [admin, super_admin]
  effect: require_approval
  reason: "Débito acima de R$ 100 requer aprovação humana"

# Bloquear agente com risco alto
- name: block_high_risk_agent
  resource: agent
  action: execute
  conditions:
    - field: risk_score
      operator: gte
      value: 0.6
  effect: deny
  reason: "Risco >= 60% é bloqueado automaticamente"

# Permitir admin fazer qualquer coisa
- name: admin_override
  resource: "*"
  action: "*"
  conditions:
    - field: user.role
      operator: in
      value: [super_admin]
  effect: allow
  reason: "Super admin tem acesso total"
  priority: 1000  # avaliado primeiro
```

### Endpoints

```
POST   /api/v1/policies              - Criar política
GET    /api/v1/policies              - Listar políticas
GET    /api/v1/policies/:id          - Buscar política
PUT    /api/v1/policies/:id          - Atualizar política
DELETE /api/v1/policies/:id          - Desativar política
POST   /api/v1/policies/evaluate     - Avaliar ação contra políticas
GET    /api/v1/policies/evaluations  - Histórico de avaliações
```

---

## PRIORIDADE 2: EVENT LOG IMUTÁVEL

### Conceito
Expandir o event sourcing do Ledger para todas as decisões críticas. Log append-only, nunca deletar, sempre explicar.

### Eventos a Logar

```go
// EventType - tipos de eventos do sistema
const (
    // Identity
    EventUserCreated       = "USER_CREATED"
    EventUserSuspended     = "USER_SUSPENDED"
    EventUserBanned        = "USER_BANNED"
    EventUserReactivated   = "USER_REACTIVATED"
    EventRoleChanged       = "ROLE_CHANGED"
    
    // Billing
    EventPaymentCreated    = "PAYMENT_CREATED"
    EventPaymentConfirmed  = "PAYMENT_CONFIRMED"
    EventPaymentFailed     = "PAYMENT_FAILED"
    EventPaymentDisputed   = "PAYMENT_DISPUTED"
    EventLedgerCredit      = "LEDGER_CREDIT"
    EventLedgerDebit       = "LEDGER_DEBIT"
    
    // Agent
    EventAgentDecisionProposed = "AGENT_DECISION_PROPOSED"
    EventAgentDecisionApproved = "AGENT_DECISION_APPROVED"
    EventAgentDecisionRejected = "AGENT_DECISION_REJECTED"
    EventAgentDecisionExecuted = "AGENT_DECISION_EXECUTED"
    
    // Governance
    EventPolicyCreated     = "POLICY_CREATED"
    EventPolicyEvaluated   = "POLICY_EVALUATED"
    EventDisputeOpened     = "DISPUTE_OPENED"
    EventDisputeResolved   = "DISPUTE_RESOLVED"
    EventKillSwitchActivated = "KILL_SWITCH_ACTIVATED"
)

// AuditEvent - evento imutável
type AuditEvent struct {
    ID          uuid.UUID
    Type        string
    ActorID     uuid.UUID      // quem fez
    ActorType   string         // "user", "agent", "system"
    TargetID    uuid.UUID      // afetado
    TargetType  string         // "user", "payment", "ledger"
    Action      string         // ação executada
    Before      map[string]any // estado anterior
    After       map[string]any // estado posterior
    Metadata    map[string]any // contexto adicional
    PolicyID    *uuid.UUID     // política que permitiu/bloqueou
    Reason      string         // explicação
    IP          string
    UserAgent   string
    CreatedAt   time.Time
}
```

### Características
- **Append-only**: nunca UPDATE, nunca DELETE
- **Imutável**: hash encadeado (como blockchain simplificado)
- **Explicável**: sempre tem reason
- **Rastreável**: sempre tem actor

---

## PRIORIDADE 3: KILL SWITCH GLOBAL

### Conceito
Botão vermelho que pausa automações. Acionável por super_admin, com escopo configurável.

### Modelo

```go
// KillSwitch - controle de emergência
type KillSwitch struct {
    ID          uuid.UUID
    Scope       string    // "all", "billing", "agents", "ads"
    Active      bool
    Reason      string
    ActivatedBy uuid.UUID
    ActivatedAt time.Time
    ExpiresAt   *time.Time // opcional: expira automaticamente
}

// KillSwitchCheck - verificação antes de executar
func (s *Service) CheckKillSwitch(scope string) error {
    if s.IsKillSwitchActive("all") || s.IsKillSwitchActive(scope) {
        return ErrKillSwitchActive
    }
    return nil
}
```

### Endpoints

```
POST   /api/v1/admin/kill-switch           - Ativar kill switch
DELETE /api/v1/admin/kill-switch/:scope    - Desativar
GET    /api/v1/admin/kill-switch           - Status atual
```

### Integração
Todos os serviços críticos verificam kill switch antes de executar:
- Billing: antes de débito/crédito
- Agents: antes de executar decisão
- Ads: antes de gastar budget
- Jobs: antes de processar

---

## PRIORIDADE 4: SHADOW MODE / DRY RUN

### Conceito
Testar decisões sem executá-las. Agentes rodam em simulação, billing calcula mas não debita.

### Implementação

```go
// ExecutionMode - modo de execução
const (
    ModeReal   = "real"   // executa de verdade
    ModeShadow = "shadow" // simula, não executa
    ModeDryRun = "dry_run" // calcula, retorna resultado, não persiste
)

// AgentDecision com modo
type AgentDecision struct {
    // ... campos existentes
    ExecutionMode string // real, shadow, dry_run
    SimulatedResult *SimulatedResult // resultado se fosse real
}

// SimulatedResult - o que aconteceria
type SimulatedResult struct {
    WouldExecute  bool
    WouldAffect   []string // IDs afetados
    WouldDebit    int64    // valor que seria debitado
    WouldCredit   int64    // valor que seria creditado
    BlockedBy     *string  // política que bloquearia
    RiskScore     float64
}
```

### Uso
```go
// Testar antes de executar
result, err := agentService.ProposeDecision(ctx, decision, ModeDryRun)
if result.BlockedBy != nil {
    log.Printf("Seria bloqueado por: %s", *result.BlockedBy)
}

// Rodar agente em shadow mode por 7 dias
agent.ExecutionMode = ModeShadow
// Todas as decisões são logadas mas não executadas
```

---

## ORDEM DE IMPLEMENTAÇÃO

### Fase 11.1 - Policy Engine ✅
1. ✅ Criar modelos Policy, Condition, PolicyEvaluation
2. ✅ Criar PolicyService com Evaluate()
3. ✅ Criar PolicyHandler com CRUD
4. ✅ Integrar com AgentService (GovernedAgentService)
5. ✅ Integrar com BillingService (GovernedBillingService)
6. ✅ Criar políticas padrão (seed automático)

### Fase 11.2 - Event Log Imutável ✅
1. ✅ Criar modelo AuditEvent
2. ✅ Criar AuditService com Log()
3. ✅ Integrar em GovernedBillingService
4. ✅ Integrar em GovernedAgentService
5. ✅ Criar endpoint de consulta com filtros

### Fase 11.3 - Kill Switch ✅
1. ✅ Criar modelo KillSwitch
2. ✅ Criar KillSwitchService
3. ✅ Integrar em GovernedBillingService
4. ✅ Integrar em GovernedAgentService
5. ✅ Criar endpoints admin
6. ✅ Handlers usam GovernedServices

### Fase 11.4 - Shadow Mode
1. ⏳ Adicionar ExecutionMode nos modelos
2. ⏳ Implementar lógica de simulação
3. ⏳ Criar endpoint de dry-run
4. ⏳ Dashboard de simulações no Admin

---

## ARQUIVOS CRIADOS NA FASE 11

### Policy Engine
- `internal/policy/model.go` - Policy, Condition, PolicyEvaluation
- `internal/policy/service.go` - Evaluate(), CRUD
- `internal/policy/handler.go` - REST API

### Audit Log
- `internal/audit/model.go` - AuditEvent com hash encadeado
- `internal/audit/service.go` - Log(), Query(), VerifyChain()
- `internal/audit/handler.go` - REST API

### Kill Switch
- `internal/killswitch/model.go` - KillSwitch, scopes
- `internal/killswitch/service.go` - Check(), Activate(), Deactivate()
- `internal/killswitch/handler.go` - REST API

### Governed Services
- `internal/billing/governed_service.go` - GovernedBillingService
- `internal/agent/governed_service.go` - GovernedAgentService

---

## CRITÉRIO DE SUCESSO

> "Se eu trocar qualquer componente, o sistema continua auditável, explicável e controlável."

- [x] Toda decisão crítica passa por Policy Engine
- [x] Todo evento importante está no Audit Log
- [x] Kill Switch para tudo em < 1 segundo
- [ ] Shadow mode funcionando para agentes (Fase 11.4 - próxima iteração)

---

## ✅ FASE 11 CONCLUÍDA - 28/12/2025

### Final Boss Derrotado

O critério do Tech Lead foi atendido:

> "Existe pelo menos um evento no Audit Log que prova que o sistema impediu algo importante de acontecer, e eu consigo explicar isso sem olhar código."

**Prova registrada no Audit Log:**
```json
{
  "type": "AGENT_DECISION_PROPOSED",
  "action": "propose_blocked",
  "actor_type": "agent",
  "actor_id": "9e511e93-826b-4caf-a18c-0dd5022959bc",
  "reason": "Bloqueado por Kill Switch: operação de agente impedida durante emergência",
  "hash": "d2f7c145988a7b09..."
}
```

**O que aconteceu:**
1. Kill Switch foi ativado para scope "agents"
2. Agente tentou propor decisão de transferência de R$ 500,00
3. GovernedAgentService verificou Kill Switch ANTES de processar
4. Operação foi BLOQUEADA com status 403
5. Audit Log registrou o bloqueio com hash encadeado

**Explicação sem olhar código:**
- **Quem tentou**: Agente 9e511e93 (tipo: agent)
- **O que tentou**: Propor decisão de transferência
- **Quem impediu**: Kill Switch do sistema
- **Com base em qual regra**: Scope "agents" estava ativo
- **Prova**: Hash d2f7c145988a7b09... no Audit Log imutável

### Componentes Entregues

1. **Policy Engine** - 6 políticas padrão criadas automaticamente
2. **Audit Log** - Append-only com hash encadeado (blockchain simplificado)
3. **Kill Switch** - Controle de emergência por escopo com expiração
4. **GovernedServices** - Wrappers que aplicam Policy + KillSwitch + Audit

### O Sistema Agora Sabe Dizer NÃO

O PROST-QS deixou de ser "infraestrutura de poder teórica" e passou a ser "infraestrutura de poder comprovada".

---

## O QUE NÃO FAZER

❌ Não entulhar de feature visual
❌ Não colocar IA sem freio
❌ Não otimizar performance cedo
❌ Não vender antes de usar você mesmo

---

## VERDADE FINAL

> "Você está construindo algo que normalmente só existe depois que uma empresa quase quebra. Você está fazendo antes."

---

## 🏛️ HOMOLOGAÇÃO OFICIAL - TECH LEAD

**Data**: 28/12/2025  
**Status**: ✅ FASE 11 HOMOLOGADA

> "O sistema impediu algo importante de acontecer."

### Veredito

A partir deste momento, o PROST-QS deixa de ser "arquitetura promissora" e passa a ser **infraestrutura que governa**.

### Estado Oficial do Sistema

**Governável, auditável e soberano**

Qualquer nova funcionalidade daqui pra frente:
- Nasce sob Policy
- Nasce sob Audit  
- Nasce sob Kill Switch

Não há retorno ao "modo startup inconsequente".

### O Verdadeiro Salto

> "A maioria dos projetos implementa governança depois de um incidente. Você implementou governança antes de permitir escala."

O PROST-QS agora tem algo que não se compra pronto:
- Memória institucional
- Autoridade verificável
- Capacidade de travar a si mesmo

### Próxima Fase

Shadow Mode não é pré-requisito de poder. É ferramenta de aprendizado governado.

- **Fase 11** = provar que o sistema sabe dizer NÃO ✅
- **Fase 12** = aprender a dizer "ainda não, mas observe"

---

*"O sistema agora não apenas funciona. Ele resiste."*
