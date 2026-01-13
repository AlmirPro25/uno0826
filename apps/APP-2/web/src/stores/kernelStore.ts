import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface KernelUser {
  id: string;
  email: string;
  name: string;
}

interface PlanLimits {
  max_peers: number;
  max_file_size_mb: number;
  max_communities: number;
  history_days: number;
  video_calls: boolean;
  priority_relay: boolean;
}

interface KernelState {
  // Status
  enabled: boolean;
  linked: boolean;
  kernelUrl: string;
  
  // User
  user: KernelUser | null;
  
  // Limits
  limits: PlanLimits;
  
  // Actions
  setEnabled: (enabled: boolean) => void;
  setLinked: (linked: boolean) => void;
  setKernelUrl: (url: string) => void;
  setUser: (user: KernelUser | null) => void;
  setLimits: (limits: PlanLimits) => void;
  reset: () => void;
}

const defaultLimits: PlanLimits = {
  max_peers: 10,
  max_file_size_mb: 50,
  max_communities: 3,
  history_days: 7,
  video_calls: false,
  priority_relay: false,
};

export const useKernelStore = create<KernelState>()(
  persist(
    (set) => ({
      enabled: false,
      linked: false,
      kernelUrl: 'https://uno0826-pr57.vercel.app',
      user: null,
      limits: defaultLimits,
      
      setEnabled: (enabled) => set({ enabled }),
      setLinked: (linked) => set({ linked }),
      setKernelUrl: (kernelUrl) => set({ kernelUrl }),
      setUser: (user) => set({ user }),
      setLimits: (limits) => set({ limits }),
      reset: () => set({
        enabled: false,
        linked: false,
        user: null,
        limits: defaultLimits,
      }),
    }),
    {
      name: 'nexus-kernel-storage',
    }
  )
);
