package policy

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// THRESHOLD HANDLER - HTTP API
// ========================================

type ThresholdHandler struct {
	service *ThresholdService
}

func NewThresholdHandler(service *ThresholdService) *ThresholdHandler {
	return &ThresholdHandler{service: service}
}

// ========================================
// ENDPOINTS
// ========================================

// CreateThreshold cria um novo threshold
// POST /api/v1/thresholds/policy/:policyId
func (h *ThresholdHandler) CreateThreshold(c *gin.Context) {
	policyIDStr := c.Param("policyId")
	policyID, err := uuid.Parse(policyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "policy_id inválido"})
		return
	}

	var req struct {
		AppID       *uuid.UUID      `json:"app_id,omitempty"`
		RiskLevel   string          `json:"risk_level" binding:"required"`
		Action      ThresholdAction `json:"action" binding:"required"`
		Description string          `json:"description,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Pegar user do contexto
	userIDStr := c.GetString("userID")
	userID, _ := uuid.Parse(userIDStr)

	createReq := CreateThresholdRequest{
		PolicyID:    policyID,
		AppID:       req.AppID,
		RiskLevel:   req.RiskLevel,
		Action:      req.Action,
		Description: req.Description,
	}

	threshold, err := h.service.CreateThreshold(createReq, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, threshold)
}

// GetThreshold busca um threshold
// GET /api/v1/thresholds/:id
func (h *ThresholdHandler) GetThreshold(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	threshold, err := h.service.GetThresholdByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "threshold não encontrado"})
		return
	}

	c.JSON(http.StatusOK, threshold)
}

// ListThresholdsForPolicy lista thresholds de uma policy
// GET /api/v1/policies/:policyId/thresholds
func (h *ThresholdHandler) ListThresholdsForPolicy(c *gin.Context) {
	policyIDStr := c.Param("policyId")
	policyID, err := uuid.Parse(policyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "policy_id inválido"})
		return
	}

	thresholds, err := h.service.ListThresholdsForPolicy(policyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"policy_id":  policyID,
		"thresholds": thresholds,
		"count":      len(thresholds),
	})
}

// ListThresholdsForApp lista thresholds de um app
// GET /api/v1/apps/:appId/thresholds
func (h *ThresholdHandler) ListThresholdsForApp(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	thresholds, err := h.service.ListThresholdsForApp(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"app_id":     appID,
		"thresholds": thresholds,
		"count":      len(thresholds),
	})
}

// UpdateThreshold atualiza um threshold
// PUT /api/v1/thresholds/:id
func (h *ThresholdHandler) UpdateThreshold(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var req UpdateThresholdRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Pegar user do contexto
	userID := c.GetString("userID")

	threshold, err := h.service.UpdateThreshold(id, req, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, threshold)
}

// DeactivateThreshold desativa um threshold
// DELETE /api/v1/thresholds/:id
func (h *ThresholdHandler) DeactivateThreshold(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required,min=10"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetString("userID")

	if err := h.service.DeactivateThreshold(id, req.Reason, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "threshold desativado", "id": id})
}

// GetRecommendation retorna recomendação baseada em threshold
// POST /api/v1/thresholds/recommend
func (h *ThresholdHandler) GetRecommendation(c *gin.Context) {
	var req struct {
		PolicyID  string  `json:"policy_id" binding:"required"`
		AppID     *string `json:"app_id,omitempty"`
		RiskLevel string  `json:"risk_level" binding:"required"`
		RiskScore float64 `json:"risk_score" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	policyID, err := uuid.Parse(req.PolicyID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "policy_id inválido"})
		return
	}

	var appID *uuid.UUID
	if req.AppID != nil {
		parsed, err := uuid.Parse(*req.AppID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
			return
		}
		appID = &parsed
	}

	recommendation, err := h.service.GetRecommendation(policyID, appID, req.RiskLevel, req.RiskScore)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recommendation)
}

// GetAdjustmentHistory retorna histórico de ajustes
// GET /api/v1/thresholds/:id/history
func (h *ThresholdHandler) GetAdjustmentHistory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	adjustments, err := h.service.GetAdjustmentHistory(id, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"threshold_id": id,
		"adjustments":  adjustments,
		"count":        len(adjustments),
	})
}

// RevertAdjustment reverte um ajuste
// POST /api/v1/thresholds/adjustments/:adjustmentId/revert
func (h *ThresholdHandler) RevertAdjustment(c *gin.Context) {
	adjustmentIDStr := c.Param("adjustmentId")
	adjustmentID, err := uuid.Parse(adjustmentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "adjustment_id inválido"})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required,min=10"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetString("userID")

	if err := h.service.RevertAdjustment(adjustmentID, req.Reason, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ajuste revertido", "adjustment_id": adjustmentID})
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterThresholdRoutes registra rotas de thresholds
func RegisterThresholdRoutes(router *gin.RouterGroup, service *ThresholdService, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewThresholdHandler(service)

	// Rotas de threshold (todas sob /thresholds)
	thresholds := router.Group("/thresholds")
	thresholds.Use(authMiddleware)
	{
		// CRUD
		thresholds.GET("/:id", handler.GetThreshold)
		thresholds.PUT("/:id", adminMiddleware, handler.UpdateThreshold)
		thresholds.DELETE("/:id", adminMiddleware, handler.DeactivateThreshold)
		
		// Histórico
		thresholds.GET("/:id/history", handler.GetAdjustmentHistory)
		
		// Recomendação
		thresholds.POST("/recommend", handler.GetRecommendation)
		
		// Reversão
		thresholds.POST("/adjustments/:adjustmentId/revert", adminMiddleware, handler.RevertAdjustment)
		
		// Listar por policy
		thresholds.GET("/policy/:policyId", handler.ListThresholdsForPolicy)
		thresholds.POST("/policy/:policyId", adminMiddleware, handler.CreateThreshold)
		
		// Listar por app
		thresholds.GET("/app/:appId", handler.ListThresholdsForApp)
	}
}
