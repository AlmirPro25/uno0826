
import { Users, MousePointer2 } from 'lucide-react';
import { useTacticalStore } from '@/stores/tacticalStore';
import { TacticalPanel, StatusBadge } from '@/components/ui/AegisComponents';
import { motion, AnimatePresence } from 'framer-motion';

export const UnitRoster = () => {
  const { data, selectUnit, selectedUnitId } = useTacticalStore();
  const units = data?.units || [];

  return (
    <TacticalPanel title={`UNIT ROSTER [${units.length}]`} icon={Users} className="flex-1">
      <div className="space-y-2 pr-2">
        <AnimatePresence>
          {units.map((unit) => (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`unit-card p-2 border-l-2 text-sm bg-black/40 hover:bg-aegis-green/10 transition-colors cursor-pointer flex justify-between items-center
                ${selectedUnitId === unit.id ? 'border-aegis-warn bg-aegis-warn/10' : 'border-aegis-green'}
                ${unit.status !== 'IDLE' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => unit.status === 'IDLE' && selectUnit(unit.id)}
            >
              <div>
                <div className="font-bold">{unit.designation}</div>
                <div className="text-[10px] opacity-70">{unit.type} | LVL {unit.level}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={unit.status} />
                {unit.status === 'IDLE' && (
                  <MousePointer2 size={12} className={selectedUnitId === unit.id ? 'text-aegis-warn' : 'text-gray-600'} />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {units.length === 0 && (
          <div className="text-center opacity-30 mt-10">
            <p>NO ASSETS IN FIELD</p>
          </div>
        )}
      </div>
    </TacticalPanel>
  );
};
