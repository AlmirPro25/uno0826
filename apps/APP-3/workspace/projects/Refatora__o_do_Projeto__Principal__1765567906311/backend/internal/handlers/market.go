
// --- backend/internal/handlers/market.go ---
package handlers

import (
	"log"
	"time"

	"aether-market/internal/database"
	"aether-market/internal/middleware"
	"aether-market/internal/models"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// SetupMarketRoutes configures the routes for the asset market
func SetupMarketRoutes(app fiber.Router) {
	marketGroup := app.Group("/market")
	marketGroup.Get("/projects", getProjectsHandler)
	marketGroup.Post("/buy", middleware.AuthRequired(), buyAssetHandler) // Requer autenticação para comprar
}

// getProjectsHandler returns a list of regeneration projects from the database
func getProjectsHandler(c *fiber.Ctx) error {
	var projects []models.Project
	if err := database.DB.Preload("AssociatedAsset").Find(&projects).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao buscar projetos"})
	}
	return c.JSON(projects)
}

// Estrutura de request para a transação de compra
type buyAssetInput struct {
	AssetID  string  `json:"assetId" validate:"required"`
	Quantity float64 `json:"quantity" validate:"required,gt=0"`
}

// buyAssetHandler processa a compra de um ativo (requer autenticação)
func buyAssetHandler(c *fiber.Ctx) error {
	var input buyAssetInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "JSON inválido"})
	}

	// Validação de entrada
	validate := validator.New()
	if err := validate.Struct(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Obter ID do usuário do contexto JWT
	userID := c.Locals("userId").(string)

	// --- Lógica de Negócios Real (Transaction Processing) ---

	// 1. Fetch asset details (price)
	var project models.Project
	if err := database.DB.Preload("AssociatedAsset").Where("id = ?", input.AssetID).First(&project).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Projeto não encontrado"})
	}
	assetPrice := project.AssociatedAsset.CurrentPrice
	totalCost := input.Quantity * assetPrice

	// 2. Fetch user details and portfolio
	var user models.User
	if err := database.DB.Preload("Portfolio").Where("id = ?", userID).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Usuário não encontrado"})
	}

	// 3. Simple balance check (assuming a balance field in User model)
	if user.Balance < totalCost {
		return c.Status(fiber.StatusPaymentRequired).JSON(fiber.Map{"error": "Saldo insuficiente"})
	}

	// 4. Update portfolio holding (atomically within a transaction)
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var holding models.PortfolioHolding
	if err := tx.Where("portfolio_id = ? AND asset_token_id = ?", user.Portfolio.ID, project.AssetTokenID).First(&holding).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new holding entry if not found
			holding = models.PortfolioHolding{
				PortfolioID:  user.Portfolio.ID,
				AssetTokenID: project.AssetTokenID,
				Quantity:     input.Quantity,
				AverageCost:  assetPrice,
			}
			if err := tx.Create(&holding).Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao criar holding"})
			}
		} else {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao buscar holding"})
		}
	} else {
		// Update existing holding entry
		// Calculate new average cost: (old_quantity * old_cost + new_quantity * current_price) / (old_quantity + new_quantity)
		newTotalCost := (holding.Quantity * holding.AverageCost) + (input.Quantity * assetPrice)
		newQuantity := holding.Quantity + input.Quantity
		holding.AverageCost = newTotalCost / newQuantity
		holding.Quantity = newQuantity

		if err := tx.Save(&holding).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao atualizar holding"})
		}
	}

	// 5. Update user balance (subtract cost)
	user.Balance -= totalCost
	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao atualizar saldo do usuário"})
	}

	// 6. Create transaction record
	transaction := models.Transaction{
		UserID:       user.ID,
		AssetTokenID: project.AssetTokenID,
		Type:         "buy",
		Amount:       input.Quantity,
		Price:        assetPrice,
		Timestamp:    time.Now(),
	}
	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao registrar transação"})
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao finalizar transação"})
	}

	log.Printf("Usuário %s comprou %f do ativo %s", userID, input.Quantity, project.Name)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Compra realizada com sucesso."})
}
