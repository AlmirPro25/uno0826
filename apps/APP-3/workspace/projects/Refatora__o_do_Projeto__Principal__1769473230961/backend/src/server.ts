
import http from 'http';
import { WebSocketServer } from 'ws';
import app from './app';
import { env } from './config/env';
import { SimulationEngine } from './services/simulation.service';

const server = http.createServer(app);

// Inicialização do Subsistema de WebSocket
const wss = new WebSocketServer({ server, path: '/telemetry' });

wss.on('connection', (ws) => {
  console.log('[SENTINEL] :: SECURE UPLINK ESTABLISHED ::');
  ws.send(JSON.stringify({ type: 'HANDSHAKE', message: 'CONNECTED_TO_NEXUS' }));
});

// Inicialização do Motor de Simulação
const simulation = new SimulationEngine(wss);

server.listen(env.PORT, async () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   SENTINEL NEXUS - CORE SYSTEMS ONLINE       ║
  ║   PORT: ${env.PORT}                                 ║
  ║   MODE: ${env.NODE_ENV}                            ║
  ╚══════════════════════════════════════════════╝
  `);
  
  // Garantir dados iniciais e iniciar simulação
  await simulation.ensureDataIntegrity();
  simulation.ignite();
});
