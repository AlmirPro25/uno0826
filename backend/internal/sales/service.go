package sales

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SalesService struct {
	db *gorm.DB
}

// NewSalesService creates a new sales service.
func NewSalesService(db *gorm.DB) *SalesService {
	// Ensure schema exists
	_ = db.AutoMigrate(&Negotiation{}, &Proposal{})
	return &SalesService{db: db}
}

// StartNegotiation opens a new deal thread.
func (s *SalesService) StartNegotiation(userID uuid.UUID, context string) (*Negotiation, error) {
	neg := &Negotiation{
		UserID:   userID,
		Status:   NegotiationOpen,
		Context:  context,
		Priority: "medium", // Default
	}

	if err := s.db.Create(neg).Error; err != nil {
		return nil, err
	}
	return neg, nil
}

// CreateProposal generates an offer for a negotiation using dynamic pricing.
func (s *SalesService) CreateProposal(negotiationID uuid.UUID, tier string) (*Proposal, error) {
	var neg Negotiation
	if err := s.db.First(&neg, "id = ?", negotiationID).Error; err != nil {
		return nil, errors.New("negotiation not found")
	}

	if neg.Status != NegotiationOpen {
		return nil, errors.New("negotiation is not open")
	}

	// ========================================
	// DYNAMIC PRICING ENGINE
	// ========================================

	// Base prices in cents (BRL)
	basePrices := map[string]int64{
		"basic":      2990,  // R$29.90
		"pro":        9990,  // R$99.90
		"enterprise": 49990, // R$499.90
	}

	basePrice, exists := basePrices[tier]
	if !exists {
		basePrice = basePrices["basic"]
	}

	// Dynamic discount calculation
	discount := s.calculateDiscount(neg.Context, tier)

	// Apply discount
	finalPrice := basePrice * (100 - discount) / 100

	// Validity based on tier (higher tier = longer validity)
	validity := 48 * time.Hour
	if tier == "enterprise" {
		validity = 7 * 24 * time.Hour // 1 week for enterprise
	}

	prop := &Proposal{
		NegotiationID: negotiationID,
		ProductTier:   tier,
		BasePrice:     basePrice,
		Discount:      discount,
		FinalPrice:    finalPrice,
		Currency:      "BRL",
		Terms:         s.generateTerms(tier, discount),
		ValidUntil:    time.Now().Add(validity),
	}

	if err := s.db.Create(prop).Error; err != nil {
		return nil, err
	}

	return prop, nil
}

// calculateDiscount implements contextual pricing rules.
func (s *SalesService) calculateDiscount(context string, tier string) int64 {
	var discount int64 = 0

	// Rule 1: Retention context (+15%)
	if strings.Contains(strings.ToLower(context), "retention") {
		discount += 15
	}

	// Rule 2: Upgrade context (+10%)
	if strings.Contains(strings.ToLower(context), "upgrade") {
		discount += 10
	}

	// Rule 3: Enterprise tier bonus (+5%)
	if tier == "enterprise" {
		discount += 5
	}

	// Rule 4: Monday promotion (+3%)
	if time.Now().Weekday() == time.Monday {
		discount += 3
	}

	// Rule 5: End of month push (+5%)
	if time.Now().Day() >= 25 {
		discount += 5
	}

	// Cap at 25%
	if discount > 25 {
		discount = 25
	}

	return discount
}

// generateTerms creates proposal terms based on tier and discount.
func (s *SalesService) generateTerms(tier string, discount int64) string {
	base := "Standard terms apply."

	if tier == "enterprise" {
		base = "Enterprise SLA: 99.9% uptime guarantee. Dedicated support channel."
	} else if tier == "pro" {
		base = "Pro tier: Priority support. Monthly billing."
	}

	if discount > 0 {
		base += fmt.Sprintf(" Special discount of %d%% applied.", discount)
	}

	return base
}

// AcceptProposal marks a proposal as accepted and updates negotiation status.
// Real financial transaction happens via BillingAgent separately.
func (s *SalesService) AcceptProposal(proposalID uuid.UUID) (*Proposal, error) {
	var prop Proposal
	if err := s.db.First(&prop, "id = ?", proposalID).Error; err != nil {
		return nil, errors.New("proposal not found")
	}

	if time.Now().After(prop.ValidUntil) {
		return nil, errors.New("proposal expired")
	}

	if prop.AcceptedAt != nil {
		return nil, errors.New("proposal already accepted")
	}

	now := time.Now()
	prop.AcceptedAt = &now

	tx := s.db.Begin()
	if err := tx.Save(&prop).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// Close negotiation
	if err := tx.Model(&Negotiation{}).Where("id = ?", prop.NegotiationID).
		Update("status", NegotiationWon).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	tx.Commit()
	return &prop, nil
}

func (s *SalesService) ListNegotiations(limit int) ([]Negotiation, error) {
	var negs []Negotiation
	err := s.db.Preload("Proposals").Order("created_at desc").Limit(limit).Find(&negs).Error
	return negs, err
}
