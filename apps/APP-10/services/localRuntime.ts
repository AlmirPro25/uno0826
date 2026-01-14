/**
 * 🖥️ Local Runtime Service
 * Substitui o WebContainer por execução real via PowerShell
 */

import { io, Socket } from 'socket.io-client';
import { VirtualFile } from '../types';
import { filesToWebContainerTree } from '../utils/fileSystem';

const API_URL = 'http://localhost:3001';
let socket: Socket | null = null;
let isConnected = false;

// Callbacks para output do shell
type OutputCallback = (data: string) => void;
let shellOutputCallback: OutputCallback | null = null;
let serverOutputCallback: OutputCallback | null = null;

export class LocalRuntimeService {
  
  // ============================================================================
  // 🔌 CONNECTION
  // ============================================================================
  
  static async connect(): Promise<void> {
    if (socket?.connected) return;
    
    return new Promise((resolve, reject) => {
      socket = io(API_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5
      });
      
      socket.on('connect', () => {
        isConnected = true;
        console.log('✅ Connected to Local Runtime');
        resolve();
      });
      
      socket.on('disconnect', () => {
        isConnected = false;
        console.log('❌ Disconnected from Local Runtime');
      });
      
      socket.on('connect_error', (err) => {
        reject(new Error(`Failed to connect to Local Runtime: ${err.message}`));
      });
      
      // Shell output (do shell interativo)
      socket.on('shell:output', (data: string) => {
        shellOutputCallback?.(data);
      });
      
      // Terminal output (de comandos executados via API)
      socket.on('terminal:output', (data: string) => {
        // Também envia para o callback do shell para mostrar no terminal
        shellOutputCallback?.(data);
      });
      
      socket.on('shell:ready', () => {
        console.log('🖥️ Shell ready');
        shellOutputCallback?.('\r\n');
      });
      
      socket.on('shell:exit', (code: number) => {
        console.log(`🖥️ Shell exited with code ${code}`);
        shellOutputCallback?.(`\r\n\x1b[33mShell exited with code ${code}\x1b[0m\r\n`);
      });
      
      // Server output (do dev server)
      socket.on('server:output', (data: string) => {
        serverOutputCallback?.(data);
        // Também mostra no terminal principal
        shellOutputCallback?.(data);
      });
      
      // Timeout
      setTimeout(() => {
        if (!isConnected) {
          reject(new Error('Connection timeout - is the server running?'));
        }
      }, 5000);
    });
  }
  
  static isConnected(): boolean {
    return isConnected && socket?.connected === true;
  }
  
  static disconnect(): void {
    socket?.disconnect();
    socket = null;
    isConnected = false;
  }
  
  // ============================================================================
  // 📁 FILE SYSTEM
  // ============================================================================
  
  static async writeFile(filePath: string, content: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/fs/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
  }
  
  static async readFile(filePath: string): Promise<string> {
    const res = await fetch(`${API_URL}/api/fs/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.content;
  }
  
  static async deleteFile(filePath: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/fs/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
  }
  
  static async rename(oldPath: string, newPath: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/fs/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newPath })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
  }
  
  static async listDir(dirPath: string = '.'): Promise<string[]> {
    const res = await fetch(`${API_URL}/api/fs/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: dirPath })
    });
    const data = await res.json();
    return data.items?.map((i: any) => i.isDirectory ? `${i.name}/` : i.name) || [];
  }
  
  /**
   * Obter árvore completa de arquivos do workspace
   */
  static async getFileTree(): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/fs/tree`);
    const data = await res.json();
    return data.files || [];
  }
  
  /**
   * Sincronizar arquivos do frontend para o sistema local
   */
  static async syncFiles(files: Array<{ path: string; content: string }>): Promise<void> {
    const res = await fetch(`${API_URL}/api/fs/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
  }
  
  /**
   * Obter workspace atual
   */
  static async getWorkspace(): Promise<{ path: string; name: string }> {
    const res = await fetch(`${API_URL}/api/workspace`);
    return res.json();
  }
  
  /**
   * Alterar workspace
   */
  static async setWorkspace(newPath: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/workspace/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: newPath })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
  }
  
  /**
   * Abrir diálogo de seleção de pasta
   */
  static async browseWorkspace(): Promise<string | null> {
    const res = await fetch(`${API_URL}/api/workspace/browse`, { method: 'POST' });
    const data = await res.json();
    return data.success ? data.path : null;
  }
  
  /**
   * Obter workspaces recentes
   */
  static async getRecentWorkspaces(): Promise<Array<{ path: string; name: string; lastOpened: number }>> {
    const res = await fetch(`${API_URL}/api/workspace/recent`);
    const data = await res.json();
    return data.workspaces || [];
  }
  
  static async exists(filePath: string): Promise<boolean> {
    const res = await fetch(`${API_URL}/api/fs/exists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    });
    const data = await res.json();
    return data.exists;
  }
  
  /**
   * Monta todos os arquivos virtuais no workspace local
   */
  static async mount(files: VirtualFile[]): Promise<void> {
    const writeRecursive = async (node: VirtualFile) => {
      if (node.isFolder) {
        if (node.children) {
          for (const child of node.children) {
            await writeRecursive(child);
          }
        }
      } else {
        await this.writeFile(node.path, node.content);
      }
    };
    
    for (const file of files) {
      await writeRecursive(file);
    }
  }
  
  /**
   * Escreve múltiplos arquivos
   */
  static async writeFiles(files: VirtualFile[]): Promise<void> {
    await this.mount(files);
  }
  
  // ============================================================================
  // 🖥️ COMMAND EXECUTION
  // ============================================================================
  
  static async exec(cmd: string, args: string[] = [], timeout: number = 60000): Promise<{ output: string; exitCode: number }> {
    const command = args.length > 0 ? `${cmd} ${args.join(' ')}` : cmd;
    
    const res = await fetch(`${API_URL}/api/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, timeout })
    });
    
    const data = await res.json();
    return { output: data.output || '', exitCode: data.exitCode };
  }
  
  // ============================================================================
  // 🐚 INTERACTIVE SHELL
  // ============================================================================
  
  static async startShell(
    terminalCallback: OutputCallback,
    cols: number = 120,
    rows: number = 30
  ): Promise<{ inputWriter: { write: (data: string) => Promise<void> } }> {
    if (!socket) throw new Error('Not connected to runtime');
    
    shellOutputCallback = terminalCallback;
    
    // Iniciar shell com dimensões
    socket.emit('shell:start', { cols, rows });
    
    // Aguardar shell estar pronto
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Shell start timeout'));
      }, 10000);
      
      socket?.once('shell:ready', (info: { type: string }) => {
        clearTimeout(timeout);
        console.log(`🖥️ Shell ready (${info?.type || 'unknown'})`);
        
        resolve({
          inputWriter: {
            write: async (data: string) => {
              socket?.emit('shell:input', data);
            }
          }
        });
      });
      
      socket?.once('shell:error', (error: string) => {
        clearTimeout(timeout);
        reject(new Error(error));
      });
    });
  }
  
  static resizeShell(cols: number, rows: number): void {
    socket?.emit('shell:resize', { cols, rows });
  }
  
  // ============================================================================
  // 🌐 DEV SERVER
  // ============================================================================
  
  static async startDevServer(command: string = 'npm run dev', port: number = 5173): Promise<string> {
    const res = await fetch(`${API_URL}/api/server/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, port })
    });
    
    const data = await res.json();
    if (!data.success) throw new Error('Failed to start dev server');
    
    return `http://localhost:${port}`;
  }
  
  static async stopDevServer(): Promise<void> {
    await fetch(`${API_URL}/api/server/stop`, { method: 'POST' });
  }
  
  static async getServerStatus(): Promise<{ running: boolean; port: number | null; url: string | null }> {
    const res = await fetch(`${API_URL}/api/server/status`);
    return res.json();
  }
  
  static onServerOutput(callback: OutputCallback): void {
    serverOutputCallback = callback;
  }
  
  // ============================================================================
  // 🔧 UTILITIES
  // ============================================================================
  
  static async spawnBackground(
    cmd: string,
    args: string[],
    onOutput?: OutputCallback
  ): Promise<{ kill: () => void }> {
    // Para processos em background, usamos o dev server
    const command = `${cmd} ${args.join(' ')}`;
    
    if (onOutput) {
      serverOutputCallback = onOutput;
    }
    
    await fetch(`${API_URL}/api/server/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    
    return {
      kill: () => {
        fetch(`${API_URL}/api/server/stop`, { method: 'POST' });
      }
    };
  }
  
  static async stat(filePath: string): Promise<{ isFile: boolean; isDirectory: boolean } | null> {
    const exists = await this.exists(filePath);
    if (!exists) return null;
    
    try {
      await this.readFile(filePath);
      return { isFile: true, isDirectory: false };
    } catch {
      return { isFile: false, isDirectory: true };
    }
  }
  
  /**
   * Adicionar workspace aos recentes
   */
  static async addToRecentWorkspaces(wsPath: string): Promise<void> {
    await fetch(`${API_URL}/api/workspace/recent/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: wsPath })
    });
  }
  
  /**
   * Listener para mudança de workspace
   */
  static onWorkspaceChanged(callback: (path: string) => void): void {
    socket?.on('workspace:changed', (data: { path: string }) => {
      callback(data.path);
    });
  }
}

// Alias para compatibilidade
export const WebContainerService = LocalRuntimeService;
