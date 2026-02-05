// Tipos auxiliares que não estão no Prisma mas são usados na lógica
export interface WebSocketEvent {
  type: 'QR_CODE' | 'READY' | 'MESSAGE_NEW' | 'PRESENCE_UPDATE' | 'AGENT_TYPING' | 'LOG_ENTRY' | 'CONTACT_UPDATE';
  payload: any;
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: string;
}

// Define DirectiveStatus manually since it's a String in SQLite schema
export const DirectiveStatus = {
  IDLE: 'IDLE',
  EXECUTING: 'EXECUTING',
  COMPLETED: 'COMPLETED'
} as const;

export type DirectiveStatus = typeof DirectiveStatus[keyof typeof DirectiveStatus];

// Extend Request for authentication
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
