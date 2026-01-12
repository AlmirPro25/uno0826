package immunity

/*
================================================================================
AUTO-HEALING — O SISTEMA SE CURA SOZINHO
================================================================================

Quando detecta problemas, o sistema tenta se recuperar automaticamente:
1. Sessões zumbi → Mata e limpa
2. Métricas inconsistentes → Recalcula
3. Cache corrompido → Invalida
4. Conexões mortas → Reconecta
5. Dados órfãos → Limpa

"O melhor médico é aquele que o paciente nem sabe que existe"

================================================================================
*/

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

// HealingAction tipo de ação de cura
type HealingAction string

const (
	HealKillZombie            HealingAction = "kill_zombie"             // Matar sessão/processo zumbi
	HealRecalcMetrics         HealingAction = "recalc_metrics"          // Recalcular métricas
	HealInvalidateCache       HealingAction = "invalidate_cache"        // Invalidar cache
	HealReconnect             HealingAction = "reconnect"               // Reconectar serviço
	HealCleanOrphans          HealingAction = "clean_orphans"           // Limpar dados órfãos
	HealResetState            HealingAction = "reset_state"             // Resetar estado
	HealRetry                 HealingAction = "retry"                   // Tentar novamente
	HealRecalcAccountBalance  HealingAction = "recalc_account_balance"  // Recalcular saldo de conta
	HealRebuildSessionState   HealingAction = "rebuild_session_state"   // Reconstruir estado de sessão
	HealRepairDataIntegrity   HealingAction = "repair_data_integrity"   // Reparar integridade de dados
	HealSyncExternalState     HealingAction = "sync_external_state"     // Sincronizar estado externo
)

// HealingResult resultado de uma tentativa de cura
type HealingResult struct {
	Action      HealingAction
	Target      string
	Success     bool
	Message     string
	Duration    time.Duration
	AttemptedAt time.Time
}

// HealingStats estatísticas de auto-healing
type HealingStats struct {
	TotalAttempts    int64
	SuccessfulHeals  int64
	FailedHeals      int64
	LastHealAt       time.Time
	HealsByAction    map[HealingAction]int64
	AvgHealDuration  time.Duration
}

// AutoHealer gerenciador de auto-healing
type AutoHealer struct {
	mu              sync.RWMutex
	enabled         bool
	maxRetries      int
	retryDelay      time.Duration
	healingHistory  []HealingResult
	stats           HealingStats
	healers         map[HealingAction]HealerFunc
	onHealCallback  func(result HealingResult)
}

// HealerFunc função que executa uma cura específica
type HealerFunc func(target string, context map[string]interface{}) error

// NewAutoHealer cria novo auto-healer
func NewAutoHealer() *AutoHealer {
	return &AutoHealer{
		enabled:        true,
		maxRetries:     3,
		retryDelay:     time.Second,
		healingHistory: make([]HealingResult, 0),
		stats: HealingStats{
			HealsByAction: make(map[HealingAction]int64),
		},
		healers: make(map[HealingAction]HealerFunc),
	}
}

// RegisterHealer registra uma função de cura para uma ação
func (h *AutoHealer) RegisterHealer(action HealingAction, healer HealerFunc) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.healers[action] = healer
	log.Printf("🏥 [AUTO-HEAL] Healer registrado: %s", action)
}

// SetOnHealCallback define callback para quando uma cura é executada
func (h *AutoHealer) SetOnHealCallback(cb func(result HealingResult)) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.onHealCallback = cb
}

// Enable habilita auto-healing
func (h *AutoHealer) Enable() {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.enabled = true
	log.Println("🏥 [AUTO-HEAL] Sistema habilitado")
}

// Disable desabilita auto-healing
func (h *AutoHealer) Disable() {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.enabled = false
	log.Println("🏥 [AUTO-HEAL] Sistema desabilitado")
}

// Heal tenta curar um problema
func (h *AutoHealer) Heal(action HealingAction, target string, context map[string]interface{}) HealingResult {
	h.mu.RLock()
	if !h.enabled {
		h.mu.RUnlock()
		return HealingResult{
			Action:      action,
			Target:      target,
			Success:     false,
			Message:     "Auto-healing disabled",
			AttemptedAt: time.Now(),
		}
	}
	
	healer, exists := h.healers[action]
	h.mu.RUnlock()
	
	if !exists {
		return HealingResult{
			Action:      action,
			Target:      target,
			Success:     false,
			Message:     fmt.Sprintf("No healer registered for action: %s", action),
			AttemptedAt: time.Now(),
		}
	}
	
	start := time.Now()
	var lastErr error
	
	// Tentar com retries
	for attempt := 1; attempt <= h.maxRetries; attempt++ {
		err := healer(target, context)
		if err == nil {
			result := HealingResult{
				Action:      action,
				Target:      target,
				Success:     true,
				Message:     fmt.Sprintf("Healed successfully on attempt %d", attempt),
				Duration:    time.Since(start),
				AttemptedAt: start,
			}
			
			h.recordResult(result)
			log.Printf("✅ [AUTO-HEAL] %s em %s: sucesso (tentativa %d, %v)", 
				action, target, attempt, result.Duration)
			
			return result
		}
		
		lastErr = err
		if attempt < h.maxRetries {
			time.Sleep(h.retryDelay * time.Duration(attempt)) // Backoff exponencial
		}
	}
	
	result := HealingResult{
		Action:      action,
		Target:      target,
		Success:     false,
		Message:     fmt.Sprintf("Failed after %d attempts: %v", h.maxRetries, lastErr),
		Duration:    time.Since(start),
		AttemptedAt: start,
	}
	
	h.recordResult(result)
	log.Printf("❌ [AUTO-HEAL] %s em %s: falhou após %d tentativas - %v", 
		action, target, h.maxRetries, lastErr)
	
	return result
}

// recordResult registra resultado de uma cura
func (h *AutoHealer) recordResult(result HealingResult) {
	h.mu.Lock()
	defer h.mu.Unlock()
	
	// Atualizar stats
	h.stats.TotalAttempts++
	if result.Success {
		h.stats.SuccessfulHeals++
	} else {
		h.stats.FailedHeals++
	}
	h.stats.LastHealAt = result.AttemptedAt
	h.stats.HealsByAction[result.Action]++
	
	// Manter histórico limitado (últimas 1000)
	h.healingHistory = append(h.healingHistory, result)
	if len(h.healingHistory) > 1000 {
		h.healingHistory = h.healingHistory[1:]
	}
	
	// Callback
	if h.onHealCallback != nil {
		go h.onHealCallback(result)
	}
}

// GetStats retorna estatísticas
func (h *AutoHealer) GetStats() HealingStats {
	h.mu.RLock()
	defer h.mu.RUnlock()
	
	// Cópia para evitar race
	stats := h.stats
	stats.HealsByAction = make(map[HealingAction]int64)
	for k, v := range h.stats.HealsByAction {
		stats.HealsByAction[k] = v
	}
	
	return stats
}

// GetRecentHistory retorna histórico recente
func (h *AutoHealer) GetRecentHistory(limit int) []HealingResult {
	h.mu.RLock()
	defer h.mu.RUnlock()
	
	if limit > len(h.healingHistory) {
		limit = len(h.healingHistory)
	}
	
	// Retornar os mais recentes
	start := len(h.healingHistory) - limit
	result := make([]HealingResult, limit)
	copy(result, h.healingHistory[start:])
	
	return result
}

// ========================================
// HEALERS PRÉ-DEFINIDOS
// ========================================

// ZombieSessionHealer cura sessões zumbi
func ZombieSessionHealer(killFunc func(sessionID string) error) HealerFunc {
	return func(target string, context map[string]interface{}) error {
		return killFunc(target)
	}
}

// MetricsRecalcHealer recalcula métricas
func MetricsRecalcHealer(recalcFunc func(appID uuid.UUID) error) HealerFunc {
	return func(target string, context map[string]interface{}) error {
		appID, err := uuid.Parse(target)
		if err != nil {
			return fmt.Errorf("invalid app_id: %v", err)
		}
		return recalcFunc(appID)
	}
}

// CacheInvalidateHealer invalida cache
func CacheInvalidateHealer(invalidateFunc func(key string) error) HealerFunc {
	return func(target string, context map[string]interface{}) error {
		return invalidateFunc(target)
	}
}

// ConnectionReconnectHealer reconecta serviço
func ConnectionReconnectHealer(reconnectFunc func(service string) error) HealerFunc {
	return func(target string, context map[string]interface{}) error {
		return reconnectFunc(target)
	}
}

// OrphanCleanerHealer limpa dados órfãos
func OrphanCleanerHealer(cleanFunc func(table string, olderThan time.Duration) (int64, error)) HealerFunc {
	return func(target string, context map[string]interface{}) error {
		olderThan := 24 * time.Hour
		if v, ok := context["older_than"].(time.Duration); ok {
			olderThan = v
		}
		
		cleaned, err := cleanFunc(target, olderThan)
		if err != nil {
			return err
		}
		
		log.Printf("🧹 [ORPHAN-CLEANER] Limpou %d registros órfãos de %s", cleaned, target)
		return nil
	}
}

// ========================================
// HEALERS FINANCEIROS E DE SESSÃO
// ========================================

// AccountBalanceRecalculator recalcula saldo de conta
// Usado quando há inconsistência entre transações e saldo
type AccountBalanceRecalculator struct {
	// GetTransactions retorna todas as transações de uma conta
	GetTransactions func(accountID string) ([]Transaction, error)
	// UpdateBalance atualiza o saldo da conta
	UpdateBalance func(accountID string, newBalance int64) error
	// GetCurrentBalance retorna o saldo atual
	GetCurrentBalance func(accountID string) (int64, error)
}

// Transaction representa uma transação financeira
type Transaction struct {
	ID        string
	Amount    int64  // Positivo = crédito, Negativo = débito
	Type      string // credit, debit, refund, adjustment
	CreatedAt time.Time
}

// RecalculateAccountBalance recalcula o saldo de uma conta
func (r *AccountBalanceRecalculator) RecalculateAccountBalance(accountID string) error {
	if r.GetTransactions == nil || r.UpdateBalance == nil {
		return fmt.Errorf("recalculator not properly configured")
	}
	
	transactions, err := r.GetTransactions(accountID)
	if err != nil {
		return fmt.Errorf("failed to get transactions: %w", err)
	}
	
	var calculatedBalance int64
	for _, tx := range transactions {
		calculatedBalance += tx.Amount
	}
	
	// Verificar se há diferença
	if r.GetCurrentBalance != nil {
		currentBalance, err := r.GetCurrentBalance(accountID)
		if err == nil && currentBalance == calculatedBalance {
			log.Printf("💰 [BALANCE-RECALC] Conta %s: saldo já está correto (%d)", accountID, currentBalance)
			return nil
		}
		log.Printf("💰 [BALANCE-RECALC] Conta %s: corrigindo saldo de %d para %d", 
			accountID, currentBalance, calculatedBalance)
	}
	
	if err := r.UpdateBalance(accountID, calculatedBalance); err != nil {
		return fmt.Errorf("failed to update balance: %w", err)
	}
	
	log.Printf("✅ [BALANCE-RECALC] Conta %s: saldo recalculado = %d (de %d transações)", 
		accountID, calculatedBalance, len(transactions))
	
	return nil
}

// ToHealerFunc converte para HealerFunc
func (r *AccountBalanceRecalculator) ToHealerFunc() HealerFunc {
	return func(target string, context map[string]interface{}) error {
		return r.RecalculateAccountBalance(target)
	}
}

// SessionStateRebuilder reconstrói estado de sessão
// Usado quando sessão está corrompida ou inconsistente
type SessionStateRebuilder struct {
	// GetSessionData retorna dados brutos da sessão
	GetSessionData func(sessionID string) (map[string]interface{}, error)
	// GetUserData retorna dados do usuário
	GetUserData func(userID string) (map[string]interface{}, error)
	// GetAppData retorna dados do app
	GetAppData func(appID string) (map[string]interface{}, error)
	// SaveSession salva a sessão reconstruída
	SaveSession func(sessionID string, data map[string]interface{}) error
	// InvalidateCache invalida cache relacionado
	InvalidateCache func(sessionID string) error
}

// SessionState representa o estado de uma sessão
type SessionState struct {
	SessionID   string                 `json:"session_id"`
	UserID      string                 `json:"user_id"`
	AppID       string                 `json:"app_id"`
	Permissions []string               `json:"permissions"`
	Metadata    map[string]interface{} `json:"metadata"`
	CreatedAt   time.Time              `json:"created_at"`
	ExpiresAt   time.Time              `json:"expires_at"`
	IsValid     bool                   `json:"is_valid"`
}

// RebuildSessionState reconstrói o estado de uma sessão
func (r *SessionStateRebuilder) RebuildSessionState(sessionID string) error {
	if r.GetSessionData == nil || r.SaveSession == nil {
		return fmt.Errorf("rebuilder not properly configured")
	}
	
	// 1. Obter dados atuais da sessão
	sessionData, err := r.GetSessionData(sessionID)
	if err != nil {
		return fmt.Errorf("failed to get session data: %w", err)
	}
	
	// 2. Extrair IDs
	userID, _ := sessionData["user_id"].(string)
	appID, _ := sessionData["app_id"].(string)
	
	// 3. Reconstruir estado
	rebuiltState := make(map[string]interface{})
	rebuiltState["session_id"] = sessionID
	rebuiltState["rebuilt_at"] = time.Now()
	rebuiltState["is_valid"] = true
	
	// 4. Enriquecer com dados do usuário
	if r.GetUserData != nil && userID != "" {
		userData, err := r.GetUserData(userID)
		if err == nil {
			rebuiltState["user_id"] = userID
			rebuiltState["user_data"] = userData
			
			// Extrair permissões do usuário
			if perms, ok := userData["permissions"].([]string); ok {
				rebuiltState["permissions"] = perms
			}
		} else {
			log.Printf("⚠️ [SESSION-REBUILD] Não foi possível obter dados do usuário %s: %v", userID, err)
		}
	}
	
	// 5. Enriquecer com dados do app
	if r.GetAppData != nil && appID != "" {
		appData, err := r.GetAppData(appID)
		if err == nil {
			rebuiltState["app_id"] = appID
			rebuiltState["app_data"] = appData
		} else {
			log.Printf("⚠️ [SESSION-REBUILD] Não foi possível obter dados do app %s: %v", appID, err)
		}
	}
	
	// 6. Preservar metadados originais
	if metadata, ok := sessionData["metadata"].(map[string]interface{}); ok {
		rebuiltState["metadata"] = metadata
	}
	
	// 7. Invalidar cache se configurado
	if r.InvalidateCache != nil {
		if err := r.InvalidateCache(sessionID); err != nil {
			log.Printf("⚠️ [SESSION-REBUILD] Falha ao invalidar cache: %v", err)
		}
	}
	
	// 8. Salvar sessão reconstruída
	if err := r.SaveSession(sessionID, rebuiltState); err != nil {
		return fmt.Errorf("failed to save rebuilt session: %w", err)
	}
	
	log.Printf("✅ [SESSION-REBUILD] Sessão %s reconstruída com sucesso", sessionID)
	
	return nil
}

// ToHealerFunc converte para HealerFunc
func (r *SessionStateRebuilder) ToHealerFunc() HealerFunc {
	return func(target string, context map[string]interface{}) error {
		return r.RebuildSessionState(target)
	}
}

// ========================================
// FUNÇÕES DE CONVENIÊNCIA GLOBAIS
// ========================================

// RecalculateAccountBalanceHealer cria healer para recálculo de saldo
func RecalculateAccountBalanceHealer(
	getTransactions func(accountID string) ([]Transaction, error),
	updateBalance func(accountID string, newBalance int64) error,
) HealerFunc {
	recalc := &AccountBalanceRecalculator{
		GetTransactions: getTransactions,
		UpdateBalance:   updateBalance,
	}
	return recalc.ToHealerFunc()
}

// RebuildSessionStateHealer cria healer para reconstrução de sessão
func RebuildSessionStateHealer(
	getSessionData func(sessionID string) (map[string]interface{}, error),
	saveSession func(sessionID string, data map[string]interface{}) error,
) HealerFunc {
	rebuilder := &SessionStateRebuilder{
		GetSessionData: getSessionData,
		SaveSession:    saveSession,
	}
	return rebuilder.ToHealerFunc()
}
