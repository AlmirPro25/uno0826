package webhook

/*
================================================================================
WEBHOOK STATS — Estatísticas de Entrega de Webhooks
================================================================================

Métricas de observabilidade para webhooks:
- Taxa de sucesso/falha
- Latência de entrega
- Endpoints mais ativos
- Retries por endpoint

"Webhook enviado não é webhook entregue."

================================================================================
*/

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WebhookStatsService serviço de estatísticas
type WebhookStatsService struct {
	db *gorm.DB
}

// NewWebhookStatsService cria novo serviço
func NewWebhookStatsService(db *gorm.DB) *WebhookStatsService {
	return &WebhookStatsService{db: db}
}

// WebhookSystemStats estatísticas gerais
type WebhookSystemStats struct {
	TotalEndpoints      int64              `json:"total_endpoints"`
	ActiveEndpoints     int64              `json:"active_endpoints"`
	TotalDeliveries     int64              `json:"total_deliveries"`
	SuccessfulDeliveries int64             `json:"successful_deliveries"`
	FailedDeliveries    int64              `json:"failed_deliveries"`
	SuccessRate         float64            `json:"success_rate"`
	DeliveriesLast24h   int64              `json:"deliveries_last_24h"`
	AvgLatencyMs        float64            `json:"avg_latency_ms"`
	TopEndpoints        []EndpointStat     `json:"top_endpoints"`
	DeliveriesByStatus  []StatusStat       `json:"deliveries_by_status"`
	DeliveriesByEvent   []EventTypeStat    `json:"deliveries_by_event"`
}

// EndpointStat estatística por endpoint
type EndpointStat struct {
	EndpointID   string  `json:"endpoint_id"`
	URL          string  `json:"url"`
	Deliveries   int64   `json:"deliveries"`
	SuccessRate  float64 `json:"success_rate"`
}

// StatusStat estatística por status
type StatusStat struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

// EventTypeStat estatística por tipo de evento
type EventTypeStat struct {
	EventType string `json:"event_type"`
	Count     int64  `json:"count"`
}

// GetSystemStats retorna estatísticas gerais de webhooks
func (s *WebhookStatsService) GetSystemStats() (*WebhookSystemStats, error) {
	stats := &WebhookSystemStats{}

	// Total de endpoints
	s.db.Model(&WebhookEndpoint{}).Count(&stats.TotalEndpoints)

	// Endpoints ativos
	s.db.Model(&WebhookEndpoint{}).Where("enabled = ?", true).Count(&stats.ActiveEndpoints)

	// Total de deliveries
	s.db.Model(&WebhookDelivery{}).Count(&stats.TotalDeliveries)

	// Deliveries bem-sucedidas
	s.db.Model(&WebhookDelivery{}).Where("status = ?", "success").Count(&stats.SuccessfulDeliveries)

	// Deliveries falhas
	s.db.Model(&WebhookDelivery{}).Where("status = ?", "failed").Count(&stats.FailedDeliveries)

	// Taxa de sucesso
	if stats.TotalDeliveries > 0 {
		stats.SuccessRate = float64(stats.SuccessfulDeliveries) / float64(stats.TotalDeliveries) * 100
	}

	// Deliveries nas últimas 24h
	s.db.Model(&WebhookDelivery{}).
		Where("created_at > ?", time.Now().Add(-24*time.Hour)).
		Count(&stats.DeliveriesLast24h)

	// Latência média (em ms)
	var avgLatency float64
	s.db.Model(&WebhookDelivery{}).
		Select("AVG(latency_ms)").
		Where("latency_ms > 0").
		Scan(&avgLatency)
	stats.AvgLatencyMs = avgLatency

	// Top endpoints por volume
	s.db.Table("webhook_deliveries").
		Select("webhook_endpoint_id as endpoint_id, count(*) as deliveries").
		Group("webhook_endpoint_id").
		Order("deliveries DESC").
		Limit(10).
		Scan(&stats.TopEndpoints)

	// Por status
	s.db.Model(&WebhookDelivery{}).
		Select("status, count(*) as count").
		Group("status").
		Scan(&stats.DeliveriesByStatus)

	// Por tipo de evento
	s.db.Model(&WebhookDelivery{}).
		Select("event_type, count(*) as count").
		Group("event_type").
		Order("count DESC").
		Limit(10).
		Scan(&stats.DeliveriesByEvent)

	return stats, nil
}

// GetAppStats retorna estatísticas de webhooks de um app
func (s *WebhookStatsService) GetAppStats(appID uuid.UUID) (*WebhookSystemStats, error) {
	stats := &WebhookSystemStats{}

	// Total de endpoints do app
	s.db.Model(&WebhookEndpoint{}).Where("app_id = ?", appID).Count(&stats.TotalEndpoints)

	// Endpoints ativos
	s.db.Model(&WebhookEndpoint{}).Where("app_id = ? AND enabled = ?", appID, true).Count(&stats.ActiveEndpoints)

	// IDs dos endpoints do app
	var endpointIDs []uuid.UUID
	s.db.Model(&WebhookEndpoint{}).Where("app_id = ?", appID).Pluck("id", &endpointIDs)

	if len(endpointIDs) == 0 {
		return stats, nil
	}

	// Total de deliveries
	s.db.Model(&WebhookDelivery{}).Where("webhook_endpoint_id IN ?", endpointIDs).Count(&stats.TotalDeliveries)

	// Deliveries bem-sucedidas
	s.db.Model(&WebhookDelivery{}).
		Where("webhook_endpoint_id IN ? AND status = ?", endpointIDs, "success").
		Count(&stats.SuccessfulDeliveries)

	// Deliveries falhas
	s.db.Model(&WebhookDelivery{}).
		Where("webhook_endpoint_id IN ? AND status = ?", endpointIDs, "failed").
		Count(&stats.FailedDeliveries)

	// Taxa de sucesso
	if stats.TotalDeliveries > 0 {
		stats.SuccessRate = float64(stats.SuccessfulDeliveries) / float64(stats.TotalDeliveries) * 100
	}

	// Deliveries nas últimas 24h
	s.db.Model(&WebhookDelivery{}).
		Where("webhook_endpoint_id IN ? AND created_at > ?", endpointIDs, time.Now().Add(-24*time.Hour)).
		Count(&stats.DeliveriesLast24h)

	return stats, nil
}

// GetEndpointHealth retorna saúde de um endpoint específico
func (s *WebhookStatsService) GetEndpointHealth(endpointID uuid.UUID) (map[string]interface{}, error) {
	var endpoint WebhookEndpoint
	if err := s.db.First(&endpoint, endpointID).Error; err != nil {
		return nil, err
	}

	var total, success, failed int64
	s.db.Model(&WebhookDelivery{}).Where("webhook_endpoint_id = ?", endpointID).Count(&total)
	s.db.Model(&WebhookDelivery{}).Where("webhook_endpoint_id = ? AND status = ?", endpointID, "success").Count(&success)
	s.db.Model(&WebhookDelivery{}).Where("webhook_endpoint_id = ? AND status = ?", endpointID, "failed").Count(&failed)

	var avgLatency float64
	s.db.Model(&WebhookDelivery{}).
		Select("AVG(latency_ms)").
		Where("webhook_endpoint_id = ? AND latency_ms > 0", endpointID).
		Scan(&avgLatency)

	// Últimas 10 deliveries
	var recentDeliveries []WebhookDelivery
	s.db.Where("webhook_endpoint_id = ?", endpointID).
		Order("created_at DESC").
		Limit(10).
		Find(&recentDeliveries)

	successRate := float64(0)
	if total > 0 {
		successRate = float64(success) / float64(total) * 100
	}

	return map[string]interface{}{
		"endpoint_id":        endpointID,
		"url":                endpoint.URL,
		"status":             endpoint.Status,
		"total_deliveries":   total,
		"successful":         success,
		"failed":             failed,
		"success_rate":       successRate,
		"avg_latency_ms":     avgLatency,
		"fail_count":         endpoint.FailCount,
		"last_success":       endpoint.LastSuccess,
		"last_failure":       endpoint.LastFailure,
		"last_error":         endpoint.LastError,
		"recent_deliveries":  recentDeliveries,
	}, nil
}
