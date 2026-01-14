package controllers

import (
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"net/http"

	"github.com/gin-gonic/gin"
)

// AuthController handles API requests related to user authentication.
type AuthController struct {
	authService ports.AuthService
}

// NewAuthController creates a new instance of AuthController.
func NewAuthController(authService ports.AuthService) *AuthController {
	return &AuthController{authService: authService}
}

// LoginRequest defines the request body for user login.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Login authenticates a user and returns JWT tokens (access + refresh).
func (ctrl *AuthController) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data", "details": err.Error()})
		return
	}

	token, role, err := ctrl.authService.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials", "details": err.Error()})
		return
	}

	// Get refresh token if available
	refreshToken, _ := ctrl.authService.GetRefreshToken(c.Request.Context(), req.Email, req.Password)

	response := gin.H{"token": token, "role": role}
	if refreshToken != "" {
		response["refreshToken"] = refreshToken
	}

	c.JSON(http.StatusOK, response)
}

// RefreshTokenRequest defines the request body for token refresh.
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

// RefreshToken generates a new access token using a valid refresh token.
func (ctrl *AuthController) RefreshToken(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data"})
		return
	}

	newToken, err := ctrl.authService.RefreshAccessToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": newToken})
}

// RegisterRequest defines the request body for patient registration.
type RegisterRequest struct {
	FullName string `json:"fullName" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Phone    string `json:"phone" binding:"required"`
}

// RegisterPatient creates a new patient user account.
func (ctrl *AuthController) RegisterPatient(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data", "details": err.Error()})
		return
	}

	patient := &domain.User{
		FullName: req.FullName,
		Email:    req.Email,
		Phone:    &req.Phone,
	}

	// Assuming password is in domain.User temporarily or passed separately.
	// The core user domain model has PasswordHash. We need to pass the raw password somewhere if not in the model.
	// In this implementation, the AuthService.RegisterPatient will handle hashing.
	// We'll set PasswordHash to the raw password here for transport to service (not ideal but fits the interface).
	patient.PasswordHash = req.Password

	createdUser, err := ctrl.authService.RegisterPatient(c.Request.Context(), patient)
	if err != nil {
		if err.Error() == "email already registered" {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, toUserResponse(createdUser))
}

// GetMe returns the current authenticated user's data.
func (ctrl *AuthController) GetMe(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := ctrl.authService.GetUserByID(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, toUserResponse(user))
}

// LogoutAllDevices invalidates all tokens for the current user.
func (ctrl *AuthController) LogoutAllDevices(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	err := ctrl.authService.LogoutAllDevices(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out from all devices successfully"})
}

// ChangePasswordRequest defines the request body for password change.
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
	LogoutAll       bool   `json:"logoutAll"`
}

// ChangePassword changes the user's password.
func (ctrl *AuthController) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data", "details": err.Error()})
		return
	}

	err := ctrl.authService.ChangePassword(c.Request.Context(), userID.(int), req.CurrentPassword, req.NewPassword, req.LogoutAll)
	if err != nil {
		if err.Error() == "current password is incorrect" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}
