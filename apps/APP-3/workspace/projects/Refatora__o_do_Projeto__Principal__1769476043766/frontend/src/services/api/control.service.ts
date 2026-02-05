
import api from '@/lib/axios';
import { ModulationRequest } from '../../../../shared/types';

// EXECUTIVE COMMAND INTERFACE
export const ControlService = {
  
  // Modulate environmental parameters (e.g., O2 Scrubbers, Pressure Valves)
  modulateSystem: async (payload: ModulationRequest): Promise<void> => {
    await api.post('/controls/modulate', payload);
  },

  // TRIGGER OMEGA PROTOCOL
  activateFailSafe: async (): Promise<void> => {
    await api.post('/controls/emergency/fail-safe', {
      confirmation_code: 'OMEGA-RED-seq-99',
      timestamp: new Date().toISOString()
    });
  },

  // Reset a specific subsystem
  rebootSubsystem: async (systemId: string): Promise<void> => {
    await api.post(`/controls/reboot/${systemId}`);
  }
};
