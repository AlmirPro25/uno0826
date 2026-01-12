package auth

/*
================================================================================
SESSION HANDLER — ENDPOINTS DE GESTÃO DE SESSÕES
================================================================================

Endpoints:
- GET  /auth/sessions       → Listar sessões ativas
- DELETE /auth/sessions/:id → Revogar sessão específica
- DELETE /auth/sessions     → Revogar todas (exceto atual)
- GET  /auth/sessions/stats → Estatísticas de sessões

================================================================================
*/

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"prost-qs/backend/internal/events"
	"prost-qs/backend/pkg/middleware"
)

// SessionHandler handler de sessões
type SessionHandler struct {
	sessionService *SessionService
}

// NewSessionHandler cria novo handler
func NewSessionHandler(sessionService *SessionService) *SessionHandler {
	return &SessionHandler{sessionService: sessionService}
}

// ListSessions lista sessões ativas do usuário
// GET /api/v1/auth/sessions
func (h *SessionHandler) ListSessions(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserIDKey)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Extrair token atual para marcar sessão
	currentToken := extractToken(c)

	sessions, err := h.sessionService.GetUserSessions(uid, currentToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
		"count":    len(sessions),
	})
}

// RevokeSession revoga uma sessão específica
// DELETE /api/v1/auth/sessions/:id
func (h *SessionHandler) RevokeSession(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserIDKey)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuário inválido"})
		return
	}

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de sessão inválido"})
		return
	}

	if err := h.sessionService.RevokeSession(uid, sessionID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Emitir evento de sessão revogada
	appIDStr := c.GetString(middleware.ContextAppIDKey)
	if appID, err := uuid.Parse(appIDStr); err == nil {
		events.EmitSessionRevoked(appID, uid, sessionID, "user")
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Sessão revogada com sucesso",
	})
}

// RevokeOtherSessions revoga todas as sessões exceto a atual
// DELETE /api/v1/auth/sessions
func (h *SessionHandler) RevokeOtherSessions(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserIDKey)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	currentToken := extractToken(c)

	count, err := h.sessionService.RevokeAllSessions(uid, currentToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":          true,
		"sessions_revoked": count,
		"message":          "Outras sessões revogadas com sucesso",
	})
}

// GetSessionStats retorna estatísticas de sessões
// GET /api/v1/auth/sessions/stats
func (h *SessionHandler) GetSessionStats(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserIDKey)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	stats, err := h.sessionService.GetSessionStats(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// extractToken extrai token do header Authorization
func extractToken(c *gin.Context) string {
	auth := c.GetHeader("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	return ""
}

// RegisterSessionRoutes registra rotas de sessão
func RegisterSessionRoutes(router *gin.RouterGroup, sessionService *SessionService, authMiddleware gin.HandlerFunc) {
	handler := NewSessionHandler(sessionService)

	sessions := router.Group("/auth/sessions")
	sessions.Use(authMiddleware)
	{
		sessions.GET("", handler.ListSessions)
		sessions.GET("/stats", handler.GetSessionStats)
		sessions.DELETE("/:id", handler.RevokeSession)
		sessions.DELETE("", handler.RevokeOtherSessions)
	}
}
