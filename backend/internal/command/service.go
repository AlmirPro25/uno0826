package command

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"prost-qs/backend/internal/ad"
	"prost-qs/backend/internal/ai"
	"prost-qs/backend/internal/event"
	"prost-qs/backend/internal/identity"
	"prost-qs/backend/internal/payment"
)

// CommandService é responsável por rotear e executar comandos de forma soberana.
type CommandService struct {
	db              *gorm.DB
	eventService    *event.EventService
	identityService *identity.IdentityService
	paymentService  *payment.PaymentService
	aiService       *ai.AIService
	adService       *ad.AdService
	commandHandlers map[string]CommandHandler
}

// NewCommandService cria uma nova instância de CommandService.
func NewCommandService(
	db *gorm.DB,
	eventService *event.EventService,
	identityService *identity.IdentityService,
	paymentService *payment.PaymentService,
	aiService *ai.AIService,
	adService *ad.AdService,
) *CommandService {
	s := &CommandService{
		db:              db,
		eventService:    eventService,
		identityService: identityService,
		paymentService:  paymentService,
		aiService:       aiService,
		adService:       adService,
		commandHandlers: make(map[string]CommandHandler),
	}
	s.registerDefaultHandlers()
	return s
}

// RegisterHandler registra um CommandHandler para um tipo de comando específico.
func (s *CommandService) RegisterHandler(commandType string, handler CommandHandler) {
	s.commandHandlers[commandType] = handler
}

// registerDefaultHandlers registra os handlers padrão do sistema.
func (s *CommandService) registerDefaultHandlers() {
	// Exemplo: handler para criar usuário
	s.RegisterHandler("CreateUser", &CreateUserCommandHandler{identityService: s.identityService})
	s.RegisterHandler("InitiatePayment", &InitiatePaymentCommandHandler{paymentService: s.paymentService})
	s.RegisterHandler("EvolveSchemaAI", &EvolveSchemaAICommandHandler{aiService: s.aiService})
	s.RegisterHandler("TrackImpression", &TrackImpressionCommandHandler{adService: s.adService})
}

// ExecuteCommand executa um comando genérico seguindo o motor soberano:
// 1. Inicia Transação
// 2. Valida Comando
// 3. Executa Lógica (Gera Intenção/Evento)
// 4. Salva Evento no Ledger
// 5. Aplica Projeção no Estado (Reducer)
// 6. Commit (Atômico)
func (s *CommandService) ExecuteCommand(cmdReq *CommandRequest) (uuid.UUID, error) {
	handler, ok := s.commandHandlers[cmdReq.Type]
	if !ok {
		return uuid.Nil, fmt.Errorf("tipo de comando desconhecido: %s", cmdReq.Type)
	}

	userID := ""
	if initiatorUserID, found := cmdReq.Metadata["initiatorUserID"]; found {
		userID = initiatorUserID
	}

	cmdCtx := &CommandContext{
		CommandRequest: cmdReq,
		UserID:         userID,
	}

	// 1. Validar Comando (Check inicial sem side-effects)
	if err := handler.Validate(cmdCtx); err != nil {
		return uuid.Nil, fmt.Errorf("validação do comando falhou: %w", err)
	}

	var newEventID uuid.UUID

	// NÚCLEO SOBERANO: Transação Atômica
	err := s.db.Transaction(func(tx *gorm.DB) error {
		// 2. Executar Lógica do Comando
		// Nota: Handlers atuais fazem side-effect direto.
		// No motor Prost-QS ideal, eles apenas retornariam o payload do evento.
		// Vamos manter a interface mas garantir que tudo ocorra no mesmo 'tx'.
		eventPayloadRaw, err := handler.Handle(cmdCtx)
		if err != nil {
			return err
		}

		// 3. Criar Objeto de Evento
		newEventID = uuid.New()
		newEvent := &event.Event{
			ID:             newEventID,
			Type:           cmdReq.Type + "Event",
			Timestamp:      time.Now().UnixMilli(),
			Payload:        eventPayloadRaw,
			Metadata:       cmdReq.Metadata,
			Signature:      "sovereign_kernel_v1",
			CausalityChain: "[]",
		}

		// 4. Persistir no Ledger (Historico Imutável)
		if err := tx.Create(newEvent).Error; err != nil {
			return fmt.Errorf("falha ao gravar no ledger de eventos: %w", err)
		}

		// 5. Projetar Estado (Reducer) - Passando a transação atual
		// Isso garante que o estado derivado esteja SEMPRE em sincronia com o ledger.
		if err := s.eventService.ApplyEvent(tx, newEvent); err != nil {
			return fmt.Errorf("falha ao aplicar projeção de estado: %w", err)
		}

		return nil
	})

	if err != nil {
		log.Printf("ERRO KERNEL: Comando %s falhou e foi revertido: %v", cmdReq.Type, err)
		return uuid.Nil, err
	}

	log.Printf("SUCESSO KERNEL: Comando %s processado atomicamente. EventID: %s", cmdReq.Type, newEventID)
	return newEventID, nil
}

// --- Implementações de CommandHandler ---

// CreateUserCommandHandler lida com o comando "CreateUser".
type CreateUserCommandHandler struct {
	identityService *identity.IdentityService
}

// Validate valida um comando CreateUser.
func (h *CreateUserCommandHandler) Validate(cmdCtx *CommandContext) error {
	var payload struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
	}
	if err := json.Unmarshal(cmdCtx.CommandRequest.Payload, &payload); err != nil {
		return fmt.Errorf("payload de CreateUser inválido: %w", err)
	}
	if payload.Username == "" || payload.Password == "" || payload.Email == "" {
		return fmt.Errorf("username, password e email são obrigatórios")
	}
	// Adicionar validação de formato de email, complexidade de senha, etc.
	return nil
}

// Handle executa um comando CreateUser.
func (h *CreateUserCommandHandler) Handle(cmdCtx *CommandContext) (json.RawMessage, error) {
	var payload struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
	}
	if err := json.Unmarshal(cmdCtx.CommandRequest.Payload, &payload); err != nil {
		return nil, fmt.Errorf("payload de CreateUser inválido: %w", err)
	}

	user, err := h.identityService.CreateUser(payload.Username, payload.Password, payload.Email, "[]")
	if err != nil {
		return nil, fmt.Errorf("falha ao criar usuário na projeção de identidade: %w", err)
	}

	eventPayload := map[string]interface{}{
		"userId":       user.ID.String(),
		"username":     user.Username,
		"email":        user.Email,
		"passwordHash": user.PasswordHash,
		"createdAt":    user.CreatedAt,
	}
	rawPayload, _ := json.Marshal(eventPayload)
	return rawPayload, nil
}

// InitiatePaymentCommandHandler lida com o comando "InitiatePayment".
type InitiatePaymentCommandHandler struct {
	paymentService *payment.PaymentService
}

// Validate valida um comando InitiatePayment.
func (h *InitiatePaymentCommandHandler) Validate(cmdCtx *CommandContext) error {
	var payload struct {
		UserID      string  `json:"userId"`
		Amount      float64 `json:"amount"`
		Currency    string  `json:"currency"`
		Description string  `json:"description"`
	}
	if err := json.Unmarshal(cmdCtx.CommandRequest.Payload, &payload); err != nil {
		return fmt.Errorf("payload de InitiatePayment inválido: %w", err)
	}
	if payload.UserID == "" || payload.Amount <= 0 || payload.Currency == "" {
		return fmt.Errorf("userId, amount e currency são obrigatórios e amount deve ser positivo")
	}
	// Validar moeda, existência do usuário, etc.
	return nil
}

// Handle executa um comando InitiatePayment.
func (h *InitiatePaymentCommandHandler) Handle(cmdCtx *CommandContext) (json.RawMessage, error) {
	var payload struct {
		UserID      string  `json:"userId"`
		Amount      float64 `json:"amount"`
		Currency    string  `json:"currency"`
		Description string  `json:"description"`
	}
	if err := json.Unmarshal(cmdCtx.CommandRequest.Payload, &payload); err != nil {
		return nil, fmt.Errorf("payload de InitiatePayment inválido: %w", err)
	}

	paymentEventPayload, err := h.paymentService.InitiatePayment(payload.UserID, payload.Amount, payload.Currency, payload.Description)
	if err != nil {
		return nil, fmt.Errorf("falha ao iniciar pagamento: %w", err)
	}

	rawPayload, _ := json.Marshal(paymentEventPayload)
	return rawPayload, nil
}

// EvolveSchemaAICommandHandler lida com o comando "EvolveSchemaAI".
type EvolveSchemaAICommandHandler struct {
	aiService *ai.AIService
}

// Validate valida um comando EvolveSchemaAI.
func (h *EvolveSchemaAICommandHandler) Validate(cmdCtx *CommandContext) error {
	var payload struct {
		Intention string            `json:"intention"`
		Context   map[string]string `json:"context"`
	}
	if err := json.Unmarshal(cmdCtx.CommandRequest.Payload, &payload); err != nil {
		return fmt.Errorf("payload de EvolveSchemaAI inválido: %w", err)
	}
	if payload.Intention == "" {
		return fmt.Errorf("intenção é obrigatória para evolução de schema por IA")
	}
	return nil
}

// Handle executa um comando EvolveSchemaAI.
func (h *EvolveSchemaAICommandHandler) Handle(cmdCtx *CommandContext) (json.RawMessage, error) {
	var payload struct {
		Intention string            `json:"intention"`
		Context   map[string]string `json:"context"`
	}
	if err := json.Unmarshal(cmdCtx.CommandRequest.Payload, &payload); err != nil {
		return nil, fmt.Errorf("payload de EvolveSchemaAI inválido: %w", err)
	}

	migration, err := h.aiService.EvolveSchema(payload.Intention, payload.Context)
	if err != nil {
		return nil, fmt.Errorf("falha ao acionar IA para evolução de schema: %w", err)
	}

	eventPayload := map[string]interface{}{
		"migrationId": migration.ID.String(),
		"version":     migration.Version,
		"intention":   migration.AIIntention,
		"proposedSQL": migration.MigrationSQL,
		"appliedAt":   migration.AppliedAt,
	}
	rawPayload, _ := json.Marshal(eventPayload)
	return rawPayload, nil
}

// TrackImpressionCommandHandler lida com o comando "TrackImpression".
type TrackImpressionCommandHandler struct {
	adService *ad.AdService
}

func (h *TrackImpressionCommandHandler) Validate(cmdCtx *CommandContext) error {
	var payload struct {
		AdID  string `json:"adId"`
		AppID string `json:"appId"`
	}
	if err := json.Unmarshal(cmdCtx.CommandRequest.Payload, &payload); err != nil {
		return fmt.Errorf("payload de TrackImpression inválido: %w", err)
	}
	if payload.AdID == "" || payload.AppID == "" {
		return fmt.Errorf("adId e appId são obrigatórios")
	}
	return nil
}

func (h *TrackImpressionCommandHandler) Handle(cmdCtx *CommandContext) (json.RawMessage, error) {
	var payload struct {
		AdID  string `json:"adId"`
		AppID string `json:"appId"`
	}
	json.Unmarshal(cmdCtx.CommandRequest.Payload, &payload)

	adEventPayload, err := h.adService.TrackImpression(payload.AdID, payload.AppID)
	if err != nil {
		return nil, fmt.Errorf("falha ao registrar impressão no serviço de ads: %w", err)
	}

	rawPayload, _ := json.Marshal(adEventPayload)
	return rawPayload, nil
}
