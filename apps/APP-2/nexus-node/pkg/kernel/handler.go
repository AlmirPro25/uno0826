package kernel

import (
	"encoding/json"
	"net/http"

	"github.com/libp2p/go-libp2p/core/crypto"
)

// Handler provides HTTP handlers for kernel bridge API
type Handler struct {
	bridge  *Bridge
	privKey crypto.PrivKey
}

// NewHandler creates a new kernel handler
func NewHandler(bridge *Bridge, privKey crypto.PrivKey) *Handler {
	return &Handler{
		bridge:  bridge,
		privKey: privKey,
	}
}

// RegisterRoutes registers kernel API routes
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/kernel/status", h.handleStatus)
	mux.HandleFunc("/api/v1/kernel/enable", h.handleEnable)
	mux.HandleFunc("/api/v1/kernel/disable", h.handleDisable)
	mux.HandleFunc("/api/v1/kernel/login", h.handleLogin)
	mux.HandleFunc("/api/v1/kernel/logout", h.handleLogout)
	mux.HandleFunc("/api/v1/kernel/link", h.handleLink)
	mux.HandleFunc("/api/v1/kernel/profile", h.handleProfile)
	mux.HandleFunc("/api/v1/kernel/limits", h.handleLimits)
	mux.HandleFunc("/api/v1/kernel/capability", h.handleCapability)
	mux.HandleFunc("/api/v1/kernel/checkout", h.handleCheckout)
}

// handleStatus returns the current kernel bridge status
func (h *Handler) handleStatus(w http.ResponseWriter, r *http.Request) {
	status := h.bridge.GetStatus()
	respondJSON(w, http.StatusOK, status)
}

// handleEnable enables the kernel bridge
func (h *Handler) handleEnable(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	var req struct {
		KernelURL string `json:"kernel_url"`
		AppKey    string `json:"app_key"`
		AppSecret string `json:"app_secret"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.KernelURL == "" {
		respondError(w, http.StatusBadRequest, "kernel_url é obrigatório")
		return
	}

	h.bridge.Enable(req.KernelURL, req.AppKey, req.AppSecret)
	respondJSON(w, http.StatusOK, map[string]string{"status": "enabled"})
}

// handleDisable disables the kernel bridge
func (h *Handler) handleDisable(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	h.bridge.Disable()
	respondJSON(w, http.StatusOK, map[string]string{"status": "disabled"})
}

// handleLogin authenticates with the kernel
func (h *Handler) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "email e password são obrigatórios")
		return
	}

	authResp, err := h.bridge.LoginWithEmail(req.Email, req.Password)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status": "authenticated",
		"user": map[string]string{
			"id":    authResp.User.ID,
			"email": authResp.User.Email,
			"name":  authResp.User.Name,
		},
	})
}

// handleLogout logs out from the kernel
func (h *Handler) handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	h.bridge.Logout()
	respondJSON(w, http.StatusOK, map[string]string{"status": "logged_out"})
}

// handleLink links the P2P identity to the kernel user
func (h *Handler) handleLink(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	if err := h.bridge.LinkIdentity(h.privKey); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":      "linked",
		"linked_user": h.bridge.GetLinkedUser(),
	})
}

// handleProfile returns the kernel user profile
func (h *Handler) handleProfile(w http.ResponseWriter, r *http.Request) {
	profile, err := h.bridge.GetProfile()
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, profile)
}

// handleLimits returns the current plan limits
func (h *Handler) handleLimits(w http.ResponseWriter, r *http.Request) {
	limits := h.bridge.GetLimits()
	respondJSON(w, http.StatusOK, limits)
}

// handleCapability checks a specific capability
func (h *Handler) handleCapability(w http.ResponseWriter, r *http.Request) {
	capability := r.URL.Query().Get("name")
	if capability == "" {
		respondError(w, http.StatusBadRequest, "name é obrigatório")
		return
	}

	allowed := h.bridge.CheckCapability(capability)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"capability": capability,
		"allowed":    allowed,
	})
}

// handleCheckout creates a Stripe checkout session
func (h *Handler) handleCheckout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	var req struct {
		PlanID     string `json:"plan_id"`
		SuccessURL string `json:"success_url"`
		CancelURL  string `json:"cancel_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.PlanID == "" {
		req.PlanID = "pro"
	}
	if req.SuccessURL == "" {
		req.SuccessURL = "http://localhost:3000/settings?success=true"
	}
	if req.CancelURL == "" {
		req.CancelURL = "http://localhost:3000/settings?canceled=true"
	}

	checkoutURL, err := h.bridge.GetCheckoutURL(req.PlanID, req.SuccessURL, req.CancelURL)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"checkout_url": checkoutURL,
	})
}

// Helper functions
func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Erro ao serializar JSON")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(response)
}

func respondError(w http.ResponseWriter, code int, message string) {
	respondJSON(w, code, map[string]string{"error": message})
}
