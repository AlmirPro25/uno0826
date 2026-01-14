import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from './useAuthStore';
import { Role } from '@/types/auth';

interface UseRequireAuthOptions {
  redirectTo?: string;
  allowedRoles?: Role[];
}

// Helper to check if Zustand has hydrated from localStorage
const useHydration = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check if we're on client side
    if (typeof window === 'undefined') return;
    
    // Small delay to ensure Zustand persist middleware has loaded
    const checkHydration = () => {
      const storage = localStorage.getItem('auth-storage');
      if (storage) {
        try {
          const parsed = JSON.parse(storage);
          const state = useAuthStore.getState();
          // Check if store has been hydrated with localStorage data
          if (parsed.state?.token && state.token === parsed.state.token) {
            setHydrated(true);
            return;
          }
        } catch (e) {
          // ignore
        }
      }
      setHydrated(true);
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      setTimeout(checkHydration, 50);
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  return hydrated;
};

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { redirectTo = '/auth/login', allowedRoles } = options;
  const router = useRouter();
  const { isAuthenticated, role, token, user } = useAuthStore();
  const isHydrated = useHydration();
  const [isChecking, setIsChecking] = useState(true);

  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Get fresh state from store
    const currentState = useAuthStore.getState();
    
    // Also check localStorage directly as backup
    let hasValidAuth = currentState.isAuthenticated && !!currentState.token;
    
    if (!hasValidAuth) {
      try {
        const storage = localStorage.getItem('auth-storage');
        if (storage) {
          const parsed = JSON.parse(storage);
          const storedState = parsed.state || parsed;
          hasValidAuth = storedState.isAuthenticated && !!storedState.token;
        }
      } catch (e) {
        // ignore
      }
    }

    // Not authenticated - redirect to login
    if (!hasValidAuth) {
      const returnUrl = router.asPath !== '/' ? `?returnUrl=${encodeURIComponent(router.asPath)}` : '';
      router.replace(`${redirectTo}${returnUrl}`);
      return false;
    }

    // Check role permissions
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = typeof currentState.role === 'object' 
        ? (currentState.role as any).name 
        : currentState.role;
      if (!allowedRoles.includes(userRole as Role)) {
        router.replace('/dashboard');
        return false;
      }
    }

    return true;
  }, [allowedRoles, redirectTo, router]);

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!isHydrated) return;

    const isValid = checkAuth();
    setIsChecking(false);
  }, [isHydrated, checkAuth]);

  // Re-check when token changes (e.g., after refresh)
  useEffect(() => {
    if (isHydrated && token) {
      setIsChecking(false);
    }
  }, [isHydrated, token]);

  return { 
    isAuthenticated: isHydrated ? (isAuthenticated && !!token) : true,
    isLoading: !isHydrated || isChecking,
    user,
    role
  };
}
