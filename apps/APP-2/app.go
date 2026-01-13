package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"

	"github.com/joho/godotenv"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/api"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/config"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/database"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/identity"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/p2p"
)

// App struct for Wails binding
type App struct {
	ctx       context.Context
	cancel    context.CancelFunc
	p2pHost   *p2p.P2PHost
	apiServer *api.APIServer
	db        *database.SQLiteDB
	cfg       *config.Config
	peerID    string
}

// NewApp creates a new App instance
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx, a.cancel = context.WithCancel(ctx)

	// Initialize the P2P node in background
	go a.initializeNode()
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	log.Println("[NEXUS] Encerrando aplicação...")

	if a.cancel != nil {
		a.cancel()
	}

	if a.p2pHost != nil {
		a.p2pHost.Close()
	}

	if a.db != nil {
		a.db.Close()
	}

	log.Println("[NEXUS] Aplicação encerrada")
}

// getDataDir returns the appropriate data directory for the OS
func getDataDir() string {
	var baseDir string
	appName := "NexusSovereign"

	switch runtime.GOOS {
	case "windows":
		baseDir = os.Getenv("APPDATA")
		if baseDir == "" {
			baseDir = filepath.Join(os.Getenv("USERPROFILE"), "AppData", "Roaming")
		}
	case "darwin":
		baseDir = filepath.Join(os.Getenv("HOME"), "Library", "Application Support")
	default:
		baseDir = os.Getenv("XDG_DATA_HOME")
		if baseDir == "" {
			baseDir = filepath.Join(os.Getenv("HOME"), ".local", "share")
		}
	}

	return filepath.Join(baseDir, appName)
}

// initializeNode starts the P2P node
func (a *App) initializeNode() {
	dataDir := getDataDir()
	if err := os.MkdirAll(dataDir, 0700); err != nil {
		log.Printf("[NEXUS] ERRO: Falha ao criar diretório de dados: %v", err)
		return
	}
	os.Chdir(dataDir)

	// Load .env if exists
	envPath := filepath.Join(dataDir, ".env")
	godotenv.Load(envPath)

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Printf("[NEXUS] ERRO: Falha ao carregar configuração: %v", err)
		return
	}
	a.cfg = cfg

	log.Printf("[NEXUS] Iniciando Nexus Sovereign v%s", cfg.Version)

	// Initialize database
	db, err := database.NewSQLiteDB(cfg.DatabasePath, cfg.DatabasePassphrase)
	if err != nil {
		log.Printf("[NEXUS] ERRO: Falha ao inicializar banco de dados: %v", err)
		return
	}
	a.db = db

	// Load or generate identity
	privKey, err := identity.LoadOrGenerateKey(cfg.IdentityFile, cfg.IdentityPassphrase)
	if err != nil {
		log.Printf("[NEXUS] ERRO: Falha ao carregar identidade: %v", err)
		return
	}
	a.peerID = identity.PeerIDFromPrivateKey(privKey).String()

	// Initialize P2P host
	p2pHost, err := p2p.NewP2PHost(a.ctx, privKey, db, cfg)
	if err != nil {
		log.Printf("[NEXUS] ERRO: Falha ao inicializar P2P: %v", err)
		return
	}
	a.p2pHost = p2pHost

	// Initialize API server
	apiServer := api.NewAPIServer(cfg.APIPort, p2pHost, db)
	a.apiServer = apiServer

	go func() {
		if err := apiServer.Start(a.ctx); err != nil {
			log.Printf("[NEXUS] API Server encerrado: %v", err)
		}
	}()

	log.Printf("[NEXUS] ✓ Nodo ativo - PeerID: %s", a.peerID[:16])
}

// GetPeerID returns the local peer ID
func (a *App) GetPeerID() string {
	return a.peerID
}

// GetStatus returns the current node status
func (a *App) GetStatus() map[string]interface{} {
	status := map[string]interface{}{
		"peer_id":   a.peerID,
		"version":   "0.1.0",
		"connected": false,
	}

	if a.p2pHost != nil {
		peers, _ := a.p2pHost.GetConnectedPeers()
		status["connected"] = len(peers) > 0
		status["peer_count"] = len(peers)
		status["addrs"] = a.p2pHost.Addrs()
	}

	return status
}

// GetConnectedPeers returns the list of connected peers
func (a *App) GetConnectedPeers() []map[string]interface{} {
	if a.p2pHost == nil {
		return []map[string]interface{}{}
	}

	peers, err := a.p2pHost.GetConnectedPeers()
	if err != nil {
		return []map[string]interface{}{}
	}

	result := make([]map[string]interface{}, len(peers))
	for i, p := range peers {
		result[i] = map[string]interface{}{
			"id":         p.ID,
			"nickname":   p.Nickname,
			"addrs":      p.Addrs,
			"last_seen":  p.LastSeen,
			"latency_ms": p.LatencyMs,
		}
	}

	return result
}

// SendMessage sends a message to a peer
func (a *App) SendMessage(peerID, message string) error {
	if a.p2pHost == nil {
		return fmt.Errorf("nodo P2P não inicializado")
	}

	pubsub := a.p2pHost.GetPubSubService()
	if pubsub == nil {
		return fmt.Errorf("serviço PubSub não disponível")
	}

	topic := fmt.Sprintf("%s:%s", p2p.ChatTopicPrefix, peerID)
	return pubsub.Publish(topic, []byte(message))
}
