// Package performance provides performance optimizations for PROST-QS
// "Menos bytes = mais rápido. Sempre."
package performance

import (
	"compress/gzip"
	"io"
	"net/http"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
)

// GzipResponseWriter wraps gin.ResponseWriter with gzip compression
type GzipResponseWriter struct {
	gin.ResponseWriter
	writer *gzip.Writer
}

func (g *GzipResponseWriter) Write(data []byte) (int, error) {
	return g.writer.Write(data)
}

func (g *GzipResponseWriter) WriteString(s string) (int, error) {
	return g.writer.Write([]byte(s))
}

// Pool of gzip writers for reuse
var gzipWriterPool = sync.Pool{
	New: func() interface{} {
		w, _ := gzip.NewWriterLevel(io.Discard, gzip.BestSpeed)
		return w
	},
}

// GzipMiddleware compresses responses with gzip
// "JSON comprime muito bem. Use isso."
func GzipMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if client accepts gzip
		if !strings.Contains(c.GetHeader("Accept-Encoding"), "gzip") {
			c.Next()
			return
		}
		
		// Skip for small responses or non-compressible content
		// WebSocket, SSE, and streaming responses should not be compressed
		if c.GetHeader("Upgrade") != "" {
			c.Next()
			return
		}
		
		// Get gzip writer from pool
		gz := gzipWriterPool.Get().(*gzip.Writer)
		gz.Reset(c.Writer)
		
		c.Header("Content-Encoding", "gzip")
		c.Header("Vary", "Accept-Encoding")
		
		c.Writer = &GzipResponseWriter{
			ResponseWriter: c.Writer,
			writer:         gz,
		}
		
		defer func() {
			gz.Close()
			gzipWriterPool.Put(gz)
		}()
		
		c.Next()
	}
}

// MinSizeGzipMiddleware only compresses responses larger than minSize
func MinSizeGzipMiddleware(minSize int) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !strings.Contains(c.GetHeader("Accept-Encoding"), "gzip") {
			c.Next()
			return
		}
		
		// Use buffered writer to check size
		bw := &bufferedResponseWriter{
			ResponseWriter: c.Writer,
			buffer:         make([]byte, 0, minSize),
			minSize:        minSize,
		}
		c.Writer = bw
		
		c.Next()
		
		// Flush any remaining buffered content
		bw.Flush()
	}
}

type bufferedResponseWriter struct {
	gin.ResponseWriter
	buffer     []byte
	minSize    int
	gzipWriter *gzip.Writer
	compressed bool
}

func (b *bufferedResponseWriter) Write(data []byte) (int, error) {
	if b.compressed {
		return b.gzipWriter.Write(data)
	}
	
	b.buffer = append(b.buffer, data...)
	
	if len(b.buffer) >= b.minSize {
		// Start compression
		b.compressed = true
		b.Header().Set("Content-Encoding", "gzip")
		b.Header().Set("Vary", "Accept-Encoding")
		
		gz := gzipWriterPool.Get().(*gzip.Writer)
		gz.Reset(b.ResponseWriter)
		b.gzipWriter = gz
		
		return gz.Write(b.buffer)
	}
	
	return len(data), nil
}

func (b *bufferedResponseWriter) Flush() {
	if b.compressed && b.gzipWriter != nil {
		b.gzipWriter.Close()
		gzipWriterPool.Put(b.gzipWriter)
	} else if len(b.buffer) > 0 {
		b.ResponseWriter.Write(b.buffer)
	}
}

// ========================================
// RESPONSE OPTIMIZATION
// ========================================

// NoSniffMiddleware prevents MIME type sniffing
func NoSniffMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Next()
	}
}

// CacheControlMiddleware sets cache headers for static content
func CacheControlMiddleware(maxAge int) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only for GET requests
		if c.Request.Method == http.MethodGet {
			c.Header("Cache-Control", "public, max-age="+string(rune(maxAge)))
		}
		c.Next()
	}
}

// NoCacheMiddleware prevents caching for sensitive endpoints
func NoCacheMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")
		c.Next()
	}
}
