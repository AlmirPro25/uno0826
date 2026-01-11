import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { DockerService } from './docker.service.js';
import { CryptoUtil } from '../utils/crypto.util.js';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { kernel } from '../lib/kernel-client.js';

const prisma = new PrismaClient();
const logEmitter = new EventEmitter();
const dockerService = new DockerService();

// Status como strings (SQLite não suporta enums nativos)
type DeploymentStatus = 'QUEUED' | 'BUILDING' | 'DEPLOYING' | 'HEALTHY' | 'FAILED' | 'STOPPED';

export class DeploymentService {
  private buildDir: string;

  constructor() {
    this.buildDir = process.env.BUILD_DIR || path.join(os.tmpdir(), 'sce-builds');
  }

  async triggerDeployment(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { envVars: true }
    });

    if (!project) throw new Error('Projeto não encontrado');

    // Buscar owner do projeto para pegar credenciais do Kernel
    const owner = await prisma.user.findFirst({
      where: { id: project.ownerId }
    });

    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        status: 'QUEUED',
        imageTag: `sce-${project.subdomain}:${Date.now()}`,
        logs: '',
      },
    });

    // 🔗 KERNEL: Deploy iniciado (telemetria isolada por usuário)
    if (owner?.kernelAppKey && owner?.kernelAppSecret) {
      const userKernel = kernel.createUserClient(owner.kernelAppKey, owner.kernelAppSecret);
      userKernel.deployStarted(deployment.id, projectId, project.name);
    }

    // Executa pipeline em background
    this.runPipeline(deployment.id, project, owner);

    return deployment;
  }

  private async runPipeline(deploymentId: string, project: any, owner: any) {
    const startTime = Date.now();
    const emit = (msg: string) => {
      logEmitter.emit(`logs-${deploymentId}`, msg);
      this.appendLog(deploymentId, msg);
    };

    // Criar kernel client para o usuário (se configurado)
    const userKernel = owner?.kernelAppKey && owner?.kernelAppSecret
      ? kernel.createUserClient(owner.kernelAppKey, owner.kernelAppSecret)
      : null;

    try {
      // 1. Verificar Docker
      emit('🔍 Verificando conexão com Docker Engine...');
      const dockerOk = await dockerService.checkHealth();
      if (!dockerOk) {
        throw new Error('Docker Engine não disponível');
      }
      emit('✅ Docker Engine conectado');

      await this.updateStatus(deploymentId, 'BUILDING');
      
      // 🔗 KERNEL: Building (telemetria isolada)
      if (userKernel) {
        userKernel.emit('deploy.building', {
          target_id: project.id,
          target_type: 'project',
          metadata: { deploy_id: deploymentId }
        });
      }

      // 2. Garantir rede existe
      await dockerService.ensureNetwork();
      emit('🌐 Rede SCE verificada');

      // 3. Clonar repositório
      const buildPath = path.join(this.buildDir, randomUUID());
      await fs.mkdir(buildPath, { recursive: true });
      
      emit(`📦 Clonando ${project.repoUrl} (branch: ${project.branch})...`);
      await dockerService.cloneRepo(project.repoUrl, project.branch, buildPath);
      emit('✅ Repositório clonado');

      // 4. Build da imagem
      emit('🔨 Iniciando Docker Build...');
      const imageTag = await dockerService.buildImage(
        buildPath,
        `sce-${project.subdomain}`,
        emit
      );

      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { imageTag }
      });

      await this.updateStatus(deploymentId, 'DEPLOYING');

      // 5. Parar container antigo (se existir)
      emit('🔄 Removendo versão anterior...');
      await dockerService.stopContainer(project.subdomain);

      // 6. Descriptografar env vars
      const envVars: Record<string, string> = {};
      for (const ev of project.envVars || []) {
        envVars[ev.key] = CryptoUtil.decrypt(ev.value);
      }

      // 7. Iniciar novo container
      emit('🚀 Iniciando container...');
      const containerId = await dockerService.runContainer({
        name: project.subdomain,
        image: imageTag,
        port: project.port,
        envVars,
        cpuLimit: '1',
        memoryLimit: '1g'
      });

      emit(`✅ Container iniciado: ${containerId.substring(0, 12)}`);
      
      // 🔗 KERNEL: Container started (telemetria isolada)
      if (userKernel) {
        userKernel.containerStarted(containerId, project.id);
      }

      // 8. Limpar build
      await fs.rm(buildPath, { recursive: true, force: true });

      // 9. Finalizar
      await this.updateStatus(deploymentId, 'HEALTHY');
      const duration = Date.now() - startTime;
      emit(`🎉 Deploy concluído! Acesse: https://${project.subdomain}.${process.env.SUPER_DOMAIN || 'sce.local'}`);
      
      // 🔗 KERNEL: Deploy succeeded (telemetria isolada)
      if (userKernel) {
        userKernel.deploySucceeded(deploymentId, project.id, duration);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      emit(`❌ FALHA: ${errorMsg}`);
      await this.updateStatus(deploymentId, 'FAILED');
      
      // 🔗 KERNEL: Deploy failed (telemetria isolada)
      if (userKernel) {
        userKernel.deployFailed(deploymentId, project.id, errorMsg);
      }
    }
  }

  private async updateStatus(deploymentId: string, status: DeploymentStatus) {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status }
    });
  }

  private async appendLog(deploymentId: string, msg: string) {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId }
    });
    
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { logs: (deployment?.logs || '') + msg + '\n' }
    });
  }

  getLogStream(deploymentId: string) {
    return logEmitter;
  }

  async getMetrics(projectSubdomain: string) {
    try {
      return await dockerService.getStats(projectSubdomain);
    } catch {
      return { cpu: 0, memory: 0 };
    }
  }

  async getLogs(projectSubdomain: string, lines = 100) {
    return await dockerService.getLogs(projectSubdomain, lines);
  }

  async restartProject(projectSubdomain: string) {
    await dockerService.restartContainer(projectSubdomain);
  }

  async stopProject(projectSubdomain: string) {
    await dockerService.stopContainer(projectSubdomain);
  }
}
