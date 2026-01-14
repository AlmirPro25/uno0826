package services

import (
	"log"
	"medisync-platform/backend/internal/core/ports"
	"strconv"
	"time"

	"github.com/gorilla/websocket"
)

// Hub maintains the set of active clients and broadcasts messages to them.
type Hub struct {
	clients map[*Client]bool

	// userClients maps UserID to a set of Clients (allowing multiple connections per user)
	userClients map[int]map[*Client]bool

	// Register requests from clients.
	Register chan *Client

	// Unregister requests from clients.
	Unregister chan *Client

	// Broadcast messages to clients.
	Broadcast chan []byte

	// Waiting list service for business logic
	WaitingListService ports.WaitingListService
}

// NewWaitingRoomHub initializes and returns a new Hub instance.
func NewWaitingRoomHub(waitingListService ports.WaitingListService) *Hub {
	return &Hub{
		Broadcast:          make(chan []byte),
		Register:           make(chan *Client),
		Unregister:         make(chan *Client),
		clients:            make(map[*Client]bool),
		userClients:        make(map[int]map[*Client]bool),
		WaitingListService: waitingListService,
	}
}

// Run starts the WebSocket hub, processing client connections and messages.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.clients[client] = true
			if h.userClients[client.UserID] == nil {
				h.userClients[client.UserID] = make(map[*Client]bool)
			}
			h.userClients[client.UserID][client] = true
			log.Printf("Client registered: %v (User %d)", client.conn.RemoteAddr(), client.UserID)

		case client := <-h.Unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				if userSet, ok := h.userClients[client.UserID]; ok {
					delete(userSet, client)
					if len(userSet) == 0 {
						delete(h.userClients, client.UserID)
					}
				}
				close(client.send)
				log.Printf("Client unregistered: %v (User %d)", client.conn.RemoteAddr(), client.UserID)
			}

		case message := <-h.Broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
					if userSet, ok := h.userClients[client.UserID]; ok {
						delete(userSet, client)
						if len(userSet) == 0 {
							delete(h.userClients, client.UserID)
						}
					}
				}
			}
		}
	}
}

// Client represents a single client connection in the waiting room hub.
type Client struct {
	Hub *Hub

	// The WebSocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	send chan []byte

	// UserID associated with this client
	UserID int
}

// NewClient creates a new client instance for a WebSocket connection.
func NewClient(conn *websocket.Conn, hub *Hub, userID int) *Client {
	return &Client{
		Hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		UserID: userID,
	}
}

// ReadPump handles incoming messages from the WebSocket connection.
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(60 * time.Second)); return nil })

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Error reading message: %v", err)
			}
			break
		}

		// Process incoming message (e.g., patient enters waiting room)
		// Example: message content could be {"type": "enter_waiting_room", "patientId": 123}
		log.Printf("Received message: %s", message)

		// A real implementation would parse the message and call `c.Hub.WaitingListService.JoinWaitingRoom(patientId)`.
		// Then, broadcast an update to all doctors.
	}
}

// WritePump handles outgoing messages to the WebSocket connection.
func (c *Client) WritePump() {
	ticker := time.NewTicker(50 * time.Second) // Ping interval
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current WebSocket message.
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h *Hub) NotifyWaitingRoom(patientID int) {
	// Example broadcast message
	message := []byte(`{"type": "patient_joined", "patient_id": ` + strconv.Itoa(patientID) + `}`)
	h.Broadcast <- message
}

// NotifyUser sends a message to a specific user.
func (h *Hub) NotifyUser(userID int, message []byte) {
	if clients, ok := h.userClients[userID]; ok {
		for client := range clients {
			select {
			case client.send <- message:
			default:
				close(client.send)
				delete(h.clients, client)
				if userSet, ok := h.userClients[client.UserID]; ok {
					delete(userSet, client)
					if len(userSet) == 0 {
						delete(h.userClients, client.UserID)
					}
				}
			}
		}
	}
}
