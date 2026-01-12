// Package warobs implements FASE 3 - War Observability
// "Ver o sistema respirar, medir pressão, detectar guerra antes do colapso"
package warobs

import (
	"sync"
	"sync/atomic"
	"time"
)

// ========================================
// RED METRICS
// Rate, Errors, Duration - The Golden Signals
// ========================================

// REDMetrics tracks Rate, Errors, Duration per endpoint
type REDMetrics struct {
	endpoints map[string]*EndpointMetrics
	mu        sync.RWMutex
	
	// Global counters
	totalRequests int64
	totalErrors   int64
	
	// Time windows for rate calculation
	windowSize    time.Duration
	windowBuckets int
}

// EndpointMetrics holds metrics for a single endpoint
type EndpointMetrics struct {
	// Rate (requests per second)
	requestCount int64
	
	// Errors
	errorCount   int64
	error4xx     int64
	error5xx     int64
	
	// Duration (latency)
	totalDuration int64 // nanoseconds
	minDuration   int64
	maxDuration   int64
	
	// Sliding window for rate calculation
	windowCounts []int64
	windowIndex  int
	windowMu     sync.Mutex
	
	// Last update
	lastUpdate time.Time
}

// NewREDMetrics creates a new RED metrics collector
func NewREDMetrics() *REDMetrics {
	return &REDMetrics{
		endpoints:     make(map[string]*EndpointMetrics),
		windowSize:    time.Minute,
		windowBuckets: 60, // 1 second buckets
	}
}

// Record records a request for an endpoint
func (r *REDMetrics) Record(endpoint string, duration time.Duration, statusCode int) {
	r.mu.Lock()
	em, exists := r.endpoints[endpoint]
	if !exists {
		em = &EndpointMetrics{
			windowCounts: make([]int64, r.windowBuckets),
			minDuration:  int64(duration),
			maxDuration:  int64(duration),
		}
		r.endpoints[endpoint] = em
	}
	r.mu.Unlock()

	// Update counters atomically
	atomic.AddInt64(&em.requestCount, 1)
	atomic.AddInt64(&r.totalRequests, 1)
	
	// Duration
	durationNs := int64(duration)
	atomic.AddInt64(&em.totalDuration, durationNs)
	
	// Update min/max (not perfectly atomic but good enough)
	if durationNs < atomic.LoadInt64(&em.minDuration) || atomic.LoadInt64(&em.minDuration) == 0 {
		atomic.StoreInt64(&em.minDuration, durationNs)
	}
	if durationNs > atomic.LoadInt64(&em.maxDuration) {
		atomic.StoreInt64(&em.maxDuration, durationNs)
	}
	
	// Errors
	if statusCode >= 400 {
		atomic.AddInt64(&em.errorCount, 1)
		atomic.AddInt64(&r.totalErrors, 1)
		
		if statusCode >= 500 {
			atomic.AddInt64(&em.error5xx, 1)
		} else {
			atomic.AddInt64(&em.error4xx, 1)
		}
	}
	
	em.lastUpdate = time.Now()
}


// GetEndpointStats returns stats for a specific endpoint
func (r *REDMetrics) GetEndpointStats(endpoint string) *EndpointStats {
	r.mu.RLock()
	em, exists := r.endpoints[endpoint]
	r.mu.RUnlock()
	
	if !exists {
		return nil
	}
	
	reqCount := atomic.LoadInt64(&em.requestCount)
	errCount := atomic.LoadInt64(&em.errorCount)
	totalDur := atomic.LoadInt64(&em.totalDuration)
	
	var avgDuration time.Duration
	var errorRate float64
	
	if reqCount > 0 {
		avgDuration = time.Duration(totalDur / reqCount)
		errorRate = float64(errCount) / float64(reqCount) * 100
	}
	
	return &EndpointStats{
		Endpoint:       endpoint,
		RequestCount:   reqCount,
		ErrorCount:     errCount,
		Error4xx:       atomic.LoadInt64(&em.error4xx),
		Error5xx:       atomic.LoadInt64(&em.error5xx),
		ErrorRate:      errorRate,
		AvgDuration:    avgDuration,
		MinDuration:    time.Duration(atomic.LoadInt64(&em.minDuration)),
		MaxDuration:    time.Duration(atomic.LoadInt64(&em.maxDuration)),
		LastUpdate:     em.lastUpdate,
	}
}

// GetAllStats returns stats for all endpoints
func (r *REDMetrics) GetAllStats() map[string]*EndpointStats {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	result := make(map[string]*EndpointStats)
	for endpoint := range r.endpoints {
		result[endpoint] = r.GetEndpointStats(endpoint)
	}
	return result
}

// GetGlobalStats returns global statistics
func (r *REDMetrics) GetGlobalStats() *GlobalStats {
	total := atomic.LoadInt64(&r.totalRequests)
	errors := atomic.LoadInt64(&r.totalErrors)
	
	var errorRate float64
	if total > 0 {
		errorRate = float64(errors) / float64(total) * 100
	}
	
	return &GlobalStats{
		TotalRequests: total,
		TotalErrors:   errors,
		ErrorRate:     errorRate,
		EndpointCount: len(r.endpoints),
	}
}

// EndpointStats holds computed stats for an endpoint
type EndpointStats struct {
	Endpoint     string        `json:"endpoint"`
	RequestCount int64         `json:"request_count"`
	ErrorCount   int64         `json:"error_count"`
	Error4xx     int64         `json:"error_4xx"`
	Error5xx     int64         `json:"error_5xx"`
	ErrorRate    float64       `json:"error_rate_percent"`
	AvgDuration  time.Duration `json:"avg_duration"`
	MinDuration  time.Duration `json:"min_duration"`
	MaxDuration  time.Duration `json:"max_duration"`
	LastUpdate   time.Time     `json:"last_update"`
}

// GlobalStats holds global statistics
type GlobalStats struct {
	TotalRequests int64   `json:"total_requests"`
	TotalErrors   int64   `json:"total_errors"`
	ErrorRate     float64 `json:"error_rate_percent"`
	EndpointCount int     `json:"endpoint_count"`
}

// GetTopEndpoints returns top N endpoints by request count
func (r *REDMetrics) GetTopEndpoints(n int) []*EndpointStats {
	all := r.GetAllStats()
	
	// Convert to slice
	stats := make([]*EndpointStats, 0, len(all))
	for _, s := range all {
		stats = append(stats, s)
	}
	
	// Sort by request count (simple bubble sort for small N)
	for i := 0; i < len(stats)-1; i++ {
		for j := i + 1; j < len(stats); j++ {
			if stats[j].RequestCount > stats[i].RequestCount {
				stats[i], stats[j] = stats[j], stats[i]
			}
		}
	}
	
	if n > len(stats) {
		n = len(stats)
	}
	return stats[:n]
}

// GetSlowestEndpoints returns top N endpoints by avg duration
func (r *REDMetrics) GetSlowestEndpoints(n int) []*EndpointStats {
	all := r.GetAllStats()
	
	stats := make([]*EndpointStats, 0, len(all))
	for _, s := range all {
		stats = append(stats, s)
	}
	
	// Sort by avg duration
	for i := 0; i < len(stats)-1; i++ {
		for j := i + 1; j < len(stats); j++ {
			if stats[j].AvgDuration > stats[i].AvgDuration {
				stats[i], stats[j] = stats[j], stats[i]
			}
		}
	}
	
	if n > len(stats) {
		n = len(stats)
	}
	return stats[:n]
}

// GetErrorEndpoints returns endpoints with error rate above threshold
func (r *REDMetrics) GetErrorEndpoints(threshold float64) []*EndpointStats {
	all := r.GetAllStats()
	
	result := make([]*EndpointStats, 0)
	for _, s := range all {
		if s.ErrorRate > threshold && s.RequestCount > 10 { // Min 10 requests
			result = append(result, s)
		}
	}
	return result
}

// Reset resets all metrics (for testing)
func (r *REDMetrics) Reset() {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.endpoints = make(map[string]*EndpointMetrics)
	atomic.StoreInt64(&r.totalRequests, 0)
	atomic.StoreInt64(&r.totalErrors, 0)
}
