package invariants

/*
================================================================================
APPLICATION INVARIANTS — ISOLAMENTO MULTI-TENANT
================================================================================

Estas invariants garantem que:
1. Dados de um app NUNCA vazam para outro app
2. Credenciais são validadas corretamente
3. Sessões pertencem ao app correto
4. Operações cross-app são bloqueadas

Se estas invariants falharem, há uma brecha de segurança grave.

================================================================================
*/

import (
	"fmt"
	"strings"
	"time"
)

// ========================================
// ISOLAMENTO DE DADOS
// ========================================

// AssertDataBelongsToApp verifica se dados pertencem ao app que está acessando
// CRITICAL: Acesso cross-app é uma violação grave de segurança
func AssertDataBelongsToApp(dataAppID, requestAppID, dataType, dataID string) {
	// Dados globais (sem app_id) são acessíveis por todos
	if dataAppID == "" || dataAppID == "global" {
		return
	}

	// Verificar isolamento
	AssertCritical(
		dataAppID == requestAppID,
		"data_isolation_breach",
		fmt.Sprintf("Data from app %s accessed by app %s - isolation breach", dataAppID, requestAppID),
		map[string]interface{}{
			"data_app_id":    dataAppID,
			"request_app_id": requestAppID,
			"data_type":      dataType,
			"data_id":        dataID,
		},
	)
}

// AssertAppOwnership verifica se o usuário/entidade é dono do app
// CRITICAL: Operações de admin em app alheio
func AssertAppOwnership(appOwnerID, actorID, operation string) {
	AssertCritical(
		appOwnerID == actorID,
		"app_ownership_violation",
		fmt.Sprintf("Actor %s attempted %s on app owned by %s", actorID, operation, appOwnerID),
		map[string]interface{}{
			"app_owner_id": appOwnerID,
			"actor_id":     actorID,
			"operation":    operation,
		},
	)
}

// ========================================
// CREDENCIAIS DE APP
// ========================================

// AssertCredentialBelongsToApp verifica se credencial pertence ao app
// FATAL: Uso de credencial de outro app é ataque
func AssertCredentialBelongsToApp(credAppID, requestAppID string) {
	AssertFatal(
		credAppID == requestAppID,
		"credential_app_mismatch",
		"Credential used for wrong app - possible credential theft",
		map[string]interface{}{
			"credential_app_id": credAppID,
			"request_app_id":    requestAppID,
		},
	)
}

// AssertCredentialNotRevoked verifica se credencial não foi revogada
// CRITICAL: Uso de credencial revogada
func AssertCredentialNotRevoked(credentialID, status string) {
	validStatuses := map[string]bool{"active": true}
	AssertCritical(
		validStatuses[status],
		"revoked_credential_used",
		fmt.Sprintf("Revoked/expired credential %s was used", credentialID),
		map[string]interface{}{
			"credential_id": credentialID,
			"status":        status,
		},
	)
}

// AssertCredentialSecretNotExposed verifica se secret não está sendo exposto
// FATAL: Secret de credencial nunca deve aparecer em logs/responses
func AssertCredentialSecretNotExposed(data map[string]interface{}) {
	sensitiveKeys := []string{"secret", "secret_key", "api_secret", "client_secret", "pq_sk_"}

	for key, value := range data {
		keyLower := strings.ToLower(key)
		for _, sensitive := range sensitiveKeys {
			if strings.Contains(keyLower, sensitive) {
				if strVal, ok := value.(string); ok && len(strVal) > 0 {
					// Verificar se não é um hash ou valor mascarado
					if !strings.HasPrefix(strVal, "****") && !looksLikeHashApp(strVal) {
						AssertFatal(
							false,
							"credential_secret_exposed",
							"Credential secret found in data - potential leak",
							map[string]interface{}{
								"key":           key,
								"value_preview": maskForLog(strVal),
							},
						)
					}
				}
			}
		}
	}
}

// ========================================
// SESSÕES DE APP
// ========================================

// AssertSessionBelongsToApp verifica se sessão pertence ao app
// CRITICAL: Sessão de outro app é violação
func AssertSessionBelongsToApp(sessionAppID, requestAppID, sessionID string) {
	AssertCritical(
		sessionAppID == requestAppID,
		"session_app_mismatch",
		"Session accessed by wrong app - session hijacking attempt",
		map[string]interface{}{
			"session_app_id": sessionAppID,
			"request_app_id": requestAppID,
			"session_id":     sessionID,
		},
	)
}

// AssertSessionNotExpired verifica se sessão não expirou
// WARNING: Uso de sessão expirada
func AssertSessionNotExpired(sessionID string, expiresAt time.Time) {
	Assert(
		time.Now().Before(expiresAt),
		"expired_session_used",
		"Expired session was used",
		map[string]interface{}{
			"session_id": sessionID,
			"expired_at": expiresAt,
			"now":        time.Now(),
		},
	)
}

// AssertSessionUserMatch verifica se sessão pertence ao usuário
// CRITICAL: Uso de sessão de outro usuário
func AssertSessionUserMatch(sessionUserID, requestUserID, sessionID string) {
	AssertCritical(
		sessionUserID == requestUserID,
		"session_user_mismatch",
		"Session used by wrong user - session hijacking",
		map[string]interface{}{
			"session_user_id": sessionUserID,
			"request_user_id": requestUserID,
			"session_id":      sessionID,
		},
	)
}

// ========================================
// SLUG E IDENTIFICADORES
// ========================================

// AssertSlugUnique é chamado antes de criar app para garantir unicidade
// WARNING: Tentativa de criar slug duplicado
func AssertSlugUnique(slug string, exists bool) {
	Assert(
		!exists,
		"duplicate_slug_attempt",
		fmt.Sprintf("Attempt to create app with existing slug: %s", slug),
		map[string]interface{}{
			"slug": slug,
		},
	)
}

// AssertValidSlug verifica se slug é válido
// WARNING: Slug inválido pode causar problemas
func AssertValidSlug(slug string) bool {
	// Slug deve ser lowercase, alfanumérico com hífens
	if len(slug) < 3 || len(slug) > 50 {
		Assert(
			false,
			"invalid_slug_length",
			fmt.Sprintf("Slug '%s' has invalid length (must be 3-50 chars)", slug),
			map[string]interface{}{
				"slug":   slug,
				"length": len(slug),
			},
		)
		return false
	}

	// Verificar caracteres válidos
	for _, c := range slug {
		if !((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-') {
			Assert(
				false,
				"invalid_slug_chars",
				fmt.Sprintf("Slug '%s' contains invalid characters", slug),
				map[string]interface{}{
					"slug":         slug,
					"invalid_char": string(c),
				},
			)
			return false
		}
	}

	return true
}

// ========================================
// STATUS DE APP
// ========================================

// AssertAppActive verifica se app está ativo antes de operações
// CRITICAL: Operações em app suspenso/deletado
func AssertAppActive(appID, status, operation string) {
	AssertCritical(
		status == "active",
		"inactive_app_operation",
		fmt.Sprintf("Operation '%s' attempted on inactive app", operation),
		map[string]interface{}{
			"app_id":    appID,
			"status":    status,
			"operation": operation,
		},
	)
}

// AssertAppNotDeleted verifica se app não foi deletado
// FATAL: Operações em app deletado são proibidas
func AssertAppNotDeleted(appID, status string) {
	AssertFatal(
		status != "deleted",
		"deleted_app_access",
		"Attempt to access deleted app",
		map[string]interface{}{
			"app_id": appID,
			"status": status,
		},
	)
}

// ========================================
// RATE LIMITING POR APP
// ========================================

// AssertAppRateLimit verifica se app não excedeu rate limit
// WARNING: App excedendo limites pode indicar abuso
func AssertAppRateLimit(appID string, currentRate, maxRate int, window string) {
	Assert(
		currentRate <= maxRate,
		"app_rate_limit_exceeded",
		fmt.Sprintf("App %s exceeded rate limit: %d/%d per %s", appID, currentRate, maxRate, window),
		map[string]interface{}{
			"app_id":       appID,
			"current_rate": currentRate,
			"max_rate":     maxRate,
			"window":       window,
		},
	)
}

// ========================================
// QUOTA DE APP
// ========================================

// AssertAppQuota verifica se app não excedeu quota
// CRITICAL: Exceder quota pode indicar abuso ou bug
func AssertAppQuota(appID, quotaType string, current, max int64) {
	AssertCritical(
		current <= max,
		"app_quota_exceeded",
		fmt.Sprintf("App %s exceeded %s quota: %d/%d", appID, quotaType, current, max),
		map[string]interface{}{
			"app_id":     appID,
			"quota_type": quotaType,
			"current":    current,
			"max":        max,
		},
	)
}

// ========================================
// HELPERS
// ========================================

// looksLikeHashApp verifica se string parece ser um hash
func looksLikeHashApp(s string) bool {
	// SHA256 = 64 chars hex
	// SHA512 = 128 chars hex
	// bcrypt = $2a$... ou $2b$...
	if len(s) == 64 || len(s) == 128 {
		for _, c := range s {
			if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
				return false
			}
		}
		return true
	}

	if strings.HasPrefix(s, "$2a$") || strings.HasPrefix(s, "$2b$") {
		return true
	}

	return false
}
