
import { uplink } from '@/lib/axios';
import { SystemStatus } from '../../../../shared/types';

/**
 * SYSTEM DIAGNOSTICS MODULE
 * Monitoramento da saúde do servidor e nível de ameaça global.
 */
export const systemService = {
  
  async getStatus(): Promise<SystemStatus> {
    const response = await uplink.get<SystemStatus>('/system/status');
    return response.data;
  },

  async ping(): Promise<number> {
    const start = performance.now();
    await uplink.get('/health');
    return performance.now() - start;
  }
};
