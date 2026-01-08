package memory

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// MEMORY HANDLER - FASE 14
// Endpoints INTERNOS apenas (sem API pública)
// ========================================

// MemoryHandler handles memory-related HTTP requests
type MemoryHandler struct {
	service *MemoryService
}

// NewMemoryHandler creates a new memory handler
func NewMemoryHandler(service *MemoryService) *MemoryHandler {
	return &MemoryHandler{service: service}
}

// RegisterMemoryRoutes registra rotas de memória institucional
// NOTA: Apenas rotas internas para administração
func RegisterMemoryRoutes(r *gin.RouterGroup, service *MemoryService, authMiddleware, adminOnly gin.HandlerFunc) {
	handler := NewMemoryHandler(service)

	memory := r.Group("/memory")
	memory.Use(authMiddleware, adminOnly)
	{
		// Lifecycle
		memory.GET("/lifecycle/:decision_id", handler.GetLifecycle)
		memory.POST("/lifecycle", handler.CreateLifecycle)
		memory.POST("/lifecycle/:decision_id/review", handler.InitiateReview)
		memory.POST("/lifecycle/:decision_id/revoke", handler.RevokeDecision)
		
		// Conflicts
		memory.GET("/conflicts", handler.ListOpenConflicts)
		memory.POST("/conflicts/:id/acknowledge", handler.AcknowledgeConflict)
		memory.POST("/conflicts/:id/resolve", handler.ResolveConflict)
		
		// Precedents (read-only focus)
		memory.GET("/precedents", handler.ListPrecedents)
		memory.POST("/precedents", handler.CreatePrecedent)
		memory.POST("/precedents/:id/deprecate", handler.DeprecatePrecedent)
		
		// Reviews
		memory.GET("/reviews/pending", handler.ListPendingReviews)
		memory.POST("/reviews/:id/complete", handler.CompleteReview)
		
		// Execution check (utility)
		memory.GET("/can-execute/:decision_id", handler.CanExecute)
	}
}

// ========================================
// LIFECYCLE HANDLERS
// ========================================

// GetLifecycle retorna lifecycle de uma decisão
func (h *MemoryHandler) GetLifecycle(c *gin.Context) {
	decisionIDStr := c.Param("decision_id")
	decisionID, err := uuid.Parse(decisionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "decision_id inválido"})
		return
	}

	lifecycle, err := h.service.GetLifecycle(decisionID)
	if err != nil {
		if err == ErrLifecycleNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "lifecycle não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, lifecycle)
}

// CreateLifecycleRequest DTO
type CreateLifecycleHTTPRequest struct {
	DecisionID       string `json:"decision_id" binding:"required"`
	DecisionType     string `json:"decision_type" binding:"required"`
	Domain           string `json:"domain" binding:"required"`
	Action           string `json:"action" binding:"required"`
	ExpirationType   string `json:"expiration_type" binding:"required"`
	ExpiresAt        string `json:"expires_at,omitempty"`
	ExpiresCondition string `json:"expires_condition,omitempty"`
	ReviewEveryDays  *int   `json:"review_every_days,omitempty"`
}

// CreateLifecycle cria lifecycle para decisão
func (h *MemoryHandler) CreateLifecycle(c *gin.Context) {
	var req CreateLifecycleHTTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	decisionID, err := uuid.Parse(req.DecisionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "decision_id inválido"})
		return
	}

	createReq := CreateLifecycleRequest{
		DecisionID:       decisionID,
		DecisionType:     req.DecisionType,
		Domain:           req.Domain,
		Action:           req.Action,
		ExpirationType:   ExpirationType(req.ExpirationType),
		ExpiresCondition: req.ExpiresCondition,
		ReviewEveryDays:  req.ReviewEveryDays,
	}

	// Parse expires_at if provided
	if req.ExpiresAt != "" {
		// Implementar parse de data se necessário
	}

	lifecycle, err := h.service.CreateLifecycle(createReq)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, lifecycle)
}

// InitiateReviewRequest DTO
type InitiateReviewHTTPRequest struct {
	ReviewType   string `json:"review_type" binding:"required"`
	ReviewReason string `json:"review_reason" binding:"required"`
}

// InitiateReview inicia revisão de decisão
func (h *MemoryHandler) InitiateReview(c *gin.Context) {
	decisionIDStr := c.Param("decision_id")
	decisionID, err := uuid.Parse(decisionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "decision_id inválido"})
		return
	}

	var req InitiateReviewHTTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context (middleware uses "userID")
	userIDStr := c.GetString("userID")
	initiatedBy, _ := uuid.Parse(userIDStr)

	review, err := h.service.CreateReview(CreateReviewRequest{
		DecisionID:   decisionID,
		ReviewType:   ReviewType(req.ReviewType),
		ReviewReason: req.ReviewReason,
		InitiatedBy:  initiatedBy,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, review)
}

// RevokeDecisionRequest DTO
type RevokeDecisionHTTPRequest struct {
	Reason string `json:"reason" binding:"required,min=10"`
}

// RevokeDecision revoga decisão
func (h *MemoryHandler) RevokeDecision(c *gin.Context) {
	decisionIDStr := c.Param("decision_id")
	decisionID, err := uuid.Parse(decisionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "decision_id inválido"})
		return
	}

	var req RevokeDecisionHTTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr := c.GetString("userID")
	revokedBy, _ := uuid.Parse(userIDStr)

	if err := h.service.TransitionToRevoked(decisionID, revokedBy, req.Reason); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "decisão revogada com sucesso"})
}

// ========================================
// CONFLICT HANDLERS
// ========================================

// ListOpenConflicts lista conflitos abertos
func (h *MemoryHandler) ListOpenConflicts(c *gin.Context) {
	domain := c.Query("domain")
	conflicts, err := h.service.GetOpenConflicts(domain)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, conflicts)
}

// AcknowledgeConflict marca conflito como reconhecido
func (h *MemoryHandler) AcknowledgeConflict(c *gin.Context) {
	conflictIDStr := c.Param("id")
	conflictID, err := uuid.Parse(conflictIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	userIDStr := c.GetString("userID")
	acknowledgedBy, _ := uuid.Parse(userIDStr)

	if err := h.service.AcknowledgeConflict(conflictID, acknowledgedBy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "conflito reconhecido"})
}

// ResolveConflictHTTPRequest DTO
type ResolveConflictHTTPRequest struct {
	Resolution        string `json:"resolution" binding:"required,min=10"`
	PrevailingID      string `json:"prevailing_id" binding:"required"`
	NonPrevailingFate string `json:"non_prevailing_fate" binding:"required,oneof=revoked superseded under_review"`
}

// ResolveConflict resolve conflito
func (h *MemoryHandler) ResolveConflict(c *gin.Context) {
	conflictIDStr := c.Param("id")
	conflictID, err := uuid.Parse(conflictIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var req ResolveConflictHTTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prevailingID, err := uuid.Parse(req.PrevailingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "prevailing_id inválido"})
		return
	}

	userIDStr := c.GetString("userID")
	resolvedBy, _ := uuid.Parse(userIDStr)

	if err := h.service.ResolveConflict(ResolveConflictRequest{
		ConflictID:        conflictID,
		ResolvedBy:        resolvedBy,
		Resolution:        req.Resolution,
		PrevailingID:      prevailingID,
		NonPrevailingFate: req.NonPrevailingFate,
	}); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "conflito resolvido"})
}

// ========================================
// PRECEDENT HANDLERS
// ========================================

// ListPrecedents lista precedentes
func (h *MemoryHandler) ListPrecedents(c *gin.Context) {
	domain := c.Query("domain")
	action := c.Query("action")

	if domain == "" || action == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "domain e action são obrigatórios"})
		return
	}

	precedents, err := h.service.ListPrecedentsForContext(domain, action)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Formatar para apresentação neutra
	var formatted []gin.H
	for _, p := range precedents {
		formatted = append(formatted, gin.H{
			"id":           p.ID,
			"domain":       p.Domain,
			"action":       p.Action,
			"decision_date": p.DecisionDate,
			"presentation": h.service.FormatPrecedentForPresentation(&p),
			"state":        p.State,
		})
	}

	c.JSON(http.StatusOK, formatted)
}

// CreatePrecedentHTTPRequest DTO
type CreatePrecedentHTTPRequest struct {
	OriginalDecisionID     string   `json:"original_decision_id" binding:"required"`
	AuthorityRole          string   `json:"authority_role" binding:"required"`
	OriginalJustification  string   `json:"original_justification" binding:"required"`
	WhatHappened           string   `json:"what_happened" binding:"required"`
	ObservedEffects        []string `json:"observed_effects"`
	UnforeseenConsequences []string `json:"unforeseen_consequences"`
	CreationReason         string   `json:"creation_reason" binding:"required"`
}

// CreatePrecedent cria precedente
func (h *MemoryHandler) CreatePrecedent(c *gin.Context) {
	var req CreatePrecedentHTTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	originalDecisionID, err := uuid.Parse(req.OriginalDecisionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "original_decision_id inválido"})
		return
	}

	userIDStr := c.GetString("userID")
	createdBy, _ := uuid.Parse(userIDStr)

	precedent, err := h.service.CreatePrecedent(CreatePrecedentRequest{
		OriginalDecisionID: originalDecisionID,
		OriginalContext: PrecedentContext{
			AuthorityRole:         req.AuthorityRole,
			OriginalJustification: req.OriginalJustification,
		},
		WhatHappened:           req.WhatHappened,
		ObservedEffects:        req.ObservedEffects,
		UnforeseenConsequences: req.UnforeseenConsequences,
		CreatedBy:              createdBy,
		CreationReason:         req.CreationReason,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, precedent)
}

// DeprecatePrecedentHTTPRequest DTO
type DeprecatePrecedentHTTPRequest struct {
	Reason string `json:"reason" binding:"required,min=10"`
}

// DeprecatePrecedent depreca precedente
func (h *MemoryHandler) DeprecatePrecedent(c *gin.Context) {
	precedentIDStr := c.Param("id")
	precedentID, err := uuid.Parse(precedentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var req DeprecatePrecedentHTTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr := c.GetString("userID")
	deprecatedBy, _ := uuid.Parse(userIDStr)

	if err := h.service.DeprecatePrecedent(precedentID, deprecatedBy, req.Reason); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "precedente deprecado"})
}

// ========================================
// REVIEW HANDLERS
// ========================================

// ListPendingReviews lista revisões pendentes
func (h *MemoryHandler) ListPendingReviews(c *gin.Context) {
	reviews, err := h.service.GetPendingReviews()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reviews)
}

// CompleteReviewHTTPRequest DTO
type CompleteReviewHTTPRequest struct {
	Outcome       string  `json:"outcome" binding:"required,oneof=renewed revoked superseded"`
	OutcomeReason string  `json:"outcome_reason" binding:"required,min=10"`
	NewDecisionID *string `json:"new_decision_id,omitempty"`
	NewExpiresAt  *string `json:"new_expires_at,omitempty"`
}

// CompleteReview completa revisão
func (h *MemoryHandler) CompleteReview(c *gin.Context) {
	reviewIDStr := c.Param("id")
	reviewID, err := uuid.Parse(reviewIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var req CompleteReviewHTTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr := c.GetString("userID")
	decidedBy, _ := uuid.Parse(userIDStr)

	completeReq := CompleteReviewRequest{
		ReviewID:      reviewID,
		Outcome:       ReviewOutcome(req.Outcome),
		OutcomeReason: req.OutcomeReason,
		DecidedBy:     decidedBy,
	}

	if req.NewDecisionID != nil {
		newDecisionID, _ := uuid.Parse(*req.NewDecisionID)
		completeReq.NewDecisionID = &newDecisionID
	}

	if err := h.service.CompleteReview(completeReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "revisão concluída"})
}

// ========================================
// UTILITY HANDLERS
// ========================================

// CanExecute verifica se decisão pode ser executada
func (h *MemoryHandler) CanExecute(c *gin.Context) {
	decisionIDStr := c.Param("decision_id")
	decisionID, err := uuid.Parse(decisionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "decision_id inválido"})
		return
	}

	canExecute, reason, err := h.service.CanExecute(decisionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"can_execute": canExecute,
		"reason":      reason,
	})
}
