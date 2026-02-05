
import { create } from 'zustand';
import api from '@/lib/api';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('sentinel_token'),
  isAuthenticated: !!localStorage.getItem('sentinel_token'),
  
  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('sentinel_token', data.accessToken);
    set({ token: data.accessToken, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('sentinel_token');
    set({ token: null, isAuthenticated: false });
  }
}));
