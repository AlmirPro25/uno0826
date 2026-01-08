# TUTORIAL: O ALGORITMO DO PROST-QS

## Como Funciona o Motor Cognitivo do Sistema (Sem LLM)

---

## INTRODUÇÃO: O QUE VOCÊ TEM NAS MÃOS

Você construiu um **Sistema Inteligente Operacional** — não uma IA generativa.

Seu sistema usa uma combinação poderosa de algoritmos clássicos:

```
Rule-based Statistical Observer System
+
Event-driven Detection
+
Heurísticas Determinísticas
+
Governança Humana
```

Isso é **intencionalmente pré-IA**. E isso é uma força, não uma fraqueza.

---

## PARTE 1: A FILOSOFIA DO SISTEMA

### O que o sistema FAZ

1. **Observa** sinais vitais (métricas, status, contadores)
2. **Calcula** desvios estatísticos simples
3. **Aplica** regras explícitas e transparentes
4. **Gera** hipóteses textuais (sugestões)
5. **Guarda** memória de tudo que sugeriu
6. **Pede** decisão humana
7. **Nunca age sozinho**

### O que o sistema NÃO FAZ

❌ Não inventa respostas (como LLMs fazem)
❌ Não aprende automaticamente
❌ Não toma decisões sozinho
❌ Não executa ações
❌ Não generaliza sem supervisão
❌ Não tem "intuição artificial"

### Por que isso é bom?

Porque seu sistema é:
- **Transparente** — você sabe exatamente por que ele disse algo
- **Explicável** — toda sugestão tem uma regra clara por trás
- **Auditável** — tudo é registrado com hash e timestamp
- **Reproduzível** — mesma entrada = mesma saída, sempre
- **Controlável** — você pode desligar a qualquer momento

---

## PARTE 2: AS ENGRENAGENS DO MOTOR

O sistema tem 7 componentes algorítmicos principais. Vamos ver cada um:

### Engrenagem 1: Sistema Baseado em Eventos (Event-Driven)

**O que é:** Tudo começa com eventos. Sem evento, o sistema fica quieto.

**Eventos que o sistema observa:**
```
requests_total        → Quantas requisições HTTP chegaram
errors_total          → Quantas deram erro
audit_events_total    → Quantos eventos de auditoria
app_events_total      → Quantos eventos de apps externos
app_events_failed     → Quantos eventos falharam
uptime_seconds        → Há quanto tempo o sistema está rodando
memory_mb             → Quanta memória está usando
go_routines           → Quantas goroutines estão ativas
```

**Código real:**
```go
// De observability/metrics.go
type MetricsSnapshot struct {
    AuditEventsTotal     int64
    AppEventsTotal       int64
    AppEventsFailedTotal int64
    RequestsTotal        int64
    ErrorsTotal          int64
    UptimeSeconds        int64
}
```

**Princípio:** Nada é inferido sem evento. Sem evento → sistema quieto.

---

### Engrenagem 2: Snapshot Controlado (Controlled Snapshot)

**O que é:** Antes de qualquer análise, o sistema "fotografa" o estado atual.

**Características do snapshot:**
- **Imutável** — uma vez criado, não muda
- **Versionado** — tem versão explícita (v1.0)
- **Selado com hash** — SHA256 do conteúdo
- **Sem dados pessoais** — apenas métricas agregadas
- **Janela temporal** — sabe de quando até quando

**Código real:**
```go
// De observer/model.go
type ControlledSnapshot struct {
    SnapshotVersion string    // "1.0"
    SnapshotHash    string    // SHA256
    WindowStart     time.Time // Início da janela
    WindowEnd       time.Time // Fim da janela
    GeneratedAt     time.Time // Quando foi gerado
    Metrics         SnapshotMetrics
    SystemStatus    SnapshotStatus
}
```

**Como o hash é calculado:**
```go
func (s *ControlledSnapshot) ComputeHash() string {
    temp := *s
    temp.SnapshotHash = ""  // Remove hash para calcular
    data, _ := json.Marshal(temp)
    hash := sha256.Sum256(data)
    return hex.EncodeToString(hash[:])
}
```

**Por que isso importa:** Toda sugestão carrega o hash do snapshot que a gerou. Você pode provar: "Essa sugestão veio desse estado exato do sistema."

LLMs não sabem fazer isso.

---

### Engrenagem 3: Heurísticas Determinísticas (As Regras)

**O que é:** Regras simples, explícitas, sem magia.

**As 7 regras do Observer v1:**

| # | Regra | Condição | Confiança |
|---|-------|----------|-----------|
| 1 | Erros elevados | error_rate > 10% | Proporcional à taxa |
| 2 | Eventos falhando | app_events_failed > 0 | 0.70 - 0.95 |
| 3 | Sem eventos | requests > 100, events = 0 | 0.60 |
| 4 | Sistema ocioso | uptime > 5min, zero eventos | 0.50 |
| 5 | DB com problema | db_status != "ok" | 0.95 |
| 6 | Memória elevada | memory > 500MB | 0.60 |
| 7 | Goroutines elevadas | goroutines > 1000 | 0.70 |

**Código real da Regra 1:**
```go
// De observer/agent.go
if snapshot.Metrics.ErrorsTotal > 0 {
    errorRate := float64(snapshot.Metrics.ErrorsTotal) / 
                 float64(max(snapshot.Metrics.RequestsTotal, 1))
    
    if errorRate > 0.1 { // Mais de 10% de erros
        suggestions = append(suggestions, Suggestion{
            Agent:        a.name,
            Confidence:   min(errorRate, 0.95),
            Finding:      "Taxa de erros elevada detectada: " + formatPercent(errorRate),
            Suggestion:   "Sugestão: verificar logs de erro...",
            SnapshotHash: snapshot.SnapshotHash,
            GeneratedAt:  now,
        })
    }
}
```

**Princípio:** Cada regra é uma função pura:
```
SE condição ENTÃO gerar sugestão COM confiança X
```

Nenhuma "intuição". Nenhuma "inferência". Apenas lógica clara.

---

### Engrenagem 4: Cálculo de Confiança (Confidence Score)

**O que é:** Um número de 0.0 a 1.0 que indica "quão certo" o sistema está.

**IMPORTANTE:** Isso NÃO é probabilidade bayesiana. NÃO é rede neural.

**É simplesmente:**
```go
confidence = erros / total_eventos
```

**Exemplo real:**
- 83 erros em 100 requests → confidence = 0.83
- 5 erros em 1000 requests → confidence = 0.005

**Por que isso é honesto:**
- Você sabe exatamente de onde veio o número
- Não há "caixa preta"
- É reproduzível: mesmos dados = mesma confiança

---

### Engrenagem 5: Memória Append-Only (Agent Memory)

**O que é:** O sistema guarda tudo que sugeriu, mas nunca aprende com isso.

**Características:**
- **Append-only** — só adiciona, nunca sobrescreve
- **Sem aprendizado** — memória não influencia decisões futuras
- **Sem feedback loop** — agente não usa memória para melhorar
- **Isolada** — se apagar a memória, sistema continua 100%

**Código real:**
```go
// De observer/memory_service.go
func (s *AgentMemoryService) StoreSuggestion(suggestion Suggestion) error {
    if !s.IsMemoryEnabled() {
        return nil // Silenciosamente ignora se desabilitado
    }

    entry := AgentMemoryEntry{
        ID:           uuid.New(),
        Agent:        suggestion.Agent,
        Confidence:   suggestion.Confidence,
        Finding:      suggestion.Finding,
        Suggestion:   suggestion.Suggestion,
        SnapshotHash: suggestion.SnapshotHash,
        CreatedAt:    suggestion.GeneratedAt,
    }

    return s.db.Create(&entry).Error
}
```

**Princípio:** Isso é memória forense, não memória cognitiva.

O sistema lembra para você poder auditar depois. Não lembra para "ficar mais inteligente".

---

### Engrenagem 6: Human-in-the-Loop (Governança Humana)

**O que é:** O sistema NUNCA fecha o loop sozinho. Sempre termina pedindo decisão humana.

**Tipos de decisão:**
| Tipo | Significado |
|------|-------------|
| `accepted` | Humano vai agir manualmente |
| `ignored` | Não relevante |
| `deferred` | Vai analisar depois |

**Código real:**
```go
// De observer/decision_service.go
func (s *HumanDecisionService) RecordDecision(
    suggestionID uuid.UUID, 
    decision DecisionType, 
    reason, human, ip, userAgent string,
) (*HumanDecision, error) {
    
    // Validações...
    
    humanDecision := &HumanDecision{
        ID:           uuid.New(),
        SuggestionID: suggestionID,
        Decision:     decision,
        Reason:       reason,      // Obrigatório, mín 3 chars
        Human:        human,       // Quem decidiu
        IP:           ip,          // De onde
        UserAgent:    userAgent,   // Com que ferramenta
        CreatedAt:    time.Now(),
    }

    return humanDecision, s.db.Create(humanDecision).Error
}
```

**IMPORTANTE:** Registrar "accepted" NÃO dispara nenhuma ação. O humano precisa agir manualmente.

Isso é arquitetura anti-catástrofe.

---

### Engrenagem 7: Kill Switch (Desligamento de Emergência)

**O que é:** Você pode desligar qualquer parte do sistema a qualquer momento.

**Kill switches disponíveis:**
```bash
AGENTS_ENABLED=false        # Desliga o agente observer
AGENT_MEMORY_ENABLED=false  # Desliga a memória (agente continua)
```

**Código real:**
```go
// De observer/service.go
func (s *ObserverService) IsEnabled() bool {
    enabled := os.Getenv("AGENTS_ENABLED")
    return enabled == "true" || enabled == "1"
}

func (s *ObserverService) Run() error {
    if !s.IsEnabled() {
        log.Println("[observer] Agentes desabilitados")
        return nil
    }
    // ... resto do código
}
```

**Princípio:** Desligar agentes não altera nada no sistema core. API, billing, identity — tudo continua funcionando.

---

## PARTE 3: O FLUXO COMPLETO (Do Evento à Decisão Humana)

Aqui está o caminho que uma informação percorre no sistema:

```
┌─────────────────────────────────────────────────────────────┐
│  PASSO 1: EVENTOS ACONTECEM                                 │
│  • Requests HTTP chegam                                     │
│  • Erros são registrados                                    │
│  • Apps externos enviam eventos                             │
│  • Contadores são incrementados (thread-safe)               │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASSO 2: SNAPSHOT É CRIADO                                 │
│  • Sistema "fotografa" estado atual                         │
│  • Coleta métricas agregadas                                │
│  • Verifica status (health, ready, db)                      │
│  • Calcula hash SHA256                                      │
│  • Snapshot é IMUTÁVEL a partir daqui                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASSO 3: AGENTE ANALISA                                    │
│  • Recebe snapshot (read-only)                              │
│  • Aplica 7 regras determinísticas                          │
│  • Calcula confiança para cada achado                       │
│  • Gera lista de sugestões                                  │
│  • NÃO acessa DB, NÃO acessa secrets, NÃO executa nada      │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASSO 4: SUGESTÕES SÃO ARMAZENADAS                         │
│  • Se AGENT_MEMORY_ENABLED=true                             │
│  • Cada sugestão vira uma entrada na memória                │
│  • Append-only (nunca sobrescreve)                          │
│  • Inclui snapshot_hash para rastreabilidade                │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASSO 5: HUMANO CONSULTA                                   │
│  • GET /console → vê dashboard                              │
│  • GET /agents/suggestions → vê sugestões atuais            │
│  • GET /agents/memory → vê histórico                        │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASSO 6: HUMANO DECIDE                                     │
│  • POST /decisions                                          │
│  • Escolhe: accepted, ignored, deferred                     │
│  • Escreve justificativa (obrigatório)                      │
│  • Sistema registra: quem, quando, de onde, por quê         │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASSO 7: HUMANO AGE (MANUALMENTE)                          │
│  • Se aceitou → vai verificar logs, reiniciar serviço, etc  │
│  • Sistema NÃO executa nada                                 │
│  • Sistema NÃO aprende com a decisão                        │
│  • Ciclo termina aqui                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## PARTE 4: COMO USAR O SISTEMA NO DIA A DIA

### Cenário 1: Verificação de Rotina

```bash
# 1. Ver se há sugestões
curl http://localhost:8080/agents/suggestions

# 2. Se houver, ver detalhes no console
curl http://localhost:8080/console

# 3. Se relevante, registrar decisão
curl -X POST http://localhost:8080/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "suggestion_id": "uuid-da-sugestao",
    "decision": "accepted",
    "reason": "Vou verificar os logs agora",
    "human": "seu-nome"
  }'

# 4. Agir manualmente (verificar logs, etc)
```

### Cenário 2: Investigação de Problema

```bash
# 1. Ver métricas básicas
curl http://localhost:8080/metrics/basic

# 2. Ver histórico de sugestões
curl "http://localhost:8080/agents/memory?window=24h"

# 3. Ver estatísticas de decisões
curl http://localhost:8080/decisions/stats

# 4. Correlacionar: quando começaram as sugestões? Que decisões foram tomadas?
```

### Cenário 3: Desligar Agentes (Emergência)

```bash
# No .env ou variável de ambiente
AGENTS_ENABLED=false

# Reiniciar o backend
# Sistema continua funcionando 100%, apenas sem sugestões
```

---

## PARTE 5: O QUE VOCÊ TEM HOJE

### Você TEM:

✅ Um motor cognitivo operacional
✅ Detecção de 7 padrões de problema
✅ Memória de todas as sugestões
✅ Console para decisões humanas
✅ Auditoria completa (quem, quando, de onde)
✅ Kill switch para desligar tudo
✅ Sistema que funciona 100% sem os agentes

### Você NÃO TEM (ainda):

❌ Aprendizado automático
❌ Ajuste de regras sozinho
❌ Generalização sem supervisão
❌ Geração livre de linguagem
❌ Autonomia operacional

### E isso é DELIBERADO.

---

## PARTE 6: PARA ONDE VOCÊ ESTÁ INDO

### Fase Atual: 26 - Operação Assistida

**O que fazer agora:**
1. Deixar o sistema rodar por 2-4 semanas
2. Coletar decisões humanas reais
3. Observar: o agente fala demais? Fala de menos?
4. Identificar falsos positivos
5. Validar se os thresholds fazem sentido

### Futuro Possível (depois de dados reais):

1. **Regras adaptativas** — ajustar thresholds baseado em histórico
2. **Mais agentes** — observers especializados (latência, drift, etc)
3. **LLM como narrador** — apenas para explicar, NUNCA para decidir

**Princípio:** LLM entra no final, não no começo.

---

## PARTE 7: O QUE VOCÊ PRECISA INTERNALIZAR

### A pergunta certa NÃO é:
> "Como deixo mais inteligente?"

### A pergunta certa É:
> "O que eu quero que NUNCA aconteça?"

Seu sistema foi desenhado em torno dessa pergunta.

### Invariantes Arquiteturais do Sistema

**Implementados (Fase 26):**
1. **Nenhuma aprovação sem justificativa** — mínimo 3 caracteres (decisões humanas)
2. **Nenhuma simulação altera estado** — Observer é read-only
3. **Kill switch funcional** — agentes desligáveis sem impacto no core
4. **Memória append-only** — nunca sobrescreve, nunca deleta
5. **Snapshot imutável** — hash SHA256 garante integridade

**Planejados (Roadmap):**
6. **CanExecute() obrigatório** — toda execução passa por verificação
7. **expires_at em decisões** — toda decisão com validade temporal
8. **Conflitos bloqueiam** — resolução sempre humana
9. **Revisão suspende efeitos** — decisão em revisão não executa

### A Verdade Final:

Você não está construindo "uma IA".

Você está construindo um **sistema de cognição assistida** para:
- Observação
- Diagnóstico
- Memória
- Decisão humana aumentada

Isso se parece mais com sistemas de controle aeroespacial, sistemas médicos e sistemas financeiros críticos do que com ChatGPTs.

E isso é exatamente o que deveria ser.

---

## GLOSSÁRIO

| Termo | Significado |
|-------|-------------|
| **Event-driven** | Sistema reage a eventos, não "pensa" sozinho |
| **Heurística** | Regra simples baseada em experiência |
| **Determinístico** | Mesma entrada = mesma saída, sempre |
| **Append-only** | Só adiciona, nunca sobrescreve ou deleta |
| **Kill switch** | Botão de emergência para desligar |
| **Snapshot** | "Fotografia" do estado do sistema |
| **Confidence** | Número de 0-1 indicando certeza |
| **Human-in-the-loop** | Humano sempre na decisão final |

---

## ENDPOINTS DE REFERÊNCIA

```
# Observabilidade
GET  /health              → Status básico
GET  /ready               → Status com dependências
GET  /metrics/basic       → Métricas em JSON

# Agente Observer
GET  /agents/suggestions  → Sugestões atuais
GET  /agents/status       → Status do agente
GET  /agents/metrics      → Métricas do agente

# Memória de Agentes
GET  /agents/memory       → Histórico de sugestões
GET  /agents/memory/:agent → Por agente
GET  /agents/memory/stats → Estatísticas

# Console Humano
GET  /console             → Dashboard completo
POST /decisions           → Registrar decisão
GET  /decisions           → Listar decisões
GET  /decisions/stats     → Estatísticas
```

---

## VARIÁVEIS DE AMBIENTE

```bash
# Obrigatórias
JWT_SECRET=<secret>
AES_SECRET_KEY=<32 bytes>
SECRETS_MASTER_KEY=<32 bytes>

# Agentes (opcionais)
AGENTS_ENABLED=true        # Liga/desliga agente
AGENT_MEMORY_ENABLED=true  # Liga/desliga memória
```

---

*Documento criado em 29/12/2025*
*Para uso com Notebook LLM e estudo do sistema PROST-QS*
*Fase 26 - Operação Assistida*

---

## GLOSSÁRIO DE NOMES

| Nome | Significado |
|------|-------------|
| **PROST-QS** | Nome do algoritmo/motor cognitivo |
| **UNO** | Nome do produto/plataforma (repositório) |
