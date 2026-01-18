package utils

import (
	"fmt"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/google/uuid"
)

var jwtSecret []byte

// SetJWTSecret define a chave secreta para assinar e verificar tokens JWT.
func SetJWTSecret(secret string) {
	jwtSecret = []byte(secret)
}

// JWTClaims define as claims personalizadas para o JWT.
// FASE 10: Agora carrega role e account_status
// FASE INTEGRAÇÃO: Adicionado aud (audience) para validação de destino
// SEGURANÇA: Adicionado jti (JWT ID) para suporte a revogação
type JWTClaims struct {
	UserID        string `json:"user_id"`
	Role          string `json:"role"`           // user, admin, super_admin
	AccountStatus string `json:"account_status"` // active, suspended, banned
	// Removido Audience explícito pois conflita com StandardClaims em dgrijalva/jwt-go
	// O StandardClaims já tem o campo Audience (json: "aud")
	jwt.StandardClaims
}

// GenerateJWT gera um novo token JWT com role e status.
// FASE 10: Assinatura atualizada para incluir role e status
// FASE INTEGRAÇÃO: Adicionado audience padrão ["ospedagem"]
// SEGURANÇA: Inclui jti único para suporte a revogação
func GenerateJWT(userID, role, accountStatus string) (string, time.Time, error) {
	return GenerateJWTWithAudience(userID, role, accountStatus, []string{"ospedagem"})
}

// GenerateJWTWithAudience gera um novo token JWT com audience específico.
func GenerateJWTWithAudience(userID, role, accountStatus string, audience []string) (string, time.Time, error) {
	if jwtSecret == nil {
		return "", time.Time{}, fmt.Errorf("jwt secret não definido")
	}

	// Defaults
	if role == "" {
		role = "user"
	}
	if accountStatus == "" {
		accountStatus = "active"
	}
	if len(audience) == 0 {
		audience = []string{"ospedagem"}
	}

	now := time.Now()
	expirationTime := now.Add(24 * time.Hour) // Token expira em 24 horas

	// SEGURANÇA: Gerar ID único para o token (jti) para suporte a revogação
	tokenID := uuid.New().String()

	// Join audience into a single string for StandardClaims
	audStr := ""
	if len(audience) > 0 {
		audStr = strings.Join(audience, ",")
	}

	claims := &JWTClaims{
		UserID:        userID,
		Role:          role,
		AccountStatus: accountStatus,
		StandardClaims: jwt.StandardClaims{
			Id:        tokenID, // jti - JWT ID para revogação
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  now.Unix(),
			Issuer:    "prost-qs-kernel",
			Subject:   userID,
			Audience:  audStr,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("falha ao assinar token JWT: %w", err)
	}

	return tokenString, expirationTime, nil
}

// GenerateJWTLegacy mantém compatibilidade com código antigo
// Deprecated: Use GenerateJWT com 3 parâmetros
func GenerateJWTLegacy(userID, applicationScope string) (string, time.Time, error) {
	return GenerateJWT(userID, "user", "active")
}

// ParseJWT parseia e valida um token JWT.
func ParseJWT(tokenString string) (*JWTClaims, error) {
	if jwtSecret == nil {
		return nil, fmt.Errorf("jwt secret não definido")
	}

	claims := &JWTClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Verificar algoritmo
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("algoritmo de assinatura inesperado: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("token JWT inválido: %w", err)
	}
	if !token.Valid {
		return nil, fmt.Errorf("token JWT inválido")
	}

	return claims, nil
}

// RefreshClaims define as claims para o refresh token.
type RefreshClaims struct {
	UserID        string `json:"user_id"`
	Role          string `json:"role"`
	AccountStatus string `json:"account_status"`
	jwt.StandardClaims
}

// GenerateRefreshToken gera um refresh token com um tempo de expiração maior (7 dias).
// SEGURANÇA: Inclui jti único para suporte a revogação
func GenerateRefreshToken(userID, role, accountStatus string) (string, error) {
	if jwtSecret == nil {
		return "", fmt.Errorf("jwt secret não definido")
	}

	if role == "" {
		role = "user"
	}
	if accountStatus == "" {
		accountStatus = "active"
	}

	now := time.Now()
	expirationTime := now.Add(7 * 24 * time.Hour)
	tokenID := uuid.New().String()

	claims := &RefreshClaims{
		UserID:        userID,
		Role:          role,
		AccountStatus: accountStatus,
		StandardClaims: jwt.StandardClaims{
			Id:        tokenID, // jti - JWT ID para revogação
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  now.Unix(),
			Issuer:    "prost-qs-kernel-refresh",
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", fmt.Errorf("falha ao assinar refresh token: %w", err)
	}

	return tokenString, nil
}

// ParseRefreshToken parseia e valida um refresh token.
func ParseRefreshToken(tokenString string) (*RefreshClaims, error) {
	if jwtSecret == nil {
		return nil, fmt.Errorf("jwt secret não definido")
	}

	claims := &RefreshClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Verificar algoritmo
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("algoritmo de assinatura inesperado: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("refresh token inválido: %w", err)
	}
	if !token.Valid {
		return nil, fmt.Errorf("refresh token inválido")
	}

	return claims, nil
}
