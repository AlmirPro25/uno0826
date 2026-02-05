/**
 * ============================================
 * PROJECT FILE SYSTEM - SISTEMA DE ARQUIVOS REAL
 * ============================================
 * 
 * Gerencia projetos no sistema de arquivos real (HD)
 * em vez de virtual na memória
 */

export interface ProjectFile {
    path: string;
    content: string;
    type?: string;
}

export interface Project {
    id: string;
    name: string;
    path: string; // Caminho real no HD
    files: ProjectFile[];
    createdAt: string;
    updatedAt: string;
}

/**
 * Serviço para gerenciar projetos no HD via backend
 */
export class ProjectFileSystem {
    private static readonly API_BASE = 'http://localhost:3001/api';

    /**
     * Cria um novo projeto no HD
     */
    static async createProject(name: string, files: ProjectFile[]): Promise<Project> {
        try {
            const response = await fetch(`${this.API_BASE}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, files })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Erro ao criar projeto:', error);
            throw new Error(`Falha ao criar projeto: ${error.message}`);
        }
    }

    /**
     * Lista todos os projetos
     */
    static async listProjects(): Promise<Project[]> {
        try {
            const response = await fetch(`${this.API_BASE}/projects`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.projects || [];
        } catch (error: any) {
            console.error('Erro ao listar projetos:', error);
            return [];
        }
    }

    /**
     * Obtém um projeto específico
     */
    static async getProject(projectId: string): Promise<Project | null> {
        try {
            const response = await fetch(`${this.API_BASE}/projects/${projectId}`);

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data.project;
        } catch (error: any) {
            console.error('Erro ao obter projeto:', error);
            return null;
        }
    }

    /**
     * Atualiza arquivos de um projeto
     */
    static async updateProject(projectId: string, files: ProjectFile[]): Promise<boolean> {
        try {
            const response = await fetch(`${this.API_BASE}/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files })
            });

            return response.ok;
        } catch (error: any) {
            console.error('Erro ao atualizar projeto:', error);
            return false;
        }
    }

    /**
     * Deleta um projeto
     */
    static async deleteProject(projectId: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.API_BASE}/projects/${projectId}`, {
                method: 'DELETE'
            });

            return response.ok;
        } catch (error: any) {
            console.error('Erro ao deletar projeto:', error);
            return false;
        }
    }

    /**
     * Instala um projeto como app via CLI
     */
    static async installAsApp(
        projectId: string,
        fullStack?: { frontend: string | null; backend: string | null; styling: string | null }
    ): Promise<{ success: boolean; appId?: string; error?: string; path?: string; message?: string }> {
        try {
            const response = await fetch(`${this.API_BASE}/projects/${projectId}/install`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullStack })
            });

            if (!response.ok) {
                const data = await response.json();
                return { success: false, error: data.error };
            }

            const data = await response.json();
            return {
                success: true,
                appId: data.appId,
                path: data.path,
                message: data.message
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Abre pasta do projeto no explorador
     */
    static async openInExplorer(projectId: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.API_BASE}/projects/${projectId}/open`, {
                method: 'POST'
            });

            return response.ok;
        } catch (error: any) {
            console.error('Erro ao abrir explorador:', error);
            return false;
        }
    }
}
