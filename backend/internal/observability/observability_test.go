package observability

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// ========================================
// LOGGER TESTS
// ========================================

func TestNewLogger(t *testing.T) {
	logger := NewLogger()
	assert.NotNil(t, logger)
}

func TestLogger_WithRequestID(t *testing.T) {
	logger := NewLogger().WithRequestID("req-123")
	assert.Equal(t, "req-123", logger.requestID)
}

func TestLogger_WithAppID(t *testing.T) {
	logger := NewLogger().WithAppID("app-456")
	assert.Equal(t, "app-456", logger.appID)
}

func TestLogger_Chaining(t *testing.T) {
	logger := NewLogger().WithRequestID("req-123").WithAppID("app-456")
	assert.Equal(t, "req-123", logger.requestID)
	assert.Equal(t, "app-456", logger.appID)
}

func TestLogEntry_JSONMarshal(t *testing.T) {
	entry := LogEntry{
		Level:     LevelInfo,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Message:   "test message",
		RequestID: "req-123",
		AppID:     "app-456",
		EventType: "user.created",
		Fields: map[string]interface{}{
			"user_id": "user-789",
		},
	}

	data, err := json.Marshal(entry)
	assert.NoError(t, err)
	assert.Contains(t, string(data), "test message")
	assert.Contains(t, string(data), "req-123")
	assert.Contains(t, string(data), "info")
}

func TestLogEntry_WithError(t *testing.T) {
	entry := LogEntry{
		Level:     LevelError,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Message:   "error occurred",
		Error:     "something went wrong",
	}

	data, err := json.Marshal(entry)
	assert.NoError(t, err)
	assert.Contains(t, string(data), "something went wrong")
}

func TestLogLevel_Values(t *testing.T) {
	assert.Equal(t, LogLevel("debug"), LevelDebug)
	assert.Equal(t, LogLevel("info"), LevelInfo)
	assert.Equal(t, LogLevel("warn"), LevelWarn)
	assert.Equal(t, LogLevel("error"), LevelError)
}

// ========================================
// METRICS TESTS
// ========================================

func TestGetMetrics(t *testing.T) {
	m := GetMetrics()
	assert.NotNil(t, m)
}

func TestIncrementAuditEvents(t *testing.T) {
	initial := atomic.LoadInt64(&metrics.AuditEventsTotal)
	IncrementAuditEvents()
	after := atomic.LoadInt64(&metrics.AuditEventsTotal)
	assert.Equal(t, initial+1, after)
}

func TestIncrementAppEvents(t *testing.T) {
	initial := atomic.LoadInt64(&metrics.AppEventsTotal)
	IncrementAppEvents()
	after := atomic.LoadInt64(&metrics.AppEventsTotal)
	assert.Equal(t, initial+1, after)
}

func TestIncrementAppEventsFailed(t *testing.T) {
	initial := atomic.LoadInt64(&metrics.AppEventsFailedTotal)
	IncrementAppEventsFailed()
	after := atomic.LoadInt64(&metrics.AppEventsFailedTotal)
	assert.Equal(t, initial+1, after)
}

func TestIncrementRequests(t *testing.T) {
	initial := atomic.LoadInt64(&metrics.RequestsTotal)
	IncrementRequests()
	after := atomic.LoadInt64(&metrics.RequestsTotal)
	assert.Equal(t, initial+1, after)
}

func TestIncrementErrors(t *testing.T) {
	initial := atomic.LoadInt64(&metrics.ErrorsTotal)
	IncrementErrors()
	after := atomic.LoadInt64(&metrics.ErrorsTotal)
	assert.Equal(t, initial+1, after)
}

func TestMetrics_Snapshot(t *testing.T) {
	m := GetMetrics()
	snapshot := m.Snapshot()

	assert.GreaterOrEqual(t, snapshot.AuditEventsTotal, int64(0))
	assert.GreaterOrEqual(t, snapshot.AppEventsTotal, int64(0))
	assert.GreaterOrEqual(t, snapshot.RequestsTotal, int64(0))
	assert.GreaterOrEqual(t, snapshot.UptimeSeconds, int64(0))
}

func TestMetricsSnapshot_JSONMarshal(t *testing.T) {
	snapshot := MetricsSnapshot{
		AuditEventsTotal:     100,
		AppEventsTotal:       50,
		AppEventsFailedTotal: 5,
		RequestsTotal:        1000,
		ErrorsTotal:          10,
		UptimeSeconds:        3600,
	}

	data, err := json.Marshal(snapshot)
	assert.NoError(t, err)
	assert.Contains(t, string(data), "audit_events_total")
	assert.Contains(t, string(data), "1000")
}

func TestMetrics_Concurrent(t *testing.T) {
	var wg sync.WaitGroup
	iterations := 100

	for i := 0; i < iterations; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			IncrementRequests()
		}()
	}

	wg.Wait()
	// Não verificamos valor exato pois outros testes podem ter incrementado
	assert.GreaterOrEqual(t, atomic.LoadInt64(&metrics.RequestsTotal), int64(iterations))
}

// ========================================
// MIDDLEWARE TESTS
// ========================================

func TestRequestIDMiddleware_GeneratesID(t *testing.T) {
	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.GET("/test", func(c *gin.Context) {
		requestID := GetRequestID(c)
		c.JSON(http.StatusOK, gin.H{"request_id": requestID})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.NotEmpty(t, w.Header().Get(RequestIDHeader))
}

func TestRequestIDMiddleware_PropagatesID(t *testing.T) {
	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.GET("/test", func(c *gin.Context) {
		requestID := GetRequestID(c)
		c.JSON(http.StatusOK, gin.H{"request_id": requestID})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set(RequestIDHeader, "existing-request-id")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "existing-request-id", w.Header().Get(RequestIDHeader))
}

func TestMetricsMiddleware_CountsRequests(t *testing.T) {
	initial := atomic.LoadInt64(&metrics.RequestsTotal)

	router := gin.New()
	router.Use(MetricsMiddleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	after := atomic.LoadInt64(&metrics.RequestsTotal)
	assert.Equal(t, initial+1, after)
}

func TestMetricsMiddleware_CountsErrors(t *testing.T) {
	initial := atomic.LoadInt64(&metrics.ErrorsTotal)

	router := gin.New()
	router.Use(MetricsMiddleware())
	router.GET("/error", func(c *gin.Context) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "test"})
	})

	req := httptest.NewRequest(http.MethodGet, "/error", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	after := atomic.LoadInt64(&metrics.ErrorsTotal)
	assert.Equal(t, initial+1, after)
}

func TestMetricsMiddleware_Counts4xxAsErrors(t *testing.T) {
	initial := atomic.LoadInt64(&metrics.ErrorsTotal)

	router := gin.New()
	router.Use(MetricsMiddleware())
	router.GET("/notfound", func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
	})

	req := httptest.NewRequest(http.MethodGet, "/notfound", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	after := atomic.LoadInt64(&metrics.ErrorsTotal)
	assert.Equal(t, initial+1, after)
}

func TestLoggingMiddleware(t *testing.T) {
	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.Use(LoggingMiddleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetRequestID_FromContext(t *testing.T) {
	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.GET("/test", func(c *gin.Context) {
		requestID := GetRequestID(c)
		assert.NotEmpty(t, requestID)
		c.JSON(http.StatusOK, gin.H{"request_id": requestID})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetRequestID_Empty(t *testing.T) {
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	requestID := GetRequestID(c)
	assert.Empty(t, requestID)
}

// ========================================
// CONSTANTS TESTS
// ========================================

func TestConstants(t *testing.T) {
	assert.Equal(t, "X-Request-ID", RequestIDHeader)
	assert.Equal(t, "request_id", RequestIDKey)
}

// ========================================
// INTEGRATION TESTS
// ========================================

func TestFullMiddlewareStack(t *testing.T) {
	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.Use(MetricsMiddleware())
	router.Use(LoggingMiddleware())

	router.GET("/api/test", func(c *gin.Context) {
		requestID := GetRequestID(c)
		c.JSON(http.StatusOK, gin.H{
			"request_id": requestID,
			"message":    "success",
		})
	})

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.NotEmpty(t, w.Header().Get(RequestIDHeader))

	var response map[string]string
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.NotEmpty(t, response["request_id"])
}
