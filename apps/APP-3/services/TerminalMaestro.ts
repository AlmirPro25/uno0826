/**
 * ============================================
 * TERMINAL MAESTRO - ORQUESTRADOR INTELIGENTE
 * ============================================
 * 
 * Maestro de IA que gerencia comandos do terminal,
 * analisa logs, detecta erros e sugere soluções.
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';

export interface TerminalCommand {
    id: string;
    command: string;
    output: string;
    exitCode: number;
    timestamp: string;
    duration: number;
    type: 'cli' | 'powershell' | 'system';
}

export interface TerminalAnalysis {
    hasError: boolean;
    errorType?: 'syntax' | 'runtime' | 'permission' | 'network' | 'unknown';
    errorMessage?: string;
    suggestion?: string;
    autoFixCommand?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MaestroResponse {
    understood: boolean;
    intent: 'install' | 'start' | 'debug' | 'list' | 'remove' | 'logs' | 'analyze' | 'help' | 'unknown';
    cliCommand?: string;
    explanation: string;
    needsConfirmation: boolean;
    risks?: string[];
}

/**
 * Maestro de IA para gerenciar terminal
 */
export class TerminalMaestro {
    private genAI: GoogleGenAI | null = null;
    private commandHistory: TerminalCommand[] = [];
    
    constructor() {
        const apiKey = ApiKeyManager.getKeyToUse();
        if (apiKey) {
            this.genAI = new GoogleGenAI({ apiKey });
        }
    }
    
    /**
     * Interpreta comando em linguagem natural e converte para CLI
     */
    async interpretCommand(userInput: string): Promise<MaestroResponse> {
        if (!this.genAI) {
            return this.fallbackInterpretation(userInput);
        }
        
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            
            const prompt = `Você é um assistente especializado em CLI do AI Web Weaver.

COMANDOS DISPONÍVEIS:
- aiweaver install <arquivo> [nome] - Instalar app
- aiweaver start <id> - Iniciar app
- aiweaver debug <id> - Debug app
- aiweaver list - Listar apps
- aiweaver remove <id> - Remover app
- aiweaver logs <id> - Ver logs
- aiweaver analyze <arquivo> - Analisar código
- aiweaver help - Ajuda

ENTRADA DO USUÁRIO: "${userInput}"

Analise a entrada e retorne um JSON com:
{
    "understood": boolean,
    "intent": "install" | "start" | "debug" | "list" | "remove" | "logs" | "analyze" | "help" | "unknown",
    "cliCommand": "comando CLI exato",
    "explanation": "explicação do que vai fazer",
    "needsConfirmation": boolean,
    "risks": ["possíveis riscos"]
}

Exemplos:
- "instalar meu app" → {"understood": true, "intent": "install", "cliCommand": "aiweaver install app.html", ...}
- "listar apps" → {"understood": true, "intent": "list", "cliCommand": "aiweaver list", ...}
- "debugar o app abc123" → {"understood": true, "intent": "debug", "cliCommand": "aiweaver debug abc123", ...}

Retorne APENAS o JSON, sem texto adicional.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            // Extrair JSON da resposta
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const response = JSON.parse(jsonMatch[0]);
                return response;
            }
            
            return this.fallbackInterpretation(userInput);
        } catch (error) {
            console.error('Erro ao interpretar comando:', error);
            return this.fallbackInterpretation(userInput);
        }
    }
    
    /**
     * Interpretação fallback sem IA
     */
    private fallbackInterpretation(userInput: string): MaestroResponse {
        const input = userInput.toLowerCase().trim();
        
        // Comandos rápidos
        if (input === 'help' || input === 'ajuda' || input === '?') {
            return {
                understood: true,
                intent: 'help',
                cliCommand: 'aiweaver help',
                explanation: 'Mostrar ajuda dos comandos',
                needsConfirmation: false
            };
        }
        
        if (input === 'clear' || input === 'limpar' || input === 'cls') {
            return {
                understood: true,
                intent: 'help',
                cliCommand: 'aiweaver clear',
                explanation: 'Limpar terminal',
                needsConfirmation: false
            };
        }
        
        if (input === 'status' || input === 'info') {
            return {
                understood: true,
                intent: 'help',
                cliCommand: 'aiweaver status',
                explanation: 'Ver status do sistema',
                needsConfirmation: false
            };
        }
        
        // Detectar intent por palavras-chave
        if (input.includes('install') || input.includes('instalar')) {
            return {
                understood: true,
                intent: 'install',
                cliCommand: 'aiweaver install app.html',
                explanation: 'Instalar um novo app',
                needsConfirmation: false
            };
        }
        
        if (input.includes('start') || input.includes('iniciar') || input.includes('rodar')) {
            return {
                understood: true,
                intent: 'start',
                cliCommand: 'aiweaver start <id>',
                explanation: 'Iniciar um app instalado',
                needsConfirmation: false
            };
        }
        
        if (input.includes('debug') || input.includes('debugar')) {
            return {
                understood: true,
                intent: 'debug',
                cliCommand: 'aiweaver debug <id>',
                explanation: 'Debugar um app com análise de código',
                needsConfirmation: false
            };
        }
        
        if (input.includes('list') || input.includes('listar') || input.includes('mostrar')) {
            return {
                understood: true,
                intent: 'list',
                cliCommand: 'aiweaver list',
                explanation: 'Listar todos os apps instalados',
                needsConfirmation: false
            };
        }
        
        if (input.includes('remove') || input.includes('remover') || input.includes('deletar')) {
            return {
                understood: true,
                intent: 'remove',
                cliCommand: 'aiweaver remove <id>',
                explanation: 'Remover um app instalado',
                needsConfirmation: true,
                risks: ['O app será permanentemente removido']
            };
        }
        
        if (input.includes('logs') || input.includes('log')) {
            return {
                understood: true,
                intent: 'logs',
                cliCommand: 'aiweaver logs <id>',
                explanation: 'Ver logs de um app',
                needsConfirmation: false
            };
        }
        
        if (input.includes('analyze') || input.includes('analisar')) {
            return {
                understood: true,
                intent: 'analyze',
                cliCommand: 'aiweaver analyze <arquivo>',
                explanation: 'Analisar código de um arquivo',
                needsConfirmation: false
            };
        }
        
        if (input.includes('help') || input.includes('ajuda')) {
            return {
                understood: true,
                intent: 'help',
                cliCommand: 'aiweaver help',
                explanation: 'Mostrar ajuda dos comandos',
                needsConfirmation: false
            };
        }
        
        return {
            understood: false,
            intent: 'unknown',
            explanation: 'Não entendi o comando. Digite "help" para ver comandos disponíveis.',
            needsConfirmation: false
        };
    }
    
    /**
     * Analisa output do terminal e detecta erros
     */
    async analyzeOutput(command: string, output: string, exitCode: number): Promise<TerminalAnalysis> {
        // Análise básica sem IA
        const hasError = exitCode !== 0 || 
                        output.toLowerCase().includes('error') ||
                        output.toLowerCase().includes('erro') ||
                        output.toLowerCase().includes('failed') ||
                        output.toLowerCase().includes('falhou');
        
        if (!hasError) {
            return {
                hasError: false,
                severity: 'low'
            };
        }
        
        // Detectar tipo de erro
        let errorType: TerminalAnalysis['errorType'] = 'unknown';
        let errorMessage = '';
        let suggestion = '';
        let autoFixCommand = '';
        
        if (output.includes('permission denied') || output.includes('acesso negado')) {
            errorType = 'permission';
            errorMessage = 'Permissão negada';
            suggestion = 'Execute o PowerShell como Administrador';
        } else if (output.includes('not found') || output.includes('não encontrado')) {
            errorType = 'runtime';
            errorMessage = 'Arquivo ou comando não encontrado';
            suggestion = 'Verifique se o arquivo existe ou se o CLI está instalado';
        } else if (output.includes('syntax error') || output.includes('erro de sintaxe')) {
            errorType = 'syntax';
            errorMessage = 'Erro de sintaxe no comando';
            suggestion = 'Verifique a sintaxe do comando';
        } else if (output.includes('network') || output.includes('connection') || output.includes('timeout')) {
            errorType = 'network';
            errorMessage = 'Erro de rede ou conexão';
            suggestion = 'Verifique sua conexão com a internet';
        }
        
        // Usar IA para análise mais profunda se disponível
        if (this.genAI) {
            try {
                const analysis = await this.analyzeWithAI(command, output);
                if (analysis) {
                    return analysis;
                }
            } catch (error) {
                console.error('Erro na análise com IA:', error);
            }
        }
        
        return {
            hasError: true,
            errorType,
            errorMessage,
            suggestion,
            autoFixCommand,
            severity: errorType === 'permission' ? 'high' : 'medium'
        };
    }
    
    /**
     * Análise com IA
     */
    private async analyzeWithAI(command: string, output: string): Promise<TerminalAnalysis | null> {
        if (!this.genAI) return null;
        
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            
            const prompt = `Analise este output de terminal e identifique problemas:

COMANDO: ${command}

OUTPUT:
${output}

Retorne um JSON com:
{
    "hasError": boolean,
    "errorType": "syntax" | "runtime" | "permission" | "network" | "unknown",
    "errorMessage": "mensagem do erro",
    "suggestion": "sugestão de correção",
    "autoFixCommand": "comando para corrigir (se possível)",
    "severity": "low" | "medium" | "high" | "critical"
}

Retorne APENAS o JSON.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return null;
        } catch (error) {
            console.error('Erro na análise com IA:', error);
            return null;
        }
    }
    
    /**
     * Sugere próximo comando baseado no contexto
     */
    async suggestNextCommand(context: {
        lastCommand?: string;
        lastOutput?: string;
        projectFiles?: string[];
    }): Promise<string[]> {
        const suggestions: string[] = [];
        
        // Sugestões baseadas no último comando
        if (context.lastCommand?.includes('install')) {
            suggestions.push('aiweaver list');
            suggestions.push('aiweaver start <id>');
        } else if (context.lastCommand?.includes('list')) {
            suggestions.push('aiweaver start <id>');
            suggestions.push('aiweaver debug <id>');
        } else if (context.lastCommand?.includes('start')) {
            suggestions.push('aiweaver logs <id>');
            suggestions.push('aiweaver debug <id>');
        } else if (context.lastCommand?.includes('debug')) {
            suggestions.push('aiweaver logs <id>');
            suggestions.push('aiweaver analyze <arquivo>');
        }
        
        // Sugestões baseadas em arquivos do projeto
        if (context.projectFiles && context.projectFiles.length > 0) {
            const htmlFiles = context.projectFiles.filter(f => f.endsWith('.html'));
            if (htmlFiles.length > 0) {
                suggestions.push(`aiweaver install ${htmlFiles[0]}`);
                suggestions.push(`aiweaver analyze ${htmlFiles[0]}`);
            }
        }
        
        // Sugestões padrão
        if (suggestions.length === 0) {
            suggestions.push('aiweaver help');
            suggestions.push('aiweaver list');
        }
        
        return suggestions.slice(0, 5); // Máximo 5 sugestões
    }
    
    /**
     * Adiciona comando ao histórico
     */
    addToHistory(command: TerminalCommand) {
        this.commandHistory.push(command);
        
        // Manter apenas últimos 100 comandos
        if (this.commandHistory.length > 100) {
            this.commandHistory = this.commandHistory.slice(-100);
        }
    }
    
    /**
     * Obtém histórico de comandos
     */
    getHistory(): TerminalCommand[] {
        return [...this.commandHistory];
    }
    
    /**
     * Limpa histórico
     */
    clearHistory() {
        this.commandHistory = [];
    }
}

// Instância singleton
export const terminalMaestro = new TerminalMaestro();
