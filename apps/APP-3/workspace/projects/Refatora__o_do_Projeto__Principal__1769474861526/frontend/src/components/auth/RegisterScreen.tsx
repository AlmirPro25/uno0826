
import React, { useState } from 'react';
import { useTacticalStore } from '@/stores/tacticalStore';
import { TacticalPanel, TacButton, TacInput } from '@/components/ui/AegisComponents';
import { UserPlus, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const RegisterScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { register, error: globalError, clearError, isLoading, isAuthenticated } = useTacticalStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError(); // Clear any previous errors
    setLocalError(null);
    if (isAuthenticated) {
      navigate('/dashboard'); // If already authenticated, redirect
    }
  }, [clearError, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (isLoading) return;

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    // Basic client-side validation for complexity (backend has more strict checks)
    if (password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[@$!%*?&]/.test(password)) {
      setLocalError('Password must be at least 6 characters, include uppercase, lowercase, number, and special character.');
      return;
    }

    await register({ username, password });
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-aegis-black text-aegis-green font-mono crt">
      <div className="scanline"></div>
      <TacticalPanel title="AEGIS-VII C2 NODE - NEW OPERATOR REGISTRATION" icon={UserPlus} className="w-[450px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TacInput
            label="USERNAME"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="UNIQUE OPERATOR-ID (min 3 chars alphanumeric)"
            required
            disabled={isLoading}
          />
          <TacInput
            label="PASSWORD"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="SECURE ACCESS-KEY (min 6 chars, complex)"
            required
            disabled={isLoading}
          />
          <TacInput
            label="CONFIRM PASSWORD"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="RE-ENTER ACCESS-KEY"
            required
            disabled={isLoading}
          />
          
          {(localError || globalError) && <p className="text-aegis-alert text-xs text-center">{localError || globalError}</p>}

          <TacButton type="submit" className="mt-2" disabled={isLoading}>
            {isLoading ? 'REGISTERING...' : 'REGISTER OPERATOR'}
          </TacButton>

          <div className="flex items-center justify-center text-xs opacity-70">
            <span className="mr-2">ALREADY AN OPERATOR?</span>
            <TacButton variant="ghost" type="button" onClick={() => navigate('/login')} disabled={isLoading}>
              <LogIn size={12} /> LOGIN
            </TacButton>
          </div>
        </form>
      </TacticalPanel>
    </div>
  );
};
