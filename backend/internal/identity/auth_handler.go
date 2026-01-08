package identity

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"prost-qs/backend/pkg/utils"
)

// ========================================
// AUTH HANDLER - FLUXO DE AUTENTICAÇÃO
// ========================================

// AuthHandler gerencia autenticação
type AuthHandler struct {
	verificationService *VerificationService
	userService         *UserService
}

// NewAuthHandler cria um novo handler
func NewAuthHandler(verificationService *VerificationService, userService *UserService) *AuthHandler {
	return &AuthHandler{
		verificationService: verificationService,
		userService:         userService,
	}
}

// ========================================
// REQUEST/RESPONSE TYPES
// ========================================

// PhoneRequestBody para solicitar OTP
type PhoneRequestBody struct {
	PhoneNumber string `json:"phone_number" binding:"required"`
	Channel     string `json:"channel" binding:"required,oneof=whatsapp sms"`
}

// PhoneVerifyBody para verificar OTP
type PhoneVerifyBody struct {
	VerificationID string `json:"verification_id" binding:"required"`
	Code           string `json:"code" binding:"required,len=6"`
}

// CompleteSignupBody para completar cadastro
type CompleteSignupBody struct {
	Name  string `json:"name" binding:"required,min=2"`
	Email string `json:"email" binding:"required,email"`
}

// AuthResponse resposta de autenticação
type AuthResponse struct {
	Success   bool   `json:"success"`
	Token     string `json:"token,omitempty"`
	UserID    string `json:"user_id,omitempty"`
	IsNewUser bool   `json:"is_new_user"`
	User      *User  `json:"user,omitempty"`
}

// ========================================
// ENDPOINTS
// ========================================

// RequestOTP solicita código OTP
// POST /api/v1/auth/phone/request
func (h *AuthHandler) RequestOTP(c *gin.Context) {
	var req PhoneRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	clientIP := c.ClientIP()

	pending, otp, err := h.verificationService.RequestVerification(req.PhoneNumber, req.Channel, clientIP)
	if err != nil {
		if err == ErrRateLimited {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Muitas tentativas. Aguarde alguns minutos."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao iniciar verificação"})
		return
	}

	// Log para dev
	println("[DEV] OTP para", req.PhoneNumber, ":", otp)

	response := gin.H{
		"verification_id":    pending.VerificationID.String(),
		"expires_in_seconds": OTPExpirationMinutes * 60,
		"channel":            req.Channel,
	}

	// Em dev mode, retornar OTP
	if gin.Mode() != gin.ReleaseMode {
		response["dev_otp"] = otp
	}

	c.JSON(http.StatusOK, response)
}

// VerifyOTP verifica código OTP
// POST /api/v1/auth/phone/verify
func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req PhoneVerifyBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	verificationID, err := uuid.Parse(req.VerificationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de verificação inválido"})
		return
	}

	// Verificar código (não cria identidade ainda, só valida)
	pending, err := h.verificationService.ValidateCode(verificationID, req.Code)
	if err != nil {
		switch err {
		case ErrVerificationNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "Verificação não encontrada"})
		case ErrVerificationExpired:
			c.JSON(http.StatusGone, gin.H{"error": "Código expirado"})
		case ErrInvalidCode:
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Código inválido"})
		case ErrMaxAttemptsReached:
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Máximo de tentativas atingido"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha na verificação"})
		}
		return
	}

	// Verificar se usuário já existe
	existingUser, _ := h.userService.GetUserByPhone(pending.PhoneNumber)

	if existingUser != nil {
		// Usuário existe - fazer login
		if existingUser.Status == UserStatusSuspended {
			c.JSON(http.StatusForbidden, gin.H{"error": "Conta suspensa"})
			return
		}
		if existingUser.Status == UserStatusBanned {
			c.JSON(http.StatusForbidden, gin.H{"error": "Conta banida"})
			return
		}

		// Gerar token com role e status
		token, _, err := utils.GenerateJWT(existingUser.ID.String(), existingUser.Role, existingUser.Status)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao gerar token"})
			return
		}

		// Limpar verificação
		h.verificationService.DeleteVerification(verificationID)

		c.JSON(http.StatusOK, AuthResponse{
			Success:   true,
			Token:     token,
			UserID:    existingUser.ID.String(),
			IsNewUser: false,
			User:      existingUser,
		})
		return
	}

	// Usuário não existe - precisa completar cadastro
	// Salvar telefone verificado temporariamente
	c.JSON(http.StatusOK, gin.H{
		"success":         true,
		"is_new_user":     true,
		"verification_id": req.VerificationID,
		"phone_number":    pending.PhoneNumber,
		"message":         "Telefone verificado. Complete seu cadastro.",
	})
}

// CompleteSignup completa o cadastro de novo usuário
// POST /api/v1/auth/complete-signup
func (h *AuthHandler) CompleteSignup(c *gin.Context) {
	var req CompleteSignupBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	// Pegar verification_id do header ou body
	verificationID := c.GetHeader("X-Verification-ID")
	if verificationID == "" {
		verificationID = c.Query("verification_id")
	}

	if verificationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Verificação não encontrada"})
		return
	}

	vID, err := uuid.Parse(verificationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de verificação inválido"})
		return
	}

	// Buscar verificação pendente
	pending, err := h.verificationService.GetPendingVerification(vID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Verificação expirada ou não encontrada"})
		return
	}

	// Criar usuário
	user, err := h.userService.CreateUser(req.Name, req.Email, pending.PhoneNumber)
	if err != nil {
		if err == ErrEmailAlreadyUsed {
			c.JSON(http.StatusConflict, gin.H{"error": "Email já está em uso"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar conta"})
		return
	}

	// Gerar token com role e status
	token, _, err := utils.GenerateJWT(user.ID.String(), user.Role, user.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao gerar token"})
		return
	}

	// Limpar verificação
	h.verificationService.DeleteVerification(vID)

	c.JSON(http.StatusCreated, AuthResponse{
		Success:   true,
		Token:     token,
		UserID:    user.ID.String(),
		IsNewUser: true,
		User:      user,
	})
}

// GetMe retorna dados do usuário logado
// GET /api/v1/users/me
func (h *AuthHandler) GetMe(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateMe atualiza perfil do usuário logado
// PUT /api/v1/users/me/profile
func (h *AuthHandler) UpdateMe(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Name      string `json:"name"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatar_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile, err := h.userService.UpdateProfile(userID, req.Name, req.Email, req.AvatarURL)
	if err != nil {
		if err == ErrEmailAlreadyUsed {
			c.JSON(http.StatusConflict, gin.H{"error": "Email já está em uso"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao atualizar perfil"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// RegisterAuthRoutes registra as rotas de autenticação
func RegisterAuthRoutes(router *gin.RouterGroup, verificationService *VerificationService, userService *UserService, authMiddleware gin.HandlerFunc) {
	handler := NewAuthHandler(verificationService, userService)

	auth := router.Group("/auth")
	{
		auth.POST("/phone/request", handler.RequestOTP)
		auth.POST("/phone/verify", handler.VerifyOTP)
		auth.POST("/complete-signup", handler.CompleteSignup)
	}

	users := router.Group("/users")
	{
		users.GET("/me", authMiddleware, handler.GetMe)
		users.PUT("/me/profile", authMiddleware, handler.UpdateMe)
	}
}
