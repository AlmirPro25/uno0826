import { useCallback, useRef, useState } from 'react'

// ============================================================================
// NEXUS P2P WebRTC Hook - Adaptado do APP-1 para usar Lighthouse
// ============================================================================

interface ICEServer {
  urls: string | string[]
  username?: string
  credential?: string
}

interface UseWebRTCOptions {
  lighthouseUrl?: string
  onRemoteStream?: (stream: MediaStream) => void
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  onError?: (error: string) => void
}

type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'connecting'

export function useWebRTC(options: UseWebRTCOptions = {}) {
  const { lighthouseUrl, onRemoteStream, onConnectionStateChange, onError } = options

  // State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [quality, setQuality] = useState<ConnectionQuality>('connecting')
  const [connectionType, setConnectionType] = useState<string>('unknown')

  // Refs
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const makingOffer = useRef(false)
  const isPolite = useRef(false)
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([])
  const statsInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // Buscar ICE servers do Lighthouse
  const getIceServers = useCallback(async (): Promise<ICEServer[]> => {
    const baseServers: ICEServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]

    if (lighthouseUrl) {
      try {
        const res = await fetch(`${lighthouseUrl}/api/v1/lighthouse/relays`)
        if (res.ok) {
          const data = await res.json()
          if (data.relays?.length > 0) {
            return [...baseServers, ...data.relays]
          }
        }
      } catch (e) {
        console.warn('⚠️ Could not fetch TURN from Lighthouse, using fallback')
      }
    }

    // Fallback TURN público
    return [
      ...baseServers,
      {
        urls: ['turn:a.relay.metered.ca:80', 'turn:a.relay.metered.ca:443'],
        username: 'e8dd65c92f6f1f2d5c67c7a3',
        credential: 'kW3QfUZKpLqYhDzS'
      }
    ]
  }, [lighthouseUrl])

  // Quality Monitor
  const startQualityMonitor = useCallback(() => {
    if (statsInterval.current) clearInterval(statsInterval.current)

    statsInterval.current = setInterval(async () => {
      const pc = pcRef.current
      if (!pc || pc.connectionState !== 'connected') return

      try {
        const stats = await pc.getStats()
        let packetsLost = 0, packetsReceived = 0, rtt = 0
        let connType = 'unknown'

        stats.forEach((report: RTCStats & { packetsLost?: number; packetsReceived?: number; currentRoundTripTime?: number; candidateType?: string }) => {
          if (report.type === 'inbound-rtp') {
            packetsLost = report.packetsLost || 0
            packetsReceived = report.packetsReceived || 0
          }
          if (report.type === 'candidate-pair') {
            rtt = report.currentRoundTripTime || 0
          }
          if (report.type === 'local-candidate') {
            connType = report.candidateType || connType
          }
        })

        setConnectionType(connType)

        const lossRate = packetsReceived > 0 ? packetsLost / packetsReceived : 0
        if (lossRate < 0.01 && rtt < 0.15) setQuality('excellent')
        else if (lossRate < 0.05 && rtt < 0.3) setQuality('good')
        else setQuality('poor')
      } catch { /* ignore */ }
    }, 5000)
  }, [])

  const stopQualityMonitor = useCallback(() => {
    if (statsInterval.current) {
      clearInterval(statsInterval.current)
      statsInterval.current = null
    }
  }, [])

  // Start local media
  const startMedia = useCallback(async (video = true, audio = true): Promise<MediaStream | null> => {
    if (localStreamRef.current) return localStreamRef.current

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false
      })

      localStreamRef.current = stream
      setLocalStream(stream)
      setCameraEnabled(video && stream.getVideoTracks().length > 0)
      setMicEnabled(audio && stream.getAudioTracks().length > 0)
      return stream
    } catch (err) {
      console.error('❌ Media error:', err)
      onError?.('Não foi possível acessar câmera/microfone')
      return null
    }
  }, [onError])

  // Stop local media
  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setCameraEnabled(false)
    setMicEnabled(false)
  }, [])

  // Toggle camera
  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setCameraEnabled(track.enabled)
    }
  }, [])

  // Toggle mic
  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setMicEnabled(track.enabled)
    }
  }, [])

  // Create peer connection
  const createPeerConnection = useCallback(async (polite: boolean): Promise<RTCPeerConnection> => {
    if (pcRef.current && pcRef.current.connectionState !== 'closed') {
      return pcRef.current
    }

    isPolite.current = polite
    const iceServers = await getIceServers()

    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 0,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    })

    // ICE Candidate handler - será enviado via signaling
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        // Emitir evento para o signaling layer
        window.dispatchEvent(new CustomEvent('webrtc:ice', { 
          detail: { candidate: candidate.toJSON() } 
        }))
      }
    }

    // Remote track received
    pc.ontrack = ({ streams }) => {
      const stream = streams[0]
      setRemoteStream(stream)
      onRemoteStream?.(stream)
      startQualityMonitor()
    }

    // Connection state
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      console.log('🔄 WebRTC state:', state)
      onConnectionStateChange?.(state)

      switch (state) {
        case 'connected':
          setIsConnected(true)
          setQuality('good')
          break
        case 'disconnected':
          setQuality('poor')
          break
        case 'failed':
          setQuality('connecting')
          pc.restartIce()
          break
        case 'closed':
          setIsConnected(false)
          setQuality('connecting')
          break
      }
    }

    // Negotiation needed - only for impolite peer
    pc.onnegotiationneeded = async () => {
      if (isPolite.current) return
      if (pc.signalingState !== 'stable') return
      if (makingOffer.current) return

      try {
        makingOffer.current = true
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        
        window.dispatchEvent(new CustomEvent('webrtc:offer', { 
          detail: { sdp: pc.localDescription?.toJSON() } 
        }))
      } catch (err) {
        console.error('❌ Negotiation error:', err)
      } finally {
        makingOffer.current = false
      }
    }

    pcRef.current = pc
    return pc
  }, [getIceServers, onRemoteStream, onConnectionStateChange, startQualityMonitor])

  // Handle incoming offer (Perfect Negotiation - polite peer yields)
  const handleOffer = useCallback(async (sdp: RTCSessionDescriptionInit) => {
    const pc = pcRef.current
    if (!pc) return

    try {
      const offerCollision = makingOffer.current || pc.signalingState !== 'stable'

      if (offerCollision) {
        // Impolite peer ignores collision
        if (!isPolite.current) {
          console.log('⚠️ Ignoring offer (impolite collision)')
          return
        }
        // Polite peer rolls back if needed
        if (pc.signalingState === 'have-local-offer') {
          console.log('🔄 Rollback (polite)')
          await pc.setLocalDescription({ type: 'rollback' })
        }
      }

      console.log('📥 Processing offer')
      await pc.setRemoteDescription(new RTCSessionDescription(sdp))

      // Process pending ICE candidates
      while (pendingCandidates.current.length > 0) {
        const candidate = pendingCandidates.current.shift()
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
        }
      }

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      console.log('📤 Sending answer')
      
      window.dispatchEvent(new CustomEvent('webrtc:answer', { 
        detail: { sdp: pc.localDescription?.toJSON() } 
      }))
    } catch (err) {
      console.error('❌ Offer handling error:', err)
      onError?.('Erro ao processar oferta')
    }
  }, [onError])

  // Handle incoming answer
  const handleAnswer = useCallback(async (sdp: RTCSessionDescriptionInit) => {
    const pc = pcRef.current
    if (!pc) return

    try {
      if (pc.signalingState === 'stable') {
        console.log('⚠️ Ignoring answer (already stable)')
        return
      }

      console.log('📥 Processing answer')
      await pc.setRemoteDescription(new RTCSessionDescription(sdp))

      // Process pending ICE candidates
      while (pendingCandidates.current.length > 0) {
        const candidate = pendingCandidates.current.shift()
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
        }
      }
    } catch (err) {
      console.error('❌ Answer handling error:', err)
      onError?.('Erro ao processar resposta')
    }
  }, [onError])

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = pcRef.current
    if (!pc || !pc.remoteDescription) {
      // Queue candidate if remote description not set yet
      pendingCandidates.current.push(candidate)
      return
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.warn('⚠️ ICE candidate error:', err)
    }
  }, [])

  // Start a call (initiator)
  const startCall = useCallback(async (polite = false): Promise<boolean> => {
    try {
      const stream = await startMedia(true, true)
      if (!stream) return false

      const pc = await createPeerConnection(polite)

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        const senders = pc.getSenders()
        if (!senders.find(s => s.track === track)) {
          pc.addTrack(track, stream)
        }
      })

      // If impolite (initiator), create and send offer
      if (!polite) {
        setTimeout(async () => {
          if (pc.signalingState === 'stable' && !makingOffer.current) {
            try {
              makingOffer.current = true
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              console.log('📤 Initial offer')
              
              window.dispatchEvent(new CustomEvent('webrtc:offer', { 
                detail: { sdp: pc.localDescription?.toJSON() } 
              }))
            } catch (err) {
              console.error('❌ Offer creation error:', err)
            } finally {
              makingOffer.current = false
            }
          }
        }, 500)
      }

      return true
    } catch (err) {
      console.error('❌ Start call error:', err)
      onError?.('Erro ao iniciar chamada')
      return false
    }
  }, [startMedia, createPeerConnection, onError])

  // End the call
  const endCall = useCallback(() => {
    console.log('📴 Ending call')
    stopQualityMonitor()
    
    pcRef.current?.close()
    pcRef.current = null
    
    pendingCandidates.current = []
    makingOffer.current = false
    
    stopMedia()
    setRemoteStream(null)
    setIsConnected(false)
    setQuality('connecting')
  }, [stopMedia, stopQualityMonitor])

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    endCall()
  }, [endCall])

  return {
    // State
    localStream,
    remoteStream,
    cameraEnabled,
    micEnabled,
    isConnected,
    quality,
    connectionType,
    
    // Media controls
    startMedia,
    stopMedia,
    toggleCamera,
    toggleMic,
    
    // Connection
    createPeerConnection,
    startCall,
    endCall,
    cleanup,
    
    // Signaling handlers (to be called by signaling layer)
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  }
}
