package kernel_billing

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ========================================
// PILOT HANDLER - Fase 28.2-D
// "Rollout gradual: 1 app → 10% → 50% → 100%"
// ========================================

// PilotHandler handlers para gestão de pilotos e feature flags
type PilotHandler struct {
	featureFlagService *FeatureFlagService
	pilotService       *PilotService
}

// NewPilotHandler cria novo handler
func NewPilotHandler(featureFlagService *FeatureFlagService, pilotService *PilotService) *PilotHandler {
	return &PilotHandler{
		featureFlagService: featureFlagService,
		pilotService:       pilotService,
	}
}

// ========================================
// FEATURE FLAGS ENDPOINTS
// ========================================

// GetAllFlags retorna todas as feature flags
// GET /admin/kernel/billing/flags
func (h *PilotHandler) GetAllFlags(c *gin.Context) {
	flags, err := h.featureFlagService.GetAllFlags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"flags": flags,
		"count": len(flags),
	})
}

// GetFlag retorna uma flag específica
// GET /admin/kernel/billing/flags/:name
func (h *PilotHandler) GetFlag(c *gin.Context) {
	name := c.Param("name")

	flag, err := h.featureFlagService.GetFlag(name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Flag não encontrada"})
		return
	}

	c.JSON(http.StatusOK, flag)
}

// UpdateFlagRequest request para atualizar flag
type UpdateFlagRequest struct {
	Enabled    bool `json:"enabled"`
	Percentage int  `json:"percentage"`
}

// UpdateFlag atualiza uma flag
// PUT /admin/kernel/billing/flags/:name
func (h *PilotHandler) UpdateFlag(c *gin.Context) {
	name := c.Param("name")

	var req UpdateFlagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validar percentage
	if req.Percentage < 0 || req.Percentage > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Percentage deve ser entre 0 e 100"})
		return
	}

	if err := h.featureFlagService.UpdateFlag(name, req.Enabled, req.Percentage); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "updated"})
}

// CheckFlagRequest request para verificar flag
type CheckFlagRequest struct {
	AppID string `json:"app_id" binding:"required"`
}

// CheckFlag verifica se flag está habilitada para um app
// POST /admin/kernel/billing/flags/:name/check
func (h *PilotHandler) CheckFlag(c *gin.Context) {
	name := c.Param("name")

	var req CheckFlagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	enabled := h.featureFlagService.IsEnabled(name, req.AppID)

	c.JSON(http.StatusOK, gin.H{
		"flag":    name,
		"app_id":  req.AppID,
		"enabled": enabled,
	})
}

// WhitelistRequest request para whitelist
type WhitelistRequest struct {
	AppID string `json:"app_id" binding:"required"`
}

// AddToWhitelist adiciona app à whitelist
// POST /admin/kernel/billing/flags/:name/whitelist
func (h *PilotHandler) AddToWhitelist(c *gin.Context) {
	name := c.Param("name")

	var req WhitelistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.featureFlagService.AddAppToWhitelist(name, req.AppID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "added"})
}

// RemoveFromWhitelist remove app da whitelist
// DELETE /admin/kernel/billing/flags/:name/whitelist/:app_id
func (h *PilotHandler) RemoveFromWhitelist(c *gin.Context) {
	name := c.Param("name")
	appID := c.Param("app_id")

	if err := h.featureFlagService.RemoveAppFromWhitelist(name, appID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "removed"})
}

// ========================================
// PILOT MANAGEMENT ENDPOINTS
// ========================================

// GetPilots retorna todos os pilotos
// GET /admin/kernel/billing/pilots
func (h *PilotHandler) GetPilots(c *gin.Context) {
	status := c.Query("status")

	var pilots []PilotApp
	var err error

	if status == "active" {
		pilots, err = h.pilotService.GetActivePilots()
	} else {
		pilots, err = h.pilotService.GetPilotApps()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pilots": pilots,
		"count":  len(pilots),
	})
}

// RegisterPilotRequest request para registrar piloto
type RegisterPilotRequest struct {
	AppID   string `json:"app_id" binding:"required"`
	AppName string `json:"app_name" binding:"required"`
	Notes   string `json:"notes"`
}

// RegisterPilot registra um novo app piloto
// POST /admin/kernel/billing/pilots
func (h *PilotHandler) RegisterPilot(c *gin.Context) {
	var req RegisterPilotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pilot, err := h.pilotService.RegisterPilotApp(req.AppID, req.AppName, req.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, pilot)
}

// ActivatePilot ativa um piloto
// POST /admin/kernel/billing/pilots/:app_id/activate
func (h *PilotHandler) ActivatePilot(c *gin.Context) {
	appID := c.Param("app_id")

	if err := h.pilotService.ActivatePilot(appID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "activated",
		"app_id":  appID,
		"message": "App piloto ativado. Live billing habilitado para este app.",
	})
}

// PausePilot pausa um piloto
// POST /admin/kernel/billing/pilots/:app_id/pause
func (h *PilotHandler) PausePilot(c *gin.Context) {
	appID := c.Param("app_id")

	if err := h.pilotService.PausePilot(appID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "paused",
		"app_id":  appID,
		"message": "App piloto pausado. Live billing desabilitado.",
	})
}

// CompletePilot marca piloto como concluído
// POST /admin/kernel/billing/pilots/:app_id/complete
func (h *PilotHandler) CompletePilot(c *gin.Context) {
	appID := c.Param("app_id")

	if err := h.pilotService.CompletePilot(appID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "completed",
		"app_id":  appID,
		"message": "Piloto concluído com sucesso.",
	})
}

// GetPilotMetrics retorna métricas de um piloto
// GET /admin/kernel/billing/pilots/:app_id/metrics
func (h *PilotHandler) GetPilotMetrics(c *gin.Context) {
	appID := c.Param("app_id")

	// Atualizar métricas
	if err := h.pilotService.UpdatePilotMetrics(appID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Buscar piloto atualizado
	var pilot PilotApp
	if err := h.pilotService.db.Where("app_id = ?", appID).First(&pilot).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Piloto não encontrado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pilot":   pilot,
		"metrics": pilot.GetMetrics(),
	})
}

// ========================================
// ROLLOUT STATUS ENDPOINT
// ========================================

// GetRolloutStatus retorna status geral do rollout
// GET /admin/kernel/billing/rollout/status
func (h *PilotHandler) GetRolloutStatus(c *gin.Context) {
	flags, _ := h.featureFlagService.GetAllFlags()
	pilots, _ := h.pilotService.GetPilotApps()
	activePilots, _ := h.pilotService.GetActivePilots()

	// Calcular status
	liveBillingEnabled := false
	liveBillingPercentage := 0
	for _, f := range flags {
		if f.Name == "live_billing" {
			liveBillingEnabled = f.Enabled
			liveBillingPercentage = f.Percentage
			break
		}
	}

	phase := "test_mode"
	if liveBillingEnabled {
		if len(activePilots) == 1 {
			phase = "single_pilot"
		} else if liveBillingPercentage <= 10 {
			phase = "early_rollout"
		} else if liveBillingPercentage <= 50 {
			phase = "mid_rollout"
		} else if liveBillingPercentage < 100 {
			phase = "late_rollout"
		} else {
			phase = "full_rollout"
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"phase":                  phase,
		"live_billing_enabled":   liveBillingEnabled,
		"live_billing_percentage": liveBillingPercentage,
		"total_pilots":           len(pilots),
		"active_pilots":          len(activePilots),
		"flags":                  flags,
		"recommendation":         getRolloutRecommendation(phase, len(activePilots)),
	})
}

// getRolloutRecommendation retorna recomendação baseada na fase
func getRolloutRecommendation(phase string, activePilots int) string {
	switch phase {
	case "test_mode":
		return "Registre um app piloto e ative-o para iniciar testes em produção"
	case "single_pilot":
		return "Monitore métricas do piloto por 7 dias antes de expandir"
	case "early_rollout":
		return "Se métricas estáveis, considere aumentar para 25%"
	case "mid_rollout":
		return "Monitore alertas e divergências antes de ir para 75%"
	case "late_rollout":
		return "Quase lá! Verifique reconciliação antes de 100%"
	case "full_rollout":
		return "Rollout completo. Mantenha monitoramento ativo."
	default:
		return "Verifique configuração do sistema"
	}
}
