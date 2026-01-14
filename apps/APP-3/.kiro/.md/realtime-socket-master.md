# ⚡ REALTIME SOCKET MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- WebSocket, WS, WSS, Socket, Realtime, Tempo Real
- Socket.IO, WS library, uWebSockets
- WebRTC, Peer-to-Peer, P2P, Video Call, Audio Call
- SSE, Server-Sent Events, Event Stream
- Pusher, Ably, Supabase Realtime, Firebase Realtime
- Presence, Typing Indicator, Online Status
- Chat, Messaging, Notifications, Live Updates
- Multiplayer, Collaboration, Sync

## FILOSOFIA
> "Comunicação em tempo real deve ser confiável, escalável e resiliente."

### Princípios Invioláveis
1. **Connection Resilience** - Reconexão automática é obrigatória
2. **Message Ordering** - Garanta ordem quando necessário
3. **Heartbeat** - Detecte conexões mortas rapidamente
4. **Backpressure** - Não sobrecarregue clientes lentos
5. **Graceful Degradation** - Fallback para polling se necessário
6. **Security First** - Autentique todas as conexões
7. **Scale Horizontally** - Use pub/sub para múltiplas instâncias

## TECNOLOGIAS

| Tech | Direção | Use Case |
|------|---------|----------|
| WebSocket | Bidirectional | Chat, gaming, collaboration |
| SSE | Server → Client | Notifications, live feeds |
| WebRTC | P2P | Video calls, screen sharing |
| Long Polling | Fallback | When WebSocket unavailable |

## SOCKET.IO SERVER

```typescript
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

const io = new Server(httpServer, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Redis adapter for scaling
io.adapter(createAdapter(pubClient, subClient));

// Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifyToken(token);
  socket.data.user = user;
  next();
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.data.user.id}`);
  
  socket.on('chat:message', async (data) => {
    io.to(data.roomId).emit('chat:message', {
      userId: socket.data.user.id,
      content: data.content,
    });
  });
});
```

## SOCKET.IO CLIENT (React)

```typescript
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

export function useSocket(token: string) {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const socket = io(WS_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
    });
    
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    return () => { socket.disconnect(); };
  }, [token]);
  
  return { isConnected };
}
```

## SSE SERVER

```typescript
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Heartbeat
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);
  
  req.on('close', () => clearInterval(heartbeat));
});
```

## SCALING PATTERNS

- **Redis Pub/Sub** - Cross-server messaging
- **Sticky Sessions** - Route same client to same server
- **Sharding** - Partition by room/channel
- **Connection Pooling** - Reuse backend connections

## CHECKLIST

### Connection
- [ ] Auto-reconnect with exponential backoff?
- [ ] Heartbeat/ping-pong implemented?
- [ ] Connection timeout configured?

### Security
- [ ] Authentication on connection?
- [ ] Authorization per room/channel?
- [ ] Rate limiting per client?
- [ ] WSS (TLS) in production?

### Scaling
- [ ] Pub/sub for multi-server?
- [ ] Sticky sessions configured?
- [ ] Graceful shutdown handling?

## ANTI-PATTERNS

❌ **NUNCA** confie em conexões sem autenticação
❌ **NUNCA** ignore reconexão automática
❌ **NUNCA** use WS sem TLS em produção
❌ **NUNCA** broadcast sem rate limiting
