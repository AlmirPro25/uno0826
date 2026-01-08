package observer

import (
	"os"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// AGENT MEMORY SERVICE - Fase 24
// "Persistir sugestões, append-only, sem impacto no core"
// ========================================

// AgentMemoryService gerencia a memória de agentes
type AgentMemoryService struct {
	db *gorm.DB
}

// NewAgentMemoryService cria o serviço de memória
func NewAgentMemoryService(db *gorm.DB) *AgentMemoryService {
	return &AgentMemoryService{db: db}
}

// ========================================
// KILL SWITCH
// ========================================

// IsMemoryEnabled verifica se a memória está habilitada
func (s *AgentMemoryService) IsMemoryEnabled() bool {
	enabled := os.Getenv("AGENT_MEMORY_ENABLED")
	return enabled == "true" || enabled == "1"
}

// ========================================
// WRITE (APPEND-ONLY)
// ========================================

// StoreSuggestion persiste uma sugestão na memória
// APPEND-ONLY: nunca sobrescreve, nunca deleta
func (s *AgentMemoryService) StoreSuggestion(suggestion Suggestion) error {
	// Verificar kill switch
	if !s.IsMemoryEnabled() {
		return nil // Silenciosamente ignora se desabilitado
	}

	entry := AgentMemoryEntry{
		ID:           uuid.New(),
		Agent:        suggestion.Agent,
		Confidence:   suggestion.Confidence,
		Finding:      suggestion.Finding,
		Suggestion:   suggestion.Suggestion,
		SnapshotHash: suggestion.SnapshotHash,
		CreatedAt:    suggestion.GeneratedAt,
	}

	if err := s.db.Create(&entry).Error; err != nil {
		// Incrementar contador de falhas
		IncrementMemoryWriteFailures()
		return err
	}

	// Incrementar contadores de sucesso
	IncrementMemoryEntries()
	IncrementSuggestionsTotal()

	return nil
}

// StoreSuggestions persiste múltiplas sugestões
func (s *AgentMemoryService) StoreSuggestions(suggestions []Suggestion) error {
	if !s.IsMemoryEnabled() {
		return nil
	}

	for _, suggestion := range suggestions {
		if err := s.StoreSuggestion(suggestion); err != nil {
			// Continua mesmo com erro (best effort)
			continue
		}
	}

	return nil
}

// ========================================
// READ (READ-ONLY)
// ========================================

// GetMemory retorna entradas da memória
func (s *AgentMemoryService) GetMemory(query AgentMemoryQuery) ([]AgentMemoryEntry, error) {
	var entries []AgentMemoryEntry

	// Aplicar limite
	limit := query.Limit
	if limit <= 0 {
		limit = DefaultMemoryLimit
	}
	if limit > MaxMemoryLimit {
		limit = MaxMemoryLimit
	}

	q := s.db.Model(&AgentMemoryEntry{})

	// Filtrar por agente
	if query.Agent != "" {
		q = q.Where("agent = ?", query.Agent)
	}

	// Filtrar por janela temporal
	if query.Window != "" {
		since := parseWindow(query.Window)
		if since != nil {
			q = q.Where("created_at >= ?", since)
		}
	}

	// Filtrar por período
	if query.Since != nil {
		q = q.Where("created_at >= ?", query.Since)
	}
	if query.Until != nil {
		q = q.Where("created_at <= ?", query.Until)
	}

	// Ordenar por mais recente e limitar
	err := q.Order("created_at DESC").Limit(limit).Find(&entries).Error

	return entries, err
}

// GetMemoryByAgent retorna entradas de um agente específico
func (s *AgentMemoryService) GetMemoryByAgent(agent string, limit int) ([]AgentMemoryEntry, error) {
	return s.GetMemory(AgentMemoryQuery{
		Agent: agent,
		Limit: limit,
	})
}

// GetRecentMemory retorna entradas recentes
func (s *AgentMemoryService) GetRecentMemory(window string, limit int) ([]AgentMemoryEntry, error) {
	return s.GetMemory(AgentMemoryQuery{
		Window: window,
		Limit:  limit,
	})
}

// ========================================
// STATS (READ-ONLY)
// ========================================

// GetStats retorna estatísticas da memória
func (s *AgentMemoryService) GetStats() (*AgentMemoryStats, error) {
	stats := &AgentMemoryStats{
		EntriesByAgent: make(map[string]int64),
	}

	// Total de entradas
	s.db.Model(&AgentMemoryEntry{}).Count(&stats.TotalEntries)

	// Entradas por agente
	type AgentCount struct {
		Agent string
		Count int64
	}
	var agentCounts []AgentCount
	s.db.Model(&AgentMemoryEntry{}).
		Select("agent, count(*) as count").
		Group("agent").
		Scan(&agentCounts)

	for _, ac := range agentCounts {
		stats.EntriesByAgent[ac.Agent] = ac.Count
	}

	// Entrada mais antiga
	var oldest AgentMemoryEntry
	if err := s.db.Order("created_at ASC").First(&oldest).Error; err == nil {
		stats.OldestEntry = &oldest.CreatedAt
	}

	// Entrada mais recente
	var newest AgentMemoryEntry
	if err := s.db.Order("created_at DESC").First(&newest).Error; err == nil {
		stats.NewestEntry = &newest.CreatedAt
	}

	// Confiança média
	var avgConf float64
	s.db.Model(&AgentMemoryEntry{}).Select("AVG(confidence)").Scan(&avgConf)
	stats.AvgConfidence = avgConf

	return stats, nil
}

// ========================================
// HELPERS
// ========================================

// parseWindow converte string de janela em time.Time
func parseWindow(window string) *time.Time {
	now := time.Now()
	var since time.Time

	switch window {
	case "1h":
		since = now.Add(-1 * time.Hour)
	case "6h":
		since = now.Add(-6 * time.Hour)
	case "12h":
		since = now.Add(-12 * time.Hour)
	case "24h":
		since = now.Add(-24 * time.Hour)
	case "7d":
		since = now.Add(-7 * 24 * time.Hour)
	case "30d":
		since = now.Add(-30 * 24 * time.Hour)
	default:
		return nil
	}

	return &since
}

// ========================================
// MEMORY METRICS
// ========================================

var (
	suggestionsTotal     int64
	memoryEntriesTotal   int64
	memoryWriteFailures  int64
)

func IncrementSuggestionsTotal() {
	atomic.AddInt64(&suggestionsTotal, 1)
}

func IncrementMemoryEntries() {
	atomic.AddInt64(&memoryEntriesTotal, 1)
}

func IncrementMemoryWriteFailures() {
	atomic.AddInt64(&memoryWriteFailures, 1)
}

func GetMemoryMetrics() map[string]int64 {
	return map[string]int64{
		"agent_suggestions_total":          atomic.LoadInt64(&suggestionsTotal),
		"agent_memory_entries_total":       atomic.LoadInt64(&memoryEntriesTotal),
		"agent_memory_write_failures_total": atomic.LoadInt64(&memoryWriteFailures),
	}
}
