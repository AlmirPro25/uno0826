package kernel_billing

import (
	"log"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ========================================
// KERNEL BILLING ROUTES - Fase 28.1 + 28.2-B + 28.2-D
// ========================================

// RegisterKernelBillingRoutes registra as rotas de billing do kernel
func RegisterKernelBillingRoutes(
	r *gin.RouterGroup,
	db *gorm.DB,
	service *KernelBillingService,
	authMiddleware gin.HandlerFunc,
	adminOnly gin.HandlerFunc,
	superAdminOnly gin.HandlerFunc,
) {
	handler := NewKernelBillingHandler(service)

	// Inicializar serviços da Fase 28.2-B
	stripeConfig := LoadKernelStripeConfig()
	stripeService := NewKernelStripeService(stripeConfig, service)
	alertService := NewKernelBillingAlertService(db)
	reconciliationService := NewReconciliationService(db, stripeService, alertService)
	webhookHandler := NewKernelWebhookHandler(db, service, stripeService, alertService, stripeConfig.WebhookSecret)
	stripeHandler := NewKernelStripeHandler(service, stripeService, alertService)
	reconciliationHandler := NewReconciliationHandler(reconciliationService)
	alertHandler := NewAlertHandler(alertService)

	// Inicializar serviços da Fase 28.2-D (Pilot App)
	featureFlagService := NewFeatureFlagService(db)
	pilotService := NewPilotService(db, featureFlagService, service)
	pilotHandler := NewPilotHandler(featureFlagService, pilotService)
	log.Println("✅ Pilot App Services inicializados (test_mode)")

	// ========================================
	// ROTAS PÚBLICAS (planos)
	// ========================================
	kernel := r.Group("/kernel")
	{
		kernel.GET("/plans", handler.GetPlans)
		kernel.GET("/plans/:id", handler.GetPlan)
	}

	// ========================================
	// WEBHOOK STRIPE (sem auth - validação por assinatura)
	// Fase 28.2-B: Cenários 1-8, 12, 15
	// ========================================
	r.POST("/kernel/webhooks/stripe", webhookHandler.HandleStripeWebhook)

	// ========================================
	// ROTAS DO APP OWNER (billing do próprio app)
	// Usando :id para consistência com outras rotas de /apps
	// ========================================
	appBilling := r.Group("/apps/:id/billing")
	appBilling.Use(authMiddleware)
	{
		// Subscription
		appBilling.GET("/subscription", handler.GetMySubscription)
		appBilling.POST("/change-plan", handler.ChangePlan)
		appBilling.POST("/cancel", handler.CancelSubscription)

		// Usage
		appBilling.GET("/usage", handler.GetMyUsage)
		appBilling.GET("/usage/history", handler.GetUsageHistory)

		// Invoices
		appBilling.GET("/invoices", handler.GetMyInvoices)
		appBilling.GET("/invoices/:invoice_id", handler.GetInvoice)

		// Fase 28.2-B: Checkout Stripe
		appBilling.POST("/checkout", stripeHandler.CreateCheckout)
		appBilling.GET("/checkout/status", stripeHandler.GetCheckoutStatus)
	}

	// ========================================
	// ROTAS DO SUPERADMIN (gestão global)
	// ========================================
	adminBilling := r.Group("/admin/kernel/billing")
	adminBilling.Use(authMiddleware, superAdminOnly)
	{
		// Stats
		adminBilling.GET("/stats", handler.GetBillingStats)

		// Subscriptions
		adminBilling.GET("/subscriptions", handler.GetAllSubscriptions)

		// Invoices
		adminBilling.GET("/invoices", handler.GetAllInvoices)
		adminBilling.POST("/invoices/:id/pay", handler.MarkInvoicePaid)
		adminBilling.POST("/invoices/:id/void", handler.VoidInvoice)

		// Billing Cycle
		adminBilling.POST("/process-cycle", handler.ProcessBillingCycle)

		// Fase 28.2-B: Stripe Status
		adminBilling.GET("/stripe/status", stripeHandler.GetStripeStatus)

		// Fase 28.2-B: Reconciliação (Cenários 5, 13)
		adminBilling.POST("/reconciliation/run", reconciliationHandler.RunReconciliation)
		adminBilling.GET("/reconciliation/divergences", reconciliationHandler.GetDivergences)
		adminBilling.POST("/reconciliation/divergences/:id/resolve", reconciliationHandler.ResolveDivergence)
		adminBilling.GET("/reconciliation/stats", reconciliationHandler.GetStats)

		// Fase 28.2-B: Alertas (Cenários 2, 5, 6, 7, 11, 12, 13, 15)
		adminBilling.GET("/alerts", alertHandler.GetAlerts)
		adminBilling.GET("/alerts/critical", alertHandler.GetCriticalAlerts)
		adminBilling.POST("/alerts/:id/acknowledge", alertHandler.AcknowledgeAlert)
		adminBilling.POST("/alerts/:id/resolve", alertHandler.ResolveAlert)
		adminBilling.GET("/alerts/stats", alertHandler.GetAlertStats)
	}

	// ========================================
	// ROTAS INTERNAS (para outros serviços)
	// ========================================
	internal := r.Group("/internal")
	{
		internal.GET("/quota/:app_id", handler.CheckQuota)
	}

	// ========================================
	// FEATURE FLAGS - Fase 28.2-D
	// "Rollout gradual controlado"
	// ========================================
	flags := adminBilling.Group("/flags")
	{
		flags.GET("", pilotHandler.GetAllFlags)
		flags.GET("/:name", pilotHandler.GetFlag)
		flags.PUT("/:name", pilotHandler.UpdateFlag)
		flags.POST("/:name/check", pilotHandler.CheckFlag)
		flags.POST("/:name/whitelist", pilotHandler.AddToWhitelist)
		flags.DELETE("/:name/whitelist/:app_id", pilotHandler.RemoveFromWhitelist)
	}

	// ========================================
	// PILOT MANAGEMENT - Fase 28.2-D
	// "1 app piloto → 10% → 50% → 100%"
	// ========================================
	pilots := adminBilling.Group("/pilots")
	{
		pilots.GET("", pilotHandler.GetPilots)
		pilots.POST("", pilotHandler.RegisterPilot)
		pilots.POST("/:app_id/activate", pilotHandler.ActivatePilot)
		pilots.POST("/:app_id/pause", pilotHandler.PausePilot)
		pilots.POST("/:app_id/complete", pilotHandler.CompletePilot)
		pilots.GET("/:app_id/metrics", pilotHandler.GetPilotMetrics)
	}

	// ========================================
	// ROLLOUT STATUS - Fase 28.2-D
	// "Visão geral do estado do rollout"
	// ========================================
	adminBilling.GET("/rollout/status", pilotHandler.GetRolloutStatus)
}
