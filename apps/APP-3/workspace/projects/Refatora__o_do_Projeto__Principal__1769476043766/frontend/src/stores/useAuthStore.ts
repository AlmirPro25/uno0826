
import { create } from 'zustand';
import { AuthService } from '@/services/api/auth.service';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (code: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('cydonia_token'),
  isAuthenticated: !!localStorage.getItem('cydonia_token'),
  isLoading: false,
  error: null,

  login: async (code: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.establishLink(code);
      localStorage.setItem('cydonia_token', response.token);
      set({ 
        token: response.token, 
        isAuthenticated: true, 
        isLoading: false 
      });
      return true;
    } catch (err: any) {
      set({ 
        isLoading: false, 
        error: 'ACCESS DENIED: INVALID BIOMETRIC SIGNATURE' 
      });
      return false;
    }
  },

  logout: () => {
    AuthService.terminateLink();
    localStorage.removeItem('cydonia_token');
    set({ token: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null })
}));
