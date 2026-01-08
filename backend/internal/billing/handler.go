package billing

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"prost-qs/backend/internal/jobs"
	"prost-qs/backend/pkg/resilience"
)

// ========================================
// ECONOMIC KERNEL - HTTP HANDLERS
// ========================================

// BillingHandler gerencia os endpoints de billing
type BillingHandler struct {
	service         *BillingService
	governedService *GovernedBillingService
	stripeService   *StripeService
	jobService      *jobs.JobService
}

// NewBillingHandler cria um novo handler
func NewBillingHandler(service *BillingService, governedService *GovernedBillingService, stripeService *StripeService, jobService *jobs.JobService) *BillingHandler {
	return &BillingHandler{
		service:         service,
		governedService: governedService,
		stripeService:   stripeService,
		jobService:      jobService,
	}
}

// ========================================
// HELPER - EXTRACT APP CONTEXT (Fase 16)
// ========================================

// extractBillingAppContext extrai contexto de app do request
func extractBillingAppContext(c *gin.Context) *BillingAppContext {
	ctx := &BillingAppContext{
		IP:        c.ClientIP(),
		UserAgent: c.GetHeader("User-Agent"),
	}

	// Tentar extrair app_id do contexto (se middleware de app estiver ativo)
	if appIDStr := c.GetString("appID"); appIDStr != "" {
		if appID, err := uuid.Parse(appIDStr); err == nil {
			ctx.AppID = &appID
		}
	}

	// Tentar extrair app_user_id
	if appUserIDStr := c.GetString("appUserID"); appUserIDStr != "" {
		if appUserID, err := uuid.Parse(appUserIDStr); err == nil {
			ctx.AppUserID = &appUserID
		}
	}

	// Tentar extrair session_id
	if sessionIDStr := c.GetString("sessionID"); sessionIDStr != "" {
		if sessionID, err := uuid.Parse(sessionIDStr); err == nil {
			ctx.SessionID = &sessionID
		}
	}

	return ctx
}

// ========================================
// REQUEST/RESPONSE TYPES
// ========================================

type CreateBillingAccountRequest struct {
	Email string `json:"email"`
	Phone string `json:"phone"`
}

type CreatePaymentIntentRequest struct {
	Amount         int64  `json:"amount" binding:"required,gt=0"`
	Currency       string `json:"currency" binding:"required"`
	Description    string `json:"description"`
	IdempotencyKey string `json:"idempotency_key"`
}

type CreateSubscriptionRequest struct {
	PlanID   string `json:"plan_id" binding:"required"`
	Amount   int64  `json:"amount" binding:"required,gt=0"`
	Currency string `json:"currency" binding:"required"`
	Interval string `json:"interval" binding:"required,oneof=month year"`
}

type RequestPayoutRequest struct {
	Amount      int64  `json:"amount" binding:"required,gt=0"`
	Currency    string `json:"currency" binding:"required"`
	Destination string `json:"destination" binding:"required"`
}

// ========================================
// BILLING ACCOUNT ENDPOINTS
// ========================================

// CreateBillingAccount cria uma conta de billing (GOVERNADO)
func (h *BillingHandler) CreateBillingAccount(c *gin.Context) {
	userIDStr := c.GetString("userID") // Key do middleware
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req CreateBillingAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	appCtx := extractBillingAppContext(c) // Fase 16
	
	// Usar GovernedService para Policy + KillSwitch + Audit
	account, err := h.governedService.CreateBillingAccountGoverned(ctx, userID, req.Email, req.Phone, userID, appCtx)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, account)
}

// GetBillingAccount busca a conta de billing do usuário
func (h *BillingHandler) GetBillingAccount(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	account, err := h.service.GetBillingAccount(userID)
	if err != nil {
		if err == ErrAccountNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Conta não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar conta"})
		return
	}

	c.JSON(http.StatusOK, account)
}

// ========================================
// PAYMENT INTENT ENDPOINTS
// ========================================

// CreatePaymentIntent cria uma intenção de pagamento (GOVERNADO)
func (h *BillingHandler) CreatePaymentIntent(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Get billing account
	account, err := h.service.GetBillingAccount(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conta de billing não encontrada"})
		return
	}

	var req CreatePaymentIntentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	appCtx := extractBillingAppContext(c) // Fase 16
	
	// Usar GovernedService para Policy + KillSwitch + Audit
	intent, err := h.governedService.CreatePaymentIntentGoverned(
		ctx,
		account.AccountID,
		req.Amount,
		req.Currency,
		req.Description,
		req.IdempotencyKey,
		userID,
		appCtx,
	)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, intent)
}

// GetPaymentIntent busca um payment intent
func (h *BillingHandler) GetPaymentIntent(c *gin.Context) {
	intentIDStr := c.Param("intentId")
	intentID, err := uuid.Parse(intentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	intent, err := h.service.GetPaymentIntent(intentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment intent não encontrado"})
		return
	}

	c.JSON(http.StatusOK, intent)
}

// ListPaymentIntents lista payment intents do usuário
func (h *BillingHandler) ListPaymentIntents(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	account, err := h.service.GetBillingAccount(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conta não encontrada"})
		return
	}

	intents, err := h.service.ListPaymentIntents(account.AccountID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar pagamentos"})
		return
	}

	c.JSON(http.StatusOK, intents)
}

// ========================================
// LEDGER ENDPOINTS
// ========================================

// GetLedger busca o ledger do usuário
func (h *BillingHandler) GetLedger(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	account, err := h.service.GetBillingAccount(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conta não encontrada"})
		return
	}

	entries, err := h.service.GetLedgerEntries(account.AccountID, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar ledger"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"balance": account.Balance,
		"currency": account.Currency,
		"entries": entries,
	})
}

// ========================================
// SUBSCRIPTION ENDPOINTS
// ========================================

// CreateSubscription cria uma assinatura
func (h *BillingHandler) CreateSubscription(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	account, err := h.service.GetBillingAccount(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conta não encontrada"})
		return
	}

	var req CreateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	sub, err := h.service.CreateSubscription(
		ctx,
		account.AccountID,
		req.PlanID,
		req.Amount,
		req.Currency,
		req.Interval,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar assinatura"})
		return
	}

	c.JSON(http.StatusCreated, sub)
}

// GetActiveSubscription busca assinatura ativa
func (h *BillingHandler) GetActiveSubscription(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	account, err := h.service.GetBillingAccount(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conta não encontrada"})
		return
	}

	sub, err := h.service.GetActiveSubscription(account.AccountID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nenhuma assinatura ativa"})
		return
	}

	c.JSON(http.StatusOK, sub)
}

// GetSubscriptionStatus retorna status completo da assinatura para o usuário
// Endpoint amigável para frontend mostrar estado do plano
func (h *BillingHandler) GetSubscriptionStatus(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Buscar account
	account, err := h.service.GetBillingAccount(userID)
	if err != nil {
		// Sem conta = sem plano
		c.JSON(http.StatusOK, gin.H{
			"has_subscription": false,
			"plan":             "free",
			"status":           "none",
			"message":          "Você está no plano gratuito",
		})
		return
	}

	// Buscar subscription
	sub, err := h.service.GetActiveSubscription(account.AccountID)
	if err != nil {
		// Tem conta mas sem subscription ativa
		c.JSON(http.StatusOK, gin.H{
			"has_subscription": false,
			"plan":             "free",
			"status":           "none",
			"message":          "Você está no plano gratuito",
		})
		return
	}

	// Tem subscription
	c.JSON(http.StatusOK, gin.H{
		"has_subscription":   true,
		"plan":               sub.PlanID,
		"plan_name":          "PROST-QS Pro",
		"status":             sub.Status,
		"amount":             sub.Amount,
		"currency":           sub.Currency,
		"interval":           sub.Interval,
		"current_period_end": sub.CurrentPeriodEnd,
		"message":            "Plano ativo",
	})
}

// CancelSubscription cancela uma assinatura
func (h *BillingHandler) CancelSubscription(c *gin.Context) {
	subIDStr := c.Param("subscriptionId")
	subID, err := uuid.Parse(subIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	ctx := c.Request.Context()
	sub, err := h.service.CancelSubscription(ctx, subID, "user_requested")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao cancelar assinatura"})
		return
	}

	c.JSON(http.StatusOK, sub)
}

// ========================================
// PAYOUT ENDPOINTS
// ========================================

// RequestPayout solicita um saque (GOVERNADO - CRÍTICO)
func (h *BillingHandler) RequestPayout(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	account, err := h.service.GetBillingAccount(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conta não encontrada"})
		return
	}

	var req RequestPayoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Obter role do usuário do contexto
	userRole := c.GetString("userRole")
	if userRole == "" {
		userRole = "user"
	}

	appCtx := extractBillingAppContext(c) // Fase 16

	// Usar GovernedService para Policy + KillSwitch + Audit
	// CRÍTICO: Débitos passam por avaliação de política
	payout, err := h.governedService.RequestPayoutGoverned(
		account.AccountID,
		req.Amount,
		req.Currency,
		req.Destination,
		userID,
		userRole,
		appCtx,
	)
	if err != nil {
		if err == ErrInsufficientBalance {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Saldo insuficiente"})
			return
		}
		// Pode ser bloqueio por política ou kill switch
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, payout)
}

// ========================================
// WEBHOOK ENDPOINT
// ========================================

// HandleStripeWebhook processa webhooks do Stripe - ASYNC
// 1. Valida assinatura
// 2. Checa idempotência
// 3. Enfileira job
// 4. Responde 200 imediatamente
func (h *BillingHandler) HandleStripeWebhook(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Falha ao ler payload"})
		return
	}

	signature := c.GetHeader("Stripe-Signature")
	event, err := h.stripeService.ValidateWebhook(payload, signature)
	if err != nil {
		switch err {
		case ErrInvalidSignature:
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Assinatura inválida"})
		case ErrSignatureExpired:
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Assinatura expirada"})
		case ErrMissingSignature:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Header Stripe-Signature ausente"})
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Payload inválido"})
		}
		return
	}

	// Verificar idempotência - evento já processado?
	if h.service.IsWebhookProcessed(event.ID) {
		c.JSON(http.StatusOK, gin.H{"received": true, "status": "already_processed"})
		return
	}

	// Enfileirar job para processamento async
	if h.jobService != nil {
		webhookPayload := jobs.WebhookPayload{
			EventID:   event.ID,
			EventType: event.Type,
			Executor:  "stripe",
			RawData:   base64.StdEncoding.EncodeToString(payload),
			Signature: signature,
		}

		_, err := h.jobService.Enqueue(string(jobs.JobTypeWebhook), webhookPayload, jobs.WithPriority(10))
		if err != nil {
			// Fallback: processar síncrono se fila falhar
			h.processWebhookSync(c, event)
			return
		}

		// Marcar como recebido (processamento será feito pelo job)
		c.JSON(http.StatusOK, gin.H{"received": true, "status": "queued"})
		return
	}

	// Sem job service: processar síncrono (fallback)
	h.processWebhookSync(c, event)
}

// processWebhookSync processa webhook de forma síncrona (fallback)
func (h *BillingHandler) processWebhookSync(c *gin.Context, event *WebhookEvent) {
	var processErr error
	switch event.Type {
	case "checkout.session.completed":
		processErr = h.handleCheckoutSessionCompleted(event)

	case "payment_intent.succeeded":
		processErr = h.handlePaymentIntentSucceeded(event)

	case "payment_intent.payment_failed":
		processErr = h.handlePaymentIntentFailed(event)

	case "customer.subscription.created":
		processErr = h.handleSubscriptionCreated(event)

	case "customer.subscription.updated":
		processErr = h.handleSubscriptionUpdated(event)

	case "customer.subscription.deleted":
		processErr = h.handleSubscriptionDeleted(event)

	case "invoice.paid":
		processErr = h.handleInvoicePaid(event)

	case "invoice.payment_failed":
		processErr = h.handleInvoicePaymentFailed(event)

	case "payout.paid":
		processErr = h.handlePayoutPaid(event)

	case "payout.failed":
		processErr = h.handlePayoutFailed(event)

	default:
		h.service.MarkWebhookProcessed(event.ID, event.Type, true, "")
		c.JSON(http.StatusOK, gin.H{"received": true, "status": "unhandled_event_type"})
		return
	}

	if processErr != nil {
		h.service.MarkWebhookProcessed(event.ID, event.Type, false, processErr.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": processErr.Error()})
		return
	}

	h.service.MarkWebhookProcessed(event.ID, event.Type, true, "")
	c.JSON(http.StatusOK, gin.H{"received": true, "status": "processed"})
}

// ProcessWebhookJob processa um job de webhook (chamado pelo job worker)
func (h *BillingHandler) ProcessWebhookJob(ctx context.Context, job *jobs.Job) error {
	var payload jobs.WebhookPayload
	if err := json.Unmarshal([]byte(job.Payload), &payload); err != nil {
		return err
	}

	// Decodificar raw data
	rawData, err := base64.StdEncoding.DecodeString(payload.RawData)
	if err != nil {
		return err
	}

	// Revalidar e parsear evento
	event, err := h.stripeService.ValidateWebhook(rawData, payload.Signature)
	if err != nil {
		return err
	}

	// Processar evento
	switch event.Type {
	case "payment_intent.succeeded":
		return h.handlePaymentIntentSucceeded(event)
	case "payment_intent.payment_failed":
		return h.handlePaymentIntentFailed(event)
	case "customer.subscription.updated":
		return h.handleSubscriptionUpdated(event)
	case "customer.subscription.deleted":
		return h.handleSubscriptionDeleted(event)
	case "invoice.payment_failed":
		return h.handleInvoicePaymentFailed(event)
	case "payout.paid":
		return h.handlePayoutPaid(event)
	case "payout.failed":
		return h.handlePayoutFailed(event)
	}

	// Marcar como processado
	h.service.MarkWebhookProcessed(event.ID, event.Type, true, "")
	return nil
}

// ========================================
// WEBHOOK EVENT HANDLERS
// ========================================

func (h *BillingHandler) handlePaymentIntentSucceeded(event *WebhookEvent) error {
	obj := event.Data.Object
	stripeIntentID, _ := obj["id"].(string)
	chargeID := ""
	if latestCharge, ok := obj["latest_charge"].(string); ok {
		chargeID = latestCharge
	}

	_, err := h.service.ConfirmPaymentIntent(stripeIntentID, chargeID)
	if err != nil && err != ErrIntentAlreadyConfirmed {
		return err
	}
	return nil
}

func (h *BillingHandler) handlePaymentIntentFailed(event *WebhookEvent) error {
	obj := event.Data.Object
	stripeIntentID, _ := obj["id"].(string)

	failureCode := ""
	failureMsg := ""
	if lastError, ok := obj["last_payment_error"].(map[string]interface{}); ok {
		failureCode, _ = lastError["code"].(string)
		failureMsg, _ = lastError["message"].(string)
	}

	_, err := h.service.FailPaymentIntent(stripeIntentID, failureCode, failureMsg)
	return err
}

func (h *BillingHandler) handleSubscriptionCreated(event *WebhookEvent) error {
	// TODO: Implementar quando subscription flow estiver completo
	return nil
}

func (h *BillingHandler) handleSubscriptionUpdated(event *WebhookEvent) error {
	obj := event.Data.Object
	stripeSubID, _ := obj["id"].(string)
	status, _ := obj["status"].(string)

	return h.service.UpdateSubscriptionStatus(stripeSubID, status)
}

func (h *BillingHandler) handleSubscriptionDeleted(event *WebhookEvent) error {
	obj := event.Data.Object
	stripeSubID, _ := obj["id"].(string)

	return h.service.CancelSubscriptionByStripeID(stripeSubID, "stripe_webhook")
}

func (h *BillingHandler) handleInvoicePaid(event *WebhookEvent) error {
	// Invoice paid - pode ser usado para renovação de subscription
	// TODO: Implementar lógica de renovação
	return nil
}

func (h *BillingHandler) handleInvoicePaymentFailed(event *WebhookEvent) error {
	// Invoice falhou - marcar subscription como past_due
	obj := event.Data.Object
	if subID, ok := obj["subscription"].(string); ok && subID != "" {
		return h.service.UpdateSubscriptionStatus(subID, "past_due")
	}
	return nil
}

func (h *BillingHandler) handlePayoutPaid(event *WebhookEvent) error {
	obj := event.Data.Object
	stripePayoutID, _ := obj["id"].(string)

	return h.service.ConfirmPayoutByStripeID(stripePayoutID)
}

func (h *BillingHandler) handlePayoutFailed(event *WebhookEvent) error {
	obj := event.Data.Object
	stripePayoutID, _ := obj["id"].(string)
	failureCode, _ := obj["failure_code"].(string)
	failureMsg, _ := obj["failure_message"].(string)

	return h.service.FailPayoutByStripeID(stripePayoutID, failureCode, failureMsg)
}

// handleCheckoutSessionCompleted processa checkout.session.completed
// Este é o evento mais importante - confirma que o pagamento foi feito
func (h *BillingHandler) handleCheckoutSessionCompleted(event *WebhookEvent) error {
	obj := event.Data.Object
	
	// Extrair dados do checkout session
	sessionID, _ := obj["id"].(string)
	customerEmail, _ := obj["customer_email"].(string)
	customerID, _ := obj["customer"].(string)
	subscriptionID, _ := obj["subscription"].(string)
	paymentStatus, _ := obj["payment_status"].(string)
	
	log.Printf("✅ [CHECKOUT] Session completed: %s, customer: %s, subscription: %s, status: %s", 
		sessionID, customerEmail, subscriptionID, paymentStatus)
	
	// Se tem subscription, criar/atualizar no sistema
	if subscriptionID != "" {
		// Buscar account pelo customer_id (deve existir - foi criada no /billing/checkout)
		account, err := h.service.GetOrCreateAccountByStripeCustomer(customerID, customerEmail)
		if err != nil {
			log.Printf("⚠️ [CHECKOUT] Account não encontrada para customer=%s, tentando atualizar stripe_customer_id", customerID)
			
			// Fallback: tentar encontrar account sem stripe_customer_id e atualizar
			// Isso pode acontecer se o checkout foi criado antes de termos o customer_id
			account, err = h.service.FindAndLinkStripeCustomer(customerID, customerEmail)
			if err != nil {
				log.Printf("❌ [CHECKOUT] Não foi possível linkar customer: %v", err)
				return err
			}
		}
		
		// Criar subscription local
		_, err = h.service.CreateSubscriptionFromStripe(account.AccountID, subscriptionID, "pro", paymentStatus)
		if err != nil {
			log.Printf("❌ [CHECKOUT] Erro ao criar subscription: %v", err)
			return err
		}
		
		log.Printf("🎉 [CHECKOUT] Subscription criada para account %s (user=%s)", account.AccountID, account.UserID)
	}
	
	return nil
}

// ========================================
// CHECKOUT SESSION - Stripe Real
// ========================================

// CreateCheckoutSession cria uma sessão de checkout do Stripe
func (h *BillingHandler) CreateCheckoutSession(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Buscar ou criar billing account
	account, err := h.service.GetBillingAccount(userID)
	if err != nil {
		// Criar conta se não existir
		ctx := c.Request.Context()
		appCtx := extractBillingAppContext(c)
		account, err = h.governedService.CreateBillingAccountGoverned(ctx, userID, "", "", userID, appCtx)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar conta"})
			return
		}
	}

	// Criar checkout session via Stripe
	ctx := c.Request.Context()
	// URLs temporárias - depois trocar para páginas reais do frontend
	successURL := "https://example.com/success"
	cancelURL := "https://example.com/cancel"
	
	sessionURL, sessionID, err := h.stripeService.CreateCheckoutSession(ctx, account.StripeCustomerID, successURL, cancelURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar checkout: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"checkout_url": sessionURL,
		"session_id":   sessionID,
	})
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterBillingRoutes registra as rotas de billing
func RegisterBillingRoutes(router *gin.RouterGroup, service *BillingService, governedService *GovernedBillingService, stripeService *StripeService, jobService *jobs.JobService, authMiddleware gin.HandlerFunc) {
	handler := NewBillingHandler(service, governedService, stripeService, jobService)

	billing := router.Group("/billing")
	{
		// Account
		billing.POST("/account", authMiddleware, handler.CreateBillingAccount)
		billing.GET("/account", authMiddleware, handler.GetBillingAccount)

		// Payment Intents
		billing.POST("/intents", authMiddleware, handler.CreatePaymentIntent)
		billing.GET("/intents", authMiddleware, handler.ListPaymentIntents)
		billing.GET("/intents/:intentId", authMiddleware, handler.GetPaymentIntent)

		// Checkout Session (Stripe real)
		billing.POST("/checkout", authMiddleware, handler.CreateCheckoutSession)

		// Ledger
		billing.GET("/ledger", authMiddleware, handler.GetLedger)

		// Subscriptions
		billing.POST("/subscriptions", authMiddleware, handler.CreateSubscription)
		billing.GET("/subscriptions/active", authMiddleware, handler.GetActiveSubscription)
		billing.GET("/subscriptions/status", authMiddleware, handler.GetSubscriptionStatus)
		billing.DELETE("/subscriptions/:subscriptionId", authMiddleware, handler.CancelSubscription)

		// Payouts
		billing.POST("/payouts", authMiddleware, handler.RequestPayout)

		// Webhook (público - Stripe precisa acessar)
		billing.POST("/webhook", handler.HandleStripeWebhook)

		// Reconciliation (admin only)
		billing.POST("/reconcile", authMiddleware, handler.RunReconciliation)
		billing.GET("/reconcile/logs", authMiddleware, handler.GetReconciliationLogs)

		// Circuit Breaker Stats (admin only)
		billing.GET("/health/circuits", authMiddleware, handler.GetCircuitStats)
	}
}

// GetCircuitStats retorna estatísticas dos circuit breakers
func (h *BillingHandler) GetCircuitStats(c *gin.Context) {
	stats := resilience.GetAllCircuitStats()
	stripeStats := h.stripeService.GetCircuitStats()

	c.JSON(http.StatusOK, gin.H{
		"stripe":     stripeStats,
		"all_circuits": stats,
	})
}

// ========================================
// RECONCILIATION ENDPOINTS
// ========================================

// RunReconciliation executa reconciliação manual
func (h *BillingHandler) RunReconciliation(c *gin.Context) {
	ctx := c.Request.Context()
	result, err := h.service.RunReconciliation(ctx)
	if err != nil {
		h.service.LogReconciliation(result, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha na reconciliação"})
		return
	}

	h.service.LogReconciliation(result, nil)

	c.JSON(http.StatusOK, gin.H{
		"status":        "completed",
		"total_checked": result.TotalChecked,
		"discrepancies": len(result.Discrepancies),
		"details":       result.Discrepancies,
	})
}

// GetReconciliationLogs lista logs de reconciliação
func (h *BillingHandler) GetReconciliationLogs(c *gin.Context) {
	var logs []ReconciliationLog
	if err := h.service.db.Order("started_at DESC").Limit(20).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar logs"})
		return
	}
	c.JSON(http.StatusOK, logs)
}
