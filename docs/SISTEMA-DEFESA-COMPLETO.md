# 🛡️ SISTEMA DE DEFESA DO PROST-QS KERNEL

> Como o sistema principal funciona e se protege automaticamente.

---

## 📊 VISÃO GERAL

O PROST-QS Kernel é um **sistema imunológico digital** que:
1. **DETECTA** ameaças em tempo real
2. **RESPONDE** automaticamente
3. **SE CURA** sozinho
4. **ESCALA** alertas quando necessário
5. **APRENDE** com ataques

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CAMADAS DE DEFESA                                 │
├─────────────────────────────────────────────────────────────────────┤
│  🌐 BORDA (Cloudflare)                                              │
│     └─ WAF, DDoS Protection, Rate Limit                             │
├─────────────────────────────────────────────────────────────────────┤
│  🚪 API GATE (pkg/apigate)                                          │
│     └─ Validação, Sanitização, Request Validator                    │
├─────────────────────────────────────────────────────────────────────┤
│  🔐 MIDDLEWARE (pkg/middleware)                                     │
│     └─ Auth, Rate Limit, Security Headers, Env Guard                │
├─────────────────────────────────────────────────────────────────────┤
│  🛡️ SELF-DEFENSE (pkg/immunity/self_defense.go)                    │
│     └─ Threat Detection, Scoring, Blocking, Honeypots               │
├─────────────────────────────────────────────────────────────────────┤
│  ⚡ CIRCUIT BREAKER (pkg/immunity/circuit_breaker.go)               │
│     └─ Corta conexões problemáticas                                 │
├─────────────────────────────────────────────────────────────────────┤
│  🔒 QUARANTINE (pkg/immunity/quarantine.go)                         │
│     └─ Isola elementos suspeitos                                    │
├─────────────────────────────────────────────────────────────────────┤
│  🔍 ANOMALY DETECTION (pkg/immunity/anomaly_detection.go)           │
│     └─ Detecta comportamentos anômalos                              │
├─────────────────────────────────────────────────────────────────────┤
│  ✅ INVARIANTS (pkg/invariants)                                     │
│     └─ Testes ativos em produção                                    │
├─────────────────────────────────────────────────────────────────────┤
│  🚨 KILL SWITCH (internal/killswitch)                               │
│     └─ Desliga funcionalidades em emergência                        │
├─────────────────────────────────────────────────────────────────────┤
│  📊 RISK ANALYSIS (internal/risk)                                   │
│     └─ Calcula score de risco por app/agente                        │
├─────────────────────────────────────────────────────────────────────┤
│  🚑 AUTO-HEALING (pkg/immunity/auto_healing.go)                     │
│     └─ Recuperação automática                                       │
├─────────────────────────────────────────────────────────────────────┤
│  📢 ALERT ESCALATION (pkg/immunity/alert_escalation.go)             │
│     └─ Escala alertas para humanos                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 O QUE O SISTEMA FAZ

### 1. Identidade Federada Multi-App
```
Usuário → Login uma vez → Acesso a todos os apps
         ↓
    ┌────────────────┐
    │  KERNEL AUTH   │
    │  (JWT + OAuth) │
    └────────────────┘
         ↓
    ┌─────┬─────┬─────┐
    │APP-1│APP-2│ SCE │
    └─────┴─────┴─────┘
```

### 2. Motor de Regras Dinâmicas
```go
// Regras podem ser criadas/modificadas em runtime
rule := Rule{
    Name:      "block_suspicious_country",
    Condition: "user.country NOT IN ['BR', 'US', 'PT']",
    Action:    "block",
    Priority:  100,
}
```

### 3. Billing + Stripe
```
Planos: Free → Starter → Pro → Enterprise
         ↓
    Capabilities por plano
         ↓
    Limites de uso
         ↓
    Cobrança automática
```

### 4. Telemetria Centralizada
```
Apps enviam eventos → Kernel processa → Dashboard visualiza
                           ↓
                    Detecta anomalias
                           ↓
                    Dispara alertas
```

### 5. Ad Gateway (Leilão RTB)
```
Request → Leilão 2nd Price → Vencedor → Impressão → Tracking
              ↓
    Campanhas competem por slot
              ↓
    Maior bid vence, paga 2º preço
```

---

## 🛡️ COMO O SISTEMA SE DEFENDE

### 1. SELF-DEFENSE — Defesa Ativa

**Arquivo:** `pkg/immunity/self_defense.go`

```go
// Tipos de ameaça detectados
ThreatBruteForce        // Muitas tentativas de login
ThreatDDoS              // Alto volume de requests
ThreatInjection         // SQL/XSS injection
ThreatCredentialStuffing // Muitos usuários do mesmo IP
ThreatAPIAbuse          // Abuso de API
ThreatScraping          // Scraping de dados
ThreatBotActivity       // Atividade de bot
ThreatSuspiciousPattern // Padrão suspeito
```

**Ações de defesa:**
```go
ActionAllow     // Permitir
ActionChallenge // Exigir CAPTCHA/2FA
ActionThrottle  // Limitar velocidade
ActionTarpit    // Resposta lenta (desperdiça tempo do atacante)
ActionBlock     // Bloquear
ActionBlackhole // Descartar silenciosamente
ActionDecoy     // Retornar dados falsos
```

**Sistema de Score:**
```
Score 0-50:   Allow (normal)
Score 50-80:  Challenge/Throttle
Score 80-100: Block
Score 100+:   Blackhole + Quarentena
```

**Honeypots:**
```go
// Endpoints falsos que detectam atacantes
defense.AddHoneypot("/admin/config")
defense.AddHoneypot("/.env")
defense.AddHoneypot("/wp-admin")
// Qualquer acesso = bot/atacante
```

---

### 2. CIRCUIT BREAKER — Corta Conexões Problemáticas

**Arquivo:** `pkg/immunity/circuit_breaker.go`

```
Estados:
┌─────────┐     5 falhas     ┌─────────┐
│ CLOSED  │ ───────────────→ │  OPEN   │
│(normal) │                  │(bloqueado)
└─────────┘                  └─────────┘
     ↑                            │
     │    2 sucessos              │ 30s timeout
     │                            ↓
     │                      ┌───────────┐
     └───────────────────── │ HALF-OPEN │
                            │ (testando)│
                            └───────────┘
```

**Uso:**
```go
cb := GetCircuitBreaker("stripe_api")
err := cb.Execute(func() error {
    return stripe.Charge(amount)
})
if err == ErrCircuitOpen {
    // Stripe está fora, usar fallback
}
```

---

### 3. QUARANTINE — Isola Elementos Suspeitos

**Arquivo:** `pkg/immunity/quarantine.go`

**Tipos de quarentena:**
```go
QuarantineSoft   // Limita funcionalidades
QuarantineHard   // Bloqueia completamente
QuarantineReview // Aguarda revisão humana
```

**Alvos:**
```go
TargetUser    // Usuário suspeito
TargetApp     // App com comportamento anômalo
TargetIP      // IP atacante
TargetSession // Sessão comprometida
TargetDevice  // Dispositivo suspeito
```

**Exemplo:**
```go
// Usuário com muitas falhas de login
QuarantineUser(
    userID,
    QuarantineSoft,
    ReasonSuspiciousActivity,
    evidence,
    1*time.Hour, // Expira em 1h
)
```

---

### 4. ANOMALY DETECTION — Detecta Comportamentos Anômalos

**Arquivo:** `pkg/immunity/anomaly_detection.go`

**Como funciona:**
```
1. LEARNING MODE (5 min)
   └─ Aprende padrões normais (baseline)

2. DETECTION MODE
   └─ Calcula Z-Score para cada métrica
   └─ Z-Score > 3 = Anomalia

3. TIPOS DE ANOMALIA
   ├─ AnomalyHighTraffic     (tráfego alto)
   ├─ AnomalyHighErrorRate   (muitos erros)
   ├─ AnomalyHighLatency     (latência alta)
   ├─ AnomalyResourceSpike   (CPU/memória)
   └─ AnomalySuddenDrop      (queda brusca)
```

**Severidade por Z-Score:**
```
Z-Score 3.0-3.5: low
Z-Score 3.5-4.0: medium
Z-Score 4.0-5.0: high
Z-Score 5.0+:    critical
```

---

### 5. INVARIANTS — Testes Ativos em Produção

**Arquivo:** `pkg/invariants/invariants.go`

**Diferença de testes normais:**
```
Testes de CI:  Rodam antes do deploy, depois morrem
Invariants:    Vivem dentro do sistema, defendem em tempo real
```

**Invariantes críticas:**
```go
// Usuário não pode ter múltiplas origens
AssertUserHasSingleOrigin(userID, originCount)

// Dados não podem vazar entre apps
AssertAppIsolation(requestAppID, dataAppID)

// Token não pode estar expirado
AssertTokenNotExpired(tokenExp)

// Senha NUNCA pode estar no JWT
AssertNoPasswordInJWT(claims) // FATAL se violar

// Telemetria deve ter app_id
AssertTelemetryHasAppID(appID)
```

**Severidades:**
```go
SeverityWarning  // Log + métrica
SeverityCritical // Log + métrica + alerta
SeverityFatal    // Log + métrica + alerta + PANIC
```

---

### 6. KILL SWITCH — Desliga em Emergência

**Arquivo:** `internal/killswitch/service.go`

**Escopos:**
```go
ScopeAll      // Desliga TUDO
ScopeBilling  // Desliga billing
ScopeAgents   // Desliga agentes IA
ScopeAds      // Desliga ads
ScopeJobs     // Desliga jobs
ScopePayments // Desliga pagamentos
```

**Uso:**
```go
// Verificar antes de operação crítica
if killswitch.IsActive(ScopeBilling) {
    return ErrKillSwitchActive
}

// Ativar em emergência
killswitch.Activate(
    ScopeBilling,
    "Stripe fora do ar",
    adminUserID,
    &60, // Expira em 60 minutos
)
```

---

### 7. RISK ANALYSIS — Score de Risco

**Arquivo:** `internal/risk/service.go`

**Níveis de risco:**
```go
RiskLevelLow      // 0.0 - 0.29 (verde)
RiskLevelMedium   // 0.3 - 0.59 (amarelo)
RiskLevelHigh     // 0.6 - 0.79 (laranja)
RiskLevelCritical // 0.8 - 1.0  (vermelho)
```

**Fatores analisados:**
```go
- Taxa de aprovação de ações
- Volume de requisições
- Taxa de erros
- Padrões de acesso
- Histórico de incidentes
```

---

### 8. SECURITY HEADERS — Defesa em Profundidade

**Arquivo:** `pkg/middleware/security_headers.go`

```go
// Headers aplicados em TODAS as respostas
Strict-Transport-Security  // Force HTTPS
X-Content-Type-Options     // Previne MIME sniffing
X-Frame-Options            // Previne clickjacking
X-XSS-Protection           // XSS protection
Referrer-Policy            // Controla referrer
Permissions-Policy         // Desabilita features perigosas
Content-Security-Policy    // CSP restritivo
Cache-Control              // Previne cache de dados sensíveis
```

---

### 9. ENV GUARD — Proteção de Ambiente

**Arquivo:** `pkg/middleware/env_guard.go`

```go
// Bloqueia endpoints em produção
DevOnlyGuard()      // Só funciona se GIN_MODE != "release"
DebugModeGuard()    // Só funciona se DEBUG_MODE=true
AdminOnlyGuard()    // Requer role admin
SuperAdminOnlyGuard() // Requer role super_admin
```

**Protegido:**
```
/debug/*           → DevOnlyGuard
/mock/oauth        → DevOnlyGuard
seed_ads.go        → Bloqueia se GIN_MODE=release
seed_rules.go      → Bloqueia se GIN_MODE=release
promote_admin.go   → Requer CONFIRM_ADMIN_PROMOTION=yes
```

---

## 🔄 FLUXO DE RESPOSTA A AMEAÇA

```
1. DETECÇÃO
   ├─ Self-Defense detecta padrão suspeito
   ├─ Anomaly Detection detecta desvio
   └─ Invariant é violada

2. CLASSIFICAÇÃO
   ├─ Calcular threat score
   ├─ Determinar severidade
   └─ Identificar tipo de ameaça

3. RESPOSTA AUTOMÁTICA
   ├─ Score baixo → Throttle
   ├─ Score médio → Challenge + Monitorar
   ├─ Score alto → Block + Quarentena
   └─ Score crítico → Blackhole + Alerta

4. ESCALAÇÃO (se necessário)
   ├─ Criar alerta
   ├─ Notificar admin
   └─ Aguardar revisão humana

5. RECUPERAÇÃO
   ├─ Auto-healing tenta corrigir
   ├─ Circuit breaker protege dependências
   └─ Quarentena expira automaticamente
```

---

## 📊 MÉTRICAS DE SAÚDE

```go
// Endpoint: GET /api/v1/immunity/status
{
    "status": "healthy",      // healthy, degraded, critical
    "score": 95.0,            // 0-100
    "open_circuits": 0,       // Circuitos abertos
    "active_quarantines": 2,  // Quarentenas ativas
    "active_alerts": 1,       // Alertas ativos
    "total_threats": 150,     // Ameaças detectadas
    "total_heals": 45,        // Auto-curas realizadas
    "total_blocks": 23,       // Bloqueios realizados
    "uptime": "72h30m"        // Tempo online
}
```

---

## 🎯 FILOSOFIA DE DEFESA

```
"O sistema deve se defender sozinho. Humanos são para casos excepcionais."

"Melhor falhar rápido do que falhar devagar."

"Se algo impossível acontecer, o sistema grita antes de quebrar."

"Isolar para proteger, não para punir."

"A melhor defesa é fazer o atacante pensar que está ganhando."
```

---

*Última atualização: Janeiro 2026*


---

## 🎯 DETECÇÃO DE PADRÕES DE ATAQUE

O sistema detecta automaticamente os seguintes padrões:

### 1. Brute Force
```
Indicadores:
- Muitas falhas de auth do mesmo IP
- 5+ tentativas = suspeito
- 20+ tentativas = high severity
- 50+ tentativas = critical

Resposta:
- Block IP progressivo (5min → 20min → 1h → 24h)
```

### 2. DDoS
```
Indicadores:
- 100+ requests/segundo
- Múltiplos IPs diferentes
- Janela de tempo curta

Resposta:
- Blackhole de todos os IPs envolvidos
- Alerta critical
```

### 3. Credential Stuffing
```
Indicadores:
- Mesmo IP tentando muitos usuários diferentes
- 10+ usuários diferentes = suspeito

Resposta:
- Block IP
- Alerta high
```

### 4. Scanning/Enumeration
```
Indicadores:
- Mesmo IP acessando muitos endpoints diferentes
- 20+ endpoints = suspeito

Resposta:
- Throttle → Block
```

### 5. Bot Activity
```
Indicadores:
- User-Agent suspeito (curl, wget, python, bot, spider)
- User-Agent vazio

Resposta:
- Challenge (CAPTCHA)
```

### 6. Ataque Coordenado
```
Indicadores:
- Múltiplos IPs atacando mesmo endpoint
- 10+ IPs diferentes = coordenado

Resposta:
- Blackhole de todos
- Alerta critical
```

---

## 🔧 CONFIGURAÇÃO DE THRESHOLDS

```go
// Self-Defense
scoreThreshold  = 50.0   // Score para começar a agir
blockThreshold  = 100.0  // Score para bloquear
decayRate       = 0.1    // 10% decay por minuto

// Circuit Breaker
MaxFailures     = 5      // Falhas para abrir
ResetTimeout    = 30s    // Tempo para half-open
SuccessThreshold = 2     // Sucessos para fechar

// Anomaly Detection
zScoreThreshold = 3.0    // Desvios padrão para anomalia
minSamples      = 30     // Mínimo de amostras
learningPeriod  = 5min   // Período de aprendizado

// Quarantine
cleanupInterval = 5min   // Intervalo de limpeza
```

---

## 📁 ARQUIVOS DO SISTEMA DE DEFESA

```
backend/pkg/immunity/
├── immunity.go           → Orquestrador central
├── self_defense.go       → Defesa ativa contra ataques
├── anomaly_detection.go  → Detecção de anomalias
├── circuit_breaker.go    → Circuit breaker
├── quarantine.go         → Sistema de quarentena
├── auto_healing.go       → Auto-recuperação
├── alert_escalation.go   → Escalação de alertas
├── integrations.go       → Integrações externas
└── handler.go            → HTTP handlers

backend/pkg/invariants/
├── invariants.go         → Core do sistema
├── handler.go            → HTTP handlers
├── api_invariants.go     → Invariantes de API
├── application_invariants.go
├── audit_invariants.go
├── billing_invariants.go
├── data_invariants.go
├── execution_invariants.go
├── rules_invariants.go
├── secrets_invariants.go
├── telemetry_invariants.go
├── webhook_invariants.go
└── ads_invariants.go

backend/pkg/middleware/
├── env_guard.go          → Proteção de ambiente
├── security_headers.go   → Headers de segurança
├── ratelimit.go          → Rate limiting
└── subscription.go       → Verificação de plano

backend/internal/killswitch/
├── service.go            → Serviço de kill switch
├── handler.go            → HTTP handlers
└── models.go             → Modelos

backend/internal/risk/
├── service.go            → Análise de risco
├── handler.go            → HTTP handlers
└── models.go             → Modelos
```

---

## 🖥️ ENDPOINTS DE MONITORAMENTO

| Endpoint | Descrição |
|----------|-----------|
| `GET /api/v1/immunity/status` | Status do sistema imunológico |
| `GET /api/v1/immunity/stats` | Estatísticas completas |
| `GET /api/v1/invariants` | Status das invariantes |
| `GET /api/v1/invariants/violations` | Violações recentes |
| `GET /api/v1/killswitch/status` | Status dos kill switches |
| `GET /api/v1/risk/:app_id` | Score de risco do app |
| `GET /api/v1/health` | Health check geral |

---

## 🚀 COMO TESTAR O SISTEMA DE DEFESA

```bash
# 1. Simular brute force (vai ser bloqueado)
for i in {1..10}; do
  curl -X POST https://api/auth/login \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# 2. Verificar status de defesa
curl https://api/immunity/status

# 3. Verificar quarentenas ativas
curl https://api/immunity/quarantine

# 4. Verificar circuit breakers
curl https://api/immunity/circuits

# 5. Verificar invariantes
curl https://api/invariants
```

---

*Sistema de defesa ativo 24/7. Última atualização: Janeiro 2026*
