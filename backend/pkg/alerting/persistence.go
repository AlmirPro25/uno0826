package alerting

import (
	"encoding/json"
	"log"
	"time"

	"gorm.io/gorm"
)

// ========================================
// ALERT PERSISTENCE
// "Alertas sobrevivem a restarts"
// ========================================

// AlertRecord is the database model for alerts
type AlertRecord struct {
	ID          string    `gorm:"primaryKey;size:36"`
	Type        string    `gorm:"size:50;index"`
	Severity    string    `gorm:"size:20;index"`
	Title       string    `gorm:"size:255"`
	Message     string    `gorm:"type:text"`
	Source      string    `gorm:"size:255;index"`
	Tags        string    `gorm:"type:text"` // JSON
	Value       float64
	Threshold   float64
	Count       int
	CreatedAt   time.Time `gorm:"index"`
	ResolvedAt  *time.Time
	AckedAt     *time.Time
	AckedBy     string `gorm:"size:255"`
	LastSeen    time.Time
}

// TableName returns the table name for AlertRecord
func (AlertRecord) TableName() string {
	return "alert_records"
}

// AlertPersistence handles alert storage in database
type AlertPersistence struct {
	db      *gorm.DB
	enabled bool
}

// NewAlertPersistence creates a new alert persistence handler
func NewAlertPersistence(db *gorm.DB) *AlertPersistence {
	if db == nil {
		return &AlertPersistence{enabled: false}
	}

	// Auto-migrate the schema
	if err := db.AutoMigrate(&AlertRecord{}); err != nil {
		log.Printf("[ALERT PERSISTENCE] Failed to migrate schema: %v", err)
		return &AlertPersistence{enabled: false}
	}

	log.Println("✅ Alert Persistence initialized")
	return &AlertPersistence{
		db:      db,
		enabled: true,
	}
}

// IsEnabled returns whether persistence is enabled
func (p *AlertPersistence) IsEnabled() bool {
	return p.enabled
}

// Save persists an alert to the database
func (p *AlertPersistence) Save(alert *Alert) error {
	if !p.enabled {
		return nil
	}

	tagsJSON, _ := json.Marshal(alert.Tags)

	record := AlertRecord{
		ID:        alert.ID,
		Type:      string(alert.Type),
		Severity:  string(alert.Severity),
		Title:     alert.Title,
		Message:   alert.Message,
		Source:    alert.Source,
		Tags:      string(tagsJSON),
		Value:     alert.Value,
		Threshold: alert.Threshold,
		Count:     alert.Count,
		CreatedAt: alert.CreatedAt,
		LastSeen:  alert.LastSeen,
	}

	return p.db.Save(&record).Error
}

// Update updates an existing alert
func (p *AlertPersistence) Update(alert *Alert) error {
	if !p.enabled {
		return nil
	}

	updates := map[string]interface{}{
		"count":       alert.Count,
		"last_seen":   alert.LastSeen,
		"resolved_at": alert.ResolvedAt,
		"acked_at":    alert.AckedAt,
		"acked_by":    alert.AckedBy,
	}

	return p.db.Model(&AlertRecord{}).Where("id = ?", alert.ID).Updates(updates).Error
}

// Resolve marks an alert as resolved
func (p *AlertPersistence) Resolve(alertID string) error {
	if !p.enabled {
		return nil
	}

	now := time.Now()
	return p.db.Model(&AlertRecord{}).Where("id = ?", alertID).Update("resolved_at", now).Error
}

// Acknowledge marks an alert as acknowledged
func (p *AlertPersistence) Acknowledge(alertID, ackedBy string) error {
	if !p.enabled {
		return nil
	}

	now := time.Now()
	return p.db.Model(&AlertRecord{}).Where("id = ?", alertID).Updates(map[string]interface{}{
		"acked_at": now,
		"acked_by": ackedBy,
	}).Error
}

// LoadActive loads all active (unresolved) alerts from database
func (p *AlertPersistence) LoadActive() ([]*Alert, error) {
	if !p.enabled {
		return nil, nil
	}

	var records []AlertRecord
	if err := p.db.Where("resolved_at IS NULL").Find(&records).Error; err != nil {
		return nil, err
	}

	alerts := make([]*Alert, 0, len(records))
	for _, record := range records {
		alert := p.recordToAlert(&record)
		alerts = append(alerts, alert)
	}

	return alerts, nil
}

// LoadHistory loads alert history
func (p *AlertPersistence) LoadHistory(limit int) ([]*Alert, error) {
	if !p.enabled {
		return nil, nil
	}

	var records []AlertRecord
	if err := p.db.Order("created_at DESC").Limit(limit).Find(&records).Error; err != nil {
		return nil, err
	}

	alerts := make([]*Alert, 0, len(records))
	for _, record := range records {
		alert := p.recordToAlert(&record)
		alerts = append(alerts, alert)
	}

	return alerts, nil
}

// GetStats returns statistics from persisted alerts
func (p *AlertPersistence) GetStats() (*PersistenceStats, error) {
	if !p.enabled {
		return &PersistenceStats{}, nil
	}

	stats := &PersistenceStats{}

	// Total alerts
	p.db.Model(&AlertRecord{}).Count(&stats.TotalAlerts)

	// Active alerts
	p.db.Model(&AlertRecord{}).Where("resolved_at IS NULL").Count(&stats.ActiveAlerts)

	// Resolved alerts
	p.db.Model(&AlertRecord{}).Where("resolved_at IS NOT NULL").Count(&stats.ResolvedAlerts)

	// Last 24 hours
	yesterday := time.Now().Add(-24 * time.Hour)
	p.db.Model(&AlertRecord{}).Where("created_at > ?", yesterday).Count(&stats.Last24Hours)

	// By severity
	var severityCounts []struct {
		Severity string
		Count    int64
	}
	p.db.Model(&AlertRecord{}).
		Select("severity, count(*) as count").
		Where("resolved_at IS NULL").
		Group("severity").
		Scan(&severityCounts)

	stats.BySeverity = make(map[string]int64)
	for _, sc := range severityCounts {
		stats.BySeverity[sc.Severity] = sc.Count
	}

	return stats, nil
}

// PersistenceStats holds persistence statistics
type PersistenceStats struct {
	TotalAlerts    int64            `json:"total_alerts"`
	ActiveAlerts   int64            `json:"active_alerts"`
	ResolvedAlerts int64            `json:"resolved_alerts"`
	Last24Hours    int64            `json:"last_24_hours"`
	BySeverity     map[string]int64 `json:"by_severity"`
}

// Cleanup removes old resolved alerts
func (p *AlertPersistence) Cleanup(olderThan time.Duration) (int64, error) {
	if !p.enabled {
		return 0, nil
	}

	cutoff := time.Now().Add(-olderThan)
	result := p.db.Where("resolved_at IS NOT NULL AND resolved_at < ?", cutoff).Delete(&AlertRecord{})
	return result.RowsAffected, result.Error
}

// recordToAlert converts a database record to an Alert
func (p *AlertPersistence) recordToAlert(record *AlertRecord) *Alert {
	var tags map[string]string
	if record.Tags != "" {
		json.Unmarshal([]byte(record.Tags), &tags)
	}

	return &Alert{
		ID:         record.ID,
		Type:       AlertType(record.Type),
		Severity:   AlertSeverity(record.Severity),
		Title:      record.Title,
		Message:    record.Message,
		Source:     record.Source,
		Tags:       tags,
		Value:      record.Value,
		Threshold:  record.Threshold,
		Count:      record.Count,
		CreatedAt:  record.CreatedAt,
		ResolvedAt: record.ResolvedAt,
		AckedAt:    record.AckedAt,
		AckedBy:    record.AckedBy,
		LastSeen:   record.LastSeen,
	}
}

// ========================================
// ENGINE INTEGRATION
// ========================================

// SetPersistence sets the persistence handler for the engine
func (e *AlertEngine) SetPersistence(p *AlertPersistence) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.persistence = p

	// Load active alerts from database
	if p != nil && p.IsEnabled() {
		alerts, err := p.LoadActive()
		if err != nil {
			log.Printf("[ALERT ENGINE] Failed to load active alerts: %v", err)
			return
		}

		for _, alert := range alerts {
			dedupKey := getDedupKey(alert.Type, alert.Source, alert.Title)
			e.alerts[dedupKey] = alert
			e.lastAlerts[dedupKey] = alert.LastSeen
		}

		log.Printf("[ALERT ENGINE] Loaded %d active alerts from database", len(alerts))
	}
}

// Helper to get dedup key
func getDedupKey(alertType AlertType, source, title string) string {
	return string(alertType) + ":" + source + ":" + title
}
