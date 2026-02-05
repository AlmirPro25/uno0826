
import { create } from 'zustand';
import { Asset, SystemStatus } from '@/types';
import api from '@/lib/api';

interface TelemetryState {
  assets: Asset[];
  systemStatus: SystemStatus | null;
  selectedAsset: Asset | null;
  
  // Actions
  connect: () => void;
  fetchAssets: () => Promise<void>;
  fetchSystemStatus: () => Promise<void>;
  selectAsset: (assetId: string) => void;
  updateAsset: (updated: Asset) => void;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  assets: [],
  systemStatus: null,
  selectedAsset: null,

  connect: () => {
    // WebSocket Connection Logic
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    // Assume porta 3000 para dev se estiver rodando localmente, mas usa proxy do vite
    const wsUrl = `ws://${host}:3000/telemetry`; 
    
    console.log(`[SENTINEL UPLINK] CONNECTING TO ${wsUrl}`);
    
    const socket = new WebSocket('ws://localhost:3000/telemetry');

    socket.onopen = () => console.log('[SENTINEL UPLINK] SECURE.');
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'TELEMETRY_UPDATE') {
        const updatedAssets = data.payload as Asset[];
        set((state) => {
          // Update list
          const currentSelected = state.selectedAsset;
          let newSelected = currentSelected;
          
          if (currentSelected) {
             const found = updatedAssets.find(a => a.id === currentSelected.id);
             if (found) newSelected = found;
          }

          return { assets: updatedAssets, selectedAsset: newSelected };
        });
      }
    };
  },

  fetchAssets: async () => {
    try {
      const { data } = await api.get('/assets');
      set({ assets: data });
    } catch (e) { console.error("RADAR MALFUNCTION"); }
  },

  fetchSystemStatus: async () => {
    try {
      const { data } = await api.get('/system/status');
      set({ systemStatus: data });
    } catch (e) { console.error("SYSTEM STATUS UNAVAILABLE"); }
  },

  selectAsset: (id) => {
    const asset = get().assets.find(a => a.id === id) || null;
    set({ selectedAsset: asset });
  },

  updateAsset: (updated) => {
    set((state) => ({
      assets: state.assets.map(a => a.id === updated.id ? updated : a),
      selectedAsset: state.selectedAsset?.id === updated.id ? updated : state.selectedAsset
    }));
  }
}));
