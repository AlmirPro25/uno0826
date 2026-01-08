# HUMAN-IN-THE-LOOP CONSOLE - PROST-QS

## Fase 25 - Console Minimalista

---

## O QUE É

O Console é um **instrumento cognitivo** para humanos observarem e decidirem sobre sugestões de agentes.

O humano:
- **Vê** - sugestões, tendências, saúde
- **Compara** - histórico, padrões
- **Decide** - aceitar, ignorar, adiar
- **Aprende** - com o sistema

O sistema:
- **Sugere** - nunca ordena
- **Registra** - toda decisão
- **Audita** - quem, quando, por quê
- **Nunca executa** - decisão é do humano

---

## O QUE NÃO É

❌ **Não é dashboard bonito** - É instrumento de decisão
❌ **Não é automação** - Humano decide, sistema registra
❌ **Não é feedback loop** - Decisões não retroalimentam agente
❌ **Não é controle operacional** - Não executa, não altera estado

---

## ENDPOINTS

### GET /console
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

### POST /decisions
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

### GET /decisions
Listar decisões humanas.

**Query params:**
- `limit` - Limite de resultados (default: 100)
- `human` - Filtrar por humano

### GET /decisions/stats
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

---

## TIPOS DE DECISÃO

| Tipo | Significado | Ação do Humano |
|------|-------------|----------------|
| `accepted` | Aceito | Vai agir manualmente |
| `ignored` | Ignorado | Não relevante |
| `deferred` | Adiado | Vai analisar depois |

---

## FLUXO DE USO

```
1. Humano acessa GET /console
2. Vê sugestões recentes e tendências
3. Identifica sugestão relevante
4. Registra decisão via POST /decisions
5. Age manualmente (se necessário)
6. Sistema registra tudo para auditoria
```

---

## INVARIANTES

1. **Decisão não executa** - Registrar "accepted" não dispara ação
2. **Decisão não retroalimenta** - Agente não aprende com decisões
3. **Toda decisão é auditada** - IP, UserAgent, timestamp
4. **Reason obrigatório** - Mínimo 3 caracteres
5. **Human obrigatório** - Identificação do decisor

---

## MODELO DE DADOS

```sql
CREATE TABLE human_decisions (
  id TEXT PRIMARY KEY,
  suggestion_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT NOT NULL,
  human TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at DATETIME NOT NULL
);

CREATE INDEX idx_human_decisions_suggestion ON human_decisions(suggestion_id);
CREATE INDEX idx_human_decisions_human ON human_decisions(human);
CREATE INDEX idx_human_decisions_decision ON human_decisions(decision);
CREATE INDEX idx_human_decisions_created_at ON human_decisions(created_at);
```

---

## TENDÊNCIAS

O console calcula tendências simples:

| Tendência | Cálculo |
|-----------|---------|
| `errors_trend` | Taxa de erros atual vs threshold |
| `suggestions_trend` | Sugestões últimas 12h vs 12h anteriores |
| `health_trend` | Status geral do sistema |

Valores: `up`, `down`, `stable`

---

## SEGURANÇA

- Decisões são append-only
- Não há endpoint de DELETE
- Não há endpoint de UPDATE
- IP e UserAgent são registrados
- Toda decisão tem timestamp

---

*Documento criado em 29/12/2024 - Fase 25*
