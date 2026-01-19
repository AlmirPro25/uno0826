package warobs

import (
	"log"
	"prost-qs/backend/internal/killswitch"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// DEFENSE POLICY ENGINE
// "O Kernel protegendo a si mesmo"
// ========================================

type DefensePolicyEngine struct {
	persistence *PersistenceService
	ksService   *killswitch.KillSwitchService
	enabled     bool
}

// NewDefensePolicyEngine cria um novo motor de políticas de defesa
func NewDefensePolicyEngine(p *PersistenceService, ks *killswitch.KillSwitchService) *DefensePolicyEngine {
	return &DefensePolicyEngine{
		persistence: p,
		ksService:   ks,
		enabled:     true,
	}
}

// EvaluatePolicies avalia todas as políticas de autodefesa ativas
func (e *DefensePolicyEngine) EvaluatePolicies() {
	if !e.enabled || e.persistence == nil || e.ksService == nil {
		return
	}

	// Política 001: Circuit Breaker de Rota Crítica
	e.evaluateRouteCircuitBreaker()
}

// evaluateRouteCircuitBreaker verifica rotas que falham repetidamente
func (e *DefensePolicyEngine) evaluateRouteCircuitBreaker() {
	// 1. Buscar incidentes abertos nos últimos 60 minutos
	incidents, err := e.persistence.GetRecentIncidents(1) // 1 hora
	if err != nil {
		log.Printf("⚠️ [DEFENSE] Erro ao buscar incidentes: %v", err)
		return
	}

	// 2. Contar incidentes por rota
	routeFailures := make(map[string]int)
	routeIncidents := make(map[string][]uuid.UUID)

	for _, inc := range incidents {
		if inc.Status != "OPEN" {
			continue
		}
		for _, route := range inc.AffectedRoutes {
			routeFailures[route]++
			routeIncidents[route] = append(routeIncidents[route], inc.ID)
		}
	}

	// 3. Aplicar Política 001: Threshold >= 3 incidentes
	threshold := 3
	for route, count := range routeFailures {
		if count >= threshold {
			e.activateCircuitBreaker(route, count, routeIncidents[route])
		}
	}
}

func (e *DefensePolicyEngine) activateCircuitBreaker(route string, incidentCount int, incidentIDs []uuid.UUID) {
	scope := "route:" + route
	reason := "AUTO_DEFENSE: Circuit Breaker ativado por instabilidade recorrente (" + intToString(incidentCount) + " incidentes na última hora)"

	// Verificar se já está ativo para não spammar
	isAlreadyActive := e.ksService.IsActive(scope)
	if isAlreadyActive {
		return
	}

	log.Printf("🛑 [DEFENSE] Ativando Circuit Breaker para rota: %s (Incidents: %d)", route, incidentCount)

	// Ativar Kill-Switch por 10 minutos
	expiresIn := 10
	err := e.ksService.Activate(scope, reason, uuid.Nil, &expiresIn)
	if err != nil {
		log.Printf("⚠️ [DEFENSE] Falha ao ativar Kill-Switch: %v", err)
		return
	}

	// Registrar o pensamento do Kernel (KernelEvent)
	metadata := map[string]interface{}{
		"route":          route,
		"incident_count": incidentCount,
		"incident_ids":   incidentIDs,
		"policy":         "001-ROUTE-CIRCUIT-BREAKER",
		"duration_min":   expiresIn,
	}

	e.persistence.RecordKernelEvent(
		"AUTO_DEFENSE_ACTION",
		"defense_engine",
		reason,
		&incidentIDs[0], // Ligar ao primeiro incidente da série
		metadata,
	)
}

// ========================================
// ENFORCEMENT MIDDLEWARE
// ========================================

// GuardMiddleware intercepta requisições e aplica os bloqueios de autodefesa
func (e *DefensePolicyEngine) GuardMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !e.enabled || e.ksService == nil {
			c.Next()
			return
		}

		// 1. Verificar Kill-Switch Global
		if e.ksService.IsActive(killswitch.ScopeAll) {
			c.AbortWithStatusJSON(503, gin.H{
				"success": false,
				"error":   "SYSTEM_PAUSED",
				"message": "O sistema está em manutenção preventivo de emergência.",
			})
			return
		}

		// 2. Verificar Circuit Breaker por Rota
		routePath := c.FullPath()
		if routePath != "" {
			scope := "route:" + routePath
			if e.ksService.IsActive(scope) {
				c.AbortWithStatusJSON(429, gin.H{
					"success": false,
					"error":   "CIRCUIT_BREAKER",
					"message": "Acesso temporariamente bloqueado por instabilidade recorrente. O Kernel está protegendo este recurso.",
				})
				return
			}
		}

		c.Next()
	}
}
