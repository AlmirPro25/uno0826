# Fluxo de Mensagens P2P - Nexus Sovereign Mesh

**Data:** 13 de Janeiro de 2026  
**Status:** Implementado  
**Versão:** 1.0.0

---

## Visão Geral

Este documento descreve o fluxo completo de mensagens P2P no Nexus, desde a descoberta de peers via Lighthouse até a entrega de mensagens criptografadas.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE MENSAGEM P2P                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PEER A (Remetente)              PEER B (Destinatário)         │
│  ┌─────────────────┐             ┌─────────────────┐           │
│  │ Nexus Node      │             │ Nexus Node      │           │
│  │ ┌─────────────┐ │             │ ┌─────────────┐ │           │
│  │ │ Messaging   │ │             │ │ Messaging   │ │           │
│  │ │ Service     │ │             │ │ Service     │ │           │
│  │ └──────┬──────┘ │             │ └──────┬──────┘ │           │
│  │        │        │             │        │        │           │
│  │ ┌──────▼──────┐ │             │ ┌──────▼──────┐ │           │
│  │ │ GossipSub   │◄├─────────────┼─►│ GossipSub   │ │           │
│  │ │ (PubSub)    │ │             │ │ (PubSub)    │ │           │
│  │ └──────┬──────┘ │             │ └──────┬──────┘ │           │
│  │        │        │             │        │        │           │
│  │ ┌──────▼──────┐ │             │ ┌──────▼──────┐ │           │
│  │ │ libp2p     │◄├─────────────┼─►│ libp2p     │ │           │
│  │ │ Host       │ │   DHT/mDNS  │ │ Host       │ │           │
│  │ └─────────────┘ │             │ └─────────────┘ │           │
│  └────────┬────────┘             └────────┬────────┘           │
│           │                               │                     │
│           └───────────┬───────────────────┘                     │
│                       │                                         │
│              ┌────────▼────────┐                                │
│              │   LIGHTHOUSE    │                                │
│              │   (Farol)       │                                │
│              │                 │                                │
│              │ • Bootstrap     │                                │
│              │ • Discovery     │                                │
│              │ • Presence      │                                │
│              └─────────────────┘                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fluxo Detalhado


### 1. Bootstrap Inicial

```
Peer A inicia:
1. Gera identidade Ed25519 (se não existir)
2. Inicia libp2p host
3. Conecta ao Lighthouse: GET /api/v1/lighthouse/bootstrap
4. Recebe lista de peers conhecidos
5. Anuncia presença: POST /api/v1/lighthouse/announce
6. Inicia heartbeat loop (30s)
```

### 2. Descoberta de Peer

```
Peer A quer enviar mensagem para Peer B:

1. Verifica se já está conectado (Network.Connectedness)
2. Se não conectado:
   a. Consulta Lighthouse para presença de B
   b. Usa DHT.FindPeer() para obter endereços
   c. Conecta via libp2p.Connect()
3. Se Lighthouse offline:
   a. Tenta mDNS (rede local)
   b. Usa cache de peers conhecidos
```

### 3. Envio de Mensagem

```go
// Estrutura da mensagem
type DirectMessage struct {
    ID          string // Único: peer_a[:8]-timestamp-peer_b[:8]
    FromPeerID  string // 12D3KooW...
    ToPeerID    string // 12D3KooW...
    Content     []byte // Criptografado E2E
    ContentType string // text, image, file
    Timestamp   int64  // Unix timestamp
    Signature   []byte // Ed25519 signature
}

// Fluxo:
1. Criar mensagem
2. Assinar com chave privada Ed25519
3. Publicar no tópico GossipSub: nexus-dm-{peer_b[:16]}
4. Salvar localmente no SQLite
```

### 4. Recebimento de Mensagem

```
Peer B recebe mensagem:

1. GossipSub entrega no tópico nexus-dm-{peer_b[:16]}
2. Decodifica envelope JSON
3. Verifica assinatura Ed25519
4. Descriptografa conteúdo (E2E)
5. Salva no SQLite local
6. Envia ACK para Peer A
7. Dispara callback onMessage
```

### 5. Confirmações

```
ACK (Entrega):
- Peer B envia ACK imediatamente após receber
- Peer A recebe e dispara onDelivered

READ (Leitura):
- Peer B marca como lido na UI
- Envia READ para Peer A
- Peer A recebe e dispara onRead
```

---

## Endpoints da API

### Lighthouse (Backend Kernel)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/lighthouse/bootstrap` | Obter peers e relays |
| POST | `/api/v1/lighthouse/announce` | Anunciar presença |
| POST | `/api/v1/lighthouse/heartbeat` | Manter vivo |
| GET | `/api/v1/lighthouse/peers` | Listar peers online |
| GET | `/api/v1/lighthouse/relays` | Obter TURN/STUN |
| GET | `/api/v1/lighthouse/status` | Status do farol |

### Messaging (Nexus Node)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/messages/send` | Enviar mensagem |
| GET | `/api/messages/conversation/:peer_id` | Histórico |
| POST | `/api/messages/read/:message_id` | Marcar como lido |
| GET | `/api/messages/unread` | Contagem não lidas |

---

## Invariantes de Soberania

1. **Mensagens NUNCA passam pelo Lighthouse**
   - Lighthouse só conhece presença (peer_id, timestamp)
   - Conteúdo vai direto peer-to-peer via GossipSub

2. **Chaves privadas NUNCA saem do dispositivo**
   - Ed25519 gerada localmente
   - Assinatura feita localmente
   - Criptografia E2E com chave do destinatário

3. **Sistema funciona SEM Lighthouse**
   - mDNS para rede local
   - DHT para descoberta global
   - Cache de peers conhecidos

---

## Exemplo de Uso

```typescript
// Frontend (React)
const sendMessage = async (toPeerId: string, content: string) => {
  const response = await fetch('/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to_peer_id: toPeerId,
      content: content,
      content_type: 'text'
    })
  });
  
  const result = await response.json();
  console.log('Mensagem enviada:', result.message_id);
};

// WebSocket para tempo real
const ws = new WebSocket('ws://localhost:8081/ws');
ws.onmessage = (event) => {
  const { type, payload } = JSON.parse(event.data);
  
  switch (type) {
    case 'new_message':
      // Nova mensagem recebida
      addMessageToUI(payload);
      break;
    case 'delivered':
      // Mensagem entregue
      markAsDelivered(payload.message_id);
      break;
    case 'read':
      // Mensagem lida
      markAsRead(payload.message_id);
      break;
  }
};
```

---

## Próximos Passos

1. [ ] Implementar criptografia E2E real (X25519 + ChaCha20-Poly1305)
2. [ ] Adicionar suporte a arquivos/mídia
3. [ ] Implementar grupos (GossipSub topics compartilhados)
4. [ ] Adicionar indicador de digitação
5. [ ] Implementar mensagens offline (store-and-forward via relays)

---

*"Mensagens pertencem aos usuários, não à plataforma."*
