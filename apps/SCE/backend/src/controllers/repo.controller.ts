/**
 * ================================================================================
 * REPO CONTROLLER — SCE
 * ================================================================================
 * 
 * Endpoints para análise de repositórios Git:
 * - POST /api/v1/repo/analyze - Analisa estrutura do repositório
 * - POST /api/v1/repo/generate-dockerfile - Gera Dockerfile baseado na análise
 * 
 * ================================================================================
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { RepoAnalyzerService, DetectedProject } from '../services/repo-analyzer.service.js';

const repoAnalyzer = new RepoAnalyzerService();

interface AnalyzeBody {
  repoUrl: string;
  branch?: string;
}

interface GenerateDockerfileBody {
  project: DetectedProject;
}

export class RepoController {
  /**
   * POST /api/v1/repo/analyze
   * Analisa um repositório Git e detecta projetos
   */
  async analyze(req: FastifyRequest<{ Body: AnalyzeBody }>, res: FastifyReply) {
    try {
      const { repoUrl, branch = 'main' } = req.body;
      
      if (!repoUrl) {
        return res.status(400).send({ error: 'repoUrl é obrigatório' });
      }
      
      // Validar URL do repositório
      if (!this.isValidRepoUrl(repoUrl)) {
        return res.status(400).send({ 
          error: 'URL de repositório inválida. Use formato: https://github.com/user/repo' 
        });
      }
      
      console.log(`[Repo] Analisando: ${repoUrl} (branch: ${branch})`);
      const analysis = await repoAnalyzer.analyzeRepo(repoUrl, branch);
      
      return { success: true, data: analysis };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao analisar repositório';
      console.error('[Repo] Erro:', msg);
      return res.status(500).send({ error: msg });
    }
  }

  /**
   * POST /api/v1/repo/generate-dockerfile
   * Gera Dockerfile baseado na análise do projeto
   */
  async generateDockerfile(req: FastifyRequest<{ Body: GenerateDockerfileBody }>, res: FastifyReply) {
    try {
      const { project } = req.body;
      
      if (!project || !project.framework) {
        return res.status(400).send({ error: 'Dados do projeto são obrigatórios' });
      }
      
      const dockerfile = repoAnalyzer.generateDockerfile(project);
      return { success: true, dockerfile };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao gerar Dockerfile';
      return res.status(500).send({ error: msg });
    }
  }

  /**
   * Valida URL de repositório Git
   */
  private isValidRepoUrl(url: string): boolean {
    const patterns = [
      /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/,
      /^https:\/\/gitlab\.com\/[\w-]+\/[\w.-]+$/,
      /^https:\/\/bitbucket\.org\/[\w-]+\/[\w.-]+$/,
      /^git@github\.com:[\w-]+\/[\w.-]+\.git$/,
    ];
    
    return patterns.some(pattern => pattern.test(url));
  }
}
