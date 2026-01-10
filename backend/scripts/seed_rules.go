// +build ignore

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Rule modelo simplificado
type Rule struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey"`
	AppID           uuid.UUID  `gorm:"type:uuid;index"`
	Name            string     `gorm:"size:100"`
	Description     string     `gorm:"size:500"`
	Status          string     `gorm:"size:20;default:'active'"`
	Priority        int        `gorm:"default:0"`
	TriggerType     string     `gorm:"size:20"`
	TriggerConfig   string     `gorm:"type:text"`
	Condition       string     `gorm:"type:text"`
	ActionType      string     `gorm:"size:20"`
	ActionConfig    string     `gorm:"type:text"`
	CooldownMinutes int        `gorm:"default:60"`
	LastTriggeredAt *time.Time
	TriggerCount    int       `gorm:"default:0"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	CreatedBy       uuid.UUID `gorm:"type:uuid"`
}

func main() {
	// Carregar .env
	godotenv.Load()
	godotenv.Load("../.env")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL não configurada")
	}

	// Conectar ao banco
	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Erro ao conectar: %v", err)
	}

	// Auto-migrate
	db.AutoMigrate(&Rule{})

	// VOX-BRIDGE App ID
	appID := uuid.MustParse("c573e4f0-a738-400c-a6bc-d890360a0057")

	// Regras para criar
	rules := []Rule{
		{
			ID:          uuid.New(),
			AppID:       appID,
			Name:        "Bounce Rate Crítico",
			Description: "Alerta quando bounce rate passa de 70%",
			Status:      "active",
			Priority:    10,
			TriggerType: "metric",
			Condition:   "bounce_rate > 70",
			ActionType:  "alert",
			ActionConfig: toJSON(map[string]interface{}{
				"alert_type": "high_bounce",
				"severity":   "warning",
				"message":    "Bounce rate acima de 70% - usuários estão saindo rápido demais",
			}),
			CooldownMinutes: 360, // 6 horas
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		},
		{
			ID:          uuid.New(),
			AppID:       appID,
			Name:        "Queda Brusca de Online",
			Description: "Alerta quando online_now cai mais de 50% com pelo menos 5 usuários antes",
			Status:      "active",
			Priority:    20,
			TriggerType: "threshold",
			Condition:   "online_now < 3 AND active_sessions > 0",
			ActionType:  "alert",
			ActionConfig: toJSON(map[string]interface{}{
				"alert_type": "online_drop",
				"severity":   "critical",
				"message":    "Queda brusca de usuários online detectada",
			}),
			CooldownMinutes: 30,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		},
		{
			ID:          uuid.New(),
			AppID:       appID,
			Name:        "Match Rate Baixo",
			Description: "Alerta quando menos de 20% das sessões resultam em match",
			Status:      "active",
			Priority:    5,
			TriggerType: "metric",
			Condition:   "match_rate < 20 AND total_sessions > 10",
			ActionType:  "alert",
			ActionConfig: toJSON(map[string]interface{}{
				"alert_type": "low_match_rate",
				"severity":   "warning",
				"message":    "Taxa de match abaixo de 20% - verificar fila ou UX",
			}),
			CooldownMinutes: 720, // 12 horas
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		},
		{
			ID:          uuid.New(),
			AppID:       appID,
			Name:        "Pico de Atividade",
			Description: "Alerta quando eventos/min passa de 10 (pico de uso)",
			Status:      "active",
			Priority:    3,
			TriggerType: "threshold",
			Condition:   "events_per_minute > 10",
			ActionType:  "alert",
			ActionConfig: toJSON(map[string]interface{}{
				"alert_type": "activity_spike",
				"severity":   "info",
				"message":    "Pico de atividade detectado - mais de 10 eventos/min",
			}),
			CooldownMinutes: 60,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		},
		{
			ID:          uuid.New(),
			AppID:       appID,
			Name:        "Sistema Parado",
			Description: "Alerta quando não há eventos por muito tempo",
			Status:      "active",
			Priority:    15,
			TriggerType: "metric",
			Condition:   "events_per_minute < 0.1 AND online_now == 0",
			ActionType:  "alert",
			ActionConfig: toJSON(map[string]interface{}{
				"alert_type": "system_idle",
				"severity":   "info",
				"message":    "Sistema sem atividade - nenhum usuário online",
			}),
			CooldownMinutes: 1440, // 24 horas
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		},
		{
			ID:          uuid.New(),
			AppID:       appID,
			Name:        "Engajamento Alto",
			Description: "Flag positivo quando sessões têm muitas interações",
			Status:      "active",
			Priority:    2,
			TriggerType: "metric",
			Condition:   "match_rate > 50 AND total_sessions > 5",
			ActionType:  "alert",
			ActionConfig: toJSON(map[string]interface{}{
				"alert_type": "high_engagement",
				"severity":   "info",
				"message":    "Engajamento alto - mais de 50% das sessões com match",
			}),
			CooldownMinutes: 1440, // 24 horas
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		},
	}

	// Inserir regras (ignorar se já existir pelo nome)
	for _, rule := range rules {
		var existing Rule
		result := db.Where("app_id = ? AND name = ?", rule.AppID, rule.Name).First(&existing)
		
		if result.Error == gorm.ErrRecordNotFound {
			if err := db.Create(&rule).Error; err != nil {
				log.Printf("❌ Erro ao criar regra '%s': %v", rule.Name, err)
			} else {
				log.Printf("✅ Regra criada: %s", rule.Name)
			}
		} else {
			log.Printf("⏭️  Regra já existe: %s", rule.Name)
		}
	}

	fmt.Println("\n🎯 Seed de regras concluído!")
	fmt.Printf("📊 Total de regras para VOX-BRIDGE: %d\n", len(rules))
}

func toJSON(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}
