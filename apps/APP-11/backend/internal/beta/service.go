
package beta

import (
	"context"

	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/pkg/errors"
	"ai-web-weaver/backend/pkg/logger"

	"go.uber.org/zap"
)

// BetaService defines the interface for beta program operations.
type BetaService interface {
	Subscribe(ctx context.Context, req *model.BetaSubscriptionRequest) (*model.BetaSubscriptionResponse, error)
}

// betaService implements BetaService.
type betaService struct {
	repo BetaSubscriptionRepository
	log  *logger.Logger
}

// NewBetaService creates a new BetaService.
func NewBetaService(repo BetaSubscriptionRepository, log *logger.Logger) BetaService {
	return &betaService{
		repo: repo,
		log:  log,
	}
}

// Subscribe handles a new beta subscription request.
func (s *betaService) Subscribe(ctx context.Context, req *model.BetaSubscriptionRequest) (*model.BetaSubscriptionResponse, error) {
	// Check for existing subscription to avoid duplicate entries (though unique constraint will catch it too)
	existing, err := s.repo.GetSubscriptionByEmail(ctx, req.Email)
	if err != nil && !errors.Is(err, errors.CodeNotFound) {
		s.log.Error("Failed to check existing beta subscription", zap.Error(err), zap.String("email", req.Email))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to check subscription status")
	}
	if existing != nil {
		return nil, errors.NewAPIError(409, errors.CodeBetaEmailAlreadySubscribed, "this email is already subscribed to the beta program", nil)
	}

	subscription := &model.BetaSubscription{
		Name:  req.Name,
		Email: req.Email,
	}

	createdSubscription, err := s.repo.CreateSubscription(ctx, subscription)
	if err != nil {
		// Specific error handling for duplicate email from repository
		if errors.Is(err, errors.CodeBetaEmailAlreadySubscribed) {
			return nil, errors.NewAPIError(409, errors.CodeBetaEmailAlreadySubscribed, "this email is already subscribed to the beta program", err)
		}
		s.log.Error("Failed to create beta subscription", zap.Error(err), zap.String("email", req.Email))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to process beta subscription")
	}

	s.log.Info("New beta subscription received", zap.String("email", createdSubscription.Email), zap.String("id", createdSubscription.ID.String()))

	return &model.BetaSubscriptionResponse{
		Message:        "Inscrição Beta recebida com sucesso. Verifique seu email para confirmação.",
		SubscriptionID: createdSubscription.ID,
	}, nil
}
