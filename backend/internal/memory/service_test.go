package memory

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupMemoryTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(
		&DecisionLifecycle{},
		&DecisionConflict{},
		&DecisionPrecedent{},
		&DecisionReview{},
		&LifecycleTransition{},
	)
	require.NoError(t, err)

	return db
}

// ========================================
// LIFECYCLE TESTS
// ========================================

func TestCreateLifecycle(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	req := CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	}

	lifecycle, err := service.CreateLifecycle(req)
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, lifecycle.ID)
	assert.Equal(t, StateActive, lifecycle.State)
	assert.Equal(t, ExpiresAtDate, lifecycle.ExpirationType)
}


func TestCreateLifecycle_MissingExpiration(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	req := CreateLifecycleRequest{
		DecisionID:   uuid.New(),
		DecisionType: "approval",
		Domain:       "billing",
		Action:       "transfer",
		// ExpirationType não definido
	}

	_, err := service.CreateLifecycle(req)
	assert.ErrorIs(t, err, ErrMissingExpiration)
}

func TestCreateLifecycle_ReviewRequired(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	reviewDays := 30
	req := CreateLifecycleRequest{
		DecisionID:      uuid.New(),
		DecisionType:    "authority_grant",
		Domain:          "identity",
		Action:          "grant_admin",
		ExpirationType:  ReviewRequired,
		ReviewEveryDays: &reviewDays,
	}

	lifecycle, err := service.CreateLifecycle(req)
	require.NoError(t, err)
	assert.NotNil(t, lifecycle.NextReviewAt)
	assert.Equal(t, &reviewDays, lifecycle.ReviewEveryDays)
}

func TestGetLifecycle(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	req := CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	}

	created, err := service.CreateLifecycle(req)
	require.NoError(t, err)

	found, err := service.GetLifecycle(created.DecisionID)
	require.NoError(t, err)
	assert.Equal(t, created.ID, found.ID)
}

func TestGetLifecycle_NotFound(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	_, err := service.GetLifecycle(uuid.New())
	assert.ErrorIs(t, err, ErrLifecycleNotFound)
}

func TestIsDecisionActive(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	req := CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	}

	lifecycle, err := service.CreateLifecycle(req)
	require.NoError(t, err)

	active, err := service.IsDecisionActive(lifecycle.DecisionID)
	require.NoError(t, err)
	assert.True(t, active)
}

func TestIsDecisionActive_Expired(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	// Criar com data de expiração no passado
	expiresAt := time.Now().Add(-1 * time.Hour)
	req := CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	}

	lifecycle, err := service.CreateLifecycle(req)
	require.NoError(t, err)

	active, err := service.IsDecisionActive(lifecycle.DecisionID)
	require.NoError(t, err)
	assert.False(t, active)
}

func TestIsDecisionActive_NoLifecycle(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	// Decisão sem lifecycle = backward compatibility = ativa
	active, err := service.IsDecisionActive(uuid.New())
	require.NoError(t, err)
	assert.True(t, active)
}

// ========================================
// STATE TRANSITION TESTS
// ========================================

func TestTransitionToExpired(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	req := CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	}

	lifecycle, err := service.CreateLifecycle(req)
	require.NoError(t, err)

	err = service.TransitionToExpired(lifecycle.DecisionID, uuid.New(), "Manual expiration")
	require.NoError(t, err)

	updated, err := service.GetLifecycle(lifecycle.DecisionID)
	require.NoError(t, err)
	assert.Equal(t, StateExpired, updated.State)
}

func TestTransitionToUnderReview(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	req := CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	}

	lifecycle, err := service.CreateLifecycle(req)
	require.NoError(t, err)

	err = service.TransitionToUnderReview(lifecycle.DecisionID, uuid.New(), "Needs review")
	require.NoError(t, err)

	updated, err := service.GetLifecycle(lifecycle.DecisionID)
	require.NoError(t, err)
	assert.Equal(t, StateUnderReview, updated.State)
}

func TestTransitionToRevoked(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	req := CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	}

	lifecycle, err := service.CreateLifecycle(req)
	require.NoError(t, err)

	err = service.TransitionToRevoked(lifecycle.DecisionID, uuid.New(), "Revoked by admin")
	require.NoError(t, err)

	updated, err := service.GetLifecycle(lifecycle.DecisionID)
	require.NoError(t, err)
	assert.Equal(t, StateRevoked, updated.State)
}

func TestRenewDecision(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	req := CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	}

	lifecycle, err := service.CreateLifecycle(req)
	require.NoError(t, err)

	// Colocar em under_review primeiro
	err = service.TransitionToUnderReview(lifecycle.DecisionID, uuid.New(), "Review")
	require.NoError(t, err)

	// Renovar
	newExpires := time.Now().Add(48 * time.Hour)
	err = service.RenewDecision(lifecycle.DecisionID, uuid.New(), "Renewed after review", &newExpires)
	require.NoError(t, err)

	updated, err := service.GetLifecycle(lifecycle.DecisionID)
	require.NoError(t, err)
	assert.Equal(t, StateActive, updated.State)
}

func TestInvalidTransition(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	req := CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	}

	lifecycle, err := service.CreateLifecycle(req)
	require.NoError(t, err)

	// Revogar
	err = service.TransitionToRevoked(lifecycle.DecisionID, uuid.New(), "Revoked")
	require.NoError(t, err)

	// Tentar transição inválida de revoked -> active
	err = service.RenewDecision(lifecycle.DecisionID, uuid.New(), "Try renew", nil)
	assert.Error(t, err)
}


// ========================================
// CONFLICT TESTS
// ========================================

func TestDetectConflict(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	// Criar duas decisões ativas
	expiresAt := time.Now().Add(24 * time.Hour)
	decisionA, err := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})
	require.NoError(t, err)

	decisionB, err := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})
	require.NoError(t, err)

	// Detectar conflito
	conflict, err := service.DetectConflict(DetectConflictRequest{
		DecisionAID:  decisionA.DecisionID,
		DecisionBID:  decisionB.DecisionID,
		ConflictType: ConflictResource,
		Description:  "Both decisions target same resource",
		Domain:       "billing",
		DetectedBy:   "system",
	})
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, conflict.ID)
	assert.Equal(t, ConflictDetected, conflict.State)
}

func TestHasOpenConflict(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	decisionA, err := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})
	require.NoError(t, err)

	decisionB, err := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})
	require.NoError(t, err)

	// Sem conflito inicialmente
	hasConflict, _, err := service.HasOpenConflict(decisionA.DecisionID)
	require.NoError(t, err)
	assert.False(t, hasConflict)

	// Criar conflito
	_, err = service.DetectConflict(DetectConflictRequest{
		DecisionAID:  decisionA.DecisionID,
		DecisionBID:  decisionB.DecisionID,
		ConflictType: ConflictResource,
		Description:  "Conflict",
		Domain:       "billing",
		DetectedBy:   "system",
	})
	require.NoError(t, err)

	// Agora tem conflito
	hasConflict, _, err = service.HasOpenConflict(decisionA.DecisionID)
	require.NoError(t, err)
	assert.True(t, hasConflict)
}

func TestAcknowledgeConflict(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	decisionA, _ := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})
	decisionB, _ := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})

	conflict, _ := service.DetectConflict(DetectConflictRequest{
		DecisionAID:  decisionA.DecisionID,
		DecisionBID:  decisionB.DecisionID,
		ConflictType: ConflictResource,
		Description:  "Conflict",
		Domain:       "billing",
		DetectedBy:   "system",
	})

	err := service.AcknowledgeConflict(conflict.ID, uuid.New())
	require.NoError(t, err)

	// Verificar estado
	var updated DecisionConflict
	db.First(&updated, "id = ?", conflict.ID)
	assert.Equal(t, ConflictAcknowledged, updated.State)
}

func TestGetOpenConflicts(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	decisionA, _ := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})
	decisionB, _ := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})

	_, _ = service.DetectConflict(DetectConflictRequest{
		DecisionAID:  decisionA.DecisionID,
		DecisionBID:  decisionB.DecisionID,
		ConflictType: ConflictResource,
		Description:  "Conflict",
		Domain:       "billing",
		DetectedBy:   "system",
	})

	conflicts, err := service.GetOpenConflicts("billing")
	require.NoError(t, err)
	assert.Len(t, conflicts, 1)
}

// ========================================
// CAN EXECUTE TESTS
// ========================================

func TestCanExecute_Active(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	lifecycle, err := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})
	require.NoError(t, err)

	canExec, reason, err := service.CanExecute(lifecycle.DecisionID)
	require.NoError(t, err)
	assert.True(t, canExec)
	assert.Empty(t, reason)
}

func TestCanExecute_NotActive(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	lifecycle, err := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})
	require.NoError(t, err)

	// Revogar
	err = service.TransitionToRevoked(lifecycle.DecisionID, uuid.New(), "Revoked")
	require.NoError(t, err)

	canExec, reason, err := service.CanExecute(lifecycle.DecisionID)
	require.NoError(t, err)
	assert.False(t, canExec)
	assert.Contains(t, reason, "não está ativa")
}

func TestCanExecute_HasConflict(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	decisionA, _ := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})
	decisionB, _ := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})

	_, _ = service.DetectConflict(DetectConflictRequest{
		DecisionAID:  decisionA.DecisionID,
		DecisionBID:  decisionB.DecisionID,
		ConflictType: ConflictResource,
		Description:  "Conflict blocks execution",
		Domain:       "billing",
		DetectedBy:   "system",
	})

	canExec, reason, err := service.CanExecute(decisionA.DecisionID)
	require.NoError(t, err)
	assert.False(t, canExec)
	assert.Contains(t, reason, "Conflito aberto")
}


// ========================================
// REVIEW TESTS
// ========================================

func TestCreateReview(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	lifecycle, err := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})
	require.NoError(t, err)

	review, err := service.CreateReview(CreateReviewRequest{
		DecisionID:   lifecycle.DecisionID,
		ReviewType:   ReviewPeriodic,
		ReviewReason: "Periodic review",
		InitiatedBy:  uuid.New(),
	})
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, review.ID)
	assert.Equal(t, OutcomePending, review.Outcome)

	// Decisão deve estar em under_review
	updated, _ := service.GetLifecycle(lifecycle.DecisionID)
	assert.Equal(t, StateUnderReview, updated.State)
}

func TestCompleteReview_Renewed(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	lifecycle, _ := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})

	review, _ := service.CreateReview(CreateReviewRequest{
		DecisionID:   lifecycle.DecisionID,
		ReviewType:   ReviewPeriodic,
		ReviewReason: "Periodic review",
		InitiatedBy:  uuid.New(),
	})

	newExpires := time.Now().Add(48 * time.Hour)
	err := service.CompleteReview(CompleteReviewRequest{
		ReviewID:      review.ID,
		Outcome:       OutcomeRenewed,
		OutcomeReason: "Approved after review",
		DecidedBy:     uuid.New(),
		NewExpiresAt:  &newExpires,
	})
	require.NoError(t, err)

	// Decisão deve estar ativa novamente
	updated, _ := service.GetLifecycle(lifecycle.DecisionID)
	assert.Equal(t, StateActive, updated.State)
}

func TestCompleteReview_Revoked(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	lifecycle, _ := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})

	review, _ := service.CreateReview(CreateReviewRequest{
		DecisionID:   lifecycle.DecisionID,
		ReviewType:   ReviewPeriodic,
		ReviewReason: "Periodic review",
		InitiatedBy:  uuid.New(),
	})

	err := service.CompleteReview(CompleteReviewRequest{
		ReviewID:      review.ID,
		Outcome:       OutcomeRevoked,
		OutcomeReason: "Revoked after review",
		DecidedBy:     uuid.New(),
	})
	require.NoError(t, err)

	// Decisão deve estar revogada
	updated, _ := service.GetLifecycle(lifecycle.DecisionID)
	assert.Equal(t, StateRevoked, updated.State)
}

func TestGetPendingReviews(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	expiresAt := time.Now().Add(24 * time.Hour)
	lifecycle, _ := service.CreateLifecycle(CreateLifecycleRequest{
		DecisionID:     uuid.New(),
		DecisionType:   "approval",
		Domain:         "billing",
		Action:         "transfer",
		ExpirationType: ExpiresAtDate,
		ExpiresAt:      &expiresAt,
	})

	_, _ = service.CreateReview(CreateReviewRequest{
		DecisionID:   lifecycle.DecisionID,
		ReviewType:   ReviewPeriodic,
		ReviewReason: "Periodic review",
		InitiatedBy:  uuid.New(),
	})

	pending, err := service.GetPendingReviews()
	require.NoError(t, err)
	assert.Len(t, pending, 1)
}

// ========================================
// PRECEDENT TESTS
// ========================================

func TestListPrecedentsForContext(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	// Criar precedente diretamente (simulando decisão encerrada)
	precedent := &DecisionPrecedent{
		ID:                 uuid.New(),
		OriginalDecisionID: uuid.New(),
		DecisionType:       "approval",
		Domain:             "billing",
		Action:             "transfer",
		State:              PrecedentActive,
		CreatedBy:          uuid.New(),
		CreationReason:     "Test precedent",
		DecisionDate:       time.Now().Add(-30 * 24 * time.Hour),
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}
	db.Create(precedent)

	precedents, err := service.ListPrecedentsForContext("billing", "transfer")
	require.NoError(t, err)
	assert.Len(t, precedents, 1)
}

func TestDeprecatePrecedent(t *testing.T) {
	db := setupMemoryTestDB(t)
	service := NewMemoryService(db)

	precedent := &DecisionPrecedent{
		ID:                 uuid.New(),
		OriginalDecisionID: uuid.New(),
		DecisionType:       "approval",
		Domain:             "billing",
		Action:             "transfer",
		State:              PrecedentActive,
		CreatedBy:          uuid.New(),
		CreationReason:     "Test precedent",
		DecisionDate:       time.Now().Add(-30 * 24 * time.Hour),
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}
	db.Create(precedent)

	err := service.DeprecatePrecedent(precedent.ID, uuid.New(), "Context changed")
	require.NoError(t, err)

	var updated DecisionPrecedent
	db.First(&updated, "id = ?", precedent.ID)
	assert.Equal(t, PrecedentDeprecated, updated.State)
}

// ========================================
// MODEL TESTS
// ========================================

func TestDecisionLifecycle_IsExpired(t *testing.T) {
	// Não expirado
	future := time.Now().Add(24 * time.Hour)
	lifecycle := &DecisionLifecycle{ExpiresAt: &future}
	assert.False(t, lifecycle.IsExpired())

	// Expirado
	past := time.Now().Add(-1 * time.Hour)
	lifecycle2 := &DecisionLifecycle{ExpiresAt: &past}
	assert.True(t, lifecycle2.IsExpired())
}

func TestDecisionLifecycle_CanProduceEffects(t *testing.T) {
	future := time.Now().Add(24 * time.Hour)
	
	// Ativo e não expirado
	lifecycle := &DecisionLifecycle{State: StateActive, ExpiresAt: &future}
	assert.True(t, lifecycle.CanProduceEffects())

	// Não ativo
	lifecycle2 := &DecisionLifecycle{State: StateRevoked, ExpiresAt: &future}
	assert.False(t, lifecycle2.CanProduceEffects())
}

func TestDecisionConflict_IsBlocking(t *testing.T) {
	conflict := &DecisionConflict{State: ConflictDetected}
	assert.True(t, conflict.IsBlocking())

	conflict2 := &DecisionConflict{State: ConflictAcknowledged}
	assert.True(t, conflict2.IsBlocking())

	conflict3 := &DecisionConflict{State: ConflictResolved}
	assert.False(t, conflict3.IsBlocking())
}

func TestDecisionPrecedent_IsReferenciable(t *testing.T) {
	precedent := &DecisionPrecedent{State: PrecedentActive}
	assert.True(t, precedent.IsReferenciable())

	precedent2 := &DecisionPrecedent{State: PrecedentDeprecated}
	assert.False(t, precedent2.IsReferenciable())
}

func TestDecisionReview_IsPending(t *testing.T) {
	review := &DecisionReview{Outcome: OutcomePending}
	assert.True(t, review.IsPending())

	review2 := &DecisionReview{Outcome: OutcomeRenewed}
	assert.False(t, review2.IsPending())
}
