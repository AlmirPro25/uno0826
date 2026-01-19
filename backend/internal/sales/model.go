package sales

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NegotiationStatus string

const (
	NegotiationOpen    NegotiationStatus = "OPEN"
	NegotiationWon     NegotiationStatus = "WON"
	NegotiationLost    NegotiationStatus = "LOST"
	NegotiationExpired NegotiationStatus = "EXPIRED"
)

// Negotiation represents a commercial thread with a user.
type Negotiation struct {
	ID        uuid.UUID         `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID         `gorm:"type:uuid;index" json:"user_id"`
	Status    NegotiationStatus `gorm:"index" json:"status"`
	Priority  string            `json:"priority"` // low, medium, high
	Context   string            `json:"context"`  // e.g., "upgrade_attempt"
	CreatedAt time.Time         `json:"created_at"`
	UpdatedAt time.Time         `json:"updated_at"`

	Proposals []Proposal `gorm:"foreignKey:NegotiationID" json:"proposals,omitempty"`
}

// Proposal represents a specific offer made within a negotiation.
type Proposal struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	NegotiationID uuid.UUID `gorm:"type:uuid;index" json:"negotiation_id"`

	ProductTier string `json:"product_tier"` // basic, pro, enterprise
	BasePrice   int64  `json:"base_price"`   // in cents
	Discount    int64  `json:"discount"`     // percentage
	FinalPrice  int64  `json:"final_price"`  // in cents
	Currency    string `json:"currency" gorm:"default:'BRL'"`

	Terms      string     `json:"terms"`
	ValidUntil time.Time  `json:"valid_until"`
	AcceptedAt *time.Time `json:"accepted_at,omitempty"`

	CreatedAt time.Time `json:"created_at"`
}

// BeforeCreate hooks
func (n *Negotiation) BeforeCreate(tx *gorm.DB) (err error) {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return
}

func (p *Proposal) BeforeCreate(tx *gorm.DB) (err error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return
}
