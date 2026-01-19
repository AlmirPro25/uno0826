package mcp

import (
	"log"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"prost-qs/backend/internal/memory"
	"prost-qs/backend/pkg/warobs"
)

// ========================================
// MCP KERNEL INITIALIZATION
// ========================================

// MCPKernel holds all MCP components for easy passing around.
type MCPKernel struct {
	Dispatcher  *Dispatcher
	AuditRepo   AuditRepository
	AuditHub    *AuditHub
	Defcon      *DefconManager
	SystemAgent *SystemAgent
	Handler     *MCPHandler
	Memory      *memory.MemoryService
}

// InitMCPKernel initializes the complete MCP subsystem.
// This is the single entry point for MCP integration in main.go.
func InitMCPKernel(config MCPInitConfig) *MCPKernel {
	var auditRepo AuditRepository

	// 1. Configure Audit Repository
	if config.DB != nil && !config.InMemoryAudit {
		// Production Mode: Use Postgres
		repo := NewPostgresAuditRepo(config.DB)
		if err := repo.Migrate(); err != nil {
			log.Printf("⚠️  [MCP] Falha na migração do schema: %v. Fallback para In-Memory.", err)
			auditRepo = NewInMemoryAuditRepo(config.MaxAuditEvents)
		} else {
			auditRepo = repo
			log.Println("📦 [MCP] Postgres Audit Repository conectado")
		}
	} else {
		// Dev Mode: Use In-Memory
		auditRepo = NewInMemoryAuditRepo(config.MaxAuditEvents)
		log.Println("📦 [MCP] Usando In-Memory Audit Repository (Dev Mode)")
	}

	// 2. Create Dispatcher
	dispatcherConfig := DispatcherConfig{
		StrictMode:    config.StrictMode,
		LogToConsole:  config.LogToConsole,
		EnableMetrics: true,
	}
	dispatcher := NewDispatcher(auditRepo, dispatcherConfig)

	// 2.5. Create WebSocket Audit Hub
	auditHub := NewAuditHub()
	go auditHub.Run() // Start the hub's event loop
	dispatcher.SetAuditHub(auditHub)
	log.Println("🔴 [MCP] WebSocket Audit Hub iniciado (real-time streaming)")

	// 3. Create Memory Service
	memoryService := config.Memory
	if memoryService == nil && config.DB != nil {
		memoryService = memory.NewMemoryService(config.DB)
		log.Println("🧠 [MCP] Institutional Memory inicializado")
	}

	// 3. Create and Register Built-in Agents
	systemAgent := NewSystemAgent(dispatcher)
	if err := dispatcher.Register(systemAgent); err != nil {
		log.Printf("⚠️  [MCP] Falha ao registrar SystemAgent: %v", err)
	}

	echoAgent := NewEchoAgent()
	if err := dispatcher.Register(echoAgent); err != nil {
		log.Printf("⚠️  [MCP] Falha ao registrar EchoAgent: %v", err)
	}

	// 4. Create HTTP Handler
	handler := NewMCPHandler(dispatcher, auditRepo, config.WarObs)
	handler.SetAuditHub(auditHub) // Connect hub to handler for WS endpoint

	// 5. Create DEFCON Manager
	defcon := NewDefconManager()
	log.Println("🚨 [MCP] DEFCON System inicializado (Level 5 - Normal)")

	log.Printf("✅ [MCP] Kernel inicializado com %d agentes", dispatcher.AgentCount())

	return &MCPKernel{
		Dispatcher:  dispatcher,
		AuditRepo:   auditRepo,
		AuditHub:    auditHub,
		Defcon:      defcon,
		SystemAgent: systemAgent,
		Handler:     handler,
		Memory:      memoryService,
	}
}

// MCPInitConfig holds configuration for MCP initialization.
type MCPInitConfig struct {
	// DB is the GORM database connection.
	// If provided and InMemoryAudit is false, enables Postgres persistence.
	DB *gorm.DB

	// InMemoryAudit forces in-memory storage even if DB is provided.
	// Use true for development/testing environments without DB.
	InMemoryAudit bool

	// MaxAuditEvents limits the number of events stored in memory.
	// Only applies when using InMemoryAudit.
	MaxAuditEvents int

	// StrictMode makes audit failures fatal.
	// Recommended true for production.
	StrictMode bool

	// LogToConsole prints MCP events to stdout.
	// Useful for debugging.
	LogToConsole bool

	// WarObs is the observability system to pull metrics from.
	WarObs *warobs.WarObservability

	// Memory is the institutional memory service.
	Memory *memory.MemoryService
}

// RegisterRoutes adds MCP routes to a Gin router group.
func (k *MCPKernel) RegisterRoutes(rg *gin.RouterGroup) {
	k.Handler.RegisterRoutes(rg)
	log.Println("✅ [MCP] Rotas registradas em /mcp/*")
}

// RegisterAgent adds a custom agent to the kernel.
func (k *MCPKernel) RegisterAgent(agent MCPAgent) error {
	return k.Dispatcher.Register(agent)
}
