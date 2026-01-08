# FASE 18 - Explainability & Admin Intelligence

## Status: 🔄 Step 2 COMPLETO

## Contexto Estratégico

A Fase 17 fechou o núcleo de governança:
- **Risk** → mede comportamento
- **Policy** → decide ações
- **Threshold** → aconselha ajustes

O sistema já faz algo que 95% dos sistemas de IA não fazem: **decide, aconselha e explica sem IA generativa**.

Mas governança sem visibilidade é governança morta.

A Fase 18 transforma o kernel em algo que:
- Um **Founder** consegue defender
- Um **cliente enterprise** confia
- Um **auditor** entende
- Um **investidor** respeita

---

## Princípio Central

> "Confiança vem antes de automação."

A Fase 18 **NÃO** adiciona:
- ❌ Ajustes automáticos
- ❌ IA generativa
- ❌ LLM
- ❌ Embeddings
- ❌ Autonomia do sistema

A Fase 18 **ADICIONA**:
- ✅ Visibilidade total
- ✅ Explicação executiva
- ✅ Inteligência para humanos (não do sistema)

---

## Step 1: Decision Timeline ✅ COMPLETO

### Implementação

**Arquivos criados:**
- `backend/internal/explainability/model.go` - DecisionTimeline, RiskFactorSnapshot
- `backend/internal/explainability/service.go` - TimelineService com CRUD e busca
- `backend/internal/explainability/handler.go` - Endpoints HTTP

**Arquivos modificados:**
- `backend/internal/policy/service.go` - Integração com TimelineService
- `backend/internal/policy/model.go` - Adicionado EvaluationID na resposta
- `backend/pkg/db/sqlite.go` - Tabela decision_timelines
- `backend/cmd/api/main.go` - Rotas registradas

### Modelo DecisionTimeline

```go
type DecisionTimeline struct {
    ID           uuid.UUID   // PK
    DecisionID   uuid.UUID   // Referência à decisão (evaluation_id)
    DecisionType string      // policy_eval, agent_decision, approval
    
    // Contexto
    Timestamp    time.Time
    AppID        *uuid.UUID
    ActorID      uuid.UUID
    ActorType    string      // user, agent, system
    SessionID    *string
    
    // O que foi avaliado
    Resource     string
    Action       string
    Context      JSONMap
    
    // Estado de risco no momento
    RiskScore    float64
    RiskLevel    string
    RiskFactors  []RiskFactorSnapshot
    
    // Policy que avaliou
    PolicyID     *uuid.UUID
    PolicyName   string
    PolicyResult string      // allowed, denied, pending_approval
    PolicyReason string
    
    // Threshold que aconselhou
    ThresholdID     *uuid.UUID
    ThresholdAction string   // allow, require_approval, shadow, block
    ThresholdReason string
    
    // Resultado final
    FinalOutcome   string
    HasDivergence  bool      // policy ≠ threshold
    DivergenceNote string
}
```

### Endpoints

```
GET /api/v1/decisions/:decisionId/timeline  - Timeline de uma decisão específica
GET /api/v1/timeline/:id                    - Timeline por ID próprio
GET /api/v1/timeline/app/:appId             - Timelines de um app
GET /api/v1/timeline/actor/:actorId         - Timelines de um ator
GET /api/v1/timeline/divergent              - Decisões com divergência
POST /api/v1/timeline/search                - Busca com filtros
GET /api/v1/timeline/search                 - Busca com query params
```

### Validação

**Teste 1: Bad Behavior App (risk_score: 0.65)**
```json
{
    "decision_id": "e0e36e35-2827-49a4-8eb9-3f777b69e35a",
    "decision_type": "policy_eval",
    "app_id": "b609e73a-bf21-406f-b122-58a3ed21ce9c",
    "risk_score": 0.65,
    "risk_level": "high",
    "policy_name": "block_high_risk_agent",
    "policy_result": "denied",
    "threshold_action": "shadow",
    "final_outcome": "denied",
    "has_divergence": true,
    "divergence_note": "Policy decidiu 'denied', threshold recomendou 'shadow'"
}
```
✅ Timeline completa com divergência detectada

**Teste 2: Good Behavior App (risk_score: 0.07)**
```json
{
    "decision_id": "3a8760c8-e7bd-4523-993e-d55abf26a146",
    "decision_type": "policy_eval",
    "app_id": "4f0ba5db-1ed7-488d-8b06-282081f27e78",
    "risk_score": 0.07,
    "risk_level": "low",
    "policy_name": "none",
    "policy_result": "allowed",
    "final_outcome": "allowed",
    "has_divergence": false
}
```
✅ Timeline registrada mesmo para decisões padrão

### Critério de Sucesso ✅

> "Mostre tudo o que levou essa decisão a acontecer — em ordem."

- [x] Contexto completo (app_id, actor_id, timestamp, session_id)
- [x] Estado de risco no momento (score, level, factors)
- [x] Policy que avaliou (id, name, result, reason)
- [x] Threshold que aconselhou (id, action, reason)
- [x] Resultado final
- [x] Divergência detectada automaticamente
- [x] Endpoints de consulta funcionando

---

## Step 2: Admin Intelligence ✅ COMPLETO

### Implementação

**Arquivos criados:**
- `backend/internal/explainability/intelligence.go` - Modelos AdminDashboard, TensionPoint, Rankings
- `backend/internal/explainability/intelligence_service.go` - Agregações e detecção de tensões
- `backend/internal/explainability/intelligence_handler.go` - Endpoints HTTP

**Arquivos modificados:**
- `backend/cmd/api/main.go` - Rotas registradas

### Objetivo

> "Mostrar onde o sistema está sob tensão, antes que vire incidente."

### Escopo (conforme autorizado)

| Permitido | Proibido |
|-----------|----------|
| ✅ Agregações | ❌ Novas decisões |
| ✅ Rankings | ❌ Ajustes automáticos |
| ✅ Alertas informativos | ❌ Feedback loop |
| ✅ Queries otimizadas | ❌ Mudança de comportamento |
| ✅ Visões administrativas | |

### Endpoints

```
GET /api/v1/admin/intelligence/dashboard     - Dashboard completo
GET /api/v1/admin/intelligence/overview      - Apenas overview
GET /api/v1/admin/intelligence/tensions      - Pontos de tensão
GET /api/v1/admin/intelligence/risky-apps    - Ranking de apps por risco
GET /api/v1/admin/intelligence/policies      - Estatísticas de policies
GET /api/v1/admin/intelligence/divergences   - Hotspots de divergência
GET /api/v1/admin/intelligence/apps/:appId   - Inteligência específica de um app
```

### Tensões Detectadas Automaticamente

| Tipo | Threshold | Severidade |
|------|-----------|------------|
| `divergence_cluster` | > 20% divergência | warning/critical |
| `risk_spike` | risk_score >= 0.7 | warning/critical |
| `high_denial_rate` | > 50% negações | warning/critical |
| `policy_overload` | > 70% negações em policy | info/warning |

### Validação

**Dashboard completo:**
```json
{
    "overview": {
        "total_decisions": 2,
        "allowed_count": 1,
        "denied_count": 1,
        "divergence_count": 1,
        "divergence_rate": 50,
        "unique_apps": 2,
        "apps_at_risk": 1
    },
    "tensions": [
        {
            "type": "divergence_cluster",
            "severity": "critical",
            "title": "Alta taxa de divergência",
            "description": "50.0% das decisões têm divergência entre policy e threshold"
        }
    ],
    "top_risky_apps": [
        {"app_id": "b609e73a...", "risk_score": 0.65, "risk_level": "high", "denial_rate": 100},
        {"app_id": "4f0ba5db...", "risk_score": 0.07, "risk_level": "low", "denial_rate": 0}
    ]
}
```

### Critério de Sucesso ✅

> "Mostrar onde o sistema está sob tensão, antes que vire incidente."

- [x] Dashboard com overview completo
- [x] Ranking de apps por risco
- [x] Ranking de policies por acionamento
- [x] Hotspots de divergência
- [x] Detecção automática de tensões
- [x] Inteligência específica por app
- [x] Zero decisões novas (apenas leitura)
- [x] Zero ajustes automáticos

---

### Pilar 1: Decision Timeline (Linha do Tempo)

**Objetivo**: Para qualquer decisão, mostrar exatamente o que aconteceu.

**Modelo**:
```go
// backend/internal/explainability/model.go

type DecisionTimeline struct {
    ID              uuid.UUID   `json:"id"`
    DecisionID      uuid.UUID   `json:"decision_id"`      // Referência à decisão original
    DecisionType    string      `json:"decision_type"`    // agent_decision, policy_eval, approval
    
    // Snapshot do momento
    Timestamp       time.Time   `json:"timestamp"`
    AppID           uuid.UUID   `json:"app_id"`
    ActorID         uuid.UUID   `json:"actor_id"`
    ActorType       string      `json:"actor_type"`       // user, agent, system
    
    // O que foi avaliado
    Resource        string      `json:"resource"`
    Action          string      `json:"action"`
    Context         JSONMap     `json:"context"`          // Dados no momento
    
    // Risk no momento
    RiskScore       float64     `json:"risk_score"`
    RiskLevel       string      `json:"risk_level"`
    RiskFactors     []RiskFactorSnapshot `json:"risk_factors"`
    
    // Policy que avaliou
    PolicyID        *uuid.UUID  `json:"policy_id,omitempty"`
    PolicyName      string      `json:"policy_name"`
    PolicyResult    string      `json:"policy_result"`    // allowed, denied, pending
    PolicyReason    string      `json:"policy_reason"`
    
    // Threshold que aconselhou
    ThresholdID     *uuid.UUID  `json:"threshold_id,omitempty"`
    ThresholdAction string      `json:"threshold_action"` // allow, require_approval, shadow, block
    ThresholdReason string      `json:"threshold_reason"`
    
    // Resultado final
    FinalOutcome    string      `json:"final_outcome"`
    
    // Divergência (policy ≠ threshold)
    HasDivergence   bool        `json:"has_divergence"`
    DivergenceNote  string      `json:"divergence_note,omitempty"`
}

type RiskFactorSnapshot struct {
    Name      string  `json:"name"`
    Value     float64 `json:"value"`
    Weight    float64 `json:"weight"`
    Exceeded  bool    `json:"exceeded"`
}
```

**Endpoints**:
```
GET /api/v1/timeline/decision/:decisionId     - Timeline de uma decisão
GET /api/v1/timeline/app/:appId               - Timeline de um app (últimas N)
GET /api/v1/timeline/divergences              - Decisões com divergência policy/threshold
GET /api/v1/timeline/search                   - Busca por critérios
```

**Valor**:
- Auditoria completa
- Replay de decisões
- Identificação de padrões

---

### Pilar 2: Admin Intelligence (Inteligência para Humanos)

**Objetivo**: O admin vê o que importa, não dados brutos.

**Modelo**:
```go
// backend/internal/admin/intelligence.go

type AdminDashboard struct {
    // Visão geral
    TotalApps           int     `json:"total_apps"`
    AppsAtRisk          int     `json:"apps_at_risk"`          // risk >= 0.6
    AppsRising          int     `json:"apps_rising"`           // tendência subindo
    
    // Alertas ativos
    Alerts              []AdminAlert `json:"alerts"`
    
    // Top insights
    TopRiskyApps        []AppRiskSummary `json:"top_risky_apps"`
    MostTriggeredPolicies []PolicyTriggerSummary `json:"most_triggered_policies"`
    IgnoredThresholds   []ThresholdIgnoreSummary `json:"ignored_thresholds"`
    ControversialDecisions []ControversialDecision `json:"controversial_decisions"`
}

type AdminAlert struct {
    ID          uuid.UUID   `json:"id"`
    Type        string      `json:"type"`         // risk_spike, policy_overload, threshold_ignored
    Severity    string      `json:"severity"`     // info, warning, critical
    Title       string      `json:"title"`
    Description string      `json:"description"`
    AppID       *uuid.UUID  `json:"app_id,omitempty"`
    PolicyID    *uuid.UUID  `json:"policy_id,omitempty"`
    CreatedAt   time.Time   `json:"created_at"`
    AckedAt     *time.Time  `json:"acked_at,omitempty"`
    AckedBy     *uuid.UUID  `json:"acked_by,omitempty"`
}

type AppRiskSummary struct {
    AppID       uuid.UUID   `json:"app_id"`
    AppName     string      `json:"app_name"`
    RiskScore   float64     `json:"risk_score"`
    RiskLevel   string      `json:"risk_level"`
    Trend       string      `json:"trend"`        // rising, stable, falling
    TopFactor   string      `json:"top_factor"`   // Fator que mais contribui
}

type PolicyTriggerSummary struct {
    PolicyID    uuid.UUID   `json:"policy_id"`
    PolicyName  string      `json:"policy_name"`
    TriggerCount int        `json:"trigger_count"`
    DenyCount   int         `json:"deny_count"`
    ApprovalCount int       `json:"approval_count"`
    Period      string      `json:"period"`       // last_24h, last_7d
}

type ThresholdIgnoreSummary struct {
    ThresholdID uuid.UUID   `json:"threshold_id"`
    PolicyName  string      `json:"policy_name"`
    RiskLevel   string      `json:"risk_level"`
    Recommended string      `json:"recommended"`  // O que threshold recomendou
    Actual      string      `json:"actual"`       // O que policy decidiu
    IgnoreCount int         `json:"ignore_count"` // Quantas vezes foi ignorado
}

type ControversialDecision struct {
    DecisionID      uuid.UUID   `json:"decision_id"`
    AppID           uuid.UUID   `json:"app_id"`
    PolicyDecision  string      `json:"policy_decision"`
    ThresholdAdvice string      `json:"threshold_advice"`
    Timestamp       time.Time   `json:"timestamp"`
    Explanation     string      `json:"explanation"`
}
```

**Endpoints**:
```
GET /api/v1/admin/dashboard                   - Dashboard completo
GET /api/v1/admin/alerts                      - Alertas ativos
POST /api/v1/admin/alerts/:id/ack             - Reconhecer alerta
GET /api/v1/admin/apps/risky                  - Apps com risco elevado
GET /api/v1/admin/policies/hot                - Policies mais acionadas
GET /api/v1/admin/thresholds/ignored          - Thresholds frequentemente ignorados
GET /api/v1/admin/decisions/controversial     - Decisões com divergência
```

**Valor**:
- Governança ativa, não passiva
- Identificação proativa de problemas
- Base para decisões humanas

---

### Pilar 3: Explainability de Negócio

**Objetivo**: Explicação que um executivo, jurídico ou board entende.

**Modelo**:
```go
// backend/internal/explainability/business.go

type BusinessExplanation struct {
    // Identificação
    DecisionID      uuid.UUID   `json:"decision_id"`
    AppID           uuid.UUID   `json:"app_id"`
    AppName         string      `json:"app_name"`
    Timestamp       time.Time   `json:"timestamp"`
    
    // Resultado em linguagem humana
    Outcome         string      `json:"outcome"`          // "Bloqueado", "Aprovado", "Pendente"
    
    // As 3 perguntas fundamentais
    WhyThisOutcome  string      `json:"why_this_outcome"` // "Este app foi bloqueado porque..."
    WhatInfluenced  []Influence `json:"what_influenced"`  // Fatores que influenciaram
    WhatWouldChange string      `json:"what_would_change"`// "Se o comportamento mudar X%, então Y"
    
    // Contexto de negócio
    RiskSummary     string      `json:"risk_summary"`     // "Risco MÉDIO (54%) - atenção recomendada"
    TrustLevel      string      `json:"trust_level"`      // "Confiança BAIXA - histórico recente negativo"
    
    // Recomendação para humano
    Recommendation  string      `json:"recommendation"`   // "Revisar manualmente antes de aprovar"
}

type Influence struct {
    Factor      string  `json:"factor"`       // "Taxa de rejeição"
    Impact      string  `json:"impact"`       // "alto", "médio", "baixo"
    Description string  `json:"description"`  // "50% das decisões foram rejeitadas nos últimos 7 dias"
    Contribution float64 `json:"contribution"` // 0.3 (30% do score)
}

// Templates de explicação (não LLM - templates estruturados)
var ExplanationTemplates = map[string]string{
    "blocked_high_risk": "Este app foi bloqueado porque seu score de risco (%0.f%%) excede o limite permitido (%0.f%%). Principal fator: %s.",
    "blocked_policy": "Esta ação foi bloqueada pela política '%s'. Motivo: %s.",
    "approved_low_risk": "Aprovado automaticamente. Score de risco baixo (%0.f%%) e histórico positivo.",
    "pending_medium_risk": "Requer aprovação humana. Score de risco médio (%0.f%%) - recomenda-se revisão.",
    "divergence_note": "Nota: A política decidiu '%s', mas o threshold recomendava '%s'. Diferença baseada em: %s.",
}
```

**Endpoints**:
```
GET /api/v1/explain/:decisionId               - Explicação completa de uma decisão
GET /api/v1/explain/app/:appId/summary        - Resumo executivo de um app
GET /api/v1/explain/app/:appId/trust          - Nível de confiança do app
POST /api/v1/explain/simulate                 - "O que aconteceria se..."
```

**Valor**:
- Linguagem de Founder, jurídico e board
- Defensável em auditoria
- Base para comunicação com stakeholders

---

## Estrutura de Arquivos

```
backend/internal/
├── explainability/
│   ├── model.go              # DecisionTimeline, BusinessExplanation
│   ├── service.go            # GetTimeline, Explain, Simulate
│   ├── templates.go          # Templates de explicação
│   └── handler.go            # Endpoints /explain, /timeline
│
├── admin/
│   ├── intelligence.go       # AdminDashboard, Alerts, Summaries
│   ├── intelligence_service.go # GetDashboard, GetAlerts, etc.
│   └── (existente)
│
└── (existentes)
```

---

## Ordem de Implementação

### Step 1: Decision Timeline
1. Criar `explainability/model.go` com DecisionTimeline
2. Criar `explainability/service.go` com RecordTimeline()
3. Integrar gravação em PolicyService.Evaluate()
4. Endpoints de consulta
5. **Validação**: Conseguir ver timeline de qualquer decisão

### Step 2: Admin Intelligence
1. Criar `admin/intelligence.go` com modelos
2. Criar `admin/intelligence_service.go` com agregações
3. Implementar alertas automáticos (sem ação, só notificação)
4. Endpoints de dashboard
5. **Validação**: Admin vê apps em risco e policies quentes

### Step 3: Business Explainability
1. Criar `explainability/business.go` com templates
2. Criar `explainability/templates.go` com geração de texto
3. Implementar as 3 perguntas fundamentais
4. Endpoint de simulação ("what if")
5. **Validação**: Explicação legível por não-técnico

---

## Critérios de Sucesso

| Critério | Descrição |
|----------|-----------|
| ✅ Timeline completa | Qualquer decisão tem histórico acessível |
| ✅ Dashboard funcional | Admin vê riscos, policies, divergências |
| ✅ Alertas ativos | Sistema notifica (não age) sobre anomalias |
| ✅ Explicação executiva | Texto legível por jurídico/board |
| ✅ Simulação | "O que aconteceria se..." funciona |
| ✅ Zero LLM | Tudo baseado em templates + dados |

---

## O que NÃO fazer na Fase 18

❌ Plugar LLM para gerar explicações
❌ Criar ações automáticas baseadas em alertas
❌ Ajustar thresholds automaticamente
❌ Qualquer forma de autonomia do sistema
❌ Dashboards bonitos sem substância

---

## Perguntas que a Fase 18 Responde

Para um **Founder**:
> "Por que esse app está sendo bloqueado?"

Para um **Investidor**:
> "Como vocês garantem que o sistema é auditável?"

Para um **Cliente Enterprise**:
> "Posso ver o histórico de todas as decisões?"

Para um **Auditor**:
> "Onde está a trilha de auditoria?"

Para um **Jurídico**:
> "Como explico isso para um juiz?"

---

## Conexão com Fases Anteriores

| Fase | O que fornece para Fase 18 |
|------|---------------------------|
| 12 - Audit Trail | Eventos para timeline |
| 15 - Agent Governance | Decisões de agentes |
| 16 - Context Propagation | app_id, session_id, actor |
| 17 - Risk + Thresholds | Scores e recomendações |

---

## Visão de Produto

Após a Fase 18, o PROST-QS será:

> "Um kernel de governança que não apenas decide, mas **explica cada decisão** em linguagem que humanos entendem, com **trilha de auditoria completa** e **inteligência para administradores** tomarem decisões informadas."

Isso é:
- Defensável em pitch
- Defensável em due diligence
- Defensável em auditoria
- Defensável em tribunal

---

**Data**: 2025-12-29
**Autor**: Tech Lead (via ChatGPT)
**Executor**: Kiro
**Decisão**: Founder → Confiança antes de automação
