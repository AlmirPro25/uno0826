
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { Shield, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: 'COMMANDER_X', // Default per instructions
    password: 'SENTINEL_PROTOCOL_INIT'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(formData);
      navigate('/');
    } catch (err) {
      setError('ACCESS DENIED: INVALID CLEARANCE CODE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tactical-bg flex items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] opacity-5 pointer-events-none">
        {Array.from({ length: 400 }).map((_, i) => (
          <div key={i} className="border border-white/10 aspect-square" />
        ))}
      </div>

      <div className="w-full max-w-md z-10 p-8 bg-tactical-panel border border-tactical-border shadow-2xl relative">
        <div className="absolute top-0 left-0 w-2 h-2 bg-tactical-orange" />
        <div className="absolute top-0 right-0 w-2 h-2 bg-tactical-orange" />
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-tactical-orange" />
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-tactical-orange" />

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-tactical-orange/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-tactical-orange text-tactical-orange">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest">SENTINEL NEXUS</h1>
          <p className="text-tactical-muted font-mono text-xs mt-2 uppercase">Restricted Access // Level 5 Clearance</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-mono text-tactical-green uppercase">Operator ID</label>
            <div className="relative">
              <input 
                type="text" 
                className="w-full bg-black border border-tactical-border py-3 pl-10 pr-4 text-white font-mono focus:border-tactical-orange outline-none transition-colors"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
              <Shield className="absolute left-3 top-3.5 w-4 h-4 text-tactical-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-tactical-green uppercase">Access Key</label>
            <div className="relative">
              <input 
                type="password" 
                className="w-full bg-black border border-tactical-border py-3 pl-10 pr-4 text-white font-mono focus:border-tactical-orange outline-none transition-colors"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
              <Key className="absolute left-3 top-3.5 w-4 h-4 text-tactical-muted" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/50 text-red-500 text-xs font-mono text-center">
              {error}
            </div>
          )}

          <Button className="w-full h-12" disabled={loading}>
            {loading ? 'AUTHENTICATING...' : 'ESTABLISH UPLINK'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-tactical-muted font-mono">
            UNAUTHORIZED ACCESS IS A FEDERAL OFFENSE.<br/>
            IP ADDRESS LOGGED AND TRACED.
          </p>
        </div>
      </div>
    </div>
  );
}
