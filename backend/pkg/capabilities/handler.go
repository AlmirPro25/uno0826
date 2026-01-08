package capabilities

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// ADD-ON HANDLER
// "Capabilities como produtos"
// ========================================

// AddOnHandler gerencia endpoints de add-ons
type AddOnHandler struct {
	db       *gorm.DB
	resolver *CapabilityResolver
}

// NewAddOnHandler cria novo handler
func NewAddOnHandler(db *gorm.DB) *AddOnHandler {
	return &AddOnHandler{
		db:       db,
		resolver: NewCapabilityResolver(db),
	}
}

// ListAddOns lista add-ons disponíveis para o usuário
// GET /addons
func (h *AddOnHandler) ListAddOns(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	
	// Buscar plano do usuário
	planID := h.getUserPlanID(userID)
	
	// Listar add-ons disponíveis para o plano
	addons := ListAddOnsForPlan(planID)
	
	// Marcar quais o usuário já tem
	var userAddOns []UserAddOn
	h.db.Where("user_id = ? AND status = ?", userID, "active").Find(&userAddOns)
	
	activeMap := make(map[string]bool)
	for _, ua := range userAddOns {
		activeMap[ua.AddOnID] = true
	}
	
	type AddOnResponse struct {
		AddOn
		Owned bool `json:"owned"`
	}
	
	response := make([]AddOnResponse, len(addons))
	for i, addon := range addons {
		response[i] = AddOnResponse{
			AddOn: addon,
			Owned: activeMap[addon.ID],
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"addons":   response,
		"plan_id":  planID,
	})
}

// GetMyAddOns lista add-ons ativos do usuário
// GET /addons/mine
func (h *AddOnHandler) GetMyAddOns(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	
	var userAddOns []UserAddOn
	h.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&userAddOns)
	
	// Enriquecer com dados do catálogo
	type EnrichedAddOn struct {
		UserAddOn
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	
	enriched := make([]EnrichedAddOn, len(userAddOns))
	for i, ua := range userAddOns {
		addon := GetAddOn(ua.AddOnID)
		enriched[i] = EnrichedAddOn{
			UserAddOn: ua,
		}
		if addon != nil {
			enriched[i].Name = addon.Name
			enriched[i].Description = addon.Description
		}
	}
	
	c.JSON(http.StatusOK, gin.H{"addons": enriched})
}

// PurchaseAddOn inicia compra de um add-on
// POST /addons/:id/purchase
func (h *AddOnHandler) PurchaseAddOn(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	addOnID := c.Param("id")
	
	// Verificar se add-on existe
	addon := GetAddOn(addOnID)
	if addon == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Add-on não encontrado"})
		return
	}
	
	if !addon.Active {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Add-on não disponível"})
		return
	}
	
	// Verificar se usuário já tem
	var existing UserAddOn
	if err := h.db.Where("user_id = ? AND addon_id = ? AND status = ?", userID, addOnID, "active").First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Você já possui este add-on"})
		return
	}
	
	// Verificar se plano permite
	planID := h.getUserPlanID(userID)
	allowed := false
	for _, reqPlan := range addon.RequiresPlan {
		if reqPlan == planID {
			allowed = true
			break
		}
	}
	if !allowed {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Seu plano não permite este add-on",
			"required_plans": addon.RequiresPlan,
		})
		return
	}
	
	// Por agora, criar add-on diretamente (sem Stripe)
	// TODO: Integrar com Stripe checkout para add-ons
	now := time.Now()
	userAddOn := UserAddOn{
		ID:        uuid.New(),
		UserID:    userID,
		AddOnID:   addOnID,
		Status:    "active",
		StartedAt: now,
		ExpiresAt: now.AddDate(0, 1, 0), // +1 mês
		CreatedAt: now,
		UpdatedAt: now,
	}
	
	if err := h.db.Create(&userAddOn).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao ativar add-on"})
		return
	}
	
	c.JSON(http.StatusCreated, gin.H{
		"message": "Add-on ativado com sucesso",
		"addon":   userAddOn,
		"note":    "Integração com pagamento será adicionada em breve",
	})
}

// CancelAddOn cancela um add-on
// DELETE /addons/:id
func (h *AddOnHandler) CancelAddOn(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	addOnID := c.Param("id")
	
	var userAddOn UserAddOn
	if err := h.db.Where("user_id = ? AND addon_id = ? AND status = ?", userID, addOnID, "active").First(&userAddOn).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Add-on não encontrado ou já cancelado"})
		return
	}
	
	now := time.Now()
	userAddOn.Status = "canceled"
	userAddOn.CanceledAt = now
	userAddOn.UpdatedAt = now
	
	if err := h.db.Save(&userAddOn).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao cancelar add-on"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Add-on cancelado",
		"addon":   userAddOn,
	})
}

// GetEffectiveEntitlements retorna capabilities efetivas (plano + add-ons)
// GET /entitlements/effective
func (h *AddOnHandler) GetEffectiveEntitlements(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	
	// Buscar plano base
	planID := h.getUserPlanID(userID)
	basePlan := GetPlan(planID)
	
	// Resolver entitlements efetivos
	entitlements := h.resolver.ResolveEntitlements(userID, basePlan)
	
	// Converter capabilities para strings
	caps := make([]string, len(entitlements.Capabilities))
	for i, cap := range entitlements.Capabilities {
		caps[i] = string(cap)
	}
	
	c.JSON(http.StatusOK, gin.H{
		"plan_id":       entitlements.PlanID,
		"plan_name":     entitlements.PlanName,
		"capabilities":  caps,
		"limits":        entitlements.Limits,
		"active_addons": entitlements.ActiveAddOns,
	})
}

// Helper: busca plano do usuário
func (h *AddOnHandler) getUserPlanID(userID uuid.UUID) string {
	// Buscar billing account
	var account struct {
		AccountID uuid.UUID `gorm:"column:account_id"`
	}
	if err := h.db.Table("billing_accounts").
		Select("account_id").
		Where("user_id = ?", userID).
		First(&account).Error; err != nil {
		return "free"
	}

	// Buscar subscription
	var subscription struct {
		PlanID string `gorm:"column:plan_id"`
		Status string `gorm:"column:status"`
	}
	if err := h.db.Table("subscriptions").
		Select("plan_id, status").
		Where("account_id = ? AND status IN (?)", account.AccountID, []string{"active", "trialing"}).
		Order("created_at DESC").
		First(&subscription).Error; err != nil {
		return "free"
	}

	return subscription.PlanID
}

// RegisterAddOnRoutes registra rotas de add-ons
func RegisterAddOnRoutes(router *gin.RouterGroup, db *gorm.DB, authMiddleware gin.HandlerFunc) {
	handler := NewAddOnHandler(db)

	addons := router.Group("/addons")
	addons.Use(authMiddleware)
	{
		addons.GET("", handler.ListAddOns)
		addons.GET("/mine", handler.GetMyAddOns)
		addons.POST("/:id/purchase", handler.PurchaseAddOn)
		addons.DELETE("/:id", handler.CancelAddOn)
	}
	
	// Entitlements efetivos (plano + add-ons)
	router.GET("/entitlements/effective", authMiddleware, handler.GetEffectiveEntitlements)
}
