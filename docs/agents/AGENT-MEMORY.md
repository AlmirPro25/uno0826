# AGENT MEMORY - PROST-QS

## Fase 24 - Memória Passiva de Agentes

---

## O QUE É

Agent Memory é um sistema de **persistência passiva** de sugestões geradas pelos agentes observers.

O sistema **lembra**, mas **não aprende**.

---

## O QUE NÃO É

❌ **Não é aprendizado** - Memória não influencia decisões futuras
❌ **Não é automação** - Memória não dispara ações
❌ **Não é cache** - Memória é persistente, não volátil
❌ **Não é log de auditoria** - Memória é específica para sugestões de agentes
❌ **Não é feedback loop** - Memória não retroalimenta o agente

---

## POR QUE EXISTE

1. **Histórico observável** - Ver o que o agente sugeriu ao longo do tempo
2. **Análise humana** - Permitir que humanos identifiquem padrões
3. **Validação de qualidade** - Verificar se sugestões fazem sentido
4. **Preparação para Human-in-the-Loop** - Base para UI de decisão futura
5. **Debugging** - Entender comportamento do agente em retrospecto

---

## CARACTERÍSTICAS

### Append-Only
- Entradas são apenas adicionadas
- Nunca sobrescreve
- Nunca deleta automaticamente

### Isolada do Core
- Tabela separada (`agent_memory`)
- Repositório separado
- Nenhuma dependência circular
- **Se apagar a memória, o sistema continua 100% funcional**

### Read-Only para Consulta
- Endpoints apenas de leitura
- Sem edição via API
- Sem delete via API

### Kill Switch Independente
- `AGENT_MEMORY_ENABLED=false` desabilita persistência
- Agente continua rodando
- Sugestões continuam existindo em memória volátil
- Nada é persistido

---

## ENDPOINTS

### GET /agents/memory
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

### GET /agents/memory/:agent
Lista entradas de um agente específico.

### GET /agents/memory/stats
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
  },
  "metrics": {
    "agent_suggestions_total": 150,
    "agent_memory_entries_total": 150,
    "agent_memory_write_failures_total": 0
  }
}
```

---

## MÉTRICAS

| Métrica | Descrição |
|---------|-----------|
| `agent_suggestions_total` | Total de sugestões geradas |
| `agent_memory_entries_total` | Total de entradas persistidas |
| `agent_memory_write_failures_total` | Falhas de escrita |

---

## CONFIGURAÇÃO

### Variáveis de Ambiente

```bash
# Habilitar memória de agentes
AGENT_MEMORY_ENABLED=true

# Habilitar agentes (independente)
AGENTS_ENABLED=true
```

### Comportamento

| AGENTS_ENABLED | AGENT_MEMORY_ENABLED | Resultado |
|----------------|----------------------|-----------|
| true | true | Agente roda, sugestões persistidas |
| true | false | Agente roda, sugestões NÃO persistidas |
| false | true | Agente NÃO roda, memória vazia |
| false | false | Agente NÃO roda, memória vazia |

---

## LIMITES EXPLÍCITOS

1. **Sem influência em decisões** - Memória nunca é consultada para tomar decisões
2. **Sem aprendizado** - Agente não usa memória para melhorar
3. **Sem automação** - Memória não dispara ações
4. **Sem retenção infinita** - Considerar política de retenção futura
5. **Sem dados sensíveis** - Memória contém apenas sugestões agregadas

---

## RISCOS CONHECIDOS

| Risco | Mitigação |
|-------|-----------|
| Crescimento infinito | Política de retenção futura |
| Falso senso de inteligência | Documentação clara de limites |
| Dependência acidental | Isolamento arquitetural |
| Vazamento de dados | Sugestões não contêm dados pessoais |

---

## MODELO DE DADOS

```sql
CREATE TABLE agent_memory (
  id TEXT PRIMARY KEY,
  agent TEXT NOT NULL,
  confidence REAL NOT NULL,
  finding TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  snapshot_hash TEXT NOT NULL,
  created_at DATETIME NOT NULL
);

CREATE INDEX idx_agent_memory_agent ON agent_memory(agent);
CREATE INDEX idx_agent_memory_created_at ON agent_memory(created_at);
CREATE INDEX idx_agent_memory_snapshot_hash ON agent_memory(snapshot_hash);
```

---

## INVARIANTES

1. **Append-only** - Nunca UPDATE, nunca DELETE automático
2. **Isolamento** - Core funciona sem memória
3. **Read-only API** - Sem mutação via endpoints
4. **Kill switch** - Desligável sem impacto

---

*Documento criado em 29/12/2024 - Fase 24*
