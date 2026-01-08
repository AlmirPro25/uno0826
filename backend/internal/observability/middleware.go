package observability

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// MIDDLEWARE - Fase 22
// "Request ID + Metrics + Logging"
// ========================================

const RequestIDHeader = "X-Request-ID"
const RequestIDKey = "request_id"

// RequestIDMiddleware generates or propagates request_id
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if request_id exists in header
		requestID := c.GetHeader(RequestIDHeader)
		if requestID == "" {
			requestID = uuid.New().String()
		}

		// Set in context and response header
		c.Set(RequestIDKey, requestID)
		c.Header(RequestIDHeader, requestID)

		c.Next()
	}
}

// MetricsMiddleware counts requests and errors
func MetricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		IncrementRequests()

		c.Next()

		// Count errors (4xx and 5xx)
		if c.Writer.Status() >= 400 {
			IncrementErrors()
		}
	}
}

// LoggingMiddleware logs requests with structured format
func LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		// Get request_id from context
		requestID, _ := c.Get(RequestIDKey)
		reqIDStr, _ := requestID.(string)

		// Log request
		LogRequest(
			reqIDStr,
			c.Request.Method,
			c.Request.URL.Path,
			c.Writer.Status(),
			time.Since(start),
		)
	}
}

// GetRequestID extracts request_id from context
func GetRequestID(c *gin.Context) string {
	if requestID, exists := c.Get(RequestIDKey); exists {
		if str, ok := requestID.(string); ok {
			return str
		}
	}
	return ""
}
