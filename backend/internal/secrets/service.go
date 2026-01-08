package secrets

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// SECRETS SERVICE - FASE 20
// "Criptografia em repouso, nunca expor valor completo"
// ========================================

type SecretsService struct {
	db        *gorm.DB
	masterKey []byte // 32 bytes para AES-256
}

func NewSecretsService(db *gorm.DB, masterKey string) (*SecretsService, error) {
	if len(masterKey) != 32 {
		return nil, errors.New("master key deve ter exatamente 32 bytes para AES-256")
	}
	return &SecretsService{
		db:        db,
		masterKey: []byte(masterKey),
	}, nil
}

// ========================================
// CRIPTOGRAFIA
// ========================================

// encrypt criptografa valor com AES-256-GCM
func (s *SecretsService) encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(s.masterKey)
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

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// decrypt descriptografa valor
func (s *SecretsService) decrypt(encrypted string) (string, error) {
	ciphertext, err := base64.StdEncoding.DecodeString(encrypted)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(s.masterKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", errors.New("ciphertext muito curto")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// maskValue retorna últimos 4 caracteres mascarados
func (s *SecretsService) maskValue(value string) string {
	if len(value) <= 4 {
		return "****"
	}
	return "****" + value[len(value)-4:]
}


// ========================================
// CRUD
// ========================================

// Create cria um novo secret
func (s *SecretsService) Create(req CreateSecretRequest, createdBy uuid.UUID) (*SecretResponse, error) {
	// Validações
	if !IsValidEnvironment(req.Environment) {
		return nil, fmt.Errorf("ambiente inválido: %s", req.Environment)
	}
	if !IsValidCategory(req.Category) {
		return nil, fmt.Errorf("categoria inválida: %s", req.Category)
	}

	// Verificar duplicata
	var existing Secret
	query := s.db.Where("name = ? AND environment = ?", req.Name, req.Environment)
	if req.AppID != nil {
		query = query.Where("app_id = ?", req.AppID)
	} else {
		query = query.Where("app_id IS NULL")
	}
	if err := query.First(&existing).Error; err == nil {
		return nil, fmt.Errorf("secret '%s' já existe para este ambiente", req.Name)
	}

	// Criptografar valor
	encrypted, err := s.encrypt(req.Value)
	if err != nil {
		return nil, fmt.Errorf("erro ao criptografar: %w", err)
	}

	now := time.Now()
	secret := Secret{
		ID:             uuid.New(),
		AppID:          req.AppID,
		Environment:    req.Environment,
		Name:           req.Name,
		EncryptedValue: encrypted,
		Description:    req.Description,
		Category:       req.Category,
		Version:        1,
		ExpiresAt:      req.ExpiresAt,
		IsActive:       true,
		CreatedBy:      createdBy,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := s.db.Create(&secret).Error; err != nil {
		return nil, err
	}

	// Criar versão inicial
	version := SecretVersion{
		ID:             uuid.New(),
		SecretID:       secret.ID,
		Version:        1,
		EncryptedValue: encrypted,
		CreatedBy:      createdBy,
		CreatedAt:      now,
		Reason:         "initial",
	}
	s.db.Create(&version)

	return s.toResponse(&secret, req.Value), nil
}

// Update atualiza valor de um secret (cria nova versão)
func (s *SecretsService) Update(id uuid.UUID, req UpdateSecretRequest, updatedBy uuid.UUID) (*SecretResponse, error) {
	var secret Secret
	if err := s.db.Where("id = ?", id).First(&secret).Error; err != nil {
		return nil, errors.New("secret não encontrado")
	}

	if !secret.IsActive {
		return nil, errors.New("secret está revogado")
	}

	// Criptografar novo valor
	encrypted, err := s.encrypt(req.Value)
	if err != nil {
		return nil, fmt.Errorf("erro ao criptografar: %w", err)
	}

	now := time.Now()
	newVersion := secret.Version + 1

	// Criar nova versão
	version := SecretVersion{
		ID:             uuid.New(),
		SecretID:       secret.ID,
		Version:        newVersion,
		EncryptedValue: encrypted,
		CreatedBy:      updatedBy,
		CreatedAt:      now,
		Reason:         req.Reason,
	}
	if err := s.db.Create(&version).Error; err != nil {
		return nil, err
	}

	// Atualizar secret
	secret.EncryptedValue = encrypted
	secret.Version = newVersion
	secret.UpdatedAt = now
	if req.ExpiresAt != nil {
		secret.ExpiresAt = req.ExpiresAt
	}

	if err := s.db.Save(&secret).Error; err != nil {
		return nil, err
	}

	return s.toResponse(&secret, req.Value), nil
}

// Revoke revoga um secret
func (s *SecretsService) Revoke(id uuid.UUID, revokedBy uuid.UUID) error {
	var secret Secret
	if err := s.db.Where("id = ?", id).First(&secret).Error; err != nil {
		return errors.New("secret não encontrado")
	}

	now := time.Now()
	secret.IsActive = false
	secret.RevokedAt = &now
	secret.RevokedBy = &revokedBy
	secret.UpdatedAt = now

	return s.db.Save(&secret).Error
}

// GetByID busca secret por ID
func (s *SecretsService) GetByID(id uuid.UUID) (*SecretResponse, error) {
	var secret Secret
	if err := s.db.Where("id = ?", id).First(&secret).Error; err != nil {
		return nil, errors.New("secret não encontrado")
	}

	// Descriptografar para pegar últimos chars
	value, _ := s.decrypt(secret.EncryptedValue)
	return s.toResponse(&secret, value), nil
}

// List lista secrets com filtros
func (s *SecretsService) List(appID *uuid.UUID, environment string, activeOnly bool) (*SecretListResponse, error) {
	query := s.db.Model(&Secret{})

	if appID != nil {
		query = query.Where("app_id = ?", appID)
	}
	if environment != "" {
		query = query.Where("environment = ?", environment)
	}
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	var total int64
	query.Count(&total)

	var secrets []Secret
	if err := query.Order("name ASC").Find(&secrets).Error; err != nil {
		return nil, err
	}

	responses := make([]SecretResponse, len(secrets))
	for i, secret := range secrets {
		value, _ := s.decrypt(secret.EncryptedValue)
		responses[i] = *s.toResponse(&secret, value)
	}

	return &SecretListResponse{
		Secrets: responses,
		Total:   total,
	}, nil
}


// ========================================
// INJEÇÃO DE SECRETS (uso interno)
// ========================================

// Inject retorna secrets descriptografados para um app/ambiente
// ATENÇÃO: Só usar internamente, nunca expor via API pública
func (s *SecretsService) Inject(appID uuid.UUID, environment string, actorID uuid.UUID, actorType, ip, userAgent string) (*SecretInjectResponse, error) {
	now := time.Now()

	// Buscar secrets do app + globais
	var secrets []Secret
	err := s.db.Where(
		"(app_id = ? OR app_id IS NULL) AND environment = ? AND is_active = ?",
		appID, environment, true,
	).Find(&secrets).Error
	if err != nil {
		return nil, err
	}

	result := make(map[string]string)
	for _, secret := range secrets {
		// Verificar expiração
		if secret.ExpiresAt != nil && secret.ExpiresAt.Before(now) {
			continue
		}

		// Descriptografar
		value, err := s.decrypt(secret.EncryptedValue)
		if err != nil {
			// Log de erro mas continua
			s.logAccess(secret.ID, &appID, actorID, actorType, "inject", ip, userAgent, false, err.Error())
			continue
		}

		result[secret.Name] = value
		s.logAccess(secret.ID, &appID, actorID, actorType, "inject", ip, userAgent, true, "")
	}

	return &SecretInjectResponse{
		Secrets: result,
		Count:   len(result),
	}, nil
}

// GetValue retorna valor descriptografado de um secret específico
// ATENÇÃO: Só usar internamente
func (s *SecretsService) GetValue(id uuid.UUID, actorID uuid.UUID, actorType, ip, userAgent string) (string, error) {
	var secret Secret
	if err := s.db.Where("id = ? AND is_active = ?", id, true).First(&secret).Error; err != nil {
		s.logAccess(id, nil, actorID, actorType, "read", ip, userAgent, false, "not found")
		return "", errors.New("secret não encontrado ou revogado")
	}

	// Verificar expiração
	if secret.ExpiresAt != nil && secret.ExpiresAt.Before(time.Now()) {
		s.logAccess(id, secret.AppID, actorID, actorType, "read", ip, userAgent, false, "expired")
		return "", errors.New("secret expirado")
	}

	value, err := s.decrypt(secret.EncryptedValue)
	if err != nil {
		s.logAccess(id, secret.AppID, actorID, actorType, "read", ip, userAgent, false, err.Error())
		return "", err
	}

	s.logAccess(id, secret.AppID, actorID, actorType, "read", ip, userAgent, true, "")
	return value, nil
}

// ========================================
// AUDIT LOG
// ========================================

func (s *SecretsService) logAccess(secretID uuid.UUID, appID *uuid.UUID, actorID uuid.UUID, actorType, action, ip, userAgent string, success bool, errMsg string) {
	access := SecretAccess{
		ID:        uuid.New(),
		SecretID:  secretID,
		AppID:     appID,
		ActorID:   actorID,
		ActorType: actorType,
		Action:    action,
		IP:        ip,
		UserAgent: userAgent,
		Success:   success,
		Error:     errMsg,
		Timestamp: time.Now(),
	}
	s.db.Create(&access)
}

// GetAccessLog retorna log de acesso de um secret
func (s *SecretsService) GetAccessLog(secretID uuid.UUID, limit int) ([]SecretAccess, error) {
	if limit <= 0 {
		limit = 50
	}

	var accesses []SecretAccess
	err := s.db.Where("secret_id = ?", secretID).
		Order("timestamp DESC").
		Limit(limit).
		Find(&accesses).Error

	return accesses, err
}

// GetVersions retorna histórico de versões
func (s *SecretsService) GetVersions(secretID uuid.UUID) ([]SecretVersion, error) {
	var versions []SecretVersion
	err := s.db.Where("secret_id = ?", secretID).
		Order("version DESC").
		Find(&versions).Error

	// Limpar valores criptografados da resposta
	for i := range versions {
		versions[i].EncryptedValue = "[REDACTED]"
	}

	return versions, err
}

// ========================================
// HELPERS
// ========================================

func (s *SecretsService) toResponse(secret *Secret, plainValue string) *SecretResponse {
	isExpired := false
	if secret.ExpiresAt != nil && secret.ExpiresAt.Before(time.Now()) {
		isExpired = true
	}

	return &SecretResponse{
		ID:          secret.ID,
		AppID:       secret.AppID,
		Environment: secret.Environment,
		Name:        secret.Name,
		Description: secret.Description,
		Category:    secret.Category,
		Version:     secret.Version,
		ExpiresAt:   secret.ExpiresAt,
		IsActive:    secret.IsActive,
		IsExpired:   isExpired,
		LastChars:   s.maskValue(plainValue),
		CreatedAt:   secret.CreatedAt,
		UpdatedAt:   secret.UpdatedAt,
	}
}

// ========================================
// ROTAÇÃO
// ========================================

// Rotate rotaciona um secret (cria nova versão com novo valor)
func (s *SecretsService) Rotate(id uuid.UUID, newValue string, rotatedBy uuid.UUID) (*SecretResponse, error) {
	return s.Update(id, UpdateSecretRequest{
		Value:  newValue,
		Reason: "rotation",
	}, rotatedBy)
}

// GetExpiringSoon retorna secrets que expiram em N dias
func (s *SecretsService) GetExpiringSoon(days int) ([]SecretResponse, error) {
	deadline := time.Now().AddDate(0, 0, days)

	var secrets []Secret
	err := s.db.Where(
		"is_active = ? AND expires_at IS NOT NULL AND expires_at <= ?",
		true, deadline,
	).Find(&secrets).Error
	if err != nil {
		return nil, err
	}

	responses := make([]SecretResponse, len(secrets))
	for i, secret := range secrets {
		value, _ := s.decrypt(secret.EncryptedValue)
		responses[i] = *s.toResponse(&secret, value)
	}

	return responses, nil
}
