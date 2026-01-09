package capabilities

import (
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
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

// PurchaseAddOn inicia compra de um add-on via Stripe Checkout
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
	
	// Buscar billing account para o Stripe customer ID
	var billingAccount struct {
		AccountID        uuid.UUID `gorm:"column:account_id"`
		StripeCustomerID string    `gorm:"column:stripe_customer_id"`
	}
	if err := h.db.Table("billing_accounts").
		Select("account_id, stripe_customer_id").
		Where("user_id = ?", userID).
		First(&billingAccount).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Você precisa ter uma conta de billing primeiro",
			"hint":  "Crie uma conta de billing primeiro via POST /api/v1/billing/account",
		})
		return
	}
	
	// PRODUÇÃO: Se add-on tem Stripe Price ID, criar checkout session real
	if addon.StripePriceIDMonthly != "" {
		// URLs de sucesso e cancelamento
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "https://uno0826.vercel.app"
		}
		successURL := frontendURL + "/admin/success.html"
		cancelURL := frontendURL + "/admin/cancel.html"
		
		// Criar checkout session via Stripe
		checkoutURL, sessionID, err := createAddOnCheckoutSession(
			billingAccount.StripeCustomerID,
			userIDStr,
			addOnID,
			addon.StripePriceIDMonthly,
			successURL,
			cancelURL,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Erro ao criar checkout session",
				"details": err.Error(),
			})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"message":      "Checkout session criada",
			"checkout_url": checkoutURL,
			"session_id":   sessionID,
			"addon":        addon,
			"price_id":     addon.StripePriceIDMonthly,
			"mode":         "production",
		})
		return
	}
	
	// DESENVOLVIMENTO: Ativar diretamente apenas se ADDON_DEV_MODE=true
	devMode := os.Getenv("ADDON_DEV_MODE") == "true"
	if !devMode {
		c.JSON(http.StatusPaymentRequired, gin.H{
			"error":   "Pagamento necessário",
			"message": "Este add-on requer pagamento via Stripe",
			"addon":   addon,
			"price":   addon.PriceMonthly,
			"hint":    "Configure STRIPE_ADDON_PRICE_IDS ou ADDON_DEV_MODE=true para testes",
		})
		return
	}
	
	// Modo dev: ativar diretamente
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
	
	// Registrar grant para auditoria
	h.logAddOnGrantWithMetadata(userID, addOnID, "dev_mode", "", map[string]interface{}{
		"dev_mode": true,
	})
	
	c.JSON(http.StatusCreated, gin.H{
		"message": "Add-on ativado (modo desenvolvimento)",
		"addon":   userAddOn,
		"grant": CapabilityGrant{
			Capability: addon.Capability,
			Source:     "addon",
			SourceID:   addon.ID,
			SourceName: addon.Name,
			ExpiresAt:  &userAddOn.ExpiresAt,
		},
		"mode":    "development",
		"warning": "Em produção, isso requer pagamento via Stripe",
	})
}

// createAddOnCheckoutSession cria checkout session para add-on via Stripe
func createAddOnCheckoutSession(customerID, userID, addOnID, priceID, successURL, cancelURL string) (string, string, error) {
	stripeKey := os.Getenv("STRIPE_SECRET_KEY")
	if stripeKey == "" {
		// Mock mode
		return "https://checkout.stripe.com/mock_addon_session", "cs_addon_mock_" + userID, nil
	}
	
	// Configurar Stripe
	stripe.Key = stripeKey
	
	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		PaymentMethodTypes: stripe.StringSlice([]string{"card"}), // Forçar cartão
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(successURL + "?session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:  stripe.String(cancelURL),
		// Metadata para identificar como add-on no webhook
		SubscriptionData: &stripe.CheckoutSessionSubscriptionDataParams{
			Metadata: map[string]string{
				"grant_type": "addon",
				"user_id":    userID,
				"addon_id":   addOnID,
			},
		},
	}

	// Adicionar metadata na session também
	params.Metadata = map[string]string{
		"grant_type": "addon",
		"user_id":    userID,
		"addon_id":   addOnID,
	}

	// Se tiver customer ID real do Stripe (não mock), usar
	// Customer IDs reais começam com "cus_" mas NÃO com "cus_mock_"
	isRealCustomer := customerID != "" && 
		len(customerID) > 4 && 
		customerID[:4] == "cus_" && 
		(len(customerID) < 9 || customerID[:9] != "cus_mock_")
	
	if isRealCustomer {
		params.Customer = stripe.String(customerID)
	}
	// Se não tiver customer real, Stripe vai pedir email no checkout

	sess, err := session.New(params)
	if err != nil {
		return "", "", err
	}

	return sess.URL, sess.ID, nil
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
	
	// Resolver entitlements efetivos (agora com grants detalhados)
	entitlements := h.resolver.ResolveEntitlements(userID, basePlan)
	
	c.JSON(http.StatusOK, entitlements)
}

// ExplainCapability explica de onde vem uma capability específica
// GET /capabilities/:capability/explain
func (h *AddOnHandler) ExplainCapability(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	capName := c.Param("capability")
	cap := Capability(capName)
	
	// Buscar plano base
	planID := h.getUserPlanID(userID)
	basePlan := GetPlan(planID)
	
	// Buscar grant específico
	grant := h.resolver.GetCapabilityGrant(userID, basePlan, cap)
	
	if grant == nil {
		c.JSON(http.StatusOK, gin.H{
			"capability": capName,
			"granted":    false,
			"reason":     "Capability não disponível no seu plano ou add-ons",
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"capability": capName,
		"granted":    true,
		"grant":      grant,
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
	
	// Explicar origem de uma capability (debug/suporte)
	router.GET("/capabilities/:capability/explain", authMiddleware, handler.ExplainCapability)
}

// RegisterAddOnAdminRoutes registra rotas admin de add-ons
func RegisterAddOnAdminRoutes(router *gin.RouterGroup, db *gorm.DB, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewAddOnHandler(db)

	admin := router.Group("/admin/addons")
	admin.Use(authMiddleware, adminMiddleware)
	{
		// Conceder trial de add-on
		admin.POST("/grant-trial", handler.GrantTrial)
		
		// Listar grants recentes
		admin.GET("/grants", handler.ListRecentGrants)
		
		// Revogar add-on de usuário
		admin.DELETE("/users/:userId/addons/:addonId", handler.AdminRevokeAddOn)
	}
}

// GrantTrial concede um trial de add-on para um usuário
// POST /admin/addons/grant-trial
func (h *AddOnHandler) GrantTrial(c *gin.Context) {
	var req struct {
		UserID   string `json:"user_id" binding:"required"`
		AddOnID  string `json:"addon_id" binding:"required"`
		Days     int    `json:"days" binding:"required,min=1,max=90"`
		Reason   string `json:"reason"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id inválido"})
		return
	}
	
	addon := GetAddOn(req.AddOnID)
	if addon == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Add-on não encontrado"})
		return
	}
	
	// Verificar se já tem ativo
	var existing UserAddOn
	if err := h.db.Where("user_id = ? AND addon_id = ? AND status = ?", userID, req.AddOnID, "active").First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Usuário já possui este add-on ativo"})
		return
	}
	
	now := time.Now()
	expiresAt := now.AddDate(0, 0, req.Days)
	
	userAddOn := UserAddOn{
		ID:        uuid.New(),
		UserID:    userID,
		AddOnID:   req.AddOnID,
		Status:    "active",
		StartedAt: now,
		ExpiresAt: expiresAt,
		CreatedAt: now,
		UpdatedAt: now,
	}
	
	if err := h.db.Create(&userAddOn).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar trial"})
		return
	}
	
	// Registrar grant
	adminID := c.GetString("userID")
	h.logAddOnGrantWithMetadata(userID, req.AddOnID, "trial", "", map[string]interface{}{
		"days":     req.Days,
		"reason":   req.Reason,
		"admin_id": adminID,
	})
	
	c.JSON(http.StatusCreated, gin.H{
		"message":    "Trial concedido com sucesso",
		"addon":      userAddOn,
		"expires_at": expiresAt,
		"grant": CapabilityGrant{
			Capability: addon.Capability,
			Source:     "trial",
			SourceID:   addon.ID,
			SourceName: addon.Name + " (Trial)",
			ExpiresAt:  &expiresAt,
		},
	})
}

// ListRecentGrants lista grants recentes
// GET /admin/addons/grants
func (h *AddOnHandler) ListRecentGrants(c *gin.Context) {
	var logs []AddOnGrantLog
	h.db.Order("created_at DESC").Limit(100).Find(&logs)
	c.JSON(http.StatusOK, gin.H{"grants": logs})
}

// AdminRevokeAddOn revoga add-on de um usuário (admin)
// DELETE /admin/addons/users/:userId/addons/:addonId
func (h *AddOnHandler) AdminRevokeAddOn(c *gin.Context) {
	userIDStr := c.Param("userId")
	addOnID := c.Param("addonId")
	
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id inválido"})
		return
	}
	
	var userAddOn UserAddOn
	if err := h.db.Where("user_id = ? AND addon_id = ? AND status = ?", userID, addOnID, "active").First(&userAddOn).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Add-on não encontrado ou já cancelado"})
		return
	}
	
	now := time.Now()
	userAddOn.Status = "revoked"
	userAddOn.CanceledAt = now
	userAddOn.UpdatedAt = now
	
	if err := h.db.Save(&userAddOn).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao revogar add-on"})
		return
	}
	
	// Registrar revogação
	adminID := c.GetString("userID")
	h.logAddOnGrantWithMetadata(userID, addOnID, "admin_revoke", "", map[string]interface{}{
		"admin_id": adminID,
	})
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Add-on revogado",
		"addon":   userAddOn,
	})
}

// logAddOnGrantWithMetadata registra grant com metadata
func (h *AddOnHandler) logAddOnGrantWithMetadata(userID uuid.UUID, addOnID, trigger, stripeEventID string, metadata map[string]interface{}) {
	metadataJSON := ""
	if metadata != nil {
		if data, err := json.Marshal(metadata); err == nil {
			metadataJSON = string(data)
		}
	}
	
	log := AddOnGrantLog{
		ID:            uuid.New(),
		UserID:        userID,
		AddOnID:       addOnID,
		Trigger:       trigger,
		StripeEventID: stripeEventID,
		Metadata:      metadataJSON,
		CreatedAt:     time.Now(),
	}
	h.db.Create(&log)
}
