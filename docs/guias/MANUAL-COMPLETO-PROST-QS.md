# MANUAL COMPLETO DO SISTEMA PROST-QS

## 📌 O QUE É ESTE DOCUMENTO

Este documento explica de forma completa o sistema PROST-QS: o que é, qual problema resolve, como funciona, sua arquitetura e como estudar/usar.

---

## 🎯 PARTE 1: O QUE É O PROST-QS

### Definição Simples

PROST-QS é um **Kernel Soberano** — uma infraestrutura central que governa agentes de IA e operações críticas de negócio.

**Não é:**
- Um chatbot
- Uma API comum
- Um framework opcional

**É:**
- Uma infraestrutura de decisão institucional
- Um sistema de governança para IA
- Um kernel que controla identidade, dinheiro e decisões

### Analogia

Pense no PROST-QS como o "sistema nervoso central" de uma empresa digital:
- Todo app que você criar é um "braço" que se conecta ao kernel
- O kernel controla quem pode fazer o quê
- Nenhuma decisão importante acontece sem passar pelo kernel

---

## 🔥 PARTE 2: QUAL PROBLEMA RESOLVE

### O Problema

Empresas que usam agentes de IA enfrentam riscos sérios:

| Problema | Consequência |
|----------|--------------|
| Agentes agem sem supervisão | Decisões erradas em escala |
| Sem rastreabilidade | Não sabe quem autorizou o quê |
| Sem controle de emergência | Não consegue parar quando dá errado |
| Histórico se perde | Não aprende com erros passados |
| Conflitos não são detectados | Decisões contraditórias executam |

### A Solução

O PROST-QS garante:

✅ **Nenhuma ação sensível sem humano identificável**
- Toda decisão tem um responsável

✅ **Toda decisão tem ciclo de vida explícito**
- Começa, vale por um tempo, expira

✅ **Conflitos bloqueiam execução**
- Se duas decisões conflitam, nenhuma executa até humano resolver

✅ **Kill Switch instantâneo**
- Um botão para parar tudo imediatamente

✅ **Memória institucional**
- Sistema lembra decisões passadas, mas não cria autoridade automática

---

## 🏗️ PARTE 3: ARQUITETURA DO SISTEMA

### Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTENDS                               │
│  User App │ Admin Panel │ Dev Portal                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    SDK JavaScript                            │
│  auth │ identity │ billing │ ads │ agents                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              APPS EXTERNOS (VOX-BRIDGE, etc)                 │
│  Autenticam via X-App-Key / X-App-Secret                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Go/Gin) :8080                       │
├─────────────────────────────────────────────────────────────┤
│  OBSERVABILITY:                                             │
│  • /health (liveness)                                       │
│  • /ready (readiness)                                       │
│  • /metrics/basic (contadores)                              │
│  • Request ID + Logs estruturados                           │
├─────────────────────────────────────────────────────────────┤
│  OBSERVER AGENTS (read-only):                               │
│  • /agents/suggestions                                      │
│  • /agents/status                                           │
│  • /agents/metrics                                          │
│  • Kill switch via AGENTS_ENABLED                           │
├─────────────────────────────────────────────────────────────┤
│  KERNELS:                                                   │
│  • Identity (quem é o usuário)                              │
│  • Billing (dinheiro do usuário)                            │
│  • Ads (campanhas publicitárias)                            │
│  • Application (apps externos)                              │
│  • Secrets (segredos criptografados)                        │
├─────────────────────────────────────────────────────────────┤
│  GOVERNANÇA (8 camadas):                                    │
│  • Policy Engine (regras)                                   │
│  • Audit Log (registro imutável)                            │
│  • Kill Switch (parada de emergência)                       │
│  • Autonomy Matrix (o que agente pode fazer)                │
│  • Shadow Mode (simular sem executar)                       │
│  • Authority Engine (quem aprova)                           │
│  • Approval Workflow (fluxo de aprovação)                   │
│  • Institutional Memory (memória de decisões)               │
├─────────────────────────────────────────────────────────────┤
│  ANÁLISE:                                                   │
│  • Risk Scoring (cálculo de risco)                          │
│  • Policy Thresholds (limites)                              │
│  • Decision Timeline (histórico)                            │
│  • Admin Intelligence (tensão do sistema)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (SQLite WAL)                       │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Camada | Tecnologia | Por quê |
|--------|------------|---------|
| Backend | Go 1.21+ | Performance, tipagem forte |
| Framework | Gin | HTTP router rápido |
| ORM | GORM | Mapeamento objeto-relacional |
| Database | SQLite (WAL) | Simples, confiável, local |
| Auth | JWT + AES-256 | Tokens seguros |
| Frontend | Vanilla JS | Sem dependências pesadas |
| Styling | Tailwind CSS | Utility-first CSS |
| SDK | JavaScript | Universal |

---

## 🧩 PARTE 4: OS 3 KERNELS PRINCIPAIS

### 4.1 Identity Kernel (Identidade)

**O que faz:** Gerencia quem é o usuário

**Capacidades:**
- Registro com verificação de email/telefone
- Login com OTP (código de verificação)
- Login federado (Google OAuth)
- Gestão de sessões
- Rate limiting (limite de requisições)
- Suspensão/banimento de contas

**Entidades principais:**
- `SovereignIdentity` - Identidade única do usuário
- `AuthMethod` - Métodos de autenticação
- `SovereignSession` - Sessões ativas

**Endpoints:**
```
POST /api/v1/auth/register    → Criar conta
POST /api/v1/auth/login       → Fazer login
POST /api/v1/auth/verify      → Verificar código
GET  /api/v1/identity/me      → Dados do usuário logado
```

---

### 4.2 Billing Kernel (Financeiro)

**O que faz:** Gerencia todo o dinheiro do sistema

**Capacidades:**
- Integração completa com Stripe
- Ledger contábil imutável (registro de todas as transações)
- Máquina de estados para pagamentos
- Máquina de estados para assinaturas
- Reconciliação automática
- Webhooks idempotentes (não processa duplicado)

**Entidades principais:**
- `BillingAccount` - Conta financeira do usuário
- `PaymentIntent` - Intenção de pagamento
- `Subscription` - Assinatura recorrente
- `LedgerEntry` - Registro contábil (imutável)

**Endpoints:**
```
POST /api/v1/billing/accounts         → Criar conta de billing
GET  /api/v1/billing/accounts/:id     → Ver conta
POST /api/v1/billing/payment-intents  → Criar pagamento
POST /api/v1/billing/subscriptions    → Criar assinatura
GET  /api/v1/billing/ledger           → Ver histórico financeiro
```

---

### 4.3 Ads Module (Anúncios)

**O que faz:** Sistema de campanhas publicitárias com governança

**Capacidades:**
- Criação de campanhas
- Controle de budget (orçamento)
- Máquina de estados para campanhas
- Limites de governança por conta
- Integração com billing

**Entidades principais:**
- `AdAccount` - Conta de anunciante
- `AdBudget` - Orçamento com limites
- `AdCampaign` - Campanha publicitária
- `AdSpendEvent` - Evento de gasto

**Endpoints:**
```
POST /api/v1/ads/accounts              → Criar conta de ads
POST /api/v1/ads/campaigns             → Criar campanha
GET  /api/v1/ads/campaigns             → Listar campanhas
PUT  /api/v1/ads/campaigns/:id/status  → Mudar status
POST /api/v1/ads/budgets               → Definir orçamento
```

---

## 🛡️ PARTE 5: AS 8 CAMADAS DE GOVERNANÇA

Esta é a parte mais importante do sistema — o diferencial do PROST-QS.

### 5.1 Policy Engine (Motor de Políticas)

**O que faz:** Avalia regras antes de qualquer ação

**Como funciona:**
```
Ação solicitada → Policy Engine avalia → Allowed/Denied + Motivo
```

**Tipos de política:**
- `allow` - Permite ação
- `deny` - Bloqueia ação
- `require_approval` - Exige aprovação humana

**Exemplo:**
```json
{
  "name": "Limite de gasto diário",
  "type": "deny",
  "condition": "amount > 10000",
  "reason": "Gasto acima de R$100 requer aprovação"
}
```

---

### 5.2 Audit Log (Log de Auditoria)

**O que faz:** Registra TUDO que acontece no sistema de forma imutável

**O que registra:**
- Quem fez (actor_id, actor_type)
- O que fez (event_type, action)
- Quando fez (timestamp)
- De onde fez (IP, UserAgent)
- Estado antes/depois
- Hash de integridade

**Princípio:** Nenhuma ação acontece sem registro. O log nunca é apagado.

---

### 5.3 Kill Switch (Parada de Emergência)

**O que faz:** Para o sistema instantaneamente

**Escopos:**
- `global` - Para TUDO
- `billing` - Para operações financeiras
- `agents` - Para agentes de IA
- `ads` - Para sistema de anúncios

**Características:**
- Ativação instantânea
- Expiração automática opcional
- Justificativa obrigatória
- Apenas super_admin pode ativar

**Exemplo de uso:**
```
"Detectamos fraude. Kill Switch ativado em billing por 2 horas."
```

---

### 5.4 Autonomy Matrix (Matriz de Autonomia)

**O que faz:** Define o que cada agente pode fazer sozinho

**Níveis de autonomia:**

| Nível | Significado | Exemplo |
|-------|-------------|---------|
| `full` | Pode executar sozinho | Enviar email de boas-vindas |
| `supervised` | Precisa de aprovação | Pausar campanha |
| `shadow_only` | Apenas simula | Testar nova estratégia |
| `forbidden` | Proibido | Deletar conta |

**Perguntas que responde:**
1. "Esse agente pode fazer isso sozinho?"
2. "Precisa de humano?"
3. "Deve apenas simular?"

---

### 5.5 Shadow Mode (Modo Sombra)

**O que faz:** Permite simular ações sem executar de verdade

**O que registra:**
- O que o agente quis fazer
- O que teria acontecido
- Por que não aconteceu
- Recomendação (safe_to_promote, needs_review, keep_shadow)

**Princípio:** "Você pode tentar, mas o mundo não muda"

**Exemplo:**
```
Agente: "Quero pausar campanha X"
Shadow Mode: "OK, simulei. Teria pausado. CTR cairia 15%. Recomendo: needs_review"
```

---

### 5.6 Authority Engine (Motor de Autoridade)

**O que faz:** Resolve QUEM pode aprovar O QUÊ

**Conceitos:**
- `DecisionAuthority` - Autoridade com escopo e limites
- `ImpactLevel` - none, low, medium, high, critical
- Auto-aprovação bloqueada por design
- Escalação automática quando necessário

**Pergunta central:** "Por que esta pessoa NÃO pode aprovar isso?"

**Exemplo:**
```
Decisão: Pausar campanha de R$50.000
Authority Engine: "Precisa de alguém com autoridade 'high' em 'ads'"
```

---

### 5.7 Approval Workflow (Fluxo de Aprovação)

**O que faz:** Gerencia o fluxo de aprovação humana

**Características:**
- Justificativa obrigatória (mínimo 10 caracteres)
- Rastreabilidade completa (IP, UserAgent, timestamp)
- Hash de integridade
- Integração automática com Shadow Mode

**Fluxo:**
```
Decisão proposta → Aguarda aprovação → Humano decide → Aprovada/Rejeitada
```

---

### 5.8 Institutional Memory (Memória Institucional)

**O que faz:** Lembra decisões ao longo do tempo

**Entidades:**
- `DecisionLifecycle` - Ciclo de vida da decisão
- `DecisionConflict` - Conflitos entre decisões
- `DecisionPrecedent` - Precedentes (memória, não autoridade)
- `DecisionReview` - Revisões humanas

**Estados de uma decisão:**
```
ACTIVE → EXPIRED (tempo esgotou)
       → UNDER_REVIEW (em reavaliação)
       → SUPERSEDED (substituída)
       → REVOKED (revogada)
```

**Princípios:**
1. Toda decisão tem expiração explícita
2. Memória nunca implica permissão futura
3. Conflito = bloqueio total até resolução humana
4. Precedente informa, não decide

---

## 🔄 PARTE 6: FLUXO COMPLETO DE UMA DECISÃO DE AGENTE

Este é o fluxo que toda decisão de agente percorre:

```
┌─────────────────────────────────────────┐
│     AGENTE QUER EXECUTAR AÇÃO           │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│  1. KILL SWITCH ATIVO?                  │
│     SIM → BLOQUEADO (emergência)        │
│     NÃO → continua                      │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│  2. AUTONOMY CHECK                      │
│     FULL → pode executar                │
│     SUPERVISED → precisa aprovação      │
│     SHADOW → vai para Shadow Mode       │
│     FORBIDDEN → BLOQUEADO               │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│  3. SHADOW MODE (se necessário)         │
│     Simula a ação                       │
│     Registra o que aconteceria          │
│     Recomenda: safe/review/keep_shadow  │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│  4. AUTHORITY ENGINE                    │
│     Quem pode aprovar isso?             │
│     Tem autoridade suficiente?          │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│  5. APPROVAL WORKFLOW                   │
│     Humano recebe solicitação           │
│     Humano decide: APROVAR/REJEITAR     │
│     Justificativa obrigatória           │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│  6. MEMORY CHECK                        │
│     Decisão ainda está ativa?           │
│     Não expirou?                        │
│     Não foi revogada?                   │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│  7. CONFLICT CHECK                      │
│     Há conflito com outra decisão?      │
│     SIM → BLOQUEADO até resolver        │
│     NÃO → continua                      │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│  8. POLICY ENGINE                       │
│     Política permite?                   │
│     SIM → EXECUTA                       │
│     NÃO → BLOQUEADO                     │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│  9. EXECUÇÃO + AUDIT LOG                │
│     Ação é executada                    │
│     Tudo é registrado                   │
└─────────────────────────────────────────┘
```

---

## 📜 PARTE 7: OS 6 INVARIANTES FUNDAMENTAIS

Estas são as regras que NUNCA podem ser violadas:

### 1. Nenhuma execução sem CanExecute() = true
- Toda execução DEVE passar pela verificação
- Não existe atalho, bypass ou "execução direta"

### 2. Nenhuma decisão sem expires_at
- Toda decisão DEVE declarar quando deixa de valer
- Não existe decisão eterna

### 3. Nenhum conflito com resolução automática
- Conflitos DEVEM ser resolvidos por humano
- O sistema não escolhe lados

### 4. Nenhuma revisão sem suspensão de efeitos
- Decisão em revisão NÃO PODE produzir efeitos
- Revisão suspende, não "continua enquanto analisa"

### 5. Nenhuma aprovação sem justificativa humana
- Toda aprovação DEVE ter justificativa textual (mín. 10 caracteres)
- Não existe aprovação silenciosa

### 6. Nenhuma simulação altera estado real
- Shadow Mode NUNCA modifica dados reais
- Simulação é read-only no mundo

---

## 📁 PARTE 8: ESTRUTURA DE PASTAS DO PROJETO

```
meu-projeto-ia/
│
├── backend/                    ← BACKEND EM GO
│   ├── cmd/
│   │   ├── api/
│   │   │   └── main.go        ← Ponto de entrada
│   │   └── seed/
│   │       └── main.go        ← Dados iniciais
│   │
│   ├── internal/              ← MÓDULOS DE NEGÓCIO
│   │   ├── identity/          ← Identidade soberana
│   │   ├── billing/           ← Financeiro + Stripe
│   │   ├── ads/               ← Anúncios
│   │   ├── agent/             ← Agentes governados
│   │   ├── application/       ← Apps externos (Fase 15)
│   │   ├── secrets/           ← Secrets System (Fase 20)
│   │   ├── policy/            ← Políticas + Thresholds
│   │   ├── audit/             ← Auditoria imutável
│   │   ├── killswitch/        ← Kill Switch
│   │   ├── autonomy/          ← Matriz de Autonomia
│   │   ├── shadow/            ← Shadow Mode
│   │   ├── authority/         ← Authority Engine
│   │   ├── approval/          ← Approval Workflow
│   │   ├── memory/            ← Memória Institucional
│   │   ├── risk/              ← Risk Scoring (Fase 17)
│   │   ├── explainability/    ← Timeline + Intelligence (Fase 18)
│   │   ├── observability/     ← Health + Metrics (Fase 22)
│   │   ├── observer/          ← Observer Agents (Fase 23)
│   │   ├── federation/        ← OAuth (Google)
│   │   ├── jobs/              ← Fila de jobs
│   │   └── health/            ← Health checks
│   │
│   ├── pkg/                   ← INFRAESTRUTURA
│   │   ├── db/                ← Conexão com banco
│   │   ├── middleware/        ← Middlewares HTTP
│   │   ├── resilience/        ← Circuit breaker, retry
│   │   ├── statemachine/      ← Máquinas de estado
│   │   └── utils/             ← Utilitários (JWT, AES)
│   │
│   └── data/
│       └── prostqs.db         ← Banco SQLite
│
├── frontend/                  ← FRONTENDS
│   ├── user-app/              ← App do usuário
│   ├── admin/                 ← Painel admin
│   └── dev-portal/            ← Portal do desenvolvedor
│
├── sdk/                       ← SDK JAVASCRIPT
│   ├── src/
│   │   ├── index.js           ← Entry point
│   │   ├── client.js          ← HTTP client
│   │   ├── auth.js            ← Autenticação
│   │   ├── identity.js        ← Identidade
│   │   ├── billing.js         ← Billing
│   │   ├── ads.js             ← Ads
│   │   └── agents.js          ← Agents
│   └── examples/              ← Exemplos de uso
│
├── apps/                      ← APPS INTEGRADOS
│   └── APP-1/                 ← VOX-BRIDGE (exemplo)
│       └── backend-node/      ← Backend Node.js
│
├── scripts/                   ← SCRIPTS DE OPERAÇÃO
│   └── backup.sh              ← Script de backup
│
├── docs/                      ← DOCUMENTAÇÃO
│   ├── API_CONTRACTS.md
│   ├── ARCHITECTURE.md
│   └── POLICY_TRIGGERS.md
│
├── Dockerfile                 ← Build Docker
├── docker-compose.yml         ← Compose
├── fly.toml                   ← Deploy Fly.io
│
├── MANUAL-COMPLETO-PROST-QS.md    ← Este documento
├── DEPLOY-PROST-QS.md             ← Guia de deploy
├── THREAT-MODEL-PROST-QS.md       ← Modelo de ameaças
├── OBSERVABILITY.md               ← Observabilidade
└── AGENTS.md                      ← Agentes
```

---

## 🚀 PARTE 9: COMO RODAR O SISTEMA

### Variáveis de Ambiente (.env)

```bash
# Obrigatórias
JWT_SECRET=sua-chave-jwt-secreta-aqui
AES_SECRET_KEY=12345678901234567890123456789012
SECRETS_MASTER_KEY=12345678901234567890123456789012

# Opcionais
SERVER_PORT=8080
SQLITE_DB_PATH=./data/prostqs.db
GIN_MODE=debug
AGENTS_ENABLED=true
```

### Backend

```bash
cd backend
cp ../.env.example ../.env  # Configurar variáveis
go build -o kernel.exe ./cmd/api/main.go
./kernel.exe
# Rodando em http://localhost:8080
```

### Frontend (User App)

```bash
cd frontend/user-app
npx serve -p 3000
# Rodando em http://localhost:3000
```

### Frontend (Admin)

```bash
cd frontend/admin
npx serve -p 3001
# Rodando em http://localhost:3001
```

### Verificar se está funcionando

```bash
# Health check
curl http://localhost:8080/health

# Readiness check
curl http://localhost:8080/ready

# Métricas
curl http://localhost:8080/metrics/basic

# Sugestões do agente (se AGENTS_ENABLED=true)
curl http://localhost:8080/agents/suggestions
```

### Docker

```bash
docker-compose up -d
```

---

## 📚 PARTE 10: GUIA DE ESTUDO

### Nível 1: Entender o Conceito (1-2 horas)

1. Leia este documento completo
2. Entenda o problema que resolve
3. Entenda os 3 kernels principais
4. Entenda as 8 camadas de governança
5. Entenda os 6 invariantes

### Nível 2: Explorar o Código (2-4 horas)

1. Abra `backend/cmd/api/main.go` - veja como o servidor inicia
2. Explore `backend/internal/identity/` - veja como funciona autenticação
3. Explore `backend/internal/billing/` - veja como funciona pagamento
4. Explore `backend/internal/agent/` - veja como funciona governança de agentes
5. Explore `backend/internal/policy/` - veja como funciona avaliação de políticas

### Nível 3: Usar o SDK (1-2 horas)

1. Leia `sdk/README.md`
2. Veja `sdk/examples/basic-usage.js`
3. Veja `sdk/examples/agent-governance.js`
4. Tente fazer login via SDK
5. Tente criar uma decisão de agente

### Nível 4: Criar um App (2-4 horas)

1. Leia `GUIA-INTEGRACAO-DESENVOLVEDORES.md`
2. Copie `apps/prostqs-first-app/` como base
3. Modifique para seu caso de uso
4. Teste todas as funcionalidades

### Nível 5: Entender a Governança (4-8 horas)

1. Crie um agente
2. Defina uma política para ele
3. Proponha uma decisão
4. Veja o fluxo de aprovação
5. Teste o Kill Switch
6. Teste o Shadow Mode
7. Crie um conflito e resolva

---

## ❓ PARTE 11: PERGUNTAS FREQUENTES

### "Por que não usar um framework pronto?"

Porque frameworks prontos não garantem governança. O PROST-QS não é opcional — todo app é cliente dele.

### "Posso criar meu próprio backend?"

Não. O app não tem backend próprio. Auth, billing e autoridade são do PROST-QS.

### "Posso integrar com Stripe diretamente?"

Não. Toda integração com Stripe passa pelo PROST-QS.

### "O que acontece se eu violar um invariante?"

O sistema quebra. Os 6 invariantes são constitucionais — violá-los é destruir o sistema.

### "Posso usar em produção?"

Sim. Fase 23 está completa e operacional.

### "Qual é o diferencial?"

O sistema não tenta ser inteligente. Ele garante que decisões são humanas, rastreáveis e temporalmente válidas.

---

## 🏢 PARTE 12: APPLICATION IDENTITY (Fase 15)

### O que é

O PROST-QS não serve usuários diretamente. Ele serve **aplicativos** que servem usuários.

### Conceito

```
PROST-QS → Aplicativo → Usuário Final
```

### Entidades

| Entidade | Descrição |
|----------|-----------|
| `Application` | App registrado no PROST-QS |
| `AppCredential` | Credenciais do app (public_key + secret) |
| `AppUser` | Usuário dentro do contexto de um app |
| `AppSession` | Sessão de usuário em um app |

### Credenciais de App

Cada app recebe:
- `public_key` - Identificador público (ex: `pq_pk_abc123...`)
- `secret` - Chave secreta (ex: `pq_sk_xyz789...`)

**IMPORTANTE:** O secret só é mostrado UMA VEZ na criação.

### Endpoints

```
POST /api/v1/apps                    → Criar app
GET  /api/v1/apps/:id                → Ver app
POST /api/v1/apps/:id/credentials    → Criar credenciais
GET  /api/v1/apps/:id/credentials    → Listar credenciais
DELETE /api/v1/apps/:id/credentials/:credId → Revogar credencial
```

### Autenticação de App

Apps se autenticam via headers:
```
X-App-Key: pq_pk_abc123...
X-App-Secret: pq_sk_xyz789...
```

---

## ⚠️ PARTE 13: RISK SCORING ENGINE (Fase 17)

### O que faz

Calcula risco de forma determinística, explicável e defensável.

### Fatores de Risco

| Fator | Peso | Descrição |
|-------|------|-----------|
| `amount_factor` | 0.3 | Valor monetário envolvido |
| `frequency_factor` | 0.2 | Frequência de ações |
| `time_factor` | 0.15 | Horário da ação |
| `history_factor` | 0.2 | Histórico do ator |
| `context_factor` | 0.15 | Contexto da operação |

### Níveis de Risco

| Score | Nível | Ação |
|-------|-------|------|
| 0.0 - 0.3 | LOW | Permitido |
| 0.3 - 0.6 | MEDIUM | Monitorado |
| 0.6 - 0.8 | HIGH | Requer aprovação |
| 0.8 - 1.0 | CRITICAL | Bloqueado |

### Endpoints

```
POST /api/v1/risk/calculate    → Calcular risco
GET  /api/v1/risk/factors      → Ver fatores configurados
```

---

## 📊 PARTE 14: POLICY THRESHOLDS (Fase 17)

### O que faz

Define limites que influenciam decisões de políticas.

### Tipos de Threshold

| Tipo | Descrição |
|------|-----------|
| `daily_limit` | Limite diário |
| `transaction_limit` | Limite por transação |
| `rate_limit` | Limite de frequência |
| `risk_threshold` | Limite de risco |

### Endpoints

```
POST /api/v1/thresholds        → Criar threshold
GET  /api/v1/thresholds        → Listar thresholds
PUT  /api/v1/thresholds/:id    → Atualizar threshold
```

---

## 🔍 PARTE 15: DECISION TIMELINE (Fase 18)

### O que faz

Mostra tudo que levou uma decisão a acontecer.

### O que registra

- Quem propôs
- Quando propôs
- Quais políticas foram avaliadas
- Qual foi o resultado de cada política
- Quem aprovou/rejeitou
- Justificativa
- Timestamp de cada etapa

### Endpoints

```
GET /api/v1/timeline/:decision_id    → Ver timeline de uma decisão
GET /api/v1/timeline/actor/:id       → Ver decisões de um ator
```

---

## 🧠 PARTE 16: ADMIN INTELLIGENCE (Fase 18)

### O que faz

Mostra onde o sistema está sob tensão.

### Métricas

| Métrica | Descrição |
|---------|-----------|
| `pending_approvals` | Aprovações pendentes |
| `active_conflicts` | Conflitos ativos |
| `kill_switches_active` | Kill switches ativos |
| `high_risk_decisions` | Decisões de alto risco |
| `shadow_mode_count` | Ações em shadow mode |

### Endpoints

```
GET /api/v1/intelligence/dashboard    → Dashboard de tensão
GET /api/v1/intelligence/alerts       → Alertas ativos
```

---

## 🔐 PARTE 17: SECRETS SYSTEM (Fase 20)

### O que faz

Gerencia segredos de forma segura. Segredos pertencem à plataforma, não ao app.

### Características

- Criptografia AES-256-GCM
- Rotação de chaves
- Auditoria de acesso
- Versionamento
- Expiração automática

### Tipos de Secret

| Tipo | Descrição |
|------|-----------|
| `api_key` | Chave de API |
| `oauth_token` | Token OAuth |
| `encryption_key` | Chave de criptografia |
| `webhook_secret` | Secret de webhook |
| `custom` | Personalizado |

### Endpoints

```
POST /api/v1/secrets              → Criar secret
GET  /api/v1/secrets              → Listar secrets (sem valores)
GET  /api/v1/secrets/:id          → Ver secret (com valor, auditado)
PUT  /api/v1/secrets/:id/rotate   → Rotacionar secret
DELETE /api/v1/secrets/:id        → Revogar secret
```

### Variáveis de Ambiente

```bash
SECRETS_MASTER_KEY=<32 bytes>    # Chave mestra para criptografia
```

---

## 📡 PARTE 18: OBSERVABILITY (Fase 22)

### O que faz

Saber o que está acontecendo quando algo dá errado — sem decidir nada.

### Endpoints

#### GET /health
Health check simples, sem dependências.

```json
{
  "status": "ok",
  "uptime_sec": 12345,
  "version": "commit-hash"
}
```

#### GET /ready
Readiness check com validação de dependências.

```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "secrets": "ok"
  }
}
```

#### GET /metrics/basic
Métricas básicas em JSON.

```json
{
  "audit_events_total": 152,
  "app_events_total": 87,
  "app_events_failed_total": 2,
  "requests_total": 1500,
  "errors_total": 12,
  "uptime_seconds": 3600,
  "go_routines": 15,
  "memory_mb": 45
}
```

### Request ID

Toda request recebe um `X-Request-ID`:
- Se enviado pelo cliente, é propagado
- Se não enviado, é gerado automaticamente
- Incluído em todos os logs

### Logs Estruturados

```json
{
  "level": "info",
  "ts": "2025-12-29T18:22:01Z",
  "msg": "app event received",
  "request_id": "uuid",
  "app_id": "uuid",
  "event_type": "SESSION_STARTED"
}
```

---

## 🤖 PARTE 19: OBSERVER AGENTS (Fase 23)

### Princípio Fundamental

**Nenhum agente altera estado. Nenhum agente executa ação. Agentes apenas observam, analisam e sugerem.**

### Contrato de Segurança

O agente **NÃO TEM**:
- Credenciais
- Tokens
- Acesso a secrets
- Acesso a handlers mutáveis
- Acesso direto ao DB
- Acesso a filas, jobs, eventos

**Interface única:**
```
INPUT  → ControlledSnapshot (imutável)
OUTPUT → Suggestion (JSON estruturado)
```

### Observer v1 - Padrões Detectados

| Padrão | Condição | Confiança |
|--------|----------|-----------|
| Erros elevados | error_rate > 10% | 0.1 - 0.95 |
| Eventos falhando | app_events_failed > 0 | 0.7 - 0.95 |
| Sem eventos | requests > 100, events = 0 | 0.6 |
| Sistema ocioso | uptime > 5min, zero eventos | 0.5 |
| DB com problema | db_status != "ok" | 0.95 |
| Memória elevada | memory > 500MB | 0.6 |
| Goroutines elevadas | goroutines > 1000 | 0.7 |

### Endpoints

#### GET /agents/suggestions
Retorna sugestões do agente.

```json
{
  "enabled": true,
  "suggestions": [
    {
      "agent": "observer_v1",
      "confidence": 0.83,
      "finding": "Taxa de erros elevada detectada: 83%",
      "suggestion": "Sugestão: verificar logs de erro e endpoint /metrics/basic",
      "snapshot_hash": "sha256...",
      "generated_at": "2025-12-29T16:12:12Z"
    }
  ],
  "metrics": {
    "agent_runs_total": 5,
    "agent_failures_total": 0,
    "agent_last_run_timestamp": "2025-12-29T16:12:12Z",
    "agent_last_run_duration_ms": 1
  }
}
```

#### GET /agents/status
Status do sistema de agentes com último snapshot.

#### GET /agents/metrics
Métricas do agente.

### Kill Switch

Desabilitar agentes via variável de ambiente:

```bash
AGENTS_ENABLED=false
```

Quando desabilitado:
- Endpoint retorna `enabled: false`
- Nenhuma análise é executada
- Sistema continua operando normalmente

### Snapshot Controlado

O snapshot contém **apenas dados agregados**:

```json
{
  "snapshot_version": "1.0",
  "snapshot_hash": "sha256...",
  "window_start": "RFC3339",
  "window_end": "RFC3339",
  "metrics": {
    "audit_events_total": 0,
    "app_events_total": 0,
    "requests_total": 100,
    "errors_total": 5
  },
  "system_status": {
    "health_status": "ok",
    "ready_status": "ok",
    "db_status": "ok"
  }
}
```

**Nunca inclui:** IPs, user IDs, payloads, secrets, mensagens.

---

## 🧠 PARTE 20: AGENT MEMORY (Fase 24)

### O que é

Agent Memory é um sistema de **persistência passiva** de sugestões geradas pelos agentes observers.

O sistema **lembra**, mas **não aprende**.

### O que NÃO é

❌ **Não é aprendizado** - Memória não influencia decisões futuras
❌ **Não é automação** - Memória não dispara ações
❌ **Não é cache** - Memória é persistente, não volátil
❌ **Não é feedback loop** - Memória não retroalimenta o agente

### Características

| Característica | Descrição |
|----------------|-----------|
| Append-Only | Entradas são apenas adicionadas, nunca sobrescreve |
| Isolada do Core | Tabela separada, se apagar a memória o sistema continua 100% |
| Read-Only API | Endpoints apenas de leitura |
| Kill Switch Independente | `AGENT_MEMORY_ENABLED` separado de `AGENTS_ENABLED` |

### Endpoints

#### GET /agents/memory
Lista entradas da memória.

**Query params:**
- `agent` - Filtrar por agente (ex: `observer_v1`)
- `window` - Janela temporal (`1h`, `6h`, `12h`, `24h`, `7d`, `30d`)
- `limit` - Limite de resultados (default: 100, max: 1000)

```json
{
  "enabled": true,
  "entries": [
    {
      "id": "uuid",
      "agent": "observer_v1",
      "confidence": 0.83,
      "finding": "Taxa de erros elevada detectada: 83%",
      "suggestion": "Sugestão: verificar logs de erro",
      "snapshot_hash": "sha256...",
      "created_at": "2025-12-29T16:12:12Z"
    }
  ],
  "total": 1,
  "query": {
    "window": "24h",
    "limit": 100
  }
}
```

#### GET /agents/memory/:agent
Lista entradas de um agente específico.

#### GET /agents/memory/stats
Estatísticas da memória.

```json
{
  "enabled": true,
  "stats": {
    "total_entries": 150,
    "entries_by_agent": {
      "observer_v1": 150
    },
    "oldest_entry": "2025-12-29T10:00:00Z",
    "newest_entry": "2025-12-29T16:12:12Z",
    "avg_confidence": 0.72
  }
}
```

### Métricas

| Métrica | Descrição |
|---------|-----------|
| `agent_suggestions_total` | Total de sugestões geradas |
| `agent_memory_entries_total` | Total de entradas persistidas |
| `agent_memory_write_failures_total` | Falhas de escrita |

### Comportamento dos Kill Switches

| AGENTS_ENABLED | AGENT_MEMORY_ENABLED | Resultado |
|----------------|----------------------|-----------|
| true | true | Agente roda, sugestões persistidas |
| true | false | Agente roda, sugestões NÃO persistidas |
| false | true | Agente NÃO roda, memória vazia |
| false | false | Agente NÃO roda, memória vazia |

---

## 🧑‍💻 PARTE 21: HUMAN-IN-THE-LOOP CONSOLE (Fase 25)

### O que é

O Console é um **instrumento cognitivo** para humanos observarem e decidirem sobre sugestões de agentes.

**O humano:**
- **Vê** - sugestões, tendências, saúde
- **Compara** - histórico, padrões
- **Decide** - aceitar, ignorar, adiar
- **Aprende** - com o sistema

**O sistema:**
- **Sugere** - nunca ordena
- **Registra** - toda decisão
- **Audita** - quem, quando, por quê
- **Nunca executa** - decisão é do humano

### O que NÃO é

❌ **Não é dashboard bonito** - É instrumento de decisão
❌ **Não é automação** - Humano decide, sistema registra
❌ **Não é feedback loop** - Decisões não retroalimentam agente
❌ **Não é controle operacional** - Não executa, não altera estado

### Endpoints

#### GET /console
Dashboard completo do console.

```json
{
  "recent_suggestions": [...],
  "total_suggestions": 150,
  "total_decisions": 45,
  "decisions_by_type": {
    "accepted": 20,
    "ignored": 15,
    "deferred": 10
  },
  "pending_suggestions": 105,
  "avg_confidence": 0.72,
  "trends": {
    "errors_trend": "stable",
    "suggestions_trend": "up",
    "health_trend": "stable"
  },
  "active_kill_switches": [],
  "system_health": {
    "status": "ok",
    "uptime_seconds": 3600,
    "error_rate": 0.02,
    "memory_mb": 45
  }
}
```

#### POST /decisions
Registrar decisão humana sobre uma sugestão.

**Request:**
```json
{
  "suggestion_id": "uuid-da-sugestao",
  "decision": "accepted",
  "reason": "Vou verificar os logs manualmente",
  "human": "almir"
}
```

**Response:**
```json
{
  "message": "Decisão registrada",
  "decision": {
    "id": "uuid",
    "suggestion_id": "uuid",
    "decision": "accepted",
    "reason": "Vou verificar os logs manualmente",
    "human": "almir",
    "ip": "127.0.0.1",
    "user_agent": "...",
    "created_at": "2025-12-29T17:00:00Z"
  }
}
```

#### GET /decisions
Listar decisões humanas.

**Query params:**
- `limit` - Limite de resultados (default: 100)
- `human` - Filtrar por humano

#### GET /decisions/stats
Estatísticas de decisões.

```json
{
  "total_decisions": 45,
  "by_type": {
    "accepted": 20,
    "ignored": 15,
    "deferred": 10
  },
  "by_human": {
    "almir": 30,
    "joao": 15
  },
  "last_24h": 12,
  "last_7d": 45
}
```

### Tipos de Decisão

| Tipo | Significado | Ação do Humano |
|------|-------------|----------------|
| `accepted` | Aceito | Vai agir manualmente |
| `ignored` | Ignorado | Não relevante |
| `deferred` | Adiado | Vai analisar depois |

### Fluxo de Uso

```
1. Humano acessa GET /console
2. Vê sugestões recentes e tendências
3. Identifica sugestão relevante
4. Registra decisão via POST /decisions
5. Age manualmente (se necessário)
6. Sistema registra tudo para auditoria
```

### Invariantes

1. **Decisão não executa** - Registrar "accepted" não dispara ação
2. **Decisão não retroalimenta** - Agente não aprende com decisões
3. **Toda decisão é auditada** - IP, UserAgent, timestamp
4. **Reason obrigatório** - Mínimo 3 caracteres
5. **Human obrigatório** - Identificação do decisor

### Tendências

O console calcula tendências simples:

| Tendência | Cálculo |
|-----------|---------|
| `errors_trend` | Taxa de erros atual vs threshold |
| `suggestions_trend` | Sugestões últimas 12h vs 12h anteriores |
| `health_trend` | Status geral do sistema |

Valores: `up`, `down`, `stable`

---

## 🚀 PARTE 22: DEPLOY & SOBREVIVÊNCIA (Fase 21)

### Docker

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY backend/ .
RUN go build -o kernel ./cmd/api

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/kernel .
COPY --from=builder /app/data ./data
EXPOSE 8080
CMD ["./kernel"]
```

### Fly.io

```bash
fly launch
fly secrets set JWT_SECRET=<secret>
fly secrets set AES_SECRET_KEY=<32-bytes>
fly secrets set SECRETS_MASTER_KEY=<32-bytes>
fly deploy
```

### Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `JWT_SECRET` | Sim | Secret para tokens JWT |
| `AES_SECRET_KEY` | Sim | Chave AES-256 (32 bytes) |
| `SECRETS_MASTER_KEY` | Sim | Chave mestra para secrets |
| `SERVER_PORT` | Não | Porta do servidor (default: 8080) |
| `SQLITE_DB_PATH` | Não | Caminho do banco (default: ./data/prostqs.db) |
| `GIN_MODE` | Não | Modo do Gin (release/debug) |
| `AGENTS_ENABLED` | Não | Habilitar agentes (true/false) |
| `AGENT_MEMORY_ENABLED` | Não | Habilitar memória de agentes (true/false) |

### Backup

```bash
# Backup do SQLite
sqlite3 ./data/prostqs.db ".backup ./backups/prostqs-$(date +%Y%m%d).db"
```

---

## 🔒 PARTE 23: INTEGRAÇÃO DE APPS EXTERNOS

### Fluxo de Integração

1. **Criar app no PROST-QS**
2. **Gerar credenciais**
3. **Configurar no app externo**
4. **Enviar eventos de audit**

### Enviando Eventos

```bash
curl -X POST http://localhost:8080/api/v1/apps/events \
  -H "X-App-Key: pq_pk_..." \
  -H "X-App-Secret: pq_sk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SESSION_STARTED",
    "actor_id": "user-123",
    "actor_type": "anonymous_user",
    "metadata": "{\"source\": \"web\"}"
  }'
```

### Consultando Eventos

```bash
curl http://localhost:8080/api/v1/apps/events \
  -H "X-App-Key: pq_pk_..." \
  -H "X-App-Secret: pq_sk_..."
```

---

## ✅ PARTE 24: RESUMO FINAL

### O que é PROST-QS

Um Kernel Soberano para governança de agentes de IA.

### Problema que resolve

Agentes de IA agindo sem supervisão, sem rastreabilidade, sem controle.

### Como resolve

8 camadas de governança + observabilidade + agentes read-only + memória passiva + console humano que garantem:
- Toda ação tem um humano responsável
- Toda decisão tem validade temporal
- Conflitos bloqueiam até resolução humana
- Sistema pode ser parado instantaneamente
- Histórico é imutável e auditável
- Agentes observam mas não agem
- Memória de sugestões para análise humana
- Console para decisões humanas auditadas

### Stack

Go + Gin + SQLite + Vanilla JS + SDK JavaScript

### Status

Fase 27.1 - Financial Hardening. Sistema com infraestrutura financeira completa.

### Fases Concluídas

| Fase | Descrição | Status |
|------|-----------|--------|
| 1-10 | Fundação (Identity, Billing, Ads) | ✅ |
| 11 | Policy Engine + Audit + Kill Switch | ✅ |
| 12 | Autonomy Matrix + Shadow Mode | ✅ |
| 13 | Authority + Approval Workflow | ✅ |
| 14 | Institutional Memory | ✅ |
| 15 | Application Identity | ✅ |
| 16 | SDK JavaScript | ✅ |
| 17 | Risk Scoring + Thresholds | ✅ |
| 18 | Decision Timeline + Intelligence | ✅ |
| 19 | Business Explainability | ✅ |
| 20 | Secrets System | ✅ |
| 21 | Deploy & Sobrevivência | ✅ |
| 22 | Observability | ✅ |
| 23 | First Controlled Agents | ✅ |
| 24 | Agent Memory (Passive) | ✅ |
| 25 | Human-in-the-Loop Console | ✅ |
| 26 | Operação Assistida | ✅ |
| 26.5 | Cognitive Dashboard | ✅ |
| 26.8 | Identity & Access Completion | ✅ |
| 27.0 | Financial Event Pipeline | ✅ |
| 27.1 | Reconciliation Engine | ✅ |
| 27.2+ | Financial Hardening | 🔄 |

### Valor

Uma infraestrutura que permite criar produtos sem perder controle.
- Reduz risco
- Reduz custo mental
- Aumenta velocidade futura
- Agentes que observam sem interferir
- Memória para análise retrospectiva
- Console para decisões humanas auditadas
- **Infraestrutura financeira completa** (ledger, métricas, reconciliação)
- **Todo centavo rastreável, auditável, mensurável e visível**

---

## 📎 DOCUMENTOS RELACIONADOS

- `DOCUMENTACAO-SISTEMA-PROST-QS.md` - Documentação técnica completa
- `RESUMO-EXECUTIVO-PROST-QS.md` - Resumo para executivos
- `GUIA-INTEGRACAO-DESENVOLVEDORES.md` - Guia para devs
- `MATRIZ-MODULOS-DEPENDENCIAS.md` - Mapa de módulos
- `FAQ-TROUBLESHOOTING-PROST-QS.md` - FAQ e troubleshooting
- `DEPLOY-PROST-QS.md` - Guia de deploy
- `THREAT-MODEL-PROST-QS.md` - Modelo de ameaças
- `OBSERVABILITY.md` - Documentação de observabilidade
- `AGENTS.md` - Documentação de agentes
- `AGENT-MEMORY.md` - Documentação de memória de agentes
- `HUMAN-CONSOLE.md` - Documentação do console humano
- `CHECKPOINT-FASE-26-8.md` - Identity & Access Completion
- `CHECKPOINT-FASE-27-0.md` - Financial Event Pipeline
- `CHECKPOINT-FASE-27-1.md` - Reconciliation Engine
- `docs/API_CONTRACTS.md` - Contratos de API
- `docs/ARCHITECTURE.md` - Arquitetura detalhada
- `sdk/README.md` - Documentação do SDK

---

*Documento atualizado em 29/12/2024*
*Sistema PROST-QS - Fase 27.1 (Financial Hardening)*
