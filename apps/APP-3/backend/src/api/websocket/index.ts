/**
 * ============================================
 * 🔌 WEBSOCKET INDEX - INICIALIZAÇÃO
 * ============================================
 * 
 * Ponto de entrada para todos os serviços WebSocket
 */

import { Server } from 'http';
import { terminalWS, TerminalWebSocketServer } from './TerminalWebSocket';
import { fileWatcher, FileWatcherService } from './FileWatcher';

export interface WebSocketServices {
  terminal: TerminalWebSocketServer;
  fileWatcher: FileWatcherService;
}

/**
 * Inicializa todos os serviços WebSocket
 */
export function initializeWebSockets(server: Server): WebSocketServices {
  console.log('🔌 Inicializando serviços WebSocket...');

  // Terminal WebSocket
  terminalWS.initialize(server, '/ws/terminal');

  // File Watcher
  fileWatcher.start();

  // Conecta File Watcher ao Terminal WS para broadcast
  fileWatcher.on('changes', (data) => {
    terminalWS.broadcast('fileChanges', data);
  });

  console.log('✅ Serviços WebSocket inicializados');

  return {
    terminal: terminalWS,
    fileWatcher
  };
}

/**
 * Encerra todos os serviços WebSocket
 */
export function shutdownWebSockets() {
  console.log('🔌 Encerrando serviços WebSocket...');
  terminalWS.shutdown();
  fileWatcher.stop();
}

export { terminalWS, fileWatcher };
