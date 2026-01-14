package services

import (
	"context"
	"errors"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
)

// ReviewService implementation.
type ReviewService struct {
	reviewRepository      ports.ReviewRepository
	appointmentRepository ports.AppointmentRepository
}

// NewReviewService creates a new instance of ReviewService.
func NewReviewService(reviewRepo ports.ReviewRepository, apptRepo ports.AppointmentRepository) *ReviewService {
	return &ReviewService{
		reviewRepository:      reviewRepo,
		appointmentRepository: apptRepo,
	}
}

// CreateReview creates a new review for a completed appointment.
func (s *ReviewService) CreateReview(ctx context.Context, patientID, appointmentID int, rating int, comment string) (*domain.Review, error) {
	// Validate rating
	if rating < 1 || rating > 5 {
		return nil, errors.New("rating must be between 1 and 5")
	}

	// Get appointment to verify ownership and status
	appointment, err := s.appointmentRepository.FindByID(ctx, appointmentID)
	if err != nil {
		return nil, errors.New("appointment not found")
	}

	// Verify patient owns this appointment
	if appointment.PatientID != patientID {
		return nil, errors.New("you can only review your own appointments")
	}

	// Verify appointment is completed
	if appointment.Status != domain.StatusCompleted {
		return nil, errors.New("you can only review completed appointments")
	}

	// Check if review already exists
	existing, _ := s.reviewRepository.FindByAppointmentID(ctx, appointmentID)
	if existing != nil {
		return nil, errors.New("you have already reviewed this appointment")
	}


	review := &domain.Review{
		AppointmentID: appointmentID,
		PatientID:     patientID,
		DoctorID:      appointment.DoctorID,
		Rating:        rating,
		Comment:       comment,
	}

	if err := s.reviewRepository.Create(ctx, review); err != nil {
		return nil, errors.New("failed to create review")
	}

	return s.reviewRepository.FindByID(ctx, review.ID)
}

// GetReview retrieves a review by ID with authorization check.
func (s *ReviewService) GetReview(ctx context.Context, reviewID, userID int, userRole string) (*domain.Review, error) {
	review, err := s.reviewRepository.FindByID(ctx, reviewID)
	if err != nil {
		return nil, errors.New("review not found")
	}

	// Admin can see all, Doctor can see their reviews, Patient can see their own
	if userRole == domain.RoleAdmin {
		return review, nil
	}
	if userRole == domain.RoleMedico && review.DoctorID == userID {
		return review, nil
	}
	if userRole == domain.RolePaciente && review.PatientID == userID {
		return review, nil
	}

	return nil, errors.New("unauthorized to view this review")
}

// GetReviewByAppointment retrieves a review by appointment ID.
func (s *ReviewService) GetReviewByAppointment(ctx context.Context, appointmentID, userID int, userRole string) (*domain.Review, error) {
	review, err := s.reviewRepository.FindByAppointmentID(ctx, appointmentID)
	if err != nil {
		return nil, errors.New("review not found for this appointment")
	}

	// Authorization check
	if userRole == domain.RoleAdmin {
		return review, nil
	}
	if userRole == domain.RoleMedico && review.DoctorID == userID {
		return review, nil
	}
	if userRole == domain.RolePaciente && review.PatientID == userID {
		return review, nil
	}

	return nil, errors.New("unauthorized to view this review")
}

// GetReviewsForPatient retrieves all reviews by a patient.
func (s *ReviewService) GetReviewsForPatient(ctx context.Context, patientID int) ([]domain.Review, error) {
	return s.reviewRepository.ListByPatientID(ctx, patientID)
}

// GetReviewsForDoctor retrieves all reviews for a doctor.
func (s *ReviewService) GetReviewsForDoctor(ctx context.Context, doctorID int) ([]domain.Review, error) {
	return s.reviewRepository.ListByDoctorID(ctx, doctorID)
}

// GetDoctorRating returns the average rating and total count for a doctor.
func (s *ReviewService) GetDoctorRating(ctx context.Context, doctorID int) (float64, int, error) {
	return s.reviewRepository.GetDoctorAverageRating(ctx, doctorID)
}

// UpdateReview updates an existing review (only by the patient who created it).
func (s *ReviewService) UpdateReview(ctx context.Context, reviewID, patientID int, rating int, comment string) (*domain.Review, error) {
	if rating < 1 || rating > 5 {
		return nil, errors.New("rating must be between 1 and 5")
	}

	review, err := s.reviewRepository.FindByID(ctx, reviewID)
	if err != nil {
		return nil, errors.New("review not found")
	}

	if review.PatientID != patientID {
		return nil, errors.New("you can only update your own reviews")
	}

	review.Rating = rating
	review.Comment = comment

	if err := s.reviewRepository.Update(ctx, review); err != nil {
		return nil, errors.New("failed to update review")
	}

	return review, nil
}

// DeleteReview deletes a review (only by the patient who created it).
func (s *ReviewService) DeleteReview(ctx context.Context, reviewID, patientID int) error {
	review, err := s.reviewRepository.FindByID(ctx, reviewID)
	if err != nil {
		return errors.New("review not found")
	}

	if review.PatientID != patientID {
		return errors.New("you can only delete your own reviews")
	}

	return s.reviewRepository.Delete(ctx, reviewID)
}
