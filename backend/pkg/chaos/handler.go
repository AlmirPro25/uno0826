package chaos

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

// ========================================
// CHAOS ENGINEERING HTTP HANDLERS
// "Controle total sobre o caos"
// ========================================

var globalChaosMonkey *ChaosMonkey

// InitChaos inicializa o chaos monkey
func InitChaos() *ChaosMonkey {
	globalChaosMonkey = NewChaosMonkey()
	
	// Só habilitar se explicitamente configurado
	if os.Getenv("CHAOS_ENABLED") == "true" {
		globalChaosMonkey.Enable()
	}
	
	return globalChaosMonkey
}

// GetChaosMonkey retorna a instância global
func GetChaosMonkey() *ChaosMonkey {
	return globalChaosMonkey
}

// RegisterRoutes registra as rotas do chaos engineering
func RegisterRoutes(r *gin.RouterGroup) {
	chaos := r.Group("/chaos")
	{
		// Status
		chaos.GET("/status", getStatus)
		
		// Control
		chaos.POST("/enable", enableChaos)
		chaos.POST("/disable", disableChaos)
		
		// Experiments
		chaos.GET("/experiments", listExperiments)
		chaos.POST("/experiments", createExperiment)
		chaos.GET("/experiments/:id", getExperiment)
		chaos.POST("/experiments/:id/start", startExperiment)
		chaos.POST("/experiments/:id/stop", stopExperiment)
		chaos.DELETE("/experiments/:id", deleteExperiment)
		
		// Quick Actions
		chaos.POST("/inject/latency", injectLatency)
		chaos.POST("/inject/error", injectError)
		chaos.POST("/inject/blackhole", injectBlackhole)
		
		// Game Days
		chaos.GET("/gamedays", listGameDays)
		chaos.POST("/gamedays/standard", runStandardGameDay)
	}
}

// ========================================
// STATUS HANDLERS
// ========================================

func getStatus(c *gin.Context) {
	if globalChaosMonkey == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "chaos monkey not initialized"})
		return
	}

	activeExperiments := globalChaosMonkey.GetActiveExperiments()
	
	c.JSON(http.StatusOK, gin.H{
		"enabled":            globalChaosMonkey.IsEnabled(),
		"active_experiments": len(activeExperiments),
		"experiments":        activeExperiments,
		"metrics":            globalChaosMonkey.metrics,
		"warning":            "⚠️ Chaos engineering can cause service disruption",
	})
}

func enableChaos(c *gin.Context) {
	if globalChaosMonkey == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "chaos monkey not initialized"})
		return
	}

	// Verificar se está em produção
	if os.Getenv("GIN_MODE") == "release" {
		// Requerer confirmação explícita
		var req struct {
			Confirm string `json:"confirm"`
		}
		if err := c.ShouldBindJSON(&req); err != nil || req.Confirm != "I_UNDERSTAND_THE_RISKS" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Production environment requires explicit confirmation",
				"message": "Send {\"confirm\": \"I_UNDERSTAND_THE_RISKS\"} to enable",
			})
			return
		}
	}

	globalChaosMonkey.Enable()
	c.JSON(http.StatusOK, gin.H{
		"status":  "enabled",
		"message": "🐒 Chaos Monkey is now active. Use with caution!",
	})
}

func disableChaos(c *gin.Context) {
	if globalChaosMonkey == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "chaos monkey not initialized"})
		return
	}

	globalChaosMonkey.Disable()
	c.JSON(http.StatusOK, gin.H{
		"status":  "disabled",
		"message": "Chaos Monkey disabled. System returning to normal operation.",
	})
}

// ========================================
// EXPERIMENT HANDLERS
// ========================================

func listExperiments(c *gin.Context) {
	if globalChaosMonkey == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "chaos monkey not initialized"})
		return
	}

	globalChaosMonkey.mu.RLock()
	defer globalChaosMonkey.mu.RUnlock()

	experiments := make([]*Experiment, 0, len(globalChaosMonkey.experiments))
	for _, exp := range globalChaosMonkey.experiments {
		experiments = append(experiments, exp)
	}

	c.JSON(http.StatusOK, gin.H{
		"experiments": experiments,
		"total":       len(experiments),
	})
}

func createExperiment(c *gin.Context) {
	if globalChaosMonkey == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "chaos monkey not initialized"})
		return
	}

	var exp Experiment
	if err := c.ShouldBindJSON(&exp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	globalChaosMonkey.RegisterExperiment(&exp)
	c.JSON(http.StatusCreated, gin.H{
		"experiment": exp,
		"message":    "Experiment created. Use /start to begin.",
	})
}

func getExperiment(c *gin.Context) {
	if globalChaosMonkey == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "chaos monkey not initialized"})
		return
	}

	id := c.Param("id")
	
	globalChaosMonkey.mu.RLock()
	exp, exists := globalChaosMonkey.experiments[id]
	globalChaosMonkey.mu.RUnlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "experiment not found"})
		return
	}

	c.JSON(http.StatusOK, exp)
}

func startExperiment(c *gin.Context) {
	if globalChaosMonkey == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "chaos monkey not initialized"})
		return
	}

	id := c.Param("id")
	
	if err := globalChaosMonkey.StartExperiment(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "started",
		"message": "🐒 Experiment started. Monitor system behavior.",
	})
}

func stopExperiment(c *gin.Context) {
	if globalChaosMonkey == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "chaos monkey not initialized"})
		return
	}

	id := c.Param("id")
	
	if err := globalChaosMonkey.StopExperiment(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "stopped",
		"message": "Experiment stopped.",
	})
}

func deleteExperiment(c *gin.Context) {
	if globalChaosMonkey == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "chaos monkey not initialized"})
		return
	}

	id := c.Param("id")
	
	globalChaosMonkey.mu.Lock()
	delete(globalChaosMonkey.experiments, id)
	globalChaosMonkey.mu.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// ========================================
// QUICK INJECTION HANDLERS
// ========================================

type LatencyRequest struct {
	LatencyMs     int     `json:"latency_ms" binding:"required"`
	DurationMin   int     `json:"duration_min" binding:"required"`
	TargetPercent float64 `json:"target_percent" binding:"required"`
}

func injectLatency(c *gin.Context) {
	if globalChaosMonkey == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "chaos monkey not initialized"})
		return
	}

	var req LatencyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	exp := CreateLatencyExperiment(
		"Quick Latency Injection",
		req.LatencyMs,
		req.DurationMin,
		req.TargetPercent,
	)

	globalChaosMonkey.RegisterExperiment(exp)
	
	if err := globalChaosMonkey.StartExperiment(exp.ID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"experiment": exp,
		"message":    "🐒 Latency injection started",
	})
}

type ErrorRequest struct {
	ErrorRate   float64 `json:"error_rate" binding:"required"`
	ErrorCode   int     `json:"error_code" binding:"required"`
	DurationMin int     `json:"duration_min" binding:"required"`
}

func injectError(c *gin.Context) {
	if globalChaosMonkey == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "chaos monkey not initialized"})
		return
	}

	var req ErrorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	exp := CreateErrorExperiment(
		"Quick Error Injection",
		req.ErrorRate,
		req.ErrorCode,
		req.DurationMin,
	)

	globalChaosMonkey.RegisterExperiment(exp)
	
	if err := globalChaosMonkey.StartExperiment(exp.ID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"experiment": exp,
		"message":    "🐒 Error injection started",
	})
}

type BlackholeRequest struct {
	Endpoint      string  `json:"endpoint" binding:"required"`
	TargetPercent float64 `json:"target_percent" binding:"required"`
	DurationMin   int     `json:"duration_min" binding:"required"`
}

func injectBlackhole(c *gin.Context) {
	if globalChaosMonkey == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "chaos monkey not initialized"})
		return
	}

	var req BlackholeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	exp := CreateBlackholeExperiment(
		"Quick Blackhole",
		req.Endpoint,
		req.TargetPercent,
		req.DurationMin,
	)

	globalChaosMonkey.RegisterExperiment(exp)
	
	if err := globalChaosMonkey.StartExperiment(exp.ID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"experiment": exp,
		"message":    "🐒 Blackhole started - requests will be dropped",
	})
}

// ========================================
// GAME DAY HANDLERS
// ========================================

func listGameDays(c *gin.Context) {
	// Retornar game days pré-definidos
	gameDays := []*GameDay{
		StandardGameDay(),
	}

	c.JSON(http.StatusOK, gin.H{
		"game_days": gameDays,
		"total":     len(gameDays),
	})
}

func runStandardGameDay(c *gin.Context) {
	if globalChaosMonkey == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "chaos monkey not initialized"})
		return
	}

	if !globalChaosMonkey.IsEnabled() {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "chaos monkey is disabled",
			"message": "Enable chaos monkey first with POST /chaos/enable",
		})
		return
	}

	gameDay := StandardGameDay()
	
	// Registrar e iniciar experimentos sequencialmente
	for _, exp := range gameDay.Experiments {
		globalChaosMonkey.RegisterExperiment(exp)
	}

	// Iniciar primeiro experimento
	if len(gameDay.Experiments) > 0 {
		globalChaosMonkey.StartExperiment(gameDay.Experiments[0].ID)
	}

	c.JSON(http.StatusOK, gin.H{
		"game_day": gameDay,
		"message":  "🎮 Game Day started! Monitor system behavior closely.",
		"warning":  "This will cause intentional service disruption",
	})
}

// ========================================
// GIN MIDDLEWARE
// ========================================

// GinChaosMiddleware é o middleware Gin para chaos engineering
func GinChaosMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if globalChaosMonkey == nil || !globalChaosMonkey.IsEnabled() {
			c.Next()
			return
		}

		// Aplicar chaos
		latencyInjector := NewLatencyInjector(globalChaosMonkey, 100, 5000, 10)
		errorInjector := NewErrorInjector(globalChaosMonkey)

		// Verificar blackhole
		for _, exp := range globalChaosMonkey.GetActiveExperiments() {
			if exp.Type == ExperimentTypeBlackhole {
				if exp.Config.TargetEndpoint == "" || exp.Config.TargetEndpoint == c.Request.URL.Path {
					if randFloat() < exp.Config.TargetPercent/100 {
						exp.Results.AffectedRequests++
						c.AbortWithStatus(http.StatusServiceUnavailable)
						return
					}
				}
			}
		}

		// Injetar latência
		latencyInjector.MaybeInject(c.Request.Context())

		// Injetar erro
		if err := errorInjector.MaybeInjectError(); err != nil {
			if chaosErr, ok := err.(*ChaosError); ok {
				c.AbortWithStatusJSON(chaosErr.Code, gin.H{
					"error":  chaosErr.Message,
					"chaos":  true,
				})
				return
			}
		}

		c.Next()
	}
}

// Helper para gerar float aleatório
func randFloat() float64 {
	return float64(time.Now().UnixNano()%1000) / 1000.0
}
