
package identity

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"prost-qs/backend/pkg/middleware"
)

// RegisterIdentityRoutes configura as rotas relacionadas à identidade do usuário.
func RegisterIdentityRoutes(rg *gin.RouterGroup, service *IdentityService, authMiddleware gin.HandlerFunc) {
	identityRoutes := rg.Group("/identity")
	identityRoutes.Use(authMiddleware)
	{
		identityRoutes.GET("/me", getMyProfile(service))
		identityRoutes.GET("/applications", getUserApplications(service))
	}
}

// getMyProfile retorna o perfil do usuário autenticado
func getMyProfile(service *IdentityService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr, exists := c.Get(middleware.ContextUserIDKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
			return
		}

		userID, err := uuid.Parse(userIDStr.(string))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ID de usuário inválido"})
			return
		}

		// Tentar buscar no novo modelo User
		user, err := service.GetUserByIDNew(userID)
		if err == nil && user != nil {
			c.JSON(http.StatusOK, user)
			return
		}

		// Fallback para SovereignIdentity (legacy)
		identity, err := service.GetSovereignIdentity(userID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"id":            identity.UserID.String(),
			"primary_phone": identity.PrimaryPhone,
			"source":        identity.Source,
			"created_at":    identity.CreatedAt,
		})
	}
}

// getUserApplications retorna aplicações acessíveis
func getUserApplications(service *IdentityService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr, exists := c.Get(middleware.ContextUserIDKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
			return
		}

		userID, err := uuid.Parse(userIDStr.(string))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ID inválido"})
			return
		}

		apps, err := service.GetUserApplications(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao buscar aplicações"})
			return
		}

		c.JSON(http.StatusOK, apps)
	}
}

