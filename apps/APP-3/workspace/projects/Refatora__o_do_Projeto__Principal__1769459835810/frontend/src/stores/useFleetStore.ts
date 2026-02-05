
import { create } from 'zustand';
import { FleetService } from '@/services/api/fleet.service';
import type { Machine } from '../../../../shared/types';

interface FleetState {
  inventory: Machine[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  fetchInventory: (force?: boolean) => Promise<void>;
  getMachineById: (id: number) => Machine | undefined;
}

export const useFleetStore = create<FleetState>((set, get) => ({
  inventory: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  fetchInventory: async (force = false) => {
    // Evita refetch desnecessário se já tiver dados e não for forçado
    if (get().isInitialized && !force && get().inventory.length > 0) return;

    set({ isLoading: true, error: null });
    
    try {
      const data = await FleetService.getAll();
      set({ 
        inventory: data, 
        isLoading: false, 
        isInitialized: true 
      });
    } catch (err: any) {
      // O erro já é tratado no Axios Interceptor, mas salvamos no state local também
      set({ 
        error: "Falha ao carregar o showroom.", 
        isLoading: false 
      });
    }
  },

  getMachineById: (id: number) => {
    return get().inventory.find(m => m.id === id);
  }
}));
