package domain

import "time"

// AuditLog represents a log entry for tracking user actions in the system.
type AuditLog struct {
	ID         int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     int       `gorm:"column:user_id;not null" json:"userId"`
	Action     string    `gorm:"column:action;not null" json:"action"`
	EntityType string    `gorm:"column:entity_type" json:"entityType"` // e.g., "appointment", "prescription", "user"
	EntityID   int       `gorm:"column:entity_id" json:"entityId"`
	Details    string    `gorm:"column:details;type:text" json:"details"` // JSON string with additional details
	IPAddress  string    `gorm:"column:ip_address" json:"ipAddress"`
	UserAgent  string    `gorm:"column:user_agent" json:"userAgent"`
	CreatedAt  time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`

	// Relations
	User User `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
}

// Audit action types
const (
	// Authentication actions
	AuditActionLogin          = "LOGIN"
	AuditActionLogout         = "LOGOUT"
	AuditActionLoginFailed    = "LOGIN_FAILED"
	AuditActionPasswordReset  = "PASSWORD_RESET"
	AuditActionPasswordChange = "PASSWORD_CHANGE"

	// User actions
	AuditActionUserCreate = "USER_CREATE"
	AuditActionUserUpdate = "USER_UPDATE"
	AuditActionUserDelete = "USER_DELETE"

	// Appointment actions
	AuditActionAppointmentBook     = "APPOINTMENT_BOOK"
	AuditActionAppointmentCancel   = "APPOINTMENT_CANCEL"
	AuditActionAppointmentComplete = "APPOINTMENT_COMPLETE"
	AuditActionAppointmentView     = "APPOINTMENT_VIEW"

	// Medical record actions
	AuditActionRecordCreate = "RECORD_CREATE"
	AuditActionRecordView   = "RECORD_VIEW"
	AuditActionRecordUpdate = "RECORD_UPDATE"
	AuditActionRecordDelete = "RECORD_DELETE"

	// Prescription actions
	AuditActionPrescriptionCreate = "PRESCRIPTION_CREATE"
	AuditActionPrescriptionView   = "PRESCRIPTION_VIEW"
	AuditActionPrescriptionUpdate = "PRESCRIPTION_UPDATE"
	AuditActionPrescriptionDelete = "PRESCRIPTION_DELETE"

	// Certificate actions
	AuditActionCertificateCreate = "CERTIFICATE_CREATE"
	AuditActionCertificateView   = "CERTIFICATE_VIEW"
	AuditActionCertificateDelete = "CERTIFICATE_DELETE"

	// Video call actions
	AuditActionVideoCallStart = "VIDEO_CALL_START"
	AuditActionVideoCallEnd   = "VIDEO_CALL_END"

	// Payment actions
	AuditActionPaymentCreate = "PAYMENT_CREATE"
	AuditActionPaymentUpdate = "PAYMENT_UPDATE"
)

// Entity types
const (
	EntityTypeUser         = "user"
	EntityTypeAppointment  = "appointment"
	EntityTypeRecord       = "medical_record"
	EntityTypePrescription = "prescription"
	EntityTypeCertificate  = "certificate"
	EntityTypePayment      = "payment"
	EntityTypeReview       = "review"
)
