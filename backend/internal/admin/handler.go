package admin

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// ADMIN SUPREMO - HTTP HANDLERS
// "Visibilidade total. Controle absoluto."
// ========================================

// AdminHandler gerencia os endpoints de admin
type AdminHandler struct {
	service *AdminService
}

// NewAdminHandler cria um novo handler
func NewAdminHandler(service *AdminService) *AdminHandler {
	return &AdminHandler{service: service}
}

// BootstrapSuperAdmin cria o primeiro super_admin do sistema
// POST /api/v1/admin/bootstrap
// Este endpoint só funciona se não existir nenhum super_admin
func (h *AdminHandler) BootstrapSuperAdmin(c *gin.Context) {
	var req struct {
		Phone string `json:"phone" binding:"required"`
		Name  string `json:"name" binding:"required"`
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.service.BootstrapSuperAdmin(req.Phone, req.Name, req.Email)
	if err != nil {
		if err.Error() == "super_admin already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": "Já existe um super_admin no sistema"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar super_admin"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Super Admin criado com sucesso",
		"user_id": user.ID.String(),
		"phone":   req.Phone,
		"name":    req.Name,
		"email":   req.Email,
		"role":    "super_admin",
	})
}

// ========================================
// RESPONSE TYPES
// ========================================

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}

func paginate(data interface{}, total int64, page, limit int) PaginatedResponse {
	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}
	return PaginatedResponse{
		Data:       data,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}
}

// ========================================
// DASHBOARD
// ========================================

// GetDashboard retorna estatísticas do dashboard
// @Summary Dashboard do Admin
// @Tags Admin
// @Produce json
// @Success 200 {object} DashboardStats
// @Router /admin/dashboard [get]
func (h *AdminHandler) GetDashboard(c *gin.Context) {
	stats, err := h.service.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar estatísticas"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

// ========================================
// IDENTITIES
// ========================================

// ListIdentities lista todas as identidades
// @Summary Lista identidades
// @Tags Admin
// @Produce json
// @Param page query int false "Página" default(1)
// @Param limit query int false "Limite" default(20)
// @Success 200 {object} PaginatedResponse
// @Router /admin/identities [get]
func (h *AdminHandler) ListIdentities(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	identities, total, err := h.service.ListIdentities(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar identidades"})
		return
	}

	c.JSON(http.StatusOK, paginate(identities, total, page, limit))
}

// GetIdentity busca uma identidade específica
// @Summary Busca identidade
// @Tags Admin
// @Produce json
// @Param userId path string true "User ID"
// @Success 200 {object} IdentityView
// @Router /admin/identities/{userId} [get]
func (h *AdminHandler) GetIdentity(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	identity, err := h.service.GetIdentity(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Identidade não encontrada"})
		return
	}

	c.JSON(http.StatusOK, identity)
}

// ========================================
// PAYMENTS
// ========================================

// ListPayments lista todos os pagamentos
// @Summary Lista pagamentos
// @Tags Admin
// @Produce json
// @Param page query int false "Página" default(1)
// @Param limit query int false "Limite" default(20)
// @Param status query string false "Status filter"
// @Success 200 {object} PaginatedResponse
// @Router /admin/payments [get]
func (h *AdminHandler) ListPayments(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	payments, total, err := h.service.ListPayments(page, limit, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar pagamentos"})
		return
	}

	c.JSON(http.StatusOK, paginate(payments, total, page, limit))
}

// ========================================
// SUBSCRIPTIONS
// ========================================

// ListSubscriptions lista todas as assinaturas
// @Summary Lista assinaturas
// @Tags Admin
// @Produce json
// @Param page query int false "Página" default(1)
// @Param limit query int false "Limite" default(20)
// @Param status query string false "Status filter"
// @Success 200 {object} PaginatedResponse
// @Router /admin/subscriptions [get]
func (h *AdminHandler) ListSubscriptions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	subs, total, err := h.service.ListSubscriptions(page, limit, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar assinaturas"})
		return
	}

	c.JSON(http.StatusOK, paginate(subs, total, page, limit))
}

// ========================================
// LEDGER
// ========================================

// ListLedgerEntries lista entradas do ledger
// @Summary Lista ledger
// @Tags Admin
// @Produce json
// @Param page query int false "Página" default(1)
// @Param limit query int false "Limite" default(50)
// @Param account_id query string false "Account ID filter"
// @Success 200 {object} PaginatedResponse
// @Router /admin/ledger [get]
func (h *AdminHandler) ListLedgerEntries(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	accountID := c.Query("account_id")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}

	entries, total, err := h.service.ListLedgerEntries(page, limit, accountID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar ledger"})
		return
	}

	c.JSON(http.StatusOK, paginate(entries, total, page, limit))
}

// ========================================
// PAYOUTS
// ========================================

// ListPayouts lista todos os payouts
// @Summary Lista payouts
// @Tags Admin
// @Produce json
// @Param page query int false "Página" default(1)
// @Param limit query int false "Limite" default(20)
// @Param status query string false "Status filter"
// @Success 200 {object} PaginatedResponse
// @Router /admin/payouts [get]
func (h *AdminHandler) ListPayouts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	payouts, total, err := h.service.ListPayouts(page, limit, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar payouts"})
		return
	}

	c.JSON(http.StatusOK, paginate(payouts, total, page, limit))
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// ========================================
// USER MANAGEMENT
// ========================================

// ListUsers lista todos os usuários
func (h *AdminHandler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	users, total, err := h.service.ListUsers(page, limit, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar usuários"})
		return
	}

	c.JSON(http.StatusOK, paginate(users, total, page, limit))
}

// GetUser busca um usuário específico
func (h *AdminHandler) GetUser(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	user, err := h.service.GetUserDetails(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// SuspendUser suspende um usuário
func (h *AdminHandler) SuspendUser(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	if err := h.service.SuspendUser(userID, req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao suspender usuário"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuário suspenso"})
}

// BanUser bane um usuário
func (h *AdminHandler) BanUser(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	if err := h.service.BanUser(userID, req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao banir usuário"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuário banido"})
}

// ReactivateUser reativa um usuário
func (h *AdminHandler) ReactivateUser(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.ReactivateUser(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao reativar usuário"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuário reativado"})
}

// SetUserRole define o role de um usuário
func (h *AdminHandler) SetUserRole(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Role string `json:"role" binding:"required,oneof=user admin super_admin"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.SetUserRole(userID, req.Role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao definir role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role atualizado"})
}

// ========================================
// ECONOMY OVERVIEW
// ========================================

// GetEconomyOverview retorna visão geral da economia
func (h *AdminHandler) GetEconomyOverview(c *gin.Context) {
	overview, err := h.service.GetEconomyOverview()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar economia"})
		return
	}
	c.JSON(http.StatusOK, overview)
}

// ========================================
// DISPUTED
// ========================================

// ListDisputed lista entidades em estado DISPUTED
func (h *AdminHandler) ListDisputed(c *gin.Context) {
	disputed, err := h.service.ListDisputed()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar disputed"})
		return
	}
	c.JSON(http.StatusOK, disputed)
}

// ResolveDisputed resolve uma entidade DISPUTED
func (h *AdminHandler) ResolveDisputed(c *gin.Context) {
	entityType := c.Param("type")
	entityID := c.Param("id")

	var req struct {
		Resolution string `json:"resolution" binding:"required"`
		Note       string `json:"note"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adminID := c.GetString("userID")

	if err := h.service.ResolveDisputed(entityType, entityID, req.Resolution, req.Note, adminID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao resolver disputed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Disputed resolvido"})
}

// ========================================
// JOBS
// ========================================

// ListJobs lista jobs do sistema
func (h *AdminHandler) ListJobs(c *gin.Context) {
	status := c.Query("status")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	jobs, err := h.service.ListJobs(status, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar jobs"})
		return
	}
	c.JSON(http.StatusOK, jobs)
}

// RetryJob reexecuta um job falho
func (h *AdminHandler) RetryJob(c *gin.Context) {
	jobID := c.Param("jobId")

	if err := h.service.RetryJob(jobID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao reexecutar job"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Job reenfileirado"})
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterAdminRoutes registra as rotas de admin
func RegisterAdminRoutes(router *gin.RouterGroup, service *AdminService, authMiddleware gin.HandlerFunc, adminMiddleware gin.HandlerFunc) {
	handler := NewAdminHandler(service)

	// Bootstrap endpoint - criar primeiro super_admin (sem auth)
	router.POST("/admin/bootstrap", handler.BootstrapSuperAdmin)

	admin := router.Group("/admin")
	admin.Use(authMiddleware)
	admin.Use(adminMiddleware) // Verifica role admin
	{
		// Dashboard
		admin.GET("/dashboard", handler.GetDashboard)

		// Users (novo)
		admin.GET("/users", handler.ListUsers)
		admin.GET("/users/:userId", handler.GetUser)
		admin.POST("/users/:userId/suspend", handler.SuspendUser)
		admin.POST("/users/:userId/ban", handler.BanUser)
		admin.POST("/users/:userId/reactivate", handler.ReactivateUser)
		admin.POST("/users/:userId/role", handler.SetUserRole)

		// Economy
		admin.GET("/economy/overview", handler.GetEconomyOverview)

		// Identities (legacy)
		admin.GET("/identities", handler.ListIdentities)
		admin.GET("/identities/:userId", handler.GetIdentity)

		// Payments
		admin.GET("/payments", handler.ListPayments)

		// Subscriptions
		admin.GET("/subscriptions", handler.ListSubscriptions)

		// Ledger
		admin.GET("/ledger", handler.ListLedgerEntries)

		// Payouts
		admin.GET("/payouts", handler.ListPayouts)

		// Disputed
		admin.GET("/disputed", handler.ListDisputed)
		admin.POST("/disputed/:type/:id/resolve", handler.ResolveDisputed)

		// Jobs
		admin.GET("/jobs", handler.ListJobs)
		admin.POST("/jobs/:jobId/retry", handler.RetryJob)
	}
}
