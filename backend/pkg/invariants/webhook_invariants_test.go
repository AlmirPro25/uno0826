package invariants

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// ========================================
// TESTES DE DELIVERY
// ========================================

func TestAssertWebhookDelivered_Success_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookDelivered("webhook-123", 200, 1, 5)

	violations := GetViolations()
	assert.Empty(t, violations, "Webhook entregue não deveria gerar violação")
	t.Log("✅ Webhook entregue passou")
}

func TestAssertWebhookDelivered_FailedWithRetries_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookDelivered("webhook-123", 500, 2, 5)

	violations := GetViolations()
	assert.Empty(t, violations, "Webhook com retries restantes não deveria gerar violação")
	t.Log("✅ Webhook com retries restantes passou")
}

func TestAssertWebhookDelivered_FailedMaxRetries_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookDelivered("webhook-123", 500, 5, 5)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar webhook que falhou após max retries")
	assert.Equal(t, "webhook_delivery_failed", violations[0].Invariant)
	t.Logf("✅ Detectou webhook falho: %s", violations[0].Message)
}

func TestAssertWebhookRetryScheduled_Scheduled_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookRetryScheduled("webhook-123", true, 500)

	violations := GetViolations()
	assert.Empty(t, violations, "Retry agendado não deveria gerar violação")
	t.Log("✅ Retry agendado passou")
}

func TestAssertWebhookRetryScheduled_NotScheduled_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookRetryScheduled("webhook-123", false, 500)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar retry não agendado")
	assert.Equal(t, "webhook_retry_not_scheduled", violations[0].Invariant)
	t.Logf("✅ Detectou retry não agendado: %s", violations[0].Message)
}

func TestAssertWebhookRetryScheduled_Success_NoRetryNeeded(t *testing.T) {
	ClearViolations()
	Enable()

	// Status 200 não precisa de retry
	AssertWebhookRetryScheduled("webhook-123", false, 200)

	violations := GetViolations()
	assert.Empty(t, violations, "Sucesso não precisa de retry")
	t.Log("✅ Sucesso sem retry passou")
}

func TestAssertWebhookNotExpired_Fresh_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookNotExpired("webhook-123", time.Now().Add(-1*time.Hour), 24*time.Hour)

	violations := GetViolations()
	assert.Empty(t, violations, "Webhook recente não deveria gerar violação")
	t.Log("✅ Webhook recente passou")
}

func TestAssertWebhookNotExpired_Expired_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookNotExpired("webhook-123", time.Now().Add(-48*time.Hour), 24*time.Hour)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar webhook expirado")
	assert.Equal(t, "webhook_expired", violations[0].Invariant)
	t.Logf("✅ Detectou webhook expirado: %s", violations[0].Message)
}

func TestAssertWebhookQueueNotFull_HasSpace_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookQueueNotFull(500, 1000, "app-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Fila com espaço não deveria gerar violação")
	t.Log("✅ Fila com espaço passou")
}

func TestAssertWebhookQueueNotFull_Full_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookQueueNotFull(1000, 1000, "app-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar fila cheia")
	assert.Equal(t, "webhook_queue_full", violations[0].Invariant)
	t.Logf("✅ Detectou fila cheia: %s", violations[0].Message)
}


// ========================================
// TESTES DE SIGNATURE
// ========================================

func TestAssertWebhookSignatureValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	payload := []byte(`{"event":"test"}`)
	secret := "my-secret-key"
	signature := ComputeWebhookSignature(payload, secret)

	valid := AssertWebhookSignatureValid(payload, signature, secret)
	assert.True(t, valid)

	violations := GetViolations()
	assert.Empty(t, violations, "Assinatura válida não deveria gerar violação")
	t.Log("✅ Assinatura válida passou")
}

func TestAssertWebhookSignatureValid_Invalid_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	payload := []byte(`{"event":"test"}`)
	secret := "my-secret-key"

	valid := AssertWebhookSignatureValid(payload, "invalid-signature", secret)
	assert.False(t, valid)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar assinatura inválida")
	assert.Equal(t, "webhook_signature_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou assinatura inválida: %s", violations[0].Message)
}

func TestAssertWebhookTimestampValid_Recent_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertWebhookTimestampValid(time.Now().Add(-1*time.Minute), 5*time.Minute)
	assert.True(t, valid)

	violations := GetViolations()
	assert.Empty(t, violations, "Timestamp recente não deveria gerar violação")
	t.Log("✅ Timestamp recente passou")
}

func TestAssertWebhookTimestampValid_TooOld_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertWebhookTimestampValid(time.Now().Add(-10*time.Minute), 5*time.Minute)
	assert.False(t, valid)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar timestamp muito antigo")
	assert.Equal(t, "webhook_timestamp_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou timestamp muito antigo: %s", violations[0].Message)
}

func TestAssertWebhookTimestampValid_Future_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertWebhookTimestampValid(time.Now().Add(10*time.Minute), 5*time.Minute)
	assert.False(t, valid)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar timestamp no futuro")
	t.Logf("✅ Detectou timestamp no futuro: %s", violations[0].Message)
}

func TestAssertWebhookPayloadNotEmpty_HasContent_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookPayloadNotEmpty([]byte(`{"event":"test"}`), "webhook-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Payload com conteúdo não deveria gerar violação")
	t.Log("✅ Payload com conteúdo passou")
}

func TestAssertWebhookPayloadNotEmpty_Empty_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookPayloadNotEmpty([]byte{}, "webhook-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar payload vazio")
	assert.Equal(t, "webhook_payload_empty", violations[0].Invariant)
	t.Logf("✅ Detectou payload vazio: %s", violations[0].Message)
}

func TestAssertWebhookPayloadSizeValid_WithinLimit_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookPayloadSizeValid(1024, 10240, "webhook-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Payload dentro do limite não deveria gerar violação")
	t.Log("✅ Payload dentro do limite passou")
}

func TestAssertWebhookPayloadSizeValid_TooLarge_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookPayloadSizeValid(20480, 10240, "webhook-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar payload muito grande")
	assert.Equal(t, "webhook_payload_too_large", violations[0].Invariant)
	t.Logf("✅ Detectou payload muito grande: %s", violations[0].Message)
}

// ========================================
// TESTES DE ORDERING & DEDUPLICATION
// ========================================

func TestAssertWebhookEventOrder_InOrder_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookEventOrder("event-123", 5, 4, "app-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Evento em ordem não deveria gerar violação")
	t.Log("✅ Evento em ordem passou")
}

func TestAssertWebhookEventOrder_OutOfOrder_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookEventOrder("event-123", 3, 5, "app-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar evento fora de ordem")
	assert.Equal(t, "webhook_event_out_of_order", violations[0].Invariant)
	t.Logf("✅ Detectou evento fora de ordem: %s", violations[0].Message)
}

func TestAssertWebhookNotDuplicate_Unique_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookNotDuplicate("webhook-123", false)

	violations := GetViolations()
	assert.Empty(t, violations, "Webhook único não deveria gerar violação")
	t.Log("✅ Webhook único passou")
}

func TestAssertWebhookNotDuplicate_Duplicate_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookNotDuplicate("webhook-123", true)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar webhook duplicado")
	assert.Equal(t, "webhook_duplicate_detected", violations[0].Invariant)
	t.Logf("✅ Detectou webhook duplicado: %s", violations[0].Message)
}

func TestAssertIdempotencyKeyUnique_Unique_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertIdempotencyKeyUnique("idem-key-123", true, "create_order")

	violations := GetViolations()
	assert.Empty(t, violations, "Idempotency key única não deveria gerar violação")
	t.Log("✅ Idempotency key única passou")
}

func TestAssertIdempotencyKeyUnique_Duplicate_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertIdempotencyKeyUnique("idem-key-123", false, "create_order")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar idempotency key duplicada")
	assert.Equal(t, "idempotency_key_duplicate", violations[0].Invariant)
	t.Logf("✅ Detectou idempotency key duplicada: %s", violations[0].Message)
}


// ========================================
// TESTES DE ENDPOINT HEALTH
// ========================================

func TestAssertWebhookEndpointHealthy_Healthy_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookEndpointHealthy("https://api.example.com/webhook", 0.95, 0.90)

	violations := GetViolations()
	assert.Empty(t, violations, "Endpoint saudável não deveria gerar violação")
	t.Log("✅ Endpoint saudável passou")
}

func TestAssertWebhookEndpointHealthy_Unhealthy_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookEndpointHealthy("https://api.example.com/webhook", 0.50, 0.90)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar endpoint não saudável")
	assert.Equal(t, "webhook_endpoint_unhealthy", violations[0].Invariant)
	t.Logf("✅ Detectou endpoint não saudável: %s", violations[0].Message)
}

func TestAssertWebhookEndpointResponsive_Fast_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookEndpointResponsive("https://api.example.com/webhook", 500*time.Millisecond, 5*time.Second)

	violations := GetViolations()
	assert.Empty(t, violations, "Endpoint rápido não deveria gerar violação")
	t.Log("✅ Endpoint rápido passou")
}

func TestAssertWebhookEndpointResponsive_Slow_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookEndpointResponsive("https://api.example.com/webhook", 10*time.Second, 5*time.Second)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar endpoint lento")
	assert.Equal(t, "webhook_endpoint_slow", violations[0].Invariant)
	t.Logf("✅ Detectou endpoint lento: %s", violations[0].Message)
}

func TestAssertWebhookEndpointNotDisabled_Enabled_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookEndpointNotDisabled("https://api.example.com/webhook", false, "app-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Endpoint habilitado não deveria gerar violação")
	t.Log("✅ Endpoint habilitado passou")
}

func TestAssertWebhookEndpointNotDisabled_Disabled_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWebhookEndpointNotDisabled("https://api.example.com/webhook", true, "app-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar endpoint desabilitado")
	assert.Equal(t, "webhook_endpoint_disabled", violations[0].Invariant)
	t.Logf("✅ Detectou endpoint desabilitado: %s", violations[0].Message)
}

// ========================================
// TESTES DE EVENT TYPES
// ========================================

func TestAssertWebhookEventTypeValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	validTypes := []string{"user.created", "user.updated", "order.completed"}
	valid := AssertWebhookEventTypeValid("user.created", validTypes)
	assert.True(t, valid)

	violations := GetViolations()
	assert.Empty(t, violations, "Tipo de evento válido não deveria gerar violação")
	t.Log("✅ Tipo de evento válido passou")
}

func TestAssertWebhookEventTypeValid_Invalid_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	validTypes := []string{"user.created", "user.updated", "order.completed"}
	valid := AssertWebhookEventTypeValid("unknown.event", validTypes)
	assert.False(t, valid)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar tipo de evento inválido")
	assert.Equal(t, "webhook_event_type_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou tipo de evento inválido: %s", violations[0].Message)
}

func TestAssertWebhookEventTypeSubscribed_Subscribed_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	subscribedTypes := []string{"user.created", "user.updated"}
	subscribed := AssertWebhookEventTypeSubscribed("user.created", subscribedTypes, "app-123")
	assert.True(t, subscribed)

	violations := GetViolations()
	assert.Empty(t, violations, "Evento inscrito não deveria gerar violação")
	t.Log("✅ Evento inscrito passou")
}

func TestAssertWebhookEventTypeSubscribed_Wildcard_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	subscribedTypes := []string{"*"}
	subscribed := AssertWebhookEventTypeSubscribed("any.event", subscribedTypes, "app-123")
	assert.True(t, subscribed)

	violations := GetViolations()
	assert.Empty(t, violations, "Wildcard deveria aceitar qualquer evento")
	t.Log("✅ Wildcard passou")
}

func TestAssertWebhookEventTypeSubscribed_NotSubscribed_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	subscribedTypes := []string{"user.created"}
	subscribed := AssertWebhookEventTypeSubscribed("order.completed", subscribedTypes, "app-123")
	assert.False(t, subscribed)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar evento não inscrito")
	assert.Equal(t, "webhook_event_not_subscribed", violations[0].Invariant)
	t.Logf("✅ Detectou evento não inscrito: %s", violations[0].Message)
}

// ========================================
// TESTES DE RETRY POLICY
// ========================================

func TestAssertRetryBackoffValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRetryBackoffValid(2, 30*time.Second, 10*time.Second, 5*time.Minute)

	violations := GetViolations()
	assert.Empty(t, violations, "Backoff válido não deveria gerar violação")
	t.Log("✅ Backoff válido passou")
}

func TestAssertRetryBackoffValid_TooShort_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRetryBackoffValid(2, 1*time.Second, 10*time.Second, 5*time.Minute)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar backoff muito curto")
	assert.Equal(t, "webhook_retry_backoff_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou backoff muito curto: %s", violations[0].Message)
}

func TestAssertRetryBackoffValid_TooLong_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRetryBackoffValid(2, 10*time.Minute, 10*time.Second, 5*time.Minute)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar backoff muito longo")
	t.Logf("✅ Detectou backoff muito longo: %s", violations[0].Message)
}

func TestAssertMaxRetriesNotExceeded_WithinLimit_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertMaxRetriesNotExceeded(3, 5, "webhook-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Retries dentro do limite não deveria gerar violação")
	t.Log("✅ Retries dentro do limite passou")
}

func TestAssertMaxRetriesNotExceeded_Exceeded_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertMaxRetriesNotExceeded(6, 5, "webhook-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar max retries excedido")
	assert.Equal(t, "webhook_max_retries_exceeded", violations[0].Invariant)
	t.Logf("✅ Detectou max retries excedido: %s", violations[0].Message)
}

// ========================================
// TESTE DE INTEGRAÇÃO
// ========================================

func TestWebhookInvariants_FullDeliveryFlow(t *testing.T) {
	ClearViolations()
	Enable()

	webhookID := "webhook-123"
	appID := "app-456"
	secret := "webhook-secret"
	payload := []byte(`{"event":"user.created","data":{"id":"user-789"}}`)

	// 1. Verificar fila
	AssertWebhookQueueNotFull(100, 1000, appID)

	// 2. Verificar assinatura
	signature := ComputeWebhookSignature(payload, secret)
	AssertWebhookSignatureValid(payload, signature, secret)

	// 3. Verificar timestamp
	AssertWebhookTimestampValid(time.Now(), 5*time.Minute)

	// 4. Verificar payload
	AssertWebhookPayloadNotEmpty(payload, webhookID)
	AssertWebhookPayloadSizeValid(int64(len(payload)), 10240, webhookID)

	// 5. Verificar tipo de evento
	AssertWebhookEventTypeValid("user.created", []string{"user.created", "user.updated"})
	AssertWebhookEventTypeSubscribed("user.created", []string{"user.*"}, appID)

	// 6. Verificar endpoint
	AssertWebhookEndpointNotDisabled("https://api.example.com/webhook", false, appID)
	AssertWebhookEndpointHealthy("https://api.example.com/webhook", 0.99, 0.90)

	// 7. Verificar entrega
	AssertWebhookDelivered(webhookID, 200, 1, 5)

	violations := GetViolations()
	assert.Empty(t, violations, "Fluxo completo de webhook não deveria gerar violações")
	t.Log("✅ Fluxo completo de webhook passou")
}

func TestWebhookInvariants_FailedDeliveryWithRetry(t *testing.T) {
	ClearViolations()
	Enable()

	webhookID := "webhook-failed"

	// Simular falha de entrega
	AssertWebhookDelivered(webhookID, 500, 1, 5)

	// Verificar que retry foi agendado
	AssertWebhookRetryScheduled(webhookID, true, 500)

	// Verificar backoff
	AssertRetryBackoffValid(1, 30*time.Second, 10*time.Second, 5*time.Minute)

	// Verificar que não excedeu max retries
	AssertMaxRetriesNotExceeded(1, 5, webhookID)

	violations := GetViolations()
	assert.Empty(t, violations, "Falha com retry não deveria gerar violações")
	t.Log("✅ Falha com retry passou")
}

func TestWebhookInvariants_ReplayAttack(t *testing.T) {
	ClearViolations()
	Enable()

	// Simular replay attack com timestamp antigo
	oldTimestamp := time.Now().Add(-1 * time.Hour)
	AssertWebhookTimestampValid(oldTimestamp, 5*time.Minute)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar replay attack")
	assert.Equal(t, "webhook_timestamp_invalid", violations[0].Invariant)
	t.Log("✅ Replay attack detectado")
}
