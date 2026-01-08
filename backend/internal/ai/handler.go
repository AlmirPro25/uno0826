
package ai

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RegisterAIRoutes configura as rotas relacionadas à governança por IA.
func RegisterAIRoutes(rg *gin.RouterGroup, service *AIService, authMiddleware gin.HandlerFunc) {
	aiRoutes := rg.Group("/ai")
	aiRoutes.Use(authMiddleware) // Todas as rotas de IA requerem autenticação
	{
		aiRoutes.POST("/schema/evolve", evolveSchema(service))
		aiRoutes.GET("/schema/migrations/:migrationId", getMigration(service))
		aiRoutes.POST("/conflicts/resolve", resolveConflict(service))
	}
}

// evolveSchema godoc
// @Summary Enviar intenção para IA evoluir o schema
// @Description Envia uma intenção para o módulo de IA para que ele proponha uma evolução no schema do SQLite.
// @Tags AI Governance
// @Accept json
// @Produce json
// @Param intention body EvolveSchemaRequest true "Intenção de evolução do schema"
// @Success 200 {object} EvolveSchemaResponse
// @Failure 400 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Security BearerAuth
// @Router /ai/schema/evolve [post]
func evolveSchema(service *AIService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req EvolveSchemaRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida: " + err.Error()})
			return
		}

		migration, err := service.EvolveSchema(req.Intention, req.Context)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao evoluir schema: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, EvolveSchemaResponse{
			MigrationID: migration.ID.String(),
			SchemaVersion: migration.Version,
			Status: "pending_review",
			ProposedSQL: migration.MigrationSQL,
		})
	}
}

// getMigration godoc
// @Summary Consultar detalhes de uma migração proposta pela IA
// @Description Retorna os detalhes de uma migração de schema proposta anteriormente pela IA.
// @Tags AI Governance
// @Produce json
// @Param migrationId path string true "ID da Migração"
// @Success 200 {object} AISchemaVersion
// @Failure 404 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Security BearerAuth
// @Router /ai/schema/migrations/{migrationId} [get]
func getMigration(service *AIService) gin.HandlerFunc {
	return func(c *gin.Context) {
		migrationIDStr := c.Param("migrationId")
		migrationID, err := uuid.Parse(migrationIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID da migração inválido"})
			return
		}

		migration, err := service.GetMigrationByID(migrationID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Migração não encontrada"})
			return
		}

		c.JSON(http.StatusOK, migration)
	}
}

// resolveConflict godoc
// @Summary Acionar IA para resolver conflito de replicação
// @Description Aciona o módulo de IA para detectar e resolver conflitos de replicação baseados em uma política definida.
// @Tags AI Governance
// @Accept json
// @Produce json
// @Param conflict body ResolveConflictRequest true "Detalhes do conflito e política de resolução"
// @Success 200 {object} ResolveConflictResponse
// @Failure 400 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Security BearerAuth
// @Router /ai/conflicts/resolve [post]
func resolveConflict(service *AIService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req ResolveConflictRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida: " + err.Error()})
			return
		}

		// A lógica real de resolução de conflitos seria complexa e baseada em eventos
		// Aqui, simulamos uma resolução.
		resolved, newEvents, err := service.ResolveConflict(req.ConflictID, req.ResolutionPolicy)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao resolver conflito: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, ResolveConflictResponse{
			Status: "resolved",
			NewEvents: newEvents,
			Details: "Conflito " + req.ConflictID + " resolvido com sucesso. Novos eventos gerados: " + strconv.Itoa(resolved),
		})
	}
}

