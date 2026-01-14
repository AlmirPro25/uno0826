package controllers

import (
	"medisync-platform/backend/internal/core/domain"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// StatsController handles API requests related to statistics and reports.
type StatsController struct {
	db *gorm.DB
}

// NewStatsController creates a new instance of StatsController.
func NewStatsController(db *gorm.DB) *StatsController {
	return &StatsController{db: db}
}

// DashboardStats represents the main dashboard statistics
type DashboardStats struct {
	TotalAppointments     int64            `json:"totalAppointments"`
	TodayAppointments     int64            `json:"todayAppointments"`
	PendingAppointments   int64            `json:"pendingAppointments"`
	CompletedAppointments int64            `json:"completedAppointments"`
	CancelledAppointments int64            `json:"cancelledAppointments"`
	TotalPatients         int64            `json:"totalPatients"`
	TotalDoctors          int64            `json:"totalDoctors"`
	TotalPrescriptions    int64            `json:"totalPrescriptions"`
	TotalCertificates     int64            `json:"totalCertificates"`
	AppointmentsByStatus  map[string]int64 `json:"appointmentsByStatus"`
	AppointmentsByDay     []DayStats       `json:"appointmentsByDay"`
}

// DayStats represents statistics for a single day
type DayStats struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

// DoctorStats represents statistics for a specific doctor
type DoctorStats struct {
	TotalAppointments     int64            `json:"totalAppointments"`
	TodayAppointments     int64            `json:"todayAppointments"`
	PendingAppointments   int64            `json:"pendingAppointments"`
	CompletedAppointments int64            `json:"completedAppointments"`
	TotalPrescriptions    int64            `json:"totalPrescriptions"`
	TotalCertificates     int64            `json:"totalCertificates"`
	TotalPatients         int64            `json:"totalPatients"`
	AppointmentsByDay     []DayStats       `json:"appointmentsByDay"`
}

// GetAdminDashboardStats returns statistics for admin dashboard
func (ctrl *StatsController) GetAdminDashboardStats(c *gin.Context) {
	stats := DashboardStats{
		AppointmentsByStatus: make(map[string]int64),
	}

	// Total appointments
	ctrl.db.Model(&domain.Appointment{}).Count(&stats.TotalAppointments)

	// Today's appointments
	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)
	ctrl.db.Model(&domain.Appointment{}).
		Where("start_time >= ? AND start_time < ?", today, tomorrow).
		Count(&stats.TodayAppointments)

	// Appointments by status
	ctrl.db.Model(&domain.Appointment{}).Where("status = ?", "pending").Count(&stats.PendingAppointments)
	ctrl.db.Model(&domain.Appointment{}).Where("status = ?", "completed").Count(&stats.CompletedAppointments)
	ctrl.db.Model(&domain.Appointment{}).Where("status = ?", "cancelled").Count(&stats.CancelledAppointments)

	var bookedCount int64
	ctrl.db.Model(&domain.Appointment{}).Where("status = ?", "booked").Count(&bookedCount)
	
	stats.AppointmentsByStatus["pending"] = stats.PendingAppointments
	stats.AppointmentsByStatus["booked"] = bookedCount
	stats.AppointmentsByStatus["completed"] = stats.CompletedAppointments
	stats.AppointmentsByStatus["cancelled"] = stats.CancelledAppointments

	// Total patients
	ctrl.db.Model(&domain.User{}).
		Joins("JOIN roles ON users.role_id = roles.id").
		Where("roles.name = ?", domain.RolePaciente).
		Count(&stats.TotalPatients)

	// Total doctors
	ctrl.db.Model(&domain.User{}).
		Joins("JOIN roles ON users.role_id = roles.id").
		Where("roles.name = ?", domain.RoleMedico).
		Count(&stats.TotalDoctors)

	// Total prescriptions
	ctrl.db.Model(&domain.Prescription{}).Count(&stats.TotalPrescriptions)

	// Total certificates
	ctrl.db.Model(&domain.MedicalCertificate{}).Count(&stats.TotalCertificates)

	// Appointments by day (last 7 days)
	stats.AppointmentsByDay = make([]DayStats, 7)
	for i := 6; i >= 0; i-- {
		day := time.Now().AddDate(0, 0, -i).Truncate(24 * time.Hour)
		nextDay := day.Add(24 * time.Hour)
		var count int64
		ctrl.db.Model(&domain.Appointment{}).
			Where("start_time >= ? AND start_time < ?", day, nextDay).
			Count(&count)
		stats.AppointmentsByDay[6-i] = DayStats{
			Date:  day.Format("2006-01-02"),
			Count: count,
		}
	}

	c.JSON(http.StatusOK, stats)
}

// GetDoctorStats returns statistics for a specific doctor
func (ctrl *StatsController) GetDoctorStats(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}
	doctorID, _ := userID.(int)

	stats := DoctorStats{}

	// Total appointments for this doctor
	ctrl.db.Model(&domain.Appointment{}).Where("doctor_id = ?", doctorID).Count(&stats.TotalAppointments)

	// Today's appointments
	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)
	ctrl.db.Model(&domain.Appointment{}).
		Where("doctor_id = ? AND start_time >= ? AND start_time < ?", doctorID, today, tomorrow).
		Count(&stats.TodayAppointments)

	// Appointments by status
	ctrl.db.Model(&domain.Appointment{}).Where("doctor_id = ? AND status = ?", doctorID, "pending").Count(&stats.PendingAppointments)
	ctrl.db.Model(&domain.Appointment{}).Where("doctor_id = ? AND status = ?", doctorID, "completed").Count(&stats.CompletedAppointments)

	// Total prescriptions by this doctor
	ctrl.db.Model(&domain.Prescription{}).Where("doctor_id = ?", doctorID).Count(&stats.TotalPrescriptions)

	// Total certificates by this doctor
	ctrl.db.Model(&domain.MedicalCertificate{}).Where("doctor_id = ?", doctorID).Count(&stats.TotalCertificates)

	// Unique patients
	ctrl.db.Model(&domain.Appointment{}).
		Where("doctor_id = ?", doctorID).
		Distinct("patient_id").
		Count(&stats.TotalPatients)

	// Appointments by day (last 7 days)
	stats.AppointmentsByDay = make([]DayStats, 7)
	for i := 6; i >= 0; i-- {
		day := time.Now().AddDate(0, 0, -i).Truncate(24 * time.Hour)
		nextDay := day.Add(24 * time.Hour)
		var count int64
		ctrl.db.Model(&domain.Appointment{}).
			Where("doctor_id = ? AND start_time >= ? AND start_time < ?", doctorID, day, nextDay).
			Count(&count)
		stats.AppointmentsByDay[6-i] = DayStats{
			Date:  day.Format("2006-01-02"),
			Count: count,
		}
	}

	c.JSON(http.StatusOK, stats)
}

// GetPatientStats returns statistics for a specific patient
func (ctrl *StatsController) GetPatientStats(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}
	patientID, _ := userID.(int)

	type PatientStats struct {
		TotalAppointments     int64 `json:"totalAppointments"`
		UpcomingAppointments  int64 `json:"upcomingAppointments"`
		CompletedAppointments int64 `json:"completedAppointments"`
		TotalPrescriptions    int64 `json:"totalPrescriptions"`
		TotalCertificates     int64 `json:"totalCertificates"`
	}

	stats := PatientStats{}

	// Total appointments
	ctrl.db.Model(&domain.Appointment{}).Where("patient_id = ?", patientID).Count(&stats.TotalAppointments)

	// Upcoming appointments
	ctrl.db.Model(&domain.Appointment{}).
		Where("patient_id = ? AND start_time > ? AND status IN ?", patientID, time.Now(), []string{"pending", "booked"}).
		Count(&stats.UpcomingAppointments)

	// Completed appointments
	ctrl.db.Model(&domain.Appointment{}).Where("patient_id = ? AND status = ?", patientID, "completed").Count(&stats.CompletedAppointments)

	// Total prescriptions
	ctrl.db.Model(&domain.Prescription{}).Where("patient_id = ?", patientID).Count(&stats.TotalPrescriptions)

	// Total certificates
	ctrl.db.Model(&domain.MedicalCertificate{}).Where("patient_id = ?", patientID).Count(&stats.TotalCertificates)

	c.JSON(http.StatusOK, stats)
}

// ReportByPeriod represents a detailed report for a time period
type ReportByPeriod struct {
	StartDate             string           `json:"startDate"`
	EndDate               string           `json:"endDate"`
	TotalAppointments     int64            `json:"totalAppointments"`
	CompletedAppointments int64            `json:"completedAppointments"`
	CancelledAppointments int64            `json:"cancelledAppointments"`
	CancellationRate      float64          `json:"cancellationRate"`
	TotalRevenue          float64          `json:"totalRevenue"`
	AverageRating         float64          `json:"averageRating"`
	TotalReviews          int64            `json:"totalReviews"`
	AppointmentsByDoctor  []DoctorReport   `json:"appointmentsByDoctor"`
	AppointmentsByDay     []DayStats       `json:"appointmentsByDay"`
}

// DoctorReport represents appointment stats for a doctor
type DoctorReport struct {
	DoctorID     int     `json:"doctorId"`
	DoctorName   string  `json:"doctorName"`
	Specialty    string  `json:"specialty"`
	Appointments int64   `json:"appointments"`
	Completed    int64   `json:"completed"`
	Cancelled    int64   `json:"cancelled"`
	Revenue      float64 `json:"revenue"`
	Rating       float64 `json:"rating"`
}

// GetReportByPeriod returns a detailed report for a specific time period (Admin only)
func (ctrl *StatsController) GetReportByPeriod(c *gin.Context) {
	startDateStr := c.Query("startDate")
	endDateStr := c.Query("endDate")

	if startDateStr == "" || endDateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "startDate and endDate are required (YYYY-MM-DD)"})
		return
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid startDate format"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid endDate format"})
		return
	}
	endDate = endDate.Add(24*time.Hour - time.Second) // End of day

	report := ReportByPeriod{
		StartDate: startDateStr,
		EndDate:   endDateStr,
	}

	// Total appointments in period
	ctrl.db.Model(&domain.Appointment{}).
		Where("start_time >= ? AND start_time <= ?", startDate, endDate).
		Count(&report.TotalAppointments)

	// Completed appointments
	ctrl.db.Model(&domain.Appointment{}).
		Where("start_time >= ? AND start_time <= ? AND status = ?", startDate, endDate, "completed").
		Count(&report.CompletedAppointments)

	// Cancelled appointments
	ctrl.db.Model(&domain.Appointment{}).
		Where("start_time >= ? AND start_time <= ? AND status = ?", startDate, endDate, "cancelled").
		Count(&report.CancelledAppointments)

	// Cancellation rate
	if report.TotalAppointments > 0 {
		report.CancellationRate = float64(report.CancelledAppointments) / float64(report.TotalAppointments) * 100
	}

	// Total revenue from payments
	var totalRevenue float64
	ctrl.db.Model(&domain.Payment{}).
		Where("created_at >= ? AND created_at <= ? AND status = ?", startDate, endDate, "paid").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalRevenue)
	report.TotalRevenue = totalRevenue

	// Average rating
	var avgRating float64
	ctrl.db.Model(&domain.Review{}).
		Where("created_at >= ? AND created_at <= ?", startDate, endDate).
		Select("COALESCE(AVG(rating), 0)").
		Scan(&avgRating)
	report.AverageRating = avgRating

	// Total reviews
	ctrl.db.Model(&domain.Review{}).
		Where("created_at >= ? AND created_at <= ?", startDate, endDate).
		Count(&report.TotalReviews)

	// Appointments by doctor
	var doctors []domain.User
	ctrl.db.Joins("JOIN roles ON users.role_id = roles.id").
		Where("roles.name = ?", domain.RoleMedico).
		Find(&doctors)

	for _, doctor := range doctors {
		var appointments, completed, cancelled int64
		ctrl.db.Model(&domain.Appointment{}).
			Where("doctor_id = ? AND start_time >= ? AND start_time <= ?", doctor.ID, startDate, endDate).
			Count(&appointments)
		ctrl.db.Model(&domain.Appointment{}).
			Where("doctor_id = ? AND start_time >= ? AND start_time <= ? AND status = ?", doctor.ID, startDate, endDate, "completed").
			Count(&completed)
		ctrl.db.Model(&domain.Appointment{}).
			Where("doctor_id = ? AND start_time >= ? AND start_time <= ? AND status = ?", doctor.ID, startDate, endDate, "cancelled").
			Count(&cancelled)

		var revenue float64
		ctrl.db.Model(&domain.Payment{}).
			Joins("JOIN appointments ON payments.appointment_id = appointments.id").
			Where("appointments.doctor_id = ? AND payments.created_at >= ? AND payments.created_at <= ? AND payments.status = ?", doctor.ID, startDate, endDate, "paid").
			Select("COALESCE(SUM(payments.amount), 0)").
			Scan(&revenue)

		var rating float64
		ctrl.db.Model(&domain.Review{}).
			Where("doctor_id = ? AND created_at >= ? AND created_at <= ?", doctor.ID, startDate, endDate).
			Select("COALESCE(AVG(rating), 0)").
			Scan(&rating)

		specialty := ""
		if doctor.Specialty != nil {
			specialty = *doctor.Specialty
		}

		report.AppointmentsByDoctor = append(report.AppointmentsByDoctor, DoctorReport{
			DoctorID:     doctor.ID,
			DoctorName:   doctor.FullName,
			Specialty:    specialty,
			Appointments: appointments,
			Completed:    completed,
			Cancelled:    cancelled,
			Revenue:      revenue,
			Rating:       rating,
		})
	}

	// Appointments by day
	days := int(endDate.Sub(startDate).Hours()/24) + 1
	if days > 31 {
		days = 31 // Limit to 31 days
	}
	report.AppointmentsByDay = make([]DayStats, days)
	for i := 0; i < days; i++ {
		day := startDate.AddDate(0, 0, i).Truncate(24 * time.Hour)
		nextDay := day.Add(24 * time.Hour)
		var count int64
		ctrl.db.Model(&domain.Appointment{}).
			Where("start_time >= ? AND start_time < ?", day, nextDay).
			Count(&count)
		report.AppointmentsByDay[i] = DayStats{
			Date:  day.Format("2006-01-02"),
			Count: count,
		}
	}

	c.JSON(http.StatusOK, report)
}

// GetDoctorReportByPeriod returns a detailed report for a specific doctor
func (ctrl *StatsController) GetDoctorReportByPeriod(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}
	doctorID, _ := userID.(int)

	startDateStr := c.Query("startDate")
	endDateStr := c.Query("endDate")

	if startDateStr == "" || endDateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "startDate and endDate are required (YYYY-MM-DD)"})
		return
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid startDate format"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid endDate format"})
		return
	}
	endDate = endDate.Add(24*time.Hour - time.Second)

	type DoctorPeriodReport struct {
		StartDate             string     `json:"startDate"`
		EndDate               string     `json:"endDate"`
		TotalAppointments     int64      `json:"totalAppointments"`
		CompletedAppointments int64      `json:"completedAppointments"`
		CancelledAppointments int64      `json:"cancelledAppointments"`
		CancellationRate      float64    `json:"cancellationRate"`
		TotalRevenue          float64    `json:"totalRevenue"`
		AverageRating         float64    `json:"averageRating"`
		TotalReviews          int64      `json:"totalReviews"`
		TotalPrescriptions    int64      `json:"totalPrescriptions"`
		TotalCertificates     int64      `json:"totalCertificates"`
		UniquePatients        int64      `json:"uniquePatients"`
		AppointmentsByDay     []DayStats `json:"appointmentsByDay"`
	}

	report := DoctorPeriodReport{
		StartDate: startDateStr,
		EndDate:   endDateStr,
	}

	// Total appointments
	ctrl.db.Model(&domain.Appointment{}).
		Where("doctor_id = ? AND start_time >= ? AND start_time <= ?", doctorID, startDate, endDate).
		Count(&report.TotalAppointments)

	// Completed
	ctrl.db.Model(&domain.Appointment{}).
		Where("doctor_id = ? AND start_time >= ? AND start_time <= ? AND status = ?", doctorID, startDate, endDate, "completed").
		Count(&report.CompletedAppointments)

	// Cancelled
	ctrl.db.Model(&domain.Appointment{}).
		Where("doctor_id = ? AND start_time >= ? AND start_time <= ? AND status = ?", doctorID, startDate, endDate, "cancelled").
		Count(&report.CancelledAppointments)

	// Cancellation rate
	if report.TotalAppointments > 0 {
		report.CancellationRate = float64(report.CancelledAppointments) / float64(report.TotalAppointments) * 100
	}

	// Revenue
	var revenue float64
	ctrl.db.Model(&domain.Payment{}).
		Joins("JOIN appointments ON payments.appointment_id = appointments.id").
		Where("appointments.doctor_id = ? AND payments.created_at >= ? AND payments.created_at <= ? AND payments.status = ?", doctorID, startDate, endDate, "paid").
		Select("COALESCE(SUM(payments.amount), 0)").
		Scan(&revenue)
	report.TotalRevenue = revenue

	// Rating
	var avgRating float64
	ctrl.db.Model(&domain.Review{}).
		Where("doctor_id = ? AND created_at >= ? AND created_at <= ?", doctorID, startDate, endDate).
		Select("COALESCE(AVG(rating), 0)").
		Scan(&avgRating)
	report.AverageRating = avgRating

	// Reviews count
	ctrl.db.Model(&domain.Review{}).
		Where("doctor_id = ? AND created_at >= ? AND created_at <= ?", doctorID, startDate, endDate).
		Count(&report.TotalReviews)

	// Prescriptions
	ctrl.db.Model(&domain.Prescription{}).
		Where("doctor_id = ? AND issued_at >= ? AND issued_at <= ?", doctorID, startDate, endDate).
		Count(&report.TotalPrescriptions)

	// Certificates
	ctrl.db.Model(&domain.MedicalCertificate{}).
		Where("doctor_id = ? AND issued_at >= ? AND issued_at <= ?", doctorID, startDate, endDate).
		Count(&report.TotalCertificates)

	// Unique patients
	ctrl.db.Model(&domain.Appointment{}).
		Where("doctor_id = ? AND start_time >= ? AND start_time <= ?", doctorID, startDate, endDate).
		Distinct("patient_id").
		Count(&report.UniquePatients)

	// Appointments by day
	days := int(endDate.Sub(startDate).Hours()/24) + 1
	if days > 31 {
		days = 31
	}
	report.AppointmentsByDay = make([]DayStats, days)
	for i := 0; i < days; i++ {
		day := startDate.AddDate(0, 0, i).Truncate(24 * time.Hour)
		nextDay := day.Add(24 * time.Hour)
		var count int64
		ctrl.db.Model(&domain.Appointment{}).
			Where("doctor_id = ? AND start_time >= ? AND start_time < ?", doctorID, day, nextDay).
			Count(&count)
		report.AppointmentsByDay[i] = DayStats{
			Date:  day.Format("2006-01-02"),
			Count: count,
		}
	}

	c.JSON(http.StatusOK, report)
}
