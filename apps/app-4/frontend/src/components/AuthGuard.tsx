import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Role } from '@/types/auth';
import { LoadingPage } from '@/components/ui/Loading';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

// Pages that don't require authentication
const publicPaths = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/pricing',
  '/contact',
  '/faq',
  '/terms',
  '/privacy',
  '/about',
];

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if current path is public
    const isPublicPath = publicPaths.some(path => 
      router.pathname === path || router.pathname.startsWith('/auth/')
    );

    if (isPublicPath) {
      setIsAuthorized(true);
      setIsReady(true);
      return;
    }

    // Wait for client-side hydration
    const checkAuth = () => {
      const state = useAuthStore.getState();
      
      // Also check localStorage directly
      let token = state.token;
      let userRole = state.role;
      let isAuthenticated = state.isAuthenticated;

      if (!token) {
        try {
          const storage = localStorage.getItem('auth-storage');
          if (storage) {
            const parsed = JSON.parse(storage);
            const storedState = parsed.state || parsed;
            token = storedState.token;
            userRole = storedState.role;
            isAuthenticated = storedState.isAuthenticated;
          }
        } catch (e) {
          // ignore
        }
      }

      // Not authenticated
      if (!isAuthenticated || !token) {
        const returnUrl = router.asPath !== '/' ? `?returnUrl=${encodeURIComponent(router.asPath)}` : '';
        router.replace(`/auth/login${returnUrl}`);
        return;
      }

      // Check role permissions
      if (allowedRoles && allowedRoles.length > 0) {
        const normalizedRole = typeof userRole === 'object' 
          ? (userRole as any).name 
          : userRole;
        
        if (!allowedRoles.includes(normalizedRole as Role)) {
          router.replace('/dashboard');
          return;
        }
      }

      setIsAuthorized(true);
      setIsReady(true);
    };

    // Small delay to ensure Zustand has hydrated
    const timeoutId = setTimeout(checkAuth, 100);

    return () => clearTimeout(timeoutId);
  }, [router.pathname, router.asPath, allowedRoles, router]);

  // Show loading while checking auth
  if (!isReady) {
    return <LoadingPage text="Verificando autenticação..." />;
  }

  // Not authorized - will redirect
  if (!isAuthorized) {
    return <LoadingPage text="Redirecionando..." />;
  }

  return <>{children}</>;
}
