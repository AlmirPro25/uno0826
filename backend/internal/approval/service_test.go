package approval

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"prost-qs/backend/internal/audit"
	"prost-qs/backend/internal/authority"
)

func setupApprovalTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	db.AutoMigrate(
		&ApprovalRequest{},
		&ApprovalDecision{},
		&authority.DecisionAuthority{},
		&audit.AuditEvent{},
	)
	return db
}

func createApprovalTestService(t *testing.T, db *gorm.DB) *ApprovalService {
	authorityService := authority.NewAuthorityService(db)
	auditService := audit.NewAuditService(db)
	return NewApprovalService(db, authorityService, auditService)
}

func createTestAuthority(t *testing.T, db *gorm.DB, userID uuid.UUID) *authority.DecisionAuthority {
	authService := authority.NewAuthorityService(db)
	scopes := authority.AuthorityScopes{{
		Domain:    "*",
		Actions:   []string{"*"},
		MaxAmount: 1000000,
		MaxImpact: "critical",
	}}
	auth, err := authService.Grant(userID, authority.RoleSuperAdmin, "Super Admin", scopes, authority.ImpactCritical, uuid.New(), "Test grant", nil)
	require.NoError(t, err)
	return auth
}

// ===========================================
// CREATE REQUEST TESTS
// ===========================================

func TestCreateRequest(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	// Criar autoridade para resolver
	authorityUserID := uuid.New()
	createTestAuthority(t, db, authorityUserID)

	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactMedium,
		Amount:          50000,
		Context:         ApprovalContext{Intent: "Test payment", Description: "Test"},
		RequestedBy:     uuid.New(),
		RequestedByType: "agent",
		RequestReason:   "Test reason",
		ExpiresInHours:  24,
	}

	result, err := service.CreateRequest(req)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, StatusPending, result.Status)
	assert.Equal(t, "billing", result.Domain)
	assert.Equal(t, "approve_payment", result.Action)
	assert.Equal(t, int64(50000), result.Amount)
	assert.True(t, result.ExpiresAt.After(time.Now()))
}

func TestCreateRequestDefaultExpiration(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	createTestAuthority(t, db, authorityUserID)

	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactLow,
		Context:         ApprovalContext{Intent: "Test"},
		RequestedBy:     uuid.New(),
		RequestedByType: "system",
		RequestReason:   "Test reason",
		// ExpiresInHours não definido - deve usar default 24h
	}

	result, err := service.CreateRequest(req)

	assert.NoError(t, err)
	// Deve expirar em aproximadamente 24 horas
	expectedExpiry := time.Now().Add(24 * time.Hour)
	assert.WithinDuration(t, expectedExpiry, result.ExpiresAt, 1*time.Minute)
}

func TestCreateRequestWithEligibleSnapshot(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	createTestAuthority(t, db, authorityUserID)

	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactMedium,
		Context:         ApprovalContext{Intent: "Test"},
		RequestedBy:     uuid.New(),
		RequestedByType: "agent",
		RequestReason:   "Test reason",
	}

	result, err := service.CreateRequest(req)

	assert.NoError(t, err)
	assert.NotEmpty(t, result.EligibleAuthorities.Authorities)
	assert.False(t, result.EligibleAuthorities.ResolvedAt.IsZero())
}

// ===========================================
// DECIDE TESTS
// ===========================================

func TestDecideApprove(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	auth := createTestAuthority(t, db, authorityUserID)

	// Criar request
	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactMedium,
		Context:         ApprovalContext{Intent: "Test"},
		RequestedBy:     uuid.New(),
		RequestedByType: "agent",
		RequestReason:   "Test reason",
	}
	approvalReq, _ := service.CreateRequest(req)

	// Decidir
	decision, err := service.Decide(
		approvalReq.ID,
		auth.ID,
		authorityUserID,
		StatusApproved,
		"Approved after review - all checks passed",
		"127.0.0.1",
		"Test Agent",
	)

	assert.NoError(t, err)
	assert.NotNil(t, decision)
	assert.Equal(t, StatusApproved, decision.Decision)
	assert.NotEmpty(t, decision.Hash)
}

func TestDecideReject(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	auth := createTestAuthority(t, db, authorityUserID)

	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactMedium,
		Context:         ApprovalContext{Intent: "Test"},
		RequestedBy:     uuid.New(),
		RequestedByType: "agent",
		RequestReason:   "Test reason",
	}
	approvalReq, _ := service.CreateRequest(req)

	decision, err := service.Decide(
		approvalReq.ID,
		auth.ID,
		authorityUserID,
		StatusRejected,
		"Rejected due to policy violation",
		"127.0.0.1",
		"Test Agent",
	)

	assert.NoError(t, err)
	assert.Equal(t, StatusRejected, decision.Decision)
}

func TestDecideEscalate(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	auth := createTestAuthority(t, db, authorityUserID)

	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactHigh,
		Context:         ApprovalContext{Intent: "Test"},
		RequestedBy:     uuid.New(),
		RequestedByType: "agent",
		RequestReason:   "Test reason",
	}
	approvalReq, _ := service.CreateRequest(req)

	decision, err := service.Decide(
		approvalReq.ID,
		auth.ID,
		authorityUserID,
		StatusEscalated,
		"Escalating to higher authority for review",
		"127.0.0.1",
		"Test Agent",
	)

	assert.NoError(t, err)
	assert.Equal(t, StatusEscalated, decision.Decision)
}

func TestDecideInvalidDecision(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	_, err := service.Decide(
		uuid.New(),
		uuid.New(),
		uuid.New(),
		StatusPending, // Inválido
		"Test justification here",
		"127.0.0.1",
		"Test Agent",
	)

	assert.Error(t, err)
	assert.Equal(t, ErrInvalidDecision, err)
}

func TestDecideJustificationRequired(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	_, err := service.Decide(
		uuid.New(),
		uuid.New(),
		uuid.New(),
		StatusApproved,
		"short", // Muito curta
		"127.0.0.1",
		"Test Agent",
	)

	assert.Error(t, err)
	assert.Equal(t, ErrJustificationRequired, err)
}

func TestDecideRequestNotFound(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	_, err := service.Decide(
		uuid.New(), // ID inexistente
		uuid.New(),
		uuid.New(),
		StatusApproved,
		"Valid justification text",
		"127.0.0.1",
		"Test Agent",
	)

	assert.Error(t, err)
	assert.Equal(t, ErrRequestNotFound, err)
}

func TestDecideRequestNotPending(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	auth := createTestAuthority(t, db, authorityUserID)

	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactMedium,
		Context:         ApprovalContext{Intent: "Test"},
		RequestedBy:     uuid.New(),
		RequestedByType: "agent",
		RequestReason:   "Test reason",
	}
	approvalReq, _ := service.CreateRequest(req)

	// Primeira decisão
	service.Decide(approvalReq.ID, auth.ID, authorityUserID, StatusApproved, "First approval decision", "127.0.0.1", "Test")

	// Segunda decisão deve falhar
	_, err := service.Decide(approvalReq.ID, auth.ID, authorityUserID, StatusRejected, "Second decision attempt", "127.0.0.1", "Test")

	assert.Error(t, err)
	assert.Equal(t, ErrRequestNotPending, err)
}

func TestDecideSelfApproval(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	userID := uuid.New()
	otherUserID := uuid.New()
	
	// Criar autoridade para outro usuário (não o solicitante)
	auth := createTestAuthority(t, db, otherUserID)

	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactMedium,
		Context:         ApprovalContext{Intent: "Test"},
		RequestedBy:     userID,
		RequestedByType: "user",
		RequestReason:   "Test reason",
	}
	approvalReq, _ := service.CreateRequest(req)

	// Tentar aprovar com o mesmo usuário que solicitou
	_, err := service.Decide(
		approvalReq.ID,
		auth.ID,
		userID, // Mesmo usuário que solicitou
		StatusApproved,
		"Self approval attempt",
		"127.0.0.1",
		"Test Agent",
	)

	assert.Error(t, err)
	assert.Equal(t, ErrSelfApproval, err)
}

func TestDecideNotEligible(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	createTestAuthority(t, db, authorityUserID)

	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactMedium,
		Context:         ApprovalContext{Intent: "Test"},
		RequestedBy:     uuid.New(),
		RequestedByType: "agent",
		RequestReason:   "Test reason",
	}
	approvalReq, _ := service.CreateRequest(req)

	// Tentar decidir com autoridade não elegível
	_, err := service.Decide(
		approvalReq.ID,
		uuid.New(), // Autoridade inexistente
		uuid.New(),
		StatusApproved,
		"Valid justification text",
		"127.0.0.1",
		"Test Agent",
	)

	assert.Error(t, err)
	assert.Equal(t, ErrNotEligible, err)
}


// ===========================================
// QUERY TESTS
// ===========================================

func TestGetByID(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	createTestAuthority(t, db, authorityUserID)

	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactMedium,
		Context:         ApprovalContext{Intent: "Test"},
		RequestedBy:     uuid.New(),
		RequestedByType: "agent",
		RequestReason:   "Test reason",
	}
	created, _ := service.CreateRequest(req)

	found, err := service.GetByID(created.ID)

	assert.NoError(t, err)
	assert.Equal(t, created.ID, found.ID)
}

func TestGetByIDNotFound(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	_, err := service.GetByID(uuid.New())

	assert.Error(t, err)
	assert.Equal(t, ErrRequestNotFound, err)
}

func TestGetPending(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	createTestAuthority(t, db, authorityUserID)

	// Criar múltiplos requests
	for i := 0; i < 5; i++ {
		req := CreateApprovalRequest{
			Domain:          "billing",
			Action:          "approve_payment",
			Impact:          authority.ImpactMedium,
			Context:         ApprovalContext{Intent: "Test"},
			RequestedBy:     uuid.New(),
			RequestedByType: "agent",
			RequestReason:   "Test reason",
		}
		service.CreateRequest(req)
	}

	pending, err := service.GetPending()

	assert.NoError(t, err)
	assert.Len(t, pending, 5)
}

func TestGetPendingForAuthority(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	auth := createTestAuthority(t, db, authorityUserID)

	// Criar requests
	for i := 0; i < 3; i++ {
		req := CreateApprovalRequest{
			Domain:          "billing",
			Action:          "approve_payment",
			Impact:          authority.ImpactMedium,
			Context:         ApprovalContext{Intent: "Test"},
			RequestedBy:     uuid.New(),
			RequestedByType: "agent",
			RequestReason:   "Test reason",
		}
		service.CreateRequest(req)
	}

	pending, err := service.GetPendingForAuthority(auth.ID)

	assert.NoError(t, err)
	assert.Len(t, pending, 3)
}

func TestGetDecision(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	auth := createTestAuthority(t, db, authorityUserID)

	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactMedium,
		Context:         ApprovalContext{Intent: "Test"},
		RequestedBy:     uuid.New(),
		RequestedByType: "agent",
		RequestReason:   "Test reason",
	}
	approvalReq, _ := service.CreateRequest(req)

	decision, _ := service.Decide(approvalReq.ID, auth.ID, authorityUserID, StatusApproved, "Approved after review", "127.0.0.1", "Test")

	found, err := service.GetDecision(decision.ID)

	assert.NoError(t, err)
	assert.Equal(t, decision.ID, found.ID)
}

func TestGetDecisionByRequest(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	auth := createTestAuthority(t, db, authorityUserID)

	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactMedium,
		Context:         ApprovalContext{Intent: "Test"},
		RequestedBy:     uuid.New(),
		RequestedByType: "agent",
		RequestReason:   "Test reason",
	}
	approvalReq, _ := service.CreateRequest(req)

	service.Decide(approvalReq.ID, auth.ID, authorityUserID, StatusApproved, "Approved after review", "127.0.0.1", "Test")

	found, err := service.GetDecisionByRequest(approvalReq.ID)

	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, approvalReq.ID, found.RequestID)
}

func TestGetDecisionByRequestNoDecision(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	createTestAuthority(t, db, authorityUserID)

	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactMedium,
		Context:         ApprovalContext{Intent: "Test"},
		RequestedBy:     uuid.New(),
		RequestedByType: "agent",
		RequestReason:   "Test reason",
	}
	approvalReq, _ := service.CreateRequest(req)

	found, err := service.GetDecisionByRequest(approvalReq.ID)

	assert.NoError(t, err)
	assert.Nil(t, found) // Sem decisão ainda
}

func TestGetChain(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	auth := createTestAuthority(t, db, authorityUserID)

	req := CreateApprovalRequest{
		Domain:          "billing",
		Action:          "approve_payment",
		Impact:          authority.ImpactMedium,
		Context:         ApprovalContext{Intent: "Test"},
		RequestedBy:     uuid.New(),
		RequestedByType: "agent",
		RequestReason:   "Test reason",
	}
	approvalReq, _ := service.CreateRequest(req)

	service.Decide(approvalReq.ID, auth.ID, authorityUserID, StatusApproved, "Approved after review", "127.0.0.1", "Test")

	chain, err := service.GetChain(approvalReq.ID)

	assert.NoError(t, err)
	assert.Equal(t, approvalReq.ID, chain.RequestID)
	assert.Len(t, chain.Decisions, 1)
	assert.Equal(t, StatusApproved, chain.FinalStatus)
}

func TestGetByDomain(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	createTestAuthority(t, db, authorityUserID)

	// Criar requests em diferentes domínios
	domains := []string{"billing", "billing", "ads", "billing"}
	for _, domain := range domains {
		req := CreateApprovalRequest{
			Domain:          domain,
			Action:          "test_action",
			Impact:          authority.ImpactMedium,
			Context:         ApprovalContext{Intent: "Test"},
			RequestedBy:     uuid.New(),
			RequestedByType: "agent",
			RequestReason:   "Test reason",
		}
		service.CreateRequest(req)
	}

	billingRequests, err := service.GetByDomain("billing", 10)

	assert.NoError(t, err)
	assert.Len(t, billingRequests, 3)
}

func TestGetHistory(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	authorityUserID := uuid.New()
	createTestAuthority(t, db, authorityUserID)

	for i := 0; i < 5; i++ {
		req := CreateApprovalRequest{
			Domain:          "billing",
			Action:          "approve_payment",
			Impact:          authority.ImpactMedium,
			Context:         ApprovalContext{Intent: "Test"},
			RequestedBy:     uuid.New(),
			RequestedByType: "agent",
			RequestReason:   "Test reason",
		}
		service.CreateRequest(req)
	}

	history, err := service.GetHistory(time.Now().Add(-1*time.Hour), 10)

	assert.NoError(t, err)
	assert.Len(t, history, 5)
}

// ===========================================
// EXPIRATION TESTS
// ===========================================

func TestExpirePending(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	// Criar request expirado manualmente
	expiredReq := &ApprovalRequest{
		ID:              uuid.New(),
		Domain:          "billing",
		Action:          "test",
		Impact:          authority.ImpactMedium,
		RequestedBy:     uuid.New(),
		RequestedByType: "agent",
		RequestReason:   "Test",
		Status:          StatusPending,
		CreatedAt:       time.Now().Add(-48 * time.Hour),
		ExpiresAt:       time.Now().Add(-24 * time.Hour), // Já expirou
	}
	db.Create(expiredReq)

	count, err := service.ExpirePending()

	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)

	// Verificar que foi marcado como expirado
	var updated ApprovalRequest
	db.First(&updated, "id = ?", expiredReq.ID)
	assert.Equal(t, StatusExpired, updated.Status)
}

// ===========================================
// MODEL TESTS
// ===========================================

func TestApprovalRequestTableName(t *testing.T) {
	assert.Equal(t, "approval_requests", ApprovalRequest{}.TableName())
}

func TestApprovalDecisionTableName(t *testing.T) {
	assert.Equal(t, "approval_decisions", ApprovalDecision{}.TableName())
}

func TestApprovalRequestIsExpired(t *testing.T) {
	req := ApprovalRequest{ExpiresAt: time.Now().Add(-1 * time.Hour)}
	assert.True(t, req.IsExpired())

	req.ExpiresAt = time.Now().Add(1 * time.Hour)
	assert.False(t, req.IsExpired())
}

func TestApprovalRequestIsPending(t *testing.T) {
	req := ApprovalRequest{
		Status:    StatusPending,
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}
	assert.True(t, req.IsPending())

	req.Status = StatusApproved
	assert.False(t, req.IsPending())

	req.Status = StatusPending
	req.ExpiresAt = time.Now().Add(-1 * time.Hour)
	assert.False(t, req.IsPending())
}

func TestApprovalStatusConstants(t *testing.T) {
	assert.Equal(t, ApprovalStatus("pending"), StatusPending)
	assert.Equal(t, ApprovalStatus("approved"), StatusApproved)
	assert.Equal(t, ApprovalStatus("rejected"), StatusRejected)
	assert.Equal(t, ApprovalStatus("escalated"), StatusEscalated)
	assert.Equal(t, ApprovalStatus("expired"), StatusExpired)
	assert.Equal(t, ApprovalStatus("cancelled"), StatusCancelled)
}

// ===========================================
// HASH INTEGRITY TESTS
// ===========================================

func TestCalculateHash(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	decision := &ApprovalDecision{
		ID:            uuid.New(),
		RequestID:     uuid.New(),
		AuthorityID:   uuid.New(),
		DecidedBy:     uuid.New(),
		Decision:      StatusApproved,
		Justification: "Test justification",
		DecidedAt:     time.Now(),
	}

	hash := service.calculateHash(decision)

	assert.NotEmpty(t, hash)
	assert.Len(t, hash, 64) // SHA256 hex = 64 chars

	// Mesmo input = mesmo hash
	hash2 := service.calculateHash(decision)
	assert.Equal(t, hash, hash2)
}

func TestCalculateHashDifferentInputs(t *testing.T) {
	db := setupApprovalTestDB(t)
	service := createApprovalTestService(t, db)

	decision1 := &ApprovalDecision{
		ID:            uuid.New(),
		RequestID:     uuid.New(),
		AuthorityID:   uuid.New(),
		DecidedBy:     uuid.New(),
		Decision:      StatusApproved,
		Justification: "Test 1",
		DecidedAt:     time.Now(),
	}

	decision2 := &ApprovalDecision{
		ID:            uuid.New(),
		RequestID:     uuid.New(),
		AuthorityID:   uuid.New(),
		DecidedBy:     uuid.New(),
		Decision:      StatusRejected,
		Justification: "Test 2",
		DecidedAt:     time.Now(),
	}

	hash1 := service.calculateHash(decision1)
	hash2 := service.calculateHash(decision2)

	assert.NotEqual(t, hash1, hash2)
}
