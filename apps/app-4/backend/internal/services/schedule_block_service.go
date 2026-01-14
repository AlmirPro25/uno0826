package services

import (
	"context"
	"errors"
	"medisync-platform/backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

// ScheduleBlockRepository interface for the service.
type ScheduleBlockRepository interface {
	Create(ctx context.Context, block *domain.ScheduleBlock) error
	FindByID(ctx context.Context, id int) (*domain.ScheduleBlock, error)
	ListByDoctorID(ctx context.Context, doctorID int) ([]domain.ScheduleBlock, error)
	ListByDoctorIDAndDateRange(ctx context.Context, doctorID int, startDate, endDate time.Time) ([]domain.ScheduleBlock, error)
	Update(ctx context.Context, block *domain.ScheduleBlock) error
	Delete(ctx context.Context, id int) error
	IsTimeBlocked(ctx context.Context, doctorID int, startTime, endTime time.Time) (bool, error)
}

// ScheduleBlockService handles schedule block business logic.
type ScheduleBlockService struct {
	repo ScheduleBlockRepository
}

// NewScheduleBlockService creates a new instance of ScheduleBlockService.
func NewScheduleBlockService(repo ScheduleBlockRepository) *ScheduleBlockService {
	return &ScheduleBlockService{repo: repo}
}

// CreateBlock creates a new schedule block for a doctor.
func (s *ScheduleBlockService) CreateBlock(ctx context.Context, doctorID int, startTime, endTime time.Time, reason string, recurring bool) (*domain.ScheduleBlock, error) {
	// Validate times
	if endTime.Before(startTime) || endTime.Equal(startTime) {
		return nil, errors.New("end time must be after start time")
	}

	// For non-recurring blocks, ensure start time is in the future
	if !recurring && startTime.Before(time.Now()) {
		return nil, errors.New("start time must be in the future")
	}

	block := &domain.ScheduleBlock{
		DoctorID:  doctorID,
		StartTime: startTime,
		EndTime:   endTime,
		Reason:    reason,
		Recurring: recurring,
	}

	if err := s.repo.Create(ctx, block); err != nil {
		return nil, errors.New("failed to create schedule block")
	}

	return s.repo.FindByID(ctx, block.ID)
}

// GetBlock retrieves a schedule block by ID with authorization check.
func (s *ScheduleBlockService) GetBlock(ctx context.Context, blockID, userID int, userRole string) (*domain.ScheduleBlock, error) {
	block, err := s.repo.FindByID(ctx, blockID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("schedule block not found")
		}
		return nil, err
	}

	// Authorization: Admin can see all, Doctor can see their own
	if userRole == domain.RoleAdmin {
		return block, nil
	}
	if userRole == domain.RoleMedico && block.DoctorID == userID {
		return block, nil
	}

	return nil, errors.New("unauthorized to view this schedule block")
}

// GetBlocksForDoctor retrieves all schedule blocks for a doctor.
func (s *ScheduleBlockService) GetBlocksForDoctor(ctx context.Context, doctorID int) ([]domain.ScheduleBlock, error) {
	return s.repo.ListByDoctorID(ctx, doctorID)
}

// GetBlocksForDoctorInRange retrieves schedule blocks for a doctor within a date range.
func (s *ScheduleBlockService) GetBlocksForDoctorInRange(ctx context.Context, doctorID int, startDate, endDate time.Time) ([]domain.ScheduleBlock, error) {
	return s.repo.ListByDoctorIDAndDateRange(ctx, doctorID, startDate, endDate)
}

// UpdateBlock updates an existing schedule block.
func (s *ScheduleBlockService) UpdateBlock(ctx context.Context, blockID, doctorID int, updates map[string]interface{}) (*domain.ScheduleBlock, error) {
	block, err := s.repo.FindByID(ctx, blockID)
	if err != nil {
		return nil, errors.New("schedule block not found")
	}

	// Only the doctor who created the block can update it
	if block.DoctorID != doctorID {
		return nil, errors.New("unauthorized to update this schedule block")
	}

	// Apply updates
	if startTimeStr, ok := updates["startTime"].(string); ok {
		if startTime, err := time.Parse(time.RFC3339, startTimeStr); err == nil {
			block.StartTime = startTime
		}
	}
	if endTimeStr, ok := updates["endTime"].(string); ok {
		if endTime, err := time.Parse(time.RFC3339, endTimeStr); err == nil {
			block.EndTime = endTime
		}
	}
	if reason, ok := updates["reason"].(string); ok {
		block.Reason = reason
	}
	if recurring, ok := updates["recurring"].(bool); ok {
		block.Recurring = recurring
	}

	// Validate times after update
	if block.EndTime.Before(block.StartTime) || block.EndTime.Equal(block.StartTime) {
		return nil, errors.New("end time must be after start time")
	}

	if err := s.repo.Update(ctx, block); err != nil {
		return nil, errors.New("failed to update schedule block")
	}

	return block, nil
}

// DeleteBlock deletes a schedule block.
func (s *ScheduleBlockService) DeleteBlock(ctx context.Context, blockID, doctorID int, userRole string) error {
	block, err := s.repo.FindByID(ctx, blockID)
	if err != nil {
		return errors.New("schedule block not found")
	}

	// Admin can delete any, Doctor can only delete their own
	if userRole == domain.RoleAdmin {
		return s.repo.Delete(ctx, blockID)
	}
	if userRole == domain.RoleMedico && block.DoctorID == doctorID {
		return s.repo.Delete(ctx, blockID)
	}

	return errors.New("unauthorized to delete this schedule block")
}

// IsTimeBlocked checks if a specific time slot is blocked for a doctor.
func (s *ScheduleBlockService) IsTimeBlocked(ctx context.Context, doctorID int, startTime, endTime time.Time) (bool, error) {
	return s.repo.IsTimeBlocked(ctx, doctorID, startTime, endTime)
}
