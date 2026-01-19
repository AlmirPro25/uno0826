package sales_negotiator

import "errors"

// ==========================================
// ECONOMIC STRATEGY & BOUNDS
// ==========================================

// NegotiationStrategy defines the mathematical boundaries of a deal.
// "A IA pode discutir, mas os números mandam."
type NegotiationStrategy struct {
	ListingPrice int64 // Price shown publicly
	TargetPrice  int64 // Ideal settlement price
	MinPrice     int64 // BATNA / Walk-Away point (Absolute floor)
	MaxRounds    int   // Patience limit
}

// NegotiationState tracks the progress of a bargaining session
type NegotiationState struct {
	CurrentRound      int
	LastOfferReceived int64
	History           []NegotiationTurn
}

type NegotiationTurn struct {
	Round int
	Actor string // "us" or "them"
	Offer int64
	Note  string
}

// EvaluateOffer returns the tactical decision based purely on economics.
func (s *NegotiationStrategy) EvaluateOffer(offer int64, currentRound int) (string, string) {
	// 1. Safety Check: Rounds
	if currentRound > s.MaxRounds {
		return "walk_away", "Maximum negotiation rounds exceeded."
	}

	// 2. Immediate Acceptance (Greedy)
	if offer >= s.TargetPrice {
		return "accept_deal", "Offer meets or exceeds target price."
	}

	// 3. Hard Floor Breach (BATNA)
	if offer < s.MinPrice {
		return "reject_deal", "Offer below minimum viable price (BATNA)."
	}

	// 4. Negotiation Zone
	// Between MinPrice and TargetPrice -> Let the AI argue for more.
	return "negotiate", "Offer within acceptable range, but below target."
}

var ErrStrategyViolation = errors.New("economic safety violation")
