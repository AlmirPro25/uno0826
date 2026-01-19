package health

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func setupHealthTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	return db
}

// MockJobService implementa JobServiceInterface para testes
type MockJobService struct {
	pending    int64
	failed     int64
	processing int64
}

func (m *MockJobService) GetStats() (pending int64, failed int64, processing int64) {
	return m.pending, m.failed, m.processing
}

// ========================================
// HEALTH HANDLER TESTS
// ========================================

func TestHealthHandler_GetHealth_Healthy(t *testing.T) {
	db := setupHealthTestDB(t)
	jobService := &MockJobService{pending: 5, failed: 0, processing: 2}
	handler := NewHealthHandler(db, jobService, nil)

	router := gin.New()
	router.GET("/health", handler.GetHealth)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response HealthResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "healthy", response.Status)
	assert.Equal(t, "healthy", response.Services["database"])
}

func TestHealthHandler_GetHealth_WithFailedJobs(t *testing.T) {
	db := setupHealthTestDB(t)
	jobService := &MockJobService{pending: 5, failed: 15, processing: 2}
	handler := NewHealthHandler(db, jobService, nil)

	router := gin.New()
	router.GET("/health", handler.GetHealth)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response HealthResponse
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "degraded", response.Status)
	assert.Equal(t, "warning", response.Jobs.Status)
}

func TestHealthHandler_GetHealth_CriticalJobs(t *testing.T) {
	db := setupHealthTestDB(t)
	jobService := &MockJobService{pending: 5, failed: 60, processing: 2}
	handler := NewHealthHandler(db, jobService, nil)

	router := gin.New()
	router.GET("/health", handler.GetHealth)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusServiceUnavailable, w.Code)

	var response HealthResponse
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "unhealthy", response.Status)
	assert.Equal(t, "critical", response.Jobs.Status)
}

func TestHealthHandler_GetHealth_NilJobService(t *testing.T) {
	db := setupHealthTestDB(t)
	handler := NewHealthHandler(db, nil, nil)

	router := gin.New()
	router.GET("/health", handler.GetHealth)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response HealthResponse
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "unknown", response.Jobs.Status)
}

func TestHealthHandler_GetHealthSimple_Healthy(t *testing.T) {
	db := setupHealthTestDB(t)
	handler := NewHealthHandler(db, nil, nil)

	router := gin.New()
	router.GET("/health/live", handler.GetHealthSimple)

	req := httptest.NewRequest(http.MethodGet, "/health/live", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "ok")
}

// ========================================
// VERSION INFO TESTS
// ========================================

func TestHealthHandler_VersionInfo(t *testing.T) {
	db := setupHealthTestDB(t)
	handler := NewHealthHandler(db, nil, nil)

	router := gin.New()
	router.GET("/health", handler.GetHealth)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var response HealthResponse
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.NotEmpty(t, response.Version.Version)
	assert.NotEmpty(t, response.Version.BuildTime)
	assert.NotEmpty(t, response.Version.GitCommit)
}

// ========================================
// SYSTEM INFO TESTS
// ========================================

func TestHealthHandler_SystemInfo(t *testing.T) {
	db := setupHealthTestDB(t)
	handler := NewHealthHandler(db, nil, nil)

	router := gin.New()
	router.GET("/health", handler.GetHealth)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var response HealthResponse
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.NotEmpty(t, response.System.GoVersion)
	assert.Greater(t, response.System.NumGoroutine, 0)
	assert.Greater(t, response.System.NumCPU, 0)
}

// ========================================
// FORMAT DURATION TESTS
// ========================================

func TestFormatDuration_Minutes(t *testing.T) {
	d := 30 * time.Minute
	result := formatDuration(d)
	assert.Equal(t, "30m", result)
}

func TestFormatDuration_Hours(t *testing.T) {
	d := 2*time.Hour + 15*time.Minute
	result := formatDuration(d)
	assert.Equal(t, "2h 15m", result)
}

func TestFormatDuration_Days(t *testing.T) {
	d := 3*24*time.Hour + 5*time.Hour + 30*time.Minute
	result := formatDuration(d)
	assert.Equal(t, "3d 5h 30m", result)
}

func TestFormatDuration_Zero(t *testing.T) {
	d := 0 * time.Second
	result := formatDuration(d)
	assert.Equal(t, "0m", result)
}

// ========================================
// SERVICES STATUS TESTS
// ========================================

func TestHealthHandler_ServicesStatus(t *testing.T) {
	db := setupHealthTestDB(t)
	jobService := &MockJobService{pending: 0, failed: 0, processing: 0}
	handler := NewHealthHandler(db, jobService, nil)

	router := gin.New()
	router.GET("/health", handler.GetHealth)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var response HealthResponse
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Equal(t, "healthy", response.Services["auth"])
	assert.Equal(t, "healthy", response.Services["billing"])
	assert.Equal(t, "healthy", response.Services["policy_engine"])
}

// ========================================
// JOBS HEALTH TESTS
// ========================================

func TestJobsHealth_Struct(t *testing.T) {
	jobs := JobsHealth{
		Pending:    10,
		Failed:     2,
		Processing: 5,
		Status:     "healthy",
	}

	assert.Equal(t, int64(10), jobs.Pending)
	assert.Equal(t, int64(2), jobs.Failed)
	assert.Equal(t, int64(5), jobs.Processing)
	assert.Equal(t, "healthy", jobs.Status)
}

// ========================================
// UPTIME TESTS
// ========================================

func TestHealthHandler_Uptime(t *testing.T) {
	db := setupHealthTestDB(t)
	handler := NewHealthHandler(db, nil, nil)

	router := gin.New()
	router.GET("/health", handler.GetHealth)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var response HealthResponse
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.NotEmpty(t, response.Uptime)
	assert.NotEmpty(t, response.Timestamp)
}

// ========================================
// ROUTE REGISTRATION TESTS
// ========================================

func TestRegisterHealthRoutes(t *testing.T) {
	db := setupHealthTestDB(t)
	handler := NewHealthHandler(db, nil, nil)

	router := gin.New()
	group := router.Group("/api")
	RegisterHealthRoutes(group, handler)

	// Test /health
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Test /health/live
	req = httptest.NewRequest(http.MethodGet, "/api/health/live", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Test /health/ready
	req = httptest.NewRequest(http.MethodGet, "/api/health/ready", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

// ========================================
// RESPONSE STRUCTURE TESTS
// ========================================

func TestHealthResponse_JSONStructure(t *testing.T) {
	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Uptime:    "1h 30m",
		Version: VersionInfo{
			Version:   "1.0.0",
			BuildTime: "2024-12-28",
			GitCommit: "abc123",
		},
		Services: map[string]string{
			"database": "healthy",
			"auth":     "healthy",
		},
		Jobs: JobsHealth{
			Pending:    5,
			Failed:     0,
			Processing: 2,
			Status:     "healthy",
		},
		System: SystemInfo{
			GoVersion:    "go1.21",
			NumGoroutine: 10,
			NumCPU:       4,
			MemoryMB:     50,
		},
	}

	data, err := json.Marshal(response)
	assert.NoError(t, err)

	var parsed HealthResponse
	err = json.Unmarshal(data, &parsed)
	assert.NoError(t, err)
	assert.Equal(t, response.Status, parsed.Status)
	assert.Equal(t, response.Version.Version, parsed.Version.Version)
}
