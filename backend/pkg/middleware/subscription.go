package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SubscriptionStatus representa o status da assinatura
type SubscriptionStatus string

const (
	SubActive   SubscriptionStatus = "active"
	SubTrialing SubscriptionStatus = "trialing"
	SubPastDue  SubscriptionStatus = "past_due"
	SubCanceled SubscriptionStatus = "canceled"
)

// SubscriptionInfo informações da assinatura no contexto
type SubscriptionInfo struct {
	HasSubscription bool
	Status          string
	PlanID          string
	AccountID       string
}

const ContextSubscriptionKey = "subscription"

// SubscriptionGuard verifica se o usuário tem assinatura ativa
// Retorna 402 Payment Required se não tiver
// Estados válidos: active, trialing
// Estados bloqueados: past_due, canceled, expired, none
// BYPASS: admin e super_admin não precisam de assinatura
func SubscriptionGuard(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Bypass para admins - eles não precisam de assinatura
		role := c.GetString("userRole")
		if role == "admin" || role == "super_admin" {
			c.Next()
			return
		}

		// Usa a mesma key do AuthMiddleware
		userIDStr := c.GetString("userID")
		if userIDStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
			c.Abort()
			return
		}

		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuário inválido"})
			c.Abort()
			return
		}

		// Buscar billing account do usuário
		var account struct {
			AccountID uuid.UUID `gorm:"column:account_id"`
		}
		if err := db.Table("billing_accounts").
			Select("account_id").
			Where("user_id = ?", userID).
			First(&account).Error; err != nil {
			// Sem conta de billing = sem assinatura
			c.JSON(http.StatusPaymentRequired, gin.H{
				"error":   "Assinatura necessária",
				"message": "Você precisa de uma assinatura ativa para acessar este recurso.",
				"code":    "SUBSCRIPTION_REQUIRED",
				"status":  "none",
			})
			c.Abort()
			return
		}

		// Buscar subscription (qualquer status para dar feedback correto)
		var subscription struct {
			Status string `gorm:"column:status"`
			PlanID string `gorm:"column:plan_id"`
		}
		err = db.Table("subscriptions").
			Select("status, plan_id").
			Where("account_id = ?", account.AccountID).
			Order("created_at DESC").
			First(&subscription).Error

		if err != nil {
			// Sem subscription
			c.JSON(http.StatusPaymentRequired, gin.H{
				"error":   "Assinatura necessária",
				"message": "Você precisa de uma assinatura ativa para acessar este recurso.",
				"code":    "SUBSCRIPTION_REQUIRED",
				"status":  "none",
			})
			c.Abort()
			return
		}

		// Verificar status da subscription
		switch subscription.Status {
		case "active", "trialing":
			// OK - continua
			info := SubscriptionInfo{
				HasSubscription: true,
				Status:          subscription.Status,
				PlanID:          subscription.PlanID,
				AccountID:       account.AccountID.String(),
			}
			c.Set(ContextSubscriptionKey, info)
			c.Next()
			return

		case "past_due":
			c.JSON(http.StatusPaymentRequired, gin.H{
				"error":   "Pagamento pendente",
				"message": "Sua assinatura está com pagamento pendente. Atualize seu método de pagamento.",
				"code":    "PAYMENT_PAST_DUE",
				"status":  "past_due",
			})
			c.Abort()
			return

		case "canceled":
			c.JSON(http.StatusPaymentRequired, gin.H{
				"error":   "Assinatura cancelada",
				"message": "Sua assinatura foi cancelada. Reative para continuar usando.",
				"code":    "SUBSCRIPTION_CANCELED",
				"status":  "canceled",
			})
			c.Abort()
			return

		case "expired":
			c.JSON(http.StatusPaymentRequired, gin.H{
				"error":   "Assinatura expirada",
				"message": "Sua assinatura expirou. Renove para continuar usando.",
				"code":    "SUBSCRIPTION_EXPIRED",
				"status":  "expired",
			})
			c.Abort()
			return

		default:
			// Status desconhecido - bloqueia por segurança
			c.JSON(http.StatusPaymentRequired, gin.H{
				"error":   "Assinatura inválida",
				"message": "Status de assinatura não reconhecido. Entre em contato com o suporte.",
				"code":    "SUBSCRIPTION_INVALID",
				"status":  subscription.Status,
			})
			c.Abort()
			return
		}
	}
}

// OptionalSubscription verifica assinatura mas não bloqueia
// Útil para endpoints que funcionam diferente com/sem assinatura
func OptionalSubscription(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.GetString("userID")
		if userIDStr == "" {
			c.Next()
			return
		}

		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			c.Next()
			return
		}

		// Buscar billing account
		var account struct {
			AccountID uuid.UUID `gorm:"column:account_id"`
		}
		if err := db.Table("billing_accounts").
			Select("account_id").
			Where("user_id = ?", userID).
			First(&account).Error; err != nil {
			// Sem conta - continua sem subscription info
			c.Set(ContextSubscriptionKey, SubscriptionInfo{HasSubscription: false})
			c.Next()
			return
		}

		// Buscar subscription
		var subscription struct {
			Status string `gorm:"column:status"`
			PlanID string `gorm:"column:plan_id"`
		}
		err = db.Table("subscriptions").
			Select("status, plan_id").
			Where("account_id = ? AND status IN ?", account.AccountID, []string{"active", "trialing"}).
			First(&subscription).Error

		if err != nil {
			c.Set(ContextSubscriptionKey, SubscriptionInfo{HasSubscription: false})
			c.Next()
			return
		}

		// Tem subscription
		info := SubscriptionInfo{
			HasSubscription: true,
			Status:          subscription.Status,
			PlanID:          subscription.PlanID,
			AccountID:       account.AccountID.String(),
		}
		c.Set(ContextSubscriptionKey, info)

		c.Next()
	}
}

// GetSubscriptionInfo helper para extrair info do contexto
func GetSubscriptionInfo(c *gin.Context) SubscriptionInfo {
	if info, exists := c.Get(ContextSubscriptionKey); exists {
		if subInfo, ok := info.(SubscriptionInfo); ok {
			return subInfo
		}
	}
	return SubscriptionInfo{HasSubscription: false}
}
