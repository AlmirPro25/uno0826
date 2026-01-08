package financial

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// RECONCILIATION ENGINE
// "Seu ledger bate com a Stripe?"
// ========================================

// ReconciliationResult resultado de uma reconciliação
type ReconciliationResult struct {
	ID              uuid.UUID              `gorm:"type:text;primaryKey" json:"id"`
	AppID           uuid.UUID              `gorm:"type:text;not null;index" json:"app_id"`
	Provider        string                 `gorm:"type:text;not null" json:"provider"`
	Status          ReconciliationStatus   `gorm:"type:text;not null" json:"status"`
	
	// Período reconciliado
	PeriodStart     time.Time              `gorm:"not null" json:"period_start"`
	PeriodEnd       time.Time              `gorm:"not null" json:"period_end"`
	
	// Totais do Ledger interno
	LedgerRevenue   int64                  `json:"ledger_revenue"`
	LedgerRefunds   int64                  `json:"ledger_refunds"`
	LedgerCount     int64                  `json:"ledger_count"`
	
	// Totais do Provider (Stripe)
	ProviderRevenue int64                  `json:"provider_revenue"`
	ProviderRefunds int64                  `json:"provider_refunds"`
	ProviderCount   int64                  `json:"provider_count"`
	
	// Diferenças
	RevenueDiff     int64                  `json:"revenue_diff"`
	RefundsDiff     int64                  `json:"refunds_diff"`
	CountDiff       int64                  `json:"count_diff"`
	
	// Discrepâncias encontradas
	Discrepancies   string                 `gorm:"type:text" json:"-"` // JSON array
	DiscrepancyCount int                   `json:"discrepancy_count"`
	
	// Metadados
	ExecutedBy      string                 `gorm:"type:text" json:"executed_by"`
	ExecutedAt      time.Time              `gorm:"not null" json:"executed_at"`
	Duration        int64                  `json:"duration_ms"`
	Notes           string                 `gorm:"type:text" json:"notes,omitempty"`
	
	CreatedAt       time.Time              `gorm:"not null" json:"created_at"`
}

func (ReconciliationResult) TableName() string {
	return "reconciliation_results"
}

type ReconciliationStatus string

const (
	ReconciliationPending    ReconciliationStatus = "pending"
	ReconciliationRunning    ReconciliationStatus = "running"
	ReconciliationMatched    ReconciliationStatus = "matched"    // Tudo bateu
	ReconciliationMismatched ReconciliationStatus = "mismatched" // Divergências encontradas
	ReconciliationFailed     ReconciliationStatus = "failed"     // Erro na execução
)

// Discrepancy representa uma divergência específica
type Discrepancy struct {
	Type        string    `json:"type"`         // missing_in_ledger, missing_in_provider, amount_mismatch
	ExternalID  string    `json:"external_id"`
	LedgerValue int64     `json:"ledger_value,omitempty"`
	ProviderValue int64   `json:"provider_value,omitempty"`
	Difference  int64     `json:"difference,omitempty"`
	EventType   string    `json:"event_type,omitempty"`
	OccurredAt  time.Time `json:"occurred_at,omitempty"`
	Details     string    `json:"details,omitempty"`
}

// ========================================
// RECONCILIATION SERVICE
// ========================================

type ReconciliationService struct {
	db           *gorm.DB
	eventService *FinancialEventService
}

func NewReconciliationService(db *gorm.DB, eventService *FinancialEventService) *ReconciliationService {
	return &ReconciliationService{
		db:           db,
		eventService: eventService,
	}
}

// ReconcileApp executa reconciliação para um app
func (s *ReconciliationService) ReconcileApp(appID uuid.UUID, periodStart, periodEnd time.Time, executedBy string) (*ReconciliationResult, error) {
	startTime := time.Now()

	result := &ReconciliationResult{
		ID:          uuid.New(),
		AppID:       appID,
		Provider:    ProviderStripe,
		Status:      ReconciliationRunning,
		PeriodStart: periodStart,
		PeriodEnd:   periodEnd,
		ExecutedBy:  executedBy,
		ExecutedAt:  startTime,
		CreatedAt:   time.Now(),
	}

	// Salvar resultado inicial
	if err := s.db.Create(result).Error; err != nil {
		return nil, err
	}

	// 1. Buscar totais do ledger interno
	ledgerStats, err := s.getLedgerStats(appID, periodStart, periodEnd)
	if err != nil {
		s.failReconciliation(result, fmt.Sprintf("Erro ao buscar ledger: %v", err))
		return result, err
	}

	result.LedgerRevenue = ledgerStats.Revenue
	result.LedgerRefunds = ledgerStats.Refunds
	result.LedgerCount = ledgerStats.Count

	// 2. Buscar eventos individuais do ledger
	ledgerEvents, err := s.getLedgerEvents(appID, periodStart, periodEnd)
	if err != nil {
		s.failReconciliation(result, fmt.Sprintf("Erro ao buscar eventos: %v", err))
		return result, err
	}

	// 3. Para reconciliação real com Stripe, precisaríamos chamar a API
	// Por agora, vamos fazer reconciliação interna (consistência do ledger)
	providerStats, discrepancies := s.reconcileInternal(ledgerEvents)

	result.ProviderRevenue = providerStats.Revenue
	result.ProviderRefunds = providerStats.Refunds
	result.ProviderCount = providerStats.Count

	// 4. Calcular diferenças
	result.RevenueDiff = result.LedgerRevenue - result.ProviderRevenue
	result.RefundsDiff = result.LedgerRefunds - result.ProviderRefunds
	result.CountDiff = result.LedgerCount - result.ProviderCount

	// 5. Salvar discrepâncias
	if len(discrepancies) > 0 {
		discJSON, _ := json.Marshal(discrepancies)
		result.Discrepancies = string(discJSON)
		result.DiscrepancyCount = len(discrepancies)
		result.Status = ReconciliationMismatched
	} else if result.RevenueDiff != 0 || result.RefundsDiff != 0 {
		result.Status = ReconciliationMismatched
	} else {
		result.Status = ReconciliationMatched
	}

	// 6. Finalizar
	result.Duration = time.Since(startTime).Milliseconds()
	s.db.Save(result)

	return result, nil
}

// getLedgerStats retorna estatísticas agregadas do ledger
func (s *ReconciliationService) getLedgerStats(appID uuid.UUID, start, end time.Time) (*LedgerStats, error) {
	var stats LedgerStats

	// Revenue (pagamentos bem-sucedidos)
	s.db.Model(&FinancialEvent{}).
		Where("app_id = ? AND type = ? AND occurred_at BETWEEN ? AND ?", 
			appID, EventPaymentSucceeded, start, end).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&stats.Revenue)

	// Refunds
	s.db.Model(&FinancialEvent{}).
		Where("app_id = ? AND type = ? AND occurred_at BETWEEN ? AND ?", 
			appID, EventRefundSucceeded, start, end).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&stats.Refunds)

	// Count
	s.db.Model(&FinancialEvent{}).
		Where("app_id = ? AND occurred_at BETWEEN ? AND ?", appID, start, end).
		Count(&stats.Count)

	return &stats, nil
}

// getLedgerEvents retorna eventos individuais do ledger
func (s *ReconciliationService) getLedgerEvents(appID uuid.UUID, start, end time.Time) ([]FinancialEvent, error) {
	var events []FinancialEvent
	err := s.db.Where("app_id = ? AND occurred_at BETWEEN ? AND ?", appID, start, end).
		Order("occurred_at ASC").
		Find(&events).Error
	return events, err
}

// reconcileInternal faz verificações de consistência interna
func (s *ReconciliationService) reconcileInternal(events []FinancialEvent) (*LedgerStats, []Discrepancy) {
	stats := &LedgerStats{}
	var discrepancies []Discrepancy

	seenExternalIDs := make(map[string]bool)

	for _, event := range events {
		// Verificar duplicatas
		if event.ExternalID != "" {
			key := fmt.Sprintf("%s:%s", event.Provider, event.ExternalID)
			if seenExternalIDs[key] {
				discrepancies = append(discrepancies, Discrepancy{
					Type:       "duplicate_event",
					ExternalID: event.ExternalID,
					EventType:  string(event.Type),
					OccurredAt: event.OccurredAt,
					Details:    "Evento duplicado no ledger",
				})
			}
			seenExternalIDs[key] = true
		}

		// Verificar valores negativos (não deveria acontecer)
		if event.Amount < 0 {
			discrepancies = append(discrepancies, Discrepancy{
				Type:        "negative_amount",
				ExternalID:  event.ExternalID,
				LedgerValue: event.Amount,
				EventType:   string(event.Type),
				OccurredAt:  event.OccurredAt,
				Details:     "Valor negativo encontrado",
			})
		}

		// Verificar net_amount > amount (impossível)
		if event.NetAmount > event.Amount && event.Type.IsPositive() {
			discrepancies = append(discrepancies, Discrepancy{
				Type:          "invalid_net_amount",
				ExternalID:    event.ExternalID,
				LedgerValue:   event.Amount,
				ProviderValue: event.NetAmount,
				EventType:     string(event.Type),
				Details:       "Net amount maior que amount",
			})
		}

		// Acumular stats
		if event.Type == EventPaymentSucceeded {
			stats.Revenue += event.Amount
		}
		if event.Type == EventRefundSucceeded {
			stats.Refunds += event.Amount
		}
		stats.Count++
	}

	return stats, discrepancies
}

func (s *ReconciliationService) failReconciliation(result *ReconciliationResult, notes string) {
	result.Status = ReconciliationFailed
	result.Notes = notes
	result.Duration = time.Since(result.ExecutedAt).Milliseconds()
	s.db.Save(result)
}

// LedgerStats estatísticas do ledger
type LedgerStats struct {
	Revenue int64
	Refunds int64
	Count   int64
}

// ========================================
// QUERY METHODS
// ========================================

// GetReconciliationResult retorna um resultado por ID
func (s *ReconciliationService) GetReconciliationResult(id uuid.UUID) (*ReconciliationResult, error) {
	var result ReconciliationResult
	if err := s.db.First(&result, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &result, nil
}

// GetDiscrepancies retorna as discrepâncias de um resultado
func (s *ReconciliationService) GetDiscrepancies(result *ReconciliationResult) ([]Discrepancy, error) {
	if result.Discrepancies == "" {
		return []Discrepancy{}, nil
	}
	var discrepancies []Discrepancy
	if err := json.Unmarshal([]byte(result.Discrepancies), &discrepancies); err != nil {
		return nil, err
	}
	return discrepancies, nil
}

// ListReconciliations lista reconciliações de um app
func (s *ReconciliationService) ListReconciliations(appID uuid.UUID, limit int) ([]ReconciliationResult, error) {
	var results []ReconciliationResult
	err := s.db.Where("app_id = ?", appID).
		Order("executed_at DESC").
		Limit(limit).
		Find(&results).Error
	return results, err
}

// GetLastReconciliation retorna a última reconciliação de um app
func (s *ReconciliationService) GetLastReconciliation(appID uuid.UUID) (*ReconciliationResult, error) {
	var result ReconciliationResult
	if err := s.db.Where("app_id = ?", appID).
		Order("executed_at DESC").
		First(&result).Error; err != nil {
		return nil, err
	}
	return &result, nil
}

// ========================================
// GLOBAL RECONCILIATION (Super Admin)
// ========================================

// ReconcileAll executa reconciliação para todos os apps ativos
func (s *ReconciliationService) ReconcileAll(periodStart, periodEnd time.Time, executedBy string) ([]ReconciliationResult, error) {
	// Buscar todos os apps com eventos no período
	var appIDs []uuid.UUID
	s.db.Model(&FinancialEvent{}).
		Where("occurred_at BETWEEN ? AND ?", periodStart, periodEnd).
		Distinct("app_id").
		Pluck("app_id", &appIDs)

	var results []ReconciliationResult
	for _, appID := range appIDs {
		result, err := s.ReconcileApp(appID, periodStart, periodEnd, executedBy)
		if err != nil {
			// Log error but continue
			continue
		}
		results = append(results, *result)
	}

	return results, nil
}

// GetReconciliationSummary retorna resumo de todas as reconciliações
func (s *ReconciliationService) GetReconciliationSummary() (*ReconciliationSummary, error) {
	var summary ReconciliationSummary

	// Total de reconciliações
	s.db.Model(&ReconciliationResult{}).Count(&summary.TotalReconciliations)

	// Por status
	s.db.Model(&ReconciliationResult{}).Where("status = ?", ReconciliationMatched).Count(&summary.Matched)
	s.db.Model(&ReconciliationResult{}).Where("status = ?", ReconciliationMismatched).Count(&summary.Mismatched)
	s.db.Model(&ReconciliationResult{}).Where("status = ?", ReconciliationFailed).Count(&summary.Failed)

	// Total de discrepâncias
	s.db.Model(&ReconciliationResult{}).
		Select("COALESCE(SUM(discrepancy_count), 0)").
		Scan(&summary.TotalDiscrepancies)

	// Última reconciliação
	var last ReconciliationResult
	if err := s.db.Order("executed_at DESC").First(&last).Error; err == nil {
		summary.LastReconciliationAt = &last.ExecutedAt
	}

	return &summary, nil
}

// ReconciliationSummary resumo global
type ReconciliationSummary struct {
	TotalReconciliations int64      `json:"total_reconciliations"`
	Matched              int64      `json:"matched"`
	Mismatched           int64      `json:"mismatched"`
	Failed               int64      `json:"failed"`
	TotalDiscrepancies   int64      `json:"total_discrepancies"`
	LastReconciliationAt *time.Time `json:"last_reconciliation_at,omitempty"`
}
