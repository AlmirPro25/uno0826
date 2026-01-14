/**
 * ============================================
 * PROJECT FILES CONTROLLER
 * ============================================
 * 
 * Gerencia projetos salvos no HD local
 * Funciona sem autenticação em modo dev
 */

import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

// Pasta base para projetos
const PROJECTS_BASE = path.join(process.cwd(), '..', 'workspace', 'projects');

// Garantir que a pasta existe
if (!fs.existsSync(PROJECTS_BASE)) {
    fs.mkdirSync(PROJECTS_BASE, { recursive: true });
}

// Arquivo de índice de projetos
const PROJECTS_INDEX = path.join(PROJECTS_BASE, 'projects-index.json');

interface ProjectFile {
    path: string;
    content: string;
}

interface ProjectMeta {
    id: string;
    name: string;
    path: string;
    createdAt: string;
    updatedAt: string;
}

// Carregar índice de projetos
function loadProjectsIndex(): ProjectMeta[] {
    try {
        if (fs.existsSync(PROJECTS_INDEX)) {
            return JSON.parse(fs.readFileSync(PROJECTS_INDEX, 'utf-8'));
        }
    } catch (error) {
        console.error('Erro ao carregar índice:', error);
    }
    return [];
}

// Salvar índice de projetos
function saveProjectsIndex(projects: ProjectMeta[]): void {
    fs.writeFileSync(PROJECTS_INDEX, JSON.stringify(projects, null, 2));
}

/**
 * GET /api/projects - Lista todos os projetos
 */
export const listProjects = async (req: Request, res: Response) => {
    try {
        const projects = loadProjectsIndex();
        res.json({ projects });
    } catch (error: any) {
        console.error('Erro ao listar projetos:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/projects/:id - Obtém um projeto específico
 */
export const getProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const projects = loadProjectsIndex();
        const projectMeta = projects.find(p => p.id === id);
        
        if (!projectMeta) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        
        // Ler arquivos do projeto
        const projectPath = projectMeta.path;
        const files: ProjectFile[] = [];
        
        function readDir(dir: string, basePath: string = '') {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const relativePath = basePath ? `${basePath}/${item}` : item;
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    readDir(fullPath, relativePath);
                } else {
                    files.push({
                        path: relativePath,
                        content: fs.readFileSync(fullPath, 'utf-8')
                    });
                }
            }
        }
        
        if (fs.existsSync(projectPath)) {
            readDir(projectPath);
        }
        
        res.json({
            project: {
                ...projectMeta,
                files
            }
        });
    } catch (error: any) {
        console.error('Erro ao obter projeto:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/projects - Cria um novo projeto
 */
export const createProject = async (req: Request, res: Response) => {
    try {
        const { name, files } = req.body;
        
        if (!name || !files || !Array.isArray(files)) {
            return res.status(400).json({ error: 'Nome e arquivos são obrigatórios' });
        }
        
        // Gerar ID e caminho
        const id = uuidv4();
        const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
        const timestamp = Date.now();
        const projectFolder = `${safeName}_${timestamp}`;
        const projectPath = path.join(PROJECTS_BASE, projectFolder);
        
        // Criar pasta do projeto
        fs.mkdirSync(projectPath, { recursive: true });
        
        // Salvar arquivos
        for (const file of files) {
            const filePath = path.join(projectPath, file.path);
            const fileDir = path.dirname(filePath);
            
            if (!fs.existsSync(fileDir)) {
                fs.mkdirSync(fileDir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, file.content);
        }
        
        // Atualizar índice
        const projects = loadProjectsIndex();
        const newProject: ProjectMeta = {
            id,
            name,
            path: projectPath,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        projects.push(newProject);
        saveProjectsIndex(projects);
        
        console.log(`✅ Projeto criado: ${projectPath}`);
        
        res.status(201).json({
            ...newProject,
            files
        });
    } catch (error: any) {
        console.error('Erro ao criar projeto:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /api/projects/:id - Atualiza um projeto
 */
export const updateProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { files } = req.body;
        
        const projects = loadProjectsIndex();
        const projectIndex = projects.findIndex(p => p.id === id);
        
        if (projectIndex === -1) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        
        const projectMeta = projects[projectIndex];
        const projectPath = projectMeta.path;
        
        // Atualizar arquivos
        for (const file of files) {
            const filePath = path.join(projectPath, file.path);
            const fileDir = path.dirname(filePath);
            
            if (!fs.existsSync(fileDir)) {
                fs.mkdirSync(fileDir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, file.content);
        }
        
        // Atualizar timestamp
        projects[projectIndex].updatedAt = new Date().toISOString();
        saveProjectsIndex(projects);
        
        res.json({ success: true });
    } catch (error: any) {
        console.error('Erro ao atualizar projeto:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/projects/:id - Deleta um projeto
 */
export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const projects = loadProjectsIndex();
        const projectIndex = projects.findIndex(p => p.id === id);
        
        if (projectIndex === -1) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        
        const projectMeta = projects[projectIndex];
        
        // Deletar pasta do projeto
        if (fs.existsSync(projectMeta.path)) {
            fs.rmSync(projectMeta.path, { recursive: true, force: true });
        }
        
        // Remover do índice
        projects.splice(projectIndex, 1);
        saveProjectsIndex(projects);
        
        res.json({ success: true });
    } catch (error: any) {
        console.error('Erro ao deletar projeto:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/projects/:id/install - Instala projeto como app
 */
export const installProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const projects = loadProjectsIndex();
        const projectMeta = projects.find(p => p.id === id);
        
        if (!projectMeta) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        
        const projectPath = projectMeta.path;
        
        // Verificar se tem package.json
        const packageJsonPath = path.join(projectPath, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
            // Projeto Node.js - rodar npm install
            exec('npm install', { cwd: projectPath }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Erro npm install:', error);
                    return res.json({ 
                        success: true, 
                        appId: id,
                        message: 'Projeto salvo. npm install falhou mas arquivos estão OK.',
                        path: projectPath
                    });
                }
                
                res.json({ 
                    success: true, 
                    appId: id,
                    message: 'Projeto instalado com sucesso!',
                    path: projectPath
                });
            });
        } else {
            // Projeto simples (HTML/CSS/JS) - já está pronto
            res.json({ 
                success: true, 
                appId: id,
                message: 'Projeto salvo com sucesso!',
                path: projectPath
            });
        }
    } catch (error: any) {
        console.error('Erro ao instalar projeto:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/projects/:id/open - Abre pasta no explorador
 */
export const openProjectFolder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const projects = loadProjectsIndex();
        const projectMeta = projects.find(p => p.id === id);
        
        if (!projectMeta) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        
        const projectPath = projectMeta.path;
        
        // Verificar se a pasta existe
        if (!fs.existsSync(projectPath)) {
            return res.status(404).json({ error: 'Pasta do projeto não encontrada' });
        }
        
        // Abrir no explorador de arquivos
        const platform = process.platform;
        
        if (platform === 'win32') {
            // No Windows, usar start para abrir o explorer
            exec(`start "" "${projectPath}"`, { shell: 'cmd.exe' }, (error) => {
                if (error) {
                    console.error('Erro ao abrir explorador:', error);
                    // Tentar método alternativo
                    exec(`explorer.exe "${projectPath.replace(/\//g, '\\')}"`, (error2) => {
                        if (error2) {
                            return res.status(500).json({ error: 'Falha ao abrir explorador', path: projectPath });
                        }
                        res.json({ success: true, path: projectPath });
                    });
                    return;
                }
                res.json({ success: true, path: projectPath });
            });
        } else if (platform === 'darwin') {
            exec(`open "${projectPath}"`, (error) => {
                if (error) {
                    return res.status(500).json({ error: 'Falha ao abrir explorador' });
                }
                res.json({ success: true, path: projectPath });
            });
        } else {
            exec(`xdg-open "${projectPath}"`, (error) => {
                if (error) {
                    return res.status(500).json({ error: 'Falha ao abrir explorador' });
                }
                res.json({ success: true, path: projectPath });
            });
        }
    } catch (error: any) {
        console.error('Erro ao abrir pasta:', error);
        res.status(500).json({ error: error.message });
    }
};
