package api

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gorilla/websocket"
	pubsub "github.com/libp2p/go-libp2p-pubsub"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multiaddr"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/community"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/database"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/kernel"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/notifications"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/p2p"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/reputation"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/social"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/swarm"
)

// APIServer handles local HTTP and WebSocket connections for the frontend.
type APIServer struct {
	port             string
	p2pHost          host.Host
	nexusHost        *p2p.P2PHost
	db               *database.SQLiteDB
	upgrader         websocket.Upgrader
	hub              *Hub
	signalingHub     *SignalingHub
	startTime        time.Time
	feedService      *social.FeedService
	swarmService     *swarm.SwarmService
	communityService *community.CommunityService
	reputationSystem *reputation.ReputationSystem
	notifications    *notifications.NotificationService
	kernelBridge     *kernel.Bridge
	kernelHandler    *kernel.Handler
}

// NewAPIServer creates a new API server instance.
func NewAPIServer(port string, nexusHost *p2p.P2PHost, db *database.SQLiteDB) *APIServer {
	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	hub := NewHub()
	go hub.Run()

	// Initialize Signaling Hub for WebRTC
	signalingHub := NewSignalingHub()
	go signalingHub.Run()

	server := &APIServer{
		port:         port,
		p2pHost:      nexusHost.Host,
		nexusHost:    nexusHost,
		db:           db,
		upgrader:     upgrader,
		hub:          hub,
		signalingHub: signalingHub,
		startTime:    time.Now(),
	}

	// Initialize Reputation System
	server.reputationSystem = reputation.NewReputationSystem()

	// Initialize Notifications
	server.notifications = notifications.NewNotificationService()
	server.notifications.OnNotification(func(notif *notifications.Notification) {
		server.hub.Broadcast <- map[string]interface{}{
			"type":         "notification",
			"notification": notif,
		}
	})

	// Initialize Feed Service
	ctx := context.Background()
	gossipSub := nexusHost.GetGossipSub()
	if gs, ok := gossipSub.(*pubsub.PubSub); ok {
		feedService, err := social.NewFeedService(ctx, nexusHost.Host, nexusHost.GetPrivKey(), gs, db)
		if err != nil {
			log.Printf("[NEXUS] AVISO: Falha ao iniciar Feed Service: %v", err)
		} else {
			server.feedService = feedService
			// Broadcast new posts to WebSocket clients
			feedService.OnNewPost(func(post *social.Post) {
				server.hub.Broadcast <- map[string]interface{}{
					"type": "new_post",
					"post": post,
				}
				// Notificação
				server.notifications.PushFromPeer(
					notifications.NotifyNewPost,
					"Novo post no Pulso",
					truncateString(post.Content, 50),
					post.AuthorID,
					post.AuthorName,
				)
			})
		}

		// Initialize Swarm Service
		swarmService, err := swarm.NewSwarmService(ctx, nexusHost.Host, nexusHost.DHT, gs)
		if err != nil {
			log.Printf("[NEXUS] AVISO: Falha ao iniciar Swarm Service: %v", err)
		} else {
			server.swarmService = swarmService
			// Broadcast download progress to WebSocket clients
			swarmService.OnProgress(func(progress *swarm.DownloadProgress) {
				server.hub.Broadcast <- map[string]interface{}{
					"type":     "download_progress",
					"progress": progress,
				}
				if progress.Status == "complete" {
					server.notifications.PushSimple(
						notifications.NotifyDownloadComplete,
						"Download completo",
						progress.FileName,
					)
				}
			})
		}

		// Initialize Community Service
		communityService := community.NewCommunityService(ctx, nexusHost.Host, nexusHost.GetPrivKey(), gs)
		server.communityService = communityService
		communityService.OnMessage(func(communityID string, msg *community.CommunityMessage) {
			server.hub.Broadcast <- map[string]interface{}{
				"type":         "community_message",
				"community_id": communityID,
				"message":      msg,
			}
		})
	}

	return server
}

// SetKernelBridge sets the kernel bridge for the API server
func (s *APIServer) SetKernelBridge(bridge *kernel.Bridge, privKey crypto.PrivKey) {
	s.kernelBridge = bridge
	s.kernelHandler = kernel.NewHandler(bridge, privKey)
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// Start begins listening for HTTP and WebSocket connections.
func (s *APIServer) Start(ctx context.Context) error {
	router := http.NewServeMux()

	router.HandleFunc("/ws", s.handleWebSocket)
	router.HandleFunc("/ws/signaling", HandleSignalingWebSocket(s.signalingHub))
	router.HandleFunc("/api/v1/signaling/stats", s.handleSignalingStats)
	router.HandleFunc("/api/v1/status", s.handleStatus)
	router.HandleFunc("/api/v1/peers", s.handleGetPeers)
	router.HandleFunc("/api/v1/messages", s.handleGetMessages)
	router.HandleFunc("/api/v1/message", s.handleSendMessage)
	router.HandleFunc("/api/v1/webrtc/call", s.handleWebRTCCall)
	router.HandleFunc("/api/v1/webrtc/hangup", s.handleWebRTCHangup)
	router.HandleFunc("/api/v1/connect", s.handleConnect)
	
	// Feed Social endpoints
	router.HandleFunc("/api/v1/feed", s.handleFeed)
	router.HandleFunc("/api/v1/feed/post", s.handleCreatePost)
	router.HandleFunc("/api/v1/feed/like", s.handleLikePost)
	router.HandleFunc("/api/v1/feed/follow", s.handleFollow)
	router.HandleFunc("/api/v1/feed/unfollow", s.handleUnfollow)
	router.HandleFunc("/api/v1/feed/block", s.handleBlock)
	router.HandleFunc("/api/v1/feed/settings", s.handleFeedSettings)
	
	// Swarm/File sharing endpoints
	router.HandleFunc("/api/v1/swarm/share", s.handleShareFile)
	router.HandleFunc("/api/v1/swarm/download", s.handleDownloadFile)
	router.HandleFunc("/api/v1/swarm/progress", s.handleDownloadProgress)
	router.HandleFunc("/api/v1/swarm/chunk", s.handleGetChunk)
	router.HandleFunc("/api/v1/upload", s.handleUpload)
	
	// Community endpoints
	router.HandleFunc("/api/v1/communities", s.handleCommunities)
	router.HandleFunc("/api/v1/community/create", s.handleCreateCommunity)
	router.HandleFunc("/api/v1/community/join", s.handleJoinCommunity)
	router.HandleFunc("/api/v1/community/leave", s.handleLeaveCommunity)
	router.HandleFunc("/api/v1/community/messages", s.handleCommunityMessages)
	router.HandleFunc("/api/v1/community/send", s.handleSendCommunityMessage)
	
	// Reputation endpoints
	router.HandleFunc("/api/v1/reputation", s.handleGetReputation)
	router.HandleFunc("/api/v1/reputation/top", s.handleTopPeers)
	
	// Kernel integration endpoints (Prost-QS)
	if s.kernelHandler != nil {
		s.kernelHandler.RegisterRoutes(router)
	}
	// Notification endpoints
	router.HandleFunc("/api/v1/notifications", s.handleNotifications)
	router.HandleFunc("/api/v1/notifications/read", s.handleMarkNotificationRead)
	router.HandleFunc("/api/v1/notifications/clear", s.handleClearNotifications)

	corsHandler := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	}

	server := &http.Server{
		Addr:    fmt.Sprintf(":%s", s.port),
		Handler: corsHandler(router),
	}

	go s.sendPeerUpdates(ctx)

	log.Printf("[NEXUS] API Server: http://localhost:%s", s.port)
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[NEXUS] ERRO: Servidor API falhou: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("[NEXUS] API Server encerrando...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return server.Shutdown(shutdownCtx)
}

func (s *APIServer) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[NEXUS] ERRO: WebSocket upgrade falhou: %v", err)
		return
	}
	client := NewClient(s.hub, conn, s.p2pHost.ID().String())
	s.hub.Register <- client
	go client.WritePump()
	go client.ReadPump()
}

func (s *APIServer) handleStatus(w http.ResponseWriter, r *http.Request) {
	status := map[string]interface{}{
		"peer_id":        s.p2pHost.ID().String(),
		"listen_addrs":   s.p2pHost.Addrs(),
		"connected_at":   s.startTime.Unix(),
		"version":        "0.1.0-alpha",
		"uptime_seconds": time.Since(s.startTime).Seconds(),
	}
	respondJSON(w, http.StatusOK, status)
}

func (s *APIServer) handleGetPeers(w http.ResponseWriter, r *http.Request) {
	connectedPeers, err := s.nexusHost.GetConnectedPeers()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Falha ao obter peers conectados")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"local_peer_id":   s.p2pHost.ID().String(),
		"connected_peers": connectedPeers,
	})
}

func (s *APIServer) handleGetMessages(w http.ResponseWriter, r *http.Request) {
	peerID := r.URL.Query().Get("peerId")
	topic := r.URL.Query().Get("topic")
	limit := 100
	offset := 0

	var messages []*database.Message
	var err error

	if peerID != "" {
		messages, err = s.db.GetMessagesByPeer(peerID, limit, offset)
	} else if topic != "" {
		messages, err = s.db.GetGlobalTopicMessages(topic, limit, offset)
	} else {
		respondError(w, http.StatusBadRequest, "Parâmetro 'peerId' ou 'topic' é obrigatório")
		return
	}

	if err != nil {
		log.Printf("[NEXUS] ERRO: Falha ao obter mensagens: %v", err)
		respondError(w, http.StatusInternalServerError, "Falha ao obter mensagens")
		return
	}

	respondJSON(w, http.StatusOK, messages)
}

type sendMessageRequest struct {
	ReceiverPeerID string `json:"receiver_peer_id"`
	Topic          string `json:"topic"`
	Payload        string `json:"payload"`
}

func (s *APIServer) handleSendMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	var req sendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.Topic == "" && req.ReceiverPeerID == "" {
		respondError(w, http.StatusBadRequest, "É necessário um tópico ou um PeerID de destinatário")
		return
	}

	encryptedPayload := []byte(req.Payload)

	pubsubService := s.nexusHost.GetPubSubService()
	if pubsubService == nil {
		respondError(w, http.StatusInternalServerError, "Serviço PubSub não disponível")
		return
	}

	targetTopic := req.Topic
	if targetTopic == "" && req.ReceiverPeerID != "" {
		targetTopic = fmt.Sprintf("%s:%s", p2p.ChatTopicPrefix, req.ReceiverPeerID)
		_ = pubsubService.SubscribeToTopic(context.Background(), targetTopic)
	} else if targetTopic == "" {
		targetTopic = p2p.GlobalDiscoveryTopic
		_ = pubsubService.SubscribeToTopic(context.Background(), targetTopic)
	}

	err := pubsubService.Publish(targetTopic, encryptedPayload)
	if err != nil {
		log.Printf("[NEXUS] ERRO: Falha ao enviar mensagem: %v", err)
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Falha ao enviar mensagem: %v", err))
		return
	}

	dbMsg := &database.Message{
		SenderPeerID:   s.p2pHost.ID().String(),
		ReceiverPeerID: req.ReceiverPeerID,
		Topic:          targetTopic,
		Payload:        encryptedPayload,
		Timestamp:      time.Now().Unix(),
		IsRead:         true,
	}
	if err := s.db.SaveMessage(dbMsg); err != nil {
		log.Printf("[NEXUS] ERRO: Falha ao salvar mensagem: %v", err)
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "Mensagem enviada com sucesso"})
}

type webrtcCallRequest struct {
	TargetPeerID string `json:"target_peer_id"`
	CallType     string `json:"call_type"` // "audio" or "video"
}

func (s *APIServer) handleWebRTCCall(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	var req webrtcCallRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.TargetPeerID == "" {
		respondError(w, http.StatusBadRequest, "TargetPeerID é obrigatório")
		return
	}

	targetPeerID, err := peer.Decode(req.TargetPeerID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "PeerID alvo inválido")
		return
	}

	webrtcService := s.nexusHost.GetWebRTCService()
	if webrtcService == nil {
		respondError(w, http.StatusInternalServerError, "Serviço WebRTC não disponível")
		return
	}

	// Determine call type (default to audio)
	callType := req.CallType
	if callType == "" {
		callType = "audio"
	}

	var callErr error
	if callType == "video" {
		callErr = webrtcService.StartVideoCall(targetPeerID)
	} else {
		callErr = webrtcService.StartWebRTCCall(targetPeerID)
	}

	if callErr != nil {
		log.Printf("[NEXUS] ERRO: Falha ao iniciar chamada %s WebRTC: %v", callType, callErr)
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Falha ao iniciar chamada WebRTC: %v", callErr))
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"status":    "Chamada WebRTC iniciada",
		"call_type": callType,
	})
}

func (s *APIServer) handleWebRTCHangup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	var req webrtcCallRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.TargetPeerID == "" {
		respondError(w, http.StatusBadRequest, "TargetPeerID é obrigatório")
		return
	}

	targetPeerID, err := peer.Decode(req.TargetPeerID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "PeerID alvo inválido")
		return
	}

	webrtcService := s.nexusHost.GetWebRTCService()
	if webrtcService == nil {
		respondError(w, http.StatusInternalServerError, "Serviço WebRTC não disponível")
		return
	}

	if err := webrtcService.CloseWebRTCCall(targetPeerID); err != nil {
		log.Printf("[NEXUS] ERRO: Falha ao encerrar chamada WebRTC: %v", err)
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Falha ao encerrar chamada WebRTC: %v", err))
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "Chamada WebRTC encerrada"})
}

func (s *APIServer) sendPeerUpdates(ctx context.Context) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			connectedPeers, err := s.nexusHost.GetConnectedPeers()
			if err != nil {
				continue
			}

			message := map[string]interface{}{
				"type":            "peer_update",
				"connected_peers": connectedPeers,
				"local_peer_id":   s.p2pHost.ID().String(),
			}
			s.hub.Broadcast <- message
		}
	}
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Erro ao serializar JSON")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(response)
}

func respondError(w http.ResponseWriter, code int, message string) {
	respondJSON(w, code, map[string]string{"error": message})
}

type connectRequest struct {
	Address string `json:"address"`
}

func (s *APIServer) handleConnect(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	var req connectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.Address == "" {
		respondError(w, http.StatusBadRequest, "Endereço é obrigatório")
		return
	}

	// Parse multiaddr and connect
	maddr, err := multiaddr.NewMultiaddr(req.Address)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Endereço multiaddr inválido")
		return
	}

	peerInfo, err := peer.AddrInfoFromP2pAddr(maddr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Não foi possível extrair informações do peer")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := s.nexusHost.Connect(ctx, *peerInfo); err != nil {
		log.Printf("[NEXUS] Falha ao conectar a %s: %v", peerInfo.ID.String()[:16], err)
		respondError(w, http.StatusInternalServerError, "Falha ao conectar: "+err.Error())
		return
	}

	log.Printf("[NEXUS] ✓ Conectado manualmente a %s", peerInfo.ID.String()[:16])
	respondJSON(w, http.StatusOK, map[string]string{
		"status":  "connected",
		"peer_id": peerInfo.ID.String(),
	})
}

// ═══════════════════════════════════════════════════════════════════
// FEED SOCIAL HANDLERS
// ═══════════════════════════════════════════════════════════════════

func (s *APIServer) handleFeed(w http.ResponseWriter, r *http.Request) {
	if s.feedService == nil {
		respondError(w, http.StatusServiceUnavailable, "Feed service não disponível")
		return
	}

	limit := 50
	offset := 0
	posts := s.feedService.GetPosts(limit, offset)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"posts":        posts,
		"local_peer_id": s.p2pHost.ID().String(),
	})
}

type createPostRequest struct {
	Content   string `json:"content"`
	Type      string `json:"type"`
	MediaHash string `json:"media_hash,omitempty"`
	MediaType string `json:"media_type,omitempty"`
	MediaSize int64  `json:"media_size,omitempty"`
	MediaName string `json:"media_name,omitempty"`
}

func (s *APIServer) handleCreatePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if s.feedService == nil {
		respondError(w, http.StatusServiceUnavailable, "Feed service não disponível")
		return
	}

	var req createPostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.Content == "" {
		respondError(w, http.StatusBadRequest, "Conteúdo é obrigatório")
		return
	}

	postType := social.PostTypeText
	if req.Type != "" {
		postType = social.PostType(req.Type)
	}

	// Build media reference if provided (referência, não embed)
	var media *social.MediaReference
	if req.MediaHash != "" {
		media = &social.MediaReference{
			Hash:     req.MediaHash,
			MimeType: req.MediaType,
			Size:     req.MediaSize,
			Name:     req.MediaName,
		}
	}

	post, err := s.feedService.CreatePost(postType, req.Content, media)
	if err != nil {
		log.Printf("[NEXUS] Erro ao criar post: %v", err)
		respondError(w, http.StatusInternalServerError, "Falha ao criar post")
		return
	}

	respondJSON(w, http.StatusOK, post)
}

type likePostRequest struct {
	PostID string `json:"post_id"`
}

func (s *APIServer) handleLikePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if s.feedService == nil {
		respondError(w, http.StatusServiceUnavailable, "Feed service não disponível")
		return
	}

	var req likePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if err := s.feedService.LikePost(req.PostID); err != nil {
		respondError(w, http.StatusInternalServerError, "Falha ao curtir post")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "liked"})
}

type followRequest struct {
	PeerID string `json:"peer_id"`
}

func (s *APIServer) handleFollow(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if s.feedService == nil {
		respondError(w, http.StatusServiceUnavailable, "Feed service não disponível")
		return
	}

	var req followRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	s.feedService.Follow(req.PeerID)
	respondJSON(w, http.StatusOK, map[string]string{"status": "following"})
}

func (s *APIServer) handleUnfollow(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if s.feedService == nil {
		respondError(w, http.StatusServiceUnavailable, "Feed service não disponível")
		return
	}

	var req followRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	s.feedService.Unfollow(req.PeerID)
	respondJSON(w, http.StatusOK, map[string]string{"status": "unfollowed"})
}

func (s *APIServer) handleBlock(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if s.feedService == nil {
		respondError(w, http.StatusServiceUnavailable, "Feed service não disponível")
		return
	}

	var req followRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	s.feedService.Block(req.PeerID)
	respondJSON(w, http.StatusOK, map[string]string{"status": "blocked"})
}

type feedSettingsRequest struct {
	PersistenceMode string `json:"persistence_mode"` // "all", "following", "none"
}

func (s *APIServer) handleFeedSettings(w http.ResponseWriter, r *http.Request) {
	if s.feedService == nil {
		respondError(w, http.StatusServiceUnavailable, "Feed service não disponível")
		return
	}

	if r.Method == http.MethodGet {
		// Return current settings
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"following": s.feedService.GetFollowing(),
		})
		return
	}

	if r.Method == http.MethodPost {
		var req feedSettingsRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "JSON inválido")
			return
		}

		s.feedService.SetPersistenceMode(social.PersistenceMode(req.PersistenceMode))
		respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
		return
	}

	respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
}

// ═══════════════════════════════════════════════════════════════════
// SWARM/FILE SHARING HANDLERS
// ═══════════════════════════════════════════════════════════════════

func (s *APIServer) handleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	// Parse multipart form (max 100MB)
	if err := r.ParseMultipartForm(100 << 20); err != nil {
		respondError(w, http.StatusBadRequest, "Falha ao parsear upload")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "Arquivo não encontrado")
		return
	}
	defer file.Close()

	// Save to temp file
	tempDir := "data/uploads"
	os.MkdirAll(tempDir, 0755)
	tempPath := filepath.Join(tempDir, header.Filename)

	dst, err := os.Create(tempPath)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Falha ao criar arquivo")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		respondError(w, http.StatusInternalServerError, "Falha ao salvar arquivo")
		return
	}

	// If swarm service is available, chunk and share
	if s.swarmService != nil {
		metadata, err := s.swarmService.ShareFile(tempPath)
		if err != nil {
			log.Printf("[NEXUS] Erro ao compartilhar arquivo: %v", err)
		} else {
			respondJSON(w, http.StatusOK, map[string]interface{}{
				"status":   "uploaded",
				"path":     tempPath,
				"metadata": metadata,
			})
			return
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status": "uploaded",
		"path":   tempPath,
	})
}

func (s *APIServer) handleShareFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if s.swarmService == nil {
		respondError(w, http.StatusServiceUnavailable, "Swarm service não disponível")
		return
	}

	var req struct {
		FilePath string `json:"file_path"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	metadata, err := s.swarmService.ShareFile(req.FilePath)
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Falha ao compartilhar: %v", err))
		return
	}

	respondJSON(w, http.StatusOK, metadata)
}

func (s *APIServer) handleDownloadFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if s.swarmService == nil {
		respondError(w, http.StatusServiceUnavailable, "Swarm service não disponível")
		return
	}

	var metadata swarm.FileMetadata
	if err := json.NewDecoder(r.Body).Decode(&metadata); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	progress, err := s.swarmService.DownloadFile(&metadata)
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Falha ao iniciar download: %v", err))
		return
	}

	respondJSON(w, http.StatusOK, progress)
}

func (s *APIServer) handleDownloadProgress(w http.ResponseWriter, r *http.Request) {
	if s.swarmService == nil {
		respondError(w, http.StatusServiceUnavailable, "Swarm service não disponível")
		return
	}

	fileHash := r.URL.Query().Get("hash")
	if fileHash == "" {
		respondError(w, http.StatusBadRequest, "Hash é obrigatório")
		return
	}

	progress := s.swarmService.GetDownloadProgress(fileHash)
	if progress == nil {
		respondError(w, http.StatusNotFound, "Download não encontrado")
		return
	}

	respondJSON(w, http.StatusOK, progress)
}

func (s *APIServer) handleGetChunk(w http.ResponseWriter, r *http.Request) {
	if s.swarmService == nil {
		respondError(w, http.StatusServiceUnavailable, "Swarm service não disponível")
		return
	}

	chunkHash := r.URL.Query().Get("hash")
	if chunkHash == "" {
		respondError(w, http.StatusBadRequest, "Hash é obrigatório")
		return
	}

	chunker := s.swarmService.GetChunker()
	data, err := chunker.GetChunk(chunkHash)
	if err != nil {
		respondError(w, http.StatusNotFound, "Chunk não encontrado")
		return
	}

	// Return as base64 for JSON compatibility
	respondJSON(w, http.StatusOK, map[string]string{
		"hash": chunkHash,
		"data": base64.StdEncoding.EncodeToString(data),
	})
}

// ═══════════════════════════════════════════════════════════════════
// COMMUNITY HANDLERS
// ═══════════════════════════════════════════════════════════════════

func (s *APIServer) handleCommunities(w http.ResponseWriter, r *http.Request) {
	if s.communityService == nil {
		respondError(w, http.StatusServiceUnavailable, "Community service não disponível")
		return
	}

	communities := s.communityService.GetCommunities()
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"communities": communities,
	})
}

type createCommunityRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Rules       []string `json:"rules,omitempty"`
	Tags        []string `json:"tags,omitempty"`
	IsPrivate   bool     `json:"is_private"`
}

func (s *APIServer) handleCreateCommunity(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if s.communityService == nil {
		respondError(w, http.StatusServiceUnavailable, "Community service não disponível")
		return
	}

	var req createCommunityRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Nome é obrigatório")
		return
	}

	community, err := s.communityService.CreateCommunity(req.Name, req.Description, req.Rules, req.Tags, req.IsPrivate)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Falha ao criar comunidade")
		return
	}

	respondJSON(w, http.StatusOK, community)
}

func (s *APIServer) handleJoinCommunity(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if s.communityService == nil {
		respondError(w, http.StatusServiceUnavailable, "Community service não disponível")
		return
	}

	var community community.Community
	if err := json.NewDecoder(r.Body).Decode(&community); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if err := s.communityService.JoinCommunity(&community); err != nil {
		respondError(w, http.StatusInternalServerError, "Falha ao entrar na comunidade")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "joined"})
}

type leaveCommunityRequest struct {
	CommunityID string `json:"community_id"`
}

func (s *APIServer) handleLeaveCommunity(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if s.communityService == nil {
		respondError(w, http.StatusServiceUnavailable, "Community service não disponível")
		return
	}

	var req leaveCommunityRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if err := s.communityService.LeaveCommunity(req.CommunityID); err != nil {
		respondError(w, http.StatusInternalServerError, "Falha ao sair da comunidade")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "left"})
}

func (s *APIServer) handleCommunityMessages(w http.ResponseWriter, r *http.Request) {
	if s.communityService == nil {
		respondError(w, http.StatusServiceUnavailable, "Community service não disponível")
		return
	}

	communityID := r.URL.Query().Get("id")
	if communityID == "" {
		respondError(w, http.StatusBadRequest, "ID da comunidade é obrigatório")
		return
	}

	messages := s.communityService.GetMessages(communityID, 100)
	members := s.communityService.GetMembers(communityID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"messages": messages,
		"members":  members,
	})
}

type sendCommunityMessageRequest struct {
	CommunityID string `json:"community_id"`
	Content     string `json:"content"`
	ReplyTo     string `json:"reply_to,omitempty"`
}

func (s *APIServer) handleSendCommunityMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if s.communityService == nil {
		respondError(w, http.StatusServiceUnavailable, "Community service não disponível")
		return
	}

	var req sendCommunityMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	msg, err := s.communityService.SendMessage(req.CommunityID, req.Content, req.ReplyTo)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Falha ao enviar mensagem")
		return
	}

	respondJSON(w, http.StatusOK, msg)
}

// ═══════════════════════════════════════════════════════════════════
// REPUTATION HANDLERS
// ═══════════════════════════════════════════════════════════════════

func (s *APIServer) handleGetReputation(w http.ResponseWriter, r *http.Request) {
	if s.reputationSystem == nil {
		respondError(w, http.StatusServiceUnavailable, "Reputation system não disponível")
		return
	}

	peerID := r.URL.Query().Get("peer_id")
	if peerID == "" {
		respondError(w, http.StatusBadRequest, "peer_id é obrigatório")
		return
	}

	score := s.reputationSystem.GetScore(peerID)
	overall := s.reputationSystem.GetOverallScore(peerID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"score":         score,
		"overall_score": overall,
		"is_trusted":    s.reputationSystem.IsTrusted(peerID, 0.5),
	})
}

func (s *APIServer) handleTopPeers(w http.ResponseWriter, r *http.Request) {
	if s.reputationSystem == nil {
		respondError(w, http.StatusServiceUnavailable, "Reputation system não disponível")
		return
	}

	topPeers := s.reputationSystem.GetTopPeers(20)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"top_peers": topPeers,
	})
}

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATION HANDLERS
// ═══════════════════════════════════════════════════════════════════

func (s *APIServer) handleNotifications(w http.ResponseWriter, r *http.Request) {
	if s.notifications == nil {
		respondError(w, http.StatusServiceUnavailable, "Notification service não disponível")
		return
	}

	notifications := s.notifications.GetAll(50)
	unreadCount := s.notifications.GetUnreadCount()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"notifications": notifications,
		"unread_count":  unreadCount,
	})
}

type markReadRequest struct {
	NotificationID string `json:"notification_id"`
	MarkAll        bool   `json:"mark_all"`
}

func (s *APIServer) handleMarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if s.notifications == nil {
		respondError(w, http.StatusServiceUnavailable, "Notification service não disponível")
		return
	}

	var req markReadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.MarkAll {
		s.notifications.MarkAllAsRead()
	} else if req.NotificationID != "" {
		s.notifications.MarkAsRead(req.NotificationID)
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *APIServer) handleClearNotifications(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if s.notifications == nil {
		respondError(w, http.StatusServiceUnavailable, "Notification service não disponível")
		return
	}

	s.notifications.ClearAll()
	respondJSON(w, http.StatusOK, map[string]string{"status": "cleared"})
}


// ═══════════════════════════════════════════════════════════════════
// SIGNALING HANDLERS
// ═══════════════════════════════════════════════════════════════════

func (s *APIServer) handleSignalingStats(w http.ResponseWriter, r *http.Request) {
	if s.signalingHub == nil {
		respondError(w, http.StatusServiceUnavailable, "Signaling hub não disponível")
		return
	}

	stats := s.signalingHub.GetStats()
	respondJSON(w, http.StatusOK, stats)
}
