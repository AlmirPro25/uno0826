package application

import (
	"net/http"
	"strconv"
	"time"

	"prost-qs/backend/internal/observability"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// APPLICATION HANDLER
// ========================================

type ApplicationHandler struct {
	service *ApplicationService
}

func NewApplicationHandler(service *ApplicationService) *ApplicationHandler {
	return &ApplicationHandler{service: service}
}

// ========================================
// APPLICATION ENDPOINTS
// ========================================

// CreateApplication cria um novo app
func (h *ApplicationHandler) CreateApplication(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		Slug        string `json:"slug" binding:"required"`
		Description string `json:"description"`
		WebhookURL  string `json:"webhook_url"`
		RedirectURL string `json:"redirect_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Pegar owner do contexto (usuário autenticado)
	ownerID := c.GetString("userID")
	ownerUUID, err := uuid.Parse(ownerID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}

	app, err := h.service.CreateApplication(req.Name, req.Slug, req.Description, ownerUUID, OwnerTypeUser)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Atualizar URLs se fornecidas
	if req.WebhookURL != "" || req.RedirectURL != "" {
		updates := map[string]interface{}{}
		if req.WebhookURL != "" {
			updates["webhook_url"] = req.WebhookURL
		}
		if req.RedirectURL != "" {
			updates["redirect_url"] = req.RedirectURL
		}
		app, _ = h.service.UpdateApplication(app.ID, updates)
	}

	c.JSON(http.StatusCreated, app)
}

// GetApplication busca um app
func (h *ApplicationHandler) GetApplication(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	app, err := h.service.GetApplication(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "App não encontrado"})
		return
	}

	c.JSON(http.StatusOK, app)
}

// ListMyApplications lista apps do usuário autenticado
func (h *ApplicationHandler) ListMyApplications(c *gin.Context) {
	ownerID := c.GetString("userID")
	ownerUUID, err := uuid.Parse(ownerID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}

	apps, err := h.service.ListApplications(ownerUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"apps": apps, "total": len(apps)})
}

// ListAllApplications lista todos os apps (admin)
func (h *ApplicationHandler) ListAllApplications(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	apps, total, err := h.service.ListAllApplications(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"apps": apps, "total": total})
}

// UpdateApplication atualiza um app
func (h *ApplicationHandler) UpdateApplication(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Campos permitidos
	allowed := map[string]bool{"name": true, "description": true, "webhook_url": true, "redirect_url": true, "settings": true}
	updates := map[string]interface{}{}
	for k, v := range req {
		if allowed[k] {
			updates[k] = v
		}
	}

	app, err := h.service.UpdateApplication(id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, app)
}

// SuspendApplication suspende um app (admin)
func (h *ApplicationHandler) SuspendApplication(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
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

	if err := h.service.SuspendApplication(id, req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "App suspenso", "app_id": id})
}

// GetAppMetrics retorna métricas de um app
func (h *ApplicationHandler) GetAppMetrics(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	metrics, err := h.service.GetAppMetrics(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, metrics)
}

// ========================================
// CREDENTIALS ENDPOINTS
// ========================================

// CreateCredential cria credenciais para um app
func (h *ApplicationHandler) CreateCredential(c *gin.Context) {
	idStr := c.Param("id")
	appID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Name   string   `json:"name" binding:"required"`
		Scopes []string `json:"scopes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Scopes) == 0 {
		req.Scopes = []string{"identity", "billing"} // Default scopes
	}

	cred, secret, err := h.service.CreateCredential(appID, req.Name, req.Scopes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// IMPORTANTE: O secret só é retornado UMA VEZ
	c.JSON(http.StatusCreated, gin.H{
		"credential": cred,
		"secret":     secret,
		"warning":    "ATENÇÃO: O secret não será mostrado novamente. Guarde-o em local seguro.",
	})
}

// ListCredentials lista credenciais de um app
func (h *ApplicationHandler) ListCredentials(c *gin.Context) {
	idStr := c.Param("id")
	appID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	creds, err := h.service.ListCredentials(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"credentials": creds})
}

// RevokeCredential revoga uma credencial
func (h *ApplicationHandler) RevokeCredential(c *gin.Context) {
	credIDStr := c.Param("credId")
	credID, err := uuid.Parse(credIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.RevokeCredential(credID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Credencial revogada"})
}

// ========================================
// APP USERS ENDPOINTS
// ========================================

// ListAppUsers lista usuários de um app
func (h *ApplicationHandler) ListAppUsers(c *gin.Context) {
	idStr := c.Param("id")
	appID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	users, total, err := h.service.ListAppUsers(appID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users, "total": total})
}

// ========================================
// SESSIONS ENDPOINTS
// ========================================

// ListActiveSessions lista sessões ativas
func (h *ApplicationHandler) ListActiveSessions(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID inválido"})
		return
	}

	sessions, err := h.service.ListActiveSessions(appID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sessions": sessions})
}

// RevokeSession revoga uma sessão
func (h *ApplicationHandler) RevokeSession(c *gin.Context) {
	sessionIDStr := c.Param("sessionId")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID inválido"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	if err := h.service.RevokeSession(sessionID, req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sessão revogada"})
}

// RevokeAllSessions revoga todas as sessões de um usuário
func (h *ApplicationHandler) RevokeAllSessions(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID inválido"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	if err := h.service.RevokeAllSessions(appID, userID, req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Todas as sessões revogadas"})
}

// ========================================
// APP EVENTS ENDPOINT - Fase 22 (Audit-Only Integration)
// ========================================

// CreateAppEvent recebe eventos de audit de apps externos
// POST /api/v1/apps/events
func (h *ApplicationHandler) CreateAppEvent(c *gin.Context) {
	// Verificar se tem app context
	appInterface, exists := c.Get("app")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App context obrigatório"})
		return
	}
	app := appInterface.(*Application)

	var req struct {
		Type       string `json:"type" binding:"required"`
		ActorID    string `json:"actor_id" binding:"required"`
		ActorType  string `json:"actor_type"`
		TargetID   string `json:"target_id"`
		TargetType string `json:"target_type"`
		Action     string `json:"action"`
		Metadata   string `json:"metadata"`
		IP         string `json:"ip"`
		UserAgent  string `json:"user_agent"`
		Timestamp  string `json:"timestamp"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get request_id for correlation
	requestID, _ := c.Get("request_id")
	reqIDStr, _ := requestID.(string)

	// Criar evento via service
	err := h.service.CreateAppAuditEvent(
		app.ID,
		req.Type,
		req.ActorID,
		req.ActorType,
		req.TargetID,
		req.TargetType,
		req.Action,
		req.Metadata,
		req.IP,
		req.UserAgent,
	)

	if err != nil {
		// Increment failed counter
		observability.IncrementAppEventsFailed()
		observability.LogAppEvent(reqIDStr, app.ID.String(), req.Type, false)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Increment success counter
	observability.IncrementAppEvents()
	observability.LogAppEvent(reqIDStr, app.ID.String(), req.Type, true)

	c.JSON(http.StatusCreated, gin.H{"status": "ok", "message": "Evento registrado"})
}

// GetAppEvents retorna eventos de audit do app autenticado
// GET /api/v1/apps/events
func (h *ApplicationHandler) GetAppEvents(c *gin.Context) {
	appInterface, exists := c.Get("app")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App context obrigatório"})
		return
	}
	app := appInterface.(*Application)

	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 1000 {
			limit = parsed
		}
	}

	events, err := h.service.GetAppAuditEvents(app.ID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stats, _ := h.service.GetAppAuditStats(app.ID)

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"total":  len(events),
		"stats":  stats,
	})
}

// ========================================
// ROUTES REGISTRATION
// ========================================

// RegisterApplicationRoutes registra as rotas de aplicações
func RegisterApplicationRoutes(router *gin.RouterGroup, service *ApplicationService, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewApplicationHandler(service)

	apps := router.Group("/apps")
	apps.Use(authMiddleware)
	{
		// CRUD de apps (owner)
		apps.POST("", handler.CreateApplication)
		apps.GET("/mine", handler.ListMyApplications)
		apps.GET("/:id", handler.GetApplication)
		apps.PUT("/:id", handler.UpdateApplication)
		apps.GET("/:id/metrics", handler.GetAppMetrics)

		// Credentials
		apps.POST("/:id/credentials", handler.CreateCredential)
		apps.GET("/:id/credentials", handler.ListCredentials)
		apps.DELETE("/:id/credentials/:credId", handler.RevokeCredential)

		// App Users
		apps.GET("/:id/users", handler.ListAppUsers)

		// Sessions
		apps.GET("/:id/users/:userId/sessions", handler.ListActiveSessions)
		apps.DELETE("/:id/users/:userId/sessions", handler.RevokeAllSessions)
		apps.DELETE("/sessions/:sessionId", handler.RevokeSession)

		// Admin only
		apps.GET("", adminMiddleware, handler.ListAllApplications)
		apps.POST("/:id/suspend", adminMiddleware, handler.SuspendApplication)
	}

	// Endpoint para apps externos enviarem eventos (usa AppContextMiddleware)
	appEvents := router.Group("/apps")
	appEvents.Use(AppContextMiddleware(service))
	appEvents.Use(RequireAppContext())
	{
		appEvents.POST("/events", handler.CreateAppEvent)
		appEvents.GET("/events", handler.GetAppEvents)
	}
}

// ========================================
// APP CONTEXT MIDDLEWARE
// ========================================

// AppContextMiddleware extrai e valida o contexto do app
// Headers padrão:
//   - X-Prost-App-Id: ID do app (opcional, para logging)
//   - X-Prost-App-Key: Public Key (pq_pk_xxx) - identifica o app
//   - X-Prost-App-Secret: Secret Key (pq_sk_xxx) - autentica a request
func AppContextMiddleware(service *ApplicationService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Tentar extrair app context do header (suporta ambos formatos para retrocompatibilidade)
		publicKey := c.GetHeader("X-Prost-App-Key")
		if publicKey == "" {
			publicKey = c.GetHeader("X-App-Key") // fallback
		}
		secret := c.GetHeader("X-Prost-App-Secret")
		if secret == "" {
			secret = c.GetHeader("X-App-Secret") // fallback
		}

		if publicKey != "" && secret != "" {
			cred, app, err := service.ValidateCredential(publicKey, secret)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais de app inválidas"})
				c.Abort()
				return
			}

			// Adicionar ao contexto
			c.Set("app", app)
			c.Set("app_id", app.ID.String())
			c.Set("app_credential", cred)
			c.Set("app_scopes", cred.Scopes)
		}

		c.Next()
	}
}

// RequireAppContext middleware que exige app context
func RequireAppContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		_, exists := c.Get("app")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "App context obrigatório. Forneça X-Prost-App-Key e X-Prost-App-Secret nos headers.",
				"docs":  "https://docs.prost-qs.com/api-keys",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// ========================================
// SESSION HELPER
// ========================================

// CreateSessionFromRequest cria sessão a partir da request
func (h *ApplicationHandler) CreateSessionFromRequest(c *gin.Context, appID, appUserID, userID uuid.UUID) (*AppSession, error) {
	ip := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	deviceType := detectDeviceType(userAgent)
	country := "" // Pode ser extraído de GeoIP

	duration := 24 * time.Hour // Default: 24h

	return h.service.CreateSession(appID, appUserID, userID, ip, userAgent, deviceType, country, duration)
}

func detectDeviceType(userAgent string) string {
	// Simplificado - em produção usar biblioteca
	if len(userAgent) == 0 {
		return "unknown"
	}
	ua := userAgent
	if contains(ua, "Mobile") || contains(ua, "Android") || contains(ua, "iPhone") {
		return "mobile"
	}
	if contains(ua, "Tablet") || contains(ua, "iPad") {
		return "tablet"
	}
	return "desktop"
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
