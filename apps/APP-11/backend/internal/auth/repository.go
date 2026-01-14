
package auth

import (
	"context"
	"fmt"
	"time"

	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/internal/util"
	"ai-web-weaver/backend/pkg/errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// UserRepository defines the interface for user data operations.
type UserRepository interface {
	CreateUser(ctx context.Context, user *model.User) (*model.User, error)
	GetUserByEmail(ctx context.Context, email string) (*model.User, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error)
	UpdateUser(ctx context.Context, user *model.User) (*model.User, error)
}

// SessionRepository defines the interface for session data operations.
type SessionRepository interface {
	CreateSession(ctx context.Context, session *model.Session) (*model.Session, error)
	GetSessionByRefreshToken(ctx context.Context, refreshToken string) (*model.Session, error)
	DeleteSession(ctx context.Context, sessionID uuid.UUID) error
	DeleteUserSessions(ctx context.Context, userID uuid.UUID) error
}

// postgresUserRepository implements UserRepository using PostgreSQL.
type postgresUserRepository struct {
	db *pgxpool.Pool
}

// NewPostgresUserRepository creates a new UserRepository.
func NewPostgresUserRepository(db *pgxpool.Pool) UserRepository {
	return &postgresUserRepository{db: db}
}

// CreateUser inserts a new user into the database.
func (r *postgresUserRepository) CreateUser(ctx context.Context, user *model.User) (*model.User, error) {
	user.ID = uuid.New()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	user.Role = model.UserRoleUser // Default role

	query := `INSERT INTO "User" (id, name, email, passwordHash, role, createdAt, updatedAt)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id, name, email, role, createdAt, updatedAt`

	var createdUser model.User
	err := r.db.QueryRow(ctx, query,
		user.ID, user.Name, user.Email, user.PasswordHash, user.Role, user.CreatedAt, user.UpdatedAt,
	).Scan(&createdUser.ID, &createdUser.Name, &createdUser.Email, &createdUser.Role, &createdUser.CreatedAt, &createdUser.UpdatedAt)

	if err != nil {
		return nil, errors.Wrap(err, pgx.ErrNoRows.Error(), errors.CodeConflict, "email already registered") // Assuming unique constraint error maps to this
	}
	return &createdUser, nil
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
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to update user")
	}
	return &updatedUser, nil
}

// postgresSessionRepository implements SessionRepository using PostgreSQL.
type postgresSessionRepository struct {
	db     *pgxpool.Pool
	aesKey []byte
}

// NewPostgresSessionRepository creates a new SessionRepository.
func NewPostgresSessionRepository(db *pgxpool.Pool, aesKey []byte) SessionRepository {
	return &postgresSessionRepository{db: db, aesKey: aesKey}
}

// CreateSession inserts a new session into the database, encrypting the refresh token.
func (r *postgresSessionRepository) CreateSession(ctx context.Context, session *model.Session) (*model.Session, error) {
	session.ID = uuid.New()
	session.CreatedAt = time.Now()

	encryptedRefreshToken, err := util.Encrypt(r.aesKey, session.RefreshToken)
	if err != nil {
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to encrypt refresh token")
	}

	query := `INSERT INTO "Session" (id, userId, refreshToken, expiresAt, createdAt, userAgent, ipAddress)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id, userId, expiresAt, createdAt, userAgent, ipAddress`

	var createdSession model.Session
	err = r.db.QueryRow(ctx, query,
		session.ID, session.UserID, encryptedRefreshToken, session.ExpiresAt, session.CreatedAt, session.UserAgent, session.IPAddress,
	).Scan(
		&createdSession.ID, &createdSession.UserID, &createdSession.ExpiresAt, &createdSession.CreatedAt, &createdSession.UserAgent, &createdSession.IPAddress,
	)
	if err != nil {
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to create session")
	}
	createdSession.RefreshToken = session.RefreshToken // Return original for service logic
	return &createdSession, nil
}

// GetSessionByRefreshToken retrieves a session by its (decrypted) refresh token.
func (r *postgresSessionRepository) GetSessionByRefreshToken(ctx context.Context, refreshToken string) (*model.Session, error) {
	// Note: This approach is inefficient as it requires scanning all encrypted tokens.
	// A more scalable approach would be to hash the refresh token before storing/looking up,
	// or use a secure-by-design token storage like a Redis set of valid tokens.
	// For now, adhering to the "encrypted in DB" spec.

	// In a real high-scale system, refresh tokens are typically:
	// 1. Stored as *hashed* tokens in the DB (like passwords).
	// 2. Stored in Redis with a short TTL, keyed by user ID and session ID.
	// Iterating through all records to decrypt them is a severe performance and security flaw.
	// A practical solution would be to use a Session ID (UUID) in the refresh token itself,
	// and store that Session ID as the primary lookup key. The actual token could be stored
	// encrypted *against that Session ID*.

	// For demonstration purposes, we proceed as if the lookup is by the encrypted value.
	// This requires iterating and decrypting, which is NOT PRODUCTION READY for `refreshToken` as a lookup key.
	// Assuming `refreshToken` is UNIQUE and indexed in the DB as `refreshToken`, but encrypted.

	query := `SELECT id, userId, refreshToken, expiresAt, createdAt, userAgent, ipAddress FROM "Session"`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to query sessions")
	}
	defer rows.Close()

	for rows.Next() {
		var (
			session model.Session
			encryptedToken string
		)
		err := rows.Scan(
			&session.ID, &session.UserID, &encryptedToken, &session.ExpiresAt, &session.CreatedAt, &session.UserAgent, &session.IPAddress,
		)
		if err != nil {
			return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to scan session row")
		}

		decryptedToken, err := util.Decrypt(r.aesKey, encryptedToken)
		if err != nil {
			// Log this error but continue, might be an old corrupted token
			// fmt.Printf("WARN: Failed to decrypt token for session %s: %v\n", session.ID.String(), err)
			continue
		}
		if decryptedToken == refreshToken {
			session.RefreshToken = refreshToken // Attach original for service
			return &session, nil
		}
	}

	if rows.Err() != nil {
		return nil, errors.Wrap(rows.Err(), 500, errors.CodeInternal, "error iterating session rows")
	}

	return nil, errors.NewAPIError(404, errors.CodeNotFound, "session not found", nil)
}

// DeleteSession deletes a session by its ID.
func (r *postgresSessionRepository) DeleteSession(ctx context.Context, sessionID uuid.UUID) error {
	query := `DELETE FROM "Session" WHERE id = $1`
	_, err := r.db.Exec(ctx, query, sessionID)
	if err != nil {
		return errors.Wrap(err, 500, errors.CodeInternal, "failed to delete session")
	}
	return nil
}

// DeleteUserSessions deletes all sessions for a specific user ID.
func (r *postgresSessionRepository) DeleteUserSessions(ctx context.Context, userID uuid.UUID) error {
	query := `DELETE FROM "Session" WHERE userId = $1`
	_, err := r.db.Exec(ctx, query, userID)
	if err != nil {
		return errors.Wrap(err, 500, errors.CodeInternal, "failed to delete user sessions")
	}
	return nil
}
