package middleware

import (
	"log"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

// Recovery returns a middleware that recovers from panics
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// Log the stack trace
				log.Printf("[PANIC RECOVERY] %v\n%s", err, debug.Stack())

				// In production, don't expose stack trace
				response := APIResponse{
					Success: false,
					Error: &ErrorInfo{
						Code:    "INTERNAL_ERROR",
						Message: "Ocorreu um erro inesperado. Por favor, tente novamente.",
					},
				}

				// In development, include more details
				if gin.Mode() != gin.ReleaseMode {
					response.Error.Details = string(debug.Stack())
				}

				c.AbortWithStatusJSON(http.StatusInternalServerError, response)
			}
		}()
		c.Next()
	}
}
