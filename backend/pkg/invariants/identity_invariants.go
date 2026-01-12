package invariants

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// IDENTITY INVARIANTS
// "O que NUNCA pode acontecer com identidade"
// ========================================

// IdentityInvariants verifica invariantes de identidade
type IdentityInvariants struct {
	db *gorm.DB
}

func NewIdentityInvariants(db *gorm.DB) *IdentityInvariants {
	return &IdentityInvariants{db: db}
}

// ========================================
// INVARIANT 1: User Isolation
// "Usuário só pode acessar dados do seu app"
// ========================================

type UserAppMismatch struct {
	UserID    uuid.UUID
	UserAppID uuid.UUID
	DataAppID uuid.UUID
	TableName string
}

// CheckUserIsolation verifica se há vazamento de dados entre apps
func (i *IdentityInvariants) CheckUserIsolation(ctx context.Context) ([]UserAppMismatch, error) {
	var mismatches []UserAppMismatch
	
	// Verificar eventos com app_id diferente do usuário
	var eventMismatches []struct {
		UserID    uuid.UUID `gorm:"column:user_id"`
		UserAppID uuid.UUID `gorm:"column:user_app_id"`
		EventAppID uuid.UUID `gorm:"column:event_app_id"`
	}
	
	err := i.db.Raw(`
		SELECT e.user_id, u.app_id as user_app_id, e.app_id as event_app_id
		FROM telemetry_events e
		JOIN users u ON e.user_id = u.id
		WHERE e.app_id != u.app_id
		LIMIT 100
	`).Scan(&eventMismatches).Error
	
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("erro ao verificar eventos: %w", err)
	}
	
	for _, m := range eventMismatches {
		mismatches = append(mismatches, UserAppMismatch{
			UserID:    m.UserID,
			UserAppID: m.UserAppID,
			DataAppID: m.EventAppID,
			TableName: "telemetry_events",
		})
	}
	
	// Verificar sessões com app_id diferente do usuário
	var sessionMismatches []struct {
		UserID      uuid.UUID `gorm:"column:user_id"`
		UserAppID   uuid.UUID `gorm:"column:user_app_id"`
		SessionAppID uuid.UUID `gorm:"column:session_app_id"`
	}
	
	err = i.db.Raw(`
		SELECT s.user_id, u.app_id as user_app_id, s.app_id as session_app_id
		FROM telemetry_sessions s
		JOIN users u ON s.user_id = u.id
		WHERE s.app_id != u.app_id
		LIMIT 100
	`).Scan(&sessionMismatches).Error
	
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("erro ao verificar sessões: %w", err)
	}
	
	for _, m := range sessionMismatches {
		mismatches = append(mismatches, UserAppMismatch{
			UserID:    m.UserID,
			UserAppID: m.UserAppID,
			DataAppID: m.SessionAppID,
			TableName: "telemetry_sessions",
		})
	}
	
	return mismatches, nil
}

// ========================================
// INVARIANT 2: Email Uniqueness per App
// "Email deve ser único dentro de cada app"
// ========================================

type DuplicateEmail struct {
	Email string
	AppID uuid.UUID
	Count int
}

// CheckEmailUniqueness verifica emails duplicados por app
func (i *IdentityInvariants) CheckEmailUniqueness(ctx context.Context) ([]DuplicateEmail, error) {
	var duplicates []DuplicateEmail
	
	err := i.db.Raw(`
		SELECT email, app_id, COUNT(*) as count
		FROM users
		WHERE deleted_at IS NULL
		GROUP BY email, app_id
		HAVING COUNT(*) > 1
	`).Scan(&duplicates).Error
	
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("erro ao verificar emails: %w", err)
	}
	
	return duplicates, nil
}

// ========================================
// INVARIANT 3: Session Integrity
// "Sessão deve pertencer ao usuário correto"
// ========================================

type SessionIntegrityViolation struct {
	SessionID     uuid.UUID
	SessionUserID uuid.UUID
	TokenUserID   uuid.UUID
}

// CheckSessionIntegrity verifica integridade de sessões
// Nota: Esta verificação é feita em runtime, não em batch
func (i *IdentityInvariants) CheckSessionIntegrity(sessionID, sessionUserID, tokenUserID uuid.UUID) bool {
	return sessionUserID == tokenUserID
}

// ========================================
// INVARIANT 4: No Orphan Users
// "Todo usuário deve pertencer a um app válido"
// ========================================

type OrphanUser struct {
	UserID uuid.UUID
	AppID  uuid.UUID
}

// CheckOrphanUsers verifica usuários sem app válido
func (i *IdentityInvariants) CheckOrphanUsers(ctx context.Context) ([]OrphanUser, error) {
	var orphans []OrphanUser
	
	err := i.db.Raw(`
		SELECT u.id as user_id, u.app_id
		FROM users u
		LEFT JOIN applications a ON u.app_id = a.id
		WHERE a.id IS NULL AND u.deleted_at IS NULL
	`).Scan(&orphans).Error
	
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("erro ao verificar usuários órfãos: %w", err)
	}
	
	return orphans, nil
}

// ========================================
// INVARIANT 5: Password Hash Present
// "Todo usuário com senha deve ter hash"
// ========================================

type MissingPasswordHash struct {
	UserID uuid.UUID
	Email  string
}

// CheckPasswordHashes verifica usuários sem hash de senha
func (i *IdentityInvariants) CheckPasswordHashes(ctx context.Context) ([]MissingPasswordHash, error) {
	var missing []MissingPasswordHash
	
	err := i.db.Raw(`
		SELECT id as user_id, email
		FROM users
		WHERE password_hash IS NULL OR password_hash = ''
		AND deleted_at IS NULL
		AND auth_provider = 'email'
	`).Scan(&missing).Error
	
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("erro ao verificar hashes: %w", err)
	}
	
	return missing, nil
}

// ========================================
// INVARIANT 6: Multi-App Link Consistency
// "Links entre apps devem ser bidirecionais"
// ========================================

type InconsistentLink struct {
	UserID       uuid.UUID
	SourceAppID  uuid.UUID
	TargetAppID  uuid.UUID
	HasReverse   bool
}

// CheckMultiAppLinks verifica consistência de links multi-app
func (i *IdentityInvariants) CheckMultiAppLinks(ctx context.Context) ([]InconsistentLink, error) {
	var inconsistent []InconsistentLink
	
	// Verificar links sem reverso
	err := i.db.Raw(`
		SELECT l1.user_id, l1.source_app_id, l1.target_app_id,
			   EXISTS(
				   SELECT 1 FROM user_app_links l2 
				   WHERE l2.user_id = l1.user_id 
				   AND l2.source_app_id = l1.target_app_id 
				   AND l2.target_app_id = l1.source_app_id
			   ) as has_reverse
		FROM user_app_links l1
		WHERE NOT EXISTS(
			SELECT 1 FROM user_app_links l2 
			WHERE l2.user_id = l1.user_id 
			AND l2.source_app_id = l1.target_app_id 
			AND l2.target_app_id = l1.source_app_id
		)
	`).Scan(&inconsistent).Error
	
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("erro ao verificar links: %w", err)
	}
	
	return inconsistent, nil
}

// ========================================
// RUN ALL INVARIANTS
// ========================================

type IdentityInvariantResult struct {
	Name       string
	Passed     bool
	Violations int
	Details    any
	CheckedAt  time.Time
	Duration   time.Duration
}

// RunAll executa todas as invariantes de identity
func (i *IdentityInvariants) RunAll(ctx context.Context) []IdentityInvariantResult {
	results := make([]IdentityInvariantResult, 0)
	
	// 1. User Isolation
	start := time.Now()
	mismatches, err := i.CheckUserIsolation(ctx)
	results = append(results, IdentityInvariantResult{
		Name:       "user_isolation",
		Passed:     err == nil && len(mismatches) == 0,
		Violations: len(mismatches),
		Details:    mismatches,
		CheckedAt:  time.Now(),
		Duration:   time.Since(start),
	})
	
	// 2. Email Uniqueness
	start = time.Now()
	duplicates, err := i.CheckEmailUniqueness(ctx)
	results = append(results, IdentityInvariantResult{
		Name:       "email_uniqueness",
		Passed:     err == nil && len(duplicates) == 0,
		Violations: len(duplicates),
		Details:    duplicates,
		CheckedAt:  time.Now(),
		Duration:   time.Since(start),
	})
	
	// 3. Orphan Users
	start = time.Now()
	orphans, err := i.CheckOrphanUsers(ctx)
	results = append(results, IdentityInvariantResult{
		Name:       "no_orphan_users",
		Passed:     err == nil && len(orphans) == 0,
		Violations: len(orphans),
		Details:    orphans,
		CheckedAt:  time.Now(),
		Duration:   time.Since(start),
	})
	
	// 4. Password Hashes
	start = time.Now()
	missing, err := i.CheckPasswordHashes(ctx)
	results = append(results, IdentityInvariantResult{
		Name:       "password_hashes",
		Passed:     err == nil && len(missing) == 0,
		Violations: len(missing),
		Details:    missing,
		CheckedAt:  time.Now(),
		Duration:   time.Since(start),
	})
	
	// 5. Multi-App Links
	start = time.Now()
	inconsistent, err := i.CheckMultiAppLinks(ctx)
	results = append(results, IdentityInvariantResult{
		Name:       "multiapp_link_consistency",
		Passed:     err == nil && len(inconsistent) == 0,
		Violations: len(inconsistent),
		Details:    inconsistent,
		CheckedAt:  time.Now(),
		Duration:   time.Since(start),
	})
	
	return results
}
