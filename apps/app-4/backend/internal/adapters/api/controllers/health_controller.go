package controllers

import (
	"net/http"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// HealthController handles health check endpoints
type HealthController struct {
	db        *gorm.DB
	startTime time.Time
}

// NewHealthController creates a new health controller
func NewHealthController(db *gorm.DB) *HealthController {
	return &HealthController{
		db:        db,
		startTime: time.Now(),
	}
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Uptime    string            `json:"uptime"`
	Version   string            `json:"version"`
	Services  map[string]string `json:"services"`
	System    SystemInfo        `json:"system"`
}

// SystemInfo contains system information
type SystemInfo struct {
	GoVersion    string `json:"goVersion"`
	NumCPU       int    `json:"numCPU"`
	NumGoroutine int    `json:"numGoroutine"`
	MemoryAlloc  string `json:"memoryAlloc"`
}

// Health returns the health status of the API
func (h *HealthController) Health(c *gin.Context) {
	services := make(map[string]string)

	// Check database connection
	sqlDB, err := h.db.DB()
	if err != nil {
		services["database"] = "unhealthy"
	} else if err := sqlDB.Ping(); err != nil {
		services["database"] = "unhealthy"
	} else {
		services["database"] = "healthy"
	}

	// Get memory stats
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	status := "healthy"
	for _, v := range services {
		if v != "healthy" {
			status = "degraded"
			break
		}
	}

	response := HealthResponse{
		Status:    status,
		Timestamp: time.Now().Format(time.RFC3339),
		Uptime:    time.Since(h.startTime).String(),
		Version:   "1.0.0",
		Services:  services,
		System: SystemInfo{
			GoVersion:    runtime.Version(),
			NumCPU:       runtime.NumCPU(),
			NumGoroutine: runtime.NumGoroutine(),
			MemoryAlloc:  formatBytes(m.Alloc),
		},
	}

	statusCode := http.StatusOK
	if status != "healthy" {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, response)
}

// Ready returns if the service is ready to accept requests
func (h *HealthController) Ready(c *gin.Context) {
	sqlDB, err := h.db.DB()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"reason": "database connection error",
		})
		return
	}

	if err := sqlDB.Ping(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"reason": "database ping failed",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "ready",
	})
}

// Live returns if the service is alive
func (h *HealthController) Live(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "alive",
	})
}

func formatBytes(b uint64) string {
	const unit = 1024
	if b < unit {
		return string(rune(b)) + " B"
	}
	div, exp := uint64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return string(rune(b/div)) + " " + string("KMGTPE"[exp]) + "iB"
}
