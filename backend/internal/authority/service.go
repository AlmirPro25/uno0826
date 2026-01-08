package authority

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// AUTHORITY RESOLUTION ENGINE
// "Por que esta pessoa NÃO pode aprovar isso?"
// ========================================

var (
	ErrAuthorityNotFound    = errors.New("autoridade não encontrada")
	ErrNoEligibleAuthority  = errors.New("nenhuma autoridade elegível")
	ErrSelfApprovalDenied   = errors.New("auto-aprovação não permitida")
	ErrAuthorityExpired     = errors.New("autoridade expirada")
	ErrAuthorityRevoked     = errors.New("autoridade revogada")
	ErrInsufficientAuthority = errors.New("autoridade insuficiente para esta ação")
)

type AuthorityService struct {
	db *gorm.DB
}

func NewAuthorityService(db *gorm.DB) *AuthorityService {
	return &AuthorityService{db: db}
}

// ========================================
// RESOLUTION ENGINE (CORE)
// ========================================

// Resolve determina quem pode aprovar uma ação
// Esta é a função central - responde com fundamento
func (s *AuthorityService) Resolve(req ResolutionRequest) (*ResolutionResult, error) {
	result := &ResolutionResult{
		Eligible: []EligibleAuthority{},
		Excluded: []ExcludedAuthority{},
	}

	// 1. Buscar todas as autoridades
	var authorities []DecisionAuthority
	if err := s.db.Find(&authorities).Error; err != nil {
		return nil, err
	}

	// 2. Avaliar cada autoridade
	for _, auth := range authorities {
		eligible, reason := s.evaluateAuthority(auth, req)
		
		if eligible {
			result.Eligible = append(result.Eligible, EligibleAuthority{
				AuthorityID: auth.ID,
				UserID:      auth.UserID,
				Role:        auth.Role,
				Title:       auth.Title,
				Reason:      reason,
			})
		} else {
			result.Excluded = append(result.Excluded, ExcludedAuthority{
				AuthorityID: auth.ID,
				UserID:      auth.UserID,
				Role:        auth.Role,
				Title:       auth.Title,
				Reason:      reason, // POR QUE NÃO PODE
			})
		}
	}

	// 3. Determinar resultado
	result.HasEligible = len(result.Eligible) > 0
	
	if result.HasEligible {
		result.Reason = "Autoridades elegíveis encontradas"
	} else {
		result.RequiresEscalation = true
		result.EscalationReason = s.determineEscalationReason(result.Excluded, req)
		result.Reason = "Nenhuma autoridade elegível - requer escalação"
	}

	return result, nil
}

// evaluateAuthority avalia se uma autoridade pode aprovar
// Retorna (elegível, razão)
func (s *AuthorityService) evaluateAuthority(auth DecisionAuthority, req ResolutionRequest) (bool, string) {
	// 1. Verificar se está ativa
	if !auth.Active {
		return false, ExclusionInactive
	}

	// 2. Verificar se expirou
	if auth.ExpiresAt != nil && auth.ExpiresAt.Before(time.Now()) {
		return false, ExclusionExpired
	}

	// 3. Verificar se foi revogada
	if auth.RevokedAt != nil {
		return false, ExclusionRevoked
	}

	// 4. Verificar impacto máximo
	if !auth.MaxImpact.CanApprove(req.Impact) {
		return false, ExclusionImpactExceeded
	}

	// 5. Verificar escopo de domínio e ação
	scopeMatch, scopeReason := s.checkScope(auth.Scopes, req)
	if !scopeMatch {
		return false, scopeReason
	}

	// 6. Verificar auto-aprovação (agente não pode aprovar própria ação)
	if auth.UserID == req.RequestedBy {
		return false, ExclusionSelfApproval
	}

	// Passou em todas as verificações
	return true, "Autoridade válida para esta ação"
}

// checkScope verifica se o escopo permite a ação
func (s *AuthorityService) checkScope(scopes AuthorityScopes, req ResolutionRequest) (bool, string) {
	if len(scopes) == 0 {
		return false, ExclusionDomainMismatch
	}

	for _, scope := range scopes {
		// Verificar domínio
		if scope.Domain != "*" && scope.Domain != req.Domain {
			continue
		}

		// Verificar ação
		actionAllowed := false
		for _, action := range scope.Actions {
			if action == "*" || action == req.Action {
				actionAllowed = true
				break
			}
		}
		if !actionAllowed {
			continue
		}

		// Verificar valor
		if req.Amount > 0 && scope.MaxAmount > 0 && req.Amount > scope.MaxAmount {
			return false, ExclusionAmountExceeded
		}

		// Verificar impacto do escopo
		if scope.MaxImpact != "" {
			scopeImpact := ImpactLevel(scope.MaxImpact)
			if !scopeImpact.CanApprove(req.Impact) {
				return false, ExclusionImpactExceeded
			}
		}

		// Escopo válido encontrado
		return true, ""
	}

	return false, ExclusionActionMismatch
}

// determineEscalationReason determina por que precisa escalar
func (s *AuthorityService) determineEscalationReason(excluded []ExcludedAuthority, req ResolutionRequest) string {
	if len(excluded) == 0 {
		return "Nenhuma autoridade cadastrada no sistema"
	}

	// Contar razões de exclusão
	reasons := make(map[string]int)
	for _, ex := range excluded {
		reasons[ex.Reason]++
	}

	// Determinar razão principal
	if reasons[ExclusionImpactExceeded] > 0 {
		return "Impacto da ação excede todas as autoridades disponíveis"
	}
	if reasons[ExclusionAmountExceeded] > 0 {
		return "Valor da ação excede limites de todas as autoridades"
	}
	if reasons[ExclusionDomainMismatch] == len(excluded) {
		return "Nenhuma autoridade tem permissão para este domínio"
	}
	if reasons[ExclusionActionMismatch] == len(excluded) {
		return "Nenhuma autoridade tem permissão para esta ação"
	}

	return "Nenhuma autoridade elegível encontrada"
}

// ========================================
// CRUD DE AUTORIDADES
// ========================================

// Grant concede uma autoridade a um usuário
func (s *AuthorityService) Grant(
	userID uuid.UUID,
	role AuthorityRole,
	title string,
	scopes AuthorityScopes,
	maxImpact ImpactLevel,
	grantedBy uuid.UUID,
	reason string,
	expiresAt *time.Time,
) (*DecisionAuthority, error) {
	auth := &DecisionAuthority{
		ID:          uuid.New(),
		UserID:      userID,
		Role:        role,
		Title:       title,
		Scopes:      scopes,
		MaxImpact:   maxImpact,
		GrantedBy:   grantedBy,
		GrantReason: reason,
		GrantedAt:   time.Now(),
		Active:      true,
		ExpiresAt:   expiresAt,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.Create(auth).Error; err != nil {
		return nil, err
	}

	return auth, nil
}

// Revoke revoga uma autoridade (nunca apaga)
func (s *AuthorityService) Revoke(authorityID uuid.UUID, revokedBy uuid.UUID, reason string) error {
	now := time.Now()
	return s.db.Model(&DecisionAuthority{}).
		Where("id = ?", authorityID).
		Updates(map[string]any{
			"active":        false,
			"revoked_at":    now,
			"revoked_by":    revokedBy,
			"revoke_reason": reason,
			"updated_at":    now,
		}).Error
}

// GetByID busca autoridade por ID
func (s *AuthorityService) GetByID(id uuid.UUID) (*DecisionAuthority, error) {
	var auth DecisionAuthority
	if err := s.db.Where("id = ?", id).First(&auth).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAuthorityNotFound
		}
		return nil, err
	}
	return &auth, nil
}

// GetByUser busca autoridades de um usuário
func (s *AuthorityService) GetByUser(userID uuid.UUID) ([]DecisionAuthority, error) {
	var authorities []DecisionAuthority
	err := s.db.Where("user_id = ?", userID).Find(&authorities).Error
	return authorities, err
}

// GetActiveByUser busca autoridades ativas de um usuário
func (s *AuthorityService) GetActiveByUser(userID uuid.UUID) ([]DecisionAuthority, error) {
	var authorities []DecisionAuthority
	now := time.Now()
	err := s.db.Where("user_id = ? AND active = ? AND (expires_at IS NULL OR expires_at > ?)", 
		userID, true, now).Find(&authorities).Error
	return authorities, err
}

// GetAll busca todas as autoridades
func (s *AuthorityService) GetAll() ([]DecisionAuthority, error) {
	var authorities []DecisionAuthority
	err := s.db.Order("created_at DESC").Find(&authorities).Error
	return authorities, err
}

// ========================================
// QUERIES PARA AUDITORIA
// ========================================

// GetGrantHistory retorna histórico de concessões
func (s *AuthorityService) GetGrantHistory(since time.Time) ([]DecisionAuthority, error) {
	var authorities []DecisionAuthority
	err := s.db.Where("granted_at >= ?", since).
		Order("granted_at DESC").
		Find(&authorities).Error
	return authorities, err
}

// GetRevokeHistory retorna histórico de revogações
func (s *AuthorityService) GetRevokeHistory(since time.Time) ([]DecisionAuthority, error) {
	var authorities []DecisionAuthority
	err := s.db.Where("revoked_at IS NOT NULL AND revoked_at >= ?", since).
		Order("revoked_at DESC").
		Find(&authorities).Error
	return authorities, err
}

// CanUserApprove verifica rapidamente se um usuário pode aprovar algo
func (s *AuthorityService) CanUserApprove(userID uuid.UUID, req ResolutionRequest) (bool, string) {
	authorities, err := s.GetActiveByUser(userID)
	if err != nil || len(authorities) == 0 {
		return false, "Usuário não possui autoridades ativas"
	}

	for _, auth := range authorities {
		eligible, reason := s.evaluateAuthority(auth, req)
		if eligible {
			return true, reason
		}
	}

	return false, "Nenhuma autoridade do usuário é elegível para esta ação"
}
