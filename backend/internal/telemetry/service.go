package telemetry

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// TELEMETRY SERVICE - O cérebro que processa
// "Ingestão → Processamento → Agregação"
// ========================================

// Configurações de timeout (ajustáveis)
const (
	SessionTimeoutDuration  = 60 * time.Second  // Sessão morre após 60s sem heartbeat
	SessionCleanupInterval  = 30 * time.Second  // Cleanup roda a cada 30s
	OnlineThreshold         = 30 * time.Second  // Considera "online" se visto nos últimos 30s
	ActiveSessionThreshold  = 60 * time.Second  // Sessão ativa se vista no último minuto
)

type TelemetryService struct {
	db            *gorm.DB
	stopCleanup   chan struct{}
	cleanupWg     sync.WaitGroup
	alertCallback func(appID uuid.UUID, alertType string, data map[string]interface{})
}

func NewTelemetryService(db *gorm.DB) *TelemetryService {
	// Auto-migrate das tabelas
	db.AutoMigrate(&AppSession{}, &TelemetryEvent{}, &AppMetricsSnapshot{}, &AlertHistory{})
	
	svc := &TelemetryService{
		db:          db,
		stopCleanup: make(chan struct{}),
	}
	
	// Iniciar cleanup automático de sessões zumbi
	svc.startSessionCleanup()
	
	return svc
}

// SetAlertCallback define callback para alertas (opcional)
func (s *TelemetryService) SetAlertCallback(cb func(appID uuid.UUID, alertType string, data map[string]interface{})) {
	s.alertCallback = cb
}

// Stop para o cleanup gracefully
func (s *TelemetryService) Stop() {
	close(s.stopCleanup)
	s.cleanupWg.Wait()
}

// ========================================
// SESSION CLEANUP - Mata sessões zumbi
// ========================================

func (s *TelemetryService) startSessionCleanup() {
	s.cleanupWg.Add(1)
	go func() {
		defer s.cleanupWg.Done()
		ticker := time.NewTicker(SessionCleanupInterval)
		defer ticker.Stop()
		
		// Health log a cada 5 minutos
		healthTicker := time.NewTicker(5 * time.Minute)
		defer healthTicker.Stop()
		
		for {
			select {
			case <-ticker.C:
				s.cleanupZombieSessions()
			case <-healthTicker.C:
				s.logSystemHealth()
			case <-s.stopCleanup:
				return
			}
		}
	}()
	log.Printf("🧹 [TELEMETRY] Session cleanup started (interval: %v, timeout: %v)", SessionCleanupInterval, SessionTimeoutDuration)
}

// logSystemHealth emite log de saúde do sistema a cada 5 minutos
func (s *TelemetryService) logSystemHealth() {
	var totalApps int64
	var totalSessions int64
	var activeSessions int64
	var totalEvents int64
	var recentAlerts int64
	
	s.db.Table("applications").Count(&totalApps)
	s.db.Model(&AppSession{}).Count(&totalSessions)
	s.db.Model(&AppSession{}).Where("ended_at IS NULL AND last_seen_at > ?", time.Now().Add(-ActiveSessionThreshold)).Count(&activeSessions)
	s.db.Model(&TelemetryEvent{}).Count(&totalEvents)
	s.db.Model(&AlertHistory{}).Where("created_at > ?", time.Now().Add(-1*time.Hour)).Count(&recentAlerts)
	
	// Calcular eventos/min (últimos 5 min)
	var events5min int64
	s.db.Model(&TelemetryEvent{}).Where("timestamp > ?", time.Now().Add(-5*time.Minute)).Count(&events5min)
	eventsPerMin := float64(events5min) / 5.0
	
	log.Printf("💚 [HEALTH] apps=%d sessions=%d active=%d events=%d events/min=%.1f alerts(1h)=%d",
		totalApps, totalSessions, activeSessions, totalEvents, eventsPerMin, recentAlerts)
}

func (s *TelemetryService) cleanupZombieSessions() {
	cutoff := time.Now().Add(-SessionTimeoutDuration)
	
	// Buscar sessões zumbi (sem ended_at e last_seen muito antigo)
	var zombies []AppSession
	s.db.Where("ended_at IS NULL AND last_seen_at < ?", cutoff).Find(&zombies)
	
	if len(zombies) == 0 {
		return
	}
	
	now := time.Now()
	for _, session := range zombies {
		// Marcar como encerrada por timeout
		duration := session.LastSeenAt.Sub(session.StartedAt).Milliseconds()
		s.db.Model(&session).Updates(map[string]interface{}{
			"ended_at":    now,
			"duration_ms": duration,
			"updated_at":  now,
		})
		
		// Criar evento de timeout
		event := &TelemetryEvent{
			ID:         uuid.New(),
			AppID:      session.AppID,
			UserID:     session.UserID,
			SessionID:  session.ID,
			Type:       EventSessionTimeout,
			Context:    `{"reason":"zombie_cleanup"}`,
			Timestamp:  now,
			IngestedAt: now,
		}
		s.db.Create(event)
		
		log.Printf("🧟 [TELEMETRY] Zombie session killed: session=%s user=%s app=%s (last_seen: %v ago)", 
			session.ID, session.UserID, session.AppID, now.Sub(session.LastSeenAt))
	}
	
	// Atualizar métricas dos apps afetados
	appIDs := make(map[uuid.UUID]bool)
	for _, session := range zombies {
		appIDs[session.AppID] = true
	}
	for appID := range appIDs {
		go s.updateMetricsSnapshot(appID)
	}
	
	log.Printf("🧹 [TELEMETRY] Cleaned up %d zombie sessions", len(zombies))
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
	
	// SPECIAL: Session Recover - reconexão sem inflar métricas
	if req.Type == EventSessionRecover {
		return s.handleSessionRecover(appID, userID, sessionID, req, ip, userAgent, timestamp)
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
	
	// Verificar alertas
	go s.checkAlerts(appID, event)
	
	log.Printf("📊 [TELEMETRY] Event ingested: app=%s type=%s user=%s", appID, req.Type, userID)
	return nil
}

// handleSessionRecover reconecta uma sessão existente sem criar nova
func (s *TelemetryService) handleSessionRecover(appID, userID, sessionID uuid.UUID, req *IngestEventRequest, ip, userAgent string, timestamp time.Time) error {
	var existingSession AppSession
	
	// Buscar sessão pelo ID fornecido
	result := s.db.Where("id = ? AND app_id = ? AND user_id = ?", sessionID, appID, userID).First(&existingSession)
	
	if result.Error == gorm.ErrRecordNotFound {
		// Sessão não existe - criar nova normalmente
		log.Printf("🔄 [TELEMETRY] Session recover failed (not found), creating new: session=%s", sessionID)
		req.Type = EventSessionStart
		return s.IngestEvent(appID, req, ip, userAgent)
	}
	
	// Sessão existe - verificar se pode ser recuperada
	if existingSession.EndedAt != nil {
		// Sessão já foi encerrada - verificar se foi recente (< 5 min)
		if time.Since(*existingSession.EndedAt) < 5*time.Minute {
			// Reabrir sessão
			s.db.Model(&existingSession).Updates(map[string]interface{}{
				"ended_at":    nil,
				"duration_ms": 0,
				"last_seen_at": timestamp,
				"updated_at":   time.Now(),
			})
			log.Printf("🔄 [TELEMETRY] Session recovered (reopened): session=%s user=%s", sessionID, userID)
		} else {
			// Sessão muito antiga - criar nova
			log.Printf("🔄 [TELEMETRY] Session too old to recover, creating new: session=%s", sessionID)
			req.Type = EventSessionStart
			req.SessionID = "" // Forçar novo ID
			return s.IngestEvent(appID, req, ip, userAgent)
		}
	} else {
		// Sessão ainda aberta - apenas atualizar last_seen
		s.db.Model(&existingSession).Updates(map[string]interface{}{
			"last_seen_at": timestamp,
			"ip_address":   ip,
			"user_agent":   userAgent,
			"updated_at":   time.Now(),
		})
		log.Printf("🔄 [TELEMETRY] Session recovered (refreshed): session=%s user=%s", sessionID, userID)
	}
	
	// Criar evento de recover (não conta como novo evento de sessão)
	event := &TelemetryEvent{
		ID:         uuid.New(),
		AppID:      appID,
		UserID:     userID,
		SessionID:  sessionID,
		Type:       EventSessionRecover,
		Context:    `{"recovered":true}`,
		IPAddress:  ip,
		UserAgent:  userAgent,
		Timestamp:  timestamp,
		IngestedAt: time.Now(),
	}
	s.db.Create(event)
	
	// Atualizar métricas
	go s.updateMetricsSnapshot(appID)
	
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
	
	// Guardar valores anteriores para detectar quedas
	prevOnline := snapshot.OnlineNow
	
	now := time.Now()
	
	// Calcular métricas de usuários (da tabela implicit_users)
	s.db.Table("implicit_users").Where("app_id = ?", appID).Count(&snapshot.TotalUsers)
	s.db.Table("implicit_users").Where("app_id = ? AND last_seen_at > ?", appID, now.Add(-24*time.Hour)).Count(&snapshot.ActiveUsers24h)
	s.db.Table("implicit_users").Where("app_id = ? AND last_seen_at > ?", appID, now.Add(-1*time.Hour)).Count(&snapshot.ActiveUsers1h)
	
	// Online agora (sessões com last_seen < OnlineThreshold)
	s.db.Model(&AppSession{}).Where("app_id = ? AND ended_at IS NULL AND last_seen_at > ?", appID, now.Add(-OnlineThreshold)).Count(&snapshot.OnlineNow)
	
	// Sessões
	s.db.Model(&AppSession{}).Where("app_id = ?", appID).Count(&snapshot.TotalSessions)
	s.db.Model(&AppSession{}).Where("app_id = ? AND ended_at IS NULL AND last_seen_at > ?", appID, now.Add(-ActiveSessionThreshold)).Count(&snapshot.ActiveSessions)
	
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
		Where("app_id = ? AND ended_at IS NULL AND last_seen_at > ? AND current_feature != ''", appID, now.Add(-ActiveSessionThreshold)).
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
	
	// Verificar alerta de queda brusca de online
	if prevOnline > 0 && snapshot.OnlineNow == 0 {
		s.triggerAlert(appID, AlertOnlineDrop, map[string]interface{}{
			"previous": prevOnline,
			"current":  snapshot.OnlineNow,
			"drop":     "100%",
		})
	} else if prevOnline > 5 && float64(snapshot.OnlineNow) < float64(prevOnline)*0.5 {
		// Queda de mais de 50%
		s.triggerAlert(appID, AlertOnlineDrop, map[string]interface{}{
			"previous": prevOnline,
			"current":  snapshot.OnlineNow,
			"drop":     fmt.Sprintf("%.0f%%", (1-float64(snapshot.OnlineNow)/float64(prevOnline))*100),
		})
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

// ========================================
// 5. ALERTAS - Detecção de anomalias
// ========================================

// Tipos de alerta
const (
	AlertOnlineDrop    = "online_drop"      // Queda brusca de usuários online
	AlertNoEvents      = "no_events"        // Sem eventos por muito tempo
	AlertHighErrorRate = "high_error_rate"  // Taxa alta de erros
	AlertSessionSpike  = "session_spike"    // Pico anormal de sessões
)

// AlertHistory histórico de alertas disparados
type AlertHistory struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	AppID     uuid.UUID `gorm:"type:uuid;index"`
	Type      string    `gorm:"size:50"`
	Data      string    `gorm:"type:text"`
	CreatedAt time.Time
}

func (s *TelemetryService) triggerAlert(appID uuid.UUID, alertType string, data map[string]interface{}) {
	// Verificar se já disparou alerta similar nos últimos 5 minutos (debounce)
	var recentAlert AlertHistory
	if s.db.Where("app_id = ? AND type = ? AND created_at > ?", appID, alertType, time.Now().Add(-5*time.Minute)).First(&recentAlert).Error == nil {
		return // Já tem alerta recente, ignorar
	}
	
	// Serializar dados
	dataJSON := "{}"
	if b, err := json.Marshal(data); err == nil {
		dataJSON = string(b)
	}
	
	// Salvar alerta
	alert := AlertHistory{
		ID:        uuid.New(),
		AppID:     appID,
		Type:      alertType,
		Data:      dataJSON,
		CreatedAt: time.Now(),
	}
	s.db.Create(&alert)
	
	log.Printf("🚨 [ALERT] %s for app %s: %v", alertType, appID, data)
	
	// Chamar callback se configurado
	if s.alertCallback != nil {
		s.alertCallback(appID, alertType, data)
	}
}

func (s *TelemetryService) checkAlerts(appID uuid.UUID, event *TelemetryEvent) {
	// Verificar taxa de erros
	if strings.HasPrefix(event.Type, "error.") {
		var errorCount int64
		var totalCount int64
		since := time.Now().Add(-5 * time.Minute)
		
		s.db.Model(&TelemetryEvent{}).Where("app_id = ? AND type LIKE 'error.%' AND timestamp > ?", appID, since).Count(&errorCount)
		s.db.Model(&TelemetryEvent{}).Where("app_id = ? AND timestamp > ?", appID, since).Count(&totalCount)
		
		if totalCount > 10 && float64(errorCount)/float64(totalCount) > 0.2 {
			// Mais de 20% de erros
			s.triggerAlert(appID, AlertHighErrorRate, map[string]interface{}{
				"error_count": errorCount,
				"total_count": totalCount,
				"rate":        fmt.Sprintf("%.1f%%", float64(errorCount)/float64(totalCount)*100),
			})
		}
	}
}

// GetRecentAlerts retorna alertas recentes de um app
func (s *TelemetryService) GetRecentAlerts(appID uuid.UUID, limit int) ([]AlertHistory, error) {
	var alerts []AlertHistory
	err := s.db.Where("app_id = ?", appID).Order("created_at DESC").Limit(limit).Find(&alerts).Error
	return alerts, err
}

// GetAllRecentAlerts retorna alertas recentes de todos os apps (para admin)
func (s *TelemetryService) GetAllRecentAlerts(limit int) ([]AlertHistory, error) {
	var alerts []AlertHistory
	err := s.db.Order("created_at DESC").Limit(limit).Find(&alerts).Error
	return alerts, err
}
