package domain

import "time"

// ScheduleBlock represents a blocked time slot for a doctor.
type ScheduleBlock struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	DoctorID  int       `gorm:"column:doctor_id;not null" json:"doctorId"`
	StartTime time.Time `gorm:"column:start_time;not null" json:"startTime"`
	EndTime   time.Time `gorm:"column:end_time;not null" json:"endTime"`
	Reason    string    `gorm:"column:reason" json:"reason"`
	Recurring bool      `gorm:"column:recurring;default:false" json:"recurring"` // For daily blocks like lunch
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`

	// Relations
	Doctor User `gorm:"foreignKey:DoctorID;references:ID" json:"doctor,omitempty"`
}

// Block reasons
const (
	BlockReasonLunch    = "lunch"
	BlockReasonVacation = "vacation"
	BlockReasonMeeting  = "meeting"
	BlockReasonPersonal = "personal"
	BlockReasonOther    = "other"
)
