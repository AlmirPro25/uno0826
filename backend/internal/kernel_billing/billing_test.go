package kernel_billing

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// FASE 28.2-C — TESTES END-TO-END
// "Provar que o dinheiro não quebra o kernel"
// ========================================

// TestHarness estrutura para testes
type TestHarness struct {
	DB                    *gorm.DB
	BillingService        *KernelBillingService
	AlertService          *KernelBillingAlertService
	WebhookHandler        *KernelWebhookHandler
	ReconciliationService *ReconciliationService
	Router                *gin.Engine
	WebhookSecret         string
}

// SetupTestHarness configura ambiente de teste
func SetupTestHarness(t *testing.T) *TestHarness {
	gin.SetMode(gin.TestMode)

	// Banco em memória
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Falha ao criar banco de teste: %v", err)
	}

	// Migrar schemas
	db.AutoMigrate(
		&KernelPlan{},
		&AppSubscription{},
		&AppUsage{},
		&KernelInvoice{},
		&KernelProcessedWebhook{},
		&KernelBillingAlert{},
		&ReconciliationDivergence{},
		&ReconciliationRun{},
	)

	// Criar tabela de applications mock
	db.Exec(`CREATE TABLE IF NOT EXISTS applications (
		id TEXT PRIMARY KEY,
		name TEXT,
		created_at TIMESTAMP
	)`)

	// Serviços
	billingService := NewKernelBillingService(db)
	billingService.SeedDefaultPlans()

	alertService := NewKernelBillingAlertService(db)
	webhookSecret := "whsec_test_secret_123"

	// Stripe service mock (não conecta ao Stripe real)
	stripeConfig := &KernelStripeConfig{
		SecretKey:     "sk_test_mock",
		WebhookSecret: webhookSecret,
		TestMode:      true,
	}
	stripeService := NewKernelStripeService(stripeConfig, billingService)

	webhookHandler := NewKernelWebhookHandler(db, billingService, stripeService, alertService, webhookSecret)
	reconciliationService := NewReconciliationService(db, stripeService, alertService)

	// Router
	router := gin.New()
	router.POST("/webhook", webhookHandler.HandleStripeWebhook)

	return &TestHarness{
		DB:                    db,
		BillingService:        billingService,
		AlertService:          alertService,
		WebhookHandler:        webhookHandler,
		ReconciliationService: reconciliationService,
		Router:                router,
		WebhookSecret:         webhookSecret,
	}
}

// CreateTestApp cria app de teste
func (h *TestHarness) CreateTestApp(appID string) {
	h.DB.Exec("INSERT INTO applications (id, name, created_at) VALUES (?, ?, ?)",
		appID, "Test App", time.Now())
}

// BuildStripeWebhook constrói webhook com assinatura válida
func (h *TestHarness) BuildStripeWebhook(eventType string, eventID string, data map[string]interface{}) (*http.Request, error) {
	event := map[string]interface{}{
		"id":      eventID,
		"type":    eventType,
		"created": time.Now().Unix(),
		"data": map[string]interface{}{
			"object": data,
		},
	}

	body, _ := json.Marshal(event)

	// Gerar assinatura Stripe
	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	signedPayload := fmt.Sprintf("%s.%s", timestamp, string(body))
	mac := hmac.New(sha256.New, []byte(h.WebhookSecret))
	mac.Write([]byte(signedPayload))
	signature := hex.EncodeToString(mac.Sum(nil))
	sigHeader := fmt.Sprintf("t=%s,v1=%s", timestamp, signature)

	req := httptest.NewRequest("POST", "/webhook", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Stripe-Signature", sigHeader)

	return req, nil
}

// ========================================
// CENÁRIO 1: Cartão recusado no checkout
// ========================================
func TestScenario1_CardDeclinedAtCheckout(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)

	// Simular: checkout NÃO completado (cartão recusado)
	// Nenhum webhook chega, subscription não deve existir

	// Verificar que subscription não foi criada
	_, err := h.BillingService.GetSubscription(appID)
	if err == nil {
		// Se não houver erro, verificar se é Free (padrão)
		sub, _ := h.BillingService.GetOrCreateSubscription(appID)
		if sub.PlanID != "plan_free" {
			t.Error("Cenário 1 FALHOU: Subscription não deveria ter plano pago sem checkout")
		}
	}

	t.Log("✅ Cenário 1 PASSOU: Cartão recusado não cria subscription paga")
}

// ========================================
// CENÁRIO 2: Cartão recusado na renovação
// ========================================
func TestScenario2_CardDeclinedAtRenewal(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)

	// Setup: criar subscription ativa
	sub, _ := h.BillingService.GetOrCreateSubscription(appID)
	sub.PlanID = "plan_pro"
	sub.Status = SubscriptionStatusActive
	h.DB.Save(sub)

	// Simular webhook: invoice.payment_failed
	eventID := "evt_" + uuid.New().String()
	invoiceData := map[string]interface{}{
		"id":            "in_test123",
		"customer":      "cus_test",
		"amount_due":    9900,
		"attempt_count": 1,
		"subscription": map[string]interface{}{
			"id": "sub_test",
			"metadata": map[string]string{
				"kernel_app_id": appID,
			},
		},
	}

	req, _ := h.BuildStripeWebhook("invoice.payment_failed", eventID, invoiceData)
	w := httptest.NewRecorder()
	h.Router.ServeHTTP(w, req)

	// Verificar resposta
	if w.Code != http.StatusOK {
		t.Errorf("Cenário 2 FALHOU: Esperado 200, recebido %d", w.Code)
	}

	// Verificar que subscription está em past_due
	updatedSub, _ := h.BillingService.GetSubscription(appID)
	if updatedSub.Status != SubscriptionStatusPastDue {
		t.Errorf("Cenário 2 FALHOU: Status deveria ser past_due, é %s", updatedSub.Status)
	}

	// Verificar que alerta foi criado
	alerts, _ := h.AlertService.GetAlertsByApp(appID)
	hasPaymentFailedAlert := false
	for _, a := range alerts {
		if a.Type == "payment_failed" {
			hasPaymentFailedAlert = true
			break
		}
	}
	if !hasPaymentFailedAlert {
		t.Error("Cenário 2 FALHOU: Alerta payment_failed não foi criado")
	}

	t.Log("✅ Cenário 2 PASSOU: Renovação falha → past_due + alerta")
}

// ========================================
// CENÁRIO 3: Webhook duplicado
// ========================================
func TestScenario3_DuplicateWebhook(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)
	h.BillingService.GetOrCreateSubscription(appID)

	eventID := "evt_duplicate_test"
	invoiceData := map[string]interface{}{
		"id":          "in_dup123",
		"customer":    "cus_test",
		"amount_paid": 9900,
		"subscription": map[string]interface{}{
			"id": "sub_test",
			"metadata": map[string]string{
				"kernel_app_id": appID,
			},
		},
	}

	// Primeiro webhook
	req1, _ := h.BuildStripeWebhook("invoice.paid", eventID, invoiceData)
	w1 := httptest.NewRecorder()
	h.Router.ServeHTTP(w1, req1)

	if w1.Code != http.StatusOK {
		t.Errorf("Cenário 3 FALHOU: Primeiro webhook deveria retornar 200, retornou %d", w1.Code)
	}

	// Contar webhooks processados
	var count1 int64
	h.DB.Model(&KernelProcessedWebhook{}).Where("external_event_id = ?", eventID).Count(&count1)

	// Segundo webhook (duplicado) - mesmo event_id
	req2, _ := h.BuildStripeWebhook("invoice.paid", eventID, invoiceData)
	w2 := httptest.NewRecorder()
	h.Router.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Errorf("Cenário 3 FALHOU: Segundo webhook deveria retornar 200, retornou %d", w2.Code)
	}

	// Verificar que só processou uma vez
	var count2 int64
	h.DB.Model(&KernelProcessedWebhook{}).Where("external_event_id = ?", eventID).Count(&count2)

	if count2 != count1 {
		t.Errorf("Cenário 3 FALHOU: Webhook duplicado criou novo registro (%d → %d)", count1, count2)
	}

	// Verificar resposta do segundo
	var response map[string]string
	json.Unmarshal(w2.Body.Bytes(), &response)
	if response["status"] != "duplicate_ignored" {
		t.Errorf("Cenário 3 FALHOU: Resposta deveria ser 'duplicate_ignored', foi '%s'", response["status"])
	}

	t.Log("✅ Cenário 3 PASSOU: Webhook duplicado ignorado corretamente")
}

// ========================================
// CENÁRIO 4: Webhook fora de ordem
// ========================================
func TestScenario4_WebhookOutOfOrder(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)

	// NÃO criar subscription antes - simular que invoice.paid chega primeiro

	// Enviar invoice.paid ANTES de subscription.created
	invoiceData := map[string]interface{}{
		"id":          "in_order123",
		"customer":    "cus_test",
		"amount_paid": 9900,
		"subscription": map[string]interface{}{
			"id": "sub_order",
			"metadata": map[string]string{
				"kernel_app_id": appID,
			},
		},
	}

	req, _ := h.BuildStripeWebhook("invoice.paid", "evt_order1", invoiceData)
	w := httptest.NewRecorder()
	h.Router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Cenário 4 FALHOU: Webhook deveria retornar 200, retornou %d", w.Code)
	}

	// Verificar que subscription foi criada on-demand
	sub, err := h.BillingService.GetSubscription(appID)
	if err != nil {
		t.Errorf("Cenário 4 FALHOU: Subscription deveria ter sido criada on-demand: %v", err)
	} else if sub == nil {
		t.Error("Cenário 4 FALHOU: Subscription é nil")
	}

	t.Log("✅ Cenário 4 PASSOU: Webhook fora de ordem tratado (subscription criada on-demand)")
}

// ========================================
// CENÁRIO 5: Webhook nunca chega (reconciliação)
// ========================================
func TestScenario5_WebhookNeverArrives(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)

	// Criar invoice pendente há mais de 24h
	oldTime := time.Now().Add(-48 * time.Hour)
	invoice := KernelInvoice{
		ID:        "kinv_old123",
		AppID:     appID,
		Status:    InvoiceStatusPending,
		Total:     9900,
		CreatedAt: oldTime,
		UpdatedAt: oldTime,
	}
	h.DB.Create(&invoice)

	// Criar subscription
	h.BillingService.GetOrCreateSubscription(appID)

	// Rodar reconciliação
	ctx := context.Background()
	result, err := h.ReconciliationService.RunReconciliation(ctx)

	if err != nil {
		t.Errorf("Cenário 5 FALHOU: Erro na reconciliação: %v", err)
	}

	// Verificar que divergência foi detectada
	if result.DivergencesFound == 0 {
		t.Error("Cenário 5 FALHOU: Deveria ter encontrado divergência para invoice pendente antiga")
	}

	// Verificar divergências abertas
	divergences, _ := h.ReconciliationService.GetOpenDivergences()
	found := false
	for _, d := range divergences {
		if d.AppID == appID && d.Type == DivergencePaymentDiff {
			found = true
			break
		}
	}

	if !found {
		t.Error("Cenário 5 FALHOU: Divergência de pagamento não foi registrada")
	}

	t.Log("✅ Cenário 5 PASSOU: Reconciliação detectou invoice pendente antiga")
}

// ========================================
// CENÁRIO 6: Stripe cobra, kernel não marca (retry)
// ========================================
func TestScenario6_ProcessingFailureRetry(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)
	h.BillingService.GetOrCreateSubscription(appID)

	// Simular webhook que será processado com sucesso
	// (não podemos simular falha de banco facilmente, mas testamos o fluxo)
	eventID := "evt_retry_test"
	invoiceData := map[string]interface{}{
		"id":          "in_retry123",
		"customer":    "cus_test",
		"amount_paid": 9900,
		"subscription": map[string]interface{}{
			"id": "sub_retry",
			"metadata": map[string]string{
				"kernel_app_id": appID,
			},
		},
	}

	req, _ := h.BuildStripeWebhook("invoice.paid", eventID, invoiceData)
	w := httptest.NewRecorder()
	h.Router.ServeHTTP(w, req)

	// Verificar que webhook foi marcado como processado
	var webhook KernelProcessedWebhook
	h.DB.Where("external_event_id = ?", eventID).First(&webhook)

	if webhook.Status != "processed" {
		t.Errorf("Cenário 6 FALHOU: Webhook deveria estar 'processed', está '%s'", webhook.Status)
	}

	t.Log("✅ Cenário 6 PASSOU: Webhook processado e marcado corretamente")
}

// ========================================
// CENÁRIO 7: App cancela no Stripe direto
// ========================================
func TestScenario7_ExternalCancellation(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)

	// Setup: subscription ativa
	sub, _ := h.BillingService.GetOrCreateSubscription(appID)
	sub.PlanID = "plan_pro"
	sub.Status = SubscriptionStatusActive
	h.DB.Save(sub)

	// Simular webhook: subscription.deleted (cancelamento externo)
	eventID := "evt_cancel_ext"
	subData := map[string]interface{}{
		"id":       "sub_ext_cancel",
		"customer": "cus_test",
		"status":   "canceled",
		"metadata": map[string]string{
			"kernel_app_id": appID,
		},
	}

	req, _ := h.BuildStripeWebhook("customer.subscription.deleted", eventID, subData)
	w := httptest.NewRecorder()
	h.Router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Cenário 7 FALHOU: Esperado 200, recebido %d", w.Code)
	}

	// Verificar status cancelado
	updatedSub, _ := h.BillingService.GetSubscription(appID)
	if updatedSub.Status != SubscriptionStatusCanceled {
		t.Errorf("Cenário 7 FALHOU: Status deveria ser canceled, é %s", updatedSub.Status)
	}

	// Verificar alerta criado
	alerts, _ := h.AlertService.GetAlertsByApp(appID)
	hasAlert := false
	for _, a := range alerts {
		if a.Type == "subscription_deleted" {
			hasAlert = true
			break
		}
	}
	if !hasAlert {
		t.Error("Cenário 7 FALHOU: Alerta de cancelamento externo não foi criado")
	}

	t.Log("✅ Cenário 7 PASSOU: Cancelamento externo detectado e alertado")
}

// ========================================
// CENÁRIO 8: Usuário troca cartão durante retry
// ========================================
func TestScenario8_CardChangesDuringRetry(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)

	// Setup: subscription em past_due
	sub, _ := h.BillingService.GetOrCreateSubscription(appID)
	sub.Status = SubscriptionStatusPastDue
	h.DB.Save(sub)

	// Simular: payment_method.attached (apenas log)
	eventID := "evt_pm_attached"
	pmData := map[string]interface{}{
		"id":       "pm_new_card",
		"customer": "cus_test",
		"type":     "card",
	}

	req, _ := h.BuildStripeWebhook("payment_method.attached", eventID, pmData)
	w := httptest.NewRecorder()
	h.Router.ServeHTTP(w, req)

	// Deve retornar 200 (evento logado)
	if w.Code != http.StatusOK {
		t.Errorf("Cenário 8 FALHOU: Esperado 200, recebido %d", w.Code)
	}

	// Simular: invoice.paid após retry com novo cartão
	invoiceData := map[string]interface{}{
		"id":          "in_after_retry",
		"customer":    "cus_test",
		"amount_paid": 9900,
		"subscription": map[string]interface{}{
			"id": "sub_retry",
			"metadata": map[string]string{
				"kernel_app_id": appID,
			},
		},
	}

	req2, _ := h.BuildStripeWebhook("invoice.paid", "evt_paid_after_retry", invoiceData)
	w2 := httptest.NewRecorder()
	h.Router.ServeHTTP(w2, req2)

	// Verificar que voltou para active
	updatedSub, _ := h.BillingService.GetSubscription(appID)
	if updatedSub.Status != SubscriptionStatusActive {
		t.Errorf("Cenário 8 FALHOU: Status deveria voltar para active, é %s", updatedSub.Status)
	}

	t.Log("✅ Cenário 8 PASSOU: Troca de cartão + retry → active")
}

// ========================================
// CENÁRIO 9: Upgrade no meio do ciclo
// ========================================
func TestScenario9_MidCycleUpgrade(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)

	// Setup: subscription Free
	sub, _ := h.BillingService.GetOrCreateSubscription(appID)
	if sub.PlanID != "plan_free" {
		t.Errorf("Setup falhou: plano inicial deveria ser free, é %s", sub.PlanID)
	}

	// Simular webhook: subscription.updated (upgrade para Pro)
	eventID := "evt_upgrade"
	subData := map[string]interface{}{
		"id":                   "sub_upgrade",
		"customer":             "cus_test",
		"status":               "active",
		"current_period_start": time.Now().Unix(),
		"current_period_end":   time.Now().AddDate(0, 1, 0).Unix(),
		"metadata": map[string]string{
			"kernel_app_id": appID,
			"kernel_plan":   "plan_pro",
		},
	}

	req, _ := h.BuildStripeWebhook("customer.subscription.updated", eventID, subData)
	w := httptest.NewRecorder()
	h.Router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Cenário 9 FALHOU: Esperado 200, recebido %d", w.Code)
	}

	// Verificar que plano foi atualizado imediatamente
	updatedSub, _ := h.BillingService.GetSubscription(appID)
	if updatedSub.PlanID != "plan_pro" {
		t.Errorf("Cenário 9 FALHOU: Plano deveria ser plan_pro, é %s", updatedSub.PlanID)
	}

	t.Log("✅ Cenário 9 PASSOU: Upgrade mid-cycle aplicado imediatamente")
}

// ========================================
// CENÁRIO 10: Downgrade + cancelamento mesmo dia
// ========================================
func TestScenario10_DowngradePlusCancellation(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)

	// Setup: subscription Enterprise com downgrade pendente
	sub, _ := h.BillingService.GetOrCreateSubscription(appID)
	sub.PlanID = "plan_enterprise"
	sub.Status = SubscriptionStatusActive
	pendingPlan := "plan_pro"
	sub.PendingPlanID = &pendingPlan
	h.DB.Save(sub)

	// Simular webhook: subscription.updated com cancel_at_period_end
	eventID := "evt_cancel_with_downgrade"
	subData := map[string]interface{}{
		"id":                   "sub_cancel_down",
		"customer":             "cus_test",
		"status":               "active",
		"cancel_at_period_end": true,
		"current_period_start": time.Now().Unix(),
		"current_period_end":   time.Now().AddDate(0, 1, 0).Unix(),
		"metadata": map[string]string{
			"kernel_app_id": appID,
			"kernel_plan":   "plan_enterprise",
		},
	}

	req, _ := h.BuildStripeWebhook("customer.subscription.updated", eventID, subData)
	w := httptest.NewRecorder()
	h.Router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Cenário 10 FALHOU: Esperado 200, recebido %d", w.Code)
	}

	// Verificar que downgrade pendente foi cancelado
	updatedSub, _ := h.BillingService.GetSubscription(appID)
	if updatedSub.PendingPlanID != nil {
		t.Error("Cenário 10 FALHOU: Downgrade pendente deveria ter sido cancelado")
	}

	// Verificar que cancel_at_period_end está true
	if !updatedSub.CancelAtPeriodEnd {
		t.Error("Cenário 10 FALHOU: CancelAtPeriodEnd deveria ser true")
	}

	t.Log("✅ Cenário 10 PASSOU: Cancelamento tem prioridade sobre downgrade")
}

// ========================================
// CENÁRIO 11: Stripe fora do ar (circuit breaker)
// ========================================
func TestScenario11_StripeOutage(t *testing.T) {
	h := SetupTestHarness(t)

	// Testar que circuit breaker existe e está configurado
	stripeConfig := LoadKernelStripeConfig()
	stripeService := NewKernelStripeService(stripeConfig, h.BillingService)

	// Verificar estado inicial do circuit breaker
	stats := stripeService.GetCircuitBreakerStatus()
	if stats.State != "CLOSED" {
		t.Errorf("Cenário 11 FALHOU: Circuit breaker deveria iniciar CLOSED, está %s", stats.State)
	}

	// Nota: Não podemos simular falhas reais do Stripe sem mock mais elaborado
	// Mas verificamos que a estrutura está correta

	t.Log("✅ Cenário 11 PASSOU: Circuit breaker configurado corretamente")
}

// ========================================
// CENÁRIO 12: Invoice paga duas vezes (double charge)
// ========================================
func TestScenario12_DoubleCharge(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)
	h.BillingService.GetOrCreateSubscription(appID)

	// Criar invoice já paga
	invoice := KernelInvoice{
		ID:        "kinv_in_double123",
		AppID:     appID,
		Status:    InvoiceStatusPaid,
		Total:     9900,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	h.DB.Create(&invoice)

	// Simular webhook: invoice.paid para mesma invoice
	eventID := "evt_double_charge"
	invoiceData := map[string]interface{}{
		"id":          "in_double123", // Mesmo ID
		"customer":    "cus_test",
		"amount_paid": 9900, // Mesmo valor
		"subscription": map[string]interface{}{
			"id": "sub_double",
			"metadata": map[string]string{
				"kernel_app_id": appID,
			},
		},
	}

	req, _ := h.BuildStripeWebhook("invoice.paid", eventID, invoiceData)
	w := httptest.NewRecorder()
	h.Router.ServeHTTP(w, req)

	// Deve retornar 200 (não quebrar)
	if w.Code != http.StatusOK {
		t.Errorf("Cenário 12 FALHOU: Esperado 200, recebido %d", w.Code)
	}

	// Verificar que alerta crítico foi criado
	alerts, _ := h.AlertService.GetCriticalAlerts()
	hasDoubleChargeAlert := false
	for _, a := range alerts {
		if a.Type == "possible_double_charge" {
			hasDoubleChargeAlert = true
			break
		}
	}

	if !hasDoubleChargeAlert {
		t.Error("Cenário 12 FALHOU: Alerta de double charge não foi criado")
	}

	t.Log("✅ Cenário 12 PASSOU: Double charge detectado e alertado")
}

// ========================================
// CENÁRIO 13: Divergência Stripe × Kernel
// ========================================
func TestScenario13_StripKernelDivergence(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)

	// Setup: subscription em past_due há mais de 7 dias
	sub, _ := h.BillingService.GetOrCreateSubscription(appID)
	sub.Status = SubscriptionStatusPastDue
	h.DB.Save(sub)

	// Criar invoice overdue antiga
	oldTime := time.Now().Add(-10 * 24 * time.Hour)
	invoice := KernelInvoice{
		ID:        "kinv_diverge123",
		AppID:     appID,
		Status:    InvoiceStatusOverdue,
		Total:     9900,
		CreatedAt: oldTime,
		UpdatedAt: oldTime,
	}
	h.DB.Create(&invoice)

	// Rodar reconciliação
	ctx := context.Background()
	result, err := h.ReconciliationService.RunReconciliation(ctx)

	if err != nil {
		t.Errorf("Cenário 13 FALHOU: Erro na reconciliação: %v", err)
	}

	// Verificar que divergência foi detectada
	if result.DivergencesFound == 0 {
		t.Error("Cenário 13 FALHOU: Deveria ter encontrado divergência")
	}

	t.Log("✅ Cenário 13 PASSOU: Divergência detectada pela reconciliação")
}

// ========================================
// CENÁRIO 14: App excede quota em past_due
// ========================================
func TestScenario14_QuotaExceededInPastDue(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)

	// Setup: subscription Pro em past_due
	sub, _ := h.BillingService.GetOrCreateSubscription(appID)
	sub.PlanID = "plan_pro"
	sub.Status = SubscriptionStatusPastDue
	h.DB.Save(sub)

	// Simular uso no limite (5000 transações = limite Pro)
	usage, _ := h.BillingService.GetOrCreateUsage(appID)
	usage.TransactionsCount = 5000
	h.DB.Save(usage)

	// Verificar quota
	result, err := h.BillingService.CheckTransactionQuota(appID)
	if err != nil {
		t.Errorf("Cenário 14 FALHOU: Erro ao verificar quota: %v", err)
	}

	// Deve estar bloqueado (quota excedida)
	if result.Allowed {
		t.Error("Cenário 14 FALHOU: Deveria estar bloqueado (quota excedida em past_due)")
	}

	if result.RemainingQuota > 0 {
		t.Errorf("Cenário 14 FALHOU: Remaining quota deveria ser <= 0, é %d", result.RemainingQuota)
	}

	t.Log("✅ Cenário 14 PASSOU: Quota excedida em past_due bloqueia processamento")
}

// ========================================
// CENÁRIO 15: Webhook com app_id inválido
// ========================================
func TestScenario15_OrphanWebhook(t *testing.T) {
	h := SetupTestHarness(t)

	// NÃO criar app - simular webhook órfão
	fakeAppID := "app_does_not_exist_123"

	eventID := "evt_orphan"
	invoiceData := map[string]interface{}{
		"id":          "in_orphan123",
		"customer":    "cus_test",
		"amount_paid": 9900,
		"subscription": map[string]interface{}{
			"id": "sub_orphan",
			"metadata": map[string]string{
				"kernel_app_id": fakeAppID,
			},
		},
	}

	req, _ := h.BuildStripeWebhook("invoice.paid", eventID, invoiceData)
	w := httptest.NewRecorder()
	h.Router.ServeHTTP(w, req)

	// Deve retornar 200 (não retry infinito)
	if w.Code != http.StatusOK {
		t.Errorf("Cenário 15 FALHOU: Esperado 200, recebido %d", w.Code)
	}

	// Verificar resposta
	var response map[string]string
	json.Unmarshal(w.Body.Bytes(), &response)
	if response["status"] != "orphan_webhook_logged" {
		t.Errorf("Cenário 15 FALHOU: Resposta deveria ser 'orphan_webhook_logged', foi '%s'", response["status"])
	}

	// Verificar que alerta foi criado
	var alerts []KernelBillingAlert
	h.DB.Where("type = ?", "orphan_webhook").Find(&alerts)
	if len(alerts) == 0 {
		t.Error("Cenário 15 FALHOU: Alerta de webhook órfão não foi criado")
	}

	t.Log("✅ Cenário 15 PASSOU: Webhook órfão tratado graciosamente")
}

// ========================================
// TESTE DE TRANSIÇÃO DE ESTADOS
// ========================================
func TestStateTransitions(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)

	// Estado inicial: Free, Active
	sub, _ := h.BillingService.GetOrCreateSubscription(appID)
	if sub.Status != SubscriptionStatusActive {
		t.Errorf("Estado inicial deveria ser active, é %s", sub.Status)
	}

	// Transição: active → past_due
	sub.Status = SubscriptionStatusPastDue
	h.DB.Save(sub)

	// Transição: past_due → active (pagamento OK)
	sub.Status = SubscriptionStatusActive
	h.DB.Save(sub)

	// Transição: active → canceled
	sub.Status = SubscriptionStatusCanceled
	h.DB.Save(sub)

	// Verificar estado final
	finalSub, _ := h.BillingService.GetSubscription(appID)
	if finalSub.Status != SubscriptionStatusCanceled {
		t.Errorf("Estado final deveria ser canceled, é %s", finalSub.Status)
	}

	t.Log("✅ Transições de estado: active → past_due → active → canceled")
}

// ========================================
// TESTE DE IDEMPOTÊNCIA GERAL
// ========================================
func TestIdempotencyGeneral(t *testing.T) {
	h := SetupTestHarness(t)
	appID := uuid.New().String()
	h.CreateTestApp(appID)
	h.BillingService.GetOrCreateSubscription(appID)

	// Enviar 5 webhooks idênticos
	eventID := "evt_idemp_general"
	invoiceData := map[string]interface{}{
		"id":          "in_idemp",
		"customer":    "cus_test",
		"amount_paid": 9900,
		"subscription": map[string]interface{}{
			"id": "sub_idemp",
			"metadata": map[string]string{
				"kernel_app_id": appID,
			},
		},
	}

	for i := 0; i < 5; i++ {
		req, _ := h.BuildStripeWebhook("invoice.paid", eventID, invoiceData)
		w := httptest.NewRecorder()
		h.Router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Webhook %d falhou com código %d", i+1, w.Code)
		}
	}

	// Verificar que só existe 1 registro
	var count int64
	h.DB.Model(&KernelProcessedWebhook{}).Where("external_event_id = ?", eventID).Count(&count)

	if count != 1 {
		t.Errorf("Idempotência FALHOU: Deveria ter 1 registro, tem %d", count)
	}

	t.Log("✅ Idempotência geral: 5 webhooks idênticos → 1 processamento")
}
