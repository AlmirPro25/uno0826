import { useState } from 'react';
import { Edit2, Copy, Check, Shield, Zap, Settings, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useP2PStore } from '@/stores/p2pStore';
import { useKernelStore } from '@/stores/kernelStore';

export function ProfilePage() {
  const { localPeerId } = useP2PStore();
  const { enabled: kernelEnabled, linked, user, limits } = useKernelStore();
  const [copied, setCopied] = useState(false);
  const [nickname, setNickname] = useState(() => localStorage.getItem('nexus_nickname') || '');
  const [isEditing, setIsEditing] = useState(false);

  const copyPeerId = async () => {
    if (localPeerId) {
      await navigator.clipboard.writeText(localPeerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const saveNickname = () => {
    localStorage.setItem('nexus_nickname', nickname);
    setIsEditing(false);
  };

  const stats = [
    { label: 'Posts', value: 12 },
    { label: 'Seguidores', value: 48 },
    { label: 'Seguindo', value: 23 },
  ];

  const isPro = limits.video_calls && limits.max_peers < 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Profile Header */}
      <div className="text-center mb-6">
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 p-1">
            <div className="w-full h-full rounded-full bg-[#0d0d15] flex items-center justify-center">
              <Zap size={36} className="text-cyan-400" />
            </div>
          </div>
          {isPro && (
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center border-4 border-[#0d0d15]">
              <Crown size={14} className="text-black" />
            </div>
          )}
        </div>

        {/* Name */}
        {isEditing ? (
          <div className="flex items-center justify-center gap-2 mb-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Seu apelido"
              className="bg-white/10 rounded-lg px-3 py-1.5 text-center outline-none focus:ring-2 focus:ring-cyan-500/50"
              autoFocus
            />
            <button
              onClick={saveNickname}
              className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
            >
              <Check size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-xl font-bold">{nickname || 'Anônimo'}</h1>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
            >
              <Edit2 size={14} />
            </button>
          </div>
        )}

        {/* Peer ID */}
        <button
          onClick={copyPeerId}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <code className="text-xs text-gray-400 font-mono">
            {localPeerId?.slice(0, 8)}...{localPeerId?.slice(-6)}
          </code>
          {copied ? (
            <Check size={12} className="text-emerald-400" />
          ) : (
            <Copy size={12} className="text-gray-500" />
          )}
        </button>

        {/* Plan Badge */}
        {kernelEnabled && (
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-3",
            isPro 
              ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400"
              : "bg-white/10 text-gray-400"
          )}>
            {isPro ? <Crown size={12} /> : <Shield size={12} />}
            Plano {isPro ? 'Pro' : 'Free'}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat, i) => (
          <div key={i} className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Kernel Integration */}
      {kernelEnabled && (
        <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-cyan-400" />
              <span className="font-semibold">Prost-QS</span>
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs",
              linked ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"
            )}>
              {linked ? 'Vinculado' : 'Não vinculado'}
            </span>
          </div>

          {user ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-300">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Faça login para sincronizar seu perfil e desbloquear recursos premium
            </p>
          )}

          <a
            href="#settings"
            onClick={() => window.location.hash = 'settings'}
            className="mt-3 w-full py-2 rounded-xl bg-white/10 text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
          >
            <Settings size={14} />
            Configurar
          </a>
        </div>
      )}

      {/* Limits */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6">
        <p className="text-xs text-gray-500 mb-3">LIMITES DO PLANO</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-black/30">
            <p className="text-xs text-gray-500">Peers</p>
            <p className="font-bold">{limits.max_peers < 0 ? '∞' : limits.max_peers}</p>
          </div>
          <div className="p-3 rounded-lg bg-black/30">
            <p className="text-xs text-gray-500">Arquivo</p>
            <p className="font-bold">{limits.max_file_size_mb < 0 ? '∞' : `${limits.max_file_size_mb}MB`}</p>
          </div>
          <div className="p-3 rounded-lg bg-black/30">
            <p className="text-xs text-gray-500">Comunidades</p>
            <p className="font-bold">{limits.max_communities < 0 ? '∞' : limits.max_communities}</p>
          </div>
          <div className="p-3 rounded-lg bg-black/30">
            <p className="text-xs text-gray-500">Vídeo</p>
            <p className={cn("font-bold", limits.video_calls ? "text-emerald-400" : "text-red-400")}>
              {limits.video_calls ? 'Sim' : 'Não'}
            </p>
          </div>
        </div>

        {!isPro && (
          <button className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <Crown size={16} />
            Fazer Upgrade para Pro
          </button>
        )}
      </div>

      {/* Security Info */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
        <p className="text-xs text-gray-500 mb-3">SEGURANÇA</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Shield size={14} className="text-emerald-400" />
            <span>Identidade Ed25519</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield size={14} className="text-emerald-400" />
            <span>Criptografia TLS/Noise</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield size={14} className="text-emerald-400" />
            <span>Storage SQLCipher</span>
          </div>
        </div>
      </div>
    </div>
  );
}
