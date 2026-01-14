package services

import (
	"context"
	"encoding/json"
	"errors"
	"medisync-platform/backend/internal/adapters/repository"
	"medisync-platform/backend/internal/core/domain"
)

// ClinicService handles clinic business logic
type ClinicService struct {
	repo *repository.ClinicRepository
}

// NewClinicService creates a new service instance
func NewClinicService(repo *repository.ClinicRepository) *ClinicService {
	return &ClinicService{repo: repo}
}

// CreateClinicInput defines input for creating a clinic
type CreateClinicInput struct {
	Name             string   `json:"name"`
	Description      string   `json:"description"`
	CNPJ             string   `json:"cnpj"`
	Phone            string   `json:"phone"`
	Email            string   `json:"email"`
	Website          string   `json:"website"`
	Address          string   `json:"address"`
	City             string   `json:"city"`
	State            string   `json:"state"`
	ZipCode          string   `json:"zip_code"`
	Neighborhood     string   `json:"neighborhood"`
	Latitude         float64  `json:"latitude"`
	Longitude        float64  `json:"longitude"`
	Specialties      []string `json:"specialties"`
	AcceptsInsurance bool     `json:"accepts_insurance"`
	InsuranceList    []string `json:"insurance_list"`
	LogoURL          string   `json:"logo_url"`
}

// CreateClinic creates a new clinic
func (s *ClinicService) CreateClinic(ctx context.Context, input CreateClinicInput, ownerID *int) (*domain.Clinic, error) {
	specialtiesJSON, _ := json.Marshal(input.Specialties)
	insuranceJSON, _ := json.Marshal(input.InsuranceList)

	clinic := &domain.Clinic{
		Name:             input.Name,
		Description:      input.Description,
		CNPJ:             input.CNPJ,
		Phone:            input.Phone,
		Email:            input.Email,
		Website:          input.Website,
		Address:          input.Address,
		City:             input.City,
		State:            input.State,
		ZipCode:          input.ZipCode,
		Neighborhood:     input.Neighborhood,
		Latitude:         input.Latitude,
		Longitude:        input.Longitude,
		Specialties:      string(specialtiesJSON),
		AcceptsInsurance: input.AcceptsInsurance,
		InsuranceList:    string(insuranceJSON),
		LogoURL:          input.LogoURL,
		OwnerID:          ownerID,
		IsActive:         true,
	}

	if err := s.repo.Create(ctx, clinic); err != nil {
		return nil, errors.New("failed to create clinic")
	}

	return clinic, nil
}

// GetClinic retrieves a clinic by ID
func (s *ClinicService) GetClinic(ctx context.Context, id int) (*domain.Clinic, error) {
	return s.repo.FindByID(ctx, id)
}

// ListClinics retrieves all clinics with pagination
func (s *ClinicService) ListClinics(ctx context.Context, page, pageSize int) ([]domain.Clinic, int64, error) {
	return s.repo.List(ctx, page, pageSize)
}

// FindNearby finds clinics near a location
func (s *ClinicService) FindNearby(ctx context.Context, lat, lng float64, radiusKm float64, specialty string, limit int) ([]domain.Clinic, error) {
	if radiusKm <= 0 {
		radiusKm = 10 // Default 10km radius
	}
	if limit <= 0 {
		limit = 20
	}
	return s.repo.FindNearby(ctx, lat, lng, radiusKm, specialty, limit)
}

// FindBySpecialty finds clinics by specialty
func (s *ClinicService) FindBySpecialty(ctx context.Context, specialty string, page, pageSize int) ([]domain.Clinic, int64, error) {
	return s.repo.FindBySpecialty(ctx, specialty, page, pageSize)
}

// FindByCity finds clinics by city
func (s *ClinicService) FindByCity(ctx context.Context, city string, page, pageSize int) ([]domain.Clinic, int64, error) {
	return s.repo.FindByCity(ctx, city, page, pageSize)
}

// SearchClinics searches clinics
func (s *ClinicService) SearchClinics(ctx context.Context, query string, page, pageSize int) ([]domain.Clinic, int64, error) {
	return s.repo.Search(ctx, query, page, pageSize)
}

// GetPremiumClinics retrieves featured/premium clinics
func (s *ClinicService) GetPremiumClinics(ctx context.Context, limit int) ([]domain.Clinic, error) {
	return s.repo.GetPremiumClinics(ctx, limit)
}

// UpdateClinic updates a clinic
func (s *ClinicService) UpdateClinic(ctx context.Context, id int, updates map[string]interface{}, userID int, userRole string) (*domain.Clinic, error) {
	clinic, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("clinic not found")
	}

	// Authorization: only owner or admin can update
	if userRole != domain.RoleAdmin && (clinic.OwnerID == nil || *clinic.OwnerID != userID) {
		return nil, errors.New("unauthorized to update this clinic")
	}

	// Apply updates
	if name, ok := updates["name"].(string); ok && name != "" {
		clinic.Name = name
	}
	if desc, ok := updates["description"].(string); ok {
		clinic.Description = desc
	}
	if phone, ok := updates["phone"].(string); ok {
		clinic.Phone = phone
	}
	if email, ok := updates["email"].(string); ok {
		clinic.Email = email
	}
	if address, ok := updates["address"].(string); ok {
		clinic.Address = address
	}
	if specialties, ok := updates["specialties"].([]string); ok {
		specialtiesJSON, _ := json.Marshal(specialties)
		clinic.Specialties = string(specialtiesJSON)
	}

	if err := s.repo.Update(ctx, clinic); err != nil {
		return nil, errors.New("failed to update clinic")
	}

	return clinic, nil
}

// DeleteClinic soft-deletes a clinic
func (s *ClinicService) DeleteClinic(ctx context.Context, id int, userID int, userRole string) error {
	clinic, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return errors.New("clinic not found")
	}

	// Authorization: only owner or admin can delete
	if userRole != domain.RoleAdmin && (clinic.OwnerID == nil || *clinic.OwnerID != userID) {
		return errors.New("unauthorized to delete this clinic")
	}

	return s.repo.Delete(ctx, id)
}

// CreateReview creates a review for a clinic
func (s *ClinicService) CreateReview(ctx context.Context, clinicID, patientID int, rating int, comment string) (*domain.ClinicReview, error) {
	if rating < 1 || rating > 5 {
		return nil, errors.New("rating must be between 1 and 5")
	}

	review := &domain.ClinicReview{
		ClinicID:  clinicID,
		PatientID: patientID,
		Rating:    rating,
		Comment:   comment,
	}

	if err := s.repo.CreateReview(ctx, review); err != nil {
		return nil, errors.New("failed to create review")
	}

	return review, nil
}

// GetReviews retrieves reviews for a clinic
func (s *ClinicService) GetReviews(ctx context.Context, clinicID int, page, pageSize int) ([]domain.ClinicReview, int64, error) {
	return s.repo.GetReviews(ctx, clinicID, page, pageSize)
}

// SetPremium sets a clinic as premium (admin only)
func (s *ClinicService) SetPremium(ctx context.Context, clinicID int, isPremium bool, featuredOrder int) error {
	clinic, err := s.repo.FindByID(ctx, clinicID)
	if err != nil {
		return errors.New("clinic not found")
	}

	clinic.IsPremium = isPremium
	clinic.FeaturedOrder = featuredOrder

	return s.repo.Update(ctx, clinic)
}
