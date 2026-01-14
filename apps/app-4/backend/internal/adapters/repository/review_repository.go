package repository

import (
	"context"
	"medisync-platform/backend/internal/core/domain"

	"gorm.io/gorm"
)

// ReviewRepository implementation using GORM.
type ReviewRepository struct {
	db *gorm.DB
}

// NewReviewRepository creates a new repository instance.
func NewReviewRepository(db *gorm.DB) *ReviewRepository {
	return &ReviewRepository{db: db}
}

// Create creates a new review in the database.
func (repo *ReviewRepository) Create(ctx context.Context, review *domain.Review) error {
	return repo.db.WithContext(ctx).Create(review).Error
}

// FindByID retrieves a review by its ID.
func (repo *ReviewRepository) FindByID(ctx context.Context, id int) (*domain.Review, error) {
	var review domain.Review
	result := repo.db.WithContext(ctx).
		Preload("Patient").
		Preload("Patient.Role").
		Preload("Doctor").
		Preload("Doctor.Role").
		Preload("Appointment").
		First(&review, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &review, nil
}

// FindByAppointmentID retrieves a review by appointment ID.
func (repo *ReviewRepository) FindByAppointmentID(ctx context.Context, appointmentID int) (*domain.Review, error) {
	var review domain.Review
	result := repo.db.WithContext(ctx).
		Preload("Patient").
		Preload("Patient.Role").
		Preload("Doctor").
		Preload("Doctor.Role").
		Where("appointment_id = ?", appointmentID).
		First(&review)
	if result.Error != nil {
		return nil, result.Error
	}
	return &review, nil
}


// ListByPatientID retrieves all reviews by a specific patient.
func (repo *ReviewRepository) ListByPatientID(ctx context.Context, patientID int) ([]domain.Review, error) {
	var reviews []domain.Review
	result := repo.db.WithContext(ctx).
		Preload("Doctor").
		Preload("Doctor.Role").
		Preload("Appointment").
		Where("patient_id = ?", patientID).
		Order("created_at desc").
		Find(&reviews)
	if result.Error != nil {
		return nil, result.Error
	}
	return reviews, nil
}

// ListByDoctorID retrieves all reviews for a specific doctor.
func (repo *ReviewRepository) ListByDoctorID(ctx context.Context, doctorID int) ([]domain.Review, error) {
	var reviews []domain.Review
	result := repo.db.WithContext(ctx).
		Preload("Patient").
		Preload("Patient.Role").
		Preload("Appointment").
		Where("doctor_id = ?", doctorID).
		Order("created_at desc").
		Find(&reviews)
	if result.Error != nil {
		return nil, result.Error
	}
	return reviews, nil
}

// GetDoctorAverageRating calculates the average rating for a doctor.
func (repo *ReviewRepository) GetDoctorAverageRating(ctx context.Context, doctorID int) (float64, int, error) {
	var result struct {
		Average float64
		Count   int64
	}
	err := repo.db.WithContext(ctx).
		Model(&domain.Review{}).
		Select("AVG(rating) as average, COUNT(*) as count").
		Where("doctor_id = ?", doctorID).
		Scan(&result).Error
	if err != nil {
		return 0, 0, err
	}
	return result.Average, int(result.Count), nil
}

// Update updates an existing review.
func (repo *ReviewRepository) Update(ctx context.Context, review *domain.Review) error {
	return repo.db.WithContext(ctx).Save(review).Error
}

// Delete removes a review from the database.
func (repo *ReviewRepository) Delete(ctx context.Context, id int) error {
	return repo.db.WithContext(ctx).Delete(&domain.Review{}, id).Error
}
