import { useState } from 'react';
import { Users, Globe, Wifi, WifiOff, Copy, Check, RefreshCw, Zap, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useP2PStore } from '@/stores/p2pStore';

export function CommunityPage() {
  const { localPeerId, connectedPeers, apiStatus } = useP2PStore();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'peers' | 'network'>('peers');

  const copyPeerId = async () => {
    if (localPeerId) {
      await navigator.clipboard.writeText(localPeerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const refreshPeers = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/peers');
      const data = await res.json();
      useP2PStore.setState({ connectedPeers: data.connected_peers || [] });
    } catch (e) {
      console.error('Failed to refresh peers:', e);
    }
    setIsRefreshing(false);
  };

  const stats = [
    { label: 'Peers Ativos', value: connectedPeers.length, icon: Users, color: 'cyan' },
    { label: 'Uptime', value: apiStatus?.uptime_seconds ? `${Math.floor(apiStatus.uptime_seconds / 60)}m` : '0m', icon: Activity, color: 'emerald' },
    { label: 'Protocolos', value: '4', icon: Shield, color: 'purple' },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Your Node Card */}
      <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <Zap size={24} className="text-black" />
            </div>
            <div>
              <p className="font-bold text-lg">Seu Nó</p>
              <p className="text-xs text-gray-400">Nexus v{apiStatus?.version || '0.1.0'}</p>
            </div>
          </div>
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5",
            connectedPeers.length > 0 
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-yellow-500/20 text-yellow-400"
          )}>
            {connectedPeers.length > 0 ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connectedPeers.length > 0 ? 'Conectado' : 'Descobrindo...'}
          </div>
        </div>

        {/* Peer ID */}
        <div className="bg-black/30 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">PEER ID</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-cyan-400 font-mono flex-1 truncate">
              {localPeerId || 'Carregando...'}
            </code>
            <button
              onClick={copyPeerId}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-black/30 rounded-xl p-3 text-center">
                <Icon size={18} className={cn(
                  "mx-auto mb-1",
                  stat.color === 'cyan' && "text-cyan-400",
                  stat.color === 'emerald' && "text-emerald-400",
                  stat.color === 'purple' && "text-purple-400"
                )} />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('peers')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
            activeTab === 'peers'
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "bg-white/5 text-gray-400 border border-white/10"
          )}
        >
          <Users size={16} className="inline mr-2" />
          Peers ({connectedPeers.length})
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
            activeTab === 'network'
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "bg-white/5 text-gray-400 border border-white/10"
          )}
        >
          <Globe size={16} className="inline mr-2" />
          Rede
        </button>
      </div>

      {/* Peers Tab */}
      {activeTab === 'peers' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">PEERS CONECTADOS</p>
            <button
              onClick={refreshPeers}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
            </button>
          </div>

          {connectedPeers.length > 0 ? (
            <div className="space-y-2">
              {connectedPeers.map((peer, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/50 to-purple-500/50 flex items-center justify-center relative">
                    <span className="font-bold text-sm">{peer.Nickname?.[0] || 'P'}</span>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d0d15]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{peer.Nickname || 'Peer Anônimo'}</p>
                    <p className="text-xs text-gray-500 font-mono truncate">{peer.ID}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-400">Online</p>
                    <p className="text-[10px] text-gray-500">{peer.LatencyMs || '< 50'}ms</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Users size={28} className="text-gray-500" />
              </div>
              <h3 className="font-semibold mb-2">Nenhum peer conectado</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Aguardando descoberta de peers na rede local (mDNS) ou via DHT...
              </p>
              <button
                onClick={refreshPeers}
                className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors"
              >
                <RefreshCw size={14} className="inline mr-2" />
                Buscar Peers
              </button>
            </div>
          )}
        </div>
      )}

      {/* Network Tab */}
      {activeTab === 'network' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-gray-500 mb-3">ENDEREÇOS DE ESCUTA</p>
            <div className="space-y-2">
              {apiStatus?.listen_addrs?.map((addr: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <code className="text-xs text-gray-300 font-mono">{addr}</code>
                </div>
              )) || (
                <p className="text-sm text-gray-500">Carregando...</p>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-gray-500 mb-3">PROTOCOLOS ATIVOS</p>
            <div className="flex flex-wrap gap-2">
              {['mDNS', 'DHT Kademlia', 'GossipSub', 'WebRTC'].map((proto, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium"
                >
                  {proto}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-gray-500 mb-3">SEGURANÇA</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-emerald-400" />
                <span className="text-sm">TLS/Noise (transporte)</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-emerald-400" />
                <span className="text-sm">Ed25519 (identidade)</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-emerald-400" />
                <span className="text-sm">SQLCipher (storage)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
