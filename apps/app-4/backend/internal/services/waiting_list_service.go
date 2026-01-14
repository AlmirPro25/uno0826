package services

import (
	"context"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
)

// WaitingListService implementation.
type WaitingListService struct {
	waitingListRepository ports.WaitingListRepository
}

// NewWaitingListService creates a new instance of WaitingListService.
func NewWaitingListService(repo ports.WaitingListRepository) *WaitingListService {
	return &WaitingListService{waitingListRepository: repo}
}

// JoinWaitingRoom adds a patient to the virtual waiting room.
func (s *WaitingListService) JoinWaitingRoom(ctx context.Context, patientID int) error {
	return s.waitingListRepository.JoinWaitingRoom(ctx, patientID)
}

// LeaveWaitingRoom removes a patient from the virtual waiting room.
func (s *WaitingListService) LeaveWaitingRoom(ctx context.Context, patientID int) error {
	return s.waitingListRepository.LeaveWaitingRoom(ctx, patientID)
}

// GetWaitingPatients retrieves the list of patients currently waiting for a specific doctor.
func (s *WaitingListService) GetWaitingPatients(ctx context.Context, doctorID int) ([]domain.WaitingList, error) {
	// Note: The specific doctorID parameter here is complex. The schema doesn't link WaitingList directly to a doctor.
	// We assume a patient enters the waiting room for their next appointment with *a* doctor.
	// For this implementation, we'll return all waiting patients, assuming a general waiting room.
	// In a real system, the logic would need to filter by the doctor's next appointment.

	// A more robust implementation would check the patient's upcoming appointment with doctorID.
	// For now, return all waiting patients.
	return s.waitingListRepository.ListWaitingPatients(ctx, doctorID)
}
