package cognitive

import (
	"context"

	"github.com/google/uuid"
)

// ========================================
// COGNITIVE INTERFACES
// "O jeito certo de dar cérebro ao corpo"
// ========================================

// Decision represents the output of a cognitive process
type Decision struct {
	ID         uuid.UUID              `json:"id"`
	Choice     string                 `json:"choice"`     // The selected action
	Reasoning  string                 `json:"reasoning"`  // Why this choice was made (chain-of-thought)
	Config     map[string]interface{} `json:"config"`     // Parameters for the action
	Confidence float64                `json:"confidence"` // 0.0 to 1.0
}

// CognitiveEngine defines how an agent "thinks"
// This is the Adapter Interface that any LLM (Gemini, GPT) must implement.
type CognitiveEngine interface {
	// Think processes the current state and goal to produce a decision
	Think(ctx context.Context, goal string, state interface{}) (*Decision, error)

	// Name returns the name of the engine (e.g., "gemini-pro", "gpt-4")
	Name() string
}

// CognitiveAgent is an interface for agents that have a cognitive engine
type CognitiveAgent interface {
	SetCognitiveEngine(engine CognitiveEngine)
	GetCognitiveEngine() CognitiveEngine
}
