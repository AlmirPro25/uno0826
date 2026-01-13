
import React from 'react';
import { Peer } from '@/types/p2p';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MessageSquareIcon, PhoneCallIcon } from 'lucide-react';

interface PeerListProps {
  peers: Peer[];
  onSelectPeer: (peer: Peer) => void;
  onCallPeer: (peer: Peer) => void;
  currentChatPeerId: string | null;
  currentCallPeerId: string | null;
}

export const PeerList: React.FC<PeerListProps> = ({ peers, onSelectPeer, onCallPeer, currentChatPeerId, currentCallPeerId }) => {
  return (
    <div className="overflow-y-auto h-[calc(100vh-20rem)] border border-nexus-grey rounded-md p-2 bg-nexus-black">
      {peers.length === 0 ? (
        <p className="text-nexus-muted-foreground text-center py-4">Nenhum peer conectado. Aguardando descoberta...</p>
      ) : (
        <ul className="space-y-2">
          {peers.map((peer) => (
            <li
              key={peer.ID}
              className={cn(
                "p-3 rounded-md cursor-pointer transition-all duration-200 flex items-center justify-between",
                currentChatPeerId === peer.ID ? "bg-nexus-accent-green/20 border border-nexus-accent-green" : "bg-nexus-grey hover:bg-nexus-grey/70"
              )}
            >
              <div>
                <span className="block text-nexus-light-grey text-sm font-semibold">
                  {peer.Nickname || peer.ID.substring(0, 12) + '...'}
                </span>
                <span className="block text-nexus-muted-foreground text-xs">
                  {peer.Addrs.split(',')[0]} {/* Show first addr */}
                </span>
                <span className="block text-nexus-muted-foreground text-xs">
                  Latência: {peer.LatencyMs >= 0 ? `${peer.LatencyMs} ms` : 'N/A'}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectPeer(peer)}
                  className={cn(
                    "p-1 h-auto w-auto",
                    currentChatPeerId === peer.ID ? "text-nexus-accent-green" : "text-nexus-light-grey hover:text-nexus-accent-green"
                  )}
                  title="Abrir Chat"
                >
                  <MessageSquareIcon size={18} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCallPeer(peer)}
                  className={cn(
                    "p-1 h-auto w-auto",
                    currentCallPeerId === peer.ID ? "text-nexus-error-red animate-pulse" : "text-nexus-light-grey hover:text-nexus-accent-amber"
                  )}
                  title={currentCallPeerId === peer.ID ? "Em Chamada..." : "Iniciar Chamada"}
                  disabled={!!currentCallPeerId && currentCallPeerId !== peer.ID} // Disable if another call is active
                >
                  <PhoneCallIcon size={18} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
