package p2p

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/libp2p/go-libp2p"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/peerstore"
	"github.com/libp2p/go-libp2p/p2p/discovery/mdns"
	"github.com/libp2p/go-libp2p/p2p/security/noise"
	libp2ptls "github.com/libp2p/go-libp2p/p2p/security/tls"
	"github.com/multiformats/go-multiaddr"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/config"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/database"
)

// P2PHost wraps the libp2p host and provides custom functionality.
type P2PHost struct {
	host.Host
	DHT          *dht.IpfsDHT
	db           *database.SQLiteDB
	cfg          *config.Config
	privKey      crypto.PrivKey
	pubsub       *PubSubService
	peerNotifier *PeerConnectionNotifier
	webrtc       *WebRTCService
}

// NewP2PHost creates and configures a new libp2p host.
func NewP2PHost(ctx context.Context, privKey crypto.PrivKey, db *database.SQLiteDB, cfg *config.Config) (*P2PHost, error) {
	// Configure libp2p options
	opts := []libp2p.Option{
		libp2p.Identity(privKey),
		libp2p.ListenAddrStrings(
			fmt.Sprintf("/ip4/0.0.0.0/tcp/%d", cfg.P2PPort),
			fmt.Sprintf("/ip4/0.0.0.0/udp/%d/quic-v1", cfg.P2PPort),
		),
		libp2p.Security(noise.ID, noise.New),
		libp2p.Security(libp2ptls.ID, libp2ptls.New),
		libp2p.DefaultMuxers,
		libp2p.NATPortMap(),
		libp2p.EnableRelay(),
	}

	// Create the libp2p host
	h, err := libp2p.New(opts...)
	if err != nil {
		return nil, fmt.Errorf("falha ao criar host libp2p: %w", err)
	}

	// Set up PeerConnectionNotifier
	peerNotifier := NewPeerConnectionNotifier(h, db)
	h.Network().Notify(peerNotifier)

	nexusHost := &P2PHost{
		Host:         h,
		db:           db,
		cfg:          cfg,
		privKey:      privKey,
		peerNotifier: peerNotifier,
	}

	// Initialize Kademlia DHT
	dhtMode := dht.ModeServer
	if cfg.DHTClient {
		dhtMode = dht.ModeClient
		log.Println("[NEXUS] DHT configurado como modo CLIENTE")
	} else {
		log.Println("[NEXUS] DHT configurado como modo SERVIDOR")
	}

	kadDHT, err := dht.New(ctx, h, dht.Mode(dhtMode))
	if err != nil {
		return nil, fmt.Errorf("falha ao iniciar Kademlia DHT: %w", err)
	}
	nexusHost.DHT = kadDHT

	// Bootstrap DHT
	if err = nexusHost.DHT.Bootstrap(ctx); err != nil {
		return nil, fmt.Errorf("falha ao iniciar bootstrap do DHT: %w", err)
	}
	log.Println("[NEXUS] ✓ DHT Kademlia iniciado")
	go nexusHost.bootstrapDHT(ctx, cfg.BootstrapPeers)

	// Initialize mDNS discovery
	if cfg.EnableMdns {
		log.Println("[NEXUS] Iniciando descoberta mDNS...")
		if err := nexusHost.setupMdns(); err != nil {
			log.Printf("[NEXUS] AVISO: Falha ao configurar mDNS: %v", err)
		} else {
			log.Println("[NEXUS] ✓ Descoberta mDNS ativada")
		}
	}

	// Initialize GossipSub
	pubsubService, err := NewPubSubService(ctx, h, db)
	if err != nil {
		return nil, fmt.Errorf("falha ao iniciar serviço GossipSub: %w", err)
	}
	nexusHost.pubsub = pubsubService
	log.Println("[NEXUS] ✓ GossipSub inicializado")

	// Initialize WebRTC
	if cfg.EnableWebRTC {
		webrtcService := NewWebRTCService(h, pubsubService, cfg.STUNServers)
		nexusHost.webrtc = webrtcService
		log.Printf("[NEXUS] ✓ WebRTC inicializado com %d servidores STUN", len(cfg.STUNServers))
	}

	// Announce presence periodically
	go func() {
		time.Sleep(5 * time.Second)
		if err := nexusHost.pubsub.SubscribeToTopic(ctx, GlobalDiscoveryTopic); err != nil {
			log.Printf("[NEXUS] ERRO: Falha ao subscrever tópico de descoberta: %v", err)
			return
		}

		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				nexusHost.pubsub.Publish(GlobalDiscoveryTopic, []byte(fmt.Sprintf("nexus:%s", nexusHost.ID().String())))
			}
		}
	}()

	return nexusHost, nil
}

// PeerConnectionNotifier listens for new connections and disconnections.
type PeerConnectionNotifier struct {
	h  host.Host
	db *database.SQLiteDB
}

// NewPeerConnectionNotifier creates a new PeerConnectionNotifier.
func NewPeerConnectionNotifier(h host.Host, db *database.SQLiteDB) *PeerConnectionNotifier {
	return &PeerConnectionNotifier{h: h, db: db}
}

// Implement network.Notifiee interface
func (pcn *PeerConnectionNotifier) Listen(n network.Network, addr multiaddr.Multiaddr)      {}
func (pcn *PeerConnectionNotifier) ListenClose(n network.Network, addr multiaddr.Multiaddr) {}

func (pcn *PeerConnectionNotifier) Connected(n network.Network, conn network.Conn) {
	peerID := conn.RemotePeer()
	log.Printf("[NEXUS] ✓ Conectado a peer: %s", peerID.String()[:16])

	addrs := make([]string, 0)
	for _, a := range pcn.h.Peerstore().Addrs(peerID) {
		addrs = append(addrs, a.String())
	}

	p := &database.Peer{
		ID:       peerID.String(),
		Addrs:    fmt.Sprintf("%v", addrs),
		LastSeen: time.Now().Unix(),
	}
	if err := pcn.db.SavePeer(p); err != nil {
		log.Printf("[NEXUS] ERRO: Falha ao salvar peer: %v", err)
	}
}

func (pcn *PeerConnectionNotifier) Disconnected(n network.Network, conn network.Conn) {
	peerID := conn.RemotePeer()
	log.Printf("[NEXUS] Desconectado de peer: %s", peerID.String()[:16])
}

func (pcn *PeerConnectionNotifier) OpenedStream(n network.Network, s network.Stream)  {}
func (pcn *PeerConnectionNotifier) ClosedStream(n network.Network, s network.Stream)  {}

// setupMdns sets up mDNS for local peer discovery.
func (ph *P2PHost) setupMdns() error {
	s := mdns.NewMdnsService(ph.Host, "nexus-mesh-discovery", ph)
	return s.Start()
}

// HandlePeerFound is called when a new peer is found via mDNS.
func (ph *P2PHost) HandlePeerFound(p peer.AddrInfo) {
	if p.ID == ph.ID() {
		return
	}

	log.Printf("[NEXUS] mDNS: Peer encontrado: %s", p.ID.String()[:16])
	ph.Peerstore().AddAddrs(p.ID, p.Addrs, peerstore.PermanentAddrTTL)

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := ph.Connect(ctx, p); err != nil {
			log.Printf("[NEXUS] mDNS: Falha ao conectar: %v", err)
		} else {
			log.Printf("[NEXUS] mDNS: ✓ Conectado a %s", p.ID.String()[:16])
		}
	}()
}

// bootstrapDHT connects to initial bootstrap peers.
func (ph *P2PHost) bootstrapDHT(ctx context.Context, bootstrapPeers []string) {
	var peersToConnect []peer.AddrInfo
	for _, p := range bootstrapPeers {
		addr, err := multiaddr.NewMultiaddr(p)
		if err != nil {
			continue
		}
		pi, err := peer.AddrInfoFromP2pAddr(addr)
		if err != nil {
			continue
		}
		ph.Peerstore().AddAddrs(pi.ID, pi.Addrs, peerstore.PermanentAddrTTL)
		peersToConnect = append(peersToConnect, *pi)
	}

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			for _, p := range peersToConnect {
				if p.ID == ph.ID() {
					continue
				}
				connectCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
				if err := ph.Connect(connectCtx, p); err == nil {
					log.Printf("[NEXUS] DHT: ✓ Conectado a bootstrap peer")
				}
				cancel()
			}
		}
	}
}

// GetConnectedPeers returns a list of currently connected peers.
func (ph *P2PHost) GetConnectedPeers() ([]*database.Peer, error) {
	var connectedPeers []*database.Peer
	for _, conn := range ph.Network().Conns() {
		peerID := conn.RemotePeer()
		latency := ph.Peerstore().LatencyEWMA(peerID)

		addrs := make([]string, 0)
		for _, a := range ph.Peerstore().Addrs(peerID) {
			addrs = append(addrs, a.String())
		}

		dbPeer, _ := ph.db.GetPeer(peerID.String())
		nickname := ""
		if dbPeer != nil {
			nickname = dbPeer.Nickname
		}

		connectedPeers = append(connectedPeers, &database.Peer{
			ID:        peerID.String(),
			Addrs:     fmt.Sprintf("%v", addrs),
			LastSeen:  time.Now().Unix(),
			Nickname:  nickname,
			LatencyMs: int64(latency / time.Millisecond),
		})
	}
	return connectedPeers, nil
}

// GetPubSubService returns the GossipSub service.
func (ph *P2PHost) GetPubSubService() *PubSubService {
	return ph.pubsub
}

// GetWebRTCService returns the WebRTC service.
func (ph *P2PHost) GetWebRTCService() *WebRTCService {
	return ph.webrtc
}

// GetDB returns the database instance.
func (ph *P2PHost) GetDB() *database.SQLiteDB {
	return ph.db
}

// GetPrivKey returns the private key.
func (ph *P2PHost) GetPrivKey() crypto.PrivKey {
	return ph.privKey
}

// GetGossipSub returns the underlying GossipSub instance.
func (ph *P2PHost) GetGossipSub() interface{} {
	if ph.pubsub != nil {
		return ph.pubsub.ps
	}
	return nil
}
