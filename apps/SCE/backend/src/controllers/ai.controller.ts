/**
 * ================================================================================
 * AI CONTROLLER — SCE + Aurora Builder
 * ================================================================================
 * 
 * Endpoints para IA no container:
 * - POST /api/v1/ai/analyze - Analisa código de um projeto
 * - POST /api/v1/ai/generate - Gera código novo
 * - POST /api/v1/ai/complete - Autocomplete de código
 * - POST /api/v1/ai/suggest - Sugere melhorias
 * 
 * ================================================================================
 */

import { Router, Request, Response } from 'express';
import { AIBuilderService } from '../services/ai-builder.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { PrismaClient } from '@prisma/client';
import { DockerService } from '../services/docker.service.js';
import * as path from 'path';
import * as os from 'os';

const router = Router();
const aiBuilder = new AIBuilderService();
const prisma = new PrismaClient();
const dockerService = new DockerService();

/**
 * GET /api/v1/ai/status
 * Verifica se a IA está disponível
 */
router.get('/status', async (req: Request, res: Response) => {
  res.json({
    available: aiBuilder.isAvailable(),
    model: 'gemini-1.5-flash',
    features: ['analyze', 'generate', 'complete', 'suggest'],
  });
});

/**
 * POST /api/v1/ai/analyze
 * Analisa código de um projeto deployado
 */
router.post('/analyze', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'projectId é obrigatório' });
    }
    
    // Buscar projeto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    // Verificar se container está rodando
    const isRunning = await dockerService.isContainerRunning(project.subdomain);
    if (!isRunning) {
      return res.status(400).json({ error: 'Container não está rodando' });
    }
    
    // Copiar arquivos do container para análise
    const tempDir = path.join(os.tmpdir(), `sce-ai-${projectId}`);
    await dockerService.copyFromContainer(project.subdomain, '/app', tempDir);
    
    // Analisar com IA
    const analysis = await aiBuilder.analyzeProject(tempDir, project.type === 'FRONTEND' ? 'next' : 'express');
    
    // Limpar temp
    const fs = await import('fs/promises');
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    
    res.json({
      success: true,
      data: analysis,
    });
    
  } catch (error) {
    console.error('[AI] Erro na análise:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro ao analisar projeto' 
    });
  }
});

/**
 * POST /api/v1/ai/generate
 * Gera código novo para um projeto
 */
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { projectId, request } = req.body;
    
    if (!projectId || !request) {
      return res.status(400).json({ error: 'projectId e request são obrigatórios' });
    }
    
    // Buscar projeto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
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
    const fs = await import('fs/promises');
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    
    res.json({
      success: true,
      data: result,
    });
    
  } catch (error) {
    console.error('[AI] Erro na geração:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro ao gerar código' 
    });
  }
});

/**
 * POST /api/v1/ai/apply
 * Aplica código gerado no container e faz rebuild
 */
router.post('/apply', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { projectId, files } = req.body;
    
    if (!projectId || !files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'projectId e files são obrigatórios' });
    }
    
    // Buscar projeto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    // Verificar se container está rodando
    const isRunning = await dockerService.isContainerRunning(project.subdomain);
    if (!isRunning) {
      return res.status(400).json({ error: 'Container não está rodando' });
    }
    
    // Aplicar cada arquivo no container
    for (const file of files) {
      if (file.action === 'delete') {
        await dockerService.execInContainer(project.subdomain, `rm -f /app/${file.path}`);
      } else {
        // Criar diretório se necessário
        const dir = path.dirname(file.path);
        if (dir !== '.') {
          await dockerService.execInContainer(project.subdomain, `mkdir -p /app/${dir}`);
        }
        
        // Escrever arquivo
        // Escapar conteúdo para shell
        const escapedContent = file.content
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "'\\''")
          .replace(/\n/g, '\\n');
        
        await dockerService.execInContainer(
          project.subdomain, 
          `echo '${escapedContent}' > /app/${file.path}`
        );
      }
    }
    
    res.json({
      success: true,
      message: `${files.length} arquivo(s) aplicado(s)`,
      needsRebuild: true,
    });
    
  } catch (error) {
    console.error('[AI] Erro ao aplicar:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro ao aplicar código' 
    });
  }
});

/**
 * POST /api/v1/ai/suggest
 * Sugere melhorias para um arquivo específico
 */
router.post('/suggest', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { projectId, filePath } = req.body;
    
    if (!projectId || !filePath) {
      return res.status(400).json({ error: 'projectId e filePath são obrigatórios' });
    }
    
    // Buscar projeto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    // Ler arquivo do container
    const content = await dockerService.execInContainer(
      project.subdomain, 
      `cat /app/${filePath}`
    );
    
    // Obter sugestões
    const framework = project.type === 'FRONTEND' ? 'next' : 'express';
    const suggestions = await aiBuilder.suggestImprovements(filePath, content, framework);
    
    res.json({
      success: true,
      data: {
        file: filePath,
        suggestions,
      },
    });
    
  } catch (error) {
    console.error('[AI] Erro nas sugestões:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro ao obter sugestões' 
    });
  }
});

export default router;
