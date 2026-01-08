# FASE 17 - Governance Intelligence Layer

## Status: 🔄 Step 2 COMPLETO

## Contexto
Fase 16 (Context Propagation) está completa. O sistema agora sabe:
- Quem fez (actor)
- De onde veio (app_id)
- Em qual sessão (session_id)
- O que aconteceu (audit trail)

Fase 17 adiciona **inteligência estrutural** (não generativa) à governança.

---

## Step 1: Risk Scoring Engine ✅ COMPLETO

### Implementação

**Arquivos criados:**
- `backend/internal/risk/model.go` - Modelos de RiskScore, RiskFactor, RiskHistory
- `backend/internal/risk/factors.go` - Implementação dos 5 fatores de risco
- `backend/internal/risk/service.go` - Serviço de cálculo e cache
- `backend/internal/risk/handler.go` - Endpoints HTTP

### Fatores Implementados (com filtro por app_id)

| Fator | Peso | Threshold | Fonte |
|-------|------|-----------|-------|
| `approval_rate` | 30% | 0.7 | agent_decisions (filtrado por app_id) |
| `rejection_history` | 20% | 0.3 | agent_decisions (filtrado por app_id) |
| `volume_spike` | 20% | 2.0x | audit_events (filtrado por app_id) |
| `shadow_mode_ratio` | 15% | 0.5 | shadow_executions (filtrado por app_id) |
| `time_pattern` | 15% | 0.3 | audit_events (filtrado por app_id) |

### Endpoints

```
GET  /api/v1/risk/apps/:appId           - Score atual do app
GET  /api/v1/risk/apps/:appId/history   - Histórico de scores
GET  /api/v1/risk/apps/:appId/trend     - Tendência (subindo/estável/descendo)
POST /api/v1/risk/apps/:appId/calculate - Forçar recálculo (ignora cache)
POST /api/v1/risk/check                 - Verificar se risco é aceitável
```

### Validação Multi-App (Período de Observação)

**Data**: 2025-12-29

#### Good Behavior App (4f0ba5db-1ed7-488d-8b06-282081f27e78)
```json
{
    "score": 0.07,
    "level": "LOW",
    "factors": {
        "approval_rate": 0.10 (90% aprovação) ✅,
        "rejection_history": 0.10 (10% rejeição) ✅,
        "volume_spike": 0.11 (volume estável) ✅,
        "shadow_mode_ratio": 0.00 (sem shadow) ✅,
        "time_pattern": 0.00 (100% horário comercial) ✅
    },
    "explanation": "Risco BAIXO. O app apresenta comportamento saudável."
}
```

#### Bad Behavior App (b609e73a-bf21-406f-b122-58a3ed21ce9c)
```json
{
    "score": 0.54,
    "level": "MEDIUM",
    "factors": {
        "approval_rate": 0.50 (50% aprovação) ❌,
        "rejection_history": 0.50 (50% rejeição) ❌,
        "volume_spike": 1.00 (spike de 7x) ❌,
        "shadow_mode_ratio": 0.00 (sem shadow) ✅,
        "time_pattern": 0.62 (62% fora do horário) ❌
    },
    "explanation": "Risco MÉDIO. Alguns indicadores merecem atenção."
}
```

### Checklist de Observação

- [x] Risk Scoring Engine funcionando
- [x] Filtro por app_id em todos os fatores
- [x] Pelo menos 1 app com score LOW (Good Behavior: 0.07)
- [x] Pelo menos 1 app com score MEDIUM/HIGH (Bad Behavior: 0.54)
- [x] Capacidade de explicar cada score verbalmente
- [x] Diferença clara entre comportamentos

### Critério de Sucesso ✅

> "Dado um app específico, consigo responder com autoridade por que ele é considerado de baixo, médio ou alto risco."

**Resposta para Good Behavior App:**
- Score: 0.07 (LOW)
- Motivo: Alta taxa de aprovação (90%), baixa rejeição (10%), volume estável, 100% atividade em horário comercial

**Resposta para Bad Behavior App:**
- Score: 0.54 (MEDIUM)
- Motivo: Taxa de aprovação baixa (50%), alta rejeição (50%), spike de volume (7x), 62% atividade fora do horário comercial

---

## Step 2: Policy Thresholds Dinâmicos ✅ COMPLETO

### Implementação

**Arquivos criados:**
- `backend/internal/policy/threshold.go` - Modelos PolicyThreshold, ThresholdAdjustment
- `backend/internal/policy/threshold_service.go` - Serviço CRUD + GetRecommendation
- `backend/internal/policy/threshold_handler.go` - Endpoints HTTP

**Arquivos modificados:**
- `backend/internal/policy/model.go` - Adicionado ThresholdRecommendationInfo
- `backend/internal/policy/service.go` - Integração passiva com thresholds
- `backend/pkg/db/sqlite.go` - Tabelas policy_thresholds e threshold_adjustments

### Guardrails do Tech Lead (Obrigatórios)

| Regra | Status |
|-------|--------|
| ❌ Thresholds não podem decidir sozinhos | ✅ Implementado - apenas influenciam |
| ❌ Nenhuma mutação automática sem histórico | ✅ Implementado - ThresholdAdjustment |
| ❌ Nada global por padrão | ✅ Implementado - por policy, opcionalmente por app |
| Ajustes automáticos reversíveis | ✅ Implementado - RevertAdjustment() |
| Integração PASSIVA primeiro | ✅ Implementado - GetRecommendation() |

### Modelos

```go
// PolicyThreshold - define comportamento por nível de risco
type PolicyThreshold struct {
    ID          uuid.UUID       // PK
    PolicyID    uuid.UUID       // Obrigatório - threshold é por policy
    AppID       *uuid.UUID      // Opcional - nil = global para a policy
    RiskLevel   string          // low, medium, high, critical
    Action      ThresholdAction // allow, require_approval, shadow, block
    Description string
    Active      bool
    CreatedBy   uuid.UUID
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

// ThresholdAdjustment - histórico versionado e reversível
type ThresholdAdjustment struct {
    ID             uuid.UUID
    ThresholdID    uuid.UUID
    PreviousAction ThresholdAction
    NewAction      ThresholdAction
    Reason         string
    TriggerType    string          // manual, automatic, system
    AdjustedBy     string          // user_id ou "system"
    Reverted       bool
    RevertedAt     *time.Time
    RevertedBy     *string
    RevertReason   string
    CreatedAt      time.Time
}
```

### Endpoints

```
GET    /api/v1/thresholds/:id                    - Buscar threshold
PUT    /api/v1/thresholds/:id                    - Atualizar (com versionamento)
DELETE /api/v1/thresholds/:id                    - Desativar threshold
GET    /api/v1/thresholds/:id/history            - Histórico de ajustes
POST   /api/v1/thresholds/recommend              - Obter recomendação (passiva)
POST   /api/v1/thresholds/adjustments/:id/revert - Reverter ajuste
GET    /api/v1/thresholds/policy/:policyId       - Listar por policy
POST   /api/v1/thresholds/policy/:policyId       - Criar threshold
GET    /api/v1/thresholds/app/:appId             - Listar por app
```

### Thresholds Configurados (Policy: block_high_risk_agent)

| Risk Level | Action | Threshold ID |
|------------|--------|--------------|
| low | allow | adfba11d-eef4-49b7-b680-53d3e4a4bcaf |
| medium | require_approval | c6a4dd56-812c-45c0-b978-b12ffd80207a |
| high | shadow | 3eb942fc-4704-410f-9951-bca3536227a2 |
| critical | block | 17675342-3f04-49af-b7e5-75b0e735f22f |

### Integração Passiva com PolicyService.Evaluate()

A integração é **PASSIVA** - thresholds influenciam, não decidem:

```go
// PolicyService.Evaluate() agora retorna:
{
    "allowed": false,
    "result": "denied",
    "policy_id": "b7845e87-0c88-4040-8ef1-2a550be0f35e",
    "policy_name": "block_high_risk_agent",
    "reason": "Risco >= 60% é bloqueado automaticamente",
    
    // NOVO: Recomendação do threshold (passiva)
    "threshold_recommendation": {
        "threshold_id": "3eb942fc-4704-410f-9951-bca3536227a2",
        "recommended_action": "shadow",
        "risk_level": "high",
        "risk_score": 0.65,
        "reason": "Threshold global da policy: Risco alto: executar em shadow mode",
        "is_default": false
    }
}
```

**Comportamento:**
1. Policy decide: `denied` (baseado em condições)
2. Threshold recomenda: `shadow` (baseado em configuração)
3. Sistema pode usar a recomendação para ajustar comportamento futuro
4. Nenhuma ação automática - apenas informação

### Validação

**Teste 1: Bad Behavior App (risk_score: 0.65, risk_level: high)**
```json
{
    "allowed": false,
    "result": "denied",
    "policy_name": "block_high_risk_agent",
    "threshold_recommendation": {
        "recommended_action": "shadow",
        "risk_level": "high",
        "is_default": false
    }
}
```
✅ Policy decidiu `denied`, threshold recomendou `shadow`

**Teste 2: Good Behavior App (risk_score: 0.07, risk_level: low)**
```json
{
    "allowed": true,
    "result": "allowed",
    "reason": "Nenhuma política correspondente - permitido por padrão"
}
```
✅ Risco baixo não aciona nenhuma policy de bloqueio

### Critério de Sucesso ✅

> "Thresholds influenciam decisões, não executam ações. Toda mudança é versionada e reversível."

- [x] Thresholds criados por policy (não globais)
- [x] Histórico de ajustes (ThresholdAdjustment)
- [x] Reversibilidade (RevertAdjustment)
- [x] Integração passiva (GetRecommendation)
- [x] PolicyService.Evaluate() retorna recomendação de threshold
- [x] Nenhuma ação automática - apenas influência

---

## 3 Pilares da Fase 17

### Pilar 1: Risk Scoring Engine

**Objetivo**: Calcular score de risco ANTES de qualquer decisão.

**Modelo**:
```go
// backend/internal/risk/model.go

type RiskScore struct {
    ID          uuid.UUID
    AppID       uuid.UUID   // Score por app
    AgentID     *uuid.UUID  // Score por agente (opcional)
    Domain      string      // billing, agents, identity
    Score       float64     // 0.0 a 1.0
    Factors     []RiskFactor
    CalculatedAt time.Time
}

type RiskFactor struct {
    Name        string   // "approval_rate", "rejection_history", "volume_spike"
    Weight      float64  // Peso no cálculo
    Value       float64  // Valor atual
    Threshold   float64  // Limite aceitável
    Exceeded    bool     // Passou do limite?
}
```

**Fatores de Risco**:
| Fator | Descrição | Peso |
|-------|-----------|------|
| `approval_rate` | Taxa de aprovação histórica do app | 0.3 |
| `rejection_history` | Quantidade de rejeições recentes | 0.2 |
| `volume_spike` | Aumento súbito de decisões | 0.2 |
| `shadow_mode_ratio` | % de ações em shadow mode | 0.15 |
| `time_pattern` | Horário incomum de atividade | 0.15 |

**Cálculo**:
```
risk_score = Σ (factor.value * factor.weight) / Σ weights
```

---

### Pilar 2: Policy Thresholds Dinâmicos

**Objetivo**: Policies que se adaptam baseado em histórico.

**Modelo**:
```go
// backend/internal/policy/threshold.go

type PolicyThreshold struct {
    ID          uuid.UUID
    PolicyID    uuid.UUID
    AppID       *uuid.UUID  // nil = global
    Metric      string      // "max_amount", "daily_limit", "risk_tolerance"
    BaseValue   float64     // Valor padrão
    CurrentValue float64    // Valor atual (ajustado)
    AdjustmentReason string
    LastAdjustedAt time.Time
}

type ThresholdAdjustment struct {
    ThresholdID uuid.UUID
    OldValue    float64
    NewValue    float64
    Reason      string      // "good_history", "risk_increase", "manual"
    AdjustedBy  string      // "system" ou user_id
    AdjustedAt  time.Time
}
```

**Regras de Ajuste**:
```
SE app.approval_rate > 0.95 por 30 dias:
    → Aumentar max_amount em 20%
    → Reduzir requires_approval threshold

SE app.rejection_rate > 0.3 por 7 dias:
    → Reduzir max_amount em 50%
    → Forçar requires_approval = true

SE app.risk_score > 0.7:
    → Ativar shadow_mode obrigatório
    → Notificar admin
```

---

### Pilar 3: Explainability (Decisão Explicável)

**Objetivo**: Toda decisão DEVE responder 3 perguntas:
1. Por que foi aceita/bloqueada?
2. Qual policy influenciou?
3. Qual seria o caminho alternativo?

**Modelo**:
```go
// backend/internal/explainability/model.go

type DecisionExplanation struct {
    ID              uuid.UUID
    DecisionID      uuid.UUID   // Referência à decisão
    DecisionType    string      // "agent_decision", "approval", "policy_eval"
    Outcome         string      // "allowed", "blocked", "pending"
    
    // As 3 perguntas
    WhyThisOutcome  string      // "Bloqueado porque risk_score > 0.7"
    PolicyInfluence []PolicyInfluence
    AlternativePath string      // "Reduza amount para < 1000 ou solicite aprovação"
    
    // Contexto
    RiskScore       float64
    Factors         map[string]any
    CreatedAt       time.Time
}

type PolicyInfluence struct {
    PolicyID    uuid.UUID
    PolicyName  string
    Weight      float64     // Quanto essa policy influenciou (0-1)
    Matched     bool        // A policy foi acionada?
    Reason      string      // "amount > max_amount"
}
```

**Exemplo de Explicação**:
```json
{
    "decision_id": "abc-123",
    "outcome": "blocked",
    "why_this_outcome": "Decisão bloqueada: risk_score (0.75) excede threshold (0.6) para domínio 'billing'",
    "policy_influence": [
        {
            "policy_name": "billing_high_value",
            "weight": 0.6,
            "matched": true,
            "reason": "amount (5000) > max_amount (1000)"
        },
        {
            "policy_name": "app_risk_threshold",
            "weight": 0.4,
            "matched": true,
            "reason": "app risk_score (0.75) > tolerance (0.6)"
        }
    ],
    "alternative_path": "Opções: (1) Reduza amount para <= 1000, (2) Solicite aprovação manual, (3) Aguarde redução do risk_score do app"
}
```

---

## Estrutura de Arquivos

```
backend/internal/
├── risk/
│   ├── model.go          # RiskScore, RiskFactor
│   ├── service.go        # CalculateRisk, GetAppRisk
│   ├── factors.go        # Implementação dos fatores
│   └── handler.go        # GET /risk/apps/:appId
│
├── policy/
│   ├── threshold.go      # PolicyThreshold, ThresholdAdjustment
│   ├── threshold_service.go  # AdjustThreshold, GetThresholds
│   └── (existente)
│
└── explainability/
    ├── model.go          # DecisionExplanation, PolicyInfluence
    ├── service.go        # Explain, GetExplanation
    └── handler.go        # GET /explain/:decisionId
```

---

## Ordem de Implementação

### Step 1: Risk Scoring Engine
1. Criar `risk/model.go`
2. Criar `risk/service.go` com `CalculateAppRisk()`
3. Criar `risk/factors.go` com implementação dos 5 fatores
4. Integrar no `GovernedAgentService` e `GovernedBillingService`
5. Endpoint: `GET /api/v1/risk/apps/:appId`

### Step 2: Policy Thresholds
1. Criar `policy/threshold.go`
2. Criar `policy/threshold_service.go`
3. Integrar thresholds no `PolicyService.Evaluate()`
4. Job para ajuste automático de thresholds
5. Endpoint: `GET /api/v1/policies/:policyId/thresholds`

### Step 3: Explainability
1. Criar `explainability/model.go`
2. Criar `explainability/service.go`
3. Integrar explicação em todas as decisões
4. Endpoint: `GET /api/v1/explain/:decisionId`
5. Incluir explicação no response de decisões

---

## Critérios de Sucesso

✅ Risk Score calculado para cada app
✅ Thresholds ajustados automaticamente baseado em histórico
✅ Toda decisão tem explicação acessível
✅ Admin Console mostra risk score por app
✅ Nenhum LLM ou IA generativa envolvida

---

## O que NÃO fazer na Fase 17

❌ Plugar LLM para "explicar" decisões
❌ Criar agentes autônomos
❌ Embeddings ou vetores
❌ Machine Learning complexo
❌ Qualquer coisa que não seja matemática + histórico + regras

---

**Data**: 2025-12-29
**Autor**: Tech Lead (via ChatGPT)
**Executor**: Kiro
