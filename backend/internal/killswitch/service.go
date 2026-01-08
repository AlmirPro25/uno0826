package killswitch

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// KILL SWITCH SERVICE
// "Verificação rápida antes de executar"
// ========================================

var (
	ErrKillSwitchActive = errors.New("kill switch ativo - operação bloqueada")
)

type KillSwitchService struct {
	db    *gorm.DB
	cache map[string]bool // cache em memória para performance
	mutex sync.RWMutex
}

func NewKillSwitchService(db *gorm.DB) *KillSwitchService {
	s := &KillSwitchService{
		db:    db,
		cache: make(map[string]bool),
	}
	s.refreshCache()
	return s
}

// ========================================
// VERIFICAÇÃO (CRÍTICO - DEVE SER RÁPIDO)
// ========================================

// IsActive verifica se um escopo está bloqueado
// Esta função é chamada antes de TODA operação crítica
func (s *KillSwitchService) IsActive(scope string) bool {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// Se "all" está ativo, tudo está bloqueado
	if s.cache[ScopeAll] {
		return true
	}

	return s.cache[scope]
}

// Check verifica e retorna erro se bloqueado
func (s *KillSwitchService) Check(scope string) error {
	if s.IsActive(scope) {
		return ErrKillSwitchActive
	}
	return nil
}

// CheckMultiple verifica múltiplos escopos
func (s *KillSwitchService) CheckMultiple(scopes ...string) error {
	for _, scope := range scopes {
		if s.IsActive(scope) {
			return ErrKillSwitchActive
		}
	}
	return nil
}

// ========================================
// ATIVAÇÃO/DESATIVAÇÃO
// ========================================

// Activate ativa um kill switch
func (s *KillSwitchService) Activate(scope, reason string, activatedBy uuid.UUID, expiresInMinutes *int) error {
	now := time.Now()
	
	var expiresAt *time.Time
	if expiresInMinutes != nil && *expiresInMinutes > 0 {
		exp := now.Add(time.Duration(*expiresInMinutes) * time.Minute)
		expiresAt = &exp
	}

	// Verificar se já existe
	var existing KillSwitch
	err := s.db.Where("scope = ?", scope).First(&existing).Error
	
	if err == nil {
		// Existe - atualizar
		existing.Active = true
		existing.Reason = reason
		existing.ActivatedBy = activatedBy
		existing.ActivatedAt = now
		existing.ExpiresAt = expiresAt
		existing.UpdatedAt = now
		
		if err := s.db.Save(&existing).Error; err != nil {
			return err
		}
	} else {
		// Não existe - criar
		ks := &KillSwitch{
			ID:          uuid.New(),
			Scope:       scope,
			Active:      true,
			Reason:      reason,
			ActivatedBy: activatedBy,
			ActivatedAt: now,
			ExpiresAt:   expiresAt,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		
		if err := s.db.Create(ks).Error; err != nil {
			return err
		}
	}

	s.refreshCache()
	return nil
}

// Deactivate desativa um kill switch
func (s *KillSwitchService) Deactivate(scope string) error {
	err := s.db.Model(&KillSwitch{}).
		Where("scope = ?", scope).
		Updates(map[string]any{
			"active":     false,
			"updated_at": time.Now(),
		}).Error
	if err != nil {
		return err
	}

	s.refreshCache()
	return nil
}

// DeactivateAll desativa todos os kill switches
func (s *KillSwitchService) DeactivateAll() error {
	err := s.db.Model(&KillSwitch{}).
		Where("active = ?", true).
		Updates(map[string]any{
			"active":     false,
			"updated_at": time.Now(),
		}).Error
	if err != nil {
		return err
	}

	s.refreshCache()
	return nil
}

// ========================================
// STATUS
// ========================================

// GetStatus retorna status de todos os switches
func (s *KillSwitchService) GetStatus() *KillSwitchStatus {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return &KillSwitchStatus{
		All:      s.cache[ScopeAll],
		Billing:  s.cache[ScopeBilling],
		Agents:   s.cache[ScopeAgents],
		Ads:      s.cache[ScopeAds],
		Jobs:     s.cache[ScopeJobs],
		Payments: s.cache[ScopePayments],
	}
}

// GetAll retorna todos os kill switches
func (s *KillSwitchService) GetAll() ([]KillSwitch, error) {
	var switches []KillSwitch
	err := s.db.Order("scope ASC").Find(&switches).Error
	return switches, err
}

// GetByScope retorna um kill switch específico
func (s *KillSwitchService) GetByScope(scope string) (*KillSwitch, error) {
	var ks KillSwitch
	if err := s.db.Where("scope = ?", scope).First(&ks).Error; err != nil {
		return nil, err
	}
	return &ks, nil
}

// ========================================
// CACHE
// ========================================

// refreshCache atualiza o cache em memória
func (s *KillSwitchService) refreshCache() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Limpar cache
	s.cache = make(map[string]bool)

	// Buscar switches ativos
	var switches []KillSwitch
	now := time.Now()
	
	s.db.Where("active = ?", true).Find(&switches)

	for _, ks := range switches {
		// Verificar se expirou
		if ks.ExpiresAt != nil && ks.ExpiresAt.Before(now) {
			// Expirou - desativar
			s.db.Model(&ks).Updates(map[string]any{
				"active":     false,
				"updated_at": now,
			})
			continue
		}
		s.cache[ks.Scope] = true
	}
}

// StartExpirationChecker inicia goroutine que verifica expiração
func (s *KillSwitchService) StartExpirationChecker(interval time.Duration) {
	go func() {
		ticker := time.NewTicker(interval)
		for range ticker.C {
			s.refreshCache()
		}
	}()
}
