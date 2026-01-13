package lighthouse

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"sync"
	"time"
)

// LighthouseService gerencia o farol de descoberta P2P
type LighthouseService struct {
	id       string
	region   string
	mu       sync.RWMutex
	peers    map[string]*PeerPresence
	relays   []RelayInfo
	db       LighthouseStore
	kernelURL string
}

// PeerPresence representa a presença de um peer no ledger
type PeerPresence struct {
	PeerID       string            `json:"peer_id"`
	NetworkHash  string            `json:"network_hash"`
	LighthouseID string            `json:"lighthouse_id"`
	Capabilities PeerCapabilities  `json:"capabilities"`
	Reputation   int               `json:"reputation"`
	LastSeen     time.Time         `json:"last_seen"`
	CreatedAt    time.Time         `json:"created_at"`
}

// PeerCapabilities descreve as capacidades de um peer
type PeerCapabilities struct {
	BandwidthMbps  int  `json:"bandwidth_mbps"`
	StorageGB      int  `json:"storage_gb"`
	UptimeHours    int  `json:"uptime_hours"`
	RelayCapable   bool `json:"relay_capable"`
	WebRTCCapable  bool `json:"webrtc_capable"`
}

// RelayInfo informações de um relay TURN/STUN
type RelayInfo struct {
	URL      string `json:"url"`
	Region   string `json:"region"`
	Protocol string `json:"protocol"` // turn, stun
	Priority int    `json:"priority"`
}

// BootstrapResponse resposta do endpoint de bootstrap
type BootstrapResponse struct {
	LighthouseID string        `json:"lighthouse_id"`
	Region       string        `json:"region"`
	Peers        []PeerInfo    `json:"peers"`
	Relays       []RelayInfo   `json:"relays"`
	Lighthouses  []LighthouseInfo `json:"lighthouses"`
}

// PeerInfo informações básicas de um peer para bootstrap
type PeerInfo struct {
	PeerID      string   `json:"peer_id"`
	Addrs       []string `json:"addrs"`
	Reputation  int      `json:"reputation"`
	RelayCapable bool    `json:"relay_capable"`
}

// LighthouseInfo informações de outros faróis
type LighthouseInfo struct {
	ID     string `json:"id"`
	Region string `json:"region"`
	URL    string `json:"url"`
	Status string `json:"status"`
}

// AnnounceRequest request para anunciar presença
type AnnounceRequest struct {
	PeerID       string           `json:"peer_id"`
	Addrs        []string         `json:"addrs"`
	Capabilities PeerCapabilities `json:"capabilities"`
	Region       string           `json:"region,omitempty"`
}

// LighthouseStore interface para persistência
type LighthouseStore interface {
	SavePresence(ctx context.Context, presence *PeerPresence) error
	GetPresence(ctx context.Context, peerID string) (*PeerPresence, error)
	ListPeers(ctx context.Context, region string, limit int) ([]*PeerPresence, error)
	DeletePresence(ctx context.Context, peerID string) error
	UpdateLastSeen(ctx context.Context, peerID string) error
	GetLighthouses(ctx context.Context) ([]LighthouseInfo, error)
}

// NewLighthouseService cria um novo serviço de farol
func NewLighthouseService(id, region, kernelURL string, db LighthouseStore) *LighthouseService {
	return &LighthouseService{
		id:        id,
		region:    region,
		peers:     make(map[string]*PeerPresence),
		relays:    defaultRelays(),
		db:        db,
		kernelURL: kernelURL,
	}
}

// Bootstrap retorna informações para um novo peer se conectar
func (s *LighthouseService) Bootstrap(ctx context.Context, region string) (*BootstrapResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	// Buscar peers próximos
	peers, err := s.db.ListPeers(ctx, region, 20)
	if err != nil {
		return nil, err
	}

	// Converter para PeerInfo
	peerInfos := make([]PeerInfo, 0, len(peers))
	for _, p := range peers {
		peerInfos = append(peerInfos, PeerInfo{
			PeerID:       p.PeerID,
			Reputation:   p.Reputation,
			RelayCapable: p.Capabilities.RelayCapable,
		})
	}

	// Buscar outros faróis
	lighthouses, _ := s.db.GetLighthouses(ctx)

	return &BootstrapResponse{
		LighthouseID: s.id,
		Region:       s.region,
		Peers:        peerInfos,
		Relays:       s.relays,
		Lighthouses:  lighthouses,
	}, nil
}

// Announce registra a presença de um peer
func (s *LighthouseService) Announce(ctx context.Context, req *AnnounceRequest) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Gerar hash da região (não armazenar IP diretamente)
	networkHash := hashRegion(req.Region)

	presence := &PeerPresence{
		PeerID:       req.PeerID,
		NetworkHash:  networkHash,
		LighthouseID: s.id,
		Capabilities: req.Capabilities,
		Reputation:   100, // Inicial
		LastSeen:     time.Now(),
		CreatedAt:    time.Now(),
	}

	// Salvar no cache local
	s.peers[req.PeerID] = presence

	// Persistir no banco
	return s.db.SavePresence(ctx, presence)
}

// Heartbeat atualiza o last_seen de um peer
func (s *LighthouseService) Heartbeat(ctx context.Context, peerID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if p, ok := s.peers[peerID]; ok {
		p.LastSeen = time.Now()
	}

	return s.db.UpdateLastSeen(ctx, peerID)
}

// ListPeers lista peers conectados
func (s *LighthouseService) ListPeers(ctx context.Context, region string, limit int) ([]*PeerPresence, error) {
	return s.db.ListPeers(ctx, region, limit)
}

// GetRelays retorna lista de relays disponíveis
func (s *LighthouseService) GetRelays() []RelayInfo {
	return s.relays
}

// Status retorna status do farol
func (s *LighthouseService) Status() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return map[string]interface{}{
		"lighthouse_id": s.id,
		"region":        s.region,
		"peers_cached":  len(s.peers),
		"relays":        len(s.relays),
		"status":        "active",
	}
}

// CleanupStale remove peers que não deram heartbeat
func (s *LighthouseService) CleanupStale(ctx context.Context, maxAge time.Duration) int {
	s.mu.Lock()
	defer s.mu.Unlock()

	cutoff := time.Now().Add(-maxAge)
	removed := 0

	for id, p := range s.peers {
		if p.LastSeen.Before(cutoff) {
			delete(s.peers, id)
			s.db.DeletePresence(ctx, id)
			removed++
		}
	}

	return removed
}

// hashRegion gera hash da região para privacidade
func hashRegion(region string) string {
	h := sha256.Sum256([]byte("nexus_region_" + region))
	return "sha256:" + hex.EncodeToString(h[:8])
}

// defaultRelays retorna relays padrão
func defaultRelays() []RelayInfo {
	return []RelayInfo{
		{URL: "turn:turn.nexus.network:3478", Region: "global", Protocol: "turn", Priority: 1},
		{URL: "stun:stun.l.google.com:19302", Region: "global", Protocol: "stun", Priority: 2},
		{URL: "stun:stun1.l.google.com:19302", Region: "global", Protocol: "stun", Priority: 3},
	}
}
