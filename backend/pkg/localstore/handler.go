package localstore

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RegisterLocalStoreRoutes registra rotas de monitoramento do LocalStore
func RegisterLocalStoreRoutes(r *gin.RouterGroup, authMiddleware, adminMiddleware gin.HandlerFunc) {
	localstore := r.Group("/localstore")
	localstore.Use(authMiddleware, adminMiddleware)
	{
		localstore.GET("/stats", handleStats)
		localstore.POST("/cleanup", handleCleanup)
		localstore.POST("/sync", handleForceSync)
	}
}

// handleStats retorna estatísticas do LocalStore
func handleStats(c *gin.Context) {
	store := GetGlobalStore()
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "LocalStore não inicializado",
			"enabled": false,
		})
		return
	}

	stats, err := store.Stats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"enabled":   true,
		"pending":   stats.Pending,
		"syncing":   stats.Syncing,
		"confirmed": stats.Confirmed,
		"failed":    stats.Failed,
		"total":     stats.Total,
		"health": gin.H{
			"sync_lag":    stats.Pending + stats.Syncing,
			"error_rate":  float64(stats.Failed) / float64(max(stats.Total, 1)) * 100,
			"status":      getSyncHealthStatus(stats),
		},
	})
}

// handleCleanup remove eventos confirmados antigos
func handleCleanup(c *gin.Context) {
	store := GetGlobalStore()
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "LocalStore não inicializado"})
		return
	}

	// Cleanup eventos confirmados há mais de 24h
	deleted, err := store.Cleanup(c.Request.Context(), 24*60*60*1000000000) // 24h em nanosegundos
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"deleted": deleted,
		"message": "Cleanup concluído",
	})
}

// handleForceSync força uma sincronização imediata
func handleForceSync(c *gin.Context) {
	store := GetGlobalStore()
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "LocalStore não inicializado"})
		return
	}

	// Forçar sync
	store.syncBatch()

	// Retornar stats atualizadas
	stats, _ := store.Stats(c.Request.Context())

	c.JSON(http.StatusOK, gin.H{
		"message":   "Sync forçado executado",
		"pending":   stats.Pending,
		"confirmed": stats.Confirmed,
	})
}

// getSyncHealthStatus retorna status de saúde do sync
func getSyncHealthStatus(stats Stats) string {
	if stats.Failed > 100 {
		return "critical"
	}
	if stats.Pending > 1000 {
		return "warning"
	}
	if stats.Pending > 100 {
		return "degraded"
	}
	return "healthy"
}

func max(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}
