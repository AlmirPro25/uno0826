package approval

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"prost-qs/backend/internal/audit"
	"prost-qs/backend/internal/authority"
)

// ========================================
// APPROVAL SERVICE
// "Toda ação sensível tem um humano que disse sim"
// ========================================

var (
	ErrRequestNotFound      = errors.New("solicitação de aprovação não encontrada")
	ErrRequestExpired       = errors.New("solicitação expirada")
	ErrRequestNotPending    = errors.New("solicitação não está pendente")
	ErrNotEligible          = errors.New("autoridade não elegível para esta aprovação")
	ErrJustificationRequired = errors.New("justificativa obrigatória")
	ErrInvalidDecision      = errors.New("decisão inválida")
	ErrSelfApproval         = errors.New("auto-aprovação não permitida")
)

type ApprovalService struct {
	db               *gorm.DB
	authorityService *authority.AuthorityService
	auditService     *audit.AuditService
}

func NewApprovalService(db *gorm.DB, authorityService *authority.AuthorityService, auditService *audit.AuditService) *ApprovalService {
	return &ApprovalService{
		db:               db,
		authorityService: authorityService,
		auditService:     auditService,
	}
}

// ========================================
// CREATE REQUEST (imutável após criação)
// ========================================

// CreateRequest cria uma solicitação de aprovação
// A solicitação é IMUTÁVEL após criação
func (s *ApprovalService) CreateRequest(req CreateApprovalRequest) (*ApprovalRequest, error) {
	// 1. Resolver autoridades elegíveis AGORA (snapshot)
	resolution, err := s.authorityService.Resolve(authority.ResolutionRequest{
		Domain:      req.Domain,
		Action:      req.Action,
		Amount:      req.Amount,
		Impact:      req.Impact,
		RequestedBy: req.RequestedBy,
	})
	if err != nil {
		return nil, fmt.Errorf("falha ao resolver autoridades: %w", err)
	}

	// 2. Criar snapshot de autoridades elegíveis
	snapshot := EligibleSnapshot{
		Authorities: make([]EligibleAuthoritySnapshot, len(resolution.Eligible)),
		ResolvedAt:  time.Now(),
	}
	for i, e := range resolution.Eligible {
		snapshot.Authorities[i] = EligibleAuthoritySnapshot{
			AuthorityID: e.AuthorityID,
			UserID:      e.UserID,
			Role:        string(e.Role),
			Title:       e.Title,
		}
	}

	// 3. Calcular expiração
	expiresIn := 24 // default 24 horas
	if req.ExpiresInHours > 0 {
		expiresIn = req.ExpiresInHours
	}

	// 4. Criar request (imutável)
	approvalReq := &ApprovalRequest{
		ID:                  uuid.New(),
		Domain:              req.Domain,
		Action:              req.Action,
		Impact:              req.Impact,
		Amount:              req.Amount,
		Context:             req.Context,
		RequestedBy:         req.RequestedBy,
		RequestedByType:     req.RequestedByType,
		RequestReason:       req.RequestReason,
		Status:              StatusPending,
		EligibleAuthorities: snapshot,
		CreatedAt:           time.Now(),
		ExpiresAt:           time.Now().Add(time.Duration(expiresIn) * time.Hour),
	}

	if err := s.db.Create(approvalReq).Error; err != nil {
		return nil, err
	}

	// 5. Registrar no Audit Log
	s.auditService.LogWithData(
		"APPROVAL_REQUEST_CREATED",
		req.RequestedBy,
		approvalReq.ID,
		req.RequestedByType,
		"approval_request",
		"create",
		nil,
		map[string]any{
			"domain": req.Domain,
			"action": req.Action,
			"impact": req.Impact,
			"amount": req.Amount,
		},
		map[string]any{
			"eligible_count":      len(snapshot.Authorities),
			"requires_escalation": resolution.RequiresEscalation,
		},
		req.RequestReason,
	)

	return approvalReq, nil
}

// ========================================
// DECIDE (evento, não comando)
// ========================================

// Decide registra uma decisão humana
// A decisão é um EVENTO - nunca apagado, nunca modificado
func (s *ApprovalService) Decide(
	requestID uuid.UUID,
	authorityID uuid.UUID,
	decidedBy uuid.UUID,
	decision ApprovalStatus,
	justification string,
	ip string,
	userAgent string,
) (*ApprovalDecision, error) {
	// 1. Validar decisão
	if decision != StatusApproved && decision != StatusRejected && decision != StatusEscalated {
		return nil, ErrInvalidDecision
	}

	// 2. Validar justificativa
	if len(justification) < 10 {
		return nil, ErrJustificationRequired
	}

	// 3. Buscar request
	var req ApprovalRequest
	if err := s.db.Where("id = ?", requestID).First(&req).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRequestNotFound
		}
		return nil, err
	}

	// 4. Verificar se está pendente
	if req.Status != StatusPending {
		return nil, ErrRequestNotPending
	}

	// 5. Verificar se expirou
	if req.IsExpired() {
		// Marcar como expirado
		s.db.Model(&req).Update("status", StatusExpired)
		return nil, ErrRequestExpired
	}

	// 6. Verificar se autoridade é elegível
	eligible := false
	for _, auth := range req.EligibleAuthorities.Authorities {
		if auth.AuthorityID == authorityID {
			eligible = true
			break
		}
	}
	if !eligible {
		return nil, ErrNotEligible
	}

	// 7. Verificar auto-aprovação
	if req.RequestedBy == decidedBy {
		return nil, ErrSelfApproval
	}

	// 8. Criar decisão (evento imutável)
	decisionEvent := &ApprovalDecision{
		ID:            uuid.New(),
		RequestID:     requestID,
		AuthorityID:   authorityID,
		DecidedBy:     decidedBy,
		Decision:      decision,
		Justification: justification,
		IP:            ip,
		UserAgent:     userAgent,
		DecidedAt:     time.Now(),
	}

	// 9. Calcular hash de integridade
	decisionEvent.Hash = s.calculateHash(decisionEvent)

	// 10. Transação: salvar decisão + atualizar request
	err := s.db.Transaction(func(tx *gorm.DB) error {
		// Salvar decisão
		if err := tx.Create(decisionEvent).Error; err != nil {
			return err
		}

		// Atualizar request (apenas status e referência)
		updates := map[string]any{
			"status":      decision,
			"decision_id": decisionEvent.ID,
		}
		if err := tx.Model(&ApprovalRequest{}).Where("id = ?", requestID).Updates(updates).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// 11. Registrar no Audit Log
	s.auditService.LogWithData(
		"APPROVAL_DECISION",
		decidedBy,
		requestID,
		"human",
		"approval_request",
		string(decision),
		nil,
		map[string]any{
			"decision":      decision,
			"authority_id":  authorityID,
			"decision_hash": decisionEvent.Hash,
		},
		map[string]any{
			"domain": req.Domain,
			"action": req.Action,
			"impact": req.Impact,
		},
		justification,
	)

	return decisionEvent, nil
}

// calculateHash calcula hash de integridade da decisão
func (s *ApprovalService) calculateHash(d *ApprovalDecision) string {
	data := fmt.Sprintf("%s|%s|%s|%s|%s|%s|%s",
		d.ID.String(),
		d.RequestID.String(),
		d.AuthorityID.String(),
		d.DecidedBy.String(),
		d.Decision,
		d.Justification,
		d.DecidedAt.Format(time.RFC3339Nano),
	)
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// ========================================
// QUERIES
// ========================================

// GetByID busca request por ID
func (s *ApprovalService) GetByID(id uuid.UUID) (*ApprovalRequest, error) {
	var req ApprovalRequest
	if err := s.db.Where("id = ?", id).First(&req).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRequestNotFound
		}
		return nil, err
	}
	return &req, nil
}

// GetPending busca requests pendentes
func (s *ApprovalService) GetPending() ([]ApprovalRequest, error) {
	var requests []ApprovalRequest
	err := s.db.Where("status = ? AND expires_at > ?", StatusPending, time.Now()).
		Order("created_at DESC").
		Find(&requests).Error
	return requests, err
}

// GetPendingForAuthority busca requests pendentes que uma autoridade pode decidir
func (s *ApprovalService) GetPendingForAuthority(authorityID uuid.UUID) ([]ApprovalRequest, error) {
	// Buscar todos pendentes e filtrar por elegibilidade
	pending, err := s.GetPending()
	if err != nil {
		return nil, err
	}

	var eligible []ApprovalRequest
	for _, req := range pending {
		for _, auth := range req.EligibleAuthorities.Authorities {
			if auth.AuthorityID == authorityID {
				eligible = append(eligible, req)
				break
			}
		}
	}

	return eligible, nil
}

// GetDecision busca decisão por ID
func (s *ApprovalService) GetDecision(id uuid.UUID) (*ApprovalDecision, error) {
	var decision ApprovalDecision
	if err := s.db.Where("id = ?", id).First(&decision).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("decisão não encontrada")
		}
		return nil, err
	}
	return &decision, nil
}

// GetDecisionByRequest busca decisão de um request
func (s *ApprovalService) GetDecisionByRequest(requestID uuid.UUID) (*ApprovalDecision, error) {
	var decision ApprovalDecision
	if err := s.db.Where("request_id = ?", requestID).First(&decision).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // sem decisão ainda
		}
		return nil, err
	}
	return &decision, nil
}

// GetChain busca cadeia de decisões (para escalações)
func (s *ApprovalService) GetChain(requestID uuid.UUID) (*ApprovalChain, error) {
	var decisions []ApprovalDecision
	err := s.db.Where("request_id = ?", requestID).
		Order("decided_at ASC").
		Find(&decisions).Error
	if err != nil {
		return nil, err
	}

	req, err := s.GetByID(requestID)
	if err != nil {
		return nil, err
	}

	return &ApprovalChain{
		RequestID:   requestID,
		Decisions:   decisions,
		FinalStatus: req.Status,
	}, nil
}

// GetByDomain busca requests por domínio
func (s *ApprovalService) GetByDomain(domain string, limit int) ([]ApprovalRequest, error) {
	var requests []ApprovalRequest
	query := s.db.Where("domain = ?", domain).Order("created_at DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&requests).Error
	return requests, err
}

// GetHistory busca histórico de requests
func (s *ApprovalService) GetHistory(since time.Time, limit int) ([]ApprovalRequest, error) {
	var requests []ApprovalRequest
	query := s.db.Where("created_at >= ?", since).Order("created_at DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&requests).Error
	return requests, err
}

// ========================================
// EXPIRATION CHECKER
// ========================================

// ExpirePending marca requests expirados
func (s *ApprovalService) ExpirePending() (int64, error) {
	result := s.db.Model(&ApprovalRequest{}).
		Where("status = ? AND expires_at < ?", StatusPending, time.Now()).
		Update("status", StatusExpired)
	return result.RowsAffected, result.Error
}
