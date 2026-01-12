# 🛡️ Sistema Imunológico do PROST-QS

## O Que É

O Sistema Imunológico é a camada de **auto-defesa e auto-cura** do Kernel PROST-QS. Assim como o sistema imunológico humano protege o corpo contra ameaças, este sistema protege a infraestrutura contra ataques, falhas e anomalias.

> **Filosofia**: "O sistema deve se defender sozinho. Humanos são para casos excepcionais."

---

## Por Que Existe

Sistemas em produção enfrentam ameaças constantes:

| Problema | Sem Imunidade | Com Imunidade |
|----------|---------------|---------------|
| Ataque de força bruta | Sistema fica lento, pode cair | Atacante é bloqueado automaticamente |
| Serviço externo falha | Cascata de erros derruba tudo | Circuit breaker isola a falha |
| Usuário suspeito | Continua operando normalmente | Colocado em quarentena para análise |
| Erro intermitente | Falha visível ao usuário | Auto-healing tenta recuperar |
| Incidente crítico | Ninguém sabe até ser tarde | Alerta escala até chegar em alguém |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SISTEMA IMUNOLÓGICO                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   SELF      │  │   CIRCUIT   │  │ QUARANTINE  │  │    AUTO     │ │
│  │  DEFENSE    │  │   BREAKER   │  │   MANAGER   │  │   HEALING   │ │
│  │             │  │             │  │             │  │             │ │
│  │ • Brute     │  │ • Closed    │  │ • Soft      │  │ • Retry     │ │
│  │   Force     │  │ • Open      │  │ • Hard      │  │ • Backoff   │ │
│  │ • DDoS      │  │ • Half-Open │  │ • Auto-     │  │ • Custom    │ │
│  │ • API Abuse │  │             │  │   Release   │  │   Handlers  │ │
│  │ • Honeypots │  │             │  │             │  │             │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                │                │                │        │
│         └────────────────┴────────────────┴────────────────┘        │
│                                   │                                  │
│                                   ▼                                  │
│                    ┌─────────────────────────────┐                   │
│                    │     ALERT ESCALATION        │                   │
│                    │                             │                   │
│                    │  LOG → DASHBOARD → TEAM →   │                   │
│                    │  ON-CALL → MANAGEMENT       │                   │
│                    └─────────────────────────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Os 5 Componentes

### 1. 🗡️ Self Defense (Defesa Ativa)

Detecta e responde a ataques em tempo real.

**Tipos de Ameaça Detectados:**
- `brute_force` - Muitas tentativas de login falhadas
- `ddos` - Volume anormal de requisições
- `api_abuse` - Uso excessivo de endpoints
- `bot_activity` - Comportamento automatizado suspeito
- `credential_stuffing` - Tentativas com credenciais vazadas

**Ações Progressivas:**
```
Ameaça Detectada
      │
      ▼
┌─────────────┐
│   ALLOW     │  Score < 20: Apenas monitora
└──────┬──────┘
       │ Score aumenta
       ▼
┌─────────────┐
│  THROTTLE   │  Score 20-40: Limita velocidade
└──────┬──────┘
       │ Score aumenta
       ▼
┌─────────────┐
│   TARPIT    │  Score 40-60: Resposta lenta (5s)
└──────┬──────┘
       │ Score aumenta
       ▼
┌─────────────┐
│   BLOCK     │  Score 60-80: Bloqueado temporário
└──────┬──────┘
       │ Score aumenta
       ▼
┌─────────────┐
│ BLACKHOLE   │  Score > 80: Silenciosamente ignorado
└─────────────┘
```

**Honeypots:**
Endpoints falsos que detectam bots:
```go
// Qualquer acesso a esses endpoints = bot
/admin/secret
/wp-admin
/.env
/config.php
```

**Allowlist:**
IPs confiáveis que nunca são bloqueados:
- `127.0.0.1` (localhost)
- `10.0.0.0/8` (rede interna)

---

### 2. ⚡ Circuit Breaker (Disjuntor)

Previne cascata de falhas quando um serviço externo falha.

**Estados:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    CLOSED ──────────────► OPEN ──────────────► HALF-OPEN   │
│      │                      │                      │        │
│      │  (falhas > limite)   │  (timeout expira)    │        │
│      │                      │                      │        │
│      │                      │    ┌────────────────┐│        │
│      │                      │    │ Testa 1 req   ││        │
│      │                      │    └───────┬────────┘│        │
│      │                      │            │         │        │
│      │                      │   sucesso? │ falha?  │        │
│      │                      │     │      │         │        │
│      ◄──────────────────────┴─────┘      └─────────►        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Configuração Padrão:**
```go
FailureThreshold: 5      // Abre após 5 falhas
SuccessThreshold: 2      // Fecha após 2 sucessos
Timeout:          30s    // Tenta reabrir após 30s
```

**Exemplo de Uso:**
```go
// Protege chamada a serviço externo
cb := immunity.Circuit("stripe-api")
result, err := cb.Execute(func() (interface{}, error) {
    return stripe.CreatePayment(amount)
})

if err == immunity.ErrCircuitOpen {
    // Serviço indisponível, usar fallback
    return cachedResponse()
}
```

---

### 3. 🔒 Quarantine (Quarentena)

Isola elementos suspeitos para análise sem bloquear completamente.

**Tipos de Quarentena:**

| Tipo | Descrição | Efeito |
|------|-----------|--------|
| `soft` | Suspeita leve | Funcionalidade limitada |
| `hard` | Ameaça confirmada | Completamente bloqueado |

**Alvos que Podem ser Quarentenados:**
- `user` - Usuário específico
- `ip` - Endereço IP
- `session` - Sessão específica
- `app` - Aplicação inteira
- `api_key` - Chave de API

**Razões de Quarentena:**
- `suspicious_activity` - Comportamento anormal
- `security_threat` - Ameaça de segurança
- `policy_violation` - Violação de política
- `anomaly_detected` - Anomalia detectada
- `manual_review` - Revisão manual solicitada

**Auto-Release:**
Quarentenas podem expirar automaticamente:
```go
// Quarentena de 1 hora com auto-release
immunity.QuarantineEntity(
    TargetIP, 
    "192.168.1.100",
    QuarantineSoft,
    ReasonSuspiciousActivity,
    evidence,
    1 * time.Hour,  // Expira em 1 hora
)
```

---

### 4. 🏥 Auto-Healing (Auto-Cura)

Tenta recuperar automaticamente de falhas conhecidas.

**Ações de Healing Disponíveis:**
```go
HealRestartService    // Reinicia serviço
HealClearCache        // Limpa cache
HealReconnectDB       // Reconecta banco
HealRecalcMetrics     // Recalcula métricas
HealKillZombie        // Mata processo travado
HealRotateCredentials // Rotaciona credenciais
```

**Retry com Backoff Exponencial:**
```
Tentativa 1: Imediata
Tentativa 2: Espera 1s
Tentativa 3: Espera 2s
Tentativa 4: Espera 4s
Tentativa 5: Espera 8s (máximo)
```

**Registrando Handler Customizado:**
```go
immunity.AutoHealer().RegisterHealer(
    HealClearCache,
    func(target string, ctx map[string]interface{}) error {
        return redis.FlushDB(target)
    },
)
```

---

### 5. 🚨 Alert Escalation (Escalonamento de Alertas)

Garante que alertas importantes cheguem às pessoas certas.

**5 Níveis de Escalonamento:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Nível 1: LOG           → Apenas registra no log           │
│     │                                                       │
│     │ (5 min sem ack)                                       │
│     ▼                                                       │
│  Nível 2: DASHBOARD     → Aparece no painel admin          │
│     │                                                       │
│     │ (10 min sem ack)                                      │
│     ▼                                                       │
│  Nível 3: TEAM          → Notifica equipe (Slack/Email)    │
│     │                                                       │
│     │ (15 min sem ack)                                      │
│     ▼                                                       │
│  Nível 4: ON-CALL       → Aciona plantão (PagerDuty)       │
│     │                                                       │
│     │ (30 min sem ack)                                      │
│     ▼                                                       │
│  Nível 5: MANAGEMENT    → Escala para gestão               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Severidades:**
- `info` - Informativo
- `warning` - Atenção necessária
- `error` - Erro que precisa correção
- `critical` - Crítico, começa no nível 3
- `fatal` - Fatal, começa no nível 4

**Deduplicação:**
Alertas iguais são agrupados por fingerprint:
```
Alerta: "Falha de conexão DB"
  - Primeira ocorrência: Cria alerta
  - Segunda ocorrência: Incrementa contador
  - Terceira ocorrência: Incrementa contador
  
Resultado: 1 alerta com "3 ocorrências"
```

---

## Como Tudo Funciona Junto

### Cenário: Ataque de Força Bruta

```
1. Atacante tenta login 10x com senhas erradas
                    │
                    ▼
2. Self Defense detecta padrão brute_force
   Score: 0 → 20 (THROTTLE)
                    │
                    ▼
3. Atacante continua, mais 10 tentativas
   Score: 20 → 40 (TARPIT - respostas lentas)
                    │
                    ▼
4. Atacante persiste, mais 10 tentativas
   Score: 40 → 60 (BLOCK - bloqueado 2min)
                    │
                    ▼
5. Quarantine ativada automaticamente
   IP em quarentena SOFT por 1 hora
                    │
                    ▼
6. Alert criado: "Ameaça Detectada: brute_force"
   Severidade: WARNING
   Nível inicial: LOG
                    │
                    ▼
7. Se não reconhecido em 5min, escala para DASHBOARD
                    │
                    ▼
8. Admin vê no painel, reconhece alerta
   Atacante permanece bloqueado
```

### Cenário: Serviço Externo Falha

```
1. Stripe API começa a retornar erros 500
                    │
                    ▼
2. Circuit Breaker "stripe-api" registra falhas
   Falhas: 1, 2, 3, 4, 5
                    │
                    ▼
3. Threshold atingido (5 falhas)
   Circuit ABRE - requisições não passam
                    │
                    ▼
4. Alert criado: "Circuit Aberto: stripe-api"
   Health Score do sistema: 100 → 90
                    │
                    ▼
5. Após 30s, circuit vai para HALF-OPEN
   Testa 1 requisição
                    │
                    ▼
6. Se sucesso: Circuit FECHA, operação normal
   Se falha: Circuit ABRE novamente
```

### Cenário: Anomalia em Usuário

```
1. Sistema detecta usuário com comportamento anormal
   (ex: 1000 requisições em 1 minuto)
                    │
                    ▼
2. Quarantine automática
   Tipo: SOFT (funcionalidade limitada)
   Razão: anomaly_detected
   Duração: 1 hora
                    │
                    ▼
3. Alert criado para revisão humana
   Categoria: SECURITY
                    │
                    ▼
4. Admin analisa no dashboard
   Opções:
   - Liberar (falso positivo)
   - Manter (aguardar expiração)
   - Escalar para HARD (bloquear total)
```

---

## API HTTP

### Endpoints Disponíveis

```
GET  /api/v1/immunity/health           # Saúde geral do sistema
GET  /api/v1/immunity/stats            # Estatísticas completas
GET  /api/v1/immunity/alerts           # Lista alertas ativos
POST /api/v1/immunity/alerts/:id/ack   # Reconhece alerta
POST /api/v1/immunity/alerts/:id/resolve # Resolve alerta
GET  /api/v1/immunity/quarantine       # Lista quarentenas
POST /api/v1/immunity/quarantine/release # Libera quarentena
GET  /api/v1/immunity/circuits         # Status dos circuits
POST /api/v1/immunity/circuits/:name/reset # Reset circuit
GET  /api/v1/immunity/threats          # IPs bloqueados
POST /api/v1/immunity/threats/block    # Bloqueia IP manual
POST /api/v1/immunity/threats/unblock  # Desbloqueia IP
GET  /api/v1/immunity/healing/history  # Histórico de healing
POST /api/v1/immunity/healing/trigger  # Dispara healing manual
```

### Exemplo: Verificar Saúde

```bash
curl -X GET http://localhost:8080/api/v1/immunity/health \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta:**
```json
{
  "status": "healthy",
  "score": 95.0,
  "open_circuits": 0,
  "active_quarantines": 1,
  "active_alerts": 2,
  "total_threats": 15,
  "total_heals": 8,
  "total_blocks": 3,
  "uptime_seconds": 86400,
  "checked_at": "2026-01-11T15:00:00Z"
}
```

### Exemplo: Bloquear IP Manualmente

```bash
curl -X POST http://localhost:8080/api/v1/immunity/threats/block \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.100",
    "duration": "24h",
    "reason": "Atividade maliciosa confirmada"
  }'
```

---

## Dashboard

O sistema inclui uma página no dashboard em `/dashboard/immunity` com:

- **Visão Geral**: Score de saúde, estatísticas rápidas
- **Alertas**: Lista de alertas com ações (reconhecer, resolver)
- **Quarentena**: Elementos isolados com opção de liberar
- **Circuits**: Status dos circuit breakers com reset
- **Ameaças**: IPs bloqueados com opção de desbloquear

---

## Métricas de Saúde

O Health Score (0-100) é calculado assim:

```
Score Inicial: 100

Penalidades:
- Cada circuit aberto:     -10 pontos
- Cada quarentena ativa:   -5 pontos
- Cada alerta CRITICAL:    -15 pontos
- Cada alerta ERROR:       -10 pontos
- Cada IP bloqueado:       -2 pontos

Status:
- Score >= 75: HEALTHY (saudável)
- Score 50-74: DEGRADED (degradado)
- Score < 50:  CRITICAL (crítico)
```

---

## Integração com Outros Sistemas

O Sistema Imunológico se integra com outros componentes do kernel através do `IntegrationManager`:

### Integrações Disponíveis

| Sistema | Integração | Descrição |
|---------|------------|-----------|
| **Invariants** | `InvariantIntegration` | Violações de invariantes geram alertas e podem acionar quarentena |
| **Telemetry** | `TelemetryExporter` | Métricas exportadas periodicamente para observabilidade |
| **Audit** | `AuditIntegration` | Todas as ações são auditadas automaticamente |
| **Notifications** | `NotificationIntegration` | Alertas críticos geram notificações (Slack, PagerDuty, Email) |
| **Kill Switch** | `KillSwitchIntegration` | Pode acionar kill switch em emergências |

### Exemplo: Processar Violação de Invariante

```go
// Quando uma invariante é violada
violation := immunity.InvariantViolation{
    ID:        "viol-123",
    Invariant: "billing_balance_consistency",
    Message:   "Saldo inconsistente detectado",
    Severity:  "CRITICAL",
    AppID:     "app-456",
    Context: map[string]interface{}{
        "expected": 100,
        "actual":   50,
    },
}

// Processar e decidir ação
decision := immunity.HandleInvariantViolation(violation)

if decision.ShouldEscalate {
    // Alerta foi criado e escalado
    // App pode ter sido colocado em quarentena
}
```

### Exemplo: Configurar Notificações

```go
// Registrar handler para Slack
immunity.GetIntegrations().Notifications().RegisterHandler("slack", func(n immunity.ImmunityNotification) {
    // Enviar para Slack
    slack.PostMessage(channel, n.Title, n.Message)
})

// Registrar handler para PagerDuty
immunity.GetIntegrations().Notifications().RegisterHandler("pagerduty", func(n immunity.ImmunityNotification) {
    // Criar incidente no PagerDuty
    pagerduty.CreateIncident(n.Title, n.Message, n.Context)
})
```

### Exemplo: Configurar Kill Switch Automático

```go
// Configurar callback para kill switch
immunity.GetIntegrations().KillSwitch().SetOnKillSwitch(func(reason string, ctx map[string]interface{}) {
    // Acionar kill switch do sistema
    killswitch.Activate(reason, ctx)
    
    // Notificar equipe
    notify.Emergency("Kill Switch acionado: " + reason)
})
```

### Métricas Exportadas

O `TelemetryExporter` exporta as seguintes métricas a cada 30 segundos:

```json
{
    "timestamp": "2026-01-11T15:00:00Z",
    "health_score": 95.0,
    "health_status": "healthy",
    "open_circuits": 0,
    "active_quarantines": 1,
    "active_alerts": 2,
    "total_threats": 150,
    "total_heals": 45,
    "total_blocks": 12,
    "blocked_sources": 3,
    "tracked_sources": 25,
    "uptime_seconds": 86400
}
```

---

## Detecção de Anomalias

O sistema inclui um detector de anomalias baseado em estatísticas:

### Como Funciona

1. **Período de Aprendizado**: Nos primeiros 5 minutos, o sistema aprende os padrões normais
2. **Cálculo de Baseline**: Calcula média e desvio padrão de cada métrica
3. **Detecção por Z-Score**: Valores com z-score > 3 são considerados anomalias
4. **Alertas Automáticos**: Anomalias severas geram alertas no sistema

### Tipos de Anomalias Detectadas

| Tipo | Descrição |
|------|-----------|
| `high_traffic` | Tráfego muito acima do normal |
| `high_error_rate` | Taxa de erros elevada |
| `high_latency` | Latência acima do esperado |
| `unusual_pattern` | Padrão incomum detectado |
| `resource_spike` | Pico de uso de recursos |
| `sudden_drop` | Queda brusca em métricas |

### Exemplo de Uso

```go
// Registrar métrica
anomaly := immunity.RecordMetric("requests_per_second", 1500, map[string]string{
    "endpoint": "/api/v1/users",
})

if anomaly != nil {
    // Anomalia detectada!
    log.Printf("Anomalia: %s (desvio: %.2f sigma)", anomaly.Type, anomaly.Deviation)
}
```

### API de Anomalias

```
GET  /api/v1/immunity/anomalies/stats      # Estatísticas de anomalias
GET  /api/v1/immunity/anomalies/baselines  # Baselines de métricas
POST /api/v1/immunity/anomalies/reset-learning # Reinicia aprendizado
```

---

## Conclusão

O Sistema Imunológico transforma o PROST-QS de um sistema passivo em um sistema **ativo e resiliente**:

✅ **Detecta** ameaças automaticamente  
✅ **Responde** de forma proporcional  
✅ **Isola** elementos suspeitos  
✅ **Recupera** de falhas conhecidas  
✅ **Escala** alertas até resolução  
✅ **Aprende** com padrões de ataque  

> "Um sistema sem imunidade é um sistema esperando para falhar."
