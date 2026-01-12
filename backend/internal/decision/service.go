package decision

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// DECISION SERVICE
// "Registra o que o sistema DECIDIU, não só o que aconteceu"
// ========================================

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// ========================================
// RECORD DECISIONS
// ========================================

// RecordDecision registra uma decisão do sistema
func (s *Service) RecordDecision(ctx context.Context, d *Decision) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	if d.DecidedAt.IsZero() {
		d.DecidedAt = time.Now()
	}
	d.CreatedAt = time.Now()
	
	return s.db.Create(d).Error
}

// RecordAccess registra decisão de acesso
func (s *Service) RecordAccess(ctx context.Context, appID, userID uuid.UUID, allowed bool, reason, reasonCode string) error {
	outcome := OutcomeAllowed
	decisionType := DecisionAccessAllowed
	if !allowed {
		outcome = OutcomeBlocked
		decisionType = DecisionAccessDenied
	}
	
	return s.RecordDecision(ctx, &Decision{
		AppID:      appID,
		Type:       decisionType,
		Outcome:    outcome,
		Reason:     reason,
		ReasonCode: reasonCode,
		UserID:     &userID,
		Severity:   SeverityLow,
		Reversible: true,
	})
}

// RecordPaymentDecision registra decisão de pagamento
func (s *Service) RecordPaymentDecision(ctx context.Context, appID, userID uuid.UUID, allowed bool, reason, reasonCode string, metadata map[string]any) error {
	outcome := OutcomeAllowed
	decisionType := DecisionPaymentAllowed
	severity := SeverityLow
	
	if !allowed {
		outcome = OutcomeBlocked
		decisionType = DecisionPaymentBlocked
		severity = SeverityMedium
	}
	
	var metadataJSON string
	if metadata != nil {
		if data, err := json.Marshal(metadata); err == nil {
			metadataJSON = string(data)
		}
	}
	
	return s.RecordDecision(ctx, &Decision{
		AppID:      appID,
		Type:       decisionType,
		Outcome:    outcome,
		Reason:     reason,
		ReasonCode: reasonCode,
		UserID:     &userID,
		Severity:   severity,
		Reversible: false,
		Metadata:   metadataJSON,
	})
}

// RecordRuleDecision registra decisão de regra
func (s *Service) RecordRuleDecision(ctx context.Context, appID uuid.UUID, ruleID string, triggered bool, shadow bool, reason string) error {
	decisionType := DecisionRuleSkipped
	outcome := OutcomeAllowed
	
	if triggered {
		if shadow {
			decisionType = DecisionRuleShadow
		} else {
			decisionType = DecisionRuleTriggered
		}
		outcome = OutcomeBlocked
	}
	
	return s.RecordDecision(ctx, &Decision{
		AppID:        appID,
		Type:         decisionType,
		Outcome:      outcome,
		Reason:       reason,
		TriggerType:  TriggerRule,
		TriggerID:    ruleID,
		ResourceType: "rule",
		ResourceID:   ruleID,
		Severity:     SeverityLow,
		Reversible:   true,
	})
}

// RecordKillswitchDecision registra decisão de kill switch
func (s *Service) RecordKillswitchDecision(ctx context.Context, appID uuid.UUID, scope string, blocked bool, reason string) error {
	decisionType := DecisionKillswitchAllow
	outcome := OutcomeAllowed
	severity := SeverityLow
	
	if blocked {
		decisionType = DecisionKillswitchBlock
		outcome = OutcomeBlocked
		severity = SeverityHigh
	}
	
	return s.RecordDecision(ctx, &Decision{
		AppID:        appID,
		Type:         decisionType,
		Outcome:      outcome,
		Reason:       reason,
		TriggerType:  TriggerKillswitch,
		TriggerID:    scope,
		ResourceType: "killswitch",
		ResourceID:   scope,
		Severity:     severity,
		Reversible:   true,
	})
}

// RecordSecurityDecision registra decisão de segurança
func (s *Service) RecordSecurityDecision(ctx context.Context, appID uuid.UUID, userID *uuid.UUID, action string, reason, reasonCode string, metadata map[string]any) error {
	var metadataJSON string
	if metadata != nil {
		if data, err := json.Marshal(metadata); err == nil {
			metadataJSON = string(data)
		}
	}
	
	return s.RecordDecision(ctx, &Decision{
		AppID:      appID,
		Type:       DecisionSecurityBlock,
		Outcome:    OutcomeBlocked,
		Reason:     reason,
		ReasonCode: reasonCode,
		UserID:     userID,
		TriggerType: TriggerAutomatic,
		Severity:   SeverityHigh,
		Reversible: false,
		Metadata:   metadataJSON,
	})
}

// RecordInvariantViolation registra violação de invariante
func (s *Service) RecordInvariantViolation(ctx context.Context, appID uuid.UUID, invariantID, reason string, metadata map[string]any) error {
	var metadataJSON string
	if metadata != nil {
		if data, err := json.Marshal(metadata); err == nil {
			metadataJSON = string(data)
		}
	}
	
	return s.RecordDecision(ctx, &Decision{
		AppID:        appID,
		Type:         DecisionInvariantViolation,
		Outcome:      OutcomeEscalated,
		Reason:       reason,
		ReasonCode:   "INVARIANT_VIOLATION",
		TriggerType:  TriggerInvariant,
		TriggerID:    invariantID,
		ResourceType: "invariant",
		ResourceID:   invariantID,
		Severity:     SeverityCritical,
		Reversible:   false,
		Metadata:     metadataJSON,
	})
}

// ========================================
// QUERY DECISIONS
// ========================================

// GetByApp retorna decisões de um app
func (s *Service) GetByApp(ctx context.Context, appID uuid.UUID, limit int) ([]Decision, error) {
	var decisions []Decision
	err := s.db.Where("app_id = ?", appID).
		Order("decided_at DESC").
		Limit(limit).
		Find(&decisions).Error
	return decisions, err
}

// GetByUser retorna decisões de um usuário
func (s *Service) GetByUser(ctx context.Context, userID uuid.UUID, limit int) ([]Decision, error) {
	var decisions []Decision
	err := s.db.Where("user_id = ?", userID).
		Order("decided_at DESC").
		Limit(limit).
		Find(&decisions).Error
	return decisions, err
}

// GetByType retorna decisões de um tipo
func (s *Service) GetByType(ctx context.Context, appID uuid.UUID, decisionType string, limit int) ([]Decision, error) {
	var decisions []Decision
	err := s.db.Where("app_id = ? AND type = ?", appID, decisionType).
		Order("decided_at DESC").
		Limit(limit).
		Find(&decisions).Error
	return decisions, err
}

// GetBySeverity retorna decisões por severidade
func (s *Service) GetBySeverity(ctx context.Context, severity string, limit int) ([]Decision, error) {
	var decisions []Decision
	err := s.db.Where("severity = ?", severity).
		Order("decided_at DESC").
		Limit(limit).
		Find(&decisions).Error
	return decisions, err
}

// GetCritical retorna decisões críticas recentes
func (s *Service) GetCritical(ctx context.Context, since time.Time) ([]Decision, error) {
	var decisions []Decision
	err := s.db.Where("severity = ? AND decided_at > ?", SeverityCritical, since).
		Order("decided_at DESC").
		Find(&decisions).Error
	return decisions, err
}

// CountByOutcome conta decisões por outcome em um período
func (s *Service) CountByOutcome(ctx context.Context, appID uuid.UUID, since time.Time) (map[string]int64, error) {
	type result struct {
		Outcome string
		Count   int64
	}
	
	var results []result
	err := s.db.Model(&Decision{}).
		Select("outcome, count(*) as count").
		Where("app_id = ? AND decided_at > ?", appID, since).
		Group("outcome").
		Find(&results).Error
	
	if err != nil {
		return nil, err
	}
	
	counts := make(map[string]int64)
	for _, r := range results {
		counts[r.Outcome] = r.Count
	}
	return counts, nil
}

// GetAll retorna todas as decisões (admin)
func (s *Service) GetAll(ctx context.Context, limit int) ([]Decision, error) {
	var decisions []Decision
	err := s.db.Order("decided_at DESC").
		Limit(limit).
		Find(&decisions).Error
	return decisions, err
}

// GetRecent retorna decisões recentes
func (s *Service) GetRecent(ctx context.Context, since time.Time, limit int) ([]Decision, error) {
	var decisions []Decision
	err := s.db.Where("decided_at > ?", since).
		Order("decided_at DESC").
		Limit(limit).
		Find(&decisions).Error
	return decisions, err
}

// GetByTypeAll retorna decisões de um tipo (todas as apps)
func (s *Service) GetByTypeAll(ctx context.Context, decisionType string, limit int) ([]Decision, error) {
	var decisions []Decision
	err := s.db.Where("type = ?", decisionType).
		Order("decided_at DESC").
		Limit(limit).
		Find(&decisions).Error
	return decisions, err
}

// CountByOutcomeAll conta decisões por outcome (todas as apps)
func (s *Service) CountByOutcomeAll(ctx context.Context, since time.Time) (map[string]int64, error) {
	type result struct {
		Outcome string
		Count   int64
	}
	
	var results []result
	err := s.db.Model(&Decision{}).
		Select("outcome, count(*) as count").
		Where("decided_at > ?", since).
		Group("outcome").
		Find(&results).Error
	
	if err != nil {
		return nil, err
	}
	
	counts := make(map[string]int64)
	for _, r := range results {
		counts[r.Outcome] = r.Count
	}
	return counts, nil
}
