package controllers

import (
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// UserController handles API requests related to user management (CRUD).
type UserController struct {
	userService ports.UserService
}

// NewUserController creates a new instance of UserController.
func NewUserController(userService ports.UserService) *UserController {
	return &UserController{userService: userService}
}

// CreateUserRequest defines the request body for creating a new user (admin/medico/paciente).
type CreateUserRequest struct {
	FullName string `json:"fullName" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Phone    string `json:"phone"`
	Role     string `json:"role" binding:"required,oneof=MEDICO ADMIN PACIENTE"`
}

// CreateUser creates a new user with a specified role (ADMIN or MEDICO).
func (ctrl *UserController) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data", "details": err.Error()})
		return
	}

	user := &domain.User{
		FullName:     req.FullName,
		Email:        req.Email,
		Phone:        &req.Phone,
		Role:         domain.Role{Name: req.Role}, // Simplified role passing
		PasswordHash: req.Password,
	}

	createdUser, err := ctrl.userService.CreateUser(c.Request.Context(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, toUserResponse(createdUser))
}

// ListUsers queries and returns a list of users based on parameters.
func (ctrl *UserController) ListUsers(c *gin.Context) {
	roleQuery := c.Query("role")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	users, err := ctrl.userService.ListUsers(c.Request.Context(), roleQuery, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users", "details": err.Error()})
		return
	}

	// Convert users to response DTOs
	userResponses := make([]UserResponse, len(users))
	for i, user := range users {
		userResponses[i] = toUserResponse(&user)
	}

	c.JSON(http.StatusOK, userResponses)
}

// UpdateUserRequest defines the request body for updating a user.
type UpdateUserRequest struct {
	FullName  string `json:"fullName"`
	Email     string `json:"email" binding:"omitempty,email"`
	Phone     string `json:"phone"`
	Specialty string `json:"specialty"`
	CRM       string `json:"crm"`
	IsActive  bool   `json:"isActive"`
}

// UpdateUser updates details of a specific user.
func (ctrl *UserController) UpdateUser(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data", "details": err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.FullName != "" {
		updates["full_name"] = req.FullName
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.Phone != "" {
		updates["phone"] = &req.Phone
	}
	if req.Specialty != "" {
		updates["specialty"] = &req.Specialty
	}
	if req.CRM != "" {
		updates["crm"] = &req.CRM
	}
	// Note: isActive field from request is used only if present in updates logic.
	updates["is_active"] = req.IsActive

	updatedUser, err := ctrl.userService.UpdateUser(c.Request.Context(), userID, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, toUserResponse(updatedUser))
}

// GetUser retrieves a user by ID.
func (ctrl *UserController) GetUser(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := ctrl.userService.GetUser(c.Request.Context(), userID)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, toUserResponse(user))
}

// DeleteUser deletes a user by ID.
func (ctrl *UserController) DeleteUser(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	err = ctrl.userService.DeleteUser(c.Request.Context(), userID)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// ListDoctors returns a list of doctors (public endpoint for patients to choose).
func (ctrl *UserController) ListDoctors(c *gin.Context) {
	// Get all doctors
	users, err := ctrl.userService.ListUsers(c.Request.Context(), domain.RoleMedico, 1, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch doctors", "details": err.Error()})
		return
	}

	// Convert to response DTOs
	doctorResponses := make([]UserResponse, len(users))
	for i, user := range users {
		doctorResponses[i] = toUserResponse(&user)
	}

	c.JSON(http.StatusOK, doctorResponses)
}

// SearchUsers searches for users by name or email (for doctors to find patients).
func (ctrl *UserController) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	roleFilter := c.Query("role")

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	// Default to searching patients if no role specified
	if roleFilter == "" {
		roleFilter = domain.RolePaciente
	}

	// Get users by role
	users, err := ctrl.userService.ListUsers(c.Request.Context(), roleFilter, 1, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}

	// Filter by search query (case-insensitive)
	var results []UserResponse
	queryLower := strings.ToLower(query)
	for _, user := range users {
		if strings.Contains(strings.ToLower(user.FullName), queryLower) ||
			strings.Contains(strings.ToLower(user.Email), queryLower) {
			results = append(results, toUserResponse(&user))
		}
	}

	if results == nil {
		results = []UserResponse{}
	}

	c.JSON(http.StatusOK, results)
}

// DeleteMyAccountRequest defines the request body for deleting own account.
type DeleteMyAccountRequest struct {
	Password string `json:"password" binding:"required"`
	Reason   string `json:"reason"`
}

// DeleteMyAccount allows a user to delete their own account after password confirmation.
func (ctrl *UserController) DeleteMyAccount(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req DeleteMyAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password is required to delete account"})
		return
	}

	// Verify password before deletion
	user, err := ctrl.userService.GetUser(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Verify password using bcrypt
	if err := verifyPassword(user.PasswordHash, req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
		return
	}

	// Delete the user
	err = ctrl.userService.DeleteUser(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Account deleted successfully"})
}

// verifyPassword compares a hashed password with a plain text password.
func verifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}
