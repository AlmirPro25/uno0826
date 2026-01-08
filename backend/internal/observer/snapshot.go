package observer

import (
	"runtime"
	"time"

	"prost-qs/backend/internal/observability"
)

// ========================================
// SNAPSHOT BUILDER - Fase 23
// "Snapshot controlado, imutável, sem dados pessoais"
// ========================================

// SnapshotBuilder constrói snapshots controlados
type SnapshotBuilder struct {
	readyChecker ReadyChecker
}

// ReadyChecker interface para verificar status
type ReadyChecker interface {
	CheckDB() error
	CheckSecrets() error
}

// NewSnapshotBuilder cria um novo builder
func NewSnapshotBuilder(checker ReadyChecker) *SnapshotBuilder {
	return &SnapshotBuilder{readyChecker: checker}
}

// Build cria um snapshot controlado do estado atual
// IMPORTANTE: Este método NÃO acessa dados pessoais, apenas métricas agregadas
func (b *SnapshotBuilder) Build() *ControlledSnapshot {
	now := time.Now()
	
	// Obter métricas do observability (já existente)
	metricsSnapshot := observability.GetMetrics().Snapshot()
	
	// Obter memory stats
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)
	
	// Verificar status
	healthStatus := "ok"
	readyStatus := "ok"
	dbStatus := "ok"
	
	if b.readyChecker != nil {
		if err := b.readyChecker.CheckDB(); err != nil {
			dbStatus = "error"
			readyStatus = "not_ready"
		}
		if err := b.readyChecker.CheckSecrets(); err != nil {
			readyStatus = "not_ready"
		}
	}
	
	snapshot := &ControlledSnapshot{
		SnapshotVersion: SnapshotVersionV1,
		WindowStart:     observability.GetMetrics().StartTime,
		WindowEnd:       now,
		GeneratedAt:     now,
		Metrics: SnapshotMetrics{
			AuditEventsTotal:     metricsSnapshot.AuditEventsTotal,
			AppEventsTotal:       metricsSnapshot.AppEventsTotal,
			AppEventsFailedTotal: metricsSnapshot.AppEventsFailedTotal,
			RequestsTotal:        metricsSnapshot.RequestsTotal,
			ErrorsTotal:          metricsSnapshot.ErrorsTotal,
			UptimeSeconds:        metricsSnapshot.UptimeSeconds,
			GoRoutines:           runtime.NumGoroutine(),
			MemoryMB:             memStats.Alloc / 1024 / 1024,
		},
		SystemStatus: SnapshotStatus{
			HealthStatus: healthStatus,
			ReadyStatus:  readyStatus,
			DBStatus:     dbStatus,
			Version:      observability.GitCommit,
		},
	}
	
	// Selar com hash
	snapshot.Seal()
	
	return snapshot
}
