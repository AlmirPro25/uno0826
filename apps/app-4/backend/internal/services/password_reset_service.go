package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// PasswordResetService handles password reset operations.
type PasswordResetService struct {
	db           *gorm.DB
	userRepo     ports.UserRepository
	emailService *EmailService
}

// NewPasswordResetService creates a new instance.
func NewPasswordResetService(db *gorm.DB, userRepo ports.UserRepository, emailSvc *EmailService) *PasswordResetService {
	return &PasswordResetService{
		db:           db,
		userRepo:     userRepo,
		emailService: emailSvc,
	}
}

// generateToken creates a secure random token.
func generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// RequestPasswordReset creates a reset token and sends email.
func (s *PasswordResetService) RequestPasswordReset(ctx context.Context, email string) error {
	// Find user by email
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		// Don't reveal if email exists or not for security
		return nil
	}

	// Generate token
	token, err := generateToken()
	if err != nil {
		return errors.New("failed to generate reset token")
	}

	// Create reset token (expires in 1 hour)
	resetToken := &domain.PasswordResetToken{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(1 * time.Hour),
		Used:      false,
	}

	if err := s.db.WithContext(ctx).Create(resetToken).Error; err != nil {
		return errors.New("failed to create reset token")
	}

	// Send email with reset link
	if s.emailService != nil && s.emailService.IsEnabled() {
		go s.sendPasswordResetEmail(user.Email, user.FullName, token)
	}

	return nil
}


// sendPasswordResetEmail sends the reset email.
func (s *PasswordResetService) sendPasswordResetEmail(email, name, token string) {
	// In production, this would be a proper URL
	resetLink := "http://localhost:3000/auth/reset-password?token=" + token

	subject := "MediSync - Recuperação de Senha"
	body := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 MediSync</h1>
        </div>
        <div class="content">
            <h2>Olá, ` + name + `!</h2>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <p style="text-align: center;">
                <a href="` + resetLink + `" class="button">Redefinir Senha</a>
            </p>
            <p><strong>Este link expira em 1 hora.</strong></p>
            <p>Se você não solicitou esta alteração, ignore este email.</p>
        </div>
        <div class="footer">
            <p>© 2024 MediSync - Plataforma de Telemedicina</p>
        </div>
    </div>
</body>
</html>`

	s.emailService.SendEmail(email, subject, body)
}

// ResetPassword validates token and updates password.
func (s *PasswordResetService) ResetPassword(ctx context.Context, token, newPassword string) error {
	// Find valid token
	var resetToken domain.PasswordResetToken
	err := s.db.WithContext(ctx).
		Where("token = ? AND used = ? AND expires_at > ?", token, false, time.Now()).
		First(&resetToken).Error

	if err != nil {
		return errors.New("invalid or expired token")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash password")
	}

	// Update password
	err = s.db.WithContext(ctx).
		Model(&domain.User{}).
		Where("id = ?", resetToken.UserID).
		Update("password_hash", string(hashedPassword)).Error

	if err != nil {
		return errors.New("failed to update password")
	}

	// Mark token as used
	s.db.WithContext(ctx).
		Model(&resetToken).
		Update("used", true)

	return nil
}

// ValidateToken checks if a token is valid.
func (s *PasswordResetService) ValidateToken(ctx context.Context, token string) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).
		Model(&domain.PasswordResetToken{}).
		Where("token = ? AND used = ? AND expires_at > ?", token, false, time.Now()).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}
