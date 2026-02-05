
import { Factory, Bot, Zap, Shield } from 'lucide-react';
import { useTacticalStore } from '@/stores/tacticalStore';
import { TacButton, TacticalPanel } from '@/components/ui/AegisComponents';

export const Fabricator = () => {
  const { fabricateUnit, data, isFabricating } = useTacticalStore((state) => ({
    fabricateUnit: state.fabricateUnit,
    data: state.data,
    isFabricating: state.isFabricating
  }));

  const resources = data?.resources || { cpu_cycles: 0, bandwidth: 0 };

  const unitCosts = { // Matches backend UNIT_COSTS
    MINER: { cpu: 50, bw: 10 },
    HUNTER: { cpu: 120, bw: 40 },
    GUARDIAN: { cpu: 200, bw: 20 }
  }

  const canFabricate = (type: 'MINER' | 'HUNTER' | 'GUARDIAN') => {
    if (isFabricating) return false;
    const costs = unitCosts[type];
    return resources.cpu_cycles >= costs.cpu && resources.bandwidth >= costs.bw;
  }

  return (
    <TacticalPanel title="FABRICATOR" icon={Factory} className="h-1/3 min-h-[200px] mb-4">
      <div className="flex flex-col gap-2">
        <FabricateBtn 
          name="MINER DROID" 
          cost="50 CPU / 10 BW" 
          icon={Bot} 
          onClick={() => fabricateUnit('MINER')} 
          disabled={!canFabricate('MINER')}
        />
        <FabricateBtn 
          name="HUNTER KILLER" 
          cost="120 CPU / 40 BW" 
          icon={Zap} 
          onClick={() => fabricateUnit('HUNTER')} 
          disabled={!canFabricate('HUNTER')}
        />
        <FabricateBtn 
          name="GUARDIAN" 
          cost="200 CPU / 20 BW" 
          icon={Shield} 
          onClick={() => fabricateUnit('GUARDIAN')}
          className="text-aegis-warn border-aegis-warn"
          disabled={!canFabricate('GUARDIAN')}
        />
      </div>
    </TacticalPanel>
  );
};

const FabricateBtn = ({ name, cost, icon: Icon, onClick, className, disabled }: any) => (
  <TacButton onClick={onClick} className={`w-full justify-between group ${className}`} disabled={disabled}>
    <div className="flex items-center gap-2">
      <Icon size={16} />
      <span>{name}</span>
    </div>
    <span className="text-[10px] opacity-70 group-hover:opacity-100">{cost}</span>
  </TacButton>
);
