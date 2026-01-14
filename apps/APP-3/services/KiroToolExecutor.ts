/**
 * 🚀 KIRO TOOL EXECUTOR
 * 
 * Executor de ferramentas que permite ao chat da IA
 * executar ações no sistema de arquivos e terminal.
 * 
 * Similar às capacidades do Kiro IDE.
 */

const API_BASE = 'http://localhost:3001/api';

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface KiroTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * Definição das ferramentas disponíveis para o agente
 */
export const KIRO_TOOLS: KiroTool[] = [
  {
    name: "readFile",
    description: "Lê o conteúdo de um arquivo do projeto",
    parameters: {
      type: "object",
      properties: {
        path: { 
          type: "string", 
          description: "Caminho relativo do arquivo (ex: src/App.tsx)" 
        }
      },
      required: ["path"]
    }
  },
  {
    name: "readMultipleFiles",
    description: "Lê múltiplos arquivos de uma vez",
    parameters: {
      type: "object",
      properties: {
        paths: { 
          type: "array",
          items: { type: "string" },
          description: "Lista de caminhos de arquivos" 
        }
      },
      required: ["paths"]
    }
  },
  {
    name: "writeFile",
    description: "Escreve conteúdo em um arquivo (cria ou sobrescreve)",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho do arquivo" },
        content: { type: "string", description: "Conteúdo a escrever" }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "strReplace",
    description: "Substitui uma string específica em um arquivo. A string deve ser única no arquivo.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho do arquivo" },
        oldStr: { type: "string", description: "String a ser substituída (deve ser única)" },
        newStr: { type: "string", description: "Nova string" }
      },
      required: ["path", "oldStr", "newStr"]
    }
  },
  {
    name: "appendFile",
    description: "Adiciona conteúdo ao final de um arquivo existente",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho do arquivo" },
        text: { type: "string", description: "Texto a adicionar" }
      },
      required: ["path", "text"]
    }
  },
  {
    name: "grepSearch",
    description: "Busca texto em arquivos usando regex (similar ao grep/ripgrep)",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Padrão regex para buscar" },
        path: { type: "string", description: "Diretório para buscar (default: .)" },
        includePattern: { type: "string", description: "Glob pattern (ex: **/*.ts)" },
        caseSensitive: { type: "boolean", description: "Busca case-sensitive" }
      },
      required: ["query"]
    }
  },
  {
    name: "fileSearch",
    description: "Busca arquivos por nome",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Parte do nome do arquivo" },
        path: { type: "string", description: "Diretório para buscar" }
      },
      required: ["query"]
    }
  },
  {
    name: "listDirectory",
    description: "Lista arquivos e pastas de um diretório",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho do diretório" },
        depth: { type: "number", description: "Profundidade da listagem (default: 2)" }
      },
      required: ["path"]
    }
  },
  {
    name: "executeCommand",
    description: "Executa um comando no terminal (npm, node, git, etc.)",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "Comando a executar" },
        cwd: { type: "string", description: "Diretório de trabalho" }
      },
      required: ["command"]
    }
  },
  {
    name: "getDiagnostics",
    description: "Obtém diagnósticos de código (erros, warnings) de arquivos",
    parameters: {
      type: "object",
      properties: {
        paths: { 
          type: "array",
          items: { type: "string" },
          description: "Lista de arquivos para analisar" 
        }
      },
      required: ["paths"]
    }
  },
  {
    name: "deleteFile",
    description: "Deleta um arquivo (requer confirmação)",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho do arquivo" },
        confirm: { type: "boolean", description: "Confirmação (deve ser true)" }
      },
      required: ["path", "confirm"]
    }
  }
];

/**
 * Obtém token de autenticação
 */
function getAuthToken(): string | null {
  // Tenta obter do localStorage
  const token = localStorage.getItem('authToken');
  if (token) return token;
  
  // Fallback: token de desenvolvimento
  return 'dev-token';
}

/**
 * Faz requisição autenticada
 */
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
}

/**
 * Executor de ferramentas
 */
export class KiroToolExecutor {
  
  /**
   * Executa uma ferramenta pelo nome
   */
  async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
    console.log(`🔧 Executando tool: ${toolName}`, args);
    
    try {
      switch (toolName) {
        case 'readFile':
          return await this.readFile(args.path);
          
        case 'readMultipleFiles':
          return await this.readMultipleFiles(args.paths);
          
        case 'writeFile':
          return await this.writeFile(args.path, args.content);
          
        case 'strReplace':
          return await this.strReplace(args.path, args.oldStr, args.newStr);
          
        case 'appendFile':
          return await this.appendFile(args.path, args.text);
          
        case 'grepSearch':
          return await this.grepSearch(args);
          
        case 'fileSearch':
          return await this.fileSearch(args.query, args.path);
          
        case 'listDirectory':
          return await this.listDirectory(args.path, args.depth);
          
        case 'executeCommand':
          return await this.executeCommand(args.command, args.cwd);
          
        case 'getDiagnostics':
          return await this.getDiagnostics(args.paths);
          
        case 'deleteFile':
          return await this.deleteFile(args.path, args.confirm);
          
        default:
          return { success: false, error: `Tool desconhecida: ${toolName}` };
      }
    } catch (error: any) {
      console.error(`❌ Erro ao executar ${toolName}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // ========== IMPLEMENTAÇÕES DAS TOOLS ==========
  
  async readFile(path: string): Promise<ToolResult> {
    const res = await authFetch(`${API_BASE}/terminal/read-file?path=${encodeURIComponent(path)}`);
    const data = await res.json();
    return { success: data.success, data: data.content, error: data.error };
  }
  
  async readMultipleFiles(paths: string[]): Promise<ToolResult> {
    const res = await authFetch(`${API_BASE}/kiro/read-multiple`, {
      method: 'POST',
      body: JSON.stringify({ paths })
    });
    const data = await res.json();
    return { success: data.success, data: data.files, error: data.error };
  }
  
  async writeFile(path: string, content: string): Promise<ToolResult> {
    const res = await authFetch(`${API_BASE}/terminal/write-files`, {
      method: 'POST',
      body: JSON.stringify({ files: [{ path, content }] })
    });
    const data = await res.json();
    return { success: data.success, error: data.error };
  }
  
  async strReplace(path: string, oldStr: string, newStr: string): Promise<ToolResult> {
    const res = await authFetch(`${API_BASE}/kiro/replace`, {
      method: 'POST',
      body: JSON.stringify({ path, oldStr, newStr })
    });
    const data = await res.json();
    return { success: data.success, error: data.error || data.hint };
  }
  
  async appendFile(path: string, text: string): Promise<ToolResult> {
    const res = await authFetch(`${API_BASE}/kiro/append`, {
      method: 'POST',
      body: JSON.stringify({ path, text })
    });
    const data = await res.json();
    return { success: data.success, error: data.error };
  }
  
  async grepSearch(args: {
    query: string;
    path?: string;
    includePattern?: string;
    caseSensitive?: boolean;
  }): Promise<ToolResult> {
    const res = await authFetch(`${API_BASE}/kiro/search`, {
      method: 'POST',
      body: JSON.stringify(args)
    });
    const data = await res.json();
    return { success: data.success, data: data.results, error: data.error };
  }
  
  async fileSearch(query: string, path?: string): Promise<ToolResult> {
    const params = new URLSearchParams({ query });
    if (path) params.append('path', path);
    
    const res = await authFetch(`${API_BASE}/kiro/file-search?${params}`);
    const data = await res.json();
    return { success: data.success, data: data.results, error: data.error };
  }
  
  async listDirectory(path: string, depth?: number): Promise<ToolResult> {
    const params = new URLSearchParams({ path });
    if (depth) params.append('depth', depth.toString());
    
    const res = await authFetch(`${API_BASE}/kiro/list-recursive?${params}`);
    const data = await res.json();
    return { success: data.success, data: data.tree, error: data.error };
  }
  
  async executeCommand(command: string, cwd?: string): Promise<ToolResult> {
    const res = await authFetch(`${API_BASE}/terminal/execute`, {
      method: 'POST',
      body: JSON.stringify({ command, cwd })
    });
    const data = await res.json();
    return { 
      success: data.success, 
      data: { stdout: data.stdout, stderr: data.stderr, exitCode: data.exitCode },
      error: data.error 
    };
  }
  
  async getDiagnostics(paths: string[]): Promise<ToolResult> {
    const res = await authFetch(`${API_BASE}/kiro/diagnostics`, {
      method: 'POST',
      body: JSON.stringify({ paths })
    });
    const data = await res.json();
    return { success: data.success, data: data.diagnostics, error: data.error };
  }
  
  async deleteFile(path: string, confirm: boolean): Promise<ToolResult> {
    const res = await authFetch(`${API_BASE}/kiro/delete`, {
      method: 'DELETE',
      body: JSON.stringify({ path, confirm })
    });
    const data = await res.json();
    return { success: data.success, error: data.error };
  }
}

// Instância singleton
export const kiroToolExecutor = new KiroToolExecutor();

/**
 * Formata as tools para o formato do Gemini
 */
export function getGeminiToolsDeclaration() {
  return KIRO_TOOLS.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
}
