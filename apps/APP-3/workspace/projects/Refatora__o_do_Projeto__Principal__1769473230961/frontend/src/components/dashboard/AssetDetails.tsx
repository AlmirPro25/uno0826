
import { Asset, Manifest, SecurityLog } from '@/types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Lock, Thermometer, Battery, Globe, FileText, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Props {
  asset: Asset;
}

export function AssetDetails({ asset }: Props) {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [loadingLock, setLoadingLock] = useState(false);

  useEffect(() => {
    // Fetch manifests when asset changes
    api.get(`/assets/${asset.id}/manifest`)
       .then(res => setManifests(res.data))
       .catch(err => console.error(err));
  }, [asset.id]);

  const handleLockdown = async () => {
    if (!confirm('WARNING: INITIATING PROTOCOL 0X99 (LOCKDOWN). CONFIRM?')) return;
    setLoadingLock(true);
    try {
      await api.post(`/assets/${asset.id}/lockdown`, {});
    } catch (e) {
      alert("PROTOCOL FAILURE");
    } finally {
      setLoadingLock(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto p-1">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-tactical-border pb-4">
        <div>
          <h2 className="text-2xl font-bold font-mono text-white">{asset.codename}</h2>
          <div className="flex gap-2 mt-2">
            <Badge variant={asset.status === 'CLEARED' ? 'success' : asset.status === 'LOCKED_DOWN' ? 'danger' : 'warning'}>
              {asset.status.replace('_', ' ')}
            </Badge>
            <Badge variant="neutral">{asset.type}</Badge>
          </div>
        </div>
        <div className="text-right font-mono text-xs text-tactical-muted">
           <p>ID: {asset.id.slice(0, 8)}...</p>
           <p>UPDATED: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-tactical-panel border border-tactical-border p-4 rounded-sm">
           <div className="flex items-center gap-2 text-tactical-muted mb-2 text-xs uppercase">
             <Thermometer size={14} /> Cargo Temp
           </div>
           <div className="text-2xl font-mono text-white">{asset.temperature}°C</div>
        </div>
        <div className="bg-tactical-panel border border-tactical-border p-4 rounded-sm">
           <div className="flex items-center gap-2 text-tactical-muted mb-2 text-xs uppercase">
             <Battery size={14} /> Battery
           </div>
           <div className={`text-2xl font-mono ${asset.battery < 20 ? 'text-tactical-orange' : 'text-tactical-green'}`}>
             {asset.battery}%
           </div>
        </div>
        <div className="col-span-2 bg-tactical-panel border border-tactical-border p-4 rounded-sm">
           <div className="flex items-center gap-2 text-tactical-muted mb-2 text-xs uppercase">
             <Globe size={14} /> Vector
           </div>
           <div className="flex justify-between font-mono text-sm text-white">
             <span>ORIGIN: {asset.origin}</span>
             <span>>>></span>
             <span>DEST: {asset.destination}</span>
           </div>
        </div>
      </div>

      {/* Manifest Vault */}
      <div className="flex-1 bg-tactical-panel border border-tactical-border p-4 rounded-sm min-h-[150px]">
        <h3 className="text-xs font-bold text-tactical-muted uppercase flex items-center gap-2 mb-4">
          <FileText size={14} /> Digital Vault
        </h3>
        <div className="space-y-2">
          {manifests.length === 0 ? (
            <div className="text-xs font-mono text-tactical-muted text-center py-4">NO DIGITAL MANIFESTS FOUND</div>
          ) : (
            manifests.map(m => (
              <div key={m.id} className="text-xs font-mono p-2 border border-tactical-border/50 bg-black/20 hover:bg-tactical-green/5 cursor-pointer transition-colors">
                <div className="flex justify-between text-tactical-green">
                  <span>{m.title}</span>
                  <span>[{m.clearance}]</span>
                </div>
                <div className="text-tactical-muted truncate mt-1">{m.content}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Zone */}
      <div className="mt-auto pt-4 border-t border-tactical-border">
         {asset.status === 'LOCKED_DOWN' ? (
           <div className="w-full bg-red-900/20 border border-red-500/50 p-4 text-center text-red-500 font-mono font-bold animate-pulse">
             ASSET LOCKED DOWN
           </div>
         ) : (
           <Button 
            variant="danger" 
            className="w-full gap-2" 
            onClick={handleLockdown}
            disabled={loadingLock}
           >
             <Lock size={16} /> 
             {loadingLock ? 'INITIATING...' : 'INITIATE LOCKDOWN PROTOCOL'}
           </Button>
         )}
      </div>
    </div>
  );
}
