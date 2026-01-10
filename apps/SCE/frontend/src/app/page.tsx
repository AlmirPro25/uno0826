'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { API } from '@/lib/api';
import { motion } from 'framer-motion';
import { Box, Lock, Mail, Rocket } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, setAuth, _hasHydrated } = useAuthStore();
  const [email, setEmail] = useState('admin@sce.local');
  const [password, setPassword] = useState('admin123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const response = await API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuth(response.user, response.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
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
          <p className="text-slate-400 mt-2">Acesse o Centro de Comando</p>
        </div>

        <div className="glass-card p-8 rounded-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
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
                  placeholder="admin@sce.local"
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
                  autoComplete="current-password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-12 pr-4 py-3 focus:border-primary outline-none transition-all"
                  placeholder="••••••••"
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
                  ACESSAR ENGINE
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 mb-3">
              Credenciais padrão: admin@sce.local / admin123456
            </p>
            <p className="text-xs text-slate-400">
              Não tem conta?{' '}
              <a 
                href="http://localhost:3000" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Registre-se no PROST-QS
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
