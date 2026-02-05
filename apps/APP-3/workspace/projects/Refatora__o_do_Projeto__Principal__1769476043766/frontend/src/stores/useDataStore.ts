
import { create } from 'zustand';
import { TelemetryFrame, SystemLog } from '../../../../shared/types';
import { TelemetryService } from '@/services/api/telemetry.service';
import { ControlService } from '@/services/api/control.service';

interface DataState {
  // State
  telemetry: TelemetryFrame | null;
  logs: SystemLog[];
  isSyncing: boolean;
  lastSync: Date | null;
  connectionStatus: 'OPTIMAL' | 'DEGRADED' | 'OFFLINE';

  // Actions
  fetchData: () => Promise<void>;
  modulate: (target: string, value: number) => Promise<void>;
  triggerFailSafe: () => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  telemetry: null,
  logs: [],
  isSyncing: false,
  lastSync: null,
  connectionStatus: 'OPTIMAL',

  fetchData: async () => {
    // Avoid overlapping syncs
    if (get().isSyncing) return;
    
    set({ isSyncing: true });
    
    try {
      // Parallel execution for network efficiency
      const [telemetryData, logsData] = await Promise.all([
        TelemetryService.getLatestFrame(),
        TelemetryService.getLogs()
      ]);

      set({ 
        telemetry: telemetryData, 
        logs: logsData,
        lastSync: new Date(),
        connectionStatus: 'OPTIMAL',
        isSyncing: false
      });
    } catch (error) {
      console.error("DATA UPLINK FAILURE");
      set({ 
        connectionStatus: 'OFFLINE',
        isSyncing: false 
      });
    }
  },

  modulate: async (target: string, value: number) => {
    try {
      // Optimistic Update: Could implement here if UI needs instant feedback
      await ControlService.modulateSystem({
        target_system: target,
        value: value,
        authorization_hash: 'OVERRIDE-AUTH-KEY-GEN-7' // In real app, derived from auth token
      });
      // Refresh data immediately after modulation
      await get().fetchData();
    } catch (error) {
      console.error("MODULATION REJECTED BY KERNEL");
      throw error;
    }
  },

  triggerFailSafe: async () => {
    try {
      await ControlService.activateFailSafe();
      // Force refresh to show critical status
      await get().fetchData();
    } catch (error) {
      console.error("FAIL-SAFE MECHANISM JAMMED");
    }
  }
}));
