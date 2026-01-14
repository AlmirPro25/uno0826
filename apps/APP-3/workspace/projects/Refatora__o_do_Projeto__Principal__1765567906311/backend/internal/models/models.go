
// --- backend/internal/models/models.go ---
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User representa a tabela de usuários
type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	Role      string    `gorm:"default:'investor'" json:"role"` // investor, asset_owner, admin
	Balance   float64   `gorm:"default:10000.00" json:"balance"` // Adicionado para simulação de transações
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Portfolio Portfolio `gorm:"foreignKey:UserID"`
}

// AssetToken representa os tokens negociados (O2-Token, etc.)
type AssetToken struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Symbol       string    `gorm:"uniqueIndex;not null" json:"symbol"`
	Name         string    `gorm:"not null" json:"name"`
	CurrentPrice float64   `gorm:"not null" json:"currentPrice"`
	Supply       float64   `gorm:"not null" json:"supply"`
	Description  string    `gorm:"type:text" json:"description"`
	Projects     []Project `gorm:"foreignKey:AssetTokenID"`
}

// Project representa os projetos de regeneração que lastreiam os tokens
type Project struct {
	ID                uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name              string    `gorm:"not null" json:"name"`
	Location          string    `json:"location"`
	Description       string    `gorm:"type:text" json:"description"`
	ProjectedAPY      float64   `json:"projectedApy"`
	RiskLevel         string    `json:"riskLevel"` // low, medium, high
	CarbonPotential   float64   `json:"carbonPotential"`
	TreesProtected    int       `json:"treesProtected"`
	AssetTokenID      uuid.UUID `json:"assetTokenId"`
	AssociatedAsset   AssetToken `gorm:"foreignKey:AssetTokenID"`
}

// Portfolio representa a carteira de ativos de um usuário
type Portfolio struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID        uuid.UUID `gorm:"not null" json:"userId"`
	AssetHoldings []PortfolioHolding `gorm:"foreignKey:PortfolioID"`
	Transactions  []Transaction      `gorm:"foreignKey:UserID"`
}

// PortfolioHolding representa um ativo específico na carteira do usuário
type PortfolioHolding struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	PortfolioID   uuid.UUID `json:"portfolioId"`
	AssetTokenID  uuid.UUID `json:"assetTokenId"`
	Quantity      float64   `gorm:"not null" json:"quantity"`
	AverageCost   float64   `gorm:"not null" json:"averageCost"`
	AssociatedAssetToken AssetToken `gorm:"foreignKey:AssetTokenID"` // Preload relationship
}

// Transaction representa o histórico de negociações
type Transaction struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID       uuid.UUID `json:"userId"`
	AssetTokenID uuid.UUID `json:"assetTokenId"`
	Type         string    `json:"type"` // buy, sell
	Amount       float64   `json:"amount"`
	Price        float64   `json:"price"`
	Timestamp    time.Time `json:"timestamp"`
}

// BeforeCreate hook to generate UUID and create initial portfolio for new user
func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	u.ID = uuid.New()
	// Create portfolio for new user (this will run automatically by GORM)
	// We might need to manually create the Portfolio in the handler if a before create hook doesn't ensure the new portfolio ID is set immediately
	return
}

func (p *Project) BeforeCreate(tx *gorm.DB) (err error) {
	p.ID = uuid.New()
	return
}

func (t *Transaction) BeforeCreate(tx *gorm.DB) (err error) {
	t.ID = uuid.New()
	return
}

func (h *PortfolioHolding) BeforeCreate(tx *gorm.DB) (err error) {
	h.ID = uuid.New()
	return
}
