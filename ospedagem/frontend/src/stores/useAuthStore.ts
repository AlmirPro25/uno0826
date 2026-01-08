
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

/**
 * @description Store de autenticação com persistência segura.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('sce_token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('sce_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'sce_user_store',
    }
  )
);
