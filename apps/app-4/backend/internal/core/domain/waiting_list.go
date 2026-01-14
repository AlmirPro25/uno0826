package domain

import "time"

// WaitingList represents a patient currently in the virtual waiting room.
type WaitingList struct {
	ID        int       `gorm:"primaryKey;autoIncrement"`
	PatientID int       `gorm:"column:patient_id;unique;not null"`
	JoinedAt  time.Time `gorm:"column:joined_at;autoCreateTime"`
	Status    string    `gorm:"column:status;default:waiting"` // waiting, in_consultation, left

	// Relation
	Patient User `gorm:"foreignKey:PatientID;references:ID"`
}

// WaitingListStatus constants
const (
	StatusWaiting        = "waiting"
	StatusInConsultation = "in_consultation"
	StatusLeft           = "left"
)
