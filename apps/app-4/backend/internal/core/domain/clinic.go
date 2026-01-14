package domain

import "time"

// Clinic represents a healthcare facility/clinic
type Clinic struct {
	ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"column:name;not null" json:"name"`
	Description string    `gorm:"column:description;type:text" json:"description"`
	CNPJ        string    `gorm:"column:cnpj;uniqueIndex" json:"cnpj,omitempty"`

	// Contact Info
	Phone   string `gorm:"column:phone" json:"phone"`
	Email   string `gorm:"column:email" json:"email"`
	Website string `gorm:"column:website" json:"website,omitempty"`

	// Address
	Address      string `gorm:"column:address;not null" json:"address"`
	City         string `gorm:"column:city;not null;index" json:"city"`
	State        string `gorm:"column:state;not null;index" json:"state"`
	ZipCode      string `gorm:"column:zip_code" json:"zip_code"`
	Neighborhood string `gorm:"column:neighborhood" json:"neighborhood"`

	// Geolocation
	Latitude  float64 `gorm:"column:latitude;not null;index" json:"latitude"`
	Longitude float64 `gorm:"column:longitude;not null;index" json:"longitude"`

	// Business Info
	Specialties    string `gorm:"column:specialties;type:text" json:"specialties"`               // JSON array
	OpeningHours   string `gorm:"column:opening_hours;type:text" json:"opening_hours,omitempty"` // JSON object
	AcceptsInsurance bool   `gorm:"column:accepts_insurance;default:true" json:"accepts_insurance"`
	InsuranceList  string `gorm:"column:insurance_list;type:text" json:"insurance_list,omitempty"` // JSON array

	// Premium Features (monetization)
	IsPremium       bool   `gorm:"column:is_premium;default:false;index" json:"is_premium"`
	PremiumUntil    *time.Time `gorm:"column:premium_until" json:"premium_until,omitempty"`
	FeaturedOrder   int    `gorm:"column:featured_order;default:0" json:"featured_order"` // Higher = more visible
	LogoURL         string `gorm:"column:logo_url" json:"logo_url,omitempty"`
	BannerURL       string `gorm:"column:banner_url" json:"banner_url,omitempty"`
	HighlightColor  string `gorm:"column:highlight_color" json:"highlight_color,omitempty"`

	// Ratings
	AverageRating float64 `gorm:"column:average_rating;default:0" json:"average_rating"`
	TotalReviews  int     `gorm:"column:total_reviews;default:0" json:"total_reviews"`

	// Status
	IsActive   bool `gorm:"column:is_active;default:true;index" json:"is_active"`
	IsVerified bool `gorm:"column:is_verified;default:false" json:"is_verified"`

	// Owner (optional - for clinic admins)
	OwnerID *int `gorm:"column:owner_id" json:"owner_id,omitempty"`

	// Timestamps
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relations
	Owner   *User    `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Doctors []User   `gorm:"many2many:clinic_doctors;" json:"doctors,omitempty"`
}

// TableName specifies the table name
func (Clinic) TableName() string {
	return "clinics"
}

// ClinicDoctor represents the many-to-many relationship between clinics and doctors
type ClinicDoctor struct {
	ClinicID  int       `gorm:"primaryKey"`
	DoctorID  int       `gorm:"primaryKey"`
	JoinedAt  time.Time `gorm:"autoCreateTime"`
	IsActive  bool      `gorm:"default:true"`
}

// TableName specifies the table name
func (ClinicDoctor) TableName() string {
	return "clinic_doctors"
}

// ClinicReview represents a review for a clinic
type ClinicReview struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	ClinicID  int       `gorm:"column:clinic_id;not null;index" json:"clinic_id"`
	PatientID int       `gorm:"column:patient_id;not null;index" json:"patient_id"`
	Rating    int       `gorm:"column:rating;not null" json:"rating"` // 1-5
	Comment   string    `gorm:"column:comment;type:text" json:"comment"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`

	// Relations
	Clinic  Clinic `gorm:"foreignKey:ClinicID" json:"clinic,omitempty"`
	Patient User   `gorm:"foreignKey:PatientID" json:"patient,omitempty"`
}

// TableName specifies the table name
func (ClinicReview) TableName() string {
	return "clinic_reviews"
}
