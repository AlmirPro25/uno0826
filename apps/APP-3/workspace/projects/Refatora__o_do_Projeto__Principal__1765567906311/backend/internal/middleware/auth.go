
// --- backend/internal/middleware/auth.go ---
package middleware

import (
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// AuthRequired é um middleware para verificar tokens JWT
func AuthRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Obter o cabeçalho de autorização (Bearer Token)
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token de autenticação ausente"})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Formato de token inválido"})
		}

		tokenString := parts[1]

		// 2. Parsear e validar o token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil {
			log.Printf("Erro de validação de token: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token inválido ou expirado"})
		}

		// 3. Extrair claims do token e injetar no contexto do Fiber
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Injeta ID do usuário no contexto
			c.Locals("userId", claims["userId"])
			c.Locals("email", claims["email"])
			c.Locals("role", claims["role"])
			return c.Next() // Passa para o próximo handler
		}

		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token inválido"})
	}
}
