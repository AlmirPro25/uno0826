import { apiClient } from '@/lib/axios';
import { SystemLog } from 'shared/types/schema';
import { api } from '@/lib/api'; // Use authenticated api client

/**
 * SERVIÇOS DE DOMÍNIO: SISTEMA
 * Auditoria e status do Kernel.
 */

export const systemApi = {
  // Obter logs recentes do sistema (Debugging / Auditoria)
  getLogs: async (limit: number = 50): Promise<SystemLog[]> => {
    const { data } = await api.get<SystemLog[]>('/system/logs', { // Updated path
      params: { limit }
    });
    return data;
  },

  // Verificar saúde do sistema
  getHealth: async (): Promise<{ status: string; uptime: number }> => {
    const { data } = await api.get('/system/health'); // Updated path
    return data;
  }
};
