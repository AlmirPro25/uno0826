package invariants

/*
================================================================================
DATA INTEGRITY INVARIANTS — PROTEÇÃO CONTRA CORRUPÇÃO
================================================================================

Estas invariants garantem que:
1. Dados nunca são salvos em estado inconsistente
2. Referências entre entidades são válidas
3. Campos obrigatórios nunca são nulos
4. Timestamps são coerentes (created <= updated)
5. Versões são incrementais

Se estas invariants falharem, há corrupção de dados.

================================================================================
*/

import (
	"fmt"
	"regexp"
	"strings"
	"time"
)

// ========================================
// VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
// ========================================

// AssertRequiredField verifica se campo obrigatório não está vazio
// CRITICAL: Campo obrigatório vazio pode causar bugs em cascata
func AssertRequiredField(fieldName, value, entityType, entityID string) {
	AssertCritical(
		value != "",
		"required_field_empty",
		fmt.Sprintf("Required field '%s' is empty for %s", fieldName, entityType),
		map[string]interface{}{
			"field":       fieldName,
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
}

// AssertRequiredUUID verifica se UUID obrigatório não é nil/zero
// CRITICAL: UUID nil pode quebrar relacionamentos
func AssertRequiredUUID(fieldName, value, entityType, entityID string) {
	nilUUID := "00000000-0000-0000-0000-000000000000"
	AssertCritical(
		value != "" && value != nilUUID,
		"required_uuid_nil",
		fmt.Sprintf("Required UUID '%s' is nil for %s", fieldName, entityType),
		map[string]interface{}{
			"field":       fieldName,
			"value":       value,
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
}

// ========================================
// VALIDAÇÃO DE TIMESTAMPS
// ========================================

// AssertTimestampCoherence verifica se created_at <= updated_at
// CRITICAL: Timestamps incoerentes indicam bug ou manipulação
func AssertTimestampCoherence(createdAt, updatedAt time.Time, entityType, entityID string) {
	AssertCritical(
		!updatedAt.Before(createdAt),
		"timestamp_incoherence",
		fmt.Sprintf("updated_at is before created_at for %s", entityType),
		map[string]interface{}{
			"created_at":  createdAt,
			"updated_at":  updatedAt,
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
}

// AssertTimestampNotFuture verifica se timestamp não está no futuro
// WARNING: Timestamps futuros podem indicar clock skew ou manipulação
func AssertTimestampNotFuture(timestamp time.Time, fieldName, entityType, entityID string) {
	// Tolerância de 5 minutos para clock skew
	maxTime := time.Now().Add(5 * time.Minute)
	Assert(
		!timestamp.After(maxTime),
		"timestamp_future",
		fmt.Sprintf("Timestamp '%s' is in the future for %s", fieldName, entityType),
		map[string]interface{}{
			"field":       fieldName,
			"timestamp":   timestamp,
			"now":         time.Now(),
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
}

// AssertTimestampNotTooOld verifica se timestamp não é muito antigo
// WARNING: Timestamps muito antigos podem indicar dados órfãos
func AssertTimestampNotTooOld(timestamp time.Time, maxAge time.Duration, fieldName, entityType, entityID string) {
	minTime := time.Now().Add(-maxAge)
	Assert(
		!timestamp.Before(minTime),
		"timestamp_too_old",
		fmt.Sprintf("Timestamp '%s' is older than %v for %s", fieldName, maxAge, entityType),
		map[string]interface{}{
			"field":       fieldName,
			"timestamp":   timestamp,
			"max_age":     maxAge,
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
}

// ========================================
// VALIDAÇÃO DE VERSÕES
// ========================================

// AssertVersionIncremental verifica se versão é incremental
// CRITICAL: Versão não incremental indica race condition ou bug
func AssertVersionIncremental(oldVersion, newVersion int, entityType, entityID string) {
	AssertCritical(
		newVersion == oldVersion+1,
		"version_not_incremental",
		fmt.Sprintf("Version jump from %d to %d for %s (expected %d)", oldVersion, newVersion, entityType, oldVersion+1),
		map[string]interface{}{
			"old_version":      oldVersion,
			"new_version":      newVersion,
			"expected_version": oldVersion + 1,
			"entity_type":      entityType,
			"entity_id":        entityID,
		},
	)
}

// AssertVersionPositive verifica se versão é positiva
// CRITICAL: Versão zero ou negativa é inválida
func AssertVersionPositive(version int, entityType, entityID string) {
	AssertCritical(
		version > 0,
		"version_not_positive",
		fmt.Sprintf("Version %d is not positive for %s", version, entityType),
		map[string]interface{}{
			"version":     version,
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
}

// ========================================
// VALIDAÇÃO DE REFERÊNCIAS
// ========================================

// AssertForeignKeyExists verifica se FK referencia entidade existente
// CRITICAL: FK órfã pode causar erros em cascata
func AssertForeignKeyExists(fkName, fkValue string, exists bool, entityType, entityID string) {
	AssertCritical(
		exists,
		"foreign_key_orphan",
		fmt.Sprintf("Foreign key '%s' references non-existent entity", fkName),
		map[string]interface{}{
			"fk_name":     fkName,
			"fk_value":    fkValue,
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
}

// AssertNoCircularReference verifica se não há referência circular
// FATAL: Referência circular pode causar loop infinito
func AssertNoCircularReference(entityID string, parentID string, ancestorIDs []string) {
	for _, ancestorID := range ancestorIDs {
		if ancestorID == entityID {
			AssertFatal(
				false,
				"circular_reference",
				"Circular reference detected in hierarchy",
				map[string]interface{}{
					"entity_id":    entityID,
					"parent_id":    parentID,
					"ancestor_ids": ancestorIDs,
				},
			)
		}
	}
}

// ========================================
// VALIDAÇÃO DE FORMATO
// ========================================

// AssertValidEmail verifica se email tem formato válido
// WARNING: Email inválido pode causar falhas de notificação
func AssertValidEmail(email, entityType, entityID string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	valid := emailRegex.MatchString(email)
	
	Assert(
		valid,
		"invalid_email_format",
		fmt.Sprintf("Invalid email format for %s", entityType),
		map[string]interface{}{
			"email":       maskEmail(email),
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
	
	return valid
}

// AssertValidPhone verifica se telefone tem formato válido
// WARNING: Telefone inválido pode causar falhas de SMS
func AssertValidPhone(phone, entityType, entityID string) bool {
	// Aceita formatos: +5511999999999, 11999999999, (11) 99999-9999
	phoneRegex := regexp.MustCompile(`^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{4,6}[-\s\.]?[0-9]{4,6}$`)
	valid := phoneRegex.MatchString(phone)
	
	Assert(
		valid,
		"invalid_phone_format",
		fmt.Sprintf("Invalid phone format for %s", entityType),
		map[string]interface{}{
			"phone":       maskPhone(phone),
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
	
	return valid
}

// AssertValidURL verifica se URL tem formato válido
// WARNING: URL inválida pode causar falhas de webhook
func AssertValidURL(url, entityType, entityID string) bool {
	urlRegex := regexp.MustCompile(`^https?://[^\s/$.?#].[^\s]*$`)
	valid := urlRegex.MatchString(url)
	
	Assert(
		valid,
		"invalid_url_format",
		fmt.Sprintf("Invalid URL format for %s", entityType),
		map[string]interface{}{
			"url":         url,
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
	
	return valid
}

// ========================================
// VALIDAÇÃO DE ESTADO
// ========================================

// AssertValidStatus verifica se status é um dos valores permitidos
// CRITICAL: Status inválido pode quebrar state machine
func AssertValidStatus(status string, validStatuses []string, entityType, entityID string) {
	valid := false
	for _, s := range validStatuses {
		if s == status {
			valid = true
			break
		}
	}
	
	AssertCritical(
		valid,
		"invalid_status",
		fmt.Sprintf("Invalid status '%s' for %s (valid: %v)", status, entityType, validStatuses),
		map[string]interface{}{
			"status":         status,
			"valid_statuses": validStatuses,
			"entity_type":    entityType,
			"entity_id":      entityID,
		},
	)
}

// AssertValidStateTransition verifica se transição de estado é válida
// CRITICAL: Transição inválida pode corromper state machine
func AssertValidStateTransition(fromStatus, toStatus string, validTransitions map[string][]string, entityType, entityID string) {
	allowedNextStates, exists := validTransitions[fromStatus]
	if !exists {
		AssertCritical(
			false,
			"invalid_state_transition",
			fmt.Sprintf("Unknown current state '%s' for %s", fromStatus, entityType),
			map[string]interface{}{
				"from_status": fromStatus,
				"to_status":   toStatus,
				"entity_type": entityType,
				"entity_id":   entityID,
			},
		)
		return
	}
	
	valid := false
	for _, allowed := range allowedNextStates {
		if allowed == toStatus {
			valid = true
			break
		}
	}
	
	AssertCritical(
		valid,
		"invalid_state_transition",
		fmt.Sprintf("Invalid transition from '%s' to '%s' for %s", fromStatus, toStatus, entityType),
		map[string]interface{}{
			"from_status":    fromStatus,
			"to_status":      toStatus,
			"allowed_states": allowedNextStates,
			"entity_type":    entityType,
			"entity_id":      entityID,
		},
	)
}

// ========================================
// VALIDAÇÃO DE LIMITES
// ========================================

// AssertWithinRange verifica se valor está dentro do range
// WARNING: Valor fora do range pode indicar bug ou ataque
func AssertWithinRange(value, min, max int64, fieldName, entityType, entityID string) {
	Assert(
		value >= min && value <= max,
		"value_out_of_range",
		fmt.Sprintf("Value %d for '%s' is out of range [%d, %d]", value, fieldName, min, max),
		map[string]interface{}{
			"field":       fieldName,
			"value":       value,
			"min":         min,
			"max":         max,
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
}

// AssertStringLength verifica se string tem tamanho válido
// WARNING: String muito longa pode indicar ataque ou bug
func AssertStringLength(value string, minLen, maxLen int, fieldName, entityType, entityID string) {
	length := len(value)
	Assert(
		length >= minLen && length <= maxLen,
		"string_length_invalid",
		fmt.Sprintf("String '%s' length %d is out of range [%d, %d]", fieldName, length, minLen, maxLen),
		map[string]interface{}{
			"field":       fieldName,
			"length":      length,
			"min_length":  minLen,
			"max_length":  maxLen,
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
}

// AssertNonNegative verifica se valor não é negativo
// CRITICAL: Valores negativos em campos como saldo são bugs graves
func AssertNonNegative(value int64, fieldName, entityType, entityID string) {
	AssertCritical(
		value >= 0,
		"negative_value",
		fmt.Sprintf("Negative value %d for '%s' in %s", value, fieldName, entityType),
		map[string]interface{}{
			"field":       fieldName,
			"value":       value,
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
}

// ========================================
// VALIDAÇÃO DE UNICIDADE
// ========================================

// AssertUnique verifica se valor é único
// CRITICAL: Duplicatas podem causar comportamento indefinido
func AssertUnique(fieldName, value string, isDuplicate bool, entityType string) {
	AssertCritical(
		!isDuplicate,
		"duplicate_value",
		fmt.Sprintf("Duplicate value for '%s' in %s", fieldName, entityType),
		map[string]interface{}{
			"field":       fieldName,
			"value":       value,
			"entity_type": entityType,
		},
	)
}

// ========================================
// VALIDAÇÃO DE CONSISTÊNCIA
// ========================================

// AssertConsistentTotals verifica se totais são consistentes
// CRITICAL: Totais inconsistentes indicam bug de cálculo
func AssertConsistentTotals(calculated, stored int64, fieldName, entityType, entityID string) {
	AssertCritical(
		calculated == stored,
		"inconsistent_totals",
		fmt.Sprintf("Calculated total %d differs from stored %d for '%s'", calculated, stored, fieldName),
		map[string]interface{}{
			"field":       fieldName,
			"calculated":  calculated,
			"stored":      stored,
			"difference":  calculated - stored,
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
}

// AssertBalanceEquation verifica se equação de saldo está correta
// CRITICAL: Saldo = Créditos - Débitos
func AssertBalanceEquation(balance, totalCredits, totalDebits int64, entityType, entityID string) {
	expected := totalCredits - totalDebits
	AssertCritical(
		balance == expected,
		"balance_equation_violated",
		fmt.Sprintf("Balance %d != Credits %d - Debits %d (expected %d)", balance, totalCredits, totalDebits, expected),
		map[string]interface{}{
			"balance":       balance,
			"total_credits": totalCredits,
			"total_debits":  totalDebits,
			"expected":      expected,
			"entity_type":   entityType,
			"entity_id":     entityID,
		},
	)
}

// ========================================
// HELPERS
// ========================================

// maskEmail mascara email para logs
func maskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "****"
	}
	if len(parts[0]) <= 2 {
		return "**@" + parts[1]
	}
	return parts[0][:2] + "****@" + parts[1]
}

// maskPhone mascara telefone para logs
func maskPhone(phone string) string {
	if len(phone) <= 4 {
		return "****"
	}
	return "****" + phone[len(phone)-4:]
}
