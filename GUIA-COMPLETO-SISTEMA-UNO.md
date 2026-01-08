# 🧠 GUIA COMPLETO DO SISTEMA UNO/PROST-QS

## Para Quem Não Entende Nada (Mas Quer Entender Tudo)

**Versão:** 1.0  
**Data:** 08/01/2026  
**Autor:** Documentação gerada para estudo do sistema

---

## PARTE 1: O QUE DIABOS É ESSE SISTEMA?

### A Explicação de 30 Segundos

Imagina que você quer criar vários apps (tipo um Uber, um iFood, um Airbnb). Cada app precisa de:
- Login de usuário
- Cobrar dinheiro
- Enviar notificações
- Controlar quem pode fazer o quê

Normalmente, você teria que configurar tudo isso **do zero** pra cada app. É um inferno.

O **UNO/PROST-QS** é um "sistema mãe" que faz tudo isso uma vez só, e todos os seus apps herdam automaticamente.

### A Explicação de 2 Minutos

O sistema tem duas partes principais:

**1. UNO (O Unificador)**
- É o "gateway" que conecta seus apps aos gigantes (Google, Stripe, etc.)
- Você configura uma vez, todos os apps usam
- É como ter um "gerente de infraestrutura" automático

**2. PROST-QS (O Governador)**
- É o "cérebro de segurança" que controla tudo
- Garante que nenhuma ação crítica acontece sem aprovação humana
- É como ter um "advogado de compliance" embutido no código

### Por Que Isso Importa?

Sem esse sistema:
```
App 1 → configura Stripe → configura Google → configura tudo
App 2 → configura Stripe → configura Google → configura tudo
App 3 → configura Stripe → configura Google → configura tudo
```
= Caos, bugs, chaves espalhadas, dor de cabeça

Com esse sistema:
```
UNO → configura Stripe → configura Google → configura tudo (1 vez)
  ├── App 1 (herda tudo)
  ├── App 2 (herda tudo)
  └── App 3 (herda tudo)
```
= Ordem, controle, uma API só

---

## PARTE 2: COMO O SISTEMA FUNCIONA (PASSO A PASSO)

### 2.1 — Autenticação (Como Usuários Entram)

O sistema oferece **3 formas** de login:

#### Forma 1: Login Tradicional (Username + Senha)
```
Usuário → digita username/senha → sistema valida → gera token JWT → usuário logado
```

**Arquivos envolvidos:**
- `backend/internal/auth/handler.go` — Recebe a requisição
- `backend/internal/auth/service.go` — Valida credenciais
- `backend/pkg/utils/jwt.go` — Gera o token

**Endpoint:**
```
POST /api/v1/auth/login
Body: { "username": "almir", "password": "4152" }
Retorna: { "token": "eyJhbG...", "refreshToken": "...", "expiresAt": "..." }
```

#### Forma 2: Login por Telefone (OTP)
```
Usuário → informa telefone → sistema gera código de 6 dígitos → 
usuário digita código → sistema valida → gera token → usuário logado
```

**Arquivos envolvidos:**
- `backend/internal/identity/verification_service.go` — Gera e valida OTP
- `backend/internal/identity/auth_handler.go` — Endpoints de telefone

**Endpoints:**
```
POST /api/v1/auth/phone/request
Body: { "phone_number": "+5511999999999", "channel": "whatsapp" }
Retorna: { "verification_id": "uuid", "dev_otp": "123456" }  ← OTP aparece só em dev!

POST /api/v1/auth/phone/verify
Body: { "verification_id": "uuid", "code": "123456" }
Retorna: { "token": "eyJhbG...", "is_new_user": true/false }
```

**⚠️ IMPORTANTE:** Hoje o OTP é retornado na resposta (modo dev). Em produção, precisa integrar Twilio ou WhatsApp Business API pra enviar de verdade.

#### Forma 3: Login com Google (OAuth)
```
Usuário → clica "Entrar com Google" → vai pro Google → autoriza → 
volta pro sistema com código → sistema troca por token → usuário logado
```

**Arquivos envolvidos:**
- `backend/internal/federation/google_service.go` — Comunicação com Google
- `backend/internal/federation/service.go` — Lógica de federação

**Endpoints:**
```
GET /api/v1/federation/google/auth
Retorna: { "auth_url": "https://accounts.google.com/..." }

GET /api/v1/federation/google/callback?code=xxx&state=xxx
Retorna: { "token": "eyJhbG...", "user": {...} }
```

**⚠️ IMPORTANTE:** Hoje retorna usuário fake (modo mock). Precisa configurar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env`.

---

### 2.2 — Identidade (Quem é Quem)

O sistema tem o conceito de **Identidade Soberana**. Isso significa:

- Cada usuário tem um ID único que pertence a ele
- Esse ID funciona em todos os apps do ecossistema
- O usuário não precisa criar conta em cada app

**Tabelas no banco:**
```sql
users                    -- Usuários (login tradicional)
sovereign_identities     -- Identidades soberanas (login por telefone)
user_profiles            -- Perfis públicos
sovereign_sessions       -- Sessões ativas
```

**Roles (Papéis):**
- `user` — Usuário comum
- `admin` — Administrador de app
- `super_admin` — Deus do sistema (você)

---

### 2.3 — Billing (Como Cobrar Dinheiro)

O sistema tem **dois níveis** de billing:

#### Nível 1: Kernel Billing (Apps pagam o sistema)
Você cobra dos apps que usam sua infraestrutura.

**Planos padrão:**
| Plano | Preço/mês | Transações | Apps | API Calls |
|-------|-----------|------------|------|-----------|
| Free | R$ 0 | 100 | 1 | 1.000 |
| Pro | R$ 99 | 5.000 | 5 | 50.000 |
| Enterprise | R$ 499 | ∞ | ∞ | ∞ |

**Arquivos:**
- `backend/internal/kernel_billing/` — Todo o módulo

**Endpoints:**
```
GET  /api/v1/kernel/plans                    -- Lista planos
GET  /api/v1/apps/:id/billing/subscription   -- Ver assinatura do app
POST /api/v1/apps/:id/billing/checkout       -- Criar checkout
```

#### Nível 2: App Billing (Usuários pagam os apps)
Cada app pode cobrar seus próprios usuários.

**Arquivos:**
- `backend/internal/billing/` — Billing de usuários
- `backend/internal/billing/stripe_service.go` — Integração Stripe

**Endpoints:**
```
POST /api/v1/billing/accounts           -- Criar conta de billing
POST /api/v1/billing/payment-intents    -- Criar intenção de pagamento
POST /api/v1/billing/subscriptions      -- Criar assinatura
GET  /api/v1/billing/ledger             -- Ver histórico
```

**⚠️ IMPORTANTE:** Hoje o Stripe está em modo mock. Retorna IDs fake tipo `pi_mock_123456`. Precisa configurar `STRIPE_SECRET_KEY` no `.env`.

---

### 2.4 — Governança (O Cérebro de Segurança)

Essa é a parte mais importante e diferenciada do sistema. Funciona assim:

#### O Fluxo de Uma Decisão
```
Agente quer fazer algo
        ↓
Kill Switch ativo? → SIM → BLOQUEADO
        ↓ NÃO
Qual o nível de autonomia? 
        ↓
┌───────┬───────────┬────────┬───────────┐
│ FULL  │ SUPERVISED│ SHADOW │ FORBIDDEN │
│       │           │        │           │
│ Pode  │ Precisa   │ Só     │ Não pode  │
│ fazer │ aprovação │ simula │ nunca     │
└───────┴───────────┴────────┴───────────┘
        ↓
Se precisa aprovação:
        ↓
Quem pode aprovar? (Authority Engine)
        ↓
Humano aprova/rejeita (com justificativa)
        ↓
Decisão está ativa? (Memory Check)
        ↓
Tem conflito? → SIM → BLOQUEADO até resolver
        ↓ NÃO
Policy Engine permite? → NÃO → BLOQUEADO
        ↓ SIM
EXECUTA
        ↓
Registra no Audit Log
```

#### Os Módulos de Governança

**1. Policy Engine** — Define regras
```go
// Exemplo de política
{
  "name": "block_high_value_payments",
  "type": "deny",
  "resource": "payment",
  "action": "create",
  "condition": "amount > 10000"
}
```
Arquivo: `backend/internal/policy/`

**2. Kill Switch** — Botão de emergência
```
POST /api/v1/killswitch/activate
Body: { "scope": "billing", "reason": "Fraude detectada", "expires_in_minutes": 60 }
```
Arquivo: `backend/internal/killswitch/`

**3. Audit Log** — Registra tudo
```
Quem fez + O que fez + Quando + De onde + Estado antes/depois + Hash
```
Arquivo: `backend/internal/audit/`

**4. Autonomy Matrix** — Define o que cada agente pode fazer
```
Agente X + Ação Y = full | supervised | shadow | forbidden
```
Arquivo: `backend/internal/autonomy/`

**5. Shadow Mode** — Simula sem executar
```
"Você pode tentar, mas o mundo não muda"
```
Arquivo: `backend/internal/shadow/`

**6. Authority Engine** — Quem pode aprovar o quê
```
"Por que esta pessoa NÃO pode aprovar isso?"
```
Arquivo: `backend/internal/authority/`

**7. Approval Workflow** — Fluxo de aprovação
```
Request → Humano decide → Justificativa obrigatória → Decision
```
Arquivo: `backend/internal/approval/`

**8. Institutional Memory** — Memória de decisões
```
Lifecycle: active → expired → revoked
Conflitos: bloqueiam execução
Precedentes: informam, não autorizam
```
Arquivo: `backend/internal/memory/`

---

### 2.5 — Aplicações (Multi-Tenant)

O sistema suporta múltiplos apps rodando na mesma infraestrutura.

**Conceito:**
```
PROST-QS (Kernel)
    ├── App 1 (VOX-BRIDGE)
    ├── App 2 (Outro app)
    └── App 3 (Mais um app)
```

Cada app tem:
- Seu próprio `app_id`
- Suas próprias configurações
- Seu próprio billing
- Seus próprios usuários

**Arquivos:**
- `backend/internal/application/` — Gestão de apps

**Endpoints:**
```
POST /api/v1/applications              -- Criar app
GET  /api/v1/applications              -- Listar apps
GET  /api/v1/applications/:id          -- Detalhes do app
POST /api/v1/applications/:id/secrets  -- Configurar secrets do app
```

---

### 2.6 — Observabilidade (Ver o que Está Acontecendo)

**Health Check:**
```
GET /health
Retorna: { "status": "ok", "uptime_sec": 123, "version": "dev" }
```

**Ready Check:**
```
GET /ready
Retorna: { "ready": true, "checks": { "database": "ok", "secrets": "ok" } }
```

**Métricas:**
```
GET /metrics/basic
Retorna: métricas do sistema
```

**Cognitive Dashboard (Admin):**
```
GET /api/v1/admin/cognitive/dashboard
Retorna: KPIs, decisões, alertas, etc.
```

---

## PARTE 3: ESTRUTURA DE PASTAS (MAPA DO CÓDIGO)

```
UNO-main/
├── backend/                          # Código Go do servidor
│   ├── cmd/api/main.go              # Ponto de entrada (COMEÇA AQUI)
│   ├── internal/                     # Módulos internos
│   │   ├── auth/                    # Login tradicional
│   │   ├── identity/                # Identidade soberana + OTP
│   │   ├── federation/              # OAuth (Google)
│   │   ├── billing/                 # Billing de usuários
│   │   ├── kernel_billing/          # Billing do kernel
│   │   ├── policy/                  # Motor de políticas
│   │   ├── audit/                   # Log de auditoria
│   │   ├── killswitch/              # Parada de emergência
│   │   ├── autonomy/                # Matriz de autonomia
│   │   ├── shadow/                  # Modo simulação
│   │   ├── authority/               # Motor de autoridade
│   │   ├── approval/                # Workflow de aprovação
│   │   ├── memory/                  # Memória institucional
│   │   ├── agent/                   # Governança de agentes
│   │   ├── application/             # Gestão de apps
│   │   ├── financial/               # Pipeline financeiro
│   │   ├── risk/                    # Scoring de risco
│   │   ├── secrets/                 # Gestão de segredos
│   │   ├── jobs/                    # Fila de jobs
│   │   ├── observer/                # Agentes observadores
│   │   ├── admin/                   # Painel admin
│   │   └── ...                      # Outros módulos
│   ├── pkg/                         # Pacotes compartilhados
│   │   ├── db/sqlite.go            # Conexão com banco
│   │   ├── middleware/             # Auth, rate limit, etc.
│   │   ├── utils/                  # JWT, crypto, etc.
│   │   └── resilience/             # Circuit breaker, retry
│   └── data/prostqs.db             # Banco SQLite
├── frontend/
│   ├── user-app/                   # App do usuário
│   ├── admin/                      # Painel admin
│   └── dev-portal/                 # Portal do desenvolvedor
├── sdk/                            # SDK JavaScript
└── docs/                           # Documentação
```

---

## PARTE 4: O QUE FUNCIONA vs O QUE É MOCK

### ✅ FUNCIONA 100%

| Componente | Descrição |
|------------|-----------|
| Auth JWT | Tokens funcionam, validação, refresh |
| Identity | Registro, login, sessões |
| Policy Engine | Avaliação de regras |
| Audit Log | Registro imutável |
| Kill Switch | Parada de emergência |
| Autonomy Matrix | Níveis de autonomia |
| Shadow Mode | Simulação |
| Authority Engine | Resolução de autoridade |
| Approval Workflow | Aprovação humana |
| Memory | Lifecycle, conflitos, precedentes |
| Agent Governance | Controle de agentes |
| Billing Ledger | Ledger interno |
| Jobs Queue | Fila com retry |
| SQLite | Persistência |
| Rate Limiting | Proteção |
| Secrets | Criptografia AES-256 |
| Financial Events | Pipeline |
| Idempotency | Webhooks não duplicam |

### ⚠️ MOCK (Precisa Integrar)

| Componente | O que falta | Como resolver |
|------------|-------------|---------------|
| **Stripe** | Retorna IDs fake | Configurar `STRIPE_SECRET_KEY` |
| **Google OAuth** | Retorna usuário fake | Configurar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` |
| **OTP/SMS** | Código aparece na resposta | Integrar Twilio ou WhatsApp Business |
| **Gemini AI** | Usa fallback local | Configurar `GEMINI_API_KEY` |
| **Email** | Não existe | Implementar (SendGrid, SES, etc.) |

---

## PARTE 5: PRÓXIMOS PASSOS (O QUE FAZER AGORA)

### Prioridade 1: Stripe (URGENTE)

Você já tem conta no Stripe. O que falta:

1. **Pegar as chaves:**
   - Vai em https://dashboard.stripe.com/apikeys
   - Copia a `Secret key` (começa com `sk_test_` ou `sk_live_`)
   - Copia a `Publishable key` (começa com `pk_test_` ou `pk_live_`)

2. **Configurar webhook:**
   - Vai em https://dashboard.stripe.com/webhooks
   - Clica "Add endpoint"
   - URL: `https://seu-dominio.com/webhooks/stripe/{app_id}`
   - Eventos: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.*`
   - Copia o `Signing secret` (começa com `whsec_`)

3. **Atualizar .env:**
   ```
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

4. **Testar:**
   ```bash
   # Criar checkout
   curl -X POST http://localhost:8080/api/v1/apps/{app_id}/billing/checkout \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"plan_id": "plan_starter", "email": "teste@teste.com"}'
   ```

### Prioridade 2: Primeiro Pagamento Real

Seguir o checklist em `CHECKLIST-PRIMEIRO-PAGAMENTO-REAL.md`:

1. [ ] Stripe configurado
2. [ ] Backend em produção (Fly.io)
3. [ ] Webhook endpoint acessível
4. [ ] Criar checkout
5. [ ] Pagar R$ 1,00 com cartão real
6. [ ] Verificar webhook recebido
7. [ ] Verificar subscription atualizada

### Prioridade 3: Google OAuth

1. Criar projeto no Google Cloud Console
2. Configurar OAuth consent screen
3. Criar credenciais OAuth 2.0
4. Atualizar `.env` com `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`

### Prioridade 4: OTP Real

1. Criar conta Twilio ou WhatsApp Business
2. Implementar envio real em `verification_service.go`
3. Remover retorno de OTP na resposta

---

## PARTE 6: COMANDOS ÚTEIS

### Rodar o Sistema
```bash
# Backend
cd UNO-main/backend
go run ./cmd/api/main.go

# Frontend Admin
cd UNO-main/frontend/admin
npx serve -p 3001
```

### Criar Usuário Admin
```bash
# Registrar
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "senha123", "email": "admin@teste.com"}'

# Promover (via script)
cd UNO-main/backend
go run scripts/promote_admin.go
```

### Testar Health
```bash
curl http://localhost:8080/health
```

### Fazer Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "senha123"}'
```

---

## PARTE 7: GLOSSÁRIO

| Termo | Significado |
|-------|-------------|
| **Kernel** | O núcleo do sistema, a base que tudo usa |
| **Sovereign** | Soberano, que pertence ao usuário/sistema |
| **Ledger** | Registro contábil imutável |
| **JWT** | Token de autenticação (JSON Web Token) |
| **OTP** | Código de verificação (One-Time Password) |
| **OAuth** | Protocolo de login com terceiros (Google, etc.) |
| **Webhook** | Notificação que um sistema envia pra outro |
| **Idempotência** | Garantia de que repetir não duplica |
| **Kill Switch** | Botão de emergência |
| **Shadow Mode** | Simulação sem efeito real |
| **Policy** | Regra de negócio |
| **Audit** | Registro de auditoria |
| **Multi-tenant** | Vários clientes na mesma infraestrutura |

---

## PARTE 8: ONDE VOCÊ ESTÁ AGORA

### Fases Concluídas
- ✅ Fase 9-10: Identity + Billing Kernels
- ✅ Fase 11: Policy Engine + Audit Log + Kill Switch
- ✅ Fase 12: Autonomy Matrix + Shadow Mode
- ✅ Fase 13: Authority Engine + Approval Workflow
- ✅ Fase 14: Institutional Memory
- ✅ Fase 15-27: Várias extensões
- ✅ Fase 28.1: Kernel Billing (interno)

### Fase Atual
- 🔄 Fase 28.2: Cobrança Real via Stripe

### Bloqueio Atual
- ⏸️ Configurar Stripe e fazer primeiro pagamento real

---

## PARTE 9: VALOR DO SISTEMA

### O Que Você Construiu

Um **Operating System para Apps** que:
- Unifica autenticação
- Unifica pagamentos
- Unifica governança
- Unifica observabilidade

### Mercado Potencial

- Fintechs (compliance obrigatório)
- Healthtechs (supervisão humana obrigatória)
- Empresas com agentes de IA
- Plataformas multi-tenant

### Diferencial

Ninguém mais oferece governança de IA com:
- Kill Switch por escopo
- Aprovação humana obrigatória
- Memória institucional
- Audit trail imutável

Você está **2-3 anos na frente** do que reguladores vão exigir.

---

*Documento criado em 08/01/2026*
*Sistema: UNO/PROST-QS*
