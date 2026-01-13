package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/api"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/config"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/database"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/identity"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/kernel"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/p2p"
)

const (
	shutdownTimeout = 10 * time.Second
	appName         = "NexusSovereign"
)

// getDataDir returns the appropriate data directory for the OS
func getDataDir() string {
	var baseDir string

	switch runtime.GOOS {
	case "windows":
		baseDir = os.Getenv("APPDATA")
		if baseDir == "" {
			baseDir = filepath.Join(os.Getenv("USERPROFILE"), "AppData", "Roaming")
		}
	case "darwin":
		baseDir = filepath.Join(os.Getenv("HOME"), "Library", "Application Support")
	default: // Linux and others
		baseDir = os.Getenv("XDG_DATA_HOME")
		if baseDir == "" {
			baseDir = filepath.Join(os.Getenv("HOME"), ".local", "share")
		}
	}

	return filepath.Join(baseDir, appName)
}

func main() {
	// Set up data directory
	dataDir := getDataDir()
	if err := os.MkdirAll(dataDir, 0700); err != nil {
		log.Fatalf("[NEXUS] ERRO CRÍTICO: Falha ao criar diretório de dados: %v", err)
	}
	os.Chdir(dataDir)
	log.Printf("[NEXUS] Diretório de dados: %s", dataDir)

	// Load .env if exists
	envPath := filepath.Join(dataDir, ".env")
	if err := godotenv.Load(envPath); err != nil && !os.IsNotExist(err) {
		log.Printf("[NEXUS] AVISO: Falha ao carregar .env: %v", err)
	}

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("[NEXUS] ERRO CRÍTICO: Falha ao carregar configuração: %v", err)
	}

	startTime := time.Now()
	log.Printf("[NEXUS] ═══════════════════════════════════════════════════")
	log.Printf("[NEXUS] NEXUS SOVEREIGN MESH NETWORK v%s", cfg.Version)
	log.Printf("[NEXUS] ═══════════════════════════════════════════════════")

	// Create main context with cancellation
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize database with SQLCipher encryption
	log.Println("[NEXUS] Inicializando banco de dados criptografado...")
	db, err := database.NewSQLiteDB(cfg.DatabasePath, cfg.DatabasePassphrase)
	if err != nil {
		log.Fatalf("[NEXUS] ERRO CRÍTICO: Falha ao inicializar banco de dados: %v", err)
	}
	defer db.Close()
	log.Println("[NEXUS] ✓ Banco de dados SQLCipher inicializado")

	// Load or generate identity keypair
	log.Println("[NEXUS] Carregando identidade X25519...")
	privKey, err := identity.LoadOrGenerateKey(cfg.IdentityFile, cfg.IdentityPassphrase)
	if err != nil {
		log.Fatalf("[NEXUS] ERRO CRÍTICO: Falha ao carregar/gerar identidade: %v", err)
	}
	peerID := identity.PeerIDFromPrivateKey(privKey)
	log.Printf("[NEXUS] ✓ Identidade carregada: %s", peerID.String())

	// Initialize P2P host with libp2p
	log.Println("[NEXUS] Inicializando host P2P...")
	p2pHost, err := p2p.NewP2PHost(ctx, privKey, db, cfg)
	if err != nil {
		log.Fatalf("[NEXUS] ERRO CRÍTICO: Falha ao inicializar host P2P: %v", err)
	}
	defer p2pHost.Close()

	// Log listening addresses
	log.Println("[NEXUS] ✓ Host P2P inicializado")
	log.Println("[NEXUS] Endereços de escuta:")
	for _, addr := range p2pHost.Addrs() {
		log.Printf("[NEXUS]   → %s/p2p/%s", addr, peerID.String())
	}

	// Initialize API server for frontend communication
	log.Println("[NEXUS] Inicializando servidor API...")
	apiServer := api.NewAPIServer(cfg.APIPort, p2pHost, db)

	// Initialize Kernel Bridge (optional integration with Prost-QS)
	var kernelBridge *kernel.Bridge
	if cfg.KernelEnabled {
		log.Println("[NEXUS] Inicializando integração com Prost-QS Kernel...")
		kernelBridge = kernel.NewBridge(&kernel.Config{
			Enabled:   cfg.KernelEnabled,
			KernelURL: cfg.KernelURL,
			AppKey:    cfg.KernelAppKey,
			AppSecret: cfg.KernelAppSecret,
		}, peerID.String())
		
		// Emit node started event
		features := []string{"gossipsub"}
		if cfg.EnableMdns {
			features = append(features, "mdns")
		}
		if cfg.EnableWebRTC {
			features = append(features, "webrtc")
		}
		kernelBridge.EmitNodeStarted(cfg.Version, features)
		log.Printf("[NEXUS] ✓ Kernel Bridge ativo - URL: %s", cfg.KernelURL)
	} else {
		// Create disabled bridge for API compatibility
		kernelBridge = kernel.NewBridge(&kernel.Config{Enabled: false}, peerID.String())
		log.Println("[NEXUS] Kernel Bridge desabilitado (modo soberano)")
	}

	// Inject kernel bridge into API server
	apiServer.SetKernelBridge(kernelBridge, privKey)

	// Start API server in goroutine
	go func() {
		if err := apiServer.Start(ctx); err != nil {
			log.Printf("[NEXUS] ERRO: Servidor API encerrado: %v", err)
		}
	}()
	log.Printf("[NEXUS] ✓ Servidor API escutando em http://localhost:%s", cfg.APIPort)

	// Print startup summary
	log.Println("[NEXUS] ═══════════════════════════════════════════════════")
	log.Printf("[NEXUS] NODO ATIVO - Tempo de inicialização: %v", time.Since(startTime))
	log.Println("[NEXUS] ═══════════════════════════════════════════════════")
	log.Println("[NEXUS] Recursos ativos:")
	log.Printf("[NEXUS]   • mDNS (LAN): %v", cfg.EnableMdns)
	log.Printf("[NEXUS]   • DHT Kademlia: %v (modo: %s)", true, map[bool]string{true: "cliente", false: "servidor"}[cfg.DHTClient])
	log.Printf("[NEXUS]   • WebRTC: %v", cfg.EnableWebRTC)
	log.Printf("[NEXUS]   • GossipSub: ativo")
	log.Printf("[NEXUS]   • Kernel Bridge: %v", cfg.KernelEnabled)
	log.Println("[NEXUS] ═══════════════════════════════════════════════════")

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	<-sigChan
	log.Println("[NEXUS] Sinal de encerramento recebido. Desligando graciosamente...")

	// Cancel context to stop all goroutines
	cancel()

	// Give services time to shutdown
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer shutdownCancel()

	// Wait for shutdown or timeout
	select {
	case <-shutdownCtx.Done():
		log.Println("[NEXUS] Timeout de shutdown atingido")
	case <-time.After(2 * time.Second):
		log.Println("[NEXUS] Serviços encerrados")
	}

	log.Println("[NEXUS] ═══════════════════════════════════════════════════")
	log.Println("[NEXUS] NEXUS NODE ENCERRADO")
	log.Println("[NEXUS] ═══════════════════════════════════════════════════")
}
