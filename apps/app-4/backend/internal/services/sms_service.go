package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

// SMSService gerencia envio de SMS
type SMSService struct {
	provider    string
	accountSID  string
	authToken   string
	fromNumber  string
	isConfigured bool
}

// SMSMessage representa uma mensagem SMS
type SMSMessage struct {
	To      string `json:"to"`
	Body    string `json:"body"`
	From    string `json:"from,omitempty"`
}

// SMSResult resultado do envio
type SMSResult struct {
	Success   bool   `json:"success"`
	MessageID string `json:"message_id,omitempty"`
	Error     string `json:"error,omitempty"`
}

// NewSMSService cria uma nova instância do serviço SMS
func NewSMSService() *SMSService {
	provider := os.Getenv("SMS_PROVIDER") // twilio, vonage, aws_sns
	
	service := &SMSService{
		provider:    provider,
		accountSID:  os.Getenv("TWILIO_ACCOUNT_SID"),
		authToken:   os.Getenv("TWILIO_AUTH_TOKEN"),
		fromNumber:  os.Getenv("SMS_FROM_NUMBER"),
	}
	
	service.isConfigured = service.accountSID != "" && service.authToken != ""
	
	return service
}

// IsConfigured verifica se o serviço está configurado
func (s *SMSService) IsConfigured() bool {
	return s.isConfigured
}

// Send envia um SMS
func (s *SMSService) Send(to, body string) (*SMSResult, error) {
	if !s.isConfigured {
		// Modo simulação
		return s.simulateSend(to, body)
	}

	switch s.provider {
	case "twilio":
		return s.sendViaTwilio(to, body)
	case "vonage":
		return s.sendViaVonage(to, body)
	default:
		return s.sendViaTwilio(to, body)
	}
}

// sendViaTwilio envia SMS via Twilio
func (s *SMSService) sendViaTwilio(to, body string) (*SMSResult, error) {
	twilioURL := fmt.Sprintf(
		"https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json",
		s.accountSID,
	)

	data := url.Values{}
	data.Set("To", formatPhoneNumber(to))
	data.Set("From", s.fromNumber)
	data.Set("Body", body)

	req, err := http.NewRequest("POST", twilioURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}

	req.SetBasicAuth(s.accountSID, s.authToken)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		errMsg := "Erro ao enviar SMS"
		if msg, ok := result["message"].(string); ok {
			errMsg = msg
		}
		return &SMSResult{Success: false, Error: errMsg}, nil
	}

	messageID := ""
	if sid, ok := result["sid"].(string); ok {
		messageID = sid
	}

	return &SMSResult{
		Success:   true,
		MessageID: messageID,
	}, nil
}

// sendViaVonage envia SMS via Vonage (Nexmo)
func (s *SMSService) sendViaVonage(to, body string) (*SMSResult, error) {
	// Implementação similar ao Twilio
	// Por enquanto, usar simulação
	return s.simulateSend(to, body)
}

// simulateSend simula envio de SMS
func (s *SMSService) simulateSend(to, body string) (*SMSResult, error) {
	// Log para desenvolvimento
	fmt.Printf("[SMS SIMULADO] Para: %s\nMensagem: %s\n", to, body)
	
	return &SMSResult{
		Success:   true,
		MessageID: fmt.Sprintf("sim_%d", time.Now().UnixNano()),
	}, nil
}

// SendAppointmentReminder envia lembrete de consulta
func (s *SMSService) SendAppointmentReminder(phone, patientName, doctorName string, appointmentTime time.Time) error {
	body := fmt.Sprintf(
		"Olá %s! Lembrete: Você tem consulta com %s amanhã às %s. MediSync",
		patientName,
		doctorName,
		appointmentTime.Format("15:04"),
	)

	result, err := s.Send(phone, body)
	if err != nil {
		return err
	}

	if !result.Success {
		return errors.New(result.Error)
	}

	return nil
}

// SendAppointmentConfirmation envia confirmação de agendamento
func (s *SMSService) SendAppointmentConfirmation(phone, patientName, doctorName string, appointmentTime time.Time) error {
	body := fmt.Sprintf(
		"Olá %s! Sua consulta com %s foi confirmada para %s às %s. MediSync",
		patientName,
		doctorName,
		appointmentTime.Format("02/01"),
		appointmentTime.Format("15:04"),
	)

	result, err := s.Send(phone, body)
	if err != nil {
		return err
	}

	if !result.Success {
		return errors.New(result.Error)
	}

	return nil
}

// SendAppointmentCancellation envia notificação de cancelamento
func (s *SMSService) SendAppointmentCancellation(phone, patientName, doctorName string, appointmentTime time.Time) error {
	body := fmt.Sprintf(
		"Olá %s! Sua consulta com %s em %s às %s foi cancelada. MediSync",
		patientName,
		doctorName,
		appointmentTime.Format("02/01"),
		appointmentTime.Format("15:04"),
	)

	result, err := s.Send(phone, body)
	if err != nil {
		return err
	}

	if !result.Success {
		return errors.New(result.Error)
	}

	return nil
}

// SendVerificationCode envia código de verificação (2FA)
func (s *SMSService) SendVerificationCode(phone, code string) error {
	body := fmt.Sprintf(
		"Seu código de verificação MediSync é: %s. Válido por 5 minutos.",
		code,
	)

	result, err := s.Send(phone, body)
	if err != nil {
		return err
	}

	if !result.Success {
		return errors.New(result.Error)
	}

	return nil
}

// formatPhoneNumber formata número de telefone para padrão internacional
func formatPhoneNumber(phone string) string {
	// Remover caracteres não numéricos
	cleaned := ""
	for _, c := range phone {
		if c >= '0' && c <= '9' {
			cleaned += string(c)
		}
	}

	// Se não começar com código do país, adicionar +55 (Brasil)
	if len(cleaned) == 11 || len(cleaned) == 10 {
		cleaned = "55" + cleaned
	}

	// Adicionar + se não tiver
	if !strings.HasPrefix(cleaned, "+") {
		cleaned = "+" + cleaned
	}

	return cleaned
}

// ValidatePhoneNumber valida número de telefone brasileiro
func ValidatePhoneNumber(phone string) bool {
	cleaned := ""
	for _, c := range phone {
		if c >= '0' && c <= '9' {
			cleaned += string(c)
		}
	}

	// Telefone brasileiro: 10 ou 11 dígitos (com DDD)
	return len(cleaned) >= 10 && len(cleaned) <= 13
}
