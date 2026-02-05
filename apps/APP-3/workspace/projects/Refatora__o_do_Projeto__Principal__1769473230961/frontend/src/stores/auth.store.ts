
import { create } from 'zustand';
import { LoginCredentials } from '../../../../shared/types';
import { authService } from '@/services/api/auth.service';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: { username: string; role: string } | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  user: null,

  initialize: () => {
    const token = localStorage.getItem('sentinel_token');
    if (token) {
      set({ token, isAuthenticated: true });
      // In a real app, we would decode the JWT here to get user info immediately
    }
  },

  login: async (credentials) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('sentinel_token', response.accessToken);
      set({ 
        token: response.accessToken, 
        isAuthenticated: true,
        user: response.user 
      });
    } catch (error) {
      console.error('[AUTH FAILURE] Invalid Credentials');
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ token: null, isAuthenticated: false, user: null });
  }
}));
