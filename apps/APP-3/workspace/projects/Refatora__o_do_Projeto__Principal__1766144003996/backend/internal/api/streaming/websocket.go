
package streaming

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"manifest-architect/backend/internal/adapters/redis"
	"manifest-architect/backend/internal/core/domain"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Hub maintains the set of active clients and broadcasts messages to them.
type Hub struct {
	redisClient *redis.Client
	clients     map[*websocket.Conn]bool
	mutex       sync.Mutex
	lastData    []domain.AgvStatus // Last known snapshot to send on new connection
}

// NewHub initializes a new Hub instance.
func NewHub(redisClient *redis.Client) *Hub {
	return &Hub{
		redisClient: redisClient,
		clients:     make(map[*websocket.Conn]bool),
		lastData:    make([]domain.AgvStatus, 0),
	}
}

// HandleConnections upgrades HTTP connection to WebSocket and adds client to hub.
func (h *Hub) HandleConnections(c *gin.Context) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins for simplicity in example
		},
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[WebSocket] Upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	h.mutex.Lock()
	h.clients[conn] = true
	h.mutex.Unlock()

	log.Printf("[WebSocket] New client connected. Total clients: %d", len(h.clients))

	// Send initial snapshot to new client (Priority 3)
	h.sendInitialSnapshot(conn)

	// Keep connection open; read loop to handle disconnection events.
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			log.Printf("[WebSocket] Client disconnected: %v", err)
			break
		}
	}

	h.mutex.Lock()
	delete(h.clients, conn)
	h.mutex.Unlock()
}

// Run starts the data streaming loop.
// This function polls Redis for updates to the Digital Twin hot state.
func (h *Hub) Run() {
	// Polling interval for hot state updates. High-frequency updates from Redis are pushed to WebSockets.
	ticker := time.NewTicker(200 * time.Millisecond) // 5 updates per second (matching AGV update frequency)
	defer ticker.Stop()

	for range ticker.C {
		// Fetch all AGV statuses from Redis hot cache
		statuses, err := h.redisClient.GetAllAgvStatuses()
		if err != nil {
			log.Printf("[WebSocket] Failed to fetch AGV statuses from Redis: %v", err)
			continue
		}

		// Update last known data snapshot
		h.lastData = statuses

		// Broadcast updates to all connected clients
		h.broadcast(statuses)
	}
}

// broadcast sends the latest AGV statuses to all connected clients.
func (h *Hub) broadcast(data []domain.AgvStatus) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	for client := range h.clients {
		if err := client.WriteJSON(data); err != nil {
			log.Printf("[WebSocket] Error broadcasting to client: %v", err)
			client.Close()
			delete(h.clients, client)
		}
	}
}

// sendInitialSnapshot sends the current state to a newly connected client.
func (h *Hub) sendInitialSnapshot(client *websocket.Conn) {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	if err := client.WriteJSON(h.lastData); err != nil {
		log.Printf("[WebSocket] Error sending initial snapshot to client: %v", err)
		client.Close()
		delete(h.clients, client)
	}
}
