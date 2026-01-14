package controllers

import (
	"log"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/services"
	"medisync-platform/backend/pkg/security"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type ChatController struct {
	service *services.ChatService
	hub     *services.ChatHub
}

func NewChatController(hub *services.ChatHub) *ChatController {
	return &ChatController{hub: hub}
}

func NewChatControllerWithService(service *services.ChatService, hub *services.ChatHub) *ChatController {
	return &ChatController{service: service, hub: hub}
}

// SetService sets the chat service (for dependency injection)
func (c *ChatController) SetService(service *services.ChatService) {
	c.service = service
}

// Conversations

// GetConversations returns all conversations for the authenticated user
func (c *ChatController) GetConversations(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	conversations, err := c.service.GetConversations(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, conversations)
}

// GetConversation returns a specific conversation
func (c *ChatController) GetConversation(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	conversationID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	conversation, err := c.service.GetConversation(uint(conversationID), userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, conversation)
}

// CreateConversation creates a new conversation
func (c *ChatController) CreateConversation(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	var req domain.CreateConversationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	conversation, err := c.service.CreateConversation(userID, req.ParticipantID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, conversation)
}

// DeleteConversation deletes a conversation
func (c *ChatController) DeleteConversation(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	conversationID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := c.service.DeleteConversation(uint(conversationID), userID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Conversa excluída"})
}

// MuteConversation mutes/unmutes a conversation
func (c *ChatController) MuteConversation(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	conversationID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Muted bool `json:"muted"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.MuteConversation(uint(conversationID), userID, req.Muted); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Configuração atualizada"})
}

// BlockConversation blocks/unblocks a conversation
func (c *ChatController) BlockConversation(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	conversationID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Blocked bool `json:"blocked"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.BlockConversation(uint(conversationID), userID, req.Blocked); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Configuração atualizada"})
}

// Messages

// GetMessages returns messages for a conversation
func (c *ChatController) GetMessages(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	conversationID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "50"))

	messages, err := c.service.GetMessages(uint(conversationID), userID, page, limit)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, messages)
}

// SendMessage sends a new message
func (c *ChatController) SendMessage(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	conversationID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req domain.SendMessageRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message, err := c.service.SendMessage(uint(conversationID), userID, req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Broadcast via WebSocket
	if c.hub != nil {
		c.hub.BroadcastMessage(message)
	}

	ctx.JSON(http.StatusCreated, message)
}

// MarkAsRead marks all messages in a conversation as read
func (c *ChatController) MarkAsRead(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	conversationID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := c.service.MarkAsRead(uint(conversationID), userID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Mensagens marcadas como lidas"})
}


// StarMessage stars/unstars a message
func (c *ChatController) StarMessage(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	messageID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Starred bool `json:"starred"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.StarMessage(uint(messageID), userID, req.Starred); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Mensagem atualizada"})
}

// DeleteMessage deletes a message
func (c *ChatController) DeleteMessage(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	messageID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := c.service.DeleteMessage(uint(messageID), userID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Mensagem excluída"})
}

// GetUnreadCount returns total unread count
func (c *ChatController) GetUnreadCount(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	count, err := c.service.GetTotalUnreadCount(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"count": count})
}

// Contacts

// GetContacts returns all contacts for the user
func (c *ChatController) GetContacts(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	contacts, err := c.service.GetContacts(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, contacts)
}

// AddContact adds a new contact
func (c *ChatController) AddContact(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	var req domain.AddContactRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	contact, err := c.service.AddContact(userID, req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, contact)
}

// UpdateContact updates a contact
func (c *ChatController) UpdateContact(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	contactID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req domain.UpdateContactRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	contact, err := c.service.UpdateContact(userID, uint(contactID), req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, contact)
}

// RemoveContact removes a contact
func (c *ChatController) RemoveContact(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	contactID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := c.service.RemoveContact(userID, uint(contactID)); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Contato removido"})
}

// Followed Clinics

// GetFollowedClinics returns all followed clinics
func (c *ChatController) GetFollowedClinics(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	clinics, err := c.service.GetFollowedClinics(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, clinics)
}

// FollowClinic follows a clinic
func (c *ChatController) FollowClinic(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	clinicID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	followed, err := c.service.FollowClinic(userID, uint(clinicID))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, followed)
}

// UnfollowClinic unfollows a clinic
func (c *ChatController) UnfollowClinic(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	clinicID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := c.service.UnfollowClinic(userID, uint(clinicID)); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Deixou de seguir a clínica"})
}

// ToggleClinicNotifications toggles clinic notifications
func (c *ChatController) ToggleClinicNotifications(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	clinicID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Enabled bool `json:"enabled"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.ToggleClinicNotifications(userID, uint(clinicID), req.Enabled); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Notificações atualizadas"})
}

// Online Status

// UpdateOnlineStatus updates user online status
func (c *ChatController) UpdateOnlineStatus(ctx *gin.Context) {
	userID := ctx.GetUint("userID")

	var req struct {
		Online bool `json:"online"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdateOnlineStatus(userID, req.Online); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast status change
	if c.hub != nil {
		c.hub.BroadcastOnlineStatus(userID, req.Online)
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Status atualizado"})
}

// GetOnlineUsers returns online status for multiple users (legacy endpoint)
func (c *ChatController) GetOnlineUsers(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, gin.H{"users": []interface{}{}})
}

// CheckUserOnline checks if a specific user is online (legacy endpoint)
func (c *ChatController) CheckUserOnline(ctx *gin.Context) {
	userID, err := strconv.ParseUint(ctx.Param("userId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	online, lastSeen, _ := c.service.GetOnlineStatus(uint(userID))
	ctx.JSON(http.StatusOK, gin.H{
		"user_id":   userID,
		"online":    online,
		"last_seen": lastSeen,
	})
}

// SendNotification sends a notification (legacy endpoint)
func (c *ChatController) SendNotification(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, gin.H{"message": "Notificação enviada"})
}

// Search

// SearchUsers searches for users
func (c *ChatController) SearchUsers(ctx *gin.Context) {
	query := ctx.Query("q")
	role := ctx.Query("role")
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))

	users, err := c.service.SearchUsers(query, role, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, users)
}

// SearchMessages searches for messages
func (c *ChatController) SearchMessages(ctx *gin.Context) {
	userID := ctx.GetUint("userID")
	query := ctx.Query("q")
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "50"))

	var conversationID *uint
	if convIDStr := ctx.Query("conversation_id"); convIDStr != "" {
		if convID, err := strconv.ParseUint(convIDStr, 10, 32); err == nil {
			id := uint(convID)
			conversationID = &id
		}
	}

	messages, err := c.service.SearchMessages(query, conversationID, userID, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, messages)
}

// WebSocket Handler

var chatUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// HandleWebSocket handles WebSocket connections for chat
func (c *ChatController) HandleWebSocket(ctx *gin.Context, jwtSecret string) {
	tokenString := ctx.Query("token")
	if tokenString == "" {
		log.Println("Chat WebSocket rejected: no token")
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Token ausente"})
		return
	}

	claims, err := security.ValidateJWT(tokenString, jwtSecret)
	if err != nil {
		log.Printf("Chat WebSocket rejected: invalid token: %v", err)
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
		return
	}

	conn, err := chatUpgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade chat WebSocket: %v", err)
		return
	}

	client := NewChatClient(conn, c.hub, uint(claims.UserID))
	c.hub.Register <- client

	// Update online status
	if c.service != nil {
		c.service.UpdateOnlineStatus(uint(claims.UserID), true)
		c.hub.BroadcastOnlineStatus(uint(claims.UserID), true)
	}

	go client.ReadPump()
	go client.WritePump()
}

// ChatClient represents a WebSocket client for chat
type ChatClient struct {
	conn   *websocket.Conn
	hub    *services.ChatHub
	userID uint
	send   chan []byte
}

func NewChatClient(conn *websocket.Conn, hub *services.ChatHub, userID uint) *ChatClient {
	return &ChatClient{
		conn:   conn,
		hub:    hub,
		userID: userID,
		send:   make(chan []byte, 256),
	}
}

func (c *ChatClient) GetUserID() uint {
	return c.userID
}

func (c *ChatClient) GetSendChannel() chan []byte {
	return c.send
}

func (c *ChatClient) ReadPump() {
	defer func() {
		c.hub.Unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Chat WebSocket error: %v", err)
			}
			break
		}

		c.hub.Broadcast <- message
	}
}

func (c *ChatClient) WritePump() {
	defer c.conn.Close()

	for message := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
			return
		}
	}
}
