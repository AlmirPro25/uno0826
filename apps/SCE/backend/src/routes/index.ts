import { FastifyInstance } from 'fastify';
import { ProjectController } from '../controllers/project.controller.js';
import { AuthService } from '../services/auth.service.js'; // Apenas para provisionKernelApp (migração)
import { DeploymentService } from '../services/deployment.service.js';
import { DockerService } from '../services/docker.service.js';
import { ProjectService } from '../services/project.service.js';
import { RepoAnalyzerService } from '../services/repo-analyzer.service.js';
import { AIBuilderService } from '../services/ai-builder.service.js';
import { kernelAuthMiddleware } from '../middleware/kernel-auth.middleware.js'; // KERNEL ONLY
import { kernel } from '../lib/kernel-client.js';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';

const prisma = new PrismaClient();
const projectCtrl = new ProjectController();
const authService = new AuthService();
const deployService = new DeploymentService();
const dockerService = new DockerService();
const projectService = new ProjectService();
const repoAnalyzer = new RepoAnalyzerService();
const aiBuilder = new AIBuilderService();

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
  // AUTH — SCE NÃO AUTENTICA NINGUÉM
  // Redireciona para o Kernel Identity
  // ============================================
  fastify.post('/auth/login', async (req, res) => {
    // SCE não faz login. Redireciona para Kernel.
    return res.status(410).send({
      error: 'Auth local desativado. Use o Kernel Identity.',
      code: 'AUTH_DEPRECATED',
      redirect: `${process.env.PROSTQS_URL || 'http://localhost:8080'}/api/v1/identity/login`,
      message: 'Faça login via PROST-QS Kernel e use o token retornado.'
    });
  });

  fastify.post('/auth/register', async (req, res) => {
    // SCE não registra usuários. Redireciona para Kernel.
    return res.status(410).send({
      error: 'Registro local desativado. Use o Kernel Identity.',
      code: 'AUTH_DEPRECATED',
      redirect: `${process.env.PROSTQS_URL || 'http://localhost:8080'}/api/v1/identity/register`,
      message: 'Registre-se via PROST-QS Kernel.'
    });
  });

  // ============================================
  // ROTAS PROTEGIDAS — APENAS JWT DO KERNEL
  // ============================================
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', kernelAuthMiddleware);

    // --- PROJECTS ---
    protectedRoutes.get('/projects', projectCtrl.list);
    protectedRoutes.post('/projects', projectCtrl.create);
    protectedRoutes.get('/projects/:id', projectCtrl.getOne);
    
    // Editar projeto
    protectedRoutes.put('/projects/:id', async (req, res) => {
      const { id } = req.params as { id: string };
      const userId = req.kernelUser?.id;
      const userRole = req.kernelUser?.role || '';
      
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
      const userId = req.kernelUser?.id;
      const userRole = req.kernelUser?.role || '';
      
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
      const userId = req.kernelUser?.id;
      const userRole = req.kernelUser?.role || '';
      
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
      const userId = req.kernelUser?.id;
      
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
      const userId = req.kernelUser?.id;
      const userRole = req.kernelUser?.role || '';
      
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
      const userId = req.kernelUser?.id;
      const userRole = req.kernelUser?.role || '';
      
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
      const userId = req.kernelUser?.id;
      const userRole = req.kernelUser?.role || '';
      
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
      const userId = req.kernelUser?.id;
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
      const userId = req.kernelUser?.id;
      if (!userId) return res.status(401).send({ error: 'Não autenticado' });
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.kernelAppKey || !user?.kernelAppSecret) {
        return { alerts: [], message: 'Kernel não configurado para este usuário' };
      }
      
      const alerts = await kernel.getAlerts(user.kernelAppKey, user.kernelAppSecret);
      return { alerts };
    });
    
    // Provisionar App no Kernel (para usuários existentes — MIGRAÇÃO)
    // TODO: Remover após migração completa
    protectedRoutes.post('/kernel/provision', async (req, res) => {
      const userId = req.kernelUser?.id;
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

    // ============================================
    // REPO ANALYZER — Análise de Repositórios Git
    // ============================================
    
    // Analisar repositório Git
    protectedRoutes.post('/repo/analyze', async (req, res) => {
      try {
        const { repoUrl, branch = 'main' } = req.body as { repoUrl: string; branch?: string };
        
        if (!repoUrl) {
          return res.status(400).send({ error: 'repoUrl é obrigatório' });
        }
        
        console.log(`[Repo] Analisando: ${repoUrl} (branch: ${branch})`);
        const analysis = await repoAnalyzer.analyzeRepo(repoUrl, branch);
        
        return { success: true, data: analysis };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao analisar repositório';
        console.error('[Repo] Erro:', msg);
        res.status(500).send({ error: msg });
      }
    });
    
    // Gerar Dockerfile baseado na análise
    protectedRoutes.post('/repo/generate-dockerfile', async (req, res) => {
      try {
        const { project } = req.body as { project: any };
        
        if (!project || !project.framework) {
          return res.status(400).send({ error: 'Dados do projeto são obrigatórios' });
        }
        
        const dockerfile = repoAnalyzer.generateDockerfile(project);
        return { success: true, dockerfile };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao gerar Dockerfile';
        res.status(500).send({ error: msg });
      }
    });

    // ============================================
    // AI BUILDER — IA no Container
    // ============================================
    
    // Status da IA
    protectedRoutes.get('/ai/status', async () => {
      return {
        available: aiBuilder.isAvailable(),
        model: 'gemini-1.5-flash',
        features: ['analyze', 'generate', 'complete', 'suggest'],
      };
    });
    
    // Analisar código de um projeto
    protectedRoutes.post('/ai/analyze', async (req, res) => {
      try {
        const { projectId } = req.body as { projectId: string };
        
        if (!projectId) {
          return res.status(400).send({ error: 'projectId é obrigatório' });
        }
        
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
          return res.status(404).send({ error: 'Projeto não encontrado' });
        }
        
        // Verificar se container está rodando
        const isRunning = await dockerService.isContainerRunning(project.subdomain);
        if (!isRunning) {
          return res.status(400).send({ error: 'Container não está rodando' });
        }
        
        // Copiar arquivos do container para análise
        const tempDir = path.join(os.tmpdir(), `sce-ai-${projectId}`);
        await dockerService.copyFromContainer(project.subdomain, '/app', tempDir);
        
        // Analisar com IA
        const framework = project.type === 'FRONTEND' ? 'next' : 'express';
        const analysis = await aiBuilder.analyzeProject(tempDir, framework);
        
        // Limpar temp
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        
        return { success: true, data: analysis };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao analisar projeto';
        console.error('[AI] Erro:', msg);
        res.status(500).send({ error: msg });
      }
    });
    
    // Gerar código novo
    protectedRoutes.post('/ai/generate', async (req, res) => {
      try {
        const { projectId, request } = req.body as { projectId: string; request: string };
        
        if (!projectId || !request) {
          return res.status(400).send({ error: 'projectId e request são obrigatórios' });
        }
        
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
          return res.status(404).send({ error: 'Projeto não encontrado' });
        }
        
        // Copiar arquivos do container
        const tempDir = path.join(os.tmpdir(), `sce-ai-${projectId}`);
        const isRunning = await dockerService.isContainerRunning(project.subdomain);
        
        if (isRunning) {
          await dockerService.copyFromContainer(project.subdomain, '/app', tempDir);
        }
        
        // Gerar código
        const framework = project.type === 'FRONTEND' ? 'next' : 'express';
        const result = await aiBuilder.generateCode(tempDir, framework, request);
        
        // Limpar temp
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        
        return { success: true, data: result };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao gerar código';
        console.error('[AI] Erro:', msg);
        res.status(500).send({ error: msg });
      }
    });
    
    // Aplicar código gerado no container
    protectedRoutes.post('/ai/apply', async (req, res) => {
      try {
        const { projectId, files } = req.body as { projectId: string; files: any[] };
        
        if (!projectId || !files || !Array.isArray(files)) {
          return res.status(400).send({ error: 'projectId e files são obrigatórios' });
        }
        
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
          return res.status(404).send({ error: 'Projeto não encontrado' });
        }
        
        const isRunning = await dockerService.isContainerRunning(project.subdomain);
        if (!isRunning) {
          return res.status(400).send({ error: 'Container não está rodando' });
        }
        
        // Aplicar cada arquivo no container
        for (const file of files) {
          if (file.action === 'delete') {
            await dockerService.execInContainer(project.subdomain, `rm -f /app/${file.path}`);
          } else {
            const dir = path.dirname(file.path);
            if (dir !== '.') {
              await dockerService.execInContainer(project.subdomain, `mkdir -p /app/${dir}`);
            }
            
            // Escrever arquivo via base64 para evitar problemas de escape
            const base64Content = Buffer.from(file.content).toString('base64');
            await dockerService.execInContainer(
              project.subdomain, 
              `echo '${base64Content}' | base64 -d > /app/${file.path}`
            );
          }
        }
        
        return { success: true, message: `${files.length} arquivo(s) aplicado(s)`, needsRebuild: true };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao aplicar código';
        console.error('[AI] Erro:', msg);
        res.status(500).send({ error: msg });
      }
    });
    
    // Sugerir melhorias para um arquivo
    protectedRoutes.post('/ai/suggest', async (req, res) => {
      try {
        const { projectId, filePath } = req.body as { projectId: string; filePath: string };
        
        if (!projectId || !filePath) {
          return res.status(400).send({ error: 'projectId e filePath são obrigatórios' });
        }
        
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
          return res.status(404).send({ error: 'Projeto não encontrado' });
        }
        
        // Ler arquivo do container
        const content = await dockerService.execInContainer(project.subdomain, `cat /app/${filePath}`);
        
        // Obter sugestões
        const framework = project.type === 'FRONTEND' ? 'next' : 'express';
        const suggestions = await aiBuilder.suggestImprovements(filePath, content, framework);
        
        return { success: true, data: { file: filePath, suggestions } };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao obter sugestões';
        console.error('[AI] Erro:', msg);
        res.status(500).send({ error: msg });
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
