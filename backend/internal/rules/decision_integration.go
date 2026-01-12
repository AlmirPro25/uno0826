package rules

import (
	"context"
	"log"

	"github.com/google/uuid"

	"prost-qs/backend/internal/decision"
)

// ========================================
// DECISION INTEGRATION
// "Toda decisão de regra é registrada"
// ========================================

// DecisionAwareRulesService wraps RulesService to record decisions
type DecisionAwareRulesService struct {
	rules    *RulesService
	decision *decision.Service
}

// NewDecisionAwareRulesService creates a new decision-aware rules service
func NewDecisionAwareRulesService(rules *RulesService, decisionSvc *decision.Service) *DecisionAwareRulesService {
	return &DecisionAwareRulesService{
		rules:    rules,
		decision: decisionSvc,
	}
}

// RecordRuleTriggered records when a rule is triggered
func (s *DecisionAwareRulesService) RecordRuleTriggered(ctx context.Context, appID uuid.UUID, rule *Rule, isShadow bool, reason string) {
	if s.decision == nil {
		return
	}
	
	ruleID := rule.ID.String()
	if err := s.decision.RecordRuleDecision(ctx, appID, ruleID, true, isShadow, reason); err != nil {
		log.Printf("⚠️ [DECISION] Failed to record rule triggered: %v", err)
	}
}

// RecordRuleSkipped records when a rule is skipped (condition not met)
func (s *DecisionAwareRulesService) RecordRuleSkipped(ctx context.Context, appID uuid.UUID, rule *Rule, reason string) {
	if s.decision == nil {
		return
	}
	
	ruleID := rule.ID.String()
	if err := s.decision.RecordRuleDecision(ctx, appID, ruleID, false, false, reason); err != nil {
		log.Printf("⚠️ [DECISION] Failed to record rule skipped: %v", err)
	}
}

// RecordRuleEvaluation records a complete rule evaluation with all details
func (s *DecisionAwareRulesService) RecordRuleEvaluation(ctx context.Context, appID uuid.UUID, ruleID string, triggered bool, isShadow bool, reason string) {
	if s.decision == nil {
		return
	}
	
	if err := s.decision.RecordRuleDecision(ctx, appID, ruleID, triggered, isShadow, reason); err != nil {
		log.Printf("⚠️ [DECISION] Failed to record rule evaluation: %v", err)
	}
}

// GetRulesService returns the underlying rules service
func (s *DecisionAwareRulesService) GetRulesService() *RulesService {
	return s.rules
}

// ========================================
// HELPER FUNCTIONS FOR RULE EVALUATION
// ========================================

// EvaluateAndRecord evaluates a rule and records the decision
func (s *DecisionAwareRulesService) EvaluateAndRecord(ctx context.Context, appID uuid.UUID, rule *Rule, metrics map[string]float64) (bool, error) {
	// Evaluate the rule condition
	triggered, _ := s.rules.evaluateCondition(rule.Condition, metrics)
	
	// Determine if this is a shadow execution using the global shadow mode
	isShadow := IsShadowModeActive(appID, rule.ActionType)
	
	// Build reason
	reason := "Condition not met"
	if triggered {
		reason = "Condition met: " + rule.Condition
	}
	
	// Record the decision
	s.RecordRuleEvaluation(ctx, appID, rule.ID.String(), triggered, isShadow, reason)
	
	return triggered, nil
}

// BatchEvaluateAndRecord evaluates multiple rules and records all decisions
func (s *DecisionAwareRulesService) BatchEvaluateAndRecord(ctx context.Context, appID uuid.UUID, rules []Rule, metrics map[string]float64) []RuleEvaluationResult {
	results := make([]RuleEvaluationResult, 0, len(rules))
	
	for _, rule := range rules {
		triggered, _ := s.EvaluateAndRecord(ctx, appID, &rule, metrics)
		isShadow := IsShadowModeActive(appID, rule.ActionType)
		results = append(results, RuleEvaluationResult{
			RuleID:    rule.ID,
			RuleName:  rule.Name,
			Triggered: triggered,
			IsShadow:  isShadow,
		})
	}
	
	return results
}

// RuleEvaluationResult represents the result of a rule evaluation
type RuleEvaluationResult struct {
	RuleID    uuid.UUID `json:"rule_id"`
	RuleName  string    `json:"rule_name"`
	Triggered bool      `json:"triggered"`
	IsShadow  bool      `json:"is_shadow"`
}
