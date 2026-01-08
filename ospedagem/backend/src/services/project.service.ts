
import { PrismaClient } from '@prisma/client';
import { CryptoUtil } from '../utils/crypto.util.js';
import { z } from 'zod';

const prisma = new PrismaClient();

// Tipos como strings (SQLite não suporta enums nativos)
const AppType = {
  FRONTEND: 'FRONTEND',
  BACKEND: 'BACKEND'
} as const;

export const createProjectSchema = z.object({
  name: z.string().min(3),
  type: z.enum(['FRONTEND', 'BACKEND']),
  repoUrl: z.string().url(),
  branch: z.string().default('main'),
  port: z.number().default(3000),
  subdomain: z.string().regex(/^[a-z0-9-]+$/),
  envVars: z.record(z.string()).optional(),
  ownerId: z.string().optional(), // Será preenchido pelo controller
});

export class ProjectService {
  async createProject(data: z.infer<typeof createProjectSchema> & { ownerId: string }) {
    return await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: data.name,
          type: data.type,
          repoUrl: data.repoUrl,
          branch: data.branch,
          port: data.port,
          subdomain: data.subdomain,
          ownerId: data.ownerId,
        },
      });

      if (data.envVars) {
        const envData = Object.entries(data.envVars).map(([key, value]) => ({
          key,
          value: CryptoUtil.encrypt(value),
          projectId: project.id,
        }));
        await tx.envVar.createMany({ data: envData });
      }

      return project;
    });
  }

  async listAll() {
    return await prisma.project.findMany({
      include: { deployments: { take: 1, orderBy: { createdAt: 'desc' } } }
    });
  }
  
  async listByOwner(ownerId: string) {
    return await prisma.project.findMany({
      where: { ownerId },
      include: { deployments: { take: 1, orderBy: { createdAt: 'desc' } } }
    });
  }

  async getById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { envVars: true, deployments: true }
    });

    if (project) {
      project.envVars = project.envVars.map(ev => ({
        ...ev,
        value: '[ENCRYPTED]'
      }));
    }
    return project;
  }
  
  async deleteProject(id: string) {
    // Cascade delete já configurado no Prisma (envVars e deployments)
    return await prisma.project.delete({
      where: { id }
    });
  }
  
  async updateProject(id: string, data: Partial<{
    name: string;
    repoUrl: string;
    branch: string;
    port: number;
    buildCmd: string;
    startCmd: string;
  }>) {
    return await prisma.project.update({
      where: { id },
      data
    });
  }
  
  async addEnvVar(projectId: string, key: string, value: string) {
    return await prisma.envVar.create({
      data: {
        key,
        value: CryptoUtil.encrypt(value),
        projectId
      }
    });
  }
  
  async deleteEnvVar(envId: string) {
    return await prisma.envVar.delete({
      where: { id: envId }
    });
  }
  
  async getEnvVarsDecrypted(projectId: string): Promise<Record<string, string>> {
    const envVars = await prisma.envVar.findMany({
      where: { projectId }
    });
    
    const result: Record<string, string> = {};
    for (const ev of envVars) {
      result[ev.key] = CryptoUtil.decrypt(ev.value);
    }
    return result;
  }
}
