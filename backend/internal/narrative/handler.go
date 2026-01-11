package narrative

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NarrativeHandler struct {
	service *NarrativeService
}

func NewNarrativeHandler(service *NarrativeService) *NarrativeHandler {
	return &NarrativeHandler{service: service}
}

// RegisterNarrativeRoutes registra rotas de narrativas
func RegisterNarrativeRoutes(r *gin.RouterGroup, service *NarrativeService, authMiddleware gin.HandlerFunc) {
	h := NewNarrativeHandler(service)

	narratives := r.Group("/narratives")
	narratives.Use(authMiddleware)
	{
		narratives.GET("", h.List)
		narratives.GET("/open", h.ListOpen)
		narratives.GET("/stats", h.Stats)
		narratives.POST("/:id/acknowledge", h.Acknowledge)
		narratives.POST("/:id/resolve", h.Resolve)
	}
}

// List retorna narrativas do app
func (h *NarrativeHandler) List(c *gin.Context) {
	appIDStr := c.Query("app_id")
	if appIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id required"})
		return
	}

	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid app_id"})
		return
	}

	narratives, err := h.service.GetByApp(appID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"narratives": narratives})
}

// ListOpen retorna narrativas abertas
func (h *NarrativeHandler) ListOpen(c *gin.Context) {
	appIDStr := c.Query("app_id")
	if appIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id required"})
		return
	}

	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid app_id"})
		return
	}

	narratives, err := h.service.GetOpen(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"narratives": narratives})
}

// Stats retorna estatísticas
func (h *NarrativeHandler) Stats(c *gin.Context) {
	appIDStr := c.Query("app_id")
	if appIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id required"})
		return
	}

	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid app_id"})
		return
	}

	stats, err := h.service.GetStats(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// Acknowledge marca como reconhecida
func (h *NarrativeHandler) Acknowledge(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.service.Acknowledge(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "acknowledged"})
}

// Resolve marca como resolvida
func (h *NarrativeHandler) Resolve(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	// Pegar user_id do contexto
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	resolvedBy, _ := uuid.Parse(userID.(string))
	if err := h.service.Resolve(id, resolvedBy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "resolved"})
}
