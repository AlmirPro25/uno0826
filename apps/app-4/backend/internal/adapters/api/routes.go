package api

import (
	"log"
	"medisync-platform/backend/internal/adapters/api/controllers"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"medisync-platform/backend/internal/services"
	"medisync-platform/backend/pkg/security"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// SetupRoutes configures all API routes for the Gin application.
func SetupRoutes(router *gin.Engine, authSvc ports.AuthService, userSvc ports.UserService, apptSvc ports.AppointmentService, recordSvc ports.MedicalRecordService, prescriptionSvc ports.PrescriptionService, certificateSvc ports.MedicalCertificateService, reviewSvc ports.ReviewService, notificationSvc *services.NotificationService, waitingRoomHub *services.Hub, chatHub *services.ChatHub, chatCtrl *controllers.ChatController, statsCtrl *controllers.StatsController, paymentCtrl *controllers.PaymentController, passwordResetCtrl *controllers.PasswordResetController, scheduleBlockCtrl *controllers.ScheduleBlockController, auditCtrl *controllers.AuditController, recurringCtrl *controllers.RecurringAppointmentController, healthCtrl *controllers.HealthController, backupCtrl *controllers.BackupController, triageCtrl *controllers.TriageReportController, clinicCtrl *controllers.ClinicController, queueCtrl *controllers.QueueController, matchCtrl *controllers.ClinicalMatchController, healthProfileCtrl *controllers.HealthProfileController, fitnessCtrl *controllers.FitnessController, jwtSecret string) {
	// Controllers initialization
	authCtrl := controllers.NewAuthController(authSvc)
	userCtrl := controllers.NewUserController(userSvc)
	apptCtrl := controllers.NewAppointmentController(apptSvc, waitingRoomHub)
	recordCtrl := controllers.NewMedicalRecordController(recordSvc)
	prescriptionCtrl := controllers.NewPrescriptionController(prescriptionSvc)
	certificateCtrl := controllers.NewMedicalCertificateController(certificateSvc)
	reviewCtrl := controllers.NewReviewController(reviewSvc)
	notificationCtrl := controllers.NewNotificationController(notificationSvc)

	// Middlewares initialization
	jwtAuthMiddleware := security.AuthMiddleware(jwtSecret)
	adminAuthMiddleware := security.CheckRole(domain.RoleAdmin)
	medicoAuthMiddleware := security.CheckRole(domain.RoleMedico)
	pacienteAuthMiddleware := security.CheckRole(domain.RolePaciente)
	strictRateLimit := security.StrictRateLimitMiddleware()
	standardRateLimit := security.StandardRateLimitMiddleware()

	// Apply standard rate limiting to all routes
	router.Use(standardRateLimit)

	// Health check endpoints (no auth required)
	router.GET("/health", healthCtrl.Health)
	router.GET("/health/ready", healthCtrl.Ready)
	router.GET("/health/live", healthCtrl.Live)

	// Public routes (Auth) - with strict rate limiting
	router.POST("/auth/login", strictRateLimit, authCtrl.Login)
	router.POST("/auth/register", strictRateLimit, authCtrl.RegisterPatient)
	router.POST("/auth/forgot-password", strictRateLimit, passwordResetCtrl.ForgotPassword)
	router.POST("/auth/reset-password", strictRateLimit, passwordResetCtrl.ResetPassword)
	router.POST("/auth/validate-reset-token", strictRateLimit, passwordResetCtrl.ValidateToken)
	router.POST("/auth/refresh-token", strictRateLimit, authCtrl.RefreshToken)
	router.POST("/auth/logout-all", jwtAuthMiddleware, authCtrl.LogoutAllDevices)
	router.POST("/auth/change-password", jwtAuthMiddleware, authCtrl.ChangePassword)
	router.GET("/auth/me", jwtAuthMiddleware, authCtrl.GetMe)

	// Admin routes group (Requires ADMIN role)
	adminGroup := router.Group("/admin")
	adminGroup.Use(jwtAuthMiddleware, adminAuthMiddleware)
	{
		adminGroup.GET("/users", userCtrl.ListUsers)
		adminGroup.POST("/users", userCtrl.CreateUser)
		adminGroup.GET("/users/:userId", userCtrl.GetUser)
		adminGroup.PUT("/users/:userId", userCtrl.UpdateUser)
		adminGroup.DELETE("/users/:userId", userCtrl.DeleteUser)
		// Backup routes
		adminGroup.POST("/backups", backupCtrl.CreateBackup)
		adminGroup.GET("/backups", backupCtrl.ListBackups)
		adminGroup.GET("/backups/:filename", backupCtrl.DownloadBackup)
		adminGroup.DELETE("/backups/:filename", backupCtrl.DeleteBackup)
		adminGroup.POST("/backups/:filename/restore", backupCtrl.RestoreBackup)
	}

	// User self-service routes (any authenticated user can access their own data)
	usersGroup := router.Group("/users")
	usersGroup.Use(jwtAuthMiddleware)
	{
		usersGroup.GET("/search", userCtrl.SearchUsers)           // Search users (for doctors to find patients)
		usersGroup.GET("/:userId", userCtrl.GetUser)
		usersGroup.PUT("/:userId", userCtrl.UpdateUser)
		usersGroup.DELETE("/:userId", userCtrl.DeleteUser)
		usersGroup.DELETE("/me/account", userCtrl.DeleteMyAccount) // Delete own account
	}

	// Appointments routes group (Requires PACIENTE or MEDICO role)
	appointmentsGroup := router.Group("/appointments")
	appointmentsGroup.Use(jwtAuthMiddleware)
	{
		appointmentsGroup.GET("/available-slots", apptCtrl.GetAvailableSlots)
		appointmentsGroup.GET("/my-appointments", apptCtrl.GetMyAppointments)
		appointmentsGroup.PUT("/:id/cancel", apptCtrl.CancelAppointment)
		appointmentsGroup.GET("/:id/video-call", apptCtrl.GetVideoCallInfo)
		appointmentsGroup.GET("/:id", apptCtrl.GetAppointment)
		appointmentsGroup.POST("/:id/start-call", apptCtrl.StartVideoCall)
		// Usually only patients book appointments in this flow, but implementation might vary
		appointmentsGroup.POST("/book", pacienteAuthMiddleware, apptCtrl.BookAppointment)
		appointmentsGroup.PUT("/:id/complete", medicoAuthMiddleware, apptCtrl.CompleteAppointment)
	}

	// Medical Records routes group (Requires MEDICO role for creation)
	medicalRecordsGroup := router.Group("/patients")
	medicalRecordsGroup.Use(jwtAuthMiddleware)
	{
		medicalRecordsGroup.GET("/:patientId/records", recordCtrl.GetRecords)
		medicalRecordsGroup.POST("/:patientId/records", medicoAuthMiddleware, recordCtrl.CreateRecord)
	}

	// Medical Records CRUD routes (for editing/deleting)
	recordsGroup := router.Group("/records")
	recordsGroup.Use(jwtAuthMiddleware)
	{
		recordsGroup.GET("/:recordId", recordCtrl.GetRecord)
		recordsGroup.PUT("/:recordId", medicoAuthMiddleware, recordCtrl.UpdateRecord)
		recordsGroup.DELETE("/:recordId", medicoAuthMiddleware, recordCtrl.DeleteRecord)
	}

	// Chat routes group
	chatGroup := router.Group("/chat")
	chatGroup.Use(jwtAuthMiddleware)
	{
		// Conversations
		chatGroup.GET("/conversations", chatCtrl.GetConversations)
		chatGroup.GET("/conversations/:id", chatCtrl.GetConversation)
		chatGroup.POST("/conversations", chatCtrl.CreateConversation)
		chatGroup.DELETE("/conversations/:id", chatCtrl.DeleteConversation)
		chatGroup.PUT("/conversations/:id/mute", chatCtrl.MuteConversation)
		chatGroup.PUT("/conversations/:id/block", chatCtrl.BlockConversation)
		chatGroup.PUT("/conversations/:id/read", chatCtrl.MarkAsRead)

		// Messages
		chatGroup.GET("/conversations/:id/messages", chatCtrl.GetMessages)
		chatGroup.POST("/conversations/:id/messages", chatCtrl.SendMessage)
		chatGroup.PUT("/messages/:id/star", chatCtrl.StarMessage)
		chatGroup.DELETE("/messages/:id", chatCtrl.DeleteMessage)

		// Contacts
		chatGroup.GET("/contacts", chatCtrl.GetContacts)
		chatGroup.POST("/contacts", chatCtrl.AddContact)
		chatGroup.PUT("/contacts/:id", chatCtrl.UpdateContact)
		chatGroup.DELETE("/contacts/:id", chatCtrl.RemoveContact)

		// Followed Clinics
		chatGroup.GET("/clinics/followed", chatCtrl.GetFollowedClinics)
		chatGroup.POST("/clinics/:id/follow", chatCtrl.FollowClinic)
		chatGroup.DELETE("/clinics/:id/follow", chatCtrl.UnfollowClinic)
		chatGroup.PUT("/clinics/:id/notifications", chatCtrl.ToggleClinicNotifications)

		// Search
		chatGroup.GET("/search/users", chatCtrl.SearchUsers)
		chatGroup.GET("/search/messages", chatCtrl.SearchMessages)

		// Status
		chatGroup.PUT("/status", chatCtrl.UpdateOnlineStatus)
		chatGroup.GET("/unread-count", chatCtrl.GetUnreadCount)

		// Legacy endpoints (for backwards compatibility)
		chatGroup.GET("/online", chatCtrl.GetOnlineUsers)
		chatGroup.GET("/online/:userId", chatCtrl.CheckUserOnline)
		chatGroup.POST("/notifications", chatCtrl.SendNotification)
	}

	// Notifications routes group
	notificationsGroup := router.Group("/notifications")
	notificationsGroup.Use(jwtAuthMiddleware)
	{
		notificationsGroup.GET("", notificationCtrl.GetNotifications)
		notificationsGroup.GET("/unread-count", notificationCtrl.GetUnreadCount)
		notificationsGroup.PUT("/:id/read", notificationCtrl.MarkAsRead)
		notificationsGroup.PUT("/read-all", notificationCtrl.MarkAllAsRead)
		notificationsGroup.DELETE("/:id", notificationCtrl.DeleteNotification)
	}

	// Prescriptions routes group
	prescriptionsGroup := router.Group("/prescriptions")
	prescriptionsGroup.Use(jwtAuthMiddleware)
	{
		prescriptionsGroup.GET("/my-prescriptions", prescriptionCtrl.GetMyPrescriptions)
		prescriptionsGroup.GET("/:id", prescriptionCtrl.GetPrescription)
		prescriptionsGroup.POST("", medicoAuthMiddleware, prescriptionCtrl.CreatePrescription)
		prescriptionsGroup.PUT("/:id", medicoAuthMiddleware, prescriptionCtrl.UpdatePrescription)
		prescriptionsGroup.DELETE("/:id", medicoAuthMiddleware, prescriptionCtrl.DeletePrescription)
	}

	// Patient prescriptions (for doctors to view patient's prescriptions)
	router.GET("/patients/:patientId/prescriptions", jwtAuthMiddleware, prescriptionCtrl.GetPatientPrescriptions)

	// Medical Certificates routes group (Atestados)
	certificatesGroup := router.Group("/certificates")
	certificatesGroup.Use(jwtAuthMiddleware)
	{
		certificatesGroup.GET("/my-certificates", certificateCtrl.GetMyCertificates)
		certificatesGroup.GET("/:id", certificateCtrl.GetCertificate)
		certificatesGroup.POST("", medicoAuthMiddleware, certificateCtrl.CreateCertificate)
		certificatesGroup.DELETE("/:id", medicoAuthMiddleware, certificateCtrl.DeleteCertificate)
	}

	// Patient certificates (for doctors to view patient's certificates)
	router.GET("/patients/:patientId/certificates", jwtAuthMiddleware, certificateCtrl.GetPatientCertificates)

	// Payments routes group
	paymentsGroup := router.Group("/payments")
	paymentsGroup.Use(jwtAuthMiddleware)
	{
		paymentsGroup.GET("/config", paymentCtrl.GetPaymentConfig)
		paymentsGroup.GET("/my-payments", pacienteAuthMiddleware, paymentCtrl.GetMyPayments)
		paymentsGroup.GET("/:id", paymentCtrl.GetPayment)
		paymentsGroup.POST("", pacienteAuthMiddleware, paymentCtrl.CreatePayment)
		paymentsGroup.POST("/:id/simulate", paymentCtrl.SimulatePayment) // For testing
	}

	// Stats routes group
	statsGroup := router.Group("/stats")
	statsGroup.Use(jwtAuthMiddleware)
	{
		statsGroup.GET("/admin", adminAuthMiddleware, statsCtrl.GetAdminDashboardStats)
		statsGroup.GET("/doctor", medicoAuthMiddleware, statsCtrl.GetDoctorStats)
		statsGroup.GET("/patient", pacienteAuthMiddleware, statsCtrl.GetPatientStats)
		// Detailed reports
		statsGroup.GET("/report", adminAuthMiddleware, statsCtrl.GetReportByPeriod)
		statsGroup.GET("/doctor-report", medicoAuthMiddleware, statsCtrl.GetDoctorReportByPeriod)
	}

	// Reviews routes group
	reviewsGroup := router.Group("/reviews")
	reviewsGroup.Use(jwtAuthMiddleware)
	{
		reviewsGroup.GET("/my-reviews", pacienteAuthMiddleware, reviewCtrl.GetMyReviews)
		reviewsGroup.GET("/:id", reviewCtrl.GetReview)
		reviewsGroup.POST("", pacienteAuthMiddleware, reviewCtrl.CreateReview)
		reviewsGroup.PUT("/:id", pacienteAuthMiddleware, reviewCtrl.UpdateReview)
		reviewsGroup.DELETE("/:id", pacienteAuthMiddleware, reviewCtrl.DeleteReview)
	}

	// Doctor routes (for patients to find doctors)
	router.GET("/doctors", jwtAuthMiddleware, userCtrl.ListDoctors)
	router.GET("/doctors/:doctorId/reviews", jwtAuthMiddleware, reviewCtrl.GetDoctorReviews)
	router.GET("/doctors/:doctorId/rating", jwtAuthMiddleware, reviewCtrl.GetDoctorRating)

	// Appointment review
	router.GET("/appointments/:id/review", jwtAuthMiddleware, reviewCtrl.GetReviewByAppointment)

	// Schedule Blocks routes group (Doctor availability management)
	scheduleBlocksGroup := router.Group("/schedule-blocks")
	scheduleBlocksGroup.Use(jwtAuthMiddleware)
	{
		scheduleBlocksGroup.GET("/my-blocks", medicoAuthMiddleware, scheduleBlockCtrl.GetMyBlocks)
		scheduleBlocksGroup.GET("/:id", scheduleBlockCtrl.GetBlock)
		scheduleBlocksGroup.POST("", medicoAuthMiddleware, scheduleBlockCtrl.CreateBlock)
		scheduleBlocksGroup.PUT("/:id", medicoAuthMiddleware, scheduleBlockCtrl.UpdateBlock)
		scheduleBlocksGroup.DELETE("/:id", medicoAuthMiddleware, scheduleBlockCtrl.DeleteBlock)
	}

	// Doctor schedule blocks (for patients to check availability)
	router.GET("/doctors/:doctorId/schedule-blocks", jwtAuthMiddleware, scheduleBlockCtrl.GetDoctorBlocks)
	router.GET("/doctors/:doctorId/check-blocked", jwtAuthMiddleware, scheduleBlockCtrl.CheckTimeBlocked)

	// Audit Logs routes group (Admin only)
	auditGroup := router.Group("/audit")
	auditGroup.Use(jwtAuthMiddleware)
	{
		auditGroup.GET("/logs", adminAuthMiddleware, auditCtrl.GetAuditLogs)
		auditGroup.GET("/logs/user/:userId", adminAuthMiddleware, auditCtrl.GetUserActivityLogs)
		auditGroup.GET("/logs/entity/:entityType/:entityId", adminAuthMiddleware, auditCtrl.GetEntityAuditLogs)
		auditGroup.GET("/my-activity", auditCtrl.GetMyActivityLogs)
	}

	// Recurring Appointments routes group
	recurringGroup := router.Group("/recurring-appointments")
	recurringGroup.Use(jwtAuthMiddleware)
	{
		recurringGroup.GET("/my-recurring", recurringCtrl.GetMyRecurring)
		recurringGroup.GET("/:id", recurringCtrl.GetRecurring)
		recurringGroup.POST("", pacienteAuthMiddleware, recurringCtrl.CreateRecurring)
		recurringGroup.GET("/:id/upcoming", recurringCtrl.GetUpcomingOccurrences)
		recurringGroup.POST("/:id/book", pacienteAuthMiddleware, recurringCtrl.BookFromRecurring)
		recurringGroup.DELETE("/:id", recurringCtrl.CancelRecurring)
	}

	// Triage Reports routes group (AI-powered triage)
	triageGroup := router.Group("/triage-reports")
	triageGroup.Use(jwtAuthMiddleware)
	{
		// Patient routes
		triageGroup.POST("", pacienteAuthMiddleware, triageCtrl.CreateTriageReport)
		triageGroup.GET("/my-reports", triageCtrl.GetMyTriageReports)
		triageGroup.GET("/:id", triageCtrl.GetTriageReport)
		triageGroup.PUT("/:id/status", triageCtrl.UpdateTriageStatus)

		// Doctor routes
		triageGroup.GET("/pending", medicoAuthMiddleware, triageCtrl.GetPendingTriageReports)
		triageGroup.GET("/assigned", medicoAuthMiddleware, triageCtrl.GetDoctorTriageReports)
		triageGroup.PUT("/:id/accept", medicoAuthMiddleware, triageCtrl.AcceptTriageReport)
		triageGroup.PUT("/:id/review", medicoAuthMiddleware, triageCtrl.ReviewTriageReport)
		triageGroup.PUT("/:id/link-appointment", medicoAuthMiddleware, triageCtrl.LinkToAppointment)

		// Admin routes
		triageGroup.GET("/stats", adminAuthMiddleware, triageCtrl.GetTriageStats)
	}

	// Patient triage reports (for doctors to view)
	router.GET("/patients/:patientId/triage-reports", jwtAuthMiddleware, triageCtrl.GetPatientTriageReports)

	// Clinics routes group (public + authenticated)
	// Public clinic routes (no auth required for browsing)
	router.GET("/clinics", clinicCtrl.ListClinics)
	router.GET("/clinics/nearby", clinicCtrl.FindNearby)
	router.GET("/clinics/search", clinicCtrl.SearchClinics)
	router.GET("/clinics/premium", clinicCtrl.GetPremiumClinics)
	router.GET("/clinics/specialty/:specialty", clinicCtrl.FindBySpecialty)
	router.GET("/clinics/city/:city", clinicCtrl.FindByCity)
	router.GET("/clinics/:id", clinicCtrl.GetClinic)
	router.GET("/clinics/:id/reviews", clinicCtrl.GetReviews)

	// Authenticated clinic routes
	clinicsGroup := router.Group("/clinics")
	clinicsGroup.Use(jwtAuthMiddleware)
	{
		clinicsGroup.POST("", adminAuthMiddleware, clinicCtrl.CreateClinic)
		clinicsGroup.PUT("/:id", clinicCtrl.UpdateClinic)
		clinicsGroup.DELETE("/:id", clinicCtrl.DeleteClinic)
		clinicsGroup.POST("/:id/reviews", pacienteAuthMiddleware, clinicCtrl.CreateReview)
		clinicsGroup.PUT("/:id/premium", adminAuthMiddleware, clinicCtrl.SetPremium)
	}

	// Queue System routes
	// Public display endpoint (no auth required for public display screens)
	router.GET("/queue/display", queueCtrl.GetDisplayData)

	// Authenticated queue routes
	queueGroup := router.Group("/queue")
	queueGroup.Use(jwtAuthMiddleware)
	{
		queueGroup.POST("/tickets", medicoAuthMiddleware, queueCtrl.CreateTicket)
		queueGroup.GET("/tickets/:id", queueCtrl.GetTicket)
		queueGroup.GET("/tickets/number/:number", queueCtrl.GetTicketByNumber)
		queueGroup.GET("/waiting", queueCtrl.GetWaitingQueue)
		queueGroup.GET("/serving", queueCtrl.GetCurrentlyServing)
		queueGroup.GET("/today", queueCtrl.GetTodayTickets)
		queueGroup.POST("/call-next", medicoAuthMiddleware, queueCtrl.CallNext)
		queueGroup.POST("/tickets/:id/call", medicoAuthMiddleware, queueCtrl.CallSpecificTicket)
		queueGroup.PUT("/tickets/:id/start", medicoAuthMiddleware, queueCtrl.StartService)
		queueGroup.PUT("/tickets/:id/complete", medicoAuthMiddleware, queueCtrl.CompleteService)
		queueGroup.PUT("/tickets/:id/no-show", medicoAuthMiddleware, queueCtrl.MarkNoShow)
		queueGroup.GET("/stats", queueCtrl.GetStats)
	}

	// Clinical Match System routes (Intelligent Patient-Doctor Matching)
	matchGroup := router.Group("/match")
	matchGroup.Use(jwtAuthMiddleware)
	{
		matchGroup.POST("/start", pacienteAuthMiddleware, matchCtrl.StartMatch)           // Start intelligent matching
		matchGroup.POST("/classify", matchCtrl.ClassifyOnly)                               // Just classify symptoms
		matchGroup.POST("/find", matchCtrl.FindMatches)                                    // Find matches without creating record
		matchGroup.GET("/my", matchCtrl.GetMyMatches)                                      // Get user's matches
		matchGroup.GET("/pending", medicoAuthMiddleware, matchCtrl.GetPendingForDoctor)   // Doctor's pending matches
		matchGroup.GET("/:id", matchCtrl.GetMatch)                                         // Get specific match
		matchGroup.POST("/:id/accept", matchCtrl.AcceptMatch)                              // Accept a match
	}

	// Health Intelligence Core routes (Health Profile & Tracking)
	healthProfileGroup := router.Group("/health-profile")
	healthProfileGroup.Use(jwtAuthMiddleware)
	{
		// Profile
		healthProfileGroup.GET("/me", healthProfileCtrl.GetMyProfile)
		healthProfileGroup.PUT("/me", healthProfileCtrl.UpdateMyProfile)
		healthProfileGroup.GET("/summary", healthProfileCtrl.GetHealthSummary)
		healthProfileGroup.POST("/from-triage/:triageId", healthProfileCtrl.UpdateProfileFromTriage)

		// Daily Check-ins
		healthProfileGroup.POST("/check-in", healthProfileCtrl.CreateDailyCheckIn)
		healthProfileGroup.GET("/check-in/today", healthProfileCtrl.GetTodayCheckIn)
		healthProfileGroup.GET("/check-in/history", healthProfileCtrl.GetCheckInHistory)
		healthProfileGroup.POST("/check-in/ai", healthProfileCtrl.ProcessAIChatCheckIn)

		// Metrics
		healthProfileGroup.POST("/metrics", healthProfileCtrl.RecordMetric)
		healthProfileGroup.GET("/metrics", healthProfileCtrl.GetMetrics)

		// Medications
		healthProfileGroup.GET("/medications", healthProfileCtrl.GetMedications)
		healthProfileGroup.POST("/medications", healthProfileCtrl.CreateMedication)
		healthProfileGroup.POST("/medications/log", healthProfileCtrl.LogMedication)

		// Vaccines
		healthProfileGroup.GET("/vaccines", healthProfileCtrl.GetVaccines)
		healthProfileGroup.POST("/vaccines", healthProfileCtrl.CreateVaccine)

		// Exams
		healthProfileGroup.GET("/exams", healthProfileCtrl.GetExams)
		healthProfileGroup.POST("/exams", healthProfileCtrl.CreateExam)

		// Goals
		healthProfileGroup.GET("/goals", healthProfileCtrl.GetHealthGoals)
		healthProfileGroup.POST("/goals", healthProfileCtrl.CreateHealthGoal)
		healthProfileGroup.PUT("/goals/:id", healthProfileCtrl.UpdateHealthGoal)

		// Achievements
		healthProfileGroup.GET("/achievements", healthProfileCtrl.GetAchievements)
	}

	// Fitness System routes (NOVA Integration)
	fitnessGroup := router.Group("/fitness")
	fitnessGroup.Use(jwtAuthMiddleware)
	{
		// Profile
		fitnessGroup.GET("/profile", fitnessCtrl.GetProfile)
		fitnessGroup.PUT("/profile", fitnessCtrl.UpdateProfile)
		fitnessGroup.GET("/summary", fitnessCtrl.GetSummary)

		// NOVA Sync
		fitnessGroup.POST("/sync", fitnessCtrl.SyncFromNOVA)

		// Daily Stats
		fitnessGroup.GET("/stats", fitnessCtrl.GetDailyStats)
		fitnessGroup.POST("/stats", fitnessCtrl.CreateDailyStats)

		// Workout Sessions
		fitnessGroup.GET("/workouts", fitnessCtrl.GetWorkoutSessions)
		fitnessGroup.POST("/workouts", fitnessCtrl.CreateWorkoutSession)

		// Nutrition
		fitnessGroup.GET("/nutrition", fitnessCtrl.GetNutritionLogs)
		fitnessGroup.POST("/nutrition", fitnessCtrl.CreateNutritionLog)

		// Body Analysis
		fitnessGroup.GET("/body-analysis", fitnessCtrl.GetBodyAnalyses)
		fitnessGroup.POST("/body-analysis", fitnessCtrl.CreateBodyAnalysis)

		// Weekly Plan
		fitnessGroup.GET("/plan", fitnessCtrl.GetActivePlan)
		fitnessGroup.POST("/plan", fitnessCtrl.SaveWeeklyPlan)

		// Heart Rate
		fitnessGroup.POST("/heart-rate", fitnessCtrl.RecordHeartRate)
		fitnessGroup.GET("/heart-rate", fitnessCtrl.GetHeartRateHistory)

		// Achievements
		fitnessGroup.GET("/achievements", fitnessCtrl.GetAchievements)
	}

	// Real-time WebSocket route (Waiting Room)
	router.GET("/ws/waiting-room", func(c *gin.Context) {
		waitingRoomHandler(c, waitingRoomHub, jwtSecret)
	})

	// Real-time WebSocket route (Chat)
	router.GET("/ws/chat", func(c *gin.Context) {
		chatCtrl.HandleWebSocket(c, jwtSecret)
	})
}

// upgrader is a global configuration for WebSocket connections.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, validate origin against allowed domains
		origin := r.Header.Get("Origin")
		allowedOrigins := []string{
			"http://localhost:3000",
			"http://localhost:8080",
			"https://medisync.com",
			"https://www.medisync.com",
			"https://app.medisync.com",
		}
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				return true
			}
		}
		// Allow if no origin (same-origin requests)
		return origin == ""
	},
}

// waitingRoomHandler upgrades the HTTP connection to a WebSocket connection.
func waitingRoomHandler(c *gin.Context, hub *services.Hub, jwtSecret string) {
	// 1. Extract token from query parameter
	tokenString := c.Query("token")
	if tokenString == "" {
		log.Println("WebSocket connection rejected: no token")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing token"})
		return
	}

	// 2. Validate token
	claims, err := security.ValidateJWT(tokenString, jwtSecret)
	if err != nil {
		log.Printf("WebSocket connection rejected: invalid token: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection to WebSocket: %v", err)
		return
	}

	client := services.NewClient(conn, hub, claims.UserID)
	client.Hub.Register <- client

	go client.ReadPump()
	go client.WritePump()
}
