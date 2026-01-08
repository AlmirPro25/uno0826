package identity

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"prost-qs/backend/pkg/utils"
)

// ========================================
// IDENTITY KERNEL - HTTP HANDLERS
// Endpoints de verificação OTP
// ========================================

// VerificationHandler gerencia os endpoints de verificação
type VerificationHandler struct {
	service *VerificationService
}

// NewVerificationHandler cria um novo handler
func NewVerificationHandler(service *VerificationService) *VerificationHandler {
	return &VerificationHandler{service: service}
}

// RequestVerificationRequest payload para solicitar verificação
type RequestVerificationRequest struct {
	PhoneNumber string `json:"phone_number" binding:"required"`
	Channel     string `json:"channel" binding:"required,oneof=whatsapp sms"`
}

// RequestVerificationResponse resposta da solicitação
type RequestVerificationResponse struct {
	VerificationID string `json:"verification_id"`
	ExpiresIn      int    `json:"expires_in_seconds"`
	Channel        string `json:"channel"`
	DevOTP         string `json:"dev_otp,omitempty"` // Apenas em dev mode
}

// VerifyCodeRequest payload para verificar código
type VerifyCodeRequest struct {
	VerificationID string `json:"verification_id" binding:"required"`
	Code           string `json:"code" binding:"required,len=6"`
}

// VerifyCodeResponse resposta da verificação
type VerifyCodeResponse struct {
	Success   bool   `json:"success"`
	UserID    string `json:"user_id"`
	SessionID string `json:"session_id"`
	Token     string `json:"token"` // JWT de sessão
	IsNewUser bool   `json:"is_new_user"`
}

// RequestVerification godoc
// @Summary Solicita verificação de telefone
// @Description Inicia o fluxo de verificação OTP via WhatsApp ou SMS
// @Tags Identity
// @Accept json
// @Produce json
// @Param request body RequestVerificationRequest true "Dados da verificação"
// @Success 200 {object} RequestVerificationResponse
// @Failure 400 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Router /identity/verify/request [post]
func (h *VerificationHandler) RequestVerification(c *gin.Context) {
	var req RequestVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	// Get client IP
	clientIP := c.ClientIP()

	// Request verification
	pending, otp, err := h.service.RequestVerification(req.PhoneNumber, req.Channel, clientIP)
	if err != nil {
		if err == ErrRateLimited {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Muitas tentativas. Aguarde alguns minutos."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao iniciar verificação"})
		return
	}

	// TODO: Enviar OTP via canal (WhatsApp/SMS)
	// Por enquanto, logamos para desenvolvimento
	// Em produção, isso vai para o serviço de delivery
	println("[DEV] OTP para", req.PhoneNumber, ":", otp)

	// Em dev mode, retornar OTP na resposta
	devOTP := ""
	if gin.Mode() != gin.ReleaseMode {
		devOTP = otp
	}

	c.JSON(http.StatusOK, RequestVerificationResponse{
		VerificationID: pending.VerificationID.String(),
		ExpiresIn:      OTPExpirationMinutes * 60,
		Channel:        req.Channel,
		DevOTP:         devOTP,
	})
}

// VerifyCode godoc
// @Summary Verifica código OTP
// @Description Valida o código OTP e retorna/cria identidade soberana
// @Tags Identity
// @Accept json
// @Produce json
// @Param request body VerifyCodeRequest true "Código de verificação"
// @Success 200 {object} VerifyCodeResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /identity/verify/confirm [post]
func (h *VerificationHandler) VerifyCode(c *gin.Context) {
	var req VerifyCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	verificationID, err := uuid.Parse(req.VerificationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de verificação inválido"})
		return
	}

	// Verify code
	identity, err := h.service.VerifyCode(verificationID, req.Code)
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

	// Create session
	deviceFingerprint := c.GetHeader("X-Device-Fingerprint")
	if deviceFingerprint == "" {
		deviceFingerprint = c.GetHeader("User-Agent")
	}

	session, err := h.service.CreateSession(identity.UserID, deviceFingerprint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar sessão"})
		return
	}

	// Gerar JWT com role e status (legacy flow usa defaults)
	token, _, err := utils.GenerateJWT(identity.UserID.String(), "user", "active")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao gerar token"})
		return
	}

	c.JSON(http.StatusOK, VerifyCodeResponse{
		Success:   true,
		UserID:    identity.UserID.String(),
		SessionID: session.SessionID.String(),
		Token:     token,
		IsNewUser: identity.CreatedAt.Equal(identity.UpdatedAt),
	})
}

// GetIdentity godoc
// @Summary Busca identidade do usuário autenticado
// @Tags Identity
// @Produce json
// @Success 200 {object} SovereignIdentity
// @Router /identity/me [get]
func (h *VerificationHandler) GetIdentity(c *gin.Context) {
	// TODO: Extrair user_id do JWT/session
	userIDStr := c.GetString("userId")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	identity, err := h.service.GetIdentityByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Identidade não encontrada"})
		return
	}

	c.JSON(http.StatusOK, identity)
}

// RegisterVerificationRoutes registra as rotas de verificação
func RegisterVerificationRoutes(router *gin.RouterGroup, service *VerificationService) {
	handler := NewVerificationHandler(service)

	verify := router.Group("/identity/verify")
	{
		verify.POST("/request", handler.RequestVerification)
		verify.POST("/confirm", handler.VerifyCode)
	}
}
