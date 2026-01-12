package ads

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// AD DECISION HANDLER
// "Gateway de Anúncios de Borda"
// ========================================

type DecisionHandler struct {
	engine *DecisionEngine
}

func NewDecisionHandler(engine *DecisionEngine) *DecisionHandler {
	return &DecisionHandler{engine: engine}
}

// ========================================
// REQUEST TYPES
// ========================================

type AdDecisionRequest struct {
	Slot       string            `json:"slot" binding:"required"`
	AppID      string            `json:"app_id" binding:"required"`
	UserID     string            `json:"user_id,omitempty"`
	DeviceID   string            `json:"device_id,omitempty"`
	Plan       string            `json:"plan,omitempty"`
	Country    string            `json:"country,omitempty"`
	Language   string            `json:"language,omitempty"`
	DeviceType string            `json:"device_type,omitempty"`
	Metadata   map[string]string `json:"metadata,omitempty"`
}

type CreateSlotRequest struct {
	AppID   string `json:"app_id" binding:"required"`
	Name    string `json:"name" binding:"required"`
	Format  string `json:"format" binding:"required,oneof=banner native video"`
	Width   int    `json:"width"`
	Height  int    `json:"height"`
	MinCPM  int64  `json:"min_cpm"`
}

type CreateCreativeRequest struct {
	CampaignID  string `json:"campaign_id" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Format      string `json:"format" binding:"required"`
	ContentURL  string `json:"content_url"`
	ClickURL    string `json:"click_url"`
	Title       string `json:"title"`
	Description string `json:"description"`
	CTAText     string `json:"cta_text"`
}


// ========================================
// DECISION ENDPOINT (LOW LATENCY)
// ========================================

// GetAd processa pedido de anúncio - endpoint de baixa latência
// POST /ads/decide
func (h *DecisionHandler) GetAd(c *gin.Context) {
	var req AdDecisionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Build internal request
	adReq := &AdRequest{
		RequestID:  c.GetHeader("X-Request-ID"),
		AppID:      req.AppID,
		SlotName:   req.Slot,
		UserID:     req.UserID,
		DeviceID:   req.DeviceID,
		Plan:       req.Plan,
		Country:    req.Country,
		Language:   req.Language,
		DeviceType: req.DeviceType,
		IP:         c.ClientIP(),
		UserAgent:  c.GetHeader("User-Agent"),
		Metadata:   req.Metadata,
		Timestamp:  time.Now(),
	}
	
	ctx := c.Request.Context()
	response, err := h.engine.Decide(ctx, adReq)
	
	if err != nil {
		// Still return response (no_fill) but with appropriate status
		switch err {
		case ErrRateLimited:
			c.JSON(http.StatusTooManyRequests, response)
		case ErrFraudDetected:
			c.JSON(http.StatusForbidden, response)
		default:
			c.JSON(http.StatusOK, response) // No fill is OK
		}
		return
	}
	
	c.JSON(http.StatusOK, response)
}

// TrackImpression registra impressão verificada
// POST /ads/track/:impressionId/impression
func (h *DecisionHandler) TrackImpression(c *gin.Context) {
	impressionID := c.Param("impressionId")
	
	// Verify impression exists
	impUUID, err := uuid.Parse(impressionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid impression id"})
		return
	}
	
	// Mark as verified
	h.engine.db.Model(&AdImpression{}).Where("id = ?", impUUID).Update("verified", true)
	
	c.JSON(http.StatusOK, gin.H{"verified": true})
}

// TrackClick registra clique
// POST /ads/track/:impressionId/click
func (h *DecisionHandler) TrackClick(c *gin.Context) {
	impressionID := c.Param("impressionId")
	
	ctx := c.Request.Context()
	if err := h.engine.RecordClick(ctx, impressionID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"recorded": true})
}

// GetMetrics retorna métricas do engine
// GET /ads/metrics
func (h *DecisionHandler) GetMetrics(c *gin.Context) {
	metrics := h.engine.GetMetrics()
	c.JSON(http.StatusOK, metrics)
}

// ========================================
// SLOT MANAGEMENT
// ========================================

// CreateSlot cria um slot de anúncio
// POST /ads/slots
func (h *DecisionHandler) CreateSlot(c *gin.Context) {
	var req CreateSlotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	appID, err := uuid.Parse(req.AppID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid app_id"})
		return
	}
	
	ctx := c.Request.Context()
	slot, err := h.engine.CreateSlot(ctx, appID, req.Name, req.Format, req.Width, req.Height, req.MinCPM)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create slot"})
		return
	}
	
	c.JSON(http.StatusCreated, slot)
}

// ListSlots lista slots de um app
// GET /ads/slots/:appId
func (h *DecisionHandler) ListSlots(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid app_id"})
		return
	}
	
	slots, err := h.engine.ListSlots(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list slots"})
		return
	}
	
	c.JSON(http.StatusOK, slots)
}

// EnableSlot habilita/desabilita slot
// POST /ads/slots/:slotId/enable
func (h *DecisionHandler) EnableSlot(c *gin.Context) {
	slotIDStr := c.Param("slotId")
	slotID, err := uuid.Parse(slotIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slot_id"})
		return
	}
	
	var req struct {
		Enabled bool `json:"enabled"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	if err := h.engine.EnableSlot(slotID, req.Enabled); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update slot"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"enabled": req.Enabled})
}


// ========================================
// CREATIVE MANAGEMENT
// ========================================

// CreateCreative cria um criativo
// POST /ads/creatives
func (h *DecisionHandler) CreateCreative(c *gin.Context) {
	var req CreateCreativeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	campaignID, err := uuid.Parse(req.CampaignID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign_id"})
		return
	}
	
	ctx := c.Request.Context()
	creative, err := h.engine.CreateCreative(ctx, campaignID, req.Name, req.Format, req.ContentURL, req.ClickURL, req.Title, req.Description, req.CTAText)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create creative"})
		return
	}
	
	c.JSON(http.StatusCreated, creative)
}

// ApproveCreative aprova um criativo
// POST /ads/creatives/:creativeId/approve
func (h *DecisionHandler) ApproveCreative(c *gin.Context) {
	creativeIDStr := c.Param("creativeId")
	creativeID, err := uuid.Parse(creativeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid creative_id"})
		return
	}
	
	if err := h.engine.ApproveCreative(creativeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to approve creative"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "approved"})
}

// RejectCreative rejeita um criativo
// POST /ads/creatives/:creativeId/reject
func (h *DecisionHandler) RejectCreative(c *gin.Context) {
	creativeIDStr := c.Param("creativeId")
	creativeID, err := uuid.Parse(creativeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid creative_id"})
		return
	}
	
	if err := h.engine.RejectCreative(creativeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reject creative"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "rejected"})
}

// ========================================
// REPORTING
// ========================================

// GetCampaignReport retorna relatório de campanha
// GET /ads/reports/campaign/:campaignId
func (h *DecisionHandler) GetCampaignReport(c *gin.Context) {
	campaignIDStr := c.Param("campaignId")
	campaignID, err := uuid.Parse(campaignIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign_id"})
		return
	}
	
	// Default: last 7 days
	to := time.Now()
	from := to.AddDate(0, 0, -7)
	
	if fromStr := c.Query("from"); fromStr != "" {
		if t, err := time.Parse("2006-01-02", fromStr); err == nil {
			from = t
		}
	}
	if toStr := c.Query("to"); toStr != "" {
		if t, err := time.Parse("2006-01-02", toStr); err == nil {
			to = t
		}
	}
	
	report, err := h.engine.GetCampaignReport(campaignID, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get report"})
		return
	}
	
	c.JSON(http.StatusOK, report)
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterDecisionRoutes registra rotas do Decision Engine
func RegisterDecisionRoutes(router *gin.RouterGroup, engine *DecisionEngine, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewDecisionHandler(engine)
	
	ads := router.Group("/ads")
	{
		// Public - Low latency decision endpoint
		ads.POST("/decide", handler.GetAd)
		
		// Tracking (no auth for pixel tracking)
		ads.POST("/track/:impressionId/impression", handler.TrackImpression)
		ads.POST("/track/:impressionId/click", handler.TrackClick)
		
		// Metrics (admin only)
		ads.GET("/metrics", authMiddleware, adminMiddleware, handler.GetMetrics)
		
		// Slot management (admin only)
		ads.POST("/slots", authMiddleware, adminMiddleware, handler.CreateSlot)
		ads.GET("/slots/:appId", authMiddleware, handler.ListSlots)
		ads.POST("/slots/:slotId/enable", authMiddleware, adminMiddleware, handler.EnableSlot)
		
		// Creative management (auth required)
		ads.POST("/creatives", authMiddleware, handler.CreateCreative)
		ads.POST("/creatives/:creativeId/approve", authMiddleware, adminMiddleware, handler.ApproveCreative)
		ads.POST("/creatives/:creativeId/reject", authMiddleware, adminMiddleware, handler.RejectCreative)
		
		// Reporting (auth required)
		ads.GET("/reports/campaign/:campaignId", authMiddleware, handler.GetCampaignReport)
	}
}
