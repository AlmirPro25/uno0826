package payment

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupPaymentTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(&Payment{})
	require.NoError(t, err)

	return db
}

// ========================================
// PAYMENT MODEL TESTS
// ========================================

func TestPayment_Creation(t *testing.T) {
	db := setupPaymentTestDB(t)

	payment := &Payment{
		ID:          uuid.New(),
		UserID:      uuid.New(),
		Amount:      100.50,
		Currency:    "BRL",
		Description: "Pagamento teste",
		Status:      "pending",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Version:     1,
	}

	err := db.Create(payment).Error
	assert.NoError(t, err)

	var found Payment
	err = db.First(&found, "id = ?", payment.ID).Error
	assert.NoError(t, err)
	assert.Equal(t, 100.50, found.Amount)
	assert.Equal(t, "pending", found.Status)
}

func TestPayment_StatusTransitions(t *testing.T) {
	statuses := []string{"pending", "processing", "completed", "failed", "refunded"}

	for _, status := range statuses {
		payment := Payment{
			ID:     uuid.New(),
			Status: status,
		}
		assert.Equal(t, status, payment.Status)
	}
}

// ========================================
// PAYMENT REPOSITORY TESTS
// ========================================

func TestGormPaymentRepository_CreatePayment(t *testing.T) {
	db := setupPaymentTestDB(t)
	repo := NewGormPaymentRepository(db)

	payment := &Payment{
		ID:          uuid.New(),
		UserID:      uuid.New(),
		Amount:      50.00,
		Currency:    "BRL",
		Description: "Teste",
		Status:      "pending",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Version:     1,
	}

	err := repo.CreatePayment(payment)
	assert.NoError(t, err)

	var count int64
	db.Model(&Payment{}).Count(&count)
	assert.Equal(t, int64(1), count)
}

func TestGormPaymentRepository_GetPaymentByID(t *testing.T) {
	db := setupPaymentTestDB(t)
	repo := NewGormPaymentRepository(db)

	paymentID := uuid.New()
	payment := &Payment{
		ID:        paymentID,
		UserID:    uuid.New(),
		Amount:    75.00,
		Currency:  "BRL",
		Status:    "completed",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Version:   1,
	}
	db.Create(payment)

	found, err := repo.GetPaymentByID(paymentID)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, 75.00, found.Amount)
}

func TestGormPaymentRepository_GetPaymentByID_NotFound(t *testing.T) {
	db := setupPaymentTestDB(t)
	repo := NewGormPaymentRepository(db)

	found, err := repo.GetPaymentByID(uuid.New())
	assert.Error(t, err)
	assert.Nil(t, found)
	assert.Contains(t, err.Error(), "não encontrado")
}

func TestGormPaymentRepository_GetPaymentsByUserID(t *testing.T) {
	db := setupPaymentTestDB(t)
	repo := NewGormPaymentRepository(db)

	userID := uuid.New()

	// Criar múltiplos pagamentos para o mesmo usuário
	for i := 0; i < 3; i++ {
		payment := &Payment{
			ID:        uuid.New(),
			UserID:    userID,
			Amount:    float64(100 * (i + 1)),
			Currency:  "BRL",
			Status:    "completed",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			Version:   1,
		}
		db.Create(payment)
	}

	payments, err := repo.GetPaymentsByUserID(userID)
	assert.NoError(t, err)
	assert.Len(t, payments, 3)
}

func TestGormPaymentRepository_GetSumOfPaymentsByUserID(t *testing.T) {
	db := setupPaymentTestDB(t)
	repo := NewGormPaymentRepository(db)

	userID := uuid.New()

	// Criar pagamentos completed
	amounts := []float64{100.00, 200.00, 300.00}
	for _, amount := range amounts {
		payment := &Payment{
			ID:        uuid.New(),
			UserID:    userID,
			Amount:    amount,
			Currency:  "BRL",
			Status:    "completed",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			Version:   1,
		}
		db.Create(payment)
	}

	// Criar pagamento pending (não deve ser contado)
	pendingPayment := &Payment{
		ID:        uuid.New(),
		UserID:    userID,
		Amount:    500.00,
		Currency:  "BRL",
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Version:   1,
	}
	db.Create(pendingPayment)

	sum, err := repo.GetSumOfPaymentsByUserID(userID)
	assert.NoError(t, err)
	assert.Equal(t, 600.00, sum) // 100 + 200 + 300
}

func TestGormPaymentRepository_UpdatePayment(t *testing.T) {
	db := setupPaymentTestDB(t)
	repo := NewGormPaymentRepository(db)

	paymentID := uuid.New()
	payment := &Payment{
		ID:        paymentID,
		UserID:    uuid.New(),
		Amount:    100.00,
		Currency:  "BRL",
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Version:   1,
	}
	db.Create(payment)

	// Atualizar status
	payment.Status = "completed"
	err := repo.UpdatePayment(payment)
	assert.NoError(t, err)

	var found Payment
	db.First(&found, "id = ?", paymentID)
	assert.Equal(t, "completed", found.Status)
	assert.Equal(t, 2, found.Version) // Version incrementado
}

// ========================================
// PAYMENT SERVICE TESTS
// ========================================

func TestPaymentService_InitiatePayment(t *testing.T) {
	db := setupPaymentTestDB(t)
	repo := NewGormPaymentRepository(db)
	service := NewPaymentService(repo)

	userID := uuid.New().String()
	payload, err := service.InitiatePayment(userID, 150.00, "BRL", "Compra teste")

	assert.NoError(t, err)
	assert.NotNil(t, payload)
	assert.Equal(t, 150.00, payload.Amount)
	assert.Equal(t, "BRL", payload.Currency)
	assert.Equal(t, "pending", payload.Status)
}

func TestPaymentService_InitiatePayment_InvalidUserID(t *testing.T) {
	db := setupPaymentTestDB(t)
	repo := NewGormPaymentRepository(db)
	service := NewPaymentService(repo)

	payload, err := service.InitiatePayment("invalid-uuid", 100.00, "BRL", "Teste")

	assert.Error(t, err)
	assert.Nil(t, payload)
	assert.Contains(t, err.Error(), "userID inválido")
}

func TestPaymentService_GetPaymentByID(t *testing.T) {
	db := setupPaymentTestDB(t)
	repo := NewGormPaymentRepository(db)
	service := NewPaymentService(repo)

	paymentID := uuid.New()
	payment := &Payment{
		ID:        paymentID,
		UserID:    uuid.New(),
		Amount:    200.00,
		Currency:  "BRL",
		Status:    "completed",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Version:   1,
	}
	db.Create(payment)

	found, err := service.GetPaymentByID(paymentID)
	assert.NoError(t, err)
	assert.Equal(t, 200.00, found.Amount)
}

func TestPaymentService_UpdatePaymentStatus(t *testing.T) {
	db := setupPaymentTestDB(t)
	repo := NewGormPaymentRepository(db)
	service := NewPaymentService(repo)

	paymentID := uuid.New()
	payment := &Payment{
		ID:        paymentID,
		UserID:    uuid.New(),
		Amount:    100.00,
		Currency:  "BRL",
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Version:   1,
	}
	db.Create(payment)

	updated, err := service.UpdatePaymentStatus(paymentID, "completed")
	assert.NoError(t, err)
	assert.Equal(t, "completed", updated.Status)
	assert.NotNil(t, updated.CompletedAt)
}

func TestPaymentService_UpdatePaymentStatus_NotFound(t *testing.T) {
	db := setupPaymentTestDB(t)
	repo := NewGormPaymentRepository(db)
	service := NewPaymentService(repo)

	_, err := service.UpdatePaymentStatus(uuid.New(), "completed")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "não encontrado")
}

func TestPaymentService_CalculateUserBalance(t *testing.T) {
	db := setupPaymentTestDB(t)
	repo := NewGormPaymentRepository(db)
	service := NewPaymentService(repo)

	userID := uuid.New()

	// Criar pagamentos completed
	for i := 0; i < 3; i++ {
		payment := &Payment{
			ID:        uuid.New(),
			UserID:    userID,
			Amount:    100.00,
			Currency:  "BRL",
			Status:    "completed",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			Version:   1,
		}
		db.Create(payment)
	}

	balance, timestamp, err := service.CalculateUserBalance(userID)
	assert.NoError(t, err)
	assert.Equal(t, 300.00, balance)
	assert.False(t, timestamp.IsZero())
}

// ========================================
// REQUEST/RESPONSE STRUCT TESTS
// ========================================

func TestInitiatePaymentRequest_Struct(t *testing.T) {
	req := InitiatePaymentRequest{
		UserID:        uuid.New().String(),
		Amount:        99.99,
		Currency:      "BRL",
		Description:   "Compra de produto",
		PaymentMethod: "stripe",
	}

	assert.Equal(t, 99.99, req.Amount)
	assert.Equal(t, "stripe", req.PaymentMethod)
}

func TestInitiatePaymentResponse_Struct(t *testing.T) {
	resp := InitiatePaymentResponse{
		PaymentID: uuid.New().String(),
		Status:    "pending",
		Message:   "Pagamento iniciado com sucesso",
	}

	assert.Equal(t, "pending", resp.Status)
	assert.NotEmpty(t, resp.PaymentID)
}

func TestPaymentStatusResponse_Struct(t *testing.T) {
	resp := PaymentStatusResponse{
		PaymentID: uuid.New().String(),
		Status:    "completed",
		Amount:    150.00,
		Currency:  "BRL",
		Timestamp: time.Now(),
	}

	assert.Equal(t, "completed", resp.Status)
	assert.Equal(t, 150.00, resp.Amount)
}

func TestUserBalanceResponse_Struct(t *testing.T) {
	resp := UserBalanceResponse{
		UserID:      uuid.New().String(),
		Balance:     500.00,
		Currency:    "BRL",
		LastUpdated: time.Now(),
	}

	assert.Equal(t, 500.00, resp.Balance)
	assert.Equal(t, "BRL", resp.Currency)
}

func TestPaymentEventPayload_Struct(t *testing.T) {
	payload := PaymentEventPayload{
		PaymentID:   uuid.New(),
		UserID:      uuid.New(),
		Amount:      250.00,
		Currency:    "BRL",
		Description: "Assinatura mensal",
		Status:      "pending",
		CreatedAt:   time.Now(),
	}

	assert.Equal(t, 250.00, payload.Amount)
	assert.Equal(t, "pending", payload.Status)
}

// ========================================
// EDGE CASES
// ========================================

func TestPayment_ZeroAmount(t *testing.T) {
	db := setupPaymentTestDB(t)

	payment := &Payment{
		ID:        uuid.New(),
		UserID:    uuid.New(),
		Amount:    0.00,
		Currency:  "BRL",
		Status:    "completed",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Version:   1,
	}

	err := db.Create(payment).Error
	assert.NoError(t, err)
}

func TestPayment_NegativeAmount(t *testing.T) {
	db := setupPaymentTestDB(t)

	// Pagamento negativo (reembolso)
	payment := &Payment{
		ID:        uuid.New(),
		UserID:    uuid.New(),
		Amount:    -50.00,
		Currency:  "BRL",
		Status:    "completed",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Version:   1,
	}

	err := db.Create(payment).Error
	assert.NoError(t, err)
}

func TestGormPaymentRepository_GetSumOfPaymentsByUserID_NoPayments(t *testing.T) {
	db := setupPaymentTestDB(t)
	repo := NewGormPaymentRepository(db)

	sum, err := repo.GetSumOfPaymentsByUserID(uuid.New())
	assert.NoError(t, err)
	assert.Equal(t, 0.00, sum)
}
