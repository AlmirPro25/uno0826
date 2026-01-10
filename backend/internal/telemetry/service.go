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
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	AppID       uuid.UUID  `gorm:"type:uuid;index" json:"app_id"`
	Type        string     `gorm:"size:50;index" json:"type"`
	Severity    string     `gorm:"size:20;default:'info'" json:"severity"` // info, warning, critical
	Title       string     `gorm:"size:200" json:"title"`
	Message     string     `gorm:"size:500" json:"message"`
	Data        string     `gorm:"type:text" json:"data"`
	Source      string     `gorm:"size:50;default:'system'" json:"source"` // system, rule, manual
	RuleID      *uuid.UUID `gorm:"type:uuid" json:"rule_id,omitempty"`
	RuleName    string     `gorm:"size:100" json:"rule_name,omitempty"`
	Acknowledged bool      `gorm:"default:false" json:"acknowledged"`
	AcknowledgedAt *time.Time `json:"acknowledged_at,omitempty"`
	AcknowledgedBy string   `gorm:"size:100" json:"acknowledged_by,omitempty"`
	CreatedAt   time.Time  `gorm:"index" json:"created_at"`
}

func (AlertHistory) TableName() string {
	return "alert_history"
}

// CreateAlert cria um alerta no histórico (usado pelo Rules Engine e sistema)
func (s *TelemetryService) CreateAlert(appID uuid.UUID, alertType, severity, title, message string, data map[string]interface{}, ruleID *uuid.UUID, ruleName string) error {
	// Serializar dados
	dataJSON := "{}"
	if b, err := json.Marshal(data); err == nil {
		dataJSON = string(b)
	}
	
	source := "system"
	if ruleID != nil {
		source = "rule"
	}
	
	alert := AlertHistory{
		ID:        uuid.New(),
		AppID:     appID,
		Type:      alertType,
		Severity:  severity,
		Title:     title,
		Message:   message,
		Data:      dataJSON,
		Source:    source,
		RuleID:    ruleID,
		RuleName:  ruleName,
		CreatedAt: time.Now(),
	}
	
	if err := s.db.Create(&alert).Error; err != nil {
		return err
	}
	
	log.Printf("🚨 [ALERT] %s (%s) for app %s: %s", alertType, severity, appID, message)
	
	// Chamar callback se configurado
	if s.alertCallback != nil {
		s.alertCallback(appID, alertType, data)
	}
	
	return nil
}

func (s *TelemetryService) triggerAlert(appID uuid.UUID, alertType string, data map[string]interface{}) {
	// Verificar se já disparou alerta similar nos últimos 5 minutos (debounce)
	var recentAlert AlertHistory
	if s.db.Where("app_id = ? AND type = ? AND created_at > ?", appID, alertType, time.Now().Add(-5*time.Minute)).First(&recentAlert).Error == nil {
		return // Já tem alerta recente, ignorar
	}
	
	// Usar o novo método
	s.CreateAlert(appID, alertType, "warning", alertType, "", data, nil, "")
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

// AlertStats estatísticas de alertas
type AlertStats struct {
	Total          int64 `json:"total"`
	Unacknowledged int64 `json:"unacknowledged"`
	BySeverity     map[string]int64 `json:"by_severity"`
	BySource       map[string]int64 `json:"by_source"`
	Last24h        int64 `json:"last_24h"`
	Last1h         int64 `json:"last_1h"`
}

// GetAlertsFiltered retorna alertas com filtros
func (s *TelemetryService) GetAlertsFiltered(limit int, severity, source, acknowledged, appIDStr string) ([]AlertHistory, *AlertStats, error) {
	var alerts []AlertHistory
	query := s.db.Model(&AlertHistory{})
	
	if severity != "" {
		query = query.Where("severity = ?", severity)
	}
	if source != "" {
		query = query.Where("source = ?", source)
	}
	if acknowledged == "true" {
		query = query.Where("acknowledged = ?", true)
	} else if acknowledged == "false" {
		query = query.Where("acknowledged = ?", false)
	}
	if appIDStr != "" {
		if appID, err := uuid.Parse(appIDStr); err == nil {
			query = query.Where("app_id = ?", appID)
		}
	}
	
	err := query.Order("created_at DESC").Limit(limit).Find(&alerts).Error
	if err != nil {
		return nil, nil, err
	}
	
	// Calcular stats
	stats, _ := s.GetAlertStats()
	
	return alerts, stats, nil
}

// AcknowledgeAlert marca um alerta como reconhecido
func (s *TelemetryService) AcknowledgeAlert(alertID uuid.UUID, acknowledgedBy string) error {
	now := time.Now()
	return s.db.Model(&AlertHistory{}).Where("id = ?", alertID).Updates(map[string]interface{}{
		"acknowledged":    true,
		"acknowledged_at": now,
		"acknowledged_by": acknowledgedBy,
	}).Error
}

// AcknowledgeAllAlerts marca todos alertas de um app como reconhecidos
func (s *TelemetryService) AcknowledgeAllAlerts(appIDStr, acknowledgedBy string) (int64, error) {
	now := time.Now()
	query := s.db.Model(&AlertHistory{}).Where("acknowledged = ?", false)
	
	if appIDStr != "" {
		if appID, err := uuid.Parse(appIDStr); err == nil {
			query = query.Where("app_id = ?", appID)
		}
	}
	
	result := query.Updates(map[string]interface{}{
		"acknowledged":    true,
		"acknowledged_at": now,
		"acknowledged_by": acknowledgedBy,
	})
	
	return result.RowsAffected, result.Error
}

// GetAlertStats retorna estatísticas de alertas
func (s *TelemetryService) GetAlertStats() (*AlertStats, error) {
	stats := &AlertStats{
		BySeverity: make(map[string]int64),
		BySource:   make(map[string]int64),
	}
	
	// Total
	s.db.Model(&AlertHistory{}).Count(&stats.Total)
	
	// Não reconhecidos
	s.db.Model(&AlertHistory{}).Where("acknowledged = ?", false).Count(&stats.Unacknowledged)
	
	// Últimas 24h
	s.db.Model(&AlertHistory{}).Where("created_at > ?", time.Now().Add(-24*time.Hour)).Count(&stats.Last24h)
	
	// Última hora
	s.db.Model(&AlertHistory{}).Where("created_at > ?", time.Now().Add(-1*time.Hour)).Count(&stats.Last1h)
	
	// Por severidade
	type SeverityCount struct {
		Severity string
		Count    int64
	}
	var severityCounts []SeverityCount
	s.db.Model(&AlertHistory{}).Select("severity, count(*) as count").Group("severity").Scan(&severityCounts)
	for _, sc := range severityCounts {
		stats.BySeverity[sc.Severity] = sc.Count
	}
	
	// Por source
	type SourceCount struct {
		Source string
		Count  int64
	}
	var sourceCounts []SourceCount
	s.db.Model(&AlertHistory{}).Select("source, count(*) as count").Group("source").Scan(&sourceCounts)
	for _, sc := range sourceCounts {
		stats.BySource[sc.Source] = sc.Count
	}
	
	return stats, nil
}

// ========================================
// 6. ANALYTICS - Inteligência de Negócio
// ========================================

// RetentionData dados de retenção por coorte
type RetentionData struct {
	Date       string  `json:"date"`        // Data do coorte (YYYY-MM-DD)
	NewUsers   int64   `json:"new_users"`   // Usuários novos nesse dia
	D1         float64 `json:"d1"`          // % que voltou no dia 1
	D7         float64 `json:"d7"`          // % que voltou no dia 7
	D30        float64 `json:"d30"`         // % que voltou no dia 30
	D1Count    int64   `json:"d1_count"`    // Absoluto D1
	D7Count    int64   `json:"d7_count"`    // Absoluto D7
	D30Count   int64   `json:"d30_count"`   // Absoluto D30
}

// GetRetention calcula retenção D1/D7/D30 para um app
func (s *TelemetryService) GetRetention(appID uuid.UUID, days int) ([]RetentionData, error) {
	if days <= 0 || days > 90 {
		days = 30
	}
	
	var results []RetentionData
	now := time.Now()
	
	for i := days; i >= 1; i-- {
		date := now.AddDate(0, 0, -i)
		dateStr := date.Format("2006-01-02")
		startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
		endOfDay := startOfDay.Add(24 * time.Hour)
		
		// Usuários que tiveram primeira sessão nesse dia
		var newUsers int64
		s.db.Model(&AppSession{}).
			Where("app_id = ? AND started_at >= ? AND started_at < ?", appID, startOfDay, endOfDay).
			Distinct("user_id").
			Count(&newUsers)
		
		if newUsers == 0 {
			results = append(results, RetentionData{Date: dateStr, NewUsers: 0})
			continue
		}
		
		// Subquery: IDs dos usuários novos desse dia
		subQuery := s.db.Model(&AppSession{}).
			Select("DISTINCT user_id").
			Where("app_id = ? AND started_at >= ? AND started_at < ?", appID, startOfDay, endOfDay)
		
		// D1: voltaram no dia seguinte
		d1Start := endOfDay
		d1End := d1Start.Add(24 * time.Hour)
		var d1Count int64
		s.db.Model(&AppSession{}).
			Where("app_id = ? AND started_at >= ? AND started_at < ? AND user_id IN (?)", appID, d1Start, d1End, subQuery).
			Distinct("user_id").
			Count(&d1Count)
		
		// D7: voltaram entre dia 7 e 8
		d7Start := startOfDay.AddDate(0, 0, 7)
		d7End := d7Start.Add(24 * time.Hour)
		var d7Count int64
		if d7End.Before(now) {
			s.db.Model(&AppSession{}).
				Where("app_id = ? AND started_at >= ? AND started_at < ? AND user_id IN (?)", appID, d7Start, d7End, subQuery).
				Distinct("user_id").
				Count(&d7Count)
		}
		
		// D30: voltaram entre dia 30 e 31
		d30Start := startOfDay.AddDate(0, 0, 30)
		d30End := d30Start.Add(24 * time.Hour)
		var d30Count int64
		if d30End.Before(now) {
			s.db.Model(&AppSession{}).
				Where("app_id = ? AND started_at >= ? AND started_at < ? AND user_id IN (?)", appID, d30Start, d30End, subQuery).
				Distinct("user_id").
				Count(&d30Count)
		}
		
		results = append(results, RetentionData{
			Date:     dateStr,
			NewUsers: newUsers,
			D1:       float64(d1Count) / float64(newUsers) * 100,
			D7:       float64(d7Count) / float64(newUsers) * 100,
			D30:      float64(d30Count) / float64(newUsers) * 100,
			D1Count:  d1Count,
			D7Count:  d7Count,
			D30Count: d30Count,
		})
	}
	
	return results, nil
}

// FunnelStep representa um passo do funil
type FunnelStep struct {
	Step       string  `json:"step"`        // Nome do passo
	Users      int64   `json:"users"`       // Usuários que chegaram
	Percentage float64 `json:"percentage"`  // % em relação ao primeiro passo
	DropOff    float64 `json:"drop_off"`    // % que abandonou nesse passo
}

// GetFunnel calcula funil de conversão por feature
func (s *TelemetryService) GetFunnel(appID uuid.UUID, since time.Duration) ([]FunnelStep, error) {
	if since <= 0 {
		since = 24 * time.Hour
	}
	
	cutoff := time.Now().Add(-since)
	
	// Definir passos do funil baseado em eventos
	steps := []struct {
		name  string
		event string
	}{
		{"Sessão Iniciada", EventSessionStart},
		{"Entrou na Fila", "interaction.queue.joined"},
		{"Match Criado", "interaction.match.created"},
		{"Mensagem Enviada", "interaction.message.sent"},
		{"Match Completo (>1min)", "interaction.match.ended"},
	}
	
	var results []FunnelStep
	var firstStepUsers int64
	
	for i, step := range steps {
		var users int64
		
		if step.event == "interaction.match.ended" {
			// Caso especial: match que durou mais de 1 minuto
			s.db.Model(&TelemetryEvent{}).
				Where("app_id = ? AND type = ? AND timestamp > ?", appID, step.event, cutoff).
				Where("metadata LIKE '%\"duration_ms\":%' AND CAST(JSON_EXTRACT(metadata, '$.duration_ms') AS INTEGER) > 60000").
				Distinct("user_id").
				Count(&users)
			
			// Fallback se JSON_EXTRACT não funcionar (PostgreSQL)
			if users == 0 {
				s.db.Model(&TelemetryEvent{}).
					Where("app_id = ? AND type = ? AND timestamp > ?", appID, step.event, cutoff).
					Distinct("user_id").
					Count(&users)
			}
		} else {
			s.db.Model(&TelemetryEvent{}).
				Where("app_id = ? AND type = ? AND timestamp > ?", appID, step.event, cutoff).
				Distinct("user_id").
				Count(&users)
		}
		
		if i == 0 {
			firstStepUsers = users
		}
		
		percentage := float64(0)
		if firstStepUsers > 0 {
			percentage = float64(users) / float64(firstStepUsers) * 100
		}
		
		dropOff := float64(0)
		if i > 0 && len(results) > 0 && results[i-1].Users > 0 {
			dropOff = (1 - float64(users)/float64(results[i-1].Users)) * 100
		}
		
		results = append(results, FunnelStep{
			Step:       step.name,
			Users:      users,
			Percentage: percentage,
			DropOff:    dropOff,
		})
	}
	
	return results, nil
}

// EngagementMetrics métricas de engajamento
type EngagementMetrics struct {
	AvgSessionDuration   float64 `json:"avg_session_duration_ms"`   // Duração média de sessão
	AvgEventsPerSession  float64 `json:"avg_events_per_session"`    // Eventos por sessão
	AvgMatchesPerUser    float64 `json:"avg_matches_per_user"`      // Matches por usuário
	AvgMessagesPerMatch  float64 `json:"avg_messages_per_match"`    // Mensagens por match
	BounceRate           float64 `json:"bounce_rate"`               // % sessões < 30s
	MatchRate            float64 `json:"match_rate"`                // % sessões que viraram match
}

// GetEngagementMetrics calcula métricas de engajamento
func (s *TelemetryService) GetEngagementMetrics(appID uuid.UUID, since time.Duration) (*EngagementMetrics, error) {
	if since <= 0 {
		since = 24 * time.Hour
	}
	
	cutoff := time.Now().Add(-since)
	metrics := &EngagementMetrics{}
	
	// Duração média de sessão (só sessões encerradas)
	var avgDuration struct{ Avg float64 }
	s.db.Model(&AppSession{}).
		Select("AVG(duration_ms) as avg").
		Where("app_id = ? AND ended_at IS NOT NULL AND started_at > ?", appID, cutoff).
		Scan(&avgDuration)
	metrics.AvgSessionDuration = avgDuration.Avg
	
	// Eventos por sessão
	var totalSessions int64
	var totalEvents int64
	s.db.Model(&AppSession{}).Where("app_id = ? AND started_at > ?", appID, cutoff).Count(&totalSessions)
	s.db.Model(&TelemetryEvent{}).Where("app_id = ? AND timestamp > ?", appID, cutoff).Count(&totalEvents)
	if totalSessions > 0 {
		metrics.AvgEventsPerSession = float64(totalEvents) / float64(totalSessions)
	}
	
	// Matches por usuário
	var uniqueUsers int64
	var totalMatches int64
	s.db.Model(&AppSession{}).Where("app_id = ? AND started_at > ?", appID, cutoff).Distinct("user_id").Count(&uniqueUsers)
	s.db.Model(&TelemetryEvent{}).Where("app_id = ? AND type = ? AND timestamp > ?", appID, "interaction.match.created", cutoff).Count(&totalMatches)
	if uniqueUsers > 0 {
		metrics.AvgMatchesPerUser = float64(totalMatches) / float64(uniqueUsers)
	}
	
	// Mensagens por match
	var totalMessages int64
	s.db.Model(&TelemetryEvent{}).Where("app_id = ? AND type = ? AND timestamp > ?", appID, "interaction.message.sent", cutoff).Count(&totalMessages)
	if totalMatches > 0 {
		metrics.AvgMessagesPerMatch = float64(totalMessages) / float64(totalMatches)
	}
	
	// Bounce rate (sessões < 30s)
	var bounceSessions int64
	s.db.Model(&AppSession{}).
		Where("app_id = ? AND ended_at IS NOT NULL AND started_at > ? AND duration_ms < 30000", appID, cutoff).
		Count(&bounceSessions)
	if totalSessions > 0 {
		metrics.BounceRate = float64(bounceSessions) / float64(totalSessions) * 100
	}
	
	// Match rate (sessões que tiveram match)
	var sessionsWithMatch int64
	s.db.Model(&AppSession{}).
		Where("app_id = ? AND started_at > ? AND interaction_count > 0", appID, cutoff).
		Count(&sessionsWithMatch)
	if totalSessions > 0 {
		metrics.MatchRate = float64(sessionsWithMatch) / float64(totalSessions) * 100
	}
	
	return metrics, nil
}


// ========================================
// 7. COMPARAÇÃO DE PERÍODOS - Medir impacto
// ========================================

// PeriodComparison comparação entre dois períodos
type PeriodComparison struct {
	Current  PeriodMetrics `json:"current"`
	Previous PeriodMetrics `json:"previous"`
	Changes  PeriodChanges `json:"changes"`
}

// PeriodMetrics métricas de um período
type PeriodMetrics struct {
	Period           string  `json:"period"`            // "current" ou "previous"
	StartDate        string  `json:"start_date"`
	EndDate          string  `json:"end_date"`
	TotalSessions    int64   `json:"total_sessions"`
	UniquUsers       int64   `json:"unique_users"`
	TotalEvents      int64   `json:"total_events"`
	TotalMatches     int64   `json:"total_matches"`
	AvgSessionDuration float64 `json:"avg_session_duration_ms"`
	BounceRate       float64 `json:"bounce_rate"`
	MatchRate        float64 `json:"match_rate"`
}

// PeriodChanges variação percentual entre períodos
type PeriodChanges struct {
	Sessions    float64 `json:"sessions_change"`     // % mudança
	Users       float64 `json:"users_change"`
	Events      float64 `json:"events_change"`
	Matches     float64 `json:"matches_change"`
	Duration    float64 `json:"duration_change"`
	BounceRate  float64 `json:"bounce_rate_change"`
	MatchRate   float64 `json:"match_rate_change"`
}

// ComparePeriods compara métricas entre dois períodos
func (s *TelemetryService) ComparePeriods(appID uuid.UUID, periodDays int) (*PeriodComparison, error) {
	if periodDays <= 0 || periodDays > 90 {
		periodDays = 7
	}
	
	now := time.Now()
	
	// Período atual: últimos N dias
	currentEnd := now
	currentStart := now.AddDate(0, 0, -periodDays)
	
	// Período anterior: N dias antes do período atual
	previousEnd := currentStart
	previousStart := previousEnd.AddDate(0, 0, -periodDays)
	
	current := s.calculatePeriodMetrics(appID, currentStart, currentEnd, "current")
	previous := s.calculatePeriodMetrics(appID, previousStart, previousEnd, "previous")
	
	changes := PeriodChanges{
		Sessions:   calculateChange(previous.TotalSessions, current.TotalSessions),
		Users:      calculateChange(previous.UniquUsers, current.UniquUsers),
		Events:     calculateChange(previous.TotalEvents, current.TotalEvents),
		Matches:    calculateChange(previous.TotalMatches, current.TotalMatches),
		Duration:   calculateChangeFloat(previous.AvgSessionDuration, current.AvgSessionDuration),
		BounceRate: current.BounceRate - previous.BounceRate, // Diferença absoluta
		MatchRate:  current.MatchRate - previous.MatchRate,   // Diferença absoluta
	}
	
	return &PeriodComparison{
		Current:  current,
		Previous: previous,
		Changes:  changes,
	}, nil
}

func (s *TelemetryService) calculatePeriodMetrics(appID uuid.UUID, start, end time.Time, period string) PeriodMetrics {
	metrics := PeriodMetrics{
		Period:    period,
		StartDate: start.Format("2006-01-02"),
		EndDate:   end.Format("2006-01-02"),
	}
	
	// Sessões
	s.db.Model(&AppSession{}).
		Where("app_id = ? AND started_at >= ? AND started_at < ?", appID, start, end).
		Count(&metrics.TotalSessions)
	
	// Usuários únicos
	s.db.Model(&AppSession{}).
		Where("app_id = ? AND started_at >= ? AND started_at < ?", appID, start, end).
		Distinct("user_id").
		Count(&metrics.UniquUsers)
	
	// Eventos
	s.db.Model(&TelemetryEvent{}).
		Where("app_id = ? AND timestamp >= ? AND timestamp < ?", appID, start, end).
		Count(&metrics.TotalEvents)
	
	// Matches
	s.db.Model(&TelemetryEvent{}).
		Where("app_id = ? AND type = ? AND timestamp >= ? AND timestamp < ?", appID, "interaction.match.created", start, end).
		Count(&metrics.TotalMatches)
	
	// Duração média
	var avgDuration struct{ Avg float64 }
	s.db.Model(&AppSession{}).
		Select("AVG(duration_ms) as avg").
		Where("app_id = ? AND ended_at IS NOT NULL AND started_at >= ? AND started_at < ?", appID, start, end).
		Scan(&avgDuration)
	metrics.AvgSessionDuration = avgDuration.Avg
	
	// Bounce rate
	if metrics.TotalSessions > 0 {
		var bounceSessions int64
		s.db.Model(&AppSession{}).
			Where("app_id = ? AND ended_at IS NOT NULL AND started_at >= ? AND started_at < ? AND duration_ms < 30000", appID, start, end).
			Count(&bounceSessions)
		metrics.BounceRate = float64(bounceSessions) / float64(metrics.TotalSessions) * 100
	}
	
	// Match rate
	if metrics.TotalSessions > 0 {
		var sessionsWithMatch int64
		s.db.Model(&AppSession{}).
			Where("app_id = ? AND started_at >= ? AND started_at < ? AND interaction_count > 0", appID, start, end).
			Count(&sessionsWithMatch)
		metrics.MatchRate = float64(sessionsWithMatch) / float64(metrics.TotalSessions) * 100
	}
	
	return metrics
}

func calculateChange(previous, current int64) float64 {
	if previous == 0 {
		if current == 0 {
			return 0
		}
		return 100 // De 0 para algo = +100%
	}
	return (float64(current) - float64(previous)) / float64(previous) * 100
}

func calculateChangeFloat(previous, current float64) float64 {
	if previous == 0 {
		if current == 0 {
			return 0
		}
		return 100
	}
	return (current - previous) / previous * 100
}

// ========================================
// 8. TOP USERS - Usuários mais engajados
// ========================================

// TopUser usuário com métricas de engajamento
type TopUser struct {
	UserID          string  `json:"user_id"`
	SessionCount    int64   `json:"session_count"`
	TotalDuration   int64   `json:"total_duration_ms"`
	EventCount      int64   `json:"event_count"`
	MatchCount      int64   `json:"match_count"`
	LastSeen        string  `json:"last_seen"`
}

// GetTopUsers retorna usuários mais engajados
func (s *TelemetryService) GetTopUsers(appID uuid.UUID, since time.Duration, limit int) ([]TopUser, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if since <= 0 {
		since = 7 * 24 * time.Hour
	}
	
	cutoff := time.Now().Add(-since)
	
	var results []TopUser
	
	err := s.db.Model(&AppSession{}).
		Select(`
			user_id,
			COUNT(*) as session_count,
			SUM(duration_ms) as total_duration,
			SUM(event_count) as event_count,
			SUM(interaction_count) as match_count,
			MAX(last_seen_at) as last_seen
		`).
		Where("app_id = ? AND started_at > ?", appID, cutoff).
		Group("user_id").
		Order("session_count DESC, total_duration DESC").
		Limit(limit).
		Scan(&results).Error
	
	if err != nil {
		return nil, err
	}
	
	// Formatar last_seen
	for i := range results {
		if results[i].LastSeen != "" {
			if t, err := time.Parse(time.RFC3339, results[i].LastSeen); err == nil {
				results[i].LastSeen = t.Format("2006-01-02 15:04")
			}
		}
	}
	
	return results, nil
}

// ========================================
// 9. HEATMAP DE ATIVIDADE - Quando usuários estão ativos
// ========================================

// HeatmapCell célula do heatmap (hora x dia da semana)
type HeatmapCell struct {
	DayOfWeek int   `json:"day_of_week"` // 0=Dom, 1=Seg, ..., 6=Sab
	Hour      int   `json:"hour"`        // 0-23
	Count     int64 `json:"count"`       // Quantidade de eventos/sessões
	Intensity float64 `json:"intensity"` // 0-1 normalizado
}

// HeatmapData dados completos do heatmap
type HeatmapData struct {
	Cells    []HeatmapCell `json:"cells"`
	MaxCount int64         `json:"max_count"`
	Period   string        `json:"period"`
}

// GetActivityHeatmap retorna heatmap de atividade por hora/dia
func (s *TelemetryService) GetActivityHeatmap(appID uuid.UUID, days int) (*HeatmapData, error) {
	if days <= 0 || days > 90 {
		days = 30
	}
	
	cutoff := time.Now().AddDate(0, 0, -days)
	
	// Query para agrupar por dia da semana e hora
	type HeatmapRow struct {
		DayOfWeek int
		Hour      int
		Count     int64
	}
	var rows []HeatmapRow
	
	// PostgreSQL: EXTRACT(DOW FROM timestamp), EXTRACT(HOUR FROM timestamp)
	err := s.db.Model(&TelemetryEvent{}).
		Select("EXTRACT(DOW FROM timestamp)::int as day_of_week, EXTRACT(HOUR FROM timestamp)::int as hour, COUNT(*) as count").
		Where("app_id = ? AND timestamp > ?", appID, cutoff).
		Group("day_of_week, hour").
		Order("day_of_week, hour").
		Scan(&rows).Error
	
	if err != nil {
		return nil, err
	}
	
	// Encontrar máximo para normalização
	var maxCount int64 = 1
	for _, row := range rows {
		if row.Count > maxCount {
			maxCount = row.Count
		}
	}
	
	// Criar mapa para lookup rápido
	countMap := make(map[string]int64)
	for _, row := range rows {
		key := fmt.Sprintf("%d-%d", row.DayOfWeek, row.Hour)
		countMap[key] = row.Count
	}
	
	// Gerar todas as células (7 dias x 24 horas)
	var cells []HeatmapCell
	for day := 0; day < 7; day++ {
		for hour := 0; hour < 24; hour++ {
			key := fmt.Sprintf("%d-%d", day, hour)
			count := countMap[key]
			cells = append(cells, HeatmapCell{
				DayOfWeek: day,
				Hour:      hour,
				Count:     count,
				Intensity: float64(count) / float64(maxCount),
			})
		}
	}
	
	return &HeatmapData{
		Cells:    cells,
		MaxCount: maxCount,
		Period:   fmt.Sprintf("%d days", days),
	}, nil
}

// ========================================
// 10. USER JOURNEY - Jornada do usuário
// ========================================

// JourneyStep passo na jornada do usuário
type JourneyStep struct {
	Step       int    `json:"step"`
	EventType  string `json:"event_type"`
	Feature    string `json:"feature"`
	Count      int64  `json:"count"`      // Quantos usuários passaram
	AvgTimeMs  int64  `json:"avg_time_ms"` // Tempo médio até próximo passo
	DropOff    float64 `json:"drop_off"`   // % que abandonou
}

// UserJourney jornada completa
type UserJourney struct {
	Steps       []JourneyStep `json:"steps"`
	TotalUsers  int64         `json:"total_users"`
	Completions int64         `json:"completions"` // Chegaram ao final
	Period      string        `json:"period"`
}

// GetUserJourney analisa jornada típica dos usuários
func (s *TelemetryService) GetUserJourney(appID uuid.UUID, since time.Duration) (*UserJourney, error) {
	if since <= 0 {
		since = 24 * time.Hour
	}
	
	cutoff := time.Now().Add(-since)
	
	// Definir passos da jornada (ordem esperada)
	journeySteps := []string{
		EventSessionStart,
		"nav.feature.enter",
		"interaction.queue.joined",
		"interaction.match.created",
		"interaction.message.sent",
		"interaction.match.ended",
	}
	
	// Contar usuários únicos que iniciaram
	var totalUsers int64
	s.db.Model(&TelemetryEvent{}).
		Where("app_id = ? AND type = ? AND timestamp > ?", appID, EventSessionStart, cutoff).
		Distinct("user_id").
		Count(&totalUsers)
	
	if totalUsers == 0 {
		return &UserJourney{
			Steps:      []JourneyStep{},
			TotalUsers: 0,
			Period:     since.String(),
		}, nil
	}
	
	var steps []JourneyStep
	prevCount := totalUsers
	
	for i, eventType := range journeySteps {
		var count int64
		s.db.Model(&TelemetryEvent{}).
			Where("app_id = ? AND type = ? AND timestamp > ?", appID, eventType, cutoff).
			Distinct("user_id").
			Count(&count)
		
		// Extrair feature se for nav.feature.enter
		feature := ""
		if eventType == "nav.feature.enter" {
			// Pegar feature mais comum
			type FeatureRow struct {
				Feature string
				Count   int64
			}
			var topFeature FeatureRow
			s.db.Model(&TelemetryEvent{}).
				Select("feature, COUNT(DISTINCT user_id) as count").
				Where("app_id = ? AND type = ? AND timestamp > ? AND feature != ''", appID, eventType, cutoff).
				Group("feature").
				Order("count DESC").
				Limit(1).
				Scan(&topFeature)
			feature = topFeature.Feature
		}
		
		dropOff := float64(0)
		if prevCount > 0 && i > 0 {
			dropOff = (1 - float64(count)/float64(prevCount)) * 100
		}
		
		steps = append(steps, JourneyStep{
			Step:      i + 1,
			EventType: eventType,
			Feature:   feature,
			Count:     count,
			DropOff:   dropOff,
		})
		
		prevCount = count
	}
	
	// Completions = usuários que chegaram ao último passo
	completions := int64(0)
	if len(steps) > 0 {
		completions = steps[len(steps)-1].Count
	}
	
	return &UserJourney{
		Steps:       steps,
		TotalUsers:  totalUsers,
		Completions: completions,
		Period:      since.String(),
	}, nil
}

// ========================================
// 11. GEOGRAPHIC DISTRIBUTION - Distribuição geográfica
// ========================================

// GeoData dados geográficos
type GeoData struct {
	Country  string  `json:"country"`
	Sessions int64   `json:"sessions"`
	Users    int64   `json:"users"`
	Percent  float64 `json:"percent"`
}

// GetGeoDistribution retorna distribuição geográfica
func (s *TelemetryService) GetGeoDistribution(appID uuid.UUID, since time.Duration, limit int) ([]GeoData, error) {
	if since <= 0 {
		since = 7 * 24 * time.Hour
	}
	if limit <= 0 || limit > 50 {
		limit = 10
	}
	
	cutoff := time.Now().Add(-since)
	
	var results []GeoData
	
	err := s.db.Model(&AppSession{}).
		Select("country, COUNT(*) as sessions, COUNT(DISTINCT user_id) as users").
		Where("app_id = ? AND started_at > ? AND country != ''", appID, cutoff).
		Group("country").
		Order("sessions DESC").
		Limit(limit).
		Scan(&results).Error
	
	if err != nil {
		return nil, err
	}
	
	// Calcular total para percentuais
	var totalSessions int64
	for _, r := range results {
		totalSessions += r.Sessions
	}
	
	// Calcular percentuais
	for i := range results {
		if totalSessions > 0 {
			results[i].Percent = float64(results[i].Sessions) / float64(totalSessions) * 100
		}
	}
	
	return results, nil
}

// ========================================
// 12. REAL-TIME STREAM - Eventos em tempo real
// ========================================

// LiveEvent evento para stream em tempo real
type LiveEvent struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	UserID    string `json:"user_id"`
	Feature   string `json:"feature"`
	Timestamp string `json:"timestamp"`
	TimeAgo   string `json:"time_ago"`
}

// GetLiveEvents retorna últimos eventos para stream
func (s *TelemetryService) GetLiveEvents(appID uuid.UUID, limit int) ([]LiveEvent, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	
	var events []TelemetryEvent
	err := s.db.Where("app_id = ?", appID).
		Order("timestamp DESC").
		Limit(limit).
		Find(&events).Error
	
	if err != nil {
		return nil, err
	}
	
	now := time.Now()
	var liveEvents []LiveEvent
	for _, e := range events {
		timeAgo := formatTimeAgo(now.Sub(e.Timestamp))
		liveEvents = append(liveEvents, LiveEvent{
			ID:        e.ID.String(),
			Type:      e.Type,
			UserID:    e.UserID.String()[:8] + "...", // Truncar para privacidade
			Feature:   e.Feature,
			Timestamp: e.Timestamp.Format(time.RFC3339),
			TimeAgo:   timeAgo,
		})
	}
	
	return liveEvents, nil
}

func formatTimeAgo(d time.Duration) string {
	if d < time.Minute {
		return fmt.Sprintf("%ds ago", int(d.Seconds()))
	}
	if d < time.Hour {
		return fmt.Sprintf("%dm ago", int(d.Minutes()))
	}
	if d < 24*time.Hour {
		return fmt.Sprintf("%dh ago", int(d.Hours()))
	}
	return fmt.Sprintf("%dd ago", int(d.Hours()/24))
}
