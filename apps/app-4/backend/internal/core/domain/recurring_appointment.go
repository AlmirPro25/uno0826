package domain

import "time"

// RecurringAppointment represents a recurring appointment pattern.
type RecurringAppointment struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	PatientID     int       `gorm:"column:patient_id;not null" json:"patientId"`
	DoctorID      int       `gorm:"column:doctor_id;not null" json:"doctorId"`
	StartTime     time.Time `gorm:"column:start_time;not null" json:"startTime"`     // Time of day for the appointment
	Duration      int       `gorm:"column:duration;default:30" json:"duration"`      // Duration in minutes
	Frequency     string    `gorm:"column:frequency;not null" json:"frequency"`      // weekly, biweekly, monthly
	DayOfWeek     int       `gorm:"column:day_of_week" json:"dayOfWeek"`             // 0=Sunday, 1=Monday, etc.
	StartDate     time.Time `gorm:"column:start_date;not null" json:"startDate"`     // When the recurrence starts
	EndDate       time.Time `gorm:"column:end_date" json:"endDate"`                  // When the recurrence ends (optional)
	MaxOccurrences int      `gorm:"column:max_occurrences" json:"maxOccurrences"`    // Max number of appointments (optional)
	IsActive      bool      `gorm:"column:is_active;default:true" json:"isActive"`
	Notes         string    `gorm:"column:notes" json:"notes"`
	CreatedAt     time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt     time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`

	// Relations
	Patient User `gorm:"foreignKey:PatientID;references:ID" json:"patient,omitempty"`
	Doctor  User `gorm:"foreignKey:DoctorID;references:ID" json:"doctor,omitempty"`
}

// Frequency constants
const (
	FrequencyWeekly   = "weekly"
	FrequencyBiweekly = "biweekly"
	FrequencyMonthly  = "monthly"
)

// GenerateNextOccurrences generates the next N appointment dates based on the recurrence pattern.
func (r *RecurringAppointment) GenerateNextOccurrences(count int) []time.Time {
	var occurrences []time.Time
	current := r.StartDate

	// If start date is in the past, move to the next occurrence
	now := time.Now()
	for current.Before(now) {
		current = r.getNextDate(current)
	}

	for i := 0; i < count; i++ {
		// Check if we've exceeded the end date
		if !r.EndDate.IsZero() && current.After(r.EndDate) {
			break
		}

		// Check if we've exceeded max occurrences
		if r.MaxOccurrences > 0 && i >= r.MaxOccurrences {
			break
		}

		// Create the appointment time
		appointmentTime := time.Date(
			current.Year(), current.Month(), current.Day(),
			r.StartTime.Hour(), r.StartTime.Minute(), 0, 0,
			current.Location(),
		)

		occurrences = append(occurrences, appointmentTime)
		current = r.getNextDate(current)
	}

	return occurrences
}

// getNextDate calculates the next date based on frequency.
func (r *RecurringAppointment) getNextDate(current time.Time) time.Time {
	switch r.Frequency {
	case FrequencyWeekly:
		return current.AddDate(0, 0, 7)
	case FrequencyBiweekly:
		return current.AddDate(0, 0, 14)
	case FrequencyMonthly:
		return current.AddDate(0, 1, 0)
	default:
		return current.AddDate(0, 0, 7) // Default to weekly
	}
}
