package auth

/*
================================================================================
MFA HANDLER — ENDPOINTS DE AUTENTICAÇÃO MULTI-FATOR
================================================================================

Endpoints para gerenciamento de MFA:
- POST /auth/mfa/setup - Iniciar setup
- POST /auth/mfa/verify - Verificar e habilitar
- POST /auth/mfa/validate - Validar código no login
- DELETE /auth/mfa - Desabilitar MFA
- POST /auth/mfa/backup-codes - Regenerar backup codes
- GET /auth/mfa/status - Status do MFA

================================================================================
*/

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"prost-qs/backend/internal/events"
	"prost-qs/backend/pkg/middleware"
)

// MFAHandler handler de MFA
type MFAHandler struct {
	mfaService *MFAService
}

// NewMFAHandler cria novo handler
func NewMFAHandler(mfaService *MFAService) *MFAHandler {
	return &MFAHandler{mfaService: mfaService}
}

// SetupMFA inicia setup de MFA
// POST /api/v1/auth/mfa/setup
func (h *MFAHandler) SetupMFA(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserIDKey)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Pegar email do contexto ou request
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email é obrigatório"})
		return
	}

	response, err := h.mfaService.SetupMFA(uid, req.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"setup_id":     response.SetupID,
		"secret":       response.Secret,
		"qr_code_uri":  response.QRCodeURI,
		"backup_codes": response.BackupCodes,
		"message":      "Escaneie o QR code com seu app autenticador e insira o código para confirmar",
	})
}

// VerifyMFA verifica código e habilita MFA
// POST /api/v1/auth/mfa/verify
func (h *MFAHandler) VerifyMFA(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserIDKey)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Code string `json:"code" binding:"required,len=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Código de 6 dígitos é obrigatório"})
		return
	}

	if err := h.mfaService.VerifyAndEnable(uid, req.Code); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Emitir evento de MFA habilitado
	// Nota: appID seria extraído do contexto em produção
	appIDStr := c.GetString(middleware.ContextAppIDKey)
	if appID, err := uuid.Parse(appIDStr); err == nil {
		events.EmitMFAEnabled(appID, uid)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "MFA habilitado com sucesso",
	})
}

// ValidateMFA valida código MFA no login
// POST /api/v1/auth/mfa/validate
func (h *MFAHandler) ValidateMFA(c *gin.Context) {
	var req struct {
		UserID string `json:"user_id" binding:"required"`
		Code   string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id e code são obrigatórios"})
		return
	}

	uid, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	valid, err := h.mfaService.ValidateMFA(uid, req.Code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Código MFA inválido",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"valid":   valid,
	})
}

// DisableMFA desabilita MFA
// DELETE /api/v1/auth/mfa
func (h *MFAHandler) DisableMFA(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserIDKey)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Código é obrigatório para desabilitar MFA"})
		return
	}

	if err := h.mfaService.DisableMFA(uid, req.Code); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Emitir evento de MFA desabilitado
	appIDStr := c.GetString(middleware.ContextAppIDKey)
	if appID, err := uuid.Parse(appIDStr); err == nil {
		events.EmitMFADisabled(appID, uid)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "MFA desabilitado com sucesso",
	})
}

// RegenerateBackupCodes regenera códigos de backup
// POST /api/v1/auth/mfa/backup-codes
func (h *MFAHandler) RegenerateBackupCodes(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserIDKey)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Código é obrigatório"})
		return
	}

	codes, err := h.mfaService.RegenerateBackupCodes(uid, req.Code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"backup_codes": codes,
		"message":      "Novos códigos de backup gerados. Guarde-os em local seguro.",
	})
}

// GetMFAStatus retorna status do MFA
// GET /api/v1/auth/mfa/status
func (h *MFAHandler) GetMFAStatus(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserIDKey)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	status := h.mfaService.GetMFAStatus(uid)
	c.JSON(http.StatusOK, status)
}

// RequireMFA middleware que exige MFA para admins
func RequireMFA(mfaService *MFAService) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString(middleware.ContextUserRoleKey)
		
		// Apenas admins precisam de MFA
		if role != "admin" && role != "super_admin" {
			c.Next()
			return
		}

		userID := c.GetString(middleware.ContextUserIDKey)
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
			c.Abort()
			return
		}

		uid, err := uuid.Parse(userID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			c.Abort()
			return
		}

		// Verificar se MFA está habilitado
		if !mfaService.IsMFAEnabled(uid) {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "MFA obrigatório",
				"message": "Administradores devem habilitar autenticação de dois fatores",
				"code":    "MFA_REQUIRED",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RegisterMFARoutes registra rotas de MFA
func RegisterMFARoutes(router *gin.RouterGroup, mfaService *MFAService, authMiddleware gin.HandlerFunc) {
	handler := NewMFAHandler(mfaService)

	mfa := router.Group("/auth/mfa")
	{
		// Rotas públicas (para validação no login)
		mfa.POST("/validate", handler.ValidateMFA)

		// Rotas autenticadas
		mfa.POST("/setup", authMiddleware, handler.SetupMFA)
		mfa.POST("/verify", authMiddleware, handler.VerifyMFA)
		mfa.DELETE("", authMiddleware, handler.DisableMFA)
		mfa.POST("/backup-codes", authMiddleware, handler.RegenerateBackupCodes)
		mfa.GET("/status", authMiddleware, handler.GetMFAStatus)
	}
}
