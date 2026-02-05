
import { create } from 'zustand';
import { Asset, SystemStatus, WSPayload } from '../../../../shared/types';
import { assetService } from '@/services/api/asset.service';
import { systemService } from '@/services/api/system.service';

interface TelemetryState {
  // State Data
  assets: Asset[];
  systemStatus: SystemStatus | null;
  selectedAssetId: string | null;
  isLoading: boolean;
  isSocketConnected: boolean;
  
  // Computed / Derived
  getSelectedAsset: () => Asset | undefined;

  // Actions
  setSocketStatus: (status: boolean) => void;
  processSocketMessage: (msg: WSPayload) => void;
  
  // Async Actions
  initialScan: () => Promise<void>;
  selectAsset: (id: string | null) => void;
  executeLockdown: (id: string) => Promise<void>;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  assets: [],
  systemStatus: null,
  selectedAssetId: null,
  isLoading: false,
  isSocketConnected: false,

  getSelectedAsset: () => {
    const { assets, selectedAssetId } = get();
    return assets.find(a => a.id === selectedAssetId);
  },

  setSocketStatus: (status) => set({ isSocketConnected: status }),

  processSocketMessage: (msg) => {
    const { type, payload } = msg;

    if (type === 'TELEMETRY_UPDATE') {
      // Merge strategy: Update existing assets, add new ones
      set(state => {
        const updatedAssets = [...state.assets];
        const incomingAssets = payload as Asset[];

        incomingAssets.forEach(incoming => {
          const index = updatedAssets.findIndex(a => a.id === incoming.id);
          if (index !== -1) {
            // Update existing (preserve local optimizations if needed)
            updatedAssets[index] = { ...updatedAssets[index], ...incoming };
          } else {
            // New asset detected
            updatedAssets.push(incoming);
          }
        });
        return { assets: updatedAssets };
      });
    }

    if (type === 'SYSTEM_STATUS') {
      set({ systemStatus: payload as SystemStatus });
    }
  },

  initialScan: async () => {
    set({ isLoading: true });
    try {
      const [assets, status] = await Promise.all([
        assetService.getAllAssets(),
        systemService.getStatus()
      ]);
      set({ assets, systemStatus: status });
    } catch (error) {
      console.error('[RADAR FAILURE] Could not complete initial scan sequence.');
    } finally {
      set({ isLoading: false });
    }
  },

  selectAsset: (id) => {
    set({ selectedAssetId: id });
    if (id) {
       // Optional: Fetch detailed logs/manifests immediately upon selection
       // This could be expanded based on operational requirements
    }
  },

  executeLockdown: async (id) => {
    try {
      // Optimistic Update
      set(state => ({
        assets: state.assets.map(a => 
          a.id === id ? { ...a, status: 'LOCKED_DOWN', isLocked: true } : a
        )
      }));

      // Execute Command
      await assetService.initiateLockdown(id);
      
      // Refresh strictly to ensure server state matches
      const updatedAsset = await assetService.getAssetById(id);
      set(state => ({
        assets: state.assets.map(a => a.id === id ? updatedAsset : a)
      }));

    } catch (error) {
      console.error('[LOCKDOWN FAILED] Command rejected by remote unit.');
      // Revert Optimistic Update
      const originalAsset = await assetService.getAssetById(id);
      set(state => ({
        assets: state.assets.map(a => a.id === id ? originalAsset : a)
      }));
      throw error;
    }
  }
}));
