
package main

import (
	"log"
	"os"

	"manifest-architect/backend/internal/adapters/redis"
	"manifest-architect/backend/internal/api/rest"
	"manifest-architect/backend/internal/api/streaming"
	"manifest-architect/backend/internal/core/domain"
	"manifest-architect/backend/internal/core/services"
	"manifest-architect/backend/internal/repositories"

	"github.com/gin-gonic/gin"
	"github.com/paho-client/paho.mqtt.golang"
	"github.com/rs/cors"
)

// main function for the REST API and WebSocket Streaming Service (api-service)
func main() {
	log.Println("Initializing MANIFEST-ARCHITECT API Service...")

	// 1. Initialize Adapters and Services
	// Redis Client (Hot State Cache)
	redisClient, err := redis.NewRedisClient("redis:6379", "")
	if err != nil {
		log.Fatalf("Failed to initialize Redis client: %v", err)
	}

	// Mockup MQTT Client for sending commands (frontend -> API -> MQTT)
	// In a full implementation, this client would be configured to connect to the MQTT broker.
	// We use it here to simulate sending commands back to the AGVs.
	mqttCommandPublisher := services.NewMqttCommandPublisher(mqtt.NewClientOptions())

	// Data Store Repositories (for metadata and command logs)
	// Note: High frequency data (telemetry) is NOT stored here, but in InfluxDB (queried by heuristics engine).
	agvRepository := repositories.NewInMemoryAgvMetadataRepository() // Using in-memory for simplicity in this exercise

	// Core Business Services
	fleetService := services.NewFleetService(agvRepository, redisClient)
	commandService := services.NewCommandService(agvRepository, redisClient, mqttCommandPublisher)

	// 2. Setup REST API with Gin
	gin.SetMode(gin.ReleaseMode) // Production mode
	router := gin.New()
	router.Use(gin.Recovery())

	// CORS configuration (Priority 4 for Industrial Accessibility)
	corsConfig := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // Allow all origins for simplicity in example
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	})
	router.Use(func(c *gin.Context) {
		corsConfig.HandlerFunc(c.Writer, c.Request)
		c.Next()
	})

	// 3. Setup WebSocket Server (Priority 2, 4)
	websocketHub := streaming.NewHub(redisClient) // Initializes hub with Redis connection
	go websocketHub.Run()

	// 4. Register REST API Routes (Priority 3)
	rest.RegisterRoutes(router, fleetService, commandService, websocketHub)

	// 5. Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port for API service
	}

	log.Printf("Starting API service on :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

//
