
package middleware

import (
	"context"
	"net/http"
	"strings"

	"ai-web-weaver/backend/internal/auth"
	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/pkg/errors"
	"ai-web-weaver/backend/pkg/logger"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

// contextKey defines a type for context keys to avoid collisions.
type contextKey string

const (
	contextKeyUserID contextKey = "userID"
	contextKeyUserRole contextKey = "userRole"
)

// AuthMiddleware validates the JWT access token from the Authorization header.
func AuthMiddleware(jwtSecret string, authService auth.AuthService, log *logger.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				apiErr := errors.NewAPIError(http.StatusUnauthorized, errors.CodeUnauthorized, "authorization header missing", nil)
				http.Error(w, apiErr.Error(), apiErr.StatusCode)
				return
			}

			headerParts := strings.Split(authHeader, " ")
			if len(headerParts) != 2 || strings.ToLower(headerParts[0]) != "bearer" {
				apiErr := errors.NewAPIError(http.StatusUnauthorized, errors.CodeUnauthorized, "invalid authorization header format", nil)
				http.Error(w, apiErr.Error(), apiErr.StatusCode)
				return
			}

			accessToken := headerParts[1]
			claims, err := authService.ValidateAccessToken(accessToken)
			if err != nil {
				apiErr := errors.FromError(err)
				log.Debug("Access token validation failed", zap.Error(apiErr.Err))
				http.Error(w, apiErr.Error(), apiErr.StatusCode)
				return
			}

			// Add user ID and role to context
			ctx := context.WithValue(r.Context(), contextKeyUserID, claims.UserID)
			ctx = context.WithValue(ctx, contextKeyUserRole, claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserIDFromContext retrieves the user ID from the request context.
func GetUserIDFromContext(ctx context.Context) (uuid.UUID, error) {
	userID, ok := ctx.Value(contextKeyUserID).(uuid.UUID)
	if !ok {
		return uuid.Nil, errors.NewAPIError(http.StatusUnauthorized, errors.CodeUnauthorized, "user ID not found in context", nil)
	}
	return userID, nil
}

// GetUserRoleFromContext retrieves the user role from the request context.
func GetUserRoleFromContext(ctx context.Context) (model.UserRole, error) {
	userRole, ok := ctx.Value(contextKeyUserRole).(model.UserRole)
	if !ok {
		return "", errors.NewAPIError(http.StatusUnauthorized, errors.CodeUnauthorized, "user role not found in context", nil)
	}
	return userRole, nil
}
