
import { create } from 'zustand';

interface UIState {
  // Estado de Notificações (Toast)
  notification: {
    type: 'success' | 'error' | 'info' | null;
    message: string | null;
    visible: boolean;
  };
  
  // Ações
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  notification: {
    type: null,
    message: null,
    visible: false,
  },

  showSuccess: (message) => set({
    notification: { type: 'success', message, visible: true }
  }),

  showError: (message) => set({
    notification: { type: 'error', message, visible: true }
  }),

  clearNotification: () => set({
    notification: { type: null, message: null, visible: false }
  })
}));
