package invariants

/*
================================================================================
RULES INVARIANTS — PROTEÇÃO DO MOTOR DE REGRAS
================================================================================

Estas invariants garantem que:
1. Regras são avaliadas corretamente
2. Condições são válidas e não causam loops
3. Ações são executadas com limites
4. Shadow mode funciona corretamente
5. Authority mode tem aprovações válidas

Se estas invariants falharem, há risco de decisões incorretas.

================================================================================
*/

import (
	"fmt"
	"time"
)

// ========================================
// RULE EVALUATION
// ========================================

// AssertRuleConditionValid verifica se condição da regra é válida
// CRITICAL: Condição inválida pode causar comportamento indefinido
func AssertRuleConditionValid(ruleID, condition string, isValid bool) {
	AssertCritical(
		isValid,
		"rule_condition_invalid",
		fmt.Sprintf("Rule %s has invalid condition", ruleID),
		map[string]interface{}{
			"rule_id":   ruleID,
			"condition": condition,
		},
	)
}

// AssertRuleActionValid verifica se ação da regra é válida
// CRITICAL: Ação inválida pode causar efeitos colaterais inesperados
func AssertRuleActionValid(ruleID, action string, validActions []string) {
	valid := false
	for _, a := range validActions {
		if a == action {
			valid = true
			break
		}
	}

	AssertCritical(
		valid,
		"rule_action_invalid",
		fmt.Sprintf("Rule %s has invalid action '%s'", ruleID, action),
		map[string]interface{}{
			"rule_id":       ruleID,
			"action":        action,
			"valid_actions": validActions,
		},
	)
}

// AssertRuleNotDisabled verifica se regra não está desabilitada
// WARNING: Regra desabilitada não será avaliada
func AssertRuleNotDisabled(ruleID string, isDisabled bool) {
	Assert(
		!isDisabled,
		"rule_disabled",
		fmt.Sprintf("Rule %s is disabled", ruleID),
		map[string]interface{}{
			"rule_id": ruleID,
		},
	)
}

// AssertRulePriorityValid verifica se prioridade está no range válido
// WARNING: Prioridade fora do range pode causar ordenação incorreta
func AssertRulePriorityValid(ruleID string, priority, minPriority, maxPriority int) {
	Assert(
		priority >= minPriority && priority <= maxPriority,
		"rule_priority_invalid",
		fmt.Sprintf("Rule %s priority %d out of range [%d, %d]", ruleID, priority, minPriority, maxPriority),
		map[string]interface{}{
			"rule_id":      ruleID,
			"priority":     priority,
			"min_priority": minPriority,
			"max_priority": maxPriority,
		},
	)
}


// ========================================
// RULE EXECUTION
// ========================================

// AssertRuleExecutionRateLimit verifica se limite de execuções por janela não foi excedido
// CRITICAL: Exceder limite pode indicar loop infinito
func AssertRuleExecutionRateLimit(ruleID string, executions, maxExecutions int, window time.Duration) {
	AssertCritical(
		executions <= maxExecutions,
		"rule_execution_rate_limit_exceeded",
		fmt.Sprintf("Rule %s exceeded execution rate limit (%d/%d in %v)", ruleID, executions, maxExecutions, window),
		map[string]interface{}{
			"rule_id":        ruleID,
			"executions":     executions,
			"max_executions": maxExecutions,
			"window":         window.String(),
		},
	)
}

// AssertRuleChainDepth verifica se profundidade de encadeamento não excede limite
// FATAL: Encadeamento muito profundo pode causar stack overflow
func AssertRuleChainDepth(currentDepth, maxDepth int, triggerChain []string) {
	if currentDepth > maxDepth {
		AssertFatal(
			false,
			"rule_chain_too_deep",
			fmt.Sprintf("Rule chain depth %d exceeds max %d", currentDepth, maxDepth),
			map[string]interface{}{
				"current_depth": currentDepth,
				"max_depth":     maxDepth,
				"trigger_chain": triggerChain,
			},
		)
	}
}

// AssertNoRuleLoop verifica se não há loop de regras
// FATAL: Loop de regras causa recursão infinita
func AssertNoRuleLoop(ruleID string, executedRules []string) {
	for _, executed := range executedRules {
		if executed == ruleID {
			AssertFatal(
				false,
				"rule_loop_detected",
				fmt.Sprintf("Rule loop detected: %s already executed in chain", ruleID),
				map[string]interface{}{
					"rule_id":        ruleID,
					"executed_rules": executedRules,
				},
			)
		}
	}
}

// AssertRuleTimeoutNotExceeded verifica se execução não excedeu timeout
// WARNING: Timeout pode indicar regra muito complexa
func AssertRuleTimeoutNotExceeded(ruleID string, duration, timeout time.Duration) {
	Assert(
		duration <= timeout,
		"rule_timeout_exceeded",
		fmt.Sprintf("Rule %s execution time %v exceeded timeout %v", ruleID, duration, timeout),
		map[string]interface{}{
			"rule_id":  ruleID,
			"duration": duration.String(),
			"timeout":  timeout.String(),
		},
	)
}

// ========================================
// SHADOW MODE
// ========================================

// AssertShadowModeActive verifica se shadow mode está ativo quando esperado
// WARNING: Shadow mode inativo pode executar ações em produção
func AssertShadowModeActive(ruleID string, isShadow bool, environment string) {
	if environment == "production" {
		Assert(
			isShadow,
			"shadow_mode_inactive_production",
			fmt.Sprintf("Rule %s not in shadow mode in production", ruleID),
			map[string]interface{}{
				"rule_id":     ruleID,
				"environment": environment,
			},
		)
	}
}

// AssertShadowResultLogged verifica se resultado do shadow foi logado
// WARNING: Sem log, não há como comparar shadow vs real
func AssertShadowResultLogged(ruleID string, wasLogged bool) {
	Assert(
		wasLogged,
		"shadow_result_not_logged",
		fmt.Sprintf("Shadow result for rule %s was not logged", ruleID),
		map[string]interface{}{
			"rule_id": ruleID,
		},
	)
}

// AssertShadowDivergenceWithinThreshold verifica se divergência está dentro do limite
// WARNING: Alta divergência pode indicar problema na regra
func AssertShadowDivergenceWithinThreshold(ruleID string, divergenceRate, threshold float64) {
	Assert(
		divergenceRate <= threshold,
		"shadow_divergence_high",
		fmt.Sprintf("Rule %s shadow divergence %.2f%% exceeds threshold %.2f%%", ruleID, divergenceRate*100, threshold*100),
		map[string]interface{}{
			"rule_id":         ruleID,
			"divergence_rate": divergenceRate,
			"threshold":       threshold,
		},
	)
}

// ========================================
// AUTHORITY MODE
// ========================================

// AssertAuthorityApprovalRequired verifica se aprovação é necessária
// CRITICAL: Ação sem aprovação em authority mode é violação
func AssertAuthorityApprovalRequired(ruleID, actionType string, requiresApproval bool, hasApproval bool) {
	if requiresApproval {
		AssertCritical(
			hasApproval,
			"authority_approval_missing",
			fmt.Sprintf("Rule %s action '%s' requires approval but none provided", ruleID, actionType),
			map[string]interface{}{
				"rule_id":     ruleID,
				"action_type": actionType,
			},
		)
	}
}

// AssertAuthorityApprovalValid verifica se aprovação é válida
// CRITICAL: Aprovação inválida não deve ser aceita
func AssertAuthorityApprovalValid(approvalID string, isValid bool, reason string) {
	AssertCritical(
		isValid,
		"authority_approval_invalid",
		fmt.Sprintf("Approval %s is invalid: %s", approvalID, reason),
		map[string]interface{}{
			"approval_id": approvalID,
			"reason":      reason,
		},
	)
}

// AssertAuthorityApprovalNotExpired verifica se aprovação não expirou
// CRITICAL: Aprovação expirada não deve ser usada
func AssertAuthorityApprovalNotExpired(approvalID string, expiresAt time.Time) {
	AssertCritical(
		time.Now().Before(expiresAt),
		"authority_approval_expired",
		fmt.Sprintf("Approval %s has expired", approvalID),
		map[string]interface{}{
			"approval_id": approvalID,
			"expires_at":  expiresAt,
			"now":         time.Now(),
		},
	)
}

// AssertAuthorityApproverAuthorized verifica se aprovador tem permissão
// CRITICAL: Aprovador não autorizado não pode aprovar
func AssertAuthorityApproverAuthorized(approverID string, requiredRole string, approverRoles []string) {
	hasRole := false
	for _, role := range approverRoles {
		if role == requiredRole || role == "admin" || role == "super_admin" {
			hasRole = true
			break
		}
	}

	AssertCritical(
		hasRole,
		"authority_approver_unauthorized",
		fmt.Sprintf("Approver %s lacks required role '%s'", approverID, requiredRole),
		map[string]interface{}{
			"approver_id":    approverID,
			"required_role":  requiredRole,
			"approver_roles": approverRoles,
		},
	)
}


// ========================================
// RULE CONSISTENCY
// ========================================

// AssertRuleVersionConsistent verifica se versão da regra é consistente
// CRITICAL: Versão inconsistente pode causar comportamento inesperado
func AssertRuleVersionConsistent(ruleID string, expectedVersion, actualVersion int) {
	AssertCritical(
		expectedVersion == actualVersion,
		"rule_version_mismatch",
		fmt.Sprintf("Rule %s version mismatch (expected: %d, actual: %d)", ruleID, expectedVersion, actualVersion),
		map[string]interface{}{
			"rule_id":          ruleID,
			"expected_version": expectedVersion,
			"actual_version":   actualVersion,
		},
	)
}

// AssertRuleNotConflicting verifica se regra não conflita com outras
// WARNING: Regras conflitantes podem causar comportamento indefinido
func AssertRuleNotConflicting(ruleID string, conflictingRules []string) {
	Assert(
		len(conflictingRules) == 0,
		"rule_conflict_detected",
		fmt.Sprintf("Rule %s conflicts with: %v", ruleID, conflictingRules),
		map[string]interface{}{
			"rule_id":           ruleID,
			"conflicting_rules": conflictingRules,
		},
	)
}

// AssertRuleDependenciesMet verifica se dependências da regra estão satisfeitas
// CRITICAL: Dependências não satisfeitas podem causar falha
func AssertRuleDependenciesMet(ruleID string, dependencies []string, missingDeps []string) {
	AssertCritical(
		len(missingDeps) == 0,
		"rule_dependencies_missing",
		fmt.Sprintf("Rule %s has missing dependencies: %v", ruleID, missingDeps),
		map[string]interface{}{
			"rule_id":      ruleID,
			"dependencies": dependencies,
			"missing":      missingDeps,
		},
	)
}

// ========================================
// RULE TARGETING
// ========================================

// AssertRuleTargetValid verifica se alvo da regra é válido
// CRITICAL: Alvo inválido pode afetar entidades erradas
func AssertRuleTargetValid(ruleID, targetType, targetID string, isValid bool) {
	AssertCritical(
		isValid,
		"rule_target_invalid",
		fmt.Sprintf("Rule %s has invalid target %s:%s", ruleID, targetType, targetID),
		map[string]interface{}{
			"rule_id":     ruleID,
			"target_type": targetType,
			"target_id":   targetID,
		},
	)
}

// AssertRuleScopeValid verifica se escopo da regra é válido
// WARNING: Escopo inválido pode limitar ou expandir demais a regra
func AssertRuleScopeValid(ruleID string, scope string, validScopes []string) {
	valid := false
	for _, s := range validScopes {
		if s == scope {
			valid = true
			break
		}
	}

	Assert(
		valid,
		"rule_scope_invalid",
		fmt.Sprintf("Rule %s has invalid scope '%s'", ruleID, scope),
		map[string]interface{}{
			"rule_id":      ruleID,
			"scope":        scope,
			"valid_scopes": validScopes,
		},
	)
}

// AssertRuleAppBound verifica se regra está vinculada a um app
// CRITICAL: Regra sem app pode afetar todos os apps
func AssertRuleAppBound(ruleID string, appID string, isGlobal bool) {
	if !isGlobal {
		AssertCritical(
			appID != "" && appID != "00000000-0000-0000-0000-000000000000",
			"rule_not_app_bound",
			fmt.Sprintf("Non-global rule %s is not bound to any app", ruleID),
			map[string]interface{}{
				"rule_id":   ruleID,
				"is_global": isGlobal,
			},
		)
	}
}

// ========================================
// RULE METRICS
// ========================================

// AssertRuleHitRateHealthy verifica se taxa de acerto está saudável
// WARNING: Taxa muito baixa pode indicar regra inútil
func AssertRuleHitRateHealthy(ruleID string, hitRate, minHitRate float64) {
	Assert(
		hitRate >= minHitRate,
		"rule_hit_rate_low",
		fmt.Sprintf("Rule %s hit rate %.2f%% below minimum %.2f%%", ruleID, hitRate*100, minHitRate*100),
		map[string]interface{}{
			"rule_id":      ruleID,
			"hit_rate":     hitRate,
			"min_hit_rate": minHitRate,
		},
	)
}

// AssertRuleErrorRateHealthy verifica se taxa de erro está saudável
// WARNING: Taxa alta de erro pode indicar problema na regra
func AssertRuleErrorRateHealthy(ruleID string, errorRate, maxErrorRate float64) {
	Assert(
		errorRate <= maxErrorRate,
		"rule_error_rate_high",
		fmt.Sprintf("Rule %s error rate %.2f%% exceeds maximum %.2f%%", ruleID, errorRate*100, maxErrorRate*100),
		map[string]interface{}{
			"rule_id":        ruleID,
			"error_rate":     errorRate,
			"max_error_rate": maxErrorRate,
		},
	)
}

// AssertRuleLatencyHealthy verifica se latência está saudável
// WARNING: Latência alta pode impactar performance
func AssertRuleLatencyHealthy(ruleID string, avgLatency, maxLatency time.Duration) {
	Assert(
		avgLatency <= maxLatency,
		"rule_latency_high",
		fmt.Sprintf("Rule %s avg latency %v exceeds maximum %v", ruleID, avgLatency, maxLatency),
		map[string]interface{}{
			"rule_id":     ruleID,
			"avg_latency": avgLatency.String(),
			"max_latency": maxLatency.String(),
		},
	)
}
