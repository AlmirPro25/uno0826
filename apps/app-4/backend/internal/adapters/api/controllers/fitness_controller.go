package controllers

import (
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// FitnessController handles fitness-related HTTP requests
type FitnessController struct {
	fitnessService *services.FitnessService
}

// NewFitnessController creates a new fitness controller
func NewFitnessController(fitnessService *services.FitnessService) *FitnessController {
	return &FitnessController{
		fitnessService: fitnessService,
	}
}

// GetProfile returns the fitness profile for the authenticated user
func (c *FitnessController) GetProfile(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	profile, err := c.fitnessService.GetOrCreateProfile(ctx, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, profile)
}

// UpdateProfile updates the fitness profile
func (c *FitnessController) UpdateProfile(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	
	profile, err := c.fitnessService.GetOrCreateProfile(ctx, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := ctx.ShouldBindJSON(profile); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile.UserID = userID
	if err := c.fitnessService.UpdateProfile(ctx, profile); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, profile)
}

// GetSummary returns a complete fitness summary
func (c *FitnessController) GetSummary(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	summary, err := c.fitnessService.GetFitnessSummary(ctx, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, summary)
}

// SyncFromNOVA syncs data from NOVA app
func (c *FitnessController) SyncFromNOVA(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	var syncData services.NOVASyncData
	if err := ctx.ShouldBindJSON(&syncData); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.fitnessService.SyncFromNOVA(ctx, userID, &syncData); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Dados sincronizados com sucesso"})
}

// GetDailyStats returns daily fitness stats
func (c *FitnessController) GetDailyStats(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	days, _ := strconv.Atoi(ctx.DefaultQuery("days", "7"))

	stats, err := c.fitnessService.GetDailyStats(ctx, userID, days)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, stats)
}

// CreateDailyStats creates or updates daily stats
func (c *FitnessController) CreateDailyStats(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	var stats domain.DailyFitnessStats
	if err := ctx.ShouldBindJSON(&stats); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if stats.Date.IsZero() {
		stats.Date = time.Now()
	}

	if err := c.fitnessService.UpsertDailyStats(ctx, userID, &stats); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, stats)
}

// GetWorkoutSessions returns workout sessions
func (c *FitnessController) GetWorkoutSessions(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	days, _ := strconv.Atoi(ctx.DefaultQuery("days", "30"))

	sessions, err := c.fitnessService.GetWorkoutSessions(ctx, userID, days)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, sessions)
}

// CreateWorkoutSession creates a new workout session
func (c *FitnessController) CreateWorkoutSession(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	var session domain.WorkoutSession
	if err := ctx.ShouldBindJSON(&session); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session.UserID = userID
	if session.Date.IsZero() {
		session.Date = time.Now()
	}

	if err := c.fitnessService.CreateWorkoutSession(ctx, &session); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, session)
}

// GetNutritionLogs returns nutrition logs
func (c *FitnessController) GetNutritionLogs(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	days, _ := strconv.Atoi(ctx.DefaultQuery("days", "7"))

	logs, err := c.fitnessService.GetNutritionLogs(ctx, userID, days)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, logs)
}

// CreateNutritionLog creates a nutrition log entry
func (c *FitnessController) CreateNutritionLog(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	var log domain.NutritionLog
	if err := ctx.ShouldBindJSON(&log); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.UserID = userID
	if log.Date.IsZero() {
		log.Date = time.Now()
	}

	if err := c.fitnessService.CreateNutritionLog(ctx, &log); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, log)
}

// GetBodyAnalyses returns body analyses
func (c *FitnessController) GetBodyAnalyses(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	analyses, err := c.fitnessService.GetBodyAnalyses(ctx, userID, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, analyses)
}

// CreateBodyAnalysis creates a body analysis entry
func (c *FitnessController) CreateBodyAnalysis(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	var analysis domain.BodyAnalysis
	if err := ctx.ShouldBindJSON(&analysis); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	analysis.UserID = userID

	if err := c.fitnessService.CreateBodyAnalysis(ctx, &analysis); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, analysis)
}

// GetActivePlan returns the active weekly plan
func (c *FitnessController) GetActivePlan(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	plan, err := c.fitnessService.GetActivePlan(ctx, userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Nenhum plano ativo encontrado"})
		return
	}
	ctx.JSON(http.StatusOK, plan)
}

// SaveWeeklyPlan saves a weekly fitness plan
func (c *FitnessController) SaveWeeklyPlan(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	var plan domain.WeeklyFitnessPlan
	if err := ctx.ShouldBindJSON(&plan); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	plan.UserID = userID

	if err := c.fitnessService.SaveWeeklyPlan(ctx, &plan); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, plan)
}

// RecordHeartRate records a heart rate reading
func (c *FitnessController) RecordHeartRate(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	var reading domain.HeartRateReading
	if err := ctx.ShouldBindJSON(&reading); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reading.UserID = userID

	if err := c.fitnessService.RecordHeartRate(ctx, &reading); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, reading)
}

// GetHeartRateHistory returns heart rate history
func (c *FitnessController) GetHeartRateHistory(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	hours, _ := strconv.Atoi(ctx.DefaultQuery("hours", "24"))

	readings, err := c.fitnessService.GetHeartRateHistory(ctx, userID, hours)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, readings)
}

// GetAchievements returns fitness achievements
func (c *FitnessController) GetAchievements(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	achievements, err := c.fitnessService.GetAchievements(ctx, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, achievements)
}
