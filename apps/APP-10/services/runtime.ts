/**
 * 🔄 Runtime Abstraction Layer
 * Permite alternar entre WebContainer e Local Runtime
 */

import { VirtualFile } from '../types';

// Configuração do runtime
export type RuntimeMode = 'webcontainer' | 'local';

// Detectar modo baseado em variável de ambiente ou configuração
const RUNTIME_MODE: RuntimeMode = 
  (typeof window !== 'undefined' && (window as any).__AETHER_LOCAL_MODE__) 
    ? 'local' 
    : 'webcontainer';

// Interface comum para ambos os runtimes
export interface RuntimeService {
  boot(): Promise<void>;
  isBooted(): boolean;
  mount(files: VirtualFile[]): Promise<void>;
  writeFile(path: string, content: string): Promise<void>;
  writeFiles(files: VirtualFile[]): Promise<void>;
  readFile(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  listDir(path?: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
  exec(cmd: string, args?: string[], timeout?: number): Promise<{ output: string; exitCode: number }>;
  startShell(
    callback: (data: string) => void,
    cols?: number,
    rows?: number
  ): Promise<{ inputWriter: { write: (data: string) => Promise<void> } }>;
  getPreviewUrl(): string | null;
  onServerReady(callback: (url: string) => void): void;
}

// Implementação que delega para o runtime correto
class RuntimeProxy implements RuntimeService {
  private service: any = null;
  private mode: RuntimeMode = RUNTIME_MODE;
  private booted = false;
  private previewUrl: string | null = null;
  private serverReadyCallback: ((url: string) => void) | null = null;

  async boot(): Promise<void> {
    if (this.booted) return;

    if (this.mode === 'local') {
      const { LocalRuntimeService } = await import('./localRuntime');
      this.service = LocalRuntimeService;
      await LocalRuntimeService.connect();
      
      // Verificar se já tem servidor rodando
      const status = await LocalRuntimeService.getServerStatus();
      if (status.running && status.url) {
        this.previewUrl = status.url;
        this.serverReadyCallback?.(status.url);
      }
    } else {
      const { WebContainerService } = await import('./webcontainer');
      this.service = WebContainerService;
      const wc = await WebContainerService.boot();
      
      // Listener para server-ready
      wc.on('server-ready', (port: number, url: string) => {
        this.previewUrl = url;
        this.serverReadyCallback?.(url);
      });
    }

    this.booted = true;
  }

  isBooted(): boolean {
    return this.booted;
  }

  async mount(files: VirtualFile[]): Promise<void> {
    if (!this.service) throw new Error('Runtime not booted');
    await this.service.mount(files);
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.service) return;
    await this.service.writeFile(path, content);
  }

  async writeFiles(files: VirtualFile[]): Promise<void> {
    if (!this.service) return;
    await this.service.writeFiles(files);
  }

  async readFile(path: string): Promise<string> {
    if (!this.service) throw new Error('Runtime not booted');
    return this.service.readFile(path);
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.service) return;
    await this.service.deleteFile(path);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    if (!this.service) return;
    await this.service.rename(oldPath, newPath);
  }

  async listDir(path: string = '.'): Promise<string[]> {
    if (!this.service) return [];
    return this.service.listDir(path);
  }

  async exists(path: string): Promise<boolean> {
    if (!this.service) return false;
    return this.service.exists(path);
  }

  async exec(cmd: string, args: string[] = [], timeout: number = 60000): Promise<{ output: string; exitCode: number }> {
    if (!this.service) throw new Error('Runtime not booted');
    return this.service.exec(cmd, args, timeout);
  }

  async startShell(
    callback: (data: string) => void,
    cols: number = 80,
    rows: number = 24
  ): Promise<{ inputWriter: { write: (data: string) => Promise<void> } }> {
    if (!this.service) throw new Error('Runtime not booted');
    return this.service.startShell(callback, cols, rows);
  }

  getPreviewUrl(): string | null {
    return this.previewUrl;
  }

  onServerReady(callback: (url: string) => void): void {
    this.serverReadyCallback = callback;
  }

  // Métodos específicos do Local Runtime
  async startDevServer(command?: string, port?: number): Promise<string> {
    if (this.mode !== 'local') {
      throw new Error('startDevServer only available in local mode');
    }
    const { LocalRuntimeService } = await import('./localRuntime');
    const url = await LocalRuntimeService.startDevServer(command, port);
    this.previewUrl = url;
    this.serverReadyCallback?.(url);
    return url;
  }

  async stopDevServer(): Promise<void> {
    if (this.mode !== 'local') return;
    const { LocalRuntimeService } = await import('./localRuntime');
    await LocalRuntimeService.stopDevServer();
    this.previewUrl = null;
  }

  getMode(): RuntimeMode {
    return this.mode;
  }

  setMode(mode: RuntimeMode): void {
    if (this.booted) {
      throw new Error('Cannot change mode after boot');
    }
    this.mode = mode;
  }
}

// Singleton
export const Runtime = new RuntimeProxy();

// Helper para verificar modo
export const isLocalMode = () => Runtime.getMode() === 'local';
export const isWebContainerMode = () => Runtime.getMode() === 'webcontainer';
