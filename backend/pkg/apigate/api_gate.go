// Package apigate implements FASE 2 of ESCALA MODE
// "Toda requisição passa por um pedágio armado"
//
// Responsibilities:
// - Payload size limits (hard limits)
// - Schema validation (structural validation)
// - Cheap fail (reject early, save resources)
// - Input sanitization (prevent injection)
// - Zero-trust intra-app validation
package apigate

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// ========================================
// CONFIGURATION
// ========================================

// GateConfig holds API Gate configuration
type GateConfig struct {
	// Global limits
	MaxBodySize       int64 // Default max body size in bytes
	MaxJSONDepth      int   // Max nesting depth for JSON
	MaxArrayLength    int   // Max array elements
	MaxStringLength   int   // Max string field length
	MaxFieldCount     int   // Max fields in JSON object
	
	// Timeouts
	ReadTimeout       time.Duration
	ValidationTimeout time.Duration
	
	// Features
	EnableSanitization bool
	EnableSchemaCheck  bool
	StrictMode         bool // Reject unknown fields
	
	// Endpoint-specific limits (path pattern -> limit)
	EndpointLimits map[string]int64
}

// DefaultConfig returns production-ready defaults
func DefaultConfig() *GateConfig {
	return &GateConfig{
		MaxBodySize:        1 * 1024 * 1024,  // 1MB default
		MaxJSONDepth:       10,                // Prevent deeply nested attacks
		MaxArrayLength:     1000,              // Prevent array bombs
		MaxStringLength:    100000,            // 100KB per string
		MaxFieldCount:      100,               // Prevent field explosion
		ReadTimeout:        10 * time.Second,
		ValidationTimeout:  5 * time.Second,
		EnableSanitization: true,
		EnableSchemaCheck:  true,
		StrictMode:         false,
		EndpointLimits: map[string]int64{
			"/auth/":     10 * 1024,      // 10KB for auth
			"/billing/":  50 * 1024,      // 50KB for billing
			"/webhooks/": 100 * 1024,     // 100KB for webhooks
			"/upload/":   10 * 1024 * 1024, // 10MB for uploads
			"/telemetry/": 500 * 1024,    // 500KB for telemetry batches
		},
	}
}

// ========================================
// API GATE CORE
// ========================================

// APIGate is the main gate controller
type APIGate struct {
	config    *GateConfig
	validator *RequestValidator
	sanitizer *InputSanitizer
	metrics   *GateMetrics
	mu        sync.RWMutex
}

// GateMetrics tracks gate statistics
type GateMetrics struct {
	TotalRequests     int64
	BlockedRequests   int64
	SanitizedRequests int64
	ValidationErrors  int64
	PayloadOversize   int64
	mu                sync.Mutex
}

// NewAPIGate creates a new API Gate instance
func NewAPIGate(config *GateConfig) *APIGate {
	if config == nil {
		config = DefaultConfig()
	}
	
	return &APIGate{
		config:    config,
		validator: NewRequestValidator(config),
		sanitizer: NewInputSanitizer(),
		metrics:   &GateMetrics{},
	}
}

// GateMiddleware returns the main Gin middleware
func (g *APIGate) GateMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		g.metrics.mu.Lock()
		g.metrics.TotalRequests++
		g.metrics.mu.Unlock()

		// 1. Check payload size FIRST (cheapest check)
		if err := g.checkPayloadSize(c); err != nil {
			g.rejectRequest(c, http.StatusRequestEntityTooLarge, "PAYLOAD_TOO_LARGE", err.Error())
			return
		}

		// 2. Read and validate body (if present)
		if c.Request.Body != nil && c.Request.ContentLength > 0 {
			body, err := g.readAndValidateBody(c)
			if err != nil {
				g.rejectRequest(c, http.StatusBadRequest, "INVALID_BODY", err.Error())
				return
			}
			
			// Replace body for downstream handlers
			c.Request.Body = io.NopCloser(bytes.NewBuffer(body))
			
			// Store validated body in context
			c.Set("validated_body", body)
		}

		// 3. Validate headers
		if err := g.validateHeaders(c); err != nil {
			g.rejectRequest(c, http.StatusBadRequest, "INVALID_HEADERS", err.Error())
			return
		}

		// 4. Validate query parameters
		if err := g.validateQueryParams(c); err != nil {
			g.rejectRequest(c, http.StatusBadRequest, "INVALID_QUERY", err.Error())
			return
		}

		// Continue to next handler
		c.Next()
	}
}

// ========================================
// PAYLOAD SIZE CHECK (CHEAP FAIL)
// ========================================

func (g *APIGate) checkPayloadSize(c *gin.Context) error {
	contentLength := c.Request.ContentLength
	
	// No body = OK
	if contentLength <= 0 {
		return nil
	}
	
	// Check endpoint-specific limits first
	path := c.Request.URL.Path
	for pattern, limit := range g.config.EndpointLimits {
		if strings.Contains(path, pattern) {
			if contentLength > limit {
				g.metrics.mu.Lock()
				g.metrics.PayloadOversize++
				g.metrics.mu.Unlock()
				return fmt.Errorf("payload size %d exceeds limit %d for %s", contentLength, limit, pattern)
			}
			return nil
		}
	}
	
	// Check global limit
	if contentLength > g.config.MaxBodySize {
		g.metrics.mu.Lock()
		g.metrics.PayloadOversize++
		g.metrics.mu.Unlock()
		return fmt.Errorf("payload size %d exceeds global limit %d", contentLength, g.config.MaxBodySize)
	}
	
	return nil
}

// ========================================
// BODY VALIDATION
// ========================================

func (g *APIGate) readAndValidateBody(c *gin.Context) ([]byte, error) {
	// Read body with limit
	maxSize := g.getMaxSizeForPath(c.Request.URL.Path)
	limitedReader := io.LimitReader(c.Request.Body, maxSize+1)
	
	body, err := io.ReadAll(limitedReader)
	if err != nil {
		return nil, fmt.Errorf("failed to read body: %w", err)
	}
	
	// Double-check size (in case Content-Length was wrong)
	if int64(len(body)) > maxSize {
		g.metrics.mu.Lock()
		g.metrics.PayloadOversize++
		g.metrics.mu.Unlock()
		return nil, fmt.Errorf("actual body size exceeds limit")
	}
	
	// Validate JSON structure if Content-Type is JSON
	contentType := c.GetHeader("Content-Type")
	if strings.Contains(contentType, "application/json") && len(body) > 0 {
		if err := g.validateJSON(body); err != nil {
			g.metrics.mu.Lock()
			g.metrics.ValidationErrors++
			g.metrics.mu.Unlock()
			return nil, err
		}
		
		// Sanitize if enabled
		if g.config.EnableSanitization {
			sanitized, changed := g.sanitizer.SanitizeJSON(body)
			if changed {
				g.metrics.mu.Lock()
				g.metrics.SanitizedRequests++
				g.metrics.mu.Unlock()
			}
			body = sanitized
		}
	}
	
	return body, nil
}

func (g *APIGate) validateJSON(body []byte) error {
	// Check if valid JSON
	var raw interface{}
	decoder := json.NewDecoder(bytes.NewReader(body))
	decoder.UseNumber() // Prevent float64 overflow
	
	if err := decoder.Decode(&raw); err != nil {
		return fmt.Errorf("invalid JSON: %w", err)
	}
	
	// Validate structure
	return g.validator.ValidateStructure(raw, 0)
}

func (g *APIGate) getMaxSizeForPath(path string) int64 {
	for pattern, limit := range g.config.EndpointLimits {
		if strings.Contains(path, pattern) {
			return limit
		}
	}
	return g.config.MaxBodySize
}

// ========================================
// HEADER VALIDATION
// ========================================

func (g *APIGate) validateHeaders(c *gin.Context) error {
	// Check for suspicious headers
	suspiciousPatterns := []string{
		"<script",
		"javascript:",
		"data:",
		"vbscript:",
		"onload=",
		"onerror=",
	}
	
	for key, values := range c.Request.Header {
		for _, value := range values {
			lowerValue := strings.ToLower(value)
			for _, pattern := range suspiciousPatterns {
				if strings.Contains(lowerValue, pattern) {
					return fmt.Errorf("suspicious header value in %s", key)
				}
			}
			
			// Check header length
			if len(value) > 8192 { // 8KB per header
				return fmt.Errorf("header %s too long", key)
			}
		}
	}
	
	// Validate Content-Type for POST/PUT/PATCH
	method := c.Request.Method
	if method == "POST" || method == "PUT" || method == "PATCH" {
		contentType := c.GetHeader("Content-Type")
		if c.Request.ContentLength > 0 && contentType == "" {
			return fmt.Errorf("Content-Type required for %s with body", method)
		}
	}
	
	return nil
}

// ========================================
// QUERY PARAMETER VALIDATION
// ========================================

func (g *APIGate) validateQueryParams(c *gin.Context) error {
	query := c.Request.URL.Query()
	
	// Check total query string length
	rawQuery := c.Request.URL.RawQuery
	if len(rawQuery) > 4096 { // 4KB max query string
		return fmt.Errorf("query string too long")
	}
	
	// Check each parameter
	for key, values := range query {
		// Check key length
		if len(key) > 100 {
			return fmt.Errorf("query parameter name too long: %s", key[:50])
		}
		
		// Check number of values
		if len(values) > 10 {
			return fmt.Errorf("too many values for parameter: %s", key)
		}
		
		for _, value := range values {
			// Check value length
			if len(value) > 2000 {
				return fmt.Errorf("query parameter value too long: %s", key)
			}
			
			// Check for injection patterns
			if g.config.EnableSanitization {
				if g.sanitizer.ContainsSQLInjection(value) {
					return fmt.Errorf("potential SQL injection in parameter: %s", key)
				}
				if g.sanitizer.ContainsXSS(value) {
					return fmt.Errorf("potential XSS in parameter: %s", key)
				}
			}
		}
	}
	
	return nil
}

// ========================================
// REJECTION HANDLER
// ========================================

func (g *APIGate) rejectRequest(c *gin.Context, status int, code, message string) {
	g.metrics.mu.Lock()
	g.metrics.BlockedRequests++
	g.metrics.mu.Unlock()

	// Record block for attack detection
	clientIP := c.ClientIP()
	path := c.Request.URL.Path
	
	// Notify alerting system (non-blocking)
	go func() {
		if blockNotifier != nil {
			blockNotifier(code, clientIP, path, map[string]string{
				"status":  fmt.Sprintf("%d", status),
				"message": message,
			})
		}
	}()
	
	c.AbortWithStatusJSON(status, gin.H{
		"error":     code,
		"message":   message,
		"blocked":   true,
		"gate":      "api_gate",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// BlockNotifier is a function that gets called when a request is blocked
type BlockNotifier func(reason, clientIP, path string, details map[string]string)

var blockNotifier BlockNotifier

// SetBlockNotifier sets the function to call when requests are blocked
// This allows alerting integration without circular imports
func SetBlockNotifier(notifier BlockNotifier) {
	blockNotifier = notifier
}

// ========================================
// METRICS
// ========================================

// GetMetrics returns current gate metrics
func (g *APIGate) GetMetrics() map[string]interface{} {
	g.metrics.mu.Lock()
	defer g.metrics.mu.Unlock()
	
	blockRate := float64(0)
	if g.metrics.TotalRequests > 0 {
		blockRate = float64(g.metrics.BlockedRequests) / float64(g.metrics.TotalRequests) * 100
	}
	
	return map[string]interface{}{
		"total_requests":     g.metrics.TotalRequests,
		"blocked_requests":   g.metrics.BlockedRequests,
		"sanitized_requests": g.metrics.SanitizedRequests,
		"validation_errors":  g.metrics.ValidationErrors,
		"payload_oversize":   g.metrics.PayloadOversize,
		"block_rate_percent": blockRate,
	}
}

// ResetMetrics resets all metrics (for testing)
func (g *APIGate) ResetMetrics() {
	g.metrics.mu.Lock()
	defer g.metrics.mu.Unlock()
	
	g.metrics.TotalRequests = 0
	g.metrics.BlockedRequests = 0
	g.metrics.SanitizedRequests = 0
	g.metrics.ValidationErrors = 0
	g.metrics.PayloadOversize = 0
}
