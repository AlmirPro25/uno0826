
package auth

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"prost-qs/backend/pkg/utils"
)

// RegisterAuthRoutes configura as rotas de autenticação.
func RegisterAuthRoutes(rg *gin.RouterGroup, service *AuthService) {
	authRoutes := rg.Group("/auth")
	{
		authRoutes.POST("/register", register(service))
		authRoutes.POST("/login", login(service))
		authRoutes.POST("/refresh", refresh(service))
		authRoutes.POST("/validate", validateToken(service))
		authRoutes.GET("/validate", validateTokenGet(service))
	}
}

// validateToken godoc
// @Summary Validar token JWT
// @Description Valida um token JWT e retorna as claims. Usado pelo OSPEDAGEM para verificar autorização.
// @Tags Autenticação
// @Accept json
// @Produce json
// @Param token body ValidateRequest true "Token JWT"
// @Success 200 {object} ValidateResponse
// @Failure 401 {object} gin.H{"error": string}
// @Router /auth/validate [post]
func validateToken(service *AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req ValidateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida"})
			return
		}

		claims, err := utils.ParseJWT(req.Token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"valid": false,
				"error": "Token inválido ou expirado",
			})
			return
		}

		c.JSON(http.StatusOK, ValidateResponse{
			Valid:         true,
			UserID:        claims.UserID,
			Role:          claims.Role,
			AccountStatus: claims.AccountStatus,
		})
	}
}

// validateTokenGet godoc
// @Summary Validar token JWT via header
// @Description Valida um token JWT do header Authorization. Usado pelo OSPEDAGEM para verificar autorização.
// @Tags Autenticação
// @Produce json
// @Security BearerAuth
// @Success 200 {object} ValidateResponse
// @Failure 401 {object} gin.H{"error": string}
// @Router /auth/validate [get]
func validateTokenGet(service *AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{
				"valid": false,
				"error": "Token não fornecido",
			})
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := utils.ParseJWT(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"valid": false,
				"error": "Token inválido ou expirado",
			})
			return
		}

		c.JSON(http.StatusOK, ValidateResponse{
			Valid:         true,
			UserID:        claims.UserID,
			Role:          claims.Role,
			AccountStatus: claims.AccountStatus,
		})
	}
}

// register godoc
// @Summary Registrar novo usuário
// @Description Registra um novo usuário no sistema Prost-QS.
// @Tags Autenticação
// @Accept json
// @Produce json
// @Param user body RegisterRequest true "Detalhes do Usuário para Registro"
// @Success 201 {object} RegisterResponse
// @Failure 400 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Router /auth/register [post]
func register(service *AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida: " + err.Error()})
			return
		}

		user, err := service.RegisterUser(req.Username, req.Password, req.Email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao registrar usuário: " + err.Error()})
			return
		}

		c.JSON(http.StatusCreated, RegisterResponse{
			UserID:   user.ID.String(),
			Message: "Usuário registrado com sucesso",
		})
	}
}

// login godoc
// @Summary Autenticar usuário e obter token
// @Description Autentica um usuário existente e retorna tokens de acesso e refresh.
// @Tags Autenticação
// @Accept json
// @Produce json
// @Param credentials body LoginRequest true "Credenciais do Usuário"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} gin.H{"error": string}
// @Failure 401 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Router /auth/login [post]
func login(service *AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida: " + err.Error()})
			return
		}

		token, refreshToken, expiresAt, err := service.LoginUser(req.Username, req.Password, req.ApplicationScope)
		if err != nil {
			log.Printf("Erro de login: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas ou escopo não autorizado"})
			return
		}

		c.JSON(http.StatusOK, LoginResponse{
			Token:        token,
			RefreshToken: refreshToken,
			ExpiresAt:    expiresAt,
		})
	}
}

// refresh godoc
// @Summary Renovar token de acesso
// @Description Usa um refresh token para obter um novo token de acesso.
// @Tags Autenticação
// @Accept json
// @Produce json
// @Param refreshToken body RefreshRequest true "Refresh Token"
// @Success 200 {object} RefreshResponse
// @Failure 400 {object} gin.H{"error": string}
// @Failure 401 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Router /auth/refresh [post]
func refresh(service *AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req RefreshRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida: " + err.Error()})
			return
		}

		newToken, newExpiresAt, err := service.RefreshToken(req.RefreshToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token inválido ou expirado"})
			return
		}

		c.JSON(http.StatusOK, RefreshResponse{
			Token:     newToken,
			ExpiresAt: newExpiresAt,
		})
	}
}

