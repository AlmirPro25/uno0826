package middleware

import (
	"net/http"
	"prost-qs/backend/pkg/tenancy"

	"github.com/gin-gonic/gin"
)

// TenantAuthMiddleware handles authentication for multi-tenant requests
type TenantAuthMiddleware struct {
	manager *tenancy.TenantManager
}

// NewTenantAuthMiddleware creates a new tenant authentication middleware
func NewTenantAuthMiddleware(manager *tenancy.TenantManager) *TenantAuthMiddleware {
	return &TenantAuthMiddleware{manager: manager}
}

// Authenticate verifies the X-API-Key header and injects tenant context
func (m *TenantAuthMiddleware) Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "X-API-Key header is required"})
			c.Abort()
			return
		}

		tenant, err := m.manager.GetTenantByAPIKey(c.Request.Context(), apiKey)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired API key"})
			c.Abort()
			return
		}

		// Check if tenant is active
		if tenant.Status != tenancy.TenantStatusActive {
			c.JSON(http.StatusForbidden, gin.H{"error": "Tenant account is not active"})
			c.Abort()
			return
		}

		// Inject tenant metadata into context for downstream handlers
		c.Set("tenant_id", tenant.ID)
		c.Set("tenant_domain", tenant.Domain)
		c.Set("tenant_tier", tenant.PlanTier)

		c.Next()
	}
}
