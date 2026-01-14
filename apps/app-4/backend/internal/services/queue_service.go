package services

import (
	"context"
	"encoding/json"
	"errors"
	"medisync-platform/backend/internal/adapters/repository"
	"medisync-platform/backend/internal/core/domain"
)

type QueueService struct {
	repo            *repository.QueueRepository
	notificationSvc *NotificationService
	hub             *Hub
}

func NewQueueService(repo *repository.QueueRepository, notificationSvc *NotificationService, hub *Hub) *QueueService {
	return &QueueService{
		repo:            repo,
		notificationSvc: notificationSvc,
		hub:             hub,
	}
}

// CreateTicket creates a new queue ticket
func (s *QueueService) CreateTicket(patientID *uint, patientName string, triageReportID *uint, priority string, serviceType string) (*domain.QueueTicket, error) {
	// Generate ticket number
	ticketNumber, err := s.repo.GenerateTicketNumber(priority)
	if err != nil {
		return nil, err
	}

	// Get priority order
	priorityOrder, ok := domain.PriorityOrderMap[priority]
	if !ok {
		priorityOrder = 5 // Default to non-urgent
	}

	ticket := &domain.QueueTicket{
		TicketNumber:   ticketNumber,
		PatientID:      patientID,
		PatientName:    patientName,
		TriageReportID: triageReportID,
		Priority:       priority,
		PriorityOrder:  priorityOrder,
		ServiceType:    serviceType,
		Status:         domain.QueueStatusWaiting,
	}

	if err := s.repo.Create(ticket); err != nil {
		return nil, err
	}

	// Broadcast queue update
	s.broadcastQueueUpdate()

	return s.repo.GetByID(ticket.ID)
}

// CreateFromTriage creates a ticket from a triage report
func (s *QueueService) CreateFromTriage(triageReport *domain.TriageReport) (*domain.QueueTicket, error) {
	patientID := uint(triageReport.PatientID)
	triageID := uint(triageReport.ID)
	return s.CreateTicket(
		&patientID,
		"",
		&triageID,
		triageReport.Priority,
		triageReport.RecommendedSpecialty,
	)
}

// GetTicket retrieves a ticket by ID
func (s *QueueService) GetTicket(id uint) (*domain.QueueTicket, error) {
	return s.repo.GetByID(id)
}

// GetTicketByNumber retrieves a ticket by its number
func (s *QueueService) GetTicketByNumber(ticketNumber string) (*domain.QueueTicket, error) {
	return s.repo.GetByTicketNumber(ticketNumber)
}

// GetWaitingQueue retrieves the waiting queue
func (s *QueueService) GetWaitingQueue(serviceType string) ([]domain.QueueTicket, error) {
	return s.repo.GetWaitingQueue(serviceType)
}

// GetCurrentlyServing retrieves tickets currently being served
func (s *QueueService) GetCurrentlyServing() ([]domain.QueueTicket, error) {
	return s.repo.GetCurrentlyServing()
}

// GetTodayTickets retrieves all tickets for today
func (s *QueueService) GetTodayTickets() ([]domain.QueueTicket, error) {
	return s.repo.GetTodayTickets()
}

// CallNext calls the next patient in queue
func (s *QueueService) CallNext(serviceType string, counter string, calledBy uint) (*domain.QueueTicket, error) {
	ticket, err := s.repo.CallNext(serviceType, counter, calledBy)
	if err != nil {
		return nil, err
	}

	// Notify patient if they have an account
	if ticket.PatientID != nil {
		notification := &domain.Notification{
			UserID:  int(*ticket.PatientID),
			Type:    "queue_call",
			Title:   "Sua vez chegou!",
			Message: "Senha " + ticket.TicketNumber + " - Dirija-se ao " + ticket.Counter,
		}
		s.notificationSvc.CreateNotification(context.Background(), notification)
	}

	// Broadcast queue update
	s.broadcastQueueUpdate()

	return ticket, nil
}

// CallSpecificTicket calls a specific ticket
func (s *QueueService) CallSpecificTicket(ticketID uint, counter string, calledBy uint) (*domain.QueueTicket, error) {
	ticket, err := s.repo.GetByID(ticketID)
	if err != nil {
		return nil, err
	}

	if ticket.Status != domain.QueueStatusWaiting {
		return nil, errors.New("ticket is not in waiting status")
	}

	ticket.Status = domain.QueueStatusCalled
	ticket.Counter = counter
	ticket.CalledBy = &calledBy

	if err := s.repo.Update(ticket); err != nil {
		return nil, err
	}

	// Notify patient
	if ticket.PatientID != nil {
		notification := &domain.Notification{
			UserID:  int(*ticket.PatientID),
			Type:    "queue_call",
			Title:   "Sua vez chegou!",
			Message: "Senha " + ticket.TicketNumber + " - Dirija-se ao " + ticket.Counter,
		}
		s.notificationSvc.CreateNotification(context.Background(), notification)
	}

	s.broadcastQueueUpdate()

	return s.repo.GetByID(ticketID)
}

// StartService marks a ticket as in service
func (s *QueueService) StartService(ticketID uint) error {
	err := s.repo.StartService(ticketID)
	if err != nil {
		return err
	}
	s.broadcastQueueUpdate()
	return nil
}

// CompleteService marks a ticket as completed
func (s *QueueService) CompleteService(ticketID uint) error {
	err := s.repo.CompleteService(ticketID)
	if err != nil {
		return err
	}
	s.broadcastQueueUpdate()
	return nil
}

// MarkNoShow marks a ticket as no-show
func (s *QueueService) MarkNoShow(ticketID uint) error {
	err := s.repo.MarkNoShow(ticketID)
	if err != nil {
		return err
	}
	s.broadcastQueueUpdate()
	return nil
}

// GetStats retrieves queue statistics
func (s *QueueService) GetStats() (*domain.QueueStats, error) {
	return s.repo.GetStats()
}

// GetDisplayData retrieves data for the public display
func (s *QueueService) GetDisplayData() (*domain.QueueDisplay, error) {
	return s.repo.GetDisplayData()
}

// broadcastQueueUpdate sends queue update to all connected clients
func (s *QueueService) broadcastQueueUpdate() {
	if s.hub == nil {
		return
	}

	display, err := s.repo.GetDisplayData()
	if err != nil {
		return
	}

	// Broadcast to waiting room hub
	s.hub.Broadcast <- []byte(`{"type":"queue_update","data":` + toJSON(display) + `}`)
}

// Helper to convert to JSON
func toJSON(v interface{}) string {
	data, err := json.Marshal(v)
	if err != nil {
		return "{}"
	}
	return string(data)
}
