package mcp

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"prost-qs/backend/pkg/warobs"
)

// ========================================
// HTTP HANDLERS FOR MCP API
// ========================================

// WebSocket upgrader configuration
var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins in dev (restrict in production)
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// MCPHandler wraps the Dispatcher for HTTP exposure.
type MCPHandler struct {
	Dispatcher *Dispatcher
	AuditRepo  AuditRepository
	AuditHub   *AuditHub
	WarObs     *warobs.WarObservability
}

// NewMCPHandler creates a new HTTP handler for MCP operations.
func NewMCPHandler(dispatcher *Dispatcher, auditRepo AuditRepository, warObs *warobs.WarObservability) *MCPHandler {
	return &MCPHandler{
		Dispatcher: dispatcher,
		AuditRepo:  auditRepo,
		WarObs:     warObs,
	}
}

// SetAuditHub attaches the WebSocket hub.
func (h *MCPHandler) SetAuditHub(hub *AuditHub) {
	h.AuditHub = hub
}

// RegisterRoutes adds MCP routes to a Gin router group.
// Expected base path: /api/v1/mcp
func (h *MCPHandler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/dispatch", h.HandleDispatch)
	rg.GET("/agents", h.HandleListAgents)
	rg.GET("/audit/events", h.HandleListEvents)
	rg.GET("/audit/trace/:traceId", h.HandleGetTrace)
	rg.GET("/health", h.HandleHealth)
	rg.GET("/ws/audit", h.HandleWSAudit) // WebSocket endpoint
}

// HandleDispatch is the main entry point for command execution.
// POST /api/v1/mcp/dispatch
func (h *MCPHandler) HandleDispatch(c *gin.Context) {
	var req DispatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Inject trace ID from header or generate new
	ctx := c.Request.Context()
	if traceID := c.GetHeader("X-Trace-ID"); traceID != "" {
		ctx = WithTraceID(ctx, traceID)
	} else {
		traceID = GenerateTraceID()
		ctx = WithTraceID(ctx, traceID)
		c.Header("X-Trace-ID", traceID)
	}

	// Inject user context if available
	if userID, exists := c.Get("user_id"); exists {
		if uid, ok := userID.(string); ok {
			ctx = WithUserID(ctx, uid)
		}
	}

	// Execute dispatch
	resp, err := h.Dispatcher.Dispatch(ctx, req)

	// Set trace ID in response header
	c.Header("X-Trace-ID", GetTraceID(ctx))

	if err != nil {
		statusCode := http.StatusInternalServerError

		switch err {
		case ErrAgentNotFound:
			statusCode = http.StatusNotFound
		case ErrCapabilityDenied:
			statusCode = http.StatusForbidden
		}

		c.JSON(statusCode, gin.H{
			"error":    err.Error(),
			"trace_id": GetTraceID(ctx),
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// HandleListAgents returns all registered agents.
// GET /api/v1/mcp/agents
func (h *MCPHandler) HandleListAgents(c *gin.Context) {
	agents := h.Dispatcher.ListAgents()
	c.JSON(http.StatusOK, gin.H{
		"agents": agents,
		"count":  len(agents),
	})
}

// HandleListEvents returns audit log events.
// GET /api/v1/mcp/audit/events?agent_id=x&type=y&limit=50
func (h *MCPHandler) HandleListEvents(c *gin.Context) {
	if h.AuditRepo == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Audit repository not configured",
		})
		return
	}

	filter := EventFilter{
		TraceID: c.Query("trace_id"),
		AgentID: c.Query("agent_id"),
		Limit:   50, // Default limit
	}

	if eventType := c.Query("type"); eventType != "" {
		filter.EventType = EventType(eventType)
	}

	events, err := h.AuditRepo.GetEvents(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch events",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"count":  len(events),
	})
}

// HandleGetTrace returns all events for a specific trace.
// GET /api/v1/mcp/audit/trace/:traceId
func (h *MCPHandler) HandleGetTrace(c *gin.Context) {
	if h.AuditRepo == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Audit repository not configured",
		})
		return
	}

	traceID := c.Param("traceId")
	if traceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Trace ID is required",
		})
		return
	}

	events, err := h.AuditRepo.GetEventsByTraceID(c.Request.Context(), traceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch trace events",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"trace_id": traceID,
		"events":   events,
		"count":    len(events),
	})
}

// HandleHealth returns the health status of the MCP system.
// GET /api/v1/mcp/health
func (h *MCPHandler) HandleHealth(c *gin.Context) {
	healthStatus := h.Dispatcher.HealthCheck(c.Request.Context())

	healthy := true
	agentStatuses := make(map[string]string)

	for agentID, err := range healthStatus {
		if err != nil {
			healthy = false
			agentStatuses[agentID] = err.Error()
		} else {
			agentStatuses[agentID] = "healthy"
		}
	}

	status := "healthy"
	if !healthy {
		status = "degraded"
	}
	// Check killswitch status directly (assuming field access or helper needed)
	// dispatcher doesn't expose killSwitch field directly outside package if lowercased
	// But we are in 'package mcp', so it's fine.

	response := map[string]interface{}{
		"status":       status,
		"agent_count":  h.Dispatcher.AgentCount(),
		"agent_health": agentStatuses,
		"version":      "Sovereign v3.0",
		"uptime":       "OK",
	}

	// Add WarObs Metrics if available
	if h.WarObs != nil {
		summary := h.WarObs.GetHealthSummary()
		response["warobs"] = map[string]interface{}{
			"rate":            summary.Metrics.Rate,
			"errors":          summary.Metrics.Errors,
			"duration":        summary.Metrics.Duration,
			"pressure":        map[string]interface{}{"level": summary.Status, "score": summary.PressureScore},
			"active_defenses": summary.ActiveDefenses,
		}
	}

	c.JSON(http.StatusOK, response)
}

// HandleWSAudit upgrades to WebSocket and streams audit events in real-time.
// GET /api/v1/mcp/ws/audit
func (h *MCPHandler) HandleWSAudit(c *gin.Context) {
	if h.AuditHub == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "WebSocket audit hub not configured",
		})
		return
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := wsUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[MCP WS] Upgrade error: %v", err)
		return
	}

	// Register client to hub
	h.AuditHub.Register(conn)

	// Keep connection alive by reading (client can send pings)
	defer func() {
		h.AuditHub.Unregister(conn)
	}()

	// Read pump (just to keep connection alive and handle close)
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			// Connection closed
			break
		}
	}
}
