// Load environment variables
require('dotenv').config({ path: '../.env' });

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// ============================================================================
// PROST-QS INTEGRATION - Governance Layer
// ============================================================================
const prostqs = require('./prostqs-client');

// ============================================================================
// VOX-BRIDGE SIGNALING SERVER v2.1 - PRODUCTION READY + PROST-QS
// ============================================================================
// MELHORIAS:
// 1. Garbage collection de peers mortos
// 2. Timeout de negociação WebRTC (15s)
// 3. Validação de mensagens WebRTC
// 4. Room expiration (30 min)
// 5. Heartbeat obrigatório
// 6. Métricas de ICE failure
// ============================================================================

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Estado em memória
const users = new Map();
const queue = [];
const rooms = new Map();
const rateLimits = new Map();

// Configurações
const CONFIG = {
  HEARTBEAT_INTERVAL: 30000,      // 30s - intervalo de ping
  HEARTBEAT_TIMEOUT: 45000,       // 45s - timeout sem pong
  ROOM_TIMEOUT: 30 * 60 * 1000,   // 30 min - room expira
  NEGOTIATION_TIMEOUT: 15000,     // 15s - timeout de negociação
  QUEUE_TIMEOUT: 120000,          // 2 min - timeout na fila
};

// Rate limiting
const RATE_LIMITS = {
  chat_message: { max: 10, window: 5000 },
  join_queue: { max: 5, window: 10000 },
  typing: { max: 20, window: 5000 },
  webrtc_ice: { max: 100, window: 10000 },
  webrtc_offer: { max: 5, window: 10000 },
  webrtc_answer: { max: 5, window: 10000 },
};

// Métricas
const metrics = {
  totalConnections: 0,
  totalMatches: 0,
  iceFailures: 0,
  negotiationTimeouts: 0,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function checkRateLimit(userId, action) {
  const key = `${userId}:${action}`;
  const limit = RATE_LIMITS[action];
  if (!limit) return true;
  
  const now = Date.now();
  let record = rateLimits.get(key);
  
  if (!record || now - record.start > limit.window) {
    record = { start: now, count: 1 };
    rateLimits.set(key, record);
    return true;
  }
  
  record.count++;
  return record.count <= limit.max;
}

function generateAnonId() {
  const adjectives = ['Swift', 'Bright', 'Cool', 'Wild', 'Calm', 'Bold', 'Wise', 'Free', 'Quick', 'Sharp'];
  const nouns = ['Fox', 'Wolf', 'Bear', 'Eagle', 'Lion', 'Tiger', 'Hawk', 'Owl', 'Panda', 'Falcon'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
}

function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text.slice(0, 1000).replace(/[<>]/g, '');
}

// Validar payload WebRTC
function isValidWebRTCPayload(type, payload) {
  if (!payload) return false;
  
  if (type === 'webrtc_offer' || type === 'webrtc_answer') {
    return payload.sdp && typeof payload.sdp === 'object' && payload.sdp.type && payload.sdp.sdp;
  }
  
  if (type === 'webrtc_ice') {
    return payload.candidate && typeof payload.candidate === 'object';
  }
  
  return true;
}

// Enviar mensagem segura
function safeSend(ws, type, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify({ type, payload }));
      return true;
    } catch (e) {
      console.error('Send error:', e.message);
    }
  }
  return false;
}

// ============================================================================
// GARBAGE COLLECTION - Limpar recursos órfãos
// ============================================================================

// Limpar rate limits antigos
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimits.entries()) {
    if (now - record.start > 60000) rateLimits.delete(key);
  }
}, 30000);

// Limpar rooms expiradas
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > CONFIG.ROOM_TIMEOUT) {
      console.log(`🗑️ Room expired: ${roomId}`);
      room.users.forEach(u => {
        if (u) {
          safeSend(u.ws, 'room_expired', {});
          u.roomId = null;
        }
      });
      rooms.delete(roomId);
    }
  }
}, 60000);

// Limpar usuários na fila há muito tempo
setInterval(() => {
  const now = Date.now();
  for (let i = queue.length - 1; i >= 0; i--) {
    const user = queue[i];
    if (now - (user.queueJoinTime || now) > CONFIG.QUEUE_TIMEOUT) {
      console.log(`🗑️ Queue timeout: ${user.anonymousId}`);
      queue.splice(i, 1);
      safeSend(user.ws, 'queue_timeout', {});
    }
  }
}, 30000);

// Verificar heartbeat de todos os usuários
setInterval(() => {
  const now = Date.now();
  for (const [id, user] of users.entries()) {
    if (now - user.lastPong > CONFIG.HEARTBEAT_TIMEOUT) {
      console.log(`💀 Heartbeat timeout: ${user.anonymousId}`);
      user.ws.terminate();
    }
  }
}, CONFIG.HEARTBEAT_INTERVAL);

// ============================================================================
// HTTP ENDPOINTS
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: Date.now(), 
    users: users.size, 
    queue: queue.length,
    rooms: rooms.size,
    uptime: process.uptime(),
    metrics
  });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'VOX-BRIDGE API v2.0', online: users.size });
});

app.get('/stats', (req, res) => {
  res.json({
    online: users.size,
    inQueue: queue.length,
    activeRooms: rooms.size,
    uptime: Math.floor(process.uptime()),
    metrics
  });
});

// ========================================
// IMPLICIT LOGIN - Fase 29
// "Login invisível: usuário nem percebe"
// ========================================
app.post('/auth/implicit-login', async (req, res) => {
  const { name, email, age, gender, preference, callMode } = req.body;
  
  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Nome é obrigatório (mínimo 2 caracteres)' });
  }

  try {
    // Chamar PROST-QS para criar/recuperar usuário
    const result = await prostqs.implicitLogin({
      name,
      email: email || '',
      age: age || 0,
      gender: gender || '',
      metadata: {
        preference: preference || '',
        call_mode: callMode || 'random',
        source: 'vox-bridge'
      }
    });

    if (!result) {
      // Fallback: gerar ID local se PROST-QS não disponível
      const localId = uuidv4();
      console.log(`⚠️ PROST-QS indisponível, usando ID local: ${localId}`);
      return res.json({
        user_id: localId,
        token: null,
        is_new_user: true,
        local_only: true
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Implicit login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// TURN credentials - com suporte a credenciais temporárias HMAC
app.get('/turn-credentials', (req, res) => {
  const TURN_SECRET = process.env.TURN_SECRET;
  const TURN_URLS = process.env.TURN_URLS; // ex: "turn:turn.seudominio.com:3478,turns:turn.seudominio.com:5349"
  
  // Se tem TURN próprio configurado, gera credencial temporária
  if (TURN_SECRET && TURN_URLS) {
    const crypto = require('crypto');
    const ttl = 300; // 5 minutos
    const timestamp = Math.floor(Date.now() / 1000) + ttl;
    const username = `${timestamp}`;
    
    const hmac = crypto
      .createHmac('sha1', TURN_SECRET)
      .update(username)
      .digest('base64');
    
    const urls = TURN_URLS.split(',').map(u => u.trim());
    
    console.log(`🔐 Generated TURN credentials (expires in ${ttl}s)`);
    
    return res.json([{
      urls,
      username,
      credential: hmac
    }]);
  }
  
  // Fallback: TURN público (para desenvolvimento)
  const turnServers = [
    { 
      urls: ['turn:a.relay.metered.ca:80', 'turn:a.relay.metered.ca:443'], 
      username: 'e8dd65c92f6f1f2d5c67c7a3', 
      credential: 'kW3QfUZKpLqYhDzS' 
    },
    { 
      urls: 'turn:openrelay.metered.ca:443?transport=tcp', 
      username: 'openrelayproject', 
      credential: 'openrelayproject' 
    },
  ];
  res.json(turnServers);
});

// ============================================================================
// WEBSOCKET HANDLING
// ============================================================================

wss.on('connection', (ws, req) => {
  const id = uuidv4();
  const sessionId = uuidv4(); // Session ID separado para telemetria
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  const user = { 
    id, 
    sessionId, // Novo: session ID para telemetria
    ws, 
    ip,
    userAgent,
    anonymousId: generateAnonId(), 
    nativeLanguage: 'pt', 
    targetLanguage: 'en', 
    interests: [], 
    country: 'BR', 
    roomId: null,
    connectedAt: Date.now(),
    lastPong: Date.now(),
    negotiationStarted: null,
    matchCount: 0,
    skipCount: 0,
  };
  
  users.set(id, user);
  metrics.totalConnections++;

  // 📊 PROST-QS: Registrar início de sessão (audit legacy)
  prostqs.sessionStarted(id, ip, userAgent, user.country);
  
  // 📊 PROST-QS TELEMETRY: Sessão iniciada (Fase 30)
  prostqs.telemetrySessionStart(id, sessionId, {
    ip,
    user_agent: userAgent,
    country: user.country,
    anonymous_id: user.anonymousId
  });

  console.log(`👤 Connected: ${user.anonymousId} (${users.size} online)`);
  safeSend(ws, 'connected', { userId: id, anonymousId: user.anonymousId, online: users.size });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      
      // Rate limiting
      if (RATE_LIMITS[msg.type] && !checkRateLimit(id, msg.type)) {
        return;
      }
      
      handleMessage(user, msg);
    } catch (e) { 
      console.error('Parse error:', e.message); 
    }
  });

  ws.on('close', () => {
    console.log(`👤 Disconnected: ${user.anonymousId} (${users.size - 1} online)`);
    
    // 📊 PROST-QS: Registrar fim de sessão (audit legacy)
    const duration = Date.now() - user.connectedAt;
    prostqs.sessionEnded(user.id, duration, user.matchCount || 0, user.skipCount || 0);
    
    // 📊 PROST-QS TELEMETRY: Sessão encerrada (Fase 30)
    prostqs.telemetrySessionEnd(user.id, user.sessionId, duration);
    
    // Se estava em sala, registrar desconexão abrupta
    if (user.roomId) {
      prostqs.disconnectAbrupt(user.id, true, user.roomId);
    }
    
    handleDisconnect(user);
    users.delete(id);
  });

  ws.on('error', (err) => {
    console.error('WS error:', err.message);
  });
  
  // Ping periódico do servidor
  ws.on('pong', () => {
    user.lastPong = Date.now();
  });
});

// Ping todos os clientes periodicamente
setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  });
}, CONFIG.HEARTBEAT_INTERVAL);

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

function handleMessage(user, msg) {
  // Atualizar lastPong em qualquer mensagem
  user.lastPong = Date.now();
  
  switch (msg.type) {
    case 'ping': 
      safeSend(user.ws, 'pong', { online: users.size, queue: queue.length });
      
      // 📊 PROST-QS TELEMETRY: Heartbeat/ping (Fase 30)
      // Envia ping de presença a cada ping do cliente
      prostqs.telemetrySessionPing(user.id, user.sessionId, user.roomId ? 'video_chat' : (queue.find(q => q.id === user.id) ? 'queue' : 'lobby'));
      break;
    case 'join_queue': 
      joinQueue(user, msg.payload); 
      break;
    case 'leave_queue': 
      leaveQueue(user);
      
      // 📊 PROST-QS TELEMETRY: Saiu da fila (Fase 30)
      prostqs.telemetryQueueLeft(user.id, user.sessionId);
      break;
    case 'chat_message': 
      sendChatMessage(user, msg.payload);
      
      // 📊 PROST-QS TELEMETRY: Mensagem enviada (Fase 30)
      if (user.roomId) {
        prostqs.telemetryMessageSent(user.id, user.sessionId, user.roomId);
      }
      break;
    case 'typing': 
      sendTyping(user, msg.payload); 
      break;
    case 'leave_room': 
      leaveRoom(user); 
      break;
    case 'webrtc_offer': 
    case 'webrtc_answer': 
    case 'webrtc_ice': 
      forwardWebRTC(user, msg.type, msg.payload); 
      break;
    case 'ice_failure':
      // Métrica de falha ICE
      metrics.iceFailures++;
      console.log(`❄️ ICE failure reported by ${user.anonymousId}`);
      
      // 📊 PROST-QS: Registrar falha ICE (audit legacy)
      prostqs.iceFailure(user.id, user.roomId, 'ice_connection_failed');
      
      // 📊 PROST-QS TELEMETRY: Falha ICE (Fase 30)
      prostqs.telemetryICEFailure(user.id, user.sessionId, user.roomId, 'ice_connection_failed');
      break;
  }
}

function forwardWebRTC(user, type, payload) {
  if (!user.roomId) return;
  
  // Validar payload
  if (!isValidWebRTCPayload(type, payload)) {
    console.log(`⚠️ Invalid ${type} payload from ${user.anonymousId}`);
    return;
  }
  
  const room = rooms.get(user.roomId);
  if (!room) return;
  
  const partner = room.users.find(u => u.id !== user.id);
  if (!partner) return;
  
  // Verificar se parceiro ainda está conectado
  if (partner.ws.readyState !== WebSocket.OPEN) {
    console.log(`⚠️ Partner disconnected, cleaning room`);
    leaveRoom(user);
    return;
  }
  
  // Timeout de negociação (só para offer)
  if (type === 'webrtc_offer') {
    user.negotiationStarted = Date.now();
    
    // Timeout de 15s para receber answer
    setTimeout(() => {
      if (user.negotiationStarted && Date.now() - user.negotiationStarted > CONFIG.NEGOTIATION_TIMEOUT) {
        console.log(`⏰ Negotiation timeout for ${user.anonymousId}`);
        metrics.negotiationTimeouts++;
        safeSend(user.ws, 'negotiation_timeout', {});
        user.negotiationStarted = null;
      }
    }, CONFIG.NEGOTIATION_TIMEOUT);
  }
  
  // Limpar timeout ao receber answer
  if (type === 'webrtc_answer') {
    const initiator = room.users.find(u => u.id !== user.id);
    if (initiator) initiator.negotiationStarted = null;
  }
  
  safeSend(partner.ws, type, payload);
}

// ============================================================================
// QUEUE & ROOM MANAGEMENT
// ============================================================================

function joinQueue(user, payload) {
  if (user.roomId) return;
  
  if (payload) {
    user.nativeLanguage = sanitizeText(payload.nativeLanguage) || 'pt';
    user.targetLanguage = sanitizeText(payload.targetLanguage) || 'en';
    user.interests = Array.isArray(payload.interests) ? payload.interests.slice(0, 10).map(sanitizeText) : [];
    user.country = sanitizeText(payload.country) || 'BR';
  }
  
  // Procurar match
  const matchIdx = queue.findIndex(q => {
    if (q.id === user.id) return false;
    if (q.ws.readyState !== WebSocket.OPEN) return false; // Skip dead connections
    
    // Match perfeito: idiomas complementares
    if (user.targetLanguage === q.nativeLanguage && q.targetLanguage === user.nativeLanguage) {
      return true;
    }
    
    // Match bom: mesmo idioma alvo
    if (user.targetLanguage === q.targetLanguage) return true;
    
    // Fallback após 30s
    const waitTime = Date.now() - (q.queueJoinTime || Date.now());
    return waitTime > 30000;
  });
  
  if (matchIdx >= 0) {
    const partner = queue.splice(matchIdx, 1)[0];
    createRoom(user, partner);
  } else {
    if (!queue.find(q => q.id === user.id)) {
      user.queueJoinTime = Date.now();
      queue.push(user);
      
      // 📊 PROST-QS: Registrar entrada na fila (audit legacy)
      prostqs.queueJoined(user.id, user.nativeLanguage, user.targetLanguage, user.interests);
      
      // 📊 PROST-QS TELEMETRY: Entrou na fila (Fase 30)
      prostqs.telemetryQueueJoined(user.id, user.sessionId, {
        native_language: user.nativeLanguage,
        target_language: user.targetLanguage,
        interests: user.interests
      });
      
      safeSend(user.ws, 'queue_joined', { position: queue.length });
    }
  }
}

function leaveQueue(user) {
  const idx = queue.findIndex(q => q.id === user.id);
  if (idx >= 0) {
    queue.splice(idx, 1);
    safeSend(user.ws, 'queue_left', {});
  }
}

function createRoom(user1, user2) {
  const roomId = uuidv4();
  user1.roomId = roomId;
  user2.roomId = roomId;
  user1.roomJoinedAt = Date.now();
  user2.roomJoinedAt = Date.now();
  user1.matchCount = (user1.matchCount || 0) + 1;
  user2.matchCount = (user2.matchCount || 0) + 1;
  
  const room = {
    id: roomId,
    users: [user1, user2],
    createdAt: Date.now(),
  };
  rooms.set(roomId, room);
  metrics.totalMatches++;

  // 📊 PROST-QS: Registrar match criado (audit legacy - para ambos)
  prostqs.matchCreated(roomId, user1.id, user2.id);
  prostqs.matchCreated(roomId, user2.id, user1.id);
  
  // 📊 PROST-QS TELEMETRY: Match criado (Fase 30 - para ambos)
  prostqs.telemetryMatchCreated(user1.id, user1.sessionId, roomId, user2.id);
  prostqs.telemetryMatchCreated(user2.id, user2.sessionId, roomId, user1.id);
  
  // 📊 PROST-QS TELEMETRY: Entrou na feature video_chat
  prostqs.telemetryFeatureEnter(user1.id, user1.sessionId, 'video_chat', { room_id: roomId });
  prostqs.telemetryFeatureEnter(user2.id, user2.sessionId, 'video_chat', { room_id: roomId });

  const common = user1.interests.filter(i => user2.interests.includes(i));
  
  // user1 = initiator (impolite), user2 = responder (polite)
  const info1 = { 
    odId: user2.anonymousId, 
    nativeLanguage: user2.nativeLanguage, 
    country: user2.country, 
    commonInterests: common,
    isInitiator: true
  };
  const info2 = { 
    odId: user1.anonymousId, 
    nativeLanguage: user1.nativeLanguage, 
    country: user1.country, 
    commonInterests: common,
    isInitiator: false
  };
  
  console.log(`🎯 Match #${metrics.totalMatches}: ${user1.anonymousId} <-> ${user2.anonymousId}`);
  
  safeSend(user1.ws, 'matched', { roomId, partner: info1 });
  safeSend(user2.ws, 'matched', { roomId, partner: info2 });
}

// ============================================================================
// CHAT & ROOM FUNCTIONS
// ============================================================================

function sendChatMessage(user, payload) {
  if (!user.roomId || !payload?.text) return;
  const room = rooms.get(user.roomId);
  if (!room) return;
  
  const text = sanitizeText(payload.text);
  if (!text) return;
  
  const partner = room.users.find(u => u.id !== user.id);
  if (partner) {
    safeSend(partner.ws, 'chat_message', { 
      from: user.anonymousId, 
      text, 
      timestamp: Date.now() 
    });
  }
}

function sendTyping(user, payload) {
  if (!user.roomId) return;
  const room = rooms.get(user.roomId);
  if (!room) return;
  
  const partner = room.users.find(u => u.id !== user.id);
  if (partner) {
    safeSend(partner.ws, 'typing', { isTyping: !!payload?.isTyping });
  }
}

function leaveRoom(user) {
  if (!user.roomId) return;
  
  const roomId = user.roomId;
  const room = rooms.get(roomId);
  
  // 📊 PROST-QS: Calcular duração e registrar
  const duration = Date.now() - (user.roomJoinedAt || Date.now());
  
  // Se duração < 10s, é skip rápido (possível comportamento suspeito)
  if (duration < 10000) {
    user.skipCount = (user.skipCount || 0) + 1;
    prostqs.skipFast(user.id, roomId, duration);
    
    // 📊 PROST-QS TELEMETRY: Skip rápido (Fase 30)
    prostqs.telemetrySkip(user.id, user.sessionId, roomId, duration);
  }
  
  // 📊 PROST-QS: Match encerrado (audit legacy)
  prostqs.matchEnded(roomId, user.id, duration, 'user_left');
  
  // 📊 PROST-QS TELEMETRY: Match encerrado (Fase 30)
  prostqs.telemetryMatchEnded(user.id, user.sessionId, roomId, duration, 'user_left');
  
  // 📊 PROST-QS TELEMETRY: Saiu da feature video_chat
  prostqs.telemetryFeatureLeave(user.id, user.sessionId, 'video_chat');
  
  if (room) {
    const partner = room.users.find(u => u.id !== user.id);
    if (partner) {
      safeSend(partner.ws, 'partner_left', {});
      
      // Registrar para o parceiro também
      const partnerDuration = Date.now() - (partner.roomJoinedAt || Date.now());
      prostqs.matchEnded(roomId, partner.id, partnerDuration, 'partner_left');
      
      // 📊 PROST-QS TELEMETRY: Match encerrado para parceiro (Fase 30)
      prostqs.telemetryMatchEnded(partner.id, partner.sessionId, roomId, partnerDuration, 'partner_left');
      prostqs.telemetryFeatureLeave(partner.id, partner.sessionId, 'video_chat');
      
      partner.roomId = null;
      partner.roomJoinedAt = null;
    }
    rooms.delete(roomId);
  }
  user.roomId = null;
  user.roomJoinedAt = null;
  user.negotiationStarted = null;
}

function handleDisconnect(user) {
  leaveQueue(user);
  leaveRoom(user);
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  
  // 📊 PROST-QS: Flush eventos pendentes antes de fechar
  await prostqs.flushEvents();
  
  wss.clients.forEach(ws => ws.close());
  server.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  
  // 📊 PROST-QS: Flush eventos pendentes antes de fechar
  await prostqs.flushEvents();
  
  wss.clients.forEach(ws => ws.close());
  server.close(() => process.exit(0));
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 8080;
server.listen(PORT, async () => {
  console.log(`🚀 VOX-BRIDGE API v2.1 running on port ${PORT}`);
  console.log(`📊 Config: heartbeat=${CONFIG.HEARTBEAT_INTERVAL}ms, roomTimeout=${CONFIG.ROOM_TIMEOUT}ms`);
  
  // 📊 PROST-QS: Verificar conexão
  const health = await prostqs.healthCheck();
  if (health.ok) {
    console.log(`✅ PROST-QS connected: ${prostqs.PROSTQS_URL}`);
  } else {
    console.log(`⚠️ PROST-QS not available: ${health.error || 'unknown'}`);
  }
});
