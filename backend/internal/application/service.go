package application

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// APPLICATION SERVICE
// "Gerencia apps, credenciais, usuários e sessões"
// ========================================

type ApplicationService struct {
	db *gorm.DB
}

func NewApplicationService(db *gorm.DB) *ApplicationService {
	return &ApplicationService{db: db}
}

// ========================================
// APPLICATION CRUD
// ========================================

// CreateApplication cria um novo app
func (s *ApplicationService) CreateApplication(name, slug, description string, ownerID uuid.UUID, ownerType string) (*Application, error) {
	// Validar slug único
	var existing Application
	if err := s.db.Where("slug = ?", slug).First(&existing).Error; err == nil {
		return nil, errors.New("slug já existe")
	}

	app := &Application{
		ID:          uuid.New(),
		Name:        name,
		Slug:        strings.ToLower(slug),
		Description: description,
		OwnerID:     ownerID,
		OwnerType:   ownerType,
		Status:      AppStatusActive,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.Create(app).Error; err != nil {
		return nil, err
	}

	return app, nil
}

// GetApplication busca app por ID
func (s *ApplicationService) GetApplication(id uuid.UUID) (*Application, error) {
	var app Application
	if err := s.db.Where("id = ? AND status != ?", id, AppStatusDeleted).First(&app).Error; err != nil {
		return nil, err
	}
	return &app, nil
}

// GetApplicationBySlug busca app por slug
func (s *ApplicationService) GetApplicationBySlug(slug string) (*Application, error) {
	var app Application
	if err := s.db.Where("slug = ? AND status != ?", slug, AppStatusDeleted).First(&app).Error; err != nil {
		return nil, err
	}
	return &app, nil
}

// ListApplications lista apps de um owner
func (s *ApplicationService) ListApplications(ownerID uuid.UUID) ([]Application, error) {
	var apps []Application
	err := s.db.Where("owner_id = ? AND status != ?", ownerID, AppStatusDeleted).
		Order("created_at DESC").
		Find(&apps).Error
	return apps, err
}

// ListAllApplications lista todos os apps (admin)
func (s *ApplicationService) ListAllApplications(limit, offset int) ([]Application, int64, error) {
	var apps []Application
	var total int64

	s.db.Model(&Application{}).Where("status != ?", AppStatusDeleted).Count(&total)

	err := s.db.Where("status != ?", AppStatusDeleted).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&apps).Error

	return apps, total, err
}

// UpdateApplication atualiza um app
func (s *ApplicationService) UpdateApplication(id uuid.UUID, updates map[string]interface{}) (*Application, error) {
	updates["updated_at"] = time.Now()
	if err := s.db.Model(&Application{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, err
	}
	return s.GetApplication(id)
}

// SuspendApplication suspende um app
func (s *ApplicationService) SuspendApplication(id uuid.UUID, reason string) error {
	return s.db.Model(&Application{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     AppStatusSuspended,
		"updated_at": time.Now(),
	}).Error
}

// ========================================
// APP CREDENTIALS
// ========================================

// CreateCredential cria credenciais para um app
func (s *ApplicationService) CreateCredential(appID uuid.UUID, name string, scopes []string) (*AppCredential, string, error) {
	// Gerar public key e secret
	publicKey := generatePublicKey()
	secret := generateSecret()
	secretHash := hashSecret(secret)

	scopesJSON, _ := json.Marshal(scopes)

	cred := &AppCredential{
		ID:         uuid.New(),
		AppID:      appID,
		Name:       name,
		PublicKey:  publicKey,
		SecretHash: secretHash,
		Scopes:     string(scopesJSON),
		Status:     "active",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := s.db.Create(cred).Error; err != nil {
		return nil, "", err
	}

	// Retorna o secret apenas uma vez (não é armazenado em texto plano)
	return cred, secret, nil
}

// ValidateCredential valida public_key + secret
func (s *ApplicationService) ValidateCredential(publicKey, secret string) (*AppCredential, *Application, error) {
	var cred AppCredential
	if err := s.db.Where("public_key = ? AND status = ?", publicKey, "active").First(&cred).Error; err != nil {
		return nil, nil, errors.New("credencial inválida")
	}

	// Verificar secret
	if hashSecret(secret) != cred.SecretHash {
		return nil, nil, errors.New("secret inválido")
	}

	// Verificar expiração
	if cred.ExpiresAt != nil && cred.ExpiresAt.Before(time.Now()) {
		return nil, nil, errors.New("credencial expirada")
	}

	// Buscar app
	var app Application
	if err := s.db.Where("id = ? AND status = ?", cred.AppID, AppStatusActive).First(&app).Error; err != nil {
		return nil, nil, errors.New("aplicação não encontrada ou suspensa")
	}

	// Atualizar last_used_at
	now := time.Now()
	s.db.Model(&cred).Update("last_used_at", now)

	return &cred, &app, nil
}

// GetCredentialByPublicKey busca credencial por public key
func (s *ApplicationService) GetCredentialByPublicKey(publicKey string) (*AppCredential, error) {
	var cred AppCredential
	if err := s.db.Where("public_key = ?", publicKey).First(&cred).Error; err != nil {
		return nil, err
	}
	return &cred, nil
}

// ListCredentials lista credenciais de um app
func (s *ApplicationService) ListCredentials(appID uuid.UUID) ([]AppCredential, error) {
	var creds []AppCredential
	err := s.db.Where("app_id = ? AND status = ?", appID, "active").
		Order("created_at DESC").
		Find(&creds).Error
	return creds, err
}

// RevokeCredential revoga uma credencial
func (s *ApplicationService) RevokeCredential(id uuid.UUID) error {
	return s.db.Model(&AppCredential{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     "revoked",
		"updated_at": time.Now(),
	}).Error
}

// ========================================
// APP USER
// ========================================

// GetOrCreateAppUser busca ou cria um AppUser
func (s *ApplicationService) GetOrCreateAppUser(appID, userID uuid.UUID, externalUserID string) (*AppUser, bool, error) {
	var appUser AppUser
	err := s.db.Where("app_id = ? AND user_id = ?", appID, userID).First(&appUser).Error

	if err == nil {
		// Atualizar last_seen
		s.db.Model(&appUser).Update("last_seen_at", time.Now())
		return &appUser, false, nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}

	// Criar novo
	appUser = AppUser{
		ID:             uuid.New(),
		AppID:          appID,
		UserID:         userID,
		ExternalUserID: externalUserID,
		Status:         "active",
		FirstSeenAt:    time.Now(),
		LastSeenAt:     time.Now(),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.db.Create(&appUser).Error; err != nil {
		return nil, false, err
	}

	return &appUser, true, nil
}

// GetAppUser busca AppUser
func (s *ApplicationService) GetAppUser(appID, userID uuid.UUID) (*AppUser, error) {
	var appUser AppUser
	err := s.db.Where("app_id = ? AND user_id = ?", appID, userID).First(&appUser).Error
	return &appUser, err
}

// ListAppUsers lista usuários de um app
func (s *ApplicationService) ListAppUsers(appID uuid.UUID, limit, offset int) ([]AppUser, int64, error) {
	var users []AppUser
	var total int64

	s.db.Model(&AppUser{}).Where("app_id = ?", appID).Count(&total)

	err := s.db.Where("app_id = ?", appID).
		Order("last_seen_at DESC").
		Limit(limit).Offset(offset).
		Find(&users).Error

	return users, total, err
}

// ========================================
// APP SESSION
// ========================================

// CreateSession cria uma nova sessão
func (s *ApplicationService) CreateSession(appID, appUserID, userID uuid.UUID, ip, userAgent, deviceType, country string, duration time.Duration) (*AppSession, error) {
	session := &AppSession{
		ID:         uuid.New(),
		AppID:      appID,
		AppUserID:  appUserID,
		UserID:     userID,
		IPAddress:  ip,
		UserAgent:  userAgent,
		DeviceType: deviceType,
		Country:    country,
		Status:     SessionStatusActive,
		CreatedAt:  time.Now(),
		ExpiresAt:  time.Now().Add(duration),
	}

	if err := s.db.Create(session).Error; err != nil {
		return nil, err
	}

	return session, nil
}

// GetSession busca sessão por ID
func (s *ApplicationService) GetSession(id uuid.UUID) (*AppSession, error) {
	var session AppSession
	if err := s.db.Where("id = ?", id).First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

// ValidateSession valida se sessão está ativa
func (s *ApplicationService) ValidateSession(id uuid.UUID) (*AppSession, error) {
	session, err := s.GetSession(id)
	if err != nil {
		return nil, err
	}

	if session.Status != SessionStatusActive {
		return nil, errors.New("sessão não está ativa")
	}

	if session.ExpiresAt.Before(time.Now()) {
		// Marcar como expirada
		s.db.Model(session).Update("status", SessionStatusExpired)
		return nil, errors.New("sessão expirada")
	}

	return session, nil
}

// RevokeSession revoga uma sessão
func (s *ApplicationService) RevokeSession(id uuid.UUID, reason string) error {
	now := time.Now()
	return s.db.Model(&AppSession{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":        SessionStatusRevoked,
		"revoked_at":    now,
		"revoke_reason": reason,
	}).Error
}

// RevokeAllSessions revoga todas as sessões de um usuário em um app
func (s *ApplicationService) RevokeAllSessions(appID, userID uuid.UUID, reason string) error {
	now := time.Now()
	return s.db.Model(&AppSession{}).
		Where("app_id = ? AND user_id = ? AND status = ?", appID, userID, SessionStatusActive).
		Updates(map[string]interface{}{
			"status":        SessionStatusRevoked,
			"revoked_at":    now,
			"revoke_reason": reason,
		}).Error
}

// ListActiveSessions lista sessões ativas de um usuário
func (s *ApplicationService) ListActiveSessions(appID, userID uuid.UUID) ([]AppSession, error) {
	var sessions []AppSession
	err := s.db.Where("app_id = ? AND user_id = ? AND status = ? AND expires_at > ?",
		appID, userID, SessionStatusActive, time.Now()).
		Order("created_at DESC").
		Find(&sessions).Error
	return sessions, err
}

// ========================================
// METRICS
// ========================================

// GetAppMetrics retorna métricas de um app
func (s *ApplicationService) GetAppMetrics(appID uuid.UUID) (*AppMetrics, error) {
	metrics := &AppMetrics{AppID: appID}

	// Total users
	s.db.Model(&AppUser{}).Where("app_id = ?", appID).Count(&metrics.TotalUsers)

	// Active users 24h
	yesterday := time.Now().Add(-24 * time.Hour)
	s.db.Model(&AppUser{}).Where("app_id = ? AND last_seen_at > ?", appID, yesterday).Count(&metrics.ActiveUsers24h)

	// Total sessions
	s.db.Model(&AppSession{}).Where("app_id = ?", appID).Count(&metrics.TotalSessions)

	// Active sessions
	s.db.Model(&AppSession{}).Where("app_id = ? AND status = ? AND expires_at > ?",
		appID, SessionStatusActive, time.Now()).Count(&metrics.ActiveSessions)

	// Last activity
	var lastSession AppSession
	if err := s.db.Where("app_id = ?", appID).Order("created_at DESC").First(&lastSession).Error; err == nil {
		metrics.LastActivityAt = lastSession.CreatedAt
	}

	return metrics, nil
}

// ========================================
// HELPERS
// ========================================

func generatePublicKey() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return fmt.Sprintf("pq_pk_%s", hex.EncodeToString(bytes))
}

func generateSecret() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return fmt.Sprintf("pq_sk_%s", hex.EncodeToString(bytes))
}

func hashSecret(secret string) string {
	hash := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(hash[:])
}

// ========================================
// APP AUDIT EVENTS - Fase 22 (Audit-Only Integration)
// ========================================

// AppAuditEvent representa um evento de audit de app externo
type AppAuditEvent struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	AppID      uuid.UUID `gorm:"type:uuid;index"`
	Type       string    `gorm:"size:100;index"`
	ActorID    string    `gorm:"size:255;index"`
	ActorType  string    `gorm:"size:50"`
	TargetID   string    `gorm:"size:255"`
	TargetType string    `gorm:"size:50"`
	Action     string    `gorm:"size:100"`
	Metadata   string    `gorm:"type:text"`
	IP         string    `gorm:"size:45"`
	UserAgent  string    `gorm:"size:500"`
	CreatedAt  time.Time `gorm:"index"`
}

// CreateAppAuditEvent registra um evento de audit de app externo
func (s *ApplicationService) CreateAppAuditEvent(appID uuid.UUID, eventType, actorID, actorType, targetID, targetType, action, metadata, ip, userAgent string) error {
	event := &AppAuditEvent{
		ID:         uuid.New(),
		AppID:      appID,
		Type:       eventType,
		ActorID:    actorID,
		ActorType:  actorType,
		TargetID:   targetID,
		TargetType: targetType,
		Action:     action,
		Metadata:   metadata,
		IP:         ip,
		UserAgent:  userAgent,
		CreatedAt:  time.Now(),
	}

	return s.db.Create(event).Error
}

// GetAppAuditEvents busca eventos de audit de um app
func (s *ApplicationService) GetAppAuditEvents(appID uuid.UUID, limit int) ([]AppAuditEvent, error) {
	var events []AppAuditEvent
	err := s.db.Where("app_id = ?", appID).
		Order("created_at DESC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

// GetAppAuditStats retorna estatísticas de eventos de um app
func (s *ApplicationService) GetAppAuditStats(appID uuid.UUID) (map[string]interface{}, error) {
	var total int64
	s.db.Model(&AppAuditEvent{}).Where("app_id = ?", appID).Count(&total)

	// Contar por tipo
	type TypeCount struct {
		Type  string
		Count int64
	}
	var typeCounts []TypeCount
	s.db.Model(&AppAuditEvent{}).
		Select("type, count(*) as count").
		Where("app_id = ?", appID).
		Group("type").
		Order("count DESC").
		Limit(10).
		Scan(&typeCounts)

	typeMap := make(map[string]int64)
	for _, tc := range typeCounts {
		typeMap[tc.Type] = tc.Count
	}

	return map[string]interface{}{
		"app_id":         appID,
		"total_events":   total,
		"events_by_type": typeMap,
	}, nil
}
