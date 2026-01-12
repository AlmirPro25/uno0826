package killswitch

import (
	"errors"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"prost-qs/backend/pkg/invariants"
)

// ========================================
// KILL SWITCH SERVICE
// "Verificação rápida antes de executar"
// ========================================

var (
	ErrKillSwitchActive = errors.New("kill switch ativo - operação bloqueada")
)

type KillSwitchService struct {
	db           *gorm.DB
	cache        map[string]bool // cache em memória para performance
	mutex        sync.RWMutex
	initialized  bool            // FIX BUG-004: flag para saber se cache foi carregado
	lastRefresh  time.Time       // FIX BUG-004: timestamp do último refresh
}

func NewKillSwitchService(db *gorm.DB) *KillSwitchService {
	s := &KillSwitchService{
		db:          db,
		cache:       make(map[string]bool),
		initialized: false,
	}
	
	// FIX BUG-004: Tentar carregar cache com retry
	if err := s.initializeCache(); err != nil {
		log.Printf("[KILLSWITCH] AVISO: Falha ao carregar cache inicial: %v", err)
		log.Printf("[KILLSWITCH] Cache será carregado na próxima verificação")
	}
	
	return s
}

// FIX BUG-004: Inicialização com retry e logging
func (s *KillSwitchService) initializeCache() error {
	maxRetries := 3
	var lastErr error
	
	for i := 0; i < maxRetries; i++ {
		if err := s.refreshCacheInternal(); err != nil {
			lastErr = err
			log.Printf("[KILLSWITCH] Tentativa %d/%d falhou: %v", i+1, maxRetries, err)
			time.Sleep(time.Duration(i+1) * 100 * time.Millisecond)
			continue
		}
		
		s.initialized = true
		log.Printf("[KILLSWITCH] Cache inicializado com sucesso. Switches ativos: %d", s.countActive())
		return nil
	}
	
	return lastErr
}

// FIX BUG-004: Contar switches ativos para logging
func (s *KillSwitchService) countActive() int {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	
	count := 0
	for _, active := range s.cache {
		if active {
			count++
		}
	}
	return count
}

// FIX BUG-004: Verificar se cache precisa ser recarregado
func (s *KillSwitchService) ensureCacheLoaded() {
	s.mutex.RLock()
	needsRefresh := !s.initialized || time.Since(s.lastRefresh) > 5*time.Minute
	s.mutex.RUnlock()
	
	if needsRefresh {
		s.refreshCache()
	}
}

// ========================================
// VERIFICAÇÃO (CRÍTICO - DEVE SER RÁPIDO)
// ========================================

// AJUSTE 2: Kill Switch com ESCOPO EXPLÍCITO
// Formatos suportados:
//   - "billing"              → billing:global (afeta todos)
//   - "billing:global"       → afeta todos os apps
//   - "billing:app:{app_id}" → afeta apenas um app específico
//   - "rules:{rule_id}"      → afeta apenas uma regra específica
//   - "agents:{agent_id}"    → afeta apenas um agente específico

// IsActive verifica se um escopo está bloqueado (versão simples - global)
func (s *KillSwitchService) IsActive(scope string) bool {
	// FIX BUG-004: Garantir que cache está carregado
	s.ensureCacheLoaded()
	return s.IsActiveForApp(scope, "")
}

// IsActiveForApp verifica se um escopo está bloqueado para um app específico
// Esta função é chamada antes de TODA operação crítica
func (s *KillSwitchService) IsActiveForApp(scope, appID string) bool {
	// FIX BUG-004: Garantir que cache está carregado
	s.ensureCacheLoaded()
	
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// 1. Se "all" está ativo, TUDO está bloqueado
	if s.cache[ScopeAll] {
		return true
	}

	// 2. Verificar escopo global (ex: "billing" ou "billing:global")
	if s.cache[scope] || s.cache[scope+":global"] {
		return true
	}

	// 3. Se tem appID, verificar escopo específico do app
	if appID != "" {
		scopeForApp := scope + ":app:" + appID
		if s.cache[scopeForApp] {
			return true
		}
	}

	return false
}

// IsActiveForResource verifica se um recurso específico está bloqueado
// Usado para: rules:{rule_id}, agents:{agent_id}, etc.
func (s *KillSwitchService) IsActiveForResource(resourceType, resourceID string) bool {
	// FIX BUG-004: Garantir que cache está carregado
	s.ensureCacheLoaded()
	
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// 1. Se "all" está ativo, TUDO está bloqueado
	if s.cache[ScopeAll] {
		return true
	}

	// 2. Verificar escopo global do tipo de recurso
	if s.cache[resourceType] || s.cache[resourceType+":global"] {
		return true
	}

	// 3. Verificar recurso específico
	scopeForResource := resourceType + ":" + resourceID
	return s.cache[scopeForResource]
}

// Check verifica e retorna erro se bloqueado (global)
func (s *KillSwitchService) Check(scope string) error {
	if s.IsActive(scope) {
		return ErrKillSwitchActive
	}
	return nil
}

// CheckForApp verifica e retorna erro se bloqueado para um app
func (s *KillSwitchService) CheckForApp(scope, appID string) error {
	if s.IsActiveForApp(scope, appID) {
		return ErrKillSwitchActive
	}
	return nil
}

// CheckForResource verifica e retorna erro se recurso está bloqueado
func (s *KillSwitchService) CheckForResource(resourceType, resourceID string) error {
	if s.IsActiveForResource(resourceType, resourceID) {
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

// CheckMultipleForApp verifica múltiplos escopos para um app
func (s *KillSwitchService) CheckMultipleForApp(appID string, scopes ...string) error {
	for _, scope := range scopes {
		if s.IsActiveForApp(scope, appID) {
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
	
	// INVARIANT: Notificar sistema de invariants sobre killswitch
	s.notifyInvariantsKillswitchChange(scope, true)
	
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
	
	// INVARIANT: Notificar sistema de invariants sobre killswitch
	s.notifyInvariantsKillswitchChange(scope, false)
	
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

// refreshCache atualiza o cache em memória (wrapper público)
func (s *KillSwitchService) refreshCache() {
	if err := s.refreshCacheInternal(); err != nil {
		log.Printf("[KILLSWITCH] Erro ao atualizar cache: %v", err)
	}
}

// FIX BUG-004: refreshCacheInternal com tratamento de erro adequado
func (s *KillSwitchService) refreshCacheInternal() error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Buscar switches ativos do banco
	var switches []KillSwitch
	now := time.Now()
	
	if err := s.db.Where("active = ?", true).Find(&switches).Error; err != nil {
		return err
	}

	// Limpar cache antigo
	newCache := make(map[string]bool)

	for _, ks := range switches {
		// Verificar se expirou
		if ks.ExpiresAt != nil && ks.ExpiresAt.Before(now) {
			// Expirou - desativar no banco
			if err := s.db.Model(&ks).Updates(map[string]any{
				"active":     false,
				"updated_at": now,
			}).Error; err != nil {
				log.Printf("[KILLSWITCH] Erro ao desativar switch expirado %s: %v", ks.Scope, err)
			}
			continue
		}
		newCache[ks.Scope] = true
	}

	// Atualizar cache
	s.cache = newCache
	s.lastRefresh = now
	s.initialized = true
	
	// Log para debug
	if len(newCache) > 0 {
		log.Printf("[KILLSWITCH] Cache atualizado. Switches ativos: %v", s.getActiveScopes())
	}
	
	return nil
}

// FIX BUG-004: Helper para logging
func (s *KillSwitchService) getActiveScopes() []string {
	scopes := make([]string, 0, len(s.cache))
	for scope, active := range s.cache {
		if active {
			scopes = append(scopes, scope)
		}
	}
	return scopes
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


// ========================================
// INVARIANTS INTEGRATION
// ========================================

// notifyInvariantsKillswitchChange notifica o sistema de invariants sobre mudança no killswitch
func (s *KillSwitchService) notifyInvariantsKillswitchChange(scope string, isActive bool) {
	if scope == ScopeAll {
		invariants.UpdateGlobalKillswitch(isActive)
	} else {
		// Para escopos específicos, usamos o scope como "appID" no cache de invariants
		invariants.UpdateKillswitchCache(scope, isActive)
	}
}

// CheckWithInvariant verifica killswitch usando o sistema de invariants
// Esta função é mais segura pois usa o cache em memória das invariants
func (s *KillSwitchService) CheckWithInvariant(scope string) bool {
	// Primeiro verifica o cache local
	if s.IsActive(scope) {
		return true
	}
	// Depois verifica o cache de invariants (redundância)
	return invariants.CheckKillswitchSafe(scope)
}
