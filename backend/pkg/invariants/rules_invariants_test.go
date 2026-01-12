package invariants

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// ========================================
// TESTES DE RULE EVALUATION
// ========================================

func TestAssertRuleConditionValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleConditionValid("rule-123", "user.age > 18", true)

	violations := GetViolations()
	assert.Empty(t, violations, "Condição válida não deveria gerar violação")
	t.Log("✅ Condição válida passou")
}

func TestAssertRuleConditionValid_Invalid_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleConditionValid("rule-123", "invalid syntax >>>", false)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar condição inválida")
	assert.Equal(t, "rule_condition_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou condição inválida: %s", violations[0].Message)
}

func TestAssertRuleActionValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	validActions := []string{"allow", "deny", "flag", "notify"}
	AssertRuleActionValid("rule-123", "allow", validActions)

	violations := GetViolations()
	assert.Empty(t, violations, "Ação válida não deveria gerar violação")
	t.Log("✅ Ação válida passou")
}

func TestAssertRuleActionValid_Invalid_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	validActions := []string{"allow", "deny", "flag"}
	AssertRuleActionValid("rule-123", "delete_all", validActions)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar ação inválida")
	assert.Equal(t, "rule_action_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou ação inválida: %s", violations[0].Message)
}

func TestAssertRuleNotDisabled_Enabled_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleNotDisabled("rule-123", false)

	violations := GetViolations()
	assert.Empty(t, violations, "Regra habilitada não deveria gerar violação")
	t.Log("✅ Regra habilitada passou")
}

func TestAssertRuleNotDisabled_Disabled_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleNotDisabled("rule-123", true)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar regra desabilitada")
	assert.Equal(t, "rule_disabled", violations[0].Invariant)
	t.Logf("✅ Detectou regra desabilitada: %s", violations[0].Message)
}

func TestAssertRulePriorityValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRulePriorityValid("rule-123", 50, 1, 100)

	violations := GetViolations()
	assert.Empty(t, violations, "Prioridade válida não deveria gerar violação")
	t.Log("✅ Prioridade válida passou")
}

func TestAssertRulePriorityValid_OutOfRange_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRulePriorityValid("rule-123", 150, 1, 100)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar prioridade fora do range")
	assert.Equal(t, "rule_priority_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou prioridade inválida: %s", violations[0].Message)
}


// ========================================
// TESTES DE RULE EXECUTION
// ========================================

func TestAssertRuleExecutionRateLimit_WithinLimit_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleExecutionRateLimit("rule-123", 50, 100, time.Minute)

	violations := GetViolations()
	assert.Empty(t, violations, "Execuções dentro do limite não deveria gerar violação")
	t.Log("✅ Execuções dentro do limite passou")
}

func TestAssertRuleExecutionRateLimit_Exceeded_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleExecutionRateLimit("rule-123", 150, 100, time.Minute)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar limite excedido")
	assert.Equal(t, "rule_execution_rate_limit_exceeded", violations[0].Invariant)
	t.Logf("✅ Detectou limite excedido: %s", violations[0].Message)
}

func TestAssertRuleChainDepth_WithinLimit_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleChainDepth(3, 10, []string{"rule-1", "rule-2", "rule-3"})

	violations := GetViolations()
	assert.Empty(t, violations, "Profundidade dentro do limite não deveria gerar violação")
	t.Log("✅ Profundidade dentro do limite passou")
}

func TestAssertRuleChainDepth_TooDeep_Fatal(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou cadeia muito profunda: %v", r)
			assert.Contains(t, r.(string), "rule_chain_too_deep")
		} else {
			t.Fatal("Deveria ter dado panic para cadeia muito profunda")
		}
	}()

	AssertRuleChainDepth(15, 10, []string{"rule-1", "rule-2"})
}

func TestAssertNoRuleLoop_NoLoop_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertNoRuleLoop("rule-4", []string{"rule-1", "rule-2", "rule-3"})

	violations := GetViolations()
	assert.Empty(t, violations, "Sem loop não deveria gerar violação")
	t.Log("✅ Sem loop passou")
}

func TestAssertNoRuleLoop_LoopDetected_Fatal(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou loop de regras: %v", r)
			assert.Contains(t, r.(string), "rule_loop_detected")
		} else {
			t.Fatal("Deveria ter dado panic para loop de regras")
		}
	}()

	AssertNoRuleLoop("rule-2", []string{"rule-1", "rule-2", "rule-3"})
}

func TestAssertRuleTimeoutNotExceeded_Fast_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleTimeoutNotExceeded("rule-123", 50*time.Millisecond, 100*time.Millisecond)

	violations := GetViolations()
	assert.Empty(t, violations, "Execução rápida não deveria gerar violação")
	t.Log("✅ Execução rápida passou")
}

func TestAssertRuleTimeoutNotExceeded_Slow_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleTimeoutNotExceeded("rule-123", 200*time.Millisecond, 100*time.Millisecond)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar timeout excedido")
	assert.Equal(t, "rule_timeout_exceeded", violations[0].Invariant)
	t.Logf("✅ Detectou timeout excedido: %s", violations[0].Message)
}

// ========================================
// TESTES DE SHADOW MODE
// ========================================

func TestAssertShadowModeActive_Active_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertShadowModeActive("rule-123", true, "production")

	violations := GetViolations()
	assert.Empty(t, violations, "Shadow mode ativo não deveria gerar violação")
	t.Log("✅ Shadow mode ativo passou")
}

func TestAssertShadowModeActive_InactiveProduction_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertShadowModeActive("rule-123", false, "production")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar shadow mode inativo em produção")
	assert.Equal(t, "shadow_mode_inactive_production", violations[0].Invariant)
	t.Logf("✅ Detectou shadow mode inativo: %s", violations[0].Message)
}

func TestAssertShadowModeActive_InactiveDevelopment_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertShadowModeActive("rule-123", false, "development")

	violations := GetViolations()
	assert.Empty(t, violations, "Shadow mode inativo em dev não deveria gerar violação")
	t.Log("✅ Shadow mode inativo em dev passou")
}

func TestAssertShadowResultLogged_Logged_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertShadowResultLogged("rule-123", true)

	violations := GetViolations()
	assert.Empty(t, violations, "Resultado logado não deveria gerar violação")
	t.Log("✅ Resultado logado passou")
}

func TestAssertShadowResultLogged_NotLogged_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertShadowResultLogged("rule-123", false)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar resultado não logado")
	assert.Equal(t, "shadow_result_not_logged", violations[0].Invariant)
	t.Logf("✅ Detectou resultado não logado: %s", violations[0].Message)
}

func TestAssertShadowDivergenceWithinThreshold_Low_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertShadowDivergenceWithinThreshold("rule-123", 0.05, 0.10)

	violations := GetViolations()
	assert.Empty(t, violations, "Divergência baixa não deveria gerar violação")
	t.Log("✅ Divergência baixa passou")
}

func TestAssertShadowDivergenceWithinThreshold_High_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertShadowDivergenceWithinThreshold("rule-123", 0.25, 0.10)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar divergência alta")
	assert.Equal(t, "shadow_divergence_high", violations[0].Invariant)
	t.Logf("✅ Detectou divergência alta: %s", violations[0].Message)
}


// ========================================
// TESTES DE AUTHORITY MODE
// ========================================

func TestAssertAuthorityApprovalRequired_HasApproval_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuthorityApprovalRequired("rule-123", "delete_user", true, true)

	violations := GetViolations()
	assert.Empty(t, violations, "Com aprovação não deveria gerar violação")
	t.Log("✅ Com aprovação passou")
}

func TestAssertAuthorityApprovalRequired_MissingApproval_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuthorityApprovalRequired("rule-123", "delete_user", true, false)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar aprovação faltando")
	assert.Equal(t, "authority_approval_missing", violations[0].Invariant)
	t.Logf("✅ Detectou aprovação faltando: %s", violations[0].Message)
}

func TestAssertAuthorityApprovalRequired_NotRequired_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuthorityApprovalRequired("rule-123", "log_event", false, false)

	violations := GetViolations()
	assert.Empty(t, violations, "Sem necessidade de aprovação não deveria gerar violação")
	t.Log("✅ Sem necessidade de aprovação passou")
}

func TestAssertAuthorityApprovalValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuthorityApprovalValid("approval-123", true, "")

	violations := GetViolations()
	assert.Empty(t, violations, "Aprovação válida não deveria gerar violação")
	t.Log("✅ Aprovação válida passou")
}

func TestAssertAuthorityApprovalValid_Invalid_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuthorityApprovalValid("approval-123", false, "signature mismatch")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar aprovação inválida")
	assert.Equal(t, "authority_approval_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou aprovação inválida: %s", violations[0].Message)
}

func TestAssertAuthorityApprovalNotExpired_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	futureTime := time.Now().Add(1 * time.Hour)
	AssertAuthorityApprovalNotExpired("approval-123", futureTime)

	violations := GetViolations()
	assert.Empty(t, violations, "Aprovação não expirada não deveria gerar violação")
	t.Log("✅ Aprovação não expirada passou")
}

func TestAssertAuthorityApprovalNotExpired_Expired_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	pastTime := time.Now().Add(-1 * time.Hour)
	AssertAuthorityApprovalNotExpired("approval-123", pastTime)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar aprovação expirada")
	assert.Equal(t, "authority_approval_expired", violations[0].Invariant)
	t.Logf("✅ Detectou aprovação expirada: %s", violations[0].Message)
}

func TestAssertAuthorityApproverAuthorized_HasRole_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuthorityApproverAuthorized("user-123", "manager", []string{"viewer", "manager", "editor"})

	violations := GetViolations()
	assert.Empty(t, violations, "Aprovador com role não deveria gerar violação")
	t.Log("✅ Aprovador com role passou")
}

func TestAssertAuthorityApproverAuthorized_Admin_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuthorityApproverAuthorized("user-123", "manager", []string{"admin"})

	violations := GetViolations()
	assert.Empty(t, violations, "Admin deveria poder aprovar qualquer coisa")
	t.Log("✅ Admin pode aprovar qualquer coisa")
}

func TestAssertAuthorityApproverAuthorized_SuperAdmin_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuthorityApproverAuthorized("user-123", "manager", []string{"super_admin"})

	violations := GetViolations()
	assert.Empty(t, violations, "Super admin deveria poder aprovar qualquer coisa")
	t.Log("✅ Super admin pode aprovar qualquer coisa")
}

func TestAssertAuthorityApproverAuthorized_Unauthorized_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuthorityApproverAuthorized("user-123", "manager", []string{"viewer", "editor"})

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar aprovador não autorizado")
	assert.Equal(t, "authority_approver_unauthorized", violations[0].Invariant)
	t.Logf("✅ Detectou aprovador não autorizado: %s", violations[0].Message)
}

// ========================================
// TESTES DE RULE CONSISTENCY
// ========================================

func TestAssertRuleVersionConsistent_Match_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleVersionConsistent("rule-123", 5, 5)

	violations := GetViolations()
	assert.Empty(t, violations, "Versões iguais não deveria gerar violação")
	t.Log("✅ Versões iguais passou")
}

func TestAssertRuleVersionConsistent_Mismatch_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleVersionConsistent("rule-123", 5, 3)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar versão inconsistente")
	assert.Equal(t, "rule_version_mismatch", violations[0].Invariant)
	t.Logf("✅ Detectou versão inconsistente: %s", violations[0].Message)
}

func TestAssertRuleNotConflicting_NoConflicts_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleNotConflicting("rule-123", []string{})

	violations := GetViolations()
	assert.Empty(t, violations, "Sem conflitos não deveria gerar violação")
	t.Log("✅ Sem conflitos passou")
}

func TestAssertRuleNotConflicting_HasConflicts_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleNotConflicting("rule-123", []string{"rule-456", "rule-789"})

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar conflitos")
	assert.Equal(t, "rule_conflict_detected", violations[0].Invariant)
	t.Logf("✅ Detectou conflitos: %s", violations[0].Message)
}

func TestAssertRuleDependenciesMet_AllMet_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleDependenciesMet("rule-123", []string{"dep-1", "dep-2"}, []string{})

	violations := GetViolations()
	assert.Empty(t, violations, "Dependências satisfeitas não deveria gerar violação")
	t.Log("✅ Dependências satisfeitas passou")
}

func TestAssertRuleDependenciesMet_Missing_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleDependenciesMet("rule-123", []string{"dep-1", "dep-2", "dep-3"}, []string{"dep-2", "dep-3"})

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar dependências faltando")
	assert.Equal(t, "rule_dependencies_missing", violations[0].Invariant)
	t.Logf("✅ Detectou dependências faltando: %s", violations[0].Message)
}

// ========================================
// TESTES DE RULE TARGETING
// ========================================

func TestAssertRuleTargetValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleTargetValid("rule-123", "user", "user-456", true)

	violations := GetViolations()
	assert.Empty(t, violations, "Alvo válido não deveria gerar violação")
	t.Log("✅ Alvo válido passou")
}

func TestAssertRuleTargetValid_Invalid_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleTargetValid("rule-123", "user", "invalid-id", false)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar alvo inválido")
	assert.Equal(t, "rule_target_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou alvo inválido: %s", violations[0].Message)
}

func TestAssertRuleScopeValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	validScopes := []string{"global", "app", "user", "session"}
	AssertRuleScopeValid("rule-123", "app", validScopes)

	violations := GetViolations()
	assert.Empty(t, violations, "Escopo válido não deveria gerar violação")
	t.Log("✅ Escopo válido passou")
}

func TestAssertRuleScopeValid_Invalid_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	validScopes := []string{"global", "app", "user"}
	AssertRuleScopeValid("rule-123", "universe", validScopes)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar escopo inválido")
	assert.Equal(t, "rule_scope_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou escopo inválido: %s", violations[0].Message)
}

func TestAssertRuleAppBound_Bound_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleAppBound("rule-123", "app-456", false)

	violations := GetViolations()
	assert.Empty(t, violations, "Regra vinculada não deveria gerar violação")
	t.Log("✅ Regra vinculada passou")
}

func TestAssertRuleAppBound_Global_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleAppBound("rule-123", "", true)

	violations := GetViolations()
	assert.Empty(t, violations, "Regra global não deveria gerar violação")
	t.Log("✅ Regra global passou")
}

func TestAssertRuleAppBound_NotBound_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleAppBound("rule-123", "", false)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar regra não vinculada")
	assert.Equal(t, "rule_not_app_bound", violations[0].Invariant)
	t.Logf("✅ Detectou regra não vinculada: %s", violations[0].Message)
}

func TestAssertRuleAppBound_NilUUID_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleAppBound("rule-123", "00000000-0000-0000-0000-000000000000", false)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar UUID nulo")
	assert.Equal(t, "rule_not_app_bound", violations[0].Invariant)
	t.Logf("✅ Detectou UUID nulo: %s", violations[0].Message)
}

// ========================================
// TESTES DE RULE METRICS
// ========================================

func TestAssertRuleHitRateHealthy_Healthy_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleHitRateHealthy("rule-123", 0.15, 0.05)

	violations := GetViolations()
	assert.Empty(t, violations, "Hit rate saudável não deveria gerar violação")
	t.Log("✅ Hit rate saudável passou")
}

func TestAssertRuleHitRateHealthy_Low_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleHitRateHealthy("rule-123", 0.01, 0.05)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar hit rate baixo")
	assert.Equal(t, "rule_hit_rate_low", violations[0].Invariant)
	t.Logf("✅ Detectou hit rate baixo: %s", violations[0].Message)
}

func TestAssertRuleErrorRateHealthy_Healthy_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleErrorRateHealthy("rule-123", 0.01, 0.05)

	violations := GetViolations()
	assert.Empty(t, violations, "Error rate saudável não deveria gerar violação")
	t.Log("✅ Error rate saudável passou")
}

func TestAssertRuleErrorRateHealthy_High_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleErrorRateHealthy("rule-123", 0.15, 0.05)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar error rate alto")
	assert.Equal(t, "rule_error_rate_high", violations[0].Invariant)
	t.Logf("✅ Detectou error rate alto: %s", violations[0].Message)
}

func TestAssertRuleLatencyHealthy_Healthy_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleLatencyHealthy("rule-123", 50*time.Millisecond, 100*time.Millisecond)

	violations := GetViolations()
	assert.Empty(t, violations, "Latência saudável não deveria gerar violação")
	t.Log("✅ Latência saudável passou")
}

func TestAssertRuleLatencyHealthy_High_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRuleLatencyHealthy("rule-123", 200*time.Millisecond, 100*time.Millisecond)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar latência alta")
	assert.Equal(t, "rule_latency_high", violations[0].Invariant)
	t.Logf("✅ Detectou latência alta: %s", violations[0].Message)
}

// ========================================
// TESTES DE EDGE CASES
// ========================================

func TestRulesInvariants_EdgeCases(t *testing.T) {
	t.Run("Empty rule ID", func(t *testing.T) {
		ClearViolations()
		Enable()

		AssertRuleConditionValid("", "valid condition", true)
		violations := GetViolations()
		assert.Empty(t, violations, "Condição válida com ID vazio não deveria gerar violação")
	})

	t.Run("Zero priority boundaries", func(t *testing.T) {
		ClearViolations()
		Enable()

		AssertRulePriorityValid("rule-123", 0, 0, 100)
		violations := GetViolations()
		assert.Empty(t, violations, "Prioridade 0 no limite inferior deveria passar")

		ClearViolations()
		AssertRulePriorityValid("rule-123", 100, 0, 100)
		violations = GetViolations()
		assert.Empty(t, violations, "Prioridade 100 no limite superior deveria passar")
	})

	t.Run("Exact execution limit", func(t *testing.T) {
		ClearViolations()
		Enable()

		AssertRuleExecutionRateLimit("rule-123", 100, 100, time.Minute)
		violations := GetViolations()
		assert.Empty(t, violations, "Execuções exatamente no limite deveria passar")
	})

	t.Run("Zero divergence threshold", func(t *testing.T) {
		ClearViolations()
		Enable()

		AssertShadowDivergenceWithinThreshold("rule-123", 0.0, 0.0)
		violations := GetViolations()
		assert.Empty(t, violations, "Zero divergência com zero threshold deveria passar")
	})

	t.Run("Approval expires exactly now", func(t *testing.T) {
		ClearViolations()
		Enable()

		// Aprovação que expira no futuro próximo (1 segundo)
		futureTime := time.Now().Add(1 * time.Second)
		AssertAuthorityApprovalNotExpired("approval-123", futureTime)
		violations := GetViolations()
		assert.Empty(t, violations, "Aprovação que expira em 1 segundo deveria passar")
	})
}
