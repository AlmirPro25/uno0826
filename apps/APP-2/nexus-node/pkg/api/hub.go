
package api

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

// Hub maintains the set of active clients and broadcasts messages to them.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	Broadcast chan interface{}

	// Register requests from the clients.
	Register chan *Client

	// Unregister requests from clients.
	Unregister chan *Client
}

// NewHub creates a new Hub instance.
func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan interface{}),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

// Run starts the hub's main loop, handling client registration, unregistration, and message broadcasting.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.clients[client] = true
			log.Printf("[NEXUS_ARCHITECT] WS_HUB: Cliente %s registrado. Total: %d", client.id, len(h.clients))
		case client := <-h.Unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				log.Printf("[NEXUS_ARCHITECT] WS_HUB: Cliente %s desregistrado. Total: %d", client.id, len(h.clients))
			}
		case message := <-h.Broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub *Hub

	// The websocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	send chan interface{}

	// Unique ID for the client (e.g., frontend session ID or local PeerID).
	id string
}

// NewClient creates a new WebSocket client.
func NewClient(hub *Hub, conn *websocket.Conn, peerID string) *Client {
	return &Client{
		hub:  hub,
		conn: conn,
		send: make(chan interface{}, 256), // Buffered channel
		id:   peerID,
	}
}

// ReadPump pumps messages from the websocket connection to the hub.
// The application ensures that there is at most one reader on a connection by invoking
// this goroutine.
func (c *Client) ReadPump() {
	defer func() {
		c.hub.Unregister <- c
		c.conn.Close()
	}()
	// Set read limits, pong handlers, etc. for robustness
	c.conn.SetReadLimit(512) // Max message size
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(60 * time.Second)); return nil })

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[NEXUS_ARCHITECT] ERRO: ReadPump: %v", err)
			}
			break
		}
		// Messages from frontend are currently not processed by the hub directly.
		// If frontend needs to send commands to the backend, they would be handled here.
		log.Printf("[NEXUS_ARCHITECT] WS_CLIENT_MSG: De %s: %s", c.id, string(message))
	}
}

// WritePump pumps messages from the hub to the websocket connection.
// A goroutine running WritePump is started for each connection. The application ensures
// that there is at most one writer to a connection by executing all writes from this
// goroutine.
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
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			jsonMessage, err := json.Marshal(message)
			if err != nil {
				log.Printf("[NEXUS_ARCHITECT] ERRO: Falha ao serializar mensagem para WS: %v", err)
				return
			}
			w.Write(jsonMessage)

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
