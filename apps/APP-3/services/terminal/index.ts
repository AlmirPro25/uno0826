/**
 * ============================================
 * 🖥️ TERMINAL SERVICES INDEX
 * ============================================
 * 
 * Exporta todos os serviços de terminal
 */

// Agente unificado
export { 
  KiroUnifiedAgent,
  kiroUnifiedAgent,
  useKiroAgent,
  UNIFIED_TOOLS
} from '../KiroUnifiedAgent';

// Cliente WebSocket
export {
  TerminalWebSocketClient,
  terminalWSClient,
  useTerminalWebSocket
} from '../TerminalWebSocketClient';

// Serviços legados (compatibilidade)
export { KiroAgentService, kiroAgent } from '../KiroAgentService';
export { KiroToolExecutor, kiroToolExecutor, KIRO_TOOLS } from '../KiroToolExecutor';

// Tipos
export type {
  AgentTool,
  ToolExecution,
  AgentMessage,
  AgentSession,
  AgentContext,
  ProcessInfo,
  StreamEvent
} from '../KiroUnifiedAgent';

export type {
  WSMessage,
  WSResponse,
  TerminalClientOptions
} from '../TerminalWebSocketClient';
