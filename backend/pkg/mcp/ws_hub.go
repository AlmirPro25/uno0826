package mcp

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// ========================================
// WEBSOCKET AUDIT HUB
// "O Kernel fala, todos ouvem"
// ========================================

// AuditHub manages WebSocket connections for real-time audit streaming.
type AuditHub struct {
	clients    map[*websocket.Conn]bool
	broadcast  chan *KernelEvent
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	mu         sync.RWMutex
}

// NewAuditHub creates a new hub.
func NewAuditHub() *AuditHub {
	return &AuditHub{
		clients:    make(map[*websocket.Conn]bool),
		broadcast:  make(chan *KernelEvent, 256), // Buffered to prevent blocking
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
	}
}

// Run starts the hub's main loop (call this once with `go hub.Run()`).
func (h *AuditHub) Run() {
	for {
		select {
		case conn := <-h.register:
			h.mu.Lock()
			h.clients[conn] = true
			h.mu.Unlock()
			log.Printf("[AuditHub] Client connected. Total: %d", len(h.clients))

		case conn := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[conn]; ok {
				delete(h.clients, conn)
				conn.Close()
			}
			h.mu.Unlock()
			log.Printf("[AuditHub] Client disconnected. Total: %d", len(h.clients))

		case event := <-h.broadcast:
			h.mu.RLock()
			payload, err := json.Marshal(event)
			if err != nil {
				log.Printf("[AuditHub] Marshal error: %v", err)
				h.mu.RUnlock()
				continue
			}
			for conn := range h.clients {
				err := conn.WriteMessage(websocket.TextMessage, payload)
				if err != nil {
					log.Printf("[AuditHub] Write error: %v", err)
					conn.Close()
					delete(h.clients, conn)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Register adds a new connection to the hub.
func (h *AuditHub) Register(conn *websocket.Conn) {
	h.register <- conn
}

// Unregister removes a connection from the hub.
func (h *AuditHub) Unregister(conn *websocket.Conn) {
	h.unregister <- conn
}

// Broadcast sends an event to all connected clients.
func (h *AuditHub) Broadcast(event *KernelEvent) {
	select {
	case h.broadcast <- event:
		// Sent successfully
	default:
		// Buffer full, drop event (log this in production)
		log.Println("[AuditHub] Warning: Broadcast buffer full, dropping event")
	}
}

// ClientCount returns current connected clients.
func (h *AuditHub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
