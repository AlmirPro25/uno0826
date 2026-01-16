package performance

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"prost-qs/backend/pkg/cache"
	"prost-qs/backend/pkg/db"
)

// Handler provides performance monitoring endpoints
type Handler struct {
	db *gorm.DB
}

// NewHandler creates a new performance handler
func NewHandler(database *gorm.DB) *Handler {
	return &Handler{db: database}
}

// RegisterRoutes registers performance monitoring routes
func (h *Handler) RegisterRoutes(r *gin.RouterGroup, authMiddleware, adminMiddleware gin.HandlerFunc) {
	perf := r.Group("/performance")
	perf.Use(authMiddleware, adminMiddleware)
	{
		perf.GET("/stats", h.GetStats)
		perf.GET("/runtime", h.GetRuntimeStats)
		perf.GET("/cache", h.GetCacheStats)
		perf.GET("/db", h.GetDBStats)
		perf.POST("/gc", h.TriggerGC)
		perf.POST("/free-memory", h.FreeMemory)
	}
}

// GetStats returns all performance statistics
// @Summary Get all performance stats
// @Tags Performance
// @Success 200 {object} map[string]interface{}
// @Router /performance/stats [get]
func (h *Handler) GetStats(c *gin.Context) {
	runtimeStats := GetRuntimeStats()
	cacheStats := cache.GetCache().Stats()
	
	dbStats := map[string]interface{}{"error": "unavailable"}
	if h.db != nil {
		if stats, err := db.GetPoolStats(h.db); err == nil {
			dbStats = stats
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"runtime":         runtimeStats,
		"cache":           cacheStats,
		"database":        dbStats,
		"memory_pressure": GetMemoryPressure(),
		"ready":           IsReady(),
	})
}

// GetRuntimeStats returns Go runtime statistics
// @Summary Get Go runtime stats
// @Tags Performance
// @Success 200 {object} map[string]interface{}
// @Router /performance/runtime [get]
func (h *Handler) GetRuntimeStats(c *gin.Context) {
	c.JSON(http.StatusOK, GetRuntimeStats())
}

// GetCacheStats returns cache statistics
// @Summary Get cache stats
// @Tags Performance
// @Success 200 {object} map[string]interface{}
// @Router /performance/cache [get]
func (h *Handler) GetCacheStats(c *gin.Context) {
	c.JSON(http.StatusOK, cache.GetCache().Stats())
}

// GetDBStats returns database pool statistics
// @Summary Get database pool stats
// @Tags Performance
// @Success 200 {object} map[string]interface{}
// @Router /performance/db [get]
func (h *Handler) GetDBStats(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not available"})
		return
	}
	
	stats, err := db.GetPoolStats(h.db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, stats)
}

// TriggerGC triggers garbage collection
// @Summary Trigger garbage collection
// @Tags Performance
// @Success 200 {object} map[string]interface{}
// @Router /performance/gc [post]
func (h *Handler) TriggerGC(c *gin.Context) {
	before := GetRuntimeStats()
	ForceGC()
	after := GetRuntimeStats()
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Garbage collection triggered",
		"before":  before,
		"after":   after,
	})
}

// FreeMemory returns memory to the OS
// @Summary Free memory to OS
// @Tags Performance
// @Success 200 {object} map[string]interface{}
// @Router /performance/free-memory [post]
func (h *Handler) FreeMemory(c *gin.Context) {
	before := GetRuntimeStats()
	FreeOSMemory()
	after := GetRuntimeStats()
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Memory freed to OS",
		"before":  before,
		"after":   after,
	})
}

// ========================================
// HEALTH CHECK INTEGRATION
// ========================================

// HealthCheck returns a quick health status
func HealthCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		pressure := GetMemoryPressure()
		status := "healthy"
		httpStatus := http.StatusOK
		
		if pressure >= MemoryPressureHigh {
			status = "degraded"
		}
		if pressure == MemoryPressureCritical {
			status = "critical"
			httpStatus = http.StatusServiceUnavailable
		}
		
		c.JSON(httpStatus, gin.H{
			"status":          status,
			"memory_pressure": pressure,
			"ready":           IsReady(),
		})
	}
}
