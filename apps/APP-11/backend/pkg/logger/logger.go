
package logger

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// Logger is a global logger instance.
type Logger struct {
	*zap.Logger
}

// NewLogger creates a new configured Zap logger.
func NewLogger() *Logger {
	// For production, use zap.NewProduction()
	// For development, use zap.NewDevelopment() or custom config
	config := zap.NewDevelopmentConfig()
	config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder // Colored output for dev
	logger, _ := config.Build()
	return &Logger{logger}
}

// LoggerMiddleware returns a Chi middleware that logs HTTP requests.
func LoggerMiddleware(log *Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

			next.ServeHTTP(ww, r)

			log.Info("Request completed",
				zap.String("request_id", middleware.Get =RequestID(r.Context())),
				zap.String("method", r.Method),
				zap.String("path", r.URL.Path),
				zap.String("ip", r.RemoteAddr),
				zap.String("user_agent", r.UserAgent()),
				zap.Int("status", ww.Status()),
				zap.Int("bytes", ww.BytesWritten()),
				zap.Duration("duration", time.Since(start)),
			)
		})
	}
}
