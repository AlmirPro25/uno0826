package usage

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UsageHandler struct {
	service *UsageService
}

func NewUsageHandler(service *UsageService) *UsageHandler {
	return &UsageHandler{service: service}
}

// RegisterUsageRoutes registra rotas de uso
func RegisterUsageRoutes(r *gin.RouterGroup, service *UsageService, authMiddleware gin.HandlerFunc) {
	h := NewUsageHandler(service)

	usage := r.Group("/usage")
	usage.Use(authMiddleware)
	{
		usage.GET("/apps/:app_id/current", h.GetCurrentUsage)
		usage.GET("/apps/:app_id/history", h.GetUsageHistory)
		usage.GET("/apps/:app_id/limits", h.CheckLimits)
	}
}

// GetCurrentUsage retorna uso do mês atual
func (h *UsageHandler) GetCurrentUsage(c *gin.Context) {
	appIDStr := c.Param("app_id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid app_id"})
		return
	}

	record, err := h.service.GetOrCreateCurrentPeriod(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, record)
}

// GetUsageHistory retorna histórico de uso
func (h *UsageHandler) GetUsageHistory(c *gin.Context) {
	appIDStr := c.Param("app_id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid app_id"})
		return
	}

	months := 6 // default
	records, err := h.service.GetUsageHistory(appID, months)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"records": records,
		"period":  time.Now().Format("2006-01"),
	})
}

// CheckLimits verifica limites do plano
func (h *UsageHandler) CheckLimits(c *gin.Context) {
	appIDStr := c.Param("app_id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid app_id"})
		return
	}

	planID := c.Query("plan")
	if planID == "" {
		planID = "free"
	}

	limits := GetLimit(planID)
	record, _ := h.service.GetOrCreateCurrentPeriod(appID)

	c.JSON(http.StatusOK, gin.H{
		"plan":   planID,
		"limits": limits,
		"usage": gin.H{
			"deploys":          record.DeployCount,
			"telemetry_events": record.TelemetryEvents,
			"webhook_calls":    record.WebhookCalls,
			"container_hours":  record.ContainerHours,
			"crashes":          record.CrashCount,
		},
		"within_limits": gin.H{
			"deploys": limits.MaxDeploysPerDay == -1 || record.DeployCount < limits.MaxDeploysPerDay,
		},
	})
}
