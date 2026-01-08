package kernel_billing

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/invoice"
	"github.com/stripe/stripe-go/v76/subscription"

	"prost-qs/backend/pkg/resilience"
)

// ========================================
// KERNEL STRIPE SERVICE - Fase 28.2-B
// "Integração Stripe do Kernel Billing"
// Cenários cobertos: 1, 2, 9, 10, 11
// ========================================

var (
	ErrStripeNotConfigured = errors.New("stripe not configured for kernel billing")
	ErrCustomerNotFound    = errors.New("stripe customer not found")
	ErrSubscriptionNotFound = errors.New("stripe subscription not found")
)

// KernelStripeConfig configuração do Stripe para o kernel
type KernelStripeConfig struct {
	SecretKey      string
	WebhookSecret  string
	SuccessURL     string
	CancelURL      string
	TestMode       bool // SEMPRE true até liberação gradual
}

// KernelStripeService gerencia integração Stripe do kernel
type KernelStripeService struct {
	config         *KernelStripeConfig
	circuitBreaker *resilience.CircuitBreaker
	billingService *KernelBillingService
}

// NewKernelStripeService cria novo serviço Stripe do kernel
func NewKernelStripeService(config *KernelStripeConfig, billingService *KernelBillingService) *KernelStripeService {
	// Configurar Stripe API key
	if config.SecretKey != "" {
		stripe.Key = config.SecretKey
	}

	// Circuit breaker específico para Stripe do kernel
	// Cenário 11: Stripe fora do ar
	cbConfig := &resilience.CircuitBreakerConfig{
		Name:             "kernel_stripe",
		MaxFailures:      5,
		FailureWindow:    time.Minute,
		RecoveryTimeout:  30 * time.Second,
		HalfOpenMaxCalls: 2,
	}

	return &KernelStripeService{
		config:         config,
		circuitBreaker: resilience.NewCircuitBreaker(cbConfig),
		billingService: billingService,
	}
}

// LoadKernelStripeConfig carrega configuração do ambiente
func LoadKernelStripeConfig() *KernelStripeConfig {
	return &KernelStripeConfig{
		SecretKey:     os.Getenv("KERNEL_STRIPE_SECRET_KEY"),
		WebhookSecret: os.Getenv("KERNEL_STRIPE_WEBHOOK_SECRET"),
		SuccessURL:    os.Getenv("KERNEL_STRIPE_SUCCESS_URL"),
		CancelURL:     os.Getenv("KERNEL_STRIPE_CANCEL_URL"),
		TestMode:      os.Getenv("KERNEL_STRIPE_LIVE_MODE") != "true", // Default: test mode
	}
}

// IsConfigured verifica se Stripe está configurado
func (s *KernelStripeService) IsConfigured() bool {
	return s.config.SecretKey != "" && s.config.WebhookSecret != ""
}

// ========================================
// CUSTOMER MANAGEMENT
// ========================================

// StripeCustomerData dados do customer no Stripe
type StripeCustomerData struct {
	CustomerID string
	Email      string
	Name       string
	AppID      string
}

// CreateOrGetCustomer cria ou obtém customer no Stripe
// Cenário 1: Preparação para checkout
func (s *KernelStripeService) CreateOrGetCustomer(ctx context.Context, appID, email, name string) (*StripeCustomerData, error) {
	if !s.IsConfigured() {
		return nil, ErrStripeNotConfigured
	}

	var result *StripeCustomerData
	var opErr error

	// Executar com circuit breaker (Cenário 11)
	err := s.circuitBreaker.Execute(func() error {
		// Buscar customer existente por metadata
		params := &stripe.CustomerSearchParams{}
		params.Query = fmt.Sprintf("metadata['kernel_app_id']:'%s'", appID)

		iter := customer.Search(params)
		for iter.Next() {
			c := iter.Customer()
			result = &StripeCustomerData{
				CustomerID: c.ID,
				Email:      c.Email,
				Name:       c.Name,
				AppID:      appID,
			}
			return nil
		}

		// Criar novo customer
		createParams := &stripe.CustomerParams{
			Email: stripe.String(email),
			Name:  stripe.String(name),
			Metadata: map[string]string{
				"kernel_app_id": appID,
				"source":        "kernel_billing",
			},
		}

		c, err := customer.New(createParams)
		if err != nil {
			opErr = err
			return err
		}

		result = &StripeCustomerData{
			CustomerID: c.ID,
			Email:      c.Email,
			Name:       c.Name,
			AppID:      appID,
		}
		return nil
	})

	if err == resilience.ErrCircuitOpen {
		log.Printf("⚠️ [KERNEL_STRIPE] Circuit breaker OPEN - Stripe indisponível")
		return nil, fmt.Errorf("serviço de pagamento temporariamente indisponível")
	}

	if opErr != nil {
		return nil, opErr
	}

	return result, err
}

// ========================================
// CHECKOUT SESSION
// ========================================

// CheckoutSessionData dados da sessão de checkout
type CheckoutSessionData struct {
	SessionID  string
	URL        string
	CustomerID string
	PlanID     string
	AppID      string
	ExpiresAt  time.Time
}

// CreateCheckoutSession cria sessão de checkout para upgrade
// Cenário 1: Cartão recusado no checkout (tratado pelo Stripe)
// Cenário 9: Upgrade no meio do ciclo
func (s *KernelStripeService) CreateCheckoutSession(ctx context.Context, appID, customerID, planID string) (*CheckoutSessionData, error) {
	if !s.IsConfigured() {
		return nil, ErrStripeNotConfigured
	}

	// Buscar plano para obter preço
	plan, err := s.billingService.GetPlanByID(planID)
	if err != nil {
		return nil, fmt.Errorf("plano não encontrado: %w", err)
	}

	var result *CheckoutSessionData
	var opErr error

	err = s.circuitBreaker.Execute(func() error {
		// Criar Price ID dinâmico ou usar existente
		// Em produção, você teria Price IDs pré-criados no Stripe
		priceID := fmt.Sprintf("price_%s_monthly", plan.Name)

		params := &stripe.CheckoutSessionParams{
			Customer: stripe.String(customerID),
			Mode:     stripe.String(string(stripe.CheckoutSessionModeSubscription)),
			LineItems: []*stripe.CheckoutSessionLineItemParams{
				{
					Price:    stripe.String(priceID),
					Quantity: stripe.Int64(1),
				},
			},
			SuccessURL: stripe.String(s.config.SuccessURL + "?session_id={CHECKOUT_SESSION_ID}"),
			CancelURL:  stripe.String(s.config.CancelURL),
			Metadata: map[string]string{
				"kernel_app_id": appID,
				"kernel_plan":   planID,
				"source":        "kernel_billing",
			},
			SubscriptionData: &stripe.CheckoutSessionSubscriptionDataParams{
				Metadata: map[string]string{
					"kernel_app_id": appID,
					"kernel_plan":   planID,
				},
			},
		}

		// Cenário 9: Proration automática do Stripe
		if plan.PriceMonthly > 0 {
			params.SubscriptionData.ProrationBehavior = stripe.String("create_prorations")
		}

		sess, err := session.New(params)
		if err != nil {
			opErr = err
			return err
		}

		result = &CheckoutSessionData{
			SessionID:  sess.ID,
			URL:        sess.URL,
			CustomerID: customerID,
			PlanID:     planID,
			AppID:      appID,
			ExpiresAt:  time.Unix(sess.ExpiresAt, 0),
		}
		return nil
	})

	if err == resilience.ErrCircuitOpen {
		return nil, fmt.Errorf("serviço de pagamento temporariamente indisponível")
	}

	return result, opErr
}

// ========================================
// SUBSCRIPTION MANAGEMENT
// ========================================

// StripeSubscriptionData dados da subscription no Stripe
type StripeSubscriptionData struct {
	SubscriptionID     string
	CustomerID         string
	Status             string
	CurrentPeriodStart time.Time
	CurrentPeriodEnd   time.Time
	CancelAtPeriodEnd  bool
	PlanID             string
}

// GetSubscription obtém subscription do Stripe
func (s *KernelStripeService) GetSubscription(ctx context.Context, subscriptionID string) (*StripeSubscriptionData, error) {
	if !s.IsConfigured() {
		return nil, ErrStripeNotConfigured
	}

	var result *StripeSubscriptionData
	var opErr error

	err := s.circuitBreaker.Execute(func() error {
		sub, err := subscription.Get(subscriptionID, nil)
		if err != nil {
			opErr = err
			return err
		}

		result = &StripeSubscriptionData{
			SubscriptionID:     sub.ID,
			CustomerID:         sub.Customer.ID,
			Status:             string(sub.Status),
			CurrentPeriodStart: time.Unix(sub.CurrentPeriodStart, 0),
			CurrentPeriodEnd:   time.Unix(sub.CurrentPeriodEnd, 0),
			CancelAtPeriodEnd:  sub.CancelAtPeriodEnd,
		}

		// Extrair plan_id do metadata
		if planID, ok := sub.Metadata["kernel_plan"]; ok {
			result.PlanID = planID
		}

		return nil
	})

	if err == resilience.ErrCircuitOpen {
		return nil, fmt.Errorf("serviço de pagamento temporariamente indisponível")
	}

	return result, opErr
}

// CancelSubscription cancela subscription no Stripe
// Cenário 10: Downgrade + cancelamento mesmo dia
func (s *KernelStripeService) CancelSubscription(ctx context.Context, subscriptionID string, immediate bool) error {
	if !s.IsConfigured() {
		return ErrStripeNotConfigured
	}

	return s.circuitBreaker.Execute(func() error {
		if immediate {
			// Cancelamento imediato
			_, err := subscription.Cancel(subscriptionID, nil)
			return err
		}

		// Cancelamento no fim do período
		params := &stripe.SubscriptionParams{
			CancelAtPeriodEnd: stripe.Bool(true),
		}
		_, err := subscription.Update(subscriptionID, params)
		return err
	})
}

// ========================================
// INVOICE MANAGEMENT
// ========================================

// StripeInvoiceData dados da invoice no Stripe
type StripeInvoiceData struct {
	InvoiceID      string
	CustomerID     string
	SubscriptionID string
	Status         string
	AmountDue      int64
	AmountPaid     int64
	Currency       string
	PeriodStart    time.Time
	PeriodEnd      time.Time
	PaidAt         *time.Time
}

// GetInvoice obtém invoice do Stripe
func (s *KernelStripeService) GetInvoice(ctx context.Context, invoiceID string) (*StripeInvoiceData, error) {
	if !s.IsConfigured() {
		return nil, ErrStripeNotConfigured
	}

	var result *StripeInvoiceData
	var opErr error

	err := s.circuitBreaker.Execute(func() error {
		inv, err := invoice.Get(invoiceID, nil)
		if err != nil {
			opErr = err
			return err
		}

		result = &StripeInvoiceData{
			InvoiceID:  inv.ID,
			CustomerID: inv.Customer.ID,
			Status:     string(inv.Status),
			AmountDue:  inv.AmountDue,
			AmountPaid: inv.AmountPaid,
			Currency:   string(inv.Currency),
		}

		if inv.Subscription != nil {
			result.SubscriptionID = inv.Subscription.ID
		}

		if inv.PeriodStart > 0 {
			result.PeriodStart = time.Unix(inv.PeriodStart, 0)
		}
		if inv.PeriodEnd > 0 {
			result.PeriodEnd = time.Unix(inv.PeriodEnd, 0)
		}
		if inv.StatusTransitions != nil && inv.StatusTransitions.PaidAt > 0 {
			paidAt := time.Unix(inv.StatusTransitions.PaidAt, 0)
			result.PaidAt = &paidAt
		}

		return nil
	})

	if err == resilience.ErrCircuitOpen {
		return nil, fmt.Errorf("serviço de pagamento temporariamente indisponível")
	}

	return result, opErr
}

// ========================================
// CIRCUIT BREAKER STATUS
// ========================================

// GetCircuitBreakerStatus retorna status do circuit breaker
func (s *KernelStripeService) GetCircuitBreakerStatus() resilience.CircuitStats {
	return s.circuitBreaker.Stats()
}
