import { useRef, useEffect, useState, useCallback } from 'react'
import { useWebRTC } from '../hooks/useWebRTC'
import { useP2PSignaling } from '../hooks/useP2PSignaling'

// ============================================================================
// NEXUS VideoCall Component - P2P Video usando Lighthouse
// ============================================================================

type ViewMode = 'split' | 'pip-remote' | 'pip-local'
type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'connecting'

interface VideoCallProps {
  peerId: string
  roomId?: string
  lighthouseUrl: string
  onLeave?: () => void
  onError?: (error: string) => void
}

export function VideoCall({ peerId, roomId, lighthouseUrl, onLeave, onError }: VideoCallProps) {
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [showControls, setShowControls] = useState(true)
  const [remoteConnected, setRemoteConnected] = useState(false)
  const [remoteMuted, setRemoteMuted] = useState(false)

  // WebRTC Hook
  const webrtc = useWebRTC({
    lighthouseUrl,
    onRemoteStream: (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
        remoteVideoRef.current.play().catch(() => {})
      }
      setRemoteConnected(true)
      
      // Detect remote mute
      stream.getVideoTracks().forEach(track => {
        track.onmute = () => setRemoteMuted(true)
        track.onunmute = () => setRemoteMuted(false)
      })
    },
    onConnectionStateChange: (state) => {
      if (state === 'connected') setRemoteConnected(true)
      if (state === 'disconnected' || state === 'failed') setRemoteConnected(false)
    },
    onError
  })

  // P2P Signaling Hook
  const signaling = useP2PSignaling({
    lighthouseUrl,
    peerId,
    roomId,
    onPeerJoined: async (remotePeerId) => {
      console.log('👋 Peer joined:', remotePeerId)
      // Start call as initiator
      await webrtc.startCall(false)
    },
    onOffer: async (sdp) => {
      // Start call as polite peer and handle offer
      await webrtc.startCall(true)
      await webrtc.handleOffer(sdp)
    },
    onAnswer: webrtc.handleAnswer,
    onIceCandidate: webrtc.handleIceCandidate,
    onPeerLeft: () => {
      console.log('👋 Peer left')
      webrtc.endCall()
      setRemoteConnected(false)
    },
    onError
  })

  // Set local video when stream is available
  useEffect(() => {
    if (webrtc.localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = webrtc.localStream
      localVideoRef.current.play().catch(() => {})
    }
  }, [webrtc.localStream])

  // Connect to signaling on mount
  useEffect(() => {
    signaling.connect()
    return () => {
      signaling.disconnect()
      webrtc.cleanup()
    }
  }, [])

  // Auto-hide controls
  useEffect(() => {
    if (!remoteConnected) return
    const timer = setTimeout(() => setShowControls(false), 4000)
    return () => clearTimeout(timer)
  }, [remoteConnected, showControls])

  const handleLeave = useCallback(() => {
    webrtc.endCall()
    signaling.disconnect()
    onLeave?.()
  }, [webrtc, signaling, onLeave])

  const cycleViewMode = () => {
    const modes: ViewMode[] = ['split', 'pip-remote', 'pip-local']
    setViewMode(modes[(modes.indexOf(viewMode) + 1) % modes.length])
  }

  const qualityConfig: Record<ConnectionQuality, { color: string; text: string }> = {
    excellent: { color: 'bg-green-500', text: 'Excelente' },
    good: { color: 'bg-yellow-500', text: 'Boa' },
    poor: { color: 'bg-orange-500', text: 'Fraca' },
    connecting: { color: 'bg-cyan-500 animate-pulse', text: 'Conectando...' }
  }

  const quality = webrtc.quality as ConnectionQuality

  return (
    <div 
      className="h-full w-full relative overflow-hidden bg-black"
      onMouseMove={() => setShowControls(true)} 
      onTouchStart={() => setShowControls(true)}
    >
      {/* Connection Status */}
      {signaling.status !== 'connected' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="text-center px-4">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-4 rounded-full border border-cyan-500/30 animate-pulse" />
              <div className="absolute inset-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-cyan-400 mb-2">
              {signaling.status === 'connecting' ? 'Conectando ao Lighthouse...' : 'Aguardando conexão...'}
            </h2>
            <p className="text-gray-400 text-sm">Peer ID: {peerId.slice(0, 12)}...</p>
          </div>
        </div>
      )}

      {/* Waiting for peer */}
      {signaling.status === 'connected' && signaling.connectedPeers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-40">
          <div className="text-center px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center animate-pulse">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Aguardando peer...</h2>
            <p className="text-gray-400 text-sm mb-4">
              {roomId ? `Sala: ${roomId}` : 'Conexão direta P2P'}
            </p>
            <div className="flex justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}

      {/* Quality indicator */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
        <span className={`w-2 h-2 rounded-full ${qualityConfig[quality].color}`} />
        <span className="text-white text-xs">{qualityConfig[quality].text}</span>
        {webrtc.connectionType !== 'unknown' && (
          <span className="text-gray-400 text-xs">({webrtc.connectionType})</span>
        )}
      </div>

      {/* SPLIT VIEW */}
      {viewMode === 'split' && (
        <div className="absolute inset-0 flex flex-col md:flex-row">
          {/* Remote Video */}
          <div className="relative flex-1 min-h-0 border-b md:border-b-0 md:border-r border-white/10 overflow-hidden">
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover bg-black" 
            />
            {!remoteConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center animate-pulse">
                    <span className="text-2xl font-bold text-white">?</span>
                  </div>
                  <p className="text-white font-medium">Conectando...</p>
                </div>
              </div>
            )}
            {remoteMuted && remoteConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-gray-800 flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">Câmera desligada</p>
                </div>
              </div>
            )}
            <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/50 flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${remoteConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-white text-xs">Peer</span>
            </div>
          </div>

          {/* Local Video */}
          <div className="relative flex-1 min-h-0 overflow-hidden">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover bg-black" 
              style={{ transform: 'scaleX(-1)' }} 
            />
            <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/50 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span className="text-white text-xs">Você</span>
            </div>
          </div>
        </div>
      )}

      {/* PIP Remote */}
      {viewMode === 'pip-remote' && (
        <div className="absolute inset-0">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {!remoteConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">?</span>
              </div>
            </div>
          )}
          <div className="absolute bottom-20 right-4 w-28 h-36 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          </div>
        </div>
      )}

      {/* PIP Local */}
      {viewMode === 'pip-local' && (
        <div className="absolute inset-0">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          <div className="absolute bottom-20 right-4 w-28 h-36 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <div className={`absolute inset-x-0 bottom-0 z-30 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-gradient-to-t from-black via-black/80 to-transparent pt-8 pb-6 px-4">
          <div className="flex items-center justify-center gap-3">
            {/* Toggle Camera */}
            <button
              onClick={webrtc.toggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                webrtc.cameraEnabled 
                  ? 'bg-white/20 hover:bg-white/30' 
                  : 'bg-red-500/80 hover:bg-red-500'
              }`}
            >
              {webrtc.cameraEnabled ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )}
            </button>

            {/* Toggle Mic */}
            <button
              onClick={webrtc.toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                webrtc.micEnabled 
                  ? 'bg-white/20 hover:bg-white/30' 
                  : 'bg-red-500/80 hover:bg-red-500'
              }`}
            >
              {webrtc.micEnabled ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>

            {/* View Mode */}
            <button
              onClick={cycleViewMode}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </button>

            {/* Leave */}
            <button
              onClick={handleLeave}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg shadow-red-500/30"
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
