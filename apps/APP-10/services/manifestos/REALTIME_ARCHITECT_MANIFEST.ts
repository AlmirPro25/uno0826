/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         ⚡ REALTIME ARCHITECT: SISTEMAS QUE RESPIRAM - LEVEL 14 ⚡          ║
 * ║                                                                              ║
 * ║            "APPS QUE VIVEM, ATUALIZAM E FUNCIONAM EM TEMPO REAL."           ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const REALTIME_ARCHITECT_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         ⚡ REALTIME ARCHITECT: SISTEMAS QUE RESPIRAM - LEVEL 14 ⚡          ║
║                                                                              ║
║            "COLABORAÇÃO INSTANTÂNEA E SINCRONIZADA."                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🔌 TECNOLOGIAS DE TEMPO REAL
═══════════════════════════════════════════════════════════════════════════════

WEBSOCKETS
├── Conexão bidirecional persistente
├── Baixa latência
├── Ideal para: chat, games, colaboração
└── Código:
    // Servidor (Node.js)
    const wss = new WebSocketServer({ port: 8080 });
    wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        // Broadcast para todos
        wss.clients.forEach(client => client.send(data));
      });
    });
    
    // Cliente
    const ws = new WebSocket('wss://api.example.com');
    ws.onmessage = (event) => updateUI(JSON.parse(event.data));

SERVER-SENT EVENTS (SSE)
├── Conexão unidirecional (servidor → cliente)
├── Reconexão automática
├── Ideal para: feeds, notificações, dashboards
└── Código:
    // Servidor
    app.get('/events', (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const send = (data) => res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
      
      const interval = setInterval(() => send({ time: Date.now() }), 1000);
      req.on('close', () => clearInterval(interval));
    });
    
    // Cliente
    const events = new EventSource('/events');
    events.onmessage = (e) => updateUI(JSON.parse(e.data));

SOCKET.IO
├── WebSocket com fallbacks
├── Rooms e namespaces
├── Reconexão automática
└── Código:
    // Servidor
    const io = new Server(httpServer);
    io.on('connection', (socket) => {
      socket.join('room-123');
      socket.on('message', (data) => {
        io.to('room-123').emit('message', data);
      });
    });

═══════════════════════════════════════════════════════════════════════════════
🔄 SINCRONIZAÇÃO DE ESTADO
═══════════════════════════════════════════════════════════════════════════════

CRDT (Conflict-free Replicated Data Types)
├── Sincronização sem conflitos
├── Offline-first
├── Ideal para: docs colaborativos, whiteboards
├── Libs: Yjs, Automerge
└── Código (Yjs):
    import * as Y from 'yjs';
    import { WebsocketProvider } from 'y-websocket';
    
    const doc = new Y.Doc();
    const provider = new WebsocketProvider('wss://server', 'room', doc);
    const text = doc.getText('content');
    
    text.observe(event => {
      console.log('Mudança:', event.changes);
    });

OPERATIONAL TRANSFORMATION (OT)
├── Google Docs usa isso
├── Transforma operações concorrentes
└── Mais complexo que CRDT

SUPABASE REALTIME
├── PostgreSQL com realtime
├── Broadcast, Presence, Postgres Changes
└── Código:
    const channel = supabase.channel('room-1');
    
    // Broadcast
    channel.on('broadcast', { event: 'cursor' }, (payload) => {
      moveCursor(payload.x, payload.y);
    });
    
    // Presence (quem está online)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      updateOnlineUsers(state);
    });
    
    // Postgres Changes
    channel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'messages' },
      (payload) => addMessage(payload.new)
    );
    
    channel.subscribe();

═══════════════════════════════════════════════════════════════════════════════
💬 PADRÕES DE COMUNICAÇÃO
═══════════════════════════════════════════════════════════════════════════════

PUB/SUB
├── Publishers enviam mensagens para canais
├── Subscribers recebem de canais que assinam
├── Desacoplamento total
└── Implementações: Redis Pub/Sub, NATS, Kafka

REQUEST/RESPONSE
├── Cliente pede, servidor responde
├── Síncrono ou assíncrono
└── WebSocket pode fazer isso também

BROADCAST
├── Uma mensagem para todos
├── Ideal para: atualizações globais
└── Cuidado com escala

ROOM-BASED
├── Mensagens para grupo específico
├── Ideal para: chats, jogos multiplayer
└── Socket.IO rooms, Supabase channels

═══════════════════════════════════════════════════════════════════════════════
🎮 CASOS DE USO
═══════════════════════════════════════════════════════════════════════════════

CHAT EM TEMPO REAL
├── WebSocket ou Socket.IO
├── Rooms por conversa
├── Typing indicators
├── Read receipts
└── Presence (online/offline)

COLABORAÇÃO EM DOCUMENTOS
├── CRDT (Yjs, Automerge)
├── Cursores de outros usuários
├── Histórico de versões
└── Resolução de conflitos

DASHBOARD AO VIVO
├── SSE ou WebSocket
├── Métricas atualizando
├── Gráficos em tempo real
└── Alertas instantâneos

JOGOS MULTIPLAYER
├── WebSocket com baixa latência
├── State sync
├── Interpolação/Extrapolação
└── Lag compensation

NOTIFICAÇÕES PUSH
├── SSE para web
├── Firebase Cloud Messaging para mobile
├── WebSocket para desktop
└── Fallback para polling

═══════════════════════════════════════════════════════════════════════════════
📊 ESCALABILIDADE
═══════════════════════════════════════════════════════════════════════════════

HORIZONTAL SCALING
├── Redis Pub/Sub para sincronizar instâncias
├── Sticky sessions ou broadcast
└── Código:
    // Socket.IO com Redis adapter
    import { createAdapter } from '@socket.io/redis-adapter';
    import { createClient } from 'redis';
    
    const pubClient = createClient({ url: REDIS_URL });
    const subClient = pubClient.duplicate();
    
    io.adapter(createAdapter(pubClient, subClient));

CONNECTION LIMITS
├── Nginx: worker_connections 10000
├── Node.js: --max-old-space-size=4096
├── Heartbeat para detectar conexões mortas
└── Graceful reconnection

═══════════════════════════════════════════════════════════════════════════════
📋 CHECKLIST REALTIME
═══════════════════════════════════════════════════════════════════════════════

[ ] Escolher tecnologia certa (WS vs SSE vs Polling)
[ ] Implementar reconexão automática
[ ] Heartbeat/ping-pong para detectar desconexões
[ ] Autenticação na conexão
[ ] Rate limiting por conexão
[ ] Graceful shutdown
[ ] Horizontal scaling com Redis
[ ] Fallback para polling se WS falhar
[ ] Compressão de mensagens grandes
[ ] Logging de eventos importantes

═══════════════════════════════════════════════════════════════════════════════

"APPS QUE RESPIRAM, ATUALIZAM E FUNCIONAM EM TEMPO REAL."

                    — Realtime Architect, Level 14
`;

export function shouldEnableRealtimeArchitect(prompt: string): boolean {
  const keywords = [
    'tempo real', 'realtime', 'real-time', 'real time',
    'websocket', 'socket.io', 'sse', 'server-sent',
    'chat', 'colaborativo', 'collaborative', 'multiplayer',
    'live', 'ao vivo', 'streaming', 'push notification',
    'sync', 'sincronização', 'crdt', 'presence',
    'broadcast', 'pub/sub', 'pubsub'
  ];
  const promptLower = prompt.toLowerCase();
  return keywords.some(kw => promptLower.includes(kw));
}

export default REALTIME_ARCHITECT_MANIFEST;
