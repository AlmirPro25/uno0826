/**
 * 🚀 GHOST PROTOCOL - MAIN SERVER
 * Entry point do backend com Express + WebSocket
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { getWebSocketService } from './services/websocket.service';
import { getRateLimiter } from './services/rate-limiter.service';
import { getMetrics } from './services/metrics-collector.service';
import { SchedulerService } from './services/scheduler.service';
import { LogRepository } from './repositories/log.repository';
import { getWhatsAppService } from './services/whatsapp.service';

// Import routes
import apiRouter from './routes/api';

// Environment
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Initialize Express
const app = express();
const httpServer = createServer(app);

// Initialize services
const logRepo = new LogRepository();
const wsService = getWebSocketService();
const rateLimiter = getRateLimiter();
const metrics = getMetrics();
const scheduler = new SchedulerService();

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting middleware
app.use(rateLimiter.expressMiddleware('API_REQUEST'));

// Request logging & metrics
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.observe('http_request_duration', duration);

    if (res.statusCode >= 400) {
      metrics.recordError();
    }
  });

  next();
});

// Health check (no rate limit)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '5.0.0',
    websocket: wsService.isRunning()
  });
});

// API Routes
app.use('/api', apiRouter);

// WebSocket status endpoint
app.get('/api/websocket/status', (req, res) => {
  res.json({
    success: true,
    status: wsService.getStatus(),
    clients: wsService.getConnectedClients()
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🔴 Error:', err);
  logRepo.create('ERROR', 'API_ERROR', err.message, undefined);
  metrics.recordError();

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║   👻 GHOST PROTOCOL v5.0 ENTERPRISE                      ║');
  console.log('║                                                          ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║   🌐 HTTP Server:    http://localhost:${PORT}              ║`);
  console.log(`║   🔌 WebSocket:      ws://localhost:${PORT}                ║`);
  console.log('║   📊 Metrics:        /api/metrics/prometheus             ║');
  console.log('║   ❤️  Health:        /health                              ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║   MODULES:                                               ║');
  console.log('║   ├── 🧠 Cognitive   /api/cognitive                      ║');
  console.log('║   ├── 🎯 Operations  /api/operations                     ║');
  console.log('║   ├── 📊 Analytics   /api/analytics                      ║');
  console.log('║   ├── 🎙️  Media       /api/media                          ║');
  console.log('║   ├── ⚡ Advanced    /api/advanced                       ║');
  console.log('║   ├── 💎 Leads       /api/leads                          ║');
  console.log('║   ├── 💾 Backup      /api/backup                         ║');
  console.log('║   └── 📈 Metrics     /api/metrics                        ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // Initialize WebSocket
  wsService.initialize(httpServer);

  // Initialize WhatsApp Service
  try {
    const io = wsService.getIO();
    if (io) {
      const whatsapp = getWhatsAppService(io);
      whatsapp.start();
      console.log('📱 WhatsApp Service Initialized');
    } else {
      console.error('❌ Failed to initialize WhatsApp Service: Socket.IO not available');
    }
  } catch (error) {
    console.error('❌ FATAL: WhatsApp Service failed to start:', error);
  }

  // Start scheduler
  scheduler.start();

  // Log startup
  logRepo.create('INFO', 'SERVER_STARTED', `Ghost Protocol started on port ${PORT}`, undefined);

  // Broadcast startup event
  setTimeout(() => {
    wsService.broadcast('system:started', {
      version: '5.0.0',
      timestamp: new Date(),
      port: PORT
    });
  }, 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');

  httpServer.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');

  httpServer.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

export { app, httpServer, wsService };
