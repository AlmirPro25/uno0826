# GLOSSÁRIO TÉCNICO — PROST-QS / UNO.KERNEL

> Definições oficiais dos termos usados no sistema.

---

## A

### App (Application)
Entidade soberana e isolada que usa o PROST-QS. Cada app tem:
- `app_id` único (UUID)
- API Key pública (`pq_pk_...`)
- API Secret (`pq_sk_...`)
- Dados completamente isolados de outros apps

### AppMembership
Vínculo explícito entre um User e um App. Um usuário pode ter memberships em múltiplos apps, mas cada membership é criado com consentimento.

### Approval Workflow
Fluxo de aprovação humana para ações sensíveis. Toda ação que requer aprovação gera um `ApprovalRequest` que deve ser decidido por um humano autorizado.

### Audit Log
Registro imutável de todas as ações do sistema. Inclui:
- Quem fez (actor)
- O que fez (action)
- Quando fez (timestamp)
- Estado antes/depois
- Hash de integridade

### Authority Engine
Motor que resolve quem pode aprovar o quê. Responde à pergunta: "Por que esta pessoa NÃO pode aprovar isso?"

### Autonomy Matrix
Matriz que define o que cada agente pode fazer sozinho. Níveis:
- `full` — executa sozinho
- `supervised` — precisa aprovação
- `shadow_only` — apenas simula
- `forbidden` — proibido

---

## B

### Billing Kernel
Módulo econômico do sistema. Gerencia:
- Contas de billing
- Subscriptions
- Pagamentos (Stripe)
- Ledger contábil
- Capabilities por plano

### Blast Radius
Escopo de impacto de uma ação. Quanto maior o blast radius, mais aprovações são necessárias.

---

## C

### Capabilities
Funcionalidades que um app pode usar baseado em seu plano. Exemplo:
- Free: 1 app, 5 deploys/dia
- Pro: 10 apps, 50 deploys/dia
- Enterprise: ilimitado

### Cooldown
Período mínimo entre execuções de uma mesma regra. Evita spam de alertas.

### Crash Loop
Quando um container reinicia repetidamente. Após 5 crashes em 5 minutos, o sistema faz rollback automático.

---

## D

### Decision Lifecycle
Ciclo de vida de uma decisão:
- `active` — válida e executável
- `expired` — expirou naturalmente
- `superseded` — substituída por outra
- `revoked` — revogada manualmente
- `under_review` — em revisão

### Decision Precedent
Registro histórico de decisões similares. Informa, mas NÃO autoriza decisões futuras.

---

## E

### Event (Evento)
Fato imutável que aconteceu. Tipos comuns:
- `session.start` / `session.end`
- `deploy.started` / `deploy.failed`
- `container.crashed`
- `payment.completed`

---

## F

### Failure Narrative
Explicação em linguagem humana de por que algo falhou. Não é log técnico, é narrativa compreensível.

```
O QUE: Deploy do app "meu-app" falhou
QUANDO: 2026-01-11 14:32:15 UTC
ONDE: Fase de build
POR QUE: npm install retornou exit code 1
CONTEXTO: Dependência "lodash@5.0.0" não encontrada
AÇÃO TOMADA: Nenhuma (erro de código)
PRÓXIMO PASSO: Usuário deve corrigir package.json
```

---

## G

### Governance Layer
Camada de governança do sistema. Inclui:
- Policy Engine
- Audit Log
- Kill Switch
- Autonomy Matrix
- Shadow Mode
- Authority Engine
- Approval Workflow
- Institutional Memory

---

## H

### Heartbeat
Sinal periódico que indica que uma sessão está ativa. No PROST-QS, sessões enviam heartbeat a cada 30 segundos.

### Human-in-the-Loop
Princípio de que ações sensíveis sempre requerem decisão humana. O sistema não decide sozinho.

---

## I

### Identity Kernel
Módulo de identidade do sistema. Gerencia:
- Users (identidade global)
- UserOrigin (certidão de nascimento)
- AppMembership (vínculos por app)
- Sessions
- Verificações

### Idempotency
Garantia de que uma operação pode ser executada múltiplas vezes com o mesmo resultado. Crítico para webhooks.

### Impact Level
Nível de impacto de uma ação:
- `none` — sem impacto
- `low` — impacto baixo
- `medium` — impacto médio
- `high` — impacto alto
- `critical` — impacto crítico

### Implicit Login
Login invisível para apps externos. O app envia credenciais e recebe JWT sem interação do usuário.

### Institutional Memory
Memória de decisões ao longo do tempo. Preserva contexto sem criar autoridade automática.

---

## J

### Job
Tarefa assíncrona na fila de processamento. Tipos:
- Webhook execution
- Email sending
- Metric aggregation

---

## K

### Kernel
Núcleo central do sistema. O PROST-QS é um "Sovereign Kernel" — infraestrutura soberana de decisão.

### Kill Switch
Botão de emergência que para tudo instantaneamente. Escopos:
- `global` — para tudo
- `billing` — para operações financeiras
- `agents` — para agentes de IA
- `ads` — para sistema de anúncios

---

## L

### Ledger
Registro contábil imutável de todas as transações financeiras.

---

## M

### Multi-Tenant
Arquitetura onde múltiplos clientes (tenants) compartilham infraestrutura mas têm dados isolados.

---

## N

### Narrative Service
Serviço que gera explicações em linguagem humana para falhas e eventos do sistema.

### Notification
Alerta enviado ao usuário sobre eventos importantes. Canais:
- Dashboard
- Email
- Webhook

---

## O

### Observer Agent
Agente que apenas observa, analisa e sugere. Não executa ações.

---

## P

### PaaS (Platform as a Service)
Modelo de serviço onde o provedor gerencia infraestrutura e o cliente gerencia aplicações.

### Policy Engine
Motor que avalia políticas antes de qualquer ação. Resultados:
- `allow` — permite
- `deny` — bloqueia
- `require_approval` — exige aprovação

### Precedent
Ver "Decision Precedent".

---

## R

### Rate Limiting
Limitação de requisições por período. Protege contra abuso.

### Retry Policy
Política de tentativas após falha:
- Deploy (infra): 3 tentativas, 30s/60s/120s
- Webhook: 5 tentativas, exponential backoff
- Container crash: 3 tentativas, 10s

### Rollback
Reversão para estado anterior. Automático em:
- Deploy falhou
- Health check falhou (3x)
- Crash loop (5 crashes em 5min)

### Rules Engine
Motor de regras que transforma observação em ação:
```
Observação → Condição → Ação
```

---

## S

### SCE (Sovereign Cloud Engine)
App de exemplo que usa o PROST-QS. É um mini-PaaS para deploy de containers.

### Session
Período de atividade de um usuário. Diferente de login — uma sessão representa presença real.

### Shadow Mode
Modo de simulação que executa ações sem efeito real. Registra o que TERIA acontecido.

### SLA (Service Level Agreement)
Acordo de nível de serviço:
- Uptime: 99.5%
- Latência API: < 200ms (P95)
- Tempo de deploy: < 5min (P95)

### Soft Limits
Limites que podem ser ultrapassados temporariamente, mas geram alertas.

### Sovereign Identity
Identidade única e soberana do usuário. O usuário é dono de sua identidade.

---

## T

### Telemetry
Coleta de dados de comportamento do sistema e usuários. Inclui:
- Eventos
- Sessões
- Métricas
- Analytics

### Tenant
Cliente/organização que usa o sistema. No PROST-QS, cada App é um tenant.

### Threshold
Limite que dispara uma ação quando ultrapassado.

### Trigger
Gatilho que inicia uma regra. Tipos:
- `metric` — baseado em métrica
- `threshold` — baseado em limite
- `event` — baseado em evento
- `schedule` — baseado em horário

---

## U

### Usage Service
Serviço que mede consumo de recursos. "Billing não é cobrança. Billing é medição."

### User
Identidade global única no sistema. Um User pode ter memberships em múltiplos Apps.

### UserOrigin
"Certidão de nascimento" do usuário. Registra em qual App o usuário foi criado originalmente. Imutável.

---

## V

### VOX-BRIDGE
App de exemplo (APP-1) que usa o PROST-QS. É um video chat anônimo.

---

## W

### Webhook
Chamada HTTP para URL externa quando algo acontece. Usado para integrações.

---

## Siglas

| Sigla | Significado |
|-------|-------------|
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete |
| JWT | JSON Web Token |
| ORM | Object-Relational Mapping |
| PaaS | Platform as a Service |
| SCE | Sovereign Cloud Engine |
| SLA | Service Level Agreement |
| SSO | Single Sign-On |
| UUID | Universally Unique Identifier |

---

*Documento atualizado em 11/01/2026*
