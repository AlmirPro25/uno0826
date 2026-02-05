
import { useAuthStore } from "@/store/auth.store";
import { useTelemetryStore } from "@/store/telemetry.store";
import { ShieldAlert, Activity, LogOut, Lock } from "lucide-react";
import { Button } from "../ui/button";

export function Header() {
  const logout = useAuthStore(state => state.logout);
  const status = useTelemetryStore(state => state.systemStatus);

  return (
    <header className="h-16 border-b border-tactical-border bg-tactical-bg/95 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-tactical-orange rounded-sm flex items-center justify-center">
          <ShieldAlert className="text-black w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-widest leading-none text-white">SENTINEL<span className="text-tactical-orange">NEXUS</span></h1>
          <p className="text-[10px] text-tactical-muted font-mono tracking-[0.2em] uppercase">Tactical Border Control</p>
        </div>
      </div>

      {status && (
        <div className="hidden md:flex gap-8 font-mono text-xs">
          <div className="flex flex-col items-center">
             <span className="text-tactical-muted uppercase text-[10px]">Threat Level</span>
             <span className={`font-bold ${status.threat_level === 'LOW' ? 'text-tactical-green' : 'text-tactical-orange'}`}>
               {status.threat_level}
             </span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-tactical-muted uppercase text-[10px]">Integrity</span>
             <span className="text-tactical-green">{status.system_integrity}%</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-tactical-muted uppercase text-[10px]">Active Assets</span>
             <span className="text-white">{status.active_assets}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-tactical-green">
           <Activity className="w-4 h-4 animate-pulse" />
           <span className="hidden sm:inline">LIVE FEED CONNECTED</span>
        </div>
        <div className="h-6 w-px bg-tactical-border mx-2"></div>
        <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-tactical-muted hidden sm:inline">CMDR. ADMIN</span>
            <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
            </Button>
        </div>
      </div>
    </header>
  );
}
