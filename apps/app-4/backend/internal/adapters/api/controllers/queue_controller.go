package controllers

import (
	"medisync-platform/backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type QueueController struct {
	svc *services.QueueService
}

func NewQueueController(svc *services.QueueService) *QueueController {
	return &QueueController{svc: svc}
}

// CreateTicket creates a new queue ticket
// POST /queue/tickets
func (ctrl *QueueController) CreateTicket(c *gin.Context) {
	var input struct {
		PatientID      *uint  `json:"patient_id"`
		PatientName    string `json:"patient_name"`
		TriageReportID *uint  `json:"triage_report_id"`
		Priority       string `json:"priority" binding:"required"`
		ServiceType    string `json:"service_type"`
		Specialty      string `json:"specialty"` // Alternative to service_type
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Use specialty as service_type if provided
	serviceType := input.ServiceType
	if serviceType == "" && input.Specialty != "" {
		serviceType = input.Specialty
	}
	if serviceType == "" {
		serviceType = "Geral"
	}

	ticket, err := ctrl.svc.CreateTicket(
		input.PatientID,
		input.PatientName,
		input.TriageReportID,
		input.Priority,
		serviceType,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, ticket)
}

// GetTicket retrieves a ticket by ID
// GET /queue/tickets/:id
func (ctrl *QueueController) GetTicket(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	ticket, err := ctrl.svc.GetTicket(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}

	c.JSON(http.StatusOK, ticket)
}

// GetTicketByNumber retrieves a ticket by its number
// GET /queue/tickets/number/:number
func (ctrl *QueueController) GetTicketByNumber(c *gin.Context) {
	ticketNumber := c.Param("number")

	ticket, err := ctrl.svc.GetTicketByNumber(ticketNumber)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}

	c.JSON(http.StatusOK, ticket)
}

// GetWaitingQueue retrieves the waiting queue
// GET /queue/waiting
func (ctrl *QueueController) GetWaitingQueue(c *gin.Context) {
	serviceType := c.Query("service_type")

	tickets, err := ctrl.svc.GetWaitingQueue(serviceType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tickets)
}

// GetCurrentlyServing retrieves tickets currently being served
// GET /queue/serving
func (ctrl *QueueController) GetCurrentlyServing(c *gin.Context) {
	tickets, err := ctrl.svc.GetCurrentlyServing()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tickets)
}

// GetTodayTickets retrieves all tickets for today
// GET /queue/today
func (ctrl *QueueController) GetTodayTickets(c *gin.Context) {
	tickets, err := ctrl.svc.GetTodayTickets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tickets)
}

// CallNext calls the next patient in queue
// POST /queue/call-next
func (ctrl *QueueController) CallNext(c *gin.Context) {
	var input struct {
		ServiceType string `json:"service_type"`
		Counter     string `json:"counter" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")

	ticket, err := ctrl.svc.CallNext(input.ServiceType, input.Counter, userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No tickets in queue"})
		return
	}

	c.JSON(http.StatusOK, ticket)
}

// CallSpecificTicket calls a specific ticket
// POST /queue/tickets/:id/call
func (ctrl *QueueController) CallSpecificTicket(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	var input struct {
		Counter string `json:"counter" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")

	ticket, err := ctrl.svc.CallSpecificTicket(uint(id), input.Counter, userID.(uint))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ticket)
}

// StartService marks a ticket as in service
// PUT /queue/tickets/:id/start
func (ctrl *QueueController) StartService(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	if err := ctrl.svc.StartService(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service started"})
}

// CompleteService marks a ticket as completed
// PUT /queue/tickets/:id/complete
func (ctrl *QueueController) CompleteService(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	if err := ctrl.svc.CompleteService(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service completed"})
}

// MarkNoShow marks a ticket as no-show
// PUT /queue/tickets/:id/no-show
func (ctrl *QueueController) MarkNoShow(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	if err := ctrl.svc.MarkNoShow(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Marked as no-show"})
}

// GetStats retrieves queue statistics
// GET /queue/stats
func (ctrl *QueueController) GetStats(c *gin.Context) {
	stats, err := ctrl.svc.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetDisplayData retrieves data for the public display
// GET /queue/display
func (ctrl *QueueController) GetDisplayData(c *gin.Context) {
	display, err := ctrl.svc.GetDisplayData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, display)
}
