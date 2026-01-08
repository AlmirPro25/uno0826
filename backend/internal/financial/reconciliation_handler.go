package financial

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// RECONCILIATION HANDLER
// ========================================

type ReconciliationHandler struct {
	service *ReconciliationService
}

func NewReconciliationHandler(service *ReconciliationService) *ReconciliationHandler {
	return &ReconciliationHandler{service: service}
}

// RunAppReconciliation executa reconciliação para um app
// POST /api/v1/apps/:id/financial/reconcile
func (h *ReconciliationHandler) RunAppReconciliation(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	var req struct {
		PeriodStart string `json:"period_start"` // YYYY-MM-DD
		PeriodEnd   string `json:"period_end"`   // YYYY-MM-DD
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		// Default: últimos 30 dias
		req.PeriodEnd = time.Now().Format("2006-01-02")
		req.PeriodStart = time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	}

	periodStart, err := time.Parse("2006-01-02", req.PeriodStart)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "period_start inválido (use YYYY-MM-DD)"})
		return
	}

	periodEnd, err := time.Parse("2006-01-02", req.PeriodEnd)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "period_end inválido (use YYYY-MM-DD)"})
		return
	}

	// Ajustar para fim do dia
	periodEnd = periodEnd.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	executedBy := c.GetString("userID")
	if executedBy == "" {
		executedBy = "system"
	}

	result, err := h.service.ReconcileApp(appID, periodStart, periodEnd, executedBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Buscar discrepâncias
	discrepancies, _ := h.service.GetDiscrepancies(result)

	c.JSON(http.StatusOK, gin.H{
		"result":        result,
		"discrepancies": discrepancies,
	})
}

// GetAppReconciliations lista reconciliações de um app
// GET /api/v1/apps/:id/financial/reconciliations
func (h *ReconciliationHandler) GetAppReconciliations(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > 100 {
		limit = 100
	}

	results, err := h.service.ListReconciliations(appID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reconciliations": results,
		"total":           len(results),
	})
}

// GetReconciliationDetail retorna detalhes de uma reconciliação
// GET /api/v1/financial/reconciliations/:id
func (h *ReconciliationHandler) GetReconciliationDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	result, err := h.service.GetReconciliationResult(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Reconciliação não encontrada"})
		return
	}

	discrepancies, _ := h.service.GetDiscrepancies(result)

	c.JSON(http.StatusOK, gin.H{
		"result":        result,
		"discrepancies": discrepancies,
	})
}

// ========================================
// GLOBAL RECONCILIATION (Super Admin)
// ========================================

// RunGlobalReconciliation executa reconciliação para todos os apps
// POST /api/v1/admin/financial/reconcile
func (h *ReconciliationHandler) RunGlobalReconciliation(c *gin.Context) {
	var req struct {
		PeriodStart string `json:"period_start"`
		PeriodEnd   string `json:"period_end"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		req.PeriodEnd = time.Now().Format("2006-01-02")
		req.PeriodStart = time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	}

	periodStart, _ := time.Parse("2006-01-02", req.PeriodStart)
	periodEnd, _ := time.Parse("2006-01-02", req.PeriodEnd)
	periodEnd = periodEnd.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	executedBy := c.GetString("userID")
	if executedBy == "" {
		executedBy = "super_admin"
	}

	results, err := h.service.ReconcileAll(periodStart, periodEnd, executedBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Contar resultados
	matched := 0
	mismatched := 0
	failed := 0
	for _, r := range results {
		switch r.Status {
		case ReconciliationMatched:
			matched++
		case ReconciliationMismatched:
			mismatched++
		case ReconciliationFailed:
			failed++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"results":    results,
		"total":      len(results),
		"matched":    matched,
		"mismatched": mismatched,
		"failed":     failed,
	})
}

// GetReconciliationSummary retorna resumo global
// GET /api/v1/admin/financial/reconciliation-summary
func (h *ReconciliationHandler) GetReconciliationSummary(c *gin.Context) {
	summary, err := h.service.GetReconciliationSummary()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// GetRecentReconciliations lista reconciliações recentes (global)
// GET /api/v1/admin/financial/reconciliations
func (h *ReconciliationHandler) GetRecentReconciliations(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit > 200 {
		limit = 200
	}

	var results []ReconciliationResult
	err := h.service.db.Order("executed_at DESC").
		Limit(limit).
		Find(&results).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reconciliations": results,
		"total":           len(results),
	})
}

// GetMismatchedReconciliations lista apenas reconciliações com divergências
// GET /api/v1/admin/financial/reconciliations/mismatched
func (h *ReconciliationHandler) GetMismatchedReconciliations(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	var results []ReconciliationResult
	err := h.service.db.Where("status = ?", ReconciliationMismatched).
		Order("executed_at DESC").
		Limit(limit).
		Find(&results).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reconciliations": results,
		"total":           len(results),
	})
}

// ========================================
// ROUTES REGISTRATION
// ========================================

func RegisterReconciliationRoutes(router *gin.RouterGroup, service *ReconciliationService, authMiddleware, adminMiddleware, superAdminMiddleware gin.HandlerFunc) {
	handler := NewReconciliationHandler(service)

	// Rotas por app (owner)
	apps := router.Group("/apps")
	apps.Use(authMiddleware)
	{
		apps.POST("/:id/financial/reconcile", handler.RunAppReconciliation)
		apps.GET("/:id/financial/reconciliations", handler.GetAppReconciliations)
	}

	// Rota de detalhe (auth)
	router.GET("/financial/reconciliations/:id", authMiddleware, handler.GetReconciliationDetail)

	// Rotas globais (super admin)
	admin := router.Group("/admin/financial")
	admin.Use(authMiddleware)
	admin.Use(superAdminMiddleware)
	{
		admin.POST("/reconcile", handler.RunGlobalReconciliation)
		admin.GET("/reconciliation-summary", handler.GetReconciliationSummary)
		admin.GET("/reconciliations", handler.GetRecentReconciliations)
		admin.GET("/reconciliations/mismatched", handler.GetMismatchedReconciliations)
	}
}
