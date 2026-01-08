package kernel_billing

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ========================================
// KERNEL BILLING HANDLER - Fase 28.1
// ========================================

type KernelBillingHandler struct {
	service *KernelBillingService
}

func NewKernelBillingHandler(service *KernelBillingService) *KernelBillingHandler {
	return &KernelBillingHandler{service: service}
}

// ========================================
// PLANS ENDPOINTS
// ========================================

// GetPlans retorna todos os planos disponíveis
// GET /api/v1/kernel/plans
func (h *KernelBillingHandler) GetPlans(c *gin.Context) {
	plans, err := h.service.GetPlans()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"plans": plans})
}

// GetPlan retorna um plano específico
// GET /api/v1/kernel/plans/:id
func (h *KernelBillingHandler) GetPlan(c *gin.Context) {
	planID := c.Param("id")
	plan, err := h.service.GetPlanByID(planID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "plan not found"})
		return
	}
	c.JSON(http.StatusOK, plan)
}

// ========================================
// SUBSCRIPTION ENDPOINTS (App Owner)
// ========================================

// GetMySubscription retorna a subscription do app do admin logado
// GET /api/v1/apps/:id/billing/subscription
func (h *KernelBillingHandler) GetMySubscription(c *gin.Context) {
	appID := c.Param("id")
	
	sub, err := h.service.GetOrCreateSubscription(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sub)
}

// ChangePlan muda o plano do app
// POST /api/v1/apps/:id/billing/change-plan
func (h *KernelBillingHandler) ChangePlan(c *gin.Context) {
	appID := c.Param("id")
	
	var req struct {
		PlanID string `json:"plan_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sub, err := h.service.ChangePlan(appID, req.PlanID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "plan changed",
		"subscription": sub,
	})
}

// CancelSubscription cancela a subscription
// POST /api/v1/apps/:id/billing/cancel
func (h *KernelBillingHandler) CancelSubscription(c *gin.Context) {
	appID := c.Param("id")
	
	sub, err := h.service.CancelSubscription(appID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "subscription will be canceled at period end",
		"subscription": sub,
	})
}

// ========================================
// USAGE ENDPOINTS
// ========================================

// GetMyUsage retorna o usage atual do app
// GET /api/v1/apps/:id/billing/usage
func (h *KernelBillingHandler) GetMyUsage(c *gin.Context) {
	appID := c.Param("id")
	
	usage, err := h.service.GetOrCreateUsage(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Buscar subscription para mostrar limites
	sub, _ := h.service.GetOrCreateSubscription(appID)
	plan, _ := h.service.GetPlanByID(sub.PlanID)

	c.JSON(http.StatusOK, gin.H{
		"usage": usage,
		"limits": gin.H{
			"max_transactions_month": plan.MaxTransactionsMonth,
			"max_api_calls_month":    plan.MaxAPICallsMonth,
			"max_webhooks_month":     plan.MaxWebhooksMonth,
		},
		"subscription": sub,
	})
}

// GetUsageHistory retorna o histórico de usage
// GET /api/v1/apps/:id/billing/usage/history
func (h *KernelBillingHandler) GetUsageHistory(c *gin.Context) {
	appID := c.Param("id")
	
	usages, err := h.service.GetUsageHistory(appID, 12) // Últimos 12 meses
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"history": usages})
}

// ========================================
// INVOICE ENDPOINTS
// ========================================

// GetMyInvoices retorna as invoices do app
// GET /api/v1/apps/:id/billing/invoices
func (h *KernelBillingHandler) GetMyInvoices(c *gin.Context) {
	appID := c.Param("id")
	
	invoices, err := h.service.GetInvoices(appID, 24) // Últimas 24 invoices
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"invoices": invoices})
}

// GetInvoice retorna uma invoice específica
// GET /api/v1/apps/:app_id/billing/invoices/:invoice_id
func (h *KernelBillingHandler) GetInvoice(c *gin.Context) {
	invoiceID := c.Param("invoice_id")
	
	invoice, err := h.service.GetInvoiceByID(invoiceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "invoice not found"})
		return
	}

	// Incluir line items
	c.JSON(http.StatusOK, gin.H{
		"invoice":    invoice,
		"line_items": invoice.LineItems(),
	})
}

// ========================================
// SUPERADMIN ENDPOINTS
// ========================================

// GetBillingStats retorna estatísticas de billing (superadmin)
// GET /api/v1/admin/kernel/billing/stats
func (h *KernelBillingHandler) GetBillingStats(c *gin.Context) {
	stats, err := h.service.GetBillingStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

// GetAllSubscriptions retorna todas as subscriptions (superadmin)
// GET /api/v1/admin/kernel/billing/subscriptions
func (h *KernelBillingHandler) GetAllSubscriptions(c *gin.Context) {
	var subs []AppSubscription
	if err := h.service.db.Preload("Plan").Order("created_at DESC").Find(&subs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"subscriptions": subs})
}

// GetAllInvoices retorna todas as invoices (superadmin)
// GET /api/v1/admin/kernel/billing/invoices
func (h *KernelBillingHandler) GetAllInvoices(c *gin.Context) {
	status := c.Query("status")
	
	query := h.service.db.Model(&KernelInvoice{}).Order("created_at DESC")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var invoices []KernelInvoice
	if err := query.Limit(100).Find(&invoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"invoices": invoices})
}

// MarkInvoicePaid marca uma invoice como paga (superadmin)
// POST /api/v1/admin/kernel/billing/invoices/:id/pay
func (h *KernelBillingHandler) MarkInvoicePaid(c *gin.Context) {
	invoiceID := c.Param("id")
	
	// Pegar admin do contexto
	adminID, _ := c.Get("user_id")
	
	var req struct {
		Note string `json:"note"`
	}
	c.ShouldBindJSON(&req)

	invoice, err := h.service.MarkInvoicePaid(invoiceID, adminID.(string), req.Note)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "invoice marked as paid",
		"invoice": invoice,
	})
}

// VoidInvoice cancela uma invoice (superadmin)
// POST /api/v1/admin/kernel/billing/invoices/:id/void
func (h *KernelBillingHandler) VoidInvoice(c *gin.Context) {
	invoiceID := c.Param("id")
	
	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	invoice, err := h.service.VoidInvoice(invoiceID, req.Reason)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "invoice voided",
		"invoice": invoice,
	})
}

// ProcessBillingCycle processa o ciclo de billing (superadmin/cron)
// POST /api/v1/admin/kernel/billing/process-cycle
func (h *KernelBillingHandler) ProcessBillingCycle(c *gin.Context) {
	if err := h.service.ProcessBillingCycle(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "billing cycle processed"})
}

// ========================================
// QUOTA CHECK ENDPOINT (interno)
// ========================================

// CheckQuota verifica a quota de um app
// GET /api/v1/internal/quota/:app_id
func (h *KernelBillingHandler) CheckQuota(c *gin.Context) {
	appID := c.Param("app_id")
	quotaType := c.DefaultQuery("type", "transactions")

	var result *QuotaCheckResult
	var err error

	switch quotaType {
	case "transactions":
		result, err = h.service.CheckTransactionQuota(appID)
	case "webhooks":
		result, err = h.service.CheckWebhookQuota(appID)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid quota type"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
