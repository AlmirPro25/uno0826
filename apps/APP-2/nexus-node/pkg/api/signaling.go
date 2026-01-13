package api

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// ============================================================================
// WebRTC Signaling Server - P2P Connection Broker
// ============================================================================

// SignalingMessage represents a WebRTC signaling message
type SignalingMessage struct {
	Type    string          `json:"type"`    // offer, answer, ice, join, leave, peer_joined, peer_left
	From    string          `json:"from"`    // sender peer ID
	To      string          `json:"to,omitempty"` // target peer ID (optional for broadcast)
	Room    string          `json:"room,omitempty"` // room ID for group calls
	Payload json.RawMessage `json:"payload,omitempty"`
}

// SignalingRoom represents a signaling room for group calls
type SignalingRoom struct {
	ID      string
	Peers   map[string]*SignalingClient
	Created time.Time
	mu      sync.RWMutex
}

// SignalingClient represents a connected signaling client
type SignalingClient struct {
	PeerID   string
	Conn     *websocket.Conn
	Room     string
	Send     chan []byte
	hub      *SignalingHub
	mu       sync.Mutex
}

// SignalingHub manages all signaling connections
type SignalingHub struct {
	clients    map[string]*SignalingClient // peerID -> client
	rooms      map[string]*SignalingRoom   // roomID -> room
	register   chan *SignalingClient
	unregister chan *SignalingClient
	broadcast  chan *SignalingMessage
	mu         sync.RWMutex
}

// NewSignalingHub creates a new signaling hub
func NewSignalingHub() *SignalingHub {
	return &SignalingHub{
		clients:    make(map[string]*SignalingClient),
		rooms:      make(map[string]*SignalingRoom),
		register:   make(chan *SignalingClient),
		unregister: make(chan *SignalingClient),
		broadcast:  make(chan *SignalingMessage, 256),
	}
}

// Run starts the signaling hub
func (h *SignalingHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.PeerID] = client
			h.mu.Unlock()
			log.Printf("[SIGNALING] Client registered: %s", client.PeerID[:16])

			// Notify room peers if in a room
			if client.Room != "" {
				h.notifyRoomJoin(client)
			}

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.PeerID]; ok {
				delete(h.clients, client.PeerID)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("[SIGNALING] Client unregistered: %s", client.PeerID[:16])

			// Notify room peers if in a room
			if client.Room != "" {
				h.notifyRoomLeave(client)
			}

		case msg := <-h.broadcast:
			h.routeMessage(msg)
		}
	}
}

// routeMessage routes a signaling message to the appropriate recipient(s)
func (h *SignalingHub) routeMessage(msg *SignalingMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	// If target specified, send directly
	if msg.To != "" {
		if client, ok := h.clients[msg.To]; ok {
			data, _ := json.Marshal(msg)
			select {
			case client.Send <- data:
			default:
				log.Printf("[SIGNALING] Failed to send to %s (buffer full)", msg.To[:16])
			}
		}
		return
	}

	// If room specified, broadcast to room
	if msg.Room != "" {
		if room, ok := h.rooms[msg.Room]; ok {
			room.mu.RLock()
			for peerID, client := range room.Peers {
				if peerID != msg.From {
					data, _ := json.Marshal(msg)
					select {
					case client.Send <- data:
					default:
					}
				}
			}
			room.mu.RUnlock()
		}
		return
	}

	// Broadcast to all (except sender)
	for peerID, client := range h.clients {
		if peerID != msg.From {
			data, _ := json.Marshal(msg)
			select {
			case client.Send <- data:
			default:
			}
		}
	}
}

// notifyRoomJoin notifies room peers that a new peer joined
func (h *SignalingHub) notifyRoomJoin(client *SignalingClient) {
	room, ok := h.rooms[client.Room]
	if !ok {
		room = &SignalingRoom{
			ID:      client.Room,
			Peers:   make(map[string]*SignalingClient),
			Created: time.Now(),
		}
		h.rooms[client.Room] = room
	}

	room.mu.Lock()
	// Notify existing peers
	for peerID, peer := range room.Peers {
		if peerID != client.PeerID {
			msg := &SignalingMessage{
				Type: "peer_joined",
				From: client.PeerID,
				Room: client.Room,
			}
			data, _ := json.Marshal(msg)
			select {
			case peer.Send <- data:
			default:
			}
		}
	}
	room.Peers[client.PeerID] = client
	room.mu.Unlock()

	log.Printf("[SIGNALING] Peer %s joined room %s", client.PeerID[:16], client.Room)
}

// notifyRoomLeave notifies room peers that a peer left
func (h *SignalingHub) notifyRoomLeave(client *SignalingClient) {
	room, ok := h.rooms[client.Room]
	if !ok {
		return
	}

	room.mu.Lock()
	delete(room.Peers, client.PeerID)
	
	// Notify remaining peers
	for _, peer := range room.Peers {
		msg := &SignalingMessage{
			Type: "peer_left",
			From: client.PeerID,
			Room: client.Room,
		}
		data, _ := json.Marshal(msg)
		select {
		case peer.Send <- data:
		default:
		}
	}
	room.mu.Unlock()

	// Clean up empty rooms
	if len(room.Peers) == 0 {
		h.mu.Lock()
		delete(h.rooms, client.Room)
		h.mu.Unlock()
	}

	log.Printf("[SIGNALING] Peer %s left room %s", client.PeerID[:16], client.Room)
}

// GetRoomPeers returns the list of peers in a room
func (h *SignalingHub) GetRoomPeers(roomID string) []string {
	h.mu.RLock()
	room, ok := h.rooms[roomID]
	h.mu.RUnlock()

	if !ok {
		return []string{}
	}

	room.mu.RLock()
	defer room.mu.RUnlock()

	peers := make([]string, 0, len(room.Peers))
	for peerID := range room.Peers {
		peers = append(peers, peerID)
	}
	return peers
}

// ============================================================================
// Client Read/Write Pumps
// ============================================================================

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 65536
)

// readPump pumps messages from the websocket connection to the hub
func (c *SignalingClient) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[SIGNALING] Read error: %v", err)
			}
			break
		}

		var msg SignalingMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("[SIGNALING] Invalid message: %v", err)
			continue
		}

		// Set sender
		msg.From = c.PeerID

		// Handle special message types
		switch msg.Type {
		case "join":
			// Extract room from payload
			var payload struct {
				Room string `json:"room"`
			}
			if err := json.Unmarshal(msg.Payload, &payload); err == nil && payload.Room != "" {
				c.Room = payload.Room
				c.hub.notifyRoomJoin(c)
			}
		case "leave":
			if c.Room != "" {
				c.hub.notifyRoomLeave(c)
				c.Room = ""
			}
		default:
			// Route message through hub
			c.hub.broadcast <- &msg
		}
	}
}

// writePump pumps messages from the hub to the websocket connection
func (c *SignalingClient) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Batch queued messages
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ============================================================================
// HTTP Handler for WebSocket Signaling
// ============================================================================

var signalingUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for P2P
	},
}

// HandleSignalingWebSocket handles WebSocket connections for WebRTC signaling
func HandleSignalingWebSocket(hub *SignalingHub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get peer ID from query params
		peerID := r.URL.Query().Get("peer_id")
		if peerID == "" {
			http.Error(w, "peer_id is required", http.StatusBadRequest)
			return
		}

		// Get optional room
		room := r.URL.Query().Get("room")

		// Upgrade connection
		conn, err := signalingUpgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("[SIGNALING] Upgrade error: %v", err)
			return
		}

		// Create client
		client := &SignalingClient{
			PeerID: peerID,
			Conn:   conn,
			Room:   room,
			Send:   make(chan []byte, 256),
			hub:    hub,
		}

		// Register client
		hub.register <- client

		// Start pumps
		go client.writePump()
		go client.readPump()

		log.Printf("[SIGNALING] Client connected: %s (room: %s)", peerID[:16], room)
	}
}

// GetSignalingStats returns statistics about the signaling hub
func (h *SignalingHub) GetStats() map[string]interface{} {
	h.mu.RLock()
	defer h.mu.RUnlock()

	roomStats := make(map[string]int)
	for roomID, room := range h.rooms {
		room.mu.RLock()
		roomStats[roomID] = len(room.Peers)
		room.mu.RUnlock()
	}

	return map[string]interface{}{
		"total_clients": len(h.clients),
		"total_rooms":   len(h.rooms),
		"rooms":         roomStats,
	}
}
