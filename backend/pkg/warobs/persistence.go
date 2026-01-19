package warobs

import (
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// PERSISTENCE SELETIVA - Movimento 2
// "O Kernel lembra apenas o que importa"
// ========================================

// IncidentSeverity define gravidade do incidente
type IncidentSeverity string

const (
	SeverityWarning  IncidentSeverity = "WARNING"
	SeverityHigh     IncidentSeverity = "HIGH"
	SeverityCritical IncidentSeverity = "CRITICAL"
)

// IncidentTrigger define o que causou o incidente
type IncidentTrigger string

const (
	TriggerErrorRate  IncidentTrigger = "ERROR_RATE"
	TriggerLatency    IncidentTrigger = "LATENCY"
	TriggerMemory     IncidentTrigger = "MEMORY"
	TriggerGoroutines IncidentTrigger = "GOROUTINES"
	TriggerManual     IncidentTrigger = "MANUAL"
)

// ========================================
// MODELS (Tabelas)
// ========================================

// Incident representa um incidente detectado pelo sistema
type Incident struct {
	ID          uuid.UUID        `gorm:"type:uuid;primaryKey" json:"id"`
	Severity    IncidentSeverity `gorm:"type:varchar(20);not null;index" json:"severity"`
	Trigger     IncidentTrigger  `gorm:"type:varchar(50);not null" json:"trigger"`
	Description string           `gorm:"type:text" json:"description"`

	// Valores métricos
	MetricName  string  `json:"metric_name"`
	MetricValue float64 `json:"metric_value"`
	Threshold   float64 `json:"threshold"`

	// Contexto
	AffectedService string   `json:"affected_service"`
	AffectedRoutes  []string `gorm:"type:jsonb;serializer:json" json:"affected_routes"`

	// Timestamps
	StartedAt  time.Time  `gorm:"not null;index" json:"started_at"`
	ResolvedAt *time.Time `json:"resolved_at,omitempty"`

	// Estado
	Status string `gorm:"type:varchar(20);default:'OPEN';index" json:"status"` // OPEN, RESOLVED

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// Anomaly representa um pico ou comportamento anômalo
type Anomaly struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	MetricName string    `gorm:"type:varchar(50);not null;index" json:"metric_name"`

	// Valores
	BaselineValue    float64 `json:"baseline_value"`
	ObservedValue    float64 `json:"observed_value"`
	DeviationPercent float64 `json:"deviation_percent"`

	DetectionMethod string  `json:"detection_method"` // threshold | stddev | heuristic
	Confidence      float64 `json:"confidence"`       // 0 to 1

	// Janela
	WindowStart time.Time `json:"window_start"`
	WindowEnd   time.Time `json:"window_end"`

	Notes string `gorm:"type:text" json:"notes"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// KernelEvent representa o diário de pensamento do Kernel
type KernelEvent struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	EventType string    `gorm:"type:varchar(50);not null;index" json:"event_type"`
	Source    string    `gorm:"type:varchar(50);not null" json:"source"` // warobs | policy_engine | ai | admin

	Description       string     `gorm:"type:text" json:"description"`
	RelatedIncidentID *uuid.UUID `gorm:"type:uuid" json:"related_incident_id,omitempty"`

	Metadata string `gorm:"type:jsonb" json:"metadata,omitempty"` // JSONB

	CreatedAt time.Time `gorm:"autoCreateTime;index" json:"created_at"`
}

// ========================================
// PERSISTENCE SERVICE
// ========================================

// PersistenceService gerencia a escrita seletiva no banco
type PersistenceService struct {
	db      *gorm.DB
	enabled bool

	// Debounce para evitar spam
	lastIncident   map[IncidentTrigger]time.Time
	incidentMu     sync.RWMutex
	debounceWindow time.Duration // Mínimo entre incidentes do mesmo tipo
}

// NewPersistenceService cria o serviço de persistência
func NewPersistenceService(db *gorm.DB) *PersistenceService {
	if db == nil {
		return &PersistenceService{enabled: false}
	}

	return &PersistenceService{
		db:             db,
		enabled:        true,
		lastIncident:   make(map[IncidentTrigger]time.Time),
		debounceWindow: 5 * time.Minute, // Não registrar mesmo incidente em menos de 5 min
	}
}

// Migrate cria as tabelas se não existirem
func (p *PersistenceService) Migrate() error {
	if !p.enabled {
		return nil
	}
	return p.db.AutoMigrate(&Incident{}, &Anomaly{}, &KernelEvent{})
}

// ========================================
// INCIDENT METHODS
// ========================================

// ShouldRecordIncident verifica se devemos registrar (debounce)
func (p *PersistenceService) ShouldRecordIncident(trigger IncidentTrigger) bool {
	if !p.enabled {
		return false
	}

	p.incidentMu.RLock()
	lastTime, exists := p.lastIncident[trigger]
	p.incidentMu.RUnlock()

	if !exists {
		return true
	}

	return time.Since(lastTime) > p.debounceWindow
}

// RecordIncident registra um incidente no banco
func (p *PersistenceService) RecordIncident(severity IncidentSeverity, trigger IncidentTrigger, metricName string, value, threshold float64, description string, routes []string) (*Incident, error) {
	if !p.enabled {
		return nil, nil
	}

	// Debounce check
	if !p.ShouldRecordIncident(trigger) {
		return nil, nil
	}

	incident := &Incident{
		ID:              uuid.New(),
		Severity:        severity,
		Trigger:         trigger,
		MetricName:      metricName,
		MetricValue:     value,
		Threshold:       threshold,
		Description:     description,
		AffectedService: "prost-qs-kernel",
		AffectedRoutes:  routes,
		StartedAt:       time.Now(),
		Status:          "OPEN",
	}

	if err := p.db.Create(incident).Error; err != nil {
		return nil, err
	}

	// Update debounce
	p.incidentMu.Lock()
	p.lastIncident[trigger] = time.Now()
	p.incidentMu.Unlock()

	return incident, nil
}

// ResolveIncident marca um incidente como resolvido
func (p *PersistenceService) ResolveIncident(incidentID uuid.UUID, resolvedBy string) error {
	if !p.enabled {
		return nil
	}

	now := time.Now()
	return p.db.Model(&Incident{}).
		Where("id = ? AND status = ?", incidentID, "OPEN").
		Updates(map[string]interface{}{
			"status":      "RESOLVED",
			"resolved_at": now,
		}).Error
}

// AutoResolveOldIncidents resolve incidentes que ficaram ativos por muito tempo
func (p *PersistenceService) AutoResolveOldIncidents(maxAge time.Duration) (int64, error) {
	if !p.enabled {
		return 0, nil
	}

	now := time.Now()
	cutoff := now.Add(-maxAge)

	result := p.db.Model(&Incident{}).
		Where("status = ? AND started_at < ?", "OPEN", cutoff).
		Updates(map[string]interface{}{
			"status":      "RESOLVED",
			"resolved_at": now,
		})

	return result.RowsAffected, result.Error
}

// GetActiveIncidents retorna incidentes ativos
func (p *PersistenceService) GetActiveIncidents() ([]Incident, error) {
	if !p.enabled {
		return nil, nil
	}

	var incidents []Incident
	err := p.db.Where("status = ?", "OPEN").Order("started_at DESC").Find(&incidents).Error
	return incidents, err
}

// GetRecentIncidents retorna incidentes recentes (últimas N horas)
func (p *PersistenceService) GetRecentIncidents(hours int) ([]Incident, error) {
	if !p.enabled {
		return nil, nil
	}

	cutoff := time.Now().Add(-time.Duration(hours) * time.Hour)
	var incidents []Incident
	err := p.db.Where("started_at > ?", cutoff).Order("started_at DESC").Find(&incidents).Error
	return incidents, err
}

// ========================================
// ANOMALY METHODS
// ========================================

// RecordAnomaly registra uma anomalia
func (p *PersistenceService) RecordAnomaly(metricName string, baseline, peak, confidence float64, detectionMethod string, notes string) (*Anomaly, error) {
	if !p.enabled {
		return nil, nil
	}

	deviation := 0.0
	if baseline > 0 {
		deviation = ((peak - baseline) / baseline) * 100
	}

	anomaly := &Anomaly{
		ID:               uuid.New(),
		MetricName:       metricName,
		BaselineValue:    baseline,
		ObservedValue:    peak,
		DeviationPercent: deviation,
		DetectionMethod:  detectionMethod,
		Confidence:       confidence,
		WindowStart:      time.Now().Add(-1 * time.Minute),
		WindowEnd:        time.Now(),
		Notes:            notes,
	}

	if err := p.db.Create(anomaly).Error; err != nil {
		return nil, err
	}

	return anomaly, nil
}

// EndAnomaly marca fim de uma anomalia
func (p *PersistenceService) EndAnomaly(anomalyID uuid.UUID) error {
	if !p.enabled {
		return nil
	}

	now := time.Now()

	// Calcular duração
	var anomaly Anomaly
	if err := p.db.First(&anomaly, "id = ?", anomalyID).Error; err != nil {
		return err
	}

	// The new Anomaly struct does not have 'ended_at' or 'duration_sec'.
	// Assuming 'WindowEnd' can be updated to mark the end of the anomaly.
	// The 'duration_sec' calculation is no longer directly applicable for a single field update.
	// If duration is needed, it should be calculated from WindowStart and WindowEnd when retrieved.
	return p.db.Model(&Anomaly{}).
		Where("id = ?", anomalyID).
		Updates(map[string]interface{}{
			"window_end": now, // Update WindowEnd to mark the end
		}).Error
}

// ========================================
// KERNEL EVENT METHODS
// ========================================

// RecordKernelEvent registra uma decisão/mudança do kernel
func (p *PersistenceService) RecordKernelEvent(eventType, source, description string, incidentID *uuid.UUID, metadata map[string]interface{}) (*KernelEvent, error) {
	if !p.enabled {
		return nil, nil
	}

	metadataJSON := ""
	if metadata != nil {
		metadataJSON = mapToJSON(metadata)
	}

	event := &KernelEvent{
		ID:                uuid.New(),
		EventType:         eventType,
		Source:            source,
		Description:       description,
		RelatedIncidentID: incidentID,
		Metadata:          metadataJSON,
	}

	if err := p.db.Create(event).Error; err != nil {
		return nil, err
	}

	return event, nil
}

// GetRecentKernelEvents retorna eventos recentes do kernel
func (p *PersistenceService) GetRecentKernelEvents(limit int) ([]KernelEvent, error) {
	if !p.enabled {
		return nil, nil
	}

	var events []KernelEvent
	err := p.db.Order("created_at DESC").Limit(limit).Find(&events).Error
	return events, err
}

// ========================================
// HELPER
// ========================================

func mapToJSON(m map[string]interface{}) string {
	// Simple serialization without external deps in this file
	result := "{"
	first := true
	for k, v := range m {
		if !first {
			result += ","
		}
		result += `"` + k + `":`
		switch val := v.(type) {
		case string:
			result += `"` + val + `"`
		case int, int64, float64:
			result += stringFromNumber(val)
		case bool:
			if val {
				result += "true"
			} else {
				result += "false"
			}
		default:
			result += `"unknown"`
		}
		first = false
	}
	result += "}"
	return result
}

func stringFromNumber(v interface{}) string {
	switch n := v.(type) {
	case int:
		return intToString(n)
	case int64:
		return intToString(int(n))
	case float64:
		return floatToString(n)
	}
	return "0"
}

func intToString(n int) string {
	if n == 0 {
		return "0"
	}
	sign := ""
	if n < 0 {
		sign = "-"
		n = -n
	}
	result := ""
	for n > 0 {
		result = string(rune('0'+n%10)) + result
		n /= 10
	}
	return sign + result
}

func floatToString(f float64) string {
	// Simple float to string (2 decimal places)
	intPart := int(f)
	fracPart := int((f - float64(intPart)) * 100)
	if fracPart < 0 {
		fracPart = -fracPart
	}
	return intToString(intPart) + "." + intToString(fracPart)
}
