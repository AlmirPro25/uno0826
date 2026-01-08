package billing

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"prost-qs/backend/pkg/resilience"
)

// ========================================
// STRIPE SERVICE - EXTERNAL EXECUTOR
// "Stripe é executor. Ledger é verdade."
// ========================================

// StripeService abstrai a comunicação com o Stripe
// Em produção, isso usará a SDK oficial do Stripe
type StripeService struct {
	secretKey      string
	webhookSecret  string
	isTestMode     bool
	circuitBreaker *resilience.CircuitBreaker
	retryPolicy    *resilience.RetryPolicy
}

// NewStripeService cria uma nova instância do serviço Stripe
func NewStripeService() *StripeService {
	secretKey := os.Getenv("STRIPE_SECRET_KEY")
	webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")

	isTestMode := true
	if secretKey != "" && len(secretKey) > 3 && secretKey[:3] == "sk_live" {
		isTestMode = false
	}

	return &StripeService{
		secretKey:      secretKey,
		webhookSecret:  webhookSecret,
		isTestMode:     isTestMode,
		circuitBreaker: resilience.GetCircuitBreaker("stripe"),
		retryPolicy:    resilience.DefaultRetryPolicy(),
	}
}

// executeWithResilience executa operação com retry + circuit breaker
func (s *StripeService) executeWithResilience(ctx context.Context, operation func() error) error {
	return s.circuitBreaker.Execute(func() error {
		result := resilience.ExecuteWithRetry(ctx, s.retryPolicy, operation)
		if !result.Success {
			log.Printf("[Stripe] Operação falhou após %d tentativas: %v", result.Attempts, result.LastErr)
			return result.LastErr
		}
		return nil
	})
}

// GetCircuitState retorna estado do circuit breaker
func (s *StripeService) GetCircuitState() string {
	return s.circuitBreaker.State().String()
}

// GetCircuitStats retorna estatísticas do circuit breaker
func (s *StripeService) GetCircuitStats() resilience.CircuitStats {
	return s.circuitBreaker.Stats()
}

// IsConfigured verifica se o Stripe está configurado
func (s *StripeService) IsConfigured() bool {
	return s.secretKey != ""
}

// ========================================
// CUSTOMER
// ========================================

// CreateCustomer cria um customer no Stripe
func (s *StripeService) CreateCustomer(ctx context.Context, email, phone, metadata string) (string, error) {
	if !s.IsConfigured() {
		// Mock mode - retorna ID fake para desenvolvimento
		return fmt.Sprintf("cus_mock_%d", time.Now().UnixNano()), nil
	}

	var customerID string
	err := s.executeWithResilience(ctx, func() error {
		// TODO: Implementar com Stripe SDK
		// stripe.Customer.Create(&stripe.CustomerParams{
		//     Email: stripe.String(email),
		//     Phone: stripe.String(phone),
		//     Metadata: map[string]string{"user_id": metadata},
		// })
		customerID = fmt.Sprintf("cus_mock_%d", time.Now().UnixNano())
		return nil
	})

	if err != nil {
		return "", fmt.Errorf("falha ao criar customer: %w", err)
	}

	return customerID, nil
}

// ========================================
// PAYMENT INTENT
// ========================================

// CreatePaymentIntent cria um PaymentIntent no Stripe
func (s *StripeService) CreatePaymentIntent(ctx context.Context, amount int64, currency, customerID, description string) (string, error) {
	if !s.IsConfigured() {
		// Mock mode
		return fmt.Sprintf("pi_mock_%d", time.Now().UnixNano()), nil
	}

	var intentID string
	err := s.executeWithResilience(ctx, func() error {
		// TODO: Implementar com Stripe SDK
		// stripe.PaymentIntent.Create(&stripe.PaymentIntentParams{
		//     Amount:   stripe.Int64(amount),
		//     Currency: stripe.String(currency),
		//     Customer: stripe.String(customerID),
		//     Description: stripe.String(description),
		//     AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
		//         Enabled: stripe.Bool(true),
		//     },
		// })
		intentID = fmt.Sprintf("pi_mock_%d", time.Now().UnixNano())
		return nil
	})

	if err != nil {
		return "", fmt.Errorf("falha ao criar payment intent: %w", err)
	}

	return intentID, nil
}

// GetPaymentIntent busca um PaymentIntent no Stripe
func (s *StripeService) GetPaymentIntent(ctx context.Context, intentID string) (string, int64, error) {
	if !s.IsConfigured() {
		return "succeeded", 1000, nil // Mock
	}

	var status string
	var amount int64

	err := s.executeWithResilience(ctx, func() error {
		// TODO: Implementar com Stripe SDK
		status = "succeeded"
		amount = 1000
		return nil
	})

	if err != nil {
		return "", 0, fmt.Errorf("falha ao buscar payment intent: %w", err)
	}

	return status, amount, nil
}

// ========================================
// SUBSCRIPTION
// ========================================

// CreateSubscription cria uma subscription no Stripe
func (s *StripeService) CreateSubscription(ctx context.Context, customerID, priceID string) (string, time.Time, error) {
	if !s.IsConfigured() {
		// Mock mode
		periodEnd := time.Now().AddDate(0, 1, 0) // +1 mês
		return fmt.Sprintf("sub_mock_%d", time.Now().UnixNano()), periodEnd, nil
	}

	var subID string
	var periodEnd time.Time

	err := s.executeWithResilience(ctx, func() error {
		// TODO: Implementar com Stripe SDK
		// stripe.Subscription.Create(&stripe.SubscriptionParams{
		//     Customer: stripe.String(customerID),
		//     Items: []*stripe.SubscriptionItemsParams{
		//         {Price: stripe.String(priceID)},
		//     },
		// })
		subID = fmt.Sprintf("sub_mock_%d", time.Now().UnixNano())
		periodEnd = time.Now().AddDate(0, 1, 0)
		return nil
	})

	if err != nil {
		return "", time.Time{}, fmt.Errorf("falha ao criar subscription: %w", err)
	}

	return subID, periodEnd, nil
}

// CancelSubscription cancela uma subscription no Stripe
func (s *StripeService) CancelSubscription(ctx context.Context, subscriptionID string) error {
	if !s.IsConfigured() {
		return nil // Mock
	}

	return s.executeWithResilience(ctx, func() error {
		// TODO: Implementar com Stripe SDK
		// stripe.Subscription.Cancel(subscriptionID, nil)
		return nil
	})
}

// ========================================
// CHECKOUT SESSION
// ========================================

// CreateCheckoutSession cria uma sessão de checkout do Stripe
// accountID é usado como client_reference_id para resolução determinística no webhook
func (s *StripeService) CreateCheckoutSession(ctx context.Context, customerID, accountID, successURL, cancelURL string) (string, string, error) {
	if !s.IsConfigured() {
		// Mock mode
		mockURL := "https://checkout.stripe.com/mock_session"
		return mockURL, fmt.Sprintf("cs_mock_%d", time.Now().UnixNano()), nil
	}

	// Usar Stripe SDK real
	stripe.Key = s.secretKey

	// Price ID do produto PROST-QS Pro
	priceID := "price_1SnMCgInQBs0OE9Df5OVQD5i"

	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(successURL + "?session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:  stripe.String(cancelURL),
		// CRÍTICO: client_reference_id permite resolução determinística no webhook
		ClientReferenceID: stripe.String(accountID),
	}

	// Se tiver customer ID válido (não mock), usar
	if customerID != "" && !strings.HasPrefix(customerID, "cus_mock_") {
		params.Customer = stripe.String(customerID)
	}

	sess, err := session.New(params)
	if err != nil {
		return "", "", fmt.Errorf("erro ao criar checkout session: %w", err)
	}

	log.Printf("📦 [STRIPE] Checkout session criada: session=%s account=%s customer=%s", 
		sess.ID, accountID, customerID)

	return sess.URL, sess.ID, nil
}

// ========================================
// PAYOUT
// ========================================

// CreatePayout cria um payout no Stripe
func (s *StripeService) CreatePayout(ctx context.Context, amount int64, currency, destination string) (string, error) {
	if !s.IsConfigured() {
		return fmt.Sprintf("po_mock_%d", time.Now().UnixNano()), nil
	}

	var payoutID string
	err := s.executeWithResilience(ctx, func() error {
		// TODO: Implementar com Stripe SDK
		// stripe.Payout.Create(&stripe.PayoutParams{
		//     Amount:   stripe.Int64(amount),
		//     Currency: stripe.String(currency),
		// })
		payoutID = fmt.Sprintf("po_mock_%d", time.Now().UnixNano())
		return nil
	})

	if err != nil {
		return "", fmt.Errorf("falha ao criar payout: %w", err)
	}

	return payoutID, nil
}

// ========================================
// WEBHOOK
// ========================================

// WebhookEvent representa um evento do webhook do Stripe
type WebhookEvent struct {
	ID      string                 `json:"id"`
	Type    string                 `json:"type"`
	Created int64                  `json:"created"`
	Data    WebhookEventData       `json:"data"`
	Raw     []byte                 `json:"-"` // Payload original
}

// WebhookEventData contém o objeto do evento
type WebhookEventData struct {
	Object map[string]interface{} `json:"object"`
}

var (
	ErrInvalidSignature    = errors.New("invalid webhook signature")
	ErrSignatureExpired    = errors.New("webhook signature expired")
	ErrMissingSignature    = errors.New("missing stripe signature header")
	ErrInvalidPayload      = errors.New("invalid webhook payload")
)

const (
	// Tolerância de tempo para assinatura (5 minutos)
	WebhookTimestampTolerance = 5 * time.Minute
)

// ValidateWebhook valida a assinatura do webhook usando HMAC-SHA256
// Implementação conforme documentação Stripe: https://stripe.com/docs/webhooks/signatures
func (s *StripeService) ValidateWebhook(payload []byte, signatureHeader string) (*WebhookEvent, error) {
	// Mock mode - aceita qualquer payload para desenvolvimento
	if !s.IsConfigured() || s.webhookSecret == "" {
		var event WebhookEvent
		if err := json.Unmarshal(payload, &event); err != nil {
			return nil, ErrInvalidPayload
		}
		event.Raw = payload
		return &event, nil
	}

	// Parse signature header: t=timestamp,v1=signature
	timestamp, signatures, err := parseSignatureHeader(signatureHeader)
	if err != nil {
		return nil, err
	}

	// Verificar timestamp (proteção contra replay attacks)
	signedAt := time.Unix(timestamp, 0)
	if time.Since(signedAt) > WebhookTimestampTolerance {
		return nil, ErrSignatureExpired
	}

	// Construir signed payload: timestamp.payload
	signedPayload := fmt.Sprintf("%d.%s", timestamp, string(payload))

	// Calcular expected signature
	expectedSig := computeHMAC(signedPayload, s.webhookSecret)

	// Verificar se alguma das assinaturas v1 é válida
	valid := false
	for _, sig := range signatures {
		if hmac.Equal([]byte(sig), []byte(expectedSig)) {
			valid = true
			break
		}
	}

	if !valid {
		return nil, ErrInvalidSignature
	}

	// Parse evento
	var event WebhookEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		return nil, ErrInvalidPayload
	}
	event.Raw = payload

	return &event, nil
}

// parseSignatureHeader extrai timestamp e assinaturas do header Stripe-Signature
// Formato: t=timestamp,v1=signature1,v1=signature2,...
func parseSignatureHeader(header string) (int64, []string, error) {
	if header == "" {
		return 0, nil, ErrMissingSignature
	}

	var timestamp int64
	var signatures []string

	pairs := strings.Split(header, ",")
	for _, pair := range pairs {
		parts := strings.SplitN(pair, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		switch key {
		case "t":
			ts, err := strconv.ParseInt(value, 10, 64)
			if err != nil {
				return 0, nil, ErrInvalidSignature
			}
			timestamp = ts
		case "v1":
			signatures = append(signatures, value)
		}
	}

	if timestamp == 0 || len(signatures) == 0 {
		return 0, nil, ErrInvalidSignature
	}

	return timestamp, signatures, nil
}

// computeHMAC calcula HMAC-SHA256
func computeHMAC(message, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(message))
	return hex.EncodeToString(mac.Sum(nil))
}
