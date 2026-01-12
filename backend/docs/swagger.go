// Package docs PROST-QS Kernel API Documentation
//
// O PROST-QS é um Kernel de Plataforma Soberano que oferece:
// - Identity: Autenticação, verificação, SSO multi-app
// - Billing: Stripe, planos, assinaturas, cobrança por uso
// - Governance: Políticas, aprovações, auditoria, kill switch
// - Observability: Métricas RED, SLO/SLI, alertas inteligentes
// - Immunity: Auto-defesa, circuit breakers, quarentena
//
// Schemes: https
// Host: api.prostqs.com
// BasePath: /api/v1
// Version: 1.0.0
// License: Proprietary
// Contact: tech@prostqs.com
//
// Consumes:
// - application/json
//
// Produces:
// - application/json
//
// SecurityDefinitions:
//   Bearer:
//     type: apiKey
//     name: Authorization
//     in: header
//     description: JWT token no formato "Bearer {token}"
//   AppKey:
//     type: apiKey
//     name: X-App-Key
//     in: header
//     description: Chave da aplicação
//   AppSecret:
//     type: apiKey
//     name: X-App-Secret
//     in: header
//     description: Secret da aplicação
//
// swagger:meta
package docs

// ========================================
// COMMON RESPONSE TYPES
// ========================================

// ErrorResponse representa uma resposta de erro
// swagger:response ErrorResponse
type ErrorResponse struct {
	// in: body
	Body struct {
		// Mensagem de erro
		// example: Não autorizado
		Error string `json:"error"`
		// Código do erro (opcional)
		// example: UNAUTHORIZED
		Code string `json:"code,omitempty"`
	}
}

// SuccessResponse representa uma resposta de sucesso genérica
// swagger:response SuccessResponse
type SuccessResponse struct {
	// in: body
	Body struct {
		// Mensagem de sucesso
		// example: Operação realizada com sucesso
		Message string `json:"message"`
	}
}

// ========================================
// IDENTITY TYPES
// ========================================

// UserProfile representa o perfil de um usuário
// swagger:model UserProfile
type UserProfile struct {
	// ID único do usuário
	// example: 550e8400-e29b-41d4-a716-446655440000
	ID string `json:"id"`
	// Email do usuário
	// example: user@example.com
	Email string `json:"email"`
	// Nome do usuário
	// example: João Silva
	Name string `json:"name,omitempty"`
	// Telefone do usuário
	// example: +5511999999999
	Phone string `json:"phone,omitempty"`
	// Role do usuário
	// example: user
	Role string `json:"role"`
	// Data de criação
	// example: 2026-01-11T10:00:00Z
	CreatedAt string `json:"created_at"`
}

// LoginRequest representa uma requisição de login
// swagger:model LoginRequest
type LoginRequest struct {
	// Email do usuário
	// required: true
	// example: user@example.com
	Email string `json:"email"`
	// ID da aplicação
	// required: true
	// example: 550e8400-e29b-41d4-a716-446655440000
	AppID string `json:"app_id"`
}

// LoginResponse representa a resposta de login
// swagger:model LoginResponse
type LoginResponse struct {
	// JWT access token
	// example: eyJhbGciOiJIUzI1NiIs...
	AccessToken string `json:"access_token"`
	// Refresh token
	// example: eyJhbGciOiJIUzI1NiIs...
	RefreshToken string `json:"refresh_token"`
	// Tempo de expiração em segundos
	// example: 3600
	ExpiresIn int `json:"expires_in"`
	// Tipo do token
	// example: Bearer
	TokenType string `json:"token_type"`
	// Dados do usuário
	User UserProfile `json:"user"`
}

// VerificationRequest representa uma requisição de verificação
// swagger:model VerificationRequest
type VerificationRequest struct {
	// Email para verificação
	// required: true
	// example: user@example.com
	Email string `json:"email"`
	// ID da aplicação
	// required: true
	// example: 550e8400-e29b-41d4-a716-446655440000
	AppID string `json:"app_id"`
}

// VerificationConfirmRequest representa confirmação de código
// swagger:model VerificationConfirmRequest
type VerificationConfirmRequest struct {
	// ID da verificação
	// required: true
	// example: 550e8400-e29b-41d4-a716-446655440000
	VerificationID string `json:"verification_id"`
	// Código de 6 dígitos
	// required: true
	// example: 123456
	Code string `json:"code"`
}

// ========================================
// BILLING TYPES
// ========================================

// Plan representa um plano de assinatura
// swagger:model Plan
type Plan struct {
	// ID do plano
	// example: pro
	ID string `json:"id"`
	// Nome do plano
	// example: Pro
	Name string `json:"name"`
	// Preço em centavos
	// example: 2900
	Price int64 `json:"price"`
	// Moeda
	// example: brl
	Currency string `json:"currency"`
	// Intervalo de cobrança
	// example: month
	Interval string `json:"interval"`
	// Features incluídas
	Features []string `json:"features"`
}

// Subscription representa uma assinatura
// swagger:model Subscription
type Subscription struct {
	// ID da assinatura
	// example: 550e8400-e29b-41d4-a716-446655440000
	ID string `json:"id"`
	// ID do plano
	// example: pro
	PlanID string `json:"plan_id"`
	// Status da assinatura
	// example: active
	Status string `json:"status"`
	// Fim do período atual
	// example: 2026-02-11T10:00:00Z
	CurrentPeriodEnd string `json:"current_period_end"`
}

// CheckoutRequest representa uma requisição de checkout
// swagger:model CheckoutRequest
type CheckoutRequest struct {
	// ID do plano
	// required: true
	// example: pro
	PlanID string `json:"plan_id"`
	// URL de sucesso
	// required: true
	// example: https://app.example.com/success
	SuccessURL string `json:"success_url"`
	// URL de cancelamento
	// required: true
	// example: https://app.example.com/cancel
	CancelURL string `json:"cancel_url"`
}

// CheckoutResponse representa a resposta de checkout
// swagger:model CheckoutResponse
type CheckoutResponse struct {
	// URL do checkout Stripe
	// example: https://checkout.stripe.com/pay/cs_...
	CheckoutURL string `json:"checkout_url"`
	// ID da sessão
	// example: cs_test_...
	SessionID string `json:"session_id"`
}

// ========================================
// INVARIANTS TYPES
// ========================================

// Violation representa uma violação de invariante
// swagger:model Violation
type Violation struct {
	// Nome do invariante violado
	// example: BILLING_BALANCE_NEVER_NEGATIVE
	Invariant string `json:"invariant"`
	// Severidade
	// example: CRITICAL
	Severity string `json:"severity"`
	// Mensagem descritiva
	// example: Saldo negativo detectado: -100
	Message string `json:"message"`
	// Contexto adicional
	Context map[string]interface{} `json:"context,omitempty"`
	// Timestamp
	// example: 2026-01-11T10:00:00Z
	Timestamp string `json:"timestamp"`
}

// InvariantStats representa estatísticas de invariantes
// swagger:model InvariantStats
type InvariantStats struct {
	// Total de violações
	// example: 5
	Total int `json:"total"`
	// Por severidade
	BySeverity map[string]int `json:"by_severity"`
	// Por invariante
	ByInvariant map[string]int `json:"by_invariant"`
	// Sistema habilitado
	// example: true
	Enabled bool `json:"enabled"`
}

// ========================================
// IMMUNITY TYPES
// ========================================

// ImmunityHealth representa a saúde do sistema imunológico
// swagger:model ImmunityHealth
type ImmunityHealth struct {
	// Status geral
	// example: healthy
	Status string `json:"status"`
	// Score de saúde (0-100)
	// example: 95
	Score int `json:"score"`
	// Circuit breakers abertos
	// example: 0
	OpenCircuits int `json:"open_circuits"`
	// Quarentenas ativas
	// example: 2
	ActiveQuarantines int `json:"active_quarantines"`
	// Alertas ativos
	// example: 1
	ActiveAlerts int `json:"active_alerts"`
	// Total de ameaças bloqueadas
	// example: 150
	TotalThreats int `json:"total_threats"`
}

// Threat representa uma ameaça bloqueada
// swagger:model Threat
type Threat struct {
	// IP ou identificador da fonte
	// example: 192.168.1.100
	Source string `json:"source"`
	// Tipo de ameaça
	// example: sql_injection
	Type string `json:"type"`
	// Quando expira o bloqueio
	// example: 2026-01-11T11:00:00Z
	ExpiresAt string `json:"expires_at"`
	// Motivo do bloqueio
	// example: Múltiplas tentativas de SQL injection
	Reason string `json:"reason"`
}

// CircuitBreaker representa o estado de um circuit breaker
// swagger:model CircuitBreaker
type CircuitBreaker struct {
	// Nome do circuit
	// example: payment_service
	Name string `json:"name"`
	// Estado atual
	// example: closed
	State string `json:"state"`
	// Falhas consecutivas
	// example: 0
	Failures int `json:"failures"`
	// Última falha
	// example: 2026-01-11T09:30:00Z
	LastFailure string `json:"last_failure,omitempty"`
}
