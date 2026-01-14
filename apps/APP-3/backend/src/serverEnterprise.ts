/**
 * ============================================
 * ENTERPRISE SERVER - Nível Itaú
 * ============================================
 * 
 * Servidor com todas as proteções enterprise
 * 
 * AVISO REGULATÓRIO:
 * Este é um sistema de demonstração para fins educacionais.
 * Não é uma instituição financeira licenciada pelo BACEN.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';

import { environment } from './config/environment';
import { connectToDatabase } from './config/database';
import { logger } from './core/infrastructure/logging/Logger';

// Middlewares Enterprise
import {
  requestIdMiddleware,
  requestLoggerMiddleware,
  securityHeadersMiddleware,
  sanitizeInputMiddleware,
  enterpriseErrorHandler,
  notFoundHandler
} from './api/middleware/enterpriseMiddleware';

// Rotas Enterprise
import enterpriseRoutes from './api/routes/enterpriseRoutes';

// Rotas legadas (para compatibilidade)
import apiRouter from './api/routes';

const app = express();
const PORT = environment.PORT;

// ============================================
// MIDDLEWARE STACK (ordem importa!)
// ============================================

// 1. Request ID - primeiro de tudo
app.use(requestIdMiddleware);

// 2. Security Headers
app.use(securityHeadersMiddleware);

// 3. CORS configurado
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400 // 24 horas
}));


// 4. Body parsing com limites
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// 5. Sanitização de input
app.use(sanitizeInputMiddleware);

// 6. Request logger
app.use(requestLoggerMiddleware);

// 7. Trust proxy (para rate limiting correto atrás de load balancer)
app.set('trust proxy', 1);

// ============================================
// STATIC FILES
// ============================================
app.use('/api/images/generated', express.static(
  path.join(process.cwd(), 'public', 'generated-images')
));

// ============================================
// ROUTES
// ============================================

// Rotas Enterprise (novas)
app.use('/api/v2', enterpriseRoutes);

// Rotas legadas (compatibilidade)
app.use('/api', apiRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Nexus Bank API',
      version: '2.0.0',
      status: 'operational',
      timestamp: new Date().toISOString(),
      disclaimer: 'Sistema de demonstração para fins educacionais. Não é uma instituição financeira licenciada pelo BACEN.'
    },
    requestId: req.requestId
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler (deve ser o último)
app.use(enterpriseErrorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const startServer = async (): Promise<void> => {
  try {
    // Conecta ao banco
    await connectToDatabase();
    
    // Inicia servidor
    app.listen(PORT, () => {
      logger.info('Server started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      });
      
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🏦 NEXUS BANK API - Enterprise Grade                       ║
║                                                              ║
║   Status: OPERATIONAL                                        ║
║   Port: ${PORT}                                                 ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(12)}                          ║
║                                                              ║
║   Endpoints:                                                 ║
║   • Legacy API: http://localhost:${PORT}/api                    ║
║   • Enterprise API: http://localhost:${PORT}/api/v2             ║
║                                                              ║
║   ⚠️  AVISO: Sistema de demonstração educacional.            ║
║       Não é instituição financeira licenciada pelo BACEN.    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.fatal('Failed to start server', error as Error);
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal('Unhandled rejection', reason as Error);
  process.exit(1);
});

startServer();
