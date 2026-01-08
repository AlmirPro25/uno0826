package observer

import (
	"time"
)

// ========================================
// OBSERVER AGENT v1 - Fase 23
// "Detecta padrões simples, sugere ações para humanos"
// ========================================

// ObserverAgent é o agente de diagnóstico passivo
// CONTRATO DE SEGURANÇA:
// - NÃO tem credenciais
// - NÃO tem tokens
// - NÃO acessa secrets
// - NÃO acessa handlers mutáveis
// - NÃO acessa DB diretamente
// - NÃO acessa filas, jobs, eventos
// - APENAS recebe snapshot imutável
// - APENAS retorna sugestões
type ObserverAgent struct {
	name string
}

// NewObserverAgent cria um novo agente observer
func NewObserverAgent() *ObserverAgent {
	return &ObserverAgent{
		name: AgentNameObserverV1,
	}
}

// Analyze analisa o snapshot e retorna sugestões
// INPUT: ControlledSnapshot (imutável)
// OUTPUT: []Suggestion (read-only)
func (a *ObserverAgent) Analyze(snapshot *ControlledSnapshot) []Suggestion {
	var suggestions []Suggestion
	now := time.Now()

	// ========================================
	// REGRA 1: Erros subindo abruptamente
	// ========================================
	if snapshot.Metrics.ErrorsTotal > 0 {
		errorRate := float64(snapshot.Metrics.ErrorsTotal) / float64(max(snapshot.Metrics.RequestsTotal, 1))
		
		if errorRate > 0.1 { // Mais de 10% de erros
			suggestions = append(suggestions, Suggestion{
				Agent:        a.name,
				Confidence:   min(errorRate, 0.95), // Confiança proporcional à taxa
				Finding:      "Taxa de erros elevada detectada: " + formatPercent(errorRate),
				Suggestion:   "Sugestão: verificar logs de erro e endpoint /metrics/basic para identificar padrão",
				SnapshotHash: snapshot.SnapshotHash,
				GeneratedAt:  now,
			})
		}
	}

	// ========================================
	// REGRA 2: Eventos de app falhando
	// ========================================
	if snapshot.Metrics.AppEventsFailedTotal > 0 {
		failRate := float64(snapshot.Metrics.AppEventsFailedTotal) / float64(max(snapshot.Metrics.AppEventsTotal+snapshot.Metrics.AppEventsFailedTotal, 1))
		
		suggestions = append(suggestions, Suggestion{
			Agent:        a.name,
			Confidence:   0.7 + (failRate * 0.25), // 0.7 - 0.95
			Finding:      "Eventos de aplicação falhando: " + formatInt(snapshot.Metrics.AppEventsFailedTotal) + " falhas",
			Suggestion:   "Sugestão: verificar conectividade com apps externos e credenciais",
			SnapshotHash: snapshot.SnapshotHash,
			GeneratedAt:  now,
		})
	}

	// ========================================
	// REGRA 3: Divergência requests vs eventos
	// ========================================
	if snapshot.Metrics.RequestsTotal > 100 && snapshot.Metrics.AppEventsTotal == 0 {
		suggestions = append(suggestions, Suggestion{
			Agent:        a.name,
			Confidence:   0.6,
			Finding:      "Sistema recebendo requests mas nenhum evento de app registrado",
			Suggestion:   "Sugestão: verificar se apps externos estão configurados corretamente",
			SnapshotHash: snapshot.SnapshotHash,
			GeneratedAt:  now,
		})
	}

	// ========================================
	// REGRA 4: Sistema "ok" mas eventos não fluem
	// ========================================
	if snapshot.SystemStatus.HealthStatus == "ok" && 
	   snapshot.SystemStatus.ReadyStatus == "ok" &&
	   snapshot.Metrics.UptimeSeconds > 300 && // Mais de 5 min
	   snapshot.Metrics.AuditEventsTotal == 0 &&
	   snapshot.Metrics.AppEventsTotal == 0 {
		suggestions = append(suggestions, Suggestion{
			Agent:        a.name,
			Confidence:   0.5,
			Finding:      "Sistema saudável mas sem atividade de eventos após " + formatDuration(snapshot.Metrics.UptimeSeconds),
			Suggestion:   "Sugestão: verificar se há tráfego real chegando ao sistema",
			SnapshotHash: snapshot.SnapshotHash,
			GeneratedAt:  now,
		})
	}

	// ========================================
	// REGRA 5: DB com problema
	// ========================================
	if snapshot.SystemStatus.DBStatus != "ok" {
		suggestions = append(suggestions, Suggestion{
			Agent:        a.name,
			Confidence:   0.95,
			Finding:      "Banco de dados reportando status: " + snapshot.SystemStatus.DBStatus,
			Suggestion:   "Sugestão: verificar conectividade do banco e endpoint /ready",
			SnapshotHash: snapshot.SnapshotHash,
			GeneratedAt:  now,
		})
	}

	// ========================================
	// REGRA 6: Memória elevada
	// ========================================
	if snapshot.Metrics.MemoryMB > 500 { // Mais de 500MB
		suggestions = append(suggestions, Suggestion{
			Agent:        a.name,
			Confidence:   0.6,
			Finding:      "Uso de memória elevado: " + formatInt(int64(snapshot.Metrics.MemoryMB)) + "MB",
			Suggestion:   "Sugestão: monitorar tendência de memória, considerar restart se continuar subindo",
			SnapshotHash: snapshot.SnapshotHash,
			GeneratedAt:  now,
		})
	}

	// ========================================
	// REGRA 7: Muitas goroutines
	// ========================================
	if snapshot.Metrics.GoRoutines > 1000 {
		suggestions = append(suggestions, Suggestion{
			Agent:        a.name,
			Confidence:   0.7,
			Finding:      "Número elevado de goroutines: " + formatInt(int64(snapshot.Metrics.GoRoutines)),
			Suggestion:   "Sugestão: verificar se há leak de goroutines ou conexões não fechadas",
			SnapshotHash: snapshot.SnapshotHash,
			GeneratedAt:  now,
		})
	}

	return suggestions
}

// ========================================
// HELPERS (sem side effects)
// ========================================

func max(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func formatPercent(rate float64) string {
	return formatFloat(rate*100) + "%"
}

func formatFloat(f float64) string {
	// Simples formatação sem dependências
	i := int(f * 100)
	return formatInt(int64(i/100)) + "." + formatInt(int64(i%100))
}

func formatInt(n int64) string {
	if n == 0 {
		return "0"
	}
	if n < 0 {
		return "-" + formatInt(-n)
	}
	
	var digits []byte
	for n > 0 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
		n /= 10
	}
	return string(digits)
}

func formatDuration(seconds int64) string {
	if seconds < 60 {
		return formatInt(seconds) + "s"
	}
	if seconds < 3600 {
		return formatInt(seconds/60) + "m"
	}
	return formatInt(seconds/3600) + "h"
}
