import { FastifyInstance } from 'fastify';
import { ProjectController } from '../controllers/project.controller.js';
import { AuthService, loginSchema, registerSchema } from '../services/auth.service.js';
import { DeploymentService } from '../services/deployment.service.js';
import { DockerService } from '../services/docker.service.js';
import { ProjectService } from '../services/project.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { kernel } from '../lib/kernel-client.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const projectCtrl = new ProjectController();
const authService = new AuthService();
const deployService = new DeploymentService();
const dockerService = new DockerService();
const projectService = new ProjectService();

export async function apiRoutes(fastify: FastifyInstance) {
  // ============================================
  // HEALTH CHECK (público)
  // ============================================
  fastify.get('/health', async () => {
    const dockerOk = await dockerService.checkHealth();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        api: true,
        docker: dockerOk
      }
    };
  });

  // ============================================
  // AUTH (público)
  // ============================================
  fastify.post('/auth/login', async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      return await authService.login(data);
    } catch (error) {
      res.status(401).send({ error: 'Credenciais inválidas' });
    }
  });

  fastify.post('/auth/register', async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      return await authService.register(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao registrar';
      res.status(400).send({ error: msg });
    }
  });

  // ============================================
  // ROTAS PROTEGIDAS
  // ============================================
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authMiddleware);

    // --- PROJECTS ---
    protectedRoutes.get('/projects', projectCtrl.list);
    protectedRoutes.post('/projects', projectCtrl.create);
    protectedRoutes.get('/projects/:id', projectCtrl.getOne);
    
    // Editar projeto
    protectedRoutes.put('/projects/:id', async (req, res) => {
      const { id } = req.params as { id: string };
      const userId = req.user?.id;
      const userRole = req.user?.role || '';
      
      const canEdit = await ProjectController.canDeploy(id, userId!, userRole);
      if (!canEdit) {
        return res.status(403).send({ error: 'Acesso negado' });
      }
      
      try {
        const { name, repoUrl, branch, port, buildCmd, startCmd } = req.body as any;
        const updated = await projectService.updateProject(id, {
          name, repoUrl, branch, port, buildCmd, startCmd
        });
        return updated;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao atualizar';
        res.status(400).send({ error: msg });
      }
    });
    
    protectedRoutes.delete('/projects/:id', async (req, res) => {
      const { id } = req.params as { id: string };
      const userId = req.user?.id;
      const userRole = req.user?.role || '';
      
      // Validação de ownership
      const canDelete = await ProjectController.canDeploy(id, userId!, userRole);
      if (!canDelete) {
        return res.status(403).send({ 
          error: 'Acesso negado. Você não pode deletar este projeto.',
          code: 'FORBIDDEN'
        });
      }
      
      try {
        // Buscar projeto para pegar subdomain
        const project = await projectService.getById(id);
        if (!project) {
          return res.status(404).send({ error: 'Projeto não encontrado' });
        }
        
        // Parar e remover container (se existir)
        try {
          await dockerService.stopContainer(project.subdomain);
        } catch {
          // Container pode não existir, ok
        }
        
        // Deletar do banco
        await projectService.deleteProject(id);
        
        return { message: 'Projeto deletado com sucesso', id };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao deletar projeto';
        res.status(400).send({ error: msg });
      }
    });

    // --- DEPLOYMENTS ---
    protectedRoutes.post('/projects/:id/deploy', async (req, res) => {
      const { id } = req.params as { id: string };
      const userId = req.user?.id;
      const userRole = req.user?.role || '';
      
      // Validação de ownership
      const canDeploy = await ProjectController.canDeploy(id, userId!, userRole);
      if (!canDeploy) {
        return res.status(403).send({ 
          error: 'Acesso negado. Você não pode fazer deploy neste projeto.',
          code: 'FORBIDDEN'
        });
      }
      
      try {
        const deployment = await deployService.triggerDeployment(id);
        return deployment;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao iniciar deploy';
        res.status(400).send({ error: msg });
      }
    });

    // --- QUICK DEPLOY (ONBOARDING) ---
    // Cria projeto + deploy em 1 clique usando template
    protectedRoutes.post('/quick-deploy', async (req, res) => {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).send({ error: 'Não autenticado' });
      }
      
      try {
        // Gerar nome único
        const timestamp = Date.now().toString(36);
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        const appName = `meu-app-${timestamp}-${randomSuffix}`;
        
        // Criar projeto com template Hello World
        const project = await projectService.createProject({
          name: appName,
          type: 'BACKEND',
          repoUrl: 'https://github.com/render-examples/express-hello-world',
          branch: 'main',
          port: 3000,
          subdomain: appName,
          ownerId: userId,
        });
        
        // Iniciar deploy automaticamente
        const deployment = await deployService.triggerDeployment(project.id);
        
        return res.status(201).send({
          message: 'App criado e deploy iniciado!',
          project,
          deployment,
          url: `https://${appName}.${process.env.SUPER_DOMAIN || 'sce.local'}`
        });
        
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao criar app';
        res.status(400).send({ error: msg });
      }
    });

    protectedRoutes.post('/projects/:id/restart', async (req, res) => {
      const { id } = req.params as { id: string };
      // TODO: Buscar subdomain pelo ID
      await deployService.restartProject(id);
      return { message: 'Container reiniciado' };
    });

    protectedRoutes.post('/projects/:id/stop', async (req, res) => {
      const { id } = req.params as { id: string };
      await deployService.stopProject(id);
      return { message: 'Container parado' };
    });

    // --- METRICS ---
    protectedRoutes.get('/projects/:subdomain/metrics', async (req, res) => {
      const { subdomain } = req.params as { subdomain: string };
      return await deployService.getMetrics(subdomain);
    });

    protectedRoutes.get('/projects/:subdomain/logs', async (req, res) => {
      const { subdomain } = req.params as { subdomain: string };
      const logs = await deployService.getLogs(subdomain);
      return { logs };
    });

    // --- INFRASTRUCTURE ---
    protectedRoutes.get('/infra/stats', async () => {
      let dockerStats = { containers: 0, totalCpu: 0, totalMemory: 0 };
      
      try {
        const containers = await dockerService.listContainers();
        dockerStats.containers = containers.length;
        
        // Calcular métricas agregadas
        for (const container of containers) {
          try {
            const stats = await dockerService.getStats(container.name);
            dockerStats.totalCpu += stats.cpu;
            dockerStats.totalMemory += stats.memory;
          } catch {
            // Container pode não estar rodando
          }
        }
      } catch {
        // Docker não disponível
      }
      
      return {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        engineStatus: dockerStats.containers > 0 ? 'OPERATIONAL' : 'IDLE',
        containers: dockerStats.containers,
        totalCpuUsage: dockerStats.totalCpu.toFixed(1) + '%',
        totalMemoryUsage: dockerStats.totalMemory.toFixed(0) + ' MB'
      };
    });

    protectedRoutes.get('/infra/containers', async () => {
      return await dockerService.listContainers();
    });
    
    // Status real de um container específico
    protectedRoutes.get('/projects/:subdomain/status', async (req, res) => {
      const { subdomain } = req.params as { subdomain: string };
      
      try {
        const containers = await dockerService.listContainers();
        const container = containers.find(c => c.name === subdomain);
        
        if (!container) {
          return { status: 'STOPPED', running: false };
        }
        
        const isRunning = container.status.toLowerCase().includes('up');
        const stats = isRunning ? await dockerService.getStats(subdomain) : { cpu: 0, memory: 0 };
        
        return {
          status: isRunning ? 'HEALTHY' : 'STOPPED',
          running: isRunning,
          containerId: container.id,
          cpu: stats.cpu,
          memory: stats.memory,
          created: container.created
        };
      } catch {
        return { status: 'UNKNOWN', running: false };
      }
    });
    
    // --- ENV VARS ---
    // Listar variáveis de ambiente de um projeto (valores mascarados)
    protectedRoutes.get('/projects/:id/env', async (req, res) => {
      const { id } = req.params as { id: string };
      const userId = req.user?.id;
      const userRole = req.user?.role || '';
      
      const canAccess = await ProjectController.canDeploy(id, userId!, userRole);
      if (!canAccess) {
        return res.status(403).send({ error: 'Acesso negado' });
      }
      
      const project = await projectService.getById(id);
      if (!project) {
        return res.status(404).send({ error: 'Projeto não encontrado' });
      }
      
      // Retorna keys com valores mascarados
      return project.envVars.map(ev => ({
        id: ev.id,
        key: ev.key,
        value: '••••••••'
      }));
    });
    
    // Adicionar variável de ambiente
    protectedRoutes.post('/projects/:id/env', async (req, res) => {
      const { id } = req.params as { id: string };
      const { key, value } = req.body as { key: string; value: string };
      const userId = req.user?.id;
      const userRole = req.user?.role || '';
      
      if (!key || !value) {
        return res.status(400).send({ error: 'Key e value são obrigatórios' });
      }
      
      const canAccess = await ProjectController.canDeploy(id, userId!, userRole);
      if (!canAccess) {
        return res.status(403).send({ error: 'Acesso negado' });
      }
      
      try {
        const envVar = await projectService.addEnvVar(id, key, value);
        return res.status(201).send({ id: envVar.id, key: envVar.key, value: '••••••••' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao adicionar variável';
        res.status(400).send({ error: msg });
      }
    });
    
    // Deletar variável de ambiente
    protectedRoutes.delete('/projects/:projectId/env/:envId', async (req, res) => {
      const { projectId, envId } = req.params as { projectId: string; envId: string };
      const userId = req.user?.id;
      const userRole = req.user?.role || '';
      
      const canAccess = await ProjectController.canDeploy(projectId, userId!, userRole);
      if (!canAccess) {
        return res.status(403).send({ error: 'Acesso negado' });
      }
      
      try {
        await projectService.deleteEnvVar(envId);
        return { message: 'Variável removida' };
      } catch (error) {
        res.status(400).send({ error: 'Erro ao remover variável' });
      }
    });

    // ============================================
    // TELEMETRIA (proxy para UNO.KERNEL)
    // Dados isolados por usuário
    // ============================================
    
    // Buscar eventos de telemetria do usuário
    protectedRoutes.get('/telemetry/events', async (req, res) => {
      const userId = req.user?.id;
      if (!userId) return res.status(401).send({ error: 'Não autenticado' });
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.kernelAppKey || !user?.kernelAppSecret) {
        return { events: [], message: 'Kernel não configurado para este usuário' };
      }
      
      const { limit, type } = req.query as { limit?: string; type?: string };
      const events = await kernel.getTelemetry(
        user.kernelAppKey, 
        user.kernelAppSecret,
        { limit: limit ? parseInt(limit) : 50, type }
      );
      
      return { events };
    });
    
    // Buscar alertas do usuário
    protectedRoutes.get('/telemetry/alerts', async (req, res) => {
      const userId = req.user?.id;
      if (!userId) return res.status(401).send({ error: 'Não autenticado' });
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.kernelAppKey || !user?.kernelAppSecret) {
        return { alerts: [], message: 'Kernel não configurado para este usuário' };
      }
      
      const alerts = await kernel.getAlerts(user.kernelAppKey, user.kernelAppSecret);
      return { alerts };
    });
    
    // Provisionar App no Kernel (para usuários existentes)
    protectedRoutes.post('/kernel/provision', async (req, res) => {
      const userId = req.user?.id;
      const { name, password } = req.body as { name: string; password: string };
      
      if (!userId) return res.status(401).send({ error: 'Não autenticado' });
      if (!name || !password) return res.status(400).send({ error: 'Nome e senha são obrigatórios' });
      
      try {
        const result = await authService.provisionKernelApp(userId, name, password);
        return { success: true, ...result };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao provisionar';
        res.status(400).send({ error: msg });
      }
    });
  });

  // ============================================
  // SSE - STREAMING DE LOGS (semi-público)
  // ============================================
  fastify.get('/deployments/:id/logs/stream', (req, res) => {
    const { id } = req.params as { id: string };
    
    res.raw.setHeader('Content-Type', 'text/event-stream');
    res.raw.setHeader('Cache-Control', 'no-cache');
    res.raw.setHeader('Connection', 'keep-alive');
    res.raw.setHeader('Access-Control-Allow-Origin', '*');

    // Enviar heartbeat inicial
    res.raw.write(`data: ${JSON.stringify({ type: 'connected', message: 'Stream conectado' })}\n\n`);

    const listener = (msg: string) => {
      res.raw.write(`data: ${JSON.stringify({ type: 'log', message: msg })}\n\n`);
    };

    const emitter = deployService.getLogStream(id);
    emitter.on(`logs-${id}`, listener);

    // Heartbeat para manter conexão viva
    const heartbeat = setInterval(() => {
      res.raw.write(`: heartbeat\n\n`);
    }, 30000);

    req.raw.on('close', () => {
      emitter.off(`logs-${id}`, listener);
      clearInterval(heartbeat);
    });
  });
}
