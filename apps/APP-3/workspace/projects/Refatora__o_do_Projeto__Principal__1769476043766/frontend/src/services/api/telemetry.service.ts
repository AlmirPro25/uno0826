
import api from '@/lib/axios';
import { TelemetryFrame, SystemLog } from '../../../../shared/types';

// SENSOR ARRAY INTERFACE
export const TelemetryService = {
  
  // Fetch latest snapshot of the biosphere
  getLatestFrame: async (): Promise<TelemetryFrame> => {
    const { data } = await api.get<TelemetryFrame>('/telemetry/latest');
    return data;
  },

  // Fetch historical data for trend analysis (future charts)
  getHistory: async (limit: number = 50): Promise<TelemetryFrame[]> => {
    const { data } = await api.get<TelemetryFrame[]>(`/telemetry/history?limit=${limit}`);
    return data;
  },

  // Retrieve audit logs from the black box
  getLogs: async (severity?: string): Promise<SystemLog[]> => {
    const params = severity ? { severity } : {};
    const { data } = await api.get<SystemLog[]>('/logs', { params });
    return data;
  }
};
