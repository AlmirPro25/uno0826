import { useEffect, useState } from 'react'
import { Wifi, WifiOff, Users, RefreshCw, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useP2PStore } from '@/stores/p2pStore'

// ============================================================================
// Connection Status Bar - Status da conexão P2P em tempo real
// ============================================================================

type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error'

export function ConnectionStatus() {
  const { localPeerId, connectedPeers, apiStatus } = useP2PStore()
  const [state, setState] = useState<ConnectionState>('connecting')
  const [isExpanded, setIsExpanded] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  // Check connection status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/v1/status')
        if (res.ok) {
          const data = await res.json()
          useP2PStore.setState({ 
            localPeerId: data.peer_id,
            apiStatus: data 
          })
          setState('connected')
        } else {
          setState('error')
        }
      } catch {
        setState('disconnected')
      }
      setLastCheck(new Date())
    }

    checkStatus()
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  // Fetch peers periodically
  useEffect(() => {
    if (state !== 'connected') return

    const fetchPeers = async () => {
      try {
        const res = await fetch('/api/v1/peers')
        if (res.ok) {
          const data = await res.json()
          useP2PStore.setState({ connectedPeers: data.connected_peers || [] })
        }
      } catch { /* ignore */ }
    }

    fetchPeers()
    const interval = setInterval(fetchPeers, 5000)
    return () => clearInterval(interval)
  }, [state])

  const stateConfig = {
    connected: {
      icon: Wifi,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      label: 'Conectado',
    },
    connecting: {
      icon: RefreshCw,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
      label: 'Conectando...',
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-red-400',
      bg: 'bg-red-500/20',
      label: 'Desconectado',
    },
    error: {
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
      label: 'Erro',
    },
  }

  const config = stateConfig[state]
  const Icon = config.icon

  // Minimal indicator (always visible)
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "fixed top-16 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
          config.bg, config.color
        )}
      >
        <Icon size={14} className={state === 'connecting' ? 'animate-spin' : ''} />
        <span className="text-xs font-medium">{connectedPeers.length}</span>
        <Users size={12} />
      </button>
    )
  }

  // Expanded panel
  return (
    <div className="fixed top-16 right-4 z-40 w-72 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(false)}
        className={cn(
          "flex items-center justify-between p-3 cursor-pointer",
          config.bg
        )}
      >
        <div className="flex items-center gap-2">
          <Icon size={18} className={cn(config.color, state === 'connecting' && 'animate-spin')} />
          <span className={cn("font-semibold text-sm", config.color)}>{config.label}</span>
        </div>
        <span className="text-xs text-gray-400">Toque para fechar</span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Peer ID */}
        {localPeerId && (
          <div>
            <p className="text-xs text-gray-500 mb-1">SEU PEER ID</p>
            <code className="text-xs text-cyan-400 font-mono block truncate">
              {localPeerId}
            </code>
          </div>
        )}

        {/* Connected Peers */}
        <div>
          <p className="text-xs text-gray-500 mb-1">PEERS CONECTADOS</p>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <span className="text-lg font-bold text-white">{connectedPeers.length}</span>
            {connectedPeers.length > 0 && (
              <div className="flex -space-x-2">
                {connectedPeers.slice(0, 3).map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400/50 to-purple-500/50 border-2 border-black flex items-center justify-center"
                  >
                    <span className="text-[10px] font-bold">P</span>
                  </div>
                ))}
                {connectedPeers.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-white/10 border-2 border-black flex items-center justify-center">
                    <span className="text-[10px]">+{connectedPeers.length - 3}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Uptime */}
        {apiStatus?.uptime_seconds && (
          <div>
            <p className="text-xs text-gray-500 mb-1">UPTIME</p>
            <span className="text-sm text-white">
              {Math.floor(apiStatus.uptime_seconds / 60)} minutos
            </span>
          </div>
        )}

        {/* Last check */}
        {lastCheck && (
          <p className="text-[10px] text-gray-600">
            Última verificação: {lastCheck.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  )
}
