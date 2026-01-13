# THREAT MODEL: Sovereign Mesh Architecture

**Documento:** TM-001  
**Status:** Ativo  
**Data:** 13 de Janeiro de 2026  
**Classificação:** Interno - Arquitetura de Segurança

---

## 1. Escopo

Este documento analisa ameaças ao sistema PROST-QS + Nexus Mesh em três dimensões:
- **Técnica** - Ataques a código, infraestrutura, protocolos
- **Econômica** - Ataques via incentivos financeiros
- **Política** - Coerção legal, censura, pressão institucional

---

## 2. Ativos Críticos

| Ativo | Localização | Criticidade |
|-------|-------------|-------------|
| Chaves privadas Ed25519 | LOCAL (dispositivo) | 🔴 CRÍTICO |
| Mensagens E2E | LOCAL (SQLCipher) | 🔴 CRÍTICO |
| Arquivos do usuário | LOCAL + P2P | 🔴 CRÍTICO |
| Identidade do usuário | LOCAL + Kernel | 🟡 ALTO |
| Ledger de presença | Farol (cloud) | 🟢 MÉDIO |
| Telemetria agregada | Kernel (cloud) | 🟢 MÉDIO |
| Billing/Planos | Kernel (cloud) | 🟢 MÉDIO |

---

## 3. Superfície de Ataque

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPERFÍCIE DE ATAQUE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CAMADA CLOUD (Faróis + Kernel)                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • API HTTP pública                                       │   │
│  │ • Ledger de presença                                     │   │
│  │ • Autenticação OAuth                                     │   │
│  │ • Billing/Stripe webhooks                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  CAMADA P2P (Mesh)          │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • libp2p (DHT, GossipSub)                               │   │
│  │ • WebRTC (DTLS/SRTP)                                    │   │
│  │ • mDNS local                                            │   │
│  │ • Relay/TURN                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  CAMADA LOCAL (Dispositivo) │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • SQLCipher (storage criptografado)                     │   │
│  │ • Keychain/Keystore (chaves)                            │   │
│  │ • App binário (mobile/desktop)                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Ameaças Técnicas

### T-001: Farol Comprometido

**Cenário:** Atacante ganha controle administrativo de um farol.

**Vetor:** Credenciais vazadas, vulnerabilidade no servidor, insider threat.

**Impacto:**
| O que pode fazer | O que NÃO pode fazer |
|------------------|----------------------|
| ⚠️ Negar discovery | ❌ Ler mensagens (E2E) |
| ⚠️ Retornar peers maliciosos | ❌ Acessar arquivos (local) |
| ⚠️ Coletar metadados de presença | ❌ Impersonar usuários (Ed25519) |
| ⚠️ Manipular reputação | ❌ Forçar conexões |

**Mitigações:**
```go
// INV: Farol não armazena conteúdo
ValidateFarolCannotStoreContent()

// INV: Múltiplos faróis independentes
if len(availableLighthouses) < 2 {
    return ErrInsufficientRedundancy
}

// INV: Fallback para DHT
if !lighthouseAvailable {
    return bootstrapViaDHT()
}
```

**Severidade:** 🟡 MÉDIO (degradação, não comprometimento)

---

### T-002: Ataque Sybil na Mesh

**Cenário:** Atacante cria milhares de peers falsos para dominar a rede.

**Vetor:** Automação de criação de identidades, botnets.

**Impacto:**
| O que pode fazer | O que NÃO pode fazer |
|------------------|----------------------|
| ⚠️ Poluir DHT | ❌ Ler mensagens E2E |
| ⚠️ Degradar discovery | ❌ Forjar assinaturas |
| ⚠️ Consumir recursos | ❌ Acessar dados locais |

**Mitigações:**
```go
// Sistema de reputação baseado em comportamento
type PeerReputation struct {
    Score           int       // 0-100
    UptimeHours     int       // Tempo online
    SuccessfulRelays int      // Relays bem-sucedidos
    ReportedBy      []string  // Denúncias
    CreatedAt       time.Time // Idade da identidade
}

// Peers novos têm capacidade limitada
func (p *Peer) MaxConnections() int {
    if p.Reputation.Score < 50 {
        return 5 // Limite baixo para novos
    }
    return 100
}

// Proof-of-work leve para criar identidade
func CreateIdentity() (*Identity, error) {
    // Requer ~1s de CPU para criar
    nonce := solvePoW(difficulty: 18)
    return &Identity{Nonce: nonce, ...}
}
```

**Severidade:** 🟡 MÉDIO (degradação de performance)

---

### T-003: Fingerprinting via Telemetria

**Cenário:** Correlacionar telemetria agregada para identificar usuários.

**Vetor:** Análise estatística de padrões de uso.

**Impacto:**
| O que pode fazer | O que NÃO pode fazer |
|------------------|----------------------|
| ⚠️ Inferir padrões de uso | ❌ Ler conteúdo |
| ⚠️ Estimar localização | ❌ Identificar contatos |
| ⚠️ Detectar horários ativos | ❌ Acessar mensagens |

**Mitigações:**
```go
// Telemetria com ruído diferencial
func SendTelemetry(event TelemetryEvent) {
    // Adicionar ruído
    event.Timestamp = addNoise(event.Timestamp, 5*time.Minute)
    event.SessionID = "" // Nunca enviar session ID
    
    // Agregar antes de enviar
    if len(telemetryBuffer) < 10 {
        telemetryBuffer = append(telemetryBuffer, event)
        return
    }
    
    // Enviar batch agregado
    sendAggregated(telemetryBuffer)
}

// Campos proibidos em telemetria
var ForbiddenTelemetryFields = []string{
    "ip_address",
    "device_id", 
    "precise_location",
    "contact_list",
    "message_content",
}
```

**Severidade:** 🟢 BAIXO (metadados, não conteúdo)

---

### T-004: Client Modificado Violando Invariantes

**Cenário:** Usuário usa client modificado que envia dados para terceiros.

**Vetor:** Fork malicioso, engenharia reversa.

**Impacto:**
| O que pode fazer | O que NÃO pode fazer |
|------------------|----------------------|
| ⚠️ Vazar dados do próprio usuário | ❌ Acessar dados de outros |
| ⚠️ Enviar mensagens falsas | ❌ Forjar assinaturas de outros |
| ⚠️ Ignorar rate limits locais | ❌ Bypassar verificação de peers |

**Mitigações:**
```go
// Verificação de assinatura em todas as mensagens
func VerifyMessage(msg Message) error {
    if !ed25519.Verify(msg.SenderPubKey, msg.Content, msg.Signature) {
        return ErrInvalidSignature
    }
    return nil
}

// Peers verificam comportamento uns dos outros
func (p *Peer) ReportMisbehavior(peerId string, reason string) {
    // Propagar para rede
    gossip.Publish("misbehavior", MisbehaviorReport{
        Reporter: p.ID,
        Reported: peerId,
        Reason:   reason,
        Timestamp: time.Now(),
    })
}
```

**Severidade:** 🟡 MÉDIO (afeta só o usuário malicioso)

---

## 5. Ameaças Econômicas

### E-001: Faróis Capturados por Capital

**Cenário:** Investidor compra/controla todos os faróis e muda as regras.

**Vetor:** Aquisição, pressão de board, pivot de negócio.

**Impacto:**
| O que pode fazer | O que NÃO pode fazer |
|------------------|----------------------|
| ⚠️ Degradar serviço | ❌ Acessar dados E2E |
| ⚠️ Aumentar preços | ❌ Forçar uso de farol |
| ⚠️ Adicionar tracking | ❌ Quebrar criptografia |

**Mitigações:**
```go
// INV: Mesh funciona sem farol
func (m *Mesh) OnAllLighthousesCompromised() {
    // Continua via DHT + mDNS
    m.mode = ModeFullyDecentralized
    m.bootstrapViaPeerCache()
}

// Faróis são substituíveis
type LighthouseConfig struct {
    URLs        []string // Múltiplos faróis
    MinRequired int      // Mínimo para operar
    Fallback    string   // "dht" ou "peer_cache"
}

// Código é open source - qualquer um pode rodar farol
// Protocolo é documentado - interoperabilidade garantida
```

**Severidade:** 🟡 MÉDIO (degradação, não captura)

---

### E-002: Ataque Econômico via Billing

**Cenário:** Atacante explora billing para drenar recursos ou fraudar.

**Vetor:** Cartões roubados, chargebacks, abuso de trial.

**Impacto:**
| O que pode fazer | O que NÃO pode fazer |
|------------------|----------------------|
| ⚠️ Causar prejuízo financeiro | ❌ Acessar dados de outros |
| ⚠️ Abusar de recursos | ❌ Comprometer mesh |

**Mitigações:**
```go
// Rate limiting por identidade
func (b *BillingService) CreateSubscription(userID string) error {
    // Verificar histórico
    if b.hasChargebackHistory(userID) {
        return ErrHighRiskUser
    }
    
    // Limite de trials
    if b.trialCount(userID) > 1 {
        return ErrTrialLimitExceeded
    }
    
    return nil
}

// Capabilities degradam gracefully
func (u *User) OnPaymentFailed() {
    u.Plan = PlanFree // Downgrade, não bloqueio
    u.GracePeriod = 7 * 24 * time.Hour
}
```

**Severidade:** 🟢 BAIXO (problema financeiro, não de segurança)

---

## 6. Ameaças Políticas

### P-001: Ordem Judicial para Dados

**Cenário:** Governo exige acesso a mensagens de um usuário.

**Vetor:** Mandado judicial, ordem de grampo.

**Resposta Técnica:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    O QUE PODEMOS ENTREGAR                       │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Metadados de presença (quando online)                        │
│ ✅ Dados de billing (nome, email, pagamentos)                   │
│ ✅ Telemetria agregada (uso geral)                              │
│ ✅ IP de conexão ao farol                                       │
├─────────────────────────────────────────────────────────────────┤
│                    O QUE NÃO TEMOS                              │
├─────────────────────────────────────────────────────────────────┤
│ ❌ Conteúdo de mensagens (E2E, não temos chave)                 │
│ ❌ Arquivos do usuário (local, não temos acesso)                │
│ ❌ Lista de contatos (local)                                    │
│ ❌ Histórico de conversas (local)                               │
│ ❌ Chaves privadas (nunca saem do dispositivo)                  │
└─────────────────────────────────────────────────────────────────┘
```

**Mitigação:** Arquitetura torna impossível compliance com ordens de grampo de conteúdo.

**Severidade:** 🟢 BAIXO (limitação técnica, não política)

---

### P-002: Bloqueio de Faróis por Governo

**Cenário:** País bloqueia acesso a todos os faróis conhecidos.

**Vetor:** Firewall nacional, bloqueio de DNS, DPI.

**Impacto:**
| O que é afetado | O que continua funcionando |
|-----------------|---------------------------|
| ⚠️ Discovery global | ✅ Mesh local (mDNS) |
| ⚠️ Novos usuários | ✅ Usuários existentes |
| ⚠️ Bootstrap inicial | ✅ DHT entre peers |

**Mitigações:**
```go
// Bootstrap alternativo via QR code
func BootstrapViaQR(qrData string) error {
    peers := decodeQRPeers(qrData)
    return mesh.ConnectToPeers(peers)
}

// Domain fronting (se necessário)
func ConnectToLighthouse(url string) (*Conn, error) {
    if isBlocked(url) {
        return connectViaCDN(url) // Fronting via CDN
    }
    return connect(url)
}

// Faróis em múltiplas jurisdições
var Lighthouses = []Lighthouse{
    {Region: "us-east", Jurisdiction: "USA"},
    {Region: "eu-west", Jurisdiction: "Germany"},
    {Region: "asia", Jurisdiction: "Singapore"},
    {Region: "sa-east", Jurisdiction: "Brazil"},
}
```

**Severidade:** 🟡 MÉDIO (degradação para novos usuários)

---

### P-003: Pressão para Adicionar Backdoor

**Cenário:** Governo/investidor pressiona para adicionar acesso privilegiado.

**Vetor:** Legislação, condição de investimento, ameaça legal.

**Defesa Técnica:**
```go
// Invariantes são código, não política
// Qualquer PR que viole é automaticamente rejeitado

func ValidateNoBackdoor(code []byte) error {
    // Verificar ausência de:
    // - Chaves hardcoded
    // - Endpoints de acesso privilegiado
    // - Bypass de criptografia
    // - Logging de conteúdo
    
    patterns := []string{
        "masterKey",
        "backdoor",
        "lawEnforcement",
        "skipEncryption",
        "logMessageContent",
    }
    
    for _, p := range patterns {
        if bytes.Contains(code, []byte(p)) {
            return ErrBackdoorDetected
        }
    }
    
    return nil
}

// Código é open source
// Builds são reproduzíveis
// Qualquer backdoor seria detectado pela comunidade
```

**Severidade:** 🟢 BAIXO (arquitetura impede compliance)

---

## 7. Matriz de Risco

| ID | Ameaça | Probabilidade | Impacto | Risco | Status |
|----|--------|---------------|---------|-------|--------|
| T-001 | Farol comprometido | MÉDIA | MÉDIO | 🟡 | Mitigado |
| T-002 | Ataque Sybil | MÉDIA | MÉDIO | 🟡 | Mitigado |
| T-003 | Fingerprinting | ALTA | BAIXO | 🟢 | Mitigado |
| T-004 | Client modificado | BAIXA | MÉDIO | 🟢 | Mitigado |
| E-001 | Captura por capital | BAIXA | MÉDIO | 🟢 | Mitigado |
| E-002 | Fraude billing | MÉDIA | BAIXO | 🟢 | Mitigado |
| P-001 | Ordem judicial | ALTA | BAIXO | 🟢 | Mitigado |
| P-002 | Bloqueio de faróis | MÉDIA | MÉDIO | 🟡 | Mitigado |
| P-003 | Pressão backdoor | BAIXA | CRÍTICO | 🟡 | Mitigado |

---

## 8. Invariantes de Segurança (Código)

Todas as mitigações são implementadas em:
- `backend/pkg/invariants/sovereignty_invariants.go`
- `backend/pkg/invariants/sovereignty_invariants_test.go`

```go
// Executar em CI/CD
func TestAllSecurityInvariants(t *testing.T) {
    // T-001: Farol não armazena conteúdo
    assert.Error(t, ValidateFarolCannotStoreContent("message", data))
    
    // T-003: Telemetria não tem campos proibidos
    assert.Error(t, ValidateTelemetryFields(forbiddenFields))
    
    // P-001: Dados E2E não são acessíveis
    assert.Nil(t, kernel.GetMessageContent(userId)) // Sempre nil
    
    // P-003: Sem backdoors
    assert.NoError(t, ValidateNoBackdoor(sourceCode))
}
```

---

## 9. Plano de Resposta a Incidentes

### Farol Comprometido
1. Revogar credenciais do farol
2. Notificar usuários para atualizar lista de faróis
3. Ativar fallback DHT
4. Investigar e corrigir vulnerabilidade

### Ataque Sybil Detectado
1. Aumentar threshold de reputação
2. Ativar PoW mais forte para novas identidades
3. Isolar peers suspeitos
4. Analisar padrões para melhorar detecção

### Ordem Judicial Recebida
1. Consultar jurídico
2. Entregar apenas dados que existem (metadados)
3. Documentar impossibilidade técnica para conteúdo
4. Publicar transparency report

---

## 10. Conclusão

O sistema foi projetado com **security by design**:

- **Dados sensíveis nunca saem do dispositivo**
- **Faróis são úteis mas não essenciais**
- **Invariantes são código, não promessas**
- **Ameaças políticas são mitigadas por limitação técnica**

A arquitetura não depende de confiança em operadores, investidores ou governos. Depende apenas de matemática (criptografia) e código auditável.

---

*"O melhor backdoor é aquele que não pode existir."*
