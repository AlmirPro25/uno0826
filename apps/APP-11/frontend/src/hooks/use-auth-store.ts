
import { create } from 'zustand';
import { UserProfile } from '@/types/auth';
import { removeAuthTokens, storeAuthTokens, getAuthTokens, decodeJwt } from '@/lib/auth';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null; // Unix timestamp
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initializeAuth: () => void;
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number, user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  accessTokenExpiresAt: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // Initial loading state

  initializeAuth: () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false }); // No localStorage on server
      return;
    }

    const { accessToken, refreshToken, accessTokenExpiresAt, userProfile } = getAuthTokens();
    const now = Date.now();

    if (accessToken && refreshToken && accessTokenExpiresAt && userProfile) {
      // Check if access token is still valid (or close to expiring but refreshable)
      const isAccessTokenValid = accessTokenExpiresAt > now + 60 * 1000; // Still valid for at least 1 minute

      if (isAccessTokenValid) {
        set({
          accessToken,
          refreshToken,
          accessTokenExpiresAt,
          user: userProfile,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Access token expired or near expiry, rely on refresh token or logout
        set({
          accessToken: null, // Clear expired token
          refreshToken,
          accessTokenExpiresAt: null,
          user: userProfile, // Keep user profile for potential refresh
          isAuthenticated: false, // Not authenticated until refreshed
          isLoading: false,
        });
        // Frontend won't automatically refresh on init, let interceptor handle it
        // Or if navigating to protected route, that route will trigger refresh
      }
    } else {
      removeAuthTokens(); // Clear any partial or invalid data
      set({
        accessToken: null,
        refreshToken: null,
        accessTokenExpiresAt: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setTokens: (accessToken, refreshToken, expiresIn, user) => {
    const expiresAt = Date.now() + expiresIn * 1000;
    storeAuthTokens(accessToken, refreshToken, expiresIn, user);
    set({
      accessToken,
      refreshToken,
      accessTokenExpiresAt: expiresAt,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    removeAuthTokens();
    set({
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));

// Run initialization once on client side
if (typeof window !== 'undefined') {
  useAuthStore.getState().initializeAuth();
}
