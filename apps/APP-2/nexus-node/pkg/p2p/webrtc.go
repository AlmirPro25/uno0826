package p2p

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"github.com/google/uuid"
	pubsub "github.com/libp2p/go-libp2p-pubsub"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/pion/webrtc/v3"
)

const (
	WebRTCProtocol           = "/nexus/webrtc/1.0.0"
	WebRTCControlTopicPrefix = "nexus-webrtc-control"
)

// WebRTCSignal represents a signaling message for WebRTC
type WebRTCSignal struct {
	Type      string                     `json:"type"`
	SDP       *webrtc.SessionDescription `json:"sdp,omitempty"`
	Candidate *webrtc.ICECandidateInit   `json:"candidate,omitempty"`
	Target    string                     `json:"target"`
	Sender    string                     `json:"sender"`
	CallType  string                     `json:"call_type,omitempty"` // "audio" or "video"
}

// TrackHandler is called when a remote track (audio or video) is received
type TrackHandler func(peerID peer.ID, track *webrtc.TrackRemote, kind string)

// WebRTCService manages WebRTC peer connections for real-time audio/video
type WebRTCService struct {
	host            host.Host
	pubsub          *PubSubService
	peerConnections map[peer.ID]*webrtc.PeerConnection
	pcMutex         sync.RWMutex
	stunServers     []string

	// Callbacks for frontend integration
	OnRemoteTrack           TrackHandler
	OnConnectionStateChange func(peerID peer.ID, state webrtc.PeerConnectionState)
	OnDataChannelMessage    func(peerID peer.ID, label string, data []byte)
	OnIncomingCall          func(peerID peer.ID, callType string) // Notifica chamada recebida

	// Local tracks to be added to outgoing connections
	localAudioTrack webrtc.TrackLocal
	localVideoTrack webrtc.TrackLocal
	trackMutex      sync.RWMutex

	// Active call state
	activeCallType map[peer.ID]string // "audio" or "video"
	callMutex      sync.RWMutex
}

// NewWebRTCService creates and initializes a WebRTC service
func NewWebRTCService(h host.Host, pss *PubSubService, stunServers []string) *WebRTCService {
	ws := &WebRTCService{
		host:            h,
		pubsub:          pss,
		peerConnections: make(map[peer.ID]*webrtc.PeerConnection),
		stunServers:     stunServers,
		activeCallType:  make(map[peer.ID]string),
	}

	// Set up libp2p stream handler for direct signaling
	h.SetStreamHandler(WebRTCProtocol, ws.handleSignalingStream)

	// Subscribe to WebRTC control topic for signaling via PubSub
	if pss != nil {
		ctx := context.Background()
		if err := pss.SubscribeToTopic(ctx, WebRTCControlTopicPrefix); err != nil {
			log.Printf("[NEXUS_WEBRTC] ERRO: Falha ao subscrever tópico de controle: %v", err)
		} else {
			pss.SetMessageHandler(WebRTCControlTopicPrefix, ws.handlePubSubSignaling)
			log.Println("[NEXUS_WEBRTC] ✓ Sinalização via PubSub ativada")
		}
	}

	log.Printf("[NEXUS_WEBRTC] ✓ Serviço WebRTC inicializado com %d servidores STUN (VP8+Opus)", len(stunServers))
	return ws
}

// handleSignalingStream handles incoming libp2p streams for WebRTC signaling
func (ws *WebRTCService) handleSignalingStream(s network.Stream) {
	defer s.Close()
	remotePeer := s.Conn().RemotePeer()
	log.Printf("[NEXUS_WEBRTC] Stream de sinalização recebido de %s", remotePeer.String()[:16])

	buf := make([]byte, 8192)
	n, err := s.Read(buf)
	if err != nil {
		log.Printf("[NEXUS_WEBRTC] ERRO: Falha ao ler sinalização: %v", err)
		return
	}

	var signal WebRTCSignal
	if err := json.Unmarshal(buf[:n], &signal); err != nil {
		log.Printf("[NEXUS_WEBRTC] ERRO: Falha ao decodificar sinalização: %v", err)
		return
	}

	ws.processSignal(remotePeer, &signal)
}

// handlePubSubSignaling processes signaling messages from PubSub
func (ws *WebRTCService) handlePubSubSignaling(ctx context.Context, msg *pubsub.Message) {
	if msg.ReceivedFrom == ws.host.ID() {
		return // Ignore own messages
	}

	var signal WebRTCSignal
	if err := json.Unmarshal(msg.Data, &signal); err != nil {
		log.Printf("[NEXUS_WEBRTC] ERRO: Falha ao decodificar sinalização PubSub: %v", err)
		return
	}

	// Check if message is for us
	targetPeer, err := peer.Decode(signal.Target)
	if err != nil || targetPeer != ws.host.ID() {
		return // Not for us
	}

	senderPeer, err := peer.Decode(signal.Sender)
	if err != nil {
		log.Printf("[NEXUS_WEBRTC] ERRO: Sender inválido: %v", err)
		return
	}

	ws.processSignal(senderPeer, &signal)
}

// processSignal handles incoming WebRTC signaling messages
func (ws *WebRTCService) processSignal(remotePeer peer.ID, signal *WebRTCSignal) {
	log.Printf("[NEXUS_WEBRTC] Processando sinal '%s' de %s", signal.Type, remotePeer.String()[:16])

	ws.pcMutex.Lock()
	pc, exists := ws.peerConnections[remotePeer]
	ws.pcMutex.Unlock()

	callType := signal.CallType
	if callType == "" {
		callType = "audio"
	}

	switch signal.Type {
	case "offer":
		// Notify about incoming call
		if ws.OnIncomingCall != nil {
			ws.OnIncomingCall(remotePeer, callType)
		}

		if !exists {
			var err error
			pc, err = ws.createPeerConnection(remotePeer, callType)
			if err != nil {
				log.Printf("[NEXUS_WEBRTC] ERRO: Falha ao criar PC para oferta: %v", err)
				return
			}
			ws.pcMutex.Lock()
			ws.peerConnections[remotePeer] = pc
			ws.pcMutex.Unlock()

			ws.callMutex.Lock()
			ws.activeCallType[remotePeer] = callType
			ws.callMutex.Unlock()
		}

		if err := pc.SetRemoteDescription(*signal.SDP); err != nil {
			log.Printf("[NEXUS_WEBRTC] ERRO: Falha ao definir remote description: %v", err)
			return
		}

		answer, err := pc.CreateAnswer(nil)
		if err != nil {
			log.Printf("[NEXUS_WEBRTC] ERRO: Falha ao criar answer: %v", err)
			return
		}

		if err := pc.SetLocalDescription(answer); err != nil {
			log.Printf("[NEXUS_WEBRTC] ERRO: Falha ao definir local description: %v", err)
			return
		}

		ws.sendSignal(remotePeer, &WebRTCSignal{
			Type:     "answer",
			SDP:      &answer,
			Target:   remotePeer.String(),
			Sender:   ws.host.ID().String(),
			CallType: callType,
		})

	case "answer":
		if !exists {
			log.Printf("[NEXUS_WEBRTC] AVISO: Answer recebido sem PC existente")
			return
		}
		if err := pc.SetRemoteDescription(*signal.SDP); err != nil {
			log.Printf("[NEXUS_WEBRTC] ERRO: Falha ao definir remote description (answer): %v", err)
		}

	case "candidate":
		if !exists {
			log.Printf("[NEXUS_WEBRTC] AVISO: ICE candidate recebido sem PC existente")
			return
		}
		if signal.Candidate != nil {
			if err := pc.AddICECandidate(*signal.Candidate); err != nil {
				log.Printf("[NEXUS_WEBRTC] ERRO: Falha ao adicionar ICE candidate: %v", err)
			}
		}
	}
}

// StartWebRTCCall initiates a WebRTC call with a target peer
// callType can be "audio" or "video"
func (ws *WebRTCService) StartWebRTCCall(targetPeer peer.ID) error {
	return ws.StartWebRTCCallWithType(targetPeer, "audio")
}

// StartWebRTCCallWithType initiates a WebRTC call with specified type
func (ws *WebRTCService) StartWebRTCCallWithType(targetPeer peer.ID, callType string) error {
	log.Printf("[NEXUS_WEBRTC] Iniciando chamada %s para %s", callType, targetPeer.String()[:16])

	pc, err := ws.createPeerConnection(targetPeer, callType)
	if err != nil {
		return fmt.Errorf("falha ao criar PeerConnection: %w", err)
	}

	ws.pcMutex.Lock()
	ws.peerConnections[targetPeer] = pc
	ws.pcMutex.Unlock()

	ws.callMutex.Lock()
	ws.activeCallType[targetPeer] = callType
	ws.callMutex.Unlock()

	// Add transceivers for audio and video based on call type
	ws.trackMutex.RLock()
	if ws.localAudioTrack != nil {
		if _, err := pc.AddTrack(ws.localAudioTrack); err != nil {
			log.Printf("[NEXUS_WEBRTC] AVISO: Falha ao adicionar track de áudio: %v", err)
		}
	}
	if callType == "video" && ws.localVideoTrack != nil {
		if _, err := pc.AddTrack(ws.localVideoTrack); err != nil {
			log.Printf("[NEXUS_WEBRTC] AVISO: Falha ao adicionar track de vídeo: %v", err)
		}
	}
	ws.trackMutex.RUnlock()

	// Create data channel for messaging
	dc, err := pc.CreateDataChannel("nexus-data", nil)
	if err != nil {
		log.Printf("[NEXUS_WEBRTC] AVISO: Falha ao criar DataChannel: %v", err)
	} else {
		ws.setupDataChannel(targetPeer, dc)
	}

	// Create and send offer
	offer, err := pc.CreateOffer(nil)
	if err != nil {
		return fmt.Errorf("falha ao criar offer: %w", err)
	}

	if err := pc.SetLocalDescription(offer); err != nil {
		return fmt.Errorf("falha ao definir local description: %w", err)
	}

	ws.sendSignal(targetPeer, &WebRTCSignal{
		Type:     "offer",
		SDP:      &offer,
		Target:   targetPeer.String(),
		Sender:   ws.host.ID().String(),
		CallType: callType,
	})

	log.Printf("[NEXUS_WEBRTC] ✓ Offer %s enviado para %s", callType, targetPeer.String()[:16])
	return nil
}

// StartVideoCall initiates a video call with a target peer
func (ws *WebRTCService) StartVideoCall(targetPeer peer.ID) error {
	return ws.StartWebRTCCallWithType(targetPeer, "video")
}

// createPeerConnection creates a new WebRTC PeerConnection with proper configuration
func (ws *WebRTCService) createPeerConnection(remotePeer peer.ID, callType string) (*webrtc.PeerConnection, error) {
	// Configure ICE servers
	iceServers := make([]webrtc.ICEServer, 0, len(ws.stunServers))
	for _, stun := range ws.stunServers {
		iceServers = append(iceServers, webrtc.ICEServer{
			URLs: []string{fmt.Sprintf("stun:%s", stun)},
		})
	}

	config := webrtc.Configuration{
		ICEServers: iceServers,
	}

	// Create MediaEngine with audio (Opus) and video (VP8) codec support
	m := &webrtc.MediaEngine{}

	// Register Opus codec for audio
	if err := m.RegisterCodec(webrtc.RTPCodecParameters{
		RTPCodecCapability: webrtc.RTPCodecCapability{
			MimeType:    webrtc.MimeTypeOpus,
			ClockRate:   48000,
			Channels:    2,
			SDPFmtpLine: "minptime=10;useinbandfec=1",
		},
		PayloadType: 111,
	}, webrtc.RTPCodecTypeAudio); err != nil {
		return nil, fmt.Errorf("falha ao registrar codec Opus: %w", err)
	}

	// Register VP8 codec for video
	if err := m.RegisterCodec(webrtc.RTPCodecParameters{
		RTPCodecCapability: webrtc.RTPCodecCapability{
			MimeType:  webrtc.MimeTypeVP8,
			ClockRate: 90000,
		},
		PayloadType: 96,
	}, webrtc.RTPCodecTypeVideo); err != nil {
		return nil, fmt.Errorf("falha ao registrar codec VP8: %w", err)
	}

	// Register VP9 as fallback
	if err := m.RegisterCodec(webrtc.RTPCodecParameters{
		RTPCodecCapability: webrtc.RTPCodecCapability{
			MimeType:  webrtc.MimeTypeVP9,
			ClockRate: 90000,
		},
		PayloadType: 98,
	}, webrtc.RTPCodecTypeVideo); err != nil {
		log.Printf("[NEXUS_WEBRTC] AVISO: Falha ao registrar VP9: %v", err)
	}

	// Create API with MediaEngine
	api := webrtc.NewAPI(webrtc.WithMediaEngine(m))

	pc, err := api.NewPeerConnection(config)
	if err != nil {
		return nil, fmt.Errorf("falha ao criar PeerConnection: %w", err)
	}

	// Handle incoming tracks (audio/video from remote peer)
	pc.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		kind := track.Kind().String()
		log.Printf("[NEXUS_WEBRTC] Track remoto recebido: %s (%s)", kind, track.Codec().MimeType)

		if ws.OnRemoteTrack != nil {
			ws.OnRemoteTrack(remotePeer, track, kind)
		}

		// Read and process incoming packets
		go ws.processRemoteTrack(remotePeer, track)
	})

	// Handle data channels
	pc.OnDataChannel(func(dc *webrtc.DataChannel) {
		log.Printf("[NEXUS_WEBRTC] DataChannel recebido: %s", dc.Label())
		ws.setupDataChannel(remotePeer, dc)
	})

	// Handle ICE candidates
	pc.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			return
		}
		candidateInit := candidate.ToJSON()
		ws.sendSignal(remotePeer, &WebRTCSignal{
			Type:      "candidate",
			Candidate: &candidateInit,
			Target:    remotePeer.String(),
			Sender:    ws.host.ID().String(),
		})
	})

	// Handle connection state changes
	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		log.Printf("[NEXUS_WEBRTC] Conexão com %s: %s", remotePeer.String()[:16], state.String())

		if ws.OnConnectionStateChange != nil {
			ws.OnConnectionStateChange(remotePeer, state)
		}

		if state == webrtc.PeerConnectionStateFailed || state == webrtc.PeerConnectionStateClosed {
			ws.pcMutex.Lock()
			delete(ws.peerConnections, remotePeer)
			ws.pcMutex.Unlock()

			ws.callMutex.Lock()
			delete(ws.activeCallType, remotePeer)
			ws.callMutex.Unlock()
		}
	})

	return pc, nil
}

// processRemoteTrack reads RTP packets from a remote track (audio or video)
func (ws *WebRTCService) processRemoteTrack(remotePeer peer.ID, track *webrtc.TrackRemote) {
	buf := make([]byte, 1500)
	kind := track.Kind().String()
	for {
		n, _, err := track.Read(buf)
		if err != nil {
			log.Printf("[NEXUS_WEBRTC] Track %s de %s encerrado: %v", kind, remotePeer.String()[:16], err)
			return
		}
		// Data is in buf[:n]
		// Audio/Video playback handled by frontend via MediaStream
		_ = n
	}
}

// setupDataChannel configures handlers for a data channel
func (ws *WebRTCService) setupDataChannel(remotePeer peer.ID, dc *webrtc.DataChannel) {
	dc.OnOpen(func() {
		log.Printf("[NEXUS_WEBRTC] DataChannel '%s' aberto com %s", dc.Label(), remotePeer.String()[:16])
	})

	dc.OnMessage(func(msg webrtc.DataChannelMessage) {
		if ws.OnDataChannelMessage != nil {
			ws.OnDataChannelMessage(remotePeer, dc.Label(), msg.Data)
		}
	})

	dc.OnClose(func() {
		log.Printf("[NEXUS_WEBRTC] DataChannel '%s' fechado", dc.Label())
	})
}

// sendSignal sends a signaling message to a peer via PubSub
func (ws *WebRTCService) sendSignal(targetPeer peer.ID, signal *WebRTCSignal) {
	data, err := json.Marshal(signal)
	if err != nil {
		log.Printf("[NEXUS_WEBRTC] ERRO: Falha ao serializar sinal: %v", err)
		return
	}

	if ws.pubsub != nil {
		if err := ws.pubsub.Publish(WebRTCControlTopicPrefix, data); err != nil {
			log.Printf("[NEXUS_WEBRTC] ERRO: Falha ao enviar sinal via PubSub: %v", err)
		}
	}
}

// SetLocalAudioTrack sets the local audio track
func (ws *WebRTCService) SetLocalAudioTrack(track webrtc.TrackLocal) {
	ws.trackMutex.Lock()
	ws.localAudioTrack = track
	ws.trackMutex.Unlock()
	log.Println("[NEXUS_WEBRTC] ✓ Track de áudio local configurado")
}

// SetLocalVideoTrack sets the local video track
func (ws *WebRTCService) SetLocalVideoTrack(track webrtc.TrackLocal) {
	ws.trackMutex.Lock()
	ws.localVideoTrack = track
	ws.trackMutex.Unlock()
	log.Println("[NEXUS_WEBRTC] ✓ Track de vídeo local configurado")
}

// CreateAudioTrack creates a new local audio track for sending audio
func (ws *WebRTCService) CreateAudioTrack() (*webrtc.TrackLocalStaticRTP, error) {
	track, err := webrtc.NewTrackLocalStaticRTP(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeOpus},
		fmt.Sprintf("audio-%s", uuid.NewString()[:8]),
		fmt.Sprintf("nexus-%s", ws.host.ID().String()[:8]),
	)
	if err != nil {
		return nil, fmt.Errorf("falha ao criar track de áudio: %w", err)
	}

	ws.SetLocalAudioTrack(track)
	return track, nil
}

// CreateVideoTrack creates a new local video track for sending video (VP8)
func (ws *WebRTCService) CreateVideoTrack() (*webrtc.TrackLocalStaticRTP, error) {
	track, err := webrtc.NewTrackLocalStaticRTP(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeVP8},
		fmt.Sprintf("video-%s", uuid.NewString()[:8]),
		fmt.Sprintf("nexus-%s", ws.host.ID().String()[:8]),
	)
	if err != nil {
		return nil, fmt.Errorf("falha ao criar track de vídeo VP8: %w", err)
	}

	ws.SetLocalVideoTrack(track)
	log.Println("[NEXUS_WEBRTC] ✓ Track de vídeo VP8 criado")
	return track, nil
}

// GetActiveCallType returns the call type for a peer
func (ws *WebRTCService) GetActiveCallType(peerID peer.ID) string {
	ws.callMutex.RLock()
	defer ws.callMutex.RUnlock()
	return ws.activeCallType[peerID]
}

// CloseWebRTCCall closes the connection with a specific peer
func (ws *WebRTCService) CloseWebRTCCall(targetPeer peer.ID) error {
	ws.pcMutex.Lock()
	pc, exists := ws.peerConnections[targetPeer]
	if exists {
		delete(ws.peerConnections, targetPeer)
	}
	ws.pcMutex.Unlock()

	if !exists {
		return fmt.Errorf("nenhuma chamada ativa com %s", targetPeer.String()[:16])
	}

	log.Printf("[NEXUS_WEBRTC] Encerrando chamada com %s", targetPeer.String()[:16])
	return pc.Close()
}

// GetActiveCalls returns the list of active peer connections
func (ws *WebRTCService) GetActiveCalls() []peer.ID {
	ws.pcMutex.RLock()
	defer ws.pcMutex.RUnlock()

	peers := make([]peer.ID, 0, len(ws.peerConnections))
	for p := range ws.peerConnections {
		peers = append(peers, p)
	}
	return peers
}

// Close closes all peer connections
func (ws *WebRTCService) Close() {
	ws.pcMutex.Lock()
	defer ws.pcMutex.Unlock()

	for peerID, pc := range ws.peerConnections {
		pc.Close()
		delete(ws.peerConnections, peerID)
	}
	log.Println("[NEXUS_WEBRTC] Todas as conexões WebRTC encerradas")
}
