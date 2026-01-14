package controllers

import (
	"medisync-platform/backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

// PasswordResetController handles password reset requests.
type PasswordResetController struct {
	resetService *services.PasswordResetService
}

// NewPasswordResetController creates a new controller instance.
func NewPasswordResetController(svc *services.PasswordResetService) *PasswordResetController {
	return &PasswordResetController{resetService: svc}
}

// ForgotPasswordRequest represents the request body.
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ForgotPassword handles POST /auth/forgot-password
func (ctrl *PasswordResetController) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email inválido"})
		return
	}

	// Always return success to prevent email enumeration
	ctrl.resetService.RequestPasswordReset(c.Request.Context(), req.Email)

	c.JSON(http.StatusOK, gin.H{
		"message": "Se o email existir em nossa base, você receberá instruções para redefinir sua senha.",
	})
}

// ResetPasswordRequest represents the request body.
type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=6"`
}

// ResetPassword handles POST /auth/reset-password
func (ctrl *PasswordResetController) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	err := ctrl.resetService.ResetPassword(c.Request.Context(), req.Token, req.NewPassword)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Senha alterada com sucesso!"})
}

// ValidateTokenRequest represents the request body.
type ValidateTokenRequest struct {
	Token string `json:"token" binding:"required"`
}

// ValidateToken handles POST /auth/validate-reset-token
func (ctrl *PasswordResetController) ValidateToken(c *gin.Context) {
	var req ValidateTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token inválido"})
		return
	}

	valid, err := ctrl.resetService.ValidateToken(c.Request.Context(), req.Token)
	if err != nil || !valid {
		c.JSON(http.StatusBadRequest, gin.H{"valid": false, "error": "Token inválido ou expirado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"valid": true})
}
