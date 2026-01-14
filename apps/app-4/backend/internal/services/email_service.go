package services

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"net/smtp"
	"os"
	"time"
)

// EmailService handles sending emails
type EmailService struct {
	host     string
	port     string
	username string
	password string
	from     string
	enabled  bool
}

// NewEmailService creates a new email service instance
func NewEmailService() *EmailService {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	username := os.Getenv("SMTP_USERNAME")
	password := os.Getenv("SMTP_PASSWORD")
	from := os.Getenv("SMTP_FROM")

	enabled := host != "" && port != "" && username != "" && password != ""

	if !enabled {
		log.Println("📧 Email service disabled (SMTP not configured)")
	} else {
		log.Printf("📧 Email service enabled: %s:%s", host, port)
	}

	return &EmailService{
		host:     host,
		port:     port,
		username: username,
		password: password,
		from:     from,
		enabled:  enabled,
	}
}

// IsEnabled returns whether email service is configured
func (s *EmailService) IsEnabled() bool {
	return s.enabled
}

// SendEmail sends a generic email
func (s *EmailService) SendEmail(to, subject, htmlBody string) error {
	if !s.enabled {
		log.Printf("📧 Email not sent (disabled): to=%s, subject=%s", to, subject)
		return nil
	}

	auth := smtp.PlainAuth("", s.username, s.password, s.host)

	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\n%s\r\n%s", to, subject, mime, htmlBody))

	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	err := smtp.SendMail(addr, auth, s.from, []string{to}, msg)
	if err != nil {
		log.Printf("📧 Failed to send email: %v", err)
		return err
	}

	log.Printf("📧 Email sent successfully to: %s", to)
	return nil
}

// AppointmentEmailData contains data for appointment emails
type AppointmentEmailData struct {
	PatientName string
	DoctorName  string
	Date        string
	Time        string
	Status      string
}

// SendAppointmentConfirmation sends appointment confirmation email
func (s *EmailService) SendAppointmentConfirmation(to string, data AppointmentEmailData) error {
	subject := "MediSync - Consulta Agendada"

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        h1 { margin: 0; }
        .highlight { color: #2563eb; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MediSync</h1>
            <p>Sistema de Telemedicina</p>
        </div>
        <div class="content">
            <h2>Olá, {{.PatientName}}!</h2>
            <p>Sua consulta foi agendada com sucesso.</p>
            
            <div class="info-box">
                <p><strong>Médico:</strong> <span class="highlight">{{.DoctorName}}</span></p>
                <p><strong>Data:</strong> {{.Date}}</p>
                <p><strong>Horário:</strong> {{.Time}}</p>
                <p><strong>Status:</strong> {{.Status}}</p>
            </div>
            
            <p>Acesse o sistema MediSync para mais detalhes ou para iniciar sua videochamada no horário agendado.</p>
            
            <p>Atenciosamente,<br>Equipe MediSync</p>
        </div>
        <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>© 2024 MediSync - Sistema de Telemedicina</p>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("appointment").Parse(tmpl)
	if err != nil {
		return err
	}

	var body bytes.Buffer
	if err := t.Execute(&body, data); err != nil {
		return err
	}

	return s.SendEmail(to, subject, body.String())
}

// SendAppointmentReminder sends appointment reminder email
func (s *EmailService) SendAppointmentReminder(to string, data AppointmentEmailData) error {
	subject := "MediSync - Lembrete de Consulta"

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        h1 { margin: 0; }
        .highlight { color: #f59e0b; font-weight: bold; }
        .alert { background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Lembrete</h1>
            <p>Sua consulta está chegando!</p>
        </div>
        <div class="content">
            <h2>Olá, {{.PatientName}}!</h2>
            
            <div class="alert">
                <strong>Sua consulta é HOJE!</strong>
            </div>
            
            <div class="info-box">
                <p><strong>Médico:</strong> <span class="highlight">{{.DoctorName}}</span></p>
                <p><strong>Data:</strong> {{.Date}}</p>
                <p><strong>Horário:</strong> {{.Time}}</p>
            </div>
            
            <p>Não se esqueça de acessar o sistema MediSync alguns minutos antes do horário agendado.</p>
            
            <p>Atenciosamente,<br>Equipe MediSync</p>
        </div>
        <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>© 2024 MediSync - Sistema de Telemedicina</p>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("reminder").Parse(tmpl)
	if err != nil {
		return err
	}

	var body bytes.Buffer
	if err := t.Execute(&body, data); err != nil {
		return err
	}

	return s.SendEmail(to, subject, body.String())
}

// SendAppointmentCancellation sends appointment cancellation email
func (s *EmailService) SendAppointmentCancellation(to string, data AppointmentEmailData) error {
	subject := "MediSync - Consulta Cancelada"

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        h1 { margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Consulta Cancelada</h1>
        </div>
        <div class="content">
            <h2>Olá, {{.PatientName}}!</h2>
            <p>Informamos que sua consulta foi cancelada.</p>
            
            <div class="info-box">
                <p><strong>Médico:</strong> {{.DoctorName}}</p>
                <p><strong>Data:</strong> {{.Date}}</p>
                <p><strong>Horário:</strong> {{.Time}}</p>
            </div>
            
            <p>Você pode agendar uma nova consulta através do sistema MediSync.</p>
            
            <p>Atenciosamente,<br>Equipe MediSync</p>
        </div>
        <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>© 2024 MediSync - Sistema de Telemedicina</p>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("cancellation").Parse(tmpl)
	if err != nil {
		return err
	}

	var body bytes.Buffer
	if err := t.Execute(&body, data); err != nil {
		return err
	}

	return s.SendEmail(to, subject, body.String())
}

// SendNewAppointmentNotificationToDoctor sends notification to doctor about new appointment
func (s *EmailService) SendNewAppointmentNotificationToDoctor(to string, data AppointmentEmailData) error {
	subject := "MediSync - Nova Consulta Agendada"

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        h1 { margin: 0; }
        .highlight { color: #10b981; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Nova Consulta</h1>
            <p>Um paciente agendou uma consulta</p>
        </div>
        <div class="content">
            <h2>Olá, Dr(a). {{.DoctorName}}!</h2>
            <p>Uma nova consulta foi agendada na sua agenda.</p>
            
            <div class="info-box">
                <p><strong>Paciente:</strong> <span class="highlight">{{.PatientName}}</span></p>
                <p><strong>Data:</strong> {{.Date}}</p>
                <p><strong>Horário:</strong> {{.Time}}</p>
            </div>
            
            <p>Acesse o sistema MediSync para ver mais detalhes.</p>
            
            <p>Atenciosamente,<br>Equipe MediSync</p>
        </div>
        <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>© 2024 MediSync - Sistema de Telemedicina</p>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("doctorNotification").Parse(tmpl)
	if err != nil {
		return err
	}

	var body bytes.Buffer
	if err := t.Execute(&body, data); err != nil {
		return err
	}

	return s.SendEmail(to, subject, body.String())
}

// SendAppointmentCompletedEmail sends notification when appointment is completed
func (s *EmailService) SendAppointmentCompletedEmail(to string, data AppointmentEmailData) error {
	subject := "MediSync - Consulta Concluída"

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        h1 { margin: 0; }
        .cta { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✓ Consulta Concluída</h1>
        </div>
        <div class="content">
            <h2>Olá, {{.PatientName}}!</h2>
            <p>Sua consulta foi concluída com sucesso.</p>
            
            <div class="info-box">
                <p><strong>Médico:</strong> {{.DoctorName}}</p>
                <p><strong>Data:</strong> {{.Date}}</p>
                <p><strong>Horário:</strong> {{.Time}}</p>
            </div>
            
            <p>Não se esqueça de avaliar sua experiência! Sua opinião é muito importante para nós.</p>
            
            <p>Atenciosamente,<br>Equipe MediSync</p>
        </div>
        <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>© 2024 MediSync - Sistema de Telemedicina</p>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("completed").Parse(tmpl)
	if err != nil {
		return err
	}

	var body bytes.Buffer
	if err := t.Execute(&body, data); err != nil {
		return err
	}

	return s.SendEmail(to, subject, body.String())
}

// FormatAppointmentTime formats appointment time for emails
func FormatAppointmentTime(t time.Time) (date string, timeStr string) {
	date = t.Format("02/01/2006")
	timeStr = t.Format("15:04")
	return
}
