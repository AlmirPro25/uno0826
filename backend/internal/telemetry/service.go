package telemetry

import (
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// TELEMETRY SERVICE - O cérebro que processa
// "Ingestão → Processamento → Agregação"
// ========================================

type TelemetryService struct {
	db *gorm.DB
}

func NewTelemetryService(db *gorm.DB) *TelemetryService {
	// Auto-migrate das tabelas
	db.AutoMigrate(&AppSession{}, &TelemetryEvent{}, &AppMetricsSnapshot{})
	return &TelemetryService{db: db}
}

// ========================================
// 1. INGESTÃO - Receber e validar eventos
// ========================================

// IngestEventRequest payload de evento do app
type IngestEventRequest struct {
	UserID    string            `json:"user_id" binding:"required"`
	SessionID string            `json:"session_id"`
	Type      string            `json:"type" binding:"required"`
	Feature   string            `json:"feature"`
	TargetID  string            `json:"target_id"`
	TargetType string           `json:"target_type"`
	Context   map[string]interface{} `json:"context"`
	Metadata  map[string]interface{} `json:"metadata"`
	Timestamp string            `json:"timestamp"`
}

// IngestEvent processa um evento de um app
func (s *TelemetryService) IngestEvent(appID uuid.UUID, req *IngestEventRequest, ip, userAgent string) error {
	// Parse user_id
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		return err
	}
	
	// Parse ou gerar session_id
	var sessionID uuid.UUID
	if req.SessionID != "" {
		sessionID, _ = uuid.Parse(req.SessionID)
	}
	if sessionID == uuid.Nil {
		sessionID = uuid.New()
	}
	
	// Parse timestamp ou usar agora
	timestamp := time.Now()
	if req.Timestamp != "" {
		if t, err := time.Parse(time.RFC3339, req.Timestamp); err == nil {
			timestamp = t
		}
	}
	
	// Serializar context e metadata
	contextJSON := "{}"
	if req.Context != nil {
		if b, err := json.Marshal(req.Context); err == nil {
			contextJSON = string(b)
		}
	}
	metadataJSON := "{}"
	if req.Metadata != nil {
		if b, err := json.Marshal(req.Metadata); err == nil {
			metadataJSON = string(b)
		}
	}
	
	// Criar evento
	event := &TelemetryEvent{
		ID:         uuid.New(),
		AppID:      appID,
		UserID:     userID,
		SessionID:  sessionID,
		Type:       req.Type,
		Feature:    req.Feature,
		TargetID:   req.TargetID,
		TargetType: req.TargetType,
		Context:    contextJSON,
		Metadata:   metadataJSON,
		IPAddress:  ip,
		UserAgent:  userAgent,
		Timestamp:  timestamp,
		IngestedAt: time.Now(),
	}
	
	// Salvar evento
	if err := s.db.Create(event).Error; err != nil {
		return err
	}
	
	// Processar evento (atualizar sessão, métricas, etc)
	go s.processEvent(event)
	
	log.Printf("📊 [TELEMETRY] Event ingested: app=%s type=%s user=%s", appID, req.Type, userID)
	return nil
}

// ========================================
// 2. PROCESSAMENTO - Atualizar estado
// ========================================

func (s *TelemetryService) processEvent(event *TelemetryEvent) {
	// Atualizar sessão
	s.updateSession(event)
	
	// Atualizar métricas snapshot
	s.updateMetricsSnapshot(event.AppID)
}

func (s *TelemetryService) updateSession(event *TelemetryEvent) {
	var session AppSession
	
	// Buscar sessão existente
	result := s.db.Where("id = ? AND app_id = ?", event.SessionID, event.AppID).First(&session)
	
	if result.Error == gorm.ErrRecordNotFound {
		// Criar nova sessão
		session = AppSession{
			ID:             event.SessionID,
			AppID:          event.AppID,
			UserID:         event.UserID,
			StartedAt:      event.Timestamp,
			LastSeenAt:     event.Timestamp,
			IPAddress:      event.IPAddress,
			UserAgent:      event.UserAgent,
			CurrentFeature: event.Feature,
			CurrentContext: event.Context,
			EventCount:     1,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		
		// Extrair país do contexto se disponível
		if event.Context != "" {
			var ctx map[string]interface{}
			if json.Unmarshal([]byte(event.Context), &ctx) == nil {
				if country, ok := ctx["country"].(string); ok {
					session.Country = country
				}
			}
		}
		
		s.db.Create(&session)
	} else if result.Error == nil {
		// Atualizar sessão existente
		updates := map[string]interface{}{
			"last_seen_at": event.Timestamp,
			"event_count":  gorm.Expr("event_count + 1"),
			"updated_at":   time.Now(),
		}
		
		// Atualizar feature atual
		if event.Feature != "" {
			updates["current_feature"] = event.Feature
		}
		if event.Context != "" {
			updates["current_context"] = event.Context
		}
		
		// Se é interação, incrementar contador
		if strings.HasPrefix(event.Type, "interaction.") {
			updates["interaction_count"] = gorm.Expr("interaction_count + 1")
		}
		
		// Se é fim de sessão, marcar ended_at
		if event.Type == EventSessionEnd || event.Type == EventSessionTimeout {
			now := time.Now()
			updates["ended_at"] = now
			updates["duration_ms"] = now.Sub(session.StartedAt).Milliseconds()
		}
		
		s.db.Model(&session).Updates(updates)
	}
}

// ========================================
// 3. AGREGAÇÃO - Métricas prontas
// ========================================

func (s *TelemetryService) updateMetricsSnapshot(appID uuid.UUID) {
	var snapshot AppMetricsSnapshot
	
	// Buscar ou criar snapshot
	result := s.db.Where("app_id = ?", appID).First(&snapshot)
	if result.Error == gorm.ErrRecordNotFound {
		snapshot = AppMetricsSnapshot{
			ID:    uuid.New(),
			AppID: appID,
		}
	}
	
	now := time.Now()
	
	// Calcular métricas de usuários (da tabela implicit_users)
	s.db.Table("implicit_users").Where("app_id = ?", appID).Count(&snapshot.TotalUsers)
	s.db.Table("implicit_users").Where("app_id = ? AND last_seen_at > ?", appID, now.Add(-24*time.Hour)).Count(&snapshot.ActiveUsers24h)
	s.db.Table("implicit_users").Where("app_id = ? AND last_seen_at > ?", appID, now.Add(-1*time.Hour)).Count(&snapshot.ActiveUsers1h)
	
	// Online agora (sessões com last_seen < 30s)
	s.db.Model(&AppSession{}).Where("app_id = ? AND ended_at IS NULL AND last_seen_at > ?", appID, now.Add(-30*time.Second)).Count(&snapshot.OnlineNow)
	
	// Sessões
	s.db.Model(&AppSession{}).Where("app_id = ?", appID).Count(&snapshot.TotalSessions)
	s.db.Model(&AppSession{}).Where("app_id = ? AND ended_at IS NULL AND last_seen_at > ?", appID, now.Add(-5*time.Minute)).Count(&snapshot.ActiveSessions)
	
	// Eventos
	s.db.Model(&TelemetryEvent{}).Where("app_id = ?", appID).Count(&snapshot.TotalEvents)
	s.db.Model(&TelemetryEvent{}).Where("app_id = ? AND timestamp > ?", appID, now.Add(-24*time.Hour)).Count(&snapshot.Events24h)
	s.db.Model(&TelemetryEvent{}).Where("app_id = ? AND timestamp > ?", appID, now.Add(-1*time.Hour)).Count(&snapshot.Events1h)
	
	// Eventos por minuto (média últimos 5 min)
	var events5min int64
	s.db.Model(&TelemetryEvent{}).Where("app_id = ? AND timestamp > ?", appID, now.Add(-5*time.Minute)).Count(&events5min)
	snapshot.EventsPerMinute = float64(events5min) / 5.0
	
	// Interações
	s.db.Model(&TelemetryEvent{}).Where("app_id = ? AND type LIKE 'interaction.%'", appID).Count(&snapshot.TotalInteractions)
	s.db.Model(&TelemetryEvent{}).Where("app_id = ? AND type LIKE 'interaction.%' AND timestamp > ?", appID, now.Add(-24*time.Hour)).Count(&snapshot.Interactions24h)
	
	// Usuários por feature
	type FeatureCount struct {
		Feature string
		Count   int64
	}
	var featureCounts []FeatureCount
	s.db.Model(&AppSession{}).
		Select("current_feature as feature, count(*) as count").
		Where("app_id = ? AND ended_at IS NULL AND last_seen_at > ? AND current_feature != ''", appID, now.Add(-5*time.Minute)).
		Group("current_feature").
		Scan(&featureCounts)
	
	featureMap := make(map[string]int64)
	for _, fc := range featureCounts {
		featureMap[fc.Feature] = fc.Count
	}
	if b, err := json.Marshal(featureMap); err == nil {
		snapshot.UsersByFeature = string(b)
	}
	
	// Último evento
	var lastEvent TelemetryEvent
	if s.db.Where("app_id = ?", appID).Order("timestamp DESC").First(&lastEvent).Error == nil {
		snapshot.LastEventAt = &lastEvent.Timestamp
	}
	
	// Última sessão
	var lastSession AppSession
	if s.db.Where("app_id = ?", appID).Order("started_at DESC").First(&lastSession).Error == nil {
		snapshot.LastSessionAt = &lastSession.StartedAt
	}
	
	snapshot.UpdatedAt = now
	
	// Salvar snapshot
	if result.Error == gorm.ErrRecordNotFound {
		s.db.Create(&snapshot)
	} else {
		s.db.Save(&snapshot)
	}
}

// ========================================
// 4. CONSULTAS - Para o dashboard
// ========================================

// GetMetricsSnapshot retorna métricas prontas de um app
func (s *TelemetryService) GetMetricsSnapshot(appID uuid.UUID) (*AppMetricsSnapshot, error) {
	var snapshot AppMetricsSnapshot
	
	// Buscar snapshot existente
	result := s.db.Where("app_id = ?", appID).First(&snapshot)
	if result.Error == gorm.ErrRecordNotFound {
		// Criar snapshot se não existe
		s.updateMetricsSnapshot(appID)
		s.db.Where("app_id = ?", appID).First(&snapshot)
	}
	
	// Se snapshot está desatualizado (> 10s), atualizar em background
	if time.Since(snapshot.UpdatedAt) > 10*time.Second {
		go s.updateMetricsSnapshot(appID)
	}
	
	return &snapshot, nil
}

// GetActiveSessions retorna sessões ativas de um app
func (s *TelemetryService) GetActiveSessions(appID uuid.UUID, limit int) ([]AppSession, error) {
	var sessions []AppSession
	
	err := s.db.Where("app_id = ? AND ended_at IS NULL AND last_seen_at > ?", appID, time.Now().Add(-5*time.Minute)).
		Order("last_seen_at DESC").
		Limit(limit).
		Find(&sessions).Error
	
	return sessions, err
}

// GetRecentEvents retorna eventos recentes de um app
func (s *TelemetryService) GetRecentEvents(appID uuid.UUID, limit int) ([]TelemetryEvent, error) {
	var events []TelemetryEvent
	
	err := s.db.Where("app_id = ?", appID).
		Order("timestamp DESC").
		Limit(limit).
		Find(&events).Error
	
	return events, err
}

// GetEventsByType retorna contagem de eventos por tipo
func (s *TelemetryService) GetEventsByType(appID uuid.UUID, since time.Duration) (map[string]int64, error) {
	type TypeCount struct {
		Type  string
		Count int64
	}
	var counts []TypeCount
	
	err := s.db.Model(&TelemetryEvent{}).
		Select("type, count(*) as count").
		Where("app_id = ? AND timestamp > ?", appID, time.Now().Add(-since)).
		Group("type").
		Order("count DESC").
		Scan(&counts).Error
	
	if err != nil {
		return nil, err
	}
	
	result := make(map[string]int64)
	for _, c := range counts {
		result[c.Type] = c.Count
	}
	return result, nil
}
