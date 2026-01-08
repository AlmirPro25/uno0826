package audit

import (
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// AUDIT SERVICE - LOGGER IMUTÁVEL
// "Append-only, hash encadeado"
// ========================================

type AuditService struct {
	db         *gorm.DB
	lastHash   string
	hashMutex  sync.Mutex
}

func NewAuditService(db *gorm.DB) *AuditService {
	s := &AuditService{db: db}
	s.initLastHash()
	return s
}

// initLastHash busca o hash do último evento
func (s *AuditService) initLastHash() {
	var lastEvent AuditEvent
	if err := s.db.Order("sequence DESC").First(&lastEvent).Error; err == nil {
		s.lastHash = lastEvent.Hash
	} else {
		s.lastHash = "genesis" // primeiro evento
	}
}

// ========================================
// LOGGING
// ========================================

// Log registra um evento no audit log
func (s *AuditService) Log(event *AuditEvent) error {
	s.hashMutex.Lock()
	defer s.hashMutex.Unlock()

	event.ID = uuid.New()
	event.CreatedAt = time.Now()
	event.PreviousHash = s.lastHash
	event.Hash = event.ComputeHash()

	if err := s.db.Create(event).Error; err != nil {
		return err
	}

	s.lastHash = event.Hash
	return nil
}

// LogSimple registra um evento simples
func (s *AuditService) LogSimple(eventType string, actorID, targetID uuid.UUID, actorType, targetType, action, reason string) error {
	return s.Log(&AuditEvent{
		Type:       eventType,
		ActorID:    actorID,
		ActorType:  actorType,
		TargetID:   targetID,
		TargetType: targetType,
		Action:     action,
		Reason:     reason,
	})
}

// LogWithData registra um evento com dados before/after
func (s *AuditService) LogWithData(eventType string, actorID, targetID uuid.UUID, actorType, targetType, action string, before, after, metadata map[string]any, reason string) error {
	return s.Log(&AuditEvent{
		Type:       eventType,
		ActorID:    actorID,
		ActorType:  actorType,
		TargetID:   targetID,
		TargetType: targetType,
		Action:     action,
		Before:     before,
		After:      after,
		Metadata:   metadata,
		Reason:     reason,
	})
}

// LogWithPolicy registra um evento com política associada
func (s *AuditService) LogWithPolicy(eventType string, actorID, targetID uuid.UUID, actorType, targetType, action string, policyID *uuid.UUID, reason string) error {
	return s.Log(&AuditEvent{
		Type:       eventType,
		ActorID:    actorID,
		ActorType:  actorType,
		TargetID:   targetID,
		TargetType: targetType,
		Action:     action,
		PolicyID:   policyID,
		Reason:     reason,
	})
}

// LogWithRequest registra um evento com dados de request
func (s *AuditService) LogWithRequest(eventType string, actorID, targetID uuid.UUID, actorType, targetType, action, ip, userAgent, reason string) error {
	return s.Log(&AuditEvent{
		Type:       eventType,
		ActorID:    actorID,
		ActorType:  actorType,
		TargetID:   targetID,
		TargetType: targetType,
		Action:     action,
		IP:         ip,
		UserAgent:  userAgent,
		Reason:     reason,
	})
}

// ========================================
// LOGGING COM APP CONTEXT - Fase 16
// "Este evento aconteceu em qual aplicativo?"
// ========================================

// LogWithAppContext registra um evento com contexto de aplicação completo
func (s *AuditService) LogWithAppContext(ctx *AuditContext, eventType string, actorID, targetID uuid.UUID, actorType, targetType, action string, before, after, metadata map[string]any, reason string) error {
	event := &AuditEvent{
		Type:       eventType,
		ActorID:    actorID,
		ActorType:  actorType,
		TargetID:   targetID,
		TargetType: targetType,
		Action:     action,
		Before:     before,
		After:      after,
		Metadata:   metadata,
		Reason:     reason,
	}

	// Adicionar contexto de app se disponível
	if ctx != nil {
		event.AppID = ctx.AppID
		event.AppUserID = ctx.AppUserID
		event.SessionID = ctx.SessionID
		event.IP = ctx.IP
		event.UserAgent = ctx.UserAgent
	}

	return s.Log(event)
}

// LogAppEvent registra um evento simples com app context
func (s *AuditService) LogAppEvent(appID *uuid.UUID, eventType string, actorID, targetID uuid.UUID, actorType, targetType, action, reason string) error {
	return s.Log(&AuditEvent{
		AppID:      appID,
		Type:       eventType,
		ActorID:    actorID,
		ActorType:  actorType,
		TargetID:   targetID,
		TargetType: targetType,
		Action:     action,
		Reason:     reason,
	})
}

// ========================================
// QUERIES
// ========================================

// Query busca eventos com filtros
func (s *AuditService) Query(q AuditQuery) ([]AuditEvent, int64, error) {
	var events []AuditEvent
	var total int64

	query := s.db.Model(&AuditEvent{})

	// Fase 16: Filtrar por app_id
	if q.AppID != "" {
		query = query.Where("app_id = ?", q.AppID)
	}
	if q.Type != "" {
		query = query.Where("type = ?", q.Type)
	}
	if q.ActorID != "" {
		query = query.Where("actor_id = ?", q.ActorID)
	}
	if q.TargetID != "" {
		query = query.Where("target_id = ?", q.TargetID)
	}
	if q.TargetType != "" {
		query = query.Where("target_type = ?", q.TargetType)
	}
	if !q.StartDate.IsZero() {
		query = query.Where("created_at >= ?", q.StartDate)
	}
	if !q.EndDate.IsZero() {
		query = query.Where("created_at <= ?", q.EndDate)
	}

	query.Count(&total)

	if q.Limit == 0 {
		q.Limit = 100
	}

	err := query.Order("sequence DESC").
		Offset(q.Offset).
		Limit(q.Limit).
		Find(&events).Error

	return events, total, err
}

// GetEventsByApp busca eventos de um app específico
func (s *AuditService) GetEventsByApp(appID uuid.UUID, limit int) ([]AuditEvent, error) {
	var events []AuditEvent
	err := s.db.Where("app_id = ?", appID).
		Order("sequence DESC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

// GetAppStats retorna estatísticas de audit por app
func (s *AuditService) GetAppStats(appID uuid.UUID) (map[string]any, error) {
	var total int64
	var lastEvent AuditEvent

	s.db.Model(&AuditEvent{}).Where("app_id = ?", appID).Count(&total)
	s.db.Where("app_id = ?", appID).Order("sequence DESC").First(&lastEvent)

	// Contar por tipo
	type TypeCount struct {
		Type  string
		Count int64
	}
	var typeCounts []TypeCount
	s.db.Model(&AuditEvent{}).
		Select("type, count(*) as count").
		Where("app_id = ?", appID).
		Group("type").
		Order("count DESC").
		Limit(10).
		Scan(&typeCounts)

	typeMap := make(map[string]int64)
	for _, tc := range typeCounts {
		typeMap[tc.Type] = tc.Count
	}

	return map[string]any{
		"app_id":         appID,
		"total_events":   total,
		"last_event_at":  lastEvent.CreatedAt,
		"events_by_type": typeMap,
	}, nil
}

// GetByID busca um evento por ID
func (s *AuditService) GetByID(id uuid.UUID) (*AuditEvent, error) {
	var event AuditEvent
	if err := s.db.Where("id = ?", id).First(&event).Error; err != nil {
		return nil, err
	}
	return &event, nil
}

// GetBySequence busca um evento por sequência
func (s *AuditService) GetBySequence(seq int64) (*AuditEvent, error) {
	var event AuditEvent
	if err := s.db.Where("sequence = ?", seq).First(&event).Error; err != nil {
		return nil, err
	}
	return &event, nil
}

// GetEventsByActor busca eventos de um ator
func (s *AuditService) GetEventsByActor(actorID uuid.UUID, limit int) ([]AuditEvent, error) {
	var events []AuditEvent
	err := s.db.Where("actor_id = ?", actorID).
		Order("sequence DESC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

// GetEventsByTarget busca eventos de um alvo
func (s *AuditService) GetEventsByTarget(targetID uuid.UUID, limit int) ([]AuditEvent, error) {
	var events []AuditEvent
	err := s.db.Where("target_id = ?", targetID).
		Order("sequence DESC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

// GetRecentEvents busca eventos recentes
func (s *AuditService) GetRecentEvents(limit int) ([]AuditEvent, error) {
	var events []AuditEvent
	err := s.db.Order("sequence DESC").Limit(limit).Find(&events).Error
	return events, err
}

// ========================================
// INTEGRIDADE
// ========================================

// VerifyChain verifica a integridade da cadeia de eventos
func (s *AuditService) VerifyChain(startSeq, endSeq int64) (bool, error) {
	var events []AuditEvent
	err := s.db.Where("sequence >= ? AND sequence <= ?", startSeq, endSeq).
		Order("sequence ASC").
		Find(&events).Error
	if err != nil {
		return false, err
	}

	if len(events) == 0 {
		return true, nil
	}

	for i, event := range events {
		// Verificar hash
		computedHash := event.ComputeHash()
		if computedHash != event.Hash {
			return false, nil
		}

		// Verificar encadeamento
		if i > 0 {
			if event.PreviousHash != events[i-1].Hash {
				return false, nil
			}
		}
	}

	return true, nil
}

// GetChainStatus retorna status da cadeia
func (s *AuditService) GetChainStatus() (map[string]any, error) {
	var count int64
	var firstEvent, lastEvent AuditEvent

	s.db.Model(&AuditEvent{}).Count(&count)
	s.db.Order("sequence ASC").First(&firstEvent)
	s.db.Order("sequence DESC").First(&lastEvent)

	return map[string]any{
		"total_events":   count,
		"first_sequence": firstEvent.Sequence,
		"last_sequence":  lastEvent.Sequence,
		"last_hash":      lastEvent.Hash,
		"last_event_at":  lastEvent.CreatedAt,
	}, nil
}
