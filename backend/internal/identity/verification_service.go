package identity

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"os"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// IDENTITY KERNEL - VERIFICATION SERVICE
// "Phone é identidade. WhatsApp é canal."
// ========================================

// Rate limit constants (definidos pelo Tech Lead)
const (
	MaxAttemptsPerVerification = 3
	MaxVerificationsPerHour    = 5
	MaxVerificationsPerIPHour  = 10
	BlockDurationMinutes       = 15
	OTPExpirationMinutes       = 5
	OTPLength                  = 6
)

var (
	ErrRateLimited       = errors.New("rate limited: too many attempts")
	ErrVerificationNotFound = errors.New("verification not found")
	ErrVerificationExpired  = errors.New("verification expired")
	ErrInvalidCode          = errors.New("invalid verification code")
	ErrMaxAttemptsReached   = errors.New("max attempts reached")
)

// VerificationService gerencia o fluxo de verificação OTP
type VerificationService struct {
	db           *gorm.DB
	serverSecret string
}

// NewVerificationService cria uma nova instância do serviço
func NewVerificationService(db *gorm.DB) *VerificationService {
	secret := os.Getenv("OTP_SECRET")
	if secret == "" {
		secret = os.Getenv("JWT_SECRET") // fallback
	}
	return &VerificationService{
		db:           db,
		serverSecret: secret,
	}
}

// RequestVerification inicia o processo de verificação de telefone
func (s *VerificationService) RequestVerification(phoneNumber, channel, requestIP string) (*PendingVerification, string, error) {
	// 1. Check rate limits
	if err := s.checkRateLimits(phoneNumber, requestIP); err != nil {
		return nil, "", err
	}

	// 2. Generate OTP
	otp, err := generateOTP(OTPLength)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate OTP: %w", err)
	}

	// 3. Create verification record
	verificationID := uuid.New()
	codeHash := s.hashOTP(otp, verificationID.String())
	expiresAt := time.Now().Add(OTPExpirationMinutes * time.Minute)

	pending := &PendingVerification{
		VerificationID: verificationID,
		PhoneNumber:    phoneNumber,
		CodeHash:       codeHash,
		Channel:        channel,
		Attempts:       0,
		RequestIP:      requestIP,
		CreatedAt:      time.Now(),
		ExpiresAt:      expiresAt,
	}

	if err := s.db.Create(pending).Error; err != nil {
		return nil, "", fmt.Errorf("failed to create verification: %w", err)
	}

	// 4. Increment rate limit counters
	s.incrementRateLimit("phone:"+phoneNumber)
	s.incrementRateLimit("ip:"+requestIP)

	// 5. Return pending (OTP goes to delivery channel, not stored plain)
	return pending, otp, nil
}

// VerifyCode verifica o código OTP e retorna/cria a identidade (LEGACY)
func (s *VerificationService) VerifyCode(verificationID uuid.UUID, code string) (*SovereignIdentity, error) {
	// 1. Find pending verification
	var pending PendingVerification
	if err := s.db.Where("verification_id = ?", verificationID).First(&pending).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrVerificationNotFound
		}
		return nil, err
	}

	// 2. Check expiration
	if time.Now().After(pending.ExpiresAt) {
		s.db.Delete(&pending)
		return nil, ErrVerificationExpired
	}

	// 3. Check max attempts
	if pending.Attempts >= MaxAttemptsPerVerification {
		s.db.Delete(&pending)
		return nil, ErrMaxAttemptsReached
	}

	// 4. Verify code hash
	expectedHash := s.hashOTP(code, verificationID.String())
	if expectedHash != pending.CodeHash {
		// Increment attempts
		pending.Attempts++
		s.db.Save(&pending)
		return nil, ErrInvalidCode
	}

	// 5. Code is valid! Create or get identity
	identity, err := s.getOrCreateIdentity(pending.PhoneNumber, pending.Channel)
	if err != nil {
		return nil, err
	}

	// 6. Clean up pending verification
	s.db.Delete(&pending)

	return identity, nil
}

// ValidateCode apenas valida o código sem criar identidade (NOVO FLUXO)
func (s *VerificationService) ValidateCode(verificationID uuid.UUID, code string) (*PendingVerification, error) {
	var pending PendingVerification
	if err := s.db.Where("verification_id = ?", verificationID).First(&pending).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrVerificationNotFound
		}
		return nil, err
	}

	if time.Now().After(pending.ExpiresAt) {
		s.db.Delete(&pending)
		return nil, ErrVerificationExpired
	}

	if pending.Attempts >= MaxAttemptsPerVerification {
		s.db.Delete(&pending)
		return nil, ErrMaxAttemptsReached
	}

	expectedHash := s.hashOTP(code, verificationID.String())
	if expectedHash != pending.CodeHash {
		pending.Attempts++
		s.db.Save(&pending)
		return nil, ErrInvalidCode
	}

	// Código válido - marcar como verificado mas NÃO deletar ainda
	pending.Attempts = -1 // Marca como verificado
	s.db.Save(&pending)

	return &pending, nil
}

// GetPendingVerification busca verificação pendente
func (s *VerificationService) GetPendingVerification(verificationID uuid.UUID) (*PendingVerification, error) {
	var pending PendingVerification
	if err := s.db.Where("verification_id = ? AND attempts = -1", verificationID).First(&pending).Error; err != nil {
		return nil, err
	}
	return &pending, nil
}

// DeleteVerification remove verificação
func (s *VerificationService) DeleteVerification(verificationID uuid.UUID) {
	s.db.Where("verification_id = ?", verificationID).Delete(&PendingVerification{})
}

// getOrCreateIdentity busca ou cria uma identidade soberana
func (s *VerificationService) getOrCreateIdentity(phoneNumber, channel string) (*SovereignIdentity, error) {
	var identity SovereignIdentity

	// Try to find existing
	err := s.db.Where("primary_phone = ?", phoneNumber).First(&identity).Error
	if err == nil {
		// Identity exists, update timestamp
		identity.UpdatedAt = time.Now()
		s.db.Save(&identity)
		return &identity, nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Create new sovereign identity
	identity = SovereignIdentity{
		UserID:       uuid.New(),
		PrimaryPhone: phoneNumber,
		Source:       string(SourcePhone),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.db.Create(&identity).Error; err != nil {
		return nil, fmt.Errorf("failed to create identity: %w", err)
	}

	return &identity, nil
}

// CreateSession cria uma nova sessão para a identidade
func (s *VerificationService) CreateSession(userID uuid.UUID, deviceFingerprint string) (*SovereignSession, error) {
	session := &SovereignSession{
		SessionID:         uuid.New(),
		UserID:            userID,
		DeviceFingerprint: deviceFingerprint,
		CreatedAt:         time.Now(),
		ExpiresAt:         time.Now().Add(24 * time.Hour * 7), // 7 days
		IsActive:          true,
	}

	if err := s.db.Create(session).Error; err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return session, nil
}

// RevokeSession revoga uma sessão
func (s *VerificationService) RevokeSession(sessionID uuid.UUID, reason string) error {
	return s.db.Model(&SovereignSession{}).
		Where("session_id = ?", sessionID).
		Updates(map[string]interface{}{
			"is_active": false,
		}).Error
}

// GetIdentityByPhone busca identidade por telefone
func (s *VerificationService) GetIdentityByPhone(phoneNumber string) (*SovereignIdentity, error) {
	var identity SovereignIdentity
	if err := s.db.Where("primary_phone = ?", phoneNumber).First(&identity).Error; err != nil {
		return nil, err
	}
	return &identity, nil
}

// GetIdentityByID busca identidade por ID
func (s *VerificationService) GetIdentityByID(userID uuid.UUID) (*SovereignIdentity, error) {
	var identity SovereignIdentity
	if err := s.db.Where("user_id = ?", userID).First(&identity).Error; err != nil {
		return nil, err
	}
	return &identity, nil
}

// ========================================
// HELPER FUNCTIONS
// ========================================

// hashOTP gera hash SHA256 do OTP (conforme Tech Lead: SHA256 + salt é suficiente)
func (s *VerificationService) hashOTP(otp, verificationID string) string {
	data := otp + s.serverSecret + verificationID
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// generateOTP gera um código OTP numérico
func generateOTP(length int) (string, error) {
	const digits = "0123456789"
	result := make([]byte, length)
	for i := range result {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		if err != nil {
			return "", err
		}
		result[i] = digits[num.Int64()]
	}
	return string(result), nil
}

// checkRateLimits verifica rate limits por phone e IP
func (s *VerificationService) checkRateLimits(phoneNumber, requestIP string) error {
	now := time.Now()
	hourAgo := now.Add(-1 * time.Hour)

	// Check phone rate limit
	var phoneCount int64
	s.db.Model(&RateLimitEntry{}).
		Where("key = ? AND window_start > ?", "phone:"+phoneNumber, hourAgo).
		Count(&phoneCount)

	if phoneCount >= MaxVerificationsPerHour {
		return ErrRateLimited
	}

	// Check IP rate limit
	var ipCount int64
	s.db.Model(&RateLimitEntry{}).
		Where("key = ? AND window_start > ?", "ip:"+requestIP, hourAgo).
		Count(&ipCount)

	if ipCount >= MaxVerificationsPerIPHour {
		return ErrRateLimited
	}

	// Check if blocked
	var blocked RateLimitEntry
	err := s.db.Where("key IN (?, ?) AND blocked_until > ?",
		"phone:"+phoneNumber, "ip:"+requestIP, now).First(&blocked).Error
	if err == nil {
		return ErrRateLimited
	}

	return nil
}

// incrementRateLimit incrementa contador de rate limit
func (s *VerificationService) incrementRateLimit(key string) {
	entry := RateLimitEntry{
		ID:           uuid.New(),
		Key:          key,
		AttemptCount: 1,
		WindowStart:  time.Now(),
	}
	s.db.Create(&entry)
}
