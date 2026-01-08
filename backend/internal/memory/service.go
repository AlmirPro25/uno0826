package memory

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// INSTITUTIONAL MEMORY SERVICE - FASE 14
// "O sistema sabe se uma decisão pode produzir efeitos"
// ========================================

var (
	// ErrDecisionNotActive - decisão não está ativa
	ErrDecisionNotActive = errors.New("decisão não está ativa")
	
	// ErrDecisionExpired - decisão expirou
	ErrDecisionExpired = errors.New("decisão expirou")
	
	// ErrOpenConflict - existe conflito aberto
	ErrOpenConflict = errors.New("existe conflito aberto bloqueando execução")
	
	// ErrLifecycleNotFound - lifecycle não encontrado
	ErrLifecycleNotFound = errors.New("lifecycle não encontrado para esta decisão")
	
	// ErrInvalidTransition - transição de estado inválida
	ErrInvalidTransition = errors.New("transição de estado não permitida")
	
	// ErrMissingExpiration - decisão sem configuração de expiração
	ErrMissingExpiration = errors.New("decisão deve declarar tipo de expiração")
)

// MemoryService - serviço de memória institucional
type MemoryService struct {
	db *gorm.DB
}

// NewMemoryService cria novo serviço de memória
func NewMemoryService(db *gorm.DB) *MemoryService {
	return &MemoryService{db: db}
}

// ========================================
// INTERFACES OBRIGATÓRIAS (Tech Lead)
// ========================================

// IsDecisionActive verifica se uma decisão está ativa e pode produzir efeitos
// Esta é a verificação OBRIGATÓRIA antes de qualquer execução
func (s *MemoryService) IsDecisionActive(decisionID uuid.UUID) (bool, error) {
	var lifecycle DecisionLifecycle
	err := s.db.Where("decision_id = ?", decisionID).First(&lifecycle).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Se não tem lifecycle, considera como não gerenciado (backward compatibility)
			return true, nil
		}
		return false, err
	}
	
	// Verificar estado
	if lifecycle.State != StateActive {
		return false, nil
	}
	
	// Verificar expiração temporal
	if lifecycle.IsExpired() {
		// Auto-transição para expired (pelo sistema)
		_ = s.transitionState(&lifecycle, StateExpired, uuid.Nil, "system", "Expiração temporal automática")
		return false, nil
	}
	
	return true, nil
}

// HasOpenConflict verifica se existe conflito aberto para uma decisão
// Conflito aberto = execução bloqueada
func (s *MemoryService) HasOpenConflict(decisionID uuid.UUID) (bool, any, error) {
	var conflict DecisionConflict
	err := s.db.Where(
		"(decision_a_id = ? OR decision_b_id = ?) AND state IN (?, ?)",
		decisionID, decisionID,
		ConflictDetected, ConflictAcknowledged,
	).First(&conflict).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil, nil
		}
		return false, nil, err
	}
	
	return true, &conflict, nil
}

// ListPrecedentsForContext lista precedentes relevantes para um contexto
// Apresentação neutra, sem scoring, sem ranking
func (s *MemoryService) ListPrecedentsForContext(domain, action string) ([]DecisionPrecedent, error) {
	var precedents []DecisionPrecedent
	err := s.db.Where(
		"domain = ? AND action = ? AND state = ?",
		domain, action, PrecedentActive,
	).Order("decision_date DESC").Limit(10).Find(&precedents).Error
	
	return precedents, err
}


// ========================================
// LIFECYCLE MANAGEMENT
// ========================================

// CreateLifecycle cria lifecycle para uma decisão
// REGRA: Toda decisão DEVE declarar tipo de expiração
func (s *MemoryService) CreateLifecycle(req CreateLifecycleRequest) (*DecisionLifecycle, error) {
	// Validar tipo de expiração obrigatório
	if req.ExpirationType == "" {
		return nil, ErrMissingExpiration
	}
	
	// Validar configuração de expiração
	switch req.ExpirationType {
	case ExpiresAtDate:
		if req.ExpiresAt == nil {
			return nil, fmt.Errorf("expires_at requer data de expiração")
		}
	case ExpiresOnCondition:
		if req.ExpiresCondition == "" {
			return nil, fmt.Errorf("expires_on_condition requer condição")
		}
	case ReviewRequired:
		if req.ReviewEveryDays == nil || *req.ReviewEveryDays <= 0 {
			return nil, fmt.Errorf("review_required requer intervalo em dias")
		}
	}
	
	now := time.Now()
	lifecycle := &DecisionLifecycle{
		ID:               uuid.New(),
		DecisionID:       req.DecisionID,
		DecisionType:     req.DecisionType,
		State:            StateActive,
		ExpirationType:   req.ExpirationType,
		ExpiresAt:        req.ExpiresAt,
		ExpiresCondition: req.ExpiresCondition,
		ReviewEveryDays:  req.ReviewEveryDays,
		Domain:           req.Domain,
		Action:           req.Action,
		StateChangedAt:   now,
		CreatedAt:        now,
		UpdatedAt:        now,
	}
	
	// Calcular próxima revisão se aplicável
	if req.ReviewEveryDays != nil {
		nextReview := now.AddDate(0, 0, *req.ReviewEveryDays)
		lifecycle.NextReviewAt = &nextReview
	}
	
	if err := s.db.Create(lifecycle).Error; err != nil {
		return nil, err
	}
	
	// Registrar transição inicial
	s.logTransition(lifecycle.DecisionID, "", StateActive, uuid.Nil, "system", "Lifecycle criado")
	
	return lifecycle, nil
}

// GetLifecycle obtém lifecycle de uma decisão
func (s *MemoryService) GetLifecycle(decisionID uuid.UUID) (*DecisionLifecycle, error) {
	var lifecycle DecisionLifecycle
	err := s.db.Where("decision_id = ?", decisionID).First(&lifecycle).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrLifecycleNotFound
		}
		return nil, err
	}
	return &lifecycle, nil
}

// TransitionToExpired marca decisão como expirada
func (s *MemoryService) TransitionToExpired(decisionID uuid.UUID, triggeredBy uuid.UUID, reason string) error {
	lifecycle, err := s.GetLifecycle(decisionID)
	if err != nil {
		return err
	}
	return s.transitionState(lifecycle, StateExpired, triggeredBy, "human", reason)
}

// TransitionToUnderReview coloca decisão em revisão
func (s *MemoryService) TransitionToUnderReview(decisionID uuid.UUID, triggeredBy uuid.UUID, reason string) error {
	lifecycle, err := s.GetLifecycle(decisionID)
	if err != nil {
		return err
	}
	return s.transitionState(lifecycle, StateUnderReview, triggeredBy, "human", reason)
}

// TransitionToRevoked revoga decisão (irreversível)
func (s *MemoryService) TransitionToRevoked(decisionID uuid.UUID, triggeredBy uuid.UUID, reason string) error {
	lifecycle, err := s.GetLifecycle(decisionID)
	if err != nil {
		return err
	}
	return s.transitionState(lifecycle, StateRevoked, triggeredBy, "human", reason)
}

// RenewDecision renova decisão após revisão (under_review -> active)
func (s *MemoryService) RenewDecision(decisionID uuid.UUID, triggeredBy uuid.UUID, reason string, newExpiresAt *time.Time) error {
	lifecycle, err := s.GetLifecycle(decisionID)
	if err != nil {
		return err
	}
	
	if lifecycle.State != StateUnderReview {
		return fmt.Errorf("apenas decisões em under_review podem ser renovadas")
	}
	
	// Atualizar expiração se fornecida
	if newExpiresAt != nil {
		lifecycle.ExpiresAt = newExpiresAt
	}
	
	// Recalcular próxima revisão se aplicável
	if lifecycle.ReviewEveryDays != nil {
		nextReview := time.Now().AddDate(0, 0, *lifecycle.ReviewEveryDays)
		lifecycle.NextReviewAt = &nextReview
	}
	
	return s.transitionState(lifecycle, StateActive, triggeredBy, "human", reason)
}

// SupersedeDecision substitui decisão por outra
func (s *MemoryService) SupersedeDecision(oldDecisionID, newDecisionID uuid.UUID, triggeredBy uuid.UUID, reason string) error {
	lifecycle, err := s.GetLifecycle(oldDecisionID)
	if err != nil {
		return err
	}
	
	lifecycle.SupersededBy = &newDecisionID
	return s.transitionState(lifecycle, StateSuperseded, triggeredBy, "human", reason)
}

// transitionState executa transição de estado com validação
func (s *MemoryService) transitionState(lifecycle *DecisionLifecycle, newState LifecycleState, triggeredBy uuid.UUID, triggeredByType, reason string) error {
	// Validar transição
	if !s.isValidTransition(lifecycle.State, newState) {
		return fmt.Errorf("%w: %s -> %s", ErrInvalidTransition, lifecycle.State, newState)
	}
	
	oldState := lifecycle.State
	now := time.Now()
	
	lifecycle.State = newState
	lifecycle.StateChangedAt = now
	lifecycle.StateChangedBy = &triggeredBy
	lifecycle.StateChangeReason = reason
	lifecycle.UpdatedAt = now
	
	if err := s.db.Save(lifecycle).Error; err != nil {
		return err
	}
	
	// Registrar transição
	s.logTransition(lifecycle.DecisionID, oldState, newState, triggeredBy, triggeredByType, reason)
	
	return nil
}

// isValidTransition verifica se transição é permitida
func (s *MemoryService) isValidTransition(from, to LifecycleState) bool {
	// Transições permitidas conforme especificação
	allowed := map[LifecycleState][]LifecycleState{
		StateActive:      {StateExpired, StateUnderReview, StateSuperseded, StateRevoked},
		StateUnderReview: {StateActive, StateRevoked}, // active = renovação
		StateExpired:     {StateUnderReview},          // reanálise consciente
		StateSuperseded:  {},                          // terminal
		StateRevoked:     {},                          // terminal
	}
	
	validTargets, exists := allowed[from]
	if !exists {
		return false
	}
	
	for _, valid := range validTargets {
		if valid == to {
			return true
		}
	}
	return false
}

// logTransition registra transição no log imutável
func (s *MemoryService) logTransition(decisionID uuid.UUID, from, to LifecycleState, triggeredBy uuid.UUID, triggeredByType, reason string) {
	transition := LifecycleTransition{
		ID:              uuid.New(),
		DecisionID:      decisionID,
		FromState:       from,
		ToState:         to,
		TriggeredBy:     triggeredBy,
		TriggeredByType: triggeredByType,
		Reason:          reason,
		TransitionedAt:  time.Now(),
	}
	
	// Gerar hash de integridade
	transition.Hash = s.generateTransitionHash(&transition)
	
	s.db.Create(&transition)
}

// generateTransitionHash gera hash de integridade
func (s *MemoryService) generateTransitionHash(t *LifecycleTransition) string {
	data := fmt.Sprintf("%s|%s|%s|%s|%s|%s|%s",
		t.ID, t.DecisionID, t.FromState, t.ToState,
		t.TriggeredBy, t.TriggeredByType, t.TransitionedAt.Format(time.RFC3339),
	)
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// ========================================
// CONFLICT MANAGEMENT
// ========================================

// DetectConflict detecta e registra conflito entre decisões
func (s *MemoryService) DetectConflict(req DetectConflictRequest) (*DecisionConflict, error) {
	// Verificar se ambas decisões estão ativas
	activeA, _ := s.IsDecisionActive(req.DecisionAID)
	activeB, _ := s.IsDecisionActive(req.DecisionBID)
	
	if !activeA || !activeB {
		return nil, fmt.Errorf("conflito só pode existir entre decisões ativas")
	}
	
	now := time.Now()
	conflict := &DecisionConflict{
		ID:           uuid.New(),
		DecisionAID:  req.DecisionAID,
		DecisionBID:  req.DecisionBID,
		ConflictType: req.ConflictType,
		State:        ConflictDetected,
		Description:  req.Description,
		Domain:       req.Domain,
		DetectedAt:   now,
		DetectedBy:   req.DetectedBy,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	
	if err := s.db.Create(conflict).Error; err != nil {
		return nil, err
	}
	
	return conflict, nil
}

// AcknowledgeConflict marca conflito como reconhecido
func (s *MemoryService) AcknowledgeConflict(conflictID uuid.UUID, acknowledgedBy uuid.UUID) error {
	now := time.Now()
	return s.db.Model(&DecisionConflict{}).
		Where("id = ? AND state = ?", conflictID, ConflictDetected).
		Updates(map[string]any{
			"state":           ConflictAcknowledged,
			"acknowledged_at": now,
			"acknowledged_by": acknowledgedBy,
			"updated_at":      now,
		}).Error
}

// ResolveConflict resolve conflito (apenas humano com autoridade)
func (s *MemoryService) ResolveConflict(req ResolveConflictRequest) error {
	var conflict DecisionConflict
	if err := s.db.First(&conflict, "id = ?", req.ConflictID).Error; err != nil {
		return err
	}
	
	if conflict.State == ConflictResolved || conflict.State == ConflictDissolved {
		return fmt.Errorf("conflito já foi resolvido ou dissolvido")
	}
	
	now := time.Now()
	conflict.State = ConflictResolved
	conflict.ResolvedAt = &now
	conflict.ResolvedBy = &req.ResolvedBy
	conflict.Resolution = req.Resolution
	conflict.PrevailingID = &req.PrevailingID
	conflict.NonPrevailingFate = req.NonPrevailingFate
	conflict.UpdatedAt = now
	
	if err := s.db.Save(&conflict).Error; err != nil {
		return err
	}
	
	// Aplicar destino à decisão não-prevalecente
	nonPrevailingID := conflict.DecisionAID
	if conflict.DecisionAID == req.PrevailingID {
		nonPrevailingID = conflict.DecisionBID
	}
	
	switch req.NonPrevailingFate {
	case "revoked":
		return s.TransitionToRevoked(nonPrevailingID, req.ResolvedBy, "Revogada por resolução de conflito: "+req.Resolution)
	case "superseded":
		return s.SupersedeDecision(nonPrevailingID, req.PrevailingID, req.ResolvedBy, "Substituída por resolução de conflito: "+req.Resolution)
	case "under_review":
		return s.TransitionToUnderReview(nonPrevailingID, req.ResolvedBy, "Em revisão por resolução de conflito: "+req.Resolution)
	}
	
	return nil
}

// GetOpenConflicts lista conflitos abertos
func (s *MemoryService) GetOpenConflicts(domain string) ([]DecisionConflict, error) {
	var conflicts []DecisionConflict
	query := s.db.Where("state IN (?, ?)", ConflictDetected, ConflictAcknowledged)
	if domain != "" {
		query = query.Where("domain = ?", domain)
	}
	err := query.Order("detected_at DESC").Find(&conflicts).Error
	return conflicts, err
}

// ========================================
// PRECEDENT MANAGEMENT (Read-Only Focus)
// ========================================

// CreatePrecedent cria precedente (apenas humano, decisão já encerrada)
func (s *MemoryService) CreatePrecedent(req CreatePrecedentRequest) (*DecisionPrecedent, error) {
	// Verificar se decisão existe e está encerrada
	lifecycle, err := s.GetLifecycle(req.OriginalDecisionID)
	if err != nil {
		return nil, err
	}
	
	// Precedente só nasce de decisão encerrada
	if lifecycle.State == StateActive || lifecycle.State == StateUnderReview {
		return nil, fmt.Errorf("precedente só pode ser criado de decisão encerrada (expired, superseded, revoked)")
	}
	
	now := time.Now()
	precedent := &DecisionPrecedent{
		ID:                 uuid.New(),
		OriginalDecisionID: req.OriginalDecisionID,
		DecisionType:       lifecycle.DecisionType,
		Domain:             lifecycle.Domain,
		Action:             lifecycle.Action,
		OriginalContext:    req.OriginalContext,
		ObservedResult: PrecedentResult{
			WhatHappened:           req.WhatHappened,
			ObservedEffects:        req.ObservedEffects,
			UnforeseenConsequences: req.UnforeseenConsequences,
			LifecycleEndedAt:       lifecycle.StateChangedAt,
			LifecycleEndState:      string(lifecycle.State),
		},
		State:          PrecedentActive,
		CreatedBy:      req.CreatedBy,
		CreationReason: req.CreationReason,
		DecisionDate:   lifecycle.CreatedAt,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	
	if err := s.db.Create(precedent).Error; err != nil {
		return nil, err
	}
	
	return precedent, nil
}

// DeprecatePrecedent marca precedente como desatualizado
func (s *MemoryService) DeprecatePrecedent(precedentID uuid.UUID, deprecatedBy uuid.UUID, reason string) error {
	now := time.Now()
	return s.db.Model(&DecisionPrecedent{}).
		Where("id = ? AND state = ?", precedentID, PrecedentActive).
		Updates(map[string]any{
			"state":              PrecedentDeprecated,
			"deprecated_at":      now,
			"deprecated_by":      deprecatedBy,
			"deprecation_reason": reason,
			"updated_at":         now,
		}).Error
}

// FormatPrecedentForPresentation formata precedente para apresentação neutra
// REGRA: Sem scoring, sem ranking, sem recomendação
func (s *MemoryService) FormatPrecedentForPresentation(p *DecisionPrecedent) string {
	return fmt.Sprintf(
		"Em %s, %s decidiu %s no contexto de %s.\n"+
			"A justificativa foi: %s.\n"+
			"O resultado foi: %s.",
		p.DecisionDate.Format("02/01/2006"),
		p.OriginalContext.AuthorityRole,
		p.Action,
		p.Domain,
		p.OriginalContext.OriginalJustification,
		p.ObservedResult.WhatHappened,
	)
}

// ========================================
// REVIEW MANAGEMENT
// ========================================

// CreateReview inicia revisão de decisão
func (s *MemoryService) CreateReview(req CreateReviewRequest) (*DecisionReview, error) {
	// Colocar decisão em under_review
	if err := s.TransitionToUnderReview(req.DecisionID, req.InitiatedBy, req.ReviewReason); err != nil {
		return nil, err
	}
	
	now := time.Now()
	review := &DecisionReview{
		ID:           uuid.New(),
		DecisionID:   req.DecisionID,
		ReviewType:   req.ReviewType,
		ReviewReason: req.ReviewReason,
		InitiatedBy:  req.InitiatedBy,
		InitiatedAt:  now,
		Outcome:      OutcomePending,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	
	if err := s.db.Create(review).Error; err != nil {
		return nil, err
	}
	
	return review, nil
}

// CompleteReview conclui revisão
func (s *MemoryService) CompleteReview(req CompleteReviewRequest) error {
	var review DecisionReview
	if err := s.db.First(&review, "id = ?", req.ReviewID).Error; err != nil {
		return err
	}
	
	if review.Outcome != OutcomePending {
		return fmt.Errorf("revisão já foi concluída")
	}
	
	now := time.Now()
	review.Outcome = req.Outcome
	review.OutcomeReason = req.OutcomeReason
	review.DecidedBy = &req.DecidedBy
	review.DecidedAt = &now
	review.NewDecisionID = req.NewDecisionID
	review.UpdatedAt = now
	
	if err := s.db.Save(&review).Error; err != nil {
		return err
	}
	
	// Aplicar resultado
	switch req.Outcome {
	case OutcomeRenewed:
		return s.RenewDecision(review.DecisionID, req.DecidedBy, req.OutcomeReason, req.NewExpiresAt)
	case OutcomeRevoked:
		return s.TransitionToRevoked(review.DecisionID, req.DecidedBy, req.OutcomeReason)
	case OutcomeSuperseded:
		if req.NewDecisionID == nil {
			return fmt.Errorf("superseded requer nova decisão")
		}
		return s.SupersedeDecision(review.DecisionID, *req.NewDecisionID, req.DecidedBy, req.OutcomeReason)
	}
	
	return nil
}

// GetPendingReviews lista revisões pendentes
func (s *MemoryService) GetPendingReviews() ([]DecisionReview, error) {
	var reviews []DecisionReview
	err := s.db.Where("outcome = ?", OutcomePending).Order("initiated_at ASC").Find(&reviews).Error
	return reviews, err
}

// ========================================
// EXECUTION GUARD
// Verificação obrigatória antes de qualquer execução
// ========================================

// CanExecute verifica se uma decisão pode ser executada
// Esta função DEVE ser chamada antes de qualquer execução
func (s *MemoryService) CanExecute(decisionID uuid.UUID) (bool, string, error) {
	// 1. Verificar se decisão está ativa
	active, err := s.IsDecisionActive(decisionID)
	if err != nil {
		return false, "", err
	}
	if !active {
		lifecycle, _ := s.GetLifecycle(decisionID)
		if lifecycle != nil {
			return false, fmt.Sprintf("Decisão não está ativa (estado: %s)", lifecycle.State), nil
		}
		return false, "Decisão não está ativa", nil
	}
	
	// 2. Verificar conflitos abertos
	hasConflict, conflictAny, err := s.HasOpenConflict(decisionID)
	if err != nil {
		return false, "", err
	}
	if hasConflict {
		if conflict, ok := conflictAny.(*DecisionConflict); ok {
			return false, fmt.Sprintf("Conflito aberto bloqueia execução: %s", conflict.Description), nil
		}
		return false, "Conflito aberto bloqueia execução", nil
	}
	
	// 3. Tudo ok
	return true, "", nil
}

// ========================================
// REQUEST/RESPONSE DTOs
// ========================================

// CreateLifecycleRequest - DTO para criar lifecycle
type CreateLifecycleRequest struct {
	DecisionID       uuid.UUID
	DecisionType     string
	Domain           string
	Action           string
	ExpirationType   ExpirationType
	ExpiresAt        *time.Time
	ExpiresCondition string
	ReviewEveryDays  *int
}

// DetectConflictRequest - DTO para detectar conflito
type DetectConflictRequest struct {
	DecisionAID  uuid.UUID
	DecisionBID  uuid.UUID
	ConflictType ConflictType
	Description  string
	Domain       string
	DetectedBy   string // system, human
}

// ResolveConflictRequest - DTO para resolver conflito
type ResolveConflictRequest struct {
	ConflictID        uuid.UUID
	ResolvedBy        uuid.UUID
	Resolution        string
	PrevailingID      uuid.UUID
	NonPrevailingFate string // revoked, superseded, under_review
}

// CreatePrecedentRequest - DTO para criar precedente
type CreatePrecedentRequest struct {
	OriginalDecisionID     uuid.UUID
	OriginalContext        PrecedentContext
	WhatHappened           string
	ObservedEffects        []string
	UnforeseenConsequences []string
	CreatedBy              uuid.UUID
	CreationReason         string
}

// CreateReviewRequest - DTO para criar revisão
type CreateReviewRequest struct {
	DecisionID   uuid.UUID
	ReviewType   ReviewType
	ReviewReason string
	InitiatedBy  uuid.UUID
}

// CompleteReviewRequest - DTO para completar revisão
type CompleteReviewRequest struct {
	ReviewID      uuid.UUID
	Outcome       ReviewOutcome
	OutcomeReason string
	DecidedBy     uuid.UUID
	NewDecisionID *uuid.UUID
	NewExpiresAt  *time.Time
}

// generateHash gera hash para integridade
func generateHash(data any) string {
	bytes, _ := json.Marshal(data)
	hash := sha256.Sum256(bytes)
	return hex.EncodeToString(hash[:])
}
