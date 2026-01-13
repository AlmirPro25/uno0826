package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/p2p"
)

// MessagingHandler handlers para API de mensagens
type MessagingHandler struct {
	messaging *p2p.MessagingService
}

// NewMessagingHandler cria um novo handler de mensagens
func NewMessagingHandler(messaging *p2p.MessagingService) *MessagingHandler {
	return &MessagingHandler{messaging: messaging}
}

// RegisterMessagingRoutes registra as rotas de mensagens
func (h *MessagingHandler) RegisterMessagingRoutes(r *gin.RouterGroup) {
	msg := r.Group("/messages")
	{
		msg.POST("/send", h.SendMessage)
		msg.GET("/conversation/:peer_id", h.GetConversation)
		msg.POST("/read/:message_id", h.MarkAsRead)
		msg.GET("/unread", h.GetUnreadCount)
	}
}

// SendMessageRequest request para enviar mensagem
type SendMessageRequest struct {
	ToPeerID    string `json:"to_peer_id" binding:"required"`
	Content     string `json:"content" binding:"required"`
	ContentType string `json:"content_type"` // text, image, file
}

// SendMessageResponse resposta do envio
type SendMessageResponse struct {
	MessageID string `json:"message_id"`
	Timestamp int64  `json:"timestamp"`
	Status    string `json:"status"` // sent, pending, failed
}

// SendMessage envia uma mensagem direta
// POST /api/messages/send
func (h *MessagingHandler) SendMessage(c *gin.Context) {
	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if req.ContentType == "" {
		req.ContentType = "text"
	}

	msg, err := h.messaging.SendDirectMessage(
		c.Request.Context(),
		req.ToPeerID,
		[]byte(req.Content),
		req.ContentType,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, SendMessageResponse{
		MessageID: msg.ID,
		Timestamp: msg.Timestamp,
		Status:    "sent",
	})
}

// MessageDTO representa uma mensagem na API
type MessageDTO struct {
	ID          string `json:"id"`
	FromPeerID  string `json:"from_peer_id"`
	ToPeerID    string `json:"to_peer_id"`
	Content     string `json:"content"`
	ContentType string `json:"content_type"`
	Timestamp   int64  `json:"timestamp"`
	IsRead      bool   `json:"is_read"`
	IsMine      bool   `json:"is_mine"`
}

// GetConversation retorna mensagens de uma conversa
// GET /api/messages/conversation/:peer_id
func (h *MessagingHandler) GetConversation(c *gin.Context) {
	peerID := c.Param("peer_id")
	if peerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "peer_id required"})
		return
	}

	// TODO: Implementar busca real no banco
	// Por enquanto, retorna lista vazia
	messages := []MessageDTO{}

	c.JSON(http.StatusOK, gin.H{
		"peer_id":  peerID,
		"messages": messages,
		"count":    len(messages),
	})
}

// MarkAsRead marca mensagem como lida
// POST /api/messages/read/:message_id
func (h *MessagingHandler) MarkAsRead(c *gin.Context) {
	messageID := c.Param("message_id")
	if messageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message_id required"})
		return
	}

	var req struct {
		SenderPeerID string `json:"sender_peer_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sender_peer_id required"})
		return
	}

	if err := h.messaging.MarkAsRead(c.Request.Context(), messageID, req.SenderPeerID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "marked_as_read"})
}

// GetUnreadCount retorna contagem de mensagens não lidas
// GET /api/messages/unread
func (h *MessagingHandler) GetUnreadCount(c *gin.Context) {
	count, err := h.messaging.GetUnreadCount()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}

// WebSocket handler para mensagens em tempo real
type MessageEvent struct {
	Type    string          `json:"type"` // new_message, delivered, read, typing
	Payload json.RawMessage `json:"payload"`
}

// SetupMessageCallbacks configura callbacks para eventos de mensagem
func (h *MessagingHandler) SetupMessageCallbacks(broadcast func(event MessageEvent)) {
	// Callback para novas mensagens
	h.messaging.SetOnMessage(func(msg *p2p.DirectMessage) {
		payload, _ := json.Marshal(MessageDTO{
			ID:          msg.ID,
			FromPeerID:  msg.FromPeerID,
			ToPeerID:    msg.ToPeerID,
			Content:     string(msg.Content),
			ContentType: msg.ContentType,
			Timestamp:   msg.Timestamp,
			IsRead:      false,
			IsMine:      false,
		})
		broadcast(MessageEvent{
			Type:    "new_message",
			Payload: payload,
		})
	})

	// Callback para confirmação de entrega
	h.messaging.SetOnDelivered(func(messageID string) {
		payload, _ := json.Marshal(gin.H{"message_id": messageID})
		broadcast(MessageEvent{
			Type:    "delivered",
			Payload: payload,
		})
	})

	// Callback para confirmação de leitura
	h.messaging.SetOnRead(func(messageID string) {
		payload, _ := json.Marshal(gin.H{"message_id": messageID})
		broadcast(MessageEvent{
			Type:    "read",
			Payload: payload,
		})
	})
}

// TypingIndicator indica que usuário está digitando
type TypingIndicator struct {
	PeerID    string `json:"peer_id"`
	IsTyping  bool   `json:"is_typing"`
	Timestamp int64  `json:"timestamp"`
}

// SendTypingIndicator envia indicador de digitação
func (h *MessagingHandler) SendTypingIndicator(c *gin.Context) {
	var req struct {
		ToPeerID string `json:"to_peer_id" binding:"required"`
		IsTyping bool   `json:"is_typing"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	// TODO: Implementar envio de typing indicator via pubsub
	c.JSON(http.StatusOK, gin.H{
		"status":    "sent",
		"timestamp": time.Now().Unix(),
	})
}
