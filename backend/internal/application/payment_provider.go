package application

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"os"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// PAYMENT PROVIDER - Stripe por App
// "Cada app conecta sua própria Stripe"
// ========================================

// AppPaymentProvider representa a configuração de pagamento de um app
type AppPaymentProvider struct {
	ID              uuid.UUID  `gorm:"type:text;primaryKey" json:"id"`
	AppID           uuid.UUID  `gorm:"type:text;not null;uniqueIndex" json:"app_id"`
	Provider        string     `gorm:"type:text;not null" json:"provider"` // stripe, mercadopago, etc
	Status          string     `gorm:"type:text;not null;default:'pending'" json:"status"` // pending, connected, revoked, error
	EncryptedKeys   string     `gorm:"type:text" json:"-"` // Chaves criptografadas (AES-256)
	PublicKey       string     `gorm:"type:text" json:"public_key,omitempty"` // Chave pública (pode mostrar)
	WebhookSecret   string     `gorm:"type:text" json:"-"` // Webhook secret (criptografado)
	WebhookURL      string     `gorm:"type:text" json:"webhook_url,omitempty"`
	Environment     string     `gorm:"type:text;default:'test'" json:"environment"` // test, live
	ConnectedAt     *time.Time `json:"connected_at,omitempty"`
	LastUsedAt      *time.Time `json:"last_used_at,omitempty"`
	LastError       string     `gorm:"type:text" json:"last_error,omitempty"`
	CreatedAt       time.Time  `gorm:"not null" json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (AppPaymentProvider) TableName() string {
	return "app_payment_providers"
}

// Provider constants
const (
	ProviderStripe      = "stripe"
	ProviderMercadoPago = "mercadopago"
)

// Status constants
const (
	ProviderStatusPending   = "pending"
	ProviderStatusConnected = "connected"
	ProviderStatusRevoked   = "revoked"
	ProviderStatusError     = "error"
)

// StripeKeys estrutura para chaves Stripe
type StripeKeys struct {
	SecretKey      string `json:"secret_key"`
	PublishableKey string `json:"publishable_key"`
	WebhookSecret  string `json:"webhook_secret,omitempty"`
}

// ========================================
// PAYMENT PROVIDER SERVICE
// ========================================

type PaymentProviderService struct {
	db            *gorm.DB
	encryptionKey []byte
}

func NewPaymentProviderService(db *gorm.DB) *PaymentProviderService {
	// Usar chave de ambiente ou gerar uma
	key := os.Getenv("PAYMENT_ENCRYPTION_KEY")
	if key == "" {
		key = "prost-qs-default-key-32bytes!!" // 32 bytes para AES-256
	}
	
	return &PaymentProviderService{
		db:            db,
		encryptionKey: []byte(key)[:32],
	}
}

// ConnectStripe conecta uma conta Stripe ao app
func (s *PaymentProviderService) ConnectStripe(appID uuid.UUID, secretKey, publishableKey, webhookSecret, environment string) (*AppPaymentProvider, error) {
	// Verificar se já existe
	var existing AppPaymentProvider
	if err := s.db.Where("app_id = ? AND provider = ?", appID, ProviderStripe).First(&existing).Error; err == nil {
		// Atualizar existente
		return s.updateProvider(&existing, secretKey, publishableKey, webhookSecret, environment)
	}

	// Criar novo
	keys := StripeKeys{
		SecretKey:      secretKey,
		PublishableKey: publishableKey,
		WebhookSecret:  webhookSecret,
	}

	encryptedKeys, err := s.encryptKeys(keys)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	provider := &AppPaymentProvider{
		ID:            uuid.New(),
		AppID:         appID,
		Provider:      ProviderStripe,
		Status:        ProviderStatusConnected,
		EncryptedKeys: encryptedKeys,
		PublicKey:     publishableKey,
		Environment:   environment,
		ConnectedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := s.db.Create(provider).Error; err != nil {
		return nil, err
	}

	return provider, nil
}

func (s *PaymentProviderService) updateProvider(provider *AppPaymentProvider, secretKey, publishableKey, webhookSecret, environment string) (*AppPaymentProvider, error) {
	keys := StripeKeys{
		SecretKey:      secretKey,
		PublishableKey: publishableKey,
		WebhookSecret:  webhookSecret,
	}

	encryptedKeys, err := s.encryptKeys(keys)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	provider.EncryptedKeys = encryptedKeys
	provider.PublicKey = publishableKey
	provider.Environment = environment
	provider.Status = ProviderStatusConnected
	provider.ConnectedAt = &now
	provider.UpdatedAt = now
	provider.LastError = ""

	if err := s.db.Save(provider).Error; err != nil {
		return nil, err
	}

	return provider, nil
}

// GetProvider retorna o provider de um app
func (s *PaymentProviderService) GetProvider(appID uuid.UUID, provider string) (*AppPaymentProvider, error) {
	var p AppPaymentProvider
	err := s.db.Where("app_id = ? AND provider = ?", appID, provider).First(&p).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// GetStripeKeys retorna as chaves Stripe descriptografadas (uso interno)
func (s *PaymentProviderService) GetStripeKeys(appID uuid.UUID) (*StripeKeys, error) {
	provider, err := s.GetProvider(appID, ProviderStripe)
	if err != nil {
		return nil, err
	}

	if provider.Status != ProviderStatusConnected {
		return nil, errors.New("provider não está conectado")
	}

	keys, err := s.decryptKeys(provider.EncryptedKeys)
	if err != nil {
		return nil, err
	}

	// Atualizar last_used_at
	now := time.Now()
	s.db.Model(provider).Update("last_used_at", now)

	return keys, nil
}

// RevokeProvider revoga um provider
func (s *PaymentProviderService) RevokeProvider(appID uuid.UUID, provider string) error {
	return s.db.Model(&AppPaymentProvider{}).
		Where("app_id = ? AND provider = ?", appID, provider).
		Updates(map[string]interface{}{
			"status":         ProviderStatusRevoked,
			"encrypted_keys": "",
			"updated_at":     time.Now(),
		}).Error
}

// ListProviders lista providers de um app
func (s *PaymentProviderService) ListProviders(appID uuid.UUID) ([]AppPaymentProvider, error) {
	var providers []AppPaymentProvider
	err := s.db.Where("app_id = ?", appID).Find(&providers).Error
	return providers, err
}

// ========================================
// ENCRYPTION HELPERS
// ========================================

func (s *PaymentProviderService) encryptKeys(keys StripeKeys) (string, error) {
	plaintext, err := json.Marshal(keys)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (s *PaymentProviderService) decryptKeys(encrypted string) (*StripeKeys, error) {
	ciphertext, err := base64.StdEncoding.DecodeString(encrypted)
	if err != nil {
		return nil, err
	}

	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, errors.New("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	var keys StripeKeys
	if err := json.Unmarshal(plaintext, &keys); err != nil {
		return nil, err
	}

	return &keys, nil
}
