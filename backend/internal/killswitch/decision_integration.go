package killswitch

import (
	"context"
	"log"

	"github.com/google/uuid"

	"prost-qs/backend/internal/decision"
)

// ========================================
// DECISION INTEGRATION
// "Toda decisão de killswitch é registrada"
// ========================================

// DecisionAwareKillSwitchService wraps KillSwitchService to record decisions
type DecisionAwareKillSwitchService struct {
	killswitch *KillSwitchService
	decision   *decision.Service
}

// NewDecisionAwareKillSwitchService creates a new decision-aware killswitch service
func NewDecisionAwareKillSwitchService(ks *KillSwitchService, decisionSvc *decision.Service) *DecisionAwareKillSwitchService {
	return &DecisionAwareKillSwitchService{
		killswitch: ks,
		decision:   decisionSvc,
	}
}

// CheckAndRecord verifica killswitch e registra a decisão
func (s *DecisionAwareKillSwitchService) CheckAndRecord(ctx context.Context, scope string, appID uuid.UUID) (bool, error) {
	blocked := s.killswitch.IsActive(scope)
	
	reason := "Kill switch not active"
	if blocked {
		reason = "Kill switch active for scope: " + scope
	}
	
	if err := s.decision.RecordKillswitchDecision(ctx, appID, scope, blocked, reason); err != nil {
		log.Printf("⚠️ [DECISION] Failed to record killswitch decision: %v", err)
	}
	
	return blocked, nil
}

// CheckForAppAndRecord verifica killswitch para app e registra a decisão
func (s *DecisionAwareKillSwitchService) CheckForAppAndRecord(ctx context.Context, scope, appIDStr string, appUUID uuid.UUID) (bool, error) {
	blocked := s.killswitch.IsActiveForApp(scope, appIDStr)
	
	reason := "Kill switch not active for app"
	if blocked {
		reason = "Kill switch active for scope: " + scope + " app: " + appIDStr
	}
	
	if err := s.decision.RecordKillswitchDecision(ctx, appUUID, scope, blocked, reason); err != nil {
		log.Printf("⚠️ [DECISION] Failed to record killswitch decision: %v", err)
	}
	
	return blocked, nil
}

// CheckForResourceAndRecord verifica killswitch para recurso e registra a decisão
func (s *DecisionAwareKillSwitchService) CheckForResourceAndRecord(ctx context.Context, resourceType, resourceID string, appID uuid.UUID) (bool, error) {
	blocked := s.killswitch.IsActiveForResource(resourceType, resourceID)
	
	scope := resourceType + ":" + resourceID
	reason := "Kill switch not active for resource"
	if blocked {
		reason = "Kill switch active for resource: " + scope
	}
	
	if err := s.decision.RecordKillswitchDecision(ctx, appID, scope, blocked, reason); err != nil {
		log.Printf("⚠️ [DECISION] Failed to record killswitch decision: %v", err)
	}
	
	return blocked, nil
}

// ActivateAndRecord ativa killswitch e registra a decisão
func (s *DecisionAwareKillSwitchService) ActivateAndRecord(ctx context.Context, scope, reason string, activatedBy uuid.UUID, expiresInMinutes *int) error {
	err := s.killswitch.Activate(scope, reason, activatedBy, expiresInMinutes)
	
	// Record the activation as a decision
	if decErr := s.decision.RecordKillswitchDecision(ctx, uuid.Nil, scope, true, "Kill switch activated: "+reason); decErr != nil {
		log.Printf("⚠️ [DECISION] Failed to record killswitch activation: %v", decErr)
	}
	
	return err
}

// DeactivateAndRecord desativa killswitch e registra a decisão
func (s *DecisionAwareKillSwitchService) DeactivateAndRecord(ctx context.Context, scope string) error {
	err := s.killswitch.Deactivate(scope)
	
	// Record the deactivation as a decision
	if decErr := s.decision.RecordKillswitchDecision(ctx, uuid.Nil, scope, false, "Kill switch deactivated"); decErr != nil {
		log.Printf("⚠️ [DECISION] Failed to record killswitch deactivation: %v", decErr)
	}
	
	return err
}

// GetKillSwitchService returns the underlying killswitch service
func (s *DecisionAwareKillSwitchService) GetKillSwitchService() *KillSwitchService {
	return s.killswitch
}
