package cognitive

import (
	"context"
	"fmt"
	"strings"
)

// DecisionValidator ensures AI decisions are safe and compliant
type DecisionValidator interface {
	Validate(ctx context.Context, decision *Decision) error
}

// StandardValidator implements basic safety checks
// "Confiança é bom, controle é melhor."
type StandardValidator struct {
	MinConfidence    float64
	AllowedActions   map[string]bool
	ForbiddenTerms   []string
	RequiresHumanRev bool
}

// NewStandardValidator creates a validator with safe defaults
func NewStandardValidator(minConfidence float64) *StandardValidator {
	return &StandardValidator{
		MinConfidence: minConfidence,
		AllowedActions: map[string]bool{
			// Whitelist of allowed actions for Sales Agent
			"negotiate_terms": true,
			"accept_deal":     true,
			"reject_deal":     true,
			"counter_offer":   true,
			"escalate_human":  true,
		},
		ForbiddenTerms: []string{
			"bypass", "ignore", "override", "hack", "exploit", "unlimited", "free",
		},
		RequiresHumanRev: false,
	}
}

func (v *StandardValidator) Validate(ctx context.Context, decision *Decision) error {
	// 1. Confidence Check (O filtro de alucinação)
	if decision.Confidence < v.MinConfidence {
		return fmt.Errorf("safety violation: confidence too low (%.2f < %.2f) - hallucination risk", decision.Confidence, v.MinConfidence)
	}

	// 2. Action Whitelist Check (O filtro de escopo)
	if !v.AllowedActions[decision.Choice] {
		// If action is unknown, force escalation or block
		return fmt.Errorf("safety violation: action '%s' not allowed by strict policy", decision.Choice)
	}

	// 3. Content Safety Check (O filtro de compliance)
	reasoningLower := strings.ToLower(decision.Reasoning)
	for _, term := range v.ForbiddenTerms {
		if strings.Contains(reasoningLower, term) {
			return fmt.Errorf("safety violation: reasoning contains forbidden term '%s'", term)
		}
	}

	return nil
}
