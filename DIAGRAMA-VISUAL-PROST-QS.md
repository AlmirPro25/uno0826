# PROST-QS - DIAGRAMA VISUAL

## VISÃO GERAL DA ARQUITETURA

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              PROST-QS SOVEREIGN KERNEL                         ║
║                     "Governança Institucional para Agentes de IA"              ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  FRONTENDS                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │    User App     │  │   Admin Panel   │  │   Dev Portal    │                  │
│  │   :3000         │  │   :3001         │  │   :3002         │                  │
│  │                 │  │                 │  │                 │                  │
│  │  • Login        │  │  • Kill Switch  │  │  • API Docs     │                  │
│  │  • Dashboard    │  │  • Approvals    │  │  • SDK Guide    │                  │
│  │  • Profile      │  │  • Audit Logs   │  │  • Examples     │                  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                    │                           │
│           └────────────────────┼────────────────────┘                           │
│                                │                                                │
│                                ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         SDK JavaScript                                   │   │
│  │  auth.js │ identity.js │ billing.js │ ads.js │ agents.js                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ HTTP/REST
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (Go/Gin) :8080                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         MIDDLEWARE LAYER                                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │   │
│  │  │   CORS   │  │   Auth   │  │  Rate    │  │  Admin   │                 │   │
│  │  │          │  │   JWT    │  │  Limit   │  │  Only    │                 │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         BUSINESS KERNELS                                 │   │
│  │                                                                          │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │   │
│  │  │  IDENTITY KERNEL │  │  BILLING KERNEL  │  │   ADS MODULE     │       │   │
│  │  │                  │  │                  │  │                  │       │   │
│  │  │  • Sovereign ID  │  │  • Accounts      │  │  • Campaigns     │       │   │
│  │  │  • Verification  │  │  • Subscriptions │  │  • Budgets       │       │   │
│  │  │  • Sessions      │  │  • Ledger        │  │  • Spend Events  │       │   │
│  │  │  • Federation    │  │  • Stripe        │  │  • Limits        │       │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘       │   │
│  │                                                                          │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    AGENT GOVERNANCE LAYER                         │   │   │
│  │  │                                                                   │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │   │   │
│  │  │  │   Agents    │  │  Decisions  │  │  Execution  │               │   │   │
│  │  │  │  Registry   │  │  Proposals  │  │    Logs     │               │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘               │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    GOVERNANCE LAYER (Fases 11-14)                        │   │
│  │  ╔═══════════════════════════════════════════════════════════════════╗  │   │
│  │  ║                    CAMADA DE CONTROLE                              ║  │   │
│  │  ║  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                ║  │   │
│  │  ║  │   POLICY    │  │   AUDIT     │  │    KILL     │                ║  │   │
│  │  ║  │   ENGINE    │  │    LOG      │  │   SWITCH    │                ║  │   │
│  │  ║  │             │  │             │  │             │                ║  │   │
│  │  ║  │ allow/deny  │  │  imutável   │  │  emergência │                ║  │   │
│  │  ║  └─────────────┘  └─────────────┘  └─────────────┘                ║  │   │
│  │  ╚═══════════════════════════════════════════════════════════════════╝  │   │
│  │  ╔═══════════════════════════════════════════════════════════════════╗  │   │
│  │  ║                    CAMADA DE AUTONOMIA                             ║  │   │
│  │  ║  ┌─────────────┐  ┌─────────────┐                                 ║  │   │
│  │  ║  │  AUTONOMY   │  │   SHADOW    │                                 ║  │   │
│  │  ║  │   MATRIX    │  │    MODE     │                                 ║  │   │
│  │  ║  │             │  │             │                                 ║  │   │
│  │  ║  │ full/super/ │  │  simula sem │                                 ║  │   │
│  │  ║  │ shadow/forb │  │  executar   │                                 ║  │   │
│  │  ║  └─────────────┘  └─────────────┘                                 ║  │   │
│  │  ╚═══════════════════════════════════════════════════════════════════╝  │   │
│  │  ╔═══════════════════════════════════════════════════════════════════╗  │   │
│  │  ║                    CAMADA DE DECISÃO HUMANA                        ║  │   │
│  │  ║  ┌─────────────┐  ┌─────────────┐                                 ║  │   │
│  │  ║  │  AUTHORITY  │  │  APPROVAL   │                                 ║  │   │
│  │  ║  │   ENGINE    │  │  WORKFLOW   │                                 ║  │   │
│  │  ║  │             │  │             │                                 ║  │   │
│  │  ║  │ quem aprova │  │  request →  │                                 ║  │   │
│  │  ║  │ o quê       │  │  decision   │                                 ║  │   │
│  │  ║  └─────────────┘  └─────────────┘                                 ║  │   │
│  │  ╚═══════════════════════════════════════════════════════════════════╝  │   │
│  │  ╔═══════════════════════════════════════════════════════════════════╗  │   │
│  │  ║                    CAMADA DE MEMÓRIA                               ║  │   │
│  │  ║  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                ║  │   │
│  │  ║  │  LIFECYCLE  │  │  CONFLICT   │  │  PRECEDENT  │                ║  │   │
│  │  ║  │             │  │             │  │             │                ║  │   │
│  │  ║  │ active/exp/ │  │  bloqueia   │  │  memória,   │                ║  │   │
│  │  ║  │ revoked/... │  │  execução   │  │ não ordem   │                ║  │   │
│  │  ║  └─────────────┘  └─────────────┘  └─────────────┘                ║  │   │
│  │  ╚═══════════════════════════════════════════════════════════════════╝  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         INFRASTRUCTURE                                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │   │
│  │  │   Jobs   │  │  State   │  │ Circuit  │  │  Retry   │                 │   │
│  │  │  Queue   │  │ Machines │  │ Breaker  │  │  Logic   │                 │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ GORM
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE (SQLite WAL)                               │
│                              ./data/prostqs.db                                   │
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Identity   │  │   Billing   │  │    Ads      │  │   Agents    │            │
│  │   Tables    │  │   Tables    │  │   Tables    │  │   Tables    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Governance │  │   Audit     │  │   Memory    │  │    Jobs     │            │
│  │   Tables    │  │   Tables    │  │   Tables    │  │   Tables    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────────────────────┘
```


---

## FLUXO DE DECISÃO DE AGENTE

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         FLUXO DE DECISÃO DE AGENTE                             ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                              ┌─────────────────┐
                              │  AGENTE QUER    │
                              │  EXECUTAR AÇÃO  │
                              └────────┬────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────┐
                    │         KILL SWITCH ATIVO?       │
                    └──────────────────┬───────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │                           │
                        SIM                         NÃO
                         │                           │
                         ▼                           ▼
                   ╔═══════════╗         ┌──────────────────────┐
                   ║ BLOQUEADO ║         │   AUTONOMY CHECK     │
                   ║ emergência║         │   (matriz consulta)  │
                   ╚═══════════╝         └──────────┬───────────┘
                                                    │
                    ┌───────────────┬───────────────┼───────────────┐
                    │               │               │               │
                   FULL        SUPERVISED       SHADOW         FORBIDDEN
                    │               │               │               │
                    │               │               ▼               ▼
                    │               │      ┌─────────────┐    ╔═══════════╗
                    │               │      │   SHADOW    │    ║ BLOQUEADO ║
                    │               │      │    MODE     │    ║ proibido  ║
                    │               │      │  (simula)   │    ╚═══════════╝
                    │               │      └──────┬──────┘
                    │               │             │
                    │               │             ▼
                    │               │      ┌─────────────┐
                    │               │      │ safe_to_    │
                    │               │      │ promote?    │
                    │               │      └──────┬──────┘
                    │               │             │
                    │               ▼             ▼
                    │      ┌─────────────────────────────┐
                    │      │     APPROVAL REQUEST        │
                    │      │     (criado automaticamente)│
                    │      └──────────────┬──────────────┘
                    │                     │
                    │                     ▼
                    │      ┌─────────────────────────────┐
                    │      │     AUTHORITY ENGINE        │
                    │      │     (quem pode aprovar?)    │
                    │      └──────────────┬──────────────┘
                    │                     │
                    │                     ▼
                    │      ┌─────────────────────────────┐
                    │      │     HUMANO DECIDE           │
                    │      │     (approve/reject)        │
                    │      └──────────────┬──────────────┘
                    │                     │
                    │           ┌─────────┴─────────┐
                    │           │                   │
                    │        APPROVED            REJECTED
                    │           │                   │
                    │           │                   ▼
                    │           │            ╔═══════════╗
                    │           │            ║    FIM    ║
                    │           │            ║ não exec. ║
                    │           │            ╚═══════════╝
                    │           │
                    └───────────┼───────────────────────────┐
                                │                           │
                                ▼                           │
                    ┌─────────────────────────────┐         │
                    │     MEMORY CHECK (Fase 14)  │         │
                    │     IsDecisionActive?       │         │
                    └──────────────┬──────────────┘         │
                                   │                        │
                         ┌─────────┴─────────┐              │
                         │                   │              │
                       ACTIVE            NOT ACTIVE         │
                         │                   │              │
                         │                   ▼              │
                         │            ╔═══════════╗         │
                         │            ║ BLOQUEADO ║         │
                         │            ║ expirou/  ║         │
                         │            ║ revogado  ║         │
                         │            ╚═══════════╝         │
                         │                                  │
                         ▼                                  │
                    ┌─────────────────────────────┐         │
                    │     CONFLICT CHECK          │         │
                    │     HasOpenConflict?        │         │
                    └──────────────┬──────────────┘         │
                                   │                        │
                         ┌─────────┴─────────┐              │
                         │                   │              │
                     NO CONFLICT          CONFLICT          │
                         │                   │              │
                         │                   ▼              │
                         │            ╔═══════════╗         │
                         │            ║ BLOQUEADO ║         │
                         │            ║ até       ║         │
                         │            ║ resolução ║         │
                         │            ╚═══════════╝         │
                         │                                  │
                         ▼                                  │
                    ┌─────────────────────────────┐         │
                    │     POLICY ENGINE           │         │
                    │     (avaliação final)       │         │
                    └──────────────┬──────────────┘         │
                                   │                        │
                         ┌─────────┴─────────┐              │
                         │                   │              │
                       ALLOWED            DENIED            │
                         │                   │              │
                         │                   ▼              │
                         │            ╔═══════════╗         │
                         │            ║ BLOQUEADO ║         │
                         │            ║ política  ║         │
                         │            ╚═══════════╝         │
                         │                                  │
                         ▼                                  │
                    ╔═══════════════════════════════╗       │
                    ║         EXECUTA               ║◀──────┘
                    ╚═══════════════════════════════╝
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │        AUDIT LOG            │
                    │     (registro imutável)     │
                    └─────────────────────────────┘
```

---

## CICLO DE VIDA DE DECISÃO (Fase 14)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         DECISION LIFECYCLE                                     ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                              ┌─────────────────┐
                              │     CRIADA      │
                              │   (com expir.)  │
                              └────────┬────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────┐
                    │             ACTIVE               │
                    │   (válida, pode produzir efeitos)│
                    └──────────────────┬───────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
            ▼                          ▼                          ▼
   ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
   │    EXPIRED      │      │  UNDER_REVIEW   │      │   SUPERSEDED    │
   │  (tempo esgotou)│      │ (em reavaliação)│      │  (substituída)  │
   └────────┬────────┘      └────────┬────────┘      └─────────────────┘
            │                        │                        │
            │                        │                        │
            │               ┌────────┴────────┐               │
            │               │                 │               │
            │               ▼                 ▼               │
            │      ┌─────────────┐   ┌─────────────┐          │
            │      │   RENEWED   │   │   REVOKED   │          │
            │      │  (renovada) │   │  (revogada) │          │
            │      └──────┬──────┘   └─────────────┘          │
            │             │                 │                 │
            │             │                 │                 │
            ▼             ▼                 ▼                 ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                        ESTADOS TERMINAIS                        │
   │                                                                 │
   │   EXPIRED (sem renovação)  │  REVOKED  │  SUPERSEDED           │
   │                                                                 │
   │   → Não pode voltar a ACTIVE automaticamente                   │
   │   → Pode virar PRECEDENT (memória)                             │
   └─────────────────────────────────────────────────────────────────┘


TRANSIÇÕES PERMITIDAS:
  active → expired, under_review, superseded, revoked
  under_review → active (renovação), revoked
  expired → under_review (reanálise)

TRANSIÇÕES PROIBIDAS:
  ❌ expired → active (sem nova decisão humana)
  ❌ revoked → active (nunca)
  ❌ superseded → active (nunca)
```

---

## MAPA DE MÓDULOS

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              MAPA DE MÓDULOS                                   ║
╚═══════════════════════════════════════════════════════════════════════════════╝

backend/internal/
│
├── identity/          ◀── KERNEL DE IDENTIDADE
│   ├── sovereign_model.go     Identidade soberana
│   ├── user_service.go        Gestão de usuários
│   ├── verification_service   Verificação
│   └── auth_handler.go        Login/registro
│
├── billing/           ◀── KERNEL ECONÔMICO
│   ├── model.go               Accounts, Subscriptions, Ledger
│   ├── service.go             Lógica de billing
│   ├── governed_service.go    Com governança
│   └── stripe_service.go      Integração Stripe
│
├── ads/               ◀── MÓDULO DE ANÚNCIOS
│   ├── model.go               Campaigns, Budgets
│   └── service.go             Lógica de ads
│
├── agent/             ◀── GOVERNANÇA DE AGENTES
│   ├── model.go               Agents, Decisions
│   ├── service.go             Lógica base
│   └── governed_service.go    Com governança completa
│
├── policy/            ◀── FASE 11: MOTOR DE POLÍTICAS
│   ├── model.go               Policy, Evaluation
│   └── service.go             Avaliação allow/deny
│
├── audit/             ◀── FASE 11: LOG DE AUDITORIA
│   ├── model.go               AuditEvent
│   └── service.go             Registro imutável
│
├── killswitch/        ◀── FASE 11: PARADA DE EMERGÊNCIA
│   ├── model.go               KillSwitch
│   └── service.go             Ativação/verificação
│
├── autonomy/          ◀── FASE 12: MATRIZ DE AUTONOMIA
│   ├── model.go               AutonomyProfile
│   └── service.go             Check de autonomia
│
├── shadow/            ◀── FASE 12.2: MODO SOMBRA
│   ├── model.go               ShadowExecution
│   └── service.go             Simulação
│
├── authority/         ◀── FASE 13: MOTOR DE AUTORIDADE
│   ├── model.go               DecisionAuthority
│   └── service.go             Resolução de autoridade
│
├── approval/          ◀── FASE 13: WORKFLOW DE APROVAÇÃO
│   ├── model.go               Request, Decision
│   └── service.go             Fluxo de aprovação
│
└── memory/            ◀── FASE 14: MEMÓRIA INSTITUCIONAL
    ├── model.go               Lifecycle, Conflict, Precedent
    └── service.go             Gestão de memória
```

---

## RESUMO PARA O TECH LEAD

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         RESUMO EXECUTIVO                                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝

O QUE É:
  Kernel Soberano para governança de agentes de IA

PROBLEMA QUE RESOLVE:
  Agentes de IA agindo sem supervisão, sem rastreabilidade, sem controle

STACK:
  Backend: Go + Gin + GORM + SQLite
  Frontend: Vanilla JS + Tailwind
  SDK: JavaScript com TypeScript types

FASES IMPLEMENTADAS:
  ✅ Fase 9-10: Identity + Billing Kernels
  ✅ Fase 11: Policy Engine + Audit Log + Kill Switch
  ✅ Fase 12: Autonomy Matrix + Shadow Mode
  ✅ Fase 13: Authority Engine + Approval Workflow
  ✅ Fase 14: Institutional Memory (Lifecycle, Conflicts, Precedents)

GARANTIAS DO SISTEMA:
  • Nenhuma ação sensível sem humano identificável
  • Toda decisão tem ciclo de vida explícito
  • Conflitos bloqueiam execução
  • Kill Switch para emergências
  • Memória não cria autoridade automática

DIFERENCIAL:
  O sistema não tenta ser inteligente.
  Ele garante que decisões são humanas, rastreáveis e temporalmente válidas.

PRÓXIMOS PASSOS POSSÍVEIS:
  A) Fase 15 - Observabilidade/Dashboard
  B) Consolidação - Congelar APIs, documentar invariantes
  C) Uso Real - Aplicar em produção
```

---

*Documento gerado em 28/12/2025*
