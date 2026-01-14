/**
 * 🤖 KIRO AGENT SERVICE
 * 
 * Serviço de agente que integra o Gemini com as ferramentas
 * de manipulação de arquivos e terminal.
 * 
 * Permite que a IA execute ações automaticamente no projeto.
 */

import { GoogleGenAI, FunctionDeclaration, Tool } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';
import { kiroToolExecutor, KIRO_TOOLS, ToolResult } from './KiroToolExecutor';

export interface AgentMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCall?: {
    name: string;
    args: Record<string, any>;
  };
  toolResult?: ToolResult;
}

export interface AgentResponse {
  message: string;
  toolsUsed: string[];
  success: boolean;
}

/**
 * Sistema de Agente com Tool Calling
 */
export class KiroAgentService {
  private genAI: GoogleGenAI | null = null;
  private conversationHistory: AgentMessage[] = [];
  private maxToolCalls = 10; // Limite de segurança
  
  constructor() {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }
  
  /**
   * Converte nossas tools para o formato do Gemini
   */
  private getGeminiTools(): Tool[] {
    const functionDeclarations: FunctionDeclaration[] = KIRO_TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object' as const,
        properties: tool.parameters.properties,
        required: tool.parameters.required
      }
    }));
    
    return [{ functionDeclarations }];
  }
  
  /**
   * System prompt do agente
   */
  private getSystemPrompt(): string {
    return `Você é um agente de código inteligente chamado KIRO TURBINADO.

SUAS CAPACIDADES:
- Ler e escrever arquivos do projeto
- Buscar texto em arquivos (grep)
- Buscar arquivos por nome
- Listar diretórios
- Executar comandos no terminal (npm, node, git, etc.)
- Substituir texto em arquivos
- Analisar código e detectar problemas

REGRAS IMPORTANTES:
1. SEMPRE use as ferramentas disponíveis para interagir com o projeto
2. Antes de modificar um arquivo, LEIA-O primeiro para entender o contexto
3. Use strReplace para modificações precisas (a string deve ser única)
4. Para criar arquivos novos, use writeFile
5. Para adicionar ao final, use appendFile
6. Explique o que você está fazendo a cada passo
7. Se algo falhar, tente uma abordagem alternativa

FERRAMENTAS DISPONÍVEIS:
- readFile: Lê um arquivo
- readMultipleFiles: Lê vários arquivos de uma vez
- writeFile: Cria ou sobrescreve um arquivo
- strReplace: Substitui texto em arquivo (string deve ser única)
- appendFile: Adiciona ao final de um arquivo
- grepSearch: Busca texto em arquivos (regex)
- fileSearch: Busca arquivos por nome
- listDirectory: Lista diretório com profundidade
- executeCommand: Executa comando no terminal
- getDiagnostics: Analisa código por erros
- deleteFile: Deleta arquivo (requer confirmação)

FORMATO DE RESPOSTA:
- Seja conciso e direto
- Mostre o que você fez
- Se usou ferramentas, explique brevemente o resultado`;
  }
  
  /**
   * Processa uma mensagem do usuário com tool calling
   */
  async processMessage(userMessage: string): Promise<AgentResponse> {
    if (!this.genAI) {
      return {
        message: "❌ API Key do Gemini não configurada",
        toolsUsed: [],
        success: false
      };
    }
    
    const toolsUsed: string[] = [];
    let toolCallCount = 0;
    
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: this.getGeminiTools(),
        systemInstruction: this.getSystemPrompt()
      });
      
      // Adiciona mensagem do usuário ao histórico
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });
      
      // Prepara o histórico para o Gemini
      const contents = this.conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      
      // Loop de tool calling
      let response = await model.generateContent({ contents });
      let result = response.response;
      
      while (result.functionCalls && result.functionCalls.length > 0 && toolCallCount < this.maxToolCalls) {
        const functionCall = result.functionCalls[0];
        const toolName = functionCall.name;
        const toolArgs = functionCall.args as Record<string, any>;
        
        console.log(`🔧 Tool call: ${toolName}`, toolArgs);
        toolsUsed.push(toolName);
        toolCallCount++;
        
        // Executa a ferramenta
        const toolResult = await kiroToolExecutor.execute(toolName, toolArgs);
        
        // Adiciona ao histórico
        this.conversationHistory.push({
          role: 'tool',
          content: JSON.stringify(toolResult),
          toolCall: { name: toolName, args: toolArgs },
          toolResult
        });
        
        // Continua a conversa com o resultado da ferramenta
        const toolResponse = {
          role: 'user' as const,
          parts: [{
            functionResponse: {
              name: toolName,
              response: toolResult
            }
          }]
        };
        
        contents.push(toolResponse);
        
        // Nova chamada ao modelo
        response = await model.generateContent({ contents });
        result = response.response;
      }
      
      // Extrai a resposta final
      const finalText = result.text() || "Operação concluída.";
      
      // Adiciona resposta ao histórico
      this.conversationHistory.push({
        role: 'assistant',
        content: finalText
      });
      
      return {
        message: finalText,
        toolsUsed,
        success: true
      };
      
    } catch (error: any) {
      console.error('❌ Erro no agente:', error);
      return {
        message: `❌ Erro: ${error.message}`,
        toolsUsed,
        success: false
      };
    }
  }
  
  /**
   * Limpa o histórico de conversa
   */
  clearHistory() {
    this.conversationHistory = [];
  }
  
  /**
   * Obtém o histórico de conversa
   */
  getHistory(): AgentMessage[] {
    return [...this.conversationHistory];
  }
}

// Instância singleton
export const kiroAgent = new KiroAgentService();
