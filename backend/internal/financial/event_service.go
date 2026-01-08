package financial

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// ========================================
// FINANCIAL EVENT SERVICE
// "Diário oficial do dinheiro"
// ========================================

type FinancialEventService struct {
	db *gorm.DB
}

func NewFinancialEventService(db *gorm.DB) *FinancialEventService {
	return &FinancialEventService{db: db}
}

// ========================================
// CREATE EVENT
// ========================================

type CreateEventInput struct {
	AppID       uuid.UUID
	Provider    string
	Type        EventType
	Amount      int64
	Currency    string
	NetAmount   int64
	FeeAmount   int64
	ExternalID  string
	CustomerID  string
	UserID      *uuid.UUID
	Description string
	Metadata    map[string]interface{}
	RawPayload  []byte
	ParentID    *uuid.UUID
	OccurredAt  time.Time
}

// CreateEvent cria um novo evento financeiro
func (s *FinancialEventService) CreateEvent(input CreateEventInput) (*FinancialEvent, error) {
	// Verificar duplicata por external_id
	if input.ExternalID != "" {
		var existing FinancialEvent
		if err := s.db.Where("external_id = ? AND provider = ?", input.ExternalID, input.Provider).First(&existing).Error; err == nil {
			return &existing, errors.New("evento duplicado")
		}
	}

	var metadata datatypes.JSON
	if input.Metadata != nil {
		data, _ := json.Marshal(input.Metadata)
		metadata = datatypes.JSON(data)
	}

	event := &FinancialEvent{
		ID:          uuid.New(),
		AppID:       input.AppID,
		Provider:    input.Provider,
		Type:        input.Type,
		Status:      StatusProcessed,
		Amount:      input.Amount,
		Currency:    input.Currency,
		NetAmount:   input.NetAmount,
		FeeAmount:   input.FeeAmount,
		ExternalID:  input.ExternalID,
		CustomerID:  input.CustomerID,
		UserID:      input.UserID,
		Description: input.Description,
		Metadata:    metadata,
		RawPayload:  datatypes.JSON(input.RawPayload),
		ParentID:    input.ParentID,
		OccurredAt:  input.OccurredAt,
		ProcessedAt: time.Now(),
		CreatedAt:   time.Now(),
	}

	if err := s.db.Create(event).Error; err != nil {
		return nil, err
	}

	// Atualizar métricas
	go s.updateMetricsAsync(event)

	return event, nil
}

// ========================================
// QUERY EVENTS
// ========================================

// GetEvent retorna um evento por ID
func (s *FinancialEventService) GetEvent(id uuid.UUID) (*FinancialEvent, error) {
	var event FinancialEvent
	if err := s.db.First(&event, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &event, nil
}

// GetEventByExternalID retorna evento por ID externo
func (s *FinancialEventService) GetEventByExternalID(provider, externalID string) (*FinancialEvent, error) {
	var event FinancialEvent
	if err := s.db.Where("provider = ? AND external_id = ?", provider, externalID).First(&event).Error; err != nil {
		return nil, err
	}
	return &event, nil
}

// ListEventsByApp lista eventos de um app
func (s *FinancialEventService) ListEventsByApp(appID uuid.UUID, limit, offset int) ([]FinancialEvent, int64, error) {
	var events []FinancialEvent
	var total int64

	s.db.Model(&FinancialEvent{}).Where("app_id = ?", appID).Count(&total)

	err := s.db.Where("app_id = ?", appID).
		Order("occurred_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&events).Error

	return events, total, err
}

// ListEventsByType lista eventos por tipo
func (s *FinancialEventService) ListEventsByType(appID uuid.UUID, eventType EventType, limit int) ([]FinancialEvent, error) {
	var events []FinancialEvent
	err := s.db.Where("app_id = ? AND type = ?", appID, eventType).
		Order("occurred_at DESC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

// ListRecentEvents lista eventos recentes (global - super admin)
func (s *FinancialEventService) ListRecentEvents(limit int) ([]FinancialEvent, error) {
	var events []FinancialEvent
	err := s.db.Order("occurred_at DESC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

// ========================================
// AGGREGATIONS
// ========================================

// GetAppRevenue retorna receita de um app em um período
func (s *FinancialEventService) GetAppRevenue(appID uuid.UUID, since time.Time) (int64, error) {
	var total int64
	err := s.db.Model(&FinancialEvent{}).
		Where("app_id = ? AND type = ? AND occurred_at >= ?", appID, EventPaymentSucceeded, since).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&total).Error
	return total, err
}

// GetAppRefunds retorna total de reembolsos de um app
func (s *FinancialEventService) GetAppRefunds(appID uuid.UUID, since time.Time) (int64, error) {
	var total int64
	err := s.db.Model(&FinancialEvent{}).
		Where("app_id = ? AND type = ? AND occurred_at >= ?", appID, EventRefundSucceeded, since).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&total).Error
	return total, err
}

// GetEventCounts retorna contagem de eventos por tipo
func (s *FinancialEventService) GetEventCounts(appID uuid.UUID, since time.Time) (map[EventType]int64, error) {
	type Result struct {
		Type  EventType
		Count int64
	}
	var results []Result

	err := s.db.Model(&FinancialEvent{}).
		Where("app_id = ? AND occurred_at >= ?", appID, since).
		Select("type, count(*) as count").
		Group("type").
		Scan(&results).Error

	counts := make(map[EventType]int64)
	for _, r := range results {
		counts[r.Type] = r.Count
	}
	return counts, err
}

// ========================================
// METRICS UPDATE (async)
// ========================================

func (s *FinancialEventService) updateMetricsAsync(event *FinancialEvent) {
	// Atualizar métricas do app
	s.updateAppMetrics(event)
	
	// Atualizar snapshot diário
	s.updateDailySnapshot(event)
	
	// Atualizar métricas globais
	s.updateGlobalMetrics(event)
}

func (s *FinancialEventService) updateAppMetrics(event *FinancialEvent) {
	// Buscar ou criar métricas do app
	var metrics AppFinancialMetrics
	if err := s.db.Where("app_id = ?", event.AppID).First(&metrics).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			metrics = AppFinancialMetrics{
				ID:        uuid.New(),
				AppID:     event.AppID,
				CreatedAt: time.Now(),
			}
			s.db.Create(&metrics)
		}
	}

	now := time.Now()
	updates := map[string]interface{}{
		"last_event_at": now,
		"updated_at":    now,
	}

	switch event.Type {
	case EventPaymentSucceeded:
		updates["total_revenue"] = gorm.Expr("total_revenue + ?", event.Amount)
		updates["total_fees"] = gorm.Expr("total_fees + ?", event.FeeAmount)
		updates["net_revenue"] = gorm.Expr("net_revenue + ?", event.NetAmount)
		updates["payments_success"] = gorm.Expr("payments_success + 1")
		updates["last_payment_at"] = now
		
	case EventPaymentFailed:
		updates["payments_failed"] = gorm.Expr("payments_failed + 1")
		
	case EventRefundSucceeded:
		updates["total_refunds"] = gorm.Expr("total_refunds + ?", event.Amount)
		updates["net_revenue"] = gorm.Expr("net_revenue - ?", event.Amount)
		updates["refunds_count"] = gorm.Expr("refunds_count + 1")
		updates["last_refund_at"] = now
		
	case EventDisputeLost:
		updates["total_disputes"] = gorm.Expr("total_disputes + ?", event.Amount)
		updates["net_revenue"] = gorm.Expr("net_revenue - ?", event.Amount)
		updates["disputes_count"] = gorm.Expr("disputes_count + 1")
		updates["disputes_lost"] = gorm.Expr("disputes_lost + 1")
		
	case EventDisputeWon:
		updates["disputes_won"] = gorm.Expr("disputes_won + 1")
		
	case EventSubscriptionCreated:
		updates["active_subscriptions"] = gorm.Expr("active_subscriptions + 1")
		
	case EventSubscriptionCanceled:
		updates["active_subscriptions"] = gorm.Expr("active_subscriptions - 1")
		updates["churned_subscriptions"] = gorm.Expr("churned_subscriptions + 1")
	}

	s.db.Model(&AppFinancialMetrics{}).Where("app_id = ?", event.AppID).Updates(updates)
}

func (s *FinancialEventService) updateDailySnapshot(event *FinancialEvent) {
	today := time.Now().Truncate(24 * time.Hour)
	
	var snapshot DailyFinancialSnapshot
	if err := s.db.Where("app_id = ? AND date = ?", event.AppID, today).First(&snapshot).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			snapshot = DailyFinancialSnapshot{
				ID:        uuid.New(),
				AppID:     event.AppID,
				Date:      today,
				CreatedAt: time.Now(),
			}
			s.db.Create(&snapshot)
		}
	}

	updates := map[string]interface{}{}

	switch event.Type {
	case EventPaymentSucceeded:
		updates["revenue"] = gorm.Expr("revenue + ?", event.Amount)
		updates["fees"] = gorm.Expr("fees + ?", event.FeeAmount)
		updates["net_revenue"] = gorm.Expr("net_revenue + ?", event.NetAmount)
		updates["payments_success"] = gorm.Expr("payments_success + 1")
		
	case EventPaymentFailed:
		updates["payments_failed"] = gorm.Expr("payments_failed + 1")
		
	case EventRefundSucceeded:
		updates["refunds"] = gorm.Expr("refunds + ?", event.Amount)
		updates["net_revenue"] = gorm.Expr("net_revenue - ?", event.Amount)
		updates["refunds_count"] = gorm.Expr("refunds_count + 1")
		
	case EventSubscriptionCreated:
		updates["new_subscriptions"] = gorm.Expr("new_subscriptions + 1")
		
	case EventSubscriptionCanceled:
		updates["canceled_subscriptions"] = gorm.Expr("canceled_subscriptions + 1")
	}

	if len(updates) > 0 {
		s.db.Model(&DailyFinancialSnapshot{}).Where("app_id = ? AND date = ?", event.AppID, today).Updates(updates)
	}
}

func (s *FinancialEventService) updateGlobalMetrics(event *FinancialEvent) {
	// Buscar ou criar métricas globais (singleton)
	var metrics GlobalFinancialMetrics
	if err := s.db.First(&metrics).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			metrics = GlobalFinancialMetrics{
				ID: uuid.New(),
			}
			s.db.Create(&metrics)
		}
	}

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}

	switch event.Type {
	case EventPaymentSucceeded:
		updates["total_revenue"] = gorm.Expr("total_revenue + ?", event.Amount)
		updates["total_fees"] = gorm.Expr("total_fees + ?", event.FeeAmount)
		updates["net_revenue"] = gorm.Expr("net_revenue + ?", event.NetAmount)
		updates["total_payments"] = gorm.Expr("total_payments + 1")
		
	case EventRefundSucceeded:
		updates["total_refunds"] = gorm.Expr("total_refunds + ?", event.Amount)
		updates["net_revenue"] = gorm.Expr("net_revenue - ?", event.Amount)
	}

	s.db.Model(&GlobalFinancialMetrics{}).Updates(updates)
}
