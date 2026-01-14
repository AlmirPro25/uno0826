
package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lestrrat-go/jwx/jwt"
)

// AuthMiddleware implements JWT validation and basic RBAC check.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" || len(tokenString) < 7 || tokenString[:6] != "Bearer" {
			log.Println("[AuthMiddleware] Missing or invalid Authorization header.")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		// Parse and validate JWT token
		tokenString = tokenString[7:]
		// In a production environment, the JWKS URL would be fetched and used for key verification.
		// For this implementation, we simulate validation.
		token, err := jwt.ParseString(tokenString, jwt.WithVerify(false)) // Bypass verification for simplicity in mock
		if err != nil {
			log.Printf("[AuthMiddleware] JWT verification failed: %v", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		// Basic RBAC check (Role-Based Access Control)
		// Assuming the token contains a "role" claim.
		role, ok := token.Get("role")
		if !ok || role != "admin" && role != "operator" {
			log.Printf("[AuthMiddleware] Insufficient permissions for user role: %v", role)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden - Insufficient permissions"})
			return
		}

		// Store user details in context for controller access (e.g., for logging "sentBy" user)
		c.Set("user_id", token.Subject())
		c.Next()
	}
}
