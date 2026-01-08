package kernel_billing

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// KERNEL BILLING ALERT SERVICE - Fase 28.2-B
// "Alertas financeiros do kernel"
// Cenários cobertos: 2, 5, 6, 7, 11, 12, 13, 15
// ========================================

// KernelBillingAlert representa um alerta de billing do kernel
type KernelBillingAlert struct {
	ID           string     `gorm:"primaryKey" json:"id"`
	Type         string     `gorm:"index" json:"type"`
	Severity     string     `gorm:"index" json:"severity"` // critical, high, medium, low
	AppID        string     `gorm:"index" json:"app_id"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	MetadataJSON string     `gorm:"type:text" json:"-"`
	Status       string     `gorm:"default:'open'" json:"status"` // open, acknowledged, resolved
	AcknowledgedAt *time.Time `json:"acknowledged_at,omitempty"`
	AcknowledgedBy string   `json:"acknowledged_by,omitempty"`
	ResolvedAt   *time.Time `json:"resolved_at,omitempty"`
	ResolvedBy   string     `json:"resolved_by,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (KernelBillingAlert) TableName() string {
	return "kernel_billing_alerts"
}

// Metadata retorna metadata parseado
func (a *KernelBillingAlert) Metadata() map[string]interface{} {
	if a.MetadataJSON == "" {
		return make(map[string]interface{})
	}
	var metadata map[string]interface{}
	json.Unmarshal([]byte(a.MetadataJSON), &metadata)
	return metadata
}

// SetMetadata serializa metadata
func (a *KernelBillingAlert) SetMetadata(metadata map[string]interface{}) {
	data, _ := json.Marshal(metadata)
	a.MetadataJSON = string(data)
}

// ========================================
// ALERT SERVICE IMPLEMENTATION
// ========================================

// KernelBillingAlertService implementa KernelAlertService
type KernelBillingAlertService struct {
	db *gorm.DB
}

// NewKernelBillingAlertService cria novo serviço de alertas
func NewKernelBillingAlertService(db *gorm.DB) *KernelBillingAlertService {
	return &KernelBillingAlertService{db: db}
}

// CreateAlert cria um novo alerta
// Implementa interface KernelAlertService
func (s *KernelBillingAlertService) CreateAlert(alertType, severity string, appID string, metadata map[string]interface{}) error {
	alert := KernelBillingAlert{
		ID:        uuid.New().String(),
		Type:      alertType,
		Severity:  severity,
		AppID:     appID,
		Title:     getAlertTitle(alertType),
		Description: getAlertDescription(alertType, metadata),
		Status:    "open",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	alert.SetMetadata(metadata)

	if err := s.db.Create(&alert).Error; err != nil {
		return err
	}

	// Log baseado na severidade
	switch severity {
	case "critical":
		log.Printf("🔴 [KERNEL_ALERT] CRÍTICO: %s - %s (app: %s)", alertType, alert.Description, appID)
	case "high":
		log.Printf("🟠 [KERNEL_ALERT] ALTO: %s - %s (app: %s)", alertType, alert.Description, appID)
	case "medium":
		log.Printf("🟡 [KERNEL_ALERT] MÉDIO: %s - %s (app: %s)", alertType, alert.Description, appID)
	default:
		log.Printf("🟢 [KERNEL_ALERT] BAIXO: %s - %s (app: %s)", alertType, alert.Description, appID)
	}

	return nil
}

// ========================================
// ALERT QUERIES
// ========================================

// GetOpenAlerts retorna alertas abertos
func (s *KernelBillingAlertService) GetOpenAlerts() ([]KernelBillingAlert, error) {
	var alerts []KernelBillingAlert
	err := s.db.Where("status = ?", "open").
		Order("CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, created_at DESC").
		Find(&alerts).Error
	return alerts, err
}

// GetAlertsByApp retorna alertas de um app
func (s *KernelBillingAlertService) GetAlertsByApp(appID string) ([]KernelBillingAlert, error) {
	var alerts []KernelBillingAlert
	err := s.db.Where("app_id = ?", appID).Order("created_at DESC").Find(&alerts).Error
	return alerts, err
}

// GetAlertsByType retorna alertas por tipo
func (s *KernelBillingAlertService) GetAlertsByType(alertType string) ([]KernelBillingAlert, error) {
	var alerts []KernelBillingAlert
	err := s.db.Where("type = ?", alertType).Order("created_at DESC").Find(&alerts).Error
	return alerts, err
}

// GetCriticalAlerts retorna alertas críticos abertos
func (s *KernelBillingAlertService) GetCriticalAlerts() ([]KernelBillingAlert, error) {
	var alerts []KernelBillingAlert
	err := s.db.Where("status = ? AND severity IN (?, ?)", "open", "critical", "high").
		Order("created_at DESC").
		Find(&alerts).Error
	return alerts, err
}

// ========================================
// ALERT ACTIONS
// ========================================

// AcknowledgeAlert marca alerta como reconhecido
func (s *KernelBillingAlertService) AcknowledgeAlert(alertID, acknowledgedBy string) error {
	now := time.Now()
	return s.db.Model(&KernelBillingAlert{}).
		Where("id = ?", alertID).
		Updates(map[string]interface{}{
			"status":          "acknowledged",
			"acknowledged_at": &now,
			"acknowledged_by": acknowledgedBy,
			"updated_at":      now,
		}).Error
}

// ResolveAlert marca alerta como resolvido
func (s *KernelBillingAlertService) ResolveAlert(alertID, resolvedBy string) error {
	now := time.Now()
	return s.db.Model(&KernelBillingAlert{}).
		Where("id = ?", alertID).
		Updates(map[string]interface{}{
			"status":      "resolved",
			"resolved_at": &now,
			"resolved_by": resolvedBy,
			"updated_at":  now,
		}).Error
}

// ResolveAlertsByType resolve todos alertas de um tipo para um app
func (s *KernelBillingAlertService) ResolveAlertsByType(appID, alertType, resolvedBy string) error {
	now := time.Now()
	return s.db.Model(&KernelBillingAlert{}).
		Where("app_id = ? AND type = ? AND status != ?", appID, alertType, "resolved").
		Updates(map[string]interface{}{
			"status":      "resolved",
			"resolved_at": &now,
			"resolved_by": resolvedBy,
			"updated_at":  now,
		}).Error
}

// ========================================
// ALERT STATS
// ========================================

// GetAlertStats retorna estatísticas de alertas
func (s *KernelBillingAlertService) GetAlertStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Por status
	type StatusCount struct {
		Status string
		Count  int64
	}
	var statusCounts []StatusCount
	s.db.Model(&KernelBillingAlert{}).
		Select("status, count(*) as count").
		Group("status").
		Scan(&statusCounts)

	byStatus := map[string]int64{"open": 0, "acknowledged": 0, "resolved": 0}
	for _, sc := range statusCounts {
		byStatus[sc.Status] = sc.Count
	}
	stats["by_status"] = byStatus

	// Por severidade (apenas abertos)
	var severityCounts []struct {
		Severity string
		Count    int64
	}
	s.db.Model(&KernelBillingAlert{}).
		Where("status = ?", "open").
		Select("severity, count(*) as count").
		Group("severity").
		Scan(&severityCounts)

	bySeverity := map[string]int64{"critical": 0, "high": 0, "medium": 0, "low": 0}
	for _, sc := range severityCounts {
		bySeverity[sc.Severity] = sc.Count
	}
	stats["open_by_severity"] = bySeverity

	// Por tipo (últimas 24h)
	var typeCounts []struct {
		Type  string
		Count int64
	}
	s.db.Model(&KernelBillingAlert{}).
		Where("created_at >= ?", time.Now().Add(-24*time.Hour)).
		Select("type, count(*) as count").
		Group("type").
		Scan(&typeCounts)

	byType := make(map[string]int64)
	for _, tc := range typeCounts {
		byType[tc.Type] = tc.Count
	}
	stats["last_24h_by_type"] = byType

	return stats, nil
}

// ========================================
// ALERT HELPERS
// ========================================

// getAlertTitle retorna título baseado no tipo
func getAlertTitle(alertType string) string {
	titles := map[string]string{
		// Cenário 2: Pagamento falhou
		"payment_failed": "Falha no Pagamento",
		
		// Cenário 5: Webhook não chegou
		"reconciliation_diff": "Divergência na Reconciliação",
		
		// Cenário 6: Processamento falhou
		"webhook_processing_failed": "Falha no Processamento de Webhook",
		
		// Cenário 7: Cancelamento externo
		"subscription_canceled_externally": "Assinatura Cancelada Externamente",
		"subscription_deleted": "Assinatura Deletada",
		
		// Cenário 11: Stripe indisponível
		"stripe_outage": "Stripe Indisponível",
		"circuit_breaker_open": "Circuit Breaker Aberto",
		
		// Cenário 12: Double charge
		"possible_double_charge": "Possível Cobrança Duplicada",
		
		// Cenário 13: Divergência
		"reconciliation_divergence": "Divergência Detectada",
		
		// Cenário 14: Quota excedida em past_due
		"quota_exceeded_past_due": "Quota Excedida com Pagamento Pendente",
		
		// Cenário 15: Webhook órfão
		"orphan_webhook": "Webhook Órfão",
	}

	if title, ok := titles[alertType]; ok {
		return title
	}
	return "Alerta de Billing"
}

// getAlertDescription retorna descrição baseada no tipo e metadata
func getAlertDescription(alertType string, metadata map[string]interface{}) string {
	switch alertType {
	case "payment_failed":
		invoiceID, _ := metadata["invoice_id"].(string)
		amount, _ := metadata["amount"].(float64)
		return formatDescription("Pagamento da invoice %s (R$ %.2f) falhou", invoiceID, amount/100)

	case "possible_double_charge":
		invoiceID, _ := metadata["invoice_id"].(string)
		amount, _ := metadata["amount"].(float64)
		return formatDescription("Possível cobrança duplicada detectada: invoice %s, valor R$ %.2f. REQUER REVISÃO MANUAL.", invoiceID, amount/100)

	case "subscription_canceled_externally":
		return "Assinatura foi cancelada diretamente no Stripe, não pelo kernel."

	case "orphan_webhook":
		eventType, _ := metadata["event_type"].(string)
		reason, _ := metadata["reason"].(string)
		return formatDescription("Webhook %s recebido sem app válido: %s", eventType, reason)

	case "reconciliation_divergence":
		description, _ := metadata["description"].(string)
		return description

	case "quota_exceeded_past_due":
		return "App excedeu quota de transações enquanto está com pagamento pendente."

	case "circuit_breaker_open":
		return "Circuit breaker do Stripe aberto. Operações de billing temporariamente indisponíveis."

	default:
		return "Alerta de billing requer atenção."
	}
}

// formatDescription formata descrição com argumentos
func formatDescription(format string, args ...interface{}) string {
	if len(args) == 0 {
		return format
	}
	return fmt.Sprintf(format, args...)
}
