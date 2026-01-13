# 🗼 ARQUITETURA FARÓIS (LIGHTHOUSE NETWORK)

> "O erro não é ter servidores. O erro é os dados que eles carregam."

## VISÃO GERAL

O sistema opera em **duas camadas vivas** que coexistem:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA 2: FARÓIS (CLOUD)                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │ Vercel  │    │ Render  │    │ Fly.io  │    │ Railway │      │
│  │ (US-E)  │    │ (EU-W)  │    │ (ASIA)  │    │ (SA)    │      │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘      │
│       │              │              │              │            │
│       └──────────────┴──────────────┴──────────────┘            │
│                           │                                     │
│              LEDGER DE PRESENÇA (Supabase/Postgres)             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Discovery / Bootstrap / Relay
                            │
┌─────────────────────────────────────────────────────────────────┐
│                 CAMADA 1: REDE SOBERANA (P2P)                   │
│                                                                 │
│    📱          💻          📱          💻          📱           │
│   Mobile     Desktop     Mobile     Desktop     Mobile          │
│   (Node)     (Node)      (Node)     (Node)      (Node)          │
│      │          │           │          │           │            │
│      └──────────┴───────────┴──────────┴───────────┘            │
│                    MESH P2P (libp2p)                            │
│              mDNS / DHT / GossipSub / WebRTC                    │
└─────────────────────────────────────────────────────────────────┘
```

## O QUE OS FARÓIS FAZEM

### ✅ PERMITIDO (Funções do Farol)

| Função | Descrição |
|--------|-----------|
| **Discovery** | Resolver "quem está online" e "por onde entro" |
| **Bootstrap** | Ponto de entrada inicial para novos nós |
| **Relay/TURN** | Ponte para NAT traversal quando P2P direto falha |
| **Presence Ledger** | Registrar presença (não conteúdo) |
| **Telemetria Agregada** | Métricas anônimas de saúde da rede |
| **Aceleração** | Cache de chunks populares (públicos) |
| **Autenticação** | Login/OAuth para vincular identidade |
| **Billing** | Cobrança e limites de plano |

### ❌ PROIBIDO (Nunca no Farol)

| Proibido | Motivo |
|----------|--------|
| Mensagens privadas | Criptografia E2E, só peers têm acesso |
| Arquivos do usuário | Chunks distribuídos na mesh |
| Chaves privadas | Só existem no dispositivo local |
| Conteúdo de posts | Armazenado localmente, propagado via GossipSub |
| Histórico de chat | Local-first, sincronizado P2P |

## LEDGER DE PRESENÇA

O "Livro Razão" que você descreveu. **Não é blockchain**, é um registro operacional:

```sql
-- Tabela: presence_ledger
CREATE TABLE presence_ledger (
    peer_id         TEXT PRIMARY KEY,           -- 12D3KooW...
    network_hash    TEXT NOT NULL,              -- Hash da região (não IP)
    lighthouse_id   TEXT NOT NULL,              -- Qual farol registrou
    capabilities    JSONB DEFAULT '{}',         -- bandwidth, storage, uptime
    reputation      INTEGER DEFAULT 100,        -- Score de confiabilidade
    last_seen       TIMESTAMP DEFAULT NOW(),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Tabela: lighthouse_registry
CREATE TABLE lighthouse_registry (
    id              TEXT PRIMARY KEY,
    region          TEXT NOT NULL,              -- us-east, eu-west, asia, sa
    url             TEXT NOT NULL,
    status          TEXT DEFAULT 'active',
    capacity        INTEGER DEFAULT 10000,      -- Max peers
    current_load    INTEGER DEFAULT 0,
    last_heartbeat  TIMESTAMP DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX idx_presence_region ON presence_ledger(network_hash);
CREATE INDEX idx_presence_lighthouse ON presence_ledger(lighthouse_id);
CREATE INDEX idx_presence_last_seen ON presence_ledger(last_seen);
```

### O que o Ledger armazena:

```json
{
  "peer_id": "12D3KooWLtA7p37q9HVJTBnnxnfJJBo1Lyp5AfAqY64Pf2kiA3WU",
  "network_hash": "sha256:region_br_sp",
  "lighthouse_id": "lighthouse-sa-01",
  "capabilities": {
    "bandwidth_mbps": 100,
    "storage_gb": 50,
    "uptime_hours": 720,
    "relay_capable": true,
    "webrtc_capable": true
  },
  "reputation": 95,
  "last_seen": "2026-01-13T00:15:00Z"
}
```

## FLUXO DE CONEXÃO

```
┌─────────────────────────────────────────────────────────────────┐
│                     NOVO USUÁRIO ENTRA                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. APP INICIA                                                   │
│    - Gera par de chaves Ed25519 (local)                        │
│    - Peer ID derivado da chave pública                         │
│    - Tenta descoberta local (mDNS)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                    mDNS encontrou peers?
                     /              \
                   SIM              NÃO
                    │                │
                    ▼                ▼
┌──────────────────────┐  ┌──────────────────────────────────────┐
│ CONECTA DIRETO P2P   │  │ 2. CONSULTA FAROL MAIS PRÓXIMO       │
│ (Mesh Local)         │  │    GET /api/v1/lighthouse/bootstrap  │
└──────────────────────┘  └──────────────────────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────────────────────┐
                          │ 3. FAROL RETORNA:                    │
                          │    - Lista de peers próximos         │
                          │    - Endereços de relay (TURN)       │
                          │    - Outros faróis disponíveis       │
                          └──────────────────────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────────────────────┐
                          │ 4. PEER REGISTRA PRESENÇA            │
                          │    POST /api/v1/lighthouse/announce  │
                          │    { peer_id, capabilities }         │
                          └──────────────────────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────────────────────┐
                          │ 5. CONECTA VIA DHT/RELAY             │
                          │    - Tenta conexão direta            │
                          │    - Fallback para relay se NAT      │
                          └──────────────────────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────────────────────┐
                          │ 6. MESH ESTABELECIDA                 │
                          │    - Heartbeat periódico ao farol    │
                          │    - Comunicação P2P direta          │
                          └──────────────────────────────────────┘
```

## ARQUITETURA DOS FARÓIS

### Distribuição Geográfica

```
                    🌍 MAPA DE FARÓIS
                    
    ┌─────────────────────────────────────────────┐
    │                                             │
    │     🗼 US-EAST        🗼 EU-WEST            │
    │     (Vercel)          (Render)              │
    │                                             │
    │                  🗼 ASIA                    │
    │                  (Fly.io)                   │
    │                                             │
    │     🗼 SA-EAST                              │
    │     (Railway)                               │
    │                                             │
    └─────────────────────────────────────────────┘
```

### Stack de Cada Farol

```yaml
# lighthouse-service/
services:
  lighthouse:
    image: nexus-lighthouse:latest
    environment:
      - LIGHTHOUSE_ID=lighthouse-sa-01
      - LIGHTHOUSE_REGION=sa-east
      - SUPABASE_URL=https://xxx.supabase.co
      - SUPABASE_KEY=xxx
      - KERNEL_URL=https://uno0826-pr57.vercel.app
    ports:
      - "8080:8080"      # HTTP API
      - "4001:4001"      # libp2p
      - "3478:3478/udp"  # TURN/STUN
```

### API do Farol

```go
// Endpoints do Lighthouse
router.GET("/api/v1/lighthouse/bootstrap", h.Bootstrap)
router.POST("/api/v1/lighthouse/announce", h.Announce)
router.GET("/api/v1/lighthouse/peers", h.ListPeers)
router.GET("/api/v1/lighthouse/relays", h.GetRelays)
router.POST("/api/v1/lighthouse/heartbeat", h.Heartbeat)
router.GET("/api/v1/lighthouse/status", h.Status)
```

## DUAS CAMADAS: SOCIAL WEB vs DARK WEB

O Nexus opera em ambas:

| Camada | Características | Uso |
|--------|-----------------|-----|
| **Social Web** | Indexada, descoberta pública, feed aberto | Posts públicos, comunidades abertas |
| **Dark Web** | Privada, sem indexação, conexão direta | Chats E2E, grupos secretos, arquivos privados |

### Como funciona:

```
┌─────────────────────────────────────────────────────────────────┐
│                      SOCIAL WEB (Pública)                       │
│                                                                 │
│  - Posts públicos indexados no farol                           │
│  - Comunidades descobríveis                                     │
│  - Perfis públicos                                              │
│  - Feed global via GossipSub                                    │
│                                                                 │
│  Farol PODE: indexar, cachear, acelerar                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      DARK WEB (Privada)                         │
│                                                                 │
│  - Mensagens E2E (nunca passam pelo farol)                     │
│  - Grupos privados (convite direto)                            │
│  - Arquivos criptografados                                      │
│  - Conexões diretas P2P                                         │
│                                                                 │
│  Farol NÃO PODE: ler, indexar, armazenar                       │
└─────────────────────────────────────────────────────────────────┘
```

## MOBILE COMO SERVIDOR

Cada dispositivo é um nó completo:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISPOSITIVO DO USUÁRIO                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    NEXUS NODE                            │   │
│  │                                                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │ libp2p   │  │ SQLCipher│  │ WebRTC   │              │   │
│  │  │ (Mesh)   │  │ (Storage)│  │ (Calls)  │              │   │
│  │  └──────────┘  └──────────┘  └──────────┘              │   │
│  │                                                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │ DHT      │  │ GossipSub│  │ Kernel   │              │   │
│  │  │ (Routing)│  │ (PubSub) │  │ (Bridge) │              │   │
│  │  └──────────┘  └──────────┘  └──────────┘              │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Capacidades:                                                   │
│  - Relay para outros peers (se uptime > 1h)                    │
│  - Cache de chunks populares                                    │
│  - Bootstrap local (mDNS)                                       │
│  - Sincronização offline-first                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Comportamento por Estado:

| Estado | Comportamento |
|--------|---------------|
| **Ativo (foreground)** | Nó completo, relay, sincronização |
| **Background** | Heartbeat mínimo, recebe mensagens |
| **Dormindo** | Desconecta, farol guarda presença |
| **Acordando** | Reconecta, sincroniza delta do farol |

## INTEGRAÇÃO COM KERNEL (PROST-QS)

O Kernel continua sendo a fonte de verdade para:

```
┌─────────────────────────────────────────────────────────────────┐
│                    KERNEL (PROST-QS)                            │
│                                                                 │
│  ✅ Identidade (quem é o usuário)                              │
│  ✅ Billing (planos, limites, pagamentos)                      │
│  ✅ Capabilities (o que pode fazer)                            │
│  ✅ Telemetria agregada (métricas anônimas)                    │
│  ✅ Regras de negócio (rate limits, quotas)                    │
│  ✅ Ads (leilão de anúncios fora do conteúdo)                  │
│                                                                 │
│  ❌ Mensagens (nunca)                                          │
│  ❌ Arquivos (nunca)                                           │
│  ❌ Chaves privadas (nunca)                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## MONETIZAÇÃO ÉTICA

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODELO DE RECEITA                            │
│                                                                 │
│  💰 PLANOS                                                      │
│     - Free: 10 peers, 50MB arquivo, 3 comunidades              │
│     - Pro: ilimitado, vídeo, relay prioritário                 │
│     - Enterprise: farol dedicado, SLA                          │
│                                                                 │
│  📢 ADS (Éticos)                                                │
│     - Leilão contextual (não baseado em conteúdo privado)      │
│     - Promoção de comunidades                                   │
│     - Destaque de criadores                                     │
│     - Nunca: tracking de mensagens, venda de dados             │
│                                                                 │
│  🚀 PREMIUM ROUTING                                             │
│     - Relay prioritário para Pro                                │
│     - Menor latência                                            │
│     - Mais bandwidth                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## INVARIANTES DE SEGURANÇA

```go
// Regras que NUNCA podem ser violadas

// 1. Farol nunca armazena conteúdo privado
func (l *Lighthouse) StoreContent(content []byte) error {
    return ErrForbidden // SEMPRE
}

// 2. Farol nunca tem acesso a chaves privadas
func (l *Lighthouse) GetPrivateKey(peerId string) error {
    return ErrForbidden // SEMPRE
}

// 3. Farol nunca lê mensagens
func (l *Lighthouse) ReadMessage(msgId string) error {
    return ErrForbidden // SEMPRE
}

// 4. Se farol cair, mesh continua
func (m *Mesh) OnLighthouseDown() {
    // Continua operando via DHT/mDNS
    // Apenas discovery global fica degradado
}
```

## PRÓXIMOS PASSOS

1. **Implementar Lighthouse Service** - Serviço Go para os faróis
2. **Criar tabelas no Supabase** - Ledger de presença
3. **Deploy multi-região** - Vercel, Render, Fly.io, Railway
4. **Integrar no Nexus Node** - Bootstrap via farol
5. **Testar failover** - Garantir que mesh sobrevive sem farol

---

*"Você não está negando a cloud. Você está domesticando a cloud."*
