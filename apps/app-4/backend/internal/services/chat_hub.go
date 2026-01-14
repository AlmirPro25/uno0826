package services

import (
	"encoding/json"
	"log"
	"medisync-platform/backend/internal/core/domain"
	"sync"
)

// ChatClientInterface defines the interface for chat clients
type ChatClientInterface interface {
	GetUserID() uint
	GetSendChannel() chan []byte
}

// ChatHub manages WebSocket connections for chat
type ChatHub struct {
	// Registered clients by user ID
	clients map[uint][]ChatClientInterface

	// Register requests from clients
	Register chan ChatClientInterface

	// Unregister requests from clients
	Unregister chan ChatClientInterface

	// Broadcast channel for messages
	Broadcast chan []byte

	// Mutex for thread-safe operations
	mu sync.RWMutex
}

// NewChatHub creates a new ChatHub
func NewChatHub() *ChatHub {
	return &ChatHub{
		clients:    make(map[uint][]ChatClientInterface),
		Register:   make(chan ChatClientInterface),
		Unregister: make(chan ChatClientInterface),
		Broadcast:  make(chan []byte),
	}
}

// Run starts the hub's main loop
func (h *ChatHub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.registerClient(client)

		case client := <-h.Unregister:
			h.unregisterClient(client)

		case message := <-h.Broadcast:
			h.broadcastToAll(message)
		}
	}
}

func (h *ChatHub) registerClient(client ChatClientInterface) {
	h.mu.Lock()
	defer h.mu.Unlock()

	userID := client.GetUserID()
	h.clients[userID] = append(h.clients[userID], client)
	log.Printf("Chat client registered: user %d (total connections: %d)", userID, len(h.clients[userID]))
}

func (h *ChatHub) unregisterClient(client ChatClientInterface) {
	h.mu.Lock()
	defer h.mu.Unlock()

	userID := client.GetUserID()
	clients := h.clients[userID]

	for i, c := range clients {
		if c == client {
			// Remove client from slice
			h.clients[userID] = append(clients[:i], clients[i+1:]...)
			close(client.GetSendChannel())
			break
		}
	}

	// Clean up if no more connections for this user
	if len(h.clients[userID]) == 0 {
		delete(h.clients, userID)
	}

	log.Printf("Chat client unregistered: user %d", userID)
}

func (h *ChatHub) broadcastToAll(message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, clients := range h.clients {
		for _, client := range clients {
			select {
			case client.GetSendChannel() <- message:
			default:
				// Client buffer full, skip
			}
		}
	}
}

// SendToUser sends a message to a specific user
func (h *ChatHub) SendToUser(userID uint, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.clients[userID]; ok {
		for _, client := range clients {
			select {
			case client.GetSendChannel() <- message:
			default:
				// Client buffer full, skip
			}
		}
	}
}

// SendToUsers sends a message to multiple users
func (h *ChatHub) SendToUsers(userIDs []uint, message []byte) {
	for _, userID := range userIDs {
		h.SendToUser(userID, message)
	}
}

// BroadcastMessage broadcasts a new message to relevant users
func (h *ChatHub) BroadcastMessage(message *domain.ChatMessage) {
	wsMessage := domain.WSNewMessage{
		Type:    "new_message",
		Message: *message,
	}

	data, err := json.Marshal(wsMessage)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	// Send to both sender and receiver
	h.SendToUsers([]uint{message.SenderID, message.ReceiverID}, data)
}

// BroadcastTyping broadcasts typing indicator
func (h *ChatHub) BroadcastTyping(conversationID, userID uint, typing bool) {
	wsMessage := domain.WSTyping{
		Type:           "typing",
		ConversationID: conversationID,
		UserID:         userID,
		Typing:         typing,
	}

	data, err := json.Marshal(wsMessage)
	if err != nil {
		log.Printf("Error marshaling typing indicator: %v", err)
		return
	}

	// Broadcast to all (will be filtered client-side)
	h.Broadcast <- data
}

// BroadcastOnlineStatus broadcasts online status change
func (h *ChatHub) BroadcastOnlineStatus(userID uint, online bool) {
	wsMessage := domain.WSOnlineStatus{
		Type:   "online_status",
		UserID: userID,
		Online: online,
	}

	data, err := json.Marshal(wsMessage)
	if err != nil {
		log.Printf("Error marshaling online status: %v", err)
		return
	}

	h.Broadcast <- data
}

// BroadcastMessageRead broadcasts message read status
func (h *ChatHub) BroadcastMessageRead(messageID uint) {
	wsMessage := domain.WSMessageRead{
		Type:      "message_read",
		MessageID: messageID,
	}

	data, err := json.Marshal(wsMessage)
	if err != nil {
		log.Printf("Error marshaling message read: %v", err)
		return
	}

	h.Broadcast <- data
}

// IsUserOnline checks if a user has any active connections
func (h *ChatHub) IsUserOnline(userID uint) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()

	clients, ok := h.clients[userID]
	return ok && len(clients) > 0
}

// GetOnlineUsers returns a list of online user IDs
func (h *ChatHub) GetOnlineUsers() []uint {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]uint, 0, len(h.clients))
	for userID := range h.clients {
		users = append(users, userID)
	}
	return users
}

// GetConnectionCount returns the total number of connections
func (h *ChatHub) GetConnectionCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	count := 0
	for _, clients := range h.clients {
		count += len(clients)
	}
	return count
}
