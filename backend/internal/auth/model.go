
package auth

import "time"

// RegisterRequest representa a estrutura da requisição para registro de usuário.
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
}

// RegisterResponse representa a estrutura da resposta para registro de usuário.
type RegisterResponse struct {
	UserID   string `json:"userId"`
	Message string `json:"message"`
}

// LoginRequest representa a estrutura da requisição para login.
type LoginRequest struct {
	Username       string `json:"username" binding:"required"`
	Password       string `json:"password" binding:"required"`
	ApplicationScope string `json:"applicationScope"` // Escopo da aplicação, e.g., "frontend-app", "admin-panel"
}

// LoginResponse representa a estrutura da resposta para login.
type LoginResponse struct {
	Token        string    `json:"token"`
	RefreshToken string    `json:"refreshToken"`
	ExpiresAt    time.Time `json:"expiresAt"`
}

// RefreshRequest representa a estrutura da requisição para renovar token.
type RefreshRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

// RefreshResponse representa a estrutura da resposta para renovar token.
type RefreshResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expiresAt"`
}


// ValidateRequest representa a estrutura da requisição para validar token.
// Usado pelo OSPEDAGEM para verificar se um token é válido.
type ValidateRequest struct {
	Token string `json:"token" binding:"required"`
}

// ValidateResponse representa a estrutura da resposta para validação de token.
// Retorna as claims do token se válido.
type ValidateResponse struct {
	Valid         bool   `json:"valid"`
	UserID        string `json:"user_id,omitempty"`
	Role          string `json:"role,omitempty"`
	AccountStatus string `json:"account_status,omitempty"`
}
