package observer

import (
	"encoding/json"
	"log"
	"os"
	"sync"
	"time"
)

// ========================================
// OBSERVER SERVICE - Fase 23
// "Orquestra agentes com kill switch"
// ========================================

// ObserverService gerencia os agentes observers
type ObserverService struct {
	agent           *ObserverAgent
	snapshotBuilder *SnapshotBuilder
	memoryService   *AgentMemoryService
	
	// Cache de sugestões (read-only)
	suggestions     []Suggestion
	suggestionsMu   sync.RWMutex
	lastSnapshot    *ControlledSnapshot
}

// NewObserverService cria o serviço de observers
func NewObserverService(checker ReadyChecker, memoryService *AgentMemoryService) *ObserverService {
	return &ObserverService{
		agent:           NewObserverAgent(),
		snapshotBuilder: NewSnapshotBuilder(checker),
		memoryService:   memoryService,
		suggestions:     []Suggestion{},
	}
}

// IsEnabled verifica se agentes estão habilitados
func (s *ObserverService) IsEnabled() bool {
	// Kill switch via env
	enabled := os.Getenv("AGENTS_ENABLED")
	return enabled == "true" || enabled == "1"
}

// Run executa o agente e atualiza sugestões
// IMPORTANTE: Este método NÃO altera estado do sistema
// Apenas atualiza cache interno de sugestões
func (s *ObserverService) Run() error {
	// Verificar kill switch
	if !s.IsEnabled() {
		log.Println("[observer] Agentes desabilitados (AGENTS_ENABLED != true)")
		return nil
	}

	start := time.Now()

	// Construir snapshot (read-only do sistema)
	snapshot := s.snapshotBuilder.Build()

	// Executar análise (pure function)
	suggestions := s.agent.Analyze(snapshot)

	// Atualizar cache (única "escrita", mas é cache interno)
	s.suggestionsMu.Lock()
	s.suggestions = suggestions
	s.lastSnapshot = snapshot
	s.suggestionsMu.Unlock()

	// Persistir na memória (se habilitado)
	if s.memoryService != nil && len(suggestions) > 0 {
		s.memoryService.StoreSuggestions(suggestions)
	}

	duration := time.Since(start)

	// Registrar métricas
	GetAgentMetrics().RecordRun(duration)

	// Log estruturado
	s.logRun(snapshot, suggestions, duration)

	return nil
}

// GetSuggestions retorna sugestões atuais (read-only)
func (s *ObserverService) GetSuggestions() []Suggestion {
	s.suggestionsMu.RLock()
	defer s.suggestionsMu.RUnlock()
	
	// Retornar cópia para garantir imutabilidade
	result := make([]Suggestion, len(s.suggestions))
	copy(result, s.suggestions)
	return result
}

// GetLastSnapshot retorna último snapshot usado (read-only)
func (s *ObserverService) GetLastSnapshot() *ControlledSnapshot {
	s.suggestionsMu.RLock()
	defer s.suggestionsMu.RUnlock()
	return s.lastSnapshot
}

// GetMetrics retorna métricas do agente
func (s *ObserverService) GetMetrics() AgentMetrics {
	return GetAgentMetrics().Snapshot()
}

// logRun emite log estruturado da execução
func (s *ObserverService) logRun(snapshot *ControlledSnapshot, suggestions []Suggestion, duration time.Duration) {
	// Calcular hash do output
	outputData, _ := json.Marshal(suggestions)
	
	logEntry := map[string]interface{}{
		"level":          "info",
		"ts":             time.Now().Format(time.RFC3339),
		"msg":            "agent run completed",
		"agent_name":     AgentNameObserverV1,
		"snapshot_hash":  snapshot.SnapshotHash,
		"suggestions":    len(suggestions),
		"duration_ms":    duration.Milliseconds(),
	}
	
	if len(outputData) > 0 {
		logEntry["output_size"] = len(outputData)
	}

	logJSON, _ := json.Marshal(logEntry)
	log.Println(string(logJSON))
}
