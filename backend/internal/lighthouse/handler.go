package lighthouse

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler HTTP handlers para o Lighthouse
type Handler struct {
	service *LighthouseService
}

// NewHandler cria um novo handler
func NewHandler(service *LighthouseService) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registra as rotas do lighthouse
func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	lighthouse := r.Group("/lighthouse")
	{
		lighthouse.GET("/bootstrap", h.Bootstrap)
		lighthouse.POST("/announce", h.Announce)
		lighthouse.GET("/peers", h.ListPeers)
		lighthouse.GET("/relays", h.GetRelays)
		lighthouse.POST("/heartbeat", h.Heartbeat)
		lighthouse.GET("/status", h.Status)
	}
}

// Bootstrap retorna informações para um novo peer se conectar
// GET /api/v1/lighthouse/bootstrap?region=sa-east
func (h *Handler) Bootstrap(c *gin.Context) {
	region := c.DefaultQuery("region", "global")

	resp, err := h.service.Bootstrap(c.Request.Context(), region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// Announce registra a presença de um peer
// POST /api/v1/lighthouse/announce
func (h *Handler) Announce(c *gin.Context) {
	var req AnnounceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if req.PeerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "peer_id required"})
		return
	}

	if err := h.service.Announce(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":       "announced",
		"lighthouse":   h.service.id,
		"peer_id":      req.PeerID,
	})
}

// ListPeers lista peers conectados
// GET /api/v1/lighthouse/peers?region=sa-east&limit=20
func (h *Handler) ListPeers(c *gin.Context) {
	region := c.DefaultQuery("region", "")
	limit := 20 // Default

	peers, err := h.service.ListPeers(c.Request.Context(), region, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Converter para resposta pública (sem dados sensíveis)
	publicPeers := make([]gin.H, 0, len(peers))
	for _, p := range peers {
		publicPeers = append(publicPeers, gin.H{
			"peer_id":      p.PeerID,
			"reputation":   p.Reputation,
			"relay_capable": p.Capabilities.RelayCapable,
			"last_seen":    p.LastSeen,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"peers": publicPeers,
		"count": len(publicPeers),
	})
}

// GetRelays retorna lista de relays disponíveis
// GET /api/v1/lighthouse/relays
func (h *Handler) GetRelays(c *gin.Context) {
	relays := h.service.GetRelays()
	c.JSON(http.StatusOK, gin.H{"relays": relays})
}

// Heartbeat atualiza o last_seen de um peer
// POST /api/v1/lighthouse/heartbeat
func (h *Handler) Heartbeat(c *gin.Context) {
	var req struct {
		PeerID string `json:"peer_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if req.PeerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "peer_id required"})
		return
	}

	if err := h.service.Heartbeat(c.Request.Context(), req.PeerID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// Status retorna status do farol
// GET /api/v1/lighthouse/status
func (h *Handler) Status(c *gin.Context) {
	status := h.service.Status()
	c.JSON(http.StatusOK, status)
}
