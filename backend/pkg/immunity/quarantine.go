package immunity

/*
================================================================================
QUARANTINE — ISOLA ELEMENTOS SUSPEITOS
================================================================================

Quando detecta comportamento suspeito:
1. Isola o elemento (usuário, app, IP, sessão)
2. Registra motivo e evidências
3. Permite operações limitadas ou bloqueia total
4. Expira automaticamente ou requer revisão manual

Tipos de quarentena:
- SOFT: Limita funcionalidades, monitora mais
- HARD: Bloqueia completamente
- REVIEW: Aguarda revisão humana

"Isolar para proteger, não para punir"

================================================================================
*/

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

// QuarantineType tipo de quarentena
type QuarantineType string

const (
	QuarantineSoft   QuarantineType = "soft"   // Limita, mas permite algumas operações
	QuarantineHard   QuarantineType = "hard"   // Bloqueia completamente
	QuarantineReview QuarantineType = "review" // Aguarda revisão humana
)

// QuarantineTarget tipo de alvo
type QuarantineTarget string

const (
	TargetUser    QuarantineTarget = "user"
	TargetApp     QuarantineTarget = "app"
	TargetIP      QuarantineTarget = "ip"
	TargetSession QuarantineTarget = "session"
	TargetDevice  QuarantineTarget = "device"
)

// QuarantineReason motivo da quarentena
type QuarantineReason string

const (
	ReasonSuspiciousActivity QuarantineReason = "suspicious_activity"
	ReasonRateLimitAbuse     QuarantineReason = "rate_limit_abuse"
	ReasonInvalidData        QuarantineReason = "invalid_data"
	ReasonSecurityThreat     QuarantineReason = "security_threat"
	ReasonFraudDetected      QuarantineReason = "fraud_detected"
	ReasonAnomalyDetected    QuarantineReason = "anomaly_detected"
	ReasonManualReview       QuarantineReason = "manual_review"
)

// QuarantineEntry entrada de quarentena
type QuarantineEntry struct {
	ID           uuid.UUID        `json:"id"`
	TargetType   QuarantineTarget `json:"target_type"`
	TargetID     string           `json:"target_id"`
	Type         QuarantineType   `json:"type"`
	Reason       QuarantineReason `json:"reason"`
	Evidence     map[string]interface{} `json:"evidence"`
	CreatedAt    time.Time        `json:"created_at"`
	ExpiresAt    *time.Time       `json:"expires_at,omitempty"`
	ReleasedAt   *time.Time       `json:"released_at,omitempty"`
	ReleasedBy   string           `json:"released_by,omitempty"`
	ReleaseNote  string           `json:"release_note,omitempty"`
	AutoRelease  bool             `json:"auto_release"`
	ReviewedAt   *time.Time       `json:"reviewed_at,omitempty"`
	ReviewedBy   string           `json:"reviewed_by,omitempty"`
	ReviewNote   string           `json:"review_note,omitempty"`
}

// IsActive verifica se quarentena está ativa
func (q *QuarantineEntry) IsActive() bool {
	if q.ReleasedAt != nil {
		return false
	}
	if q.ExpiresAt != nil && time.Now().After(*q.ExpiresAt) {
		return false
	}
	return true
}

// QuarantineManager gerenciador de quarentena
type QuarantineManager struct {
	mu              sync.RWMutex
	entries         map[string]*QuarantineEntry // key: targetType:targetID
	onQuarantine    func(entry *QuarantineEntry)
	onRelease       func(entry *QuarantineEntry)
	cleanupInterval time.Duration
	stopCleanup     chan struct{}
}

// NewQuarantineManager cria novo gerenciador
func NewQuarantineManager() *QuarantineManager {
	qm := &QuarantineManager{
		entries:         make(map[string]*QuarantineEntry),
		cleanupInterval: 5 * time.Minute,
		stopCleanup:     make(chan struct{}),
	}
	
	// Iniciar cleanup automático
	go qm.cleanupLoop()
	
	return qm
}

// SetOnQuarantine define callback para quando algo é quarentenado
func (qm *QuarantineManager) SetOnQuarantine(fn func(entry *QuarantineEntry)) {
	qm.mu.Lock()
	defer qm.mu.Unlock()
	qm.onQuarantine = fn
}

// SetOnRelease define callback para quando algo é liberado
func (qm *QuarantineManager) SetOnRelease(fn func(entry *QuarantineEntry)) {
	qm.mu.Lock()
	defer qm.mu.Unlock()
	qm.onRelease = fn
}

// makeKey cria chave única para o alvo
func makeKey(targetType QuarantineTarget, targetID string) string {
	return fmt.Sprintf("%s:%s", targetType, targetID)
}

// Quarantine coloca algo em quarentena
func (qm *QuarantineManager) Quarantine(
	targetType QuarantineTarget,
	targetID string,
	qType QuarantineType,
	reason QuarantineReason,
	evidence map[string]interface{},
	duration time.Duration,
) *QuarantineEntry {
	qm.mu.Lock()
	defer qm.mu.Unlock()
	
	key := makeKey(targetType, targetID)
	
	// Se já existe, atualizar
	if existing, exists := qm.entries[key]; exists && existing.IsActive() {
		// Escalar se necessário
		if qType == QuarantineHard && existing.Type != QuarantineHard {
			existing.Type = QuarantineHard
			log.Printf("🔒 [QUARANTINE] Escalado para HARD: %s %s", targetType, targetID)
		}
		return existing
	}
	
	entry := &QuarantineEntry{
		ID:          uuid.New(),
		TargetType:  targetType,
		TargetID:    targetID,
		Type:        qType,
		Reason:      reason,
		Evidence:    evidence,
		CreatedAt:   time.Now(),
		AutoRelease: duration > 0,
	}
	
	if duration > 0 {
		expiresAt := time.Now().Add(duration)
		entry.ExpiresAt = &expiresAt
	}
	
	qm.entries[key] = entry
	
	log.Printf("🔒 [QUARANTINE] %s %s em quarentena (%s): %s", 
		targetType, targetID, qType, reason)
	
	if qm.onQuarantine != nil {
		go qm.onQuarantine(entry)
	}
	
	return entry
}

// IsQuarantined verifica se algo está em quarentena
func (qm *QuarantineManager) IsQuarantined(targetType QuarantineTarget, targetID string) bool {
	qm.mu.RLock()
	defer qm.mu.RUnlock()
	
	key := makeKey(targetType, targetID)
	entry, exists := qm.entries[key]
	
	return exists && entry.IsActive()
}

// GetQuarantineType retorna tipo de quarentena (ou vazio se não está)
func (qm *QuarantineManager) GetQuarantineType(targetType QuarantineTarget, targetID string) QuarantineType {
	qm.mu.RLock()
	defer qm.mu.RUnlock()
	
	key := makeKey(targetType, targetID)
	entry, exists := qm.entries[key]
	
	if !exists || !entry.IsActive() {
		return ""
	}
	
	return entry.Type
}

// GetEntry retorna entrada de quarentena
func (qm *QuarantineManager) GetEntry(targetType QuarantineTarget, targetID string) *QuarantineEntry {
	qm.mu.RLock()
	defer qm.mu.RUnlock()
	
	key := makeKey(targetType, targetID)
	return qm.entries[key]
}

// Release libera da quarentena
func (qm *QuarantineManager) Release(targetType QuarantineTarget, targetID string, releasedBy, note string) bool {
	qm.mu.Lock()
	defer qm.mu.Unlock()
	
	key := makeKey(targetType, targetID)
	entry, exists := qm.entries[key]
	
	if !exists || !entry.IsActive() {
		return false
	}
	
	now := time.Now()
	entry.ReleasedAt = &now
	entry.ReleasedBy = releasedBy
	entry.ReleaseNote = note
	
	log.Printf("🔓 [QUARANTINE] %s %s liberado por %s: %s", 
		targetType, targetID, releasedBy, note)
	
	if qm.onRelease != nil {
		go qm.onRelease(entry)
	}
	
	return true
}

// Review marca como revisado
func (qm *QuarantineManager) Review(targetType QuarantineTarget, targetID string, reviewedBy, note string, release bool) bool {
	qm.mu.Lock()
	defer qm.mu.Unlock()
	
	key := makeKey(targetType, targetID)
	entry, exists := qm.entries[key]
	
	if !exists {
		return false
	}
	
	now := time.Now()
	entry.ReviewedAt = &now
	entry.ReviewedBy = reviewedBy
	entry.ReviewNote = note
	
	if release {
		entry.ReleasedAt = &now
		entry.ReleasedBy = reviewedBy
		entry.ReleaseNote = "Released after review: " + note
		
		log.Printf("🔓 [QUARANTINE] %s %s liberado após revisão por %s", 
			targetType, targetID, reviewedBy)
		
		if qm.onRelease != nil {
			go qm.onRelease(entry)
		}
	} else {
		log.Printf("📋 [QUARANTINE] %s %s revisado por %s (mantido)", 
			targetType, targetID, reviewedBy)
	}
	
	return true
}

// GetActiveQuarantines retorna todas as quarentenas ativas
func (qm *QuarantineManager) GetActiveQuarantines() []*QuarantineEntry {
	qm.mu.RLock()
	defer qm.mu.RUnlock()
	
	var active []*QuarantineEntry
	for _, entry := range qm.entries {
		if entry.IsActive() {
			active = append(active, entry)
		}
	}
	
	return active
}

// GetPendingReviews retorna quarentenas aguardando revisão
func (qm *QuarantineManager) GetPendingReviews() []*QuarantineEntry {
	qm.mu.RLock()
	defer qm.mu.RUnlock()
	
	var pending []*QuarantineEntry
	for _, entry := range qm.entries {
		if entry.IsActive() && entry.Type == QuarantineReview && entry.ReviewedAt == nil {
			pending = append(pending, entry)
		}
	}
	
	return pending
}

// Stats retorna estatísticas
func (qm *QuarantineManager) Stats() map[string]interface{} {
	qm.mu.RLock()
	defer qm.mu.RUnlock()
	
	var active, soft, hard, review, pending int
	byTarget := make(map[QuarantineTarget]int)
	byReason := make(map[QuarantineReason]int)
	
	for _, entry := range qm.entries {
		if entry.IsActive() {
			active++
			byTarget[entry.TargetType]++
			byReason[entry.Reason]++
			
			switch entry.Type {
			case QuarantineSoft:
				soft++
			case QuarantineHard:
				hard++
			case QuarantineReview:
				review++
				if entry.ReviewedAt == nil {
					pending++
				}
			}
		}
	}
	
	return map[string]interface{}{
		"total_active":    active,
		"soft":            soft,
		"hard":            hard,
		"review":          review,
		"pending_review":  pending,
		"by_target":       byTarget,
		"by_reason":       byReason,
	}
}

// cleanupLoop limpa quarentenas expiradas
func (qm *QuarantineManager) cleanupLoop() {
	ticker := time.NewTicker(qm.cleanupInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			qm.cleanup()
		case <-qm.stopCleanup:
			return
		}
	}
}

// cleanup remove quarentenas expiradas
func (qm *QuarantineManager) cleanup() {
	qm.mu.Lock()
	defer qm.mu.Unlock()
	
	now := time.Now()
	var released int
	
	for key, entry := range qm.entries {
		if entry.AutoRelease && entry.ExpiresAt != nil && now.After(*entry.ExpiresAt) && entry.ReleasedAt == nil {
			entry.ReleasedAt = &now
			entry.ReleasedBy = "system"
			entry.ReleaseNote = "Auto-released after expiration"
			released++
			
			log.Printf("🔓 [QUARANTINE] %s %s auto-liberado (expirado)", 
				entry.TargetType, entry.TargetID)
			
			if qm.onRelease != nil {
				go qm.onRelease(qm.entries[key])
			}
		}
	}
	
	if released > 0 {
		log.Printf("🧹 [QUARANTINE] Cleanup: %d quarentenas auto-liberadas", released)
	}
}

// Stop para o cleanup
func (qm *QuarantineManager) Stop() {
	close(qm.stopCleanup)
}

// Global quarantine manager
var globalQuarantine = NewQuarantineManager()

// QuarantineUser coloca usuário em quarentena
func QuarantineUser(userID string, qType QuarantineType, reason QuarantineReason, evidence map[string]interface{}, duration time.Duration) *QuarantineEntry {
	return globalQuarantine.Quarantine(TargetUser, userID, qType, reason, evidence, duration)
}

// QuarantineApp coloca app em quarentena
func QuarantineApp(appID string, qType QuarantineType, reason QuarantineReason, evidence map[string]interface{}, duration time.Duration) *QuarantineEntry {
	return globalQuarantine.Quarantine(TargetApp, appID, qType, reason, evidence, duration)
}

// QuarantineIP coloca IP em quarentena
func QuarantineIP(ip string, qType QuarantineType, reason QuarantineReason, evidence map[string]interface{}, duration time.Duration) *QuarantineEntry {
	return globalQuarantine.Quarantine(TargetIP, ip, qType, reason, evidence, duration)
}

// IsUserQuarantined verifica se usuário está em quarentena
func IsUserQuarantined(userID string) bool {
	return globalQuarantine.IsQuarantined(TargetUser, userID)
}

// IsAppQuarantined verifica se app está em quarentena
func IsAppQuarantined(appID string) bool {
	return globalQuarantine.IsQuarantined(TargetApp, appID)
}

// IsIPQuarantined verifica se IP está em quarentena
func IsIPQuarantined(ip string) bool {
	return globalQuarantine.IsQuarantined(TargetIP, ip)
}

// GetQuarantineStats retorna estatísticas globais
func GetQuarantineStats() map[string]interface{} {
	return globalQuarantine.Stats()
}
