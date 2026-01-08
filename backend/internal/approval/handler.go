package approval

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// APPROVAL HANDLER - API REST
// ========================================

type ApprovalHandler struct {
	service *ApprovalService
}

func NewApprovalHandler(service *ApprovalService) *ApprovalHandler {
	return &ApprovalHandler{service: service}
}

// ========================================
// CREATE REQUEST
// ========================================

// CreateRequest cria uma solicitação de aprovação
// POST /api/v1/approval/request
func (h *ApprovalHandler) CreateRequest(c *gin.Context) {
	var req CreateApprovalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	approvalReq, err := h.service.CreateRequest(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, approvalReq)
}

// ========================================
// DECIDE
// ========================================

// Decide registra uma decisão humana
// POST /api/v1/approval/decide
func (h *ApprovalHandler) Decide(c *gin.Context) {
	// Obter usuário autenticado
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}
	decidedBy, _ := uuid.Parse(userIDStr)

	var req struct {
		RequestID     string `json:"request_id" binding:"required"`
		AuthorityID   string `json:"authority_id" binding:"required"`
		Decision      string `json:"decision" binding:"required"`
		Justification string `json:"justification" binding:"required,min=10"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	requestID, err := uuid.Parse(req.RequestID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "request_id inválido"})
		return
	}

	authorityID, err := uuid.Parse(req.AuthorityID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "authority_id inválido"})
		return
	}

	// Validar decisão
	var decision ApprovalStatus
	switch req.Decision {
	case "approved":
		decision = StatusApproved
	case "rejected":
		decision = StatusRejected
	case "escalated":
		decision = StatusEscalated
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Decisão inválida. Use: approved, rejected, escalated"})
		return
	}

	// Obter IP e User-Agent
	ip := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	decisionEvent, err := h.service.Decide(
		requestID,
		authorityID,
		decidedBy,
		decision,
		req.Justification,
		ip,
		userAgent,
	)

	if err != nil {
		status := http.StatusInternalServerError
		switch err {
		case ErrRequestNotFound:
			status = http.StatusNotFound
		case ErrRequestExpired:
			status = http.StatusGone
		case ErrRequestNotPending:
			status = http.StatusConflict
		case ErrNotEligible:
			status = http.StatusForbidden
		case ErrSelfApproval:
			status = http.StatusForbidden
		case ErrJustificationRequired:
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Decisão registrada com sucesso",
		"decision": decisionEvent,
	})
}

// ========================================
// QUERIES
// ========================================

// GetByID busca request por ID
// GET /api/v1/approval/request/:id
func (h *ApprovalHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	req, err := h.service.GetByID(id)
	if err != nil {
		if err == ErrRequestNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Solicitação não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Buscar decisão se existir
	decision, _ := h.service.GetDecisionByRequest(id)

	c.JSON(http.StatusOK, gin.H{
		"request":  req,
		"decision": decision,
	})
}

// GetPending lista requests pendentes
// GET /api/v1/approval/pending
func (h *ApprovalHandler) GetPending(c *gin.Context) {
	requests, err := h.service.GetPending()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Converter para summaries
	summaries := make([]ApprovalSummary, len(requests))
	for i, req := range requests {
		summaries[i] = ApprovalSummary{
			ID:              req.ID,
			Domain:          req.Domain,
			Action:          req.Action,
			Impact:          string(req.Impact),
			Status:          req.Status,
			RequestedBy:     req.RequestedBy,
			RequestedByType: req.RequestedByType,
			CreatedAt:       req.CreatedAt,
			ExpiresAt:       req.ExpiresAt,
			IsExpired:       req.IsExpired(),
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"pending": summaries,
		"total":   len(summaries),
	})
}

// GetPendingForMe lista requests que o usuário pode decidir
// GET /api/v1/approval/pending/me
func (h *ApprovalHandler) GetPendingForMe(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}
	userID, _ := uuid.Parse(userIDStr)

	// Buscar autoridades do usuário
	// Nota: isso requer acesso ao AuthorityService
	// Por simplicidade, vamos buscar todos pendentes e filtrar no frontend
	// Em produção, isso seria otimizado
	
	requests, err := h.service.GetPending()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Filtrar por autoridades do usuário
	var eligible []ApprovalRequest
	for _, req := range requests {
		for _, auth := range req.EligibleAuthorities.Authorities {
			if auth.UserID == userID {
				eligible = append(eligible, req)
				break
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"pending": eligible,
		"total":   len(eligible),
	})
}

// GetChain busca cadeia de decisões
// GET /api/v1/approval/chain/:requestId
func (h *ApprovalHandler) GetChain(c *gin.Context) {
	idStr := c.Param("requestId")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	chain, err := h.service.GetChain(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, chain)
}

// GetHistory busca histórico
// GET /api/v1/approval/history
func (h *ApprovalHandler) GetHistory(c *gin.Context) {
	// Parse query params
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)
	
	daysStr := c.DefaultQuery("days", "7")
	days, _ := strconv.Atoi(daysStr)
	since := time.Now().AddDate(0, 0, -days)

	requests, err := h.service.GetHistory(since, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"history": requests,
		"total":   len(requests),
		"since":   since,
	})
}

// GetByDomain busca por domínio
// GET /api/v1/approval/domain/:domain
func (h *ApprovalHandler) GetByDomain(c *gin.Context) {
	domain := c.Param("domain")
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)

	requests, err := h.service.GetByDomain(domain, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"domain":   domain,
		"requests": requests,
		"total":    len(requests),
	})
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterApprovalRoutes registra rotas de aprovação
func RegisterApprovalRoutes(router *gin.RouterGroup, service *ApprovalService, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewApprovalHandler(service)

	approval := router.Group("/approval")
	approval.Use(authMiddleware)
	{
		// Criar request (agentes/sistemas podem criar)
		approval.POST("/request", handler.CreateRequest)

		// Decidir (apenas humanos com autoridade)
		approval.POST("/decide", handler.Decide)

		// Queries
		approval.GET("/request/:id", handler.GetByID)
		approval.GET("/pending", handler.GetPending)
		approval.GET("/pending/me", handler.GetPendingForMe)
		approval.GET("/chain/:requestId", handler.GetChain)

		// Admin queries
		approval.GET("/history", adminMiddleware, handler.GetHistory)
		approval.GET("/domain/:domain", adminMiddleware, handler.GetByDomain)
	}
}
