package controllers

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

// WebhookController gerencia webhooks de integrações externas
type WebhookController struct {
	// stripeService *services.StripeService
	// smsService    *services.SMSService
}

// NewWebhookController cria uma nova instância do controller
func NewWebhookController() *WebhookController {
	return &WebhookController{}
}

// StripeWebhook processa webhooks do Stripe
// POST /webhooks/stripe
func (c *WebhookController) StripeWebhook(ctx *gin.Context) {
	// Ler body
	body, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao ler requisição"})
		return
	}

	// Obter assinatura do header
	signature := ctx.GetHeader("Stripe-Signature")

	// Parsear evento
	var event map[string]interface{}
	if err := json.Unmarshal(body, &event); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	// Processar evento baseado no tipo
	eventType, _ := event["type"].(string)

	switch eventType {
	case "payment_intent.succeeded":
		c.handlePaymentSucceeded(ctx, event)
	case "payment_intent.payment_failed":
		c.handlePaymentFailed(ctx, event)
	case "charge.refunded":
		c.handleChargeRefunded(ctx, event)
	case "customer.subscription.created":
		c.handleSubscriptionCreated(ctx, event)
	case "customer.subscription.deleted":
		c.handleSubscriptionDeleted(ctx, event)
	default:
		// Evento não tratado, mas retornar sucesso
		ctx.JSON(http.StatusOK, gin.H{"received": true, "type": eventType})
		return
	}

	_ = signature // Usar para verificação em produção
}

func (c *WebhookController) handlePaymentSucceeded(ctx *gin.Context, event map[string]interface{}) {
	// Extrair dados do pagamento
	data, _ := event["data"].(map[string]interface{})
	object, _ := data["object"].(map[string]interface{})
	
	paymentIntentID, _ := object["id"].(string)
	amount, _ := object["amount"].(float64)
	
	// Extrair metadata (appointment_id)
	metadata, _ := object["metadata"].(map[string]interface{})
	appointmentID, _ := metadata["appointment_id"].(string)

	// TODO: Atualizar status do pagamento no banco
	// TODO: Enviar email de confirmação
	// TODO: Atualizar status da consulta

	ctx.JSON(http.StatusOK, gin.H{
		"received":       true,
		"payment_id":     paymentIntentID,
		"amount":         amount,
		"appointment_id": appointmentID,
	})
}

func (c *WebhookController) handlePaymentFailed(ctx *gin.Context, event map[string]interface{}) {
	data, _ := event["data"].(map[string]interface{})
	object, _ := data["object"].(map[string]interface{})
	
	paymentIntentID, _ := object["id"].(string)
	
	// Extrair erro
	lastError, _ := object["last_payment_error"].(map[string]interface{})
	errorMessage, _ := lastError["message"].(string)

	// TODO: Notificar usuário sobre falha
	// TODO: Atualizar status do pagamento

	ctx.JSON(http.StatusOK, gin.H{
		"received":   true,
		"payment_id": paymentIntentID,
		"error":      errorMessage,
	})
}

func (c *WebhookController) handleChargeRefunded(ctx *gin.Context, event map[string]interface{}) {
	data, _ := event["data"].(map[string]interface{})
	object, _ := data["object"].(map[string]interface{})
	
	chargeID, _ := object["id"].(string)
	amountRefunded, _ := object["amount_refunded"].(float64)

	// TODO: Atualizar status do pagamento para reembolsado
	// TODO: Notificar usuário

	ctx.JSON(http.StatusOK, gin.H{
		"received":        true,
		"charge_id":       chargeID,
		"amount_refunded": amountRefunded,
	})
}

func (c *WebhookController) handleSubscriptionCreated(ctx *gin.Context, event map[string]interface{}) {
	// Para planos de assinatura (futuro)
	ctx.JSON(http.StatusOK, gin.H{"received": true})
}

func (c *WebhookController) handleSubscriptionDeleted(ctx *gin.Context, event map[string]interface{}) {
	// Para cancelamento de assinatura (futuro)
	ctx.JSON(http.StatusOK, gin.H{"received": true})
}

// JitsiWebhook processa webhooks do Jitsi (eventos de videochamada)
// POST /webhooks/jitsi
func (c *WebhookController) JitsiWebhook(ctx *gin.Context) {
	var event map[string]interface{}
	if err := ctx.ShouldBindJSON(&event); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	eventType, _ := event["event"].(string)

	switch eventType {
	case "room_created":
		// Sala criada
	case "room_destroyed":
		// Sala encerrada
	case "participant_joined":
		// Participante entrou
	case "participant_left":
		// Participante saiu
	}

	ctx.JSON(http.StatusOK, gin.H{"received": true, "event": eventType})
}

// TwilioWebhook processa webhooks do Twilio (status de SMS)
// POST /webhooks/twilio
func (c *WebhookController) TwilioWebhook(ctx *gin.Context) {
	// Twilio envia dados como form-urlencoded
	messageSID := ctx.PostForm("MessageSid")
	messageStatus := ctx.PostForm("MessageStatus")
	to := ctx.PostForm("To")
	errorCode := ctx.PostForm("ErrorCode")

	// Processar status
	switch messageStatus {
	case "delivered":
		// SMS entregue com sucesso
	case "failed":
		// Falha no envio
		// TODO: Log do erro, tentar reenviar
	case "undelivered":
		// Não entregue
	}

	// Twilio espera resposta vazia ou TwiML
	ctx.String(http.StatusOK, "")

	_ = messageSID
	_ = to
	_ = errorCode
}

// HealthWebhook endpoint para monitoramento externo
// POST /webhooks/health
func (c *WebhookController) HealthWebhook(ctx *gin.Context) {
	var payload map[string]interface{}
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	// Processar alertas de monitoramento (UptimeRobot, Pingdom, etc.)
	alertType, _ := payload["alert_type"].(string)
	
	switch alertType {
	case "down":
		// Sistema detectado como offline
		// TODO: Enviar alerta para equipe
	case "up":
		// Sistema voltou ao normal
	}

	ctx.JSON(http.StatusOK, gin.H{"received": true})
}

// GenericWebhook endpoint genérico para integrações customizadas
// POST /webhooks/custom/:integration
func (c *WebhookController) GenericWebhook(ctx *gin.Context) {
	integration := ctx.Param("integration")
	
	var payload map[string]interface{}
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	// Log do webhook recebido
	// TODO: Salvar em banco para processamento assíncrono

	ctx.JSON(http.StatusOK, gin.H{
		"received":    true,
		"integration": integration,
	})
}
