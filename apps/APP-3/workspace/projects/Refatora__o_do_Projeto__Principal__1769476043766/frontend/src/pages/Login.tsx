
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const login = useStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(code);
    if (success) {
      navigate('/');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mars-base relative overflow-hidden scanlines">
      {/* Background Elements */}
      <div className="absolute inset-0 grid grid-cols-[repeat(20,1fr)] opacity-5 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="border-r border-mars-cyan h-full" />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md p-8 border border-mars-cyan/20 bg-mars-surface/80 backdrop-blur-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-mono font-bold text-mars-red mb-2 tracking-tighter">AEROSPHERE</h1>
          <p className="text-xs uppercase tracking-[0.5em] text-mars-cyan">Cydonia Protocol v0.9</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-400">NEURAL LINK ACCESS CODE</label>
            <input 
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-black/50 border border-gray-700 p-3 text-mars-cyan font-mono text-center focus:outline-none focus:border-mars-cyan transition-colors"
              placeholder="ENTER CREDENTIALS"
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full" variant={error ? 'danger' : 'primary'}>
            {error ? 'ACCESS DENIED' : 'INITIATE UPLINK'}
          </Button>

          <div className="text-[10px] text-gray-600 font-mono text-center mt-4">
            UNAUTHORIZED ACCESS IS A CLASS A FELONY UNDER MARS COMPACT.
            <br/>HINT FOR SIMULATION: CYDONIA-2084
          </div>
        </form>
      </div>
    </div>
  );
};
