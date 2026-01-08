package policy

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// THRESHOLD SERVICE - FASE 17 STEP 2
// "Thresholds influenciam, não decidem"
// ========================================

type ThresholdService struct {
	db *gorm.DB
}

func NewThresholdService(db *gorm.DB) *ThresholdService {
	return &ThresholdService{db: db}
}

// ========================================
// CRUD
// ========================================

// CreateThreshold cria um novo threshold
func (s *ThresholdService) CreateThreshold(req CreateThresholdRequest, createdBy uuid.UUID) (*PolicyThreshold, error) {
	// Validar risk level
	if !isValidRiskLevel(req.RiskLevel) {
		return nil, fmt.Errorf("risk_level inválido: %s (use: low, medium, high, critical)", req.RiskLevel)
	}

	// Validar action
	if !isValidThresholdAction(req.Action) {
		return nil, fmt.Errorf("action inválida: %s", req.Action)
	}

	// Verificar se já existe threshold para esta combinação
	existing, _ := s.GetThreshold(req.PolicyID, req.AppID, req.RiskLevel)
	if existing != nil {
		return nil, fmt.Errorf("já existe threshold para policy=%s, app=%v, risk_level=%s", 
			req.PolicyID, req.AppID, req.RiskLevel)
	}

	threshold := &PolicyThreshold{
		ID:          uuid.New(),
		PolicyID:    req.PolicyID,
		AppID:       req.AppID,
		RiskLevel:   req.RiskLevel,
		Action:      req.Action,
		Description: req.Description,
		Active:      true,
		CreatedBy:   createdBy,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.Create(threshold).Error; err != nil {
		return nil, err
	}

	return threshold, nil
}

// GetThreshold busca threshold específico
func (s *ThresholdService) GetThreshold(policyID uuid.UUID, appID *uuid.UUID, riskLevel string) (*PolicyThreshold, error) {
	var threshold PolicyThreshold
	query := s.db.Where("policy_id = ? AND risk_level = ? AND active = ?", policyID, riskLevel, true)
	
	if appID != nil {
		query = query.Where("app_id = ?", appID)
	} else {
		query = query.Where("app_id IS NULL")
	}

	if err := query.First(&threshold).Error; err != nil {
		return nil, err
	}
	return &threshold, nil
}

// GetThresholdByID busca threshold por ID
func (s *ThresholdService) GetThresholdByID(id uuid.UUID) (*PolicyThreshold, error) {
	var threshold PolicyThreshold
	if err := s.db.Where("id = ?", id).First(&threshold).Error; err != nil {
		return nil, err
	}
	return &threshold, nil
}

// ListThresholdsForPolicy lista thresholds de uma policy
func (s *ThresholdService) ListThresholdsForPolicy(policyID uuid.UUID) ([]PolicyThreshold, error) {
	var thresholds []PolicyThreshold
	err := s.db.Where("policy_id = ? AND active = ?", policyID, true).
		Order("risk_level ASC").
		Find(&thresholds).Error
	return thresholds, err
}

// ListThresholdsForApp lista thresholds de um app
func (s *ThresholdService) ListThresholdsForApp(appID uuid.UUID) ([]PolicyThreshold, error) {
	var thresholds []PolicyThreshold
	err := s.db.Where("app_id = ? AND active = ?", appID, true).
		Order("policy_id, risk_level ASC").
		Find(&thresholds).Error
	return thresholds, err
}

// UpdateThreshold atualiza um threshold (com versionamento)
func (s *ThresholdService) UpdateThreshold(id uuid.UUID, req UpdateThresholdRequest, updatedBy string) (*PolicyThreshold, error) {
	threshold, err := s.GetThresholdByID(id)
	if err != nil {
		return nil, fmt.Errorf("threshold não encontrado: %w", err)
	}

	// Validar action
	if !isValidThresholdAction(req.Action) {
		return nil, fmt.Errorf("action inválida: %s", req.Action)
	}

	// Se a action mudou, registrar ajuste
	if threshold.Action != req.Action {
		adjustment := &ThresholdAdjustment{
			ID:             uuid.New(),
			ThresholdID:    id,
			PreviousAction: threshold.Action,
			NewAction:      req.Action,
			Reason:         req.Reason,
			TriggerType:    "manual",
			AdjustedBy:     updatedBy,
			CreatedAt:      time.Now(),
		}
		if err := s.db.Create(adjustment).Error; err != nil {
			return nil, fmt.Errorf("erro ao registrar ajuste: %w", err)
		}
	}

	// Atualizar threshold
	threshold.Action = req.Action
	if req.Description != "" {
		threshold.Description = req.Description
	}
	threshold.UpdatedAt = time.Now()

	if err := s.db.Save(threshold).Error; err != nil {
		return nil, err
	}

	return threshold, nil
}

// DeactivateThreshold desativa um threshold
func (s *ThresholdService) DeactivateThreshold(id uuid.UUID, reason string, deactivatedBy string) error {
	threshold, err := s.GetThresholdByID(id)
	if err != nil {
		return err
	}

	// Registrar ajuste de desativação
	adjustment := &ThresholdAdjustment{
		ID:             uuid.New(),
		ThresholdID:    id,
		PreviousAction: threshold.Action,
		NewAction:      ThresholdActionBlock, // Desativado = bloqueado
		Reason:         reason,
		TriggerType:    "manual",
		AdjustedBy:     deactivatedBy,
		CreatedAt:      time.Now(),
	}
	s.db.Create(adjustment)

	return s.db.Model(&PolicyThreshold{}).Where("id = ?", id).Updates(map[string]any{
		"active":     false,
		"updated_at": time.Now(),
	}).Error
}

// ========================================
// RECOMENDAÇÃO (INTEGRAÇÃO PASSIVA)
// ========================================

// GetRecommendation retorna recomendação baseada em threshold
// Esta é a integração PASSIVA - retorna recomendação, não executa ação
func (s *ThresholdService) GetRecommendation(policyID uuid.UUID, appID *uuid.UUID, riskLevel string, riskScore float64) (*ThresholdRecommendation, error) {
	recommendation := &ThresholdRecommendation{
		PolicyID:  policyID,
		AppID:     appID,
		RiskLevel: riskLevel,
		RiskScore: riskScore,
	}

	// 1. Tentar buscar threshold específico para o app
	if appID != nil {
		threshold, err := s.GetThreshold(policyID, appID, riskLevel)
		if err == nil && threshold != nil {
			recommendation.ThresholdID = &threshold.ID
			recommendation.Action = threshold.Action
			recommendation.Reason = fmt.Sprintf("Threshold específico para app: %s", threshold.Description)
			recommendation.IsDefault = false
			return recommendation, nil
		}
	}

	// 2. Tentar buscar threshold global da policy
	threshold, err := s.GetThreshold(policyID, nil, riskLevel)
	if err == nil && threshold != nil {
		recommendation.ThresholdID = &threshold.ID
		recommendation.Action = threshold.Action
		recommendation.Reason = fmt.Sprintf("Threshold global da policy: %s", threshold.Description)
		recommendation.IsDefault = false
		return recommendation, nil
	}

	// 3. Usar threshold padrão do sistema
	recommendation.Action = GetDefaultAction(riskLevel)
	recommendation.Reason = fmt.Sprintf("Threshold padrão do sistema para risco %s", riskLevel)
	recommendation.IsDefault = true
	return recommendation, nil
}

// ========================================
// HISTÓRICO DE AJUSTES
// ========================================

// GetAdjustmentHistory retorna histórico de ajustes de um threshold
func (s *ThresholdService) GetAdjustmentHistory(thresholdID uuid.UUID, limit int) ([]ThresholdAdjustment, error) {
	var adjustments []ThresholdAdjustment
	err := s.db.Where("threshold_id = ?", thresholdID).
		Order("created_at DESC").
		Limit(limit).
		Find(&adjustments).Error
	return adjustments, err
}

// RevertAdjustment reverte um ajuste
func (s *ThresholdService) RevertAdjustment(adjustmentID uuid.UUID, reason string, revertedBy string) error {
	var adjustment ThresholdAdjustment
	if err := s.db.Where("id = ?", adjustmentID).First(&adjustment).Error; err != nil {
		return fmt.Errorf("ajuste não encontrado: %w", err)
	}

	if adjustment.Reverted {
		return fmt.Errorf("ajuste já foi revertido")
	}

	// Buscar threshold
	threshold, err := s.GetThresholdByID(adjustment.ThresholdID)
	if err != nil {
		return fmt.Errorf("threshold não encontrado: %w", err)
	}

	// Reverter para ação anterior
	threshold.Action = adjustment.PreviousAction
	threshold.UpdatedAt = time.Now()
	if err := s.db.Save(threshold).Error; err != nil {
		return err
	}

	// Marcar ajuste como revertido
	now := time.Now()
	adjustment.Reverted = true
	adjustment.RevertedAt = &now
	adjustment.RevertedBy = &revertedBy
	adjustment.RevertReason = reason
	return s.db.Save(&adjustment).Error
}

// ========================================
// HELPERS
// ========================================

func isValidRiskLevel(level string) bool {
	valid := map[string]bool{
		"low":      true,
		"medium":   true,
		"high":     true,
		"critical": true,
	}
	return valid[level]
}

func isValidThresholdAction(action ThresholdAction) bool {
	valid := map[ThresholdAction]bool{
		ThresholdActionAllow:           true,
		ThresholdActionRequireApproval: true,
		ThresholdActionShadow:          true,
		ThresholdActionBlock:           true,
	}
	return valid[action]
}
