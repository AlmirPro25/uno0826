
// --- backend/internal/handlers/dashboard.go ---
package handlers

import (
	"log"
	"math/rand"
	"time"

	"aether-market/internal/database"
	"aether-market/internal/middleware"
	"aether-market/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// SetupDashboardRoutes configura as rotas para o dashboard
func SetupDashboardRoutes(app fiber.Router) {
	dashboardGroup := app.Group("/dashboard")
	dashboardGroup.Get("/kpis", middleware.AuthRequired(), getKPIsHandler)
	dashboardGroup.Get("/tokens/:symbol/pricehistory", middleware.AuthRequired(), getPriceHistoryHandler)
}

// getKPIsHandler retorna dados de KPIs (busca no banco e calcula)
func getKPIsHandler(c *fiber.Ctx) error {
	// 1. Calcular Carbono Compensado Total
	var totalCarbon float64
	database.DB.Model(&models.Project{}).Select("sum(carbon_potential)").Row().Scan(&totalCarbon)

	// 2. Calcular Árvores Protegidas Totais
	var totalTrees int
	database.DB.Model(&models.Project{}).Select("sum(trees_protected)").Row().Scan(&totalTrees)

	// 3. Calcular Valor Total da Carteira (simulado para MVP, em app real usaria dados de portfólio)
	// Para o MVP, usaremos um valor fixo. Em um app real, o valor total seria calculado com base nos ativos do usuário.
	portfolioValue := 1200000.00

	// 4. Calcular tendências (simuladas)
	kpis := fiber.Map{
		"carbonCompensated": fiber.Map{
			"value": totalCarbon,
			"trend": 2.5, // Mock trend for MVP simplicity
		},
		"portfolioValue": fiber.Map{
			"value": portfolioValue,
			"trend": 5.8, // Mock trend for MVP simplicity
		},
		"treesProtected": fiber.Map{
			"value": totalTrees,
			"trend": 1.9, // Mock trend for MVP simplicity
		},
	}
	return c.JSON(kpis)
}

// getPriceHistoryHandler retorna dados simulados de histórico de preço do token
func getPriceHistoryHandler(c *fiber.Ctx) error {
	symbol := c.Params("symbol")
	log.Printf("Buscando histórico de preço para o token: %s", symbol)

	// 1. Fetch current price from database
	var token models.AssetToken
	if err := database.DB.Where("symbol = ?", symbol).First(&token).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Token não encontrado"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao buscar token"})
	}

	// 2. Generate simulated history (based on current price)
	var history []fiber.Map
	currentPrice := token.CurrentPrice
	for i := 0; i < 30; i++ {
		// Simular flutuação de preço (aumento geral com volatilidade)
		currentPrice += rand.Float64()*1.0 - 0.5 + 0.1 // drift positivo
		history = append(history, fiber.Map{
			"date":  time.Now().AddDate(0, 0, -30+i).Format("2006-01-02"),
			"price": currentPrice,
		})
	}
	return c.JSON(history)
}
