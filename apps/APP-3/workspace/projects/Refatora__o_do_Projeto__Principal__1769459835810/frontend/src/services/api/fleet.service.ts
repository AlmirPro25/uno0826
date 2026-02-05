
import apiClient from '@/lib/axios';
import type { Machine, APIResponse } from '../../../../shared/types'; // Importando do shared simulado

export const FleetService = {
  /**
   * Recupera o inventário completo de máquinas disponíveis.
   */
  getAll: async (): Promise<Machine[]> => {
    const response = await apiClient.get<Machine[]>('/fleet');
    return response.data;
  },

  /**
   * Busca detalhes de uma máquina específica por ID.
   */
  getById: async (id: number): Promise<Machine> => {
    const response = await apiClient.get<Machine>(`/fleet/${id}`);
    return response.data;
  },

  /**
   * (Admin) Atualiza o status de uma máquina.
   */
  updateStatus: async (id: number, status: Machine['status']): Promise<void> => {
    await apiClient.patch(`/fleet/${id}/status`, { status });
  }
};
