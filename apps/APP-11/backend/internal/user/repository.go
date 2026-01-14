
package user

import (
	"context"
	"time"

	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/pkg/errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// UserRepository defines the interface for user data operations specific to profile management.
// It can share the underlying implementation with the auth.UserRepository if the methods are identical.
// For demonstration, this is a separate interface but points to the same underlying struct if methods are reused.
type UserRepository interface {
	GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error)
	GetUserByEmail(ctx context.Context, email string) (*model.User, error) // For email uniqueness check
	UpdateUser(ctx context.Context, user *model.User) (*model.User, error)
}

// postgresUserRepository implements UserRepository using PostgreSQL.
type postgresUserRepository struct {
	db *pgxpool.Pool
}

// NewPostgresUserRepository creates a new UserRepository.
func NewPostgresUserRepository(db *pgxpool.Pool) UserRepository {
	return &postgresUserRepository{db: db}
}

// GetUserByID retrieves a user by their ID.
func (r *postgresUserRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	query := `SELECT id, name, email, passwordHash, role, createdAt, updatedAt FROM "User" WHERE id = $1`
	user := &model.User{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.NewAPIError(404, errors.CodeNotFound, "user not found", err)
		}
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to get user by ID")
	}
	return user, nil
}

// GetUserByEmail retrieves a user by their email address.
func (r *postgresUserRepository) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `SELECT id, name, email, passwordHash, role, createdAt, updatedAt FROM "User" WHERE email = $1`
	user := &model.User{}
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.NewAPIError(404, errors.CodeNotFound, "user not found", err)
		}
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to get user by email")
	}
	return user, nil
}

// UpdateUser updates an existing user in the database.
func (r *postgresUserRepository) UpdateUser(ctx context.Context, user *model.User) (*model.User, error) {
	user.UpdatedAt = time.Now()
	query := `UPDATE "User" SET name=$1, email=$2, passwordHash=$3, updatedAt=$4 WHERE id=$5
              RETURNING id, name, email, role, createdAt, updatedAt`

	var updatedUser model.User
	err := r.db.QueryRow(ctx, query, user.Name, user.Email, user.PasswordHash, user.UpdatedAt, user.ID).Scan(
		&updatedUser.ID, &updatedUser.Name, &updatedUser.Email, &updatedUser.Role, &updatedUser.CreatedAt, &updatedUser.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.NewAPIError(404, errors.CodeNotFound, "user not found for update", err)
		}
		// Catch duplicate email error specifically
		if err.Error() == "ERROR: duplicate key value violates unique constraint \"User_email_key\" (SQLSTATE 23505)" {
			return nil, errors.NewAPIError(409, errors.CodeEmailTaken, "email already registered", err)
		}
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to update user")
	}
	return &updatedUser, nil
}
