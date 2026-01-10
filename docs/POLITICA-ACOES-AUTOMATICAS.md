# PROST-QS — Política de Ações Automáticas

**Data:** 10 de Janeiro de 2026  
**Status:** ATIVO  
**Versão:** 2.0

---

## Princípio Fundamental

> O sistema pode agir sozinho, mas dentro de limites explícitos.
> Humano supervisiona. Sistema executa. Política governa.

> "Poder sem autoridade é caos. Autoridade sem limite é tirania."

---

## Classificação de Ações

### ✅ Automáticas (sem intervenção humana)

| Ação | Descrição | Blast Radius | Duração Máx |
|------|-----------|--------------|-------------|
| `alert` | Criar alertas | App | Ilimitado |
| `webhook` | Chamar URL externa | App | - |
| `flag` | Marcar usuário/sessão | Feature | 7 dias |
| `adjust` | Alterar config | Config | 24 horas |
| `create_rule` | Criar regra temporária | App | 24 horas |
| `escalate` | Escalar severidade | App | - |
| `notify` | Enviar notificação | App | - |

### ⚠️ Requerem Confirmação

| Ação | Descrição | Motivo |
|------|-----------|--------|
| `disable_rule` | Desativar outra regra | Pode ter efeitos colaterais |

### ❌ Nunca Automáticas (PROIBIDAS)

| Ação | Motivo |
|------|--------|
| `billing.charge` | Impacto financeiro direto |
| `billing.refund` | Impacto financeiro direto |
| `user.delete` | Irreversível |
| `user.ban_permanent` | Irreversível |
| `app.delete` | Irreversível |
| `app.suspend` | Impacto crítico |
| `data.export` | Privacidade |
| `data.delete` | Irreversível |
| `auth.revoke_all` | Impacto crítico |
| `platform.shutdown` | Impacto total |

---

## Blast Radius (Escopo de Impacto)

Toda ação consequente tem um escopo máximo definido:

| Escopo | Descrição | Exemplo |
|--------|-----------|---------|
| `config` | Uma configuração | `ads_frequency` |
| `feature` | Uma feature do app | `video_chat` |
| `app` | Todo o app | VOX-BRIDGE |
| `platform` | Toda a plataforma | PROST-QS |

**Regra:** Ações automáticas nunca podem ter escopo `platform`.

---

## Kill Switch Global

### O que é
Botão de emergência que **pausa todas as ações automáticas** instantaneamente.

### Quando usar
- Comportamento inesperado do sistema
- Incidente em produção
- Manutenção crítica
- Dúvida sobre segurança

### Endpoints
```
GET  /admin/rules/killswitch           → Status atual
POST /admin/rules/killswitch/activate  → Ativar (pausar tudo)
POST /admin/rules/killswitch/deactivate → Desativar (retomar)
```

### Exemplo de ativação
```json
POST /admin/rules/killswitch/activate
{
  "reason": "Comportamento anômalo detectado",
  "auto_resume_after": "1h"
}
```

### Auto-resume
O kill switch pode ter tempo de expiração automático. Se não especificado, permanece ativo até desativação manual.

---

## Pausa por Tipo de Ação

Além do kill switch global, é possível pausar tipos específicos de ação:

```
POST /admin/rules/actions/webhook/pause   → Pausa só webhooks
POST /admin/rules/actions/webhook/resume  → Retoma webhooks
```

Útil para:
- Manutenção de sistema externo
- Debugging de ação específica
- Controle granular

---

## Shadow Mode — Observar sem Agir

### O que é
Modo de operação que **simula ações sem executá-las**. Essencial para testar regras em produção sem risco.

### Quando usar
- Antes de ativar regras novas em produção
- Para calibrar thresholds
- Para entender impacto de mudanças
- Durante período de observação (72h)

### Endpoints
```
GET  /admin/rules/shadow              → Status do shadow mode
POST /admin/rules/shadow/activate     → Ativar
POST /admin/rules/shadow/deactivate   → Desativar
GET  /admin/rules/shadow/executions   → Execuções simuladas
GET  /admin/rules/shadow/stats        → Estatísticas
```

### Ativação com Filtros
```json
POST /admin/rules/shadow/activate
{
  "reason": "Testando novas regras de churn",
  "duration": "24h",
  "app_ids": ["c573e4f0-a738-400c-a6bc-d890360a0057"],
  "action_types": ["adjust", "create_rule"],
  "domains": ["business", "governance"]
}
```

### O que é registrado
| Campo | Descrição |
|-------|-----------|
| `rule_name` | Regra que dispararia |
| `action_type` | Ação que seria executada |
| `would_be_allowed` | Se seria permitida pela política |
| `would_block_reason` | Motivo do bloqueio (se aplicável) |
| `trigger_data` | Métricas que triggaram |
| `simulated_result` | Resultado simulado |

### Estatísticas
```
GET /admin/rules/shadow/stats?since=24h
```
Retorna:
- Total de execuções simuladas
- Quantas seriam executadas
- Quantas seriam bloqueadas
- Distribuição por domínio

---

## Authority Levels — Quem Pode Fazer o Quê

### Hierarquia de Autoridade

| Nível | Rank | Descrição |
|-------|------|-----------|
| `observer` | 1 | Pode ver, não pode agir |
| `suggestor` | 2 | Pode sugerir ações (shadow mode) |
| `operator` | 3 | Pode executar ações operacionais |
| `manager` | 4 | Pode mudar regras e configs |
| `governor` | 5 | Pode mudar políticas |
| `sovereign` | 6 | Pode desligar o sistema |

### Domínios de Ação

| Domínio | Autoridade Mínima | Exemplos |
|---------|-------------------|----------|
| `tech` | operator | throttle, cache, retry, webhook |
| `business` | manager | campanha, pricing, feature flag |
| `governance` | governor | create_rule, disable_rule, políticas |
| `ops` | operator | alertas, escalação, notificação |

### Mapeamento Ação → Domínio

| Ação | Domínio |
|------|---------|
| `alert` | ops |
| `webhook` | tech |
| `flag` | business |
| `notify` | ops |
| `adjust` | tech |
| `create_rule` | governance |
| `disable_rule` | governance |
| `escalate` | ops |

### Endpoints
```
GET  /admin/rules/authority/levels    → Níveis disponíveis
GET  /admin/rules/authority/domains   → Domínios de ação
POST /admin/rules/authority/check     → Verificar autoridade
```

### Verificação de Autoridade
```json
// Request
POST /admin/rules/authority/check
{
  "actor_level": "operator",
  "action_type": "create_rule"
}

// Response
{
  "actor_level": "operator",
  "action_type": "create_rule",
  "action_domain": "governance",
  "required_level": "governor",
  "has_authority": false
}
```

---

## Auditoria Completa

Toda ação (executada ou bloqueada) é registrada em `action_audit_logs`:

| Campo | Descrição |
|-------|-----------|
| `was_allowed` | Se passou na validação |
| `block_reason` | Motivo do bloqueio (se bloqueada) |
| `was_executed` | Se foi executada com sucesso |
| `triggered_by` | Origem (rule, manual, api) |

### Endpoint
```
GET /admin/rules/audit?app_id=xxx&action_type=webhook&was_allowed=false
```

---

## Regras de Ouro

1. **Alertas são sempre seguros** — Criar alerta nunca causa dano
2. **Configs são temporárias** — Ajustes automáticos expiram em 24h
3. **Meta-regras criam regras temporárias** — Nunca permanentes
4. **Billing nunca é automático** — Sempre requer humano
5. **Deleção nunca é automática** — Sempre requer humano
6. **Kill switch é instantâneo** — Não espera confirmação
7. **Shadow mode antes de produção** — Teste antes de ativar
8. **Autoridade define escopo** — Cada nível tem seu limite

---

## Fluxo de Validação de Ação

```
Regra dispara
     │
     ▼
┌─────────────────┐
│ Shadow Mode?    │──► SIM ──► Registra simulação, não executa
└────────┬────────┘
         │ NÃO
         ▼
┌─────────────────┐
│ Kill Switch?    │──► SIM ──► Bloqueia, registra
└────────┬────────┘
         │ NÃO
         ▼
┌─────────────────┐
│ Ação pausada?   │──► SIM ──► Bloqueia, registra
└────────┬────────┘
         │ NÃO
         ▼
┌─────────────────┐
│ Política OK?    │──► NÃO ──► Bloqueia, registra
└────────┬────────┘
         │ SIM
         ▼
┌─────────────────┐
│ Executa ação    │──► Registra resultado
└─────────────────┘
```

---

## Evolução da Política

Esta política pode evoluir conforme o sistema amadurece:

1. **Fase atual:** Conservadora (mais restrições)
2. **Fase futura:** Baseada em confiança (métricas de sucesso)
3. **Fase madura:** Adaptativa (limites dinâmicos)

Mudanças na política requerem:
- Documentação prévia
- Revisão de impacto
- Período de observação

---

*Documento atualizado em 10/01/2026*
*Propósito: Governança de ações automáticas*
*Revisão: Mensal ou após incidentes*
*Versão: 2.0 — Shadow Mode + Authority Levels*
