package financial

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// ========================================
// FINANCIAL ALERTS - Fase 27.2.3
// "Sistema sem alertas é sistema cego"
// ========================================

// AlertType tipos de alerta financeiro
type AlertType string

const (
	AlertRevenueDropped       AlertType = "revenue_dropped"        // Queda de receita
	AlertWebhookFailures      AlertType = "webhook_failures"       // Falhas de webhook
	AlertReconciliationDiff   AlertType = "reconciliation_diff"    // Divergência na reconciliação
	AlertHighRefundRate       AlertType = "high_refund_rate"       // Taxa alta de reembolsos
	AlertPaymentFailures      AlertType = "payment_failures"       // Muitos pagamentos falhando
	AlertRateLimitExceeded    AlertType = "rate_limit_exceeded"    // Rate limit excedido
	AlertDisputeCreated       AlertType = "dispute_created"        // Disputa criada
	AlertNoRevenueToday       AlertType = "no_revenue_today"       // Sem receita hoje
	AlertAnomalyDetected      AlertType = "anomaly_detected"       // Anomalia detectada
)

// AlertSeverity severidade do alerta
type AlertSeverity string

const (
	SeverityInfo     AlertSeverity = "info"
	SeverityWarning  AlertSeverity = "warning"
	SeverityCritical AlertSeverity = "critical"
)

// FinancialAlert alerta financeiro
type FinancialAlert struct {
	ID          uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	Type        AlertType      `gorm:"type:text;not null;index" json:"type"`
	AppID       *uuid.UUID     `gorm:"type:text;index" json:"app_id,omitempty"` // nil = global
	Severity    AlertSeverity  `gorm:"type:text;not null;index" json:"severity"`
	Value       float64        `json:"value"`                                   // Valor atual
	Threshold   float64        `json:"threshold"`                               // Threshold que disparou
	Message     string         `gorm:"type:text" json:"message"`
	Metadata    datatypes.JSON `gorm:"type:text" json:"metadata,omitempty"`
	IsResolved  bool           `gorm:"default:false;index" json:"is_resolved"`
	ResolvedAt  *time.Time     `json:"resolved_at,omitempty"`
	ResolvedBy  string         `gorm:"type:text" json:"resolved_by,omitempty"`
	CreatedAt   time.Time      `gorm:"not null;index" json:"created_at"`
}

func (FinancialAlert) TableName() string {
	return "financial_alerts"
}

// AlertThreshold configuração de threshold para alertas
type AlertThreshold struct {
	ID          uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	Type        AlertType      `gorm:"type:text;not null;uniqueIndex:idx_threshold_type_app" json:"type"`
	AppID       *uuid.UUID     `gorm:"type:text;uniqueIndex:idx_threshold_type_app" json:"app_id,omitempty"` // nil = global
	Threshold   float64        `json:"threshold"`
	Severity    AlertSeverity  `gorm:"type:text;not null" json:"severity"`
	IsEnabled   bool           `gorm:"default:true" json:"is_enabled"`
	Description string         `gorm:"type:text" json:"description"`
	CreatedAt   time.Time      `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time      `gorm:"not null" json:"updated_at"`
}

func (AlertThreshold) TableName() string {
	return "alert_thresholds"
}

// ========================================
// ALERT SERVICE
// ========================================

type AlertService struct {
	db *gorm.DB
}

func NewAlertService(db *gorm.DB) *AlertService {
	return &AlertService{db: db}
}

// AlertInput input para criar alerta
type AlertInput struct {
	Type      AlertType
	AppID     *uuid.UUID
	Severity  AlertSeverity
	Value     float64
	Threshold float64
	Message   string
	Metadata  map[string]interface{}
}

// CreateAlert cria novo alerta
func (s *AlertService) CreateAlert(input AlertInput) (*FinancialAlert, error) {
	var metadata datatypes.JSON
	if input.Metadata != nil {
		data, _ := json.Marshal(input.Metadata)
		metadata = datatypes.JSON(data)
	}

	alert := &FinancialAlert{
		ID:        uuid.New(),
		Type:      input.Type,
		AppID:     input.AppID,
		Severity:  input.Severity,
		Value:     input.Value,
		Threshold: input.Threshold,
		Message:   input.Message,
		Metadata:  metadata,
		CreatedAt: time.Now(),
	}

	if err := s.db.Create(alert).Error; err != nil {
		return nil, err
	}

	return alert, nil
}

// ResolveAlert marca alerta como resolvido
func (s *AlertService) ResolveAlert(id uuid.UUID, resolvedBy string) error {
	now := time.Now()
	return s.db.Model(&FinancialAlert{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"is_resolved": true,
			"resolved_at": &now,
			"resolved_by": resolvedBy,
		}).Error
}

// GetActiveAlerts retorna alertas não resolvidos
func (s *AlertService) GetActiveAlerts(appID *uuid.UUID, limit int) ([]FinancialAlert, error) {
	var alerts []FinancialAlert
	query := s.db.Where("is_resolved = ?", false)
	
	if appID != nil {
		query = query.Where("app_id = ? OR app_id IS NULL", appID)
	}
	
	err := query.Order("created_at DESC").Limit(limit).Find(&alerts).Error
	return alerts, err
}

// GetAlertsByType retorna alertas por tipo
func (s *AlertService) GetAlertsByType(alertType AlertType, since time.Time) ([]FinancialAlert, error) {
	var alerts []FinancialAlert
	err := s.db.Where("type = ? AND created_at >= ?", alertType, since).
		Order("created_at DESC").
		Find(&alerts).Error
	return alerts, err
}

// GetAlertStats retorna estatísticas de alertas
func (s *AlertService) GetAlertStats(since time.Time) (*AlertStats, error) {
	stats := &AlertStats{
		BySeverity: make(map[AlertSeverity]int64),
		ByType:     make(map[AlertType]int64),
	}

	// Total
	s.db.Model(&FinancialAlert{}).Where("created_at >= ?", since).Count(&stats.Total)

	// Não resolvidos
	s.db.Model(&FinancialAlert{}).Where("created_at >= ? AND is_resolved = ?", since, false).Count(&stats.Unresolved)

	// Por severidade
	type SeverityResult struct {
		Severity AlertSeverity
		Count    int64
	}
	var severityResults []SeverityResult
	s.db.Model(&FinancialAlert{}).
		Where("created_at >= ?", since).
		Select("severity, count(*) as count").
		Group("severity").
		Scan(&severityResults)
	for _, r := range severityResults {
		stats.BySeverity[r.Severity] = r.Count
	}

	// Por tipo
	type TypeResult struct {
		Type  AlertType
		Count int64
	}
	var typeResults []TypeResult
	s.db.Model(&FinancialAlert{}).
		Where("created_at >= ?", since).
		Select("type, count(*) as count").
		Group("type").
		Scan(&typeResults)
	for _, r := range typeResults {
		stats.ByType[r.Type] = r.Count
	}

	return stats, nil
}

type AlertStats struct {
	Total      int64                     `json:"total"`
	Unresolved int64                     `json:"unresolved"`
	BySeverity map[AlertSeverity]int64   `json:"by_severity"`
	ByType     map[AlertType]int64       `json:"by_type"`
}

// ========================================
// THRESHOLD MANAGEMENT
// ========================================

// GetThreshold retorna threshold para um tipo de alerta
func (s *AlertService) GetThreshold(alertType AlertType, appID *uuid.UUID) (*AlertThreshold, error) {
	var threshold AlertThreshold
	
	// Primeiro tenta threshold específico do app
	if appID != nil {
		if err := s.db.Where("type = ? AND app_id = ? AND is_enabled = ?", alertType, appID, true).First(&threshold).Error; err == nil {
			return &threshold, nil
		}
	}
	
	// Fallback para threshold global
	if err := s.db.Where("type = ? AND app_id IS NULL AND is_enabled = ?", alertType, true).First(&threshold).Error; err != nil {
		return nil, err
	}
	return &threshold, nil
}

// SetThreshold define ou atualiza threshold
func (s *AlertService) SetThreshold(alertType AlertType, appID *uuid.UUID, threshold float64, severity AlertSeverity, description string) error {
	var existing AlertThreshold
	query := s.db.Where("type = ?", alertType)
	if appID != nil {
		query = query.Where("app_id = ?", appID)
	} else {
		query = query.Where("app_id IS NULL")
	}

	if err := query.First(&existing).Error; err != nil {
		// Criar novo
		newThreshold := AlertThreshold{
			ID:          uuid.New(),
			Type:        alertType,
			AppID:       appID,
			Threshold:   threshold,
			Severity:    severity,
			Description: description,
			IsEnabled:   true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		return s.db.Create(&newThreshold).Error
	}

	// Atualizar existente
	return s.db.Model(&existing).Updates(map[string]interface{}{
		"threshold":   threshold,
		"severity":    severity,
		"description": description,
		"updated_at":  time.Now(),
	}).Error
}

// InitDefaultThresholds inicializa thresholds padrão
func (s *AlertService) InitDefaultThresholds() error {
	defaults := []struct {
		Type        AlertType
		Threshold   float64
		Severity    AlertSeverity
		Description string
	}{
		{AlertRevenueDropped, 50.0, SeverityWarning, "Queda de receita > 50% vs dia anterior"},
		{AlertWebhookFailures, 10.0, SeverityWarning, "Taxa de falha de webhook > 10%"},
		{AlertReconciliationDiff, 0.0, SeverityCritical, "Qualquer divergência na reconciliação"},
		{AlertHighRefundRate, 5.0, SeverityWarning, "Taxa de reembolso > 5%"},
		{AlertPaymentFailures, 20.0, SeverityWarning, "Taxa de falha de pagamento > 20%"},
		{AlertRateLimitExceeded, 60.0, SeverityWarning, "Rate limit excedido"},
		{AlertDisputeCreated, 0.0, SeverityCritical, "Qualquer disputa criada"},
		{AlertNoRevenueToday, 0.0, SeverityInfo, "Nenhuma receita registrada hoje"},
	}

	for _, d := range defaults {
		var existing AlertThreshold
		if err := s.db.Where("type = ? AND app_id IS NULL", d.Type).First(&existing).Error; err != nil {
			// Não existe, criar
			threshold := AlertThreshold{
				ID:          uuid.New(),
				Type:        d.Type,
				Threshold:   d.Threshold,
				Severity:    d.Severity,
				Description: d.Description,
				IsEnabled:   true,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}
			s.db.Create(&threshold)
		}
	}

	return nil
}

// ========================================
// ALERT CHECKER (Background Job)
// ========================================

// CheckRevenueDropAlert verifica queda de receita
func (s *AlertService) CheckRevenueDropAlert(metricsService *MetricsService) error {
	// Buscar métricas de todos os apps
	var metrics []AppFinancialMetrics
	if err := s.db.Find(&metrics).Error; err != nil {
		return err
	}

	threshold, _ := s.GetThreshold(AlertRevenueDropped, nil)
	if threshold == nil {
		return nil
	}

	for _, m := range metrics {
		// Comparar receita de hoje vs 7 dias atrás
		if m.Revenue7d > 0 {
			avgDaily := float64(m.Revenue7d) / 7.0
			todayRevenue := float64(m.RevenueToday)
			
			if avgDaily > 0 {
				dropPercent := ((avgDaily - todayRevenue) / avgDaily) * 100
				
				if dropPercent > threshold.Threshold {
					s.CreateAlert(AlertInput{
						Type:      AlertRevenueDropped,
						AppID:     &m.AppID,
						Severity:  threshold.Severity,
						Value:     dropPercent,
						Threshold: threshold.Threshold,
						Message:   "Queda de receita detectada",
						Metadata: map[string]interface{}{
							"today_revenue":   todayRevenue,
							"avg_daily":       avgDaily,
							"drop_percent":    dropPercent,
						},
					})
				}
			}
		}
	}

	return nil
}

// CheckWebhookFailuresAlert verifica taxa de falha de webhooks
func (s *AlertService) CheckWebhookFailuresAlert(idempotencyService *IdempotencyService) error {
	since := time.Now().Add(-24 * time.Hour)
	stats, err := idempotencyService.GetStats(since)
	if err != nil {
		return err
	}

	threshold, _ := s.GetThreshold(AlertWebhookFailures, nil)
	if threshold == nil {
		return nil
	}

	total := stats["total"]
	failed := stats["failed"]

	if total > 0 {
		failRate := (float64(failed) / float64(total)) * 100
		
		if failRate > threshold.Threshold {
			s.CreateAlert(AlertInput{
				Type:      AlertWebhookFailures,
				Severity:  threshold.Severity,
				Value:     failRate,
				Threshold: threshold.Threshold,
				Message:   "Taxa alta de falhas em webhooks",
				Metadata: map[string]interface{}{
					"total":       total,
					"failed":      failed,
					"fail_rate":   failRate,
					"window":      "24h",
				},
			})
		}
	}

	return nil
}

// CheckReconciliationAlert verifica divergências de reconciliação
func (s *AlertService) CheckReconciliationAlert() error {
	// Buscar reconciliações com divergência nas últimas 24h
	var mismatched []ReconciliationResult
	since := time.Now().Add(-24 * time.Hour)
	
	if err := s.db.Where("status = ? AND executed_at >= ?", "mismatched", since).Find(&mismatched).Error; err != nil {
		return err
	}

	threshold, _ := s.GetThreshold(AlertReconciliationDiff, nil)
	if threshold == nil {
		return nil
	}

	for _, r := range mismatched {
		// Verificar se já existe alerta para esta reconciliação
		var existing FinancialAlert
		if err := s.db.Where("type = ? AND metadata LIKE ?", AlertReconciliationDiff, "%"+r.ID.String()+"%").First(&existing).Error; err == nil {
			continue // Já existe alerta
		}

		s.CreateAlert(AlertInput{
			Type:      AlertReconciliationDiff,
			AppID:     &r.AppID,
			Severity:  threshold.Severity,
			Value:     float64(r.DiscrepancyCount),
			Threshold: threshold.Threshold,
			Message:   "Divergência detectada na reconciliação",
			Metadata: map[string]interface{}{
				"reconciliation_id":  r.ID.String(),
				"discrepancy_count":  r.DiscrepancyCount,
				"revenue_diff":       r.RevenueDiff,
				"ledger_revenue":     r.LedgerRevenue,
				"provider_revenue":   r.ProviderRevenue,
			},
		})
	}

	return nil
}
