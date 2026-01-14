package domain

import "time"

// VerificationCode represents a 2FA verification code
type VerificationCode struct {
	ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      int       `gorm:"column:user_id;not null;index" json:"user_id"`
	Code        string    `gorm:"column:code;not null" json:"-"`          // Never expose code in JSON
	Purpose     string    `gorm:"column:purpose;not null" json:"purpose"` // login, password_reset, phone_verification
	Channel     string    `gorm:"column:channel;not null" json:"channel"` // whatsapp, email, sms
	Attempts    int       `gorm:"column:attempts;default:0" json:"attempts"`
	MaxAttempts int       `gorm:"column:max_attempts;default:3" json:"max_attempts"`
	Used        bool      `gorm:"column:used;default:false" json:"used"`
	ExpiresAt   time.Time `gorm:"column:expires_at;not null;index" json:"expires_at"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`

	// Relation
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName specifies the table name for VerificationCode
func (VerificationCode) TableName() string {
	return "verification_codes"
}

// IsExpired checks if the verification code has expired
func (vc *VerificationCode) IsExpired() bool {
	return time.Now().After(vc.ExpiresAt)
}

// IsValid checks if the verification code can still be used
func (vc *VerificationCode) IsValid() bool {
	return !vc.Used && !vc.IsExpired() && vc.Attempts < vc.MaxAttempts
}

// VerificationPurpose constants
const (
	VerificationPurposeLogin         = "login"
	VerificationPurposePasswordReset = "password_reset"
	VerificationPurposePhoneVerify   = "phone_verification"
	VerificationPurposeAccountVerify = "account_verification"
)

// VerificationChannel constants
const (
	VerificationChannelWhatsApp = "whatsapp"
	VerificationChannelEmail    = "email"
	VerificationChannelSMS      = "sms"
)
