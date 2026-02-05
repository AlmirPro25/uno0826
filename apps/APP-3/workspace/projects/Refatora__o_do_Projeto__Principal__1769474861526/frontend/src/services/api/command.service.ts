
import { apiClient } from '@/lib/axios';
import type { 
  SitRep, 
  FabricatePayload, 
  DeployPayload, 
  TacticalUnit,
  Operation,
  LoginPayload,
  RegisterPayload,
  User
} from '../../../../shared/types/schema';

/**
 * COMMAND SERVICE LAYER
 * Direct interface with the Tactical Kernel (Backend).
 */
export const CommandService = {
  
  // AUTHENTICATION
  login: async (payload: LoginPayload): Promise<{ token: string, user: User }> => {
    const { data } = await apiClient.post<{ token: string, user: User }>('/auth/login', payload);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<{ token: string, user: User }> => {
    const { data } = await apiClient.post<{ token: string, user: User }>('/auth/register', payload);
    return data;
  },

  // TACTICAL COMMANDS (Protected)
  getSitRep: async (): Promise<SitRep> => {
    const { data } = await apiClient.get<SitRep>('/status');
    return data;
  },

  fabricateUnit: async (payload: FabricatePayload): Promise<TacticalUnit> => {
    const { data } = await apiClient.post<TacticalUnit>('/fabricate', payload);
    return data;
  },

  deployUnit: async (payload: DeployPayload): Promise<Operation> => {
    const { data } = await apiClient.post<Operation>('/deploy', payload);
    return data;
  },

  purgeSystem: async (): Promise<void> => {
    await apiClient.post('/purge');
  }
};
