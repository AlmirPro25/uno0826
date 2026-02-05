
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  userEmail: string | null;
  
  setToken: (token: string, email: string) => void;
  logout: () => void;
}

/**
 * ZUSTAND STORE: IDENTITY MANAGEMENT
 * Persists strictly to localStorage to survive page reloads.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      userEmail: null,

      setToken: (token, email) => set({ 
        token, 
        userEmail: email, 
        isAuthenticated: true 
      }),

      logout: () => set({ 
        token: null, 
        userEmail: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'titan-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
