package warobs

import (
	"time"

	"github.com/gin-gonic/gin"
)

// ========================================
// WAR OBSERVABILITY MIDDLEWARE
// "Cada request é uma oportunidade de aprender"
// ========================================

// WarObsMiddleware creates the war observability middleware
func WarObsMiddleware(obs *WarObservability) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		
		// Get or create trace
		traceID := c.GetHeader("X-Trace-ID")
		if traceID == "" {
			traceID = c.GetHeader("X-Request-ID")
		}
		if traceID == "" {
			traceID = generateTraceID()
		}
		
		// Set trace context
		c.Set("trace_id", traceID)
		c.Header("X-Trace-ID", traceID)
		
		// Create span for this request
		span := obs.Tracer.StartSpan(traceID, "http_request", map[string]string{
			"method":   c.Request.Method,
			"path":     c.Request.URL.Path,
			"endpoint": normalizeEndpoint(c.Request.URL.Path),
		})
		
		// Process request
		c.Next()
		
		// Calculate duration
		duration := time.Since(start)
		statusCode := c.Writer.Status()
		
		// End span
		span.End(statusCode >= 400)
		
		// Record RED metrics
		endpoint := normalizeEndpoint(c.Request.URL.Path)
		obs.RED.Record(endpoint, duration, statusCode)
		
		// Update SLOs periodically (every 100 requests)
		if obs.RED.GetGlobalStats().TotalRequests%100 == 0 {
			obs.SLO.UpdateFromMetrics()
		}
	}
}

// normalizeEndpoint normalizes URL paths for grouping
// /api/v1/users/123 -> /api/v1/users/:id
func normalizeEndpoint(path string) string {
	// Simple normalization - replace UUIDs and numbers with placeholders
	result := path
	
	// This is a simplified version - in production you'd use regex
	// For now, just return the path as-is
	// A more sophisticated version would:
	// - Replace UUIDs with :id
	// - Replace numeric IDs with :id
	// - Group similar paths
	
	return result
}

// generateTraceID generates a unique trace ID
func generateTraceID() string {
	// Simple implementation - in production use UUID or similar
	return time.Now().Format("20060102150405.000000000")
}

// GetTraceID extracts trace ID from context
func GetTraceID(c *gin.Context) string {
	if traceID, exists := c.Get("trace_id"); exists {
		if str, ok := traceID.(string); ok {
			return str
		}
	}
	return ""
}
