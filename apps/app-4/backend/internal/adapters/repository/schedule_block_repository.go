package repository

import (
	"context"
	"medisync-platform/backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

// ScheduleBlockRepository implementation using GORM.
type ScheduleBlockRepository struct {
	db *gorm.DB
}

// NewScheduleBlockRepository creates a new repository instance.
func NewScheduleBlockRepository(db *gorm.DB) *ScheduleBlockRepository {
	return &ScheduleBlockRepository{db: db}
}

// Create creates a new schedule block in the database.
func (repo *ScheduleBlockRepository) Create(ctx context.Context, block *domain.ScheduleBlock) error {
	return repo.db.WithContext(ctx).Create(block).Error
}

// FindByID retrieves a schedule block by its ID.
func (repo *ScheduleBlockRepository) FindByID(ctx context.Context, id int) (*domain.ScheduleBlock, error) {
	var block domain.ScheduleBlock
	result := repo.db.WithContext(ctx).
		Preload("Doctor").
		Preload("Doctor.Role").
		First(&block, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &block, nil
}

// ListByDoctorID retrieves all schedule blocks for a specific doctor.
func (repo *ScheduleBlockRepository) ListByDoctorID(ctx context.Context, doctorID int) ([]domain.ScheduleBlock, error) {
	var blocks []domain.ScheduleBlock
	result := repo.db.WithContext(ctx).
		Where("doctor_id = ?", doctorID).
		Order("start_time asc").
		Find(&blocks)
	if result.Error != nil {
		return nil, result.Error
	}
	return blocks, nil
}

// ListByDoctorIDAndDateRange retrieves schedule blocks for a doctor within a date range.
func (repo *ScheduleBlockRepository) ListByDoctorIDAndDateRange(ctx context.Context, doctorID int, startDate, endDate time.Time) ([]domain.ScheduleBlock, error) {
	var blocks []domain.ScheduleBlock
	result := repo.db.WithContext(ctx).
		Where("doctor_id = ? AND ((start_time >= ? AND start_time <= ?) OR (end_time >= ? AND end_time <= ?) OR (start_time <= ? AND end_time >= ?) OR recurring = true)",
			doctorID, startDate, endDate, startDate, endDate, startDate, endDate).
		Order("start_time asc").
		Find(&blocks)
	if result.Error != nil {
		return nil, result.Error
	}
	return blocks, nil
}

// Update updates an existing schedule block.
func (repo *ScheduleBlockRepository) Update(ctx context.Context, block *domain.ScheduleBlock) error {
	return repo.db.WithContext(ctx).Save(block).Error
}

// Delete removes a schedule block from the database.
func (repo *ScheduleBlockRepository) Delete(ctx context.Context, id int) error {
	return repo.db.WithContext(ctx).Delete(&domain.ScheduleBlock{}, id).Error
}

// IsTimeBlocked checks if a specific time slot is blocked for a doctor.
func (repo *ScheduleBlockRepository) IsTimeBlocked(ctx context.Context, doctorID int, startTime, endTime time.Time) (bool, error) {
	var count int64

	// Check non-recurring blocks that overlap with the time range
	result := repo.db.WithContext(ctx).Model(&domain.ScheduleBlock{}).
		Where("doctor_id = ? AND recurring = false AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?))",
			doctorID, endTime, startTime, endTime, startTime, startTime, endTime).
		Count(&count)

	if result.Error != nil {
		return false, result.Error
	}

	if count > 0 {
		return true, nil
	}

	// Check recurring blocks (daily blocks like lunch)
	var recurringBlocks []domain.ScheduleBlock
	result = repo.db.WithContext(ctx).
		Where("doctor_id = ? AND recurring = true", doctorID).
		Find(&recurringBlocks)

	if result.Error != nil {
		return false, result.Error
	}

	// For recurring blocks, check if the time of day overlaps
	for _, block := range recurringBlocks {
		blockStartHour := block.StartTime.Hour()
		blockStartMin := block.StartTime.Minute()
		blockEndHour := block.EndTime.Hour()
		blockEndMin := block.EndTime.Minute()

		slotStartHour := startTime.Hour()
		slotStartMin := startTime.Minute()
		slotEndHour := endTime.Hour()
		slotEndMin := endTime.Minute()

		// Convert to minutes for easier comparison
		blockStart := blockStartHour*60 + blockStartMin
		blockEnd := blockEndHour*60 + blockEndMin
		slotStart := slotStartHour*60 + slotStartMin
		slotEnd := slotEndHour*60 + slotEndMin

		// Check overlap
		if slotStart < blockEnd && slotEnd > blockStart {
			return true, nil
		}
	}

	return false, nil
}
