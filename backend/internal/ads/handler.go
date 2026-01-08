package ads

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// ADS HANDLER - HTTP API
// ========================================

// AdsHandler gerencia endpoints de Ads
type AdsHandler struct {
	service *AdsService
}

// NewAdsHandler cria novo handler
func NewAdsHandler(service *AdsService) *AdsHandler {
	return &AdsHandler{service: service}
}

// ========================================
// REQUEST/RESPONSE TYPES
// ========================================

type CreateAdAccountRequest struct {
	Name             string `json:"name" binding:"required"`
	BillingAccountID string `json:"billing_account_id" binding:"required"`
}

type CreateBudgetRequest struct {
	AdAccountID string `json:"ad_account_id" binding:"required"`
	Amount      int64  `json:"amount" binding:"required,gt=0"`
	Currency    string `json:"currency" binding:"required"`
	Period      string `json:"period" binding:"required,oneof=daily monthly lifetime"`
}

type RefillBudgetRequest struct {
	Amount int64 `json:"amount" binding:"required,gt=0"`
}

type CreateCampaignRequest struct {
	AdAccountID string `json:"ad_account_id" binding:"required"`
	BudgetID    string `json:"budget_id" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Objective   string `json:"objective" binding:"required,oneof=impressions clicks conversions"`
	BidStrategy string `json:"bid_strategy" binding:"required,oneof=lowest_cost target_cost manual"`
}

type RegisterSpendRequest struct {
	CampaignID string `json:"campaign_id" binding:"required"`
	Amount     int64  `json:"amount" binding:"required,gt=0"`
	Quantity   int64  `json:"quantity" binding:"required,gt=0"`
	Unit       string `json:"unit" binding:"required,oneof=impression click conversion"`
	Source     string `json:"source" binding:"omitempty,oneof=internal external"`
}

type SetKillSwitchRequest struct {
	Active bool `json:"active"`
}

// ========================================
// AD ACCOUNT ENDPOINTS
// ========================================

// CreateAdAccount cria conta de anúncios
func (h *AdsHandler) CreateAdAccount(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req CreateAdAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	billingAccountID, err := uuid.Parse(req.BillingAccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "billing_account_id inválido"})
		return
	}

	ctx := c.Request.Context()
	account, err := h.service.CreateAdAccount(ctx, userID, req.Name, billingAccountID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar conta de anúncios"})
		return
	}

	c.JSON(http.StatusCreated, account)
}

// GetAdAccount busca conta de anúncios
func (h *AdsHandler) GetAdAccount(c *gin.Context) {
	accountIDStr := c.Param("accountId")
	accountID, err := uuid.Parse(accountIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	account, err := h.service.GetAdAccount(accountID)
	if err != nil {
		if err == ErrAdAccountNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Conta não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar conta"})
		return
	}

	c.JSON(http.StatusOK, account)
}

// GetMyAdAccount busca conta do usuário autenticado
func (h *AdsHandler) GetMyAdAccount(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	account, err := h.service.GetAdAccountByUser(userID)
	if err != nil {
		if err == ErrAdAccountNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Conta não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar conta"})
		return
	}

	c.JSON(http.StatusOK, account)
}

// ========================================
// BUDGET ENDPOINTS
// ========================================

// CreateBudget cria orçamento
func (h *AdsHandler) CreateBudget(c *gin.Context) {
	var req CreateBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adAccountID, err := uuid.Parse(req.AdAccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ad_account_id inválido"})
		return
	}

	ctx := c.Request.Context()
	budget, err := h.service.CreateBudget(ctx, adAccountID, req.Amount, req.Currency, BudgetPeriod(req.Period))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar orçamento"})
		return
	}

	c.JSON(http.StatusCreated, budget)
}

// GetBudget busca orçamento
func (h *AdsHandler) GetBudget(c *gin.Context) {
	budgetIDStr := c.Param("budgetId")
	budgetID, err := uuid.Parse(budgetIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	budget, err := h.service.GetBudget(budgetID)
	if err != nil {
		if err == ErrBudgetNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Orçamento não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar orçamento"})
		return
	}

	c.JSON(http.StatusOK, budget)
}

// RefillBudget adiciona mais orçamento
func (h *AdsHandler) RefillBudget(c *gin.Context) {
	budgetIDStr := c.Param("budgetId")
	budgetID, err := uuid.Parse(budgetIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req RefillBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	budget, err := h.service.RefillBudget(ctx, budgetID, req.Amount)
	if err != nil {
		if err == ErrBudgetDisputed {
			c.JSON(http.StatusConflict, gin.H{"error": "Orçamento em disputa"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao recarregar orçamento"})
		return
	}

	c.JSON(http.StatusOK, budget)
}

// ========================================
// CAMPAIGN ENDPOINTS
// ========================================

// CreateCampaign cria campanha
func (h *AdsHandler) CreateCampaign(c *gin.Context) {
	var req CreateCampaignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adAccountID, err := uuid.Parse(req.AdAccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ad_account_id inválido"})
		return
	}

	budgetID, err := uuid.Parse(req.BudgetID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "budget_id inválido"})
		return
	}

	ctx := c.Request.Context()
	campaign, err := h.service.CreateCampaign(ctx, adAccountID, budgetID, req.Name, CampaignObjective(req.Objective), BidStrategy(req.BidStrategy))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar campanha"})
		return
	}

	c.JSON(http.StatusCreated, campaign)
}

// GetCampaign busca campanha
func (h *AdsHandler) GetCampaign(c *gin.Context) {
	campaignIDStr := c.Param("campaignId")
	campaignID, err := uuid.Parse(campaignIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	campaign, err := h.service.GetCampaign(campaignID)
	if err != nil {
		if err == ErrCampaignNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Campanha não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar campanha"})
		return
	}

	c.JSON(http.StatusOK, campaign)
}

// ListCampaigns lista campanhas
func (h *AdsHandler) ListCampaigns(c *gin.Context) {
	accountIDStr := c.Param("accountId")
	accountID, err := uuid.Parse(accountIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	campaigns, err := h.service.ListCampaigns(accountID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar campanhas"})
		return
	}

	c.JSON(http.StatusOK, campaigns)
}

// ActivateCampaign ativa campanha
func (h *AdsHandler) ActivateCampaign(c *gin.Context) {
	campaignIDStr := c.Param("campaignId")
	campaignID, err := uuid.Parse(campaignIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	ctx := c.Request.Context()
	campaign, err := h.service.ActivateCampaign(ctx, campaignID)
	if err != nil {
		if err == ErrGovernanceBlocked {
			c.JSON(http.StatusForbidden, gin.H{"error": "Bloqueado por governança"})
			return
		}
		if err == ErrInvalidTransition {
			c.JSON(http.StatusConflict, gin.H{"error": "Transição inválida", "campaign": campaign})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao ativar campanha"})
		return
	}

	c.JSON(http.StatusOK, campaign)
}

// PauseCampaign pausa campanha
func (h *AdsHandler) PauseCampaign(c *gin.Context) {
	campaignIDStr := c.Param("campaignId")
	campaignID, err := uuid.Parse(campaignIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	ctx := c.Request.Context()
	campaign, err := h.service.PauseCampaign(ctx, campaignID, "user_requested")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao pausar campanha"})
		return
	}

	c.JSON(http.StatusOK, campaign)
}

// ResumeCampaign retoma campanha
func (h *AdsHandler) ResumeCampaign(c *gin.Context) {
	campaignIDStr := c.Param("campaignId")
	campaignID, err := uuid.Parse(campaignIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	ctx := c.Request.Context()
	campaign, err := h.service.ResumeCampaign(ctx, campaignID)
	if err != nil {
		if err == ErrGovernanceBlocked {
			c.JSON(http.StatusForbidden, gin.H{"error": "Bloqueado por governança"})
			return
		}
		if err == ErrBudgetExhausted {
			c.JSON(http.StatusConflict, gin.H{"error": "Orçamento esgotado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao retomar campanha"})
		return
	}

	c.JSON(http.StatusOK, campaign)
}

// GetCampaignStats retorna estatísticas
func (h *AdsHandler) GetCampaignStats(c *gin.Context) {
	campaignIDStr := c.Param("campaignId")
	campaignID, err := uuid.Parse(campaignIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	stats, err := h.service.GetCampaignStats(campaignID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar estatísticas"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ========================================
// SPEND ENDPOINTS
// ========================================

// RegisterSpend registra evento de gasto
func (h *AdsHandler) RegisterSpend(c *gin.Context) {
	var req RegisterSpendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	campaignID, err := uuid.Parse(req.CampaignID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "campaign_id inválido"})
		return
	}

	source := SpendSourceInternal
	if req.Source == "external" {
		source = SpendSourceExternal
	}

	ctx := c.Request.Context()
	event, err := h.service.RegisterSpendEvent(ctx, campaignID, req.Amount, req.Quantity, SpendUnit(req.Unit), source)
	if err != nil {
		if err == ErrCampaignNotActive {
			c.JSON(http.StatusConflict, gin.H{"error": "Campanha não está ativa"})
			return
		}
		if err == ErrGovernanceBlocked {
			c.JSON(http.StatusForbidden, gin.H{"error": "Bloqueado por governança"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao registrar gasto"})
		return
	}

	c.JSON(http.StatusCreated, event)
}

// ========================================
// GOVERNANCE ENDPOINTS
// ========================================

// SetKillSwitch ativa/desativa kill switch
func (h *AdsHandler) SetKillSwitch(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req SetKillSwitchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	if err := h.service.SetKillSwitch(ctx, userID, req.Active); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao configurar kill switch"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"kill_switch": req.Active})
}

// GetDisputedItems retorna itens em disputa
func (h *AdsHandler) GetDisputedItems(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	items, err := h.service.GetDisputedItems(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar itens disputados"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterAdsRoutes registra rotas do módulo Ads
func RegisterAdsRoutes(router *gin.RouterGroup, service *AdsService, authMiddleware gin.HandlerFunc) {
	handler := NewAdsHandler(service)

	ads := router.Group("/ads")
	{
		// Ad Account
		ads.POST("/accounts", authMiddleware, handler.CreateAdAccount)
		ads.GET("/accounts/me", authMiddleware, handler.GetMyAdAccount)
		ads.GET("/accounts/:accountId", authMiddleware, handler.GetAdAccount)
		ads.GET("/accounts/:accountId/campaigns", authMiddleware, handler.ListCampaigns)

		// Budget
		ads.POST("/budgets", authMiddleware, handler.CreateBudget)
		ads.GET("/budgets/:budgetId", authMiddleware, handler.GetBudget)
		ads.POST("/budgets/:budgetId/refill", authMiddleware, handler.RefillBudget)

		// Campaign
		ads.POST("/campaigns", authMiddleware, handler.CreateCampaign)
		ads.GET("/campaigns/:campaignId", authMiddleware, handler.GetCampaign)
		ads.POST("/campaigns/:campaignId/activate", authMiddleware, handler.ActivateCampaign)
		ads.POST("/campaigns/:campaignId/pause", authMiddleware, handler.PauseCampaign)
		ads.POST("/campaigns/:campaignId/resume", authMiddleware, handler.ResumeCampaign)
		ads.GET("/campaigns/:campaignId/stats", authMiddleware, handler.GetCampaignStats)

		// Spend
		ads.POST("/spend", authMiddleware, handler.RegisterSpend)

		// Governance
		ads.POST("/governance/kill-switch", authMiddleware, handler.SetKillSwitch)
		ads.GET("/governance/disputed", authMiddleware, handler.GetDisputedItems)
	}
}
