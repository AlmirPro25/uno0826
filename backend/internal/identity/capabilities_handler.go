package identity

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"prost-qs/backend/pkg/capabilities"
)

// ========================================
// IMPLICIT USER MODEL - Usuários anônimos de apps
// ========================================

// ImplicitUser representa um usuário criado implicitamente por um app
type ImplicitUser struct {
	ID              uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey"`
	AppID           uuid.UUID  `json:"app_id" gorm:"type:uuid;index"`
	ExternalRef     string     `json:"external_ref" gorm:"index"`          // Hash único do usuário
	Name            string     `json:"name"`
	Email           string     `json:"email" gorm:"index"`
	Metadata        string     `json:"metadata" gorm:"type:text"`          // JSON com dados extras
	FirstSeenAt     time.Time  `json:"first_seen_at"`
	LastSeenAt      time.Time  `json:"last_seen_at"`
	SessionCount    int        `json:"session_count" gorm:"default:0"`
	TotalDurationMs int64      `json:"total_duration_ms" gorm:"default:0"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// ImplicitLoginRequest payload do login implícito
type ImplicitLoginRequest struct {
	ExternalRef string            `json:"external_ref"`           // Referência única (opcional, será gerado)
	Name        string            `json:"name" binding:"required"`
	Email       string            `json:"email"`
	Age         int               `json:"age"`
	Gender      string            `json:"gender"`
	Metadata    map[string]string `json:"metadata"`
}

// ImplicitLoginResponse resposta do login implícito
type ImplicitLoginResponse struct {
	UserID       string   `json:"user_id"`
	Token        string   `json:"token"`
	ExpiresAt    int64    `json:"expires_at"`
	IsNewUser    bool     `json:"is_new_user"`
	Capabilities []string `json:"capabilities"`
}

// CapabilitiesHandler gerencia endpoints de capacidades
type CapabilitiesHandler struct {
	db *gorm.DB
}

// NewCapabilitiesHandler cria novo handler
func NewCapabilitiesHandler(db *gorm.DB) *CapabilitiesHandler {
	return &CapabilitiesHandler{db: db}
}

// EntitlementsResponse resposta do endpoint /me/entitlements
type EntitlementsResponse struct {
	Plan         PlanInfo           `json:"plan"`
	Capabilities []string           `json:"capabilities"`
	Limits       LimitsInfo         `json:"limits"`
	Usage        UsageInfo          `json:"usage"`
}

// PlanInfo informações do plano
type PlanInfo struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
}

// LimitsInfo limites do plano
type LimitsInfo struct {
	MaxApps        int `json:"max_apps"`
	MaxCredentials int `json:"max_credentials"`
	MaxAppUsers    int `json:"max_app_users"`
}

// UsageInfo uso atual
type UsageInfo struct {
	Apps        int `json:"apps"`
	Credentials int `json:"credentials"`
}

// GetEntitlements retorna capacidades e limites do usuário
// GET /me/entitlements
func (h *CapabilitiesHandler) GetEntitlements(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Buscar plano e status
	plan, status := h.getUserPlanAndStatus(userID)
	
	// Converter capacidades para strings
	caps := make([]string, len(plan.Capabilities))
	for i, cap := range plan.Capabilities {
		caps[i] = string(cap)
	}

	// Contar uso atual
	appsCount := h.countResources(userID, "app")
	credsCount := h.countResources(userID, "credential")

	response := EntitlementsResponse{
		Plan: PlanInfo{
			ID:     plan.ID,
			Name:   plan.Name,
			Status: status,
		},
		Capabilities: caps,
		Limits: LimitsInfo{
			MaxApps:        plan.Limits.MaxApps,
			MaxCredentials: plan.Limits.MaxCredentials,
			MaxAppUsers:    plan.Limits.MaxAppUsers,
		},
		Usage: UsageInfo{
			Apps:        appsCount,
			Credentials: credsCount,
		},
	}

	c.JSON(http.StatusOK, response)
}

// CheckCapability verifica se usuário tem uma capacidade específica
// GET /me/capabilities/:capability
func (h *CapabilitiesHandler) CheckCapability(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	capName := c.Param("capability")
	cap := capabilities.Capability(capName)

	plan, _ := h.getUserPlanAndStatus(userID)
	hasCapability := plan.HasCapability(cap)

	c.JSON(http.StatusOK, gin.H{
		"capability": capName,
		"granted":    hasCapability,
		"plan":       plan.ID,
	})
}

// CheckLimit verifica se usuário pode criar mais de um recurso
// GET /me/limits/:resource
func (h *CapabilitiesHandler) CheckLimit(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	resource := c.Param("resource")
	plan, _ := h.getUserPlanAndStatus(userID)
	current := h.countResources(userID, resource)
	limit := h.getLimit(plan, resource)
	canCreate := plan.CanCreate(resource, current)

	c.JSON(http.StatusOK, gin.H{
		"resource":   resource,
		"current":    current,
		"limit":      limit,
		"can_create": canCreate,
		"plan":       plan.ID,
	})
}

// getUserPlanAndStatus busca plano e status da assinatura
func (h *CapabilitiesHandler) getUserPlanAndStatus(userID uuid.UUID) (*capabilities.Plan, string) {
	// Buscar billing account
	var account struct {
		AccountID uuid.UUID `gorm:"column:account_id"`
	}
	if err := h.db.Table("billing_accounts").
		Select("account_id").
		Where("user_id = ?", userID).
		First(&account).Error; err != nil {
		return &capabilities.PlanFree, "none"
	}

	// Buscar subscription
	var subscription struct {
		PlanID string `gorm:"column:plan_id"`
		Status string `gorm:"column:status"`
	}
	if err := h.db.Table("subscriptions").
		Select("plan_id, status").
		Where("account_id = ?", account.AccountID).
		Order("created_at DESC").
		First(&subscription).Error; err != nil {
		return &capabilities.PlanFree, "none"
	}

	// Se não está ativo, retorna free com o status real
	if subscription.Status != "active" && subscription.Status != "trialing" {
		return &capabilities.PlanFree, subscription.Status
	}

	return capabilities.GetPlan(subscription.PlanID), subscription.Status
}

// countResources conta recursos do usuário
func (h *CapabilitiesHandler) countResources(userID uuid.UUID, resourceType string) int {
	var count int64
	
	switch resourceType {
	case "app":
		h.db.Table("applications").Where("owner_id = ?", userID).Count(&count)
	case "credential":
		h.db.Table("app_credentials").
			Joins("JOIN applications ON applications.id = app_credentials.app_id").
			Where("applications.owner_id = ?", userID).
			Count(&count)
	}
	
	return int(count)
}

// getLimit retorna limite do plano
func (h *CapabilitiesHandler) getLimit(plan *capabilities.Plan, resource string) int {
	switch resource {
	case "app":
		return plan.Limits.MaxApps
	case "credential":
		return plan.Limits.MaxCredentials
	case "app_user":
		return plan.Limits.MaxAppUsers
	default:
		return 0
	}
}

// RegisterCapabilitiesRoutes registra rotas de capacidades
func RegisterCapabilitiesRoutes(router *gin.RouterGroup, db *gorm.DB, authMiddleware gin.HandlerFunc) {
	handler := NewCapabilitiesHandler(db)

	me := router.Group("/me")
	me.Use(authMiddleware)
	{
		// Entitlements completos
		me.GET("/entitlements", handler.GetEntitlements)
		
		// Verificar capacidade específica
		me.GET("/capabilities/:capability", handler.CheckCapability)
		
		// Verificar limite específico
		me.GET("/limits/:resource", handler.CheckLimit)
	}
}

// ========================================
// IMPLICIT LOGIN HANDLER
// ========================================

// ImplicitLoginHandler gerencia login implícito de apps externos
type ImplicitLoginHandler struct {
	db        *gorm.DB
	jwtSecret string
}

// NewImplicitLoginHandler cria novo handler
func NewImplicitLoginHandler(db *gorm.DB, jwtSecret string) *ImplicitLoginHandler {
	// Auto-migrate da tabela
	db.AutoMigrate(&ImplicitUser{})
	return &ImplicitLoginHandler{db: db, jwtSecret: jwtSecret}
}

// ImplicitLogin cria ou recupera usuário implícito e retorna JWT
// POST /api/v1/identity/implicit-login
func (h *ImplicitLoginHandler) ImplicitLogin(c *gin.Context) {
	// Verificar se tem app context
	appInterface, exists := c.Get("app")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App context obrigatório"})
		return
	}
	
	// Type assertion segura
	type AppInfo struct {
		ID uuid.UUID
	}
	var appID uuid.UUID
	
	// Tentar diferentes formas de obter o app ID
	if app, ok := appInterface.(*AppInfo); ok {
		appID = app.ID
	} else if appIDStr, ok := c.Get("app_id"); ok {
		if id, err := uuid.Parse(appIDStr.(string)); err == nil {
			appID = id
		}
	}
	
	if appID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App ID não encontrado"})
		return
	}

	var req ImplicitLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Gerar external_ref se não fornecido
	externalRef := req.ExternalRef
	if externalRef == "" {
		// Criar hash único baseado em nome + email + app
		data := req.Name + req.Email + appID.String()
		hash := sha256.Sum256([]byte(data))
		externalRef = hex.EncodeToString(hash[:16]) // 32 chars
	}

	// Buscar ou criar usuário
	var user ImplicitUser
	isNewUser := false
	
	result := h.db.Where("app_id = ? AND external_ref = ?", appID, externalRef).First(&user)
	
	if result.Error == gorm.ErrRecordNotFound {
		// Criar novo usuário
		isNewUser = true
		user = ImplicitUser{
			ID:           uuid.New(),
			AppID:        appID,
			ExternalRef:  externalRef,
			Name:         req.Name,
			Email:        req.Email,
			FirstSeenAt:  time.Now(),
			LastSeenAt:   time.Now(),
			SessionCount: 1,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
		
		// Serializar metadata
		if req.Metadata != nil {
			metaJSON := "{"
			first := true
			for k, v := range req.Metadata {
				if !first {
					metaJSON += ","
				}
				metaJSON += `"` + k + `":"` + v + `"`
				first = false
			}
			// Adicionar age e gender se fornecidos
			if req.Age > 0 {
				if !first {
					metaJSON += ","
				}
				metaJSON += `"age":` + string(rune(req.Age+'0'))
				first = false
			}
			if req.Gender != "" {
				if !first {
					metaJSON += ","
				}
				metaJSON += `"gender":"` + req.Gender + `"`
			}
			metaJSON += "}"
			user.Metadata = metaJSON
		}
		
		if err := h.db.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar usuário"})
			return
		}
	} else if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuário"})
		return
	} else {
		// Atualizar last seen e session count
		h.db.Model(&user).Updates(map[string]interface{}{
			"last_seen_at":   time.Now(),
			"session_count":  gorm.Expr("session_count + 1"),
			"updated_at":     time.Now(),
		})
	}

	// Gerar JWT
	expiresAt := time.Now().Add(24 * time.Hour)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      user.ID.String(),
		"app_id":   appID.String(),
		"name":     user.Name,
		"type":     "implicit_user",
		"exp":      expiresAt.Unix(),
		"iat":      time.Now().Unix(),
	})

	tokenString, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar token"})
		return
	}

	c.JSON(http.StatusOK, ImplicitLoginResponse{
		UserID:       user.ID.String(),
		Token:        tokenString,
		ExpiresAt:    expiresAt.Unix(),
		IsNewUser:    isNewUser,
		Capabilities: []string{"vox:connect", "vox:chat", "vox:video"},
	})
}

// GetImplicitUser retorna dados de um usuário implícito
// GET /api/v1/identity/users/:id
func (h *ImplicitLoginHandler) GetImplicitUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var user ImplicitUser
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// ListImplicitUsers lista usuários implícitos de um app
// GET /api/v1/identity/users
func (h *ImplicitLoginHandler) ListImplicitUsers(c *gin.Context) {
	appIDStr, exists := c.Get("app_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App context obrigatório"})
		return
	}

	appID, _ := uuid.Parse(appIDStr.(string))

	var users []ImplicitUser
	h.db.Where("app_id = ?", appID).Order("last_seen_at DESC").Limit(100).Find(&users)

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": len(users),
	})
}

// RegisterImplicitLoginRoutes registra rotas de login implícito
func RegisterImplicitLoginRoutes(router *gin.RouterGroup, db *gorm.DB, jwtSecret string, appContextMiddleware, requireAppContext gin.HandlerFunc) {
	handler := NewImplicitLoginHandler(db, jwtSecret)

	identity := router.Group("/identity")
	identity.Use(appContextMiddleware)
	identity.Use(requireAppContext)
	{
		// Login implícito - cria ou recupera usuário
		identity.POST("/implicit-login", handler.ImplicitLogin)
		
		// Listar usuários do app
		identity.GET("/users", handler.ListImplicitUsers)
		
		// Buscar usuário específico
		identity.GET("/users/:id", handler.GetImplicitUser)
	}
}
