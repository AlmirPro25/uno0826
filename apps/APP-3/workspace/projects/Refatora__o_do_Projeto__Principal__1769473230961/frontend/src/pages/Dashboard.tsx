
import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { TacticalMap } from '@/components/dashboard/TacticalMap';
import { AssetDetails } from '@/components/dashboard/AssetDetails';
import { useTelemetryStore } from '@/store/telemetry.store';
import { Badge } from '@/components/ui/badge';
import { Target, Search } from 'lucide-react';

export default function Dashboard() {
  const { assets, selectedAsset, connect, fetchAssets, fetchSystemStatus, selectAsset } = useTelemetryStore();

  useEffect(() => {
    fetchSystemStatus();
    fetchAssets();
    connect();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-tactical-bg text-tactical-text">
      <Header />
      
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Panel: Asset List */}
        <div className="w-80 flex flex-col bg-tactical-panel border border-tactical-border rounded-sm">
           <div className="p-4 border-b border-tactical-border">
             <div className="relative">
               <Search className="absolute left-2 top-2.5 text-tactical-muted w-4 h-4" />
               <input 
                 type="text" 
                 placeholder="SEARCH ASSET ID..." 
                 className="w-full bg-black border border-tactical-border rounded-sm py-2 pl-8 pr-2 text-sm font-mono focus:border-tactical-orange outline-none text-white"
               />
             </div>
           </div>
           
           <div className="flex-1 overflow-y-auto">
             {assets.map(asset => (
               <div 
                 key={asset.id}
                 onClick={() => selectAsset(asset.id)}
                 className={`p-3 border-b border-tactical-border cursor-pointer hover:bg-white/5 transition-colors ${selectedAsset?.id === asset.id ? 'bg-tactical-green/5 border-l-2 border-l-tactical-green' : 'border-l-2 border-l-transparent'}`}
               >
                 <div className="flex justify-between items-center mb-1">
                   <span className="font-mono font-bold text-sm text-white">{asset.codename}</span>
                   <Badge variant={asset.status === 'CLEARED' ? 'success' : 'warning'}>{asset.status}</Badge>
                 </div>
                 <div className="flex justify-between text-xs font-mono text-tactical-muted">
                    <span>{asset.type}</span>
                    <span>{asset.latitude.toFixed(2)}, {asset.longitude.toFixed(2)}</span>
                 </div>
               </div>
             ))}
           </div>
           
           <div className="p-2 border-t border-tactical-border bg-black text-[10px] text-center font-mono text-tactical-muted">
             TOTAL ASSETS TRACKED: {assets.length}
           </div>
        </div>

        {/* Center Panel: Map (War Room) */}
        <div className="flex-1 flex flex-col relative rounded-sm overflow-hidden border border-tactical-border">
          <TacticalMap />
          
          {/* Overlay UI Elements */}
          <div className="absolute bottom-4 right-4 z-[400] pointer-events-none">
             <div className="flex items-center gap-2 text-tactical-green animate-pulse">
               <Target className="w-4 h-4" />
               <span className="font-mono text-xs">REAL-TIME TELEMETRY</span>
             </div>
          </div>
        </div>

        {/* Right Panel: Detail View */}
        <div className="w-96 bg-tactical-panel border border-tactical-border rounded-sm p-4">
           {selectedAsset ? (
             <AssetDetails asset={selectedAsset} />
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-tactical-muted opacity-50">
               <Target size={64} strokeWidth={1} />
               <p className="mt-4 font-mono text-sm">SELECT TARGET ON RADAR</p>
             </div>
           )}
        </div>
      </main>
    </div>
  );
}
