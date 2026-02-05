
import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { StatCard } from '../components/ui/StatCard';
import { PlanetaryCanvas } from '../components/PlanetaryCanvas';
import { Button } from '../components/ui/Button';
import { Activity, ShieldAlert, Wind, Thermometer, Droplets, Zap } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { telemetry, logs, fetchTelemetry, fetchLogs, modulateSystem, triggerFailSafe, logout } = useStore();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Heartbeat Polling
  useEffect(() => {
    fetchTelemetry();
    fetchLogs();
    const interval = setInterval(() => {
      fetchTelemetry();
      fetchLogs();
      setLastUpdate(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!telemetry) return <div className="h-screen flex items-center justify-center text-mars-cyan font-mono animate-pulse">ESTABLISHING UPLINK...</div>;

  const getHealthStatus = (ppm: number) => {
    if (ppm < 196000) return 'critical';
    if (ppm < 205000) return 'warning';
    return 'normal';
  };

  return (
    <div className="min-h-screen bg-mars-base text-gray-200 font-sans selection:bg-mars-red selection:text-white overflow-hidden scanlines">
      
      {/* HEADER */}
      <header className="h-16 border-b border-mars-cyan/20 flex items-center justify-between px-6 bg-mars-surface/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Activity className="text-mars-red w-5 h-5 animate-pulse" />
          <h1 className="font-mono font-bold text-lg tracking-widest">CYDONIA <span className="text-mars-cyan">ARCHITECT</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs font-mono text-gray-500">TICK: {lastUpdate.toLocaleTimeString()}</span>
          <Button variant="ghost" onClick={logout} className="text-xs">UNLINK</Button>
        </div>
      </header>

      <main className="p-6 grid grid-cols-12 gap-6 h-[calc(100vh-4rem)]">
        
        {/* LEFT COL: VITAL SIGNS */}
        <div className="col-span-12 lg:col-span-3 space-y-4 overflow-y-auto pr-2">
          <h2 className="text-xs font-mono text-mars-cyan mb-4 border-b border-mars-cyan/20 pb-2">ATMOSPHERIC COMPOSITION</h2>
          
          <StatCard 
            label="OXYGEN LEVEL" 
            value={(telemetry.atmosphere.oxygen_ppm / 10000).toFixed(2)} 
            unit="%" 
            status={getHealthStatus(telemetry.atmosphere.oxygen_ppm)}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <StatCard 
              label="PRESSURE" 
              value={telemetry.atmosphere.pressure_kpa.toFixed(1)} 
              unit="kPa"
            />
             <StatCard 
              label="RADIATION" 
              value={telemetry.atmosphere.radiation_sieverts.toFixed(4)} 
              unit="Sv/h"
              status={telemetry.atmosphere.radiation_sieverts > 0.1 ? 'warning' : 'normal'}
            />
          </div>

          <div className="p-4 border border-gray-800 bg-mars-surface/30 mt-6">
            <div className="flex items-center gap-2 mb-4 text-mars-cyan">
              <Wind className="w-4 h-4" />
              <span className="text-xs font-mono">MODULATION CONTROLS</span>
            </div>
            <div className="space-y-3">
              <Button className="w-full text-xs" onClick={() => modulateSystem('OXYGEN_GENERATOR', 215000)}>
                BOOST O2 SCRUBBERS
              </Button>
              <Button className="w-full text-xs" onClick={() => modulateSystem('PRESSURE_VALVE', 101.3)}>
                NORMALIZE PRESSURE
              </Button>
            </div>
          </div>
        </div>

        {/* CENTER COL: VISUALIZATION */}
        <div className="col-span-12 lg:col-span-6 flex flex-col relative border-x border-mars-cyan/10 px-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-mars-cyan/50 to-transparent" />
          
          <div className="flex-1 relative min-h-[400px]">
            <PlanetaryCanvas />
            
            {/* OVERLAY DATA */}
            <div className="absolute top-10 right-10 text-right space-y-1">
              <div className="text-[10px] text-gray-500 font-mono">HULL INTEGRITY</div>
              <div className="text-2xl font-mono text-mars-cyan">{telemetry.sector_status.dome_integrity.toFixed(1)}%</div>
            </div>

             <div className="absolute bottom-10 left-10 space-y-1">
              <div className="text-[10px] text-gray-500 font-mono">ENERGY GRID</div>
              <div className="flex items-center gap-2 text-xl font-mono text-yellow-500">
                <Zap className="w-4 h-4" />
                {telemetry.resources.energy_output_mw.toFixed(0)} MW
              </div>
            </div>
          </div>

          <div className="h-1/4 border-t border-mars-cyan/10 pt-4">
            <h3 className="text-xs font-mono text-gray-500 mb-2">SYSTEM AUDIT LOG</h3>
            <div className="h-full overflow-y-auto text-[10px] font-mono space-y-1 pb-4">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2 opacity-80 hover:opacity-100">
                  <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`
                    ${log.severity === 'CRITICAL' ? 'text-mars-red font-bold' : ''}
                    ${log.severity === 'WARNING' ? 'text-yellow-500' : 'text-mars-cyan'}
                  `}>
                    {log.origin}: {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COL: RESOURCES & FAILSAFE */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 pl-2">
           <h2 className="text-xs font-mono text-mars-cyan mb-4 border-b border-mars-cyan/20 pb-2">RESOURCE ALLOCATION</h2>
           
           <div className="bg-mars-surface/50 p-4 border border-gray-800">
             <div className="flex justify-between items-center mb-2">
               <span className="text-xs font-mono flex items-center gap-2"><Droplets className="w-3 h-3 text-blue-400"/> WATER</span>
               <span className="text-xs font-mono font-bold">{telemetry.resources.water_reserves_liters} L</span>
             </div>
             <div className="w-full bg-gray-900 h-1">
               <div className="bg-blue-500 h-full" style={{ width: '90%' }} />
             </div>
           </div>

           <div className="bg-mars-surface/50 p-4 border border-gray-800">
             <div className="flex justify-between items-center mb-2">
               <span className="text-xs font-mono flex items-center gap-2"><Thermometer className="w-3 h-3 text-orange-400"/> THERMAL</span>
               <span className="text-xs font-mono font-bold">22.4°C</span>
             </div>
             <div className="w-full bg-gray-900 h-1">
               <div className="bg-orange-500 h-full" style={{ width: '60%' }} />
             </div>
           </div>

           <div className="mt-auto border border-mars-red/30 p-4 bg-mars-red/5">
             <div className="flex items-center gap-2 text-mars-red mb-2">
               <ShieldAlert className="w-5 h-5" />
               <span className="text-xs font-bold font-mono">OMEGA PROTOCOL</span>
             </div>
             <p className="text-[10px] text-gray-500 mb-4 leading-tight">
               In case of catastrophic failure, seal all sectors and minimize life support to hibernation levels.
             </p>
             <Button 
                variant="danger" 
                className="w-full"
                onClick={() => {
                  if (confirm('WARNING: THIS WILL SEAL ALL DOMES. CONFIRM?')) {
                    triggerFailSafe();
                  }
                }}
              >
               ACTIVATE FAIL-SAFE
             </Button>
           </div>
        </div>

      </main>
    </div>
  );
};
