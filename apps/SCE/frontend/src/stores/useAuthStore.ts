
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * PROST-QS Multi-App Identity Store
 * 
 * Modelo:
 * - User é global no PROST-QS
 * - Memberships são vínculos explícitos por app
 * - needs_link é estado legítimo, não erro
 */

interface Membership {
  app_id: string;
  app_name: string;
  role: string;
  status: string;
  linked_at: string;
  last_access_at: string;
}

interface ProstQSUser {
  id: string;
  email: string;
  name: string;
  role: string;
  originAppId: string;
  originAppName?: string;
  memberships: Membership[];
  plan: string;
  capabilities: string[];
}

interface AuthState {
  user: ProstQSUser | null;
  isAuthenticated: boolean;
  needsLink: boolean;
  token: string | null;
  _hasHydrated: boolean;
  
  // Actions
  setAuth: (user: ProstQSUser, token: string, needsLink?: boolean) => void;
  updateAfterLink: (token: string, memberships: Membership[]) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      needsLink: false,
      token: null,
      _hasHydrated: false,
      
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      setAuth: (user, token, needsLink = false) => {
        set({ 
          user, 
          token, 
          needsLink,
          isAuthenticated: !needsLink, // Só autenticado se não precisa de link
        });
      },
      
      updateAfterLink: (token, memberships) => {
        set((state) => ({
          token,
          needsLink: false,
          isAuthenticated: true,
          user: state.user ? { ...state.user, memberships } : null,
        }));
      },
      
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          needsLink: false 
        });
      },
    }),
    {
      name: 'sce_prostqs_auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
