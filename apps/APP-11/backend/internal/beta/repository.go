
package beta

import (
	"context"
	"time"

	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/pkg/errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// BetaSubscriptionRepository defines the interface for beta subscription data operations.
type BetaSubscriptionRepository interface {
	CreateSubscription(ctx context.Context, subscription *model.BetaSubscription) (*model.BetaSubscription, error)
	GetSubscriptionByEmail(ctx context.Context, email string) (*model.BetaSubscription, error)
}

// postgresBetaSubscriptionRepository implements BetaSubscriptionRepository using PostgreSQL.
type postgresBetaSubscriptionRepository struct {
	db *pgxpool.Pool
}

// NewPostgresBetaSubscriptionRepository creates a new BetaSubscriptionRepository.
func NewPostgresBetaSubscriptionRepository(db *pgxpool.Pool) BetaSubscriptionRepository {
	return &postgresBetaSubscriptionRepository{db: db}
}

// CreateSubscription inserts a new beta subscription into the database.
func (r *postgresBetaSubscriptionRepository) CreateSubscription(ctx context.Context, subscription *model.BetaSubscription) (*model.BetaSubscription, error) {
	subscription.ID = uuid.New()
	subscription.SubscriptionDate = time.Now()
	subscription.Status = model.BetaStatusPending // Default status

	query := `INSERT INTO "BetaSubscription" (id, name, email, subscriptionDate, status)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id, name, email, subscriptionDate, status`

	var createdSubscription model.BetaSubscription
	err := r.db.QueryRow(ctx, query,
		subscription.ID, subscription.Name, subscription.Email, subscription.SubscriptionDate, subscription.Status,
	).Scan(
		&createdSubscription.ID, &createdSubscription.Name, &createdSubscription.Email, &createdSubscription.SubscriptionDate, &createdSubscription.Status,
	)
	if err != nil {
		// Check for unique constraint violation error from pgx (e.g., duplicate email)
		// pgx.ErrNoRows is for SELECTs that return no rows. For INSERT, we check constraint errors.
		// A more robust check might parse the specific error code from PostgreSQL.
		if err.Error() == "ERROR: duplicate key value violates unique constraint \"BetaSubscription_email_key\" (SQLSTATE 23505)" {
			return nil, errors.NewAPIError(409, errors.CodeBetaEmailAlreadySubscribed, "email already subscribed to beta", err)
		}
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to create beta subscription")
	}
	return &createdSubscription, nil
}

// GetSubscriptionByEmail retrieves a beta subscription by email.
func (r *postgresBetaSubscriptionRepository) GetSubscriptionByEmail(ctx context.Context, email string) (*model.BetaSubscription, error) {
	query := `SELECT id, name, email, subscriptionDate, status FROM "BetaSubscription" WHERE email = $1`
	subscription := &model.BetaSubscription{}
	err := r.db.QueryRow(ctx, query, email).Scan(
		&subscription.ID, &subscription.Name, &subscription.Email, &subscription.SubscriptionDate, &subscription.Status,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.NewAPIError(404, errors.CodeNotFound, "beta subscription not found", err)
		}
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to get beta subscription by email")
	}
	return subscription, nil
}
