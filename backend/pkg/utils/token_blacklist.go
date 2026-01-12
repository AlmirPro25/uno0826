package utils

/*
================================================================================
TOKEN BLACKLIST — REVOGAÇÃO DE TOKENS JWT
================================================================================

Permite invalidar tokens antes da expiração:
- Logout forçado
- Comprometimento de conta
- Mudança de senha
- Revogação administrativa

"Um token válido pode se tornar inválido a qualquer momento"

================================================================================
*/

import (
	"sync"
	"time"

	"github.com/google/uuid"
)

// BlacklistEntry entrada na blacklist
type BlacklistEntry struct {
	TokenID     string    // jti do token
	UserID      string    // ID do usuário
	Reason      string    // Motivo da revogação
	RevokedAt   time.Time // Quando foi revogado
	ExpiresAt   time.Time // Quando o token original expiraria
}

// TokenBlacklist gerencia tokens revogados
type TokenBlacklist struct {
	mu      sync.RWMutex
	entries map[string]*BlacklistEntry // key: jti
	byUser  map[string][]string        // userID -> []jti
}

// Global blacklist
var globalBlacklist *TokenBlacklist
var blacklistOnce sync.Once

// GetTokenBlacklist retorna instância global
func GetTokenBlacklist() *TokenBlacklist {
	blacklistOnce.Do(func() {
		globalBlacklist = &TokenBlacklist{
			entries: make(map[string]*BlacklistEntry),
			byUser:  make(map[string][]string),
		}
		// Iniciar cleanup periódico
		go globalBlacklist.cleanupLoop()
	})
	return globalBlacklist
}

// Revoke revoga um token específico
func (tb *TokenBlacklist) Revoke(tokenID, userID, reason string, expiresAt time.Time) {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	entry := &BlacklistEntry{
		TokenID:   tokenID,
		UserID:    userID,
		Reason:    reason,
		RevokedAt: time.Now(),
		ExpiresAt: expiresAt,
	}

	tb.entries[tokenID] = entry
	tb.byUser[userID] = append(tb.byUser[userID], tokenID)
}

// RevokeAllForUser revoga todos os tokens de um usuário
func (tb *TokenBlacklist) RevokeAllForUser(userID, reason string) int {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	// Criar entrada especial que invalida todos os tokens do usuário
	// emitidos antes deste momento
	specialID := "all:" + userID + ":" + uuid.New().String()
	entry := &BlacklistEntry{
		TokenID:   specialID,
		UserID:    userID,
		Reason:    reason,
		RevokedAt: time.Now(),
		ExpiresAt: time.Now().Add(24 * time.Hour), // Manter por 24h
	}

	tb.entries[specialID] = entry
	tb.byUser[userID] = append(tb.byUser[userID], specialID)

	return 1
}

// IsRevoked verifica se um token está revogado
func (tb *TokenBlacklist) IsRevoked(tokenID, userID string, issuedAt time.Time) bool {
	tb.mu.RLock()
	defer tb.mu.RUnlock()

	// Verificar revogação específica do token
	if _, exists := tb.entries[tokenID]; exists {
		return true
	}

	// Verificar revogação em massa do usuário
	if userTokens, exists := tb.byUser[userID]; exists {
		for _, tid := range userTokens {
			if entry, ok := tb.entries[tid]; ok {
				// Se é uma revogação "all:" e o token foi emitido antes
				if len(tid) > 4 && tid[:4] == "all:" {
					if issuedAt.Before(entry.RevokedAt) {
						return true
					}
				}
			}
		}
	}

	return false
}

// cleanupLoop remove entradas expiradas
func (tb *TokenBlacklist) cleanupLoop() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		tb.cleanup()
	}
}

// cleanup remove entradas expiradas
func (tb *TokenBlacklist) cleanup() {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	now := time.Now()
	for id, entry := range tb.entries {
		if now.After(entry.ExpiresAt) {
			delete(tb.entries, id)
			// Remover do índice por usuário
			if userTokens, exists := tb.byUser[entry.UserID]; exists {
				newTokens := make([]string, 0, len(userTokens))
				for _, tid := range userTokens {
					if tid != id {
						newTokens = append(newTokens, tid)
					}
				}
				if len(newTokens) > 0 {
					tb.byUser[entry.UserID] = newTokens
				} else {
					delete(tb.byUser, entry.UserID)
				}
			}
		}
	}
}

// Stats retorna estatísticas
func (tb *TokenBlacklist) Stats() map[string]interface{} {
	tb.mu.RLock()
	defer tb.mu.RUnlock()

	return map[string]interface{}{
		"total_entries":  len(tb.entries),
		"users_affected": len(tb.byUser),
	}
}

// ========================================
// FUNÇÕES DE CONVENIÊNCIA
// ========================================

// RevokeToken revoga um token específico
func RevokeToken(tokenID, userID, reason string, expiresAt time.Time) {
	GetTokenBlacklist().Revoke(tokenID, userID, reason, expiresAt)
}

// RevokeAllUserTokens revoga todos os tokens de um usuário
func RevokeAllUserTokens(userID, reason string) int {
	return GetTokenBlacklist().RevokeAllForUser(userID, reason)
}

// IsTokenRevoked verifica se token está revogado
func IsTokenRevoked(tokenID, userID string, issuedAt time.Time) bool {
	return GetTokenBlacklist().IsRevoked(tokenID, userID, issuedAt)
}
