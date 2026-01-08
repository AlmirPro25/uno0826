package identity

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"prost-qs/backend/pkg/capabilities"
)

// CapabilitiesHandler gerencia endpoints de capacidades
type CapabilitiesHandler struct {
	db *gorm.DB
}

// NewCapabilitiesHandler cria novo handler
func NewCapabilitiesHandler(db *gorm.DB) *CapabilitiesHandler {
	return &CapabilitiesHandler{db: db}
}

// EntitlementsResponse resposta do endpoint /me/entitlements
type EntitlementsResponse struct {
	Plan         PlanInfo           `json:"plan"`
	Capabilities []string           `json:"capabilities"`
	Limits       LimitsInfo         `json:"limits"`
	Usage        UsageInfo          `json:"usage"`
}

// PlanInfo informações do plano
type PlanInfo struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
}

// LimitsInfo limites do plano
type LimitsInfo struct {
	MaxApps        int `json:"max_apps"`
	MaxCredentials int `json:"max_credentials"`
	MaxAppUsers    int `json:"max_app_users"`
}

// UsageInfo uso atual
type UsageInfo struct {
	Apps        int `json:"apps"`
	Credentials int `json:"credentials"`
}

// GetEntitlements retorna capacidades e limites do usuário
// GET /me/entitlements
func (h *CapabilitiesHandler) GetEntitlements(c *gin.Context) {
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

	// Buscar plano e status
	plan, status := h.getUserPlanAndStatus(userID)
	
	// Converter capacidades para strings
	caps := make([]string, len(plan.Capabilities))
	for i, cap := range plan.Capabilities {
		caps[i] = string(cap)
	}

	// Contar uso atual
	appsCount := h.countResources(userID, "app")
	credsCount := h.countResources(userID, "credential")

	response := EntitlementsResponse{
		Plan: PlanInfo{
			ID:     plan.ID,
			Name:   plan.Name,
			Status: status,
		},
		Capabilities: caps,
		Limits: LimitsInfo{
			MaxApps:        plan.Limits.MaxApps,
			MaxCredentials: plan.Limits.MaxCredentials,
			MaxAppUsers:    plan.Limits.MaxAppUsers,
		},
		Usage: UsageInfo{
			Apps:        appsCount,
			Credentials: credsCount,
		},
	}

	c.JSON(http.StatusOK, response)
}

// CheckCapability verifica se usuário tem uma capacidade específica
// GET /me/capabilities/:capability
func (h *CapabilitiesHandler) CheckCapability(c *gin.Context) {
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

	capName := c.Param("capability")
	cap := capabilities.Capability(capName)

	plan, _ := h.getUserPlanAndStatus(userID)
	hasCapability := plan.HasCapability(cap)

	c.JSON(http.StatusOK, gin.H{
		"capability": capName,
		"granted":    hasCapability,
		"plan":       plan.ID,
	})
}

// CheckLimit verifica se usuário pode criar mais de um recurso
// GET /me/limits/:resource
func (h *CapabilitiesHandler) CheckLimit(c *gin.Context) {
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

	resource := c.Param("resource")
	plan, _ := h.getUserPlanAndStatus(userID)
	current := h.countResources(userID, resource)
	limit := h.getLimit(plan, resource)
	canCreate := plan.CanCreate(resource, current)

	c.JSON(http.StatusOK, gin.H{
		"resource":   resource,
		"current":    current,
		"limit":      limit,
		"can_create": canCreate,
		"plan":       plan.ID,
	})
}

// getUserPlanAndStatus busca plano e status da assinatura
func (h *CapabilitiesHandler) getUserPlanAndStatus(userID uuid.UUID) (*capabilities.Plan, string) {
	// Buscar billing account
	var account struct {
		AccountID uuid.UUID `gorm:"column:account_id"`
	}
	if err := h.db.Table("billing_accounts").
		Select("account_id").
		Where("user_id = ?", userID).
		First(&account).Error; err != nil {
		return &capabilities.PlanFree, "none"
	}

	// Buscar subscription
	var subscription struct {
		PlanID string `gorm:"column:plan_id"`
		Status string `gorm:"column:status"`
	}
	if err := h.db.Table("subscriptions").
		Select("plan_id, status").
		Where("account_id = ?", account.AccountID).
		Order("created_at DESC").
		First(&subscription).Error; err != nil {
		return &capabilities.PlanFree, "none"
	}

	// Se não está ativo, retorna free com o status real
	if subscription.Status != "active" && subscription.Status != "trialing" {
		return &capabilities.PlanFree, subscription.Status
	}

	return capabilities.GetPlan(subscription.PlanID), subscription.Status
}

// countResources conta recursos do usuário
func (h *CapabilitiesHandler) countResources(userID uuid.UUID, resourceType string) int {
	var count int64
	
	switch resourceType {
	case "app":
		h.db.Table("applications").Where("owner_id = ?", userID).Count(&count)
	case "credential":
		h.db.Table("app_credentials").
			Joins("JOIN applications ON applications.id = app_credentials.app_id").
			Where("applications.owner_id = ?", userID).
			Count(&count)
	}
	
	return int(count)
}

// getLimit retorna limite do plano
func (h *CapabilitiesHandler) getLimit(plan *capabilities.Plan, resource string) int {
	switch resource {
	case "app":
		return plan.Limits.MaxApps
	case "credential":
		return plan.Limits.MaxCredentials
	case "app_user":
		return plan.Limits.MaxAppUsers
	default:
		return 0
	}
}

// RegisterCapabilitiesRoutes registra rotas de capacidades
func RegisterCapabilitiesRoutes(router *gin.RouterGroup, db *gorm.DB, authMiddleware gin.HandlerFunc) {
	handler := NewCapabilitiesHandler(db)

	me := router.Group("/me")
	me.Use(authMiddleware)
	{
		// Entitlements completos
		me.GET("/entitlements", handler.GetEntitlements)
		
		// Verificar capacidade específica
		me.GET("/capabilities/:capability", handler.CheckCapability)
		
		// Verificar limite específico
		me.GET("/limits/:resource", handler.CheckLimit)
	}
}
