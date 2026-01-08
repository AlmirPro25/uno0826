package policy

import (
	"fmt"
	"reflect"
	"strings"
	"time"

	"prost-qs/backend/internal/explainability"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// POLICY SERVICE - AVALIADOR DE REGRAS
// "Toda decisão crítica passa por aqui"
// ========================================

type PolicyService struct {
	db               *gorm.DB
	thresholdService *ThresholdService              // Integração passiva com thresholds
	timelineService  *explainability.TimelineService // Registro de timeline (Fase 18)
}

func NewPolicyService(db *gorm.DB) *PolicyService {
	return &PolicyService{
		db:               db,
		thresholdService: NewThresholdService(db),
		timelineService:  explainability.NewTimelineService(db),
	}
}

// SetThresholdService permite injetar o ThresholdService
func (s *PolicyService) SetThresholdService(ts *ThresholdService) {
	s.thresholdService = ts
}

// SetTimelineService permite injetar o TimelineService
func (s *PolicyService) SetTimelineService(ts *explainability.TimelineService) {
	s.timelineService = ts
}

// ========================================
// CRUD
// ========================================

// CreatePolicy cria uma nova política
func (s *PolicyService) CreatePolicy(policy *Policy) error {
	policy.ID = uuid.New()
	policy.Version = 1
	policy.CreatedAt = time.Now()
	policy.UpdatedAt = time.Now()
	
	return s.db.Create(policy).Error
}

// GetPolicy busca uma política por ID
func (s *PolicyService) GetPolicy(id uuid.UUID) (*Policy, error) {
	var policy Policy
	if err := s.db.Where("id = ?", id).First(&policy).Error; err != nil {
		return nil, err
	}
	return &policy, nil
}

// GetPolicyByName busca uma política por nome
func (s *PolicyService) GetPolicyByName(name string) (*Policy, error) {
	var policy Policy
	if err := s.db.Where("name = ? AND active = ?", name, true).First(&policy).Error; err != nil {
		return nil, err
	}
	return &policy, nil
}

// ListPolicies lista todas as políticas
func (s *PolicyService) ListPolicies(activeOnly bool) ([]Policy, error) {
	var policies []Policy
	query := s.db.Order("priority DESC, created_at DESC")
	if activeOnly {
		query = query.Where("active = ?", true)
	}
	if err := query.Find(&policies).Error; err != nil {
		return nil, err
	}
	return policies, nil
}

// ListPoliciesForResource lista políticas para um recurso específico
func (s *PolicyService) ListPoliciesForResource(resource, action string) ([]Policy, error) {
	var policies []Policy
	err := s.db.Where(
		"active = ? AND (resource = ? OR resource = ?) AND (action = ? OR action = ?)",
		true, resource, ResourceAll, action, ActionAll,
	).Order("priority DESC").Find(&policies).Error
	
	return policies, err
}

// UpdatePolicy atualiza uma política (cria nova versão)
func (s *PolicyService) UpdatePolicy(id uuid.UUID, updates *Policy) error {
	var existing Policy
	if err := s.db.Where("id = ?", id).First(&existing).Error; err != nil {
		return err
	}
	
	// Incrementar versão
	updates.Version = existing.Version + 1
	updates.UpdatedAt = time.Now()
	
	return s.db.Model(&existing).Updates(updates).Error
}

// DeactivatePolicy desativa uma política (não deleta)
func (s *PolicyService) DeactivatePolicy(id uuid.UUID) error {
	return s.db.Model(&Policy{}).Where("id = ?", id).Updates(map[string]any{
		"active":     false,
		"updated_at": time.Now(),
	}).Error
}

// ========================================
// AVALIAÇÃO - O CORAÇÃO DO ENGINE
// ========================================

// Evaluate avalia uma ação contra todas as políticas aplicáveis
// Integração passiva com thresholds: retorna recomendação, não executa
func (s *PolicyService) Evaluate(req EvaluationRequest) (*EvaluationResponse, error) {
	// Buscar políticas aplicáveis
	policies, err := s.ListPoliciesForResource(req.Resource, req.Action)
	if err != nil {
		return nil, err
	}
	
	// Se não há políticas, permitir por padrão
	if len(policies) == 0 {
		return &EvaluationResponse{
			Allowed: true,
			Result:  ResultAllowed,
			Reason:  "Nenhuma política aplicável - permitido por padrão",
		}, nil
	}
	
	// Avaliar cada política em ordem de prioridade
	for _, policy := range policies {
		matches, err := s.evaluateConditions(policy.Conditions, req.Context)
		if err != nil {
			continue // Pular política com erro
		}
		
		if matches {
			// Política aplicável encontrada
			result := s.effectToResult(policy.Effect)
			
			// Logar avaliação
			evalID := uuid.New()
			eval := &PolicyEvaluation{
				ID:          evalID,
				PolicyID:    &policy.ID,
				PolicyName:  policy.Name,
				Resource:    req.Resource,
				Action:      req.Action,
				Context:     req.Context,
				Result:      result,
				Reason:      policy.Reason,
				ActorID:     req.ActorID,
				ActorType:   req.ActorType,
				EvaluatedAt: time.Now(),
			}
			s.db.Create(eval)
			
			policyIDStr := policy.ID.String()
			evalIDStr := evalID.String()
			response := &EvaluationResponse{
				Allowed:      result == ResultAllowed,
				Result:       result,
				EvaluationID: &evalIDStr,
				PolicyID:     &policyIDStr,
				PolicyName:   &policy.Name,
				Reason:       policy.Reason,
			}
			
			// ========================================
			// INTEGRAÇÃO PASSIVA COM THRESHOLDS
			// Thresholds influenciam, não decidem
			// ========================================
			if s.thresholdService != nil {
				thresholdRec := s.getThresholdRecommendation(policy.ID, req.Context)
				if thresholdRec != nil {
					response.ThresholdRecommendation = thresholdRec
				}
			}
			
			// ========================================
			// REGISTRO DE TIMELINE - Fase 18
			// "Timeline é registro, não julgamento"
			// ========================================
			if s.timelineService != nil {
				s.recordTimeline(evalID, req, response, &policy)
			}
			
			return response, nil
		}
	}
	
	// Nenhuma política matched - permitir por padrão
	defaultEvalID := uuid.New()
	defaultEvalIDStr := defaultEvalID.String()
	defaultResponse := &EvaluationResponse{
		Allowed:      true,
		Result:       ResultAllowed,
		EvaluationID: &defaultEvalIDStr,
		Reason:       "Nenhuma política correspondente - permitido por padrão",
	}
	
	// Registrar timeline mesmo para decisões padrão
	if s.timelineService != nil {
		s.recordTimeline(defaultEvalID, req, defaultResponse, nil)
	}
	
	return defaultResponse, nil
}

// getThresholdRecommendation obtém recomendação de threshold baseada no contexto
// Esta é a integração PASSIVA - retorna recomendação, não executa ação
func (s *PolicyService) getThresholdRecommendation(policyID uuid.UUID, context map[string]any) *ThresholdRecommendationInfo {
	// Extrair risk_score e risk_level do contexto
	riskScore, hasRiskScore := context["risk_score"].(float64)
	riskLevel, hasRiskLevel := context["risk_level"].(string)
	
	// Se não tem risk_score, tentar converter de int
	if !hasRiskScore {
		if rs, ok := context["risk_score"].(int); ok {
			riskScore = float64(rs)
			hasRiskScore = true
		}
	}
	
	// Se não tem risk_level, derivar do score
	if !hasRiskLevel && hasRiskScore {
		riskLevel = s.scoreToLevel(riskScore)
		hasRiskLevel = true
	}
	
	// Se não tem dados de risco, não há recomendação
	if !hasRiskLevel {
		return nil
	}
	
	// Extrair app_id do contexto (opcional)
	var appID *uuid.UUID
	if appIDStr, ok := context["app_id"].(string); ok {
		if parsed, err := uuid.Parse(appIDStr); err == nil {
			appID = &parsed
		}
	}
	
	// Buscar recomendação do threshold service
	rec, err := s.thresholdService.GetRecommendation(policyID, appID, riskLevel, riskScore)
	if err != nil {
		return nil
	}
	
	// Converter para ThresholdRecommendationInfo
	info := &ThresholdRecommendationInfo{
		RecommendedAction: string(rec.Action),
		RiskLevel:         rec.RiskLevel,
		RiskScore:         rec.RiskScore,
		Reason:            rec.Reason,
		IsDefault:         rec.IsDefault,
	}
	
	if rec.ThresholdID != nil {
		thresholdIDStr := rec.ThresholdID.String()
		info.ThresholdID = &thresholdIDStr
	}
	
	return info
}

// scoreToLevel converte score numérico para nível de risco
func (s *PolicyService) scoreToLevel(score float64) string {
	switch {
	case score >= 0.8:
		return "critical"
	case score >= 0.6:
		return "high"
	case score >= 0.3:
		return "medium"
	default:
		return "low"
	}
}

// EvaluateAndEnforce avalia e retorna erro se negado
func (s *PolicyService) EvaluateAndEnforce(req EvaluationRequest) error {
	result, err := s.Evaluate(req)
	if err != nil {
		return err
	}
	
	if !result.Allowed {
		return fmt.Errorf("bloqueado por política: %s", result.Reason)
	}
	
	if result.Result == ResultPendingApproval {
		return fmt.Errorf("requer aprovação: %s", result.Reason)
	}
	
	return nil
}

// evaluateConditions avalia todas as condições de uma política
func (s *PolicyService) evaluateConditions(conditions []Condition, context map[string]any) (bool, error) {
	if len(conditions) == 0 {
		return true, nil // Sem condições = sempre aplica
	}
	
	for _, cond := range conditions {
		matches, err := s.evaluateCondition(cond, context)
		if err != nil {
			return false, err
		}
		if !matches {
			return false, nil // AND lógico - todas devem ser verdadeiras
		}
	}
	
	return true, nil
}

// evaluateCondition avalia uma única condição
func (s *PolicyService) evaluateCondition(cond Condition, context map[string]any) (bool, error) {
	// Extrair valor do contexto (suporta nested: "user.role")
	value := s.extractValue(cond.Field, context)
	
	switch cond.Operator {
	case OpEqual:
		return s.compareEqual(value, cond.Value), nil
	case OpNotEqual:
		return !s.compareEqual(value, cond.Value), nil
	case OpGreaterThan:
		return s.compareNumeric(value, cond.Value, ">"), nil
	case OpGreaterOrEq:
		return s.compareNumeric(value, cond.Value, ">="), nil
	case OpLessThan:
		return s.compareNumeric(value, cond.Value, "<"), nil
	case OpLessOrEq:
		return s.compareNumeric(value, cond.Value, "<="), nil
	case OpIn:
		return s.compareIn(value, cond.Value), nil
	case OpNotIn:
		return !s.compareIn(value, cond.Value), nil
	case OpContains:
		return s.compareContains(value, cond.Value), nil
	default:
		return false, fmt.Errorf("operador desconhecido: %s", cond.Operator)
	}
}

// extractValue extrai valor do contexto (suporta nested paths)
func (s *PolicyService) extractValue(field string, context map[string]any) any {
	parts := strings.Split(field, ".")
	current := any(context)
	
	for _, part := range parts {
		switch v := current.(type) {
		case map[string]any:
			current = v[part]
		default:
			return nil
		}
	}
	
	return current
}

// compareEqual compara igualdade
func (s *PolicyService) compareEqual(a, b any) bool {
	return reflect.DeepEqual(a, b)
}

// compareNumeric compara valores numéricos
func (s *PolicyService) compareNumeric(a, b any, op string) bool {
	aFloat := s.toFloat64(a)
	bFloat := s.toFloat64(b)
	
	switch op {
	case ">":
		return aFloat > bFloat
	case ">=":
		return aFloat >= bFloat
	case "<":
		return aFloat < bFloat
	case "<=":
		return aFloat <= bFloat
	}
	return false
}

// compareIn verifica se valor está na lista
func (s *PolicyService) compareIn(value any, list any) bool {
	listSlice, ok := list.([]any)
	if !ok {
		// Tentar converter de []interface{}
		if reflect.TypeOf(list).Kind() == reflect.Slice {
			v := reflect.ValueOf(list)
			listSlice = make([]any, v.Len())
			for i := 0; i < v.Len(); i++ {
				listSlice[i] = v.Index(i).Interface()
			}
		} else {
			return false
		}
	}
	
	for _, item := range listSlice {
		if s.compareEqual(value, item) {
			return true
		}
	}
	return false
}

// compareContains verifica se string contém substring
func (s *PolicyService) compareContains(value, substr any) bool {
	vStr, ok1 := value.(string)
	sStr, ok2 := substr.(string)
	if !ok1 || !ok2 {
		return false
	}
	return strings.Contains(vStr, sStr)
}

// toFloat64 converte para float64
func (s *PolicyService) toFloat64(v any) float64 {
	switch n := v.(type) {
	case int:
		return float64(n)
	case int64:
		return float64(n)
	case float64:
		return n
	case float32:
		return float64(n)
	default:
		return 0
	}
}

// effectToResult converte efeito para resultado
func (s *PolicyService) effectToResult(effect string) string {
	switch effect {
	case EffectAllow:
		return ResultAllowed
	case EffectDeny:
		return ResultDenied
	case EffectRequireApproval:
		return ResultPendingApproval
	default:
		return ResultDenied
	}
}

// ========================================
// HISTÓRICO
// ========================================

// GetEvaluations busca histórico de avaliações
func (s *PolicyService) GetEvaluations(resource, action string, limit int) ([]PolicyEvaluation, error) {
	var evals []PolicyEvaluation
	query := s.db.Order("evaluated_at DESC").Limit(limit)
	
	if resource != "" {
		query = query.Where("resource = ?", resource)
	}
	if action != "" {
		query = query.Where("action = ?", action)
	}
	
	if err := query.Find(&evals).Error; err != nil {
		return nil, err
	}
	return evals, nil
}

// GetEvaluationsByActor busca avaliações por ator
func (s *PolicyService) GetEvaluationsByActor(actorID uuid.UUID, limit int) ([]PolicyEvaluation, error) {
	var evals []PolicyEvaluation
	err := s.db.Where("actor_id = ?", actorID).
		Order("evaluated_at DESC").
		Limit(limit).
		Find(&evals).Error
	return evals, err
}


// ========================================
// SEED - POLÍTICAS PADRÃO
// ========================================

// SeedDefaultPolicies cria as políticas padrão do sistema
func (s *PolicyService) SeedDefaultPolicies() error {
	fmt.Println("🔧 [SEED] Iniciando seed de políticas padrão...")
	
	// Contar políticas existentes
	var count int64
	s.db.Model(&Policy{}).Count(&count)
	fmt.Printf("🔧 [SEED] Políticas existentes no banco: %d\n", count)
	
	defaultPolicies := []Policy{
		// 1. Super Admin tem acesso total (prioridade máxima)
		{
			Name:        "super_admin_override",
			Description: "Super admin tem acesso total a todas as operações",
			Resource:    ResourceAll,
			Action:      ActionAll,
			Conditions: []Condition{
				{Field: "user.role", Operator: OpEqual, Value: "super_admin"},
			},
			Effect:   EffectAllow,
			Reason:   "Super admin tem acesso total",
			Priority: 1000,
			Active:   true,
		},
		// 2. Admin tem acesso amplo (prioridade alta)
		{
			Name:        "admin_access",
			Description: "Admin tem acesso a operações administrativas",
			Resource:    ResourceAll,
			Action:      ActionAll,
			Conditions: []Condition{
				{Field: "user.role", Operator: OpEqual, Value: "admin"},
			},
			Effect:   EffectAllow,
			Reason:   "Admin tem acesso administrativo",
			Priority: 900,
			Active:   true,
		},
		// 3. Débito alto requer aprovação (usuários normais)
		{
			Name:        "high_value_debit",
			Description: "Débito acima de R$ 100 requer aprovação humana",
			Resource:    ResourceLedger,
			Action:      ActionDebit,
			Conditions: []Condition{
				{Field: "amount", Operator: OpGreaterThan, Value: float64(10000)}, // 10000 centavos = R$ 100
				{Field: "user.role", Operator: OpNotIn, Value: []any{"admin", "super_admin"}},
			},
			Effect:   EffectRequireApproval,
			Reason:   "Débito acima de R$ 100 requer aprovação humana",
			Priority: 500,
			Active:   true,
		},
		// 4. Bloquear agente com risco alto
		{
			Name:        "block_high_risk_agent",
			Description: "Agentes com risco >= 60% são bloqueados automaticamente",
			Resource:    ResourceAgent,
			Action:      ActionExecute,
			Conditions: []Condition{
				{Field: "risk_score", Operator: OpGreaterOrEq, Value: float64(0.6)},
			},
			Effect:   EffectDeny,
			Reason:   "Risco >= 60% é bloqueado automaticamente",
			Priority: 600,
			Active:   true,
		},
		// 5. Agente com risco médio requer aprovação
		{
			Name:        "medium_risk_agent_approval",
			Description: "Agentes com risco entre 30% e 60% requerem aprovação",
			Resource:    ResourceAgent,
			Action:      ActionExecute,
			Conditions: []Condition{
				{Field: "risk_score", Operator: OpGreaterOrEq, Value: float64(0.3)},
				{Field: "risk_score", Operator: OpLessThan, Value: float64(0.6)},
			},
			Effect:   EffectRequireApproval,
			Reason:   "Risco entre 30% e 60% requer aprovação humana",
			Priority: 550,
			Active:   true,
		},
		// 6. Pagamento alto requer aprovação
		{
			Name:        "high_value_payment",
			Description: "Pagamentos acima de R$ 1000 requerem aprovação",
			Resource:    ResourcePayment,
			Action:      "create",
			Conditions: []Condition{
				{Field: "amount", Operator: OpGreaterThan, Value: float64(100000)}, // R$ 1000
				{Field: "user.role", Operator: OpNotIn, Value: []any{"admin", "super_admin"}},
			},
			Effect:   EffectRequireApproval,
			Reason:   "Pagamento acima de R$ 1000 requer aprovação",
			Priority: 500,
			Active:   true,
		},
	}

	for _, policy := range defaultPolicies {
		// Verificar se já existe
		existing, err := s.GetPolicyByName(policy.Name)
		if err == nil && existing != nil {
			fmt.Printf("  ⏭️ Política '%s' já existe, pulando\n", policy.Name)
			continue // Já existe, pular
		}

		// Criar política
		fmt.Printf("  ➕ Criando política '%s'...\n", policy.Name)
		if err := s.CreatePolicy(&policy); err != nil {
			fmt.Printf("  ❌ Erro ao criar política '%s': %v\n", policy.Name, err)
			return err
		}
		fmt.Printf("  ✅ Política '%s' criada\n", policy.Name)
	}
	
	fmt.Println("🔧 Seed de políticas concluído")

	return nil
}

// ========================================
// TIMELINE RECORDING - Fase 18
// "Timeline é registro, não julgamento"
// ========================================

// recordTimeline registra a decisão na timeline
func (s *PolicyService) recordTimeline(evalID uuid.UUID, req EvaluationRequest, response *EvaluationResponse, policy *Policy) {
	now := time.Now()
	
	// Extrair dados do contexto
	var appID *uuid.UUID
	if appIDStr, ok := req.Context["app_id"].(string); ok {
		if parsed, err := uuid.Parse(appIDStr); err == nil {
			appID = &parsed
		}
	}
	
	var sessionID *string
	if sid, ok := req.Context["session_id"].(string); ok {
		sessionID = &sid
	}
	
	// Extrair risk data
	riskScore := 0.0
	if rs, ok := req.Context["risk_score"].(float64); ok {
		riskScore = rs
	}
	
	riskLevel := ""
	if rl, ok := req.Context["risk_level"].(string); ok {
		riskLevel = rl
	} else {
		riskLevel = s.scoreToLevel(riskScore)
	}
	
	// Construir risk factors snapshot
	var riskFactors []explainability.RiskFactorSnapshot
	if factors, ok := req.Context["risk_factors"].([]any); ok {
		for _, f := range factors {
			if fm, ok := f.(map[string]any); ok {
				factor := explainability.RiskFactorSnapshot{
					Name:     getString(fm, "name"),
					Value:    getFloat64(fm, "value"),
					Weight:   getFloat64(fm, "weight"),
					Exceeded: getBool(fm, "exceeded"),
				}
				riskFactors = append(riskFactors, factor)
			}
		}
	}
	
	// Construir timeline entry
	timeline := &explainability.DecisionTimeline{
		ID:           uuid.New(),
		DecisionID:   evalID,
		DecisionType: "policy_eval",
		
		// Contexto
		Timestamp: now,
		AppID:     appID,
		ActorID:   req.ActorID,
		ActorType: req.ActorType,
		SessionID: sessionID,
		
		// O que foi avaliado
		Resource: req.Resource,
		Action:   req.Action,
		Context:  explainability.JSONMap(req.Context),
		
		// Estado de risco
		RiskScore:   riskScore,
		RiskLevel:   riskLevel,
		RiskFactors: riskFactors,
		
		// Resultado final
		FinalOutcome: response.Result,
		CreatedAt:    now,
	}
	
	// Policy data
	if policy != nil {
		timeline.PolicyID = &policy.ID
		timeline.PolicyName = policy.Name
		timeline.PolicyResult = response.Result
		timeline.PolicyReason = policy.Reason
	} else {
		timeline.PolicyName = "none"
		timeline.PolicyResult = response.Result
		timeline.PolicyReason = response.Reason
	}
	
	// Threshold data
	if response.ThresholdRecommendation != nil {
		rec := response.ThresholdRecommendation
		if rec.ThresholdID != nil {
			if thresholdID, err := uuid.Parse(*rec.ThresholdID); err == nil {
				timeline.ThresholdID = &thresholdID
			}
		}
		timeline.ThresholdAction = rec.RecommendedAction
		timeline.ThresholdReason = rec.Reason
	}
	
	// Registrar (ignora erro para não bloquear a decisão)
	_ = s.timelineService.RecordTimeline(timeline)
}

// Helper functions para extrair valores do map
func getString(m map[string]any, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

func getFloat64(m map[string]any, key string) float64 {
	if v, ok := m[key].(float64); ok {
		return v
	}
	if v, ok := m[key].(int); ok {
		return float64(v)
	}
	return 0
}

func getBool(m map[string]any, key string) bool {
	if v, ok := m[key].(bool); ok {
		return v
	}
	return false
}
