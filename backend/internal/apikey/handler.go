package apikey

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// APIKeyHandler handler HTTP
type APIKeyHandler struct {
	service *APIKeyService
}

// NewAPIKeyHandler cria novo handler
func NewAPIKeyHandler(service *APIKeyService) *APIKeyHandler {
	return &APIKeyHandler{service: service}
}

// CreateKeyRequest request para criar key
type CreateKeyRequest struct {
	Name        string   `json:"name" binding:"required,min=1,max=100"`
	Scopes      []string `json:"scopes" binding:"required,min=1"`
	Description string   `json:"description"`
	ExpiresIn   *int     `json:"expires_in_days"` // Dias até expirar (opcional)
}

// CreateKey cria uma nova API key
func (h *APIKeyHandler) CreateKey(c *gin.Context) {
	appID, err := getAppIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "usuário não autenticado"})
		return
	}

	var req CreateKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Converter scopes
	scopes := make([]APIKeyScope, len(req.Scopes))
	for i, s := range req.Scopes {
		scopes[i] = APIKeyScope(s)
	}

	// Calcular expiração
	var expiresAt *time.Time
	if req.ExpiresIn != nil && *req.ExpiresIn > 0 {
		exp := time.Now().AddDate(0, 0, *req.ExpiresIn)
		expiresAt = &exp
	}

	key, rawKey, err := h.service.CreateKey(appID, userID, req.Name, scopes, req.Description, expiresAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"key":     key,
		"api_key": rawKey,
		"warning": "Guarde esta API key! Ela não será mostrada novamente.",
	})
}

// ListKeys lista API keys do app
func (h *APIKeyHandler) ListKeys(c *gin.Context) {
	appID, err := getAppIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	keys, err := h.service.ListKeys(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"keys":  keys,
		"count": len(keys),
	})
}

// GetKey busca uma API key
func (h *APIKeyHandler) GetKey(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	key, err := h.service.GetKey(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "API key não encontrada"})
		return
	}

	c.JSON(http.StatusOK, key)
}

// RevokeKey revoga uma API key
func (h *APIKeyHandler) RevokeKey(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "usuário não autenticado"})
		return
	}

	if err := h.service.RevokeKey(id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "API key revogada"})
}

// GetUsageStats retorna estatísticas de uso
func (h *APIKeyHandler) GetUsageStats(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	stats, err := h.service.GetUsageStats(id, 30) // Últimos 30 dias
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetScopes retorna scopes disponíveis
func (h *APIKeyHandler) GetScopes(c *gin.Context) {
	scopes := []map[string]string{
		{"scope": string(ScopeRead), "description": "Apenas leitura de dados"},
		{"scope": string(ScopeWrite), "description": "Leitura e escrita de dados"},
		{"scope": string(ScopeAdmin), "description": "Acesso administrativo completo"},
		{"scope": string(ScopeTelemetry), "description": "Envio de telemetria"},
		{"scope": string(ScopeIdentity), "description": "Operações de identidade"},
		{"scope": string(ScopeBilling), "description": "Operações de billing"},
	}

	c.JSON(http.StatusOK, gin.H{
		"scopes": scopes,
		"count":  len(scopes),
	})
}

// RegisterAPIKeyRoutes registra rotas de API keys
func RegisterAPIKeyRoutes(r *gin.RouterGroup, service *APIKeyService, authMiddleware, adminOnly gin.HandlerFunc) {
	handler := NewAPIKeyHandler(service)

	apikeys := r.Group("/apikeys")
	apikeys.Use(authMiddleware)
	{
		// Scopes disponíveis (público para autenticados)
		apikeys.GET("/scopes", handler.GetScopes)

		// CRUD de keys (requer admin)
		apikeys.POST("", adminOnly, handler.CreateKey)
		apikeys.GET("", handler.ListKeys)
		apikeys.GET("/:id", handler.GetKey)
		apikeys.DELETE("/:id", adminOnly, handler.RevokeKey)

		// Estatísticas
		apikeys.GET("/:id/stats", handler.GetUsageStats)
	}
}

// Helpers
func getAppIDFromContext(c *gin.Context) (uuid.UUID, error) {
	if appIDStr := c.Query("app_id"); appIDStr != "" {
		return uuid.Parse(appIDStr)
	}
	if appID, exists := c.Get("app_id"); exists {
		if id, ok := appID.(uuid.UUID); ok {
			return id, nil
		}
		if idStr, ok := appID.(string); ok {
			return uuid.Parse(idStr)
		}
	}
	if userID, exists := c.Get("user_id"); exists {
		if id, ok := userID.(uuid.UUID); ok {
			return id, nil
		}
		if idStr, ok := userID.(string); ok {
			return uuid.Parse(idStr)
		}
	}
	return uuid.Nil, nil
}

func getUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	if userID, exists := c.Get("user_id"); exists {
		if id, ok := userID.(uuid.UUID); ok {
			return id, nil
		}
		if idStr, ok := userID.(string); ok {
			return uuid.Parse(idStr)
		}
	}
	return uuid.Nil, nil
}
