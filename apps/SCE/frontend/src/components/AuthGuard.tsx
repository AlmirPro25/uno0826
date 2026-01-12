'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { LinkAppModal } from './LinkAppModal';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard — Protege rotas que requerem autenticação
 * 
 * Fluxo:
 * 1. Verifica se está autenticado
 * 2. Se needsLink, mostra modal de vinculação
 * 3. Se não autenticado, redireciona para login
 * 
 * IMPORTANTE: needsLink é estado legítimo, não erro.
 * Usuário pode estar autenticado no Kernel mas sem membership no SCE.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, needsLink, _hasHydrated, user, token } = useAuthStore();
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    // Se precisa de link, mostrar modal
    if (needsLink && user && token) {
      setShowLinkModal(true);
      return;
    }

    // Se não autenticado, redirecionar
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [_hasHydrated, isAuthenticated, needsLink, user, token, router]);

  // Loading state
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent animate-spin rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Needs link — mostrar modal
  if (needsLink && showLinkModal) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              Vincule sua conta ao SCE
            </h2>
            <p className="text-slate-400">
              Você está autenticado, mas precisa vincular sua conta para acessar o SCE.
            </p>
          </div>
        </div>
        <LinkAppModal 
          isOpen={showLinkModal} 
          onClose={() => {
            setShowLinkModal(false);
            router.push('/');
          }}
        />
      </>
    );
  }

  // Não autenticado
  if (!isAuthenticated) {
    return null;
  }

  // Autenticado e com membership — renderizar children
  return <>{children}</>;
}
