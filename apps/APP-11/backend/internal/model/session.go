
package model

import (
	"time"

	"github.com/google/uuid"
)

// Session represents the Session model.
type Session struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"userId"`
	RefreshToken string    `json:"-"` // This will be the encrypted token. Not for direct JSON output.
	ExpiresAt    time.Time `json:"expiresAt"`
	CreatedAt    time.Time `json:"createdAt"`
	UserAgent    *string   `json:"userAgent,omitempty"`
	IPAddress    *string   `json:"ipAddress,omitempty"`
}
