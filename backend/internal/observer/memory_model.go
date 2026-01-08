package observer

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// AGENT MEMORY MODEL - Fase 24
// "O sistema lembra, mas não aprende"
// ========================================

// AgentMemoryEntry representa uma sugestão persistida
// APPEND-ONLY: nunca sobrescreve, nunca deleta automaticamente
type AgentMemoryEntry struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Agent        string    `gorm:"size:50;index" json:"agent"`
	Confidence   float64   `json:"confidence"`
	Finding      string    `gorm:"type:text" json:"finding"`
	Suggestion   string    `gorm:"type:text" json:"suggestion"`
	SnapshotHash string    `gorm:"size:64;index" json:"snapshot_hash"`
	CreatedAt    time.Time `gorm:"index" json:"created_at"`
}

// TableName define o nome da tabela
func (AgentMemoryEntry) TableName() string {
	return "agent_memory"
}

// ========================================
// MEMORY STATS
// ========================================

// AgentMemoryStats estatísticas da memória
type AgentMemoryStats struct {
	TotalEntries    int64            `json:"total_entries"`
	EntriesByAgent  map[string]int64 `json:"entries_by_agent"`
	OldestEntry     *time.Time       `json:"oldest_entry,omitempty"`
	NewestEntry     *time.Time       `json:"newest_entry,omitempty"`
	AvgConfidence   float64          `json:"avg_confidence"`
}

// ========================================
// MEMORY QUERY
// ========================================

// AgentMemoryQuery parâmetros de consulta
type AgentMemoryQuery struct {
	Agent     string     // Filtrar por agente
	Window    string     // Janela temporal (1h, 24h, 7d)
	Limit     int        // Limite de resultados
	Since     *time.Time // Desde quando
	Until     *time.Time // Até quando
}

// DefaultLimit limite padrão de resultados
const DefaultMemoryLimit = 100
const MaxMemoryLimit = 1000
