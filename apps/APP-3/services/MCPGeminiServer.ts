/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🔌 MCP GEMINI SERVER - INTEGRAÇÃO COMPLETA 🔌                       ║
 * ║                                                                              ║
 * ║    Servidor Model Context Protocol que expõe o Gemini Service como MCP      ║
 * ║    Permite que agentes de IA acessem Gemini via protocolo padrão            ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import {
    MCPResources,
    MCPTools,
    MCPPrompts,
    executeMCPTool,
    accessMCPResource,
    initializeMCPServer
} from './GeminiService';

/**
 * Interface para requisições MCP
 */
export interface MCPRequest {
    type: 'resource' | 'tool' | 'prompt';
    name: string;
    params?: Record<string, any>;
}

/**
 * Interface para respostas MCP
 */
export interface MCPResponse {
    success: boolean;
    data?: any;
    error?: string;
    timestamp: string;
}

/**
 * Classe principal do servidor MCP Gemini
 */
export class MCPGeminiServer {
    private serverConfig: any;
    private requestLog: MCPRequest[] = [];
    private maxLogSize = 1000;

    constructor() {
        this.serverConfig = null;
    }

    /**
     * Inicializar o servidor MCP
     */
    async initialize(): Promise<void> {
        this.serverConfig = await initializeMCPServer();
        console.log('✅ MCP Gemini Server inicializado');
        console.log(`📊 Recursos disponíveis: ${Object.keys(MCPResources).length}`);
        console.log(`🔧 Ferramentas disponíveis: ${Object.keys(MCPTools).length}`);
        console.log(`📝 Prompts disponíveis: ${Object.keys(MCPPrompts).length}`);
    }

    /**
     * Processar uma requisição MCP
     */
    async handleRequest(request: MCPRequest): Promise<MCPResponse> {
        const timestamp = new Date().toISOString();

        try {
            this.logRequest(request);

            switch (request.type) {
                case 'resource':
                    return await this.handleResourceRequest(request, timestamp);
                case 'tool':
                    return await this.handleToolRequest(request, timestamp);
                case 'prompt':
                    return await this.handlePromptRequest(request, timestamp);
                default:
                    return {
                        success: false,
                        error: `Tipo de requisição desconhecido: ${request.type}`,
                        timestamp
                    };
            }
        } catch (error: any) {
            console.error('❌ Erro ao processar requisição MCP:', error);
            return {
                success: false,
                error: error.message || 'Erro desconhecido',
                timestamp
            };
        }
    }

    /**
     * Processar requisição de recurso
     */
    private async handleResourceRequest(request: MCPRequest, timestamp: string): Promise<MCPResponse> {
        const resource = await accessMCPResource(request.name, request.params);
        return {
            success: true,
            data: resource,
            timestamp
        };
    }

    /**
     * Processar requisição de ferramenta
     */
    private async handleToolRequest(request: MCPRequest, timestamp: string): Promise<MCPResponse> {
        const result = await executeMCPTool(request.name, request.params || {});
        return {
            success: true,
            data: result,
            timestamp
        };
    }

    /**
     * Processar requisição de prompt
     */
    private async handlePromptRequest(request: MCPRequest, timestamp: string): Promise<MCPResponse> {
        const prompt = MCPPrompts[request.name as keyof typeof MCPPrompts];
        if (!prompt) {
            return {
                success: false,
                error: `Prompt não encontrado: ${request.name}`,
                timestamp
            };
        }

        // Substituir placeholders nos argumentos
        let template = prompt.template;
        if (request.params) {
            Object.entries(request.params).forEach(([key, value]) => {
                template = template.replace(`{${key}}`, String(value));
            });
        }

        return {
            success: true,
            data: {
                name: request.name,
                description: prompt.description,
                template,
                arguments: prompt.arguments
            },
            timestamp
        };
    }

    /**
     * Registrar requisição para auditoria
     */
    private logRequest(request: MCPRequest): void {
        this.requestLog.push(request);
        if (this.requestLog.length > this.maxLogSize) {
            this.requestLog.shift();
        }
    }

    /**
     * Obter histórico de requisições
     */
    getRequestLog(): MCPRequest[] {
        return [...this.requestLog];
    }

    /**
     * Obter configuração do servidor
     */
    getServerConfig(): any {
        return this.serverConfig;
    }

    /**
     * Listar todos os recursos disponíveis
     */
    listResources(): string[] {
        return Object.keys(MCPResources);
    }

    /**
     * Listar todas as ferramentas disponíveis
     */
    listTools(): string[] {
        return Object.keys(MCPTools);
    }

    /**
     * Listar todos os prompts disponíveis
     */
    listPrompts(): string[] {
        return Object.keys(MCPPrompts);
    }

    /**
     * Obter informações detalhadas de uma ferramenta
     */
    getToolInfo(toolName: string): any {
        const tool = MCPTools[toolName as keyof typeof MCPTools];
        if (!tool) return null;
        return {
            name: toolName,
            description: tool.description,
            inputSchema: tool.inputSchema
        };
    }

    /**
     * Obter informações detalhadas de um prompt
     */
    getPromptInfo(promptName: string): any {
        const prompt = MCPPrompts[promptName as keyof typeof MCPPrompts];
        if (!prompt) return null;
        return {
            name: promptName,
            description: prompt.description,
            arguments: prompt.arguments
        };
    }
}

/**
 * Instância singleton do servidor MCP
 */
let mcpServerInstance: MCPGeminiServer | null = null;

/**
 * Obter ou criar instância do servidor MCP
 */
export async function getMCPGeminiServer(): Promise<MCPGeminiServer> {
    if (!mcpServerInstance) {
        mcpServerInstance = new MCPGeminiServer();
        await mcpServerInstance.initialize();
    }
    return mcpServerInstance;
}

/**
 * Executar uma requisição MCP
 */
export async function executeMCPRequest(request: MCPRequest): Promise<MCPResponse> {
    const server = await getMCPGeminiServer();
    return server.handleRequest(request);
}

/**
 * Exemplo de uso do servidor MCP
 */
export async function exampleMCPUsage() {
    const server = await getMCPGeminiServer();

    // Exemplo 1: Acessar recurso (listar personas)
    const personasResponse = await server.handleRequest({
        type: 'resource',
        name: 'gemini://personas/list'
    });
    console.log('📋 Personas disponíveis:', personasResponse.data);

    // Exemplo 2: Executar ferramenta (gerar conteúdo)
    const generateResponse = await server.handleRequest({
        type: 'tool',
        name: 'gemini:generate',
        params: {
            prompt: 'Crie um exemplo de código TypeScript para um servidor Express',
            modelName: 'gemini-2.5-flash'
        }
    });
    console.log('✨ Conteúdo gerado:', generateResponse.data);

    // Exemplo 3: Obter prompt template
    const promptResponse = await server.handleRequest({
        type: 'prompt',
        name: 'gemini:create-landing-page',
        params: {
            productName: 'Meu Produto',
            targetAudience: 'Desenvolvedores',
            mainFeatures: 'Rápido, Seguro, Escalável'
        }
    });
    console.log('📝 Prompt template:', promptResponse.data);
}
