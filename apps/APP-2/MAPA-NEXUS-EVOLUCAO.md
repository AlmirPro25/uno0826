# 🗺️ MAPA DO NEXUS - Sistema e Evolução

> Documento estratégico do APP-2 (Nexus Sovereign Mesh Network)

---

## 📊 ESTADO ATUAL

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           NEXUS SOVEREIGN MESH                                 ║
║                              v0.1.0-alpha                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │                         FRONTEND (React)                             │    ║
║   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │    ║
║   │   │Dashboard │ │  Chat    │ │  Feed    │ │ Settings │              │    ║
║   │   │  P2P     │ │ Window   │ │ Social   │ │ +Kernel  │              │    ║
║   │   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘              │    ║
║   │        └────────────┴────────────┴────────────┘                     │    ║
║   │                          │                                          │    ║
║   │                    WebSocket + REST                                 │    ║
║   └──────────────────────────┼──────────────────────────────────────────┘    ║
║                              │                                               ║
║   ┌──────────────────────────▼──────────────────────────────────────────┐    ║
║   │                      BACKEND (Go)                                    │    ║
║   │                                                                      │    ║
║   │   ┌─────────────────────────────────────────────────────────────┐   │    ║
║   │   │                    API SERVER (:8080)                        │   │    ║
║   │   │  /api/v1/status    /api/v1/peers    /api/v1/kernel/*        │   │    ║
║   │   └─────────────────────────┬───────────────────────────────────┘   │    ║
║   │                             │                                        │    ║
║   │   ┌─────────────────────────▼───────────────────────────────────┐   │    ║
║   │   │                    P2P HOST (libp2p)                         │   │    ║
║   │   │                                                              │   │    ║
║   │   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │    ║
║   │   │  │   DHT    │  │ GossipSub│  │  WebRTC  │  │   mDNS   │    │   │    ║
║   │   │  │ Kademlia │  │  PubSub  │  │  Calls   │  │Discovery │    │   │    ║
║   │   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │    ║
║   │   └─────────────────────────────────────────────────────────────┘   │    ║
║   │                                                                      │    ║
║   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐    │    ║
║   │   │   SQLite    │  │  Identity   │  │    KERNEL BRIDGE        │    │    ║
║   │   │  SQLCipher  │  │   Ed25519   │  │  (Prost-QS Optional)    │    │    ║
║   │   └─────────────┘  └─────────────┘  └─────────────────────────┘    │    ║
║   └──────────────────────────────────────────────────────────────────────┘    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 FEATURES IMPLEMENTADAS

| Feature | Status | Descrição |
|---------|--------|-----------|
| **P2P Host** | ✅ 100% | libp2p com DHT, mDNS, Noise encryption |
| **Chat P2P** | ✅ 100% | GossipSub messaging entre peers |
| **WebRTC Calls** | ✅ 90% | Áudio funciona, vídeo parcial |
| **Feed Social** | ✅ 100% | Posts, likes, follows, blocks |
| **Comunidades** | ✅ 100% | Criar, entrar, sair, mensagens |
| **File Sharing** | ✅ 80% | Swarm chunking, download P2P |
| **Reputação** | ✅ 70% | Sistema básico de scoring |
| **Notificações** | ✅ 100% | Push local + WebSocket |
| **Kernel Bridge** | ✅ 100% | Integração opcional com Prost-QS |
| **Settings UI** | ✅ 100% | Configuração completa |

---

## 🏗️ ARQUITETURA DE PASTAS

```
apps/APP-2/
├── nexus-node/                    # Backend Go
│   ├── cmd/nexusd/main.go         # Entry point
│   └── pkg/
│       ├── api/                   # HTTP + WebSocket server
│       │   ├── server.go          # Rotas e handlers
│       │   └── hub.go             # WebSocket hub
│       ├── p2p/                   # Core P2P
│       │   ├── host.go            # libp2p host
│       │   ├── pubsub.go          # GossipSub
│       │   └── webrtc.go          # WebRTC service
│       ├── database/              # SQLite + SQLCipher
│       ├── identity/              # Ed25519 keypair
│       ├── social/                # Feed service
│       ├── community/             # Communities
│       ├── swarm/                 # File sharing
│       ├── reputation/            # Reputation system
│       ├── notifications/         # Notifications
│       ├── config/                # Configuration
│       └── kernel/                # 🆕 Prost-QS integration
│           ├── bridge.go
│           ├── telemetry.go
│           ├── identity.go
│           ├── capabilities.go
│           └── handler.go
│
├── web/                           # Frontend React
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx      # Main dashboard
│       │   └── Settings.tsx       # Settings + Kernel
│       ├── components/
│       │   ├── PeerList.tsx
│       │   ├── ChatWindow.tsx
│       │   ├── StatusCard.tsx
│       │   └── KernelSettings.tsx # 🆕 Kernel UI
│       ├── stores/
│       │   ├── p2pStore.ts
│       │   └── kernelStore.ts     # 🆕 Kernel state
│       └── services/
│           ├── api.ts
│           └── kernel.ts          # 🆕 Kernel API
│
├── docker-compose.yml             # Orquestração
├── Dockerfile                     # Build
├── .env.example                   # Configuração
├── README.md                      # Documentação
├── KERNEL-INTEGRATION.md          # 🆕 Guia de integração
└── MAPA-NEXUS-EVOLUCAO.md         # 🆕 Este documento
```

---

## 🚀 ROADMAP DE EVOLUÇÃO

### FASE 1: Estabilização (Atual → 2 semanas)

```
[ ] Testes unitários para pkg/p2p
[ ] Testes de integração P2P
[ ] E2EE de mensagens (Noise protocol)
[ ] TURN server para NAT difícil
[ ] Persistência de histórico cross-device
```

### FASE 2: Features Premium (2-4 semanas)

```
[ ] Chamadas de vídeo completas
[ ] Compartilhamento de tela
[ ] Grupos de voz (tipo Discord)
[ ] Backup criptografado na nuvem
[ ] Sincronização de perfil via kernel
```

### FASE 3: Monetização (4-8 semanas)

```
[ ] Plano Pro via Stripe (kernel billing)
[ ] Relay prioritário para Pro
[ ] Storage expandido para Pro
[ ] Analytics para criadores
[ ] API para bots/integrações
```

### FASE 4: Escala (8-16 semanas)

```
[ ] Mobile app (React Native)
[ ] Desktop app (Electron/Tauri)
[ ] Bridge para Matrix/XMPP
[ ] Federação com outras redes P2P
[ ] Marketplace de plugins
```

---

## 💰 MODELO DE NEGÓCIO

### Plano Free
- 10 peers simultâneos
- 50MB por arquivo
- 3 comunidades
- 7 dias de histórico
- Apenas áudio

### Plano Pro ($9.99/mês)
- Peers ilimitados
- 1GB por arquivo
- Comunidades ilimitadas
- Histórico ilimitado
- Vídeo + compartilhamento de tela
- Relay prioritário
- Backup na nuvem

### Plano Team ($29.99/mês)
- Tudo do Pro
- Admin dashboard
- Moderação avançada
- Analytics
- Suporte prioritário

---

## 🔧 COMO RODAR

### Desenvolvimento Local

```bash
# 1. Backend Go
cd apps/APP-2/nexus-node
go run cmd/nexusd/main.go

# 2. Frontend React (outro terminal)
cd apps/APP-2/web
npm install
npm run dev
```

### Docker

```bash
cd apps/APP-2
docker-compose up --build
```

### Acessar

- Frontend: http://localhost:3000
- API: http://localhost:8080
- WebSocket: ws://localhost:8080/ws

---

## 🔗 INTEGRAÇÃO COM KERNEL

### Habilitar (opcional)

```bash
# Via env
NEXUS_KERNEL_ENABLED=true
NEXUS_KERNEL_URL=https://uno0826.onrender.com

# Via API
curl -X POST http://localhost:8080/api/v1/kernel/enable \
  -d '{"kernel_url": "https://uno0826.onrender.com"}'
```

### Fluxo de Vinculação

```
1. Usuário abre Settings → Prost-QS
2. Clica "Habilitar Integração"
3. Faz login com email/senha do kernel
4. Identidade P2P é vinculada automaticamente
5. Limites do plano são aplicados
6. Telemetria começa a ser enviada (opt-in)
```

---

## 📈 MÉTRICAS DE SUCESSO

| Métrica | Meta Q1 2026 | Meta Q2 2026 |
|---------|--------------|--------------|
| Usuários ativos | 100 | 1.000 |
| Peers conectados/dia | 500 | 5.000 |
| Mensagens/dia | 10.000 | 100.000 |
| Conversão Pro | 5% | 10% |
| MRR | $500 | $5.000 |

---

## 🛡️ SEGURANÇA

| Camada | Implementação |
|--------|---------------|
| Identidade | Ed25519 keypair local |
| Transporte | TLS/Noise (libp2p) |
| Chamadas | DTLS/SRTP (WebRTC) |
| Storage | SQLCipher (AES-256) |
| Mensagens | E2EE (em desenvolvimento) |

---

## 🤝 CONTRIBUIÇÃO

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

*Documento criado em 12/01/2026 — Nexus v0.1.0-alpha*
