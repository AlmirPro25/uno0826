package performance

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

// GracefulServer wraps http.Server with graceful shutdown support
// "Zero downtime deploys. Sempre."
type GracefulServer struct {
	server          *http.Server
	shutdownTimeout time.Duration
	onShutdown      []func()
}

// NewGracefulServer creates a new graceful server
func NewGracefulServer(addr string, handler http.Handler, shutdownTimeout time.Duration) *GracefulServer {
	return &GracefulServer{
		server: &http.Server{
			Addr:         addr,
			Handler:      handler,
			ReadTimeout:  30 * time.Second,
			WriteTimeout: 30 * time.Second,
			IdleTimeout:  120 * time.Second,
		},
		shutdownTimeout: shutdownTimeout,
		onShutdown:      make([]func(), 0),
	}
}

// OnShutdown registers a function to be called during shutdown
func (s *GracefulServer) OnShutdown(fn func()) {
	s.onShutdown = append(s.onShutdown, fn)
}

// ListenAndServe starts the server with graceful shutdown
func (s *GracefulServer) ListenAndServe() error {
	// Channel to listen for interrupt signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	
	// Start server in goroutine
	go func() {
		log.Printf("🚀 Server starting on %s", s.server.Addr)
		if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()
	
	// Wait for interrupt signal
	<-quit
	log.Println("🛑 Shutdown signal received, starting graceful shutdown...")
	
	// Create context with timeout for shutdown
	ctx, cancel := context.WithTimeout(context.Background(), s.shutdownTimeout)
	defer cancel()
	
	// Run shutdown hooks
	for _, fn := range s.onShutdown {
		fn()
	}
	
	// Shutdown server
	if err := s.server.Shutdown(ctx); err != nil {
		log.Printf("⚠️  Server forced to shutdown: %v", err)
		return err
	}
	
	log.Println("✅ Server gracefully stopped")
	return nil
}

// ========================================
// HEALTH CHECK FOR LOAD BALANCERS
// ========================================

// HealthState tracks server health for load balancers
type HealthState struct {
	ready    bool
	draining bool
}

var healthState = &HealthState{ready: false, draining: false}

// SetReady marks the server as ready to receive traffic
func SetReady() {
	healthState.ready = true
	log.Println("✅ Server marked as READY")
}

// SetDraining marks the server as draining (no new connections)
func SetDraining() {
	healthState.draining = true
	log.Println("⚠️  Server marked as DRAINING")
}

// IsReady returns true if server is ready
func IsReady() bool {
	return healthState.ready && !healthState.draining
}

// ReadinessMiddleware returns 503 if server is not ready
// "Load balancer precisa saber quando parar de enviar tráfego"
func ReadinessMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !IsReady() {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
				"status":  "unavailable",
				"message": "Server is not ready to accept traffic",
			})
			return
		}
		c.Next()
	}
}

// LivenessHandler returns server liveness status
func LivenessHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "alive",
		})
	}
}

// ReadinessHandler returns server readiness status
func ReadinessHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		if IsReady() {
			c.JSON(http.StatusOK, gin.H{
				"status": "ready",
			})
		} else {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status":   "not_ready",
				"draining": healthState.draining,
			})
		}
	}
}

// ========================================
// CONNECTION DRAINING
// ========================================

// DrainMiddleware tracks active connections for graceful shutdown
type DrainMiddleware struct {
	activeConnections int64
	maxWait           time.Duration
}

// NewDrainMiddleware creates a new drain middleware
func NewDrainMiddleware(maxWait time.Duration) *DrainMiddleware {
	return &DrainMiddleware{
		maxWait: maxWait,
	}
}

// Middleware returns the gin middleware
func (d *DrainMiddleware) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Increment active connections
		// In production, use atomic operations
		d.activeConnections++
		
		defer func() {
			d.activeConnections--
		}()
		
		c.Next()
	}
}

// WaitForDrain waits for all connections to complete
func (d *DrainMiddleware) WaitForDrain() {
	start := time.Now()
	for d.activeConnections > 0 {
		if time.Since(start) > d.maxWait {
			log.Printf("⚠️  Drain timeout: %d connections still active", d.activeConnections)
			return
		}
		time.Sleep(100 * time.Millisecond)
	}
	log.Println("✅ All connections drained")
}

// ActiveConnections returns the number of active connections
func (d *DrainMiddleware) ActiveConnections() int64 {
	return d.activeConnections
}
