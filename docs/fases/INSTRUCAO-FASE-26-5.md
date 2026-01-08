# FASE 26.5 — EXPANSÃO DE OBSERVABILIDADE & CONTROLE

## Definição

**Tornar o sistema completamente legível para o humano, sem alterar lógica, regras, thresholds ou comportamento.**

Observabilidade ≠ Interferência.

---

## O QUE ESTA FASE NÃO É

❌ Não é calibração de inteligência
❌ Não é alteração de agentes
❌ Não é interferência no core
❌ Não é Fase 27

---

## O QUE CONTINUA PROIBIDO

- Ajustar heurísticas
- Ajustar thresholds
- Silenciar regras
- Criar agentes novos
- Inserir LLM no loop decisório
- Aprender com dados

---

## O QUE PASSA A SER PERMITIDO

✅ Criar dashboards
✅ Criar queries novas
✅ Criar views SQL
✅ Criar materializações
✅ Criar UX de inspeção
✅ Criar mapas do sistema
✅ Criar narrativas explicativas (read-only)

---

## ENTREGAS DA FASE 26.5

### 1. DATA-CATALOG.md ✅
Inventário completo de todas as tabelas:
- 45+ tabelas mapeadas
- 12 domínios funcionais
- Colunas, tipos, descrições
- Queries úteis
- Índices importantes
- Tabelas imutáveis identificadas

### 2. Dashboard Admin — Tela Inicial
A Home do Admin deve responder em 30 segundos:
- O sistema está saudável?
- Os agentes estão úteis ou ruidosos?
- Estou confiando mais ou menos neles?
- Onde está o ruído?
- Onde está o valor?

**KPIs mínimos:**
- Sugestões/dia
- Accepted / Ignored / Deferred
- Tempo médio de decisão
- Top 5 findings
- Top 5 ignorados
- Suggestions sem decisão
- Kill switch status

### 3. Telas de Inspeção Profunda
Criar páginas read-only:
- `/admin/agents` — Status dos agentes
- `/admin/decisions` — Histórico de decisões
- `/admin/findings` — Findings mais comuns
- `/admin/noise` — Padrões de ruído
- `/admin/trust` — Evolução da confiança

### 4. Views SQL & Materializações
Criar queries nomeadas para:
- Status geral do sistema
- Distribuição de decisões
- Tendências temporais
- Identificação de ruído
- Métricas de confiança

---

## ENDPOINTS NOVOS (READ-ONLY)

```
GET /api/v1/admin/cognitive/dashboard   → KPIs principais (sugestões, decisões, pendentes, distribuição, tempo médio, top findings, top ignorados, kill switches)
GET /api/v1/admin/cognitive/agents      → Status dos agentes (sugestões por agente, taxa de aceitação, confiança média)
GET /api/v1/admin/cognitive/decisions   → Estatísticas de decisões (por tipo, por humano, últimas 24h/7d)
GET /api/v1/admin/cognitive/findings    → Top findings (com ?limit=N)
GET /api/v1/admin/cognitive/noise       → Padrões de ruído (findings mais ignorados, taxa de ignore)
GET /api/v1/admin/cognitive/trust       → Evolução da confiança (com ?days=N, tendência)
```

---

## QUERIES SQL PARA DASHBOARD

### Status Geral
```sql
SELECT 
  (SELECT COUNT(*) FROM agent_memory) as total_suggestions,
  (SELECT COUNT(*) FROM human_decisions) as total_decisions,
  (SELECT COUNT(*) FROM agent_memory WHERE created_at >= datetime('now', '-24 hours')) as suggestions_24h,
  (SELECT COUNT(*) FROM human_decisions WHERE created_at >= datetime('now', '-24 hours')) as decisions_24h;
```

### Distribuição de Decisões
```sql
SELECT 
  decision,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM human_decisions), 1) as percentage
FROM human_decisions
GROUP BY decision
ORDER BY count DESC;
```

### Top Findings
```sql
SELECT 
  finding,
  COUNT(*) as occurrences,
  AVG(confidence) as avg_confidence
FROM agent_memory
GROUP BY finding
ORDER BY occurrences DESC
LIMIT 10;
```

### Padrões de Ruído (mais ignorados)
```sql
SELECT 
  am.finding,
  COUNT(*) as times_ignored
FROM human_decisions hd
JOIN agent_memory am ON hd.suggestion_id = am.id
WHERE hd.decision = 'ignored'
GROUP BY am.finding
ORDER BY times_ignored DESC
LIMIT 10;
```

### Evolução da Confiança
```sql
SELECT 
  DATE(created_at) as day,
  SUM(CASE WHEN decision = 'accepted' THEN 1 ELSE 0 END) as accepted,
  SUM(CASE WHEN decision = 'ignored' THEN 1 ELSE 0 END) as ignored,
  SUM(CASE WHEN decision = 'deferred' THEN 1 ELSE 0 END) as deferred,
  AVG(LENGTH(reason)) as avg_reason_length
FROM human_decisions
GROUP BY DATE(created_at)
ORDER BY day DESC
LIMIT 30;
```

### Sugestões Pendentes
```sql
SELECT 
  am.id,
  am.agent,
  am.finding,
  am.confidence,
  am.created_at
FROM agent_memory am
LEFT JOIN human_decisions hd ON am.id = hd.suggestion_id
WHERE hd.id IS NULL
ORDER BY am.created_at DESC
LIMIT 50;
```

### Kill Switches Ativos
```sql
SELECT 
  scope,
  reason,
  activated_at,
  expires_at
FROM kill_switches
WHERE active = 1;
```

### Tempo Médio de Decisão
```sql
SELECT 
  AVG(
    (JULIANDAY(hd.created_at) - JULIANDAY(am.created_at)) * 24
  ) as avg_hours_to_decide
FROM human_decisions hd
JOIN agent_memory am ON hd.suggestion_id = am.id;
```

---

## CHECKLIST DE CONCLUSÃO

```
[x] DATA-CATALOG.md criado
[x] Endpoint /admin/cognitive/dashboard implementado
[x] Endpoint /admin/cognitive/agents implementado
[x] Endpoint /admin/cognitive/decisions implementado
[x] Endpoint /admin/cognitive/findings implementado
[x] Endpoint /admin/cognitive/noise implementado
[x] Endpoint /admin/cognitive/trust implementado
[x] Tela Admin Dashboard no frontend
[x] Queries SQL documentadas e testadas
[x] Zero alteração em lógica de negócio
[x] Zero alteração em heurísticas
```

---

## CRITÉRIO DE SUCESSO

A Fase 26.5 está completa quando:

1. **Humano entende o sistema sem Gemini**
2. **Dashboard responde perguntas sozinho**
3. **Todas as métricas da Fase 27 são calculáveis**
4. **Zero código de lógica foi alterado**

---

## PRÓXIMO PASSO APÓS 26.5

Quando a Fase 26.5 estiver completa:
- Continuar operando na Fase 26
- Coletar dados via dashboard
- Rodar queries semanalmente
- Quando gates da Fase 27 fecharem → avançar

---

## SOBRE O GEMINI

**Critério objetivo para Gemini entrar:**
1. O humano entende o sistema sem Gemini
2. O dashboard responde perguntas sozinho
3. O Gemini entra apenas para:
   - Resumir
   - Narrar
   - Explicar padrões
   - Gerar relatórios

**Gemini entra como copiloto cognitivo, não como cérebro.**

---

*Documento criado em 29/12/2025*
*PROST-QS - Fase 26.5 (Expansão de Observabilidade)*
