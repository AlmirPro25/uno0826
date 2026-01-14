
package beta_test

import (
	"context"
	"testing"
	"time"

	"ai-web-weaver/backend/internal/beta"
	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/pkg/errors"
	"ai-web-weaver/backend/pkg/logger"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockBetaSubscriptionRepository implements beta.BetaSubscriptionRepository
type MockBetaSubscriptionRepository struct {
	mock.Mock
}

func (m *MockBetaSubscriptionRepository) CreateSubscription(ctx context.Context, subscription *model.BetaSubscription) (*model.BetaSubscription, error) {
	args := m.Called(ctx, subscription)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.BetaSubscription), args.Error(1)
}
func (m *MockBetaSubscriptionRepository) GetSubscriptionByEmail(ctx context.Context, email string) (*model.BetaSubscription, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.BetaSubscription), args.Error(1)
}

func TestBetaService_Subscribe(t *testing.T) {
	mockRepo := new(MockBetaSubscriptionRepository)
	testLogger := logger.NewLogger()
	betaService := beta.NewBetaService(mockRepo, testLogger)

	ctx := context.Background()
	req := &model.BetaSubscriptionRequest{
		Name:  "Beta Tester",
		Email: "beta@example.com",
	}

	t.Run("successful subscription", func(t *testing.T) {
		mockRepo.On("GetSubscriptionByEmail", ctx, req.Email).Return(nil, errors.NewAPIError(404, errors.CodeNotFound, "not found", nil)).Once()
		mockRepo.On("CreateSubscription", ctx, mock.AnythingOfType("*model.BetaSubscription")).Return(func(_ context.Context, sub *model.BetaSubscription) *model.BetaSubscription {
			sub.ID = uuid.New()
			sub.SubscriptionDate = time.Now()
			sub.Status = model.BetaStatusPending
			return sub
		}, nil).Once()

		resp, err := betaService.Subscribe(ctx, req)

		assert.Nil(t, err)
		assert.NotNil(t, resp)
		assert.NotEmpty(t, resp.SubscriptionID)
		assert.Equal(t, "Inscrição Beta recebida com sucesso. Verifique seu email para confirmação.", resp.Message)

		mockRepo.AssertExpectations(t)
	})

	t.Run("email already subscribed", func(t *testing.T) {
		existingSub := &model.BetaSubscription{ID: uuid.New(), Email: req.Email, Status: model.BetaStatusPending}
		mockRepo.On("GetSubscriptionByEmail", ctx, req.Email).Return(existingSub, nil).Once()

		resp, err := betaService.Subscribe(ctx, req)

		assert.Nil(t, resp)
		assert.NotNil(t, err)
		assert.True(t, errors.Is(err, errors.CodeBetaEmailAlreadySubscribed))
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error during create", func(t *testing.T) {
		mockRepo.On("GetSubscriptionByEmail", ctx, req.Email).Return(nil, errors.NewAPIError(404, errors.CodeNotFound, "not found", nil)).Once()
		mockRepo.On("CreateSubscription", ctx, mock.AnythingOfType("*model.BetaSubscription")).Return(nil, errors.NewAPIError(500, errors.CodeInternal, "db error", fmt.Errorf("some db error"))).Once()

		resp, err := betaService.Subscribe(ctx, req)

		assert.Nil(t, resp)
		assert.NotNil(t, err)
		assert.True(t, errors.Is(err, errors.CodeInternal))
		mockRepo.AssertExpectations(t)
	})

	mock.AssertExpectationsForObjects(t, mockRepo)
}
