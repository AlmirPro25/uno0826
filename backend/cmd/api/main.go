package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"gorm.io/gorm"

	legacyad "prost-qs/backend/internal/ad"
	"prost-qs/backend/internal/admin"
	"prost-qs/backend/internal/ads"
	"prost-qs/backend/internal/agent"
	"prost-qs/backend/internal/ai"
	"prost-qs/backend/internal/application"
	"prost-qs/backend/internal/approval"
	"prost-qs/backend/internal/audit"
	"prost-qs/backend/internal/auth"
	"prost-qs/backend/internal/authority"
	"prost-qs/backend/internal/autonomy"
	"prost-qs/backend/internal/billing"
	"prost-qs/backend/internal/command"
	"prost-qs/backend/internal/decision"
	"prost-qs/backend/internal/event"
	"prost-qs/backend/internal/explainability"
	"prost-qs/backend/internal/federation"
	"prost-qs/backend/internal/financial"
	"prost-qs/backend/internal/health"
	"prost-qs/backend/internal/identity"
	"prost-qs/backend/internal/jobs"
	kernel_billing "prost-qs/backend/internal/kernel_billing"
	"prost-qs/backend/internal/killswitch"
	"prost-qs/backend/internal/memory"
	"prost-qs/backend/internal/observability"
	"prost-qs/backend/internal/observer"
	"prost-qs/backend/internal/payment"
	"prost-qs/backend/internal/policy"
	"prost-qs/backend/internal/replication"
	"prost-qs/backend/internal/risk"
	"prost-qs/backend/internal/secrets"
	"prost-qs/backend/internal/shadow"
	"prost-qs/backend/internal/telemetry"
	"prost-qs/backend/internal/narrative"
	"prost-qs/backend/internal/notification"
	"prost-qs/backend/internal/usage"
	"prost-qs/backend/internal/rules"
	"prost-qs/backend/internal/activity"
	"prost-qs/backend/internal/webhook"
	"prost-qs/backend/internal/apikey"
	"prost-qs/backend/internal/events"
	"prost-qs/backend/docs"
	"prost-qs/backend/pkg/alerting"
	"prost-qs/backend/pkg/apigate"
	"prost-qs/backend/pkg/capabilities"
	"prost-qs/backend/pkg/db"
	"prost-qs/backend/pkg/immunity"
	"prost-qs/backend/pkg/invariants"
	"prost-qs/backend/pkg/middleware"
	"prost-qs/backend/pkg/utils"
	"prost-qs/backend/pkg/warobs"
)

func main() {
	// Carregar variáveis de ambiente do arquivo .env (se existir)
	// Em produção, as variáveis vêm do ambiente do container
	_ = godotenv.Load("../.env") // Ignora erro se não existir

	serverPort := os.Getenv("SERVER_PORT")
	if serverPort == "" {
		serverPort = "8080" // Porta padrão
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET não configurado. Por favor, defina-o no arquivo .env")
	}
	utils.SetJWTSecret(jwtSecret)

	aesSecretKey := os.Getenv("AES_SECRET_KEY")
	if aesSecretKey == "" || len(aesSecretKey) != 32 { // AES-256
		log.Fatal("AES_SECRET_KEY não configurado ou não tem 32 bytes. Por favor, defina-o no arquivo .env")
	}
	utils.SetAESKey([]byte(aesSecretKey))

	// Master key para Secrets System (pode ser a mesma ou diferente)
	secretsMasterKey := os.Getenv("SECRETS_MASTER_KEY")
	if secretsMasterKey == "" {
		secretsMasterKey = aesSecretKey // Fallback para AES_SECRET_KEY
		log.Println("⚠️  SECRETS_MASTER_KEY não definida, usando AES_SECRET_KEY como fallback")
	}
	if len(secretsMasterKey) != 32 {
		log.Fatal("SECRETS_MASTER_KEY deve ter exatamente 32 bytes para AES-256")
	}

	sqliteDBPath := os.Getenv("SQLITE_DB_PATH")
	if sqliteDBPath == "" {
		sqliteDBPath = "/data/prostqs.db" // Caminho padrão para o DB SQLite (absoluto para produção)
	}

	// ========================================
	// DATABASE INITIALIZATION
	// Prioridade: DATABASE_URL (Postgres) > SQLITE_DB_PATH (SQLite)
	// ========================================
	var gormDB *gorm.DB
	var err error

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL != "" {
		// Usar PostgreSQL (Neon, Supabase, etc.)
		gormDB, err = db.InitPostgres(databaseURL)
		if err != nil {
			log.Fatalf("Falha ao conectar ao PostgreSQL: %v", err)
		}
	} else {
		// Fallback para SQLite (desenvolvimento local)
		gormDB, err = db.InitSQLite(sqliteDBPath)
		if err != nil {
			log.Fatalf("Falha ao inicializar o banco de dados SQLite: %v", err)
		}
	}

	// Migrar schemas
	err = db.MigrateSchema(gormDB)
	if err != nil {
		log.Fatalf("Falha ao migrar o schema do banco de dados: %v", err)
	}

	// Configurar Gin
	r := gin.Default()

	// ========================================
	// CORS - DEVE SER O PRIMEIRO MIDDLEWARE
	// "Sem CORS, o browser bloqueia tudo"
	// ========================================
	r.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			// Permitir localhost em qualquer porta
			if strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "http://127.0.0.1:") {
				return true
			}
			// Permitir qualquer subdomínio do Vercel
			if strings.HasSuffix(origin, ".vercel.app") {
				return true
			}
			// Permitir domínios específicos
			allowedOrigins := []string{
				"https://uno0826.onrender.com",
				"https://vox-bridge-api.onrender.com",
				"https://frontend-prost.vercel.app",
			}
			for _, allowed := range allowedOrigins {
				if origin == allowed {
					return true
				}
			}
			return false
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept", "User-Agent", "X-Requested-With", "X-HTTP-Method-Override", "Cache-Control", "X-Verification-ID", "X-Prost-App-Key", "X-Prost-App-Secret", "X-App-Key", "X-App-Secret"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Rota raiz para health check rápido do Render
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "prost-qs"})
	})

	// ========================================
	// SWAGGER / OPENAPI - Contrato Soberano
	// "O Kernel sabe se explicar para qualquer IA"
	// ========================================
	docs.RegisterSwaggerRoutes(r)
	log.Println("✅ Swagger UI disponível em /swagger/index.html")

	// Inicializar repositórios e serviços
	userRepo := identity.NewGORMUserRepository(gormDB)
	eventRepo := event.NewGORMEventRepository(gormDB)
	paymentRepo := payment.NewGormPaymentRepository(gormDB)
	aiSchemaVersionRepo := ai.NewGORMVersionRepository(gormDB)
	replicationStateRepo := replication.NewGORMStateRepository(gormDB)

	// ========================================
	// LOGIN EVENTS - Fase 26.8
	// "Quem logou, quando, de onde"
	// ========================================
	loginEventService := identity.NewLoginEventService(gormDB)
	log.Println("✅ Login Event Service inicializado")

	authService := auth.NewAuthService(userRepo, loginEventService)
	identityService := identity.NewIdentityServiceWithDB(gormDB)
	eventService := event.NewEventService(eventRepo)
	paymentService := payment.NewPaymentService(paymentRepo)
	aiService := ai.NewAIService(aiSchemaVersionRepo)
	legacyAdService := legacyad.NewAdService(gormDB)
	commandService := command.NewCommandService(gormDB, eventService, identityService, paymentService, aiService, legacyAdService)
	replicationService := replication.NewReplicationService(replicationStateRepo)

	// ========================================
	// IDENTITY KERNEL - Sovereign Services
	// ========================================
	verificationService := identity.NewVerificationService(gormDB)
	userService := identity.NewUserService(gormDB)

	// ========================================
	// ECONOMIC KERNEL - Billing Services
	// ========================================
	stripeService := billing.NewStripeService()
	billingService := billing.NewBillingService(gormDB, stripeService)

	// ========================================
	// JOB SERVICE - Fila Interna
	// ========================================
	jobService := jobs.NewJobService(gormDB)
	
	// Iniciar worker de jobs em background
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go jobService.Start(ctx, 2*time.Second) // Poll a cada 2 segundos

	// ========================================
	// INVARIANTS RUNNER - Guardião que nunca dorme
	// "Testes ativos que vivem em produção"
	// ========================================
	invariantsRunner := invariants.NewRunner(gormDB, invariants.RunnerConfig{
		Interval: 5 * time.Minute,
		OnViolation: func(result invariants.InvariantResult) {
			log.Printf("🚨 [INVARIANT VIOLATION] %s: %s (violations: %d)", 
				result.Name, result.Category, result.Violations)
		},
	})
	invariantsRunner.Start()
	log.Println("✅ Invariants Runner iniciado (intervalo: 5min)")

	// ========================================
	// ADS MODULE - Economic Extension
	// ========================================
	adsService := ads.NewAdsService(gormDB, billingService, jobService)
	ads.RegisterAdsJobHandlers(jobService, adsService)

	// ========================================
	// AD DECISION ENGINE - Motor de Decisão em Tempo Real
	// "Quem pode ver anúncio, qual anúncio, quanto vale"
	// ========================================
	adDecisionEngine := ads.NewDecisionEngine(gormDB, adsService)
	log.Println("✅ Ad Decision Engine inicializado")

	// ========================================
	// AGENT GOVERNANCE LAYER
	// ========================================
	agentService := agent.NewAgentService(gormDB, jobService)
	agent.RegisterAgentJobHandlers(jobService, agentService)

	// ========================================
	// POLICY ENGINE - Fase 11
	// ========================================
	policyService := policy.NewPolicyService(gormDB)
	
	// Criar políticas padrão (idempotente)
	if err := policyService.SeedDefaultPolicies(); err != nil {
		log.Fatalf("❌ FATAL: Falha ao criar políticas padrão: %v", err)
	}
	log.Println("✅ Políticas padrão verificadas/criadas")

	// ========================================
	// POLICY THRESHOLDS - Fase 17 Step 2
	// "Thresholds influenciam decisões, não executam ações"
	// ========================================
	thresholdService := policy.NewThresholdService(gormDB)
	log.Println("✅ Policy Threshold Service inicializado")

	// ========================================
	// AUDIT LOG - Fase 11
	// ========================================
	auditService := audit.NewAuditService(gormDB)

	// ========================================
	// KILL SWITCH - Fase 11
	// ========================================
	killSwitchService := killswitch.NewKillSwitchService(gormDB)
	killSwitchService.StartExpirationChecker(1 * time.Minute)

	// ========================================
	// AUTONOMY SERVICE - Fase 12
	// "O sistema sabe responder perguntas antes de agir"
	// ========================================
	autonomyService := autonomy.NewAutonomyService(gormDB)
	log.Println("✅ Matriz de autonomia carregada")

	// ========================================
	// SHADOW SERVICE - Fase 12.2
	// "Você pode tentar, mas o mundo não muda"
	// ========================================
	shadowService := shadow.NewShadowService(gormDB)
	log.Println("✅ Shadow Mode inicializado")

	// ========================================
	// AUTHORITY SERVICE - Fase 13
	// "Por que esta pessoa NÃO pode aprovar isso?"
	// ========================================
	authorityService := authority.NewAuthorityService(gormDB)
	log.Println("✅ Authority Resolution Engine inicializado")

	// ========================================
	// APPROVAL SERVICE - Fase 13
	// "Toda ação sensível tem um humano que disse sim"
	// ========================================
	approvalService := approval.NewApprovalService(gormDB, authorityService, auditService)
	log.Println("✅ Approval Workflow inicializado")

	// ========================================
	// MEMORY SERVICE - Fase 14
	// "O sistema sabe se uma decisão pode produzir efeitos"
	// ========================================
	memoryService := memory.NewMemoryService(gormDB)
	log.Println("✅ Institutional Memory inicializado")

	// ========================================
	// GOVERNED SERVICES - Fase 11
	// "Toda operação crítica passa por Policy + KillSwitch + Audit"
	// ========================================
	governedBillingService := billing.NewGovernedBillingService(billingService, policyService, killSwitchService, auditService)
	governedAgentService := agent.NewGovernedAgentService(agentService, policyService, killSwitchService, auditService)
	
	// Fase 12: Integrar Autonomy Service
	governedAgentService.SetAutonomyService(autonomyService)
	// Fase 12.2: Integrar Shadow Service
	governedAgentService.SetShadowService(shadowService)
	// Fase 13: Integrar Approval e Authority Services
	governedAgentService.SetApprovalService(approvalService)
	governedAgentService.SetAuthorityService(authorityService)
	// Fase 14: Integrar Memory Service
	governedAgentService.SetMemoryService(memoryService)
	log.Println("✅ Autonomia, Shadow Mode, Approval e Memory integrados ao GovernedAgentService")

	// Registrar handler de webhook (usa GovernedBillingService)
	billingHandler := billing.NewBillingHandler(billingService, governedBillingService, stripeService, jobService)
	jobService.RegisterHandler(string(jobs.JobTypeWebhook), billingHandler.ProcessWebhookJob)

	// ========================================
	// FEDERATION KERNEL - OAuth Services
	// ========================================
	googleOAuthService := federation.NewGoogleOAuthService()
	federationService := federation.NewFederationService(gormDB, googleOAuthService)

	// ========================================
	// ADMIN SUPREMO - Governance Service
	// ========================================
	adminService := admin.NewAdminService(gormDB)

	// ========================================
	// APPLICATION SERVICE - Fase 15
	// "O PROST-QS não serve usuários. Ele serve aplicativos."
	// ========================================
	applicationService := application.NewApplicationService(gormDB)
	log.Println("✅ Application Identity Service inicializado")

	// ========================================
	// RISK SERVICE - Fase 17
	// "Risco calculável, explicável, defensável"
	// ========================================
	riskService := risk.NewRiskService(gormDB)
	log.Println("✅ Risk Scoring Engine inicializado")

	// ========================================
	// TIMELINE SERVICE - Fase 18
	// "Timeline é registro, não julgamento"
	// ========================================
	timelineService := explainability.NewTimelineService(gormDB)
	log.Println("✅ Decision Timeline Service inicializado")

	// ========================================
	// INTELLIGENCE SERVICE - Fase 18 Step 2
	// "Mostrar onde o sistema está sob tensão"
	// ========================================
	intelligenceService := explainability.NewIntelligenceService(gormDB, timelineService)
	log.Println("✅ Admin Intelligence Service inicializado")

	// ========================================
	// SECRETS SERVICE - Fase 20
	// "Segredos pertencem à plataforma, não ao app"
	// ========================================
	secretsService, err := secrets.NewSecretsService(gormDB, secretsMasterKey)
	if err != nil {
		log.Fatalf("❌ FATAL: Falha ao inicializar Secrets Service: %v", err)
	}
	log.Println("✅ Secrets Service inicializado")

	// ========================================
	// FINANCIAL EVENT PIPELINE - Fase 27.0
	// "Todo centavo que passa é registrado"
	// ========================================
	financialEventService := financial.NewFinancialEventService(gormDB)
	financialMetricsService := financial.NewMetricsService(gormDB)
	log.Println("✅ Financial Event Pipeline inicializado")

	// ========================================
	// FINANCIAL HARDENING - Fase 27.2
	// "Webhook duplicado NUNCA duplica dinheiro"
	// ========================================
	idempotencyService := financial.NewIdempotencyService(gormDB)
	alertService := financial.NewAlertService(gormDB)
	alertService.InitDefaultThresholds() // Inicializa thresholds padrão
	rateLimiter := financial.NewRateLimiter(financial.DefaultRateLimitConfig)
	log.Println("✅ Financial Hardening inicializado (idempotência + rate limit + alertas)")

	// ========================================
	// KERNEL BILLING - Fase 28.1
	// "O kernel cobra dos apps que usam a infraestrutura"
	// ========================================
	kernelBillingService := kernel_billing.NewKernelBillingService(gormDB)
	if err := kernelBillingService.SeedDefaultPlans(); err != nil {
		log.Printf("⚠️ Erro ao criar planos padrão: %v", err)
	}
	log.Println("✅ Kernel Billing Service inicializado")

	// ========================================
	// IMMUNITY SYSTEM - Sistema Imunológico
	// "O sistema se defende sozinho"
	// ========================================
	immunitySystem := immunity.GetImmunitySystem()
	_ = immunitySystem // Usado abaixo nas rotas
	log.Println("✅ Immunity System inicializado")

	// ========================================
	// API GATE - FASE 2: Pedágio Armado
	// "Toda requisição passa por validação estrutural"
	// ========================================
	gateConfig := apigate.DefaultConfig()
	apiGate := apigate.NewAPIGate(gateConfig)
	apigate.SetGlobalGate(apiGate)
	log.Println("✅ API Gate inicializado (FASE 2)")

	// ========================================
	// WAR OBSERVABILITY - FASE 3: Observabilidade de Guerra
	// "Ver o sistema respirar, medir pressão"
	// ========================================
	warObservability := warobs.GetWarObservability()
	log.Println("✅ War Observability inicializado (FASE 3)")

	// ========================================
	// ALERTING SYSTEM - FASE 4: Alertas Reais
	// "Alertas inteligentes, não spam"
	// ========================================
	alertEngine := alerting.GetAlertEngine()
	alerting.SetupDefaultChannels(alertEngine)
	
	// Configure from environment
	alertConfig := alerting.GetConfig()
	alertConfig.ApplyToEngine(alertEngine)
	
	// Setup persistence (optional, requires DB)
	alertPersistence := alerting.NewAlertPersistence(gormDB)
	alertEngine.SetPersistence(alertPersistence)
	
	// Connect API Gate to Alerting (attack detection)
	apigate.SetBlockNotifier(alerting.RecordAPIGateBlock)
	
	// Start monitor
	alerting.StartGlobalMonitor(ctx)
	log.Println("✅ Alerting System inicializado (FASE 4)")

	// Middlewares globais
	r.Use(middleware.SecurityHeaders())                            // Security Headers - PRIMEIRO
	r.Use(apiGate.GateMiddleware())                                // API Gate (FASE 2)
	r.Use(warobs.WarObsMiddleware(warObservability))               // War Observability (FASE 3)
	r.Use(immunity.ProtectionMiddleware())                         // Proteção do sistema imunológico
	r.Use(middleware.AdvancedRateLimitMiddleware(100, 1*time.Minute)) // Rate limit avançado por endpoint
	r.Use(middleware.RequestIDMiddleware())                        // Request ID para tracing

	// ========================================
	// OBSERVABILITY - Fase 22
	// "Saber o que está acontecendo quando algo dá errado"
	// ========================================
	r.Use(observability.RequestIDMiddleware())
	r.Use(observability.MetricsMiddleware())
	// Note: LoggingMiddleware disabled to avoid duplicate logs with Gin default
	
	// Ready checker for /ready endpoint
	readyChecker := &ReadyChecker{db: gormDB, secretsService: secretsService}
	observability.RegisterObservabilityRoutes(r, readyChecker)
	log.Println("✅ Observability endpoints registrados (/health, /ready, /metrics/basic)")

	// ========================================
	// OBSERVER AGENTS - Fase 23
	// "Agentes apenas observam, analisam e sugerem"
	// ========================================
	
	// Agent Memory Service - Fase 24
	agentMemoryService := observer.NewAgentMemoryService(gormDB)
	observer.RegisterMemoryRoutes(r, agentMemoryService)
	if agentMemoryService.IsMemoryEnabled() {
		log.Println("✅ Agent Memory habilitada (AGENT_MEMORY_ENABLED=true)")
	} else {
		log.Println("⚠️  Agent Memory desabilitada (AGENT_MEMORY_ENABLED != true)")
	}
	
	// Observer Service (com memória integrada)
	observerService := observer.NewObserverService(readyChecker, agentMemoryService)
	observer.RegisterObserverRoutes(r, observerService)
	if observerService.IsEnabled() {
		log.Println("✅ Observer Agent habilitado (AGENTS_ENABLED=true)")
	} else {
		log.Println("⚠️  Observer Agent desabilitado (AGENTS_ENABLED != true)")
	}

	// ========================================
	// HUMAN-IN-THE-LOOP CONSOLE - Fase 25
	// "Dar olhos humanos ao sistema — sem dar mãos"
	// ========================================
	humanDecisionService := observer.NewHumanDecisionService(gormDB, agentMemoryService)
	observer.RegisterDecisionRoutes(r, humanDecisionService)
	log.Println("✅ Human-in-the-Loop Console registrado (/console, /decisions)")

	// ========================================
	// PAYMENT PROVIDER SERVICE - Fase 26.8
	// Criado aqui para ser usado pelo webhook handler
	// ========================================
	paymentProviderService := application.NewPaymentProviderService(gormDB)

	// ========================================
	// STRIPE WEBHOOKS - Fase 27.0 + 27.2
	// "O Kernel recebe webhooks, não os apps"
	// Com idempotência absoluta e rate limiting
	// ========================================
	financial.RegisterWebhookRoutes(r, gormDB, financialEventService, paymentProviderService, idempotencyService, alertService, rateLimiter)
	log.Println("✅ Stripe Webhook Handler registrado (/webhooks/stripe/:app_id) com idempotência e rate limit")

	// Agrupar rotas da API v1
	v1 := r.Group("/api/v1")
	{
		// ========================================
		// HEALTH CHECK - Observabilidade
		// ========================================
		healthHandler := health.NewHealthHandler(gormDB, jobService)
		health.RegisterHealthRoutes(v1, healthHandler)

		// ========================================
		// IDENTITY KERNEL - Rotas Soberanas (públicas)
		// ========================================
		identity.RegisterVerificationRoutes(v1, verificationService)

		// ========================================
		// AUTH KERNEL - Novo Fluxo de Autenticação
		// ========================================
		identity.RegisterAuthRoutes(v1, verificationService, userService, middleware.AuthMiddleware())

		// ========================================
		// LOGOUT & SESSION MANAGEMENT - Segurança
		// "Sair é tão importante quanto entrar"
		// ========================================
		auth.RegisterLogoutRoutes(v1, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ Logout routes registradas (/auth/logout, /auth/logout-all, /auth/revoke)")

		// ========================================
		// MFA - AUTENTICAÇÃO MULTI-FATOR
		// "Dois fatores são melhor que um"
		// ========================================
		mfaService := auth.NewMFAService(gormDB)
		auth.RegisterMFARoutes(v1, mfaService, middleware.AuthMiddleware())
		log.Println("✅ MFA routes registradas (/auth/mfa/*)")

		// ========================================
		// SESSION MANAGEMENT - Gestão de Sessões
		// "Saber onde você está logado"
		// ========================================
		sessionService := auth.NewSessionService(gormDB)
		auth.RegisterSessionRoutes(v1, sessionService, middleware.AuthMiddleware())
		log.Println("✅ Session routes registradas (/auth/sessions/*)")

		// ========================================
		// ACTIVITY LOG - Histórico de Atividades
		// "Saber o que aconteceu é tão importante quanto fazer acontecer"
		// ========================================
		activityService := activity.NewActivityService(gormDB)
		activity.RegisterActivityRoutes(v1, activityService, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ Activity routes registradas (/activity/*)")

		// ========================================
		// WEBHOOK SYSTEM - Notificações para Apps Externos
		// "O Kernel avisa, o app decide o que fazer"
		// ========================================
		webhookService := webhook.NewWebhookService(gormDB)
		webhook.RegisterWebhookRoutes(v1, webhookService, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ Webhook routes registradas (/webhooks/*)")

		// Inicializar Event Dispatcher (conecta eventos → webhooks)
		eventDispatcher := webhook.InitDispatcher(gormDB, webhookService)
		_ = eventDispatcher // Usado pelos serviços para disparar eventos
		log.Println("✅ Event Dispatcher inicializado")

		// ========================================
		// EVENT SYSTEM - Sistema de Eventos Centralizado
		// "Um lugar para emitir. Muitos lugares para ouvir."
		// ========================================
		eventSystemService := events.InitEventService(gormDB)
		events.RegisterEventSystemRoutes(v1, eventSystemService, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ Event System routes registradas (/events/*)")

		// Conectar Event Service ao Webhook Dispatcher via Bridge
		eventBridge := events.InitBridge(eventSystemService, eventDispatcher)
		_ = eventBridge
		log.Println("✅ Event Bridge conectado - eventos internos → webhooks externos")

		// ========================================
		// API KEY SYSTEM - Autenticação de Apps Externos
		// "Apps não usam senha. Apps usam chaves."
		// ========================================
		apiKeyService := apikey.NewAPIKeyService(gormDB)
		apikey.RegisterAPIKeyRoutes(v1, apiKeyService, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ API Key routes registradas (/apikeys/*)")

		// ========================================
		// ECONOMIC KERNEL - Rotas de Billing (com Governança)
		// ========================================
		billing.RegisterBillingRoutes(v1, billingService, governedBillingService, stripeService, jobService, middleware.AuthMiddleware())

		// ========================================
		// FEDERATION KERNEL - Rotas OAuth
		// ========================================
		federation.RegisterFederationRoutes(v1, federationService, googleOAuthService, middleware.AuthMiddleware())

		// ========================================
		// ADMIN SUPREMO - Rotas de Governança
		// ========================================
		admin.RegisterAdminRoutes(v1, adminService, middleware.AuthMiddleware(), middleware.AdminOnly())

		// ========================================
		// COGNITIVE DASHBOARD - Fase 26.5
		// "Observabilidade total. Zero interferência."
		// READ-ONLY: Todos os endpoints são GET
		// ========================================
		cognitiveDashboardService := admin.NewCognitiveDashboardService(gormDB)
		admin.RegisterCognitiveRoutes(v1, cognitiveDashboardService, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ Cognitive Dashboard registrado (/admin/cognitive/*)")

		// ========================================
		// COGNITIVE NARRATOR - Fase 26.6
		// "Gemini como narrador, não como cérebro"
		// READ-ONLY: Apenas interpreta dados, nunca decide
		// ========================================
		narratorService := admin.NewNarratorService(cognitiveDashboardService)
		admin.RegisterNarratorRoutes(v1, narratorService, middleware.AuthMiddleware(), middleware.AdminOnly())
		if narratorService.IsEnabled() {
			log.Println("✅ Cognitive Narrator habilitado (Gemini)")
		} else {
			log.Println("⚠️  Cognitive Narrator desabilitado (configure GEMINI_API_KEY e GEMINI_NARRATOR_ENABLED=true)")
		}

		// ========================================
		// ADS MODULE - Economic Extension
		// ========================================
		ads.RegisterAdsRoutes(v1, adsService, middleware.AuthMiddleware())

		// ========================================
		// AD DECISION ENGINE - Gateway de Anúncios de Borda
		// "Motor Econômico de Decisão em Tempo Real"
		// ========================================
		ads.RegisterDecisionRoutes(v1, adDecisionEngine, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ Ad Decision Engine routes registradas (/ads/decide, /ads/track/*, /ads/slots/*, /ads/creatives/*)")

		// ========================================
		// AD INVENTORY - CRUD Completo de Campanhas
		// "O Cofre precisa de ouro para não ser vazio"
		// ========================================
		ads.RegisterInventoryRoutes(v1, adsService, adDecisionEngine, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ Ad Inventory routes registradas (/ads/accounts, /ads/budgets, /ads/campaigns, /ads/targeting)")

		// ========================================
		// AGENT GOVERNANCE LAYER (com Governança)
		// ========================================
		agent.RegisterAgentRoutes(v1, agentService, governedAgentService, middleware.AuthMiddleware())

		// ========================================
		// POLICY ENGINE - Fase 11
		// ========================================
		policy.RegisterPolicyRoutes(v1, policyService, middleware.AuthMiddleware(), middleware.AdminOnly())

		// ========================================
		// POLICY THRESHOLDS - Fase 17 Step 2
		// "Thresholds influenciam decisões, não executam ações"
		// ========================================
		policy.RegisterThresholdRoutes(v1, thresholdService, middleware.AuthMiddleware(), middleware.AdminOnly())

		// ========================================
		// AUDIT LOG - Fase 11
		// ========================================
		audit.RegisterAuditRoutes(v1, auditService, middleware.AuthMiddleware(), middleware.AdminOnly())

		// ========================================
		// KILL SWITCH - Fase 11
		// ========================================
		killswitch.RegisterKillSwitchRoutes(v1, killSwitchService, middleware.AuthMiddleware(), middleware.RequireSuperAdmin())

		// ========================================
		// AUTONOMY - Fase 12
		// "Matriz de autonomia e perfis de agentes"
		// ========================================
		autonomy.RegisterAutonomyRoutes(v1, autonomyService, middleware.AuthMiddleware(), middleware.AdminOnly())

		// ========================================
		// SHADOW MODE - Fase 12.2
		// "Observar sem executar"
		// ========================================
		shadow.RegisterShadowRoutes(v1, shadowService, middleware.AuthMiddleware(), middleware.AdminOnly())

		// ========================================
		// AUTHORITY - Fase 13
		// "Quem pode aprovar o quê, com qual responsabilidade"
		// ========================================
		authority.RegisterAuthorityRoutes(v1, authorityService, middleware.AuthMiddleware(), middleware.RequireSuperAdmin())

		// ========================================
		// APPROVAL - Fase 13
		// "Decisão humana assistida"
		// ========================================
		approval.RegisterApprovalRoutes(v1, approvalService, middleware.AuthMiddleware(), middleware.AdminOnly())

		// ========================================
		// MEMORY - Fase 14
		// "Memória institucional e continuidade decisória"
		// ========================================
		memory.RegisterMemoryRoutes(v1, memoryService, middleware.AuthMiddleware(), middleware.AdminOnly())

		// ========================================
		// APPLICATION IDENTITY - Fase 15
		// "O PROST-QS não serve usuários. Ele serve aplicativos."
		// ========================================
		application.RegisterApplicationRoutes(v1, applicationService, middleware.AuthMiddleware(), middleware.AdminOnly(), middleware.SubscriptionGuard(gormDB))

		// ========================================
		// PAYMENT PROVIDER PER APP - Fase 26.8
		// "Cada app conecta sua própria Stripe"
		// ========================================
		application.RegisterPaymentProviderRoutes(v1, paymentProviderService, applicationService, middleware.AuthMiddleware())

		// ========================================
		// RISK SCORING ENGINE - Fase 17
		// "Risco calculável, explicável, defensável"
		// ========================================
		risk.RegisterRiskRoutes(v1, riskService, middleware.AuthMiddleware())

		// ========================================
		// DECISION TIMELINE - Fase 18
		// "Mostre tudo o que levou essa decisão a acontecer"
		// ========================================
		explainability.RegisterTimelineRoutes(v1, timelineService, middleware.AuthMiddleware())

		// ========================================
		// ADMIN INTELLIGENCE - Fase 18 Step 2
		// "Mostrar onde o sistema está sob tensão"
		// ========================================
		explainability.RegisterIntelligenceRoutes(v1, intelligenceService, middleware.AuthMiddleware(), middleware.AdminOnly())

		// ========================================
		// SECRETS SYSTEM - Fase 20
		// "Segredos pertencem à plataforma, não ao app"
		// ========================================
		secrets.RegisterSecretsRoutes(v1, secretsService, middleware.AuthMiddleware(), middleware.AdminOnly())

		// ========================================
		// FINANCIAL EVENT PIPELINE - Fase 27.0
		// "Todo centavo que passa é registrado"
		// ========================================
		financial.RegisterFinancialRoutes(v1, financialEventService, financialMetricsService, middleware.AuthMiddleware(), middleware.AdminOnly(), middleware.RequireSuperAdmin())

		// ========================================
		// RECONCILIATION ENGINE - Fase 27.1
		// "Seu ledger bate com a Stripe?"
		// ========================================
		reconciliationService := financial.NewReconciliationService(gormDB, financialEventService)
		financial.RegisterReconciliationRoutes(v1, reconciliationService, middleware.AuthMiddleware(), middleware.AdminOnly(), middleware.RequireSuperAdmin())

		// ========================================
		// FINANCIAL HARDENING - Fase 27.2
		// "Sistema sem alertas é sistema cego"
		// ========================================
		alertsHandler := financial.NewAlertsHandler(alertService)
		idempotencyHandler := financial.NewIdempotencyHandler(idempotencyService)
		rateLimitHandler := financial.NewRateLimitHandler(rateLimiter)
		
		// Rotas de alertas financeiros
		adminFinancial := v1.Group("/admin/financial")
		adminFinancial.Use(middleware.AuthMiddleware(), middleware.RequireSuperAdmin())
		{
			// Alertas
			adminFinancial.GET("/alerts", alertsHandler.GetActiveAlerts)
			adminFinancial.GET("/alerts/stats", alertsHandler.GetAlertStats)
			adminFinancial.POST("/alerts/:id/resolve", alertsHandler.ResolveAlert)
			adminFinancial.GET("/alerts/thresholds", alertsHandler.GetThresholds)
			adminFinancial.PUT("/alerts/thresholds/:type", alertsHandler.UpdateThreshold)
			adminFinancial.POST("/alerts/check", alertsHandler.RunAlertChecks)
			
			// Idempotência
			adminFinancial.GET("/idempotency/stats", idempotencyHandler.GetIdempotencyStats)
			adminFinancial.GET("/idempotency/webhooks", idempotencyHandler.GetRecentWebhooks)
			
			// Rate Limit
			adminFinancial.GET("/ratelimit/stats", rateLimitHandler.GetRateLimitStats)
		}
		log.Println("✅ Financial Hardening routes registradas (/admin/financial/alerts, /idempotency, /ratelimit)")

		// ========================================
		// KERNEL BILLING - Fase 28.1
		// "O kernel cobra dos apps que usam a infraestrutura"
		// ========================================
		kernel_billing.RegisterKernelBillingRoutes(v1, gormDB, kernelBillingService, middleware.AuthMiddleware(), middleware.AdminOnly(), middleware.RequireSuperAdmin())
		log.Println("✅ Kernel Billing routes registradas (/kernel/plans, /apps/:id/billing, /admin/kernel/billing)")

		// Rotas de Autenticação (legacy - será deprecado)
		auth.RegisterAuthRoutes(v1, authService)

		// Rotas de Comandos
		command.RegisterCommandRoutes(v1, commandService, middleware.AuthMiddleware())

		// Rotas de Identidade
		identity.RegisterIdentityRoutes(v1, identityService, middleware.AuthMiddleware())

		// ========================================
		// CAPABILITIES - Entitlements API
		// "O que eu posso fazer? Quanto posso criar?"
		// ========================================
		identity.RegisterCapabilitiesRoutes(v1, gormDB, middleware.AuthMiddleware())

		// ========================================
		// IMPLICIT LOGIN - Fase 29
		// "Login invisível para apps externos"
		// ========================================
		identity.RegisterImplicitLoginRoutes(v1, gormDB, jwtSecret, application.AppContextMiddleware(applicationService), application.RequireAppContext())
		log.Println("✅ Implicit Login routes registradas (/identity/implicit-login)")

		// ========================================
		// MULTI-APP IDENTITY - Fase 31
		// "Uma conta global, vínculos locais por app"
		// ========================================
		identity.RegisterMultiAppIdentityRoutes(v1, gormDB, jwtSecret, middleware.AuthMiddleware(), application.AppContextMiddleware(applicationService))
		log.Println("✅ Multi-App Identity routes registradas (/identity/register, /identity/login, /identity/link-app, /identity/profile)")

		// ========================================
		// TELEMETRY - Fase 30
		// "Apps não calculam. Apps emitem. O kernel observa."
		// ========================================
		telemetryService := telemetry.NewTelemetryService(gormDB)
		telemetry.RegisterTelemetryRoutes(v1, telemetryService, application.AppContextMiddleware(applicationService), application.RequireAppContext(), middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ Telemetry routes registradas (/telemetry/*)")

		// ========================================
		// NARRATIVE SERVICE - Fase 32
		// "Quando algo dá errado, o sistema explica em linguagem humana"
		// ========================================
		narrativeService := narrative.NewNarrativeService(gormDB)
		narrative.RegisterNarrativeRoutes(v1, narrativeService, middleware.AuthMiddleware())
		log.Println("✅ Narrative routes registradas (/narratives/*)")

		// ========================================
		// USAGE SERVICE - Medição de Recursos
		// "Billing não é cobrança. Billing é medição."
		// ========================================
		usageService := usage.NewUsageService(gormDB)
		usage.RegisterUsageRoutes(v1, usageService, middleware.AuthMiddleware())
		log.Println("✅ Usage routes registradas (/usage/*)")

		// ========================================
		// NOTIFICATION SERVICE - Alertas e Notificações
		// "O sistema avisa quando algo acontece"
		// ========================================
		notificationService := notification.NewNotificationService(gormDB)
		notification.RegisterNotificationRoutes(v1, notificationService, middleware.AuthMiddleware())
		log.Println("✅ Notification routes registradas (/notifications/*)")

		// ========================================
		// DECISION SERVICE - Registro de Decisões
		// "O que o sistema DECIDIU, não só o que aconteceu"
		// ========================================
		decisionService := decision.NewService(gormDB)
		decision.RegisterDecisionRoutes(v1, decisionService, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ Decision routes registradas (/decisions/*)")

		// ========================================
		// RULES ENGINE - Camada de Decisão
		// "Observação → Condição → Ação"
		// ========================================
		rulesService := rules.NewRulesService(gormDB)
		
		// Conectar rules ao telemetry para alertas
		rulesService.SetAlertCallback(func(appID uuid.UUID, alertType, message string, data map[string]interface{}) {
			// Extrair severidade do data se existir
			severity := "warning"
			if sev, ok := data["severity"].(string); ok {
				severity = sev
			}
			
			// Extrair rule info
			var ruleID *uuid.UUID
			ruleName := ""
			if rid, ok := data["rule_id"].(string); ok {
				if id, err := uuid.Parse(rid); err == nil {
					ruleID = &id
				}
			}
			if rn, ok := data["rule_name"].(string); ok {
				ruleName = rn
			}
			
			// Criar alerta no sistema de telemetria
			telemetryService.CreateAlert(appID, alertType, severity, alertType, message, data, ruleID, ruleName)
			log.Printf("🎯 [RULE ALERT] app=%s type=%s severity=%s msg=%s", appID, alertType, severity, message)
		})
		
		rules.RegisterRulesRoutes(v1, rulesService, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ Rules Engine routes registradas (/admin/rules/*)")

		// ========================================
		// ADD-ONS - Capabilities como SKUs
		// "Capability primeiro. Preço depois. Agora: preço."
		// ========================================
		
		// FAIL FAST: Validar catálogo de add-ons antes de aceitar tráfego
		// Em produção, add-on sem Price ID = sistema não sobe
		if err := capabilities.ValidateAddOnCatalog(); err != nil {
			log.Fatalf("🚨 FATAL: %v", err)
		}
		
		capabilities.RegisterAddOnRoutes(v1, gormDB, middleware.AuthMiddleware())
		capabilities.RegisterAddOnAdminRoutes(v1, gormDB, middleware.AuthMiddleware(), middleware.AdminOnly())

		// ========================================
		// LOGIN EVENTS - Fase 26.8
		// "Auditoria de logins: quem, quando, de onde"
		// ========================================
		identity.RegisterLoginEventRoutes(v1, loginEventService, middleware.AuthMiddleware(), middleware.AdminOnly())

		// ========================================
		// INVARIANTS - Sistema Imunológico
		// "Testes ativos que vivem em produção"
		// ========================================
		adminInvariants := v1.Group("/admin/invariants")
		adminInvariants.Use(middleware.AuthMiddleware(), middleware.RequireSuperAdmin())
		invariants.RegisterRoutes(adminInvariants)
		log.Println("✅ Invariants routes registradas (/admin/invariants/*)")

		// TEMPORÁRIO: Rotas públicas para teste de invariants
		v1.GET("/invariants/violations", func(c *gin.Context) {
			violations := invariants.GetViolations()
			c.JSON(200, gin.H{
				"violations": violations,
				"count":      len(violations),
			})
		})
		v1.DELETE("/invariants/violations", func(c *gin.Context) {
			invariants.ClearViolations()
			c.JSON(200, gin.H{
				"message": "Violations cleared",
			})
		})

		// ========================================
		// IMMUNITY SYSTEM - Sistema Imunológico Completo
		// "Auto-defesa, auto-cura, circuit breakers, quarentena"
		// ========================================
		immunityHandler := immunity.NewHandler()
		immunityHandler.RegisterRoutes(v1, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ Immunity System routes registradas (/immunity/*)")

		// ========================================
		// API GATE - FASE 2: Monitoramento
		// "Métricas e status do pedágio armado"
		// ========================================
		apiGateHandler := apigate.NewHandler(apiGate)
		apiGateHandler.RegisterRoutes(v1, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ API Gate routes registradas (/apigate/*)")

		// ========================================
		// WAR OBSERVABILITY - FASE 3: Dashboard de Guerra
		// "RED metrics, pressure, SLOs, tracing"
		// ========================================
		warObsHandler := warobs.NewHandler(warObservability)
		warObsHandler.RegisterRoutes(v1, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ War Observability routes registradas (/warobs/*)")

		// ========================================
		// ALERTING SYSTEM - FASE 4: Alertas Reais
		// "Alertas inteligentes, não spam"
		// ========================================
		alerting.RegisterAlertRoutes(v1, alertEngine, middleware.AuthMiddleware(), middleware.AdminOnly())
		log.Println("✅ Alerting System routes registradas (/alerts/*)")

		// Rotas de Eventos (admin/auditor)
		event.RegisterEventRoutes(v1, eventService, middleware.AuthMiddleware())

		// Rotas de Pagamentos
		payment.RegisterPaymentRoutes(v1, paymentService, middleware.AuthMiddleware())

		// Rotas de Governança por IA (admin/privilegiado)
		ai.RegisterAIRoutes(v1, aiService, middleware.AuthMiddleware())

		// Rotas de Anúncios Neurais (legacy - será deprecado)
		legacyad.RegisterAdRoutes(v1, legacyAdService, middleware.AuthMiddleware())

		// Rotas de Replicação (endpoints internos entre nós do Kernel)
		replication.RegisterReplicationRoutes(v1, replicationService, middleware.AuthMiddleware())

		// ========================================
		// DEBUG ROUTES - PROTEGIDAS
		// Só funcionam em desenvolvimento (GIN_MODE != release)
		// ========================================
		if !middleware.IsProduction() {
			debug := v1.Group("/debug")
			debug.Use(middleware.DevOnlyGuard()) // Dupla proteção
			{
				// Trigger Silence: Para telemetria por N minutos para testar AssertSystemThroughputSanity
				debug.POST("/trigger-silence", func(c *gin.Context) {
					var req struct {
						Minutes int `json:"minutes"`
					}
					if err := c.ShouldBindJSON(&req); err != nil {
						req.Minutes = 6 // Default: 6 minutos
					}
					if req.Minutes < 1 {
						req.Minutes = 1
					}
					if req.Minutes > 30 {
						req.Minutes = 30 // Max: 30 minutos
					}

					// Registrar violação de throughput manualmente
					invariants.Assert(
						false, // Força falha
						"telemetry_system_silence",
						fmt.Sprintf("DEBUG: Silêncio forçado por %d minutos para teste de estresse", req.Minutes),
						map[string]interface{}{
							"triggered_by":    "debug_endpoint",
							"silence_minutes": req.Minutes,
							"status":          "TESTE - Dashboard deve mostrar vermelho",
						},
					)

					c.JSON(200, gin.H{
						"status":  "silence_triggered",
						"minutes": req.Minutes,
						"message": fmt.Sprintf("Invariant 'telemetry_system_silence' disparada. Dashboard deve sangrar por %d minutos.", req.Minutes),
						"action":  "Verifique /dashboard/invariants para ver o alerta",
					})
				})

				// Trigger Fraud Alert: Simula detecção de fraude em Ads
				debug.POST("/trigger-fraud", func(c *gin.Context) {
					var req struct {
						RequestID string `json:"request_id"`
						Count     int    `json:"count"`
					}
					if err := c.ShouldBindJSON(&req); err != nil {
						req.RequestID = uuid.New().String()
						req.Count = 5
					}
					if req.Count < 2 {
						req.Count = 2
					}

					// Disparar invariant de fraude
					invariants.AssertCritical(
						false, // Força falha
						"ad_impression_duplicated",
						fmt.Sprintf("DEBUG: Fraude simulada - request_id %s usado %d vezes", req.RequestID, req.Count),
						map[string]interface{}{
							"request_id":      req.RequestID,
							"duplicate_count": req.Count,
							"triggered_by":    "debug_endpoint",
							"status":          "TESTE - Simula ataque de replay",
						},
					)

					c.JSON(200, gin.H{
						"status":     "fraud_triggered",
						"request_id": req.RequestID,
						"count":      req.Count,
						"message":    "Invariant 'ad_impression_duplicated' disparada. Dashboard deve mostrar CRITICAL.",
					})
				})

				// Health Check do Debug
				debug.GET("/status", func(c *gin.Context) {
					violations := invariants.GetViolations()
					c.JSON(200, gin.H{
						"debug_enabled":    true,
						"environment":      "development",
						"total_violations": len(violations),
						"endpoints": []string{
							"POST /debug/trigger-silence - Simula silêncio de telemetria",
							"POST /debug/trigger-fraud - Simula ataque de fraude em Ads",
							"GET /debug/status - Este endpoint",
						},
					})
				})
			}
			log.Println("⚠️  Debug routes registradas (APENAS DEV)")
		} else {
			log.Println("🔒 Debug routes DESABILITADAS em produção")
		}
	}

	// Rotas de Health Check (legacy - agora em /health via observability)
	// r.GET("/health", func(c *gin.Context) {
	// 	c.JSON(200, gin.H{"status": "ok", "message": "Prost-QS Core is running!"})
	// })

	log.Printf("🚀 Prost-QS Core rodando na porta: %s", serverPort)
	log.Fatal(r.Run(":" + serverPort))
}

// ========================================
// READY CHECKER - Fase 22
// ========================================

type ReadyChecker struct {
	db             *gorm.DB
	secretsService *secrets.SecretsService
}

func (r *ReadyChecker) CheckDB() error {
	sqlDB, err := r.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}

func (r *ReadyChecker) CheckSecrets() error {
	// Secrets service is initialized if we got here
	if r.secretsService == nil {
		return fmt.Errorf("secrets service not initialized")
	}
	return nil
}
