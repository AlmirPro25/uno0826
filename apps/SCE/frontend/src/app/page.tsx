'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProstQSAuth } from '@/hooks/useProstQSAuth';
import { LinkAppModal } from '@/components/LinkAppModal';
import { motion } from 'framer-motion';
import { Box, Lock, Mail, Rocket, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, setAuth, updateAfterLink, _hasHydrated } = useAuthStore();
  const prostQS = useProstQSAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // Aguardar hydration do Zustand
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await prostQS.login(email, password);
      
      if (response.needs_link) {
        // Usuário existe mas não tem membership no SCE
        // Salvar dados temporários e mostrar modal
        setAuth({
          id: response.user_id,
          email: response.email,
          name: response.name,
          role: 'user',
          originAppId: response.origin_app_id,
          memberships: response.memberships,
          plan: response.plan,
          capabilities: response.capabilities,
        }, response.token, true);
        setShowLinkModal(true);
      } else {
        // Login completo
        setAuth({
          id: response.user_id,
          email: response.email,
          name: response.name,
          role: 'user',
          originAppId: response.origin_app_id,
          memberships: response.memberships,
          plan: response.plan,
          capabilities: response.capabilities,
        }, response.token, false);
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await prostQS.register(email, password, name);
      setAuth({
        id: response.user_id,
        email: response.email,
        name: response.name,
        role: 'user',
        originAppId: response.origin_app_id,
        memberships: response.memberships,
        plan: response.plan,
        capabilities: response.capabilities,
      }, response.token, false);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkConfirm() {
    const response = await prostQS.linkApp();
    updateAfterLink(response.token, response.memberships);
    setShowLinkModal(false);
    router.push('/dashboard');
  }

  function handleLinkCancel() {
    setShowLinkModal(false);
    prostQS.logout();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Box className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter">SOVEREIGN CLOUD</h1>
          <p className="text-slate-400 mt-2">
            {isRegisterMode ? 'Crie sua conta' : 'Acesse o Centro de Comando'}
          </p>
        </div>

        <div className="glass-card p-8 rounded-2xl">
          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-6">
            {isRegisterMode && (
              <div>
                <label className="text-sm font-medium text-slate-400 mb-2 block">Nome</label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-3.5 w-5 h-5 text-slate-600" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-12 pr-4 py-3 focus:border-primary outline-none transition-all"
                    placeholder="Seu nome"
                    required={isRegisterMode}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-400 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-12 pr-4 py-3 focus:border-primary outline-none transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-400 mb-2 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-12 pr-4 py-3 focus:border-primary outline-none transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  {isRegisterMode ? 'CRIAR CONTA' : 'ACESSAR ENGINE'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400">
              {isRegisterMode ? 'Já tem conta?' : 'Não tem conta?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                }}
                className="text-primary hover:underline font-medium"
              >
                {isRegisterMode ? 'Fazer login' : 'Criar conta'}
              </button>
            </p>
            <p className="text-xs text-slate-500 mt-3">
              Autenticação via PROST-QS Identity
            </p>
          </div>
        </div>
      </motion.div>

      {/* Modal de Link de App */}
      <LinkAppModal
        isOpen={showLinkModal}
        appName="Sovereign Cloud Engine"
        userEmail={prostQS.user?.email || email}
        onConfirm={handleLinkConfirm}
        onCancel={handleLinkCancel}
      />
    </div>
  );
}
