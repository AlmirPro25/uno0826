package repository

import (
	"context"
	"crypto/rand"
	"fmt"
	"medisync-platform/backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

// VerificationCodeRepository handles verification code persistence
type VerificationCodeRepository struct {
	db *gorm.DB
}

// NewVerificationCodeRepository creates a new repository instance
func NewVerificationCodeRepository(db *gorm.DB) *VerificationCodeRepository {
	return &VerificationCodeRepository{db: db}
}

// GenerateCode generates a random 6-digit code
func GenerateCode() string {
	b := make([]byte, 3)
	rand.Read(b)
	return fmt.Sprintf("%06d", int(b[0])*65536+int(b[1])*256+int(b[2])%1000000)
}

// Create creates a new verification code
func (repo *VerificationCodeRepository) Create(ctx context.Context, code *domain.VerificationCode) error {
	// Generate code if not provided
	if code.Code == "" {
		code.Code = GenerateCode()
	}

	// Set default expiration (5 minutes)
	if code.ExpiresAt.IsZero() {
		code.ExpiresAt = time.Now().Add(5 * time.Minute)
	}

	// Set max attempts
	if code.MaxAttempts == 0 {
		code.MaxAttempts = 3
	}

	return repo.db.WithContext(ctx).Create(code).Error
}

// GetByUserAndPurpose gets the latest valid verification code for a user and purpose
func (repo *VerificationCodeRepository) GetByUserAndPurpose(ctx context.Context, userID int, purpose string) (*domain.VerificationCode, error) {
	var code domain.VerificationCode
	result := repo.db.WithContext(ctx).
		Where("user_id = ? AND purpose = ? AND used = ? AND expires_at > ?",
			userID, purpose, false, time.Now()).
		Order("created_at DESC").
		First(&code)

	if result.Error != nil {
		return nil, result.Error
	}
	return &code, nil
}

// Verify verifies a code and marks it as used if valid
func (repo *VerificationCodeRepository) Verify(ctx context.Context, userID int, purpose, code string) (bool, error) {
	var verificationCode domain.VerificationCode
	result := repo.db.WithContext(ctx).
		Where("user_id = ? AND purpose = ? AND code = ? AND used = ? AND expires_at > ?",
			userID, purpose, code, false, time.Now()).
		First(&verificationCode)

	if result.Error == gorm.ErrRecordNotFound {
		// Increment attempts on any matching code for this purpose
		repo.db.WithContext(ctx).
			Model(&domain.VerificationCode{}).
			Where("user_id = ? AND purpose = ? AND used = ? AND expires_at > ?",
				userID, purpose, false, time.Now()).
			Update("attempts", gorm.Expr("attempts + 1"))
		return false, nil
	} else if result.Error != nil {
		return false, result.Error
	}

	// Check if too many attempts
	if verificationCode.Attempts >= verificationCode.MaxAttempts {
		return false, nil
	}

	// Mark as used
	verificationCode.Used = true
	repo.db.WithContext(ctx).Save(&verificationCode)

	return true, nil
}

// InvalidateAllForUser invalidates all codes for a user and purpose
func (repo *VerificationCodeRepository) InvalidateAllForUser(ctx context.Context, userID int, purpose string) error {
	return repo.db.WithContext(ctx).
		Model(&domain.VerificationCode{}).
		Where("user_id = ? AND purpose = ? AND used = ?", userID, purpose, false).
		Update("used", true).Error
}

// CleanupExpired removes expired verification codes
func (repo *VerificationCodeRepository) CleanupExpired(ctx context.Context) error {
	return repo.db.WithContext(ctx).
		Where("expires_at < ?", time.Now()).
		Delete(&domain.VerificationCode{}).Error
}

// GetRecentCodeCount gets the number of codes sent to a user in the last hour
func (repo *VerificationCodeRepository) GetRecentCodeCount(ctx context.Context, userID int, purpose string) (int64, error) {
	var count int64
	result := repo.db.WithContext(ctx).
		Model(&domain.VerificationCode{}).
		Where("user_id = ? AND purpose = ? AND created_at > ?",
			userID, purpose, time.Now().Add(-1*time.Hour)).
		Count(&count)
	return count, result.Error
}
