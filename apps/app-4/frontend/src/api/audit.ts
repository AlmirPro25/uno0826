import { axiosInstance as api } from './axios';

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

// Get all audit logs with optional filters (Admin only)
export const getAuditLogs = async (params?: {
  limit?: number;
  offset?: number;
  userId?: number;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AuditLogsResponse> => {
  const response = await api.get('/audit/logs', { params });
  return response.data;
};

// Get audit logs for a specific user (Admin only)
export const getUserActivityLogs = async (
  userId: number,
  limit?: number,
  offset?: number
): Promise<AuditLogsResponse> => {
  const response = await api.get(`/audit/logs/user/${userId}`, {
    params: { limit, offset }
  });
  return response.data;
};

// Get audit logs for a specific entity (Admin only)
export const getEntityAuditLogs = async (
  entityType: string,
  entityId: number
): Promise<AuditLog[]> => {
  const response = await api.get(`/audit/logs/entity/${entityType}/${entityId}`);
  return response.data;
};

// Get my activity logs
export const getMyActivityLogs = async (
  limit?: number,
  offset?: number
): Promise<AuditLogsResponse> => {
  const response = await api.get('/audit/my-activity', {
    params: { limit, offset }
  });
  return response.data;
};

// Action labels in Portuguese
export const actionLabels: Record<string, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  LOGIN_FAILED: 'Login Falhou',
  PASSWORD_RESET: 'Reset de Senha',
  PASSWORD_CHANGE: 'Alteração de Senha',
  USER_CREATE: 'Usuário Criado',
  USER_UPDATE: 'Usuário Atualizado',
  USER_DELETE: 'Usuário Excluído',
  APPOINTMENT_BOOK: 'Consulta Agendada',
  APPOINTMENT_CANCEL: 'Consulta Cancelada',
  APPOINTMENT_COMPLETE: 'Consulta Finalizada',
  APPOINTMENT_VIEW: 'Consulta Visualizada',
  RECORD_CREATE: 'Prontuário Criado',
  RECORD_VIEW: 'Prontuário Visualizado',
  RECORD_UPDATE: 'Prontuário Atualizado',
  RECORD_DELETE: 'Prontuário Excluído',
  PRESCRIPTION_CREATE: 'Receita Criada',
  PRESCRIPTION_VIEW: 'Receita Visualizada',
  PRESCRIPTION_UPDATE: 'Receita Atualizada',
  PRESCRIPTION_DELETE: 'Receita Excluída',
  CERTIFICATE_CREATE: 'Atestado Criado',
  CERTIFICATE_VIEW: 'Atestado Visualizado',
  CERTIFICATE_DELETE: 'Atestado Excluído',
  VIDEO_CALL_START: 'Videochamada Iniciada',
  VIDEO_CALL_END: 'Videochamada Encerrada',
  PAYMENT_CREATE: 'Pagamento Criado',
  PAYMENT_UPDATE: 'Pagamento Atualizado',
};

// Get label for an action
export const getActionLabel = (action: string): string => {
  return actionLabels[action] || action;
};

// Entity type labels
export const entityTypeLabels: Record<string, string> = {
  user: 'Usuário',
  appointment: 'Consulta',
  medical_record: 'Prontuário',
  prescription: 'Receita',
  certificate: 'Atestado',
  payment: 'Pagamento',
  review: 'Avaliação',
};

// Get label for entity type
export const getEntityTypeLabel = (entityType: string): string => {
  return entityTypeLabels[entityType] || entityType;
};
