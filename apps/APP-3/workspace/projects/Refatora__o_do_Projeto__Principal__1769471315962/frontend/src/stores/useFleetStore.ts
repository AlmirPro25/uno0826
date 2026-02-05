
import { create } from 'zustand';
import { Asset, FleetUpdatePayload } from '../../../../shared/types';

interface FleetState {
  assets: Asset[];
  selectedAssetId: string | null;
  isLoading: boolean;
  lastUpdated: Date | null;

  setAssets: (assets: Asset[]) => void;
  updateAssetTelemetry: (update: FleetUpdatePayload) => void;
  selectAsset: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * ZUSTAND STORE: FLEET OPERATIONS
 * Handles real-time state of global assets.
 */
export const useFleetStore = create<FleetState>((set) => ({
  assets: [],
  selectedAssetId: null,
  isLoading: false,
  lastUpdated: null,

  setAssets: (assets) => set({ assets, lastUpdated: new Date() }),

  updateAssetTelemetry: (update) => set((state) => {
    const assetIndex = state.assets.findIndex(a => a.id === update.id);
    if (assetIndex === -1) return state;

    const newAssets = [...state.assets];
    newAssets[assetIndex] = {
      ...newAssets[assetIndex],
      ...update
    };

    return { assets: newAssets, lastUpdated: new Date() };
  }),

  selectAsset: (id) => set({ selectedAssetId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
