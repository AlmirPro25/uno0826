package warobs

import (
	"sync"
	"time"
)

// ========================================
// DISTRIBUTED TRACING
// "Seguir uma requisição através do sistema"
// ========================================

// Tracer provides distributed tracing capabilities
type Tracer struct {
	traces map[string]*Trace
	mu     sync.RWMutex
	
	// Configuration
	maxTraces    int
	traceTimeout time.Duration
}

// Trace represents a distributed trace
type Trace struct {
	TraceID   string    `json:"trace_id"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time,omitempty"`
	Duration  int64     `json:"duration_ms,omitempty"`
	Spans     []*Span   `json:"spans"`
	Status    string    `json:"status"` // active, completed, error
	mu        sync.Mutex
}

// Span represents a single operation within a trace
type Span struct {
	SpanID    string            `json:"span_id"`
	TraceID   string            `json:"trace_id"`
	ParentID  string            `json:"parent_id,omitempty"`
	Name      string            `json:"name"`
	StartTime time.Time         `json:"start_time"`
	EndTime   time.Time         `json:"end_time,omitempty"`
	Duration  int64             `json:"duration_ms,omitempty"`
	Tags      map[string]string `json:"tags,omitempty"`
	Status    string            `json:"status"` // active, ok, error
	Error     string            `json:"error,omitempty"`
}

// NewTracer creates a new tracer
func NewTracer() *Tracer {
	return &Tracer{
		traces:       make(map[string]*Trace),
		maxTraces:    10000,
		traceTimeout: 5 * time.Minute,
	}
}

// StartSpan starts a new span
func (t *Tracer) StartSpan(traceID, name string, tags map[string]string) *Span {
	t.mu.Lock()
	
	// Get or create trace
	trace, exists := t.traces[traceID]
	if !exists {
		trace = &Trace{
			TraceID:   traceID,
			StartTime: time.Now(),
			Spans:     make([]*Span, 0),
			Status:    "active",
		}
		t.traces[traceID] = trace
		
		// Cleanup old traces if needed
		if len(t.traces) > t.maxTraces {
			t.cleanupOldTraces()
		}
	}
	t.mu.Unlock()
	
	// Create span
	span := &Span{
		SpanID:    generateSpanID(),
		TraceID:   traceID,
		Name:      name,
		StartTime: time.Now(),
		Tags:      tags,
		Status:    "active",
	}
	
	// Add span to trace
	trace.mu.Lock()
	trace.Spans = append(trace.Spans, span)
	trace.mu.Unlock()
	
	return span
}

// End ends a span
func (s *Span) End(hasError bool) {
	s.EndTime = time.Now()
	s.Duration = s.EndTime.Sub(s.StartTime).Milliseconds()
	
	if hasError {
		s.Status = "error"
	} else {
		s.Status = "ok"
	}
}

// SetError sets an error on the span
func (s *Span) SetError(err string) {
	s.Error = err
	s.Status = "error"
}

// AddTag adds a tag to the span
func (s *Span) AddTag(key, value string) {
	if s.Tags == nil {
		s.Tags = make(map[string]string)
	}
	s.Tags[key] = value
}

// GetTrace returns a trace by ID
func (t *Tracer) GetTrace(traceID string) *Trace {
	t.mu.RLock()
	defer t.mu.RUnlock()
	return t.traces[traceID]
}

// GetRecentTraces returns recent traces
func (t *Tracer) GetRecentTraces(limit int) []*Trace {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	traces := make([]*Trace, 0, limit)
	count := 0
	
	for _, trace := range t.traces {
		if count >= limit {
			break
		}
		traces = append(traces, trace)
		count++
	}
	
	return traces
}

// GetErrorTraces returns traces with errors
func (t *Tracer) GetErrorTraces(limit int) []*Trace {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	traces := make([]*Trace, 0)
	
	for _, trace := range t.traces {
		hasError := false
		for _, span := range trace.Spans {
			if span.Status == "error" {
				hasError = true
				break
			}
		}
		if hasError {
			traces = append(traces, trace)
			if len(traces) >= limit {
				break
			}
		}
	}
	
	return traces
}

// GetSlowTraces returns traces slower than threshold
func (t *Tracer) GetSlowTraces(threshold time.Duration, limit int) []*Trace {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	traces := make([]*Trace, 0)
	thresholdMs := threshold.Milliseconds()
	
	for _, trace := range t.traces {
		if trace.Duration > thresholdMs {
			traces = append(traces, trace)
			if len(traces) >= limit {
				break
			}
		}
	}
	
	return traces
}

// CompleteTrace marks a trace as completed
func (t *Tracer) CompleteTrace(traceID string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	
	if trace, exists := t.traces[traceID]; exists {
		trace.EndTime = time.Now()
		trace.Duration = trace.EndTime.Sub(trace.StartTime).Milliseconds()
		
		// Check if any span has error
		hasError := false
		for _, span := range trace.Spans {
			if span.Status == "error" {
				hasError = true
				break
			}
		}
		
		if hasError {
			trace.Status = "error"
		} else {
			trace.Status = "completed"
		}
	}
}

// cleanupOldTraces removes traces older than timeout
func (t *Tracer) cleanupOldTraces() {
	cutoff := time.Now().Add(-t.traceTimeout)
	
	for id, trace := range t.traces {
		if trace.StartTime.Before(cutoff) {
			delete(t.traces, id)
		}
	}
}

// GetStats returns tracer statistics
func (t *Tracer) GetStats() *TracerStats {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	stats := &TracerStats{
		TotalTraces: len(t.traces),
	}
	
	for _, trace := range t.traces {
		switch trace.Status {
		case "active":
			stats.ActiveTraces++
		case "completed":
			stats.CompletedTraces++
		case "error":
			stats.ErrorTraces++
		}
		stats.TotalSpans += len(trace.Spans)
	}
	
	return stats
}

// TracerStats holds tracer statistics
type TracerStats struct {
	TotalTraces     int `json:"total_traces"`
	ActiveTraces    int `json:"active_traces"`
	CompletedTraces int `json:"completed_traces"`
	ErrorTraces     int `json:"error_traces"`
	TotalSpans      int `json:"total_spans"`
}

// generateSpanID generates a unique span ID
func generateSpanID() string {
	return time.Now().Format("150405.000000000")
}
