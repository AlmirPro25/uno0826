package domain

import (
	"time"
)

// QueueTicket represents a patient ticket in the waiting queue
type QueueTicket struct {
	ID              uint       `json:"id" gorm:"primaryKey"`
	TicketNumber    string     `json:"ticket_number" gorm:"size:20;not null;index"`
	ClinicID        *uint      `json:"clinic_id" gorm:"index"`                 // For multi-clinic support
	Clinic          *Clinic    `json:"clinic,omitempty" gorm:"foreignKey:ClinicID"`
	PatientID       *uint      `json:"patient_id" gorm:"index"`
	Patient         *User      `json:"patient,omitempty" gorm:"foreignKey:PatientID"`
	PatientName     string     `json:"patient_name" gorm:"size:255"` // For walk-ins without account
	TriageReportID  *uint      `json:"triage_report_id" gorm:"index"`
	TriageReport    *TriageReport `json:"triage_report,omitempty" gorm:"foreignKey:TriageReportID"`
	Priority        string     `json:"priority" gorm:"size:50;not null;index"` // Manchester priority
	PriorityOrder   int        `json:"priority_order" gorm:"not null;index"`   // 1=Emergency, 5=Non-urgent
	ServiceType     string     `json:"service_type" gorm:"size:100;not null"`  // Specialty or service
	Status          string     `json:"status" gorm:"size:50;not null;default:'waiting';index"`
	Counter         string     `json:"counter" gorm:"size:50"`                 // Which counter/room
	CalledAt        *time.Time `json:"called_at"`
	StartedAt       *time.Time `json:"started_at"`
	CompletedAt     *time.Time `json:"completed_at"`
	CalledBy        *uint      `json:"called_by"`
	CalledByUser    *User      `json:"called_by_user,omitempty" gorm:"foreignKey:CalledBy"`
	Notes           string     `json:"notes" gorm:"type:text"`
	EstimatedWait   int        `json:"estimated_wait"`   // Minutes
	ActualWait      int        `json:"actual_wait"`      // Minutes
	CreatedAt       time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

// Queue status constants
const (
	QueueStatusWaiting    = "waiting"
	QueueStatusCalled     = "called"
	QueueStatusInService  = "in_service"
	QueueStatusCompleted  = "completed"
	QueueStatusNoShow     = "no_show"
	QueueStatusCancelled  = "cancelled"
)

// Priority order mapping (lower = more urgent)
var PriorityOrderMap = map[string]int{
	"Emergência":    1,
	"Muito Urgente": 2,
	"Urgente":       3,
	"Pouco Urgente": 4,
	"Não Urgente":   5,
}

// QueueStats represents queue statistics
type QueueStats struct {
	TotalWaiting     int            `json:"total_waiting"`
	TotalInService   int            `json:"total_in_service"`
	TotalCompleted   int            `json:"total_completed"`
	AvgWaitTime      float64        `json:"avg_wait_time"`
	ByPriority       map[string]int `json:"by_priority"`
	ByService        map[string]int `json:"by_service"`
	EstimatedWait    map[string]int `json:"estimated_wait"` // By priority
}

// QueueDisplay represents the public display data
type QueueDisplay struct {
	CurrentTickets []QueueTicket `json:"current_tickets"` // Being called/in service
	NextTickets    []QueueTicket `json:"next_tickets"`    // Next in line
	LastCalled     *QueueTicket  `json:"last_called"`
	Stats          QueueStats    `json:"stats"`
}

// TableName specifies the table name for GORM
func (QueueTicket) TableName() string {
	return "queue_tickets"
}
