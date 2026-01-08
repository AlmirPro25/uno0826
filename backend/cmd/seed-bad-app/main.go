package main

import (
	"log"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Modelos para seed
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

type ShadowExecution struct {
	ID             string    `gorm:"type:text;primaryKey"`
	AgentID        string    `gorm:"type:text;not null"`
	TenantID       string    `gorm:"type:text;not null"`
	AppID          *string   `gorm:"type:text"`
	Domain         string    `gorm:"type:text;not null"`
	ProposedAction string    `gorm:"type:text;not null"`
	TargetEntity   string    `gorm:"type:text;not null"`
	Payload        string    `gorm:"type:text;not null"`
	SimulatedResult string   `gorm:"type:text"`
	RiskScore      float64   `gorm:"not null"`
	WouldHaveExecuted bool   `gorm:"not null"`
	BlockedReason  string    `gorm:"type:text"`
	CreatedAt      time.Time `gorm:"not null"`
}

func (ShadowExecution) TableName() string { return "shadow_executions" }

func main() {
	db, err := gorm.Open(sqlite.Open("./data/prostqs.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("Erro ao conectar: %v", err)
	}

	badAppID := "b609e73a-bf21-406f-b122-58a3ed21ce9c"
	userID := "7346f37a-116c-4685-9347-82a87f07154c"
	tenantID := "00000000-0000-0000-0000-000000000001"
	agentID := "00000000-0000-0000-0000-000000000001"
	now := time.Now()

	log.Println("=== SEED: Bad Behavior App ===")
	log.Printf("App ID: %s\n", badAppID)

	// 1. Agent Decisions - 50% rejeição (alto risco)
	log.Println("\n1. Criando Agent Decisions (50% rejeição - ALTO RISCO)...")
	for i := 1; i <= 10; i++ {
		status := "approved"
		if i <= 5 {
			status = "rejected" // 5 rejeitados = 50% rejeição
		}
		
		// Horários variados (alguns fora do comercial)
		hour := 2 + (i * 3) % 24 // Horários espalhados
		createdAt := now.AddDate(0, 0, -7+i).Add(time.Duration(hour) * time.Hour)
		
		dec := AgentDecision{
			ID:             uuid.New().String(),
			AgentID:        agentID,
			TenantID:       tenantID,
			AppID:          &badAppID,
			OriginApp:      "Meu Primeiro App",
			Domain:         "billing",
			ProposedAction: "high_risk_transfer",
			TargetEntity:   "payment:" + uuid.New().String(),
			Payload:        `{"amount":50000}`,
			Reason:         "High value transfer",
			RiskScore:      0.8,
			Status:         status,
			ExpiresAt:      createdAt.Add(24 * time.Hour),
			CreatedAt:      createdAt,
			UpdatedAt:      createdAt,
		}
		if err := db.Create(&dec).Error; err != nil {
			log.Printf("  Erro ao criar decision %d: %v\n", i, err)
		} else {
			log.Printf("  ✓ Decision %d: %s (%s @ %02d:00)\n", i, dec.ID[:8], status, hour)
		}
	}

	// 2. Audit Events - Muitos fora do horário comercial + spike de volume
	log.Println("\n2. Criando Audit Events (fora do horário + spike)...")
	eventTypes := []string{"LOGIN_FAILED", "PAYMENT_FAILED", "AGENT_DECISION_REJECTED"}
	
	// Criar muitos eventos nas últimas 24h (spike)
	for i := 1; i <= 30; i++ {
		// 70% fora do horário comercial
		hour := 2 // 2h da manhã (fora do comercial)
		if i%3 == 0 {
			hour = 10 // 10h (dentro do comercial)
		}
		
		// Concentrar nas últimas 24h para criar spike
		hoursAgo := i % 24
		createdAt := now.Add(-time.Duration(hoursAgo) * time.Hour)
		
		evt := AuditEvent{
			ID:           uuid.New().String(),
			Type:         eventTypes[i%3],
			AppID:        &badAppID,
			ActorID:      userID,
			ActorType:    "user",
			TargetID:     userID,
			TargetType:   "user",
			Action:       eventTypes[i%3],
			Before:       "{}",
			After:        "{}",
			Metadata:     "{}",
			Reason:       "Suspicious activity",
			IP:           "192.168.1.100",
			UserAgent:    "Mozilla/5.0",
			PreviousHash: "",
			Hash:         uuid.New().String(),
			CreatedAt:    createdAt.Add(time.Duration(hour) * time.Hour),
		}
		if err := db.Create(&evt).Error; err != nil {
			log.Printf("  Erro ao criar event %d: %v\n", i, err)
		} else {
			log.Printf("  ✓ Event %d: %s @ %02d:00\n", i, evt.Type, hour)
		}
	}

	// 3. Shadow Executions - Muitas execuções em shadow mode
	log.Println("\n3. Criando Shadow Executions (alto ratio)...")
	for i := 1; i <= 8; i++ {
		hour := 3 + i
		createdAt := now.AddDate(0, 0, -i).Add(time.Duration(hour) * time.Hour)
		
		shadow := ShadowExecution{
			ID:                uuid.New().String(),
			AgentID:           agentID,
			TenantID:          tenantID,
			AppID:             &badAppID,
			Domain:            "billing",
			ProposedAction:    "risky_operation",
			TargetEntity:      "account:" + uuid.New().String(),
			Payload:           `{"amount":100000}`,
			SimulatedResult:   `{"would_fail":true}`,
			RiskScore:         0.9,
			WouldHaveExecuted: false,
			BlockedReason:     "Risk too high",
			CreatedAt:         createdAt,
		}
		if err := db.Create(&shadow).Error; err != nil {
			log.Printf("  Erro ao criar shadow %d: %v\n", i, err)
		} else {
			log.Printf("  ✓ Shadow %d: %s\n", i, shadow.ID[:8])
		}
	}

	log.Println("\n=== SEED COMPLETO ===")
	log.Println("Dados inseridos para Bad Behavior App:")
	log.Println("- 10 Agent Decisions (50% rejeitados)")
	log.Println("- 30 Audit Events (70% fora do horário, spike de volume)")
	log.Println("- 8 Shadow Executions (alto ratio)")
	log.Println("\nAgora calcule o Risk Score para ver o resultado!")
}
