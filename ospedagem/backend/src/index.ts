import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { apiRoutes } from './routes/index.js';
import { AuthService } from './services/auth.service.js';
import { DockerService } from './services/docker.service.js';

const fastify = Fastify({ 
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV !== 'production' ? {
      target: 'pino-pretty',
      options: { colorize: true }
    } : undefined
  }
});

const authService = new AuthService();
const dockerService = new DockerService();

const start = async () => {
  try {
    // Plugins
    await fastify.register(cors, { 
      origin: process.env.NODE_ENV === 'production' 
        ? [`https://cloud.${process.env.SUPER_DOMAIN}`]
        : true,
      credentials: true
    });
    
    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'sce-master-secret'
    });

    // API Routes
    await fastify.register(apiRoutes, { prefix: '/api/v1' });

    // Health check na raiz
    fastify.get('/health', async () => ({ status: 'ok' }));

    // Initialize System
    await authService.setupInitialAdmin();

    // Verificar Docker
    const dockerOk = await dockerService.checkHealth();
    if (!dockerOk) {
      fastify.log.warn('⚠️ Docker Engine não disponível - deploys não funcionarão');
    }

    // Garantir rede existe
    await dockerService.ensureNetwork();

    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ███████╗ ██████╗███████╗                              ║
║   ██╔════╝██╔════╝██╔════╝                              ║
║   ███████╗██║     █████╗                                ║
║   ╚════██║██║     ██╔══╝                                ║
║   ███████║╚██████╗███████╗                              ║
║   ╚══════╝ ╚═════╝╚══════╝                              ║
║                                                          ║
║   SOVEREIGN CLOUD ENGINE v1.0.0                         ║
║   ─────────────────────────────────────────────         ║
║   Status:  OPERATIONAL                                  ║
║   Port:    ${port}                                         ║
║   Docker:  ${dockerOk ? '✅ Connected' : '❌ Unavailable'}                              ║
║   Domain:  ${process.env.SUPER_DOMAIN || 'sce.local'}                                ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach(signal => {
  process.on(signal, async () => {
    console.log(`\n🛑 Recebido ${signal}, encerrando...`);
    await fastify.close();
    process.exit(0);
  });
});

start();
