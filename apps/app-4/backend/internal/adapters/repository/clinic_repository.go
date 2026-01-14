package repository

import (
	"context"
	"math"
	"medisync-platform/backend/internal/core/domain"

	"gorm.io/gorm"
)

// ClinicRepository implementation using GORM
type ClinicRepository struct {
	db *gorm.DB
}

// NewClinicRepository creates a new repository instance
func NewClinicRepository(db *gorm.DB) *ClinicRepository {
	return &ClinicRepository{db: db}
}

// Create creates a new clinic
func (repo *ClinicRepository) Create(ctx context.Context, clinic *domain.Clinic) error {
	return repo.db.WithContext(ctx).Create(clinic).Error
}

// FindByID retrieves a clinic by ID
func (repo *ClinicRepository) FindByID(ctx context.Context, id int) (*domain.Clinic, error) {
	var clinic domain.Clinic
	result := repo.db.WithContext(ctx).First(&clinic, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &clinic, nil
}

// List retrieves all active clinics with pagination
func (repo *ClinicRepository) List(ctx context.Context, page, pageSize int) ([]domain.Clinic, int64, error) {
	var clinics []domain.Clinic
	var total int64

	repo.db.WithContext(ctx).Model(&domain.Clinic{}).Where("is_active = ?", true).Count(&total)

	offset := (page - 1) * pageSize
	result := repo.db.WithContext(ctx).
		Where("is_active = ?", true).
		Order("is_premium DESC, featured_order DESC, average_rating DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&clinics)

	return clinics, total, result.Error
}

// FindNearby finds clinics within a radius (in km) using Haversine formula
func (repo *ClinicRepository) FindNearby(ctx context.Context, lat, lng float64, radiusKm float64, specialty string, limit int) ([]domain.Clinic, error) {
	var clinics []domain.Clinic

	// Haversine formula for distance calculation
	// Using SQLite compatible syntax
	query := repo.db.WithContext(ctx).
		Where("is_active = ?", true).
		Where(`
			(6371 * acos(
				cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) +
				sin(radians(?)) * sin(radians(latitude))
			)) <= ?
		`, lat, lng, lat, radiusKm)

	// Filter by specialty if provided
	if specialty != "" {
		query = query.Where("specialties LIKE ?", "%"+specialty+"%")
	}

	// Order: premium first, then by distance
	query = query.Order("is_premium DESC, featured_order DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	result := query.Find(&clinics)
	if result.Error != nil {
		return nil, result.Error
	}

	// Calculate and sort by distance in Go (more reliable than SQL for SQLite)
	for i := range clinics {
		clinics[i].FeaturedOrder = int(calculateDistance(lat, lng, clinics[i].Latitude, clinics[i].Longitude) * 1000) // Store distance in meters temporarily
	}

	return clinics, nil
}

// calculateDistance calculates distance between two points using Haversine formula
func calculateDistance(lat1, lng1, lat2, lng2 float64) float64 {
	const earthRadius = 6371 // km

	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	deltaLat := (lat2 - lat1) * math.Pi / 180
	deltaLng := (lng2 - lng1) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLng/2)*math.Sin(deltaLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}

// FindBySpecialty finds clinics by specialty
func (repo *ClinicRepository) FindBySpecialty(ctx context.Context, specialty string, page, pageSize int) ([]domain.Clinic, int64, error) {
	var clinics []domain.Clinic
	var total int64

	query := repo.db.WithContext(ctx).Model(&domain.Clinic{}).
		Where("is_active = ?", true).
		Where("specialties LIKE ?", "%"+specialty+"%")

	query.Count(&total)

	offset := (page - 1) * pageSize
	result := query.
		Order("is_premium DESC, featured_order DESC, average_rating DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&clinics)

	return clinics, total, result.Error
}

// FindByCity finds clinics by city
func (repo *ClinicRepository) FindByCity(ctx context.Context, city string, page, pageSize int) ([]domain.Clinic, int64, error) {
	var clinics []domain.Clinic
	var total int64

	query := repo.db.WithContext(ctx).Model(&domain.Clinic{}).
		Where("is_active = ?", true).
		Where("LOWER(city) = LOWER(?)", city)

	query.Count(&total)

	offset := (page - 1) * pageSize
	result := query.
		Order("is_premium DESC, featured_order DESC, average_rating DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&clinics)

	return clinics, total, result.Error
}

// Update updates a clinic
func (repo *ClinicRepository) Update(ctx context.Context, clinic *domain.Clinic) error {
	return repo.db.WithContext(ctx).Save(clinic).Error
}

// Delete soft-deletes a clinic (sets is_active to false)
func (repo *ClinicRepository) Delete(ctx context.Context, id int) error {
	return repo.db.WithContext(ctx).
		Model(&domain.Clinic{}).
		Where("id = ?", id).
		Update("is_active", false).Error
}

// UpdateRating updates the average rating of a clinic
func (repo *ClinicRepository) UpdateRating(ctx context.Context, clinicID int) error {
	var result struct {
		AvgRating   float64
		TotalReviews int64
	}

	repo.db.WithContext(ctx).
		Model(&domain.ClinicReview{}).
		Select("AVG(rating) as avg_rating, COUNT(*) as total_reviews").
		Where("clinic_id = ?", clinicID).
		Scan(&result)

	return repo.db.WithContext(ctx).
		Model(&domain.Clinic{}).
		Where("id = ?", clinicID).
		Updates(map[string]interface{}{
			"average_rating": result.AvgRating,
			"total_reviews":  result.TotalReviews,
		}).Error
}

// CreateReview creates a clinic review
func (repo *ClinicRepository) CreateReview(ctx context.Context, review *domain.ClinicReview) error {
	if err := repo.db.WithContext(ctx).Create(review).Error; err != nil {
		return err
	}
	return repo.UpdateRating(ctx, review.ClinicID)
}

// GetReviews retrieves reviews for a clinic
func (repo *ClinicRepository) GetReviews(ctx context.Context, clinicID int, page, pageSize int) ([]domain.ClinicReview, int64, error) {
	var reviews []domain.ClinicReview
	var total int64

	repo.db.WithContext(ctx).Model(&domain.ClinicReview{}).Where("clinic_id = ?", clinicID).Count(&total)

	offset := (page - 1) * pageSize
	result := repo.db.WithContext(ctx).
		Preload("Patient").
		Where("clinic_id = ?", clinicID).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&reviews)

	return reviews, total, result.Error
}

// GetPremiumClinics retrieves premium/featured clinics
func (repo *ClinicRepository) GetPremiumClinics(ctx context.Context, limit int) ([]domain.Clinic, error) {
	var clinics []domain.Clinic

	result := repo.db.WithContext(ctx).
		Where("is_active = ? AND is_premium = ?", true, true).
		Order("featured_order DESC, average_rating DESC").
		Limit(limit).
		Find(&clinics)

	return clinics, result.Error
}

// Search searches clinics by name, specialty, or city
func (repo *ClinicRepository) Search(ctx context.Context, query string, page, pageSize int) ([]domain.Clinic, int64, error) {
	var clinics []domain.Clinic
	var total int64

	searchQuery := "%" + query + "%"

	dbQuery := repo.db.WithContext(ctx).Model(&domain.Clinic{}).
		Where("is_active = ?", true).
		Where("name LIKE ? OR specialties LIKE ? OR city LIKE ? OR neighborhood LIKE ?",
			searchQuery, searchQuery, searchQuery, searchQuery)

	dbQuery.Count(&total)

	offset := (page - 1) * pageSize
	result := dbQuery.
		Order("is_premium DESC, featured_order DESC, average_rating DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&clinics)

	return clinics, total, result.Error
}
