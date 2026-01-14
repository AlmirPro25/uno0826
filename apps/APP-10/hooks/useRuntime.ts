/**
 * 🔌 useRuntime Hook
 * Hook para gerenciar o runtime (WebContainer ou Local)
 */

import { useState, useCallback, useEffect } from 'react';
import { VirtualFile } from '../types';

// Detectar modo no cliente
const isLocalMode = typeof window !== 'undefined' && (window as any).__AETHER_LOCAL_MODE__ === true;

export interface RuntimeState {
  isBooted: boolean;
  isBooting: boolean;
  error: string | null;
  previewUrl: string | null;
  mode: 'webcontainer' | 'local';
}

export function useRuntime() {
  const [state, setState] = useState<RuntimeState>({
    isBooted: false,
    isBooting: false,
    error: null,
    previewUrl: null,
    mode: isLocalMode ? 'local' : 'webcontainer'
  });

  const [service, setService] = useState<any>(null);

  // Boot do runtime
  const boot = useCallback(async () => {
    if (state.isBooted || state.isBooting) return;

    setState(s => ({ ...s, isBooting: true, error: null }));

    try {
      if (isLocalMode) {
        const { LocalRuntimeService } = await import('../services/localRuntime');
        await LocalRuntimeService.connect();
        
        // Verificar servidor existente
        const status = await LocalRuntimeService.getServerStatus();
        
        setService(LocalRuntimeService);
        setState(s => ({
          ...s,
          isBooted: true,
          isBooting: false,
          previewUrl: status.url
        }));
      } else {
        const { WebContainerService } = await import('../services/webcontainer');
        const wc = await WebContainerService.boot();
        
        wc.on('server-ready', (port: number, url: string) => {
          setState(s => ({ ...s, previewUrl: url }));
        });
        
        setService(WebContainerService);
        setState(s => ({ ...s, isBooted: true, isBooting: false }));
      }
    } catch (e: any) {
      setState(s => ({
        ...s,
        isBooting: false,
        error: e.message
      }));
    }
  }, [state.isBooted, state.isBooting]);

  // Mount files
  const mount = useCallback(async (files: VirtualFile[]) => {
    if (!service) return;
    await service.mount(files);
  }, [service]);

  // Write file
  const writeFile = useCallback(async (path: string, content: string) => {
    if (!service) return;
    await service.writeFile(path, content);
  }, [service]);

  // Write multiple files
  const writeFiles = useCallback(async (files: VirtualFile[]) => {
    if (!service) return;
    await service.writeFiles(files);
  }, [service]);

  // Read file
  const readFile = useCallback(async (path: string): Promise<string> => {
    if (!service) throw new Error('Runtime not booted');
    return service.readFile(path);
  }, [service]);

  // Delete file
  const deleteFile = useCallback(async (path: string) => {
    if (!service) return;
    await service.deleteFile(path);
  }, [service]);

  // Rename
  const rename = useCallback(async (oldPath: string, newPath: string) => {
    if (!service) return;
    await service.rename(oldPath, newPath);
  }, [service]);

  // Execute command
  const exec = useCallback(async (cmd: string, args: string[] = [], timeout = 60000) => {
    if (!service) throw new Error('Runtime not booted');
    return service.exec(cmd, args, timeout);
  }, [service]);

  // Start shell
  const startShell = useCallback(async (
    callback: (data: string) => void,
    cols = 80,
    rows = 24
  ) => {
    if (!service) throw new Error('Runtime not booted');
    return service.startShell(callback, cols, rows);
  }, [service]);

  // Start dev server (local mode only)
  const startDevServer = useCallback(async (command = 'npm run dev', port = 5173) => {
    if (!isLocalMode) {
      throw new Error('startDevServer only available in local mode');
    }
    const { LocalRuntimeService } = await import('../services/localRuntime');
    const url = await LocalRuntimeService.startDevServer(command, port);
    setState(s => ({ ...s, previewUrl: url }));
    return url;
  }, []);

  // Stop dev server (local mode only)
  const stopDevServer = useCallback(async () => {
    if (!isLocalMode) return;
    const { LocalRuntimeService } = await import('../services/localRuntime');
    await LocalRuntimeService.stopDevServer();
    setState(s => ({ ...s, previewUrl: null }));
  }, []);

  return {
    ...state,
    service,
    isLocalMode,
    boot,
    mount,
    writeFile,
    writeFiles,
    readFile,
    deleteFile,
    rename,
    exec,
    startShell,
    startDevServer,
    stopDevServer
  };
}
