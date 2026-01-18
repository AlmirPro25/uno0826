package ads

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// INVENTORY HANDLER - CRUD COMPLETO
// "O Cofre precisa de ouro para não ser vazio"
// ========================================

type InventoryHandler struct {
	service *AdsService
	engine  *DecisionEngine
}

func NewInventoryHandler(service *AdsService, engine *DecisionEngine) *InventoryHandler {
	return &InventoryHandler{service: service, engine: engine}
}

// ========================================
// REQUEST TYPES (Inventory-specific)
// ========================================

type CreateAdAccountReq struct {
	Name             string `json:"name" binding:"required"`
	BillingAccountID string `json:"billing_account_id" binding:"required"`
}

type CreateBudgetReq struct {
	AdAccountID string `json:"ad_account_id" binding:"required"`
	Amount      int64  `json:"amount" binding:"required,min=1000"` // Mínimo 1000 centavos = R$10
	Currency    string `json:"currency" binding:"required"`
	Period      string `json:"period" binding:"required,oneof=daily monthly lifetime"`
}

type CreateCampaignReq struct {
	AdAccountID string `json:"ad_account_id" binding:"required"`
	BudgetID    string `json:"budget_id" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Objective   string `json:"objective" binding:"required,oneof=awareness traffic conversions impressions clicks"`
	BidStrategy string `json:"bid_strategy" binding:"required,oneof=cpm cpc cpa lowest_cost target_cost manual"`
	BidAmount   int64  `json:"bid_amount" binding:"required,min=10"` // Mínimo 10 centavos
	DailyBudget int64  `json:"daily_budget,omitempty"`
}

type UpdateCampaignRequest struct {
	Name        string `json:"name,omitempty"`
	BidAmount   int64  `json:"bid_amount,omitempty"`
	DailyBudget int64  `json:"daily_budget,omitempty"`
}

type CreateCreativeFullRequest struct {
	CampaignID  string   `json:"campaign_id" binding:"required"`
	Name        string   `json:"name" binding:"required"`
	Format      string   `json:"format" binding:"required,oneof=banner native video"`
	ContentURL  string   `json:"content_url" binding:"required"`
	ClickURL    string   `json:"click_url" binding:"required"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	CTAText     string   `json:"cta_text"`
	Width       int      `json:"width,omitempty"`
	Height      int      `json:"height,omitempty"`
	SlotIDs     []string `json:"slot_ids,omitempty"` // Slots onde pode aparecer
}

type SetTargetingRequest struct {
	CampaignID   string   `json:"campaign_id" binding:"required"`
	SlotIDs      []string `json:"slot_ids,omitempty"`
	Plans        []string `json:"plans,omitempty"`        // free, pro, enterprise
	Countries    []string `json:"countries,omitempty"`    // BR, US, etc
	Languages    []string `json:"languages,omitempty"`    // pt, en, es
	DeviceTypes  []string `json:"device_types,omitempty"` // mobile, desktop, tablet
	TimeRanges   []string `json:"time_ranges,omitempty"`  // 09:00-18:00
	ExcludeUsers []string `json:"exclude_users,omitempty"`
}

// ========================================
// AD ACCOUNT ENDPOINTS
// ========================================

// CreateAdAccount cria conta de anúncios
// POST /ads/accounts
func (h *InventoryHandler) CreateAdAccount(c *gin.Context) {
	var req CreateAdAccountReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	userUUID, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	billingAccountID, err := uuid.Parse(req.BillingAccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid billing_account_id"})
		return
	}

	ctx := c.Request.Context()
	account, err := h.service.CreateAdAccount(ctx, userUUID, req.Name, billingAccountID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, account)
}

// GetMyAdAccount retorna conta do usuário
// GET /ads/accounts/me
func (h *InventoryHandler) GetMyAdAccount(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	userUUID, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	account, err := h.service.GetAdAccountByUser(userUUID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ad account not found"})
		return
	}

	c.JSON(http.StatusOK, account)
}

// ========================================
// BUDGET ENDPOINTS
// ========================================

// CreateBudget cria orçamento
// POST /ads/budgets
func (h *InventoryHandler) CreateBudget(c *gin.Context) {
	var req CreateBudgetReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adAccountID, err := uuid.Parse(req.AdAccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ad_account_id"})
		return
	}

	ctx := c.Request.Context()
	budget, err := h.service.CreateBudget(ctx, adAccountID, req.Amount, req.Currency, BudgetPeriod(req.Period))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, budget)
}

// GetBudget retorna orçamento
// GET /ads/budgets/:budgetId
func (h *InventoryHandler) GetBudget(c *gin.Context) {
	budgetID, err := uuid.Parse(c.Param("budgetId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid budget_id"})
		return
	}

	budget, err := h.service.GetBudget(budgetID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "budget not found"})
		return
	}

	c.JSON(http.StatusOK, budget)
}

// RefillBudget adiciona mais orçamento
// POST /ads/budgets/:budgetId/refill
func (h *InventoryHandler) RefillBudget(c *gin.Context) {
	budgetID, err := uuid.Parse(c.Param("budgetId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid budget_id"})
		return
	}

	var req struct {
		Amount int64 `json:"amount" binding:"required,min=1000"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	budget, err := h.service.RefillBudget(ctx, budgetID, req.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, budget)
}

// ========================================
// CAMPAIGN ENDPOINTS
// ========================================

// CreateCampaign cria campanha
// POST /ads/campaigns
func (h *InventoryHandler) CreateCampaign(c *gin.Context) {
	var req CreateCampaignReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adAccountID, err := uuid.Parse(req.AdAccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ad_account_id"})
		return
	}

	budgetID, err := uuid.Parse(req.BudgetID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid budget_id"})
		return
	}

	ctx := c.Request.Context()
	campaign, err := h.service.CreateCampaign(ctx, adAccountID, budgetID, req.Name, CampaignObjective(req.Objective), BidStrategy(req.BidStrategy))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Set bid amount
	campaign.BidAmount = req.BidAmount
	campaign.DailyBudget = req.DailyBudget
	h.service.db.Save(campaign)

	c.JSON(http.StatusCreated, campaign)
}

// GetCampaign retorna campanha
// GET /ads/campaigns/:campaignId
func (h *InventoryHandler) GetCampaign(c *gin.Context) {
	campaignID, err := uuid.Parse(c.Param("campaignId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign_id"})
		return
	}

	campaign, err := h.service.GetCampaign(campaignID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "campaign not found"})
		return
	}

	c.JSON(http.StatusOK, campaign)
}

// UpdateCampaign atualiza campanha
// PUT /ads/campaigns/:campaignId
func (h *InventoryHandler) UpdateCampaign(c *gin.Context) {
	campaignID, err := uuid.Parse(c.Param("campaignId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign_id"})
		return
	}

	var req UpdateCampaignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	campaign, err := h.service.GetCampaign(campaignID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "campaign not found"})
		return
	}

	if req.Name != "" {
		campaign.Name = req.Name
	}
	if req.BidAmount > 0 {
		campaign.BidAmount = req.BidAmount
	}
	if req.DailyBudget > 0 {
		campaign.DailyBudget = req.DailyBudget
	}
	campaign.UpdatedAt = time.Now()

	if err := h.service.db.Save(campaign).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, campaign)
}

// ListCampaigns lista campanhas
// GET /ads/campaigns?ad_account_id=xxx
func (h *InventoryHandler) ListCampaigns(c *gin.Context) {
	adAccountIDStr := c.Query("ad_account_id")
	if adAccountIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ad_account_id required"})
		return
	}

	adAccountID, err := uuid.Parse(adAccountIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ad_account_id"})
		return
	}

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	campaigns, err := h.service.ListCampaigns(adAccountID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"campaigns": campaigns,
		"count":     len(campaigns),
	})
}

// ActivateCampaign ativa campanha
// POST /ads/campaigns/:campaignId/activate
func (h *InventoryHandler) ActivateCampaign(c *gin.Context) {
	campaignID, err := uuid.Parse(c.Param("campaignId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign_id"})
		return
	}

	ctx := c.Request.Context()
	campaign, err := h.service.ActivateCampaign(ctx, campaignID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, campaign)
}

// PauseCampaign pausa campanha
// POST /ads/campaigns/:campaignId/pause
func (h *InventoryHandler) PauseCampaign(c *gin.Context) {
	campaignID, err := uuid.Parse(c.Param("campaignId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign_id"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	ctx := c.Request.Context()
	campaign, err := h.service.PauseCampaign(ctx, campaignID, req.Reason)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, campaign)
}

// ResumeCampaign retoma campanha
// POST /ads/campaigns/:campaignId/resume
func (h *InventoryHandler) ResumeCampaign(c *gin.Context) {
	campaignID, err := uuid.Parse(c.Param("campaignId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign_id"})
		return
	}

	ctx := c.Request.Context()
	campaign, err := h.service.ResumeCampaign(ctx, campaignID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, campaign)
}

// GetCampaignStats retorna estatísticas
// GET /ads/campaigns/:campaignId/stats
func (h *InventoryHandler) GetCampaignStats(c *gin.Context) {
	campaignID, err := uuid.Parse(c.Param("campaignId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign_id"})
		return
	}

	stats, err := h.service.GetCampaignStats(campaignID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ========================================
// CREATIVE ENDPOINTS
// ========================================

// CreateCreativeFull cria criativo completo
// POST /ads/creatives/full
func (h *InventoryHandler) CreateCreativeFull(c *gin.Context) {
	var req CreateCreativeFullRequest
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, creative)
}

// ListCreatives lista criativos de uma campanha
// GET /ads/creatives?campaign_id=xxx
func (h *InventoryHandler) ListCreatives(c *gin.Context) {
	campaignIDStr := c.Query("campaign_id")
	if campaignIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "campaign_id required"})
		return
	}

	campaignID, err := uuid.Parse(campaignIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign_id"})
		return
	}

	var creatives []AdCreative
	if err := h.engine.db.Where("campaign_id = ?", campaignID).Find(&creatives).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"creatives": creatives,
		"count":     len(creatives),
	})
}

// ========================================
// TARGETING ENDPOINTS
// ========================================

// SetTargeting define targeting de campanha
// POST /ads/targeting
func (h *InventoryHandler) SetTargeting(c *gin.Context) {
	var req SetTargetingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	campaignID, err := uuid.Parse(req.CampaignID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign_id"})
		return
	}

	// Serialize arrays to JSON strings
	targeting := &AdTargeting{
		ID:           uuid.New(),
		CampaignID:   campaignID,
		SlotIDs:      serializeArray(req.SlotIDs),
		Plans:        serializeArray(req.Plans),
		Countries:    serializeArray(req.Countries),
		Languages:    serializeArray(req.Languages),
		DeviceTypes:  serializeArray(req.DeviceTypes),
		TimeRanges:   serializeArray(req.TimeRanges),
		ExcludeUsers: serializeArray(req.ExcludeUsers),
	}

	// Upsert
	var existing AdTargeting
	if err := h.engine.db.Where("campaign_id = ?", campaignID).First(&existing).Error; err == nil {
		targeting.ID = existing.ID
	}

	if err := h.engine.db.Save(targeting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, targeting)
}

// GetTargeting retorna targeting de campanha
// GET /ads/targeting/:campaignId
func (h *InventoryHandler) GetTargeting(c *gin.Context) {
	campaignID, err := uuid.Parse(c.Param("campaignId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign_id"})
		return
	}

	var targeting AdTargeting
	if err := h.engine.db.Where("campaign_id = ?", campaignID).First(&targeting).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "targeting not found"})
		return
	}

	c.JSON(http.StatusOK, targeting)
}

// ========================================
// HELPERS
// ========================================

func serializeArray(arr []string) string {
	if len(arr) == 0 {
		return ""
	}
	result := ""
	for i, s := range arr {
		if i > 0 {
			result += ","
		}
		result += s
	}
	return result
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterInventoryRoutes registra rotas ADICIONAIS de inventário
// (rotas básicas já estão em handler.go)
func RegisterInventoryRoutes(router *gin.RouterGroup, service *AdsService, engine *DecisionEngine, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewInventoryHandler(service, engine)

	ads := router.Group("/ads")
	ads.Use(authMiddleware)
	{
		// Rotas adicionais que não existem no handler.go

		// Campaigns - rotas extras
		ads.GET("/campaigns", handler.ListCampaigns)
		ads.PUT("/campaigns/:campaignId", handler.UpdateCampaign)

		// Creatives - CRUD completo
		ads.POST("/creatives/full", handler.CreateCreativeFull)
		ads.GET("/creatives", handler.ListCreatives)

		// Targeting - CRUD completo
		ads.POST("/targeting", handler.SetTargeting)
		ads.GET("/targeting/:campaignId", handler.GetTargeting)
	}
}
