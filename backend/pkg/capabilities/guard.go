package capabilities

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CapabilityGuard verifica se o usuário tem uma capacidade específica
// Usa o plano da assinatura para determinar capacidades
func CapabilityGuard(db *gorm.DB, required Capability) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.GetString("userID")
		if userIDStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
			c.Abort()
			return
		}

		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			c.Abort()
			return
		}

		// Buscar plano do usuário
		plan := getUserPlan(db, userID)
		
		// Verificar capacidade
		if !plan.HasCapability(required) {
			c.JSON(http.StatusForbidden, gin.H{
				"error":      "Capacidade não disponível",
				"message":    "Seu plano não inclui esta funcionalidade.",
				"code":       "CAPABILITY_REQUIRED",
				"capability": string(required),
				"plan":       plan.ID,
				"upgrade_to": suggestUpgrade(required),
			})
			c.Abort()
			return
		}

		// Adicionar plano ao contexto para uso posterior
		c.Set("userPlan", plan)
		c.Next()
	}
}

// LimitGuard verifica se o usuário pode criar mais recursos
func LimitGuard(db *gorm.DB, resourceType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.GetString("userID")
		if userIDStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
			c.Abort()
			return
		}

		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			c.Abort()
			return
		}

		plan := getUserPlan(db, userID)
		currentCount := countUserResources(db, userID, resourceType)

		if !plan.CanCreate(resourceType, currentCount) {
			limit := getLimit(plan, resourceType)
			c.JSON(http.StatusForbidden, gin.H{
				"error":         "Limite atingido",
				"message":       "Você atingiu o limite do seu plano para este recurso.",
				"code":          "LIMIT_REACHED",
				"resource_type": resourceType,
				"current":       currentCount,
				"limit":         limit,
				"plan":          plan.ID,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// getUserPlan busca o plano do usuário baseado na assinatura
func getUserPlan(db *gorm.DB, userID uuid.UUID) *Plan {
	// Buscar billing account
	var account struct {
		AccountID uuid.UUID `gorm:"column:account_id"`
	}
	if err := db.Table("billing_accounts").
		Select("account_id").
		Where("user_id = ?", userID).
		First(&account).Error; err != nil {
		return &PlanFree
	}

	// Buscar subscription ativa
	var subscription struct {
		PlanID string `gorm:"column:plan_id"`
		Status string `gorm:"column:status"`
	}
	if err := db.Table("subscriptions").
		Select("plan_id, status").
		Where("account_id = ? AND status IN ?", account.AccountID, []string{"active", "trialing"}).
		First(&subscription).Error; err != nil {
		return &PlanFree
	}

	return GetPlan(subscription.PlanID)
}

// countUserResources conta recursos do usuário
func countUserResources(db *gorm.DB, userID uuid.UUID, resourceType string) int {
	var count int64
	
	switch resourceType {
	case "app":
		db.Table("applications").Where("owner_id = ?", userID).Count(&count)
	case "credential":
		// Conta todas as credentials de todos os apps do usuário
		db.Table("app_credentials").
			Joins("JOIN applications ON applications.id = app_credentials.app_id").
			Where("applications.owner_id = ?", userID).
			Count(&count)
	}
	
	return int(count)
}

// getLimit retorna o limite do plano para um tipo de recurso
func getLimit(plan *Plan, resourceType string) int {
	switch resourceType {
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

// suggestUpgrade sugere qual plano fazer upgrade
func suggestUpgrade(cap Capability) string {
	if PlanPro.HasCapability(cap) {
		return "pro"
	}
	return "enterprise"
}

// GetUserCapabilities retorna todas as capacidades do usuário
func GetUserCapabilities(db *gorm.DB, userID uuid.UUID) []Capability {
	plan := getUserPlan(db, userID)
	return plan.Capabilities
}
