package invariants

/*
================================================================================
LEIS DE AUDITORIA DO KERNEL — AUDIT INVARIANTS
================================================================================

"Se você não pode provar o que aconteceu, não aconteceu."

O Audit Trail é a memória do sistema. Se for corrompido:
- Não há como investigar incidentes
- Não há como provar compliance
- Não há como responsabilizar atores

Estas invariants garantem:
- Imutabilidade: eventos nunca são alterados
- Completude: operações críticas sempre têm audit
- Integridade: cadeia de hashes não pode ser quebrada
- Temporalidade: timestamps são válidos e sequenciais

Severidades:
- WARNING: Operação sem audit (ponto cego)
- CRITICAL: Tentativa de modificação (ataque)
- FATAL: Cadeia corrompida (sistema comprometido)

================================================================================
*/

import (
	"time"
)

// ========================================
// INVARIANTS DE IMUTABILIDADE
// ========================================

// AssertAuditEventImmutable verifica que evento de audit não foi modificado
// FATAL: Modificar audit é destruir evidência
func AssertAuditEventImmutable(eventID string, originalHash, currentHash string) {
	AssertFatal(
		originalHash == currentHash,
		"audit_event_modified",
		"CRITICAL: Audit event hash changed - evidence tampering detected",
		map[string]interface{}{
			"event_id":      eventID,
			"original_hash": originalHash,
			"current_hash":  currentHash,
		},
	)
}

// AssertAuditChainIntegrity verifica integridade da cadeia de hashes
// FATAL: Cadeia quebrada indica corrupção ou ataque
func AssertAuditChainIntegrity(eventID string, expectedPreviousHash, actualPreviousHash string) {
	AssertFatal(
		expectedPreviousHash == actualPreviousHash,
		"audit_chain_broken",
		"CRITICAL: Audit chain integrity violated - previous hash mismatch",
		map[string]interface{}{
			"event_id":               eventID,
			"expected_previous_hash": expectedPreviousHash,
			"actual_previous_hash":   actualPreviousHash,
		},
	)
}

// AssertNoAuditDeletion verifica que eventos não estão sendo deletados
// FATAL: Deletar audit é destruir evidência
func AssertNoAuditDeletion(operation string, eventID string) {
	// Se chegou aqui com operação de delete, é violação
	isDeleteOperation := operation == "DELETE" || operation == "delete" || operation == "remove"
	
	AssertFatal(
		!isDeleteOperation,
		"audit_deletion_attempted",
		"CRITICAL: Attempt to delete audit event - this is forbidden",
		map[string]interface{}{
			"operation": operation,
			"event_id":  eventID,
		},
	)
}

// ========================================
// INVARIANTS DE COMPLETUDE
// ========================================

// AssertCriticalOperationAudited verifica que operação crítica tem audit
// WARNING: Operação sem audit é ponto cego
func AssertCriticalOperationAudited(operationType, targetID string, hasAuditEntry bool) {
	// Lista de operações que DEVEM ter audit
	criticalOperations := map[string]bool{
		"user_create":        true,
		"user_delete":        true,
		"user_role_change":   true,
		"secret_access":      true,
		"secret_create":      true,
		"secret_delete":      true,
		"payment_process":    true,
		"subscription_change": true,
		"killswitch_toggle":  true,
		"rule_create":        true,
		"rule_delete":        true,
		"app_create":         true,
		"app_delete":         true,
		"admin_action":       true,
	}

	if criticalOperations[operationType] {
		Assert(
			hasAuditEntry,
			"critical_operation_not_audited",
			"Critical operation performed without audit trail - security blind spot",
			map[string]interface{}{
				"operation_type": operationType,
				"target_id":      targetID,
			},
		)
	}
}

// AssertAuditHasActor verifica que evento tem ator identificado
// WARNING: Evento sem ator não pode ser investigado
func AssertAuditHasActor(eventID, actorID, actorType string) {
	hasActor := actorID != "" && actorID != "00000000-0000-0000-0000-000000000000"
	hasActorType := actorType != ""

	Assert(
		hasActor && hasActorType,
		"audit_missing_actor",
		"Audit event without identified actor - cannot trace responsibility",
		map[string]interface{}{
			"event_id":   eventID,
			"actor_id":   actorID,
			"actor_type": actorType,
		},
	)
}

// AssertAuditHasTarget verifica que evento tem alvo identificado
// WARNING: Evento sem alvo não pode ser correlacionado
func AssertAuditHasTarget(eventID, targetID, targetType string) {
	hasTarget := targetID != "" && targetID != "00000000-0000-0000-0000-000000000000"
	hasTargetType := targetType != ""

	Assert(
		hasTarget && hasTargetType,
		"audit_missing_target",
		"Audit event without identified target - cannot correlate events",
		map[string]interface{}{
			"event_id":    eventID,
			"target_id":   targetID,
			"target_type": targetType,
		},
	)
}

// ========================================
// INVARIANTS DE TEMPORALIDADE
// ========================================

// AssertAuditTimestampValid verifica que timestamp é válido
// CRITICAL: Timestamp no futuro indica manipulação
func AssertAuditTimestampValid(eventID string, timestamp time.Time) {
	now := time.Now()
	
	// Timestamp não pode ser no futuro (com margem de 1 minuto para clock skew)
	maxAllowedTime := now.Add(1 * time.Minute)
	
	// Timestamp não pode ser muito antigo (mais de 1 ano)
	minAllowedTime := now.AddDate(-1, 0, 0)

	isInFuture := timestamp.After(maxAllowedTime)
	isTooOld := timestamp.Before(minAllowedTime)

	AssertCritical(
		!isInFuture,
		"audit_timestamp_future",
		"Audit event has future timestamp - possible clock manipulation",
		map[string]interface{}{
			"event_id":  eventID,
			"timestamp": timestamp,
			"now":       now,
		},
	)

	Assert(
		!isTooOld,
		"audit_timestamp_suspicious",
		"Audit event has very old timestamp - possible backdating",
		map[string]interface{}{
			"event_id":  eventID,
			"timestamp": timestamp,
			"age":       now.Sub(timestamp).String(),
		},
	)
}

// AssertAuditSequenceValid verifica que sequência é válida
// CRITICAL: Sequência fora de ordem indica inserção maliciosa
func AssertAuditSequenceValid(eventID string, sequence, expectedSequence int64) {
	AssertCritical(
		sequence == expectedSequence,
		"audit_sequence_invalid",
		"Audit event sequence out of order - possible insertion attack",
		map[string]interface{}{
			"event_id":          eventID,
			"sequence":          sequence,
			"expected_sequence": expectedSequence,
		},
	)
}

// ========================================
// INVARIANTS DE ISOLAMENTO
// ========================================

// AssertAuditBelongsToApp verifica isolamento de audit entre apps
// CRITICAL: Acesso cross-app a audit é vazamento de informação
func AssertAuditBelongsToApp(eventAppID, requestAppID string) {
	// Se evento é global (sem app), qualquer um pode ver
	if eventAppID == "" || eventAppID == "00000000-0000-0000-0000-000000000000" {
		return
	}

	AssertCritical(
		eventAppID == requestAppID,
		"audit_cross_app_access",
		"Audit event accessed by different app - information leak",
		map[string]interface{}{
			"event_app_id":   eventAppID,
			"request_app_id": requestAppID,
		},
	)
}

// ========================================
// INVARIANTS DE RATE LIMITING
// ========================================

// AssertAuditRateNormal verifica se taxa de eventos está normal
// WARNING: Taxa muito alta pode indicar ataque ou loop
func AssertAuditRateNormal(appID string, eventsPerMinute, maxEventsPerMinute int) {
	Assert(
		eventsPerMinute <= maxEventsPerMinute,
		"audit_rate_anomaly",
		"Audit event rate exceeds normal threshold - possible attack or bug",
		map[string]interface{}{
			"app_id":              appID,
			"events_per_minute":   eventsPerMinute,
			"max_events_per_minute": maxEventsPerMinute,
		},
	)
}

// ========================================
// VERIFICAÇÃO DE INTEGRIDADE COMPLETA
// ========================================

// AuditChainVerificationResult resultado da verificação de cadeia
type AuditChainVerificationResult struct {
	IsValid          bool
	TotalEvents      int64
	VerifiedEvents   int64
	FirstBrokenEvent string
	BrokenAt         int64
	ErrorType        string
}

// VerifyAuditChainIntegrity verifica integridade completa da cadeia
// Retorna resultado detalhado em vez de panic (para uso em jobs de verificação)
func VerifyAuditChainIntegrity(events []AuditEventData) *AuditChainVerificationResult {
	result := &AuditChainVerificationResult{
		IsValid:     true,
		TotalEvents: int64(len(events)),
	}

	if len(events) == 0 {
		return result
	}

	for i, event := range events {
		result.VerifiedEvents++

		// Verificar hash do evento
		if event.ComputedHash != event.StoredHash {
			result.IsValid = false
			result.FirstBrokenEvent = event.EventID
			result.BrokenAt = event.Sequence
			result.ErrorType = "hash_mismatch"
			
			// Registrar violação
			AssertCritical(
				false,
				"audit_hash_mismatch",
				"Audit event hash does not match computed hash",
				map[string]interface{}{
					"event_id":      event.EventID,
					"sequence":      event.Sequence,
					"stored_hash":   event.StoredHash,
					"computed_hash": event.ComputedHash,
				},
			)
			return result
		}

		// Verificar encadeamento (exceto primeiro evento)
		if i > 0 {
			if event.PreviousHash != events[i-1].StoredHash {
				result.IsValid = false
				result.FirstBrokenEvent = event.EventID
				result.BrokenAt = event.Sequence
				result.ErrorType = "chain_broken"
				
				// Registrar violação FATAL
				AssertFatal(
					false,
					"audit_chain_broken",
					"CRITICAL: Audit chain broken - previous hash does not match",
					map[string]interface{}{
						"event_id":               event.EventID,
						"sequence":               event.Sequence,
						"expected_previous_hash": events[i-1].StoredHash,
						"actual_previous_hash":   event.PreviousHash,
					},
				)
				return result
			}
		}
	}

	return result
}

// AuditEventData dados de evento para verificação
type AuditEventData struct {
	EventID      string
	Sequence     int64
	StoredHash   string
	ComputedHash string
	PreviousHash string
	Timestamp    time.Time
}

// ========================================
// HELPER: AUDIT CONTEXT BUILDER
// ========================================

// AuditContextBuilder ajuda a construir contexto de audit completo
type AuditContextBuilder struct {
	actorID    string
	actorType  string
	targetID   string
	targetType string
	appID      string
	ip         string
	userAgent  string
}

// NewAuditContext cria um novo builder de contexto
func NewAuditContext() *AuditContextBuilder {
	return &AuditContextBuilder{}
}

func (b *AuditContextBuilder) WithActor(id, actorType string) *AuditContextBuilder {
	b.actorID = id
	b.actorType = actorType
	return b
}

func (b *AuditContextBuilder) WithTarget(id, targetType string) *AuditContextBuilder {
	b.targetID = id
	b.targetType = targetType
	return b
}

func (b *AuditContextBuilder) WithApp(appID string) *AuditContextBuilder {
	b.appID = appID
	return b
}

func (b *AuditContextBuilder) WithRequest(ip, userAgent string) *AuditContextBuilder {
	b.ip = ip
	b.userAgent = userAgent
	return b
}

// Validate verifica se contexto está completo e dispara invariants
func (b *AuditContextBuilder) Validate(eventID string) {
	AssertAuditHasActor(eventID, b.actorID, b.actorType)
	AssertAuditHasTarget(eventID, b.targetID, b.targetType)
}
