package kernel_billing

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/webhook"
	"gorm.io/gorm"
)

// ========================================
// KERNEL WEBHOOK HANDLER - Fase 28.2-B
// "Webhook nunca quebra o kernel"
// Cenários cobertos: 1-8, 12, 15
// ========================================

// KernelWebhookHandler processa webhooks do Stripe para o kernel
type KernelWebhookHandler struct {
	db             *gorm.DB
	billingService *KernelBillingService
	stripeService  *KernelStripeService
	alertService   KernelAlertService
	webhookSecret  string
}

// KernelAlertService interface para criar alertas
type KernelAlertService interface {
	CreateAlert(alertType, severity string, appID string, metadata map[string]interface{}) error
}

// NewKernelWebhookHandler cria novo handler de webhooks
func NewKernelWebhookHandler(
	db *gorm.DB,
	billingService *KernelBillingService,
	stripeService *KernelStripeService,
	alertService KernelAlertService,
	webhookSecret string,
) *KernelWebhookHandler {
	return &KernelWebhookHandler{
		db:             db,
		billingService: billingService,
		stripeService:  stripeService,
		alertService:   alertService,
		webhookSecret:  webhookSecret,
	}
}

// ========================================
// PROCESSED WEBHOOK MODEL (Idempotência)
// ========================================

// KernelProcessedWebhook registra webhooks processados
// Cenário 3: Webhook duplicado
type KernelProcessedWebhook struct {
	ID              string     `gorm:"primaryKey" json:"id"`
	Provider        string     `gorm:"index:idx_kernel_webhook_unique,unique" json:"provider"`
	ExternalEventID string     `gorm:"index:idx_kernel_webhook_unique,unique" json:"external_event_id"`
	AppID           string     `gorm:"index" json:"app_id"`
	EventType       string     `json:"event_type"`
	PayloadHash     string     `json:"payload_hash"`
	Status          string     `gorm:"default:'processing'" json:"status"` // processing, processed, failed, ignored
	ErrorMessage    string     `json:"error_message,omitempty"`
	ReceivedAt      time.Time  `json:"received_at"`
	ProcessedAt     *time.Time `json:"processed_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

func (KernelProcessedWebhook) TableName() string {
	return "kernel_processed_webhooks"
}

// ========================================
// MAIN WEBHOOK ENDPOINT
// ========================================

// HandleStripeWebhook processa webhooks do Stripe
// REGRA: Retornar 200 sempre que possível, 500 apenas quando retry é desejado
func (h *KernelWebhookHandler) HandleStripeWebhook(c *gin.Context) {
	// 1. Ler body
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("❌ [KERNEL_WEBHOOK] Erro ao ler body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// 2. Verificar assinatura do Stripe (com tolerância de versão para testes)
	sigHeader := c.GetHeader("Stripe-Signature")
	event, err := webhook.ConstructEventWithOptions(body, sigHeader, h.webhookSecret, webhook.ConstructEventOptions{
		IgnoreAPIVersionMismatch: true,
	})
	if err != nil {
		log.Printf("❌ [KERNEL_WEBHOOK] Assinatura inválida: %v", err)
		// Assinatura inválida = não retry (possível ataque)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid signature"})
		return
	}

	// 3. Verificar idempotência (Cenário 3: Webhook duplicado)
	idempResult, err := h.checkIdempotency(event.ID, string(event.Type), body)
	if err != nil {
		log.Printf("❌ [KERNEL_WEBHOOK] Erro de idempotência: %v", err)
		// Erro interno = retry desejado
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	if idempResult.IsDuplicate {
		log.Printf("⚠️ [KERNEL_WEBHOOK] Webhook duplicado ignorado: %s", event.ID)
		// Duplicado = 200 OK, não processar novamente
		c.JSON(http.StatusOK, gin.H{"status": "duplicate_ignored"})
		return
	}

	// 4. Extrair app_id do metadata
	appID, err := h.extractAppID(&event)
	if err != nil {
		// Cenário 15: Webhook com app_id inválido
		log.Printf("⚠️ [KERNEL_WEBHOOK] App ID não encontrado: %s - %v", event.ID, err)
		h.markWebhookIgnored(idempResult.WebhookID, "app_id not found")
		h.createOrphanAlert(event.ID, string(event.Type), err.Error())
		// Retornar 200 para não retry infinito
		c.JSON(http.StatusOK, gin.H{"status": "orphan_webhook_logged"})
		return
	}

	// 5. Verificar se app existe (Cenário 15)
	if !h.appExists(appID) {
		log.Printf("⚠️ [KERNEL_WEBHOOK] App não existe: %s", appID)
		h.markWebhookIgnored(idempResult.WebhookID, "app not found")
		h.createOrphanAlert(event.ID, string(event.Type), fmt.Sprintf("app %s not found", appID))
		c.JSON(http.StatusOK, gin.H{"status": "orphan_webhook_logged"})
		return
	}

	// 6. Processar evento por tipo
	processErr := h.processEvent(&event, appID, idempResult.WebhookID)

	// 7. Marcar resultado
	if processErr != nil {
		log.Printf("❌ [KERNEL_WEBHOOK] Erro ao processar %s: %v", event.Type, processErr)
		h.markWebhookFailed(idempResult.WebhookID, processErr.Error())

		// Cenário 6: Stripe cobra, kernel não marca
		// Se erro é retryable, retornar 500 para Stripe retry
		if isRetryableWebhookError(processErr) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "processing failed, retry"})
			return
		}

		// Erro não retryable = 200 OK, logar e alertar
		c.JSON(http.StatusOK, gin.H{"status": "error_logged"})
		return
	}

	// 8. Sucesso
	h.markWebhookProcessed(idempResult.WebhookID)
	log.Printf("✅ [KERNEL_WEBHOOK] Processado: %s (%s) para app %s", event.Type, event.ID, appID)
	c.JSON(http.StatusOK, gin.H{"status": "processed"})
}

// ========================================
// EVENT PROCESSORS
// ========================================

// processEvent roteia evento para handler específico
func (h *KernelWebhookHandler) processEvent(event *stripe.Event, appID, webhookID string) error {
	switch event.Type {
	// Cenário 1: Checkout completado com sucesso
	case "checkout.session.completed":
		return h.handleCheckoutCompleted(event, appID)

	// Cenário 2: Pagamento de invoice falhou
	case "invoice.payment_failed":
		return h.handleInvoicePaymentFailed(event, appID)

	// Cenário 2, 8: Pagamento de invoice sucesso
	case "invoice.paid":
		return h.handleInvoicePaid(event, appID)

	// Cenário 4: Subscription criada
	case "customer.subscription.created":
		return h.handleSubscriptionCreated(event, appID)

	// Cenário 7, 9, 10: Subscription atualizada
	case "customer.subscription.updated":
		return h.handleSubscriptionUpdated(event, appID)

	// Cenário 7: Subscription deletada
	case "customer.subscription.deleted":
		return h.handleSubscriptionDeleted(event, appID)

	// Cenário 8: Método de pagamento atualizado
	case "payment_method.attached":
		return h.handlePaymentMethodAttached(event, appID)

	default:
		// Evento não tratado = ignorar silenciosamente
		log.Printf("ℹ️ [KERNEL_WEBHOOK] Evento ignorado: %s", event.Type)
		return nil
	}
}

// ========================================
// CHECKOUT HANDLERS
// ========================================

// handleCheckoutCompleted processa checkout completado
// Cenário 1: Cartão aprovado no checkout
func (h *KernelWebhookHandler) handleCheckoutCompleted(event *stripe.Event, appID string) error {
	var session stripe.CheckoutSession
	if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
		return fmt.Errorf("erro ao parsear checkout session: %w", err)
	}

	// Extrair plan_id do metadata
	planID := session.Metadata["kernel_plan"]
	if planID == "" {
		return errors.New("kernel_plan não encontrado no metadata")
	}

	// Atualizar subscription no kernel
	sub, err := h.billingService.GetOrCreateSubscription(appID)
	if err != nil {
		return err
	}

	// Atualizar com dados do Stripe
	sub.PlanID = planID
	sub.Status = SubscriptionStatusActive
	sub.CurrentPeriodStart = time.Now()
	sub.CurrentPeriodEnd = time.Now().AddDate(0, 1, 0)
	sub.UpdatedAt = time.Now()

	// Salvar stripe_subscription_id para referência futura
	// (adicionar campo se necessário)

	if err := h.db.Save(sub).Error; err != nil {
		return err
	}

	log.Printf("✅ [KERNEL_WEBHOOK] Checkout completado: app %s -> plano %s", appID, planID)
	return nil
}

// ========================================
// INVOICE HANDLERS
// ========================================

// handleInvoicePaymentFailed processa falha de pagamento
// Cenário 2: Cartão recusado na renovação
func (h *KernelWebhookHandler) handleInvoicePaymentFailed(event *stripe.Event, appID string) error {
	var inv stripe.Invoice
	if err := json.Unmarshal(event.Data.Raw, &inv); err != nil {
		return fmt.Errorf("erro ao parsear invoice: %w", err)
	}

	// Atualizar subscription para past_due
	sub, err := h.billingService.GetSubscription(appID)
	if err != nil {
		return err
	}

	sub.Status = SubscriptionStatusPastDue
	sub.UpdatedAt = time.Now()

	if err := h.db.Save(sub).Error; err != nil {
		return err
	}

	// Criar alerta financeiro
	if h.alertService != nil {
		h.alertService.CreateAlert(
			"payment_failed",
			"high",
			appID,
			map[string]interface{}{
				"invoice_id":    inv.ID,
				"amount":        inv.AmountDue,
				"attempt_count": inv.AttemptCount,
			},
		)
	}

	// Atualizar invoice no kernel
	h.updateKernelInvoice(appID, inv.ID, InvoiceStatusOverdue, inv.AmountDue)

	log.Printf("⚠️ [KERNEL_WEBHOOK] Pagamento falhou: app %s, invoice %s", appID, inv.ID)
	return nil
}

// handleInvoicePaid processa pagamento bem-sucedido
// Cenário 2 (recovery), 8: Pagamento sucesso
// Cenário 12: Detectar double charge
func (h *KernelWebhookHandler) handleInvoicePaid(event *stripe.Event, appID string) error {
	var inv stripe.Invoice
	if err := json.Unmarshal(event.Data.Raw, &inv); err != nil {
		return fmt.Errorf("erro ao parsear invoice: %w", err)
	}

	// Cenário 12: Verificar double charge
	if h.detectDoubleCharge(appID, inv.ID, inv.AmountPaid) {
		log.Printf("🔴 [KERNEL_WEBHOOK] Possível double charge detectado: app %s, invoice %s", appID, inv.ID)
		// Não processar, apenas alertar
		return nil
	}

	// Atualizar subscription para active
	sub, err := h.billingService.GetSubscription(appID)
	if err != nil {
		// Cenário 4: Subscription não existe ainda (webhook fora de ordem)
		// Criar subscription on-demand
		sub, err = h.billingService.GetOrCreateSubscription(appID)
		if err != nil {
			return err
		}
	}

	// Se estava em past_due, voltar para active
	if sub.Status == SubscriptionStatusPastDue {
		sub.Status = SubscriptionStatusActive
		sub.UpdatedAt = time.Now()

		if err := h.db.Save(sub).Error; err != nil {
			return err
		}

		// Resolver alertas de payment_failed
		// (implementar se necessário)
	}

	// Atualizar invoice no kernel
	h.updateKernelInvoice(appID, inv.ID, InvoiceStatusPaid, inv.AmountPaid)

	log.Printf("✅ [KERNEL_WEBHOOK] Invoice paga: app %s, invoice %s, valor %d", appID, inv.ID, inv.AmountPaid)
	return nil
}

// ========================================
// SUBSCRIPTION HANDLERS
// ========================================

// handleSubscriptionCreated processa criação de subscription
// Cenário 4: Webhook fora de ordem (pode chegar depois de invoice.paid)
func (h *KernelWebhookHandler) handleSubscriptionCreated(event *stripe.Event, appID string) error {
	var stripeSub stripe.Subscription
	if err := json.Unmarshal(event.Data.Raw, &stripeSub); err != nil {
		return fmt.Errorf("erro ao parsear subscription: %w", err)
	}

	// Buscar ou criar subscription no kernel
	sub, err := h.billingService.GetOrCreateSubscription(appID)
	if err != nil {
		return err
	}

	// Atualizar com dados do Stripe
	planID := stripeSub.Metadata["kernel_plan"]
	if planID != "" {
		sub.PlanID = planID
	}

	sub.Status = mapStripeStatus(string(stripeSub.Status))
	sub.CurrentPeriodStart = time.Unix(stripeSub.CurrentPeriodStart, 0)
	sub.CurrentPeriodEnd = time.Unix(stripeSub.CurrentPeriodEnd, 0)
	sub.UpdatedAt = time.Now()

	if err := h.db.Save(sub).Error; err != nil {
		return err
	}

	log.Printf("✅ [KERNEL_WEBHOOK] Subscription criada: app %s, status %s", appID, sub.Status)
	return nil
}

// handleSubscriptionUpdated processa atualização de subscription
// Cenário 7: App cancela no Stripe direto
// Cenário 9: Upgrade no meio do ciclo
// Cenário 10: Downgrade + cancelamento
func (h *KernelWebhookHandler) handleSubscriptionUpdated(event *stripe.Event, appID string) error {
	var stripeSub stripe.Subscription
	if err := json.Unmarshal(event.Data.Raw, &stripeSub); err != nil {
		return fmt.Errorf("erro ao parsear subscription: %w", err)
	}

	sub, err := h.billingService.GetSubscription(appID)
	if err != nil {
		return err
	}

	// Detectar mudanças
	oldStatus := sub.Status
	newStatus := mapStripeStatus(string(stripeSub.Status))

	// Atualizar dados
	sub.Status = newStatus
	sub.CurrentPeriodStart = time.Unix(stripeSub.CurrentPeriodStart, 0)
	sub.CurrentPeriodEnd = time.Unix(stripeSub.CurrentPeriodEnd, 0)
	sub.CancelAtPeriodEnd = stripeSub.CancelAtPeriodEnd

	// Cenário 9: Upgrade - atualizar plano imediatamente
	newPlanID := stripeSub.Metadata["kernel_plan"]
	if newPlanID != "" && newPlanID != sub.PlanID {
		sub.PlanID = newPlanID
		log.Printf("⬆️ [KERNEL_WEBHOOK] Plano atualizado: app %s -> %s", appID, newPlanID)
	}

	// Cenário 10: Cancelamento tem prioridade sobre downgrade
	if stripeSub.CancelAtPeriodEnd && sub.PendingPlanID != nil {
		sub.PendingPlanID = nil
		sub.PendingFrom = nil
		log.Printf("⚠️ [KERNEL_WEBHOOK] Downgrade pendente cancelado devido a cancelamento: app %s", appID)
	}

	sub.UpdatedAt = time.Now()

	if err := h.db.Save(sub).Error; err != nil {
		return err
	}

	// Cenário 7: Alertar se cancelado externamente
	if oldStatus != SubscriptionStatusCanceled && newStatus == SubscriptionStatusCanceled {
		if h.alertService != nil {
			h.alertService.CreateAlert(
				"subscription_canceled_externally",
				"medium",
				appID,
				map[string]interface{}{
					"stripe_subscription_id": stripeSub.ID,
					"source":                 "stripe_direct",
				},
			)
		}
	}

	log.Printf("✅ [KERNEL_WEBHOOK] Subscription atualizada: app %s, %s -> %s", appID, oldStatus, newStatus)
	return nil
}

// handleSubscriptionDeleted processa deleção de subscription
// Cenário 7: App cancela no Stripe direto
func (h *KernelWebhookHandler) handleSubscriptionDeleted(event *stripe.Event, appID string) error {
	var stripeSub stripe.Subscription
	if err := json.Unmarshal(event.Data.Raw, &stripeSub); err != nil {
		return fmt.Errorf("erro ao parsear subscription: %w", err)
	}

	sub, err := h.billingService.GetSubscription(appID)
	if err != nil {
		return err
	}

	now := time.Now()
	sub.Status = SubscriptionStatusCanceled
	sub.CanceledAt = &now
	sub.UpdatedAt = now

	if err := h.db.Save(sub).Error; err != nil {
		return err
	}

	// Criar alerta
	if h.alertService != nil {
		h.alertService.CreateAlert(
			"subscription_deleted",
			"high",
			appID,
			map[string]interface{}{
				"stripe_subscription_id": stripeSub.ID,
			},
		)
	}

	log.Printf("❌ [KERNEL_WEBHOOK] Subscription deletada: app %s", appID)
	return nil
}

// handlePaymentMethodAttached processa novo método de pagamento
// Cenário 8: Usuário troca cartão durante retry
func (h *KernelWebhookHandler) handlePaymentMethodAttached(event *stripe.Event, appID string) error {
	// Apenas logar - o retry automático do Stripe usará o novo cartão
	log.Printf("ℹ️ [KERNEL_WEBHOOK] Novo método de pagamento: app %s", appID)
	return nil
}

// ========================================
// HELPER FUNCTIONS
// ========================================

// IdempotencyResult resultado da verificação de idempotência
type IdempotencyResult struct {
	IsDuplicate bool
	WebhookID   string
}

// checkIdempotency verifica se webhook já foi processado
func (h *KernelWebhookHandler) checkIdempotency(eventID, eventType string, payload []byte) (*IdempotencyResult, error) {
	hash := sha256.Sum256(payload)
	payloadHash := hex.EncodeToString(hash[:])

	record := KernelProcessedWebhook{
		ID:              uuid.New().String(),
		Provider:        "stripe_kernel",
		ExternalEventID: eventID,
		EventType:       eventType,
		PayloadHash:     payloadHash,
		Status:          "processing",
		ReceivedAt:      time.Now(),
		CreatedAt:       time.Now(),
	}

	result := h.db.Create(&record)
	if result.Error != nil {
		// Verificar se é unique constraint
		if isUniqueConstraintError(result.Error) {
			return &IdempotencyResult{IsDuplicate: true}, nil
		}
		return nil, result.Error
	}

	return &IdempotencyResult{
		IsDuplicate: false,
		WebhookID:   record.ID,
	}, nil
}

// extractAppID extrai app_id do evento
func (h *KernelWebhookHandler) extractAppID(event *stripe.Event) (string, error) {
	// Tentar extrair de diferentes tipos de evento
	var metadata map[string]string

	switch event.Type {
	case "checkout.session.completed":
		var session stripe.CheckoutSession
		json.Unmarshal(event.Data.Raw, &session)
		metadata = session.Metadata
	case "invoice.paid", "invoice.payment_failed":
		var inv stripe.Invoice
		json.Unmarshal(event.Data.Raw, &inv)
		if inv.Subscription != nil {
			metadata = inv.Subscription.Metadata
		}
	case "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted":
		var sub stripe.Subscription
		json.Unmarshal(event.Data.Raw, &sub)
		metadata = sub.Metadata
	}

	if appID, ok := metadata["kernel_app_id"]; ok && appID != "" {
		return appID, nil
	}

	return "", errors.New("kernel_app_id não encontrado no metadata")
}

// appExists verifica se app existe
func (h *KernelWebhookHandler) appExists(appID string) bool {
	var count int64
	h.db.Table("applications").Where("id = ?", appID).Count(&count)
	return count > 0
}

// markWebhookProcessed marca webhook como processado
func (h *KernelWebhookHandler) markWebhookProcessed(webhookID string) {
	now := time.Now()
	h.db.Model(&KernelProcessedWebhook{}).
		Where("id = ?", webhookID).
		Updates(map[string]interface{}{
			"status":       "processed",
			"processed_at": &now,
		})
}

// markWebhookFailed marca webhook como falho
func (h *KernelWebhookHandler) markWebhookFailed(webhookID, errorMsg string) {
	now := time.Now()
	h.db.Model(&KernelProcessedWebhook{}).
		Where("id = ?", webhookID).
		Updates(map[string]interface{}{
			"status":        "failed",
			"error_message": errorMsg,
			"processed_at":  &now,
		})
}

// markWebhookIgnored marca webhook como ignorado
func (h *KernelWebhookHandler) markWebhookIgnored(webhookID, reason string) {
	now := time.Now()
	h.db.Model(&KernelProcessedWebhook{}).
		Where("id = ?", webhookID).
		Updates(map[string]interface{}{
			"status":        "ignored",
			"error_message": reason,
			"processed_at":  &now,
		})
}

// createOrphanAlert cria alerta para webhook órfão
func (h *KernelWebhookHandler) createOrphanAlert(eventID, eventType, reason string) {
	if h.alertService != nil {
		h.alertService.CreateAlert(
			"orphan_webhook",
			"medium",
			"",
			map[string]interface{}{
				"event_id":   eventID,
				"event_type": eventType,
				"reason":     reason,
			},
		)
	}
}

// detectDoubleCharge detecta possível cobrança duplicada
// Cenário 12: Invoice paga duas vezes
func (h *KernelWebhookHandler) detectDoubleCharge(appID, invoiceID string, amount int64) bool {
	var existing KernelInvoice
	err := h.db.Where("app_id = ? AND id LIKE ?", appID, "%"+invoiceID+"%").
		Where("status = ?", InvoiceStatusPaid).
		First(&existing).Error

	if err == nil && existing.Total == amount {
		// Já existe invoice paga com mesmo valor
		if h.alertService != nil {
			h.alertService.CreateAlert(
				"possible_double_charge",
				"critical",
				appID,
				map[string]interface{}{
					"invoice_id": invoiceID,
					"amount":     amount,
					"action":     "manual_review_required",
				},
			)
		}
		return true
	}
	return false
}

// updateKernelInvoice atualiza ou cria invoice no kernel
func (h *KernelWebhookHandler) updateKernelInvoice(appID, stripeInvoiceID string, status InvoiceStatus, amount int64) {
	// Buscar invoice existente ou criar nova
	var invoice KernelInvoice
	err := h.db.Where("app_id = ? AND id LIKE ?", appID, "%"+stripeInvoiceID+"%").First(&invoice).Error

	if err == gorm.ErrRecordNotFound {
		// Criar nova invoice
		now := time.Now()
		invoice = KernelInvoice{
			ID:          fmt.Sprintf("kinv_%s", stripeInvoiceID),
			AppID:       appID,
			Total:       amount,
			Status:      status,
			PeriodStart: now.AddDate(0, -1, 0),
			PeriodEnd:   now,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		if status == InvoiceStatusPaid {
			invoice.PaidAt = &now
		}
		h.db.Create(&invoice)
	} else if err == nil {
		// Atualizar existente
		invoice.Status = status
		invoice.Total = amount
		invoice.UpdatedAt = time.Now()
		if status == InvoiceStatusPaid {
			now := time.Now()
			invoice.PaidAt = &now
		}
		h.db.Save(&invoice)
	}
}

// mapStripeStatus mapeia status do Stripe para status do kernel
func mapStripeStatus(stripeStatus string) SubscriptionStatus {
	switch stripeStatus {
	case "active":
		return SubscriptionStatusActive
	case "past_due":
		return SubscriptionStatusPastDue
	case "canceled":
		return SubscriptionStatusCanceled
	case "trialing":
		return SubscriptionStatusTrialing
	case "paused":
		return SubscriptionStatusPaused
	default:
		return SubscriptionStatusActive
	}
}

// isRetryableWebhookError verifica se erro permite retry
func isRetryableWebhookError(err error) bool {
	errStr := err.Error()
	// Erros de banco = retry
	if contains(errStr, "database") || contains(errStr, "locked") || contains(errStr, "timeout") {
		return true
	}
	// Erros de validação = não retry
	return false
}

// isUniqueConstraintError verifica se é erro de unique constraint
func isUniqueConstraintError(err error) bool {
	if err == nil {
		return false
	}
	errStr := err.Error()
	return contains(errStr, "UNIQUE constraint failed") ||
		contains(errStr, "duplicate key") ||
		contains(errStr, "Duplicate entry")
}

func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
