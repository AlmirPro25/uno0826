# PROST-QS - MAPA COMPLETO DO SISTEMA

## DOCUMENTO PARA TECH LEAD (ChatGPT)

> Este documento descreve o sistema PROST-QS (Sovereign Kernel) em sua totalidade.
> Use-o para entender a arquitetura, capacidades e estado atual do projeto.

---

## 1. O QUE É O PROST-QS

### Definição
PROST-QS é um **Kernel Soberano** para governança de agentes de IA e operações críticas.
Não é um chatbot. Não é uma API comum. É uma **infraestrutura de decisão institucional**.

### Problema que Resolve
Sistemas com agentes de IA enfrentam um problema crítico:
- Agentes podem agir sem supervisão
- Decisões acontecem sem rastreabilidade
- Não existe "botão de emergência" real
- Histórico de decisões se perde
- Ninguém sabe quem autorizou o quê

### Solução
O PROST-QS garante que:
- **Nenhuma ação sensível acontece sem humano identificável**
- **Toda decisão tem ciclo de vida explícito**
- **Conflitos bloqueiam execução até resolução humana**
- **O sistema pode ser parado instantaneamente (Kill Switch)**
- **Memória institucional preserva contexto sem criar autoridade automática**

---

## 2. ARQUITETURA GERAL

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTENDS                                    │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│   User App      │   Admin Panel   │   Dev Portal                    │
│   (port 3000)   │   (port 3001)   │   (port 3002)                   │
└────────┬────────┴────────┬────────┴────────┬────────────────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Go/Gin)                                │
│                      Port 8080                                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Identity   │  │   Billing   │  │    Ads      │  │   Agent     │ │
│  │   Kernel    │  │   Kernel    │  │   Module    │  │ Governance  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                    GOVERNANCE LAYER (Fases 11-14)                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Policy  │ │  Audit  │ │  Kill   │ │Autonomy │ │ Shadow  │       │
│  │ Engine  │ │   Log   │ │ Switch  │ │ Matrix  │ │  Mode   │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                               │
│  │Authority│ │Approval │ │ Memory  │                               │
│  │ Engine  │ │Workflow │ │Institut.│                               │
│  └─────────┘ └─────────┘ └─────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (SQLite)                               │
│                      ./data/prostqs.db                               │
└─────────────────────────────────────────────────────────────────────┘
```


---

## 3. STACK TECNOLÓGICO

### Backend
| Componente | Tecnologia | Descrição |
|------------|------------|-----------|
| Linguagem | Go 1.21+ | Performance e tipagem forte |
| Framework | Gin | HTTP router rápido |
| ORM | GORM | Mapeamento objeto-relacional |
| Database | SQLite (WAL mode) | Persistência local |
| Auth | JWT + AES-256 | Tokens seguros |
| Jobs | Fila interna | Processamento assíncrono |

### Frontend
| Componente | Tecnologia | Descrição |
|------------|------------|-----------|
| Framework | Vanilla JS | Sem dependências pesadas |
| Styling | Tailwind CSS | Utility-first CSS |
| Build | Nenhum | Arquivos estáticos |

### SDK
| Componente | Tecnologia | Descrição |
|------------|------------|-----------|
| Linguagem | JavaScript | Universal |
| Tipos | TypeScript (d.ts) | Autocomplete |
| Módulos | ESM | Import/export moderno |

---

## 4. MÓDULOS DO SISTEMA

### 4.1 IDENTITY KERNEL (Fase 10)
**Propósito**: Identidade soberana do usuário

```
internal/identity/
├── sovereign_model.go    # SovereignIdentity, IdentityLink
├── user_model.go         # User, UserProfile
├── user_service.go       # Gestão de usuários
├── verification_service.go # Verificação de identidade
├── auth_handler.go       # Login/registro
└── events.go             # Eventos de identidade
```

**Entidades**:
- `SovereignIdentity` - Identidade única do usuário
- `IdentityLink` - Conexões entre identidades
- `UserProfile` - Perfil público
- `AuthMethod` - Métodos de autenticação
- `PendingVerification` - Verificações pendentes
- `SovereignSession` - Sessões ativas

**Capacidades**:
- Registro com verificação de email/telefone
- Login federado (Google OAuth)
- Gestão de sessões
- Rate limiting por identidade
- Suspensão/banimento de contas

---

### 4.2 BILLING KERNEL (Fase Econômica)
**Propósito**: Gestão financeira completa

```
internal/billing/
├── model.go              # BillingAccount, Subscription, Ledger
├── service.go            # Lógica de billing
├── governed_service.go   # Billing com governança
├── stripe_service.go     # Integração Stripe
├── handler.go            # Endpoints HTTP
└── events.go             # Eventos financeiros
```

**Entidades**:
- `BillingAccount` - Conta financeira do usuário
- `PaymentIntent` - Intenções de pagamento
- `Subscription` - Assinaturas recorrentes
- `LedgerEntry` - Registro contábil imutável
- `Payout` - Pagamentos para usuários
- `ProcessedWebhook` - Webhooks processados (idempotência)

**Capacidades**:
- Integração Stripe completa
- Ledger contábil imutável
- Máquina de estados para pagamentos
- Máquina de estados para assinaturas
- Reconciliação automática
- Webhooks idempotentes

---

### 4.3 ADS MODULE (Extensão Econômica)
**Propósito**: Sistema de anúncios com governança

```
internal/ads/
├── model.go              # AdAccount, AdCampaign, AdBudget
├── service.go            # Lógica de ads
├── handler.go            # Endpoints HTTP
```

**Entidades**:
- `AdAccount` - Conta de anunciante
- `AdBudget` - Orçamento com limites
- `AdCampaign` - Campanhas publicitárias
- `AdSpendEvent` - Eventos de gasto
- `AdGovernanceLimit` - Limites de governança

**Capacidades**:
- Criação de campanhas
- Controle de budget
- Máquina de estados para campanhas
- Limites de governança por conta
- Integração com billing

---

### 4.4 AGENT GOVERNANCE LAYER (Fases 11-14)
**Propósito**: Governança completa de agentes de IA

```
internal/agent/
├── model.go              # Agent, AgentPolicy, AgentDecision
├── service.go            # Lógica de agentes
├── governed_service.go   # Agentes com governança completa
├── policy.go             # Políticas internas
├── handler.go            # Endpoints HTTP
```

**Entidades**:
- `Agent` - Agente de IA registrado
- `AgentPolicy` - Política do agente
- `AgentDecision` - Decisão proposta
- `AgentExecutionLog` - Log de execuções
- `AgentDailyStats` - Estatísticas diárias

**Capacidades**:
- Registro de agentes
- Proposição de decisões
- Aprovação/rejeição humana
- Execução governada
- Estatísticas e limites


---

## 5. CAMADA DE GOVERNANÇA (O DIFERENCIAL)

### 5.1 POLICY ENGINE (Fase 11)
**Propósito**: Avaliação de políticas antes de qualquer ação

```
internal/policy/
├── model.go              # Policy, PolicyEvaluation
├── service.go            # Motor de avaliação
├── handler.go            # Endpoints HTTP
```

**Como funciona**:
```
Ação solicitada → Policy Engine avalia → Allowed/Denied + Reason
```

**Tipos de política**:
- `allow` - Permite ação
- `deny` - Bloqueia ação
- `require_approval` - Exige aprovação humana

---

### 5.2 AUDIT LOG (Fase 11)
**Propósito**: Registro imutável de todas as ações

```
internal/audit/
├── model.go              # AuditEvent
├── service.go            # Registro de eventos
├── handler.go            # Consulta de logs
```

**O que registra**:
- Quem fez (actor_id, actor_type)
- O que fez (event_type, action)
- Quando fez (timestamp)
- De onde fez (IP, UserAgent)
- Estado antes/depois (before_state, after_state)
- Hash de integridade

---

### 5.3 KILL SWITCH (Fase 11)
**Propósito**: Parada de emergência instantânea

```
internal/killswitch/
├── model.go              # KillSwitch
├── service.go            # Ativação/verificação
├── handler.go            # Endpoints HTTP
```

**Escopos**:
- `global` - Para tudo
- `billing` - Para operações financeiras
- `agents` - Para agentes de IA
- `ads` - Para sistema de anúncios

**Características**:
- Ativação instantânea
- Expiração automática opcional
- Justificativa obrigatória
- Apenas super_admin pode ativar

---

### 5.4 AUTONOMY MATRIX (Fase 12)
**Propósito**: Define o que cada agente pode fazer sozinho

```
internal/autonomy/
├── model.go              # AutonomyProfile, AutonomyLevel
├── service.go            # Verificação de autonomia
├── handler.go            # Endpoints HTTP
```

**Níveis de autonomia**:
- `full` - Pode executar sozinho
- `supervised` - Precisa de aprovação
- `shadow_only` - Apenas simula
- `forbidden` - Proibido

**Perguntas que responde**:
1. "Esse agente pode fazer isso sozinho?"
2. "Precisa de humano?"
3. "Deve apenas simular?"

---

### 5.5 SHADOW MODE (Fase 12.2)
**Propósito**: Simular ações sem executar

```
internal/shadow/
├── model.go              # ShadowExecution
├── service.go            # Simulação
├── handler.go            # Endpoints HTTP
```

**O que registra**:
- O que o agente quis fazer
- O que teria acontecido
- Por que não aconteceu
- Recomendação (safe_to_promote, needs_review, keep_shadow)

**Princípio**: "Você pode tentar, mas o mundo não muda"

---

### 5.6 AUTHORITY ENGINE (Fase 13)
**Propósito**: Resolver quem pode aprovar o quê

```
internal/authority/
├── model.go              # DecisionAuthority, ImpactLevel
├── service.go            # Resolução de autoridade
├── handler.go            # Endpoints HTTP
```

**Conceitos**:
- `DecisionAuthority` - Autoridade com escopo e limites
- `ImpactLevel` - none, low, medium, high, critical
- Auto-aprovação bloqueada por design
- Escalação automática quando necessário

**Pergunta central**: "Por que esta pessoa NÃO pode aprovar isso?"

---

### 5.7 APPROVAL WORKFLOW (Fase 13)
**Propósito**: Fluxo de aprovação humana

```
internal/approval/
├── model.go              # ApprovalRequest, ApprovalDecision
├── service.go            # Fluxo de aprovação
├── handler.go            # Endpoints HTTP
```

**Entidades**:
- `ApprovalRequest` - Solicitação imutável
- `ApprovalDecision` - Decisão como evento (nunca apagada)

**Características**:
- Justificativa obrigatória (mín. 10 caracteres)
- Rastreabilidade completa (IP, UserAgent, timestamp)
- Hash de integridade
- Integração automática com Shadow Mode

---

### 5.8 INSTITUTIONAL MEMORY (Fase 14)
**Propósito**: Memória de decisões ao longo do tempo

```
internal/memory/
├── model.go              # DecisionLifecycle, DecisionConflict, DecisionPrecedent
├── service.go            # Gestão de memória
├── handler.go            # Endpoints HTTP
```

**Entidades**:
- `DecisionLifecycle` - Ciclo de vida (active, expired, superseded, revoked, under_review)
- `DecisionConflict` - Conflitos entre decisões
- `DecisionPrecedent` - Precedentes (memória, não autoridade)
- `DecisionReview` - Revisões humanas
- `LifecycleTransition` - Log imutável de transições

**Princípios constitucionais**:
1. Toda decisão tem expiração explícita
2. Memória nunca implica permissão futura
3. Conflito = bloqueio total até resolução humana
4. Precedente informa, não decide


---

## 6. FLUXO DE UMA DECISÃO DE AGENTE

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO DE DECISÃO                         │
└─────────────────────────────────────────────────────────────────────┘

    Agente quer executar ação
              │
              ▼
    ┌─────────────────┐
    │  Kill Switch?   │──── SIM ──→ BLOQUEADO (emergência)
    └────────┬────────┘
             │ NÃO
             ▼
    ┌─────────────────┐
    │ Autonomy Check  │
    └────────┬────────┘
             │
    ┌────────┼────────┬────────────┐
    │        │        │            │
    ▼        ▼        ▼            ▼
  FULL   SUPERVISED  SHADOW    FORBIDDEN
    │        │        │            │
    │        │        ▼            ▼
    │        │   ┌─────────┐   BLOQUEADO
    │        │   │ Shadow  │
    │        │   │  Mode   │
    │        │   └────┬────┘
    │        │        │
    │        │        ▼
    │        │   Recomendação
    │        │   safe_to_promote?
    │        │        │
    │        ▼        ▼
    │   ┌─────────────────┐
    │   │ Approval Request│
    │   │    (criado)     │
    │   └────────┬────────┘
    │            │
    │            ▼
    │   ┌─────────────────┐
    │   │ Authority Engine│
    │   │ (quem aprova?)  │
    │   └────────┬────────┘
    │            │
    │            ▼
    │   ┌─────────────────┐
    │   │ Humano decide   │
    │   │ (approve/reject)│
    │   └────────┬────────┘
    │            │
    │   ┌────────┴────────┐
    │   │                 │
    │   ▼                 ▼
    │ APPROVED         REJECTED
    │   │                 │
    │   │                 ▼
    │   │            FIM (não executa)
    │   │
    └───┼───────────────────────────┐
        │                           │
        ▼                           │
    ┌─────────────────┐             │
    │ Memory Check    │             │
    │ (Fase 14)       │             │
    └────────┬────────┘             │
             │                      │
    ┌────────┴────────┐             │
    │                 │             │
    ▼                 ▼             │
  ACTIVE          NOT ACTIVE        │
    │                 │             │
    │                 ▼             │
    │            BLOQUEADO          │
    │            (expirou/revogado) │
    │                               │
    ▼                               │
    ┌─────────────────┐             │
    │ Conflict Check  │             │
    └────────┬────────┘             │
             │                      │
    ┌────────┴────────┐             │
    │                 │             │
    ▼                 ▼             │
  NO CONFLICT     CONFLICT          │
    │                 │             │
    │                 ▼             │
    │            BLOQUEADO          │
    │            (até resolução)    │
    │                               │
    ▼                               │
    ┌─────────────────┐             │
    │ Policy Engine   │             │
    └────────┬────────┘             │
             │                      │
    ┌────────┴────────┐             │
    │                 │             │
    ▼                 ▼             │
  ALLOWED          DENIED           │
    │                 │             │
    │                 ▼             │
    │            BLOQUEADO          │
    │            (política)         │
    │                               │
    ▼                               │
    ┌─────────────────┐             │
    │    EXECUTA      │◀────────────┘
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │   Audit Log     │
    │   (registra)    │
    └─────────────────┘
```

---

## 7. ENDPOINTS DA API

### Identity
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/verify
GET    /api/v1/identity/me
```

### Billing
```
POST   /api/v1/billing/accounts
GET    /api/v1/billing/accounts/:id
POST   /api/v1/billing/payment-intents
POST   /api/v1/billing/subscriptions
GET    /api/v1/billing/ledger
POST   /api/v1/billing/webhooks/stripe
```

### Ads
```
POST   /api/v1/ads/accounts
POST   /api/v1/ads/campaigns
GET    /api/v1/ads/campaigns
PUT    /api/v1/ads/campaigns/:id/status
POST   /api/v1/ads/budgets
```

### Agents
```
POST   /api/v1/agents
GET    /api/v1/agents
POST   /api/v1/agents/:id/decisions
POST   /api/v1/agents/decisions/:id/approve
POST   /api/v1/agents/decisions/:id/reject
POST   /api/v1/agents/decisions/:id/execute
```

### Governance
```
# Policy
GET    /api/v1/policies
POST   /api/v1/policies
POST   /api/v1/policies/evaluate

# Audit
GET    /api/v1/audit/events
GET    /api/v1/audit/events/:id

# Kill Switch
POST   /api/v1/killswitch/activate
POST   /api/v1/killswitch/deactivate
GET    /api/v1/killswitch/status

# Autonomy
GET    /api/v1/autonomy/profiles
POST   /api/v1/autonomy/profiles
POST   /api/v1/autonomy/check

# Shadow
GET    /api/v1/shadow/executions
POST   /api/v1/shadow/execute

# Authority
GET    /api/v1/authority
POST   /api/v1/authority
POST   /api/v1/authority/resolve

# Approval
GET    /api/v1/approvals
GET    /api/v1/approvals/pending
POST   /api/v1/approvals/:id/decide

# Memory
GET    /api/v1/memory/lifecycle/:decision_id
POST   /api/v1/memory/lifecycle
POST   /api/v1/memory/lifecycle/:id/revoke
POST   /api/v1/memory/lifecycle/:id/review
GET    /api/v1/memory/conflicts
POST   /api/v1/memory/conflicts/:id/resolve
GET    /api/v1/memory/precedents
GET    /api/v1/memory/can-execute/:decision_id
```


---

## 8. BANCO DE DADOS - TODAS AS TABELAS

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SCHEMA DO BANCO                              │
└─────────────────────────────────────────────────────────────────────┘

IDENTITY KERNEL
├── users                    # Usuários (legacy)
├── user_profiles            # Perfis de usuário
├── auth_methods             # Métodos de autenticação
├── sovereign_identities     # Identidades soberanas
├── identity_links           # Links entre identidades
├── pending_verifications    # Verificações pendentes
├── sovereign_sessions       # Sessões ativas
└── rate_limit_entries       # Rate limiting

BILLING KERNEL
├── billing_accounts         # Contas de billing
├── payment_intents          # Intenções de pagamento
├── subscriptions            # Assinaturas
├── ledger_entries           # Ledger contábil
├── payouts                  # Pagamentos
├── processed_webhooks       # Webhooks processados
└── reconciliation_logs      # Logs de reconciliação

FEDERATION
├── oauth_states             # Estados OAuth
└── federated_identities     # Identidades federadas

JOBS
├── jobs                     # Fila de jobs
└── dead_letter_jobs         # Jobs falhos

ADS MODULE
├── ad_accounts              # Contas de anunciante
├── ad_budgets               # Orçamentos
├── ad_campaigns             # Campanhas
├── ad_spend_events          # Eventos de gasto
└── ad_governance_limits     # Limites de governança

AGENT GOVERNANCE
├── agents                   # Agentes registrados
├── agent_policies           # Políticas de agentes
├── agent_decisions          # Decisões propostas
├── agent_execution_logs     # Logs de execução
└── agent_daily_stats        # Estatísticas diárias

GOVERNANCE LAYER
├── policies                 # Políticas do sistema
├── policy_evaluations       # Avaliações de política
├── audit_events             # Log de auditoria
├── kill_switches            # Kill switches ativos
├── autonomy_profiles        # Perfis de autonomia
├── shadow_executions        # Execuções shadow
├── decision_authorities     # Autoridades de decisão
├── approval_requests        # Solicitações de aprovação
├── approval_decisions       # Decisões de aprovação
├── decision_lifecycles      # Ciclos de vida
├── decision_conflicts       # Conflitos
├── decision_precedents      # Precedentes
├── decision_reviews         # Revisões
└── lifecycle_transitions    # Transições de estado

OUTROS
├── events                   # Eventos do sistema
├── payments                 # Pagamentos (legacy)
├── ai_schema_versions       # Versões de schema IA
├── replication_states       # Estados de replicação
└── ads                      # Anúncios (legacy)
```

---

## 9. ESTRUTURA DE PASTAS

```
meu-projeto-ia/
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go              # Entry point
│   ├── internal/
│   │   ├── ad/                      # Ads legacy
│   │   ├── admin/                   # Admin supremo
│   │   ├── ads/                     # Módulo de ads
│   │   ├── agent/                   # Governança de agentes
│   │   ├── ai/                      # Serviços de IA
│   │   ├── approval/                # Workflow de aprovação
│   │   ├── audit/                   # Log de auditoria
│   │   ├── auth/                    # Autenticação legacy
│   │   ├── authority/               # Motor de autoridade
│   │   ├── autonomy/                # Matriz de autonomia
│   │   ├── billing/                 # Kernel econômico
│   │   ├── command/                 # Comandos
│   │   ├── event/                   # Eventos
│   │   ├── federation/              # OAuth federado
│   │   ├── identity/                # Kernel de identidade
│   │   ├── jobs/                    # Fila de jobs
│   │   ├── killswitch/              # Kill switch
│   │   ├── memory/                  # Memória institucional
│   │   ├── payment/                 # Pagamentos legacy
│   │   ├── policy/                  # Motor de políticas
│   │   ├── replication/             # Replicação
│   │   └── shadow/                  # Shadow mode
│   ├── pkg/
│   │   ├── db/                      # Conexão com banco
│   │   ├── middleware/              # Middlewares HTTP
│   │   ├── resilience/              # Circuit breaker, retry
│   │   ├── statemachine/            # Máquinas de estado
│   │   └── utils/                   # Utilitários (JWT, AES)
│   ├── data/
│   │   └── prostqs.db               # Banco SQLite
│   ├── go.mod
│   ├── go.sum
│   └── Dockerfile
├── frontend/
│   ├── user-app/                    # App do usuário
│   ├── admin/                       # Painel admin
│   └── dev-portal/                  # Portal do desenvolvedor
├── sdk/
│   ├── src/
│   │   ├── index.js                 # Entry point
│   │   ├── client.js                # HTTP client
│   │   ├── auth.js                  # Módulo auth
│   │   ├── identity.js              # Módulo identity
│   │   ├── billing.js               # Módulo billing
│   │   ├── ads.js                   # Módulo ads
│   │   └── agents.js                # Módulo agents
│   ├── examples/
│   ├── package.json
│   └── README.md
├── .env                             # Variáveis de ambiente
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## 10. VARIÁVEIS DE AMBIENTE

```env
# Server
SERVER_PORT=8080

# Security
JWT_SECRET=<32+ caracteres>
AES_SECRET_KEY=<exatamente 32 caracteres>

# Database
SQLITE_DB_PATH=./data/prostqs.db

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=http://localhost:8080/api/v1/federation/google/callback
```


---

## 11. FASES DE DESENVOLVIMENTO (HISTÓRICO)

| Fase | Nome | Status | Descrição |
|------|------|--------|-----------|
| 9 | Kernel Base | ✅ | Estrutura inicial, Identity, Billing |
| 10 | Identidade Soberana | ✅ | Verificação, sessões, rate limiting |
| 11 | Governança Base | ✅ | Policy Engine, Audit Log, Kill Switch |
| 12 | Autonomia | ✅ | Matriz de autonomia, Shadow Mode |
| 13 | Decisão Assistida | ✅ | Authority Engine, Approval Workflow |
| 14 | Memória Institucional | ✅ | Lifecycle, Conflicts, Precedents |

---

## 12. PRINCÍPIOS CONSTITUCIONAIS DO SISTEMA

### Sobre Decisões
1. **Nenhuma ação sensível sem humano identificável**
2. **Toda decisão tem ciclo de vida explícito**
3. **Decisão expirada não autoriza execução**
4. **Revogação é irreversível**

### Sobre Conflitos
1. **Conflito = bloqueio total**
2. **Sistema não escolhe lados**
3. **Resolução é sempre humana**
4. **Conflito não expira sozinho**

### Sobre Memória
1. **Memória informa, não decide**
2. **Precedente não autoriza**
3. **Frequência não legitima**
4. **Similaridade não decide**

### Sobre Emergência
1. **Kill Switch para tudo instantaneamente**
2. **Justificativa obrigatória**
3. **Apenas super_admin ativa**
4. **Expiração automática opcional**

---

## 13. O QUE O SISTEMA GARANTE

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GARANTIAS INSTITUCIONAIS                          │
└─────────────────────────────────────────────────────────────────────┘

✅ Toda ação sensível tem um humano que disse "sim"
✅ Toda decisão tem validade temporal explícita
✅ Conflitos bloqueiam execução até resolução humana
✅ O sistema pode ser parado instantaneamente
✅ Histórico é imutável e auditável
✅ Agentes não podem agir além de sua autonomia
✅ Simulações não afetam o mundo real
✅ Precedentes informam mas não autorizam
✅ Autoridade não se herda do passado
✅ Memória não cria poder novo
```

---

## 14. COMO RODAR O SISTEMA

### Backend
```bash
cd meu-projeto-ia/backend
go build -o kernel.exe ./cmd/api/main.go
.\kernel.exe
# Rodando em http://localhost:8080
```

### Frontend (User App)
```bash
cd meu-projeto-ia/frontend/user-app
# Servir com qualquer servidor HTTP estático
npx serve -p 3000
```

### Frontend (Admin)
```bash
cd meu-projeto-ia/frontend/admin
npx serve -p 3001
```

---

## 15. PRÓXIMOS PASSOS POSSÍVEIS

### Opção A - Fase 15 (Observabilidade)
- Dashboard de decisões
- Métricas de governança
- Alertas de conflitos
- Visualização de lifecycle

### Opção B - Consolidação
- Documentar invariantes
- Congelar APIs
- Escrever constituição técnica
- Testes de regressão

### Opção C - Uso Real
- Aplicar para decisões reais
- Governar agentes de produção
- Forçar revisões em operações críticas

---

## 16. RESUMO EXECUTIVO

**PROST-QS é um Kernel Soberano que:**

1. **Governa agentes de IA** com matriz de autonomia
2. **Simula antes de executar** com Shadow Mode
3. **Exige aprovação humana** para ações sensíveis
4. **Resolve autoridade** automaticamente
5. **Bloqueia conflitos** até resolução humana
6. **Mantém memória** sem criar autoridade automática
7. **Para tudo** instantaneamente com Kill Switch
8. **Registra tudo** em audit log imutável

**Diferencial**: O sistema não tenta ser inteligente. Ele garante que decisões são humanas, rastreáveis e temporalmente válidas.

---

*Documento gerado em 28/12/2025*
*Sistema: PROST-QS Sovereign Kernel*
*Versão: Fase 14 Completa*
