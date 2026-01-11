package usage

import (
	"time"

	"github.com/google/uuid"
)

// UsageRecord registra uso mensal por tenant
// Billing não é cobrança. Billing é medição.
type UsageRecord struct {
	ID        uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AppID     uuid.UUID `gorm:"type:text;not null;index:idx_usage_app" json:"app_id"`
	Period    time.Time `gorm:"not null;index:idx_usage_period" json:"period"` // Primeiro dia do mês

	// Compute
	DeployCount      int     `gorm:"default:0" json:"deploy_count"`
	DeploySuccessful int     `gorm:"default:0" json:"deploy_successful"`
	DeployFailed     int     `gorm:"default:0" json:"deploy_failed"`
	ContainerHours   float64 `gorm:"default:0" json:"container_hours"`
	CPUHours         float64 `gorm:"default:0" json:"cpu_hours"`
	MemoryGBHours    float64 `gorm:"default:0" json:"memory_gb_hours"`

	// Storage
	StorageGB    float64 `gorm:"default:0" json:"storage_gb"`
	BandwidthGB  float64 `gorm:"default:0" json:"bandwidth_gb"`

	// Events
	TelemetryEvents int `gorm:"default:0" json:"telemetry_events"`
	WebhookCalls    int `gorm:"default:0" json:"webhook_calls"`
	APIRequests     int `gorm:"default:0" json:"api_requests"`

	// Incidents
	CrashCount    int `gorm:"default:0" json:"crash_count"`
	RetryCount    int `gorm:"default:0" json:"retry_count"`
	RollbackCount int `gorm:"default:0" json:"rollback_count"`

	CreatedAt time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (UsageRecord) TableName() string {
	return "usage_records"
}

// UsageLimit define limites por plano
type UsageLimit struct {
	PlanID string `json:"plan_id"`

	MaxApps            int     `json:"max_apps"`
	MaxDeploysPerDay   int     `json:"max_deploys_per_day"`
	MaxCPUCores        float64 `json:"max_cpu_cores"`
	MaxMemoryGB        float64 `json:"max_memory_gb"`
	MaxStorageGB       float64 `json:"max_storage_gb"`
	LogRetentionDays   int     `json:"log_retention_days"`
	TelemetryRetention int     `json:"telemetry_retention_days"`
}

// Limites por plano
var PlanLimits = map[string]UsageLimit{
	"free": {
		PlanID:             "free",
		MaxApps:            1,
		MaxDeploysPerDay:   5,
		MaxCPUCores:        0.5,
		MaxMemoryGB:        0.5,
		MaxStorageGB:       1,
		LogRetentionDays:   1,
		TelemetryRetention: 7,
	},
	"pro": {
		PlanID:             "pro",
		MaxApps:            10,
		MaxDeploysPerDay:   50,
		MaxCPUCores:        2,
		MaxMemoryGB:        2,
		MaxStorageGB:       10,
		LogRetentionDays:   7,
		TelemetryRetention: 30,
	},
	"enterprise": {
		PlanID:             "enterprise",
		MaxApps:            -1, // ilimitado
		MaxDeploysPerDay:   -1,
		MaxCPUCores:        4,
		MaxMemoryGB:        8,
		MaxStorageGB:       100,
		LogRetentionDays:   30,
		TelemetryRetention: 365,
	},
}

// GetLimit retorna limite do plano
func GetLimit(planID string) UsageLimit {
	if limit, ok := PlanLimits[planID]; ok {
		return limit
	}
	return PlanLimits["free"]
}
