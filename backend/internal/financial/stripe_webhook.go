package financial

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"prost-qs/backend/internal/application"
)

// ========================================
// STRIPE WEBHOOK HANDLER
// "O Kernel recebe webhooks, não os apps"
// Fase 27.2 - Com idempotência absoluta
// ========================================

type StripeWebhookHandler struct {
	db                     *gorm.DB
	eventService           *FinancialEventService
	paymentProviderService *application.PaymentProviderService
	idempotencyService     *IdempotencyService
	alertService           *AlertService
}

func NewStripeWebhookHandler(
	db *gorm.DB,
	eventService *FinancialEventService,
	paymentProviderService *application.PaymentProviderService,
	idempotencyService *IdempotencyService,
	alertService *AlertService,
) *StripeWebhookHandler {
	return &StripeWebhookHandler{
		db:                     db,
		eventService:           eventService,
		paymentProviderService: paymentProviderService,
		idempotencyService:     idempotencyService,
		alertService:           alertService,
	}
}

// HandleStripeWebhook processa webhooks da Stripe
// POST /webhooks/stripe/:app_id
// Fase 27.2 - Com idempotência absoluta
func (h *StripeWebhookHandler) HandleStripeWebhook(c *gin.Context) {
	appIDStr := c.Param("app_id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	// Ler body raw
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		h.logWebhook(appID, "", "", "failed", "Erro ao ler body", c.ClientIP())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao ler body"})
		return
	}

	// Obter signature header
	signature := c.GetHeader("Stripe-Signature")
	if signature == "" {
		h.logWebhook(appID, "", "", "failed", "Signature ausente", c.ClientIP())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stripe-Signature header ausente"})
		return
	}

	// Buscar webhook secret do app
	provider, err := h.paymentProviderService.GetProvider(appID, ProviderStripe)
	if err != nil {
		h.logWebhook(appID, "", "", "failed", "Provider não encontrado", c.ClientIP())
		c.JSON(http.StatusNotFound, gin.H{"error": "Stripe não configurado para este app"})
		return
	}

	// Obter chaves descriptografadas
	keys, err := h.paymentProviderService.GetStripeKeys(appID)
	if err != nil || keys.WebhookSecret == "" {
		// Se não tem webhook secret, aceitar sem validação (dev mode)
		// Em produção, isso deveria ser obrigatório
		fmt.Printf("⚠️  Webhook sem validação de assinatura para app %s\n", appID)
	} else {
		// Validar assinatura
		if err := h.verifySignature(body, signature, keys.WebhookSecret); err != nil {
			h.logWebhook(appID, "", "", "failed", "Assinatura inválida", c.ClientIP())
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Assinatura inválida"})
			return
		}
	}

	// Parse do evento
	var stripeEvent StripeEvent
	if err := json.Unmarshal(body, &stripeEvent); err != nil {
		h.logWebhook(appID, "", "", "failed", "JSON inválido", c.ClientIP())
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	// ========================================
	// IDEMPOTÊNCIA - Fase 27.2.1
	// Verificar ANTES de qualquer processamento
	// ========================================
	if h.idempotencyService != nil {
		idempResult, err := h.idempotencyService.CheckAndReserve(
			ProviderStripe,
			stripeEvent.ID,
			appID,
			stripeEvent.Type,
			body,
		)
		if err != nil {
			h.logWebhook(appID, stripeEvent.Type, stripeEvent.ID, "failed", "Erro de idempotência: "+err.Error(), c.ClientIP())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro interno"})
			return
		}

		if idempResult.IsDuplicate {
			// Webhook já processado - retornar 200 OK (Stripe espera isso)
			h.logWebhook(appID, stripeEvent.Type, stripeEvent.ID, "duplicate", "", c.ClientIP())
			c.JSON(http.StatusOK, gin.H{
				"status":  "duplicate",
				"message": "Evento já processado anteriormente",
				"original_status": idempResult.ProcessedWebhook.Status,
			})
			return
		}
	}

	// Log do webhook recebido
	h.logWebhook(appID, stripeEvent.Type, stripeEvent.ID, "received", "", c.ClientIP())

	// Processar evento
	financialEvent, err := h.processStripeEvent(appID, &stripeEvent, body, provider.Environment)
	if err != nil {
		if err.Error() == "evento duplicado" {
			h.logWebhook(appID, stripeEvent.Type, stripeEvent.ID, "duplicate", "", c.ClientIP())
			// Marcar como processado na idempotência (já existia no ledger)
			if h.idempotencyService != nil {
				// Buscar o evento existente
				existing, _ := h.eventService.GetEventByExternalID(ProviderStripe, stripeEvent.ID)
				if existing != nil {
					h.idempotencyService.MarkProcessed(uuid.Nil, existing.ID)
				}
			}
			c.JSON(http.StatusOK, gin.H{"status": "duplicate", "message": "Evento já processado"})
			return
		}
		if err.Error() == "evento ignorado" {
			h.logWebhook(appID, stripeEvent.Type, stripeEvent.ID, "ignored", "", c.ClientIP())
			c.JSON(http.StatusOK, gin.H{"status": "ignored", "message": "Tipo de evento não processado"})
			return
		}
		
		// Marcar como falho na idempotência
		if h.idempotencyService != nil {
			// Buscar o registro de idempotência para marcar como falho
			record, _ := h.idempotencyService.GetByExternalID(ProviderStripe, stripeEvent.ID)
			if record != nil {
				h.idempotencyService.MarkFailed(record.ID, err.Error())
			}
		}
		
		// Criar alerta de falha
		if h.alertService != nil {
			h.alertService.CreateAlert(AlertInput{
				Type:     AlertWebhookFailures,
				AppID:    &appID,
				Severity: SeverityWarning,
				Value:    1,
				Message:  "Falha ao processar webhook Stripe",
				Metadata: map[string]interface{}{
					"stripe_event_id":   stripeEvent.ID,
					"stripe_event_type": stripeEvent.Type,
					"error":             err.Error(),
				},
			})
		}
		
		h.logWebhook(appID, stripeEvent.Type, stripeEvent.ID, "failed", err.Error(), c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Atualizar log como processado
	h.updateWebhookLog(stripeEvent.ID, "processed")

	c.JSON(http.StatusOK, gin.H{
		"status":   "processed",
		"event_id": financialEvent.ID,
		"type":     financialEvent.Type,
	})
}

// ========================================
// STRIPE EVENT PROCESSING
// ========================================

// StripeEvent estrutura básica de evento Stripe
type StripeEvent struct {
	ID      string          `json:"id"`
	Type    string          `json:"type"`
	Created int64           `json:"created"`
	Data    StripeEventData `json:"data"`
}

type StripeEventData struct {
	Object json.RawMessage `json:"object"`
}

// processStripeEvent converte evento Stripe para FinancialEvent
func (h *StripeWebhookHandler) processStripeEvent(appID uuid.UUID, event *StripeEvent, rawPayload []byte, environment string) (*FinancialEvent, error) {
	// Mapear tipo de evento
	eventType, ok := mapStripeEventType(event.Type)
	if !ok {
		return nil, errors.New("evento ignorado")
	}

	// Extrair dados do objeto
	var amount, netAmount, feeAmount int64
	var currency, externalID, customerID, description string

	switch {
	case strings.HasPrefix(event.Type, "payment_intent."):
		var pi StripePaymentIntent
		if err := json.Unmarshal(event.Data.Object, &pi); err == nil {
			amount = pi.Amount
			currency = strings.ToUpper(pi.Currency)
			externalID = pi.ID
			customerID = pi.Customer
			description = pi.Description
			// Stripe não retorna fee no payment_intent, seria no charge
		}

	case strings.HasPrefix(event.Type, "charge."):
		var ch StripeCharge
		if err := json.Unmarshal(event.Data.Object, &ch); err == nil {
			amount = ch.Amount
			currency = strings.ToUpper(ch.Currency)
			externalID = ch.ID
			customerID = ch.Customer
			description = ch.Description
			if ch.BalanceTransaction != nil {
				feeAmount = ch.BalanceTransaction.Fee
				netAmount = ch.BalanceTransaction.Net
			} else {
				netAmount = amount
			}
		}

	case strings.HasPrefix(event.Type, "refund."):
		var rf StripeRefund
		if err := json.Unmarshal(event.Data.Object, &rf); err == nil {
			amount = rf.Amount
			currency = strings.ToUpper(rf.Currency)
			externalID = rf.ID
			// Buscar parent (charge original)
		}

	case strings.HasPrefix(event.Type, "invoice."):
		var inv StripeInvoice
		if err := json.Unmarshal(event.Data.Object, &inv); err == nil {
			amount = inv.AmountPaid
			currency = strings.ToUpper(inv.Currency)
			externalID = inv.ID
			customerID = inv.Customer
		}

	case strings.HasPrefix(event.Type, "customer.subscription."):
		var sub StripeSubscription
		if err := json.Unmarshal(event.Data.Object, &sub); err == nil {
			externalID = sub.ID
			customerID = sub.Customer
			// Subscription events não têm amount direto
		}
	}

	// Criar evento financeiro
	input := CreateEventInput{
		AppID:       appID,
		Provider:    ProviderStripe,
		Type:        eventType,
		Amount:      amount,
		Currency:    currency,
		NetAmount:   netAmount,
		FeeAmount:   feeAmount,
		ExternalID:  externalID,
		CustomerID:  customerID,
		Description: description,
		Metadata: map[string]interface{}{
			"stripe_event_id":   event.ID,
			"stripe_event_type": event.Type,
			"environment":       environment,
		},
		RawPayload: rawPayload,
		OccurredAt: time.Unix(event.Created, 0),
	}

	return h.eventService.CreateEvent(input)
}

// mapStripeEventType mapeia tipo Stripe para EventType
func mapStripeEventType(stripeType string) (EventType, bool) {
	mapping := map[string]EventType{
		// Payment Intents
		"payment_intent.created":   EventPaymentCreated,
		"payment_intent.succeeded": EventPaymentSucceeded,
		"payment_intent.payment_failed": EventPaymentFailed,
		"payment_intent.canceled":  EventPaymentCanceled,

		// Charges
		"charge.succeeded": EventPaymentSucceeded,
		"charge.failed":    EventPaymentFailed,
		"charge.refunded":  EventRefundSucceeded,

		// Refunds
		"refund.created":   EventRefundCreated,
		"refund.updated":   EventRefundSucceeded, // Quando status muda para succeeded

		// Disputes
		"charge.dispute.created": EventDisputeCreated,
		"charge.dispute.closed":  EventDisputeWon, // Precisa verificar reason

		// Subscriptions
		"customer.subscription.created":  EventSubscriptionCreated,
		"customer.subscription.updated":  EventSubscriptionUpdated,
		"customer.subscription.deleted":  EventSubscriptionCanceled,

		// Invoice (para subscription renewals)
		"invoice.paid": EventSubscriptionRenewed,

		// Payouts
		"payout.created": EventPayoutCreated,
		"payout.paid":    EventPayoutPaid,
		"payout.failed":  EventPayoutFailed,
	}

	eventType, ok := mapping[stripeType]
	return eventType, ok
}

// ========================================
// STRIPE OBJECT TYPES
// ========================================

type StripePaymentIntent struct {
	ID          string `json:"id"`
	Amount      int64  `json:"amount"`
	Currency    string `json:"currency"`
	Customer    string `json:"customer"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

type StripeCharge struct {
	ID                 string                   `json:"id"`
	Amount             int64                    `json:"amount"`
	Currency           string                   `json:"currency"`
	Customer           string                   `json:"customer"`
	Description        string                   `json:"description"`
	Status             string                   `json:"status"`
	BalanceTransaction *StripeBalanceTransaction `json:"balance_transaction_object,omitempty"`
}

type StripeBalanceTransaction struct {
	ID     string `json:"id"`
	Amount int64  `json:"amount"`
	Fee    int64  `json:"fee"`
	Net    int64  `json:"net"`
}

type StripeRefund struct {
	ID       string `json:"id"`
	Amount   int64  `json:"amount"`
	Currency string `json:"currency"`
	Charge   string `json:"charge"`
	Status   string `json:"status"`
}

type StripeInvoice struct {
	ID         string `json:"id"`
	AmountPaid int64  `json:"amount_paid"`
	Currency   string `json:"currency"`
	Customer   string `json:"customer"`
	Status     string `json:"status"`
}

type StripeSubscription struct {
	ID       string `json:"id"`
	Customer string `json:"customer"`
	Status   string `json:"status"`
}

// ========================================
// SIGNATURE VERIFICATION
// ========================================

func (h *StripeWebhookHandler) verifySignature(payload []byte, header, secret string) error {
	// Parse header: t=timestamp,v1=signature
	parts := strings.Split(header, ",")
	var timestamp string
	var signatures []string

	for _, part := range parts {
		kv := strings.SplitN(part, "=", 2)
		if len(kv) != 2 {
			continue
		}
		switch kv[0] {
		case "t":
			timestamp = kv[1]
		case "v1":
			signatures = append(signatures, kv[1])
		}
	}

	if timestamp == "" || len(signatures) == 0 {
		return errors.New("header inválido")
	}

	// Verificar timestamp (tolerância de 5 minutos)
	ts, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return errors.New("timestamp inválido")
	}
	if time.Now().Unix()-ts > 300 {
		return errors.New("timestamp expirado")
	}

	// Calcular expected signature
	signedPayload := fmt.Sprintf("%s.%s", timestamp, string(payload))
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(signedPayload))
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	// Verificar se alguma signature bate
	for _, sig := range signatures {
		if hmac.Equal([]byte(sig), []byte(expectedSig)) {
			return nil
		}
	}

	return errors.New("assinatura não confere")
}

// ========================================
// WEBHOOK LOGGING
// ========================================

func (h *StripeWebhookHandler) logWebhook(appID uuid.UUID, eventType, externalID, status, errorMsg, sourceIP string) {
	log := WebhookLog{
		ID:         uuid.New(),
		AppID:      appID,
		Provider:   ProviderStripe,
		EventType:  eventType,
		ExternalID: externalID,
		Status:     status,
		Error:      errorMsg,
		SourceIP:   sourceIP,
		ReceivedAt: time.Now(),
	}
	h.db.Create(&log)
}

func (h *StripeWebhookHandler) updateWebhookLog(externalID, status string) {
	now := time.Now()
	h.db.Model(&WebhookLog{}).
		Where("external_id = ?", externalID).
		Updates(map[string]interface{}{
			"status":       status,
			"processed_at": &now,
		})
}

// ========================================
// ROUTES REGISTRATION
// ========================================

func RegisterWebhookRoutes(
	router *gin.Engine,
	db *gorm.DB,
	eventService *FinancialEventService,
	paymentProviderService *application.PaymentProviderService,
	idempotencyService *IdempotencyService,
	alertService *AlertService,
	rateLimiter *RateLimiter,
) {
	handler := NewStripeWebhookHandler(db, eventService, paymentProviderService, idempotencyService, alertService)

	// Webhook routes (sem auth - validação por signature)
	webhooks := router.Group("/webhooks")
	{
		// Aplicar rate limiting se disponível
		if rateLimiter != nil {
			webhooks.Use(RateLimitMiddleware(rateLimiter, alertService))
		}
		webhooks.POST("/stripe/:app_id", handler.HandleStripeWebhook)
	}
}
