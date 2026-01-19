package ucp

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *UCPService
}

func NewHandler(service *UCPService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	// UCP specific group
	group := r.Group("/ucp")
	{
		group.POST("/catalog", h.SearchCatalog)
		group.POST("/checkout", h.CreateCheckout)
		group.POST("/negotiate", h.Negotiate)
		// More endpoints for cart, products, etc.
	}
}

// RegisterWellKnown registers the discovery endpoint at root level
func (h *Handler) RegisterWellKnown(r *gin.Engine) {
	r.GET("/.well-known/ucp", h.GetDiscovery)
}

// GetDiscovery handles /.well-known/ucp
func (h *Handler) GetDiscovery(c *gin.Context) {
	manifest := h.service.GetManifest()
	c.JSON(http.StatusOK, manifest)
}

// SearchCatalog handles /api/ucp/catalog
func (h *Handler) SearchCatalog(c *gin.Context) {
	var req SearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.SearchCatalog(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// CreateCheckout handles /api/ucp/checkout
func (h *Handler) CreateCheckout(c *gin.Context) {
	var req CheckoutSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.CreateCheckoutSession(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, result)
}

// Negotiate handles /api/ucp/negotiate
func (h *Handler) Negotiate(c *gin.Context) {
	var req NegotiationProposal
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.Negotiate(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
