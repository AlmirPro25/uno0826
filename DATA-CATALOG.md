# DATA CATALOG - PROST-QS

## Catálogo Completo de Dados do Sistema

**Fase 26.5 — Expansão de Observabilidade**
**Gerado em:** 29/12/2025

---

## VISÃO GERAL

O PROST-QS possui **45+ tabelas** organizadas em **12 domínios** funcionais.

| Domínio | Tabelas | Descrição |
|---------|---------|-----------|
| Identity | 7 | Identidade soberana e autenticação |
| Billing | 6 | Financeiro, ledger, pagamentos |
| Ads | 5 | Campanhas publicitárias |
| Application | 4 | Apps externos integrados |
| Agent | 4 | Agentes governados |
| Observer | 2 | Agentes observers (Fase 23-25) |
| Policy | 2 | Motor de políticas |
| Governance | 8 | Governança (autonomy, shadow, authority, approval) |
| Memory | 4 | Memória institucional |
| Audit | 1 | Log de auditoria imutável |
| Risk | 3 | Scoring de risco |
| Infrastructure | 4 | Jobs, secrets, kill switch |

---

## DOMÍNIO: IDENTITY

### sovereign_identities
Identidade soberana principal (phone é a identidade).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| user_id | UUID | PK |
| primary_phone | TEXT | Telefone principal (unique) |
| source | TEXT | Origem do cadastro |
| created_at | DATETIME | Criação |
| updated_at | DATETIME | Atualização |

### users
Entidade principal do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| status | TEXT | active, suspended, banned |
| role | TEXT | user, admin, super_admin |
| username | TEXT | Legacy |
| email | TEXT | Legacy |
| created_at | DATETIME | Criação |

### user_profiles
Dados humanos do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| name | TEXT | Nome |
| email | TEXT | Email |
| avatar_url | TEXT | Avatar |

### auth_methods
Métodos de autenticação (phone, google, etc).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| type | TEXT | phone, google, apple, email |
| identifier | TEXT | +5511... ou email (unique) |
| verified | BOOL | Verificado? |

### identity_links
Providers linkados à identidade.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK |
| provider | TEXT | google, apple, etc |
| provider_id | TEXT | ID no provider |
| linked_at | DATETIME | Quando linkado |

### pending_verifications
Verificações OTP em andamento (TTL curto).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| verification_id | UUID | PK |
| phone_number | TEXT | Telefone |
| code_hash | TEXT | Hash do código |
| channel | TEXT | sms, whatsapp |
| attempts | INT | Tentativas |
| expires_at | DATETIME | Expiração |

### sovereign_sessions
Sessões ativas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| session_id | UUID | PK |
| user_id | UUID | FK |
| device_fingerprint | TEXT | Fingerprint |
| expires_at | DATETIME | Expiração |
| is_active | BOOL | Ativa? |

### rate_limit_entries
Rate limiting por phone/IP.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| key | TEXT | phone:+55... ou ip:192... |
| attempt_count | INT | Tentativas |
| blocked_until | DATETIME | Bloqueado até |

---

## DOMÍNIO: BILLING

### billing_accounts
Conta de billing (1:1 com identity).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| account_id | UUID | PK |
| user_id | UUID | FK → users (unique) |
| stripe_customer_id | TEXT | ID no Stripe |
| balance | INT | Saldo em centavos |
| currency | TEXT | BRL |

### payment_intents
Intenções de pagamento.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| intent_id | UUID | PK |
| account_id | UUID | FK |
| amount | INT | Valor em centavos |
| status | TEXT | pending, confirmed, failed, disputed |
| stripe_intent_id | TEXT | ID no Stripe |
| idempotency_key | TEXT | Chave de idempotência |

### subscriptions
Assinaturas recorrentes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| subscription_id | UUID | PK |
| account_id | UUID | FK |
| app_id | UUID | FK → applications (opcional) |
| plan_id | TEXT | Plano |
| status | TEXT | active, canceled, past_due |
| amount | INT | Valor |
| interval | TEXT | month, year |

### ledger_entries
Ledger financeiro (IMUTÁVEL).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| entry_id | UUID | PK |
| account_id | UUID | FK |
| type | TEXT | credit, debit |
| amount | INT | Valor (sempre positivo) |
| description | TEXT | Descrição |
| reference_id | TEXT | PaymentIntent, Payout, etc |
| balance_after | INT | Saldo após operação |
| created_at | DATETIME | Imutável |

### payouts
Solicitações de saque.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| payout_id | UUID | PK |
| account_id | UUID | FK |
| amount | INT | Valor |
| status | TEXT | pending, sent, failed |
| destination | TEXT | PIX key, bank account |

### processed_webhooks
Webhooks já processados (idempotência).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| event_id | TEXT | PK (Stripe event ID) |
| event_type | TEXT | Tipo do evento |
| processed_at | DATETIME | Quando processado |
| success | BOOL | Sucesso? |

---

## DOMÍNIO: ADS

### ad_accounts
Contas de anunciante.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| tenant_id | UUID | Tenant |
| user_id | UUID | FK |
| balance_account_id | UUID | FK → billing_accounts |
| name | TEXT | Nome |
| status | TEXT | active, suspended |

### ad_budgets
Orçamentos de anúncios.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| ad_account_id | UUID | FK |
| amount_total | INT | Total em centavos |
| amount_spent | INT | Gasto (só cresce via ledger) |
| period | TEXT | daily, monthly, lifetime |
| status | TEXT | active, exhausted, disputed |

### ad_campaigns
Campanhas publicitárias.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| ad_account_id | UUID | FK |
| budget_id | UUID | FK |
| name | TEXT | Nome |
| objective | TEXT | impressions, clicks, conversions |
| status | TEXT | draft, active, paused, completed |
| total_spent | INT | Total gasto |

### ad_spend_events
Eventos de gasto (atômicos).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| campaign_id | UUID | FK |
| budget_id | UUID | FK |
| amount | INT | Valor |
| quantity | INT | Ex: 1000 impressões |
| unit | TEXT | impression, click, conversion |
| status | TEXT | pending, applied, failed |
| ledger_entry_id | UUID | FK → ledger_entries |

### ad_governance_limits
Limites de governança por tenant.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| tenant_id | UUID | Tenant |
| max_spend_per_day | INT | Limite diário |
| max_spend_per_campaign | INT | Limite por campanha |
| kill_switch | BOOL | Bloqueia tudo |

---

## DOMÍNIO: APPLICATION

### applications
Apps que integram com PROST-QS.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| name | TEXT | Nome |
| slug | TEXT | Slug (unique) |
| owner_id | UUID | Quem criou |
| status | TEXT | active, suspended, deleted |
| webhook_url | TEXT | URL de webhook |

### app_credentials
Credenciais de apps.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| app_id | UUID | FK |
| name | TEXT | Production, Development |
| public_key | TEXT | pq_pk_xxx (unique) |
| secret_hash | TEXT | Hash do secret |
| scopes | TEXT | JSON: ["identity", "billing"] |
| status | TEXT | active, revoked |

### app_users
Usuários dentro de um app.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| app_id | UUID | FK |
| user_id | UUID | FK → users |
| external_user_id | TEXT | ID no sistema do cliente |
| status | TEXT | active, suspended |

### app_sessions
Sessões de usuário em apps.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| app_id | UUID | FK |
| app_user_id | UUID | FK |
| user_id | UUID | FK |
| ip_address | TEXT | IP |
| status | TEXT | active, expired, revoked |

---

## DOMÍNIO: AGENT

### agents
Agentes governados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| tenant_id | UUID | Tenant |
| app_id | UUID | FK (opcional) |
| name | TEXT | Nome |
| type | TEXT | observer, operator, executor |
| status | TEXT | active, suspended |

### agent_policies
Políticas de agentes (o que podem fazer).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| agent_id | UUID | FK |
| domain | TEXT | ads, billing, etc |
| max_amount | INT | Limite financeiro |
| allowed_actions | TEXT | JSON array |
| requires_approval | BOOL | Precisa aprovação? |
| max_risk_score | FLOAT | Limite de risco |
| daily_limit | INT | Máximo ações/dia |

### agent_decisions
Decisões propostas por agentes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| agent_id | UUID | FK |
| app_id | UUID | FK (opcional) |
| domain | TEXT | Domínio |
| proposed_action | TEXT | Ação proposta |
| target_entity | TEXT | Ex: campaign:uuid |
| payload | TEXT | JSON com detalhes |
| risk_score | FLOAT | Score de risco |
| status | TEXT | proposed, approved, rejected, executed |
| reviewed_by | UUID | Humano que revisou |
| expires_at | DATETIME | Expiração |

### agent_execution_logs
Log de execuções (imutável).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| decision_id | UUID | FK |
| agent_id | UUID | FK |
| executed_by | TEXT | agent, human |
| action | TEXT | Ação executada |
| result | TEXT | success, failed |
| executed_at | DATETIME | Quando |

### agent_daily_stats
Estatísticas diárias de agentes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| agent_id | UUID | FK |
| date | TEXT | YYYY-MM-DD |
| actions_count | INT | Total ações |
| approved_count | INT | Aprovadas |
| rejected_count | INT | Rejeitadas |

---

## DOMÍNIO: OBSERVER (Fase 23-25)

### agent_memory
Memória de sugestões (append-only).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| agent | TEXT | observer_v1 |
| confidence | FLOAT | 0.0 - 1.0 |
| finding | TEXT | Observação |
| suggestion | TEXT | Sugestão |
| snapshot_hash | TEXT | Hash do snapshot |
| created_at | DATETIME | Quando gerado |

### human_decisions
Decisões humanas sobre sugestões.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| suggestion_id | UUID | FK → agent_memory |
| decision | TEXT | accepted, ignored, deferred |
| reason | TEXT | Justificativa (mín 3 chars) |
| human | TEXT | Quem decidiu |
| ip | TEXT | IP |
| user_agent | TEXT | User Agent |
| created_at | DATETIME | Quando |

---

## DOMÍNIO: POLICY

### policies
Políticas declarativas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| name | TEXT | Nome (unique) |
| version | INT | Versão |
| resource | TEXT | ledger, agent, *, etc |
| action | TEXT | debit, execute, *, etc |
| conditions | TEXT | JSON array de condições |
| effect | TEXT | allow, deny, require_approval |
| reason | TEXT | Explicação humana |
| priority | INT | Maior = avaliado primeiro |
| active | BOOL | Ativa? |

### policy_evaluations
Avaliações de políticas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| policy_id | UUID | FK |
| policy_name | TEXT | Nome |
| resource | TEXT | Recurso |
| action | TEXT | Ação |
| context | TEXT | JSON dados avaliados |
| result | TEXT | allowed, denied, pending_approval |
| reason | TEXT | Explicação |
| actor_id | UUID | Quem pediu |
| evaluated_at | DATETIME | Quando |

---

## DOMÍNIO: GOVERNANCE

### autonomy_profiles
Perfis de autonomia de agentes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| agent_id | UUID | FK (unique) |
| base_level | INT | 0=forbidden, 1=shadow, 2=audited, 3=full |
| action_overrides | TEXT | JSON map[action]level |
| max_daily_actions | INT | Limite diário |
| max_amount_per_action | INT | Limite por ação |

### shadow_executions
Execuções em shadow mode.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| agent_id | UUID | FK |
| domain | TEXT | Domínio |
| action | TEXT | Ação |
| intent | TEXT | JSON: o que quis fazer |
| simulation | TEXT | JSON: o que teria acontecido |
| reason | TEXT | Por que não aconteceu |
| created_at | DATETIME | Quando |

### decision_authorities
Autoridades de decisão.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK |
| role | TEXT | super_admin, tech_lead, finance_officer |
| title | TEXT | Título |
| scopes | TEXT | JSON escopos |
| max_impact | TEXT | none, low, medium, high, critical |
| granted_by | UUID | Quem concedeu |
| active | BOOL | Ativa? |
| expires_at | DATETIME | Expiração (opcional) |

### approval_requests
Solicitações de aprovação.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| domain | TEXT | billing, ads, config |
| action | TEXT | Ação |
| impact | TEXT | Nível de impacto |
| amount | INT | Valor envolvido |
| context | TEXT | JSON contexto |
| requested_by | UUID | Quem pediu |
| status | TEXT | pending, approved, rejected, expired |
| expires_at | DATETIME | Expiração |

### approval_decisions
Decisões de aprovação (imutável).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| request_id | UUID | FK |
| authority_id | UUID | FK |
| decided_by | UUID | Humano real |
| decision | TEXT | approved, rejected, escalated |
| justification | TEXT | OBRIGATÓRIO (mín 10 chars) |
| ip | TEXT | IP |
| user_agent | TEXT | User Agent |
| hash | TEXT | Hash de integridade |
| decided_at | DATETIME | Quando |

---

## DOMÍNIO: MEMORY (Memória Institucional)

### decision_lifecycles
Ciclo de vida de decisões.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| decision_id | UUID | FK (unique) |
| decision_type | TEXT | approval, authority_grant |
| state | TEXT | active, expired, superseded, revoked, under_review |
| expiration_type | TEXT | expires_at, expires_on_condition, review_required |
| expires_at | DATETIME | Expiração |
| next_review_at | DATETIME | Próxima revisão |
| domain | TEXT | Domínio |
| superseded_by | UUID | FK (se substituída) |

### decision_conflicts
Conflitos entre decisões.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| decision_a_id | UUID | FK |
| decision_b_id | UUID | FK |
| conflict_type | TEXT | resource, direction, scope, temporal |
| state | TEXT | detected, acknowledged, resolved, dissolved |
| description | TEXT | Descrição |
| prevailing_id | UUID | Qual prevaleceu |
| resolved_by | UUID | Quem resolveu |

### decision_precedents
Precedentes institucionais (memória, não autoridade).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| original_decision_id | UUID | FK (unique) |
| domain | TEXT | Domínio |
| action | TEXT | Ação |
| original_context | TEXT | JSON snapshot |
| observed_result | TEXT | JSON resultado |
| state | TEXT | active, deprecated, contested, archived |
| created_by | UUID | Quem criou |

### decision_reviews
Revisões de decisões.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| decision_id | UUID | FK |
| review_type | TEXT | periodic, context_change, policy_change |
| review_reason | TEXT | Motivo |
| outcome | TEXT | renewed, revoked, superseded, pending |
| decided_by | UUID | Quem decidiu |

### lifecycle_transitions
Log de transições de estado (imutável).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| decision_id | UUID | FK |
| from_state | TEXT | Estado anterior |
| to_state | TEXT | Estado novo |
| triggered_by | UUID | Quem/o que causou |
| triggered_by_type | TEXT | human, system, time |
| reason | TEXT | Motivo |
| hash | TEXT | Hash de integridade |

---

## DOMÍNIO: AUDIT

### audit_events
Log de auditoria (IMUTÁVEL, append-only).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| sequence | INT | Ordem global (auto) |
| type | TEXT | USER_CREATED, PAYMENT_CONFIRMED, etc |
| app_id | UUID | FK (opcional) |
| actor_id | UUID | Quem fez |
| actor_type | TEXT | user, agent, system, admin |
| target_id | UUID | O que foi afetado |
| target_type | TEXT | user, payment, ledger |
| action | TEXT | Ação |
| before | TEXT | JSON estado anterior |
| after | TEXT | JSON estado posterior |
| metadata | TEXT | JSON contexto |
| policy_id | UUID | FK (se aplicável) |
| reason | TEXT | Justificativa |
| ip | TEXT | IP |
| user_agent | TEXT | User Agent |
| previous_hash | TEXT | Hash do evento anterior |
| hash | TEXT | Hash deste evento (unique) |
| created_at | DATETIME | Imutável |

---

## DOMÍNIO: RISK

### risk_scores
Scores de risco calculados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| app_id | UUID | FK |
| agent_id | UUID | FK (opcional) |
| score | FLOAT | 0.0 - 1.0 |
| level | TEXT | low, medium, high, critical |
| factors | TEXT | JSON fatores |
| calculated_at | DATETIME | Quando |

### risk_history
Histórico de scores.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| app_id | UUID | FK |
| score | FLOAT | Score |
| level | TEXT | Nível |
| factors | TEXT | JSON |
| created_at | DATETIME | Quando |

### risk_configs
Configuração de risco por app.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| app_id | UUID | FK (unique) |
| custom_weights | TEXT | JSON pesos customizados |
| thresholds | TEXT | JSON limites |

---

## DOMÍNIO: INFRASTRUCTURE

### jobs
Fila de jobs interna.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| type | TEXT | webhook, stripe_sync, reconcile |
| payload | TEXT | JSON |
| status | TEXT | pending, processing, done, failed |
| priority | INT | Prioridade |
| attempts | INT | Tentativas |
| max_attempts | INT | Máximo tentativas |
| last_error | TEXT | Último erro |
| next_run_at | DATETIME | Próxima execução |

### dead_letter_jobs
Jobs que falharam permanentemente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| original_job_id | UUID | FK |
| type | TEXT | Tipo |
| payload | TEXT | JSON |
| attempts | INT | Tentativas |
| last_error | TEXT | Erro |
| failed_at | DATETIME | Quando falhou |

### secrets
Segredos criptografados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| app_id | UUID | FK (opcional, nil = global) |
| name | TEXT | Nome |
| type | TEXT | api_key, oauth_token, encryption_key |
| encrypted_value | TEXT | Valor criptografado (AES-256) |
| environment | TEXT | production, staging, development |
| version | INT | Versão |
| status | TEXT | active, rotated, revoked |
| expires_at | DATETIME | Expiração (opcional) |

### kill_switches
Controles de emergência.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| scope | TEXT | all, billing, agents, ads, jobs (unique) |
| active | BOOL | Ativo? |
| reason | TEXT | Motivo |
| activated_by | UUID | Quem ativou |
| expires_at | DATETIME | Expiração (opcional) |

---

## QUERIES ÚTEIS PARA DASHBOARD

```sql
-- Total de tabelas por domínio
-- (executar manualmente para verificar)

-- Contagem de registros principais
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM billing_accounts) as billing_accounts,
  (SELECT COUNT(*) FROM applications) as applications,
  (SELECT COUNT(*) FROM agents) as agents,
  (SELECT COUNT(*) FROM audit_events) as audit_events,
  (SELECT COUNT(*) FROM agent_memory) as agent_memory,
  (SELECT COUNT(*) FROM human_decisions) as human_decisions;

-- Atividade últimas 24h
SELECT 
  (SELECT COUNT(*) FROM audit_events WHERE created_at >= datetime('now', '-24 hours')) as audit_24h,
  (SELECT COUNT(*) FROM agent_memory WHERE created_at >= datetime('now', '-24 hours')) as suggestions_24h,
  (SELECT COUNT(*) FROM human_decisions WHERE created_at >= datetime('now', '-24 hours')) as decisions_24h;

-- Kill switches ativos
SELECT scope, reason, activated_by, activated_at 
FROM kill_switches 
WHERE active = 1;

-- Sugestões pendentes (sem decisão)
SELECT COUNT(*) as pending
FROM agent_memory am
LEFT JOIN human_decisions hd ON am.id = hd.suggestion_id
WHERE hd.id IS NULL;
```

---

## ÍNDICES IMPORTANTES

| Tabela | Índice | Colunas |
|--------|--------|---------|
| audit_events | idx_audit_app | app_id |
| audit_events | idx_audit_created | created_at |
| agent_memory | idx_agent_memory_agent | agent |
| agent_memory | idx_agent_memory_created | created_at |
| human_decisions | idx_human_decisions_suggestion | suggestion_id |
| ledger_entries | idx_ledger_account | account_id |
| ledger_entries | idx_ledger_created | created_at |

---

## TABELAS IMUTÁVEIS (APPEND-ONLY)

Estas tabelas NUNCA sofrem UPDATE ou DELETE:

1. `audit_events` — Log de auditoria
2. `ledger_entries` — Ledger financeiro
3. `agent_memory` — Memória de sugestões
4. `human_decisions` — Decisões humanas
5. `approval_decisions` — Decisões de aprovação
6. `lifecycle_transitions` — Transições de estado
7. `agent_execution_logs` — Log de execuções

---

*Documento gerado em 29/12/2025*
*Fase 26.5 — Expansão de Observabilidade*
