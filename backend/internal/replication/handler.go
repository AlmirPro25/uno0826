package replication

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"prost-qs/backend/pkg/middleware"
)

// RegisterReplicationRoutes configura as rotas de replicação para comunicação entre nós do kernel.
func RegisterReplicationRoutes(rg *gin.RouterGroup, service *ReplicationService, authMiddleware gin.HandlerFunc) {
	replicationRoutes := rg.Group("/replication")
	replicationRoutes.Use(authMiddleware) // Rotas de replicação requerem autenticação (entre nós)
	{
		replicationRoutes.POST("/events", receiveEvents(service))
		replicationRoutes.GET("/events/since/:timestamp", requestEventsSince(service))
	}
}

// receiveEvents godoc
// @Summary Receber eventos de outro nó
// @Description Permite que outro nó do kernel envie uma lista de eventos para este nó.
// @Tags Replicação
// @Accept json
// @Produce json
// @Param events body []ReplicationEvent true "Lista de Eventos para Replicação"
// @Success 200 {object} ReceiveEventsResponse
// @Failure 400 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Security BearerAuth
// @Router /replication/events [post]
func receiveEvents(service *ReplicationService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req []ReplicationEvent
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida: " + err.Error()})
			return
		}

		receivedCount, conflictsResolved, err := service.ReceiveEvents(req)
		if err != nil {
			log.Printf("Erro ao receber eventos de replicação: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao processar eventos recebidos: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, ReceiveEventsResponse{
			Status:            "success",
			ReceivedEvents:    receivedCount,
			ConflictsResolved: conflictsResolved,
			Message:           "Eventos processados com sucesso.",
		})
	}
}

// requestEventsSince godoc
// @Summary Solicitar eventos a partir de um timestamp
// @Description Permite que outro nó do kernel solicite eventos deste nó a partir de um determinado timestamp lógico.
// @Tags Replicação
// @Produce json
// @Param timestamp path int true "Timestamp (Unix epoch ms) a partir do qual solicitar eventos"
// @Success 200 {array} ReplicationEvent
// @Failure 400 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Security BearerAuth
// @Router /replication/events/since/{timestamp} [get]
func requestEventsSince(service *ReplicationService) gin.HandlerFunc {
	return func(c *gin.Context) {
		timestampStr := c.Param("timestamp")
		timestamp, err := strconv.ParseInt(timestampStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Timestamp inválido"})
			return
		}

		// Obter o ID do nó que está fazendo a requisição (pelo token, se possível)
		requestingNodeID := "unknown_node"
		if nodeID, exists := c.Get(middleware.ContextUserIDKey); exists { // Reutiliza ContextUserIDKey
			requestingNodeID = nodeID.(string)
		}

		events, err := service.GetEventsSince(timestamp, requestingNodeID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao buscar eventos para replicação: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, events)
	}
}
