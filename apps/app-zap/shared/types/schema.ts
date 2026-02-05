
/**
 * GHOST PROTOCOL - SHARED SCHEMA
 * Mapeamento direto do Prisma Schema e Contratos de API
 * Verdade Absoluta dos Dados
 */

// Status da Diretiva (Missão)
export type DirectiveStatus = 'IDLE' | 'EXECUTING' | 'COMPLETED';

// Perfil do Contato (Contact Model)
export interface Contact {
  id: string;              // Serialized ID (e.g., 551199999999@c.us)
  name: string | null;
  pushName: string | null;
  profilePicUrl: string | null;
  
  // Estado Operacional
  isPaused: boolean;
  lastInteraction: string; // ISO Date String
  
  // Perfil Semântico
  semanticProfile: string | null;
  avgResponseTime: number; // Segundos
  
  // Míssil Teleguiado
  activeDirective: string | null;
  directiveStatus: DirectiveStatus;
}

// Mensagem (Message Model)
export interface Message {
  id: string;
  contactId: string;
  fromMe: boolean;
  body: string;
  timestamp: string; // ISO Date String
  sentimentScore?: number | null;
}

// Logs do Sistema (SystemLog Model)
export interface SystemLog {
  id: string;
  contactId?: string | null;
  level: 'INFO' | 'WARN' | 'ERROR' | 'ACTION';
  event: string;
  details: string; // JSON String
  createdAt: string; // ISO Date String
}

// Payloads de API (Requests)
export interface ControlPayload {
  action: 'PAUSE' | 'RESUME';
}

export interface DirectivePayload {
  instruction: string;
}

// Respostas de API (Responses)
export interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp: string;
    status: number;
  };
}
