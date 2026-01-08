package observer

import (
	"sync/atomic"
	"time"
)

// ========================================
// AGENT METRICS - Fase 23
// "Observabilidade do próprio agente"
// ========================================

// agentMetrics é o singleton de métricas do agente
var agentMetrics = &AgentMetricsCollector{
	lastRunTimestamp: time.Time{},
}

// AgentMetricsCollector coleta métricas do agente
type AgentMetricsCollector struct {
	runsTotal         int64
	failuresTotal     int64
	lastRunTimestamp  time.Time
	lastRunDurationMs int64
}

// GetAgentMetrics retorna o coletor de métricas
func GetAgentMetrics() *AgentMetricsCollector {
	return agentMetrics
}

// IncrementRuns incrementa contador de execuções
func (m *AgentMetricsCollector) IncrementRuns() {
	atomic.AddInt64(&m.runsTotal, 1)
}

// IncrementFailures incrementa contador de falhas
func (m *AgentMetricsCollector) IncrementFailures() {
	atomic.AddInt64(&m.failuresTotal, 1)
}

// RecordRun registra uma execução
func (m *AgentMetricsCollector) RecordRun(duration time.Duration) {
	m.IncrementRuns()
	m.lastRunTimestamp = time.Now()
	atomic.StoreInt64(&m.lastRunDurationMs, duration.Milliseconds())
}

// Snapshot retorna snapshot das métricas
func (m *AgentMetricsCollector) Snapshot() AgentMetrics {
	return AgentMetrics{
		RunsTotal:         atomic.LoadInt64(&m.runsTotal),
		FailuresTotal:     atomic.LoadInt64(&m.failuresTotal),
		LastRunTimestamp:  m.lastRunTimestamp,
		LastRunDurationMs: atomic.LoadInt64(&m.lastRunDurationMs),
	}
}
