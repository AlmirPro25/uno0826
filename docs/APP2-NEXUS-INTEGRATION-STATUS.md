# APP-2 (Nexus) - Status de Integração com Prost-QS

> Documento de status da integração do Nexus P2P com o kernel de governança
> **Última atualização**: 13/01/2026 - Sistema de Chamadas P2P Completo

---

## 🚀 Status de Execução

| Componente | Porta | Status |
|------------|-------|--------|
| Backend (nexusd) | 8080 | ✅ Rodando |
| Frontend (Vite) | 3001 | ✅ Rodando |
| Kernel Bridge | - | ✅ Habilitada |
| WebRTC Signaling | /ws/signaling | ✅ Implementado |
| Kernel Produção | - | ⏳ Cold start |

---

## 📊 Status Geral

| Componente | Status | Descrição |
|------------|--------|-----------|
| Kernel Bridge (Go) | ✅ Implementado | `pkg/kernel/` com bridge, telemetry, identity, capabilities |
| API Handlers | ✅ Implementado | Endpoints `/api/v1/kernel/*` |
| Frontend Store | ✅ Implementado | `stores/kernelStore.ts` com Zustand |
| Frontend Service | ✅ Implementado | `services/kernel.ts` com API client |
| Settings UI | ✅ Implementado | `components/KernelSettings.tsx` |
| Backend P2P Link | ✅ Implementado | `identity/p2p_handler.go` no kernel |
| **WebRTC Signaling** | ✅ Implementado | `pkg/api/signaling.go` - Hub completo |
| **VideoCall Component** | ✅ Implementado | `components/VideoCall.tsx` |
| **P2P Hooks** | ✅ Implementado | `useWebRTC.ts`, `useP2PSignaling.ts` |
| **Call Overlay** | ✅ Implementado | `components/CallOverlay.tsx` |
| Documentação | ✅ Implementado | `KERNEL-INTEGRATION.md` |

---

## 🎥 Sistema de Chamadas P2P (NOVO)

### Arquitetura WebRTC

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXUS P2P CALLS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    WebSocket     ┌─────────────────────────┐  │
│  │   Peer A    │◄────────────────►│   Signaling Hub         │  │
│  │  (Browser)  │                  │   /ws/signaling         │  │
│  └──────┬──────┘                  │                         │  │
│         │                         │  - Room management      │  │
│         │ WebRTC                  │  - Message routing      │  │
│         │ (P2P direto)            │  - Peer notifications   │  │
│         │                         └─────────────────────────┘  │
│         │                                      ▲               │
│  ┌──────▼──────┐    WebSocket                  │               │
│  │   Peer B    │◄──────────────────────────────┘               │
│  │  (Browser)  │                                               │
│  └─────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes Implementados

| Arquivo | Descrição |
|---------|-----------|
| `pkg/api/signaling.go` | Hub de signaling WebSocket com rooms |
| `hooks/useWebRTC.ts` | Hook React para WebRTC com Perfect Negotiation |
| `hooks/useP2PSignaling.ts` | Hook para conexão com signaling server |
| `components/VideoCall.tsx` | Componente de chamada com 3 modos de visualização |
| `components/CallOverlay.tsx` | Overlay global para chamadas |
| `stores/p2pStore.ts` | Estado global com suporte a chamadas |

### Fluxo de Chamada

1. **Usuário A** clica em "Chamada de vídeo" no chat
2. `startCall('video', peerId)` atualiza o store
3. `CallOverlay` renderiza `VideoCall` em tela cheia
4. `useP2PSignaling` conecta ao `/ws/signaling`
5. Quando **Usuário B** entra na sala, recebe `peer_joined`
6. **Usuário A** (initiator) cria offer via `useWebRTC`
7. Offer é enviado via signaling WebSocket
8. **Usuário B** recebe offer, cria answer
9. ICE candidates são trocados
10. Conexão P2P direta estabelecida
11. Streams de vídeo/áudio fluem diretamente entre peers

### Endpoints de Signaling

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/ws/signaling` | WebSocket | Conexão de signaling |
| `/api/v1/signaling/stats` | GET | Estatísticas do hub |

### Mensagens de Signaling

```typescript
interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice' | 'join' | 'leave' | 'peer_joined' | 'peer_left'
  from: string      // peer ID do remetente
  to?: string       // peer ID do destinatário (opcional)
  room?: string     // ID da sala (opcional)
  payload?: any     // SDP ou ICE candidate
}
```

---

## 🏗️ Arquitetura Implementada

### Backend (Go) - `nexus-node/pkg/kernel/`

```
pkg/kernel/
├── bridge.go       # Core: estado, config, HTTP client
├── telemetry.go    # Emissão de eventos P2P para o kernel
├── identity.go     # Login, vinculação, refresh de tokens
├── capabilities.go # Verificação de limites e capabilities
└── handler.go      # HTTP handlers para API local
```

### Frontend (React) - `web/src/`

```
src/
├── stores/kernelStore.ts      # Estado global (Zustand + persist)
├── services/kernel.ts         # API client
├── components/KernelSettings.tsx  # UI de configuração
└── pages/Settings.tsx         # Página de settings completa
```

### Kernel Backend (Go) - `backend/internal/identity/`

```
identity/
└── p2p_handler.go  # Endpoint /identity/link-p2p para vincular PeerID
```

---

## 🔌 Endpoints Implementados

### Nexus Local API (`/api/v1/kernel/*`)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/status` | GET | Status da bridge (enabled, linked, queue_size) |
| `/enable` | POST | Habilitar integração |
| `/disable` | POST | Desabilitar integração |
| `/login` | POST | Login com email/senha |
| `/logout` | POST | Logout |
| `/link` | POST | Vincular identidade P2P ao usuário kernel |
| `/profile` | GET | Perfil do usuário no kernel |
| `/limits` | GET | Limites do plano atual |
| `/capability` | GET | Verificar capability específica |
| `/checkout` | POST | Criar sessão de checkout Stripe |

### Kernel API (`/api/v1/identity/*`)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/link-p2p` | POST | Vincular PeerID a usuário (com verificação de assinatura) |
| `/p2p-links` | GET | Listar identidades P2P vinculadas |
| `/p2p-links/:peer_id` | DELETE | Desvincular identidade P2P |

---

## 📊 Eventos de Telemetria

| Evento | Quando é emitido |
|--------|------------------|
| `p2p.node.started` | Nó inicia |
| `p2p.peer.connected` | Peer conecta |
| `p2p.peer.disconnected` | Peer desconecta |
| `p2p.message.sent` | Mensagem enviada |
| `p2p.call.started` | Chamada iniciada |
| `p2p.call.ended` | Chamada encerrada |
| `p2p.file.shared` | Arquivo compartilhado |
| `p2p.post.created` | Post criado no feed |
| `p2p.community.joined` | Entrou em comunidade |

---

## 💰 Capabilities e Limites

### Plano Free (padrão)

```json
{
  "max_peers": 10,
  "max_file_size_mb": 50,
  "max_communities": 3,
  "history_days": 7,
  "video_calls": false,
  "priority_relay": false
}
```

### Plano Pro

```json
{
  "max_peers": -1,
  "max_file_size_mb": 1024,
  "max_communities": -1,
  "history_days": -1,
  "video_calls": true,
  "priority_relay": true
}
```

---

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Habilitar integração
NEXUS_KERNEL_ENABLED=true

# URL do kernel
NEXUS_KERNEL_URL=https://uno0826.onrender.com

# Credenciais do app (opcional)
NEXUS_KERNEL_APP_KEY=your-app-key
NEXUS_KERNEL_APP_SECRET=your-app-secret
```

---

## 🧪 Como Testar

### 1. Iniciar Nexus sem kernel

```bash
cd apps/APP-2
docker-compose up
# Nexus funciona normalmente
```

### 2. Habilitar kernel via API

```bash
curl -X POST http://localhost:8080/api/v1/kernel/enable \
  -H "Content-Type: application/json" \
  -d '{"kernel_url": "https://uno0826.onrender.com"}'
```

### 3. Login e vinculação

```bash
# Login
curl -X POST http://localhost:8080/api/v1/kernel/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'

# Vincular identidade
curl -X POST http://localhost:8080/api/v1/kernel/link

# Ver limites
curl http://localhost:8080/api/v1/kernel/limits
```

### 4. Via UI

1. Abrir http://localhost:3000/settings
2. Ir na aba "Prost-QS"
3. Habilitar integração
4. Fazer login
5. Ver limites e fazer upgrade

---

## 📝 Próximos Passos

1. [x] ~~Implementar WebRTC Signaling Server~~
2. [x] ~~Criar hooks useWebRTC e useP2PSignaling~~
3. [x] ~~Criar componente VideoCall~~
4. [x] ~~Integrar chamadas na página Messages~~
5. [x] ~~Criar CallOverlay global~~
6. [ ] Integrar emissão de telemetria nos handlers existentes (message, call, file)
7. [ ] Adicionar verificação de capabilities antes de ações (video call, file share)
8. [ ] Implementar sincronização de perfil (nickname, avatar)
9. [ ] Adicionar testes unitários para o kernel bridge
10. [ ] Implementar webhook receiver para eventos do kernel
11. [ ] Testar chamadas em produção com Lighthouse

---

## 🔗 Arquivos Relacionados

### Kernel Integration
- `apps/APP-2/KERNEL-INTEGRATION.md` - Documentação completa
- `apps/APP-2/.env.example` - Variáveis de ambiente
- `apps/APP-2/nexus-node/pkg/kernel/` - Código Go
- `apps/APP-2/web/src/stores/kernelStore.ts` - Estado React
- `apps/APP-2/web/src/components/KernelSettings.tsx` - UI
- `backend/internal/identity/p2p_handler.go` - Endpoint de vinculação

### WebRTC/Signaling (NOVO)
- `apps/APP-2/nexus-node/pkg/api/signaling.go` - Signaling Hub
- `apps/APP-2/web/src/hooks/useWebRTC.ts` - Hook WebRTC
- `apps/APP-2/web/src/hooks/useP2PSignaling.ts` - Hook Signaling
- `apps/APP-2/web/src/components/VideoCall.tsx` - Componente de chamada
- `apps/APP-2/web/src/components/CallOverlay.tsx` - Overlay global
- `apps/APP-2/web/src/stores/p2pStore.ts` - Estado P2P com chamadas

---

*Documento atualizado em 13/01/2026*
