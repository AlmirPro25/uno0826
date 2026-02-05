
import React, { useState } from 'react';
import { useTacticalStore } from '@/stores/tacticalStore';
import { TacticalPanel, TacButton, TacInput, cn } from '@/components/ui/AegisComponents';
import { LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, clearError, isLoading, isAuthenticated } = useTacticalStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError(); // Clear any previous errors when mounting login screen
    if (isAuthenticated) {
      navigate('/dashboard'); // If already authenticated, redirect
    }
  }, [clearError, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    await login({ username, password });
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-aegis-black text-aegis-green font-mono crt">
      <div className="scanline"></div>
      <TacticalPanel title="AEGIS-VII C2 NODE - OPERATOR LOGIN" icon={LogIn} className="w-[400px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TacInput
            label="USERNAME"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="OPERATOR-ID"
            required
            disabled={isLoading}
          />
          <TacInput
            label="PASSWORD"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ACCESS-KEY"
            required
            disabled={isLoading}
          />
          
          {error && <p className="text-aegis-alert text-xs text-center">{error}</p>}

          <TacButton type="submit" className="mt-2" disabled={isLoading}>
            {isLoading ? 'AUTHENTICATING...' : 'SECURE LOGIN'}
          </TacButton>

          <div className="flex items-center justify-center text-xs opacity-70">
            <span className="mr-2">NEW OPERATOR?</span>
            <TacButton variant="ghost" type="button" onClick={() => navigate('/register')} disabled={isLoading}>
              <UserPlus size={12} /> REGISTER
            </TacButton>
          </div>
        </form>
      </TacticalPanel>
    </div>
  );
};
