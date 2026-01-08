package autonomy

import (
	"errors"
	"sync"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// AUTONOMY SERVICE - RESPONDE PERGUNTAS
// "O sistema sabe responder antes de agir"
// ========================================

var (
	ErrAgentNotFound       = errors.New("agente não encontrado")
	ErrActionNotDefined    = errors.New("ação não definida na matriz de autonomia")
	ErrAutonomyForbidden   = errors.New("ação proibida por política de autonomia")
	ErrExceedsMaxAmount    = errors.New("valor excede limite de autonomia")
	ErrDailyLimitExceeded  = errors.New("limite diário de ações excedido")
	ErrNoAutonomyProfile   = errors.New("agente sem perfil de autonomia definido")
)

type AutonomyService struct {
	db              *gorm.DB
	actionMatrix    map[string]ActionDefinition // cache da matriz
	matrixMutex     sync.RWMutex
}

func NewAutonomyService(db *gorm.DB) *AutonomyService {
	s := &AutonomyService{
		db:           db,
		actionMatrix: make(map[string]ActionDefinition),
	}
	s.loadDefaultMatrix()
	return s
}

// ========================================
// MATRIZ DE AUTONOMIA
// ========================================

// loadDefaultMatrix carrega a matriz padrão em memória
func (s *AutonomyService) loadDefaultMatrix() {
	s.matrixMutex.Lock()
	defer s.matrixMutex.Unlock()

	for _, def := range DefaultActionDefinitions {
		key := s.actionKey(def.Domain, def.Action)
		s.actionMatrix[key] = def
	}
}

// actionKey gera chave única para ação
func (s *AutonomyService) actionKey(domain, action string) string {
	return domain + ":" + action
}

// GetActionDefinition busca definição de uma ação
func (s *AutonomyService) GetActionDefinition(domain, action string) (*ActionDefinition, error) {
	s.matrixMutex.RLock()
	defer s.matrixMutex.RUnlock()

	// Busca específica primeiro
	key := s.actionKey(domain, action)
	if def, exists := s.actionMatrix[key]; exists {
		return &def, nil
	}

	// Busca genérica (domain = "*")
	key = s.actionKey("*", action)
	if def, exists := s.actionMatrix[key]; exists {
		return &def, nil
	}

	return nil, ErrActionNotDefined
}

// GetAllDefinitions retorna todas as definições (para documentação/API)
func (s *AutonomyService) GetAllDefinitions() []ActionDefinition {
	s.matrixMutex.RLock()
	defer s.matrixMutex.RUnlock()

	result := make([]ActionDefinition, 0, len(s.actionMatrix))
	for _, def := range s.actionMatrix {
		result = append(result, def)
	}
	return result
}

// ========================================
// PERFIL DE AUTONOMIA
// ========================================

// GetProfile busca perfil de autonomia de um agente
func (s *AutonomyService) GetProfile(agentID uuid.UUID) (*AutonomyProfile, error) {
	var profile AutonomyProfile
	if err := s.db.Where("agent_id = ?", agentID).First(&profile).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoAutonomyProfile
		}
		return nil, err
	}
	return &profile, nil
}

// CreateProfile cria perfil de autonomia para um agente
func (s *AutonomyService) CreateProfile(agentID, createdBy uuid.UUID, baseLevel AutonomyLevel, reason string) (*AutonomyProfile, error) {
	profile := &AutonomyProfile{
		ID:              uuid.New(),
		AgentID:         agentID,
		BaseLevel:       baseLevel,
		ActionOverrides: make(map[string]AutonomyLevel),
		MaxDailyActions: 100, // padrão conservador
		MaxAmountPerAction: 10000, // R$ 100,00 padrão
		CreatedBy:       createdBy,
		Reason:          reason,
	}

	if err := s.db.Create(profile).Error; err != nil {
		return nil, err
	}

	return profile, nil
}

// UpdateProfile atualiza perfil de autonomia
func (s *AutonomyService) UpdateProfile(profile *AutonomyProfile) error {
	return s.db.Save(profile).Error
}

// SetActionOverride define override de autonomia para uma ação específica
func (s *AutonomyService) SetActionOverride(agentID uuid.UUID, action string, level AutonomyLevel) error {
	profile, err := s.GetProfile(agentID)
	if err != nil {
		return err
	}

	// Validar contra matriz - não pode exceder MaxAutonomy
	def, err := s.GetActionDefinition("*", action)
	if err != nil {
		return err
	}

	if level > def.MaxAutonomy {
		return errors.New("nível de autonomia excede máximo permitido para esta ação")
	}

	if profile.ActionOverrides == nil {
		profile.ActionOverrides = make(map[string]AutonomyLevel)
	}
	profile.ActionOverrides[action] = level

	return s.db.Save(profile).Error
}

// ========================================
// VERIFICAÇÃO DE AUTONOMIA (CORE)
// "Esse agente poderia fazer isso sozinho?"
// ========================================

// Check verifica se um agente pode executar uma ação
// Esta é a função central - responde perguntas, não executa
func (s *AutonomyService) Check(req AutonomyCheckRequest) (*AutonomyCheckResponse, error) {
	// 1. Buscar definição da ação na matriz
	actionDef, err := s.GetActionDefinition(req.Domain, req.Action)
	if err != nil {
		return &AutonomyCheckResponse{
			Allowed: false,
			Reason:  "Ação não definida na matriz de autonomia",
		}, err
	}

	// 2. Verificar se ação é forbidden por definição
	if actionDef.MaxAutonomy == AutonomyForbidden {
		return &AutonomyCheckResponse{
			Allowed:       false,
			AutonomyLevel: AutonomyForbidden,
			Reason:        actionDef.Reason,
			ActionDef:     actionDef,
			RequiresHuman: true,
			ShadowOnly:    false,
		}, nil
	}

	// 3. Buscar perfil do agente
	profile, err := s.GetProfile(req.AgentID)
	if err != nil {
		if errors.Is(err, ErrNoAutonomyProfile) {
			// Agente sem perfil = autonomia mínima (shadow only)
			return &AutonomyCheckResponse{
				Allowed:       true,
				AutonomyLevel: AutonomyShadow,
				Reason:        "Agente sem perfil de autonomia - apenas simulação permitida",
				ActionDef:     actionDef,
				RequiresHuman: false,
				ShadowOnly:    true,
			}, nil
		}
		return nil, err
	}

	// 4. Determinar nível de autonomia efetivo
	agentLevel := profile.GetActionLevel(req.Action)
	
	// Não pode exceder máximo da ação
	effectiveLevel := agentLevel
	if effectiveLevel > actionDef.MaxAutonomy {
		effectiveLevel = actionDef.MaxAutonomy
	}

	// 5. Verificar limites de valor
	if req.Amount > 0 && req.Amount > profile.MaxAmountPerAction {
		return &AutonomyCheckResponse{
			Allowed:       false,
			AutonomyLevel: effectiveLevel,
			Reason:        "Valor excede limite de autonomia do agente",
			ActionDef:     actionDef,
			RequiresHuman: true,
			ShadowOnly:    false,
			MaxAmount:     profile.MaxAmountPerAction,
		}, nil
	}

	// 6. Construir resposta
	response := &AutonomyCheckResponse{
		Allowed:       true,
		AutonomyLevel: effectiveLevel,
		Reason:        actionDef.Reason,
		ActionDef:     actionDef,
		RequiresHuman: actionDef.RequiresHuman || effectiveLevel == AutonomyForbidden,
		ShadowOnly:    effectiveLevel == AutonomyShadow,
		MaxAmount:     profile.MaxAmountPerAction,
	}

	return response, nil
}

// ========================================
// VALIDAÇÃO ESTÁTICA
// "Erros institucionais, não runtime"
// ========================================

// ValidateAgentCanAttempt valida se agente pode TENTAR uma ação
// Diferente de Check - esta é validação estática antes de qualquer processamento
func (s *AutonomyService) ValidateAgentCanAttempt(agentID uuid.UUID, domain, action string) error {
	// 1. Ação existe na matriz?
	actionDef, err := s.GetActionDefinition(domain, action)
	if err != nil {
		return ErrActionNotDefined
	}

	// 2. Ação é forbidden?
	if actionDef.MaxAutonomy == AutonomyForbidden {
		return ErrAutonomyForbidden
	}

	// 3. Agente tem perfil definido?
	_, err = s.GetProfile(agentID)
	if err != nil && !errors.Is(err, ErrNoAutonomyProfile) {
		return err
	}
	// Nota: agente sem perfil pode tentar (em shadow mode)

	return nil
}

// ========================================
// QUERIES PARA DOCUMENTAÇÃO/API
// ========================================

// GetForbiddenActions retorna todas as ações proibidas
func (s *AutonomyService) GetForbiddenActions() []ActionDefinition {
	s.matrixMutex.RLock()
	defer s.matrixMutex.RUnlock()

	var result []ActionDefinition
	for _, def := range s.actionMatrix {
		if def.MaxAutonomy == AutonomyForbidden {
			result = append(result, def)
		}
	}
	return result
}

// GetShadowOnlyActions retorna ações que só podem rodar em shadow
func (s *AutonomyService) GetShadowOnlyActions() []ActionDefinition {
	s.matrixMutex.RLock()
	defer s.matrixMutex.RUnlock()

	var result []ActionDefinition
	for _, def := range s.actionMatrix {
		if def.MaxAutonomy == AutonomyShadow {
			result = append(result, def)
		}
	}
	return result
}

// GetAutonomousActions retorna ações que podem ser autônomas
func (s *AutonomyService) GetAutonomousActions() []ActionDefinition {
	s.matrixMutex.RLock()
	defer s.matrixMutex.RUnlock()

	var result []ActionDefinition
	for _, def := range s.actionMatrix {
		if def.MaxAutonomy >= AutonomyAudited {
			result = append(result, def)
		}
	}
	return result
}
