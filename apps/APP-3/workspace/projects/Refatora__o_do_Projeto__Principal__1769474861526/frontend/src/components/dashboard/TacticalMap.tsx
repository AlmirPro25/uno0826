
import { Globe, Crosshair, XCircle, ShieldAlert, Database, Sword } from 'lucide-react';
import { useTacticalStore } from '@/stores/tacticalStore';
import { TacticalPanel, TacButton, ProgressBar } from '@/components/ui/AegisComponents';
import { Operation } from '../../../../shared/types/schema';

export const TacticalMap = () => {
  const { data, selectedUnitId, deployUnit, selectUnit } = useTacticalStore();
  const operations = data?.operations || [];
  
  // Find name of selected unit
  const selectedUnit = data?.units.find(u => u.id === selectedUnitId);

  return (
    <TacticalPanel title="TACTICAL MAP" icon={Globe} className="h-full flex flex-col">
      {/* OPERATIONS VISUALIZATION */}
      <div className="flex-1 space-y-4 overflow-y-auto mb-4 p-2 min-h-[300px] bg-black/50 border border-aegis-green/20 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 pointer-events-none"></div>
        
        {operations.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-aegis-green/20">
            <Crosshair size={64} className="animate-spin-slow" />
            <p className="mt-4 tracking-widest">AREA SECURE / NO ACTIVE OPERATIONS</p>
          </div>
        )}

        {operations.map(op => (
          <OperationCard key={op.id} op={op} />
        ))}
      </div>

      {/* DEPLOYMENT CONTROLS */}
      {selectedUnitId && (
        <div className="border-t border-aegis-green pt-4 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-aegis-warn">
              ORDERS FOR: <span className="font-bold">{selectedUnit?.designation}</span>
            </p>
            <button onClick={() => selectUnit(null)} className="text-red-500 text-xs hover:underline flex items-center gap-1">
              <XCircle size={12} /> CANCEL
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <MissionBtn 
              name="DATA MINE" 
              desc="10s / LOW RISK" 
              icon={Database} 
              onClick={() => deployUnit(selectedUnitId, 'DATA_MINING')} 
            />
            <MissionBtn 
              name="ASSAULT" 
              desc="30s / MED RISK" 
              icon={Sword} 
              className="text-orange-400 border-orange-400"
              onClick={() => deployUnit(selectedUnitId, 'FIREWALL_ASSAULT')} 
            />
            <MissionBtn 
              name="DEFENSE" 
              desc="60s / HIGH RISK" 
              icon={ShieldAlert}
              className="text-red-500 border-red-500" 
              onClick={() => deployUnit(selectedUnitId, 'GRID_DEFENSE')} 
            />
          </div>
        </div>
      )}
    </TacticalPanel>
  );
};

// Sub-component for individual Operation
const OperationCard = ({ op }: { op: Operation }) => {
  const now = Date.now();
  const totalDuration = op.end_time - op.start_time;
  const elapsed = now - op.start_time;
  const progress = Math.max(0, Math.min(1, elapsed / totalDuration)); // Progress 0 to 1

  return (
    <div className="border border-aegis-green/50 bg-aegis-green/5 p-3 relative overflow-hidden">
      <div className="flex justify-between items-start relative z-10">
        <div>
          <div className="font-bold flex items-center gap-2">
            <Crosshair size={14} className="animate-pulse" />
            {op.name}
          </div>
          <div className="text-xs opacity-70">{op.type}</div>
        </div>
        <div className="text-xs text-right">
          <div>RWD: {op.reward_cpu} CPU / {op.reward_bw} BW</div>
          <div>CRYPTO: {op.reward_crypto}</div>
          <div>DIFF: {op.difficulty}</div>
        </div>
      </div>
      
      <div className="mt-2">
        <ProgressBar value={progress * 100} max={100} color={op.type === 'GRID_DEFENSE' ? 'bg-red-500' : op.type === 'FIREWALL_ASSAULT' ? 'bg-orange-400' : 'bg-aegis-green'} />
      </div>
    </div>
  );
};

const MissionBtn = ({ name, desc, icon: Icon, onClick, className }: any) => (
  <TacButton onClick={onClick} className={`flex-col items-center py-4 ${className}`}>
    <Icon size={24} className="mb-1" />
    <span>{name}</span>
    <span className="text-[9px] opacity-70">{desc}</span>
  </TacButton>
);
