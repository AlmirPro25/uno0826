
package beta

import (
	"encoding/json"
	"net/http"

	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/internal/validator"
	"ai-web-weaver/backend/pkg/errors"
	"ai-web-weaver/backend/pkg/logger"

	"go.uber.org/zap"
)

// BetaHandler handles HTTP requests for beta subscriptions.
type BetaHandler struct {
	service   BetaService
	validator *validator.Validator
	log       *logger.Logger
}

// NewBetaHandler creates a new BetaHandler.
func NewBetaHandler(s BetaService, v *validator.Validator, log *logger.Logger) *BetaHandler {
	return &BetaHandler{
		service:   s,
		validator: v,
		log:       log,
	}
}

// Subscribe handles a new beta subscription request.
func (h *BetaHandler) Subscribe(w http.ResponseWriter, r *http.Request) {
	var req model.BetaSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, "invalid request body", err).Error(), http.StatusBadRequest)
		return
	}

	if err := h.validator.Validate(req); err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, err.Error(), err).Error(), http.StatusBadRequest)
		return
	}

	resp, err := h.service.Subscribe(r.Context(), &req)
	if err != nil {
		apiErr := errors.FromError(err)
		h.log.Error("Failed to subscribe to beta", zap.Error(apiErr.Err), zap.String("email", req.Email))
		http.Error(w, apiErr.Error(), apiErr.StatusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		h.log.Error("Failed to write beta subscription response", zap.Error(err))
	}
}
