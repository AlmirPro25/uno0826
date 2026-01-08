
package command

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"prost-qs/backend/pkg/middleware"
)

// RegisterCommandRoutes configura as rotas para envio de comandos ao kernel.
func RegisterCommandRoutes(rg *gin.RouterGroup, service *CommandService, authMiddleware gin.HandlerFunc) {
	commandRoutes := rg.Group("/commands")
	commandRoutes.Use(authMiddleware) // Todos os comandos requerem autenticação
	{
		commandRoutes.POST("/", sendCommand(service))
	}
}

// sendCommand godoc
// @Summary Enviar um comando genérico para o kernel
// @Description Envia um comando para o Prost-QS Core. O comando é validado e transformado em eventos.
// @Tags Comandos
// @Accept json
// @Produce json
// @Param command body CommandRequest true "Comando para o Kernel"
// @Success 200 {object} CommandResponse
// @Failure 400 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Security BearerAuth
// @Router /commands [post]
func sendCommand(service *CommandService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CommandRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida: " + err.Error()})
			return
		}

		// Obter UserID do contexto JWT
		userID, exists := c.Get(middleware.ContextUserIDKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
			return
		}
		req.Metadata["initiatorUserID"] = userID.(string)

		log.Printf("Comando recebido: Tipo=%s, Payload=%+v, Metadata=%+v", req.Type, req.Payload, req.Metadata)

		eventId, err := service.ExecuteCommand(&req)
		if err != nil {
			log.Printf("Erro ao executar comando: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao executar comando: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, CommandResponse{
			EventID: eventId.String(),
			Status:  "accepted",
			Message: "Comando processado e evento gerado.",
		})
	}
}

