package usage

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UsageService struct {
	db *gorm.DB
}

func NewUsageService(db *gorm.DB) *UsageService {
	return &UsageService{db: db}
}

// GetOrCreateCurrentPeriod retorna ou cria registro do mês atual
func (s *UsageService) GetOrCreateCurrentPeriod(appID uuid.UUID) (*UsageRecord, error) {
	now := time.Now()
	period := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	var record UsageRecord
	err := s.db.Where("app_id = ? AND period = ?", appID, period).First(&record).Error

	if err == gorm.ErrRecordNotFound {
		record = UsageRecord{
			ID:        uuid.New(),
			AppID:     appID,
			Period:    period,
			CreatedAt: now,
		}
		if err := s.db.Create(&record).Error; err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	return &record, nil
}

// IncrementDeploy incrementa contador de deploy
func (s *UsageService) IncrementDeploy(appID uuid.UUID, success bool) error {
	record, err := s.GetOrCreateCurrentPeriod(appID)
	if err != nil {
		return err
	}

	updates := map[string]interface{}{
		"deploy_count": gorm.Expr("deploy_count + 1"),
		"updated_at":   time.Now(),
	}

	if success {
		updates["deploy_successful"] = gorm.Expr("deploy_successful + 1")
	} else {
		updates["deploy_failed"] = gorm.Expr("deploy_failed + 1")
	}

	return s.db.Model(&UsageRecord{}).Where("id = ?", record.ID).Updates(updates).Error
}

// IncrementTelemetry incrementa contador de eventos
func (s *UsageService) IncrementTelemetry(appID uuid.UUID, count int) error {
	record, err := s.GetOrCreateCurrentPeriod(appID)
	if err != nil {
		return err
	}

	return s.db.Model(&UsageRecord{}).Where("id = ?", record.ID).Updates(map[string]interface{}{
		"telemetry_events": gorm.Expr("telemetry_events + ?", count),
		"updated_at":       time.Now(),
	}).Error
}

// IncrementWebhook incrementa contador de webhooks
func (s *UsageService) IncrementWebhook(appID uuid.UUID) error {
	record, err := s.GetOrCreateCurrentPeriod(appID)
	if err != nil {
		return err
	}

	return s.db.Model(&UsageRecord{}).Where("id = ?", record.ID).Updates(map[string]interface{}{
		"webhook_calls": gorm.Expr("webhook_calls + 1"),
		"updated_at":    time.Now(),
	}).Error
}

// IncrementCrash incrementa contador de crashes
func (s *UsageService) IncrementCrash(appID uuid.UUID) error {
	record, err := s.GetOrCreateCurrentPeriod(appID)
	if err != nil {
		return err
	}

	return s.db.Model(&UsageRecord{}).Where("id = ?", record.ID).Updates(map[string]interface{}{
		"crash_count": gorm.Expr("crash_count + 1"),
		"updated_at":  time.Now(),
	}).Error
}

// IncrementRetry incrementa contador de retries
func (s *UsageService) IncrementRetry(appID uuid.UUID) error {
	record, err := s.GetOrCreateCurrentPeriod(appID)
	if err != nil {
		return err
	}

	return s.db.Model(&UsageRecord{}).Where("id = ?", record.ID).Updates(map[string]interface{}{
		"retry_count": gorm.Expr("retry_count + 1"),
		"updated_at":  time.Now(),
	}).Error
}

// AddContainerTime adiciona tempo de container
func (s *UsageService) AddContainerTime(appID uuid.UUID, hours float64, cpuHours float64, memGBHours float64) error {
	record, err := s.GetOrCreateCurrentPeriod(appID)
	if err != nil {
		return err
	}

	return s.db.Model(&UsageRecord{}).Where("id = ?", record.ID).Updates(map[string]interface{}{
		"container_hours":   gorm.Expr("container_hours + ?", hours),
		"cpu_hours":         gorm.Expr("cpu_hours + ?", cpuHours),
		"memory_gb_hours":   gorm.Expr("memory_gb_hours + ?", memGBHours),
		"updated_at":        time.Now(),
	}).Error
}

// GetUsage retorna uso do período
func (s *UsageService) GetUsage(appID uuid.UUID, period time.Time) (*UsageRecord, error) {
	var record UsageRecord
	err := s.db.Where("app_id = ? AND period = ?", appID, period).First(&record).Error
	if err != nil {
		return nil, err
	}
	return &record, nil
}

// GetUsageHistory retorna histórico de uso
func (s *UsageService) GetUsageHistory(appID uuid.UUID, months int) ([]UsageRecord, error) {
	var records []UsageRecord
	cutoff := time.Now().AddDate(0, -months, 0)
	err := s.db.Where("app_id = ? AND period >= ?", appID, cutoff).
		Order("period DESC").
		Find(&records).Error
	return records, err
}

// CheckLimit verifica se está dentro do limite
func (s *UsageService) CheckLimit(appID uuid.UUID, planID string, resource string) (bool, int, int) {
	limit := GetLimit(planID)
	record, _ := s.GetOrCreateCurrentPeriod(appID)

	switch resource {
	case "deploys":
		if limit.MaxDeploysPerDay == -1 {
			return true, record.DeployCount, -1
		}
		return record.DeployCount < limit.MaxDeploysPerDay, record.DeployCount, limit.MaxDeploysPerDay
	default:
		return true, 0, -1
	}
}
