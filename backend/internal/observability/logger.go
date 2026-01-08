package observability

import (
	"encoding/json"
	"fmt"
	"os"
	"time"
)

// ========================================
// STRUCTURED LOGGER - Fase 22
// "JSON logs com campos obrigatórios"
// ========================================

type LogLevel string

const (
	LevelDebug LogLevel = "debug"
	LevelInfo  LogLevel = "info"
	LevelWarn  LogLevel = "warn"
	LevelError LogLevel = "error"
)

type LogEntry struct {
	Level     LogLevel               `json:"level"`
	Timestamp string                 `json:"ts"`
	Message   string                 `json:"msg"`
	RequestID string                 `json:"request_id,omitempty"`
	AppID     string                 `json:"app_id,omitempty"`
	EventType string                 `json:"event_type,omitempty"`
	Error     string                 `json:"error,omitempty"`
	Fields    map[string]interface{} `json:"fields,omitempty"`
}

// Logger provides structured logging
type Logger struct {
	requestID string
	appID     string
}

// NewLogger creates a new logger instance
func NewLogger() *Logger {
	return &Logger{}
}

// WithRequestID returns a logger with request_id set
func (l *Logger) WithRequestID(requestID string) *Logger {
	return &Logger{
		requestID: requestID,
		appID:     l.appID,
	}
}

// WithAppID returns a logger with app_id set
func (l *Logger) WithAppID(appID string) *Logger {
	return &Logger{
		requestID: l.requestID,
		appID:     appID,
	}
}

// log writes a structured log entry
func (l *Logger) log(level LogLevel, msg string, fields map[string]interface{}, err error) {
	entry := LogEntry{
		Level:     level,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Message:   msg,
		RequestID: l.requestID,
		AppID:     l.appID,
		Fields:    fields,
	}

	if err != nil {
		entry.Error = err.Error()
	}

	// Extract event_type from fields if present
	if fields != nil {
		if et, ok := fields["event_type"].(string); ok {
			entry.EventType = et
			delete(fields, "event_type")
		}
	}

	// Remove empty fields map
	if len(entry.Fields) == 0 {
		entry.Fields = nil
	}

	data, _ := json.Marshal(entry)
	fmt.Fprintln(os.Stdout, string(data))
}

// Debug logs at debug level
func (l *Logger) Debug(msg string, fields map[string]interface{}) {
	l.log(LevelDebug, msg, fields, nil)
}

// Info logs at info level
func (l *Logger) Info(msg string, fields map[string]interface{}) {
	l.log(LevelInfo, msg, fields, nil)
}

// Warn logs at warn level
func (l *Logger) Warn(msg string, fields map[string]interface{}) {
	l.log(LevelWarn, msg, fields, nil)
}

// Error logs at error level with error
func (l *Logger) Error(msg string, err error, fields map[string]interface{}) {
	l.log(LevelError, msg, fields, err)
}

// ========================================
// CONVENIENCE FUNCTIONS
// ========================================

// Global logger instance
var defaultLogger = NewLogger()

// Log functions using default logger
func Debug(msg string, fields map[string]interface{}) {
	defaultLogger.Debug(msg, fields)
}

func Info(msg string, fields map[string]interface{}) {
	defaultLogger.Info(msg, fields)
}

func Warn(msg string, fields map[string]interface{}) {
	defaultLogger.Warn(msg, fields)
}

func Error(msg string, err error, fields map[string]interface{}) {
	defaultLogger.Error(msg, err, fields)
}

// LogAppEvent logs an app event with proper structure
func LogAppEvent(requestID, appID, eventType string, success bool) {
	logger := NewLogger().WithRequestID(requestID).WithAppID(appID)
	
	if success {
		logger.Info("app event received", map[string]interface{}{
			"event_type": eventType,
		})
	} else {
		logger.Warn("app event failed", map[string]interface{}{
			"event_type": eventType,
		})
	}
}

// LogRequest logs an HTTP request
func LogRequest(requestID, method, path string, status int, duration time.Duration) {
	logger := NewLogger().WithRequestID(requestID)
	
	fields := map[string]interface{}{
		"method":      method,
		"path":        path,
		"status":      status,
		"duration_ms": duration.Milliseconds(),
	}
	
	if status >= 500 {
		logger.Error("request failed", nil, fields)
	} else if status >= 400 {
		logger.Warn("request error", fields)
	} else {
		logger.Info("request completed", fields)
	}
}
