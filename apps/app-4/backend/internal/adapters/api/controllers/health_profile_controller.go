package controllers

import (
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthProfileController handles health profile endpoints
type HealthProfileController struct {
	service *services.HealthIntelligenceService
}

// NewHealthProfileController creates a new health profile controller
func NewHealthProfileController(service *services.HealthIntelligenceService) *HealthProfileController {
	return &HealthProfileController{service: service}
}

// GetMyProfile gets the current user's health profile
func (c *HealthProfileController) GetMyProfile(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	profile, err := c.service.GetOrCreateProfile(ctx, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, profile)
}

// UpdateMyProfile updates the current user's health profile
func (c *HealthProfileController) UpdateMyProfile(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	
	profile, err := c.service.GetOrCreateProfile(ctx, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := ctx.ShouldBindJSON(profile); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile.UserID = userID // Ensure user can only update their own profile

	if err := c.service.UpdateProfile(ctx, profile); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, profile)
}


// GetHealthSummary gets a complete health summary
func (c *HealthProfileController) GetHealthSummary(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	summary, err := c.service.GetHealthSummary(ctx, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, summary)
}

// CreateDailyCheckIn creates or updates today's check-in
func (c *HealthProfileController) CreateDailyCheckIn(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	
	var checkIn domain.DailyCheckIn
	if err := ctx.ShouldBindJSON(&checkIn); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	checkIn.UserID = userID
	checkIn.Source = "manual"

	if err := c.service.CreateDailyCheckIn(ctx, &checkIn); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Recalculate scores
	c.service.CalculateHealthScores(ctx, userID)

	ctx.JSON(http.StatusCreated, checkIn)
}

// GetTodayCheckIn gets today's check-in
func (c *HealthProfileController) GetTodayCheckIn(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	checkIn, err := c.service.GetDailyCheckIn(ctx, userID, time.Now())
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "No check-in for today"})
		return
	}
	ctx.JSON(http.StatusOK, checkIn)
}

// GetCheckInHistory gets check-in history
func (c *HealthProfileController) GetCheckInHistory(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	days, _ := strconv.Atoi(ctx.DefaultQuery("days", "30"))
	
	checkIns, err := c.service.GetCheckInHistory(ctx, userID, days)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, checkIns)
}

// RecordMetric records a health metric
func (c *HealthProfileController) RecordMetric(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	
	var metric domain.HealthMetric
	if err := ctx.ShouldBindJSON(&metric); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	metric.UserID = userID

	if err := c.service.RecordMetric(ctx, &metric); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, metric)
}

// GetMetrics gets metrics history
func (c *HealthProfileController) GetMetrics(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	metricType := ctx.Query("type")
	days, _ := strconv.Atoi(ctx.DefaultQuery("days", "30"))
	
	metrics, err := c.service.GetMetrics(ctx, userID, metricType, days)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, metrics)
}

// GetMedications gets active medications
func (c *HealthProfileController) GetMedications(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	medications, err := c.service.GetMedications(ctx, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, medications)
}

// CreateMedication creates a new medication
func (c *HealthProfileController) CreateMedication(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	
	var medication domain.Medication
	if err := ctx.ShouldBindJSON(&medication); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	medication.UserID = userID

	if err := c.service.CreateMedication(ctx, &medication); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, medication)
}

// LogMedication logs when a medication was taken
func (c *HealthProfileController) LogMedication(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	
	var log domain.MedicationLog
	if err := ctx.ShouldBindJSON(&log); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.UserID = userID
	log.TakenAt = time.Now()

	if err := c.service.LogMedication(ctx, &log); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, log)
}

// GetVaccines gets vaccines
func (c *HealthProfileController) GetVaccines(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	vaccines, err := c.service.GetVaccines(ctx, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, vaccines)
}

// CreateVaccine creates a new vaccine record
func (c *HealthProfileController) CreateVaccine(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	
	var vaccine domain.Vaccine
	if err := ctx.ShouldBindJSON(&vaccine); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	vaccine.UserID = userID

	if err := c.service.CreateVaccine(ctx, &vaccine); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, vaccine)
}

// GetExams gets exams
func (c *HealthProfileController) GetExams(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	exams, err := c.service.GetExams(ctx, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, exams)
}

// CreateExam creates a new exam record
func (c *HealthProfileController) CreateExam(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	
	var exam domain.Exam
	if err := ctx.ShouldBindJSON(&exam); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	exam.UserID = userID

	if err := c.service.CreateExam(ctx, &exam); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, exam)
}

// GetHealthGoals gets health goals
func (c *HealthProfileController) GetHealthGoals(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	goals, err := c.service.GetHealthGoals(ctx, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, goals)
}

// CreateHealthGoal creates a new health goal
func (c *HealthProfileController) CreateHealthGoal(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	
	var goal domain.HealthGoal
	if err := ctx.ShouldBindJSON(&goal); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	goal.UserID = userID
	goal.Status = "active"

	if err := c.service.CreateHealthGoal(ctx, &goal); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, goal)
}

// UpdateHealthGoal updates a health goal
func (c *HealthProfileController) UpdateHealthGoal(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	goalID, _ := strconv.ParseUint(ctx.Param("id"), 10, 32)
	
	var goal domain.HealthGoal
	if err := ctx.ShouldBindJSON(&goal); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	goal.ID = uint(goalID)
	goal.UserID = userID

	if err := c.service.UpdateHealthGoal(ctx, &goal); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, goal)
}

// GetAchievements gets achievements
func (c *HealthProfileController) GetAchievements(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	achievements, err := c.service.GetAchievements(ctx, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, achievements)
}

// ProcessAIChatCheckIn processes a chat message for check-in data
func (c *HealthProfileController) ProcessAIChatCheckIn(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	
	var req struct {
		Message string `json:"message" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	checkIn, err := c.service.ProcessAIChatCheckIn(ctx, userID, req.Message)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, checkIn)
}

// UpdateProfileFromTriage updates profile from triage data
func (c *HealthProfileController) UpdateProfileFromTriage(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	triageID, _ := strconv.ParseUint(ctx.Param("triageId"), 10, 32)

	if err := c.service.UpdateProfileFromTriage(ctx, userID, uint(triageID)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Profile updated from triage"})
}
