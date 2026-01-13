# Nexus ↔ Prost-QS Kernel Integration

> Integração opcional do Nexus P2P com o kernel de governança Prost-QS

---

## 📋 Visão Geral

O Nexus é uma rede social P2P **totalmente descentralizada**. A integração com o kernel Prost-QS é **opcional** e **opt-in**, permitindo que usuários que desejam recursos premium se conectem ao ecossistema UNO.

### Filosofia de Integração

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXUS NODE (Soberano)                        │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   libp2p    │  │  GossipSub  │  │   WebRTC    │             │
│  │    Host     │  │   PubSub    │  │   Service   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                 ┌────────▼────────┐                             │
│                 │  KERNEL BRIDGE  │  ◄── Opcional (opt-in)      │
│                 │   pkg/kernel/   │                             │
│                 └────────┬────────┘                             │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTPS (quando habilitado)
                           ▼
              ┌────────────────────────┐
              │    PROST-QS KERNEL     │
              │  https://uno0826...    │
              │  ┌──────────────────┐  │
              │  │    Telemetry     │  │  ← Eventos P2P (opt-in)
              │  │    Identity      │  │  ← Vinculação opcional
              │  │    Billing       │  │  ← Features premium
              │  │    Capabilities  │  │  ← Limites de plano
              │  └──────────────────┘  │
              └────────────────────────┘
```

### Princípios

1. **Soberania Preservada**: O nó Nexus funciona 100% sem o kernel
2. **Opt-in Total**: Usuário decide se quer conectar
3. **Fail-Safe**: Se o kernel estiver offline, o Nexus continua funcionando
4. **Privacidade**: Telemetria é agregada e anonimizada

---

## 🚀 Configuração

### Variáveis de Ambiente

```bash
# Habilitar integração (padrão: false)
NEXUS_KERNEL_ENABLED=true

# URL do kernel Prost-QS
NEXUS_KERNEL_URL=https://uno0826.onrender.com

# Credenciais do App (opcional, para telemetria sem login)
NEXUS_KERNEL_APP_KEY=your-app-key
NEXUS_KERNEL_APP_SECRET=your-app-secret
```

### Via API (Runtime)

```bash
# Habilitar
curl -X POST http://localhost:8080/api/v1/kernel/enable \
  -H "Content-Type: application/json" \
  -d '{"kernel_url": "https://uno0826.onrender.com"}'

# Desabilitar
curl -X POST http://localhost:8080/api/v1/kernel/disable
```

---

## 🔐 Autenticação e Vinculação

### Fluxo de Vinculação

```
1. Usuário habilita integração no Nexus
2. Usuário faz login com email/senha do kernel
3. Nexus assina o PeerID com a chave Ed25519
4. Kernel verifica assinatura e vincula identidades
5. Usuário agora tem: PeerID ↔ KernelUserID
```

### API de Login

```bash
# Login
curl -X POST http://localhost:8080/api/v1/kernel/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret"}'

# Vincular identidade P2P
curl -X POST http://localhost:8080/api/v1/kernel/link

# Ver perfil
curl http://localhost:8080/api/v1/kernel/profile
```

---

## 💰 Billing e Capabilities

### Planos

| Feature | Free | Pro |
|---------|------|-----|
| Peers simultâneos | 10 | ∞ |
| Tamanho de arquivo | 50MB | 1GB |
| Comunidades | 3 | ∞ |
| Histórico | 7 dias | ∞ |
| Chamadas de vídeo | ❌ | ✅ |
| Relay prioritário | ❌ | ✅ |

### Verificação de Capability

```go
// No código Go
if bridge.CanMakeVideoCall() {
    // Permitir chamada de vídeo
}

if bridge.CanShareFile(fileSize) {
    // Permitir compartilhamento
}
```

### API de Limites

```bash
# Ver limites atuais
curl http://localhost:8080/api/v1/kernel/limits

# Verificar capability específica
curl "http://localhost:8080/api/v1/kernel/capability?name=nexus.video_calls"

# Criar checkout para upgrade
curl -X POST http://localhost:8080/api/v1/kernel/checkout \
  -H "Content-Type: application/json" \
  -d '{"plan_id": "pro"}'
```

---

## 📊 Telemetria

### Eventos Emitidos

| Evento | Descrição |
|--------|-----------|
| `p2p.peer.connected` | Novo peer conectado |
| `p2p.peer.disconnected` | Peer desconectado |
| `p2p.message.sent` | Mensagem enviada |
| `p2p.call.started` | Chamada iniciada |
| `p2p.call.ended` | Chamada encerrada |
| `p2p.file.shared` | Arquivo compartilhado |
| `p2p.post.created` | Post criado no feed |
| `p2p.community.joined` | Entrou em comunidade |
| `p2p.node.started` | Nó iniciado |

### Exemplo de Uso

```go
// Emitir evento de peer conectado
bridge.EmitPeerConnected(peerID, latencyMs)

// Emitir evento de arquivo compartilhado
bridge.EmitFileShared(fileHash, sizeBytes, mimeType)

// Emitir evento customizado
bridge.EmitEvent("custom.event", map[string]interface{}{
    "key": "value",
})
```

### Privacidade

- Eventos são agregados em batches de 50 ou a cada 5 segundos
- PeerIDs de terceiros são hasheados antes de enviar
- Conteúdo de mensagens NUNCA é enviado
- Usuário pode desabilitar telemetria a qualquer momento

---

## 🏗️ Arquitetura do Código

### Backend (Go)

```
nexus-node/pkg/kernel/
├── bridge.go       # Core do bridge, gerenciamento de estado
├── telemetry.go    # Emissão de eventos para o kernel
├── identity.go     # Login, vinculação, refresh de tokens
├── capabilities.go # Verificação de limites e capabilities
└── handler.go      # HTTP handlers para API local
```

### Frontend (React)

```
web/src/
├── stores/kernelStore.ts      # Estado global do kernel
├── services/kernel.ts         # API client
├── components/KernelSettings.tsx  # UI de configuração
└── pages/Settings.tsx         # Página de settings
```

---

## 🔧 Integração no Código Existente

### Inicialização (main.go)

```go
import "github.com/nexus-sovereign-mesh/nexus-node/pkg/kernel"

// Criar bridge
kernelBridge := kernel.NewBridge(&kernel.Config{
    Enabled:   cfg.KernelEnabled,
    KernelURL: cfg.KernelURL,
    AppKey:    cfg.KernelAppKey,
    AppSecret: cfg.KernelAppSecret,
}, localPeerID)

// Emitir evento de início
kernelBridge.EmitNodeStarted(cfg.Version, []string{"mdns", "dht", "webrtc"})
```

### Verificação de Limites (antes de ações)

```go
// Antes de conectar novo peer
if !kernelBridge.CanConnectPeer(len(connectedPeers)) {
    return errors.New("limite de peers atingido - faça upgrade")
}

// Antes de compartilhar arquivo
if !kernelBridge.CanShareFile(fileSize) {
    return errors.New("arquivo muito grande para seu plano")
}

// Antes de chamada de vídeo
if !kernelBridge.CanMakeVideoCall() {
    return errors.New("chamadas de vídeo requerem plano Pro")
}
```

### Registrar Rotas (server.go)

```go
// Criar handler
kernelHandler := kernel.NewHandler(kernelBridge, privKey)

// Registrar rotas
kernelHandler.RegisterRoutes(router)
```

---

## 🧪 Testando a Integração

### 1. Iniciar sem kernel (padrão)

```bash
docker-compose up
# Nexus funciona normalmente, sem integração
```

### 2. Habilitar kernel via API

```bash
# Habilitar
curl -X POST http://localhost:8080/api/v1/kernel/enable \
  -d '{"kernel_url": "https://uno0826.onrender.com"}'

# Verificar status
curl http://localhost:8080/api/v1/kernel/status
```

### 3. Login e vinculação

```bash
# Login
curl -X POST http://localhost:8080/api/v1/kernel/login \
  -d '{"email": "test@example.com", "password": "test123"}'

# Vincular
curl -X POST http://localhost:8080/api/v1/kernel/link

# Ver limites
curl http://localhost:8080/api/v1/kernel/limits
```

---

## 📝 Notas de Implementação

### Graceful Degradation

O bridge foi projetado para falhar silenciosamente:

```go
func (b *Bridge) EmitEvent(eventType string, metadata map[string]interface{}) {
    if !b.IsEnabled() {
        return // Silenciosamente ignora se desabilitado
    }
    // ...
}
```

### Cache de Capabilities

Capabilities são cacheadas por 5 minutos para evitar requests excessivos:

```go
if time.Since(b.lastCapCheck) < 5*time.Minute {
    if allowed, ok := b.capabilities[capability]; ok {
        return allowed
    }
}
```

### Event Queue

Eventos são enfileirados e enviados em batch para não bloquear operações P2P:

```go
eventQueue: make(chan *TelemetryEvent, 1000) // Buffer de 1000 eventos
```

---

## 🔗 Links Relacionados

- [KERNEL_INTEGRATION_GUIDE.md](../../docs/KERNEL_INTEGRATION_GUIDE.md) - Guia geral de integração
- [SCE Integration](../SCE/KERNEL-INTEGRATION.md) - Como o SCE integra com o kernel
- [Prost-QS Architecture](../../ARQUITETURA-COMPLETA-PROST-QS.md) - Arquitetura do kernel

---

*Documento criado em 12/01/2026 — Nexus v0.1.0-alpha*
