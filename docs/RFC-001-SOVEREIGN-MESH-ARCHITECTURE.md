# RFC-001: Arquitetura de Mesh Soberana

**Status:** Aprovado  
**Autor:** Sistema PROST-QS  
**Data:** 13 de Janeiro de 2026  
**Versão:** 1.0

---

## Resumo Executivo

Este RFC define a arquitetura de uma rede social distribuída que opera em duas camadas:
1. **Rede Soberana (P2P)** - Cada dispositivo é um nó completo
2. **Faróis (Cloud)** - Servidores de descoberta e aceleração

A premissa fundamental: **"O erro não é ter servidores. O erro é os dados que eles carregam."**

---

## 1. Problema

As redes sociais atuais sofrem de:
- Centralização de dados em servidores corporativos
- Dependência de infraestrutura cloud para existir
- Monetização baseada em vigilância
- Censura arbitrária
- Single point of failure

---

## 2. Solução Proposta

### 2.1 Arquitetura de Duas Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA 2: FARÓIS (CLOUD)                     │
│                                                                 │
│  Funções PERMITIDAS:           Funções PROIBIDAS:              │
│  ✅ Discovery global           ❌ Armazenar mensagens          │
│  ✅ Bootstrap                  ❌ Guardar arquivos             │
│  ✅ Relay/TURN                 ❌ Acessar chaves privadas      │
│  ✅ Ledger de presença         ❌ Ler conteúdo de posts        │
│  ✅ Billing/Identity           ❌ Decidir conexões             │
│  ✅ Telemetria agregada        ❌ Ser fonte de verdade         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Discovery / Bootstrap / Relay
                              │
┌─────────────────────────────────────────────────────────────────┐
│                 CAMADA 1: REDE SOBERANA (P2P)                   │
│                                                                 │
│  Cada dispositivo possui:                                       │
│  • Identidade Ed25519 local                                    │
│  • Storage SQLCipher criptografado                             │
│  • libp2p (DHT, GossipSub, mDNS)                              │
│  • WebRTC para chamadas                                        │
│  • Cache de peers conhecidos                                   │
│                                                                 │
│  INVARIANTE: Se o farol cair, a mesh continua.                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Níveis de Conectividade

| Nível | Tecnologia | Funciona sem Internet? |
|-------|------------|------------------------|
| 🟢 Local | mDNS, LAN, Bluetooth | ✅ Sim |
| 🟡 Mesh | DHT, GossipSub, Relay | ✅ Sim (com qualquer caminho) |
| 🔵 Global | Faróis Cloud | ❌ Não (mas é opcional) |

### 2.3 Ledger de Presença

O farol mantém um ledger operacional (não blockchain):

```sql
CREATE TABLE presence_ledger (
    peer_id         TEXT PRIMARY KEY,
    network_hash    TEXT NOT NULL,      -- Hash da região (não IP)
    lighthouse_id   TEXT NOT NULL,
    capabilities    JSONB DEFAULT '{}',
    reputation      INTEGER DEFAULT 100,
    last_seen       TIMESTAMP
);
```

**O que o ledger armazena:**
- Quem está online
- Onde (hash, não localização exata)
- Capacidades (bandwidth, storage, relay)
- Reputação

**O que o ledger NUNCA armazena:**
- Mensagens
- Arquivos
- Chaves privadas
- Conteúdo de posts
- Histórico de conversas

---

## 3. Invariantes Técnicas

Estas regras são implementadas em código e DEVEM ser verificadas em runtime:

### 3.1 INV-001: Farol Não Armazena Conteúdo

```go
func ValidateFarolCannotStoreContent(dataType string, data interface{}) error {
    // Bloqueia: message, chat, file, media, private_key
    // Permite: presence, capability, heartbeat, reputation
}
```

### 3.2 INV-002: Farol Não Acessa Chaves Privadas

```go
func ValidateFarolCannotAccessPrivateKey(fieldName string, value interface{}) error {
    // Bloqueia: private_key, secret_key, mnemonic, seed
    // Permite: public_key, peer_id
}
```

### 3.3 INV-003: Mesh Sobrevive Sem Farol

```go
type MeshSurvivalRequirements struct {
    HasLocalDiscovery    bool // mDNS - OBRIGATÓRIO
    HasDHTRouting        bool // Kademlia - OBRIGATÓRIO
    HasLocalStorage      bool // SQLCipher - OBRIGATÓRIO
    HasOfflineIdentity   bool // Ed25519 - OBRIGATÓRIO
}
```

### 3.4 INV-004: Entrada Não Depende de Cloud

```go
func ValidateMeshEntryIndependence(req MeshEntryRequirements) error {
    // Se requer cloud, DEVE ter fallback local
    // Se requer farol, DEVE ter peer bootstrap alternativo
}
```

### 3.5 INV-005: Fonte de Verdade Correta

| Tipo de Dado | Fonte de Verdade |
|--------------|------------------|
| Chaves privadas | LOCAL |
| Mensagens | LOCAL |
| Arquivos | LOCAL |
| Posts públicos | P2P |
| Presença | CLOUD (permitido) |
| Billing | CLOUD (permitido) |

---

## 4. Modelo de Ameaças

### 4.1 Ameaça: Farol Comprometido

**Cenário:** Atacante ganha controle de um farol.

**Impacto:**
- ❌ Não pode ler mensagens (E2E)
- ❌ Não pode acessar arquivos (local)
- ❌ Não pode impersonar usuários (Ed25519)
- ⚠️ Pode negar serviço de discovery
- ⚠️ Pode retornar peers maliciosos

**Mitigação:**
- Múltiplos faróis independentes
- Fallback para DHT
- Verificação de peers via reputação

### 4.2 Ameaça: Farol Censurado

**Cenário:** Governo bloqueia acesso aos faróis.

**Impacto:**
- ❌ Não afeta comunicação local (mDNS)
- ❌ Não afeta mesh existente (DHT)
- ⚠️ Novos usuários têm dificuldade de entrar

**Mitigação:**
- Bootstrap via peers conhecidos
- QR code com endereços de peers
- Faróis em múltiplas jurisdições

### 4.3 Ameaça: Todos os Faróis Caem

**Cenário:** Desastre global derruba todos os faróis.

**Impacto:**
- ✅ Mesh local continua (mDNS)
- ✅ Mesh regional continua (DHT)
- ✅ Mensagens continuam (P2P direto)
- ⚠️ Discovery global degradado

**Mitigação:**
- Cache de peers conhecidos
- DHT distribuído
- Nenhuma dependência crítica de cloud

---

## 5. Monetização Ética

### 5.1 Modelo de Receita

| Fonte | Descrição | Ético? |
|-------|-----------|--------|
| Planos | Free/Pro/Enterprise por capacidade | ✅ |
| Ads contextuais | Baseados em contexto, não conteúdo | ✅ |
| Premium routing | Relay prioritário para Pro | ✅ |
| Farol dedicado | Enterprise com SLA | ✅ |

### 5.2 O que NUNCA fazemos

- ❌ Vender dados de usuários
- ❌ Ler mensagens para targeting
- ❌ Tracking de comportamento individual
- ❌ Vender acesso a conteúdo privado

---

## 6. Implementação

### 6.1 Componentes Existentes

- `backend/internal/lighthouse/` - Serviço de farol
- `backend/pkg/invariants/sovereignty_invariants.go` - Verificações
- `apps/APP-2/nexus-node/` - Nó P2P completo
- `apps/APP-2/nexus-node/pkg/lighthouse/client.go` - Cliente de farol

### 6.2 Roadmap

| Fase | Entrega | Status |
|------|---------|--------|
| 1 | Farol básico (bootstrap, presence) | ✅ Implementado |
| 2 | Invariantes em código | ✅ Implementado |
| 3 | Multi-farol (geo-distribuído) | 🔄 Em progresso |
| 4 | Mobile como edge server | 📋 Planejado |
| 5 | Bluetooth/Wi-Fi Direct | 📋 Planejado |

---

## 7. Conclusão

Esta arquitetura resolve o problema de redes sociais centralizadas sem cair no extremo oposto de negar a utilidade da cloud. 

**Princípio central:** Cloud como utilidade, não como autoridade.

O sistema:
- Funciona hoje
- Escala amanhã
- Monetiza sem vender alma
- Não morre quando desligam um servidor
- Não trai o usuário quando cresce

---

## Referências

- `docs/ARQUITETURA-FAROIS-LIGHTHOUSE.md` - Arquitetura detalhada
- `backend/pkg/invariants/sovereignty_invariants.go` - Código das invariantes
- `backend/scripts/migrations/20260113_create_lighthouse_tables.sql` - Schema do ledger

---

*"Você não está negando a cloud. Você está domesticando a cloud."*
