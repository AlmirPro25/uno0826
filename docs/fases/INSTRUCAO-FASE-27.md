# FASE 27 — CALIBRAÇÃO COGNITIVA CONTROLADA

## Definição

**Ajustar o sistema com base em evidência humana registrada, sem quebrar nenhum invariante.**

Você não adiciona inteligência nova. Você corrige a mira do que já existe.

---

## O QUE A FASE 27 NÃO É

❌ Não é "aprender sozinho"
❌ Não é machine learning
❌ Não é LLM decidindo
❌ Não é feedback automático
❌ Não é agir sem humano

A Fase 27 é **cirurgia de precisão**, não evolução orgânica.

---

## CRITÉRIOS DE ENTRADA (GATE)

Só entra na Fase 27 se **TODOS** forem verdadeiros:

### Gate 1 — Volume Mínimo de Decisões

```
≥ 50 decisões humanas registradas
OU
≥ 14 dias consecutivos de operação assistida
```

**Query SQL:**
```sql
-- Contar decisões totais
SELECT COUNT(*) as total_decisions FROM human_decisions;

-- Verificar dias de operação
SELECT 
  MIN(created_at) as first_decision,
  MAX(created_at) as last_decision,
  JULIANDAY(MAX(created_at)) - JULIANDAY(MIN(created_at)) as days_operating
FROM human_decisions;
```

**Se não tiver → dados insuficientes. Continuar na Fase 26.**

---

### Gate 2 — Diversidade de Decisões

Distribuição mínima aceitável:
- `accepted` ≥ 30%
- `ignored` ≥ 20%
- `deferred` ≥ 10%

**Query SQL:**
```sql
SELECT 
  decision,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM human_decisions), 1) as percentage
FROM human_decisions
GROUP BY decision
ORDER BY count DESC;
```

**Interpretação:**
- Tudo `accepted` → sistema fala pouco demais
- Tudo `ignored` → sistema fala demais
- Ambos são sinais ruins

---

### Gate 3 — Reasons Não-Triviais

```
≥ 70% das decisões têm reason ≥ 20 caracteres
E contêm informação contextual real
```

**Query SQL:**
```sql
-- Porcentagem de reasons com ≥ 20 caracteres
SELECT 
  ROUND(
    SUM(CASE WHEN LENGTH(reason) >= 20 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
    1
  ) as pct_rich_reasons,
  COUNT(*) as total
FROM human_decisions;

-- Ver reasons curtas (possíveis triviais)
SELECT reason, LENGTH(reason) as len, COUNT(*) as count
FROM human_decisions
WHERE LENGTH(reason) < 20
GROUP BY reason
ORDER BY count DESC
LIMIT 20;
```

**Red flags (reasons triviais):**
- "ok"
- "nada a ver"
- "vou ver depois"
- "teste"

---

### Gate 4 — Zero Violação de Invariantes

Durante toda a Fase 26:
- ❌ Nenhuma mutação de estado causada por agente
- ❌ Nenhuma dependência de decisão para funcionamento core
- ❌ Nenhum crash ao desligar `AGENTS_ENABLED`

**Verificação manual:**
```bash
# Testar kill switch
AGENTS_ENABLED=false go run ./cmd/api

# Verificar que API funciona normalmente
curl http://localhost:8080/health
curl http://localhost:8080/ready
curl http://localhost:8080/api/v1/identity/me  # (com auth)
```

---

## CHECKLIST DE ENTRADA

```
[ ] ≥ 50 decisões humanas OU ≥ 14 dias de operação
[ ] accepted ≥ 30%
[ ] ignored ≥ 20%  
[ ] deferred ≥ 10%
[ ] ≥ 70% reasons com ≥ 20 caracteres
[ ] Zero violação de invariantes
[ ] Kill switch testado e funcional
```

**Se algum falhou → NÃO ENTRAR. Continuar coletando dados.**

---

## AÇÕES PERMITIDAS NA FASE 27

### Ação 1 — Ajustar Thresholds

**Exemplo:**
```go
// ANTES
if errorRate > 0.1 { // 10%

// DEPOIS  
if errorRate > 0.15 { // 15%
```

**Regras:**
- Sempre documentar o "antes"
- Sempre justificar com decisões humanas reais
- Criar registro de calibração

**Query para justificar:**
```sql
-- Ver decisões sobre erros elevados
SELECT 
  am.finding,
  hd.decision,
  hd.reason,
  hd.created_at
FROM human_decisions hd
JOIN agent_memory am ON hd.suggestion_id = am.id
WHERE am.finding LIKE '%erro%'
ORDER BY hd.created_at DESC;
```

---

### Ação 2 — Reclassificar Severidade

Pode mudar:
- Confidence mínima para gerar sugestão
- Wording da sugestão
- Prioridade visual no console

**NÃO pode:**
- Remover regra sem justificativa
- Adicionar regra nova (ainda)

---

### Ação 3 — Silenciar Padrões Ruidosos

**Exemplo:**
```go
// Ignorar erros durante startup
if snapshot.Metrics.UptimeSeconds < 60 {
    // Não gerar sugestão de erro elevado
    return
}
```

**Query para identificar ruído:**
```sql
-- Sugestões mais ignoradas
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

---

## CRITÉRIOS DE SUCESSO DA FASE 27

### Sucesso 1 — Redução de Ruído ≥ 30%

**Métrica:**
```
ANTES: ignored / total_suggestions
DEPOIS: ignored / total_suggestions
```

**Query SQL (comparar períodos):**
```sql
-- Taxa de ignored ANTES da calibração (ex: primeiros 7 dias)
SELECT 
  ROUND(
    SUM(CASE WHEN decision = 'ignored' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    1
  ) as ignored_rate_before
FROM human_decisions
WHERE created_at < DATE('now', '-7 days');

-- Taxa de ignored DEPOIS da calibração (últimos 7 dias)
SELECT 
  ROUND(
    SUM(CASE WHEN decision = 'ignored' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    1
  ) as ignored_rate_after
FROM human_decisions
WHERE created_at >= DATE('now', '-7 days');
```

**Meta: redução ≥ 30%**

---

### Sucesso 2 — Tempo Médio de Decisão Menor

**Query SQL:**
```sql
-- Tempo médio entre sugestão e decisão (em horas)
SELECT 
  AVG(
    (JULIANDAY(hd.created_at) - JULIANDAY(am.created_at)) * 24
  ) as avg_response_hours
FROM human_decisions hd
JOIN agent_memory am ON hd.suggestion_id = am.id;
```

**Meta: ↓ pelo menos 20%**

Menos ruído = decisões mais rápidas.

---

### Sucesso 3 — Nenhum Aumento de Risco

Verificar manualmente:
- Incidentes reais não detectados
- Erros que passaram despercebidos
- Problemas não sinalizados

**Se o sistema "ficou quieto demais" → calibração falhou.**

---

### Sucesso 4 — Humano Confia Mais

Proxy mensurável:
- Mais `accepted`
- Menos `ignored`
- Reasons mais longas e específicas

**Query SQL:**
```sql
-- Evolução da confiança ao longo do tempo
SELECT 
  DATE(created_at) as day,
  SUM(CASE WHEN decision = 'accepted' THEN 1 ELSE 0 END) as accepted,
  SUM(CASE WHEN decision = 'ignored' THEN 1 ELSE 0 END) as ignored,
  AVG(LENGTH(reason)) as avg_reason_length
FROM human_decisions
GROUP BY DATE(created_at)
ORDER BY day;
```

**Sinal de vitória:**
Reasons como: "Boa observação, eu não tinha visto isso"

---

## CHECKLIST DE SUCESSO

```
[ ] Redução de ruído ≥ 30%
[ ] Tempo médio de decisão ↓ ≥ 20%
[ ] Nenhum aumento de risco operacional
[ ] Tendência de accepted subindo
[ ] Reasons ficando mais específicas
```

---

## REGISTRO DE CALIBRAÇÃO

Toda mudança deve ser registrada:

```markdown
## Calibração #001
- Data: YYYY-MM-DD
- Regra: high_error_rate
- Antes: errorRate > 0.10
- Depois: errorRate > 0.15
- Justificativa: 23 decisões "ignored" com reason "erro de startup"
- Decisões base: [IDs das decisões]
```

---

## O QUE VEM DEPOIS

### Caminho A — Fase 28: Agentes Especializados
- LatencyObserver
- DriftObserver
- SecurityObserver
- Sempre read-only

### Caminho B — LLM como Narrador
- Resumir histórico
- Explicar padrões
- Gerar relatórios
- **Nunca decidir**

### Caminho C — Congelamento e Certificação
- Documentar
- Auditar
- Certificar
- Usar em produção real

---

## REGRA DE OURO

> Se você não consegue justificar uma mudança citando decisões humanas reais, você ainda não pode fazer essa mudança.

A Fase 27 não é sobre inteligência. É sobre **humildade epistemológica**.

---

## QUERIES ÚTEIS (REFERÊNCIA RÁPIDA)

```sql
-- Status geral
SELECT 
  COUNT(*) as total_decisions,
  SUM(CASE WHEN decision = 'accepted' THEN 1 ELSE 0 END) as accepted,
  SUM(CASE WHEN decision = 'ignored' THEN 1 ELSE 0 END) as ignored,
  SUM(CASE WHEN decision = 'deferred' THEN 1 ELSE 0 END) as deferred
FROM human_decisions;

-- Sugestões mais frequentes
SELECT finding, COUNT(*) as count
FROM agent_memory
GROUP BY finding
ORDER BY count DESC
LIMIT 10;

-- Sugestões nunca decididas
SELECT am.*
FROM agent_memory am
LEFT JOIN human_decisions hd ON am.id = hd.suggestion_id
WHERE hd.id IS NULL
ORDER BY am.created_at DESC
LIMIT 20;

-- Humanos mais ativos
SELECT human, COUNT(*) as decisions
FROM human_decisions
GROUP BY human
ORDER BY decisions DESC;

-- Confiança média por tipo de decisão
SELECT 
  hd.decision,
  AVG(am.confidence) as avg_confidence
FROM human_decisions hd
JOIN agent_memory am ON hd.suggestion_id = am.id
GROUP BY hd.decision;
```

---

*Documento criado em 29/12/2025*
*PROST-QS - Fase 27 (Calibração Cognitiva Controlada)*
*Status: AGUARDANDO GATES DA FASE 26*
