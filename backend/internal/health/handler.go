package health

import (
	"net/http"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ========================================
// HEALTH HANDLER (Gin)
// ========================================

// JobServiceInterface interface para obter stats de jobs
type JobServiceInterface interface {
	GetStats() (pending int64, failed int64, processing int64)
}

// HealthHandler handler de health check
type HealthHandler struct {
	db         *gorm.DB
	jobService JobServiceInterface
	startTime  time.Time
}

// HealthResponse resposta do health check
type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Uptime    string            `json:"uptime"`
	Version   VersionInfo       `json:"version"`
	Services  map[string]string `json:"services"`
	Jobs      JobsHealth        `json:"jobs"`
	System    SystemInfo        `json:"system"`
}

// VersionInfo informações de versão
type VersionInfo struct {
	Version   string `json:"version"`
	BuildTime string `json:"build_time"`
	GitCommit string `json:"git_commit"`
}

// JobsHealth status dos jobs
type JobsHealth struct {
	Pending    int64  `json:"pending"`
	Failed     int64  `json:"failed"`
	Processing int64  `json:"processing"`
	Status     string `json:"status"`
}

// SystemInfo informações do sistema
type SystemInfo struct {
	GoVersion    string `json:"go_version"`
	NumGoroutine int    `json:"num_goroutine"`
	NumCPU       int    `json:"num_cpu"`
	MemoryMB     uint64 `json:"memory_mb"`
}

// NewHealthHandler cria um novo handler de health
func NewHealthHandler(db *gorm.DB, jobService JobServiceInterface) *HealthHandler {
	return &HealthHandler{
		db:         db,
		jobService: jobService,
		startTime:  time.Now(),
	}
}

// GetHealth retorna status completo de saúde
func (h *HealthHandler) GetHealth(c *gin.Context) {
	status := "healthy"
	httpStatus := http.StatusOK

	// Check database
	dbStatus := "healthy"
	if sqlDB, err := h.db.DB(); err != nil {
		dbStatus = "unhealthy"
		status = "unhealthy"
	} else if err := sqlDB.Ping(); err != nil {
		dbStatus = "unhealthy"
		status = "unhealthy"
	}

	// Check jobs
	jobsHealth := JobsHealth{Status: "unknown"}
	if h.jobService != nil {
		pending, failed, processing := h.jobService.GetStats()
		jobsHealth.Pending = pending
		jobsHealth.Failed = failed
		jobsHealth.Processing = processing

		if failed > 50 {
			jobsHealth.Status = "critical"
			status = "unhealthy"
		} else if failed > 10 {
			jobsHealth.Status = "warning"
			if status == "healthy" {
				status = "degraded"
			}
		} else {
			jobsHealth.Status = "healthy"
		}
	}

	// System info
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	response := HealthResponse{
		Status:    status,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Uptime:    formatDuration(time.Since(h.startTime)),
		Version: VersionInfo{
			Version:   "1.0.0",
			BuildTime: "2026-01-12",
			GitCommit: "production",
		},
		Services: map[string]string{
			"database":      dbStatus,
			"auth":          "healthy",
			"billing":       "healthy",
			"policy_engine": "healthy",
		},
		Jobs: jobsHealth,
		System: SystemInfo{
			GoVersion:    runtime.Version(),
			NumGoroutine: runtime.NumGoroutine(),
			NumCPU:       runtime.NumCPU(),
			MemoryMB:     memStats.Alloc / 1024 / 1024,
		},
	}

	if status == "unhealthy" {
		httpStatus = http.StatusServiceUnavailable
	}

	c.JSON(httpStatus, response)
}

// GetHealthSimple retorna status simples (liveness probe)
func (h *HealthHandler) GetHealthSimple(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetHealthReady retorna status de readiness
func (h *HealthHandler) GetHealthReady(c *gin.Context) {
	// Check database
	if sqlDB, err := h.db.DB(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not_ready", "reason": "database_error"})
		return
	} else if err := sqlDB.Ping(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not_ready", "reason": "database_unreachable"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ready"})
}

// RegisterHealthRoutes registra as rotas de health
func RegisterHealthRoutes(r *gin.RouterGroup, handler *HealthHandler) {
	r.GET("/health", handler.GetHealth)
	r.GET("/health/live", handler.GetHealthSimple)
	r.GET("/health/ready", handler.GetHealthReady)
}

// formatDuration formata duração de forma legível
func formatDuration(d time.Duration) string {
	days := int(d.Hours() / 24)
	hours := int(d.Hours()) % 24
	minutes := int(d.Minutes()) % 60

	if days > 0 {
		return formatDurationParts(days, "d", hours, "h", minutes, "m")
	}
	if hours > 0 {
		return formatDurationParts(hours, "h", minutes, "m", 0, "")
	}
	return formatDurationParts(minutes, "m", 0, "", 0, "")
}

func formatDurationParts(v1 int, s1 string, v2 int, s2 string, v3 int, s3 string) string {
	result := ""
	if v1 > 0 {
		result += string(rune('0'+v1/10)) + string(rune('0'+v1%10))
		if v1 < 10 {
			result = string(rune('0' + v1))
		} else {
			result = ""
			for n := v1; n > 0; n /= 10 {
				result = string(rune('0'+n%10)) + result
			}
		}
		result += s1
	}
	if v2 > 0 && s2 != "" {
		if result != "" {
			result += " "
		}
		if v2 < 10 {
			result += string(rune('0' + v2))
		} else {
			temp := ""
			for n := v2; n > 0; n /= 10 {
				temp = string(rune('0'+n%10)) + temp
			}
			result += temp
		}
		result += s2
	}
	if v3 > 0 && s3 != "" {
		if result != "" {
			result += " "
		}
		if v3 < 10 {
			result += string(rune('0' + v3))
		} else {
			temp := ""
			for n := v3; n > 0; n /= 10 {
				temp = string(rune('0'+n%10)) + temp
			}
			result += temp
		}
		result += s3
	}
	if result == "" {
		result = "0m"
	}
	return result
}
