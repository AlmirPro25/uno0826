
// --- backend/cmd/api/main.go ---
package main

import (
	"log"
	"os"
	"time"

	"aether-market/internal/database"
	"aether-market/internal/handlers"
	"aether-market/internal/middleware"
	"aether-market/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	// Carregar variáveis de ambiente do arquivo .env (se existir)
	err := godotenv.Load()
	if err != nil && !os.IsNotExist(err) {
		log.Fatal("Erro ao carregar arquivo .env")
	}

	// 1. Conexão com o Banco de Dados
	db, err := database.ConnectDB(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Falha ao conectar ao banco de dados: %v", err)
	}

	// 2. Migração do Schema (GORM AutoMigrate)
	err = db.AutoMigrate(&models.User{}, &models.AssetToken{}, &models.Project{}, &models.Portfolio{}, &models.PortfolioHolding{}, &models.Transaction{})
	if err != nil {
		log.Fatalf("Falha na migração do banco de dados: %v", err)
	}

	// 3. Seed inicial de dados (se o banco estiver vazio)
	seedDatabase(db)

	// 4. Inicializar Framework Fiber (Backend)
	app := fiber.New()

	// 5. Configurar Middleware CORS (Permitir frontend React/Next.js)
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000,http://127.0.0.1:5500", // Permitir acesso do frontend React/Next.js e live server
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	// 6. Agrupar rotas da API v1
	apiV1 := app.Group("/api/v1")

	// 7. Configurar rotas e handlers
	handlers.SetupAuthRoutes(apiV1)      // Rotas de autenticação (login, register)
	handlers.SetupDashboardRoutes(apiV1) // Rotas do dashboard (kpis, price history)
	handlers.SetupMarketRoutes(apiV1)    // Rotas do marketplace (projects, buy)
	handlers.SetupPortfolioRoutes(apiV1) // Rotas do portfólio (requer auth)

	// Iniciar servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("🚀 Servidor AETHER rodando em http://localhost:%s", port)
	log.Fatal(app.Listen(":" + port))
}

// seedDatabase popula o banco de dados com dados iniciais se estiver vazio.
func seedDatabase(db *gorm.DB) {
	var assetCount int64
	db.Model(&models.AssetToken{}).Count(&assetCount)
	if assetCount > 0 {
		return // Dados já existem, não fazer seed novamente
	}

	log.Println("Populating initial data...")

	// 1. Criar Asset Tokens
	tokenO2T := models.AssetToken{
		ID:           uuid.New(),
		Symbol:       "O2T",
		Name:         "O2-Token",
		CurrentPrice: 10.50,
		Supply:       1000000.0,
		Description:  "Token lastreado em projetos de preservação de carbono.",
	}
	db.Create(&tokenO2T)

	tokenWAT := models.AssetToken{
		ID:           uuid.New(),
		Symbol:       "WAT",
		Name:         "Water-Token",
		CurrentPrice: 5.20,
		Supply:       500000.0,
		Description:  "Token lastreado em projetos de conservação hídrica.",
	}
	db.Create(&tokenWAT)

	// 2. Criar Projetos (associa-os aos tokens)
	db.Create(&models.Project{
		Name:            "Projeto Rio Azul",
		Location:        "Amazônia, Brasil",
		Description:     "Proteção de 150.000 hectares de floresta primária na bacia do Rio Negro.",
		ProjectedAPY:    12.5,
		RiskLevel:       "Baixo",
		CarbonPotential: 150000.0,
		TreesProtected:  100000,
		AssetTokenID:    tokenO2T.ID,
	})

	db.Create(&models.Project{
		Name:            "Reserva Mantiqueira",
		Location:        "Mata Atlântica, Brasil",
		Description:     "Restauro e proteção de 80.000 hectares de Mata Atlântica na Serra da Mantiqueira.",
		ProjectedAPY:    8.5,
		RiskLevel:       "Médio",
		CarbonPotential: 80000.0,
		TreesProtected:  50000,
		AssetTokenID:    tokenO2T.ID,
	})

	db.Create(&models.Project{
		Name:            "Floresta Viva",
		Location:        "Patagônia, Argentina",
		Description:     "Conservação de florestas de Nothofagus na Patagônia Chilena e Argentina.",
		ProjectedAPY:    15.0,
		RiskLevel:       "Médio",
		CarbonPotential: 200000.0,
		TreesProtected:  150000,
		AssetTokenID:    tokenO2T.ID,
	})

	log.Println("✅ Seed de dados concluído.")
}
