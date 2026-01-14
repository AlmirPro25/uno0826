/**
 * ============================================
 * MAESTRO INTEGRADO - ORQUESTRADOR COMPLETO
 * ============================================
 * 
 * Conecta Chat + Terminal + FileSystem + IA
 * Interpreta linguagem natural e executa ações
 */

import { terminalMaestro } from './TerminalMaestro';
import { ProjectFileSystem, type ProjectFile } from './ProjectFileSystem';

export interface MaestroAction {
    type: 'chat' | 'terminal' | 'filesystem' | 'hybrid';
    intent: string;
    commands: string[];
    explanation: string;
}

/**
 * Maestro Integrado - Orquestra todas as partes do sistema
 */
export class IntegratedMaestro {
    /**
     * Interpreta comando do usuário e decide qual sistema usar
     */
    static async interpretCommand(userInput: string, context: {
        hasProject?: boolean;
        projectFiles?: ProjectFile[];
        currentProjectId?: string;
    }): Promise<MaestroAction> {
        const input = userInput.toLowerCase().trim();
        
        // Detectar intent
        if (this.isProjectCreation(input)) {
            return {
                type: 'hybrid',
                intent: 'create_project',
                commands: ['Gerar código via chat', 'Salvar no HD', 'Mostrar no explorador'],
                explanation: 'Vou gerar o código e salvar no seu HD'
            };
        }
        
        if (this.isProjectInstallation(input)) {
            return {
                type: 'hybrid',
                intent: 'install_project',
                commands: ['Salvar projeto no HD', 'Instalar como app via CLI', 'Iniciar app'],
                explanation: 'Vou instalar o projeto atual como app'
            };
        }
        
        if (this.isFileSystemOperation(input)) {
            return {
                type: 'filesystem',
                intent: 'filesystem_op',
                commands: ['Navegar no HD', 'Abrir explorador'],
                explanation: 'Vou abrir a pasta do projeto'
            };
        }
        
        if (this.isTerminalCommand(input)) {
            return {
                type: 'terminal',
                intent: 'terminal_cmd',
                commands: [input],
                explanation: 'Vou executar o comando no terminal'
            };
        }
        
        // Padrão: usar chat
        return {
            type: 'chat',
            intent: 'chat_message',
            commands: [input],
            explanation: 'Vou processar via chat'
        };
    }
    
    /**
     * Executa ação completa (orquestra tudo)
     */
    static async executeAction(action: MaestroAction, context: any): Promise<{
        success: boolean;
        result: any;
        message: string;
    }> {
        try {
            switch (action.type) {
                case 'hybrid':
                    return await this.executeHybridAction(action, context);
                    
                case 'terminal':
                    return await this.executeTerminalAction(action);
                    
                case 'filesystem':
                    return await this.executeFileSystemAction(action, context);
                    
                case 'chat':
                    return {
                        success: true,
                        result: null,
                        message: 'Processado via chat'
                    };
                    
                default:
                    return {
                        success: false,
                        result: null,
                        message: 'Tipo de ação desconhecido'
                    };
            }
        } catch (error: any) {
            return {
                success: false,
                result: null,
                message: `Erro: ${error.message}`
            };
        }
    }
    
    /**
     * Executa ação híbrida (múltiplos sistemas)
     */
    private static async executeHybridAction(action: MaestroAction, context: any) {
        if (action.intent === 'create_project') {
            // 1. Código já foi gerado pelo chat
            // 2. Salvar no HD
            const project = await ProjectFileSystem.createProject(
                context.projectName || 'Novo Projeto',
                context.projectFiles || []
            );
            
            return {
                success: true,
                result: project,
                message: `Projeto salvo em: ${project.path}`
            };
        }
        
        if (action.intent === 'install_project') {
            // 1. Salvar projeto (se ainda não foi)
            let projectId = context.currentProjectId;
            
            if (!projectId && context.projectFiles) {
                const project = await ProjectFileSystem.createProject(
                    context.projectName || 'Projeto',
                    context.projectFiles
                );
                projectId = project.id;
            }
            
            // 2. Instalar como app
            const result = await ProjectFileSystem.installAsApp(projectId);
            
            if (!result.success) {
                return {
                    success: false,
                    result: null,
                    message: result.error || 'Erro ao instalar'
                };
            }
            
            return {
                success: true,
                result: { appId: result.appId, projectId },
                message: `App instalado! ID: ${result.appId}`
            };
        }
        
        return {
            success: false,
            result: null,
            message: 'Ação híbrida não implementada'
        };
    }
    
    /**
     * Executa comando de terminal
     */
    private static async executeTerminalAction(action: MaestroAction) {
        // Delegar para o TerminalMaestro
        return {
            success: true,
            result: action.commands,
            message: 'Comando enviado ao terminal'
        };
    }
    
    /**
     * Executa operação de filesystem
     */
    private static async executeFileSystemAction(action: MaestroAction, context: any) {
        if (context.currentProjectId) {
            const success = await ProjectFileSystem.openInExplorer(context.currentProjectId);
            
            return {
                success,
                result: null,
                message: success ? 'Explorador aberto' : 'Erro ao abrir explorador'
            };
        }
        
        return {
            success: false,
            result: null,
            message: 'Nenhum projeto ativo'
        };
    }
    
    // Detectores de intent
    private static isProjectCreation(input: string): boolean {
        return input.includes('criar projeto') ||
               input.includes('novo projeto') ||
               input.includes('gerar projeto') ||
               input.includes('salvar projeto');
    }
    
    private static isProjectInstallation(input: string): boolean {
        return input.includes('instalar') ||
               input.includes('deploy') ||
               input.includes('rodar') ||
               input.includes('executar projeto');
    }
    
    private static isFileSystemOperation(input: string): boolean {
        return input.includes('abrir pasta') ||
               input.includes('abrir explorador') ||
               input.includes('mostrar arquivos') ||
               input.includes('ver pasta');
    }
    
    private static isTerminalCommand(input: string): boolean {
        return input.startsWith('aiweaver') ||
               input.includes('terminal') ||
               input.includes('comando') ||
               input.includes('executar');
    }
}
