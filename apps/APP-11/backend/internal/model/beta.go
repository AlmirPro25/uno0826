
package model

import (
	"time"

	"github.com/google/uuid"
)

// BetaStatus defines the status of a beta subscription.
type BetaStatus string

const (
	BetaStatusPending  BetaStatus = "PENDING"
	BetaStatusApproved BetaStatus = "APPROVED"
	BetaStatusRejected BetaStatus = "REJECTED"
)

// BetaSubscription represents the BetaSubscription model.
type BetaSubscription struct {
	ID               uuid.UUID  `json:"id"`
	Name             string     `json:"name"`
	Email            string     `json:"email"`
	SubscriptionDate time.Time  `json:"subscriptionDate"`
	Status           BetaStatus `json:"status"`
}

// BetaSubscriptionRequest represents the request body for beta subscription.
type BetaSubscriptionRequest struct {
	Name  string `json:"name" validate:"required,min=2,max=100"`
	Email string `json:"email" validate:"required,email"`
}

// BetaSubscriptionResponse represents the response body for beta subscription.
type BetaSubscriptionResponse struct {
	Message        string    `json:"message"`
	SubscriptionID uuid.UUID `json:"subscriptionId"`
}
