
import { Terminal, Trash2 } from 'lucide-react';
import { useTacticalStore } from '@/stores/tacticalStore';
import { TacticalPanel, TacButton } from '@/components/ui/AegisComponents';
import { useEffect, useRef } from 'react';

export const ConsoleLog = () => {
  const { data, purgeSystem, user } = useTacticalStore();
  const logs = data?.logs || [];
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when logs update
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getLevelColor = (lvl: string) => {
    switch (lvl) {
      case 'CRITICAL': return 'text-red-600 font-bold';
      case 'ALERT': return 'text-orange-400';
      case 'WARN': return 'text-yellow-400';
      case 'SUCCESS': return 'text-aegis-green';
      default: return 'text-blue-400'; // INFO and other general messages
    }
  };

  const isUserAdmin = user?.role === 'ADMIN';

  return (
    <div className="h-full flex flex-col gap-4">
      <TacticalPanel title="COMMS LOG" icon={Terminal} className="flex-1">
        <div className="space-y-1 font-mono text-xs">
          {logs.map((log) => (
            <div key={log.id} className="break-words border-b border-white/5 pb-1 mb-1">
              <span className="opacity-30 mr-2">
                [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
              </span>
              <span className={`mr-2 ${getLevelColor(log.level)}`}>{log.level}:</span>
              <span className="opacity-90">{log.message}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </TacticalPanel>

      <div className="border border-aegis-alert bg-red-950/20 p-4">
        <h3 className="text-aegis-alert text-xs font-bold mb-2 flex items-center gap-2">
          <Trash2 size={14} /> DANGER ZONE
        </h3>
        <TacButton 
          variant="danger" 
          onClick={async () => {
            if(confirm('INITIATE SYSTEM PURGE? ALL DATA WILL BE LOST. THIS ACTION IS IRREVERSIBLE.')) {
                await purgeSystem();
            }
          }} 
          className="w-full"
          disabled={!isUserAdmin}
          title={!isUserAdmin ? "Admin privileges required for Factory Reset" : "Factory Reset System"}
        >
          FACTORY RESET SYSTEM
        </TacButton>
        {!isUserAdmin && <p className="text-aegis-alert text-xs mt-1 text-center">Admin required</p>}
      </div>
    </div>
  );
};
