package invariants

/*
================================================================================
WEBHOOK INVARIANTS — GARANTIAS DE ENTREGA E INTEGRIDADE
================================================================================

Estas invariants garantem que:
1. Webhooks são entregues com retry adequado
2. Payloads são assinados e verificáveis
3. Eventos não são perdidos
4. Ordem de eventos é preservada quando necessário
5. Duplicatas são detectadas e tratadas

Se estas invariants falharem, há perda de dados ou inconsistência.

================================================================================
*/

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

// ========================================
// DELIVERY GUARANTEES
// ========================================

// AssertWebhookDelivered verifica se webhook foi entregue com sucesso
// WARNING: Webhook não entregue pode causar inconsistência
func AssertWebhookDelivered(webhookID string, statusCode int, attempts int, maxAttempts int) {
	delivered := statusCode >= 200 && statusCode < 300
	Assert(
		delivered || attempts < maxAttempts,
		"webhook_delivery_failed",
		fmt.Sprintf("Webhook %s failed after %d attempts (status: %d)", webhookID, attempts, statusCode),
		map[string]interface{}{
			"webhook_id":   webhookID,
			"status_code":  statusCode,
			"attempts":     attempts,
			"max_attempts": maxAttempts,
		},
	)
}

// AssertWebhookRetryScheduled verifica se retry foi agendado após falha
// CRITICAL: Sem retry, eventos podem ser perdidos
func AssertWebhookRetryScheduled(webhookID string, retryScheduled bool, statusCode int) {
	needsRetry := statusCode >= 500 || statusCode == 429 || statusCode == 0
	if needsRetry {
		AssertCritical(
			retryScheduled,
			"webhook_retry_not_scheduled",
			fmt.Sprintf("Webhook %s failed (status %d) but retry not scheduled", webhookID, statusCode),
			map[string]interface{}{
				"webhook_id":  webhookID,
				"status_code": statusCode,
			},
		)
	}
}

// AssertWebhookNotExpired verifica se webhook não expirou
// WARNING: Webhook expirado pode indicar endpoint morto
func AssertWebhookNotExpired(webhookID string, createdAt time.Time, maxAge time.Duration) {
	age := time.Since(createdAt)
	Assert(
		age <= maxAge,
		"webhook_expired",
		fmt.Sprintf("Webhook %s expired (age: %v, max: %v)", webhookID, age, maxAge),
		map[string]interface{}{
			"webhook_id": webhookID,
			"age":        age.String(),
			"max_age":    maxAge.String(),
			"created_at": createdAt,
		},
	)
}

// AssertWebhookQueueNotFull verifica se fila de webhooks não está cheia
// CRITICAL: Fila cheia pode causar perda de eventos
func AssertWebhookQueueNotFull(queueSize, maxSize int64, appID string) {
	AssertCritical(
		queueSize < maxSize,
		"webhook_queue_full",
		fmt.Sprintf("Webhook queue full for app %s (%d/%d)", appID, queueSize, maxSize),
		map[string]interface{}{
			"app_id":     appID,
			"queue_size": queueSize,
			"max_size":   maxSize,
		},
	)
}


// ========================================
// SIGNATURE & INTEGRITY
// ========================================

// AssertWebhookSignatureValid verifica se assinatura do webhook é válida
// CRITICAL: Assinatura inválida pode indicar tampering
func AssertWebhookSignatureValid(payload []byte, signature, secret string) bool {
	expectedSig := ComputeWebhookSignature(payload, secret)
	valid := hmac.Equal([]byte(signature), []byte(expectedSig))

	AssertCritical(
		valid,
		"webhook_signature_invalid",
		"Webhook signature verification failed",
		map[string]interface{}{
			"payload_size": len(payload),
		},
	)

	return valid
}

// ComputeWebhookSignature calcula assinatura HMAC-SHA256
func ComputeWebhookSignature(payload []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return hex.EncodeToString(mac.Sum(nil))
}

// AssertWebhookTimestampValid verifica se timestamp do webhook é recente
// CRITICAL: Timestamp antigo pode indicar replay attack
func AssertWebhookTimestampValid(timestamp time.Time, tolerance time.Duration) bool {
	now := time.Now()
	diff := now.Sub(timestamp)
	if diff < 0 {
		diff = -diff
	}

	valid := diff <= tolerance

	AssertCritical(
		valid,
		"webhook_timestamp_invalid",
		fmt.Sprintf("Webhook timestamp too old/future (diff: %v, tolerance: %v)", diff, tolerance),
		map[string]interface{}{
			"timestamp":  timestamp,
			"now":        now,
			"difference": diff.String(),
			"tolerance":  tolerance.String(),
		},
	)

	return valid
}

// AssertWebhookPayloadNotEmpty verifica se payload não está vazio
// WARNING: Payload vazio pode indicar bug
func AssertWebhookPayloadNotEmpty(payload []byte, webhookID string) {
	Assert(
		len(payload) > 0,
		"webhook_payload_empty",
		fmt.Sprintf("Webhook %s has empty payload", webhookID),
		map[string]interface{}{
			"webhook_id": webhookID,
		},
	)
}

// AssertWebhookPayloadSizeValid verifica se payload não excede limite
// WARNING: Payload muito grande pode indicar bug ou ataque
func AssertWebhookPayloadSizeValid(payloadSize, maxSize int64, webhookID string) {
	Assert(
		payloadSize <= maxSize,
		"webhook_payload_too_large",
		fmt.Sprintf("Webhook %s payload too large (%d > %d)", webhookID, payloadSize, maxSize),
		map[string]interface{}{
			"webhook_id":   webhookID,
			"payload_size": payloadSize,
			"max_size":     maxSize,
		},
	)
}

// ========================================
// EVENT ORDERING & DEDUPLICATION
// ========================================

// AssertWebhookEventOrder verifica se eventos estão em ordem
// WARNING: Eventos fora de ordem podem causar inconsistência
func AssertWebhookEventOrder(eventID string, eventSequence, lastSequence int64, appID string) {
	Assert(
		eventSequence > lastSequence,
		"webhook_event_out_of_order",
		fmt.Sprintf("Event %s out of order (seq: %d, last: %d)", eventID, eventSequence, lastSequence),
		map[string]interface{}{
			"event_id":       eventID,
			"event_sequence": eventSequence,
			"last_sequence":  lastSequence,
			"app_id":         appID,
		},
	)
}

// AssertWebhookNotDuplicate verifica se webhook não é duplicata
// WARNING: Duplicata pode causar operações repetidas
func AssertWebhookNotDuplicate(webhookID string, isDuplicate bool) {
	Assert(
		!isDuplicate,
		"webhook_duplicate_detected",
		fmt.Sprintf("Duplicate webhook detected: %s", webhookID),
		map[string]interface{}{
			"webhook_id": webhookID,
		},
	)
}

// AssertIdempotencyKeyUnique verifica se idempotency key é única
// CRITICAL: Key duplicada pode causar operação repetida
func AssertIdempotencyKeyUnique(key string, isUnique bool, operation string) {
	AssertCritical(
		isUnique,
		"idempotency_key_duplicate",
		fmt.Sprintf("Duplicate idempotency key for operation %s", operation),
		map[string]interface{}{
			"idempotency_key": key,
			"operation":       operation,
		},
	)
}

// ========================================
// ENDPOINT HEALTH
// ========================================

// AssertWebhookEndpointHealthy verifica se endpoint está saudável
// WARNING: Endpoint não saudável pode causar perda de eventos
func AssertWebhookEndpointHealthy(endpointURL string, successRate float64, minSuccessRate float64) {
	Assert(
		successRate >= minSuccessRate,
		"webhook_endpoint_unhealthy",
		fmt.Sprintf("Webhook endpoint unhealthy: %.2f%% success (min: %.2f%%)", successRate*100, minSuccessRate*100),
		map[string]interface{}{
			"endpoint":         endpointURL,
			"success_rate":     successRate,
			"min_success_rate": minSuccessRate,
		},
	)
}

// AssertWebhookEndpointResponsive verifica se endpoint responde em tempo
// WARNING: Endpoint lento pode causar timeout
func AssertWebhookEndpointResponsive(endpointURL string, responseTime, maxResponseTime time.Duration) {
	Assert(
		responseTime <= maxResponseTime,
		"webhook_endpoint_slow",
		fmt.Sprintf("Webhook endpoint slow: %v (max: %v)", responseTime, maxResponseTime),
		map[string]interface{}{
			"endpoint":          endpointURL,
			"response_time":     responseTime.String(),
			"max_response_time": maxResponseTime.String(),
		},
	)
}

// AssertWebhookEndpointNotDisabled verifica se endpoint não está desabilitado
// CRITICAL: Endpoint desabilitado não recebe eventos
func AssertWebhookEndpointNotDisabled(endpointURL string, isDisabled bool, appID string) {
	AssertCritical(
		!isDisabled,
		"webhook_endpoint_disabled",
		fmt.Sprintf("Webhook endpoint disabled for app %s", appID),
		map[string]interface{}{
			"endpoint": endpointURL,
			"app_id":   appID,
		},
	)
}

// ========================================
// EVENT TYPES
// ========================================

// AssertWebhookEventTypeValid verifica se tipo de evento é válido
// WARNING: Tipo inválido pode indicar bug
func AssertWebhookEventTypeValid(eventType string, validTypes []string) bool {
	valid := false
	for _, t := range validTypes {
		if t == eventType {
			valid = true
			break
		}
	}

	Assert(
		valid,
		"webhook_event_type_invalid",
		fmt.Sprintf("Invalid webhook event type: %s", eventType),
		map[string]interface{}{
			"event_type":  eventType,
			"valid_types": validTypes,
		},
	)

	return valid
}

// AssertWebhookEventTypeSubscribed verifica se app está inscrito no tipo de evento
// WARNING: Enviar evento não inscrito é desperdício
func AssertWebhookEventTypeSubscribed(eventType string, subscribedTypes []string, appID string) bool {
	subscribed := false
	for _, t := range subscribedTypes {
		if t == eventType || t == "*" {
			subscribed = true
			break
		}
		// Suportar wildcards como "user.*" para "user.created"
		if len(t) > 1 && t[len(t)-1] == '*' {
			prefix := t[:len(t)-1] // Remove o *
			if len(eventType) >= len(prefix) && eventType[:len(prefix)] == prefix {
				subscribed = true
				break
			}
		}
	}

	Assert(
		subscribed,
		"webhook_event_not_subscribed",
		fmt.Sprintf("App %s not subscribed to event type %s", appID, eventType),
		map[string]interface{}{
			"event_type":       eventType,
			"subscribed_types": subscribedTypes,
			"app_id":           appID,
		},
	)

	return subscribed
}

// ========================================
// RETRY POLICY
// ========================================

// AssertRetryBackoffValid verifica se backoff de retry é válido
// WARNING: Backoff inválido pode sobrecarregar endpoint
func AssertRetryBackoffValid(attempt int, backoff, minBackoff, maxBackoff time.Duration) {
	Assert(
		backoff >= minBackoff && backoff <= maxBackoff,
		"webhook_retry_backoff_invalid",
		fmt.Sprintf("Retry backoff %v out of range [%v, %v] for attempt %d", backoff, minBackoff, maxBackoff, attempt),
		map[string]interface{}{
			"attempt":     attempt,
			"backoff":     backoff.String(),
			"min_backoff": minBackoff.String(),
			"max_backoff": maxBackoff.String(),
		},
	)
}

// AssertMaxRetriesNotExceeded verifica se máximo de retries não foi excedido
// CRITICAL: Exceder retries pode indicar endpoint morto
func AssertMaxRetriesNotExceeded(attempts, maxRetries int, webhookID string) {
	AssertCritical(
		attempts <= maxRetries,
		"webhook_max_retries_exceeded",
		fmt.Sprintf("Webhook %s exceeded max retries (%d/%d)", webhookID, attempts, maxRetries),
		map[string]interface{}{
			"webhook_id":  webhookID,
			"attempts":    attempts,
			"max_retries": maxRetries,
		},
	)
}
