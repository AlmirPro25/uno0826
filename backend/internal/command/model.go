package command

import "encoding/json"

// CommandRequest representa a estrutura de um comando enviado ao kernel.
type CommandRequest struct {
	Type     string            `json:"type" binding:"required"`    // e.g., "CreateUser", "InitiatePayment", "EvolveSchema"
	Payload  json.RawMessage   `json:"payload" binding:"required"` // Dados específicos do comando
	Metadata map[string]string `json:"metadata"`                   // Metadados adicionais, e.g., initiatorUserID
}

// CommandResponse representa a estrutura da resposta a um comando.
type CommandResponse struct {
	EventID string `json:"eventId"`
	Status  string `json:"status"` // e.g., "accepted", "rejected"
	Message string `json:"message"`
}

// CommandContext é o contexto passado para os handlers de comando
type CommandContext struct {
	CommandRequest *CommandRequest
	UserID         string // ID do usuário que iniciou o comando
}

// CommandHandler é uma interface para handlers de comandos específicos.
type CommandHandler interface {
	Handle(cmdCtx *CommandContext) (json.RawMessage, error) // Retorna o payload do evento
	Validate(cmdCtx *CommandContext) error                  // Valida o comando antes da execução
}
