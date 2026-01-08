package risk

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// RISK FACTORS IMPLEMENTATION
// "Cada fator tem fonte de dados clara e cálculo explícito"
// ========================================

// FactorCalculator interface para calcular fatores
type FactorCalculator interface {
	Calculate(db *gorm.DB, appID uuid.UUID, agentID *uuid.UUID) RiskFactor
}

// ========================================
// FACTOR 1: APPROVAL RATE
// "Taxa de aprovação histórica do app"
// ========================================

type ApprovalRateFactor struct{}

func (f *ApprovalRateFactor) Calculate(db *gorm.DB, appID uuid.UUID, agentID *uuid.UUID) RiskFactor {
	factor := RiskFactor{
		Name:        FactorApprovalRate,
		Description: "Taxa de aprovação de decisões nos últimos 30 dias",
		Weight:      DefaultFactorWeights[FactorApprovalRate],
		Threshold:   DefaultFactorThresholds[FactorApprovalRate],
		Source:      "approval_requests",
	}

	// Buscar aprovações e rejeições dos últimos 30 dias
	since := time.Now().AddDate(0, 0, -30)
	
	var totalCount int64
	var approvedCount int64

	// Usar agent_decisions filtrado por app_id (mais preciso que approval_requests)
	// Agent decisions tem app_id, approval_requests não tem ainda
	db.Table("agent_decisions").
		Where("created_at >= ? AND app_id = ?", since, appID.String()).
		Count(&totalCount)

	// Aprovados
	db.Table("agent_decisions").
		Where("created_at >= ? AND app_id = ? AND status = ?", since, appID.String(), "approved").
		Count(&approvedCount)

	// Calcular taxa
	if totalCount == 0 {
		// Sem histórico = neutro (0.5)
		factor.Value = 0.5
		factor.RawData = map[string]any{
			"total": 0,
			"approved": 0,
			"rate": 0.5,
			"note": "Sem histórico suficiente",
		}
	} else {
		rate := float64(approvedCount) / float64(totalCount)
		// Inverter: alta taxa de aprovação = baixo risco
		// Se rate = 1.0 (100% aprovado), value = 0.0 (sem risco)
		// Se rate = 0.0 (0% aprovado), value = 1.0 (alto risco)
		factor.Value = 1.0 - rate
		factor.RawData = map[string]any{
			"total":    totalCount,
			"approved": approvedCount,
			"rate":     rate,
		}
	}

	factor.Exceeded = factor.Value > (1.0 - factor.Threshold)
	return factor
}

// ========================================
// FACTOR 2: REJECTION HISTORY
// "Quantidade de rejeições recentes"
// ========================================

type RejectionHistoryFactor struct{}

func (f *RejectionHistoryFactor) Calculate(db *gorm.DB, appID uuid.UUID, agentID *uuid.UUID) RiskFactor {
	factor := RiskFactor{
		Name:        FactorRejectionHistory,
		Description: "Proporção de decisões rejeitadas nos últimos 7 dias",
		Weight:      DefaultFactorWeights[FactorRejectionHistory],
		Threshold:   DefaultFactorThresholds[FactorRejectionHistory],
		Source:      "agent_decisions",
	}

	since := time.Now().AddDate(0, 0, -7)

	var totalCount int64
	var rejectedCount int64

	// Total de decisões FILTRADO POR APP
	db.Table("agent_decisions").
		Where("created_at >= ? AND app_id = ?", since, appID.String()).
		Count(&totalCount)

	// Rejeitadas FILTRADO POR APP
	db.Table("agent_decisions").
		Where("created_at >= ? AND app_id = ? AND status = ?", since, appID.String(), "rejected").
		Count(&rejectedCount)

	if totalCount == 0 {
		factor.Value = 0.0 // Sem decisões = sem risco de rejeição
		factor.RawData = map[string]any{
			"total":    0,
			"rejected": 0,
			"rate":     0.0,
			"note":     "Sem decisões no período",
		}
	} else {
		rate := float64(rejectedCount) / float64(totalCount)
		factor.Value = rate // Alta rejeição = alto risco
		factor.RawData = map[string]any{
			"total":    totalCount,
			"rejected": rejectedCount,
			"rate":     rate,
		}
	}

	factor.Exceeded = factor.Value > factor.Threshold
	return factor
}

// ========================================
// FACTOR 3: VOLUME SPIKE
// "Aumento súbito de decisões"
// ========================================

type VolumeSpikeFactor struct{}

func (f *VolumeSpikeFactor) Calculate(db *gorm.DB, appID uuid.UUID, agentID *uuid.UUID) RiskFactor {
	factor := RiskFactor{
		Name:        FactorVolumeSpike,
		Description: "Comparação de volume de atividade: últimas 24h vs média dos últimos 7 dias",
		Weight:      DefaultFactorWeights[FactorVolumeSpike],
		Threshold:   DefaultFactorThresholds[FactorVolumeSpike],
		Source:      "audit_events",
	}

	now := time.Now()
	last24h := now.AddDate(0, 0, -1)
	last7days := now.AddDate(0, 0, -7)

	var count24h int64
	var count7days int64

	// Eventos nas últimas 24h FILTRADO POR APP
	db.Table("audit_events").
		Where("created_at >= ? AND app_id = ?", last24h, appID.String()).
		Count(&count24h)

	// Eventos nos últimos 7 dias FILTRADO POR APP
	db.Table("audit_events").
		Where("created_at >= ? AND app_id = ?", last7days, appID.String()).
		Count(&count7days)

	// Média diária dos últimos 7 dias
	avgDaily := float64(count7days) / 7.0

	if avgDaily == 0 {
		if count24h > 0 {
			// Tinha zero, agora tem algo = spike infinito, mas limitamos
			factor.Value = 1.0
			factor.RawData = map[string]any{
				"count_24h":   count24h,
				"avg_daily":   0,
				"spike_ratio": "infinite",
				"note":        "Primeira atividade detectada",
			}
		} else {
			factor.Value = 0.0
			factor.RawData = map[string]any{
				"count_24h": 0,
				"avg_daily": 0,
				"note":      "Sem atividade",
			}
		}
	} else {
		spikeRatio := float64(count24h) / avgDaily
		// Normalizar: ratio de 2x = threshold, acima disso aumenta linearmente
		// ratio 1.0 = normal = value 0.0
		// ratio 2.0 = threshold = value 0.5
		// ratio 4.0 = value 1.0
		if spikeRatio <= 1.0 {
			factor.Value = 0.0
		} else {
			factor.Value = (spikeRatio - 1.0) / 3.0 // Normaliza para 0-1
			if factor.Value > 1.0 {
				factor.Value = 1.0
			}
		}
		factor.RawData = map[string]any{
			"count_24h":   count24h,
			"count_7days": count7days,
			"avg_daily":   avgDaily,
			"spike_ratio": spikeRatio,
		}
	}

	factor.Exceeded = factor.Value > 0.5 // Acima de 2x o normal
	return factor
}

// ========================================
// FACTOR 4: SHADOW MODE RATIO
// "Porcentagem de ações em shadow mode"
// ========================================

type ShadowModeRatioFactor struct{}

func (f *ShadowModeRatioFactor) Calculate(db *gorm.DB, appID uuid.UUID, agentID *uuid.UUID) RiskFactor {
	factor := RiskFactor{
		Name:        FactorShadowModeRatio,
		Description: "Proporção de decisões que foram para shadow mode nos últimos 7 dias",
		Weight:      DefaultFactorWeights[FactorShadowModeRatio],
		Threshold:   DefaultFactorThresholds[FactorShadowModeRatio],
		Source:      "shadow_executions",
	}

	since := time.Now().AddDate(0, 0, -7)

	var shadowCount int64
	var totalDecisions int64

	// Execuções em shadow mode FILTRADO POR APP
	db.Table("shadow_executions").
		Where("created_at >= ? AND app_id = ?", since, appID.String()).
		Count(&shadowCount)

	// Total de decisões propostas FILTRADO POR APP
	db.Table("agent_decisions").
		Where("created_at >= ? AND app_id = ?", since, appID.String()).
		Count(&totalDecisions)

	// Adicionar shadow executions ao total (algumas podem não virar decisions)
	totalActivity := totalDecisions + shadowCount

	if totalActivity == 0 {
		factor.Value = 0.0
		factor.RawData = map[string]any{
			"shadow_count":    0,
			"total_decisions": 0,
			"ratio":           0.0,
			"note":            "Sem atividade",
		}
	} else {
		ratio := float64(shadowCount) / float64(totalActivity)
		factor.Value = ratio
		factor.RawData = map[string]any{
			"shadow_count":    shadowCount,
			"total_decisions": totalDecisions,
			"total_activity":  totalActivity,
			"ratio":           ratio,
		}
	}

	factor.Exceeded = factor.Value > factor.Threshold
	return factor
}

// ========================================
// FACTOR 5: TIME PATTERN
// "Atividade em horários incomuns"
// ========================================

type TimePatternFactor struct{}

func (f *TimePatternFactor) Calculate(db *gorm.DB, appID uuid.UUID, agentID *uuid.UUID) RiskFactor {
	factor := RiskFactor{
		Name:        FactorTimePattern,
		Description: "Proporção de atividade fora do horário comercial (8h-18h) nos últimos 7 dias",
		Weight:      DefaultFactorWeights[FactorTimePattern],
		Threshold:   DefaultFactorThresholds[FactorTimePattern],
		Source:      "audit_events",
	}

	since := time.Now().AddDate(0, 0, -7)

	// Buscar eventos e analisar horários FILTRADO POR APP
	type EventTime struct {
		CreatedAt time.Time
	}
	var events []EventTime

	db.Table("audit_events").
		Select("created_at").
		Where("created_at >= ? AND app_id = ?", since, appID.String()).
		Limit(1000). // Limitar para performance
		Find(&events)

	if len(events) == 0 {
		factor.Value = 0.0
		factor.RawData = map[string]any{
			"total_events":     0,
			"off_hours_events": 0,
			"ratio":            0.0,
			"note":             "Sem eventos",
		}
		return factor
	}

	offHoursCount := 0
	for _, e := range events {
		hour := e.CreatedAt.Hour()
		// Fora do horário comercial: antes das 8h ou depois das 18h
		if hour < 8 || hour >= 18 {
			offHoursCount++
		}
	}

	ratio := float64(offHoursCount) / float64(len(events))
	factor.Value = ratio
	factor.RawData = map[string]any{
		"total_events":     len(events),
		"off_hours_events": offHoursCount,
		"ratio":            ratio,
		"business_hours":   "08:00-18:00",
	}

	factor.Exceeded = factor.Value > factor.Threshold
	return factor
}

// ========================================
// FACTORY
// ========================================

// GetAllFactorCalculators retorna todos os calculadores de fatores
func GetAllFactorCalculators() []FactorCalculator {
	return []FactorCalculator{
		&ApprovalRateFactor{},
		&RejectionHistoryFactor{},
		&VolumeSpikeFactor{},
		&ShadowModeRatioFactor{},
		&TimePatternFactor{},
	}
}
