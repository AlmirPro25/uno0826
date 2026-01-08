
package event

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RegisterEventRoutes configura as rotas relacionadas a eventos.
// Estas rotas são geralmente para fins de auditoria ou administração, não para consumo comum por frontends.
func RegisterEventRoutes(rg *gin.RouterGroup, service *EventService, authMiddleware gin.HandlerFunc) {
	eventRoutes := rg.Group("/events")
	eventRoutes.Use(authMiddleware) // Rotas de evento requerem autenticação
	{
		eventRoutes.GET("/:userId", getEventsByUser(service))
	}
}

// getEventsByUser godoc
// @Summary (Admin/Auditor) Recuperar histórico de eventos de um usuário
// @Description Retorna o histórico de eventos de um usuário específico, com paginação e filtro por tipo de evento.
// @Tags Eventos
// @Produce json
// @Param userId path string true "ID do Usuário"
// @Param limit query int false "Limite de eventos por página (default 10)" default(10)
// @Param offset query int false "Offset para paginação (default 0)" default(0)
// @Param eventType query string false "Filtrar por tipo de evento"
// @Success 200 {array} Event
// @Failure 400 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Security BearerAuth
// @Router /events/{userId} [get]
func getEventsByUser(service *EventService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.Param("userId")
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID do usuário inválido"})
			return
		}

		limitStr := c.DefaultQuery("limit", "10")
		offsetStr := c.DefaultQuery("offset", "0")
		eventType := c.Query("eventType")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Limite inválido"})
			return
		}
		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Offset inválido"})
			return
		}

		events, err := service.GetEventsByUserID(userID, limit, offset, eventType)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao buscar eventos: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, events)
	}
}

