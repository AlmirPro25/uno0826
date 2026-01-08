package kernel_billing

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// ========================================
// KERNEL STRIPE HANDLER - Fase 28.2-B
// "Endpoints de checkout e status do Stripe"
// Cenários cobertos: 1, 9, 11
// ========================================

// KernelStripeHandler handlers para operações Stripe
type KernelStripeHandler struct {
	billingService *KernelBillingService
	stripeService  *KernelStripeService
	alertService   *KernelBillingAlertService
}

// NewKernelStripeHandler cria novo handler
func NewKernelStripeHandler(
	billingService *KernelBillingService,
	stripeService *KernelStripeService,
	alertService *KernelBillingAlertService,
) *KernelStripeHandler {
	return &KernelStripeHandler{
		billingService: billingService,
		stripeService:  stripeService,
		alertService:   alertService,
	}
}

// ========================================
// CHECKOUT ENDPOINTS
// ========================================

// CreateCheckoutRequest request para criar checkout
type CreateCheckoutRequest struct {
	PlanID string `json:"plan_id" binding:"required"`
	Email  string `json:"email" binding:"required,email"`
	Name   string `json:"name"`
}

// CreateCheckoutResponse response do checkout
type CreateCheckoutResponse struct {
	SessionID   string    `json:"session_id"`
	CheckoutURL string    `json:"checkout_url"`
	ExpiresAt   time.Time `json:"expires_at"`
}

// CreateCheckout cria sessão de checkout
// Cenário 1: Cartão recusado no checkout (tratado pelo Stripe)
// Cenário 9: Upgrade no meio do ciclo
// POST /apps/:id/billing/checkout
func (h *KernelStripeHandler) CreateCheckout(c *gin.Context) {
	appID := c.Param("id")

	var req CreateCheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar se Stripe está configurado
	if !h.stripeService.IsConfigured() {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Serviço de pagamento não configurado",
			"code":  "stripe_not_configured",
		})
		return
	}

	// Verificar plano
	plan, err := h.billingService.GetPlanByID(req.PlanID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plano não encontrado"})
		return
	}

	// Plano Free não precisa de checkout
	if plan.PriceMonthly == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plano gratuito não requer pagamento"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Criar ou obter customer
	name := req.Name
	if name == "" {
		name = req.Email
	}

	customer, err := h.stripeService.CreateOrGetCustomer(ctx, appID, req.Email, name)
	if err != nil {
		// Cenário 11: Stripe indisponível
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": err.Error(),
			"code":  "stripe_unavailable",
		})
		return
	}

	// Criar sessão de checkout
	session, err := h.stripeService.CreateCheckoutSession(ctx, appID, customer.CustomerID, req.PlanID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Erro ao criar sessão de checkout",
			"code":  "checkout_failed",
		})
		return
	}

	c.JSON(http.StatusOK, CreateCheckoutResponse{
		SessionID:   session.SessionID,
		CheckoutURL: session.URL,
		ExpiresAt:   session.ExpiresAt,
	})
}

// GetCheckoutStatus retorna status de um checkout
// GET /apps/:id/billing/checkout/status?session_id=xxx
func (h *KernelStripeHandler) GetCheckoutStatus(c *gin.Context) {
	appID := c.Param("id")
	sessionID := c.Query("session_id")

	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id é obrigatório"})
		return
	}

	// Buscar subscription atual
	sub, err := h.billingService.GetSubscription(appID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subscription não encontrada"})
		return
	}

	// Retornar status atual
	c.JSON(http.StatusOK, gin.H{
		"session_id":   sessionID,
		"subscription": sub,
		"status":       sub.Status,
	})
}

// ========================================
// STRIPE STATUS ENDPOINT
// ========================================

// GetStripeStatus retorna status do Stripe e circuit breaker
// Cenário 11: Monitorar disponibilidade
// GET /admin/kernel/billing/stripe/status
func (h *KernelStripeHandler) GetStripeStatus(c *gin.Context) {
	cbStats := h.stripeService.GetCircuitBreakerStatus()

	status := "operational"
	if cbStats.State == "OPEN" {
		status = "degraded"
	} else if cbStats.State == "HALF_OPEN" {
		status = "recovering"
	}

	c.JSON(http.StatusOK, gin.H{
		"configured":      h.stripeService.IsConfigured(),
		"test_mode":       h.stripeService.config.TestMode,
		"status":          status,
		"circuit_breaker": cbStats,
	})
}

// ========================================
// RECONCILIATION HANDLER
// ========================================

// ReconciliationHandler handlers para reconciliação
type ReconciliationHandler struct {
	service *ReconciliationService
}

// NewReconciliationHandler cria novo handler
func NewReconciliationHandler(service *ReconciliationService) *ReconciliationHandler {
	return &ReconciliationHandler{service: service}
}

// RunReconciliation executa reconciliação
// Cenário 5: Webhook nunca chega
// Cenário 13: Divergência Stripe × Kernel
// POST /admin/kernel/billing/reconciliation/run
func (h *ReconciliationHandler) RunReconciliation(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Minute)
	defer cancel()

	result, err := h.service.RunReconciliation(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetDivergences retorna divergências
// GET /admin/kernel/billing/reconciliation/divergences
func (h *ReconciliationHandler) GetDivergences(c *gin.Context) {
	status := c.DefaultQuery("status", "open")

	var divergences []ReconciliationDivergence
	var err error

	if status == "open" {
		divergences, err = h.service.GetOpenDivergences()
	} else {
		// Buscar todas
		err = h.service.db.Order("created_at DESC").Find(&divergences).Error
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"divergences": divergences,
		"count":       len(divergences),
	})
}

// ResolveDivergenceRequest request para resolver divergência
type ResolveDivergenceRequest struct {
	Resolution string `json:"resolution" binding:"required"`
	Action     string `json:"action"` // resolve ou ignore
}

// ResolveDivergence resolve uma divergência
// POST /admin/kernel/billing/reconciliation/divergences/:id/resolve
func (h *ReconciliationHandler) ResolveDivergence(c *gin.Context) {
	divergenceID := c.Param("id")
	resolvedBy := c.GetString("user_id") // Do middleware de auth

	var req ResolveDivergenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var err error
	if req.Action == "ignore" {
		err = h.service.IgnoreDivergence(divergenceID, resolvedBy, req.Resolution)
	} else {
		err = h.service.ResolveDivergence(divergenceID, resolvedBy, req.Resolution)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "resolved"})
}

// GetStats retorna estatísticas de reconciliação
// GET /admin/kernel/billing/reconciliation/stats
func (h *ReconciliationHandler) GetStats(c *gin.Context) {
	stats, err := h.service.GetReconciliationStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ========================================
// ALERT HANDLER
// ========================================

// AlertHandler handlers para alertas
type AlertHandler struct {
	service *KernelBillingAlertService
}

// NewAlertHandler cria novo handler
func NewAlertHandler(service *KernelBillingAlertService) *AlertHandler {
	return &AlertHandler{service: service}
}

// GetAlerts retorna alertas
// GET /admin/kernel/billing/alerts
func (h *AlertHandler) GetAlerts(c *gin.Context) {
	status := c.DefaultQuery("status", "open")
	appID := c.Query("app_id")

	var alerts []KernelBillingAlert
	var err error

	if appID != "" {
		alerts, err = h.service.GetAlertsByApp(appID)
	} else if status == "open" {
		alerts, err = h.service.GetOpenAlerts()
	} else {
		// Buscar todos
		err = h.service.db.Order("created_at DESC").Limit(100).Find(&alerts).Error
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
		"count":  len(alerts),
	})
}

// GetCriticalAlerts retorna alertas críticos
// GET /admin/kernel/billing/alerts/critical
func (h *AlertHandler) GetCriticalAlerts(c *gin.Context) {
	alerts, err := h.service.GetCriticalAlerts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
		"count":  len(alerts),
	})
}

// AcknowledgeAlert reconhece um alerta
// POST /admin/kernel/billing/alerts/:id/acknowledge
func (h *AlertHandler) AcknowledgeAlert(c *gin.Context) {
	alertID := c.Param("id")
	acknowledgedBy := c.GetString("user_id")

	if err := h.service.AcknowledgeAlert(alertID, acknowledgedBy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "acknowledged"})
}

// ResolveAlert resolve um alerta
// POST /admin/kernel/billing/alerts/:id/resolve
func (h *AlertHandler) ResolveAlert(c *gin.Context) {
	alertID := c.Param("id")
	resolvedBy := c.GetString("user_id")

	if err := h.service.ResolveAlert(alertID, resolvedBy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "resolved"})
}

// GetAlertStats retorna estatísticas de alertas
// GET /admin/kernel/billing/alerts/stats
func (h *AlertHandler) GetAlertStats(c *gin.Context) {
	stats, err := h.service.GetAlertStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
