import { useEffect, useState, useRef, useCallback } from 'react';
import { useP2PStore } from '@/stores/p2pStore';
import { PeerList } from '@/components/PeerList';
import { ChatWindow } from '@/components/ChatWindow';
import { StatusCard } from '@/components/StatusCard';
import { 
  TerminalIcon, 
  NetworkIcon, 
  MessageSquareIcon, 
  PhoneCallIcon, 
  XCircleIcon,
  MicIcon,
  MicOffIcon,
  Volume2Icon,
  VolumeXIcon,
  Share2Icon,
  CopyIcon,
  CheckIcon,
  SettingsIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Peer } from '@/types/p2p';
import { cn } from '@/lib/utils';
import { sendMessage, startWebRTCCall, hangupWebRTCCall } from '@/services/api';

// WebRTC configuration
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function Dashboard() {
  const { localPeerId, connectedPeers, messages, addMessage, apiStatus, setApiStatus } = useP2PStore();
  const [activeChatPeer, setActiveChatPeer] = useState<Peer | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [currentCallPeer, setCurrentCallPeer] = useState<Peer | null>(null);
  
  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // WebRTC refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const statusRes = await fetch('/api/v1/status');
        const statusData = await statusRes.json();
        setApiStatus(statusData);

        const peersRes = await fetch('/api/v1/peers');
        const peersData = await peersRes.json();
        useP2PStore.setState({ connectedPeers: peersData.connected_peers || [] });
      } catch (error) {
        console.error('[NEXUS] Error fetching initial data:', error);
      }
    };
    fetchInitialData();

    // WebSocket setup
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    
    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[NEXUS] WebSocket conectado');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'peer_update') {
            useP2PStore.setState({ 
              connectedPeers: data.connected_peers || [], 
              localPeerId: data.local_peer_id 
            });
          } else if (data.type === 'webrtc_signal') {
            handleWebRTCSignal(data);
          }
        } catch (e) {
          console.error('[NEXUS] Error parsing WS message:', e);
        }
      };

      ws.onclose = () => {
        console.log('[NEXUS] WebSocket desconectado. Reconectando em 3s...');
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('[NEXUS] WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
      cleanupCall();
    };
  }, [setApiStatus]);

  // Handle incoming WebRTC signals
  const handleWebRTCSignal = useCallback(async (signal: any) => {
    if (!peerConnectionRef.current) return;

    try {
      if (signal.sdp) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        
        if (signal.sdp.type === 'offer') {
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          // Send answer back via WebSocket
          wsRef.current?.send(JSON.stringify({
            type: 'webrtc_signal',
            sdp: answer,
            target: signal.sender,
          }));
        }
      } else if (signal.candidate) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (error) {
      console.error('[NEXUS] Error handling WebRTC signal:', error);
    }
  }, []);

  // Request microphone access
  const requestMicrophoneAccess = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
        video: false,
      });
      
      console.log('[NEXUS] Microfone acessado com sucesso');
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('[NEXUS] Erro ao acessar microfone:', error);
      alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
      return null;
    }
  };

  // Setup WebRTC peer connection
  const setupPeerConnection = useCallback(async (targetPeerId: string): Promise<RTCPeerConnection | null> => {
    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Get local audio stream
      const localStream = await requestMicrophoneAccess();
      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle incoming audio
      pc.ontrack = (event) => {
        console.log('[NEXUS] Track remoto recebido:', event.track.kind);
        
        if (event.track.kind === 'audio' && remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(e => console.error('[NEXUS] Erro ao reproduzir áudio:', e));
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          wsRef.current?.send(JSON.stringify({
            type: 'webrtc_signal',
            candidate: event.candidate,
            target: targetPeerId,
          }));
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('[NEXUS] Connection state:', pc.connectionState);
        
        switch (pc.connectionState) {
          case 'connecting':
            setCallStatus('connecting');
            break;
          case 'connected':
            setCallStatus('connected');
            break;
          case 'failed':
          case 'disconnected':
          case 'closed':
            setCallStatus('failed');
            break;
        }
      };

      return pc;
    } catch (error) {
      console.error('[NEXUS] Erro ao configurar PeerConnection:', error);
      return null;
    }
  }, []);

  // Start a call
  const handleStartCall = async (peer: Peer) => {
    console.log(`[NEXUS] Iniciando chamada com ${peer.ID}`);
    setCallStatus('connecting');
    setCurrentCallPeer(peer);

    try {
      // Notify backend
      await startWebRTCCall(peer.ID);

      // Setup local WebRTC
      const pc = await setupPeerConnection(peer.ID);
      if (!pc) {
        throw new Error('Falha ao criar PeerConnection');
      }

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      wsRef.current?.send(JSON.stringify({
        type: 'webrtc_signal',
        sdp: offer,
        target: peer.ID,
      }));

    } catch (error) {
      console.error('[NEXUS] Erro ao iniciar chamada:', error);
      setCallStatus('failed');
      alert(`Falha ao iniciar chamada: ${error}`);
    }
  };

  // Cleanup call resources
  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  };

  // Hangup call
  const handleHangupCall = async () => {
    if (!currentCallPeer) return;
    
    console.log(`[NEXUS] Encerrando chamada com ${currentCallPeer.ID}`);
    
    try {
      await hangupWebRTCCall(currentCallPeer.ID);
    } catch (error) {
      console.error('[NEXUS] Erro ao encerrar chamada:', error);
    }

    cleanupCall();
    setCurrentCallPeer(null);
    setCallStatus('idle');
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle deafen
  const toggleDeafen = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isDeafened;
      setIsDeafened(!isDeafened);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChatPeer) return;

    try {
      await sendMessage(activeChatPeer.ID, messageInput);
      
      addMessage({
        id: crypto.randomUUID(),
        sender_peer_id: localPeerId || 'local',
        receiver_peer_id: activeChatPeer.ID,
        topic: `nexus-chat:${activeChatPeer.ID}`,
        payload: btoa(messageInput),
        timestamp: Math.floor(Date.now() / 1000),
        is_read: true,
      });
      
      setMessageInput('');
    } catch (error) {
      console.error('[NEXUS] Erro ao enviar mensagem:', error);
    }
  };

  // Get call status color
  const getCallStatusColor = () => {
    switch (callStatus) {
      case 'connecting': return 'text-yellow-500';
      case 'connected': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Generate connection link
  const generateConnectionLink = () => {
    if (!localPeerId || !apiStatus?.listen_addrs) return '';
    
    // Get the first non-localhost address
    const addr = apiStatus.listen_addrs.find((a: string) => 
      !a.includes('127.0.0.1') && !a.includes('::1')
    ) || apiStatus.listen_addrs[0];
    
    return `${addr}/p2p/${localPeerId}`;
  };

  // Copy to clipboard
  const copyConnectionLink = async () => {
    const link = generateConnectionLink();
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Share modal component
  const ShareModal = () => {
    if (!showShareModal) return null;
    
    const connectionLink = generateConnectionLink();
    
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
        <div 
          className="bg-nexus-carbon border border-nexus-accent-green rounded-lg p-6 max-w-lg w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold text-nexus-accent-green mb-4 flex items-center">
            <Share2Icon className="mr-2" size={24} />
            Compartilhar Conexão
          </h3>
          
          <p className="text-nexus-light-grey text-sm mb-4">
            Envie este link para outro usuário se conectar diretamente ao seu nó:
          </p>
          
          <div className="bg-nexus-black border border-nexus-grey rounded p-3 mb-4">
            <code className="text-nexus-accent-amber text-xs break-all">
              {connectionLink || 'Aguardando conexão...'}
            </code>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={copyConnectionLink}
              className="flex-1 bg-nexus-accent-green hover:bg-nexus-success-green text-nexus-black"
            >
              {copied ? (
                <>
                  <CheckIcon className="mr-2" size={16} />
                  Copiado!
                </>
              ) : (
                <>
                  <CopyIcon className="mr-2" size={16} />
                  Copiar Link
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowShareModal(false)}
              variant="outline"
              className="border-nexus-grey text-nexus-light-grey hover:bg-nexus-grey"
            >
              Fechar
            </Button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-nexus-grey">
            <p className="text-nexus-muted-foreground text-xs">
              <strong>Peer ID:</strong>
            </p>
            <code className="text-nexus-accent-green text-xs break-all">
              {localPeerId}
            </code>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-nexus-black text-nexus-accent-green">
      {/* Hidden audio element for remote audio playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
      
      {/* Share Modal */}
      <ShareModal />

      {/* Sidebar */}
      <aside className="w-1/4 bg-nexus-carbon p-4 border-r border-nexus-grey flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-nexus-accent-green flex items-center">
            <TerminalIcon className="mr-2" size={24} /> NEXUS PRIME
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.hash = 'settings'}
            className="text-nexus-light-grey hover:text-nexus-accent-green"
          >
            <SettingsIcon size={20} />
          </Button>
        </div>
        
        {/* Share Connection Button */}
        <Button
          onClick={() => setShowShareModal(true)}
          className="mb-4 bg-nexus-accent-amber hover:bg-yellow-500 text-nexus-black flex items-center justify-center"
        >
          <Share2Icon className="mr-2" size={18} />
          Compartilhar Conexão
        </Button>

        <StatusCard
          localPeerId={localPeerId}
          apiStatus={apiStatus}
          isConnectedToMesh={connectedPeers.length > 0}
        />

        {/* Call Controls */}
        {currentCallPeer && (
          <div className="mt-4 p-3 bg-nexus-grey rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Em chamada com:</span>
              <span className={cn("text-xs", getCallStatusColor())}>
                {callStatus === 'connecting' && '● Conectando...'}
                {callStatus === 'connected' && '● Conectado'}
                {callStatus === 'failed' && '● Falhou'}
              </span>
            </div>
            <p className="text-nexus-accent-amber text-sm truncate mb-3">
              {currentCallPeer.Nickname || currentCallPeer.ID.substring(0, 16)}...
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isMuted ? "destructive" : "outline"}
                onClick={toggleMute}
                className="flex-1"
              >
                {isMuted ? <MicOffIcon size={16} /> : <MicIcon size={16} />}
              </Button>
              <Button
                size="sm"
                variant={isDeafened ? "destructive" : "outline"}
                onClick={toggleDeafen}
                className="flex-1"
              >
                {isDeafened ? <VolumeXIcon size={16} /> : <Volume2Icon size={16} />}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleHangupCall}
                className="flex-1"
              >
                <XCircleIcon size={16} />
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-nexus-light-grey flex items-center">
            <NetworkIcon className="mr-2" size={20} /> Malha Ativa
          </h2>
          <PeerList
            peers={connectedPeers}
            onSelectPeer={(peer) => setActiveChatPeer(peer)}
            onCallPeer={handleStartCall}
            currentChatPeerId={activeChatPeer?.ID ?? null}
            currentCallPeerId={currentCallPeer?.ID ?? null}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-nexus-black p-4">
        {activeChatPeer ? (
          <>
            <div className="flex items-center justify-between pb-4 border-b border-nexus-grey mb-4">
              <h2 className="text-2xl font-semibold text-nexus-accent-amber">
                <MessageSquareIcon className="inline mr-2" size={24} /> 
                Chat com {activeChatPeer.Nickname || activeChatPeer.ID.substring(0, 16)}...
              </h2>
              {currentCallPeer?.ID === activeChatPeer.ID ? (
                <Button variant="destructive" onClick={handleHangupCall} className="flex items-center">
                  <XCircleIcon className="mr-2" size={18} /> Encerrar
                </Button>
              ) : (
                <Button 
                  onClick={() => handleStartCall(activeChatPeer)} 
                  className="flex items-center bg-nexus-accent-green hover:bg-nexus-success-green"
                  disabled={callStatus === 'connecting'}
                >
                  <PhoneCallIcon className="mr-2" size={18} /> 
                  {callStatus === 'connecting' ? 'Conectando...' : 'Chamar'}
                </Button>
              )}
            </div>
            
            <ChatWindow
              messages={messages.filter(msg =>
                msg.sender_peer_id === activeChatPeer.ID || 
                msg.receiver_peer_id === activeChatPeer.ID || 
                msg.topic === `nexus-chat:${activeChatPeer.ID}`
              )}
              localPeerId={localPeerId}
              peerName={activeChatPeer.Nickname || activeChatPeer.ID}
            />
            
            <div className="mt-4 flex gap-2">
              <Input
                type="text"
                placeholder="Transmissão segura..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-nexus-grey border-nexus-accent-green text-nexus-light-grey placeholder:text-nexus-muted-foreground focus:ring-nexus-accent-green focus:border-nexus-accent-green"
              />
              <Button onClick={handleSendMessage} className="bg-nexus-accent-green hover:bg-nexus-success-green">
                Enviar
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-nexus-light-grey text-xl opacity-75">
            Selecione um peer para iniciar um chat ou chamada.
          </div>
        )}
      </main>
    </div>
  );
}
