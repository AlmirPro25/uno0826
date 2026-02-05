
import { Cpu, Wifi, Coins, Radio, LogOut, User as UserIcon } from 'lucide-react';
import { useTacticalStore } from '@/stores/tacticalStore';
import { TacButton } from '../ui/AegisComponents'; // Assuming same dir

export const Header = () => {
  const { data, user, logout } = useTacticalStore();
  const res = data?.resources || { cpu_cycles: 0, bandwidth: 0, crypto_tokens: 0 };

  return (
    <header className="flex justify-between items-center mb-4 border border-aegis-green p-4 bg-aegis-panel relative overflow-hidden">
      <div className="flex items-center gap-4 z-10">
        <Radio className="w-8 h-8 animate-pulse text-aegis-green" />
        <div>
          <h1 className="text-2xl font-bold tracking-[0.2em] text-glow">AEGIS-VII C2 NODE</h1>
          <p className="text-xs text-aegis-green/70">SECURE UPLINK ESTABLISHED // <span className="text-white">{new Date().toLocaleTimeString()}</span></p>
        </div>
      </div>

      <div className="flex items-center gap-8 text-xl font-bold z-10">
        <ResourceItem icon={Cpu} label="CPU CYCLES" value={res.cpu_cycles} id="res-cpu" />
        <ResourceItem icon={Wifi} label="BANDWIDTH" value={res.bandwidth} id="res-bw" />
        <ResourceItem icon={Coins} label="CRYPTO" value={res.crypto_tokens} className="text-aegis-warn" id="res-crypto" />
        
        {user && (
          <div className="flex flex-col items-end text-sm">
            <div className="flex items-center gap-1 text-aegis-green/70">
              <UserIcon size={12} />
              <span>OPERATOR:</span>
            </div>
            <span className="font-mono text-base">{user.username}</span>
            <TacButton onClick={logout} variant="ghost" className="text-xs py-0.5 px-1 mt-1">
              <LogOut size={10} /> LOGOUT
            </TacButton>
          </div>
        )}
      </div>
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-aegis-green/10 to-transparent" />
    </header>
  );
};

const ResourceItem = ({ icon: Icon, label, value, className, id }: any) => (
  <div className={`flex flex-col items-end ${className || ''}`}>
    <div className="flex items-center gap-1 text-xs opacity-70">
      <Icon size={12} />
      <span>{label}</span>
    </div>
    <span id={id} className="font-mono text-2xl tabular-nums">{value.toLocaleString()}</span>
  </div>
);
