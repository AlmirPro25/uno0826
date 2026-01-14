package services

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"
	"fmt"
	"strings"
	"time"
)

// TwoFactorService gerencia autenticação de dois fatores
type TwoFactorService struct {
	issuer string
}

// TwoFactorSecret representa o segredo 2FA de um usuário
type TwoFactorSecret struct {
	Secret    string `json:"secret"`
	QRCodeURL string `json:"qr_code_url"`
	BackupCodes []string `json:"backup_codes,omitempty"`
}

// NewTwoFactorService cria uma nova instância do serviço 2FA
func NewTwoFactorService() *TwoFactorService {
	return &TwoFactorService{
		issuer: "MediSync",
	}
}

// GenerateSecret gera um novo segredo TOTP para o usuário
func (s *TwoFactorService) GenerateSecret(email string) (*TwoFactorSecret, error) {
	// Gerar 20 bytes aleatórios
	secret := make([]byte, 20)
	if _, err := rand.Read(secret); err != nil {
		return nil, err
	}

	// Codificar em base32
	secretBase32 := base32.StdEncoding.EncodeToString(secret)
	secretBase32 = strings.TrimRight(secretBase32, "=")

	// Gerar URL para QR Code (formato otpauth://)
	qrCodeURL := fmt.Sprintf(
		"otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
		s.issuer,
		email,
		secretBase32,
		s.issuer,
	)

	// Gerar códigos de backup
	backupCodes := s.generateBackupCodes(8)

	return &TwoFactorSecret{
		Secret:      secretBase32,
		QRCodeURL:   qrCodeURL,
		BackupCodes: backupCodes,
	}, nil
}

// ValidateCode valida um código TOTP
func (s *TwoFactorService) ValidateCode(secret, code string) bool {
	// Decodificar segredo
	secretBytes, err := base32.StdEncoding.DecodeString(padBase32(secret))
	if err != nil {
		return false
	}

	// Verificar código atual e adjacentes (para compensar dessincronização de relógio)
	currentTime := time.Now().Unix()
	
	for i := -1; i <= 1; i++ {
		timestamp := currentTime + int64(i*30)
		expectedCode := s.generateTOTP(secretBytes, timestamp)
		if expectedCode == code {
			return true
		}
	}

	return false
}

// ValidateBackupCode valida um código de backup
func (s *TwoFactorService) ValidateBackupCode(storedCodes []string, inputCode string) (bool, []string) {
	inputCode = strings.ToUpper(strings.ReplaceAll(inputCode, "-", ""))
	
	for i, code := range storedCodes {
		if code == inputCode {
			// Remover código usado
			newCodes := append(storedCodes[:i], storedCodes[i+1:]...)
			return true, newCodes
		}
	}
	
	return false, storedCodes
}

// generateTOTP gera um código TOTP para um timestamp específico
func (s *TwoFactorService) generateTOTP(secret []byte, timestamp int64) string {
	// Calcular contador (timestamp / 30 segundos)
	counter := uint64(timestamp / 30)

	// Converter contador para bytes (big-endian)
	counterBytes := make([]byte, 8)
	binary.BigEndian.PutUint64(counterBytes, counter)

	// Calcular HMAC-SHA1
	h := hmac.New(sha1.New, secret)
	h.Write(counterBytes)
	hash := h.Sum(nil)

	// Truncamento dinâmico
	offset := hash[len(hash)-1] & 0x0f
	truncatedHash := binary.BigEndian.Uint32(hash[offset:offset+4]) & 0x7fffffff

	// Gerar código de 6 dígitos
	code := truncatedHash % 1000000

	return fmt.Sprintf("%06d", code)
}

// generateBackupCodes gera códigos de backup
func (s *TwoFactorService) generateBackupCodes(count int) []string {
	codes := make([]string, count)
	
	for i := 0; i < count; i++ {
		// Gerar 4 bytes aleatórios
		bytes := make([]byte, 4)
		rand.Read(bytes)
		
		// Converter para código de 8 caracteres
		code := fmt.Sprintf("%08X", binary.BigEndian.Uint32(bytes))
		codes[i] = code
	}
	
	return codes
}

// padBase32 adiciona padding ao base32 se necessário
func padBase32(s string) string {
	if m := len(s) % 8; m != 0 {
		s += strings.Repeat("=", 8-m)
	}
	return s
}

// GetQRCodeImageURL retorna URL para gerar imagem do QR Code
func (s *TwoFactorService) GetQRCodeImageURL(otpauthURL string) string {
	// Usar Google Charts API para gerar QR Code
	// Em produção, considerar gerar localmente
	return fmt.Sprintf(
		"https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=%s",
		otpauthURL,
	)
}

// FormatBackupCode formata código de backup para exibição
func FormatBackupCode(code string) string {
	if len(code) != 8 {
		return code
	}
	return code[:4] + "-" + code[4:]
}
