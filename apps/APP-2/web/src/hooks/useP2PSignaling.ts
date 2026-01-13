import { useCallback, useEffect, useRef, useState } from 'react'

// ============================================================================
// NEXUS P2P Signaling Hook - Usa Lighthouse para descoberta e sinalização
// ============================================================================

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice' | 'join' | 'leave' | 'peer_joined' | 'peer_left'
  from: string
  to?: string
  payload?: unknown
}

interface UseP2PSignalingOptions {
  lighthouseUrl: string
  peerId: string
  roomId?: string
  onPeerJoined?: (peerId: string) => void
  onPeerLeft?: (peerId: string) => void
  onOffer?: (sdp: RTCSessionDescriptionInit, from: string) => void
  onAnswer?: (sdp: RTCSessionDescriptionInit, from: string) => void
  onIceCandidate?: (candidate: RTCIceCandidateInit, from: string) => void
  onError?: (error: string) => void
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export function useP2PSignaling(options: UseP2PSignalingOptions) {
  const {
    lighthouseUrl,
    peerId,
    roomId,
    onPeerJoined,
    onPeerLeft,
    onOffer,
    onAnswer,
    onIceCandidate,
    onError
  } = options

  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [connectedPeers, setConnectedPeers] = useState<string[]>([])
  const [isInitiator, setIsInitiator] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // Announce presence to Lighthouse
  const announceToLighthouse = useCallback(async () => {
    try {
      const response = await fetch(`${lighthouseUrl}/api/v1/lighthouse/announce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peer_id: peerId,
          multiaddrs: [], // WebRTC peers don't have multiaddrs
          capabilities: {
            relay_capable: false,
            nat_type: 'unknown'
          },
          region: 'browser'
        })
      })

      if (!response.ok) {
        console.warn('⚠️ Failed to announce to lighthouse')
      } else {
        console.log('✅ Announced to lighthouse')
      }
    } catch (err) {
      console.warn('⚠️ Lighthouse announce error:', err)
    }
  }, [lighthouseUrl, peerId])

  // Start heartbeat to keep presence alive
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) return

    heartbeatInterval.current = setInterval(async () => {
      try {
        await fetch(`${lighthouseUrl}/api/v1/lighthouse/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ peer_id: peerId })
        })
      } catch { /* ignore */ }
    }, 30000) // Every 30 seconds
  }, [lighthouseUrl, peerId])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current)
      heartbeatInterval.current = null
    }
  }, [])

  // Connect to signaling WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setStatus('connecting')

    // Use WebSocket endpoint from lighthouse or fallback
    const wsUrl = lighthouseUrl.replace('http', 'ws') + '/ws/signaling'
    
    try {
      const ws = new WebSocket(`${wsUrl}?peer_id=${peerId}${roomId ? `&room=${roomId}` : ''}`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('🔗 Signaling connected')
        setStatus('connected')
        reconnectAttempts.current = 0
        
        // Announce to lighthouse
        announceToLighthouse()
        startHeartbeat()

        // Join room if specified
        if (roomId) {
          ws.send(JSON.stringify({
            type: 'join',
            from: peerId,
            payload: { room: roomId }
          }))
        }
      }

      ws.onmessage = (event) => {
        try {
          const msg: SignalingMessage = JSON.parse(event.data)
          
          // Ignore messages from self
          if (msg.from === peerId) return

          switch (msg.type) {
            case 'peer_joined':
              console.log('👋 Peer joined:', msg.from)
              setConnectedPeers(prev => [...prev.filter(p => p !== msg.from), msg.from])
              setIsInitiator(true) // First peer is initiator
              onPeerJoined?.(msg.from)
              break

            case 'peer_left':
              console.log('👋 Peer left:', msg.from)
              setConnectedPeers(prev => prev.filter(p => p !== msg.from))
              onPeerLeft?.(msg.from)
              break

            case 'offer':
              console.log('📥 Received offer from:', msg.from)
              setIsInitiator(false) // Receiver is polite
              onOffer?.(msg.payload as RTCSessionDescriptionInit, msg.from)
              break

            case 'answer':
              console.log('📥 Received answer from:', msg.from)
              onAnswer?.(msg.payload as RTCSessionDescriptionInit, msg.from)
              break

            case 'ice':
              onIceCandidate?.(msg.payload as RTCIceCandidateInit, msg.from)
              break
          }
        } catch (err) {
          console.error('❌ Message parse error:', err)
        }
      }

      ws.onerror = () => {
        console.error('❌ Signaling error')
        setStatus('error')
        onError?.('Erro de conexão com signaling')
      }

      ws.onclose = () => {
        console.log('🔌 Signaling disconnected')
        setStatus('disconnected')
        stopHeartbeat()

        // Auto-reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`🔄 Reconnecting in ${delay}ms...`)
          setTimeout(connect, delay)
        }
      }
    } catch (err) {
      console.error('❌ WebSocket creation error:', err)
      setStatus('error')
      onError?.('Não foi possível conectar ao signaling')
    }
  }, [lighthouseUrl, peerId, roomId, announceToLighthouse, startHeartbeat, stopHeartbeat, onPeerJoined, onPeerLeft, onOffer, onAnswer, onIceCandidate, onError])

  // Disconnect from signaling
  const disconnect = useCallback(() => {
    stopHeartbeat()
    
    if (wsRef.current) {
      // Send leave message
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'leave',
          from: peerId
        }))
      }
      wsRef.current.close()
      wsRef.current = null
    }
    
    setStatus('disconnected')
    setConnectedPeers([])
  }, [peerId, stopHeartbeat])

  // Send signaling message
  const sendSignal = useCallback((type: 'offer' | 'answer' | 'ice', payload: unknown, to?: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot send signal: not connected')
      return false
    }

    const msg: SignalingMessage = {
      type,
      from: peerId,
      to,
      payload
    }

    wsRef.current.send(JSON.stringify(msg))
    return true
  }, [peerId])

  // Send offer
  const sendOffer = useCallback((sdp: RTCSessionDescriptionInit, to?: string) => {
    return sendSignal('offer', sdp, to)
  }, [sendSignal])

  // Send answer
  const sendAnswer = useCallback((sdp: RTCSessionDescriptionInit, to?: string) => {
    return sendSignal('answer', sdp, to)
  }, [sendSignal])

  // Send ICE candidate
  const sendIceCandidate = useCallback((candidate: RTCIceCandidateInit, to?: string) => {
    return sendSignal('ice', candidate, to)
  }, [sendSignal])

  // Listen for WebRTC events and forward to signaling
  useEffect(() => {
    const handleOffer = (e: CustomEvent) => {
      sendOffer(e.detail.sdp)
    }
    const handleAnswer = (e: CustomEvent) => {
      sendAnswer(e.detail.sdp)
    }
    const handleIce = (e: CustomEvent) => {
      sendIceCandidate(e.detail.candidate)
    }

    window.addEventListener('webrtc:offer', handleOffer as EventListener)
    window.addEventListener('webrtc:answer', handleAnswer as EventListener)
    window.addEventListener('webrtc:ice', handleIce as EventListener)

    return () => {
      window.removeEventListener('webrtc:offer', handleOffer as EventListener)
      window.removeEventListener('webrtc:answer', handleAnswer as EventListener)
      window.removeEventListener('webrtc:ice', handleIce as EventListener)
    }
  }, [sendOffer, sendAnswer, sendIceCandidate])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    // State
    status,
    connectedPeers,
    isInitiator,
    
    // Actions
    connect,
    disconnect,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
  }
}
