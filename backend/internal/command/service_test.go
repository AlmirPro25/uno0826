package command

import (
	"encoding/json"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ========================================
// COMMAND REQUEST TESTS
// ========================================

func TestCommandRequest_Struct(t *testing.T) {
	payload := json.RawMessage(`{"username": "test", "email": "test@example.com"}`)
	
	req := CommandRequest{
		Type:    "CreateUser",
		Payload: payload,
		Metadata: map[string]string{
			"initiatorUserID": uuid.New().String(),
			"source":          "api",
		},
	}

	assert.Equal(t, "CreateUser", req.Type)
	assert.NotEmpty(t, req.Payload)
	assert.NotEmpty(t, req.Metadata["initiatorUserID"])
}

func TestCommandRequest_JSONMarshal(t *testing.T) {
	req := CommandRequest{
		Type:    "InitiatePayment",
		Payload: json.RawMessage(`{"amount": 100.00, "currency": "BRL"}`),
		Metadata: map[string]string{
			"source": "mobile",
		},
	}

	data, err := json.Marshal(req)
	assert.NoError(t, err)
	assert.Contains(t, string(data), "InitiatePayment")
	assert.Contains(t, string(data), "100")
}

func TestCommandRequest_JSONUnmarshal(t *testing.T) {
	jsonData := `{
		"type": "CreateUser",
		"payload": {"username": "john", "email": "john@example.com"},
		"metadata": {"source": "web"}
	}`

	var req CommandRequest
	err := json.Unmarshal([]byte(jsonData), &req)
	assert.NoError(t, err)
	assert.Equal(t, "CreateUser", req.Type)
	assert.Equal(t, "web", req.Metadata["source"])
}

// ========================================
// COMMAND RESPONSE TESTS
// ========================================

func TestCommandResponse_Struct(t *testing.T) {
	resp := CommandResponse{
		EventID: uuid.New().String(),
		Status:  "accepted",
		Message: "Comando processado com sucesso",
	}

	assert.Equal(t, "accepted", resp.Status)
	assert.NotEmpty(t, resp.EventID)
}

func TestCommandResponse_StatusValues(t *testing.T) {
	statuses := []string{"accepted", "rejected", "pending", "failed"}

	for _, status := range statuses {
		resp := CommandResponse{Status: status}
		assert.NotEmpty(t, resp.Status)
	}
}

func TestCommandResponse_JSONMarshal(t *testing.T) {
	resp := CommandResponse{
		EventID: "550e8400-e29b-41d4-a716-446655440000",
		Status:  "accepted",
		Message: "OK",
	}

	data, err := json.Marshal(resp)
	assert.NoError(t, err)
	assert.Contains(t, string(data), "accepted")
	assert.Contains(t, string(data), "550e8400")
}

// ========================================
// COMMAND CONTEXT TESTS
// ========================================

func TestCommandContext_Struct(t *testing.T) {
	req := &CommandRequest{
		Type:    "TestCommand",
		Payload: json.RawMessage(`{}`),
	}

	ctx := CommandContext{
		CommandRequest: req,
		UserID:         uuid.New().String(),
	}

	assert.NotNil(t, ctx.CommandRequest)
	assert.NotEmpty(t, ctx.UserID)
	assert.Equal(t, "TestCommand", ctx.CommandRequest.Type)
}

func TestCommandContext_WithMetadata(t *testing.T) {
	req := &CommandRequest{
		Type:    "CreateUser",
		Payload: json.RawMessage(`{"username": "test"}`),
		Metadata: map[string]string{
			"initiatorUserID": "user-123",
			"correlationId":   "corr-456",
		},
	}

	ctx := CommandContext{
		CommandRequest: req,
		UserID:         "user-123",
	}

	assert.Equal(t, "user-123", ctx.CommandRequest.Metadata["initiatorUserID"])
	assert.Equal(t, "corr-456", ctx.CommandRequest.Metadata["correlationId"])
}

// ========================================
// COMMAND TYPES TESTS
// ========================================

func TestCommandTypes(t *testing.T) {
	commandTypes := []string{
		"CreateUser",
		"InitiatePayment",
		"EvolveSchemaAI",
		"TrackImpression",
	}

	for _, cmdType := range commandTypes {
		req := CommandRequest{Type: cmdType}
		assert.NotEmpty(t, req.Type)
	}
}

// ========================================
// PAYLOAD VARIATIONS TESTS
// ========================================

func TestCommandRequest_CreateUserPayload(t *testing.T) {
	payload := map[string]interface{}{
		"username": "testuser",
		"password": "securepass123",
		"email":    "test@example.com",
	}
	payloadJSON, _ := json.Marshal(payload)

	req := CommandRequest{
		Type:    "CreateUser",
		Payload: payloadJSON,
	}

	var parsed map[string]interface{}
	err := json.Unmarshal(req.Payload, &parsed)
	assert.NoError(t, err)
	assert.Equal(t, "testuser", parsed["username"])
}

func TestCommandRequest_InitiatePaymentPayload(t *testing.T) {
	payload := map[string]interface{}{
		"userId":      uuid.New().String(),
		"amount":      150.00,
		"currency":    "BRL",
		"description": "Compra de produto",
	}
	payloadJSON, _ := json.Marshal(payload)

	req := CommandRequest{
		Type:    "InitiatePayment",
		Payload: payloadJSON,
	}

	var parsed map[string]interface{}
	err := json.Unmarshal(req.Payload, &parsed)
	assert.NoError(t, err)
	assert.Equal(t, 150.00, parsed["amount"])
	assert.Equal(t, "BRL", parsed["currency"])
}

func TestCommandRequest_EvolveSchemaAIPayload(t *testing.T) {
	payload := map[string]interface{}{
		"intention": "Adicionar campo de telefone ao usuário",
		"context": map[string]string{
			"table":  "users",
			"reason": "Requisito de negócio",
		},
	}
	payloadJSON, _ := json.Marshal(payload)

	req := CommandRequest{
		Type:    "EvolveSchemaAI",
		Payload: payloadJSON,
	}

	var parsed map[string]interface{}
	err := json.Unmarshal(req.Payload, &parsed)
	assert.NoError(t, err)
	assert.Contains(t, parsed["intention"], "telefone")
}

func TestCommandRequest_TrackImpressionPayload(t *testing.T) {
	payload := map[string]interface{}{
		"adId":  uuid.New().String(),
		"appId": uuid.New().String(),
	}
	payloadJSON, _ := json.Marshal(payload)

	req := CommandRequest{
		Type:    "TrackImpression",
		Payload: payloadJSON,
	}

	var parsed map[string]interface{}
	err := json.Unmarshal(req.Payload, &parsed)
	assert.NoError(t, err)
	assert.NotEmpty(t, parsed["adId"])
	assert.NotEmpty(t, parsed["appId"])
}

// ========================================
// EMPTY/NIL TESTS
// ========================================

func TestCommandRequest_EmptyPayload(t *testing.T) {
	req := CommandRequest{
		Type:    "TestCommand",
		Payload: json.RawMessage(`{}`),
	}

	assert.Equal(t, "{}", string(req.Payload))
}

func TestCommandRequest_NilMetadata(t *testing.T) {
	req := CommandRequest{
		Type:     "TestCommand",
		Payload:  json.RawMessage(`{}`),
		Metadata: nil,
	}

	assert.Nil(t, req.Metadata)
}

func TestCommandContext_EmptyUserID(t *testing.T) {
	ctx := CommandContext{
		CommandRequest: &CommandRequest{Type: "Test"},
		UserID:         "",
	}

	assert.Empty(t, ctx.UserID)
}

// ========================================
// VALIDATION SCENARIOS TESTS
// ========================================

func TestCommandRequest_ValidCreateUser(t *testing.T) {
	payload := json.RawMessage(`{
		"username": "validuser",
		"password": "ValidPass123!",
		"email": "valid@example.com"
	}`)

	req := CommandRequest{
		Type:    "CreateUser",
		Payload: payload,
	}

	var parsed struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
	}
	err := json.Unmarshal(req.Payload, &parsed)
	assert.NoError(t, err)
	assert.NotEmpty(t, parsed.Username)
	assert.NotEmpty(t, parsed.Password)
	assert.NotEmpty(t, parsed.Email)
}

func TestCommandRequest_InvalidPayload(t *testing.T) {
	req := CommandRequest{
		Type:    "CreateUser",
		Payload: json.RawMessage(`invalid json`),
	}

	var parsed map[string]interface{}
	err := json.Unmarshal(req.Payload, &parsed)
	assert.Error(t, err)
}

// ========================================
// METADATA TESTS
// ========================================

func TestCommandRequest_MetadataVariations(t *testing.T) {
	testCases := []struct {
		name     string
		metadata map[string]string
	}{
		{
			name:     "empty metadata",
			metadata: map[string]string{},
		},
		{
			name: "with initiator",
			metadata: map[string]string{
				"initiatorUserID": uuid.New().String(),
			},
		},
		{
			name: "full metadata",
			metadata: map[string]string{
				"initiatorUserID": uuid.New().String(),
				"source":          "api",
				"correlationId":   "corr-123",
				"traceId":         "trace-456",
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := CommandRequest{
				Type:     "TestCommand",
				Payload:  json.RawMessage(`{}`),
				Metadata: tc.metadata,
			}
			assert.NotNil(t, req.Metadata)
		})
	}
}


// ========================================
// COMMAND HANDLER VALIDATION TESTS
// ========================================

func TestCreateUserCommandHandler_Validate_Success(t *testing.T) {
	handler := &CreateUserCommandHandler{}
	
	payload := json.RawMessage(`{
		"username": "testuser",
		"password": "securepass123",
		"email": "test@example.com"
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "CreateUser",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.NoError(t, err)
}

func TestCreateUserCommandHandler_Validate_MissingUsername(t *testing.T) {
	handler := &CreateUserCommandHandler{}
	
	payload := json.RawMessage(`{
		"password": "securepass123",
		"email": "test@example.com"
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "CreateUser",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "obrigatórios")
}

func TestCreateUserCommandHandler_Validate_MissingPassword(t *testing.T) {
	handler := &CreateUserCommandHandler{}
	
	payload := json.RawMessage(`{
		"username": "testuser",
		"email": "test@example.com"
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "CreateUser",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.Error(t, err)
}

func TestCreateUserCommandHandler_Validate_MissingEmail(t *testing.T) {
	handler := &CreateUserCommandHandler{}
	
	payload := json.RawMessage(`{
		"username": "testuser",
		"password": "securepass123"
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "CreateUser",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.Error(t, err)
}

func TestCreateUserCommandHandler_Validate_InvalidJSON(t *testing.T) {
	handler := &CreateUserCommandHandler{}
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "CreateUser",
			Payload: json.RawMessage(`invalid json`),
		},
	}
	
	err := handler.Validate(ctx)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "inválido")
}

func TestInitiatePaymentCommandHandler_Validate_Success(t *testing.T) {
	handler := &InitiatePaymentCommandHandler{}
	
	payload := json.RawMessage(`{
		"userId": "user-123",
		"amount": 100.50,
		"currency": "BRL",
		"description": "Test payment"
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "InitiatePayment",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.NoError(t, err)
}

func TestInitiatePaymentCommandHandler_Validate_MissingUserID(t *testing.T) {
	handler := &InitiatePaymentCommandHandler{}
	
	payload := json.RawMessage(`{
		"amount": 100.50,
		"currency": "BRL"
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "InitiatePayment",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.Error(t, err)
}

func TestInitiatePaymentCommandHandler_Validate_ZeroAmount(t *testing.T) {
	handler := &InitiatePaymentCommandHandler{}
	
	payload := json.RawMessage(`{
		"userId": "user-123",
		"amount": 0,
		"currency": "BRL"
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "InitiatePayment",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "positivo")
}

func TestInitiatePaymentCommandHandler_Validate_NegativeAmount(t *testing.T) {
	handler := &InitiatePaymentCommandHandler{}
	
	payload := json.RawMessage(`{
		"userId": "user-123",
		"amount": -50.00,
		"currency": "BRL"
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "InitiatePayment",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.Error(t, err)
}

func TestInitiatePaymentCommandHandler_Validate_MissingCurrency(t *testing.T) {
	handler := &InitiatePaymentCommandHandler{}
	
	payload := json.RawMessage(`{
		"userId": "user-123",
		"amount": 100.50
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "InitiatePayment",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.Error(t, err)
}

func TestEvolveSchemaAICommandHandler_Validate_Success(t *testing.T) {
	handler := &EvolveSchemaAICommandHandler{}
	
	payload := json.RawMessage(`{
		"intention": "Add phone field to users table",
		"context": {"table": "users"}
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "EvolveSchemaAI",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.NoError(t, err)
}

func TestEvolveSchemaAICommandHandler_Validate_MissingIntention(t *testing.T) {
	handler := &EvolveSchemaAICommandHandler{}
	
	payload := json.RawMessage(`{
		"context": {"table": "users"}
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "EvolveSchemaAI",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "intenção")
}

func TestEvolveSchemaAICommandHandler_Validate_EmptyIntention(t *testing.T) {
	handler := &EvolveSchemaAICommandHandler{}
	
	payload := json.RawMessage(`{
		"intention": "",
		"context": {}
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "EvolveSchemaAI",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.Error(t, err)
}

func TestTrackImpressionCommandHandler_Validate_Success(t *testing.T) {
	handler := &TrackImpressionCommandHandler{}
	
	payload := json.RawMessage(`{
		"adId": "ad-123",
		"appId": "app-456"
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "TrackImpression",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.NoError(t, err)
}

func TestTrackImpressionCommandHandler_Validate_MissingAdID(t *testing.T) {
	handler := &TrackImpressionCommandHandler{}
	
	payload := json.RawMessage(`{
		"appId": "app-456"
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "TrackImpression",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "obrigatórios")
}

func TestTrackImpressionCommandHandler_Validate_MissingAppID(t *testing.T) {
	handler := &TrackImpressionCommandHandler{}
	
	payload := json.RawMessage(`{
		"adId": "ad-123"
	}`)
	
	ctx := &CommandContext{
		CommandRequest: &CommandRequest{
			Type:    "TrackImpression",
			Payload: payload,
		},
	}
	
	err := handler.Validate(ctx)
	assert.Error(t, err)
}

// ========================================
// COMMAND SERVICE TESTS
// ========================================

func TestNewCommandService(t *testing.T) {
	service := NewCommandService(nil, nil, nil, nil, nil, nil)
	assert.NotNil(t, service)
	assert.NotNil(t, service.commandHandlers)
}

func TestCommandService_RegisterHandler(t *testing.T) {
	service := NewCommandService(nil, nil, nil, nil, nil, nil)
	
	// Verificar que handlers padrão foram registrados
	assert.NotNil(t, service.commandHandlers["CreateUser"])
	assert.NotNil(t, service.commandHandlers["InitiatePayment"])
	assert.NotNil(t, service.commandHandlers["EvolveSchemaAI"])
	assert.NotNil(t, service.commandHandlers["TrackImpression"])
}

func TestCommandService_ExecuteCommand_UnknownType(t *testing.T) {
	service := NewCommandService(nil, nil, nil, nil, nil, nil)
	
	req := &CommandRequest{
		Type:    "UnknownCommand",
		Payload: json.RawMessage(`{}`),
	}
	
	eventID, err := service.ExecuteCommand(req)
	assert.Error(t, err)
	assert.Equal(t, uuid.Nil, eventID)
	assert.Contains(t, err.Error(), "desconhecido")
}

func TestCommandService_ExecuteCommand_ValidationFails(t *testing.T) {
	service := NewCommandService(nil, nil, nil, nil, nil, nil)
	
	// CreateUser sem campos obrigatórios
	req := &CommandRequest{
		Type:    "CreateUser",
		Payload: json.RawMessage(`{}`),
	}
	
	eventID, err := service.ExecuteCommand(req)
	assert.Error(t, err)
	assert.Equal(t, uuid.Nil, eventID)
	assert.Contains(t, err.Error(), "validação")
}
