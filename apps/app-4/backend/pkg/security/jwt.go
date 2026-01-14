package security

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Token type constants
const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"
)

// Claims defines the payload of our JWT token.
type Claims struct {
	UserID    int    `json:"userId"`
	Role      string `json:"role"`
	TokenType string `json:"tokenType,omitempty"`
	jwt.RegisteredClaims
}

// TokenPair contains both access and refresh tokens
type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int64  `json:"expiresIn"` // Access token expiration in seconds
}

// GenerateJWT creates a new JWT token with user information and expiration time.
func GenerateJWT(userID int, role string, secret string, expiration time.Duration) (string, error) {
	claims := Claims{
		UserID:    userID,
		Role:      role,
		TokenType: TokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", errors.New("failed to sign token")
	}

	return tokenString, nil
}

// GenerateRefreshToken creates a refresh token with longer expiration
func GenerateRefreshToken(userID int, role string, secret string) (string, error) {
	// Refresh token expires in 7 days
	expiration := 7 * 24 * time.Hour

	claims := Claims{
		UserID:    userID,
		Role:      role,
		TokenType: TokenTypeRefresh,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", errors.New("failed to sign refresh token")
	}

	return tokenString, nil
}

// GenerateTokenPair creates both access and refresh tokens
func GenerateTokenPair(userID int, role string, secret string, accessExpiration time.Duration) (*TokenPair, error) {
	accessToken, err := GenerateJWT(userID, role, secret, accessExpiration)
	if err != nil {
		return nil, err
	}

	refreshToken, err := GenerateRefreshToken(userID, role, secret)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(accessExpiration.Seconds()),
	}, nil
}

// ValidateJWT parses and validates a JWT token.
func ValidateJWT(tokenString string, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}
