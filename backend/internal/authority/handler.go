package authority

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// AUTHORITY HANDLER - API REST
// ========================================

type AuthorityHandler struct {
	service *AuthorityService
}

func NewAuthorityHandler(service *AuthorityService) *AuthorityHandler {
	return &AuthorityHandler{service: service}
}

// ========================================
// RESOLUTION (CORE)
// ========================================

// Resolve determina quem pode aprovar uma ação
// POST /api/v1/authority/resolve
func (h *AuthorityHandler) Resolve(c *gin.Context) {
	var req ResolutionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.Resolve(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// CanApprove verifica se um usuário específico pode aprovar
// POST /api/v1/authority/can-approve
func (h *AuthorityHandler) CanApprove(c *gin.Context) {
	var req struct {
		UserID uuid.UUID         `json:"user_id" binding:"required"`
		Domain string            `json:"domain" binding:"required"`
		Action string            `json:"action" binding:"required"`
		Amount int64             `json:"amount"`
		Impact ImpactLevel       `json:"impact" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	canApprove, reason := h.service.CanUserApprove(req.UserID, ResolutionRequest{
		Domain:      req.Domain,
		Action:      req.Action,
		Amount:      req.Amount,
		Impact:      req.Impact,
		RequestedBy: uuid.Nil, // não é auto-aprovação neste contexto
	})

	c.JSON(http.StatusOK, gin.H{
		"can_approve": canApprove,
		"reason":      reason,
	})
}

// ========================================
// CRUD DE AUTORIDADES
// ========================================

// Grant concede uma autoridade
// POST /api/v1/authority/grant
func (h *AuthorityHandler) Grant(c *gin.Context) {
	grantedByStr := c.GetString("userID")
	if grantedByStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}
	grantedBy, _ := uuid.Parse(grantedByStr)

	var req struct {
		UserID    string          `json:"user_id" binding:"required"`
		Role      AuthorityRole   `json:"role" binding:"required"`
		Title     string          `json:"title" binding:"required"`
		Scopes    AuthorityScopes `json:"scopes" binding:"required"`
		MaxImpact ImpactLevel     `json:"max_impact" binding:"required"`
		Reason    string          `json:"reason" binding:"required"`
		ExpiresIn *int            `json:"expires_in_days,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id inválido"})
		return
	}

	var expiresAt *time.Time
	if req.ExpiresIn != nil && *req.ExpiresIn > 0 {
		exp := time.Now().AddDate(0, 0, *req.ExpiresIn)
		expiresAt = &exp
	}

	auth, err := h.service.Grant(
		userID,
		req.Role,
		req.Title,
		req.Scopes,
		req.MaxImpact,
		grantedBy,
		req.Reason,
		expiresAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, auth)
}

// Revoke revoga uma autoridade
// DELETE /api/v1/authority/:id
func (h *AuthorityHandler) Revoke(c *gin.Context) {
	revokedByStr := c.GetString("userID")
	if revokedByStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}
	revokedBy, _ := uuid.Parse(revokedByStr)

	authorityIDStr := c.Param("id")
	authorityID, err := uuid.Parse(authorityIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.Revoke(authorityID, revokedBy, req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Autoridade revogada",
		"authority_id": authorityID,
		"revoked_by":   revokedBy,
		"reason":       req.Reason,
	})
}

// GetByID busca autoridade por ID
// GET /api/v1/authority/:id
func (h *AuthorityHandler) GetByID(c *gin.Context) {
	authorityIDStr := c.Param("id")
	authorityID, err := uuid.Parse(authorityIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	auth, err := h.service.GetByID(authorityID)
	if err != nil {
		if err == ErrAuthorityNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Autoridade não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, auth)
}

// GetByUser busca autoridades de um usuário
// GET /api/v1/authority/user/:userId
func (h *AuthorityHandler) GetByUser(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	activeOnly := c.Query("active") == "true"

	var authorities []DecisionAuthority
	if activeOnly {
		authorities, err = h.service.GetActiveByUser(userID)
	} else {
		authorities, err = h.service.GetByUser(userID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":     userID,
		"authorities": authorities,
		"total":       len(authorities),
	})
}

// GetAll lista todas as autoridades
// GET /api/v1/authority
func (h *AuthorityHandler) GetAll(c *gin.Context) {
	authorities, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"authorities": authorities,
		"total":       len(authorities),
	})
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterAuthorityRoutes registra rotas de autoridade
func RegisterAuthorityRoutes(router *gin.RouterGroup, service *AuthorityService, authMiddleware, superAdminMiddleware gin.HandlerFunc) {
	handler := NewAuthorityHandler(service)

	authority := router.Group("/authority")
	authority.Use(authMiddleware)
	{
		// Resolution (admin pode consultar)
		authority.POST("/resolve", handler.Resolve)
		authority.POST("/can-approve", handler.CanApprove)

		// Leitura (admin)
		authority.GET("", handler.GetAll)
		authority.GET("/:id", handler.GetByID)
		authority.GET("/user/:userId", handler.GetByUser)

		// Escrita (apenas super_admin)
		authority.POST("/grant", superAdminMiddleware, handler.Grant)
		authority.DELETE("/:id", superAdminMiddleware, handler.Revoke)
	}
}
