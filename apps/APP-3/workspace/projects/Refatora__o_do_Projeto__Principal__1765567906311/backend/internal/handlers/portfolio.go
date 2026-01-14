
// --- backend/internal/handlers/portfolio.go ---
package handlers

import (
	"log"

	"aether-market/internal/database"
	"aether-market/internal/middleware"
	"aether-market/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// SetupPortfolioRoutes configura as rotas para o portfólio do usuário
func SetupPortfolioRoutes(app fiber.Router) {
	portfolioGroup := app.Group("/portfolio")
	// Todas as rotas de portfólio requerem autenticação
	portfolioGroup.Use(middleware.AuthRequired())
	portfolioGroup.Get("/assets", getPortfolioAssetsHandler)
}

// getPortfolioAssetsHandler retorna os ativos no portfólio do usuário autenticado
func getPortfolioAssetsHandler(c *fiber.Ctx) error {
	// Obter ID do usuário do contexto JWT
	userID := c.Locals("userId").(string)

	var portfolio models.Portfolio
	if err := database.DB.Preload("AssetHoldings.AssociatedAssetToken").Where("user_id = ?", userID).First(&portfolio).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Portfólio não encontrado"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao buscar portfólio"})
	}

	// Lógica para calcular o valor atual e retorno total
	var totalValue float64 = 0
	var holdingsResponse []fiber.Map

	for _, holding := range portfolio.AssetHoldings {
		currentValue := holding.Quantity * holding.AssociatedAssetToken.CurrentPrice
		totalValue += currentValue

		holdingsResponse = append(holdingsResponse, fiber.Map{
			"assetId":     holding.AssociatedAssetToken.ID,
			"name":        holding.AssociatedAssetToken.Name,
			"quantity":    holding.Quantity,
			"averageCost": holding.AverageCost,
			"currentValue": currentValue,
			"gainLoss":    currentValue - (holding.Quantity * holding.AverageCost),
		})
	}

	portfolioData := fiber.Map{
		"userId":     userID,
		"totalValue": totalValue,
		"holdings":   holdingsResponse,
	}
	log.Printf("Retornando dados do portfólio para o usuário: %s", userID)
	return c.JSON(portfolioData)
}
