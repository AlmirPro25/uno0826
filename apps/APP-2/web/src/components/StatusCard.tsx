
import React from 'react';
import { ServerIcon, WifiIcon, GitCommitIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { P2PNodeStatus } from '@/types/p2p';

interface StatusCardProps {
  localPeerId: string | null;
  apiStatus: P2PNodeStatus | null;
  isConnectedToMesh: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({ localPeerId, apiStatus, isConnectedToMesh }) => {
  const connectionStatusClass = isConnectedToMesh ? 'text-nexus-success-green' : 'text-nexus-error-red';
  const connectionStatusText = isConnectedToMesh ? 'CONECTADO' : 'DESCONECTADO';

  return (
    <div className="bg-nexus-black p-4 rounded-md border border-nexus-grey shadow-lg">
      <h2 className="text-xl font-semibold mb-3 text-nexus-light-grey flex items-center">
        <ServerIcon className="mr-2" size={20} /> STATUS DO NÓ
      </h2>
      <div className="text-sm space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-nexus-muted-foreground">Peer ID:</span>
          <span className="text-nexus-accent-amber font-mono text-xs break-all">{localPeerId || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-nexus-muted-foreground">Endereços:</span>
          <span className="text-nexus-light-grey font-mono text-xs break-all">
            {apiStatus?.listen_addrs && apiStatus.listen_addrs.length > 0 ? apiStatus.listen_addrs[0] : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-nexus-muted-foreground">Malha:</span>
          <span className={cn("font-bold", connectionStatusClass)}>
            <WifiIcon className="inline-block mr-1" size={16} /> {connectionStatusText}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-nexus-muted-foreground">Uptime:</span>
          <span className="text-nexus-light-grey font-mono text-xs">
            {apiStatus?.uptime_seconds ? `${Math.round(apiStatus.uptime_seconds)} s` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-nexus-muted-foreground">Versão:</span>
          <span className="text-nexus-light-grey font-mono text-xs flex items-center">
            <GitCommitIcon className="inline-block mr-1" size={16} /> {apiStatus?.version || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};
