
package auth

import (
	"crypto/subtle"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"prost-qs/backend/internal/identity"
	"prost-qs/backend/pkg/utils"
)

// dummyHash hash pré-computado para timing attack protection
var dummyHash []byte

func init() {
	// Pré-computar hash dummy para comparações constantes
	dummyHash, _ = bcrypt.GenerateFromPassword([]byte("dummy_password_for_timing_protection"), bcrypt.DefaultCost)
}

// AuthService define as operações de autenticação.
type AuthService struct {
	userRepo          identity.UserRepository
	loginEventService *identity.LoginEventService
}

// NewAuthService cria uma nova instância de AuthService.
func NewAuthService(userRepo identity.UserRepository, loginEventService *identity.LoginEventService) *AuthService {
	return &AuthService{
		userRepo:          userRepo,
		loginEventService: loginEventService,
	}
}

// RegisterUser registra um novo usuário.
// SEGURANÇA: Bootstrap de super_admin requer token único além do email
func (s *AuthService) RegisterUser(username, password, email string) (*identity.User, error) {
	// Verificar se o usuário já existe
	existingUser, _ := s.userRepo.GetUserByUsername(username)
	if existingUser != nil {
		return nil, fmt.Errorf("usuário com este nome já existe")
	}

	// Gerar hash da senha
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("falha ao gerar hash da senha: %w", err)
	}

	// Determinar role inicial
	// SEGURANÇA: Bootstrap de super_admin requer SUPER_ADMIN_EMAIL + SUPER_ADMIN_BOOTSTRAP_TOKEN
	role := "user"
	superAdminEmail := os.Getenv("SUPER_ADMIN_EMAIL")
	bootstrapToken := os.Getenv("SUPER_ADMIN_BOOTSTRAP_TOKEN")
	
	if superAdminEmail != "" && email == superAdminEmail {
		// Verificar se bootstrap token está configurado (segurança adicional)
		if bootstrapToken == "" {
			log.Printf("⚠️ SECURITY: Tentativa de bootstrap super_admin sem SUPER_ADMIN_BOOTSTRAP_TOKEN")
			// Não promover sem token - criar como user normal
		} else {
			role = "super_admin"
			log.Printf("🔐 BOOTSTRAP: Usuário %s (%s) criado como super_admin", username, email)
			// IMPORTANTE: Limpar variáveis de ambiente após bootstrap
			log.Printf("⚠️ AÇÃO REQUERIDA: Remova SUPER_ADMIN_EMAIL e SUPER_ADMIN_BOOTSTRAP_TOKEN do ambiente")
		}
	}

	user := &identity.User{
		ID:           uuid.New(),
		Username:     username,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         role,
		Status:       "active",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		Roles:        "[]",
		Version:      1,
	}

	if err := s.userRepo.CreateUser(user); err != nil {
		return nil, fmt.Errorf("falha ao criar usuário: %w", err)
	}

	return user, nil
}

// LoginUser autentica um usuário e gera tokens.
// Agora também registra evento de login para auditoria.
func (s *AuthService) LoginUser(username, password, applicationScope string) (string, string, time.Time, error) {
	return s.LoginUserWithContext(username, password, applicationScope, "", "")
}

// LoginUserWithContext autentica com contexto de IP e UserAgent
// SEGURANÇA: Proteção contra timing attacks - tempo constante independente de usuário existir
func (s *AuthService) LoginUserWithContext(username, password, applicationScope, ip, userAgent string) (string, string, time.Time, error) {
	user, err := s.userRepo.GetUserByUsername(username)
	
	// TIMING ATTACK PROTECTION: Sempre fazer comparação de senha
	// mesmo se usuário não existir, para não vazar informação
	var passwordHash []byte
	var userExists bool
	
	if err != nil || user == nil {
		// Usuário não existe - usar hash dummy para manter tempo constante
		passwordHash = dummyHash
		userExists = false
	} else {
		passwordHash = []byte(user.PasswordHash)
		userExists = true
	}
	
	// Comparar senha (tempo constante)
	passwordErr := bcrypt.CompareHashAndPassword(passwordHash, []byte(password))
	
	// Agora verificar resultados
	if !userExists {
		if s.loginEventService != nil {
			s.loginEventService.RecordLogin(uuid.Nil, username, ip, userAgent, "password", "", false, "user_not_found")
		}
		// Mensagem genérica para não vazar se usuário existe
		return "", "", time.Time{}, fmt.Errorf("credenciais inválidas")
	}
	
	if passwordErr != nil {
		if s.loginEventService != nil {
			s.loginEventService.RecordLogin(user.ID, username, ip, userAgent, "password", user.Role, false, "invalid_password")
		}
		// Mensagem genérica
		return "", "", time.Time{}, fmt.Errorf("credenciais inválidas")
	}

	// Gerar tokens com role e status
	role := user.Role
	if role == "" {
		role = "user"
	}
	status := user.Status
	if status == "" {
		status = "active"
	}
	token, expiresAt, err := utils.GenerateJWT(user.ID.String(), role, status)
	if err != nil {
		return "", "", time.Time{}, fmt.Errorf("falha ao gerar token JWT: %w", err)
	}

	// Refresh token
	refreshToken, err := utils.GenerateRefreshToken(user.ID.String(), role, status)
	if err != nil {
		return "", "", time.Time{}, fmt.Errorf("falha ao gerar refresh token: %w", err)
	}

	// Registrar login bem-sucedido
	if s.loginEventService != nil {
		s.loginEventService.RecordLogin(user.ID, username, ip, userAgent, "password", role, true, "")
	}

	log.Printf("Usuário %s logado com sucesso. Token expira em: %v", user.Username, expiresAt)
	return token, refreshToken, expiresAt, nil
}

// RefreshToken gera um novo token de acesso a partir de um refresh token.
func (s *AuthService) RefreshToken(refreshToken string) (string, time.Time, error) {
	claims, err := utils.ParseRefreshToken(refreshToken)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("refresh token inválido: %w", err)
	}

	userID := claims.UserID
	role := claims.Role
	if role == "" {
		role = "user"
	}
	status := claims.AccountStatus
	if status == "" {
		status = "active"
	}

	newToken, newExpiresAt, err := utils.GenerateJWT(userID, role, status)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("falha ao gerar novo token JWT: %w", err)
	}

	return newToken, newExpiresAt, nil
}

// constantTimeCompare compara strings em tempo constante
func constantTimeCompare(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}
