/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      ⚡ REALTIME SOCKET MASTER MANIFEST - O MESTRE DA COMUNICAÇÃO ⚡        ║
 * ║                                                                              ║
 * ║         "Tempo real não é luxo, é expectativa do usuário moderno."          ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const REALTIME_SOCKET_MASTER_MANIFEST = {
  id: 'realtime-socket-master',
  name: 'Realtime Socket Master',
  version: '1.0.0',
  description: 'Especialista em WebSockets, WebRTC, SSE e Comunicação em Tempo Real',
  
  keywords: [
    'websocket', 'ws', 'wss', 'socket', 'realtime', 'tempo real',
    'socket.io', 'ws library', 'uwebsockets',
    'webrtc', 'peer-to-peer', 'p2p', 'video call', 'audio call',
    'sse', 'server-sent events', 'event stream',
    'pusher', 'ably', 'supabase realtime', 'firebase realtime',
    'presence', 'typing indicator', 'online status',
    'chat', 'messaging', 'notifications', 'live updates',
    'multiplayer', 'collaboration', 'sync'
  ],

  philosophy: {
    core: 'Comunicação em tempo real deve ser confiável, escalável e resiliente.',
    principles: [
      'Connection Resilience - Reconexão automática é obrigatória',
      'Message Ordering - Garanta ordem quando necessário',
      'Heartbeat - Detecte conexões mortas rapidamente',
      'Backpressure - Não sobrecarregue clientes lentos',
      'Graceful Degradation - Fallback para polling se necessário',
      'Security First - Autentique e autorize todas as conexões',
      'Scale Horizontally - Use pub/sub para múltiplas instâncias'
    ]
  },

  architecture: `
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    REALTIME ARCHITECTURE                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CLIENTS                                         │   │
│  │  [Browser] [Mobile App] [Desktop] [IoT Device]                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│         │              │              │              │                          │
│         └──────────────┴──────────────┴──────────────┘                          │
│                              │                                                  │
│                              ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    LOAD BALANCER (Sticky Sessions)                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                  │
│         ┌────────────────────┼────────────────────┐                            │
│         ▼                    ▼                    ▼                            │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                    │
│  │  Server 1   │      │  Server 2   │      │  Server N   │                    │
│  │  (Socket)   │      │  (Socket)   │      │  (Socket)   │                    │
│  └─────────────┘      └─────────────┘      └─────────────┘                    │
│         │                    │                    │                            │
│         └────────────────────┼────────────────────┘                            │
│                              ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    PUB/SUB (Redis/NATS)                                 │   │
│  │              Cross-server message broadcasting                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
`,


  technologies: {
    websocket: {
      description: 'Full-duplex communication over TCP',
      pros: ['Bidirectional', 'Low latency', 'Efficient'],
      cons: ['Stateful', 'Harder to scale', 'Firewall issues'],
      useCase: 'Chat, gaming, collaboration'
    },
    sse: {
      description: 'Server-Sent Events - Server to client only',
      pros: ['Simple', 'Auto-reconnect', 'HTTP compatible'],
      cons: ['Unidirectional', 'Limited connections'],
      useCase: 'Notifications, live feeds, dashboards'
    },
    webrtc: {
      description: 'Peer-to-peer real-time communication',
      pros: ['P2P', 'Low latency', 'Audio/Video'],
      cons: ['Complex', 'NAT traversal', 'TURN servers'],
      useCase: 'Video calls, screen sharing, file transfer'
    },
    longPolling: {
      description: 'HTTP request held open until data available',
      pros: ['Works everywhere', 'Simple'],
      cons: ['High latency', 'Resource intensive'],
      useCase: 'Fallback when WebSocket unavailable'
    }
  },

  libraries: {
    server: {
      'socket.io': { lang: 'Node.js', features: 'Rooms, namespaces, fallback' },
      'ws': { lang: 'Node.js', features: 'Lightweight, fast, low-level' },
      'uWebSockets.js': { lang: 'Node.js', features: 'Extremely fast, C++ bindings' },
      'gorilla/websocket': { lang: 'Go', features: 'Standard Go WebSocket' },
      'fasthttp/websocket': { lang: 'Go', features: 'High performance' }
    },
    client: {
      'socket.io-client': { platform: 'Browser/Node', features: 'Auto-reconnect, rooms' },
      'native WebSocket': { platform: 'Browser', features: 'Built-in, no deps' },
      'reconnecting-websocket': { platform: 'Browser', features: 'Auto-reconnect wrapper' }
    },
    managed: {
      'Pusher': { type: 'SaaS', features: 'Channels, presence, webhooks' },
      'Ably': { type: 'SaaS', features: 'Global, reliable, pub/sub' },
      'Supabase Realtime': { type: 'SaaS', features: 'Postgres changes, presence' },
      'Firebase Realtime': { type: 'SaaS', features: 'Sync, offline support' }
    }
  },

  codeTemplates: {
    socketIOServer: `// Socket.IO Server (Node.js)
import { Server } from 'socket.io';
import { createServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Redis adapter for horizontal scaling
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const user = verifyToken(token);
    socket.data.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

// Connection handling
io.on('connection', (socket) => {
  console.log(\`User connected: \${socket.data.user.id}\`);
  
  // Join user's personal room
  socket.join(\`user:\${socket.data.user.id}\`);
  
  // Handle chat messages
  socket.on('chat:message', async (data) => {
    const message = {
      id: generateId(),
      userId: socket.data.user.id,
      content: data.content,
      roomId: data.roomId,
      timestamp: new Date(),
    };
    
    // Save to database
    await saveMessage(message);
    
    // Broadcast to room
    io.to(data.roomId).emit('chat:message', message);
  });
  
  // Handle typing indicator
  socket.on('chat:typing', (data) => {
    socket.to(data.roomId).emit('chat:typing', {
      userId: socket.data.user.id,
      isTyping: data.isTyping,
    });
  });
  
  // Handle room join
  socket.on('room:join', (roomId) => {
    socket.join(roomId);
    io.to(roomId).emit('room:user_joined', {
      userId: socket.data.user.id,
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(\`User disconnected: \${socket.data.user.id}\`);
  });
});

httpServer.listen(3001);`,

    socketIOClient: `// Socket.IO Client (React)
import { io, Socket } from 'socket.io-client';
import { useEffect, useState, useCallback } from 'react';

// Singleton socket instance
let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

// React Hook
export function useSocket(token: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    const socket = getSocket(token);
    
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('chat:message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('chat:message');
    };
  }, [token]);
  
  const sendMessage = useCallback((content: string, roomId: string) => {
    const socket = getSocket(token);
    socket.emit('chat:message', { content, roomId });
  }, [token]);
  
  const joinRoom = useCallback((roomId: string) => {
    const socket = getSocket(token);
    socket.emit('room:join', roomId);
  }, [token]);
  
  return { isConnected, messages, sendMessage, joinRoom };
}`,

    sseServer: `// Server-Sent Events (Node.js/Express)
import express from 'express';

const app = express();
const clients = new Map<string, express.Response>();

// SSE endpoint
app.get('/events', (req, res) => {
  const userId = req.query.userId as string;
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx
  
  // Send initial connection event
  res.write(\`event: connected\\ndata: {"userId": "\${userId}"}\\n\\n\`);
  
  // Store client
  clients.set(userId, res);
  
  // Heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(\`: heartbeat\\n\\n\`);
  }, 30000);
  
  // Cleanup on close
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(userId);
  });
});

// Send event to specific user
function sendToUser(userId: string, event: string, data: object) {
  const client = clients.get(userId);
  if (client) {
    client.write(\`event: \${event}\\ndata: \${JSON.stringify(data)}\\n\\n\`);
  }
}

// Broadcast to all
function broadcast(event: string, data: object) {
  const message = \`event: \${event}\\ndata: \${JSON.stringify(data)}\\n\\n\`;
  clients.forEach((client) => client.write(message));
}`,

    sseClient: `// SSE Client (Browser)
class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect(userId: string) {
    this.eventSource = new EventSource(\`/events?userId=\${userId}\`);
    
    this.eventSource.onopen = () => {
      console.log('SSE connected');
      this.reconnectAttempts = 0;
    };
    
    this.eventSource.onerror = () => {
      console.log('SSE error, reconnecting...');
      this.eventSource?.close();
      this.reconnect(userId);
    };
    
    // Listen for specific events
    this.eventSource.addEventListener('notification', (e) => {
      const data = JSON.parse(e.data);
      this.handleNotification(data);
    });
    
    this.eventSource.addEventListener('update', (e) => {
      const data = JSON.parse(e.data);
      this.handleUpdate(data);
    });
  }
  
  private reconnect(userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.connect(userId), delay);
    }
  }
  
  disconnect() {
    this.eventSource?.close();
    this.eventSource = null;
  }
}`
  },


  scalingPatterns: {
    redisPubSub: 'Use Redis pub/sub for cross-server messaging',
    stickySession: 'Route same client to same server (load balancer)',
    sharding: 'Partition connections by room/channel',
    connectionPooling: 'Reuse connections to backend services'
  },

  checklist: {
    connection: [
      'Auto-reconnect with exponential backoff?',
      'Heartbeat/ping-pong implemented?',
      'Connection timeout configured?',
      'Max connections per client limited?'
    ],
    security: [
      'Authentication on connection?',
      'Authorization per room/channel?',
      'Rate limiting per client?',
      'Input validation on messages?',
      'WSS (TLS) in production?'
    ],
    scaling: [
      'Pub/sub for multi-server?',
      'Sticky sessions configured?',
      'Connection state externalized?',
      'Graceful shutdown handling?'
    ]
  }
};

export default REALTIME_SOCKET_MASTER_MANIFEST;
