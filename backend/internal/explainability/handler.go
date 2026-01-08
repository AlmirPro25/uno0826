package explainability

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// TIMELINE HANDLER - HTTP API
// ========================================

type TimelineHandler struct {
	service *TimelineService
}

func NewTimelineHandler(service *TimelineService) *TimelineHandler {
	return &TimelineHandler{service: service}
}

// ========================================
// ENDPOINTS
// ========================================

// GetByDecisionID busca timeline de uma decisão específica
// GET /api/v1/decisions/:decisionId/timeline
func (h *TimelineHandler) GetByDecisionID(c *gin.Context) {
	decisionIDStr := c.Param("decisionId")
	decisionID, err := uuid.Parse(decisionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "decision_id inválido"})
		return
	}

	timeline, err := h.service.GetByDecisionID(decisionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "timeline não encontrada"})
		return
	}

	c.JSON(http.StatusOK, timeline)
}

// GetByID busca timeline por ID próprio
// GET /api/v1/timeline/:id
func (h *TimelineHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	timeline, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "timeline não encontrada"})
		return
	}

	c.JSON(http.StatusOK, timeline)
}

// ListByApp lista timelines de um app
// GET /api/v1/timeline/app/:appId
func (h *TimelineHandler) ListByApp(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	limit := 50
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	timelines, err := h.service.ListByApp(appID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"app_id":    appID,
		"timelines": timelines,
		"count":     len(timelines),
	})
}

// ListByActor lista timelines de um ator
// GET /api/v1/timeline/actor/:actorId
func (h *TimelineHandler) ListByActor(c *gin.Context) {
	actorIDStr := c.Param("actorId")
	actorID, err := uuid.Parse(actorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "actor_id inválido"})
		return
	}

	limit := 50
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	timelines, err := h.service.ListByActor(actorID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"actor_id":  actorID,
		"timelines": timelines,
		"count":     len(timelines),
	})
}

// ListDivergent lista decisões com divergência
// GET /api/v1/timeline/divergent
func (h *TimelineHandler) ListDivergent(c *gin.Context) {
	limit := 50
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	timelines, err := h.service.ListDivergent(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"timelines": timelines,
		"count":     len(timelines),
		"note":      "Decisões onde policy e threshold divergiram",
	})
}

// Search busca timelines com filtros
// POST /api/v1/timeline/search
func (h *TimelineHandler) Search(c *gin.Context) {
	var query TimelineQuery
	if err := c.ShouldBindJSON(&query); err != nil {
		// Se não tem body, usar query params
		query = h.parseQueryParams(c)
	}

	result, err := h.service.Search(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// parseQueryParams extrai query params para TimelineQuery
func (h *TimelineHandler) parseQueryParams(c *gin.Context) TimelineQuery {
	query := TimelineQuery{}

	if appIDStr := c.Query("app_id"); appIDStr != "" {
		if appID, err := uuid.Parse(appIDStr); err == nil {
			query.AppID = &appID
		}
	}

	if actorIDStr := c.Query("actor_id"); actorIDStr != "" {
		if actorID, err := uuid.Parse(actorIDStr); err == nil {
			query.ActorID = &actorID
		}
	}

	query.DecisionType = c.Query("decision_type")
	query.Outcome = c.Query("outcome")
	query.OnlyDivergent = c.Query("only_divergent") == "true"

	if startStr := c.Query("start_date"); startStr != "" {
		if t, err := time.Parse(time.RFC3339, startStr); err == nil {
			query.StartDate = &t
		}
	}

	if endStr := c.Query("end_date"); endStr != "" {
		if t, err := time.Parse(time.RFC3339, endStr); err == nil {
			query.EndDate = &t
		}
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			query.Limit = l
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil {
			query.Offset = o
		}
	}

	return query
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterTimelineRoutes registra rotas de timeline
func RegisterTimelineRoutes(router *gin.RouterGroup, service *TimelineService, authMiddleware gin.HandlerFunc) {
	handler := NewTimelineHandler(service)

	// Rotas de timeline
	timeline := router.Group("/timeline")
	timeline.Use(authMiddleware)
	{
		timeline.GET("/:id", handler.GetByID)
		timeline.GET("/app/:appId", handler.ListByApp)
		timeline.GET("/actor/:actorId", handler.ListByActor)
		timeline.GET("/divergent", handler.ListDivergent)
		timeline.POST("/search", handler.Search)
		timeline.GET("/search", handler.Search) // Também aceita GET com query params
	}

	// Rota alternativa: /decisions/:id/timeline
	decisions := router.Group("/decisions")
	decisions.Use(authMiddleware)
	{
		decisions.GET("/:decisionId/timeline", handler.GetByDecisionID)
	}
}
