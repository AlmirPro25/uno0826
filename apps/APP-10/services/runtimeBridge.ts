/**
 * 🌉 Runtime Bridge
 * Ponte que abstrai WebContainer e LocalRuntime para o App
 * Permite usar a mesma interface independente do modo
 * 
 * 🔄 SISTEMA HÍBRIDO INTELIGENTE:
 * - Tenta Local Mode primeiro se configurado
 * - Fallback automático para WebContainer se backend offline
 * - Permite alternar entre modos dinamicamente
 */

import { VirtualFile } from '../types';

// Detectar modo local configurado (via env var)
const isLocalModeConfigured = typeof window !== 'undefined' && (window as any).__AETHER_LOCAL_MODE__ === true;

// Estado dinâmico do modo atual
let currentMode: 'local' | 'webcontainer' | 'auto' = isLocalModeConfigured ? 'auto' : 'webcontainer';
let isBackendAvailable = false;
let lastBackendCheck = 0;
const BACKEND_CHECK_INTERVAL = 5000; // 5 segundos

// Verificar se o backend local está disponível
async function checkBackendAvailability(): Promise<boolean> {
  const now = Date.now();
  if (now - lastBackendCheck < BACKEND_CHECK_INTERVAL && lastBackendCheck > 0) {
    return isBackendAvailable;
  }
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    const res = await fetch('http://localhost:3001/api/workspace', {
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    isBackendAvailable = res.ok;
    lastBackendCheck = now;
    return isBackendAvailable;
  } catch {
    isBackendAvailable = false;
    lastBackendCheck = now;
    return false;
  }
}

// Verificar se WebContainer pode funcionar
function canUseWebContainer(): boolean {
  return typeof window !== 'undefined' && 
         window.isSecureContext && 
         window.crossOriginIsolated;
}

// Determinar o modo atual baseado na disponibilidade
async function determineCurrentMode(): Promise<'local' | 'webcontainer'> {
  if (currentMode === 'local') return 'local';
  if (currentMode === 'webcontainer') return 'webcontainer';
  
  // Modo auto: tentar local primeiro, fallback para webcontainer
  if (isLocalModeConfigured) {
    const backendOk = await checkBackendAvailability();
    if (backendOk) {
      console.log('🖥️ Runtime: Using Local Mode (backend available)');
      return 'local';
    }
  }
  
  if (canUseWebContainer()) {
    console.log('🌐 Runtime: Using WebContainer (fallback)');
    return 'webcontainer';
  }
  
  // Se nenhum funciona, tentar local de qualquer forma
  console.log('⚠️ Runtime: Forcing Local Mode (WebContainer unavailable)');
  return 'local';
}

// Export para verificação externa
export const isLocalMode = isLocalModeConfigured;

// Funções para controle externo do modo
export function setRuntimeMode(mode: 'local' | 'webcontainer' | 'auto') {
  currentMode = mode;
  bridgeInstance = null; // Forçar recriação do bridge
}

export function getRuntimeMode(): 'local' | 'webcontainer' | 'auto' {
  return currentMode;
}

export async function isBackendOnline(): Promise<boolean> {
  return checkBackendAvailability();
}

export function canRunWebContainer(): boolean {
  return canUseWebContainer();
}

// Interface unificada
export interface RuntimeBridge {
  boot(): Promise<any>;
  getInstance(): any;
  mount(files: VirtualFile[]): Promise<void>;
  writeFile(path: string, content: string): Promise<void>;
  writeFiles(files: VirtualFile[]): Promise<void>;
  readFile(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  exec(cmd: string, args: string[], timeout?: number): Promise<{ output: string; exitCode: number }>;
  startShell(
    callback: (data: string) => void,
    cols?: number,
    rows?: number
  ): Promise<{ process?: any; inputWriter: any }>;
  listDir(path?: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
  spawnBackground(cmd: string, args: string[], onOutput?: (data: string) => void): Promise<{ kill: () => void }>;
  stat(path: string): Promise<{ isFile: boolean; isDirectory: boolean } | null>;
  
  // Eventos
  onServerReady?: (callback: (port: number, url: string) => void) => void;
}

// Implementação para WebContainer
class WebContainerBridge implements RuntimeBridge {
  private service: any = null;
  private instance: any = null;

  async boot() {
    const { WebContainerService } = await import('./webcontainer');
    this.service = WebContainerService;
    this.instance = await WebContainerService.boot();
    return this.instance;
  }

  getInstance() {
    return this.instance;
  }

  async mount(files: VirtualFile[]) {
    await this.service.mount(files);
  }

  async writeFile(path: string, content: string) {
    await this.service.writeFile(path, content);
  }

  async writeFiles(files: VirtualFile[]) {
    await this.service.writeFiles(files);
  }

  async readFile(path: string) {
    return this.service.readFile(path);
  }

  async deleteFile(path: string) {
    await this.service.deleteFile(path);
  }

  async rename(oldPath: string, newPath: string) {
    await this.service.rename(oldPath, newPath);
  }

  async exec(cmd: string, args: string[], timeout = 60000) {
    return this.service.exec(cmd, args, timeout);
  }

  async startShell(callback: (data: string) => void, cols = 80, rows = 24) {
    return this.service.startShell(callback, cols, rows);
  }

  async listDir(path = '.') {
    return this.service.listDir(path);
  }

  async exists(path: string) {
    return this.service.exists(path);
  }

  async spawnBackground(cmd: string, args: string[], onOutput?: (data: string) => void) {
    return this.service.spawnBackground(cmd, args, onOutput);
  }

  async stat(path: string) {
    return this.service.stat(path);
  }

  onServerReady(callback: (port: number, url: string) => void) {
    if (this.instance) {
      this.instance.on('server-ready', callback);
    }
  }
}

// Implementação para Local Runtime
class LocalRuntimeBridge implements RuntimeBridge {
  private service: any = null;
  private serverReadyCallback: ((port: number, url: string) => void) | null = null;

  async boot() {
    const { LocalRuntimeService } = await import('./localRuntime');
    this.service = LocalRuntimeService;
    await LocalRuntimeService.connect();
    
    // Verificar se já tem servidor rodando
    const status = await LocalRuntimeService.getServerStatus();
    if (status.running && status.url && this.serverReadyCallback) {
      this.serverReadyCallback(status.port || 5173, status.url);
    }
    
    return this.service;
  }

  getInstance() {
    return this.service;
  }

  async mount(files: VirtualFile[]) {
    await this.service.mount(files);
  }

  async writeFile(path: string, content: string) {
    await this.service.writeFile(path, content);
  }

  async writeFiles(files: VirtualFile[]) {
    await this.service.writeFiles(files);
  }

  async readFile(path: string) {
    return this.service.readFile(path);
  }

  async deleteFile(path: string) {
    await this.service.deleteFile(path);
  }

  async rename(oldPath: string, newPath: string) {
    await this.service.rename(oldPath, newPath);
  }

  async exec(cmd: string, args: string[], timeout = 60000) {
    // No modo local, juntamos cmd e args em um comando PowerShell
    const command = args.length > 0 ? `${cmd} ${args.join(' ')}` : cmd;
    const res = await fetch('http://localhost:3001/api/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, timeout })
    });
    const data = await res.json();
    return { output: data.output || '', exitCode: data.exitCode };
  }

  async startShell(callback: (data: string) => void, cols = 80, rows = 24) {
    return this.service.startShell(callback, cols, rows);
  }

  async listDir(path = '.') {
    return this.service.listDir(path);
  }

  async exists(path: string) {
    return this.service.exists(path);
  }

  async spawnBackground(cmd: string, args: string[], onOutput?: (data: string) => void) {
    return this.service.spawnBackground(cmd, args, onOutput);
  }

  async stat(path: string) {
    return this.service.stat(path);
  }

  onServerReady(callback: (port: number, url: string) => void) {
    this.serverReadyCallback = callback;
    
    // Também configurar listener no socket para quando servidor iniciar
    if (this.service) {
      this.service.onServerOutput?.((data: string) => {
        // Detectar quando servidor está pronto
        if (data.includes('Local:') || data.includes('localhost:')) {
          const match = data.match(/localhost:(\d+)/);
          if (match) {
            callback(parseInt(match[1]), `http://localhost:${match[1]}`);
          }
        }
      });
    }
  }

  // Métodos específicos do Local Mode
  async startDevServer(command = 'npm run dev', port = 5173): Promise<string> {
    const { LocalRuntimeService } = await import('./localRuntime');
    const url = await LocalRuntimeService.startDevServer(command, port);
    if (this.serverReadyCallback) {
      this.serverReadyCallback(port, url);
    }
    return url;
  }

  async stopDevServer(): Promise<void> {
    const { LocalRuntimeService } = await import('./localRuntime');
    await LocalRuntimeService.stopDevServer();
  }
}

// Factory para criar o bridge correto
let bridgeInstance: RuntimeBridge | null = null;
let currentBridgeMode: 'local' | 'webcontainer' | null = null;

export async function getRuntimeBridgeAsync(): Promise<RuntimeBridge> {
  const mode = await determineCurrentMode();
  
  // Se o modo mudou, recriar o bridge
  if (bridgeInstance && currentBridgeMode !== mode) {
    console.log(`🔄 Runtime: Switching from ${currentBridgeMode} to ${mode}`);
    bridgeInstance = null;
  }
  
  if (!bridgeInstance) {
    currentBridgeMode = mode;
    bridgeInstance = mode === 'local' ? new LocalRuntimeBridge() : new WebContainerBridge();
  }
  
  return bridgeInstance;
}

// Versão síncrona (usa o último modo conhecido ou default)
export function getRuntimeBridge(): RuntimeBridge {
  if (!bridgeInstance) {
    // Usar modo configurado como default
    currentBridgeMode = isLocalModeConfigured ? 'local' : 'webcontainer';
    bridgeInstance = currentBridgeMode === 'local' ? new LocalRuntimeBridge() : new WebContainerBridge();
  }
  return bridgeInstance;
}

// Forçar recriação do bridge (útil após mudança de modo)
export function resetRuntimeBridge() {
  bridgeInstance = null;
  currentBridgeMode = null;
}

// Export para uso direto (compatibilidade com código existente)
// Agora com fallback automático entre Local e WebContainer
export const RuntimeService = {
  async boot() {
    const bridge = await getRuntimeBridgeAsync();
    try {
      return await bridge.boot();
    } catch (error: any) {
      // Se falhou no modo local, tentar WebContainer
      if (currentBridgeMode === 'local' && canUseWebContainer()) {
        console.log('⚠️ Local Mode failed, trying WebContainer fallback...');
        setRuntimeMode('webcontainer');
        const wcBridge = await getRuntimeBridgeAsync();
        return await wcBridge.boot();
      }
      throw error;
    }
  },
  
  getInstance() {
    return getRuntimeBridge().getInstance();
  },
  
  async mount(files: VirtualFile[]) {
    const bridge = await getRuntimeBridgeAsync();
    return bridge.mount(files);
  },
  
  async writeFile(path: string, content: string) {
    const bridge = await getRuntimeBridgeAsync();
    return bridge.writeFile(path, content);
  },
  
  async writeFiles(files: VirtualFile[]) {
    const bridge = await getRuntimeBridgeAsync();
    return bridge.writeFiles(files);
  },
  
  async readFile(path: string) {
    const bridge = await getRuntimeBridgeAsync();
    return bridge.readFile(path);
  },
  
  async deleteFile(path: string) {
    const bridge = await getRuntimeBridgeAsync();
    return bridge.deleteFile(path);
  },
  
  async rename(oldPath: string, newPath: string) {
    const bridge = await getRuntimeBridgeAsync();
    return bridge.rename(oldPath, newPath);
  },
  
  async exec(cmd: string, args: string[] = [], timeout = 60000) {
    const bridge = await getRuntimeBridgeAsync();
    return bridge.exec(cmd, args, timeout);
  },
  
  async startShell(callback: (data: string) => void, cols = 80, rows = 24) {
    const bridge = await getRuntimeBridgeAsync();
    return bridge.startShell(callback, cols, rows);
  },
  
  async listDir(path = '.') {
    const bridge = await getRuntimeBridgeAsync();
    return bridge.listDir(path);
  },
  
  async exists(path: string) {
    const bridge = await getRuntimeBridgeAsync();
    return bridge.exists(path);
  },
  
  async spawnBackground(cmd: string, args: string[], onOutput?: (data: string) => void) {
    const bridge = await getRuntimeBridgeAsync();
    return bridge.spawnBackground(cmd, args, onOutput);
  },
  
  async stat(path: string) {
    const bridge = await getRuntimeBridgeAsync();
    return bridge.stat(path);
  },
  
  onServerReady(callback: (port: number, url: string) => void) {
    return getRuntimeBridge().onServerReady?.(callback);
  },
  
  // Novos métodos para controle do modo
  async checkBackend() {
    return checkBackendAvailability();
  },
  
  canUseWebContainer() {
    return canUseWebContainer();
  },
  
  getCurrentMode() {
    return currentBridgeMode;
  },
  
  setMode(mode: 'local' | 'webcontainer' | 'auto') {
    setRuntimeMode(mode);
  }
};
