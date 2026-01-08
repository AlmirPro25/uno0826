package secrets

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// SECRETS HANDLER - HTTP API
// "Admin-only, nunca expor valor completo"
// ========================================

type SecretsHandler struct {
	service *SecretsService
}

func NewSecretsHandler(service *SecretsService) *SecretsHandler {
	return &SecretsHandler{service: service}
}

// ========================================
// CRUD ENDPOINTS
// ========================================

// Create cria um novo secret
// POST /api/v1/secrets
func (h *SecretsHandler) Create(c *gin.Context) {
	var req CreateSecretRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Pegar user ID do contexto (setado pelo middleware de auth)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "não autenticado"})
		return
	}

	createdBy, ok := userID.(uuid.UUID)
	if !ok {
		// Tentar parse de string
		if userIDStr, ok := userID.(string); ok {
			var err error
			createdBy, err = uuid.Parse(userIDStr)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "user_id inválido"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user_id inválido"})
			return
		}
	}

	secret, err := h.service.Create(req, createdBy)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, secret)
}

// Update atualiza um secret
// PUT /api/v1/secrets/:id
func (h *SecretsHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var req UpdateSecretRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	updatedBy := h.parseUserID(userID)

	secret, err := h.service.Update(id, req, updatedBy)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, secret)
}

// Revoke revoga um secret
// DELETE /api/v1/secrets/:id
func (h *SecretsHandler) Revoke(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	userID, _ := c.Get("user_id")
	revokedBy := h.parseUserID(userID)

	if err := h.service.Revoke(id, revokedBy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "secret revogado"})
}

// GetByID busca secret por ID
// GET /api/v1/secrets/:id
func (h *SecretsHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	secret, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, secret)
}

// List lista secrets
// GET /api/v1/secrets
func (h *SecretsHandler) List(c *gin.Context) {
	var appID *uuid.UUID
	if appIDStr := c.Query("app_id"); appIDStr != "" {
		if parsed, err := uuid.Parse(appIDStr); err == nil {
			appID = &parsed
		}
	}

	environment := c.Query("environment")
	activeOnly := c.Query("active_only") != "false"

	result, err := h.service.List(appID, environment, activeOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}


// ========================================
// ROTAÇÃO E EXPIRAÇÃO
// ========================================

// Rotate rotaciona um secret
// POST /api/v1/secrets/:id/rotate
func (h *SecretsHandler) Rotate(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var req struct {
		Value string `json:"value" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	rotatedBy := h.parseUserID(userID)

	secret, err := h.service.Rotate(id, req.Value, rotatedBy)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, secret)
}

// GetExpiringSoon retorna secrets que expiram em breve
// GET /api/v1/secrets/expiring
func (h *SecretsHandler) GetExpiringSoon(c *gin.Context) {
	days := 7
	if daysStr := c.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			days = d
		}
	}

	secrets, err := h.service.GetExpiringSoon(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"secrets": secrets,
		"days":    days,
		"count":   len(secrets),
	})
}

// ========================================
// AUDIT LOG
// ========================================

// GetAccessLog retorna log de acesso
// GET /api/v1/secrets/:id/access-log
func (h *SecretsHandler) GetAccessLog(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	limit := 50
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	accesses, err := h.service.GetAccessLog(id, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accesses": accesses,
		"count":    len(accesses),
	})
}

// GetVersions retorna histórico de versões
// GET /api/v1/secrets/:id/versions
func (h *SecretsHandler) GetVersions(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	versions, err := h.service.GetVersions(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"versions": versions,
		"count":    len(versions),
	})
}

// ========================================
// HELPERS
// ========================================

func (h *SecretsHandler) parseUserID(userID any) uuid.UUID {
	if id, ok := userID.(uuid.UUID); ok {
		return id
	}
	if idStr, ok := userID.(string); ok {
		if id, err := uuid.Parse(idStr); err == nil {
			return id
		}
	}
	return uuid.Nil
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterSecretsRoutes registra rotas de secrets
func RegisterSecretsRoutes(router *gin.RouterGroup, service *SecretsService, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewSecretsHandler(service)

	// Todas as rotas de secrets são admin-only
	secrets := router.Group("/secrets")
	secrets.Use(authMiddleware)
	secrets.Use(adminMiddleware)
	{
		secrets.POST("", handler.Create)
		secrets.GET("", handler.List)
		secrets.GET("/expiring", handler.GetExpiringSoon)
		secrets.GET("/:id", handler.GetByID)
		secrets.PUT("/:id", handler.Update)
		secrets.DELETE("/:id", handler.Revoke)
		secrets.POST("/:id/rotate", handler.Rotate)
		secrets.GET("/:id/access-log", handler.GetAccessLog)
		secrets.GET("/:id/versions", handler.GetVersions)
	}
}
