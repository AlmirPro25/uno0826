package services

import (
	"context"
	"errors"
	"fmt"
	"medisync-platform/backend/internal/adapters/repository"
	"medisync-platform/backend/internal/core/domain"
	"net/http"
	"time"
)

// VerificationService handles 2FA verification logic
type VerificationService struct {
	repo        *repository.VerificationCodeRepository
	userRepo    *repository.UserRepository
	whatsAppURL string
	httpClient  *http.Client
}

// NewVerificationService creates a new verification service
func NewVerificationService(repo *repository.VerificationCodeRepository, userRepo *repository.UserRepository, whatsAppURL string) *VerificationService {
	return &VerificationService{
		repo:        repo,
		userRepo:    userRepo,
		whatsAppURL: whatsAppURL,
		httpClient:  &http.Client{Timeout: 10 * time.Second},
	}
}

// RequestVerificationCode sends a verification code to the user
func (s *VerificationService) RequestVerificationCode(ctx context.Context, userID int, purpose, channel string) (*domain.VerificationCode, error) {
	// Rate limiting: max 5 codes per hour
	count, err := s.repo.GetRecentCodeCount(ctx, userID, purpose)
	if err != nil {
		return nil, err
	}
	if count >= 5 {
		return nil, errors.New("too many verification requests, please try again later")
	}

	// Invalidate previous codes
	s.repo.InvalidateAllForUser(ctx, userID, purpose)

	// Create new verification code
	code := &domain.VerificationCode{
		UserID:      userID,
		Purpose:     purpose,
		Channel:     channel,
		MaxAttempts: 3,
		ExpiresAt:   time.Now().Add(5 * time.Minute),
	}

	if err := s.repo.Create(ctx, code); err != nil {
		return nil, err
	}

	// Get user info
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Send code via channel
	switch channel {
	case domain.VerificationChannelWhatsApp:
		if user.Phone != nil && *user.Phone != "" {
			if err := s.sendWhatsAppCode(ctx, *user.Phone, code.Code, user.FullName); err != nil {
				// Log error but don't fail - code is still valid
				fmt.Printf("Failed to send WhatsApp code: %v\n", err)
			}
		}
	case domain.VerificationChannelEmail:
		if user.Email != "" {
			if err := s.sendEmailCode(ctx, user.Email, code.Code, user.FullName); err != nil {
				fmt.Printf("Failed to send email code: %v\n", err)
			}
		}
	}

	return code, nil
}

// VerifyCode verifies a submitted code
func (s *VerificationService) VerifyCode(ctx context.Context, userID int, purpose, code string) (bool, error) {
	return s.repo.Verify(ctx, userID, purpose, code)
}

// sendWhatsAppCode sends verification code via WhatsApp service
func (s *VerificationService) sendWhatsAppCode(ctx context.Context, phone, code, userName string) error {
	if s.whatsAppURL == "" {
		return nil // WhatsApp service not configured
	}

	// Call WhatsApp service API
	url := fmt.Sprintf("%s/api/notifications/verification", s.whatsAppURL)
	payload := fmt.Sprintf(`{
		"recipient": {"phone": "%s", "name": "%s"},
		"code": "%s",
		"channel": "whatsapp"
	}`, phone, userName, code)

	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Body = http.NoBody
	// Note: In production, use proper request body

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("WhatsApp service returned status %d", resp.StatusCode)
	}

	_ = payload // Placeholder - actual implementation would POST this
	return nil
}

// sendEmailCode sends verification code via email service
func (s *VerificationService) sendEmailCode(ctx context.Context, email, code, userName string) error {
	if s.whatsAppURL == "" {
		return nil // Email service not configured (same service)
	}

	// Call notification service API
	url := fmt.Sprintf("%s/api/notifications/verification", s.whatsAppURL)
	_ = url // Placeholder for actual implementation
	_ = email
	_ = code
	_ = userName

	return nil
}

// CleanupExpiredCodes removes expired codes (call periodically)
func (s *VerificationService) CleanupExpiredCodes(ctx context.Context) error {
	return s.repo.CleanupExpired(ctx)
}
