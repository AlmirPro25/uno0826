import { useEffect } from 'react'
import { Phone, PhoneOff, Video, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Incoming Call Modal - Receber chamadas P2P
// ============================================================================

interface IncomingCallProps {
  callerName: string
  callerPeerId: string
  callType: 'audio' | 'video'
  onAccept: () => void
  onReject: () => void
}

export function IncomingCall({ callerName, callerPeerId, callType, onAccept, onReject }: IncomingCallProps) {
  // Vibrar se disponível
  useEffect(() => {
    if ('vibrate' in navigator) {
      const interval = setInterval(() => {
        navigator.vibrate([200, 100, 200])
      }, 2000)
      return () => {
        clearInterval(interval)
        navigator.vibrate(0)
      }
    }
  }, [])

  // Auto-rejeitar após 30 segundos
  useEffect(() => {
    const timeout = setTimeout(() => {
      onReject()
    }, 30000)
    return () => clearTimeout(timeout)
  }, [onReject])

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center">
      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 rounded-full border border-cyan-500/20 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute w-64 h-64 rounded-full border border-cyan-500/10 animate-ping" style={{ animationDuration: '2.5s' }} />
        <div className="absolute w-80 h-80 rounded-full border border-cyan-500/5 animate-ping" style={{ animationDuration: '3s' }} />
      </div>

      <div className="relative z-10 text-center px-8">
        {/* Caller Avatar */}
        <div className="relative inline-block mb-6">
          <div className={cn(
            "w-28 h-28 rounded-full flex items-center justify-center animate-pulse",
            "bg-gradient-to-br from-cyan-400 to-purple-500"
          )}>
            <User size={48} className="text-black" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
            <span className="text-xs text-gray-300">
              {callType === 'video' ? 'Chamada de vídeo' : 'Chamada de voz'}
            </span>
          </div>
        </div>

        {/* Caller Info */}
        <h2 className="text-2xl font-bold text-white mb-2">{callerName}</h2>
        <p className="text-sm text-gray-400 mb-8 font-mono">
          {callerPeerId.slice(0, 12)}...
        </p>

        {/* Call Status */}
        <p className="text-cyan-400 mb-8 animate-pulse">
          Chamada recebida...
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6">
          {/* Reject */}
          <button
            onClick={onReject}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg shadow-red-500/30 hover:scale-110"
          >
            <PhoneOff size={28} className="text-white" />
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110",
              "bg-gradient-to-r from-emerald-400 to-cyan-500 shadow-emerald-500/30"
            )}
          >
            {callType === 'video' ? (
              <Video size={32} className="text-black" />
            ) : (
              <Phone size={32} className="text-black" />
            )}
          </button>
        </div>

        {/* Swipe hint */}
        <p className="text-xs text-gray-500 mt-8">
          Deslize para cima para aceitar
        </p>
      </div>
    </div>
  )
}
