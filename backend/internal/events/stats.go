package events

/*
================================================================================
EVENT STATS — Estatísticas e Métricas de Eventos
================================================================================

Fornece métricas para observabilidade do sistema de eventos:
- Total de eventos por tipo
- Taxa de eventos por hora
- Eventos por app
- Latência de processamento

"O que não é medido não pode ser melhorado."

================================================================================
*/

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// EventStatsService serviço de estatísticas
type EventStatsService struct {
	db *gorm.DB
}

// NewEventStatsService cria novo serviço
func NewEventStatsService(db *gorm.DB) *EventStatsService {
	return &EventStatsService{db: db}
}

// SystemStats estatísticas gerais do sistema
type SystemStats struct {
	TotalEvents     int64            `json:"total_events"`
	EventsLast24h   int64            `json:"events_last_24h"`
	EventsLastHour  int64            `json:"events_last_hour"`
	EventsByType    []TypeStat       `json:"events_by_type"`
	EventsByApp     []AppStat        `json:"events_by_app"`
	EventsPerHour   []HourlyStat     `json:"events_per_hour"`
	TopSources      []SourceStat     `json:"top_sources"`
}

// TypeStat estatística por tipo
type TypeStat struct {
	Type  string `json:"type"`
	Count int64  `json:"count"`
}

// AppStat estatística por app
type AppStat struct {
	AppID   string `json:"app_id"`
	AppName string `json:"app_name"`
	Count   int64  `json:"count"`
}

// HourlyStat estatística por hora
type HourlyStat struct {
	Hour  string `json:"hour"`
	Count int64  `json:"count"`
}

// SourceStat estatística por source
type SourceStat struct {
	Source string `json:"source"`
	Count  int64  `json:"count"`
}

// GetSystemStats retorna estatísticas gerais
func (s *EventStatsService) GetSystemStats() (*SystemStats, error) {
	stats := &SystemStats{}

	// Total de eventos
	s.db.Model(&Event{}).Count(&stats.TotalEvents)

	// Eventos nas últimas 24h
	s.db.Model(&Event{}).
		Where("created_at > ?", time.Now().Add(-24*time.Hour)).
		Count(&stats.EventsLast24h)

	// Eventos na última hora
	s.db.Model(&Event{}).
		Where("created_at > ?", time.Now().Add(-1*time.Hour)).
		Count(&stats.EventsLastHour)

	// Por tipo
	s.db.Model(&Event{}).
		Select("type, count(*) as count").
		Group("type").
		Order("count DESC").
		Limit(20).
		Scan(&stats.EventsByType)

	// Por app (com nome)
	s.db.Table("events").
		Select("events.app_id, COALESCE(applications.name, 'Unknown') as app_name, count(*) as count").
		Joins("LEFT JOIN applications ON events.app_id = applications.id").
		Group("events.app_id, applications.name").
		Order("count DESC").
		Limit(10).
		Scan(&stats.EventsByApp)

	// Por hora (últimas 24h)
	s.db.Model(&Event{}).
		Select("DATE_TRUNC('hour', created_at) as hour, count(*) as count").
		Where("created_at > ?", time.Now().Add(-24*time.Hour)).
		Group("DATE_TRUNC('hour', created_at)").
		Order("hour DESC").
		Scan(&stats.EventsPerHour)

	// Top sources
	s.db.Model(&Event{}).
		Select("source, count(*) as count").
		Group("source").
		Order("count DESC").
		Limit(10).
		Scan(&stats.TopSources)

	return stats, nil
}

// GetAppStats retorna estatísticas de um app específico
func (s *EventStatsService) GetAppStats(appID uuid.UUID) (*SystemStats, error) {
	stats := &SystemStats{}

	// Total de eventos do app
	s.db.Model(&Event{}).Where("app_id = ?", appID).Count(&stats.TotalEvents)

	// Eventos nas últimas 24h
	s.db.Model(&Event{}).
		Where("app_id = ? AND created_at > ?", appID, time.Now().Add(-24*time.Hour)).
		Count(&stats.EventsLast24h)

	// Eventos na última hora
	s.db.Model(&Event{}).
		Where("app_id = ? AND created_at > ?", appID, time.Now().Add(-1*time.Hour)).
		Count(&stats.EventsLastHour)

	// Por tipo
	s.db.Model(&Event{}).
		Select("type, count(*) as count").
		Where("app_id = ?", appID).
		Group("type").
		Order("count DESC").
		Scan(&stats.EventsByType)

	// Por hora (últimas 24h)
	s.db.Model(&Event{}).
		Select("DATE_TRUNC('hour', created_at) as hour, count(*) as count").
		Where("app_id = ? AND created_at > ?", appID, time.Now().Add(-24*time.Hour)).
		Group("DATE_TRUNC('hour', created_at)").
		Order("hour DESC").
		Scan(&stats.EventsPerHour)

	// Top sources
	s.db.Model(&Event{}).
		Select("source, count(*) as count").
		Where("app_id = ?", appID).
		Group("source").
		Order("count DESC").
		Limit(10).
		Scan(&stats.TopSources)

	return stats, nil
}

// GetRealtimeStats retorna estatísticas em tempo real (últimos 5 minutos)
func (s *EventStatsService) GetRealtimeStats() (map[string]interface{}, error) {
	fiveMinAgo := time.Now().Add(-5 * time.Minute)
	oneMinAgo := time.Now().Add(-1 * time.Minute)

	var last5min, lastMin int64
	s.db.Model(&Event{}).Where("created_at > ?", fiveMinAgo).Count(&last5min)
	s.db.Model(&Event{}).Where("created_at > ?", oneMinAgo).Count(&lastMin)

	// Eventos por tipo nos últimos 5 min
	var recentTypes []TypeStat
	s.db.Model(&Event{}).
		Select("type, count(*) as count").
		Where("created_at > ?", fiveMinAgo).
		Group("type").
		Order("count DESC").
		Limit(10).
		Scan(&recentTypes)

	return map[string]interface{}{
		"events_last_5min":  last5min,
		"events_last_1min":  lastMin,
		"rate_per_minute":   float64(last5min) / 5.0,
		"recent_types":      recentTypes,
		"timestamp":         time.Now(),
	}, nil
}

// GetRecentSystemEvents retorna eventos recentes do sistema
func (s *EventStatsService) GetRecentSystemEvents(limit int) ([]Event, error) {
	var events []Event
	err := s.db.Model(&Event{}).
		Order("created_at DESC").
		Limit(limit).
		Find(&events).Error
	return events, err
}
