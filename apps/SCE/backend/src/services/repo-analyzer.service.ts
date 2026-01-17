/**
 * ================================================================================
 * REPO ANALYZER SERVICE — SCE
 * ================================================================================
 * 
 * Analisa repositórios Git para detectar:
 * - Estrutura (monorepo, frontend, backend)
 * - Framework e linguagem
 * - Comandos de build/start
 * - Porta padrão
 * 
 * ================================================================================
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import * as os from 'os';

const execAsync = promisify(exec);

export interface DetectedProject {
  path: string;           // Caminho relativo no repo
  name: string;           // Nome sugerido
  type: 'FRONTEND' | 'BACKEND' | 'FULLSTACK' | 'UNKNOWN';
  framework: string;      // next, react, vue, express, fastify, etc
  language: string;       // typescript, javascript, python, go, etc
  port: number;           // Porta detectada ou padrão
  buildCmd?: string;      // Comando de build detectado
  startCmd?: string;      // Comando de start detectado
  hasDockerfile: boolean;
  confidence: number;     // 0-100 confiança na detecção
}

export interface RepoAnalysis {
  repoUrl: string;
  branch: string;
  isMonorepo: boolean;
  rootProject?: DetectedProject;
  projects: DetectedProject[];
  totalFiles: number;
  analyzedAt: Date;
}

// Padrões de detecção de frameworks
const FRAMEWORK_PATTERNS = {
  // Frontend
  'next': { files: ['next.config.js', 'next.config.ts', 'next.config.mjs'], type: 'FRONTEND', port: 3000 },
  'react': { files: ['src/App.tsx', 'src/App.jsx', 'src/index.tsx'], type: 'FRONTEND', port: 3000 },
  'vue': { files: ['vue.config.js', 'src/App.vue', 'nuxt.config.js'], type: 'FRONTEND', port: 3000 },
  'angular': { files: ['angular.json', 'src/app/app.module.ts'], type: 'FRONTEND', port: 4200 },
  'svelte': { files: ['svelte.config.js', 'src/App.svelte'], type: 'FRONTEND', port: 5173 },
  'astro': { files: ['astro.config.mjs', 'astro.config.ts'], type: 'FRONTEND', port: 4321 },
  
  // Backend Node
  'express': { deps: ['express'], type: 'BACKEND', port: 3001 },
  'fastify': { deps: ['fastify'], type: 'BACKEND', port: 3001 },
  'nestjs': { files: ['nest-cli.json'], deps: ['@nestjs/core'], type: 'BACKEND', port: 3001 },
  'hono': { deps: ['hono'], type: 'BACKEND', port: 3001 },
  
  // Backend Python
  'fastapi': { files: ['main.py'], deps: ['fastapi'], type: 'BACKEND', port: 8000 },
  'django': { files: ['manage.py', 'settings.py'], type: 'BACKEND', port: 8000 },
  'flask': { deps: ['flask'], type: 'BACKEND', port: 5000 },
  
  // Backend Go
  'go': { files: ['go.mod', 'main.go'], type: 'BACKEND', port: 8080 },
  'gin': { files: ['go.mod'], deps: ['github.com/gin-gonic/gin'], type: 'BACKEND', port: 8080 },
  
  // Fullstack
  'remix': { files: ['remix.config.js'], type: 'FULLSTACK', port: 3000 },
  't3': { files: ['src/server/api/root.ts'], deps: ['@trpc/server'], type: 'FULLSTACK', port: 3000 },
};

// Padrões de monorepo
const MONOREPO_PATTERNS = [
  'apps/',
  'packages/',
  'services/',
  'frontend/',
  'backend/',
  'web/',
  'api/',
  'client/',
  'server/',
];

export class RepoAnalyzerService {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'sce-analyzer');
  }

  /**
   * Analisa um repositório Git
   */
  async analyzeRepo(repoUrl: string, branch: string = 'main'): Promise<RepoAnalysis> {
    const workDir = path.join(this.tempDir, randomUUID());
    
    try {
      // 1. Clonar repositório (shallow clone pra ser rápido)
      await fs.mkdir(workDir, { recursive: true });
      await execAsync(`git clone --depth 1 --branch ${branch} ${repoUrl} .`, { cwd: workDir });
      
      // 2. Listar estrutura
      const structure = await this.listStructure(workDir);
      
      // 3. Detectar se é monorepo
      const isMonorepo = this.detectMonorepo(structure);
      
      // 4. Encontrar projetos
      const projects: DetectedProject[] = [];
      
      if (isMonorepo) {
        // Analisar cada subpasta potencial
        const subfolders = await this.findProjectFolders(workDir, structure);
        for (const folder of subfolders) {
          const project = await this.analyzeProject(workDir, folder);
          if (project) projects.push(project);
        }
      } else {
        // Analisar raiz como projeto único
        const rootProject = await this.analyzeProject(workDir, '.');
        if (rootProject) projects.push(rootProject);
      }
      
      // 5. Limpar
      await fs.rm(workDir, { recursive: true, force: true });
      
      return {
        repoUrl,
        branch,
        isMonorepo,
        rootProject: projects.find(p => p.path === '.'),
        projects,
        totalFiles: structure.length,
        analyzedAt: new Date(),
      };
      
    } catch (error) {
      // Limpar em caso de erro
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  /**
   * Lista estrutura de arquivos do repositório
   */
  private async listStructure(dir: string, prefix = ''): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        files.push(relativePath + '/');
        // Limitar profundidade pra não demorar
        if (relativePath.split('/').length < 4) {
          files.push(...await this.listStructure(path.join(dir, entry.name), relativePath));
        }
      } else {
        files.push(relativePath);
      }
    }
    
    return files;
  }

  /**
   * Detecta se é monorepo
   */
  private detectMonorepo(structure: string[]): boolean {
    // Verifica se tem pastas típicas de monorepo
    for (const pattern of MONOREPO_PATTERNS) {
      if (structure.some(f => f.startsWith(pattern))) {
        return true;
      }
    }
    
    // Verifica se tem workspaces no package.json
    // (será verificado depois na análise detalhada)
    return false;
  }

  /**
   * Encontra pastas que parecem ser projetos
   */
  private async findProjectFolders(workDir: string, structure: string[]): Promise<string[]> {
    const folders: string[] = [];
    
    // Pastas de primeiro nível que parecem projetos
    const topLevelDirs = structure
      .filter(f => f.endsWith('/') && !f.includes('/'))
      .map(f => f.slice(0, -1));
    
    for (const dir of topLevelDirs) {
      // Verifica se tem package.json, go.mod, requirements.txt, etc
      const hasProjectFile = structure.some(f => 
        f === `${dir}/package.json` ||
        f === `${dir}/go.mod` ||
        f === `${dir}/requirements.txt` ||
        f === `${dir}/Cargo.toml` ||
        f === `${dir}/pom.xml`
      );
      
      if (hasProjectFile) {
        folders.push(dir);
      }
    }
    
    // Se não encontrou nada, tenta apps/ e packages/
    if (folders.length === 0) {
      for (const mono of ['apps', 'packages', 'services']) {
        const subDirs = structure
          .filter(f => f.startsWith(`${mono}/`) && f.endsWith('/'))
          .map(f => f.slice(0, -1))
          .filter(f => f.split('/').length === 2);
        
        folders.push(...subDirs);
      }
    }
    
    // Sempre inclui raiz se tiver package.json
    if (structure.includes('package.json')) {
      folders.unshift('.');
    }
    
    return [...new Set(folders)];
  }

  /**
   * Analisa um projeto específico
   */
  private async analyzeProject(workDir: string, projectPath: string): Promise<DetectedProject | null> {
    const fullPath = path.join(workDir, projectPath);
    
    try {
      const files = await fs.readdir(fullPath);
      
      // Detectar linguagem e framework
      let framework = 'unknown';
      let language = 'unknown';
      let type: DetectedProject['type'] = 'UNKNOWN';
      let port = 3000;
      let buildCmd: string | undefined;
      let startCmd: string | undefined;
      let confidence = 0;
      
      // Verificar package.json (Node.js)
      if (files.includes('package.json')) {
        const pkg = JSON.parse(await fs.readFile(path.join(fullPath, 'package.json'), 'utf-8'));
        language = pkg.devDependencies?.typescript ? 'typescript' : 'javascript';
        
        // Detectar framework por dependências
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        for (const [fw, pattern] of Object.entries(FRAMEWORK_PATTERNS)) {
          if (pattern.deps?.some(dep => allDeps[dep])) {
            framework = fw;
            type = pattern.type as any;
            port = pattern.port;
            confidence = 80;
            break;
          }
        }
        
        // Detectar por arquivos específicos
        if (framework === 'unknown') {
          for (const [fw, pattern] of Object.entries(FRAMEWORK_PATTERNS)) {
            if (pattern.files?.some(f => files.includes(f) || files.includes(f.split('/').pop()!))) {
              framework = fw;
              type = pattern.type as any;
              port = pattern.port;
              confidence = 90;
              break;
            }
          }
        }
        
        // Extrair comandos do package.json
        if (pkg.scripts) {
          buildCmd = pkg.scripts.build;
          startCmd = pkg.scripts.start || pkg.scripts.dev;
          
          // Detectar porta nos scripts
          const portMatch = JSON.stringify(pkg.scripts).match(/PORT[=:](\d+)/i);
          if (portMatch) port = parseInt(portMatch[1]);
        }
      }
      
      // Verificar go.mod (Go)
      if (files.includes('go.mod')) {
        language = 'go';
        framework = 'go';
        type = 'BACKEND';
        port = 8080;
        confidence = 85;
        buildCmd = 'go build -o app .';
        startCmd = './app';
      }
      
      // Verificar requirements.txt (Python)
      if (files.includes('requirements.txt')) {
        language = 'python';
        const reqs = await fs.readFile(path.join(fullPath, 'requirements.txt'), 'utf-8');
        
        if (reqs.includes('fastapi')) {
          framework = 'fastapi';
          port = 8000;
          startCmd = 'uvicorn main:app --host 0.0.0.0 --port 8000';
        } else if (reqs.includes('django')) {
          framework = 'django';
          port = 8000;
          startCmd = 'python manage.py runserver 0.0.0.0:8000';
        } else if (reqs.includes('flask')) {
          framework = 'flask';
          port = 5000;
          startCmd = 'flask run --host 0.0.0.0';
        }
        
        type = 'BACKEND';
        confidence = 75;
      }
      
      // Verificar Dockerfile
      const hasDockerfile = files.includes('Dockerfile');
      if (hasDockerfile) {
        confidence = Math.min(100, confidence + 10);
        
        // Tentar extrair porta do Dockerfile
        try {
          const dockerfile = await fs.readFile(path.join(fullPath, 'Dockerfile'), 'utf-8');
          const exposeMatch = dockerfile.match(/EXPOSE\s+(\d+)/);
          if (exposeMatch) port = parseInt(exposeMatch[1]);
        } catch {}
      }
      
      // Nome do projeto
      const name = projectPath === '.' 
        ? path.basename(workDir)
        : path.basename(projectPath);
      
      return {
        path: projectPath,
        name,
        type,
        framework,
        language,
        port,
        buildCmd,
        startCmd,
        hasDockerfile,
        confidence,
      };
      
    } catch {
      return null;
    }
  }

  /**
   * Gera Dockerfile baseado na análise
   */
  generateDockerfile(project: DetectedProject): string {
    switch (project.framework) {
      case 'next':
        return this.nextDockerfile(project);
      case 'react':
      case 'vue':
      case 'svelte':
        return this.spaDockerfile(project);
      case 'express':
      case 'fastify':
      case 'nestjs':
      case 'hono':
        return this.nodeDockerfile(project);
      case 'go':
      case 'gin':
        return this.goDockerfile(project);
      case 'fastapi':
      case 'flask':
      case 'django':
        return this.pythonDockerfile(project);
      default:
        return this.genericDockerfile(project);
    }
  }

  private nextDockerfile(project: DetectedProject): string {
    return `# Next.js Dockerfile (auto-generated by SCE)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE ${project.port}
CMD ["node", "server.js"]
`;
  }

  private spaDockerfile(project: DetectedProject): string {
    return `# SPA Dockerfile (auto-generated by SCE)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
  }

  private nodeDockerfile(project: DetectedProject): string {
    return `# Node.js Dockerfile (auto-generated by SCE)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
${project.buildCmd ? `RUN ${project.buildCmd}` : ''}
EXPOSE ${project.port}
CMD ["${project.startCmd || 'npm start'}"]
`;
  }

  private goDockerfile(project: DetectedProject): string {
    return `# Go Dockerfile (auto-generated by SCE)
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o app .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/app .
EXPOSE ${project.port}
CMD ["./app"]
`;
  }

  private pythonDockerfile(project: DetectedProject): string {
    return `# Python Dockerfile (auto-generated by SCE)
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE ${project.port}
CMD ["${project.startCmd || 'python main.py'}"]
`;
  }

  private genericDockerfile(project: DetectedProject): string {
    return `# Generic Dockerfile (auto-generated by SCE)
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install 2>/dev/null || echo "No npm"
EXPOSE ${project.port}
CMD ["npm", "start"]
`;
  }
}
