package telemetry

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// TELEMETRY MODELS - Sistema Nervoso do PROST-QS
// "Apps não calculam. Apps emitem. O kernel observa."
// ========================================

// ========================================
// 1. SESSION - O ciclo de vida da atenção
// ========================================

// AppSession representa uma sessão de usuário em um app
// Sessão ativa: ended_at == null && last_seen_at > now - 5min
type AppSession struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	AppID       uuid.UUID  `gorm:"type:uuid;index:idx_session_app" json:"app_id"`
	UserID      uuid.UUID  `gorm:"type:uuid;index:idx_session_user" json:"user_id"`
	DeviceID    string     `gorm:"size:100" json:"device_id,omitempty"`
	
	// Ciclo de vida
	StartedAt   time.Time  `gorm:"not null;index:idx_session_started" json:"started_at"`
	LastSeenAt  time.Time  `gorm:"not null;index:idx_session_lastseen" json:"last_seen_at"`
	EndedAt     *time.Time `gorm:"index:idx_session_ended" json:"ended_at,omitempty"`
	
	// Contexto
	IPAddress   string     `gorm:"size:45" json:"ip_address,omitempty"`
	UserAgent   string     `gorm:"size:500" json:"user_agent,omitempty"`
	Country     string     `gorm:"size:2" json:"country,omitempty"`
	
	// Estado atual
	CurrentFeature string   `gorm:"size:100" json:"current_feature,omitempty"` // video_chat, queue, lobby
	CurrentContext string   `gorm:"type:text" json:"current_context,omitempty"` // JSON com room_id, etc
	
	// Métricas da sessão
	EventCount     int      `gorm:"default:0" json:"event_count"`
	InteractionCount int    `gorm:"default:0" json:"interaction_count"`
	DurationMs     int64    `gorm:"default:0" json:"duration_ms"`
	
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (AppSession) TableName() string {
	return "telemetry_sessions"
}

// IsActive verifica se sessão está ativa (last_seen < 5min e não encerrada)
func (s *AppSession) IsActive() bool {
	if s.EndedAt != nil {
		return false
	}
	return time.Since(s.LastSeenAt) < 5*time.Minute
}

// IsOnlineNow verifica se está online agora (last_seen < 30s)
func (s *AppSession) IsOnlineNow() bool {
	if s.EndedAt != nil {
		return false
	}
	return time.Since(s.LastSeenAt) < 30*time.Second
}

// ========================================
// 2. EVENT - O fato semântico
// ========================================

// TelemetryEvent representa um evento semântico de um app
// Apps não decidem nada. Apps só relatam fatos.
type TelemetryEvent struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	AppID       uuid.UUID  `gorm:"type:uuid;index:idx_event_app" json:"app_id"`
	UserID      uuid.UUID  `gorm:"type:uuid;index:idx_event_user" json:"user_id"`
	SessionID   uuid.UUID  `gorm:"type:uuid;index:idx_event_session" json:"session_id"`
	
	// Tipo semântico (hierárquico)
	// Exemplos: session.start, presence.ping, interaction.message.sent
	Type        string     `gorm:"size:100;not null;index:idx_event_type" json:"type"`
	
	// Contexto do evento
	Feature     string     `gorm:"size:100;index:idx_event_feature" json:"feature,omitempty"` // video_chat, queue, lobby
	TargetID    string     `gorm:"size:100" json:"target_id,omitempty"`  // ID do alvo (outro user, room, etc)
	TargetType  string     `gorm:"size:50" json:"target_type,omitempty"` // user, room, resource
	
	// Dados extras
	Context     string     `gorm:"type:text" json:"context,omitempty"`   // JSON com dados contextuais
	Metadata    string     `gorm:"type:text" json:"metadata,omitempty"`  // JSON com dados extras
	
	// Origem
	IPAddress   string     `gorm:"size:45" json:"ip_address,omitempty"`
	UserAgent   string     `gorm:"size:500" json:"user_agent,omitempty"`
	
	// Timestamp do evento (quando aconteceu no app)
	Timestamp   time.Time  `gorm:"not null;index:idx_event_timestamp" json:"timestamp"`
	
	// Timestamp de ingestão (quando chegou no kernel)
	IngestedAt  time.Time  `gorm:"not null" json:"ingested_at"`
}

func (TelemetryEvent) TableName() string {
	return "telemetry_events"
}

// ========================================
// 3. METRICS SNAPSHOT - Dados prontos para dashboard
// ========================================

// AppMetricsSnapshot métricas agregadas de um app (atualizadas em tempo real)
type AppMetricsSnapshot struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	AppID       uuid.UUID  `gorm:"type:uuid;uniqueIndex" json:"app_id"`
	
	// Usuários
	TotalUsers       int64  `json:"total_users"`
	ActiveUsers24h   int64  `json:"active_users_24h"`
	ActiveUsers1h    int64  `json:"active_users_1h"`
	OnlineNow        int64  `json:"online_now"`        // last_seen < 30s
	
	// Sessões
	TotalSessions    int64  `json:"total_sessions"`
	ActiveSessions   int64  `json:"active_sessions"`   // não encerradas e last_seen < 5min
	
	// Eventos
	TotalEvents      int64  `json:"total_events"`
	Events24h        int64  `json:"events_24h"`
	Events1h         int64  `json:"events_1h"`
	EventsPerMinute  float64 `json:"events_per_minute"` // média últimos 5min
	
	// Interações
	TotalInteractions int64 `json:"total_interactions"`
	Interactions24h   int64 `json:"interactions_24h"`
	
	// Por feature (JSON)
	UsersByFeature   string `gorm:"type:text" json:"users_by_feature,omitempty"` // {"video_chat": 5, "queue": 3}
	
	// Timestamps
	LastEventAt      *time.Time `json:"last_event_at,omitempty"`
	LastSessionAt    *time.Time `json:"last_session_at,omitempty"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

func (AppMetricsSnapshot) TableName() string {
	return "telemetry_metrics_snapshots"
}

// ========================================
// 4. EVENT TYPES - Contrato oficial
// ========================================

// Tipos de eventos semânticos (hierárquicos)
const (
	// Sessão
	EventSessionStart    = "session.start"
	EventSessionPing     = "session.ping"     // heartbeat
	EventSessionEnd      = "session.end"
	EventSessionTimeout  = "session.timeout"
	EventSessionRecover  = "session.recover"  // reconexão sem inflar métricas
	
	// Presença
	EventPresencePing    = "presence.ping"
	EventPresenceIdle    = "presence.idle"
	EventPresenceAway    = "presence.away"
	
	// Navegação
	EventNavFeatureEnter = "nav.feature.enter"
	EventNavFeatureLeave = "nav.feature.leave"
	EventNavScreenView   = "nav.screen.view"
	
	// Interações user ↔ user
	EventInteractionMatchCreated  = "interaction.match.created"
	EventInteractionMatchEnded    = "interaction.match.ended"
	EventInteractionMessageSent   = "interaction.message.sent"
	EventInteractionCallStarted   = "interaction.call.started"
	EventInteractionCallEnded     = "interaction.call.ended"
	
	// Interações user ↔ sistema
	EventInteractionQueueJoined   = "interaction.queue.joined"
	EventInteractionQueueLeft     = "interaction.queue.left"
	EventInteractionSkip          = "interaction.skip"
	EventInteractionReport        = "interaction.report"
	
	// Erros
	EventErrorICEFailure    = "error.ice_failure"
	EventErrorConnection    = "error.connection"
	EventErrorGeneric       = "error.generic"
	
	// Capabilities
	EventCapabilityUsed     = "capability.used"
	EventCapabilityDenied   = "capability.denied"
)

// ========================================
// 5. PRESENCE THRESHOLDS
// ========================================

const (
	PresenceOnlineThreshold  = 30 * time.Second  // Online agora
	PresenceActiveThreshold  = 5 * time.Minute   // Sessão ativa
	PresenceActive1hThreshold = 1 * time.Hour    // Ativo última hora
	PresenceActive24hThreshold = 24 * time.Hour  // Ativo últimas 24h
)
