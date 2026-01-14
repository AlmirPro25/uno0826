/**
 * ============================================
 * 👁️ FILE WATCHER - MONITORAMENTO EM TEMPO REAL
 * ============================================
 * 
 * Monitora mudanças no sistema de arquivos e
 * notifica clientes via WebSocket.
 */

import { watch, FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import path from 'path';

// ============================================
// TIPOS
// ============================================

interface FileEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  relativePath: string;
  timestamp: number;
}

interface WatcherOptions {
  ignored?: string[];
  persistent?: boolean;
  ignoreInitial?: boolean;
  depth?: number;
}

// ============================================
// FILE WATCHER SERVICE
// ============================================

export class FileWatcherService extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private workspaceRoot: string;
  private isWatching: boolean = false;
  private eventBuffer: FileEvent[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;
  private debounceMs: number = 100;

  constructor(workspaceRoot: string = process.cwd()) {
    super();
    this.workspaceRoot = path.resolve(workspaceRoot, '..');
  }

  /**
   * Inicia o monitoramento
   */
  start(options: WatcherOptions = {}) {
    if (this.isWatching) {
      console.log('👁️ FileWatcher já está rodando');
      return this;
    }

    const defaultIgnored = [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/*.log',
      '**/coverage/**',
      '**/.next/**',
      '**/.nuxt/**',
      '**/venv/**',
      '**/__pycache__/**'
    ];

    this.watcher = watch(this.workspaceRoot, {
      ignored: [...defaultIgnored, ...(options.ignored || [])],
      persistent: options.persistent ?? true,
      ignoreInitial: options.ignoreInitial ?? true,
      depth: options.depth ?? 10,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    // Handlers de eventos
    this.watcher
      .on('add', (filePath) => this.handleEvent('add', filePath))
      .on('change', (filePath) => this.handleEvent('change', filePath))
      .on('unlink', (filePath) => this.handleEvent('unlink', filePath))
      .on('addDir', (dirPath) => this.handleEvent('addDir', dirPath))
      .on('unlinkDir', (dirPath) => this.handleEvent('unlinkDir', dirPath))
      .on('error', (error) => this.emit('error', error))
      .on('ready', () => {
        this.isWatching = true;
        console.log('👁️ FileWatcher iniciado');
        this.emit('ready');
      });

    return this;
  }

  /**
   * Processa evento de arquivo
   */
  private handleEvent(type: FileEvent['type'], filePath: string) {
    const relativePath = path.relative(this.workspaceRoot, filePath);
    
    const event: FileEvent = {
      type,
      path: filePath,
      relativePath,
      timestamp: Date.now()
    };

    // Adiciona ao buffer para debounce
    this.eventBuffer.push(event);

    // Debounce para evitar flood de eventos
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flushEvents();
    }, this.debounceMs);
  }

  /**
   * Envia eventos acumulados
   */
  private flushEvents() {
    if (this.eventBuffer.length === 0) return;

    // Agrupa eventos por tipo
    const grouped = this.eventBuffer.reduce((acc, event) => {
      if (!acc[event.type]) acc[event.type] = [];
      acc[event.type].push(event);
      return acc;
    }, {} as Record<string, FileEvent[]>);

    // Emite eventos agrupados
    this.emit('changes', {
      events: this.eventBuffer,
      grouped,
      count: this.eventBuffer.length,
      timestamp: Date.now()
    });

    // Emite eventos individuais por tipo
    Object.entries(grouped).forEach(([type, events]) => {
      this.emit(type, events);
    });

    // Limpa buffer
    this.eventBuffer = [];
  }

  /**
   * Para o monitoramento
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.isWatching = false;
    console.log('👁️ FileWatcher parado');
  }

  /**
   * Adiciona path ao monitoramento
   */
  addPath(filePath: string) {
    if (this.watcher) {
      this.watcher.add(filePath);
    }
  }

  /**
   * Remove path do monitoramento
   */
  removePath(filePath: string) {
    if (this.watcher) {
      this.watcher.unwatch(filePath);
    }
  }

  /**
   * Obtém status
   */
  getStatus() {
    return {
      isWatching: this.isWatching,
      workspaceRoot: this.workspaceRoot,
      bufferedEvents: this.eventBuffer.length
    };
  }
}

// Instância singleton
export const fileWatcher = new FileWatcherService();
