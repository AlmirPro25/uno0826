package repository

import (
	"fmt"
	"medisync-platform/backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

type QueueRepository struct {
	db *gorm.DB
}

func NewQueueRepository(db *gorm.DB) *QueueRepository {
	return &QueueRepository{db: db}
}

// GenerateTicketNumber generates a unique ticket number for today
func (r *QueueRepository) GenerateTicketNumber(priority string) (string, error) {
	today := time.Now().Format("20060102")
	
	// Get prefix based on priority
	prefix := "N" // Normal
	switch priority {
	case "Emergência":
		prefix = "E"
	case "Muito Urgente":
		prefix = "U"
	case "Urgente":
		prefix = "R"
	case "Pouco Urgente":
		prefix = "P"
	}

	// Count today's tickets with same prefix
	var count int64
	r.db.Model(&domain.QueueTicket{}).
		Where("ticket_number LIKE ?", prefix+today+"%").
		Count(&count)

	return fmt.Sprintf("%s%s%03d", prefix, today, count+1), nil
}

// Create creates a new queue ticket
func (r *QueueRepository) Create(ticket *domain.QueueTicket) error {
	return r.db.Create(ticket).Error
}

// GetByID retrieves a ticket by ID
func (r *QueueRepository) GetByID(id uint) (*domain.QueueTicket, error) {
	var ticket domain.QueueTicket
	err := r.db.Preload("Patient").Preload("TriageReport").Preload("CalledByUser").
		First(&ticket, id).Error
	if err != nil {
		return nil, err
	}
	return &ticket, nil
}

// GetByTicketNumber retrieves a ticket by its number
func (r *QueueRepository) GetByTicketNumber(ticketNumber string) (*domain.QueueTicket, error) {
	var ticket domain.QueueTicket
	err := r.db.Preload("Patient").Preload("TriageReport").
		Where("ticket_number = ?", ticketNumber).First(&ticket).Error
	if err != nil {
		return nil, err
	}
	return &ticket, nil
}

// GetWaitingQueue retrieves all waiting tickets ordered by priority and time
func (r *QueueRepository) GetWaitingQueue(serviceType string) ([]domain.QueueTicket, error) {
	var tickets []domain.QueueTicket
	query := r.db.Preload("Patient").Preload("TriageReport").
		Where("status = ?", domain.QueueStatusWaiting).
		Order("priority_order ASC, created_at ASC")
	
	if serviceType != "" {
		query = query.Where("service_type = ?", serviceType)
	}

	err := query.Find(&tickets).Error
	return tickets, err
}

// GetCurrentlyServing retrieves tickets currently being served
func (r *QueueRepository) GetCurrentlyServing() ([]domain.QueueTicket, error) {
	var tickets []domain.QueueTicket
	err := r.db.Preload("Patient").Preload("CalledByUser").
		Where("status IN ?", []string{domain.QueueStatusCalled, domain.QueueStatusInService}).
		Order("called_at DESC").
		Find(&tickets).Error
	return tickets, err
}

// GetTodayTickets retrieves all tickets created today
func (r *QueueRepository) GetTodayTickets() ([]domain.QueueTicket, error) {
	var tickets []domain.QueueTicket
	today := time.Now().Truncate(24 * time.Hour)
	err := r.db.Preload("Patient").
		Where("created_at >= ?", today).
		Order("created_at DESC").
		Find(&tickets).Error
	return tickets, err
}

// Update updates a ticket
func (r *QueueRepository) Update(ticket *domain.QueueTicket) error {
	return r.db.Save(ticket).Error
}

// CallNext calls the next ticket in queue for a specific service
func (r *QueueRepository) CallNext(serviceType string, counter string, calledBy uint) (*domain.QueueTicket, error) {
	var ticket domain.QueueTicket
	
	query := r.db.Where("status = ?", domain.QueueStatusWaiting).
		Order("priority_order ASC, created_at ASC")
	
	if serviceType != "" {
		query = query.Where("service_type = ?", serviceType)
	}

	err := query.First(&ticket).Error
	if err != nil {
		return nil, err
	}

	now := time.Now()
	ticket.Status = domain.QueueStatusCalled
	ticket.CalledAt = &now
	ticket.Counter = counter
	ticket.CalledBy = &calledBy
	ticket.ActualWait = int(now.Sub(ticket.CreatedAt).Minutes())

	if err := r.db.Save(&ticket).Error; err != nil {
		return nil, err
	}

	return r.GetByID(ticket.ID)
}

// StartService marks a ticket as in service
func (r *QueueRepository) StartService(id uint) error {
	now := time.Now()
	return r.db.Model(&domain.QueueTicket{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":     domain.QueueStatusInService,
			"started_at": now,
		}).Error
}

// CompleteService marks a ticket as completed
func (r *QueueRepository) CompleteService(id uint) error {
	now := time.Now()
	return r.db.Model(&domain.QueueTicket{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":       domain.QueueStatusCompleted,
			"completed_at": now,
		}).Error
}

// MarkNoShow marks a ticket as no-show
func (r *QueueRepository) MarkNoShow(id uint) error {
	return r.db.Model(&domain.QueueTicket{}).Where("id = ?", id).
		Update("status", domain.QueueStatusNoShow).Error
}

// GetStats retrieves queue statistics
func (r *QueueRepository) GetStats() (*domain.QueueStats, error) {
	stats := &domain.QueueStats{
		ByPriority:    make(map[string]int),
		ByService:     make(map[string]int),
		EstimatedWait: make(map[string]int),
	}

	today := time.Now().Truncate(24 * time.Hour)

	// Count by status
	var totalWaiting, totalInService, totalCompleted int64
	r.db.Model(&domain.QueueTicket{}).
		Where("created_at >= ? AND status = ?", today, domain.QueueStatusWaiting).
		Count(&totalWaiting)
	stats.TotalWaiting = int(totalWaiting)

	r.db.Model(&domain.QueueTicket{}).
		Where("created_at >= ? AND status = ?", today, domain.QueueStatusInService).
		Count(&totalInService)
	stats.TotalInService = int(totalInService)

	r.db.Model(&domain.QueueTicket{}).
		Where("created_at >= ? AND status = ?", today, domain.QueueStatusCompleted).
		Count(&totalCompleted)
	stats.TotalCompleted = int(totalCompleted)

	// Average wait time
	var avgWait float64
	r.db.Model(&domain.QueueTicket{}).
		Where("created_at >= ? AND actual_wait > 0", today).
		Select("AVG(actual_wait)").Scan(&avgWait)
	stats.AvgWaitTime = avgWait

	// Count by priority
	type PriorityCount struct {
		Priority string
		Count    int
	}
	var priorityCounts []PriorityCount
	r.db.Model(&domain.QueueTicket{}).
		Where("created_at >= ? AND status = ?", today, domain.QueueStatusWaiting).
		Select("priority, COUNT(*) as count").
		Group("priority").
		Scan(&priorityCounts)
	for _, pc := range priorityCounts {
		stats.ByPriority[pc.Priority] = pc.Count
	}

	// Count by service
	var serviceCounts []struct {
		ServiceType string
		Count       int
	}
	r.db.Model(&domain.QueueTicket{}).
		Where("created_at >= ? AND status = ?", today, domain.QueueStatusWaiting).
		Select("service_type, COUNT(*) as count").
		Group("service_type").
		Scan(&serviceCounts)
	for _, sc := range serviceCounts {
		stats.ByService[sc.ServiceType] = sc.Count
	}

	// Estimated wait by priority (based on average service time)
	for priority, order := range domain.PriorityOrderMap {
		// Estimate: 5 min base + 3 min per person ahead with same or higher priority
		var ahead int64
		r.db.Model(&domain.QueueTicket{}).
			Where("created_at >= ? AND status = ? AND priority_order <= ?", today, domain.QueueStatusWaiting, order).
			Count(&ahead)
		stats.EstimatedWait[priority] = 5 + int(ahead)*3
	}

	return stats, nil
}

// GetDisplayData retrieves data for the public display
func (r *QueueRepository) GetDisplayData() (*domain.QueueDisplay, error) {
	display := &domain.QueueDisplay{}

	// Get currently being served
	current, err := r.GetCurrentlyServing()
	if err != nil {
		return nil, err
	}
	display.CurrentTickets = current

	// Get next 5 in queue
	var next []domain.QueueTicket
	r.db.Where("status = ?", domain.QueueStatusWaiting).
		Order("priority_order ASC, created_at ASC").
		Limit(5).
		Find(&next)
	display.NextTickets = next

	// Get last called
	var lastCalled domain.QueueTicket
	err = r.db.Where("status IN ?", []string{domain.QueueStatusCalled, domain.QueueStatusInService}).
		Order("called_at DESC").
		First(&lastCalled).Error
	if err == nil {
		display.LastCalled = &lastCalled
	}

	// Get stats
	stats, _ := r.GetStats()
	if stats != nil {
		display.Stats = *stats
	}

	return display, nil
}
