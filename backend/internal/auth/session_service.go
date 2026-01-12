package auth

/*
================================================================================
SESSION SERVICE — GESTÃO DE SESSÕES ATIVAS
================================================================================

Permite:
- Listar sessões ativas do usuário
- Revogar sessões específicas
- Ver informações de dispositivo/localização
- Detectar sessões suspeitas

"Saber onde você está logado é tão importante quanto estar logado"

================================================================================
*/

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Session representa uma sessão ativa
type Session struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID       uuid.UUID  `gorm:"type:uuid;index;not null" json:"user_id"`
	TokenHash    string     `gorm:"index;not null" json:"-"` // Hash do token, nunca expor
	DeviceInfo   string     `json:"device_info"`
	IPAddress    string     `json:"ip_address"`
	UserAgent    string     `json:"user_agent"`
	Location     string     `json:"location,omitempty"`
	IsCurrent    bool       `gorm:"-" json:"is_current"` // Calculado em runtime
	LastActivity time.Time  `json:"last_activity"`
	ExpiresAt    time.Time  `json:"expires_at"`
	CreatedAt    time.Time  `json:"created_at"`
	RevokedAt    *time.Time `json:"revoked_at,omitempty"`
}

// SessionService gerencia sessões
type SessionService struct {
	db *gorm.DB
}

// NewSessionService cria novo serviço
func NewSessionService(db *gorm.DB) *SessionService {
	db.AutoMigrate(&Session{})
	return &SessionService{db: db}
}

// CreateSession cria uma nova sessão
func (s *SessionService) CreateSession(userID uuid.UUID, token, deviceInfo, ipAddress, userAgent string, expiresAt time.Time) (*Session, error) {
	session := &Session{
		ID:           uuid.New(),
		UserID:       userID,
		TokenHash:    hashToken(token),
		DeviceInfo:   parseDeviceInfo(userAgent),
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		Location:     "", // TODO: GeoIP lookup
		LastActivity: time.Now(),
		ExpiresAt:    expiresAt,
		CreatedAt:    time.Now(),
	}

	if err := s.db.Create(session).Error; err != nil {
		return nil, fmt.Errorf("erro ao criar sessão: %w", err)
	}

	return session, nil
}

// GetUserSessions retorna todas as sessões ativas de um usuário
func (s *SessionService) GetUserSessions(userID uuid.UUID, currentToken string) ([]Session, error) {
	var sessions []Session
	
	err := s.db.Where("user_id = ? AND revoked_at IS NULL AND expires_at > ?", userID, time.Now()).
		Order("last_activity DESC").
		Find(&sessions).Error
	
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar sessões: %w", err)
	}

	// Marcar sessão atual
	currentHash := hashToken(currentToken)
	for i := range sessions {
		if sessions[i].TokenHash == currentHash {
			sessions[i].IsCurrent = true
		}
	}

	return sessions, nil
}

// RevokeSession revoga uma sessão específica
func (s *SessionService) RevokeSession(userID, sessionID uuid.UUID) error {
	now := time.Now()
	
	result := s.db.Model(&Session{}).
		Where("id = ? AND user_id = ? AND revoked_at IS NULL", sessionID, userID).
		Update("revoked_at", now)
	
	if result.Error != nil {
		return fmt.Errorf("erro ao revogar sessão: %w", result.Error)
	}
	
	if result.RowsAffected == 0 {
		return fmt.Errorf("sessão não encontrada ou já revogada")
	}

	return nil
}

// RevokeAllSessions revoga todas as sessões de um usuário (exceto a atual)
func (s *SessionService) RevokeAllSessions(userID uuid.UUID, exceptToken string) (int64, error) {
	now := time.Now()
	exceptHash := hashToken(exceptToken)
	
	result := s.db.Model(&Session{}).
		Where("user_id = ? AND revoked_at IS NULL AND token_hash != ?", userID, exceptHash).
		Update("revoked_at", now)
	
	if result.Error != nil {
		return 0, fmt.Errorf("erro ao revogar sessões: %w", result.Error)
	}

	return result.RowsAffected, nil
}

// RevokeAllUserSessions revoga TODAS as sessões de um usuário (admin)
func (s *SessionService) RevokeAllUserSessions(userID uuid.UUID) (int64, error) {
	now := time.Now()
	
	result := s.db.Model(&Session{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", now)
	
	if result.Error != nil {
		return 0, fmt.Errorf("erro ao revogar sessões: %w", result.Error)
	}

	return result.RowsAffected, nil
}

// UpdateActivity atualiza última atividade da sessão
func (s *SessionService) UpdateActivity(token string) error {
	tokenHash := hashToken(token)
	
	return s.db.Model(&Session{}).
		Where("token_hash = ? AND revoked_at IS NULL", tokenHash).
		Update("last_activity", time.Now()).Error
}

// IsSessionValid verifica se uma sessão é válida
func (s *SessionService) IsSessionValid(token string) bool {
	tokenHash := hashToken(token)
	
	var count int64
	s.db.Model(&Session{}).
		Where("token_hash = ? AND revoked_at IS NULL AND expires_at > ?", tokenHash, time.Now()).
		Count(&count)
	
	return count > 0
}

// CleanupExpiredSessions remove sessões expiradas (job de limpeza)
func (s *SessionService) CleanupExpiredSessions() (int64, error) {
	result := s.db.Where("expires_at < ? OR revoked_at IS NOT NULL", time.Now().Add(-24*time.Hour)).
		Delete(&Session{})
	
	return result.RowsAffected, result.Error
}

// GetSessionStats retorna estatísticas de sessões
func (s *SessionService) GetSessionStats(userID uuid.UUID) (*SessionStats, error) {
	var stats SessionStats
	
	// Total de sessões ativas
	s.db.Model(&Session{}).
		Where("user_id = ? AND revoked_at IS NULL AND expires_at > ?", userID, time.Now()).
		Count(&stats.ActiveSessions)
	
	// Sessões nos últimos 7 dias
	s.db.Model(&Session{}).
		Where("user_id = ? AND created_at > ?", userID, time.Now().Add(-7*24*time.Hour)).
		Count(&stats.SessionsLast7Days)
	
	// Última atividade
	var lastSession Session
	if err := s.db.Where("user_id = ?", userID).Order("last_activity DESC").First(&lastSession).Error; err == nil {
		stats.LastActivity = lastSession.LastActivity
	}
	
	// IPs únicos
	var ips []string
	s.db.Model(&Session{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Distinct("ip_address").
		Pluck("ip_address", &ips)
	stats.UniqueIPs = int64(len(ips))

	return &stats, nil
}

// SessionStats estatísticas de sessões
type SessionStats struct {
	ActiveSessions    int64     `json:"active_sessions"`
	SessionsLast7Days int64     `json:"sessions_last_7_days"`
	LastActivity      time.Time `json:"last_activity"`
	UniqueIPs         int64     `json:"unique_ips"`
}

// hashToken cria hash do token para armazenamento seguro
func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

// parseDeviceInfo extrai informações do dispositivo do User-Agent
func parseDeviceInfo(userAgent string) string {
	ua := strings.ToLower(userAgent)
	
	// Detectar SO
	var os string
	switch {
	case strings.Contains(ua, "windows"):
		os = "Windows"
	case strings.Contains(ua, "mac"):
		os = "macOS"
	case strings.Contains(ua, "linux"):
		os = "Linux"
	case strings.Contains(ua, "android"):
		os = "Android"
	case strings.Contains(ua, "iphone") || strings.Contains(ua, "ipad"):
		os = "iOS"
	default:
		os = "Unknown"
	}
	
	// Detectar navegador
	var browser string
	switch {
	case strings.Contains(ua, "chrome") && !strings.Contains(ua, "edg"):
		browser = "Chrome"
	case strings.Contains(ua, "firefox"):
		browser = "Firefox"
	case strings.Contains(ua, "safari") && !strings.Contains(ua, "chrome"):
		browser = "Safari"
	case strings.Contains(ua, "edg"):
		browser = "Edge"
	default:
		browser = "Unknown"
	}
	
	return fmt.Sprintf("%s • %s", browser, os)
}
