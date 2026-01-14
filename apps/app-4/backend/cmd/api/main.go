package main

import (
	"log"
	"medisync-platform/backend/config"
	"medisync-platform/backend/internal/adapters/api"
	"medisync-platform/backend/internal/adapters/api/controllers"
	"medisync-platform/backend/internal/adapters/repository"
	"medisync-platform/backend/internal/services"
	"medisync-platform/backend/pkg/middleware"
	"medisync-platform/backend/pkg/security"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite" // Pure Go SQLite driver (No CGO required)
	"github.com/gorilla/websocket"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 1. Load configuration
	cfg := config.LoadConfig()

	// 2. Database connection setup
	var db *gorm.DB
	var err error

	if cfg.UseSQLite {
		log.Printf("Using SQLite database (Pure Go): %s", cfg.SQLiteFile)
		db, err = gorm.Open(sqlite.Open(cfg.SQLiteFile), &gorm.Config{})
	} else {
		log.Printf("Using PostgreSQL database: %s", cfg.DatabaseURL)
		db, err = gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	}

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 3. Auto-migrate database models
	repository.AutoMigrate(db)
	repository.SeedDatabase(db)
	repository.CreateIndexes(db)

	// 4. Initialize services and repositories (Hexagonal Architecture)
	// Repositories (Adapters)
	userRepo := repository.NewUserRepository(db)
	appointmentRepo := repository.NewAppointmentRepository(db)
	medicalRecordRepo := repository.NewMedicalRecordRepository(db)
	prescriptionRepo := repository.NewPrescriptionRepository(db)
	certificateRepo := repository.NewMedicalCertificateRepository(db)
	waitingListRepo := repository.NewWaitingListRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)

	// Security (Adapters)
	encryptionService := security.NewAESEncryptionService(cfg.EncryptionKey)

	// WebSocket Hubs (Core Features) - Initialize early for services that depend on them
	chatHub := services.NewChatHub()
	go chatHub.Run()

	// Chat Repository and Service
	chatRepo := repository.NewChatRepository(db)

	// Email Service
	emailService := services.NewEmailService()

	// Schedule Block Repository (needed for appointment service)
	scheduleBlockRepo := repository.NewScheduleBlockRepository(db)

	// Services (Core Logic)
	authService := services.NewAuthService(userRepo)
	userService := services.NewUserService(userRepo)
	appointmentService := services.NewAppointmentServiceFull(appointmentRepo, emailService, userRepo, scheduleBlockRepo)
	medicalRecordService := services.NewMedicalRecordService(medicalRecordRepo, encryptionService)
	prescriptionService := services.NewPrescriptionService(prescriptionRepo)
	certificateService := services.NewMedicalCertificateService(certificateRepo)
	reviewRepo := repository.NewReviewRepository(db)
	reviewService := services.NewReviewService(reviewRepo, appointmentRepo)
	paymentService := services.NewPaymentService(db)
	waitingListService := services.NewWaitingListService(waitingListRepo)
	notificationService := services.NewNotificationService(notificationRepo, chatHub)

	// WebSocket Hubs (Core Features)
	waitingRoomHub := services.NewWaitingRoomHub(waitingListService)
	go waitingRoomHub.Run()

	// 5. Initialize Gin router with production-ready middlewares
	r := gin.New()

	// Custom middlewares
	r.Use(middleware.RequestID())      // Add request ID to all requests
	r.Use(middleware.Logger())         // Custom structured logging
	r.Use(middleware.Recovery())       // Panic recovery with proper error response
	r.Use(middleware.CORS())           // CORS handling
	r.Use(middleware.GzipCompression()) // Response compression

	// Stats Controller (needs direct DB access for aggregations)
	statsCtrl := controllers.NewStatsController(db)
	paymentCtrl := controllers.NewPaymentController(paymentService)
	passwordResetService := services.NewPasswordResetService(db, userRepo, emailService)
	passwordResetCtrl := controllers.NewPasswordResetController(passwordResetService)

	// Schedule Block Service
	scheduleBlockService := services.NewScheduleBlockService(scheduleBlockRepo)
	scheduleBlockCtrl := controllers.NewScheduleBlockController(scheduleBlockService)

	// Audit Service
	auditRepo := repository.NewAuditLogRepository(db)
	auditService := services.NewAuditService(auditRepo)
	auditCtrl := controllers.NewAuditController(auditService)

	// Recurring Appointment Service
	recurringRepo := repository.NewRecurringAppointmentRepository(db)
	recurringService := services.NewRecurringAppointmentService(recurringRepo, appointmentRepo)
	recurringCtrl := controllers.NewRecurringAppointmentController(recurringService)

	// Health Controller
	healthCtrl := controllers.NewHealthController(db)

	// Backup Controller
	backupCtrl := controllers.NewBackupController(db)

	// Triage Report Service & Controller
	triageRepo := repository.NewTriageReportRepository(db)
	triageService := services.NewTriageReportService(triageRepo, notificationService, userRepo)
	triageCtrl := controllers.NewTriageReportController(triageService)

	// Clinic Service & Controller
	clinicRepo := repository.NewClinicRepository(db)
	clinicService := services.NewClinicService(clinicRepo)
	clinicCtrl := controllers.NewClinicController(clinicService)

	// Queue Service & Controller
	queueRepo := repository.NewQueueRepository(db)
	queueService := services.NewQueueService(queueRepo, notificationService, waitingRoomHub)
	queueCtrl := controllers.NewQueueController(queueService)

	// Clinical Match Service & Controller (Intelligent Patient-Doctor Matching)
	matchService := services.NewClinicalMatchService(db)
	matchCtrl := controllers.NewClinicalMatchController(matchService)

	// Health Intelligence Service & Controller (Health Profile & Tracking)
	healthIntelligenceService := services.NewHealthIntelligenceService(db)
	healthProfileCtrl := controllers.NewHealthProfileController(healthIntelligenceService)

	// Fitness Service & Controller (NOVA Integration)
	fitnessService := services.NewFitnessService(db, healthIntelligenceService)
	fitnessCtrl := controllers.NewFitnessController(fitnessService)

	// Connect Health Intelligence to Triage Service for automatic profile updates
	triageService.SetHealthIntelligenceService(healthIntelligenceService)

	// Chat Service & Controller
	chatService := services.NewChatService(chatRepo, userRepo)
	chatCtrl := controllers.NewChatControllerWithService(chatService, chatHub)

	// 6. Setup API routes (including Chat, Queue, Clinical Match, Health Profile, and Fitness)
	api.SetupRoutes(r, authService, userService, appointmentService, medicalRecordService, prescriptionService, certificateService, reviewService, notificationService, waitingRoomHub, chatHub, chatCtrl, statsCtrl, paymentCtrl, passwordResetCtrl, scheduleBlockCtrl, auditCtrl, recurringCtrl, healthCtrl, backupCtrl, triageCtrl, clinicCtrl, queueCtrl, matchCtrl, healthProfileCtrl, fitnessCtrl, cfg.JWTSecret)

	// 7. Start server
	log.Printf("Starting server on port %s...", cfg.Port)
	log.Printf("💬 Chat WebSocket available at /ws/chat")
	log.Printf("🏥 Waiting Room WebSocket available at /ws/waiting-room")
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

// Global WebSocket Upgrader Configuration
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for simplicity (development)
	},
}
