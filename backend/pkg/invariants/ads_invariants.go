package invariants

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// ========================================
// ADS INVARIANTS - Defesa Anti-Fraude
// "Impressao duplicada NUNCA gera cobranca duplicada"
// ========================================

// AdsInvariants valida integridade do sistema de anuncios
type AdsInvariants struct {
	db *gorm.DB
}

// NewAdsInvariants cria nova instancia
func NewAdsInvariants(db *gorm.DB) *AdsInvariants {
	return &AdsInvariants{db: db}
}

// CheckAdImpressionNotDuplicated verifica se nao ha impressoes duplicadas
// CRITICAL: Impede que o mesmo request_id gere duas cobranças
func (a *AdsInvariants) CheckAdImpressionNotDuplicated() (bool, string, map[string]interface{}) {
	type DuplicateResult struct {
		RequestID string
		Count     int64
	}

	var duplicates []DuplicateResult
	err := a.db.Raw(`
		SELECT request_id, COUNT(*) as count 
		FROM ad_impressions 
		WHERE request_id IS NOT NULL AND request_id != ''
		GROUP BY request_id 
		HAVING COUNT(*) > 1
		LIMIT 10
	`).Scan(&duplicates).Error

	if err != nil {
		return false, fmt.Sprintf("Erro ao verificar duplicatas: %v", err), nil
	}

	if len(duplicates) > 0 {
		return false, fmt.Sprintf("FRAUDE DETECTADA: %d request_ids com impressoes duplicadas", len(duplicates)), map[string]interface{}{
			"duplicates": duplicates,
			"action":     "INVESTIGAR IMEDIATAMENTE - possivel ataque de replay",
		}
	}

	return true, "Nenhuma impressao duplicada detectada", nil
}

// CheckClickHasValidImpression verifica se todo clique tem impressao valida
func (a *AdsInvariants) CheckClickHasValidImpression() (bool, string, map[string]interface{}) {
	var orphanClicks int64
	err := a.db.Raw(`
		SELECT COUNT(*) FROM ad_clicks c
		LEFT JOIN ad_impressions i ON c.impression_id = i.id
		WHERE i.id IS NULL
	`).Scan(&orphanClicks).Error

	if err != nil {
		return false, fmt.Sprintf("Erro ao verificar cliques orfaos: %v", err), nil
	}

	if orphanClicks > 0 {
		return false, fmt.Sprintf("FRAUDE DETECTADA: %d cliques sem impressao correspondente", orphanClicks), map[string]interface{}{
			"orphan_clicks": orphanClicks,
			"action":        "BLOQUEAR - cliques fantasmas detectados",
		}
	}

	return true, "Todos os cliques tem impressao valida", nil
}

// CheckBudgetNotOverspent verifica se nenhum budget foi ultrapassado
func (a *AdsInvariants) CheckBudgetNotOverspent() (bool, string, map[string]interface{}) {
	type OverspentBudget struct {
		ID          string
		AmountTotal int64
		AmountSpent int64
		Overspent   int64
	}

	var overspent []OverspentBudget
	err := a.db.Raw(`
		SELECT id, amount_total, amount_spent, (amount_spent - amount_total) as overspent
		FROM ad_budgets
		WHERE amount_spent > amount_total
		LIMIT 10
	`).Scan(&overspent).Error

	if err != nil {
		return false, fmt.Sprintf("Erro ao verificar budgets: %v", err), nil
	}

	if len(overspent) > 0 {
		return false, fmt.Sprintf("ALERTA: %d budgets ultrapassados", len(overspent)), map[string]interface{}{
			"overspent_budgets": overspent,
			"action":            "PAUSAR campanhas e investigar race condition",
		}
	}

	return true, "Nenhum budget ultrapassado", nil
}

// CheckImpressionFraudScoreValid verifica se fraud scores estao em range valido
func (a *AdsInvariants) CheckImpressionFraudScoreValid() (bool, string, map[string]interface{}) {
	var invalidScores int64
	err := a.db.Raw(`
		SELECT COUNT(*) FROM ad_impressions
		WHERE fraud_score < 0 OR fraud_score > 1
	`).Scan(&invalidScores).Error

	if err != nil {
		return false, fmt.Sprintf("Erro ao verificar fraud scores: %v", err), nil
	}

	if invalidScores > 0 {
		return false, fmt.Sprintf("ANOMALIA: %d impressoes com fraud_score invalido", invalidScores), nil
	}

	return true, "Todos os fraud scores estao em range valido [0,1]", nil
}

// CheckHighFraudRateAlert verifica taxa de fraude acima do threshold
func (a *AdsInvariants) CheckHighFraudRateAlert(threshold float64) (bool, string, map[string]interface{}) {
	var total, highFraud int64
	a.db.Raw(`SELECT COUNT(*) FROM ad_impressions WHERE created_at > datetime('now', '-1 hour')`).Scan(&total)
	a.db.Raw(`SELECT COUNT(*) FROM ad_impressions WHERE created_at > datetime('now', '-1 hour') AND fraud_score > ?`, threshold).Scan(&highFraud)

	if total == 0 {
		return true, "Sem impressoes na ultima hora", nil
	}

	fraudRate := float64(highFraud) / float64(total) * 100

	if fraudRate > 10 {
		return false, fmt.Sprintf("ALERTA: Taxa de fraude %.2f%% na ultima hora", fraudRate), map[string]interface{}{
			"total_impressions": total,
			"high_fraud_count":  highFraud,
			"fraud_rate":        fraudRate,
			"threshold":         threshold,
		}
	}

	return true, fmt.Sprintf("Taxa de fraude %.2f%% dentro do aceitavel", fraudRate), nil
}

// RunAllAdsChecks executa todas as verificacoes de ads
func (a *AdsInvariants) RunAllAdsChecks() []Violation {
	var violations []Violation

	// Check 1: Impressoes duplicadas
	if ok, msg, ctx := a.CheckAdImpressionNotDuplicated(); !ok {
		violations = append(violations, Violation{
			ID:        fmt.Sprintf("ads_duplicate_impression_%d", time.Now().UnixNano()),
			Invariant: "AssertAdImpressionNotDuplicated",
			Message:   msg,
			Context:   ctx,
			Timestamp: time.Now(),
			Severity:  SeverityCritical,
		})
	}

	// Check 2: Cliques orfaos
	if ok, msg, ctx := a.CheckClickHasValidImpression(); !ok {
		violations = append(violations, Violation{
			ID:        fmt.Sprintf("ads_orphan_click_%d", time.Now().UnixNano()),
			Invariant: "AssertClickHasValidImpression",
			Message:   msg,
			Context:   ctx,
			Timestamp: time.Now(),
			Severity:  SeverityCritical,
		})
	}

	// Check 3: Budget ultrapassado
	if ok, msg, ctx := a.CheckBudgetNotOverspent(); !ok {
		violations = append(violations, Violation{
			ID:        fmt.Sprintf("ads_budget_overspent_%d", time.Now().UnixNano()),
			Invariant: "AssertBudgetNotOverspent",
			Message:   msg,
			Context:   ctx,
			Timestamp: time.Now(),
			Severity:  SeverityCritical,
		})
	}

	// Check 4: Fraud score invalido
	if ok, msg, ctx := a.CheckImpressionFraudScoreValid(); !ok {
		violations = append(violations, Violation{
			ID:        fmt.Sprintf("ads_invalid_fraud_score_%d", time.Now().UnixNano()),
			Invariant: "AssertImpressionFraudScoreValid",
			Message:   msg,
			Context:   ctx,
			Timestamp: time.Now(),
			Severity:  SeverityWarning,
		})
	}

	// Check 5: Taxa de fraude alta
	if ok, msg, ctx := a.CheckHighFraudRateAlert(0.7); !ok {
		violations = append(violations, Violation{
			ID:        fmt.Sprintf("ads_high_fraud_rate_%d", time.Now().UnixNano()),
			Invariant: "AssertHighFraudRateAlert",
			Message:   msg,
			Context:   ctx,
			Timestamp: time.Now(),
			Severity:  SeverityWarning,
		})
	}

	return violations
}

// AssertAdImpressionNotDuplicated verifica e registra violacao se houver duplicatas
func AssertAdImpressionNotDuplicated(db *gorm.DB) {
	inv := NewAdsInvariants(db)
	ok, msg, ctx := inv.CheckAdImpressionNotDuplicated()
	AssertCritical(ok, "ads_impression_not_duplicated", msg, ctx)
}

// AssertClickHasValidImpression verifica e registra violacao se houver cliques orfaos
func AssertClickHasValidImpression(db *gorm.DB) {
	inv := NewAdsInvariants(db)
	ok, msg, ctx := inv.CheckClickHasValidImpression()
	AssertCritical(ok, "ads_click_has_valid_impression", msg, ctx)
}

// AssertBudgetNotOverspent verifica e registra violacao se houver budget ultrapassado
func AssertBudgetNotOverspent(db *gorm.DB) {
	inv := NewAdsInvariants(db)
	ok, msg, ctx := inv.CheckBudgetNotOverspent()
	AssertCritical(ok, "ads_budget_not_overspent", msg, ctx)
}
