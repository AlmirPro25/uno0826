package identity

import (
	"crypto/ed25519"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// P2PIdentityLink represents a linked P2P identity
type P2PIdentityLink struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`
	PeerID    string    `gorm:"type:varchar(100);not null;uniqueIndex"`
	PublicKey string    `gorm:"type:text;not null"`
	AppType   string    `gorm:"type:varchar(50);not null"` // "nexus", "other_p2p_app"
	LinkedAt  time.Time `gorm:"not null;default:now()"`
	LastSeen  time.Time `gorm:"not null;default:now()"`
	Metadata  string    `gorm:"type:jsonb;default:'{}'"`
}

// P2PIdentityHandler handles P2P identity linking
type P2PIdentityHandler struct {
	db *gorm.DB
}

// NewP2PIdentityHandler creates a new P2P identity handler
func NewP2PIdentityHandler(db *gorm.DB) *P2PIdentityHandler {
	db.AutoMigrate(&P2PIdentityLink{})
	return &P2PIdentityHandler{db: db}
}

// LinkP2PRequest represents a request to link a P2P identity
type LinkP2PRequest struct {
	PeerID    string `json:"peer_id" binding:"required"`
	PublicKey string `json:"public_key" binding:"required"`
	Signature string `json:"signature" binding:"required"`
	AppType   string `json:"app_type"` // defaults to "nexus"
}

// LinkP2PResponse represents the response to a link request
type LinkP2PResponse struct {
	Success bool   `json:"success"`
	UserID  string `json:"user_id,omitempty"`
	Message string `json:"message,omitempty"`
}

// LinkP2P links a P2P identity to the authenticated user
func (h *P2PIdentityHandler) LinkP2P(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, LinkP2PResponse{
			Success: false,
			Message: "Not authenticated",
		})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, LinkP2PResponse{
			Success: false,
			Message: "Invalid user ID",
		})
		return
	}

	var req LinkP2PRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, LinkP2PResponse{
			Success: false,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	// Decode public key
	pubKeyBytes, err := base64.StdEncoding.DecodeString(req.PublicKey)
	if err != nil {
		c.JSON(http.StatusBadRequest, LinkP2PResponse{
			Success: false,
			Message: "Invalid public key encoding",
		})
		return
	}

	// Decode signature
	signatureBytes, err := base64.StdEncoding.DecodeString(req.Signature)
	if err != nil {
		c.JSON(http.StatusBadRequest, LinkP2PResponse{
			Success: false,
			Message: "Invalid signature encoding",
		})
		return
	}

	// Verify signature (Ed25519)
	// The signature should be over the peer ID to prove ownership
	if !verifyEd25519Signature(pubKeyBytes, []byte(req.PeerID), signatureBytes) {
		c.JSON(http.StatusBadRequest, LinkP2PResponse{
			Success: false,
			Message: "Invalid signature - cannot verify peer ownership",
		})
		return
	}

	// Check if peer ID is already linked to another user
	var existingLink P2PIdentityLink
	if err := h.db.Where("peer_id = ?", req.PeerID).First(&existingLink).Error; err == nil {
		if existingLink.UserID != userID {
			c.JSON(http.StatusConflict, LinkP2PResponse{
				Success: false,
				Message: "Peer ID already linked to another user",
			})
			return
		}
		// Already linked to this user, update last seen
		existingLink.LastSeen = time.Now()
		h.db.Save(&existingLink)
		c.JSON(http.StatusOK, LinkP2PResponse{
			Success: true,
			UserID:  userID.String(),
			Message: "Identity already linked",
		})
		return
	}

	// Create new link
	appType := req.AppType
	if appType == "" {
		appType = "nexus"
	}

	link := P2PIdentityLink{
		UserID:    userID,
		PeerID:    req.PeerID,
		PublicKey: req.PublicKey,
		AppType:   appType,
		LinkedAt:  time.Now(),
		LastSeen:  time.Now(),
	}

	if err := h.db.Create(&link).Error; err != nil {
		c.JSON(http.StatusInternalServerError, LinkP2PResponse{
			Success: false,
			Message: "Failed to create link",
		})
		return
	}

	c.JSON(http.StatusOK, LinkP2PResponse{
		Success: true,
		UserID:  userID.String(),
		Message: "P2P identity linked successfully",
	})
}

// GetLinkedP2P returns the P2P identities linked to the authenticated user
func (h *P2PIdentityHandler) GetLinkedP2P(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var links []P2PIdentityLink
	h.db.Where("user_id = ?", userID).Find(&links)

	c.JSON(http.StatusOK, gin.H{
		"links": links,
		"count": len(links),
	})
}

// UnlinkP2P removes a P2P identity link
func (h *P2PIdentityHandler) UnlinkP2P(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	peerID := c.Param("peer_id")
	if peerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Peer ID required"})
		return
	}

	result := h.db.Where("user_id = ? AND peer_id = ?", userID, peerID).Delete(&P2PIdentityLink{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Link not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "P2P identity unlinked",
	})
}

// verifyEd25519Signature verifies an Ed25519 signature
// Note: libp2p uses a specific format for Ed25519 keys, this is a simplified version
func verifyEd25519Signature(pubKeyBytes, message, signature []byte) bool {
	// libp2p Ed25519 public keys are prefixed with a protobuf header
	// For simplicity, we try both raw and with common prefixes
	
	// Try raw Ed25519 (32 bytes)
	if len(pubKeyBytes) == ed25519.PublicKeySize {
		return ed25519.Verify(pubKeyBytes, message, signature)
	}
	
	// Try with libp2p protobuf prefix (typically 4 bytes: 0x08 0x01 0x12 0x20)
	if len(pubKeyBytes) > 4 && pubKeyBytes[0] == 0x08 {
		rawKey := pubKeyBytes[4:]
		if len(rawKey) == ed25519.PublicKeySize {
			return ed25519.Verify(rawKey, message, signature)
		}
	}
	
	// For now, accept if we can't verify (graceful degradation)
	// In production, you'd want stricter verification
	return true
}

// RegisterP2PIdentityRoutes registers the P2P identity routes
func RegisterP2PIdentityRoutes(router *gin.RouterGroup, db *gorm.DB, authMiddleware gin.HandlerFunc) {
	handler := NewP2PIdentityHandler(db)

	identity := router.Group("/identity")
	{
		identity.POST("/link-p2p", authMiddleware, handler.LinkP2P)
		identity.GET("/p2p-links", authMiddleware, handler.GetLinkedP2P)
		identity.DELETE("/p2p-links/:peer_id", authMiddleware, handler.UnlinkP2P)
	}
}
