package observer

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"time"
)

// ========================================
// OBSERVER MODEL - Fase 23
// "Agentes apenas observam, analisam e sugerem"
// ========================================

// ========================================
// SNAPSHOT CONTROLADO (INPUT DO AGENTE)
// ========================================

// ControlledSnapshot representa o input imutável para o agente
// Contém APENAS dados agregados, NUNCA dados pessoais
type ControlledSnapshot struct {
	// Metadata
	SnapshotVersion string    `json:"snapshot_version"`
	SnapshotHash    string    `json:"snapshot_hash"`
	WindowStart     time.Time `json:"window_start"`
	WindowEnd       time.Time `json:"window_end"`
	GeneratedAt     time.Time `json:"generated_at"`

	// Métricas agregadas (de /metrics/basic)
	Metrics SnapshotMetrics `json:"metrics"`

	// Status do sistema (de /health, /ready)
	SystemStatus SnapshotStatus `json:"system_status"`
}

// SnapshotMetrics contém contadores agregados
type SnapshotMetrics struct {
	AuditEventsTotal     int64 `json:"audit_events_total"`
	AppEventsTotal       int64 `json:"app_events_total"`
	AppEventsFailedTotal int64 `json:"app_events_failed_total"`
	RequestsTotal        int64 `json:"requests_total"`
	ErrorsTotal          int64 `json:"errors_total"`
	UptimeSeconds        int64 `json:"uptime_seconds"`
	GoRoutines           int   `json:"go_routines"`
	MemoryMB             uint64 `json:"memory_mb"`
}

// SnapshotStatus contém status do sistema
type SnapshotStatus struct {
	HealthStatus string `json:"health_status"` // "ok" ou "degraded"
	ReadyStatus  string `json:"ready_status"`  // "ok" ou "not_ready"
	DBStatus     string `json:"db_status"`     // "ok" ou "error"
	Version      string `json:"version"`
}

// ComputeHash calcula o hash SHA256 do snapshot
func (s *ControlledSnapshot) ComputeHash() string {
	// Criar cópia sem o hash para calcular
	temp := *s
	temp.SnapshotHash = ""
	
	data, _ := json.Marshal(temp)
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

// Seal finaliza o snapshot com hash
func (s *ControlledSnapshot) Seal() {
	s.SnapshotHash = s.ComputeHash()
}

// ========================================
// SUGGESTION (OUTPUT DO AGENTE)
// ========================================

// Suggestion representa o output estruturado do agente
type Suggestion struct {
	Agent        string    `json:"agent"`         // "observer_v1"
	Confidence   float64   `json:"confidence"`    // 0.0 - 1.0
	Finding      string    `json:"finding"`       // Observação objetiva
	Suggestion   string    `json:"suggestion"`    // Sugestão acionável
	SnapshotHash string    `json:"snapshot_hash"` // Hash do snapshot usado
	GeneratedAt  time.Time `json:"generated_at"`  // RFC3339
}

// ========================================
// AGENT METRICS
// ========================================

// AgentMetrics contém métricas do agente
type AgentMetrics struct {
	RunsTotal        int64     `json:"agent_runs_total"`
	FailuresTotal    int64     `json:"agent_failures_total"`
	LastRunTimestamp time.Time `json:"agent_last_run_timestamp"`
	LastRunDurationMs int64    `json:"agent_last_run_duration_ms"`
}

// ========================================
// CONSTANTS
// ========================================

const (
	AgentNameObserverV1 = "observer_v1"
	SnapshotVersionV1   = "1.0"
)
