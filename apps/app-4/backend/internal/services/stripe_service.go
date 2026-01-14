package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

// StripeService gerencia pagamentos via Stripe
type StripeService struct {
	secretKey     string
	webhookSecret string
	priceInCents  int64
	isTestMode    bool
}

// StripePaymentIntent representa um Payment Intent do Stripe
type StripePaymentIntent struct {
	ID            string `json:"id"`
	Amount        int64  `json:"amount"`
	Currency      string `json:"currency"`
	Status        string `json:"status"`
	ClientSecret  string `json:"client_secret"`
	PaymentMethod string `json:"payment_method,omitempty"`
	Created       int64  `json:"created"`
}

// StripeCustomer representa um cliente no Stripe
type StripeCustomer struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

// StripeWebhookEvent representa um evento de webhook
type StripeWebhookEvent struct {
	ID      string          `json:"id"`
	Type    string          `json:"type"`
	Created int64           `json:"created"`
	Data    json.RawMessage `json:"data"`
}

// PaymentResult resultado do processamento de pagamento
type PaymentResult struct {
	Success       bool   `json:"success"`
	PaymentID     string `json:"payment_id"`
	Status        string `json:"status"`
	ClientSecret  string `json:"client_secret,omitempty"`
	ErrorMessage  string `json:"error_message,omitempty"`
	ReceiptURL    string `json:"receipt_url,omitempty"`
}

// NewStripeService cria uma nova instância do serviço Stripe
func NewStripeService() *StripeService {
	secretKey := os.Getenv("STRIPE_SECRET_KEY")
	webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	
	// Verificar se está em modo teste
	isTestMode := strings.HasPrefix(secretKey, "sk_test_")
	
	// Valor padrão da consulta: R$ 150,00 = 15000 centavos
	priceInCents := int64(15000)
	if priceStr := os.Getenv("CONSULT_PRICE_CENTS"); priceStr != "" {
		fmt.Sscanf(priceStr, "%d", &priceInCents)
	}

	return &StripeService{
		secretKey:     secretKey,
		webhookSecret: webhookSecret,
		priceInCents:  priceInCents,
		isTestMode:    isTestMode,
	}
}

// IsConfigured verifica se o Stripe está configurado
func (s *StripeService) IsConfigured() bool {
	return s.secretKey != ""
}

// IsTestMode verifica se está em modo teste
func (s *StripeService) IsTestMode() bool {
	return s.isTestMode
}

// GetConsultPrice retorna o preço da consulta em centavos
func (s *StripeService) GetConsultPrice() int64 {
	return s.priceInCents
}

// CreatePaymentIntent cria um Payment Intent para uma consulta
func (s *StripeService) CreatePaymentIntent(appointmentID uint, patientEmail string, description string) (*PaymentResult, error) {
	if !s.IsConfigured() {
		// Modo simulação
		return s.simulatePayment(appointmentID, description)
	}

	// Criar Payment Intent via API do Stripe
	payload := fmt.Sprintf(
		"amount=%d&currency=brl&description=%s&receipt_email=%s&metadata[appointment_id]=%d",
		s.priceInCents,
		description,
		patientEmail,
		appointmentID,
	)

	req, err := http.NewRequest("POST", "https://api.stripe.com/v1/payment_intents", strings.NewReader(payload))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+s.secretKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var intent StripePaymentIntent
	if err := json.NewDecoder(resp.Body).Decode(&intent); err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return &PaymentResult{
			Success:      false,
			ErrorMessage: "Erro ao criar pagamento",
		}, nil
	}

	return &PaymentResult{
		Success:      true,
		PaymentID:    intent.ID,
		Status:       intent.Status,
		ClientSecret: intent.ClientSecret,
	}, nil
}

// ConfirmPayment confirma um pagamento
func (s *StripeService) ConfirmPayment(paymentIntentID string, paymentMethodID string) (*PaymentResult, error) {
	if !s.IsConfigured() {
		return &PaymentResult{
			Success:   true,
			PaymentID: paymentIntentID,
			Status:    "succeeded",
		}, nil
	}

	payload := fmt.Sprintf("payment_method=%s", paymentMethodID)

	url := fmt.Sprintf("https://api.stripe.com/v1/payment_intents/%s/confirm", paymentIntentID)
	req, err := http.NewRequest("POST", url, strings.NewReader(payload))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+s.secretKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var intent StripePaymentIntent
	if err := json.NewDecoder(resp.Body).Decode(&intent); err != nil {
		return nil, err
	}

	return &PaymentResult{
		Success:   intent.Status == "succeeded",
		PaymentID: intent.ID,
		Status:    intent.Status,
	}, nil
}

// GetPaymentIntent busca um Payment Intent
func (s *StripeService) GetPaymentIntent(paymentIntentID string) (*StripePaymentIntent, error) {
	if !s.IsConfigured() {
		return &StripePaymentIntent{
			ID:       paymentIntentID,
			Amount:   s.priceInCents,
			Currency: "brl",
			Status:   "succeeded",
		}, nil
	}

	url := fmt.Sprintf("https://api.stripe.com/v1/payment_intents/%s", paymentIntentID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+s.secretKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var intent StripePaymentIntent
	if err := json.NewDecoder(resp.Body).Decode(&intent); err != nil {
		return nil, err
	}

	return &intent, nil
}

// RefundPayment processa reembolso
func (s *StripeService) RefundPayment(paymentIntentID string, reason string) (*PaymentResult, error) {
	if !s.IsConfigured() {
		return &PaymentResult{
			Success:   true,
			PaymentID: paymentIntentID,
			Status:    "refunded",
		}, nil
	}

	payload := fmt.Sprintf("payment_intent=%s&reason=%s", paymentIntentID, reason)

	req, err := http.NewRequest("POST", "https://api.stripe.com/v1/refunds", strings.NewReader(payload))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+s.secretKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return &PaymentResult{
			Success:      false,
			ErrorMessage: "Erro ao processar reembolso",
		}, nil
	}

	return &PaymentResult{
		Success:   true,
		PaymentID: paymentIntentID,
		Status:    "refunded",
	}, nil
}

// CreateCustomer cria um cliente no Stripe
func (s *StripeService) CreateCustomer(email, name string) (*StripeCustomer, error) {
	if !s.IsConfigured() {
		return &StripeCustomer{
			ID:    fmt.Sprintf("cus_simulated_%d", time.Now().Unix()),
			Email: email,
			Name:  name,
		}, nil
	}

	payload := fmt.Sprintf("email=%s&name=%s", email, name)

	req, err := http.NewRequest("POST", "https://api.stripe.com/v1/customers", strings.NewReader(payload))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+s.secretKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var customer StripeCustomer
	if err := json.NewDecoder(resp.Body).Decode(&customer); err != nil {
		return nil, err
	}

	return &customer, nil
}

// HandleWebhook processa eventos de webhook do Stripe
func (s *StripeService) HandleWebhook(payload []byte, signature string) (*StripeWebhookEvent, error) {
	// Em produção, verificar assinatura do webhook
	if s.webhookSecret != "" && signature != "" {
		// Verificação de assinatura (simplificada)
		// Em produção, usar stripe.ConstructEvent
	}

	var event StripeWebhookEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		return nil, err
	}

	return &event, nil
}

// ProcessWebhookEvent processa um evento específico
func (s *StripeService) ProcessWebhookEvent(event *StripeWebhookEvent) error {
	switch event.Type {
	case "payment_intent.succeeded":
		// Pagamento confirmado
		return s.handlePaymentSucceeded(event)
	case "payment_intent.payment_failed":
		// Pagamento falhou
		return s.handlePaymentFailed(event)
	case "charge.refunded":
		// Reembolso processado
		return s.handleRefund(event)
	default:
		// Evento não tratado
		return nil
	}
}

func (s *StripeService) handlePaymentSucceeded(event *StripeWebhookEvent) error {
	// Extrair dados do evento e atualizar status do pagamento no banco
	// Implementação depende da estrutura do banco de dados
	return nil
}

func (s *StripeService) handlePaymentFailed(event *StripeWebhookEvent) error {
	// Notificar usuário sobre falha no pagamento
	return nil
}

func (s *StripeService) handleRefund(event *StripeWebhookEvent) error {
	// Atualizar status do pagamento para reembolsado
	return nil
}

// simulatePayment simula um pagamento quando Stripe não está configurado
func (s *StripeService) simulatePayment(appointmentID uint, description string) (*PaymentResult, error) {
	// Simular processamento
	time.Sleep(500 * time.Millisecond)

	// 95% de sucesso em simulação
	if time.Now().UnixNano()%100 < 95 {
		return &PaymentResult{
			Success:      true,
			PaymentID:    fmt.Sprintf("pi_simulated_%d_%d", appointmentID, time.Now().Unix()),
			Status:       "succeeded",
			ClientSecret: fmt.Sprintf("pi_simulated_%d_secret_%d", appointmentID, time.Now().Unix()),
		}, nil
	}

	return &PaymentResult{
		Success:      false,
		ErrorMessage: "Pagamento recusado (simulação)",
		Status:       "failed",
	}, nil
}

// ValidateCard valida dados básicos do cartão (client-side validation)
func ValidateCard(number, expiry, cvc string) error {
	// Remover espaços
	number = strings.ReplaceAll(number, " ", "")
	
	// Validar número do cartão (Luhn algorithm simplificado)
	if len(number) < 13 || len(number) > 19 {
		return errors.New("número do cartão inválido")
	}

	// Validar expiração
	if len(expiry) != 5 || expiry[2] != '/' {
		return errors.New("data de expiração inválida")
	}

	// Validar CVV
	if len(cvc) < 3 || len(cvc) > 4 {
		return errors.New("CVV inválido")
	}

	return nil
}

// GetCardBrand detecta a bandeira do cartão
func GetCardBrand(number string) string {
	number = strings.ReplaceAll(number, " ", "")
	
	if len(number) < 2 {
		return "unknown"
	}

	switch {
	case strings.HasPrefix(number, "4"):
		return "visa"
	case strings.HasPrefix(number, "5"):
		return "mastercard"
	case strings.HasPrefix(number, "34") || strings.HasPrefix(number, "37"):
		return "amex"
	case strings.HasPrefix(number, "6011") || strings.HasPrefix(number, "65"):
		return "discover"
	case strings.HasPrefix(number, "36") || strings.HasPrefix(number, "38"):
		return "diners"
	default:
		return "unknown"
	}
}
