import { useEffect, useState } from 'react'
import { useP2PStore } from '@/stores/p2pStore'
import { VideoCall } from './VideoCall'
import { X, Phone } from 'lucide-react'

// ============================================================================
// Call Overlay - Overlay global para chamadas P2P
// ============================================================================

const LIGHTHOUSE_URL = import.meta.env.VITE_LIGHTHOUSE_URL || 'http://localhost:8080'

interface CallOverlayProps {
  onMinimize?: () => void
}

export function CallOverlay({ onMinimize }: CallOverlayProps) {
  const { localPeerId, call, endCall } = useP2PStore()

  // Prevenir scroll quando em chamada
  useEffect(() => {
    if (call.isInCall) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [call.isInCall])

  if (!call.isInCall || !localPeerId) return null

  const roomId = call.roomId || `call-${localPeerId}-${call.remotePeerId}`

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Video Call Component */}
      <VideoCall
        peerId={localPeerId}
        roomId={roomId}
        lighthouseUrl={LIGHTHOUSE_URL}
        onLeave={endCall}
        onError={(error) => {
          console.error('Call error:', error)
          endCall()
        }}
      />

      {/* Top bar with controls */}
      <div className="absolute top-0 left-0 right-0 z-[110] p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={endCall}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Fechar chamada"
          >
            <X size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-medium">
              {call.callType === 'video' ? 'Chamada de vídeo' : 'Chamada de voz'}
            </span>
          </div>
        </div>

        {onMinimize && (
          <button
            onClick={onMinimize}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Minimizar"
          >
            <Phone size={20} className="text-white" />
          </button>
        )}
      </div>

      {/* Call duration */}
      {call.startedAt && (
        <CallDuration startedAt={call.startedAt} />
      )}
    </div>
  )
}

// Componente para mostrar duração da chamada
function CallDuration({ startedAt }: { startedAt: Date }) {
  const [duration, setDuration] = useState('00:00')

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startedAt.getTime()) / 1000)
      const mins = Math.floor(diff / 60).toString().padStart(2, '0')
      const secs = (diff % 60).toString().padStart(2, '0')
      setDuration(`${mins}:${secs}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [startedAt])

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[110]">
      <div className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
        <span className="text-white text-sm font-mono">{duration}</span>
      </div>
    </div>
  )
}
