// +build ignore

package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

/*
================================================================================
SEED ADS - Popula o Ad Gateway com dados de teste
================================================================================

Cria:
- 1 Ad Account
- 1 Budget (R$1000)
- 3 Campanhas com diferentes estratégias
- 3 Slots de anúncio
- 6 Criativos (2 por campanha)
- Targeting configurado

Uso:
  go run scripts/seed_ads.go

================================================================================
*/

// Models (simplified for seeding)
type AdAccount struct {
	ID               uuid.UUID `gorm:"type:text;primaryKey"`
	TenantID         uuid.UUID `gorm:"type:text;not null"`
	UserID           uuid.UUID `gorm:"type:text;not null"`
	BalanceAccountID uuid.UUID `gorm:"type:text;not null"`
	Name             string    `gorm:"type:text;not null"`
	Status           string    `gorm:"type:text;not null;default:'active'"`
	CreatedAt        time.Time `gorm:"not null"`
	UpdatedAt        time.Time
}

func (AdAccount) TableName() string { return "ad_accounts" }

type AdBudget struct {
	ID          uuid.UUID  `gorm:"type:text;primaryKey"`
	AdAccountID uuid.UUID  `gorm:"type:text;not null"`
	AmountTotal int64      `gorm:"not null"`
	AmountSpent int64      `gorm:"not null;default:0"`
	Currency    string     `gorm:"type:text;not null;default:'BRL'"`
	Period      string     `gorm:"type:text;not null"`
	PeriodStart time.Time  `gorm:"not null"`
	PeriodEnd   *time.Time
	Status      string     `gorm:"type:text;not null;default:'active'"`
	CreatedAt   time.Time  `gorm:"not null"`
	UpdatedAt   time.Time
}

func (AdBudget) TableName() string { return "ad_budgets" }

type AdCampaign struct {
	ID              uuid.UUID  `gorm:"type:text;primaryKey"`
	AdAccountID     uuid.UUID  `gorm:"type:text;not null"`
	BudgetID        uuid.UUID  `gorm:"type:text;not null"`
	Name            string     `gorm:"type:text;not null"`
	Objective       string     `gorm:"type:text;not null"`
	BidStrategy     string     `gorm:"type:text;not null;default:'lowest_cost'"`
	BidAmount       int64      `gorm:"default:0"`
	DailyBudget     int64      `gorm:"default:0"`
	DailySpendLimit int64      `gorm:"default:0"`
	TotalSpent      int64      `gorm:"default:0"`
	Status          string     `gorm:"type:text;not null;default:'draft'"`
	StartAt         *time.Time
	EndAt           *time.Time
	CreatedAt       time.Time  `gorm:"not null"`
	UpdatedAt       time.Time
}

func (AdCampaign) TableName() string { return "ad_campaigns" }

type AdSlot struct {
	ID            uuid.UUID `gorm:"type:text;primaryKey"`
	AppID         uuid.UUID `gorm:"type:text;not null"`
	Name          string    `gorm:"type:text;not null"`
	Format        string    `gorm:"type:text;not null"`
	Width         int       `gorm:"default:0"`
	Height        int       `gorm:"default:0"`
	MinCPM        int64     `gorm:"default:0"`
	MaxAdsPerHour int       `gorm:"default:100"`
	Enabled       bool      `gorm:"default:true"`
	CreatedAt     time.Time
}

func (AdSlot) TableName() string { return "ad_slots" }

type AdCreative struct {
	ID          uuid.UUID `gorm:"type:text;primaryKey"`
	CampaignID  uuid.UUID `gorm:"type:text;not null"`
	Name        string    `gorm:"type:text;not null"`
	Format      string    `gorm:"type:text;not null"`
	ContentURL  string    `gorm:"type:text"`
	ClickURL    string    `gorm:"type:text"`
	Title       string    `gorm:"type:text"`
	Description string    `gorm:"type:text"`
	CTAText     string    `gorm:"type:text"`
	Status      string    `gorm:"type:text;default:'pending'"`
	CreatedAt   time.Time
}

func (AdCreative) TableName() string { return "ad_creatives" }

type AdTargeting struct {
	ID           uuid.UUID `gorm:"type:text;primaryKey"`
	CampaignID   uuid.UUID `gorm:"type:text;not null"`
	SlotIDs      string    `gorm:"type:text"`
	Plans        string    `gorm:"type:text"`
	Countries    string    `gorm:"type:text"`
	Languages    string    `gorm:"type:text"`
	DeviceTypes  string    `gorm:"type:text"`
	TimeRanges   string    `gorm:"type:text"`
	ExcludeUsers string    `gorm:"type:text"`
}

func (AdTargeting) TableName() string { return "ad_targetings" }

func main() {
	// PROTEÇÃO: Bloquear em produção
	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "release" {
		log.Fatal("❌ ERRO: Seeds não podem ser executados em produção (GIN_MODE=release)")
	}

	// Aviso adicional
	fmt.Println("⚠️  ATENÇÃO: Este script é apenas para desenvolvimento/testes")
	fmt.Println("")

	dbPath := os.Getenv("SQLITE_DB_PATH")
	if dbPath == "" {
		dbPath = "./data/prostqs.db"
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("================================================================================")
	fmt.Println("SEED ADS - Populando Ad Gateway")
	fmt.Println("================================================================================")

	// IDs fixos para facilitar testes
	appID := uuid.MustParse("c573e4f0-a738-400c-a6bc-d890360a0057")
	userID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	tenantID := uuid.MustParse("22222222-2222-2222-2222-222222222222")
	billingAccountID := uuid.MustParse("33333333-3333-3333-3333-333333333333")

	// 1. Criar Ad Account
	fmt.Println("\n📦 Criando Ad Account...")
	adAccount := AdAccount{
		ID:               uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
		TenantID:         tenantID,
		UserID:           userID,
		BalanceAccountID: billingAccountID,
		Name:             "Conta Principal de Ads",
		Status:           "active",
		CreatedAt:        time.Now(),
	}
	if err := db.FirstOrCreate(&adAccount, "id = ?", adAccount.ID).Error; err != nil {
		log.Printf("⚠️  Ad Account já existe ou erro: %v", err)
	} else {
		fmt.Printf("   ✅ Ad Account: %s\n", adAccount.ID)
	}

	// 2. Criar Budget
	fmt.Println("\n💰 Criando Budget...")
	budget := AdBudget{
		ID:          uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
		AdAccountID: adAccount.ID,
		AmountTotal: 100000, // R$1000.00
		AmountSpent: 0,
		Currency:    "BRL",
		Period:      "monthly",
		PeriodStart: time.Now(),
		Status:      "active",
		CreatedAt:   time.Now(),
	}
	if err := db.FirstOrCreate(&budget, "id = ?", budget.ID).Error; err != nil {
		log.Printf("⚠️  Budget já existe ou erro: %v", err)
	} else {
		fmt.Printf("   ✅ Budget: R$%.2f\n", float64(budget.AmountTotal)/100)
	}

	// 3. Criar Slots
	fmt.Println("\n🎯 Criando Ad Slots...")
	slots := []AdSlot{
		{
			ID:            uuid.MustParse("11111111-0000-0000-0000-000000000001"),
			AppID:         appID,
			Name:          "banner_top",
			Format:        "banner",
			Width:         728,
			Height:        90,
			MinCPM:        10, // R$0.10
			MaxAdsPerHour: 100,
			Enabled:       true,
			CreatedAt:     time.Now(),
		},
		{
			ID:            uuid.MustParse("11111111-0000-0000-0000-000000000002"),
			AppID:         appID,
			Name:          "sidebar_right",
			Format:        "banner",
			Width:         300,
			Height:        250,
			MinCPM:        15, // R$0.15
			MaxAdsPerHour: 50,
			Enabled:       true,
			CreatedAt:     time.Now(),
		},
		{
			ID:            uuid.MustParse("11111111-0000-0000-0000-000000000003"),
			AppID:         appID,
			Name:          "native_feed",
			Format:        "native",
			MinCPM:        20, // R$0.20
			MaxAdsPerHour: 200,
			Enabled:       true,
			CreatedAt:     time.Now(),
		},
	}
	for _, slot := range slots {
		if err := db.FirstOrCreate(&slot, "id = ?", slot.ID).Error; err != nil {
			log.Printf("⚠️  Slot %s já existe ou erro: %v", slot.Name, err)
		} else {
			fmt.Printf("   ✅ Slot: %s (%s) - MinCPM: R$%.2f\n", slot.Name, slot.Format, float64(slot.MinCPM)/100)
		}
	}

	// 4. Criar Campanhas
	fmt.Println("\n📢 Criando Campanhas...")
	campaigns := []AdCampaign{
		{
			ID:          uuid.MustParse("cccccccc-0000-0000-0000-000000000001"),
			AdAccountID: adAccount.ID,
			BudgetID:    budget.ID,
			Name:        "Campanha Awareness - CPM Alto",
			Objective:   "impressions",
			BidStrategy: "cpm",
			BidAmount:   50, // R$0.50 CPM
			DailyBudget: 10000, // R$100/dia
			Status:      "active",
			CreatedAt:   time.Now(),
		},
		{
			ID:          uuid.MustParse("cccccccc-0000-0000-0000-000000000002"),
			AdAccountID: adAccount.ID,
			BudgetID:    budget.ID,
			Name:        "Campanha Tráfego - CPC",
			Objective:   "clicks",
			BidStrategy: "cpc",
			BidAmount:   30, // R$0.30 CPC
			DailyBudget: 5000, // R$50/dia
			Status:      "active",
			CreatedAt:   time.Now(),
		},
		{
			ID:          uuid.MustParse("cccccccc-0000-0000-0000-000000000003"),
			AdAccountID: adAccount.ID,
			BudgetID:    budget.ID,
			Name:        "Campanha Conversão - Target Cost",
			Objective:   "conversions",
			BidStrategy: "target_cost",
			BidAmount:   100, // R$1.00 CPA target
			DailyBudget: 20000, // R$200/dia
			Status:      "draft",
			CreatedAt:   time.Now(),
		},
	}
	for _, campaign := range campaigns {
		if err := db.FirstOrCreate(&campaign, "id = ?", campaign.ID).Error; err != nil {
			log.Printf("⚠️  Campanha %s já existe ou erro: %v", campaign.Name, err)
		} else {
			fmt.Printf("   ✅ Campanha: %s (%s) - Bid: R$%.2f\n", campaign.Name, campaign.Status, float64(campaign.BidAmount)/100)
		}
	}

	// 5. Criar Criativos
	fmt.Println("\n🎨 Criando Criativos...")
	creatives := []AdCreative{
		// Campanha 1
		{
			ID:          uuid.MustParse("dddddddd-0000-0000-0000-000000000001"),
			CampaignID:  campaigns[0].ID,
			Name:        "Banner Principal 728x90",
			Format:      "banner",
			ContentURL:  "https://cdn.example.com/ads/banner1.jpg",
			ClickURL:    "https://example.com/landing1",
			Title:       "Descubra o Futuro",
			Description: "Tecnologia que transforma",
			CTAText:     "Saiba Mais",
			Status:      "approved",
			CreatedAt:   time.Now(),
		},
		{
			ID:          uuid.MustParse("dddddddd-0000-0000-0000-000000000002"),
			CampaignID:  campaigns[0].ID,
			Name:        "Banner Secundário 300x250",
			Format:      "banner",
			ContentURL:  "https://cdn.example.com/ads/banner2.jpg",
			ClickURL:    "https://example.com/landing1",
			Title:       "Inovação Agora",
			Description: "Não fique para trás",
			CTAText:     "Experimente",
			Status:      "approved",
			CreatedAt:   time.Now(),
		},
		// Campanha 2
		{
			ID:          uuid.MustParse("dddddddd-0000-0000-0000-000000000003"),
			CampaignID:  campaigns[1].ID,
			Name:        "Native Ad - Feed",
			Format:      "native",
			ContentURL:  "https://cdn.example.com/ads/native1.jpg",
			ClickURL:    "https://example.com/landing2",
			Title:       "5 Dicas Essenciais",
			Description: "Aprenda com especialistas",
			CTAText:     "Ler Artigo",
			Status:      "approved",
			CreatedAt:   time.Now(),
		},
		{
			ID:          uuid.MustParse("dddddddd-0000-0000-0000-000000000004"),
			CampaignID:  campaigns[1].ID,
			Name:        "Native Ad - Sidebar",
			Format:      "native",
			ContentURL:  "https://cdn.example.com/ads/native2.jpg",
			ClickURL:    "https://example.com/landing2",
			Title:       "Guia Completo",
			Description: "Tudo que você precisa saber",
			CTAText:     "Baixar Grátis",
			Status:      "approved",
			CreatedAt:   time.Now(),
		},
		// Campanha 3
		{
			ID:          uuid.MustParse("dddddddd-0000-0000-0000-000000000005"),
			CampaignID:  campaigns[2].ID,
			Name:        "Video Ad 15s",
			Format:      "video",
			ContentURL:  "https://cdn.example.com/ads/video1.mp4",
			ClickURL:    "https://example.com/landing3",
			Title:       "Oferta Especial",
			Description: "Só hoje: 50% OFF",
			CTAText:     "Comprar Agora",
			Status:      "pending",
			CreatedAt:   time.Now(),
		},
		{
			ID:          uuid.MustParse("dddddddd-0000-0000-0000-000000000006"),
			CampaignID:  campaigns[2].ID,
			Name:        "Video Ad 30s",
			Format:      "video",
			ContentURL:  "https://cdn.example.com/ads/video2.mp4",
			ClickURL:    "https://example.com/landing3",
			Title:       "Última Chance",
			Description: "Promoção termina em breve",
			CTAText:     "Aproveitar",
			Status:      "pending",
			CreatedAt:   time.Now(),
		},
	}
	for _, creative := range creatives {
		if err := db.FirstOrCreate(&creative, "id = ?", creative.ID).Error; err != nil {
			log.Printf("⚠️  Criativo %s já existe ou erro: %v", creative.Name, err)
		} else {
			fmt.Printf("   ✅ Criativo: %s (%s) - %s\n", creative.Name, creative.Format, creative.Status)
		}
	}

	// 6. Criar Targeting
	fmt.Println("\n🎯 Criando Targeting...")
	targetings := []AdTargeting{
		{
			ID:          uuid.MustParse("eeeeeeee-0000-0000-0000-000000000001"),
			CampaignID:  campaigns[0].ID,
			SlotIDs:     slots[0].ID.String() + "," + slots[1].ID.String(),
			Plans:       "free,pro",
			Countries:   "BR,PT",
			Languages:   "pt",
			DeviceTypes: "desktop,mobile",
		},
		{
			ID:          uuid.MustParse("eeeeeeee-0000-0000-0000-000000000002"),
			CampaignID:  campaigns[1].ID,
			SlotIDs:     slots[2].ID.String(),
			Plans:       "pro,enterprise",
			Countries:   "BR",
			Languages:   "pt",
			DeviceTypes: "mobile",
		},
		{
			ID:          uuid.MustParse("eeeeeeee-0000-0000-0000-000000000003"),
			CampaignID:  campaigns[2].ID,
			Plans:       "enterprise",
			Countries:   "BR,US",
			Languages:   "pt,en",
			DeviceTypes: "desktop,mobile,tablet",
		},
	}
	for _, targeting := range targetings {
		if err := db.FirstOrCreate(&targeting, "id = ?", targeting.ID).Error; err != nil {
			log.Printf("⚠️  Targeting já existe ou erro: %v", err)
		} else {
			fmt.Printf("   ✅ Targeting para campanha: %s\n", targeting.CampaignID)
		}
	}

	fmt.Println("\n================================================================================")
	fmt.Println("✅ SEED COMPLETO!")
	fmt.Println("================================================================================")
	fmt.Println("\nResumo:")
	fmt.Printf("   • 1 Ad Account\n")
	fmt.Printf("   • 1 Budget (R$1000.00)\n")
	fmt.Printf("   • 3 Slots de anúncio\n")
	fmt.Printf("   • 3 Campanhas (2 ativas, 1 draft)\n")
	fmt.Printf("   • 6 Criativos (4 aprovados, 2 pendentes)\n")
	fmt.Printf("   • 3 Targetings configurados\n")
	fmt.Println("\nPara testar o leilão:")
	fmt.Printf("   curl -X POST http://localhost:8080/api/v1/ads/decide \\\n")
	fmt.Printf("     -H 'Content-Type: application/json' \\\n")
	fmt.Printf("     -d '{\"slot\":\"banner_top\",\"app_id\":\"%s\",\"plan\":\"pro\",\"country\":\"BR\"}'\n", appID)
}
