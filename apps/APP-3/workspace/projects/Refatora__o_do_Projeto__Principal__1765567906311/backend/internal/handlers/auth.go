
// --- backend/internal/handlers/auth.go ---
package handlers

import (
	"log"
	"os"
	"time"

	"aether-market/internal/database"
	"aether-market/internal/models"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Estrutura de request para registro de usuário
type registerInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// Estrutura de request para login de usuário
type loginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// SetupAuthRoutes configura as rotas de autenticação
func SetupAuthRoutes(app fiber.Router) {
	app.Post("/auth/register", registerHandler)
	app.Post("/auth/login", loginHandler)
}

// registerHandler lida com o registro de novos usuários
func registerHandler(c *fiber.Ctx) error {
	var input registerInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "JSON inválido"})
	}

	validate := validator.New()
	if err := validate.Struct(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Verificar se o usuário já existe
	var existingUser models.User
	if err := database.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Usuário com este email já existe"})
	}

	// Hash da senha
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao processar senha"})
	}

	// Criar novo usuário
	user := models.User{
		Email:    input.Email,
		Password: string(hashedPassword),
		Role:     "investor",
		Balance:  10000.00, // Saldo inicial para simulação de transações
	}

	// Iniciar transação de banco de dados
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao criar usuário"})
	}

	// Criar portfólio para o novo usuário
	portfolio := models.Portfolio{UserID: user.ID}
	if err := tx.Create(&portfolio).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao criar portfólio do usuário"})
	}

	// Finalizar transação
	tx.Commit()

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Registro bem-sucedido"})
}

// loginHandler lida com a autenticação de usuários e geração de JWT
func loginHandler(c *fiber.Ctx) error {
	var input loginInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "JSON inválido"})
	}

	// Validação de entrada
	validate := validator.New()
	if err := validate.Struct(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Buscar usuário no banco
	var user models.User
	if err := database.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Email ou senha inválidos"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao buscar usuário"})
	}

	// Comparar senha
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Email ou senha inválidos"})
	}

	// Gerar token JWT
	claims := jwt.MapClaims{
		"userId": user.ID.String(),
		"email":  user.Email,
		"role":   user.Role,
		"exp":    time.Now().Add(time.Hour * 72).Unix(), // Token expira em 72 horas
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao gerar token"})
	}

	return c.JSON(fiber.Map{"token": tokenString, "user": fiber.Map{"email": user.Email, "role": user.Role}})
}
