
package rest

import (
	"manifest-architect/backend/internal/api/middleware"
	"manifest-architect/backend/internal/api/streaming"
	"manifest-architect/backend/internal/core/services"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes sets up all API endpoints for the Gin router.
func RegisterRoutes(router *gin.Engine, fleetService *services.FleetService, commandService *services.CommandService, streamingHub *streaming.Hub) {
	// API Group
	v1 := router.Group("/api/v1")

	//
