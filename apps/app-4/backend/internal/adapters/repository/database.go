package repository

import (
	"log"
	"medisync-platform/backend/internal/core/domain"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AutoMigrate runs GORM auto-migrations to create tables based on domain models.
func AutoMigrate(db *gorm.DB) {
	err := db.AutoMigrate(
		// Core entities
		&domain.Role{},
		&domain.User{},
		&domain.Appointment{},
		&domain.MedicalRecord{},
		&domain.Prescription{},
		&domain.MedicalCertificate{},
		&domain.Review{},
		&domain.Payment{},
		&domain.WaitingList{},
		&domain.ScheduleBlock{},
		// Chat system
		&domain.ChatMessage{},
		&domain.ChatConversation{},
		&domain.ChatContact{},
		&domain.FollowedClinic{},
		&domain.UserOnlineStatus{},
		// 2FA & Authentication
		&domain.VerificationCode{},
		&domain.PasswordResetToken{},
		// Notifications
		&domain.Notification{},
		// Audit
		&domain.AuditLog{},
		// Recurring Appointments
		&domain.RecurringAppointment{},
		// AI Triage
		&domain.TriageReport{},
		// Clinics
		&domain.Clinic{},
		&domain.ClinicDoctor{},
		&domain.ClinicReview{},
		// Queue System
		&domain.QueueTicket{},
		// Clinical Match System (Intelligent Matching)
		&domain.ClinicalMatch{},
		&domain.DoctorProfile{},
		// Health Intelligence Core (HIC)
		&domain.HealthProfile{},
		&domain.DailyCheckIn{},
		&domain.HealthMetric{},
		&domain.Medication{},
		&domain.MedicationLog{},
		&domain.Vaccine{},
		&domain.Exam{},
		&domain.HealthGoal{},
		&domain.Achievement{},
		// Fitness System (NOVA Integration)
		&domain.FitnessProfile{},
		&domain.WorkoutSession{},
		&domain.DailyFitnessStats{},
		&domain.NutritionLog{},
		&domain.BodyAnalysis{},
		&domain.WeeklyFitnessPlan{},
		&domain.FitnessAchievement{},
		&domain.HeartRateReading{},
	)
	if err != nil {
		log.Fatalf("Database migration failed: %v", err)
	}
	log.Println("Database migration completed successfully.")
}

// SeedDatabase inserts initial data (roles and a test admin/medico/patient).
func SeedDatabase(db *gorm.DB) {
	log.Println("Seeding database...")

	// 1. Create Roles if they don't exist
	roles := []domain.Role{
		{Name: domain.RoleAdmin},
		{Name: domain.RoleMedico},
		{Name: domain.RolePaciente},
	}
	for _, role := range roles {
		if err := db.Where(domain.Role{Name: role.Name}).FirstOrCreate(&role).Error; err != nil {
			log.Printf("Failed to create role %s: %v", role.Name, err)
		}
	}

	// 2. Create sample users if they don't exist (password: "password123")
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	testUsers := []struct {
		Email     string
		FullName  string
		RoleName  string
		Phone     string
		Specialty string
		CRM       string
	}{
		// Admin
		{Email: "admin@medisync.com", FullName: "Administrador Sistema", RoleName: domain.RoleAdmin, Phone: "(11) 99999-0001"},

		// Doctors (various specialties)
		{Email: "dr.costa@medisync.com", FullName: "Dra. Ana Costa", RoleName: domain.RoleMedico, Phone: "(11) 99999-0002", Specialty: "Cardiologia", CRM: "CRM/SP 123456"},
		{Email: "dr.silva@medisync.com", FullName: "Dr. Carlos Silva", RoleName: domain.RoleMedico, Phone: "(11) 99999-0003", Specialty: "Clínico Geral", CRM: "CRM/SP 234567"},
		{Email: "dr.santos@medisync.com", FullName: "Dra. Maria Santos", RoleName: domain.RoleMedico, Phone: "(11) 99999-0004", Specialty: "Dermatologia", CRM: "CRM/SP 345678"},
		{Email: "dr.oliveira@medisync.com", FullName: "Dr. Pedro Oliveira", RoleName: domain.RoleMedico, Phone: "(11) 99999-0005", Specialty: "Ortopedia", CRM: "CRM/SP 456789"},
		{Email: "dr.ferreira@medisync.com", FullName: "Dra. Juliana Ferreira", RoleName: domain.RoleMedico, Phone: "(11) 99999-0006", Specialty: "Pediatria", CRM: "CRM/SP 567890"},

		// Patients
		{Email: "joao.silva@email.com", FullName: "João da Silva", RoleName: domain.RolePaciente, Phone: "(11) 98888-0001"},
		{Email: "maria.souza@email.com", FullName: "Maria Souza", RoleName: domain.RolePaciente, Phone: "(11) 98888-0002"},
		{Email: "pedro.santos@email.com", FullName: "Pedro Santos", RoleName: domain.RolePaciente, Phone: "(11) 98888-0003"},
		{Email: "ana.oliveira@email.com", FullName: "Ana Oliveira", RoleName: domain.RolePaciente, Phone: "(11) 98888-0004"},
		{Email: "carlos.lima@email.com", FullName: "Carlos Lima", RoleName: domain.RolePaciente, Phone: "(11) 98888-0005"},
		{Email: "fernanda.costa@email.com", FullName: "Fernanda Costa", RoleName: domain.RolePaciente, Phone: "(11) 98888-0006"},
		{Email: "roberto.almeida@email.com", FullName: "Roberto Almeida", RoleName: domain.RolePaciente, Phone: "(11) 98888-0007"},
		{Email: "lucia.pereira@email.com", FullName: "Lúcia Pereira", RoleName: domain.RolePaciente, Phone: "(11) 98888-0008"},
	}

	for _, user := range testUsers {
		var existingUser domain.User
		if db.Where("email = ?", user.Email).First(&existingUser).RowsAffected == 0 {
			var role domain.Role
			db.Where("name = ?", user.RoleName).First(&role)

			newUser := domain.User{
				Email:        user.Email,
				FullName:     user.FullName,
				PasswordHash: string(hashedPassword),
				RoleID:       role.ID,
				IsActive:     true,
				Phone:        &user.Phone,
			}
			if user.Specialty != "" {
				newUser.Specialty = &user.Specialty
			}
			if user.CRM != "" {
				newUser.CRM = &user.CRM
			}
			db.Create(&newUser)
		}
	}

	// 3. Create sample appointments for testing
	var doctors []domain.User
	db.Joins("Role").Where("Roles.name = ?", domain.RoleMedico).Find(&doctors)

	var patients []domain.User
	db.Joins("Role").Where("Roles.name = ?", domain.RolePaciente).Find(&patients)

	if len(doctors) > 0 && len(patients) > 0 {
		// Create appointments for the next 7 days
		for dayOffset := 0; dayOffset < 7; dayOffset++ {
			baseDate := time.Now().AddDate(0, 0, dayOffset)

			for hour := 9; hour < 17; hour++ {
				// Skip lunch hour
				if hour == 12 {
					continue
				}

				appointmentTime := time.Date(baseDate.Year(), baseDate.Month(), baseDate.Day(), hour, 0, 0, 0, time.Local)

				// Check if appointment already exists for the first doctor/patient combo
				doctorIdx := hour % len(doctors)
				patientIdx := (dayOffset + hour) % len(patients)

				var existingAppt domain.Appointment
				if db.Where("doctor_id = ? AND start_time = ?", doctors[doctorIdx].ID, appointmentTime).First(&existingAppt).RowsAffected == 0 {
					// Create varied status appointments
					status := domain.StatusBooked
					if dayOffset < 0 {
						status = domain.StatusCompleted
					}

					// Only create some appointments, not all slots
					if (hour+dayOffset)%3 == 0 {
						db.Create(&domain.Appointment{
							PatientID: patients[patientIdx].ID,
							DoctorID:  doctors[doctorIdx].ID,
							StartTime: appointmentTime,
							EndTime:   appointmentTime.Add(30 * time.Minute),
							Status:    status,
						})
					}
				}
			}
		}
	}

	log.Println("Database seeding finished.")
}

// CreateIndexes adds database indexes for better query performance.
func CreateIndexes(db *gorm.DB) {
	log.Println("Creating database indexes...")

	// Appointments indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_appointments_doctor_time ON appointments(doctor_id, start_time)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_appointments_patient_time ON appointments(patient_id, start_time)")

	// Users indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)")

	// Medical Records indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_medical_records_created_at ON medical_records(created_at)")

	// Waiting List indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_waiting_list_patient_id ON waiting_lists(patient_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_waiting_list_status ON waiting_lists(status)")

	// Chat Messages indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_id ON chat_messages(receiver_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_chat_messages_read ON chat_messages(receiver_id, read)")

	// Chat Conversations indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_chat_conversations_participant1 ON chat_conversations(participant_1_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_chat_conversations_participant2 ON chat_conversations(participant_2_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_chat_conversations_participants ON chat_conversations(participant_1_id, participant_2_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message ON chat_conversations(last_message_at)")

	// Chat Contacts indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_chat_contacts_user_id ON chat_contacts(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_chat_contacts_contact_id ON chat_contacts(contact_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_chat_contacts_user_contact ON chat_contacts(user_id, contact_id)")

	// Followed Clinics indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_followed_clinics_user_id ON followed_clinics(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_followed_clinics_clinic_id ON followed_clinics(clinic_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_followed_clinics_user_clinic ON followed_clinics(user_id, clinic_id)")

	// User Online Status indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_user_online_status_online ON user_online_statuses(online)")

	// Verification Codes indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_verification_codes_user_purpose ON verification_codes(user_id, purpose)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at)")

	// Notifications indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)")

	// Prescriptions indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_prescriptions_issued_at ON prescriptions(issued_at)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_prescriptions_valid_until ON prescriptions(valid_until)")

	// Medical Certificates indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_medical_certificates_patient_id ON medical_certificates(patient_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_medical_certificates_doctor_id ON medical_certificates(doctor_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_medical_certificates_issued_at ON medical_certificates(issued_at)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_medical_certificates_type ON medical_certificates(type)")

	// Reviews indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_reviews_patient_id ON reviews(patient_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_reviews_doctor_id ON reviews(doctor_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_reviews_appointment_id ON reviews(appointment_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at)")

	// Schedule Blocks indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_schedule_blocks_doctor_id ON schedule_blocks(doctor_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_schedule_blocks_start_time ON schedule_blocks(start_time)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_schedule_blocks_end_time ON schedule_blocks(end_time)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_schedule_blocks_recurring ON schedule_blocks(recurring)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_schedule_blocks_doctor_time ON schedule_blocks(doctor_id, start_time, end_time)")

	// Audit Logs indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_type, entity_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)")

	// Recurring Appointments indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_recurring_appointments_patient_id ON recurring_appointments(patient_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_recurring_appointments_doctor_id ON recurring_appointments(doctor_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_recurring_appointments_is_active ON recurring_appointments(is_active)")

	// Triage Reports indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_triage_reports_patient_id ON triage_reports(patient_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_triage_reports_doctor_id ON triage_reports(doctor_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_triage_reports_status ON triage_reports(status)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_triage_reports_priority ON triage_reports(priority)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_triage_reports_created_at ON triage_reports(created_at)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_triage_reports_specialty ON triage_reports(recommended_specialty)")

	// Clinics indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_clinics_city ON clinics(city)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_clinics_state ON clinics(state)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_clinics_is_active ON clinics(is_active)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_clinics_is_premium ON clinics(is_premium)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_clinics_latitude ON clinics(latitude)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_clinics_longitude ON clinics(longitude)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_clinic_reviews_clinic_id ON clinic_reviews(clinic_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_clinic_reviews_patient_id ON clinic_reviews(patient_id)")

	// Queue Tickets indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_queue_tickets_patient_id ON queue_tickets(patient_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_queue_tickets_status ON queue_tickets(status)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_queue_tickets_priority_order ON queue_tickets(priority_order)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_queue_tickets_created_at ON queue_tickets(created_at)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_queue_tickets_service_type ON queue_tickets(service_type)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_queue_tickets_ticket_number ON queue_tickets(ticket_number)")

	// Health Intelligence Core indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_health_profiles_user_id ON health_profiles(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_id ON daily_check_ins(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_daily_check_ins_date ON daily_check_ins(date)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_date ON daily_check_ins(user_id, date)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id ON health_metrics(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_health_metrics_type ON health_metrics(type)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_health_metrics_date ON health_metrics(date)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_health_metrics_user_type_date ON health_metrics(user_id, type, date)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_medications_is_active ON medications(is_active)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_id ON medication_logs(medication_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON medication_logs(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_vaccines_user_id ON vaccines(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_exams_user_id ON exams(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_health_goals_user_id ON health_goals(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_health_goals_status ON health_goals(status)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id)")

	// Fitness System indexes (NOVA Integration)
	db.Exec("CREATE INDEX IF NOT EXISTS idx_fitness_profiles_user_id ON fitness_profiles(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, date)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_daily_fitness_stats_user_id ON daily_fitness_stats(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_daily_fitness_stats_date ON daily_fitness_stats(date)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_daily_fitness_stats_user_date ON daily_fitness_stats(user_id, date)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_id ON nutrition_logs(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_nutrition_logs_date ON nutrition_logs(date)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_body_analyses_user_id ON body_analyses(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_weekly_fitness_plans_user_id ON weekly_fitness_plans(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_weekly_fitness_plans_is_active ON weekly_fitness_plans(is_active)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_fitness_achievements_user_id ON fitness_achievements(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_heart_rate_readings_user_id ON heart_rate_readings(user_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_heart_rate_readings_timestamp ON heart_rate_readings(timestamp)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_heart_rate_readings_session_id ON heart_rate_readings(session_id)")

	log.Println("Database indexes created successfully.")
}
