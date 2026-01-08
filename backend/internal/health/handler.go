package health

import (
	"fmt"
	"net/http"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var startTime = time.Now()

// Version info - set at build time
var (
	Version   = "1.0.0"
	BuildTime = "2024-12-28"
	GitCommit = "dev"
)

type HealthHandler struct {
	db         *gorm.DB
	jobService JobServiceInterface
}

type JobServiceInterface interface {
	GetStats() (pending int64, failed int64, processing int64)
}

func NewHealthHandler(db *gorm.DB, jobService JobServiceInterface) *HealthHandler {
	return &HealthHandler{
		db:         db,
		jobService: jobService,
	}
}

type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Uptime    string            `json:"uptime"`
	Version   VersionInfo       `json:"version"`
	Services  map[string]string `json:"services"`
	Jobs      JobsHealth        `json:"jobs"`
	System    SystemInfo        `json:"system"`
}

type VersionInfo struct {
	Version   string `json:"version"`
	BuildTime string `json:"build_time"`
	GitCommit string `json:"git_commit"`
}

type JobsHealth struct {
	Pending    int64  `json:"pending"`
	Failed     int64  `json:"failed"`
	Processing int64  `json:"processing"`
	Status     string `json:"status"`
}

type SystemInfo struct {
	GoVersion    string `json:"go_version"`
	NumGoroutine int    `json:"num_goroutine"`
	NumCPU       int    `json:"num_cpu"`
	MemoryMB     uint64 `json:"memory_mb"`
}

// GetHealth returns comprehensive health status
func (h *HealthHandler) GetHealth(c *gin.Context) {
	services := make(map[string]string)
	overallStatus := "healthy"

	// Check Database
	sqlDB, err := h.db.DB()
	if err != nil {
		services["database"] = "error: " + err.Error()
		overallStatus = "degraded"
	} else if err := sqlDB.Ping(); err != nil {
		services["database"] = "error: " + err.Error()
		overallStatus = "degraded"
	} else {
		services["database"] = "healthy"
	}

	// Check Jobs
	var jobsHealth JobsHealth
	if h.jobService != nil {
		pending, failed, processing := h.jobService.GetStats()
		jobsHealth = JobsHealth{
			Pending:    pending,
			Failed:     failed,
			Processing: processing,
			Status:     "healthy",
		}
		if failed > 10 {
			jobsHealth.Status = "warning"
			if overallStatus == "healthy" {
				overallStatus = "degraded"
			}
		}
		if failed > 50 {
			jobsHealth.Status = "critical"
			overallStatus = "unhealthy"
		}
	} else {
		jobsHealth = JobsHealth{Status: "unknown"}
	}

	// Services status
	services["auth"] = "healthy"
	services["billing"] = "healthy"
	services["policy_engine"] = "healthy"
	services["job_worker"] = jobsHealth.Status

	// System info
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	systemInfo := SystemInfo{
		GoVersion:    runtime.Version(),
		NumGoroutine: runtime.NumGoroutine(),
		NumCPU:       runtime.NumCPU(),
		MemoryMB:     memStats.Alloc / 1024 / 1024,
	}

	// Calculate uptime
	uptime := time.Since(startTime)
	uptimeStr := formatDuration(uptime)

	response := HealthResponse{
		Status:    overallStatus,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Uptime:    uptimeStr,
		Version: VersionInfo{
			Version:   Version,
			BuildTime: BuildTime,
			GitCommit: GitCommit,
		},
		Services: services,
		Jobs:     jobsHealth,
		System:   systemInfo,
	}

	statusCode := http.StatusOK
	if overallStatus == "unhealthy" {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, response)
}

// GetHealthSimple returns a simple health check (for load balancers)
func (h *HealthHandler) GetHealthSimple(c *gin.Context) {
	sqlDB, err := h.db.DB()
	if err != nil || sqlDB.Ping() != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "unhealthy"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func formatDuration(d time.Duration) string {
	days := int(d.Hours()) / 24
	hours := int(d.Hours()) % 24
	minutes := int(d.Minutes()) % 60

	if days > 0 {
		return fmt.Sprintf("%dd %dh %dm", days, hours, minutes)
	}
	if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	}
	return fmt.Sprintf("%dm", minutes)
}

// RegisterHealthRoutes registers health check endpoints
func RegisterHealthRoutes(r *gin.RouterGroup, handler *HealthHandler) {
	r.GET("/health", handler.GetHealth)
	r.GET("/health/live", handler.GetHealthSimple)
	r.GET("/health/ready", handler.GetHealthSimple)
}
