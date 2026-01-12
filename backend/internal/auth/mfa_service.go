package auth

/*
================================================================================
MFA SERVICE — AUTENTICAÇÃO MULTI-FATOR
================================================================================

Implementa TOTP (Time-based One-Time Password) para admins:
- Geração de secret
- Verificação de código
- Backup codes
- Recovery

"Dois fatores são melhor que um"

================================================================================
*/

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MFAConfig configuração de MFA
type MFAConfig struct {
	Issuer     string // Nome do serviço (ex: "PROST-QS")
	Digits     int    // Número de dígitos (6)
	Period     int    // Período em segundos (30)
	Algorithm  string // Algoritmo (SHA1)
	SecretSize int    // Tamanho do secret em bytes (20)
}

// DefaultMFAConfig configuração padrão
func DefaultMFAConfig() MFAConfig {
	return MFAConfig{
		Issuer:     "PROST-QS",
		Digits:     6,
		Period:     30,
		Algorithm:  "SHA1",
		SecretSize: 20,
	}
}

// MFASetup dados de setup de MFA
type MFASetup struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID      uuid.UUID  `gorm:"type:uuid;index;not null" json:"user_id"`
	Secret      string     `gorm:"not null" json:"-"` // Nunca expor
	Enabled     bool       `gorm:"default:false" json:"enabled"`
	VerifiedAt  *time.Time `json:"verified_at,omitempty"`
	BackupCodes string     `gorm:"type:text" json:"-"` // JSON array, nunca expor
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// MFAService serviço de MFA
type MFAService struct {
	db     *gorm.DB
	config MFAConfig
}

// NewMFAService cria novo serviço
func NewMFAService(db *gorm.DB) *MFAService {
	// Auto-migrate
	db.AutoMigrate(&MFASetup{})
	
	return &MFAService{
		db:     db,
		config: DefaultMFAConfig(),
	}
}

// GenerateSecret gera um novo secret TOTP
func (s *MFAService) GenerateSecret() (string, error) {
	secret := make([]byte, s.config.SecretSize)
	_, err := rand.Read(secret)
	if err != nil {
		return "", err
	}
	return base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(secret), nil
}

// GenerateBackupCodes gera códigos de backup
func (s *MFAService) GenerateBackupCodes(count int) ([]string, error) {
	codes := make([]string, count)
	for i := 0; i < count; i++ {
		code := make([]byte, 4)
		_, err := rand.Read(code)
		if err != nil {
			return nil, err
		}
		// Formato: XXXX-XXXX
		codes[i] = fmt.Sprintf("%04X-%04X", 
			binary.BigEndian.Uint16(code[:2]),
			binary.BigEndian.Uint16(code[2:]))
	}
	return codes, nil
}

// SetupMFA inicia setup de MFA para um usuário
func (s *MFAService) SetupMFA(userID uuid.UUID, email string) (*MFASetupResponse, error) {
	// Verificar se já existe setup
	var existing MFASetup
	if err := s.db.Where("user_id = ?", userID).First(&existing).Error; err == nil {
		if existing.Enabled {
			return nil, fmt.Errorf("MFA já está habilitado para este usuário")
		}
		// Deletar setup antigo não verificado
		s.db.Delete(&existing)
	}

	// Gerar novo secret
	secret, err := s.GenerateSecret()
	if err != nil {
		return nil, fmt.Errorf("erro ao gerar secret: %w", err)
	}

	// Gerar backup codes
	backupCodes, err := s.GenerateBackupCodes(10)
	if err != nil {
		return nil, fmt.Errorf("erro ao gerar backup codes: %w", err)
	}

	// Criar setup
	setup := MFASetup{
		ID:          uuid.New(),
		UserID:      userID,
		Secret:      secret,
		Enabled:     false,
		BackupCodes: strings.Join(backupCodes, ","),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.Create(&setup).Error; err != nil {
		return nil, fmt.Errorf("erro ao salvar setup: %w", err)
	}

	// Gerar URI para QR code
	uri := s.GenerateOTPAuthURI(secret, email)

	return &MFASetupResponse{
		SetupID:     setup.ID,
		Secret:      secret,
		QRCodeURI:   uri,
		BackupCodes: backupCodes,
	}, nil
}

// MFASetupResponse resposta de setup
type MFASetupResponse struct {
	SetupID     uuid.UUID `json:"setup_id"`
	Secret      string    `json:"secret"`
	QRCodeURI   string    `json:"qr_code_uri"`
	BackupCodes []string  `json:"backup_codes"`
}

// GenerateOTPAuthURI gera URI para apps autenticadores
func (s *MFAService) GenerateOTPAuthURI(secret, email string) string {
	return fmt.Sprintf(
		"otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=%s&digits=%d&period=%d",
		s.config.Issuer,
		email,
		secret,
		s.config.Issuer,
		s.config.Algorithm,
		s.config.Digits,
		s.config.Period,
	)
}

// VerifyAndEnable verifica código e habilita MFA
func (s *MFAService) VerifyAndEnable(userID uuid.UUID, code string) error {
	var setup MFASetup
	if err := s.db.Where("user_id = ? AND enabled = ?", userID, false).First(&setup).Error; err != nil {
		return fmt.Errorf("setup de MFA não encontrado")
	}

	// Verificar código
	if !s.VerifyCode(setup.Secret, code) {
		return fmt.Errorf("código inválido")
	}

	// Habilitar MFA
	now := time.Now()
	setup.Enabled = true
	setup.VerifiedAt = &now
	setup.UpdatedAt = now

	return s.db.Save(&setup).Error
}

// VerifyCode verifica um código TOTP
func (s *MFAService) VerifyCode(secret, code string) bool {
	// Verificar código atual e adjacentes (tolerância de 1 período)
	for i := -1; i <= 1; i++ {
		expectedCode := s.GenerateTOTP(secret, time.Now().Add(time.Duration(i*s.config.Period)*time.Second))
		if code == expectedCode {
			return true
		}
	}
	return false
}

// GenerateTOTP gera código TOTP para um momento específico
func (s *MFAService) GenerateTOTP(secret string, t time.Time) string {
	// Decodificar secret
	secretBytes, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(strings.ToUpper(secret))
	if err != nil {
		return ""
	}

	// Calcular counter (número de períodos desde epoch)
	counter := uint64(t.Unix()) / uint64(s.config.Period)

	// Converter counter para bytes (big-endian)
	counterBytes := make([]byte, 8)
	binary.BigEndian.PutUint64(counterBytes, counter)

	// HMAC-SHA1
	h := hmac.New(sha1.New, secretBytes)
	h.Write(counterBytes)
	hash := h.Sum(nil)

	// Dynamic truncation
	offset := hash[len(hash)-1] & 0x0f
	code := binary.BigEndian.Uint32(hash[offset:offset+4]) & 0x7fffffff

	// Formatar com zeros à esquerda
	return fmt.Sprintf("%0*d", s.config.Digits, code%uint32(pow10(s.config.Digits)))
}

// pow10 calcula 10^n
func pow10(n int) int {
	result := 1
	for i := 0; i < n; i++ {
		result *= 10
	}
	return result
}

// ValidateMFA valida MFA para login
func (s *MFAService) ValidateMFA(userID uuid.UUID, code string) (bool, error) {
	var setup MFASetup
	if err := s.db.Where("user_id = ? AND enabled = ?", userID, true).First(&setup).Error; err != nil {
		// MFA não habilitado - permitir
		return true, nil
	}

	// Verificar código TOTP
	if s.VerifyCode(setup.Secret, code) {
		return true, nil
	}

	// Verificar backup code
	backupCodes := strings.Split(setup.BackupCodes, ",")
	for i, bc := range backupCodes {
		if bc == code {
			// Remover código usado
			backupCodes = append(backupCodes[:i], backupCodes[i+1:]...)
			setup.BackupCodes = strings.Join(backupCodes, ",")
			setup.UpdatedAt = time.Now()
			s.db.Save(&setup)
			return true, nil
		}
	}

	return false, fmt.Errorf("código MFA inválido")
}

// IsMFAEnabled verifica se MFA está habilitado
func (s *MFAService) IsMFAEnabled(userID uuid.UUID) bool {
	var setup MFASetup
	if err := s.db.Where("user_id = ? AND enabled = ?", userID, true).First(&setup).Error; err != nil {
		return false
	}
	return true
}

// DisableMFA desabilita MFA (requer código válido)
func (s *MFAService) DisableMFA(userID uuid.UUID, code string) error {
	var setup MFASetup
	if err := s.db.Where("user_id = ? AND enabled = ?", userID, true).First(&setup).Error; err != nil {
		return fmt.Errorf("MFA não está habilitado")
	}

	// Verificar código
	if !s.VerifyCode(setup.Secret, code) {
		return fmt.Errorf("código inválido")
	}

	// Deletar setup
	return s.db.Delete(&setup).Error
}

// RegenerateBackupCodes regenera códigos de backup
func (s *MFAService) RegenerateBackupCodes(userID uuid.UUID, code string) ([]string, error) {
	var setup MFASetup
	if err := s.db.Where("user_id = ? AND enabled = ?", userID, true).First(&setup).Error; err != nil {
		return nil, fmt.Errorf("MFA não está habilitado")
	}

	// Verificar código
	if !s.VerifyCode(setup.Secret, code) {
		return nil, fmt.Errorf("código inválido")
	}

	// Gerar novos códigos
	backupCodes, err := s.GenerateBackupCodes(10)
	if err != nil {
		return nil, err
	}

	setup.BackupCodes = strings.Join(backupCodes, ",")
	setup.UpdatedAt = time.Now()

	if err := s.db.Save(&setup).Error; err != nil {
		return nil, err
	}

	return backupCodes, nil
}

// GetMFAStatus retorna status de MFA
func (s *MFAService) GetMFAStatus(userID uuid.UUID) *MFAStatus {
	var setup MFASetup
	if err := s.db.Where("user_id = ?", userID).First(&setup).Error; err != nil {
		return &MFAStatus{
			Enabled:    false,
			SetupID:    uuid.Nil,
			VerifiedAt: nil,
		}
	}

	backupCodesRemaining := 0
	if setup.BackupCodes != "" {
		backupCodesRemaining = len(strings.Split(setup.BackupCodes, ","))
	}

	return &MFAStatus{
		Enabled:              setup.Enabled,
		SetupID:              setup.ID,
		VerifiedAt:           setup.VerifiedAt,
		BackupCodesRemaining: backupCodesRemaining,
	}
}

// MFAStatus status de MFA
type MFAStatus struct {
	Enabled              bool       `json:"enabled"`
	SetupID              uuid.UUID  `json:"setup_id,omitempty"`
	VerifiedAt           *time.Time `json:"verified_at,omitempty"`
	BackupCodesRemaining int        `json:"backup_codes_remaining"`
}
