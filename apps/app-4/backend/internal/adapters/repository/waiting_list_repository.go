package repository

import (
	"context"
	"errors"
	"medisync-platform/backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

// WaitingListRepository implementation using GORM.
type WaitingListRepository struct {
	db *gorm.DB
}

// NewWaitingListRepository creates a new repository instance.
func NewWaitingListRepository(db *gorm.DB) *WaitingListRepository {
	return &WaitingListRepository{db: db}
}

// JoinWaitingRoom inserts a patient into the waiting list.
func (repo *WaitingListRepository) JoinWaitingRoom(ctx context.Context, patientID int) error {
	item := domain.WaitingList{
		PatientID: patientID,
		JoinedAt:  time.Now(),
		Status:    domain.StatusWaiting,
	}

	// Create new entry, handle potential unique constraint violation.
	result := repo.db.WithContext(ctx).Create(&item)
	if result.Error != nil {
		// A common error for unique constraints is `pq: duplicate key value violates unique constraint "waiting_lists_patient_id_key"`
		// For a real-time system, we might update the status if they are already in the queue, rather than failing.
		// For now, return error if already exists.
		return errors.New("patient already in waiting room")
	}
	return nil
}

// LeaveWaitingRoom removes a patient from the waiting list.
func (repo *WaitingListRepository) LeaveWaitingRoom(ctx context.Context, patientID int) error {
	result := repo.db.WithContext(ctx).Where("patient_id = ?", patientID).Delete(&domain.WaitingList{})
	return result.Error
}

// GetStatus retrieves the waiting list status for a specific patient.
func (repo *WaitingListRepository) GetStatus(ctx context.Context, patientID int) (*domain.WaitingList, error) {
	var status domain.WaitingList
	result := repo.db.WithContext(ctx).Where("patient_id = ?", patientID).First(&status)
	if result.Error != nil {
		return nil, result.Error
	}
	return &status, nil
}

// ListWaitingPatients retrieves all patients currently in the waiting room for a doctor.
// Note: In a real implementation, a doctor might be associated with specific waiting rooms.
// Here we'll just return all waiting patients, assuming a single waiting room for all doctors.
func (repo *WaitingListRepository) ListWaitingPatients(ctx context.Context, doctorID int) ([]domain.WaitingList, error) {
	var waitingPatients []domain.WaitingList
	result := repo.db.WithContext(ctx).Preload("Patient").Where("status = ?", domain.StatusWaiting).Find(&waitingPatients)
	if result.Error != nil {
		return nil, result.Error
	}
	return waitingPatients, nil
}
