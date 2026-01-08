package main

import (
	"log"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Modelos simplificados para seed - baseados nos modelos reais

type AgentDecision struct {
	ID             string    `gorm:"type:text;primaryKey"`
	AgentID        string    `gorm:"type:text;not null"`
	TenantID       string    `gorm:"type:text;not null"`
	AppID          *string   `gorm:"type:text"`
	OriginApp      string    `gorm:"type:text"`
	Domain         string    `gorm:"type:text;not null"`
	ProposedAction string    `gorm:"type:text;not null"`
	TargetEntity   string    `gorm:"type:text;not null"`
	Payload        string    `gorm:"type:text;not null"`
	Reason         string    `gorm:"type:text"`
	RiskScore      float64   `gorm:"not null"`
	Status         string    `gorm:"type:text;not null;default:'proposed'"`
	ReviewedBy     *string   `gorm:"type:text"`
	ReviewNote     string    `gorm:"type:text"`
	ExpiresAt      time.Time `gorm:"not null"`
	CreatedAt      time.Time `gorm:"not null"`
	UpdatedAt      time.Time
}

func (AgentDecision) TableName() string { return "agent_decisions" }

type AuditEvent struct {
	ID           string    `gorm:"type:text;primaryKey"`
	Sequence     int64     `gorm:"autoIncrement"`
	Type         string    `gorm:"size:50"`
	AppID        *string   `gorm:"type:text"`
	AppUserID    *string   `gorm:"type:text"`
	SessionID    *string   `gorm:"type:text"`
	ActorID      string    `gorm:"type:text"`
	ActorType    string    `gorm:"size:20"`
	TargetID     string    `gorm:"type:text"`
	TargetType   string    `gorm:"size:50"`
	Action       string    `gorm:"size:50"`
	Before       string    `gorm:"type:text"`
	After        string    `gorm:"type:text"`
	Metadata     string    `gorm:"type:text"`
	PolicyID     *string   `gorm:"type:text"`
	Reason       string    `gorm:"size:500"`
	IP           string    `gorm:"size:50"`
	UserAgent    string    `gorm:"size:500"`
	PreviousHash string    `gorm:"size:64"`
	Hash         string    `gorm:"size:64"`
	CreatedAt    time.Time
}

func (AuditEvent) TableName() string { return "audit_events" }

func main() {
	// Conectar ao banco
	db, err := gorm.Open(sqlite.Open("./data/prostqs.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("Erro ao conectar: %v", err)
	}

	goodAppID := "4f0ba5db-1ed7-488d-8b06-282081f27e78"
	userID := "7346f37a-116c-4685-9347-82a87f07154c"
	tenantID := "00000000-0000-0000-0000-000000000001"
	agentID := "00000000-0000-0000-0000-000000000001"
	now := time.Now()

	log.Println("=== SEED: Good Behavior App ===")
	log.Printf("App ID: %s\n", goodAppID)

	// 1. Agent Decisions - 90% aprovação (10% rejeição)
	log.Println("\n1. Criando Agent Decisions (90% aprovação)...")
	for i := 1; i <= 10; i++ {
		status := "approved"
		if i == 10 {
			status = "rejected" // 1 rejeitado = 10% rejeição
		}
		
		// Horário comercial (9h-17h)
		hour := 9 + (i % 8)
		createdAt := now.AddDate(0, 0, -7+i).Add(time.Duration(hour) * time.Hour)
		
		dec := AgentDecision{
			ID:             uuid.New().String(),
			AgentID:        agentID,
			TenantID:       tenantID,
			AppID:          &goodAppID,
			OriginApp:      "Good Behavior App",
			Domain:         "billing",
			ProposedAction: "process_payment",
			TargetEntity:   "payment:" + uuid.New().String(),
			Payload:        `{"amount":` + string(rune('0'+i)) + `00}`,
			Reason:         "Regular payment processing",
			RiskScore:      0.1,
			Status:         status,
			ExpiresAt:      createdAt.Add(24 * time.Hour),
			CreatedAt:      createdAt,
			UpdatedAt:      createdAt,
		}
		if err := db.Create(&dec).Error; err != nil {
			log.Printf("  Erro ao criar decision %d: %v\n", i, err)
		} else {
			log.Printf("  ✓ Decision %d: %s (%s)\n", i, dec.ID[:8], status)
		}
	}

	// 2. Audit Events - Horário comercial, volume estável
	log.Println("\n2. Criando Audit Events (horário comercial, volume estável)...")
	eventTypes := []string{"LOGIN_SUCCESS", "PAYMENT_CREATED", "AGENT_DECISION_APPROVED"}
	for i := 1; i <= 21; i++ {
		day := -7 + (i / 3)
		hour := 9 + (i % 8) // 9h-17h (horário comercial)
		createdAt := now.AddDate(0, 0, day).Add(time.Duration(hour) * time.Hour)
		
		evt := AuditEvent{
			ID:           uuid.New().String(),
			Type:         eventTypes[i%3],
			AppID:        &goodAppID,
			ActorID:      userID,
			ActorType:    "user",
			TargetID:     userID,
			TargetType:   "user",
			Action:       eventTypes[i%3],
			Before:       "{}",
			After:        "{}",
			Metadata:     "{}",
			Reason:       "Regular activity",
			IP:           "192.168.1.1",
			UserAgent:    "Mozilla/5.0",
			PreviousHash: "",
			Hash:         uuid.New().String(),
			CreatedAt:    createdAt,
		}
		if err := db.Create(&evt).Error; err != nil {
			log.Printf("  Erro ao criar event %d: %v\n", i, err)
		} else {
			log.Printf("  ✓ Event %d: %s (%s @ %02d:00)\n", i, evt.ID[:8], evt.Type, hour)
		}
	}

	log.Println("\n=== SEED COMPLETO ===")
	log.Println("Dados inseridos para Good Behavior App:")
	log.Println("- 10 Agent Decisions (90% aprovados)")
	log.Println("- 21 Audit Events (horário comercial)")
	log.Println("- 0 Shadow Executions")
	log.Println("\nAgora calcule o Risk Score para ver o resultado!")
}
