package controllers

import (
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ClinicalMatchController handles clinical match endpoints
type ClinicalMatchController struct {
	service *services.ClinicalMatchService
}

// NewClinicalMatchController creates a new clinical match controller
func NewClinicalMatchController(service *services.ClinicalMatchService) *ClinicalMatchController {
	return &ClinicalMatchController{service: service}
}

// StartMatch initiates the intelligent matching process
// POST /match/start
func (c *ClinicalMatchController) StartMatch(ctx *gin.Context) {
	userID := ctx.GetInt("userID")
	if userID == 0 {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req domain.MatchRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Step 1: AI Classification
	classification, err := c.service.ClassifyPatientInput(ctx, &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to classify symptoms"})
		return
	}

	// Step 2: Find best matches
	matches, err := c.service.FindBestMatch(ctx, uint(userID), &req, classification)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find matches"})
		return
	}

	// Step 3: Create match record with best match
	var bestMatch *domain.MatchResult
	if len(matches) > 0 {
		bestMatch = &matches[0]
	}

	match, err := c.service.CreateMatch(ctx, uint(userID), &req, classification, bestMatch)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create match"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"match_id":       match.ID,
		"classification": classification,
		"matches":        matches,
		"best_match":     bestMatch,
		"status":         match.Status,
	})
}

// ClassifyOnly just classifies without creating a match
// POST /match/classify
func (c *ClinicalMatchController) ClassifyOnly(ctx *gin.Context) {
	var req domain.MatchRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	classification, err := c.service.ClassifyPatientInput(ctx, &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to classify"})
		return
	}

	ctx.JSON(http.StatusOK, classification)
}

// FindMatches finds doctors without creating a match record
// POST /match/find
func (c *ClinicalMatchController) FindMatches(ctx *gin.Context) {
	userID := ctx.GetInt("userID")

	var req struct {
		domain.MatchRequest
		Classification *domain.AIClassification `json:"classification"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	classification := req.Classification
	if classification == nil {
		var err error
		classification, err = c.service.ClassifyPatientInput(ctx, &req.MatchRequest)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to classify"})
			return
		}
	}

	matches, err := c.service.FindBestMatch(ctx, uint(userID), &req.MatchRequest, classification)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find matches"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"classification": classification,
		"matches":        matches,
		"total":          len(matches),
	})
}

// AcceptMatch handles match acceptance
// POST /match/:id/accept
func (c *ClinicalMatchController) AcceptMatch(ctx *gin.Context) {
	userID := ctx.GetInt("userID")
	userRole := ctx.GetString("userRole")

	matchID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid match ID"})
		return
	}

	if err := c.service.AcceptMatch(ctx, uint(matchID), uint(userID), userRole); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	match, _ := c.service.GetMatchByID(ctx, uint(matchID))
	ctx.JSON(http.StatusOK, match)
}

// GetMatch retrieves a specific match
// GET /match/:id
func (c *ClinicalMatchController) GetMatch(ctx *gin.Context) {
	matchID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid match ID"})
		return
	}

	match, err := c.service.GetMatchByID(ctx, uint(matchID))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "match not found"})
		return
	}

	ctx.JSON(http.StatusOK, match)
}

// GetMyMatches gets matches for current user
// GET /match/my
func (c *ClinicalMatchController) GetMyMatches(ctx *gin.Context) {
	userID := ctx.GetInt("userID")
	userRole := ctx.GetString("userRole")

	var matches []domain.ClinicalMatch
	var err error

	if userRole == domain.RoleMedico {
		matches, err = c.service.GetPendingMatchesForDoctor(ctx, uint(userID))
	} else {
		matches, err = c.service.GetMatchesForPatient(ctx, uint(userID))
	}

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, matches)
}

// GetPendingForDoctor gets pending matches for doctor
// GET /match/pending
func (c *ClinicalMatchController) GetPendingForDoctor(ctx *gin.Context) {
	userID := ctx.GetInt("userID")
	userRole := ctx.GetString("userRole")

	if userRole != domain.RoleMedico {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "only doctors can access this"})
		return
	}

	matches, err := c.service.GetPendingMatchesForDoctor(ctx, uint(userID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, matches)
}
